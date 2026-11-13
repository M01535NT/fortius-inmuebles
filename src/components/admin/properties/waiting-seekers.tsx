"use client";
import Link from "next/link";
import { Card } from "@/components/admin/kit";
import { seekersFrom } from "@/lib/admin/buyer-matches";
import { waitingFor, type DemandIntent } from "@/lib/admin/demand";
import { db, useCollection } from "@/lib/admin/store";

/*
  «N interesados esperan» (COR-19): al captar un inmueble, quiénes buscan algo así (misma operación,
  tipo si lo dijeron y zona). Se calcula al momento con los interesados activos; no se guarda.
*/
export function WaitingSeekers({ intent, tipo, zona, className }: { intent: DemandIntent; tipo?: string; zona?: string; className?: string }) {
  const leads = useCollection(db.leads), clients = useCollection(db.clientes);
  const waiting = waitingFor({ intent, tipo, zona }, seekersFrom(leads, clients));
  if (!waiting.length) return null;
  const shown = waiting.slice(0, 5);
  return <Card as="section" aria-labelledby="interesados-esperan" className={`flex flex-col gap-2 p-4 ${className ?? ""}`}>
    <h2 id="interesados-esperan" className="m-0 text-sm font-semibold">{waiting.length === 1 ? "1 interesado espera" : `${waiting.length} interesados esperan`} un inmueble así</h2>
    <p className="m-0 text-sm text-muted-foreground">Buscan {intent === "rentar" ? "rentar" : "comprar"} en esa zona. Cuando el inmueble se publique, les avisas desde su seguimiento.</p>
    <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-sm">
      {shown.map(s => <li key={`${s.kind}-${s.id}`}><Link className="inline-flex min-h-11 items-center font-semibold text-[var(--primary-text)] underline underline-offset-4" href={s.href}>{s.nombre}</Link></li>)}
      {waiting.length > shown.length && <li className="inline-flex min-h-11 items-center text-muted-foreground">y {waiting.length - shown.length} más</li>}
    </ul>
  </Card>;
}
