"use client";
import { useEffect, useMemo, useState } from "react";

import { useColeccion } from "@/components/panel/datos/use-coleccion";
import { useLoLleva } from "@/components/panel/datos/lo-lleva";
import { DetalleCobro } from "@/components/panel/dinero/detalle-cobro";
import { DetalleMovimiento } from "@/components/panel/dinero/detalle-movimiento";
import { MovimientoNuevo } from "@/components/panel/dinero/movimiento-nuevo";
import "@/components/panel/dinero/dinero.css";
import { Gesto } from "@/components/panel/icons";
import { Cargando, EstadoError } from "@/components/panel/kit/estados";
import { Fila, GrupoLista } from "@/components/panel/kit/lista";
import { Segmentado } from "@/components/panel/kit/segmentado";
import { MaestroDetalle, PieAtajos } from "@/components/panel/fichas/piezas";
import type { Property } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import { aTexto, diaLargo } from "@/lib/panel/calendario";
import { filasAsuntos, type Expediente } from "@/lib/panel/datos/asuntos";
import { leerExpedientes, leerMiAsesor } from "@/lib/panel/datos/colecciones";
import type { Asesor } from "@/lib/domain/records";
import {
  cierresSinComision, cobradosCompletos, comisionDe, dinero, historial, ladoMenor, lineaCobro, pendientesDeCobro, porCobrar, sumaCobrada, sumaFalta,
  type Cobro, type PorCobrar,
} from "@/lib/panel/datos/dinero";
import { leerCobros } from "@/lib/panel/datos/dinero-lectura";
import {
  cerrados, faltaDe, leerMovimientos, NOMBRE_TIPO, plazoDe, porCobrarSueltos, porEntregar, sinMovimientosEnServidor, sumaPor,
  type Movimiento, type Plazo,
} from "@/lib/panel/datos/movimientos";

type Pestana = "deben" | "entregar" | "historial";
type FilaDeben = { clave: string; plazo: Plazo; falta: number } & ({ clase: "cierre"; f: PorCobrar } | { clase: "mov"; m: Movimiento });

