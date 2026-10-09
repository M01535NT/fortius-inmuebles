import { createAvisoPdf } from '@/lib/formatos/aviso-pdf';
import { privacyAddress } from '@/data/privacy-notice';
import { SITE_TERMS } from '@/data/site-terms';
import { noticeContent, notices } from '@/lib/public-notices';
import { createNoticePdf } from '@/lib/public-notice-pdf';
import { getPublicSettings } from '@/lib/backend/public';
export const runtime = 'nodejs';
export async function GET(_request: Request, { params }: { params: Promise<{documento:string}> }) {
  const { documento } = await params;
  const notice=notices.find(n=>`${n.id}.pdf`===documento);
  if(!notice)return new Response('Documento no encontrado',{status:404});
  const content=noticeContent(notice.id,notice.id==='canales'?await getPublicSettings():null)!;
  const bytes=notice.id === "privacidad" ? await createAvisoPdf({ responsable: SITE_TERMS.responsible, domicilioResponsable: privacyAddress, contactoPrivacidad: SITE_TERMS.responsible, correoPrivacidad: SITE_TERMS.email }, { publicTemplate: true }) : await createNoticePdf(content);
  return new Response(Buffer.from(bytes),{headers:{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="fortius-${notice.id}.pdf"`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
