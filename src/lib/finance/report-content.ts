import {
  ACQUISITION_RULES,
  FINANCIAL_SOURCES,
  MUNICIPALITIES,
} from "@/data/financial-rules";
import type {
  BuyerBudgetInput,
  SellerBudgetInput,
  calculateClosingBudget,
  calculateSellerIsr,
} from "./closing";
import type { MortgageInput, MortgageResult } from "./mortgage";
import { money } from "./money";
import type { FinancialReport, ReportTable } from "./report-model";
type Fx = { original: number; rate: number };
export type MortgageReportScenario = {
  input: MortgageInput;
  result: MortgageResult;
  quotedCat: string;
  bank: string;
  quoteDate: string;
};
type MortgageOptions = MortgageReportScenario & {
  fx?: Fx;
  saved: MortgageReportScenario[];
  capacity?: {
    income: number | null;
    debts: number | null;
    percent: number | null;
    budget: number | null;
  };
};
const amount = (n: number | null) => (n === null ? "Pendiente" : money(n));
const table = (rows: string[][]): ReportTable => ({
  columns: [
    { label: "Concepto", weight: 1.15 },
    { label: "Dato de la simulación", weight: 1.85 },
  ],
  rows,
});
function mortgageRows(s: MortgageReportScenario): string[][] {
  const i = s.input;
  return [
    ["Precio de la propiedad", money(i.price)],
    ["Enganche", `${i.downPercent}% · ${money(s.result.downPayment)}`],
    ["Crédito solicitado", money(s.result.principal)],
    ["Tasa nominal anual fija", `${i.annualRate}%`],
    ["Plazo solicitado", `${i.months} meses`],
    ["Primer pago", i.firstPayment],
    ["Seguro mensual", amount(i.insurance)],
    ["Administración mensual", amount(i.monthlyFee)],
    ["Comisión de apertura", amount(i.openingFee)],
    ["Abono extra mensual", money(i.extraMonthly)],
    ["Abono único", `${money(i.extraOnce)} · mes ${i.extraMonth}`],
    [
      "Objetivo de anticipos",
      i.prepaymentMode === "term" ? "Reducir plazo" : "Reducir mensualidad",
    ],
    ["Comisiones totales por anticipos", amount(i.prepaymentFee)],
    [
      "CAT de cotización",
      s.quotedCat
        ? `${s.quotedCat}% (capturado; no calculado)`
        : "No capturado",
    ],
    ["Institución y producto", s.bank || "No capturados"],
    ["Fecha de cotización", s.quoteDate || "No capturada"],
  ];
}
export function mortgageReport(o: MortgageOptions): FinancialReport {
  const r = o.result;
  const sections: FinancialReport["sections"] = [
    {
      title: "Datos y condiciones del crédito",
      newPage: true,
      table: table(mortgageRows(o)),
      lines: [
        "Importes en MXN. Las cuotas capturadas de seguro y administración son constantes. Apertura y comisión total por anticipos son cargos separados. En una compra de contado estos cargos de crédito no se aplican.",
      ],
    },
    {
      title: "Resultado de la simulación",
      table: table([
        ["Capital e interés mensual inicial", money(r.payment)],
        ["Egreso conocido del primer mes", money(r.knownMonthlyPayment)],
        ["Intereses durante el crédito", money(r.interest)],
        ["Cargos conocidos del crédito", money(r.fees)],
        ["Costo conocido del crédito", money(r.totalKnownCost)],
        ["Abonos extra aplicados", money(r.extraPaid)],
        ["Interés ahorrado frente a no anticipar", money(r.interestSaved)],
        ["Meses ahorrados", String(r.monthsSaved)],
        ["Pagos resultantes", String(r.schedule.length)],
        ["Último pago", r.schedule.at(-1)?.date ?? "No hay crédito"],
      ]),
      lines: [
        "El costo conocido incluye capital, intereses y cargos capturados; excluye enganche y gastos de compraventa. Los importes pendientes no son cero. El egreso mensual incluye capital, interés, seguros, administración y abonos de ese mes; excluye los cargos separados de apertura y anticipos.",
      ],
    },
  ];
  if (o.fx)
    sections.push({
      title: "Conversión del precio",
      table: table([
        ["Precio original", money(o.fx.original, "USD")],
        ["Tipo de cambio capturado", `${o.fx.rate} MXN por USD`],
        ["Precio convertido", `${money(o.input.price)} MXN`],
      ]),
      lines: [
        "El inmueble está anunciado en dólares. El crédito de esta simulación es en pesos; el tipo de cambio es el capturado por el usuario.",
      ],
    });
  if (o.capacity)
    sections.push({
      title: "Presupuesto mensual del hogar",
      table: table([
        ["Ingreso neto mensual", amount(o.capacity.income)],
        ["Otras deudas mensuales", amount(o.capacity.debts)],
        [
          "Proporción elegida para deudas",
          o.capacity.percent === null ? "Pendiente" : `${o.capacity.percent}%`,
        ],
        ["Presupuesto para esta hipoteca", amount(o.capacity.budget)],
      ]),
      lines: [
        "Proporción elegida del ingreso menos otras deudas, con resultado mínimo de cero. Es un presupuesto personal; no representa aprobación bancaria.",
      ],
    });
  if (o.saved.length) {
    const scenarios = [o, ...o.saved];
    sections.push({
      title: "Comparación de escenarios",
      newPage: true,
      table: {
        columns: [
          { label: "Concepto", weight: 1.65 },
          ...scenarios.map((_, i) => ({
            label: i ? `Guardado ${i}` : "Actual",
            weight: 1.2,
            align: "right" as const,
            numeric: true,
          })),
        ],
        rows: [
          ["Precio", ...scenarios.map((s) => money(s.input.price))],
          ["Crédito", ...scenarios.map((s) => money(s.result.principal))],
          ["Enganche", ...scenarios.map((s) => `${s.input.downPercent}%`)],
          [
            "Tasa nominal anual",
            ...scenarios.map((s) => `${s.input.annualRate}%`),
          ],
          [
            "Plazo solicitado",
            ...scenarios.map((s) => `${s.input.months} meses`),
          ],
          [
            "Capital + interés inicial",
            ...scenarios.map((s) => money(s.result.payment)),
          ],
          ["Intereses", ...scenarios.map((s) => money(s.result.interest))],
          [
            "Costo conocido",
            ...scenarios.map((s) => money(s.result.totalKnownCost)),
          ],
          [
            "Pagos resultantes",
            ...scenarios.map((s) => String(s.result.schedule.length)),
          ],
          [
            "Cargos pendientes",
            ...scenarios.map((s) => s.result.pending.join(", ") || "Ninguno"),
          ],
        ],
      },
      lines: [
        "Los guardados conservan los datos de su captura. Un costo parcial no identifica el crédito más barato; compara condiciones y cotizaciones completas.",
      ],
    });
    o.saved.forEach((s, i) =>
      sections.push({
        title: `Datos del escenario guardado ${i + 1}`,
        table: table(mortgageRows(s)),
        lines: [
          `Interés ahorrado: ${money(s.result.interestSaved)}. Abonos aplicados: ${money(s.result.extraPaid)}. Pendientes: ${s.result.pending.join(", ") || "Ninguno"}.`,
        ],
      }),
    );
  }
  sections.push({
    title: "Método y alcance",
    lines: [
      "Crédito bancario en MXN a tasa nominal fija, pagos mensuales vencidos e interés sobre saldo. Pagos e intereses redondeados a centavos; el último pago ajusta el saldo a cero. No simula tasas variables, UDIS ni Infonavit.",
      "Los anticipos se aplican después del pago mensual, hasta el saldo restante. Puedes mantener la cuota y reducir plazo, o recalcularla sobre los meses restantes para reducir mensualidad. El ahorro indicado es sólo de intereses; las comisiones por anticipos se contabilizan aparte.",
      "El CAT se conserva únicamente si lo capturaste de una cotización. No se calcula ni se usa como tasa nominal. Los resultados son una simulación de Fortius, no una oferta de crédito ni una aprobación de un banco.",
    ],
    links: [
      {
        label: "Banco de México · Metodología del CAT",
        url: FINANCIAL_SOURCES.cat.url,
      },
    ],
  });
  return {
    title: "Simulación de hipoteca",
    subtitle: "Resumen financiero · Importes en pesos mexicanos",
    overview: {
      primary: {
        label: "Capital e interés mensual inicial",
        value: `${money(r.payment)} MXN`,
        note: r.principal
          ? "Seguros, administración y abonos se muestran por separado."
          : "Compra de contado. No hay crédito que amortizar.",
      },
      metrics: [
        { label: "Precio de la propiedad", value: money(o.input.price) },
        { label: "Enganche", value: money(r.downPayment) },
        { label: "Crédito solicitado", value: money(r.principal) },
        { label: "Intereses", value: money(r.interest) },
        { label: "Costo conocido del crédito", value: money(r.totalKnownCost) },
        { label: "Pagos resultantes", value: `${r.schedule.length} meses` },
      ],
      pending: r.pending,
      balance: {
        principal: r.principal,
        actual: r.schedule,
        baseline: r.baseline,
      },
      breakdown: [
        { label: "Capital", amount: r.principal },
        { label: "Intereses", amount: r.interest },
        { label: "Cargos conocidos", amount: r.fees },
      ],
    },
    sections,
    ...(r.schedule.length
      ? {
          appendix: {
            title: "Calendario de pagos",
            note: "Importes en MXN. Egreso conocido = cuota + abono + seguro + administración; excluye apertura y comisión total por anticipos. Última cuota ajustada para saldo cero.",
            table: {
              columns: [
                { label: "Mes", weight: 0.45 },
                { label: "Fecha", weight: 1.05 },
                {
                  label: "Capital + interés",
                  weight: 1.35,
                  align: "right" as const,
                  numeric: true,
                },
                {
                  label: "Interés",
                  weight: 1.2,
                  align: "right" as const,
                  numeric: true,
                },
                {
                  label: "Capital",
                  weight: 1.2,
                  align: "right" as const,
                  numeric: true,
                },
                {
                  label: "Abono extra",
                  weight: 1.2,
                  align: "right" as const,
                  numeric: true,
                },
                {
                  label: "Saldo",
                  weight: 1.4,
                  align: "right" as const,
                  numeric: true,
                },
                {
                  label: "Egreso conocido",
                  weight: 1.4,
                  align: "right" as const,
                  numeric: true,
                },
              ],
              rows: r.schedule.map((row) => [
                String(row.month),
                row.date,
                ...[
                  row.payment,
                  row.interest,
                  row.principal,
                  row.extra,
                  row.balance,
                  row.knownOutlay,
                ].map((n) => money(n).replace(/^\$/, "")),
              ]),
            },
          },
        }
      : {}),
  };
}
type ClosingOptions = {
  input: BuyerBudgetInput | SellerBudgetInput;
  result: ReturnType<typeof calculateClosingBudget>;
  fx?: Fx;
  isr?: {
    mode: string;
    scope: boolean;
    cost: number | null;
    deductions: number | null;
    years: number | null;
    simulation: ReturnType<typeof calculateSellerIsr>;
  };
};
export function closingReport(o: ClosingOptions): FinancialReport {
  const { input: i, result: r } = o;
  const buyer = i.profile === "buyer";
  const sourceLabels = buyer
    ? [
        {
          label: `Ley de ingresos 2026 · ${MUNICIPALITIES[i.municipality]}`,
          url: ACQUISITION_RULES[i.municipality].url,
        },
        {
          label: "Base fiscal · Ley de Hacienda Municipal",
          url: FINANCIAL_SOURCES.fiscalBase.url,
        },
        {
          label: "Derechos de Registro 2026 · Ley estatal",
          url: FINANCIAL_SOURCES.registration.url,
        },
        ...(i.municipality === "tijuana"
          ? [
              { label: "INEGI · UMA 2026", url: FINANCIAL_SOURCES.uma2026.url },
              {
                label: "INEGI · UMA aplicable en enero de 2026",
                url: FINANCIAL_SOURCES.uma2025.url,
              },
            ]
          : []),
      ]
    : [
        {
          label: "SAT · Tarifa 2026, Anexo 8 A.I",
          url: FINANCIAL_SOURCES.isr.url,
        },
        {
          label: "Ley del ISR · Artículos 121, 124, 126 y 127",
          url: FINANCIAL_SOURCES.incomeLaw.url,
        },
      ];
  const operation = [
    ["Municipio", MUNICIPALITIES[i.municipality]],
    ["Fecha de operación", i.date],
    ["Precio", `${money(i.price)} MXN`],
    ...(o.fx
      ? [
          ["Precio original", money(o.fx.original, "USD")],
          ["Tipo de cambio capturado", `${o.fx.rate} MXN por USD`],
        ]
      : []),
  ];
  if (i.profile === "buyer")
    operation.push(
      ["Forma de compra", i.loan > 0 ? "Con crédito" : "De contado"],
      ["Enganche / precio de contado", money(i.downPayment)],
      ["Crédito", money(i.loan)],
      [
        "Base ISAI",
        `${amount(i.taxBase)}${i.baseIsAssumed ? " (precio usado como supuesto)" : ""}`,
      ],
      ["Avisos preventivos", String(i.preventiveNotices ?? 2)],
    );
  else
    operation.push(
      [
        "Comisión pactada",
        `${i.commissionPercent === null ? "Pendiente" : `${i.commissionPercent}%`}; IVA ${i.vatPercent}% ${i.commissionIncludesVat ? "incluido" : "adicional"}`,
      ],
      ["Saldo para liquidar hipoteca", amount(i.mortgagePayoff)],
    );
  const sections: FinancialReport["sections"] = [
    { title: "Datos de la operación", newPage: true, table: table(operation) },
    {
      title: "Desglose de gastos",
      table: {
        columns: [
          { label: "Concepto", weight: 1.5 },
          { label: "Importe MXN", weight: 1.05, align: "right", numeric: true },
          { label: "Origen / observación", weight: 2.1 },
        ],
        rows: r.items.map((item) => [
          item.label,
          amount(item.amount),
          `${{ rule: "Regla calculada", quote: "Cotización capturada", input: "Dato capturado", pending: "Pendiente" }[item.kind]}. ${item.note ?? ""}`,
        ]),
      },
    },
    {
      title: "Cómo se integra el resultado",
      table: table(
        buyer && i.profile === "buyer"
          ? [
              ["Enganche / precio de contado", money(i.downPayment)],
              ["Gastos conocidos", money(r.knownExpenses)],
              [
                `Efectivo inicial ${r.complete ? "estimado" : "parcial"}`,
                money(r.cashRequired!),
              ],
            ]
          : [
              ["Precio de venta", money(i.price)],
              ["Gastos conocidos a descontar", money(r.knownExpenses)],
              ["Saldo hipotecario a descontar", amount(r.knownPayoff)],
              [
                `Neto de venta ${r.complete ? "estimado" : "parcial"}`,
                money(r.sellerNet!),
              ],
            ],
      ),
      lines: r.pending.length
        ? [
            `Falta incorporar: ${r.pending.join(", ")}. El subtotal no incluye estos conceptos y cambia al completarlos.`,
          ]
        : [
            "Los conceptos del presupuesto tienen importe. El resultado mantiene los supuestos y cotizaciones capturados.",
          ],
    },
  ];
  if (o.isr?.mode === "simulate" && !buyer)
    sections.push({
      title: "ISR provisional simulado",
      table: table([
        ["Costo fiscal actualizado", amount(o.isr.cost)],
        ["Deducciones fiscales actualizadas", amount(o.isr.deductions)],
        [
          "Años fiscales capturados",
          o.isr.years === null ? "Pendiente" : String(o.isr.years),
        ],
        [
          "Alcance del caso",
          o.isr.scope ? "Confirmado por el usuario" : "Sin confirmar",
        ],
        ...(o.isr.simulation
          ? [
              [
                "Costo fiscal aplicado (mínimo legal)",
                money(o.isr.simulation.acquisitionCost),
              ],
              ["Ganancia", money(o.isr.simulation.gain)],
              ["Años aplicados (máximo 20)", String(o.isr.simulation.years)],
              ["ISR provisional total", money(o.isr.simulation.provisional)],
              ["Pago estatal acreditable", money(o.isr.simulation.state)],
              ["Resto federal", money(o.isr.simulation.federal)],
            ]
          : []),
      ]),
      lines: [
        "Persona física residente en México, propietario único y venta sin exención. Los valores fiscales deben estar previamente actualizados. El pago estatal está acreditado en el provisional; no se suma otra vez. No es la declaración anual ni determina una exención.",
      ],
    });
  sections.push({
    title: "Método, alcance y fuentes",
    lines: [
      buyer
        ? "Efectivo inicial = enganche (o precio de contado) más gastos conocidos. Los importes cotizados de ISAI y Registro sustituyen el cálculo automático, sin duplicarlo. Honorarios y gestión notarial se capturan con IVA, excluyendo ISAI y Registro."
        : "Neto de venta = precio menos gastos conocidos y saldo para liquidar hipoteca. Si el saldo está pendiente, el neto es parcial. La comisión con IVA incluido se separa; no se añade IVA dos veces. ISR capturado y simulado son opciones excluyentes.",
      "Compraventa ordinaria. No aplica exenciones ni actos especiales automáticamente, ni sustituye una liquidación de la autoridad. Campos vacíos: pendientes; cero: confirmado sin cargo. Las reglas fiscales automáticas corresponden a 2026; el Registro usa el documento estatal del 18 de junio de 2026.",
      ...(buyer
        ? [
            "En Ensenada se suma 0.25% de la base para seguridad pública. El Registro presupone una compraventa, un análisis, los avisos capturados y una nueva hipoteca si hay crédito. La base gravable se captura aparte; usar precio es sólo un supuesto.",
          ]
        : []),
    ],
    links: sourceLabels,
  });
  return {
    title: buyer ? "Presupuesto de compra" : "Presupuesto de venta",
    subtitle: `${MUNICIPALITIES[i.municipality]} · Operación ${i.date} · Importes en MXN`,
    overview: {
      primary: {
        label: buyer
          ? `Efectivo inicial ${r.complete ? "estimado" : "parcial"}`
          : `Neto de venta ${r.complete ? "estimado" : "parcial"}`,
        value: `${money((buyer ? r.cashRequired : r.sellerNet)!)} MXN`,
        note:
          buyer && i.profile === "buyer"
            ? `Incluye ${money(i.downPayment)} de ${i.loan ? "enganche" : "precio de contado"} y gastos conocidos.`
            : r.sellerNet! < 0
              ? "Los egresos superan el precio; necesitarías aportar la diferencia."
              : "Precio menos gastos conocidos y saldo hipotecario capturado.",
      },
      metrics: [
        {
          label: buyer ? "Precio de compra" : "Precio de venta",
          value: money(i.price),
        },
        { label: "Gastos conocidos", value: money(r.knownExpenses) },
        {
          label:
            buyer && i.profile === "buyer"
              ? "Crédito solicitado"
              : "Liquidación hipotecaria",
          value:
            buyer && i.profile === "buyer"
              ? money(i.loan)
              : amount(r.knownPayoff),
        },
      ],
      pending: r.pending,
      breakdown: r.items
        .filter((item) => item.amount !== null)
        .map((item) => ({ label: item.label, amount: item.amount! })),
    },
    sections,
  };
}
