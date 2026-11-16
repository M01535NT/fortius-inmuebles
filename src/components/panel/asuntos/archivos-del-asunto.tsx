"use client";
import { useEffect, useRef, useState } from "react";

import { Boton } from "@/components/panel/kit/boton";
import { Desplegable } from "@/components/panel/kit/desplegable";
import { Cargando, EstadoError } from "@/components/panel/kit/estados";
import { diaLargo } from "@/lib/panel/calendario";
import { guardarEnAsunto, subirATemporal } from "@/lib/panel/datos/bandeja-acciones";
import { leerArchivosDelCliente, rutaArchivoDelCliente, type ArchivoDelCliente } from "@/lib/panel/datos/formatos-adjuntos";

const LIMITE = 20 * 1024 * 1024;

/**
 * Archivos que entregó el cliente, guardados en el asunto (DECISIONES, Asuntos, punto 8): se ven, se abren y se sube uno nuevo
 * diciendo qué documento es. Al subirlo, ese documento pasa a «Recibido» (con Deshacer, lo hace la página).
 * Usa las mismas rutas que la Bandeja: carga temporal privada y luego el repositorio del asunto.
 */
export function ArchivosDelAsunto({ expedienteId, documentos, alSubir }: {
  expedienteId: string;
  documentos: readonly { clave: string; nombre: string }[];
  alSubir: (clave: string | null) => void;
}) {
  const [archivos, setArchivos] = useState<ArchivoDelCliente[] | null>(null);
  const [error, setError] = useState("");
  const [intento, setIntento] = useState(0);
  const [es, setEs] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [aviso, setAviso] = useState("");
  const entrada = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const ctl = new AbortController();
    leerArchivosDelCliente(expedienteId, ctl.signal)
      .then((a) => { setArchivos(a); setError(""); })
      .catch((e: unknown) => { if (!ctl.signal.aborted) setError(e instanceof Error ? e.message : "No se pudieron leer los archivos."); });
    return () => ctl.abort();
  }, [expedienteId, intento]);

  const opciones = [...documentos.map((d) => ({ valor: d.clave, etiqueta: d.nombre })), { valor: "otro", etiqueta: "Otro documento" }];

  const subir = async (f: File) => {
    if (f.size > LIMITE) { setAviso("El archivo pasa de 20 MB."); return; }
    setSubiendo(true);
    setAviso("");
    try {
      const carga = await subirATemporal(f);
      const doc = documentos.find((d) => d.clave === es);
      await guardarEnAsunto(expedienteId, carga, (doc?.nombre ?? f.name.replace(/\.[^.]+$/, "")).slice(0, 160));
      setIntento((n) => n + 1);
      alSubir(doc ? doc.clave : null);
      setEs("");
    } catch (e) {
      setAviso(e instanceof Error ? e.message : "No se pudo subir. Vuelve a intentarlo.");
    } finally {
      setSubiendo(false);
      if (entrada.current) entrada.current.value = "";
    }
  };

  return (
    <section aria-label="Archivos del cliente" style={{ display: "grid", gap: 12, marginTop: 16 }}>
      <h3 className="pn-grupo" style={{ margin: 0 }}>Archivos del cliente</h3>
      {error ? <EstadoError texto={error} alReintentar={() => { setError(""); setArchivos(null); setIntento((n) => n + 1); }} />
        : archivos === null ? <Cargando lineas={2} etiqueta="Cargando archivos" />
        : archivos.length === 0 ? <p className="pn-sub" style={{ margin: 0 }}>Todavía no hay archivos del cliente en este asunto.</p>
        : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 4 }}>
            {archivos.map((a) => (
              <li key={a.id}>
                <a href={rutaArchivoDelCliente(a.id)} target="_blank" rel="noopener"
                  style={{ display: "flex", justifyContent: "space-between", gap: 12, minHeight: 44, alignItems: "center", padding: "0 8px", borderRadius: 4, color: "var(--ink)", textDecoration: "none" }}>
                  <span style={{ overflowWrap: "anywhere" }}>{a.titulo || a.nombre_original}</span>
                  <span className="pn-sub" style={{ margin: 0, whiteSpace: "nowrap" }}>{diaLargo(a.created_at.slice(0, 10))}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      <div style={{ display: "grid", gap: 8 }}>
        <Desplegable etiqueta="Subir archivo de" valor={es} vacio="Elige qué documento es" opciones={opciones} alElegir={setEs} />
        <input ref={entrada} type="file" accept="application/pdf,image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void subir(f); }} />
        <div><Boton variante="secundario" deshabilitado={!es || subiendo} onClick={() => entrada.current?.click()}>{subiendo ? "Subiendo…" : "Elegir archivo"}</Boton></div>
        {aviso ? <p role="alert" className="pn-sub" style={{ margin: 0, color: "var(--error)" }}>{aviso}</p> : null}
      </div>
    </section>
  );
}
