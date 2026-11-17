import type { Moneda } from "./inicio-contrato";

/** Equipo (etapa 9 de PLAN.md; SPEC.md, sección 12): cómo va cada persona del equipo. Solo lo ve el director. */
export type ResumenMiembro = {
  id: string; nombre: string; director: boolean;
  /** Asuntos abiertos que lleva. */
  asuntos: number;
  /** Tareas de Fortius a su cargo: vencidas, de hoy y de mañana a siete días. */
  vencidas: number; hoy: number; semana: number;
  /** Asuntos abiertos sin nada pendiente en su plan (y que no están en espera). */
  sin_paso: number;
  /** Solicitudes del sitio que le tocan y siguen sin atender. */
  solicitudes: number;
  cobrar: Partial<Record<Moneda, number>>;
};
export type ResumenEquipo = { hoy: string; miembros: ResumenMiembro[]; sin_asignar: number };
