import { PropertyMobileCta } from "@/components/property/property-mobile-cta";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { publicContact } from "@/lib/public-contact";
import { MessagingActions, MessagingContact } from "@/components/contact/messaging-actions";
import { PublicFeaturesProvider } from "@/components/providers/public-features-provider";

const settings = { nombreComercial: "MNT Inmuebles", telefono: "", whatsapp: "+52 664 123 4567", email: "", horario: "", facebook: "https://www.facebook.com/mnt.fixture", instagram: "", videoInstitucionalUrl: "" };

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
  expect(renderToStaticMarkup(<MessagingActions settings={null} />)).toBe("");
});

test("shared public settings expose direct anchors while keeping the form collapsed", () => {
  const html = renderToStaticMarkup(<PublicFeaturesProvider publicLeadsEnabled settings={settings}>
    <MessagingContact><form aria-label="Alternativa" /></MessagingContact>
  </PublicFeaturesProvider>);
  expect(html).toContain('href="https://wa.me/526641234567"');
  expect(html).toContain('href="https://m.me/mnt.fixture"');
  expect(html).toContain("<details");
  expect(html).not.toContain("<details open");
  expect(html).toContain("Prefiero dejar mis datos en un formulario");
});

test("mobile contact uses exactly phone and contextual WhatsApp links", () => {
  const html = renderToStaticMarkup(<PropertyMobileCta settings={{ ...settings, telefono: "+52 664 123 4567" }} message="Quiero conocer esta casa" />);
  expect(html).toContain('href="tel:+526641234567"');
  expect(html).toContain('href="https://wa.me/526641234567?text=Quiero%20conocer%20esta%20casa"');
  expect(html).not.toContain("m.me/");
  expect((html.match(/<a /g) ?? []).length).toBe(2);
});
