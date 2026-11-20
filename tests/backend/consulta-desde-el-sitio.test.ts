import { describe, expect, it, vi } from "vitest";

// Las listas del panel no se leen de la base en estas pruebas: se usan las de inicio.
vi.mock("@/lib/backend/catalogos", async (original) => {
  const real = await original<typeof import("@/lib/backend/catalogos")>();
  const { MAPA_INICIAL } = await import("@/lib/backend/catalogos-iniciales");
  return { ...real, mapaCatalogos: vi.fn(async () => MAPA_INICIAL) };
});

import type { StaffUser } from "@/lib/backend/contracts";
import { crearConsulta, desdeElSitio, nuevaConsultaSchema } from "@/lib/backend/consultas";

const PERSONA = "22222222-2222-4222-8222-222222222222";
const OTRA = "33333333-3333-4333-8333-333333333333";
const asesor: StaffUser = { id: "a1", email: "asesor@ejemplo.test", role: "editor" };
const tipos = (t: string) => ({ casa: "casa", "nave-industrial": "nave_bodega" } as Record<string, string>)[t] ?? null;

describe("la consulta nueva desde una consulta del sitio", () => {
  it("trae el mensaje, el inmueble por el que preguntó, el canal sitio y lo que se sabe", () => {
    const r = desdeElSitio(
      { nombre: " Persona de ejemplo ", mensaje: " Quiero vender mi casa ", zona: "Chapultepec", tipoPropiedad: "casa", perfil: { operacion: "vender" } },
      "Casa de ejemplo · F-12", tipos,
    );
    expect(r).toEqual({
      canal: "sitio", quien_nombre: "Persona de ejemplo",
      que_pasa: "Del sitio: Quiero vender mi casa\nPreguntó por: Casa de ejemplo · F-12",
      datos: { que_quiere: "vender", tipo: "casa", colonia: "Chapultepec" },
    });
  });
  it("traduce el tipo del sitio a la lista del panel y deja fuera el que no se ofrece", () => {
    expect(desdeElSitio({ tipoPropiedad: "nave-industrial" }, null, tipos).datos).toEqual({ tipo: "nave_bodega" });
    expect(desdeElSitio({ tipoPropiedad: "castillo" }, null, tipos).datos).toEqual({});
  });
  it("sin mensaje dice que llegó por el sitio y no adivina qué quiere", () => {
    const r = desdeElSitio({ mensaje: "", perfil: { operacion: "rentar" } }, null, tipos);
    expect(r.que_pasa).toBe("Llegó por el sitio.");
    expect(r.datos).toEqual({});
    expect(desdeElSitio({ perfil: { operacion: "arrendar" } }, null, tipos).datos).toEqual({ que_quiere: "rentar" });
  });
  it("ignora lo que no es texto", () => {
    const r = desdeElSitio({ mensaje: 5, zona: ["x"], tipoPropiedad: {}, nombre: null, perfil: null }, null, tipos);
    expect(r).toEqual({ canal: "sitio", quien_nombre: "", que_pasa: "Llegó por el sitio.", datos: {} });
  });
  it("el pedido acepta desde_lead con un id del sitio y rechaza otro formato", () => {
    expect(nuevaConsultaSchema.parse({ desde_lead: "lead_123-abc" })).toEqual({ desde_lead: "lead_123-abc" });
    expect(nuevaConsultaSchema.safeParse({ desde_lead: "../otro" }).success).toBe(false);
    expect(nuevaConsultaSchema.safeParse({ desde_lead: "" }).success).toBe(false);
  });
});

type Respuesta = { data: unknown; error: unknown };
/**
 * Cliente de prueba: cada tabla responde lo suyo al leer («tabla») y al insertar («tabla:insert»); una lista responde
 * en orden, una vez cada una. Se guarda lo que se insertó.
 */
function cliente(respuestas: Record<string, Respuesta | Respuesta[]>) {
  const insertados: { tabla: string; fila: unknown }[] = [];
  const vacia: Respuesta = { data: null, error: null };
  const tomar = (clave: string): Respuesta => {
    const r = respuestas[clave];
    return Array.isArray(r) ? (r.shift() ?? vacia) : (r ?? vacia);
  };
  const from = (tabla: string) => {
    const cadena: Record<string, unknown> = {};
    let inserta = false;
    for (const m of ["select", "eq", "is", "order", "limit"]) cadena[m] = () => cadena;
    cadena.insert = (fila: unknown) => { inserta = true; insertados.push({ tabla, fila }); return cadena; };
    const responder = async () => tomar(inserta ? `${tabla}:insert` : tabla);
    cadena.maybeSingle = responder;
    cadena.single = responder;
    return cadena;
  };
  return { db: { from } as never, insertados };
}

