import * as api from '../api.js';
import { h, sheet, toast, ask, lineChart, barChart, sparkline, field } from '../ui.js';
import { EX } from '../exercises.js';
import { isLoadable } from '../planner.js';
import { e1rm, streakWeeks } from '../coach.js';
import { openExercise } from './exercise-sheet.js';
import { fmtShort, fmtKg, todayStr, num, localISO, dayName, cap } from '../util.js';

const EN = ['😫', '😕', '😐', '🙂', '🤩'];
const SO = ['😊', '🙂', '😐', '😣', '🥵'];

export function openCheckin(date = todayStr()) {
  const prev = api.S.checkins.find((c) => c.date === date) || {};
  const lastW = api.S.checkins.find((c) => c.weight_kg)?.weight_kg;
  let energy = prev.energy || 0, sore = prev.soreness || 0;
  const weight = h('input', { type: 'text', inputMode: 'decimal', placeholder: 'ej. 72,5', value: (prev.weight_kg ?? lastW ?? '').toString().replace('.', ',') });
  const cals = h('input', { type: 'text', inputMode: 'numeric', placeholder: 'Cópialas de Fitia', value: prev.calories ?? '' });
  const sleep = h('input', { type: 'text', inputMode: 'decimal', placeholder: 'ej. 7,5', value: (prev.sleep_h ?? '').toString().replace('.', ',') });
  const emo = (arr, get, set) => {
    const wrap = h('div', { class: 'emo5' });
    const draw = () => wrap.replaceChildren(...arr.map((em, i) => h('button', { class: get() === i + 1 ? 'on' : '', 'aria-label': String(i + 1), onclick: () => { set(i + 1); draw(); } }, em)));
    draw(); return wrap;
  };
  const s = sheet('Registro de hoy', h('div', { class: 'stack s3' },
    h('div', { class: 'grid2' }, field('Peso (kg)', weight), field('Calorías del día', cals, 'Total en Fitia')),
    h('div', { class: 'stack s2' }, h('span', { class: 'field-l' }, '⚡ Energía'), emo(EN, () => energy, (v) => { energy = v; })),
    h('div', { class: 'stack s2' }, h('span', { class: 'field-l' }, '💢 Agujetas / cansancio muscular'), emo(SO, () => sore, (v) => { sore = v; })),
    field('Horas de sueño (opcional)', sleep),
    h('button', { class: 'btn primary big', onclick: save }, 'Guardar')));
  function save() {
    const w = num(weight.value), c = num(cals.value), sl = num(sleep.value);
    if (w != null && (w < 30 || w > 300)) return toast('Revisa el peso.', 'bad');
    if (c != null && (c < 300 || c > 10000)) return toast('Revisa las calorías.', 'bad');
    if (w == null && c == null && !energy && !sore && sl == null) return toast('Completa al menos un dato.', 'bad');
    api.upsertCheckin({ date, weight_kg: w, calories: c != null ? Math.round(c) : null, energy: energy || null, soreness: sore || null, sleep_h: sl });
    if (w != null && date === todayStr() && api.S.profile?.assessment) api.saveProfile({ assessment: { ...api.S.profile.assessment, weight_kg: w } });
    s.close(); toast('Registro guardado ✅');
  }
}

