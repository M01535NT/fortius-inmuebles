"use client";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { useColeccion } from "@/components/panel/datos/use-coleccion";
import { CapturaFormato } from "@/components/panel/formatos/captura";
import type { Property } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import { aTexto } from "@/lib/panel/calendario";
import { filasAsuntos, type Expediente } from "@/lib/panel/datos/asuntos";
import { leerExpedientes } from "@/lib/panel/datos/colecciones";
import { leerDocumento } from "@/lib/panel/datos/formatos-acciones";

/**
 * Ventana de captura de un formato (PN-06): ocupa toda la pantalla; el folio y el nombre del asunto vienen de su expediente.
 * `?volver=<ruta del panel>` hace que la X regrese ahí (por ejemplo, al asunto desde donde se abrió).
 */
function VentanaFormato() {
  const { id } = useParams<{ id: string }>();
  const volver = useSearchParams().get("volver");
  const personas = useColeccion<Cliente>("clientes");
  const inmuebles = useColeccion<Property>("propiedades");
  const [exp, setExp] = useState<Expediente | null>(null);
  const [hoy] = useState(() => aTexto(new Date()));

  useEffect(() => {
    const c = new AbortController();
    Promise.all([leerDocumento(id, c.signal), leerExpedientes<Expediente>(c.signal)]).then(
      ([{ documento }, es]) => setExp(es.find((e) => e.id === documento.expediente_id) ?? null),
      () => { /* sin el asunto, la ventana abre igual; su error lo muestra la captura */ },
    );
    return () => c.abort();
  }, [id]);

  const asunto = useMemo(() => (exp ? filasAsuntos([exp], { personas: personas.datos, inmuebles: inmuebles.datos, tareas: [], hoy })[0]?.titulo : undefined), [exp, personas.datos, inmuebles.datos, hoy]);
  return <CapturaFormato id={id} folio={exp?.folio ?? ""} asunto={asunto} volver={volver} />;
}

/** useSearchParams pide un límite de Suspense. */
export default function Pagina() {
  return <Suspense><VentanaFormato /></Suspense>;
}
