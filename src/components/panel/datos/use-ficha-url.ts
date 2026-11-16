"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

/**
 * La ficha abierta vive en la dirección (`?ver=<id>`), no en la memoria de la pantalla (AUD-03, G1):
 * se puede recargar, mandar el enlace a un compañero y, en el teléfono, cerrar con Atrás.
 * En la dirección solo van ids internos o folios, nunca nombres ni teléfonos.
 * Quien use este gancho debe estar dentro de <Suspense> (lo exige useSearchParams).
 */
export function useFichaEnDireccion(clave = "ver") {
  const params = useSearchParams();
  const ruta = usePathname();
  const router = useRouter();
  const abierta = params.get(clave);

  const con = useCallback((valor: string | null) => {
    const p = new URLSearchParams(params.toString());
    if (valor === null) p.delete(clave); else p.set(clave, valor);
    const q = p.toString();
    return q ? `${ruta}?${q}` : ruta;
  }, [params, ruta, clave]);

  // Abrir agrega una entrada al historial (Atrás cierra); con una ficha ya abierta (panel lateral) la reemplaza,
  // para que pasar de fila en fila no llene Atrás. Cerrar la reemplaza.
  const abrir = useCallback((id: string) => (abierta ? router.replace : router.push)(con(id), { scroll: false }), [router, con, abierta]);
  const cerrar = useCallback(() => router.replace(con(null), { scroll: false }), [router, con]);

  return { abierta, abrir, cerrar };
}
