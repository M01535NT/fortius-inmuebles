"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const RETURN_KEY = "fortius-inventory-return";

export function InventoryBackLink() {
  return (
    <Link
      href="/inventario"
      onClick={(event) => {
        try {
          const referrer = document.referrer ? new URL(document.referrer) : null;
          if (referrer?.origin === window.location.origin && referrer.pathname === "/inventario") {
            event.preventDefault();
            window.history.back();
            return;
          }
          const saved = JSON.parse(window.sessionStorage.getItem(RETURN_KEY) ?? "null");
          if (typeof saved?.url === "string" && saved.url.startsWith("/inventario")) {
            event.preventDefault();
            window.location.assign(saved.url);
          }
        } catch {
          // El href conserva una salida segura cuando no hay estado de navegación.
        }
      }}
      className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-4" strokeWidth={1.5} aria-hidden="true" />
      Volver al inventario
    </Link>
  );
}
