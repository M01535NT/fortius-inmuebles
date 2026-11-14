import { expect, it } from "vitest";
import { stageDocuments } from "@/lib/admin/operation-view";
import { formatoById } from "@/lib/formatos/catalog";
import { mostrarCampoSolicitud } from "@/lib/formatos/solicitud-arrendamiento";
import { solicitudArrendamientoDocumento } from "@/lib/formatos/documento/solicitud-arrendamiento";
import type { Block } from "@/lib/formatos/documento/modelo";

/*
  BUG-C28: el 22 no está en ninguna etapa de la renta del propietario. Los formatos «se inician desde
  su etapa» (pestaña Documentos) y el requisito «Arrendatario identificado» de la renta ya espera el 22
  (`requirementFormato`), pero ninguna etapa lo ofrece: el asesor no tiene dónde iniciarlo.
*/
it("alguna etapa de la renta del propietario ofrece la solicitud de arrendamiento (22)", () => {
  const fases = ["prospecto", "captacion", "levantamiento", "documentos", "dictamen", "verificacion", "contrato", "publicacion", "visitas", "cierre"] as const;
  const ofrecidos = fases.flatMap(fase => stageDocuments(fase as Parameters<typeof stageDocuments>[0], "arrendador").map(item => item.formato));
  expect(ofrecidos).toContain("22");
});

/*
  BUG-C29: con la captura sobre el documento, un dato se llena pulsando su zona. Para un pensionado
  (o con referencias 3 a medias) hay campos visibles que no salen en ninguna zona del documento: la
  «Antigüedad en el empleo o actividad» es obligatoria, pero el documento solo la imprime para el
  empleado y el negocio. El asesor ve «falta Antigüedad» sin dónde llenarla, y lo capturado no se imprime.
*/
const zonas = (blocks: Block[]) => new Set(blocks.flatMap(b => {
  const keys: string[] = [];
  const any = b as { keys?: string[][]; zona?: { keys: string[] } };
  if (any.zona) keys.push(...any.zona.keys);
  if (Array.isArray(any.keys)) keys.push(...any.keys.flat());
  return keys;
}));
const pensionado = { solicitanteTipo: "fisica", uso: "habitacion", mascotas: "no", garantia: "ninguna", actividad: "pensionado", coherencia: "si", decision: "acepta" };

it("cada campo obligatorio que se muestra a un pensionado tiene dónde capturarse en el documento", () => {
  const enDocumento = zonas(solicitudArrendamientoDocumento(pensionado).blocks);
  const sinZona = formatoById("22").fields.filter(f => f.required && mostrarCampoSolicitud(f.key, pensionado) && !enDocumento.has(f.key)).map(f => f.label);
  expect(sinZona).toEqual([]);
});

// La tercera referencia ya no existe: el 22 pide solo dos (94dc9c9 de Formatos), así que su prueba se retiró.
