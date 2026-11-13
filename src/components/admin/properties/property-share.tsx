"use client";
/* eslint-disable @next/next/no-img-element -- El código QR es una imagen data: generada en el navegador. */
import * as React from "react";
import { createPortal } from "react-dom";
import QRCode from "qrcode";
import { FileDown, Link2, QrCode } from "@/components/admin/icons";
import { Button, Sheet } from "@/components/admin/kit";
import { inputClass } from "@/components/admin/ui";
import type { AdminProperty } from "@/lib/admin/store";

/*
  Menú «⋯» del inmueble (HER-01, decisión del titular del 18/10/2026): «Descargar ficha técnica»
  es el mismo PDF que ofrece su página pública, y «Compartir liga o QR» reemplaza la herramienta
  «Enlaces y QR». Solo para inmuebles publicados: la ficha y la liga son las del sitio.
*/
export function PropertyShareActions({ property, actionClass }: { property: AdminProperty; actionClass: string }) {
  const [open, setOpen] = React.useState(false);
  if (!property.publicada) return <p className="text-sm text-muted-foreground">Publícalo para descargar su ficha técnica o compartir su liga.</p>;
  const path = `/inventario/${encodeURIComponent(property.slug)}`;
  return <div className="flex flex-wrap gap-2">
    <a href={`${path}/ficha-tecnica`} download className={actionClass} aria-label={`Descargar ficha técnica de ${property.titulo}`}><FileDown size={15} aria-hidden="true" />Descargar ficha técnica</a>
    <button type="button" className={actionClass} aria-label={`Compartir liga o QR de ${property.titulo}`} onClick={() => setOpen(true)}><QrCode size={15} aria-hidden="true" />Compartir liga o QR</button>
    {open && <ShareSheet title={property.titulo} path={path} onClose={() => setOpen(false)} />}
  </div>;
}

function ShareSheet({ title, path, onClose }: { title: string; path: string; onClose: () => void }) {
  const url = typeof window === "undefined" ? path : new URL(path, window.location.origin).href;
  const [qr, setQr] = React.useState(""), [notice, setNotice] = React.useState("");
  React.useEffect(() => {
    let active = true;
    QRCode.toDataURL(url, { width: 512, margin: 3, errorCorrectionLevel: "M", color: { dark: "#061F3F", light: "#FFFFFF" } })
      .then(image => { if (active) setQr(image); }).catch(() => { if (active) setNotice("No se pudo crear el código QR. La liga sigue sirviendo."); });
    return () => { active = false; };
  }, [url]);
  async function copy() {
    try { await navigator.clipboard.writeText(url); setNotice("Liga copiada."); }
    catch { setNotice("No se pudo copiar. Selecciona la liga y cópiala."); }
  }
  // El velo y el panel van dentro del marco del panel, fuera de la tarjeta (que se mueve al pasar el puntero).
  const root = typeof document === "undefined" ? null : document.querySelector(".admin-root") ?? document.body;
  if (!root) return null;
  return createPortal(<Sheet open onClose={onClose} title="Compartir liga o QR" description={title}>
    <label className="flex flex-col gap-1.5 text-sm font-semibold">Liga del inmueble en el sitio
      <input className={inputClass} readOnly value={url} onFocus={event => event.currentTarget.select()} />
    </label>
    <div className="flex flex-wrap gap-2"><Button variant="primary" onClick={() => void copy()}><Link2 size={16} aria-hidden="true" />Copiar liga</Button></div>
    {qr ? <div className="flex flex-col items-start gap-3">
      <img src={qr} width={224} height={224} alt={`Código QR de la liga de ${title}`} className="rounded-[12px] border border-border bg-white" />
      <a className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline underline-offset-4" href={qr} download="fortius-qr.png"><FileDown size={16} aria-hidden="true" />Descargar QR</a>
    </div> : !notice && <p role="status" className="text-sm text-muted-foreground">Preparando el código QR…</p>}
    {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
  </Sheet>, root);
}
