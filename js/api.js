// Capa de datos: Supabase + caché local + cola de envío (funciona sin conexión).
const SUPABASE_URL = 'https://hhhdmtkonnbafhlmvxun.supabase.co';
// Clave pública (publishable): es segura en el navegador; los datos los protege RLS.
const SUPABASE_KEY = 'sb_publishable_0KOTeXQf4nF5k4G_dmK5UQ_OEri9L2B';

export const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storage: window.localStorage },
});

// ───────── almacenamiento local ─────────
const ls = {
  get(k, d = null) { try { const v = localStorage.getItem('fc:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('fc:' + k, JSON.stringify(v)); } catch { /* sin espacio / modo privado */ } },
  del(k) { try { localStorage.removeItem('fc:' + k); } catch { /* ignorar */ } },
};
export const local = ls;

export const S = {
  user: null, profile: null, plan: null, planId: null,
  logs: [], checkins: [], prefs: new Map(), pending: 0,
};

const listeners = new Set();
export const onChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const emit = () => listeners.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } });

const key = (k) => `${S.user.id}:${k}`;
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = (Math.random() * 16) | 0; return (c === 'x' ? r : (r & 3) | 8).toString(16); }));
export { uuid };

function persist() {
  ls.set(key('profile'), S.profile);
  ls.set(key('plan'), S.plan);
  ls.set(key('planId'), S.planId);
  ls.set(key('logs'), S.logs);
  ls.set(key('checkins'), S.checkins);
  ls.set(key('prefs'), [...S.prefs]);
}

// ───────── cola de envío ─────────
let outbox = [];
let flushing = false;
function saveOutbox() { ls.set(key('outbox'), outbox); S.pending = outbox.length; emit(); }

function isNetworkError(error) {
  if (!error) return false;
  if (error.code || error.status >= 400) return false;
  return true;
}

export async function flush() {
  if (flushing || !S.user || !outbox.length) return;
  flushing = true;
  try {
    while (outbox.length) {
      const op = outbox[0];
      let res;
      if (op.op === 'upsert') res = await sb.from(op.table).upsert(op.row, { onConflict: op.onConflict });
      else res = await sb.from(op.table).delete().match(op.match);
      if (res.error) {
        if (isNetworkError(res.error)) break; // reintentar luego
        console.warn('Operación descartada', op, res.error);
      }
      outbox.shift();
      saveOutbox();
    }
  } finally { flushing = false; }
}

function enqueue(op) { outbox.push(op); saveOutbox(); flush(); }

window.addEventListener('online', () => flush());

// ───────── sesión ─────────
export async function restoreSession() {
  try {
    const { data } = await sb.auth.getSession();
    if (data.session) { S.user = data.session.user; ls.set('lastUser', { id: S.user.id, email: S.user.email }); }
  } catch { /* sin red */ }
  if (!S.user) {
    const last = ls.get('lastUser');
    const hasToken = Object.keys(localStorage).some((k) => k.startsWith('sb-') && k.endsWith('-auth-token'));
    if (last && hasToken && !navigator.onLine) S.user = last; // modo sin conexión
  }
  return S.user;
}

export async function signIn(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw friendly(error);
  S.user = data.user; ls.set('lastUser', { id: S.user.id, email: S.user.email });
  return S.user;
}

export async function signUp(name, email, password) {
  // Registro propio (RPC): no envía correos de confirmación y solo admite 2 cuentas.
  const { error } = await sb.rpc('create_account', { p_name: name, p_email: email, p_password: password });
  if (error) throw friendly(error);
  return signIn(email, password);
}

export async function signOut() {
  try { await sb.auth.signOut(); } catch { /* ignorar */ }
  S.user = null; S.profile = null; S.plan = null; S.logs = []; S.checkins = []; S.prefs = new Map();
  ls.del('lastUser');
}

function friendly(error) {
  if (error.code === 'P0001') return new Error(error.message); // mensajes ya escritos en español
  const m = (error.message || '').toLowerCase();
  if (m.includes('invalid login')) return new Error('Correo o contraseña incorrectos.');
  if (m.includes('solo para 2')) return new Error('Esta app es privada: ya hay 2 usuarios registrados.');
  if (m.includes('already registered')) return new Error('Ese correo ya tiene cuenta. Inicia sesión.');
  if (m.includes('password')) return new Error('La contraseña debe tener al menos 6 caracteres.');
  if (m.includes('valid email') || m.includes('invalid email')) return new Error('Escribe un correo válido.');
  if (m.includes('failed to fetch') || m.includes('network')) return new Error('Sin conexión. Revisa tu internet.');
  return new Error(error.message || 'Ocurrió un error.');
}

