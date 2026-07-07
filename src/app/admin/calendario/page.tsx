"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";

import { Badge, Field, PageHeader, btnGhost, btnPrimary, inputClass, selectClass } from "@/components/admin/ui";
import {
  EVENTO_TIPOS,
  EVENTO_TIPO_LABELS,
  db,
  removeById,
  uid,
  upsert,
  useCollection,
  type EventoTipo,
} from "@/lib/admin/store";

/*
  Calendario mensual de la operación: visitas, llamadas, firmas y
  reuniones, vinculables a leads y propiedades.
*/
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const DIAS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function CalendarioPage() {
  const eventos = useCollection(db.eventos);
  const leads = useCollection(db.leads);
  const [cursor, setCursor] = React.useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [seleccion, setSeleccion] = React.useState<string>(() => ymd(new Date()));

  const hoy = ymd(new Date());
  const primerDia = new Date(cursor.year, cursor.month, 1);
  const totalDias = new Date(cursor.year, cursor.month + 1, 0).getDate();
  /* Lunes = 0 */
  const offset = (primerDia.getDay() + 6) % 7;
  const celdas: (string | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: totalDias }, (_, i) =>
      ymd(new Date(cursor.year, cursor.month, i + 1)),
    ),
  ];

  const porDia = new Map<string, number>();
  for (const e of eventos) porDia.set(e.fecha, (porDia.get(e.fecha) ?? 0) + 1);

  const delDia = eventos
    .filter((e) => e.fecha === seleccion)
    .sort((a, b) => (a.hora ?? "").localeCompare(b.hora ?? ""));

  function mover(delta: number) {
    setCursor(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  function agendar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    upsert(db.eventos, {
      id: uid(),
      titulo: String(data.get("titulo") ?? ""),
      fecha: String(data.get("fecha") ?? seleccion),
      hora: String(data.get("hora") ?? "") || undefined,
      tipo: String(data.get("tipo") ?? "otro") as EventoTipo,
      leadId: String(data.get("leadId") ?? "") || undefined,
    });
    form.reset();
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Calendario." description="Visitas, llamadas, firmas y reuniones del equipo." />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Mes */}
        <section className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="display-soft text-lg text-foreground">
              {MESES[cursor.month]} <span className="font-mono text-[15px] text-muted-foreground">{cursor.year}</span>
            </h2>
            <div className="flex gap-1.5">
              <button type="button" aria-label="Mes anterior" onClick={() => mover(-1)} className={btnGhost + " h-9 w-9 p-0"}>
                <ChevronLeft className="size-4" strokeWidth={1.5} />
              </button>
              <button type="button" aria-label="Mes siguiente" onClick={() => mover(1)} className={btnGhost + " h-9 w-9 p-0"}>
                <ChevronRight className="size-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1 text-center font-mono text-[10.5px] uppercase text-muted-foreground">
            {DIAS.map((d) => (
              <span key={d} className="py-1">{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {celdas.map((fecha, i) =>
              fecha === null ? (
                <span key={`x-${i}`} />
              ) : (
                <button
                  key={fecha}
                  type="button"
                  onClick={() => setSeleccion(fecha)}
                  aria-pressed={seleccion === fecha}
                  className={
                    "relative aspect-square rounded-md border text-[13px] transition-colors " +
                    (seleccion === fecha
                      ? "border-primary/60 bg-primary/10 font-semibold text-primary"
                      : fecha === hoy
                        ? "border-border bg-secondary font-semibold text-foreground"
                        : "border-transparent text-foreground/75 hover:bg-secondary/60")
                  }
                >
                  {Number(fecha.slice(8, 10))}
                  {porDia.get(fecha) ? (
                    <span
                      aria-label={`${porDia.get(fecha)} eventos`}
                      className="absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-primary"
                    />
                  ) : null}
                </button>
              ),
            )}
          </div>
        </section>

        {/* Día seleccionado */}
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="display-soft text-lg text-foreground">
            {Number(seleccion.slice(8, 10))} de {MESES[Number(seleccion.slice(5, 7)) - 1].toLowerCase()}
          </h2>

          {delDia.length > 0 ? (
            <ul className="mt-4 divide-y divide-border border-y border-border">
              {delDia.map((evento) => {
                const lead = leads.find((l) => l.id === evento.leadId);
                return (
                  <li key={evento.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-[14px] text-foreground">
                        {evento.hora ? (
                          <span className="font-mono text-[12px] text-primary">{evento.hora}</span>
                        ) : null}
                        <span className="truncate">{evento.titulo}</span>
                      </p>
                      <p className="mt-0.5 flex items-center gap-2 text-[12px] text-muted-foreground">
                        <Badge>{EVENTO_TIPO_LABELS[evento.tipo]}</Badge>
                        {lead ? (
                          <Link href={`/admin/leads/${lead.id}`} className="truncate text-primary hover:text-foreground">
                            {lead.nombre}
                          </Link>
                        ) : null}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label={`Eliminar ${evento.titulo}`}
                      onClick={() => removeById(db.eventos, evento.id)}
                      className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" strokeWidth={1.5} />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 text-[13px] text-muted-foreground">Sin eventos este día.</p>
          )}

          <form onSubmit={agendar} className="mt-5 space-y-3 border-t border-border pt-5">
            <Field label="Nuevo evento" htmlFor="cal-titulo">
              <input id="cal-titulo" name="titulo" required placeholder="Visita con prospecto…" className={inputClass} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fecha" htmlFor="cal-fecha">
                <input id="cal-fecha" name="fecha" type="date" defaultValue={seleccion} key={seleccion} required className={inputClass} />
              </Field>
              <Field label="Hora" htmlFor="cal-hora">
                <input id="cal-hora" name="hora" type="time" className={inputClass} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tipo" htmlFor="cal-tipo">
                <select id="cal-tipo" name="tipo" className={selectClass}>
                  {EVENTO_TIPOS.map((t) => (
                    <option key={t} value={t}>{EVENTO_TIPO_LABELS[t]}</option>
                  ))}
                </select>
              </Field>
              <Field label="Lead (opcional)" htmlFor="cal-lead">
                <select id="cal-lead" name="leadId" className={selectClass}>
                  <option value="">Ninguno</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>{l.nombre}</option>
                  ))}
                </select>
              </Field>
            </div>
            <button type="submit" className={btnPrimary + " w-full"}>Agendar</button>
          </form>
        </section>
      </div>
    </div>
  );
}
