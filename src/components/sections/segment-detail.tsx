import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { ConceptualPropertyPlan } from "@/components/sections/conceptual-property-plan";
import { PropertyCard } from "@/components/property/property-card";
import { getPropiedades } from "@/lib/inventario";
import type { TipoPropiedad } from "@/data/propiedades";

type Segment = "residencial" | "comercial" | "industrial";

const details: Record<Segment, { label: string; tipos: TipoPropiedad[]; intro: string; checks: { title: string; body: string }[]; decision: string }> = {
  residencial: {
    label: "Residencial",
    tipos: ["casa", "departamento"],
    intro: "Una vivienda debe funcionar para la vida diaria y para el presupuesto completo de quien la compra o renta.",
    checks: [
      { title: "Habitarla", body: "Distribución, luz, conservación observable, servicios y entorno inmediato. Lo que importa cambia según quién vivirá ahí." },
      { title: "Entender el inmueble", body: "Superficies según su fuente, situación documental disponible y condiciones de ocupación o entrega." },
      { title: "Poder pagarla", body: "Precio, gastos de cierre y, si hay crédito, mensualidad estimada y condiciones de financiamiento por confirmar con la institución." },
    ],
    decision: "Antes de una oferta, compara el costo total y pide claridad sobre los datos que sigan pendientes.",
  },
  comercial: {
    label: "Comercial",
    tipos: ["local", "oficina"],
    intro: "En un local u oficina, la ubicación solo sirve si el espacio permite la actividad y los números de ocupación tienen sentido.",
    checks: [
      { title: "Actividad prevista", body: "Uso permitido por verificar, visibilidad, acceso de clientes y posibilidades de adaptación del espacio." },
      { title: "Costo de ocupar", body: "Precio o renta, mantenimiento, adecuaciones, depósitos y otros conceptos que se conozcan antes de comprometerse." },
      { title: "Contrato y entrega", body: "Plazo, condiciones de uso, estado de entrega y responsabilidades por adecuaciones o servicios." },
    ],
    decision: "Si falta confirmar un permiso o condición de uso, la decisión debe esperar esa verificación con la autoridad o especialista competente.",
  },
  industrial: {
    label: "Industrial",
    tipos: ["nave-industrial", "terreno"],
    intro: "Una nave o terreno industrial se evalúa desde la operación concreta que deberá recibir, no solo por metros cuadrados.",
    checks: [
      { title: "Acceso y logística", body: "Entradas, maniobras, carga y conexiones relevantes para el proceso previsto." },
      { title: "Capacidad técnica", body: "Instalaciones, energía y servicios según datos disponibles. Las capacidades críticas requieren soporte técnico y confirmación externa." },
      { title: "Uso y puesta en marcha", body: "Compatibilidad del uso previsto, adecuaciones necesarias, calendario y condiciones contractuales de entrega." },
    ],
    decision: "Una visita permite detectar preguntas; la factibilidad técnica y normativa se confirma con documentos y especialistas antes de contratar.",
  },
};

/* Boceto Segmento: lectura del espacio, tres criterios y el inventario del segmento. */
export async function SegmentDetail({ segment }: { segment: Segment }) {
  const detail = details[segment];
  const inventario = (await getPropiedades().catch(() => [])).filter(property => detail.tipos.includes(property.tipo)).slice(0, 3);
  return (
    <>
      <section className="pg-container pg-section" aria-labelledby="segment-look">
        <div className="pg-head">
          <h2 id="segment-look" className="pg-h2">Lo que conviene mirar.</h2>
          <p className="pg-muted seg-intro">{detail.intro}</p>
        </div>
        <ConceptualPropertyPlan segment={segment} />
        <ol className="seg-checks">
          {detail.checks.map((check, index) => (
            <li key={check.title} className="pg-step">
              <span className="pg-number" aria-hidden="true">0{index + 1}</span>
              <div><h3>{check.title}</h3><p className="pg-muted">{check.body}</p></div>
            </li>
          ))}
        </ol>
        <div className="seg-decision">
          <h3 className="pg-h3">Antes de decidir</h3>
          <div>
            <p className="pg-muted">{detail.decision}</p>
            <div className="pg-pills">
              <Link href="/inventario" className="pg-link">Ver propiedades <ArrowUpRight size={18} aria-hidden="true" /></Link>
              <Link href="/contacto" className="pg-link">Consultar un caso <ArrowUpRight size={18} aria-hidden="true" /></Link>
            </div>
          </div>
        </div>
      </section>
      <section className="pg-container pg-section pg-section-last inv-page" aria-labelledby="segment-inventory">
        <div className="pg-head">
          <h2 id="segment-inventory" className="pg-h2">{detail.label} en inventario.</h2>
          <Link href={`/inventario?tipo=${detail.tipos[0]}`} className="pg-link">Ver todo <ArrowUpRight size={18} aria-hidden="true" /></Link>
        </div>
        {inventario.length > 0 ? (
          <div className="property-catalog-grid">{inventario.map(property => <PropertyCard key={property.slug} property={property} />)}</div>
        ) : (
          <div className="pg-empty">
            <h3>Por ahora no hay inmuebles publicados en este segmento.</h3>
            <p>El inventario cambia con frecuencia. Cuéntanos qué buscas y te avisamos cuando entre algo que encaje.</p>
            <div className="pg-pills" style={{ justifyContent: "center", marginTop: 24 }}><Link href="/contacto" className="pg-btn">Cuéntanos qué buscas</Link></div>
          </div>
        )}
      </section>
    </>
  );
}
