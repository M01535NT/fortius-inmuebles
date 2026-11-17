"use client";
import { useEffect, useRef, useState } from "react";

import { Boton } from "@/components/panel/kit/boton";
import { Campo, formatoMonto, montoANumero } from "@/components/panel/kit/campo";
import { Desplegable } from "@/components/panel/kit/desplegable";
import { Hoja } from "@/components/panel/kit/hoja";
import type { Moneda } from "@/lib/panel/datos/dinero";
import {
  crearMovimiento, subirComprobante, TIPOS_COMPROBANTE, type Movimiento, type TipoMovimiento,
} from "@/lib/panel/datos/movimientos";

type OpcionAsunto = { valor: string; etiqueta: string };

/**
 * «Movimiento nuevo» del boceto: Tipo, Asunto, Monto, Concepto y, salvo en apartados, Vence (sin fecha, 7 o 30 días).
 * El apartado lleva su comprobante (DEC-56): se sube como privado y el servidor lo guarda junto al movimiento.
 * Sin comprobante también se guarda (DEC-61: nada frena), con el aviso de que falta.
 * `sinServidor`: la tabla todavía no existe; el formulario se ve y explica por qué no guarda.
 */
export function MovimientoNuevo({ abierta, alCerrar, asuntos, sinServidor, alGuardar }: {
  abierta: boolean; alCerrar: () => void; asuntos: readonly OpcionAsunto[]; sinServidor: boolean; alGuardar: (m: Movimiento) => void;
}) {
  const [tipo, setTipo] = useState<TipoMovimiento>("comision");
  const [asunto, setAsunto] = useState("");
  const [monto, setMonto] = useState("");
  const [moneda, setMoneda] = useState<Moneda>("MXN");
  const [concepto, setConcepto] = useState("");
  const [vence, setVence] = useState<"0" | "7" | "30">("0");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const entrada = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (abierta) return;
    setTipo("comision"); setAsunto(""); setMonto(""); setMoneda("MXN"); setConcepto(""); setVence("0"); setArchivo(null); setError(null);
  }, [abierta]);

  const cantidad = montoANumero(monto);
  const falta = !asunto ? "Elige el asunto." : !(cantidad > 0) ? "Escribe el monto." : null;

  async function guardar() {
    if (guardando || sinServidor) return;
    if (falta) { setError(falta); return; }
    setGuardando(true); setError(null);
    try {
      const ticket = tipo === "apartado" && archivo ? await subirComprobante(archivo) : undefined;
      const m = await crearMovimiento({ tipo, asuntoId: asunto, monto: cantidad, moneda, concepto: concepto.trim(), vence: tipo === "apartado" ? "0" : vence, ticket });
      alGuardar(m);
      alCerrar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar. Vuelve a intentarlo.");
    } finally { setGuardando(false); }
  }

  return (
    <Hoja abierta={abierta} titulo="Movimiento nuevo" alCerrar={alCerrar}>
      <form onSubmit={(e) => { e.preventDefault(); void guardar(); }} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <p className="pn-sub" style={{ margin: "-6px 0 0" }}>Anota algo que te deben o dinero que tienes en resguardo.</p>
        <Desplegable etiqueta="Tipo" valor={tipo} alElegir={(v) => { if (v) setTipo(v); }} opciones={[
          { valor: "comision", etiqueta: "Comisión" }, { valor: "gasto", etiqueta: "Gasto por reembolsar" }, { valor: "apartado", etiqueta: "Apartado" },
        ]} />
        <Desplegable etiqueta="Asunto" valor={asunto} vacio="Elige el asunto" alElegir={setAsunto} opciones={asuntos}
          ayuda={asuntos.length ? undefined : "Todavía no hay asuntos. Crea uno en Asuntos para anotar su dinero."} />
        <Campo etiqueta="Monto" dinero inputMode="decimal" value={monto} onChange={(e) => setMonto(formatoMonto(e.target.value))} autoComplete="off" />
        <Desplegable etiqueta="Moneda" valor={moneda} alElegir={(v) => { if (v) setMoneda(v); }} opciones={[
          { valor: "MXN", etiqueta: "Pesos" }, { valor: "USD", etiqueta: "Dólares" },
        ]} />
        <Campo etiqueta="Concepto (opcional)" value={concepto} maxLength={300} onChange={(e) => setConcepto(e.target.value)} autoComplete="off" />
        {tipo !== "apartado" ? (
          <Desplegable etiqueta="Vence" valor={vence} alElegir={(v) => { if (v) setVence(v); }} opciones={[
            { valor: "0", etiqueta: "Sin fecha" }, { valor: "7", etiqueta: "En 7 días" }, { valor: "30", etiqueta: "En 30 días" },
          ]} />
        ) : (
          <div className="pn-campo">
            <span className="pn-din-etq">Comprobante</span>
            <input ref={entrada} type="file" accept={TIPOS_COMPROBANTE.join(",")} hidden onChange={(e) => setArchivo(e.target.files?.[0] ?? null)} />
            <div className="pn-din-archivo">
              <span className={archivo ? undefined : "pn-tono-aviso"}>{archivo ? archivo.name : "Falta el comprobante"}</span>
              <Boton variante="secundario" onClick={() => entrada.current?.click()}>{archivo ? "Cambiar" : "Subir comprobante"}</Boton>
            </div>
            <span className="pn-campo-ayuda">PDF o foto del depósito o del recibo. Se guarda privado: no sale en el sitio.</span>
          </div>
        )}
        {error ? <p role="alert" className="pn-tono-error" style={{ margin: 0, fontSize: 14 }}>{error}</p> : null}
        <Boton type="submit" bloque deshabilitado={sinServidor || guardando} aria-describedby={sinServidor ? "mov-nuevo-ayuda" : undefined} style={{ minHeight: 48 }}>
          {guardando ? "Guardando…" : "Agregar"}
        </Boton>
        {sinServidor ? (
          <span id="mov-nuevo-ayuda" className="pn-campo-ayuda">Guardar movimientos se activa al publicar el panel nuevo. Por ahora, un cobro de comisión se anota con el recibo de honorarios del asunto, en Formatos.</span>
        ) : null}
      </form>
    </Hoja>
  );
}
