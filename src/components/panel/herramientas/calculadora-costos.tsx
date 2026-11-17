"use client";
import { useMemo, useState } from "react";

import { Campo, formatoMonto, montoANumero } from "@/components/panel/kit/campo";
import { Desplegable } from "@/components/panel/kit/desplegable";
import { Interruptor } from "@/components/panel/kit/segmentado";
import { FINANCIAL_SOURCES, MUNICIPALITIES, type Municipality } from "@/data/financial-rules";
import { calculateClosingBudget } from "@/lib/finance/closing";
import { D, cents, localToday } from "@/lib/finance/money";
import { pesos } from "@/lib/panel/herramientas";

import { Resultado, type LineaResultado } from "./resultado";

const LEYENDA_COMPRA = "Cuenta de referencia, no asesoría fiscal. El ISAI y el Registro salen de las leyes de ingresos 2026; la notaría, el avalúo y el banco son cotizaciones. Lo que falta queda por cotizar.";
const LEYENDA_VENTA = "Cuenta de referencia, no asesoría fiscal. El ISR se escribe ya determinado (notaría, contador o «Cálculo de ISR»).";

/** De dónde sale cada regla y desde cuándo vale (SPEC.md, sección 9). */
const FUENTE_COMPRA = `ISAI: Ley de Ingresos 2026 del municipio elegido y Ley de Hacienda Municipal, ${FINANCIAL_SOURCES.fiscalBase.article}. Registro Público: Ley de Ingresos del Estado 2026, ${FINANCIAL_SOURCES.registration.article}, vigente desde el ${fechaCorta(FINANCIAL_SOURCES.registration.validFrom)}.`;
const FUENTE_VENTA = "Comisión e IVA: lo que se escriba aquí. El ISR no lo estima esta cuenta: va en «Cálculo de ISR».";

