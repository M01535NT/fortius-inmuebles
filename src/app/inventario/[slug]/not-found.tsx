import { DocumentLink } from "@/components/navigation/document-link";
import { CabezaPagina } from "@/components/sitio/pagina";

/*
  Ficha que ya no existe o se despublicó, rediseño del sitio (etapa 7, 17/11/2026): quien llega por un
  enlace compartido sabe qué pasó y tiene a dónde ir. El título de la pestaña lo pone la ficha.
*/
export default function PropiedadNoEncontrada() {
  return (
    <main className="s-pagina">
      <CabezaPagina titulo="Esta propiedad ya no está publicada." entrada="Pudo venderse, rentarse o salir del inventario. Te mostramos las que siguen disponibles.">
        <DocumentLink href="/inventario" className="s-btn s-btn-relleno">Ver propiedades disponibles</DocumentLink>
        <DocumentLink href="/contacto" className="s-btn s-btn-contorno">Hablar con un asesor</DocumentLink>
      </CabezaPagina>
    </main>
  );
}
