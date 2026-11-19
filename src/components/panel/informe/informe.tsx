"use client";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState } from "react";

import { Icono } from "@/components/panel/icons";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Desplegable } from "@/components/panel/kit/desplegable";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/panel/ui/dropdown-menu";
import { Switch } from "@/components/panel/ui/switch";
import type { Documento } from "@/lib/formatos/documento/modelo";
import type { Maqueta } from "@/lib/formatos/documento/pdf";
import { fetchLetterhead } from "@/lib/letterhead";
import { urlArchivo } from "@/lib/panel/asuntos/api";
import { useCatalogos } from "@/components/panel/datos/catalogos";
import {
  CADA_INFORME, contenidoInforme, hacerInforme, informeDocumento, informeTexto, leerMaterialInforme, NOMBRE_CADA, NOMBRE_PARTE, opcionesIniciales,
  PARTES_INFORME, type InformeHecho, type MaterialInforme, type OpcionesInforme, type ParteInforme,
} from "@/lib/panel/informes";

import { DialogoMensaje, ElegirVarios } from "../asunto/comun";
import { Cuadro } from "../asunto/pildora";
import { Dibujo } from "../documento/captura";
import "../asunto/asunto.css";
import "../formatos/captura.css";
import "../documento/documento.css";

type Render = (doc: Documento) => Promise<Maqueta>;

async function bytes(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error("No se pudo preparar la hoja. Recarga la página.");
  return new Uint8Array(await r.arrayBuffer());
}

const cuantos = (n: number) => (n === 1 ? "1 renglón" : `${n} renglones`);

/**
 * Informe para el cliente (SPEC.md, sección 5). A un lado se elige para quién es, qué partes lleva y cada cuándo se repite;
 * al otro, la hoja real, que cambia al momento y sale idéntica en PDF. Se arma con lo que el asunto ya tiene: no se captura nada.
 * Guardarlo lo deja en los Documentos del asunto con su número; mandarlo lo hace el asesor.
 */
