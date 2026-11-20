"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Boton } from "@/components/panel/kit/boton";
import { Desplegable } from "@/components/panel/kit/desplegable";
import { Cargando, EstadoError } from "@/components/panel/kit/estados";
import { diaLargo } from "@/lib/panel/calendario";
import { pedir } from "@/lib/panel/datos/colecciones";
import { opcionesCrearDocumento, tiposLevantamiento, tituloFormato } from "@/lib/panel/datos/formatos";
import { crearDocumento } from "@/lib/panel/datos/formatos-acciones";

type DocDelAsunto = { id: string; formato_id: string; updated_at: string };

/**
 * Documentos hechos en Fortius dentro del asunto (DECISIONES, Asuntos, punto 8): la lista de sus formatos y «Crear documento»,
 * que abre el formato en su ventana con el folio y los datos del asunto ya llenos por el servidor.
 */
export function FormatosDelAsunto({ expedienteId, operacion }: { expedienteId: string; operacion: string }) {
  const router = useRouter();
  const [docs, setDocs] = useState<DocDelAsunto[] | null>(null);
  const [error, setError] = useState("");
  const [intento, setIntento] = useState(0);
  const [elegido, setElegido] = useState("");
  const [tipo, setTipo] = useState("");
  const [creando, setCreando] = useState(false);
  const [aviso, setAviso] = useState("");
  const opciones = useMemo(() => opcionesCrearDocumento(operacion), [operacion]);
  const tipos = useMemo(() => tiposLevantamiento(), []);
  const formatoId = elegido === "04" ? tipo : elegido;

  useEffect(() => {
    const ctl = new AbortController();
    pedir<DocDelAsunto[]>(`/api/admin/expedientes/${encodeURIComponent(expedienteId)}/formatos`, { method: "GET", signal: ctl.signal }, "documentos")
      .then((d) => { setDocs(d); setError(""); })
      .catch((e: unknown) => { if (!ctl.signal.aborted) setError(e instanceof Error ? e.message : "No se pudieron leer los documentos."); });
    return () => ctl.abort();
  }, [expedienteId, intento]);

  const crear = async () => {
    if (!formatoId || creando) return;
    setCreando(true);
    setAviso("");
    try {
      const d = await crearDocumento(expedienteId, formatoId);
      router.push(`/admin/formatos/${d.id}`);
    } catch (e) {
      setAviso(e instanceof Error ? e.message : "No se pudo crear. Vuelve a intentarlo.");
      setCreando(false);
    }
  };

  return (
    <section aria-label="Hechos en Fortius" style={{ display: "grid", gap: 12, marginTop: 16 }}>
      <h3 className="pn-grupo" style={{ margin: 0 }}>Hechos en Fortius</h3>
      {error ? <EstadoError texto={error} alReintentar={() => { setError(""); setDocs(null); setIntento((n) => n + 1); }} />
        : docs === null ? <Cargando lineas={2} etiqueta="Cargando documentos" />
        : docs.length === 0 ? <p className="pn-sub" style={{ margin: 0 }}>Todavía no hay documentos hechos en este asunto.</p>
        : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 4 }}>
            {docs.map((d) => (
              <li key={d.id}>
                <Link href={`/admin/formatos/${d.id}`} style={{ display: "flex", justifyContent: "space-between", gap: 12, minHeight: 44, alignItems: "center", padding: "0 8px", borderRadius: 4, color: "var(--ink)", textDecoration: "none" }}>
                  <span>{d.formato_id} · {tituloFormato(d.formato_id)}</span>
                  <span className="pn-sub" style={{ margin: 0, whiteSpace: "nowrap" }}>{diaLargo(d.updated_at.slice(0, 10))}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      <div style={{ display: "grid", gap: 8 }}>
        <Desplegable etiqueta="Crear documento" valor={elegido} vacio="Elige el formato" opciones={opciones} alElegir={(v) => { setElegido(v); setTipo(""); }} />
        {elegido === "04" ? <Desplegable etiqueta="Tipo de inmueble" valor={tipo} vacio="Elige el tipo" opciones={tipos} alElegir={setTipo} /> : null}
        <div><Boton variante="secundario" deshabilitado={!formatoId || creando} onClick={() => void crear()}>{creando ? "Abriendo…" : "Crear y abrir"}</Boton></div>
        {aviso ? <p role="alert" className="pn-sub" style={{ margin: 0, color: "var(--error)" }}>{aviso}</p> : null}
      </div>
    </section>
  );
}
