// Ficha de ejercicio: cómo hacerlo, errores comunes, historial, cambiar por otro.
import * as api from '../api.js';
import { h, sheet, toast, ask, ICON, tag } from '../ui.js';
import { EX, EQUIPMENT, PATTERN_LABEL, ytLink } from '../exercises.js';
import { alternatives, swapExercise } from '../planner.js';
import { history } from '../coach.js';
import { fmtShort, fmtKg } from '../util.js';

const LEVEL = ['', 'Principiante', 'Intermedio', 'Avanzado'];
const equipLabel = (id) => EQUIPMENT.find((e) => e.id === id)?.label || id;

export function presc(b) {
  if (!b) return '';
  const base = b.secs ? `${b.sets} × ${b.secs} s` : `${b.sets} × ${b.reps[0] === b.reps[1] ? b.reps[0] : b.reps.join('–')}`;
  return `${base}${b.uni ? ' por lado' : ''} · descanso ${b.rest} s`;
}

export function openExercise(exId, { block, dayId, onSwap } = {}) {
  const e = EX[exId];
  const hist = history(api.S.logs, exId, 2);

  const swapRow = block && dayId && h('div', { class: 'stack s2' },
    h('button', { class: 'btn soft', onclick: () => pickAlternative(exId, dayId, onSwap, s) }, h('span', { html: ICON.swap }), 'Cambiar por otro ejercicio'),
    h('button', { class: 'btn ghost small', style: { width: '100%' }, onclick: () => flagAvoid(exId, dayId, onSwap, s) }, 'Me molesta o no me gusta este ejercicio'));

  const body = h('div', { class: 'stack s3' },
    h('div', { class: 'chips' },
      tag(PATTERN_LABEL[e.pattern], 'acc'), tag(LEVEL[e.level] || ''),
      e.equip.length ? e.equip.map((t) => tag(equipLabel(t))) : tag('Sin equipo'),
      e.uni && tag('Un lado a la vez')),
    h('div', null, h('span', { class: 'up' }, 'Músculos'), h('div', { class: 'chips', style: { marginTop: '6px' } }, e.muscles.map((m) => tag(m)))),
    block && h('div', { class: 'banner good' }, h('span', { class: 'bi' }, '🎯'), h('div', null, h('b', null, 'Tu meta'), presc(block))),
    h('div', null, h('h3', { class: 'h3', style: { marginBottom: '10px' } }, 'Cómo se hace'),
      h('ol', { class: 'step-list' }, e.steps.map((t) => h('li', null, h('span', null, t))))),
    e.tips?.length ? h('div', null, h('h3', { class: 'h3', style: { marginBottom: '8px' } }, 'Consejos'), h('ul', { class: 'tips' }, e.tips.map((t) => h('li', null, t)))) : null,
    hist.length ? h('div', null, h('h3', { class: 'h3', style: { marginBottom: '8px' } }, 'Tus últimas veces'),
      hist.map((x) => h('div', { class: 'pb' }, h('span', { class: 'muted' }, fmtShort(x.date)),
        h('b', null, x.sets.map((st) => (st.weight ? `${fmtKg(+st.weight)}kg×${st.reps}` : e.mode === 'time' ? `${st.secs ?? st.reps}s` : `${st.reps}`)).join('  ·  '))))) : null,
    h('a', { class: 'btn soft', href: ytLink(e), target: '_blank', rel: 'noopener' }, h('span', { html: ICON.video }), 'Ver video de la técnica'),
    swapRow);
  const s = sheet(e.name, body);
  return s;
}

function pickAlternative(exId, dayId, onSwap, parent) {
  const plan = api.S.plan, a = api.S.profile.assessment;
  const alts = alternatives(plan, dayId, exId, a, api.S.prefs);
  const list = alts.length
    ? h('div', { class: 'stack s2' }, alts.map((x) => h('button', { class: 'choice', onclick: () => { apply(exId, x.id, dayId, onSwap); s.close(); parent?.close(); } },
      h('div', null, h('b', null, x.name), h('span', { class: 'd' }, x.muscles.join(' · '))))))
    : h('p', { class: 'muted' }, 'No encontré alternativas con tu equipo y tus molestias. Puedes ampliar tu equipo en el Perfil.');
  const s = sheet('Elige un reemplazo', list);
}

function apply(oldId, newId, dayId, onSwap) {
  const plan = structuredClone(api.S.plan);
  swapExercise(plan, dayId, oldId, newId, api.S.profile.assessment);
  api.savePlan(plan, 'swap');
  onSwap?.(newId);
  toast(`Cambiado por ${EX[newId].name}`);
}

async function flagAvoid(exId, dayId, onSwap, parent) {
  const ok = await ask({ title: '¿No quieres este ejercicio?', text: 'Lo quito de tu rutina y no volveré a proponértelo.', ok: 'Sí, quitarlo' });
  if (!ok) return;
  api.setPref(exId, 'avoid');
  const alts = alternatives(api.S.plan, dayId, exId, api.S.profile.assessment, api.S.prefs);
  if (alts.length) apply(exId, alts[0].id, dayId, onSwap);
  else toast('Anotado. No volverá a aparecer en nuevas rutinas.');
  parent?.close();
}
