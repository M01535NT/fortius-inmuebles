"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { ArrowRight, X } from "lucide-react";

import { usePageTransition } from "@/components/home/public-experience";
import { TIPOS_INMUEBLE } from "@/lib/inmueble-tipos";
import { SEGMENTOS_INMUEBLE, inventarioDeSegmento } from "@/lib/inmueble-segmentos";
import styles from "./site-search.module.css";

/*
  Buscador público (31/10/2026): se abre desde «Buscar» en la barra y sugiere destinos del sitio
  mientras se escribe, sin acentos ni mayúsculas de por medio. Es un combobox: flechas para
  recorrer, Enter para ir, Escape para cerrar. Los destinos son rutas existentes; los tipos de
  inmueble filtran el inventario (si no hay de ese tipo, el inventario muestra todo).
*/
type Destino = { label: string; group: string; href: string; keywords?: string };

const CIUDADES = "tijuana rosarito tecate ensenada baja california";
const DESTINOS: Destino[] = [
  { label: "Vender mi propiedad", group: "Vender", href: "/vender-propiedad", keywords: "venta vendo casa" },
  { label: "Opinión de valor", group: "Vender", href: "/opinion-de-valor", keywords: "cuanto vale precio avaluo valuacion" },
  { label: "Gastos y neto de venta", group: "Vender", href: "/herramientas/gastos-de-cierre", keywords: "calculadora isr impuestos notario cierre" },
  { label: "Guía para comprar", group: "Comprar", href: "/comprar-propiedad", keywords: "compra credito infonavit fovissste" },
  { label: "Propiedades en venta", group: "Propiedades", href: "/inventario?op=venta", keywords: `inventario ${CIUDADES}` },
  { label: "Propiedades en renta", group: "Propiedades", href: "/inventario?op=renta", keywords: `rentar alquiler arrendamiento ${CIUDADES}` },
  { label: "Todas las propiedades", group: "Propiedades", href: "/inventario", keywords: `inventario inmuebles ${CIUDADES}` },
  ...SEGMENTOS_INMUEBLE.map((s) => ({ label: s.label, group: "Propiedades", href: inventarioDeSegmento(s.key), keywords: s.detalle })),
  ...TIPOS_INMUEBLE.map((t) => ({ label: t.label, group: "Tipo de inmueble", href: `/inventario?tipo=${t.key}`, keywords: t.key.replace("-", " ") })),
  { label: "Calculadora de hipoteca", group: "Herramientas", href: "/herramientas/hipoteca", keywords: "credito mensualidad pago banco" },
  { label: "Todas las herramientas", group: "Herramientas", href: "/herramientas", keywords: "calculadoras" },
  { label: "Preguntas frecuentes", group: "Ayuda", href: "/preguntas-frecuentes", keywords: "dudas faq" },
  { label: "Nosotros", group: "Fortius", href: "/nosotros", keywords: "equipo empresa quienes somos" },
  { label: "Agentes", group: "Fortius", href: "/nosotros#agentes", keywords: "asesores equipo" },
  { label: "Blog", group: "Fortius", href: "/blog", keywords: "noticias articulos mercado inmobiliario" },
  { label: "Contacto", group: "Fortius", href: "/contacto", keywords: "telefono whatsapp correo cita" },
  { label: "Avisos y documentos", group: "Fortius", href: "/avisos", keywords: "privacidad aviso legal" },
];
const POPULARES = ["/inventario?op=venta", "/vender-propiedad", "/opinion-de-valor", "/herramientas/hipoteca", "/contacto"];
const MAX = 7;

