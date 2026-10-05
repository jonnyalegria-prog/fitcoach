// Componentes de interfaz reutilizables (sin frameworks).
import { fmtShort } from './util.js';

export function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'html') el.innerHTML = v;
    else if (k in el && !k.includes('-')) { try { el[k] = v; } catch { el.setAttribute(k, v); } }
    else el.setAttribute(k, v === true ? '' : v);
  }
  const add = (c) => {
    if (c == null || c === false) return;
    if (Array.isArray(c)) c.forEach(add);
    else el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  };
  kids.forEach(add);
  return el;
}

// Como replaceChildren, pero aplana listas e ignora false/null (replaceChildren los escribiría como texto).
export function fill(el, ...kids) {
  el.replaceChildren(...kids.flat(Infinity).filter((k) => k != null && k !== false));
}

const svg = (d, extra = '') => `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}${extra}</svg>`;
export const ICON = {
  home: svg('<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>'),
  list: svg('<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>'),
  chart: svg('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>'),
  back: svg('<path d="M15 5l-7 7 7 7"/>'),
  close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  check: svg('<path d="M5 12l5 5 9-10"/>'),
  play: svg('<path d="M7 4l13 8-13 8z" fill="currentColor"/>'),
  info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>'),
  swap: svg('<path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  more: svg('<circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/>'),
  video: svg('<rect x="3" y="6" width="14" height="12" rx="2"/><path d="M17 10l4-2v8l-4-2"/>'),
};

// ───────── toast ─────────
let toastTimer;
export function toast(msg, kind = '') {
  document.querySelector('.toast')?.remove();
  const t = h('div', { class: 'toast ' + kind, role: 'status' }, msg);
  document.body.append(t);
  requestAnimationFrame(() => t.classList.add('show'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 250); }, 2800);
}

// ───────── hoja inferior ─────────
export function sheet(title, content, { onClose, full = false } = {}) {
  const back = h('div', { class: 'backdrop' });
  const body = h('div', { class: 'sheet-body' }, content);
  const sh = h('div', { class: 'sheet' + (full ? ' full' : ''), role: 'dialog', 'aria-modal': 'true', 'aria-label': title || 'Detalle' },
    h('div', { class: 'grab' }),
    title && h('div', { class: 'sheet-head' }, h('h2', null, title), h('button', { class: 'icon-btn', 'aria-label': 'Cerrar', onclick: () => close(), html: ICON.close })),
    body);
  document.body.append(back, sh);
  document.body.classList.add('noscroll');
  requestAnimationFrame(() => { back.classList.add('show'); sh.classList.add('show'); });
  let closed = false;
  function close() {
    if (closed) return;
    closed = true;
    back.classList.remove('show'); sh.classList.remove('show');
    setTimeout(() => { back.remove(); sh.remove(); if (!document.querySelector('.sheet')) document.body.classList.remove('noscroll'); }, 250);
    onClose?.();
  }
  back.addEventListener('click', close);
  return { close, body, el: sh };
}

export function ask({ title, text, ok = 'Aceptar', cancel = 'Cancelar', danger = false }) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (v) => { if (done) return; done = true; s.close(); resolve(v); };
    const s = sheet(title, h('div', { class: 'stack' },
      text && h('p', { class: 'muted' }, text),
      h('button', { class: 'btn ' + (danger ? 'danger' : 'primary'), onclick: () => finish(true) }, ok),
      h('button', { class: 'btn ghost', onclick: () => finish(false) }, cancel)), { onClose: () => finish(false) });
  });
}

// ───────── sonido / vibración ─────────
let actx;
export function beep(freq = 880, ms = 160, times = 1) {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    for (let i = 0; i < times; i++) {
      const o = actx.createOscillator(), g = actx.createGain();
      o.frequency.value = freq; o.connect(g); g.connect(actx.destination);
      const t = actx.currentTime + i * 0.25;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
      o.start(t); o.stop(t + ms / 1000 + 0.02);
    }
  } catch { /* sin audio */ }
  try { navigator.vibrate?.(200); } catch { /* iOS no soporta */ }
}

// ───────── componentes pequeños ─────────
export const chip = (label, { on = false, onclick, icon } = {}) =>
  h('button', { type: 'button', class: 'chip' + (on ? ' on' : ''), onclick, 'aria-pressed': on ? 'true' : 'false' }, icon && h('span', { class: 'chip-i' }, icon), label);

export const tag = (text, cls = '') => h('span', { class: 'tag ' + cls }, text);

export function field(label, input, hint) {
  return h('label', { class: 'field' }, h('span', { class: 'field-l' }, label), input, hint && h('span', { class: 'hint' }, hint));
}

export function stepper({ value = 0, min = 0, max = 999, step = 1, onChange, unit = '' }) {
  const out = h('div', { class: 'stepper-v' }, String(value) + unit);
  let v = value;
  const set = (n) => { v = Math.min(max, Math.max(min, n)); out.textContent = v + unit; onChange?.(v); };
  return h('div', { class: 'stepper' },
    h('button', { type: 'button', class: 'step-b', 'aria-label': 'Menos', onclick: () => set(v - step) }, '−'),
    out,
    h('button', { type: 'button', class: 'step-b', 'aria-label': 'Más', onclick: () => set(v + step) }, '+'));
}

