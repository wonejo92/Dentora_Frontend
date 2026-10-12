/**
 * Ícono de un tratamiento deducido de su nombre (limpieza → destellos,
 * blanqueamiento → sol, etc.). Si no reconoce el nombre, usa un diente.
 */
const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const icons = {
  sparkles: (
    <svg {...base}>
      <path d="M16 18a2 2 0 0 1 2 2 2 2 0 0 1 2-2 2 2 0 0 1-2-2 2 2 0 0 1-2 2Zm0-12a2 2 0 0 1 2 2 2 2 0 0 1 2-2 2 2 0 0 1-2-2 2 2 0 0 1-2 2ZM9 18a6 6 0 0 1 6-6 6 6 0 0 1-6-6 6 6 0 0 1-6 6 6 6 0 0 1 6 6Z" />
    </svg>
  ),
  sun: (
    <svg {...base}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ),
  broken: (
    <svg {...base}>
      <path d="M15 5.5 12 7 9 5.5a3.5 3.5 0 0 0-5 3.5c0 2 1 3.5 1.5 6S6 21 8 21c1.5 0 1.5-4 4-4s2.5 4 4 4c2 0 2-3.5 2.5-6S20 11 20 9a3.5 3.5 0 0 0-5-3.5Z" />
      <path d="m12 7-1.5 3 3 2-1.5 3" />
    </svg>
  ),
  braces: (
    <svg {...base}>
      <rect x="3" y="8" width="5" height="8" rx="1.5" />
      <rect x="9.5" y="8" width="5" height="8" rx="1.5" />
      <rect x="16" y="8" width="5" height="8" rx="1.5" />
      <path d="M2 12h20" />
    </svg>
  ),
  stethoscope: (
    <svg {...base}>
      <path d="M6 4H5a2 2 0 0 0-2 2v3.5a5.5 5.5 0 0 0 11 0V6a2 2 0 0 0-2-2h-1" />
      <path d="M8 15a6 6 0 1 0 12 0v-3" />
      <circle cx="20" cy="10" r="2" />
    </svg>
  ),
  root: (
    <svg {...base}>
      <path d="M15 5.5 12 7 9 5.5a3.5 3.5 0 0 0-5 3.5c0 2 1 3.5 1.5 6S6 21 8 21c1.5 0 1.5-4 4-4s2.5 4 4 4c2 0 2-3.5 2.5-6S20 11 20 9a3.5 3.5 0 0 0-5-3.5Z" />
      <path d="M12 9v6" />
    </svg>
  ),
  implant: (
    <svg {...base}>
      <path d="M7 4h10l-1 5H8Z" />
      <path d="M9 12h6M9.5 15h5M10 18h4M12 9v12" />
    </svg>
  ),
  tooth: (
    <svg {...base}>
      <path d="M15 5.5 12 7 9 5.5a3.5 3.5 0 0 0-5 3.5c0 2 1 3.5 1.5 6S6 21 8 21c1.5 0 1.5-4 4-4s2.5 4 4 4c2 0 2-3.5 2.5-6S20 11 20 9a3.5 3.5 0 0 0-5-3.5Z" />
    </svg>
  ),
};

const RULES: [RegExp, keyof typeof icons][] = [
  [/limpieza|profilaxis|higiene/, "sparkles"],
  [/blanque/, "sun"],
  [/extracci|cirug|cordal|muela del juicio/, "broken"],
  [/ortodon|bracket|alineador|retenedor/, "braces"],
  [/valoraci|consulta|diagn|revisi|control/, "stethoscope"],
  [/endodon|conducto|nervio/, "root"],
  [/implante|corona|pr[oó]tesis/, "implant"],
];

export function TreatmentIcon({ name }: { name: string }) {
  const key = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
  const match = RULES.find(([pattern]) => pattern.test(key));
  return icons[match ? match[1] : "tooth"];
}
