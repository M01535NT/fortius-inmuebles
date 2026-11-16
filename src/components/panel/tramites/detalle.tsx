"use client";
import { useEffect, useRef, useState } from "react";

import { useColeccion } from "@/components/panel/datos/use-coleccion";
import { Boton } from "@/components/panel/kit/boton";
import { Campo } from "@/components/panel/kit/campo";
import { DesplegableFecha } from "@/components/panel/kit/desplegable";
import { Checkbox } from "@/components/panel/ui/checkbox";
import { Switch } from "@/components/panel/ui/switch";
import type { Cliente } from "@/lib/backend/contracts";
import type { Archivo } from "@/lib/domain/records";
import { aTexto, diaLargo } from "@/lib/panel/calendario";
import { enlaceWhatsApp } from "@/lib/panel/datos/consultas";
import { esPendienteFecha, fechaDePendiente, historialTramite, nombreAutor, notasInternas, type CuentaEquipo } from "@/lib/panel/datos/tramites";
import type { Asesor } from "@/lib/domain/records";
import { documentoDelPaso, faltanParaCerrar, pasosDe, TOTAL_PASOS, textoDelAvance, type Tramite } from "@/lib/tramites";

export type AccionesTramite = {
  alCerrarPaso: () => void;
  alSubir: (archivos: File[], pasoClave: string) => Promise<void>;
  alAbrirDocumento: (a: Archivo) => void;
  alEsperar: (quien: string, volver: string) => Promise<boolean>;
  alResponder: (respuesta: string) => Promise<boolean>;
  alAnotar: (texto: string) => Promise<boolean>;
  alPagar: (pagoId: string) => void;
  alPendiente: (pendienteId: string) => void;
  alFechaPendiente: (pendienteId: string, fecha: string) => void;
};

const fecha = (iso?: string) => (iso ? diaLargo(aTexto(new Date(iso))) : "");

/**
 * Un trámite (boceto «Trámites»): un solo checklist con todos los pasos. El actual trae qué hacer, sus pendientes, el documento,
 * «Cerrar el paso» (se activa al completarlos) y «Poner en espera». Debajo: documentos, pagos, avance al propietario, notas e historial.
 */
