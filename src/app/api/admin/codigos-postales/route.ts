import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { requireStaff } from "@/lib/backend/auth";
import { apiResponse } from "@/lib/backend/http";
import { coloniasDe, type CatalogoCp } from "@/lib/formatos/deducir";

export const runtime = "nodejs";

/*
  Colonias de un código postal de Baja California (CSR-03). El catálogo lo genera
  `node tools/sepomex-bc.mjs` desde la fuente oficial y no se versiona; si no está, la
  consulta lo dice y la captura sigue a mano.
*/
let cache: Promise<CatalogoCp | null> | undefined;
function catalogo() {
  cache ??= readFile(path.join(process.cwd(), "src", "data", "codigos-postales-bc.json"), "utf8").then(texto => JSON.parse(texto) as CatalogoCp).catch(() => null);
  return cache;
}

export async function GET(request: Request) {
  return apiResponse(async () => {
    await requireStaff();
    const cp = z.string().regex(/^\d{5}$/).parse(new URL(request.url).searchParams.get("cp") ?? "");
    const datos = await catalogo();
    return { catalogo: datos !== null, colonias: coloniasDe(datos, cp) };
  });
}
