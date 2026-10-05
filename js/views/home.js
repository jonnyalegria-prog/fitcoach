import * as api from '../api.js';
import { h, ICON, progressRing, sheet, tag } from '../ui.js';
import { EX } from '../exercises.js';
import { todayEntry, weekInfo, DOW, DOW_LONG, dayById } from '../planner.js';
import { reviewPlan, thisWeek, weekStart, streakWeeks } from '../coach.js';
import { fmtLong, localISO, sameDay, todayStr, cap } from '../util.js';
import { go } from '../nav.js';
import { openCheckin } from './progress.js';

const greet = () => { const hr = new Date().getHours(); return hr < 6 ? 'Buenas noches' : hr < 13 ? 'Buenos días' : hr < 20 ? 'Buenas tardes' : 'Buenas noches'; };

export function render() {
  const { profile, plan, logs, checkins } = api.S;
  const a = profile.assessment;
  const name = profile.name || '';
  const root = h('div', { class: 'stack s3 fade-in' });

  root.append(h('div', { class: 'row sp' },
    h('div', null, h('h1', { class: 'h1' }, `${greet()}${name ? ', ' + name : ''}`), h('p', { class: 'muted' }, cap(fmtLong()))),
    api.S.pending ? h('span', { class: 'sync', title: 'Cambios por sincronizar' }, `⟳ ${api.S.pending}`) : null));

  if (!plan) {
    root.append(h('div', { class: 'card stack' }, h('p', null, 'Aún no tienes una rutina.'), h('button', { class: 'btn primary', onclick: () => go('evaluacion') }, 'Crear mi rutina')));
    return root;
  }

  const today = todayEntry(plan);
  const doneToday = logs.filter((l) => sameDay(l.started_at, new Date()));
  const draft = api.draft.get();
  const wi = weekInfo(plan);

  if (draft) {
    const d = dayById(plan, draft.dayId);
    if (d) root.append(h('button', { class: 'card tap row', style: { border: '2px solid var(--acc)', textAlign: 'left', width: '100%' }, onclick: () => go('entreno/' + d.id) },
      h('span', { style: { fontSize: '26px' } }, '⏸️'),
      h('div', { class: 'grow' }, h('b', null, 'Tienes un entreno sin terminar'), h('div', { class: 'muted small' }, `${d.label} · toca para continuar`)),
      h('span', { class: 'chev' }, '›')));
  }

  if (wi.deload) root.append(h('div', { class: 'banner warn' }, h('span', { class: 'bi' }, '🌿'), h('div', null, h('b', null, 'Semana de descarga'), 'Esta semana hacemos una serie menos por ejercicio para recuperar y seguir progresando.')));

  // ───── tarjeta de hoy ─────
  if (today.day && !doneToday.length) {
    const d = today.day;
    root.append(h('div', { class: 'card hero stack' },
      h('div', { class: 'row sp' }, h('span', { class: 'up', style: { color: 'rgba(255,255,255,.75)' } }, 'Hoy toca'), tag(`Semana ${Math.min(wi.week, wi.total)} de ${wi.total}`)),
      h('div', { class: 'row' }, h('span', { style: { fontSize: '40px' } }, d.icon), h('div', null, h('h2', { class: 'h1', style: { fontSize: '26px' } }, d.label), h('p', { class: 'muted' }, `~${d.estMin} min · ~${d.estKcal} kcal · ${d.blocks.length} ejercicios`))),
      h('p', { class: 'muted small' }, d.blocks.slice(0, 4).map((b) => EX[b.exId].name).join(' · ') + (d.blocks.length > 4 ? ' …' : '')),
      h('button', { class: 'btn primary big', onclick: () => go('entreno/' + d.id) }, h('span', { html: ICON.play }), 'Empezar entrenamiento')));
  } else if (doneToday.length) {
    const l = doneToday[0];
    root.append(h('div', { class: 'card stack', style: { background: 'var(--acc-soft)' } },
      h('div', { class: 'row' }, h('span', { style: { fontSize: '36px' } }, '🎉'), h('div', null, h('h2', { class: 'h2' }, '¡Entreno de hoy completado!'), h('p', { class: 'muted' }, `${l.day_label} · ${l.duration_min || '–'} min · ~${l.kcal || '–'} kcal`))),
      h('p', { class: 'small' }, a.kcal_target ? `Recuerda registrar este ejercicio en Fitia (~${l.kcal} kcal) y comer tu proteína.` : 'Registra este ejercicio en Fitia y no olvides tu proteína.'),
      h('button', { class: 'link', onclick: () => pickDay(plan) }, 'Entrenar otro día de mi rutina')));
  } else {
    const nxt = nextTraining(plan);
    root.append(h('div', { class: 'card stack' },
      h('div', { class: 'row' }, h('span', { style: { fontSize: '36px' } }, '😌'), h('div', null, h('h2', { class: 'h2' }, 'Hoy toca descansar'), h('p', { class: 'muted' }, 'El músculo crece mientras descansas.'))),
      ['lose_fat', 'health'].includes(a.goal) && h('p', { class: 'small' }, '👟 Suma una caminata de 20–30 minutos si te sientes con ganas: ayuda a tu meta sin cansarte.'),
      nxt && h('div', { class: 'banner good' }, h('span', { class: 'bi' }, '📅'), h('div', null, h('b', null, 'Próximo entreno'), `${DOW_LONG[nxt.dow]} · ${nxt.day.label}`)),
      h('button', { class: 'btn soft', onclick: () => pickDay(plan) }, 'Entrenar de todos modos')));
  }

  // ───── semana ─────
  const ws = weekStart();
  const wk = thisWeek(logs);
  const planned = plan.summary.daysPerWeek;
  root.append(h('div', { class: 'card stack' },
    h('div', { class: 'row sp' }, h('h3', { class: 'h3' }, 'Tu semana'), h('a', { class: 'link', href: '#/rutina' }, 'Ver rutina')),
    h('div', { class: 'week' }, [1, 2, 3, 4, 5, 6, 7].map((dow) => {
      const date = new Date(+ws + (dow - 1) * 864e5);
      const did = logs.some((l) => sameDay(l.started_at, date));
      const isPlan = plan.week.find((x) => x.dow === dow)?.dayId;
      const isToday = localISO(date) === todayStr();
      return h('div', { class: `wd ${did ? 'done' : isPlan ? 'plan' : ''} ${isToday ? 'today' : ''}` }, h('i', null, did ? '✓' : date.getDate()), DOW[dow]);
    })),
    h('div', { class: 'row', style: { gap: '16px' } },
      progressRing(wk.length / planned, `${wk.length}/${planned}`, 'entrenos'),
      h('div', { class: 'grow stack s2' },
        h('div', { class: 'row sp' }, h('span', { class: 'muted' }, 'Racha'), h('b', null, `${streakWeeks(logs, planned)} sem 🔥`)),
        h('div', { class: 'row sp' }, h('span', { class: 'muted' }, 'Calorías (est.)'), h('b', null, `${wk.reduce((s, l) => s + (l.kcal || 0), 0)} kcal`)),
        h('div', { class: 'row sp' }, h('span', { class: 'muted' }, 'Total entrenos'), h('b', null, logs.length))))));

  // ───── check-in ─────
  const ci = checkins.find((c) => c.date === todayStr());
  if (!ci || (!ci.weight_kg && !ci.calories)) {
    root.append(h('button', { class: 'card tap row', style: { width: '100%', textAlign: 'left' }, onclick: () => openCheckin() },
      h('span', { style: { fontSize: '30px' } }, '📝'),
      h('div', { class: 'grow' }, h('b', null, 'Registro rápido de hoy'), h('div', { class: 'muted small' }, 'Peso, calorías de Fitia y cómo te sientes · 15 segundos')),
      h('span', { class: 'chev' }, '›')));
  } else {
    root.append(h('button', { class: 'card flat row', style: { width: '100%', textAlign: 'left', background: 'none' }, onclick: () => openCheckin() },
      h('span', null, '✅'), h('div', { class: 'grow small muted' }, `Registrado hoy${ci.weight_kg ? ` · ${String(ci.weight_kg).replace('.', ',')} kg` : ''}${ci.calories ? ` · ${ci.calories} kcal` : ''}`),
      h('span', { class: 'link' }, 'Editar')));
  }

  // ───── consejo del entrenador ─────
  const rv = reviewPlan({ plan, a, logs, checkins });
  const tip = rv.items[0];
  if (tip) {
    const icon = { good: '✅', warn: '⚠️', tip: '💡', info: '🧠' }[tip.tone] || '🧠';
    root.append(h('button', { class: 'card tap row', style: { width: '100%', textAlign: 'left' }, onclick: () => go('coach') },
      h('span', { style: { fontSize: '28px' } }, icon),
      h('div', { class: 'grow' }, h('div', { class: 'up' }, 'Tu entrenador dice'), h('b', null, tip.title), h('div', { class: 'muted small' }, tip.action ? 'Toca para ajustar tu rutina' : 'Toca para ver tu revisión')),
      h('span', { class: 'chev' }, '›')));
  }
  return root;
}

function nextTraining(plan) {
  const t = new Date(); let dow = t.getDay() === 0 ? 7 : t.getDay();
  for (let i = 1; i <= 7; i++) {
    const d = ((dow - 1 + i) % 7) + 1;
    const w = plan.week.find((x) => x.dow === d);
    if (w?.dayId) return { dow: d, day: dayById(plan, w.dayId) };
  }
  return null;
}

function pickDay(plan) {
  const s = sheet('¿Cuál quieres hacer?', h('div', { class: 'stack s2' }, plan.days.map((d) =>
    h('button', { class: 'choice', onclick: () => { s.close(); go('entreno/' + d.id); } },
      h('span', { class: 'ci' }, d.icon), h('div', null, h('b', null, d.label), h('span', { class: 'd' }, `~${d.estMin} min · ${d.blocks.length} ejercicios`))))));
}
