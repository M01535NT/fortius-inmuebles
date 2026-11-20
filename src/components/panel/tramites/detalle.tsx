"use client";
import { useEffect, useRef, useState } from "react";

import { useColeccion } from "@/components/panel/datos/use-coleccion";
import { Icono } from "@/components/panel/icons";
import { Boton } from "@/components/panel/kit/boton";
import { Campo } from "@/components/panel/kit/campo";
import { Desplegable, DesplegableFecha } from "@/components/panel/kit/desplegable";
import { Interruptor } from "@/components/panel/kit/segmentado";
import { SelectorHora } from "@/components/panel/kit/selector-fecha";
import { Checkbox } from "@/components/panel/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/panel/ui/dialog";
import { Switch } from "@/components/panel/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/panel/ui/tabs";
import type { Cliente } from "@/lib/backend/contracts";
import type { Archivo, Asesor } from "@/lib/domain/records";
import { aTexto, diaLargo } from "@/lib/panel/calendario";
import { enlaceWhatsApp } from "@/lib/panel/datos/consultas";
import { esPendienteFecha, fechaDePendiente, faltanDelPaso, historialTramite, nombreAutor, notasInternas, type CuentaEquipo } from "@/lib/panel/datos/tramites";
import { textoAvanceGuia, vistaTramite, type VistaTramite } from "@/lib/panel/datos/tramites-guias";
import type { Task } from "@/lib/tasks";
import { ACREEDORES, esHipoteca, textoDelAvance, type CualquierTramite, type ParteTramite } from "@/lib/tramites";

import "./tramites.css";

export type MedioAvance = "whatsapp" | "correo" | "pdf";
/** Lo que la página pide abrir desde un atajo o una fila (T, R, «Anotar respuesta»); `n` cambia en cada pedido. */
export type PedidoDetalle = { tipo: "tarea" | "avance" | "responder"; id: string; n: number } | null;

export type AccionesTramite = {
  alCerrarPaso: () => void;
  alReabrirPaso: () => void;
  alSubir: (archivos: File[], pasoClave: string) => Promise<void>;
  alVerDocumento: (a: Archivo) => Promise<string>;
  alEsperar: (quien: string, volver: string) => Promise<boolean>;
  /** «Anotar respuesta»: «Ya respondió» quita la espera; «Sigue en espera» la mueve a `volver`. */
  alResponder: (respuesta: string, volver: string | null) => Promise<boolean>;
  alAnotar: (texto: string) => Promise<boolean>;
  alPagar: (pagoId: string) => void;
  alPendiente: (pendienteId: string) => void;
  alFechaPendiente: (pendienteId: string, fecha: string) => void;
  alQuitarEspera: () => void;
  alTarea: (d: { texto: string; vence: string; hora: string | null }) => Promise<boolean>;
  alTareaHecha: (tareaId: string) => void;
  /** Trámites de partes (cambio de nombre de servicios, trámite libre). */
  alParte: (parteId: string, accion: "avanzar" | "reabrir") => void;
  alAgregarParte: (nombre: string) => Promise<boolean>;
  alTerminarPartes: () => void;
  alReabrirTramite: () => void;
  /** El asesor mandó el avance por su cuenta: queda registrado (la base pone la fecha y lo anota en el historial). */
  alAvanceEnviado: (medio: MedioAvance) => void;
};

const fecha = (iso?: string) => (iso ? diaLargo(aTexto(new Date(iso))) : "");

/**
 * Un trámite, como el boceto «Trámites» (15/11/2026): un solo checklist. En ruta (hipoteca, avalúo, Catastro…) cada paso con su
 * punto de estado; el actual va abierto con sus pendientes, «Cerrar el paso» (si falta algo, avisa y deja cerrarlo: DEC-61) y
 * «Poner en espera». En partes (cambio de nombre de servicios, trámite libre) cada parte se marca solicitada y lista, con qué
 * llevar. Debajo: Documentos con visor, Notas (separadas del Historial) y Datos.
 */
