"use client";
import { useEffect, useLayoutEffect, useRef, useSyncExternalStore, type ReactNode } from "react";

import { Dialog as D } from "radix-ui";

import { usePreferencia } from "@/components/panel/almacen";
import { Gesto } from "@/components/panel/icons";
import { useAtajo } from "@/components/panel/kit/atajos";
import { cn } from "@/lib/panel/utils";

import { contenedorPanel } from "./contenedor";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "./drawer";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./dropdown-menu";

/** Preferencia de este navegador: el detalle se abre en grande (ventana centrada) en vez del panel lateral. */
const CLAVE_GRANDE = "panel-hoja-grande";

const CONSULTA = "(max-width: 640px)";

function suscribir(aviso: () => void) {
  const mq = window.matchMedia(CONSULTA);
  mq.addEventListener("change", aviso);
  return () => mq.removeEventListener("change", aviso);
}
const enTelefono = () => window.matchMedia(CONSULTA).matches;

/** true en pantallas de 640 px o menos. En el servidor se asume escritorio. */
export function useEsTelefono() {
  return useSyncExternalStore(suscribir, enTelefono, () => false);
}

const ANCHA = "(min-width: 1100px)";
function suscribirAncho(aviso: () => void) {
  const mq = window.matchMedia(ANCHA);
  mq.addEventListener("change", aviso);
  return () => mq.removeEventListener("change", aviso);
}
/** true en escritorio de 1100 px o más, donde cabe el panel lateral junto a la lista. */
export function useEsAncho() {
  return useSyncExternalStore(suscribirAncho, () => window.matchMedia(ANCHA).matches, () => false);
}

/**
 * Ficha o formulario que se abre sobre la pantalla: en el teléfono sube desde abajo y se cierra
 * arrastrándola (vaul); en tableta es una ventana centrada (Radix); en escritorio ancho, un panel a la derecha.
 * Esc cierra; el foco vuelve a la fila que la abrió. En el panel lateral, F6 pasa de la lista al detalle y de vuelta.
 * En escritorio ancho, los tres puntos ofrecen «Abrir en grande» (ventana centrada, como Notion) y «Volver al lateral».
 * Con `volver`, la hoja se abre encima de otra (la persona o el inmueble de un asunto): lleva arriba «Volver a …»,
 * Esc regresa a la de abajo y el foco vuelve al vínculo que la abrió.
 */
