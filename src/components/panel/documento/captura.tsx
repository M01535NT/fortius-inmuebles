"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Icono } from "@/components/panel/icons";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Campo } from "@/components/panel/kit/campo";
import { Desplegable } from "@/components/panel/kit/desplegable";
import { Checkbox } from "@/components/panel/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/panel/ui/dropdown-menu";
import { EditorTabla } from "@/components/panel/formatos/tabla";
import { formatoById, type FormatoDefinition, type FormatoField } from "@/lib/formatos/catalog";
import { DOCUMENTOS } from "@/lib/formatos/documento";
import { mostrarCampoValor } from "@/lib/formatos/valor-fields";
import type { Maqueta, Trazo, Zona } from "@/lib/formatos/documento/pdf";
import { fetchLetterhead } from "@/lib/letterhead";
import { leerAsuntos, subir, type FilaAsunto } from "@/lib/panel/asuntos/api";
import { aplicar, campoDe, esSimple, faltantes, textoDe, valorCapturado } from "@/lib/panel/datos/formatos";
import { espaciosEnOrden, zonaId } from "@/lib/panel/datos/formatos-navegacion";
import { tablaDe } from "@/lib/panel/datos/formatos-tablas";
import {
  abrirTrabajo, descargarPdf, FORMATOS_CONTRATO, guardarTrabajo, pasarAUnAsunto, quitarTrabajo, type TrabajoAbierto,
} from "@/lib/panel/documentos/api";
import { mezclar } from "@/lib/panel/documentos/diccionario";

import { Cuadro } from "../asunto/pildora";
import "../asunto/asunto.css";
import "../formatos/captura.css";
import "./documento.css";

type Render = (doc: ReturnType<NonNullable<(typeof DOCUMENTOS)[string]>>) => Promise<Maqueta>;

async function bytes(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error("No se pudo preparar la hoja. Recarga la página.");
  return new Uint8Array(await r.arrayBuffer());
}

/** Lo que guarda cada espacio: campos simples y tablas con filas. Las imágenes se eligen aparte. */
const RANURAS_IMAGEN = new Set(["fotoPrincipalId", "croquisId"]);
const vacio = (v: unknown) => v === undefined || v === null || (typeof v === "string" && !v.trim()) || (Array.isArray(v) && !v.length);

/**
 * Un formato por preguntas (boceto aprobado, «Formato por preguntas»; SPEC.md, sección 8). A un lado la pregunta; al otro la
 * hoja real, que se va llenando y sale idéntica en PDF. Solo se pregunta lo que falta: lo que ya sabe el asunto entra solo, y lo
 * que se contesta vuelve a la persona o al inmueble. Tocar un espacio de la hoja lleva a ese dato. Se guarda solo.
 */
