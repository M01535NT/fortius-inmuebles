import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/* Proveedor de lectura Grok (xAI), 31/10/2026: la clave vive en el servidor; solo lee imágenes; la respuesta se exige con esquema fijo. */
vi.mock("server-only", () => ({}));

const ENV = { ...process.env };
beforeEach(() => { process.env = { ...ENV, XAI_API_KEY: "clave-de-prueba" }; delete process.env.ANTHROPIC_API_KEY; delete process.env.IA_PROVEEDOR; vi.resetModules(); });
afterEach(() => { process.env = ENV; });

const respuestaOk = (contenido: unknown, extra: Record<string, unknown> = {}) => Response.json({ model: "grok-4.7", choices: [{ message: { content: JSON.stringify(contenido) }, finish_reason: "stop" }], usage: { prompt_tokens: 1200, completion_tokens: 300 }, ...extra });

describe("extractorGrok", () => {
  it("manda la imagen como data URL con el esquema fijo y devuelve la respuesta con su uso", async () => {
    const { extractorGrok } = await import("@/lib/ia/grok");
    const llamadas: { url: string; init: RequestInit }[] = [];
    const fetchFn = vi.fn(async (url: string | URL | Request, init?: RequestInit) => { llamadas.push({ url: String(url), init: init! }); return respuestaOk({ tipoDocumento: "curp", datos: [{ clave: "propietarioCurp", valor: "RAMM800512MBCRRR09", pagina: 1, cita: "CURP RAMM800512MBCRRR09" }] }); }) as unknown as typeof fetch;
    const r = await extractorGrok(fetchFn)({ bytes: Buffer.from("imagen"), mime: "image/jpeg", titulo: "CURP del propietario" });
    expect(llamadas[0].url).toBe("https://api.x.ai/v1/chat/completions");
    expect((llamadas[0].init.headers as Record<string, string>).Authorization).toBe("Bearer clave-de-prueba");
    const cuerpo = JSON.parse(String(llamadas[0].init.body));
    expect(cuerpo.model).toBe("grok-4.7");
    expect(cuerpo.messages[1].content[0].image_url.url).toBe(`data:image/jpeg;base64,${Buffer.from("imagen").toString("base64")}`);
    expect(cuerpo.response_format).toMatchObject({ type: "json_schema", json_schema: { name: "lectura_documento", strict: true } });
    expect(cuerpo.response_format.json_schema.schema.properties).toHaveProperty("datos");
    expect(r.modelo).toBe("grok-4.7");
    expect(r.uso).toEqual({ input_tokens: 1200, output_tokens: 300 });
    expect(r.respuesta).toMatchObject({ tipoDocumento: "curp" });
  });

  it("un PDF entra como sus páginas dibujadas por el panel; sin ellas, avisa", async () => {
    const { extractorGrok } = await import("@/lib/ia/grok");
    const sinPaginas = vi.fn() as unknown as typeof fetch;
    await expect(extractorGrok(sinPaginas)({ bytes: Buffer.from("%PDF"), mime: "application/pdf", titulo: "Escritura" })).rejects.toThrow(/por páginas desde el panel/);
    expect(sinPaginas).not.toHaveBeenCalled();
    const llamadas: RequestInit[] = [];
    const conPaginas = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => { llamadas.push(init!); return respuestaOk({ tipoDocumento: "escritura", datos: [] }); }) as unknown as typeof fetch;
    await extractorGrok(conPaginas)({ bytes: Buffer.from("%PDF"), mime: "application/pdf", titulo: "Escritura", paginas: [{ bytes: Buffer.from("p1"), mime: "image/jpeg" }, { bytes: Buffer.from("p2"), mime: "image/jpeg" }] });
    const contenido = JSON.parse(String(llamadas[0].body)).messages[1].content;
    expect(contenido.filter((parte: { type: string }) => parte.type === "image_url")).toHaveLength(2);
    expect(contenido.at(-1).text).toContain("2 páginas");
  });

  it("traduce los errores del servicio a mensajes del panel sin exponer la clave", async () => {
    const { extractorGrok } = await import("@/lib/ia/grok");
    const entrada = { bytes: Buffer.from("x"), mime: "image/png", titulo: "INE" };
    const con = (status: number) => (async () => new Response("{}", { status })) as unknown as typeof fetch;
    await expect(extractorGrok(con(401))(entrada)).rejects.toMatchObject({ status: 503, message: expect.stringMatching(/clave del servicio/) });
    await expect(extractorGrok(con(429))(entrada)).rejects.toMatchObject({ status: 503, message: expect.stringMatching(/saturado/) });
    await expect(extractorGrok(con(400))(entrada)).rejects.toMatchObject({ status: 502 });
    const claveAjena = (async () => Response.json({ code: "invalid-argument", error: "Incorrect API key provided. You can obtain an API key from https://console.x.ai." }, { status: 400 })) as unknown as typeof fetch;
    await expect(extractorGrok(claveAjena)(entrada)).rejects.toMatchObject({ status: 503, message: expect.stringMatching(/clave del servicio/) });
    const rechaza = (async () => Response.json({ choices: [{ message: { content: null, refusal: "no" }, finish_reason: "stop" }] })) as unknown as typeof fetch;
    await expect(extractorGrok(rechaza)(entrada)).rejects.toThrow(/captura sus datos a mano/);
  });

  it("sin clave, la lectura no está activada", async () => {
    delete process.env.XAI_API_KEY;
    const { extractorGrok, grokDisponible } = await import("@/lib/ia/grok");
    expect(grokDisponible()).toBe(false);
    expect(() => extractorGrok()).toThrow(/no está activada/);
  });
});