export function HojaAdaptable({ abierta, alCerrar, titulo, descripcion, volver, children }: {
  abierta: boolean; alCerrar: () => void; titulo: string; descripcion?: string;
  volver?: { etiqueta: string; alPulsar: () => void };
  children: ReactNode;
}) {
  const telefono = useEsTelefono();
  const ancho = useEsAncho();
  const [preferencia, setPreferencia] = usePreferencia(CLAVE_GRANDE, "0");
  const grande = preferencia === "1";
  const encima = Boolean(volver);
  const cambiar = (o: boolean) => { if (!o) alCerrar(); };
  // Radix devuelve el foco al botón que abrió; aquí abre una fila (o la dirección), así que se guarda a mano.
  const previo = useRef<HTMLElement | null>(null);
  // Efecto de diseño: corre antes de que Radix mueva el foco adentro.
  useLayoutEffect(() => {
    if (abierta && document.activeElement instanceof HTMLElement && (encima || !document.activeElement.closest("[role=dialog]"))) previo.current = document.activeElement;
  }, [abierta, encima]);
  // Si mientras está abierta se pasó a otra fila (J y K en Asuntos), al cerrar el foco vuelve a la fila que se veía.
  useEffect(() => {
    if (!abierta || encima) return;
    const actual = document.querySelector<HTMLElement>("main .pn-fila[aria-current=true]");
    if (actual) previo.current = actual;
  }, [abierta, titulo, encima]);
  // F6 en el panel lateral: de la lista al detalle y de vuelta, sin recorrer la lista con Tab.
  const lateral = useRef<HTMLDivElement | null>(null);
  useAtajo("f6", (e) => {
    const panel = lateral.current;
    if (!panel) return;
    e.preventDefault();
    if (panel.contains(document.activeElement)) { const el = previo.current; if (el && el.isConnected) el.focus(); return; }
    const destino = panel.querySelector<HTMLElement>("[data-cuerpo] :is(a, button, input, select, textarea, [tabindex]):not([tabindex='-1']):not([disabled])")
      ?? panel.querySelector<HTMLElement>("button");
    destino?.focus();
  }, { activo: abierta && ancho && !telefono && !encima });
  const regresarFoco = (e: Event) => {
    const el = previo.current;
    if (el && el.isConnected) { e.preventDefault(); el.focus(); }
  };
  const botonVolver = volver ? (
    <button type="button" onClick={volver.alPulsar} className="pn-btn pn-btn-texto" style={{ alignSelf: "flex-start", gap: 6, paddingInline: 8, marginInline: -8 }}>
      <Gesto nombre="izquierda" tamano={16} />{volver.etiqueta}
    </button>
  ) : null;

  // Escritorio ancho (sugerencia 5, DECISIONES.md): el detalle va en un panel a la derecha que no tapa la lista.
  // No es modal: se puede pasar a otra fila (con el ratón o con J/K y Enter) y el panel cambia de contenido.
  // Se cierra con Esc o con la X; el foco se queda en la lista.
  // En grande (preferencia del navegador): el mismo contenido en una ventana centrada casi a pantalla completa,
  // con el fondo atenuado. Pulsar el fondo, Esc o la X cierra; los tres puntos regresan al lateral.
  if (ancho && !telefono) {
    return (
      <D.Root open={abierta} onOpenChange={cambiar} modal={false}>
        <D.Portal container={contenedorPanel()}>
          {grande ? (
            <div
              aria-hidden
              data-hoja-fondo=""
              onClick={alCerrar}
              className={cn("fixed inset-0 z-40", encima ? "bg-transparent" : "bg-[color-mix(in_oklab,var(--ink)_32%,transparent)]", "data-[state=open]:animate-in data-[state=open]:fade-in-0 duration-200 motion-reduce:animate-none")}
              data-state={abierta ? "open" : "closed"}
            />
          ) : null}
          <D.Content
            ref={lateral}
            data-lateral={grande ? undefined : ""}
            data-grande={grande ? "" : undefined}
            // La lista conserva el foco al abrir; una hoja encima de otra lo recibe (si no, Tab recorrería la de abajo, tapada).
            onOpenAutoFocus={(e) => { if (!encima) e.preventDefault(); }}
            onInteractOutside={(e) => e.preventDefault()}
            onCloseAutoFocus={regresarFoco}
            className={cn(
              "fixed z-40 flex flex-col bg-popover text-popover-foreground outline-none",
              grande
                ? "inset-x-0 top-[3dvh] mx-auto h-[94dvh] w-[calc(100vw-48px)] max-w-[1100px] rounded-[var(--r-xl)] border border-border shadow-[var(--sombra-flota)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.98]"
                : "inset-y-0 right-0 w-[440px] border-l border-border data-[state=open]:animate-in data-[state=open]:slide-in-from-right-4 data-[state=open]:fade-in-0",
              "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 duration-200 motion-reduce:animate-none",
            )}
          >
            <div className={cn("flex flex-col gap-1 border-b border-border pb-4 pt-5", grande ? "px-10" : "px-6")}>
              {botonVolver}
              <div className="flex items-start gap-1">
                <D.Title className="min-w-0 flex-1 pt-2 text-lg font-semibold">{titulo}</D.Title>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger className="grid size-11 shrink-0 place-items-center rounded-[var(--r-md)] text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring" aria-label="Más opciones">
                    <Gesto nombre="puntos" tamano={18} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent onCloseAutoFocus={(e) => { e.preventDefault(); lateral.current?.querySelector<HTMLElement>("[aria-label='Más opciones']")?.focus(); }}>
                    <DropdownMenuItem onSelect={() => setPreferencia(grande ? null : "1")}>
                      <Gesto nombre="panel" tamano={16} />{grande ? "Volver al lateral" : "Abrir en grande"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <D.Close className="grid size-11 shrink-0 place-items-center rounded-[var(--r-md)] text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring" aria-label="Cerrar">
                  <Gesto nombre="cerrar" tamano={18} />
                </D.Close>
              </div>
            </div>
            {descripcion ? <D.Description className={cn("pt-3 text-sm text-muted-foreground", grande ? "px-10" : "px-6")}>{descripcion}</D.Description> : <D.Description className="sr-only">{titulo}</D.Description>}
            <div data-cuerpo="" className={cn("flex-1 overflow-y-auto overscroll-contain pb-6 pt-2", grande ? "px-10" : "px-6")}>
              <div className={grande ? "mx-auto w-full max-w-[760px]" : undefined}>{children}</div>
            </div>
          </D.Content>
        </D.Portal>
      </D.Root>
    );
  }

  if (telefono) {
    return (
      <Drawer open={abierta} onOpenChange={cambiar}>
        <DrawerContent onCloseAutoFocus={regresarFoco}>
          {botonVolver ? <div className="px-4">{botonVolver}</div> : null}
          <DrawerTitle className="pr-12">{titulo}</DrawerTitle>
          {descripcion ? <DrawerDescription>{descripcion}</DrawerDescription> : <DrawerDescription className="sr-only">{titulo}</DrawerDescription>}
          <div className="overflow-y-auto overscroll-contain px-4 pb-4">{children}</div>
        </DrawerContent>
      </Drawer>
    );
  }
  return (
    <Dialog open={abierta} onOpenChange={cambiar}>
      <DialogContent onCloseAutoFocus={regresarFoco} className={cn("max-h-[88dvh] max-w-xl overflow-hidden", volver ? "grid-rows-[auto_auto_auto_1fr]" : "grid-rows-[auto_auto_1fr]")}>
        {botonVolver}
        <DialogTitle>{titulo}</DialogTitle>
        {descripcion ? <DialogDescription>{descripcion}</DialogDescription> : <DialogDescription className="sr-only">{titulo}</DialogDescription>}
        <div className="-mx-6 overflow-y-auto overscroll-contain px-6">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
