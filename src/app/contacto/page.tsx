import type { Metadata } from "next";
import Image from "next/image";

import { Boton } from "@/components/sitio/boton";
import { ContactoMotivo } from "@/components/sitio/contacto/contacto-motivo";
import { pageMetadata } from "@/lib/seo/page-metadata";
import "./contacto-sitio.css";

export const metadata: Metadata = pageMetadata({
  path: "/contacto",
  title: "Contacto de inmobiliaria en Tijuana",
  description:
    "Escríbenos para vender, comprar, rentar o preguntar por un inmueble en Tijuana, Rosarito, Tecate o Ensenada. Te respondemos por WhatsApp, teléfono o correo.",
});

/*
  Contacto, Fortius II (17/11/2026, boceto «Fortius: Vender y Contacto» aprobado): página clara.
  La frase con el motivo, el formulario corto y, al lado, los canales directos. Abajo, la foto
  con quién te atiende. Es la invitación de la página: el pie no repite la suya.
*/
export default function ContactoPage() {
  return (
    <main className="ct2">
      <section className="s-contenedor">
        <ContactoMotivo />
      </section>
      <section className="s-contenedor ct2-equipo-marco" aria-labelledby="ct2-equipo">
        <div className="s-banda ct2-equipo">
          <Image src="/hero/interior-depa.webp" alt="" fill sizes="(max-width: 1440px) 100vw, 1440px" className="ct2-equipo-foto" />
          <span className="ct2-equipo-velo" aria-hidden="true" />
          <div className="ct2-equipo-cuerpo">
            <h2 id="ct2-equipo" className="ct2-equipo-titulo">Responde Fortius, con un asesor asignado a tu asunto.</h2>
            <Boton href="/nosotros#agentes" variante="contorno" tamano="grande" sobreMedia flecha>Conocer al equipo</Boton>
          </div>
        </div>
      </section>
    </main>
  );
}
