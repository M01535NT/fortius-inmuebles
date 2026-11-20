"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { Icono, type NombreIcono } from "@/components/panel/icons";
import { useAvisos } from "@/components/panel/kit/avisos";
import { logout, useSession } from "@/lib/panel/legado/sesion";

import "../asunto/asunto.css";
import "./configuracion.css";

/**
 * El marco de Configuración como el modelo visual («Ajustes»): a la izquierda su propia lista de secciones, por grupos
 * y con «Buscar»; a la derecha, una sección a la vez. Lo usan Configuración y Eliminados. En el teléfono, la lista o la
 * sección, con «‹ Configuración» para volver.
 */
export type ClaveAjuste = "perfil" | "apariencia" | "avisos" | "equipo" | "catalogos" | "blog" | "textos";
type Item = { clave: ClaveAjuste; nombre: string; icono: NombreIcono; subtitulo: string; buscar: string; director?: boolean };
const GRUPOS: { titulo: string; items: Item[] }[] = [
  { titulo: "Tu cuenta", items: [
    { clave: "perfil", nombre: "Perfil", icono: "arroba", subtitulo: "Tu nombre, tu foto y tu teléfono, como salen en el equipo y en el sitio.", buscar: "nombre foto telefono cuenta" },
    { clave: "apariencia", nombre: "Apariencia", icono: "ojo", subtitulo: "Claro, oscuro o como lo tenga tu equipo.", buscar: "tema claro oscuro" },
    { clave: "avisos", nombre: "Avisos", icono: "reloj", subtitulo: "Qué te avisa el panel mientras está abierto.", buscar: "notificaciones recordatorios" },
  ] },
  { titulo: "El despacho", items: [
    { clave: "equipo", nombre: "Equipo", icono: "users", subtitulo: "Quiénes trabajan en Fortius y con qué cuenta entran.", buscar: "asesores cuentas invitar" },
  ] },
  { titulo: "Cómo se trabaja", items: [
    { clave: "catalogos", nombre: "Catálogos", icono: "lista", subtitulo: "Las listas que usa todo el panel. Apagar un valor no lo borra.", buscar: "listas papeles tipos valores", director: true },
  ] },
  // Solo el director: la base no deja a un asesor cambiar el blog ni los textos del sitio.
  { titulo: "Sitio público", items: [
    { clave: "blog", nombre: "Blog", icono: "nota", subtitulo: "Guías y actualidad. Un borrador no sale en el sitio hasta que lo publicas.", buscar: "articulos entradas guias actualidad publicar borrador", director: true },
    { clave: "textos", nombre: "Textos del sitio", icono: "globo", subtitulo: "Lo que dice el sitio público. Al guardar, sale en el sitio.", buscar: "contenido inicio portada seo preguntas testimonios", director: true },
  ] },
];
const sinAcentos = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Las secciones que puede ver quien entró, en orden. */
export function useSeccionesAjustes() {
  const director = useSession()?.role === "admin";
  const grupos = GRUPOS.map((g) => ({ ...g, items: g.items.filter((i) => !i.director || director) })).filter((g) => g.items.length);
  return { grupos, todas: grupos.flatMap((g) => g.items), director };
}

/** `actual`: la sección abierta; `abierta`: en el teléfono se ve la sección (no la lista). */
export function MarcoAjustes({ actual, abierta, children }: { actual: ClaveAjuste | "eliminados" | null; abierta: boolean; children: ReactNode }) {
  const sesion = useSession();
  const { avisar } = useAvisos();
  const router = useRouter();
  const { grupos, todas } = useSeccionesAjustes();
  const [q, setQ] = useState("");
  const t = sinAcentos(q.trim());
  const coincide = (i: Item) => !t || sinAcentos(`${i.nombre} ${i.buscar}`).includes(t);
  const ir = (c: ClaveAjuste) => router.push(`/panel/configuracion?ver=${c}`, { scroll: false });

  return (
    <div className="aj" data-det={abierta}>
      <nav className="aj-lado" aria-label="Secciones de configuración">
        <div className="aj-lado-cab"><h2 className="aj-lado-h1">Configuración</h2></div>
        <label className="aj-buscar">
          <Icono nombre="bus" tamano={14} />
          <span className="pn-solo-lector">Buscar en configuración</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar" autoComplete="off"
            onKeyDown={(e) => { if (e.key === "Enter") { const p = todas.find(coincide); if (p) ir(p.clave); } }} />
        </label>
        {grupos.map((g) => {
          const items = g.items.filter(coincide);
          if (!items.length) return null;
          return (
            <div key={g.titulo} className="aj-grupo">
              <div className="aj-grp">{g.titulo}</div>
              {items.map((i) => (
                <button key={i.clave} type="button" className="aj-it" aria-current={i.clave === actual ? "page" : undefined} onClick={() => ir(i.clave)}>
                  <Icono nombre={i.icono} tamano={15} />{i.nombre}<Icono nombre="ch" tamano={14} className="aj-ch" aria-hidden />
                </button>
              ))}
            </div>
          );
        })}
        {!t || sinAcentos("eliminados recuperar borrado").includes(t) ? (
          <div className="aj-grupo">
            <div className="aj-grp">Otros</div>
            <Link href="/panel/eliminados" className="aj-it" aria-current={actual === "eliminados" ? "page" : undefined}>
              <Icono nombre="bote" tamano={15} />Eliminados<Icono nombre="ch" tamano={14} className="aj-ch" aria-hidden />
            </Link>
          </div>
        ) : null}
        <span className="aj-sp" />
        <button type="button" className="aj-it aj-salir" title={sesion?.email ? `Entraste como ${sesion.email}` : undefined}
          onClick={() => { logout().catch(() => avisar("No se pudo cerrar la sesión en el servidor. Vuelve a intentarlo.")); }}>
          <Icono nombre="x" tamano={15} />Cerrar sesión
        </button>
      </nav>

      <main className="aj-main">
        <Link href="/panel/configuracion" className="as-btn as-gho as-atras aj-atras"><Icono nombre="at" tamano={16} />Configuración</Link>
        {children}
      </main>
    </div>
  );
}
