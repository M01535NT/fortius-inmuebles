"use client";
import * as React from "react";
import { Field, inputClass } from "@/components/admin/ui";
import { apiRequest, errorMessage } from "@/lib/admin/store";
import { dolares, TOPE_IA_MAXIMO, topeIaValido, type UsoIa } from "@/lib/backend/ia-tope";

/*
  Configuración · Lectura de documentos (IA-02): cuánto se lleva gastado este mes en leer
  documentos del cliente y el tope que el director puede cambiar. Al llegar al tope la lectura se
  pausa hasta el mes siguiente o hasta que se suba. El campo va dentro del formulario de
  Configuración y se guarda con él.
*/
const ORIGEN: Record<UsoIa["origenTope"], string> = {
  configuracion: "Lo fijó el director aquí.",
  servidor: "Viene de la configuración del servidor; si lo cambias aquí, manda el de aquí.",
  omision: "Es el tope inicial; si lo cambias aquí, manda el de aquí.",
};
const mes = (desde: string) => new Date(`${desde}T12:00:00Z`).toLocaleDateString("es-MX", { month: "long", timeZone: "UTC" });

export function IaUsoSection({ guardado }: { guardado?: number }) {
  const [uso, setUso] = React.useState<UsoIa | null>(null), [error, setError] = React.useState(""), [intento, setIntento] = React.useState(0);
  React.useEffect(() => {
    let active = true;
    apiRequest<{ uso: UsoIa }>("/api/admin/ia/uso").then(r => { if (active) { setUso(r.uso); setError(""); } }).catch(cause => { if (active) setError(errorMessage(cause)); });
    return () => { active = false; };
  }, [intento]);
  const tope = topeIaValido(guardado) ?? uso?.topeUsd;
  const porcentaje = uso && tope ? Math.min(100, Math.round((uso.gastoUsd / tope) * 100)) : 0;

  return <section className="space-y-4 rounded-lg border border-border bg-card p-5" aria-labelledby="cf-ia">
    <h2 id="cf-ia" className="display-soft text-lg text-foreground">Lectura de documentos</h2>
    {error ? <p role="alert" className="text-sm text-destructive">{error} <button type="button" className="min-h-11 font-semibold underline underline-offset-4" onClick={() => setIntento(n => n + 1)}>Reintentar</button></p>
      : !uso ? <p role="status" className="text-sm text-muted-foreground">Consultando el gasto del mes…</p>
      : <div className="space-y-2">
        <p className="text-sm text-foreground">
          <span className="font-semibold tabular-nums">{dolares(uso.gastoUsd)}</span> gastados en {mes(uso.desde)}
          {" "}· {uso.lecturas} {uso.lecturas === 1 ? "lectura" : "lecturas"}
        </p>
        {tope !== undefined && tope > 0 && <div className="h-2 w-full max-w-sm overflow-hidden rounded-full bg-muted" role="img" aria-label={`${porcentaje} % del tope del mes`}>
          <div className={porcentaje >= 100 ? "h-full bg-destructive" : "h-full bg-primary"} style={{ width: `${porcentaje}%` }} />
        </div>}
        {tope !== undefined && uso.gastoUsd >= tope && <p className="text-sm font-medium text-destructive">Se llegó al tope: la lectura está en pausa hasta el próximo mes o hasta que subas el tope.</p>}
        {!uso.disponible && <p className="text-sm text-muted-foreground">La lectura de documentos todavía no está activa; el tope aplica en cuanto se active.</p>}
      </div>}
    <Field label="Tope de gasto al mes, en dólares" htmlFor="cf-tope-ia" hint={`Al llegar a esta cantidad no se leen más documentos ese mes. De 0 a ${TOPE_IA_MAXIMO}; 0 la pausa. ${uso ? ORIGEN[uso.origenTope] : ""}`.trim()}>
      <input
        id="cf-tope-ia"
        name="topeIaMensualUsd"
        type="number"
        inputMode="decimal"
        min={0}
        max={TOPE_IA_MAXIMO}
        step={0.01}
        key={tope ?? "sin-tope"}
        defaultValue={tope}
        className={inputClass + " sm:max-w-[10rem]"}
      />
    </Field>
  </section>;
}
