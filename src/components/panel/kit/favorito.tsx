"use client";
import { useFavorito, type Favorito } from "@/components/panel/datos/use-mis-preferencias";
import { Icono } from "@/components/panel/icons";
import { useAvisos } from "@/components/panel/kit/avisos";

/** La estrella de un asunto o un inmueble: lo deja en «Favoritos» del menú y del buscador (te sigue en cualquier equipo). */
export function BotonFavorito({ tipo, id, nombre, className = "as-btn as-ico as-gho" }: { tipo: Favorito["tipo"]; id: string; nombre: string; className?: string }) {
  const { es, alternar } = useFavorito(tipo, id, nombre);
  const { avisar } = useAvisos();
  return (
    <button type="button" className={className} data-favorito={es || undefined} aria-pressed={es}
      aria-label={es ? "Quitar de favoritos" : "Agregar a favoritos"} title={es ? "Quitar de favoritos" : "Agregar a favoritos"}
      onClick={() => { alternar().then(() => avisar(es ? "Quitado de favoritos" : "En favoritos"), (e: unknown) => avisar(e instanceof Error ? e.message : "No se pudo guardar.")); }}>
      <Icono nombre="estrella" tamano={18} />
    </button>
  );
}
