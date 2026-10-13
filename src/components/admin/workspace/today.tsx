"use client";
import * as React from "react";
import Link from "next/link";
import { apiRequest, db, useCollection } from "@/lib/admin/store";
import { projectFollowups } from "@/lib/admin/followups";
import { operationalDate } from "@/lib/admin/operational-date";
import { EXPEDIENTE_ETAPAS } from "@/lib/formatos/expediente-operations";

export function TodayWorkspace() {
  const leads = useCollection(db.leads),
    clients = useCollection(db.clientes),
    events = useCollection(db.eventos),
    tasks = useCollection(db.tareas);
  const today = operationalDate();
  const contacts = projectFollowups(leads, clients).filter(
    (f) => f.fecha <= today,
  );
  const visits = events
    .filter((e) => e.fecha === today)
    .sort((a, b) => (a.hora ?? "").localeCompare(b.hora ?? ""));
  const [dossiers, setDossiers] = React.useState<
    { id: string; folio: string; etapa?: string; fecha_objetivo?: string }[]
  >([]);
  const [state, setState] = React.useState("loading");
  React.useEffect(() => {
    let active = true;
    apiRequest<{ expedientes: typeof dossiers }>("/api/admin/expedientes")
      .then((r) => {
        if (active) {
          setDossiers(r.expedientes ?? []);
          setState("ready");
        }
      })
      .catch(() => {
        if (active) setState("error");
      });
    return () => {
      active = false;
    };
  }, []);
  const due = dossiers.filter(
    (e) =>
      e.etapa !== "cerrado" && e.fecha_objetivo && e.fecha_objetivo < today,
  );
  const pending = tasks.filter(t => t.estado !== "completada" && t.estado !== "cancelada" && t.vence && t.vence <= today).sort((a,b) => (a.vence ?? "").localeCompare(b.vence ?? ""));
  const groups = [
    { title: "Tareas prioritarias", items: pending.map(t => ({ id: t.id, title: t.titulo, detail: t.vence === today ? "Hoy" : `Vencida · ${t.vence}`, href: `/admin/tareas/${t.id}` })), empty: "No hay tareas vencidas ni previstas para hoy." },
    {
      title: "Contactos por atender",
      items: contacts.map((f) => ({
        id: f.id,
        title: f.personName,
        detail: f.fecha === today ? "Hoy" : `Pendiente desde ${f.fecha}`,
        href: f.href,
      })),
      empty: "Sin contactos vencidos ni previstos para hoy.",
    },
    {
      title: "Agenda de hoy",
      items: visits.map((e) => ({
        id: e.id,
        title: e.titulo,
        detail: e.hora ?? "Sin hora",
        href: `/admin/calendario?fecha=${today}&evento=${e.id}`,
      })),
      empty: "Sin eventos programados para hoy.",
    },
    {
      title: "Expedientes por retomar",
      items: due.map((e) => ({
        id: e.id,
        title: e.folio,
        detail: `Fecha objetivo: ${e.fecha_objetivo}`,
        href: `/admin/expedientes?expediente=${e.id}`,
      })),
      empty:
        state === "loading"
          ? "Cargando expedientes…"
          : state === "error"
            ? "No se pudo consultar el seguimiento de expedientes."
            : "Sin expedientes con fecha objetivo vencida.",
    },
  ];
  return (
    <div className="flex min-w-0 flex-col gap-4">
    <section className="admin-card order-2 xl:order-1" aria-label="Ciclo del inmueble">
      <div className="admin-card-heading">
        <h2>Ciclo del inmueble</h2>
        <Link href="/admin/expedientes">Ver operaciones →</Link>
      </div>
      {state === "error" ? <p role="alert" className="p-5 text-sm text-muted-foreground">No se pudieron consultar las etapas. Recarga el módulo para reintentar.</p> : (
        <ol className="admin-cycle" aria-busy={state === "loading"}>
          {(["captacion", "documentacion", "comercializacion", "negociacion", "cierre"] as const).map((stage, index) => (
            <li key={stage} className="admin-cycle-step">
              <span className="admin-cycle-number" aria-hidden="true">{index + 1}</span>
              <div className="min-w-0"><p>{EXPEDIENTE_ETAPAS[stage]}</p><strong>{state === "loading" ? "—" : dossiers.filter(d => (d.etapa ?? "captacion") === stage).length}</strong><span className="ml-1 text-xs text-muted-foreground">expedientes</span></div>
            </li>
          ))}
        </ol>
      )}
      <p className="px-5 pb-4 text-xs text-muted-foreground">Etapas registradas en los expedientes activos. Los expedientes cerrados no se incluyen en este recorrido.</p>
    </section>
    <section
      aria-label="Atención de hoy"
      className="order-1 grid min-w-0 items-start gap-3 md:grid-cols-2 xl:order-2"
    >
      {groups.map((group) => (
        <div
          key={group.title}
          className="admin-card min-w-0 rounded-lg border border-border bg-card p-5"
        >
          <h2 className="font-semibold">
            {group.title}{" "}
            <span className="text-muted-foreground">
              {group.items.length || ""}
            </span>
          </h2>
          {group.items.length ? (
            <ul className="mt-2 divide-y divide-border">
              {group.items.slice(0, 4).map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="block rounded py-3 hover:bg-secondary"
                  >
                    <span className="block break-words text-sm font-medium">
                      {item.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {item.detail}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">{group.empty}</p>
          )}
          {group.items.length > 4 && <Link className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold underline" href={group.items[0].href.split("?")[0].split("/").slice(0,3).join("/")}>Ver los {group.items.length} pendientes</Link>}
        </div>
      ))}
    </section>
    </div>
  );
}
