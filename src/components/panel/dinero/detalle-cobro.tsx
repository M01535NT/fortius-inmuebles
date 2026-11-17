"use client";
import { Tarjeta } from "@/components/panel/kit/lista";
import { diaLargo } from "@/lib/panel/calendario";
import { dinero, historial, lineaCobro, type PorCobrar } from "@/lib/panel/datos/dinero";

/**
 * Detalle de un cobro, como el boceto: «Comisión · folio», la cifra grande (Falta cobrar o Cobrado completo),
 * las líneas del cálculo en una tarjeta, una nota, «Registrar cobro» y los movimientos (recibos).
 * Hoy un cobro se registra con el recibo 18 del asunto: «Registrar cobro» abre ese recibo en Formatos.
 */
export function DetalleCobro({ fila }: { fila: PorCobrar }) {
  const recibos = historial(fila.recibos);
  const completo = fila.falta === 0;
  const lineas: { k: string; v: string; falta?: boolean }[] = [
    { k: "Total", v: dinero(fila.total) },
    { k: "Ya cobrado", v: dinero(fila.cobrado) },
    ...(fila.descuento > 0 ? [{ k: "Descuento", v: `${dinero(fila.descuento)} (pago total)` }] : []),
    ...(fila.cobradoDolares > 0 ? [{ k: "Cobrado en dólares", v: dinero(fila.cobradoDolares, "USD") }] : []),
    { k: "Vence", v: "Sin fecha anotada", falta: true },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 4 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-muted)" }}>{["Comisión", fila.folio].filter(Boolean).join(" · ")}</span>
      <div className="pn-din-big">
        <span className="pn-din-sl">{completo ? (fila.descuento > 0 ? "Saldado con pago total" : "Cobrado completo") : "Falta cobrar"}</span>
        <span className="pn-din-dv">{dinero(completo ? fila.total : fila.falta)}</span>
      </div>
      <Tarjeta className="pn-din-lineas">
        {lineas.map((l) => <div key={l.k} className="pn-din-ln" data-falta={l.falta || undefined}><span>{l.k}</span><span>{l.v}</span></div>)}
      </Tarjeta>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{fila.fuente ? `De dónde sale: ${fila.fuente}.` : "Sale del cierre del asunto."} Al generar el PDF de un recibo, se descuenta de lo que te deben.</p>
      {!completo ? (
        <a className="pn-btn pn-btn-primario pn-btn-bloque" style={{ minHeight: 48 }} href={`/panel/formatos?asunto=${encodeURIComponent(fila.asuntoId)}&formato=18`}>Registrar cobro</a>
      ) : null}
      {recibos.length ? (
        <section style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h3 className="pn-grupo" style={{ margin: 0 }}>Movimientos</h3>
          <Tarjeta className="pn-din-lineas">
            {recibos.map((c) => (
              <div key={c.id} className="pn-din-ln">
                <span>{[c.fecha ? diaLargo(c.fecha) : "Sin fecha", lineaCobro(c)].join(" · ")}</span>
                <span className={c.emitido ? undefined : "pn-tono-aviso"}>{dinero(c.importe, c.moneda)}</span>
              </div>
            ))}
          </Tarjeta>
        </section>
      ) : null}
      <a className="pn-btn pn-btn-secundario" href={`/panel/asuntos?ver=${encodeURIComponent(fila.asuntoId)}`}>Abrir el asunto</a>
    </div>
  );
}
