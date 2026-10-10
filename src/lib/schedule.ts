import type { ScheduleBlock } from "./types";

/** Días en el orden de una agenda ecuatoriana: de lunes a domingo (0 = domingo). */
export const WEEK = [
  { day: 1, short: "Lun", long: "Lunes" },
  { day: 2, short: "Mar", long: "Martes" },
  { day: 3, short: "Mié", long: "Miércoles" },
  { day: 4, short: "Jue", long: "Jueves" },
  { day: 5, short: "Vie", long: "Viernes" },
  { day: 6, short: "Sáb", long: "Sábado" },
  { day: 0, short: "Dom", long: "Domingo" },
] as const;

export const toTime = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

/** Opciones de hora cada 15 minutos, de 06:00 a 22:00. */
export const TIME_OPTIONS = Array.from({ length: (22 - 6) * 4 + 1 }, (_, i) => 6 * 60 + i * 15);

const dayKey = (blocks: ScheduleBlock[]) =>
  blocks.map((b) => `${b.startMinute}-${b.endMinute}`).join(",");

/**
 * Resume el horario agrupando días seguidos con el mismo horario:
 * ["Lun a Vie · 09:00–13:00, 15:00–18:00", "Sáb · 09:00–12:00"].
 */
export function summarizeSchedule(blocks: ScheduleBlock[]): string[] {
  const groups: { days: string[]; key: string; hours: string; lastIndex: number }[] = [];

  WEEK.forEach(({ day, short }, index) => {
    const dayBlocks = blocks
      .filter((b) => b.dayOfWeek === day)
      .sort((a, b) => a.startMinute - b.startMinute);
    if (!dayBlocks.length) return;

    const key = dayKey(dayBlocks);
    const last = groups.at(-1);
    if (last && last.key === key && last.lastIndex === index - 1) {
      last.days.push(short);
      last.lastIndex = index;
      return;
    }
    const hours = dayBlocks.map((b) => `${toTime(b.startMinute)}–${toTime(b.endMinute)}`).join(", ");
    groups.push({ days: [short], key, hours, lastIndex: index });
  });

  return groups.map(({ days, hours }) => {
    const label =
      days.length === 1
        ? days[0]
        : days.length === 2
          ? `${days[0]} y ${days[1]}`
          : `${days[0]} a ${days.at(-1)}`;
    return `${label} · ${hours}`;
  });
}

export const DOCTOR_COLORS = [
  "#0E7490",
  "#0EA5E9",
  "#2563EB",
  "#8B5CF6",
  "#DB2777",
  "#EA580C",
  "#CA8A04",
  "#16A34A",
  "#475569",
];
