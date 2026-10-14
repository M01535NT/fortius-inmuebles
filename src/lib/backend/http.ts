import { randomUUID } from "node:crypto";
import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}

// Next.js rewrites 127.0.0.1 (and the rest of 127.0.0.0/8) to localhost on request.url.
// The browser Origin header keeps the address that was opened, so a literal comparison
// rejects the local panel at http://127.0.0.1:3001.
function isLoopbackHostname(hostname: string): boolean {
  if (hostname === "localhost" || hostname === "::1" || hostname === "[::1]") return true;
  const parts = hostname.split(".");
  return parts.length === 4 && parts[0] === "127" && parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
}

function comparableOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    const hostname = isLoopbackHostname(url.hostname) ? "localhost" : url.hostname;
    return `${url.protocol}//${hostname}${url.port ? `:${url.port}` : ""}`;
  } catch {
    return null;
  }
}

export function assertSameOrigin(request: Request): void {
  const presented = request.headers.get("origin");
  const received = comparableOrigin(request.url);
  if (!presented || !received || comparableOrigin(presented) !== received) {
    throw new ApiError(403, "Origen de solicitud no permitido");
  }
}

export async function readBody(request: Request, maxBytes: number): Promise<Uint8Array> {
  const declared = Number(request.headers.get("content-length"));
  if (declared > maxBytes) throw new ApiError(413, "Solicitud demasiado grande");
  if (!request.body) throw new ApiError(400, "Cuerpo requerido");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) { await reader.cancel(); throw new ApiError(413, "Solicitud demasiado grande"); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  return body;
}

export async function readJson(request: Request, maxBytes = 262144): Promise<unknown> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new ApiError(415, "Se requiere JSON");
  const bytes = await readBody(request, maxBytes);
  try { return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
  catch { throw new ApiError(400, "JSON inválido"); }
}

export async function apiResponse(action: () => Promise<unknown>, successStatus = 200): Promise<Response> {
  const requestId = randomUUID();
  const startedAt = Date.now();
  const headers = { "X-Request-Id": requestId, "Cache-Control": "private, no-store, max-age=0", "Vary": "Cookie", "X-Content-Type-Options": "nosniff" };
  try { return Response.json(await action(), { status: successStatus, headers }); }
  catch (error) {
    const status = error instanceof ApiError ? error.status : error instanceof ZodError ? 400 : 500;
    const message = error instanceof ApiError ? error.message : status === 400 ? "Datos inválidos; revisa los campos" : "No se pudo completar la operación";
    if (status >= 500) console.error(JSON.stringify({ event: "api_failure", requestId, status, category: error instanceof ApiError ? "dependency" : "unexpected", durationMs: Date.now() - startedAt }));
    return Response.json({ error: message, requestId }, { status, headers: { ...headers, ...(status === 429 ? { "Retry-After": "60" } : {}) } });
  }
}

export function databaseError(error: { code?: string; message?: string }): never {
  const status = /^PT(400|401|403|409|429)$/.test(error.code ?? "") ? Number(error.code!.slice(2))
    : error.code === "42501" ? 403 : ["23503", "23001", "23505"].includes(error.code ?? "") ? 409 : 503;
  // SQL messages are bounded application messages; never expose arbitrary DB errors.
  const message = status === 409 ? "El registro cambió o tiene referencias; recarga antes de continuar"
    : status === 400 ? "Registro o referencia inválidos" : status === 401 ? "Sesión requerida"
    : status === 403 ? "Acceso no autorizado" : status === 429 ? "Demasiadas solicitudes; inténtalo más tarde" : "Servicio temporalmente no disponible";
  throw new ApiError(status, message);
}
