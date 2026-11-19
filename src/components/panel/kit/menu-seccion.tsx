"use client";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { usePreferencia } from "@/components/panel/almacen";
import { Gesto, Icono, type NombreIcono } from "@/components/panel/icons";

/**
 * Los filtros de la sección en el menú lateral (modelo visual): Directorio pone «Todas, Clientes, Contactos sin asunto,
 * Por llamar»; Inmuebles, su inventario. Es lo que hace la barra lateral de Mail o de Finder: la sección elige qué
 * se ve en la lista sin abrir otra lista desplegable. En el teléfono no hay menú lateral y la sección enseña su desplegable.
 */
export type OpcionMenu = { valor: string; etiqueta: string; cuenta?: number; icono?: NombreIcono };
export type GrupoMenu = { titulo: string; valor: string; opciones: OpcionMenu[]; alElegir: (v: string) => void };

type Ctx = { grupo: GrupoMenu | null; poner: (g: GrupoMenu | null) => void };
const Contexto = createContext<Ctx | null>(null);

export function ProveedorMenuSeccion({ children }: { children: ReactNode }) {
  const [grupo, poner] = useState<GrupoMenu | null>(null);
  const valor = useMemo(() => ({ grupo, poner }), [grupo]);
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

/** Una sección pone su grupo en el menú mientras se ve. Solo se vuelve a poner cuando cambia lo que se ve. */
export function useGrupoDelMenu(g: GrupoMenu | null) {
  const poner = useContext(Contexto)?.poner;
  const ultima = useRef(g);
  useEffect(() => { ultima.current = g; });
  const clave = g ? JSON.stringify([g.titulo, g.valor, g.opciones]) : "";
  useEffect(() => {
    if (!poner) return;
    if (!clave) { poner(null); return; }
    const [titulo, valor, opciones] = JSON.parse(clave) as [string, string, OpcionMenu[]];
    poner({ titulo, valor, opciones, alElegir: (v) => ultima.current?.alElegir(v) });
    return () => poner(null);
  }, [clave, poner]);
}

/** Un grupo del menú con su título; un clic en el título lo pliega y el panel lo recuerda. */
export function GrupoPlegable({ titulo, clave, children }: { titulo: string; clave: string; children: ReactNode }) {
  const [abierto, guardar] = usePreferencia(`fortius-panel-grupo-${clave}`, "si");
  const si = abierto !== "no";
  return (
    <div className="pn-grupo-menu">
      <button type="button" className="pn-sec" aria-expanded={si} onClick={() => guardar(si ? "no" : null)}>
        {titulo}<Gesto nombre="abajo" tamano={12} />
      </button>
      {si ? <div className="pn-grupo-menu-c">{children}</div> : null}
    </div>
  );
}

/** El grupo que puso la sección, como renglones del menú. */
export function GrupoDeSeccion({ contraido }: { contraido: boolean }) {
  const g = useContext(Contexto)?.grupo;
  if (!g || contraido) return null;
  return (
    <GrupoPlegable titulo={g.titulo} clave={`seccion-${g.titulo}`}>
      <div role="radiogroup" aria-label={g.titulo}>
        {g.opciones.map((o) => (
          <button key={o.valor} type="button" role="radio" aria-checked={o.valor === g.valor} className="pn-link pn-filtro-menu"
            aria-current={o.valor === g.valor ? "page" : undefined} onClick={() => g.alElegir(o.valor)}>
            {o.icono ? <Icono nombre={o.icono} tamano={16} /> : null}
            <span className="pn-txt">{o.etiqueta}</span>
            {o.cuenta ? <span className="pn-nav-n">{o.cuenta}</span> : null}
          </button>
        ))}
      </div>
    </GrupoPlegable>
  );
}
