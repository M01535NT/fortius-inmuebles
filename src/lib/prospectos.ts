/** Compatibility entry point; no platform client, key or browser persistence. */
export type OrigenProspecto = "evaluar" | "contacto" | "interes_propiedad" | "checklist" | "documentos" | "manual";
export type ProspectoInput = {
  nombre: string;
  telefono: string;
  origen: OrigenProspecto;
  email?: string;
  propiedadSlug?: string;
  zona?: string;
  tipoPropiedad?: string;
  mensaje?: string;
};

export async function enviarProspecto(input: ProspectoInput): Promise<string> {
  const response = await fetch("/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await response.json();
  if (!response.ok || typeof data.id !== "string" || !data.id) {
    throw new Error(data.error || "No se pudo guardar la solicitud. Inténtalo de nuevo.");
  }
  return data.id;
}
