"use client";
import { FileText, CalendarDays, MessageSquare, Route } from "lucide-react";
import { PageHeader, Badge } from "@/components/admin/ui";
import { useSession } from "@/lib/admin/store";

const features = [
  { icon: Route, title: "Mi operación", description: "Avance y próximos pasos de la operación del cliente." },
  { icon: FileText, title: "Mis documentos", description: "Solo los documentos que Fortius decida compartir con ese cliente." },
  { icon: CalendarDays, title: "Agenda", description: "Citas y visitas relacionadas con su operación." },
  { icon: MessageSquare, title: "Mensajes", description: "Comunicación privada con el asesor responsable." },
];
export default function PortalClientesPage() {
  const session = useSession();
  if (session?.role !== "admin") return <p role="alert">Este módulo requiere acceso de administrador.</p>;
  return <div className="space-y-6">
    <PageHeader title="Portal de clientes" description="Vista prevista para que cada cliente consulte su operación." />
    <div className="admin-status-note"><Badge tone="amber">Pendiente de implementación</Badge><span>El acceso de clientes todavía no está habilitado. Esta pantalla es interna y no comparte documentos ni envía invitaciones.</span></div>
    <section className="admin-card">
      <div className="admin-card-heading"><h2>Experiencia del cliente</h2><span className="text-sm text-muted-foreground">Diseño previsto</span></div>
      <div className="admin-module-grid p-5">{features.map(({ icon: Icon, title, description }) => <div key={title} className="admin-module-link rounded-md bg-secondary"><Icon size={24} aria-hidden="true"/><div><h2>{title}</h2><p className="mt-2">{description}</p></div></div>)}</div>
    </section>
  </div>;
}
