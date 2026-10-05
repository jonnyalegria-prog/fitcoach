import { generatePlan } from '../js/planner.js';
import { reviewPlan, suggestNext, applyAction } from '../js/coach.js';
import { EX } from '../js/exercises.js';

const a = { goal: 'lose_fat', experience: 'm6_24', tests: { pushups: 20, squats: 30, plank: 60 }, weekdays: [1, 3, 5], minutes: 45,
  equipment: ['dumbbell', 'bench', 'band'], injuries: [], weight_kg: 80, kcal_target: 2000, cardio_pref: 'neutral', focus: [] };
const plan = generatePlan(a, { seed: 3 });
const day = (n) => new Date(Date.now() - n * 864e5);
const dbEx = plan.days[0].blocks.find((b) => ['dumbbell'].some((t) => EX[b.exId].equip.includes(t))) || plan.days[0].blocks[0];

// Escenario 1: entrena mucho, esfuerzo alto, pierde peso muy rápido
const logs = [];
for (let i = 0; i < 6; i++) logs.push({ started_at: day(i * 2).toISOString(), rpe: 9.5, entries: [{ exId: dbEx.exId, sets: [{ reps: dbEx.reps?.[0] || 10, weight: 20, done: true }, { reps: dbEx.reps?.[0] || 10, weight: 20, done: true }] }] });
const checkins = [];
for (let i = 0; i < 28; i += 3) checkins.push({ date: day(i).toISOString().slice(0, 10), weight_kg: 80 - (28 - i) * 0.2, calories: 2400, energy: 2, soreness: 4 });
const rv = reviewPlan({ plan, a, logs, checkins });
console.log('ESC1 stats', rv.stats);
rv.items.forEach((i) => console.log(' -', i.tone, i.title, i.action ? `[${i.action.type}]` : ''));

// Escenario 2: casi no entrena
const plan2 = { ...plan, createdAt: day(20).toISOString() };
const rv2 = reviewPlan({ plan: plan2, a, logs: [{ started_at: day(5).toISOString(), rpe: 7, entries: [] }], checkins: [] });
rv2.items.forEach((i) => console.log('ESC2 -', i.tone, i.title, i.action ? `[${i.action.type}]` : ''));

// Progresión de carga
const blk = { exId: dbEx.exId, sets: 3, reps: [8, 12], rest: 60, role: 'main' };
const L = (reps, w) => ({ started_at: day(3).toISOString(), entries: [{ exId: blk.exId, sets: reps.map((r) => ({ reps: r, weight: w, done: true })) }] });
console.log('PROG todo en el tope  ->', JSON.stringify(suggestNext(blk, [L([12, 12, 12], 20)])));
console.log('PROG a medias         ->', JSON.stringify(suggestNext(blk, [L([10, 9, 8], 20)])));
console.log('PROG sin historial    ->', JSON.stringify(suggestNext(blk, [])));
const bw = { exId: 'flexiones_rodillas', sets: 3, reps: [8, 15], rest: 60 };
const Lb = (r) => ({ started_at: day(2).toISOString(), entries: [{ exId: 'flexiones_rodillas', sets: r.map((x) => ({ reps: x, weight: 0, done: true })) }] });
console.log('PROG bw 2 veces tope  ->', JSON.stringify(suggestNext(bw, [Lb([15, 15, 15]), Lb([15, 15, 15])])));

// Aplicar ajustes
for (const act of [{ type: 'volume', delta: -1 }, { type: 'cardio', delta: 1 }, { type: 'fewer_days' }, { type: 'renew' }, { type: 'deload' }, { type: 'shorter' }]) {
  const r = applyAction(plan, a, act, { prefs: new Map() });
  console.log('APPLY', act.type, '→ días', r.plan.days.length, 'sets d1', r.plan.days[0].blocks.map((b) => b.sets).join(','), 'fin', !!r.plan.days[0].finisher, 'deloadUntil', r.plan.deloadUntil || '-', 'min', r.assessment.minutes);
}
