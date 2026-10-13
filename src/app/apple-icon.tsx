import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Ícono para "Agregar a pantalla de inicio" en iPhone (Apple no acepta SVG aquí). */
export default function AppleIcon() {
  return new ImageResponse(
    // iOS ya redondea las esquinas: el fondo va cuadrado y lleno.
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#073B49",
      }}
    >
      <svg width="120" height="120" viewBox="0 0 24 24">
        <path
          fill="#fff"
          d="M15 5.5 12 7 9 5.5a3.5 3.5 0 0 0-5 3.5c0 2 1 3.5 1.5 6S6 21 8 21c1.5 0 1.5-4 4-4s2.5 4 4 4c2 0 2-3.5 2.5-6S20 11 20 9a3.5 3.5 0 0 0-5-3.5Z"
        />
      </svg>
    </div>,
    size,
  );
}
