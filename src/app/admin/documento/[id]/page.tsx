"use client";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { CapturaPorPreguntas } from "@/components/panel/documento/captura";

/** Un formato por preguntas, en su propia ventana. `?volver=` regresa a donde se abrió (el asunto o Herramientas). */
function Ventana() {
  const { id } = useParams<{ id: string }>();
  const volver = useSearchParams().get("volver");
  return <CapturaPorPreguntas key={id} id={id} volver={volver} />;
}

/** useSearchParams pide un límite de Suspense. */
export default function Pagina() {
  return <Suspense fallback={null}><Ventana /></Suspense>;
}
