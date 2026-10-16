import { z } from "zod";
import { APPS } from "./catalog";
import type { AppResult } from "./types";
const contextSchema = z.object({ expedienteId: z.uuid().optional(), inmuebleId: z.string().min(1).max(200).optional(), clienteId: z.string().min(1).max(200).optional() }).strict();
export const resultSchema = z.object({ title: z.string().max(300), summary: z.array(z.object({ label: z.string().max(300), value: z.string().max(4000) })).max(100), sections: z.array(z.object({ title: z.string().max(300), text: z.string().max(250000).optional(), columns: z.array(z.string().max(500)).max(40).optional(), rows: z.array(z.array(z.string().max(12000)).max(40)).max(5000).optional() })).max(100).optional(), warnings: z.array(z.string().max(2000)).max(100).optional() });
export const appRunSchema = z.object({ id: z.uuid().optional(), slug: z.enum(APPS.map(app => app.slug) as [string, ...string[]]), title: z.string().trim().min(1).max(160), input: z.record(z.string(), z.unknown()), result: resultSchema.nullable(), context: contextSchema, version: z.number().int().positive().optional() }).strict();
export function resultToCsv(result: AppResult) {
  const escape = (text: string) => '"' + (/^[\s]*[=+@-]/.test(text) ? "'" + text : text).replaceAll('"', '""') + '"';
  const rows: string[][] = [[result.title], ...result.summary.map(metric => [metric.label, metric.value])];
  for (const section of result.sections ?? []) { rows.push([], [section.title]); if (section.text) rows.push([section.text]); if (section.columns) rows.push(section.columns); rows.push(...section.rows ?? []); }
  for (const warning of result.warnings ?? []) rows.push(["Observación", warning]);
  return "\uFEFF" + rows.map(row => row.map(escape).join(",")).join("\r\n");
}
