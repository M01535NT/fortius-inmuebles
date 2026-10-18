"use client";

import * as React from "react";
import { Link2, Mail, MessageCircle, QrCode } from "lucide-react";

/*
  Compartir la ficha: WhatsApp y correo sin número de Fortius (el interesado
  elige a quién), copiar enlace y código QR para imprimir o mostrar en pantalla.
  El QR llega ya generado desde el servidor como SVG.
*/
export function SharePanel({ title, text, url, qrSvg }: { title: string; text: string; url: string; qrSvg?: string }) {
  const [status, setStatus] = React.useState("");
  const [manual, setManual] = React.useState(false);
  const [qr, setQr] = React.useState(false);
  const message = `${text} ${url}`;

  async function copy() {
    setManual(false);
    try { await navigator.clipboard.writeText(url); setStatus("Enlace copiado."); }
    catch { setManual(true); setStatus("Copia el enlace para compartir esta ficha."); }
  }

  return (
    <div className="fe-card fe-share">
      <p className="fe-share-title">Compartir esta ficha</p>
      <div className="fe-share-actions">
        <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} aria-hidden="true" />WhatsApp</a>
        <a href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(message)}`}><Mail size={16} aria-hidden="true" />Correo</a>
        <button type="button" onClick={copy}><Link2 size={16} aria-hidden="true" />Copiar enlace</button>
        {qrSvg && <button type="button" aria-expanded={qr} aria-controls="fe-share-qr" onClick={() => setQr(v => !v)}><QrCode size={16} aria-hidden="true" />Código QR</button>}
      </div>
      {status && <p role="status" className="fe-share-status">{status}</p>}
      {manual && <input aria-label="Enlace de la ficha para compartir" readOnly value={url} onFocus={event => event.target.select()} className="fe-share-input" />}
      {qrSvg && qr && <div id="fe-share-qr" className="fe-share-qr">
        <span role="img" aria-label={`Código QR de ${title}`} dangerouslySetInnerHTML={{ __html: qrSvg }} />
        <p>Escanéalo con la cámara del celular para abrir esta ficha.</p>
      </div>}
    </div>
  );
}
