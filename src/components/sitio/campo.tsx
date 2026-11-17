"use client";

import * as React from "react";

type Marco = {
  etiqueta: React.ReactNode;
  /** Texto de ayuda bajo el control. */
  ayuda?: React.ReactNode;
  /** Mensaje de error; el control se marca inválido y lo anuncia. */
  error?: React.ReactNode;
  /** Muestra «opcional» junto a la etiqueta. */
  opcional?: boolean;
  /** «linea»: solo línea inferior y letra grande (formulario de cierre en banda oscura). */
  estilo?: "caja" | "linea";
  className?: string;
};

function useIds(id: string | undefined) {
  const propio = React.useId();
  const base = id ?? propio;
  return { id: base, ayuda: `${base}-ayuda`, error: `${base}-error` };
}

function Envoltura({ etiqueta, ayuda, error, opcional, estilo = "caja", className, ids, children }: Marco & { ids: ReturnType<typeof useIds>; children: React.ReactNode }) {
  const cls = ["s-campo", estilo === "linea" ? "s-campo-linea" : "", className ?? ""].filter(Boolean).join(" ");
  return (
    <div className={cls}>
      <label htmlFor={ids.id} className="s-campo-etiqueta">
        {etiqueta}{opcional ? <span className="s-campo-opcional"> · opcional</span> : null}
      </label>
      {children}
      {ayuda ? <p id={ids.ayuda} className="s-campo-ayuda">{ayuda}</p> : null}
      {error ? <p id={ids.error} className="s-campo-error" role="alert">{error}</p> : null}
    </div>
  );
}

function descritoPor(ids: ReturnType<typeof useIds>, ayuda: unknown, error: unknown, propio?: string) {
  const lista = [propio, ayuda ? ids.ayuda : "", error ? ids.error : ""].filter(Boolean).join(" ");
  return lista || undefined;
}

type InputProps = Marco & Omit<React.InputHTMLAttributes<HTMLInputElement>, "className">;

/** Campo de texto (nombre, teléfono, correo, monto). */
export function CampoTexto({ etiqueta, ayuda, error, opcional, estilo, className, id, ...input }: InputProps) {
  const ids = useIds(id);
  return (
    <Envoltura etiqueta={etiqueta} ayuda={ayuda} error={error} opcional={opcional} estilo={estilo} className={className} ids={ids}>
      <input id={ids.id} {...input} aria-invalid={error ? true : input["aria-invalid"]}
        aria-describedby={descritoPor(ids, ayuda, error, input["aria-describedby"])} className="s-campo-control" />
    </Envoltura>
  );
}

type AreaProps = Marco & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "className">;

/** Campo de varias líneas (mensaje). */
export function CampoArea({ etiqueta, ayuda, error, opcional, estilo, className, id, ...area }: AreaProps) {
  const ids = useIds(id);
  return (
    <Envoltura etiqueta={etiqueta} ayuda={ayuda} error={error} opcional={opcional} estilo={estilo} className={className} ids={ids}>
      <textarea id={ids.id} {...area} aria-invalid={error ? true : area["aria-invalid"]}
        aria-describedby={descritoPor(ids, ayuda, error, area["aria-describedby"])} className="s-campo-control" />
    </Envoltura>
  );
}

type ListaProps = Marco & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "className"> & {
  opciones: readonly { valor: string; etiqueta: string }[];
};

/** Lista desplegable: de tres opciones en adelante (regla del sitio). */
export function CampoLista({ etiqueta, ayuda, error, opcional, estilo, className, id, opciones, ...select }: ListaProps) {
  const ids = useIds(id);
  return (
    <Envoltura etiqueta={etiqueta} ayuda={ayuda} error={error} opcional={opcional} estilo={estilo} className={className} ids={ids}>
      <select id={ids.id} {...select} aria-invalid={error ? true : select["aria-invalid"]}
        aria-describedby={descritoPor(ids, ayuda, error, select["aria-describedby"])} className="s-campo-control">
        {opciones.map((opcion) => <option key={opcion.valor} value={opcion.valor}>{opcion.etiqueta}</option>)}
      </select>
    </Envoltura>
  );
}
