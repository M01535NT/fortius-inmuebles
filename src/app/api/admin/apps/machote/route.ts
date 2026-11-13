import { z } from "zod";
import { requireStaff } from "@/lib/backend/auth";
import { ApiError, apiResponse } from "@/lib/backend/http";
import { FORMATOS_INDEPENDIENTES } from "@/lib/apps/documentos";
import { formatoById } from "@/lib/formatos/catalog";
import { createFormatoPdf } from "@/lib/formatos/pdf";
import { VALOR_DEFAULTS } from "@/lib/formatos/valor-fields";

/*
  Machote en blanco (HER-02, RP-77): el formato con el membrete de Fortius y sus espacios vacíos,
  para que el cliente lo revise o se llene a mano. Siempre se descarga; no se guarda ni se archiva.
  Un formato cuyo PDF siga pendiente de cotejo (readyForEmission falso) se descarga en Word.
*/

export const runtime = "nodejs";
const privateHeaders = { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie", "X-Content-Type-Options": "nosniff" };

export async function GET(request: Request) {
  let response: Response | undefined;
  const failure = await apiResponse(async () => {
    await requireStaff();
    const formatoId = z.enum(FORMATOS_INDEPENDIENTES).parse(new URL(request.url).searchParams.get("formato"));
    const definition = formatoById(formatoId);
    if (!definition.readyForEmission) throw new ApiError(409, "Este machote se descarga en Word");
    // La opinión de valor trae los textos que su plantilla ya tiene escritos (empresa, supuestos…).
    const bytes = await createFormatoPdf(formatoId, formatoId === "07" ? { ...VALOR_DEFAULTS } : {}, [], { machote: true });
    response = new Response(Buffer.from(bytes), { headers: {
      ...privateHeaders, "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Fortius-${formatoId}-en-blanco.pdf"`,
      "Content-Length": String(bytes.byteLength),
    } });
    return {};
  });
  return response ?? failure;
}
