import * as React from "react";
import { cn } from "@/lib/utils";

/*
  Tabla del panel (shadcn/ui «Table», DEC-51 y DEC-52): para las tablas completas (Herramientas,
  Reportes y las vistas de tabla de las listas). Se desplaza de lado dentro de su caja en celular,
  sin mover la página. Encabezados solo donde RP-104 los permite.
*/
export function Table({ className, ...props }: React.ComponentProps<"table">) {
  return <div data-slot="table-container" className="relative w-full overflow-x-auto">
    <table data-slot="table" className={cn("w-full caption-bottom border-collapse text-[0.9375rem]", className)} {...props} />
  </div>;
}
export function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return <thead data-slot="table-header" className={cn("[&_tr]:border-b [&_tr]:border-[var(--card-edge)]", className)} {...props} />;
}
export function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody data-slot="table-body" className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}
export function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return <tfoot data-slot="table-footer" className={cn("border-t border-[var(--card-edge)] bg-secondary font-semibold", className)} {...props} />;
}
export function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return <tr data-slot="table-row" className={cn("border-b border-[var(--card-edge)] transition-colors hover:bg-[var(--panel-selected)] data-[state=selected]:bg-[var(--panel-selected)]", className)} {...props} />;
}
export function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return <th data-slot="table-head" className={cn("h-10 whitespace-nowrap px-3 text-left align-middle text-[0.8125rem] font-semibold text-muted-foreground", className)} {...props} />;
}
export function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return <td data-slot="table-cell" className={cn("px-3 py-2.5 align-middle", className)} {...props} />;
}
export function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
  return <caption data-slot="table-caption" className={cn("mt-3 text-sm text-muted-foreground", className)} {...props} />;
}
