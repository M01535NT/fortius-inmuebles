"use client";

import * as React from "react";
import { CheckCircle2 } from "lucide-react";

import { captureLead } from "@/lib/admin/store";
import { PublicLeadForm } from "@/components/forms/public-lead-form";

const subscribeToLocation = () => () => {};

/*
  Formulario de interés por propiedad. El BFF confirma el lead persistido
  en MNT antes de mostrar la recepción; los fallos conservan los datos.
*/
export function PropertyInterestForm({ slug, codigo, titulo }: { slug: string; codigo: string; titulo: string }) {
  const [sent, setSent] = React.useState(false);
  const [enviando, setEnviando] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const search = React.useSyncExternalStore(subscribeToLocation, () => window.location.search, () => "");
  const intencion = new URLSearchParams(search).get("intencion") === "visita" ? "visita" : "interes";

  if (sent) {
    return (
      <div className="flex flex-col items-start" aria-live="polite">
        <CheckCircle2 className="h-7 w-7 text-primary" strokeWidth={1.5} />
        <p className="display-soft mt-4 text-xl text-foreground">Recibimos tu solicitud.</p>
        <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
          Te contactamos para coordinar la visita o resolver tus dudas sobre
          esta propiedad.
        </p>
      </div>
    );
  }

  return (
    <PublicLeadForm
      onSubmit={async (e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        setEnviando(true);
        setError(null);
        try {
          await captureLead({
            website: String(data.get("website") ?? ""),
            nombre: String(data.get("nombre") ?? ""),
            telefono: String(data.get("telefono") ?? ""),
            mensaje:
              intencion === "visita"
                ? `Solicitud de visita${String(data.get("mensaje") ?? "").trim() ? `: ${String(data.get("mensaje")).trim()}` : ""}`
                : String(data.get("mensaje") ?? "") || undefined,
            propiedadSlug: slug,
            origen: "interes-propiedad",
          });
          setSent(true);
        } catch {
          setError("No pudimos enviar tus datos. Inténtalo otra vez o escríbenos por WhatsApp.");
        } finally {
          setEnviando(false);
        }
      }}
    >
      <p className="font-mono text-[11.5px] uppercase tracking-[0.08em] text-muted-foreground">
        Sobre: {codigo}
      </p>
      <input type="hidden" name="propiedad" value={slug} />
      <input type="hidden" name="intencion" value={intencion} />
      <div className="mt-4 grid gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="interes-nombre" className="text-[13.5px] font-medium text-foreground">
            Nombre
          </label>
          <input
            id="interes-nombre"
            name="nombre"
            required
            autoComplete="name"
            placeholder="Tu nombre"
            className="h-11 rounded-md border border-input bg-background px-3.5 text-[15px] text-foreground placeholder:text-muted-foreground/70"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="interes-telefono" className="text-[13.5px] font-medium text-foreground">
            Teléfono o WhatsApp
          </label>
          <input
            id="interes-telefono"
            name="telefono"
            type="tel"
            required
            autoComplete="tel"
            placeholder="664 000 0000"
            className="h-11 rounded-md border border-input bg-background px-3.5 text-[15px] text-foreground placeholder:text-muted-foreground/70"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="interes-mensaje" className="text-[13.5px] font-medium text-foreground">
            Mensaje <span className="font-normal text-muted-foreground">(opcional)</span>
          </label>
          <textarea
            id="interes-mensaje"
            name="mensaje"
            rows={3}
            placeholder={`Quiero saber más sobre ${titulo.toLowerCase()}`}
            className="rounded-md border border-input bg-background px-3.5 py-2.5 text-[15px] text-foreground placeholder:text-muted-foreground/70"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={enviando}
        className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-md bg-primary px-6 text-[15px] font-semibold text-primary-foreground transition-transform hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
      >
        {enviando ? "Enviando…" : intencion === "visita" ? "Solicitar visita" : "Me interesa esta propiedad"}
      </button>
      {error ? (
        <p
          role="alert"
          className="mt-3 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-[13.5px] leading-relaxed text-destructive"
        >
          {error}
        </p>
      ) : null}
      <p className="mt-3 text-[12.5px] leading-relaxed text-muted-foreground">
        Sin compromiso. Usamos tus datos solo para dar seguimiento a tu
        solicitud.
      </p>
    </PublicLeadForm>
  );
}
