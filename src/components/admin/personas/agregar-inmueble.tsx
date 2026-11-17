"use client";
import * as React from "react";
import { Plus } from "@/components/admin/icons";
import { buttonClass, Thumb } from "@/components/admin/kit";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatPrecio } from "@/data/propiedades";
import type { AdminProperty } from "@/lib/admin/store";

/*
  «Agregar inmueble» en «Sus inmuebles» de la ficha: un buscador con la foto, el nombre, la zona y el
  precio de cada inmueble del inventario. Los que ya están ligados a la persona no salen.
*/
const plano = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function AgregarInmueble({ propiedades, ligados, onElegir, disabled }: { propiedades: AdminProperty[]; ligados: string[]; onElegir: (p: AdminProperty) => void; disabled?: boolean }) {
  const [open, setOpen] = React.useState(false);
  const opciones = propiedades.filter(p => !ligados.includes(p.slug));
  const filtro = React.useCallback((valor: string, busca: string, claves?: string[]) => {
    const texto = plano([valor, ...(claves ?? [])].join(" "));
    return plano(busca).split(/\s+/).filter(Boolean).every(w => texto.includes(w)) ? 1 : 0;
  }, []);
  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild>
      <button type="button" className={buttonClass({ variant: "secondary" })} disabled={disabled}><Plus size={18} aria-hidden="true" />Agregar inmueble</button>
    </PopoverTrigger>
    <PopoverContent align="start" className="w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-[12px] border border-[var(--card-edge)] bg-card p-0 shadow-[var(--shadow-raised)]">
      <Command filter={filtro} label="Inmuebles para agregar">
        <CommandInput placeholder="Buscar por nombre, zona o clave" />
        <CommandList>
          <CommandEmpty>{opciones.length ? "Ningún inmueble coincide" : "Ya tiene todos los inmuebles"}</CommandEmpty>
          <CommandGroup>
            {opciones.map(p => <CommandItem key={p.slug} value={p.slug} keywords={[p.titulo, p.zona ?? "", p.codigo ?? ""]} onSelect={() => { setOpen(false); onElegir(p); }}>
              <Thumb src={p.galeria?.[0]?.src} size={40} />
              <span className="flex min-w-0 flex-1 flex-col"><span className="truncate">{p.titulo}</span><span className="truncate text-xs font-normal text-muted-foreground">{[p.zona, formatPrecio(p.precio)].filter(Boolean).join(" · ")}</span></span>
            </CommandItem>)}
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>;
}
