import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { Extractor } from "@/lib/backend/expediente-lectura";
import { ApiError } from "@/lib/backend/http";
import { instruccionesLectura, MODELO_LECTURA, respuestaLectura } from "./lectura";

/*
  Proveedor de lectura: la API de Claude (Anthropic). La clave vive solo en el servidor
  (ANTHROPIC_API_KEY) y nunca llega al navegador. Sin clave, la lectura no está disponible.
  Antes de usarla con documentos reales: visto bueno del abogado sobre el aviso de privacidad y
  anotación del proveedor como encargado (IA-02).
*/

export function lecturaDisponible(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

type TipoImagen = "image/jpeg" | "image/png" | "image/webp";

export function extractorClaude(): Extractor {
  if (!lecturaDisponible()) throw new ApiError(503, "La lectura de documentos aún no está activada");
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 4 * 60_000, maxRetries: 2 });
  return async ({ bytes, mime, titulo }) => {
    const data = bytes.toString("base64");
    const archivo = mime === "application/pdf"
      ? { type: "document" as const, source: { type: "base64" as const, media_type: "application/pdf" as const, data }, title: titulo.slice(0, 200) }
      : { type: "image" as const, source: { type: "base64" as const, media_type: mime as TipoImagen, data } };
    try {
      const mensaje = await client.beta.messages.parse({
        model: MODELO_LECTURA,
        max_tokens: 16000,
        // Si el modelo declina por sus filtros de seguridad, la API intenta con otro modelo en la misma llamada.
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort: "medium", format: zodOutputFormat(respuestaLectura) },
        system: instruccionesLectura(),
        messages: [{ role: "user", content: [archivo, { type: "text", text: `Documento del expediente: «${titulo}». Di qué tipo de documento es y extrae los datos de la lista que aparezcan en él.` }] }],
      });
      if (mensaje.stop_reason === "refusal") throw new ApiError(502, "Este documento no se pudo leer; captura sus datos a mano");
      if (mensaje.stop_reason === "max_tokens") throw new ApiError(502, "La lectura quedó incompleta; inténtalo otra vez");
      const uso = mensaje.usage;
      // Las lecturas en caché se cuentan como entrada completa: el costo anotado nunca queda por debajo del real.
      const entrada = uso.input_tokens + (uso.cache_creation_input_tokens ?? 0) + (uso.cache_read_input_tokens ?? 0);
      return { respuesta: mensaje.parsed_output, uso: { input_tokens: entrada, output_tokens: uso.output_tokens }, modelo: mensaje.model };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) throw new ApiError(503, "La clave del servicio de lectura no es válida; revísala en la configuración del servidor");
      if (error instanceof Anthropic.RateLimitError) throw new ApiError(503, "El servicio de lectura está saturado; inténtalo en unos minutos");
      if (error instanceof Anthropic.BadRequestError) throw new ApiError(502, "No se pudo abrir este archivo; revisa que el PDF o la imagen se vean bien");
      if (error instanceof Anthropic.APIError) throw new ApiError(502, "El servicio de lectura no respondió; inténtalo más tarde");
      throw new ApiError(502, "No se pudo leer el documento; inténtalo más tarde");
    }
  };
}
