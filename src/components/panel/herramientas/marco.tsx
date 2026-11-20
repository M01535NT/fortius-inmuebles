"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, type ReactNode } from "react";

import { Icono, type NombreIcono } from "@/components/panel/icons";

import "../asunto/asunto.css";
import "../asunto/caso.css";
import { Cuadro } from "../asunto/pildora";
import "../fichas/modelo.css";
import { ConAsuntoDeLaCuenta, useAsuntoDeLaCuenta } from "./guardar";
import { TrabajosSueltos } from "./sueltos";

import "./herramientas.css";

type Herramienta = { ruta: string; nombre: string; sub: string; icono: NombreIcono; color: string };

/** Las herramientas (SPEC.md, sección 9). Cada una sirve con o sin asunto. */
export const HERRAMIENTAS: readonly Herramienta[] = [
  { ruta: "/panel/herramientas/valor", nombre: "Opinión de valor", sub: "Comparables y valor, por preguntas", icono: "precio", color: "blue" },
  { ruta: "/panel/herramientas/isr", nombre: "Cálculo de ISR", sub: "Por la venta, con su artículo y fecha", icono: "balanza", color: "indigo" },
  { ruta: "/panel/herramientas/compra", nombre: "Gastos del comprador", sub: "ISAI, Registro, notaría y crédito", icono: "costos", color: "teal" },
  { ruta: "/panel/herramientas/venta", nombre: "Gastos del vendedor", sub: "Comisión, cancelación e ISR", icono: "venta", color: "orange" },
  { ruta: "/panel/herramientas/credito", nombre: "Crédito", sub: "Mensualidad según enganche, plazo y tasa", icono: "edificio", color: "violet" },
  { ruta: "/panel/herramientas/comision", nombre: "Comisión", sub: "Lo que cobra Fortius, con IVA", icono: "pago", color: "green" },
  { ruta: "/panel/herramientas/formatos", nombre: "Contratos y formatos", sub: "Por preguntas, con la hoja a la vista", icono: "contrato", color: "gray" },
];

const INDICE = "/panel/herramientas";

/**
 * Marco de Herramientas con el orden del modelo visual («Inmuebles»): la lista en su columna (barra de 52 px y la elegida
 * en azul sólido) y la herramienta a la derecha con su barra y tarjetas de renglones. Teléfono: el índice es la lista
 * (y los trabajos sueltos); cada herramienta abre su pantalla con «volver». J y K cambian de herramienta.
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
      <div className="as-dos her-dos" data-det={!indice}>
        <section className="as-lista" aria-label="Herramientas">
          <div className="as-lado">
            <div className="as-fila as-cab">
              <h1 className="as-h1-lista">Herramientas</h1>
              <span className="as-cab-n" aria-label={`${HERRAMIENTAS.length} herramientas`}>{HERRAMIENTAS.length}</span>
            </div>
            <ParaElAsunto />
            <Filas actual={actual} indice={indice} />
            <TrabajosSueltos />
            <div className="as-pie-teclas" aria-hidden><kbd>J</kbd><kbd>K</kbd> cambiar de herramienta</div>
          </div>
        </section>
        <section className="as-det" aria-label="Herramienta">{children}</section>
      </div>
    </ConAsuntoDeLaCuenta>
  );
}

/** «Para el asunto …»: lo que se guarde va a sus documentos. Con la X se trabaja suelto. */
function ParaElAsunto() {
  const ctx = useAsuntoDeLaCuenta();
  if (!ctx?.asunto) return null;
  return (
    <div className="her-ban" role="status">
      <Icono nombre="asu" tamano={16} />
      <span><b>{ctx.asunto.folio}</b> {ctx.asunto.nombre}</span>
      <Link href={`/panel/asuntos/${ctx.asunto.id}`} className="as-btn as-gho her-ban-ir">Volver</Link>
      <button type="button" className="as-btn as-gho as-ico" aria-label="Trabajar sin asunto" title="Trabajar sin asunto" onClick={ctx.quitar}><Icono nombre="x" tamano={15} /></button>
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
  return (
    <nav className="as-items" aria-label="Herramientas">
      {HERRAMIENTAS.map((h) => {
        // En el índice del teléfono nada está elegido; en escritorio, la primera.
        const elegida = h.ruta === actual && !indice;
        return (
          <Link key={h.ruta} href={`${h.ruta}${sufijo}`} className="as-it her-it" aria-current={elegida ? "page" : undefined} data-elegida-escritorio={h.ruta === actual || undefined}>
            <Cuadro icono={h.icono} color={h.color} />
            <span className="as-it-c"><b>{h.nombre}</b><small>{h.sub}</small></span>
          </Link>
        );
      })}
    </nav>
  );
}

/** Datos de una herramienta para su encabezado (color, ícono y la línea de abajo). */
export const herramientaDe = (ruta: string) => HERRAMIENTAS.find((h) => h.ruta === ruta);

/**
 * La barra de 52 px de una herramienta: en el teléfono lleva «‹ Herramientas»; a la derecha, si se trabaja para un asunto,
 * su folio. Debajo, el encabezado del modelo: el ícono, el nombre de 24 px y para qué sirve.
 */
export function CabeceraHerramienta({ titulo, ruta }: { titulo: string; ruta: string }) {
  const params = useSearchParams();
  const ctx = useAsuntoDeLaCuenta();
  const sufijo = params.toString() ? `?${params.toString()}` : "";
  const h = herramientaDe(ruta);
  return (
    <>
      <div className="cp-barra her-barra">
        <Link href={`${INDICE}${sufijo}`} className="as-btn as-gho as-atras" aria-label="Volver a Herramientas"><Icono nombre="at" tamano={16} />Herramientas</Link>
        <span className="as-sp" />
        <span className="as-m her-donde">
          <Icono nombre={ctx?.asunto ? "asu" : "file"} tamano={14} />
          {ctx?.asunto ? `Para ${ctx.asunto.folio}` : "Sin asunto · queda en Trabajos sueltos"}
        </span>
      </div>
      <div className="fm-cab fm-cab-av her-cab">
        {h ? <Cuadro icono={h.icono} color={h.color} /> : null}
        <div>
          <h2 className="fm-h1">{titulo}</h2>
          {h ? <p className="as-m">{h.sub}</p> : null}
        </div>
      </div>
    </>
  );
}
