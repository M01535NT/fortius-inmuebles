"use client";
import { promesaFields, mostrarCampoPromesa, promesaReviewSnapshot, validarPromesa } from "@/lib/formatos/promesa";
import { btnGhost } from "./ui";

export function PromesaReview({ values, onChange }: { values: Record<string, unknown>; onChange: (key: string, value: unknown) => void }) {
  const required = promesaFields.some((field) => field.type !== "promesaRows" && mostrarCampoPromesa(field.key, values) && (values[field.key] === undefined || values[field.key] === ""));
  const errors = validarPromesa(values, false);
  const current = values.revisionEstado === "revisada" && values.revisionDatos === promesaReviewSnapshot(values) && values.versionRevisada === values.versionContrato;
  return <section className="space-y-3 rounded-lg border border-border bg-muted/30 p-4 md:col-span-2">
    <h2 className="font-semibold">Revisión de la promesa</h2>
    <p className="text-sm">La emisión exige que el abogado revise el modelo, la clasificación de la operación, las facultades y los anexos. Registrar la revisión conserva estos datos; no firma el contrato ni acredita por sí mismo documentos externos.</p>
    <p className="text-sm">Las promesas de vivienda de adhesión requieren el modelo registrado aplicable. Esta plantilla civil no lo sustituye. Los anexos se identifican aquí y deben acompañar el contrato al firmarlo; el PDF generado contiene el contrato y sus referencias.</p>
    <p className="text-sm text-muted-foreground">{current ? "Revisión registrada para estos datos." : "Revisión pendiente para estos datos."}</p>
    {errors.length > 0 && <p className="text-sm text-muted-foreground">Pendientes: {errors.join(". ")}.</p>}
    <button type="button" className={btnGhost} disabled={required || errors.length > 0} onClick={() => { onChange("revisionEstado", "revisada"); onChange("versionRevisada", values.versionContrato); onChange("revisionDatos", promesaReviewSnapshot(values)); }}>Registrar revisión de esta promesa</button>
  </section>;
}
