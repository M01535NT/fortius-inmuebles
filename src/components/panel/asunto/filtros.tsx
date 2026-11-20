"use client";
import { useSearchParams } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { useCatalogos } from "@/components/panel/datos/catalogos";
import { useMisPreferencias } from "@/components/panel/datos/use-mis-preferencias";
import { EN_QUE_VA, hoyTexto, type EnQueVa, type FilaAsunto } from "@/lib/panel/asuntos/api";

import { useAsuntos } from "./proveedor";

/**
 * Qué ver de la lista (hallazgo 38). Vacío son los abiertos, que es como abre; «todos» incluye los cerrados. Además: los
 * favoritos, en espera, atrasados, sin siguiente paso, por etapa de «En qué va» y por encargo («encargo:<clave>»).
 */
export type Que = "" | "todos" | "favoritos" | "espera" | "atrasados" | "sin_siguiente" | EnQueVa | `encargo:${string}`;
const FIJOS = ["todos", "favoritos", "espera", "atrasados", "sin_siguiente"] as const;
/** Lo que se lee de una vista guardada: si no es una opción conocida, se queda en los abiertos. */
export function queDe(w: string | undefined): Que {
  if (!w) return "";
  if ((FIJOS as readonly string[]).includes(w) || (EN_QUE_VA as readonly string[]).includes(w)) return w as Que;
  return w.startsWith("encargo:") && w.length > 8 ? (w as Que) : "";
}
/** Si un asunto entra en «Qué ver». `hoy`: AAAA-MM-DD, para «Atrasados». */
export function pasaQue(a: FilaAsunto, que: Que, favoritos: ReadonlySet<string>, hoy: string): boolean {
  const abierto = a.en_que_va !== "cerrado";
  if (que === "") return abierto;
  if (que === "todos") return true;
  if (que === "favoritos") return favoritos.has(a.id);
  if (que === "espera") return abierto && a.en_espera;
  if (que === "atrasados") return abierto && !a.en_espera && Boolean(a.siguiente?.fecha && a.siguiente.fecha < hoy);
  if (que === "sin_siguiente") return abierto && !a.en_espera && !a.siguiente;
  if (que.startsWith("encargo:")) return abierto && a.encargos.includes(que.slice(8) as FilaAsunto["encargos"][number]);
  return a.en_que_va === que;
}

/** Cómo se ven los asuntos (modelo visual: «Lista · Tablero · Tiempo»). Cada quien guarda la suya en este navegador. */
export const VISTA_ASUNTOS = "fortius-panel-asuntos-vista";
export const VISTAS_ASUNTOS = [
  { valor: "lista", etiqueta: "Lista" },
  { valor: "tablero", etiqueta: "Tablero" },
  { valor: "tiempo", etiqueta: "Tiempo" },
] as const;
export type VistaAsuntos = (typeof VISTAS_ASUNTOS)[number]["valor"];
export const vistaDe = (v: string): VistaAsuntos => (v === "tablero" || v === "tiempo" ? v : "lista");

type Ctx = {
  q: string; setQ: (v: string) => void;
  que: Que; setQue: (v: Que) => void;
  lleva: string; setLleva: (v: string) => void;
};
const Contexto = createContext<Ctx | null>(null);

/**
 * La búsqueda y los filtros de Asuntos, compartidos por la lista, el tablero y la vista en el tiempo: al cambiar de vista
 * se sigue viendo lo mismo.
 */
export function ProveedorFiltros({ children }: { children: ReactNode }) {
  const [q, setQ] = useState("");
  const [que, setQue] = useState<Que>("");
  const [lleva, setLleva] = useState("");
  const valor = useMemo(() => ({ q, setQ, que, setQue, lleva, setLleva }), [q, que, lleva]);
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useFiltrosAsuntos(): Ctx {
  const c = useContext(Contexto);
  if (!c) throw new Error("useFiltrosAsuntos va dentro de ProveedorFiltros");
  return c;
}

/** Desde Equipo, «Ver» llega con ?de=<persona>: Asuntos abre con «Quién lo lleva» ya elegido. */
export function LeerDe() {
  const de = useSearchParams().get("de");
  const { setLleva } = useFiltrosAsuntos();
  useEffect(() => { if (de) setLleva(de); }, [de, setLleva]);
  return null;
}

export const sinAcentos = (t: string) => t.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** Abiertos antes que cerrados; luego lo que sigue, lo más pronto primero; sin fecha al final. */
export function ordenar(a: FilaAsunto, b: FilaAsunto): number {
  const ca = a.en_que_va === "cerrado" ? 1 : 0, cb = b.en_que_va === "cerrado" ? 1 : 0;
  if (ca !== cb) return ca - cb;
  const fa = a.siguiente?.fecha ?? "9999", fb = b.siguiente?.fecha ?? "9999";
  return fa === fb ? b.updated_at.localeCompare(a.updated_at) : fa.localeCompare(fb);
}

/** La lista con la búsqueda y los filtros puestos, y las opciones de cada filtro con su cuenta. */
export function useAsuntosFiltrados() {
  const { asuntos, equipo } = useAsuntos();
  const { q, que, lleva } = useFiltrosAsuntos();
  const prefs = useMisPreferencias();
  const cat = useCatalogos();
  const favoritos = useMemo(() => new Set((prefs.panel.favoritos ?? []).filter((f) => f.tipo === "asunto").map((f) => f.id)), [prefs.panel.favoritos]);
  const base = useMemo(() => asuntos ?? [], [asuntos]);
  const hoy = hoyTexto();
  const lista = useMemo(() => {
    const t = sinAcentos(q.trim());
    return base
      .filter((a) => pasaQue(a, que, favoritos, hoy) && (!lleva || a.responsable_id === lleva)
        && (!t || sinAcentos(`${a.nombre} ${a.busqueda} ${a.siguiente?.titulo ?? ""}`).includes(t)))
      .sort(ordenar);
  }, [base, q, que, lleva, favoritos, hoy]);
  const cuenta = (w: Que) => base.filter((a) => pasaQue(a, w, favoritos, hoy)).length;
  const opcionesQue: { valor: Que; etiqueta: string }[] = [
    { valor: "", etiqueta: `Abiertos · ${cuenta("")}` },
    { valor: "todos", etiqueta: `Todos, con los cerrados · ${base.length}` },
    ...(favoritos.size ? [{ valor: "favoritos" as const, etiqueta: `Favoritos · ${cuenta("favoritos")}` }] : []),
    { valor: "atrasados", etiqueta: `Atrasados · ${cuenta("atrasados")}` },
    { valor: "sin_siguiente", etiqueta: `Sin siguiente paso · ${cuenta("sin_siguiente")}` },
    { valor: "espera", etiqueta: `En espera · ${cuenta("espera")}` },
    ...cat.opciones("en_que_va").map((m) => ({ valor: m.valor as EnQueVa, etiqueta: `${m.etiqueta} · ${cuenta(m.valor as EnQueVa)}` })),
    ...cat.opciones("encargo").map((m) => ({ valor: `encargo:${m.valor}` as Que, etiqueta: `Para ${m.etiqueta.toLowerCase()} · ${cuenta(`encargo:${m.valor}`)}` })),
  ];
  const presentes = new Set(base.map((a) => a.responsable_id));
  const opcionesLleva = [{ valor: "", etiqueta: "Todo el equipo" }, ...equipo.filter((m) => presentes.has(m.id)).map((m) => ({ valor: m.id, etiqueta: m.nombre }))];
  return { base, lista, opcionesQue, opcionesLleva, favoritos };
}
