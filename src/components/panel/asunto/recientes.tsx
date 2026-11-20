"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { guardarPreferencia, usePreferencia } from "@/components/panel/almacen";
import { useMisPreferencias } from "@/components/panel/datos/use-mis-preferencias";
import { Icono, type NombreIcono } from "@/components/panel/icons";

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

/** Los asuntos e inmuebles marcados con estrella (te siguen en cualquier equipo), arriba de los recientes. */
export function Favoritos({ contraido }: { contraido: boolean }) {
  const { panel } = useMisPreferencias();
  const ruta = usePathname();
  const lista = (panel.favoritos ?? []).slice(0, 8);
  if (!lista.length || contraido) return null;
  return (
    <nav aria-label="Favoritos" className="pn-recientes">
      <p className="pn-sec">Favoritos</p>
      {lista.map((f) => {
        const href = f.tipo === "asunto" ? `/admin/asuntos/${f.id}` : `/admin/inmuebles?id=${f.id}`;
        return (
          <Link key={`${f.tipo}-${f.id}`} href={href} className="pn-link pn-reciente" aria-current={ruta === href ? "page" : undefined}>
            <span className="pn-fav-ico" aria-hidden><Icono nombre={f.tipo === "asunto" ? "estrella" : "casa"} tamano={15} /></span>
            <span className="pn-txt">{f.nombre}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Recientes({ contraido }: { contraido: boolean }) {
  const [texto] = usePreferencia(CLAVE, "[]");
  const { panel } = useMisPreferencias();
  const fijos = useMemo(() => new Set((panel.favoritos ?? []).map((f) => f.id)), [panel.favoritos]);
  const lista = useMemo(() => leer(texto).filter((r) => !fijos.has(r.id)), [texto, fijos]);
  const ruta = usePathname();
  if (!lista.length || contraido) return null;
  return (
    <nav aria-label="Recientes" className="pn-recientes">
      <p className="pn-sec">Recientes</p>
      {lista.map((r) => (
        <Link key={r.id} href={`/admin/asuntos/${r.id}`} className="pn-link pn-reciente" aria-current={ruta === `/admin/asuntos/${r.id}` ? "page" : undefined}>
          <Cuadro icono={r.icono} color={r.color} chico />
          <span className="pn-txt">{r.nombre}</span>
        </Link>
      ))}
    </nav>
  );
}
