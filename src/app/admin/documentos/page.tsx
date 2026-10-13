import { FileText, FolderOpen, History, NotebookPen } from "lucide-react";
import { PageHeader } from "@/components/admin/ui";
import { ModuleLink } from "@/components/admin/workspace/module-link";
import { DocumentBrowser } from "@/components/admin/workspace/document-browser";

export default function DocumentosPage() {
  return <div className="space-y-6">
    <PageHeader title="Documentos y expediente" description="Encuentra los documentos de cada operación, sus versiones y las herramientas de trabajo." />
    <DocumentBrowser/>
    <details className="admin-document-tools"><summary>Biblioteca y otras herramientas</summary><div className="admin-module-grid mt-4">
      <ModuleLink href="/admin/expedientes" icon={FileText} title="Expedientes y contratos" description="Formatos, borradores, emisiones PDF y copias firmadas, dentro de su expediente." />
      <ModuleLink href="/admin/archivos" icon={FolderOpen} title="Biblioteca de archivos" description="Administra los archivos y enlaces de la biblioteca actual." />
      <ModuleLink href="/admin/notas" icon={NotebookPen} title="Notas de trabajo" description="Consulta y organiza las notas internas del equipo." />
      <ModuleLink href="/admin/propiedades" icon={History} title="Documentación del inmueble" description="Abre un inmueble para administrar sus fichas, documentos y fotografías." />
    </div></details>
    <p className="admin-status-note">La búsqueda documental con IA y la revisión asistida de cláusulas siguen pendientes del plan. Cada documento conserva sus controles actuales de acceso y emisión.</p>
  </div>;
}
