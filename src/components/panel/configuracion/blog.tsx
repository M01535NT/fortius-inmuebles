"use client";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { useColeccion } from "@/components/panel/datos/use-coleccion";
import { Icono } from "@/components/panel/icons";
import { useAtajo, useTecladoEnListas } from "@/components/panel/kit/atajos";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Boton } from "@/components/panel/kit/boton";
import { AreaTexto, Campo } from "@/components/panel/kit/campo";
import { Desplegable } from "@/components/panel/kit/desplegable";
import { Etiqueta } from "@/components/panel/kit/etiqueta";
import { Cargando, EstadoError, Vacio } from "@/components/panel/kit/estados";
import { Fila, Tarjeta } from "@/components/panel/kit/lista";
import { Interruptor } from "@/components/panel/kit/segmentado";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/panel/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/panel/ui/dropdown-menu";
import { Switch } from "@/components/panel/ui/switch";
import { BLOG_CATEGORIES, BLOG_FORMATS, formatBlogDate, postCategory, postFormat } from "@/lib/blog-editorial";
import type { Post } from "@/lib/domain/records";
import { deshacerBorrado, leerEntradasEliminadas, recuperarEntrada, type EntradaEliminada } from "@/lib/panel/sitio/api";
import {
  bloques, borradorDe, cuantas, enPortada, entradaAGuardar, filtrarEntradas, FILTROS, hayCambios, LIMITES, minutosDeLectura,
  OPCIONES_FORMATO, OPCIONES_TEMA, rutaPublica, slugDesdeTitulo, trozos, validarEntrada,
  type Borrador, type Errores, type FiltroBlog,
} from "@/lib/panel/sitio/blog";

import { SeccionConfig } from "./partes";
import "./sitio-publico.css";

/**
 * Configuración → Sitio público → Blog. Lo mismo que el blog del panel provisional (crear, cambiar, borrador o
 * publicada, destacar en portada, tipo, tema, autor, zona, fuente, mandar a Eliminados y recuperar), con vista previa.
 * Guardar no es publicar: un borrador solo se ve aquí. La base pone las fechas y solo deja escribir al director.
 */
