"use client";
import { MoneyInput } from "@/components/admin/money-input";
import { Fragment } from "react";
import { AvisoEditor } from "./aviso-editor";
import type { FormatoDefinition } from "@/lib/formatos/catalog";
import { inputClass, selectClass, textareaClass } from "@/components/admin/ui";
import { BudgetRowsEditor } from "@/components/admin/budget-rows-editor";
import { NetExpenseEditor } from "@/components/admin/net-expense-editor";
import { EntregaRowsEditor } from "@/components/admin/entrega-rows-editor";
import { ENTREGA_TABLAS, type EntregaTabla } from "@/lib/formatos/entrega";
import { respuestaRequiereRatificacion } from "@/lib/formatos/oferta";
import { PlanRowsEditor } from "@/components/admin/plan-rows-editor";
import { PLAN_TABLES, type PlanTable } from "@/lib/formatos/plan";
import { ReporteRowsEditor } from "@/components/admin/reporte-rows-editor";
import { REPORTE_TABLES, type ReporteTable } from "@/lib/formatos/reporte";
import { ENTREVISTA_TABLES, mostrarCampoEntrevista, type EntrevistaTable } from "@/lib/formatos/entrevista";
import { EntrevistaRowsEditor } from "@/components/admin/entrevista-rows-editor";
import { JuridicaRowsEditor } from "@/components/admin/juridica-rows-editor";
import { JURIDICA_TABLES, type JuridicaTable } from "@/lib/formatos/juridica";
import { isLevantamiento, LEVANTAMIENTO_TABLES, type LevantamientoTable } from "@/lib/formatos/levantamiento";
import { LevantamientoRowsEditor } from "@/components/admin/levantamiento-rows-editor";
import { mostrarCampoValor } from "@/lib/formatos/valor-fields";
import { ValorRowsEditor } from "@/components/admin/valor-rows-editor";
import { ValorCalculation } from "@/components/admin/valor-calculation";
import { mostrarCampoPromesa, PROMESA_TABLES, type PromesaTable } from "@/lib/formatos/promesa";
import { PromesaRowsEditor } from "./promesa-rows-editor";
import { PromesaReview } from "./promesa-review";
import { mostrarCampoIntermediacion, INTERMEDIACION_TABLES, type IntermediacionTable } from "@/lib/formatos/intermediacion";
import { IntermediacionRowsEditor } from "./intermediacion-rows-editor";
import { IntermediacionSummary } from "./intermediacion-summary";
import { confirmAction } from "@/components/admin/workspace/confirm";
import { AssistedLabel, ChoiceOrOther, TemplateMenu } from "@/components/admin/field-assist";
import { aplicarPlantilla, ayudaCampo, ayudaSeccion, plantillasCampo } from "@/lib/formatos/ayuda";

