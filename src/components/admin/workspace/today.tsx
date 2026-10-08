"use client";
import * as React from "react";
import Link from "next/link";
import { apiRequest, db, useCollection } from "@/lib/admin/store";
import { projectFollowups } from "@/lib/admin/followups";
import { operationalDate } from "@/lib/admin/operational-date";

export function TodayWorkspace() {
  const leads = useCollection(db.leads),
    clients = useCollection(db.clientes),
    events = useCollection(db.eventos);
  const today = operationalDate();
  const contacts = projectFollowups(leads, clients).filter(
    (f) => f.fecha <= today,
  );
  const visits = events
    .filter((e) => e.tipo === "visita" && e.fecha === today)
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
  const groups = [
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
      title: "Visitas de hoy",
      items: visits.map((e) => ({
        id: e.id,
        title: e.titulo,
        detail: e.hora ?? "Sin hora",
        href: `/admin/calendario?fecha=${today}&evento=${e.id}`,
      })),
      empty: "Sin visitas programadas para hoy.",
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
    <section
      aria-label="Atención de hoy"
      className="grid min-w-0 gap-3 xl:grid-cols-3"
    >
      {groups.map((group) => (
        <div
          key={group.title}
          className="min-w-0 rounded-lg border border-border bg-card p-4"
        >
          <h2 className="font-semibold">
            {group.title}{" "}
            <span className="text-muted-foreground">
              {group.items.length || ""}
            </span>
          </h2>
          {group.items.length ? (
            <ul className="mt-2 max-h-64 overflow-y-auto divide-y divide-border">
              {group.items.map((item) => (
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
        </div>
      ))}
    </section>
  );
}
