import * as api from '../api.js';
import { h, fill, ICON, tag, toast, ask } from '../ui.js';
import { EX } from '../exercises.js';
import { weekInfo, dayById, DOW, GOALS } from '../planner.js';
import { reviewPlan, applyAction } from '../coach.js';
import { openExercise, presc } from './exercise-sheet.js';
import { go } from '../nav.js';
import * as ai from '../ai.js';
import { openChat } from './chat.js';

const LEVEL = ['', 'Principiante', 'Intermedio', 'Avanzado'];

const topbar = (title, back) => h('div', { class: 'topbar' },
  h('button', { class: 'icon-btn', 'aria-label': 'Volver', onclick: () => (back ? go(back) : history.back()), html: ICON.back }),
  h('div', { class: 't' }, title));

export function renderPlan() {
  const { plan, profile } = api.S;
  const a = profile.assessment;
  const root = h('div', { class: 'stack s3 fade-in' });
  if (!plan) return h('div', { class: 'card stack' }, h('p', null, 'Aún no tienes una rutina.'), h('button', { class: 'btn primary', onclick: () => go('evaluacion') }, 'Crear mi rutina'));
  const wi = weekInfo(plan);
  const goal = GOALS.find((g) => g.id === a.goal);

  root.append(h('h1', { class: 'h1' }, 'Mi rutina'),
    h('div', { class: 'card stack' },
      h('div', { class: 'row' }, h('span', { style: { fontSize: '32px' } }, goal?.icon || '🎯'), h('div', null, h('h2', { class: 'h2' }, plan.summary.title), h('p', { class: 'muted small' }, `${plan.summary.split} · ${plan.summary.daysPerWeek} días/semana`))),
      h('div', { class: 'chips' }, tag(LEVEL[plan.summary.level], 'acc'), tag(`${a.minutes} min`), tag(`Semana ${Math.min(wi.week, wi.total)} de ${wi.total}`), a.injuries?.length ? tag('Adaptada a tus molestias', 'warn') : null),
      plan.summary.notes.map((n) => h('p', { class: 'muted small' }, '• ' + n)),
      h('button', { class: 'btn primary', onclick: () => go('coach') }, '🧠 Mejorar mi rutina'),
      h('button', { class: 'btn soft', onclick: () => openChat() }, '💬 Preguntarle al entrenador')));

  root.append(h('div', { class: 'stack s2' }, plan.days.map((d) => {
    const dows = plan.week.filter((w) => w.dayId === d.id).map((w) => DOW[w.dow]).join(' · ');
    return h('button', { class: 'card tap day-card', style: { width: '100%', textAlign: 'left' }, onclick: () => go('dia/' + d.id) },
      h('div', { class: 'day-ic' }, d.icon),
      h('div', { class: 'grow' }, h('div', { class: 'up' }, dows), h('b', { style: { fontSize: '17px' } }, d.label),
        h('div', { class: 'muted small' }, `~${d.estMin} min · ${d.blocks.length} ejercicios`),
        h('div', { class: 'muted small', style: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, d.blocks.map((b) => EX[b.exId].name).join(', '))),
      h('span', { class: 'chev' }, '›'));
  })));

  root.append(h('div', { class: 'stack s2' },
    h('button', { class: 'btn', onclick: () => go('evaluacion') }, 'Rehacer mi evaluación'),
    h('p', { class: 'muted small center' }, 'Si cambió tu meta, tu equipo o tu disponibilidad, vuelve a evaluarte.')));
  return root;
}

export function renderDay(id) {
  const plan = api.S.plan;
  const d = plan && dayById(plan, id);
  if (!d) return h('div', { class: 'card' }, 'No encontré ese día.');
  const wi = weekInfo(plan);
  const reopen = () => go('dia/' + id);
  const root = h('div', { class: 'stack s3 fade-in' },
    topbar(d.label, 'rutina'),
    h('div', { class: 'row sp' },
      h('div', null, h('p', { class: 'muted' }, `~${d.estMin} min · ~${d.estKcal} kcal`), wi.deload && h('span', { class: 'tag warn' }, 'Semana de descarga')),
      h('span', { style: { fontSize: '40px' } }, d.icon)),
    h('button', { class: 'btn primary big', onclick: () => go('entreno/' + d.id) }, h('span', { html: ICON.play }), 'Empezar'),
    h('div', { class: 'card stack s2' }, h('h3', { class: 'h3' }, '1 · Calentamiento (5 min)'),
      h('div', { class: 'ex-list' }, d.warmup.map((w) => h('button', { class: 'ex-row', onclick: () => openExercise(w.exId) },
        h('div', { class: 'grow' }, h('div', { class: 'ex-t' }, EX[w.exId].name), h('div', { class: 'ex-s' }, w.secs ? `${w.secs} s` : `${w.reps} rep${w.uni ? ' por lado' : ''}`)), h('span', { class: 'chev' }, '›'))))),
    h('div', { class: 'card stack s2' }, h('h3', { class: 'h3' }, '2 · Ejercicios'),
      h('div', { class: 'ex-list' }, d.blocks.map((b, i) => h('button', { class: 'ex-row', onclick: () => openExercise(b.exId, { block: b, dayId: d.id, onSwap: reopen }) },
        h('span', { class: 'ex-n' }, i + 1),
        h('div', { class: 'grow' }, h('div', { class: 'ex-t' }, EX[b.exId].name), h('div', { class: 'ex-s' }, presc(b))), h('span', { class: 'chev' }, '›'))))),
    d.finisher && h('div', { class: 'card stack s2' }, h('h3', { class: 'h3' }, `3 · ${d.finisher.title} (${d.finisher.minutes} min)`),
      h('p', { class: 'muted small' }, d.finisher.style === 'circuit' ? `${d.finisher.rounds} rondas de ${d.finisher.work} s de trabajo y ${d.finisher.rest} s de pausa.` : 'Ritmo constante en el que puedas conversar con esfuerzo.'),
      h('div', { class: 'ex-list' }, d.finisher.items.map((it) => h('button', { class: 'ex-row', onclick: () => openExercise(it.exId) }, h('div', { class: 'grow ex-t' }, EX[it.exId].name), h('span', { class: 'chev' }, '›'))))),
    h('div', { class: 'card stack s2' }, h('h3', { class: 'h3' }, `${d.finisher ? 4 : 3} · Estiramientos`),
      h('div', { class: 'ex-list' }, d.cooldown.map((w) => h('button', { class: 'ex-row', onclick: () => openExercise(w.exId) },
        h('div', { class: 'grow' }, h('div', { class: 'ex-t' }, EX[w.exId].name), h('div', { class: 'ex-s' }, `${w.secs} s${w.uni ? ' por lado' : ''}`)), h('span', { class: 'chev' }, '›'))))));
  return root;
}

const TONE = { good: ['✅', 'good'], warn: ['⚠️', 'warn'], tip: ['💡', ''], info: ['🧠', ''] };

export function renderCoach() {
  const { plan, profile, logs, checkins } = api.S;
  const a = profile.assessment;
  if (!plan) return h('div', { class: 'card' }, 'Primero crea tu rutina.');
  const rv = reviewPlan({ plan, a, logs, checkins });
  const root = h('div', { class: 'stack s3 fade-in' }, topbar('Mi entrenador', 'rutina'));

  root.append(h('div', { class: 'card stack' },
    h('div', { class: 'row' }, h('span', { style: { fontSize: '34px' } }, '🧠'), h('div', null, h('h2', { class: 'h2' }, 'Revisión de tu progreso'), h('p', { class: 'muted small' }, 'Analizo tus entrenos, tu peso, tus calorías y cómo te sientes.'))),
    h('div', { class: 'kpis' },
      h('div', { class: 'kpi' }, h('b', null, `${rv.stats.sessions14}/${rv.stats.planned14}`), h('span', null, 'entrenos 2 sem')),
      h('div', { class: 'kpi' }, h('b', null, `${rv.stats.adherence}%`), h('span', null, 'constancia')),
      h('div', { class: 'kpi' }, h('b', null, logs.length), h('span', null, 'total')))));

  root.append(aiCard());

  root.append(h('div', { class: 'stack' }, rv.items.map((it) => {
    const [ic, cls] = TONE[it.tone] || TONE.info;
    return h('div', { class: 'card stack s2' },
      h('div', { class: 'row', style: { alignItems: 'flex-start' } }, h('span', { style: { fontSize: '26px' } }, ic), h('div', { class: 'grow' }, h('b', null, it.title), h('p', { class: 'muted', style: { marginTop: '4px' } }, it.text))),
      it.action && h('button', { class: 'btn soft', onclick: () => apply(it.action) }, it.action.label));
  })));

  root.append(h('div', { class: 'stack s2' },
    h('button', { class: 'btn', onclick: () => apply({ type: 'renew', label: '' }, true) }, '🔄 Renovar ejercicios ahora'),
    h('p', { class: 'muted small center' }, 'Mantengo tu meta y nivel, pero roto los ejercicios para que no te aburras. Tus cargas guardadas no se pierden.')));
  return root;
}

async function apply(action, confirmFirst = false) {
  if (confirmFirst || action.type === 'renew' || action.type === 'fewer_days') {
    const ok = await ask({ title: '¿Aplicar este cambio?', text: 'Tu rutina se actualizará. Tu historial de entrenos se conserva.', ok: 'Sí, aplicar' });
    if (!ok) return false;
  }
  const { plan, assessment } = applyAction(api.S.plan, api.S.profile.assessment, action, { prefs: api.S.prefs, logs: api.S.logs });
  if (assessment !== api.S.profile.assessment && JSON.stringify(assessment) !== JSON.stringify(api.S.profile.assessment)) api.saveProfile({ assessment });
  api.savePlan(plan, 'coach:' + action.type);
  toast('Rutina actualizada ✅');
  return true;
}

// ───────── análisis con IA (Claude) ─────────
const TONE_AI = { good: '✅', warn: '⚠️', tip: '💡' };

function aiCard() {
  const box = h('div', { class: 'card stack' });
  let loading = false;

  async function run() {
    loading = true; draw();
    try { await ai.requestReview(); toast('Análisis listo 🤖'); }
    catch (e) { toast(e.message, 'bad'); }
    loading = false; draw();
  }

  function reviewView(saved) {
    const r = saved.review;
    const props = ai.toActions(r.proposals, api.S.plan, api.S.profile.assessment);
    const when = new Date(saved.at).toLocaleDateString('es', { day: 'numeric', month: 'short' });
    return h('div', { class: 'stack' },
      h('div', { class: 'stack s2' }, h('b', { style: { fontSize: '17px' } }, r.headline), h('p', null, r.message)),
      r.insights.map((i) => h('div', { class: 'row', style: { alignItems: 'flex-start' } }, h('span', null, TONE_AI[i.tone] || '💡'),
        h('div', null, h('b', null, i.title), h('div', { class: 'muted small' }, i.text)))),
      props.length ? h('div', { class: 'stack s2' }, h('span', { class: 'up' }, 'Cambios que propongo'),
        props.map((p) => {
          const done = (saved.applied || []).includes(p.idx);
          return h('div', { class: 'card flat stack s2' }, h('p', { class: 'small' }, p.reason),
            h('button', { class: 'btn soft small', style: { width: '100%' }, disabled: done, onclick: async () => { if (await apply(p.action)) ai.markApplied(p.idx); } }, done ? '✓ Aplicado' : p.label));
        })) : null,
      h('p', { class: 'muted small' }, `Análisis del ${when}. Propuestas hechas por IA: revísalas antes de aplicar.`));
  }

  function draw() {
    const saved = ai.loadSaved();
    fill(box,
      h('div', { class: 'row' }, h('span', { style: { fontSize: '30px' } }, '🤖'),
        h('div', null, h('h2', { class: 'h2' }, 'Análisis con IA'), h('p', { class: 'muted small' }, 'Claude revisa tu historial completo y te propone ajustes concretos.'))),
      loading ? h('div', { class: 'stack center' }, h('div', { class: 'spin' }), h('p', { class: 'muted small' }, 'Analizando tu progreso… puede tardar unos 20 segundos')) : (saved && reviewView(saved)),
      !loading && h('button', { class: 'btn primary', onclick: run }, saved ? '🔄 Nuevo análisis' : '✨ Pedir análisis'),
      !loading && h('button', { class: 'btn soft', onclick: () => openChat() }, '💬 Preguntarle al entrenador'));
  }
  draw();
  return box;
}
