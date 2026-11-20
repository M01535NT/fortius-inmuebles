"use client";
import { useEffect, useState } from "react";

import { useColeccion } from "@/components/panel/datos/use-coleccion";
import { Icono } from "@/components/panel/icons";
import { useAtajo } from "@/components/panel/kit/atajos";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Boton } from "@/components/panel/kit/boton";
import { AreaTexto, Campo } from "@/components/panel/kit/campo";
import { Desplegable } from "@/components/panel/kit/desplegable";
import { Etiqueta } from "@/components/panel/kit/etiqueta";
import { Cargando, EstadoError } from "@/components/panel/kit/estados";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/panel/ui/dropdown-menu";
import { Switch } from "@/components/panel/ui/switch";
import { HOME_FIELDS } from "@/data/home-copy";
import type { SiteContent } from "@/lib/domain/records";
import { ErrorDeLectura } from "@/lib/panel/datos/colecciones";
import {
  aMedias, contenidoAGuardar, GRUPOS_INICIO, GRUPOS_PREGUNTA, hayCambiosTextos, largoSeo, LIMITES_TEXTOS, mover, nuevaPregunta,
  nuevoTestimonio, testimonioSale, textosDe, validarTextos, type ErroresTextos, type Textos,
} from "@/lib/panel/sitio/textos";

import { SeccionConfig } from "./partes";
import "./sitio-publico.css";

/**
 * Configuración → Sitio público → Textos del sitio. Lo mismo que «Textos del sitio» del panel provisional: «Por qué
 * Fortius», buscadores, los textos del inicio por grupo, preguntas frecuentes adicionales y testimonios. Aquí no hay
 * borrador: guardar los pone en el sitio, y la pantalla lo dice. Solo el director (lo hace cumplir la base).
 */
export function SeccionTextos() {
  const c = useColeccion<SiteContent>("contenido");
  const [vuelta, setVuelta] = useState(0);
  const guardado = c.datos[0] ?? null;

  if (c.cargando && !c.datos.length) return <SeccionConfig id="conf-textos" titulo="Textos del sitio"><Cargando lineas={6} etiqueta="Cargando los textos" /></SeccionConfig>;
  if (c.error && !c.datos.length) return <SeccionConfig id="conf-textos" titulo="Textos del sitio"><EstadoError texto={c.error} alReintentar={c.reintentar} /></SeccionConfig>;
  return (
    <EditorTextos key={vuelta} guardado={guardado}
      alGuardar={(data) => c.guardar("singleton", data)}
      alVerUltimo={() => { c.reintentar(); setVuelta((n) => n + 1); }} />
  );
}

