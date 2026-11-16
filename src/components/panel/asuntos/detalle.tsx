"use client";
import { useEffect, useState } from "react";

import { Boton } from "@/components/panel/kit/boton";
import { Campo } from "@/components/panel/kit/campo";
import { Desplegable, DesplegableFecha } from "@/components/panel/kit/desplegable";
import { Cargando, EstadoError, Vacio } from "@/components/panel/kit/estados";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/panel/ui/tabs";
import { aTexto, diaLargo } from "@/lib/panel/calendario";
import {
  autorDeNota, avisosDelAsunto, cambiarFechaObjetivo, llevaCierre, cuentaDocumentos, documentosDelAsunto, marcarDocumento, motivoDelEstado, MOTIVOS_NO_SE_DIO, noSeDio, ponerEnEspera, reanudar,
  type Actividad, type AvisoAsunto, type CambioOperacion, type EstadoAsunto, type EstadoDocumento, type Expediente,
} from "@/lib/panel/datos/asuntos";
import { anotarEnAsunto, leerActividad } from "@/lib/panel/datos/colecciones";
import { leerCuentas, type Cuenta } from "@/lib/panel/datos/configuracion-cuentas";
import type { Asesor } from "@/lib/domain/records";
import { useSession } from "@/lib/panel/legado/sesion";
import { useColeccion } from "@/components/panel/datos/use-coleccion";

import { ArchivosDelAsunto } from "./archivos-del-asunto";
import { CierreDelAsunto } from "./cierre-del-asunto";
import { FormatosDelAsunto } from "./formatos-del-asunto";

/** Cambio que la página guarda: cómo construirlo con el asunto vigente, el aviso y, si se puede, cómo deshacerlo. */
export type PedirCambio = (crear: (e: Expediente) => CambioOperacion, aviso: string, deshacer?: (e: Expediente) => CambioOperacion) => Promise<boolean>;

const NOMBRE_DOC: Record<EstadoDocumento, string> = { pendiente: "Falta", recibido: "Recibido", no_aplica: "No aplica" };
const OPCIONES_DOC = (Object.keys(NOMBRE_DOC) as EstadoDocumento[]).map((v) => ({ valor: v, etiqueta: NOMBRE_DOC[v] }));

/**
 * Pestañas del asunto (PN-04, boceto «Asuntos»): Resumen (estado y lo que espera), Documentos y Actividad (notas e historial).
 * Guías llega con PN-07. Todo se guarda con las rutas que ya existen y el servidor aplica sus frenos.
 */
