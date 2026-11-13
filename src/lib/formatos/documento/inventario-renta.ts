import { INVENTARIO_TABLAS, saldoDeposito, type InventarioTabla } from "../inventario-renta";
import { BLANK, dinero, fecha, filas, v, type Block, type Documento } from "./modelo";

/*
  23 · Inventario y acta de entrega del inmueble arrendado (Anexo 2 del contrato 20), con el texto
  que el titular aprobó el 13/11/2026. Una sola hoja de datos para entrar y salir: la parte II
  compara cada elemento con la entrega y liquida el depósito. Captura sobre el documento (EXT-12).
*/

type Data = Record<string, unknown>;
const z = (label: string, ...keys: string[]) => ({ zona: { keys, label } });
const CORTO = "__________";
/** En las columnas angostas, un espacio en blanco corto para que no parta el renglón. */
const opcion = (tabla: InventarioTabla, columna: string, value: unknown) => INVENTARIO_TABLAS[tabla].columns.find(c => c.key === columna)?.options?.find(o => o.value === value)?.label ?? CORTO;
const siNo = (value: unknown) => value === "si" ? "Sí" : value === "no" ? "No" : BLANK;
const firmas = (d: Data): Block => ({ kind: "signatures", line: true, ...z("Partes", "arrendador", "arrendatario"), parties: [{ role: "EL ARRENDADOR", name: v(d.arrendador) }, { role: "EL ARRENDATARIO", name: v(d.arrendatario) }] });
const menos = (value: unknown) => typeof value === "number" && value > 0 ? `- ${dinero(value)}` : dinero(typeof value === "number" ? value : 0);

