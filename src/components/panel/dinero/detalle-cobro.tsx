"use client";
import { diaLargo } from "@/lib/panel/calendario";
import { dinero, historial, lineaCobro, type PorCobrar } from "@/lib/panel/datos/dinero";

/**
 * Detalle de un cobro con el orden del modelo visual: la cifra grande (Falta cobrar o Cobrado completo) y las líneas del
 * cálculo en una tarjeta de renglones, de dónde sale y los movimientos (recibos). «Registrar cobro» y «Abrir el asunto»
 * van en la barra de arriba. Hoy un cobro se registra con el recibo 18 del asunto: «Registrar cobro» abre ese recibo.
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
    <>
      <section className="fm-grupo" aria-label="La comisión">
        <div className="fm-t">La comisión</div>
        <div className="fm-card">
          <div className="fm-big">
            <span>{completo ? (fila.descuento > 0 ? "Saldado con pago total" : "Cobrado completo") : "Falta cobrar"}</span>
            <b>{dinero(completo ? fila.total : fila.falta)}</b>
          </div>
          {lineas.map((l) => (
            <div key={l.k} className="fm-dato"><span className="fm-k">{l.k}</span>{l.falta ? <span className="fm-v din-der" data-vacio="">{l.v}</span> : <b className="fm-num">{l.v}</b>}</div>
          ))}
        </div>
        <p className="as-m fm-pie">{fila.fuente ? `De dónde sale: ${fila.fuente}.` : "Sale del cierre del asunto."} Al generar el PDF de un recibo, se descuenta de lo que te deben.</p>
      </section>
      {recibos.length ? (
        <section className="fm-grupo" aria-label="Movimientos">
          <div className="fm-t"><span>Movimientos</span><span className="fm-t-n">{recibos.length}</span></div>
          <div className="fm-card">
            {recibos.map((c) => (
              <div key={c.id} className="fm-dato">
                <span className="fm-k">{[c.fecha ? diaLargo(c.fecha) : "Sin fecha", lineaCobro(c)].join(" · ")}</span>
                <b className="fm-num" data-tono={c.emitido ? undefined : "aviso"}>{dinero(c.importe, c.moneda)}</b>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
