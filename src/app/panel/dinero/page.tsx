"use client";
import { useEffect, useMemo, useState } from "react";

import { useColeccion } from "@/components/panel/datos/use-coleccion";
import { useLoLleva } from "@/components/panel/datos/lo-lleva";
import { DetalleCobro } from "@/components/panel/dinero/detalle-cobro";
import { Cargando, EstadoError, Vacio } from "@/components/panel/kit/estados";
import { Fila, GrupoLista } from "@/components/panel/kit/lista";
import { Segmentado } from "@/components/panel/kit/segmentado";
import { HojaAdaptable } from "@/components/panel/ui/hoja-adaptable";
import type { Property } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import { aTexto, diaLargo } from "@/lib/panel/calendario";
import { filasAsuntos, type Expediente } from "@/lib/panel/datos/asuntos";
import { leerExpedientes, leerMiAsesor } from "@/lib/panel/datos/colecciones";
import type { Asesor } from "@/lib/domain/records";
import {
  cierresSinComision, cobradosCompletos, comisionDe, dinero, historial, ladoMenor, lineaCobro, pendientesDeCobro, porCobrar, sumaCobrada, sumaFalta,
  type Cobro,
} from "@/lib/panel/datos/dinero";
import { leerCobros } from "@/lib/panel/datos/dinero-lectura";

type Pestana = "deben" | "entregar" | "historial";

/**
 * Dinero (PN-08, primer corte, solo lectura): qué le deben a Fortius y qué se ha cobrado, con lo que ya existe en la base.
 * Te deben = comisión estimada del cierre del asunto menos los recibos 18 emitidos. Historial = recibos 18.
 * Por entregar, gastos por reembolsar, vencimientos y «Registrar cobro» esperan la tabla de movimientos (migración pendiente).
 */
