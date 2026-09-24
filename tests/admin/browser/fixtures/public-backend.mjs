// Read-only local fixture for the real Next.js public routes. Never contacts Supabase.
import { createServer } from "node:http";
import { propiedades } from "../../../../src/data/propiedades.ts";
import { asesores } from "../../../../src/data/asesores.ts";

const port = Number(process.env.MNT_FIXTURE_PORT || 3101);
const data = {
  propiedades: propiedades.map((property) => ({ ...property, publicada: true, demo: true })),
  asesores,
  contenido: [{ heroTitulo: "Vende con plan, no con anuncios.", heroSubtitulo: "", manifiestoTitulo: "No nos limitamos a tomar fotos. Creamos un proceso.", manifiestoTexto: "", seoTitle: "", seoDescription: "" }],
  config: [{ nombreComercial: "MNT Inmuebles", telefono: "", whatsapp: "", email: "", horario: "", facebook: "", instagram: "", videoInstitucionalUrl: "" }],
  posts: [],
};

createServer(async (request, response) => {
  if (request.method === "GET" && request.url === "/health") return response.end("ok");
  if (request.method !== "POST" || request.url !== "/rest/v1/rpc/mnt_public_records") {
    response.writeHead(404); return response.end();
  }
  let body = "";
  for await (const chunk of request) body += chunk;
  try {
    const { p_collection } = JSON.parse(body);
    const records = data[p_collection] ?? [];
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify(records.map((data) => ({ data }))));
  } catch { response.writeHead(400); response.end(); }
}).listen(port, "127.0.0.1");
