"use client";
import { Gesto } from "@/components/panel/icons";
import { useAvisos } from "@/components/panel/kit/avisos";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/panel/ui/dropdown-menu";
import { enlaceWhatsApp } from "@/lib/panel/datos/consultas";

/**
 * Menú «⋯» de una fila (sugerencia 11): llamar, WhatsApp, copiar el teléfono y compartir la ficha sin abrirla.
 * Solo acciones que no guardan nada; lo que escribe llega con el modelo base.
 */
export function MenuFila({ nombre, telefono, ruta, saludo }: { nombre: string; telefono?: string; ruta: string; saludo?: string }) {
  const { avisar } = useAvisos();
  const tel = telefono?.replace(/[^\d+]/g, "");
  const wa = telefono ? enlaceWhatsApp(telefono, saludo ?? `Hola ${nombre.split(/\s+/)[0] ?? ""}, te escribo de Fortius Inmuebles.`) : null;
  const copiar = (texto: string, aviso: string) =>
    navigator.clipboard?.writeText(texto).then(() => avisar(aviso), () => avisar("No se pudo copiar"));
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="pn-iconbtn" aria-label={`Más acciones para ${nombre}`}>
        <Gesto nombre="puntos" tamano={18} />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {tel ? <DropdownMenuItem asChild><a href={`tel:${tel}`}>Llamar</a></DropdownMenuItem> : null}
        {wa ? <DropdownMenuItem asChild><a href={wa} target="_blank" rel="noopener noreferrer">WhatsApp</a></DropdownMenuItem> : null}
        {telefono ? <DropdownMenuItem onSelect={() => copiar(telefono, "Teléfono copiado")}>Copiar teléfono</DropdownMenuItem> : null}
        {tel || telefono ? <DropdownMenuSeparator /> : null}
        <DropdownMenuItem onSelect={() => copiar(new URL(ruta, window.location.origin).toString(), "Enlace a la ficha copiado")}>Copiar enlace a la ficha</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