export function PestanasAsunto({ expediente, estado, resumen, ocupado, alCambiar }: {
  expediente: Expediente; estado: EstadoAsunto; resumen: React.ReactNode; ocupado: boolean; alCambiar: PedirCambio;
}) {
  const docs = documentosDelAsunto(expediente);
  const [pestana, setPestana] = useState("resumen");
  const [hoy] = useState(() => aTexto(new Date()));
  const avisos = avisosDelAsunto(expediente, hoy);
  return (
    <Tabs value={pestana} onValueChange={setPestana} style={{ marginTop: 12 }}>
      <TabsList>
        <TabsTrigger value="resumen">Resumen</TabsTrigger>
        <TabsTrigger value="documentos">Documentos</TabsTrigger>
        <TabsTrigger value="notas">Notas</TabsTrigger>
        <TabsTrigger value="actividad">Actividad</TabsTrigger>
      </TabsList>
      <TabsContent value="resumen">
        <AvisosDelAsunto key={expediente.id} avisos={avisos} alAccionar={(clave) => { if (clave === "documentos") setPestana("documentos"); }} />
        <EstadoDelAsunto key={`${expediente.id}-${estado}`} expediente={expediente} estado={estado} ocupado={ocupado} alCambiar={alCambiar} />
        {estado !== "cerrado" ? <FechaObjetivo key={`${expediente.id}-${expediente.fecha_objetivo ?? ""}`} expediente={expediente} ocupado={ocupado} alCambiar={alCambiar} /> : null}
        {resumen}
        {llevaCierre(expediente) && estado !== "cerrado" ? <CierreDelAsunto key={`cierre-${expediente.id}`} expediente={expediente} ocupado={ocupado} alCambiar={alCambiar} /> : null}
      </TabsContent>
      <TabsContent value="documentos">
        <ArchivosDelAsunto expedienteId={expediente.id} documentos={docs}
          alSubir={(clave) => {
            const d = docs.find((x) => x.clave === clave);
            if (!d || d.estado === "recibido") return;
            void alCambiar((e) => marcarDocumento(e, d.clave, "recibido"), `${d.nombre}: recibido`, (e) => marcarDocumento(e, d.clave, d.estado));
          }} />
        <FormatosDelAsunto expedienteId={expediente.id} operacion={expediente.operacion} />
        <h3 className="pn-grupo" style={{ margin: "24px 0 0" }}>Lo que se pide</h3>
        <p className="pn-sub" style={{ margin: "8px 0 12px" }}>{cuentaDocumentos(docs)}</p>
        <div style={{ display: "grid", gap: 12 }}>
          {docs.map((d) => (
            <Desplegable key={d.clave} etiqueta={d.nombre} valor={d.estado} opciones={OPCIONES_DOC}
              alElegir={(v) => {
                if (!v || v === d.estado || ocupado) return;
                void alCambiar((e) => marcarDocumento(e, d.clave, v), `${d.nombre}: ${NOMBRE_DOC[v].toLowerCase()}`, (e) => marcarDocumento(e, d.clave, d.estado));
              }} />
          ))}
        </div>
      </TabsContent>
      <TabsContent value="notas">
        <ActividadDelAsunto id={expediente.id} solo="nota" />
      </TabsContent>
      <TabsContent value="actividad">
        <ActividadDelAsunto id={expediente.id} solo="cambio" />
      </TabsContent>
    </Tabs>
  );
}

type Eleccion = "activo" | "espera" | "no";

function EstadoDelAsunto({ expediente, estado, ocupado, alCambiar }: { expediente: Expediente; estado: EstadoAsunto; ocupado: boolean; alCambiar: PedirCambio }) {
  const actual: Eleccion = estado === "espera" ? "espera" : estado === "cerrado" ? "no" : "activo";
  const [eleccion, setEleccion] = useState<Eleccion>(actual);
  const [queEspera, setQueEspera] = useState("");
  const [motivo, setMotivo] = useState<(typeof MOTIVOS_NO_SE_DIO)[number] | "">("");
  const [detalle, setDetalle] = useState("");
  const cerradoPorEtapa = expediente.etapa === "cerrado";
  const nota = motivoDelEstado(expediente);
  const anterior = expediente.flujo ? { ...expediente.flujo } : null;
  const volver = anterior ? (e: Expediente) => ({ ...reanudar(e), flujo: { ...anterior } }) : undefined;

  if (cerradoPorEtapa) {
    return <p className="pn-sub" style={{ margin: "8px 0 0" }}>Este asunto terminó: llegó hasta el cierre.</p>;
  }
  const elegir = (v: Eleccion | "") => {
    if (!v) return;
    setEleccion(v);
    if (v === "activo" && actual !== "activo") void alCambiar(reanudar, actual === "no" ? "Asunto reabierto" : "Asunto activo de nuevo", volver);
  };
  return (
    <section style={{ display: "grid", gap: 10, marginTop: 8 }}>
      <Desplegable etiqueta="Estado" valor={eleccion} alElegir={elegir} opciones={[
        { valor: "activo", etiqueta: actual === "no" ? "Reabrir" : "Activo" },
        { valor: "espera", etiqueta: "En espera" },
        { valor: "no", etiqueta: "No se dio" },
      ]} />
      {nota && eleccion === actual ? <p style={{ margin: 0, color: "var(--ink-muted)" }}>{nota}</p> : null}
      {eleccion === "espera" && actual !== "espera" ? (
        <>
          <Campo etiqueta="¿Qué espera?" placeholder="Por ejemplo: el avalúo del banco" maxLength={300} value={queEspera} onChange={(e) => setQueEspera(e.target.value)} autoFocus />
          <div style={{ display: "flex", gap: 8 }}>
            <Boton variante="secundario" deshabilitado={ocupado || !queEspera.trim()} onClick={() => void alCambiar((e) => ponerEnEspera(e, queEspera), "Asunto en espera", volver)}>Poner en espera</Boton>
            <Boton variante="texto" onClick={() => setEleccion(actual)}>Cancelar</Boton>
          </div>
        </>
      ) : null}
      {eleccion === "no" && actual !== "no" ? (
        <>
          <Desplegable etiqueta="¿Por qué no se dio?" valor={motivo} vacio="Elige el motivo" alElegir={setMotivo} opciones={MOTIVOS_NO_SE_DIO.map((m) => ({ valor: m, etiqueta: m }))} />
          <Campo etiqueta="Detalle (opcional)" maxLength={300} value={detalle} onChange={(e) => setDetalle(e.target.value)} />
          <div style={{ display: "flex", gap: 8 }}>
            <Boton variante="peligro" deshabilitado={ocupado || !motivo} onClick={() => motivo && void alCambiar((e) => noSeDio(e, motivo, detalle), "Asunto cerrado: no se dio", volver)}>Cerrar el asunto</Boton>
            <Boton variante="texto" onClick={() => setEleccion(actual)}>Cancelar</Boton>
          </div>
          <span className="pn-campo-ayuda">Las personas siguen siendo clientes; el asunto se puede reabrir.</span>
        </>
      ) : null}
    </section>
  );
}