describe("proveedor de lectura", () => {
  it("elige el que tenga clave (Claude primero) y respeta IA_PROVEEDOR", async () => {
    let m = await import("@/lib/ia/proveedor");
    expect(m.proveedorDeLectura()).toBe("grok");
    expect(m.lecturaDisponible()).toBe(true);
    expect(m.formatosLegibles()).toEqual(["image/jpeg", "image/png", "image/webp"]);
    expect(m.modeloEnUso()).toBe("grok-4.7");
    process.env.ANTHROPIC_API_KEY = "otra"; vi.resetModules();
    m = await import("@/lib/ia/proveedor");
    expect(m.proveedorDeLectura()).toBe("claude");
    expect(m.formatosLegibles()).toContain("application/pdf");
    process.env.IA_PROVEEDOR = "grok"; vi.resetModules();
    m = await import("@/lib/ia/proveedor");
    expect(m.proveedorDeLectura()).toBe("grok");
    process.env.IA_PROVEEDOR = "claude"; delete process.env.ANTHROPIC_API_KEY; vi.resetModules();
    m = await import("@/lib/ia/proveedor");
    expect(m.proveedorDeLectura()).toBeNull();
    expect(m.lecturaDisponible()).toBe(false);
  });
  it("el costo se calcula con la tarifa del modelo que leyó", async () => {
    const { costoAproximado } = await import("@/lib/ia/lectura");
    expect(costoAproximado({ input_tokens: 1_000_000, output_tokens: 0 }, "grok-4.7")).toBe(2);
    expect(costoAproximado({ input_tokens: 1_000_000, output_tokens: 0 })).toBe(4);
  });
});

describe("tarifa por modelo de Claude", () => {
  it("Haiku, Sonnet y Opus se cobran con su precio", async () => {
    const { costoAproximado } = await import("@/lib/ia/lectura");
    expect(costoAproximado({ input_tokens: 1_000_000, output_tokens: 1_000_000 }, "claude-haiku-5-5")).toBe(0.6);
    expect(costoAproximado({ input_tokens: 1_000_000, output_tokens: 0 }, "claude-sonnet-5-5")).toBe(2);
    expect(costoAproximado({ input_tokens: 1_000_000, output_tokens: 0 }, "claude-opus-5-5")).toBe(4);
  });
});
