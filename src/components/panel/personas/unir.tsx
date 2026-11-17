"use client";
import { useEffect, useMemo, useState } from "react";

import { useColeccion } from "@/components/panel/datos/use-coleccion";
import { Avatar } from "@/components/panel/fichas/piezas";
import { Icono } from "@/components/panel/icons";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Boton } from "@/components/panel/kit/boton";
import { Campo } from "@/components/panel/kit/campo";
import { Segmentado } from "@/components/panel/kit/segmentado";
import { HojaAdaptable } from "@/components/panel/ui/hoja-adaptable";
import { Switch } from "@/components/panel/ui/switch";
import type { Cliente } from "@/lib/backend/contracts";
import { normalizar } from "@/lib/panel/buscar";
import type { Expediente } from "@/lib/panel/datos/asuntos";
import { leerExpedientes } from "@/lib/panel/datos/colecciones";
import { estaArchivada } from "@/lib/panel/datos/personas-ficha";
import { filasUnion, posiblesDuplicados, unirPersonas, type Eleccion, type ResultadoUnion } from "@/lib/panel/datos/personas-unir";
import { telefonoLegible } from "@/lib/panel/datos/vistas";

type Props = {
  abierta: boolean;
  persona: Cliente;
  personas: Cliente[];
  versionDe?: (id: string) => number | null;
  alCerrar: () => void;
  /** Ya unidas: quien la usa recarga la lista y abre la que se quedó. */
  alUnido: (r: ResultadoUnion) => void;
};

/**
 * «Unir con un duplicado» (PN-03): se elige la otra ficha, cuál se queda y, cuando las dos tienen un dato distinto,
 * cuál se conserva. Antes de unir dice qué pasará; la base hace todo en una sola transacción y archiva la otra.
 */
export function HojaUnir(props: Props) {
  return (
    <HojaAdaptable abierta={props.abierta} titulo="Unir con un duplicado" descripcion="Junta dos fichas de la misma persona en una sola." alCerrar={props.alCerrar}>
      {props.abierta ? <FormUnir key={props.persona.id} {...props} /> : null}
    </HojaAdaptable>
  );
}

const nombreDe = (c: Cliente) => c.nombre?.trim() || "Sin nombre";
const oculto = (v: string) => `${v.slice(0, 2)}${"•".repeat(Math.max(0, v.length - 4))}${v.slice(-2)}`;
const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

