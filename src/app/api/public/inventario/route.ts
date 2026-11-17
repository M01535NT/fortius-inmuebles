import { getPropiedades } from "@/lib/inventario";
import { filtrosDesdeParams, MAXIMO_POR_PETICION, parteDe, POR_PARTE } from "@/lib/inventario-busqueda";

export const runtime = "nodejs";

/*
  Inventario por partes (etapa 2, 17/11/2026): «Cargar más» y cada cambio de filtro piden aquí la
  siguiente parte, para no mandar cientos de inmuebles al navegador. Solo sale lo publicado
  (la misma proyección pública que ya muestra el sitio). `slugs` trae inmuebles concretos para
  la comparación guardada en la visita.
*/
export async function GET(request: Request) {
  const url = new URL(request.url);
  const p = url.searchParams;
  try {
    const todas = await getPropiedades();
    const slugs = p.get("slugs");
    if (slugs !== null) {
      const pedidos = slugs.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 3);
      return Response.json({ propiedades: todas.filter((propiedad) => pedidos.includes(propiedad.slug)) }, { headers: { "Cache-Control": "no-store" } });
    }
    const desde = Number.parseInt(p.get("desde") ?? "0", 10);
    const cuantos = Number.parseInt(p.get("cuantos") ?? String(POR_PARTE), 10);
    const parte = parteDe(
      todas,
      filtrosDesdeParams(p),
      Number.isFinite(desde) ? desde : 0,
      Number.isFinite(cuantos) ? Math.min(cuantos, MAXIMO_POR_PETICION) : POR_PARTE,
    );
    return Response.json(parte, { headers: { "Cache-Control": "no-store" } });
  } catch {
    console.error("[inventario] No se pudo leer el inventario público.");
    return Response.json({ error: "El inventario no está disponible en este momento." }, { status: 503 });
  }
}
