"use client";
import { useEffect, useState, type FormEvent } from "react";

import { CampoClave } from "@/components/panel/acceso";
import { Gesto, Icono } from "@/components/panel/icons";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Boton } from "@/components/panel/kit/boton";
import { Cargando, EstadoError } from "@/components/panel/kit/estados";
import { Hoja } from "@/components/panel/kit/hoja";
import {
  CLAVE_MINIMO, codigoCompleto, estadoDosPasos, fechaRegistro, limpiarCodigo, pideVolverAEntrar, puedeAgregarDispositivo, revisarClaveNueva,
} from "@/lib/panel/cuenta";
import {
  changePassword, confirmMfaEnrollment, errorMessage, logout, mfaStatus, startMfaEnrollment, type MfaStatus,
} from "@/lib/panel/legado/sesion";

import { SeccionConfig } from "./partes";

/**
 * Seguridad (grupo «Tu cuenta»): cambiar la contraseña y la verificación en dos pasos, con las mismas llamadas y reglas
 * que el provisional. El servidor pide un acceso reciente para las dos cosas; si no lo hay, se dice y se ofrece salir y
 * volver a entrar. Los dos pasos son, por ahora, solo para el director (el servidor lo decide con `available`).
 * Los dispositivos no se quitan desde el panel, igual que en el provisional.
 */
export function SeccionSeguridad() {
  const [cambiando, setCambiando] = useState(false);
  return (
    <SeccionConfig id="conf-seguridad" titulo="Seguridad">
      <div className="pn-conf-tarjeta">
        <button type="button" className="pn-conf-prow" onClick={() => setCambiando(true)} aria-label="Contraseña. Cambiar">
          <span className="pn-conf-k">Contraseña</span><span className="pn-conf-v">Cambiar</span><Gesto nombre="derecha" tamano={18} aria-hidden />
        </button>
      </div>
      <Hoja abierta={cambiando} titulo="Cambiar contraseña" alCerrar={() => setCambiando(false)}>
        {cambiando ? <FormularioClave alTerminar={() => setCambiando(false)} /> : null}
      </Hoja>
      <DosPasos />
    </SeccionConfig>
  );
}

/** Ofrece salir para volver a entrar cuando el servidor lo pide (acceso viejo). */
function VolverAEntrar() {
  const { avisar } = useAvisos();
  return (
    <Boton variante="normal" onClick={() => { logout().catch(() => avisar("No se pudo cerrar la sesión. Vuelve a intentarlo.")); }}>
      Salir y volver a entrar
    </Boton>
  );
}

function FormularioClave({ alTerminar }: { alTerminar: () => void }) {
  const { avisar } = useAvisos();
  const [clave, setClave] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [error, setError] = useState<{ texto: string; reentrar: boolean } | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (ocupado) return;
    const aviso = revisarClaveNueva(clave, confirmacion);
    if (aviso) { setError({ texto: aviso, reentrar: false }); return; }
    setError(null);
    setOcupado(true);
    try {
      await changePassword(clave);
      setClave(""); setConfirmacion("");
      avisar("Listo. Tu contraseña cambió.");
      alTerminar();
    } catch (err) {
      setError({ texto: errorMessage(err), reentrar: pideVolverAEntrar(err) });
    } finally {
      setOcupado(false);
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="pn-seg-form">
      <CampoClave etiqueta="Contraseña nueva" valor={clave} alCambiar={setClave} nueva ayuda={`Al menos ${CLAVE_MINIMO} caracteres.`} enfocar />
      <CampoClave etiqueta="Escríbela otra vez" valor={confirmacion} alCambiar={setConfirmacion} nueva />
      {error ? <p className="pn-seg-error" role="alert"><Icono nombre="alerta" tamano={16} aria-hidden />{error.texto}</p> : null}
      <div className="pn-conf-acciones">
        <Boton type="submit" deshabilitado={ocupado}>{ocupado ? "Guardando…" : "Guardar contraseña"}</Boton>
        {error?.reentrar ? <VolverAEntrar /> : <Boton type="button" variante="texto" onClick={alTerminar}>Cancelar</Boton>}
      </div>
    </form>
  );
}

