import { MessagingActions } from "@/components/contact/messaging-actions";
import type { SiteSettings } from "@/lib/admin/store";

export function PropertyMobileCta({ settings, message }: { settings?: SiteSettings | null; message?: string }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 pb-[calc(env(safe-area-inset-bottom)+12px)] backdrop-blur md:hidden">
      <MessagingActions settings={settings} message={message} compact fallback={<div className="flex gap-2.5">
        <a
          href="#interes"
          className="flex h-12 flex-1 items-center justify-center rounded-md bg-primary text-[15px] font-semibold text-primary-foreground active:scale-[0.99]"
        >
          Me interesa
        </a>
        <a
          href="?intencion=visita#interes"
          className="flex h-12 flex-1 items-center justify-center rounded-md border border-border text-[15px] font-medium text-foreground active:scale-[0.99]"
        >
          Agendar visita
        </a>
      </div>} />
    </div>
  );
}
