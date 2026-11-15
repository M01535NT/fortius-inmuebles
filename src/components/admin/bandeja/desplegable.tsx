"use client";
import * as React from "react";
import { Check, ChevronDown } from "@/components/admin/icons";
import s from "./bandeja.module.css";

/*
  FLX-01 · Desplegable del panel flexible (el titular pidió controles de app).
  Se cierran con Escape, al pulsar fuera o al mover el foco fuera; las flechas recorren las opciones
  y al cerrar el foco vuelve al botón. Sin dependencias nuevas.
*/

function usePopover() {
  const [open, setOpen] = React.useState(false);
  const wrap = React.useRef<HTMLDivElement>(null);
  const close = React.useCallback((focus = false) => {
    setOpen(false);
    if (focus) wrap.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }, []);
  React.useEffect(() => {
    if (!open) return;
    const outside = (event: Event) => { if (event.target instanceof Node && !wrap.current?.contains(event.target)) close(); };
    document.addEventListener("pointerdown", outside); document.addEventListener("focusin", outside);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("focusin", outside); };
  }, [open, close]);
  // Al abrir, el foco entra a la opción marcada (o a la primera).
  React.useEffect(() => {
    if (!open) return;
    const items = wrap.current?.querySelectorAll<HTMLButtonElement>("[data-option]");
    (wrap.current?.querySelector<HTMLButtonElement>("[data-option][aria-selected='true']") ?? items?.[0])?.focus();
  }, [open]);
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (!open) return;
    if (event.key === "Escape") { event.stopPropagation(); close(true); return; }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const items = [...(wrap.current?.querySelectorAll<HTMLButtonElement>("[data-option]") ?? [])];
    const at = items.indexOf(document.activeElement as HTMLButtonElement);
    const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : (at + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
    items[next]?.focus();
  };
  return { open, setOpen, close, wrap, onKeyDown };
}

export type Opcion<V extends string> = { value: V; label: string; detail?: string };

/** Desplegable de una sola elección. `value` vacío muestra `placeholder`. */
export function Desplegable<V extends string>({ label, value, options, onChange, placeholder = "Elegir", disabled, hideLabel }: {
  label: string; value: V | ""; options: Opcion<V>[]; onChange: (value: V) => void; placeholder?: string; disabled?: boolean; hideLabel?: boolean;
}) {
  const { open, setOpen, close, wrap, onKeyDown } = usePopover();
  const id = React.useId();
  const current = options.find(option => option.value === value);
  return <div className={s.field}>
    <span id={`${id}-label`} className={hideLabel ? s.sr : undefined}>{label}</span>
    <div ref={wrap} className={s.anchor} onKeyDown={onKeyDown}>
      <button type="button" className={s.select} disabled={disabled} aria-haspopup="listbox" aria-expanded={open} aria-labelledby={`${id}-label ${id}-value`} onClick={() => setOpen(v => !v)}>
        <span id={`${id}-value`} data-empty={!current}>{current?.label ?? placeholder}</span><ChevronDown size={16} aria-hidden />
      </button>
      {open && <div className={s.pop} role="listbox" aria-labelledby={`${id}-label`}>
        {options.map(option => <button key={option.value} type="button" data-option role="option" aria-selected={option.value === value} className={s.option}
          onClick={() => { onChange(option.value); close(true); }}>
          <span>{option.label}{option.detail && <> <small>· {option.detail}</small></>}</span>{option.value === value && <Check size={16} aria-hidden />}
        </button>)}
      </div>}
    </div>
  </div>;
}

/** Menú de tres puntos: el del kit (ActionsMenu). */
export { ActionsMenu as MenuAcciones, type MenuAction as Accion } from "@/components/admin/kit";
