"use client";
import type { ReactNode } from "react";

import type { Asesor } from "@/lib/domain/records";
import { fotoDe, inicialesDe } from "@/lib/panel/datos/configuracion";

/** Grupo de Configuración, como el boceto: título pequeño (con una acción a la derecha, si la hay) y su tarjeta. */
export function SeccionConfig({ id, titulo, intro, accion, children }: { id: string; titulo: string; intro?: string; accion?: ReactNode; children: ReactNode }) {
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
