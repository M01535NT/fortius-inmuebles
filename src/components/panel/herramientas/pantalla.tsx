import { Suspense } from "react";

import { Cargando } from "@/components/panel/kit/estados";

import { ConInmueble } from "./con-inmueble";
import { CabeceraHerramienta } from "./marco";

/** Una calculadora dentro del marco de Herramientas: título y la cuenta (con el inmueble de la dirección, si viene). */
export function PantallaHerramienta({ cual }: { cual: "credito" | "comision" | "costos" }) {
  return (
    <div className="pn-her-cuerpo">
      <CabeceraHerramienta titulo={cual === "credito" ? "Crédito hipotecario" : cual === "comision" ? "Comisión" : "Costos de cierre"} />
      <Suspense fallback={<Cargando lineas={3} etiqueta="Cargando" />}><ConInmueble cual={cual} /></Suspense>
    </div>
  );
}
