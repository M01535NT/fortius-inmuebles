"use client";
import * as React from "react";
import { buttonClass } from "@/components/admin/kit";
import { Check, Plus } from "@/components/admin/icons";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FORMATOS } from "@/lib/formatos/catalog";
import { normalizedText } from "@/lib/admin/workspace";
import { cn } from "@/lib/utils";

/*
  FLX-02: «Crear documento» con cualquier formato, sin esperar a su etapa. Si el formato ya existe
  en el asunto se abre el que hay; los que se repiten (reportes, visitas, propuestas…) crean otro.
  El 03 no va: es la cartera global de Control comercial.
*/

/** Formatos que un asunto lleva varias veces: «Crear documento» hace uno nuevo en lugar de abrir el que hay. */
export const REPEATABLE: Record<string, string> = { "11": "Nuevo reporte", "13": "Registrar otra visita", "14": "Otra propuesta", "19": "Otro presupuesto", "22": "Solicitud de otro candidato" };

const GROUPS: ReadonlyArray<{ title: string; ids: readonly string[] }> = [
  { title: "Con el propietario", ids: ["01", "02", "04A", "04B", "04C", "04D", "04E", "04F", "04G", "05", "06", "07", "08", "09", "10", "11", "19"] },
  { title: "Con el comprador y el cierre", ids: ["12", "13", "14", "15", "24", "16", "17", "18"] },
  { title: "Renta", ids: ["21", "22", "20", "23"] },
];
const TITLE = new Map(FORMATOS.map(f => [f.id, f.title]));
/** Los formatos que «Crear documento» ofrece (también lo que acepta `?crear=` al abrir un asunto). */
export const CREATABLE: ReadonlySet<string> = new Set(GROUPS.flatMap(g => g.ids));

export function CreateDocument({ exists, onCreate, disabled, label = "Crear documento", variant = "secondary", where, targets }: {
  /** El asunto ya tiene un documento de ese formato (se abre en lugar de crear otro). */
  exists?: (formatoId: string) => boolean;
  /** `target`: el asunto elegido cuando hay varios (`targets`). */
  onCreate: (formatoId: string, target?: string) => void;
  disabled?: boolean; label?: string; variant?: "primary" | "secondary" | "ghost";
  /** En la persona o el inmueble: el asunto donde se crea (los formatos viven dentro de un asunto). */
  where?: string;
  /** En el inmueble con varios asuntos: se elige en cuál se crea. */
  targets?: ReadonlyArray<{ id: string; label: string }>;
}) {
  const [open, setOpen] = React.useState(false);
  const [target, setTarget] = React.useState(targets?.[0]?.id);
  const chosen = targets?.some(t => t.id === target) ? target : targets?.[0]?.id;
  const filter = React.useCallback((value: string, search: string, keywords?: string[]) => {
    const hay = normalizedText([value, ...(keywords ?? [])].join(" "));
    return normalizedText(search).split(/\s+/).filter(Boolean).every(word => hay.includes(word)) ? 1 : 0;
  }, []);
  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild>
      <button type="button" className={buttonClass({ variant })} disabled={disabled} aria-haspopup="dialog"><Plus size={16} aria-hidden="true" />{label}</button>
    </PopoverTrigger>
    <PopoverContent align="end" collisionPadding={{ top: 16, bottom: 96, left: 16, right: 16 }} aria-label="Elegir el documento" className="w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-[12px] border border-[var(--card-edge)] bg-card p-0 shadow-[var(--shadow-raised)]">
      <Command filter={filter}>
        {targets && targets.length > 1
          ? <div className="flex items-center gap-2 border-b border-[var(--card-edge)] px-3 py-2 text-xs text-muted-foreground"><span className="shrink-0">Se crea en</span>
            <Select value={chosen} onValueChange={setTarget}><SelectTrigger size="sm" aria-label="Asunto donde se crea"><SelectValue /></SelectTrigger>
              <SelectContent>{targets.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}</SelectContent></Select></div>
          : where && <p className="m-0 border-b border-[var(--card-edge)] px-3 py-2 text-xs text-muted-foreground">Se crea en {where}</p>}
        <CommandInput placeholder="Buscar formato…" aria-label="Buscar formato" />
        <CommandList className="max-h-[min(24rem,calc(var(--radix-popover-content-available-height,60vh)-4.5rem))]">
          <CommandEmpty>No hay un formato con ese nombre.</CommandEmpty>
          {GROUPS.map(group => <CommandGroup key={group.title} heading={group.title}>
            {group.ids.map(id => {
              const there = !REPEATABLE[id] && !!exists?.(id);
              return <CommandItem key={id} value={id} keywords={[TITLE.get(id) ?? id]} onSelect={() => { setOpen(false); onCreate(id, chosen); }}>
                <span className="w-9 shrink-0 tabular-nums text-muted-foreground">{id}</span>
                <span className="flex min-w-0 flex-1 flex-col"><span className="truncate">{TITLE.get(id)}</span>{there && <span className="text-xs font-normal text-muted-foreground">Ya está en el asunto: se abre</span>}</span>
                <Check size={16} aria-hidden="true" className={cn("ml-auto !text-foreground", there ? "opacity-100" : "opacity-0")} />
              </CommandItem>;
            })}
          </CommandGroup>)}
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>;
}
