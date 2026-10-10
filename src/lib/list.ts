/** Utilidades para listas con búsqueda, filtros y paginación en la URL. */

export type SearchParams = Record<string, string | string[] | undefined>;

export const param = (params: SearchParams, key: string) => {
  const value = params[key];
  return typeof value === "string" ? value.trim() : "";
};

export const pageParam = (params: SearchParams) => Math.max(1, Math.floor(Number(param(params, "pagina")) || 1));

export const PAGE_SIZES = [10, 20, 50, 100];

/** Tamaño de página elegido en la URL (`porPagina`), o el valor por defecto. */
export function pageSizeParam(params: SearchParams, fallback: number, sizes = PAGE_SIZES) {
  const size = Number(param(params, "porPagina"));
  return sizes.includes(size) ? size : fallback;
}

/** Quita tildes y pasa a minúsculas para comparar ("Pérez" ≈ "perez"). */
export const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** Cada palabra de la búsqueda debe aparecer en alguno de los textos, en cualquier orden. */
export function matches(query: string, ...texts: (string | null | undefined)[]) {
  if (!query) return true;
  const haystack = normalize(texts.filter(Boolean).join(" "));
  return normalize(query)
    .split(/\s+/)
    .every((word) => haystack.includes(word));
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
  /** Posición (desde 1) del primer y último elemento mostrado. */
  from: number;
  to: number;
}

/** Pagina una lista que ya está en memoria. */
export function paginate<T>(all: T[], page: number, size: number): Page<T> {
  const pages = Math.max(1, Math.ceil(all.length / size));
  const current = Math.min(page, pages);
  const start = (current - 1) * size;
  const items = all.slice(start, start + size);
  return { items, total: all.length, page: current, pages, from: items.length ? start + 1 : 0, to: start + items.length };
}

/** Datos de paginación cuando el backend ya paginó. */
export function pageInfo(total: number, page: number, size: number): Omit<Page<never>, "items"> {
  const pages = Math.max(1, Math.ceil(total / size));
  const from = total ? (page - 1) * size + 1 : 0;
  return { total, page, pages, from, to: Math.min(page * size, total) };
}

/** URL con los parámetros actuales más los cambios (los vacíos se quitan). */
export function hrefWith(pathname: string, params: SearchParams, changes: Record<string, string | number | null>) {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value) next.set(key, value);
  }
  for (const [key, value] of Object.entries(changes)) {
    if (value === null || value === "") next.delete(key);
    else next.set(key, String(value));
  }
  const query = next.toString();
  return query ? `${pathname}?${query}` : pathname;
}
