import * as api from '../api.js';
import { h, ICON, tag, toast, ask, beep, stepper } from '../ui.js';
import { EX } from '../exercises.js';
import { dayById, weekInfo, applyDeload, estKcal, isLoadable } from '../planner.js';
import { suggestNext, history, e1rm } from '../coach.js';
import { openExercise, presc } from './exercise-sheet.js';
import { go } from '../nav.js';
import { fmtTime, num, fmtKg } from '../util.js';

// ───────── temporizadores (descanso / cuenta regresiva) ─────────
let timer = null;
function stopTimer() {
  if (!timer) return;
  clearInterval(timer.iv); timer.el.remove(); timer = null;
}
function startRest(secs, onDone) {
  stopTimer();
  const t = { end: Date.now() + secs * 1000, total: secs, finished: false };
  const tm = h('div', { class: 'tm' }, fmtTime(secs));
  const bar = h('i', { style: { width: '100%' } });
  t.el = h('div', { id: 'timer', role: 'timer', 'aria-live': 'off' },
    h('div', { class: 'grow' }, h('div', { class: 'tl' }, 'Descanso'), tm),
    h('button', { class: 'btn', onclick: () => { t.end += 15000; t.total += 15; } }, '+15 s'),
    h('button', { class: 'btn', onclick: () => stopTimer() }, 'Saltar'),
    h('div', { class: 'tbar' }, bar));
  document.body.append(t.el);
  t.iv = setInterval(() => {
    const left = Math.ceil((t.end - Date.now()) / 1000);
    if (left <= 0 && !t.finished) {
      t.finished = true; beep(880, 180, 2); tm.textContent = '¡Vamos!';
      setTimeout(() => { if (timer === t) stopTimer(); }, 1800); onDone?.();
    } else if (!t.finished) { tm.textContent = fmtTime(left); bar.style.width = Math.max(0, (left / t.total) * 100) + '%'; }
  }, 250);
  timer = t;
}

// Cuenta regresiva a pantalla completa (planchas, circuitos, cardio)
function runSequence(segments, title, onDone) {
  const total = segments.reduce((s, x) => s + x.secs, 0);
  const t0 = Date.now();
  const lbl = h('div', { class: 'h1 center' }), big = h('div', { class: 'h1 center', style: { fontSize: '88px', fontVariantNumeric: 'tabular-nums' } });
  const nxt = h('p', { class: 'muted center' }), prog = h('div', { class: 'bar-fill', style: { width: '0%' } });
  const el = h('div', { class: 'seq' },
    h('div', { class: 'stack s3', style: { width: '100%', maxWidth: '480px' } },
      h('div', { class: 'up center' }, title), lbl, big, nxt, h('div', { class: 'bar-track' }, prog),
      h('button', { class: 'btn ghost', onclick: () => end(false) }, 'Detener')));
  document.body.append(el); document.body.classList.add('noscroll');
  let last = -1, finished = false;
  const iv = setInterval(tick, 250);
  function pos() {
    let el2 = (Date.now() - t0) / 1000, i = 0;
    while (i < segments.length && el2 >= segments[i].secs) { el2 -= segments[i].secs; i++; }
    return { i, left: i < segments.length ? segments[i].secs - el2 : 0 };
  }
  function tick() {
    const { i, left } = pos();
    if (i >= segments.length) return end(true);
    if (i !== last) { last = i; beep(segments[i].rest ? 520 : 880, 150, 1); }
    lbl.textContent = segments[i].label;
    el.dataset.rest = segments[i].rest ? '1' : '0';
    big.textContent = fmtTime(Math.ceil(left));
    nxt.textContent = segments[i + 1] ? `Sigue: ${segments[i + 1].label}` : 'Último tramo';
    prog.style.width = Math.min(100, ((Date.now() - t0) / 1000 / total) * 100) + '%';
  }
  function end(ok) {
    if (finished) return; finished = true;
    clearInterval(iv); el.remove(); document.body.classList.remove('noscroll');
    if (ok) { beep(988, 250, 3); onDone?.(); }
  }
  tick();
}

