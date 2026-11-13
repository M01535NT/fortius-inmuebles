import type { Instrumentation } from "next";
import { reportFailure } from "@/lib/backend/monitor";

/*
  OBS-01: fallas del servidor que nadie atrapó (páginas, rutas, acciones y proxy) llegan a Sentry
  con la ruta como plantilla (`context.routePath`), nunca la URL real ni el mensaje del error.
  Las fallas controladas de la API las avisa `apiResponse` con su número de rastreo.
*/
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  const digest = typeof error === "object" && error !== null && "digest" in error ? String(error.digest) : undefined;
  await reportFailure({
    kind: "server_error",
    category: error instanceof Error ? error.name : "unknown",
    route: context.routePath,
    routeType: context.routeType,
    method: request.method,
    digest,
  });
};
