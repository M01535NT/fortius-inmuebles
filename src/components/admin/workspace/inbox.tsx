"use client";
import * as React from "react";
import Link from "next/link";
import { Button, Card, Pill } from "@/components/admin/kit";
import { useInbox } from "@/components/admin/workspace/use-inbox";
import { INBOX_LABEL } from "@/lib/admin/inbox";
import { errorMessage } from "@/lib/admin/store";
import { cn, humanDateTime } from "@/lib/utils";

/*
  «Para ti» en Hoy (RP-20, UX-05): menciones, tareas que te asignaron y respuestas en tus tareas.
  Sin campana: el número del menú suma lo no leído. Abrir un aviso lo marca como leído; «Marcar
  todo como leído» limpia la bandeja. Lo leído se guarda en el servidor y sigue al usuario.
  Si no hay nada en los últimos 30 días, la bandeja no ocupa lugar.
*/
const SHOWN = 4;

export function Inbox({ className }: { className?: string }) {
  const { items, unread, read, markRead } = useInbox();
  const [all, setAll] = React.useState(false);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  if (!items.length) return null;
  const fresh = new Set(unread.map(item => item.key));
  // Lo no leído primero; lo leído solo al pedir «Ver todo».
  const ordered = [...unread, ...items.filter(item => !fresh.has(item.key))];
  const shown = all ? ordered : unread.slice(0, SHOWN);
  const hidden = ordered.length - shown.length;
  const mark = async (keys: string[]) => {
    setError(""); setBusy(true);
    try { await markRead(keys); } catch (cause) { setError(`No se pudo marcar como leído: ${errorMessage(cause)}`); } finally { setBusy(false); }
  };

  return <section aria-labelledby="hoy-para-ti" className={cn("flex min-w-0 flex-col gap-3", className)}>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 id="hoy-para-ti" className="m-0 text-lg font-semibold">Para ti{unread.length > 0 && <span className="ml-2 text-base font-normal text-muted-foreground">{unread.length} sin leer</span>}</h2>
      {unread.length > 0 && <Button variant="ghost" disabled={busy} onClick={() => void mark(unread.map(item => item.key))}>Marcar todo como leído</Button>}
    </div>
    <Card as="div" className="flex flex-col gap-1 p-2">
      {read === null && <p role="alert" className="m-0 px-2 py-1 text-sm text-destructive">No se pudo consultar qué ya leíste. Recarga la página para reintentar.</p>}
      {shown.length ? <ul className="m-0 flex list-none flex-col p-0" aria-label="Avisos para ti">{shown.map(item => {
        const isNew = fresh.has(item.key);
        return <li key={item.key}>
          <Link href={item.href} onClick={() => { if (isNew) void mark([item.key]); }} className={cn("flex min-h-11 items-start gap-3 rounded-[var(--radius-control)] px-2 py-2.5 no-underline hover:bg-[var(--secondary)] focus-visible:outline-2 focus-visible:outline-offset-2", !isNew && "text-muted-foreground")}>
            <span aria-hidden="true" className={cn("mt-2 size-2 flex-none rounded-full", isNew ? "bg-[var(--primary)]" : "bg-transparent")} />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="flex flex-wrap items-center gap-2"><strong className="text-[.9375rem]">{item.title}</strong><Pill tone={item.kind === "asignacion" ? "brand" : "info"} size="sm">{INBOX_LABEL[item.kind]}</Pill>{isNew && <span className="sr-only">Sin leer.</span>}</span>
              <span className="text-[.9375rem] [overflow-wrap:anywhere]">{item.text}</span>
              <small className="text-muted-foreground">{humanDateTime(item.at)}{item.who ? ` · ${item.who}` : ""}</small>
            </span>
          </Link>
        </li>;
      })}</ul> : <p className="m-0 px-2 py-1 text-sm text-muted-foreground">Ya leíste todo.</p>}
      {(hidden > 0 || all) && <Button variant="ghost" className="self-start" onClick={() => setAll(value => !value)}>{all ? "Ver solo lo nuevo" : `Ver todo (${ordered.length})`}</Button>}
      {error && <p role="alert" className="m-0 px-2 py-1 text-sm text-destructive">{error}</p>}
    </Card>
  </section>;
}
