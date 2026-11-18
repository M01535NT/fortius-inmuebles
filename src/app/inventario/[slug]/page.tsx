import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { propertyShare, propertyShareMetadata } from "@/lib/property-share";
import { InventoryBackLink } from "@/components/property/inventory-back-link";
import { PropertyDocuments } from "@/components/property/property-documents";
import { Distintivo } from "@/components/sitio/distintivo";
import { FichaAsesor } from "@/components/sitio/ficha-asesor";
import { FichaBarra } from "@/components/sitio/ficha-barra";
import { FichaHerramientas } from "@/components/sitio/ficha-herramientas";
import { FichaVisor } from "@/components/sitio/ficha-visor";
import { TarjetaPropiedad } from "@/components/sitio/tarjeta-propiedad";
import { getPublicAdvisers, getPublicSettings } from "@/lib/backend/public";
import { publicContact } from "@/lib/public-contact";
import {
  CATEGORIA_PUNTO_LABELS,
  ESTADO_LABELS,
  FUENTE_SUPERFICIE_LABELS,
  GRUPO_CARACTERISTICA_LABELS,
  formatPrecio,
  OPERACION_LABELS,
  TIPO_LABELS,
  type CategoriaPunto,
  type Property,
} from "@/data/propiedades";
import { municipioDeZona } from "@/data/zonas";
import { getConjunto, getPropertyBySlug, getRelatedProperties } from "@/lib/inventario";
import { siteConfig } from "@/data/site";
import { propertyLd, serializeLd } from "@/lib/seo/json-ld";
import "./ficha.css";

type Params = { slug: string };

/* Cada solicitud consulta el inventario publicado del panel MNT. */
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  // Sin esto, la pestaña del 404 terminaba con el título del inicio.
  if (!property) return { title: "Propiedad no encontrada", robots: { index: false, follow: true } };
  return propertyShareMetadata(property);
}

type FichaRow = { label: string; value: string; source?: string; confirmed?: boolean };

/* Ficha técnica: solo filas con dato; las superficies dicen de dónde salen. */
function fichaRows(p: Property): FichaRow[] {
  const f = p.ficha;
  const fuente = (key?: keyof typeof FUENTE_SUPERFICIE_LABELS) => key
    ? { source: `Fuente: ${FUENTE_SUPERFICIE_LABELS[key]}`, confirmed: key === "escritura" || key === "catastro" || key === "plano" }
    : {}; // Sin fuente registrada no se muestra nada al público (auditoría C4).
  const rows: FichaRow[] = [];
  if (f.terrenoM2 != null) rows.push({ label: "Terreno", value: `${f.terrenoM2} m²`, ...fuente(p.informacionPublica?.fuenteTerreno) });
  if (f.construccionM2 != null) rows.push({ label: "Construcción", value: `${f.construccionM2} m²`, ...fuente(p.informacionPublica?.fuenteConstruccion) });
  if (f.recamaras) rows.push({ label: "Recámaras", value: String(f.recamaras) });
  if (f.banos) rows.push({ label: "Baños", value: String(f.banos) });
  if (f.estacionamientos) rows.push({ label: "Estacionamientos", value: String(f.estacionamientos) });
  if (f.antiguedad) rows.push({ label: "Antigüedad", value: f.antiguedad });
  // PUB-02: un compartido no lo verificó Fortius; cada dato dice de quién viene.
  if (p.colaboracion) return rows.map((row) => ({ ...row, source: "Según la inmobiliaria aliada", confirmed: false }));
  return rows;
}

/* Montos recurrentes en la moneda del precio publicado (MXN si es a consulta). */
function money(amount: number, p: Property) {
  const moneda = p.precio.modalidad === "publico" ? p.precio.moneda : "MXN";
  return `$${amount.toLocaleString("en-US")} ${moneda}`;
}

/* Fechas largas en español; las fechas sin hora se leen a mediodía UTC para no cambiar de día. */
function fechaLarga(value: string | undefined, conAnio = true) {
  if (!value) return "";
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "long", ...(conAnio ? { year: "numeric" } : {}), timeZone: "America/Tijuana" });
}

