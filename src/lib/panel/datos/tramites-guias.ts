import {
  ACREEDORES, documentoDelPaso, esHipoteca, pasosDe, type Acreedor, type CualquierTramite, type ParteTramite, type PasoClave,
  type TipoGuia, type TramiteGuia,
} from "@/lib/tramites";

/**
 * Catálogo de Trámites (boceto «Trámites», 15/11/2026, y DECISIONES «Trámites»): la cancelación de hipoteca (TRA-01, con
 * fuente oficial) y las demás guías. Salvo la hipoteca, los pasos son de ejemplo y salen «Por confirmar con la fuente oficial»;
 * faltan su fuente y la revisión del abogado. Funciones puras.
 */

export type TipoTramite = "cancelacion_hipoteca" | TipoGuia;
type PasoGuia = { clave: string; nombre: string; ayuda: string; institucion: string; pendientes: string[]; documento: string; llevar: string[] };
export type Guia = {
  tipo: TipoTramite; nombre: string; categoria: string; modo: "ruta" | "partes"; confirmada: boolean; pista: string;
  pasos: PasoGuia[]; partes: { nombre: string; institucion: string }[]; llevar: string[];
};

const P = (clave: string, nombre: string, ayuda: string, institucion: string, pendientes: string[], documento: string, llevar: string[] = []): PasoGuia =>
  ({ clave, nombre, ayuda, institucion, pendientes, documento, llevar });

export const GUIAS: Record<TipoTramite, Guia> = {
  cancelacion_hipoteca: { tipo: "cancelacion_hipoteca", nombre: "Cancelación de hipoteca", categoria: "Crédito y gravámenes", modo: "ruta", confirmada: true, pista: "Ocho pasos según el acreedor", pasos: [], partes: [], llevar: [] },
  servicios: {
    tipo: "servicios", nombre: "Cambio de nombre de servicios", categoria: "Servicios", modo: "partes", confirmada: false, pista: "Luz, agua, gas e internet, cada uno por su lado", pasos: [],
    partes: [{ nombre: "Luz", institucion: "CFE" }, { nombre: "Agua", institucion: "Comisión de agua" }, { nombre: "Gas", institucion: "Proveedor de gas" }, { nombre: "Internet", institucion: "Proveedor de internet" }],
    llevar: ["Identificación del nuevo titular", "Comprobante de propiedad o contrato", "Recibo anterior"],
  },
  avaluo: {
    tipo: "avaluo", nombre: "Avalúo", categoria: "Valor", modo: "ruta", confirmada: false, pista: "Pedirlo a un perito o institución externa", partes: [], llevar: [], pasos: [
      P("perito", "Elegir perito o institución", "Decide quién hace el avalúo y pide su cotización.", "Perito", ["Perito elegido", "Cotización aprobada"], "Cotización del perito", ["Datos del inmueble"]),
      P("documentos", "Reunir documentos", "Entrega al perito los documentos del inmueble.", "Perito", ["Escritura", "Predial"], "Escritura", ["Escritura", "Predial al corriente"]),
      P("visita", "Visita al inmueble", "El perito visita el inmueble y toma medidas.", "Perito", ["Visita agendada", "Visita hecha"], "Acuse de la visita", ["Acceso al inmueble"]),
      P("recibir", "Recibir el avalúo", "El perito entrega el avalúo firmado.", "Perito", ["Avalúo recibido", "Revisado"], "Avalúo"),
      P("entregar", "Entregar", "Entrega el avalúo a quien lo pidió.", "Propietario", ["Entregado"], "Acuse de entrega"),
    ],
  },
  regularizacion: {
    tipo: "regularizacion", nombre: "Regularización", categoria: "Regularización", modo: "ruta", confirmada: false, pista: "Prescripción, titulación y similares", partes: [], llevar: [], pasos: [
      P("revisar", "Revisar la situación", "Ve cómo está el inmueble en el Registro Público y en Catastro.", "Registro Público", ["Antecedentes registrales", "Situación catastral"], "Antecedentes registrales", ["Datos del inmueble"]),
      P("via", "Elegir la vía", "Define si procede prescripción, titulación u otra vía con el abogado.", "Abogado", ["Vía elegida con el abogado"], "Opinión del abogado"),
      P("pruebas", "Reunir pruebas y documentos", "Junta lo que acredita la posesión o el derecho.", "Propietario", ["Documentos de la posesión", "Pruebas reunidas"], "Pruebas de posesión", ["Identificación", "Comprobantes"]),
      P("presentar", "Presentar la solicitud", "Se presenta ante la instancia que corresponde.", "Instancia", ["Solicitud presentada", "Acuse recibido"], "Acuse de presentación"),
      P("seguimiento", "Seguimiento", "Da seguimiento a la respuesta de la instancia.", "Instancia", ["Respuesta recibida"], "Respuesta de la instancia"),
      P("inscribir", "Inscribir la resolución", "Inscribe la resolución en el Registro Público.", "Registro Público", ["Resolución inscrita"], "Resolución inscrita"),
    ],
  },
  catastro: {
    tipo: "catastro", nombre: "Trámite en Catastro", categoria: "Catastro", modo: "ruta", confirmada: false, pista: "Valor catastral, cambio de propietario y similares", partes: [], llevar: [], pasos: [
      P("definir", "Definir el trámite", "Qué se pide a Catastro: valor, cambio de propietario, deslinde u otro.", "Catastro", ["Trámite definido"], "Solicitud"),
      P("requisitos", "Reunir requisitos", "Junta los documentos que pide Catastro.", "Catastro", ["Requisitos reunidos"], "Requisitos", ["Identificación", "Escritura"]),
      P("presentar", "Presentar y pagar", "Presenta la solicitud y paga los derechos.", "Catastro", ["Solicitud presentada", "Derechos pagados"], "Recibo de pago"),
      P("recibir", "Recibir el resultado", "Recoge la constancia o el documento.", "Catastro", ["Documento recibido"], "Constancia"),
      P("entregar", "Entregar", "Entrega el documento a quien lo pidió.", "Propietario", ["Entregado"], "Acuse de entrega"),
    ],
  },
  registro: {
    tipo: "registro", nombre: "Trámite en el Registro Público", categoria: "Registro Público", modo: "ruta", confirmada: false, pista: "Certificados, inscripciones y antecedentes", partes: [], llevar: [], pasos: [
      P("definir", "Definir qué pedir", "Certificado de libertad de gravamen, inscripción, antecedentes u otro.", "Registro Público", ["Trámite definido"], "Solicitud"),
      P("requisitos", "Reunir requisitos", "Junta los documentos que pide el Registro.", "Registro Público", ["Requisitos reunidos"], "Requisitos", ["Identificación", "Escritura"]),
      P("presentar", "Presentar y pagar", "Presenta la solicitud y paga los derechos.", "Registro Público", ["Solicitud presentada", "Derechos pagados"], "Boleta de ingreso"),
      P("recibir", "Recibir el documento", "Recoge el documento ya inscrito o expedido.", "Registro Público", ["Documento recibido"], "Documento expedido"),
      P("entregar", "Entregar", "Entrega el documento a quien lo pidió.", "Propietario", ["Entregado"], "Acuse de entrega"),
    ],
  },
  libre: { tipo: "libre", nombre: "Trámite libre", categoria: "Otro", modo: "partes", confirmada: true, pista: "Sin pasos: agregas tú las partes", pasos: [], partes: [], llevar: [] },
};

