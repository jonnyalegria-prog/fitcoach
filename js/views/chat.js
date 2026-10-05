import { h, fill, sheet, ICON } from '../ui.js';
import * as ai from '../ai.js';

const SUGGESTIONS = [
  'Me estanqué, ¿qué cambio?',
  '¿Qué como antes de entrenar?',
  '¿Cómo mejoro mi técnica en el ejercicio más difícil?',
  'Estoy muy cansado/a, ¿entreno hoy?',
];

export function openChat() {
  let msgs = ai.loadChat();
  let busy = false;
  const list = h('div', { class: 'chat-list', 'aria-live': 'polite' });
  const input = h('textarea', { rows: 1, placeholder: 'Escribe tu pregunta…', maxLength: 600, 'aria-label': 'Tu pregunta' });
  const send = h('button', { class: 'btn primary chat-send', 'aria-label': 'Enviar', onclick: () => submit(input.value), html: ICON.play });
  const clear = h('button', { class: 'link small', onclick: () => { ai.clearChat(); msgs = []; draw(); } }, 'Borrar conversación');

  const bubble = (m) => h('div', { class: `bubble ${m.role === 'user' ? 'me' : 'ai'}${m.error ? ' err' : ''}` }, m.content);

  function draw(typing = false) {
    fill(list,
      !msgs.length && h('div', { class: 'stack s2' },
        h('div', { class: 'bubble ai' }, '¡Hola! Soy tu entrenador. Conozco tu rutina, tus entrenos y tu progreso. Pregúntame lo que quieras sobre tu entrenamiento.'),
        h('div', { class: 'chips' }, SUGGESTIONS.map((q) => h('button', { class: 'chip', onclick: () => submit(q) }, q)))),
      msgs.map(bubble),
      typing && h('div', { class: 'bubble ai typing' }, '● ● ●'));
    send.disabled = busy; input.disabled = busy;
    requestAnimationFrame(() => { s.body.scrollTop = s.body.scrollHeight; });
  }

  async function submit(text) {
    text = (text || '').trim();
    if (!text || busy) return;
    msgs.push({ role: 'user', content: text });
    input.value = ''; busy = true; draw(true);
    try {
      const reply = await ai.askChat(msgs.filter((m) => !m.error));
      msgs.push({ role: 'assistant', content: reply });
      ai.saveChat(msgs);
    } catch (e) {
      msgs.push({ role: 'assistant', content: e.message, error: true });
    }
    busy = false; draw();
    if (!navigator.maxTouchPoints) input.focus();
  }

  input.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); submit(input.value); } });
  input.addEventListener('input', () => { input.style.height = 'auto'; input.style.height = Math.min(120, input.scrollHeight) + 'px'; });
  input.addEventListener('focus', () => setTimeout(() => { s.body.scrollTop = s.body.scrollHeight; }, 300));

  const s = sheet('💬 Tu entrenador', h('div', { class: 'chat' },
    list,
    h('p', { class: 'muted small center' }, 'Orientación general de entrenamiento. No reemplaza a un profesional de salud.'),
    h('div', { class: 'chat-input' }, input, send),
    clear), { full: true });
  draw();
  return s;
}
