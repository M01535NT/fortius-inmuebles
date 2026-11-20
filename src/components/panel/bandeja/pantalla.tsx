"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { publicarCuentaBandeja } from "@/components/panel/bandeja/cuenta";
import { DetalleArchivo, VistaPrevia, type DestinoElegido } from "@/components/panel/bandeja/detalle-archivo";
import { ZonaSubir, type ZonaSubirRef } from "@/components/panel/bandeja/zona-subir";
import { useColeccion } from "@/components/panel/datos/use-coleccion";
import { Icono } from "@/components/panel/icons";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Boton } from "@/components/panel/kit/boton";
import { Cargando, EstadoError, Vacio } from "@/components/panel/kit/estados";
import { Segmentado } from "@/components/panel/kit/segmentado";
import type { Property } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import { aTexto } from "@/lib/panel/calendario";
import { filasAsuntos, type Expediente } from "@/lib/panel/datos/asuntos";
import {
  anotadoEnLista, cargaVigente, claseArchivo, conVersion, cuentasBandeja, deshecho, destinoCola, enMemoria, falloGuardar, falloSubida,
  guardadoEn, guardando, hayPendientes, nombrePersona, nuevoArchivo, perdido, revisarArchivo, rutaAsunto, rutaInmueble, subido,
  tamano, textoEstado, textoGuardadoAsunto, textoGuardadoInmueble, tituloArchivo, unirCola, vistaBandeja,
  type ArchivoBandeja, type Carga, type DestinoCola, type EstadoCola, type Guardado,
} from "@/lib/panel/datos/bandeja";
import {
  anotarEnCola, cambiarEnCola, descargarDeCola, guardarEnAsunto, leerCola, permisoDeCola, quitarDelAsunto, sinColaEnServidor,
  subirATemporal, yaNoEsta,
} from "@/lib/panel/datos/bandeja-acciones";
import { leerExpedientes } from "@/lib/panel/datos/colecciones";
import { altDeArchivo } from "@/lib/panel/datos/inmueble-sitio";
import { uploadFile } from "@/lib/panel/legado/archivos";

import "@/components/panel/asunto/asunto.css";
import "@/components/panel/asunto/caso.css";
import "@/components/panel/fichas/modelo.css";
import "@/app/panel/bandeja/bandeja.css";

const mensaje = (e: unknown, otro: string) => (e instanceof Error && e.message ? e.message : otro);
/** Solo las vistas previas locales (blob:) se liberan; las URL firmadas del servidor vencen solas. */
const liberar = (u: string | undefined) => { if (u?.startsWith("blob:")) URL.revokeObjectURL(u); };
const NO_ESTA = "Este archivo ya no está en la Bandeja del servidor. Vuelve a subirlo desde tu equipo.";

/** Dónde vive la cola: leyendo, en el servidor, solo en la página (503: migración sin aplicar) o sin poder leerla. */
type Servidor = "leyendo" | "si" | "no" | "fallo";

/**
 * En espera: la ruta /admin/bandeja no la muestra hasta que exista su tabla en la base (hoy guardaría en los expedientes y la
 * papelera del panel provisional). Se conserva para retomarla en su paso.
 *
 * Bandeja (PN-06, primer corte): se suben varios archivos a la carga temporal privada y cada uno espera «Por confirmar»
 * hasta que el asesor elige a mano dónde va. La lectura automática no está activa. Todo con Deshacer.
 * La cola se guarda en el servidor (DEC-54): al volver, lo que seguía por confirmar aparece de nuevo y sus bytes se piden con
 * un permiso. Mientras el servidor no la tenga (503), la cola vive en esta página y se avisa antes de salir.
 */
