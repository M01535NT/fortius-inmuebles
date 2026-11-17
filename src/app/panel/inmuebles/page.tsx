import { Suspense } from "react";

import { ListaInmuebles } from "@/components/panel/inmueble/lista";

/** Inmuebles del panel nuevo (etapa 4). `useSearchParams` (la ficha abierta) pide un límite de Suspense. */
export default function PaginaInmuebles() {
  return <Suspense fallback={null}><ListaInmuebles /></Suspense>;
}
