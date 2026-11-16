import type { FilaAsunto, Expediente } from "@/lib/panel/datos/asuntos";

/**
 * Dinero (PN-08, primer corte): solo lectura de lo que ya existe en la base, sin cifras inventadas.
 * - Lo que se cobra sale de la comisión estimada del cierre del asunto (`flujo.cierre.comisionEstimada`, COR-22, en pesos).
 * - Lo cobrado sale de los recibos 18 emitidos del asunto. Un recibo sin emitir se lista, pero no descuenta.
 * - Reglas del titular (DEC-53, 16/11/2026): un recibo marcado como pago total salda la cuenta (la diferencia es descuento);
 *   pesos y dólares por separado, sin convertir; cuenta el importe del último PDF aunque el recibo cambiara después.
 * - No hay registro de apartados, gastos por reembolsar ni vencimientos de cobro: eso necesita una tabla de movimientos.
 */

export type Moneda = "MXN" | "USD";

/** Borrador de formato tal como lo manda `GET /api/admin/expedientes/{id}/formatos`. */
export type BorradorFormato = { id: string; expediente_id: string; formato_id: string; data: Record<string, unknown> | null; version: number; created_at: string; updated_at: string };

export type Cobro = {
  id: string; expedienteId: string; numero: string; fecha: string | null; importe: number; moneda: Moneda;
  medio: string; concepto: string; parcial: boolean;
  /** Cuenta como cobrado: hay un PDF entregado (de esta versión o de una anterior). */
  emitido: boolean;
  /** Marcado como pago total: salda la cuenta aunque el importe sea menor. */
  total?: boolean;
  /** El recibo cambió después de su último PDF: cuenta lo del PDF (importe, moneda, total). */
  cambiosSinPdf?: boolean;
};

/** Lo del último PDF de un recibo 18, tal como lo manda `GET /api/admin/documentos?formato=18`. */
export type UltimoRecibo = { version: number; importe: number | null; moneda: Moneda; total: boolean };

const texto = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const fechaValida = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);

const positivo = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v > 0;

/**
 * Lee un recibo 18; null si no es recibo o no trae un importe positivo.
 * Si la versión actual no tiene PDF pero una anterior sí, cuenta lo de ese PDF y lo marca «con cambios sin PDF».
 */
export function leerCobro(b: BorradorFormato, emitido: boolean, ultimo: UltimoRecibo | null = null): Cobro | null {
  if (b.formato_id !== "18") return null;
  const data = b.data ?? {};
  const base = { id: b.id, expedienteId: b.expediente_id, numero: texto(data.numeroRecibo), fecha: fechaValida(data.fechaPago), medio: texto(data.medioPago), concepto: texto(data.concepto) };
  if (!emitido && ultimo && positivo(ultimo.importe)) {
    return { ...base, importe: ultimo.importe, moneda: ultimo.moneda, parcial: !ultimo.total, total: ultimo.total, emitido: true, cambiosSinPdf: true };
  }
  if (!b.data || !positivo(data.importeRecibido)) return null;
  return {
    ...base, importe: data.importeRecibido, moneda: data.moneda === "USD" ? "USD" : "MXN",
    parcial: data.pagoParcialTotal === "parcial", total: data.pagoParcialTotal === "total", emitido,
  };
}

export type PorCobrar = {
  asuntoId: string; titulo: string; folio: string; total: number; cobrado: number; falta: number;
  /** Lo que se dejó de cobrar al marcar un recibo como pago total (DEC-53). */
  descuento: number;
  /** Cobrado en dólares: no se resta de la comisión en pesos, se muestra aparte (DEC-53). */
  cobradoDolares: number;
  /** Cuántos recibos en dólares hay. */
  enDolares: number;
  recibos: Cobro[]; fuente: string;
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
    const enPesos = validos.filter((c) => c.moneda === "MXN");
    const cobrado = redondear(enPesos.reduce((s, c) => s + c.importe, 0));
    const resto = Math.max(0, redondear(total - cobrado));
    const saldado = enPesos.some((c) => c.total);
    const dolares = validos.filter((c) => c.moneda === "USD");
    const a = fila.get(e.id);
    filas.push({
      asuntoId: e.id, titulo: a?.titulo ?? "Asunto", folio: a?.folio ?? e.folio ?? "", total, cobrado,
      falta: saldado ? 0 : resto, descuento: saldado ? resto : 0,
      cobradoDolares: redondear(dolares.reduce((s, c) => s + c.importe, 0)), enDolares: dolares.length,
      recibos, fuente: e.flujo?.cierre?.fuente?.trim() ?? "",
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
  const partes = [c.numero ? `Recibo ${c.numero}` : "Recibo sin número", c.total ? "pago total" : c.parcial ? "parcial" : "", c.medio,
    c.cambiosSinPdf ? "con cambios sin PDF: cuenta lo del último PDF" : c.emitido ? "" : "sin entregar: todavía no cuenta como cobrado"];
  return partes.filter(Boolean).join(" · ");
}

/** «de $X» cuando ya hubo un cobro parcial. */
export const ladoMenor = (f: Pick<PorCobrar, "cobrado" | "total">) => (f.cobrado > 0 ? `de ${dinero(f.total)}` : undefined);
