/**
 * Odontograma: numeración FDI, caras y marcas. El backend valida la misma
 * lista (src/clinical/odontogram.catalog.ts); una marca nueva va en los dos lados.
 */

export type Dentition = "ADULT" | "CHILD";
/** Vestibular, lingual/palatina, mesial, distal, oclusal/incisal. */
export type Surface = "V" | "L" | "M" | "D" | "O";
export type SurfaceMark = "CARIES" | "FILLING" | "FILLING_BAD" | "SEALANT" | "SEALANT_BAD";
export type ToothMark =
  | "MISSING"
  | "EXTRACTION"
  | "CROWN"
  | "CROWN_BAD"
  | "FRACTURE"
  | "ENDO"
  | "ENDO_NEEDED"
  | "IMPLANT"
  | "ROOT_REMNANT"
  | "UNERUPTED";
export type SpanMark = "BRIDGE" | "BRIDGE_BAD" | "ORTHO" | "REMOVABLE";
export type Arch = "UPPER" | "LOWER";

export interface ToothState {
  surfaces?: Partial<Record<Surface, SurfaceMark>>;
  marks?: ToothMark[];
  material?: string;
  cariesClass?: string;
}

export type Span = { type: SpanMark; from: number; to: number } | { type: "FULL_DENTURE"; arch: Arch };

export interface OdontogramData {
  dentition: Dentition;
  teeth: Record<string, ToothState>;
  spans: Span[];
}

export interface OdontogramVersion extends OdontogramData {
  id: string;
  note: string | null;
  createdAt: string;
  author: { id: string; fullName: string };
}

export interface OdontogramResponse {
  current: OdontogramVersion | null;
  versions: { id: string; createdAt: string; note: string | null; author: { id: string; fullName: string } }[];
}

/** Azul: existente o en buen estado. Rojo: patología o tratamiento pendiente. */
export const BLUE = "#2563eb";
export const RED = "#e5484d";
export const LIGHT_BLUE = "#93c5fd";

export type Tool = SurfaceMark | ToothMark | SpanMark | "FULL_DENTURE" | "ERASE";

/** Paleta: lo que ve el doctor, en el orden en que aparece. */
export const TOOLS: { group: string; items: { tool: Tool; label: string; color: string }[] }[] = [
  {
    group: "Por cara",
    items: [
      { tool: "CARIES", label: "Caries", color: RED },
      { tool: "FILLING", label: "Obturación", color: BLUE },
      { tool: "FILLING_BAD", label: "Obturación en mal estado", color: RED },
      { tool: "SEALANT", label: "Sellante", color: LIGHT_BLUE },
      { tool: "SEALANT_BAD", label: "Sellante en mal estado", color: RED },
      { tool: "ERASE", label: "Borrar cara", color: "" },
    ],
  },
  {
    group: "Diente completo",
    items: [
      { tool: "MISSING", label: "Ausente", color: BLUE },
      { tool: "EXTRACTION", label: "Extracción indicada", color: RED },
      { tool: "CROWN", label: "Corona", color: BLUE },
      { tool: "CROWN_BAD", label: "Corona en mal estado", color: RED },
      { tool: "FRACTURE", label: "Fractura", color: RED },
      { tool: "ENDO", label: "Endodoncia", color: BLUE },
      { tool: "ENDO_NEEDED", label: "Endodoncia indicada", color: RED },
      { tool: "IMPLANT", label: "Implante", color: BLUE },
      { tool: "ROOT_REMNANT", label: "Resto radicular", color: RED },
      { tool: "UNERUPTED", label: "No erupcionado", color: "#94a3b8" },
    ],
  },
  {
    group: "Varias piezas",
    items: [
      { tool: "BRIDGE", label: "Prótesis fija", color: BLUE },
      { tool: "BRIDGE_BAD", label: "Prótesis fija en mal estado", color: RED },
      { tool: "ORTHO", label: "Ortodoncia", color: BLUE },
      { tool: "REMOVABLE", label: "Prótesis removible", color: BLUE },
      { tool: "FULL_DENTURE", label: "Prótesis total", color: BLUE },
    ],
  },
];

