"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState, type DragEvent, type KeyboardEvent as TeclaReact } from "react";

import { useColeccion } from "@/components/panel/datos/use-coleccion";
import { personaDe, useDirectorio } from "@/components/panel/datos/persona-vista";
import { useFichaEnDireccion } from "@/components/panel/datos/use-ficha-url";
import { FormularioCita } from "@/components/panel/agenda/formulario";
import { ComoTeFue, type RespuestaComoFue } from "@/components/panel/agenda/como-fue";
import { DetalleCita } from "@/components/panel/agenda/detalle-cita";
import { DiaLineaDeTiempo } from "@/components/panel/agenda/dia";
import { MoverCita } from "@/components/panel/agenda/mover";
import { NuevaEnUnaLinea } from "@/components/panel/agenda/nueva-linea";
import { SemanaCuadro } from "@/components/panel/agenda/semana";
import { useMovimientosQueVencen } from "@/components/panel/hoy/pendientes";
import { usePreferencia } from "@/components/panel/almacen";
import { useBarraTelefono } from "@/components/panel/kit/barra";
import { Interruptor } from "@/components/panel/kit/segmentado";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Gesto, Icono } from "@/components/panel/icons";
import { Boton } from "@/components/panel/kit/boton";
import { Cargando, EstadoError } from "@/components/panel/kit/estados";
import { HojaAdaptable, useEsTelefono } from "@/components/panel/ui/hoja-adaptable";
import { Fila, GrupoLista } from "@/components/panel/kit/lista";
import type { Property } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import type { Evento, Lead } from "@/lib/domain/records";
import { aTexto, deTexto, diaLargo, horaTexto } from "@/lib/panel/calendario";
import { conFecha, conHora, correrFecha } from "@/lib/panel/datos/agenda-dia";
import { tareasDeLaSemana, tareasPorFecha, textoSemana, type TareaDia } from "@/lib/panel/datos/agenda-semana";
import { datosDeCita, deHoraGuardada, editarCita, nuevaCita, nuevaDesdeDireccion, seEmpalma, type DatosCita } from "@/lib/panel/datos/agenda-acciones";
import { anotarEnAsunto, leerExpedientes, leerMiAsesor, leerVencimientos } from "@/lib/panel/datos/colecciones";
import { filasAsuntos, nuevoSiguiente, type Expediente } from "@/lib/panel/datos/asuntos";
import { leerAsuntos } from "@/lib/panel/asuntos/api";
import type { FilaAsunto } from "@/lib/backend/asuntos-contrato";
import { vencenAsuntos, vencenMovimientos, vencenTramites } from "@/lib/panel/datos/vencimientos";
import type { Tramite } from "@/lib/tramites";
import type { ContratoServidor } from "@/lib/panel/datos/hoy";
import {
  anotarResultado, notaDeshecha, notaParaAsunto, pideComoFue, vencimientosEnDias, vencimientosPorFecha,
  type EventoConResultado, type VenceDia,
} from "@/lib/panel/datos/agenda-resultado";
import type { Task } from "@/lib/tasks";
import { citasDelDia, proximaFecha, semanaDesde, semanaEnLista, sumarDias, type FilaCita } from "@/lib/panel/datos/agenda";

import "@/components/panel/asunto/asunto.css";
import "@/components/panel/asunto/vistas.css";
import "./agenda.css";

type AsesorNombre = { id: string; nombre?: string };
/** Tipo de dato del arrastre de una cita (solo lo entiende la tira de días de esta página). */
const TIPO_ARRASTRE = "application/x-fortius-cita";
const rutaAsunto = (id: string) => `/panel/asuntos?ver=${encodeURIComponent(id)}`;
const mayuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
type Vista = "calendario" | "lista";
type Nueva = { modo: "linea" } | { modo: "detalle"; inicial: DatosCita };

/**
 * Agenda (boceto «Agenda»). Escritorio: la semana en cuadro de 7 columnas (o en lista), la fila «Todo el día» con los
 * vencimientos, «Ya pasó · ¿Cómo te fue?» arriba, «Más adelante» abajo y el detalle al costado. Teléfono: la tira de
 * 7 días, el día en línea de tiempo (o la lista) y las hojas desde abajo. Nueva cita en una línea (botón, «+» o N);
 * Mover, Cambiar datos y Cancelar con Deshacer.
 */
