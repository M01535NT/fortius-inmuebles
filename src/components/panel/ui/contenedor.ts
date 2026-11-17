/**
 * Dónde montar lo que flota (diálogos, menús, globos): dentro de la raíz del panel, no en <body>.
 * Así hereda la letra Geist, los tokens y el tema claro u oscuro que eligió la persona.
 */
export function contenedorPanel(): HTMLElement | undefined {
  if (typeof document === "undefined") return undefined;
  return document.querySelector<HTMLElement>("[data-panel-raiz]") ?? undefined;
}