// ───────── pantalla ─────────
export function render(dayId) {
  const plan = api.S.plan;
  const day = plan && dayById(plan, dayId);
  if (!day) return h('div', { class: 'card stack' }, h('p', null, 'No encontré ese entrenamiento.'), h('button', { class: 'btn', onclick: () => go('hoy') }, 'Volver'));
  const a = api.S.profile.assessment;
  const wi = weekInfo(plan);
  const blocks = day.blocks.map((b) => applyDeload(b, wi.deload));
  const root = h('div', { class: 'fade-in' });
  stopTimer();

  const hasWarm = day.warmup.length > 0;
  const steps = [];
  if (hasWarm) steps.push({ type: 'warmup' });
  blocks.forEach((_, i) => steps.push({ type: 'ex', i }));
  if (day.finisher) steps.push({ type: 'finisher' });
  steps.push({ type: 'cooldown' }, { type: 'finish' });

  // ── estado (con borrador para no perder el avance)
  const saved = api.draft.get();
  let W = saved && saved.dayId === dayId ? saved : null;
  const fresh = () => ({ dayId, startedAt: Date.now(), step: 0, entries: blocks.map(() => null), checks: {}, finisherDone: false });
  W = W || fresh();
  if (W.entries.length !== blocks.length) W = fresh();
  W.step = Math.min(W.step, steps.length - 1);
  const persist = () => api.draft.set(W);

  function entryFor(i) {
    const b = blocks[i];
    if (W.entries[i] && W.entries[i].exId === b.exId) return W.entries[i];
    const e = EX[b.exId];
    const sg = suggestNext(b, api.S.logs);
    const lastSets = history(api.S.logs, b.exId, 1)[0]?.sets || [];
    const mk = (n) => {
      const ls = lastSets[n] || lastSets[lastSets.length - 1];
      const target = b.secs ?? (sg.reps ?? ls?.reps ?? b.reps[0]);
      return { weight: isLoadable(e) ? (sg.weight ?? (ls?.weight ?? '')) : '', reps: target, done: false };
    };
    W.entries[i] = { exId: b.exId, sg, sets: Array.from({ length: b.sets }, (_, n) => mk(n)) };
    return W.entries[i];
  }

  // cabecera
  const clock = h('span', { class: 'small muted' }, '0:00');
  const tickClock = setInterval(() => {
    if (!root.isConnected) { clearInterval(tickClock); releaseLock(); stopTimer(); return; }
    clock.textContent = fmtTime((Date.now() - W.startedAt) / 1000);
  }, 1000);

  let lock = null;
  const getLock = async () => { try { if (navigator.wakeLock && !lock) { lock = await navigator.wakeLock.request('screen'); lock.addEventListener('release', () => { lock = null; }); } } catch { /* sin permiso */ } };
  const releaseLock = () => { try { lock?.release(); } catch { /* ignorar */ } lock = null; };
  getLock();
  const onVis = () => { if (!root.isConnected) return document.removeEventListener('visibilitychange', onVis); if (!document.hidden) getLock(); };
  document.addEventListener('visibilitychange', onVis);

  async function exit() {
    const started = W.entries.some((e) => e?.sets.some((s) => s.done));
    const ok = await ask({ title: '¿Salir del entrenamiento?', text: started ? 'Tu avance queda guardado y podrás continuar luego.' : 'Aún no registraste series.', ok: 'Salir', cancel: 'Seguir entrenando' });
    if (!ok) return;
    if (!started) api.draft.clear();
    stopTimer(); releaseLock(); go('hoy');
  }

  function header() {
    return h('div', { class: 'wk-head stack s2' },
      h('div', { class: 'row sp' },
        h('button', { class: 'icon-btn', 'aria-label': 'Salir', onclick: exit, html: ICON.close }),
        h('div', { class: 'center' }, h('b', null, day.label), h('div', null, clock)),
        h('span', { style: { width: '40px' } })),
      h('div', { class: 'dots', 'aria-label': `Paso ${W.step + 1} de ${steps.length}` }, steps.map((_, i) => h('i', { class: i < W.step ? 'on' : i === W.step ? 'cur' : '' }))));
  }

  const go2 = (n) => { stopTimer(); W.step = Math.max(0, Math.min(steps.length - 1, n)); persist(); draw(); window.scrollTo(0, 0); };
  const nav = (nextLabel, disabled = false) => h('div', { class: 'row', style: { marginTop: '18px' } },
    W.step > 0 && h('button', { class: 'btn', style: { width: '90px' }, onclick: () => go2(W.step - 1), 'aria-label': 'Anterior' }, '←'),
    h('button', { class: 'btn primary big', disabled, onclick: () => go2(W.step + 1) }, nextLabel));

  // ── checklist (calentamiento / enfriamiento)
  function checklist(items, key, title, sub) {
    const list = h('div', { class: 'card ex-list' }, items.map((it, i) => {
      const k = key + i;
      const row = h('div', { class: 'ex-row' },
        h('button', { class: 'set-ok', style: { width: '44px', height: '44px', flex: 'none' }, 'aria-label': 'Hecho', 'aria-pressed': !!W.checks[k],
          onclick: (ev) => { W.checks[k] = !W.checks[k]; persist(); ev.currentTarget.setAttribute('aria-pressed', !!W.checks[k]); }, html: ICON.check }),
        h('button', { class: 'grow', style: { background: 'none', border: 0, textAlign: 'left' }, onclick: () => openExercise(it.exId) },
          h('div', { class: 'ex-t' }, EX[it.exId].name), h('div', { class: 'ex-s' }, it.secs ? `${it.secs} s${it.uni ? ' por lado' : ''}` : `${it.reps} repeticiones${it.uni ? ' por lado' : ''}`)),
        h('span', { class: 'chev' }, 'ⓘ'));
      return row;
    }));
    return h('div', { class: 'stack s3' }, h('div', null, h('h1', { class: 'h1' }, title), h('p', { class: 'muted' }, sub)), list);
  }

  // ── ejercicio
  function exerciseScreen(i) {
    const b = blocks[i];
    const e = EX[b.exId];
    const en = entryFor(i);
    const loadable = isLoadable(e);
    const timeMode = !!b.secs;
    const cls = timeMode ? 'tm' : loadable ? '' : 'bw';
    const rows = en.sets.map((s, n) => setRow(i, b, e, en, s, n, cls, loadable, timeMode));
    const addBtn = h('button', { class: 'btn ghost small', style: { width: '100%' }, onclick: () => {
      const last = en.sets[en.sets.length - 1];
      en.sets.push({ weight: last.weight, reps: last.reps, done: false }); persist(); draw();
    } }, '+ Añadir serie');
    return h('div', { class: 'stack s3' },
      h('div', { class: 'stack s2' },
        h('div', { class: 'up' }, `Ejercicio ${i + 1} de ${blocks.length}`),
        h('h1', { class: 'h1' }, e.name),
        h('div', { class: 'chips' }, e.muscles.slice(0, 3).map((m) => tag(m, 'acc')), tag(presc(b))),
        wi.deload && h('span', { class: 'tag warn', style: { alignSelf: 'flex-start' } }, 'Semana de descarga: una serie menos')),
      h('button', { class: 'btn soft', onclick: () => openExercise(b.exId, { block: b, dayId, onSwap: () => { W.entries[i] = null; persist(); window.dispatchEvent(new HashChangeEvent('hashchange')); } }) }, h('span', { html: ICON.info }), 'Cómo se hace'),
      en.sg.note && h('div', { class: 'banner ' + (en.sg.up || en.sg.upgrade ? 'good' : '') }, h('span', { class: 'bi' }, en.sg.upgrade ? '🚀' : '🧠'), h('div', null, h('b', null, 'Tu entrenador'), en.sg.note)),
      h('div', { class: 'card' },
        h('div', { class: `set-head set-row ${cls}` }, h('span', null, 'SERIE'), loadable && h('span', null, 'KG'), h('span', null, timeMode ? 'SEG' : 'REPS'), timeMode && h('span'), h('span')),
        rows, addBtn),
      nav(i === blocks.length - 1 ? 'Continuar' : 'Siguiente ejercicio'));
  }

  function setRow(i, b, e, en, s, n, cls, loadable, timeMode) {
    const row = h('div', { class: `set-row ${cls}${s.done ? ' done' : ''}` });
    const kg = loadable && h('input', { type: 'text', inputMode: 'decimal', value: s.weight === '' || s.weight == null ? '' : String(s.weight).replace('.', ','), placeholder: 'kg', 'aria-label': `Serie ${n + 1} kilos`, onchange: (ev) => { s.weight = num(ev.target.value) ?? ''; persist(); } });
    const reps = h('input', { type: 'text', inputMode: 'numeric', value: s.reps ?? '', placeholder: timeMode ? 'seg' : 'reps', 'aria-label': `Serie ${n + 1} ${timeMode ? 'segundos' : 'repeticiones'}`, onchange: (ev) => { s.reps = num(ev.target.value) ?? ''; persist(); } });
    const play = timeMode && h('button', { class: 'set-ok', 'aria-label': 'Iniciar cronómetro', onclick: () => {
      const secs = num(reps.value) || b.secs;
      runSequence([{ label: 'Prepárate', secs: 5, rest: true }, { label: '¡Aguanta!', secs }], e.name, () => mark(true));
    }, html: ICON.play });
    const ok = h('button', { class: 'set-ok', 'aria-label': 'Serie completada', 'aria-pressed': !!s.done, onclick: () => mark(!s.done), html: ICON.check });
    function mark(v) {
      s.done = v;
      if (v) { s.weight = num(kg?.value) ?? s.weight; s.reps = num(reps.value) ?? s.reps; }
      row.classList.toggle('done', v); ok.setAttribute('aria-pressed', v);
      persist();
      if (v && !(i === blocks.length - 1 && n === en.sets.length - 1)) startRest(b.rest);
      if (!v) stopTimer();
    }
    row.append(h('span', { class: 'sn' }, n + 1), kg || '', reps, play || '', ok);
    return row;
  }

  // ── cardio final
  function finisherScreen() {
    const f = day.finisher;
    const segs = [];
    if (f.style === 'circuit') {
      for (let r = 0; r < f.rounds; r++) f.items.forEach((it, k) => {
        segs.push({ label: EX[it.exId].name, secs: f.work });
        if (!(r === f.rounds - 1 && k === f.items.length - 1)) segs.push({ label: 'Descansa', secs: f.rest, rest: true });
      });
    } else segs.push({ label: EX[f.items[0].exId].name, secs: f.minutes * 60 });
    return h('div', { class: 'stack s3' },
      h('div', null, h('h1', { class: 'h1' }, `${f.title} · ${f.minutes} min`), h('p', { class: 'muted' }, f.style === 'circuit' ? `${f.rounds} rondas de ${f.work} s de trabajo y ${f.rest} s de pausa.` : 'Ritmo constante: debes poder hablar entrecortado.')),
      h('div', { class: 'card ex-list' }, f.items.map((it) => h('button', { class: 'ex-row', onclick: () => openExercise(it.exId) }, h('div', { class: 'grow ex-t' }, EX[it.exId].name), h('span', { class: 'chev' }, 'ⓘ')))),
      h('button', { class: 'btn primary big', onclick: () => runSequence([{ label: 'Prepárate', secs: 5, rest: true }, ...segs], f.title, () => { W.finisherDone = true; persist(); toast('¡Cardio completado! 🔥'); go2(W.step + 1); }) }, h('span', { html: ICON.play }), 'Iniciar'),
      nav('Saltar cardio'));
  }

  // ── resumen / guardar
  function finishScreen() {
    let rpe = 7;
    const done = W.entries.map((e, i) => e && { ...e, sets: e.sets.filter((s) => s.done) }).filter((e) => e && e.sets.length);
    const elapsed = Math.max(1, Math.round((Date.now() - W.startedAt) / 60000));
    let minutes = Math.min(elapsed, Math.max(day.estMin * 2, 20));
    const totalSets = done.reduce((s, e) => s + e.sets.length, 0);
    const volume = done.reduce((s, e) => s + e.sets.reduce((t, st) => t + (+st.weight || 0) * (+st.reps || 0), 0), 0);
    const kcalOut = h('b', null, '');
    const recalc = () => { kcalOut.textContent = `~${estKcal(minutes, a.weight_kg, rpe, W.finisherDone ? 5.5 : undefined)} kcal`; };
    recalc();
    const notes = h('textarea', { rows: 2, placeholder: '¿Algo que anotar? (dolor, cómo te sentiste…)', maxLength: 300 });
    const rpeBtns = [[5, '😌', 'Fácil'], [7, '🙂', 'Bien'], [8.5, '😤', 'Duro'], [10, '🥵', 'Al límite']].map(([v, em, l]) => {
      const bt = h('button', { class: v === 7 ? 'on' : '', onclick: () => { rpe = v; rpeBtns.forEach((x) => x.classList.remove('on')); bt.classList.add('on'); recalc(); } }, h('span', null, em), l);
      return bt;
    });
    const saveBtn = h('button', { class: 'btn primary big', disabled: !totalSets, onclick: save }, totalSets ? '💾 Guardar entrenamiento' : 'Registra al menos una serie');
    async function save() {
      saveBtn.disabled = true;
      const entries = done.map((e) => ({ exId: e.exId, name: EX[e.exId].name, sets: e.sets.map((s) => ({ reps: +s.reps || 0, weight: +s.weight || 0, ...(blocks.find((b) => b.exId === e.exId)?.secs ? { secs: +s.reps || 0 } : {}), done: true })) }));
      const prs = findPRs(entries);
      const kcal = estKcal(minutes, a.weight_kg, rpe, W.finisherDone ? 5.5 : undefined);
      api.addLog({ plan_id: api.S.planId, day_label: day.label, started_at: new Date(W.startedAt).toISOString(), duration_min: minutes, rpe, kcal, notes: notes.value.trim() || null, entries });
      api.draft.clear(); stopTimer(); releaseLock();
      root.replaceChildren(successView(kcal, minutes, totalSets, volume, prs));
      window.scrollTo(0, 0);
    }
    return h('div', { class: 'stack s3' },
      h('div', null, h('h1', { class: 'h1' }, '¡Buen trabajo! 💪'), h('p', { class: 'muted' }, 'Cuéntame cómo te fue para ajustar tu próxima sesión.')),
      h('div', { class: 'kpis' },
        h('div', { class: 'kpi' }, h('b', null, totalSets), h('span', null, 'series')),
        h('div', { class: 'kpi' }, h('b', null, `${minutes}'`), h('span', null, 'minutos')),
        h('div', { class: 'kpi' }, h('b', null, volume ? Math.round(volume) : done.length), h('span', null, volume ? 'kg movidos' : 'ejercicios'))),
      h('div', { class: 'stack s2' }, h('span', { class: 'field-l' }, '¿Qué tan duro fue?'), h('div', { class: 'rpe-grid' }, rpeBtns)),
      h('div', { class: 'card row sp' }, h('span', { class: 'muted' }, 'Duración (min)'), stepper({ value: minutes, min: 1, max: 240, step: 5, onChange: (v) => { minutes = v; recalc(); } })),
      h('div', { class: 'card row sp' }, h('span', { class: 'muted' }, 'Gasto estimado'), kcalOut),
      notes, saveBtn,
      h('button', { class: 'btn ghost', onclick: () => go2(W.step - 1) }, '← Volver'));
  }

  function findPRs(entries) {
    const out = [];
    for (const en of entries) {
      const e = EX[en.exId];
      const prev = history(api.S.logs, en.exId, 50);
      if (!prev.length) continue;
      if (isLoadable(e)) {
        const best = Math.max(...en.sets.map((s) => e1rm(s.weight, s.reps)));
        const old = Math.max(...prev.flatMap((p) => p.sets.map((s) => e1rm(+s.weight || 0, +s.reps || 0))));
        if (best > old * 1.005) out.push(`${e.name}: ${fmtKg(Math.max(...en.sets.map((s) => s.weight)))} kg`);
      } else {
        const best = Math.max(...en.sets.map((s) => s.reps));
        const old = Math.max(...prev.flatMap((p) => p.sets.map((s) => +s.reps || 0)));
        if (best > old) out.push(`${e.name}: ${best}${e.mode === 'time' ? ' s' : ' reps'}`);
      }
    }
    return out;
  }

  function successView(kcal, minutes, sets, volume, prs) {
    return h('div', { class: 'stack s3 center', style: { paddingTop: '6vh' } },
      h('div', { style: { fontSize: '70px' } }, prs.length ? '🏆' : '✅'),
      h('h1', { class: 'h1' }, prs.length ? '¡Nuevos récords!' : '¡Entreno guardado!'),
      prs.length ? h('div', { class: 'card stack s2', style: { textAlign: 'left' } }, prs.map((p) => h('div', null, '⭐ ' + p))) : null,
      h('div', { class: 'card stack s2', style: { textAlign: 'left' } },
        h('div', { class: 'row sp' }, h('span', { class: 'muted' }, 'Duración'), h('b', null, `${minutes} min`)),
        h('div', { class: 'row sp' }, h('span', { class: 'muted' }, 'Series'), h('b', null, sets)),
        h('div', { class: 'row sp' }, h('span', { class: 'muted' }, 'Gasto estimado'), h('b', null, `~${kcal} kcal`))),
      h('div', { class: 'banner good', style: { textAlign: 'left' } }, h('span', { class: 'bi' }, '🥗'), h('div', null, h('b', null, 'En Fitia'), `Registra ~${kcal} kcal de ejercicio y completa tu proteína del día.`)),
      !navigator.onLine ? h('p', { class: 'muted small' }, 'Sin conexión: se sincronizará automáticamente.') : null,
      h('button', { class: 'btn primary big', onclick: () => go('hoy') }, 'Listo'));
  }

  function draw() {
    const st = steps[W.step];
    let body;
    if (st.type === 'warmup') body = h('div', { class: 'stack s3' }, checklist(day.warmup, 'w', 'Calentamiento 🔥', 'Prepara articulaciones y músculos. En tu primera serie de cada ejercicio usa un peso ligero.'), nav('Listo, a entrenar'));
    else if (st.type === 'ex') body = exerciseScreen(st.i);
    else if (st.type === 'finisher') body = finisherScreen();
    else if (st.type === 'cooldown') body = h('div', { class: 'stack s3' }, checklist(day.cooldown, 'c', 'Estiramientos 🧘', 'Baja el ritmo y respira profundo. Mantén cada estiramiento sin rebotar.'), nav('Terminar'));
    else body = finishScreen();
    root.replaceChildren(header(), body, h('div', { style: { height: '96px' } }));
  }

  draw();
  return root;
}
