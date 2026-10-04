import type { Metadata } from "next";

import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
  alternates: { canonical: "/terminos" },
  title: "Términos y condiciones",
  description: "Términos generales de uso del sitio y de la información publicada.",
};

export default function TerminosPage() {
  return (
    <main className="bg-background pt-32">
      <Container className="max-w-3xl pb-24 pt-4 md:pb-32">
        <h1 className="display-title text-5xl text-foreground md:text-6xl">
          Términos y condiciones.
        </h1>
        <div className="mt-8 space-y-5 text-base leading-relaxed text-muted-foreground">
          <p>
            La información publicada en este sitio tiene fines informativos y de
            orientación inicial. No constituye asesoría legal, fiscal ni
            financiera, ni una oferta vinculante sobre propiedades, precios o
            condiciones.
          </p>
          <p>
            La disponibilidad, características y precios de los inmuebles pueden
            cambiar sin previo aviso y se confirman directamente con un asesor
            antes de cualquier operación.
          </p>
          <p>
            El uso de los formularios implica la aceptación del{" "}
            <a href="/privacidad" className="text-primary underline-offset-4 hover:underline">
              aviso de privacidad
            </a>
            .
          </p>
        </div>
      </Container>
    </main>
  );
}