/* Precio por m²: solo con precio publicado y la superficie que corresponde (terreno en terrenos, construcción en lo demás). */
function precioPorM2(p: Property) {
  if (p.precio.modalidad !== "publico") return null;
  const esTerreno = p.tipo === "terreno";
  const m2 = esTerreno ? p.ficha.terrenoM2 : p.ficha.construccionM2;
  if (!m2 || m2 <= 0) return null;
  const monto = Math.round(p.precio.monto / m2).toLocaleString("en-US");
  return { valor: `$${monto} ${p.precio.moneda}${p.operacion === "renta" ? " al mes" : ""}`, base: esTerreno ? "por m² de terreno" : "por m² de construcción" };
}

/* Lugares cercanos agrupados por categoría, en el orden en que las define el panel. */
function lugaresPorGrupo(p: Property) {
  const grupos = new Map<CategoriaPunto, Property["puntosDeInteres"]>();
  for (const lugar of p.puntosDeInteres) {
    const categoria = lugar.categoria ?? "otros";
    grupos.set(categoria, [...(grupos.get(categoria) ?? []), lugar]);
  }
  return Array.from(grupos, ([categoria, lugares]) => ({ titulo: CATEGORIA_PUNTO_LABELS[categoria], lugares }));
}

/*
  Ficha del inmueble · Fortius II (17/11/2026), según el lienzo «Fortius desde
  cero»: banda oscura con nombre, precio, marco limpio y cifras; luego
  descripción, ficha técnica y documentos, mapa de la zona, alrededores,
  herramientas con el precio, preguntas con el asesor y propiedades parecidas.
  Los bloques sin datos no se muestran.
*/
export default async function PropertyDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property) notFound();

  const [related, advisers, settings, conjunto] = await Promise.all([
    getRelatedProperties(slug), getPublicAdvisers(), getPublicSettings(), getConjunto(property),
  ]);
  const ficha = fichaRows(property);
  const porM2 = precioPorM2(property);
  const publicada = fechaLarga(property.publicadaEl);
  const revisada = fechaLarga(property.informacionPublica?.disponibilidadRevisadaEl, false);
  const share = propertyShare(property);
  const pageUrl = new URL(`/inventario/${property.slug}`, siteConfig.url).href;
  const cerrada = property.estado === "vendida" || property.estado === "rentada";
  const contact = publicContact(settings, cerrada
    ? `Hola, vi ${property.titulo} (${property.codigo}) y quiero opciones parecidas. ${pageUrl}`
    : `Hola, quiero agendar una visita a ${property.titulo} (${property.codigo}). ${pageUrl}`);
  const asesor = advisers.find((a) => a.id === property.asesorId);
  const precio = formatPrecio(property.precio);
  const conHerramientas = property.precio.modalidad === "publico" && property.precio.moneda === "MXN" && !cerrada;
  const grupos = property.caracteristicas?.filter((grupo) => grupo.elementos.length) ?? [];
  const ofrece = grupos.length
    ? grupos.map((grupo) => ({ titulo: GRUPO_CARACTERISTICA_LABELS[grupo.grupo], elementos: grupo.elementos }))
    : property.amenidades.length ? [{ titulo: "Lo que ofrece", elementos: property.amenidades }] : [];
  const beneficios = property.beneficios ?? [];
  const documentos = property.documentos ?? [];
  const costos = property.costos ?? {};
  const [entrada, ...parrafos] = property.descripcion;
  const alrededor = lugaresPorGrupo(property);
  const municipio = municipioDeZona(property.zona);
  const lugarMapa = property.zona.trim().toLowerCase() === municipio.toLowerCase() ? municipio : `${property.zona}, ${municipio}`;
  const consultaMapa = encodeURIComponent(`${lugarMapa}, Baja California, México`);
  const datosRenta = [
    ...(porM2 ? [{ dato: `Precio ${porM2.base}`, valor: porM2.valor }] : []),
    ...(costos.predialAnual != null ? [{ dato: "Predial anual", valor: money(costos.predialAnual, property) }] : []),
    ...(costos.mantenimientoMensual != null ? [{ dato: "Mantenimiento mensual", valor: money(costos.mantenimientoMensual, property) }] : []),
  ];
  const cifras = [
    property.ficha.construccionM2 != null ? { dato: "Construcción", valor: `${property.ficha.construccionM2} m²` } : null,
    property.ficha.terrenoM2 != null ? { dato: "Terreno", valor: `${property.ficha.terrenoM2} m²` } : null,
    property.ficha.recamaras ? { dato: "Recámaras", valor: String(property.ficha.recamaras) } : null,
    property.ficha.banos ? { dato: "Baños", valor: String(property.ficha.banos) } : null,
    property.ficha.estacionamientos ? { dato: "Estacionamientos", valor: String(property.ficha.estacionamientos) } : null,
    property.ficha.antiguedad ? { dato: "Antigüedad", valor: property.ficha.antiguedad } : null,
  ].filter((c): c is { dato: string; valor: string } => c !== null);

  return (
    <main className="fi">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeLd(propertyLd(property)) }} />

      {/* 1–3. Marco, nombre con precio y cifras sobre la banda oscura. Arriba solo «Volver»: el marco se ve completo al entrar. */}
      <section className="s-banda fi-banda" aria-labelledby="fi-titulo">
        <div className="s-contenedor">
          <p className="fi-volver"><InventoryBackLink /></p>

          <FichaVisor
            imagenes={property.galeria}
            titulo={property.titulo}
            share={share}
            videoUrl={property.videoUrl}
            tour360Url={property.tour360Url}
            fichaUrl={`/inventario/${encodeURIComponent(property.slug)}/ficha-tecnica`}
          />

          {/* Nombre, tipo con zona y precio, debajo del marco (17/11/2026). */}
          <div className="fi-cabeza">
            <div className="fi-nombre">
              <h1 id="fi-titulo" className="fi-titulo">{property.titulo}</h1>
              <p className="fi-lugar">
                <Link href={`/inventario?tipo=${property.tipo}&op=${property.operacion}`}>{TIPO_LABELS[property.tipo]} en {OPERACION_LABELS[property.operacion].toLowerCase()}</Link>
                <span aria-hidden="true"> · </span>{property.zona}
              </p>
            </div>
            <div className="fi-precio">
              <p className="fi-precio-monto">{precio}</p>
              {(property.estado !== "disponible" || property.colaboracion) && <p className="fi-distintivos">
                {property.estado !== "disponible" && <Distintivo tono="aviso">{ESTADO_LABELS[property.estado]}</Distintivo>}
                {property.colaboracion && <Distintivo>En colaboración</Distintivo>}
              </p>}
            </div>
          </div>

          {cifras.length > 0 && <dl className="fi-cifras" aria-label="Características principales">
            {cifras.map((c) => <div key={c.dato}><dd>{c.valor}</dd><dt>{c.dato}</dt></div>)}
          </dl>}

          <p className="fi-fechas">
            {property.direccionAproximada && <span>{property.direccionAproximada}</span>}
            <span>Código {property.codigo}</span>
            {publicada && <span>Publicada el {publicada}</span>}
            {revisada && <span>Disponibilidad revisada el {revisada}</span>}
          </p>
          {property.demo && <p className="fi-demo"><strong>Propiedad de demostración.</strong> Los datos y el precio son de ejemplo; esta ficha no anuncia una oferta real.</p>}
        </div>
      </section>

      <div className="s-contenedor">
        {(property.estado !== "disponible" || conjunto.plaza) && <div className="fi-avisos">
          {property.estado === "apartada" && <p className="fi-aviso">Apartada. Si quieres, te escribimos si se libera y te mostramos opciones parecidas.</p>}
          {property.estado === "rentada" && <p className="fi-aviso">Esta propiedad ya fue rentada. Podemos mostrarte opciones similares.</p>}
          {property.estado === "vendida" && <p className="fi-aviso">Esta propiedad ya se vendió. Podemos mostrarte opciones similares.</p>}
          {conjunto.plaza && <p className="fi-aviso">Forma parte de <Link href={`/inventario/${conjunto.plaza.slug}`}>{conjunto.plaza.titulo}</Link>.</p>}
        </div>}

        {/* 4. Descripción y lo que ofrece */}
        {(entrada || ofrece.length > 0) && <section className="fi-seccion fi-descripcion" aria-labelledby="fi-desc">
          {entrada && <p className="fi-entrada">{entrada}</p>}
          <div className="fi-desc-cuerpo">
            <div>
              <h2 id="fi-desc" className="fi-etiqueta">Descripción</h2>
              {parrafos.map((parrafo) => <p key={parrafo.slice(0, 32)} className="fi-texto">{parrafo}</p>)}
              {beneficios.length > 0 && <ul className="fi-beneficios">
                {beneficios.map((b) => <li key={b.titulo}><strong>{b.titulo}</strong>{b.texto && <span>{b.texto}</span>}</li>)}
              </ul>}
            </div>
            {ofrece.length > 0 && <div className="fi-ofrece">
              {ofrece.map((grupo) => (
                <div key={grupo.titulo}>
                  <h3 className="fi-etiqueta">{grupo.titulo}</h3>
                  <ul>{grupo.elementos.map((e) => <li key={e}><svg aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>{e}</li>)}</ul>
                </div>
              ))}
            </div>}
          </div>
        </section>}

        {/* 5. Ficha técnica y documentos */}
        {(ficha.length > 0 || documentos.length > 0 || datosRenta.length > 0) && <section className="fi-seccion fi-tecnica" aria-labelledby="fi-tec">
          <div>
            <h2 id="fi-tec" className="fi-h2">Ficha técnica</h2>
            <dl className="fi-tabla">
              {ficha.map((row) => <div key={row.label}>
                <dt>{row.label}</dt>
                <dd>{row.value}{row.source && <span className={"fi-fuente" + (row.confirmed ? " is-confirmada" : "")}>{row.source}</span>}</dd>
              </div>)}
              {datosRenta.map((d) => <div key={d.dato}><dt>{d.dato}</dt><dd>{d.valor}</dd></div>)}
              {property.informacionPublica?.ocupacionEntrega && <div><dt>Entrega</dt><dd>{property.informacionPublica.ocupacionEntrega}</dd></div>}
            </dl>
            <p className="fi-nota">{revisada ? `Disponibilidad revisada el ${revisada}. ` : ""}Confírmala antes de programar una visita.</p>
          </div>
          {documentos.length > 0 && <div id="documentos" className="fi-documentos">
            <PropertyDocuments documentos={documentos} slug={property.slug} codigo={property.codigo} />
          </div>}
        </section>}
      </div>

      {/* 6. Mapa de la zona, a todo lo ancho */}
      <section className="fi-mapa" aria-labelledby="fi-zona">
        <iframe src={`https://www.google.com/maps?q=${consultaMapa}&z=14&output=embed`} title={`Mapa de ${property.zona}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        <div className="fi-mapa-tarjeta">
          <h2 id="fi-zona" className="fi-mapa-zona">{property.zona}</h2>
          <p>Zona aproximada. La ubicación exacta se comparte al agendar la visita.</p>
          <a href={`https://www.google.com/maps/search/?api=1&query=${consultaMapa}`} target="_blank" rel="noopener noreferrer" className="s-btn s-btn-contorno s-btn-chico">Abrir en Maps</a>
        </div>
      </section>

      <div className="s-contenedor">
        {/* 7. Qué hay alrededor */}
        {alrededor.length > 0 && <section className="fi-seccion" aria-labelledby="fi-alrededor">
          <h2 id="fi-alrededor" className="fi-h2">Qué hay alrededor</h2>
          <div className="fi-alrededor">
            {alrededor.map((grupo) => (
              <div key={grupo.titulo}>
                <h3 className="fi-h3">{grupo.titulo}</h3>
                <ul>{grupo.lugares.map((l) => <li key={l.lugar}><span>{l.lugar}</span><span className="fi-minutos">{l.minutos} min</span></li>)}</ul>
              </div>
            ))}
          </div>
          <p className="fi-nota">Tiempos aproximados en auto.</p>
        </section>}

        {/* 8. Herramientas con el precio del inmueble */}
        {conHerramientas && property.precio.modalidad === "publico" && <section className="fi-seccion" aria-labelledby="fi-numeros">
          <h2 id="fi-numeros" className="fi-h2">{property.operacion === "renta" ? "Lo que pagas para entrar" : "Haz tus números"}</h2>
          <FichaHerramientas precio={property.precio.monto} operacion={property.operacion} credito={property.creditoDisponible}
            zona={property.zona} mantenimientoMensual={costos.mantenimientoMensual} />
        </section>}

        {/* 9–10. Preguntas y asesor */}
        <section className="fi-seccion fi-contacto" aria-labelledby="fi-preguntas">
          <div>
            <h2 id="fi-preguntas" className="fi-h2">Antes de visitarla</h2>
            <div className="fi-preguntas">
              {[
                { q: "¿Cómo agendo una visita?", a: "Propón un día junto al asesor. Te confirmamos la hora." },
                { q: property.operacion === "renta" ? "¿Qué piden para rentar?" : "¿Puedo comprar con crédito hipotecario?", a: property.operacion === "renta" ? "Identificación, comprobante de ingresos y, según el dueño, aval o póliza jurídica." : property.creditoDisponible ? "Sí, el dueño acepta crédito. El banco confirma la aprobación y las condiciones." : "No: este inmueble se vende de contado." },
                { q: "¿El precio es negociable?", a: "Haz tu oferta por escrito y te damos la respuesta del dueño." },
                { q: property.operacion === "renta" ? "¿Hay gastos además de la renta?" : "¿Qué gastos hay además del precio?", a: property.operacion === "renta" ? "El depósito en garantía y, si aplica, el mantenimiento. Te los confirmamos antes de firmar." : "El impuesto de adquisición, el registro, la notaría y, con crédito, el avalúo y la apertura." },
              ].map((item) => (
                <details key={item.q} className="fi-pregunta">
                  <summary><span>{item.q}</span><svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg></summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
          <aside aria-label="Visita y contacto">
            {cerrada ? <div id="interes" className="fa">
              <p className="fa-titulo">{property.estado === "vendida" ? "Ya se vendió." : "Ya se rentó."}</p>
              <p className="fa-guia">Te mostramos opciones parecidas o te avisamos cuando llegue algo similar.</p>
              <Link href={`/inventario?op=${property.operacion}`} className="s-btn s-btn-relleno s-btn-grande fa-cta">Ver opciones parecidas</Link>
              {(contact.whatsapp || contact.phoneHref || contact.emailHref) ? <div className="fa-canales">
                {contact.whatsapp && <a href={contact.whatsapp} target="_blank" rel="noopener noreferrer" className="s-btn s-btn-contorno s-btn-chico">WhatsApp</a>}
                {contact.phoneHref && <a href={contact.phoneHref} className="s-btn s-btn-contorno s-btn-chico">Llamar</a>}
                {contact.emailHref && <a href={contact.emailHref} className="s-btn s-btn-contorno s-btn-chico">Correo</a>}
              </div> : null}
            </div> : <FichaAsesor slug={property.slug} codigo={property.codigo} titulo={property.titulo}
              asesor={asesor ? { nombre: asesor.nombre, cargo: asesor.cargo, iniciales: asesor.iniciales } : undefined}
              canales={{ whatsapp: contact.whatsapp, phoneHref: contact.phoneHref, emailHref: contact.emailHref }} />}
          </aside>
        </section>

        {/* 11. Locales de la plaza y propiedades parecidas */}
        {conjunto.locales.length > 0 && <section className="fi-seccion" aria-labelledby="fi-locales">
          <h2 id="fi-locales" className="fi-h2">Locales de esta plaza</h2>
          <div className="fi-tarjetas">{conjunto.locales.map((p) => <TarjetaPropiedad key={p.slug} property={p} />)}</div>
        </section>}
        {related.length > 0 && <section className="fi-seccion" aria-labelledby="fi-parecidas">
          <h2 id="fi-parecidas" className="fi-h2">También te puede interesar</h2>
          <div className="fi-tarjetas">{related.map((p) => <TarjetaPropiedad key={p.slug} property={p} />)}</div>
        </section>}
      </div>

      <FichaBarra asesor={asesor ? { nombre: asesor.nombre, iniciales: asesor.iniciales } : undefined} precio={precio}
        whatsapp={contact.whatsapp || undefined}
        alternativa={cerrada ? { texto: "Ver opciones parecidas", href: `/inventario?op=${property.operacion}` } : undefined} />
    </main>
  );
}
