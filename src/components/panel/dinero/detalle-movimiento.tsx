"use client";
import { useEffect, useRef, useState } from "react";

import { useAvisos } from "@/components/panel/kit/avisos";
import { Boton } from "@/components/panel/kit/boton";
import { Campo, formatoMonto, montoANumero } from "@/components/panel/kit/campo";
import { Desplegable } from "@/components/panel/kit/desplegable";
import { Tarjeta } from "@/components/panel/kit/lista";
import { diaLargo } from "@/lib/panel/calendario";
import { dinero } from "@/lib/panel/datos/dinero";
import {
  abrirComprobante, cambiarMovimiento, faltaDe, FORMAS_PAGO, NOMBRE_TIPO, subirComprobante, TIPOS_COMPROBANTE,
  type CambioMovimiento, type FormaPago, type Movimiento,
} from "@/lib/panel/datos/movimientos";

const fecha = (iso: string | null) => (iso ? diaLargo(iso.slice(0, 10)) : "");
const ESTADO_CERRADO = { entregado: "Entregado al propietario", reembolsado: "Reembolsado", cobrado: "Cobrado completo" } as const;

/**
 * Detalle de un movimiento suelto, como el boceto: qué es, la cifra grande, las líneas del cálculo, el comprobante y la acción:
 * «Registrar entrega» en un apartado (pasa al historial) o «Registrar cobro» en una comisión o un gasto (parcial permitido,
 * nunca más de lo que falta). Todo con Deshacer. `pedirCobro` cambia cuando se pulsa P: lleva el foco al monto.
 */
