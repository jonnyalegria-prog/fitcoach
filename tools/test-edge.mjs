import { generatePlan } from '../js/planner.js';
import { EX } from '../js/exercises.js';
const base = { experience: 'never', tests: { pushups: 0, squats: 0, plank: 0 }, minutes: 30, injuries: [], weight_kg: 70, cardio_pref: 'neutral', focus: [] };
const cases = {
  'sin equipo 4 días': { ...base, goal: 'build_muscle', weekdays: [1, 2, 4, 6], equipment: [] },
  'sin equipo 6 días principiante': { ...base, goal: 'lose_fat', weekdays: [1, 2, 3, 4, 5, 6], equipment: [] },
  'solo banda 5 días': { ...base, experience: 'm6_24', tests: { pushups: 15, squats: 30, plank: 60 }, goal: 'tone', weekdays: [1, 2, 3, 4, 5], equipment: ['band'] },
  'mancuernas, hombro+muñeca+espalda': { ...base, experience: 'lt6', tests: { pushups: 10, squats: 20, plank: 30 }, goal: 'strength', weekdays: [2, 4], equipment: ['dumbbell', 'bench'], injuries: ['hombro', 'muñeca', 'espalda_baja'], minutes: 20 },
  'todas las lesiones, sin equipo': { ...base, goal: 'health', weekdays: [1, 3, 5], equipment: [], injuries: ['rodilla', 'espalda_baja', 'hombro', 'muñeca', 'codo', 'cadera', 'tobillo', 'cuello'] },
};
for (const [k, a] of Object.entries(cases)) {
  const p = generatePlan(a, { seed: 11 });
  console.log(`\n== ${k}: ${p.summary.split}, ${p.summary.daysPerWeek} días`, p.summary.notes.length ? '(' + p.summary.notes.length + ' notas)' : '');
  for (const d of p.days) console.log('  ', d.label.padEnd(20), d.blocks.length, 'ej,', d.estMin, 'min:', d.blocks.map((b) => EX[b.exId].name.split(' ').slice(0, 3).join(' ')).join(' / '));
}
