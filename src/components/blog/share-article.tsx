"use client";

import { useState } from "react";
import { Link2, Share2 } from "lucide-react";

/* Compartir el artículo: hoja nativa cuando existe; si no, copia el enlace. */
export function ShareArticle({ title, text, url }: { title: string; text: string; url: string }) {
  const [status, setStatus] = useState("");
  const [manual, setManual] = useState(false);

  async function copy() {
    setManual(false);
    try { await navigator.clipboard.writeText(url); setStatus("Enlace copiado."); }
    catch { setManual(true); setStatus("Copia el enlace para compartir este artículo."); }
  }
  async function share() {
    setStatus("");
    if (navigator.share) {
      try { await navigator.share({ title, text, url }); return; }
      catch (error) { if (error && typeof error === "object" && "name" in error && error.name === "AbortError") return; }
    }
    await copy();
  }
  return <div className="ba-share">
    <button type="button" onClick={share}><Share2 size={16} aria-hidden="true" />Compartir</button>
    <button type="button" onClick={copy}><Link2 size={16} aria-hidden="true" />Copiar enlace</button>
    {status && <p role="status">{status}</p>}
    {manual && <input aria-label="Enlace del artículo para compartir" readOnly value={url} onFocus={event => event.target.select()} />}
  </div>;
}
