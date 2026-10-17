import type { FormatoField } from "./catalog";

export const AVISO_TEMPLATE_VERSION = "carta-2026-10-09";
const representativeKeys = ["consentimientoPatrimonial", "consentimientoPublicidad", "publicidadCorreo", "publicidadTelefono", "publicidadMensajeria", "transferenciaAsesor", "asesorDestinatario", "asesorPais", "transferenciaFinanciera", "financieroDestinatario", "financieroPais", "transferenciaOperacion", "operacionDestinatario", "operacionPais", "acuseEstado", "fechaAcuse", "referenciaAcuse"];
export const claveRepresentante = (key: string) => `representante${key[0].toUpperCase()}${key.slice(1)}`;
export function decisionesRepresentante(data: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(representativeKeys.map(key => [key, data[claveRepresentante(key)]]));
}
/** Optional fields keep previously saved drafts compatible. Empty decisions remain unmarked. */
export function camposRepresentante(fields: FormatoField[]): FormatoField[] {
  return fields.filter(field => representativeKeys.includes(field.key)).map(field => ({ ...field, key: claveRepresentante(field.key), label: `Representante: ${field.label.toLowerCase()}`, section: "Datos propios del representante", required: false }));
}

export function mostrarCampoAviso(key: string, data: Record<string, unknown>): boolean {
  if (key.startsWith("representante") && key !== "representante") {
    const original = key.slice("representante".length);
    return Boolean(String(data.representante ?? "").trim()) && mostrarCampoAviso(original[0].toLowerCase() + original.slice(1), decisionesRepresentante(data));
  }
  if (key === "calidadRepresentante") return Boolean(String(data.representante ?? "").trim()) || data.tipoTitular === "representante";
  if (["publicidadCorreo", "publicidadTelefono", "publicidadMensajeria"].includes(key)) return data.consentimientoPublicidad === "si";
  if (["asesorDestinatario", "asesorPais"].includes(key)) return data.transferenciaAsesor === "si";
  if (["financieroDestinatario", "financieroPais"].includes(key)) return data.transferenciaFinanciera === "si";
  if (["operacionDestinatario", "operacionPais"].includes(key)) return data.transferenciaOperacion === "si";
  if (["fechaAcuse", "referenciaAcuse"].includes(key)) return data.acuseEstado === "firmado_fuera";
  if (key === "documentoRepresentante") return data.tipoTitular === "representante" || Boolean(String(data.representante ?? "").trim());
  return true;
}

export function validarAviso(data: Record<string, unknown>): string[] {
  const errors: string[] = [];
  const address = String(data.domicilioResponsable ?? "").trim();
  if (address.length < 25 || /[\[\]<>]|pendiente|por definir|sin domicilio/i.test(address)) errors.push("Domicilio completo del responsable");
  const email = String(data.correoPrivacidad ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Correo para derechos de privacidad");
  const requiredWhen = (key: string, condition: boolean, label: string) => {
    if (condition && !String(data[key] ?? "").trim()) errors.push(label);
  };
  if (data.consentimientoPublicidad === "si") {
    for (const [key, label] of [["publicidadCorreo", "Publicidad por correo"], ["publicidadTelefono", "Publicidad por teléfono"], ["publicidadMensajeria", "Publicidad por mensajería"]] as const) if (!["si", "no"].includes(String(data[key]))) errors.push(label);
    if (!["publicidadCorreo", "publicidadTelefono", "publicidadMensajeria"].some((key) => data[key] === "si")) errors.push("Al menos un canal autorizado para publicidad");
  }
  requiredWhen("asesorDestinatario", data.transferenciaAsesor === "si", "Destinatario asesor");
  requiredWhen("asesorPais", data.transferenciaAsesor === "si", "País del asesor");
  requiredWhen("financieroDestinatario", data.transferenciaFinanciera === "si", "Entidad financiera");
  requiredWhen("financieroPais", data.transferenciaFinanciera === "si", "País de la entidad financiera");
  requiredWhen("operacionDestinatario", data.transferenciaOperacion === "si", "Contraparte o notaría");
  requiredWhen("operacionPais", data.transferenciaOperacion === "si", "País de la contraparte o notaría");
  requiredWhen("representante", data.tipoTitular === "representante", "Nombre del representante");
  requiredWhen("documentoRepresentante", data.tipoTitular === "representante" || Boolean(String(data.representante ?? "").trim()), "Documento de representación");
  requiredWhen("fechaAcuse", data.acuseEstado === "firmado_fuera", "Fecha de firma externa");
  requiredWhen("referenciaAcuse", data.acuseEstado === "firmado_fuera", "Referencia del acuse firmado");
  if (String(data.representante ?? "").trim()) {
    const own = decisionesRepresentante(data);
    // Reuse the decision rules with a complete business context; never copy a titular's choices.
    const ownErrors = validarAviso({ ...data, ...own, representante: "", tipoTitular: "otro", documentoRepresentante: "" });
    for (const error of ownErrors) {
      if (!["Domicilio completo del responsable", "Correo para derechos de privacidad"].includes(error)) errors.push(`Representante: ${error[0].toLowerCase()}${error.slice(1)}`);
    }
  }
  return [...new Set(errors)];
}
