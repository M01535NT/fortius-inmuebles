import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Boton, EnlaceFlecha } from "@/components/sitio/boton";
import { Bloque, CabezaPagina, Filas, Nota, SiguientePaso } from "@/components/sitio/pagina";
import { TarjetaPropiedad } from "@/components/sitio/tarjeta-propiedad";
import { getPropiedades } from "@/lib/inventario";
import { pageMetadata } from "@/lib/seo/page-metadata";
import "./comprar-sitio.css";

export const metadata: Metadata = pageMetadata({
  path: "/comprar-propiedad",
  title: "Guía para comprar casa en Tijuana",
  description:
    "Antes de comprar casa en Tijuana revisa escritura, gravámenes, predial y uso de suelo. Qué pedir, cuánto cuesta el cierre y cómo evitar sorpresas.",
});

const DOCUMENTOS = [
  { titulo: "Escritura y titularidad", texto: "Que quien vende sea el dueño inscrito." },
  { titulo: "Libertad de gravamen", texto: "Si tiene hipotecas, embargos u otras cargas." },
  { titulo: "Predial, agua y luz", texto: "Al corriente antes de firmar." },
  { titulo: "Uso de suelo y permisos", texto: "Uso permitido y construcción con permisos." },
  { titulo: "Superficies", texto: "Que escritura, catastro y realidad coincidan." },
  { titulo: "Cuotas y reglamento", texto: "En condominio: cuotas al corriente y reglamento." },
];

const GASTOS = [
  { titulo: "Impuesto de adquisición (ISAI)", texto: "Al municipio. Depende del valor y del municipio." },
  { titulo: "Honorarios notariales", texto: "Por la escritura. Los cotiza tu notaría." },
  { titulo: "Derechos de registro", texto: "Inscripción en el Registro Público." },
  { titulo: "Avalúo", texto: "Lo pide el banco si hay crédito." },
  { titulo: "Gastos del crédito", texto: "Apertura, seguros y cargos del banco." },
  { titulo: "Honorarios de la inmobiliaria", texto: "Si aplican, por escrito antes de avanzar." },
];

const PAGO = [
  { titulo: "De contado", texto: "Precio más gastos. El cierre más directo." },
  { titulo: "Crédito bancario", texto: "El banco evalúa tu capacidad y pide avalúo." },
  { titulo: "Infonavit o Fovissste", texto: "Con tu subcuenta de vivienda, sujeto a aprobación." },
];

const CIERRE = [
  { titulo: "Oferta por escrito", texto: "Precio, pago y plazos." },
  { titulo: "Apartado y contrato", texto: "Compromiso con fechas y penalidades." },
  { titulo: "Revisión final", texto: "Documentos, pagos y estado del inmueble." },
  { titulo: "Firma ante notario", texto: "Escritura, impuestos y honorarios." },
  { titulo: "Registro y entrega", texto: "Inscripción, llaves e inventario." },
];

/*
  Comprar, rediseño del sitio (etapa 5, 17/11/2026): la guía de siempre con la piel nueva. Documentos,
  gastos, forma de pago y pasos al cierre, cada uno con su título a un lado y filas con líneas;
  al final, propiedades publicadas (primero las destacadas) y el siguiente paso.
*/
export default async function ComprarPage() {
  const propiedades = await getPropiedades().catch(() => []);
  const enMercado = propiedades
    .filter((p) => p.demo || p.estado === "disponible")
    .sort((a, b) => Number(Boolean(b.destacada)) - Number(Boolean(a.destacada)))
    .slice(0, 3);

  return (
    <main className="s-pagina co">
      <CabezaPagina titulo="Compra sin sorpresas." entrada="Documentos y gastos, antes del precio.">
        <Boton href="/inventario" flecha>Ver propiedades</Boton>
        <Boton href="/herramientas/gastos-de-cierre" variante="contorno">Calcular gastos de cierre</Boton>
      </CabezaPagina>

      <div className="s-contenedor">
        <span className="s-foto-ancha">
          <Image src="/hero/que-hacemos-comprar.webp" alt="Sala luminosa de un departamento con vista a la ciudad" fill preload sizes="(max-width: 1440px) 100vw, 1440px" />
        </span>
      </div>

      <Bloque id="documentos" titulo="Revisa la documentación." apoyo="Antes de apartar. Lo que falte cambia precio, crédito o fecha.">
        <Filas filas={DOCUMENTOS} />
        <Nota>Según el estado civil de quien vende, pueden firmar más personas.</Nota>
      </Bloque>

      <Bloque id="gastos" titulo="Lo que se suma al precio." apoyo="Conócelos antes de la firma.">
        <Filas filas={GASTOS} />
        <Nota>La notaría y el banco confirman los importes. <Link href="/herramientas/gastos-de-cierre">Estimar mis gastos de cierre</Link>.</Nota>
      </Bloque>

      <Bloque id="pago" titulo="Define cómo vas a pagar.">
        <Filas filas={PAGO} />
        <Nota>La institución confirma las condiciones. <Link href="/herramientas/hipoteca">Estimar mi mensualidad</Link>.</Nota>
      </Bloque>

      <Bloque id="cierre" titulo="De la oferta a las llaves." className="co-cierre">
        <Filas filas={CIERRE} ordenadas />
        <Nota>¿Dudas? Revisa las <Link href="/preguntas-frecuentes">preguntas frecuentes</Link>.</Nota>
      </Bloque>

      {enMercado.length > 0 && (
        <section className="s-contenedor co-mercado" aria-labelledby="co-mercado">
          <div className="co-mercado-cabeza">
            <h2 id="co-mercado" className="s-h2">En el mercado ahora</h2>
            <EnlaceFlecha href="/inventario">Ver todo el inventario</EnlaceFlecha>
          </div>
          <div className="co-tarjetas">
            {enMercado.map((p) => <TarjetaPropiedad key={p.slug} property={p} />)}
          </div>
        </section>
      )}

      <SiguientePaso id="co-siguiente" titulo="¿Buscas algo que no está aquí?" texto="Dinos qué buscas y con qué presupuesto.">
        <Boton href="/contacto" tamano="grande">Hablar con un asesor</Boton>
        <Boton href="/inventario" variante="contorno" tamano="grande">Ver propiedades</Boton>
      </SiguientePaso>
    </main>
  );
}
