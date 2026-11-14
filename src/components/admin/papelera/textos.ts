/*
  Nombres de lo eliminado (NAV-13, N23) en un solo lugar. Aprobados por el titular el 13/11/2026:
  un solo lugar, «Eliminados», y un solo verbo, «Restaurar». Para cambiarlos basta editar este
  archivo: lo usan la pantalla, Administración, Operaciones, Historial y las confirmaciones.
  La dirección `/admin/papelera` es técnica y no cambia con el nombre.
*/
export const PAPELERA = {
  href: "/admin/papelera",
  /** Nombre del lugar: título de la pantalla y entrada de Administración. */
  nombre: "Eliminados",
  descripcion: "Todo lo eliminado que se puede restaurar, en un solo lugar.",
  /** Verbo único para devolver algo a su lugar. */
  restaurar: "Restaurar",
  /** Enlace desde Operaciones e Historial. */
  enlace: "Ver eliminados",
  operaciones: "Operaciones",
  registros: "Contactos, inmuebles, artículos, notas y citas",
  /** Frase de la confirmación de borrado según se pueda restaurar o no (género del objeto). */
  sePuedeRestaurar: { o: "Podrás restaurarlo desde Eliminados.", a: "Podrás restaurarla desde Eliminados." },
  noSePuedeRestaurar: "No se puede restaurar.",
} as const;
