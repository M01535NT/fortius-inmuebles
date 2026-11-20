"use client";
import { createContext, useContext, type ReactNode } from "react";

import type { Asesor } from "@/lib/domain/records";
import { fotoDe, inicialesDe } from "@/lib/panel/datos/configuracion";

/**
 * Dentro de Configuración (modelo visual «Ajustes») cada sección se ve sola en la columna principal: su título es el
 * título de la página (22 px) con una línea que explica para qué sirve. Fuera de ahí, es un grupo con título pequeño.
 */
const EnAjustes = createContext<{ subtitulo?: string } | null>(null);
export function SeccionPrincipal({ subtitulo, children }: { subtitulo?: string; children: ReactNode }) {
  return <EnAjustes.Provider value={{ subtitulo }}>{children}</EnAjustes.Provider>;
}

/** Grupo de Configuración, como el boceto: título pequeño (con una acción a la derecha, si la hay) y su tarjeta. */
export function SeccionConfig({ id, titulo, intro, accion, children }: { id: string; titulo: string; intro?: string; accion?: ReactNode; children: ReactNode }) {
  const principal = useContext(EnAjustes);
  if (principal) {
    return (
      <section className="pn-conf-seccion aj-seccion" aria-labelledby={id}>
        <div className="aj-cab">
          <div className="aj-cab-t">
            <h1 id={id}>{titulo}</h1>
            {principal.subtitulo ? <p>{principal.subtitulo}</p> : null}
          </div>
          {accion}
        </div>
        {intro ? <p className="pn-conf-intro">{intro}</p> : null}
        {children}
      </section>
    );
  }
  return (
    <section className="pn-conf-seccion" aria-labelledby={id}>
      {accion ? <div className="pn-conf-cab"><h2 id={id}>{titulo}</h2>{accion}</div> : <h2 id={id}>{titulo}</h2>}
      {intro ? <p className="pn-conf-intro">{intro}</p> : null}
      {children}
    </section>
  );
}

/** Foto del perfil público si existe; si no, las iniciales. */
export function FotoAsesor({ asesor, nombre, chica }: { asesor?: Pick<Asesor, "perfilPublico" | "iniciales"> | null; nombre: string; chica?: boolean }) {
  const foto = asesor ? fotoDe(asesor) : null;
  const clase = `pn-conf-foto${chica ? " pn-conf-foto-chica" : ""}`;
  // eslint-disable-next-line @next/next/no-img-element -- foto ya publicada en Storage; no pasa por el optimizador de imágenes
  if (foto) return <img src={foto} alt="" className={clase} />;
  return <span className={clase} aria-hidden>{inicialesDe(nombre)}</span>;
}
