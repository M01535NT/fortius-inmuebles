import { PantallaHerramienta } from "@/components/panel/herramientas/pantalla";

/**
 * Herramientas: en el teléfono el marco muestra solo la lista; en escritorio, la lista y la primera herramienta (Crédito),
 * como el boceto.
 */
export default function Herramientas() {
  return <PantallaHerramienta cual="credito" />;
}
