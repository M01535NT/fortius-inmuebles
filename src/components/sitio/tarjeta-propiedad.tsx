import Image from "next/image";
import Link from "next/link";

import { Distintivo } from "@/components/sitio/distintivo";
import { FlechaDerecha } from "@/components/sitio/iconos";
import { ESTADO_LABELS, formatPrecio, OPERACION_LABELS, TIPO_LABELS, type Property } from "@/data/propiedades";

export type VistaTarjeta = "cuadricula" | "lista" | "compacta";

/** Recámaras, baños y superficie en una línea; si no hay, el tipo. */
export function datosDePropiedad(property: Property): string {
  const datos = [
    property.ficha.recamaras ? `${property.ficha.recamaras} rec.` : null,
    property.ficha.banos ? `${property.ficha.banos} ${property.ficha.banos === 1 ? "baño" : "baños"}` : null,
    property.ficha.construccionM2 ? `${property.ficha.construccionM2} m² const.` : property.ficha.terrenoM2 ? `${property.ficha.terrenoM2} m² terreno` : null,
  ].filter(Boolean);
  return datos.length ? datos.join(" · ") : TIPO_LABELS[property.tipo];
}

/**
  Tarjeta de propiedad del lienzo: foto, operación, nombre, zona, tipo, precio y datos.
  Tres vistas: cuadrícula (inventario e inicio), lista (filas anchas) y compacta (junto al mapa).
  Solo recibe inmuebles publicados; la dirección exacta nunca llega aquí.
*/
export function TarjetaPropiedad({ property, vista = "cuadricula", prioridad = false }: { property: Property; vista?: VistaTarjeta; prioridad?: boolean }) {
  const href = `/inventario/${property.slug}`;
  const foto = property.galeria[0];
  const disponible = property.estado === "disponible";
  const operacion = OPERACION_LABELS[property.operacion];
  const estado = disponible ? null : ESTADO_LABELS[property.estado];
  const sello = property.demo ? "Ejemplo" : estado;
  const tonoSello = property.estado === "vendida" || property.estado === "rentada" ? "error" : property.demo ? "media" : "aviso";
  const precio = formatPrecio(property.precio);
  const tipo = TIPO_LABELS[property.tipo];
  const datos = datosDePropiedad(property);
  const cls = ["s-tarjeta", vista === "cuadricula" ? "" : `s-tarjeta-${vista}`, disponible ? "" : "s-tarjeta-apagada"].filter(Boolean).join(" ");
  const sizes = vista === "lista" ? "(max-width: 639px) 100vw, 220px" : vista === "compacta" ? "(max-width: 639px) 50vw, 240px" : "(max-width: 639px) 100vw, (max-width: 1199px) 50vw, 440px";

  const imagen = (
    <span className="s-tarjeta-foto">
      {foto ? <Image src={foto.src} alt={foto.alt} fill sizes={sizes} loading={prioridad ? "eager" : "lazy"} /> : null}
      {vista === "cuadricula" ? <Distintivo tono="claro" className="s-tarjeta-op">{operacion}</Distintivo> : null}
      {vista === "cuadricula" && sello ? <Distintivo tono={property.demo ? "media" : tonoSello} className="s-tarjeta-sello">{sello}</Distintivo> : null}
    </span>
  );

  if (vista === "lista") {
    return (
      <Link href={href} className={cls}>
        {imagen}
        <span className="s-tarjeta-cuerpo">
          <span className="s-tarjeta-zona">{[operacion, property.zona, tipo, sello].filter(Boolean).join(" · ")}</span>
          <span className="s-tarjeta-titulo">{property.titulo}</span>
          <span className="s-tarjeta-zona">{datos}</span>
        </span>
        <span className="s-tarjeta-lado">
          <span className="s-tarjeta-precio">{precio}</span>
          <span className="s-enlace">Ver la propiedad<FlechaDerecha /></span>
        </span>
      </Link>
    );
  }

  if (vista === "compacta") {
    return (
      <Link href={href} className={cls}>
        {imagen}
        <span className="s-tarjeta-nombre">
          <span className="s-tarjeta-precio">{precio}</span>
          <span className="s-tarjeta-titulo">{property.titulo}</span>
          <span className="s-tarjeta-zona">{property.zona}</span>
        </span>
      </Link>
    );
  }

  return (
    <Link href={href} className={cls}>
      {imagen}
      <span className="s-tarjeta-cabeza">
        <span className="s-tarjeta-nombre">
          <span className="s-tarjeta-titulo">{property.titulo}</span>
          <span className="s-tarjeta-zona">{property.zona} · {tipo}</span>
        </span>
        <span className="s-tarjeta-precio">{precio}</span>
      </span>
      <span className="s-tarjeta-datos">{datos}</span>
    </Link>
  );
}
