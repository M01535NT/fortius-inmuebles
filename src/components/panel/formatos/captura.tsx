"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { Gesto, Icono } from "@/components/panel/icons";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Boton } from "@/components/panel/kit/boton";
import { Campo } from "@/components/panel/kit/campo";
import { Desplegable } from "@/components/panel/kit/desplegable";
import { Cargando, EstadoError } from "@/components/panel/kit/estados";
import { Checkbox } from "@/components/panel/ui/checkbox";
import { avisoIncompleto, emiteIncompleto, formatoById, type FormatoDefinition, type FormatoField } from "@/lib/formatos/catalog";
import { DOCUMENTOS } from "@/lib/formatos/documento";
import type { Maqueta, Trazo, Zona } from "@/lib/formatos/documento/pdf";
import { fetchLetterhead } from "@/lib/letterhead";
import { aplicar, campoDe, esSimple, faltantes, puedeGenerar, textoDe, tituloFormato, valorCapturado } from "@/lib/panel/datos/formatos";
import {
  descargarEmision, emitirDocumento, guardarDocumento, leerDocumento, type DocumentoFormato, type EmisionFormato,
} from "@/lib/panel/datos/formatos-acciones";
import { llevaImagenes, tablaDe } from "@/lib/panel/datos/formatos-tablas";
import type { ImagenDocumento } from "@/lib/formatos/documento/imagen";
import type { DatosGuardados } from "@/lib/formatos/datos-expediente";
import {
  CON_IMAGENES, devolver, esRanuraImagen, FALTA_IMAGEN, fechaAlElegir, idsElegidos, imagenDe, leerAdjuntos, leerDatosAsunto, opcionesDe,
  quitarAdjunto, restaurarAdjunto, sinImagen, type Adjunto,
} from "@/lib/panel/datos/formatos-adjuntos";
import { unirDictado } from "@/lib/panel/datos/formatos-dictado";

import { CAPTURA_POR_LISTA, parcheNoSabe } from "@/lib/formatos/captura-lista";
import { cambiosDe, espaciosEnOrden, rutaDeRegreso, textoFalta, zonaId } from "@/lib/panel/datos/formatos-navegacion";
import { Interruptor } from "@/components/panel/kit/segmentado";

import { Dictar } from "./dictado";
import { ElegirImagen, ImagenesDelDocumento, SubirImagen } from "./imagenes";
import { DatoDelAsunto, DatosDelAsunto, DocumentosDelCliente, PdfEmitido } from "./lado";
import { EditorTabla } from "./tabla";
import "./captura.css";

/**
 * Captura sobre el documento (DEC-31, boceto «Formatos»): la hoja se ve como saldrá en PDF —la dibuja el mismo escritor del PDF—
 * y cada espacio se llena tocándolo; lo escrito aparece al momento en la hoja. Nada frena: «Faltan N espacios» lleva a cada espacio vacío
 * y «Generar PDF» funciona con pendientes (salvo el 01 y el 15, que el servidor exige completos).
 * Ventana propia (boceto «Formatos»): en escritorio flota sobre la pantalla con la hoja a la izquierda y, a la derecha, el lateral
 * «Captura» (avance, el espacio que se llena, lo que falta y «Generar PDF» abajo). En el teléfono: barra con «‹ Formatos» y
 * «Faltan N», la hoja, «Guardar» y «Generar PDF» fijos abajo, y cada espacio se llena en una hoja que sube desde abajo.
 */

type Render = (doc: ReturnType<NonNullable<(typeof DOCUMENTOS)[string]>>) => Promise<Maqueta>;

async function bytes(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error("No se pudo preparar la hoja. Recarga la página.");
  return new Uint8Array(await r.arrayBuffer());
}

