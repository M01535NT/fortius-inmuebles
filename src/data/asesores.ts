/*
  DATOS DEMO — asesores ficticios (placeholder). El cliente cargará el equipo
  real desde el panel de administración (T030/T040). No usar fotos de personas;
  el avatar es un círculo con iniciales hasta tener retratos reales.
*/

export type Asesor = {
  id: string;
  nombre: string;
  cargo: string;
  iniciales: string;
  // TODO: whatsapp, telefono y foto cuando exista el equipo real (T031).
};

export const asesores: Asesor[] = [
  {
    id: "asesor-01",
    nombre: "Mariana Estrada",
    cargo: "Asesora titular · Residencial",
    iniciales: "ME",
  },
  {
    id: "asesor-02",
    nombre: "Rodrigo Valle",
    cargo: "Asesor titular · Comercial e industrial",
    iniciales: "RV",
  },
];

export function getAsesorById(id: string): Asesor | undefined {
  return asesores.find((a) => a.id === id);
}
