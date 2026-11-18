import type { Metadata } from "next";
import Image from "next/image";

import { Boton } from "@/components/sitio/boton";
import { Bloque, CabezaPagina, Filas, Nota, SiguientePaso } from "@/components/sitio/pagina";
import { pageMetadata } from "@/lib/seo/page-metadata";

export const metadata: Metadata = pageMetadata({
  path: "/opinion-de-valor",
  title: "Opinión de valor de tu casa en Tijuana",
  description:
    "La opinión de valor de tu casa en Tijuana se entrega tras la entrevista, el levantamiento y la revisión de documentos. No sustituye un avalúo bancario.",
});

const PASOS = [
  { titulo: "Entrevista inicial", texto: "Nos cuentas del inmueble y qué esperas." },
  { titulo: "Levantamiento", texto: "Visitamos, medimos y fotografiamos." },
  { titulo: "Documentos", texto: "Reunimos y revisamos el checklist completo." },
  { titulo: "Dictamen y precio", texto: "Factibilidad jurídica y opinión de valor comercial." },
];

const INCLUYE = [
  { titulo: "Propiedades comparables", texto: "Inmuebles parecidos al tuyo." },
  { titulo: "Fuentes de la información", texto: "De dónde sale cada dato." },
  { titulo: "Rango de precio propuesto", texto: "Precio de salida y margen para negociar." },
  { titulo: "Límites de la información", texto: "Qué falta confirmar y cómo cambiaría el precio." },
];

/*
  Opinión de valor, rediseño del sitio (etapa 5, 17/11/2026): qué es, cómo se llega a ella, qué incluye
  y qué no es. Se entrega después de conocer el inmueble; no es un avalúo.
*/
export default function OpinionDeValorPage() {
  return (
    <main className="s-pagina">
      <CabezaPagina titulo="El precio sale de revisar tu propiedad." entrada="Se entrega por escrito, después de conocer el inmueble y sus papeles.">
        <Boton href="/vender-propiedad#entrevista" flecha>Agendar entrevista</Boton>
      </CabezaPagina>

      <Bloque id="ov-pasos" titulo="Cómo llegamos al precio.">
        <Filas filas={PASOS} ordenadas />
      </Bloque>

      <div className="s-contenedor">
        <span className="s-foto-ancha">
          <Image src="/hero/etapa-02-precio.webp" alt="Cinta métrica sobre un plano" fill sizes="(max-width: 1440px) 100vw, 1440px" />
        </span>
      </div>

      <Bloque id="ov-incluye" titulo="Qué incluye.">
        <Filas filas={INCLUYE} />
      </Bloque>

      <Bloque id="ov-limites" titulo="Qué no es." apoyo="Es informativa. No es un avalúo ni tiene efectos fiscales, hipotecarios ni judiciales.">
        <Nota>Para crédito, trámite fiscal o juicio se necesita un avalúo de perito registrado; te decimos cuándo y lo coordinamos. Su vigencia depende del mercado y de la información disponible.</Nota>
      </Bloque>

      <SiguientePaso id="ov-siguiente" titulo="Todo empieza con la entrevista." texto="Sin entrevista, levantamiento y documentos no hay opinión de valor.">
        <Boton href="/vender-propiedad#entrevista" tamano="grande">Agendar entrevista</Boton>
        <Boton href="/contacto" variante="contorno" tamano="grande">Hablar con un asesor</Boton>
      </SiguientePaso>
    </main>
  );
}
