"use client";
import { Ficha } from "@/components/panel/kit/ficha";
import { Fila, GrupoLista } from "@/components/panel/kit/lista";
import { diaLargo } from "@/lib/panel/calendario";
import { dinero, historial, lineaCobro, type PorCobrar } from "@/lib/panel/datos/dinero";

/**
 * Detalle de lo que se cobra en un asunto: lo que falta, el total, lo cobrado y de dónde sale.
 * «Registrar cobro» queda sin acción: hoy un cobro se registra con el recibo 18 del asunto (Formatos).
 */
export function DetalleCobro({ fila }: { fila: PorCobrar }) {
  const recibos = historial(fila.recibos);
  return (
    <div style={{ display: "grid", gap: 16, marginTop: 8 }}>
      <div>
        <p style={{ margin: 0, fontSize: 28, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{dinero(fila.falta)}</p>
        <p className="pn-sub" style={{ margin: 0 }}>{fila.falta > 0 ? "falta por cobrar" : "cobrado completo"}</p>
      </div>
      <Ficha secciones={[{ titulo: "Comisión", datos: [
        { etiqueta: "Total estimado", valor: dinero(fila.total) },
        { etiqueta: "Ya cobrado", valor: dinero(fila.cobrado) },
        { etiqueta: "Vence", valor: "Sin fecha anotada", falta: true },
        { etiqueta: "De dónde sale", valor: fila.fuente || "Cierre del asunto" },
      ] }]} />
      {recibos.length ? (
        <GrupoLista titulo="Recibos">
          {recibos.map((c) => <Fila key={c.id} titulo={lineaCobro(c)} subtitulo={c.fecha ? diaLargo(c.fecha) : "Sin fecha de pago"} lado={dinero(c.importe, c.moneda)} tonoDetalle={c.emitido ? "normal" : "aviso"} />)}
        </GrupoLista>
      ) : null}
      <div style={{ display: "grid", gap: 6 }}>
        <a className="pn-btn pn-btn-primario pn-btn-bloque" href={`/panel/formatos?asunto=${encodeURIComponent(fila.asuntoId)}&formato=18`} aria-describedby={`cobro-${fila.asuntoId}`}>Hacer recibo de honorarios</a>
        <span id={`cobro-${fila.asuntoId}`} className="pn-sub" style={{ margin: 0 }}>El cobro se anota con el recibo: al generar su PDF, se descuenta de lo que te deben.</span>
      </div>
      <a className="pn-btn pn-btn-secundario" href={`/panel/asuntos?ver=${encodeURIComponent(fila.asuntoId)}`}>Abrir el asunto</a>
    </div>
  );
}
