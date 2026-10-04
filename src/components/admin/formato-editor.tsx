"use client";
import { Fragment } from "react";
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
import { mostrarCampoAviso } from "@/lib/formatos/aviso";
import { JuridicaRowsEditor } from "@/components/admin/juridica-rows-editor";
import { JURIDICA_TABLES, type JuridicaTable } from "@/lib/formatos/juridica";
import { isLevantamiento, LEVANTAMIENTO_TABLES, type LevantamientoTable } from "@/lib/formatos/levantamiento";
import { LevantamientoRowsEditor } from "@/components/admin/levantamiento-rows-editor";

export function FormatoEditor({ definition, values, onChange }: {
  definition: FormatoDefinition;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}) {
  const shownFields = definition.id === "02" ? definition.fields.filter((field) => mostrarCampoEntrevista(field.key, values)) : definition.id === "01" ? definition.fields.filter((field) => mostrarCampoAviso(field.key, values)) : definition.fields;
  return <div className="grid gap-5 md:grid-cols-2">
    {shownFields.map((field, index) => {
      const isOffer = definition.id === "14";
      if (isLevantamiento(definition.id) && ["fotoPrincipalId", "croquisId"].includes(field.key)) return null;
      if (isLevantamiento(definition.id) && (field.key === "respaldos" && values.respaldosEstado !== "registrados" || field.key === "discrepancias" && values.discrepanciasEstado !== "registradas" || field.key === "unidades" && !["completo", "parcial"].includes(String(values.unidadesEstado)))) return null;
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
      const wide = field.type === "long" || field.type === "partidas" || field.type === "pagos" || field.type === "netoCargos" || field.type === "entregaRows" || field.type === "planRows" || field.type === "reporteRows" || field.type === "entrevistaRows" || field.type === "juridicaRows" || field.type === "levantamientoRows";
      return <Fragment key={field.key}>
        {field.section && (index === 0 || shownFields[index - 1].section !== field.section) && <h2 className="mt-3 border-b border-border pb-2 text-base font-semibold text-foreground md:col-span-2">{field.section}</h2>}
        <div className={wide ? "md:col-span-2" : ""}>
        {field.type === "partidas" || field.type === "pagos" || field.type === "netoCargos" || field.type === "entregaRows" || field.type === "planRows" || field.type === "reporteRows" || field.type === "entrevistaRows" || field.type === "juridicaRows" || field.type === "levantamientoRows" ? <h3 className="mb-1.5 text-sm font-medium text-foreground">{field.label}</h3> : <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-foreground">{field.label}</label>}
        {field.type === "levantamientoRows" && field.key in LEVANTAMIENTO_TABLES ? <LevantamientoRowsEditor kind={field.key as LevantamientoTable} value={value} onChange={(rows) => onChange(field.key, rows)} />
        : field.type === "juridicaRows" && field.key in JURIDICA_TABLES ? <JuridicaRowsEditor kind={field.key as JuridicaTable} value={value} onChange={(rows) => onChange(field.key, rows)} />
        : field.type === "entrevistaRows" && field.key in ENTREVISTA_TABLES ? <EntrevistaRowsEditor kind={field.key as EntrevistaTable} value={value} onChange={(rows) => onChange(field.key, rows)} />
        : field.type === "reporteRows" && field.key in REPORTE_TABLES ? <ReporteRowsEditor kind={field.key as ReporteTable} value={value} onChange={(rows) => onChange(field.key, rows)} />
        : field.type === "planRows" && field.key in PLAN_TABLES ? <PlanRowsEditor kind={field.key as PlanTable} value={value} onChange={(rows) => onChange(field.key, rows)} />
        : field.type === "entregaRows" && field.key in ENTREGA_TABLAS ? <EntregaRowsEditor kind={field.key as EntregaTabla} value={value} onChange={(rows) => onChange(field.key, rows)} />
        : field.type === "netoCargos" ? <NetExpenseEditor value={value} onChange={(rows) => onChange(field.key, rows)} />
        : field.type === "partidas" || field.type === "pagos" ? <BudgetRowsEditor kind={field.type} value={value} onChange={(rows) => onChange(field.key, rows)} />
        : field.key === "folio" ? <input id={id} type="text" readOnly value={String(value)} className={inputClass} />
        : field.type === "choice" ? <select id={id} required={required} value={String(value)} onChange={(event) => onChange(field.key, event.target.value)} className={selectClass}>
          <option value="">Selecciona</option>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select> : field.key === "pagoParcialTotal" ? <select id={id} required={required} value={String(value)} onChange={(event) => onChange(field.key, event.target.value)} className={selectClass}>
          <option value="">Selecciona</option><option value="total">Total</option><option value="parcial">Parcial</option>
        </select> : field.key === "moneda" || field.key === "monedaSaldo" ? <select id={id} required={required} value={String(value)} onChange={(event) => onChange(field.key, event.target.value)} className={selectClass}>
          <option value="">Selecciona</option><option value="MXN">MXN</option><option value="USD">USD</option>
        </select> : wide ? <textarea id={id} required={required} rows={4} value={String(value)} onChange={(event) => onChange(field.key, event.target.value)} className={textareaClass} />
          : <input id={id} required={required} type={field.type === "date" ? "date" : field.type === "time" ? "time" : field.type === "money" || field.type === "number" ? "number" : "text"}
              step={field.type === "money" ? "0.01" : field.type === "number" ? "any" : undefined}
              min={field.type === "money" || field.type === "number" ? 0 : undefined}
              value={String(value)} onChange={(event) => onChange(field.key, field.type === "money" || field.type === "number" ? event.target.value === "" ? "" : Number(event.target.value) : event.target.value)} className={inputClass} />}
        </div>
      </Fragment>;
    })}
  </div>;
}
