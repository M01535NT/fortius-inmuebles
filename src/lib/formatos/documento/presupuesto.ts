import { calcularPresupuesto, importePartida, type Pago, type Partida } from "../presupuesto";
import { a, dinero, fecha, filas, type Block, type Documento } from "./modelo";

/*
  19 · Presupuesto de rehabilitación, con el diseño de su libro de Excel
  (Metodología/19.Presupuesto_de_rehabilitacion.xlsx): resumen con estimación y pagos,
  partidas y registro de pagos. Las cifras salen del mismo cálculo del panel.
  Captura sobre el documento (EXT-12, 29/10/2026): el título va en el membrete; cada valor y
  cada tabla dicen qué campos los llenan; los totales los calcula el panel y no se pulsan.
*/

type Data = Record<string, unknown>;
const mxn = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? dinero(value) : "";

export function presupuestoDocumento(d: Data): Documento {
  let calc: ReturnType<typeof calcularPresupuesto> | null = null;
  try { calc = calcularPresupuesto(d); } catch { /* presupuesto incompleto: se muestran las capturas */ }
  const partidas = filas(d.partidas) as unknown as Partida[];
  const pagos = filas(d.pagos) as unknown as Pago[];
  const moneda = a(d.moneda) || "MXN";
  const importe = (p: Partida) => { try { return mxn(importePartida(p)); } catch { return ""; } };
  const blocks: Block[] = [
    { kind: "sheet", rows: [
      // El folio lo asigna el sistema.
      [{ label: "Folio del inmueble", w: 3 }, { value: a(d.folio), w: 3 }, { label: "Fecha de corte", w: 3 }, { value: typeof d.fechaCorte === "string" ? fecha(d.fechaCorte) : "", w: 3, keys: ["fechaCorte"] }],
      [{ label: "Inmueble", w: 3 }, { value: a(d.inmueble), w: 9, keys: ["inmueble"] }],
      [{ label: "Responsable", w: 3 }, { value: a(d.responsable), w: 3, keys: ["responsable"] }, { label: "Moneda", w: 3 }, { value: moneda, w: 3, keys: ["moneda"] }],
      [{ label: "Alcance", w: 3 }, { value: a(d.alcance), w: 9, keys: ["alcance"] }],
    ] },
    { kind: "bar", text: "Estimación de la rehabilitación" },
    { kind: "sheet", rows: [
      [{ label: "Subtotal cotizado", w: 8 }, { value: mxn(calc?.subtotalCotizado), w: 4 }],
      [{ label: "Importe autorizado", w: 8 }, { value: mxn(calc?.importeAutorizado), w: 4 }],
      [{ label: "Reserva para imprevistos", w: 8 }, { value: mxn(d.reservaImprevistos), w: 4, keys: ["reservaImprevistos"] }],
      [{ label: "Estimación con reserva", w: 8 }, { value: mxn(calc?.estimacionConReserva), w: 4, strong: true }],
    ] },
    { kind: "bar", text: "Pagos registrados" },
    { kind: "sheet", rows: [
      [{ label: "Total pagado", w: 8 }, { value: mxn(calc?.totalPagado), w: 4 }],
      [{ label: "Autorizado menos pagado", w: 8 }, { value: calc?.autorizadoMenosPagado === null ? "Sin partidas autorizadas" : mxn(calc?.autorizadoMenosPagado), w: 4 }],
      [{ label: "Exceso sobre la estimación", w: 8 }, { value: mxn(calc?.excesoSobreEstimacion), w: 4 }],
      [{ label: "Capturas por completar", w: 8 }, { value: calc ? "Ninguna" : "Completar partidas y pagos", w: 4 }],
    ] },
    { kind: "note", text: "Estimación parcial si faltan cotizaciones. Compara importes de la misma moneda; los pagos se concilian contra su partida y comprobante." },

    { kind: "pagebreak", force: true },
    { kind: "title", text: "Partidas del presupuesto", bold: true, size: 20 },
    { kind: "note", text: `Una partida por fila; importe = cantidad × precio unitario. Moneda: ${moneda}.` },
    { kind: "table", zona: { keys: ["partidas"], label: "Partidas del presupuesto" }, small: true, widths: [0.9, 1.3, 2.6, 1.3, 0.8, 0.9, 1.3, 1.4, 1.3], header: ["ID", "Área", "Concepto", "Tipo de costo", "Unidad", "Cantidad", "Precio unitario", "Importe", "Estado"],
      rows: (partidas.length ? partidas : [{} as Partida, {} as Partida]).map(p => [a(p.id), a(p.area), a(p.concepto), a(p.tipoCosto), a(p.unidad), a(p.cantidad), mxn(p.precioUnitario), importe(p), a(p.estado)]) },

    { kind: "pagebreak", force: true },
    { kind: "title", text: "Registro de pagos", bold: true, size: 20 },
    { kind: "note", text: `Una fila por pago, sin duplicar transferencias. El estado «Pagado» requiere comprobante. Moneda: ${moneda}.` },
    { kind: "table", zona: { keys: ["pagos", "sinPagosConfirmado"], label: "Registro de pagos" }, small: true, widths: [1.4, 1, 2, 2.6, 1.5, 1.4, 1.8, 1.2], header: ["Fecha de pago", "ID partida", "Proveedor", "Concepto del pago", "Importe pagado", "Medio", "Comprobante", "Estado"],
      rows: d.sinPagosConfirmado === "si" && !pagos.length ? [["", "", "", "Sin pagos al corte (confirmado)", "", "", "", ""]] : (pagos.length ? pagos : [{} as Pago, {} as Pago]).map(p => [typeof p.fechaPago === "string" ? fecha(p.fechaPago) : "", a(p.partidaId), a(p.proveedor), a(p.concepto), mxn(p.importe), a(p.medio), a(p.comprobante), a(p.estado)]) },
  ];
  return { title: "Presupuesto de rehabilitación", subject: `Formato 19 · ${a(d.folio)}`, blocks };
}
