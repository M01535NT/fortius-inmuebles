import { Mail, MapPinned, MessageCircle, Phone } from "lucide-react";

import type { Asesor } from "@/data/asesores";
import type { SiteSettings } from "@/lib/admin/store";
import { publicContact } from "@/lib/public-contact";

/*
  Perfil público del asesor. El contacto comercial lo configura el panel;
  los datos privados del asesor nunca se utilizan como contacto por inferencia.
*/
export function AgentProfile({ asesor, settings }: { asesor: Asesor; settings?: SiteSettings | null }) {
  const contact = publicContact(settings);

  const tiles = [
    { icon: Phone, label: "Teléfono", value: contact.phone },
    { icon: MessageCircle, label: "WhatsApp", value: contact.whatsappLabel },
    { icon: Mail, label: "Correo", value: contact.email || "por confirmar" },
    { icon: MapPinned, label: "Cobertura", value: "Tijuana · Rosarito · Tecate · Ensenada" },
  ];

  return (
    <div className="mt-12">
      <h2 className="display-soft text-2xl text-foreground">
        Atención directa, sin intermediarios
      </h2>

      <div className="mt-5 grid gap-6 rounded-lg border border-border bg-card p-6 sm:grid-cols-[128px_1fr] md:p-7">
        {/* Avatar de iniciales (sin fotos de personas hasta tener el equipo real). */}
        <div
          aria-hidden="true"
          className="flex h-28 w-28 items-center justify-center rounded-lg bg-block sm:h-32 sm:w-32"
        >
          <span className="font-mono text-2xl text-[#57e3b3]">{asesor.iniciales}</span>
        </div>

        <div>
          <p className="display-soft text-[22px] text-foreground">{asesor.nombre}</p>
          <p className="mt-1 text-[13.5px] text-muted-foreground">{asesor.cargo}</p>
          <p className="mt-3 max-w-[56ch] text-[14.5px] leading-relaxed text-muted-foreground">
            Acompaña esta operación de principio a fin con el proceso
            documentado de la firma: precio con datos, expediente revisado y
            seguimiento por escrito.
          </p>

          <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
            {tiles.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-md border border-border px-3.5 py-2.5"
              >
                <Icon className="h-4 w-4 shrink-0 text-primary" strokeWidth={1.5} />
                <div className="min-w-0">
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
                    {label}
                  </p>
                  <p className="truncate text-[13.5px] text-foreground">{value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={contact.phoneHref || undefined}
              aria-disabled={!contact.phoneHref}
              className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-[14.5px] font-semibold text-primary-foreground transition-transform hover:opacity-90 active:scale-[0.98]"
            >
              <Phone className="h-4 w-4" strokeWidth={1.5} />
              Llamar ahora
            </a>
            <a
              href={contact.email ? `mailto:${contact.email}` : undefined}
              aria-disabled={!contact.email}
              className="inline-flex h-11 items-center gap-2 rounded-md border border-border px-5 text-[14.5px] font-medium text-foreground transition-colors hover:bg-secondary active:scale-[0.98]"
            >
              <Mail className="h-4 w-4" strokeWidth={1.5} />
              Enviar correo
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