const hora = (iso: string) => new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

/**
 * «Notas» (lo que el equipo escribe; nunca sale al cliente) y «Actividad» (lo que registra la base sola), separadas como en el boceto.
 * Las dos leen la misma ruta; cada pestaña muestra lo suyo.
 */
function ActividadDelAsunto({ id, solo }: { id: string; solo: "nota" | "cambio" }) {
  const [estado, setEstado] = useState<{ cargando: boolean; error: string | null; datos: Actividad[] }>({ cargando: true, error: null, datos: [] });
  const [intento, setIntento] = useState(0);
  const [nota, setNota] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [falla, setFalla] = useState<string | null>(null);
  useEffect(() => {
    const c = new AbortController();
    leerActividad<Actividad>(id, c.signal).then(
      (datos) => setEstado({ cargando: false, error: null, datos }),
      (e: unknown) => { if (!(e instanceof DOMException && e.name === "AbortError")) setEstado({ cargando: false, error: e instanceof Error ? e.message : "No se pudo cargar.", datos: [] }); },
    );
    return () => c.abort();
  }, [id, intento]);
  const anotar = async () => {
    const texto = nota.trim();
    if (!texto) return;
    setGuardando(true); setFalla(null);
    try {
      const nueva = await anotarEnAsunto<Actividad>(id, texto);
      setEstado((s) => ({ ...s, datos: [nueva, ...s.datos] }));
      setNota("");
    } catch (e) {
      setFalla(e instanceof Error ? e.message : "No se guardó. Vuelve a intentarlo.");
    } finally { setGuardando(false); }
  };
  const yo = useSession()?.id ?? null;
  const esDirector = useSession()?.role === "admin";
  const asesores = useColeccion<Asesor>("asesores");
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  useEffect(() => {
    if (solo !== "nota" || !esDirector) return;
    const c = new AbortController();
    leerCuentas(c.signal).then(setCuentas, () => setCuentas([]));
    return () => c.abort();
  }, [solo, esDirector]);
  const lista = estado.datos.filter((a) => (solo === "nota" ? a.tipo === "nota" : a.tipo !== "nota"));
  return (
    <div style={{ display: "grid", gap: 12, marginTop: 8 }}>
      {solo === "nota" ? (<>
      <p className="pn-sub" style={{ margin: 0 }}>Solo las ve el equipo. Nunca salen en lo que se envía al cliente.</p>
      <div className="pn-campo">
        <label htmlFor={`nota-${id}`}>Nota interna</label>
        <textarea id={`nota-${id}`} rows={3} maxLength={1000} value={nota} onChange={(e) => setNota(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); void anotar(); } }}
          aria-describedby={`nota-ayuda-${id}`} />
        <span id={`nota-ayuda-${id}`} className="pn-campo-ayuda">Ctrl + Enter la guarda.</span>
      </div>
      {falla ? <p role="alert" style={{ margin: 0, color: "var(--error)" }}>{falla}</p> : null}
      {nota.trim() ? <div><Boton variante="secundario" deshabilitado={guardando} onClick={() => void anotar()}>Guardar nota</Boton></div> : null}
      </>) : null}
      {estado.cargando ? <Cargando lineas={3} etiqueta="Cargando actividad" /> : null}
      {estado.error ? <EstadoError texto={estado.error} alReintentar={() => { setEstado({ cargando: true, error: null, datos: [] }); setIntento((n) => n + 1); }} /> : null}
      {!estado.cargando && !estado.error && lista.length === 0
        ? (solo === "nota" ? <p className="pn-sub" style={{ margin: 0 }}>Todavía no hay notas.</p> : <Vacio titulo="Sin actividad todavía" texto="Los cambios del asunto aparecen aquí." icono="expediente" />)
        : null}
      {lista.length ? (
        <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 0 }}>
          {lista.map((a) => (
            <li key={a.id} style={{ padding: "10px 0", borderTop: "1px solid var(--border)", display: "grid", gap: 2 }}>
              <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>{[solo === "nota" ? autorDeNota(a.created_by, yo, cuentas, asesores.datos) : null, `${diaLargo(aTexto(new Date(a.created_at)))}, ${hora(a.created_at)}`].filter(Boolean).join(" · ")}</span>
              <span style={{ whiteSpace: "pre-wrap" }}>{a.descripcion}</span>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

/** Avisos plegados en una línea ámbar: «2 avisos · el primero»; al tocarla se abren con su acción. */
function AvisosDelAsunto({ avisos, alAccionar }: { avisos: readonly AvisoAsunto[]; alAccionar: (clave: AvisoAsunto["clave"]) => void }) {
  const [abierto, setAbierto] = useState(false);
  if (!avisos.length) return null;
  const resumen = `${avisos.length === 1 ? "1 aviso" : `${avisos.length} avisos`} · ${avisos[0]?.texto ?? ""}`;
  return (
    <section aria-label="Avisos del asunto" style={{ margin: "8px 0", border: "1px solid var(--warning)", borderRadius: "var(--r-md)", background: "var(--warning-soft)" }}>
      <button type="button" aria-expanded={abierto} onClick={() => setAbierto((v) => !v)}
        style={{ display: "flex", width: "100%", minHeight: 44, alignItems: "center", justifyContent: "space-between", gap: 8, padding: "0 12px", border: 0, background: "none", color: "var(--warning)", font: "inherit", fontWeight: 600, textAlign: "left", cursor: "pointer" }}>
        <span>{resumen}</span><span aria-hidden="true">{abierto ? "Ocultar" : "Ver"}</span>
      </button>
      {abierto ? (
        <ul style={{ listStyle: "none", margin: 0, padding: "0 12px 8px", display: "grid", gap: 4 }}>
          {avisos.map((a) => (
            <li key={a.clave} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, minHeight: 44, color: "var(--ink)" }}>
              <span>{a.texto}</span>
              {a.accion ? <Boton variante="texto" onClick={() => alAccionar(a.clave)}>{a.accion}</Boton> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

/** Fecha objetivo del asunto (firma, entrega o lo que el asesor se proponga): se cambia aquí, con Deshacer. */
function FechaObjetivo({ expediente, ocupado, alCambiar }: { expediente: Expediente; ocupado: boolean; alCambiar: PedirCambio }) {
  const [hoy] = useState(() => new Date());
  const actual = expediente.fecha_objetivo ? expediente.fecha_objetivo.slice(0, 10) : null;
  return (
    <div style={{ marginTop: 12 }}>
      <DesplegableFecha etiqueta="Fecha objetivo" valor={actual} hoy={hoy} sinFecha="Sin fecha"
        alElegir={(f) => {
          if (f === actual || ocupado) return;
          void alCambiar((e) => cambiarFechaObjetivo(e, f), f ? `Fecha objetivo: ${diaLargo(f)}` : "Sin fecha objetivo", (e) => cambiarFechaObjetivo(e, actual));
        }} />
    </div>
  );
}
