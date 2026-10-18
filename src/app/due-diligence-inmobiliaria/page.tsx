import type { Metadata } from "next";

import { InteriorPage } from "@/components/sections/interior-page";
import { routePages } from "@/data/site";

export const metadata: Metadata = {
  alternates: { canonical: "/due-diligence-inmobiliaria" },
  title: "Due diligence inmobiliaria",
  description: routePages.dueDiligence.description,
};

const EXAMPLE: { title: string; text: string; status: "revisado" | "pendiente" | "especialista" }[] = [
  { title: "Titularidad", text: "Escritura e identidad de quien vende.", status: "revisado" },
  { title: "Gravámenes", text: "Certificado de libertad de gravamen vigente.", status: "pendiente" },
  { title: "Impuestos y servicios", text: "Predial, agua y luz al corriente.", status: "revisado" },
  { title: "Uso de suelo y permisos", text: "Compatibilidad con el uso previsto.", status: "especialista" },
  { title: "Superficies", text: "Coincidencia entre escritura, catastro y lo observado.", status: "pendiente" },
];
const STATUS = { revisado: "Revisado", pendiente: "Pendiente", especialista: "Especialista" };

const CRITERIA = [
  { title: "Revisión documental inicial", text: "Qué documentos hay y cuáles faltan." },
  { title: "Riesgos identificados", text: "Lo que puede afectar precio, crédito o cierre." },
  { title: "Criterio para negociar", text: "Cómo influye cada pendiente en la oferta." },
  { title: "Siguiente paso", text: "Qué resolver primero y con quién." },
];

/* Boceto Revision: cabecera con un reporte de ejemplo tipo semáforo y cuatro criterios. */
export default function DueDiligencePage() {
  const pending = EXAMPLE.filter(area => area.status === "pendiente").length;
  return <main className="pg-page">
    <InteriorPage {...routePages.dueDiligence} eyebrow="Revisión documental" title="Antes de avanzar, revisa lo que firmas."
      aside={<div className="dd-report" aria-label="Reporte de revisión de ejemplo">
        <div className="dd-report-head"><span>Reporte de revisión <em>· ejemplo</em></span><span className="pg-chip">{pending} pendientes</span></div>
        <ul>
          {EXAMPLE.map(area => <li key={area.title} className={`is-${area.status}`}>
            <span className="dd-dot" aria-hidden="true" />
            <span><strong>{area.title}</strong><span>{area.text}</span></span>
            <span className="dd-status">{STATUS[area.status]}</span>
          </li>)}
        </ul>
        <p>Recomendación de siguiente paso incluida al final del reporte. Los datos son ilustrativos.</p>
      </div>} />
    <section className="pg-container pg-section pg-section-last" aria-labelledby="dd-criteria">
      <h2 id="dd-criteria" className="pg-h2" style={{ marginBottom: 28 }}>Lo que entregamos.</h2>
      <ol className="pg-grid-4 dd-criteria">
        {CRITERIA.map((item, index) => <li key={item.title} className="pg-card pg-card-pad pg-card-hover">
          <span className="pg-number" aria-hidden="true">0{index + 1}</span>
          <h3 className="pg-h3">{item.title}</h3>
          <p className="pg-muted">{item.text}</p>
        </li>)}
      </ol>
    </section>
  </main>;
}
