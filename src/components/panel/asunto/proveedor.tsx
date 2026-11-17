"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { leerAsuntos, leerEquipo, type FilaAsunto, type Miembro } from "@/lib/panel/asuntos/api";

type Ctx = {
  asuntos: FilaAsunto[] | null;
  error: string | null;
  recargar: () => Promise<void>;
  /** Pone al día un renglón de la lista sin volver a pedirla toda (después de cambiar el asunto abierto). */
  ponerFila: (f: FilaAsunto) => void;
  equipo: Miembro[];
  yo: string | null;
  nombreDe: (id: string | null | undefined) => string;
};

const Contexto = createContext<Ctx | null>(null);

/** La lista de asuntos y el equipo, compartidos por la lista y el asunto abierto. */
export function ProveedorAsuntos({ children }: { children: ReactNode }) {
  const [asuntos, setAsuntos] = useState<FilaAsunto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [equipo, setEquipo] = useState<Miembro[]>([]);
  const [yo, setYo] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    try { setAsuntos(await leerAsuntos()); setError(null); }
    catch (e) { setError(e instanceof Error ? e.message : "No se pudo cargar."); }
  }, []);

  useEffect(() => {
    let vivo = true;
    leerAsuntos().then((a) => { if (vivo) { setAsuntos(a); setError(null); } }, (e: unknown) => { if (vivo) setError(e instanceof Error ? e.message : "No se pudo cargar."); });
    leerEquipo().then((r) => { if (vivo) { setEquipo(r.equipo); setYo(r.yo); } }, () => {});
    return () => { vivo = false; };
  }, []);

  const ponerFila = useCallback((f: FilaAsunto) => {
    setAsuntos((lista) => {
      if (!lista) return lista;
      const i = lista.findIndex((x) => x.id === f.id);
      if (i < 0) return [f, ...lista];
      const nueva = [...lista];
      nueva[i] = f;
      return nueva;
    });
  }, []);

  const nombreDe = useCallback((id: string | null | undefined) => equipo.find((m) => m.id === id)?.nombre ?? "Otra persona del equipo", [equipo]);

  const valor = useMemo(() => ({ asuntos, error, recargar, ponerFila, equipo, yo, nombreDe }), [asuntos, error, recargar, ponerFila, equipo, yo, nombreDe]);
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useAsuntos(): Ctx {
  const c = useContext(Contexto);
  if (!c) throw new Error("useAsuntos va dentro de ProveedorAsuntos");
  return c;
}
