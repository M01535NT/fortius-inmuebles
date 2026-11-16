"use client";
import { Suspense, useEffect, useMemo, useRef, useState, type DragEvent, type KeyboardEvent as TeclaReact } from "react";

import { useColeccion } from "@/components/panel/datos/use-coleccion";
import { useFichaEnDireccion } from "@/components/panel/datos/use-ficha-url";
import { FormularioCita } from "@/components/panel/agenda/formulario";
import { ComoTeFue, type RespuestaComoFue } from "@/components/panel/agenda/como-fue";
import { DiaLineaDeTiempo } from "@/components/panel/agenda/dia";
import { usePreferencia } from "@/components/panel/almacen";
import { Desplegable, DesplegableFecha } from "@/components/panel/kit/desplegable";
import { Interruptor } from "@/components/panel/kit/segmentado";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Gesto, Icono } from "@/components/panel/icons";
import { Boton } from "@/components/panel/kit/boton";
import { Relacionado } from "@/components/panel/kit/relacionado";
import { Cargando, EstadoError, Vacio } from "@/components/panel/kit/estados";
import { Ficha } from "@/components/panel/kit/ficha";
import { HojaAdaptable } from "@/components/panel/ui/hoja-adaptable";
import { Fila, GrupoLista } from "@/components/panel/kit/lista";
import type { Property } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import type { Evento, Lead } from "@/lib/domain/records";
import { relacionadoCita } from "@/lib/panel/datos/relacionado";
import { aTexto, diaLargo, horaTexto } from "@/lib/panel/calendario";
import { conFecha, conHora, correrFecha, horasParaMover } from "@/lib/panel/datos/agenda-dia";
import { tareasDeLaSemana, tareasPorFecha, textoSemana, type TareaDia } from "@/lib/panel/datos/agenda-semana";
import { datosDeCita, deHoraGuardada, editarCita, nuevaCita, seEmpalma, type DatosCita } from "@/lib/panel/datos/agenda-acciones";
import { anotarEnAsunto, leerExpedientes, leerMiAsesor, leerVencimientos } from "@/lib/panel/datos/colecciones";
import { nuevoSiguiente, type Expediente } from "@/lib/panel/datos/asuntos";
import type { ContratoServidor } from "@/lib/panel/datos/hoy";
import {
  anotarResultado, notaDeshecha, notaParaAsunto, pideComoFue, textoResultado, vencimientosEnDias, vencimientosPorFecha,
  type EventoConResultado, type VenceDia,
} from "@/lib/panel/datos/agenda-resultado";
import type { Task } from "@/lib/tasks";
import { citasDelDia, proximaFecha, semanaDesde, semanaEnLista, sumarDias, type FilaCita } from "@/lib/panel/datos/agenda";

import "./agenda.css";

type AsesorNombre = { id: string; nombre?: string };
/** Tipo de dato del arrastre de una cita (solo lo entiende la tira de días de esta página). */
const TIPO_ARRASTRE = "application/x-fortius-cita";

/**
 * Agenda (PN-04): la semana con sus citas y los vencimientos de contratos y licencia en su día; nueva cita (botón o N),
 * cambiarla y cancelarla con Deshacer. Una cita que ya pasó y no se anotó pregunta «¿Cómo te fue?».
 */
