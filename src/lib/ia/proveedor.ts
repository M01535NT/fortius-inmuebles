import "server-only";
import type { Extractor } from "@/lib/backend/expediente-lectura";
import { extractorClaude, lecturaDisponible as claudeDisponible } from "./claude";
import { extractorGrok, grokDisponible, MODELO_GROK } from "./grok";
import { MODELO_LECTURA } from "./lectura";

/*
  Qué servicio lee los documentos (IA-01). IA_PROVEEDOR elige «claude» o «grok»; sin esa variable,
  se usa el que tenga clave (Claude primero). Sin ninguna clave, la lectura no está disponible y el
  resto del panel funciona igual.
*/
export type Proveedor = "claude" | "grok";

export function proveedorDeLectura(): Proveedor | null {
  const pedido = process.env.IA_PROVEEDOR?.trim().toLowerCase();
  if (pedido === "grok") return grokDisponible() ? "grok" : null;
  if (pedido === "claude") return claudeDisponible() ? "claude" : null;
  if (claudeDisponible()) return "claude";
  if (grokDisponible()) return "grok";
  return null;
}

export const lecturaDisponible = () => proveedorDeLectura() !== null;

/** Solo imágenes con Grok; PDF e imágenes con Claude. El panel lo dice antes de intentar. */
export function formatosLegibles(): string[] {
  const proveedor = proveedorDeLectura();
  if (proveedor === "grok") return ["image/jpeg", "image/png", "image/webp"];
  if (proveedor === "claude") return ["application/pdf", "image/jpeg", "image/png", "image/webp"];
  return [];
}

export function extractor(): Extractor {
  const proveedor = proveedorDeLectura();
  if (proveedor === "grok") return extractorGrok();
  return extractorClaude();
}

/** Modelo del proveedor en uso, para mostrarlo o anotarlo. */
export const modeloEnUso = () => proveedorDeLectura() === "grok" ? MODELO_GROK : MODELO_LECTURA;
