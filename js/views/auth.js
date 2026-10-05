import * as api from '../api.js';
import { h, field } from '../ui.js';

export function render({ onDone }) {
  let mode = 'in';
  let busy = false;
  let error = '';
  const root = h('div', { class: 'auth stack s3 fade-in' });

  const name = h('input', { type: 'text', autocomplete: 'given-name', placeholder: 'Tu nombre', maxLength: 30 });
  const email = h('input', { type: 'email', autocomplete: 'username', inputMode: 'email', placeholder: 'tu@correo.com', autocapitalize: 'none' });
  const pass = h('input', { type: 'password', placeholder: 'Mínimo 6 caracteres', minLength: 6 });

  async function submit(ev) {
    ev.preventDefault();
    if (busy) return;
    error = '';
    if (mode === 'up' && !name.value.trim()) error = 'Escribe tu nombre.';
    else if (!email.value.trim()) error = 'Escribe tu correo.';
    else if (pass.value.length < 6) error = 'La contraseña debe tener al menos 6 caracteres.';
    if (error) return draw();
    busy = true; draw();
    try {
      if (mode === 'in') await api.signIn(email.value.trim(), pass.value);
      else await api.signUp(name.value.trim(), email.value.trim(), pass.value);
      await onDone();
    } catch (e) {
      error = e.message; busy = false; draw();
    }
  }

  function draw() {
    pass.autocomplete = mode === 'in' ? 'current-password' : 'new-password';
    root.replaceChildren(
      h('div', { class: 'stack center' },
        h('img', { class: 'logo', src: 'icons/icon-192.png', alt: 'FitCoach' }),
        h('h1', { class: 'h1' }, 'FitCoach'),
        h('p', { class: 'muted' }, 'Tu entrenador personal. Rutinas hechas a tu medida.')),
      h('div', { class: 'seg', role: 'tablist' },
        h('button', { class: mode === 'in' ? 'on' : '', onclick: () => { mode = 'in'; error = ''; draw(); } }, 'Entrar'),
        h('button', { class: mode === 'up' ? 'on' : '', onclick: () => { mode = 'up'; error = ''; draw(); } }, 'Crear cuenta')),
      h('form', { class: 'stack', onsubmit: submit, noValidate: true },
        mode === 'up' && field('Nombre', name),
        field('Correo', email),
        field('Contraseña', pass),
        error && h('div', { class: 'banner bad', role: 'alert' }, h('span', { class: 'bi' }, '⚠️'), h('div', null, error)),
        h('button', { class: 'btn primary big', type: 'submit', disabled: busy }, busy ? 'Un momento…' : mode === 'in' ? 'Entrar' : 'Crear mi cuenta')),
      h('p', { class: 'muted small center' }, 'App privada para 2 personas. Tus datos son solo tuyos.'),
    );
  }
  draw();
  return root;
}
