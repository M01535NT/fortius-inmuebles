import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** AAAA-MM-DD (o fecha ISO) → DD/MM/AAAA. */
export function formatDate(date: string) {
  return date.slice(0, 10).split("-").reverse().join("/");
}

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const dayNumber = (date: string) => Math.round(Date.parse(`${date.slice(0, 10)}T12:00:00.000Z`) / 86_400_000);
/** Fecha local AAAA-MM-DD de un instante (zona del navegador). */
function localDay(instant: Date) {
  return `${instant.getFullYear()}-${String(instant.getMonth() + 1).padStart(2, "0")}-${String(instant.getDate()).padStart(2, "0")}`;
}

/**
  Fecha humana del panel (RP-53, C03): «Hoy», «Mañana», «Ayer», «Lun 19» dentro de la semana
  que viene, «19 oct» en el mismo año y «19 oct 2025» en otro. Nunca «2026-10-17».
  `today` es la fecha de operación (AAAA-MM-DD); sin ella se usa la del navegador.
*/
export function humanDate(date: string | undefined | null, today: string = localDay(new Date())) {
  if (!date || !/^\d{4}-\d{2}-\d{2}/.test(date)) return "";
  const d = new Date(`${date.slice(0, 10)}T12:00:00.000Z`);
  const diff = dayNumber(date) - dayNumber(today);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Mañana";
  if (diff === -1) return "Ayer";
  if (diff > 1 && diff < 7) return `${DIAS[d.getUTCDay()]} ${d.getUTCDate()}`;
  const base = `${d.getUTCDate()} ${MESES[d.getUTCMonth()]}`;
  return date.slice(0, 4) === today.slice(0, 4) ? base : `${base} ${date.slice(0, 4)}`;
}

/** Un instante guardado (fecha y hora) como «Hoy · 10:30» o «19 oct · 10:30», en la hora local. */
export function humanDateTime(instant: string | undefined | null, today?: string) {
  if (!instant) return "";
  const at = new Date(instant);
  if (Number.isNaN(at.getTime())) return "";
  const time = `${String(at.getHours()).padStart(2, "0")}:${String(at.getMinutes()).padStart(2, "0")}`;
  return `${humanDate(localDay(at), today)} · ${time}`;
}

/** «Vencida hoy», «Vencida ayer», «Vencida hace 3 días»; vacío si aún no vence. */
export function overdueText(date: string | undefined | null, today: string = localDay(new Date())) {
  if (!date) return "";
  const days = dayNumber(today) - dayNumber(date);
  if (days < 0) return "";
  return days === 0 ? "Vence hoy" : days === 1 ? "Vencida ayer" : `Vencida hace ${days} días`;
}
