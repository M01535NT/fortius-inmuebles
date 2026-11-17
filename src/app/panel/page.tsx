"use client";
import "./hoy.css";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useColeccion } from "@/components/panel/datos/use-coleccion";
import { DetalleHoy, FilaHoy, HojaAccionesHoy, HojaPosponer, sePuedeCerrar, type ModoHoja } from "@/components/panel/hoy/atender";
import { contextoCita, duracionTexto, FlotaCita, HojaCita, TarjetaCita, type DatosCita } from "@/components/panel/hoy/cita";
import { useAsuntosDeHoy, useMovimientosQueVencen, useTramitesDeHoy } from "@/components/panel/hoy/pendientes";
import { Gesto } from "@/components/panel/icons";
import { useAvisos } from "@/components/panel/kit/avisos";
import { useBuscarOCrear } from "@/components/panel/kit/barra";
import { Boton } from "@/components/panel/kit/boton";
import { Cargando, EstadoError } from "@/components/panel/kit/estados";
import { FiltrarYOrdenar, ResumenFiltros } from "@/components/panel/kit/filtrar-ordenar";
import { Segmentado } from "@/components/panel/kit/segmentado";
import type { Evento, Lead } from "@/lib/domain/records";
import { aTexto, diaLargo } from "@/lib/panel/calendario";
import { citasDelDia, DURACION_MIN, proximaFecha, siguienteCita } from "@/lib/panel/datos/agenda";
import { filasAsuntos } from "@/lib/panel/datos/asuntos";
import { leerVencimientos } from "@/lib/panel/datos/colecciones";
import { filaConsulta, pestanaDe } from "@/lib/panel/datos/consultas";
import { atender, programar } from "@/lib/panel/datos/consultas-acciones";
import { completarTarea, tareasDeHoy, vencimientosDeContratos, type ContratoServidor } from "@/lib/panel/datos/hoy";
import {
  citaTerminada, fechaTitulo, filtrarHoy, itemsDeHoy, ordenarHoy, resumenManana,
  type ItemHoy, type OrdenHoy, type VistaHoy,
} from "@/lib/panel/datos/hoy-atender";
import { horaPerdida, posponerTarea, textoPospuesta } from "@/lib/panel/datos/posponer";
import { entre, vencenAsuntos, vencenMovimientos, vencenTramites } from "@/lib/panel/datos/vencimientos";
import { rutaTramite } from "@/lib/panel/datos/hoy-pendientes";
import { rutaCita, rutaConsulta } from "@/lib/panel/datos/relacionado";
import { isTaskOpen, type Task } from "@/lib/tasks";

type Bloque<T> = { cargando: boolean; error: string | null; datos: T[] };

/** Vencimientos de contratos con su propio estado y reintento: si falla, lo demás sigue a la vista (AUD-03, H4). */
function useVencimientos() {
  const [estado, setEstado] = useState<Bloque<ContratoServidor>>({ cargando: true, error: null, datos: [] });
  const [intento, setIntento] = useState(0);
  useEffect(() => {
    const control = new AbortController();
    leerVencimientos<ContratoServidor>(control.signal).then(
      (datos) => setEstado({ cargando: false, error: null, datos }),
      (e: unknown) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setEstado({ cargando: false, error: e instanceof Error ? e.message : "No se pudieron cargar los vencimientos.", datos: [] });
      },
    );
    return () => control.abort();
  }, [intento]);
  const reintentar = useCallback(() => { setEstado((s) => ({ ...s, cargando: true, error: null })); setIntento((n) => n + 1); }, []);
  return { ...estado, reintentar };
}

const VISTAS: { valor: VistaHoy; etiqueta: string }[] = [
  { valor: "todo", etiqueta: "Todo" }, { valor: "vencido", etiqueta: "Vencido" }, { valor: "hoy", etiqueta: "Hoy" },
];
const ORDENES: { valor: OrdenHoy; etiqueta: string }[] = [
  { valor: "vencido", etiqueta: "Lo vencido primero" }, { valor: "solicitudes", etiqueta: "Las solicitudes primero" },
];
/** Mucho trabajo (DECISIONES, Inicio): 5 filas como máximo y «Ver los N restantes». */
const MAXIMO = 5;
/** Cobros y fechas clave vencidos que siguen en «Atender primero»; los más viejos ya los avisa su asunto. */
const DIAS_ATRAS = 30;
/** Lo que dura la salida de una fila al marcarla hecha (boceto: 200 ms). Sin movimiento, sale al instante. */
const SALIDA_MS = 200;
const sinMovimiento = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Hoy (boceto «Inicio»): «Atender primero» junta en una lista lo que pide acción hoy (tareas, consultas del sitio,
 * trámites donde toca preguntar y contratos vencidos). A la derecha en escritorio: la próxima cita, la agenda de hoy
 * y cómo van los asuntos; en el teléfono la próxima cita flota sobre la barra de abajo.
 */
