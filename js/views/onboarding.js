import * as api from '../api.js';
import { h, ICON, chip, field, stepper, sheet, toast } from '../ui.js';
import { EQUIPMENT, INJURIES } from '../exercises.js';
import { GOALS, FOCUS, DOW, evaluate, maxDaysFor, generatePlan } from '../planner.js';
import { go } from '../nav.js';
import { num, fmtTime, todayStr } from '../util.js';

const ALL_EQUIP = EQUIPMENT.map((e) => e.id);
const EXPERIENCE = [
  { id: 'never', icon: '🌱', t: 'Nunca he entrenado', d: 'Estoy empezando desde cero' },
  { id: 'lt6', icon: '🚶', t: 'Menos de 6 meses', d: 'He probado, pero sin constancia' },
  { id: 'm6_24', icon: '🏃', t: 'Entre 6 meses y 2 años', d: 'Entreno con cierta regularidad' },
  { id: 'gt24', icon: '🏆', t: 'Más de 2 años', d: 'Tengo experiencia sólida' },
];

export function render({ edit = false } = {}) {
  const prev = api.S.profile?.assessment || {};
  const A = {
    goal: null, experience: null, age: '', height_cm: '', weight_kg: '', target_weight: '', kcal_target: '',
    tests: { pushups: 0, squats: 0, plank: 0 }, place: 'home', equipment: [], weekdays: [1, 3, 5], minutes: 45,
    injuries: [], medical: false, cardio_pref: 'neutral', focus: [],
    ...JSON.parse(JSON.stringify(prev)),
  };
  A.tests = { pushups: 0, squats: 0, plank: 0, ...(prev.tests || {}) };
  const name = api.S.profile?.name || '';

  const root = h('div', { class: 'fade-in' });
  let i = 0;

  const steps = [
    {
      title: `¡Hola${name ? ', ' + name : ''}! 👋`,
      sub: 'Voy a hacerte unas preguntas para armar una rutina solo para ti. Toma unos 3 minutos y puedes cambiar todo después.',
      body: () => h('div', { class: 'stack' },
        h('div', { class: 'banner' }, h('span', { class: 'bi' }, '💡'), h('div', null, h('b', null, 'Sé sincero/a'), 'Mientras más real sea lo que respondas, mejor será tu plan. No hay respuestas buenas o malas.')),
        h('div', { class: 'card flat stack s2' },
          h('div', { class: 'row' }, h('span', null, '1️⃣'), h('span', null, 'Tu meta y tu punto de partida')),
          h('div', { class: 'row' }, h('span', null, '2️⃣'), h('span', null, 'Un mini test de fuerza (sin equipo)')),
          h('div', { class: 'row' }, h('span', null, '3️⃣'), h('span', null, 'Tu equipo, tiempo y molestias')))),
      valid: () => true,
    },
    {
      title: '¿Cuál es tu meta principal?', sub: 'Elige la que más te importa ahora.',
      body: (re) => h('div', { class: 'stack s2' }, GOALS.map((g) =>
        h('button', { class: 'choice' + (A.goal === g.id ? ' on' : ''), onclick: () => { A.goal = g.id; re(); } },
          h('span', { class: 'ci' }, g.icon), h('div', null, h('b', null, g.label), h('span', { class: 'd' }, g.desc))))),
      valid: () => !!A.goal || 'Elige una meta.',
    },
    {
      title: 'Cuéntame de ti', sub: 'Solo para calcular tu progreso y calorías. Se queda en tu cuenta.',
      body: () => {
        const mk = (key, ph, hint, mode = 'numeric') => h('input', { type: 'text', inputMode: mode, placeholder: ph, value: A[key] ?? '', oninput: (e) => { A[key] = e.target.value; } });
        return h('div', { class: 'stack' },
          h('div', { class: 'grid2' }, field('Edad', mk('age', 'años')), field('Estatura (cm)', mk('height_cm', 'ej. 170'))),
          h('div', { class: 'grid2' }, field('Peso actual (kg)', mk('weight_kg', 'ej. 72,5', '', 'decimal')), field('Peso meta (kg)', mk('target_weight', 'opcional', '', 'decimal'))),
          field('Calorías diarias de tu meta en Fitia', mk('kcal_target', 'opcional, ej. 2000'), 'Así comparo lo que comes con tu objetivo y ajusto tu plan.'));
      },
      valid: () => {
        const age = num(A.age), w = num(A.weight_kg);
        if (!age || age < 14 || age > 90) return 'Escribe tu edad (14 a 90).';
        if (!w || w < 30 || w > 300) return 'Escribe tu peso actual en kg.';
        return true;
      },
    },
    {
      title: '¿Cuánta experiencia tienes?', sub: 'Entrenando con pesas o ejercicio de fuerza.',
      body: (re) => h('div', { class: 'stack s2' }, EXPERIENCE.map((x) =>
        h('button', { class: 'choice' + (A.experience === x.id ? ' on' : ''), onclick: () => { A.experience = x.id; re(); } },
          h('span', { class: 'ci' }, x.icon), h('div', null, h('b', null, x.t), h('span', { class: 'd' }, x.d))))),
      valid: () => !!A.experience || 'Elige una opción.',
    },
    {
      title: 'Mini test de fuerza 💥', sub: 'Con esto sé desde dónde partir. Hazlos con buena técnica y para cuando sientas que no puedes más con buena forma. Si algo te molesta o no te animas, deja 0.',
      body: () => h('div', { class: 'stack' },
        testCard('Flexiones de brazos', 'En el suelo, cuerpo recto, pecho casi al piso. ¿Cuántas seguidas?', 'pushups', 60),
        testCard('Sentadillas', 'Sin peso, bajando a 90° o más. ¿Cuántas seguidas?', 'squats', 100),
        plankCard()),
      valid: () => true,
    },
    {
      title: '¿Dónde y con qué entrenas?', sub: 'Marca todo lo que tienes a mano. Si no tienes nada, ¡también hay rutina!',
      body: (re) => h('div', { class: 'stack' },
        h('div', { class: 'seg' }, [['home', '🏠 Casa'], ['gym', '🏋️ Gimnasio'], ['both', 'Ambos']].map(([id, l]) =>
          h('button', { class: A.place === id ? 'on' : '', onclick: () => { A.place = id; if (id === 'gym') A.equipment = [...ALL_EQUIP]; re(); } }, l))),
        h('div', { class: 'chips' }, EQUIPMENT.map((e) => chip(e.label, {
          icon: e.icon, on: A.equipment.includes(e.id),
          onclick: () => { A.equipment = A.equipment.includes(e.id) ? A.equipment.filter((x) => x !== e.id) : [...A.equipment, e.id]; re(); },
        }))),
        h('button', { class: 'link', onclick: () => { A.equipment = A.equipment.length === ALL_EQUIP.length ? [] : [...ALL_EQUIP]; re(); } },
          A.equipment.length === ALL_EQUIP.length ? 'Quitar todo' : 'Tengo gimnasio completo'),
        !A.equipment.length && h('p', { class: 'muted small' }, 'Sin equipo: usaré tu peso corporal. Una silla o mesa firme ayuda mucho.')),
      valid: () => true,
    },
    {
      title: '¿Cuándo puedes entrenar?', sub: 'Elige los días y cuánto tiempo tienes por sesión.',
      body: (re) => {
        const lvl = evaluate(A).level, max = maxDaysFor(lvl);
        return h('div', { class: 'stack s3' },
          h('div', { class: 'stack s2' },
            h('div', { class: 'chips' }, [1, 2, 3, 4, 5, 6, 7].map((d) => chip(DOW[d], {
              on: A.weekdays.includes(d),
              onclick: () => { A.weekdays = A.weekdays.includes(d) ? A.weekdays.filter((x) => x !== d) : [...A.weekdays, d].sort(); re(); },
            }))),
            h('p', { class: 'muted small' }, `${A.weekdays.length} día${A.weekdays.length === 1 ? '' : 's'} por semana. Para tu nivel recomiendo entre 2 y ${max}.`)),
          h('div', { class: 'stack s2' }, h('span', { class: 'field-l' }, 'Tiempo por sesión'),
            h('div', { class: 'chips' }, [20, 30, 45, 60, 75].map((m) => chip(`${m} min`, { on: A.minutes === m, onclick: () => { A.minutes = m; re(); } })))));
      },
      valid: () => A.weekdays.length >= 1 || 'Elige al menos 1 día.',
    },
    {
      title: '¿Tienes alguna molestia?', sub: 'Evitaré los ejercicios que puedan afectarte. Marca las zonas donde sientas dolor o lesión.',
      body: (re) => h('div', { class: 'stack s3' },
        h('div', { class: 'chips' },
          chip('Ninguna', { on: !A.injuries.length, onclick: () => { A.injuries = []; re(); } }),
          INJURIES.map((x) => chip(x.label, { on: A.injuries.includes(x.id), onclick: () => { A.injuries = A.injuries.includes(x.id) ? A.injuries.filter((i2) => i2 !== x.id) : [...A.injuries, x.id]; re(); } }))),
        h('button', { class: 'choice' + (A.medical ? ' on' : ''), onclick: () => { A.medical = !A.medical; re(); } },
          h('span', { class: 'ci' }, A.medical ? '☑️' : '⬜'),
          h('div', null, h('b', null, 'Tengo una condición médica'), h('span', { class: 'd' }, 'Corazón, presión alta, diabetes, embarazo, cirugía reciente u otra.'))),
        A.medical && h('div', { class: 'banner warn' }, h('span', { class: 'bi' }, '🩺'), h('div', null, h('b', null, 'Consulta con tu médico'), 'Empezaré con una rutina suave. Antes de subir la intensidad, pide la aprobación de tu médico.'))),
      valid: () => true,
    },
    {
      title: 'Últimos detalles', sub: 'Para que la rutina sea de las que sí vas a hacer.',
      body: (re) => h('div', { class: 'stack s3' },
        h('div', { class: 'stack s2' }, h('span', { class: 'field-l' }, '¿Qué tal el cardio?'),
          h('div', { class: 'seg' }, [['like', 'Me gusta'], ['neutral', 'Normal'], ['dislike', 'Lo evito']].map(([id, l]) =>
            h('button', { class: A.cardio_pref === id ? 'on' : '', onclick: () => { A.cardio_pref = id; re(); } }, l)))),
        h('div', { class: 'stack s2' }, h('span', { class: 'field-l' }, 'Zonas que quieres priorizar (hasta 2)'),
          h('div', { class: 'chips' }, FOCUS.map((f) => chip(f.label, {
            on: A.focus.includes(f.id),
            onclick: () => { A.focus = A.focus.includes(f.id) ? A.focus.filter((x) => x !== f.id) : [...A.focus, f.id].slice(-2); re(); },
          }))))),
      valid: () => true,
    },
  ];

  function testCard(title, desc, key, max) {
    return h('div', { class: 'test-card' }, h('div', null, h('b', null, title), h('p', { class: 'muted small' }, desc)),
      stepper({ value: +A.tests[key] || 0, min: 0, max, onChange: (v) => { A.tests[key] = v; } }));
  }
  function plankCard() {
    const st = stepper({ value: +A.tests.plank || 0, min: 0, max: 300, step: 5, unit: ' s', onChange: (v) => { A.tests.plank = v; } });
    return h('div', { class: 'test-card' },
      h('div', null, h('b', null, 'Plancha'), h('p', { class: 'muted small' }, 'Sobre antebrazos y puntas de pies, cuerpo recto. ¿Cuántos segundos aguantas?')),
      st, h('button', { class: 'btn soft small', onclick: () => stopwatch((s) => { A.tests.plank = s; draw(); }) }, '⏱ Cronometrar'));
  }
  function stopwatch(done) {
    let t0 = 0, raf = 0, val = 0;
    const out = h('div', { class: 'h1 center', style: { fontSize: '56px', fontVariantNumeric: 'tabular-nums' } }, '0:00');
    const btn = h('button', { class: 'btn primary big' }, 'Iniciar');
    const use = h('button', { class: 'btn soft', disabled: true }, 'Usar este tiempo');
    const s = sheet('Cronómetro', h('div', { class: 'stack' }, out, btn, use), { onClose: () => cancelAnimationFrame(raf) });
    const tick = () => { val = (performance.now() - t0) / 1000; out.textContent = fmtTime(val); raf = requestAnimationFrame(tick); };
    btn.onclick = () => {
      if (!t0 || btn.dataset.run !== '1') { t0 = performance.now(); btn.dataset.run = '1'; btn.textContent = 'Detener'; use.disabled = true; tick(); }
      else { cancelAnimationFrame(raf); btn.dataset.run = '0'; btn.textContent = 'Reiniciar'; use.disabled = false; }
    };
    use.onclick = () => { done(Math.round(val)); s.close(); };
  }

  function draw() {
    const st = steps[i];
    const last = i === steps.length - 1;
    const re = () => draw();
    root.replaceChildren(
      h('div', { class: 'wiz-top' },
        i > 0 || edit ? h('button', { class: 'icon-btn', 'aria-label': 'Atrás', onclick: () => (i > 0 ? (i--, draw()) : go('perfil')), html: ICON.back }) : h('span', { style: { width: '40px' } }),
        h('div', { class: 'bar-track' }, h('div', { class: 'bar-fill', style: { width: ((i + 1) / steps.length) * 100 + '%' } })),
        h('span', { class: 'small muted' }, `${i + 1}/${steps.length}`)),
      h('div', { class: 'stack s3' },
        h('div', { class: 'stack s2' }, h('h1', { class: 'h1' }, st.title), st.sub && h('p', { class: 'muted' }, st.sub)),
        st.body(re)),
      h('div', { class: 'wiz-foot' },
        h('button', { class: 'btn primary big', onclick: () => next() }, last ? '✨ Crear mi rutina' : i === 0 ? 'Empezar' : 'Continuar')));
    window.scrollTo(0, 0);
  }

  function next() {
    const v = steps[i].valid();
    if (v !== true) return toast(v, 'bad');
    if (i < steps.length - 1) { i++; draw(); } else finish();
  }

  function finish() {
    root.replaceChildren(h('div', { class: 'stack center', style: { paddingTop: '30vh' } },
      h('div', { class: 'spin' }), h('h2', { class: 'h2' }, 'Diseñando tu rutina…'), h('p', { class: 'muted' }, 'Analizando tu nivel, equipo y tiempo disponible')));
    const clean = {
      ...A, age: num(A.age), height_cm: num(A.height_cm), weight_kg: num(A.weight_kg),
      target_weight: num(A.target_weight), kcal_target: num(A.kcal_target), evaluatedAt: new Date().toISOString(),
    };
    setTimeout(() => {
      try {
        const ev = evaluate(clean);
        clean.level = ev.level;
        api.saveProfile({ assessment: clean });
        const plan = generatePlan(clean, { prefs: api.S.prefs });
        api.savePlan(plan, edit ? 'reassessed' : 'generated');
        // registra el peso de partida
        if (clean.weight_kg) api.upsertCheckin({ date: todayStr(), weight_kg: clean.weight_kg });
        showResult(plan, ev);
      } catch (e) {
        console.error(e);
        toast('No pude crear la rutina. Revisa tus respuestas.', 'bad');
        i = steps.length - 1; draw();
      }
    }, 900);
  }

  function showResult(plan, ev) {
    const lvlName = ['', 'Principiante', 'Intermedio', 'Avanzado'][ev.level];
    root.replaceChildren(
      h('div', { class: 'stack s3 center', style: { paddingTop: '8vh' } },
        h('div', { style: { fontSize: '64px' } }, '🎉'),
        h('h1', { class: 'h1' }, '¡Tu rutina está lista!'),
        h('div', { class: 'card stack s2', style: { textAlign: 'left' } },
          h('div', { class: 'h3' }, plan.summary.title),
          h('div', { class: 'chips' },
            h('span', { class: 'tag acc' }, `Nivel: ${lvlName}`),
            h('span', { class: 'tag acc' }, `${plan.summary.daysPerWeek} días/semana`),
            h('span', { class: 'tag acc' }, plan.summary.split)),
          h('p', { class: 'muted small' }, 'Cada ejercicio trae instrucciones paso a paso. Mientras entrenes, voy aprendiendo y ajustando tu plan.')),
        plan.summary.notes.map((n) => h('div', { class: 'banner' }, h('span', { class: 'bi' }, '💬'), h('div', null, n))),
        h('button', { class: 'btn primary big', onclick: () => go('hoy') }, 'Ir a mi día de hoy')));
  }

  draw();
  return root;
}
