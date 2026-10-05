// Entrenador adaptativo: progresión de cargas + revisión y ajuste de la rutina.
import { EX } from './exercises.js';
import { localISO } from './util.js';
import { generatePlan, finisherFor, isLoadable, evaluate, weekInfo, sessionMinutes, estKcal } from './planner.js';

const DAY = 864e5;
export const e1rm = (w, r) => (w > 0 && r > 0 ? w * (1 + r / 30) : 0);
const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const iso = (d) => localISO(new Date(d));

// Mundo de datos: logs ordenados de más reciente a más antiguo.
export function history(logs, exId, n = 3) {
  const out = [];
  for (const l of logs) {
    const e = (l.entries || []).find((x) => x.exId === exId);
    if (e && e.sets?.some((s) => s.done)) out.push({ date: l.started_at, sets: e.sets.filter((s) => s.done) });
    if (out.length >= n) break;
  }
  return out;
}

// Sugerencia para la próxima vez que se hace un ejercicio.
export function suggestNext(block, logs) {
  const e = EX[block.exId];
  const hist = history(logs, block.exId, 2);
  if (!hist.length) {
    return {
      weight: null, reps: null,
      note: isLoadable(e) ? 'Primera vez: elige un peso con el que te queden 2–3 repeticiones en reserva.' : null,
    };
  }
  const last = hist[0].sets;
  const target = block.secs ?? block.reps?.[1];
  const lo = block.secs ?? block.reps?.[0];
  const value = (s) => (block.secs ? s.secs ?? s.reps : s.reps);
  const hitTop = last.length >= Math.min(block.sets, 2) && last.every((s) => value(s) >= target);
  const missed = last.some((s) => value(s) < lo);

  if (isLoadable(e)) {
    const w = Math.max(...last.map((s) => +s.weight || 0));
    if (hitTop) {
      const inc = w < 20 ? 1 : 2.5;
      return { weight: round(w + inc), reps: block.reps?.[0], note: `¡Lo lograste todo! Sube a ${round(w + inc)} kg.`, up: true };
    }
    if (missed && hist[1]?.sets.some((s) => value(s) < lo) && (+hist[1].sets[0]?.weight || 0) >= w) {
      const dw = round(w * 0.92);
      return { weight: dw, reps: lo, note: `Costó dos veces seguidas: baja un poco a ${dw} kg y recupera técnica.` };
    }
    return { weight: w, reps: Math.min(target, Math.max(...last.map(value)) + 1), note: 'Mismo peso: intenta sumar 1 repetición por serie.' };
  }
  // peso corporal / banda / tiempo
  const twice = hist.length > 1 && hist.every((h) => h.sets.every((s) => value(s) >= target));
  if (twice && e.up) {
    return { weight: null, reps: lo, note: `Dominaste este ejercicio. Prueba la versión más difícil: ${EX[e.up].name}.`, upgrade: e.up };
  }
  if (hitTop) return { weight: null, reps: target, note: block.secs ? 'Bien. Intenta mantener 5 segundos más.' : 'Bien. Intenta ir más lento y controlado o suma 1–2 reps.', up: true };
  return { weight: null, reps: Math.min(target, Math.max(...last.map(value)) + 1), note: 'Intenta superar tus repeticiones de la última vez.' };
}
const round = (x) => Math.round(x * 2) / 2;

// ───────── estadísticas ─────────
export function sessionsBetween(logs, from, to) {
  return logs.filter((l) => { const t = +new Date(l.started_at); return t >= from && t < to; });
}
export function weekStart(d = new Date()) {
  const x = new Date(d); x.setHours(0, 0, 0, 0);
  const dow = x.getDay() === 0 ? 7 : x.getDay();
  x.setDate(x.getDate() - (dow - 1));
  return x;
}
export function thisWeek(logs, d = new Date()) {
  const s = weekStart(d);
  return sessionsBetween(logs, +s, +s + 7 * DAY);
}
export function streakWeeks(logs, target) {
  let weeks = 0;
  let s = weekStart();
  const now = new Date();
  // la semana en curso cuenta solo si ya cumplió
  for (let i = 0; i < 52; i++) {
    const c = sessionsBetween(logs, +s, +s + 7 * DAY).length;
    if (c >= target) weeks++;
    else if (!(i === 0 && now < new Date(+s + 7 * DAY))) break;
    s = new Date(+s - 7 * DAY);
  }
  return weeks;
}

