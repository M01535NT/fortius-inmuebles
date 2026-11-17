"use client";

import * as React from "react";

import { calculateClosingBudget } from "@/lib/finance/closing";
import { calculateMortgage } from "@/lib/finance/mortgage";
import { localToday } from "@/lib/finance/money";
import type { Municipality } from "@/data/financial-rules";
import { municipioDeZona } from "@/data/zonas";
import { Pestanas, type Opcion } from "@/components/sitio/pestanas";
import { FilaLinea, ListaLineas } from "@/components/sitio/lineas";

type Herramienta = "mensualidad" | "contado" | "entrada" | "cierre" | "efectivo";

type Props = {
  precio: number;
  operacion: "venta" | "renta";
  credito: boolean;
  zona: string;
  mantenimientoMensual?: number;
};

/* Tasa de referencia: la misma con la que abre la calculadora de hipoteca. */
const TASA = 10.5;
const PLAZOS = [10, 15, 20] as const;

const MUNICIPIOS: Record<string, Municipality> = {
  Tijuana: "tijuana",
  "Playas de Rosarito": "rosarito",
  Tecate: "tecate",
  Ensenada: "ensenada",
};

const pesos = (n: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

function Cifra({ etiqueta, valor, nota }: { etiqueta: string; valor: string; nota?: string }) {
  return (
    <div className="fh-cifra">
      <p className="fh-cifra-etiqueta">{etiqueta}</p>
      <p className="fh-cifra-valor">{valor}</p>
      {nota && <p className="fh-nota">{nota}</p>}
    </div>
  );
}

function Filas({ filas }: { filas: { dato: string; valor: string; tenue?: boolean }[] }) {
  return (
    <dl className="fh-filas">
      {filas.map((f) => (
        <div key={f.dato}>
          <dt>{f.dato}</dt>
          <dd className={f.tenue ? "is-tenue" : undefined}>{f.valor}</dd>
        </div>
      ))}
    </dl>
  );
}

/*
  Herramientas de la ficha (17/11/2026): calculan con el precio del inmueble.
  Venta con crédito: mensualidad, gastos de cierre y efectivo para comprar.
  Venta solo de contado: la primera pestaña es «Compra de contado» con su aviso.
  Renta: lo que se paga para entrar. Notaría y avalúo quedan «por cotizar».
*/
export function FichaHerramientas({ precio, operacion, credito, zona, mantenimientoMensual }: Props) {
  const hoy = React.useMemo(() => localToday(), []);
  const municipio = MUNICIPIOS[municipioDeZona(zona)] ?? "tijuana";
  const opciones: Opcion<Herramienta>[] = operacion === "renta"
    ? [{ valor: "entrada", etiqueta: "Para entrar" }]
    : credito
      ? [{ valor: "mensualidad", etiqueta: "Mensualidad" }, { valor: "cierre", etiqueta: "Gastos de cierre" }, { valor: "efectivo", etiqueta: "Efectivo para comprar" }]
      : [{ valor: "contado", etiqueta: "Compra de contado" }, { valor: "cierre", etiqueta: "Gastos de cierre" }];
  const [herramienta, setHerramienta] = React.useState<Herramienta>(opciones[0].valor);
  const [enganche, setEnganche] = React.useState(20);
  const [plazo, setPlazo] = React.useState<(typeof PLAZOS)[number]>(20);

  const conCredito = operacion === "venta" && credito;
  const montoEnganche = conCredito ? Math.round(precio * enganche) / 100 : precio;
  const prestamo = conCredito ? Math.round((precio - montoEnganche) * 100) / 100 : 0;

  const hipoteca = React.useMemo(() => {
    if (!conCredito) return null;
    try {
      return calculateMortgage({
        price: precio, downPercent: enganche, annualRate: TASA, months: plazo * 12, firstPayment: hoy,
        insurance: null, monthlyFee: null, openingFee: null, extraMonthly: 0, extraOnce: 0, extraMonth: 12,
        prepaymentFee: null, prepaymentMode: "term",
      });
    } catch { return null; }
  }, [conCredito, precio, enganche, plazo, hoy]);

  const cierre = React.useMemo(() => {
    if (operacion !== "venta") return null;
    try {
      return calculateClosingBudget({
        profile: "buyer", municipality: municipio, date: hoy, price: precio, taxBase: precio, baseIsAssumed: true,
        downPayment: conCredito ? montoEnganche : precio, loan: prestamo,
        notary: null, appraisal: null, openingFee: conCredito ? null : 0, other: 0,
      });
    } catch { return null; }
  }, [operacion, municipio, hoy, precio, conCredito, montoEnganche, prestamo]);

  const filasCierre = (cierre?.items ?? [])
    .filter((i) => i.key !== "other" && !(i.key === "opening" && !conCredito))
    .map((i) => ({ dato: i.label, valor: i.amount === null ? "Por cotizar" : pesos(i.amount), tenue: i.amount === null }));

  const panel = (valor: Herramienta) => `fh-panel-${valor}`;

  return (
    <div className="fh">
      <div className="fh-caja s-banda">
        {opciones.length > 1
          ? <Pestanas opciones={opciones} valor={herramienta} onCambio={setHerramienta} etiqueta="Herramientas" idPanel={panel} />
          : <h3 className="fh-titulo">{opciones[0].etiqueta}</h3>}

        <div id={panel(herramienta)} role={opciones.length > 1 ? "tabpanel" : undefined} className="fh-panel">
          {herramienta === "mensualidad" && (
            <>
              <div className="fh-ajustes">
                <label className="fh-rango">
                  <span>Enganche: <strong>{enganche}%</strong> ({pesos(montoEnganche)})</span>
                  <input type="range" min={10} max={50} step={5} value={enganche} onChange={(e) => setEnganche(Number(e.target.value))} />
                </label>
                <label className="fh-plazo">
                  <span>Plazo</span>
                  <select className="s-campo-control" value={plazo} onChange={(e) => setPlazo(Number(e.target.value) as (typeof PLAZOS)[number])}>
                    {PLAZOS.map((p) => <option key={p} value={p}>{p} años</option>)}
                  </select>
                </label>
              </div>
              <Cifra etiqueta="Mensualidad aproximada" valor={hipoteca ? pesos(hipoteca.payment) : "Por calcular"}
                nota={`Crédito de ${pesos(prestamo)} a ${TASA}% anual de referencia, sin seguros ni comisiones. El banco confirma la tasa.`} />
            </>
          )}

          {herramienta === "contado" && (
            <>
              <p className="fh-aviso">Este inmueble se vende solo de contado: el dueño no acepta crédito hipotecario.</p>
              <Cifra etiqueta="Necesitas para comprar" valor={cierre ? pesos(precio + cierre.knownExpenses) : pesos(precio)}
                nota="Precio más impuesto y registro. Notaría y avalúo se suman al cotizarlos." />
            </>
          )}

          {herramienta === "cierre" && (
            <>
              <Filas filas={filasCierre} />
              <Cifra etiqueta="Gastos que ya se pueden calcular" valor={cierre ? pesos(cierre.knownExpenses) : "Por calcular"}
                nota="Tarifas de 2026, con el precio como base del impuesto. La notaría da la cifra final." />
            </>
          )}

          {herramienta === "efectivo" && (
            <>
              <Filas filas={[
                { dato: `Enganche (${enganche}%)`, valor: pesos(montoEnganche) },
                { dato: "Gastos de cierre calculados", valor: cierre ? pesos(cierre.knownExpenses) : "Por calcular", tenue: !cierre },
                { dato: "Notaría, avalúo y apertura", valor: "Por cotizar", tenue: true },
              ]} />
              <Cifra etiqueta="Efectivo para comprar, al menos" valor={cierre?.cashRequired != null ? pesos(cierre.cashRequired) : "Por calcular"}
                nota="Cambia el enganche en la pestaña Mensualidad." />
            </>
          )}

          {herramienta === "entrada" && (
            <>
              <Filas filas={[
                { dato: "Primer mes de renta", valor: pesos(precio) },
                { dato: "Depósito en garantía", valor: "Lo fija el dueño", tenue: true },
                ...(mantenimientoMensual != null ? [{ dato: "Mantenimiento mensual", valor: pesos(mantenimientoMensual) }] : []),
              ]} />
              <Cifra etiqueta="Renta mensual" valor={pesos(precio)} nota="El depósito suele ser de uno o dos meses; te lo confirmamos antes de firmar." />
            </>
          )}
        </div>
      </div>

      <ListaLineas className="fh-enlaces" etiqueta="Más herramientas">
        {operacion === "venta" && <FilaLinea href="/herramientas/hipoteca" titulo="Calculadora de hipoteca" detalle="Con seguros, comisiones y abonos." />}
        {operacion === "venta" && <FilaLinea href="/herramientas/gastos-de-cierre" titulo="Gastos de cierre" detalle="Con tu cotización de notaría." />}
        <FilaLinea href={`/inventario?op=${operacion}`} titulo="Comparar con otras propiedades" detalle="Hasta tres, lado a lado." />
      </ListaLineas>
    </div>
  );
}
