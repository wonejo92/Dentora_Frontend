/**
 * Animación de verificación: un anillo que gira mientras se comprueba y, al
 * terminar bien, un sello con la ✓ que aparece con un rebote y destellos.
 * Los estilos (keyframes) están en globals.css; respeta "reducir movimiento".
 */

/** Contorno ondulado del sello: un círculo cuyo radio sube y baja 12 veces. */
const BADGE_PATH = (() => {
  const points = Array.from({ length: 120 }, (_, i) => {
    const angle = (i / 120) * Math.PI * 2;
    const r = 34 + 2.6 * Math.cos(angle * 12);
    return `${(60 + r * Math.cos(angle)).toFixed(2)} ${(60 + r * Math.sin(angle)).toFixed(2)}`;
  });
  return `M${points.join(" L")}Z`;
})();

const RAYS = Array.from({ length: 8 }, (_, i) => i * 45);

export function VerifyAnimation({ status }: { status: "loading" | "success" }) {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" role="img" aria-hidden className="overflow-visible">
      {status === "loading" ? (
        <g className="verify-ring">
          <circle cx="60" cy="60" r="40" fill="none" stroke="var(--color-line)" strokeWidth="7" strokeLinecap="round" />
        </g>
      ) : (
        <>
          {RAYS.map((deg) => (
            <g key={deg} transform={`rotate(${deg} 60 60)`}>
              <line
                className="verify-ray"
                x1="60"
                y1="12"
                x2="60"
                y2="4"
                stroke="var(--color-brand-500)"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </g>
          ))}
          <g className="verify-badge">
            <path d={BADGE_PATH} fill="var(--color-brand-500)" />
            <path
              className="verify-check"
              d="M45 61 L55 71 L76 50"
              fill="none"
              stroke="#fff"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </>
      )}
    </svg>
  );
}
