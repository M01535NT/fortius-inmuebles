import { crearConsulta, listarAbiertas, nuevaConsultaSchema } from "@/lib/backend/consultas";
import { requireStaff } from "@/lib/backend/auth";
import { apiResponse, assertSameOrigin, readJson } from "@/lib/backend/http";

export const runtime = "nodejs";

/** Las consultas sin terminar de quien entró (si se cortó la llamada, se retoman de aquí). */
export async function GET() {
  return apiResponse(async () => {
    const { user, client } = await requireStaff();
    return { consultas: await listarAbiertas(client, user) };
  });
}

/** Empieza una consulta. Se crea al escribir lo primero; después se guarda sola. */
export async function POST(request: Request) {
  return apiResponse(async () => {
    assertSameOrigin(request);
    const { user, client } = await requireStaff();
    return { consulta: await crearConsulta(client, user, nuevaConsultaSchema.parse(await readJson(request, 2048))) };
  }, 201);
}
