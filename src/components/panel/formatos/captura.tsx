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
  CON_IMAGENES, esRanuraImagen, FALTA_IMAGEN, fechaAlElegir, idsElegidos, imagenDe, leerAdjuntos, leerDatosAsunto, opcionesDe, type Adjunto,
} from "@/lib/panel/datos/formatos-adjuntos";

import { CAPTURA_POR_LISTA, parcheNoSabe } from "@/lib/formatos/captura-lista";
import { cambiosDe, espaciosEnOrden, rutaDeRegreso, textoFalta, zonaId } from "@/lib/panel/datos/formatos-navegacion";
import { Interruptor } from "@/components/panel/kit/segmentado";

import { ElegirImagen, SubirImagen } from "./imagenes";
import { DatoDelAsunto, DatosDelAsunto, DocumentosDelCliente, PdfEmitido } from "./lado";
import { EditorTabla } from "./tabla";
import "./captura.css";

/**
 * Captura sobre el documento (DEC-31, boceto «Formatos»): la hoja se ve como saldrá en PDF —la dibuja el mismo escritor del PDF—
 * y cada espacio se llena tocándolo; lo escrito aparece al momento en la hoja. Nada frena: «Faltan N espacios» lleva a cada espacio vacío
 * y «Generar PDF» funciona con pendientes (salvo el 01 y el 15, que el servidor exige completos).
 * Ventana propia: ocupa toda la pantalla, con la hoja a la izquierda y, a la derecha, el campo que se edita y lo que falta.
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
    requestAnimationFrame(() => zonas.current.get(zonaId(zona))?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
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

  const generar = async () => {
    if (!doc) return;
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
  // Una sola cuenta: los espacios de la hoja que faltan (lo mismo que recorre «Uno por uno» con «Solo lo que falta»).
  // Si algún dato faltante no tiene espacio en la hoja, se cuenta aparte para no esconderlo.
  const zonaDeFalta = (l: string) => {
    const clave = FALTA_IMAGEN[l] ?? definicion.fields.find((x) => x.label === l)?.key;
    return clave ? maqueta?.zonas.find((x) => x.keys.includes(clave)) : undefined;
  };
  const espaciosFaltan = maqueta ? espaciosEnOrden(maqueta.zonas, valores, { soloFalta: true, faltan: clavesFaltan }).length : 0;
  const sinEspacio = maqueta ? faltan.filter((l) => !zonaDeFalta(l)).length : faltan.length;
  const cuentaFalta = textoFalta(espaciosFaltan, sinEspacio);

  return (
    <div className="pn-captura" ref={raiz} data-lista={lista ? "" : undefined} role="dialog" aria-modal="true" aria-label={`${doc.formato_id} · ${definicion.title}`}>
      <header className="pn-captura-barra">
        <BotonCerrar href={regreso} alCerrar={hayPendiente ? () => void cerrarVentana() : undefined} />
        <div className="pn-captura-titulo">
          <strong>{doc.formato_id} · {definicion.title}</strong>
          <span>{[folio, asunto].filter(Boolean).join(" · ")}</span>
        </div>
        <div className="pn-captura-acciones">
          {!lista && maqueta ? <Boton variante="secundario" className="pn-captura-uno" onClick={() => empezarLista(faltan.length > 0)}>Uno por uno</Boton> : null}
          {faltan.length ? <Boton variante="texto" onClick={siguienteVacia}>{cuentaFalta}</Boton> : <span className="pn-captura-listo"><Icono nombre="verificado" tamano={16} />Completo</span>}
          {/* Corto para que quepa en el teléfono; lo pendiente ya lo dice la cuenta de al lado y el aviso al generar. */}
          <Boton deshabilitado={ocupado || !puedeGenerar(doc.formato_id, faltan.length)} onClick={() => void generar()}
            aria-label={faltan.length && emiteIncompleto(doc.formato_id) ? `Generar PDF con pendientes (${cuentaFalta.toLowerCase()})` : undefined}>
            Generar PDF
          </Boton>
        </div>
      </header>

      <div className="pn-captura-cuerpo">
        <div className="pn-captura-mesa">
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

        <aside className="pn-captura-lado" aria-label="Captura">
          {editando ? (
            <form className="pn-captura-campo" onSubmit={(e) => { e.preventDefault(); void aceptar(); }}>
              {lista ? (
                // El avance va arriba; en el teléfono la hoja se esconde y queda un campo a la vez.
                <div className="pn-captura-avance">
                  <p aria-live="polite">Espacio {lista.i + 1} de {lista.zonas.length}{lista.soloFalta ? " que faltan" : ""}</p>
                  <div className="pn-captura-pista" role="progressbar" aria-label="Avance" aria-valuemin={1} aria-valuemax={lista.zonas.length} aria-valuenow={lista.i + 1}>
                    <span style={{ width: `${((lista.i + 1) / lista.zonas.length) * 100}%` }} />
                  </div>
                </div>
              ) : null}
              {/* Si el espacio es un solo campo con el mismo nombre, el título no se repite en pantalla. */}
              <h2 className={simples.length === 1 && !tablas.length && !ranuras.length && simples[0].label === editando.zona.label ? "sr-only" : undefined}>{editando.zona.label}</h2>
              {ranuras.map((r) => (
                <ElegirImagen key={r} ranura={r} documentoId={doc.id} adjuntos={adjuntos} valor={editando.borrador[r]} alSubir={sumarAdjunto}
                  alElegir={(v) => cambiarBorrador({ [r]: v || undefined, ...fechaAlElegir(r, adjuntos.find((a) => a.id === v), editando.borrador, valores, clavesFormato) })} />
              ))}
              {simples.map((f) => (
                <div key={f.key} style={{ display: "grid", gap: 8 }}>
                  <CampoFormato campo={f} valor={editando.borrador[f.key]} alCambiar={(v) => cambiarBorrador({ [f.key]: v })} />
                  <DatoDelAsunto formatoId={doc.formato_id} campo={f} valor={editando.borrador[f.key]} datos={datosAsunto} alUsar={(v) => cambiarBorrador({ [f.key]: v })} />
                </div>
              ))}
              {tablas.map(({ campo, tabla }) => (
                <div key={campo.key} style={{ display: "grid", gap: 12 }}>
                  <EditorTabla tabla={tabla} valor={editando.borrador[campo.key]} fotos={fotos} alCambiar={(v) => cambiarBorrador({ [campo.key]: v })} />
                  {llevaImagenes(tabla) && conImagenes ? <SubirImagen documentoId={doc.id} tipo="foto" alSubir={sumarAdjunto} /> : null}
                </div>
              ))}
              {otros ? <p className="pn-sub" style={{ margin: 0 }}>Esta parte se calcula sola con lo demás de la hoja.</p> : null}
              {lista && CAPTURA_POR_LISTA.has(doc.formato_id) && Object.keys(parcheNoSabe(simples, editando.borrador)).length ? (
                <div><Boton variante="texto" onClick={() => cambiarBorrador(parcheNoSabe(simples, editando.borrador))}>No sabe</Boton></div>
              ) : null}
              {lista ? (
                <div className="pn-captura-pasos">
                  <Boton type="submit" deshabilitado={ocupado}>{lista.i + 1 < lista.zonas.length ? "Siguiente" : "Terminar"}</Boton>
                  <Boton variante="secundario" deshabilitado={ocupado || lista.i === 0} onClick={() => void moverLista(-1)}>Anterior</Boton>
                  <Boton variante="texto" onClick={() => { void guardarPendiente().then((ok) => { if (ok) { setLista(null); setEditando(null); } }); }}>Salir</Boton>
                </div>
              ) : null}
              {lista ? (
                <Interruptor etiqueta="Espacios" valor={lista.soloFalta ? "falta" : "todos"} alElegir={(v) => { void guardarPendiente().then((ok) => { if (ok) empezarLista(v === "falta"); }); }}
                  opciones={[{ valor: "todos", etiqueta: "Todos" }, { valor: "falta", etiqueta: "Solo lo que falta" }]} />
              ) : null}
              {lista ? null : (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {guardables ? <Boton type="submit" deshabilitado={ocupado}>Guardar</Boton> : null}
                  <Boton variante="texto" onClick={() => setEditando(null)}>{hayPendiente ? "Descartar" : "Cerrar"}</Boton>
                  {faltan.length ? <Boton variante="texto" onClick={siguienteVacia}>Siguiente vacío</Boton> : null}
                </div>
              )}
              {!lista && hayPendiente ? <p className="pn-sub" style={{ margin: 0 }}>Si tocas otro espacio o cierras, se guarda solo.</p> : null}
            </form>
          ) : (
            <div className="pn-captura-campo">
              <h2>{faltan.length ? "Lo que falta" : "Todo lleno"}</h2>
              <p className="pn-sub" style={{ margin: 0 }}>Toca cualquier espacio de la hoja para llenarlo. Se guarda al aceptar.</p>
              {faltan.length ? (
                <ul className="pn-captura-faltan">
                  {faltan.slice(0, 40).map((l) => {
                    const z = zonaDeFalta(l);
                    return <li key={l}>{z ? <button type="button" onClick={() => void abrir(z)}>{l}</button> : <span>{l}</span>}</li>;
                  })}
                </ul>
              ) : null}
            </div>
          )}
          {!editando ? <DatosDelAsunto formatoId={doc.formato_id} valores={valores} datos={datosAsunto} ocupado={ocupado} alLlenar={llenar} /> : null}
          {!editando && conImagenes ? (
            <section className="pn-captura-campo" aria-labelledby="imagenes-doc">
              <h2 id="imagenes-doc">Imágenes</h2>
              <p className="pn-sub" style={{ margin: 0 }}>{adjuntos.length ? `${adjuntos.length} ${adjuntos.length === 1 ? "imagen subida" : "imágenes subidas"}. Toca su espacio en la hoja para elegirla.` : "Toca el espacio de la foto o del croquis en la hoja para subirla."}</p>
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
        </aside>
      </div>
    </div>
  );
}

/** La X regresa a donde se estaba (Formatos o el asunto). Con algo escrito sin guardar, primero lo guarda. */
function BotonCerrar({ href, alCerrar }: { href: string; alCerrar?: () => void }) {
  const aDonde = href.startsWith("/panel/asuntos") ? "al asunto" : "a Formatos";
  return (
    <Link href={href} className="pn-captura-cerrar" aria-label={`Cerrar y volver ${aDonde}`}
      onClick={alCerrar ? (e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; e.preventDefault(); alCerrar(); } : undefined}>
      <Gesto nombre="cerrar" tamano={20} />
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
