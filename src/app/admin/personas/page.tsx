import { PersonasApp } from "@/components/admin/personas/personas-app";

// FLX: Personas, lista y perfil en una sola pantalla (boceto del 14/11/2026). `?id=cliente:<id>` o `?id=lead:<id>` abre a esa persona; `?nuevo=1` abre «Nuevo perfil».
export default async function PersonasPage({ searchParams }: { searchParams: Promise<{ id?: string | string[]; nuevo?: string | string[] }> }) {
  const { id, nuevo } = await searchParams;
  return <PersonasApp initialId={typeof id === "string" ? id : null} initialNuevo={nuevo === "1"} />;
}
