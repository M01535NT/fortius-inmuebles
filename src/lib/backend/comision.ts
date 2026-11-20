import type { Moneda, Presupuesto } from "./apartados-contrato";
import type { InmuebleDelAsunto } from "./asuntos-contrato";

/**
 * La comisión de un asunto, calculada al vuelo (SPEC.md, «Reparto de comisión»): 25 % para quien captó y 25 % para
 * quien vendió; si es la misma persona, 50 %. Es una estimación sobre el honorario del presupuesto aceptado; no se guarda
 * lo pagado a cada asesor. Solo la ve el director. Función pura.
 */
export type Montos = { moneda: Moneda; monto: number }[];
export type Comision = {
  /** El asunto se cerró, se comercializó y se logró: el reparto ya cuenta. */
  cuenta: boolean;
  /** El presupuesto aceptado del que sale el honorario (el más reciente); null si no hay. */
  presupuesto_numero: number | null;
  honorario: Montos;
  /** Conceptos de honorario en porcentaje sin inmueble o sin precio de base: no se suman. */
  por_calcular: number;
  reparto: { asesor_id: string; papel: "capto" | "vendio" | "ambos"; porcentaje: number; montos: Montos }[];
};

type AsuntoParaComision = {
  encargos: readonly string[]; en_que_va: string; resultado: string | null; capto_id: string | null; vendio_id: string | null;
  presupuestos: readonly Pick<Presupuesto, "numero" | "estado" | "conceptos">[];
  inmuebles: readonly Pick<InmuebleDelAsunto, "id" | "precio" | "moneda">[];
};

/**
 * Quién captó y quién vendió se anota solo si el asunto se comercializó y se cerró como logrado (SPEC.md, «Cierre»).
 * Cuenta como logrado todo resultado cuyo significado no sea «no_logrado», como en la pantalla.
 */
export function llevaReparto(encargos: readonly string[], resultado: string | null, significado: (r: string) => string | null): boolean {
  return encargos.includes("comercializar") && resultado !== null && significado(resultado) !== "no_logrado";
}

const centavos = (n: number) => Math.round(n * 100) / 100;

function sumar(montos: Map<Moneda, number>, moneda: Moneda, monto: number) {
  montos.set(moneda, (montos.get(moneda) ?? 0) + monto);
}
const enLista = (m: Map<Moneda, number>): Montos => [...m].map(([moneda, monto]) => ({ moneda, monto: centavos(monto) }));

export function comisionDelAsunto(a: AsuntoParaComision, significado: (resultado: string) => string | null): Comision | null {
  if (!a.capto_id && !a.vendio_id) return null;
  const aceptado = [...a.presupuestos].filter((p) => p.estado === "aceptado").sort((x, y) => y.numero - x.numero)[0];
  const honorario = new Map<Moneda, number>();
  let porCalcular = 0;
  for (const c of aceptado?.conceptos ?? []) {
    if (c.clase !== "honorario") continue;
    if (c.monto !== null) { sumar(honorario, c.moneda, c.monto); continue; }
    const base = c.porcentaje !== null ? a.inmuebles.find((i) => i.id === c.base_inmueble_id) : undefined;
    if (c.porcentaje !== null && base?.precio != null) sumar(honorario, base.moneda, (base.precio * c.porcentaje) / 100);
    else porCalcular += 1;
  }
  const parte = (porcentaje: number): Montos => enLista(new Map([...honorario].map(([m, v]) => [m, (v * porcentaje) / 100])));
  const reparto: Comision["reparto"] = a.capto_id && a.capto_id === a.vendio_id
    ? [{ asesor_id: a.capto_id, papel: "ambos", porcentaje: 50, montos: parte(50) }]
    : [
      ...(a.capto_id ? [{ asesor_id: a.capto_id, papel: "capto" as const, porcentaje: 25, montos: parte(25) }] : []),
      ...(a.vendio_id ? [{ asesor_id: a.vendio_id, papel: "vendio" as const, porcentaje: 25, montos: parte(25) }] : []),
    ];
  return {
    cuenta: a.en_que_va === "cerrado" && llevaReparto(a.encargos, a.resultado, significado),
    presupuesto_numero: aceptado?.numero ?? null, honorario: enLista(honorario), por_calcular: porCalcular, reparto,
  };
}
