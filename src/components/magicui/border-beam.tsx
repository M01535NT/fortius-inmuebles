import { cn } from "@/lib/utils";

/*
  BorderBeam: haz de luz que recorre el borde del contenedor padre
  (position: relative requerido en el padre). Uso racionado: UNA vez por
  página, en el bloque de conversión. CSS en globals (.border-beam).
*/
export function BorderBeam({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn("border-beam", className)} />;
}
