"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, type ReactNode } from "react";

import { Gesto, Icono, type NombreIcono } from "@/components/panel/icons";
import { Tarjeta } from "@/components/panel/kit/lista";

import "./herramientas.css";

type Herramienta = { ruta: string; nombre: string; sub: string; icono: NombreIcono };

/** Las herramientas del boceto; las tres abren su calculadora (Costos de cierre ya no lleva «Pronto»). */
export const HERRAMIENTAS: readonly Herramienta[] = [
  { ruta: "/panel/herramientas/credito", nombre: "Crédito hipotecario", sub: "Mensualidad según enganche, plazo y tasa", icono: "edificio" },
  { ruta: "/panel/herramientas/comision", nombre: "Comisión", sub: "Lo que cobra Fortius por una venta, con IVA", icono: "precio" },
  { ruta: "/panel/herramientas/costos", nombre: "Costos de cierre", sub: "ISAI, Registro, notaría y crédito en Baja California", icono: "costos" },
];

const INDICE = "/panel/herramientas";

/**
 * Marco de Herramientas, como el boceto. Teléfono: el índice es la lista y cada herramienta abre su pantalla con «volver».
 * Escritorio: la lista a la izquierda (340 px) y la calculadora elegida al centro; en el índice se ve Crédito.
 * J y K cambian de herramienta en escritorio. El inmueble elegido (?inmueble=…) se conserva al cambiar.
 */
export function MarcoHerramientas({ children }: { children: ReactNode }) {
  const ruta = usePathname();
  const indice = ruta === INDICE;
  const actual = indice ? HERRAMIENTAS[0].ruta : ruta;
  return (
    <div className="pn-her" data-indice={indice}>
      <section className="pn-her-lista" aria-label="Herramientas">
        <h1>Herramientas</h1>
        <div className="pn-her-lista-cuerpo">
          <Tarjeta style={{ overflow: "hidden" }}>
            <Suspense fallback={null}><Filas actual={actual} indice={indice} /></Suspense>
          </Tarjeta>
        </div>
        <div className="pn-her-pie"><kbd className="pn-kbd">J</kbd> <kbd className="pn-kbd">K</kbd> cambiar de herramienta</div>
      </section>
      <div className="pn-her-main">{children}</div>
    </div>
  );
}

function Filas({ actual, indice }: { actual: string; indice: boolean }) {
  const params = useSearchParams();
  const router = useRouter();
  const sufijo = params.toString() ? `?${params.toString()}` : "";
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented || !window.matchMedia("(min-width: 900px)").matches) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.closest("[role=dialog]"))) return;
      const k = e.key.toLowerCase();
      if (k !== "j" && k !== "k") return;
      e.preventDefault();
      const i = Math.max(0, HERRAMIENTAS.findIndex((h) => h.ruta === actual));
      const sig = k === "j" ? (i + 1) % HERRAMIENTAS.length : (i - 1 + HERRAMIENTAS.length) % HERRAMIENTAS.length;
      router.replace(`${HERRAMIENTAS[sig].ruta}${sufijo}`, { scroll: false });
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [HERRAMIENTAS, actual, router, sufijo]);
  return HERRAMIENTAS.map((h) => {
    const cuerpo = (
      <>
        <span className="pn-her-ti" aria-hidden><Icono nombre={h.icono} tamano={20} /></span>
        <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
          <span className="pn-her-nombre">{h.nombre}</span>
          <span className="pn-her-sub">{h.sub}</span>
        </span>
        <Gesto nombre="derecha" tamano={18} className="pn-her-flecha" aria-hidden />
      </>
    );
    // En el índice del teléfono nada está elegido; en escritorio, Crédito.
    const elegida = h.ruta === actual && !indice;
    return (
      <Link key={h.ruta} href={`${h.ruta}${sufijo}`} className="pn-her-fila" aria-current={elegida ? "page" : undefined} data-elegida-escritorio={h.ruta === actual || undefined}>{cuerpo}</Link>
    );
  });
}

/** Cabecera de una herramienta: en el teléfono lleva «volver»; en escritorio solo el título. */
export function CabeceraHerramienta({ titulo }: { titulo: string }) {
  return (
    <div className="pn-her-cab">
      <Link href={INDICE} className="pn-iconbtn" aria-label="Volver a Herramientas" style={{ width: 44, height: 44 }}><Gesto nombre="izquierda" tamano={20} /></Link>
      <h2>{titulo}</h2>
    </div>
  );
}
