"use client";
import { useId, useState, useSyncExternalStore } from "react";

import { usePreferencia } from "@/components/panel/almacen";
import { Boton } from "@/components/panel/kit/boton";
import { Desplegable } from "@/components/panel/kit/desplegable";
import { puedeAvisarElNavegador, useRecordatorios } from "@/components/panel/kit/recordatorios";
import { Switch } from "@/components/panel/ui/switch";
import {
  AVISOS, CLAVE_AVISOS, CLAVE_TEMA, escribirAvisos, leerAvisos, temaAGuardar, temaValido, TEMAS, type ClaveAviso,
} from "@/lib/panel/datos/configuracion";

import { SeccionConfig } from "./partes";

/** Apariencia: la misma preferencia que lee el armazón del panel (`fortius-theme`), así que el cambio se ve al instante. */
export function SeccionApariencia() {
  const [tema, guardar] = usePreferencia(CLAVE_TEMA, "auto");
  return (
    <SeccionConfig id="conf-apariencia" titulo="Apariencia">
      <Desplegable etiqueta="Tema" valor={temaValido(tema)} opciones={TEMAS} alElegir={(v) => guardar(temaAGuardar(temaValido(v)))} ayuda="Se recuerda en este navegador." />
    </SeccionConfig>
  );
}

/**
 * Avisos, como el boceto: un interruptor por cada aviso. Con el panel abierto, cada aviso encendido sale como
 * notificación de este navegador si se dio permiso (se pide aquí con un botón); sin permiso, solo el número de Inicio.
 * Los avisos al teléfono o por correo con el panel cerrado todavía no existen, y se dice debajo.
 */
export function SeccionAvisos() {
  return (
    <SeccionConfig id="conf-avisos" titulo="Avisos">
      <div className="pn-conf-tarjeta">
        {AVISOS.map((a) => <FilaAvisoPreferencia key={a.clave} clave={a.clave} />)}
      </div>
      <PermisoNavegador />
    </SeccionConfig>
  );
}

type Permiso = "sin-soporte" | NotificationPermission;
const sinCambios = () => () => undefined;
const permisoActual = (): Permiso => (puedeAvisarElNavegador() ? Notification.permission : "sin-soporte");

/** El permiso de este navegador para mostrar los avisos mientras el panel está abierto. */
function PermisoNavegador() {
  const { revisar } = useRecordatorios();
  // Lo que dice el navegador al abrir; después de pedirlo, lo que respondió.
  const alAbrir = useSyncExternalStore(sinCambios, permisoActual, () => null);
  const [respuesta, setPermiso] = useState<Permiso | null>(null);
  const permiso = respuesta ?? alAbrir;
  if (permiso === null) return null;
  const pedir = () => {
    void Notification.requestPermission().then((p) => { setPermiso(p); if (p === "granted") revisar(); });
  };
  return (
    <>
      <p className="pn-conf-intro">
        {permiso === "granted" ? "Con el panel abierto, los avisos encendidos salen en este navegador. Lo pendiente también se cuenta junto a Inicio."
          : permiso === "denied" ? "Este navegador tiene bloqueados los avisos del panel; se activan desde los permisos del sitio en el navegador. Mientras, lo pendiente se cuenta junto a Inicio."
          : permiso === "sin-soporte" ? "Este navegador no muestra avisos; lo pendiente se cuenta junto a Inicio."
          : "Lo pendiente se cuenta junto a Inicio. Para que los avisos salgan en este navegador mientras el panel está abierto, dale permiso."}
        {" "}Los avisos al teléfono o por correo con el panel cerrado llegan después.
      </p>
      {permiso === "default" ? (
        <div className="pn-conf-acciones"><Boton variante="secundario" onClick={pedir}>Permitir avisos en este navegador</Boton></div>
      ) : null}
    </>
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
