"use client";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

/**
 * Lo que una pantalla pone en el armazón (boceto «Inicio»):
 * en el teléfono, la barra de arriba (regresar, título fijo, el «+» y un botón extra); en las dos, «Buscar o crear».
 * Sin registrar nada, el «+» abre «Buscar o crear», que también crea.
 */
export type AccionBarra = { etiqueta: string; alPulsar: () => void };
export type BarraTelefono = {
  /** «‹ Hoy» en lugar de la O (pantallas que se abren desde otra). */
  volver?: { href: string; texto: string };
  /** Título del centro, siempre visible (sin él, sale el nombre de la sección al bajar). */
  titulo?: string;
  /** El «+» de la derecha. */
  nuevo?: AccionBarra;
  /** Botón pequeño antes del «+» (Agenda: «Hoy» cuando ves otro día). */
  extra?: AccionBarra | null;
  /** Ocultar Buscar y tu perfil (pantallas con su propia barra, como la del boceto de Agenda). */
  sinBuscar?: boolean;
};

type Ctx = {
  barra: BarraTelefono | null;
  poner: (b: BarraTelefono | null) => void;
  abrirBuscar: (texto?: string) => void;
};

const Contexto = createContext<Ctx | null>(null);

export function ProveedorBarra({ children, abrirBuscar }: { children: ReactNode; abrirBuscar: (texto?: string) => void }) {
  const [barra, poner] = useState<BarraTelefono | null>(null);
  const valor = useMemo(() => ({ barra, poner, abrirBuscar }), [barra, abrirBuscar]);
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useBarraActual(): BarraTelefono | null {
  return useContext(Contexto)?.barra ?? null;
}

/** Abre «Buscar o crear» (Ctrl K) desde cualquier pantalla; con texto, ya escrito. */
export function useBuscarOCrear(): (texto?: string) => void {
  const c = useContext(Contexto);
  return c?.abrirBuscar ?? (() => undefined);
}

/**
 * Una pantalla declara su barra de arriba del teléfono. Solo se vuelve a poner cuando cambia lo que se ve
 * (textos y destinos); las funciones siempre llaman a la versión más reciente.
 */
export function useBarraTelefono(b: BarraTelefono) {
  const c = useContext(Contexto);
  const poner = c?.poner;
  const ultima = useRef(b);
  useEffect(() => { ultima.current = b; });
  const clave = JSON.stringify([b.volver, b.titulo, b.nuevo?.etiqueta ?? null, b.extra?.etiqueta ?? null, b.sinBuscar ?? false]);
  useEffect(() => {
    if (!poner) return;
    const [volver, titulo, nuevo, extra, sinBuscar] = JSON.parse(clave) as [BarraTelefono["volver"], string | undefined, string | null, string | null, boolean];
    poner({
      volver: volver ?? undefined, titulo, sinBuscar,
      nuevo: nuevo ? { etiqueta: nuevo, alPulsar: () => ultima.current.nuevo?.alPulsar() } : undefined,
      extra: extra ? { etiqueta: extra, alPulsar: () => ultima.current.extra?.alPulsar() } : null,
    });
    return () => poner(null);
  }, [clave, poner]);
}
