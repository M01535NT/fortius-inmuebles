import Link from "next/link";
import { Suspense } from "react";

import { ConInmueble } from "@/components/panel/herramientas/con-inmueble";
import { Cargando } from "@/components/panel/kit/estados";
import { Gesto } from "@/components/panel/icons";

export default function Comision() {
  return (
    <div className="pn-pagina" style={{ maxWidth: 640 }}>
      <Link href="/panel/herramientas" className="pn-volver"><Gesto nombre="izquierda" tamano={16} />Herramientas</Link>
      <h1 className="pn-h1">Comisión</h1>
      <p className="pn-sub">Cuánto cobra Fortius y cuánto le queda al propietario.</p>
      <div style={{ marginTop: 24 }}><Suspense fallback={<Cargando lineas={3} etiqueta="Cargando" />}><ConInmueble cual="comision" /></Suspense></div>
    </div>
  );
}
