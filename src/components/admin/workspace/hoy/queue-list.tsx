"use client";
import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, ChevronRight, Circle, Star } from "@/components/admin/icons";
import { Checkbox } from "@/components/ui/controls";
import { FirstContactButton } from "@/components/admin/workspace/first-contact";
import { useReducedMotionSafe } from "@/lib/use-reduced-motion-safe";
import { isTaskOpen, type Task } from "@/lib/tasks";
import type { QueueItem } from "@/lib/admin/today";
import type { Lead } from "@/lib/admin/store";
import { cn } from "@/lib/utils";
import type { TaskDone } from "./use-task-done";
import s from "../hoy.module.css";

/*
  Filas de «Tu día» (LV-10b). Una fila por persona con lo más urgente al frente («3 pendientes» si
  hay más). Las primeras llevan la foto del inmueble o la cara de la persona; las demás van
  compactas, sin foto (reglas de volumen de Hoy). Si el pendiente es una tarea, la casilla la
  palomea aquí mismo y el aviso ofrece «Deshacer»; si no, el ícono dice su estado y la fila abre
  lo que espera. Al palomearla, la fila se va en 180 ms con Motion (sin animación con «reducir
  movimiento»).
*/
export type RowHelpers = {
  media: (item: QueueItem) => React.ReactNode;
  tagsOf: (item: QueueItem) => string[];
  leadOf: (item: QueueItem) => Lead | undefined;
  taskOf: (item: QueueItem) => Task | undefined;
  done: TaskDone;
};

/** Qué dice el botón de cada fila, según a dónde lleva. */
export function actionOf(item: QueueItem) {
  if (item.href.startsWith("/admin/operaciones")) return "Abrir asunto";
  if (item.href.startsWith("/admin/tareas")) return "Abrir tarea";
  if (item.kind === "informe") return "Preparar";
  if (item.href.startsWith("/admin/clientes") || item.href.startsWith("/admin/leads") || item.href.startsWith("/admin/contactos")) return "Abrir ficha";
  return "Abrir";
}

/** El ícono de estado: problema en triángulo, lo nuevo con estrella y lo demás en círculo. */
function StateIcon({ item }: { item: QueueItem }) {
  if (item.kind === "problema" || item.kind === "plazo") return <span className={cn(s.si, s.siWarn)}><AlertTriangle size={18} aria-hidden="true" /></span>;
  if (item.kind === "nuevo") return <span className={cn(s.si, s.siInfo)}><Star size={18} aria-hidden="true" /></span>;
  return <span className={s.si}><Circle size={18} aria-hidden="true" /></span>;
}

/** La casilla de una tarea, con un área de 44 px que la palomea aunque no se le atine al cuadro. */
export function TaskCheck({ task, done, where = "dia", className }: { task: Task; done: TaskDone; where?: "dia" | "agenda"; className?: string }) {
  const open = isTaskOpen(task), busy = done.saving === task.id;
  // Mientras se guarda ya se ve el cambio; si el servidor lo rechaza, vuelve a como estaba.
  return <label className={cn(s.checkHit, className)}>
    <Checkbox checked={busy ? open : !open} disabled={busy} onCheckedChange={() => void done.toggle(task, where)} aria-label={`${open ? "Marcar como hecha" : "Marcar como pendiente"}: ${task.titulo}`} />
  </label>;
}

export function QueueList({ groups, photos, label, helpers }: { groups: QueueItem[][]; photos: number; label: string; helpers: RowHelpers }) {
  const reduce = useReducedMotionSafe();
  if (!groups.length) return null;
  return <ul className={s.list} aria-label={label}>
    <AnimatePresence initial={false}>
      {groups.map((group, i) => <motion.li key={group[0].id}
        initial={reduce ? false : { opacity: 0, transform: "translateY(4px)" }}
        animate={{ opacity: 1, transform: "translateY(0px)" }}
        exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, transform: "translateX(12px)" }}
        transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}>
        <QueueRow group={group} photo={i < photos} helpers={helpers} />
      </motion.li>)}
    </AnimatePresence>
  </ul>;
}

function QueueRow({ group, photo, helpers }: { group: QueueItem[]; photo: boolean; helpers: RowHelpers }) {
  const item = group[0], lead = helpers.leadOf(item), task = helpers.taskOf(item), tags = helpers.tagsOf(item);
  const checkable = task && isTaskOpen(task);
  return <article className={cn(s.qrow, !photo && s.qrowCompact, lead && s.qrowLead)}>
    {checkable ? <TaskCheck task={task} done={helpers.done} className={s.lead} /> : <span className={s.lead}><StateIcon item={item} /></span>}
    <Link href={item.href} className={s.row} aria-label={`${item.text} · ${item.who}${group.length > 1 ? ` · ${group.length} pendientes` : ""}`}>
      {photo && <span className={s.mediaCell}>{helpers.media(item)}</span>}
      <span className={s.rowBody}>
        <span className={s.rowTitle}>{item.text}</span>
        <span className={s.rowText}>{item.who}{item.detail ? ` · ${item.detail}` : ""}{tags.map(tag => <span key={tag} className={s.warnText}> · {tag}</span>)}</span>
      </span>
      {(item.when || group.length > 1) && <span className={s.whenCell}>
        {item.when && <span className={cn(s.when, item.late && s.lateText, !item.late && item.kind === "nuevo" && s.infoText)}>{item.when}</span>}
        {group.length > 1 && <span className={s.groupCount}>{group.length} pendientes</span>}
      </span>}
      {!lead && <span className={s.rowGo} aria-hidden="true">{actionOf(item)}</span>}
      <ChevronRight size={18} aria-hidden="true" className={s.rowChevron} />
    </Link>
    {lead && <FirstContactButton lead={lead} className={s.rowAction} />}
  </article>;
}
