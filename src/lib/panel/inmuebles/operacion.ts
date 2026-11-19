import { estadosPara, NOMBRE_ESTADO, NOMBRE_OPERACION, type EstadoInmueble, type Operacion } from "@/lib/backend/inmuebles-contrato";

/**
 * Cambiar la operación de un inmueble. Si su estado no tiene sentido para la nueva (un «Rentado» que pasa a venta),
 * el estado pasa a Libre: con un estado que no corresponde, el inmueble dejaría de verse en el sitio. Nunca impide
 * el cambio; el aviso dice qué pasó para poder deshacerlo.
 */
export function cambioDeOperacion(
  i: { operacion: Operacion | null; estado: EstadoInmueble; publicado: boolean },
  operacion: Operacion | null,
): { cambio: { operacion: Operacion | null; estado?: EstadoInmueble }; aviso: string; antes: { operacion: Operacion | null; estado?: EstadoInmueble } } {
  const que = operacion ? `Ahora es ${NOMBRE_OPERACION[operacion].toLowerCase()}` : "Sin operación";
  if (!operacion && i.publicado) {
    return { cambio: { operacion }, aviso: `${que}. Sin operación no se ve en el sitio`, antes: { operacion: i.operacion } };
  }
  if (estadosPara(operacion).includes(i.estado)) return { cambio: { operacion }, aviso: que, antes: { operacion: i.operacion } };
  const sigue = i.publicado ? " y sigue en el sitio" : "";
  return {
    cambio: { operacion, estado: "libre" },
    aviso: `${que}. «${NOMBRE_ESTADO[i.estado]}» no aplica: quedó Libre${sigue}`,
    antes: { operacion: i.operacion, estado: i.estado },
  };
}