export function inventarioRentaDocumento(d: Data): Documento {
  const espacios = filas(d.espacios), bienes = d.bienesEstado === "registrados" ? filas(d.bienes) : [], accesos = filas(d.accesos);
  const gas = d.tieneGas === "si";
  const saldo = saldoDeposito(d);
  const vacias = (n: number, cols: number) => Array.from({ length: n }, () => Array.from({ length: cols }, () => BLANK));

  const blocks: Block[] = [
    { kind: "center", text: "Inventario y acta de entrega del inmueble arrendado" },
    { kind: "p", ...z("Contrato e inmueble", "fechaContrato", "arrendador", "arrendatario", "inmueble", "folio"), text: `Anexo 2 del contrato de arrendamiento celebrado el ${fecha(d.fechaContrato)} entre ${v(d.arrendador)}, el Arrendador, y ${v(d.arrendatario)}, el Arrendatario, sobre el inmueble ubicado en ${v(d.inmueble).replace(/.$/, "")}. Folio: ${v(d.folio)}.` },

    { kind: "center", text: "I. Entrega al Arrendatario" },
    { kind: "p", ...z("Fecha y presentes", "fechaEntrega", "horaEntrega", "presentes"), text: `Fecha y hora: ${fecha(d.fechaEntrega)} a las ${v(d.horaEntrega)} · Presentes: ${v(d.presentes)}` },
    { kind: "label", text: "1. Estado de cada espacio" },
    { kind: "table", widths: [1900, 3000, 1500, 3824], header: ["Espacio", "Elemento", "Estado", "Observaciones"], ...z("Estado de cada espacio", "espacios"),
      rows: espacios.length ? espacios.map(r => [v(r.espacio), v(r.elemento), opcion("espacios", "estado", r.estado), v(r.observaciones)]) : vacias(3, 4) },
    { kind: "label", text: "2. Lo que se renta con el inmueble" },
    d.bienesEstado === "ninguno" ? { kind: "p", ...z("Bienes", "bienesEstado", "bienes"), text: "Ninguno." }
      : { kind: "table", widths: [3000, 1300, 3624, 2300], header: ["Bien", "Cantidad", "Marca o descripción", "Estado"], ...z("Bienes", "bienesEstado", "bienes"),
        rows: bienes.length ? bienes.map(r => [v(r.bien), v(r.cantidad), v(r.descripcion), opcion("bienes", "estado", r.estado)]) : vacias(2, 4) },
    { kind: "label", text: "3. Medidores y servicios" },
    { kind: "table", widths: [1900, 3524, 2600, 2200], header: ["Servicio", "Medidor o contrato", "Lectura", "Al corriente"], ...z("Medidores", "medidorLuz", "lecturaLuz", "luzCorriente", "medidorAgua", "lecturaAgua", "aguaCorriente", "tieneGas", "medidorGas", "lecturaGas", "gasCorriente"),
      rows: [["Luz", v(d.medidorLuz), v(d.lecturaLuz), siNo(d.luzCorriente)], ["Agua", v(d.medidorAgua), v(d.lecturaAgua), siNo(d.aguaCorriente)], ...(gas ? [["Gas", v(d.medidorGas), v(d.lecturaGas), siNo(d.gasCorriente)]] : [])] },
    { kind: "label", text: "4. Llaves, controles y accesos" },
    { kind: "table", widths: [7224, 3000], header: ["Concepto", "Cantidad"], ...z("Llaves y accesos", "accesos"), rows: accesos.length ? accesos.map(r => [v(r.concepto), v(r.cantidad)]) : vacias(2, 2) },
    { kind: "label", text: "5. Fotografías" },
    { kind: "p", ...z("Fotografías", "numeroFotos", "medioFotos"), text: `Se tomaron ${v(d.numeroFotos)} fotografías el ${fecha(d.fechaEntrega)}, que forman parte de este inventario y se conservan en ${v(d.medioFotos)}. Cada parte puede pedir copia.` },
    { kind: "clause", lead: "Recepción.", ...z("Plazo para informar daños", "diasObservaciones"), text: `El Arrendatario recibe el inmueble, sus bienes y accesos en el estado descrito. Tiene ${v(d.diasObservaciones)} días naturales para informar por escrito un vicio o daño que no se haya podido ver al recibirlo; lo que informe en ese plazo se agrega a este inventario. Pasado ese plazo, el estado descrito es el que deberá devolver, salvo el desgaste por el uso normal.` },
    firmas(d),
    ...(d.intervieneFortius === "si" ? [{ kind: "p" as const, ...z("Quién elaboró el inventario", "intervieneFortius", "asesor"), text: `Elaboró el inventario: ${v(d.asesor)}, de Fortius Inmuebles, sin responder por el estado del inmueble ni por las obligaciones de las partes.` }] : []),

    { kind: "pagebreak" },
    { kind: "center", text: "II. Devolución al Arrendador" },
    { kind: "p", ...z("Fecha y presentes de la devolución", "fechaDevolucion", "horaDevolucion", "presentesDevolucion"), text: `Fecha y hora: ${fecha(d.fechaDevolucion)} a las ${v(d.horaDevolucion)} · Presentes: ${v(d.presentesDevolucion)}` },
    { kind: "label", text: "1. Comparación con la entrega" },
    { kind: "table", widths: [3700, 1700, 1700, 3124], header: ["Elemento o bien", "Al entregar", "Al devolver", "Daño"], ...z("Comparación con la entrega", "espacios", "bienes"),
      rows: [...espacios.map(r => [`${v(r.espacio)}: ${v(r.elemento)}`, opcion("espacios", "estado", r.estado), opcion("espacios", "salida", r.salida), r.salida === "dano" ? v(r.danoSalida) : "—"]),
        ...bienes.map(r => [`${v(r.bien)} (${v(r.cantidad)})`, opcion("bienes", "estado", r.estado), opcion("bienes", "salida", r.salida), r.salida === "dano" ? v(r.danoSalida) : "—"])].concat(espacios.length + bienes.length ? [] : vacias(3, 4)) },
    { kind: "label", text: "2. Lecturas finales" },
    { kind: "p", ...z("Lecturas finales", "lecturaFinalLuz", "lecturaFinalAgua", "lecturaFinalGas"), text: `Luz: ${v(d.lecturaFinalLuz)} · Agua: ${v(d.lecturaFinalAgua)}${gas ? ` · Gas: ${v(d.lecturaFinalGas)}` : ""}` },
    { kind: "label", text: "3. Llaves, controles y accesos devueltos" },
    { kind: "table", widths: [5224, 2500, 2500], header: ["Concepto", "Entregadas", "Devueltas"], ...z("Accesos devueltos", "accesos", "faltantes"), rows: accesos.length ? accesos.map(r => [v(r.concepto), v(r.cantidad), v(r.devueltas)]) : vacias(2, 3) },
    { kind: "p", ...z("Faltantes", "faltantes"), text: `Faltan: ${v(d.faltantes)}.` },
    { kind: "label", text: "4. Liquidación del depósito" },
    { kind: "table", widths: [5024, 2200, 3000], header: ["Concepto", "Importe", "Comprobante"], ...z("Liquidación del depósito", "deposito", "rentasPendientes", "comprobanteRentas", "serviciosPendientes", "comprobanteServicios", "reparaciones", "comprobanteReparaciones"), rows: [
      ["Depósito recibido", dinero(d.deposito), "Contrato de arrendamiento"],
      ["Rentas pendientes", menos(d.rentasPendientes), typeof d.rentasPendientes === "number" && d.rentasPendientes > 0 ? v(d.comprobanteRentas) : "—"],
      ["Servicios y cuotas pendientes", menos(d.serviciosPendientes), typeof d.serviciosPendientes === "number" && d.serviciosPendientes > 0 ? v(d.comprobanteServicios) : "—"],
      ["Reparación de daños que exceden el desgaste normal", menos(d.reparaciones), typeof d.reparaciones === "number" && d.reparaciones > 0 ? v(d.comprobanteReparaciones) : "—"],
      [saldo !== null && saldo < 0 ? "Saldo a cargo del Arrendatario" : "Saldo a devolver al Arrendatario", saldo === null ? BLANK : dinero(Math.abs(saldo)), ""],
    ] },
    ...(saldo !== null && saldo < 0 ? [{ kind: "p" as const, ...z("Pago de la diferencia", "plazoPagoDiferencia"), text: `El Arrendatario adeuda ${dinero(-saldo)}, que pagará en ${v(d.plazoPagoDiferencia)}.` }] : []),
    { kind: "p", ...z("Devolución del saldo", "diasDevolucion", "formaDevolucion"), text: `El saldo se devuelve dentro de ${v(d.diasDevolucion)} días naturales siguientes a esta entrega, por ${v(d.formaDevolucion)}. Si una reparación aún no tiene factura, se descuenta con presupuesto y, al pagarse, se ajusta la diferencia con su comprobante.` },
    { kind: "clause", lead: "Recepción.", text: "El Arrendador recibe el inmueble en el estado descrito en esta parte. Lo que no se anote aquí no podrá reclamarse después como daño visible al momento de la devolución." },
    firmas(d),
  ];
  return { title: "Inventario del inmueble arrendado", subject: `Formato 23 · ${v(d.folio)}`, estilo: "contrato", blocks };
}
