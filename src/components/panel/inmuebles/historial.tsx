"use client";
import { useEffect, useState, type ReactNode } from "react";

import { Icono } from "@/components/panel/icons";
import { Boton } from "@/components/panel/kit/boton";
import { cuandoEntrada, iconoEntrada, leerHistorialInmueble, type EntradaHistorial } from "@/lib/panel/datos/inmueble-historial";

type Estado = { clave: string; entradas: EntradaHistorial[]; pendiente: boolean; error: string };

/**
 * Historial del inmueble al final de Resumen: lo que el sistema anota solo («Publicar así» con sus avisos, publicar o
 * quitar del sitio, cambios de precio, dirección exacta). Solo se agrega. Si el servidor aún no lo tiene, lo dice sin romperse.
 * `recargar` cambia cada vez que se anota algo nuevo.
 */
export function HistorialInmueble({ slug, recargar }: { slug: string; recargar: number }) {
  const clave = `${slug}:${recargar}`;
  const [intento, setIntento] = useState(0);
  const [estado, setEstado] = useState<Estado>({ clave: "", entradas: [], pendiente: false, error: "" });
  useEffect(() => {
    const c = new AbortController();
    leerHistorialInmueble(slug, c.signal).then(
      (r) => setEstado({ clave, entradas: r.entradas, pendiente: r.pendiente, error: "" }),
      (e: unknown) => { if (!(e instanceof DOMException && e.name === "AbortError")) setEstado({ clave, entradas: [], pendiente: false, error: e instanceof Error ? e.message : "No se pudo leer el historial." }); },
    );
    return () => c.abort();
  }, [slug, clave, intento]);
  const vigente = estado.clave === clave;
  const caja = (hijos: ReactNode) => <div className="fx-tarjeta" style={{ padding: "14px 16px", fontSize: 14, color: "var(--ink-muted)" }}>{hijos}</div>;
  return (
    <section className="fx-seccion" aria-busy={!vigente || undefined}>
      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Historial</h3>
      {!vigente ? caja("Cargando…")
        : estado.pendiente ? caja("El historial del inmueble llega con la siguiente actualización del panel. Lo que guardas se queda guardado.")
        : estado.error ? caja(<span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>{estado.error}<Boton variante="texto" onClick={() => setIntento((n) => n + 1)}>Reintentar</Boton></span>)
        : !estado.entradas.length ? caja("Todavía no hay movimientos. Aquí quedan las publicaciones, los cambios de precio y lo que se retira del sitio.")
        : (
          <ol className="fx-tarjeta" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {estado.entradas.map((e) => (
              <li key={e.id} className="fx-drow" style={{ alignItems: "flex-start", padding: "10px 12px", gap: 10 }}>
                <span style={{ color: e.accion === "publicar_asi" ? "var(--warning)" : "var(--ink-muted)", display: "inline-flex", paddingTop: 2 }}><Icono nombre={iconoEntrada(e.accion)} tamano={18} /></span>
                <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0, flex: 1 }}>
                  <span className="fx-dv">{e.resumen}</span>
                  {e.detalle?.avisos?.length ? <span className="fx-dn">Pendiente al publicar: {e.detalle.avisos.join(" · ")}</span> : null}
                  <span className="fx-dk">{cuandoEntrada(e.creadoEl)}</span>
                </span>
              </li>
            ))}
          </ol>
        )}
    </section>
  );
}