export function SeccionBlog({ entrada, alAbrir }: { entrada: string | null; alAbrir: (id: string | null) => void }) {
  const posts = useColeccion<Post>("posts");
  const { avisar } = useAvisos();
  const [filtro, setFiltro] = useState<FiltroBlog>("todas");
  const [texto, setTexto] = useState("");
  const [eliminadas, setEliminadas] = useState<EntradaEliminada[] | null>(null);
  const [errorEliminadas, setErrorEliminadas] = useState<string | null>(null);
  const [vueltaEliminadas, setVueltaEliminadas] = useState(0);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const sucio = useRef(false);
  const [salir, setSalir] = useState<{ a: string | null } | null>(null);

  useEffect(() => {
    if (filtro !== "eliminadas") return;
    const control = new AbortController();
    leerEntradasEliminadas(control.signal).then(
      (x) => { setEliminadas(x); setErrorEliminadas(null); },
      (e: unknown) => { if (!control.signal.aborted) setErrorEliminadas(e instanceof Error ? e.message : "No se pudo consultar."); },
    );
    return () => control.abort();
  }, [filtro, vueltaEliminadas]);

  // Con algo escrito sin guardar, cambiar de entrada o volver a la lista pregunta antes.
  const ir = (a: string | null) => {
    if (a === entrada) return;
    if (sucio.current) { setSalir({ a }); return; }
    alAbrir(a);
  };
  useEffect(() => {
    const alSalir = (e: BeforeUnloadEvent) => { if (sucio.current) e.preventDefault(); };
    window.addEventListener("beforeunload", alSalir);
    return () => window.removeEventListener("beforeunload", alSalir);
  }, []);

  const lista = useMemo(() => filtrarEntradas(posts.datos, filtro, texto), [posts.datos, filtro, texto]);
  const n = cuantas(posts.datos);
  const portada = enPortada(posts.datos);
  const abierta = entrada && entrada !== "nueva" ? posts.datos.find((p) => p.id === entrada) ?? null : null;
  const t = texto.trim().toLowerCase();
  const eliminadasVistas = (eliminadas ?? []).filter((e) => !t || (e.titulo ?? "").toLowerCase().includes(t));

  useTecladoEnListas();
  useAtajo("n", (e) => { e.preventDefault(); ir("nueva"); }, { activo: entrada === null });

  async function recuperar(e: EntradaEliminada) {
    setOcupado(e.id);
    try {
      await recuperarEntrada(e.id);
      setEliminadas((x) => x?.filter((y) => y.id !== e.id) ?? null);
      posts.reintentar();
      avisar(`«${e.titulo ?? "La entrada"}» volvió como borrador`, { etiqueta: "Abrir", alAccionar: () => { setFiltro("todas"); alAbrir(e.record_id); } });
    } catch (x) { avisar(x instanceof Error ? x.message : "No se pudo recuperar."); }
    finally { setOcupado(null); }
  }

  async function guardar(b: Borrador, previa: Post | null) {
    const id = previa?.id ?? crypto.randomUUID();
    const antes = previa?.estado === "publicado";
    const guardada = await posts.guardar(id, entradaAGuardar(b, previa, id));
    sucio.current = false;
    const ahora = guardada.estado === "publicado";
    avisar(ahora && !antes ? "Publicada: ya se ve en el sitio" : !ahora && antes ? "Retirada del sitio: queda como borrador" : ahora ? "Guardado. Los cambios ya se ven en el sitio" : "Borrador guardado. No sale en el sitio");
    if (!previa) alAbrir(id);
  }

  async function quitar(p: Post) {
    await posts.borrar(p.id);
    sucio.current = false;
    alAbrir(null);
    avisar(`«${p.titulo}» se mandó a Eliminados`, {
      etiqueta: "Deshacer",
      alAccionar: () => { deshacerBorrado(p.id).then(() => { posts.reintentar(); avisar("De vuelta como borrador"); }, (e: unknown) => avisar(e instanceof Error ? e.message : "No se pudo deshacer.")); },
    });
  }

  if (entrada !== null) {
    if (posts.cargando && !posts.datos.length) return <SeccionConfig id="conf-blog" titulo="Blog"><Cargando lineas={6} etiqueta="Cargando la entrada" /></SeccionConfig>;
    if (entrada !== "nueva" && !abierta) {
      return (
        <SeccionConfig id="conf-blog" titulo="Blog">
          <Vacio titulo="Esta entrada ya no está" texto="Puede estar en Eliminados." icono="nota" accion={<Boton variante="normal" onClick={() => alAbrir(null)}>Volver al blog</Boton>} />
        </SeccionConfig>
      );
    }
    return (
      <>
        <EditorEntrada key={abierta?.id ?? "nueva"} post={abierta} todas={posts.datos} alVolver={() => ir(null)}
          alSucio={(s) => { sucio.current = s; }} alGuardar={(b) => guardar(b, abierta)} alQuitar={abierta ? () => quitar(abierta) : undefined} />
        <DialogoSalir abierto={salir !== null} alQuedarse={() => setSalir(null)} alDescartar={() => { const a = salir?.a ?? null; sucio.current = false; setSalir(null); alAbrir(a); }} />
      </>
    );
  }

  return (
    <SeccionConfig id="conf-blog" titulo="Blog"
      accion={<button type="button" className="pn-conf-cab-btn" onClick={() => ir("nueva")}><Icono nombre="mas" tamano={14} /> Nueva entrada</button>}>
      <div className="sp-barra">
        <label className="sp-busca">
          <Icono nombre="bus" tamano={14} />
          <span className="pn-solo-lector">Buscar en el blog</span>
          <input type="search" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Buscar" autoComplete="off" />
        </label>
        <Desplegable etiqueta="Mostrar" valor={filtro} opciones={FILTROS} alElegir={(v) => { if (v) setFiltro(v); }} />
      </div>
      {posts.datos.length ? (
        <p className="pn-conf-nota sp-resumen">
          <span><b>{n.publicadas}</b> en el sitio</span><span><b>{n.borradores}</b> {n.borradores === 1 ? "borrador" : "borradores"}</span>
          {portada ? <span className="sp-resumen-portada"><Icono nombre="estrella" tamano={13} />En portada: {portada.titulo}</span> : null}
        </p>
      ) : null}

      {filtro === "eliminadas" ? (
        errorEliminadas ? <EstadoError texto={errorEliminadas} alReintentar={() => { setErrorEliminadas(null); setEliminadas(null); setVueltaEliminadas((x) => x + 1); }} />
          : !eliminadas ? <Cargando lineas={3} etiqueta="Consultando lo eliminado" />
          : !eliminadasVistas.length ? <Vacio titulo="Nada en Eliminados" texto="Lo que mandes a Eliminados se recupera aquí, como borrador." icono="bote" />
          : (
            <Tarjeta className="pn-lista" aria-label="Entradas eliminadas">
              {eliminadasVistas.map((e) => (
                <Fila key={e.id} titulo={e.titulo || "Entrada sin título"} subtitulo={`Se eliminó el ${formatBlogDate(e.created_at)}`}
                  acciones={<Boton variante="normal" deshabilitado={ocupado !== null} onClick={() => void recuperar(e)} aria-label={`Recuperar ${e.titulo ?? "entrada"}`}>{ocupado === e.id ? "Recuperando…" : "Recuperar"}</Boton>} />
              ))}
            </Tarjeta>
          )
      ) : posts.cargando && !posts.datos.length ? <Cargando lineas={4} etiqueta="Cargando el blog" />
        : posts.error && !posts.datos.length ? <EstadoError texto={posts.error} alReintentar={posts.reintentar} />
        : !posts.datos.length ? <Vacio titulo="Todavía no hay entradas" texto="Escribe la primera guía." icono="nota" accion={<Boton onClick={() => ir("nueva")} icono="mas">Nueva entrada</Boton>} />
        : !lista.length ? <Vacio titulo="Nada con eso" texto="Prueba con otra palabra o muestra todas." icono="bus" />
        : (
          <Tarjeta className="pn-lista" aria-label="Entradas del blog">
            {lista.map((p) => (
              <Fila key={p.id} alPulsar={() => ir(p.id)} titulo={p.titulo}
                subtitulo={[BLOG_FORMATS[postFormat(p)], postCategory(p) ? BLOG_CATEGORIES[postCategory(p)!] : null, rutaPublica(p.slug)].filter(Boolean).join(" · ")}
                derecha={<span className="sp-fila-der">
                  {portada?.id === p.id ? <span className="sp-portada" title="Sale en la portada"><Icono nombre="estrella" tamano={13} /><span className="pn-solo-lector">En portada</span></span> : null}
                  <EstadoEntrada publicada={p.estado === "publicado"} />
                </span>} />
            ))}
          </Tarjeta>
        )}
      <div className="sp-atajos" aria-hidden><span><kbd className="pn-kbd">N</kbd> nueva</span><span><kbd className="pn-kbd">J</kbd><kbd className="pn-kbd">K</kbd> moverse</span><span><kbd className="pn-kbd">/</kbd> buscar</span></div>
    </SeccionConfig>
  );
}

