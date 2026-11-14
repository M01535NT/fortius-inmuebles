/*
  Siluetas de carga (RP-18, UX-04): en vez de una pantalla en blanco con «Cargando…», bloques del
  tamaño aproximado del contenido. El lector de pantalla oye el texto; el parpadeo suave solo corre
  sin «reducir movimiento».
*/
const bar = "rounded-[var(--radius-control)] bg-[var(--secondary)] motion-safe:animate-pulse";

export function Silhouette({ label, shape = "page" }: { label: string; shape?: "page" | "list" }) {
  return <div role="status" aria-busy="true" className="flex min-w-0 flex-col gap-4" data-silhouette={shape}>
    <span className="sr-only">{label}</span>
    {shape === "page" && <div aria-hidden="true" className="flex flex-col gap-3">
      <div className={`${bar} h-9 w-56 max-w-[70%]`} />
      <div className={`${bar} h-4 w-80 max-w-[85%]`} />
    </div>}
    <div aria-hidden="true" className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: shape === "page" ? 4 : 3 }, (_, i) => <div key={i} className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--card-edge)] bg-card p-5">
        <div className={`${bar} h-5 w-2/5`} />
        <div className={`${bar} h-4 w-4/5`} />
        <div className={`${bar} h-4 w-3/5`} />
      </div>)}
    </div>
  </div>;
}
