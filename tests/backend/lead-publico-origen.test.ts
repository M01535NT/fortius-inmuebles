import { expect, test } from "vitest";
import { parseLead } from "@/lib/backend/validation";

/*
  BUG-C43: la captura pública (`/api/public/leads` → parseLead) acepta `origen: "manual"`, que es el
  origen de un prospecto registrado por el equipo en el panel. Un envío del sitio con ese origen sale
  de «Nuevos sin atender» (awaitingFirstReply lo descarta) y su canal aparece «sin-dato», así que no
  corre el plazo de primera atención. Ningún formulario público usa "manual".
*/
const base = { nombre: "Visitante de ensayo", telefono: "6640000000", website: "" };

test("un envío del sitio no puede declararse captura manual del panel", () => {
  expect(() => parseLead({ ...base, origen: "manual" })).toThrow();
});

test("los orígenes que sí usan los formularios públicos se siguen aceptando", () => {
  for (const origen of ["contacto", "interes-propiedad", "documentos", "interes_propiedad"]) {
    expect(parseLead({ ...base, origen }).origen).toBe(origen);
  }
});
