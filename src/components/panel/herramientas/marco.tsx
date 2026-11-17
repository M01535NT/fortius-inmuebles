"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, type ReactNode } from "react";

import { Gesto, Icono, type NombreIcono } from "@/components/panel/icons";
import { Tarjeta } from "@/components/panel/kit/lista";

import { ConAsuntoDeLaCuenta, useAsuntoDeLaCuenta } from "./guardar";
import { TrabajosSueltos } from "./sueltos";

import "./herramientas.css";

type Herramienta = { ruta: string; nombre: string; sub: string; icono: NombreIcono };

/** Las herramientas (SPEC.md, sección 9). Cada una sirve con o sin asunto. */
export const HERRAMIENTAS: readonly Herramienta[] = [
  { ruta: "/panel/herramientas/valor", nombre: "Opinión de valor", sub: "Comparables y valor, por preguntas", icono: "precio" },
  { ruta: "/panel/herramientas/isr", nombre: "Cálculo de ISR", sub: "Por la venta, con su artículo y fecha", icono: "balanza" },
  { ruta: "/panel/herramientas/compra", nombre: "Gastos del comprador", sub: "ISAI, Registro, notaría y crédito", icono: "costos" },
  { ruta: "/panel/herramientas/venta", nombre: "Gastos del vendedor", sub: "Comisión, cancelación e ISR", icono: "venta" },
  { ruta: "/panel/herramientas/credito", nombre: "Crédito", sub: "Mensualidad según enganche, plazo y tasa", icono: "edificio" },
  { ruta: "/panel/herramientas/comision", nombre: "Comisión", sub: "Lo que cobra Fortius, con IVA", icono: "pago" },
  { ruta: "/panel/herramientas/formatos", nombre: "Contratos y formatos", sub: "Por preguntas, con la hoja a la vista", icono: "contrato" },
];

const INDICE = "/panel/herramientas";

/**
 * Marco de Herramientas. Teléfono: el índice es la lista (y los trabajos sueltos); cada herramienta abre su pantalla con «volver».
 * Escritorio: la lista a la izquierda y la herramienta elegida al centro. J y K cambian de herramienta.
 * El asunto (?asunto=…) y el inmueble (?inmueble=…) se conservan al cambiar de herramienta.
 */
export function MarcoHerramientas({ children }: { children: ReactNode }) {
  return <Suspense fallback={null}><Marco>{children}</Marco></Suspense>;
}

function Marco({ children }: { children: ReactNode }) {
  const ruta = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const indice = ruta === INDICE;
  const actual = indice ? HERRAMIENTAS[0].ruta : ruta;
  function quitarAsunto() {
    const p = new URLSearchParams(params.toString());
    p.delete("asunto");
    router.replace(`${ruta}${p.toString() ? `?${p.toString()}` : ""}`, { scroll: false });
  }
  return (
    <ConAsuntoDeLaCuenta alQuitar={quitarAsunto}>
      <div className="pn-her" data-indice={indice}>
        <section className="pn-her-lista" aria-label="Herramientas">
          <h1>Herramientas</h1>
          <div className="pn-her-lista-cuerpo">
            <ParaElAsunto />
            <Tarjeta style={{ overflow: "hidden" }}>
              <Filas actual={actual} indice={indice} />
            </Tarjeta>
            <TrabajosSueltos />
          </div>
          <div className="pn-her-pie"><kbd className="pn-kbd">J</kbd> <kbd className="pn-kbd">K</kbd> cambiar de herramienta</div>
        </section>
        <div className="pn-her-main">{children}</div>
      </div>
    </ConAsuntoDeLaCuenta>
  );
}

/** «Para el asunto …»: lo que se guarde va a sus documentos. Con la X se trabaja suelto. */
function ParaElAsunto() {
  const ctx = useAsuntoDeLaCuenta();
  if (!ctx?.asunto) return null;
  return (
    <div className="pn-her-asunto" role="status">
      <Icono nombre="asu" tamano={18} />
      <span><b>{ctx.asunto.folio}</b> {ctx.asunto.nombre}</span>
      <Link href={`/panel/asuntos/${ctx.asunto.id}`} className="pn-her-asunto-ir">Volver</Link>
      <button type="button" className="pn-iconbtn" aria-label="Trabajar sin asunto" onClick={ctx.quitar}><Icono nombre="x" tamano={16} /></button>
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
  }, [actual, router, sufijo]);
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
    // En el índice del teléfono nada está elegido; en escritorio, la primera.
    const elegida = h.ruta === actual && !indice;
    return (
      <Link key={h.ruta} href={`${h.ruta}${sufijo}`} className="pn-her-fila" aria-current={elegida ? "page" : undefined} data-elegida-escritorio={h.ruta === actual || undefined}>{cuerpo}</Link>
    );
  });
}

/** Cabecera de una herramienta: en el teléfono lleva «volver»; en escritorio solo el título. */
export function CabeceraHerramienta({ titulo }: { titulo: string }) {
  const params = useSearchParams();
  const sufijo = params.toString() ? `?${params.toString()}` : "";
  return (
    <div className="pn-her-cab">
      <Link href={`${INDICE}${sufijo}`} className="pn-iconbtn" aria-label="Volver a Herramientas" style={{ width: 44, height: 44 }}><Gesto nombre="izquierda" tamano={20} /></Link>
      <h2>{titulo}</h2>
    </div>
  );
}
