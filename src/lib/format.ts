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

/** Edad en años a partir de una fecha `YYYY-MM-DD` (o ISO). */
export function ageFrom(birthDate: string, today = new Date()) {
  const birth = new Date(birthDate);
  let age = today.getUTCFullYear() - birth.getUTCFullYear();
  const beforeBirthday =
    today.getUTCMonth() < birth.getUTCMonth() ||
    (today.getUTCMonth() === birth.getUTCMonth() && today.getUTCDate() < birth.getUTCDate());
  if (beforeBirthday) age--;
  return age;
}

/**
 * Enlace de WhatsApp para un teléfono ecuatoriano:
 * 0991234567 → https://wa.me/593991234567. Devuelve null si no parece un celular.
 */
export function whatsappLink(phone: string | null) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (/^09\d{8}$/.test(digits)) return `https://wa.me/593${digits.slice(1)}`;
  if (/^5939\d{8}$/.test(digits)) return `https://wa.me/${digits}`;
  return null;
}