const normalizar = (texto: string) => texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Primero lo que empieza con lo escrito (en el nombre o en una de sus palabras), luego lo que lo contiene. */
function sugerencias(consulta: string): Destino[] {
  const q = normalizar(consulta);
  if (!q) return DESTINOS.filter((d) => POPULARES.includes(d.href));
  const puntuados = DESTINOS.map((d) => {
    const label = normalizar(d.label);
    const extra = normalizar(`${d.group} ${d.keywords ?? ""}`);
    const score = label.startsWith(q) ? 0
      : label.split(/\s+/).some((w) => w.startsWith(q)) ? 1
      : label.includes(q) ? 2
      : extra.split(/\s+/).some((w) => w.startsWith(q)) ? 3
      : extra.includes(q) ? 4 : -1;
    return { d, score };
  }).filter((x) => x.score >= 0);
  return puntuados.sort((a, b) => a.score - b.score).slice(0, MAX).map((x) => x.d);
}

/** Resalta la parte del nombre que coincide con lo escrito, ignorando acentos. */
function Resaltado({ texto, consulta }: { texto: string; consulta: string }) {
  const q = normalizar(consulta);
  const i = q ? normalizar(texto).indexOf(q) : -1;
  if (i < 0) return <>{texto}</>;
  return <>{texto.slice(0, i)}<mark>{texto.slice(i, i + q.length)}</mark>{texto.slice(i + q.length)}</>;
}

export function SiteSearch({ onClose }: { onClose: () => void }) {
  const navigate = usePageTransition();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const previousFocus = React.useRef<HTMLElement | null>(null);
  const [consulta, setConsulta] = React.useState("");
  const [activo, setActivo] = React.useState(0);
  const lista = React.useMemo(() => sugerencias(consulta), [consulta]);
  const listId = React.useId();

  React.useEffect(() => {
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    inputRef.current?.focus({ preventScroll: true });
    return () => {
      document.documentElement.style.overflow = prev;
      previousFocus.current?.focus({ preventScroll: true });
    };
  }, []);

  const ir = (destino: Destino | undefined) => {
    if (!destino) return;
    onClose();
    navigate(destino.href);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") { event.preventDefault(); setActivo((i) => (i + 1) % Math.max(lista.length, 1)); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setActivo((i) => (i - 1 + lista.length) % Math.max(lista.length, 1)); }
    else if (event.key === "Enter") { event.preventDefault(); ir(lista[activo]); }
  };

  // Escape cierra desde cualquier parte; Tab se queda entre el campo y el botón de cerrar.
  const onDialogKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") { event.preventDefault(); onClose(); return; }
    if (event.key !== "Tab") return;
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("input, button"));
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };

  const titulo = consulta.trim() ? (lista.length ? "Sugerencias" : "Sin coincidencias") : "Lo más buscado";

  return createPortal(
    <div className={styles.root} role="dialog" aria-modal="true" aria-label="Buscar en Fortius" onKeyDown={onDialogKey}>
      <div className={styles.scrim} aria-hidden="true" onClick={onClose} />
      <div className={styles.panel}>
        <div className={styles.inner}>
          <div className={styles.field}>
            <input ref={inputRef} type="search" value={consulta} placeholder="¿Qué buscas?" autoComplete="off" spellCheck={false}
              role="combobox" aria-expanded={lista.length > 0} aria-controls={listId} aria-autocomplete="list" aria-label="Buscar"
              aria-activedescendant={lista.length ? `${listId}-${activo}` : undefined}
              onChange={(event) => { setConsulta(event.target.value); setActivo(0); }} onKeyDown={onKeyDown} className={styles.input} />
            <button type="button" onClick={onClose} aria-label="Cerrar buscador" className={styles.close}><X aria-hidden="true" size={22} /></button>
          </div>
          <p className={styles.heading} aria-live="polite">{titulo}</p>
          <ul id={listId} role="listbox" aria-label="Sugerencias" className={styles.list}>
            {lista.map((destino, i) => (
              <li key={destino.href} id={`${listId}-${i}`} role="option" aria-selected={i === activo}
                className={styles.option} onMouseEnter={() => setActivo(i)} onMouseDown={(event) => event.preventDefault()} onClick={() => ir(destino)}>
                <span className={styles.label}><Resaltado texto={destino.label} consulta={consulta} /></span>
                <span className={styles.group}>{destino.group}</span>
                <ArrowRight aria-hidden="true" size={18} className={styles.arrow} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>,
    document.body,
  );
}