/** El catálogo del «+», por categoría y en el orden del boceto. */
export function catalogoPorCategoria(): { categoria: string; guias: Guia[] }[] {
  const grupos: { categoria: string; guias: Guia[] }[] = [];
  for (const g of Object.values(GUIAS)) {
    const grupo = grupos.find((x) => x.categoria === g.categoria) ?? (grupos.push({ categoria: g.categoria, guias: [] }), grupos[grupos.length - 1]);
    grupo.guias.push(g);
  }
  return grupos;
}

/** Dónde está cada paso de la hipoteca (para el filtro «Dónde está» y la línea de la fila). */
function institucionHipoteca(acreedor: Acreedor, clave: PasoClave): string {
  if (clave === "registro" || clave === "certificado") return "Registro Público";
  if (clave === "entrega") return "Propietario";
  if (acreedor === "banco" && (clave === "notario" || clave === "firma")) return "Notaría";
  if (acreedor === "infonavit" && clave === "firma") return "Registro Público";
  if (acreedor === "fovissste" && clave === "notario") return "Registro Público";
  return ACREEDORES[acreedor];
}

export type PasoVista = { clave: string; nombre: string; ayuda: string; institucion: string; documento: string; llevar: string[] };
export type VistaTramite = {
  guia: Guia; nombreTipo: string; modo: "ruta" | "partes"; porConfirmar: boolean; pasos: PasoVista[]; partes: ParteTramite[];
  total: number; terminado: boolean; dondeEsta: string; pasoActualNombre: string;
};

/** Lo que la pantalla necesita de cualquier trámite, sea hipoteca o una guía. */
export function vistaTramite(t: CualquierTramite): VistaTramite {
  const guia = GUIAS[t.tipo as TipoTramite] ?? GUIAS.libre;
  let pasos: PasoVista[];
  if (esHipoteca(t)) {
    pasos = pasosDe(t.acreedor).map((p) => ({ clave: p.clave, nombre: p.nombre, ayuda: p.ayuda, institucion: institucionHipoteca(t.acreedor, p.clave), documento: documentoDelPaso(t.acreedor, p.clave) ?? "", llevar: [] }));
  } else {
    pasos = t.pasos.map((p) => {
      const d = guia.pasos.find((x) => x.clave === p.clave);
      return { clave: p.clave, nombre: p.nombre, ayuda: d?.ayuda ?? "", institucion: d?.institucion ?? "", documento: d?.documento ?? "", llevar: d?.llevar ?? [] };
    });
  }
  const partes = esHipoteca(t) ? [] : t.partes;
  const modo = esHipoteca(t) || pasos.length ? "ruta" : "partes";
  const terminado = t.estado !== "en_curso" || (modo === "ruta" && t.pasoActual >= pasos.length);
  const actual = pasos[Math.min(t.pasoActual, Math.max(0, pasos.length - 1))];
  const parteAbierta = partes.find((p) => p.estado !== "listo");
  const dondeEsta = terminado ? "" : modo === "ruta" ? actual?.institucion ?? "" : parteAbierta?.institucion ?? "";
  return {
    guia, nombreTipo: guia.nombre, modo, porConfirmar: !guia.confirmada, pasos, partes, total: modo === "ruta" ? pasos.length : partes.length, terminado, dondeEsta,
    pasoActualNombre: modo === "ruta" ? actual?.nombre ?? "" : `${partes.filter((p) => p.estado === "listo").length} de ${partes.length} listas`,
  };
}