// ───────── carga de datos ─────────
function loadCache() {
  S.profile = ls.get(key('profile'));
  S.plan = ls.get(key('plan'));
  S.planId = ls.get(key('planId'));
  S.logs = ls.get(key('logs'), []);
  S.checkins = ls.get(key('checkins'), []);
  S.prefs = new Map(ls.get(key('prefs'), []));
  outbox = ls.get(key('outbox'), []);
  S.pending = outbox.length;
}

export function hydrate() {
  loadCache();
  emit();
}

export async function refresh() {
  await flush();
  if (outbox.length) return; // hay cambios locales sin subir: no pisarlos con datos viejos
  try {
    const uid = S.user.id;
    const [p, pl, lg, ck, pf] = await Promise.all([
      sb.from('profiles').select('*').eq('id', uid).maybeSingle(),
      sb.from('plans').select('*').eq('user_id', uid).eq('active', true).order('created_at', { ascending: false }).limit(1),
      sb.from('workout_logs').select('*').eq('user_id', uid).order('started_at', { ascending: false }).limit(400),
      sb.from('checkins').select('*').eq('user_id', uid).order('date', { ascending: false }).limit(400),
      sb.from('exercise_prefs').select('*').eq('user_id', uid),
    ]);
    const failed = [p, pl, lg, ck, pf].find((r) => r.error);
    if (failed) throw failed.error;
    S.profile = p.data;
    S.plan = pl.data?.[0]?.data || null;
    S.planId = pl.data?.[0]?.id || null;
    S.logs = lg.data || [];
    S.checkins = ck.data || [];
    S.prefs = new Map((pf.data || []).map((r) => [r.exercise_id, r.pref]));
    persist();
    emit();
  } catch (e) {
    console.warn('Usando datos locales (sin conexión)', e);
  }
}

// ───────── escrituras (optimistas) ─────────
export function saveProfile(patch) {
  S.profile = { ...(S.profile || { id: S.user.id }), ...patch, id: S.user.id, updated_at: new Date().toISOString() };
  persist(); emit();
  const { id, name, assessment, settings } = S.profile;
  enqueue({ op: 'upsert', table: 'profiles', onConflict: 'id', row: { id, name: name ?? '', assessment: assessment ?? {}, settings: settings ?? {}, updated_at: S.profile.updated_at } });
}

export function savePlan(plan, source = 'generated') {
  S.plan = plan;
  if (!S.planId) S.planId = uuid();
  persist(); emit();
  enqueue({ op: 'upsert', table: 'plans', onConflict: 'id', row: { id: S.planId, user_id: S.user.id, data: plan, active: true, source } });
}

export function addLog(log) {
  const row = { id: uuid(), user_id: S.user.id, plan_id: S.planId, started_at: new Date().toISOString(), ...log };
  S.logs = [row, ...S.logs];
  persist(); emit();
  enqueue({ op: 'upsert', table: 'workout_logs', onConflict: 'id', row });
  return row;
}

export function deleteLog(id) {
  S.logs = S.logs.filter((l) => l.id !== id);
  persist(); emit();
  enqueue({ op: 'delete', table: 'workout_logs', match: { id } });
}

export function upsertCheckin(c) {
  const prev = S.checkins.find((x) => x.date === c.date);
  const row = { ...(prev || {}), ...c, id: prev?.id || uuid(), user_id: S.user.id };
  S.checkins = [row, ...S.checkins.filter((x) => x.date !== c.date)].sort((a, b) => (a.date < b.date ? 1 : -1));
  persist(); emit();
  enqueue({ op: 'upsert', table: 'checkins', onConflict: 'user_id,date', row });
}

export function setPref(exId, pref) {
  if (pref) S.prefs.set(exId, pref); else S.prefs.delete(exId);
  persist(); emit();
  if (pref) enqueue({ op: 'upsert', table: 'exercise_prefs', onConflict: 'user_id,exercise_id', row: { user_id: S.user.id, exercise_id: exId, pref } });
  else enqueue({ op: 'delete', table: 'exercise_prefs', match: { user_id: S.user.id, exercise_id: exId } });
}

// Entreno en curso (para no perderlo si se cierra la app)
export const draft = {
  get: () => (S.user ? ls.get(key('draft')) : null),
  set: (d) => S.user && ls.set(key('draft'), d),
  clear: () => S.user && ls.del(key('draft')),
};
