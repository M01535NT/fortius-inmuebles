"use client";
import * as React from "react";
import { db, useCollection, useLoadState, type Archivo } from "@/lib/admin/store";
import { btnGhost, inputClass } from "@/components/admin/ui";
export function LibraryPicker({ kind, onChoose, allowed }: { kind: "imagen" | "pdf"; onChoose: (file: Archivo) => void; allowed: (url: string) => boolean }) {
  const [open, setOpen] = React.useState(false), [query, setQuery] = React.useState("");
  const files = useCollection(db.archivos, open), state = useLoadState(db.archivos);
  const matches = files.filter(file => file.tipo === kind && allowed(file.url) && file.nombre.toLocaleLowerCase("es").includes(query.toLocaleLowerCase("es")));
  return <div className="mt-4"><button type="button" className={btnGhost} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Cerrar biblioteca" : kind === "imagen" ? "Elegir foto de la biblioteca" : "Elegir PDF de la biblioteca"}</button>{open && <div className="mt-3 space-y-3 rounded-lg border border-border p-4"><label className="block text-sm">Buscar archivo público<input className={inputClass} value={query} onChange={event => setQuery(event.target.value)}/></label>{state.status === "error" ? <div role="alert">No se pudo cargar la biblioteca.<button type="button" className={btnGhost} onClick={() => {void db.archivos.load().catch(() => {});}}>Reintentar biblioteca</button></div> : state.status !== "ready" ? <p role="status">Cargando biblioteca…</p> : matches.length === 0 ? <p className="text-sm">No hay archivos públicos de este tipo. Puedes cargar uno en este formulario.</p> : <ul className="max-h-64 space-y-2 overflow-auto">{matches.map(file => <li key={file.id}><button type="button" className={btnGhost + " w-full justify-start"} onClick={() => {onChoose(file);setOpen(false);}}>{file.nombre}</button></li>)}</ul>}<p className="text-xs text-muted-foreground">Solo archivos aptos para la ficha pública. Guarda el inmueble para ligarlos.</p></div>}</div>;
}
