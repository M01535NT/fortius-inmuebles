import { Phone, MessageCircle } from "lucide-react";
import type { SiteSettings } from "@/lib/admin/store";
import { publicContact } from "@/lib/public-contact";

export function PropertyMobileCta({ settings, message }: { settings?: SiteSettings | null; message?: string }) {
  const contact = publicContact(settings, message);
  const actions = [
    { label: "Llamar", href: contact.phoneHref, icon: Phone },
    { label: "WhatsApp", href: contact.whatsapp, icon: MessageCircle },
  ];
  return <div aria-label="Contacto del inmueble" className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 pb-[calc(env(safe-area-inset-bottom)+12px)] backdrop-blur md:hidden">
    <div className="flex gap-2.5">
      {actions.map(({ label, href, icon: Icon }) => {
        const className = "flex h-12 flex-1 items-center justify-center gap-2 rounded-md border border-primary/40 bg-primary text-base font-semibold text-primary-foreground";
        return href ? <a key={label} href={href} className={className} target={label === "WhatsApp" ? "_blank" : undefined} rel={label === "WhatsApp" ? "noopener noreferrer" : undefined}><Icon className="size-4" aria-hidden="true" />{label}</a>
          : <button key={label} type="button" disabled className={className + " cursor-not-allowed opacity-60"}><Icon className="size-4" aria-hidden="true" /><span className="flex flex-col leading-tight">{label}<span className="text-xs font-normal">Por confirmar</span></span></button>;
      })}
    </div>
  </div>;
}