export default function Dinero() {
  const [estado, setEstado] = useState<{ cargando: boolean; error: string | null; expedientes: Expediente[]; cobros: Cobro[] }>({ cargando: true, error: null, expedientes: [], cobros: [] });
  const [intento, setIntento] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    Promise.all([leerExpedientes<Expediente>(c.signal), leerCobros(c.signal)]).then(
      ([expedientes, cobros]) => setEstado({ cargando: false, error: null, expedientes, cobros }),
      (e: unknown) => { if (!(e instanceof DOMException && e.name === "AbortError")) setEstado({ cargando: false, error: e instanceof Error ? e.message : "No se pudo cargar.", expedientes: [], cobros: [] }); },
    );
    return () => c.abort();
  }, [intento]);
  const personas = useColeccion<Cliente>("clientes");
  const inmuebles = useColeccion<Property>("propiedades");
  const [hoy] = useState(() => aTexto(new Date()));
  const asuntos = useMemo(() => filasAsuntos(estado.expedientes, { personas: personas.datos, inmuebles: inmuebles.datos, tareas: [], hoy }), [estado.expedientes, personas.datos, inmuebles.datos, hoy]);
  // «Lo lleva» (PN-10): el director filtra por el asesor del asunto de cada cobro; el asesor ya ve solo lo suyo (RLS).
  const asesores = useColeccion<Asesor>("asesores");
  const [miAsesor, setMiAsesor] = useState<string | null>(null);
  useEffect(() => { const c = new AbortController(); leerMiAsesor(c.signal).then(setMiAsesor); return () => c.abort(); }, []);
  const asesorDe = useMemo(() => new Map(estado.expedientes.map((e) => [e.id, e.asesor_id])), [estado.expedientes]);
  const conDinero = useMemo(() => {
    const ids = new Set([...estado.cobros.map((c) => c.expedienteId), ...estado.expedientes.filter((e) => comisionDe(e) !== null).map((e) => e.id)]);
    return [...ids].map((id) => asesorDe.get(id));
  }, [estado.cobros, estado.expedientes, asesorDe]);
  const loLleva = useLoLleva(conDinero, miAsesor, asesores.datos);
  const expedientes = useMemo(() => estado.expedientes.filter((e) => loLleva.pasa(e.asesor_id)), [estado.expedientes, loLleva]);
  const cobrosDeLista = useMemo(() => estado.cobros.filter((c) => loLleva.pasa(asesorDe.get(c.expedienteId))), [estado.cobros, loLleva, asesorDe]);
  const filas = useMemo(() => porCobrar(expedientes, asuntos, cobrosDeLista), [expedientes, asuntos, cobrosDeLista]);
  const pendientes = pendientesDeCobro(filas);
  const completos = cobradosCompletos(filas);
  const sinComision = cierresSinComision(expedientes);
  const cobros = useMemo(() => historial(cobrosDeLista), [cobrosDeLista]);
  const titulo = (id: string) => asuntos.find((a) => a.id === id);

  const [ver, setVer] = useState<Pestana>("deben");
  const [abierto, setAbierto] = useState<string | null>(null);
  const elegido = filas.find((f) => f.asuntoId === abierto) ?? null;

  // J y K recorren Te deben. No actúan mientras se escribe ni con una hoja abierta.
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented || ver !== "deben" || !pendientes.length) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.closest("[role=dialog]:not([data-lateral])"))) return;
      const k = e.key.toLowerCase();
      if (k !== "j" && k !== "k") return;
      e.preventDefault();
      const i = pendientes.findIndex((f) => f.asuntoId === abierto);
      const sig = k === "j" ? (i + 1) % pendientes.length : (i <= 0 ? pendientes.length - 1 : i - 1);
      setAbierto(pendientes[sig].asuntoId);
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [abierto, pendientes, ver]);

  const cifra = ver === "deben" ? dinero(sumaFalta(pendientes)) : ver === "historial" ? dinero(sumaCobrada(cobrosDeLista)) : "—";
  const contexto = ver === "deben"
    ? pendientes.length ? `por cobrar en ${pendientes.length} ${pendientes.length === 1 ? "asunto" : "asuntos"}` : "nada por cobrar"
    : ver === "historial" ? `cobrado con ${cobros.filter((c) => c.emitido).length} ${cobros.filter((c) => c.emitido).length === 1 ? "recibo entregado" : "recibos entregados"}` : "Todavía no se registran apartados";

  return (
    <div className="pn-pagina" style={{ maxWidth: 760 }}>
      <h1 className="pn-h1">Dinero</h1>
      <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 140px" }}>
            <Segmentado etiqueta="Ver" valor={ver} alElegir={(v) => { setVer(v); setAbierto(null); }} opciones={[
              { valor: "deben", etiqueta: "Te deben", cuenta: pendientes.length },
              { valor: "entregar", etiqueta: "Por entregar" },
              { valor: "historial", etiqueta: "Historial", cuenta: cobros.length },
            ]} />
          </div>
          {loLleva.control ? <div style={{ flex: "1 1 140px" }}>{loLleva.control}</div> : null}
        </div>
        {estado.cargando ? null : (
          <div aria-live="polite">
            <p style={{ margin: 0, fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{cifra}</p>
            <p className="pn-sub" style={{ margin: 0 }}>{contexto}</p>
          </div>
        )}
      </div>
      <div style={{ display: "grid", gap: 20, marginTop: 20 }}>
        {estado.cargando ? <Cargando lineas={4} etiqueta="Cargando el dinero" /> : null}
        {estado.error ? <EstadoError texto={estado.error} alReintentar={() => { setEstado((s) => ({ ...s, cargando: true, error: null })); setIntento((n) => n + 1); }} /> : null}
        {!estado.cargando && !estado.error && ver === "deben" ? (
          <>
            {pendientes.length ? (
              <GrupoLista titulo="Sin fecha de cobro">
                {pendientes.map((f) => (
                  <Fila key={f.asuntoId} alPulsar={() => setAbierto(f.asuntoId)} seleccionada={f.asuntoId === abierto}
                    titulo={f.titulo} subtitulo={[f.folio, "Comisión"].filter(Boolean).join(" · ")}
                    detalle={f.enDolares ? "Tiene recibos en dólares: revisa el saldo" : undefined} tonoDetalle={f.enDolares ? "aviso" : "normal"}
                    lado={dinero(f.falta)} ladoMenor={ladoMenor(f)} />
                ))}
              </GrupoLista>
            ) : <Vacio titulo="Nadie te debe, por ahora" texto={loLleva.activo ? "Nada por cobrar de quien elegiste en «Lo lleva»." : "Aquí ves la comisión de cada asunto cerrado, menos lo que ya te pagaron con recibo entregado."} icono="precio" />}
            {completos.length ? (
              <GrupoLista titulo="Cobrados completos">
                {completos.map((f) => <Fila key={f.asuntoId} alPulsar={() => setAbierto(f.asuntoId)} titulo={f.titulo} subtitulo={f.folio} lado={dinero(f.total)} ladoMenor="cobrado" />)}
              </GrupoLista>
            ) : null}
            {sinComision ? <p style={{ margin: 0, color: "var(--warning)" }}>{sinComision === 1 ? "1 asunto llegó al cierre sin comisión anotada" : `${sinComision} asuntos llegaron al cierre sin comisión anotada`}: anota la comisión en el cierre del asunto para verla aquí.</p> : null}
            <p className="pn-sub" style={{ margin: 0 }}>Por ahora los cobros no llevan fecha límite. Pronto verás aquí también los gastos que Fortius pagó por el propietario.</p>
          </>
        ) : null}
        {!estado.cargando && !estado.error && ver === "entregar" ? (
          <Vacio titulo="No hay apartados registrados" icono="llave"
            texto="Aquí verás lo que toca entregar al propietario, como un apartado que recibiste. Todavía no hay forma de registrarlo." />
        ) : null}
        {!estado.cargando && !estado.error && ver === "historial" ? (
          cobros.length ? (
            <GrupoLista>
              {cobros.map((c) => {
                const a = titulo(c.expedienteId);
                return (
                  <Fila key={c.id} href={`/panel/asuntos?ver=${encodeURIComponent(c.expedienteId)}`} titulo={a?.titulo ?? "Asunto"}
                    subtitulo={lineaCobro(c)} detalle={c.fecha ? diaLargo(c.fecha) : "Sin fecha de pago"} tonoDetalle={c.emitido ? "normal" : "aviso"}
                    lado={dinero(c.importe, c.moneda)} />
                );
              })}
            </GrupoLista>
          ) : <Vacio titulo="Todavía no hay cobros" texto="Cada recibo de honorarios que hagas en un asunto aparece aquí." icono="escritura" />
        ) : null}
      </div>
      <HojaAdaptable abierta={elegido !== null} titulo={elegido?.titulo ?? "Cobro"} descripcion="Lo que falta, lo cobrado y de dónde sale." alCerrar={() => setAbierto(null)}>
        {elegido ? <DetalleCobro fila={elegido} /> : null}
      </HojaAdaptable>
    </div>
  );
}
