"use client";

import * as React from "react";
import Link from "next/link";

import { PropertyCard } from "@/components/property/property-card";
import {
  OPERACION_LABELS,
  TIPO_LABELS,
  type Operacion,
  type Property,
  type TipoPropiedad,
} from "@/data/propiedades";

/*
  Filtros client-side simples (operación + tipo) mientras el inventario es
  demo. TODO cuando el inventario sea real: zona, rango de precio,
  ordenamiento y sincronización a searchParams para URLs compartibles.
*/
type Props = { propiedades: Property[] };

export function InventoryExplorer({ propiedades }: Props) {
  const [operacion, setOperacion] = React.useState<Operacion | "todas">("todas");
  const [tipo, setTipo] = React.useState<TipoPropiedad | "todos">("todos");

  // Derivados de los datos: nunca listas hardcodeadas en paralelo.
  const tipos = React.useMemo(
    () => Array.from(new Set(propiedades.map((p) => p.tipo))),
    [propiedades],
  );

  const resultados = propiedades.filter(
    (p) =>
      (operacion === "todas" || p.operacion === operacion) &&
      (tipo === "todos" || p.tipo === tipo),
  );

  const hayFiltros = operacion !== "todas" || tipo !== "todos";

  function limpiar() {
    setOperacion("todas");
    setTipo("todos");
  }

  const chipBase =
    "inline-flex h-9 items-center rounded-md border px-3.5 text-[13.5px] font-medium transition-colors";
  const chipOff = " border-border text-foreground/75 hover:bg-secondary hover:text-foreground";
  const chipOn = " border-primary/50 bg-secondary text-foreground";

  return (
    <div>
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4 border-b border-border pb-6">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Operación">
          {(["todas", "venta", "renta"] as const).map((op) => (
            <button
              key={op}
              type="button"
              aria-pressed={operacion === op}
              onClick={() => setOperacion(op)}
              className={chipBase + (operacion === op ? chipOn : chipOff)}
            >
              {op === "todas" ? "Todas" : OPERACION_LABELS[op]}
            </button>
          ))}
        </div>

        <span aria-hidden="true" className="hidden h-6 w-px bg-border sm:block" />

        <div className="flex flex-wrap gap-2" role="group" aria-label="Tipo de propiedad">
          <button
            type="button"
            aria-pressed={tipo === "todos"}
            onClick={() => setTipo("todos")}
            className={chipBase + (tipo === "todos" ? chipOn : chipOff)}
          >
            Todos
          </button>
          {tipos.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={tipo === t}
              onClick={() => setTipo(t)}
              className={chipBase + (tipo === t ? chipOn : chipOff)}
            >
              {TIPO_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Contador */}
      <p
        aria-live="polite"
        className="mt-5 font-mono text-[11.5px] uppercase tracking-[0.08em] text-muted-foreground"
      >
        {String(resultados.length).padStart(2, "0")}{" "}
        {resultados.length === 1 ? "resultado" : "resultados"}
      </p>

      {/* Grid o vacío */}
      {resultados.length > 0 ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {resultados.map((p) => (
            <PropertyCard key={p.slug} property={p} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-border p-10 md:p-14">
          <p className="display-soft text-2xl text-foreground">
            No hay propiedades con esos criterios.
          </p>
          <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-muted-foreground">
            El inventario cambia con frecuencia. Cuéntanos qué buscas y te
            avisamos cuando entre algo que encaje.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            {hayFiltros ? (
              <button
                type="button"
                onClick={limpiar}
                className="inline-flex h-11 items-center rounded-md border border-border px-5 text-[14.5px] font-medium text-foreground transition-colors hover:bg-secondary"
              >
                Limpiar filtros
              </button>
            ) : null}
            <Link
              href="/contacto"
              className="inline-flex h-11 items-center rounded-md bg-primary px-5 text-[14.5px] font-semibold text-primary-foreground transition-transform hover:opacity-90 active:scale-[0.98]"
            >
              Cuéntanos qué buscas
            </Link>
          </div>
        </div>
      )}

      {/* CTA persistente en mobile */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 pb-[calc(env(safe-area-inset-bottom)+12px)] backdrop-blur md:hidden">
        <Link
          href="/contacto"
          className="flex h-12 w-full items-center justify-center rounded-md bg-primary text-[15px] font-semibold text-primary-foreground active:scale-[0.99]"
        >
          Cuéntanos qué buscas
        </Link>
      </div>
    </div>
  );
}
