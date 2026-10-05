// Generador de rutinas personalizadas (reglas + evaluación del usuario).
import { EX, EXERCISES, usable, PATTERN_LABEL } from './exercises.js';
import { localISO } from './util.js';

export const GOALS = [
  { id: 'lose_fat', label: 'Perder grasa', icon: '🔥', desc: 'Quemar calorías y mantener el músculo' },
  { id: 'build_muscle', label: 'Ganar músculo', icon: '💪', desc: 'Más masa muscular y volumen' },
  { id: 'tone', label: 'Tonificar', icon: '✨', desc: 'Definir y verte más firme' },
  { id: 'strength', label: 'Ganar fuerza', icon: '🏋️', desc: 'Levantar cada vez más' },
  { id: 'health', label: 'Salud y energía', icon: '❤️', desc: 'Moverme mejor y sentirme bien' },
];

export const FOCUS = [
  { id: 'gluteos', label: 'Glúteos', p: ['glute', 'hamstring'] },
  { id: 'piernas', label: 'Piernas', p: ['squat', 'lunge'] },
  { id: 'pecho', label: 'Pecho', p: ['fly', 'push_h'] },
  { id: 'espalda', label: 'Espalda', p: ['pull_h', 'rear_delt'] },
  { id: 'hombros', label: 'Hombros', p: ['lat_raise', 'push_v'] },
  { id: 'brazos', label: 'Brazos', p: ['biceps', 'triceps'] },
  { id: 'abdomen', label: 'Abdomen', p: ['core'] },
];

