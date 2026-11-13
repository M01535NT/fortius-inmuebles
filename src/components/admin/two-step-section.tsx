"use client";
import * as React from "react";
import Image from "next/image";
import { confirmMfaEnrollment, errorMessage, mfaStatus, startMfaEnrollment, type MfaStatus } from "@/lib/admin/store";
import { AsyncButton, AsyncForm, ErrorNotice, Field, btnGhost, btnPrimary, inputClass } from "@/components/admin/ui";

/*
  AUT-01 (titular, 13/11/2026): verificación en dos pasos solo para el director. Se registra una app de
  códigos (Google Authenticator, Microsoft Authenticator, 1Password…) y, de preferencia, un segundo
  dispositivo. Si se pierden los dos, el titular quita el factor desde Supabase (Authentication → Users).
*/
const fecha = (iso: string) => new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });

export function TwoStepSection() {
  const [status, setStatus] = React.useState<MfaStatus | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [enrollment, setEnrollment] = React.useState<{ factorId: string; qr: string; secret: string } | null>(null);
  const [done, setDone] = React.useState(false);
  React.useEffect(() => {
    let live = true;
    mfaStatus().then(result => { if (live) setStatus(result); }, error => { if (live) setLoadError(errorMessage(error)); });
    return () => { live = false; };
  }, []);
  if (loadError) return <section className="rounded-lg bg-card p-5"><h2>Verificación en dos pasos</h2><ErrorNotice error={loadError} /></section>;
  if (!status?.available) return null;
  const count = status.devices.length;
  return (
    <section id="dos-pasos" className="scroll-mt-24 space-y-4 rounded-lg bg-card p-5">
      <h2>Verificación en dos pasos</h2>
      <p className="text-sm text-muted-foreground">
        {count === 0
          ? "Al entrar te pediremos, además de la contraseña, un código de tu teléfono. Así nadie entra al panel solo con tu contraseña."
          : `Activa en ${count === 1 ? "un dispositivo" : `${count} dispositivos`}. Al entrar se pide el código de tu app.`}
      </p>
      {count > 0 && (
        <ul className="space-y-1 text-sm">
          {status.devices.map((device, index) => <li key={device.id}>Dispositivo {index + 1}: registrado el {fecha(device.createdAt)}</li>)}
        </ul>
      )}
      {count === 1 && !enrollment && <p className="text-sm text-muted-foreground">Registra un segundo dispositivo (otro teléfono o tu gestor de contraseñas) por si pierdes el primero.</p>}
      {done && <p role="status" className="text-sm text-[var(--success)]">Listo. El dispositivo quedó registrado.</p>}
      {enrollment ? (
        <AsyncForm className="space-y-4" onSubmit={async event => {
          const code = String(new FormData(event.currentTarget).get("code"));
          await confirmMfaEnrollment(enrollment.factorId, code);
          setEnrollment(null); setDone(true); setStatus(await mfaStatus());
        }}>
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            <li>Abre tu app de verificación y elige agregar una cuenta.</li>
            <li>Escanea este código. Si no puedes, escribe la clave que está abajo.</li>
            <li>Escribe el código de 6 dígitos que aparece en la app.</li>
          </ol>
          <Image unoptimized src={enrollment.qr} alt="Código QR para tu app de verificación" width={192} height={192} className="size-48 rounded-md bg-white p-2" />
          <Field label="Clave para escribirla a mano" htmlFor="mfa-secret">
            <input id="mfa-secret" readOnly value={enrollment.secret} className={inputClass + " font-mono"} onFocus={event => event.currentTarget.select()} />
          </Field>
          <Field label="Código de la app" htmlFor="mfa-code">
            <input id="mfa-code" name="code" required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" className={inputClass + " tracking-[0.3em]"} />
          </Field>
          <div className="flex flex-wrap gap-2">
            <button className={btnPrimary}>Confirmar</button>
            <button type="button" className={btnGhost} onClick={() => setEnrollment(null)}>Cancelar</button>
          </div>
        </AsyncForm>
      ) : count < 2 ? (
        <AsyncButton className={btnPrimary} onClick={async () => { setDone(false); setEnrollment(await startMfaEnrollment()); }}>
          {count === 0 ? "Activar verificación en dos pasos" : "Agregar otro dispositivo"}
        </AsyncButton>
      ) : null}
    </section>
  );
}
