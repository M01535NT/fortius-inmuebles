"use client";
import { useState } from "react";
import { FINANCIAL_SOURCES } from "@/data/financial-rules";
import {
  calculateMortgage,
  convertPrice,
  paymentCapacity,
  type MortgageInput,
  type MortgageResult,
} from "@/lib/finance/mortgage";
import {
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
import { ClosingCostsCalculator } from "./closing-costs-calculator";
import { mortgageReport } from "@/lib/finance/report-content";
type SavedScenario = {
  id: number;
  input: MortgageInput;
  result: MortgageResult;
  quotedCat: string;
  bank: string;
  quoteDate: string;
};
function BalanceChart({ result }: { result: MortgageResult }) {
  const [selected, setSelected] = useState(1);
  const row = result.schedule[Math.min(selected, result.schedule.length) - 1];
  if (!row || result.principal === 0) return null;
  const path = (rows: MortgageResult["schedule"]) =>
    `M 0 0 ${rows.map((r) => `L ${(r.month / result.baseline.length) * 500} ${(1 - r.balance / result.principal) * 150}`).join(" ")}`;
  return (
    <div className="mt-7 rounded-md border border-border p-4">
      <h3 className="text-sm font-medium">Cómo baja tu deuda</h3>
      <svg
        viewBox="0 0 500 150"
        className="my-4 h-40 w-full overflow-visible"
        role="img"
        aria-label="Saldo de crédito por mes; línea principal con los abonos elegidos y línea gris sin abonos"
      >
        <path
          d={path(result.baseline)}
          fill="none"
          className="stroke-muted-foreground"
          strokeWidth="2"
          strokeDasharray="5 5"
        />
        <path
          d={path(result.schedule)}
          fill="none"
          className="stroke-primary"
          strokeWidth="3"
        />
      </svg>
      <Field label="Consultar mes del crédito">
        {(id) => (
          <input
            id={id}
            type="range"
            min={1}
            max={result.schedule.length}
            value={Math.min(selected, result.schedule.length)}
            onChange={(e) => setSelected(Number(e.target.value))}
            className="h-11 w-full accent-primary"
          />
        )}
      </Field>
      <p className="mt-1 text-sm text-muted-foreground">
        Mes {row.month} · {row.date} · Saldo {money(row.balance)}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        Línea continua: tu escenario. Discontinua: sin abonos anticipados.
      </p>
    </div>
  );
}
function Amortization({ result }: { result: MortgageResult }) {
  const [page, setPage] = useState(0);
  const lastPage = Math.max(0, Math.ceil(result.schedule.length / 12) - 1),
    activePage = Math.min(page, lastPage);
  if (!result.schedule.length) return null;
  return (
    <details className="mt-6 border-t border-border pt-4">
      <summary className="cursor-pointer py-2 text-sm font-medium">
        Tabla de amortización
      </summary>
      <div
        role="region"
        aria-label="Tabla de pagos; desliza horizontalmente para ver todas las columnas"
        tabIndex={0}
        className="mt-4 overflow-x-auto rounded-md border border-border"
      >
        <table className="w-full min-w-[760px] text-left text-xs tabular-nums">
          <caption className="p-3 text-left text-sm">
            Pagos {activePage * 12 + 1} a{" "}
            {Math.min((activePage + 1) * 12, result.schedule.length)}. Importes
            en MXN.
          </caption>
          <thead className="bg-secondary">
            <tr>
              {[
                "Mes / fecha",
                "Capital + interés",
                "Interés",
                "Capital",
                "Abono extra",
                "Saldo",
                "Egreso conocido",
              ].map((s) => (
                <th key={s} scope="col" className="p-3 font-medium">
                  {s}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.schedule
              .slice(activePage * 12, (activePage + 1) * 12)
              .map((r) => (
                <tr key={r.month} className="border-t border-border">
                  <th scope="row" className="whitespace-nowrap p-3 font-normal">
                    {r.month} / {r.date}
                  </th>
                  {[
                    r.payment,
                    r.interest,
                    r.principal,
                    r.extra,
                    r.balance,
                    r.knownOutlay,
                  ].map((n, i) => (
                    <td key={i} className="whitespace-nowrap p-3">
                      {money(n)}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className={buttonClass}
          disabled={activePage === 0}
          onClick={() => setPage(activePage - 1)}
        >
          12 meses anteriores
        </button>
        <span className="text-xs">
          {activePage + 1} de {lastPage + 1}
        </span>
        <button
          type="button"
          className={buttonClass}
          disabled={activePage === lastPage}
          onClick={() => setPage(activePage + 1)}
        >
          12 meses siguientes
        </button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        El último pago se ajusta para liquidar el saldo. El PDF incluye todos
        los meses.
      </p>
    </details>
  );
}
export function MortgagePlanner({
  precio,
  moneda,
  precioEditable = false,
}: {
  precio: number;
  moneda: "MXN" | "USD";
  precioEditable?: boolean;
}) {
  const compact = !precioEditable;
  const [v, setV] = useState({
    price: String(precio),
    exchange: "",
    down: "20",
    rate: "10.5",
    months: "240",
    first: localToday(),
    insurance: "",
    monthly: "",
    opening: "",
    extraMonthly: "0",
    extraOnce: "0",
    extraMonth: "12",
    prepaymentFee: "",
    income: "",
    debts: "",
    capacity: "35",
    cat: "",
    bank: "",
    quoteDate: "",
  });
  const [mode, setMode] = useState<"term" | "payment">("term"),
    [saved, setSaved] = useState<SavedScenario[]>([]);
  type Key = keyof typeof v;
  const set = (key: Key, value: string) =>
    setV((old) => ({ ...old, [key]: value }));
  const field = (
    key: Key,
    label: string,
    hint?: string,
    max = MAX_MONEY,
    step = 0.01,
  ) => (
    <AmountField
      label={label}
      value={v[key]}
      onChange={(s) => set(key, s)}
      hint={hint}
      max={max}
      step={step}
    />
  );
  const number = (key: Key, max = MAX_MONEY) => parseAmount(v[key], max);
  const originalPrice = precioEditable ? number("price") : precio;
  let price: number | null = null;
  if (originalPrice !== null) {
    try {
      price = convertPrice(originalPrice, moneda, number("exchange", 100));
    } catch {
      price = null;
    }
  }
  const down = number("down", 100),
    rate = number("rate", 25),
    months = number("months", 360);
  const extraMonthly = number("extraMonthly"),
    extraOnce = number("extraOnce"),
    extraMonth = number("extraMonth", 360);
  const optional: Key[] = [
    "insurance",
    "monthly",
    "opening",
    "prepaymentFee",
    "income",
    "debts",
  ];
  const invalidOptional = optional.find(
    (k) => v[k].trim() && number(k) === null,
  );
  let error =
    price === null || price < 100000
      ? "Ingresa un precio equivalente entre $100,000 y $10,000,000,000 MXN y, si está en dólares, un tipo de cambio válido."
      : down === null
        ? "Ingresa un enganche entre 0% y 100%."
        : rate === null
          ? "Ingresa una tasa válida entre 0% y 25%."
          : months === null || months < 1 || !Number.isInteger(months)
            ? "El plazo debe tener de 1 a 360 meses completos."
            : !validIsoDate(v.first)
              ? "Elige una fecha válida para el primer pago."
              : extraMonthly === null ||
                  extraOnce === null ||
                  (extraOnce > 0 &&
                    (extraMonth === null ||
                      !Number.isInteger(extraMonth) ||
                      extraMonth < 1 ||
                      extraMonth > months))
                ? "Revisa los abonos y el mes del abono único; debe estar dentro del plazo."
                : invalidOptional
                  ? "Revisa los importes: usa números positivos o cero, con hasta dos decimales."
                  : "";
  const capacityPercent = number("capacity", 100);
  if (v.income.trim() && (capacityPercent === null || capacityPercent < 1))
    error = "Elige una proporción de ingreso entre 1% y 100%.";
  if (v.quoteDate && !validIsoDate(v.quoteDate))
    error = "Elige una fecha válida para la cotización.";
  if (v.cat.trim() && number("cat", 100) === null)
    error = "Revisa el CAT capturado: debe estar entre 0% y 100%.";
  const input: MortgageInput | null =
    !error &&
    price !== null &&
    down !== null &&
    rate !== null &&
    months !== null
      ? {
          price,
          downPercent: down,
          annualRate: rate,
          months,
          firstPayment: v.first,
          insurance: number("insurance"),
          monthlyFee: number("monthly"),
          openingFee: number("opening"),
          extraMonthly: extraMonthly!,
          extraOnce: extraOnce!,
          extraMonth: extraOnce! > 0 ? extraMonth! : Math.min(12, months),
          prepaymentFee: number("prepaymentFee"),
          prepaymentMode: mode,
        }
      : null;
  const result = input ? calculateMortgage(input) : null;
  const capacity =
    number("income") !== null &&
    number("debts") !== null &&
    capacityPercent !== null &&
    capacityPercent >= 1
      ? paymentCapacity(number("income")!, number("debts")!, capacityPercent)
      : null;
  const report =
    result && input
      ? mortgageReport({
          input,
          result,
          saved,
          quotedCat: v.cat,
          bank: v.bank,
          quoteDate: v.quoteDate,
          ...(moneda === "USD"
            ? {
                fx: {
                  original: originalPrice!,
                  rate: number("exchange", 100)!,
                },
              }
            : {}),
          ...(v.income.trim() || v.debts.trim()
            ? {
                capacity: {
                  income: number("income"),
                  debts: number("debts"),
                  percent: capacityPercent,
                  budget: capacity,
                },
              }
            : {}),
        })
      : null;
  return (
    <div className="text-foreground">
      <section
        className="rounded-lg border border-border bg-card p-5 md:p-8"
        aria-label="Simulador de crédito hipotecario"
      >
        <div
          className={`grid items-start gap-8 ${compact ? "" : "lg:grid-cols-[1.1fr_1fr]"}`}
        >
          <div className="min-w-0 space-y-6">
            <h2 className="display-soft text-2xl">Arma tu hipoteca</h2>
            {precioEditable ? (
              field("price", `Precio de la propiedad (${moneda})`)
            ) : (
              <p className="text-sm text-muted-foreground">
                Precio del inmueble: {money(precio, moneda)} {moneda}.
              </p>
            )}
            {moneda === "USD" &&
              field(
                "exchange",
                "Tipo de cambio (MXN por USD)",
                "El precio está en dólares; el crédito de esta herramienta se calcula en pesos.",
                100,
              )}
            <div className="grid gap-4 sm:grid-cols-3">
              {field(
                "down",
                "Enganche",
                "Porcentaje del precio; 100% corresponde a contado.",
                100,
              )}
              {field("months", "Plazo", "Meses, de 1 a 360.", 360, 1)}
              {field(
                "rate",
                "Tasa %",
                "Nominal anual fija. 10.5% es un ejemplo editable, no una oferta bancaria.",
                25,
              )}
            </div>
            <details open={!compact} className="border-t border-border pt-3">
              <summary className="cursor-pointer py-2 text-sm font-medium">
                Cotización y cargos del banco
              </summary>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Fecha del primer pago">
                  {(id) => (
                    <input
                      id={id}
                      type="date"
                      value={v.first}
                      onChange={(e) => set("first", e.target.value)}
                      className={inputClass}
                    />
                  )}
                </Field>
                {field(
                  "insurance",
                  "Seguro mensual (MXN)",
                  "Cuota constante cotizada. Vacío = pendiente.",
                )}
                {field(
                  "monthly",
                  "Administración mensual (MXN)",
                  "Escribe 0 si tu banco confirmó que no hay cargo.",
                )}
                {field(
                  "opening",
                  "Comisión de apertura (MXN)",
                  "Importe con IVA de la cotización, no un porcentaje supuesto.",
                )}
                {field(
                  "cat",
                  "CAT de la cotización (%)",
                  "Opcional: se conserva como referencia. No reemplaza la tasa nominal.",
                  100,
                )}
                <Field label="Institución y producto (opcional)">
                  {(id) => (
                    <input
                      id={id}
                      value={v.bank}
                      maxLength={120}
                      onChange={(e) => set("bank", e.target.value)}
                      className={inputClass}
                    />
                  )}
                </Field>
                <Field label="Fecha de cotización (opcional)">
                  {(id) => (
                    <input
                      id={id}
                      type="date"
                      value={v.quoteDate}
                      onChange={(e) => set("quoteDate", e.target.value)}
                      className={inputClass}
                    />
                  )}
                </Field>
              </div>
            </details>
            <details className="border-t border-border pt-3">
              <summary className="cursor-pointer py-2 text-sm font-medium">
                Abonos anticipados
              </summary>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {field("extraMonthly", "Abono extra mensual (MXN)")}
                {field("extraOnce", "Abono único (MXN)")}
                {field("extraMonth", "Mes del abono único", undefined, 360, 1)}
                <Field label="Con los abonos quiero">
                  {(id) => (
                    <select
                      id={id}
                      value={mode}
                      onChange={(e) =>
                        setMode(e.target.value as "term" | "payment")
                      }
                      className={inputClass}
                    >
                      <option value="term">Reducir plazo</option>
                      <option value="payment">Reducir mensualidad</option>
                    </select>
                  )}
                </Field>
                {field(
                  "prepaymentFee",
                  "Comisiones totales por anticipos (MXN)",
                  "Suma cotizada por todos los abonos del escenario. Usa 0 sólo si no hay penalización.",
                )}
              </div>
            </details>
            {!compact && (
              <details className="border-t border-border pt-3">
                <summary className="cursor-pointer py-2 text-sm font-medium">
                  ¿Cabe en mi presupuesto?
                </summary>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {field("income", "Ingreso neto mensual (MXN)")}
                  {field("debts", "Otras deudas mensuales (MXN)")}
                  {field(
                    "capacity",
                    "Porcentaje de ingreso para deudas",
                    "35% es un punto de partida editable, no una regla de aprobación.",
                    100,
                  )}
                  {capacity !== null && result && (
                    <p className="text-sm leading-relaxed">
                      Presupuesto para esta hipoteca: {money(capacity)}.{" "}
                      {result.knownMonthlyPayment > capacity
                        ? "El egreso conocido del primer mes supera ese presupuesto."
                        : "Compáralo con el egreso mensual y los cargos pendientes."}{" "}
                      La autorización depende del banco.
                    </p>
                  )}
                </div>
              </details>
            )}
          </div>
          <div className="min-w-0">
            {error && (
              <p
                role="alert"
                className="rounded-md border border-destructive/40 p-3 text-sm text-destructive"
              >
                {error}
              </p>
            )}
            {result && (
              <>
                <output className="sr-only" aria-live="polite">
                  Capital e interés mensual: {money(result.payment)}.{" "}
                  {result.pending.length} cargos pendientes.
                </output>
                <dl>
                  <Metric
                    label="Capital e interés mensual"
                    value={`${money(result.payment)} MXN`}
                    note={
                      result.principal === 0
                        ? "Compra de contado: no hay crédito."
                        : "Pago inicial del crédito; puede bajar con abonos para reducir mensualidad. Seguros y comisiones se desglosan aparte."
                    }
                  />
                  <Metric
                    label="Egreso conocido del primer mes"
                    value={`${money(result.knownMonthlyPayment)} MXN`}
                    note={
                      result.pending.length
                        ? `Faltan cotizaciones: ${result.pending.join(", ")}.`
                        : "Incluye seguro, administración y abonos del mes; apertura y comisión total por anticipos son cargos separados."
                    }
                  />
                  {!compact && (
                    <>
                      <Metric
                        label="Intereses durante el crédito"
                        value={money(result.interest)}
                      />
                      <Metric
                        label={
                          result.complete
                            ? "Costo del crédito con cargos capturados"
                            : "Costo conocido del crédito"
                        }
                        value={money(result.totalKnownCost)}
                        note="Incluye capital e intereses; excluye enganche y gastos de compraventa."
                      />
                    </>
                  )}
                  <div className="flex flex-wrap justify-between gap-3 border-b border-border py-4 text-sm">
                    <dt>Enganche</dt>
                    <dd className="font-mono">{money(result.downPayment)}</dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-3 border-b border-border py-4 text-sm">
                    <dt>Crédito solicitado</dt>
                    <dd className="font-mono">{money(result.principal)}</dd>
                  </div>
                </dl>
                {result.extraPaid > 0 && (
                  <div className="mt-5 rounded-md bg-secondary p-4">
                    <p className="text-sm font-medium">Con tus abonos</p>
                    <p className="mt-2 text-sm leading-relaxed">
                      Ahorras {money(result.interestSaved)} en intereses y
                      terminas en {result.schedule.length} meses
                      {result.monthsSaved > 0
                        ? ` (${result.monthsSaved} menos)`
                        : ""}
                      . Las comisiones por anticipos se contabilizan por
                      separado.
                    </p>
                  </div>
                )}
                {!compact && <BalanceChart result={result} />}
                <div className="mt-6 flex flex-wrap gap-3">
                  {report && (
                    <ExportButton
                      report={report}
                      filename="fortius-hipoteca.pdf"
                    />
                  )}
                  {!compact && input && (
                    <button
                      type="button"
                      className={buttonClass}
                      disabled={saved.length >= 3}
                      onClick={() =>
                        setSaved((old) => [
                          ...old,
                          {
                            id: Math.max(0, ...old.map((s) => s.id)) + 1,
                            input: { ...input },
                            result,
                            quotedCat: v.cat,
                            bank: v.bank,
                            quoteDate: v.quoteDate,
                          },
                        ])
                      }
                    >
                      Guardar escenario ({saved.length}/3)
                    </button>
                  )}
                </div>
                {compact && (
                  <a
                    href="/herramientas/hipoteca"
                    className="mt-4 inline-flex min-h-11 items-center text-sm text-primary-ink underline underline-offset-4"
                  >
                    Abrir simulador completo
                  </a>
                )}
              </>
            )}
            <Method>
              <p>
                Simulación de crédito bancario en MXN, tasa fija y pagos
                mensuales vencidos. Interés sobre saldo, cuotas a centavos y
                ajuste del último pago. Las cuotas de seguro y administración
                son constantes según tus importes. No compara ofertas vigentes
                de bancos ni garantiza aprobación.
              </p>
              <p>
                Los abonos se aplican después del pago mensual. Puedes conservar
                la cuota para acortar plazo o recalcularla para conservar el
                vencimiento. Los cargos desconocidos quedan pendientes. Consulta
                las condiciones de anticipos de tu cotización.
              </p>
              <a
                href={FINANCIAL_SOURCES.cat.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-ink underline underline-offset-4"
              >
                Banxico: qué incluye el CAT
              </a>
            </Method>
          </div>
        </div>
        {!compact && result && <Amortization result={result} />}
        <PrivacyNote />
      </section>
      {!compact && saved.length > 0 && (
        <section
          className="mt-8 rounded-lg border border-border bg-card p-5 md:p-8"
          aria-label="Comparación de escenarios"
        >
          <h2 className="display-soft text-2xl">Compara antes de decidir</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Hasta tres escenarios en esta pestaña. Cada uno conserva sus datos;
            al recargar se borran.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {saved.map((s, index) => (
              <article
                key={s.id}
                className="min-w-0 rounded-md border border-border p-4"
              >
                <h3 className="font-medium">Escenario {index + 1}</h3>
                <p className="mt-2 text-xs text-muted-foreground">
                  {s.input.downPercent}% de enganche · {s.input.annualRate}%
                  nominal · {s.input.months} meses
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Precio {money(s.input.price)} · Crédito{" "}
                  {money(s.result.principal)}
                </p>
                <dl>
                  <Metric
                    label="Capital e interés mensual"
                    value={money(s.result.payment)}
                  />
                  <Metric label="Intereses" value={money(s.result.interest)} />
                  <Metric
                    label="Costo conocido"
                    value={money(s.result.totalKnownCost)}
                  />
                </dl>
                <p className="mt-3 text-xs text-muted-foreground">
                  {s.result.schedule.length} pagos.{" "}
                  {s.result.pending.length
                    ? `Pendientes: ${s.result.pending.join(", ")}.`
                    : "Cargos capturados completos."}
                </p>
                <button
                  type="button"
                  className={`${buttonClass} mt-4`}
                  aria-label={`Eliminar escenario ${index + 1}`}
                  onClick={() =>
                    setSaved((old) => old.filter((o) => o.id !== s.id))
                  }
                >
                  Eliminar
                </button>
              </article>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Compara cargos completos y condiciones equivalentes. Un subtotal con
            cotizaciones pendientes no indica el crédito más barato.
          </p>
        </section>
      )}
      {!compact && (
        <details className="mt-8">
          <summary className="display-soft cursor-pointer rounded-lg border border-border bg-card px-5 py-5 text-xl">
            Efectivo inicial y gastos de compra
          </summary>
          <div className="mt-4">
            <ClosingCostsCalculator
              financing={
                input && result
                  ? {
                      price: input.price,
                      downPayment: result.downPayment,
                      loan: result.principal,
                      openingFee: input.openingFee,
                    }
                  : null
              }
            />
          </div>
        </details>
      )}
    </div>
  );
}
