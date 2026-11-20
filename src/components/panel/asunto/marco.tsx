"use client";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { usePreferencia } from "@/components/panel/almacen";
import { useSession } from "@/lib/panel/legado/sesion";

import "./asunto.css";
import "./caso.css";
import "./vistas.css";
import { LISTA_JUNTO } from "./detalle";
import { LeerDe, ProveedorFiltros, VISTA_ASUNTOS, vistaDe } from "./filtros";
import { ListaAsuntos } from "./lista";
import { ProveedorAsuntos } from "./proveedor";
import { VistaAmplia } from "./vistas";

/**
 * Asuntos (modelo visual). En «Lista», dos columnas: la lista a la izquierda y el asunto abierto a la derecha; en el
 * teléfono, una a la vez. En «Tablero» y «Tiempo» los asuntos ocupan todo el ancho; al abrir uno vuelve la lista junto a él.
 * El botón de lista de la barra del asunto oculta la lista y la vuelve a mostrar; el panel recuerda lo que cada quien elige.
 */
export function MarcoAsuntos({ children }: { children: ReactNode }) {
  const ruta = usePathname();
  const conAsunto = ruta.startsWith("/admin/asuntos/");
  const [lista] = usePreferencia(LISTA_JUNTO, "si");
  const [guardada] = usePreferencia(VISTA_ASUNTOS, "lista");
  const director = useSession()?.role === "admin";
  const vista = vistaDe(guardada);
  return (
    <ProveedorAsuntos>
      <ProveedorFiltros>
        {director ? <Suspense fallback={null}><LeerDe /></Suspense> : null}
        {!conAsunto && vista !== "lista" ? (
          <section className="as-vista" aria-label="Asuntos"><VistaAmplia vista={vista} /></section>
        ) : (
          <div className="as-dos" data-det={conAsunto} data-lista={lista}>
            <section className="as-lista" aria-label="Lista de asuntos"><ListaAsuntos /></section>
            <section className="as-det" aria-label="Asunto">{children}</section>
          </div>
        )}
      </ProveedorFiltros>
    </ProveedorAsuntos>
  );
}
