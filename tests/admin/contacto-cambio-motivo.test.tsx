import * as React from "react";
import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ContactIntents } from "@/components/contact/contact-intents";
import { PublicFeaturesProvider } from "@/components/providers/public-features-provider";

/*
  BUG-C42: en /contacto, `<ContactForm key={intent}>` vuelve a montar el formulario al cambiar de
  motivo. Nombre y teléfono no están controlados, así que lo que el visitante ya escribió se borra
  sin aviso al pasar de «Quiero comprar» a «Quiero vender».
*/
vi.mock("next/image", () => ({ default: (props: { alt: string }) => <span role="img" aria-label={props.alt} /> }));
vi.mock("@/components/contact/messaging-actions", () => ({ MessagingContact: () => null }));
afterEach(cleanup);

test("cambiar de motivo conserva el nombre y el teléfono ya escritos", () => {
  render(<PublicFeaturesProvider publicLeadsEnabled><ContactIntents /></PublicFeaturesProvider>);
  fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Ana Ensayo" } });
  fireEvent.change(screen.getByLabelText("Teléfono o WhatsApp"), { target: { value: "664 000 0000" } });
  fireEvent.click(screen.getByLabelText(/Quiero vender/));
  expect((screen.getByLabelText("Nombre") as HTMLInputElement).value).toBe("Ana Ensayo");
  expect((screen.getByLabelText("Teléfono o WhatsApp") as HTMLInputElement).value).toBe("664 000 0000");
});
