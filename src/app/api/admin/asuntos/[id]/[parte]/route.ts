import { z } from "zod";

import { cambiarEnApartado, crearEnApartado, PARTES_APARTADO } from "@/lib/backend/apartados";
import { cambiarEnParte, crearEnParte, idSchema, leerHistorial, leerNotasDelAsunto, PARTES } from "@/lib/backend/asuntos";
import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, ApiError, assertSameOrigin, readJson } from "@/lib/backend/http";

export const runtime = "nodejs";
type Contexto = { params: Promise<{ id: string; parte: string }> };

const TODAS = [...PARTES, ...PARTES_APARTADO] as const;
const esApartado = (p: (typeof TODAS)[number]): p is (typeof PARTES_APARTADO)[number] => (PARTES_APARTADO as readonly string[]).includes(p);

async function partes(contexto: Contexto) {
  const { id, parte } = await contexto.params;
  return { asuntoId: idSchema.parse(id), parte: z.enum(TODAS).parse(parte) };
}

/** Solo el historial se lee por separado (es largo y se pide por páginas); lo demás llega con el asunto. */
export async function GET(request: Request, contexto: Contexto) {
  return apiResponse(async () => {
    const { client } = await requireStaff();
    const { asuntoId, parte } = await partes(contexto);
    if (parte !== "historial") throw new ApiError(404, "No encontrado");
    const busca = new URL(request.url).searchParams;
    const antes = z.coerce.number().int().positive().optional().parse(busca.get("antes") ?? undefined);
    if (busca.get("solo") === "notas") return leerNotasDelAsunto(client, asuntoId);
    return { entradas: await leerHistorial(client, asuntoId, antes) };
  });
}

/** Agrega a una parte del asunto: apartado, fila, persona, tarea, etapa, nota, documento, punto, concepto, cobro, interesado, oferta o liga. */
export async function POST(request: Request, contexto: Contexto) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { user, client } = await requireStaff();
    const { asuntoId, parte } = await partes(contexto);
    const cuerpo = await readJson(request, 65536);
    return {
      resultado: esApartado(parte)
        ? await crearEnApartado(client, user, asuntoId, parte, cuerpo, new URL(request.url).origin)
        : await crearEnParte(client, user, asuntoId, parte, cuerpo),
    };
  }, 201);
}

/** Cambia algo de una parte, con su versión. Quitar oculta o retira; nada se borra. */
export async function PATCH(request: Request, contexto: Contexto) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { user, client } = await requireStaff();
    const { asuntoId, parte } = await partes(contexto);
    const cuerpo = await readJson(request, 65536);
    if (esApartado(parte)) return { ok: true, resultado: await cambiarEnApartado(client, user, asuntoId, parte, cuerpo) };
    await cambiarEnParte(client, user, asuntoId, parte, cuerpo);
    return { ok: true };
  });
}
