import { Suspense } from "react";

import { Directorio } from "@/components/panel/personas/directorio";

/** Directorio del panel nuevo: cada persona una vez, con sus asuntos; la lista a la izquierda y su ficha a la derecha. */
export default function PaginaDirectorio() {
  return <Suspense fallback={null}><Directorio /></Suspense>;
}