function slopePerWeek(points) {
  // points: [{t(ms), v}] regresión lineal → kg/semana
  if (points.length < 3) return null;
  const n = points.length;
  const mt = avg(points.map((p) => p.t)), mv = avg(points.map((p) => p.v));
  let num = 0, den = 0;
  for (const p of points) { num += (p.t - mt) * (p.v - mv); den += (p.t - mt) ** 2; }
  if (!den) return null;
  const span = (points[n - 1].t - points[0].t) / DAY;
  if (span < 9) return null;
  return (num / den) * 7 * DAY;
}

// ───────── revisión del plan ─────────
export function reviewPlan({ plan, a, logs, checkins }) {
  const now = Date.now();
  const items = [];
  const wi = weekInfo(plan);
  const planned = plan.summary.daysPerWeek;
  const last14 = sessionsBetween(logs, now - 14 * DAY, now + DAY);
  const adherence = Math.min(1, last14.length / (planned * 2));
  const stats = { sessions14: last14.length, planned14: planned * 2, adherence: Math.round(adherence * 100) };
  const ageDays = (now - +new Date(plan.createdAt)) / DAY;

  if (!logs.length) {
    return { stats, items: [{ id: 'nodata', tone: 'info', title: 'Aún estoy conociéndote', text: 'Completa 2–3 entrenamientos y registra tu peso. Con eso empiezo a ajustar tu rutina de verdad.' }] };
  }

  // 1) Adherencia
  if (ageDays >= 10 && adherence < 0.5) {
    if (planned > 2) items.push({ id: 'fewer', tone: 'warn', title: 'Hagámoslo más fácil de cumplir', text: `Hiciste ${last14.length} de ${planned * 2} entrenos en 2 semanas. Una rutina que se cumple vale más que una perfecta: te propongo ${planned - 1} días por semana.`, action: { type: 'fewer_days', label: `Pasar a ${planned - 1} días` } });
    else items.push({ id: 'shorter', tone: 'warn', title: 'Acortemos las sesiones', text: 'Te cuesta encontrar el tiempo. Hagamos entrenos más cortos.', action: { type: 'shorter', label: 'Sesiones más cortas' } });
  } else if (adherence >= 0.85 && last14.length >= 4) {
    items.push({ id: 'adh', tone: 'good', title: 'Constancia excelente 🙌', text: `Cumpliste ${Math.round(adherence * 100)}% de tus entrenos de las últimas 2 semanas.` });
  }

  // 2) Esfuerzo percibido
  const rpes = logs.slice(0, 5).map((l) => +l.rpe).filter(Boolean);
  const rpe = avg(rpes);
  if (rpe != null && rpes.length >= 3) {
    if (rpe >= 9) items.push({ id: 'hard', tone: 'warn', title: 'Tus entrenos son muy intensos', text: 'Estás terminando casi al límite. Bajar un poco el volumen te ayudará a recuperar y progresar.', action: { type: 'volume', delta: -1, label: 'Reducir una serie por ejercicio' } });
    else if (rpe <= 6.5 && adherence >= 0.7) items.push({ id: 'easy', tone: 'tip', title: 'Puedes exigirte un poco más', text: 'Tus entrenos se sienten fáciles. Sumemos una serie a los ejercicios principales.', action: { type: 'volume', delta: 1, label: 'Sumar una serie a los básicos' } });
  }

  // 3) Cómo te sientes (check-ins)
  const recent = checkins.filter((c) => now - +new Date(c.date) <= 7 * DAY);
  const energy = avg(recent.map((c) => c.energy).filter(Boolean));
  const sore = avg(recent.map((c) => c.soreness).filter(Boolean));
  if ((energy != null && energy <= 2.2) || (sore != null && sore >= 4)) {
    items.push({ id: 'deload', tone: 'warn', title: 'Tu cuerpo pide recuperación', text: 'Reportas poca energía o mucha fatiga. Una semana más suave (menos series) suele devolverte la fuerza.', action: { type: 'deload', label: 'Activar semana de descarga' } });
  }

  // 4) Peso vs objetivo
  const pts = checkins.filter((c) => c.weight_kg && now - +new Date(c.date) <= 35 * DAY).map((c) => ({ t: +new Date(c.date), v: +c.weight_kg })).sort((x, y) => x.t - y.t);
  const slope = slopePerWeek(pts);
  if (slope != null) {
    const pct = (slope / avg(pts.map((p) => p.v))) * 100;
    const goal = a.goal;
    const fmt = `${slope > 0 ? '+' : ''}${slope.toFixed(2)} kg/semana`;
    if (goal === 'lose_fat') {
      if (pct < -1) items.push({ id: 'fast', tone: 'warn', title: `Bajas muy rápido (${fmt})`, text: 'Perder más del 1% de tu peso por semana puede costarte músculo y energía. Sube un poco tus calorías en Fitia, mantén la proteína alta y reduzco el cardio.', action: { type: 'cardio', delta: -1, label: 'Reducir cardio' } });
      else if (pct <= -0.2) items.push({ id: 'trend', tone: 'good', title: `Ritmo ideal (${fmt}) ✅`, text: 'Vas bajando a un ritmo sostenible. Sigue así.' });
      else if (adherence >= 0.7 && pts.length >= 4 && (pts[pts.length - 1].t - pts[0].t) / DAY >= 18) items.push({ id: 'stall', tone: 'tip', title: `Tu peso está estable (${fmt})`, text: 'Entrenas bien pero el peso no baja. Revisa en Fitia si el déficit es real (sábados y domingos cuentan) y sumemos algo de cardio.', action: { type: 'cardio', delta: 1, label: 'Sumar cardio final' } });
    } else if (goal === 'build_muscle' || goal === 'strength') {
      if (pct > 0.5) items.push({ id: 'fastup', tone: 'tip', title: `Subes rápido (${fmt})`, text: 'Subir más de 0,5% por semana suele ser mucha grasa extra. Reduce un poco el superávit en Fitia.' });
      else if (pct >= 0.1) items.push({ id: 'trend', tone: 'good', title: `Ganancia limpia (${fmt}) ✅`, text: 'Ritmo ideal para ganar músculo con poca grasa.' });
      else if (adherence >= 0.7 && (pts[pts.length - 1].t - pts[0].t) / DAY >= 18) items.push({ id: 'nogain', tone: 'tip', title: `Tu peso no sube (${fmt})`, text: 'Para crecer necesitas comer un poco más: prueba +150–250 kcal en Fitia.' });
    }
  }

  // 5) Calorías vs objetivo de Fitia
  const cals = recent.map((c) => c.calories).filter(Boolean);
  if (a.kcal_target && cals.length >= 4) {
    const diff = avg(cals) / a.kcal_target - 1;
    if (a.goal === 'lose_fat' && diff > 0.12) items.push({ id: 'kcal_over', tone: 'tip', title: 'Estás sobre tu meta de calorías', text: `Promedio ${Math.round(avg(cals))} kcal vs meta ${a.kcal_target}. Para ver resultados, acerca tu registro a la meta de Fitia.` });
    if ((a.goal === 'build_muscle') && diff < -0.12) items.push({ id: 'kcal_under', tone: 'tip', title: 'Comes menos de tu meta', text: `Promedio ${Math.round(avg(cals))} kcal vs meta ${a.kcal_target}. Para ganar músculo necesitas llegar a tu meta.` });
  }

  // 6) Estancamiento en ejercicios principales
  const stalled = [];
  for (const d of plan.days) for (const b of d.blocks) {
    if (!isLoadable(EX[b.exId]) || stalled.includes(b.exId)) continue;
    const h = history(logs, b.exId, 3);
    if (h.length === 3) {
      const best = (x) => Math.max(...x.sets.map((s) => e1rm(+s.weight || 0, +s.reps || 0)));
      if (best(h[0]) <= best(h[2]) * 1.01) stalled.push(b.exId);
    }
  }
  if (stalled.length) items.push({ id: 'stalled', tone: 'tip', title: 'Algunos ejercicios se estancaron', text: `${stalled.slice(0, 3).map((i) => EX[i].name).join(', ')}: llevan 3 sesiones sin mejorar. Cambiar la variante suele reactivar el progreso.`, action: { type: 'rotate', ids: stalled, label: 'Cambiar esas variantes' } });

  // 7) Fin de ciclo
  if (wi.over || ageDays > 42) items.push({ id: 'renew', tone: 'tip', title: 'Completaste tu ciclo de 6 semanas 🎉', text: 'Es hora de renovar: mantengo lo que funciona, roto ejercicios y subo la dificultad según tu progreso.', action: { type: 'renew', label: 'Crear nueva rutina' } });
  else if (wi.deload) items.push({ id: 'lastweek', tone: 'info', title: 'Última semana del ciclo: descarga', text: 'Esta semana bajamos un poco el volumen para que llegues fresco al próximo ciclo.' });

  const order = { warn: 0, tip: 1, info: 2, good: 3 };
  items.sort((x, y) => order[x.tone] - order[y.tone]);
  if (!items.length) items.push({ id: 'ok', tone: 'good', title: 'Todo va según lo previsto', text: 'No veo nada que ajustar por ahora. Sigue registrando tus entrenos y tu peso.' });
  return { stats, items };
}

