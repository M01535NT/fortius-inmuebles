"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { useColeccion } from "@/components/panel/datos/use-coleccion";
import { Icono } from "@/components/panel/icons";
import type { Property } from "@/data/propiedades";
import { pesos } from "@/lib/panel/herramientas";

export type InmuebleElegido = { codigo: string; titulo: string; precio: number | null; aviso: string | null };

/** Lo que la calculadora necesita de un inmueble: el precio en pesos o la razón de no tenerlo. */
export function datosParaCalcular(p: Pick<Property, "codigo" | "titulo" | "precio">): InmuebleElegido {
  if (p.precio.modalidad === "consulta") return { codigo: p.codigo, titulo: p.titulo, precio: null, aviso: "Este inmueble no tiene precio publicado. Escribe el precio a mano." };
  if (p.precio.moneda !== "MXN") return { codigo: p.codigo, titulo: p.titulo, precio: null, aviso: `El precio está en dólares (${p.precio.monto.toLocaleString("es-MX")} USD). Escríbelo en pesos.` };
  return { codigo: p.codigo, titulo: p.titulo, precio: p.precio.monto, aviso: null };
}

/**
 * El inmueble que llega en `?inmueble=FORTIUS-…` desde su ficha (AUD-03, T1). Sin el parámetro, la calculadora queda libre.
 * `quitar` deja la calculadora sin inmueble y vuelve a la cuenta de ejemplo.
 */
export function useInmuebleDeDireccion() {
  const params = useSearchParams();
  const router = useRouter();
  const ruta = usePathname();
  const codigo = params.get("inmueble");
  const { datos, cargando } = useColeccion<Property>("propiedades");
  const elegido = useMemo(() => {
    if (!codigo) return null;
    const p = datos.find((x) => x.codigo === codigo);
    return p ? datosParaCalcular(p) : null;
  }, [codigo, datos]);
  return {
    codigo,
    elegido,
    buscando: Boolean(codigo) && cargando,
    noEncontrado: Boolean(codigo) && !cargando && !elegido,
    quitar: () => router.replace(ruta, { scroll: false }),
  };
}

/** Franja «Para: …» encima de la calculadora, con Quitar. */
export function ParaInmueble({ elegido, alQuitar }: { elegido: InmuebleElegido; alQuitar: () => void }) {
  return (
    <section className="fm-grupo" aria-label="Para el inmueble">
      <div className="fm-t">Para el inmueble</div>
      <div className="fm-card">
        <div className="as-ren her-para">
          <Icono nombre="edif" tamano={16} />
          <span className="as-ren-c"><b>{elegido.titulo}</b><span>{elegido.codigo}{elegido.precio ? ` · ${pesos(elegido.precio)}` : ""}</span></span>
          <button type="button" className="as-btn as-gho her-acc-btn" onClick={alQuitar}>Quitar</button>
        </div>
      </div>
    </section>
  );
}
