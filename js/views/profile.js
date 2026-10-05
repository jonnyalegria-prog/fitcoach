import * as api from '../api.js';
import { h, toast, ask, field, tag } from '../ui.js';
import { EX } from '../exercises.js';
import { GOALS, evaluate } from '../planner.js';
import { go } from '../nav.js';
import { num } from '../util.js';

const LEVEL = ['', 'Principiante', 'Intermedio', 'Avanzado'];
const standalone = () => window.navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;

export function render() {
  const { profile, user, prefs } = api.S;
  const a = profile.assessment;
  const goal = GOALS.find((g) => g.id === a.goal);
  const root = h('div', { class: 'stack s3 fade-in' });

  const name = h('input', { type: 'text', value: profile.name || '', maxLength: 30, autocomplete: 'given-name' });
  const kcal = h('input', { type: 'text', inputMode: 'numeric', value: a.kcal_target ?? '', placeholder: 'ej. 2000' });
  const tw = h('input', { type: 'text', inputMode: 'decimal', value: a.target_weight ?? '', placeholder: 'ej. 68' });

  root.append(h('h1', { class: 'h1' }, 'Perfil'),
    h('div', { class: 'card stack' },
      h('div', { class: 'row' }, h('div', { style: { fontSize: '36px' } }, '🙋'), h('div', null, h('b', { style: { fontSize: '18px' } }, profile.name || 'Tú'), h('div', { class: 'muted small' }, user.email || ''))),
      h('div', { class: 'chips' }, goal && tag(`${goal.icon} ${goal.label}`, 'acc'), tag(LEVEL[evaluate(a).level]), a.weekdays && tag(`${a.weekdays.length} días`), a.minutes && tag(`${a.minutes} min`)),
      h('button', { class: 'btn soft', onclick: () => go('evaluacion') }, 'Rehacer mi evaluación')),
    h('div', { class: 'card stack' }, h('h3', { class: 'h3' }, 'Mis datos'),
      field('Nombre', name),
      field('Calorías diarias de tu meta (Fitia)', kcal, 'Las uso para comparar con lo que registras.'),
      field('Peso meta (kg)', tw),
      h('button', { class: 'btn primary', onclick: () => {
        const k = num(kcal.value), t = num(tw.value);
        api.saveProfile({ name: name.value.trim() || profile.name, assessment: { ...a, kcal_target: k, target_weight: t } });
        toast('Guardado ✅');
      } }, 'Guardar cambios')));

  const avoided = [...prefs].filter(([, v]) => v === 'avoid').map(([id]) => id);
  if (avoided.length) root.append(h('div', { class: 'card stack s2' }, h('h3', { class: 'h3' }, 'Ejercicios que no quiero'),
    avoided.map((id) => h('div', { class: 'row sp' }, h('span', null, EX[id]?.name || id), h('button', { class: 'link', onclick: () => { api.setPref(id, null); toast('Podrá volver a aparecer'); } }, 'Permitir')))));

  if (!standalone()) root.append(h('div', { class: 'card stack s2' }, h('h3', { class: 'h3' }, '📲 Instálala en tu iPhone'),
    h('ol', { class: 'tips' }, h('li', null, 'Abre esta página en Safari.'), h('li', null, 'Toca el botón Compartir (el cuadrado con la flecha).'), h('li', null, 'Elige "Añadir a pantalla de inicio".')),
    h('p', { class: 'muted small' }, 'Se abrirá como una app, a pantalla completa y funcionando incluso sin internet.')));

  root.append(h('div', { class: 'card stack s2' }, h('h3', { class: 'h3' }, 'Datos'),
    h('button', { class: 'btn', onclick: exportData }, 'Exportar mis datos (JSON)'),
    h('button', { class: 'btn ghost', style: { color: 'var(--bad)' }, onclick: async () => {
      if (await ask({ title: '¿Cerrar sesión?', text: api.S.pending ? 'Tienes cambios sin sincronizar que se perderían en este teléfono.' : 'Podrás volver a entrar cuando quieras.', ok: 'Cerrar sesión', danger: true })) { await api.signOut(); go('login'); location.reload(); }
    } }, 'Cerrar sesión'),
    h('p', { class: 'muted small center' }, 'FitCoach · hecho para 2 · v1.0')));
  return root;
}

function exportData() {
  const { profile, plan, logs, checkins } = api.S;
  const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), profile, plan, logs, checkins }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: 'fitcoach-datos.json' });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
