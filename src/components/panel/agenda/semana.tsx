"use client";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

import type { Evento } from "@/lib/domain/records";
import { EVENTO_TIPO_LABELS } from "@/lib/domain/records";
import { horaTexto } from "@/lib/panel/calendario";
import type { DiaTira } from "@/lib/panel/datos/agenda";
import { bloquesDelDia, correrFecha, marcasDeHora, moverPasos, pasosDesdePixeles, rangoDelDia } from "@/lib/panel/datos/agenda-dia";
import type { VenceDia } from "@/lib/panel/datos/agenda-resultado";
import type { TareaDia } from "@/lib/panel/datos/agenda-semana";

/** 46 px por hora, como el boceto. */
const PX = 46 / 60;
const ALTO_MIN = 22;
const DIAS_CORTOS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

type Arrastre = { id: string; fecha: string; ini: number; x0: number; y0: number; activo: boolean; minutos: number; fechaDestino: string };

/**
 * Semana en cuadro (boceto «Agenda», escritorio): siete columnas desde el día elegido, fila «Todo el día» con los
 * vencimientos en ámbar y las tareas, horas de 8 a 20 (o lo que pidan las citas). Cada cita se arrastra a otra hora
 * u otra columna (de 30 en 30 minutos); con teclado, Alt + ↑/↓ cambia la hora y Alt + ←/→ el día.
 */
