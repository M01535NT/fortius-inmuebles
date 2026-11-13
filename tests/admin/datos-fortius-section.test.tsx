import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { DatosFortiusSection, datosFortiusDelFormulario } from "@/components/admin/datos-fortius-section";
import { DATOS_FORTIUS_VACIOS } from "@/lib/backend/datos-fortius";

/* FCH-03: la sección de Configuración con los datos de la empresa. */
afterEach(cleanup);

it("muestra cada dato con su etiqueta y dice qué falta por capturar", () => {
  render(<DatosFortiusSection datos={{ ...DATOS_FORTIUS_VACIOS, rfc: "FIN201112AB3" }} />);
  expect(screen.getByRole("heading", { name: "Datos de Fortius" })).toBeTruthy();
  expect((screen.getByLabelText("RFC") as HTMLInputElement).value).toBe("FIN201112AB3");
  expect((screen.getByLabelText("Vigencia de la licencia") as HTMLInputElement).type).toBe("date");
  expect(screen.getByText(/Por capturar: Razón social, Domicilio/)).toBeTruthy();
  expect(screen.queryByText(/Por capturar:.*RFC/)).toBeNull();
});

it("guarda solo lo capturado y avisa qué campo revisar", () => {
  const data = new FormData();
  data.set("empresa.razonSocial", "  Empresa de ejemplo  ");
  data.set("empresa.rfc", "");
  expect(datosFortiusDelFormulario(data)).toEqual({ empresa: { razonSocial: "Empresa de ejemplo" } });
  data.set("empresa.correo", "sin-arroba");
  expect(datosFortiusDelFormulario(data)).toEqual({ error: "Revisa «Correo para contratos y avisos» en Datos de Fortius." });
});
