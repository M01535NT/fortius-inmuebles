export default function Loading() {
  return (
    <main className="min-h-[70vh] bg-background px-5 py-32 text-foreground">
      <div className="mx-auto max-w-[1280px]" role="status" aria-live="polite">
        <p className="font-mono text-xs uppercase tracking-[0.08em] text-primary">Cargando</p>
        <p className="display-title mt-4 text-3xl md:text-4xl">Preparando la información…</p>
      </div>
    </main>
  );
}
