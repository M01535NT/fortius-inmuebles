import { z } from "zod";
import { createServerClient, requireStaff } from "@/lib/backend/auth";
import { leerArchivoConIa, type EntradaLectura } from "@/lib/backend/expediente-lectura";
import { ApiError, apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";
import { extractor } from "@/lib/ia/proveedor";

export const runtime = "nodejs";
export const maxDuration = 300;
type Context = { params: Promise<{ id: string }> };

/** Páginas de un PDF dibujadas por el navegador (JPEG, PNG o WEBP), para los servicios que no reciben PDF. */
const MAX_PAGINAS = 12, MAX_BYTES_PAGINA = 4 * 1024 * 1024;
const cuerpo = z.object({ paginas: z.array(z.string().regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/)).min(1).max(MAX_PAGINAS) });

function paginasDe(input: unknown): NonNullable<EntradaLectura["paginas"]> {
  const parsed = cuerpo.safeParse(input);
  if (!parsed.success) throw new ApiError(400, `Manda hasta ${MAX_PAGINAS} páginas como imágenes JPEG, PNG o WEBP`);
  return parsed.data.paginas.map(pagina => {
    const [cabecera, base64] = pagina.split(",", 2);
    const bytes = Buffer.from(base64, "base64");
    if (bytes.length > MAX_BYTES_PAGINA) throw new ApiError(413, "Cada página debe pesar hasta 4 MB");
    return { bytes, mime: cabecera.slice("data:".length, cabecera.indexOf(";")) };
  });
}

/** Lee un documento del cliente con IA y deja sus datos como propuestas del expediente. */
export async function POST(request: Request, context: Context) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const id = z.uuid().parse((await context.params).id);
    const { client, user } = await requireStaff();
    const conCuerpo = request.headers.get("content-type")?.toLowerCase().startsWith("application/json");
    const paginas = conCuerpo ? paginasDe(await readJson(request, (MAX_BYTES_PAGINA * 4 / 3 + 128) * MAX_PAGINAS)) : undefined;
    return { lectura: await leerArchivoConIa(client, createServerClient(undefined, true), user.id, id, extractor(), paginas) };
  });
}
