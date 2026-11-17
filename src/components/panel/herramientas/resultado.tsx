"use client";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Boton } from "@/components/panel/kit/boton";
import { Tarjeta } from "@/components/panel/kit/lista";

export type LineaResultado = { k: string; v: string; grande?: boolean };

/**
 * Resultado de una calculadora: la cifra principal grande y el desglose debajo. Lo comparten Crédito y Comisión.
 * Lo copiado lleva título, inmueble, supuestos, fecha y la leyenda, para que la cuenta se entienda fuera del panel (AUD-03, T2).
 */
export function Resultado({ lineas, vacio, titulo, para, supuestos = [], leyenda }: {
  lineas: LineaResultado[]; vacio: string; titulo: string; para?: string; supuestos?: string[]; leyenda: string;
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
      <Boton variante="secundario" bloque style={{ minHeight: 48 }} onClick={() => navigator.clipboard?.writeText(texto).then(() => avisar(`Copiado: ${lineas[0].k} ${lineas[0].v}`), () => avisar("No se pudo copiar"))}>Copiar resultado</Boton>
    </>
  );
}

export function Etiquetado({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return <div style={{ display: "grid", gap: 6 }}><span style={{ fontSize: 14, fontWeight: 500 }}>{etiqueta}</span>{children}</div>;
}
