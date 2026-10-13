import { beforeEach, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/backend/http";

const { requireStaff } = vi.hoisted(() => ({ requireStaff: vi.fn() }));
vi.mock("@/lib/backend/auth", () => ({ requireStaff }));
import { GET, POST } from "@/app/api/admin/expedientes/route";

beforeEach(() => { requireStaff.mockReset(); });

it("deniega la lista sin sesión", async () => {
  requireStaff.mockRejectedValue(new ApiError(401, "Inicia sesión"));
  const response = await GET();
  expect(response.status).toBe(401);
});

it("rechaza un expediente con cliente inválido antes de escribir", async () => {
  requireStaff.mockResolvedValue({ client: {}, user: { id: "u", role: "admin" } });
  const request = new Request("https://panel.test/api/admin/expedientes", {
    method: "POST", headers: { origin: "https://panel.test", "content-type": "application/json" },
    body: JSON.stringify({ clienteId: "../otro", asesorId: "a1", folio: "E1", operacion: "venta" }),
  });
  const response = await POST(request);
  expect(response.status).toBe(400);
});

it("pagina de forma estable y anuncia la siguiente página sin omitir el límite REST", async () => {
  const range=vi.fn().mockResolvedValue({data:[{id:"b"},{id:"a"}],count:5,error:null});
  const query={select:vi.fn(),is:vi.fn(),not:vi.fn(),order:vi.fn(),range};
  for(const method of [query.select,query.is,query.not,query.order])method.mockReturnValue(query);
  requireStaff.mockResolvedValue({client:{from:()=>query}});
  const response=await GET(new Request("https://panel.test/api/admin/expedientes?offset=2&limit=2"));
  expect(response.status).toBe(200);
  expect(range).toHaveBeenCalledWith(2,3);
  expect(query.order).toHaveBeenCalledWith("id",{ascending:false});
  expect(await response.json()).toMatchObject({expedientes:[{id:"b"},{id:"a"}],nextOffset:4});
});

it("preserva consumidores antiguos reuniendo páginas, sin truncar silenciosamente",async()=>{
 const range=vi.fn().mockResolvedValueOnce({data:[{id:"a"}],count:2,error:null}).mockResolvedValueOnce({data:[{id:"b"}],count:2,error:null});
 const query={select:vi.fn(),is:vi.fn(),not:vi.fn(),order:vi.fn(),range};
 for(const method of [query.select,query.is,query.not,query.order])method.mockReturnValue(query);
 requireStaff.mockResolvedValue({client:{from:()=>query}});
 const response=await GET();
 expect(await response.json()).toMatchObject({expedientes:[{id:"a"},{id:"b"}]});
 expect(range).toHaveBeenCalledTimes(2);
});

it("rechaza límites inválidos y no devuelve éxito ante una página vacía incoherente",async()=>{
 const range=vi.fn().mockResolvedValue({data:[],count:1,error:null});
 const query={select:vi.fn(),is:vi.fn(),not:vi.fn(),order:vi.fn(),range};
 for(const method of [query.select,query.is,query.not,query.order])method.mockReturnValue(query);
 requireStaff.mockResolvedValue({client:{from:()=>query}});
 expect((await GET(new Request("https://panel.test/api/admin/expedientes?limit=10000"))).status).toBe(400);
 expect(range).not.toHaveBeenCalled();
 expect((await GET(new Request("https://panel.test/api/admin/expedientes?limit=100"))).status).toBe(409);
});