/**
 * Dinero (PN-08), como el boceto: cabecera con «Movimiento nuevo», la cifra grande del resumen, el selector
 * (Te deben, Por entregar, Historial) y los grupos. El detalle se abre al lado en escritorio y abajo en el teléfono.
 * Te deben = comisión estimada del cierre del asunto menos los recibos 18 emitidos (DEC-53), más las comisiones sueltas y
 * los gastos por reembolsar de la tabla de movimientos, agrupados en Vencido, Esta semana y Después.
 * Por entregar = apartados en resguardo (DEC-56); «Registrar entrega» los pasa al Historial.
 * Historial = movimientos cerrados y recibos 18. Si la tabla de movimientos aún no está en el servidor (503),
 * la pantalla lo dice y sigue con las comisiones del cierre.
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
  // Movimientos (PN-08) aparte: un 503 (tabla sin aplicar) no tumba las comisiones del cierre.
  const [movs, setMovs] = useState<{ lista: Movimiento[]; sinServidor: boolean; error: string | null }>({ lista: [], sinServidor: false, error: null });
  const [intentoMovs, setIntentoMovs] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    leerMovimientos(c.signal).then(
      (lista) => setMovs({ lista, sinServidor: false, error: null }),
      (e: unknown) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        if (sinMovimientosEnServidor(e)) setMovs({ lista: [], sinServidor: true, error: null });
        else setMovs({ lista: [], sinServidor: false, error: e instanceof Error ? e.message : "No se pudieron cargar los movimientos." });
      },
    );
    return () => c.abort();
  }, [intento, intentoMovs]);
  const alCambiar = (m: Movimiento) => setMovs((s) => ({ ...s, lista: s.lista.some((x) => x.id === m.id) ? s.lista.map((x) => (x.id === m.id ? m : x)) : [m, ...s.lista] }));

  const personas = useColeccion<Cliente>("clientes");
  const inmuebles = useColeccion<Property>("propiedades");
  const [hoy] = useState(() => aTexto(new Date()));
  const asuntos = useMemo(() => filasAsuntos(estado.expedientes, { personas: personas.datos, inmuebles: inmuebles.datos, tareas: [], hoy }), [estado.expedientes, personas.datos, inmuebles.datos, hoy]);
  // «Lo lleva» (PN-10): el director filtra por el asesor del asunto de cada cobro, o por el responsable del movimiento;
  // el asesor ya ve solo lo suyo (RLS).
  const asesores = useColeccion<Asesor>("asesores");
  const [miAsesor, setMiAsesor] = useState<string | null>(null);
  useEffect(() => { const c = new AbortController(); leerMiAsesor(c.signal).then(setMiAsesor); return () => c.abort(); }, []);
  const asesorDe = useMemo(() => new Map(estado.expedientes.map((e) => [e.id, e.asesor_id])), [estado.expedientes]);
  const conDinero = useMemo(() => {
    const ids = new Set([...estado.cobros.map((c) => c.expedienteId), ...estado.expedientes.filter((e) => comisionDe(e) !== null).map((e) => e.id)]);
    return [...[...ids].map((id) => asesorDe.get(id)), ...movs.lista.map((m) => m.responsableId)];
  }, [estado.cobros, estado.expedientes, asesorDe, movs.lista]);
  const loLleva = useLoLleva(conDinero, miAsesor, asesores.datos);
  const expedientes = useMemo(() => estado.expedientes.filter((e) => loLleva.pasa(e.asesor_id)), [estado.expedientes, loLleva]);
  const cobrosDeLista = useMemo(() => estado.cobros.filter((c) => loLleva.pasa(asesorDe.get(c.expedienteId))), [estado.cobros, loLleva, asesorDe]);
  const filas = useMemo(() => porCobrar(expedientes, asuntos, cobrosDeLista), [expedientes, asuntos, cobrosDeLista]);
  const pendientes = useMemo(() => pendientesDeCobro(filas), [filas]);
  const completos = cobradosCompletos(filas);
  const sinComision = cierresSinComision(expedientes);
  const cobros = useMemo(() => historial(cobrosDeLista), [cobrosDeLista]);
  const titulo = (id: string) => asuntos.find((a) => a.id === id)?.titulo ?? "Asunto";

  const movsDeLista = useMemo(() => movs.lista.filter((m) => loLleva.pasa(m.responsableId)), [movs.lista, loLleva]);
  const sueltos = useMemo(() => porCobrarSueltos(movsDeLista), [movsDeLista]);
  const apartados = useMemo(() => porEntregar(movsDeLista), [movsDeLista]);
  const movsCerrados = useMemo(() => cerrados(movsDeLista), [movsDeLista]);
  // Te deben, en el orden del boceto: Vencido, Esta semana y Después. Las comisiones del cierre no tienen fecha: Después.
  const filasDeben = useMemo<FilaDeben[]>(() => [
    ...sueltos.map((m) => ({ clave: `m:${m.id}`, plazo: plazoDe(m.venceEl, hoy), falta: faltaDe(m), clase: "mov" as const, m })),
    ...pendientes.map((f) => ({ clave: `c:${f.asuntoId}`, plazo: "despues" as const, falta: f.falta, clase: "cierre" as const, f })),
  ], [sueltos, pendientes, hoy]);
  const vencidos = filasDeben.filter((f) => f.plazo === "vencido").length;

  const [ver, setVer] = useState<Pestana>("deben");
  // Lo abierto: «c:<asunto>» (comisión del cierre) o «m:<movimiento>».
  const [abierto, setAbierto] = useState<string | null>(null);
  const [nuevo, setNuevo] = useState(false);
  const [pedirCobro, setPedirCobro] = useState(0);
  const elegido = abierto?.startsWith("c:") ? filas.find((f) => f.asuntoId === abierto.slice(2)) ?? null : null;
  const movElegido = abierto?.startsWith("m:") ? movs.lista.find((m) => m.id === abierto.slice(2) && !m.eliminado) ?? null : null;
  const navegables = useMemo(() => (ver === "deben" ? filasDeben.map((f) => f.clave) : ver === "entregar" ? apartados.map((m) => `m:${m.id}`) : []), [ver, filasDeben, apartados]);

  // J y K recorren la lista; P registra el cobro; N abre «Movimiento nuevo». No actúan mientras se escribe ni con una hoja abierta.
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented || nuevo) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.closest("[role=dialog]:not([data-lateral])"))) return;
      const k = e.key.toLowerCase();
      if (k === "n") { e.preventDefault(); setNuevo(true); return; }
      if (k === "p" && elegido && elegido.falta > 0) { e.preventDefault(); window.location.assign(`/panel/formatos?asunto=${encodeURIComponent(elegido.asuntoId)}&formato=18`); return; }
      if (k === "p" && movElegido && movElegido.tipo !== "apartado" && movElegido.estado === "pendiente") { e.preventDefault(); setPedirCobro((n) => n + 1); return; }
      if ((k !== "j" && k !== "k") || !navegables.length) return;
      e.preventDefault();
      const i = abierto ? navegables.indexOf(abierto) : -1;
      const sig = k === "j" ? (i + 1) % navegables.length : (i <= 0 ? navegables.length - 1 : i - 1);
      setAbierto(navegables[sig]);
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [abierto, navegables, nuevo, elegido, movElegido]);

  // Pesos y dólares por separado, sin convertir (DEC-53): la cifra grande en pesos; los dólares, en la línea de abajo.
  const enDolares = sumaCobrada(cobrosDeLista, "USD") + sumaPor(movsCerrados.filter((m) => m.tipo !== "apartado"), "USD", (m) => m.monto);
  const emitidos = cobros.filter((c) => c.emitido).length;
  const aparte = (n: number) => (n > 0 ? `aparte, ${dinero(n, "USD")}` : "");
  const debenUsd = sumaPor(sueltos, "USD", faltaDe);
  const resguardoUsd = sumaPor(apartados, "USD", (m) => m.monto);
  const resumen = ver === "deben"
    ? {
      etiqueta: "Te deben", cifra: dinero(redondear(sumaFalta(pendientes) + sumaPor(sueltos, "MXN", faltaDe))),
      sub: filasDeben.length
        ? [`${filasDeben.length} ${filasDeben.length === 1 ? "cobro" : "cobros"}`, vencidos ? `${vencidos} ${vencidos === 1 ? "vencido" : "vencidos"}` : "nada vencido", aparte(debenUsd)].filter(Boolean).join(" · ")
        : "Todo cobrado",
    }
    : ver === "entregar"
      ? {
        etiqueta: "Tienes en resguardo", cifra: dinero(sumaPor(apartados, "MXN", (m) => m.monto)),
        sub: apartados.length ? [`${apartados.length} ${apartados.length === 1 ? "apartado" : "apartados"} por entregar`, aparte(resguardoUsd)].filter(Boolean).join(" · ") : "Nada por entregar",
      }
      : {
        etiqueta: "Cobrado", cifra: dinero(redondear(sumaCobrada(cobrosDeLista) + sumaPor(movsCerrados.filter((m) => m.tipo !== "apartado"), "MXN", (m) => m.monto))),
        sub: [`${emitidos} ${emitidos === 1 ? "recibo entregado" : "recibos entregados"}`, aparte(enDolares)].filter(Boolean).join(" · "),
      };
  const listo = !estado.cargando && !estado.error;
  const avisoMovs = movs.sinServidor
    ? <p className="pn-din-aviso" role="status">Los gastos por reembolsar y los apartados se guardan cuando se publique el panel nuevo. Por ahora aquí solo se ven las comisiones del cierre.</p>
    : movs.error ? <EstadoError texto={movs.error} alReintentar={() => setIntentoMovs((n) => n + 1)} /> : null;
  const opcionesAsunto = useMemo(() => asuntos.map((a) => ({ valor: a.id, etiqueta: [a.folio, a.titulo].filter(Boolean).join(" · ") })), [asuntos]);

  const lista = (
    <>
      <div className="fx-lista-cab">
        <div className="fx-titulo" data-chico="">
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <h1>Dinero</h1>
            <span className="fx-cuenta">Datos de ejemplo</span>
          </div>
          <button type="button" className="fx-icono-btn" onClick={() => setNuevo(true)} aria-label="Movimiento nuevo" title="Movimiento nuevo (N)" aria-keyshortcuts="N">
            <Gesto nombre="mas" tamano={20} />
          </button>
        </div>
        {estado.cargando ? null : (
          <div className="pn-din-suma" aria-live="polite">
            <span className="pn-din-sl">{resumen.etiqueta}</span>
            <span className="pn-din-sb">{resumen.cifra}</span>
            <span className="pn-din-ss">{resumen.sub}</span>
          </div>
        )}
        <Segmentado etiqueta="Ver" sinEtiqueta valor={ver} alElegir={(v) => { setVer(v); setAbierto(null); }} opciones={[
          { valor: "deben", etiqueta: "Te deben" },
          { valor: "entregar", etiqueta: "Por entregar" },
          { valor: "historial", etiqueta: "Historial" },
        ]} />
        {loLleva.control}
      </div>
      <div className="fx-lista-cuerpo" style={{ gap: 14 }}>
        {estado.cargando ? <Cargando lineas={4} etiqueta="Cargando el dinero" /> : null}
        {estado.error ? <EstadoError texto={estado.error} alReintentar={() => { setEstado((s) => ({ ...s, cargando: true, error: null })); setIntento((n) => n + 1); }} /> : null}
        {listo && ver === "deben" ? (
          <>
            {avisoMovs}
            {filasDeben.length ? (
              (["vencido", "semana", "despues"] as const).map((p) => {
                const grupo = filasDeben.filter((f) => f.plazo === p);
                if (!grupo.length) return null;
                return (
                  <GrupoLista key={p} titulo={p === "vencido" ? "Vencido" : p === "semana" ? "Esta semana" : "Después"}>
                    {grupo.map((g) => g.clase === "cierre" ? (
                      <Fila key={g.clave} alPulsar={() => setAbierto(g.clave)} seleccionada={g.clave === abierto}
                        titulo={g.f.titulo} subtitulo="Comisión por la venta"
                        detalle={g.f.cobradoDolares > 0 ? `Además cobrado en dólares: ${dinero(g.f.cobradoDolares, "USD")}` : "Sin fecha"} tonoDetalle={g.f.cobradoDolares > 0 ? "aviso" : "normal"}
                        lado={dinero(g.f.falta)} ladoMenor={ladoMenor(g.f)} />
                    ) : (
                      <Fila key={g.clave} alPulsar={() => setAbierto(g.clave)} seleccionada={g.clave === abierto}
                        titulo={titulo(g.m.asuntoId)} subtitulo={[NOMBRE_TIPO[g.m.tipo], g.m.concepto].filter(Boolean).join(" · ")}
                        detalle={venceTexto(g.m.venceEl, hoy)} tonoDetalle={g.plazo === "vencido" ? "error" : "normal"}
                        lado={dinero(g.falta, g.m.moneda)} ladoMenor={g.m.cobrado > 0 ? `de ${dinero(g.m.monto, g.m.moneda)}` : undefined} />
                    ))}
                  </GrupoLista>
                );
              })
            ) : <p className="pn-din-vacio">{loLleva.activo ? "Nadie te debe nada de quien elegiste en «Lo lleva»." : "Nadie te debe nada. Todo está cobrado."}</p>}
            {completos.length ? (
              <GrupoLista titulo="Cobrados completos">
                {completos.map((f) => (
                  <Fila key={f.asuntoId} alPulsar={() => setAbierto(`c:${f.asuntoId}`)} seleccionada={`c:${f.asuntoId}` === abierto}
                    titulo={f.titulo} subtitulo="Comisión por la venta" lado={dinero(f.total)} ladoMenor="cobrado" />
                ))}
              </GrupoLista>
            ) : null}
            {sinComision ? (
              <p style={{ margin: 0, fontSize: 14, color: "var(--warning)" }}>
                {sinComision === 1 ? "1 asunto llegó al cierre sin comisión anotada" : `${sinComision} asuntos llegaron al cierre sin comisión anotada`}: anótala en el cierre del asunto para verla aquí.
              </p>
            ) : null}
          </>
        ) : null}
        {listo && ver === "entregar" ? (
          <>
            {avisoMovs}
            {apartados.length ? (
              <GrupoLista>
                {apartados.map((m) => (
                  <Fila key={m.id} alPulsar={() => setAbierto(`m:${m.id}`)} seleccionada={`m:${m.id}` === abierto}
                    titulo={titulo(m.asuntoId)} subtitulo={["Apartado", m.concepto].filter(Boolean).join(" · ")}
                    detalle={m.comprobante ? `Recibido el ${diaLargo(m.creadoEl.slice(0, 10))}` : "Falta el comprobante"} tonoDetalle={m.comprobante ? "normal" : "aviso"}
                    lado={dinero(m.monto, m.moneda)} />
                ))}
              </GrupoLista>
            ) : movs.sinServidor || movs.error ? null : (
              <p className="pn-din-vacio">No hay apartados en resguardo. Cuando recibas uno, anótalo con «Movimiento nuevo» y su comprobante.</p>
            )}
          </>
        ) : null}
        {listo && ver === "historial" ? (
          cobros.length || movsCerrados.length ? (
            <>
              {movsCerrados.length ? (
                <GrupoLista titulo="Movimientos">
                  {movsCerrados.map((m) => (
                    <Fila key={m.id} alPulsar={() => setAbierto(`m:${m.id}`)} seleccionada={`m:${m.id}` === abierto}
                      titulo={`${m.tipo === "apartado" ? "Entrega" : NOMBRE_TIPO[m.tipo]} · ${titulo(m.asuntoId)}`}
                      subtitulo={[m.liquidadoEl ? diaLargo(m.liquidadoEl.slice(0, 10)) : "", m.tipo === "apartado" ? "entregado al propietario" : m.tipo === "gasto" ? "reembolsado" : "cobrado", m.concepto].filter(Boolean).join(" · ")}
                      derecha={<span className={m.tipo === "apartado" ? undefined : "pn-din-mas"} style={{ flex: "none", marginLeft: "auto", fontVariantNumeric: "tabular-nums" }}>{m.tipo === "apartado" ? "" : "+"}{dinero(m.monto, m.moneda)}</span>} />
                  ))}
                </GrupoLista>
              ) : null}
              {cobros.length ? (
                <GrupoLista titulo={movsCerrados.length ? "Recibos" : undefined}>
                  {cobros.map((c) => (
                    <Fila key={c.id} href={`/panel/asuntos?ver=${encodeURIComponent(c.expedienteId)}`} titulo={`Cobro · ${titulo(c.expedienteId)}`}
                      subtitulo={[c.fecha ? diaLargo(c.fecha) : "Sin fecha de pago", lineaCobro(c)].join(" · ")}
                      derecha={<span className={c.emitido ? "pn-din-mas" : "pn-tono-aviso"} style={{ flex: "none", marginLeft: "auto", fontVariantNumeric: "tabular-nums" }}>+{dinero(c.importe, c.moneda)}</span>} />
                  ))}
                </GrupoLista>
              ) : null}
            </>
          ) : <p className="pn-din-vacio">Todavía no hay cobros. Cada recibo de honorarios que hagas en un asunto aparece aquí.</p>
        ) : null}
      </div>
      <PieAtajos atajos={[[["J", "K"], "moverse"], [["P"], "registrar cobro"], [["N"], "nuevo"]]} />
    </>
  );

  return (
    <>
      <MaestroDetalle abierta={elegido !== null || movElegido !== null} ancho={440} bordeCuerpo lista={lista} volver={{ etiqueta: "Dinero", alPulsar: () => setAbierto(null) }}
        detalle={elegido ? (
          <div className="fx-detalle-in" data-angosta="">
            <h2 style={{ margin: "0 0 4px", fontSize: 22, lineHeight: 1.2, fontWeight: 600, overflowWrap: "anywhere" }}>{elegido.titulo}</h2>
            <DetalleCobro fila={elegido} />
          </div>
        ) : movElegido ? (
          <div className="fx-detalle-in" data-angosta="">
            <h2 style={{ margin: "0 0 4px", fontSize: 22, lineHeight: 1.2, fontWeight: 600, overflowWrap: "anywhere" }}>{titulo(movElegido.asuntoId)}</h2>
            <DetalleMovimiento key={movElegido.id} m={movElegido} pedirCobro={pedirCobro} alCambiar={alCambiar}
              asunto={{ id: movElegido.asuntoId, titulo: titulo(movElegido.asuntoId) }} />
          </div>
        ) : <div className="fx-nada">{estado.cargando ? "Cargando…" : "Elige un movimiento para verlo."}</div>} />
      <MovimientoNuevo abierta={nuevo} alCerrar={() => setNuevo(false)} asuntos={opcionesAsunto} sinServidor={movs.sinServidor}
        alGuardar={(m) => { alCambiar(m); setVer(m.tipo === "apartado" ? "entregar" : "deben"); setAbierto(`m:${m.id}`); }} />
    </>
  );
}

const redondear = (n: number) => Math.round(n * 100) / 100;

/** «Vence hoy», «Venció el …», «Vence el …» o «Sin fecha». */
function venceTexto(vence: string | null, hoy: string): string {
  if (!vence) return "Sin fecha";
  if (vence === hoy) return "Vence hoy";
  return vence < hoy ? `Venció el ${diaLargo(vence)}` : `Vence el ${diaLargo(vence)}`;
}
