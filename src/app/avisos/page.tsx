import type { Metadata } from 'next';
import Link from 'next/link';
import { Download, FileText } from 'lucide-react';
import { notices, noticeContent } from '@/lib/public-notices';

export const metadata: Metadata = { title: 'Avisos y documentos', description: 'Consulta y descarga privacidad, derechos del consumidor, no discriminación, términos, honorarios y canales de atención de Fortius Inmuebles.', alternates: { canonical: '/avisos' } };

const INLINE = ['derechos', 'no-discriminacion'];

/* Boceto Avisos: cabecera oscura y biblioteca de documentos en tarjetas con Leer / Descargar. */
export default function AvisosPage() {
  return <main className="pg-page">
    <section className="pg-hero">
      <div className="pg-container pg-hero-body">
        <p className="pg-eyebrow">{notices.length} documentos disponibles</p>
        <h1 className="pg-title">Información para tener a la mano.</h1>
        <p className="pg-lead">Consulta nuestros documentos o guarda una copia en PDF.</p>
      </div>
    </section>
    <section className="pg-container pg-section pg-section-last" aria-label="Documentos">
      <div className="pg-grid-3 nt-grid">
        {notices.map(notice => <article key={notice.id} id={notice.id} className="pg-card pg-card-pad nt-card">
          <div className="nt-card-head"><span className="nt-badge"><FileText size={14} aria-hidden="true" />PDF</span></div>
          <h2 className="pg-h3">{notice.title}</h2>
          <p className="pg-muted">{notice.description}</p>
          <div className="nt-actions">
            {!INLINE.includes(notice.id) && <Link href={notice.href} className="pg-pill">Consultar</Link>}
            <a href={`/avisos/${notice.id}.pdf`} download className="pg-pill pg-pill-download">Descargar PDF <Download size={16} aria-hidden="true" /></a>
          </div>
          {INLINE.includes(notice.id) && <details className="nt-reading">
            <summary>Leer documento</summary>
            {noticeContent(notice.id)!.sections.map(section => <section key={section.title}><h3>{section.title}</h3>{section.paragraphs.map(p => <p key={p}>{p}</p>)}</section>)}
          </details>}
        </article>)}
      </div>
    </section>
  </main>;
}