const lead = (data: Record<string, unknown>): Respuesta => ({ data: { data }, error: null });
const nueva = { "fortius_inmuebles_consultas:insert": { data: { id: "c1", version: 1 }, error: null } };

describe("crear la consulta desde el sitio", () => {
  it("usa la persona ligada y pasa el mensaje, el canal y el inmueble", async () => {
    const { db, insertados } = cliente({
      fortius_inmuebles_records: lead({ nombre: "Del sitio", mensaje: "Me interesa", propiedadSlug: "casa-ejemplo", tipoPropiedad: "plaza", personaId: PERSONA }),
      fortius_inmuebles_inmuebles: { data: { nombre: "Casa de ejemplo", folio: "F-9" }, error: null },
      fortius_inmuebles_personas: { data: { nombre: "Persona de ejemplo", telefonos: [{ pais: "+52", numero: "6640000000" }], correo: null }, error: null },
      ...nueva,
    });
    await expect(crearConsulta(db, asesor, { desde_lead: "lead1" })).resolves.toEqual({ id: "c1", version: 1 });
    expect(insertados).toHaveLength(1);
    expect(insertados[0].fila).toMatchObject({
      quien_nombre: "Persona de ejemplo", canal: "sitio", persona_id: PERSONA,
      quien_telefonos: [{ pais: "+52", numero: "6640000000" }],
      que_pasa: "Del sitio: Me interesa\nPreguntó por: Casa de ejemplo · F-9",
      datos: { tipo: "plaza_conjunto" }, responsable_id: "a1", creado_por: "a1",
    });
  });
  it("si no ve el inmueble, anota su dirección en el sitio; sin ficha, el nombre que dejó", async () => {
    const { db, insertados } = cliente({
      fortius_inmuebles_records: lead({ nombre: "Del sitio", propiedadSlug: "casa-ejemplo" }),
      ...nueva,
    });
    await crearConsulta(db, asesor, { desde_lead: "lead1" });
    expect(insertados[0].fila).toMatchObject({ quien_nombre: "Del sitio", persona_id: null, que_pasa: "Llegó por el sitio.\nPreguntó por: /inmuebles/casa-ejemplo" });
  });
  it("la consulta del sitio que no existe o no le toca responde 404", async () => {
    const { db, insertados } = cliente({});
    await expect(crearConsulta(db, asesor, { desde_lead: "lead1" })).rejects.toMatchObject({ status: 404 });
    expect(insertados).toHaveLength(0);
  });
  it("si ya está ligada a otra persona responde 409 y no crea nada", async () => {
    const { db, insertados } = cliente({ fortius_inmuebles_records: lead({ personaId: PERSONA }), ...nueva });
    await expect(crearConsulta(db, asesor, { desde_lead: "lead1", persona_id: OTRA })).rejects.toMatchObject({ status: 409 });
    expect(insertados).toHaveLength(0);
  });
  it("el canal que se pida manda sobre el del sitio", async () => {
    const { db, insertados } = cliente({ fortius_inmuebles_records: lead({}), ...nueva });
    await crearConsulta(db, asesor, { desde_lead: "lead1", canal: "whatsapp" });
    expect(insertados[0].fila).toMatchObject({ canal: "whatsapp", desde_lead: "lead1" });
  });
  it("dos clics dan la misma: si ya hay una abierta de ese mensaje, se devuelve sin crear otra", async () => {
    const { db, insertados } = cliente({
      fortius_inmuebles_records: lead({}),
      fortius_inmuebles_consultas: { data: { id: "c0", version: 3 }, error: null },
      ...nueva,
    });
    await expect(crearConsulta(db, asesor, { desde_lead: "lead1" })).resolves.toEqual({ id: "c0", version: 3 });
    expect(insertados).toHaveLength(0);
  });
  it("si otro clic la abrió justo antes, devuelve esa; si no la ve, responde 409", async () => {
    const choque = { data: null, error: { code: "23505", message: "duplicate key" } };
    const primero = cliente({
      fortius_inmuebles_records: lead({}),
      fortius_inmuebles_consultas: [{ data: null, error: null }, { data: { id: "c0", version: 1 }, error: null }],
      "fortius_inmuebles_consultas:insert": choque,
    });
    await expect(crearConsulta(primero.db, asesor, { desde_lead: "lead1" })).resolves.toEqual({ id: "c0", version: 1 });
    const segundo = cliente({ fortius_inmuebles_records: lead({}), "fortius_inmuebles_consultas:insert": choque });
    await expect(crearConsulta(segundo.db, asesor, { desde_lead: "lead1" })).rejects.toMatchObject({ status: 409 });
  });
});
