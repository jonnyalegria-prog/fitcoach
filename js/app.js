import * as api from './api.js';
import { h, ICON, toast } from './ui.js';
import { go } from './nav.js';
import * as auth from './views/auth.js';
import * as onboarding from './views/onboarding.js';
import * as home from './views/home.js';
import * as plan from './views/plan.js';
import * as workout from './views/workout.js';
import * as progress from './views/progress.js';
import * as profile from './views/profile.js';

const app = document.getElementById('app');
const tabbar = document.getElementById('tabbar');

const TABS = [
  { id: 'hoy', label: 'Hoy', icon: ICON.home },
  { id: 'rutina', label: 'Rutina', icon: ICON.list },
  { id: 'progreso', label: 'Progreso', icon: ICON.chart },
  { id: 'perfil', label: 'Perfil', icon: ICON.user },
];

let current = { name: '', stateful: false };
let renderQueued = false;

function parse() {
  const [name = '', ...rest] = location.hash.replace(/^#\/?/, '').split('/');
  return { name: name || 'hoy', params: rest.map(decodeURIComponent) };
}

function drawTabs(active) {
  tabbar.className = active ? '' : 'hide';
  if (!active) return;
  tabbar.replaceChildren(h('div', { class: 'tabs' }, TABS.map((t) =>
    h('a', { href: '#/' + t.id, class: t.id === active ? 'on' : '', 'aria-current': t.id === active ? 'page' : null },
      h('span', { html: t.icon }), t.label))));
}

function mount(node, { tab = null, full = false, stateful = false, name = '' } = {}) {
  const y = current.name === name ? window.scrollY : 0;
  app.className = full ? 'full' : '';
  app.replaceChildren(node);
  drawTabs(tab);
  current = { name, stateful };
  window.scrollTo(0, y);
}

export function route() {
  const { name, params } = parse();
  const { user, profile: prof } = api.S;

  if (!user) return mount(auth.render({ onDone: boot }), { full: true, stateful: true, name: 'login' });
  const hasAssessment = !!prof?.assessment?.goal;
  if (!hasAssessment && name !== 'evaluacion') return go('evaluacion');

  switch (name) {
    case 'hoy': return mount(home.render(), { tab: 'hoy', name });
    case 'rutina': return mount(plan.renderPlan(), { tab: 'rutina', name });
    case 'dia': return mount(plan.renderDay(params[0]), { tab: 'rutina', name: name + params[0] });
    case 'coach': return mount(plan.renderCoach(), { tab: 'rutina', name });
    case 'progreso': return mount(progress.render(), { tab: 'progreso', name });
    case 'perfil': return mount(profile.render(), { tab: 'perfil', name });
    case 'entreno': return mount(workout.render(params[0]), { full: true, stateful: true, name });
    case 'evaluacion': return mount(onboarding.render({ edit: hasAssessment }), { full: true, stateful: true, name });
    default: return go('hoy');
  }
}

// Re-dibuja al cambiar los datos, salvo en pantallas con formularios en curso.
api.onChange(() => {
  if (renderQueued || current.stateful) return;
  renderQueued = true;
  requestAnimationFrame(() => { renderQueued = false; if (!current.stateful) route(); });
});

window.addEventListener('hashchange', route);

async function boot() {
  const user = await api.restoreSession();
  if (user) {
    api.hydrate();
    if (!api.S.profile) {
      app.replaceChildren(h('div', { class: 'spin', style: { marginTop: '40vh' } }));
      await api.refresh();
    } else api.refresh();
  }
  if (!location.hash || location.hash === '#/' || location.hash === '#/login') location.hash = '#/hoy';
  route();
}

boot().catch((e) => { console.error(e); toast('Error al iniciar. Intenta de nuevo.', 'bad'); });

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
window.addEventListener('online', () => { if (api.S.user) api.refresh(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden && api.S.user && navigator.onLine) api.refresh(); });