// ───────── aplicar un ajuste ─────────
export function applyAction(plan, a, action, ctx) {
  const next = structuredClone(plan);
  let na = { ...a };
  const prefs = ctx.prefs || new Map();
  switch (action.type) {
    case 'fewer_days': {
      const wd = [...(a.weekdays || [])].sort();
      na.weekdays = wd.slice(0, Math.max(2, wd.length - 1));
      return { plan: generatePlan(na, { prefs, seed: plan.seed, recent: [] }), assessment: na };
    }
    case 'shorter':
      na.minutes = Math.max(20, (a.minutes || 45) - 10);
      return { plan: generatePlan(na, { prefs, seed: plan.seed }), assessment: na };
    case 'renew': {
      const recent = plan.days.flatMap((d) => d.blocks.map((b) => b.exId));
      return { plan: generatePlan(na, { prefs, recent, seed: Math.floor(Math.random() * 1e9) }), assessment: na };
    }
    case 'rotate': {
      const recent = action.ids;
      const p = generatePlan(na, { prefs, recent, seed: Math.floor(Math.random() * 1e9) });
      return { plan: p, assessment: na };
    }
    case 'volume':
      for (const d of next.days) {
        for (const b of d.blocks) {
          if (action.delta > 0 && b.role !== 'main') continue;
          b.sets = Math.min(5, Math.max(2, b.sets + action.delta));
        }
        d.estMin = sessionMinutes(d);
      }
      return { plan: next, assessment: na };
    case 'cardio':
      for (const d of next.days) {
        if (action.delta > 0) {
          if (d.finisher) d.finisher.minutes += 4;
          else d.finisher = finisherFor(na, prefs, true);
        } else if (d.finisher) {
          d.finisher.minutes -= 4;
          if (d.finisher.minutes < 6) d.finisher = null;
        }
        d.estMin = sessionMinutes(d);
        d.estKcal = estKcal(d.estMin, na.weight_kg, 7, d.finisher ? 5.5 : undefined);
      }
      return { plan: next, assessment: na };
    case 'deload':
      next.deloadUntil = iso(Date.now() + 7 * DAY);
      return { plan: next, assessment: na };
    default:
      return { plan, assessment: a };
  }
}

export { evaluate };
