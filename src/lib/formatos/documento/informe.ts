import type { Papel, Quien } from "@/lib/backend/asuntos-contrato";

import { fecha, type Block, type Documento } from "./modelo";

/*
  Informe para el cliente (SPEC.md, sección 5, «Informes para el cliente»). Se arma solo con lo que el asunto ya
  tiene: el servidor junta el material y esta hoja lo acomoda. La pantalla y el PDF usan la misma función, así
  que lo que se ve es lo que se entrega. Lleva el diseño de marca de los demás documentos de Fortius.

  Nunca lleva notas internas, decisiones internas, el análisis de la opinión jurídica ni los nombres o teléfonos
  de los interesados: el material ya llega sin ellos.
*/

export const PARTES_INFORME = ["hecho", "sigue", "falta", "actividad", "dinero"] as const;
export type ParteInforme = (typeof PARTES_INFORME)[number];
export const NOMBRE_PARTE: Record<ParteInforme, string> = {
  hecho: "Lo que se hizo", sigue: "Lo que sigue", falta: "Lo que necesitamos de usted", actividad: "Actividad del inmueble", dinero: "Dinero",
};

export const CADA_INFORME = ["semana", "quincena", "mes"] as const;
export type CadaInforme = (typeof CADA_INFORME)[number];
export const NOMBRE_CADA: Record<CadaInforme, string> = { semana: "Cada semana", quincena: "Cada 15 días", mes: "Cada mes" };

/** Lo que decide el asesor antes de mandarlo. `sin` son los renglones que quitó a mano. */
export type OpcionesInforme = { para: string[]; en_que_va: string; partes: ParteInforme[]; sin: string[]; cada: CadaInforme | null };

type Renglon = { id: string; texto: string };

/** Todo lo que el asunto puede decir en un informe, antes de elegir para quién y qué partes lleva. */
export type MaterialInforme = {
  numero: number; hoy: string;
  /** Fecha del informe anterior; null si es el primero. */
  desde: string | null;
  folio: string; asunto: string; lleva: string;
  /** A quién se le puede mandar: las personas del asunto que siguen con vida. */
  personas: { id: string; nombre: string; papel: Papel }[];
  /** El párrafo de «En qué va» que el sistema propone. */
  propuesta: string;
  hecho: (Renglon & { fecha: string | null })[];
  /** `quien_nombre`: cómo se llama hoy en «Quién hace una tarea» (al cliente se le dice «Usted»). */
  sigue: (Renglon & { fecha: string | null; hora: string | null; quien: Quien; quien_nombre?: string })[];
  /** Documentos por entregar, con quién los entrega (persona o papel) para mostrar solo los del destinatario. */
  faltan: (Renglon & { persona_id: string | null; papel: string | null })[];
  /** Tareas pendientes que le tocan al cliente. */
  toca: Renglon[];
  /** Solo si se comercializa: por inmueble, sin nombres de interesados. */
  actividad: (Renglon & { estado: string; preguntaron: number; visitas: number; ofertas: string[] })[];
  dinero: { acordado: string; cobrado: string; falta: string; terceros: { id: string; concepto: string; monto: string }[] } | null;
  /** Cada cuánto se manda hoy (según la tarea «Mandar el informe» pendiente). */
  cada: CadaInforme | null;
};

/** El nombre lo pone el servidor desde el catálogo; si no llegó, la clave escrita en bonito («Perito» de «perito»). */
const quienDe = (x: { quien: Quien; quien_nombre?: string }) =>
  x.quien === "cliente" ? "Usted" : x.quien_nombre || (x.quien ? x.quien.charAt(0).toUpperCase() + x.quien.slice(1).replace(/_/g, " ") : "");
const cuando = (f: string | null, hora?: string | null) => (f ? `${fecha(f)}${hora ? `, ${hora}` : ""}` : "Por definir");

/** Las opciones con las que abre la pantalla: al primer cliente, con todo menos el dinero. */
export function opcionesIniciales(m: MaterialInforme): OpcionesInforme {
  const orden: Papel[] = ["propietario", "vendedor", "comprador", "inversionista", "inquilino", "contacto", "heredero", "copropietario", "titular"];
  const primera = orden.map((p) => m.personas.find((x) => x.papel === p)).find(Boolean) ?? m.personas[0];
  return { para: primera ? [primera.id] : [], en_que_va: m.propuesta, partes: PARTES_INFORME.filter((p) => p !== "dinero"), sin: [], cada: m.cada };
}

/** Lo que de verdad sale en la hoja: cada parte encendida, sin los renglones quitados y solo lo del destinatario. */
export function contenidoInforme(m: MaterialInforme, o: OpcionesInforme) {
  const con = (p: ParteInforme) => o.partes.includes(p);
  const queda = <T extends { id: string }>(lista: T[]) => lista.filter((x) => !o.sin.includes(x.id));
  const destinatarios = m.personas.filter((p) => o.para.includes(p.id));
  const papeles = new Set<string>(destinatarios.map((p) => p.papel));
  // Un documento sale si lo entrega alguno de los destinatarios, o si no dice quién lo entrega.
  const suyo = (d: MaterialInforme["faltan"][number]) =>
    d.persona_id ? o.para.includes(d.persona_id) : !d.papel || papeles.has(d.papel) || !destinatarios.length;
  return {
    para: destinatarios.map((p) => p.nombre),
    en_que_va: o.en_que_va.trim() || m.propuesta,
    hecho: con("hecho") ? queda(m.hecho) : [],
    sigue: con("sigue") ? queda(m.sigue) : [],
    falta: con("falta") ? queda([...m.faltan.filter(suyo), ...m.toca]) : [],
    actividad: con("actividad") ? queda(m.actividad) : [],
    dinero: con("dinero") ? m.dinero : null,
  };
}

