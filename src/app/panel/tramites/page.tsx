"use client";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useLoLleva } from "@/components/panel/datos/lo-lleva";
import { useColeccion } from "@/components/panel/datos/use-coleccion";
import { opcionesPersona, personaDe, useDirectorio, vistaDeCliente, type PersonaVista } from "@/components/panel/datos/persona-vista";
import { useFichaEnDireccion } from "@/components/panel/datos/use-ficha-url";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Boton } from "@/components/panel/kit/boton";
import { Campo } from "@/components/panel/kit/campo";
import { Desplegable } from "@/components/panel/kit/desplegable";
import { Cargando, EstadoError } from "@/components/panel/kit/estados";
import { Fila, GrupoLista } from "@/components/panel/kit/lista";
import { BotonFiltros, ResumenFiltros, type GrupoFiltro } from "@/components/panel/fichas/piezas";
import { Renglon, TramoLista } from "@/components/panel/fichas/renglon";
import { Icono } from "@/components/panel/icons";
import { DetalleTramite, type PedidoDetalle } from "@/components/panel/tramites/detalle";
import "@/components/panel/asunto/asunto.css";
import "@/components/panel/asunto/caso.css";
import "@/components/panel/fichas/modelo.css";
import { HojaAdaptable } from "@/components/panel/ui/hoja-adaptable";
import type { Property } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import type { Archivo, Asesor, Evento } from "@/lib/domain/records";
import { completarTarea } from "@/lib/panel/datos/hoy";
import type { Task } from "@/lib/tasks";
import { aTexto, diaLargo } from "@/lib/panel/calendario";
import { leerMiAsesor } from "@/lib/panel/datos/colecciones";
import {
  alternarPendiente, anotarTramite, avisoAlCerrar, cerrarPaso, fecharPendiente, filaTramite, filtrarPorTramite, filtrarTramites, marcarPago, NOMBRE_GRUPO,
  ordenarTramites, ponerEnEspera, quitarEspera, reabrirPaso, tareaDeTramite, tareasDeTramite, yaRespondieron, type GrupoTramite,
} from "@/lib/panel/datos/tramites";
import {
  agregarParte, avanzarParte, catalogoPorCategoria, GUIAS, nuevoTramiteGuia, reabrirParte, reabrirTramite, terminarPartes, vistaTramite,
  type TipoTramite,
} from "@/lib/panel/datos/tramites-guias";
import { archivoFromUpload, resolveFileUrl, uploadFile } from "@/lib/panel/legado/archivos";
import { ACREEDORES, esHipoteca, nuevoTramite, type Acreedor, type CualquierTramite, type TramiteGuia } from "@/lib/tramites";

/**
 * Trámites (PN-07) con el orden del modelo visual («Inmuebles»): la columna de la lista con su barra de 52 px (Filtrar y
 * Nuevo), el buscador y los grupos por lo que toca (Hoy, con «Anotar respuesta» en el renglón; Esperando, con los días que
 * faltan; En curso) y los listos al final detrás de un enlace. El trámite se abre a la derecha como un solo checklist
 * (`DetalleTramite`), con Tarea y Avance en su barra; en el teléfono, uno a la vez. Atajos: J y K, N, T y R.
 * La cancelación de hipoteca (TRA-01) tiene sus reglas en la base; las demás guías se guardan desde la migración
 * 20261116130000_tramites_por_tipo (sin aplicar todavía: hasta entonces el aviso lo dice y no se rompe nada).
 */
