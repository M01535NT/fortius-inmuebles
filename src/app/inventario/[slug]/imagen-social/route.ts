import sharp from "sharp";
import { getPropertyBySlug } from "@/lib/inventario";
import { loadPdfImage } from "@/lib/backend/pdf-images";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const property = await getPropertyBySlug((await params).slug);
    if (!property) return new Response("Inmueble no disponible", { status: 404, headers });
    const bytes = property.galeria[0] && await loadPdfImage(property.galeria[0].src);
    if (!bytes) return new Response("Imagen no disponible", { status: 503, headers });
    const image = await sharp(bytes).resize(1200, 630, { fit: "cover" }).jpeg({ quality: 85 }).toBuffer();
    return new Response(new Uint8Array(image), { headers: { ...headers, "Content-Type": "image/jpeg" } });
  } catch { return new Response("Imagen temporalmente no disponible", { status: 503, headers }); }
}
