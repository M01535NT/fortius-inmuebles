import type { Metadata } from "next";
import Image from "next/image";

import { Boton } from "@/components/sitio/boton";
import { FilaLinea, ListaLineas } from "@/components/sitio/lineas";
import { EntrevistaVenta } from "@/components/sitio/vender/entrevista-venta";
import { VideoFondo } from "@/components/sitio/video-fondo";
import { getPublicSettings } from "@/lib/backend/public";
import { publicContact } from "@/lib/public-contact";
import { pageMetadata } from "@/lib/seo/page-metadata";
import "./vender-sitio.css";

export const metadata: Metadata = pageMetadata({
  path: "/vender-propiedad",
  title: "Vender tu casa en Tijuana con asesoría",
  description:
    "Vende tu casa en Tijuana, Rosarito, Tecate o Ensenada. Revisamos documentos y precio antes de publicar y te damos seguimiento por escrito hasta la firma.",
});

const PASOS = [
  { titulo: "Entrevista", texto: "Nos cuentas del inmueble y qué esperas de la venta.", foto: "/hero/que-hacemos-vender.webp", alt: "Casa de dos niveles con jardín" },
  { titulo: "Levantamiento", texto: "Visitamos, medimos y fotografiamos.", foto: "/hero/etapa-03-telefono.webp", alt: "Teléfono en un trípode frente a la fachada de una casa" },
  { titulo: "Documentos", texto: "Reunimos escritura, predial y lo que haga falta.", foto: "/hero/etapa-01-revisamos.webp", alt: "Escritura y pluma sobre un escritorio" },
  { titulo: "Dictamen y precio", texto: "Si se puede vender y en cuánto, por escrito.", foto: "/hero/etapa-02-precio.webp", alt: "Cinta métrica sobre un plano" },
];

const PENDIENTES = [
  "Qué pendiente afecta el precio o el cierre",
  "Qué documento se necesita para resolverlo",
  "Si conviene publicar ya o esperar",
];

const CHECKLIST_PDF = "/descargas/checklist-venta-fortius.pdf";
const CHECKLIST = ["Escritura a tu nombre e inscrita", "Predial y agua al corriente", "Hipoteca liquidada o por cancelar"];

function Palomita() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

/*
  Vender, Fortius II (17/11/2026, boceto «Fortius: Vender y Contacto» aprobado).
  Portada oscura con el video de la casa y la entrevista en dos pasos (el único formulario),
  cómo vendemos en cuatro pasos con foto, qué se sabe antes de anunciar, checklist en banda
  oscura, herramientas «Antes de decidir» y el cierre propio (el pie no repite su invitación).
*/
export default async function VenderPage() {
  const settings = await getPublicSettings().catch(() => null);
  const contact = publicContact(settings, "Hola, quiero agendar la entrevista para vender mi propiedad.");

  return (
    <main className="ve">
      <section className="s-banda ve-portada" aria-labelledby="ve-titulo">
        <div className="ve-fondo" aria-hidden="true">
          <VideoFondo webm="/hero/asunto-casa.webm" mp4="/hero/asunto-casa.mp4" poster="/hero/asunto-casa-poster.webp" className="ve-video" />
          <span className="ve-velo" />
        </div>
        <div className="s-contenedor ve-portada-cuerpo">
          <div className="ve-portada-texto">
            <h1 id="ve-titulo" className="ve-titulo">Vende con todo en orden.</h1>
            <p className="ve-entrada">Revisamos escritura, adeudos y precio antes de publicar. Si algo falta, lo sabes antes de anunciar.</p>
            <p className="ve-confianza">Sin compromiso · Respuesta por WhatsApp · Tijuana, Rosarito, Tecate y Ensenada</p>
          </div>
          <EntrevistaVenta whatsapp={contact.whatsapp || undefined} telefono={contact.phoneHref || undefined} />
        </div>
      </section>

      <section id="pasos" className="s-contenedor s-seccion" aria-labelledby="ve-pasos">
        <div className="ve-cabeza">
          <h2 id="ve-pasos" className="s-h2 ve-cabeza-titulo">Así vendemos tu propiedad.</h2>
          <p className="s-entrada ve-cabeza-apoyo">Antes de anunciar sabes si se puede vender, en cuánto y qué papel falta.</p>
        </div>
        <ol className="ve-pasos">
          {PASOS.map((paso) => (
            <li key={paso.titulo} className="ve-paso-foto">
              <span className="ve-foto"><Image src={paso.foto} alt={paso.alt} fill sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw" /></span>
              <h3 className="ve-paso-titulo">{paso.titulo}</h3>
              <p className="s-apoyo">{paso.texto}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="s-contenedor ve-par ve-par-final" aria-labelledby="ve-falta">
        <h2 id="ve-falta" className="s-h2 ve-par-titulo">Si algo falta, lo sabes antes de anunciar.</h2>
        <ul className="ve-filas">
          {PENDIENTES.map((texto) => <li key={texto}>{texto}</li>)}
        </ul>
      </section>

      <section className="s-banda ve-checklist" aria-labelledby="ve-lista">
        <div className="s-contenedor ve-par">
          <div className="ve-checklist-texto">
            <h2 id="ve-lista" className="ve-checklist-titulo">¿Está lista tu propiedad para venderse?</h2>
            <p className="s-entrada">Diez puntos para revisar antes de anunciar. Se descarga en PDF, sin registro.</p>
            <Boton href={CHECKLIST_PDF} tamano="grande" download className="ve-checklist-boton">Descargar el checklist</Boton>
          </div>
          <div className="ve-checklist-lado">
            <ul className="ve-filas ve-filas-palomita">
              {CHECKLIST.map((texto) => <li key={texto}><Palomita />{texto}</li>)}
            </ul>
            <p className="s-apoyo">Y siete puntos más en el PDF.</p>
          </div>
        </div>
      </section>

      <section className="s-contenedor s-seccion ve-par" aria-labelledby="ve-decidir">
        <h2 id="ve-decidir" className="s-h2 ve-par-titulo">Antes de decidir</h2>
        <ListaLineas grande fuerte className="ve-herramientas">
          <FilaLinea href="/herramientas/gastos-de-cierre" titulo="Cuánto te queda al vender" detalle="Gastos, impuestos y neto de venta." />
          <FilaLinea href="/opinion-de-valor" titulo="Opinión de valor" detalle="Por escrito, con las propiedades con que se comparó." />
          <FilaLinea href="/avisos" titulo="Avisos y derechos del consumidor" detalle="Lo que la ley te garantiza al vender." />
        </ListaLineas>
      </section>

      <section className="s-banda ve-cierre" aria-labelledby="ve-cierre">
        <div className="s-contenedor ve-cierre-cuerpo">
          <h2 id="ve-cierre" className="ve-cierre-titulo">¿Empezamos con<br />la entrevista?</h2>
          <div className="ve-cierre-acciones">
            <Boton href="#entrevista" tamano="grande">Agendar entrevista</Boton>
            {contact.whatsapp
              ? <Boton href={contact.whatsapp} variante="contorno" tamano="grande" target="_blank" rel="noopener noreferrer">Escribir por WhatsApp</Boton>
              : contact.phoneHref ? <Boton href={contact.phoneHref} variante="contorno" tamano="grande">Llamar</Boton> : null}
          </div>
        </div>
      </section>
    </main>
  );
}
