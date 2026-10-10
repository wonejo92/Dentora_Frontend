const usd = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" });

export function formatPrice(price: string | number | null) {
  if (price === null || price === "") return "—";
  return Number(price) === 0 ? "Gratis" : usd.format(Number(price));
}

export function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}