function EditorTextos({ guardado, alGuardar, alVerUltimo }: { guardado: SiteContent | null; alGuardar: (d: SiteContent) => Promise<SiteContent>; alVerUltimo: () => void }) {
  const { avisar } = useAvisos();
  const [t, setT] = useState<Textos>(() => textosDe(guardado));
  const [base, setBase] = useState<SiteContent | null>(guardado);
  const [errores, setErrores] = useState<ErroresTextos>({});
  const [guardando, setGuardando] = useState(false);
  const cambiado = hayCambiosTextos(t, base);
  const incompletas = aMedias(t);

  useEffect(() => {
    if (!cambiado) return;
    const alSalir = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", alSalir);
    return () => window.removeEventListener("beforeunload", alSalir);
  }, [cambiado]);

  const poner = (c: Partial<Textos>) => setT((x) => ({ ...x, ...c }));
  const ponerPregunta = (i: number, c: Partial<Textos["preguntas"][number]>) => setT((x) => ({ ...x, preguntas: x.preguntas.map((p, k) => (k === i ? { ...p, ...c } : p)) }));
  const ponerTestimonio = (i: number, c: Partial<Textos["testimonios"][number]>) => setT((x) => ({ ...x, testimonios: x.testimonios.map((p, k) => (k === i ? { ...p, ...c } : p)) }));

  async function guardar() {
    if (guardando) return;
    const e = validarTextos(t);
    setErrores(e);
    if (Object.keys(e).length) { avisar("Falta algo: revisa lo marcado."); return; }
    setGuardando(true);
    try {
      const nuevo = await alGuardar(contenidoAGuardar(t, base));
      setBase(nuevo);
      setT(textosDe(nuevo));
      avisar("Guardado. Ya se ve en el sitio");
    } catch (x) {
      if (x instanceof ErrorDeLectura && x.estado === 409) {
        avisar("Alguien guardó estos textos mientras los tenías abiertos. Lo tuyo sigue aquí: guárdalo de nuevo o mira lo último.", { etiqueta: "Ver lo último", alAccionar: alVerUltimo });
      } else avisar(x instanceof Error ? x.message : "No se guardó. Vuelve a intentarlo.");
    } finally { setGuardando(false); }
  }
  useAtajo("s", (e) => { e.preventDefault(); void guardar(); }, { conControl: true });

  const tituloSeo = largoSeo(t.seoTitle, 50, 60), descSeo = largoSeo(t.seoDescription, 140, 160);
  const autorizados = t.testimonios.filter(testimonioSale).length;

  return (
    <SeccionConfig id="conf-textos" titulo="Textos del sitio"
      accion={<Boton onClick={() => void guardar()} deshabilitado={guardando} aria-keyshortcuts="Control+S" title="Guardar (Ctrl S)">{guardando ? "Guardando…" : "Guardar"}</Boton>}>
      <p className="sp-aviso-sitio" data-cambiado={cambiado} role="status">
        <Icono nombre="globo" tamano={15} />
        {cambiado ? "Tienes cambios sin guardar. Al guardar, salen en el sitio." : "Así está hoy el sitio. Lo que guardes aquí sale al momento."}
      </p>
      {incompletas ? <p className="pn-conf-nota pn-tono-aviso sp-nota-aviso"><Icono nombre="alerta" tamano={14} />{incompletas === 1 ? "Una pregunta o testimonio está a medias: no se guarda" : `${incompletas} preguntas o testimonios están a medias: no se guardan`} hasta tener sus dos partes.</p> : null}

      <Grupo titulo="Por qué Fortius">
        <AreaTexto etiqueta="Título de la sección" rows={2} value={t.manifiestoTitulo} maxLength={LIMITES_TEXTOS.inicio} aria-invalid={errores.manifiestoTitulo ? true : undefined}
          ayuda={errores.manifiestoTitulo ? <Falta texto={errores.manifiestoTitulo} /> : "Un salto de línea parte el título en dos renglones."} onChange={(e) => poner({ manifiestoTitulo: e.target.value })} />
        <AreaTexto etiqueta="Descripción" rows={3} value={t.manifiestoTexto} maxLength={LIMITES_TEXTOS.inicio} aria-invalid={errores.manifiestoTexto ? true : undefined}
          ayuda={errores.manifiestoTexto ? <Falta texto={errores.manifiestoTexto} /> : undefined} onChange={(e) => poner({ manifiestoTexto: e.target.value })} />
      </Grupo>

      <Grupo titulo="En los buscadores" nota="Lo que sale en Google y al compartir un enlace.">
        <Campo etiqueta="Título" value={t.seoTitle} maxLength={LIMITES_TEXTOS.corto} error={errores.seoTitle} onChange={(e) => poner({ seoTitle: e.target.value })}
          ayuda={<Largo n={t.seoTitle.trim().length} rango="50 a 60" estado={tituloSeo} />} />
        <AreaTexto etiqueta="Descripción" rows={3} value={t.seoDescription} maxLength={LIMITES_TEXTOS.corto} aria-invalid={errores.seoDescription ? true : undefined}
          ayuda={errores.seoDescription ? <Falta texto={errores.seoDescription} /> : <Largo n={t.seoDescription.trim().length} rango="140 a 160" estado={descSeo} />}
          onChange={(e) => poner({ seoDescription: e.target.value })} />
      </Grupo>

      <div className="sp-grupo">
        <p className="sp-grupo-t">Inicio</p>
        <div className="sp-plegables">
          {GRUPOS_INICIO.map((g) => (
            <details key={g.titulo} className="sp-plegable">
              <summary><span>{g.titulo}</span><span className="sp-plegable-n">{g.claves.length}</span><Icono nombre="down" tamano={14} className="sp-plegable-ch" aria-hidden /></summary>
              <div className="sp-plegable-cuerpo">
                {g.claves.map((k) => (
                  <AreaTexto key={k} etiqueta={HOME_FIELDS[k].label} rows={2} value={t.inicio[k]} maxLength={LIMITES_TEXTOS.inicio}
                    onChange={(e) => poner({ inicio: { ...t.inicio, [k]: e.target.value } })} />
                ))}
              </div>
            </details>
          ))}
        </div>
      </div>

      <div className="sp-grupo">
        <div className="sp-grupo-cab">
          <p className="sp-grupo-t">Preguntas frecuentes<span className="sp-grupo-n">{t.preguntas.length}</span></p>
          <button type="button" className="pn-conf-cab-btn sp-cab-btn" aria-disabled={t.preguntas.length >= LIMITES_TEXTOS.preguntas}
            onClick={() => { if (t.preguntas.length < LIMITES_TEXTOS.preguntas) poner({ preguntas: [...t.preguntas, nuevaPregunta(crypto.randomUUID())] }); }}>
            <Icono nombre="mas" tamano={14} /> Agregar
          </button>
        </div>
        <p className="pn-conf-nota">Se suman a las preguntas de la página. Respuestas que puedas respaldar.</p>
        {!t.preguntas.length ? <p className="sp-vacio">Sin preguntas adicionales.</p> : t.preguntas.map((p, i) => (
          <div key={p.id} className="pn-conf-caja sp-item">
            <div className="sp-item-cab">
              <span className="sp-item-n">Pregunta {i + 1}</span>
              <span className="as-sp" />
              <MenuItem nombre={`pregunta ${i + 1}`} i={i} total={t.preguntas.length}
                alMover={(paso) => poner({ preguntas: mover(t.preguntas, i, paso) })} alQuitar={() => poner({ preguntas: t.preguntas.filter((_, k) => k !== i) })} />
            </div>
            <Desplegable etiqueta="Para quién" valor={p.grupo} opciones={GRUPOS_PREGUNTA} alElegir={(grupo) => { if (grupo) ponerPregunta(i, { grupo }); }} />
            <Campo etiqueta="Pregunta" value={p.pregunta} maxLength={LIMITES_TEXTOS.pregunta} onChange={(e) => ponerPregunta(i, { pregunta: e.target.value })} />
            <AreaTexto etiqueta="Respuesta" rows={3} value={p.respuesta} maxLength={LIMITES_TEXTOS.respuesta} onChange={(e) => ponerPregunta(i, { respuesta: e.target.value })} />
          </div>
        ))}
      </div>

      <div className="sp-grupo">
        <div className="sp-grupo-cab">
          <p className="sp-grupo-t">Testimonios<span className="sp-grupo-n">{autorizados} de {t.testimonios.length} en el sitio</span></p>
          <button type="button" className="pn-conf-cab-btn sp-cab-btn" aria-disabled={t.testimonios.length >= LIMITES_TEXTOS.testimonios}
            onClick={() => { if (t.testimonios.length < LIMITES_TEXTOS.testimonios) poner({ testimonios: [...t.testimonios, nuevoTestimonio(crypto.randomUUID())] }); }}>
            <Icono nombre="mas" tamano={14} /> Agregar
          </button>
        </div>
        <p className="pn-conf-nota">Salen en el inicio solo con autorización por escrito. Sin ninguno, la sección no aparece.</p>
        {!t.testimonios.length ? <p className="sp-vacio">Sin testimonios.</p> : t.testimonios.map((x, i) => (
          <div key={x.id} className="pn-conf-caja sp-item">
            <div className="sp-item-cab">
              <span className="sp-item-n">Testimonio {i + 1}</span>
              {testimonioSale(x) ? <Etiqueta tono="exito" icono="globo">En el sitio</Etiqueta> : <Etiqueta tono="aviso" icono="alerta">{x.autorizado ? "Falta texto o nombre" : "No sale: sin autorización"}</Etiqueta>}
              <span className="as-sp" />
              <MenuItem nombre={`testimonio ${i + 1}`} i={i} total={t.testimonios.length}
                alMover={(paso) => poner({ testimonios: mover(t.testimonios, i, paso) })} alQuitar={() => poner({ testimonios: t.testimonios.filter((_, k) => k !== i) })} />
            </div>
            <AreaTexto etiqueta="Testimonio" rows={3} value={x.texto} maxLength={LIMITES_TEXTOS.testimonio} onChange={(e) => ponerTestimonio(i, { texto: e.target.value })} />
            <div className="sp-dos">
              <Campo etiqueta="Nombre" value={x.nombre} maxLength={LIMITES_TEXTOS.nombre} onChange={(e) => ponerTestimonio(i, { nombre: e.target.value })} />
              <Campo etiqueta="Detalle (opcional)" value={x.detalle} maxLength={LIMITES_TEXTOS.detalle} placeholder="Vendió una casa en Tijuana" onChange={(e) => ponerTestimonio(i, { detalle: e.target.value })} />
            </div>
            <div className="sp-sw">
              <span className="sp-sw-t"><b id={`sp-aut-${x.id}`}>Autorización por escrito</b><span>Tengo la autorización de esta persona para publicarlo.</span></span>
              <Switch checked={x.autorizado} onCheckedChange={(autorizado) => ponerTestimonio(i, { autorizado })} aria-labelledby={`sp-aut-${x.id}`} />
            </div>
          </div>
        ))}
      </div>
      <div className="sp-atajos" aria-hidden><span><kbd className="pn-kbd">Ctrl</kbd><kbd className="pn-kbd">S</kbd> guardar</span></div>
    </SeccionConfig>
  );
}

