import { TramitesApp } from "@/components/admin/tramites/tramites-app";

// TRA-01: trámites con pasos (cancelación de hipoteca). `?id=` abre un trámite directo.
export default async function TramitesPage({ searchParams }: { searchParams: Promise<{ id?: string | string[] }> }) {
  const { id } = await searchParams;
  return <TramitesApp initialId={typeof id === "string" ? id : null} />;
}
