import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, Download } from 'lucide-react';
import { notices, noticeContent } from '@/lib/public-notices';
export const metadata:Metadata={title:'Avisos y documentos',description:'Consulta y descarga privacidad, derechos del consumidor, no discriminación, términos, honorarios y canales de atención de Fortius Inmuebles.',alternates:{canonical:'/avisos'}};
export default function AvisosPage(){return <main className="notices-page editorial-container">
  <header><p className="contact-eyebrow">Avisos</p><h1>Información para<br />tener a la mano.</h1><p>Consulta nuestros documentos o guarda una copia en PDF.</p></header>
  <div className="notices-list">{notices.map(notice=><article key={notice.id} id={notice.id}><div><h2>{notice.title}</h2><p>{notice.description}</p></div><div className="notice-actions">{!['derechos','no-discriminacion'].includes(notice.id) && <Link href={notice.href}>Consultar <ArrowUpRight size={17} aria-hidden="true" /></Link>}<a href={`/avisos/${notice.id}.pdf`} download>Descargar PDF <Download size={17} aria-hidden="true" /></a></div>{['derechos','no-discriminacion'].includes(notice.id) && <details className="notice-reading"><summary>Leer documento</summary>{noticeContent(notice.id)!.sections.map(section=><section key={section.title}><h3>{section.title}</h3>{section.paragraphs.map(p=><p key={p}>{p}</p>)}</section>)}</details>}</article>)}</div>

</main>;}
