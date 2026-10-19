"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveOdontogram } from "@/app/actions/clinical";
import { Button } from "@/components/ui/button";
import { controlClass } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { cn } from "@/lib/cn";
import {
  ARCHES,
  faceAt,
  isEmptyTooth,
  isUpper,
  SPAN_TOOLS,
  SURFACE_TOOLS,
  surfaceName,
  toggleToothMark,
  toolLabel,
  TOOLS,
  toothName,
  type Arch,
  type Dentition,
  type OdontogramData,
  type OdontogramResponse,
  type OdontogramVersion,
  type Span,
  type Surface,
  type SurfaceMark,
  type Tool,
  type ToothMark,
  type ToothState,
} from "@/lib/odontogram";
import { ArchChart, archWidth } from "./odontogram-chart";

const EMPTY: OdontogramData = { dentition: "ADULT", teeth: {}, spans: [] };

const versionDate = (iso: string, timeZone: string) =>
  new Intl.DateTimeFormat("es-EC", {
    timeZone,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

/** Quita las piezas que quedaron sin nada, para comparar y guardar limpio. */
function clean(data: OdontogramData): OdontogramData {
  const teeth = Object.fromEntries(Object.entries(data.teeth).filter(([, t]) => !isEmptyTooth(t)));
  return { dentition: data.dentition, teeth, spans: data.spans };
}

function hintFor(tool: Tool, spanStart: number | null) {
  if (SPAN_TOOLS.has(tool))
    return spanStart ? `Ahora elige la última pieza (empieza en la ${spanStart})` : "Elige la primera pieza";
  if (tool === "FULL_DENTURE") return "Haz clic en cualquier pieza de la arcada";
  if (SURFACE_TOOLS.has(tool)) return "Haz clic en una cara del diente";
  return "Haz clic en el diente";
}

/**
 * Editor del odontograma: paleta de marcas (azul = existente o en buen
 * estado, rojo = por tratar), las dos arcadas y el detalle de la pieza elegida.
 * Guardar crea una versión nueva; una versión anterior se ve sin poder editarla.
 */
export function OdontogramEditor({
  patientId,
  version,
  versions,
  isCurrent,
  timeZone,
}: {
  patientId: string;
  /** La versión que se muestra (null = el paciente aún no tiene odontograma). */
  version: OdontogramVersion | null;
  versions: OdontogramResponse["versions"];
  /** false = versión anterior, solo lectura. */
  isCurrent: boolean;
  timeZone: string;
}) {
  const router = useRouter();
  const initial = version ? clean(version) : EMPTY;
  const [data, setData] = useState<OdontogramData>(initial);
  const [tool, setTool] = useState<Tool>("CARIES");
  const [selected, setSelected] = useState<number>(ARCHES[initial.dentition].UPPER[2]);
  const [spanStart, setSpanStart] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [hint, setHint] = useState<string>();
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const editable = isCurrent;
  const dirty = JSON.stringify(clean(data)) !== JSON.stringify(initial);

  const updateTooth = (tooth: number, change: (t: ToothState) => ToothState) =>
    setData((d) => ({ ...d, teeth: { ...d.teeth, [tooth]: change(d.teeth[tooth] ?? {}) } }));

  const pickTool = (next: Tool) => {
    setTool(next);
    setSpanStart(null);
    setHint(undefined);
  };

  /** Clic en una cara: marca de cara, o la pieza completa si la herramienta es de diente. */
  const onSurface = (tooth: number, part: Parameters<typeof faceAt>[1]) => {
    if (!editable || !SURFACE_TOOLS.has(tool)) return onTooth(tooth);
    setSelected(tooth);
    const face = faceAt(tooth, part);
    updateTooth(tooth, (t) => {
      const surfaces = { ...t.surfaces };
      if (tool === "ERASE" || surfaces[face] === tool) delete surfaces[face];
      else surfaces[face] = tool as SurfaceMark;
      return { ...t, surfaces };
    });
    setHint(`Pieza ${tooth}, cara ${surfaceName(tooth, face)}`);
  };

  const onTooth = (tooth: number) => {
    setSelected(tooth);
    if (!editable || SURFACE_TOOLS.has(tool)) return;
    if (tool === "FULL_DENTURE") {
      const arch: Arch = isUpper(tooth) ? "UPPER" : "LOWER";
      setData((d) => {
        const has = d.spans.some((s) => s.type === "FULL_DENTURE" && s.arch === arch);
        return {
          ...d,
          spans: has
            ? d.spans.filter((s) => !(s.type === "FULL_DENTURE" && s.arch === arch))
            : [...d.spans, { type: "FULL_DENTURE", arch }],
        };
      });
      return;
    }
    if (SPAN_TOOLS.has(tool)) {
      if (spanStart === null || spanStart === tooth) {
        setSpanStart(spanStart === tooth ? null : tooth);
        setHint(undefined);
        return;
      }
      if (isUpper(spanStart) !== isUpper(tooth)) {
        setHint("Las dos piezas deben ser de la misma arcada");
        return;
      }
      const span = { type: tool, from: spanStart, to: tooth } as Span;
      setData((d) => ({ ...d, spans: [...d.spans, span] }));
      setSpanStart(null);
      setHint(`${toolLabel(tool)}: de la ${spanStart} a la ${tooth}`);
      return;
    }
    updateTooth(tooth, (t) => toggleToothMark(t, tool as ToothMark));
  };

  const setDentition = (dentition: Dentition) => {
    setData((d) => ({ ...d, dentition }));
    setSelected(ARCHES[dentition].UPPER[2]);
    setSpanStart(null);
  };

  const save = () =>
    startTransition(async () => {
      setError(undefined);
      const result = await saveOdontogram(patientId, { ...clean(data), note });
      if (!result.ok) return setError(result.error);
      setNote("");
      setHint(undefined);
      toast.success("Odontograma guardado", { description: "Se creó una versión nueva." });
    });

  const tooth = data.teeth[selected] ?? {};
  const surfaces = Object.entries(tooth.surfaces ?? {}) as [Surface, SurfaceMark][];
  const spans = data.spans;
  const arches = ARCHES[data.dentition];

  return (
    <section className="space-y-4 rounded-3xl bg-surface p-5 sm:p-6">
      {/* Encabezado: dentición y versiones */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-full bg-canvas p-1 text-sm font-medium">
          {(["ADULT", "CHILD"] as Dentition[]).map((d) => (
            <button
              key={d}
              type="button"
              disabled={!editable}
              onClick={() => setDentition(d)}
              aria-pressed={data.dentition === d}
              className={cn(
                "rounded-full px-4 py-1.5 transition-colors",
                data.dentition === d ? "bg-night-900 text-white" : "text-muted hover:text-ink",
              )}
            >
              {d === "ADULT" ? "Adulto" : "Infantil"}
            </button>
          ))}
        </div>
        {versions.length > 0 && (
          <label className="flex items-center gap-2 text-sm text-muted">
            Versión
            <select
              value={version?.id}
              onChange={(e) =>
                router.push(
                  e.target.value === versions[0].id
                    ? `/panel/pacientes/${patientId}?tab=odontograma`
                    : `/panel/pacientes/${patientId}?tab=odontograma&version=${e.target.value}`,
                )
              }
              className={cn(controlClass(), "h-9 w-auto")}
            >
              {versions.map((v, i) => (
                <option key={v.id} value={v.id}>
                  {versionDate(v.createdAt, timeZone)} · {v.author.fullName}
                  {i === 0 ? " (actual)" : ""}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {!isCurrent && version && (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Estás viendo cómo estaba el {versionDate(version.createdAt, timeZone)}
          {version.note ? ` (${version.note})` : ""}. Las versiones anteriores no se modifican.
        </p>
      )}

      {/* Paleta */}
      {editable && (
        <div className="space-y-3 rounded-2xl bg-canvas p-4">
          {TOOLS.map((group) => (
            <div key={group.group}>
              <p className="mb-1.5 text-xs font-medium text-muted">{group.group}</p>
              <div className="flex flex-wrap gap-1.5">
                {group.items.map((item) => (
                  <button
                    key={item.tool}
                    type="button"
                    onClick={() => pickTool(item.tool)}
                    aria-pressed={tool === item.tool}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      tool === item.tool
                        ? "border-night-900 bg-night-900 text-white"
                        : "border-line bg-surface text-ink hover:border-brand-200",
                    )}
                  >
                    {item.color ? (
                      <span aria-hidden className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    ) : (
                      <span aria-hidden className="size-2.5 rounded-full border border-current" />
                    )}
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Arcadas */}
      <div className="overflow-x-auto">
        <div className="mx-auto space-y-1" style={{ width: archWidth(arches.UPPER.length) }}>
          {(["UPPER", "LOWER"] as Arch[]).map((arch, i) => (
            <div key={arch}>
              {i === 1 && <hr className="my-1 border-line" />}
              <ArchChart
                arch={arch}
                teeth={arches[arch]}
                data={data}
                selected={selected}
                spanStart={spanStart}
                interactive={editable}
                onSurface={onSurface}
                onTooth={onTooth}
              />
            </div>
          ))}
        </div>
      </div>
      <p className="text-center text-xs text-muted" aria-live="polite">
        {hint ?? (editable ? hintFor(tool, spanStart) : "Elige una pieza para ver su detalle")}
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Pieza elegida */}
        <div className="rounded-2xl border border-line p-4">
          <p className="font-semibold">Pieza {selected}</p>
          <p className="text-xs text-muted">{toothName(selected)}</p>
          <ul className="mt-3 flex flex-wrap gap-1.5 text-xs">
            {surfaces.length === 0 && !tooth.marks?.length && <li className="text-muted">Sin marcas</li>}
            {surfaces.map(([face, mark]) => (
              <Chip
                key={face}
                label={`${toolLabel(mark)} · ${surfaceName(selected, face)}`}
                onRemove={
                  editable &&
                  (() =>
                    updateTooth(selected, (t) => {
                      const next = { ...t.surfaces };
                      delete next[face];
                      return { ...t, surfaces: next };
                    }))
                }
              />
            ))}
            {tooth.marks?.map((mark) => (
              <Chip
                key={mark}
                label={toolLabel(mark)}
                onRemove={editable && (() => updateTooth(selected, (t) => toggleToothMark(t, mark)))}
              />
            ))}
          </ul>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-medium text-muted">
              Material restaurador
              <input
                value={tooth.material ?? ""}
                disabled={!editable}
                maxLength={60}
                placeholder={editable ? "Resina" : "Sin dato"}
                onChange={(e) => updateTooth(selected, (t) => ({ ...t, material: e.target.value }))}
                className={cn(controlClass(), "h-10 w-full")}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-muted">
              Clasificación de caries
              <input
                value={tooth.cariesClass ?? ""}
                disabled={!editable}
                maxLength={60}
                placeholder={editable ? "Clase I" : "Sin dato"}
                onChange={(e) => updateTooth(selected, (t) => ({ ...t, cariesClass: e.target.value }))}
                className={cn(controlClass(), "h-10 w-full")}
              />
            </label>
          </div>
        </div>

        {/* Prótesis y aparatos, y guardar */}
        <div className="flex flex-col gap-4 rounded-2xl border border-line p-4">
          <div>
            <p className="font-semibold">Prótesis y aparatos</p>
            <ul className="mt-2 flex flex-wrap gap-1.5 text-xs">
              {spans.length === 0 && <li className="text-muted">Ninguno</li>}
              {spans.map((s, i) => (
                <Chip
                  key={i}
                  label={
                    s.type === "FULL_DENTURE"
                      ? `Prótesis total ${s.arch === "UPPER" ? "superior" : "inferior"}`
                      : `${toolLabel(s.type)} · ${s.from} a ${s.to}`
                  }
                  onRemove={editable && (() => setData((d) => ({ ...d, spans: d.spans.filter((_, k) => k !== i) })))}
                />
              ))}
            </ul>
          </div>

          {editable && (
            <div className="mt-auto space-y-3 border-t border-line pt-4">
              <FormError message={error} />
              <label className="flex flex-col gap-1 text-xs font-medium text-muted">
                Comentario de esta versión (opcional)
                <input
                  value={note}
                  maxLength={300}
                  placeholder="Primera consulta"
                  onChange={(e) => setNote(e.target.value)}
                  className={cn(controlClass(), "h-10 w-full")}
                />
              </label>
              <div className="flex flex-wrap justify-end gap-2">
                {dirty && (
                  <Button type="button" variant="secondary" disabled={pending} onClick={() => setData(initial)}>
                    Descartar cambios
                  </Button>
                )}
                <Button type="button" disabled={pending || !dirty} onClick={save}>
                  {pending ? "Guardando…" : "Guardar odontograma"}
                </Button>
              </div>
              {!dirty && versions.length > 0 && (
                <p className="text-right text-xs text-muted">Sin cambios desde la última versión</p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: false | (() => void) }) {
  return (
    <li className="inline-flex items-center gap-1 rounded-full bg-canvas py-1 pr-1 pl-2.5 font-medium">
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Quitar ${label}`}
          className="flex size-5 items-center justify-center rounded-full text-muted hover:bg-line hover:text-ink"
        >
          ×
        </button>
      )}
    </li>
  );
}
