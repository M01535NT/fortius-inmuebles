"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { usePreferencia } from "@/components/panel/almacen";

import "./asunto.css";
import "./caso.css";
import { LISTA_JUNTO } from "./detalle";
import { ListaAsuntos } from "./lista";
import { ProveedorAsuntos } from "./proveedor";

/**
 * Asuntos en dos columnas (boceto): la lista a la izquierda y el asunto abierto a la derecha. En el teléfono, una a la vez.
 * El botón de lista de la barra del asunto oculta la lista y la vuelve a mostrar; el panel recuerda lo que cada quien elige.
 */
export function MarcoAsuntos({ children }: { children: ReactNode }) {
  const ruta = usePathname();
  const conAsunto = ruta.startsWith("/panel/asuntos/");
  const [lista] = usePreferencia(LISTA_JUNTO, "si");
  return (
    <ProveedorAsuntos>
      <div className="as-dos" data-det={conAsunto} data-lista={lista}>
        <section className="as-lista" aria-label="Lista de asuntos"><ListaAsuntos /></section>
        <section className="as-det" aria-label="Asunto">{children}</section>
      </div>
    </ProveedorAsuntos>
  );
}
