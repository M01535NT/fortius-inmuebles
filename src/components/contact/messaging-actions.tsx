"use client";

import type { ReactNode } from "react";
import { MessageCircle, MessagesSquare } from "lucide-react";
import type { SiteSettings } from "@/lib/admin/store";
import { publicContact } from "@/lib/public-contact";
import { usePublicFeatures } from "@/components/providers/public-features-provider";

type Props = { settings?: SiteSettings | null; message?: string; className?: string; compact?: boolean; fallback?: ReactNode };

export function MessagingActions({ settings, message, className = "", compact = false, fallback = null }: Props) {
  const shared = usePublicFeatures();
  const contact = publicContact(settings === undefined ? shared.settings : settings, message);
  if (!contact.whatsapp && !contact.messenger) return fallback;
  return (
    <div className={`flex flex-wrap gap-2.5 ${className}`}>
      {contact.whatsapp && <a href={contact.whatsapp} target="_blank" rel="noopener noreferrer" className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90 ${compact ? "flex-1" : ""}`}>
        <MessageCircle className="size-4 shrink-0" aria-hidden="true" /> WhatsApp
      </a>}
      {contact.messenger && <a href={contact.messenger} target="_blank" rel="noopener noreferrer" className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-semibold text-foreground hover:bg-secondary ${compact ? "flex-1" : ""}`}>
        <MessagesSquare className="size-4 shrink-0" aria-hidden="true" /> Messenger
      </a>}
    </div>
  );
}

export function MessagingContact({ children, title = "Conversemos directamente.", ...props }: Props & { children?: ReactNode; title?: string }) {
  const shared = usePublicFeatures();
  const contact = publicContact(props.settings === undefined ? shared.settings : props.settings);
  return <div className="space-y-5">
    <div>
      <h3 className="display-soft text-2xl text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{contact.whatsapp || contact.messenger ? `Escríbenos por ${contact.whatsapp && contact.messenger ? "WhatsApp o Messenger" : contact.whatsapp ? "WhatsApp" : "Messenger"}.` : "Los canales de mensajería estarán disponibles cuando se confirmen los datos de contacto."}</p>
    </div>
    <MessagingActions {...props} />
    {children && <details className="group">
      <summary className="min-h-11 cursor-pointer py-3 text-sm font-medium text-foreground underline underline-offset-4">Prefiero dejar mis datos en un formulario</summary>
      <div className="pt-4">{children}</div>
    </details>}
  </div>;
}
