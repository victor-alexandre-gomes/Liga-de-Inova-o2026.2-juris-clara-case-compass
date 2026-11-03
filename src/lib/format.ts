const dateFmt = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });
const dateTimeFmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });
const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** DD/MM/AAAA. Accepts ISO date (YYYY-MM-DD) or timestamp. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value.length === 10 ? `${value}T00:00:00Z` : value);
  return Number.isNaN(d.getTime()) ? "—" : dateFmt.format(d);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : dateTimeFmt.format(d);
}

/** R$ 0,00 — expects value in centavos (integer) to avoid floating point errors. */
export function formatCents(cents: number): string {
  return brl.format(cents / 100);
}
