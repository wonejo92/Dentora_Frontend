/** Íconos de trazo (estilo Tabler), sin dependencias. */
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

export const CalendarIcon = () => (
  <svg {...base}>
    <rect x="4" y="5" width="16" height="16" rx="2" />
    <path d="M16 3v4M8 3v4M4 11h16" />
  </svg>
);
export const UsersIcon = () => (
  <svg {...base}>
    <circle cx="9" cy="7" r="4" />
    <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.85" />
  </svg>
);
export const StethoscopeIcon = () => (
  <svg {...base}>
    <path d="M6 4H5a2 2 0 0 0-2 2v3.5a5.5 5.5 0 0 0 11 0V6a2 2 0 0 0-2-2h-1" />
    <path d="M8 15a6 6 0 1 0 12 0v-3" />
    <circle cx="20" cy="10" r="2" />
  </svg>
);
export const ToothIcon = () => (
  <svg {...base}>
    <path d="M15 5.5 12 7 9 5.5a3.5 3.5 0 0 0-5 3.5c0 2 1 3.5 1.5 6S6 21 8 21c1.5 0 1.5-4 4-4s2.5 4 4 4c2 0 2-3.5 2.5-6S20 11 20 9a3.5 3.5 0 0 0-5-3.5Z" />
  </svg>
);
export const SettingsIcon = () => (
  <svg {...base}>
    <path d="M10.3 4.3c.4-1.8 3-1.8 3.4 0a1.7 1.7 0 0 0 2.6 1.1c1.5-.9 3.3.8 2.4 2.4a1.7 1.7 0 0 0 1 2.5c1.9.5 1.9 3.1 0 3.5a1.7 1.7 0 0 0-1 2.6c.9 1.5-.9 3.3-2.4 2.4a1.7 1.7 0 0 0-2.6 1c-.4 1.9-3 1.9-3.4 0a1.7 1.7 0 0 0-2.6-1c-1.5.9-3.3-.9-2.4-2.4a1.7 1.7 0 0 0-1-2.6c-1.9-.4-1.9-3 0-3.5a1.7 1.7 0 0 0 1-2.5c-.9-1.6.9-3.3 2.4-2.4a1.7 1.7 0 0 0 2.6-1.1Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
export const ChevronLeftIcon = () => (
  <svg {...base}>
    <path d="m15 6-6 6 6 6" />
  </svg>
);
export const ChevronRightIcon = () => (
  <svg {...base}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);
export const LogoutIcon = () => (
  <svg {...base}>
    <path d="M14 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-2M9 12h12l-3-3m0 6 3-3" />
  </svg>
);
export const DashboardIcon = () => (
  <svg {...base}>
    <rect x="4" y="4" width="6" height="8" rx="1.5" />
    <rect x="4" y="16" width="6" height="4" rx="1.5" />
    <rect x="14" y="12" width="6" height="8" rx="1.5" />
    <rect x="14" y="4" width="6" height="4" rx="1.5" />
  </svg>
);
export const ChartIcon = () => (
  <svg {...base}>
    <path d="M3 21h18M7 17V11M12 17V7M17 17v-4" />
  </svg>
);
export const SearchIcon = () => (
  <svg {...base}>
    <circle cx="10" cy="10" r="7" />
    <path d="m21 21-6-6" />
  </svg>
);
export const BellIcon = () => (
  <svg {...base}>
    <path d="M10 5a2 2 0 1 1 4 0 7 7 0 0 1 4 6v3a4 4 0 0 0 2 3H4a4 4 0 0 0 2-3v-3a7 7 0 0 1 4-6M9 17v1a3 3 0 0 0 6 0v-1" />
  </svg>
);
export const ClockIcon = () => (
  <svg {...base}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </svg>
);
export const WorldIcon = () => (
  <svg {...base}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3.6 9h16.8M3.6 15h16.8M11.5 3a17 17 0 0 0 0 18M12.5 3a17 17 0 0 1 0 18" />
  </svg>
);
export const CalendarCheckIcon = () => (
  <svg {...base}>
    <path d="M11.5 21H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6M16 3v4M8 3v4M4 11h16M15 19l2 2 4-4" />
  </svg>
);
export const UserCogIcon = () => (
  <svg {...base}>
    <circle cx="9" cy="7" r="4" />
    <path d="M3 21v-2a4 4 0 0 1 4-4h4M19 16v-1.5M19 21.5V20M21.6 17.5l-1.3.75M17.7 19.75l-1.3.75M16.4 17.5l1.3.75M20.3 19.75l1.3.75" />
    <circle cx="19" cy="18" r="2" />
  </svg>
);
export const UserIcon = () => (
  <svg {...base}>
    <circle cx="12" cy="8" r="4" />
    <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
  </svg>
);
