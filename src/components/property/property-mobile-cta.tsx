/*
  Barra fija inferior en mobile para el detalle de propiedad.
  TODO (T031): agregar WhatsApp y llamada cuando exista contacto real.
*/
export function PropertyMobileCta() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 pb-[calc(env(safe-area-inset-bottom)+12px)] backdrop-blur md:hidden">
      <div className="flex gap-2.5">
        <a
          href="#interes"
          className="flex h-12 flex-1 items-center justify-center rounded-md bg-primary text-[15px] font-semibold text-primary-foreground active:scale-[0.99]"
        >
          Me interesa
        </a>
        <a
          href="/#evaluar"
          className="flex h-12 flex-1 items-center justify-center rounded-md border border-border text-[15px] font-medium text-foreground active:scale-[0.99]"
        >
          Agendar visita
        </a>
      </div>
    </div>
  );
}
