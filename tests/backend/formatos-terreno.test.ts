import { createHash } from "node:crypto";
import { expect, it } from "vitest";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
import { terrenoFields } from "@/lib/formatos/levantamiento";
import { validateFormato } from "@/lib/formatos/catalog";
import { prepareFormatoEmission } from "@/lib/formatos/pdf";
import type { FormatoPdfAsset } from "@/lib/formatos/assets";

const photoId = "51000000-0000-4000-8000-000000000021";
const mapId = "51000000-0000-4000-8000-000000000022";
export const terrenoSample: Record<string, unknown> = {
  ...Object.fromEntries(terrenoFields.filter((field) => field.type !== "levantamientoRows").map((field) => [field.key, field.type === "date" ? "2026-10-04" : field.type === "time" ? "10:00" : "NV"])),
  folio: "EXP-04A-001", idInmueble: "INM-TER-001", unidad: "NA, terreno independiente", inmueble: "Predio de prueba, acceso por calle principal",
  colonia: "Zona de prueba", municipioEstado: "Tijuana, Baja California", codigoPostal: "NV",
  fotoPrincipalId: photoId, croquisId: mapId, direccionFoto: "Desde el acceso hacia el norte",
  usoActual: "O: terreno sin construcción en el área accesible", formaPendiente: "O: irregular, pendiente aparente hacia el sur", accesoFisico: "O: acceso por vialidad pavimentada",
  horaInicio: "10:00", horaTermino: "11:30", asesor: "Ana, asesora responsable", finalidad: "Captación y documentación comercial", ocupacion: "D: sin ocupantes; recorrido limitado al sector autorizado", accesoAutorizado: "Propietario autorizó el ingreso y acompañó el recorrido", permisoFoto: "autorizado", permisoMedicion: "autorizado", referenciaPermiso: "Autorización del propietario durante la visita",
  terrenoDeclarada: "500", terrenoDocumental: "NV", terrenoMedida: "NV", terrenoFuente: "D: propietario durante la entrevista; no se aportó plano ni se midió",
  construccionesDeclarada: "0", construccionesDocumental: "NV", construccionesMedida: "NV", construccionesFuente: "D: propietario; O: no se observaron construcciones en el sector accesible",
  afectacionDeclarada: "NV", afectacionDocumental: "NV", afectacionMedida: "NV", afectacionFuente: "No se recibió documento de afectaciones",
  frente: "D: 20 m, declaración del propietario", fondo: "D: 25 m, declaración del propietario", otrosFrentes: "NA", orientacion: "O: referencia norte del croquis", linderos: "NV: no se cotejaron documentos", cercas: "O: malla en el acceso", relieve: "O: pendiente, vegetación baja y escurrimiento superficial; sin dictamen técnico",
  usoPretendido: "D: vivienda", usoAutorizado: "NV", documentoUso: "NV: no se recibió documento de zonificación", indices: "NV", afectaciones: "O: no se identificaron líneas en el sector accesible; revisión documental pendiente",
  aguaSituacion: "O: registro visible a pie de calle, sin confirmar conexión", aguaBase: "Foto de acceso; factibilidad NV", electricidadSituacion: "O: poste visible junto a acceso", electricidadBase: "Visita; capacidad y contratación NV", vialidadSituacion: "O: pavimento en acceso", vialidadBase: "Visita del 4 de octubre",
  coordenadas: "NV: ubicación esquemática de prueba", fuenteCroquis: "Esquema del asesor, 4 de octubre de 2026", accesoEntorno: "O: acceso por calle principal; entorno inmediato residencial",
  respaldosEstado: "registrados", respaldos: [{ id: "FOTO-ACCESO", descripcion: "Vista del punto de acceso", fecha: "2026-10-04", archivo: "Imagen privada del borrador" }],
  discrepanciasEstado: "registradas", discrepancias: [{ zona: "Superficie", contraste: "Declarados 500 m²; sin soporte documental", accion: "Solicitar plano y antecedente", responsable: "Propietario y asesor" }],
  areasNoAccesibles: "Sector posterior cerrado", indiciosEspecialista: "Pendiente y escurrimiento; revisión topográfica si el proyecto lo requiere", incidentes: "Ninguno durante el recorrido", elaboro: "Ana", reviso: "Luis", siguienteAccion: "Recibir plano y revisar uso autorizado", siguienteFecha: "2026-10-10",
};

async function assets(): Promise<FormatoPdfAsset[]> {
  const photo = await sharp({ create: { width: 1200, height: 600, channels: 3, background: "#b8c4a7" } }).jpeg().toBuffer();
  const map = await sharp({ create: { width: 600, height: 1000, channels: 3, background: "#e0e6eb" } }).png().toBuffer();
  return [
    { id: photoId, kind: "foto", caption: "Vista principal de prueba", source: "Asesora durante la visita", observed_on: "2026-10-04", mime: "image/jpeg", sha256: createHash("sha256").update(photo).digest("hex"), bytes: photo },
    { id: mapId, kind: "croquis", caption: "Croquis esquemático de prueba", source: "Asesora", observed_on: "2026-10-04", mime: "image/png", sha256: createHash("sha256").update(map).digest("hex"), bytes: map },
  ];
}

it("conserva desconocidos sin convertirlos en cero y exige fuentes y discrepancias completas", () => {
  expect(validateFormato("04A", terrenoSample)).toEqual([]);
  expect(validateFormato("04A", { ...terrenoSample, terrenoMedida: "-2" })).not.toEqual([]);
  expect(validateFormato("04A", { ...terrenoSample, discrepancias: [{ zona: "Superficie" }] })).toContain("discrepancias, fila 1: Responsable");
  expect(() => validateFormato("04A", { ...terrenoSample, respaldos: [{ id: "X", descripcion: "Y", fecha: "2026-99-99", archivo: "Z" }] })).not.toThrow();
  expect(validateFormato("04A", { ...terrenoSample, respaldosEstado: "sin_respaldo" })).toContain("respaldos: el estado contradice los registros");
});

it("exige las imágenes seleccionadas y genera un levantamiento con páginas y recursos de imagen", async () => {
  await expect(prepareFormatoEmission("04A", terrenoSample)).rejects.toThrow(/fotografía principal y el croquis/);
  const emission = await prepareFormatoEmission("04A", terrenoSample, await assets());
  const pdf = await PDFDocument.load(emission.bytes);
  expect(pdf.getPageCount()).toBeGreaterThan(2);
  expect(pdf.getTitle()).toMatch(/Levantamiento de terreno/);
  expect(pdf.context.enumerateIndirectObjects().filter(([, object]) => object.toString().includes("/Subtype /Image")).length).toBeGreaterThanOrEqual(2);
});
