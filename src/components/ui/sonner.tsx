"use client";
import * as React from "react";
import { Toaster } from "sonner";

/*
  Avisos del panel con Sonner (DEC-52): abajo al centro, uno sobre otro, se apilan y se retiran con
  un gesto. Se monta una vez dentro de `.admin-root` (admin-shell) para heredar letra y colores.
  `useToasterReady` dice si ya está montado: sin él (pantallas sueltas o pruebas), cada aviso se
  muestra en su lugar, con el mismo contenido y comportamiento.
*/
export const PANEL_TOASTER = "panel";

let mounted = 0;
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb); }; };
export function useToasterReady() { return React.useSyncExternalStore(subscribe, () => mounted > 0, () => false); }

export function PanelToaster() {
  React.useEffect(() => {
    mounted += 1; listeners.forEach(cb => cb());
    return () => { mounted -= 1; listeners.forEach(cb => cb()); };
  }, []);
  return <Toaster id={PANEL_TOASTER} position="bottom-center" offset={24} mobileOffset={{ bottom: 88 }} gap={8} visibleToasts={3}
    containerAriaLabel="Avisos" toastOptions={{ unstyled: true, className: "w-full flex justify-center" }} />;
}
