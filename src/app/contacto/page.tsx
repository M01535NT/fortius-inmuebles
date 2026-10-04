import type { Metadata } from "next";

import { DiagnosticCTA } from "@/components/sections/diagnostic-cta";

export const metadata: Metadata = {
  alternates: { canonical: "/contacto" },
  title: "Contacto",
  description:
    "Consulta sobre compra, venta o un inmueble publicado y solicita una conversación inicial.",
};

export default function ContactoPage() {
  return (
    <main className="pt-20">
      <DiagnosticCTA headingLevel="h1" general />
    </main>
  );
}
