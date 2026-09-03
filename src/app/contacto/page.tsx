import type { Metadata } from "next";

import { DiagnosticCTA } from "@/components/sections/diagnostic-cta";

export const metadata: Metadata = {
  alternates: { canonical: "/contacto" },
  title: "Contacto",
  description:
    "Solicita diagnostico inmobiliario, opinion de valor o una conversacion inicial.",
};

export default function ContactoPage() {
  return (
    <main className="pt-20">
      <DiagnosticCTA />
    </main>
  );
}
