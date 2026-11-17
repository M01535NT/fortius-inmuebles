import type { ResumenEquipo } from "@/lib/backend/equipo-contrato";

import { pedir } from "./asuntos/api";

export * from "@/lib/backend/equipo-contrato";

export const leerResumenEquipo = () => pedir<{ equipo: ResumenEquipo }>("/api/admin/equipo").then((r) => r.equipo);
