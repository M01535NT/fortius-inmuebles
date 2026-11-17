"use client";
import "../asunto/asunto.css";
import "./biblioteca.css";

import { useEffect, useId, useState } from "react";

import { Icono, type NombreIcono } from "@/components/panel/icons";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Desplegable } from "@/components/panel/kit/desplegable";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/panel/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/panel/ui/dropdown-menu";
import { leerAsuntos, NOMBRE_QUIEN, QUIEN, type FilaAsunto, type Quien } from "@/lib/panel/asuntos/api";
import {
  cambiarGuia, copiarGuia, crearGuia, cuantasTrae, type ClaseBiblioteca, type DocumentoGuia, type EtapaGuia, type Guia,
} from "@/lib/panel/biblioteca";
import { useSession } from "@/lib/panel/legado/sesion";

import { Cuadro } from "../asunto/pildora";
import { olvidarGuias, useGuias } from "./guias";

const SECCIONES: { clase: ClaseBiblioteca; titulo: string; icono: NombreIcono; color: string }[] = [
  { clase: "que_pedir", titulo: "Qué pedir", icono: "file", color: "teal" },
  { clase: "que_hacer", titulo: "Qué hacer", icono: "lista", color: "indigo" },
  { clase: "apartado_propio", titulo: "Apartados", icono: "nota", color: "gray" },
];
const dia = (n: number | null | undefined) => (n === null || n === undefined ? "" : n === 0 ? "el primer día" : `día ${n}`);

/**
 * Biblioteca (boceto aprobado): las metodologías, todas al mismo nivel. Se copian a un asunto y ahí se cambian;
 * la guía no cambia. Quien la hizo o el director la cambian; solo el director la marca revisada por el abogado.
 */