const ANCHO = 10224;

export function informeDocumento(m: MaterialInforme, o: OpcionesInforme): Documento {
  const c = contenidoInforme(m, o);
  let n = 0;
  const seccion = (titulo: string): Block => ({ kind: "h1", text: `${String(++n).padStart(2, "0")}  ${titulo}` });
  const blocks: Block[] = [
    { kind: "title", text: "Informe de avance" },
    { kind: "caption", text: "Cómo va su asunto y qué sigue." },
    { kind: "band", widths: [3816, 3816, 2592], rows: [
      [{ label: "Asunto", value: m.asunto }, { label: "Para", value: c.para.join(", ") || "Por definir" }, { label: "Folio / informe", value: `${m.folio} · ${m.numero}` }],
      [{ label: "Fecha", value: fecha(m.hoy) }, { label: "Lo lleva", value: m.lleva }, { label: "Periodo", value: m.desde ? `Desde el ${fecha(m.desde)}` : "Desde el inicio" }],
    ] },
    seccion("En qué va"),
    ...c.en_que_va.split(/\n{2,}/).map((t) => t.trim()).filter(Boolean).map((text): Block => ({ kind: "p", text })),
  ];
  if (c.hecho.length) blocks.push(seccion(NOMBRE_PARTE.hecho),
    { kind: "table", widths: [7400, ANCHO - 7400], header: ["Qué se hizo", "Cuándo"], rows: c.hecho.map((x) => [x.texto, x.fecha ? fecha(x.fecha) : ""]) });
  if (c.sigue.length) blocks.push(seccion(NOMBRE_PARTE.sigue),
    { kind: "table", widths: [5200, 2300, ANCHO - 7500], header: ["Qué sigue", "Quién", "Cuándo"], rows: c.sigue.map((x) => [x.texto, quienDe(x), cuando(x.fecha, x.hora)]) });
  if (c.falta.length) blocks.push(seccion(NOMBRE_PARTE.falta),
    { kind: "table", widths: [ANCHO], header: ["Para seguir avanzando le pedimos"], rows: c.falta.map((x) => [x.texto]) });
  if (c.actividad.length) blocks.push(seccion(NOMBRE_PARTE.actividad),
    { kind: "table", widths: [3000, 1700, 1500, 1200, ANCHO - 7400], header: ["Inmueble", "Estado", "Preguntaron", "Visitas", "Ofertas"],
      rows: c.actividad.map((x) => [x.texto, x.estado, String(x.preguntaron), String(x.visitas), x.ofertas.join("\n") || "Ninguna"]) },
    { kind: "note", text: "Personas que preguntaron, visitas y ofertas registradas a la fecha de este informe." });
  if (c.dinero) blocks.push(seccion(NOMBRE_PARTE.dinero),
    { kind: "table", widths: [6400, ANCHO - 6400], header: ["Concepto", "Monto"], rows: [
      ["Honorarios acordados", c.dinero.acordado || "Por definir"], ["Cobrado", c.dinero.cobrado || "Nada todavía"], ["Falta", c.dinero.falta || "Nada"],
      ...c.dinero.terceros.map((t) => [`Gasto de terceros: ${t.concepto}`, t.monto]),
    ] });
  blocks.push({ kind: "note", text: `Informe preparado con lo registrado en su asunto al ${fecha(m.hoy)}. Para cualquier duda, comuníquese con ${m.lleva}.` });
  return { title: "Informe de avance", subject: `Informe ${m.numero} · ${m.folio}`, blocks };
}

/** El mismo informe como mensaje para WhatsApp. Lo envía el asesor; nada sale solo. */
export function informeTexto(m: MaterialInforme, o: OpcionesInforme): string {
  const c = contenidoInforme(m, o);
  const partes: string[] = [`*Informe de avance · ${m.asunto}*\n${fecha(m.hoy)} · ${m.folio}`, `*En qué va*\n${c.en_que_va}`];
  if (c.hecho.length) partes.push(`*${NOMBRE_PARTE.hecho}*\n${c.hecho.map((x) => `• ${x.texto}${x.fecha ? ` (${fecha(x.fecha)})` : ""}`).join("\n")}`);
  if (c.sigue.length) partes.push(`*${NOMBRE_PARTE.sigue}*\n${c.sigue.map((x) => `• ${x.texto} · ${quienDe(x)} · ${cuando(x.fecha, x.hora)}`).join("\n")}`);
  if (c.falta.length) partes.push(`*${NOMBRE_PARTE.falta}*\n${c.falta.map((x) => `• ${x.texto}`).join("\n")}`);
  if (c.actividad.length) partes.push(`*${NOMBRE_PARTE.actividad}*\n${c.actividad.map((x) =>
    `• ${x.texto} (${x.estado.toLowerCase()}): ${x.preguntaron} preguntaron, ${x.visitas} visitas${x.ofertas.length ? `, ofertas: ${x.ofertas.join("; ")}` : ", sin ofertas"}`).join("\n")}`);
  if (c.dinero) partes.push(`*${NOMBRE_PARTE.dinero}*\n• Honorarios acordados: ${c.dinero.acordado || "por definir"}\n• Cobrado: ${c.dinero.cobrado || "nada todavía"}\n• Falta: ${c.dinero.falta || "nada"}${
    c.dinero.terceros.map((t) => `\n• Gasto de terceros, ${t.concepto}: ${t.monto}`).join("")}`);
  partes.push(`${m.lleva}\nFortius Inmuebles`);
  return partes.join("\n\n");
}