export function SemanaCuadro({ dias, citas, vencen, tareas, hoy, ahoraMin, pidenComoFue, abierta, alAbrir, alMover, alAbrirTarea, alIr }: {
  dias: readonly DiaTira[];
  citas: readonly Evento[];
  vencen: ReadonlyMap<string, VenceDia[]>;
  tareas: ReadonlyMap<string, TareaDia[]>;
  hoy: string;
  ahoraMin: number;
  pidenComoFue: ReadonlySet<string>;
  abierta: string | null;
  alAbrir: (id: string) => void;
  alMover: (cita: Evento, cambio: { minutos?: number; fecha?: string }) => void;
  alAbrirTarea: (expedienteId: string) => void;
  /** Un vencimiento con pantalla propia (un trámite, Dinero) lleva ahí. */
  alIr: (href: string) => void;
}) {
  const ayuda = useId();
  const caja = useRef<HTMLDivElement>(null);
  const [arrastre, setArrastre] = useState<Arrastre | null>(null);
  const ref = useRef<Arrastre | null>(null);
  const recien = useRef(false);
  const poner = (a: Arrastre | null) => { ref.current = a; setArrastre(a); };

  const porDia = useMemo(() => {
    const m = new Map<string, Evento[]>();
    for (const e of citas) if (e.hora) m.set(e.fecha, [...(m.get(e.fecha) ?? []), e]);
    return m;
  }, [citas]);
  const sinHora = useMemo(() => {
    const m = new Map<string, Evento[]>();
    for (const e of citas) if (!e.hora) m.set(e.fecha, [...(m.get(e.fecha) ?? []), e]);
    return m;
  }, [citas]);
  const porId = useMemo(() => new Map(citas.map((c) => [c.id, c])), [citas]);
  const { inicio, fin } = useMemo(() => {
    const r = rangoDelDia(citas.filter((e) => e.hora));
    return { inicio: Math.min(8 * 60, r.inicio), fin: Math.max(20 * 60, r.fin) };
  }, [citas]);
  const alto = (fin - inicio) * PX;
  const y = (m: number) => (m - inicio) * PX;

  useEffect(() => {
    if (!arrastre?.activo) return;
    const tecla = (e: globalThis.KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); poner(null); } };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [arrastre?.activo]);

  const bajar = (e: PointerEvent<HTMLButtonElement>, c: Evento, ini: number) => {
    if (e.button !== 0 || e.pointerType === "touch") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    poner({ id: c.id, fecha: c.fecha, ini, x0: e.clientX, y0: e.clientY, activo: false, minutos: ini, fechaDestino: c.fecha });
  };
  const mover = (e: PointerEvent<HTMLButtonElement>) => {
    const a = ref.current;
    if (!a) return;
    const dy = e.clientY - a.y0;
    if (!a.activo && Math.hypot(e.clientX - a.x0, dy) < 4) return;
    const col = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>("[data-col-fecha]")?.dataset.colFecha;
    const fechaDestino = col && col >= hoy ? col : a.fechaDestino;
    const minutos = moverPasos(a.ini, pasosDesdePixeles(dy, PX));
    if (!a.activo || minutos !== a.minutos || fechaDestino !== a.fechaDestino) poner({ ...a, activo: true, minutos, fechaDestino });
  };
  const soltar = () => {
    const a = ref.current;
    poner(null);
    if (!a?.activo) return;
    recien.current = true;
    const c = porId.get(a.id);
    if (!c) return;
    const cambio: { minutos?: number; fecha?: string } = {};
    if (a.minutos !== a.ini) cambio.minutos = a.minutos;
    if (a.fechaDestino !== a.fecha) cambio.fecha = a.fechaDestino;
    if (cambio.minutos !== undefined || cambio.fecha !== undefined) alMover(c, cambio);
  };
  const pulsar = (id: string) => { if (recien.current) { recien.current = false; return; } alAbrir(id); };
  const teclear = (e: KeyboardEvent<HTMLButtonElement>, c: Evento, ini: number) => {
    if (!e.altKey) return;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const f = correrFecha(c.fecha, e.key === "ArrowLeft" ? -1 : 1);
      if (f) alMover(c, { fecha: f });
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const m = moverPasos(ini, e.key === "ArrowUp" ? -1 : 1);
      if (m !== ini) alMover(c, { minutos: m });
    }
  };

  const hayTodoElDia = dias.some((d) => vencen.has(d.fecha) || tareas.has(d.fecha) || sinHora.has(d.fecha));

  return (
    <div className="pn-sem" style={{ userSelect: arrastre?.activo ? "none" : undefined }}>
      <p id={ayuda} className="pn-solo-lector">Arrastra una cita a otra hora o a otro día. Con teclado, enfócala y usa Alt con ↑ y ↓ (30 minutos) o con ← y → (un día).</p>
      <div className="pn-sem-cab" aria-hidden>
        <span />
        {dias.map((d) => {
          const f = new Date(`${d.fecha}T12:00:00`);
          return (
            <span key={d.fecha} className="pn-sem-dia" data-hoy={d.fecha === hoy ? "" : undefined}>
              <span>{DIAS_CORTOS[f.getDay()]}</span><b>{d.numero}</b>
            </span>
          );
        })}
      </div>
      {hayTodoElDia ? (
        <div className="pn-sem-todo">
          <span className="pn-sem-todo-et">Todo el día</span>
          {dias.map((d) => (
            <div key={d.fecha} className="pn-sem-todo-col">
              {(vencen.get(d.fecha) ?? []).map((v) => (
                v.href || v.expedienteId
                  ? <button key={v.id} type="button" className="pn-sem-chip" data-vence="" title={`${v.titulo} · ${v.detalle}`} onClick={() => (v.href ? alIr(v.href) : alAbrirTarea(v.expedienteId ?? ""))}>{v.titulo}</button>
                  : <span key={v.id} className="pn-sem-chip" data-vence="" title={`${v.titulo} · ${v.detalle}`}>{v.titulo}</span>
              ))}
              {(sinHora.get(d.fecha) ?? []).map((c) => (
                <button key={c.id} type="button" className="pn-sem-chip" data-cita-id={c.id} onClick={() => alAbrir(c.id)}>{c.titulo}</button>
              ))}
              {(tareas.get(d.fecha) ?? []).map((t) => (
                t.expedienteId
                  ? <button key={t.id} type="button" className="pn-sem-chip" data-tarea="" data-vencida={t.vencida ? "" : undefined} title={`Tarea: ${t.titulo}${t.hora ? `, ${t.hora}` : ""}`} onClick={() => alAbrirTarea(t.expedienteId ?? "")}>{t.hora ? `${t.hora} · ` : ""}{t.titulo}</button>
                  : <span key={t.id} className="pn-sem-chip" data-tarea="" data-vencida={t.vencida ? "" : undefined} title={`Tarea: ${t.titulo}${t.hora ? `, ${t.hora}` : ""}`}>{t.hora ? `${t.hora} · ` : ""}{t.titulo}</span>
              ))}
            </div>
          ))}
        </div>
      ) : null}
      <div ref={caja} className="pn-sem-cuerpo" role="group" aria-label="Citas de la semana por hora" style={{ height: alto }}>
        <div className="pn-sem-horas" aria-hidden>
          {marcasDeHora(inicio, fin).map((m) => <span key={m} style={{ top: y(m) }}>{horaTexto(m)}</span>)}
        </div>
        {dias.map((d) => {
          const lista = porDia.get(d.fecha) ?? [];
          const bloques = bloquesDelDia(lista);
          const esHoy = d.fecha === hoy;
          const destino = arrastre?.activo && arrastre.fechaDestino === d.fecha;
          return (
            <div key={d.fecha} className="pn-sem-col" data-col-fecha={d.fecha} data-pasado={d.fecha < hoy ? "" : undefined} data-destino={destino ? "" : undefined}>
              {marcasDeHora(inicio, fin).map((m) => <span key={m} className="pn-sem-linea" style={{ top: y(m) }} aria-hidden />)}
              {esHoy && ahoraMin >= inicio && ahoraMin <= fin ? <span className="pn-sem-ahora" style={{ top: y(ahoraMin) }} aria-hidden /> : null}
              {bloques.map((b) => {
                const c = porId.get(b.id);
                if (!c) return null;
                const enArrastre = arrastre?.activo && arrastre.id === b.id;
                const ancho = `100% / ${b.carriles}`;
                const pide = pidenComoFue.has(b.id);
                const corto = (b.fin - b.ini) * PX < 34;
                return (
                  <button
                    key={b.id} type="button" className="pn-evb" data-tipo={c.tipo} data-pide={pide ? "" : undefined} data-abierta={abierta === b.id ? "" : undefined}
                    data-cita-id={b.id} aria-describedby={ayuda} aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown Alt+ArrowLeft Alt+ArrowRight"
                    aria-label={`${DIAS_CORTOS[new Date(`${d.fecha}T12:00:00`).getDay()]} ${d.numero}, ${horaTexto(b.ini)}, ${c.titulo}${pide ? ". ¿Cómo te fue?" : ""}`}
                    onClick={() => pulsar(b.id)} onPointerDown={(e) => bajar(e, c, b.ini)} onPointerMove={mover} onPointerUp={soltar} onPointerCancel={() => poner(null)}
                    onKeyDown={(e) => teclear(e, c, b.ini)}
                    style={{
                      position: "absolute", top: y(b.ini) + 1, height: Math.max(ALTO_MIN, (b.fin - b.ini) * PX - 2),
                      left: `calc(${ancho} * ${b.carril} + 2px)`, width: `calc(${ancho} - 4px)`, padding: corto ? "1px 6px" : "3px 6px",
                      cursor: enArrastre ? "grabbing" : "grab", zIndex: enArrastre ? 4 : 2, opacity: enArrastre ? 0.5 : 1,
                    }}
                  >
                    {corto ? (
                      <span className="pn-evb-t" style={{ fontSize: 12 }}>{horaTexto(b.ini)} {c.titulo}</span>
                    ) : (
                      <>
                        <span className="pn-evb-h">{horaTexto(b.ini)} · {EVENTO_TIPO_LABELS[c.tipo] ?? "Cita"}</span>
                        <span className="pn-evb-t">{c.titulo}</span>
                      </>
                    )}
                  </button>
                );
              })}
              {arrastre?.activo && arrastre.fechaDestino === d.fecha ? (() => {
                const c = porId.get(arrastre.id);
                const b = c ? bloquesDelDia([c])[0] : undefined;
                if (!c || !b) return null;
                return (
                  <span className="pn-sem-fantasma" aria-hidden style={{ top: y(arrastre.minutos) + 1, height: Math.max(ALTO_MIN, (b.fin - b.ini) * PX - 2) }}>
                    {horaTexto(arrastre.minutos)} · {c.titulo}
                  </span>
                );
              })() : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
