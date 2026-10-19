import {
  BLUE,
  faceAt,
  LIGHT_BLUE,
  RED,
  type Arch,
  type OdontogramData,
  type Span,
  type SurfaceMark,
} from "@/lib/odontogram";
import { cn } from "@/lib/cn";

/** Colores del tema como variables CSS: cambian solos en modo oscuro. */
const SURFACE = "var(--color-surface)";
const OUTLINE = "var(--color-muted)";

/** Ancho de cada pieza y separación en la línea media (en unidades del SVG). */
const CELL = 44;
const MID = 14;
const HEIGHT = 70;

type Part = "top" | "right" | "bottom" | "left";
/** Las 4 caras de alrededor (anillo) dentro de una caja de 40×40; la del centro es un círculo. */
const PARTS: Record<Part, string> = {
  top: "M7.27 7.27A18 18 0 0 1 32.73 7.27L25.66 14.34A8 8 0 0 0 14.34 14.34Z",
  right: "M32.73 7.27A18 18 0 0 1 32.73 32.73L25.66 25.66A8 8 0 0 0 25.66 14.34Z",
  bottom: "M32.73 32.73A18 18 0 0 1 7.27 32.73L14.34 25.66A8 8 0 0 0 25.66 25.66Z",
  left: "M7.27 32.73A18 18 0 0 1 7.27 7.27L14.34 14.34A8 8 0 0 0 14.34 25.66Z",
};

const SURFACE_STYLE: Record<SurfaceMark, { fill: string; ring?: string }> = {
  CARIES: { fill: RED },
  FILLING: { fill: BLUE },
  FILLING_BAD: { fill: BLUE, ring: RED },
  SEALANT: { fill: LIGHT_BLUE },
  SEALANT_BAD: { fill: LIGHT_BLUE, ring: RED },
};

/** Arriba: número, raíz y corona. Abajo, al revés (las raíces apuntan hacia afuera). */
function layout(arch: Arch) {
  return arch === "UPPER" ? { numberY: 11, rootY: [16, 27], crownY: 28 } : { numberY: 66, rootY: [43, 54], crownY: 0 };
}

export function archWidth(count: number) {
  return count * CELL + MID;
}

/**
 * Una arcada del odontograma: cada pieza con sus 5 caras, las marcas del
 * diente completo y las que unen piezas (prótesis, ortodoncia).
 */
