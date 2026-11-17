import type { Metadata } from "next";
import { Suspense } from "react";

import { PantallaConsulta } from "@/components/panel/consulta/consulta";

/** Título de la pestaña del navegador (el lector de pantalla lo anuncia al cambiar de pantalla). */
export const metadata: Metadata = { title: "Consulta" };

export default function Consulta() {
  return (
    <Suspense>
      <PantallaConsulta />
    </Suspense>
  );
}
