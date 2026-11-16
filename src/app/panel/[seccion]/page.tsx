import { notFound } from "next/navigation";

import { PaginaEtapa } from "@/components/panel/pagina-etapa";
import { SECCIONES } from "@/lib/panel/secciones";

export const dynamicParams = false;
export function generateStaticParams() {
  return SECCIONES.filter((s) => s.ruta !== "/panel").map((s) => ({ seccion: s.slug }));
}

export default async function Seccion({ params }: { params: Promise<{ seccion: string }> }) {
  const { seccion } = await params;
  const s = SECCIONES.find((x) => x.slug === seccion);
  if (!s) notFound();
  return <PaginaEtapa seccion={s} />;
}
