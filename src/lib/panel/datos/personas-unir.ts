import type { Cliente } from "@/lib/backend/contracts";
import { ErrorDeLectura } from "@/lib/panel/datos/colecciones";
import { claveTelefono } from "@/lib/panel/datos/personas-acciones";
import { perfilDe } from "@/lib/panel/datos/personas-ficha";

/**
 * «Unir con un duplicado» (PN-03). Funciones puras para elegir qué dato se conserva de cada ficha y la llamada a
 * `POST /api/admin/personas/unir`. La base hace el resto en una transacción: pasa asuntos (con sus documentos),
 * pendientes, consultas, tareas, citas y trámites, y archiva la otra ficha. Responde 503 mientras su migración falte.
 */

/** Datos que se comparan al unir. Los del perfil viajan dentro de `perfil`. */
export type CampoUnion = {
  clave: string; etiqueta: string; secreto?: boolean;
  leer: (c: Cliente) => string | undefined;
};
const perfil = (k: string) => (c: Cliente) => {
  const v = (perfilDe(c) as Record<string, unknown>)[k];
  return typeof v === "string" ? v : typeof v === "boolean" ? (v ? "Sí" : undefined) : undefined;
};
export const CAMPOS_UNION: readonly CampoUnion[] = [
  { clave: "nombre", etiqueta: "Nombre", leer: (c) => c.nombre },
  { clave: "telefono", etiqueta: "Teléfono", leer: (c) => c.telefono },
  { clave: "email", etiqueta: "Correo", leer: (c) => c.email },
  { clave: "p.whatsapp", etiqueta: "WhatsApp", leer: perfil("whatsapp") },
  { clave: "p.nombreLegal", etiqueta: "Nombre completo o razón social", leer: perfil("nombreLegal") },
  { clave: "p.personaMoral", etiqueta: "Persona moral", leer: perfil("personaMoral") },
  { clave: "estadoCivil", etiqueta: "Estado civil", leer: (c) => c.estadoCivil },
  { clave: "curp", etiqueta: "CURP", secreto: true, leer: (c) => c.curp },
  { clave: "rfc", etiqueta: "RFC", secreto: true, leer: (c) => c.rfc },
  { clave: "identificacion", etiqueta: "Identificación", leer: (c) => c.identificacion },
  { clave: "domicilio", etiqueta: "Domicilio", leer: (c) => c.domicilio },
  { clave: "p.representante", etiqueta: "Representante legal", leer: perfil("representante") },
  { clave: "p.canalPreferido", etiqueta: "Canal preferido", leer: perfil("canalPreferido") },
  { clave: "p.proximaAccion", etiqueta: "Lo que sigue", leer: perfil("proximaAccion") },
];

/** De qué ficha sale cada dato: la que se queda («queda») o la otra («otra»). */
export type Eleccion = Record<string, "queda" | "otra">;

export type FilaUnion = { campo: CampoUnion; queda?: string; otra?: string; de: "queda" | "otra" | null; choca: boolean };

/** Por omisión se conserva lo de la ficha que se queda; un dato vacío se llena con el de la otra. */
export function filasUnion(queda: Cliente, otra: Cliente, eleccion: Eleccion): FilaUnion[] {
  return CAMPOS_UNION.map((campo) => {
    const a = campo.leer(queda)?.trim() || undefined;
    const b = campo.leer(otra)?.trim() || undefined;
    const choca = Boolean(a && b && a !== b);
    const de = eleccion[campo.clave] ?? (a ? "queda" : b ? "otra" : null);
    return { campo, queda: a, otra: b, de: a || b ? de : null, choca };
  }).filter((f) => f.queda || f.otra);
}

const SIN_COPIAR = new Set(["archivado", "unidaEn", "unidaEl"]);