export function InformeParaElCliente({ asuntoId }: { asuntoId: string }) {
  const router = useRouter();
  const cat = useCatalogos();
  const { avisar } = useAvisos();
  const idTexto = useId();
  const [material, setMaterial] = useState<MaterialInforme | null>(null);
  const [opciones, setOpciones] = useState<OpcionesInforme | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [render, setRender] = useState<Render | null>(null);
  const [maqueta, setMaqueta] = useState<Maqueta | null>(null);
  const [fallaHoja, setFallaHoja] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [hecho, setHecho] = useState<InformeHecho | null>(null);
  const [mensaje, setMensaje] = useState(false);
  const regreso = `/panel/asuntos/${asuntoId}`;

  useEffect(() => {
    let vivo = true;
    leerMaterialInforme(asuntoId).then(
      (m) => { if (vivo) { setMaterial(m); setOpciones(opcionesIniciales(m)); setError(null); } },
      (e: unknown) => { if (vivo) setError(e instanceof Error ? e.message : "No se pudo abrir."); },
    );
    return () => { vivo = false; };
  }, [asuntoId]);

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

  // La hoja se vuelve a dibujar con cada cambio: así se ve en vivo.
  useEffect(() => {
    if (!render || !material || !opciones) return;
    let vivo = true;
    render(informeDocumento(material, opciones)).then((m) => { if (vivo) setMaqueta(m); }, (e: unknown) => { if (vivo) setFallaHoja(e instanceof Error ? e.message : "No se pudo dibujar la hoja."); });
    return () => { vivo = false; };
  }, [render, material, opciones]);

  // Todo lo que podría salir (para la lista de renglones de cada parte).
  const todo = useMemo(() => (material && opciones ? contenidoInforme(material, { ...opciones, partes: [...PARTES_INFORME], sin: [] }) : null), [material, opciones]);

  if (error) {
    return (
      <div className="dc-ventana" role="dialog" aria-modal="true" aria-label="Informe para el cliente">
        <div className="dc-pregunta" style={{ gridColumn: "1 / -1" }}>
          <div className="as-vacio" role="alert"><Icono nombre="alerta" tamano={24} /><b>{error}</b></div>
          <div className="as-fila"><button type="button" className="as-btn" onClick={() => router.push(regreso)}><Icono nombre="at" tamano={16} />Regresar al asunto</button></div>
        </div>
      </div>
    );
  }

  const cambiar = (c: Partial<OpcionesInforme>) => setOpciones((o) => (o ? { ...o, ...c } : o));
  const renglones = (p: ParteInforme): { id: string; texto: string }[] => (!todo || p === "dinero" ? [] : todo[p]);
  const hay = (p: ParteInforme) => (p === "dinero" ? Boolean(material?.dinero) : renglones(p).length > 0);

  const guardar = async () => {
    if (!opciones || ocupado) return;
    if (!opciones.para.length) { avisar("Elige para quién es el informe"); return; }
    setOcupado(true);
    try {
      const r = await hacerInforme(asuntoId, opciones);
      setHecho(r);
      avisar(`Informe ${r.numero} guardado en los Documentos del asunto`);
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se pudo guardar el informe.");
    } finally { setOcupado(false); }
  };

  return (
    <div className="dc-ventana" role="dialog" aria-modal="true" aria-label="Informe para el cliente"
      onKeyDown={(e) => { if (e.key === "Escape" && !mensaje && !e.defaultPrevented && !(e.target as HTMLElement).closest("[role=listbox],[role=menu]")) { e.preventDefault(); router.push(regreso); } }}>
      <header className="dc-cabeza">
        <button type="button" className="as-btn as-gho as-ico" aria-label="Regresar al asunto" title="Regresar al asunto" onClick={() => router.push(regreso)}><Icono nombre="at" tamano={18} /></button>
        <Cuadro icono="file" color="teal" />
        <div className="dc-titulo">
          <b>Informe para el cliente</b>
          <p className="as-m as-corta">{material ? `${material.asunto} · ${material.folio}` : "Preparando"}</p>
        </div>
        {material ? <span className="as-pill">Informe {material.numero}</span> : null}
      </header>

      <section className="dc-pregunta" aria-label="Qué lleva el informe">
        {!material || !opciones ? <div className="as-cargando" aria-busy="true" aria-label="Preparando el informe"><span /><span /><span /></div> : hecho ? (
          <>
            <div>
              <h2 className="dc-h2"><Cuadro icono="ok" color="green" chico />Informe {hecho.numero} guardado</h2>
              <p className="as-m dc-texto">Quedó en los Documentos del asunto, en «Informes», y anotado en el Historial. Mandarlo te toca a ti: nada sale solo.</p>
            </div>
            {hecho.archivo_id ? (
              <a className="as-btn as-pri dc-grande" href={urlArchivo(asuntoId, hecho.archivo_id)} target="_blank" rel="noopener noreferrer"><Icono nombre="pdf" tamano={16} />Descargar PDF</a>
            ) : null}
            <button type="button" className="as-btn dc-grande" onClick={() => setMensaje(true)}><Icono nombre="chat" tamano={16} />Enviar por WhatsApp</button>
            <button type="button" className="as-btn as-gho" onClick={() => router.push(`${regreso}?ver=documentos`)}>Volver al asunto</button>
            {opciones.cada ? <p className="as-m dc-texto"><Icono nombre="ok" tamano={14} /> La tarea de mandar el siguiente ya está en el plan y saldrá en Inicio ese día.</p> : null}
          </>
        ) : (
          <>
            <ElegirVarios etiqueta="Para" vacio="Elegir a quién" valores={opciones.para} alCambiar={(para) => cambiar({ para })}
              opciones={material.personas.map((p) => ({ valor: p.id, etiqueta: `${p.nombre} · ${cat.etiqueta("papel", p.papel)}` }))} />

            <label className="pn-campo dc-largo" htmlFor={idTexto}>En qué va
              <textarea id={idTexto} className="as-inp as-inp-borde as-area" rows={5} maxLength={3000} value={opciones.en_que_va}
                onChange={(e) => cambiar({ en_que_va: e.target.value })} placeholder="Cuéntale en pocas palabras cómo va su asunto" />
            </label>
            {opciones.en_que_va.trim() !== material.propuesta ? (
              <button type="button" className="as-btn as-gho" style={{ alignSelf: "flex-start" }} onClick={() => cambiar({ en_que_va: material.propuesta })}><Icono nombre="rayo" tamano={16} />Usar el texto sugerido</button>
            ) : null}

            <div>
              <p className="as-sub" style={{ padding: "0 2px 6px" }}>Qué lleva</p>
              <div className="as-card">
                {PARTES_INFORME.filter((p) => (p !== "actividad" || material.actividad.length > 0)).map((p) => {
                  const lista = renglones(p);
                  const puesta = opciones.partes.includes(p);
                  const quitados = lista.filter((x) => opciones.sin.includes(x.id)).length;
                  const sub = !hay(p) ? "Nada que decir por ahora" : p === "dinero" ? "Acordado, cobrado y lo que falta" : `${cuantos(lista.length - quitados)}${quitados ? ` · ${quitados} fuera` : ""}`;
                  return (
                    <div key={p} className="as-ren">
                      <span className="as-ren-c"><b>{NOMBRE_PARTE[p]}</b><span>{sub}</span></span>
                      {puesta && lista.length > 1 ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger className="as-btn as-gho as-ico" aria-label={`Elegir renglones de ${NOMBRE_PARTE[p].toLowerCase()}`} title="Elegir renglones"><Icono nombre="lista" tamano={17} /></DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="max-w-80">
                            <DropdownMenuLabel>{NOMBRE_PARTE[p]}</DropdownMenuLabel>
                            {lista.map((x) => (
                              <DropdownMenuCheckboxItem key={x.id} checked={!opciones.sin.includes(x.id)} onSelect={(e) => e.preventDefault()}
                                onCheckedChange={(c) => cambiar({ sin: c ? opciones.sin.filter((s) => s !== x.id) : [...opciones.sin, x.id] })}>
                                {x.texto}
                              </DropdownMenuCheckboxItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : null}
                      <Switch checked={puesta && hay(p)} disabled={!hay(p)} aria-label={NOMBRE_PARTE[p]}
                        onCheckedChange={(c) => cambiar({ partes: c ? [...opciones.partes, p] : opciones.partes.filter((x) => x !== p) })} />
                    </div>
                  );
                })}
              </div>
              <p className="as-m dc-texto" style={{ paddingTop: 6 }}>Una parte sin contenido no sale en la hoja. Nunca lleva notas internas ni nombres de interesados.</p>
            </div>

            <Desplegable etiqueta="Repetir" valor={opciones.cada ?? ""} vacio="No se repite" alElegir={(v) => cambiar({ cada: v || null })}
              opciones={CADA_INFORME.map((c) => ({ valor: c, etiqueta: NOMBRE_CADA[c] }))}
              ayuda={opciones.cada ? "Al guardarlo nace la tarea de mandar el siguiente." : undefined} />

            <button type="button" className="as-btn as-pri dc-grande" disabled={ocupado} onClick={() => void guardar()}><Icono nombre="ok" tamano={16} />{ocupado ? "Guardando" : "Guardar informe"}</button>
            <p className="as-m dc-texto">Queda en Documentos con su número. Después lo descargas en PDF o lo mandas por WhatsApp.</p>
          </>
        )}
      </section>

      <section className="dc-hoja" aria-label="La hoja">
        <div className="pn-captura-hojas">
          {fallaHoja ? <div className="as-vacio"><Icono nombre="alerta" tamano={24} /><b>{fallaHoja}</b></div> : !maqueta ? <div className="as-cargando" aria-label="Preparando la hoja"><span /><span /><span /></div> : maqueta.pages.map((trazos, pagina) => (
            <div key={pagina} className="pn-captura-hoja">
              <svg viewBox={`0 0 ${maqueta.width} ${maqueta.height}`} role="img" aria-label={`Hoja ${pagina + 1} de ${maqueta.pages.length}`}>
                {trazos.map((tr, i) => <Dibujo key={i} trazo={tr} alto={maqueta.height} />)}
              </svg>
            </div>
          ))}
        </div>
      </section>

      {material && opciones ? (
        <DialogoMensaje abierto={mensaje} titulo="Informe por WhatsApp" inicial={informeTexto(material, opciones)} para={null} alCerrar={() => setMensaje(false)} />
      ) : null}
    </div>
  );
}
