import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** AAAA-MM-DD (o fecha ISO) → DD/MM/AAAA. */
export function formatDate(date: string) {
  return date.slice(0, 10).split("-").reverse().join("/");
}