function fechaCorta(iso: string) {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

const MUNICIPIOS = (Object.keys(MUNICIPALITIES) as Municipality[]).map((m) => ({ valor: m, etiqueta: MUNICIPALITIES[m] }));
const ENGANCHES = ["10", "20", "30", "40"].map((v) => ({ valor: v, etiqueta: `${v}%` }));
const COMISIONES = ["3", "4", "5", "6"].map((v) => ({ valor: v, etiqueta: `${v}%` }));

/** Campo de monto opcional: vacío es «por cotizar» (null), no cero. */
function opcional(texto: string): number | null {
  return texto.trim() === "" ? null : montoANumero(texto);
}
const limpiar = (t: string) => t.replace(/[^0-9.]/g, "");

function Monto({ etiqueta, valor, alCambiar, ayuda }: { etiqueta: string; valor: string; alCambiar: (v: string) => void; ayuda?: string }) {
  return <Campo etiqueta={etiqueta} dinero inputMode="decimal" placeholder="Por cotizar" ayuda={ayuda} value={formatoMonto(valor)} onChange={(e) => alCambiar(limpiar(e.target.value))} />;
}

/**
 * Costos de cierre en Baja California (Tijuana, Rosarito, Tecate, Ensenada), fechas de 2026.
 * Usa el mismo cálculo que el sitio público y el panel viejo (`calculateClosingBudget`, docs/herramientas/metodo-de-calculo.md):
 * compra = ISAI por tabla municipal + Registro Público por la ley estatal (18/06/2026) + cotizaciones;
 * venta = comisión con IVA + cancelación + ISR ya determinado + saldo del crédito. Lo que no se escribe queda pendiente.
 */
export function CalculadoraCostos({ precioInicial, para, ladoInicial = "compra" }: { precioInicial?: number | null; para?: string; ladoInicial?: "compra" | "venta" }) {
  const lado = ladoInicial;
  const [precio, setPrecio] = useState(() => (precioInicial === null ? "" : String(precioInicial ?? 2500000)));
  const [municipio, setMunicipio] = useState<Municipality>("tijuana");
  const [pago, setPago] = useState<"contado" | "credito">("credito");
  const [enganche, setEnganche] = useState("20");
  const [base, setBase] = useState("");
  const [notaria, setNotaria] = useState("");
  const [avaluo, setAvaluo] = useState("");
  const [apertura, setApertura] = useState("");
  const [comision, setComision] = useState("5");
  const [iva, setIva] = useState<16 | 8>(16);
  const [isr, setIsr] = useState("");
  const [saldo, setSaldo] = useState("");
  const [cancelacion, setCancelacion] = useState("");
  const [otros, setOtros] = useState("");
  const [hoy] = useState(localToday);

  const p = montoANumero(precio);
  const cuenta = useMemo(() => {
    if (p <= 0) return null;
    try {
      if (lado === "compra") {
        const enganchePesos = pago === "contado" ? p : cents(new D(p).mul(enganche).div(100));
        const baseEscrita = opcional(base);
        return calculateClosingBudget({
          profile: "buyer", municipality: municipio, date: hoy, price: p, other: opcional(otros) ?? 0,
          taxBase: baseEscrita ?? p, baseIsAssumed: baseEscrita === null,
          downPayment: enganchePesos, loan: cents(new D(p).minus(enganchePesos)),
          notary: opcional(notaria), appraisal: opcional(avaluo), openingFee: opcional(apertura),
        });
      }
      return calculateClosingBudget({
        profile: "seller", municipality: municipio, date: hoy, price: p, other: opcional(otros) ?? 0,
        commissionPercent: Number(comision), vatPercent: iva, commissionIncludesVat: false,
        mortgagePayoff: opcional(saldo) ?? 0, cancellation: opcional(saldo) ? opcional(cancelacion) : 0,
        isr: opcional(isr),
      });
    } catch {
      return null;
    }
  }, [p, lado, pago, enganche, base, municipio, hoy, notaria, avaluo, apertura, otros, comision, iva, saldo, cancelacion, isr]);

  const preliminar = cuenta && !cuenta.complete;
  const lineas: LineaResultado[] = !cuenta ? [] : [
    lado === "compra"
      ? { k: preliminar ? "Efectivo para escriturar (falta cotizar)" : "Efectivo para escriturar", v: pesos(cuenta.cashRequired ?? 0), grande: true }
      : { k: preliminar ? "Le queda al propietario (falta el ISR)" : "Le queda al propietario", v: pesos(cuenta.sellerNet ?? 0), grande: true },
    ...(lado === "compra" && pago === "credito" ? [{ k: "Enganche", v: pesos(cents(new D(p).mul(enganche).div(100))) }] : []),
    ...cuenta.items
      .filter((i) => i.key !== "other" || (i.amount ?? 0) > 0)
      .filter((i) => !(i.key === "opening" && pago === "contado" && lado === "compra"))
      .filter((i) => !(i.key === "cancellation" && i.amount === 0))
      .map((i) => ({ k: i.label, v: i.amount === null ? "Por cotizar" : pesos(i.amount) })),
    ...(lado === "venta" && (cuenta.knownPayoff ?? 0) > 0 ? [{ k: "Saldo del crédito", v: pesos(cuenta.knownPayoff ?? 0) }] : []),
    { k: "Gastos de cierre conocidos", v: pesos(cuenta.knownExpenses) },
  ];

  const isai = cuenta?.items.find((i) => i.key === "isai");
  const supuestos = lado === "compra"
    ? [`precio ${pesos(p)}`, MUNICIPALITIES[municipio], pago === "contado" ? "de contado" : `con crédito, enganche ${enganche}%`, opcional(base) === null ? "ISAI sobre el precio (falta la base que determine el municipio)" : `base del ISAI ${pesos(opcional(base) ?? 0)}`, "Registro con dos avisos, un análisis y la compraventa" + (pago === "credito" ? " más la hipoteca" : "")]
    : [`precio ${pesos(p)}`, `comisión ${comision}% más IVA ${iva}%`, opcional(isr) === null ? "ISR por determinar" : "ISR escrito a mano"];
  const leyenda = lado === "compra" ? LEYENDA_COMPRA : LEYENDA_VENTA;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Campo etiqueta={lado === "compra" ? "Precio de compra" : "Precio de venta"} dinero inputMode="decimal" value={formatoMonto(precio)} onChange={(e) => setPrecio(limpiar(e.target.value))} />
      {lado === "compra" ? (
        <>
          <Desplegable etiqueta="Municipio" valor={municipio} opciones={MUNICIPIOS} alElegir={(v) => v && setMunicipio(v)} />
          <Interruptor etiqueta="Forma de pago" valor={pago} alElegir={setPago} opciones={[{ valor: "contado", etiqueta: "Contado" }, { valor: "credito", etiqueta: "Crédito" }]} />
          {pago === "credito" ? <Desplegable etiqueta="Enganche" valor={enganche} opciones={ENGANCHES} alElegir={(v) => v && setEnganche(v)} /> : null}
          <Monto etiqueta="Base del ISAI" valor={base} alCambiar={setBase} ayuda="La determina el municipio con precio, valor catastral y avalúo. Si la dejas vacía se usa el precio." />
          <Monto etiqueta="Notaría (con IVA)" valor={notaria} alCambiar={setNotaria} ayuda="Cotización de la notaría, sin ISAI ni Registro." />
          <Monto etiqueta="Avalúo" valor={avaluo} alCambiar={setAvaluo} />
          {pago === "credito" ? <Monto etiqueta="Comisión por apertura del crédito" valor={apertura} alCambiar={setApertura} ayuda="La que cotice el banco o Infonavit." /> : null}
        </>
      ) : (
        <>
          <Desplegable etiqueta="Comisión" valor={comision} opciones={COMISIONES} alElegir={(v) => v && setComision(v)} />
          <Interruptor etiqueta="IVA de la factura" valor={iva} alElegir={setIva} opciones={[{ valor: 16, etiqueta: "16%" }, { valor: 8, etiqueta: "8%" }]} />
          <Monto etiqueta="ISR por la venta" valor={isr} alCambiar={setIsr} ayuda="El que calcule la notaría o el contador. Escribe 0 si la venta está exenta." />
          <Monto etiqueta="Saldo del crédito por liquidar" valor={saldo} alCambiar={setSaldo} ayuda="Vacío si el inmueble no tiene hipoteca." />
          {opcional(saldo) ? <Monto etiqueta="Cancelación de la hipoteca" valor={cancelacion} alCambiar={setCancelacion} /> : null}
        </>
      )}
      <Monto etiqueta="Otros gastos" valor={otros} alCambiar={setOtros} ayuda="Opcional: predial y agua al corriente, constancias, gestoría." />
      <Resultado
        lineas={lineas}
        vacio="Escribe un precio para ver los costos de cierre."
        titulo={lado === "compra" ? "Costos de cierre del comprador" : "Costos de cierre del vendedor"}
        para={para}
        supuestos={supuestos}
        leyenda={leyenda}
        tipo={lado}
        fuente={lado === "compra" ? FUENTE_COMPRA : FUENTE_VENTA}
      />
      {lado === "compra" && isai?.note ? <p className="pn-her-leyenda">ISAI: {isai.note}</p> : null}
      {cuenta && cuenta.pending.length ? <p className="pn-her-leyenda pn-tono-aviso">Falta cotizar: {cuenta.pending.join(", ").toLowerCase()}.</p> : null}
      <p className="pn-her-leyenda">{leyenda}</p>
    </div>
  );
}
