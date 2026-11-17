"use client";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

import type { Evento } from "@/lib/domain/records";
import { EVENTO_TIPO_LABELS } from "@/lib/domain/records";
import { horaTexto } from "@/lib/panel/calendario";
import { bloquesDelDia, correrFecha, marcasDeHora, moverPasos, pasosDesdePixeles, PX_MIN, rangoDelDia, yDe } from "@/lib/panel/datos/agenda-dia";

const MEDIANIL = 52;
const ALTO_MIN = 44;
/** Pulsación larga en el teléfono antes de empezar a arrastrar (DECISIONES.md, reglas del gesto). */
const PULSACION_MS = 350;

type Arrastre = { id: string; ini: number; x0: number; y0: number; activo: boolean; tactil: boolean; minutos: number; diaDestino: string | null };

/**
 * Línea de tiempo de un día (PN-04). Cada cita con hora es un bloque; se mueve de 30 en 30 minutos:
 * arrastrando (ratón; en el teléfono con pulsación larga), o con Alt + ↑/↓ con el bloque enfocado.
 * Soltarla sobre un día de la tira (`[data-dia-destino]`) la pasa a ese día con la misma hora; con teclado, Alt + ←/→.
 * Mientras se arrastra, el bloque se ve levantado y una línea de acento marca la hora donde caerá; soltar fuera o Esc cancela.
 */
