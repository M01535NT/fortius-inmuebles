import { describe, expect, it } from "vitest";

import type { Property } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import type { FilaAsunto } from "@/lib/panel/datos/asuntos";
import {
  asuntosDePersona, cargaVigente, cuentasBandeja, deshecho, falloGuardar, falloSubida, guardadoEn, guardando, hayPendientes,
  motivoDestino, nuevoArchivo, opcionesDestino, revisarArchivo, subido, tamano, textoEstado, textoGuardadoAsunto, tituloArchivo, vistaBandeja,
} from "@/lib/panel/datos/bandeja";

const pdf = { name: "INE_frente.pdf", type: "application/pdf", size: 2048 };
const persona = (id: string, nombre: string, extra: Partial<Cliente> = {}) => ({ id, nombre, telefono: "6641234567", curp: "XXXX000000XXXXXX00", rfc: "XXXX000000XX0", ...extra }) as unknown as Cliente;
const asunto = (id: string, titulo: string, p: Cliente | null, estado: FilaAsunto["estado"] = "activo") =>
  ({ id, folio: `F-${id}`, titulo, tipo: "Venta", estado, linea: "", persona: p, inmueble: null, sigue: null, abiertas: [], movido: "", asesorId: null }) as FilaAsunto;
const inmueble = (slug: string, titulo: string) => ({ slug, codigo: slug.toUpperCase(), titulo, zona: "Tijuana" }) as unknown as Property;

describe("revisarArchivo", () => {
  it("acepta PDF y fotos hasta 20 MB; el video se rechaza al entrar", () => {
    expect(revisarArchivo(pdf)).toBeNull();
    expect(revisarArchivo({ name: "a.mp4", type: "video/mp4", size: 10 })).toMatch(/^a.mp4: los videos todavía no/);
  });
  it("rechaza otros tipos, vacíos y pesados con el nombre del archivo", () => {
    expect(revisarArchivo({ name: "a.docx", type: "application/msword", size: 10 })).toMatch(/^a\.docx: solo PDF/);
    expect(revisarArchivo({ name: "v.pdf", type: "application/pdf", size: 0 })).toMatch(/vacío/);
    expect(revisarArchivo({ name: "g.pdf", type: "application/pdf", size: 21 * 1024 * 1024 })).toMatch(/20 MB/);
  });
});

describe("motivoDestino", () => {
  it("el asunto y la persona guardan PDF y fotos, no GIF ni video", () => {
    expect(motivoDestino("asunto", "application/pdf")).toBeNull();
    expect(motivoDestino("persona", "image/jpeg")).toBeNull();
    expect(motivoDestino("asunto", "image/gif")).toMatch(/GIF/);
    expect(motivoDestino("persona", "video/mp4")).toMatch(/videos/);
  });
  it("el inmueble solo guarda fotos", () => {
    expect(motivoDestino("inmueble", "image/webp")).toBeNull();
    expect(motivoDestino("inmueble", "image/gif")).toBeNull();
    expect(motivoDestino("inmueble", "application/pdf")).toMatch(/asunto/);
    expect(motivoDestino("inmueble", "video/webm")).toMatch(/enlace de video/);
  });
});

describe("opcionesDestino", () => {
  const ana = persona("c1", "Ana López");
  const beto = persona("c2", "Beto Ruiz", { telefono: "" });
  const datos = {
    personas: [ana, beto],
    asuntos: [asunto("1", "Venta de casa Otay", ana), asunto("2", "Renta depto Centro", beto)],
    inmuebles: [inmueble("casa-otay", "Casa en Otay"), inmueble("depto-centro", "Depto Centro")],
  };
  it("filtra sin acentos ni mayúsculas y por varias palabras", () => {
    expect(opcionesDestino("persona", datos, "ana lopez").map((o) => o.valor)).toEqual(["c1"]);
    expect(opcionesDestino("asunto", datos, "CENTRO").map((o) => o.valor)).toEqual(["2"]);
    expect(opcionesDestino("inmueble", datos, "otay").map((o) => o.valor)).toEqual(["casa-otay"]);
    expect(opcionesDestino("asunto", datos, "")).toHaveLength(2);
  });
  it("nunca muestra CURP ni RFC", () => {
    const etiquetas = opcionesDestino("persona", datos, "").map((o) => o.etiqueta).join(" ");
    expect(etiquetas).not.toMatch(/XXXX/);
    expect(etiquetas).toContain("Ana López · 6641234567");
    expect(etiquetas).toContain("Beto Ruiz");
  });
  it("busca personas por teléfono", () => {
    expect(opcionesDestino("persona", datos, "664123").map((o) => o.valor)).toEqual(["c1"]);
  });
});