export function CapturaPorPreguntas({ id, volver }: { id: string; volver: string | null }) {
  const router = useRouter();
  const { avisar } = useAvisos();
  const [abierto, setAbierto] = useState<TrabajoAbierto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [render, setRender] = useState<Render | null>(null);
  const [maqueta, setMaqueta] = useState<Maqueta | null>(null);
  const [fallaHoja, setFallaHoja] = useState<string | null>(null);
  // Las preguntas: los espacios que faltaban al empezar, en el orden de la hoja. Tocar otro lo suma.
  const [preguntas, setPreguntas] = useState<Zona[] | null>(null);
  const [pos, setPos] = useState(0);
  const [listo, setListo] = useState(false);
  const [borrador, setBorrador] = useState<Record<string, unknown>>({});
  const [ocupado, setOcupado] = useState(false);
  const [asuntos, setAsuntos] = useState<FilaAsunto[] | null>(null);
  const actual = useRef<TrabajoAbierto | null>(null);
  actual.current = abierto;
  const zonas = useRef(new Map<string, HTMLButtonElement>());
  const pregunta = useRef<HTMLDivElement>(null);
  const firmado = useRef<HTMLInputElement>(null);
  const regreso = volver && volver.startsWith("/panel") ? volver : abierto?.asunto ? `/panel/asuntos?ver=${abierto.asunto.id}` : "/panel/herramientas";

  const cargar = useCallback(() => abrirTrabajo(id).then((x) => { setAbierto(x); setError(null); }, (e: unknown) => setError(e instanceof Error ? e.message : "No se pudo abrir.")), [id]);
  useEffect(() => { void cargar(); }, [cargar]);

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

  const t = abierto?.trabajo;
  const definicion: FormatoDefinition | null = useMemo(() => { try { return t ? formatoById(t.tipo) : null; } catch { return null; } }, [t]);
  const folio = abierto?.asunto?.folio ?? "";
  const guardados = useMemo(() => t?.datos ?? {}, [t]);
  const conBorrador = useMemo(() => aplicar(guardados, borrador), [guardados, borrador]);
  // Lo que se ve: lo escrito en el documento y, donde no hay nada, lo que ya sabe el asunto.
  const vista = useMemo(() => ({ ...mezclar(conBorrador, abierto?.del_asunto ?? {}), ...(folio ? { folio } : {}) }), [conBorrador, abierto, folio]);
  // Lo que falta: lo que el formato exige. La opinión de valor no exige nada, así que en ella falta todo espacio vacío.
  const faltan = useMemo(() => {
    if (!t || !definicion) return [];
    if (definicion.fields.some((f) => f.required)) return faltantes(t.tipo, vista, folio);
    return definicion.fields
      .filter((f) => !RANURAS_IMAGEN.has(f.key) && (t.tipo !== "07" || mostrarCampoValor(f.key, vista)) && vacio(vista[f.key]))
      .map((f) => f.label);
  }, [t, definicion, vista, folio]);
  const clavesFaltan = useMemo(() => new Set((definicion?.fields ?? []).filter((f) => faltan.includes(f.label)).map((f) => f.key)), [definicion, faltan]);

  // La hoja se vuelve a dibujar con cada tecla: así se ve en vivo.
  useEffect(() => {
    const armar = t ? DOCUMENTOS[t.tipo] : undefined;
    if (!render || !armar) return;
    let vivo = true;
    render(armar(vista, {})).then((m) => { if (vivo) setMaqueta(m); }, (e: unknown) => { if (vivo) setFallaHoja(e instanceof Error ? e.message : "No se pudo dibujar la hoja."); });
    return () => { vivo = false; };
  }, [render, t, vista]);

  // Las preguntas se toman una vez, cuando la hoja está lista: no cambian mientras se contesta.
  useEffect(() => {
    if (preguntas || !maqueta || !t) return;
    const zs = espaciosEnOrden(maqueta.zonas, vista, { soloFalta: true, faltan: clavesFaltan })
      .filter((z) => z.keys.some((k) => !RANURAS_IMAGEN.has(k)));
    setPreguntas(zs);
    setListo(zs.length === 0);
  }, [maqueta, t, vista, clavesFaltan, preguntas]);

  const zona = !listo && preguntas ? preguntas[pos] ?? null : null;

  /** Guarda lo escrito en la pregunta abierta. Devuelve false si no se pudo (la pregunta sigue abierta). */
  const guardar = useCallback(async (): Promise<boolean> => {
    const x = actual.current;
    if (!x || !Object.keys(borrador).length) return true;
    const datos = aplicar(x.trabajo.datos, borrador);
    if (JSON.stringify(datos) === JSON.stringify(x.trabajo.datos)) { setBorrador({}); return true; }
    setOcupado(true);
    try {
      const r = await guardarTrabajo(x.trabajo, datos);
      setAbierto({ ...x, trabajo: r.trabajo });
      setBorrador({});
      if (r.guardado_en.length) avisar(`Guardado en ${r.guardado_en.join(" y ")}`);
      if (r.no_guardado.length) avisar(`Quedó en el documento, pero no en la ficha: revisa ${r.no_guardado.join(", ")}.`);
      return true;
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se guardó. Vuelve a intentarlo.");
      return false;
    } finally { setOcupado(false); }
  }, [borrador, avisar]);

  const irA = async (i: number) => {
    if (!(await guardar())) return;
    if (!preguntas) return;
    if (i >= preguntas.length) { setListo(true); return; }
    setPos(Math.max(0, i));
    setListo(false);
  };
  // Tocar un espacio de la hoja lleva a ese dato; si no estaba entre las preguntas, se suma en su lugar.
  const tocar = async (z: Zona) => {
    if (!preguntas || !maqueta) return;
    if (!(await guardar())) return;
    const clave = zonaId(z);
    let lista = preguntas;
    let i = lista.findIndex((x) => zonaId(x) === clave);
    if (i < 0) {
      const orden = espaciosEnOrden(maqueta.zonas, vista, { soloFalta: false });
      const lugar = (x: Zona) => orden.findIndex((y) => zonaId(y) === zonaId(x));
      lista = [...lista, z].sort((a, b) => lugar(a) - lugar(b));
      i = lista.findIndex((x) => zonaId(x) === clave);
      setPreguntas(lista);
    }
    setPos(i);
    setListo(false);
    requestAnimationFrame(() => pregunta.current?.querySelector<HTMLElement>("input, textarea, button[role=combobox], [role=switch]")?.focus());
  };

  // Un trabajo suelto ofrece pasarlo a un asunto: la lista se lee al terminar.
  const suelto = abierto ? !abierto.asunto : false;
  useEffect(() => {
    if (!suelto || !listo || asuntos) return;
    leerAsuntos().then(setAsuntos, () => setAsuntos([]));
  }, [suelto, listo, asuntos]);

  // La pregunta abierta se ve también en la hoja.
  useEffect(() => {
    if (!zona) return;
    zonas.current.get(zonaId(zona))?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [zona]);

  // Si se cierra la pestaña con algo escrito sin guardar, el navegador pregunta antes.
  useEffect(() => {
    if (!Object.keys(borrador).length) return;
    const aviso = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, [borrador]);

  const cerrar = async () => { if (await guardar()) router.push(regreso); };

  const pdf = async () => {
    if (!(await guardar())) return null;
    const x = actual.current;
    if (!x) return null;
    setOcupado(true);
    try {
      const r = await descargarPdf(x.trabajo.id);
      setAbierto((y) => (y ? { ...y, trabajo: r.trabajo } : y));
      avisar(r.guardado ? "Descargado. Quedó en los Documentos del asunto." : "Descargado");
      if (r.guardado) void cargar();
      return r;
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se pudo armar el PDF.");
      return null;
    } finally { setOcupado(false); }
  };

  /** En el teléfono se comparte el PDF directo a WhatsApp; donde no se puede, se descarga y se abre WhatsApp. */
  const whatsapp = async () => {
    const r = await pdf();
    if (!r) return;
    try {
      const archivo = new File([await (await fetch(r.url)).blob()], r.nombre, { type: "application/pdf" });
      if (navigator.canShare?.({ files: [archivo] })) { await navigator.share({ files: [archivo], title: r.nombre }); return; }
    } catch { /* se canceló o no se puede: se abre WhatsApp con el texto */ }
    window.open(`https://wa.me/?text=${encodeURIComponent(`Te comparto ${x0(abierto?.trabajo.nombre ?? "el documento")}. Te lo adjunto en este chat.`)}`, "_blank", "noopener");
  };

  const cargarFirmado = async (archivos: File[]) => {
    const x = actual.current;
    if (!x?.asunto || !x.documento || !archivos.length) return;
    setOcupado(true);
    try {
      await subir(x.asunto.id, "firmado", archivos, x.documento.id);
      avisar(FORMATOS_CONTRATO.has(x.trabajo.tipo) ? "Firmado. Quedó en los Documentos del asunto." : "Quedó en los Documentos del asunto");
      void cargar();
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se pudo subir.");
    } finally { setOcupado(false); }
  };

  const pasar = async (asuntoId: string) => {
    const x = actual.current;
    if (!x || !(await guardar())) return;
    try {
      await pasarAUnAsunto(x.trabajo, asuntoId);
      avisar("Quedó en los Documentos del asunto");
      void cargar();
    } catch (e) { avisar(e instanceof Error ? e.message : "No se pudo pasar."); }
  };

  const eliminar = async () => {
    const x = actual.current;
    if (!x) return;
    try { await quitarTrabajo(x.trabajo); avisar("Se mandó a Eliminados"); router.push(regreso); }
    catch (e) { avisar(e instanceof Error ? e.message : "No se pudo quitar."); }
  };

  if (error) {
    return (
      <div className="dc-ventana" role="dialog" aria-label="Documento">
        <div className="as-vacio"><Icono nombre="alerta" tamano={24} /><b>{error}</b>
          <div className="as-fila"><button type="button" className="as-btn" onClick={() => void cargar()}>Reintentar</button><button type="button" className="as-btn as-gho" onClick={() => router.push(regreso)}>Volver</button></div>
        </div>
      </div>
    );
  }
  if (!abierto || !t || !definicion) return <div className="dc-ventana"><div className="as-cargando" aria-label="Abriendo el documento"><span /><span /><span /></div></div>;

  const asunto = abierto.asunto;
  const total = preguntas?.length ?? 0;
  const hechos = listo ? total : pos;
  const editables = zona ? zona.keys.filter((k) => !RANURAS_IMAGEN.has(k)).map((k) => campoDe(definicion, k)).filter((f): f is FormatoField => !!f) : [];
  const simples = editables.filter(esSimple);
  const tablas = editables.filter((f) => !esSimple(f)).map((f) => ({ campo: f, tabla: tablaDe(t.tipo, f.key) })).filter((x): x is { campo: FormatoField; tabla: NonNullable<ReturnType<typeof tablaDe>> } => !!x.tabla);
  const conImagen = zona ? zona.keys.some((k) => RANURAS_IMAGEN.has(k)) : false;
  const origenes = [...new Set(editables.map((f) => abierto.origen[f.key]).filter(Boolean).map((o) => (o.lado === "inmueble" ? "el inmueble" : `la ficha de ${o.quien}`)))];
  const cambiar = (k: string, v: unknown) => setBorrador((b) => ({ ...b, [k]: v }));
  const valor = (k: string) => (k in borrador ? borrador[k] : vista[k]);
  const ultimo = abierto.documento?.archivos[0];

  return (
    <div className="dc-ventana" role="dialog" aria-modal="true" aria-label={t.nombre}
      onKeyDown={(e) => { if (e.key === "Escape" && !e.defaultPrevented && !(e.target as HTMLElement).closest("[role=listbox],[role=menu]")) { e.preventDefault(); void cerrar(); } }}>
      <header className="dc-cabeza">
        <button type="button" className="as-btn as-gho as-ico" aria-label={asunto ? "Volver al asunto" : "Cerrar"} onClick={() => void cerrar()}><Icono nombre="x" tamano={18} /></button>
        <Cuadro icono="file" color="indigo" />
        <div className="dc-titulo">
          <b>{t.nombre}</b>
          <p className="as-m as-corta">{asunto ? `${asunto.nombre} · ${asunto.folio}` : "Sin asunto"}</p>
        </div>
        <span className="dc-vivo" aria-live="polite"><i aria-hidden />{ocupado ? "Guardando" : "Se guarda solo"}</span>
        <DropdownMenu>
          <DropdownMenuTrigger className="as-btn as-gho as-ico" aria-label="Opciones del documento"><Icono nombre="dots" tamano={18} /></DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => void pdf()}><Icono nombre="pdf" tamano={16} />Descargar PDF</DropdownMenuItem>
            {!listo ? <DropdownMenuItem onSelect={() => void irA(total)}><Icono nombre="ok" tamano={16} />Terminar</DropdownMenuItem> : null}
            {!asunto ? <DropdownMenuItem onSelect={() => void irA(total)}><Icono nombre="asu" tamano={16} />Pasar a un asunto</DropdownMenuItem> : null}
            <DropdownMenuItem peligro onSelect={() => void eliminar()}><Icono nombre="x" tamano={16} />Mandar a Eliminados</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <section className="dc-pregunta" ref={pregunta} aria-label="Preguntas">
        {!preguntas ? <div className="as-cargando" aria-label="Preparando las preguntas"><span /><span /><span /></div> : listo || !zona ? (
          <>
            <div>
              <h2 className="dc-h2"><Cuadro icono="ok" color="green" chico />{faltan.length ? "Casi listo" : "Listo"}</h2>
              <p className="as-m dc-texto">
                {faltan.length
                  ? `${faltan.length === 1 ? "Falta 1 dato" : `Faltan ${faltan.length} datos`}. El PDF sale con esos espacios en blanco.`
                  : !asunto ? "El documento está completo." : total ? "Lo que contestaste quedó guardado en el asunto: no se volverá a pedir." : "No faltaba nada: todo salió del asunto."}
              </p>
            </div>
            {faltan.length && total ? <button type="button" className="as-btn" onClick={() => { setPos(0); setListo(false); }}><Icono nombre="lapiz" tamano={16} />Seguir contestando</button> : null}
            <button type="button" className="as-btn as-pri dc-grande" disabled={ocupado} onClick={() => void pdf()}><Icono nombre="pdf" tamano={16} />Descargar PDF</button>
            <button type="button" className="as-btn dc-grande" disabled={ocupado} onClick={() => void whatsapp()}><Icono nombre="chat" tamano={16} />Enviar por WhatsApp</button>
            {asunto && abierto.documento ? (
              <>
                <input ref={firmado} type="file" hidden accept="application/pdf,image/jpeg,image/png,image/webp,image/heic" multiple
                  onChange={(e) => { const f = [...(e.target.files ?? [])]; e.target.value = ""; void cargarFirmado(f); }} />
                <button type="button" className="as-btn dc-grande" disabled={ocupado} onClick={() => firmado.current?.click()}>
                  <Icono nombre="subir" tamano={16} />{abierto.documento.paso === "firmado" ? "Cargar otra hoja firmada" : "Cargar el firmado (PDF o foto)"}
                </button>
                {abierto.documento.paso === "firmado" ? <p className="as-m dc-texto"><Icono nombre="ok" tamano={14} /> Firmado y guardado en Documentos.</p> : null}
              </>
            ) : !asunto ? (
              <div className="dc-pasar">
                <Desplegable etiqueta="Pasar a un asunto" valor="" vacio={asuntos ? "Elegir el asunto" : "Cargando asuntos"}
                  opciones={(asuntos ?? []).filter((x) => x.en_que_va !== "cerrado").map((x) => ({ valor: x.id, etiqueta: `${x.nombre} · ${x.folio}` }))}
                  alElegir={(v) => { if (v) void pasar(v); }} />
                <p className="as-m dc-texto">Cuando el cliente contrate, pásalo a su asunto y queda en sus Documentos.</p>
              </div>
            ) : null}
            <button type="button" className="as-btn as-gho" onClick={() => void cerrar()}>{asunto ? "Volver al asunto" : "Cerrar"}</button>
            {ultimo ? <p className="as-m dc-texto">Último PDF en Documentos: {new Date(ultimo.created_at).toLocaleString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}{t.pdf_version !== t.version ? ". Cambió después: el próximo PDF se guarda como versión nueva." : "."}</p> : null}
            {FORMATOS_CONTRATO.has(t.tipo) || ["01", "06"].includes(t.tipo) ? <p className="as-m dc-texto">Un documento hecho aquí no es una aprobación jurídica: lo revisa el abogado.</p> : null}
          </>
        ) : (
          <form className="dc-form" onSubmit={(e) => { e.preventDefault(); void irA(pos + 1); }}>
            <div>
              <p className="as-m">Pregunta {pos + 1} de {total}</p>
              <div className="dc-barra" role="progressbar" aria-label="Avance" aria-valuemin={0} aria-valuemax={total} aria-valuenow={hechos}><i style={{ width: `${total ? (hechos / total) * 100 : 100}%` }} /></div>
            </div>
            <h2 className="dc-q">{zona.label}</h2>
            {simples.map((f, i) => <CampoPregunta key={f.key} campo={f} valor={valor(f.key)} enfocar={i === 0} unico={simples.length === 1 && f.label === zona.label} alCambiar={(v) => cambiar(f.key, v)} />)}
            {tablas.map(({ campo, tabla }) => (
              <div key={campo.key} className="dc-tabla">
                <EditorTabla tabla={tabla} valor={valor(campo.key)} alCambiar={(v) => cambiar(campo.key, v)} />
              </div>
            ))}
            {conImagen && !editables.length ? <p className="as-m dc-texto">Las fotos de este documento se agregan después; por ahora el recuadro sale vacío.</p> : null}
            {!editables.length && !conImagen ? <p className="as-m dc-texto">Esta parte se calcula sola con lo demás de la hoja.</p> : null}
            {origenes.length && asunto ? <p className="as-m dc-texto"><Icono nombre="ok" tamano={14} /> Se guarda en {origenes.join(" y ")}.</p> : null}
            <button type="submit" className="as-btn as-pri dc-grande" disabled={ocupado}>{pos + 1 < total ? "Siguiente" : "Terminar"}<Icono nombre="ch" tamano={16} /></button>
            <div className="as-fila as-nw">
              <button type="button" className="as-btn as-gho" disabled={pos === 0 || ocupado} onClick={() => void irA(pos - 1)}><Icono nombre="at" tamano={16} />Anterior</button>
              <span className="as-sp" />
              <button type="button" className="as-btn as-gho" disabled={ocupado} onClick={() => { setBorrador({}); if (preguntas) { if (pos + 1 >= preguntas.length) setListo(true); else setPos(pos + 1); } }}>No lo sé todavía</button>
            </div>
            <p className="as-m dc-texto">{asunto ? "Solo se pregunta lo que falta; lo demás ya salió del asunto. " : ""}Tocar un espacio de la hoja lleva a ese dato.</p>
          </form>
        )}
      </section>

      <section className="dc-hoja" aria-label="La hoja">
        <div className="pn-captura-hojas">
          {fallaHoja ? <div className="as-vacio"><Icono nombre="alerta" tamano={24} /><b>{fallaHoja}</b></div> : !maqueta ? <div className="as-cargando" aria-label="Preparando la hoja"><span /><span /><span /></div> : maqueta.pages.map((trazos, pagina) => (
            <div key={pagina} className="pn-captura-hoja">
              <svg viewBox={`0 0 ${maqueta.width} ${maqueta.height}`} role="img" aria-label={`Hoja ${pagina + 1} de ${maqueta.pages.length}`}>
                {trazos.map((tr, i) => <Dibujo key={i} trazo={tr} alto={maqueta.height} />)}
              </svg>
              {maqueta.zonas.filter((z) => z.page === pagina).map((z) => {
                const clave = zonaId(z);
                const falta = z.keys.some((k) => clavesFaltan.has(k));
                const activa = zona ? zonaId(zona) === clave : false;
                return (
                  <button key={clave} type="button" className="pn-captura-zona" data-falta={falta || undefined} data-activa={activa || undefined}
                    ref={(el) => { if (el) zonas.current.set(clave, el); else zonas.current.delete(clave); }}
                    aria-label={`${z.label}${falta ? " (falta)" : ""}`} onClick={() => void tocar(z)}
                    style={{ left: `${(z.x / maqueta.width) * 100}%`, top: `${((maqueta.height - z.y - z.h) / maqueta.height) * 100}%`, width: `${(z.w / maqueta.width) * 100}%`, height: `${(z.h / maqueta.height) * 100}%` }} />
                );
              })}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/** «el contrato» → minúscula inicial a mitad de frase, salvo siglas. */
function x0(nombre: string) { return /^[A-ZÁÉÍÓÚ]{2}/.test(nombre) ? nombre : `el ${nombre.charAt(0).toLowerCase()}${nombre.slice(1)}`; }

/** El campo de una pregunta: texto, fecha, monto, lista (desplegable o interruptor) o varias opciones. */
function CampoPregunta({ campo, valor, alCambiar, enfocar, unico }: { campo: FormatoField; valor: unknown; alCambiar: (v: unknown) => void; enfocar: boolean; unico: boolean }) {
  const etiqueta = unico ? `${campo.label}${campo.required ? "" : " (opcional)"}` : campo.required ? campo.label : `${campo.label} (opcional)`;
  if (campo.type === "choice" && campo.options) {
    return <Desplegable etiqueta={etiqueta} valor={typeof valor === "string" ? valor : ""} vacio="Sin elegir" opciones={campo.options.map((o) => ({ valor: o.value, etiqueta: o.label }))} alElegir={(v) => alCambiar(v || undefined)} />;
  }
  if (campo.type === "multi" && campo.options) {
    const elegidos = Array.isArray(valor) ? (valor as string[]) : [];
    return (
      <fieldset className="dc-multi">
        <legend>{etiqueta}</legend>
        {campo.options.map((o) => (
          <label key={o.value}><Checkbox checked={elegidos.includes(o.value)} onCheckedChange={(c) => alCambiar(c ? [...elegidos, o.value] : elegidos.filter((x) => x !== o.value))} />{o.label}</label>
        ))}
      </fieldset>
    );
  }
  if (campo.type === "long") {
    return (
      <label className="pn-campo dc-largo">{etiqueta}
        <textarea rows={5} autoFocus={enfocar} value={textoDe(campo, valor)} onChange={(e) => alCambiar(valorCapturado(campo, e.target.value))} placeholder="Escribe o dicta" />
      </label>
    );
  }
  const tipo = campo.type === "date" ? "date" : campo.type === "time" ? "time" : "text";
  return (
    <Campo etiqueta={etiqueta} type={tipo} dinero={campo.type === "money"} inputMode={campo.type === "money" || campo.type === "number" ? "decimal" : undefined}
      value={textoDe(campo, valor)} autoComplete="off" autoFocus={enfocar} placeholder={tipo === "text" ? "Escribe o dicta" : undefined}
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
