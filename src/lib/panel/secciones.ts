import type { NombreIcono } from "@/components/panel/iconos-datos";

/** Una sección del menú del panel nuevo. `etapa` es la clave de PN-xx en PLAN.md que la construye. */
export type Seccion = {
  slug: string;
  nombre: string;
  icono: NombreIcono;
  etapa: string;
  resumen: string;
  /** Ruta dentro de /panel. Hoy es la raíz. */
  ruta: string;
};

/**
 * Orden por omisión del menú (el titular lo puede cambiar arrastrando).
 * Íconos elegidos en DECISIONES.md, «Sistema visual». Las etapas siguen el roadmap de PLAN.md.
 */
export const SECCIONES: readonly Seccion[] = [
  { slug: "hoy", nombre: "Hoy", icono: "casa", etapa: "PN-04", resumen: "Lo que toca hoy, lo vencido y lo que espera respuesta.", ruta: "/panel" },
  { slug: "bandeja", nombre: "Bandeja", icono: "descargar", etapa: "PN-06", resumen: "Archivos que llegan y se reparten a la persona, el inmueble o el asunto.", ruta: "/panel/bandeja" },
  { slug: "consultas", nombre: "Consultas", icono: "llamada", etapa: "PN-05", resumen: "Personas que escriben por el sitio, WhatsApp, llamada o en persona.", ruta: "/panel/consultas" },
  { slug: "personas", nombre: "Personas", icono: "cliente", etapa: "PN-03", resumen: "Propietarios, compradores, inquilinos y aliados.", ruta: "/panel/personas" },
  { slug: "inmuebles", nombre: "Inmuebles", icono: "edificio", etapa: "PN-03", resumen: "Casas, departamentos, terrenos y locales.", ruta: "/panel/inmuebles" },
  { slug: "asuntos", nombre: "Asuntos", icono: "expediente", etapa: "PN-04", resumen: "Cada negocio o gestión en curso, con sus guías, documentos y notas.", ruta: "/panel/asuntos" },
  { slug: "agenda", nombre: "Agenda", icono: "cita", etapa: "PN-04", resumen: "Citas, visitas y vencimientos.", ruta: "/panel/agenda" },
  { slug: "formatos", nombre: "Formatos", icono: "escritura", etapa: "PN-06", resumen: "Contratos, recibos y fichas con los datos ya llenos.", ruta: "/panel/formatos" },
  { slug: "tramites", nombre: "Trámites", icono: "verificado", etapa: "PN-07", resumen: "Cancelación de hipoteca, servicios, avalúos, Catastro y Registro Público.", ruta: "/panel/tramites" },
  { slug: "dinero", nombre: "Dinero", icono: "precio", etapa: "PN-08", resumen: "Lo que te deben, lo que tienes en resguardo y lo cobrado.", ruta: "/panel/dinero" },
  { slug: "equipo", nombre: "Equipo", icono: "mensaje", etapa: "PN-11", resumen: "Chat del equipo con temas.", ruta: "/panel/equipo" },
  { slug: "herramientas", nombre: "Herramientas", icono: "costos", etapa: "PN-09", resumen: "Calculadoras de crédito y de comisión.", ruta: "/panel/herramientas" },
] as const;

export const CONFIGURACION: Seccion = {
  slug: "configuracion", nombre: "Configuración", icono: "filtrar", etapa: "PN-09", resumen: "Tu perfil, avisos, apariencia y equipo.", ruta: "/panel/configuracion",
};

/** Las cinco de la barra del teléfono (la sexta es «Más»). */
export const BARRA_TELEFONO = ["hoy", "bandeja", "personas", "inmuebles", "asuntos"] as const;

export function seccionPorRuta(ruta: string): Seccion | undefined {
  if (ruta === "/panel") return SECCIONES[0];
  return [...SECCIONES, CONFIGURACION].find((s) => s.ruta !== "/panel" && (ruta === s.ruta || ruta.startsWith(s.ruta + "/")));
}
