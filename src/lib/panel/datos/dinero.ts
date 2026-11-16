import type { FilaAsunto, Expediente } from "@/lib/panel/datos/asuntos";

/**
 * Dinero (PN-08, primer corte): solo lectura de lo que ya existe en la base, sin cifras inventadas.
 * - Lo que se cobra sale de la comisión estimada del cierre del asunto (`flujo.cierre.comisionEstimada`, COR-22, en pesos).
 * - Lo cobrado sale de los recibos 18 emitidos del asunto. Un recibo sin emitir se lista, pero no descuenta.
 * - No hay registro de apartados, gastos por reembolsar ni vencimientos de cobro: eso necesita una tabla de movimientos.
 */

export type Moneda = "MXN" | "USD";

/** Borrador de formato tal como lo manda `GET /api/admin/expedientes/{id}/formatos`. */
export type BorradorFormato = { id: string; expediente_id: string; formato_id: string; data: Record<string, unknown> | null; version: number; created_at: string; updated_at: string };

export type Cobro = {
  id: string; expedienteId: string; numero: string; fecha: string | null; importe: number; moneda: Moneda;
  medio: string; concepto: string; parcial: boolean; emitido: boolean;
};

const texto = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const fechaValida = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);

/** Lee un recibo 18; null si no es recibo o no trae un importe positivo. */
export function leerCobro(b: BorradorFormato, emitido: boolean): Cobro | null {
  if (b.formato_id !== "18" || !b.data) return null;
  const importe = b.data.importeRecibido;
  if (typeof importe !== "number" || !Number.isFinite(importe) || importe <= 0) return null;
  return {
    id: b.id, expedienteId: b.expediente_id, numero: texto(b.data.numeroRecibo), fecha: fechaValida(b.data.fechaPago),
    importe, moneda: b.data.moneda === "USD" ? "USD" : "MXN", medio: texto(b.data.medioPago), concepto: texto(b.data.concepto),
    parcial: b.data.pagoParcialTotal === "parcial", emitido,
  };
}

export type PorCobrar = {
  asuntoId: string; titulo: string; folio: string; total: number; cobrado: number; falta: number;
  recibos: Cobro[]; enDolares: number; fuente: string;
};

/** Comisión estimada del cierre; null si el asunto no tiene cierre o no anotó la comisión. */
export function comisionDe(e: Pick<Expediente, "flujo">): number | null {
  const c = e.flujo?.cierre?.comisionEstimada;
  return typeof c === "number" && c > 0 ? c : null;
}

/**
 * «Te deben»: cada asunto con comisión estimada, lo cobrado con recibos 18 emitidos en pesos y lo que falta.
 * Los recibos en dólares no se restan de una comisión en pesos: se cuentan aparte para que el asesor los revise.
 */
export function porCobrar(expedientes: readonly Expediente[], asuntos: readonly FilaAsunto[], cobros: readonly Cobro[]): PorCobrar[] {
  const fila = new Map(asuntos.map((a) => [a.id, a]));
  const filas: PorCobrar[] = [];
  for (const e of expedientes) {
    const total = comisionDe(e);
    if (total === null) continue;
    const recibos = cobros.filter((c) => c.expedienteId === e.id);
    const validos = recibos.filter((c) => c.emitido);
    const cobrado = redondear(validos.filter((c) => c.moneda === "MXN").reduce((s, c) => s + c.importe, 0));
    const a = fila.get(e.id);
    filas.push({
      asuntoId: e.id, titulo: a?.titulo ?? "Asunto", folio: a?.folio ?? e.folio ?? "", total, cobrado,
      falta: Math.max(0, redondear(total - cobrado)), recibos, enDolares: validos.filter((c) => c.moneda === "USD").length,
      fuente: e.flujo?.cierre?.fuente?.trim() ?? "",
    });
  }
  return filas;
}

const redondear = (n: number) => Math.round(n * 100) / 100;

export const pendientesDeCobro = (filas: readonly PorCobrar[]) => filas.filter((f) => f.falta > 0).sort((a, b) => b.falta - a.falta);
export const cobradosCompletos = (filas: readonly PorCobrar[]) => filas.filter((f) => f.falta === 0);
export const sumaFalta = (filas: readonly PorCobrar[]) => redondear(filas.reduce((s, f) => s + f.falta, 0));

/** Asuntos que ya llegaron al cierre (por etapa o por estado) y no anotaron comisión: no se puede saber qué se debe. */
export function cierresSinComision(expedientes: readonly Expediente[]): number {
  const alCierre = new Set(["cierre", "entrega", "postventa", "cerrado"]);
  return expedientes.filter((e) => alCierre.has(e.etapa) && e.flujo?.estado !== "descartada" && comisionDe(e) === null).length;
}

/** Historial: cobros con recibo, lo más reciente primero; sin fecha al final. */
export function historial(cobros: readonly Cobro[]): Cobro[] {
  return [...cobros].sort((a, b) => (b.fecha ?? "").localeCompare(a.fecha ?? "") || a.numero.localeCompare(b.numero));
}

export function sumaCobrada(cobros: readonly Cobro[], moneda: Moneda = "MXN"): number {
  return redondear(cobros.filter((c) => c.emitido && c.moneda === moneda).reduce((s, c) => s + c.importe, 0));
}

export function dinero(n: number, moneda: Moneda = "MXN"): string {
  const t = new Intl.NumberFormat("es-MX", { style: "currency", currency: moneda, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);
  return moneda === "USD" ? `${t} USD` : t;
}

/** Línea de cada cobro en el historial. */
export function lineaCobro(c: Cobro): string {
  const partes = [c.numero ? `Recibo ${c.numero}` : "Recibo sin número", c.parcial ? "parcial" : "", c.medio, c.emitido ? "" : "sin entregar: todavía no cuenta como cobrado"];
  return partes.filter(Boolean).join(" · ");
}

/** «de $X» cuando ya hubo un cobro parcial. */
export const ladoMenor = (f: Pick<PorCobrar, "cobrado" | "total">) => (f.cobrado > 0 ? `de ${dinero(f.total)}` : undefined);