export const DOW = ['', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
export const DOW_LONG = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

// ───────── utilidades ─────────
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const bucket = (n, th) => (n < th[0] ? 0 : n < th[1] ? 1 : n < th[2] ? 2 : 3);
const WEIGHT_EQUIP = ['dumbbell', 'barbell', 'kettlebell', 'machine'];
export const isLoadable = (e) => e.equip.some((t) => WEIGHT_EQUIP.includes(t));

// ───────── evaluación ─────────
export function evaluate(a) {
  const t = a.tests || {};
  const exp = { never: 0, lt6: 1, m6_24: 2, gt24: 3 }[a.experience] ?? 0;
  const push = bucket(+t.pushups || 0, [5, 15, 30]);
  const squat = bucket(+t.squats || 0, [10, 25, 45]);
  const plank = bucket(+t.plank || 0, [20, 45, 90]);
  const total = exp + push + squat + plank;
  let level = total <= 4 ? 1 : total <= 8 ? 2 : 3;
  if (level === 3 && exp < 2) level = 2;
  if (exp === 0) level = 1;
  else if (exp === 1) level = Math.min(level, 2);
  if (a.medical) level = 1;
  if ((+a.age || 0) >= 60) level = Math.min(level, 2);
  const cap = [1, 2, 3, 3];
  return { level, exp, total, push: cap[push], lower: cap[squat], core: cap[plank] };
}

const PUSH_P = new Set(['push_h', 'push_v', 'fly', 'triceps']);
const LOWER_P = new Set(['squat', 'lunge', 'hinge', 'glute', 'hamstring', 'calf']);

function levelCap(e, ev) {
  const loaded = e.equip.some((t) => t !== 'bench');
  if (loaded || e.cat === 'cardio') return ev.level;
  if (PUSH_P.has(e.pattern)) return ev.push;
  if (LOWER_P.has(e.pattern)) return ev.lower;
  if (e.pattern === 'core') return ev.core;
  return ev.level;
}

// ───────── plantillas de días ─────────
const S = (p, role = 'acc') => ({ p: Array.isArray(p) ? p : [p], role });
const TEMPLATES = {
  FULL_A: { id: 'full_a', label: 'Cuerpo completo A', icon: '🔥', kind: 'full', slots: [S('squat', 'main'), S('push_h', 'main'), S(['pull_h', 'pull_v', 'rear_delt'], 'main'), S(['hinge', 'glute'], 'acc'), S('core', 'core')] },
  FULL_B: { id: 'full_b', label: 'Cuerpo completo B', icon: '⚡', kind: 'full', slots: [S(['lunge', 'squat'], 'main'), S(['push_v', 'push_h'], 'main'), S(['pull_v', 'pull_h', 'rear_delt'], 'main'), S(['glute', 'hamstring'], 'acc'), S('core', 'core')] },
  FULL_C: { id: 'full_c', label: 'Cuerpo completo C', icon: '🚀', kind: 'full', slots: [S('squat', 'main'), S(['push_h', 'push_v'], 'main'), S(['pull_h', 'rear_delt'], 'main'), S(['hinge', 'glute'], 'main'), S(['biceps', 'triceps', 'lat_raise'], 'acc'), S('core', 'core')] },
  UP1: { id: 'up1', label: 'Tren superior A', icon: '💪', kind: 'upper', slots: [S('push_h', 'main'), S(['pull_h', 'pull_v'], 'main'), S(['push_v', 'push_h'], 'main'), S(['pull_v', 'pull_h', 'rear_delt'], 'main'), S('lat_raise'), S('biceps'), S('triceps')] },
  UP2: { id: 'up2', label: 'Tren superior B', icon: '🦾', kind: 'upper', slots: [S(['push_h', 'fly'], 'main'), S(['pull_v', 'pull_h'], 'main'), S(['push_v', 'push_h'], 'main'), S(['pull_h', 'pull_v', 'rear_delt'], 'main'), S('rear_delt'), S('biceps'), S('triceps')] },
  LOW1: { id: 'low1', label: 'Tren inferior A', icon: '🦵', kind: 'lower', slots: [S('squat', 'main'), S('hinge', 'main'), S('lunge'), S(['hamstring', 'glute']), S('calf'), S('core', 'core')] },
  LOW2: { id: 'low2', label: 'Tren inferior B', icon: '🍑', kind: 'lower', slots: [S('hinge', 'main'), S(['lunge', 'squat'], 'main'), S('glute', 'main'), S(['hamstring', 'hinge']), S('calf'), S('core', 'core')] },
  PUSH: { id: 'push', label: 'Empuje', icon: '🤜', kind: 'upper', slots: [S('push_h', 'main'), S('push_v', 'main'), S(['fly', 'push_h']), S('lat_raise'), S('triceps'), S('triceps')] },
  PULL: { id: 'pull', label: 'Tirón', icon: '🤛', kind: 'upper', slots: [S(['pull_v', 'pull_h'], 'main'), S(['pull_h', 'pull_v'], 'main'), S(['pull_h', 'pull_v', 'rear_delt']), S('rear_delt'), S('biceps'), S('biceps')] },
  LEGS: { id: 'legs', label: 'Piernas y glúteos', icon: '🦵', kind: 'lower', slots: [S('squat', 'main'), S('hinge', 'main'), S('lunge'), S(['glute', 'hamstring']), S('calf'), S('core', 'core')] },
};
const SPLITS = {
  1: [TEMPLATES.FULL_A],
  2: [TEMPLATES.FULL_A, TEMPLATES.FULL_B],
  3: [TEMPLATES.FULL_A, TEMPLATES.FULL_B, TEMPLATES.FULL_C],
  4: [TEMPLATES.UP1, TEMPLATES.LOW1, TEMPLATES.UP2, TEMPLATES.LOW2],
  5: [TEMPLATES.UP1, TEMPLATES.LOW1, TEMPLATES.PUSH, TEMPLATES.PULL, TEMPLATES.LEGS],
  6: [TEMPLATES.PUSH, TEMPLATES.PULL, TEMPLATES.LEGS, TEMPLATES.PUSH, TEMPLATES.PULL, TEMPLATES.LEGS],
};

// ───────── prescripción ─────────
const SCHEME = {
  strength: { main: { sets: 4, reps: [4, 6], rest: 150 }, acc: { sets: 3, reps: [8, 10], rest: 90 } },
  build_muscle: { main: { sets: 4, reps: [6, 10], rest: 100 }, acc: { sets: 3, reps: [10, 15], rest: 70 } },
  lose_fat: { main: { sets: 3, reps: [10, 15], rest: 60 }, acc: { sets: 3, reps: [12, 15], rest: 45 } },
  tone: { main: { sets: 3, reps: [10, 15], rest: 60 }, acc: { sets: 3, reps: [12, 18], rest: 45 } },
  health: { main: { sets: 3, reps: [8, 12], rest: 75 }, acc: { sets: 2, reps: [10, 15], rest: 60 } },
};

function prescribe(e, role, goal, level, mainIdx = 0) {
  const kind = role === 'main' ? 'main' : 'acc';
  let { sets, reps, rest } = SCHEME[goal][kind];
  if (goal === 'strength' && level === 1) reps = [6, 10];
  if (level === 1) sets = Math.min(sets, kind === 'main' ? 3 : 2);
  if (level === 3 && kind === 'main' && mainIdx < 2 && (goal === 'strength' || goal === 'build_muscle')) sets = Math.min(5, sets + 1);
  if (e.mode === 'time') {
    const [lo, hi] = e.time;
    const secs = Math.round((lo + (hi - lo) * (level === 1 ? 0 : level === 2 ? 0.5 : 1)) / 5) * 5;
    return { sets: Math.min(sets, 3), secs, rest: Math.min(rest, 45) };
  }
  if (!isLoadable(e)) reps = e.reps || [8, 15];
  else if (kind === 'acc' && e.reps) reps = e.reps;
  return { sets, reps, rest };
}

function estSeconds(b) {
  const work = b.secs ? b.secs : (b.reps ? ((b.reps[0] + b.reps[1]) / 2) * 3.5 + 8 : 40);
  return b.sets * (work + b.rest) - b.rest;
}

// ───────── selección ─────────
function pickExercise(slot, ctx) {
  for (const p of slot.p) {
    const cands = EXERCISES.filter(
      (e) => e.pattern === p && usable(e, ctx.equip, ctx.injuries) &&
        e.level <= levelCap(e, ctx.ev) && !ctx.used.has(e.id) && ctx.prefs.get(e.id) !== 'avoid',
    );
    if (!cands.length) continue;
    let best = null, bs = -1;
    for (const e of cands) {
      const cap = levelCap(e, ctx.ev);
      let s = ctx.rand() * 0.5;
      s += e.level === cap ? 1.0 : e.level === cap - 1 ? 0.6 : 0.2;
      if (isLoadable(e) && [...ctx.equip].some((t) => WEIGHT_EQUIP.includes(t))) s += 0.6;
      if (ctx.prefs.get(e.id) === 'like') s += 1;
      if (ctx.recent.has(e.id)) s -= 1.2;
      s -= 0.9 * (ctx.planCount.get(e.id) || 0);
      if (s > bs) { bs = s; best = e; }
    }
    return best;
  }
  return null;
}

function buildWarmup(kind, ctx) {
  const ids = {
    upper: ['marcha_lugar', 'circulos_brazos', ctx.equip.has('band') ? 'apertura_banda' : 'rotacion_toracica', 'gato_vaca'],
    lower: ['marcha_lugar', 'balanceo_piernas', 'circulos_cadera', 'estiramiento_mundo'],
    full: ['marcha_lugar', 'circulos_brazos', 'circulos_cadera', 'estiramiento_mundo'],
  }[kind];
  return ids.map((id) => EX[id]).filter((e) => e && !ctx.injuries.some((i) => e.avoid.includes(i)) && usable(e, ctx.equip, null))
    .map((e) => (e.mode === 'time' ? { exId: e.id, secs: e.time[0] } : { exId: e.id, reps: e.reps[0], uni: !!e.uni }));
}

const STRETCH_FOR = {
  'Cuádriceps': 'est_cuadriceps', 'Isquiotibiales': 'est_isquios', 'Pecho': 'est_pecho', 'Espalda': 'postura_nino',
  'Glúteos': 'est_gluteo', 'Hombros': 'est_hombro', 'Tríceps': 'est_triceps', 'Caderas': 'est_flexores', 'Pantorrillas': 'est_pantorrilla',
};
function buildCooldown(blocks) {
  const count = {};
  for (const b of blocks) for (const m of EX[b.exId].muscles.slice(0, 2)) if (STRETCH_FOR[m]) count[STRETCH_FOR[m]] = (count[STRETCH_FOR[m]] || 0) + 1;
  const ids = Object.entries(count).sort((a, b) => b[1] - a[1]).map(([id]) => id).slice(0, 4);
  if (!ids.length) ids.push('postura_nino');
  return ids.map((id) => ({ exId: id, secs: 30, uni: !!EX[id].uni }));
}

function buildFinisher(ctx, goal) {
  const a = ctx.a;
  if (goal !== 'lose_fat' && !(goal === 'health' && a.cardio_pref === 'like')) return null;
  if (a.cardio_pref === 'dislike' && goal !== 'lose_fat') return null;
  const level = ctx.ev.level;
  const cardio = EXERCISES.filter((e) => e.cat === 'cardio' && usable(e, ctx.equip, ctx.injuries) && e.level <= level && ctx.prefs.get(e.id) !== 'avoid');
  if (!cardio.length) return null;
  const minutes = level === 1 ? 8 : level === 2 ? 10 : 12;
  if (a.cardio_pref === 'like') {
    const steady = cardio.find((e) => e.id === 'bici') || cardio.find((e) => e.id === 'trote' && level >= 2) || cardio.find((e) => e.id === 'caminata_rapida');
    if (steady) return { title: 'Cardio final', style: 'steady', minutes: minutes + 2, items: [{ exId: steady.id }], met: steady.met || 6 };
  }
  const circuitPool = cardio.filter((e) => e.mode === 'time' && e.id !== 'caminata_rapida' && e.id !== 'trote' && e.id !== 'bici');
  const items = circuitPool.sort(() => ctx.rand() - 0.5).slice(0, 3).map((e) => ({ exId: e.id }));
  if (!items.length) return { title: 'Cardio final', style: 'steady', minutes, items: [{ exId: cardio[0].id }], met: 5 };
  const work = level === 1 ? 30 : 40, rest = level === 1 ? 30 : 20;
  const rounds = Math.max(2, Math.round((minutes * 60) / (items.length * (work + rest))));
  return { title: 'Circuito de cardio', style: 'circuit', minutes, items, work, rest, rounds, met: 7 };
}

export function finisherFor(a, prefs = new Map(), force = false) {
  const ctx = { a, ev: evaluate(a), equip: new Set(a.equipment || []), injuries: a.injuries || [], prefs, rand: rng(Date.now() & 0xffffff) };
  return buildFinisher(ctx, force ? 'lose_fat' : a.goal);
}

export function estKcal(minutes, kg, rpe = 7, met) {
  const m = met || Math.min(6.5, Math.max(3, 3.5 + (rpe - 5) * 0.5));
  return Math.round(m * (kg || 70) * (minutes / 60));
}

function sessionMinutes(day) {
  const blocksSec = day.blocks.reduce((s, b) => s + estSeconds(b) + 30, 0);
  const warm = 5 * 60;
  const cool = day.cooldown.length * 45;
  const fin = day.finisher ? day.finisher.minutes * 60 : 0;
  return Math.round((blocksSec + warm + cool + fin) / 60);
}

// ───────── generación ─────────
export function maxDaysFor(level) { return level === 1 ? 4 : level === 2 ? 5 : 6; }

export function generatePlan(a, opts = {}) {
  const ev = evaluate(a);
  const equip = new Set(a.equipment || []);
  const injuries = a.injuries || [];
  const prefs = opts.prefs || new Map();
  const recent = new Set(opts.recent || []);
  const seed = opts.seed ?? Math.floor(Math.random() * 1e9);
  const rand = rng(seed);
  const goal = a.goal || 'health';
  const notes = [];

  const wanted = (a.weekdays && a.weekdays.length ? [...a.weekdays].sort() : [1, 3, 5]);
  const maxDays = maxDaysFor(ev.level);
  let trainDays = wanted;
  if (wanted.length > maxDays) {
    trainDays = pickSpread(wanted, maxDays);
    notes.push(`Para tu nivel te recomiendo máximo ${maxDays} días de entrenamiento por semana: así recuperas y progresas mejor.`);
  }
  const n = trainDays.length;
  const budget = Math.max(15, (a.minutes || 45) - 5 - (a.minutes >= 45 ? 4 : 2)) * 60;
  const planCount = new Map();
  const missed = new Set();
  const ctxBase = { a, ev, equip, injuries, prefs, recent, rand, planCount };

  const focusPatterns = (a.focus || []).flatMap((f) => FOCUS.find((x) => x.id === f)?.p || []);
  const build = (split) => { planCount.clear(); missed.clear(); return split.map((tpl, i) => {
    const used = new Set();
    const ctx = { ...ctxBase, used };
    const picks = [];
    // slots base + énfasis personal
    const slots = tpl.slots.map((s) => ({ ...s }));
    const extra = [];
    for (const p of focusPatterns) {
      const inKind = (tpl.kind === 'upper' && ['fly', 'push_h', 'pull_h', 'rear_delt', 'lat_raise', 'push_v', 'biceps', 'triceps'].includes(p)) ||
        (tpl.kind === 'lower' && ['glute', 'hamstring', 'squat', 'lunge'].includes(p)) ||
        (tpl.kind === 'full') || p === 'core';
      if (inKind && !extra.some((x) => x.p[0] === p) && extra.length < 2) extra.push(S(p, 'acc'));
    }
    const ordered = [...slots.map((s, idx) => ({ s, idx, pri: s.role === 'main' ? 0 : s.role === 'core' ? 2 : 1 })),
      ...extra.map((s, k) => ({ s, idx: 100 + k, pri: 1.5 }))].sort((x, y) => x.pri - y.pri || x.idx - y.idx);
    let total = 0;
    for (const { s, idx } of ordered) {
      const e = pickExercise(s, ctx);
      if (!e) { if (s.role === 'main') missed.add(PATTERN_LABEL[s.p[0]]); continue; }
      const pr = prescribe(e, s.role, goal, ev.level, picks.filter((x) => x.role === 'main').length);
      const block = { exId: e.id, role: s.role, ...pr, uni: !!e.uni, _idx: idx };
      const sec = estSeconds(block) + 30;
      if (picks.length >= 3 && total + sec > budget) continue;
      used.add(e.id);
      planCount.set(e.id, (planCount.get(e.id) || 0) + 1);
      total += sec;
      picks.push(block);
    }
    picks.sort((x, y) => x._idx - y._idx).forEach((b) => delete b._idx);
    // el core al final siempre; los de énfasis van antes del core
    picks.sort((x, y) => (EX[x.exId].pattern === 'core') - (EX[y.exId].pattern === 'core'));
    const day = {
      id: `d${i + 1}`, key: tpl.id, label: tpl.label, icon: tpl.icon, kind: tpl.kind,
      warmup: buildWarmup(tpl.kind, ctx), blocks: picks, cooldown: buildCooldown(picks),
      finisher: buildFinisher({ ...ctx }, goal),
    };
    day.estMin = sessionMinutes(day);
    day.estKcal = estKcal(day.estMin, a.weight_kg, 7, day.finisher ? 5.5 : undefined);
    return day;
  }); };
  let days = build(SPLITS[n]);
  let split = SPLITS[n];
  if (n >= 4 && days.some((d) => d.blocks.length < 3)) {
    const cyc = [TEMPLATES.FULL_A, TEMPLATES.FULL_B, TEMPLATES.FULL_C];
    split = Array.from({ length: n }, (_, i) => cyc[i % 3]);
    days = build(split);
    notes.push('Con tu equipo actual rinde más entrenar el cuerpo completo cada día. Si consigues más equipo, rehaz tu evaluación.');
  }

  // calendario semanal
  const week = [1, 2, 3, 4, 5, 6, 7].map((dow) => {
    const idx = trainDays.indexOf(dow);
    return idx >= 0 ? { dow, dayId: days[idx].id } : { dow, dayId: null };
  });

  if (missed.size) notes.push(`Con tu equipo y tus molestias no pude incluir: ${[...missed].join(', ').toLowerCase()}. Si puedes, suma equipo o consulta a un profesional de salud para alternativas adaptadas.`);
  if (injuries.length) notes.push(`Excluí ejercicios que pueden molestar: ${injuries.map((i) => i.replace('_', ' ')).join(', ')}. Si algo duele (dolor, no cansancio), para y avísame para cambiarlo.`);
  if (a.medical) notes.push('Mencionaste una condición médica: empezamos suave. Consulta con tu médico antes de aumentar la intensidad.');
  if (goal === 'lose_fat') notes.push('Para perder grasa, la rutina es solo una parte: tu déficit calórico en Fitia hace el resto. Mantén la proteína alta para conservar el músculo.');
  if (goal === 'build_muscle') notes.push('Para ganar músculo necesitas comer en leve superávit y proteína suficiente en Fitia. Duerme 7–9 horas.');

  const titleBy = { lose_fat: 'Plan para perder grasa', build_muscle: 'Plan para ganar músculo', tone: 'Plan de tonificación', strength: 'Plan de fuerza', health: 'Plan de salud y energía' };
  return {
    version: 1,
    seed,
    createdAt: new Date().toISOString(),
    cycle: { start: localISO(), weeks: 6 },
    summary: {
      title: titleBy[goal],
      level: ev.level,
      daysPerWeek: n,
      split: split[0].kind === 'full' ? 'Cuerpo completo' : n === 4 ? 'Tren superior / inferior' : n === 5 ? 'Híbrido empuje-tirón-piernas' : 'Empuje · Tirón · Piernas',
      notes,
    },
    week,
    days,
  };
}

function pickSpread(arr, k) {
  const out = [];
  for (let i = 0; i < k; i++) out.push(arr[Math.round((i * (arr.length - 1)) / Math.max(1, k - 1))]);
  return [...new Set(out)];
}

// ───────── helpers sobre un plan ─────────
export function dayById(plan, id) { return plan.days.find((d) => d.id === id); }

export function todayEntry(plan, date = new Date()) {
  const dow = date.getDay() === 0 ? 7 : date.getDay();
  const w = plan.week.find((x) => x.dow === dow);
  return { dow, dayId: w?.dayId || null, day: w?.dayId ? dayById(plan, w.dayId) : null };
}

export function weekInfo(plan, date = new Date()) {
  const start = new Date(plan.cycle.start + 'T00:00:00');
  const w = Math.floor((date - start) / (7 * 864e5)) + 1;
  const total = plan.cycle.weeks;
  const manual = plan.deloadUntil && localISO(date) <= plan.deloadUntil;
  return { week: Math.max(1, w), total, deload: w >= total || !!manual, over: w > total };
}

export function applyDeload(block, on) {
  if (!on) return block;
  return { ...block, sets: Math.max(2, block.sets - 1) };
}

// Alternativas para cambiar un ejercicio del plan
export function alternatives(plan, dayId, exId, a, prefs) {
  const e = EX[exId];
  const ev = evaluate(a);
  const equip = new Set(a.equipment || []);
  const day = dayById(plan, dayId);
  const inDay = new Set(day.blocks.map((b) => b.exId));
  return EXERCISES.filter((x) => x.pattern === e.pattern && x.id !== exId && !inDay.has(x.id) && usable(x, equip, a.injuries || []) &&
    x.level <= levelCap(x, ev) && prefs.get(x.id) !== 'avoid');
}

export function swapExercise(plan, dayId, oldId, newId, a) {
  const day = dayById(plan, dayId);
  const ev = evaluate(a);
  const b = day.blocks.find((x) => x.exId === oldId);
  const e = EX[newId];
  const role = b.role || 'acc';
  const pr = prescribe(e, role, a.goal || 'health', ev.level);
  Object.keys(b).forEach((k) => delete b[k]);
  Object.assign(b, { exId: newId, role, ...pr, uni: !!e.uni });
  day.cooldown = buildCooldown(day.blocks);
  day.estMin = sessionMinutes(day);
  return plan;
}

export { sessionMinutes, prescribe, levelCap };