export function CapturaFormato({ id, folio, asunto, volver }: { id: string; folio: string; asunto?: string; volver?: string | null }) {
  const { avisar } = useAvisos();
  const router = useRouter();
  const regreso = rutaDeRegreso(volver) ?? "/panel/formatos";
  // Llenar uno por uno (pensado para el teléfono): los espacios en el orden de la hoja, con Anterior y Siguiente.
  const [lista, setLista] = useState<{ zonas: Zona[]; i: number; soloFalta: boolean } | null>(null);
  const [doc, setDoc] = useState<DocumentoFormato | null>(null);
  const [emisiones, setEmisiones] = useState<EmisionFormato[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);
  const [render, setRender] = useState<Render | null>(null);
  const [maqueta, setMaqueta] = useState<Maqueta | null>(null);
  const [fallaHoja, setFallaHoja] = useState<string | null>(null);
  const [editando, setEditando] = useState<{ zona: Zona; borrador: Record<string, unknown> } | null>(null);
  const [ocupado, setOcupado] = useState(false);
  // Teléfono: la lista de lo que falta se abre desde la barra («Faltan N»).
  const [verFaltan, setVerFaltan] = useState(false);
  // El documento al día para lo que corre después (Deshacer): guarda sobre la versión vigente, no sobre la de cuando se tocó.
  const docRef = useRef<DocumentoFormato | null>(null);
  useEffect(() => { docRef.current = doc; }, [doc]);
  const zonas = useRef(new Map<string, HTMLButtonElement>());
  const raiz = useRef<HTMLDivElement>(null);

  // Ventana propia: lo de atrás (menú, barra) queda inerte para el teclado y el lector de pantalla mientras está abierta.
  useEffect(() => {
    const inertes: Element[] = [];
    for (let nodo: HTMLElement | null = raiz.current; nodo && nodo !== document.body; nodo = nodo.parentElement) {
      for (const hermano of Array.from(nodo.parentElement?.children ?? [])) {
        // Los avisos (con su «Deshacer») siguen a la mano.
        const avisos = hermano.matches("[data-sonner-toaster], section[aria-label^='Avisos']") || !!hermano.querySelector("[data-sonner-toaster]");
        if (hermano !== nodo && !avisos && !hermano.hasAttribute("inert") && !["SCRIPT", "STYLE"].includes(hermano.tagName)) { hermano.setAttribute("inert", ""); inertes.push(hermano); }
      }
    }
    return () => { for (const e of inertes) e.removeAttribute("inert"); };
  }, []);

  useEffect(() => {
    const c = new AbortController();
    leerDocumento(id, c.signal).then(
      (r) => { setDoc(r.documento); setEmisiones(r.emisiones); setError(null); },
      (e: unknown) => { if (!c.signal.aborted) setError(e instanceof Error ? e.message : "No se pudo abrir el documento."); },
    );
    return () => c.abort();
  }, [id, intento]);

  useEffect(() => {
    let vivo = true;
    (async () => {
      const [{ crearMaquetador }, regular, bold, membrete] = await Promise.all([
        import("@/lib/formatos/documento/pdf"), bytes("/fonts/Archivo-Regular.ttf"), bytes("/fonts/Archivo-SemiBold.ttf"), fetchLetterhead(),
      ]);
      const maquetar = await crearMaquetador({ regular, bold, ...membrete });
      if (vivo) setRender(() => maquetar);
    })().catch((e: unknown) => { if (vivo) setFallaHoja(e instanceof Error ? e.message : "No se pudo preparar la hoja."); });
    return () => { vivo = false; };
  }, []);

  const definicion: FormatoDefinition | null = useMemo(() => { try { return doc ? formatoById(doc.formato_id) : null; } catch { return null; } }, [doc]);
  const valores = useMemo(() => doc?.data ?? {}, [doc]);
  const borrador = editando?.borrador;
  const vista = useMemo(() => (borrador ? aplicar(valores, borrador) : valores), [valores, borrador]);
  const faltan = useMemo(() => (doc ? faltantes(doc.formato_id, valores, folio) : []), [doc, valores, folio]);
  const clavesFaltan = useMemo(() => new Set([
    ...(definicion?.fields ?? []).filter((f) => faltan.includes(f.label)).map((f) => f.key),
    ...faltan.map((l) => FALTA_IMAGEN[l]).filter(Boolean),
  ]), [definicion, faltan]);

  // Imágenes del documento (04 y 07): la lista de adjuntos y, de ellas, solo las elegidas se bajan para dibujarse en la hoja.
  const formatoId = doc?.formato_id ?? "";
  const expedienteId = doc?.expediente_id ?? "";
  const conImagenes = CON_IMAGENES.has(formatoId);
  const [adjuntos, setAdjuntos] = useState<Adjunto[]>([]);
  const [imagenes, setImagenes] = useState<Record<string, ImagenDocumento>>({});
  useEffect(() => {
    if (!conImagenes) return;
    const c = new AbortController();
    leerAdjuntos(id, c.signal).then(setAdjuntos, () => { /* sin la lista, la hoja sale sin imágenes y se puede subir de nuevo */ });
    return () => c.abort();
  }, [id, conImagenes]);
  const elegidas = useMemo(() => idsElegidos(vista).join(","), [vista]);
  useEffect(() => {
    let vivo = true;
    const faltantesImg = adjuntos.filter((a) => elegidas.split(",").includes(a.id) && !imagenes[a.id]);
    if (!faltantesImg.length) return;
    Promise.all(faltantesImg.map(async (a) => [a.id, await imagenDe(a)] as const)).then((xs) => {
      if (vivo) setImagenes((old) => ({ ...old, ...Object.fromEntries(xs.filter((x): x is readonly [string, ImagenDocumento] => !!x[1])) }));
    });
    return () => { vivo = false; };
  }, [adjuntos, elegidas, imagenes]);
  // Las direcciones locales de las imágenes se liberan al cerrar la ventana.
  const imagenesRef = useRef(imagenes);
  useEffect(() => { imagenesRef.current = imagenes; }, [imagenes]);
  useEffect(() => () => { for (const i of Object.values(imagenesRef.current)) if (i.href) URL.revokeObjectURL(i.href); }, []);
  const fotos = useMemo(() => opcionesDe(adjuntos, "foto"), [adjuntos]);

  // Datos confirmados del asunto: llenan espacios vacíos con un botón y se ofrecen al llenar cada espacio.
  const [datosAsunto, setDatosAsunto] = useState<DatosGuardados | null>(null);
  useEffect(() => {
    if (!expedienteId) return;
    const c = new AbortController();
    leerDatosAsunto(expedienteId, c.signal).then(setDatosAsunto, () => { /* sin datos del asunto, la hoja se llena a mano */ });
    return () => c.abort();
  }, [expedienteId]);

  // La hoja se vuelve a dibujar con cada tecla: así se ve en vivo.
  useEffect(() => {
    const armar = doc ? DOCUMENTOS[doc.formato_id] : undefined;
    if (!render || !armar || !doc) return;
    let vivo = true;
    const aviso = emiteIncompleto(doc.formato_id) ? avisoIncompleto(faltan) : undefined;
    render({ ...armar({ ...vista, folio }, { imagenes }), aviso }).then((m) => { if (vivo) setMaqueta(m); }, (e: unknown) => { if (vivo) setFallaHoja(e instanceof Error ? e.message : "No se pudo dibujar la hoja."); });
    return () => { vivo = false; };
  }, [render, doc, vista, folio, faltan, imagenes]);

  /** Guarda y devuelve los datos nuevos (null si falló). Con `previo`, el aviso ofrece Deshacer. */
  const guardar = async (datos: Record<string, unknown>, aviso: string | null, previo?: Record<string, unknown>): Promise<Record<string, unknown> | null> => {
    if (!doc) return null;
    setOcupado(true);
    try {
      const nuevo = await guardarDocumento(doc.id, doc.version, datos);
      setDoc(nuevo);
      if (aviso) avisar(aviso, previo ? { etiqueta: "Deshacer", alAccionar: () => {
        setDoc((actual) => {
          if (actual) guardarDocumento(actual.id, actual.version, previo).then((d) => { setDoc(d); avisar("Se deshizo"); }, (e: unknown) => avisar(e instanceof Error ? e.message : "No se pudo deshacer."));
          return actual;
        });
      } } : undefined);
      return nuevo.data;
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se guardó. Vuelve a intentarlo.");
      return null;
    } finally { setOcupado(false); }
  };

  // Lo escrito no se pierde (AUD-05): al pasar a otro espacio, al cerrar o en «Siguiente» se guarda solo, con Deshacer.
  const pendiente = editando ? cambiosDe(editando.borrador, valores) : {};
  const hayPendiente = Object.keys(pendiente).length > 0;
  /** Guarda lo pendiente del espacio abierto. Devuelve los datos con que seguir, o null si no se pudo guardar (el espacio sigue abierto). */
  const guardarPendiente = async (): Promise<Record<string, unknown> | null> => {
    if (!editando || !hayPendiente) return valores;
    return guardar(aplicar(valores, pendiente), "Guardado", valores);
  };
  const abrirCon = (zona: Zona, base: Record<string, unknown>) => {
    setEditando({ zona, borrador: Object.fromEntries(zona.keys.map((k) => [k, base[k]])) });
    // En el teléfono la hoja de edición tapa la parte de abajo: el espacio sube arriba para verse mientras se llena.
    const movil = window.matchMedia("(max-width: 900px)").matches;
    requestAnimationFrame(() => zonas.current.get(zonaId(zona))?.scrollIntoView({ block: movil ? "start" : "nearest", behavior: "smooth" }));
  };
  const abrir = async (zona: Zona) => {
    if (editando && zonaId(editando.zona) === zonaId(zona)) return;
    const base = await guardarPendiente();
    if (base) abrirCon(zona, base);
  };
  // Si se cierra la pestaña o se recarga con algo escrito sin guardar, el navegador pregunta antes.
  useEffect(() => {
    if (!hayPendiente) return;
    const aviso = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, [hayPendiente]);
  const cerrarVentana = async () => {
    if (await guardarPendiente()) router.push(regreso);
  };

  const siguienteVacia = () => {
    const z = maqueta?.zonas.find((x) => x.keys.some((k) => clavesFaltan.has(k)) && (!editando || zonaId(x) !== zonaId(editando.zona)));
    if (z) void abrir(z);
  };

  // Uno por uno: la lista se toma al empezar (o al cambiar «solo lo que falta») y no cambia mientras se llena.
  const empezarLista = (soloFalta: boolean) => {
    const zs = maqueta ? espaciosEnOrden(maqueta.zonas, valores, { soloFalta, faltan: clavesFaltan }) : [];
    if (!zs.length) { avisar(soloFalta ? "No falta nada" : "Esta hoja no tiene espacios para llenar"); setLista(null); return; }
    setLista({ zonas: zs, i: 0, soloFalta });
    void abrir(zs[0]);
  };
  const moverLista = async (paso: 1 | -1) => {
    if (!lista) return;
    const i = lista.i + paso;
    if (i < 0) return;
    if (i >= lista.zonas.length) {
      if (await guardarPendiente()) { setLista(null); setEditando(null); avisar(lista.soloFalta ? "Llegaste al último que faltaba" : "Llegaste al último espacio"); }
      return;
    }
    const base = await guardarPendiente();
    if (!base) return;
    setLista({ ...lista, i });
    abrirCon(lista.zonas[i], base);
  };

  const aceptar = async () => {
    if (!editando) return;
    if (lista) { await moverLista(1); return; }
    if (!hayPendiente) { setEditando(null); return; }
    if (await guardarPendiente()) setEditando(null);
  };

  // DEC-61: el aviso de privacidad (01) y la promesa (15) ya se emiten incompletos, pero antes se confirma la leyenda.
  const generar = async (confirmado = false) => {
    if (!doc) return;
    if (!confirmado && faltan.length && ["01", "15"].includes(doc.formato_id)) {
      avisar("Faltan datos: se emitirá con la leyenda «Documento incompleto» en cada hoja.",{ etiqueta: "Generar así", alAccionar: () => void generar(true) });
      return;
    }
    setOcupado(true);
    try {
      const e = await emitirDocumento(doc.id, doc.version, faltan.length > 0);
      setEmisiones((xs) => [e, ...xs]);
      avisar(faltan.length ? `PDF generado con ${faltan.length} ${faltan.length === 1 ? "pendiente" : "pendientes"}` : "PDF generado");
      await descargarEmision(e.id, `${folio || "Fortius"} ${doc.formato_id} ${tituloFormato(doc.formato_id)}.pdf`).catch((err: unknown) => avisar(err instanceof Error ? err.message : "No se pudo descargar."));
    } catch (err) {
      avisar(err instanceof Error ? err.message : "No se pudo generar el PDF.");
    } finally { setOcupado(false); }
  };

  if (error) return <div className="pn-captura" ref={raiz}><div className="pn-captura-mensaje"><EstadoError texto={error} alReintentar={() => { setError(null); setIntento((n) => n + 1); }} /><BotonCerrar href={regreso} /></div></div>;
  if (!doc || !definicion) return <div className="pn-captura" ref={raiz}><div className="pn-captura-mensaje"><Cargando lineas={4} etiqueta="Abriendo el documento" /></div></div>;

  const vigente = emisiones.find((e) => e.draft_version === doc.version);
  // En la zona que se edita: espacios de imagen (foto principal, croquis), campos simples y tablas con filas.
  const ranuras = editando && conImagenes ? editando.zona.keys.filter(esRanuraImagen) : [];
  const editables = editando ? editando.zona.keys.filter((k) => !ranuras.includes(k as (typeof ranuras)[number])).map((k) => campoDe(definicion, k)).filter((f): f is FormatoField => !!f) : [];
  const simples = editables.filter(esSimple);
  const tablas = editables.filter((f) => !esSimple(f)).map((f) => ({ campo: f, tabla: tablaDe(doc.formato_id, f.key) })).filter((x): x is { campo: FormatoField; tabla: NonNullable<ReturnType<typeof tablaDe>> } => !!x.tabla);
  const otros = editables.length - simples.length - tablas.length;
  const guardables = simples.length + tablas.length + ranuras.length;
  const clavesFormato = new Set(definicion.fields.map((f) => f.key));
  const cambiarBorrador = (cambio: Record<string, unknown>) => setEditando((x) => (x ? { ...x, borrador: { ...x.borrador, ...cambio } } : x));
  const sumarAdjunto = (a: Adjunto) => setAdjuntos((xs) => (xs.some((x) => x.id === a.id) ? xs : [...xs, a]));
  const llenar = (cambio: Record<string, unknown>, aviso: string) => { void guardar(aplicar(valores, cambio), aviso, valores); };
  // Lo dictado se suma a lo que ya tiene el espacio en ese momento.
  const dictarEn = (clave: string, texto: string) => setEditando((x) => (x ? { ...x, borrador: { ...x.borrador, [clave]: unirDictado(x.borrador[clave], texto) } } : x));
  const enUso = new Set(idsElegidos(valores));

  /**
   * Quitar una imagen del documento (recuperable): si la hoja la usa, primero se saca de su espacio (guardado con versión)
   * y luego el servidor la quita. Si el servidor no la quita, vuelve a su espacio. «Deshacer» la restaura y la regresa a la hoja.
   */
  const quitarImagen = async (a: Adjunto) => {
    if (!doc) return;
    const previo = valores;
    const parche = sinImagen(valores, a.id);
    const cambiaHoja = Object.keys(parche).length > 0;
    setOcupado(true);
    try {
      if (cambiaHoja) { const d = await guardarDocumento(doc.id, doc.version, aplicar(valores, parche)); setDoc(d); docRef.current = d; }
      try { await quitarAdjunto(a.id); }
      catch (e) {
        const actual = docRef.current;
        if (cambiaHoja && actual) {
          const d = await guardarDocumento(actual.id, actual.version, aplicar(actual.data, Object.fromEntries(Object.keys(parche).map((k) => [k, previo[k]])))).catch(() => null);
          if (d) { setDoc(d); docRef.current = d; }
        }
        throw e;
      }
      setAdjuntos((xs) => xs.filter((x) => x.id !== a.id));
      avisar(cambiaHoja ? "Imagen quitada de la hoja y del documento" : "Imagen quitada del documento", { etiqueta: "Deshacer", alAccionar: () => void deshacerQuitarImagen(a, cambiaHoja ? Object.fromEntries(Object.keys(parche).map((k) => [k, previo[k]])) : null) });
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se pudo quitar la imagen.");
    } finally { setOcupado(false); }
  };
  const deshacerQuitarImagen = async (a: Adjunto, espacios: Record<string, unknown> | null) => {
    try {
      const r = await restaurarAdjunto(a.id);
      setAdjuntos((xs) => devolver(xs, { ...a, ...r }, false));
      const actual = docRef.current;
      if (espacios && actual) { const d = await guardarDocumento(actual.id, actual.version, aplicar(actual.data, espacios)); setDoc(d); docRef.current = d; }
      avisar("Se deshizo");
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se pudo deshacer.");
    }
  };
  // Una sola cuenta: los espacios de la hoja que faltan (lo mismo que recorre «Uno por uno» con «Solo lo que falta»).
  // Si algún dato faltante no tiene espacio en la hoja, se cuenta aparte para no esconderlo.
  const zonaDeFalta = (l: string) => {
    const clave = FALTA_IMAGEN[l] ?? definicion.fields.find((x) => x.label === l)?.key;
    return clave ? maqueta?.zonas.find((x) => x.keys.includes(clave)) : undefined;
  };
  const espaciosFaltan = maqueta ? espaciosEnOrden(maqueta.zonas, valores, { soloFalta: true, faltan: clavesFaltan }).length : 0;
  const sinEspacio = maqueta ? faltan.filter((l) => !zonaDeFalta(l)).length : faltan.length;
  const cuentaFalta = textoFalta(espaciosFaltan, sinEspacio);
  const totalEspacios = maqueta?.zonas.length ?? 0;
  const llenos = totalEspacios - espaciosFaltan;
  const textoPdf = faltan.length && puedeGenerar(doc.formato_id, faltan.length)
    ? `Generar PDF con ${faltan.length} ${faltan.length === 1 ? "pendiente" : "pendientes"}`
    : "Generar PDF";
  const nota = faltan.length && puedeGenerar(doc.formato_id, faltan.length) ? "El PDF se puede generar aunque falten datos; solo avisa." : null;
  const botonPdf = (clase: string) => (
    <Boton className={clase} deshabilitado={ocupado || !puedeGenerar(doc.formato_id, faltan.length)} onClick={() => void generar()}>{textoPdf}</Boton>
  );
  /** «Guardar borrador»: lo escrito se guarda al momento; si hay algo abierto sin guardar, se guarda ahora (con Deshacer). */
  const guardarBorrador = async () => {
    if (!hayPendiente) { avisar("Borrador guardado"); return; }
    if (await guardar(aplicar(valores, pendiente), "Borrador guardado", valores)) { setEditando(null); setLista(null); }
  };
  /** Cerrar el espacio abierto (velo, Esc): lo escrito se guarda, no se pierde. */
  const cerrarEspacio = async () => {
    if (await guardarPendiente()) { setEditando(null); setLista(null); }
  };
  const irAFalta = (z: Zona) => { setVerFaltan(false); void abrir(z); };
  const empezarUno = () => empezarLista(faltan.length > 0);

  // Avance del documento (boceto): cuántos espacios ya tienen dato. Va en el lateral y, en el teléfono, bajo la barra.
  const avance = (clase: string) => totalEspacios ? (
    <div className={`pn-captura-progreso ${clase}`}>
      <div className="pn-captura-pista" role="progressbar" aria-label="Espacios llenos" aria-valuemin={0} aria-valuemax={totalEspacios} aria-valuenow={llenos}>
        <span style={{ width: `${(llenos / totalEspacios) * 100}%` }} />
      </div>
      <div className="pn-captura-progreso-fila">
        <span>{llenos} de {totalEspacios} espacios</span>
        {!lista && maqueta ? <button type="button" className="pn-captura-enlace" onClick={empezarUno}>Uno por uno</button> : null}
      </div>
    </div>
  ) : null;

  return (
    <div className="pn-captura" ref={raiz} data-lista={lista ? "" : undefined} data-editando={editando ? "" : undefined}
      onKeyDown={(e) => {
        if (e.key !== "Escape" || e.defaultPrevented) return;
        if ((e.target as HTMLElement).closest("[role=listbox], [role=menu], [role=dialog][data-state]")) return;
        e.preventDefault();
        if (editando) void cerrarEspacio(); else void cerrarVentana();
      }}>
      {/* En escritorio la captura flota sobre la pantalla; tocar fuera cierra (guarda antes lo pendiente). */}
      <button type="button" className="pn-captura-fondo" tabIndex={-1} aria-hidden="true" onClick={() => void cerrarVentana()} />
      <div className="pn-captura-ventana" role="dialog" aria-modal="true" aria-label={`${doc.formato_id} · ${definicion.title}`}>
        {/* Teléfono: barra con «‹ Formatos» y lo que falta. */}
        <header className="pn-captura-barra">
          <BotonCerrar href={regreso} alCerrar={hayPendiente ? () => void cerrarVentana() : undefined} conTexto />
          {faltan.length ? (
            <button type="button" className="pn-captura-falta-boton" aria-expanded={verFaltan} onClick={() => setVerFaltan((v) => !v)}>{cuentaFalta}</button>
          ) : <span className="pn-captura-listo"><Icono nombre="verificado" tamano={16} />Completo</span>}
        </header>
        {avance("pn-captura-solo-movil")}

        <div className="pn-captura-cuerpo">
          <div className="pn-captura-mesa">
            {verFaltan && faltan.length ? <div className="pn-captura-solo-movil"><ListaFaltan faltan={faltan} zonaDe={zonaDeFalta} alIr={irAFalta} /></div> : null}
            <div className="pn-captura-hojas">
              <div className="pn-captura-encabezado">
                <span className="pn-captura-folio"><span className="pn-captura-num">{doc.formato_id}</span>{folio ? <span>Folio {folio} · lo pone el sistema</span> : null}</span>
                <h1>{definicion.title}</h1>
                {asunto ? <span className="pn-captura-asunto">{asunto}</span> : null}
              </div>
              {faltan.length ? <p className="pn-captura-nota">Toca un espacio de la hoja para llenarlo.</p> : null}
              {fallaHoja ? <EstadoError texto={fallaHoja} /> : !maqueta ? <Cargando lineas={6} etiqueta="Preparando la hoja" /> : maqueta.pages.map((trazos, pagina) => (
                <div key={pagina} className="pn-captura-hoja">
                  <svg viewBox={`0 0 ${maqueta.width} ${maqueta.height}`} role="img" aria-label={`Hoja ${pagina + 1} de ${maqueta.pages.length}`}>
                    {trazos.map((t, i) => <Dibujo key={i} trazo={t} alto={maqueta.height} />)}
                  </svg>
                  {maqueta.zonas.filter((z) => z.page === pagina).map((z) => {
                    const clave = zonaId(z);
                    const falta = z.keys.some((k) => clavesFaltan.has(k));
                    const activa = editando ? zonaId(editando.zona) === clave : false;
                    return (
                      <button key={clave} type="button" className="pn-captura-zona" data-falta={falta || undefined} data-activa={activa || undefined}
                        ref={(el) => { if (el) zonas.current.set(clave, el); else zonas.current.delete(clave); }}
                        aria-label={`${z.label}${falta ? " (falta)" : ""}`} onClick={() => {
                          // En «uno por uno», tocar un espacio de la lista salta a él; uno fuera de la lista sale del modo.
                          const i = lista ? lista.zonas.findIndex((x) => zonaId(x) === clave) : -1;
                          if (lista) setLista(i >= 0 ? { ...lista, i } : null);
                          void abrir(z);
                        }}
                        style={{ left: `${(z.x / maqueta.width) * 100}%`, top: `${((maqueta.height - z.y - z.h) / maqueta.height) * 100}%`, width: `${(z.w / maqueta.width) * 100}%`, height: `${(z.h / maqueta.height) * 100}%` }} />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <aside className="pn-captura-lado" aria-label="Captura">
            <div className="pn-captura-lado-cabeza">
              <h2>Captura</h2>
              <BotonCerrar href={regreso} alCerrar={hayPendiente ? () => void cerrarVentana() : undefined} />
            </div>
            {avance("pn-captura-solo-escritorio")}

            {editando ? (
              <>
                {/* Teléfono: el espacio se llena en una hoja que sube desde abajo; tocar fuera la cierra y guarda. */}
                {!lista ? <button type="button" className="pn-captura-velo" tabIndex={-1} aria-hidden="true" onClick={() => void cerrarEspacio()} /> : null}
                <form className="pn-captura-ed" aria-label={editando.zona.label} onSubmit={(e) => { e.preventDefault(); void aceptar(); }}>
                  <span className="pn-captura-asa" aria-hidden="true" />
                  {lista ? (
                    <div className="pn-captura-avance">
                      <p aria-live="polite">Espacio {lista.i + 1} de {lista.zonas.length}{lista.soloFalta ? " que faltan" : ""}</p>
                      <div className="pn-captura-pista" role="progressbar" aria-label="Avance" aria-valuemin={1} aria-valuemax={lista.zonas.length} aria-valuenow={lista.i + 1}>
                        <span style={{ width: `${((lista.i + 1) / lista.zonas.length) * 100}%` }} />
                      </div>
                    </div>
                  ) : null}
                  {/* Si el espacio es un solo campo con el mismo nombre, el título no se repite en pantalla. */}
                  <h3 className={simples.length === 1 && !tablas.length && !ranuras.length && simples[0].label === editando.zona.label ? "sr-only" : undefined}>{editando.zona.label}</h3>
                  {ranuras.map((r) => (
                    <ElegirImagen key={r} ranura={r} documentoId={doc.id} adjuntos={adjuntos} valor={editando.borrador[r]} alSubir={sumarAdjunto}
                      alElegir={(v) => cambiarBorrador({ [r]: v || undefined, ...fechaAlElegir(r, adjuntos.find((a) => a.id === v), editando.borrador, valores, clavesFormato) })} />
                  ))}
                  {simples.map((f) => (
                    <div key={f.key} className="pn-captura-pila">
                      <CampoFormato campo={f} valor={editando.borrador[f.key]} alCambiar={(v) => cambiarBorrador({ [f.key]: v })} />
                      {f.type === "text" || f.type === "long" ? <div><Dictar etiqueta={f.label} alDictar={(t) => dictarEn(f.key, t)} alFallar={(m) => avisar(m)} /></div> : null}
                      <DatoDelAsunto formatoId={doc.formato_id} campo={f} valor={editando.borrador[f.key]} datos={datosAsunto} alUsar={(v) => cambiarBorrador({ [f.key]: v })} />
                    </div>
                  ))}
                  {tablas.map(({ campo, tabla }) => (
                    <div key={campo.key} className="pn-captura-pila">
                      <EditorTabla tabla={tabla} valor={editando.borrador[campo.key]} fotos={fotos} alCambiar={(v) => cambiarBorrador({ [campo.key]: v })} alFallarDictado={(m) => avisar(m)} />
                      {llevaImagenes(tabla) && conImagenes ? <SubirImagen documentoId={doc.id} tipo="foto" alSubir={sumarAdjunto} /> : null}
                    </div>
                  ))}
                  {otros ? <p className="pn-sub" style={{ margin: 0 }}>Esta parte se calcula sola con lo demás de la hoja.</p> : null}
                  {lista && CAPTURA_POR_LISTA.has(doc.formato_id) && Object.keys(parcheNoSabe(simples, editando.borrador)).length ? (
                    <div><Boton variante="texto" onClick={() => cambiarBorrador(parcheNoSabe(simples, editando.borrador))}>No sabe</Boton></div>
                  ) : null}
                  {lista ? (
                    <>
                      <div className="pn-captura-pasos">
                        <Boton type="submit" deshabilitado={ocupado}>{lista.i + 1 < lista.zonas.length ? "Siguiente" : "Terminar"}</Boton>
                        <Boton variante="secundario" deshabilitado={ocupado || lista.i === 0} onClick={() => void moverLista(-1)}>Anterior</Boton>
                        <Boton variante="texto" onClick={() => void cerrarEspacio()}>Salir</Boton>
                      </div>
                      <Interruptor etiqueta="Espacios" valor={lista.soloFalta ? "falta" : "todos"} alElegir={(v) => { void guardarPendiente().then((ok) => { if (ok) empezarLista(v === "falta"); }); }}
                        opciones={[{ valor: "todos", etiqueta: "Todos" }, { valor: "falta", etiqueta: "Solo lo que falta" }]} />
                    </>
                  ) : (
                    <>
                      <div className="pn-captura-pasos">
                        <Boton type="submit" deshabilitado={ocupado}>Listo</Boton>
                        {simples.length ? <Boton variante="secundario" onClick={() => cambiarBorrador(Object.fromEntries(simples.map((f) => [f.key, undefined])))}>Borrar</Boton> : null}
                      </div>
                      <div className="pn-captura-mas">
                        {hayPendiente ? <Boton variante="texto" onClick={() => setEditando(null)}>Descartar</Boton> : null}
                        {faltan.length ? <Boton variante="texto" onClick={siguienteVacia}>Siguiente vacío</Boton> : null}
                      </div>
                      {hayPendiente ? <p className="pn-sub" style={{ margin: 0 }}>Si tocas otro espacio o cierras, se guarda solo.</p> : null}
                    </>
                  )}
                </form>
              </>
            ) : null}

            {faltan.length ? (
              <div className="pn-captura-bloque-faltan">
                <span className="pn-captura-rotulo">{cuentaFalta}</span>
                <ListaFaltan faltan={faltan} zonaDe={zonaDeFalta} alIr={irAFalta} />
              </div>
            ) : !editando ? (
              <p className="pn-captura-bloque-faltan pn-sub" style={{ margin: 0 }}>Todo lleno. Toca cualquier espacio de la hoja para cambiarlo.</p>
            ) : null}

            {!editando ? <DatosDelAsunto formatoId={doc.formato_id} valores={valores} datos={datosAsunto} ocupado={ocupado} alLlenar={llenar} /> : null}
            {!editando && conImagenes ? (
              <section className="pn-captura-campo" aria-labelledby="imagenes-doc">
                <h2 id="imagenes-doc">Imágenes</h2>
                <p className="pn-sub" style={{ margin: 0 }}>{adjuntos.length ? `${adjuntos.length} ${adjuntos.length === 1 ? "imagen subida" : "imágenes subidas"}. Toca su espacio en la hoja para elegirla.` : "Toca el espacio de la foto o del croquis en la hoja para subirla."}</p>
                <ImagenesDelDocumento adjuntos={adjuntos} enUso={enUso} ocupado={ocupado} alQuitar={(a) => void quitarImagen(a)} />
                <SubirImagen documentoId={doc.id} alSubir={sumarAdjunto} />
              </section>
            ) : null}
            {!editando && expedienteId ? <DocumentosDelCliente expedienteId={expedienteId} /> : null}
            <section className="pn-captura-campo pn-captura-emitidos">
              <h2>PDF generados</h2>
              {emisiones.length ? (
                <ul className="pn-captura-faltan">
                  {emisiones.map((e) => (
                    <PdfEmitido key={e.id} emision={e} actual={e.draft_version === doc.version} alAvisar={(t) => avisar(t)}
                      alDescargar={() => void descargarEmision(e.id, `${folio || "Fortius"} ${doc.formato_id}.pdf`).catch((err: unknown) => avisar(err instanceof Error ? err.message : "No se pudo descargar."))} />
                  ))}
                </ul>
              ) : <p className="pn-sub" style={{ margin: 0 }}>Todavía no se genera ninguno.</p>}
              {!vigente && emisiones.length ? <p className="pn-sub" style={{ margin: 0 }}>Hay cambios después del último PDF.</p> : null}
            </section>

            {/* Escritorio: la acción principal abajo del lateral, como el boceto. */}
            <div className="pn-captura-lado-pie">
              {botonPdf("pn-captura-grande")}
              <Boton variante="secundario" className="pn-captura-grande" deshabilitado={ocupado} onClick={() => void guardarBorrador()}>Guardar borrador</Boton>
              {nota ? <p>{nota}</p> : null}
            </div>
          </aside>
        </div>

        {/* Teléfono: Guardar y Generar PDF fijos abajo. */}
        <div className="pn-captura-pie">
          <Boton variante="secundario" deshabilitado={ocupado} onClick={() => void guardarBorrador()}>Guardar</Boton>
          {botonPdf("pn-captura-pie-pdf")}
        </div>
      </div>
    </div>
  );
}

/** Lo que falta, como en el boceto: una fila por dato con flecha; lleva a su espacio en la hoja. */
function ListaFaltan({ faltan, zonaDe, alIr }: { faltan: string[]; zonaDe: (l: string) => Zona | undefined; alIr: (z: Zona) => void }) {
  return (
    <ul className="pn-captura-lista-faltan">
      {faltan.slice(0, 40).map((l) => {
        const z = zonaDe(l);
        return (
          <li key={l}>
            {z ? (
              <button type="button" onClick={() => alIr(z)}><span>{l}</span><Gesto nombre="derecha" tamano={16} /></button>
            ) : <span>{l}</span>}
          </li>
        );
      })}
    </ul>
  );
}

/** La X (o «‹ Formatos» en el teléfono) regresa a donde se estaba. Con algo escrito sin guardar, primero lo guarda. */
function BotonCerrar({ href, alCerrar, conTexto }: { href: string; alCerrar?: () => void; conTexto?: boolean }) {
  const enAsunto = href.startsWith("/panel/asuntos");
  const aDonde = enAsunto ? "al asunto" : "a Formatos";
  return (
    <Link href={href} className={conTexto ? "pn-captura-volver" : "pn-captura-cerrar"} aria-label={conTexto ? undefined : `Cerrar y volver ${aDonde}`}
      onClick={alCerrar ? (e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; e.preventDefault(); alCerrar(); } : undefined}>
      {conTexto ? <><Gesto nombre="izquierda" tamano={20} />{enAsunto ? "Asunto" : "Formatos"}</> : <Gesto nombre="cerrar" tamano={18} />}
    </Link>
  );
}

function CampoFormato({ campo, valor, alCambiar }: { campo: FormatoField; valor: unknown; alCambiar: (v: unknown) => void }) {
  const etiqueta = campo.required ? campo.label : `${campo.label} (opcional)`;
  if (campo.type === "choice" && campo.options) {
    return <Desplegable etiqueta={etiqueta} valor={typeof valor === "string" ? valor : ""} vacio="Sin elegir" opciones={campo.options.map((o) => ({ valor: o.value, etiqueta: o.label }))} alElegir={(v) => alCambiar(v || undefined)} />;
  }
  if (campo.type === "multi" && campo.options) {
    const elegidos = Array.isArray(valor) ? (valor as string[]) : [];
    return (
      <fieldset className="pn-campo" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend style={{ padding: 0 }}>{etiqueta}</legend>
        {campo.options.map((o) => (
          <label key={o.value} style={{ display: "flex", gap: 8, alignItems: "center", minHeight: 44 }}>
            <Checkbox checked={elegidos.includes(o.value)} onCheckedChange={(c) => alCambiar(c ? [...elegidos, o.value] : elegidos.filter((x) => x !== o.value))} />
            {o.label}
          </label>
        ))}
      </fieldset>
    );
  }
  if (campo.type === "long") {
    return (
      <div className="pn-campo">
        <label htmlFor={`f-${campo.key}`}>{etiqueta}</label>
        <textarea id={`f-${campo.key}`} rows={5} value={textoDe(campo, valor)} onChange={(e) => alCambiar(valorCapturado(campo, e.target.value))} />
      </div>
    );
  }
  const tipo = campo.type === "date" ? "date" : campo.type === "time" ? "time" : "text";
  return (
    <Campo etiqueta={etiqueta} type={tipo} dinero={campo.type === "money"} inputMode={campo.type === "money" || campo.type === "number" ? "decimal" : undefined}
      value={textoDe(campo, valor)} autoComplete="off"
      onChange={(e) => alCambiar(valorCapturado(campo, e.target.value))} />
  );
}

function Dibujo({ trazo, alto }: { trazo: Trazo; alto: number }) {
  switch (trazo.kind) {
    // El ancho medido por el PDF manda: cada renglón calza igual aunque la letra de pantalla difiera un poco.
    case "text": return <text className={trazo.serif ? "pn-doc-serif" : "pn-doc-texto"} x={trazo.x} y={alto - trazo.y} fontSize={trazo.size} fontWeight={trazo.bold ? (trazo.serif ? 700 : 600) : 400} fill={`#${trazo.color}`} {...(trazo.w > 0 && trazo.text.trim() ? { textLength: trazo.w, lengthAdjust: "spacingAndGlyphs" as const } : {})}>{trazo.text}</text>;
    case "rect": return <rect x={trazo.x} y={alto - trazo.y - trazo.h} width={trazo.w} height={trazo.h} fill={trazo.fill ? `#${trazo.fill}` : "none"} stroke={trazo.stroke ? `#${trazo.stroke}` : undefined} strokeWidth={trazo.stroke ? trazo.strokeWidth ?? 1 : undefined} />;
    case "line": return <line x1={trazo.x1} y1={alto - trazo.y1} x2={trazo.x2} y2={alto - trazo.y2} stroke={`#${trazo.color}`} strokeWidth={trazo.width} />;
    case "image": return <image href={trazo.href} x={trazo.x} y={alto - trazo.y - trazo.h} width={trazo.w} height={trazo.h} preserveAspectRatio="xMidYMid meet" />;
  }
}
