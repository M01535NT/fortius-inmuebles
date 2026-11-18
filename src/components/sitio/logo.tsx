import * as React from "react";

import { LOGO_COLORES, logoLema, logoPalabra, type Trazo } from "@/components/sitio/logo-trazos";

type Props = {
  /** Agrega el lema REAL ESTATE & INVESTMENTS bajo la palabra. La cabecera y el pie van sin él. */
  leyenda?: boolean;
  /**
   * Versión del logo. «auto» sigue el tema (clara en claro; oscura en oscuro y en bandas oscuras);
   * «claro» es la versión para fondo claro y «oscuro» la de fotos, videos y fondos oscuros.
   */
  tono?: "auto" | "claro" | "oscuro";
  className?: string;
};

/*
  Logo del sitio público, del sistema de diseño (docs/sistema-diseno/logos, 17/11/2026).
  Solo existen sus dos versiones: clara (azul real con el lado derecho del emblema en rojo imperial)
  y oscura (plata con ese lado en oro). Sus colores no se cambian. En «auto», sitio.css elige la
  versión según el tema con --s-logo-principal y --s-logo-lado.
  No reemplaza a BrandMark, que siguen usando el panel y los documentos.
*/
export function SitioLogo({ leyenda = false, tono = "auto", className }: Props) {
  // En «auto» el color va por CSS (las variables cambian con el tema); en las versiones fijas, como atributo.
  const pintar = (trazo: Trazo, i: number) => tono === "auto"
    ? <path key={i} d={trazo.d} transform={trazo.t} style={{ fill: trazo.lado ? "var(--s-logo-lado)" : "var(--s-logo-principal)" }} />
    : <path key={i} d={trazo.d} transform={trazo.t} fill={trazo.lado ? LOGO_COLORES[tono].lado : LOGO_COLORES[tono].principal} />;
  return (
    <span role="img" aria-label="Fortius Inmuebles" className={className ? `s-logo ${className}` : "s-logo"}>
      <svg aria-hidden="true" focusable="false" viewBox={leyenda ? "-4 -4 1275 324" : "-4 -4 1275 240"}>
        {logoPalabra.map(pintar)}
        {leyenda ? logoLema.map(pintar) : null}
      </svg>
    </span>
  );
}