export function render() {
  const { logs, checkins, plan, profile } = api.S;
  const a = profile.assessment;
  const root = h('div', { class: 'stack s3 fade-in' });
  const planned = plan?.summary.daysPerWeek || 3;
  const monthAgo = Date.now() - 30 * 864e5;

  root.append(h('div', { class: 'row sp' }, h('h1', { class: 'h1' }, 'Progreso'), h('button', { class: 'btn soft small', onclick: () => openCheckin() }, '+ Registro')),
    h('div', { class: 'kpis' },
      h('div', { class: 'kpi' }, h('b', null, logs.length), h('span', null, 'entrenos')),
      h('div', { class: 'kpi' }, h('b', null, logs.filter((l) => +new Date(l.started_at) > monthAgo).length), h('span', null, 'últimos 30 días')),
      h('div', { class: 'kpi' }, h('b', null, streakWeeks(logs, planned)), h('span', null, 'semanas de racha'))));

  // ── peso
  const wpts = checkins.filter((c) => c.weight_kg).map((c) => ({ x: new Date(c.date + 'T12:00:00'), y: +c.weight_kg })).sort((p, q) => p.x - q.x).slice(-60);
  const delta = wpts.length > 1 ? wpts[wpts.length - 1].y - wpts[0].y : null;
  root.append(h('div', { class: 'card stack' },
    h('div', { class: 'row sp' }, h('h3', { class: 'h3' }, '⚖️ Peso'), delta != null && h('span', { class: 'tag ' + (delta === 0 ? '' : 'acc') }, `${delta > 0 ? '+' : ''}${fmtKg(delta)} kg desde el inicio`)),
    lineChart(wpts, { target: a.target_weight || undefined, unit: ' kg' }),
    wpts.length ? h('p', { class: 'muted small' }, `Actual: ${fmtKg(wpts[wpts.length - 1].y)} kg${a.target_weight ? ` · Meta: ${fmtKg(a.target_weight)} kg` : ''}`) : null));

  // ── calorías (Fitia)
  const days = Array.from({ length: 14 }, (_, i) => localISO(new Date(Date.now() - (13 - i) * 864e5)));
  const bars = days.map((d) => ({ l: dayName(d).slice(0, 1).toUpperCase(), v: checkins.find((c) => c.date === d)?.calories || 0 }));
  const withData = bars.filter((b) => b.v);
  root.append(h('div', { class: 'card stack' },
    h('div', { class: 'row sp' }, h('h3', { class: 'h3' }, '🥗 Calorías (de Fitia)'), withData.length ? h('span', { class: 'tag' }, `Prom. ${Math.round(withData.reduce((s, b) => s + b.v, 0) / withData.length)} kcal`) : null),
    withData.length ? barChart(bars, { target: a.kcal_target || undefined }) : h('p', { class: 'muted' }, 'Anota tus calorías diarias de Fitia en el registro rápido y las comparo con tu meta para ajustar tu rutina.'),
    a.kcal_target ? h('p', { class: 'muted small' }, `Línea punteada = tu meta de ${a.kcal_target} kcal.`) : null));

  // ── fuerza
  const byEx = new Map();
  for (const l of [...logs].reverse()) for (const en of l.entries || []) {
    const e = EX[en.exId]; if (!e) continue;
    const sets = (en.sets || []).filter((s) => s.done);
    if (!sets.length) continue;
    const val = isLoadable(e) ? Math.max(...sets.map((s) => e1rm(+s.weight || 0, +s.reps || 0))) : Math.max(...sets.map((s) => +s.reps || 0));
    const best = isLoadable(e) ? sets.reduce((m, s) => ((+s.weight || 0) > (+m.weight || 0) ? s : m), sets[0]) : sets.reduce((m, s) => ((+s.reps || 0) > (+m.reps || 0) ? s : m), sets[0]);
    const arr = byEx.get(en.exId) || []; arr.push({ val, best }); byEx.set(en.exId, arr);
  }
  const strength = [...byEx.entries()].sort((p, q) => q[1].length - p[1].length).slice(0, 8);
  root.append(h('div', { class: 'card stack s2' }, h('h3', { class: 'h3' }, '🏋️ Tu fuerza'),
    strength.length ? strength.map(([id, arr]) => {
      const e = EX[id], last = arr[arr.length - 1], pr = Math.max(...arr.map((x) => x.val)), up = arr.length > 1 && last.val > arr[0].val;
      const lbl = isLoadable(e) ? `${fmtKg(+last.best.weight)} kg × ${last.best.reps}` : e.mode === 'time' ? `${last.best.reps} s` : `${last.best.reps} reps`;
      return h('button', { class: 'pb', style: { background: 'none', border: 0, borderTop: '1px solid var(--line)', width: '100%', textAlign: 'left' }, onclick: () => openExercise(id) },
        h('div', null, h('b', null, e.name), h('div', { class: 'muted small' }, `${lbl}${up ? ' ↗' : ''}`)), sparkline(arr.map((x) => x.val)));
    }) : h('p', { class: 'muted' }, 'Cuando registres tus entrenos verás aquí cómo mejoras en cada ejercicio.')));

  // ── historial
  root.append(h('div', { class: 'card stack s2' }, h('h3', { class: 'h3' }, '🗓️ Historial'),
    logs.length ? logs.slice(0, 15).map((l) => histItem(l)) : h('p', { class: 'muted' }, 'Todavía no hay entrenos registrados.')));
  return root;
}

function histItem(l) {
  const open = h('div', { class: 'stack s2', hidden: true, style: { marginTop: '8px' } },
    (l.entries || []).map((en) => h('div', null, h('b', { class: 'small' }, EX[en.exId]?.name || en.name),
      h('div', { class: 'muted small' }, en.sets.map((s) => (s.weight ? `${fmtKg(+s.weight)}kg×${s.reps}` : EX[en.exId]?.mode === 'time' ? `${s.reps}s` : `${s.reps}`)).join(' · ')))),
    l.notes && h('p', { class: 'muted small' }, '📝 ' + l.notes),
    h('button', { class: 'link', style: { color: 'var(--bad)' }, onclick: async () => { if (await ask({ title: '¿Borrar este entreno?', text: 'No se puede deshacer.', ok: 'Borrar', danger: true })) { api.deleteLog(l.id); toast('Entreno borrado'); } } }, 'Borrar entreno'));
  return h('div', { class: 'hist-item' },
    h('button', { style: { all: 'unset', cursor: 'pointer', display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }, onclick: () => { open.hidden = !open.hidden; } },
      h('div', null, h('b', null, l.day_label || 'Entreno'), h('div', { class: 'muted small' }, `${cap(dayName(l.started_at))} ${fmtShort(l.started_at)} · ${l.duration_min || '–'} min · ~${l.kcal || '–'} kcal`)), h('span', { class: 'chev' }, '⌄')),
    open);
}
