import "server-only";
import { z } from "zod";
import type { Extractor } from "@/lib/backend/expediente-lectura";
import { ApiError } from "@/lib/backend/http";
import { instruccionesLectura, respuestaLectura } from "./lectura";

/*
  Proveedor de lectura alterno: la API de xAI (Grok), compatible con el formato de chat de OpenAI.
  La clave vive solo en el servidor (XAI_API_KEY). Lee imágenes JPG, PNG y WEBP; los PDF no entran
  por esta API (documentado el 31/10/2026): para un PDF, el panel pide una foto o el otro proveedor.
  La respuesta se exige con la misma estructura fija que con Claude y se valida otra vez al recibirla.
*/

export const MODELO_GROK = process.env.XAI_MODELO?.trim() || "grok-4.7";
const URL_GROK = "https://api.x.ai/v1/chat/completions";
const IMAGENES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function grokDisponible(): boolean {
  return Boolean(process.env.XAI_API_KEY?.trim());
}

/** Esquema JSON de la respuesta, el mismo que valida zod; sin propiedades extra. */
export function esquemaRespuesta() {
  return z.toJSONSchema(respuestaLectura, { target: "draft-7" });
}

const cuerpoRespuesta = z.object({
  model: z.string().optional(),
  choices: z.array(z.object({ message: z.object({ content: z.string().nullable().optional(), refusal: z.string().nullable().optional() }), finish_reason: z.string().nullable().optional() })).min(1),
  usage: z.object({ prompt_tokens: z.number().int().nonnegative(), completion_tokens: z.number().int().nonnegative() }).optional(),
});

export function extractorGrok(fetchFn: typeof fetch = fetch): Extractor {
  if (!grokDisponible()) throw new ApiError(503, "La lectura de documentos aún no está activada");
  return async ({ bytes, mime, titulo }) => {
    if (!IMAGENES.has(mime)) throw new ApiError(502, "Este servicio de lectura solo lee imágenes JPG, PNG o WEBP; toma una foto del documento o súbelo como imagen");
    const cuerpo = {
      model: MODELO_GROK,
      temperature: 0,
      messages: [
        { role: "system", content: instruccionesLectura() },
        { role: "user", content: [
          { type: "image_url", image_url: { url: `data:${mime};base64,${bytes.toString("base64")}`, detail: "high" } },
          { type: "text", text: `Documento del expediente: «${titulo.slice(0, 200)}». Di qué tipo de documento es y extrae los datos de la lista que aparezcan en él.` },
        ] },
      ],
      response_format: { type: "json_schema", json_schema: { name: "lectura_documento", schema: esquemaRespuesta(), strict: true } },
    };
    let response: Response;
    try {
      response = await fetchFn(URL_GROK, { method: "POST", headers: { Authorization: `Bearer ${process.env.XAI_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify(cuerpo), signal: AbortSignal.timeout(4 * 60_000) });
    } catch { throw new ApiError(502, "El servicio de lectura no respondió; inténtalo más tarde"); }
    if (response.status === 401 || response.status === 403) throw new ApiError(503, "La clave del servicio de lectura no es válida; revísala en la configuración del servidor");
    if (response.status === 429) throw new ApiError(503, "El servicio de lectura está saturado; inténtalo en unos minutos");
    if (response.status === 400 || response.status === 413 || response.status === 422) throw new ApiError(502, "No se pudo abrir este archivo; revisa que la imagen se vea bien");
    if (!response.ok) throw new ApiError(502, "El servicio de lectura no respondió; inténtalo más tarde");
    const parsed = cuerpoRespuesta.safeParse(await response.json().catch(() => null));
    if (!parsed.success) throw new ApiError(502, "La lectura no devolvió datos válidos; inténtalo otra vez");
    const eleccion = parsed.data.choices[0];
    if (eleccion.message.refusal || eleccion.finish_reason === "content_filter") throw new ApiError(502, "Este documento no se pudo leer; captura sus datos a mano");
    if (eleccion.finish_reason === "length") throw new ApiError(502, "La lectura quedó incompleta; inténtalo otra vez");
    let respuesta: unknown;
    try { respuesta = JSON.parse(eleccion.message.content ?? ""); } catch { throw new ApiError(502, "La lectura no devolvió datos válidos; inténtalo otra vez"); }
    const uso = parsed.data.usage ?? { prompt_tokens: 0, completion_tokens: 0 };
    return { respuesta, uso: { input_tokens: uso.prompt_tokens, output_tokens: uso.completion_tokens }, modelo: parsed.data.model ?? MODELO_GROK };
  };
}
