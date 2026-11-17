"use client";
import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { toast } from "sonner";

import { Toaster } from "@/components/panel/ui/sonner";

export type OpcionesAviso = {
  /** Texto del botón de la derecha. Para acciones que cambian datos va «Deshacer». */
  etiqueta?: string;
  alAccionar?: () => void;
  /** Milisegundos en pantalla. 5000 por omisión; con una acción (Deshacer), 10000, para que alcance quien usa teclado. */
  duracion?: number;
};

type Contexto = { avisar: (texto: string, opciones?: OpcionesAviso) => void };

const Ctx = createContext<Contexto | null>(null);

/**
 * Avisos breves abajo. Toda acción que cambia datos avisa con «Deshacer» (RP-102 y DECISIONES.md).
 * Por dentro usa sonner (sugerencia 8): se pausan al pasar el ratón o al enfocarlos, se descartan deslizando
 * y salen por el mismo lado por el que entran. Hasta tres a la vista.
 */
export function AvisosProvider({ children }: { children: ReactNode }) {
  const avisar = useCallback((texto: string, opciones: OpcionesAviso = {}) => {
    const { etiqueta, alAccionar } = opciones;
    const duracion = opciones.duracion ?? (etiqueta || alAccionar ? 10000 : 5000);
    toast(texto, {
      duration: duracion,
      action: etiqueta || alAccionar ? { label: etiqueta ?? "Listo", onClick: () => alAccionar?.() } : undefined,
    });
  }, []);
  const valor = useMemo(() => ({ avisar }), [avisar]);
  return (
    <Ctx.Provider value={valor}>
      {children}
      <Toaster visibleToasts={3} containerAriaLabel="Avisos" offset={{ bottom: 24 }} mobileOffset={{ bottom: 88 }} />
    </Ctx.Provider>
  );
}

export function useAvisos(): Contexto {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAvisos va dentro de AvisosProvider");
  return c;
}