export function DetalleMovimiento({ m, asunto, alCambiar, pedirCobro }: {
  m: Movimiento; asunto: { titulo: string; id: string } | null; alCambiar: (m: Movimiento) => void; pedirCobro: number;
}) {
  const { avisar } = useAvisos();
  const falta = faltaDe(m);
  const [monto, setMonto] = useState(() => formatoMonto(String(falta)));
  const [forma, setForma] = useState<FormaPago>(m.formaPago ?? "transferencia");
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const campoMonto = useRef<HTMLDivElement>(null);
  const entrada = useRef<HTMLInputElement>(null);

  // Al cambiar el movimiento se reinician el monto y el error (durante el render, sin efecto).
  const [movVisto, setMovVisto] = useState(m);
  if (movVisto !== m) { setMovVisto(m); setMonto(formatoMonto(String(faltaDe(m)))); setError(null); }
  useEffect(() => { if (pedirCobro) campoMonto.current?.querySelector("input")?.focus(); }, [pedirCobro]);

  async function hacer(cambio: CambioMovimiento, texto: string, deshacer?: (nuevo: Movimiento) => CambioMovimiento) {
    if (ocupado) return;
    setOcupado(true); setError(null);
    try {
      const nuevo = await cambiarMovimiento(m.id, cambio);
      alCambiar(nuevo);
      avisar(texto, deshacer ? {
        etiqueta: "Deshacer",
        alAccionar: () => { cambiarMovimiento(nuevo.id, deshacer(nuevo)).then(alCambiar, (e: unknown) => avisar(e instanceof Error ? e.message : "No se pudo deshacer.")); },
      } : undefined);
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo guardar. Vuelve a intentarlo."); }
    finally { setOcupado(false); }
  }

  function cobrar() {
    const n = montoANumero(monto);
    if (!(n > 0)) { setError("Escribe cuánto se cobró."); return; }
    if (n > falta + 0.001) { setError(`No se puede cobrar más de lo que falta (${dinero(falta, m.moneda)}).`); return; }
    const previo = { cobrado: m.cobrado, formaPago: m.formaPago };
    void hacer({ accion: "cobrar", version: m.version, monto: n, formaPago: forma },
      n >= falta ? `Cobrado completo: ${dinero(m.monto, m.moneda)}` : `Cobro de ${dinero(n, m.moneda)} registrado`,
      (nuevo) => ({ accion: "reabrir", version: nuevo.version, cobrado: previo.cobrado, formaPago: previo.formaPago }));
  }

  async function agregarComprobante(f: File) {
    if (ocupado) return;
    setOcupado(true); setError(null);
    try {
      const ticket = await subirComprobante(f);
      alCambiar(await cambiarMovimiento(m.id, { accion: "comprobante", version: m.version, ticket }));
      avisar("Comprobante guardado");
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo guardar el comprobante."); }
    finally { setOcupado(false); }
  }

  async function verComprobante() {
    // La ventana se abre en el clic (sin bloqueo del navegador) y luego recibe la URL firmada.
    const ventana = window.open("", "_blank");
    try {
      const url = await abrirComprobante(m.id);
      if (ventana) { ventana.opener = null; ventana.location.href = url; } else window.location.assign(url);
    } catch (e) { ventana?.close(); setError(e instanceof Error ? e.message : "No se pudo abrir el comprobante."); }
  }

  const cerrado = m.estado !== "pendiente";
  const apartado = m.tipo === "apartado";
  const lineas: { k: string; v: string; aviso?: boolean }[] = [
    { k: "Total", v: dinero(m.monto, m.moneda) },
    ...(!apartado ? [{ k: "Ya cobrado", v: dinero(m.cobrado, m.moneda) }] : []),
    ...(!apartado ? [{ k: "Vence", v: m.venceEl ? diaLargo(m.venceEl) : "Sin fecha" }] : []),
    ...(m.concepto ? [{ k: "Concepto", v: m.concepto }] : []),
    ...(m.formaPago && !apartado ? [{ k: "Forma de pago", v: FORMAS_PAGO.find((f) => f.valor === m.formaPago)?.etiqueta ?? m.formaPago }] : []),
    { k: "Anotado", v: fecha(m.creadoEl) },
    ...(cerrado && m.liquidadoEl ? [{ k: apartado ? "Entregado" : "Cerrado", v: fecha(m.liquidadoEl) }] : []),
  ];
  const cifra = cerrado ? { etiqueta: ESTADO_CERRADO[m.estado as keyof typeof ESTADO_CERRADO], valor: m.monto }
    : apartado ? { etiqueta: "En resguardo", valor: m.monto } : { etiqueta: "Falta cobrar", valor: falta };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 4 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-muted)" }}>{NOMBRE_TIPO[m.tipo]}</span>
      <div className="pn-din-big">
        <span className="pn-din-sl">{cifra.etiqueta}</span>
        <span className="pn-din-dv">{dinero(cifra.valor, m.moneda)}</span>
      </div>
      <Tarjeta className="pn-din-lineas">
        {lineas.map((l) => <div key={l.k} className="pn-din-ln"><span>{l.k}</span><span>{l.v}</span></div>)}
      </Tarjeta>

      {apartado || m.comprobante ? (
        <div className="pn-din-archivo">
          <span className={m.comprobante ? undefined : "pn-tono-aviso"}>{m.comprobante ? `Comprobante: ${m.comprobante.nombre}` : "Falta el comprobante"}</span>
          {m.comprobante
            ? <Boton variante="secundario" onClick={() => void verComprobante()}>Ver</Boton>
            : <Boton variante="secundario" deshabilitado={ocupado} onClick={() => entrada.current?.click()}>Subir comprobante</Boton>}
          <input ref={entrada} type="file" accept={TIPOS_COMPROBANTE.join(",")} hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void agregarComprobante(f); }} />
        </div>
      ) : null}

      {!cerrado && apartado ? (
        <Boton bloque style={{ minHeight: 48 }} deshabilitado={ocupado}
          onClick={() => void hacer({ accion: "entregar", version: m.version }, "Apartado entregado: pasó al historial", (nuevo) => ({ accion: "reabrir", version: nuevo.version }))}>
          Registrar entrega
        </Boton>
      ) : null}

      {!cerrado && !apartado ? (
        <form onSubmit={(e) => { e.preventDefault(); cobrar(); }} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h3 className="pn-grupo" style={{ margin: 0 }}>Registrar cobro</h3>
          <div ref={campoMonto}>
            <Campo etiqueta="Monto cobrado" dinero inputMode="decimal" value={monto} onChange={(e) => setMonto(formatoMonto(e.target.value))} autoComplete="off"
              ayuda={m.cobrado > 0 ? `Falta ${dinero(falta, m.moneda)} de ${dinero(m.monto, m.moneda)}` : "Puede ser un cobro parcial."} />
          </div>
          <Desplegable etiqueta="Forma de pago" valor={forma} alElegir={(v) => { if (v) setForma(v); }} opciones={FORMAS_PAGO} />
          <Boton type="submit" bloque style={{ minHeight: 48 }} deshabilitado={ocupado} aria-keyshortcuts="P">Registrar cobro</Boton>
        </form>
      ) : null}

      {cerrado && apartado ? (
        <Boton variante="secundario" deshabilitado={ocupado}
          onClick={() => void hacer({ accion: "reabrir", version: m.version }, "El apartado volvió a «Por entregar»")}>
          Regresar a «Por entregar»
        </Boton>
      ) : null}

      {error ? <p role="alert" className="pn-tono-error" style={{ margin: 0, fontSize: 14 }}>{error}</p> : null}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {asunto ? <a className="pn-btn pn-btn-secundario" href={`/panel/asuntos?ver=${encodeURIComponent(asunto.id)}`}>Abrir el asunto</a> : null}
        <Boton variante="texto" deshabilitado={ocupado}
          onClick={() => void hacer({ accion: "quitar", version: m.version }, "Movimiento quitado", (nuevo) => ({ accion: "restaurar", version: nuevo.version }))}>
          Quitar
        </Boton>
      </div>
    </div>
  );
}
