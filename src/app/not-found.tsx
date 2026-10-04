import { DocumentLink } from "@/components/navigation/document-link";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] items-center bg-background px-5 py-32 text-foreground">
      <div className="mx-auto w-full max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-[0.08em] text-primary">404</p>
        <h1 className="display-title mt-4 text-4xl md:text-6xl">Página no encontrada.</h1>
        <p className="mt-4 max-w-[52ch] leading-7 text-muted-foreground">
          La dirección puede haber cambiado o el contenido ya no está disponible.
        </p>
        <DocumentLink
          href="/"
          className="mt-7 inline-flex min-h-11 items-center rounded-md bg-primary px-5 font-semibold text-primary-foreground"
        >
          Volver al inicio
        </DocumentLink>
      </div>
    </main>
  );
}
