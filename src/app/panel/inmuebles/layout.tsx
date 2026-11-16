import type { Metadata } from "next";

/** Título de la pestaña del navegador (el lector de pantalla lo anuncia al cambiar de pantalla). */
export const metadata: Metadata = { title: "Inmuebles" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