type Alta = { factorId: string; qr: string; secret: string };

/** La verificación en dos pasos: estado, dispositivos y el alta de uno nuevo (hasta dos). */
function DosPasos() {
  const [estado, setEstado] = useState<MfaStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [abierta, setAbierta] = useState(false);

  // Cada vuelta vuelve a leer el estado (al reintentar o después de registrar un dispositivo).
  const [vuelta, setVuelta] = useState(0);
  const leer = () => { setError(null); setVuelta((v) => v + 1); };

  useEffect(() => {
    let vivo = true;
    mfaStatus().then(
      (r) => { if (vivo) setEstado(r); },
      (e: unknown) => { if (vivo) setError(errorMessage(e)); },
    );
    return () => { vivo = false; };
  }, [vuelta]);

  if (error) {
    return (
      <>
        <h2 className="pn-grupo">Verificación en dos pasos</h2>
        <div className="pn-conf-caja"><EstadoError texto={error} alReintentar={leer} /></div>
      </>
    );
  }
  if (!estado) return <div className="pn-conf-caja"><Cargando lineas={1} etiqueta="Cargando la verificación en dos pasos" /></div>;
  // Solo el director (lo decide el servidor); para los demás no se muestra, como en el provisional.
  if (!estado.available) return null;

  const n = estado.devices.length;
  return (
    <>
      <h2 className="pn-grupo">Verificación en dos pasos</h2>
      <div className="pn-conf-tarjeta">
        <div className="pn-conf-prow">
          <span className="pn-conf-k">Estado</span>
          <span className="pn-conf-v pn-seg-estado" data-activa={n > 0}><Icono nombre={n > 0 ? "ok" : "escudo"} tamano={15} aria-hidden />{estadoDosPasos(n)}</span>
        </div>
        {estado.devices.map((d, i) => (
          <div key={d.id} className="pn-conf-prow">
            <span className="pn-conf-k">Dispositivo {i + 1}</span><span className="pn-conf-v">Registrado el {fechaRegistro(d.createdAt)}</span>
          </div>
        ))}
      </div>
      <p className="pn-conf-nota">
        {n === 0 ? "Al entrar te pedimos, además de la contraseña, un código de tu teléfono. Así nadie entra solo con tu contraseña."
          : n === 1 ? "Registra un segundo dispositivo (otro teléfono o tu gestor de contraseñas) por si pierdes el primero."
          : "Al entrar se pide el código de cualquiera de tus dos dispositivos."}
        {n > 0 ? " Desde el panel no se quitan dispositivos; si pierdes uno, pide a soporte técnico que lo quite." : ""}
      </p>
      {puedeAgregarDispositivo(n) ? (
        <div className="pn-conf-acciones">
          <Boton variante={n === 0 ? "primario" : "normal"} icono="escudo" onClick={() => setAbierta(true)}>
            {n === 0 ? "Activar" : "Agregar otro dispositivo"}
          </Boton>
        </div>
      ) : null}
      <Hoja abierta={abierta} titulo={n === 0 ? "Activar la verificación en dos pasos" : "Agregar otro dispositivo"} alCerrar={() => setAbierta(false)}>
        {abierta ? <AltaDispositivo alTerminar={(listo) => { setAbierta(false); if (listo) leer(); }} /> : null}
      </Hoja>
    </>
  );
}

/**
 * El alta: el servidor da el código QR y la clave para escribirla a mano; el primer código de la app la confirma.
 * La clave solo vive en esta hoja: al cerrarla se olvida. Un alta sin confirmar la limpia el servidor en la siguiente.
 */