export default function Hoy() {
  const [hoy] = useState(() => new Date());
  const hoyTexto = aTexto(hoy);
  const mananaTexto = aTexto(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1));
  const [ahora, setAhora] = useState(() => Date.now());
  const leads = useColeccion<Lead>("leads", { refrescarCada: 90_000 });
  const eventos = useColeccion<Evento>("eventos", { refrescarCada: 90_000 });
  const tareas = useColeccion<Task>("tareas", { refrescarCada: 90_000 });
  const contratos = useVencimientos();
  const tramites = useTramitesDeHoy(hoyTexto);
  // «Vence pronto» y «Te deben» no van en Hoy (titular, 16/11/2026): lo que vence entra en «Atender primero» el día
  // que toca y los próximos días se ven en la Agenda; lo que se debe, en Dinero.
  const deben = useAsuntosDeHoy();
  const movimientos = useMovimientosQueVencen();
  const { avisar } = useAvisos();
  const buscarOCrear = useBuscarOCrear();
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [vista, setVista] = useState<VistaHoy>("todo");
  const [orden, setOrden] = useState<OrdenHoy>("vencido");
  const [soloSitio, setSoloSitio] = useState(false);
  const [todos, setTodos] = useState(false);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [eligeFecha, setEligeFecha] = useState<ItemHoy | null>(null);
  const [hoja, setHoja] = useState<{ id: string; modo: ModoHoja } | null>(null);
  const [verCita, setVerCita] = useState(false);
  const [verTerminadas, setVerTerminadas] = useState(false);
  const [saliendo, setSaliendo] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setInterval(() => setAhora(Date.now()), 60_000);
    return () => window.clearInterval(t);
  }, []);

  const asuntos = useMemo(
    () => filasAsuntos(deben.expedientes, { personas: deben.personas, inmuebles: deben.inmuebles, tareas: tareas.datos, hoy: hoyTexto }),
    [deben.expedientes, deben.personas, deben.inmuebles, tareas.datos, hoyTexto],
  );
  const vencen = useMemo(() => vencimientosDeContratos(contratos.datos, hoy), [contratos.datos, hoy]);
  // Vencimientos de Trámites (esperas), Dinero (cobros) y los asuntos (fecha clave).
  const otrosVencen = useMemo(() => {
    const titulos = new Map(asuntos.map((a) => [a.id, a.titulo]));
    return [...vencenTramites(tramites.datos), ...vencenMovimientos(movimientos.datos, (id) => titulos.get(id)), ...vencenAsuntos(deben.expedientes, asuntos)];
  }, [tramites.datos, movimientos.datos, deben.expedientes, asuntos]);
  // Una solicitud del sitio pospuesta vuelve a «Atender primero» el día que se eligió.
  const leadsDeHoy = useMemo(() => leads.datos.filter((l) => !(pestanaDe(l) === "por_atender" && (l.perfil?.proximoContacto ?? "") > hoyTexto)), [leads.datos, hoyTexto]);
  const items = useMemo(() => {
    const lineas = new Map(asuntos.map((a) => [a.id, a.linea]));
    const titulos = new Map(deben.inmuebles.map((p) => [p.slug, p.titulo]));
    const desde = aTexto(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - DIAS_ATRAS));
    return itemsDeHoy({
      tareas: tareasDeHoy(tareas.datos, hoyTexto),
      consultas: leadsDeHoy.map((l) => filaConsulta(l, ahora, (s) => titulos.get(s))),
      tramites: tramites.filas, tonosTramite: tramites.tonos, contratosVencidos: vencen.filter((v) => v.dias <= 0),
      // Las esperas de hoy ya llegan como trámites (con «Toca preguntar»); aquí, cobros y fechas clave.
      vencen: entre(otrosVencen, desde, hoyTexto).filter((v) => v.clase !== "tramite"),
      lineaAsunto: (id) => lineas.get(id), hoy: hoyTexto, rutaConsulta, rutaTramite,
    });
  }, [asuntos, deben.inmuebles, tareas.datos, leadsDeHoy, tramites.filas, tramites.tonos, vencen, otrosVencen, ahora, hoy, hoyTexto]);
  // Con «Solo solicitudes del sitio» los contadores del segmento cuentan solo esas (boceto).
  const base = useMemo(() => filtrarHoy(items, "todo", soloSitio), [items, soloSitio]);
  const visibles = useMemo(() => ordenarHoy(filtrarHoy(items, vista, soloSitio), orden), [items, vista, soloSitio, orden]);
  const mostrados = todos ? visibles : visibles.slice(0, MAXIMO);
  const sinResponder = items.filter((i) => i.delSitio).length;
  const vencidosOcultos = todos || vista !== "todo" ? 0 : visibles.slice(MAXIMO).filter((i) => i.vencido).length;
  const elegido = items.find((i) => i.id === abierto) ?? null;
  const enHoja = hoja ? items.find((i) => i.id === hoja.id) ?? null : null;

  // Citas: todas las de hoy que faltan (la que sigue también va en la tarjeta); las terminadas se pliegan.
  const citas = useMemo(() => citasDelDia(eventos.datos, hoyTexto), [eventos.datos, hoyTexto]);
  const tipos = useMemo(() => Object.fromEntries(eventos.datos.map((e) => [e.id, e.tipo])) as Record<string, Evento["tipo"]>, [eventos.datos]);
  const minutosAhora = new Date(ahora).getHours() * 60 + new Date(ahora).getMinutes();
  const durDe = useCallback((id: string) => DURACION_MIN[tipos[id] ?? "otro"] ?? 30, [tipos]);
  const sigue = useMemo(() => siguienteCita(citas, tipos, minutosAhora), [citas, tipos, minutosAhora]);
  const terminadas = citas.filter((c) => citaTerminada(c.hora, durDe(c.id), minutosAhora));
  const faltan = citas.filter((c) => !citaTerminada(c.hora, durDe(c.id), minutosAhora));
  const datosDe = useCallback((c: (typeof citas)[number]): DatosCita => ({
    fila: c, tipo: tipos[c.id] ?? "otro",
    cliente: c.clienteId ? deben.personas.find((p) => p.id === c.clienteId) : undefined,
    lead: c.leadId ? leads.datos.find((l) => l.id === c.leadId) : undefined,
    inmueble: c.propiedadSlug ? deben.inmuebles.find((p) => p.slug === c.propiedadSlug) : undefined,
  }), [tipos, deben.personas, deben.inmuebles, leads.datos]);
  const datosSigue = sigue ? datosDe(sigue) : null;
  const proxima = useMemo(() => {
    const fecha = proximaFecha(eventos.datos, mananaTexto);
    if (!fecha) return null;
    const primera = citasDelDia(eventos.datos, fecha)[0];
    return { id: primera.id, texto: `${fecha === mananaTexto ? "Mañana" : diaLargo(fecha)}${primera.hora ? ` a las ${primera.hora}` : ""} · ${primera.titulo}` };
  }, [eventos.datos, mananaTexto]);
  const manana = useMemo(() => resumenManana(
    citasDelDia(eventos.datos, mananaTexto).length,
    tareas.datos.filter((t) => isTaskOpen(t) && t.vence === mananaTexto).length,
  ), [eventos.datos, tareas.datos, mananaTexto]);

  const enCurso = asuntos.filter((a) => a.estado === "activo");
  const mosaicos = [
    { n: enCurso.length, t: "Activos" },
    { n: asuntos.filter((a) => a.estado === "espera").length, t: "En espera" },
    { n: enCurso.filter((a) => !a.sigue).length, t: "Sin siguiente paso", aviso: true },
  ];

  const tareaDe = (i: ItemHoy) => (i.tarea ? tareas.datos.find((t) => t.id === i.tarea?.id) ?? i.tarea : null);
  /** Guarda, avisa con Deshacer y dice si se guardó. El texto puede depender de lo que devolvió el servidor. */
  const conDeshacer = async <T,>(i: ItemHoy, guardar: (id: string, d: T) => Promise<T>, id: string, antes: T, despues: T, texto: string | ((guardado: T) => string)): Promise<boolean> => {
    setOcupado(i.id);
    try {
      const guardado = await guardar(id, despues);
      avisar(typeof texto === "string" ? texto : texto(guardado), { etiqueta: "Deshacer", alAccionar: () => {
        guardar(id, antes).then(() => avisar("Se deshizo"), (e: unknown) => avisar(e instanceof Error ? e.message : "No se pudo deshacer."));
      } });
      return true;
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se guardó. Vuelve a intentarlo.");
      return false;
    } finally { setOcupado(null); }
  };
  const cerrar = (i: ItemHoy): Promise<boolean> => {
    if (i.clase === "consulta") {
      const l = leads.datos.find((x) => x.id === i.consultaId);
      return l ? conDeshacer(i, leads.guardar, l.id, l, atender(l, null), "Solicitud atendida") : Promise.resolve(false);
    }
    const t = tareaDe(i);
    return t ? conDeshacer(i, tareas.guardar, t.id, t, completarTarea(t), "Marcada como hecha") : Promise.resolve(false);
  };
  // «Hecho» (boceto): la casilla se llena y la fila se apaga y se pliega; al terminar se guarda. Si falla, vuelve.
  const hecha = (i: ItemHoy) => {
    if (!sePuedeCerrar(i) || saliendo) return;
    setSaliendo(i.id);
    window.setTimeout(() => { void cerrar(i).then(() => setSaliendo(null)); }, sinMovimiento() ? 0 : SALIDA_MS);
  };
  const pospuesta = (i: ItemHoy, fecha: string, hora: string | null) => {
    const ahoraFecha = new Date();
    if (i.clase === "consulta") {
      const l = leads.datos.find((x) => x.id === i.consultaId);
      if (l) void conDeshacer(i, leads.guardar, l.id, l, programar(l, fecha, l.perfil?.proximaAccion ?? ""), textoPospuesta(fecha, null, ahoraFecha));
      return;
    }
    const t = tareaDe(i);
    // Respaldo: si el servidor todavía no guarda la hora, la tarea queda solo con su día y el aviso lo dice.
    if (t) void conDeshacer(i, tareas.guardar, t.id, t, posponerTarea(t, fecha, hora, ahoraFecha), (g) => (horaPerdida(hora, g)
      ? `${textoPospuesta(fecha, null, ahoraFecha)}. La hora todavía no se guarda.`
      : textoPospuesta(fecha, hora, ahoraFecha)));
  };
  const acciones = {
    hoy, ocupado, saliendo,
    alHecha: hecha,
    alPosponer: pospuesta,
    alElegirFecha: (i: ItemHoy) => setEligeFecha(i),
  };

  const cargandoLista = (tareas.cargando || leads.cargando) && !items.length;
  const limpiar = () => { setSoloSitio(false); setOrden("vencido"); };
  const resumen = [soloSitio ? "Solo solicitudes" : null, orden !== "vencido" ? "Solicitudes primero" : null].filter((x): x is string => Boolean(x));
  const errores: { titulo: string; texto: string; alReintentar: () => void }[] = [
    tareas.error ? { titulo: "No se pudieron leer las tareas", texto: tareas.error, alReintentar: tareas.reintentar } : null,
    leads.error ? { titulo: "No se pudieron leer las consultas", texto: leads.error, alReintentar: leads.reintentar } : null,
    tramites.error ? { titulo: "No se pudieron leer los trámites", texto: tramites.error, alReintentar: tramites.reintentar } : null,
    contratos.error ? { titulo: "No se pudieron leer los vencimientos", texto: contratos.error, alReintentar: contratos.reintentar } : null,
    deben.error ? { titulo: "No se pudieron leer los asuntos", texto: deben.error, alReintentar: deben.reintentar } : null,
    movimientos.error ? { titulo: "No se pudieron leer los cobros", texto: movimientos.error, alReintentar: movimientos.reintentar } : null,
  ].filter((x): x is NonNullable<typeof x> => Boolean(x));
  const pendientesTexto = items.length === 0 ? "nada pendiente" : items.length === 1 ? "1 pendiente" : `${items.length} pendientes`;

  const filaCita = (c: (typeof citas)[number], terminada = false) => {
    const d = datosDe(c);
    const dur = duracionTexto(durDe(c.id));
    return (
      <li key={c.id}>
        <Link href={rutaCita(c.id)} data-terminada={terminada ? "" : undefined}>
          <span className="pn-hoy-ag-h">{c.hora ?? "—"}<small>{dur}</small></span>
          <span className="pn-hoy-ag-b" data-tipo={tipos[c.id]} aria-hidden />
          <span className="pn-hoy-ag-x">
            <b>{c.titulo}</b>
            <span>{contextoCita(d)}<span className="pn-hoy-ag-dur"> · {dur}</span>{c.empalme ? " · se empalma con otra cita" : ""}</span>
          </span>
        </Link>
      </li>
    );
  };

  return (
    <div className="pn-pagina" data-con-flota={sigue ? "" : undefined}>
      <header className="pn-encabezado">
        <div>
          <h1 className="pn-h1">Hoy</h1>
          <p className="pn-sub">{fechaTitulo(hoy)}{cargandoLista ? "" : ` · ${pendientesTexto}`}</p>
        </div>
        <div className="pn-solo-ancho"><Boton onClick={() => buscarOCrear()}><Gesto nombre="mas" tamano={16} />Nuevo</Boton></div>
      </header>

      <div className="pn-hoy-cols">
        <section className="pn-hoy-izq" aria-labelledby="hoy-atender">
          <div className="pn-hoy-cab">
            <h2 id="hoy-atender" className="pn-h2">Atender primero</h2>
            <div className="pn-hoy-pega">
              <div className="pn-hoy-ctl">
                <Segmentado
                  etiqueta="Qué ver" sinEtiqueta valor={vista} alElegir={(v) => { setVista(v); setTodos(false); }}
                  opciones={VISTAS.map((v) => ({ ...v, cuenta: filtrarHoy(base, v.valor, false).length }))}
                />
                <FiltrarYOrdenar
                  orden={orden} ordenes={ORDENES} alOrdenar={setOrden} resultado={visibles.length} nombreResultado={["pendiente", "pendientes"]} alQuitar={limpiar}
                  interruptores={[{ etiqueta: "Solo solicitudes del sitio", valor: soloSitio, alCambiar: setSoloSitio, cuenta: sinResponder }]}
                />
              </div>
              <ResumenFiltros partes={resumen} alLimpiar={limpiar} />
            </div>
          </div>
          {sinResponder && !soloSitio && vista !== "vencido" ? (
            <button type="button" className="pn-linea-aviso" onClick={() => { setSoloSitio(true); setVista("todo"); setTodos(false); }}>
              <span>{sinResponder === 1 ? "1 solicitud del sitio sin responder" : `${sinResponder} solicitudes del sitio sin responder`}</span>
              <span>Verlas</span>
            </button>
          ) : null}
          {errores.map((e) => <EstadoError key={e.titulo} titulo={e.titulo} texto={e.texto} alReintentar={e.alReintentar} />)}
          {cargandoLista ? <Cargando lineas={4} etiqueta="Cargando lo de hoy" /> : (
            <div className="pn-hoy-lista">
              {visibles.length ? (
                <>
                  {mostrados.map((i) => <FilaHoy key={i.id} item={i} {...acciones} alAbrir={(x) => setAbierto(x.id)} alHoja={(x, modo) => setHoja({ id: x.id, modo })} />)}
                  {visibles.length > MAXIMO ? (
                    <button type="button" className="pn-hoy-mas" onClick={() => setTodos((v) => !v)}>
                      {todos ? "Ver menos" : `Ver los ${visibles.length - MAXIMO} restantes`}
                    </button>
                  ) : null}
                </>
              ) : (
                <div className="pn-hoy-vacio">
                  <span className="pn-hoy-vacio-ic" aria-hidden><Gesto nombre="palomita" tamano={18} /></span>
                  <span>
                    <b>{items.length ? "Nada coincide" : "Todo al día"}</b>
                    <span>{items.length ? "Cambia lo que ves o quita los ajustes." : manana}</span>
                  </span>
                </div>
              )}
            </div>
          )}
          {vencidosOcultos ? (
            <button type="button" className="pn-hoy-linea" onClick={() => { setVista("vencido"); setTodos(false); }}>
              <span className="pn-warnline">{vencidosOcultos === 1 ? "1 vencido más" : `${vencidosOcultos} vencidos más`}</span>
              <span>Revisar</span>
            </button>
          ) : null}
          {visibles.length ? (
            <p className="pn-kbd-linea pn-hoy-teclas">
              <span>Clic derecho en una fila para sus acciones · con la fila enfocada: <kbd className="pn-kbd">E</kbd> hecha · <kbd className="pn-kbd">P</kbd> posponer</span>
            </p>
          ) : null}

        </section>

        <aside className="pn-hoy-der" aria-label="Tu día">
          {eventos.error ? <EstadoError titulo="No se pudo leer la agenda" texto={eventos.error} alReintentar={eventos.reintentar} /> : null}
          {eventos.cargando ? <Cargando lineas={3} etiqueta="Cargando las citas de hoy" /> : null}
          {!eventos.cargando && datosSigue ? <TarjetaCita datos={datosSigue} minutosAhora={minutosAhora} alAbrir={() => setVerCita(true)} /> : null}

          {!eventos.cargando && !eventos.error ? (
            <section className="pn-hoy-bloque" aria-labelledby="hoy-agenda">
              <div className="pn-bloque-cab">
                <h2 id="hoy-agenda" className="pn-h2">Agenda de hoy</h2>
                <Link href="/panel/agenda" className="pn-hoy-ver">Ver agenda</Link>
              </div>
              {faltan.length || (terminadas.length && verTerminadas) ? (
                <ol className="pn-hoy-ag">
                  {verTerminadas ? terminadas.map((c) => filaCita(c, true)) : null}
                  {faltan.map((c) => filaCita(c))}
                </ol>
              ) : (
                <p className="pn-hoy-nada">
                  {citas.length ? "Ya no quedan citas hoy." : "Sin citas hoy."}
                  {proxima ? <> La próxima: <Link href={rutaCita(proxima.id)}>{proxima.texto}</Link></> : null}
                  {" "}<Link href="/panel/agenda?nueva=1">Agendar visita</Link>
                </p>
              )}
              {terminadas.length ? (
                <button type="button" className="pn-hoy-plegar" aria-expanded={verTerminadas} onClick={() => setVerTerminadas((v) => !v)}>
                  {verTerminadas ? "Ocultar las terminadas" : terminadas.length === 1 ? "1 cita terminada" : `${terminadas.length} citas terminadas`}
                </button>
              ) : null}
            </section>
          ) : null}

          {!deben.cargando && !deben.error ? (
            <section className="pn-hoy-bloque" aria-labelledby="hoy-asuntos">
              <div className="pn-bloque-cab">
                <h2 id="hoy-asuntos" className="pn-h2">Asuntos en curso</h2>
                <Link href="/panel/asuntos" className="pn-enlace-suave">Ver todos</Link>
              </div>
              <div className="pn-mosaicos">
                {mosaicos.map((m) => (
                  <Link key={m.t} href="/panel/asuntos" className="pn-mosaico" data-tono={m.aviso ? "aviso" : undefined} aria-label={`${m.t}: ${m.n}`}>
                    <b>{m.n}</b><span>{m.t}</span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </aside>
      </div>

      {datosSigue ? <FlotaCita datos={datosSigue} minutosAhora={minutosAhora} alAbrir={() => setVerCita(true)} /> : null}

      <DetalleHoy item={elegido} alCerrar={() => setAbierto(null)} {...acciones} />
      <HojaAccionesHoy item={enHoja} modo={hoja?.modo ?? "menu"} alCerrar={() => setHoja(null)} alModo={(modo) => setHoja((h) => (h ? { ...h, modo } : h))}
        hoy={hoy} alHecha={acciones.alHecha} alPosponer={acciones.alPosponer} alElegirFecha={acciones.alElegirFecha} alAbrir={(x) => setAbierto(x.id)} />
      <HojaPosponer item={eligeFecha} hoy={hoy} alCerrar={() => setEligeFecha(null)} alElegir={(i, f) => acciones.alPosponer(i, f, null)} />
      <HojaCita datos={datosSigue} minutosAhora={minutosAhora} abierta={verCita && Boolean(datosSigue)} alCerrar={() => setVerCita(false)} />
    </div>
  );
}
