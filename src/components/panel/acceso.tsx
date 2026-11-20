"use client";
import Link from "next/link";
import { useId, useState, type FormEvent } from "react";

import { CLAVE_MAXIMO, CLAVE_MINIMO, limpiarCodigo, revisarClaveNueva } from "@/lib/panel/cuenta";
import { changePassword, errorMessage, login, logout, needsMfaCode, recoverPassword, verifyMfaCode } from "@/lib/panel/legado/sesion";

import { Icono, Logo } from "./icons";

type Paso = "entrar" | "recuperar" | "codigo" | "fijar";

/**
 * La ventana de entrada del panel, con las mismas llamadas y reglas que el provisional:
 * entrar (correo y contraseña), el código de la app si la cuenta tiene dos pasos, pedir el correo para recuperar el
 * acceso y, al volver del enlace del correo (recuperación o invitación), elegir la contraseña nueva.
 * `fijarClave`: se llegó por un enlace válido; después del código (si lo pide) toca elegir la contraseña.
 */
export function Acceso({ fijarClave = false, errorInicial = null, alTerminarClave }: {
  fijarClave?: boolean; errorInicial?: string | null; alTerminarClave?: () => void;
}) {
  const [paso, setPaso] = useState<Paso>(needsMfaCode() ? "codigo" : fijarClave ? "fijar" : "entrar");
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState<string | null>(errorInicial);
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const ir = (p: Paso) => { setPaso(p); setError(null); setEnviado(false); setClave(""); setConfirmacion(""); setCodigo(""); };

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (enviando) return;
    setError(null);
    if (paso === "fijar") {
      const aviso = revisarClaveNueva(clave, confirmacion);
      if (aviso) { setError(aviso); return; }
    }
    setEnviando(true);
    try {
      if (paso === "codigo") {
        await verifyMfaCode(codigo);
        if (fijarClave) ir("fijar");
      } else if (paso === "fijar") {
        await changePassword(clave);
        setClave(""); setConfirmacion("");
        alTerminarClave?.();
      } else if (paso === "recuperar") {
        await recoverPassword(correo.trim());
        setEnviado(true);
      } else {
        await login(correo.trim(), clave);
        if (needsMfaCode()) ir("codigo");
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setEnviando(false);
    }
  }

  async function cancelarCodigo() {
    // El código es el segundo paso de una sesión a medias: se cierra para volver a empezar.
    try { await logout(); } catch { /* se vuelve al acceso aunque el servidor no responda */ }
    ir("entrar");
    if (fijarClave) alTerminarClave?.();
  }

  const titulo = paso === "codigo" ? "Código de verificación" : paso === "fijar" ? "Elige tu contraseña" : paso === "recuperar" ? "Recupera tu acceso" : "Entra al panel";
  const boton = paso === "codigo" ? "Verificar" : paso === "fijar" ? "Guardar contraseña" : paso === "recuperar" ? "Enviar enlace" : "Entrar";

  return (
    <main className="pn-acceso">
      <form onSubmit={enviar} noValidate={paso === "fijar"}>
        <Logo alto={22} />
        <h1 className="pn-acceso-t">{titulo}</h1>
        {paso === "codigo" ? (
          <>
            <p className="pn-acceso-nota">Escribe el código de 6 dígitos que muestra tu app de verificación.</p>
            <label className="pn-campo">Código
              <input className="pn-acceso-codigo" inputMode="numeric" pattern="[0-9]{6}" autoComplete="one-time-code" value={codigo}
                onChange={(e) => setCodigo(limpiarCodigo(e.target.value))} autoFocus required />
            </label>
          </>
        ) : paso === "fijar" ? (
          <>
            <CampoClave etiqueta="Contraseña nueva" valor={clave} alCambiar={setClave} nueva ayuda={`Al menos ${CLAVE_MINIMO} caracteres.`} enfocar />
            <CampoClave etiqueta="Escríbela otra vez" valor={confirmacion} alCambiar={setConfirmacion} nueva />
          </>
        ) : (
          <>
            <label className="pn-campo">Correo
              <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} autoComplete="username" maxLength={254} required autoFocus={paso === "recuperar"} />
            </label>
            {paso === "entrar" ? <CampoClave etiqueta="Contraseña" valor={clave} alCambiar={setClave} /> : (
              <p className="pn-acceso-nota">Te mandamos un enlace para elegir una contraseña nueva.</p>
            )}
          </>
        )}
        {error ? <p className="pn-error" role="alert"><Icono nombre="alerta" tamano={14} aria-hidden />{error}</p> : null}
        {enviado ? <p className="pn-acceso-ok" role="status"><Icono nombre="ok" tamano={14} aria-hidden />Si el correo tiene acceso al panel, le llega un enlace en unos minutos.</p> : null}
        <button type="submit" className="pn-btn pn-btn-primario" aria-disabled={enviando || undefined}>{boton}</button>
        {paso === "entrar" ? <button type="button" className="pn-acceso-liga" onClick={() => ir("recuperar")}>¿Olvidaste tu contraseña?</button> : null}
        {paso === "recuperar" ? <button type="button" className="pn-acceso-liga" onClick={() => ir("entrar")}>Volver a entrar</button> : null}
        {paso === "codigo" ? <button type="button" className="pn-acceso-liga" onClick={() => { void cancelarCodigo(); }}>Volver al acceso</button> : null}
      </form>
      <Link href="/" className="pn-acceso-sitio"><Icono nombre="at" tamano={14} aria-hidden />Volver al sitio</Link>
    </main>
  );
}

/** Contraseña con el botón para verla mientras se escribe (también en Configuración → Seguridad). `nueva`: el navegador la ofrece guardar como nueva. */
export function CampoClave({ etiqueta, valor, alCambiar, nueva, ayuda, enfocar }: {
  etiqueta: string; valor: string; alCambiar: (v: string) => void; nueva?: boolean; ayuda?: string; enfocar?: boolean;
}) {
  const id = useId();
  const [ver, setVer] = useState(false);
  return (
    <div className="pn-campo">
      <label htmlFor={id}>{etiqueta}</label>
      <span className="pn-acceso-clave">
        <input id={id} type={ver ? "text" : "password"} value={valor} onChange={(e) => alCambiar(e.target.value)} required
          minLength={nueva ? CLAVE_MINIMO : undefined} maxLength={CLAVE_MAXIMO} autoComplete={nueva ? "new-password" : "current-password"}
          aria-describedby={ayuda ? `${id}-ayuda` : undefined} autoFocus={enfocar} spellCheck={false} autoCapitalize="off" />
        <button type="button" aria-label={ver ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={ver} aria-controls={id} onClick={() => setVer((v) => !v)}>
          <Icono nombre="ojo" tamano={16} aria-hidden />
        </button>
      </span>
      {ayuda ? <span id={`${id}-ayuda`} className="pn-campo-ayuda">{ayuda}</span> : null}
    </div>
  );
}
