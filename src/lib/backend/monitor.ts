/*
  OBS-01 / DEC-19 (titular, 13/11/2026: Sentry gratuito). Aviso de fallas del servidor sin paquete
  nuevo: se manda a Sentry un evento mínimo por su API de «envelopes». Solo viaja la clase de falla,
  el estado, la ruta como plantilla (`/api/apps/shared/[token]`, nunca la URL real), el método, el
  número de rastreo y la versión publicada. Nunca el mensaje del error, la pila, el cuerpo, cabeceras,
  cookies, correos ni datos de clientes: un mensaje de la base puede traer valores capturados.
  Sin `FORTIUS_SENTRY_DSN` (solo servidor) no se manda nada. Una falla del aviso nunca cambia la
  respuesta al usuario.
*/

export type Failure = {
  kind: "api_failure" | "server_error";
  category: string;
  status?: number;
  requestId?: string;
  route?: string;
  routeType?: string;
  method?: string;
  digest?: string;
};

const TIMEOUT_MS = 1500;

/** El DSN de Sentry: `https://<clave pública>@<host>/<proyecto>`. */
export function parseDsn(dsn: string): { endpoint: string; key: string } | null {
  try {
    const url = new URL(dsn);
    const project = url.pathname.replace(/^\/+|\/+$/g, "");
    if (url.protocol !== "https:" || !/^[a-f0-9]{16,64}$/i.test(url.username) || !/^\d+$/.test(project)) return null;
    return { endpoint: `https://${url.host}/api/${project}/envelope/`, key: url.username };
  } catch { return null; }
}

/** Etiquetas cortas y con caracteres de ruta; lo demás se cambia por «_». */
export function safeLabel(value: string, max = 120): string {
  return value.replace(/[^A-Za-z0-9_./[\]()@:-]/g, "_").slice(0, max);
}

export async function reportFailure(failure: Failure, env: Record<string, string | undefined> = process.env, send: typeof fetch = fetch): Promise<boolean> {
  const target = parseDsn(env.FORTIUS_SENTRY_DSN?.trim() ?? "");
  if (!target) return false;
  const eventId = crypto.randomUUID().replaceAll("-", "");
  const { kind, category, status, route } = failure;
  const tags = Object.fromEntries(Object.entries(failure).filter(([, value]) => value !== undefined).map(([key, value]) => [key, safeLabel(String(value))]));
  const event = {
    event_id: eventId, timestamp: Date.now() / 1000, platform: "node", level: "error", logger: "fortius",
    environment: safeLabel(env.VERCEL_ENV ?? "development"),
    release: env.VERCEL_GIT_COMMIT_SHA ? safeLabel(env.VERCEL_GIT_COMMIT_SHA.slice(0, 12)) : undefined,
    message: { formatted: [kind, category, status, route].filter(value => value !== undefined).map(value => safeLabel(String(value))).join(" ") },
    tags,
    fingerprint: [kind, safeLabel(category), safeLabel(route ?? ""), String(status ?? "")],
  };
  const body = [JSON.stringify({ event_id: eventId, sent_at: new Date().toISOString() }), JSON.stringify({ type: "event" }), JSON.stringify(event)].join("\n");
  try {
    const response = await send(target.endpoint, {
      method: "POST", body, signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "content-type": "application/x-sentry-envelope", "x-sentry-auth": `Sentry sentry_version=7, sentry_key=${target.key}, sentry_client=fortius-monitor/1.0` },
    });
    return response.ok;
  } catch { return false; }
}
