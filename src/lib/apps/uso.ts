import { APPS } from "./catalog";

/*
  Uso de cada herramienta (HER-05): cuántos trabajos se empezaron con ella cada mes, para decidir
  después qué más se retira. Cuenta los trabajos creados (también los que luego se eliminaron);
  abrir una herramienta sin guardar nada no deja registro y no se cuenta.
*/

export type UsoFila = { slug: string; title: string; retired: boolean; byMonth: number[]; total: number };
export type UsoHerramientas = { months: string[]; rows: UsoFila[] };

const monthOf = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Tijuana", year: "numeric", month: "2-digit" }).format(new Date(iso)).slice(0, 7);

/** Los últimos `count` meses (AAAA-MM, de Tijuana) que terminan en el mes de `today`. */
export function lastMonths(today: Date, count = 6): string[] {
  const [year, month] = monthOf(today.toISOString()).split("-").map(Number);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.UTC(year, month - 1 - (count - 1 - i), 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  });
}

export function usoPorHerramienta(rows: { slug: string; created_at: string }[], months: string[]): UsoHerramientas {
  const index = new Map(months.map((m, i) => [m, i]));
  const counts = new Map<string, number[]>();
  for (const row of rows) {
    const at = index.get(monthOf(row.created_at));
    if (at === undefined) continue;
    const list = counts.get(row.slug) ?? months.map(() => 0);
    list[at]++; counts.set(row.slug, list);
  }
  return { months, rows: APPS.map(app => {
    const byMonth = counts.get(app.slug) ?? months.map(() => 0);
    return { slug: app.slug, title: app.title, retired: app.group === null, byMonth, total: byMonth.reduce((a, b) => a + b, 0) };
  }).sort((a, b) => Number(a.retired) - Number(b.retired) || b.total - a.total || a.title.localeCompare(b.title, "es")) };
}
