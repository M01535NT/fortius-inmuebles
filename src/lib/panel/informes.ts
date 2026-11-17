import type { MaterialInforme, OpcionesInforme } from "@/lib/formatos/documento/informe";
import { pedir } from "@/lib/panel/asuntos/api";

export * from "@/lib/formatos/documento/informe";

export type InformeHecho = { numero: number; documento_id: string; archivo_id: string | null; nombre: string };

const ruta = (asuntoId: string) => `/api/admin/asuntos/${asuntoId}/informe`;

/** Lo que el asunto puede decir en un informe para el cliente. */
export const leerMaterialInforme = (asuntoId: string) => pedir<{ material: MaterialInforme }>(ruta(asuntoId)).then((r) => r.material);

/** Hace el informe: queda en los Documentos del asunto con su número. No se envía solo. */
export const hacerInforme = (asuntoId: string, opciones: OpcionesInforme) =>
  pedir<{ informe: InformeHecho }>(ruta(asuntoId), "POST", opciones).then((r) => r.informe);
