import type { Metadata } from "next";

import { MarcoAsuntos } from "@/components/panel/asunto/marco";

/** Título de la pestaña del navegador (el lector de pantalla lo anuncia al cambiar de pantalla). */
export const metadata: Metadata = { title: "Asuntos" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <MarcoAsuntos>{children}</MarcoAsuntos>;
}
