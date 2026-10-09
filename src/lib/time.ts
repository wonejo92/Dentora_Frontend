/** Fechas en la zona horaria de la clínica, sin librerías externas. */

/** `YYYY-MM-DD` de un instante en la zona dada. */
export const localDate = (instant: Date, timeZone: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone }).format(instant);

function offsetMinutes(instant: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(instant);
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
  return Math.round((asUtc - instant.getTime()) / 60000);
}

/** Inicio (00:00 local) de un día `YYYY-MM-DD`, como instante UTC. */
export function startOfLocalDay(date: string, timeZone: string) {
  const [y, m, d] = date.split("-").map(Number);
  const naive = new Date(Date.UTC(y, m - 1, d));
  return new Date(naive.getTime() - offsetMinutes(naive, timeZone) * 60000);
}

/** Suma días a una fecha `YYYY-MM-DD`. */
export function addDays(date: string, days: number) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export const formatTime = (iso: string, timeZone: string) =>
  new Intl.DateTimeFormat("es-EC", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));

/** "Miércoles, 14 de octubre" para un `YYYY-MM-DD`. */
export function formatLongDate(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  const text = new Intl.DateTimeFormat("es-EC", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(Date.UTC(y, m - 1, d)));
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export const isValidDate = (value: unknown): value is string =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(Date.parse(value));

/** Días de calendario (en la zona de la clínica) desde hoy hasta `iso`. Negativo si ya pasó. */
export function calendarDaysUntil(iso: string, timeZone: string) {
  const today = Date.parse(localDate(new Date(), timeZone));
  const target = Date.parse(localDate(new Date(iso), timeZone));
  return Math.round((target - today) / (24 * 60 * 60 * 1000));
}
