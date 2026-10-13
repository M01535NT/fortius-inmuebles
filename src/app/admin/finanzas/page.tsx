"use client";
import { Calculator, FileText, BriefcaseBusiness, ChartNoAxesCombined } from "lucide-react";
import { PageHeader, Badge } from "@/components/admin/ui";
import { ModuleLink } from "@/components/admin/workspace/module-link";
import { useSession } from "@/lib/admin/store";

export default function FinanzasPage() {
  const session = useSession();
  if (session?.role !== "admin") return <p role="alert">Este módulo requiere acceso de administrador.</p>;
  return <div className="space-y-6">
    <PageHeader title="Finanzas y rentabilidad" description="Accesos a las herramientas disponibles y al trabajo financiero por expediente." />
    <div className="admin-module-grid">
      <ModuleLink href="/admin/expedientes" icon={FileText} title="Presupuestos y neto del propietario" description="Abre un expediente para preparar sus formatos de presupuesto y estimación del neto." />
      <ModuleLink href="/admin/control-comercial" icon={BriefcaseBusiness} title="Cartera comercial" description="Consulta los datos y escenarios registrados en el control comercial actual." />
      <ModuleLink href="/herramientas/hipoteca" icon={Calculator} title="Calculadora hipotecaria" description="Evalúa pagos estimados con la calculadora pública disponible." />
      <ModuleLink href="/herramientas/gastos-de-cierre" icon={ChartNoAxesCombined} title="Gastos de cierre" description="Consulta una estimación orientativa con la herramienta pública disponible." />
    </div>
    <section className="admin-card p-6 space-y-3">
      <Badge tone="amber">Pendiente de implementación</Badge>
      <h2>Flujo de efectivo, comisiones y escenarios de inversión</h2>
      <p className="max-w-3xl text-sm text-muted-foreground">El registro de cobros y egresos, las comisiones efectivas y los cálculos TIR/VAN del ERP aún no están disponibles. Se incorporarán con registros verificables; esta pantalla no presenta cifras simuladas como resultados del negocio.</p>
    </section>
  </div>;
}