function AltaDispositivo({ alTerminar }: { alTerminar: (listo: boolean) => void }) {
  const { avisar } = useAvisos();
  const [alta, setAlta] = useState<Alta | null>(null);
  const [falla, setFalla] = useState<{ texto: string; reentrar: boolean } | null>(null);
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [vuelta, setVuelta] = useState(0);

  useEffect(() => {
    let vivo = true;
    startMfaEnrollment().then(
      (a) => { if (vivo) setAlta(a); },
      (e: unknown) => { if (vivo) setFalla({ texto: errorMessage(e), reentrar: pideVolverAEntrar(e) }); },
    );
    return () => { vivo = false; };
  }, [vuelta]);

  async function confirmar(e: FormEvent) {
    e.preventDefault();
    if (!alta || ocupado) return;
    if (!codigoCompleto(codigo)) { setError("Escribe los 6 dígitos que muestra la app."); return; }
    setError(null);
    setOcupado(true);
    try {
      await confirmMfaEnrollment(alta.factorId, codigo);
      setAlta(null);
      avisar("Listo. El dispositivo quedó registrado.");
      alTerminar(true);
    } catch (err) {
      setError(errorMessage(err));
      setCodigo("");
    } finally {
      setOcupado(false);
    }
  }

  if (falla) {
    return (
      <div className="pn-seg-form">
        <p className="pn-seg-error" role="alert"><Icono nombre="alerta" tamano={16} aria-hidden />{falla.texto}</p>
        <div className="pn-conf-acciones">
          {falla.reentrar ? <VolverAEntrar /> : <Boton variante="normal" onClick={() => { setFalla(null); setVuelta((v) => v + 1); }}>Volver a intentar</Boton>}
          <Boton variante="texto" onClick={() => alTerminar(false)}>Cerrar</Boton>
        </div>
      </div>
    );
  }
  if (!alta) return <Cargando lineas={2} etiqueta="Preparando el código" />;

  return (
    <form onSubmit={confirmar} noValidate className="pn-seg-form">
      <ol className="pn-seg-pasos">
        <li>Abre tu app de verificación (Google Authenticator, Microsoft Authenticator, 1Password…) y agrega una cuenta.</li>
        <li>Escanea este código. Si no puedes, escribe la clave de abajo.</li>
        <li>Escribe el código de 6 dígitos que aparece en la app.</li>
      </ol>
      {/* eslint-disable-next-line @next/next/no-img-element -- el QR llega del servidor como imagen en línea; no pasa por el optimizador */}
      <img src={alta.qr} alt="Código QR para tu app de verificación" width={176} height={176} className="pn-seg-qr" />
      <div className="pn-campo">
        <label htmlFor="pn-seg-clave">Clave para escribirla a mano</label>
        <input id="pn-seg-clave" className="pn-seg-secreto" readOnly value={alta.secret} spellCheck={false} autoComplete="off" onFocus={(e) => e.currentTarget.select()} />
      </div>
      <div className="pn-campo">
        <label htmlFor="pn-seg-codigo">Código de la app</label>
        <input id="pn-seg-codigo" className="pn-seg-codigo" inputMode="numeric" pattern="[0-9]{6}" autoComplete="one-time-code" value={codigo}
          onChange={(e) => setCodigo(limpiarCodigo(e.target.value))} aria-invalid={error ? true : undefined} aria-describedby={error ? "pn-seg-codigo-error" : undefined} />
      </div>
      {error ? <p id="pn-seg-codigo-error" className="pn-seg-error" role="alert"><Icono nombre="alerta" tamano={16} aria-hidden />{error}</p> : null}
      <div className="pn-conf-acciones">
        <Boton type="submit" deshabilitado={ocupado}>{ocupado ? "Confirmando…" : "Confirmar"}</Boton>
        <Boton type="button" variante="texto" onClick={() => alTerminar(false)}>Cancelar</Boton>
      </div>
    </form>
  );
}
