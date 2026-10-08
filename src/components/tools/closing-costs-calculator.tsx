"use client";
import { useState } from "react";
import {
  ACQUISITION_RULES,
  FINANCIAL_SOURCES,
  MUNICIPALITIES,
  type Municipality,
} from "@/data/financial-rules";
import {
  calculateClosingBudget,
  calculateSellerIsr,
  type BuyerBudgetInput,
  type SellerBudgetInput,
} from "@/lib/finance/closing";
import { closingReport } from "@/lib/finance/report-content";
import { convertPrice } from "@/lib/finance/mortgage";
import {
  D,
  cents,
  localToday,
  MAX_MONEY,
  money,
  parseAmount,
  validIsoDate,
} from "@/lib/finance/money";
import {
  AmountField,
  buttonClass,
  ExportButton,
  Field,
  inputClass,
  Method,
  Metric,
  PrivacyNote,
} from "./finance-ui";
type Financing = {
  price: number;
  downPayment: number;
  loan: number;
  openingFee: number | null;
};
export function ClosingCostsCalculator({
  financing,
}: {
  financing?: Financing | null;
}) {
  const linked = financing !== undefined;
  const [profile, setProfile] = useState<"buyer" | "seller">("buyer");
  const [municipality, setMunicipality] = useState<Municipality>("tijuana");
  const [currency, setCurrency] = useState<"MXN" | "USD">("MXN");
  const [date, setDate] = useState(localToday);
  const [credit, setCredit] = useState(false),
    [assumed, setAssumed] = useState(false);
  const [includesVat, setIncludesVat] = useState(false),
    [vat, setVat] = useState(16);
  const [isrMode, setIsrMode] = useState("quote");
  const [isrScope, setIsrScope] = useState(false);
  const [v, setV] = useState({
    price: "3000000",
    exchange: "",
    down: "20",
    base: "",
    isai: "",
    registration: "",
    notices: "2",
    notary: "",
    appraisal: "",
    opening: "",
    other: "",
    commission: "5",
    payoff: "",
    cancellation: "",
    isr: "",
    cost: "",
    deductions: "",
    years: "",
  });
  type Key = keyof typeof v;
  const set = (key: Key, value: string) =>
    setV((old) => ({ ...old, [key]: value }));
  const field = (key: Key, label: string, hint?: string, max = MAX_MONEY) => (
    <AmountField
      label={label}
      value={
        key === "base" && assumed && price !== null ? String(price) : v[key]
      }
      onChange={(s) => {
        set(key, s);
        if (key === "base") setAssumed(false);
      }}
      hint={hint}
      max={max}
    />
  );
  const enteredPrice = parseAmount(v.price);
  let price = financing?.price ?? null;
  if (!linked && enteredPrice !== null) {
    try {
      price = convertPrice(
        enteredPrice,
        currency,
        parseAmount(v.exchange, 100),
      );
    } catch {
      price = null;
    }
  }
  const activeProfile = linked ? "buyer" : profile;
  const activeCredit = financing ? financing.loan > 0 : credit;
  const downPercent = parseAmount(v.down, 100);
  const amount = (key: Key) =>
    key === "base" && assumed ? price : parseAmount(v[key]);
  const fields: Key[] =
    activeProfile === "buyer"
      ? [
          "base",
          "isai",
          "registration",
          "notary",
          "appraisal",
          "other",
          ...(activeCredit && !linked ? ["opening" as Key] : []),
        ]
      : [
          "payoff",
          "cancellation",
          "other",
          ...(isrMode === "quote"
            ? ["isr" as Key]
            : (["cost", "deductions"] as Key[])),
        ];
  const bad = fields.find((key) => v[key].trim() && amount(key) === null);
  let error =
    price === null || price < 100000
      ? "Ingresa un precio equivalente entre $100,000 y $10,000,000,000 MXN y, si está en dólares, el tipo de cambio."
      : !validIsoDate(date)
        ? "Elige una fecha válida para la operación."
        : bad
          ? "Revisa los importes: usa números positivos o cero, con hasta dos decimales."
          : "";
  if (
    activeProfile === "buyer" &&
    activeCredit &&
    !linked &&
    downPercent === null
  )
    error = "Ingresa un enganche entre 0% y 100%.";
  const notices = parseAmount(v.notices, 4);
  if (
    activeProfile === "buyer" &&
    (notices === null || !Number.isInteger(notices))
  )
    error = "Captura de cero a cuatro avisos preventivos.";
  const commission = parseAmount(v.commission, 20);
  if (activeProfile === "seller" && v.commission.trim() && commission === null)
    error = "Ingresa una comisión válida entre 0% y 20%.";
  const years = parseAmount(v.years, 100);
  if (
    activeProfile === "seller" &&
    isrMode === "simulate" &&
    v.years.trim() &&
    (years === null || !Number.isInteger(years) || years < 1)
  )
    error = "Captura los años fiscales completos, de 1 a 100.";
  const downPayment =
    financing?.downPayment ??
    (price === null
      ? 0
      : activeCredit
        ? cents(new D(price).mul(downPercent ?? 0).div(100))
        : price);
  const loan =
    financing?.loan ??
    (price === null ? 0 : cents(new D(price).minus(downPayment)));
  const simulation =
    activeProfile === "seller" &&
    isrMode === "simulate" &&
    isrScope &&
    price !== null &&
    !error
      ? calculateSellerIsr({
          price,
          date,
          updatedAcquisitionCost: amount("cost"),
          updatedDeductions: amount("deductions"),
          fiscalYears: years,
        })
      : null;
  const budgetInput: BuyerBudgetInput | SellerBudgetInput | null =
    !error && price !== null
      ? activeProfile === "buyer"
        ? {
            profile: "buyer",
            municipality,
            date,
            price,
            taxBase: amount("base"),
            downPayment,
            loan,
            baseIsAssumed: assumed,
            isaiQuote: amount("isai"),
            registrationQuote: amount("registration"),
            preventiveNotices: notices ?? 2,
            notary: amount("notary"),
            appraisal: amount("appraisal"),
            openingFee: linked
              ? (financing?.openingFee ?? null)
              : amount("opening"),
            other: amount("other"),
          }
        : {
            profile: "seller",
            municipality,
            date,
            price,
            commissionPercent: commission,
            vatPercent: vat,
            commissionIncludesVat: includesVat,
            mortgagePayoff: amount("payoff"),
            cancellation: amount("cancellation"),
            isr:
              isrMode === "simulate"
                ? (simulation?.provisional ?? null)
                : amount("isr"),
            isrIsSimulated: isrMode === "simulate",
            other: amount("other"),
          }
      : null;
  const result = budgetInput ? calculateClosingBudget(budgetInput) : null;
  const sourceLinks =
    activeProfile === "buyer"
      ? [
          ACQUISITION_RULES[municipality].url,
          FINANCIAL_SOURCES.fiscalBase.url,
          FINANCIAL_SOURCES.registration.url,
          ...(municipality === "tijuana"
            ? [FINANCIAL_SOURCES.uma2026.url, FINANCIAL_SOURCES.uma2025.url]
            : []),
        ]
      : [FINANCIAL_SOURCES.isr.url, FINANCIAL_SOURCES.incomeLaw.url];
  const report =
    result && budgetInput
      ? closingReport({
          input: budgetInput,
          result,
          ...(!linked && currency === "USD"
            ? {
                fx: {
                  original: enteredPrice!,
                  rate: parseAmount(v.exchange, 100)!,
                },
              }
            : {}),
          ...(activeProfile === "seller"
            ? {
                isr: {
                  mode: isrMode,
                  scope: isrScope,
                  cost: amount("cost"),
                  deductions: amount("deductions"),
                  years,
                  simulation,
                },
              }
            : {}),
        })
      : null;
  return (
    <section
      className="rounded-lg border border-border bg-card p-5 text-foreground md:p-8"
      aria-label="Presupuesto de compraventa"
    >
      {!linked && (
        <div
          className="mb-7 flex flex-wrap gap-2"
          role="group"
          aria-label="Perfil"
        >
          {(["buyer", "seller"] as const).map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={profile === p}
              onClick={() => setProfile(p)}
              className={`${buttonClass} ${profile === p ? "border-primary bg-secondary" : ""}`}
            >
              {p === "buyer" ? "Voy a comprar" : "Voy a vender"}
            </button>
          ))}
        </div>
      )}
      <div className="grid items-start gap-10 lg:grid-cols-[1.1fr_1fr]">
        <div className="min-w-0 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Municipio">
              {(id) => (
                <select
                  id={id}
                  className={inputClass}
                  value={municipality}
                  onChange={(e) =>
                    setMunicipality(e.target.value as Municipality)
                  }
                >
                  {Object.entries(MUNICIPALITIES).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="Fecha de operación">
              {(id) => (
                <input
                  id={id}
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputClass}
                />
              )}
            </Field>
            {!linked && (
              <>
                {field(
                  "price",
                  `${activeProfile === "buyer" ? "Precio de compra" : "Precio de venta"} (${currency})`,
                )}
                <Field label="Moneda del precio">
                  {(id) => (
                    <select
                      id={id}
                      value={currency}
                      className={inputClass}
                      onChange={(e) =>
                        setCurrency(e.target.value as "MXN" | "USD")
                      }
                    >
                      <option>MXN</option>
                      <option>USD</option>
                    </select>
                  )}
                </Field>
                {currency === "USD" &&
                  field(
                    "exchange",
                    "Tipo de cambio (MXN por USD)",
                    "Captura el cambio de tu operación. Todos los gastos se calculan en pesos.",
                    100,
                  )}
              </>
            )}
          </div>
          {financing && (
            <p className="text-sm text-muted-foreground">
              Usa el precio, enganche y apertura de la hipoteca de arriba:{" "}
              {money(financing.price)} MXN.
            </p>
          )}
          {activeProfile === "buyer" ? (
            <>
              {!linked && (
                <div className="space-y-4">
                  <Field label="Forma de compra">
                    {(id) => (
                      <select
                        id={id}
                        value={credit ? "credit" : "cash"}
                        className={inputClass}
                        onChange={(e) => setCredit(e.target.value === "credit")}
                      >
                        <option value="cash">De contado</option>
                        <option value="credit">Con crédito</option>
                      </select>
                    )}
                  </Field>
                  {credit &&
                    field("down", "Enganche de compra (%)", undefined, 100)}
                </div>
              )}
              <div className="space-y-3">
                {field(
                  "base",
                  "Base gravable ISAI (MXN)",
                  "Usa la base determinada para el inmueble: considera precio actualizado, catastro y avalúo, según la ley.",
                )}
                <button
                  type="button"
                  disabled={price === null}
                  className={buttonClass}
                  onClick={() => {
                    set("base", String(price));
                    setAssumed(true);
                  }}
                >
                  Usar precio para simular
                </button>
                {assumed && (
                  <p className="text-xs text-muted-foreground">
                    El precio es un supuesto de base; no equivale a su
                    determinación fiscal.
                  </p>
                )}
              </div>
              <details className="border-y border-border py-3">
                <summary className="cursor-pointer py-2 text-sm font-medium">
                  Determinaciones y registro
                </summary>
                <div className="mt-4 grid gap-4">
                  {field(
                    "isai",
                    "ISAI determinado (MXN)",
                    "Opcional: sustituye el cálculo de la tabla municipal.",
                  )}
                  {field(
                    "registration",
                    "Registro cotizado (MXN)",
                    "Opcional: sustituye todos los derechos de registro calculados.",
                  )}
                  {field(
                    "notices",
                    "Avisos preventivos",
                    "Presupuesto ordinario: dos avisos. Ajusta al número de tu operación.",
                    4,
                  )}
                </div>
              </details>
              <div className="grid gap-4 sm:grid-cols-2">
                {field(
                  "notary",
                  "Notario y gestión (MXN)",
                  "Cotización con IVA. Excluye ISAI y Registro.",
                )}
                {field("appraisal", "Avalúo cotizado (MXN)")}
                {activeCredit &&
                  !linked &&
                  field("opening", "Apertura del crédito (MXN)")}
                {field(
                  "other",
                  "Otros gastos (MXN)",
                  "Escribe 0 si no hay otros cargos.",
                )}
              </div>
            </>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                {field(
                  "commission",
                  "Comisión pactada (%)",
                  "Usa la comisión de tu contrato.",
                  20,
                )}
                <Field label="IVA en la factura">
                  {(id) => (
                    <select
                      id={id}
                      className={inputClass}
                      value={vat}
                      onChange={(e) => setVat(Number(e.target.value))}
                    >
                      <option value={16}>16%</option>
                      <option value={8}>8% (estímulo aplicable)</option>
                      <option value={0}>0% (tratamiento confirmado)</option>
                    </select>
                  )}
                </Field>
              </div>
              <label className="flex min-h-11 items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={includesVat}
                  onChange={(e) => setIncludesVat(e.target.checked)}
                  className="size-5 accent-primary"
                />
                La comisión pactada ya incluye IVA
              </label>
              <div className="space-y-3">
                {field(
                  "payoff",
                  "Saldo para liquidar hipoteca (MXN)",
                  "Saldo de liquidación de tu banco, separado del costo de cancelarla.",
                )}
                <button
                  type="button"
                  className={buttonClass}
                  onClick={() => {
                    set("payoff", "0");
                    set("cancellation", "0");
                  }}
                >
                  No tengo hipoteca
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {field("cancellation", "Cancelación de hipoteca (MXN)")}
                {field(
                  "other",
                  "Otros gastos (MXN)",
                  "Escribe 0 si no hay otros cargos.",
                )}
              </div>
              <Field label="ISR por venta">
                {(id) => (
                  <select
                    id={id}
                    className={inputClass}
                    value={isrMode}
                    onChange={(e) => setIsrMode(e.target.value)}
                  >
                    <option value="quote">Capturar importe determinado</option>
                    <option value="simulate">Simular pago provisional</option>
                  </select>
                )}
              </Field>
              {isrMode === "quote" ? (
                field(
                  "isr",
                  "ISR determinado (MXN)",
                  "Deja vacío si aún falta determinarlo. Usa 0 sólo si se confirmó que no hay pago.",
                )
              ) : (
                <div className="space-y-4 border-l-2 border-primary/40 pl-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Para persona física residente en México, un solo propietario
                    y venta sin exención. Necesitas los valores fiscales ya
                    actualizados; el precio original de compra no los sustituye.
                  </p>
                  <label className="flex min-h-11 items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={isrScope}
                      onChange={(e) => setIsrScope(e.target.checked)}
                      className="size-5 accent-primary"
                    />
                    Mi caso cumple esos requisitos
                  </label>
                  {field("cost", "Costo fiscal actualizado (MXN)")}
                  {field(
                    "deductions",
                    "Deducciones fiscales actualizadas (MXN)",
                  )}
                  {field(
                    "years",
                    "Años fiscales transcurridos",
                    "Años completos para el cálculo; la ley limita la división a 20.",
                    100,
                  )}
                  {simulation && (
                    <p className="text-sm text-muted-foreground">
                      Pago estatal acreditado: {money(simulation.state)}.
                      Federal: {money(simulation.federal)}. Ya están incluidos
                      en el ISR; no se suman otra vez.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        <div className="min-w-0 lg:sticky lg:top-28">
          <h2 className="display-soft text-2xl">
            {activeProfile === "buyer"
              ? "Tu presupuesto de compra"
              : "Lo que recibes al vender"}
          </h2>
          {error && (
            <p
              role={linked && !financing ? "status" : "alert"}
              className="mt-5 rounded-md border border-destructive/40 p-3 text-sm text-destructive"
            >
              {linked && !financing
                ? "Completa los datos de la hipoteca para actualizar este presupuesto."
                : error}
            </p>
          )}
          {result && (
            <>
              <output className="sr-only" aria-live="polite">
                Gastos conocidos: {money(result.knownExpenses)}.{" "}
                {result.pending.length} conceptos pendientes.
              </output>
              <dl className="mt-3">
                <Metric
                  label="Gastos conocidos"
                  value={`${money(result.knownExpenses)} MXN`}
                />
                <Metric
                  label={
                    activeProfile === "buyer"
                      ? result.complete
                        ? "Efectivo inicial estimado"
                        : "Efectivo inicial parcial"
                      : result.complete
                        ? "Neto estimado de venta"
                        : "Neto parcial de venta"
                  }
                  value={`${money((activeProfile === "buyer" ? result.cashRequired : result.sellerNet)!)} MXN`}
                  note={
                    activeProfile === "buyer"
                      ? `Incluye ${money(downPayment)} de ${loan > 0 ? "enganche" : "precio de contado"}, más gastos conocidos.`
                      : `${result.knownPayoff === null ? "Saldo hipotecario pendiente." : `${money(result.knownPayoff)} para liquidar hipoteca.`} ${result.sellerNet! < 0 ? "Los egresos superan el precio; necesitarías aportar la diferencia." : ""}`
                  }
                />
              </dl>
              <ul className="mt-4 divide-y divide-border">
                {result.items.map((item) => (
                  <li key={item.key} className="py-3">
                    <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm">
                      <span>{item.label}</span>
                      <span className="font-mono">
                        {item.amount === null
                          ? "Pendiente"
                          : money(item.amount)}
                      </span>
                    </div>
                    {item.note && (
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {item.note}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
              {result.pending.length > 0 && (
                <div className="mt-4 rounded-md bg-secondary p-4 text-sm">
                  <p className="font-medium">Falta incorporar</p>
                  <p className="mt-2 leading-relaxed text-muted-foreground">
                    {result.pending.join(" · ")}. El subtotal cambia al
                    completar estos datos.
                  </p>
                </div>
              )}
              {activeProfile === "seller" && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Comisión de intermediación ({v.commission || "pendiente"}%).{" "}
                  {includesVat
                    ? "IVA incluido en el importe pactado."
                    : "IVA adicional según la factura."}
                </p>
              )}
              {report && (
                <div className="mt-6">
                  <ExportButton
                    report={report}
                    filename={`fortius-presupuesto-${activeProfile === "buyer" ? "compra" : "venta"}.pdf`}
                  />
                </div>
              )}
            </>
          )}
          <Method>
            <p>
              Compraventa ordinaria en 2026. ISAI por tarifa municipal; en
              Ensenada se suma 0.25% de la base para seguridad pública. El
              Registro supone una compraventa, un análisis, los avisos
              capturados y una nueva hipoteca si hay crédito; actos adicionales
              requieren cotización.
            </p>
            <p>
              Notario, avalúo, apertura, comisión y otros gastos usan tus
              cotizaciones. Los campos vacíos quedan pendientes; cero significa
              que confirmaste que no hay cargo. No se aplican exenciones
              automáticamente.
            </p>
            {activeProfile === "seller" && (
              <p>
                El ISR simulado usa la tarifa SAT A.I, costo mínimo de 10% del
                precio y hasta 20 años. El pago estatal de 5% de la ganancia se
                acredita al provisional federal. No calcula actualización
                fiscal, exenciones ni impuesto anual.
              </p>
            )}
            <ul className="space-y-2">
              {sourceLinks.map((url, index) => (
                <li key={url}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-ink underline underline-offset-4"
                  >
                    {activeProfile === "buyer"
                      ? [
                          "Ley de ingresos municipal 2026",
                          "Base fiscal: Ley de Hacienda Municipal",
                          "Derechos de Registro 2026",
                          "UMA 2026",
                          "UMA de enero de 2026",
                        ][index]
                      : ["Tarifa SAT 2026, Anexo 8 A.I", "Ley del ISR"][index]}
                  </a>
                </li>
              ))}
            </ul>
          </Method>
          {!linked && <PrivacyNote />}
        </div>
      </div>
    </section>
  );
}
