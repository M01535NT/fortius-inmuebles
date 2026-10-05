export function mostrarCampoAviso(key: string, data: Record<string, unknown>): boolean {
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
  return [...new Set(errors)];
}
