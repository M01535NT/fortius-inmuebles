import { redirect } from "next/navigation";

/** «Costos de cierre» se separó en Gastos del comprador y Gastos del vendedor. */
export default function Costos() {
  redirect("/admin/herramientas/compra");
}