export function DiaLineaDeTiempo({ citas, esHoy, ahoraMin, pidenComoFue, alAbrir, alMover, alMoverDia, alSobreDia }: {
  citas: readonly Evento[];
  esHoy: boolean;
  ahoraMin: number;
  pidenComoFue: ReadonlySet<string>;
  alAbrir: (id: string) => void;
  alMover: (cita: Evento, minutos: number) => void;
  alMoverDia: (cita: Evento, fecha: string) => void;
  /** El día de la tira bajo el puntero mientras se arrastra (para resaltarlo), o null. */
  alSobreDia: (fecha: string | null) => void;
}) {
  const ayuda = useId();
  const caja = useRef<HTMLDivElement>(null);
  const [arrastre, setArrastre] = useState<Arrastre | null>(null);
  const arrastreRef = useRef<Arrastre | null>(null);
  const temporizador = useRef<number | null>(null);
  const recienArrastrado = useRef(false);
  const [anuncio, setAnuncio] = useState("");

  const { inicio, fin } = useMemo(() => rangoDelDia(citas), [citas]);
  const bloques = useMemo(() => bloquesDelDia(citas), [citas]);
  const porId = useMemo(() => new Map(citas.map((c) => [c.id, c])), [citas]);
  const alto = (fin - inicio) * PX_MIN;

  const poner = (a: Arrastre | null) => { arrastreRef.current = a; setArrastre(a); };
  const limpiarTemporizador = () => { if (temporizador.current !== null) { window.clearTimeout(temporizador.current); temporizador.current = null; } };

  // Con el arrastre táctil activo, el dedo no desplaza la página.
  useEffect(() => {
    const el = caja.current;
    if (!el) return;
    const frenar = (e: TouchEvent) => { if (arrastreRef.current?.activo) e.preventDefault(); };
    el.addEventListener("touchmove", frenar, { passive: false });
    return () => el.removeEventListener("touchmove", frenar);
  }, []);
  // Esc cancela un arrastre en curso.
  useEffect(() => {
    if (!arrastre?.activo) return;
    const tecla = (e: globalThis.KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); poner(null); alSobreDia(null); setAnuncio("Movimiento cancelado"); } };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [arrastre?.activo, alSobreDia]);
  useEffect(() => limpiarTemporizador, []);

  const alBajar = (e: PointerEvent<HTMLButtonElement>, id: string, ini: number) => {
    if (e.button !== 0) return;
    const tactil = e.pointerType === "touch";
    e.currentTarget.setPointerCapture(e.pointerId);
    poner({ id, ini, x0: e.clientX, y0: e.clientY, activo: false, tactil, minutos: ini, diaDestino: null });
    if (tactil) {
      limpiarTemporizador();
      temporizador.current = window.setTimeout(() => {
        const a = arrastreRef.current;
        if (a && a.id === id) { poner({ ...a, activo: true }); navigator.vibrate?.(10); }
      }, PULSACION_MS);
    }
  };
  const alMoverPuntero = (e: PointerEvent<HTMLButtonElement>) => {
    const a = arrastreRef.current;
    if (!a) return;
    const dy = e.clientY - a.y0;
    const dist = Math.hypot(e.clientX - a.x0, dy);
    if (!a.activo) {
      // Ratón: empieza al moverse un poco. Dedo: si se mueve antes de la pulsación larga, no es arrastre.
      if (a.tactil) { if (dist > 8) { limpiarTemporizador(); poner(null); } return; }
      if (dist < 4) return;
    }
    // ¿Está sobre otro día de la tira? Entonces conserva la hora y cambia de día.
    const bajo = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>("[data-dia-destino]")?.dataset.diaDestino ?? null;
    const diaDestino = bajo && bajo !== porId.get(a.id)?.fecha ? bajo : null;
    const minutos = diaDestino ? a.ini : moverPasos(a.ini, pasosDesdePixeles(dy));
    if (diaDestino !== a.diaDestino) alSobreDia(diaDestino);
    if (!a.activo || minutos !== a.minutos || diaDestino !== a.diaDestino) poner({ ...a, activo: true, minutos, diaDestino });
  };
  const alSoltar = (e: PointerEvent<HTMLButtonElement>) => {
    limpiarTemporizador();
    const a = arrastreRef.current;
    poner(null);
    if (!a?.activo) return;
    recienArrastrado.current = true;
    const cita0 = porId.get(a.id);
    if (a.diaDestino) { alSobreDia(null); if (cita0) alMoverDia(cita0, a.diaDestino); return; }
    const r = caja.current?.getBoundingClientRect();
    const dentro = r ? e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top - 24 && e.clientY <= r.bottom + 24 : true;
    const cita = porId.get(a.id);
    if (!dentro) { setAnuncio("Movimiento cancelado"); return; }
    if (cita && a.minutos !== a.ini) alMover(cita, a.minutos);
  };
  const alCancelar = () => { limpiarTemporizador(); if (arrastreRef.current?.diaDestino) alSobreDia(null); poner(null); };
  const alPulsar = (id: string) => {
    if (recienArrastrado.current) { recienArrastrado.current = false; return; }
    alAbrir(id);
  };
  const alTeclear = (e: KeyboardEvent<HTMLButtonElement>, id: string, ini: number) => {
    if (!e.altKey) return;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const c = porId.get(id);
      const fecha = c ? correrFecha(c.fecha, e.key === "ArrowLeft" ? -1 : 1) : null;
      if (c && fecha) alMoverDia(c, fecha);
      return;
    }
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    const cita = porId.get(id);
    const minutos = moverPasos(ini, e.key === "ArrowUp" ? -1 : 1);
    if (cita && minutos !== ini) alMover(cita, minutos);
    else setAnuncio(minutos === ini ? "No se puede mover más" : "");
  };

  // Hora de ahora: solo hoy y dentro del horario a la vista.
  const lineaAhora = esHoy && ahoraMin >= inicio && ahoraMin <= fin ? yDe(ahoraMin, inicio) : null;

  return (
    <div>
      <p id={ayuda} className="pn-solo-lector">Arrastra una cita para cambiarla de hora, o a un día de la tira para cambiarla de día. Con teclado, enfócala y usa Alt con ↑ y ↓ (30 minutos) o con ← y → (un día).</p>
      <div ref={caja} role="group" aria-label="Citas del día por hora" style={{ position: "relative", height: alto, border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--card)", overflow: "hidden", userSelect: arrastre?.activo ? "none" : undefined }}>
        {marcasDeHora(inicio, fin).map((m) => (
          <div key={m} aria-hidden style={{ position: "absolute", left: 0, right: 0, top: yDe(m, inicio), borderTop: "1px solid var(--border)" }}>
            <span style={{ position: "absolute", left: 8, top: 2, fontSize: 12, color: "var(--ink-muted)", fontVariantNumeric: "tabular-nums" }}>{horaTexto(m)}</span>
          </div>
        ))}
        {lineaAhora !== null ? (
          <div aria-hidden style={{ position: "absolute", left: MEDIANIL - 6, right: 0, top: lineaAhora, height: 2, background: "var(--accent)", zIndex: 3 }}>
            <span style={{ position: "absolute", left: 0, top: -4, width: 10, height: 10, borderRadius: "50%", background: "var(--accent)" }} />
          </div>
        ) : null}
        {bloques.map((b) => {
          const cita = porId.get(b.id);
          if (!cita) return null;
          const enArrastre = arrastre?.activo && arrastre.id === b.id;
          const ancho = `(100% - ${MEDIANIL + 8}px) / ${b.carriles}`;
          const pide = pidenComoFue.has(b.id);
          return (
            <button
              key={b.id}
              type="button"
              aria-describedby={ayuda}
              data-cita-id={b.id}
              aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown Alt+ArrowLeft Alt+ArrowRight"
              aria-label={`${horaTexto(b.ini)}, ${cita.titulo}${pide ? ". ¿Cómo te fue?" : ""}`}
              onClick={() => alPulsar(b.id)}
              onPointerDown={(e) => alBajar(e, b.id, b.ini)}
              onPointerMove={alMoverPuntero}
              onPointerUp={alSoltar}
              onPointerCancel={alCancelar}
              onKeyDown={(e) => alTeclear(e, b.id, b.ini)}
              className="pn-evb" data-tipo={cita.tipo} data-pide={pide ? "" : undefined}
              style={{
                position: "absolute", top: yDe(b.ini, inicio) + 1, height: Math.max(ALTO_MIN, (b.fin - b.ini) * PX_MIN - 2),
                left: `calc(${MEDIANIL}px + ${ancho} * ${b.carril})`, width: `calc(${ancho} - 4px)`,
                cursor: enArrastre ? "grabbing" : "grab", zIndex: enArrastre ? 4 : 2, opacity: enArrastre ? 0.55 : 1,
              }}
            >
              {(b.fin - b.ini) * PX_MIN < 60 ? (
                // Bloque corto (una llamada de 15 min): hora y título en una sola línea.
                <span style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>
                  <span style={{ color: "var(--ink-muted)", fontVariantNumeric: "tabular-nums" }}>{horaTexto(b.ini)} · </span><span style={{ fontWeight: 600 }}>{cita.titulo}</span>
                </span>
              ) : (
                <>
                  <span style={{ fontSize: 12, color: "var(--ink-muted)", fontVariantNumeric: "tabular-nums" }}>{horaTexto(b.ini)} · {EVENTO_TIPO_LABELS[cita.tipo] ?? "Cita"}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{cita.titulo}</span>
                </>
              )}
              {pide ? <span style={{ fontSize: 12, color: "var(--warning)" }}>¿Cómo te fue?</span> : null}
            </button>
          );
        })}
        {arrastre?.activo && !arrastre.diaDestino ? (() => {
          const b = bloques.find((x) => x.id === arrastre.id);
          if (!b) return null;
          const top = yDe(arrastre.minutos, inicio);
          return (
            <>
              {/* El bloque levantado, en la hora donde caerá. */}
              <div aria-hidden style={{
                position: "absolute", top: top + 1, height: Math.max(ALTO_MIN, (b.fin - b.ini) * PX_MIN - 2), left: MEDIANIL, right: 8, zIndex: 5,
                border: "1px solid var(--accent)", borderRadius: "var(--r-md)", background: "var(--raised)", boxShadow: "var(--sombra-flota)", padding: "4px 8px", pointerEvents: "none",
              }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{horaTexto(arrastre.minutos)} · {porId.get(b.id)?.titulo}</span>
              </div>
              <div aria-hidden style={{ position: "absolute", left: MEDIANIL - 6, right: 0, top, height: 2, background: "var(--accent)", zIndex: 6, pointerEvents: "none" }} />
            </>
          );
        })() : null}
      </div>
      <p className="pn-sr" role="status" aria-live="polite" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>{anuncio}</p>
    </div>
  );
}
