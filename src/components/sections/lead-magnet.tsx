import { ArrowDownToLine, FileCheck2 } from "lucide-react";

/*
  Checklist de venta. Vender (12/11/2026, decisión del titular): se descarga directo, sin
  pedir datos; el único formulario de la página es el asistente de la portada.
*/
const PREVIEW = ["Propietario y título", "Adeudos y gravámenes", "Precio con evidencia"];
export const CHECKLIST_PDF = "/descargas/checklist-venta-fortius.pdf";

export function LeadMagnet() {
  return (
    <section className="lm-band" aria-labelledby="lead-magnet">
      <div className="pg-container lm-grid">
        <div>
          <h2 id="lead-magnet" className="pg-h2">¿Está lista tu propiedad para venderse?</h2>
          <ul className="lm-list">
            {PREVIEW.map((item) => <li key={item}><FileCheck2 size={20} strokeWidth={1.6} aria-hidden="true" />{item}</li>)}
          </ul>
          <p className="lm-more">Y 7 puntos más en el PDF.</p>
        </div>
        <div className="lm-card">
          <p className="pg-h3">Checklist de venta</p>
          <p className="pg-muted" style={{ marginTop: 8, fontSize: 15 }}>Diez puntos para revisar antes de anunciar. Sin registro.</p>
          <a href={CHECKLIST_PDF} download className="pg-btn" style={{ width: "100%", marginTop: 20 }}>
            <ArrowDownToLine size={18} strokeWidth={1.5} aria-hidden="true" />Descargar el checklist (PDF)
          </a>
        </div>
      </div>
    </section>
  );
}