export function ArchChart({
  arch,
  teeth,
  data,
  selected,
  spanStart,
  interactive,
  onSurface,
  onTooth,
}: {
  arch: Arch;
  teeth: number[];
  data: OdontogramData;
  selected: number | null;
  /** Primera pieza elegida de una prótesis o aparato, mientras se elige la última. */
  spanStart: number | null;
  interactive: boolean;
  onSurface: (tooth: number, part: Part | "center") => void;
  onTooth: (tooth: number) => void;
}) {
  const half = teeth.length / 2;
  const x = (i: number) => i * CELL + (i >= half ? MID : 0);
  const { numberY, rootY, crownY } = layout(arch);
  const width = archWidth(teeth.length);
  const indexOf = (tooth: number) => teeth.indexOf(tooth);
  const spans = data.spans.filter((s): s is Extract<Span, { from: number }> =>
    "from" in s ? indexOf(s.from) >= 0 && indexOf(s.to) >= 0 : false,
  );
  const fullDenture = data.spans.some((s) => s.type === "FULL_DENTURE" && s.arch === arch);

  return (
    <svg
      viewBox={`0 0 ${width} ${HEIGHT}`}
      width={width}
      height={HEIGHT}
      role="group"
      aria-label={arch === "UPPER" ? "Arcada superior" : "Arcada inferior"}
      className="block shrink-0"
    >
      {/* Línea media */}
      <line
        x1={half * CELL + MID / 2}
        x2={half * CELL + MID / 2}
        y1={0}
        y2={HEIGHT}
        style={{ stroke: OUTLINE, strokeOpacity: 0.4 }}
        strokeWidth={1.5}
      />

      {teeth.map((tooth, i) => {
        const state = data.teeth[tooth] ?? {};
        const marks = new Set(state.marks ?? []);
        const unerupted = marks.has("UNERUPTED");
        const cx = x(i) + CELL / 2;
        const cy = crownY + 20;
        const isSelected = selected === tooth;
        const surfaceMark = (part: Part | "center") => state.surfaces?.[faceAt(tooth, part)];
        const outline = { stroke: OUTLINE, strokeOpacity: 0.6 };
        const clickable = cn(interactive && "cursor-pointer hover:opacity-80");
        return (
          <g key={tooth}>
            {/* Fondo de la pieza: clic fuera de las caras = la pieza completa */}
            <rect
              x={x(i) + 1}
              y={1}
              width={CELL - 2}
              height={HEIGHT - 2}
              rx={10}
              style={{ fill: isSelected ? "var(--color-brand-50)" : "transparent" }}
              className={cn(interactive && "cursor-pointer")}
              onClick={() => onTooth(tooth)}
            />
            {spanStart === tooth && (
              <rect
                x={x(i) + 1}
                y={1}
                width={CELL - 2}
                height={HEIGHT - 2}
                rx={10}
                fill="none"
                stroke="#d97706"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                pointerEvents="none"
              />
            )}
            <text
              x={cx}
              y={numberY}
              textAnchor="middle"
              fontSize={11}
              pointerEvents="none"
              style={{ fill: isSelected ? "var(--color-brand-600)" : OUTLINE }}
              fontWeight={isSelected ? 700 : 400}
            >
              {tooth}
            </text>

            {/* Raíz: endodoncia e implante */}
            {(marks.has("ENDO") || marks.has("ENDO_NEEDED")) && (
              <line
                x1={cx}
                x2={cx}
                y1={rootY[0]}
                y2={rootY[1]}
                stroke={marks.has("ENDO") ? BLUE : RED}
                strokeWidth={3}
                strokeLinecap="round"
                pointerEvents="none"
              />
            )}
            {marks.has("IMPLANT") && (
              <text
                x={cx}
                y={(rootY[0] + rootY[1]) / 2 + 3.5}
                textAnchor="middle"
                fontSize={9}
                fontWeight={700}
                fill={BLUE}
                pointerEvents="none"
              >
                IMP
              </text>
            )}

            {/* Corona: 5 caras */}
            <g transform={`translate(${x(i) + 2} ${crownY})`} opacity={unerupted ? 0.35 : 1}>
              {(Object.keys(PARTS) as Part[]).map((part) => {
                const mark = surfaceMark(part);
                return (
                  <path
                    key={part}
                    d={PARTS[part]}
                    strokeWidth={1}
                    className={clickable}
                    style={{ ...outline, fill: mark ? SURFACE_STYLE[mark].fill : SURFACE }}
                    onClick={() => onSurface(tooth, part)}
                  />
                );
              })}
              <circle
                cx={20}
                cy={20}
                r={8}
                strokeWidth={1}
                className={clickable}
                style={{
                  ...outline,
                  fill: surfaceMark("center") ? SURFACE_STYLE[surfaceMark("center")!].fill : SURFACE,
                }}
                onClick={() => onSurface(tooth, "center")}
              />
              {/* Borde rojo de obturaciones y sellantes en mal estado */}
              {(Object.keys(PARTS) as Part[]).map((part) => {
                const ring = surfaceMark(part) && SURFACE_STYLE[surfaceMark(part)!].ring;
                return ring ? (
                  <path key={part} d={PARTS[part]} fill="none" stroke={ring} strokeWidth={2} pointerEvents="none" />
                ) : null;
              })}
              {surfaceMark("center") && SURFACE_STYLE[surfaceMark("center")!].ring && (
                <circle cx={20} cy={20} r={8} fill="none" stroke={RED} strokeWidth={2} pointerEvents="none" />
              )}
            </g>

            {/* Marcas del diente completo */}
            <g pointerEvents="none">
              {unerupted && (
                <circle cx={cx} cy={cy} r={19} fill="none" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="3 3" />
              )}
              {(marks.has("CROWN") || marks.has("CROWN_BAD")) && (
                <circle cx={cx} cy={cy} r={19} fill="none" stroke={marks.has("CROWN") ? BLUE : RED} strokeWidth={3} />
              )}
              {(marks.has("MISSING") || marks.has("EXTRACTION")) && (
                <path
                  d={`M${cx - 15} ${cy - 15}L${cx + 15} ${cy + 15}M${cx + 15} ${cy - 15}L${cx - 15} ${cy + 15}`}
                  stroke={marks.has("MISSING") ? BLUE : RED}
                  strokeWidth={3}
                  strokeLinecap="round"
                />
              )}
              {marks.has("FRACTURE") && (
                <polyline
                  points={`${cx + 2},${cy - 19} ${cx - 5},${cy - 9} ${cx + 4},${cy - 2} ${cx - 6},${cy + 8} ${cx + 1},${cy + 19}`}
                  fill="none"
                  stroke={RED}
                  strokeWidth={2.5}
                  strokeLinejoin="round"
                />
              )}
              {marks.has("ROOT_REMNANT") && (
                <text
                  x={cx}
                  y={cy + 4.5}
                  textAnchor="middle"
                  fontSize={13}
                  fontWeight={800}
                  fill={RED}
                  style={{ stroke: SURFACE }}
                  strokeWidth={3}
                  paintOrder="stroke"
                >
                  RR
                </text>
              )}
            </g>
          </g>
        );
      })}

      {/* Marcas que unen piezas */}
      <g pointerEvents="none">
        {spans.map((s, k) => {
          const [a, b] = [indexOf(s.from), indexOf(s.to)].sort((m, n) => m - n);
          const left = x(a) + 1.5;
          const right = x(b) + CELL - 1.5;
          const color = s.type === "BRIDGE_BAD" ? RED : BLUE;
          if (s.type === "ORTHO") {
            const y = crownY + 20;
            return (
              <g key={k} stroke={BLUE} strokeWidth={2}>
                <line x1={x(a) + CELL / 2} x2={x(b) + CELL / 2} y1={y} y2={y} />
                <rect x={x(a) + CELL / 2 - 4} y={y - 4} width={8} height={8} style={{ fill: SURFACE }} />
                <rect x={x(b) + CELL / 2 - 4} y={y - 4} width={8} height={8} style={{ fill: SURFACE }} />
              </g>
            );
          }
          return (
            <rect
              key={k}
              x={left}
              y={crownY - 1.5}
              width={right - left}
              height={43}
              rx={14}
              fill="none"
              stroke={color}
              strokeWidth={2.5}
              strokeDasharray={s.type === "REMOVABLE" ? "6 4" : undefined}
            />
          );
        })}
        {fullDenture && (
          <g>
            <line
              x1={6}
              x2={width - 6}
              y1={(rootY[0] + rootY[1]) / 2}
              y2={(rootY[0] + rootY[1]) / 2}
              stroke={BLUE}
              strokeWidth={2}
            />
            <rect x={width / 2 - 14} y={rootY[0] - 1} width={28} height={13} rx={4} style={{ fill: SURFACE }} />
            <text x={width / 2} y={rootY[0] + 9} textAnchor="middle" fontSize={10} fontWeight={700} fill={BLUE}>
              PT
            </text>
          </g>
        )}
      </g>
    </svg>
  );
}
