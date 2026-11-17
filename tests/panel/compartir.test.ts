import { describe, expect, it } from "vitest";

import type { Property } from "@/data/propiedades";
import { compartirInmueble } from "@/lib/panel/datos/compartir";

const p = {
  slug: "casa-ejemplo", codigo: "FORTIUS-000009", titulo: "Casa de ejemplo", zona: "Otay", operacion: "venta",
  precio: { modalidad: "publico", monto: 3500000, moneda: "MXN" }, estado: "disponible", publicada: true, demo: true,
} as unknown as Property;

describe("compartir un inmueble (PN-03)", () => {
  it("arma el texto con precio, enlace del sitio y la ficha en PDF; marca el ejemplo", () => {
    const c = compartirInmueble(p, "https://fortiusinmuebles.com");
    expect(c.publico).toBe(true);
    if (!c.publico) return;
    expect(c.enlace).toBe("https://fortiusinmuebles.com/inventario/casa-ejemplo");
    expect(c.pdf).toBe("https://fortiusinmuebles.com/inventario/casa-ejemplo/ficha-tecnica");
    expect(c.texto).toBe("Casa de ejemplo, Otay. $3,500,000 MXN. (Inmueble de ejemplo.) https://fortiusinmuebles.com/inventario/casa-ejemplo");
    expect(decodeURIComponent(c.whatsapp.split("text=")[1])).toBe(c.texto);
  });
  it("no comparte con clientes lo que no está en el sitio o está en evaluación", () => {
    expect(compartirInmueble({ ...p, publicada: false }, "https://x.test")).toMatchObject({ publico: false, motivo: expect.stringMatching(/publícalo/) });
    expect(compartirInmueble({ ...p, estado: "evaluacion" } as Property, "https://x.test")).toMatchObject({ publico: false, motivo: expect.stringMatching(/evaluación/) });
  });
});
