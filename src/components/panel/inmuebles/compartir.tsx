"use client";
import { Gesto } from "@/components/panel/icons";
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

/** En la fila: el mismo compartir sin abrir la ficha. */
export function MenuCompartirFila({ inmueble }: { inmueble: Property }) {
  const { avisar } = useAvisos();
  const copiar = copiarCon(avisar);
  const origen = typeof window === "undefined" ? "http://localhost" : window.location.origin;
  const c = compartirInmueble(inmueble, origen);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="pn-iconbtn" aria-label={`Compartir ${inmueble.titulo}`}>
        <Gesto nombre="puntos" tamano={18} />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {c.publico ? (
          <>
            <DropdownMenuItem asChild><a href={c.whatsapp} target="_blank" rel="noopener noreferrer">Compartir por WhatsApp</a></DropdownMenuItem>
            <DropdownMenuItem onSelect={() => copiar(c.texto, "Texto y enlace copiados")}>Copiar enlace</DropdownMenuItem>
            <DropdownMenuItem asChild><a href={c.pdf} target="_blank" rel="noopener noreferrer">Ficha en PDF</a></DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        ) : null}
        <DropdownMenuItem onSelect={() => copiar(new URL(rutaInmueble(inmueble.codigo), origen).toString(), "Enlace a la ficha copiado")}>Copiar enlace para el equipo</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