function Grupo({ titulo, nota, children }: { titulo: string; nota?: string; children: React.ReactNode }) {
  return (
    <div className="sp-grupo">
      <p className="sp-grupo-t">{titulo}</p>
      {nota ? <p className="pn-conf-nota">{nota}</p> : null}
      <div className="pn-conf-caja">{children}</div>
    </div>
  );
}

function Falta({ texto }: { texto: string }) {
  return <span className="pn-campo-error" role="alert"><Icono nombre="alerta" tamano={16} />{texto}</span>;
}

function Largo({ n, rango, estado }: { n: number; rango: string; estado: "corto" | "bien" | "largo" }) {
  return <span className="sp-largo" data-estado={estado}>{n} caracteres · ideal {rango}{estado === "bien" ? "" : estado === "corto" ? " (le falta)" : " (le sobra)"}</span>;
}

function MenuItem({ nombre, i, total, alMover, alQuitar }: { nombre: string; i: number; total: number; alMover: (paso: -1 | 1) => void; alQuitar: () => void }) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className="as-btn as-gho as-ico" aria-label={`Más de la ${nombre}`.replace("la testimonio", "el testimonio")} title="Más"><Icono nombre="dots" tamano={18} /></DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuItem disabled={i === 0} onSelect={() => alMover(-1)}><Icono nombre="subir" tamano={16} />Subir</DropdownMenuItem>
        <DropdownMenuItem disabled={i === total - 1} onSelect={() => alMover(1)}><Icono nombre="down" tamano={16} />Bajar</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem peligro onSelect={alQuitar}><Icono nombre="bote" tamano={16} />Quitar</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
