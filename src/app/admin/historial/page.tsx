"use client";
import * as React from "react";
import Link from "next/link";
import { PAPELERA } from "@/components/admin/papelera/textos";
import { humanDateTime } from "@/lib/utils";
import { apiRequest, db, errorMessage, useCollection, useSession } from "@/lib/admin/store";
import { Field, PageHeader, selectClass } from "@/components/admin/ui";
import { Button, Card, EmptyBox } from "@/components/admin/kit";
import { EMPTY_ART } from "@/components/admin/icons";

type Entry = {
  id: string;
  collection: string;
  record_id: string;
  action: "INSERT" | "UPDATE" | "DELETE";
  actor_id: string | null;
  /** Título guardado en la foto del registro (Seguridad, C-81): nombra lo que ya no está en las listas. */
  titulo?: string | null;
  version: number;
  changed_fields?: string[];
  created_at: string;
  restored_at: string | null;
};
const labels: Record<string, string> = {
  propiedades: "Inmuebles",
  posts: "Blog",
  notas: "Notas",
  eventos: "Agenda",
  leads: "Prospectos",
  clientes: "Clientes",
  tareas: "Tareas",
  asesores: "Equipo",
  config: "Configuración",
  contenido: "Textos del sitio",
  archivos: "Archivos",
};
const ACTION = { INSERT: "Se creó", UPDATE: "Se cambió", DELETE: "Se eliminó" } as const;

/*
  Historial (SIM-15, C46): con el kit del panel y en palabras del asesor. Cada movimiento dice qué
  registro cambió (por su nombre cuando se conoce), quién y cuándo; los campos tocados quedan
  plegados. Lo eliminado se recupera en la papelera única (NAV-13), con la misma restauración del servidor.
*/
export default function HistoryPage() {
  const session = useSession();
  const propiedades = useCollection(db.propiedades), leads = useCollection(db.leads), clientes = useCollection(db.clientes);
  const tareas = useCollection(db.tareas), asesores = useCollection(db.asesores), notas = useCollection(db.notas), eventos = useCollection(db.eventos), posts = useCollection(db.posts);
  const [entries, setEntries] = React.useState<Entry[]>([]),
    [collection, setCollection] = React.useState(() => typeof window !== "undefined" ? (new URLSearchParams(window.location.search).get("collection") ?? "") : ""),
    [record, setRecord] = React.useState(() => typeof window !== "undefined" ? (new URLSearchParams(window.location.search).get("record") ?? "") : ""),
    [offset, setOffset] = React.useState(0),
    [more, setMore] = React.useState(false),
    [status, setStatus] = React.useState("loading"),
    [error, setError] = React.useState(""),
    [revision, setRevision] = React.useState(0);
  React.useEffect(() => {
    if (session?.role !== "admin") return;
    let active = true;
    const query = new URLSearchParams({ offset: String(offset), collection, record, deleted: "0" });
    apiRequest<{ entries: Entry[]; hasMore: boolean }>(`/api/admin/historial?${query}`)
      .then(r => { if (active) { setError(""); setEntries(r.entries); setMore(r.hasMore); setStatus("ready"); } })
      .catch(e => { if (active) { setError(errorMessage(e)); setStatus("error"); } });
    return () => { active = false; };
  }, [session?.role, collection, record, offset, revision]);
  if (session?.role !== "admin") return <p role="alert">El historial es solo para administradores.</p>;

  const nameOf = (entry: Pick<Entry, "collection" | "record_id"> & { titulo?: string | null }): string | undefined => current(entry) ?? (entry.titulo || undefined);
  const current = (entry: Pick<Entry, "collection" | "record_id">): string | undefined => {
    const id = entry.record_id;
    switch (entry.collection) {
      case "propiedades": return propiedades.find(p => p.slug === id)?.titulo;
      case "leads": return leads.find(l => l.id === id)?.nombre;
      case "clientes": return clientes.find(c => c.id === id)?.nombre;
      case "tareas": return tareas.find(t => t.id === id)?.titulo;
      case "asesores": return asesores.find(a => a.id === id)?.nombre;
      case "notas": return notas.find(n => n.id === id)?.titulo;
      case "eventos": return eventos.find(e => e.id === id)?.titulo;
      // C-85: las entradas del blog también se nombran.
      case "posts": return posts.find(p => p.id === id)?.titulo;
      case "config": return "Configuración del sitio";
      case "contenido": return "Textos del sitio";
      default: return undefined;
    }
  };
  const who = (actor: string | null) => actor === session.id ? "Tú" : actor ? "Otra persona del equipo" : "Formulario del sitio o el sistema";
  const reload = () => { setStatus("loading"); setError(""); setOffset(0); };

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <PageHeader title="Historial" description="Lo que se ha creado, cambiado o eliminado en el panel, desde que se activó el historial." />
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Sección" htmlFor="history-collection" className="min-w-[12rem]">
          <select id="history-collection" className={selectClass} value={collection} onChange={e => { setCollection(e.target.value); reload(); }}>
            <option value="">Todas</option>
            {Object.entries(labels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
        </Field>
        {record && <Button variant="ghost" onClick={() => { setRecord(""); reload(); }}>Ver todo el historial</Button>}
      </div>
      {record && <p className="text-sm text-muted-foreground">Solo los movimientos de {nameOf({ collection, record_id: record }) ?? "este registro"}.</p>}
      <p className="text-sm text-muted-foreground">Para restaurar algo eliminado: <Link href={PAPELERA.href} className="font-semibold text-foreground underline underline-offset-4">{PAPELERA.enlace}</Link>.</p>
      {status === "loading" ? <p role="status">Cargando historial…</p>
        : error ? <div role="alert" className="flex flex-wrap items-center gap-3"><p>{error}</p><Button onClick={() => { setStatus("loading"); setRevision(n => n + 1); }}>Reintentar</Button></div>
        : <>
          {entries.length ? <ul className="flex flex-col gap-3" aria-label="Movimientos">
            {entries.map(entry => {
              const name = nameOf(entry);
              return <Card as="li" key={entry.id} className="min-w-0 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="break-words text-base font-semibold">{name ?? (entry.action === "DELETE" ? "Registro eliminado" : "Registro sin nombre")}</h2>
                    <p className="mt-1 text-sm">{ACTION[entry.action]} · {labels[entry.collection] ?? entry.collection}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{humanDateTime(entry.created_at)} · {who(entry.actor_id)}</p>
                    {!!entry.changed_fields?.length && <details className="mt-2 text-sm text-muted-foreground">
                      <summary className="inline-flex min-h-11 cursor-pointer items-center underline underline-offset-4">{entry.changed_fields.length === 1 ? "Ver el dato que cambió" : `Ver los ${entry.changed_fields.length} datos que cambiaron`}</summary>
                      <p className="break-words">{entry.changed_fields.join(", ")}</p>
                    </details>}
                  </div>
                </div>
              </Card>;
            })}
          </ul> : <EmptyBox art={{ icon: EMPTY_ART.historial }} title="Sin movimientos">
            {collection || record ? "No hay movimientos en esta sección. Prueba con «Todas»." : "Cada vez que alguien del equipo guarde o elimine algo, quedará anotado aquí con su fecha."}
          </EmptyBox>}
          {(offset > 0 || more) && <div className="flex gap-2">
            <Button disabled={offset === 0} onClick={() => { setStatus("loading"); setOffset(n => n - 50); }}>Anterior</Button>
            <Button disabled={!more} onClick={() => { setStatus("loading"); setOffset(n => n + 50); }}>Siguiente</Button>
          </div>}
        </>}
    </div>
  );
}
