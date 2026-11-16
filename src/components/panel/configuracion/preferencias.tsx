"use client";
import { useId } from "react";

import { usePreferencia } from "@/components/panel/almacen";
import { Desplegable } from "@/components/panel/kit/desplegable";
import { Switch } from "@/components/panel/ui/switch";
import {
  AVISOS, CLAVE_AVISOS, CLAVE_TEMA, escribirAvisos, leerAvisos, temaAGuardar, temaValido, TEMAS, type ClaveAviso,
} from "@/lib/panel/datos/configuracion";

import { SeccionConfig } from "./partes";

/** Apariencia: la misma preferencia que lee el armazón del panel (`fortius-theme`), así que el cambio se ve al instante. */
export function SeccionApariencia() {
  const [tema, guardar] = usePreferencia(CLAVE_TEMA, "auto");
  return (
    <SeccionConfig id="conf-apariencia" titulo="Apariencia" intro="Se recuerda en este navegador.">
      <div className="pn-conf-caja">
        <Desplegable etiqueta="Tema" valor={temaValido(tema)} opciones={TEMAS} alElegir={(v) => guardar(temaAGuardar(temaValido(v)))} />
      </div>
    </SeccionConfig>
  );
}

/**
 * Avisos: mientras el panel no mande avisos fuera de la pantalla, no se ofrecen interruptores que no hagan nada
 * (revisión móvil, 16/11/2026). Los cuatro interruptores (`AVISOS` en `configuracion.ts`) vuelven cuando haya envío.
 */
export function SeccionAvisos() {
  return (
    <SeccionConfig id="conf-avisos" titulo="Avisos">
      <div className="pn-conf-caja">
        <p className="pn-conf-nota">Por ahora lo pendiente se ve en Hoy. Los avisos al teléfono o por correo llegan pronto.</p>
      </div>
    </SeccionConfig>
  );
}

/** Interruptor de un aviso, listo para cuando haya envío. */
export function FilaAvisoPreferencia({ clave }: { clave: ClaveAviso }) {
  const [crudo, guardar] = usePreferencia(CLAVE_AVISOS, "");
  const avisos = leerAvisos(crudo);
  const a = AVISOS.find((x) => x.clave === clave);
  if (!a) return null;
  return <FilaAviso titulo={a.titulo} texto={a.texto} activo={avisos[clave]} alCambiar={(v) => guardar(escribirAvisos({ ...avisos, [clave]: v }))} />;
}

function FilaAviso({ titulo, texto, activo, alCambiar }: { titulo: string; texto: string; activo: boolean; alCambiar: (v: boolean) => void }) {
  const id = useId();
  return (
    <div className="pn-conf-aviso">
      <label htmlFor={id}><span>{titulo}</span><span id={`${id}-txt`}>{texto}</span></label>
      <Switch id={id} checked={activo} onCheckedChange={alCambiar} aria-describedby={`${id}-txt`} />
    </div>
  );
}