/** Trámite nuevo de una guía que no es la hipoteca: con sus pasos y pendientes, o con sus partes. */
export function nuevoTramiteGuia(input: { id: string; tipo: TipoGuia; titulo: string; clienteId?: string; personaId?: string; asesorId: string; propiedadSlug?: string }): TramiteGuia {
  const g = GUIAS[input.tipo];
  return {
    id: input.id, tipo: input.tipo, titulo: input.titulo.trim().slice(0, 160), clienteId: input.clienteId || "", ...(input.personaId ? { personaId: input.personaId } : {}),
    asesorId: input.asesorId, propiedadSlug: input.propiedadSlug || "", expedienteId: "",
    estado: "en_curso", pasoActual: 0, espera: null, ultimoAvance: null, notas: [],
    pasos: g.pasos.map((p) => ({ clave: p.clave, nombre: p.nombre, pendientes: p.pendientes.map((texto, i) => ({ id: `${p.clave}-${i + 1}`, texto, hecho: false })) })),
    partes: g.partes.map((p, i) => ({ id: `parte-${i + 1}`, nombre: p.nombre, institucion: p.institucion, estado: "pendiente" as const, llevar: [...g.llevar] })),
    pagos: [{ id: "pago-1", concepto: input.tipo === "servicios" ? "Depósitos y cargos" : "Derechos y honorarios", estado: "pendiente" as const }],
  };
}

/** «Marcar solicitado» → «Marcar listo»; «Reabrir» vuelve a solicitado. La base anota cada cambio en el historial. */
export function avanzarParte(t: TramiteGuia, parteId: string): TramiteGuia {
  return { ...t, partes: t.partes.map((p) => (p.id !== parteId ? p : { ...p, estado: p.estado === "pendiente" ? "solicitado" : "listo" })) };
}
export function reabrirParte(t: TramiteGuia, parteId: string): TramiteGuia {
  return { ...t, estado: "en_curso", partes: t.partes.map((p) => (p.id !== parteId ? p : { ...p, estado: "solicitado" })) };
}
export function agregarParte(t: TramiteGuia, nombre: string): TramiteGuia {
  const n = nombre.trim().slice(0, 120);
  if (!n) return t;
  const id = `parte-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  return { ...t, partes: [...t.partes, { id, nombre: n, institucion: "Por definir", estado: "pendiente", llevar: [] }] };
}
/** Trámite de partes: se termina o se reabre entero. */
export const terminarPartes = (t: TramiteGuia): TramiteGuia => ({ ...t, estado: "terminado", espera: null });
export const reabrirTramite = (t: TramiteGuia): TramiteGuia => ({ ...t, estado: "en_curso" });

/** Texto del avance de una guía (la hipoteca usa `textoDelAvance` de TRA-01). Sin notas internas. */
export function textoAvanceGuia(t: TramiteGuia, v: VistaTramite, partes: { listo: boolean; sigue: boolean; necesita: boolean; pagos: boolean }, propietario: string, firma: string): string {
  const listos = v.modo === "partes" ? v.partes.filter((p) => p.estado === "listo").map((p) => p.nombre) : v.pasos.slice(0, t.pasoActual).map((p) => p.nombre);
  const sigue = v.modo === "partes" ? v.partes.filter((p) => p.estado !== "listo").map((p) => p.nombre).join(", ") : v.pasos[t.pasoActual]?.nombre ?? "";
  const lineas = [`Hola, ${propietario}. Le comparto el avance de «${t.titulo}» (${v.nombreTipo.toLowerCase()}).`];
  if (v.terminado) lineas.push("El trámite quedó terminado.");
  if (partes.listo) lineas.push("", "Ya está listo:", ...(listos.length ? listos.map((x) => `• ${x}`) : ["• Todavía nada cerrado."]));
  if (partes.sigue && !v.terminado) lineas.push("", "Lo que sigue:", `• ${sigue || "Cerrar el trámite"}${t.espera ? `, en espera de ${t.espera.quien}` : ""}`);
  if (partes.necesita) lineas.push("", "Lo que necesitamos de usted:", "• Nada por ahora.");
  if (partes.pagos && t.pagos.length) lineas.push("", "Pagos:", ...t.pagos.map((p) => `• ${p.concepto}: ${p.estado === "pagado" ? "pagado" : "pendiente"}${p.monto !== undefined ? ` ($${p.monto.toLocaleString("es-MX")})` : ""}`));
  lineas.push("", firma);
  return lineas.join("\n");
}
