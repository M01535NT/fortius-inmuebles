"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

import { asuntosDe, NOMBRE_ESTADO_ASUNTO, type Expediente } from "@/lib/panel/datos/asuntos";
import { leerExpedientes } from "@/lib/panel/datos/colecciones";

/** «Sus asuntos» en la ficha de una persona o de un inmueble: cada uno abre el asunto. Si no se pueden leer, no estorba. */
export function AsuntosDe({ clienteId, slug }: { clienteId?: string | null; slug?: string | null }) {
  const [lista, setLista] = useState<ReturnType<typeof asuntosDe> | null>(null);
  useEffect(() => {
    const ctl = new AbortController();
    leerExpedientes<Expediente>(ctl.signal).then((e) => setLista(asuntosDe(e, { clienteId, slug }))).catch(() => { if (!ctl.signal.aborted) setLista([]); });
    return () => ctl.abort();
  }, [clienteId, slug]);
  if (!lista || lista.length === 0) return null;
  return (
    <section aria-label="Sus asuntos" style={{ display: "grid", gap: 4, marginTop: 16 }}>
      <h3 className="pn-grupo" style={{ margin: "0 0 4px" }}>Sus asuntos</h3>
      {lista.map((a) => (
        <Link key={a.id} href={`/panel/asuntos?ver=${encodeURIComponent(a.id)}`}
          style={{ display: "flex", justifyContent: "space-between", gap: 12, minHeight: 44, alignItems: "center", padding: "0 8px", borderRadius: 4, color: "var(--ink)", textDecoration: "none" }}>
          <span>{a.texto}</span>
          <span className="pn-sub" style={{ margin: 0 }}>{NOMBRE_ESTADO_ASUNTO[a.estado]}</span>
        </Link>
      ))}
    </section>
  );
}