function Agenda() {
  const { cargando, error, datos: eventos, reintentar, guardar, borrar } = useColeccion<Evento>("eventos");
  // El esquema de `eventos` admite campos extra: aquí vive el resultado de «¿Cómo te fue?».
  const datos = eventos as EventoConResultado[];
  const tareas = useColeccion<Task>("tareas");
  // Asuntos (para ligar «lo que sigue») y vencimientos (fin del encargo y licencia), leídos una vez; si fallan, la agenda sigue.
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [vencenContratos, setVencenContratos] = useState<VenceDia[]>([]);
  useEffect(() => {
    const c = new AbortController();
    leerExpedientes<Expediente>(c.signal).then(setExpedientes, () => undefined);
    leerVencimientos<ContratoServidor>(c.signal).then((v) => setVencenContratos(vencimientosEnDias(v)), () => undefined);
    return () => c.abort();
  }, []);
  // Los asuntos del panel, para el nombre del asunto de una cita agendada desde él (`asuntoId`).
  const [asuntos, setAsuntos] = useState<FilaAsunto[]>([]);
  useEffect(() => { let vivo = true; leerAsuntos().then((a) => { if (vivo) setAsuntos(a); }, () => undefined); return () => { vivo = false; }; }, []);
  // Más vencimientos (DECISIONES, Agenda): las esperas de los trámites, los cobros de Dinero (nada si el servidor aún no
  // tiene la tabla) y la fecha clave de los asuntos. Cada uno en su día, en «Todo el día» y en «Más adelante».
  const tramites = useColeccion<Tramite>("tramites");
  const movimientos = useMovimientosQueVencen();
  const { avisar } = useAvisos();
  const router = useRouter();
  const params = useSearchParams();
  const telefono = useEsTelefono();
  const [miAsesor, setMiAsesor] = useState<string | null>(null);
  useEffect(() => { const c = new AbortController(); leerMiAsesor(c.signal).then(setMiAsesor); return () => c.abort(); }, []);
  // Hojas: nueva cita, cambiar datos (id), mover (id) y «¿Cómo te fue?» (id).
  const [nueva, setNueva] = useState<Nueva | null>(null);
  const [cambiando, setCambiando] = useState<string | null>(null);
  const [moviendo, setMoviendo] = useState<string | null>(null);
  const [comoFue, setComoFue] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  // «Buscar o crear» → «Cita nueva» llega con ?nueva=1. Desde un inmueble, una persona o un asunto llega además con
  // ?inmueble=, ?persona= o ?asunto= (y ?tipo=): se abre el formulario completo con eso ya elegido.
  // La hoja se abre durante el render (sin efecto); el efecto solo limpia la dirección.
  const pideNueva = params.get("nueva") === "1";
  const [paramsVistos, setParamsVistos] = useState<typeof params | null>(null);
  if (pideNueva && paramsVistos !== params) {
    setParamsVistos(params);
    const desde = nuevaDesdeDireccion(params);
    setNueva(desde ? { modo: "detalle", inicial: {
      tipo: desde.tipo ?? "visita", titulo: "", fecha: aTexto(new Date()), hora: 10 * 60, clienteId: desde.clienteId, propiedadSlug: desde.propiedadSlug,
      notas: "", asesorId: null, expedienteId: desde.expedienteId || undefined,
      personaId: desde.personaId || undefined, asuntoId: desde.asuntoId || undefined,
    } } : { modo: "linea" });
  }
  useEffect(() => { if (pideNueva) router.replace("/panel/agenda", { scroll: false }); }, [pideNueva, router]);
  // Con quién: se elige del Directorio. La lista vieja solo da el nombre de las citas de antes que la traen.
  const directorio = useDirectorio();
  const clientes = useColeccion<Cliente>("clientes");
  const leads = useColeccion<Lead>("leads");
  const inmuebles = useColeccion<Property>("propiedades");
  const asesores = useColeccion<AsesorNombre>("asesores");
  const [hoy] = useState(() => new Date());
  const hoyTexto = aTexto(hoy);
  const filas = useMemo(() => filasAsuntos(expedientes, { personas: clientes.datos, inmuebles: inmuebles.datos, tareas: tareas.datos, hoy: hoyTexto }),
    [expedientes, clientes.datos, inmuebles.datos, tareas.datos, hoyTexto]);
  const vencen = useMemo<VenceDia[]>(() => {
    const titulos = new Map(filas.map((f) => [f.id, f.titulo]));
    return [...vencenContratos, ...vencenTramites(tramites.datos), ...vencenMovimientos(movimientos.datos, (id) => titulos.get(id)), ...vencenAsuntos(expedientes, filas)]
      .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.titulo.localeCompare(b.titulo, "es"));
  }, [vencenContratos, tramites.datos, movimientos.datos, expedientes, filas]);
  const vencenPorDia = useMemo(() => vencimientosPorFecha(vencen), [vencen]);
  // Semana a la vista: 0 es la que empieza hoy; las flechas la mueven de 7 en 7 (AUD-03, A1).
  const [salto, setSalto] = useState(0);
  const desde = useMemo(() => sumarDias(hoy, salto * 7), [hoy, salto]);
  const [dia, setDia] = useState<string | null>(null);
  // Vista: Semana (cuadro en escritorio, día en el teléfono) o Lista. Se recuerda en este navegador.
  const [vistaGuardada, guardarVista] = usePreferencia("fortius-agenda-vista2", "calendario");
  const vista: Vista = vistaGuardada === "lista" ? "lista" : "calendario";
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
      if (e.key === "n" || e.key === "N") { e.preventDefault(); setNueva({ modo: "linea" }); }
      else if (e.key === "1") { e.preventDefault(); guardarVista("calendario"); }
      else if (e.key === "2") { e.preventDefault(); guardarVista("lista"); }
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
  const filaAbierta = useMemo<FilaCita | null>(() => (evAbierto ? citasDelDia(datos, evAbierto.fecha).find((c) => c.id === evAbierto.id) ?? null : null), [evAbierto, datos]);

  const irAFecha = (fecha: string) => { setSalto(saltoDe(fecha)); setDia(fecha); };
  const guardarCita = async (d: DatosCita, persona?: string) => {
    setOcupado(true);
    try {
      const previa = cambiando ? datos.find((e) => e.id === cambiando) ?? null : null;
      if (previa) {
        await guardar(previa.id, editarCita(previa, d, persona));
        setCambiando(null);
        avisar("Cita cambiada", { etiqueta: "Deshacer", alAccionar: () => { guardar(previa.id, previa).then(() => avisar("Se deshizo"), (e: unknown) => avisar(e instanceof Error ? e.message : "No se pudo deshacer.")); } });
      } else {
        const n = nuevaCita({ ...d, asesorId: d.asesorId ?? miAsesor }, persona);
        await guardar(n.id, n);
        setNueva(null);
        irAFecha(n.fecha);
        avisar(`Cita agendada: ${diaLargo(n.fecha)}${n.hora ? `, ${n.hora}` : ""}`, { etiqueta: "Deshacer", alAccionar: () => {
          borrar(n.id).then(() => avisar("Se quitó"), (e: unknown) => avisar(e instanceof Error ? e.message : "No se pudo deshacer."));
        } });
      }
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se guardó. Vuelve a intentarlo.");
    } finally { setOcupado(false); }
  };
  // Cancelar no pide confirmación: se deshace desde el aviso (boceto).
  const cancelarCita = async (id: string) => {
    const previa = datos.find((e) => e.id === id);
    if (!previa) return;
    setOcupado(true);
    try {
      await borrar(id);
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
    setComoFue(null);
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
    const texto = `${r.estado === "no_llego" ? "Anotado que no llegó" : "Anotado en la cita"}${enAsunto ? " y en el asunto" : ""}${tarea ? "; lo que sigue quedó como pendiente" : ""}${faltas.length ? `, pero ${faltas.join(" y ")}` : ""}.`;
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
    let nuevaEv: Evento = ev;
    if (cambio.fecha !== undefined) {
      const otra = conFecha(ev, cambio.fecha, hoyTexto);
      if (!otra) { if (cambio.fecha < hoyTexto) avisar("No se puede mover a un día que ya pasó."); return; }
      nuevaEv = otra;
    }
    if (cambio.minutos !== undefined) nuevaEv = conHora(nuevaEv, cambio.minutos);
    const hora = nuevaEv.hora ? deHoraGuardada(nuevaEv.hora) : null;
    const donde = cambio.fecha !== undefined
      ? `al ${diaLargo(nuevaEv.fecha)}${hora !== null ? `, ${horaTexto(hora)}` : ""}`
      : `a las ${horaTexto(cambio.minutos ?? 0)}`;
    try {
      await guardar(ev.id, nuevaEv);
      setMoviendo(null);
      if (cambio.fecha !== undefined) { enfocar.current = ev.id; seguirA(nuevaEv.fecha); }
      const choque = seEmpalma(nuevaEv, datos);
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
  // Arrastre a un día de la tira (lista: arrastre del navegador; Día: puntero, ver dia.tsx).
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
  const semana = useMemo(() => semanaEnLista(datos, desde, hoy), [datos, desde, hoy]);
  const finSemana = aTexto(sumarDias(desde, 7));
  const proxima = useMemo(() => proximaFecha(datos, finSemana), [datos, finSemana]);
  const irA = (s: number) => { setSalto(s); setDia(null); };
  function saltoDe(fecha: string) {
    const [a, m, d] = fecha.split("-").map(Number);
    const dias = Math.round((new Date(a, m - 1, d).getTime() - new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime()) / 86_400_000);
    return Math.floor(dias / 7);
  }
  // La vista sigue a una cita que cambió de día: con un día elegido se abre ese día; si salió de la semana, se va a la suya.
  const seguirA = (fecha: string) => {
    if (telefono || dia) irAFecha(fecha);
    else if (saltoDe(fecha) !== salto) setSalto(saltoDe(fecha));
  };
  // Lista: días con citas, vencimientos o tareas.
  const grupos = useMemo(() => {
    if (dia && vista === "lista" && !telefono) return [{ fecha: dia, titulo: diaLargo(dia), citas: citasDelDia(datos, dia), vencen: vencenPorDia.get(dia) ?? [], tareas: tareasPorDia.get(dia) ?? [] }];
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
  }, [dia, vista, telefono, datos, semana, tira, vencenPorDia, tareasPorDia, hoy]);
  const filaTarea = (t: TareaDia) => {
    const fila = {
      titulo: t.titulo, subtitulo: t.expedienteId ? "Abre su asunto" : undefined, detalle: t.vencida ? "Vencida" : undefined, tonoDetalle: t.vencida ? ("error" as const) : ("normal" as const), lado: t.hora ?? "Tarea",
      izquierda: <span className="pn-av" aria-hidden style={{ borderRadius: "var(--r-md)" }}><Icono nombre="expediente" tamano={18} /></span>,
    };
    return t.expedienteId ? <Fila key={t.id} {...fila} href={rutaAsunto(t.expedienteId)} /> : <Fila key={t.id} {...fila} />;
  };
  const destinoVence = (v: VenceDia) => v.href ?? (v.expedienteId ? rutaAsunto(v.expedienteId) : undefined);
  const filaVence = (v: VenceDia) => {
    const fila = { titulo: v.titulo, subtitulo: v.detalle, lado: "Vence", izquierda: <span className="pn-av" aria-hidden style={{ borderRadius: "var(--r-md)", color: "var(--warning)", background: "var(--warning-soft)" }}><Icono nombre="alerta" tamano={18} /></span> };
    const destino = destinoVence(v);
    return destino ? <Fila key={v.id} {...fila} href={destino} /> : <Fila key={v.id} {...fila} />;
  };
  const porId = useMemo(() => new Map(datos.map((e) => [e.id, e])), [datos]);
  const pregunta = (id: string) => { const e = porId.get(id); return e ? pideComoFue(e, hoy) : false; };
  const cuentaVence = (fecha: string) => vencenPorDia.get(fecha)?.length ?? 0;
  const total = tira.reduce((n, d) => n + d.citas, 0);
  // Día a la vista (teléfono): el elegido en la tira; si no, hoy (si está en la semana) o el primero.
  const fechaDia = dia ?? tira.find((d) => d.hoy)?.fecha ?? tira[0]?.fecha ?? hoyTexto;
  const citasDia = useMemo(() => datos.filter((e) => e.fecha === fechaDia), [datos, fechaDia]);
  const sinHoraDia = useMemo(() => citasDelDia(datos, fechaDia).filter((c) => !c.hora), [datos, fechaDia]);
  const citasSemana = useMemo(() => datos.filter((e) => tira.some((d) => d.fecha === e.fecha)), [datos, tira]);
  const pidenComoFue = useMemo(() => new Set(datos.filter((e) => pideComoFue(e, hoy)).map((e) => e.id)), [datos, hoy]);
  // «Ya pasó · ¿Cómo te fue?»: las de la última semana sin anotar, la más reciente primero.
  const preguntas = useMemo(() => {
    const hace = aTexto(sumarDias(hoy, -7));
    return datos.filter((e) => e.fecha >= hace && pidenComoFue.has(e.id))
      .sort((a, b) => `${b.fecha} ${b.hora ?? ""}`.localeCompare(`${a.fecha} ${a.hora ?? ""}`)).slice(0, 3);
  }, [datos, pidenComoFue, hoy]);
  // «Más adelante»: vencimientos después de la semana a la vista.
  const masAdelante = useMemo(() => vencen.filter((v) => v.fecha >= finSemana).sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(0, 5), [vencen, finSemana]);
  const enDias = (fecha: string) => { const d = deTexto(fecha); return d ? Math.round((d.getTime() - new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime()) / 86_400_000) : 0; };

  const esHoyAVista = telefono ? fechaDia === hoyTexto : salto === 0;
  useBarraTelefono({
    volver: { href: "/panel", texto: "Hoy" }, titulo: "Agenda", sinBuscar: true,
    nuevo: { etiqueta: "Nueva cita", alPulsar: () => setNueva({ modo: "linea" }) },
    extra: esHoyAVista ? null : { etiqueta: "Hoy", alPulsar: () => irA(0) },
  });

  const tituloDia = fechaDia === hoyTexto ? "Hoy" : fechaDia === aTexto(sumarDias(hoy, 1)) ? "Mañana" : mayuscula(diaLargo(fechaDia));
  const cuantasDia = citasDia.length;
  const exp = evAbierto?.expedienteId ? expedientes.find((x) => x.id === evAbierto.expedienteId) : undefined;
  const asuntoPanel = evAbierto?.asuntoId ? asuntos.find((x) => x.id === evAbierto.asuntoId) : undefined;
  const personaAbierta = evAbierto ? personaDe(evAbierto, directorio, clientes.datos) : null;
  const antesDe = (e: Evento) => (!e.personaId && e.clienteId ? clientes.datos.find((c) => c.id === e.clienteId)?.nombre?.trim() || undefined : undefined);
  const evCambiando = cambiando ? datos.find((e) => e.id === cambiando) ?? null : null;
  const evMoviendo = moviendo ? datos.find((e) => e.id === moviendo) ?? null : null;
  const evComoFue = comoFue ? datos.find((e) => e.id === comoFue) ?? null : null;
  const inicialNueva: DatosCita = { tipo: "visita", titulo: "", fecha: dia ?? hoyTexto, hora: 10 * 60, clienteId: "", propiedadSlug: "", notas: "", asesorId: miAsesor };

  const interruptor = (
    <Interruptor etiqueta="Vista" sinEtiqueta opciones={[{ valor: "calendario", etiqueta: telefono ? "Día" : "Semana" }, { valor: "lista", etiqueta: "Lista" }]} valor={vista} alElegir={(v) => guardarVista(v)} />
  );

  return (
    <div className={telefono ? "pn-pagina ag-pagina" : "as-vista ag-vista"}>
      {telefono ? (
        <header className="as-vbar ag-bar">
          <h1 className="as-h1-lista">{tituloDia}</h1>
          <span className="as-cab-n">{cargando ? "" : cuantasDia ? `${cuantasDia} ${cuantasDia === 1 ? "cita" : "citas"}` : "Sin citas"}</span>
        </header>
      ) : (
        // La barra de 52 px del modelo visual: título, semana a la vista y, a la derecha, vista, flechas, «Hoy» y «Nueva cita».
        <header className="as-vbar ag-bar">
          <h1 className="as-h1-lista">Agenda</h1>
          <span className="as-cab-n">
            {`${textoSemana(desde)}${cargando ? "" : ` · ${total ? `${total} ${total === 1 ? "cita" : "citas"}` : "sin citas"}`} · Datos de ejemplo`}
          </span>
          <span className="as-sp" />
          {interruptor}
          <span className="pn-ag-nav">
            <button type="button" className="as-btn as-gho as-ico" aria-label="Semana anterior" title="Semana anterior" onClick={() => irA(salto - 1)}><Gesto nombre="izquierda" tamano={16} /></button>
            <button type="button" className="pn-ag-hoy" aria-keyshortcuts="T" onClick={() => irA(0)}>Hoy</button>
            <button type="button" className="as-btn as-gho as-ico" aria-label="Semana siguiente" title="Semana siguiente" onClick={() => irA(salto + 1)}><Gesto nombre="derecha" tamano={16} /></button>
          </span>
          <Boton className="as-vnueva" icono="mas" onClick={() => setNueva({ modo: "linea" })} aria-keyshortcuts="N">Nueva cita</Boton>
        </header>
      )}

      {telefono ? (
        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button type="button" className="pn-iconbtn" aria-label="Semana anterior" onClick={() => irA(salto - 1)}><Gesto nombre="izquierda" tamano={18} /></button>
            <div className="pn-dstrip" role="group" aria-label={salto === 0 ? "Próximos 7 días" : "Semana a la vista"} style={{ flex: 1 }}>
              {tira.map((d) => (
                <button
                  key={d.fecha} type="button" className="pn-dpill" aria-pressed={fechaDia === d.fecha}
                  aria-label={`${d.hoy ? "Hoy, " : ""}${diaLargo(d.fecha)}: ${d.citas ? `${d.citas} ${d.citas === 1 ? "cita" : "citas"}` : "sin citas"}${cuentaVence(d.fecha) ? `, ${cuentaVence(d.fecha) === 1 ? "1 vencimiento" : `${cuentaVence(d.fecha)} vencimientos`}` : ""}`}
                  onClick={() => setDia(d.fecha)}
                  data-dia-destino={d.fecha >= hoyTexto ? d.fecha : undefined}
                  data-destino-activo={diaDestino === d.fecha ? "" : undefined}
                >
                  <span className="pn-dw" aria-hidden>{d.letra}</span>
                  <span className="pn-dn" aria-hidden>{d.numero}</span>
                  <span className="pn-dt" aria-hidden>
                    {Array.from({ length: Math.min(d.citas, 3) }, (_, i) => <i key={i} />)}
                    {cuentaVence(d.fecha) ? <i data-vence="" /> : null}
                  </span>
                </button>
              ))}
            </div>
            <button type="button" className="pn-iconbtn" aria-label="Semana siguiente" onClick={() => irA(salto + 1)}><Gesto nombre="derecha" tamano={18} /></button>
          </div>
          {interruptor}
        </div>
      ) : null}

      <div className="pn-ag-cuerpo">
        {preguntas.map((e) => (
          <div key={e.id} className="pn-ask pn-ask-linea ag-ask">
            <span className="ag-ask-icono" aria-hidden><Icono nombre="alerta" tamano={15} /></span>
            <span className="ag-ask-t">
              <span>Ya pasó · {e.fecha === hoyTexto ? "" : `${diaLargo(e.fecha)}, `}{e.hora ?? "sin hora"} </span>
              <b>{e.titulo}</b>
            </span>
            <button type="button" className="pn-sbtn" onClick={() => setComoFue(e.id)}>¿Cómo te fue?</button>
          </div>
        ))}

        {cargando ? <Cargando lineas={4} etiqueta="Cargando agenda" /> : null}
        {error ? <EstadoError texto={error} alReintentar={reintentar} /> : null}

        {!cargando && !error && vista === "calendario" && !telefono ? (
          <SemanaCuadro dias={tira} citas={citasSemana} vencen={vencenPorDia} tareas={tareasPorDia} hoy={hoyTexto} ahoraMin={ahoraMin}
            pidenComoFue={pidenComoFue} abierta={citaId} alAbrir={abrir} alMover={(ev, c) => void moverCita(ev, c)} alAbrirTarea={(id) => router.push(rutaAsunto(id))} alIr={(h) => router.push(h)} />
        ) : null}

        {!cargando && !error && vista === "calendario" && telefono ? (
          <>
            {sinHoraDia.length || cuentaVence(fechaDia) || (tareasPorDia.get(fechaDia)?.length ?? 0) ? (
              <GrupoLista titulo="Todo el día">
                {sinHoraDia.map((c) => (
                  <Fila key={c.id} titulo={c.titulo} subtitulo={subtitulo(c)} lado="Sin hora" alPulsar={() => abrir(c.id)}
                    detalle={pregunta(c.id) ? "¿Cómo te fue?" : undefined} tonoDetalle={pregunta(c.id) ? "aviso" : "normal"} />
                ))}
                {(vencenPorDia.get(fechaDia) ?? []).map(filaVence)}
                {(tareasPorDia.get(fechaDia) ?? []).map(filaTarea)}
              </GrupoLista>
            ) : null}
            {citasDia.some((e) => e.hora) ? (
              <DiaLineaDeTiempo citas={citasDia.filter((e) => e.hora)} esHoy={fechaDia === hoyTexto} ahoraMin={ahoraMin} pidenComoFue={pidenComoFue}
                alAbrir={abrir} alMover={(ev, m) => void moverCita(ev, { minutos: m })}
                alMoverDia={(ev, f) => void moverCita(ev, { fecha: f })} alSobreDia={setDiaDestino} />
            ) : !sinHoraDia.length ? (
              <div className="pn-tarjeta" style={{ display: "grid", gap: 10, justifyItems: "start", padding: "20px 16px" }}>
                <b style={{ fontSize: 16 }}>Día libre</b>
                <span style={{ fontSize: 14, color: "var(--ink-muted)" }}>{proxima ? `La próxima cita es el ${diaLargo(proxima)}.` : "No hay citas este día."}</span>
                <button type="button" className="pn-sbtn pn-sbtn-suave" onClick={() => setNueva({ modo: "linea" })}>Agendar una cita</button>
              </div>
            ) : null}
          </>
        ) : null}

        {!cargando && !error && vista === "lista" ? (
          <>
            {grupos.every((g) => g.citas.length === 0 && g.vencen.length === 0 && g.tareas.length === 0) ? (
              <div className="pn-tarjeta" style={{ display: "grid", gap: 10, justifyItems: "start", padding: "20px 16px" }}>
                <b style={{ fontSize: 16 }}>Semana libre</b>
                <span style={{ fontSize: 14, color: "var(--ink-muted)" }}>{proxima ? `La próxima cita es el ${diaLargo(proxima)}.` : "Las visitas, firmas y llamadas que se agenden aparecen aquí."}</span>
                {proxima ? <button type="button" className="pn-sbtn pn-sbtn-suave" onClick={() => irAFecha(proxima)}>Ver la próxima cita</button> : null}
              </div>
            ) : null}
            {grupos.filter((g) => g.citas.length || g.vencen.length || g.tareas.length).map((g) => (
              <GrupoLista key={g.fecha} titulo={g.titulo}>
                {g.citas.map((c) => (
                  <div
                    key={c.id} className="pn-agenda-mover" data-cita-id={c.id} draggable={!telefono}
                    onDragStart={(e) => { e.dataTransfer.setData(TIPO_ARRASTRE, c.id); e.dataTransfer.effectAllowed = "move"; }}
                    onDragEnd={() => setDiaDestino(null)}
                    onKeyDown={(e) => teclaDia(e, c.id)}
                  >
                    <Fila
                      titulo={c.titulo} subtitulo={subtitulo(c)}
                      detalle={c.empalme ? "Se empalma con otra cita" : pregunta(c.id) ? "¿Cómo te fue?" : undefined}
                      tonoDetalle={c.empalme || pregunta(c.id) ? "aviso" : "normal"}
                      lado={c.hora ?? "Sin hora"} alPulsar={() => abrir(c.id)}
                    />
                  </div>
                ))}
                {g.vencen.map(filaVence)}
                {g.tareas.map(filaTarea)}
              </GrupoLista>
            ))}
          </>
        ) : null}

        {masAdelante.length ? (
          <section className="pn-ag-mas" aria-labelledby="ag-mas">
            <h2 id="ag-mas" className="pn-h2" style={{ margin: 0 }}>Más adelante</h2>
            <div className="pn-tarjeta" style={{ overflow: "hidden" }}>
              {masAdelante.map((v) => {
                const n = enDias(v.fecha);
                const cuerpo = (
                  <>
                    <span className="pn-av" aria-hidden style={{ borderRadius: "var(--r-md)", color: "var(--warning)", background: "var(--warning-soft)" }}><Icono nombre="alerta" tamano={18} /></span>
                    <span style={{ flex: 1, minWidth: 0, display: "grid", gap: 1 }}><b>{v.titulo}</b><span>{v.detalle}</span></span>
                    <span className="pn-ag-en">en {n} {n === 1 ? "día" : "días"}</span>
                  </>
                );
                const destino = destinoVence(v);
                return destino
                  ? <a key={v.id} className="pn-ag-mas-fila" data-cerca={n <= 14 ? "" : undefined} href={destino} onClick={(e) => { e.preventDefault(); router.push(destino); }}>{cuerpo}</a>
                  : <div key={v.id} className="pn-ag-mas-fila" data-cerca={n <= 14 ? "" : undefined}>{cuerpo}</div>;
              })}
            </div>
          </section>
        ) : null}

      </div>

      {!telefono ? (
        <p className="as-vpie pn-kbd-linea pn-solo-escritorio">
          <span><kbd className="pn-kbd">N</kbd> nueva cita</span>
          <span><kbd className="pn-kbd">←</kbd> <kbd className="pn-kbd">→</kbd> semana</span>
          <span><kbd className="pn-kbd">T</kbd> hoy</span>
          <span><kbd className="pn-kbd">1</kbd> <kbd className="pn-kbd">2</kbd> semana o lista</span>
          <span><kbd className="pn-kbd">Esc</kbd> cerrar</span>
          <span>Arrastra una cita para cambiarla de hora o de día</span>
        </p>
      ) : null}

      <HojaAdaptable abierta={evAbierto !== null} titulo={evAbierto?.titulo ?? "Cita"} alCerrar={() => cerrar()}
        cabecera={<span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-muted)" }}>Cita</span>}>
        {evAbierto ? (
          <DetalleCita
            ev={evAbierto} empalme={Boolean(filaAbierta?.empalme)} hoy={hoy}
            persona={personaAbierta ?? undefined} sinPersona={!personaAbierta && Boolean(evAbierto.personaId || evAbierto.clienteId)}
            lead={evAbierto.leadId ? leads.datos.find((l) => l.id === evAbierto.leadId) : undefined}
            inmueble={evAbierto.propiedadSlug ? inmuebles.datos.find((p) => p.slug === evAbierto.propiedadSlug) : undefined}
            asunto={asuntoPanel ? { id: asuntoPanel.id, texto: [asuntoPanel.folio, asuntoPanel.nombre].filter(Boolean).join(" · ") || "Asunto" }
              : evAbierto.asuntoId ? { id: evAbierto.asuntoId, texto: "Abrir el asunto" }
              : exp ? { id: exp.id, texto: exp.titulo?.trim() || exp.folio || "Asunto" } : undefined}
            asesor={variosAsesores && evAbierto.asesorId ? nombreAsesor.get(evAbierto.asesorId) || undefined : undefined}
            pide={pidenComoFue.has(evAbierto.id)} ocupado={ocupado}
            alAnotar={() => setComoFue(evAbierto.id)}
            alNoLlego={() => void guardarComoFue(evAbierto, { estado: "no_llego", nota: "", siguiente: "", vence: null })}
            alMover={() => setMoviendo(evAbierto.id)}
            alCambiar={() => setCambiando(evAbierto.id)}
            alCancelar={() => void cancelarCita(evAbierto.id)}
          />
        ) : null}
      </HojaAdaptable>

      <HojaAdaptable abierta={evComoFue !== null} titulo="¿Cómo te fue?" descripcion={evComoFue ? `${evComoFue.titulo} · ${diaLargo(evComoFue.fecha)}${evComoFue.hora ? `, ${evComoFue.hora}` : ""}` : undefined} alCerrar={() => setComoFue(null)}>
        {evComoFue ? <ComoTeFue key={evComoFue.id} conAsunto={Boolean(evComoFue.expedienteId)} hoy={hoy} ocupado={ocupado} alGuardar={(r) => void guardarComoFue(evComoFue, r)} /> : null}
      </HojaAdaptable>

      <HojaAdaptable abierta={evMoviendo !== null} titulo="Mover" descripcion={evMoviendo?.titulo} alCerrar={() => setMoviendo(null)}>
        {evMoviendo ? <MoverCita key={evMoviendo.id} cita={evMoviendo} citas={datos} hoy={hoy} alMover={(c) => void moverCita(evMoviendo, c)} /> : null}
      </HojaAdaptable>

      <HojaAdaptable abierta={nueva !== null} titulo="Nueva cita" alCerrar={() => setNueva(null)}>
        {nueva?.modo === "linea" ? (
          <NuevaEnUnaLinea personas={directorio} citas={datos} hoy={hoy} asesorId={miAsesor} ocupado={ocupado}
            alAgendar={(d) => void guardarCita(d)} alDetalle={(d) => setNueva({ modo: "detalle", inicial: d.titulo ? d : inicialNueva })} />
        ) : nueva?.modo === "detalle" ? (
          <FormularioCita key="nueva" inicial={nueva.inicial} citas={datos} personas={directorio} inmuebles={inmuebles.datos} hoy={hoy} ocupado={ocupado}
            textoGuardar="Agendar" alGuardar={(d, persona) => void guardarCita(d, persona)} />
        ) : null}
      </HojaAdaptable>

      <HojaAdaptable abierta={evCambiando !== null} titulo="Cambiar datos" alCerrar={() => setCambiando(null)}>
        {evCambiando ? (
          <FormularioCita key={evCambiando.id} inicial={datosDeCita(evCambiando)} citas={datos.filter((e) => e.id !== evCambiando.id)}
            personas={directorio} antes={antesDe(evCambiando)} inmuebles={inmuebles.datos} hoy={hoy} ocupado={ocupado} textoGuardar="Guardar cambios"
            alGuardar={(d, persona) => void guardarCita(d, persona)} />
        ) : null}
      </HojaAdaptable>
    </div>
  );
}

/** useSearchParams pide un límite de Suspense. */
export default function PaginaAgenda() {
  return <Suspense fallback={<div className="pn-pagina"><Cargando lineas={4} etiqueta="Cargando agenda" /></div>}><Agenda /></Suspense>;
}