describe("asuntosDePersona", () => {
  it("solo los suyos y los cerrados al final", () => {
    const ana = persona("c1", "Ana");
    const lista = [asunto("1", "Cerrado", ana, "cerrado"), asunto("2", "Ajeno", persona("c9", "Otro")), asunto("3", "Activo", ana)];
    expect(asuntosDePersona("c1", lista).map((a) => a.id)).toEqual(["3", "1"]);
  });
});

describe("estados del archivo", () => {
  const base = nuevoArchivo("a1", pdf, 1000);
  it("pasa por Subiendo, Por confirmar, Guardando y Guardado; Deshacer lo regresa", () => {
    expect(textoEstado(base)).toBe("Subiendo…");
    const listo = subido(base, { ticket: "t", expira: 5000 });
    expect(listo.estado).toBe("por-confirmar");
    expect(textoEstado(listo)).toMatch(/^Por confirmar/);
    expect(guardando(listo).estado).toBe("guardando");
    const g = guardadoEn(listo, { clase: "asunto", expedienteId: "e", archivoId: "x", titulo: "INE frente", texto: "En el asunto Venta (F-1)", href: "/panel/asuntos?ver=e" });
    expect(g.carga).toBeNull();
    expect(textoEstado(g)).toBe("En el asunto Venta (F-1)");
    const d = deshecho(g);
    expect(d.estado).toBe("por-confirmar");
    expect(d.guardado).toBeNull();
  });
  it("un error al guardar deja el archivo por confirmar con el motivo", () => {
    const f = falloGuardar(subido(base, { ticket: "t", expira: 1 }), "Sin permiso");
    expect(f.estado).toBe("por-confirmar");
    expect(f.error).toBe("Sin permiso");
    expect(textoEstado(falloSubida(base, "No se subió"))).toBe("No se subió");
  });
  it("la carga temporal vence", () => {
    expect(cargaVigente({ ticket: "t", expira: 2000 }, 1000)).toBe(true);
    expect(cargaVigente({ ticket: "t", expira: 2000 }, 2000)).toBe(false);
    expect(cargaVigente(null, 0)).toBe(false);
  });
});

describe("vistas y cuentas", () => {
  const a = subido(nuevoArchivo("a", pdf, 1), { ticket: "t", expira: 9 });
  const b = nuevoArchivo("b", pdf, 2);
  const c = guardadoEn(subido(nuevoArchivo("c", pdf, 3), { ticket: "t", expira: 9 }), { clase: "inmueble", slug: "s", src: "u", texto: "En las fotos de Casa", href: "/x" });
  const d = guardadoEn(subido(nuevoArchivo("d", pdf, 4), { ticket: "t", expira: 9 }), { clase: "inmueble", slug: "s", src: "u2", texto: "En las fotos de Casa", href: "/x" });
  const e = falloSubida(nuevoArchivo("e", pdf, 5), "No");
  const todos = [c, a, e, b, d];
  it("Por confirmar en orden de llegada; Guardados, lo último primero", () => {
    expect(vistaBandeja(todos, "pendientes").map((x) => x.id)).toEqual(["a", "b", "e"]);
    expect(vistaBandeja(todos, "guardados").map((x) => x.id)).toEqual(["d", "c"]);
  });
  it("cuenta lo que se puede confirmar aparte de lo que sigue en proceso", () => {
    expect(cuentasBandeja(todos)).toEqual({ porConfirmar: 1, enProceso: 1, conError: 1, guardados: 2 });
  });
  it("avisa al salir solo si queda algo sin destino", () => {
    expect(hayPendientes(todos)).toBe(true);
    expect(hayPendientes([c, d, e])).toBe(false);
  });
});

describe("textos", () => {
  it("título del archivo y tamaño", () => {
    expect(tituloArchivo("INE_frente_y_vuelta.pdf")).toBe("INE frente y vuelta");
    expect(tituloArchivo(".pdf")).toBe("Documento");
    expect(tamano(512)).toBe("512 B");
    expect(tamano(2048)).toBe("2 KB");
    expect(tamano(3 * 1024 * 1024)).toBe("3 MB");
    expect(tamano(1.5 * 1024 * 1024)).toBe("1.5 MB");
  });
  it("dónde quedó", () => {
    expect(textoGuardadoAsunto({ titulo: "Venta", folio: "F-1" })).toBe("En el asunto Venta (F-1)");
    expect(textoGuardadoAsunto({ titulo: "Venta", folio: "" }, "Ana")).toBe("En el asunto Venta de Ana");
  });
});
