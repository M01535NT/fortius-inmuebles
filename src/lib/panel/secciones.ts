import type { NombreIcono } from "@/components/panel/icons";

/** Una sección del menú del panel (SPEC.md, sección 3). `etapa` es la etapa de PLAN.md que la construye. */
export type Seccion = {
  slug: string;
  nombre: string;
  icono: NombreIcono;
  etapa: number;
  resumen: string;
  /** Ruta dentro de /panel. Inicio es la raíz. */
  ruta: string;
  /** Solo la ve el director. */
  soloDirector?: boolean;
};

/** Orden del boceto aprobado. El asesor lo puede cambiar arrastrando. */
export const SECCIONES: readonly Seccion[] = [
  { slug: "inicio", nombre: "Inicio", icono: "casa", etapa: 8, resumen: "Lo que hay que atender hoy y esta semana.", ruta: "/panel" },
  { slug: "asuntos", nombre: "Asuntos", icono: "asu", etapa: 2, resumen: "Todos los trabajos, abiertos y cerrados.", ruta: "/panel/asuntos" },
  { slug: "inmuebles", nombre: "Inmuebles", icono: "edif", etapa: 4, resumen: "El inventario y lo que sale en el sitio.", ruta: "/panel/inmuebles" },
  { slug: "directorio", nombre: "Directorio", icono: "users", etapa: 7, resumen: "Las personas, con el asunto de cada una.", ruta: "/panel/directorio" },
  { slug: "biblioteca", nombre: "Biblioteca", icono: "lib", etapa: 7, resumen: "Listas de qué pedir y planes de qué hacer.", ruta: "/panel/biblioteca" },
  { slug: "herramientas", nombre: "Herramientas", icono: "calc", etapa: 6, resumen: "Opinión de valor, cálculos y contratos sueltos.", ruta: "/panel/herramientas" },
  { slug: "equipo", nombre: "Equipo", icono: "band", etapa: 9, resumen: "Cómo va cada asesor.", ruta: "/panel/equipo", soloDirector: true },
] as const;

/** La consulta: se abre con «Nueva consulta» (Inicio, Asuntos y el botón del centro en el teléfono). No va en el menú. */
export const CONSULTA: Seccion = {
  slug: "consulta", nombre: "Nueva consulta", icono: "tel", etapa: 3, resumen: "Lo que cuenta quien llama, mientras habla.", ruta: "/panel/consulta",
};

/** Tu perfil y la apariencia. Se abre desde tu cuenta, al pie del menú. */
export const CONFIGURACION: Seccion = {
  slug: "configuracion", nombre: "Configuración", icono: "llave", etapa: 9, resumen: "Tu perfil y la apariencia.", ruta: "/panel/configuracion",
};

/** Barra del teléfono (boceto): Inicio, Asuntos, el botón de nueva consulta al centro, Inmuebles y «Más». */
export const BARRA_TELEFONO = { antes: ["inicio", "asuntos"], despues: ["inmuebles"] } as const;

export function seccionesPara(esDirector: boolean): Seccion[] {
  return SECCIONES.filter((s) => esDirector || !s.soloDirector);
}

export function seccionPorRuta(ruta: string): Seccion | undefined {
  if (ruta === "/panel") return SECCIONES[0];
  return [...SECCIONES, CONSULTA, CONFIGURACION].find((s) => s.ruta !== "/panel" && (ruta === s.ruta || ruta.startsWith(s.ruta + "/")));
}
