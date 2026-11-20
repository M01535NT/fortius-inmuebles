import { redirect } from "next/navigation";

/**
 * Personas ya vive en el Directorio (una sola pantalla de gente). Los enlaces viejos `/admin/personas?ver=<id>` siguen
 * sirviendo: abren el Directorio con esa ficha y, con `?q=`, ya filtrado.
 */
export default async function Personas({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const p = await searchParams;
  const uno = (v: string | string[] | undefined) => (typeof v === "string" && v.trim() ? v.trim() : null);
  const id = uno(p.ver) ?? uno(p.id);
  const q = uno(p.q);
  const destino = new URLSearchParams();
  if (id) destino.set("id", id);
  if (q) destino.set("q", q);
  const s = destino.toString();
  redirect(s ? `/admin/directorio?${s}` : "/admin/directorio");
}
