"use client";
import { calcularIntermediacion } from "@/lib/formatos/intermediacion";
import { INTERMEDIACION_CLAUSES } from "@/lib/formatos/intermediacion-text";
import { formatAmount } from "@/lib/finance/money";

export function IntermediacionSummary({ values }: { values: Record<string, unknown> }) {
  const result = calcularIntermediacion(values);
  const cash = (value: number | null) => value === null ? "Pendiente" : `${formatAmount(value)} MXN`;
  return <section className="space-y-4 rounded-lg border border-border bg-muted/30 p-4 md:col-span-2">
    <h2 className="font-semibold">Emisión del contrato 09 bloqueada</h2>
    <p className="text-sm">El modelo Fortius no está registrado. Puedes preparar y guardar los datos. Introducir un número de registro o seleccionar un supuesto de no aplicación no habilita el PDF: falta revisar el modelo y sus registros aplicables antes de autorizar su emisión.</p>
    <dl className="grid gap-3 md:grid-cols-2"><div><dt>Precio sin IVA de venta</dt><dd>{cash(result.basePrecio)}</dd></div><div><dt>Comisión estimada sin IVA</dt><dd>{cash(result.comision)}</dd></div><div><dt>IVA de comisión estimado</dt><dd>{cash(result.ivaComision)}</dd></div><div><dt>Comisión estimada con IVA</dt><dd className="font-semibold">{cash(result.total)}</dd></div><div><dt>Base máxima de referencia para la pena antes de prorratear</dt><dd>{cash(result.basePena)}</dd></div></dl>
    {result.errors.length > 0 && <p className="text-sm text-muted-foreground">Pendientes de cálculo: {result.errors.join(". ")}.</p>}
    <p className="text-sm">Las cifras son estimaciones al precio autorizado. El contrato original devenga comisión con la transmisión formalizada y el precio efectivamente recibido o aplicado, proporcionalmente si hay pagos posteriores. Las tasas se capturan con su soporte fiscal; no se asignan por defecto.</p>
    <details className="rounded-md border border-border p-3"><summary className="cursor-pointer font-medium">Cláusulas del original para revisión</summary><div className="mt-4 space-y-4 text-sm">{INTERMEDIACION_CLAUSES.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div></details>
  </section>;
}
