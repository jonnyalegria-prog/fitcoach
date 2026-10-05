import { generatePlan, evaluate } from '../js/planner.js';
import { EX } from '../js/exercises.js';
const show = (name, a) => {
  const p = generatePlan(a, { seed: 7 });
  console.log('\n=== ' + name, JSON.stringify(evaluate(a)));
  console.log(p.summary.title, '|', p.summary.split, '|', p.summary.notes.length, 'notas');
  for (const d of p.days.slice(0,3)) {
    console.log(' ', d.label, `(${d.estMin} min, ${d.estKcal} kcal)`);
    for (const b of d.blocks) console.log('    -', EX[b.exId].name, b.sets+'x'+(b.secs? b.secs+'s' : b.reps.join('-')), b.rest+'s');
    console.log('    fin:', d.finisher ? d.finisher.title + ' ' + d.finisher.minutes + 'm ' + d.finisher.items.map(i=>EX[i.exId].name).join(',') : '-');
  }
};
show('Principiante en casa sin equipo, bajar grasa, rodilla', {goal:'lose_fat',experience:'never',tests:{pushups:2,squats:8,plank:15},weekdays:[1,3,5],minutes:30,equipment:[],injuries:['rodilla'],weight_kg:80,cardio_pref:'neutral'});
show('Intermedio gym, músculo, 4 días', {goal:'build_muscle',experience:'m6_24',tests:{pushups:20,squats:30,plank:60},weekdays:[1,2,4,5],minutes:60,equipment:['dumbbell','band','bench','pullup','kettlebell','barbell','machine'],injuries:[],weight_kg:75,focus:['brazos','gluteos']});
show('Casa mancuernas+banda, tonificar', {goal:'tone',experience:'lt6',tests:{pushups:8,squats:20,plank:30},weekdays:[2,4,6],minutes:45,equipment:['dumbbell','band','bench'],injuries:['hombro'],weight_kg:62});
