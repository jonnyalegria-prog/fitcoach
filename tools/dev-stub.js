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
      from: (t) => builder(t),
    }),
  };
})();
