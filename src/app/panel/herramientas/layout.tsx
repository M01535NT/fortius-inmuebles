import type { Metadata } from "next";

import { MarcoHerramientas } from "@/components/panel/herramientas/marco";

/** Título de la pestaña del navegador (el lector de pantalla lo anuncia al cambiar de pantalla). */
export const metadata: Metadata = { title: "Herramientas" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <MarcoHerramientas>{children}</MarcoHerramientas>;
}