function FormUnir({ persona, personas, versionDe, alUnido }: Props) {
  const { avisar } = useAvisos();
  const [otraId, setOtraId] = useState<string | null>(null);
  const [seQueda, setSeQueda] = useState<"esta" | "otra">("esta");
  const [eleccion, setEleccion] = useState<Eleccion>({});
  const [buscar, setBuscar] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const otra = otraId ? personas.find((x) => x.id === otraId) ?? null : null;

  const sugeridas = useMemo(() => posiblesDuplicados(persona, personas), [persona, personas]);
  const candidatas = useMemo(() => {
    const q = normalizar(buscar.trim());
    const resto = personas.filter((x) => x.id !== persona.id && !estaArchivada(x));
    if (!q) return sugeridas.slice(0, 8);
    const d = buscar.replace(/\D/g, "");
    return resto.filter((x) => normalizar([x.nombre, x.email].filter(Boolean).join(" ")).includes(q)
      || (d.length >= 3 && (x.telefono ?? "").replace(/\D/g, "").includes(d))).slice(0, 8);
  }, [buscar, personas, persona.id, sugeridas]);

  if (!otra) {
    return (
      <div style={{ display: "grid", gap: 12, marginTop: 8 }}>
        <Campo etiqueta="¿Con quién es la misma persona?" placeholder="Nombre, teléfono o correo" value={buscar} onChange={(e) => setBuscar(e.target.value)} autoComplete="off" />
        {!buscar.trim() && sugeridas.length ? <p className="fx-chico" style={{ margin: 0 }}>Se parecen por teléfono, correo o nombre:</p> : null}
        {candidatas.length ? (
          <div className="fx-tarjeta">
            {candidatas.map((x) => (
              <button key={x.id} type="button" className="fx-opt" onClick={() => { setOtraId(x.id); setEleccion({}); setSeQueda("esta"); }}>
                <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <Avatar nombre={nombreDe(x)} />
                  <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                    <b style={{ fontWeight: 600 }}>{nombreDe(x)}</b>
                    <span className="fx-h">{[telefonoLegible(x.telefono), x.email].filter(Boolean).join(" · ") || "Sin contacto"}</span>
                  </span>
                </span>
                <span className="fx-h">Elegir</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="fx-tarjeta" style={{ padding: "14px 16px", fontSize: 14, color: "var(--ink-muted)" }}>
            {buscar.trim() ? "Nadie coincide. Revisa cómo se escribe." : "No vemos otra ficha parecida. Búscala por su nombre o teléfono."}
          </div>
        )}
      </div>
    );
  }

  return <Comparar persona={persona} otra={otra} seQueda={seQueda} setSeQueda={setSeQueda} eleccion={eleccion} setEleccion={setEleccion}
    ocupado={ocupado} alCambiarOtra={() => setOtraId(null)} alUnir={async (queda, seVa) => {
      const vq = versionDe?.(queda.id) ?? null, vs = versionDe?.(seVa.id) ?? null;
      if (!vq || !vs) { avisar("Vuelve a abrir Personas y une desde ahí: falta saber qué versión de cada ficha viste."); return; }
      setOcupado(true);
      try {
        const r = await unirPersonas({ queda, otra: seVa, versionQueda: vq, versionOtra: vs, eleccion });
        alUnido(r);
      } catch (e) {
        avisar(e instanceof Error ? e.message : "No se pudo unir. Nada cambió.", { duracion: 8000 });
      } finally { setOcupado(false); }
    }} />;
}

function Comparar({ persona, otra, seQueda, setSeQueda, eleccion, setEleccion, ocupado, alCambiarOtra, alUnir }: {
  persona: Cliente; otra: Cliente; seQueda: "esta" | "otra"; setSeQueda: (v: "esta" | "otra") => void;
  eleccion: Eleccion; setEleccion: (e: Eleccion) => void; ocupado: boolean; alCambiarOtra: () => void;
  alUnir: (queda: Cliente, seVa: Cliente) => Promise<void>;
}) {
  const queda = seQueda === "esta" ? persona : otra;
  const seVa = seQueda === "esta" ? otra : persona;
  const filas = filasUnion(queda, seVa, eleccion);
  const leads = useColeccion<{ id: string; clienteId?: string }>("leads");
  const tareas = useColeccion<{ id: string; clienteId?: string; estado?: string }>("tareas");
  const eventos = useColeccion<{ id: string; clienteId?: string }>("eventos");
  const [asuntos, setAsuntos] = useState<number | null>(null);
  useEffect(() => {
    const c = new AbortController();
    leerExpedientes<Expediente>(c.signal).then((e) => setAsuntos(e.filter((x) => x.cliente_id === seVa.id).length), () => { if (!c.signal.aborted) setAsuntos(null); });
    return () => c.abort();
  }, [seVa.id]);
  const nConsultas = leads.datos.filter((x) => x.clienteId === seVa.id).length;
  const nTareas = tareas.datos.filter((x) => x.clienteId === seVa.id).length;
  const nCitas = eventos.datos.filter((x) => x.clienteId === seVa.id).length;
  const pasan = [
    asuntos === null ? "sus asuntos" : asuntos ? `${plural(asuntos, "asunto", "asuntos")} con sus documentos y formatos` : "",
    nConsultas ? plural(nConsultas, "consulta", "consultas") : "",
    nTareas ? plural(nTareas, "tarea", "tareas") : "",
    nCitas ? plural(nCitas, "cita", "citas") : "",
    "sus pendientes y trámites",
  ].filter(Boolean);
  const listaPasan = pasan.length > 1 ? `${pasan.slice(0, -1).join(", ")} y ${pasan[pasan.length - 1]}` : pasan[0];
  const nq = nombreDe(queda), ns = nombreDe(seVa);

  return (
    <div style={{ display: "grid", gap: 16, marginTop: 8 }}>
      <Segmentado etiqueta="¿Cuál ficha se queda?" valor={seQueda} alElegir={(v) => { setSeQueda(v); setEleccion({}); }}
        opciones={[{ valor: "esta", etiqueta: nombreDe(persona) }, { valor: "otra", etiqueta: nombreDe(otra) }]} />

      <section style={{ display: "grid", gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Datos que se conservan</h3>
        <div className="fx-tarjeta">
          {filas.map((f) => {
            const valor = f.de === "otra" ? f.otra : f.queda;
            const mostrar = valor ? (f.campo.secreto ? oculto(valor) : valor) : "";
            const id = `unir-${f.campo.clave}`;
            return (
              <div key={f.campo.clave} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderTop: "1px solid var(--border)", minHeight: 48 }}>
                <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>{f.campo.etiqueta}</span>
                  <span style={{ fontSize: 14, fontWeight: 500, overflowWrap: "anywhere" }}>{mostrar}</span>
                  <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>De {f.de === "otra" ? ns : nq}{f.choca ? ` · la otra dice ${f.campo.secreto ? oculto((f.de === "otra" ? f.queda : f.otra) ?? "") : (f.de === "otra" ? f.queda : f.otra)}` : ""}</span>
                </span>
                {f.choca ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minHeight: 44 }}>
                    <label htmlFor={id} style={{ fontSize: 13, color: "var(--ink-muted)", cursor: "pointer" }}>Usar el de {ns.split(/\s+/)[0]}</label>
                    <Switch id={id} checked={f.de === "otra"} disabled={ocupado}
                      onCheckedChange={(v) => setEleccion({ ...eleccion, [f.campo.clave]: v ? "otra" : "queda" })} />
                  </span>
                ) : null}
              </div>
            );
          })}
          {filas.length ? null : <p style={{ margin: 0, padding: "14px 16px", fontSize: 14, color: "var(--ink-muted)" }}>Ninguna de las dos tiene datos de contacto ni para contratos.</p>}
        </div>
      </section>

      <div role="note" className="fx-tarjeta" style={{ display: "flex", gap: 10, padding: "12px 14px", fontSize: 14, lineHeight: 1.45 }}>
        <span style={{ color: "var(--warning)", flex: "none", marginTop: 1 }}><Icono nombre="alerta" tamano={18} /></span>
        <span>
          Al unir, pasan a <b>{nq}</b> {listaPasan} de {ns}. Las notas de las dos se juntan.
          {" "}<b>{ns}</b> se archiva: sale de la lista y se ve en «Ver archivados». No se borra nada.
        </span>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Boton deshabilitado={ocupado} onClick={() => void alUnir(queda, seVa)}>{ocupado ? "Uniendo…" : `Unir en ${nq}`}</Boton>
        <Boton variante="secundario" deshabilitado={ocupado} onClick={alCambiarOtra}>Elegir otra ficha</Boton>
      </div>
    </div>
  );
}
