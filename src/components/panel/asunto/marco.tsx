"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import "./asunto.css";
import { ListaAsuntos } from "./lista";
import { ProveedorAsuntos } from "./proveedor";

/** Asuntos en dos columnas (boceto): la lista a la izquierda y el asunto abierto a la derecha. En el teléfono, una a la vez. */
export function MarcoAsuntos({ children }: { children: ReactNode }) {
  const ruta = usePathname();
  const conAsunto = ruta.startsWith("/panel/asuntos/");
  return (
    <ProveedorAsuntos>
      <div className="as-dos" data-det={conAsunto}>
        <section className="as-lista" aria-label="Lista de asuntos"><ListaAsuntos /></section>
        <section className="as-det" aria-label="Asunto">{children}</section>
      </div>
    </ProveedorAsuntos>
  );
}
