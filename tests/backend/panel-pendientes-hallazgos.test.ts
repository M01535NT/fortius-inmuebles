import { createHash } from "node:crypto";
import { beforeEach, expect, it, vi } from "vitest";
const { requireStaff, privileged, pdf } = vi.hoisted(() => ({ requireStaff: vi.fn(), privileged: vi.fn(), pdf: vi.fn() }));
vi.mock("@/lib/backend/auth", () => ({ requireStaff, createServerClient: privileged }));
vi.mock("@/lib/comercial/pdf", () => ({ createComercialPdf: pdf }));
import { POST as emitir } from "@/app/api/admin/comercial/[id]/emitir/route";
import { PUT as guardarRegistro } from "@/app/api/admin/collections/[collection]/[id]/route";
import { emptyComercialBook, newOpportunity } from "@/lib/comercial/types";

const bookId = "61000000-0000-4000-8000-000000000067";
const adminId = "10000000-0000-4000-8000-000000000067";
beforeEach(() => { vi.clearAllMocks(); });

/*
  BUG-C67: la cartera guardada antes del cambio de tipos (tipo «Nave industrial») no se puede emitir.
  emitir/route.ts:12 normaliza la revisión con comercialDataSchema.parse (LEGACY_PROPERTY_TYPES la
  cambia a «Nave o bodega») y guarda esa versión normalizada en snapshot.data (línea 15). El disparador
  fortius_inmuebles_comercial_emission_guard (migración 20261005000752, línea 79) exige
  r.data = snapshot->'data' y responde PT409 «Instantánea distinta»; databaseError lo convierte en
  «El registro cambió…, recarga» y recargar trae la misma cartera: no hay salida.
  Aquí el cliente privilegiado reproduce esa misma comparación del disparador.
*/
it("emite una cartera guardada con un tipo de inmueble anterior", async () => {
  const data = emptyComercialBook();
  const vieja = newOpportunity("I1", "Inmueble");
  data.oportunidades = [{ ...vieja, nombre: "Nave de ensayo", tipo: "Nave industrial" as never }];
  const revision = { nombre: "Cartera de ensayo", version: 3, data: JSON.parse(JSON.stringify(data)) };
  const lectura = { select: () => lectura, eq: () => lectura, maybeSingle: async () => ({ data: revision, error: null }) };
  requireStaff.mockResolvedValue({ user: { id: adminId, role: "admin" }, client: { from: () => lectura } });
  const bytes = Buffer.from("%PDF ensayo");
  pdf.mockResolvedValue({ bytes, sha256: createHash("sha256").update(bytes).digest("hex"), result: { corte: "2026-11-13" } });
  const storage = { upload: vi.fn(async () => ({ error: null })), remove: vi.fn(async () => ({ error: null })) };
  let fila: { snapshot: { nombre: string; data: unknown } } | undefined;
  const escritura = {
    insert: (row: typeof fila) => { fila = row; return escritura; },
    select: () => escritura,
    // Misma regla que el disparador de la base: la instantánea debe ser idéntica a la revisión guardada.
    single: async () => JSON.stringify(fila!.snapshot.data) === JSON.stringify(revision.data) && fila!.snapshot.nombre === revision.nombre
      ? { data: { id: "e1", book_version: 3, sha256: "a".repeat(64), created_at: "2026-11-13T12:00:00Z" }, error: null }
      : { data: null, error: { code: "PT409", message: "Instantánea distinta" } },
  };
  privileged.mockReturnValue({ from: () => escritura, storage: { from: () => storage } });
  const response = await emitir(new Request(`https://panel.test/api/admin/comercial/${bookId}/emitir`, { method: "POST", headers: { origin: "https://panel.test", "content-type": "application/json" }, body: JSON.stringify({ version: 3 }) }), { params: Promise.resolve({ id: bookId }) });
  const body = await response.json();
  expect(body.error ?? null, "la emisión se rechaza por instantánea distinta").toBeNull();
  expect(response.status).toBe(201);
});

/*
  BUG-C68 (servidor): una entrada nueva con una dirección (slug) que ya usa otra entrada choca con el
  índice único fortius_inmuebles_post_slug_unique; put_record lo convierte en PT409 «El registro ya
  existe» y databaseError (src/lib/backend/http.ts:100) lo reescribe como «El registro cambió o tiene
  referencias; recarga antes de continuar». El asesor no sabe que debe cambiar la dirección.
*/
it("una dirección de blog repetida responde que la dirección ya existe, no un conflicto de versión", async () => {
  const rpc = vi.fn(async () => ({ data: null, error: { code: "PT409", message: "El registro ya existe" } }));
  requireStaff.mockResolvedValue({ user: { id: adminId, role: "admin" }, client: { rpc } });
  const post = { id: "post-nuevo", slug: "guia-existente", titulo: "Entrada de ensayo", resumen: "Resumen", contenido: "Contenido", estado: "borrador", actualizadoEl: "2026-11-13T12:00:00.000Z" };
  const response = await guardarRegistro(new Request("https://panel.test/api/admin/collections/posts/post-nuevo", { method: "PUT", headers: { origin: "https://panel.test", "content-type": "application/json" }, body: JSON.stringify({ data: post, version: null }) }), { params: Promise.resolve({ collection: "posts", id: "post-nuevo" }) });
  const { error } = await response.json();
  expect(rpc).toHaveBeenCalled();
  expect(error).not.toMatch(/El registro cambió/);
  expect(error).toMatch(/direcci[oó]n/i);
});
