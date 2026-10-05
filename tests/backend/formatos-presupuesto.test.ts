import { expect, it } from "vitest";
import { calcularPresupuesto, validarPresupuesto } from "@/lib/formatos/presupuesto";

const base = {
  partidas: [
    { id: "P-1", area: "Cocina", concepto: "Pintura", tipoCosto: "Material", unidad: "pieza", cantidad: 2, precioUnitario: 120.25, estado: "Autorizado", soporte: "Cotización C-1" },
    { id: "P-2", area: "Cocina", concepto: "Instalación", tipoCosto: "Mano de obra", unidad: "jornada", cantidad: 1, precioUnitario: 500, estado: "Cotizado", soporte: "Cotización C-2" },
  ],
  pagos: [{ fechaPago: "2026-10-05", partidaId: "P-1", proveedor: "Proveedor A", concepto: "Anticipo", importe: 100, medio: "Transferencia", comprobante: "SPEI-1", estado: "Pagado" }],
  reservaImprevistos: 50,
};

it("calcula cotizado, autorizado, pagos y exceso desde filas completas", () => {
  expect(validarPresupuesto(base)).toEqual([]);
  expect(calcularPresupuesto(base)).toEqual({ subtotalCotizado: 740.5, importeAutorizado: 240.5, reservaImprevistos: 50, estimacionConReserva: 790.5, totalPagado: 100, autorizadoMenosPagado: 140.5, excesoSobreEstimacion: 0 });
});

it("rechaza IDs repetidos, partidas incompletas y pagos duplicados", () => {
  expect(validarPresupuesto({ ...base, partidas: [base.partidas[0], { ...base.partidas[1], id: "P-1" }] })).toContain("ID de partida repetido");
  expect(validarPresupuesto({ ...base, partidas: [{ ...base.partidas[0], soporte: "" }] })).toContain("Partida P-1: soporte");
  expect(validarPresupuesto({ ...base, pagos: [base.pagos[0], base.pagos[0]] })).toContain("Pago duplicado");
});

it("distingue cero pagos confirmado de ausencia de captura", () => {
  expect(validarPresupuesto({ ...base, pagos: [] })).toContain("Confirma que no hubo pagos");
  expect(validarPresupuesto({ ...base, pagos: [], sinPagosConfirmado: "si" })).toEqual([]);
  expect(validarPresupuesto({ ...base, partidas: [{ ...base.partidas[0], estado: "Descartado" }], pagos: [], sinPagosConfirmado: "si" })).toContain("Al menos una partida cotizada");
});

it("recalcula al cambiar precios y excluye pagos anulados", () => {
  const changed = { ...base, partidas: [{ ...base.partidas[0], precioUnitario: 200 }, base.partidas[1]], pagos: [...base.pagos, { ...base.pagos[0], comprobante: "CANCELADO-2", estado: "Anulado", importe: 500 }] };
  expect(validarPresupuesto(changed)).toEqual([]);
  expect(calcularPresupuesto(changed).subtotalCotizado).toBe(900);
  expect(calcularPresupuesto(changed).totalPagado).toBe(100);
});

it("impide cantidades negativas y detecta pagos superiores a la estimación", () => {
  expect(validarPresupuesto({ ...base, partidas: [{ ...base.partidas[0], cantidad: -1 }] })).toContain("Partida P-1: cantidad");
  expect(calcularPresupuesto({ ...base, pagos: [{ ...base.pagos[0], importe: 900 }] }).excesoSobreEstimacion).toBe(109.5);
});
