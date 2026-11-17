"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { guardarPreferencia, usePreferencia } from "@/components/panel/almacen";
import type { NombreIcono } from "@/components/panel/icons";

import { Cuadro } from "./pildora";

/** Los últimos asuntos que se abrieron en este navegador (boceto: «Recientes» en el menú). Es comodidad, no dato del negocio. */
const CLAVE = "fortius-panel-recientes";
type Reciente = { id: string; nombre: string; icono: NombreIcono; color: string };

function leer(texto: string): Reciente[] {
  try {
    const v: unknown = JSON.parse(texto);
    return Array.isArray(v) ? (v as Reciente[]).filter((r) => r && typeof r.id === "string" && typeof r.nombre === "string").slice(0, 4) : [];
  } catch { return []; }
}

export function anotarReciente(r: Reciente) {
  let previos: Reciente[] = [];
  try { previos = leer(window.localStorage.getItem(CLAVE) ?? "[]"); } catch { /* sin almacenamiento */ }
  const lista = [r, ...previos.filter((x) => x.id !== r.id)].slice(0, 4);
  if (JSON.stringify(lista) !== JSON.stringify(previos)) guardarPreferencia(CLAVE, JSON.stringify(lista));
}

export function quitarReciente(id: string) {
  let previos: Reciente[] = [];
  try { previos = leer(window.localStorage.getItem(CLAVE) ?? "[]"); } catch { /* sin almacenamiento */ }
  guardarPreferencia(CLAVE, JSON.stringify(previos.filter((x) => x.id !== id)));
}

export function Recientes({ contraido }: { contraido: boolean }) {
  const [texto] = usePreferencia(CLAVE, "[]");
  const lista = useMemo(() => leer(texto), [texto]);
  const ruta = usePathname();
  if (!lista.length || contraido) return null;
  return (
    <nav aria-label="Recientes" className="pn-recientes">
      <p className="pn-sec">Recientes</p>
      {lista.map((r) => (
        <Link key={r.id} href={`/panel/asuntos/${r.id}`} className="pn-link pn-reciente" aria-current={ruta === `/panel/asuntos/${r.id}` ? "page" : undefined}>
          <Cuadro icono={r.icono} color={r.color} chico />
          <span className="pn-txt">{r.nombre}</span>
        </Link>
      ))}
    </nav>
  );
}
