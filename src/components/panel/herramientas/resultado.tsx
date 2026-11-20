"use client";
import type { ReactNode } from "react";

import { Icono } from "@/components/panel/icons";
import { useAvisos } from "@/components/panel/kit/avisos";
import type { Herramienta } from "@/lib/panel/documentos/api";

import { GuardarCuenta } from "./guardar";

export type LineaResultado = { k: string; v: string; grande?: boolean };

/** Las líneas de una cuenta en su tarjeta: la cifra principal grande y el desglose en renglones (modelo: .card y .dato). */
export function LineasCuenta({ lineas }: { lineas: LineaResultado[] }) {
  return (
    <div className="fm-card" aria-live="polite">
      {lineas.map((l) => l.grande ? (
        <div key={l.k} className="fm-big"><span>{l.k}</span><b>{l.v}</b></div>
      ) : (
        <div key={l.k} className="fm-dato"><span className="fm-k">{l.k}</span><b className="fm-num">{l.v}</b></div>
      ))}
    </div>
  );
}

/** Los datos que se escriben, en su tarjeta con un renglón por campo (el nombre a la izquierda, como el modelo). */
export function DatosCuenta({ titulo = "Datos", children }: { titulo?: string; children: ReactNode }) {
  return (
    <section className="fm-grupo" aria-label={titulo}>
      <div className="fm-t">{titulo}</div>
      <div className="fm-card fm-form">{children}</div>
    </section>
  );
}

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
  if (!lineas.length) {
    return (
      <section className="fm-grupo" aria-label="Resultado">
        <div className="fm-t">Resultado</div>
        <div className="fm-card"><div className="fm-dato"><span className="fm-v" data-vacio="">{vacio}</span></div></div>
      </section>
    );
  }
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
    <section className="fm-grupo" aria-label="Resultado">
      <div className="fm-t">
        <span>Resultado</span>
        <span className="her-acc">
          {tipo ? <GuardarCuenta tipo={tipo} cuenta={{ titulo, para, lineas, supuestos, fuente, leyenda }} /> : null}
          <button type="button" className="as-btn her-acc-btn" onClick={() => navigator.clipboard?.writeText(texto).then(() => avisar(`Copiado: ${lineas[0].k} ${lineas[0].v}`), () => avisar("No se pudo copiar"))}>
            <Icono nombre="copia" tamano={14} />Copiar resultado
          </button>
        </span>
      </div>
      <LineasCuenta lineas={lineas} />
      {fuente ? <p className="as-m fm-pie her-fuente"><b>Fuente:</b> {fuente}</p> : null}
    </section>
  );
}

export function Etiquetado({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return <div style={{ display: "grid", gap: 6 }}><span style={{ fontSize: 14, fontWeight: 500 }}>{etiqueta}</span>{children}</div>;
}
