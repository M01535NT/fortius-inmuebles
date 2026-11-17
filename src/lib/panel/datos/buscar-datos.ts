import type { Property } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import type { Lead } from "@/lib/domain/records";
import type { Entrada } from "@/lib/panel/buscar";

import { NOMBRE_TIPO_PERSONA } from "./vistas";
import { pestanaDe } from "./consultas";
import { rutaConsulta, rutaInmueble, rutaPersona } from "./relacionado";

export type EntradaDato = Entrada & { ruta: string };

const ESTADO_CONSULTA = { por_atender: "Por atender", seguimiento: "En seguimiento", cerradas: "Cerrada" } as const;

/**
 * Personas, inmuebles y consultas como resultados de «Buscar o crear» (sugerencia 3, RP-107):
 * se encuentran por nombre, teléfono, correo, folio o zona. Sin CURP ni RFC.
 */
export function entradasDeDatos(d: { clientes: readonly Cliente[]; inmuebles: readonly Property[]; leads: readonly Lead[] }): EntradaDato[] {
  const tel = (t?: string) => (t ? [t, t.replace(/\D/g, "")] : []);
  return [
    ...d.clientes.map((c) => ({
      id: `p-${c.id}`, grupo: "Personas" as const, titulo: c.nombre?.trim() || "Sin nombre",
      detalle: [NOMBRE_TIPO_PERSONA[c.tipo], c.telefono].filter(Boolean).join(" · "),
      claves: [...tel(c.telefono), c.email ?? ""], ruta: rutaPersona(c.id),
    })),
    ...d.inmuebles.map((p) => ({
      id: `i-${p.slug}`, grupo: "Inmuebles" as const, titulo: p.titulo,
      detalle: [p.codigo, p.zona].filter(Boolean).join(" · "),
      claves: [p.codigo, p.codigo.replace(/^FORTIUS-0*/, ""), p.zona ?? ""], ruta: rutaInmueble(p.codigo),
    })),
    ...d.leads.map((l) => ({
      id: `c-${l.id}`, grupo: "Consultas" as const, titulo: l.nombre?.trim() || "Sin nombre",
      detalle: [ESTADO_CONSULTA[pestanaDe(l)], l.telefono].filter(Boolean).join(" · "),
      claves: [...tel(l.telefono), l.email ?? ""], ruta: rutaConsulta(l.id),
    })),
  ];
}
