"use client";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Boton } from "@/components/panel/kit/boton";
import { Tarjeta } from "@/components/panel/kit/lista";
import type { Herramienta } from "@/lib/panel/documentos/api";

import { GuardarCuenta } from "./guardar";

export type LineaResultado = { k: string; v: string; grande?: boolean };

/**
 * Resultado de una calculadora: la cifra principal grande y el desglose debajo. Lo comparten todas las cuentas.
 * Lo copiado lleva título, inmueble, supuestos, fuente, fecha y la leyenda, para que la cuenta se entienda fuera del panel.
 * «Guardar» la deja en Trabajos sueltos o, si viene de un asunto, en sus Documentos (SPEC.md, sección 9).
 */
export function Resultado({ lineas, vacio, titulo, para, supuestos = [], leyenda, tipo, fuente }: {
  lineas: LineaResultado[]; vacio: string; titulo: string; para?: string; supuestos?: string[]; leyenda: string;
  tipo?: Herramienta; fuente?: string;
}) {
  const { avisar } = useAvisos();
  if (!lineas.length) return <p className="pn-sub">{vacio}</p>;
  const fecha = new Date().toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
  const texto = [
    `Fortius Inmuebles · ${titulo}`,
    para ? `Para: ${para}` : null,
    "",
    ...lineas.map((l) => `${l.k}: ${l.v}`),
    "",
    supuestos.length ? `Supuestos: ${supuestos.join(", ")}.` : null,
    fuente ? `Fuente: ${fuente}` : null,
    `Calculado el ${fecha}.`,
    leyenda,
  ].filter((x): x is string => x !== null).join("\n");
  return (
    <>
      <Tarjeta className="pn-her-res" aria-live="polite">
        {lineas.map((l) => l.grande ? (
          <div key={l.k} className="pn-her-big"><span>{l.k}</span><span>{l.v}</span></div>
        ) : (
          <div key={l.k} className="pn-her-ln"><span>{l.k}</span><b>{l.v}</b></div>
        ))}
      </Tarjeta>
      {fuente ? <p className="pn-her-leyenda pn-her-fuente">Fuente: {fuente}</p> : null}
      <div className="pn-her-acciones">
        {tipo ? <GuardarCuenta tipo={tipo} cuenta={{ titulo, para, lineas, supuestos, fuente, leyenda }} /> : null}
        <Boton variante="secundario" bloque style={{ minHeight: 48 }} onClick={() => navigator.clipboard?.writeText(texto).then(() => avisar(`Copiado: ${lineas[0].k} ${lineas[0].v}`), () => avisar("No se pudo copiar"))}>Copiar resultado</Boton>
      </div>
    </>
  );
}

export function Etiquetado({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return <div style={{ display: "grid", gap: 6 }}><span style={{ fontSize: 14, fontWeight: 500 }}>{etiqueta}</span>{children}</div>;
}
