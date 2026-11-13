"use client";
import * as React from "react";
import { createPortal } from "react-dom";
import { CircleHelp, X } from "@/components/admin/icons";
import { markSeen, tourFor, type TourStep } from "@/lib/admin/tour";
import { cn } from "@/lib/utils";
import nav from "./guided-nav.module.css";
import s from "./tour.module.css";

/*
  Guía de la pantalla (titular, 02/11/2026). «Ayuda» en la barra, la tecla «?» o el evento
  `fortius:tour` la abren; nunca se abre sola (DEC-47, 12/11/2026). Oscurece todo, resalta
  el elemento del paso y explica qué hacer ahí; Siguiente, Anterior, Omitir y cerrar; con el
  teclado: flechas, Enter y Escape. Mientras está abierta no se puede tocar el resto de la pantalla.
  Los pasos viven en `src/lib/admin/tour.ts`.
*/

const EVENT = "fortius:tour";
export function openTour() { window.dispatchEvent(new CustomEvent(EVENT)); }

/** El botón «Ayuda» de la barra superior. */
export function TourLauncher({ className }: { className?: string }) {
  return <button type="button" data-tour="ayuda" className={cn(nav.searchIcon, className)} aria-label="Ayuda: guía de esta pantalla" title="Guía de esta pantalla (?)" onClick={openTour}>
    <CircleHelp size={20} aria-hidden="true" />
  </button>;
}

type Rect = { top: number; left: number; width: number; height: number };
const PAD = 6, GAP = 12, GUTTER = 16;
const visible = (el: Element) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden";
/** `data-tour="x"` o, con el prefijo `css:`, un selector; gana el primer elemento visible. */
function findTarget(target: string): HTMLElement | null {
  const selector = target.startsWith("css:") ? target.slice(4) : `[data-tour="${target}"]`;
  let all: HTMLElement[] = [];
  try { all = Array.from(document.querySelectorAll<HTMLElement>(selector)); } catch { return null; }
  return all.find(visible) ?? null;
}
const isTyping = (el: Element | null) => !!el && (["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) || (el as HTMLElement).isContentEditable);

export function Tour({ pathname }: { pathname: string }) {
  const [steps, setSteps] = React.useState<TourStep[] | null>(null);
  const [index, setIndex] = React.useState(0);
  const [rect, setRect] = React.useState<Rect | null>(null);
  const screen = tourFor(pathname);
  const screenId = screen?.id;
  const card = React.useRef<HTMLDivElement>(null);
  const restore = React.useRef<HTMLElement | null>(null);

  const start = React.useCallback(() => {
    if (!screen) return;
    const available = screen.steps.filter(step => findTarget(step.target));
    if (!available.length) return;
    restore.current = document.activeElement as HTMLElement | null;
    setIndex(0); setSteps(available);
  }, [screen]);
  const close = React.useCallback(() => {
    if (screenId) markSeen(typeof localStorage === "undefined" ? null : localStorage, screenId);
    setSteps(null); setRect(null);
    restore.current?.focus?.();
  }, [screenId]);

  // Botón y tecla «?».
  React.useEffect(() => {
    const onEvent = () => start();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "?" && !event.ctrlKey && !event.metaKey && !event.altKey && !isTyping(document.activeElement)) { event.preventDefault(); start(); }
    };
    window.addEventListener(EVENT, onEvent); window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener(EVENT, onEvent); window.removeEventListener("keydown", onKey); };
  }, [start]);
  // Al cambiar de pantalla la guía se cierra sin marcarla vista (ajuste de estado durante el render).
  const [shownFor, setShownFor] = React.useState(pathname);
  if (shownFor !== pathname) { setShownFor(pathname); setSteps(null); setRect(null); }

  // Mide el elemento del paso y lo sigue al hacer scroll o cambiar de tamaño.
  const step = steps?.[index];
  React.useEffect(() => {
    if (!step) return;
    const el = findTarget(step.target);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Las medidas se toman en el siguiente cuadro, nunca de forma síncrona dentro del efecto.
    const measure = () => {
      if (!el) { setRect(null); return; }
      const r = el.getBoundingClientRect();
      setRect({ top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 });
    };
    el?.scrollIntoView({ block: "center", inline: "nearest", behavior: reduced ? "auto" : "smooth" });
    const frame = requestAnimationFrame(measure);
    const timer = window.setTimeout(measure, reduced ? 50 : 450);
    window.addEventListener("resize", measure); window.addEventListener("scroll", measure, true);
    return () => { cancelAnimationFrame(frame); window.clearTimeout(timer); window.removeEventListener("resize", measure); window.removeEventListener("scroll", measure, true); };
  }, [step]);
  // Foco dentro de la tarjeta, teclado y cierre con Escape.
  React.useEffect(() => {
    if (!steps) return;
    card.current?.querySelector<HTMLElement>("[data-tour-next]")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); close(); return; }
      if (event.key === "ArrowRight" || (event.key === "Enter" && !(event.target instanceof HTMLButtonElement))) { event.preventDefault(); setIndex(i => (i + 1 < steps.length ? i + 1 : (close(), i))); return; }
      if (event.key === "ArrowLeft") { event.preventDefault(); setIndex(i => Math.max(0, i - 1)); return; }
      if (event.key === "Tab" && card.current) {
        const focusable = Array.from(card.current.querySelectorAll<HTMLElement>("button:not([disabled])"));
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [steps, index, close]);

  if (!steps || !step || typeof document === "undefined") return null;
  const total = steps.length, last = index === total - 1;
  const place = cardPosition(rect);
  return createPortal(<div className={s.layer} aria-hidden={false}>
    {rect && <div className={s.spot} style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }} aria-hidden="true" />}
    <div ref={card} role="dialog" aria-modal="true" aria-labelledby="guia-titulo" aria-describedby="guia-texto" className={s.card} style={place}>
      <div className={s.head}>
        <span className={s.step}>{screen?.title} · Paso {index + 1} de {total}</span>
        <button type="button" className={s.close} aria-label="Cerrar la guía" onClick={close}><X size={18} aria-hidden="true" /></button>
      </div>
      <h2 id="guia-titulo" className={s.title}>{step.title}</h2>
      <p id="guia-texto" className={s.text}>{step.text}</p>
      <div className={s.actions}>
        {!last && <button type="button" className={cn(s.btn, s.ghost, s.skip)} onClick={close}>Omitir guía</button>}
        {index > 0 && <button type="button" className={s.btn} onClick={() => setIndex(i => Math.max(0, i - 1))}>Anterior</button>}
        <button type="button" data-tour-next className={cn(s.btn, s.primary)} onClick={() => last ? close() : setIndex(i => i + 1)}>{last ? "Terminar" : "Siguiente"}</button>
      </div>
    </div>
  </div>, document.body);
}

/** La tarjeta va debajo del elemento; arriba si no cabe; dentro de la ventana con 16 px de margen. */
function cardPosition(rect: Rect | null): React.CSSProperties {
  if (typeof window === "undefined") return {};
  const vw = window.innerWidth, vh = window.innerHeight, w = Math.min(360, vw - GUTTER * 2), h = 220;
  if (!rect) return { top: Math.max(GUTTER, (vh - h) / 2), left: Math.max(GUTTER, (vw - w) / 2) };
  const below = rect.top + rect.height + GAP, above = rect.top - GAP - h;
  const top = below + h <= vh - GUTTER ? below : above >= GUTTER ? above : Math.max(GUTTER, vh - h - GUTTER);
  const left = Math.min(Math.max(GUTTER, rect.left), vw - w - GUTTER);
  return { top, left };
}
