"use client";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { usePreferencia } from "@/components/panel/almacen";
import type { Recordatorios } from "@/lib/backend/recordatorios";
import { pedir } from "@/lib/panel/asuntos/api";
import { CLAVE_AVISOS, leerAvisos } from "@/lib/panel/datos/configuracion";

/**
 * Recordatorios de vencimientos (SPEC.md, sección 15). Mientras el panel está abierto revisa cada cinco minutos (y al
 * volver a la pestaña) lo que te toca: pone el número en «Inicio» y, si diste permiso en Configuración, avisa en el
 * navegador una hora antes de una cita, cuando entra una solicitud del sitio, cuando te mencionan o te dejan una tarea,
 * y una vez al día con lo vencido. Cada aviso respeta su interruptor de Configuración → Avisos. Nada se manda fuera.
 */
type Ctx = { cuenta: number; datos: Recordatorios | null; revisar: () => void };
const Contexto = createContext<Ctx>({ cuenta: 0, datos: null, revisar: () => undefined });
export const useRecordatorios = () => useContext(Contexto);

const CADA = 5 * 60_000;
const CLAVE_YA = "fortius-panel-avisados";

/** Lo ya avisado en este navegador (para no repetir), con tope para que no crezca sin fin. */
function yaAvisados(): Set<string> {
  try { const v: unknown = JSON.parse(window.localStorage.getItem(CLAVE_YA) ?? "[]"); return new Set(Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []); }
  catch { return new Set(); }
}
function anotarAvisados(s: Set<string>) {
  try { window.localStorage.setItem(CLAVE_YA, JSON.stringify([...s].slice(-300))); } catch { /* sin almacenamiento */ }
}

export const puedeAvisarElNavegador = () => typeof window !== "undefined" && "Notification" in window;

export function ProveedorRecordatorios({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [datos, setDatos] = useState<Recordatorios | null>(null);
  const [crudo] = usePreferencia(CLAVE_AVISOS, "");
  const avisos = useMemo(() => leerAvisos(crudo), [crudo]);
  const primera = useRef(true);

  const avisar = useCallback((clave: string, titulo: string, cuerpo: string, ruta: string, ya: Set<string>) => {
    if (ya.has(clave)) return;
    ya.add(clave);
    try {
      const n = new Notification(titulo, { body: cuerpo, tag: clave, icon: "/icon.png" });
      n.onclick = () => { window.focus(); router.push(ruta); n.close(); };
    } catch { /* el navegador no dejó: el número de Inicio sigue */ }
  }, [router]);

  const revisar = useCallback(() => {
    pedir<{ recordatorios: Recordatorios }>("/api/admin/inicio/recordatorios").then((r) => {
      const d = r.recordatorios;
      setDatos(d);
      if (!puedeAvisarElNavegador() || Notification.permission !== "granted") return;
      const ya = yaAvisados();
      // La primera revisión al entrar solo marca lo que ya había: se avisa de lo que llegue después.
      const soloMarcar = primera.current;
      primera.current = false;
      const ahora = new Date();
      const minHoy = ahora.getHours() * 60 + ahora.getMinutes();
      if (avisos.citas) {
        for (const t of d.tareas) {
          if (t.fecha !== d.hoy || !t.hora) continue;
          const [h, m] = t.hora.split(":").map(Number);
          const falta = h * 60 + m - minHoy;
          if (falta >= 0 && falta <= 60) avisar(`cita-${t.id}-${t.fecha}`, `A las ${t.hora}: ${t.titulo}`, "Es en menos de una hora.", t.asunto_id ? `/admin/asuntos/${t.asunto_id}?ver=plan` : "/admin", ya);
        }
      }
      if (avisos.consultas) {
        for (const s of d.solicitudes) {
          const clave = `sol-${s.id}`;
          if (soloMarcar) ya.add(clave); else avisar(clave, "Solicitud nueva del sitio", s.nombre || "Sin nombre", "/admin", ya);
        }
      }
      if (avisos.asignados) {
        for (const x of d.paraTi) {
          const clave = `pt-${x.id}`;
          if (soloMarcar) ya.add(clave); else avisar(clave, x.clase === "mencion" ? "Te mencionaron" : "Te dejaron una tarea", x.texto.slice(0, 140), "/admin", ya);
        }
      }
      if (avisos.vencimientos) {
        const vencidas = d.tareas.filter((t) => t.fecha < d.hoy).length;
        if (vencidas || d.documentos) {
          const partes = [vencidas ? `${vencidas} pendiente${vencidas === 1 ? "" : "s"} con fecha pasada` : "", d.documentos ? `${d.documentos} documento${d.documentos === 1 ? "" : "s"} por vencer o vencido${d.documentos === 1 ? "" : "s"}` : ""].filter(Boolean);
          avisar(`dia-${d.hoy}`, "Lo que se te pasó", partes.join(" y ") + ".", "/admin", ya);
        }
      }
      anotarAvisados(ya);
    }, () => undefined);
  }, [avisos, avisar]);

  useEffect(() => {
    revisar();
    const t = setInterval(revisar, CADA);
    const alVolver = () => { if (document.visibilityState === "visible") revisar(); };
    document.addEventListener("visibilitychange", alVolver);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", alVolver); };
  }, [revisar]);

  const cuenta = datos ? datos.tareas.length + datos.solicitudes.length + datos.paraTiNuevos : 0;
  const valor = useMemo(() => ({ cuenta, datos, revisar }), [cuenta, datos, revisar]);
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}