export function DetalleTramite({ t, persona, documentos, ocupado, firma, ...a }: {
  t: Tramite; persona: Cliente | null; documentos: Archivo[]; ocupado: boolean; firma: string;
} & AccionesTramite) {
  const pasos = pasosDe(t.acreedor);
  const terminado = t.pasoActual >= TOTAL_PASOS || t.estado !== "en_curso";
  const faltan = terminado ? [] : faltanParaCerrar(t, documentos);
  const [hoy] = useState(() => new Date());
  return (
    <div style={{ display: "grid", gap: 20, marginTop: 8 }}>
      {t.espera ? <Espera t={t} hoy={aTexto(hoy)} ocupado={ocupado} alResponder={a.alResponder} /> : null}
      <ol aria-label="Pasos" style={{ listStyle: "none", margin: 0, padding: 0, border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--card)" }}>
        {pasos.map((p, i) => {
          const listo = i < t.pasoActual;
          const actual = i === t.pasoActual && !terminado;
          const doc = documentoDelPaso(t.acreedor, p.clave);
          const tieneDoc = documentos.some((d) => d.pasoClave === p.clave);
          return (
            <li key={p.clave} aria-current={actual ? "step" : undefined} style={{ padding: "12px 14px", borderTop: i ? "1px solid var(--border)" : 0, display: "grid", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
                <span style={{ fontWeight: actual ? 600 : 500, color: listo || actual ? "var(--ink)" : "var(--ink-muted)" }}>{i + 1}. {p.nombre}</span>
                <span style={{ fontSize: 13, color: listo ? "var(--ink-muted)" : actual ? "var(--accent)" : "var(--ink-muted)", whiteSpace: "nowrap" }}>
                  {listo ? `Listo${t.pasos[i].cerradoEl ? ` · ${fecha(t.pasos[i].cerradoEl)}` : ""}` : actual ? "Ahora" : ""}
                </span>
              </div>
              {actual ? (
                <>
                  <p style={{ margin: 0, color: "var(--ink-muted)", fontSize: 14 }}>{p.ayuda}</p>
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
                    {doc ? <SubirDocumento nombre={doc} listo={tieneDoc} ocupado={ocupado} alSubir={(f) => a.alSubir(f, p.clave)} /> : null}
                  </div>
                  {faltan.length ? <p style={{ margin: 0, fontSize: 13, color: "var(--ink-muted)" }}>Faltan {faltan.length} de {t.pasos[i].pendientes.length + (doc ? 1 : 0)} para cerrar el paso.</p> : null}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Boton deshabilitado={ocupado || faltan.length > 0} onClick={a.alCerrarPaso}>Cerrar el paso</Boton>
                    {!t.espera ? <PonerEnEspera hoy={hoy} ocupado={ocupado} alEsperar={a.alEsperar} /> : null}
                  </div>
                </>
              ) : null}
            </li>
          );
        })}
      </ol>
      {terminado && t.estado === "terminado" ? <p style={{ margin: 0, fontWeight: 500 }}>Trámite terminado: la hipoteca quedó cancelada.</p> : null}

      <section>
        <h3 className="pn-grupo">Documentos</h3>
        {documentos.length ? (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 4 }}>
            {documentos.map((d) => (
              <li key={d.id}>
                <button type="button" className="pn-btn pn-btn-texto" style={{ justifyContent: "flex-start", textAlign: "left" }} onClick={() => a.alAbrirDocumento(d)}>
                  {d.nombre}{d.pasoClave ? ` · ${pasos.find((p) => p.clave === d.pasoClave)?.nombre ?? ""}` : ""}
                </button>
              </li>
            ))}
          </ul>
        ) : <p style={{ margin: 0, color: "var(--ink-muted)" }}>Sin documentos todavía.</p>}
      </section>

      {t.pagos.length ? (
        <section>
          <h3 className="pn-grupo">Pagos del propietario</h3>
          <div style={{ display: "grid", gap: 2 }}>
            {t.pagos.map((p) => (
              <label key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 44, cursor: "pointer" }}>
                <Checkbox checked={p.estado === "pagado"} disabled={ocupado} onCheckedChange={() => a.alPagar(p.id)} />
                <span style={{ flex: 1 }}>{p.concepto}</span>
                {p.monto !== undefined ? <span style={{ fontVariantNumeric: "tabular-nums", color: "var(--ink-muted)" }}>${p.monto.toLocaleString("es-MX")}</span> : null}
              </label>
            ))}
          </div>
          <p className="pn-campo-ayuda" style={{ margin: "4px 0 0" }}>Montos de referencia del Registro Público de BC (octubre de 2026).</p>
        </section>
      ) : null}

      <Avance t={t} persona={persona} firma={firma} />
      <Notas t={t} ocupado={ocupado} alAnotar={a.alAnotar} />
    </div>
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

function PonerEnEspera({ hoy, ocupado, alEsperar }: { hoy: Date; ocupado: boolean; alEsperar: (quien: string, volver: string) => Promise<boolean> }) {
  const [abierto, setAbierto] = useState(false);
  const [quien, setQuien] = useState("");
  const [volver, setVolver] = useState<string | null>(null);
  if (!abierto) return <Boton variante="secundario" onClick={() => setAbierto(true)}>Poner en espera</Boton>;
  return (
    <div style={{ display: "grid", gap: 10, width: "100%", marginTop: 4 }}>
      <Campo etiqueta="¿A quién esperas?" placeholder="Registro Público, banco, notaría…" maxLength={120} value={quien} onChange={(e) => setQuien(e.target.value)} autoFocus />
      <DesplegableFecha etiqueta="Vuelves a preguntar" valor={volver} alElegir={setVolver} hoy={hoy} sinFecha={null} etiquetaCalendario="Vuelves a preguntar el" />
      <div style={{ display: "flex", gap: 8 }}>
        <Boton variante="secundario" deshabilitado={ocupado || !quien.trim() || !volver} onClick={() => { if (volver) void alEsperar(quien, volver).then((ok) => { if (ok) setAbierto(false); }); }}>Guardar espera</Boton>
        <Boton variante="texto" onClick={() => setAbierto(false)}>Cancelar</Boton>
      </div>
    </div>
  );
}

function Espera({ t, hoy, ocupado, alResponder }: { t: Tramite; hoy: string; ocupado: boolean; alResponder: (r: string) => Promise<boolean> }) {
  const [abierto, setAbierto] = useState(false);
  const [respuesta, setRespuesta] = useState("");
  if (!t.espera) return null;
  const toca = t.espera.volver <= hoy;
  return (
    <section style={{ display: "grid", gap: 8, padding: 12, border: `1px solid ${toca ? "var(--warning)" : "var(--border)"}`, borderRadius: "var(--r-lg)", background: toca ? "var(--warning-soft)" : undefined }}>
      <p style={{ margin: 0 }}>Esperando a <b>{t.espera.quien}</b> desde el {diaLargo(t.espera.desde)}. {toca ? "Hoy toca preguntar." : `Vuelves a preguntar el ${diaLargo(t.espera.volver)}.`}</p>
      {abierto ? (
        <>
          <Campo etiqueta="¿Qué respondieron? (opcional)" maxLength={500} value={respuesta} onChange={(e) => setRespuesta(e.target.value)} autoFocus />
          <div style={{ display: "flex", gap: 8 }}>
            <Boton variante="secundario" deshabilitado={ocupado} onClick={() => void alResponder(respuesta).then((ok) => { if (ok) setAbierto(false); })}>Guardar respuesta</Boton>
            <Boton variante="texto" onClick={() => setAbierto(false)}>Cancelar</Boton>
          </div>
        </>
      ) : <div><Boton variante="secundario" onClick={() => setAbierto(true)}>Ya respondieron</Boton></div>}
    </section>
  );
}

const PARTES = [
  { clave: "listo", etiqueta: "Lo que ya está listo" },
  { clave: "sigue", etiqueta: "Lo que sigue" },
  { clave: "necesita", etiqueta: "Lo que necesitamos de su parte" },
  { clave: "pagos", etiqueta: "Pagos" },
] as const;

/** «Avance al propietario»: arma el mensaje sin notas internas; el asesor lo envía. */
function Avance({ t, persona, firma }: { t: Tramite; persona: Cliente | null; firma: string }) {
  const [abierto, setAbierto] = useState(false);
  const [partes, setPartes] = useState({ listo: true, sigue: true, necesita: true, pagos: false });
  const [copiado, setCopiado] = useState(false);
  const nombre = persona?.nombre?.split(" ")[0] ?? "propietario";
  const texto = textoDelAvance(t, partes, nombre, firma);
  const wa = persona?.telefono ? enlaceWhatsApp(persona.telefono, texto) : null;
  if (!abierto) return <div><Boton variante="secundario" onClick={() => setAbierto(true)}>Avance al propietario</Boton></div>;
  return (
    <section style={{ display: "grid", gap: 10, padding: 12, border: "1px solid var(--border)", borderRadius: "var(--r-lg)" }}>
      <h3 className="pn-grupo" style={{ margin: 0, padding: 0 }}>Avance al propietario</h3>
      {PARTES.map((p) => (
        <div key={p.clave} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, minHeight: 44 }}>
          <span>{p.etiqueta}</span>
          <Switch checked={partes[p.clave]} onCheckedChange={(c) => setPartes((s) => ({ ...s, [p.clave]: c }))} aria-label={p.etiqueta} />
        </div>
      ))}
      <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 14, padding: 12, background: "var(--muted)", borderRadius: "var(--r-md)" }}>{texto}</pre>
      <p className="pn-campo-ayuda" style={{ margin: 0 }}>No lleva notas internas. Lo envías tú; el panel no manda nada.</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {wa ? <a className="pn-btn pn-btn-primario" href={wa} target="_blank" rel="noopener noreferrer">Enviar por WhatsApp</a> : null}
        <Boton variante="secundario" onClick={() => { void navigator.clipboard?.writeText(texto).then(() => setCopiado(true)); }}>{copiado ? "Copiado" : "Copiar"}</Boton>
        <Boton variante="texto" onClick={() => setAbierto(false)}>Cerrar</Boton>
      </div>
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
function Notas({ t, ocupado, alAnotar }: { t: Tramite; ocupado: boolean; alAnotar: (texto: string) => Promise<boolean> }) {
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
        <p style={{ margin: 0, fontSize: 13, color: "var(--ink-muted)" }}>Solo las ve el equipo. Nunca salen en lo que se envía al cliente.</p>
        <div className="pn-campo">
          <label htmlFor={`nota-${t.id}`}>Nota nueva</label>
          <textarea id={`nota-${t.id}`} rows={3} maxLength={5000} value={nota} onChange={(e) => setNota(e.target.value)} />
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
        ) : <p style={{ margin: 0, color: "var(--ink-muted)" }}>Sin notas todavía.</p>}
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