export function Biblioteca() {
  const { avisar } = useAvisos();
  const director = useSession()?.role === "admin";
  const guias = useGuias();
  const [abierta, setAbierta] = useState<string | null>(null);
  const [editar, setEditar] = useState<Guia | { nueva: ClaseBiblioteca } | null>(null);
  const [usar, setUsar] = useState<Guia | null>(null);

  const hacer = async (accion: () => Promise<unknown>, aviso: string) => {
    try { await accion(); avisar(aviso); }
    catch (e) { avisar(e instanceof Error ? e.message : "No se pudo terminar."); }
    finally { olvidarGuias(); }
  };

  return (
    <div className="db-pagina">
      <div className="db-top">
        <div>
          <h1>Biblioteca</h1>
          <p className="db-sub">Tus metodologías, todas al mismo nivel. Se copian a un asunto y ahí se cambian.</p>
        </div>
        <span className="as-sp" />
        <DropdownMenu>
          <DropdownMenuTrigger className="as-btn as-pri"><Icono nombre="mas" tamano={16} />Nueva<Icono nombre="down" tamano={14} /></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setEditar({ nueva: "que_pedir" })}><Icono nombre="file" tamano={16} />Lista de qué pedir</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setEditar({ nueva: "que_hacer" })}><Icono nombre="lista" tamano={16} />Plan de qué hacer</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {!guias ? <div className="as-cargando" aria-label="Cargando"><span /><span /><span /></div> : null}
      {guias && !guias.length ? (
        <div className="as-vacio">
          <Icono nombre="lib" tamano={26} /><b>La Biblioteca está vacía</b>
          <span className="as-m">Crea una lista o un plan, o guarda el plan de un asunto desde el asunto.</span>
        </div>
      ) : null}

      {guias ? SECCIONES.map((s) => {
        const lista = guias.filter((g) => g.clase === s.clase);
        if (!lista.length) return null;
        return (
          <section key={s.clase} aria-label={s.titulo}>
            <h2 className="db-h2">{s.titulo}<span className="as-m as-num">{lista.length}</span></h2>
            <div className="as-card">
              {lista.map((g) => {
                const ab = abierta === g.id;
                return (
                  <div key={g.id} className="db-guia">
                    <button type="button" className="as-ren" aria-expanded={ab} onClick={() => setAbierta(ab ? null : g.id)}>
                      <Cuadro icono={s.icono} color={s.color} />
                      <span className="as-ren-c"><b>{g.nombre}</b>{g.descripcion ? <span>{g.descripcion}</span> : null}</span>
                      {g.revisado_abogado ? <span className="as-pill as-pill-ok"><Icono nombre="escudo" tamano={12} />Revisado por el abogado</span> : null}
                      {g.es_ejemplo ? <span className="as-pill">Ejemplo</span> : null}
                      <span className="as-pill as-num">{cuantasTrae(g)}</span>
                      <Icono nombre="ch" tamano={16} />
                    </button>
                    {ab ? (
                      <div className="db-cont">
                        <Contenido g={g} />
                        <div className="as-fila">
                          <button type="button" className="as-btn as-pri" onClick={() => setUsar(g)}><Icono nombre="asu" tamano={16} />Usar en un asunto</button>
                          {g.editable || director ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger className="as-btn as-gho as-ico" aria-label={`Más de ${g.nombre}`}><Icono nombre="dots" tamano={18} /></DropdownMenuTrigger>
                              <DropdownMenuContent className="min-w-60">
                                {g.editable && g.clase !== "apartado_propio" ? <DropdownMenuItem onSelect={() => setEditar(g)}><Icono nombre="lapiz" tamano={16} />Cambiar</DropdownMenuItem> : null}
                                {director ? (
                                  <DropdownMenuItem onSelect={() => void hacer(() => cambiarGuia(g, { revisado_abogado: !g.revisado_abogado }), g.revisado_abogado ? "Ya no dice revisado" : "Marcada: revisada por el abogado")}>
                                    <Icono nombre="escudo" tamano={16} />{g.revisado_abogado ? "Quitar «Revisado por el abogado»" : "Revisado por el abogado"}
                                  </DropdownMenuItem>
                                ) : null}
                                {g.editable ? (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem peligro onSelect={() => void hacer(() => cambiarGuia(g, { quitar: true }), "Mandada a Eliminados. Los asuntos donde se usó no cambian")}>
                                      <Icono nombre="bote" tamano={16} />Mandar a Eliminados
                                    </DropdownMenuItem>
                                  </>
                                ) : null}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        );
      }) : null}
      {guias?.some((g) => g.es_ejemplo) ? <p className="as-m">Lo marcado «Ejemplo» es contenido de muestra: cámbialo o mándalo a Eliminados.</p> : null}

      <DialogoUsar g={usar} alCerrar={() => setUsar(null)} alUsar={(g, a) => void hacer(async () => {
        const r = await copiarGuia(g.id, a.id);
        if (!r.agregados) throw new Error("Ese asunto ya tenía todo lo de esta guía.");
      }, `Copiada a ${a.nombre}`)} />
      <EditorGuia de={editar} alCerrar={() => setEditar(null)} alGuardar={(de, datos) => void hacer(
        () => ("nueva" in de ? crearGuia({ clase: de.nueva, ...datos }) : cambiarGuia(de, datos)),
        "nueva" in de ? "Guardada en la Biblioteca" : "Cambios guardados. Los asuntos donde ya se usó no cambian",
      )} />
    </div>
  );
}

/** Lo que trae la guía, para leerlo antes de usarla. */
export function Contenido({ g }: { g: Pick<Guia, "contenido"> }) {
  const c = g.contenido;
  if (c.documentos) return <ul>{c.documentos.map((d, i) => <li key={i}><Icono nombre="file" tamano={14} />{d.nombre}</li>)}</ul>;
  if (c.etapas) return (
    <>
      {c.etapas.map((e, i) => (
        <div key={i}>
          {c.etapas!.length > 1 ? <p className="db-etapa">{e.nombre}</p> : null}
          <ol>{e.tareas.map((t, k) => <li key={k}><Icono nombre="ok" tamano={14} />{t.titulo}<i>{[NOMBRE_QUIEN[t.quien], dia(t.dias)].filter(Boolean).join(" · ")}</i></li>)}</ol>
        </div>
      ))}
    </>
  );
  if (c.columnas) return <ul>{c.columnas.map((x) => <li key={x.clave}><Icono nombre="lista" tamano={14} />{x.nombre}</li>)}</ul>;
  return null;
}

function DialogoUsar({ g, alCerrar, alUsar }: { g: Guia | null; alCerrar: () => void; alUsar: (g: Guia, a: FilaAsunto) => void }) {
  const [asuntos, setAsuntos] = useState<FilaAsunto[] | null>(null);
  const [elegido, setElegido] = useState("");
  useEffect(() => {
    if (!g) return;
    setElegido("");
    leerAsuntos().then((x) => setAsuntos(x.filter((a) => a.en_que_va !== "cerrado")), () => setAsuntos([]));
  }, [g]);
  const a = asuntos?.find((x) => x.id === elegido) ?? null;
  return (
    <Dialog open={!!g} onOpenChange={(o) => { if (!o) alCerrar(); }}>
      <DialogContent className="max-w-md">
        <DialogTitle>Usar en un asunto</DialogTitle>
        <DialogDescription>Se copia «{g?.nombre}». En el asunto la cambias sin tocar la de la Biblioteca.</DialogDescription>
        {g ? (
          <form className="as-form" onSubmit={(e) => { e.preventDefault(); if (!a) return; alCerrar(); alUsar(g, a); }}>
            {asuntos ? (
              <Desplegable etiqueta="Asunto" valor={elegido} vacio="Elegir" opciones={asuntos.map((x) => ({ valor: x.id, etiqueta: `${x.nombre} · ${x.folio}` }))} alElegir={setElegido} />
            ) : <div className="as-cargando" aria-label="Cargando"><span /></div>}
            <div className="as-fila as-fin">
              <button type="button" className="as-btn" onClick={alCerrar}>Cancelar</button>
              <button type="submit" className="as-btn as-pri" aria-disabled={!a}>Copiar al asunto</button>
            </div>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

type Datos = { nombre: string; descripcion: string; contenido: Guia["contenido"] };

function EditorGuia({ de, alCerrar, alGuardar }: { de: Guia | { nueva: ClaseBiblioteca } | null; alCerrar: () => void; alGuardar: (de: Guia | { nueva: ClaseBiblioteca }, d: Datos) => void }) {
  const clase = de ? ("nueva" in de ? de.nueva : de.clase) : "que_pedir";
  return (
    <Dialog open={!!de} onOpenChange={(o) => { if (!o) alCerrar(); }}>
      <DialogContent className="max-w-2xl">
        <DialogTitle>{de && "nueva" in de ? (clase === "que_pedir" ? "Nueva lista de qué pedir" : "Nuevo plan de qué hacer") : "Cambiar la guía"}</DialogTitle>
        <DialogDescription>Los asuntos donde ya se usó no cambian.</DialogDescription>
        {de ? <FormaGuia key={"nueva" in de ? de.nueva : de.id} de={de} clase={clase} alCerrar={alCerrar} alGuardar={(d) => { alCerrar(); alGuardar(de, d); }} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function FormaGuia({ de, clase, alCerrar, alGuardar }: { de: Guia | { nueva: ClaseBiblioteca }; clase: ClaseBiblioteca; alCerrar: () => void; alGuardar: (d: Datos) => void }) {
  const id = useId();
  const g = "nueva" in de ? null : de;
  const [nombre, setNombre] = useState(g?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(g?.descripcion ?? "");
  const [docs, setDocs] = useState<DocumentoGuia[]>(g?.contenido.documentos ?? [{ nombre: "" }]);
  const [etapas, setEtapas] = useState<EtapaGuia[]>(g?.contenido.etapas ?? [{ nombre: "", tareas: [{ titulo: "", quien: "fortius" }] }]);
  const limpioDocs = docs.map((d) => ({ ...d, nombre: d.nombre.trim() })).filter((d) => d.nombre);
  const limpioEtapas = etapas.map((e) => ({ nombre: e.nombre.trim() || nombre.trim(), tareas: e.tareas.map((t) => ({ ...t, titulo: t.titulo.trim() })).filter((t) => t.titulo) }))
    .filter((e) => e.tareas.length);
  const listo = nombre.trim().length > 0 && (clase === "que_pedir" ? limpioDocs.length > 0 : clase === "que_hacer" ? limpioEtapas.length > 0 : true);
  const ponEtapa = (i: number, e: Partial<EtapaGuia>) => setEtapas((x) => x.map((y, k) => (k === i ? { ...y, ...e } : y)));
  const ponTarea = (i: number, k: number, t: Partial<EtapaGuia["tareas"][number]>) =>
    ponEtapa(i, { tareas: etapas[i].tareas.map((y, j) => (j === k ? { ...y, ...t } : y)) });

  return (
    <form className="as-form" onSubmit={(e) => {
      e.preventDefault();
      if (!listo) return;
      alGuardar({
        nombre: nombre.trim(), descripcion: descripcion.trim(),
        contenido: clase === "que_pedir" ? { documentos: limpioDocs } : clase === "que_hacer" ? { etapas: limpioEtapas } : (g?.contenido ?? {}),
      });
    }}>
      <label className="pn-campo" htmlFor={`${id}-n`}>Nombre
        <input id={`${id}-n`} className="as-inp as-inp-borde" maxLength={160} value={nombre} autoFocus onChange={(e) => setNombre(e.target.value)}
          placeholder={clase === "que_pedir" ? "Titular fallecido, Nave industrial…" : "Cancelación de hipoteca, Escritura…"} />
      </label>
      <label className="pn-campo" htmlFor={`${id}-d`}>Para qué sirve (opcional)
        <input id={`${id}-d`} className="as-inp as-inp-borde" maxLength={300} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
      </label>

      {clase === "que_pedir" ? (
        <div className="as-form">
          <p className="as-sub">Documentos</p>
          {docs.map((d, i) => (
            <div key={i} className="db-renglon">
              <input className="as-inp as-inp-borde" maxLength={200} value={d.nombre} aria-label={`Documento ${i + 1}`}
                onChange={(e) => setDocs((x) => x.map((y, k) => (k === i ? { ...y, nombre: e.target.value } : y)))} />
              <button type="button" className="as-btn as-gho as-ico" aria-label={`Quitar documento ${i + 1}`} onClick={() => setDocs((x) => x.filter((_, k) => k !== i))}><Icono nombre="x" tamano={16} /></button>
            </div>
          ))}
          <button type="button" className="as-btn" onClick={() => setDocs((x) => [...x, { nombre: "" }])}><Icono nombre="mas" tamano={16} />Otro documento</button>
        </div>
      ) : null}

      {clase === "que_hacer" ? (
        <div className="as-form">
          {etapas.map((e, i) => (
            <div key={i} className="db-bloque">
              <div className="db-renglon">
                <label className="pn-campo" htmlFor={`${id}-e${i}`}>Etapa
                  <input id={`${id}-e${i}`} className="as-inp as-inp-borde" maxLength={120} value={e.nombre} placeholder={nombre || "Nombre de la etapa"} onChange={(x) => ponEtapa(i, { nombre: x.target.value })} />
                </label>
                {etapas.length > 1 ? <button type="button" className="as-btn as-gho as-ico" aria-label={`Quitar la etapa ${i + 1}`} onClick={() => setEtapas((x) => x.filter((_, k) => k !== i))}><Icono nombre="bote" tamano={16} /></button> : <span />}
              </div>
              {e.tareas.map((t, k) => (
                <div key={k} className="db-renglon db-renglon-tarea">
                  <input className="as-inp as-inp-borde" maxLength={300} value={t.titulo} placeholder="Qué hay que hacer" aria-label={`Tarea ${k + 1} de la etapa ${i + 1}`} onChange={(x) => ponTarea(i, k, { titulo: x.target.value })} />
                  <Desplegable etiqueta="Quién" valor={t.quien} opciones={QUIEN.map((v) => ({ valor: v, etiqueta: NOMBRE_QUIEN[v] }))} alElegir={(v) => { if (v) ponTarea(i, k, { quien: v as Quien }); }} />
                  <label className="pn-campo">Día
                    <input className="as-inp as-inp-borde" type="number" min={0} max={3650} inputMode="numeric" value={t.dias ?? ""} placeholder="—"
                      onChange={(x) => ponTarea(i, k, { dias: x.target.value === "" ? null : Math.max(0, Math.min(3650, Math.round(Number(x.target.value)))) })} />
                  </label>
                  <button type="button" className="as-btn as-gho as-ico" aria-label={`Quitar la tarea ${k + 1}`} onClick={() => ponEtapa(i, { tareas: e.tareas.filter((_, j) => j !== k) })}><Icono nombre="x" tamano={16} /></button>
                </div>
              ))}
              <button type="button" className="as-btn" onClick={() => ponEtapa(i, { tareas: [...e.tareas, { titulo: "", quien: "fortius" }] })}><Icono nombre="mas" tamano={16} />Otra tarea</button>
            </div>
          ))}
          <p className="as-m">«Día» cuenta desde que se copia al asunto: 0 es ese mismo día. Vacío, la tarea queda sin fecha.</p>
          <button type="button" className="as-btn" onClick={() => setEtapas((x) => [...x, { nombre: "", tareas: [{ titulo: "", quien: "fortius" }] }])}><Icono nombre="mas" tamano={16} />Otra etapa</button>
        </div>
      ) : null}

      <div className="as-fila as-fin">
        <button type="button" className="as-btn" onClick={alCerrar}>Cancelar</button>
        <button type="submit" className="as-btn as-pri" aria-disabled={!listo}>Guardar</button>
      </div>
    </form>
  );
}