export function FormatoEditor({ definition, values, onChange, images, extras = true }: {
  definition: FormatoDefinition;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  images?: { id: string; kind: string; caption: string }[];
  /** Cálculos y resúmenes al pie (07, 09, 15); la captura por secciones los muestra solo en la última. */
  extras?: boolean;
}) {
  if (definition.id === "01") return <AvisoEditor definition={definition} values={values} onChange={onChange} />;
  const shownFields = definition.id === "09" ? definition.fields.filter((field) => mostrarCampoIntermediacion(field.key, values)) : definition.id === "15" ? definition.fields.filter((field) => mostrarCampoPromesa(field.key, values)) : definition.id === "07" ? definition.fields.filter((field) => mostrarCampoValor(field.key, values)).map((field) => values.baseMercado === "terreno" && field.section?.startsWith("06") ? { ...field, section: "05 / Comparables de terreno" } : field) : definition.id === "02" ? definition.fields.filter((field) => mostrarCampoEntrevista(field.key, values)) : definition.fields;
  // En la captura por secciones la pantalla ya lleva el título de la sección; no se repite.
  const singleSection = new Set(shownFields.map(field => field.section)).size === 1;
  return <div className="grid gap-5 md:grid-cols-2">
    {shownFields.map((field, index) => {
      const isOffer = definition.id === "14";
      if ((isLevantamiento(definition.id) || definition.id === "07") && ["fotoPrincipalId", "croquisId"].includes(field.key)) return null;
      const creditFields = ["institucionCredito", "estadoCredito"];
      const responseFields = ["lugarRespuesta", "fechaRespuesta", "horaRespuesta", "caracterPropietario", "decisionPropietario", "motivoRespuesta"];
      const counterFields = ["precioContraoferta", "monedaContraoferta", "impuestosContraoferta", "cambiosContraoferta", "fechaLimiteContraoferta", "horaLimiteContraoferta"];
      if (isOffer && creditFields.includes(field.key) && !(typeof values.credito === "number" && values.credito > 0)) return null;
      if (isOffer && [...responseFields, ...counterFields].includes(field.key) && values.estadoRespuesta !== "registrada") return null;
      if (isOffer && counterFields.includes(field.key) && values.decisionPropietario !== "contraoferta") return null;
      if (isOffer && field.key === "confirmacionVigencia" && !respuestaRequiereRatificacion(values)) return null;
      if (definition.id === "10" && ["nombreAprobador", "fechaAprobacion", "acuseAprobacion"].includes(field.key) && values.estadoAprobacion !== "registrada") return null;
      const isReport = definition.id === "11";
      if (isReport && [["contactos", "contactosEstado"], ["visitas", "visitasEstado"], ["ofertas", "ofertasEstado"]].some(([key, state]) => field.key === key && values[state] !== "comprobado")) return null;
      if (isReport && ["agendadas", "realizadas", "canceladas", "reprogramadas", "pendientes"].includes(field.key) && values.registroVisitas !== "comprobado") return null;
      if (isReport && ["monedaPublicidad", "publicidad", "saldoInicial", "fondosRecibidos", "fondosAplicados", "fondosDevueltos", "pagosDirectos", "soporteSaldo"].includes(field.key) && values.publicidadEstado !== "contratada") return null;
      if (isReport && field.key === "constanciaRespuesta" && values.estadoRespuestaPropietario !== "recibida") return null;
      if (isReport && ["fechaEntregaInforme", "medioEntregaInforme", "acuseInforme"].includes(field.key) && values.entregaInformeEstado !== "entregado") return null;
      const required = field.required || isOffer && (creditFields.includes(field.key) && typeof values.credito === "number" && values.credito > 0 || responseFields.includes(field.key) && values.estadoRespuesta === "registrada" || counterFields.includes(field.key) && values.decisionPropietario === "contraoferta" || field.key === "confirmacionVigencia" && respuestaRequiereRatificacion(values)) || definition.id === "10" && ["nombreAprobador", "fechaAprobacion", "acuseAprobacion"].includes(field.key) && values.estadoAprobacion === "registrada";
      const id = `formato-${field.key}`;
      const value = values[field.key] ?? "";
      const help = ayudaCampo(definition.id, field.key), templates = plantillasCampo(definition.id, field.key);
      const describedBy = help ? `${id}-ayuda` : undefined;
      async function applyTemplate(text: string) {
        const next = aplicarPlantilla(text, values), current = String(value).trim();
        if (current && current !== next && !await confirmAction("Esto reemplaza lo que ya escribiste en este campo. ¿Usar la plantilla?")) return;
        onChange(field.key, next);
      }
      const wide = field.type === "intermediacionRows" || field.type === "promesaRows" || field.type === "valorRows" || field.type === "long" || field.type === "partidas" || field.type === "pagos" || field.type === "netoCargos" || field.type === "entregaRows" || field.type === "planRows" || field.type === "reporteRows" || field.type === "entrevistaRows" || field.type === "juridicaRows" || field.type === "levantamientoRows";
      return <Fragment key={field.key}>
        {field.section && (index === 0 || shownFields[index - 1].section !== field.section) && <div className={singleSection ? "md:col-span-2" : "mt-3 md:col-span-2"}>{!singleSection && <h2 className="border-b border-border pb-2 text-base font-semibold text-foreground">{field.section}</h2>}{ayudaSeccion(definition.id, field.section) && <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">{ayudaSeccion(definition.id, field.section)}</p>}</div>}
        <div className={`group ${wide ? "md:col-span-2" : ""}`}>
        {field.type === "intermediacionRows" || field.type === "promesaRows" || field.type === "valorRows" || field.type === "partidas" || field.type === "pagos" || field.type === "netoCargos" || field.type === "entregaRows" || field.type === "planRows" || field.type === "reporteRows" || field.type === "entrevistaRows" || field.type === "juridicaRows" || field.type === "levantamientoRows"
          ? <><h3 className="mb-1.5 text-sm font-medium text-foreground">{field.label}</h3>{help && <p id={describedBy} className="mb-2 text-xs leading-relaxed text-muted-foreground">{help}</p>}</>
          : <AssistedLabel id={id} label={field.label} help={help}>{templates.length > 0 && wide && <TemplateMenu label={field.label} templates={templates} onPick={text => void applyTemplate(text)} />}</AssistedLabel>}
        {field.type === "intermediacionRows" && field.key in INTERMEDIACION_TABLES ? <IntermediacionRowsEditor kind={field.key as IntermediacionTable} value={value} onChange={(rows) => onChange(field.key, rows)} />
        : field.type === "promesaRows" && field.key in PROMESA_TABLES ? <PromesaRowsEditor kind={field.key as PromesaTable} value={value} onChange={(rows) => onChange(field.key, rows)} />
        : field.type === "valorRows" ? <ValorRowsEditor kind={field.key} value={value} images={images} onChange={(rows) => onChange(field.key, rows)} />
        : field.type === "levantamientoRows" && field.key in LEVANTAMIENTO_TABLES ? <LevantamientoRowsEditor kind={field.key as LevantamientoTable} value={value} onChange={(rows) => onChange(field.key, rows)} />
        : field.type === "juridicaRows" && field.key in JURIDICA_TABLES ? <JuridicaRowsEditor kind={field.key as JuridicaTable} value={value} onChange={(rows) => onChange(field.key, rows)} />
        : field.type === "entrevistaRows" && field.key in ENTREVISTA_TABLES ? <EntrevistaRowsEditor kind={field.key as EntrevistaTable} value={value} onChange={(rows) => onChange(field.key, rows)} />
        : field.type === "reporteRows" && field.key in REPORTE_TABLES ? <ReporteRowsEditor kind={field.key as ReporteTable} value={value} onChange={(rows) => onChange(field.key, rows)} />
        : field.type === "planRows" && field.key in PLAN_TABLES ? <PlanRowsEditor kind={field.key as PlanTable} value={value} onChange={(rows) => onChange(field.key, rows)} />
        : field.type === "entregaRows" && field.key in ENTREGA_TABLAS ? <EntregaRowsEditor kind={field.key as EntregaTabla} value={value} onChange={(rows) => onChange(field.key, rows)} />
        : field.type === "netoCargos" ? <NetExpenseEditor value={value} onChange={(rows) => onChange(field.key, rows)} />
        : field.type === "partidas" || field.type === "pagos" ? <BudgetRowsEditor kind={field.type} value={value} onChange={(rows) => onChange(field.key, rows)} />
        : field.key === "folio" ? <input id={id} type="text" readOnly value={String(value)} className={inputClass} />
        : field.type === "choice" ? <select id={id} aria-describedby={describedBy} required={required} value={String(value)} onChange={(event) => onChange(field.key, event.target.value)} className={selectClass}>
          <option value="">Selecciona</option>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select> : field.key === "pagoParcialTotal" ? <select id={id} required={required} value={String(value)} onChange={(event) => onChange(field.key, event.target.value)} className={selectClass}>
          <option value="">Selecciona</option><option value="total">Total</option><option value="parcial">Parcial</option>
        </select> : field.key === "moneda" || field.key === "monedaSaldo" ? <select id={id} required={required} value={String(value)} onChange={(event) => onChange(field.key, event.target.value)} className={selectClass}>
          <option value="">Selecciona</option><option value="MXN">MXN</option><option value="USD">USD</option>
        </select> : !wide && templates.length >= 3 && field.type === "text" ? <ChoiceOrOther id={id} value={String(value)} templates={templates} required={required} describedBy={describedBy} onChange={(next) => onChange(field.key, next)} />
        : field.type === "money" ? <MoneyInput id={id} aria-describedby={describedBy} required={required} value={value} onValueChange={(next) => onChange(field.key, next)} />
        : wide ? <textarea id={id} aria-describedby={describedBy} required={required} rows={4} value={String(value)} onChange={(event) => onChange(field.key, event.target.value)} className={textareaClass} />
          : <input id={id} aria-describedby={describedBy} required={required} type={field.type === "date" ? "date" : field.type === "time" ? "time" : field.type === "number" ? "number" : "text"}
              step={field.type === "number" ? "any" : undefined}
              min={field.type === "number" ? 0 : undefined}
              value={String(value)} onChange={(event) => onChange(field.key, field.type === "number" ? event.target.value === "" ? "" : Number(event.target.value) : event.target.value)} className={inputClass} />}
        </div>
      </Fragment>;
    })}
    {extras && definition.id === "07" && <ValorCalculation values={values} />}
    {extras && definition.id === "09" && <IntermediacionSummary values={values} />}
    {extras && definition.id === "15" && <PromesaReview values={values} onChange={onChange} />}
  </div>;
}
