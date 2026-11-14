import { DocumentLink } from "@/components/navigation/document-link";

/*
  Ficha que ya no existe o se despublicó: quien llega por un enlace compartido sabe qué pasó
  y tiene a dónde ir. El título de la pestaña lo pone generateMetadata de la ficha.
*/
export default function PropiedadNoEncontrada() {
  return (
    <main className="pg-page">
      <section className="pg-hero nf-hero">
        <div className="pg-container pg-hero-body">
          <h1 className="pg-title">Esta propiedad ya no está publicada.</h1>
          <p className="pg-lead">Pudo venderse, rentarse o salir del inventario. Te mostramos las que siguen disponibles.</p>
          <div className="nf-actions">
            <DocumentLink href="/inventario" className="pg-btn">Ver propiedades disponibles</DocumentLink>
            <DocumentLink href="/contacto" className="pg-btn pg-btn-ghost">Hablar con un asesor</DocumentLink>
          </div>
        </div>
      </section>
    </main>
  );
}
