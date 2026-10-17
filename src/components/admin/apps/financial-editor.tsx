"use client";

import Link from "next/link";
import { useId, useState, type ReactNode } from "react";
import { btnDanger, btnGhost, btnPrimary, ErrorNotice, Field, inputClass, selectClass, textareaClass } from "@/components/admin/ui";
import { calculateFinancial, getFinancialDefaults, rehabilitationTransfer } from "@/lib/apps/financial";
import { localToday } from "@/lib/finance/money";
import type { AppEditorProps, AppInput } from "@/lib/apps/types";
import { MoneyInput } from "@/components/admin/money-input";

type Option = [string, string];
type Column = { key: string; label: string; type?: "text" | "number" | "date"; options?: Option[]; width?: string };
const textValue = (value: unknown) => typeof value === "string" || typeof value === "number" ? String(value) : "";
const record = (value: unknown): AppInput => value !== null && typeof value === "object" && !Array.isArray(value) ? value as AppInput : {};
const list = (value: unknown): AppInput[] => Array.isArray(value) ? value.map(record) : [];
const currencies: Option[] = [["MXN", "Pesos mexicanos (MXN)"], ["USD", "Dólares estadounidenses (USD)"]];
const scenarios: Option[] = [["base", "Base"], ["favorable", "Favorable"], ["adverso", "Adverso"]];
const layers: Option[] = [["proyecto", "Proyecto"], ["deuda", "Deuda"], ["capital", "Capital del inversionista"]];
const evidence: Option[] = [["supuesto", "Supuesto"], ["declarado", "Declarado"], ["documentado", "Documentado"], ["desconocido", "Desconocido"]];

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return <fieldset className="min-w-0 space-y-4 rounded-lg border border-border p-4 sm:p-5"><legend className="px-2 font-semibold text-foreground">{title}</legend>{hint && <p className="max-w-[90ch] text-sm leading-relaxed text-muted-foreground">{hint}</p>}{children}</fieldset>;
}
/** Importes de las calculadoras: se muestran con formato de moneda. */
const MONEY_KEYS = new Set(["amount", "base", "commission", "extraMonthly", "extraOnce", "fixed", "insurance", "loan", "monthlyFee", "openingFee", "prepaymentFee", "price", "salePrice", "taxes", "withholding"]);
function Capture({ label, value, onChange, type = "number", hint, money = false }: { label: string; value: unknown; onChange: (value: string) => void; type?: "text" | "number" | "date"; hint?: string; money?: boolean }) {
  const id = useId();
  if (money) return <Field label={label} htmlFor={id} hint={hint}><MoneyInput id={id} value={textValue(value) === "" ? "" : Number(textValue(value))} onValueChange={(next) => onChange(next === "" ? "" : String(next))} /></Field>;
  return <Field label={label} htmlFor={id} hint={hint}><input id={id} className={inputClass} type={type} step={type === "number" ? "any" : undefined} inputMode={type === "number" ? "decimal" : undefined} value={textValue(value)} onChange={(event) => onChange(event.target.value)} /></Field>;
}
function Choice({ label, value, onChange, options, hint }: { label: string; value: unknown; onChange: (value: string) => void; options: Option[]; hint?: string }) {
  const id = useId();
  return <Field label={label} htmlFor={id} hint={hint}><select id={id} className={selectClass} value={textValue(value)} onChange={(event) => onChange(event.target.value)}>{options.map(([v, label]) => <option key={v} value={v}>{label}</option>)}</select></Field>;
}
function Rows({ title, singular, rows, columns, blank, addLabel, max, onChange }: { title: string; singular: string; rows: AppInput[]; columns: Column[]; blank: AppInput; addLabel: string; max: number; onChange: (rows: AppInput[]) => void }) {
  return <div className="min-w-0 space-y-3">
    {rows.length ? <div className="max-w-full overflow-x-auto rounded-md border border-border" role="region" aria-label={title} tabIndex={0}><table className="w-full border-collapse text-left text-sm"><caption className="sr-only">{title}. Puedes desplazarte horizontalmente para editar todas las columnas.</caption><thead className="bg-secondary"><tr>{columns.map((c) => <th scope="col" key={c.key} className="whitespace-nowrap px-3 py-3 font-medium">{c.label}</th>)}<th scope="col" className="px-3 py-3">Acciones</th></tr></thead><tbody>{rows.map((row, index) => <tr key={index} className="border-t border-border">{columns.map((column) => <td key={column.key} className={`p-2 align-top ${column.width ?? "min-w-40"}`}>{column.options ? <select aria-label={`${column.label} ${index + 1}`} className={selectClass} value={textValue(row[column.key])} onChange={(event) => onChange(rows.map((r, i) => i === index ? { ...r, [column.key]: event.target.value } : r))}>{column.options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select> : <input aria-label={`${column.label} ${index + 1}`} className={inputClass} type={column.type ?? "text"} step={column.type === "number" ? "any" : undefined} inputMode={column.type === "number" ? "decimal" : undefined} value={textValue(row[column.key])} onChange={(event) => onChange(rows.map((r, i) => i === index ? { ...r, [column.key]: event.target.value } : r))} />}</td>)}<td className="p-2 align-top"><button type="button" className={btnDanger} aria-label={`Eliminar ${singular} ${index + 1}`} onClick={() => onChange(rows.filter((_, i) => i !== index))}>Eliminar</button></td></tr>)}</tbody></table></div> : <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">Aún no hay registros. Agrega el primero para capturar el detalle.</p>}
    <div className="flex flex-wrap items-center gap-3"><button type="button" className={btnGhost} disabled={rows.length >= max} onClick={() => onChange([...rows, { ...blank }])}>{addLabel}</button><span className="text-sm text-muted-foreground">{rows.length} de {max}</span></div>
  </div>;
}

const grid = "grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3";
const actions: Record<string, string> = { hipoteca: "Calcular hipoteca", "neto-propietario": "Calcular neto", comisiones: "Calcular honorarios", inversiones: "Evaluar inversión", rehabilitacion: "Calcular presupuesto", conversor: "Convertir" };

export function FinancialEditor({ slug, input, onChange, onResult, context }: AppEditorProps) {
  const [error, setError] = useState<string | null>(null);
  const [prepared, setPrepared] = useState(false);
  const notesId = useId();
  const data = { ...getFinancialDefaults(slug), ...input };
  const change = (patch: AppInput) => {
    setError(null);
    if (prepared) {
      try { sessionStorage.removeItem("fortius.apps.inversiones.transfer.v1"); }
      catch { /* Browser storage can become unavailable; editing still works. */ }
    }
    setPrepared(false);
    onChange({ ...data, ...patch });
  };
  const field = (key: string, label: string, hint?: string, type: "number" | "text" | "date" = "number") => <Capture key={key} label={label} value={data[key]} hint={hint} type={type} money={type === "number" && MONEY_KEYS.has(key)} onChange={(value) => change({ [key]: value })} />;
  const choice = (key: string, label: string, options: Option[], hint?: string) => <Choice label={label} value={data[key]} options={options} hint={hint} onChange={(value) => change({ [key]: value })} />;
  const currencyField = choice("currency", "Moneda del cálculo", currencies, "Todos los importes deben estar en esta moneda.");
  const rates = record(data.rates);
  const units: Option[] = data.category === "moneda" ? [["MXN", "MXN"], ["USD", "USD"]] : data.category === "longitud" ? [["m", "Metros (m)"], ["ft", "Pies (ft)"]] : [["m2", "Metros cuadrados (m²)"], ["ft2", "Pies cuadrados (ft²)"], ["ha", "Hectáreas (ha)"]];

  return <form className="min-w-0 space-y-5" noValidate onSubmit={(event) => {
    event.preventDefault();
    setError(null);
    try { onResult(calculateFinancial(slug, data)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo calcular. Revisa los datos."); }
  }}>
    {slug === "hipoteca" && <>
      <Section title="Condiciones del crédito" hint="Importes en pesos mexicanos. Captura las condiciones ofrecidas para el escenario; la tasa no se consulta automáticamente."><div className={grid}>
        {field("price", "Precio del inmueble")}{field("downPercent", "Enganche (%)")}{field("annualRate", "Tasa nominal anual (%)", "Entre 0% y 25%; se divide entre doce para el cálculo mensual.")}{field("months", "Plazo en meses", "De 1 a 360 meses.")}{field("firstPayment", "Fecha del primer pago", undefined, "date")}
      </div></Section>
      <Section title="Seguros y comisiones" hint="Deja vacío un costo desconocido. Escribe 0 únicamente si confirmaste que no aplica."><div className={grid}>{field("insurance", "Seguro mensual")}{field("monthlyFee", "Administración mensual")}{field("openingFee", "Comisión de apertura", "Importe único.")}{field("prepaymentFee", "Comisiones por anticipos", "Importe total por todos los anticipos del escenario.")}</div></Section>
      <Section title="Pagos anticipados" hint="El escenario sin anticipos se conserva en el resultado para comparar intereses y plazo."><div className={grid}>{field("extraMonthly", "Anticipo mensual")}{field("extraOnce", "Anticipo único")}{field("extraMonth", "Mes del anticipo único")}{choice("prepaymentMode", "Aplicar anticipos a", [["term", "Reducir plazo"], ["payment", "Reducir mensualidad"]])}</div></Section>
    </>}
    {slug === "neto-propietario" && <>
      <Section title="Venta y cargos principales" hint="Captura importes pendientes al cierre. Vacío significa desconocido; 0 significa que confirmaste que no aplica."><div className={grid}>{currencyField}{field("salePrice", "Precio de venta")}{field("loan", "Saldo para liquidar el crédito")}{field("commission", "Honorarios con impuestos", "Importe total pendiente; no lo repitas en otros gastos.")}{field("taxes", "Impuestos de la operación", "Importe estimado o cotizado; no se calcula ISR automáticamente.")}</div></Section>
      <Section title="Otros gastos" hint="Los gastos ya pagados se muestran como históricos. Solo los pendientes conocidos se restan del precio de venta."><Rows title="Gastos del propietario" singular="gasto" rows={list(data.expenses)} onChange={(expenses) => change({ expenses })} max={200} addLabel="Agregar gasto" blank={{ concept: "", amount: null, status: "pendiente" }} columns={[{ key: "concept", label: "Concepto", width: "min-w-60" }, { key: "amount", label: "Importe", type: "number" }, { key: "status", label: "Estado", options: [["pendiente", "Pendiente de pago"], ["pagado", "Histórico ya pagado"]] }]} /></Section>
    </>}
    {slug === "comisiones" && <>
      <Section title="Honorarios" hint="Indica la base pactada o un honorario fijo. Los impuestos y las retenciones requieren captura expresa."><div className={grid}>{currencyField}{choice("mode", "Forma de honorarios", [["porcentaje", "Porcentaje sobre una base"], ["fijo", "Importe fijo"]])}{data.mode === "fijo" ? field("fixed", "Honorario fijo") : <>{field("base", "Base de honorarios")}{field("percent", "Porcentaje de honorarios")}</>}{field("taxPercent", "Impuesto trasladado (%)", "Vacío si se desconoce; 0 si confirmaste que no aplica.")}{field("withholding", "Retenciones (importe)", "Importe, no porcentaje. Vacío si se desconoce.")}</div></Section>
      <Section title="Distribución" hint="Se reparte el honorario antes de impuestos. La suma puede ser menor a 100%; el resto queda sin asignar. Los centavos se concilian en el resultado."><Rows title="Reparto de honorarios" singular="participante" rows={list(data.shares)} onChange={(shares) => change({ shares })} max={100} addLabel="Agregar participante" blank={{ name: "", percent: "" }} columns={[{ key: "name", label: "Participante", width: "min-w-60" }, { key: "percent", label: "Participación (%)", type: "number" }]} /></Section>
    </>}
    {slug === "inversiones" && <>
      <Section title="Base de la evaluación" hint="Captura flujos nominales fechados: entradas positivas y salidas negativas. Los tres escenarios se calculan por separado, sin probabilidades supuestas."><div className={grid}>{currencyField}{choice("taxBasis", "Tratamiento de impuestos", [["antes", "Antes de impuestos"], ["despues", "Después de impuestos capturados"]])}{layers.map(([layer, label]) => <Capture key={layer} label={`Tasa exigida: ${label} (%)`} value={rates[layer]} hint="Efectiva anual. Vacío: VAN no determinado." onChange={(value) => change({ rates: { ...rates, [layer]: value } })} />)}</div><label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1 h-5 w-5 accent-primary" checked={data.costsComplete === true} onChange={(event) => change({ costsComplete: event.target.checked })} /><span>Confirmé que el modelo incluye todos los costos, impuestos y obligaciones aplicables a la base elegida.</span></label></Section>
      <Section title="Flujos por escenario y capa" hint="Proyecto: economía del activo sin deuda. Deuda: disposiciones, intereses y amortizaciones. Capital: aportaciones y distribuciones del inversionista. No sumes las tres capas. Un importe vacío conserva el pendiente e impide determinar las métricas de su capa.">
        <Rows title="Flujos de inversión" singular="flujo" rows={list(data.flows)} onChange={(flows) => change({ flows })} max={600} addLabel="Agregar flujo" blank={{ scenario: "base", layer: "proyecto", date: localToday(), concept: "", amount: null, source: "", evidence: "supuesto" }} columns={[{ key: "scenario", label: "Escenario", options: scenarios }, { key: "layer", label: "Capa", options: layers, width: "min-w-64" }, { key: "date", label: "Fecha", type: "date" }, { key: "concept", label: "Concepto", width: "min-w-60" }, { key: "amount", label: "Importe", type: "number" }, { key: "evidence", label: "Evidencia", options: evidence }, { key: "source", label: "Fuente", width: "min-w-64" }]} />
        <div className="flex flex-wrap gap-2">{(["favorable", "adverso"] as const).map((target) => <button key={target} type="button" className={btnGhost} disabled={!list(data.flows).some((r) => r.scenario === "base") || list(data.flows).some((r) => r.scenario === target) || list(data.flows).length + list(data.flows).filter((r) => r.scenario === "base").length > 600} onClick={() => change({ flows: [...list(data.flows), ...list(data.flows).filter((r) => r.scenario === "base").map((r) => ({ ...r, scenario: target }))] })}>Copiar base a {target}</button>)}</div>
        <p className="text-sm text-muted-foreground">La copia inicia un escenario vacío. Revisa importes y fechas para representar una alternativa distinta.</p>
      </Section>
      <Section title="Supuestos y límites"><Field label="Supuestos adicionales" htmlFor={notesId}><textarea id={notesId} rows={4} maxLength={4000} className={textareaClass} value={textValue(data.notes)} onChange={(event) => change({ notes: event.target.value })} /></Field><p className="text-sm text-muted-foreground">ROI sobre egresos brutos; VAN con días efectivos / 365; TIR anual solo cuando el patrón permite una raíz convencional. La disponibilidad de capital y la viabilidad jurídica requieren revisión independiente del rendimiento.</p></Section>
    </>}
    {slug === "rehabilitacion" && <>
      <Section title="Presupuesto de obra" hint="Precios unitarios antes de impuestos. La contingencia se aplica al subtotal más impuestos y se incluye en el calendario de desembolsos."><div className={grid}>{currencyField}{field("contingencyPercent", "Contingencia (%)")}</div><Rows title="Partidas de rehabilitación" singular="partida" rows={list(data.items)} onChange={(items) => change({ items })} max={200} addLabel="Agregar partida" blank={{ concept: "", unit: "", quantity: "", price: "", taxPercent: "" }} columns={[{ key: "concept", label: "Concepto", width: "min-w-60" }, { key: "unit", label: "Unidad" }, { key: "quantity", label: "Cantidad", type: "number" }, { key: "price", label: "Precio unitario", type: "number" }, { key: "taxPercent", label: "Impuesto (%)", type: "number" }]} /></Section>
      <Section title="Calendario de desembolsos" hint="Distribuye exactamente el 100% del presupuesto. Los pagos se redondean conservando el total al centavo."><Rows title="Desembolsos de rehabilitación" singular="desembolso" rows={list(data.payments)} onChange={(payments) => change({ payments })} max={100} addLabel="Agregar desembolso" blank={{ concept: "", date: localToday(), percent: "" }} columns={[{ key: "date", label: "Fecha de pago", type: "date" }, { key: "concept", label: "Descripción del pago", width: "min-w-60" }, { key: "percent", label: "Proporción (%)", type: "number" }]} /></Section>
    </>}
    {slug === "conversor" && <>
      <Section title="Conversión" hint="Selecciona unidades de la misma magnitud. El tipo de cambio se captura manualmente y queda conservado con su fuente y fecha."><div className={grid}><Choice label="Magnitud" value={data.category} options={[["area", "Superficie"], ["longitud", "Longitud"], ["moneda", "Moneda"]]} onChange={(category) => change({ category, from: category === "moneda" ? "MXN" : category === "longitud" ? "m" : "m2", to: category === "moneda" ? "USD" : category === "longitud" ? "ft" : "ft2" })} />{field("amount", "Cantidad")}{choice("from", "De", units)}{choice("to", "A", units)}</div></Section>
      {data.category === "moneda" && <Section title="Tipo de cambio capturado"><div className={grid}>{field("rate", "MXN por USD", "Cuántos pesos mexicanos equivalen a un dólar.")}{field("rateSource", "Fuente del tipo de cambio", "Institución, cotización o referencia utilizada.", "text")}{field("rateDate", "Fecha del tipo de cambio", undefined, "date")}</div></Section>}
    </>}
    <ErrorNotice error={error} />
    <div className="flex flex-wrap items-center gap-3"><button type="submit" className={btnPrimary}>{actions[slug]}</button>{slug === "rehabilitacion" && <button type="button" className={btnGhost} onClick={() => {
      setError(null);
      try {
        const transfer = rehabilitationTransfer(data);
        sessionStorage.setItem("fortius.apps.inversiones.transfer.v1", JSON.stringify({ version: 1, source: "rehabilitacion", input: transfer, context, createdAt: new Date().toISOString() }));
        onResult(calculateFinancial(slug, data));
        setPrepared(true);
      } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo preparar la transferencia."); }
    }}>Preparar para inversión</button>}</div>
    {prepared && <div className="space-y-2 rounded-md border border-border bg-secondary p-4"><p role="status" className="text-sm">Presupuesto preparado para revisar en inversión. Se incorporará como egresos del proyecto en los tres escenarios.</p><Link className={btnGhost} href="/admin/apps/inversiones?importar=rehabilitacion">Abrir inversión con este presupuesto</Link></div>}
  </form>;
}
