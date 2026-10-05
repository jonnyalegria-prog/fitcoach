// Fechas en hora LOCAL (toISOString usa UTC y falla por las noches).
const p2 = (n) => String(n).padStart(2, '0');
export const localISO = (d = new Date()) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
export const todayStr = () => localISO(new Date());
export const sameDay = (a, b) => localISO(new Date(a)) === localISO(new Date(b));

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
export const fmtShort = (d) => { const x = new Date(d); return `${x.getDate()} ${MONTHS[x.getMonth()]}`; };
export const fmtLong = (d = new Date()) => { const x = new Date(d); return `${DAYS[x.getDay()]} ${x.getDate()} de ${MONTHS[x.getMonth()]}`; };
export const dayName = (d) => DAYS[new Date(d).getDay()];
export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export function fmtTime(sec) {
  sec = Math.max(0, Math.round(sec));
  return `${Math.floor(sec / 60)}:${p2(sec % 60)}`;
}
export const num = (v) => { const n = parseFloat(String(v).replace(',', '.')); return Number.isFinite(n) ? n : null; };
export const fmtKg = (n) => (n == null ? '–' : (Math.round(n * 10) / 10).toString().replace('.', ','));
