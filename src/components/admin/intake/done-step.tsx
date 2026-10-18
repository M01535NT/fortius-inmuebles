"use client";
import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check } from "@/components/admin/icons";
import { ButtonLink, Card } from "@/components/admin/kit";
import { apiRequest, db, useCollection } from "@/lib/admin/store";
import { isOwnerIntent, type OperationalInterview } from "@/lib/intake/interview";
import { intentTitle, optionLabel, visibleFields } from "@/lib/intake/wizard";
import s from "./wizard.module.css";

const NEXT: Record<string, string> = {
  vender: "Hacer la entrevista inicial en persona: desde la operación se abre el formato 02 para capturarla.",
  arrendar: "Hacer la entrevista inicial en persona: desde la operación se abre el formato 02 para capturarla.",
  comprar: "Revisar su perfil y buscarle opciones.",
  rentar: "Revisar lo que necesita y buscarle opciones.",
  invertir: "Revisar su mandato y buscar alternativas.",
};

/** Paso 4: la operación quedó creada (o la corrección guardada) y se ve qué sigue. */
export function DoneStep({ interview, fresh }: { interview: OperationalInterview; fresh: boolean }) {
  const properties = useCollection(db.propiedades), clients = useCollection(db.clientes);
  const [folio, setFolio] = React.useState<string | null | undefined>(undefined);
  React.useEffect(() => {
    if (!interview.expediente_id) return;
    let alive = true;
    apiRequest<{ expedientes?: Array<{ id: string; folio: string }> }>("/api/admin/expedientes")
      .then(r => { if (alive) setFolio(r.expedientes?.find(e => e.id === interview.expediente_id)?.folio ?? null); })
      .catch(() => { if (alive) setFolio(null); });
    return () => { alive = false; };
  }, [interview.expediente_id]);
  const owner = isOwnerIntent(interview.intencion), correction = !!interview.anterior_id;
  const property = properties.find(p => p.slug === interview.propiedad_slug);
  const who = clients.find(c => c.id === interview.cliente_id)?.nombre ?? interview.contacto.nombre;
  const href = interview.expediente_id ? `/admin/operaciones/${encodeURIComponent(interview.expediente_id)}` : null;
  const answered = visibleFields(interview.intencion, interview.respuestas).filter(f => interview.respuestas[f.key]?.trim());
  const heading = React.useRef<HTMLHeadingElement>(null);
  React.useEffect(() => { heading.current?.focus(); }, []);
  return <div className={s.body}>
    <span className={s.doneMark} aria-hidden="true"><Check size={28} /></span>
    <h1 ref={heading} tabIndex={-1} className={s.title}>{!fresh ? "Entrevista terminada" : correction ? "Listo, la corrección quedó guardada" : "Listo, la operación está creada"}</h1>
    <p className={s.lead}>{!fresh ? `Se terminó el ${interview.completed_at ? new Date(interview.completed_at).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" }) : "día registrado"}. Sus respuestas se conservan sin cambios.` : correction ? "La entrevista anterior se conserva en la misma operación." : owner ? "La encuentras en Operaciones, en la etapa Prospecto." : "La encuentras en Operaciones, en la etapa Captación."}</p>
    <Card as="div" className="overflow-hidden"><dl className={s.summary} aria-label="Resumen de la operación">
      <dt>Folio</dt><dd className="font-mono font-semibold">{folio === undefined && href ? "Consultando…" : folio ?? "—"}</dd>
      <dt>Cliente</dt><dd>{who}</dd>
      <dt>Quiere</dt><dd>{intentTitle(interview.intencion)}</dd>
      {owner && <><dt>Inmueble</dt><dd>{property?.titulo ?? (interview.propiedad_slug ? "Inmueble registrado" : "Sin inmueble vinculado: vincúlalo en la operación, en Ajustes.")}</dd></>}
      <dt>Lo que sigue</dt><dd>{NEXT[interview.intencion]} Los documentos, quién es dueño y los recursos todavía deben comprobarse.</dd>
    </dl></Card>
    <div className="flex flex-wrap items-center gap-3">
      {href && <ButtonLink variant="primary" href={href}>Abrir la operación<ArrowRight size={16} aria-hidden="true" /></ButtonLink>}
      <Link href="/admin" className="font-semibold text-foreground underline-offset-4 hover:underline">Volver a Hoy</Link>
    </div>
    <Card as="div" className="p-5"><details><summary className="cursor-pointer font-semibold">Ver las respuestas de la entrevista</summary>
      <dl className={s.answers}>{answered.map(f => <div key={f.key}><dt>{f.label}</dt><dd className="[overflow-wrap:anywhere]">{f.options ? optionLabel(f, interview.respuestas[f.key]) : interview.respuestas[f.key]}</dd></div>)}</dl>
    </details>
    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
      {interview.expediente_id && <Link className="font-semibold underline underline-offset-4" href={`/admin/operaciones/nueva?${new URLSearchParams({ intencion: interview.intencion, clienteId: interview.cliente_id ?? "", expedienteId: interview.expediente_id })}`}>Corregir la entrevista</Link>}
      {interview.anterior_id && <Link className="font-semibold underline underline-offset-4" href={`/admin/operaciones/nueva?entrevista=${encodeURIComponent(interview.anterior_id)}`}>Ver la entrevista anterior</Link>}
    </div></Card>
  </div>;
}