function Tramites() {
  const tramites = useColeccion<CualquierTramite>("tramites");
  const archivos = useColeccion<Archivo>("archivos");
  // Propietario o persona: se elige del Directorio. La lista vieja solo da el nombre de los trámites de antes que la traen.
  const directorio = useDirectorio();
  const clientes = useColeccion<Cliente>("clientes");
  const conocidas = useMemo(() => [...directorio, ...clientes.datos.map(vistaDeCliente)], [directorio, clientes.datos]);
  const inmuebles = useColeccion<Property>("propiedades");
  const asesores = useColeccion<Asesor>("asesores");
  const tareas = useColeccion<Task>("tareas");
  const eventos = useColeccion<Evento>("eventos");
  const { avisar } = useAvisos();
  const [miAsesor, setMiAsesor] = useState<string | null>(null);
  useEffect(() => { const c = new AbortController(); leerMiAsesor(c.signal).then(setMiAsesor); return () => c.abort(); }, []);
  const [hoy] = useState(() => aTexto(new Date()));
  const [buscar, setBuscar] = useState("");
  const [verListos, setVerListos] = useState(false);
  const [tiposF, setTiposF] = useState<Set<string>>(new Set());
  const [dondeF, setDondeF] = useState<Set<string>>(new Set());
  const [creando, setCreando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [pedido, setPedido] = useState<PedidoDetalle>(null);
  const { abierta, abrir, cerrar } = useFichaEnDireccion();
  const orden = useRef<string[]>([]);
  const abiertaRef = useRef<string | null>(null);
  const abrirRef = useRef(abrir);
  const pedir = (tipo: NonNullable<PedidoDetalle>["tipo"], id: string) => setPedido((p) => ({ tipo, id, n: (p?.n ?? 0) + 1 }));

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (t?.closest("[role=dialog]:not([data-lateral])")) return;
      const k = e.key.toLowerCase();
      if (k === "n") { e.preventDefault(); setCreando(true); return; }
      // T (tarea) y R (avance) actúan sobre el trámite abierto.
      if ((k === "t" || k === "r") && abiertaRef.current) { e.preventDefault(); const id = abiertaRef.current; setPedido((p) => ({ tipo: k === "t" ? "tarea" : "avance", id, n: (p?.n ?? 0) + 1 })); return; }
      // J y K recorren la lista (lo que se ve, en orden), como el boceto.
      if ((k !== "j" && k !== "k") || !orden.current.length) return;
      e.preventDefault();
      const ids = orden.current;
      const i = ids.indexOf(abiertaRef.current ?? "");
      abrirRef.current(ids[k === "j" ? (i + 1) % ids.length : (i <= 0 ? ids.length - 1 : i - 1)]);
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, []);

  const filas = useMemo(() => ordenarTramites(tramites.datos.map((t) => filaTramite(t, conocidas, hoy)), tramites.datos), [tramites.datos, conocidas, hoy]);
  // «Lo lleva» (PN-10): el director puede quedarse con los trámites de un asesor o con los suyos.
  const asesorDe = useMemo(() => new Map(tramites.datos.map((x) => [x.id, x.asesorId])), [tramites.datos]);
  const loLleva = useLoLleva(useMemo(() => [...asesorDe.values()], [asesorDe]), miAsesor, asesores.datos);
  const visibles = useMemo(() => filtrarPorTramite(filtrarTramites(filas.filter((f) => loLleva.pasa(asesorDe.get(f.id))), buscar), { tipos: tiposF, donde: dondeF }),
    [filas, buscar, loLleva, asesorDe, tiposF, dondeF]);
  const grupos = (["hoy", "esperando", "en_curso"] as GrupoTramite[]).map((g) => ({ g, filas: visibles.filter((f) => f.grupo === g) })).filter((x) => x.filas.length);
  const listos = visibles.filter((f) => f.grupo === "listo");
  const activos = filas.filter((f) => f.grupo !== "listo");
  const ordenVisible = (verListos ? listos.map((f) => f.id) : grupos.flatMap((x) => x.filas.map((f) => f.id))).join("|");
  // Filtro (boceto «Filtrar»): tipo de trámite y dónde está. Las opciones salen de los trámites que hay.
  const alternar = (set: (f: (s: Set<string>) => Set<string>) => void, v: string) => set((s) => { const n = new Set(s); if (n.has(v)) n.delete(v); else n.add(v); return n; });
  const tiposHay = useMemo(() => [...new Set(filas.map((f) => f.categoria))], [filas]);
  const dondeHay = useMemo(() => [...new Set(filas.map((f) => f.dondeEsta).filter(Boolean))], [filas]);
  const gruposFiltro: GrupoFiltro[] = [
    ...(tiposHay.length ? [{ titulo: "Tipo de trámite", tipo: "check" as const, opciones: tiposHay.map((c) => ({
      etiqueta: c, cuenta: filas.filter((f) => f.categoria === c).length, activa: tiposF.has(c), alPulsar: () => alternar(setTiposF, c),
    })) }] : []),
    ...(dondeHay.length ? [{ titulo: "Dónde está", tipo: "check" as const, opciones: dondeHay.map((d) => ({
      etiqueta: d, cuenta: filas.filter((f) => f.dondeEsta === d).length, activa: dondeF.has(d), alPulsar: () => alternar(setDondeF, d),
    })) }] : []),
  ];
  const filtrosPuestos = (tiposF.size ? 1 : 0) + (dondeF.size ? 1 : 0) + (loLleva.activo ? 1 : 0);
  const limpiarFiltros = () => { setTiposF(new Set()); setDondeF(new Set()); loLleva.quitar(); };
  const resumenFiltros = [...tiposF, ...dondeF].join(" · ");
  useEffect(() => { orden.current = ordenVisible ? ordenVisible.split("|") : []; abiertaRef.current = abierta; abrirRef.current = abrir; });
  const t = tramites.datos.find((x) => x.id === abierta) ?? null;
  const persona = t ? personaDe(t, directorio, clientes.datos) : null;
  const inmueble = t?.propiedadSlug ? inmuebles.datos.find((p) => p.slug === t.propiedadSlug)?.titulo ?? "" : "";
  const documentos = t ? archivos.datos.filter((a) => a.tramiteId === t.id) : [];
  const tareasT = t ? tareasDeTramite(tareas.datos, t.id) : [];
  const firma = (t && asesores.datos.find((a) => a.id === t.asesorId)?.nombre) || "Fortius Inmuebles";
  const vista = t ? vistaTramite(t) : null;
  const verDocumento = useCallback((d: Archivo) => resolveFileUrl(d.url), []);

  /** Guarda el trámite con su versión; con `previo`, el aviso ofrece Deshacer. */
  const guardar = async (siguiente: CualquierTramite, aviso: string | null, previo?: CualquierTramite): Promise<boolean> => {
    setOcupado(true);
    try {
      await tramites.guardar(siguiente.id, siguiente);
      if (aviso) avisar(aviso, previo ? { etiqueta: "Deshacer", alAccionar: () => {
        const vigente = tramites.datos.find((x) => x.id === previo.id);
        tramites.guardar(previo.id, { ...previo, notas: vigente?.notas ?? previo.notas }).then(() => avisar("Se deshizo"), (e: unknown) => avisar(e instanceof Error ? e.message : "No se pudo deshacer."));
      } } : undefined);
      return true;
    } catch (e) {
      const m = e instanceof Error ? e.message : "";
      // Antes de aplicar 20261116130000_tramites_por_tipo la base solo conoce la cancelación de hipoteca.
      avisar(!esHipoteca(siguiente) && /inválid/i.test(m) ? "Este tipo de trámite se podrá guardar cuando se actualice la base. La cancelación de hipoteca ya funciona." : m || "No se guardó. Vuelve a intentarlo.");
      return false;
    } finally { setOcupado(false); }
  };
  const guia = (fn: (g: TramiteGuia) => TramiteGuia, aviso: string | null, conDeshacer = true) => {
    if (t && !esHipoteca(t)) return guardar(fn(t), aviso, conDeshacer ? t : undefined);
    return Promise.resolve(false);
  };

  const crear = async (d: NuevoDatos) => {
    const id = `tra-${crypto.randomUUID()}`;
    const base = d.tipo === "cancelacion_hipoteca"
      ? nuevoTramite({ id, acreedor: d.acreedor, titulo: d.titulo, personaId: d.personaId, asesorId: d.asesorId, propiedadSlug: d.propiedadSlug })
      : nuevoTramiteGuia({ id, tipo: d.tipo, titulo: d.titulo, personaId: d.personaId, asesorId: d.asesorId, propiedadSlug: d.propiedadSlug });
    const nuevo = { ...base, creadoEl: new Date().toISOString() };
    if (await guardar(nuevo, `Trámite abierto: ${GUIAS[d.tipo].nombre}`)) { setCreando(false); abrir(nuevo.id); }
  };

  const fila = (f: (typeof visibles)[number], g: GrupoTramite) => (
    <Renglon key={f.id} className="tra-it"
      izquierda={<span className="fm-punto" data-tono={g === "hoy" ? "aviso" : g === "en_curso" ? "acento" : g === "listo" ? "bien" : undefined} aria-hidden />}
      titulo={f.titulo} subtitulo={f.linea} detalle={f.estado} tonoDetalle={g === "hoy" ? "aviso" : "normal"}
      alPulsar={() => abrir(f.id)} seleccionado={f.id === abierta}
      accion={g === "hoy" ? <button type="button" className="as-btn fm-it-acc" onClick={() => { abrir(f.id); pedir("responder", f.id); }}>Anotar respuesta</button> : undefined} />
  );
  const porHoy = activos.filter((f) => f.grupo === "hoy").length;

  return (
    <div className="as-dos tra-dos" data-det={t !== null}>
      <section className="as-lista" aria-label="Trámites">
        <div className="as-lado">
          <div className="as-fila as-cab">
            <h1 className="as-h1-lista">Trámites</h1>
            {tramites.cargando ? null : <span className="as-cab-n" aria-label={`${activos.length} activos`}>{activos.length}</span>}
            <span className="as-sp" />
            <BotonFiltros grupos={gruposFiltro} activos={filtrosPuestos} alLimpiar={limpiarFiltros} extra={loLleva.control}
              verTexto={`Ver ${visibles.length} ${visibles.length === 1 ? "trámite" : "trámites"}`} />
            <button type="button" className="as-btn as-gho as-ico as-cab-mas" onClick={() => setCreando(true)} aria-label="Nuevo trámite" title="Nuevo trámite (N)" aria-keyshortcuts="N">
              <Icono nombre="mas" tamano={16} />
            </button>
          </div>
          <label className="as-buscar">
            <Icono nombre="bus" tamano={15} />
            <input value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Inmueble, persona o tipo de trámite" aria-label="Buscar trámites" type="search" autoComplete="off" />
          </label>
          <div className="as-fila as-filtros tra-filtros">
            {resumenFiltros ? <ResumenFiltros texto={resumenFiltros} alLimpiar={limpiarFiltros} /> : (
              <span className="as-m">{tramites.cargando ? "Cargando…" : porHoy ? `${porHoy} por preguntar hoy` : "Nada por preguntar hoy"}</span>
            )}
          </div>

          {tramites.cargando ? <div className="tra-aviso"><Cargando lineas={4} etiqueta="Cargando trámites" /></div> : null}
          {tramites.error ? <div className="tra-aviso"><EstadoError texto={tramites.error} alReintentar={tramites.reintentar} /></div> : null}
          {!tramites.cargando && !tramites.error && filas.length === 0 ? (
            <div className="as-vacio-lista">
              <Icono nombre="verificado" tamano={26} />
              <b>Sin trámites</b>
              <p>Cancelaciones de hipoteca, servicios, avalúos, Catastro y otros trámites que no son venta ni renta aparecen aquí.</p>
              <button type="button" className="as-btn as-pri" onClick={() => setCreando(true)}><Icono nombre="mas" tamano={16} />Nuevo trámite</button>
            </div>
          ) : null}
          {!tramites.cargando && filas.length > 0 && visibles.length === 0 ? <p className="as-m as-nada">{filtrosPuestos ? "Ningún trámite coincide con el filtro." : "Nada coincide. Prueba con otra palabra."}</p> : null}
          {!tramites.cargando && visibles.length > 0 && !verListos && grupos.length === 0 ? <p className="as-m as-nada">Sin trámites activos. Los terminados están en «Ver listos».</p> : null}
          {verListos ? (
            listos.length ? (
              <section aria-label={NOMBRE_GRUPO.listo}>
                <TramoLista titulo={NOMBRE_GRUPO.listo} cuenta={listos.length} />
                <div className="as-items">{listos.map((f) => fila(f, "listo"))}</div>
              </section>
            ) : <p className="as-m as-nada">Todavía no hay trámites listos. Aquí quedan los terminados.</p>
          ) : grupos.map(({ g, filas: fs }) => (
            <section key={g} aria-label={NOMBRE_GRUPO[g]}>
              <TramoLista titulo={NOMBRE_GRUPO[g]} cuenta={fs.length} />
              <div className="as-items">{fs.map((f) => fila(f, g))}</div>
            </section>
          ))}
          {listos.length || verListos ? (
            <div className="tra-mas"><button type="button" className="as-btn as-gho" onClick={() => setVerListos((x) => !x)}>{verListos ? "Ver activos" : `Ver listos (${listos.length})`}</button></div>
          ) : null}
          <div className="as-pie-teclas" aria-hidden><kbd>J</kbd><kbd>K</kbd> cambiar · <kbd>N</kbd> nuevo · <kbd>T</kbd> tarea · <kbd>R</kbd> avance</div>
        </div>
      </section>

      <section className="as-det" aria-label={t ? `Trámite ${t.titulo}` : "Trámite"}>
        {t ? (
          <div className="cp fm-col tra-col">
            <div className="cp-barra">
              <button type="button" className="as-btn as-gho as-atras" onClick={() => cerrar()}><Icono nombre="at" tamano={16} />Trámites</button>
              <span className="as-sp" />
              <button type="button" className="as-btn" onClick={() => pedir("tarea", t.id)} aria-keyshortcuts="T"><Icono nombre="mas" tamano={15} />Tarea</button>
              <button type="button" className="as-btn" onClick={() => pedir("avance", t.id)} aria-keyshortcuts="R"><Icono nombre="mensaje" tamano={15} /><span>Avance<span className="tra-ancho"> al propietario</span></span></button>
            </div>
            <div className="fm-cab">
              <span className="as-m">{vista ? [vista.nombreTipo, esHipoteca(t) ? ACREEDORES[t.acreedor] : ""].filter(Boolean).join(" · ") : "Trámite"}</span>
              <h2 className="fm-h1">{t.titulo}</h2>
              <span className="as-m">{[inmueble && inmueble !== t.titulo ? inmueble : "", persona?.nombre, diasDesde(t.creadoEl, hoy).replace(" · ", "")].filter(Boolean).join(" · ")}</span>
            </div>
          <DetalleTramite key={t.id} t={t} persona={persona} inmueble={inmueble} documentos={documentos} tareas={tareasT} ocupado={ocupado} firma={firma} pedido={pedido}
            alPendiente={(id) => void guardar(alternarPendiente(t, id), null)}
            alFechaPendiente={(id, f) => void guardar(fecharPendiente(t, id, f), null)}
            alCerrarPaso={() => {
              // Sin frenos (DEC-61): si falta algo se dice en el aviso y el paso se cierra igual.
              const s = cerrarPaso(t, documentos);
              const falta = avisoAlCerrar(t, documentos);
              const v = vistaTramite(t);
              const sigue = v.pasos[t.pasoActual + 1]?.nombre;
              if (s) void guardar(s, `${sigue ? `Paso cerrado. Sigue: ${sigue}` : "Trámite terminado"}${falta ? `. ${falta}` : ""}`, t);
            }}
            alReabrirPaso={() => { const s = reabrirPaso(t); if (s) void guardar(s, "Paso reabierto", t); }}
            alQuitarEspera={() => void guardar(quitarEspera(t), "Se quitó la espera", t)}
            alTarea={async (d) => {
              const { tarea, cita } = tareaDeTramite(t, d);
              setOcupado(true);
              try {
                await tareas.guardar(tarea.id, tarea);
                if (cita) await eventos.guardar(cita.id, cita);
                avisar(`Tarea para el ${diaLargo(d.vence)}${cita ? `, ${cita.hora} · también en la agenda` : ""}`, { etiqueta: "Deshacer", alAccionar: () => {
                  Promise.all([tareas.borrar(tarea.id), cita ? eventos.borrar(cita.id) : Promise.resolve()])
                    .then(() => avisar("Se deshizo"), (e: unknown) => avisar(e instanceof Error ? e.message : "No se pudo deshacer."));
                } });
                return true;
              } catch (e) {
                avisar(e instanceof Error ? e.message : "No se guardó. Vuelve a intentarlo.");
                return false;
              } finally { setOcupado(false); }
            }}
            alTareaHecha={(id) => {
              const x = tareas.datos.find((y) => y.id === id);
              if (x) tareas.guardar(id, completarTarea(x)).then(() => avisar("Tarea hecha"), (e: unknown) => avisar(e instanceof Error ? e.message : "No se guardó."));
            }}
            alEsperar={(quien, volver) => guardar(ponerEnEspera(t, quien, volver, hoy), `En espera de ${quien.trim()}. Vuelves a preguntar el ${diaLargo(volver)}`, t)}
            alResponder={(r, volver) => {
              if (!volver) return guardar(yaRespondieron(t, r), "Respuesta anotada. Se quitó la espera", t);
              // «Sigue en espera»: la nota con lo que dijeron y la espera movida (la base crea la nueva tarea de volver a preguntar).
              const quien = t.espera?.quien ?? "la instancia";
              const conNota = r.trim() ? anotarTramite(t, `Sigue en espera de ${quien}: ${r.trim()}`) : t;
              return guardar(ponerEnEspera(conNota, quien, volver, hoy), `Sigue en espera. Vuelves a preguntar el ${diaLargo(volver)}`, t);
            }}
            alAnotar={(texto) => guardar(anotarTramite(t, texto), "Nota guardada. Solo la ve el equipo")}
            alPagar={(id) => void guardar(marcarPago(t, id), null)}
            alParte={(id, accion) => {
              const p = esHipoteca(t) ? undefined : t.partes.find((x) => x.id === id);
              if (!p) return;
              void guia((g) => (accion === "avanzar" ? avanzarParte(g, id) : reabrirParte(g, id)),
                accion === "reabrir" ? `${p.nombre}: reabierto` : p.estado === "pendiente" ? `${p.nombre}: solicitado` : `${p.nombre}: listo`);
            }}
            alAgregarParte={(nombre) => guia((g) => agregarParte(g, nombre), `Se agregó «${nombre.trim()}»`, false)}
            alTerminarPartes={() => void guia(terminarPartes, "Trámite terminado")}
            alReabrirTramite={() => void guia(reabrirTramite, "Trámite reabierto")}
            alAvanceEnviado={(medio) => void guardar({ ...t, ultimoAvance: { medio } }, `Registrado: avance enviado por ${medio === "whatsapp" ? "WhatsApp" : medio === "correo" ? "correo" : "PDF"}`)}
            alSubir={async (lista, pasoClave) => {
              try {
                for (const [i, f] of lista.entries()) {
                  const up = await uploadFile(f, "private");
                  const a: Archivo = { ...archivoFromUpload(crypto.randomUUID(), up), clienteId: t.clienteId, tramiteId: t.id, pasoClave: i === 0 ? pasoClave : "" };
                  await archivos.guardar(a.id, a);
                }
                avisar(lista.length === 1 ? "Documento subido" : `${lista.length} documentos subidos`);
              } catch (e) { avisar(e instanceof Error ? e.message : "No se subió. Vuelve a intentarlo."); }
            }}
            alVerDocumento={verDocumento}
          />
          </div>
        ) : (
          <div className="as-in as-elige">
            <Icono nombre="verificado" tamano={28} />
            <p className="as-m">{tramites.cargando ? "Cargando…" : "Elige un trámite de la lista."}</p>
          </div>
        )}
      </section>

      <HojaAdaptable abierta={creando} titulo="Nuevo trámite" descripcion="Elige qué vas a tramitar." alCerrar={() => setCreando(false)}>
        {creando ? <NuevoTramite personas={directorio} inmuebles={inmuebles.datos} asesores={asesores.datos} miAsesor={miAsesor} ocupado={ocupado} alGuardar={(d) => void crear(d)} /> : null}
      </HojaAdaptable>
    </div>
  );
}

