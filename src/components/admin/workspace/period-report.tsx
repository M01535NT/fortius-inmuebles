"use client";
import * as React from "react";
import Link from "next/link";
import { apiRequest, db, useCollection } from "@/lib/admin/store";
import { operationalDate } from "@/lib/admin/operational-date";
import { channelMetrics, compareCount, compareHours, dateInPeriod, periodMetrics, periodSummary, previousPeriod } from "@/lib/admin/period-report";
import { Field, inputClass, selectClass } from "@/components/admin/ui";
import { ButtonLink } from "@/components/admin/kit";
import { calculateComercial } from "@/lib/comercial/calculate";
import type { CommercialBook } from "@/lib/comercial/types";
import { humanDate } from "@/lib/utils";
import s from "./reports.module.css";

const shortDay = (day: string) => new Date(`${day}T12:00:00`).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
const hours = (value: number | null) => value === null ? "Sin medición" : `${value.toLocaleString("es-MX", { maximumFractionDigits: 1 })} h`;

/*
  Reportes por periodo (SIM-11, C29): cuatro números arriba, cada uno comparado con el periodo
  anterior del mismo largo; tocar uno abre sus registros. El canal y las ofertas y cierres van
  plegados. Las definiciones de cada indicador no cambian (period-report.ts).
*/
export function PeriodReport() {
  const leads = useCollection(db.leads), events = useCollection(db.eventos), advisers = useCollection(db.asesores);
  const today = operationalDate();
  const [from, setFrom] = React.useState(today.slice(0, 8) + "01"), [to, setTo] = React.useState(today), [advisor, setAdvisor] = React.useState("");
  const [books, setBooks] = React.useState<{ id: string; nombre: string }[]>([]), [bookId, setBookId] = React.useState(""), [book, setBook] = React.useState<CommercialBook | null>(null);
  const [error, setError] = React.useState(""), [loading, setLoading] = React.useState(false);
  React.useEffect(() => {
    let active = true;
    apiRequest<{ carteras: typeof books }>("/api/admin/comercial").then(r => { if (active) setBooks(r.carteras ?? []); }).catch(() => { if (active) setError("No se pudieron consultar las carteras."); });
    return () => { active = false; };
  }, []);
  React.useEffect(() => {
    let active = true;
    if (!bookId) return;
    apiRequest<{ cartera: CommercialBook }>(`/api/admin/comercial/${bookId}`)
      .then(r => { if (active) setBook(r.cartera); })
      .catch(() => { if (active) setError("No se pudo abrir esta cartera. Recarga la página."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [bookId]);
  const valid = (!from || !to || from <= to) && (!to || to <= today);
  const filter = { from, to, advisor };
  const metrics = periodMetrics(leads, events, filter);
  const channels = channelMetrics(metrics.leads);
  const previous = previousPeriod(from, to);
  const now = periodSummary(leads, events, filter);
  const before = previous ? periodSummary(leads, events, { ...previous, advisor }) : undefined;
  const advisorName = advisers.find(a => a.id === advisor)?.nombre;
  const checked = book ? calculateComercial(book.data, to || today) : null;
  const commercialEvents = book?.data.eventos.filter(e =>
    dateInPeriod(e.fecha, filter) && (!advisor || e.responsable === advisor || e.responsable === advisorName) &&
    !["Pendiente", "Cancelado"].includes(e.estado) && checked?.eventos.some(c => c.id === e.id && c.vigente && !c.controles.length)) ?? [];
  const offers = commercialEvents.filter(e => e.actividad === "Oferta");
  const closures = commercialEvents.filter(e => e.actividad === "Cierre" && e.estado !== "Rechazado" && e.base === "Comprobado" && !!e.evidencia);
  const leadLink = (id: string, label: string) => ({ id, label, href: `/admin/leads/${id}` });
  const kpis = [
    { title: "Prospectos recibidos", value: String(now.received), compare: compareCount(now.received, before?.received), items: metrics.leads.map(l => leadLink(l.id, l.nombre)) },
    { title: "Prospectos atendidos", value: String(now.attended), compare: compareCount(now.attended, before?.attended), items: metrics.leads.filter(l => l.firstContactedAt || l.estado !== "nuevo").map(l => leadLink(l.id, l.nombre)) },
    { title: "Primera atención promedio", value: hours(now.responseHours), compare: compareHours(now.responseHours, before ? before.responseHours : undefined), items: metrics.responses.map(r => leadLink(r.lead.id, `${r.lead.nombre} · ${hours(r.hours)}`)) },
    { title: "Visitas agendadas", value: String(now.visits), compare: compareCount(now.visits, before?.visits), items: metrics.visits.map(e => ({ id: e.id, label: `${e.titulo} · ${humanDate(e.fecha)}`, href: `/admin/agenda?fecha=${e.fecha}&evento=${e.id}` })) },
  ];
  return <section className={s.block} aria-labelledby="report-period">
    <h2 id="report-period" className="text-xl font-semibold">Resultados del periodo</h2>
    <div className={s.filters}>
      <Field label="Desde" htmlFor="report-from"><input id="report-from" type="date" className={inputClass} value={from} max={to || today} onChange={e => setFrom(e.target.value)} /></Field>
      <Field label="Hasta" htmlFor="report-to"><input id="report-to" type="date" className={inputClass} value={to} min={from} max={today} onChange={e => setTo(e.target.value)} /></Field>
      <Field label="Asesor" htmlFor="report-advisor">
        <select id="report-advisor" className={selectClass} value={advisor} onChange={e => setAdvisor(e.target.value)}>
          <option value="">Todo el equipo</option>
          {advisers.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
        </select>
      </Field>
    </div>
    {!valid ? <p role="alert">Revisa las fechas: «Desde» va antes que «Hasta» y «Hasta» no puede ser después de hoy.</p> : <>
      {previous && <p className={s.note}>Se compara con el periodo anterior: {shortDay(previous.from)} al {shortDay(previous.to)}. Toca un número para ver sus registros.</p>}
      <div className={s.kpis}>
        {kpis.map(kpi => <details key={kpi.title} className={s.kpi}>
          <summary><span className={s.kpiLabel}>{kpi.title}</span><strong className={s.kpiValue} data-text={/^\d/.test(kpi.value) ? undefined : ""}>{kpi.value}</strong><span className={s.kpiCompare}>{kpi.compare}</span></summary>
          <div className={s.kpiList}>
            {kpi.items.length ? <ul>{kpi.items.map(item => <li key={item.id}><Link href={item.href}>{item.label}</Link></li>)}</ul> : <p>Sin registros en este periodo.</p>}
          </div>
        </details>)}
      </div>
      <details className={s.fold}>
        <summary>Prospectos por canal <span className={s.summaryNote}>{channels.length ? `${channels.length} ${channels.length === 1 ? "canal" : "canales"}` : "Sin prospectos"}</span></summary>
        <div className={s.foldBody}>
          {channels.length ? <div className="overflow-x-auto">
            <table className="w-full min-w-[26rem] text-left text-sm">
              <caption className="sr-only">Prospectos recibidos en el periodo por canal</caption>
              <thead className="text-muted-foreground"><tr><th scope="col" className="px-3 py-2 font-medium">Canal</th><th scope="col" className="px-3 py-2 text-right font-medium">Recibidos</th><th scope="col" className="px-3 py-2 text-right font-medium">Atendidos</th><th scope="col" className="px-3 py-2 text-right font-medium">Descartados</th></tr></thead>
              <tbody>{channels.map(row => <tr key={row.canal} className="border-t border-border"><th scope="row" className="px-3 py-2 font-medium">{row.label}</th><td className="px-3 py-2 text-right tabular-nums">{row.recibidos}</td><td className="px-3 py-2 text-right tabular-nums">{row.atendidos}</td><td className="px-3 py-2 text-right tabular-nums">{row.descartados}</td></tr>)}</tbody>
            </table>
          </div> : <p className={s.note}>Sin prospectos en este periodo.</p>}
        </div>
      </details>
      <details className={s.fold}>
        <summary>Ofertas y cierres <span className={s.summaryNote}>Según la cartera que elijas</span></summary>
        <div className={s.foldBody}>
          <Field label="Cartera" htmlFor="report-book">
            <select id="report-book" className={selectClass} value={bookId} onChange={e => { setBook(null); setLoading(!!e.target.value); setError(""); setBookId(e.target.value); }}>
              <option value="">Elige una cartera</option>
              {books.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
            </select>
          </Field>
          {error && <p role="status" className="text-sm">{error}</p>}
          {loading ? <p role="status">Abriendo cartera…</p> : book && <>
            <div className="grid gap-3 sm:grid-cols-2">
              {[{ label: "Ofertas", rows: offers }, { label: "Cierres con comprobante", rows: closures }].map(group => <div key={group.label} className="rounded-[10px] border border-border p-3">
                <p className="text-sm text-muted-foreground">{group.label}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{group.rows.length}</p>
                <ul className="mt-2 space-y-2 text-sm">{group.rows.map(e => <li key={e.id} className="break-words">{book.data.oportunidades.find(o => o.id === e.oportunidad)?.nombre} · {humanDate(e.fecha)}<p>{e.detalle}</p></li>)}</ul>
              </div>)}
            </div>
            <ButtonLink href={`/admin/control-comercial?cartera=${book.id}`} className="self-start">Abrir cartera</ButtonLink>
          </>}
        </div>
      </details>
      <details className={s.fold}>
        <summary>¿Cómo se cuenta?</summary>
        <div className={`${s.foldBody} ${s.note}`}>
          <p>Prospectos recibidos: los que entraron en el periodo. Atendidos: con primer contacto registrado o que ya no están en «Nuevo». Primera atención: horas entre que llegó y el primer contacto; {metrics.responses.length} medidos y {metrics.unmeasured} sin medición. Visitas: las agendadas en el periodo; no acreditan que se hicieran.</p>
          <p>El canal sale de «Cómo llegó» en la ficha del prospecto; si falta, los formularios del sitio cuentan como Sitio web y la captura manual como Sin dato.</p>
          <p>Ofertas y cierres: registros vigentes y completos de la cartera, con fecha dentro del periodo. Un cierre cuenta si está marcado como comprobado y tiene su comprobante.</p>
        </div>
      </details>
    </>}
  </section>;
}
