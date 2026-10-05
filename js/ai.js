// Entrenador con IA (Claude) a través de la Edge Function "coach".
import * as api from './api.js';
import { EX } from './exercises.js';
import { weekInfo, DOW_LONG } from './planner.js';
import { reviewPlan } from './coach.js';
import { todayStr } from './util.js';

const MESSAGES = {
  ai_not_configured: 'El entrenador IA aún no está activado.',
  quota: 'Llegaste al límite de consultas de hoy. Mañana podrás seguir.',
  busy: 'El entrenador está muy ocupado. Prueba de nuevo en un minuto.',
  refused: 'No pude responder eso. Prueba reformulando la pregunta.',
  truncated: 'La respuesta salió incompleta. Intenta de nuevo.',
  empty: 'No obtuve respuesta. Intenta de nuevo.',
  bad_output: 'No pude interpretar la respuesta. Intenta de nuevo.',
  offline: 'Necesitas conexión a internet para hablar con el entrenador.',
  auth: 'Tu sesión expiró. Vuelve a iniciar sesión.',
  too_large: 'Tu historial es demasiado largo para analizar.',
  ai_error: 'No pude conectar con el entrenador. Intenta de nuevo en un rato.',
};

export class AIError extends Error {
  constructor(code) { super(MESSAGES[code] || MESSAGES.ai_error); this.code = code; }
}

const uid = () => api.S.user.id;
const savedKey = () => `${uid()}:ai_review`;
const chatKey = () => `${uid()}:ai_chat`;

// ───────── contexto compacto que se envía a Claude (sin nombre ni correo) ─────────
function bestSet(sets) {
  const done = (sets || []).filter((s) => s.done !== false);
  if (!done.length) return null;
  const b = done.reduce((m, s) => ((+s.weight || 0) * (+s.reps || 0) >= (+m.weight || 0) * (+m.reps || 0) ? s : m), done[0]);
  return { kg: +b.weight || 0, reps: +b.reps || 0, series: done.length };
}

export function buildContext() {
  const { profile, plan, logs, checkins, prefs } = api.S;
  const a = profile.assessment;
  const wi = plan ? weekInfo(plan) : null;
  const since = Date.now() - 35 * 864e5;
  const rv = plan ? reviewPlan({ plan, a, logs, checkins }) : { items: [], stats: {} };
  return {
    hoy: todayStr(),
    perfil: {
      meta: a.goal, nivel: plan?.summary.level, experiencia: a.experience, edad: a.age, peso_kg: a.weight_kg,
      peso_meta_kg: a.target_weight ?? null, calorias_meta_fitia: a.kcal_target ?? null,
      dias_entrenamiento: (a.weekdays || []).map((d) => DOW_LONG[d]), minutos_por_sesion: a.minutes,
      equipo: a.equipment || [], molestias: a.injuries || [], condicion_medica: !!a.medical,
      cardio: a.cardio_pref, zonas_prioritarias: a.focus || [], prueba_inicial: a.tests,
    },
    plan: plan && {
      titulo: plan.summary.title, semana_actual: wi.week, semanas_ciclo: wi.total, semana_de_descarga: wi.deload,
      dias: plan.days.map((d) => ({
        id: d.id, nombre: d.label, cardio_final: d.finisher ? `${d.finisher.minutes} min` : null,
        ejercicios: d.blocks.map((b) => ({ id: b.exId, nombre: EX[b.exId].name, series: b.sets, objetivo: b.secs ? `${b.secs} s` : b.reps.join('-') + ' reps' })),
      })),
    },
    entrenos_recientes: logs.slice(0, 10).map((l) => ({
      fecha: (l.started_at || '').slice(0, 10), dia: l.day_label, minutos: l.duration_min, esfuerzo_1_10: l.rpe, kcal: l.kcal,
      nota: l.notes ? String(l.notes).slice(0, 140) : undefined,
      ejercicios: (l.entries || []).slice(0, 10).map((e) => ({ id: e.exId, mejor_serie: bestSet(e.sets) })),
    })),
    registros_diarios: checkins.filter((c) => +new Date(c.date) >= since).slice(0, 35).map((c) => ({
      fecha: c.date, peso_kg: c.weight_kg ?? null, calorias: c.calories ?? null, energia_1_5: c.energy ?? null, agujetas_1_5: c.soreness ?? null, sueno_h: c.sleep_h ?? null,
    })),
    ejercicios_rechazados: [...prefs].filter(([, v]) => v === 'avoid').map(([id]) => id),
    analisis_automatico: { constancia_pct: rv.stats.adherence, hallazgos: rv.items.map((i) => i.title) },
  };
}

// ───────── llamada a la función ─────────
async function invoke(body) {
  if (!navigator.onLine) throw new AIError('offline');
  const { data, error } = await api.sb.functions.invoke('coach', { body });
  if (error) {
    let code = error.name === 'FunctionsFetchError' ? 'offline' : 'ai_error';
    try { const j = await error.context.json(); code = j.error || code; } catch { /* sin cuerpo */ }
    throw new AIError(code);
  }
  if (data?.error) throw new AIError(data.error);
  return data;
}

export async function requestReview() {
  const data = await invoke({ mode: 'review', context: buildContext() });
  if (!data.review) throw new AIError('bad_output');
  const saved = { at: new Date().toISOString(), review: data.review, applied: [] };
  api.local.set(savedKey(), saved);
  return saved;
}

export async function askChat(messages) {
  const data = await invoke({ mode: 'chat', context: buildContext(), messages: messages.slice(-8) });
  if (!data.reply) throw new AIError('empty');
  return data.reply;
}

// ───────── estado guardado ─────────
export const loadSaved = () => (api.S.user ? api.local.get(savedKey()) : null);
export function markApplied(idx) {
  const s = loadSaved(); if (!s) return;
  s.applied = [...new Set([...(s.applied || []), idx])];
  api.local.set(savedKey(), s);
}
export const loadChat = () => (api.S.user ? api.local.get(chatKey(), []) : []);
export const saveChat = (m) => api.local.set(chatKey(), m.slice(-30));
export const clearChat = () => api.local.del(chatKey());

// ───────── propuestas de la IA → acciones seguras del motor local ─────────
// La IA solo propone; aquí se valida contra el plan real y la persona decide si aplicar.
export function toActions(proposals, plan, a) {
  const inPlan = new Set(plan.days.flatMap((d) => d.blocks.map((b) => b.exId)));
  const out = [];
  proposals.forEach((p, idx) => {
    const base = { idx, label: p.label, reason: p.reason };
    let act = null;
    if ((p.type === 'volume' || p.type === 'cardio') && p.delta) act = { type: p.type, delta: p.delta };
    else if (p.type === 'deload') act = { type: 'deload' };
    else if (p.type === 'rotate' && inPlan.has(p.exercise_id)) act = { type: 'rotate', ids: [p.exercise_id] };
    else if (p.type === 'swap' && inPlan.has(p.exercise_id)) act = { type: 'swap', id: p.exercise_id };
    else if (p.type === 'fewer_days' && plan.summary.daysPerWeek > 2) act = { type: 'fewer_days' };
    else if (p.type === 'shorter' && (a.minutes || 45) > 20) act = { type: 'shorter' };
    else if (p.type === 'renew') act = { type: 'renew' };
    if (act) out.push({ ...base, action: { ...act, label: p.label } });
  });
  return out;
}
