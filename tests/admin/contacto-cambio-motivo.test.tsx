import * as React from "react";
import { afterEach, expect, test } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ContactoMotivo } from "@/components/sitio/contacto/contacto-motivo";
import { PublicFeaturesProvider } from "@/components/providers/public-features-provider";

/*
  BUG-C42: cambiar de motivo en /contacto no debe borrar lo que el visitante ya escribió.
  Con el diseño nuevo el motivo se elige en la frase «Hola, quiero…».
*/
Element.prototype.scrollIntoView = () => {};
afterEach(cleanup);

test("cambiar de motivo conserva el nombre y el teléfono ya escritos", () => {
  render(<PublicFeaturesProvider publicLeadsEnabled><ContactoMotivo /></PublicFeaturesProvider>);
  fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Ana Ensayo" } });
  fireEvent.change(screen.getByLabelText("Teléfono o WhatsApp"), { target: { value: "664 000 0000" } });
  fireEvent.click(screen.getByRole("combobox", { name: /^Motivo:/ }));
  fireEvent.click(screen.getByRole("option", { name: "rentar" }));
  expect(screen.getByLabelText("Qué rentas o buscas rentar")).toBeTruthy();
  expect((screen.getByLabelText("Nombre") as HTMLInputElement).value).toBe("Ana Ensayo");
  expect((screen.getByLabelText("Teléfono o WhatsApp") as HTMLInputElement).value).toBe("664 000 0000");
});
