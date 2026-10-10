import Link from "next/link";
import { cn } from "@/lib/cn";
import { hrefWith, PAGE_SIZES, type Page, type SearchParams } from "@/lib/list";
import { PageSizeSelect } from "./page-size-select";

/** Números de página a mostrar: 1 … 4 5 [6] 7 8 … 20 */
function pageNumbers(page: number, pages: number): (number | "…")[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const around = [page - 1, page, page + 1].filter((p) => p > 1 && p < pages);
  const list: (number | "…")[] = [1];
  if (around[0] > 2) list.push("…");
  list.push(...around);
  if (around.at(-1)! < pages - 1) list.push("…");
  list.push(pages);
  return list;
}

const icons = {
  first: "m11 7-5 5 5 5M18 7l-5 5 5 5",
  prev: "m15 6-6 6 6 6",
  next: "m9 6 6 6-6 6",
  last: "m13 7 5 5-5 5M6 7l5 5-5 5",
};

const circle = "flex size-9 items-center justify-center rounded-full text-sm transition-colors";

function Arrow({ to, href, label }: { to: keyof typeof icons; href: string | null; label: string }) {
  const icon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={icons[to]} />
    </svg>
  );
  if (!href) {
    return (
      <span aria-hidden className={cn(circle, "border border-line text-line")}>
        {icon}
      </span>
    );
  }
  return (
    <Link href={href} aria-label={label} className={cn(circle, "border border-line bg-white text-ink hover:border-brand-200 hover:bg-brand-50")}>
      {icon}
    </Link>
  );
}

export function Pagination({
  info,
  pathname,
  params,
  noun,
  size,
  defaultSize,
  sizes = PAGE_SIZES,
}: {
  info: Omit<Page<unknown>, "items">;
  pathname: string;
  params: SearchParams;
  /** Nombre en plural de lo que se lista, p. ej. "pacientes". */
  noun: string;
  size: number;
  defaultSize: number;
  sizes?: number[];
}) {
  const { page, pages, total } = info;
  if (total === 0) return null;
  const href = (p: number) => hrefWith(pathname, params, { pagina: p === 1 ? null : p });

  return (
    <nav
      aria-label="Paginación"
      className="grid items-center gap-3 text-sm text-muted md:grid-cols-[1fr_auto_1fr]"
    >
      <div className="flex items-center gap-2">
        Mostrando
        <PageSizeSelect value={size} sizes={sizes} fallback={defaultSize} />
        de <span className="font-semibold text-ink tabular-nums">{total}</span> {noun}
      </div>

      <div className="flex items-center gap-1.5">
        <Arrow to="first" href={page > 1 ? href(1) : null} label="Primera página" />
        <Arrow to="prev" href={page > 1 ? href(page - 1) : null} label="Página anterior" />
        {pageNumbers(page, pages).map((p, i) =>
          p === "…" ? (
            <span key={`gap-${i}`} className="px-1">
              …
            </span>
          ) : (
            <Link
              key={p}
              href={href(p)}
              aria-current={p === page ? "page" : undefined}
              className={cn(
                circle,
                "font-semibold tabular-nums",
                p === page
                  ? "bg-brand-600 text-white"
                  : "border border-line bg-white text-ink hover:border-brand-200 hover:bg-brand-50",
              )}
            >
              {p}
            </Link>
          ),
        )}
        <Arrow to="next" href={page < pages ? href(page + 1) : null} label="Página siguiente" />
        <Arrow to="last" href={page < pages ? href(pages) : null} label="Última página" />
      </div>

      <p className="md:text-right">
        Página <span className="font-semibold text-ink tabular-nums">{page}</span> de{" "}
        <span className="font-semibold text-ink tabular-nums">{pages}</span>
      </p>
    </nav>
  );
}
