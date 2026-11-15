"use client";
import * as React from "react";
import Link from "next/link";
import { Button, Card } from "@/components/admin/kit";
import { db, errorMessage, fetchJson as json, useCollection, useSession } from "@/lib/admin/store";
import { operationHref } from "@/lib/admin/operation-view";
import { cn, humanDateTime } from "@/lib/utils";

/*
  FLX-03 B (DEC-55): «Avisos de tus asuntos» en Hoy. Nada frena; lo que faltó al guardar o al
  avanzar queda anotado en el historial del asunto y aquí se ve lo de la última semana. Sin
  avisos, el bloque no ocupa lugar.
*/
export type AsuntoAviso = { id: string; expedienteId: string; folio: string; clienteId?: string | null; asesorId?: string | null; texto: string; at: string };
const SHOWN = 3;

export function AsuntoAvisos({ className }: { className?: string }) {
  const session = useSession();
  const clients = useCollection(db.clientes);
  const [items, setItems] = React.useState<AsuntoAviso[] | null>(null);
  const [error, setError] = React.useState("");
  const [all, setAll] = React.useState(false);
  React.useEffect(() => {
    let alive = true;
    json<{ avisos: AsuntoAviso[] }>("/api/admin/expedientes/avisos")
      .then(result => { if (alive) setItems(result.avisos); })
      .catch(cause => { if (alive) { setItems([]); setError(errorMessage(cause)); } });
    return () => { alive = false; };
  }, []);
  // El asesor ve los de sus asuntos; el director, los de todo el equipo.
  const mine = (items ?? []).filter(item => session?.role === "admin" || !session?.id || item.asesorId === session.id);
  if (!mine.length && !error) return null;
  const shown = all ? mine : mine.slice(0, SHOWN);

  return <section aria-labelledby="hoy-asunto-avisos" className={cn("flex min-w-0 flex-col gap-3", className)}>
    <h2 id="hoy-asunto-avisos" className="m-0 text-lg font-semibold">Avisos de tus asuntos<span className="ml-2 text-base font-normal text-muted-foreground">últimos 7 días</span></h2>
    <Card as="div" className="flex flex-col gap-1 p-2">
      {error ? <p role="alert" className="m-0 px-2 py-1 text-sm text-destructive">No se pudieron consultar los avisos: {error}</p>
        : <ul className="m-0 flex list-none flex-col p-0" aria-label="Avisos de tus asuntos">{shown.map(item => {
          const client = item.clienteId ? clients.find(c => c.id === item.clienteId)?.nombre : undefined;
          return <li key={item.id}>
            <Link href={operationHref(item.expedienteId, { tab: "actividad" })} className="flex min-h-11 flex-col gap-0.5 rounded-[var(--radius-control)] px-2 py-2.5 no-underline hover:bg-[var(--secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]">
              <strong className="text-[.9375rem]">{client ?? item.folio}</strong>
              <span className="text-[.9375rem] [overflow-wrap:anywhere]">{item.texto}</span>
              <small className="text-muted-foreground">{humanDateTime(item.at)}{client ? ` · ${item.folio}` : ""}</small>
            </Link>
          </li>;
        })}</ul>}
      {mine.length > SHOWN && <Button variant="ghost" className="self-start" onClick={() => setAll(value => !value)}>{all ? "Ver menos" : `Ver todo (${mine.length})`}</Button>}
    </Card>
  </section>;
}
