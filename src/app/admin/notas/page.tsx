import { redirect } from "next/navigation";

/*
  DEC-42 (titular, 12/11/2026): se retira el tablero de notas sueltas. Las notas viven en el
  inmueble, la operación o la persona; lo que el director dice a todo el equipo es un «Aviso» en Hoy.
  Las notas que ya existían siguen en la base y en Historial.
*/
export default function NotasPage() {
  redirect("/admin");
}
