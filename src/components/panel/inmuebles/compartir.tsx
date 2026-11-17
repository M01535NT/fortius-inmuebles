"use client";
import { Icono } from "@/components/panel/icons";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Boton } from "@/components/panel/kit/boton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/panel/ui/dropdown-menu";
import type { Property } from "@/data/propiedades";
import { compartirInmueble } from "@/lib/panel/datos/compartir";
import { rutaInmueble } from "@/lib/panel/datos/relacionado";

const copiarCon = (avisar: (t: string) => void) => (texto: string, aviso: string) =>
  navigator.clipboard?.writeText(texto).then(() => avisar(aviso), () => avisar("No se pudo copiar"));

/** En la ficha: compartir es lo que más hace el asesor, así que va arriba y a un toque. */
export function CompartirInmueble({ inmueble }: { inmueble: Property }) {
  const { avisar } = useAvisos();
  const copiar = copiarCon(avisar);
  const c = compartirInmueble(inmueble, window.location.origin);
  if (!c.publico) {
    return (
      <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
        <p className="pn-sub" style={{ margin: 0 }}>{c.motivo}</p>
        <div><Boton variante="secundario" onClick={() => copiar(new URL(rutaInmueble(inmueble.codigo), window.location.origin).toString(), "Enlace a la ficha copiado")}>Copiar enlace para el equipo</Boton></div>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
      <a className="pn-btn pn-btn-primario" href={c.whatsapp} target="_blank" rel="noopener noreferrer">Compartir por WhatsApp</a>
      <Boton variante="secundario" onClick={() => copiar(c.texto, "Texto y enlace copiados")}>Copiar enlace</Boton>
      <a className="pn-btn pn-btn-secundario" href={c.pdf} target="_blank" rel="noopener noreferrer">Ficha en PDF</a>
    </div>
  );
}

/**
 * Compartir del boceto, en la fila, en la tarjeta o en el detalle: WhatsApp, enlace de la ficha y PDF, sin abrirla.
 * Sin publicar, las tres opciones se ven apagadas con el motivo; el enlace para el equipo siempre está.
 */
export function MenuCompartirFila({ inmueble, boton = "icono" }: { inmueble: Property; boton?: "icono" | "redondo" | "principal" }) {
  const { avisar } = useAvisos();
  const copiar = copiarCon(avisar);
  const origen = typeof window === "undefined" ? "http://localhost" : window.location.origin;
  const c = compartirInmueble(inmueble, origen);
  const clase = boton === "principal" ? "pn-btn pn-btn-primario" : "pn-iconbtn";
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className={clase} aria-label={boton === "principal" ? undefined : `Compartir ${inmueble.titulo}`} title="Compartir"
        style={boton === "redondo" ? { borderRadius: 999, background: "var(--card)", border: "1px solid var(--border)" } : undefined}>
        <Icono nombre="compartir" tamano={18} />{boton === "principal" ? "Compartir" : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        {c.publico ? (
          <>
            <DropdownMenuItem asChild><a href={c.whatsapp} target="_blank" rel="noopener noreferrer">Enviar por WhatsApp</a></DropdownMenuItem>
            <DropdownMenuItem onSelect={() => copiar(c.texto, "Enlace copiado")}>Copiar enlace de la ficha</DropdownMenuItem>
            <DropdownMenuItem asChild><a href={c.pdf} target="_blank" rel="noopener noreferrer">Ficha en PDF</a></DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem disabled>Enviar por WhatsApp</DropdownMenuItem>
            <DropdownMenuItem disabled>Copiar enlace de la ficha</DropdownMenuItem>
            <DropdownMenuItem disabled>Ficha en PDF</DropdownMenuItem>
            <p style={{ margin: 0, padding: "6px 8px", fontSize: 12, color: "var(--ink-muted)", maxWidth: 240 }}>{c.motivo}</p>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => copiar(new URL(rutaInmueble(inmueble.codigo), origen).toString(), "Enlace a la ficha copiado")}>Copiar enlace para el equipo</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
