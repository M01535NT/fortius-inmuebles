"use client";
import * as React from "react";
import { Button } from "@/components/admin/kit";
import { inputClass } from "@/components/admin/ui";
import { addDays } from "@/lib/admin/lead-contact";
import { planNextStep, type PersonRef } from "@/lib/admin/next-step-task";
import { db, errorMessage, uid, upsert, useCollection } from "@/lib/admin/store";

/*
  DEC-42: al completar el siguiente paso de una persona se pide el que sigue, con fecha, y queda
  como su nueva tarea. «Ahora no» lo deja sin siguiente paso; la ficha lo sigue pidiendo.
*/
export function NextStepPrompt({ person, name, today, onClose }: { person: PersonRef; name?: string; today: string; onClose: () => void }) {
  const tasks = useCollection(db.tareas);
  const [accion, setAccion] = React.useState(""), [fecha, setFecha] = React.useState(addDays(today, 2));
  const [busy, setBusy] = React.useState(false), [error, setError] = React.useState("");
  const first = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => { first.current?.focus(); }, []);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!accion.trim() || !fecha) { setError("Escribe el siguiente paso y su fecha."); return; }
    if (fecha < today) { setError("La fecha no puede ser anterior a hoy."); return; }
    setBusy(true); setError("");
    try {
      const task = planNextStep(tasks, person, { accion, fecha, id: uid() });
      await upsert(db.tareas, task, db.tareas.version(task));
      onClose();
    } catch (cause) { setError(errorMessage(cause)); } finally { setBusy(false); }
  }

  return <form onSubmit={save} aria-label={`Siguiente paso${name ? ` con ${name}` : ""}`} className="grid gap-3 rounded-[12px] border border-border bg-card p-3 sm:grid-cols-2">
    <p className="m-0 text-[.9375rem] font-semibold sm:col-span-2">¿Qué sigue{name ? ` con ${name}` : ""}?</p>
    <label className="flex flex-col gap-1 text-sm">Siguiente paso<input ref={first} className={inputClass} value={accion} maxLength={160} required placeholder="Llamar para confirmar la visita" onChange={e => setAccion(e.target.value)} /></label>
    <label className="flex flex-col gap-1 text-sm">Fecha<input type="date" className={inputClass} value={fecha} min={today} required onChange={e => setFecha(e.target.value)} /></label>
    {error && <p role="alert" className="m-0 text-sm text-destructive sm:col-span-2">{error}</p>}
    <span className="flex flex-wrap gap-2 sm:col-span-2"><Button type="submit" disabled={busy}>Guardar</Button><Button variant="ghost" disabled={busy} onClick={onClose}>Ahora no</Button></span>
  </form>;
}
