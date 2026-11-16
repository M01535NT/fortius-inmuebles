import type { GrupoRelacionado } from "@/lib/panel/datos/relacionado";

import { Fila, GrupoLista } from "./lista";

/** Bloque «Relacionado» al pie de una ficha: cada fila lleva a la otra ficha (con su dirección propia). */
export function Relacionado({ grupos }: { grupos: readonly GrupoRelacionado[] }) {
  if (!grupos.length) return null;
  return (
    <div style={{ display: "grid", gap: 16, marginTop: 20 }}>
      {grupos.map((g) => (
        <GrupoLista key={g.titulo} titulo={g.titulo}>
          {g.enlaces.map((e) => <Fila key={e.id} href={e.href} titulo={e.texto} subtitulo={e.detalle} />)}
        </GrupoLista>
      ))}
    </div>
  );
}

/** Llamar, WhatsApp y Correo en un toque. El panel no manda nada solo: abre la aplicación del asesor. */
export function Contactar({ telefono, email, whatsapp }: { telefono?: string; email?: string; whatsapp?: string | null }) {
  const tel = telefono?.replace(/[^\d+]/g, "");
  if (!tel && !email) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
      {whatsapp ? <a className="pn-btn pn-btn-primario" href={whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp</a> : null}
      {tel ? <a className="pn-btn pn-btn-secundario" href={`tel:${tel}`}>Llamar</a> : null}
      {email ? <a className="pn-btn pn-btn-secundario" href={`mailto:${email}`}>Correo</a> : null}
    </div>
  );
}