/** La ficha que se queda, ya con los datos elegidos y las notas de las dos. */
export function datosUnidos(queda: Cliente, otra: Cliente, eleccion: Eleccion, ahora = new Date()): Cliente {
  const pq = { ...(perfilDe(queda) as Record<string, unknown>) };
  const po = perfilDe(otra) as Record<string, unknown>;
  const p: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(po)) if (!SIN_COPIAR.has(k)) p[k] = v;
  Object.assign(p, pq);
  const sig: Record<string, unknown> = { ...(otra as unknown as Record<string, unknown>), ...(queda as unknown as Record<string, unknown>) };
  for (const f of filasUnion(queda, otra, eleccion)) {
    if (f.de !== "otra") continue;
    const k = f.campo.clave;
    if (k.startsWith("p.")) { const pk = k.slice(2); p[pk] = po[pk]; }
    else sig[k] = (otra as unknown as Record<string, unknown>)[k];
  }
  delete p.archivado; delete p.unidaEn; delete p.unidaEl;
  const notas = [queda.notas?.trim(), otra.notas?.trim()].filter(Boolean).join("\n");
  const creado = [queda.creadoEl, otra.creadoEl].filter(Boolean).sort()[0] ?? queda.creadoEl;
  return {
    ...(sig as unknown as Cliente),
    id: queda.id, asesorId: queda.asesorId ?? otra.asesorId, leadId: queda.leadId ?? otra.leadId,
    notas, creadoEl: creado, actualizadoEl: ahora.toISOString(), perfil: p as Cliente["perfil"],
  };
}

/** Quiénes parecen la misma persona: mismo teléfono, mismo correo o mismo nombre. Primero los más parecidos. */
export function posiblesDuplicados(c: Cliente, personas: readonly Cliente[]): Cliente[] {
  const tel = claveTelefono(c.telefono);
  const correo = c.email?.trim().toLowerCase();
  const nombre = c.nombre?.trim().toLowerCase();
  const peso = (x: Cliente) =>
    (tel.length === 10 && claveTelefono(x.telefono) === tel ? 4 : 0)
    + (correo && x.email?.trim().toLowerCase() === correo ? 3 : 0)
    + (nombre && x.nombre?.trim().toLowerCase() === nombre ? 2 : 0);
  return personas.filter((x) => x.id !== c.id && !perfilDe(x).archivado && peso(x) > 0).sort((a, b) => peso(b) - peso(a));
}

export type ResultadoUnion = { queda: string; seVa: string; asuntos: number; papeles: number; pendientes: number; consultas: number; tareas: number; citas: number; tramites: number };

/** 503: la función de la base todavía no está aplicada; la pantalla avisa y nada cambia. */
export const unirSinServidor = (e: unknown) => e instanceof ErrorDeLectura && e.estado === 503;

export async function unirPersonas(d: {
  queda: Cliente; otra: Cliente; versionQueda: number; versionOtra: number; eleccion: Eleccion; motivo?: string;
}): Promise<ResultadoUnion> {
  let r: Response;
  try {
    r = await fetch("/api/admin/personas/unir", {
      method: "POST", credentials: "same-origin", cache: "no-store", headers: { "content-type": "application/json" },
      body: JSON.stringify({
        queda: d.queda.id, seVa: d.otra.id, versionQueda: d.versionQueda, versionSeVa: d.versionOtra,
        datosQueda: datosUnidos(d.queda, d.otra, d.eleccion), ...(d.motivo?.trim() ? { motivo: d.motivo.trim() } : {}),
      }),
    });
  } catch {
    throw new ErrorDeLectura("Sin conexión. Nada cambió; vuelve a intentarlo.", 0);
  }
  const datos = (await r.json().catch(() => ({}))) as { union?: ResultadoUnion; error?: string };
  if (!r.ok || !datos.union) {
    throw new ErrorDeLectura(
      r.status === 503 ? "Unir personas todavía no está activo en el servidor: llega al integrar. Nada cambió."
        : r.status === 401 ? "Tu sesión terminó. Vuelve a entrar." : datos.error || "No se pudo unir. Nada cambió; vuelve a intentarlo.",
      r.status,
    );
  }
  return datos.union;
}
