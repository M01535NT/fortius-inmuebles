import type { Metadata } from "next";

import { InventoryExplorer } from "@/components/property/inventory-explorer";
import { getPropiedades } from "@/lib/inventario";
import { filtrosDesdeParams, opcionesDe, parteDe, POR_PARTE, vistaDesdeParams } from "@/lib/inventario-busqueda";
import { pageMetadata } from "@/lib/seo/page-metadata";
import "./inventario.css";

export const metadata: Metadata = pageMetadata({
  path: "/inventario",
  title: "Propiedades en venta y renta en Tijuana",
  description:
    "Casas, departamentos, terrenos y locales en venta y renta en Tijuana, Rosarito, Tecate y Ensenada, con precio, superficies y condiciones de cada inmueble.",
});

/* El inventario publicado del panel MNT se consulta en cada solicitud. */
export const revalidate = 0;

type Busqueda = Promise<Record<string, string | string[] | undefined>>;

/* Inventario, Fortius II (etapa 2, 17/11/2026): la frase es el filtro. El servidor filtra con los
   datos de la dirección y entrega solo la primera parte; el resto llega con «Cargar más». */
export default async function InventarioPage({ searchParams }: { searchParams: Busqueda }) {
  const busqueda = await searchParams;
  const params = new URLSearchParams();
  for (const [clave, valor] of Object.entries(busqueda)) {
    const uno = Array.isArray(valor) ? valor[0] : valor;
    if (typeof uno === "string") params.set(clave, uno);
  }
  const filtros = filtrosDesdeParams(params);
  const vista = vistaDesdeParams(params);
  const todas = await getPropiedades();
  const parte = parteDe(todas, filtros, 0, POR_PARTE);

  return (
    <main className="inv2">
      {/* Una búsqueda nueva desde fuera (menú, pie, buscador) monta la página de cero. */}
      <InventoryExplorer key={params.toString()} opciones={opcionesDe(todas)} filtrosIniciales={filtros} vistaInicial={vista} parteInicial={parte} />
    </main>
  );
}
