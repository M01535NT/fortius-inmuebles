import Link from "next/link";
import { Suspense } from "react";

import { ConInmueble } from "@/components/panel/herramientas/con-inmueble";
import { Cargando } from "@/components/panel/kit/estados";
import { Gesto } from "@/components/panel/icons";

export default function Credito() {
  return (
    <div className="pn-pagina" style={{ maxWidth: 640 }}>
      <Link href="/panel/herramientas" className="pn-volver"><Gesto nombre="izquierda" tamano={16} />Herramientas</Link>
      <h1 className="pn-h1">Crédito hipotecario</h1>
      <p className="pn-sub">Cuánto pagaría al mes el comprador.</p>
      <div style={{ marginTop: 24 }}><Suspense fallback={<Cargando lineas={3} etiqueta="Cargando" />}><ConInmueble cual="credito" /></Suspense></div>
    </div>
  );
}
