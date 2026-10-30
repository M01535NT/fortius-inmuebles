"use client";
import * as React from "react";
import Link from "next/link";
import { apiRequest, db, useCollection } from "@/lib/admin/store";
import { operationalDate } from "@/lib/admin/operational-date";
import { channelMetrics, dateInPeriod, periodMetrics } from "@/lib/admin/period-report";
import {
  Field,
  inputClass,
  selectClass,
  btnGhost,
} from "@/components/admin/ui";
import { calculateComercial } from "@/lib/comercial/calculate";
import type { CommercialBook } from "@/lib/comercial/types";

export function PeriodReport() {
  const leads = useCollection(db.leads),
    events = useCollection(db.eventos),
    advisers = useCollection(db.asesores);
  const today = operationalDate();
  const [from, setFrom] = React.useState(today.slice(0, 8) + "01"),
    [to, setTo] = React.useState(today),
    [advisor, setAdvisor] = React.useState("");
  const [books, setBooks] = React.useState<{ id: string; nombre: string }[]>(
      [],
    ),
    [bookId, setBookId] = React.useState(""),
    [book, setBook] = React.useState<CommercialBook | null>(null),
    [error, setError] = React.useState(""),
    [loading, setLoading] = React.useState(false);
  React.useEffect(() => {
    let active = true;
    apiRequest<{ carteras: typeof books }>("/api/admin/comercial")
      .then((r) => {
        if (active) setBooks(r.carteras ?? []);
      })
      .catch(() => {
        if (active)
          setError("No se pudieron consultar las carteras comerciales.");
      });
    return () => {
      active = false;
    };
  }, []);
  React.useEffect(() => {
    let active = true;
    if (!bookId) return;
    apiRequest<{ cartera: CommercialBook }>(`/api/admin/comercial/${bookId}`)
      .then((r) => {
        if (active) setBook(r.cartera);
      })
      .catch(() => {
        if (active) setError("No se pudo cargar esta cartera.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [bookId]);
  const valid = (!from || !to || from <= to) && (!to || to <= today);
  const filter = { from, to, advisor };
  const metrics = periodMetrics(leads, events, filter);
  const channels = channelMetrics(metrics.leads);
  const advisorName = advisers.find((a) => a.id === advisor)?.nombre;
  const checked = book ? calculateComercial(book.data, to || today) : null;
  const commercialEvents =
    book?.data.eventos.filter(
      (e) =>
        dateInPeriod(e.fecha, filter) &&
        (!advisor ||
          e.responsable === advisor ||
          e.responsable === advisorName) &&
        !["Pendiente", "Cancelado"].includes(e.estado) &&
        checked?.eventos.some(
          (c) => c.id === e.id && c.vigente && !c.controles.length,
        ),
    ) ?? [];
  const offers = commercialEvents.filter((e) => e.actividad === "Oferta"),
    closures = commercialEvents.filter(
      (e) =>
        e.actividad === "Cierre" &&
        e.estado !== "Rechazado" &&
        e.base === "Comprobado" &&
        !!e.evidencia,
    );
  return (
    <section
      className="min-w-0 space-y-4 rounded-lg border border-border bg-card p-4 sm:p-5"
      aria-label="Resultados por periodo"
    >
      <h2 className="text-xl font-semibold">Resultados por periodo</h2>
      <div className="grid min-w-0 gap-3 sm:grid-cols-3">
        <Field label="Desde" htmlFor="report-from">
          <input
            id="report-from"
            type="date"
            className={inputClass}
            value={from}
            max={to || today}
            onChange={(e) => setFrom(e.target.value)}
          />
        </Field>
        <Field label="Hasta" htmlFor="report-to">
          <input
            id="report-to"
            type="date"
            className={inputClass}
            value={to}
            min={from}
            max={today}
            onChange={(e) => setTo(e.target.value)}
          />
        </Field>
        <Field label="Asesor del reporte" htmlFor="report-advisor">
          <select
            id="report-advisor"
            className={selectClass}
            value={advisor}
            onChange={(e) => setAdvisor(e.target.value)}
          >
            <option value="">Todos</option>
            {advisers.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </Field>
      </div>
      {!valid ? (
        <p role="alert">
          Revisa el periodo: el inicio debe ser anterior al final y el corte no
          puede ser futuro.
        </p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                title: "Prospectos recibidos",
                value: metrics.leads.length,
                items: metrics.leads.map((l) => ({
                  id: l.id,
                  label: l.nombre,
                  href: `/admin/leads/${l.id}`,
                })),
              },
              {
                title: "Primera atención promedio",
                value:
                  metrics.responseHours === null
                    ? "Sin medición"
                    : `${metrics.responseHours.toLocaleString("es-MX", { maximumFractionDigits: 1 })} h`,
                items: metrics.responses.map((r) => ({
                  id: r.lead.id,
                  label: `${r.lead.nombre} · ${r.hours.toFixed(1)} h`,
                  href: `/admin/leads/${r.lead.id}`,
                })),
              },
              {
                title: "Visitas programadas",
                value: metrics.visits.length,
                items: metrics.visits.map((e) => ({
                  id: e.id,
                  label: `${e.titulo} · ${e.fecha}`,
                  href: `/admin/agenda?fecha=${e.fecha}&evento=${e.id}`,
                })),
              },
            ].map((card) => (
              <details
                key={card.title}
                className="min-w-0 rounded-md border border-border p-3"
              >
                <summary className="cursor-pointer text-sm">
                  <span>{card.title}</span>
                  <strong className="mt-2 block text-2xl">{card.value}</strong>
                  <span className="mt-2 block text-xs text-muted-foreground">
                    Ver registros
                  </span>
                </summary>
                <ul className="mt-3 max-h-60 overflow-y-auto">
                  {card.items.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        className="block break-words py-2 text-sm underline"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
                {!card.items.length && (
                  <p className="mt-2 text-xs">Sin registros en este periodo.</p>
                )}
              </details>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Primera atención: prospectos recibidos en el periodo con contacto
            registrado; {metrics.responses.length} medidos y{" "}
            {metrics.unmeasured} sin medición. Las visitas corresponden a la
            agenda, no acreditan asistencia.
          </p>
          <div className="min-w-0 space-y-2">
            <h3 className="text-base font-semibold">Prospectos por canal</h3>
            {channels.length ? (
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full min-w-[30rem] text-left text-sm">
                  <caption className="sr-only">Prospectos recibidos en el periodo por canal</caption>
                  <thead className="text-muted-foreground">
                    <tr>
                      <th scope="col" className="px-3 py-2 font-medium">Canal</th>
                      <th scope="col" className="px-3 py-2 text-right font-medium">Recibidos</th>
                      <th scope="col" className="px-3 py-2 text-right font-medium">Atendidos</th>
                      <th scope="col" className="px-3 py-2 text-right font-medium">Descartados</th>
                    </tr>
                  </thead>
                  <tbody>
                    {channels.map((row) => (
                      <tr key={row.canal} className="border-t border-border">
                        <th scope="row" className="px-3 py-2 font-medium">{row.label}</th>
                        <td className="px-3 py-2 text-right tabular-nums">{row.recibidos}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{row.atendidos}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{row.descartados}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sin prospectos en este periodo.</p>
            )}
            <p className="text-xs text-muted-foreground">
              El canal se captura en la ficha del prospecto («Cómo llegó»). Si
              falta, los formularios del sitio cuentan como Sitio web y la
              captura manual como Sin dato. Atendidos: con primer contacto
              registrado o que ya no están en «Nuevo».
            </p>
          </div>
          <Field label="Cartera para ofertas y cierres" htmlFor="report-book">
            <select
              id="report-book"
              className={selectClass}
              value={bookId}
              onChange={(e) => {
                setBook(null);
                setLoading(!!e.target.value);
                setError("");
                setBookId(e.target.value);
              }}
            >
              <option value="">Selecciona una cartera</option>
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nombre}
                </option>
              ))}
            </select>
          </Field>
          {error && (
            <p role="status" className="text-sm">
              {error}
            </p>
          )}
          {loading ? (
            <p role="status">Cargando cartera…</p>
          ) : (
            book && (
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: "Ofertas registradas", rows: offers },
                  {
                    label: "Registros de cierre con evidencia",
                    rows: closures,
                  },
                ].map((group) => (
                  <details
                    key={group.label}
                    className="rounded-md border border-border p-3"
                  >
                    <summary className="cursor-pointer text-sm">
                      {group.label}
                      <strong className="mt-2 block text-2xl">
                        {group.rows.length}
                      </strong>
                    </summary>
                    <ul className="mt-3 space-y-2 text-sm">
                      {group.rows.map((e) => (
                        <li key={e.id} className="break-words">
                          {
                            book.data.oportunidades.find(
                              (o) => o.id === e.oportunidad,
                            )?.nombre
                          }{" "}
                          · {e.fecha}
                          <p>{e.detalle}</p>
                          {e.evidencia && (
                            <p className="text-xs text-muted-foreground">
                              Soporte: {e.evidencia}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={`/admin/control-comercial?cartera=${book.id}`}
                      className={btnGhost + " mt-3"}
                    >
                      Abrir cartera
                    </Link>
                  </details>
                ))}
              </div>
            )
          )}
          {book && (
            <p className="text-xs text-muted-foreground">
              Eventos vigentes, con datos completos y fecha dentro del periodo.
              Cierres: registro marcado Comprobado con evidencia. El responsable
              de la cartera debe coincidir con el asesor seleccionado.
            </p>
          )}
        </>
      )}
    </section>
  );
}