export function DetalleTramite({ t, persona, inmueble, documentos, tareas, ocupado, firma, pedido, ...a }: {
  t: CualquierTramite; persona: Cliente | null; inmueble: string; documentos: Archivo[]; tareas: Task[]; ocupado: boolean; firma: string; pedido: PedidoDetalle;
} & AccionesTramite) {
  const v = vistaTramite(t);
  const pasos = v.pasos;
  const terminado = v.terminado;
  const faltan = terminado || v.modo === "partes" ? [] : faltanDelPaso(t, documentos);
  const [hoy] = useState(() => new Date());
  const [abiertos, setAbiertos] = useState<Set<string>>(() => new Set());
  const [avance, setAvance] = useState(false);
  const [nuevaTarea, setNuevaTarea] = useState(false);
  const [responder, setResponder] = useState(false);
  const [seccion, setSeccion] = useState<"documentos" | "notas" | "datos">("documentos");
  const [visor, setVisor] = useState<number | null>(null);
  const [parteNueva, setParteNueva] = useState("");
  const subir = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const alternar = (clave: string) => setAbiertos((s) => { const n = new Set(s); if (n.has(clave)) n.delete(clave); else n.add(clave); return n; });

  // Atajos T y R y «Anotar respuesta» de la fila: la página los pide y aquí se abren.
  const [pedidoVisto, setPedidoVisto] = useState(pedido);
  if (pedidoVisto !== pedido) {
    setPedidoVisto(pedido);
    if (pedido && pedido.id === t.id) {
      if (pedido.tipo === "tarea") setNuevaTarea(true);
      else if (pedido.tipo === "avance") setAvance(true);
      else if (t.espera) setResponder(true);
    }
  }

  const pasoActual = pasos[t.pasoActual];
  // «Subir «…»» de Documentos: el documento del paso actual; en partes, lo primero de qué llevar.
  const subirNombre = v.modo === "ruta" ? pasoActual?.documento || "Documento" : v.partes.find((p) => p.estado !== "listo")?.llevar[0] || v.guia.llevar[0] || "Documento";
  const subirClave = v.modo === "ruta" ? pasoActual?.clave ?? "" : "";
  const todasListas = v.modo === "partes" && v.partes.length > 0 && v.partes.every((p) => p.estado === "listo");

  return (
    <div className="tra-detalle">
      {nuevaTarea ? <NuevaTarea hoy={hoy} ocupado={ocupado} alGuardar={a.alTarea} alCerrar={() => setNuevaTarea(false)} /> : null}
      {avance ? <Avance t={t} v={v} persona={persona} firma={firma} alEnviado={(m) => { a.alAvanceEnviado(m); setAvance(false); }} alCerrar={() => setAvance(false)} /> : null}

      <section aria-label={v.modo === "ruta" ? "Pasos" : "Partes"} className="tra-seccion">
        <div className="fm-t"><span>{v.modo === "ruta" ? "Pasos" : "Partes"}</span>{v.modo === "ruta" ? <span className="fm-t-n">{Math.min(t.pasoActual, pasos.length)} de {pasos.length}</span> : null}</div>
        {t.espera ? <Espera t={t} hoy={hoy} ocupado={ocupado} abierto={responder} alAbrir={setResponder} alResponder={a.alResponder} alQuitar={a.alQuitarEspera} /> : null}
        {v.porConfirmar ? <p className="pn-tra-confirmar">Pasos por confirmar con la fuente oficial</p> : null}
        {todasListas && t.estado === "en_curso" ? (
          <div className="pn-tra-linea" data-tono="listo">
            <span><b>Todas las partes están listas.</b></span>
            <div><Boton deshabilitado={ocupado} onClick={a.alTerminarPartes}>Cerrar el trámite</Boton></div>
          </div>
        ) : null}
        {terminado && t.estado === "terminado" ? (
          <div className="pn-tra-linea" data-tono="listo">
            <span><b>Trámite terminado.</b>{esHipoteca(t) ? " La hipoteca quedó cancelada." : ""}</span>
            {v.modo === "partes" ? <div><Boton variante="secundario" deshabilitado={ocupado} onClick={a.alReabrirTramite}>Reabrir</Boton></div> : null}
          </div>
        ) : null}

        {v.modo === "ruta" ? (
          <ol aria-label="Pasos del trámite" className="pn-tarjeta pn-tra-pasos">
            {pasos.map((p, i) => {
              const listo = i < t.pasoActual;
              const actual = i === t.pasoActual && !terminado;
              const abierto = actual || abiertos.has(p.clave);
              const tieneDoc = documentos.some((d) => d.pasoClave === p.clave);
              const docObligatorio = esHipoteca(t) && p.documento;
              const cerrado = t.pasos[i]?.cerradoEl;
              const estado = listo ? `Listo${cerrado ? ` · ${fecha(cerrado)}` : ""}` : actual ? (t.espera ? "En espera" : "Ahora") : "";
              return (
                <li key={p.clave} aria-current={actual ? "step" : undefined} className="pn-tra-paso">
                  <button type="button" className="pn-tra-cab" aria-expanded={abierto} onClick={() => { if (!actual) alternar(p.clave); }} aria-disabled={actual || undefined}>
                    <span className="pn-tra-punto" data-estado={listo ? "listo" : actual ? (t.espera ? "espera" : "ahora") : "pendiente"} aria-hidden />
                    <span className="pn-tra-nombre" data-actual={actual || undefined} data-listo={listo || undefined}>
                      {p.nombre}
                      {p.institucion ? <i className="pn-tra-inst">{p.institucion}</i> : null}
                    </span>
                    <span className="pn-tra-estado" data-actual={actual || undefined}>{estado}</span>
                  </button>
                  {abierto ? (
                    <div className="pn-tra-cuerpo">
                      {p.ayuda ? <p>{p.ayuda}</p> : null}
                      {p.llevar.length ? <p>Qué llevar: {p.llevar.join(" · ")}</p> : null}
                      {actual ? (
                        <>
                          <div style={{ display: "grid", gap: 4 }}>
                            {t.pasos[i].pendientes.map((x) => esPendienteFecha(x.texto) ? (
                              <div key={x.id} style={{ maxWidth: 260 }}>
                                <Campo etiqueta={x.texto.split(": ")[0]} type="date" value={fechaDePendiente(x.texto)} max={aTexto(hoy)} disabled={ocupado}
                                  onChange={(e) => a.alFechaPendiente(x.id, e.target.value)} />
                              </div>
                            ) : (
                              <label key={x.id} style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 44, cursor: "pointer" }}>
                                <Checkbox checked={x.hecho} disabled={ocupado} onCheckedChange={() => a.alPendiente(x.id)} />
                                <span style={{ textDecoration: x.hecho ? "line-through" : undefined, color: x.hecho ? "var(--ink-muted)" : undefined }}>{x.texto}</span>
                              </label>
                            ))}
                            {docObligatorio ? <SubirDocumento nombre={p.documento} listo={tieneDoc} ocupado={ocupado} alSubir={(f) => a.alSubir(f, p.clave)} /> : null}
                          </div>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                            <Boton deshabilitado={ocupado} onClick={a.alCerrarPaso}>{i === pasos.length - 1 ? "Cerrar el trámite" : "Cerrar el paso"}</Boton>
                            {!t.espera ? <PonerEnEspera hoy={hoy} sugerido={p.institucion} ocupado={ocupado} alEsperar={a.alEsperar} /> : null}
                            {faltan.length ? <span style={{ fontSize: 13, color: "var(--warning)" }}>{faltan.length === 1 ? "Falta 1 pendiente" : `Faltan ${faltan.length} pendientes`}. Puedes cerrarlo igual.</span> : null}
                          </div>
                        </>
                      ) : null}
                      {listo && i === t.pasoActual - 1 && t.estado !== "cancelado" ? (
                        <div><Boton variante="texto" deshabilitado={ocupado} onClick={a.alReabrirPaso}>Reabrir este paso</Boton></div>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ol>
        ) : (
          <>
            {v.partes.length ? (
              <ol aria-label="Partes del trámite" className="pn-tarjeta pn-tra-pasos">
                {v.partes.map((p) => <FilaParte key={p.id} p={p} abierta={abiertos.has(p.id)} ocupado={ocupado} alAbrir={() => alternar(p.id)} alParte={a.alParte} />)}
              </ol>
            ) : <p style={{ margin: 0, fontSize: 14, color: "var(--ink-muted)" }}>Sin partes todavía. Agrega lo que hay que tramitar.</p>}
            {t.estado === "en_curso" ? (
              <form noValidate className="pn-tra-agregar" onSubmit={(e) => { e.preventDefault(); if (!parteNueva.trim() || ocupado) return; void a.alAgregarParte(parteNueva).then((ok) => { if (ok) setParteNueva(""); }); }}>
                <div style={{ flex: 1 }}><Campo etiqueta="Agregar una parte" placeholder="Por ejemplo: Predial" maxLength={120} value={parteNueva} onChange={(e) => setParteNueva(e.target.value)} autoComplete="off" /></div>
                <Boton type="submit" variante="secundario" deshabilitado={ocupado || !parteNueva.trim()}>Agregar</Boton>
              </form>
            ) : null}
            {!terminado && t.estado === "en_curso" && !t.espera ? <div><PonerEnEspera hoy={hoy} sugerido={v.dondeEsta} ocupado={ocupado} alEsperar={a.alEsperar} /></div> : null}
          </>
        )}
      </section>

      <Tabs value={seccion} onValueChange={(x) => setSeccion(x as typeof seccion)}>
        <TabsList>
          <TabsTrigger value="documentos">Documentos{documentos.length ? ` ${documentos.length}` : ""}</TabsTrigger>
          <TabsTrigger value="notas">Notas</TabsTrigger>
          <TabsTrigger value="datos">Datos</TabsTrigger>
        </TabsList>
        <TabsContent value="documentos">
          <div className="pn-tarjeta" style={{ overflow: "hidden", marginTop: 12 }}>
            {documentos.length ? documentos.map((d, i) => (
              <button key={d.id} type="button" className="pn-tra-doc" onClick={() => setVisor(i)}>
                <Icono nombre="escritura" tamano={18} aria-hidden />
                <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                  <b>{d.nombre}</b>
                  {d.pasoClave ? <small>{pasos.find((p) => p.clave === d.pasoClave)?.nombre ?? ""}</small> : null}
                </span>
              </button>
            )) : <p style={{ margin: 0, padding: 14, fontSize: 14, color: "var(--ink-muted)" }}>Sin documentos todavía.</p>}
            <div style={{ padding: "8px 10px", borderTop: "1px solid var(--border)" }}>
              <input ref={subir} type="file" hidden multiple accept="application/pdf,image/*" onChange={(e) => {
                const f = Array.from(e.target.files ?? []); e.target.value = "";
                if (!f.length) return;
                setSubiendo(true); void a.alSubir(f, subirClave).finally(() => setSubiendo(false));
              }} />
              <Boton variante="texto" deshabilitado={ocupado || subiendo} onClick={() => subir.current?.click()}>{subiendo ? "Subiendo…" : `Subir «${subirNombre}»`}</Boton>
            </div>
          </div>
          <Visor documentos={documentos} pasos={pasos} indice={visor} alCambiar={setVisor} alVer={a.alVerDocumento} />
        </TabsContent>
        <TabsContent value="notas">
          <div style={{ display: "grid", gap: 16, marginTop: 12 }}><Notas t={t} ocupado={ocupado} alAnotar={a.alAnotar} /></div>
        </TabsContent>
        <TabsContent value="datos">
          <Datos t={t} v={v} persona={persona} inmueble={inmueble} tareas={tareas} ocupado={ocupado} alTareaHecha={a.alTareaHecha} alNuevaTarea={() => setNuevaTarea(true)} alPagar={a.alPagar} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

const ESTADO_PARTE: Record<ParteTramite["estado"], string> = { pendiente: "Pendiente", solicitado: "Solicitado", listo: "Listo" };

/** Una parte (Luz, Agua…): se toca para ver qué llevar; «Marcar solicitado» → «Marcar listo»; lista, se puede reabrir. */
function FilaParte({ p, abierta, ocupado, alAbrir, alParte }: { p: ParteTramite; abierta: boolean; ocupado: boolean; alAbrir: () => void; alParte: AccionesTramite["alParte"] }) {
  return (
    <li className="pn-tra-paso">
      <button type="button" className="pn-tra-cab" aria-expanded={abierta} onClick={alAbrir}>
        <span className="pn-tra-punto" data-estado={p.estado === "listo" ? "listo" : p.estado === "solicitado" ? "espera" : "pendiente"} aria-hidden />
        <span className="pn-tra-nombre" data-actual={p.estado === "solicitado" || undefined} data-listo={p.estado === "listo" || undefined}>
          {p.nombre}{p.institucion ? <i className="pn-tra-inst">{p.institucion}</i> : null}
        </span>
        <span className="pn-tra-estado" data-actual={p.estado === "solicitado" || undefined}>{ESTADO_PARTE[p.estado]}</span>
      </button>
      {abierta ? (
        <div className="pn-tra-cuerpo">
          {p.llevar.length ? <p>Qué llevar: {p.llevar.join(" · ")}</p> : <p>Sin lista de qué llevar.</p>}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {p.estado !== "listo" ? <Boton deshabilitado={ocupado} onClick={() => alParte(p.id, "avanzar")}>{p.estado === "pendiente" ? "Marcar solicitado" : "Marcar listo"}</Boton> : null}
            {p.estado === "listo" ? <Boton variante="texto" deshabilitado={ocupado} onClick={() => alParte(p.id, "reabrir")}>Reabrir</Boton> : null}
          </div>
        </div>
      ) : null}
    </li>
  );
}

function SubirDocumento({ nombre, listo, ocupado, alSubir }: { nombre: string; listo: boolean; ocupado: boolean; alSubir: (f: File[]) => Promise<void> }) {
  const ref = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 44 }}>
      <Checkbox checked={listo} disabled aria-label={`${nombre}: ${listo ? "subido" : "falta"}`} />
      <span style={{ flex: 1 }}>{nombre}</span>
      {!listo ? (
        <>
          <input ref={ref} type="file" hidden accept="application/pdf,image/*" onChange={(e) => {
            const f = Array.from(e.target.files ?? []); e.target.value = "";
            if (!f.length) return;
            setSubiendo(true); void alSubir(f).finally(() => setSubiendo(false));
          }} />
          <Boton variante="secundario" deshabilitado={ocupado || subiendo} onClick={() => ref.current?.click()}>{subiendo ? "Subiendo…" : "Subir"}</Boton>
        </>
      ) : null}
    </div>
  );
}

/** «Poner en espera»: a quién (sugiere la institución del paso) y cuándo volver a preguntar; la base crea la tarea. */
function PonerEnEspera({ hoy, sugerido, ocupado, alEsperar }: { hoy: Date; sugerido: string; ocupado: boolean; alEsperar: (quien: string, volver: string) => Promise<boolean> }) {
  const [abierto, setAbierto] = useState(false);
  const [quien, setQuien] = useState(sugerido && sugerido !== "Propietario" ? sugerido : "");
  const [volver, setVolver] = useState<string | null>(null);
  if (!abierto) return <Boton variante="secundario" onClick={() => setAbierto(true)}>Poner en espera</Boton>;
  return (
    <div style={{ display: "grid", gap: 10, width: "100%", marginTop: 4 }}>
      <div style={{ display: "grid", gap: 2 }}><h3 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Poner en espera</h3><span className="pn-sub" style={{ margin: 0 }}>Crea la tarea de volver a preguntar.</span></div>
      <Campo etiqueta="Esperas a" placeholder="Registro Público, banco, notaría…" maxLength={120} value={quien} onChange={(e) => setQuien(e.target.value)} autoFocus />
      <DesplegableFecha etiqueta="Vuelves a preguntar" valor={volver} alElegir={setVolver} hoy={hoy} sinFecha={null} etiquetaCalendario="Vuelves a preguntar el" />
      <div style={{ display: "flex", gap: 8 }}>
        <Boton deshabilitado={ocupado || !quien.trim() || !volver} onClick={() => { if (volver) void alEsperar(quien, volver).then((ok) => { if (ok) setAbierto(false); }); }}>Poner en espera</Boton>
        <Boton variante="texto" onClick={() => setAbierto(false)}>Cancelar</Boton>
      </div>
    </div>
  );
}

/** «Nueva tarea» del trámite (boceto): qué hacer, el día y, si se quiere, la hora para que también salga en la Agenda. */
function NuevaTarea({ hoy, ocupado, alGuardar, alCerrar }: {
  hoy: Date; ocupado: boolean; alGuardar: (d: { texto: string; vence: string; hora: string | null }) => Promise<boolean>; alCerrar: () => void;
}) {
  const [texto, setTexto] = useState("");
  const [vence, setVence] = useState<string | null>(() => aTexto(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1)));
  const [conHora, setConHora] = useState(false);
  const [hora, setHora] = useState(10 * 60);
  const listo = texto.trim().length > 0 && Boolean(vence);
  const guardar = () => {
    if (!listo || ocupado || !vence) return;
    const hhmm = `${String(Math.floor(hora / 60)).padStart(2, "0")}:${String(hora % 60).padStart(2, "0")}`;
    void alGuardar({ texto, vence, hora: conHora ? hhmm : null }).then((ok) => { if (ok) alCerrar(); });
  };
  return (
    <form noValidate onSubmit={(e) => { e.preventDefault(); guardar(); }} className="pn-tra-hoja">
      <div style={{ display: "grid", gap: 2 }}><h3 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Nueva tarea</h3><span className="pn-sub" style={{ margin: 0 }}>Aparece en Hoy el día que toca.</span></div>
      <Campo etiqueta="¿Qué hay que hacer?" placeholder="Preguntar a Infonavit por la carta" maxLength={160} value={texto} onChange={(e) => setTexto(e.target.value)} autoComplete="off" autoFocus />
      <DesplegableFecha etiqueta="Cuándo" valor={vence} alElegir={setVence} hoy={hoy} sinFecha={null} etiquetaCalendario="El día" />
      <label style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 44, cursor: "pointer" }}>
        <Checkbox checked={conHora} onCheckedChange={(c) => setConHora(c === true)} />
        <span>Añadir a la agenda con hora</span>
      </label>
      {conHora ? <SelectorHora valor={hora} alCambiar={setHora} /> : null}
      <div style={{ display: "flex", gap: 8 }}>
        <Boton type="submit" deshabilitado={ocupado || !listo}>Guardar la tarea</Boton>
        <Boton variante="texto" onClick={alCerrar}>Cancelar</Boton>
      </div>
    </form>
  );
}

/** La línea de espera: a quién y cuándo volver a preguntar; «Anotar respuesta» (Ya respondió / Sigue en espera) y «Quitar la espera». */
function Espera({ t, hoy, ocupado, abierto, alAbrir, alResponder, alQuitar }: {
  t: CualquierTramite; hoy: Date; ocupado: boolean; abierto: boolean; alAbrir: (v: boolean) => void;
  alResponder: (r: string, volver: string | null) => Promise<boolean>; alQuitar: () => void;
}) {
  const [respuesta, setRespuesta] = useState("");
  const [sigue, setSigue] = useState<"listo" | "sigue">("listo");
  const [volver, setVolver] = useState<string | null>(null);
  if (!t.espera) return null;
  const hoyT = aTexto(hoy);
  const toca = t.espera.volver <= hoyT;
  const listo = sigue === "listo" || Boolean(volver);
  return (
    <section className="pn-tra-linea" data-tono={toca ? "toca" : "espera"} aria-live="polite">
      <span><b>Esperando a {t.espera.quien}</b> desde el {diaLargo(t.espera.desde)}. {toca ? "Hoy toca preguntar." : `Vuelves a preguntar el ${diaLargo(t.espera.volver)}.`}</span>
      {abierto ? (
        <form noValidate style={{ display: "grid", gap: 10 }} onSubmit={(e) => {
          e.preventDefault();
          if (!listo || ocupado) return;
          void alResponder(respuesta, sigue === "sigue" ? volver : null).then((ok) => { if (ok) { alAbrir(false); setRespuesta(""); setVolver(null); setSigue("listo"); } });
        }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Anotar respuesta</h3>
          <Interruptor etiqueta="Qué respondieron" valor={sigue} alElegir={setSigue} opciones={[{ valor: "listo", etiqueta: "Ya respondió" }, { valor: "sigue", etiqueta: "Sigue en espera" }]} />
          <Campo etiqueta="Qué dijeron (opcional)" maxLength={500} value={respuesta} onChange={(e) => setRespuesta(e.target.value)} autoFocus autoComplete="off" />
          {sigue === "sigue" ? <DesplegableFecha etiqueta="Vuelves a preguntar" valor={volver} alElegir={setVolver} hoy={hoy} sinFecha={null} etiquetaCalendario="Vuelves a preguntar el" /> : null}
          <div style={{ display: "flex", gap: 8 }}>
            <Boton type="submit" deshabilitado={ocupado || !listo}>Guardar</Boton>
            <Boton variante="texto" onClick={() => alAbrir(false)}>Cancelar</Boton>
          </div>
        </form>
      ) : (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          <Boton onClick={() => alAbrir(true)}>Anotar respuesta</Boton>
          <Boton variante="texto" deshabilitado={ocupado} onClick={alQuitar}>Quitar la espera</Boton>
        </div>
      )}
    </section>
  );
}

const PARTES_AVANCE = [
  { clave: "listo", etiqueta: "Lo que ya está listo" },
  { clave: "sigue", etiqueta: "Lo que sigue" },
  { clave: "necesita", etiqueta: "Lo que necesitamos de usted" },
  { clave: "pagos", etiqueta: "Pagos" },
] as const;
const MEDIOS: { valor: MedioAvance; etiqueta: string }[] = [{ valor: "whatsapp", etiqueta: "WhatsApp" }, { valor: "correo", etiqueta: "Correo" }, { valor: "pdf", etiqueta: "PDF" }];

/** PDF del avance: una hoja limpia para imprimir o guardar como PDF. Solo el texto del mensaje. */
function abrirParaImprimir(titulo: string, texto: string) {
  const w = window.open("", "_blank");
  if (!w) return false;
  const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] ?? c);
  w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(titulo)}</title><style>body{font:15px/1.5 system-ui,sans-serif;max-width:640px;margin:48px auto;padding:0 24px;color:#18202a}pre{white-space:pre-wrap;font:inherit}</style></head><body><pre>${esc(texto)}</pre></body></html>`);
  w.document.close();
  w.focus();
  w.print();
  return true;
}

/** «Avance al propietario»: arma el mensaje sin notas internas. El panel no envía nada: lo copia o lo abre, y deja registrado que se mandó. */
function Avance({ t, v, persona, firma, alEnviado, alCerrar }: { t: CualquierTramite; v: VistaTramite; persona: Cliente | null; firma: string; alEnviado: (m: MedioAvance) => void; alCerrar: () => void }) {
  const [partes, setPartes] = useState({ listo: true, sigue: true, necesita: true, pagos: false });
  const [medio, setMedio] = useState<MedioAvance>("whatsapp");
  const [copiado, setCopiado] = useState(false);
  const nombre = persona?.nombre?.split(" ")[0] ?? "propietario";
  const texto = esHipoteca(t) ? textoDelAvance(t, partes, nombre, firma) : textoAvanceGuia(t, v, partes, nombre, firma);
  const wa = persona?.telefono ? enlaceWhatsApp(persona.telefono, texto) : null;
  const correo = persona?.email ? `mailto:${encodeURIComponent(persona.email)}?subject=${encodeURIComponent(`Avance: ${t.titulo}`)}&body=${encodeURIComponent(texto)}` : null;
  const sinDestino = (medio === "whatsapp" && !wa) || (medio === "correo" && !correo);
  const enviar = () => {
    if (medio === "whatsapp" && wa) window.open(wa, "_blank", "noopener,noreferrer");
    else if (medio === "correo" && correo) window.location.href = correo;
    else if (medio === "pdf" && !abrirParaImprimir(`Avance · ${t.titulo}`, texto)) return;
    alEnviado(medio);
  };
  return (
    <section className="pn-tra-hoja" aria-label="Avance para el propietario">
      <div style={{ display: "grid", gap: 2 }}><h3 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Avance para el propietario</h3><span className="pn-sub" style={{ margin: 0 }}>Se arma solo. Elige qué incluir y revísalo.</span></div>
      <Desplegable etiqueta="Medio" valor={medio} opciones={MEDIOS} alElegir={(m) => { if (m) setMedio(m); }}
        ayuda={sinDestino ? (medio === "whatsapp" ? "La persona no tiene teléfono anotado: copia el texto." : "La persona no tiene correo anotado: copia el texto.") : undefined} />
      <pre className="pn-tra-mensaje">{texto}</pre>
      {PARTES_AVANCE.map((p) => (
        <div key={p.clave} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, minHeight: 44 }}>
          <span>{p.etiqueta}</span>
          <Switch checked={partes[p.clave]} onCheckedChange={(c) => setPartes((s) => ({ ...s, [p.clave]: c }))} aria-label={p.etiqueta} />
        </div>
      ))}
      <p className="pn-campo-ayuda" style={{ margin: 0 }}>Las notas internas nunca se incluyen. Tú mandas el mensaje desde tu WhatsApp o tu correo; aquí queda registrado que se envió.</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Boton variante="secundario" onClick={() => { void navigator.clipboard?.writeText(texto).then(() => setCopiado(true)); }}>{copiado ? "Copiado" : "Copiar texto"}</Boton>
        <Boton deshabilitado={sinDestino} onClick={enviar}>{medio === "whatsapp" ? "Abrir WhatsApp" : medio === "correo" ? "Abrir correo" : "Generar PDF"}</Boton>
        <Boton variante="texto" onClick={alCerrar}>Cerrar</Boton>
      </div>
      {t.ultimoAvance?.fecha ? <span className="pn-campo-ayuda">Último avance: {fecha(t.ultimoAvance.fecha)} por {MEDIOS.find((m) => m.valor === t.ultimoAvance?.medio)?.etiqueta}.</span> : null}
    </section>
  );
}

