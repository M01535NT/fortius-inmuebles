// Read-only local fixture for the real Next.js public routes. Never contacts Supabase.
import { createServer } from "node:http";
import { propiedades } from "../../../../src/data/propiedades.ts";
import { asesores } from "../../../../src/data/asesores.ts";

const port = Number(process.env.FORTIUS_INMUEBLES_FIXTURE_PORT || 3101);
const data = {
  propiedades: propiedades.map((property) => ({ ...property, publicada: true, demo: true })),
  asesores,
  contenido: [{ heroTitulo: "Vende con plan, no con anuncios.", heroSubtitulo: "", manifiestoTitulo: "No nos limitamos a tomar fotos. Creamos un proceso.", manifiestoTexto: "", seoTitle: "", seoDescription: "" }],
  config: [{ nombreComercial: "Mint Inmuebles", telefono: "", whatsapp: "", email: "", horario: "", facebook: "", instagram: "", videoInstitucionalUrl: "" }],
  posts: [
    ["cuanto-vale-mi-casa-tijuana", "Cuánto vale mi casa en Tijuana", "mercado"],
    ["documentos-vender-propiedad-baja-california", "Documentos para vender una propiedad en Baja California", "tramites"],
    ["propiedad-no-se-vende-que-revisar", "Tu propiedad no se vende: qué revisar", "vender"],
    ["comprar-casa-tijuana-ingresos-estados-unidos", "Comprar casa con ingresos de Estados Unidos", "comprar"],
    ["gastos-comprar-casa-tijuana", "Gastos al comprar casa en Tijuana", "comprar"],
    ["que-revisar-antes-apartar-propiedad", "Qué revisar antes de apartar una propiedad", "comprar"],
    ["preparar-casa-para-vender", "Preparar tu casa para vender", "vender"],
    ["comprar-o-rentar-tijuana", "Comprar o rentar en Tijuana", "comprar"],
    ["que-revisar-comprar-terreno", "Qué revisar antes de comprar un terreno", "comprar"],
    ["como-elegir-local-comercial", "Cómo elegir un local comercial", "rentar"],
    ["rentar-propiedad-seleccion-inquilino-entrega", "Rentar una propiedad: selección y entrega", "rentar"],
    ["que-debe-hacer-inmobiliaria-vender", "Qué debe hacer una inmobiliaria para vender", "vender"],
  ].map(([slug, titulo, categoria], i) => ({ id: `guide-${i}`, slug, titulo, categoria, resumen: "Una guía para revisar tus opciones, entender los documentos y tomar decisiones con información sobre el mercado local.", contenido: "## Antes de decidir\n\nCompara la información disponible y revisa los documentos del inmueble.", estado: "publicado", formato: "guia", destacado: i === 0, publicadoEl: `2026-09-${String(20-i).padStart(2, '0')}T18:00:00Z`, actualizadoEl: "2026-09-23T18:00:00Z" })).concat([
    { id: "news-credit", slug: "credito-local-prueba", titulo: "Crédito y vivienda: claves para leer los nuevos datos", resumen: "Contenido de prueba local para verificar búsqueda y filtros de actualidad.", contenido: "## El dato\n\nEsta es una noticia de prueba, no una publicación real.", estado: "publicado", formato: "actualidad", categoria: "mercado", publicadoEl: "2026-09-23T18:00:00Z", actualizadoEl: "2026-09-23T18:00:00Z", fuenteNombre: "Fuente de prueba", fuenteUrl: "https://example.com/informe", autor: "Redacción de prueba", ambito: "Tijuana" },
  ]),
};

createServer(async (request, response) => {
  const url = new URL(request.url, `http://127.0.0.1:${port}`);
  if (request.method === "GET" && url.pathname === "/health") return response.end("ok");
  if (request.method === "GET" && url.pathname === "/rest/v1/fortius_inmuebles_records" && url.searchParams.get("collection") === "eq.asesores") {
    response.setHeader("Content-Type", "application/json"); return response.end("[]");
  }
  if (request.method !== "POST" || url.pathname !== "/rest/v1/rpc/fortius_inmuebles_public_records") {
    response.writeHead(404); return response.end();
  }
  let body = "";
  for await (const chunk of request) body += chunk;
  try {
    const { p_collection } = JSON.parse(body);
    const offset = Number(url.searchParams.get("offset") || 0);
    const limit = Number(url.searchParams.get("limit") || 500);
    const records = (data[p_collection] ?? []).slice(offset, offset + limit);
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify(records.map((data) => ({ data }))));
  } catch { response.writeHead(400); response.end(); }
}).listen(port, "127.0.0.1");
