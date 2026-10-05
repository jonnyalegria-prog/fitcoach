// Supabase falso en memoria para probar la app localmente sin cuentas ni red.
(function () {
  const KEY = 'fc-dev-db';
  const db = JSON.parse(localStorage.getItem(KEY) || 'null') || { profiles: [], plans: [], workout_logs: [], checkins: [], exercise_prefs: [] };
  const save = () => localStorage.setItem(KEY, JSON.stringify(db));
  const user = { id: 'dev-user', email: 'dev@local.test' };
  window.__db = db;
  function builder(table) {
    let mode = 'select', rows = null, filters = [], order = null, lim = null, single = false;
    const q = {
      select() { return q; },
      eq(k, v) { filters.push((r) => r[k] === v); return q; },
      match(o) { Object.entries(o).forEach(([k, v]) => filters.push((r) => r[k] === v)); return q; },
      order(k, { ascending } = {}) { order = [k, ascending !== false]; return q; },
      limit(n) { lim = n; return q; },
      maybeSingle() { single = true; return q; },
      upsert(row, { onConflict } = {}) { mode = 'upsert'; rows = [row]; q.oc = onConflict; return q; },
      delete() { mode = 'delete'; return q; },
      then(res, rej) {
        let out;
        const t = db[table];
        if (mode === 'upsert') {
          const keys = (q.oc || 'id').split(',');
          const r = rows[0];
          const i = t.findIndex((x) => keys.every((k) => x[k] === r[k]));
          if (i >= 0) t[i] = { ...t[i], ...r }; else t.push({ ...r });
          save(); out = { data: null, error: null };
        } else if (mode === 'delete') {
          db[table] = t.filter((r) => !filters.every((f) => f(r))); save();
          out = { data: null, error: null };
        } else {
          let d = t.filter((r) => filters.every((f) => f(r)));
          if (order) d = [...d].sort((a, b) => (a[order[0]] < b[order[0]] ? -1 : 1) * (order[1] ? 1 : -1));
          if (lim) d = d.slice(0, lim);
          out = { data: single ? d[0] || null : d, error: null };
        }
        return Promise.resolve(out).then(res, rej);
      },
    };
    return q;
  }
  window.supabase = {
    createClient: () => ({
      auth: {
        getSession: async () => ({ data: { session: { user } } }),
        signInWithPassword: async () => ({ data: { user }, error: null }),
        signUp: async () => ({ data: { user, session: {} }, error: null }),
        signOut: async () => ({ error: null }),
      },
      rpc: async () => ({ error: null }),
      functions: {
        // Simula la Edge Function. localStorage 'fc-dev-ai' = 'off' | 'quota' para probar errores.
        invoke: async (name, { body }) => {
          const mode = localStorage.getItem('fc-dev-ai');
          const fail = (status, error) => ({ data: null, error: { name: 'FunctionsHttpError', context: new Response(JSON.stringify({ error }), { status }) } });
          if (mode === 'off') return fail(503, 'ai_not_configured');
          if (mode === 'quota') return fail(429, 'quota');
          await new Promise((r) => setTimeout(r, 600));
          window.__lastAIBody = body;
          if (body.mode === 'chat') return { data: { mode: 'chat', reply: 'Respuesta de prueba a: ' + body.messages[body.messages.length - 1].content } };
          const first = body.context.plan?.dias?.[0]?.ejercicios?.[0]?.id || '';
          return { data: { mode: 'review', review: {
            headline: 'Buen ritmo, ajustemos el volumen',
            message: 'Vas constante. Tus entrenos se sienten duros, así que bajaremos un poco el volumen.',
            insights: [{ tone: 'good', title: 'Constancia', text: 'Cumpliste tus días.' }, { tone: 'warn', title: 'Fatiga', text: 'Esfuerzo alto.' }],
            proposals: [
              { type: 'volume', label: 'Una serie menos', reason: 'Para recuperar mejor.', delta: -1, exercise_id: '' },
              { type: 'swap', label: 'Cambiar ' + first, reason: 'Se estancó.', delta: 0, exercise_id: first },
              { type: 'rotate', label: 'Inventado', reason: 'id que no existe', delta: 0, exercise_id: 'no_existe' },
            ] } } };
        },
      },
      from: (t) => builder(t),
    }),
  };
})();
