"use client";
import * as React from "react";
import Link from "next/link";
import { MapPin, ArrowUpRight } from "lucide-react";
import { PageHeader, Badge, EmptyState, btnGhost } from "@/components/admin/ui";
import { db, useCollection } from "@/lib/admin/store";
import { InventoryScope } from "@/components/admin/workspace/inventory-scope";
import { operationalInventory } from "@/lib/admin/operational-inventory";

export default function TerritorioPage() {
  const allProperties = useCollection(db.propiedades);
  const [includeDemo,setIncludeDemo]=React.useState(false);
  const properties = operationalInventory(allProperties,includeDemo);
  const zones = [...new Set(properties.map(p => p.zona || "Sin zona"))].sort((a, b) => a.localeCompare(b, "es"));
  return <div className="space-y-6">
    <PageHeader title="Análisis territorial" description="Consulta la distribución de tu inventario por zona." actions={<Link className={btnGhost} href="/admin/propiedades">Abrir inventario <ArrowUpRight size={16}/></Link>} />
    <InventoryScope count={allProperties.filter(property=>property.demo).length} included={includeDemo} onChange={setIncludeDemo}/>
    <section className="admin-status-note"><MapPin size={22} aria-hidden="true"/><div><Badge tone="amber">Mapas pendientes</Badge><p className="mt-2">El mapa interactivo, los comparables y las rutas aún no están implementados. Las zonas de abajo provienen de los inmuebles registrados.</p></div></section>
    {!zones.length ? <EmptyState title="Sin inmuebles en esta vista" hint={allProperties.some(property=>property.demo) ? "Los ejemplos Demo siguen en inventario. Puedes incluirlos con el control de arriba." : "Las zonas aparecerán cuando se incorporen inmuebles al inventario."}/> : <div className="admin-module-grid">
      {zones.map(zone => <section key={zone} className="admin-card">
        <div className="admin-card-heading"><h2 className="break-words">{zone}</h2><Badge>{properties.filter(p => (p.zona || "Sin zona") === zone).length} inmuebles</Badge></div>
        <ul className="divide-y divide-border px-5">{properties.filter(p => (p.zona || "Sin zona") === zone).map(p => <li key={p.slug}><Link className="flex min-h-11 items-center justify-between gap-3 py-3 text-sm" href={`/admin/propiedades/${p.slug}/editar`}><span className="break-words">{p.titulo}</span><ArrowUpRight className="shrink-0" size={16} aria-hidden="true"/></Link></li>)}</ul>
      </section>)}
    </div>}
  </div>;
}