function EstadoEntrada({ publicada }: { publicada: boolean }) {
  return publicada ? <Etiqueta tono="exito" icono="globo">En el sitio</Etiqueta> : <Etiqueta icono="lapiz">Borrador</Etiqueta>;
}

function DialogoSalir({ abierto, alQuedarse, alDescartar }: { abierto: boolean; alQuedarse: () => void; alDescartar: () => void }) {
  return (
    <Dialog open={abierto} onOpenChange={(o) => { if (!o) alQuedarse(); }}>
      <DialogContent className="max-w-sm">
        <DialogTitle>Cambios sin guardar</DialogTitle>
        <DialogDescription>Si sales, se pierde lo que escribiste en esta entrada.</DialogDescription>
        <div className="sp-dialogo-botones">
          <Boton variante="normal" onClick={alQuedarse} autoFocus>Seguir aquí</Boton>
          <Boton variante="peligro" onClick={alDescartar}>Descartar</Boton>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type PropsEditor = {
  post: Post | null; todas: Post[]; alVolver: () => void; alSucio: (s: boolean) => void;
  alGuardar: (b: Borrador) => Promise<void>; alQuitar?: () => Promise<void>;
};

function EditorEntrada({ post, todas, alVolver, alSucio, alGuardar, alQuitar }: PropsEditor) {
  const { avisar } = useAvisos();
  const [b, setB] = useState<Borrador>(() => borradorDe(post));
  const [slugTocado, setSlugTocado] = useState(Boolean(post));
  const [errores, setErrores] = useState<Errores>({});
  const [vista, setVista] = useState<"escribir" | "previa">("escribir");
  const [guardando, setGuardando] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const cambiado = hayCambios(b, post);
  useEffect(() => { alSucio(cambiado); }, [cambiado, alSucio]);

  const poner = (c: Partial<Borrador>) => setB((x) => {
    const y = { ...x, ...c };
    if (!post && !slugTocado && c.titulo !== undefined) y.slug = slugDesdeTitulo(c.titulo);
    return y;
  });

  async function guardar() {
    if (guardando) return;
    const e = validarEntrada(b, todas, post?.id ?? null);
    setErrores(e);
    if (Object.keys(e).length) {
      if (e.contenido) setVista("escribir");
      avisar("Falta algo: revisa lo marcado.");
      window.setTimeout(() => raiz.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus(), 0);
      return;
    }
    setGuardando(true);
    try { await alGuardar(b); }
    catch (x) { avisar(x instanceof Error ? x.message : "No se guardó. Vuelve a intentarlo."); }
    finally { setGuardando(false); }
  }
  useAtajo("s", (e) => { e.preventDefault(); void guardar(); }, { conControl: true });
  useAtajo("escape", () => { if (!document.querySelector("[role=dialog]")) alVolver(); });

  const ruta = rutaPublica(b.slug.trim() || "…");
  const publicadaGuardada = post?.estado === "publicado";
  const alGuardarDice = b.publicada
    ? (publicadaGuardada ? "Los cambios se verán en el sitio al guardar." : "Al guardar, sale en el sitio.")
    : (publicadaGuardada ? "Al guardar, se retira del sitio y queda como borrador." : "Queda como borrador: solo se ve aquí.");

  return (
    <section className="pn-conf-seccion aj-seccion sp-editor" aria-labelledby="sp-entrada-t">
      <div className="sp-ed-barra">
        <button type="button" className="as-btn as-gho sp-volver" onClick={alVolver}><Icono nombre="at" tamano={16} />Blog</button>
        <span className="as-sp" />
        <EstadoEntrada publicada={publicadaGuardada} />
        {post ? (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger className="as-btn as-gho as-ico" aria-label="Más de esta entrada" title="Más"><Icono nombre="dots" tamano={18} /></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-56">
              {publicadaGuardada ? (
                <DropdownMenuItem onSelect={() => window.open(rutaPublica(post.slug), "_blank", "noopener")}><Icono nombre="globo" tamano={16} />Ver en el sitio</DropdownMenuItem>
              ) : null}
              <DropdownMenuItem onSelect={() => { const url = `${window.location.origin}${rutaPublica(post.slug)}`; navigator.clipboard?.writeText(url).then(() => avisar("Dirección copiada"), () => avisar("No se pudo copiar.")); }}>
                <Icono nombre="liga" tamano={16} />Copiar la dirección
              </DropdownMenuItem>
              {alQuitar ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem peligro onSelect={() => { alQuitar().catch((x: unknown) => avisar(x instanceof Error ? x.message : "No se pudo mandar a Eliminados.")); }}>
                    <Icono nombre="bote" tamano={16} />Mandar a Eliminados
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
        <Boton onClick={() => void guardar()} deshabilitado={guardando} aria-keyshortcuts="Control+S" title="Guardar (Ctrl S)">{guardando ? "Guardando…" : "Guardar"}</Boton>
      </div>

      <div className="aj-cab"><div className="aj-cab-t">
        <h1 id="sp-entrada-t">{post ? post.titulo : "Nueva entrada"}</h1>
        <p>{post?.publicadoEl ? `Publicada el ${formatBlogDate(post.publicadoEl)}; la fecha se conserva al cambiarla.` : post ? `Última vez guardada el ${formatBlogDate(post.actualizadoEl)}.` : "La fecha de publicación se pone sola la primera vez que la publicas."}</p>
      </div></div>

      <div ref={raiz} className="sp-ed-cuerpo">
        <div className="pn-conf-caja sp-publicar" data-publicada={b.publicada}>
          <div className="sp-sw">
            <span className="sp-sw-t"><b id="sp-pub-l">Publicada en el sitio</b><span>{alGuardarDice}</span></span>
            <Switch checked={b.publicada} onCheckedChange={(publicada) => poner({ publicada })} aria-labelledby="sp-pub-l" />
          </div>
        </div>

        <div className="pn-conf-caja">
          <Campo etiqueta="Título" value={b.titulo} maxLength={LIMITES.titulo} required error={errores.titulo} onChange={(e) => poner({ titulo: e.target.value })} />
          <Campo etiqueta="Dirección en la web" value={b.slug} readOnly={Boolean(post)} maxLength={LIMITES.slug} error={errores.slug} spellCheck={false} autoCapitalize="off"
            ayuda={post ? `${ruta} · no cambia después de crearla` : ruta}
            onChange={(e) => { setSlugTocado(true); poner({ slug: e.target.value.toLowerCase() }); }} />
          <AreaTexto etiqueta="Resumen" rows={2} value={b.resumen} maxLength={LIMITES.resumen} required aria-invalid={errores.resumen ? true : undefined}
            ayuda={errores.resumen ? <AvisoError texto={errores.resumen} /> : "Sale en la lista del blog y en los buscadores."} onChange={(e) => poner({ resumen: e.target.value })} />
        </div>

        <div className="pn-conf-caja sp-contenido">
          <div className="sp-cont-cab">
            <span className="sp-cont-t">Contenido</span>
            <span className="sp-cont-n">{minutosDeLectura(b.contenido)} min de lectura</span>
            <span className="as-sp" />
            <Interruptor etiqueta="Ver" sinEtiqueta valor={vista} opciones={[{ valor: "escribir", etiqueta: "Escribir" }, { valor: "previa", etiqueta: "Vista previa" }]} alElegir={setVista} />
          </div>
          {vista === "escribir" ? (
            <AreaTexto etiqueta="Texto de la entrada" className="sp-cont-area" rows={16} value={b.contenido} maxLength={LIMITES.contenido} required
              aria-invalid={errores.contenido ? true : undefined} onChange={(e) => poner({ contenido: e.target.value })}
              ayuda={errores.contenido ? <AvisoError texto={errores.contenido} /> : <AyudaFormato />} />
          ) : <VistaPrevia b={b} />}
        </div>

        <div className="pn-conf-caja">
          <div className="sp-dos">
            <Desplegable etiqueta="Tipo" valor={b.formato} opciones={OPCIONES_FORMATO} alElegir={(v) => { if (v) poner({ formato: v }); }} />
            <Desplegable etiqueta="Tema" valor={b.categoria} vacio="Sin clasificar" opciones={OPCIONES_TEMA} alElegir={(v) => poner({ categoria: v })} />
            <Campo etiqueta="Autor" value={b.autor} maxLength={LIMITES.corto} onChange={(e) => poner({ autor: e.target.value })} />
            <Campo etiqueta="Ámbito o zona" value={b.ambito} maxLength={LIMITES.corto} placeholder="Tijuana, Baja California…" onChange={(e) => poner({ ambito: e.target.value })} />
          </div>
          <div className="sp-sw">
            <span className="sp-sw-t"><b id="sp-dest-l">Destacar en la portada</b><span>Sale la destacada más reciente; sin ninguna, la última publicada.</span></span>
            <Switch checked={b.destacado} onCheckedChange={(destacado) => poner({ destacado })} aria-labelledby="sp-dest-l" />
          </div>
        </div>

        <div className="pn-conf-caja">
          <p className="sp-caja-t">Fuente principal<span>En actualidad: qué pasó, cuándo y a quién afecta.</span></p>
          <div className="sp-dos">
            <Campo etiqueta="Nombre de la fuente" value={b.fuenteNombre} maxLength={LIMITES.corto} onChange={(e) => poner({ fuenteNombre: e.target.value })} />
            <Campo etiqueta="Enlace" type="url" inputMode="url" value={b.fuenteUrl} maxLength={LIMITES.enlace} placeholder="https://" error={errores.fuenteUrl} onChange={(e) => poner({ fuenteUrl: e.target.value })} />
          </div>
        </div>
      </div>
      <div className="sp-atajos" aria-hidden><span><kbd className="pn-kbd">Ctrl</kbd><kbd className="pn-kbd">S</kbd> guardar</span><span><kbd className="pn-kbd">Esc</kbd> volver</span></div>
    </section>
  );
}

function AvisoError({ texto }: { texto: string }) {
  return <span className="pn-campo-error" role="alert"><Icono nombre="alerta" tamano={16} />{texto}</span>;
}

function AyudaFormato() {
  return (
    <details className="sp-formato">
      <summary>Cómo dar formato</summary>
      <ul>
        <li>Una línea en blanco separa los párrafos.</li>
        <li><code>## Título</code> y <code>### Subtítulo</code>, cada uno en su línea.</li>
        <li><code>- viñeta</code> o <code>1. lista numerada</code>, un elemento por línea.</li>
        <li>Enlaces: <code>[texto](/ruta)</code> o <code>[texto](https://sitio.com)</code>.</li>
        <li>El HTML se muestra como texto. Voz directa, sin promesas absolutas.</li>
      </ul>
    </details>
  );
}

/** Cómo quedaría el texto, con el mismo formato que lee el sitio (la portada y las ilustraciones las pone el sitio). */
function VistaPrevia({ b }: { b: Borrador }) {
  const lineas = (texto: string): ReactNode => trozos(texto).map((t, i) => (t.enlace
    ? <a key={i} href={t.enlace} target="_blank" rel="noopener noreferrer">{t.texto}</a>
    : <span key={i}>{t.texto}</span>));
  const bs = bloques(b.contenido);
  return (
    <article className="sp-previa" aria-label="Vista previa">
      <p className="sp-previa-meta">{[BLOG_FORMATS[b.formato], b.categoria ? BLOG_CATEGORIES[b.categoria] : null, b.ambito.trim() || null].filter(Boolean).join(" · ")}</p>
      <h2 className="sp-previa-h1">{b.titulo.trim() || "Sin título"}</h2>
      {b.resumen.trim() ? <p className="sp-previa-resumen">{b.resumen}</p> : null}
      {b.autor.trim() ? <p className="sp-previa-meta">Por {b.autor}</p> : null}
      {!bs.length ? <p className="sp-previa-vacia">Todavía no hay texto.</p> : bs.map((x, i) => {
        if ("items" in x) {
          const Lista = x.tipo === "ol" ? "ol" : "ul";
          return <Lista key={i}>{x.items.map((y, k) => <li key={k}>{lineas(y)}</li>)}</Lista>;
        }
        if (x.tipo === "h2") return <h3 key={i} className="sp-previa-h2">{lineas(x.texto)}</h3>;
        if (x.tipo === "h3") return <h4 key={i} className="sp-previa-h3">{lineas(x.texto)}</h4>;
        return <p key={i}>{lineas(x.texto)}</p>;
      })}
      {b.fuenteNombre.trim() ? <p className="sp-previa-meta">Fuente: {b.fuenteUrl.trim() ? <a href={b.fuenteUrl} target="_blank" rel="noopener noreferrer">{b.fuenteNombre}</a> : b.fuenteNombre}</p> : null}
    </article>
  );
}
