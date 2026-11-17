"use client";
import { useSearchParams } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { useAvisos } from "@/components/panel/kit/avisos";
import { Boton } from "@/components/panel/kit/boton";
import { leerAsunto } from "@/lib/panel/asuntos/api";
import { empezarTrabajo, type Herramienta } from "@/lib/panel/documentos/api";

/** El asunto para el que se hace la cuenta (?asunto=…). Sin asunto, lo guardado queda en «Trabajos sueltos». */
export type AsuntoDeLaCuenta = { id: string; folio: string; nombre: string };

const Contexto = createContext<{ asunto: AsuntoDeLaCuenta | null; quitar: () => void } | null>(null);

/** Avisa a la lista de trabajos sueltos que hay uno nuevo. */
export const TRABAJOS_CAMBIARON = "pn-trabajos-cambiaron";

export function ConAsuntoDeLaCuenta({ children, alQuitar }: { children: ReactNode; alQuitar: () => void }) {
  const params = useSearchParams();
  const id = params.get("asunto");
  const [asunto, setAsunto] = useState<AsuntoDeLaCuenta | null>(null);
  useEffect(() => {
    let vivo = true;
    if (!id) { queueMicrotask(() => vivo && setAsunto(null)); return () => { vivo = false; }; }
    leerAsunto(id).then((a) => vivo && setAsunto({ id: a.id, folio: a.folio, nombre: a.nombre }), () => vivo && setAsunto(null));
    return () => { vivo = false; };
  }, [id]);
  return <Contexto.Provider value={{ asunto: id ? asunto : null, quitar: alQuitar }}>{children}</Contexto.Provider>;
}

export const useAsuntoDeLaCuenta = () => useContext(Contexto);

/** Lo que se guarda de una cuenta: lo que se vio, para leerlo después igual. */
export type CuentaGuardada = { titulo: string; para?: string; lineas: { k: string; v: string; grande?: boolean }[]; supuestos: string[]; fuente?: string; leyenda: string; fecha: string };

/** «Guardar»: suelta queda en Trabajos sueltos; con asunto, en sus Documentos. */
export function GuardarCuenta({ tipo, cuenta }: { tipo: Herramienta; cuenta: Omit<CuentaGuardada, "fecha"> }) {
  const ctx = useAsuntoDeLaCuenta();
  const { avisar } = useAvisos();
  const [guardando, setGuardando] = useState(false);
  if (!ctx) return null;
  const { asunto } = ctx;
  async function guardar() {
    setGuardando(true);
    try {
      const fecha = new Date().toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
      const principal = cuenta.lineas[0];
      await empezarTrabajo({
        clase: "herramienta", tipo, asunto_id: asunto?.id ?? null,
        datos: { ...cuenta, fecha }, resultado: principal ? `${principal.k}: ${principal.v}`.slice(0, 300) : undefined,
      });
      window.dispatchEvent(new Event(TRABAJOS_CAMBIARON));
      avisar(asunto ? `Guardado en los documentos de ${asunto.folio}` : "Guardado en Trabajos sueltos");
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  }
  return (
    <Boton variante="primario" bloque style={{ minHeight: 48 }} deshabilitado={guardando} onClick={guardar}>
      {guardando ? "Guardando…" : asunto ? `Guardar en ${asunto.folio}` : "Guardar"}
    </Boton>
  );
}