export const toolLabel = (tool: Tool) => TOOLS.flatMap((g) => g.items).find((i) => i.tool === tool)?.label ?? tool;

export const SURFACE_TOOLS = new Set<Tool>(["CARIES", "FILLING", "FILLING_BAD", "SEALANT", "SEALANT_BAD", "ERASE"]);
export const SPAN_TOOLS = new Set<Tool>(["BRIDGE", "BRIDGE_BAD", "ORTHO", "REMOVABLE"]);

/** Marcas de diente que se excluyen entre sí (bien / mal estado). */
const EXCLUSIVE: ToothMark[][] = [
  ["CROWN", "CROWN_BAD"],
  ["ENDO", "ENDO_NEEDED"],
  ["MISSING", "EXTRACTION"],
];

/** Pone o quita una marca de diente completo. "Ausente" deja el diente sin otras marcas. */
export function toggleToothMark(state: ToothState, mark: ToothMark): ToothState {
  const marks = state.marks ?? [];
  if (marks.includes(mark)) return { ...state, marks: marks.filter((m) => m !== mark) };
  if (mark === "MISSING") return { material: state.material, cariesClass: state.cariesClass, marks: ["MISSING"] };
  const rivals = EXCLUSIVE.find((group) => group.includes(mark)) ?? [];
  return {
    ...state,
    marks: [...marks.filter((m) => m !== "MISSING" && !rivals.includes(m)), mark],
  };
}

/** Piezas por arcada, en el orden en que se ven (derecha del paciente a la izquierda de la pantalla). */
export const ARCHES: Record<Dentition, Record<Arch, number[]>> = {
  ADULT: {
    UPPER: [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
    LOWER: [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38],
  },
  CHILD: {
    UPPER: [55, 54, 53, 52, 51, 61, 62, 63, 64, 65],
    LOWER: [85, 84, 83, 82, 81, 71, 72, 73, 74, 75],
  },
};

const quadrant = (tooth: number) => Math.floor(tooth / 10);
export const isUpper = (tooth: number) => [1, 2, 5, 6].includes(quadrant(tooth));
/** Cuadrantes del lado derecho del paciente (a la izquierda en la pantalla). */
const isPatientRight = (tooth: number) => [1, 4, 5, 8].includes(quadrant(tooth));
const isAnterior = (tooth: number) => tooth % 10 <= 3;

/** Qué cara es cada parte del círculo según la pieza (arriba, abajo, izquierda, derecha, centro). */
export function faceAt(tooth: number, part: "top" | "bottom" | "left" | "right" | "center"): Surface {
  if (part === "center") return "O";
  if (part === "top") return isUpper(tooth) ? "V" : "L";
  if (part === "bottom") return isUpper(tooth) ? "L" : "V";
  // Mesial mira hacia la línea media.
  return (part === "right") === isPatientRight(tooth) ? "M" : "D";
}

export function surfaceName(tooth: number, surface: Surface) {
  switch (surface) {
    case "V":
      return "vestibular";
    case "L":
      return isUpper(tooth) ? "palatina" : "lingual";
    case "M":
      return "mesial";
    case "D":
      return "distal";
    case "O":
      return isAnterior(tooth) ? "incisal" : "oclusal";
  }
}

const PERMANENT = [
  "incisivo central",
  "incisivo lateral",
  "canino",
  "primer premolar",
  "segundo premolar",
  "primer molar",
  "segundo molar",
  "tercer molar",
];
const DECIDUOUS = ["incisivo central", "incisivo lateral", "canino", "primer molar", "segundo molar"];

/** "Primer molar superior derecho". */
export function toothName(tooth: number) {
  const q = quadrant(tooth);
  const name = (q <= 4 ? PERMANENT : DECIDUOUS)[(tooth % 10) - 1];
  const side = isPatientRight(tooth) ? "derecho" : "izquierdo";
  const text = `${name} ${isUpper(tooth) ? "superior" : "inferior"} ${side}${q > 4 ? " (temporal)" : ""}`;
  return text[0].toUpperCase() + text.slice(1);
}

export const isEmptyTooth = (t: ToothState | undefined) =>
  !t || (!Object.keys(t.surfaces ?? {}).length && !t.marks?.length && !t.material && !t.cariesClass);
