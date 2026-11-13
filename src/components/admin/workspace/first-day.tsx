"use client";
import Link from "next/link";
import { CheckCircle2, Circle } from "@/components/admin/icons";
import { Card } from "@/components/admin/kit";
import { db, useCollection, useSession } from "@/lib/admin/store";
import { useMyAdvisor } from "@/lib/admin/staff-scope";
import { firstDaySteps } from "@/lib/admin/first-day";
import { helpHref } from "@/lib/admin/help";

/** «Tu primer día» (COR-26): solo para el asesor, en Hoy, mientras le falte alguno de los tres pasos. */
export function FirstDay({ operations, className }: { operations: ReadonlyArray<{ asesor_id?: string }> | null | undefined; className?: string }) {
  const session = useSession(), mine = useMyAdvisor();
  const leads = useCollection(db.leads), events = useCollection(db.eventos);
  if (!session || session.role === "admin" || !mine || !operations) return null;
  const steps = firstDaySteps({ mine, leads, events, operations });
  const done = steps.filter(step => step.done).length;
  if (done === steps.length) return null;
  return <Card as="section" aria-labelledby="primer-dia" className={(className ? className + " " : "") + "p-4 sm:p-5"}>
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h2 id="primer-dia" className="m-0 text-lg font-semibold">Tu primer día</h2>
      <span className="text-sm text-muted-foreground">{done} de {steps.length}</span>
    </div>
    <ol className="m-0 mt-3 grid list-none gap-2 p-0 sm:grid-cols-3">{steps.map(step => <li key={step.id}>
      <Link href={step.href} className="flex min-h-11 items-start gap-2.5 rounded-[var(--radius-control)] bg-secondary p-3 text-sm">
        {step.done ? <CheckCircle2 size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--success)]" /> : <Circle size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-muted-foreground" />}
        <span className="flex flex-col gap-0.5"><strong className={step.done ? "text-muted-foreground line-through" : undefined}>{step.label}</strong><span className="text-muted-foreground">{step.hint}</span></span>
        <span className="sr-only">{step.done ? ", hecho" : ", pendiente"}</span>
      </Link>
    </li>)}</ol>
    <Link href={helpHref("nueva")} className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">¿Cómo se hace esto?</Link>
  </Card>;
}
