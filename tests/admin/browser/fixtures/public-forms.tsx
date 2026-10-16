import * as React from "react";
import { ContactForm } from "@/components/sections/contact-form";
import { LeadMagnet } from "@/components/sections/lead-magnet";
import { PropertyDocuments } from "@/components/property/property-documents";
import { PropertyInterestForm } from "@/components/property/property-interest-form";

// Test host only. No product route, Supabase connection or persisted fixture.
export function PublicFormsFixture() {
  return <>
    <section data-variant="contacto"><ContactForm /></section>
    <section data-variant="checklist"><LeadMagnet /></section>
    <section data-variant="documentos"><PropertyDocuments slug="fixture" codigo="TEST" documentos={[{ codigo: "F1", nombre: "Ficha", descripcion: "Documento", url: "/fixture.pdf" }]} /></section>
    <section data-variant="interes-propiedad"><PropertyInterestForm slug="fixture" codigo="TEST" titulo="Casa" /></section>
  </>;
}
