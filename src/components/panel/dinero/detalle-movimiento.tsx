"use client";
import { useEffect, useRef, useState } from "react";

import { Icono } from "@/components/panel/icons";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Boton } from "@/components/panel/kit/boton";
import { Campo, formatoMonto, montoANumero } from "@/components/panel/kit/campo";
import { Desplegable } from "@/components/panel/kit/desplegable";
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
export function DetalleMovimiento({ m, alCambiar, pedirCobro }: {
  m: Movimiento; alCambiar: (m: Movimiento) => void; pedirCobro: number;
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
    <>
      <section className="fm-grupo" aria-label={NOMBRE_TIPO[m.tipo]}>
        <div className="fm-t">{NOMBRE_TIPO[m.tipo]}</div>
        <div className="fm-card">
          <div className="fm-big"><span>{cifra.etiqueta}</span><b>{dinero(cifra.valor, m.moneda)}</b></div>
          {lineas.map((l) => <div key={l.k} className="fm-dato"><span className="fm-k">{l.k}</span><b className="fm-num">{l.v}</b></div>)}
          {apartado || m.comprobante ? (
            <div className="fm-dato">
              <span className="fm-k">Comprobante</span>
              <span className={m.comprobante ? "fm-v" : "fm-v pn-tono-aviso"}>{m.comprobante ? m.comprobante.nombre : "Falta el comprobante"}</span>
              {m.comprobante
                ? <button type="button" className="as-btn din-mini" onClick={() => void verComprobante()}>Ver</button>
                : <button type="button" className="as-btn din-mini" aria-disabled={ocupado || undefined} onClick={() => { if (!ocupado) entrada.current?.click(); }}><Icono nombre="subir" tamano={14} />Subir comprobante</button>}
              <input ref={entrada} type="file" accept={TIPOS_COMPROBANTE.join(",")} hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void agregarComprobante(f); }} />
            </div>
          ) : null}
        </div>
      </section>

      {!cerrado && apartado ? (
        <div className="din-acciones">
          <Boton deshabilitado={ocupado}
            onClick={() => void hacer({ accion: "entregar", version: m.version }, "Apartado entregado: pasó al historial", (nuevo) => ({ accion: "reabrir", version: nuevo.version }))}>
            Registrar entrega
          </Boton>
        </div>
      ) : null}

      {!cerrado && !apartado ? (
        <form className="fm-grupo" aria-label="Registrar cobro" onSubmit={(e) => { e.preventDefault(); cobrar(); }}>
          <div className="fm-t">Registrar cobro</div>
          <div className="fm-card fm-form">
            <div ref={campoMonto}>
              <Campo etiqueta="Monto cobrado" dinero inputMode="decimal" value={monto} onChange={(e) => setMonto(formatoMonto(e.target.value))} autoComplete="off"
                ayuda={m.cobrado > 0 ? `Falta ${dinero(falta, m.moneda)} de ${dinero(m.monto, m.moneda)}` : "Puede ser un cobro parcial."} />
            </div>
            <Desplegable etiqueta="Forma de pago" valor={forma} alElegir={(v) => { if (v) setForma(v); }} opciones={FORMAS_PAGO} />
          </div>
          <div className="din-acciones"><Boton type="submit" deshabilitado={ocupado} aria-keyshortcuts="P">Registrar cobro</Boton></div>
        </form>
      ) : null}

      {error ? <p role="alert" className="pn-tono-error din-error">{error}</p> : null}

      <div className="din-acciones">
        {cerrado && apartado ? (
          <Boton variante="normal" deshabilitado={ocupado}
            onClick={() => void hacer({ accion: "reabrir", version: m.version }, "El apartado volvió a «Por entregar»")}>
            Regresar a «Por entregar»
          </Boton>
        ) : null}
        <button type="button" className="as-btn as-gho din-mini" aria-disabled={ocupado || undefined}
          onClick={() => { if (!ocupado) void hacer({ accion: "quitar", version: m.version }, "Movimiento quitado", (nuevo) => ({ accion: "restaurar", version: nuevo.version })); }}>
          <Icono nombre="bote" tamano={14} />Quitar
        </button>
      </div>
    </>
  );
}