/** «· lleva N días» del boceto, desde que se abrió el trámite. */
function diasDesde(creadoEl: string | undefined, hoy: string): string {
  if (!creadoEl) return "";
  const n = Math.max(0, Math.round((Date.parse(`${hoy}T12:00:00`) - Date.parse(`${aTexto(new Date(creadoEl))}T12:00:00`)) / 86_400_000));
  return ` · lleva ${n} ${n === 1 ? "día" : "días"}`;
}

type NuevoDatos = { tipo: TipoTramite; acreedor: Acreedor; titulo: string; personaId: string; asesorId: string; propiedadSlug: string };
const ACREEDOR_OPCIONES = (Object.keys(ACREEDORES) as Acreedor[]).map((a) => ({ valor: a, etiqueta: ACREEDORES[a] }));

/**
 * «Nuevo trámite» (boceto): primero el catálogo por tipo; después, a qué inmueble o persona se liga (o a ninguno).
 * La hipoteca pide acreedor y propietario (TRA-01: la base lo exige); las guías que no son la hipoteca salen «Por confirmar».
 */
function NuevoTramite({ personas, inmuebles, asesores, miAsesor, ocupado, alGuardar }: {
  personas: readonly PersonaVista[]; inmuebles: readonly Property[]; asesores: readonly Asesor[]; miAsesor: string | null; ocupado: boolean;
  alGuardar: (d: NuevoDatos) => void;
}) {
  const [tipo, setTipo] = useState<TipoTramite | null>(null);
  const [d, setD] = useState({ acreedor: "infonavit" as Acreedor, titulo: "", personaId: "", asesorId: miAsesor ?? "", propiedadSlug: "" });
  const [intento, setIntento] = useState(false);
  if (!tipo) {
    return (
      <div style={{ display: "grid", gap: 16, marginTop: 8 }}>
        {catalogoPorCategoria().map((c) => (
          <GrupoLista key={c.categoria} titulo={c.categoria}>
            {c.guias.map((g) => (
              <Fila key={g.tipo} titulo={g.nombre} subtitulo={g.pista} detalle={g.confirmada ? undefined : "Por confirmar con la fuente oficial"} tonoDetalle="aviso" alPulsar={() => setTipo(g.tipo)} />
            ))}
          </GrupoLista>
        ))}
      </div>
    );
  }
  const g = GUIAS[tipo];
  const hipoteca = tipo === "cancelacion_hipoteca";
  const inmueble = inmuebles.find((p) => p.slug === d.propiedadSlug);
  const titulo = d.titulo.trim() || inmueble?.titulo || personas.find((p) => p.id === d.personaId)?.nombre || (hipoteca ? "" : g.nombre);
  const falta = hipoteca && !d.personaId ? "Elige al propietario." : !titulo ? "Escribe un nombre o elige el inmueble." : !d.asesorId ? "Elige quién lo lleva." : null;
  return (
    <form noValidate style={{ display: "grid", gap: 12, marginTop: 8 }} onSubmit={(e) => { e.preventDefault(); setIntento(true); if (!falta) alGuardar({ ...d, tipo, titulo }); }}>
      <div style={{ display: "grid", gap: 4 }}>
        <div><Boton variante="texto" onClick={() => { setTipo(null); setIntento(false); }}>‹ Otro trámite</Boton></div>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{g.nombre}</h2>
        {g.confirmada ? null : <p className="pn-tra-confirmar">Pasos por confirmar con la fuente oficial</p>}
        {tipo === "libre" ? <p className="pn-sub" style={{ margin: 0 }}>Sin pasos: agregas tú las partes.</p> : null}
      </div>
      {hipoteca ? (
        <Desplegable etiqueta="Acreedor" valor={d.acreedor} opciones={ACREEDOR_OPCIONES} alElegir={(acreedor) => { if (acreedor) setD({ ...d, acreedor }); }}
          ayuda={d.acreedor === "banco" ? "Con banco pasa por notario." : "Va directo al Registro Público, sin notario."} />
      ) : null}
      <Desplegable etiqueta="Inmueble" valor={d.propiedadSlug} vacio="Sin inmueble" opciones={inmuebles.map((p) => ({ valor: p.slug, etiqueta: `${p.titulo} · ${p.codigo}` }))}
        alElegir={(propiedadSlug) => setD({ ...d, propiedadSlug })} />
      <Desplegable etiqueta={hipoteca ? "Propietario" : "Persona"} valor={d.personaId} vacio={hipoteca ? "Elige…" : "Sin persona"} opciones={opcionesPersona(personas, d.personaId)}
        alElegir={(personaId) => setD({ ...d, personaId })}
        ayuda={hipoteca ? (personas.length ? undefined : "Agrega primero al propietario en el Directorio.") : "Puedes ligarlo a un inmueble, a una persona del Directorio o a ninguno."} />
      <Campo etiqueta="Nombre del trámite" placeholder={inmueble?.titulo ?? (hipoteca ? "Por ejemplo: Casa en Playas" : g.nombre)} maxLength={160} value={d.titulo} onChange={(e) => setD({ ...d, titulo: e.target.value })} autoComplete="off" />
      {miAsesor ? null : <Desplegable etiqueta="Lo lleva" valor={d.asesorId} vacio="Elige…" opciones={asesores.map((a) => ({ valor: a.id, etiqueta: a.nombre }))} alElegir={(asesorId) => setD({ ...d, asesorId })} />}
      {intento && falta ? <p role="alert" style={{ margin: 0, color: "var(--error)" }}>{falta}</p> : null}
      <Boton type="submit" bloque deshabilitado={ocupado}>Abrir trámite</Boton>
    </form>
  );
}

export default function PaginaTramites() {
  return <Suspense fallback={<div className="pn-pagina"><Cargando lineas={4} etiqueta="Cargando" /></div>}><Tramites /></Suspense>;
}