/** Visor de documentos (boceto): el documento grande, con anterior y siguiente. Los archivos son privados: se pide su enlace firmado. */
function Visor({ documentos, pasos, indice, alCambiar, alVer }: {
  documentos: Archivo[]; pasos: VistaTramite["pasos"]; indice: number | null; alCambiar: (i: number | null) => void; alVer: (a: Archivo) => Promise<string>;
}) {
  const d = indice !== null ? documentos[indice] : undefined;
  const [url, setUrl] = useState<{ id: string; url: string | null } | null>(null);
  useEffect(() => {
    if (!d) return;
    let vivo = true;
    alVer(d).then((u) => { if (vivo) setUrl({ id: d.id, url: u }); }, () => { if (vivo) setUrl({ id: d.id, url: null }); });
    return () => { vivo = false; };
  }, [d, alVer]);
  const n = documentos.length;
  const actual = d && url?.id === d.id ? url.url : undefined;
  return (
    <Dialog open={Boolean(d)} onOpenChange={(o) => { if (!o) alCambiar(null); }}>
      <DialogContent className="pn-tra-visor" onKeyDown={(e) => {
        if (indice === null || n < 2) return;
        if (e.key === "ArrowRight") { e.preventDefault(); alCambiar((indice + 1) % n); }
        if (e.key === "ArrowLeft") { e.preventDefault(); alCambiar((indice + n - 1) % n); }
      }}>
        <DialogTitle>{d?.nombre ?? "Documento"}</DialogTitle>
        <DialogDescription>{[d?.pasoClave ? pasos.find((p) => p.clave === d.pasoClave)?.nombre : "", indice !== null ? `${indice + 1} de ${n}` : ""].filter(Boolean).join(" · ")}</DialogDescription>
        <div className="pn-tra-visor-hoja">
          {actual === undefined ? <span className="pn-sub">Abriendo…</span>
            : actual === null ? <span className="pn-sub">No se pudo abrir el documento.</span>
            : d?.tipo === "imagen" ? <img src={actual} alt={d.nombre} />
            : d?.tipo === "pdf" ? <iframe src={actual} title={d.nombre} />
            : <a className="pn-btn pn-btn-secundario" href={actual} target="_blank" rel="noopener noreferrer">Abrir en otra pestaña</a>}
        </div>
        {n > 1 && indice !== null ? (
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <Boton variante="secundario" onClick={() => alCambiar((indice + n - 1) % n)} aria-label="Anterior">‹ Anterior</Boton>
            <Boton variante="secundario" onClick={() => alCambiar((indice + 1) % n)} aria-label="Siguiente">Siguiente ›</Boton>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/** Datos: tareas, datos del crédito (hipoteca) o del trámite, y pagos. */
function Datos({ t, v, persona, inmueble, tareas, ocupado, alTareaHecha, alNuevaTarea, alPagar }: {
  t: CualquierTramite; v: VistaTramite; persona: Cliente | null; inmueble: string; tareas: Task[]; ocupado: boolean;
  alTareaHecha: (id: string) => void; alNuevaTarea: () => void; alPagar: (id: string) => void;
}) {
  const ultimo = [...t.notas].map((n) => n.fecha ?? "").sort().pop();
  const kv: [string, string][] = esHipoteca(t)
    ? [["Acreedor", ACREEDORES[t.acreedor]], ["Número de crédito", t.credito?.numero || "Por capturar"], ["Último contacto", ultimo ? fecha(ultimo) : "Sin contacto"], ["Propietario", persona?.nombre ?? "Sin anotar"],
      ["Paso", v.terminado ? "Terminado" : `${t.pasoActual + 1} de ${v.total}`]]
    : [["Tipo", v.nombreTipo], ["Ligado a", [inmueble, persona?.nombre].filter(Boolean).join(" · ") || "Sin ligar"], ["Dónde está", v.dondeEsta || "—"], ["Último contacto", ultimo ? fecha(ultimo) : "Sin contacto"]];
  return (
    <section style={{ display: "grid", gap: 8, marginTop: 12 }}>
      <h3 className="pn-grupo" style={{ margin: 0 }}>Tareas</h3>
      <div className="pn-tarjeta" style={{ padding: "2px 14px" }}>
        {tareas.length ? tareas.map((x) => (
          <label key={x.id} style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 48, cursor: "pointer" }}>
            <Checkbox checked={x.estado === "completada"} disabled={ocupado || x.estado === "completada"} onCheckedChange={() => alTareaHecha(x.id)} />
            <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ textDecoration: x.estado === "completada" ? "line-through" : undefined, color: x.estado === "completada" ? "var(--ink-muted)" : undefined }}>{x.titulo}</span>
              {x.vence ? <small style={{ fontSize: 13, color: "var(--ink-muted)" }}>{diaLargo(x.vence)}</small> : null}
            </span>
          </label>
        )) : <p style={{ margin: 0, padding: "12px 0", fontSize: 14, color: "var(--ink-muted)" }}>Sin tareas. Se muestran también en Hoy y en la Agenda.</p>}
        <Boton variante="texto" onClick={alNuevaTarea}>Nueva tarea</Boton>
      </div>
      <h3 className="pn-grupo" style={{ margin: "8px 0 0" }}>{esHipoteca(t) ? "Datos del crédito" : "Datos del trámite"}</h3>
      <div className="pn-tarjeta" style={{ overflow: "hidden" }}>
        {kv.map(([k, val]) => <div key={k} className="pn-tra-kv"><span>{k}</span><span>{val}</span></div>)}
      </div>
      <h3 className="pn-grupo" style={{ margin: "8px 0 0" }}>Pagos</h3>
      {t.pagos.length ? (
        <div className="pn-tarjeta" style={{ padding: "2px 14px" }}>
          {t.pagos.map((p) => (
            <label key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 48, cursor: "pointer" }}>
              <Checkbox checked={p.estado === "pagado"} disabled={ocupado} onCheckedChange={() => alPagar(p.id)} />
              <span style={{ flex: 1 }}>{p.concepto}</span>
              {p.monto !== undefined ? <span style={{ fontVariantNumeric: "tabular-nums", color: "var(--ink-muted)" }}>${p.monto.toLocaleString("es-MX")}</span> : <span style={{ color: "var(--ink-muted)" }}>{p.estado === "pagado" ? "Pagado" : "Por definir"}</span>}
            </label>
          ))}
        </div>
      ) : <p style={{ margin: 0, fontSize: 14, color: "var(--ink-muted)" }}>Sin pagos anotados.</p>}
      {esHipoteca(t) && t.pagos.length ? <p className="pn-campo-ayuda" style={{ margin: 0 }}>Montos de referencia del Registro Público de BC (octubre de 2026).</p> : null}
    </section>
  );
}

