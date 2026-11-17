import type * as React from "react";

export type TonoDistintivo = "neutro" | "acento" | "aviso" | "error" | "claro" | "media";

/**
  Distintivo: etiqueta corta en pastilla. «claro» va sobre foto (operación en la tarjeta),
  «media» es el sello translúcido sobre foto o video, «aviso» para En trámite y «error» para Vendida.
*/
export function Distintivo({ tono = "neutro", className, children }: { tono?: TonoDistintivo; className?: string; children: React.ReactNode }) {
  const cls = ["s-distintivo", tono === "neutro" ? "" : `s-distintivo-${tono}`, className ?? ""].filter(Boolean).join(" ");
  return <span className={cls}>{children}</span>;
}
