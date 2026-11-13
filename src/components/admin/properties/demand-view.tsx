"use client";
import Link from "next/link";
import { ButtonLink, Card, EmptyBox } from "@/components/admin/kit";
import { TIPO_LABELS } from "@/data/propiedades";
import { captureHref, type DemandGroup } from "@/lib/admin/demand";

/*
  «Buscan y no tenemos» (COR-19): interesados activos sin ningún inmueble publicado y disponible
  que les sirva, agrupados por operación, tipo y zona. Cada grupo lleva a captar un inmueble con
  ese perfil. El presupuesto va por moneda: no se convierte.
*/
const money = (value: number, moneda: "MXN" | "USD") => `$${Math.round(value).toLocaleString("en-US")} ${moneda}`;

export function groupTitle(group: Pick<DemandGroup, "intent" | "tipo" | "zona">) {
  const what = group.tipo ? TIPO_LABELS[group.tipo] : "Cualquier tipo";
  return `${what} ${group.intent === "rentar" ? "en renta" : "en venta"}${group.zona ? ` · ${group.zona}` : " · sin zona dicha"}`;
}
export function budgetText(group: Pick<DemandGroup, "budgets">) {
  if (!group.budgets.length) return "Sin presupuesto dicho";
  return group.budgets.map(b => b.min === b.max ? `hasta ${money(b.max, b.moneda)}` : `de ${money(b.min, b.moneda)} a ${money(b.max, b.moneda)}`).join(" · ");
}

export function DemandView({ groups }: { groups: DemandGroup[] }) {
  if (!groups.length) return <EmptyBox title="Nadie espera algo que no tengamos">Cada interesado activo tiene al menos un inmueble publicado que le puede servir, o todavía no dice qué busca.</EmptyBox>;
  return <section aria-labelledby="buscan-titulo" className="flex flex-col gap-3">
    <h2 id="buscan-titulo" className="sr-only">Buscan y no tenemos</h2>
    <p className="m-0 text-sm text-muted-foreground">Interesados activos sin ningún inmueble publicado que les sirva. Quien busca en varias zonas aparece en cada una.</p>
    <ul aria-label="Lo que buscan" className="m-0 grid list-none gap-3 p-0 lg:grid-cols-2">
      {groups.map(group => <Card as="li" key={group.key} className="flex flex-col gap-3 p-4">
        <div className="flex flex-col gap-0.5">
          <strong className="[overflow-wrap:anywhere]">{groupTitle(group)}</strong>
          <span className="text-sm text-muted-foreground">{group.seekers.length === 1 ? "1 interesado" : `${group.seekers.length} interesados`} · {budgetText(group)}</span>
        </div>
        <ul aria-label="Interesados" className="m-0 flex list-none flex-wrap gap-x-4 p-0 text-sm">
          {group.seekers.slice(0, 6).map(s => <li key={`${s.kind}-${s.id}`}><Link className="inline-flex min-h-11 items-center font-semibold text-[var(--primary-text)] underline underline-offset-4" href={s.href}>{s.nombre}</Link></li>)}
          {group.seekers.length > 6 && <li className="inline-flex min-h-11 items-center text-muted-foreground">y {group.seekers.length - 6} más</li>}
        </ul>
        <span><ButtonLink href={captureHref(group)}>Captar inmueble para este perfil</ButtonLink></span>
      </Card>)}
    </ul>
  </section>;
}
