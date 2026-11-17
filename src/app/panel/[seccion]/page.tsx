import { notFound } from "next/navigation";

import { PaginaEtapa } from "@/components/panel/pagina-etapa";
import { CONSULTA } from "@/lib/panel/secciones";

/** Secciones que todavía no tienen pantalla propia: dicen en qué etapa llegan. */
const PENDIENTES = [CONSULTA];

export const dynamicParams = false;
export function generateStaticParams() {
  return PENDIENTES.map((s) => ({ seccion: s.slug }));
}

export default async function Seccion({ params }: { params: Promise<{ seccion: string }> }) {
  const { seccion } = await params;
  const s = PENDIENTES.find((x) => x.slug === seccion);
  if (!s) notFound();
  return <PaginaEtapa seccion={s} />;
}
