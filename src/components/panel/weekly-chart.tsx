/**
 * Gráfico de línea de citas por semana, dibujado como SVG en el servidor.
 * Área turquesa + línea punteada con el promedio.
 */
const W = 520;
const H = 200;
const PAD = { top: 12, right: 8, bottom: 26, left: 30 };

const shortDate = new Intl.DateTimeFormat("es-EC", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

export function WeeklyChart({
  weeks,
  average,
}: {
  weeks: { weekStart: string; count: number }[];
  average: number;
}) {
  const max = Math.max(4, ...weeks.map((w) => w.count));
  // Techo "redondo" para las líneas guía (4, 8, 12, 20…).
  const top = Math.ceil(max / 4) * 4;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (i / (weeks.length - 1)) * innerW;
  const y = (v: number) => PAD.top + innerH - (v / top) * innerH;

  const line = weeks.map((w, i) => `${x(i)},${y(w.count)}`).join(" ");
  const area = `M${x(0)},${y(0)} L${line.replaceAll(" ", " L")} L${x(weeks.length - 1)},${y(0)}Z`;
  const ticks = [0, top / 4, top / 2, (3 * top) / 4, top];
  const empty = weeks.every((w) => w.count === 0);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label={`Citas por semana en las últimas ${weeks.length} semanas. Promedio ${average}.`}
    >
      {ticks.map((t) => (
        <g key={t}>
          <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="#eef3f5" />
          <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" fontSize="12" fill="#5b7580">
            {t}
          </text>
        </g>
      ))}
      <path d={area} fill="#e0f2f5" />
      <polyline points={line} fill="none" stroke="#0e7490" strokeWidth="2.5" strokeLinejoin="round" />
      <line
        x1={PAD.left}
        x2={W - PAD.right}
        y1={y(average)}
        y2={y(average)}
        stroke="#c8693f"
        strokeWidth="1.5"
        strokeDasharray="5 5"
      />
      {/* Una etiqueta cada 2 semanas, terminando en la semana actual. */}
      {weeks.map((w, i) =>
        (weeks.length - 1 - i) % 2 === 0 ? (
          <text
            key={w.weekStart}
            x={x(i)}
            y={H - 6}
            textAnchor={i === weeks.length - 1 ? "end" : "middle"}
            fontSize="12"
            fill="#5b7580"
          >
            {shortDate.format(new Date(`${w.weekStart}T00:00:00Z`)).replace(".", "")}
          </text>
        ) : null,
      )}
      {empty && (
        <text x={PAD.left + innerW / 2} y={PAD.top + innerH / 2} textAnchor="middle" fontSize="15" fill="#5b7580">
          Aún no hay citas en estas semanas
        </text>
      )}
    </svg>
  );
}
