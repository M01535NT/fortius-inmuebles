import { CARGOS_NETO, calcularNeto, type CargoNeto } from "../neto";
import { a, dinero, fecha, filas, type Block, type Documento } from "./modelo";

/*
  08 · Estimación del neto del propietario, con el diseño de su hoja
  (Metodología/08.Estimacion_del_neto_del_propietario.xlsx): barras azules por sección,
  etiquetas y valores sobre gris, tabla de erogaciones y el neto estimado destacado.
  Las cifras salen del mismo cálculo del panel; si falta algo, quedan vacías.
  Captura sobre el documento (EXT-12, 28/10/2026): el título va en el membrete y cada valor dice
  qué campo lo llena («keys»); los totales y el neto los calcula el panel y no se pulsan.
*/

type Data = Record<string, unknown>;
const f = (value: unknown) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? fecha(value) : a(value);
const mxn = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? dinero(value) : "";

export function netoDocumento(d: Data): Documento {
  let calculo: ReturnType<typeof calcularNeto> | null = null;
  try { calculo = calcularNeto(d); } catch { /* estimación incompleta: se muestran sólo los datos capturados */ }
  const cargos = filas(d.erogaciones) as CargoNeto[];
  const rows = [...CARGOS_NETO.map(c => ({ key: c.key as string, label: c.label })), { key: "otro1", label: "Otro cargo 1" }, { key: "otro2", label: "Otro cargo 2" }].map(({ key, label }) => {
    const cargo = cargos.find(c => c.concepto === key);
    return [cargo?.descripcion ? `${label}: ${cargo.descripcion}` : label, cargo?.estado === "No aplica" ? "—" : mxn(cargo?.importe), a(cargo?.estado), a(cargo?.justificacion)];
  });
  const blocks: Block[] = [
    { kind: "bar", zona: { keys: ["estadoOperacion"], label: "Estado de la operación" }, text: "08  /  Venta  /  Importes en MXN", right: a(d.estadoOperacion) || "En estudio" },
    { kind: "sheet", rows: [
      // El folio lo asigna el sistema.
      [{ label: "Folio", w: 2 }, { value: a(d.folio), w: 2 }, { label: "Fecha", w: 2 }, { value: f(d.fechaEmision), w: 2, keys: ["fechaEmision"] }, { label: "Responsable", w: 2 }, { value: a(d.responsableEstimacion), w: 2, keys: ["responsableEstimacion"] }],
      [{ label: "Propietario", w: 2 }, { value: a(d.propietario), w: 10, keys: ["propietario"] }],
      [{ label: "Inmueble", w: 2 }, { value: a(d.inmueble), w: 10, keys: ["inmueble"] }],
      [{ label: "Ref. / versión 07", w: 2 }, { value: a(d.referencia07), w: 6, keys: ["referencia07"] }, { label: "Fecha del 07", w: 2 }, { value: f(d.fecha07), w: 2, keys: ["fecha07"] }],
    ] },
    { kind: "bar", text: "01  /  Precio y diferencia" },
    { kind: "sheet", rows: [
      [{ label: "Valor sugerido según opinión de valor 07", w: 8 }, { value: mxn(d.precioSugerido07), w: 4, keys: ["precioSugerido07"] }],
      [{ label: "Precio acordado con el vendedor", w: 8 }, { value: mxn(d.precioAcordado), w: 4, keys: ["precioAcordado"] }],
      [{ label: "Diferencia en MXN", w: 4 }, { value: calculo?.diferenciaAbsoluta == null ? "" : dinero(calculo.diferenciaAbsoluta), w: 2, strong: true }, { label: "Diferencia sobre el sugerido", w: 4 }, { value: calculo?.diferenciaPorcentual == null ? "" : `${calculo.diferenciaPorcentual.toFixed(2)} %`, w: 2, strong: true }],
      [{ label: "Precio usado para el neto", w: 4 }, { value: d.precioBase === "acordado" ? "Acordado" : d.precioBase === "sugerido07" ? "Sugerido del 07" : "", w: 4, keys: ["precioBase"] }, { value: calculo ? dinero(calculo.precioBase) : "", w: 4, strong: true }],
    ] },
    { kind: "note", text: "Diferencia = acordado menos sugerido. El acuerdo con el vendedor no acredita una venta cerrada." },
    { kind: "bar", text: "02  /  Erogaciones a cargo del propietario" },
    { kind: "table", zona: { keys: ["erogaciones"], label: "Erogaciones a cargo del propietario" }, widths: [4, 2, 2, 4], header: ["Concepto", "Importe MXN", "Estado", "Justificación / fuente y fecha"], rows },
    { kind: "sheet", rows: [
      [{ label: "Total de erogaciones estimadas", w: 8 }, { value: calculo ? dinero(calculo.erogaciones) : "", w: 4, strong: true }],
      [{ label: "Precio del respaldo fiscal", w: 4 }, { value: mxn(d.precioRespaldoFiscal), w: 2, keys: ["precioRespaldoFiscal"] }, { label: "Respaldo válido hasta", w: 3 }, { value: f(d.respaldoFiscalValidoHasta), w: 3, keys: ["respaldoFiscalValidoHasta"] }],
      [{ label: "Cierre previsto", w: 4 }, { value: f(d.cierrePrevisto), w: 2, keys: ["cierrePrevisto"] }, { label: "Revisión de cargos", w: 3 }, { value: a(d.revisionCargos), w: 3, keys: ["revisionCargos"] }],
    ] },
    { kind: "note", text: "Impuestos: incorporar respaldo de contador o notaría. Justificar también el «No aplica»; no asumir exención." },
    { kind: "bar", text: "03  /  Lo que se estima recibirá el propietario" },
    { kind: "bar", text: "Neto estimado", right: calculo ? dinero(calculo.netoEstimado, "MXN") : "", big: true },
    { kind: "sheet", rows: [[{ value: calculo ? (calculo.netoEstimado < 0 ? "Las erogaciones superan el precio: revisar el faltante." : "Estimación revisada. Puede variar al concretarse la operación.") : "Completar los datos y los cargos para calcular el neto.", w: 12, strong: true }]] },
    { kind: "note", text: "Estimación, no garantía de cobro. El precio, impuestos, adeudos y gastos pueden cambiar. Total conjunto antes de repartir entre copropietarios." },
    { kind: "note", text: "No equivale al saldo por cobrar en firma: los anticipos recibidos deben conciliarse por separado. Evita duplicar cargos." },
  ];
  return { title: "Estimación del neto", subject: `Formato 08 · ${a(d.folio)}`, blocks };
}