export function PantallaBandeja() {
  const [archivos, setArchivos] = useState<ArchivoBandeja[]>([]);
  const actuales = useRef<ArchivoBandeja[]>([]);
  useEffect(() => { actuales.current = archivos; }, [archivos]);
  const bytes = useRef(new Map<string, File>());
  const [vistas, setVistas] = useState<Record<string, string>>({});
  const vistasRef = useRef(vistas);
  useEffect(() => { vistasRef.current = vistas; }, [vistas]);
  const cola = useRef<Promise<void>>(Promise.resolve());
  const zona = useRef<ZonaSubirRef>(null);
  const { avisar } = useAvisos();
  const [problema, setProblema] = useState("");
  const [ver, setVer] = useState<"pendientes" | "guardados">("pendientes");
  const [abierto, setAbierto] = useState<string | null>(null);
  const [anterior, setAnterior] = useState<DestinoElegido | null>(null);
  const [servidor, setServidor] = useState<Servidor>("leyendo");
  const servidorRef = useRef<Servidor>("leyendo");
  useEffect(() => { servidorRef.current = servidor; }, [servidor]);
  const [lecturaCola, setLecturaCola] = useState(0);

  const personas = useColeccion<Cliente>("clientes");
  const inmuebles = useColeccion<Property>("propiedades");
  const inmueblesRef = useRef<Property[]>([]);
  useEffect(() => { inmueblesRef.current = inmuebles.datos; }, [inmuebles.datos]);
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  // Al volver a esta pestaña (por ejemplo, después de abrir un asunto en otra) se leen de nuevo los asuntos, sin perder la Bandeja.
  const [lectura, setLectura] = useState(0);
  useEffect(() => {
    const alVolver = () => { if (document.visibilityState === "visible") setLectura((n) => n + 1); };
    document.addEventListener("visibilitychange", alVolver);
    return () => document.removeEventListener("visibilitychange", alVolver);
  }, []);
  useEffect(() => {
    const c = new AbortController();
    leerExpedientes<Expediente>(c.signal).then(setExpedientes, () => { if (!c.signal.aborted) setExpedientes((s) => s); });
    return () => c.abort();
  }, [lectura]);
  const [hoy] = useState(() => aTexto(new Date()));
  const asuntos = useMemo(() => filasAsuntos(expedientes, { personas: personas.datos, inmuebles: inmuebles.datos, tareas: [], hoy }), [expedientes, personas.datos, inmuebles.datos, hoy]);
  const datos = useMemo(() => ({ asuntos, inmuebles: inmuebles.datos, personas: personas.datos }), [asuntos, inmuebles.datos, personas.datos]);

  const cambiar = useCallback((id: string, f: (a: ArchivoBandeja) => ArchivoBandeja) => {
    setArchivos((lista) => lista.map((a) => (a.id === id ? f(a) : a)));
  }, []);

  // La cola del servidor: lo que no está en esta página aparece «Por confirmar». Un 503 deja la cola en la página, sin error.
  useEffect(() => {
    const c = new AbortController();
    leerCola(c.signal).then(
      (filas) => { setArchivos((l) => unirCola(l, filas)); setServidor("si"); },
      (e) => { if (!c.signal.aborted) setServidor(sinColaEnServidor(e) ? "no" : "fallo"); },
    );
    return () => c.abort();
  }, [lecturaCola]);

  /** Anota en la cola del servidor una carga recién subida. Si no se puede, el archivo sigue usable en la página. */
  const anotar = useCallback(async (id: string, carga: Carga) => {
    if (servidorRef.current === "no") return;
    try {
      const fila = await anotarEnCola(carga.ticket);
      setArchivos((l) => anotadoEnLista(l, id, fila));
    } catch (e) {
      if (sinColaEnServidor(e)) setServidor("no");
    }
  }, []);

  /** Cambia la fila del archivo en la cola del servidor y guarda la versión nueva. Un 409 se avisa con el texto del servidor. */
  const marcarCola = useCallback(async (id: string, estado: EstadoCola, destino?: DestinoCola) => {
    const c = actuales.current.find((x) => x.id === id)?.cola;
    if (!c || servidorRef.current === "no") return;
    try {
      const fila = await cambiarEnCola(c.id, c.version, estado, destino);
      cambiar(id, (a) => (a.cola?.id === fila.id ? conVersion(a, fila.version) : a));
    } catch (e) {
      if (sinColaEnServidor(e)) setServidor("no");
      else if (!yaNoEsta(e)) avisar(mensaje(e, "La Bandeja del servidor no se actualizó."));
    }
  }, [avisar, cambiar]);

  /** Sube uno a la vez a la carga temporal, en el orden en que llegaron, y lo anota en la cola. */
  const subir = useCallback((id: string) => {
    cola.current = cola.current.then(async () => {
      const f = bytes.current.get(id);
      if (!f) return;
      let carga: Carga;
      try {
        carga = await subirATemporal(f);
      } catch (e) {
        cambiar(id, (a) => falloSubida(a, mensaje(e, "No se pudo subir. Vuelve a intentarlo.")));
        return;
      }
      cambiar(id, (a) => subido(a, carga));
      await anotar(id, carga);
    });
  }, [anotar, cambiar]);

  /**
   * Permiso del servidor para un archivo anotado: ticket nuevo para la misma carga y URL firmada (vista previa).
   * Si ya no está (410), el archivo queda con ese error y se devuelve null.
   */
  const pedirPermiso = useCallback(async (id: string): Promise<{ carga: Carga; url: string } | null> => {
    const c = actuales.current.find((x) => x.id === id)?.cola;
    if (!c) return null;
    try {
      const p = await permisoDeCola(c.id);
      cambiar(id, (a) => ({ ...a, carga: p.carga }));
      setVistas((v) => (v[id]?.startsWith("blob:") ? v : { ...v, [id]: p.url }));
      return p;
    } catch (e) {
      if (yaNoEsta(e)) { cambiar(id, (a) => perdido(a, NO_ESTA)); return null; }
      if (sinColaEnServidor(e)) setServidor("no");
      throw e;
    }
  }, [cambiar]);

  /** Al abrir un archivo recuperado del servidor (sin bytes aquí) se pide su permiso para la vista previa. */
  const pidiendo = useRef(new Set<string>());
  useEffect(() => {
    const a = actuales.current.find((x) => x.id === abierto);
    if (!a || a.enMemoria || !a.cola || a.estado !== "por-confirmar" || cargaVigente(a.carga, Date.now()) || pidiendo.current.has(a.id)) return;
    const id = a.id;
    pidiendo.current.add(id);
    pedirPermiso(id)
      .catch((e) => cambiar(id, (x) => ({ ...x, error: mensaje(e, "No se pudo abrir. Vuelve a intentarlo.") })))
      .finally(() => pidiendo.current.delete(id));
  }, [abierto, cambiar, pedirPermiso]);

  const agregar = useCallback((lista: File[]) => {
    const fuera: string[] = [];
    const nuevos: ArchivoBandeja[] = [];
    const ahora = Date.now();
    lista.forEach((f, i) => {
      const motivo = revisarArchivo(f);
      if (motivo) { fuera.push(motivo); return; }
      const id = crypto.randomUUID();
      bytes.current.set(id, f);
      nuevos.push(nuevoArchivo(id, f, ahora + i));
    });
    setProblema(fuera.length ? `No se agregaron ${fuera.length}: ${fuera.join(" · ")}` : "");
    if (!nuevos.length) return;
    setVistas((v) => ({ ...v, ...Object.fromEntries(nuevos.map((n) => [n.id, URL.createObjectURL(bytes.current.get(n.id)!)])) }));
    setArchivos((a) => [...a, ...nuevos]);
    setVer("pendientes");
    nuevos.forEach((n) => subir(n.id));
  }, [subir]);

  const quitar = useCallback((id: string) => {
    void marcarCola(id, "descartado");
    bytes.current.delete(id);
    setVistas((v) => { liberar(v[id]); const { [id]: _fuera, ...resto } = v; void _fuera; return resto; });
    setArchivos((a) => a.filter((x) => x.id !== id));
    setAbierto((ab) => (ab === id ? null : ab));
  }, [marcarCola]);

  const reintentar = useCallback((id: string) => {
    cambiar(id, (a) => ({ ...a, estado: "subiendo", error: "" }));
    subir(id);
  }, [cambiar, subir]);

  /** Deshacer: el archivo sale de su destino (asunto: a su papelera; inmueble: de sus fotos) y vuelve a Por confirmar. */
  const regresar = useCallback(async (id: string) => {
    const a = actuales.current.find((x) => x.id === id);
    const g = a?.guardado;
    if (!a || !g) return;
    try {
      if (g.clase === "asunto") await quitarDelAsunto(g.archivoId, g.titulo);
      else {
        const p = inmueblesRef.current.find((x) => x.slug === g.slug);
        if (p) await inmuebles.guardar(p.slug, { ...p, galeria: p.galeria.filter((f) => f.src !== g.src) });
      }
      cambiar(id, deshecho);
      avisar(`${a.nombre} volvió a Por confirmar`);
      // El asunto consumió la carga temporal: si los bytes siguen aquí, se vuelve a subir y se anota como fila nueva
      // (la anterior se descarta). Las fotos del inmueble no la consumen: la misma fila vuelve a Por confirmar.
      if (g.clase === "asunto" && bytes.current.has(id) && a.cola) {
        await marcarCola(id, "descartado");
        cambiar(id, (x) => ({ ...x, estado: "subiendo", cola: null }));
        subir(id);
      } else void marcarCola(id, "por_confirmar");
    } catch (e) {
      avisar(mensaje(e, "No se pudo deshacer."));
    }
  }, [avisar, cambiar, inmuebles, marcarCola, subir]);

  /**
   * La carga temporal vigente para guardar en un asunto: la que ya hay, un permiso nuevo de la cola (misma carga)
   * o, si no hay cola o ya no está, una subida nueva desde este navegador (que se anota como fila nueva).
   */
  const cargaParaAsunto = useCallback(async (id: string, f: File | undefined): Promise<Carga> => {
    const a = actuales.current.find((x) => x.id === id);
    if (!a) throw new Error("No se pudo abrir el archivo. Vuelve a intentarlo.");
    if (cargaVigente(a.carga, Date.now())) return a.carga;
    if (a.cola) {
      const p = await pedirPermiso(id).catch((e: unknown) => { if (!f) throw e; return null; });
      if (p) return p.carga;
      if (!f) throw new Error(NO_ESTA);
      // Ya no está en el servidor, pero los bytes siguen aquí: se sube de nuevo.
      cambiar(id, (x) => ({ ...x, estado: "guardando", error: "", cola: null }));
    }
    if (!f) throw new Error("No se pudo abrir el archivo. Vuelve a intentarlo.");
    const carga = await subirATemporal(f);
    cambiar(id, (x) => ({ ...x, carga }));
    await anotar(id, carga);
    return carga;
  }, [anotar, cambiar, pedirPermiso]);

  /** Los bytes de un archivo recuperado: se descargan con la URL firmada y se quedan en este navegador. */
  const traerBytes = useCallback(async (id: string): Promise<File> => {
    const ya = bytes.current.get(id);
    if (ya) return ya;
    const a = actuales.current.find((x) => x.id === id);
    if (!a) throw new Error("No se pudo abrir el archivo. Vuelve a intentarlo.");
    const firmada = vistasRef.current[id];
    const url = (cargaVigente(a.carga, Date.now()) && firmada && !firmada.startsWith("blob:") ? firmada : null) ?? (await pedirPermiso(id))?.url;
    if (!url) throw new Error(NO_ESTA);
    const f = await descargarDeCola(url, a.nombre, a.tipo);
    bytes.current.set(id, f);
    cambiar(id, enMemoria);
    return f;
  }, [cambiar, pedirPermiso]);

  const guardar = useCallback(async (id: string, d: DestinoElegido) => {
    const a = actuales.current.find((x) => x.id === id);
    if (!a || a.estado === "guardando" || a.estado === "subiendo" || a.estado === "error") return;
    if (!bytes.current.has(id) && !a.cola) return;
    cambiar(id, guardando);
    try {
      let g: Guardado;
      if (d.clase === "inmueble") {
        const p = inmueblesRef.current.find((x) => x.slug === d.slug);
        if (!p) throw new Error("Ese inmueble ya no está en la lista. Recarga la página.");
        // Uno recuperado del servidor se descarga aquí: la galería del inmueble sube el archivo por su cuenta.
        const f = await traerBytes(id);
        const r = await uploadFile(f, "public", { destino: "inmueble", inmueble: p.slug });
        const vigente = inmueblesRef.current.find((x) => x.slug === p.slug) ?? p;
        // DEC-54: en un inmueble publicado, la foto entra sin mostrarse; se muestra desde la ficha del inmueble.
        const foto = vigente.publicada ? { src: r.url, alt: altDeArchivo(a.nombre), oculta: true as const } : { src: r.url, alt: altDeArchivo(a.nombre) };
        await inmuebles.guardar(p.slug, { ...vigente, galeria: [...vigente.galeria, foto] });
        g = { clase: "inmueble", slug: p.slug, src: r.url, texto: textoGuardadoInmueble(p), href: rutaInmueble(p) };
      } else {
        const asunto = asuntos.find((x) => x.id === d.asuntoId);
        if (!asunto) throw new Error("Ese asunto ya no está en la lista. Recarga la página.");
        // Uno recuperado se trae a este navegador para poder deshacer y volver a subirlo; si no se puede, basta el permiso.
        const f = bytes.current.get(id) ?? (await traerBytes(id).catch(() => undefined));
        // El permiso de la carga temporal dura 10 minutos; si venció, se pide otro a la cola o se vuelve a subir.
        const carga = await cargaParaAsunto(id, f);
        const persona = d.clase === "persona" ? personas.datos.find((c) => c.id === d.personaId) : undefined;
        const r = await guardarEnAsunto(asunto.id, carga, d.titulo ?? tituloArchivo(a.nombre));
        g = { clase: "asunto", expedienteId: asunto.id, archivoId: r.id, titulo: r.titulo, texto: textoGuardadoAsunto(asunto, persona ? nombrePersona(persona) : undefined), href: rutaAsunto(asunto.id) };
      }
      cambiar(id, (x) => guardadoEn(x, g));
      void marcarCola(id, "guardado", destinoCola(g));
      setAnterior(d.clase === "inmueble" ? d : { ...d, titulo: undefined });
      // Sigue con el siguiente que espera destino (AUD-06, 7); si no hay, se cierra la hoja.
      const siguiente = actuales.current.find((x) => x.id !== id && x.estado === "por-confirmar");
      setAbierto(siguiente ? siguiente.id : null);
      avisar(`${a.nombre}: ${g.texto.charAt(0).toLowerCase()}${g.texto.slice(1)}`, { etiqueta: "Deshacer", alAccionar: () => void regresar(id) });
    } catch (e) {
      // Si ya no está en el servidor (410), quedó con ese error: no se regresa a Por confirmar.
      cambiar(id, (x) => (x.estado === "error" ? x : falloGuardar(x, mensaje(e, "No se guardó. Vuelve a intentarlo."))));
    }
  }, [asuntos, avisar, cambiar, cargaParaAsunto, inmuebles, marcarCola, personas.datos, regresar, traerBytes]);

  // Lo que se perdería al salir se pregunta antes (protección de cambios sin guardar). Con la cola en el servidor,
  // solo lo que no alcanzó a anotarse.
  const conServidor = servidor === "si";
  const sinAnotar = hayPendientes(archivos, conServidor);
  // «no» (503) y «fallo» se dicen igual en pantalla: no se pudo leer. Reintentar vuelve a pedir la cola.
  const sinLeer = servidor === "no" || servidor === "fallo";
  const releer = () => { setServidor("leyendo"); setLecturaCola((n) => n + 1); };
  useEffect(() => {
    if (!sinAnotar) return;
    const antes = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", antes);
    return () => window.removeEventListener("beforeunload", antes);
  }, [sinAnotar]);
  // Las vistas previas locales se liberan al salir de la página.
  useEffect(() => () => { Object.values(vistasRef.current).forEach(liberar); }, []);

  const cuentas = cuentasBandeja(archivos);
  const visibles = vistaBandeja(archivos, ver);
  const porRevisar = archivos.length - cuentas.guardados;
  useEffect(() => { publicarCuentaBandeja(porRevisar); }, [porRevisar]);
  useEffect(() => () => publicarCuentaBandeja(null), []);
  useEffect(() => {
    document.title = cuentas.porConfirmar ? `Bandeja (${cuentas.porConfirmar}) | Panel Fortius` : "Bandeja | Panel Fortius";
  }, [cuentas.porConfirmar]);

  // U sube; J y K pasan al archivo siguiente o anterior de la vista. No actúan mientras se escribe.
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.closest("[role=dialog]:not([data-lateral])"))) return;
      const k = e.key.toLowerCase();
      if (k === "u") { e.preventDefault(); zona.current?.elegir(); return; }
      if ((k === "j" || k === "k") && ver === "pendientes") {
        const lista = vistaBandeja(actuales.current, "pendientes");
        if (!lista.length) return;
        e.preventDefault();
        const i = lista.findIndex((x) => x.id === abierto);
        const sig = k === "j" ? (i + 1) % lista.length : (i <= 0 ? lista.length - 1 : i - 1);
        setAbierto(lista[sig].id);
      }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [abierto, ver]);

  const elegido = archivos.find((a) => a.id === abierto) ?? null;
  // En el teléfono, al abrir un archivo se sube al principio (la lista quedó abajo).
  const hayElegido = elegido !== null;
  useEffect(() => { if (hayElegido && window.matchMedia("(max-width: 900px)").matches) window.scrollTo({ top: 0 }); }, [hayElegido, abierto]);
  const resumen = cuentas.enProceso
    ? `${cuentas.porConfirmar} por confirmar · ${cuentas.enProceso} en proceso`
    : archivos.length ? `${cuentas.porConfirmar} por confirmar` : "";

  // Modelo visual (Main.dc.html / Inmuebles.dc.html): la lista en su columna con barra de 52 px y el elegido en azul;
  // el archivo abierto a la derecha, con su barra y sus tarjetas. En el teléfono se ve una columna a la vez.
  const pos = visibles.findIndex((x) => x.id === abierto);
  return (
    <div className="as-dos bj-dos" data-det={elegido !== null}>
      <section className="as-lista" aria-label="Archivos de la Bandeja">
        <div className="as-lado">
          <div className="as-fila as-cab">
            <h1 className="as-h1-lista">Bandeja</h1>
            {archivos.length ? <span className="as-cab-n">{cuentas.porConfirmar}</span> : null}
            <span className="as-sp" />
            <button type="button" className="as-btn as-gho as-ico as-cab-mas" aria-label="Subir archivos" title="Subir archivos (U)" onClick={() => zona.current?.elegir()}>
              <Icono nombre="mas" tamano={16} />
            </button>
          </div>
          <div className="bj-arriba">
            <p className="bj-resumen" aria-live="polite">{resumen || (sinLeer ? "Sin lo pendiente de otras visitas" : "Nada por acomodar")} · Datos de ejemplo</p>
            <ZonaSubir ref={zona} alSoltar={agregar} compacta={archivos.length > 0} />
            {problema ? <p role="alert" className="bj-aviso">{problema}</p> : null}
            {sinAnotar ? (
              <p className="bj-nota">{conServidor ? "Si cierras la página ahora, lo que sigue subiendo se pierde." : "Si cierras la página, lo que siga por confirmar se pierde."}</p>
            ) : null}
            {sinLeer && archivos.length > 0 ? (
              <p className="bj-nota" role="status">
                No se pudo leer lo que dejaste pendiente en otra visita.
                <Boton variante="texto" onClick={releer}>Reintentar</Boton>
              </p>
            ) : null}
            {archivos.length ? (
              <Segmentado etiqueta="Ver" valor={ver} alElegir={setVer} opciones={[
                { valor: "pendientes", etiqueta: "Por confirmar", cuenta: archivos.length - cuentas.guardados },
                { valor: "guardados", etiqueta: "Guardados", cuenta: cuentas.guardados },
              ]} />
            ) : null}
          </div>
          {archivos.length === 0 && servidor === "leyendo" ? (
            <div className="bj-vacio"><Cargando lineas={3} /></div>
          ) : archivos.length === 0 && sinLeer ? (
            // Sin la cola del servidor no se sabe si hay algo pendiente: se dice, y se puede seguir subiendo.
            <div className="bj-vacio"><EstadoError titulo="No se pudo leer la Bandeja" texto="Lo pendiente de otras visitas no llegó. Puedes subir archivos nuevos mientras tanto." alReintentar={releer} /></div>
          ) : archivos.length === 0 ? (
            <div className="bj-vacio"><Vacio titulo="La Bandeja está vacía" texto="Sube lo que te mandaron: escrituras, identificaciones, fotos. Después eliges a dónde va cada uno." icono="descargar" /></div>
          ) : visibles.length === 0 ? (
            <div className="bj-vacio">
              {ver === "pendientes"
                ? <Vacio titulo="Todo está guardado" texto="Cada archivo ya tiene su lugar. Cámbiate a Guardados para ver dónde quedó." icono="verificado" />
                : <Vacio titulo="Nada guardado todavía" texto="Elige a dónde va cada archivo y confírmalo." icono="descargar" />}
            </div>
          ) : (
            <nav aria-label="Archivos" className="as-items">
              {visibles.map((a) => {
                const ocupado = a.estado === "subiendo" || a.estado === "guardando";
                const malo = a.estado === "error" || Boolean(a.error);
                const sugerencia = ver === "pendientes" && a.estado === "por-confirmar";
                return (
                  <button key={a.id} type="button" className="as-it bj-it" onClick={() => setAbierto(a.id)} aria-current={a.id === abierto ? "page" : undefined}>
                    <Miniatura archivo={a} url={vistas[a.id]} />
                    <span className="as-it-c">
                      <b>{a.nombre}</b>
                      <small data-mal={malo || undefined}>
                        {tamano(a.bytes)} · {ver === "guardados" && a.guardado ? a.guardado.texto : a.error && a.estado !== "error" ? a.error : textoEstado(a)}
                      </small>
                      {sugerencia ? (
                        <small className="bj-rec" data-nada={anterior ? undefined : ""}>
                          {anterior ? "Va al mismo lugar que el anterior: ábrelo para confirmar" : "Sin coincidencia clara: ábrelo y elige dónde va"}
                        </small>
                      ) : null}
                      {ocupado ? <span className="fx-pbar bj-pbar" aria-hidden><span /></span> : null}
                    </span>
                  </button>
                );
              })}
            </nav>
          )}
          {ver === "guardados" && cuentas.guardados ? <p className="bj-nota bj-nota-lista">Esta lista es de lo que guardaste desde que abriste la página; cada archivo ya está en su lugar.</p> : null}
          <div className="as-pie-teclas" aria-hidden><kbd>J</kbd><kbd>K</kbd> moverse · <kbd>U</kbd> subir</div>
        </div>
      </section>

      <section className="as-det" aria-label={elegido ? `Archivo ${elegido.nombre}` : "Archivo"}>
        {!elegido ? (
          <div className="as-in as-elige">
            <Icono nombre="descargar" tamano={28} />
            <p className="as-m">Elige un archivo para revisarlo.</p>
          </div>
        ) : (
          <div className="cp fm-col bj-col">
            <div className="cp-barra">
              <button type="button" className="as-btn as-gho as-atras" onClick={() => setAbierto(null)}><Icono nombre="at" tamano={16} />Bandeja</button>
              <span className="as-num bj-barra-t">{ver === "pendientes" && pos >= 0 ? `${pos + 1} de ${visibles.length}` : elegido.estado === "guardado" ? "Guardado" : "Por confirmar"}</span>
              <span className="as-sp" />
              <button type="button" className="as-btn as-gho as-ico" aria-label="Cerrar" title="Cerrar" onClick={() => setAbierto(null)}><Icono nombre="x" tamano={16} /></button>
            </div>
            {elegido.estado === "guardado" && elegido.guardado ? (
              <div className="bj-cuerpo">
                <VistaPrevia archivo={elegido} url={vistas[elegido.id] ?? null} />
                <h2 className="fm-h1 bj-h2">{elegido.nombre}</h2>
                <div className="fm-grupo">
                  <div className="fm-t">Dónde quedó</div>
                  <div className="fm-card">
                    <div className="fm-dato"><span className="fm-k bj-guardado"><Icono nombre="verificado" tamano={14} />Guardado</span><span className="fm-v">{elegido.guardado.texto}</span></div>
                  </div>
                </div>
                <div className="fx-filas-btn">
                  <a className="pn-btn pn-btn-primario" href={elegido.guardado.href}>Abrir</a>
                  <Boton variante="secundario" onClick={() => void regresar(elegido.id)}>Regresar a Por confirmar</Boton>
                </div>
              </div>
            ) : (
              <div className="bj-cuerpo">
                <DetalleArchivo key={elegido.id} archivo={elegido} url={vistas[elegido.id] ?? null} datos={datos} anterior={anterior}
                  alGuardar={(d) => void guardar(elegido.id, d)} alQuitar={() => quitar(elegido.id)} alReintentar={() => reintentar(elegido.id)} />
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function Miniatura({ archivo, url }: { archivo: ArchivoBandeja; url?: string }) {
  const clase = claseArchivo(archivo.tipo);
  // Si la imagen no carga, se queda el mosaico «Foto» en vez del ícono roto.
  const [fallo, setFallo] = useState<string | null>(null);
  return (
    <span className="bj-mini" aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element -- miniatura local (blob:) */}
      {url && clase === "foto" && fallo !== url ? <img src={url} alt="" onError={() => setFallo(url)} /> : clase === "pdf" ? "PDF" : clase === "video" ? "Video" : "Foto"}
    </span>
  );
}
