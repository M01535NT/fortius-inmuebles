import { expect, test } from "vitest";

import type { Property } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import { fichaInmueble, fichaPersona, filaInmueble, filaPersona, filtrarInmuebles, filtrarPersonas } from "@/lib/panel/datos/vistas";

const cliente = (o: Partial<Cliente>): Cliente => ({ id: "c1", nombre: "Mariana López", telefono: "", tipo: "propietario", notas: "", creadoEl: "", actualizadoEl: "", ...o });

test("PN-03 personas: la fila trae la zona (el tipo va en el grupo), contacto legible y si falta el contacto", () => {
  const a = filaPersona(cliente({ telefono: "664 000 0001", email: "m@ejemplo.mx", zona: "Playas" }));
  expect(a).toMatchObject({ nombre: "Mariana López", subtitulo: "Playas", contacto: "664 000 0001 · m@ejemplo.mx", sinContacto: false });
  const b = filaPersona(cliente({ id: "c2", nombre: "  ", telefono: "", tipo: "comprador" }));
  expect(b).toMatchObject({ nombre: "Sin nombre", subtitulo: "", sinContacto: true });
  expect(filaPersona(cliente({ telefono: "6641234567" })).contacto).toBe("664 123 4567");
});

test("PN-03 personas: la búsqueda ignora acentos y mayúsculas y pide todas las palabras", () => {
  const filas = [
    filaPersona(cliente({ id: "1", nombre: "Mariana López", telefono: "664 111" })),
    filaPersona(cliente({ id: "2", nombre: "Luis Torres", telefono: "664 222", tipo: "comprador" })),
  ];
  expect(filtrarPersonas(filas, "lopez").map((f) => f.id)).toEqual(["1"]);
  expect(filtrarPersonas(filas, "664").map((f) => f.id)).toEqual(["1", "2"]);
  expect(filtrarPersonas(filas, "luis comprador").map((f) => f.id)).toEqual(["2"]);
  expect(filtrarPersonas(filas, "xyz")).toEqual([]);
  expect(filtrarPersonas(filas, "  ")).toHaveLength(2);
});

const propiedad = (o: Partial<Property>): Property => ({
  slug: "casa-1", codigo: "FORTIUS-000001", titulo: "Casa en Playas", tipo: "casa", operacion: "venta",
  precio: { modalidad: "fijo", monto: 4850000, moneda: "MXN" }, zona: "Playas de Tijuana", estado: "disponible", demo: false, ...o,
} as Property);

test("PN-03 inmuebles: la fila muestra precio, operación y estado, y marca lo privado y lo de ejemplo", () => {
  const f = filaInmueble(propiedad({ estado: "evaluacion", demo: true }));
  expect(f.precio).toBe("$4,850,000 MXN");
  expect(f.estado).toBe("Venta · En captación");
  expect(f).toMatchObject({ privado: true, esEjemplo: true, codigo: "FORTIUS-000001" });
});

test("PN-03 inmuebles: se filtra por venta o renta y por texto", () => {
  const filas = [
    filaInmueble(propiedad({ slug: "a", titulo: "Casa en Playas" })),
    filaInmueble(propiedad({ slug: "b", titulo: "Departamento en Zona Río", operacion: "renta", zona: "Zona Río" })),
  ];
  expect(filtrarInmuebles(filas, "", "todos")).toHaveLength(2);
  expect(filtrarInmuebles(filas, "", "renta").map((f) => f.slug)).toEqual(["b"]);
  expect(filtrarInmuebles(filas, "rio", "todos").map((f) => f.slug)).toEqual(["b"]);
  expect(filtrarInmuebles(filas, "fortius-000001", "venta").map((f) => f.slug)).toEqual(["a"]);
  expect(filtrarInmuebles(filas, "fortius-000001", "todos")).toHaveLength(2);
});

test("PN-03 ficha de persona: resume los datos para contratos, nunca muestra CURP ni RFC y el correo no es obligatorio", () => {
  const s = fichaPersona(cliente({ telefono: "664 000 0001", curp: "XXXX000000HBCXXX00", rfc: "", notas: "Llamar en la tarde" }));
  const contacto = s.find((x) => x.titulo === "Contacto")!;
  expect(contacto.datos.find((d) => d.etiqueta === "Correo")).toBeUndefined();
  const exp = s.find((x) => x.titulo === "Datos para contratos")!;
  expect(exp.datos).toEqual([
    { etiqueta: "Estado", valor: "Faltan 5 de 6. Se piden al preparar un contrato.", falta: true },
    { etiqueta: "Registrados", valor: "CURP" },
  ]);
  expect(JSON.stringify(s)).not.toContain("XXXX000000HBCXXX00");
  const sinNada = fichaPersona(cliente({ telefono: "" }));
  expect(sinNada.find((x) => x.titulo === "Contacto")!.datos.filter((d) => d.falta)).toHaveLength(2);
  expect(sinNada.find((x) => x.titulo === "Datos para contratos")!.datos[0].falta).toBe(false);
});

test("PN-03 ficha de inmueble: avisa si es de ejemplo y omite lo vacío", () => {
  const s = fichaInmueble(propiedad({ demo: true, ficha: { recamaras: 3, banos: 0 }, galeria: [] }));
  const resumen = s.find((x) => x.titulo === "Resumen")!;
  expect(resumen.datos.find((d) => d.etiqueta === "Aviso")?.falta).toBe(true);
  const tecnica = s.find((x) => x.titulo === "Ficha técnica")!;
  expect(tecnica.datos).toEqual([{ etiqueta: "Recámaras", valor: "3" }]);
  expect(s.find((x) => x.titulo === "Material")!.datos[0]).toEqual({ etiqueta: "Fotos", valor: "Falta", falta: true });
});
