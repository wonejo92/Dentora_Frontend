import { cn } from "@/lib/cn";

/**
 * Diente "de cristal" turquesa hecho con SVG: degradados, un brillo especular
 * y una sombra suave. Reemplaza al render 3D de la inspiración sin imágenes.
 *
 * `angle` (grados, de -45 a 45) mueve los brillos al lado contrario del giro,
 * para que al rotarlo se sienta con volumen. `idPrefix` evita que dos dientes
 * en la misma página compartan degradados.
 */
const TOOTH =
  "M15 5.5 12 7 9 5.5a3.5 3.5 0 0 0-5 3.5c0 2 1 3.5 1.5 6S6 21 8 21c1.5 0 1.5-4 4-4s2.5 4 4 4c2 0 2-3.5 2.5-6S20 11 20 9a3.5 3.5 0 0 0-5-3.5Z";

export function GlassTooth({
  className,
  angle = 0,
  idPrefix = "gt",
  shadow = true,
}: {
  className?: string;
  angle?: number;
  idPrefix?: string;
  /** Sombra en el piso; se oculta cuando el diente gira (la sombra no gira). */
  shadow?: boolean;
}) {
  // De -1 a 1: cuánto se corren los brillos (al revés del giro).
  const shift = -Math.max(-1, Math.min(1, angle / 45));
  const id = (name: string) => `${idPrefix}-${name}`;
  return (
    <svg viewBox="0 0 24 26" className={cn("overflow-visible", className)} role="img" aria-label="Diente de cristal">
      <defs>
        {/* Cuerpo: del turquesa claro de arriba al petróleo de abajo */}
        <linearGradient id={id("body")} x1={0.2 + shift * 0.18} y1="0" x2={0.75 + shift * 0.18} y2="1">
          <stop offset="0" stopColor="#e3f7fa" />
          <stop offset="0.4" stopColor="#7fd2e0" />
          <stop offset="0.8" stopColor="#1590ab" />
          <stop offset="1" stopColor="#0b5f76" />
        </linearGradient>
        {/* Luz interior, como si el cristal la refractara */}
        <radialGradient id={id("glow")} cx={0.38 + shift * 0.2} cy="0.32" r="0.6">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="0.45" stopColor="#bdeef6" stopOpacity="0.35" />
          <stop offset="1" stopColor="#bdeef6" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id("edge")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.1" />
        </linearGradient>
        <filter id={id("blur")} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.9" />
        </filter>
        <filter id={id("soft")} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.35" />
        </filter>
        <clipPath id={id("clip")}>
          <path d={TOOTH} />
        </clipPath>
      </defs>

      {/* Sombra en el piso */}
      {shadow && (
        <ellipse cx="12" cy="24.2" rx="6.5" ry="0.9" fill="#073b49" opacity="0.28" filter={`url(#${id("blur")})`} />
      )}

      <path d={TOOTH} fill={`url(#${id("body")})`} />
      <g clipPath={`url(#${id("clip")})`}>
        <path d={TOOTH} fill={`url(#${id("glow")})`} />
        <g transform={`translate(${shift * 3} 0)`}>
          {/* Reflejo largo junto al borde izquierdo, como en un vidrio curvo */}
          <path
            d="M5.4 9.6c.2 2.4 1.2 4.3 1.7 6.6.3 1.3.5 2.7 1 3.6"
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.55"
            strokeWidth="0.55"
            strokeLinecap="round"
            filter={`url(#${id("soft")})`}
          />
          {/* Brillo especular */}
          <ellipse
            cx="8.2"
            cy="8"
            rx="1.6"
            ry="2.6"
            fill="#ffffff"
            opacity="0.75"
            transform="rotate(-25 8.2 8)"
            filter={`url(#${id("soft")})`}
          />
          <ellipse
            cx="16.6"
            cy="7.4"
            rx="0.7"
            ry="1.2"
            fill="#ffffff"
            opacity="0.6"
            transform="rotate(20 16.6 7.4)"
            filter={`url(#${id("soft")})`}
          />
        </g>
      </g>
      {/* Borde luminoso */}
      <path d={TOOTH} fill="none" stroke={`url(#${id("edge")})`} strokeWidth="0.3" />
    </svg>
  );
}
