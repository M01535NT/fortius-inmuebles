import { getPropertyBySlug } from "@/lib/inventario";
import { getPublicAdvisers, getPublicSettings } from "@/lib/backend/public";
import { loadPdfImage } from "@/lib/backend/pdf-images";
import { createPropertyPdf } from "@/lib/property-pdf";
import { siteConfig } from "@/data/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store, max-age=0", "X-Content-Type-Options": "nosniff", "X-Robots-Tag": "noindex" };

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const property = await getPropertyBySlug(slug);
    if (!property) return new Response("Inmueble no disponible.", { status: 404, headers });
    const [settings, advisers] = await Promise.all([getPublicSettings(), getPublicAdvisers()]);
    const bytes = await createPropertyPdf(property, { settings, adviser: advisers.find(a => a.id === property.asesorId), siteUrl: siteConfig.url, loadImage: loadPdfImage });
    const filename = `fortius-ficha-${property.slug.replace(/[^a-z0-9-]/gi, "-")}.pdf`;
    return new Response(Buffer.from(bytes), { headers: { ...headers, "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${filename}"` } });
  } catch {
    return new Response("No pudimos generar la ficha técnica. Inténtalo de nuevo en unos momentos.", { status: 503, headers });
  }
}
