"use client";

import * as React from "react";
import { Search, X } from "@/components/admin/icons";
import { inputClass } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

/*
  «¿Con quién o sobre qué?» (SIM-17, C51). Un solo campo que busca persona, inmueble u
  operación y rellena los vínculos que hoy se guardan (prospecto, cliente, inmueble y
  operación). Elegir una operación trae a su cliente y su inmueble; elegir otra persona o
  inmueble la desvincula. Cada vínculo elegido se ve como una etiqueta con «Quitar».
*/

export type LinkValue = { leadId?: string; clienteId?: string; propiedadSlug?: string; expedienteId?: string };
export type LinkOperation = { id: string; folio: string; cliente_id: string; propiedad_slug?: string | null; asesor_id?: string };
type Kind = "lead" | "cliente" | "propiedad" | "expediente";
type Option = { kind: Kind; id: string; label: string; detail: string; search: string };
type Named = { id: string; nombre: string; telefono?: string; email?: string };

const KIND_LABEL: Record<Kind, string> = { lead: "Prospecto", cliente: "Cliente", propiedad: "Inmueble", expediente: "Operación" };
const fold = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function LinkPicker({ id, value, onChange, leads = [], clientes = [], propiedades = [], operations = [], kinds, disabled, hint, status, unavailable }: {
  id: string;
  value: LinkValue;
  /** El segundo argumento llega solo al elegir una operación, para que el formulario traiga lo que le toque (el asesor, por ejemplo). */
  onChange: (next: LinkValue, operation?: LinkOperation) => void;
  leads?: Named[];
  clientes?: Named[];
  propiedades?: { slug: string; codigo?: string; titulo: string; colonia?: string }[];
  operations?: LinkOperation[];
  /** Qué se puede buscar; las listas restantes solo ponen nombre a lo que ya está vinculado. */
  kinds?: Kind[];
  disabled?: boolean;
  hint?: string;
  status?: React.ReactNode;
  /** Texto para un vínculo guardado que ya no aparece en las listas. */
  unavailable?: Partial<Record<Kind, string>>;
}) {
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const listId = `${id}-opciones`;

  const options = React.useMemo<Option[]>(() => [
    ...leads.map(l => ({ kind: "lead" as const, id: l.id, label: l.nombre, detail: "Prospecto", search: fold(`${l.nombre} ${l.telefono ?? ""} ${l.email ?? ""}`) })),
    ...clientes.map(c => ({ kind: "cliente" as const, id: c.id, label: c.nombre, detail: "Cliente", search: fold(`${c.nombre} ${c.telefono ?? ""} ${c.email ?? ""}`) })),
    ...propiedades.map(p => ({ kind: "propiedad" as const, id: p.slug, label: p.codigo ? `${p.codigo} · ${p.titulo}` : p.titulo, detail: p.colonia ? `Inmueble · ${p.colonia}` : "Inmueble", search: fold(`${p.codigo ?? ""} ${p.titulo} ${p.colonia ?? ""}`) })),
    ...operations.map(o => {
      const cliente = clientes.find(c => c.id === o.cliente_id)?.nombre ?? "";
      const propiedad = propiedades.find(p => p.slug === o.propiedad_slug);
      return { kind: "expediente" as const, id: o.id, label: o.folio, detail: ["Operación", cliente, propiedad?.codigo].filter(Boolean).join(" · "), search: fold(`${o.folio} ${cliente} ${propiedad?.codigo ?? ""} ${propiedad?.titulo ?? ""}`) };
    }),
  ], [leads, clientes, propiedades, operations]);

  const words = fold(query).split(/\s+/).filter(Boolean);
  const results = words.length ? options.filter(o => (!kinds || kinds.includes(o.kind)) && words.every(w => o.search.includes(w))).slice(0, 8) : [];
  const showList = open && words.length > 0;

  const chips: { kind: Kind; label: string }[] = [];
  const nameOf = (kind: Kind, key?: string) => key ? options.find(o => o.kind === kind && o.id === key)?.label ?? unavailable?.[kind] ?? `${KIND_LABEL[kind]} no disponible` : "";
  if (value.expedienteId) chips.push({ kind: "expediente", label: nameOf("expediente", value.expedienteId) });
  if (value.leadId) chips.push({ kind: "lead", label: nameOf("lead", value.leadId) });
  if (value.clienteId) chips.push({ kind: "cliente", label: nameOf("cliente", value.clienteId) });
  if (value.propiedadSlug) chips.push({ kind: "propiedad", label: nameOf("propiedad", value.propiedadSlug) });

  function choose(option: Option) {
    if (option.kind === "expediente") {
      const operation = operations.find(o => o.id === option.id)!;
      onChange({ expedienteId: operation.id, clienteId: operation.cliente_id, propiedadSlug: operation.propiedad_slug ?? undefined }, operation);
    } else {
      const field = option.kind === "lead" ? "leadId" : option.kind === "cliente" ? "clienteId" : "propiedadSlug";
      onChange({ ...value, expedienteId: undefined, [field]: option.id });
    }
    setQuery(""); setOpen(false); setActive(0);
  }
  function remove(kind: Kind) {
    if (kind === "expediente") return onChange({ ...value, expedienteId: undefined });
    const field = kind === "lead" ? "leadId" : kind === "cliente" ? "clienteId" : "propiedadSlug";
    // Quitar algo que trajo la operación también la desvincula.
    onChange({ ...value, [field]: undefined, ...(kind !== "lead" ? { expedienteId: undefined } : {}) });
  }

  return <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className="text-sm font-medium text-foreground">¿Con quién o sobre qué?</label>
    {chips.length > 0 && <ul className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label="Vínculos elegidos">
      {chips.map(chip => <li key={chip.kind} className="inline-flex min-h-11 items-center gap-1 rounded-full border border-[var(--card-edge)] bg-card pl-3 text-sm">
        <span className="font-semibold">{`${KIND_LABEL[chip.kind]}: ${chip.label}`}</span>
        <button type="button" disabled={disabled} aria-label={`Quitar ${KIND_LABEL[chip.kind].toLowerCase()} ${chip.label}`} onClick={() => remove(chip.kind)} className="inline-flex size-11 items-center justify-center rounded-full text-muted-foreground hover:text-foreground disabled:opacity-50"><X size={16} aria-hidden="true" /></button>
      </li>)}
    </ul>}
    <div className="relative">
      <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <input id={id} type="search" role="combobox" autoComplete="off" disabled={disabled} aria-expanded={showList} aria-controls={listId} aria-autocomplete="list"
        aria-activedescendant={showList && results[active] ? `${listId}-${active}` : undefined}
        placeholder={kinds?.length === 1 && kinds[0] === "expediente" ? "Folio, cliente o código del inmueble" : "Nombre, teléfono, código de inmueble o folio"} className={cn(inputClass, "pl-10")} value={query}
        onChange={event => { setQuery(event.currentTarget.value); setOpen(true); setActive(0); }}
        onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}
        onKeyDown={event => {
          if (event.key === "ArrowDown" && results.length) { event.preventDefault(); setOpen(true); setActive(i => (i + 1) % results.length); }
          else if (event.key === "ArrowUp" && results.length) { event.preventDefault(); setActive(i => (i - 1 + results.length) % results.length); }
          else if (event.key === "Enter" && showList) { event.preventDefault(); if (results[active]) choose(results[active]); }
          else if (event.key === "Escape" && showList) { event.preventDefault(); setOpen(false); }
        }} />
      {showList && <ul id={listId} role="listbox" aria-label="Resultados" className="absolute inset-x-0 top-full z-30 m-0 mt-1 max-h-72 list-none overflow-auto rounded-[var(--radius-card)] border border-[var(--card-edge)] bg-card p-1 shadow-lg">
        {results.length ? results.map((option, index) => <li key={`${option.kind}-${option.id}`} id={`${listId}-${index}`} role="option" aria-selected={index === active}
          className={cn("flex min-h-11 cursor-pointer flex-col justify-center rounded-md px-3 py-1.5", index === active && "bg-muted")}
          onMouseDown={event => { event.preventDefault(); choose(option); }} onMouseEnter={() => setActive(index)}>
          <span className="text-sm font-semibold">{option.label}</span><span className="text-xs text-muted-foreground">{option.detail}</span>
        </li>) : <li role="option" aria-selected={false} aria-disabled="true" className="px-3 py-3 text-sm text-muted-foreground">Sin resultados. Prueba con otro nombre o folio.</li>}
      </ul>}
    </div>
    {hint && <p className="text-sm leading-relaxed text-muted-foreground">{hint}</p>}
    {status}
  </div>;
}
