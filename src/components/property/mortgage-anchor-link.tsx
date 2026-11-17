"use client";

import * as React from "react";

/*
  Enlace «Calcular mensualidad» de la ficha: la calculadora vive dentro de un <details>
  cerrado; antes de saltar al ancla se abre para que el salto muestre la calculadora.
  También la abre si la ficha se carga ya con #mensualidad en la dirección.
*/
function openMortgage() {
  const details = document.getElementById("mensualidad")?.closest("details");
  if (details && !details.open) details.open = true;
}

export function MortgageAnchorLink({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    if (window.location.hash === "#mensualidad") {
      openMortgage();
      document.getElementById("mensualidad")?.scrollIntoView();
    }
  }, []);
  return <a href="#mensualidad" onClick={openMortgage}>{children}</a>;
}
