"use client";
import { Suspense } from "react";

import { Cargando } from "@/components/panel/kit/estados";

import { ConInmueble, type Cual } from "./con-inmueble";
import { CatalogoFormatos, OpinionDeValor } from "./formatos";
import { CabeceraHerramienta } from "./marco";

const TITULOS: Record<Cual | "valor" | "formatos", string> = {
  valor: "Opinión de valor", isr: "Cálculo de ISR", compra: "Gastos del comprador", venta: "Gastos del vendedor",
  credito: "Crédito hipotecario", comision: "Comisión", formatos: "Contratos y formatos",
};

/** Una herramienta dentro del marco: barra, encabezado y su cuenta (con el inmueble de la dirección, si viene). */
export function PantallaHerramienta({ cual }: { cual: Cual | "valor" | "formatos" }) {
  return (
    <div className="cp fm-col her-col">
      <Suspense fallback={null}><CabeceraHerramienta titulo={TITULOS[cual]} ruta={`/panel/herramientas/${cual}`} /></Suspense>
      <Suspense fallback={<Cargando lineas={3} etiqueta="Cargando" />}>
        {cual === "valor" ? <OpinionDeValor /> : cual === "formatos" ? <CatalogoFormatos /> : <ConInmueble cual={cual} />}
      </Suspense>
    </div>
  );
}