export function progressRing(pct, label, sub) {
  const r = 34, c = 2 * Math.PI * r, off = c * (1 - Math.min(1, Math.max(0, pct)));
  return h('div', { class: 'ring', html: `<svg viewBox="0 0 80 80" width="84" height="84"><circle cx="40" cy="40" r="${r}" class="ring-bg"/><circle cx="40" cy="40" r="${r}" class="ring-fg" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" transform="rotate(-90 40 40)"/></svg>` },
    h('div', { class: 'ring-t' }, h('b', null, label), sub && h('small', null, sub)));
}

// ───────── gráficos SVG ─────────
export function lineChart(points, { target, unit = '', height = 160 } = {}) {
  if (points.length < 2) return h('p', { class: 'muted center' }, 'Registra al menos 2 días para ver la tendencia.');
  const W = 320, H = height, pl = 34, pr = 10, pt = 12, pb = 24;
  const xs = points.map((p) => +p.x), ys = points.map((p) => p.y).concat(target != null ? [target] : []);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  let y0 = Math.min(...ys), y1 = Math.max(...ys);
  const padY = Math.max(0.5, (y1 - y0) * 0.15); y0 -= padY; y1 += padY;
  const X = (x) => pl + ((x - x0) / Math.max(1, x1 - x0)) * (W - pl - pr);
  const Y = (y) => pt + (1 - (y - y0) / (y1 - y0)) * (H - pt - pb);
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${X(+p.x).toFixed(1)},${Y(p.y).toFixed(1)}`).join(' ');
  const area = `${d} L${X(x1).toFixed(1)},${H - pb} L${X(x0).toFixed(1)},${H - pb} Z`;
  const ticks = [y0 + padY, (y0 + y1) / 2, y1 - padY];
  const last = points[points.length - 1];
  const grid = ticks.map((t) => `<line x1="${pl}" x2="${W - pr}" y1="${Y(t).toFixed(1)}" y2="${Y(t).toFixed(1)}" class="grid"/><text x="${pl - 6}" y="${(Y(t) + 4).toFixed(1)}" class="ax" text-anchor="end">${(Math.round(t * 10) / 10).toString().replace('.', ',')}</text>`).join('');
  const tl = target != null ? `<line x1="${pl}" x2="${W - pr}" y1="${Y(target).toFixed(1)}" y2="${Y(target).toFixed(1)}" class="tgt"/><text x="${W - pr}" y="${(Y(target) - 4).toFixed(1)}" class="ax" text-anchor="end">meta ${target}${unit}</text>` : '';
  return h('div', { class: 'chart', html:
    `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico de evolución">${grid}${tl}<path d="${area}" class="area"/><path d="${d}" class="line"/>${points.map((p) => `<circle cx="${X(+p.x).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="2.6" class="dot"/>`).join('')}<circle cx="${X(+last.x).toFixed(1)}" cy="${Y(last.y).toFixed(1)}" r="5" class="dot-last"/><text x="${pl}" y="${H - 6}" class="ax">${fmtShort(x0)}</text><text x="${W - pr}" y="${H - 6}" class="ax" text-anchor="end">${fmtShort(x1)}</text></svg>` });
}

export function barChart(bars, { target, height = 140 } = {}) {
  if (!bars.length) return h('p', { class: 'muted center' }, 'Aún no hay datos.');
  const W = 320, H = height, pl = 8, pb = 22, pt = 14;
  const max = Math.max(...bars.map((b) => b.v), target || 0) * 1.1 || 1;
  const bw = (W - pl * 2) / bars.length;
  const rects = bars.map((b, i) => {
    const bh = (b.v / max) * (H - pb - pt);
    return `<rect x="${(pl + i * bw + bw * 0.15).toFixed(1)}" y="${(H - pb - bh).toFixed(1)}" width="${(bw * 0.7).toFixed(1)}" height="${bh.toFixed(1)}" rx="3" class="bar${target && b.v > target * 1.1 ? ' over' : ''}"/><text x="${(pl + i * bw + bw / 2).toFixed(1)}" y="${H - 6}" class="ax" text-anchor="middle">${b.l}</text>`;
  }).join('');
  const tl = target ? `<line x1="${pl}" x2="${W - pl}" y1="${(H - pb - (target / max) * (H - pb - pt)).toFixed(1)}" y2="${(H - pb - (target / max) * (H - pb - pt)).toFixed(1)}" class="tgt"/>` : '';
  return h('div', { class: 'chart', html: `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico de barras">${rects}${tl}</svg>` });
}

export function sparkline(values, w = 90, hh = 28) {
  if (values.length < 2) return h('span');
  const min = Math.min(...values), max = Math.max(...values), rg = max - min || 1;
  const pts = values.map((v, i) => `${((i / (values.length - 1)) * (w - 4) + 2).toFixed(1)},${(hh - 3 - ((v - min) / rg) * (hh - 6)).toFixed(1)}`).join(' ');
  return h('span', { class: 'spark', html: `<svg viewBox="0 0 ${w} ${hh}" width="${w}" height="${hh}"><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>` });
}
