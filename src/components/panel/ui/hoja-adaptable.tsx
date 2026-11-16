"use client";
import { useEffect, useLayoutEffect, useRef, useSyncExternalStore, type ReactNode } from "react";

import { Dialog as D } from "radix-ui";

import { Gesto } from "@/components/panel/icons";
import { useAtajo } from "@/components/panel/kit/atajos";
import { cn } from "@/lib/panel/utils";

import { contenedorPanel } from "./contenedor";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "./drawer";

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
 */
export function HojaAdaptable({ abierta, alCerrar, titulo, descripcion, children }: {
  abierta: boolean; alCerrar: () => void; titulo: string; descripcion?: string; children: ReactNode;
}) {
  const telefono = useEsTelefono();
  const ancho = useEsAncho();
  const cambiar = (o: boolean) => { if (!o) alCerrar(); };
  // Radix devuelve el foco al botón que abrió; aquí abre una fila (o la dirección), así que se guarda a mano.
  const previo = useRef<HTMLElement | null>(null);
  // Efecto de diseño: corre antes de que Radix mueva el foco adentro.
  useLayoutEffect(() => {
    if (abierta && document.activeElement instanceof HTMLElement && !document.activeElement.closest("[role=dialog]")) previo.current = document.activeElement;
  }, [abierta]);
  // Si mientras está abierta se pasó a otra fila (J y K en Asuntos), al cerrar el foco vuelve a la fila que se veía.
  useEffect(() => {
    if (!abierta) return;
    const actual = document.querySelector<HTMLElement>("main .pn-fila[aria-current=true]");
    if (actual) previo.current = actual;
  }, [abierta, titulo]);
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
  }, { activo: abierta && ancho && !telefono });
  const regresarFoco = (e: Event) => {
    const el = previo.current;
    if (el && el.isConnected) { e.preventDefault(); el.focus(); }
  };

  // Escritorio ancho (sugerencia 5, DECISIONES.md): el detalle va en un panel a la derecha que no tapa la lista.
  // No es modal: se puede pasar a otra fila (con el ratón o con J/K y Enter) y el panel cambia de contenido.
  // Se cierra con Esc o con la X; el foco se queda en la lista.
  if (ancho && !telefono) {
    return (
      <D.Root open={abierta} onOpenChange={cambiar} modal={false}>
        <D.Portal container={contenedorPanel()}>
          <D.Content
            ref={lateral}
            data-lateral=""
            onOpenAutoFocus={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
            onCloseAutoFocus={regresarFoco}
            className={cn(
              "fixed inset-y-0 right-0 z-40 flex w-[440px] flex-col border-l border-border bg-popover text-popover-foreground outline-none",
              "data-[state=open]:animate-in data-[state=open]:slide-in-from-right-4 data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 duration-200 motion-reduce:animate-none",
            )}
          >
            <div className="flex items-start gap-2 border-b border-border px-6 pb-4 pt-5">
              <D.Title className="min-w-0 flex-1 pt-2 text-lg font-semibold">{titulo}</D.Title>
              <D.Close className="grid size-11 shrink-0 place-items-center rounded-[var(--r-md)] text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring" aria-label="Cerrar">
                <Gesto nombre="cerrar" tamano={18} />
              </D.Close>
            </div>
            {descripcion ? <D.Description className="px-6 pt-3 text-sm text-muted-foreground">{descripcion}</D.Description> : <D.Description className="sr-only">{titulo}</D.Description>}
            <div data-cuerpo="" className="flex-1 overflow-y-auto overscroll-contain px-6 pb-6 pt-2">{children}</div>
          </D.Content>
        </D.Portal>
      </D.Root>
    );
  }

  if (telefono) {
    return (
      <Drawer open={abierta} onOpenChange={cambiar}>
        <DrawerContent onCloseAutoFocus={regresarFoco}>
          <DrawerTitle className="pr-12">{titulo}</DrawerTitle>
          {descripcion ? <DrawerDescription>{descripcion}</DrawerDescription> : <DrawerDescription className="sr-only">{titulo}</DrawerDescription>}
          <div className="overflow-y-auto overscroll-contain px-4 pb-4">{children}</div>
        </DrawerContent>
      </Drawer>
    );
  }
  return (
    <Dialog open={abierta} onOpenChange={cambiar}>
      <DialogContent onCloseAutoFocus={regresarFoco} className="max-h-[88dvh] max-w-xl grid-rows-[auto_auto_1fr] overflow-hidden">
        <DialogTitle>{titulo}</DialogTitle>
        {descripcion ? <DialogDescription>{descripcion}</DialogDescription> : <DialogDescription className="sr-only">{titulo}</DialogDescription>}
        <div className="-mx-6 overflow-y-auto overscroll-contain px-6">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
