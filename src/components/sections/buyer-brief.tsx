"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { Container } from "@/components/layout/container";
import { PublicLeadForm } from "@/components/forms/public-lead-form";
import { captureLead } from "@/lib/admin/store";

const inputClass = "h-11 w-full rounded-md border border-input bg-background px-3.5 text-base text-foreground placeholder:text-muted-foreground";
const labelClass = "mb-2 block text-sm font-medium text-foreground";

export function BuyerBrief() {
  const [sent, setSent] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const read = (key: string) => String(data.get(key) ?? "").trim();
    setSending(true);
    setError(null);
    try {
      await captureLead({
        website: read("website"),
        nombre: read("nombre"),
        telefono: read("telefono"),
        origen: "contacto",
        mensaje: [
          "Búsqueda de inmueble",
          `Uso: ${read("uso")}`,
          `Presupuesto aproximado: ${read("presupuesto") || "por definir"}`,
          `Plazo: ${read("plazo") || "por definir"}`,
          `Forma de pago: ${read("pago") || "por definir"}`,
        ].join(" · "),
      });
      setSent(true);
    } catch {
      setError("No pudimos recibir tu solicitud. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section id="busqueda" className="scroll-mt-20 border-t border-border bg-secondary/50 py-20 md:py-28">
      <Container className="grid gap-10 lg:grid-cols-[0.8fr_1fr] lg:gap-20">
        <div>
          <h2 className="display-title max-w-[15ch] text-4xl text-foreground md:text-5xl">Cuéntanos qué buscas.</h2>
          <p className="mt-5 max-w-[48ch] text-base leading-relaxed text-muted-foreground">
            El uso, presupuesto y momento de compra nos ayudan a descartar opciones que no te sirven. Puedes dejar el presupuesto o la forma de pago por definir.
          </p>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">También puedes <Link href="/inventario" className="text-primary underline underline-offset-4">explorar las propiedades publicadas</Link> antes de escribirnos.</p>
        </div>
        {sent ? (
          <div role="status" className="flex min-h-56 flex-col justify-center rounded-lg border border-border bg-card p-8">
            <CheckCircle2 className="size-8 text-primary" strokeWidth={1.5} />
            <h3 className="display-soft mt-5 text-2xl text-foreground">Recibimos tu búsqueda.</h3>
            <p className="mt-2 text-base text-muted-foreground">Revisaremos lo que nos compartiste y te contactaremos para precisar las opciones.</p>
          </div>
        ) : (
          <PublicLeadForm onSubmit={onSubmit} className="grid gap-5 rounded-lg border border-border bg-card p-6 sm:grid-cols-2 md:p-8">
            <label className="block"><span className={labelClass}>Nombre</span><input name="nombre" required autoComplete="name" className={inputClass} /></label>
            <label className="block"><span className={labelClass}>Teléfono o WhatsApp</span><input name="telefono" type="tel" required autoComplete="tel" className={inputClass} /></label>
            <label className="block sm:col-span-2"><span className={labelClass}>¿Para qué necesitas el inmueble?</span><input name="uso" required placeholder="Vivir, invertir o instalar un negocio" className={inputClass} /></label>
            <label className="block"><span className={labelClass}>Presupuesto aproximado</span><input name="presupuesto" placeholder="Monto y moneda, si ya lo tienes" className={inputClass} /></label>
            <label className="block"><span className={labelClass}>¿Cuándo quieres comprar?</span><select name="plazo" defaultValue="" className={inputClass}><option value="">Por definir</option><option>En 3 meses</option><option>Entre 3 y 6 meses</option><option>Después de 6 meses</option></select></label>
            <label className="block sm:col-span-2"><span className={labelClass}>Forma de pago prevista</span><select name="pago" defaultValue="" className={inputClass}><option value="">Por definir</option><option>Recursos propios</option><option>Crédito</option><option>Combinación de ambos</option></select></label>
            {error ? <p role="alert" className="text-sm text-destructive sm:col-span-2">{error}</p> : null}
            <div className="sm:col-span-2">
              <button type="submit" disabled={sending} className="inline-flex h-12 items-center rounded-md bg-primary px-6 text-base font-semibold text-primary-foreground disabled:opacity-60">{sending ? "Enviando…" : "Enviar mi búsqueda"}</button>
              <p className="mt-3 text-sm text-muted-foreground">Usamos estos datos para responder a tu búsqueda.</p>
            </div>
          </PublicLeadForm>
        )}
      </Container>
    </section>
  );
}
