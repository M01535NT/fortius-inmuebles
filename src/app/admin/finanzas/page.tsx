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
      <ModuleLink href="/admin/apps/hipoteca" icon={Calculator} title="Calculadora hipotecaria" description="Prepara y guarda escenarios hipotecarios por expediente." />
      <ModuleLink href="/herramientas/gastos-de-cierre" icon={ChartNoAxesCombined} title="Gastos de cierre" description="Consulta una estimación orientativa con la herramienta pública disponible." />
    </div>
    <section className="admin-card p-6 space-y-3">
      <Badge tone="amber">Herramientas de análisis</Badge>
      <h2>Flujo de efectivo, comisiones y escenarios de inversión</h2>
      <p className="max-w-3xl text-sm text-muted-foreground">Calcula comisiones, neto del propietario y escenarios de inversión con flujos fechados, ROI, VAN y TIR. Los escenarios se guardan por separado de los cobros y egresos reales.</p>
      <div className="admin-module-grid"><ModuleLink href="/admin/apps/inversiones" icon={ChartNoAxesCombined} title="Evaluar inversión" description="Flujos, escenarios, ROI, VAN y TIR."/><ModuleLink href="/admin/apps/comisiones" icon={Calculator} title="Calcular comisiones" description="Honorarios, impuestos y reparto."/><ModuleLink href="/admin/apps/neto-propietario" icon={FileText} title="Neto del propietario" description="Costos pendientes y neto estimado."/></div>
    </section>
  </div>;
}
