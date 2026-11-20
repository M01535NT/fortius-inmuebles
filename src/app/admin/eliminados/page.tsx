import type { Metadata } from "next";

import { Eliminados } from "@/components/panel/eliminados/eliminados";

/** Título de la pestaña del navegador (el lector de pantalla lo anuncia al cambiar de pantalla). */
export const metadata: Metadata = { title: "Eliminados" };

/** Eliminados: lo que se mandó a Eliminados en el panel, para verlo y recuperarlo. Se abre desde Configuración. */
export default function PaginaEliminados() {
  return <Eliminados />;
}
