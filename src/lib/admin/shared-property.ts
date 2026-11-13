// PUB-02 (RP-95, DEC-40): inmuebles compartidos por otra inmobiliaria. Reglas sin React ni servidor,
// para que el panel, la API y los reportes digan lo mismo; la base vuelve a comprobarlas al publicar.
import type { AdminProperty } from "@/lib/domain/records";
import type { PropertyAlly } from "@/lib/propiedad-seguimiento";

export const isShared = (property: Pick<AdminProperty, "origen">) => property.origen === "compartido";

/** Lo que falta para publicar un compartido; vacío si ya se puede. */
export function sharedPublicationBlockers(aliado: PropertyAlly | undefined): string[] {
  const missing: string[] = [];
  if ((aliado?.inmobiliaria ?? "").trim().length < 2) missing.push("Liga la inmobiliaria que comparte el inmueble.");
  if (!aliado?.autorizacion?.path) missing.push("Adjunta la autorización escrita de la inmobiliaria (carta, correo o mensaje).");
  if (!aliado?.autorizacion?.fecha) missing.push("Anota la fecha de la autorización.");
  if ((aliado?.autorizacion?.firmante ?? "").trim().length < 3) missing.push("Anota quién firmó o envió la autorización.");
  return missing;
}

/** Comisión estimada para Fortius: precio publicado por el porcentaje acordado con la inmobiliaria. No es lo cobrado. */
export function sharedCommissionEstimate(property: AdminProperty): { monto: number; moneda: "MXN" | "USD" } | null {
  const porcentaje = property.aliado?.porcentaje;
  if (!isShared(property) || porcentaje == null || property.precio.modalidad !== "publico") return null;
  return { monto: Math.round(property.precio.monto * porcentaje / 100), moneda: property.precio.moneda };
}

/** Inmobiliarias ya registradas, con el último contacto y porcentaje usados, para no escribirlos otra vez. */
export function knownAllies(properties: AdminProperty[]): PropertyAlly[] {
  const byName = new Map<string, PropertyAlly>();
  for (const property of properties) {
    const name = property.aliado?.inmobiliaria?.trim();
    if (!isShared(property) || !name || byName.has(name.toLocaleLowerCase("es-MX"))) continue;
    byName.set(name.toLocaleLowerCase("es-MX"), { inmobiliaria: name, contacto: property.aliado?.contacto, porcentaje: property.aliado?.porcentaje });
  }
  return [...byName.values()].sort((a, b) => a.inmobiliaria.localeCompare(b.inmobiliaria, "es-MX"));
}
