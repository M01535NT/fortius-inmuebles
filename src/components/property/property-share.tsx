"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";

export function PropertyShare({ title, text, url }: { title: string; text: string; url: string }) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [manual, setManual] = useState(false);
  async function share() {
    setBusy(true); setStatus(""); setManual(false);
    try {
      if (navigator.share) {
        try { await navigator.share({ title, text, url }); return; }
        catch (error) { if (error && typeof error === "object" && "name" in error && error.name === "AbortError") return; }
      }
      try { await navigator.clipboard.writeText(url); setStatus("Enlace copiado. Ya puedes pegarlo en una conversación."); }
      catch { setManual(true); setStatus("Copia el enlace para compartir este inmueble."); }
    } finally { setBusy(false); }
  }
  return <>
    <button type="button" onClick={share} disabled={busy} className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3.5 text-sm font-medium text-foreground/75 transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-60">
      <Share2 className="h-4 w-4" aria-hidden="true" />{busy ? "Abriendo…" : "Compartir"}
    </button>
    {status && <p role="status" className="w-full text-sm text-muted-foreground">{status}</p>}
    {manual && <input aria-label="Enlace del inmueble para compartir" readOnly value={url} onFocus={event => event.target.select()} className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm" />}
  </>;
}
