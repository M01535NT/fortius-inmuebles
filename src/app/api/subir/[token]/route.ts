import { leerLiga, subirPorLiga, TAMANO_MAXIMO_ARCHIVO, tokenValido } from "@/lib/backend/apartados";
import { ApiError, apiResponse, assertSameOrigin, readBody } from "@/lib/backend/http";

/*
  La liga del cliente (SPEC.md, sección 8): sin sesión, solo con el enlace que le mandó su asesor.
  Lo que ve es la lista de lo que falta, por nombre; no ve su asunto, ni a las demás personas, ni lo ya recibido.
  Cada liga vence, se puede revocar y tiene un tope de archivos. Un enlace que no sirve responde igual que uno que no existe.
*/

export const runtime = "nodejs";
type Contexto = { params: Promise<{ token: string }> };
const privado = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex, nofollow" };
const noDisponible = () => Response.json({ error: "Esta liga ya no está disponible. Pídele una nueva a tu asesor." }, { status: 404, headers: privado });

export async function GET(_request: Request, contexto: Contexto) {
  const { token } = await contexto.params;
  if (!tokenValido(token)) return noDisponible();
  try {
    const liga = await leerLiga(token);
    return liga ? Response.json(liga, { headers: privado }) : noDisponible();
  } catch { return noDisponible(); }
}

export async function POST(request: Request, contexto: Contexto) {
  const { token } = await contexto.params;
  if (!tokenValido(token)) return noDisponible();
  let sinLiga = false;
  const r = await apiResponse(async () => {
    assertSameOrigin(request);
    const tipo = request.headers.get("content-type") ?? "";
    if (!tipo.toLowerCase().startsWith("multipart/form-data;")) throw new ApiError(415, "Elige un archivo");
    const cuerpo = await readBody(request, TAMANO_MAXIMO_ARCHIVO + 65536);
    let form: FormData;
    try { form = await new Response(cuerpo as BodyInit, { headers: { "Content-Type": tipo } }).formData(); }
    catch { throw new ApiError(400, "No se pudo leer el archivo"); }
    const archivo = form.get("archivo");
    if (!(archivo instanceof File)) throw new ApiError(400, "Elige un archivo");
    const doc = form.get("documento");
    const documento = typeof doc === "string" && /^[0-9a-f-]{36}$/.test(doc) ? doc : null;
    const hecho = await subirPorLiga(token, archivo, documento);
    if (!hecho) { sinLiga = true; return {}; }
    return hecho;
  }, 201);
  if (sinLiga) return noDisponible();
  for (const [k, v] of Object.entries(privado)) r.headers.set(k, v);
  return r;
}
