import type { Metadata } from 'next';
import Link from 'next/link';
import { Download } from 'lucide-react';
import { privacyNotice } from '@/data/privacy-notice';
import { pageMetadata } from "@/lib/seo/page-metadata";
export const metadata: Metadata = pageMetadata({
  path: "/privacidad",
  title: "Aviso de privacidad",
  description:
    "Responsable, tratamiento de datos, derechos y decisiones de consentimiento de Fortius Inmuebles.",
});
export default function PrivacidadPage(){return <main className="editorial-container privacy-page">
  <header><p className="contact-eyebrow">Fortius Inmuebles</p><h1 className="display-title">Aviso de privacidad.</h1><a href="/avisos/privacidad.pdf" download className="privacy-download">Descargar PDF <Download size={18} aria-hidden="true" /></a></header>
  {privacyNotice.sections.map(section=><section key={section.title}><h2>{section.title}</h2>{section.paragraphs.map((p,i)=><p key={i}>{p}</p>)}</section>)}
  <Link href="/avisos" className="privacy-download">Volver a Avisos</Link>
</main>;}