function useCuentasEquipo() {
  const [cuentas, setCuentas] = useState<CuentaEquipo[]>([]);
  useEffect(() => {
    const c = new AbortController();
    // Solo el director puede leer las cuentas; para los demás, el autor se muestra como «Alguien del equipo».
    fetch("/api/admin/asesor-cuentas", { credentials: "same-origin", cache: "no-store", signal: c.signal })
      .then((r) => (r.ok ? r.json() : { cuentas: [] }))
      .then((d: { cuentas?: CuentaEquipo[] }) => setCuentas(d.cuentas ?? []), () => undefined);
    return () => c.abort();
  }, []);
  return cuentas;
}

const fechaHora = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${diaLargo(aTexto(d))}, ${d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`;
};

/** Notas internas separadas del historial: aviso fijo, caja arriba, «Guardar nota»; cada nota con quién y cuándo, sin editar ni borrar. */
function Notas({ t, ocupado, alAnotar }: { t: CualquierTramite; ocupado: boolean; alAnotar: (texto: string) => Promise<boolean> }) {
  const [nota, setNota] = useState("");
  const asesores = useColeccion<Asesor>("asesores");
  const cuentas = useCuentasEquipo();
  const notas = notasInternas(t);
  const historial = historialTramite(t);
  const vacia = !nota.trim();
  return (
    <>
      <section style={{ display: "grid", gap: 8 }} aria-labelledby={`notas-${t.id}`}>
        <h3 id={`notas-${t.id}`} className="pn-grupo" style={{ margin: 0, padding: 0 }}>Notas internas</h3>
        <p className="pn-tra-aviso-notas"><Icono nombre="alerta" tamano={16} aria-hidden />Solo las ve el equipo. Nunca salen en lo que se envía al cliente.</p>
        <div className="pn-campo">
          <label htmlFor={`nota-${t.id}`}>Nota nueva</label>
          <textarea id={`nota-${t.id}`} rows={3} maxLength={5000} value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Escribe una nota interna" />
        </div>
        <div><Boton variante="secundario" deshabilitado={ocupado || vacia} onClick={() => { if (!vacia && !ocupado) void alAnotar(nota).then((ok) => { if (ok) setNota(""); }); }}>Guardar nota</Boton></div>
        {notas.length ? (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {notas.map((n) => (
              <li key={n.id} style={{ padding: "8px 0", borderTop: "1px solid var(--border)", display: "grid", gap: 2 }}>
                <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>{[nombreAutor(n.autor, cuentas, asesores.datos), fechaHora(n.fecha)].filter(Boolean).join(" · ")}</span>
                <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{n.texto}</p>
              </li>
            ))}
          </ul>
        ) : <p style={{ margin: 0, color: "var(--ink-muted)" }}>Todavía no hay notas en este trámite.</p>}
      </section>
      {historial.length ? (
        <section>
          <h3 className="pn-grupo">Historial</h3>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {historial.map((n) => (
              <li key={n.id} style={{ padding: "6px 0", borderTop: "1px solid var(--border)", fontSize: 14 }}>
                {n.fecha ? <span style={{ color: "var(--ink-muted)" }}>{fechaHora(n.fecha)} · </span> : null}{n.texto}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