function Agenda() {
  const { cargando, error, datos: eventos, reintentar, guardar, borrar } = useColeccion<Evento>("eventos");
  // El esquema de `eventos` admite campos extra: aquí vive el resultado de «¿Cómo te fue?».
  const datos = eventos as EventoConResultado[];
  const tareas = useColeccion<Task>("tareas");
  // Asuntos (para ligar «lo que sigue») y vencimientos (fin del encargo y licencia), leídos una vez; si fallan, la agenda sigue.
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [vencen, setVencen] = useState<VenceDia[]>([]);
  useEffect(() => {
    const c = new AbortController();
    leerExpedientes<Expediente>(c.signal).then(setExpedientes, () => undefined);
    leerVencimientos<ContratoServidor>(c.signal).then((v) => setVencen(vencimientosEnDias(v)), () => undefined);
    return () => c.abort();
  }, []);
  const vencenPorDia = useMemo(() => vencimientosPorFecha(vencen), [vencen]);
  // «Ahora no» esconde la pregunta mientras la ficha siga abierta; vuelve a salir la próxima vez.
  const [sinPregunta, setSinPregunta] = useState<string | null>(null);
  const { avisar } = useAvisos();
  const [miAsesor, setMiAsesor] = useState<string | null>(null);
  useEffect(() => { const c = new AbortController(); leerMiAsesor(c.signal).then(setMiAsesor); return () => c.abort(); }, []);
  // Hoja abierta: «nueva» o el id de la cita que se cambia.
  const [editando, setEditando] = useState<"nueva" | string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [confirmarCancelar, setConfirmarCancelar] = useState(false);
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (e.key === "n" || e.key === "N") { e.preventDefault(); setEditando("nueva"); }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, []);
  const clientes = useColeccion<Cliente>("clientes");
  const leads = useColeccion<Lead>("leads");
  const inmuebles = useColeccion<Property>("propiedades");
  const asesores = useColeccion<AsesorNombre>("asesores");
  const [hoy] = useState(() => new Date());
  // Semana a la vista: 0 es la que empieza hoy; las flechas la mueven de 7 en 7 (AUD-03, A1).
  const [salto, setSalto] = useState(0);
  const desde = useMemo(() => sumarDias(hoy, salto * 7), [hoy, salto]);
  const [dia, setDia] = useState<string | null>(null);
  // Vista: Semana (lista) o Día (línea de tiempo). Se recuerda en este navegador.
  const [vistaGuardada, guardarVista] = usePreferencia("fortius-agenda-vista", "semana");
  const vista: "semana" | "dia" = vistaGuardada === "dia" ? "dia" : "semana";
  const [ahoraMin, setAhoraMin] = useState(() => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); });
  useEffect(() => {
    const t = window.setInterval(() => { const d = new Date(); setAhoraMin(d.getHours() * 60 + d.getMinutes()); }, 60_000);
    return () => window.clearInterval(t);
  }, []);
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (document.querySelector("[role=dialog]")) return;
      if (e.key === "1") { e.preventDefault(); guardarVista("semana"); }
      else if (e.key === "2") { e.preventDefault(); guardarVista("dia"); }
      else if (e.key === "t" || e.key === "T") { e.preventDefault(); setSalto(0); setDia(null); }
      else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        if (t?.closest("[role=group]")) return;
        e.preventDefault(); setSalto((x) => x + (e.key === "ArrowLeft" ? -1 : 1)); setDia(null);
      }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [guardarVista]);
  const nombreAsesor = useMemo(() => new Map(asesores.datos.map((a) => [a.id, a.nombre?.trim() || ""])), [asesores.datos]);
  // El nombre del asesor solo aporta cuando hay más de uno (el director ve a todos).
  const variosAsesores = useMemo(() => new Set(datos.map((e) => e.asesorId).filter(Boolean)).size > 1, [datos]);
  const subtitulo = (c: FilaCita) => [c.tipo, variosAsesores && c.asesorId ? nombreAsesor.get(c.asesorId) || null : null].filter(Boolean).join(" · ");
  const { abierta: citaId, abrir, cerrar } = useFichaEnDireccion("cita");
  const evAbierto = citaId ? datos.find((e) => e.id === citaId) ?? null : null;
  const abierta = useMemo<FilaCita | null>(() => {
    const ev = citaId ? datos.find((e) => e.id === citaId) : undefined;
    return ev ? citasDelDia(datos, ev.fecha).find((c) => c.id === ev.id) ?? null : null;
  }, [citaId, datos]);

  const enEdicion = editando && editando !== "nueva" ? datos.find((e) => e.id === editando) ?? null : null;
  const guardarCita = async (d: DatosCita, persona?: string) => {
    setOcupado(true);
    try {
      if (enEdicion) {
        const previa = enEdicion;
        await guardar(previa.id, editarCita(previa, d, persona));
        setEditando(null);
        avisar("Cita cambiada", { etiqueta: "Deshacer", alAccionar: () => { guardar(previa.id, previa).then(() => avisar("Se deshizo"), (e: unknown) => avisar(e instanceof Error ? e.message : "No se pudo deshacer.")); } });
      } else {
        const n = nuevaCita({ ...d, asesorId: miAsesor }, persona);
        await guardar(n.id, n);
        setEditando(null);
        irAFecha(n.fecha);
        avisar(`Cita agendada: ${diaLargo(n.fecha)}${n.hora ? `, ${n.hora}` : ""}`);
      }
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se guardó. Vuelve a intentarlo.");
    } finally { setOcupado(false); }
  };
  const cancelarCita = async (id: string) => {
    const previa = datos.find((e) => e.id === id);
    if (!previa) return;
    setOcupado(true);
    try {
      await borrar(id);
      setConfirmarCancelar(false);
      cerrar();
      // Deshacer la vuelve a agendar igual, con un id nuevo (la quitada queda en el historial).
      avisar("Cita cancelada", { etiqueta: "Deshacer", alAccionar: () => { const otra = { ...previa, id: crypto.randomUUID() }; guardar(otra.id, otra).then(() => avisar("Se volvió a agendar"), (e: unknown) => avisar(e instanceof Error ? e.message : "No se pudo deshacer.")); } });
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se canceló. Vuelve a intentarlo.");
    } finally { setOcupado(false); }
  };

  const guardarComoFue = async (ev: EventoConResultado, r: RespuestaComoFue) => {
    setOcupado(true);
    const previa = ev;
    try {
      await guardar(ev.id, anotarResultado(ev, r.estado, r.nota, new Date()));
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se anotó. Vuelve a intentarlo.");
      setOcupado(false);
      return;
    }
    const faltas: string[] = [];
    let enAsunto = false;
    let tarea: Task | null = null;
    if (ev.expedienteId) {
      try { await anotarEnAsunto(ev.expedienteId, notaParaAsunto(ev, r.estado, r.nota)); enAsunto = true; } catch { faltas.push("no se pudo anotar en el asunto"); }
      if (r.siguiente.trim()) {
        const exp = expedientes.find((x) => x.id === ev.expedienteId);
        if (!exp) faltas.push("no se encontró el asunto para dejar lo que sigue");
        else {
          const t = nuevoSiguiente(exp, r.siguiente, r.vence);
          try { await tareas.guardar(t.id, t); tarea = t; } catch { faltas.push("lo que sigue no se guardó"); }
        }
      }
    }
    setOcupado(false);
    const texto = `Anotado en la cita${enAsunto ? " y en el asunto" : ""}${tarea ? "; lo que sigue quedó como pendiente" : ""}${faltas.length ? `, pero ${faltas.join(" y ")}` : ""}.`;
    avisar(texto, {
      etiqueta: "Deshacer",
      alAccionar: () => {
        const pasos: Promise<unknown>[] = [guardar(previa.id, previa)];
        if (tarea) pasos.push(tareas.borrar(tarea.id));
        // El historial del asunto no se borra: se agrega que se corrigió.
        if (enAsunto && previa.expedienteId) pasos.push(anotarEnAsunto(previa.expedienteId, notaDeshecha(previa)));
        Promise.all(pasos).then(() => avisar("Se deshizo"), (e: unknown) => avisar(e instanceof Error ? e.message : "No se pudo deshacer todo."));
      },
    });
  };

  const enfocar = useRef<string | null>(null);
  const moverCita = async (ev: Evento, cambio: { minutos?: number; fecha?: string }) => {
    const previa = ev;
    let nueva: Evento = ev;
    if (cambio.fecha !== undefined) {
      const otra = conFecha(ev, cambio.fecha, aTexto(hoy));
      if (!otra) { if (cambio.fecha < aTexto(hoy)) avisar("No se puede mover a un día que ya pasó."); return; }
      nueva = otra;
    }
    if (cambio.minutos !== undefined) nueva = conHora(nueva, cambio.minutos);
    const hora = nueva.hora ? deHoraGuardada(nueva.hora) : null;
    const donde = cambio.fecha !== undefined
      ? `al ${diaLargo(nueva.fecha)}${hora !== null ? `, ${horaTexto(hora)}` : ""}`
      : `a las ${horaTexto(cambio.minutos ?? 0)}`;
    try {
      await guardar(ev.id, nueva);
      if (cambio.fecha !== undefined) { enfocar.current = ev.id; seguirA(nueva.fecha); }
      const choque = seEmpalma(nueva, datos);
      avisar(`«${ev.titulo}» pasó ${donde}.${choque ? ` ${choque}` : ""}`, {
        etiqueta: "Deshacer",
        alAccionar: () => {
          guardar(previa.id, previa).then(() => { if (cambio.fecha !== undefined) seguirA(previa.fecha); avisar("Se deshizo"); }, (e: unknown) => avisar(e instanceof Error ? e.message : "No se pudo deshacer."));
        },
      });
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se movió. Vuelve a intentarlo.");
    }
  };
  // Tras cambiar de día, el foco vuelve a la cita en su nuevo lugar (para seguir con Alt + ←/→).
  useEffect(() => {
    const id = enfocar.current;
    if (!id) return;
    const el = document.querySelector<HTMLElement>(`[data-cita-id="${CSS.escape(id)}"]`);
    const destino = el?.matches("button") ? el : el?.querySelector<HTMLElement>("button");
    if (destino) { destino.focus(); enfocar.current = null; }
  }, [datos, dia, salto]);
  // Arrastre a un día de la tira (lista de la semana: arrastre del navegador; vista de Día: puntero, ver dia.tsx).
  const [diaDestino, setDiaDestino] = useState<string | null>(null);
  const esArrastreDeCita = (e: DragEvent) => e.dataTransfer.types.includes(TIPO_ARRASTRE);
  const teclaDia = (e: TeclaReact<HTMLElement>, id: string) => {
    if (!e.altKey || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
    e.preventDefault();
    const ev = datos.find((x) => x.id === id);
    const fecha = ev ? correrFecha(ev.fecha, e.key === "ArrowLeft" ? -1 : 1) : null;
    if (ev && fecha) void moverCita(ev, { fecha });
  };

  const tira = useMemo(() => semanaDesde(desde, datos, hoy), [desde, datos, hoy]);
  const tareasPorDia = useMemo(() => tareasPorFecha(tareasDeLaSemana(tareas.datos, desde, hoy)), [tareas.datos, desde, hoy]);
  const totalTareas = useMemo(() => [...tareasPorDia.values()].reduce((n, l) => n + l.length, 0), [tareasPorDia]);
  const semana = useMemo(() => semanaEnLista(datos, desde, hoy), [datos, desde, hoy]);
  const finSemana = aTexto(sumarDias(desde, 7));
  const proxima = useMemo(() => proximaFecha(datos, finSemana), [datos, finSemana]);
  const irA = (s: number) => { setSalto(s); setDia(null); };
  const saltoDe = (fecha: string) => {
    const [a, m, d] = fecha.split("-").map(Number);
    const dias = Math.round((new Date(a, m - 1, d).getTime() - new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime()) / 86_400_000);
    return Math.floor(dias / 7);
  };
  const irAFecha = (fecha: string) => { setSalto(saltoDe(fecha)); setDia(fecha); };
  // La vista sigue a una cita que cambió de día: en Día (o con un día elegido) se abre ese día; en la semana, solo si salió de ella.
  const seguirA = (fecha: string) => {
    if (vista === "dia" || dia) irAFecha(fecha);
    else if (saltoDe(fecha) !== salto) setSalto(saltoDe(fecha));
  };
  // Días con citas o con vencimientos; los vencimientos van al final de su día y se ven distintos de las citas.
  const grupos = useMemo(() => {
    if (dia) return [{ fecha: dia, titulo: diaLargo(dia), citas: citasDelDia(datos, dia), vencen: vencenPorDia.get(dia) ?? [], tareas: tareasPorDia.get(dia) ?? [] }];
    const titulos = new Map(semana.map((g) => [g.fecha, g]));
    const manana = aTexto(sumarDias(hoy, 1));
    return tira
      .filter((d) => d.citas > 0 || vencenPorDia.has(d.fecha) || tareasPorDia.has(d.fecha))
      .map((d) => ({
        fecha: d.fecha,
        titulo: titulos.get(d.fecha)?.titulo ?? (d.hoy ? "Hoy" : d.fecha === manana ? "Mañana" : diaLargo(d.fecha)),
        citas: titulos.get(d.fecha)?.citas ?? [],
        vencen: vencenPorDia.get(d.fecha) ?? [],
        tareas: tareasPorDia.get(d.fecha) ?? [],
      }));
  }, [dia, datos, semana, tira, vencenPorDia, tareasPorDia, hoy]);
  // Tarea con fecha (solo lectura): se distingue de las citas por el ícono y «Tarea»; abre su asunto si lo tiene.
  const filaTarea = (t: TareaDia) => {
    const fila = {
      titulo: t.titulo, subtitulo: t.expedienteId ? "Abre su asunto" : undefined, detalle: t.vencida ? "Vencida" : undefined, tonoDetalle: t.vencida ? ("error" as const) : ("normal" as const), lado: "Tarea",
      izquierda: <span className="pn-av" aria-hidden style={{ borderRadius: "var(--r-md)" }}><Icono nombre="expediente" tamano={18} /></span>,
    };
    return t.expedienteId ? <Fila key={t.id} {...fila} href={`/panel/asuntos?ver=${encodeURIComponent(t.expedienteId)}`} /> : <Fila key={t.id} {...fila} />;
  };
  const porId = useMemo(() => new Map(datos.map((e) => [e.id, e])), [datos]);
  const pregunta = (id: string) => { const e = porId.get(id); return e ? pideComoFue(e, hoy) : false; };
  const cuentaVence = (fecha: string) => vencenPorDia.get(fecha)?.length ?? 0;
  const total = tira.reduce((n, d) => n + d.citas, 0);
  // Día a la vista: el elegido en la tira; si no, hoy (si está en la semana) o el primero de la semana.
  const fechaDia = dia ?? tira.find((d) => d.hoy)?.fecha ?? tira[0]?.fecha ?? aTexto(hoy);
  const citasDia = useMemo(() => datos.filter((e) => e.fecha === fechaDia), [datos, fechaDia]);
  const sinHoraDia = useMemo(() => citasDelDia(datos, fechaDia).filter((c) => !c.hora), [datos, fechaDia]);
  const pidenComoFue = useMemo(() => new Set(citasDia.filter((e) => pideComoFue(e, hoy)).map((e) => e.id)), [citasDia, hoy]);

  return (
    <div className="pn-pagina" style={{ maxWidth: 760 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <h1 className="pn-h1">Agenda</h1>
        <Boton variante="secundario" onClick={() => setEditando("nueva")} aria-keyshortcuts="N">Nueva cita</Boton>
      </div>
      <p className="pn-sub">
        {textoSemana(desde)}
        {cargando ? "" : ` · ${total ? `${total} ${total === 1 ? "cita" : "citas"}` : "sin citas"}${totalTareas ? `, ${totalTareas} ${totalTareas === 1 ? "tarea" : "tareas"}` : ""}`}
      </p>

      <div style={{ display: "flex", alignItems: "flex-end", flexWrap: "wrap", gap: 4, marginTop: 20 }}>
        <button type="button" className="pn-iconbtn" aria-label="Semana anterior" title="Semana anterior" onClick={() => irA(salto - 1)}><Gesto nombre="izquierda" tamano={18} /></button>
        <button type="button" className="pn-iconbtn" aria-label="Semana siguiente" title="Semana siguiente" onClick={() => irA(salto + 1)}><Gesto nombre="derecha" tamano={18} /></button>
        {salto !== 0 ? <Boton variante="texto" onClick={() => irA(0)}>Volver a hoy</Boton> : null}
        <span style={{ flex: 1 }} />
        <Interruptor etiqueta="Vista" opciones={[{ valor: "semana", etiqueta: "Semana" }, { valor: "dia", etiqueta: "Día" }]} valor={vista} alElegir={(v) => guardarVista(v)} />
      </div>
      <div className="pn-tira" role="group" aria-label={salto === 0 ? "Próximos 7 días" : "Semana a la vista"} style={{ marginTop: 8 }}>
        {tira.map((d) => (
          <button
            key={d.fecha}
            type="button"
            className={d.hoy ? "pn-tira-hoy" : undefined}
            aria-pressed={vista === "dia" ? fechaDia === d.fecha : dia === d.fecha}
            aria-label={`${d.hoy ? "Hoy, " : ""}${diaLargo(d.fecha)}: ${d.citas ? `${d.citas} ${d.citas === 1 ? "cita" : "citas"}` : "sin citas"}${cuentaVence(d.fecha) ? `, ${cuentaVence(d.fecha) === 1 ? "1 vencimiento" : `${cuentaVence(d.fecha)} vencimientos`}` : ""}${tareasPorDia.get(d.fecha)?.length ? `, ${tareasPorDia.get(d.fecha)!.length === 1 ? "1 tarea" : `${tareasPorDia.get(d.fecha)!.length} tareas`}` : ""}`}
            onClick={() => setDia((x) => (vista === "dia" ? d.fecha : x === d.fecha ? null : d.fecha))}
            data-dia-destino={d.fecha >= aTexto(hoy) ? d.fecha : undefined}
            data-destino-activo={diaDestino === d.fecha ? "" : undefined}
            onDragOver={(e) => { if (!esArrastreDeCita(e) || d.fecha < aTexto(hoy)) return; e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (diaDestino !== d.fecha) setDiaDestino(d.fecha); }}
            onDragLeave={() => setDiaDestino((x) => (x === d.fecha ? null : x))}
            onDrop={(e) => {
              if (!esArrastreDeCita(e)) return;
              e.preventDefault();
              setDiaDestino(null);
              const ev = datos.find((x) => x.id === e.dataTransfer.getData(TIPO_ARRASTRE));
              if (ev) void moverCita(ev, { fecha: d.fecha });
            }}
          >
            <span className="pn-tira-letra" aria-hidden>{d.letra}</span>
            <span className="pn-tira-num" aria-hidden>{d.numero}</span>
            <span aria-hidden style={{ display: "flex", gap: 3 }}>
              <span className="pn-tira-punto" data-vacio={d.citas ? undefined : ""} />
              {/* Vencimiento: marca cuadrada en ámbar, distinta del punto redondo de las citas. */}
              {cuentaVence(d.fecha) ? <span style={{ width: 6, height: 6, borderRadius: 1, background: "var(--warning)" }} /> : null}
            </span>
          </button>
        ))}
      </div>
      {dia && vista === "semana" ? <div style={{ marginTop: 8 }}><Boton variante="texto" onClick={() => setDia(null)}>Ver toda la semana</Boton></div> : null}
      {vista === "semana" && !cargando && grupos.some((g) => g.citas.length) ? (
        <p className="pn-campo-ayuda pn-agenda-pista" style={{ margin: "8px 0 0" }}>Arrastra una cita a otro día de la tira, o enfócala y usa Alt con ← y →.</p>
      ) : null}

      <div style={{ display: "grid", gap: 20, marginTop: 20 }}>
        {cargando ? <Cargando lineas={4} etiqueta="Cargando agenda" /> : null}
        {error ? <EstadoError texto={error} alReintentar={reintentar} /> : null}
        {!cargando && !error && vista === "dia" ? (
          <>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{fechaDia === aTexto(hoy) ? `Hoy, ${diaLargo(fechaDia)}` : diaLargo(fechaDia)}</h2>
            {sinHoraDia.length || (vencenPorDia.get(fechaDia)?.length ?? 0) || (tareasPorDia.get(fechaDia)?.length ?? 0) ? (
              <GrupoLista titulo="Todo el día">
                {sinHoraDia.map((c) => (
                  <Fila key={c.id} titulo={c.titulo} subtitulo={subtitulo(c)} lado="Sin hora" alPulsar={() => abrir(c.id)}
                    detalle={pregunta(c.id) ? "¿Cómo te fue?" : undefined} tonoDetalle={pregunta(c.id) ? "aviso" : "normal"} />
                ))}
                {(vencenPorDia.get(fechaDia) ?? []).map((v) => {
                  const fila = { titulo: v.titulo, subtitulo: v.detalle, lado: "Vence", izquierda: <span className="pn-av" aria-hidden style={{ borderRadius: "var(--r-md)", color: "var(--warning)" }}><Icono nombre="alerta" tamano={18} /></span> };
                  return v.expedienteId ? <Fila key={v.id} {...fila} href={`/panel/asuntos?ver=${encodeURIComponent(v.expedienteId)}`} /> : <Fila key={v.id} {...fila} />;
                })}
                {(tareasPorDia.get(fechaDia) ?? []).map(filaTarea)}
              </GrupoLista>
            ) : null}
            {citasDia.some((e) => e.hora) ? (
              <DiaLineaDeTiempo citas={citasDia.filter((e) => e.hora)} esHoy={fechaDia === aTexto(hoy)} ahoraMin={ahoraMin} pidenComoFue={pidenComoFue}
                alAbrir={abrir} alMover={(ev, m) => void moverCita(ev, { minutos: m })}
                alMoverDia={(ev, f) => void moverCita(ev, { fecha: f })} alSobreDia={setDiaDestino} />
            ) : (
              <Vacio titulo="Sin citas con hora" texto={citasDia.length ? "Las de este día no tienen hora." : "Este día está libre."} icono="cita" />
            )}
          </>
        ) : null}
        {!cargando && !error && vista === "semana" && grupos.every((g) => g.citas.length === 0 && g.vencen.length === 0 && g.tareas.length === 0) ? (
          <>
            <Vacio titulo={dia ? "Día libre" : "Semana libre"} texto={proxima ? `La próxima cita es el ${diaLargo(proxima)}.` : "Las visitas, firmas y llamadas que se agenden aparecen aquí."} icono="cita" />
            {proxima && !dia ? <div><Boton variante="secundario" onClick={() => irAFecha(proxima)}>Ver la próxima cita</Boton></div> : null}
          </>
        ) : null}
        {!cargando && !error && vista === "semana" ? grupos.filter((g) => g.citas.length || g.vencen.length || g.tareas.length).map((g) => (
          <GrupoLista key={g.fecha} titulo={g.titulo}>
            {g.citas.map((c) => (
              <div
                key={c.id}
                className="pn-agenda-mover"
                data-cita-id={c.id}
                draggable
                onDragStart={(e) => { e.dataTransfer.setData(TIPO_ARRASTRE, c.id); e.dataTransfer.effectAllowed = "move"; }}
                onDragEnd={() => setDiaDestino(null)}
                onKeyDown={(e) => teclaDia(e, c.id)}
              >
                <Fila
                  titulo={c.titulo}
                  subtitulo={subtitulo(c)}
                  detalle={c.empalme ? "Se empalma con otra cita" : pregunta(c.id) ? "¿Cómo te fue?" : undefined}
                  tonoDetalle={c.empalme || pregunta(c.id) ? "aviso" : "normal"}
                  lado={c.hora ?? "Sin hora"}
                  alPulsar={() => abrir(c.id)}
                />
              </div>
            ))}
            {g.vencen.map((v) => {
              const fila = { titulo: v.titulo, subtitulo: v.detalle, lado: "Vence", izquierda: <span className="pn-av" aria-hidden style={{ borderRadius: "var(--r-md)", color: "var(--warning)" }}><Icono nombre="alerta" tamano={18} /></span> };
              return v.expedienteId ? <Fila key={v.id} {...fila} href={`/panel/asuntos?ver=${encodeURIComponent(v.expedienteId)}`} /> : <Fila key={v.id} {...fila} />;
            })}
            {g.tareas.map(filaTarea)}
          </GrupoLista>
        )) : null}
      </div>

      <HojaAdaptable abierta={abierta !== null} titulo={abierta?.titulo ?? "Cita"} alCerrar={() => cerrar()}>
        {abierta ? (
          <>
            <Ficha secciones={[{ titulo: "Cita", datos: [
              { etiqueta: "Tipo", valor: abierta.tipo },
              ...(abierta.asesorId && nombreAsesor.get(abierta.asesorId) ? [{ etiqueta: "Asesor", valor: nombreAsesor.get(abierta.asesorId) ?? "" }] : []),
              { etiqueta: "Día", valor: diaLargo(abierta.fecha) },
              abierta.hora ? { etiqueta: "Hora", valor: abierta.hora } : { etiqueta: "Hora", valor: "Sin hora", falta: true },
              ...(abierta.notas ? [{ etiqueta: "Notas", valor: abierta.notas }] : []),
              ...(evAbierto?.resultado ? [{ etiqueta: "Cómo fue", valor: textoResultado(evAbierto.resultado) }] : []),
              ...(abierta.empalme ? [{ etiqueta: "Aviso", valor: "Se empalma con otra cita", falta: true }] : []),
            ] }]} />
            {evAbierto && pideComoFue(evAbierto, hoy) && sinPregunta !== evAbierto.id ? (
              <ComoTeFue key={evAbierto.id} conAsunto={Boolean(evAbierto.expedienteId)} hoy={hoy} ocupado={ocupado}
                alGuardar={(r) => void guardarComoFue(evAbierto, r)} alCancelar={() => setSinPregunta(evAbierto.id)} />
            ) : null}
            {evAbierto ? (
              <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                <Desplegable etiqueta="Mover a" valor={horasParaMover().some((h) => h.valor === evAbierto.hora) ? (evAbierto.hora ?? "") : ""} vacio="Elige una hora"
                  opciones={horasParaMover()} ayuda="El mismo día. En la vista de Día también se arrastra."
                  alElegir={(h) => { const m = deHoraGuardada(h); if (m !== null && h !== evAbierto.hora) void moverCita(evAbierto, { minutos: m }); }} />
                {/* En el teléfono no hay arrastre a otro día: aquí se cambia el día con la misma hora. */}
                <DesplegableFecha key={evAbierto.fecha} etiqueta="Cambiar de día" valor={evAbierto.fecha >= aTexto(hoy) ? evAbierto.fecha : null} hoy={hoy}
                  sinFecha={evAbierto.fecha >= aTexto(hoy) ? null : "Elige un día"}
                  alElegir={(f) => { if (f && f !== evAbierto.fecha) void moverCita(evAbierto, { fecha: f }); }} />
              </div>
            ) : null}
            <Relacionado grupos={relacionadoCita(abierta, { clientes: clientes.datos, leads: leads.datos, inmuebles: inmuebles.datos })} />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
              <Boton variante="secundario" onClick={() => { setConfirmarCancelar(false); setEditando(abierta.id); }}>Cambiar</Boton>
              {confirmarCancelar ? null : <Boton variante="texto" onClick={() => setConfirmarCancelar(true)}>Cancelar cita</Boton>}
            </div>
            {confirmarCancelar ? (
              <div role="group" aria-label="Confirmar" style={{ display: "grid", gap: 8, marginTop: 12, padding: 12, border: "1px solid var(--border)", borderRadius: "var(--r-lg)" }}>
                <p style={{ margin: 0 }}>¿Cancelar «{abierta.titulo}»? Si fue un error, se puede deshacer.</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <Boton variante="peligro" deshabilitado={ocupado} onClick={() => void cancelarCita(abierta.id)}>Sí, cancelar</Boton>
                  <Boton variante="texto" onClick={() => setConfirmarCancelar(false)}>No</Boton>
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </HojaAdaptable>
      <HojaAdaptable abierta={editando !== null} titulo={enEdicion ? "Cambiar cita" : "Nueva cita"} alCerrar={() => setEditando(null)}>
        {editando !== null ? (
          <FormularioCita
            key={editando}
            inicial={enEdicion ? datosDeCita(enEdicion) : { tipo: "visita", titulo: "", fecha: dia ?? aTexto(hoy), hora: 10 * 60, clienteId: "", propiedadSlug: "", notas: "", asesorId: miAsesor }}
            citas={enEdicion ? datos.filter((e) => e.id !== enEdicion.id) : datos}
            personas={clientes.datos} inmuebles={inmuebles.datos} hoy={hoy} ocupado={ocupado}
            textoGuardar={enEdicion ? "Guardar cambios" : "Agendar"}
            alGuardar={(d, persona) => void guardarCita(d, persona)}
          />
        ) : null}
      </HojaAdaptable>
    </div>
  );
}

/** useSearchParams pide un límite de Suspense. */
export default function PaginaAgenda() {
  return <Suspense fallback={<div className="pn-pagina"><Cargando lineas={4} etiqueta="Cargando agenda" /></div>}><Agenda /></Suspense>;
}
