import { expect, test } from "vitest";
import { publicContact } from "@/lib/public-contact";

const settings = { nombreComercial: "Fortius Inmuebles", telefono: "", whatsapp: "+52 664 123 4567", email: "", horario: "", facebook: "https://www.facebook.com/mnt.fixture", instagram: "", videoInstitucionalUrl: "" };

test("direct messaging preserves property context and canonicalizes supported destinations", () => {
  const message = "Hola, residencia & jardín: https://example.com/inventario/casa";
  for (const whatsapp of [settings.whatsapp, "https://wa.me/526641234567", "https://api.whatsapp.com/send?phone=526641234567"]) {
    const contact = publicContact({ ...settings, whatsapp }, message);
    expect(new URL(contact.whatsapp).pathname).toBe("/526641234567");
    expect(new URL(contact.whatsapp).searchParams.get("text")).toBe(message);
    expect(contact.messenger).toBe("https://m.me/mnt.fixture");
  }
  expect(publicContact({ ...settings, facebook: "https://m.me/123456789" }).messenger).toBe("https://m.me/123456789");
});

test("unconfirmed or unsupported destinations never produce messaging links", () => {
  for (const whatsapp of ["", "por confirmar", "+52 664 000 0000", "https://wa.me/abc526641234567", "https://example.com/526641234567", "javascript:alert(1)"]) {
    expect(publicContact({ ...settings, whatsapp }).whatsapp).toBe("");
  }
  for (const facebook of ["", "https://facebook.com/groups/example", "https://example.com/mnt", "javascript:alert(1)"]) {
    expect(publicContact({ ...settings, facebook }).messenger).toBe("");
  }
});

test("a Mexican number saved without country code still dials Mexico and reads in groups", () => {
  const contact = publicContact({ ...settings, telefono: "6641234567", whatsapp: "+526641234567" });
  expect(contact.phoneHref).toBe("tel:+526641234567");
  expect(contact.phone).toBe("+52 664 123 4567");
  expect(contact.whatsappLabel).toBe("+52 664 123 4567");
  expect(new URL(publicContact({ ...settings, whatsapp: "6641234567" }).whatsapp).pathname).toBe("/526641234567");
  expect(publicContact({ ...settings, whatsapp: "https://wa.me/526641234567" }).whatsappLabel).toBe("+52 664 123 4567");
});

