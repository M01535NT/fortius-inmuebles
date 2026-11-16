"use client";
import { useState, type DragEvent, type KeyboardEvent, type ReactNode } from "react";

import { avisoDeMovimiento, moverElemento } from "@/lib/panel/ordenar";

import { Gesto } from "../icons";

/**
 * Lista que se reordena arrastrando (RP-102). Una sola pieza para el menú, las guías, las tareas, los pendientes…
 * - Ratón: arrastrar la fila; una línea de acento marca dónde cae; soltar fuera cancela.
 * - Teclado: Alt con ↑ y ↓ sobre el elemento enfocado. El asa no recibe Tab (sugerencia de accesibilidad, 16/11/2026):
 *   con un asa por elemento, el menú lateral pedía 27 tabulaciones antes del contenido.
 * - Teléfono: el asa de seis puntos; siempre queda además un lugar para «Mover a…» en quien use la lista.
 * - Cada movimiento avisa por `alMover` y por una región en vivo para lectores de pantalla.
 */
export function ListaReordenable<T>({
  items, clave, nombre, alReordenar, renderItem, etiqueta, bloqueado,
}: {
  items: readonly T[];
  clave: (x: T) => string;
  /** Nombre que se dice al lector de pantalla después de mover. */
  nombre: (x: T) => string;
  alReordenar: (nuevo: T[], movido: T, lugar: number) => void;
  /** El asa se pone con `asa` donde convenga; la fila completa también se puede arrastrar. */
  renderItem: (x: T, ctx: { asa: ReactNode; indice: number }) => ReactNode;
  etiqueta: string;
  /** Elementos que no se pueden mover ni cambiar de lugar (por ejemplo, pasos obligatorios). */
  bloqueado?: (x: T) => boolean;
}) {
  const [origen, setOrigen] = useState<number | null>(null);
  const [sobre, setSobre] = useState<number | null>(null);
  const [anuncio, setAnuncio] = useState("");

  const mover = (de: number, a: number) => {
    const x = items[de];
    if (x === undefined || a < 0 || a >= items.length || de === a) return;
    if (bloqueado?.(x) || bloqueado?.(items[a])) { setAnuncio(`${nombre(x)} no se puede mover a ese lugar`); return; }
    alReordenar(moverElemento(items, de, a), x, a + 1);
    setAnuncio(avisoDeMovimiento(nombre(x), a + 1, items.length));
  };
  const alSoltar = (e: DragEvent, a: number) => {
    e.preventDefault();
    if (origen !== null) mover(origen, a);
    setOrigen(null); setSobre(null);
  };
  const alTeclear = (e: KeyboardEvent, i: number, conAlt = false) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    if (conAlt && !e.altKey) return;
    e.preventDefault();
    mover(i, e.key === "ArrowUp" ? i - 1 : i + 1);
  };

  return (
    <>
      <ul className="pn-arrastre" aria-label={`${etiqueta}. Arrastra para cambiar el orden, o usa Alt con las flechas.`}>
        {items.map((x, i) => {
          const fijo = bloqueado?.(x) ?? false;
          const asa = fijo ? null : (
            <button
              type="button"
              className="pn-agarre-btn"
              tabIndex={-1}
              aria-label={`Mover ${nombre(x)}`}
              onKeyDown={(e) => alTeclear(e, i)}
            >
              <Gesto nombre="agarre" tamano={14} />
            </button>
          );
          return (
            <li
              key={clave(x)}
              draggable={!fijo}
              data-arrastrando={origen === i}
              data-sobre={sobre === i && origen !== null && origen !== i}
              onDragStart={(e) => { setOrigen(i); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", clave(x)); }}
              onDragOver={(e) => { if (origen === null) return; e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (sobre !== i) setSobre(i); }}
              onDragLeave={() => setSobre((v) => (v === i ? null : v))}
              onDrop={(e) => alSoltar(e, i)}
              onKeyDown={fijo ? undefined : (e) => alTeclear(e, i, true)}
              onDragEnd={() => { setOrigen(null); setSobre(null); }}
            >
              {renderItem(x, { asa, indice: i })}
            </li>
          );
        })}
      </ul>
      <p aria-live="polite" className="pn-solo-lector">{anuncio}</p>
    </>
  );
}
