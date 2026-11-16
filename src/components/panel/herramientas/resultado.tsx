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
      <Tarjeta style={{ overflow: "hidden" }} aria-live="polite">
        {lineas.map((l) => l.grande ? (
          <div key={l.k} style={{ padding: "16px 16px 14px", display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 13, color: "var(--ink-muted)", fontWeight: 500 }}>{l.k}</span>
            <span style={{ fontSize: 34, lineHeight: 1.1, fontWeight: 700, letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums" }}>{l.v}</span>
          </div>
        ) : (
          <div key={l.k} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "12px 16px", borderTop: "1px solid var(--border)", fontSize: 15 }}>
            <span style={{ color: "var(--ink-muted)" }}>{l.k}</span>
            <b style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{l.v}</b>
          </div>
        ))}
      </Tarjeta>
      <Boton variante="secundario" bloque onClick={() => navigator.clipboard?.writeText(texto).then(() => avisar("Cuenta copiada"), () => avisar("No se pudo copiar"))}>Copiar la cuenta</Boton>
    </>
  );
}

export function Etiquetado({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return <div style={{ display: "grid", gap: 6 }}><span style={{ fontSize: 14, fontWeight: 500 }}>{etiqueta}</span>{children}</div>;
}
