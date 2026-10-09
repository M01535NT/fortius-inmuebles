import { privacyNotice, privacyAddress } from '@/data/privacy-notice';
import { consumerNotices } from '@/data/consumer-notices';
import { SITE_TERMS } from '@/data/site-terms';
import { publicContact } from '@/lib/public-contact';
import type { SiteSettings } from '@/lib/admin/store';
export const notices = [
  { id: 'privacidad', title: 'Aviso de privacidad', description: 'Tratamiento de datos personales, derechos y decisiones de consentimiento.', href: '/privacidad' },
  { id: 'no-discriminacion', title: 'Política de no discriminación', description: 'Atención en igualdad de condiciones y cómo reportar una situación.', href: '/avisos#no-discriminacion' },
  { id: 'derechos', title: 'Carta de derechos del consumidor', description: 'Tus derechos en la compraventa de vivienda.', href: '/avisos#derechos' },
  { id: 'terminos', title: 'Términos y condiciones', description: 'Condiciones de uso del sitio y alcance de los servicios.', href: '/terminos' },
  { id: 'honorarios', title: 'Información sobre honorarios', description: 'Cómo se acuerdan los servicios, costos y condiciones del encargo.', href: '/terminos#servicios' },
  { id: 'canales', title: 'Canales de atención', description: 'Datos de contacto de Fortius para consultas y aclaraciones.', href: '/contacto' },
] as const;
export function noticeContent(id: string, settings?: SiteSettings | null) {
  const notice = notices.find(n => n.id === id);
  if (!notice) return null;
  if (id === 'privacidad') return privacyNotice;
  if(id === 'no-discriminacion' || id === 'derechos') return consumerNotices[id];
  if (id === 'canales') {
    const contact = publicContact(settings);
    return { title: notice.title, sections: [
      { title: 'Contacto', paragraphs: [SITE_TERMS.commercialName, `Responsable: ${SITE_TERMS.responsible}`, `Domicilio para contacto y notificaciones: ${privacyAddress}`, `Sitio: https://fortiusinmuebles.com/contacto`, ...(contact.email ? [`Correo: ${contact.email}`] : []), ...(contact.phoneHref ? [`Teléfono: ${contact.phone}`] : []), ...(contact.whatsapp ? [`WhatsApp: ${contact.whatsapp}`] : []), ...(contact.messenger ? [`Messenger: ${contact.messenger}`] : []), ...(settings?.horario?.trim() ? [`Horario: ${settings.horario}`] : [])] },
      { title: 'Aclaraciones sobre el sitio', paragraphs: [`Correo: ${SITE_TERMS.email}`, `${SITE_TERMS.location}. La atención se coordina previamente por correo.`] },
    ] };
  }
  return { title: notice.title, sections: [
    { title: SITE_TERMS.commercialName, paragraphs: [`Responsable: ${SITE_TERMS.responsible}`, `Correo para aclaraciones: ${SITE_TERMS.email}`, `Versión de los términos: ${SITE_TERMS.dateLabel}.`, ...(id === 'honorarios' ? ['Extracto de los términos y condiciones del sitio: contratación, honorarios y exclusivas.'] : [`${SITE_TERMS.location}. La atención se coordina previamente por correo.`])] },
    ...SITE_TERMS.sections.filter(s => id === 'terminos' || s.id === 'servicios').map(s => ({title:s.title, paragraphs:[...s.paragraphs]})),
  ] };
}
