import * as React from "react";

import { logoAnillo, logoCortes, logoLeyenda, logoPalabra } from "@/components/sitio/logo-trazos";

type Props = {
  /** Agrega la leyenda bajo «FORTIUS». La cabecera y el pie van sin ella. */
  leyenda?: boolean;
  /**
   * Color de las letras. «auto» sigue el tema (tinta del sitio); «claro» es para fondo claro
   * y «oscuro» para bandas, fotos y videos, en cualquier tema.
   */
  tono?: "auto" | "claro" | "oscuro";
  className?: string;
};

const TINTA = { claro: "#18202A", oscuro: "#EDEDEF" } as const;

/**
  Logo del sitio público, Fortius II (17/11/2026). La O es siempre azul con su tramo ámbar;
  las letras toman el color del texto, así el mismo logo sirve en claro, en oscuro y sobre foto.
  No reemplaza a BrandMark, que siguen usando el panel y los documentos.
*/
export function SitioLogo({ leyenda = false, tono = "auto", className }: Props) {
  const id = React.useId().replace(/:/g, "");
  const tinta = tono === "auto" ? "currentColor" : TINTA[tono];
  return (
    <span role="img" aria-label="Fortius" className={className ? `s-logo ${className}` : "s-logo"} style={tono === "auto" ? undefined : { color: TINTA[tono] }}>
      <svg aria-hidden="true" focusable="false" viewBox={leyenda ? "-4 -4 1275 324" : "-4 -4 1275 240"}>
        <defs>
          <clipPath id={`${id}h`}><path clipRule="evenodd" d={logoCortes.huecos} /></clipPath>
          <clipPath id={`${id}a`}><path clipRule="evenodd" d={logoCortes.sinAmbar} /></clipPath>
          <clipPath id={`${id}b`}><path d={logoCortes.ambar} /></clipPath>
        </defs>
        <g clipPath={`url(#${id}h)`}>
          <path clipPath={`url(#${id}a)`} fillRule="evenodd" fill="#1B3FA6" d={logoAnillo} />
          <path clipPath={`url(#${id}b)`} fillRule="evenodd" fill="#E0A030" d={logoAnillo} />
        </g>
        {logoPalabra.map((d) => <path key={d} d={d} fill={tinta} />)}
        {leyenda ? logoLeyenda.map((glyph, i) => <path key={i} d={glyph.d} transform={glyph.transform} fill={tinta} />) : null}
      </svg>
    </span>
  );
}
