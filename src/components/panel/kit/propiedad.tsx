"use client";
import { useId, type ReactNode } from "react";

import { usePreferencia } from "@/components/panel/almacen";
import { Gesto, Icono, type NombreIcono } from "@/components/panel/icons";

/**
 * Un renglón «dato: valor» (como las propiedades de Notion o Linear): la etiqueta con su ícono a la izquierda y el
 * control a la derecha, que se ve como texto hasta que se pasa el cursor o se enfoca. `children` recibe el id que
 * la etiqueta enlaza. Con `sinEnlace`, la etiqueta no apunta a un control (el control trae su propio nombre).
 */
export function Propiedad({ icono, etiqueta, sinEnlace, children }: {
  icono: NombreIcono; etiqueta: string; sinEnlace?: boolean; children: (id: string) => ReactNode;
}) {
  const id = useId();
  return (
    <div className="pn-prop">
      {sinEnlace
        ? <span className="pn-prop-e" aria-hidden><Icono nombre={icono} tamano={15} />{etiqueta}</span>
        : <label className="pn-prop-e" htmlFor={id}><Icono nombre={icono} tamano={15} aria-hidden />{etiqueta}</label>}
      <div className="pn-prop-v">{children(id)}</div>
    </div>
  );
}

/**
 * Un bloque que se pliega con su resumen a la vista («Para pedirle · 3»). Lo secundario se guarda aquí, nunca se quita.
 * Con `llave`, el panel recuerda si se dejó abierto (en este equipo).
 */
export function Plegable({ icono, titulo, resumen, llave, abiertoAlEmpezar = false, children }: {
  icono: NombreIcono; titulo: string; resumen?: ReactNode; llave?: string; abiertoAlEmpezar?: boolean; children: ReactNode;
}) {
  const id = useId();
  const [guardado, guardar] = usePreferencia(llave ? `fortius-panel-plegable-${llave}` : `fortius-panel-plegable-${id}`, abiertoAlEmpezar ? "si" : "no");
  const abierto = guardado === "si";
  return (
    <section className="pn-plegable" data-abierto={abierto}>
      <h2 className="m-0">
        <button type="button" className="pn-plegable-cab" aria-expanded={abierto} aria-controls={`${id}-c`} onClick={() => guardar(abierto ? "no" : "si")}>
          <Icono nombre={icono} tamano={17} aria-hidden />
          <span>{titulo}</span>
          {resumen ? <span className="pn-plegable-res">{resumen}</span> : null}
          <Gesto nombre="abajo" tamano={16} className="pn-plegable-flecha" aria-hidden />
        </button>
      </h2>
      <div id={`${id}-c`} className="pn-plegable-cuerpo" hidden={!abierto}>{children}</div>
    </section>
  );
}
