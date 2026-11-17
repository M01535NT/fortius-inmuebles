"use client";
import Link from "next/link";

import { lugarDeNotas } from "@/components/panel/agenda/detalle-cita";
import { Icono, type NombreIcono } from "@/components/panel/icons";
import { HojaAdaptable } from "@/components/panel/ui/hoja-adaptable";
import type { Property } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import type { Evento, Lead } from "@/lib/domain/records";
import { horaTexto } from "@/lib/panel/calendario";
import { DURACION_MIN, faltaPara, type FilaCita } from "@/lib/panel/datos/agenda";
import { enlaceWhatsApp } from "@/lib/panel/datos/consultas";
import { minutosDe } from "@/lib/panel/datos/hoy-atender";
import { rutaCita, rutaInmueble } from "@/lib/panel/datos/relacionado";

export const duracionTexto = (min: number) => (min >= 60 ? `${min / 60} h` : `${min} min`);
const mayuscula = (t: string) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);

/** Con quién y dónde es una cita de hoy, para su línea de contexto y su hoja (boceto: «Depto. en Zona Río · Elena P.»). */
export type DatosCita = { fila: FilaCita; tipo: Evento["tipo"]; cliente?: Cliente; lead?: Lead; inmueble?: Property };

export function contextoCita(d: DatosCita): string {
  const nombre = d.cliente?.nombre?.trim() || d.lead?.nombre?.trim() || "";
  const donde = d.inmueble?.titulo || lugarDeNotas(d.fila.notas) || "";
  const corto = nombre ? nombre.split(/\s+/).slice(0, 2).map((p, n) => (n === 1 ? `${p.charAt(0)}.` : p)).join(" ") : "";
  return [donde, corto].filter(Boolean).join(" · ") || d.fila.tipo;
}

function lugarYMapa(d: DatosCita) {
  const lugar = lugarDeNotas(d.fila.notas) ?? (d.inmueble ? [d.inmueble.direccionAproximada, d.inmueble.zona].filter(Boolean).join(", ") : null);
  return { lugar, mapa: lugar ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lugar}, Tijuana`)}` : null };
}

/** «En 40 min» (o «Ahora») para la etiqueta de la cita que sigue. */
export const cuandoCita = (d: DatosCita, minutosAhora: number) => (d.fila.hora ? mayuscula(faltaPara(d.fila.hora, minutosAhora)) : "Hoy · sin hora");

/** Escritorio (columna derecha): la tarjeta de la próxima cita; abre su hoja con Cómo llegar. */
export function TarjetaCita({ datos: d, minutosAhora, alAbrir }: { datos: DatosCita; minutosAhora: number; alAbrir: () => void }) {
  const dur = DURACION_MIN[d.tipo] ?? 30;
  return (
    <section aria-labelledby="hoy-siguiente">
      <h2 id="hoy-siguiente" className="pn-solo-lector">Siguiente cita</h2>
      <button type="button" className="pn-hoy-cita" onClick={alAbrir}>
        <span className="pn-hoy-cita-b" aria-hidden />
        <span className="pn-hoy-cita-x">
          <span className="pn-pill pn-pill-acento">{cuandoCita(d, minutosAhora)}{d.fila.hora ? ` · ${d.fila.hora}` : ""}</span>
          <span className="pn-hoy-cita-t">{d.fila.titulo}</span>
          <span className="pn-hoy-cita-c">{contextoCita(d)} · {duracionTexto(dur)}</span>
        </span>
        <span className="pn-hoy-ir"><Icono nombre="ubicacion" tamano={14} />Ir</span>
      </button>
    </section>
  );
}

/** Teléfono: la próxima cita flota sobre la barra de abajo (boceto). */
export function FlotaCita({ datos: d, minutosAhora, alAbrir }: { datos: DatosCita; minutosAhora: number; alAbrir: () => void }) {
  return (
    <button type="button" className="pn-hoy-flota" onClick={alAbrir} aria-label={`Próxima cita: ${d.fila.titulo}${d.fila.hora ? ` a las ${d.fila.hora}` : ""}`}>
      <span className="pn-hoy-cita-b" aria-hidden />
      <span className="pn-hoy-flota-x">
        <b>{d.fila.titulo}{d.fila.hora ? ` · ${d.fila.hora}` : ""}</b>
        <small>{cuandoCita(d, minutosAhora)} · {contextoCita(d)}</small>
      </span>
      <span className="pn-hoy-ir"><Icono nombre="ubicacion" tamano={14} />Ir</span>
    </button>
  );
}

/** Hoja de la próxima cita (boceto): cuándo, dónde, Llamar, WhatsApp, Inmueble y «Cómo llegar». */
export function HojaCita({ datos: d, minutosAhora, abierta, alCerrar }: { datos: DatosCita | null; minutosAhora: number; abierta: boolean; alCerrar: () => void }) {
  if (!d) return <HojaAdaptable abierta={false} alCerrar={alCerrar} titulo="Próxima cita"><span /></HojaAdaptable>;
  const dur = DURACION_MIN[d.tipo] ?? 30;
  const ini = minutosDe(d.fila.hora);
  const { lugar, mapa } = lugarYMapa(d);
  const nombre = d.cliente?.nombre?.trim() || d.lead?.nombre?.trim() || "";
  const telefono = d.cliente?.telefono || d.lead?.telefono || "";
  const tel = telefono.replace(/[^\d+]/g, "");
  const wa = telefono ? enlaceWhatsApp(telefono, `Hola ${nombre.split(/\s+/)[0] ?? ""}, voy en camino a nuestra cita.`) : null;
  const accesos: { texto: string; href: string; icono: NombreIcono; externo?: boolean }[] = [];
  if (tel) accesos.push({ texto: "Llamar", href: `tel:${tel}`, icono: "llamada" });
  if (wa) accesos.push({ texto: "WhatsApp", href: wa, icono: "mensaje", externo: true });
  if (d.inmueble) accesos.push({ texto: "Inmueble", href: rutaInmueble(d.inmueble.codigo), icono: "edificio" });
  return (
    <HojaAdaptable abierta={abierta} alCerrar={alCerrar} titulo={d.fila.titulo}>
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ display: "grid", gap: 6, justifyItems: "start" }}>
          <span className="pn-pill pn-pill-acento">{cuandoCita(d, minutosAhora)}</span>
          <p style={{ margin: 0, fontSize: 14, color: "var(--ink-muted)" }}>
            {[ini !== null ? `${horaTexto(ini)} a ${horaTexto(ini + dur)}` : "Sin hora", lugar, d.fila.empalme ? "se empalma con otra cita" : null].filter(Boolean).join(" · ")}
          </p>
        </div>
        {accesos.length ? (
          <div className="pn-accesos" style={{ gridTemplateColumns: `repeat(${accesos.length}, minmax(0, 1fr))` }}>
            {accesos.map((x) => x.externo
              ? <a key={x.texto} className="pn-acceso-btn" href={x.href} target="_blank" rel="noopener noreferrer"><Icono nombre={x.icono} tamano={20} />{x.texto}</a>
              : <Link key={x.texto} className="pn-acceso-btn" href={x.href}><Icono nombre={x.icono} tamano={20} />{x.texto}</Link>)}
          </div>
        ) : null}
        <div style={{ display: "grid", gap: 8 }}>
          {mapa ? <a className="pn-sbtn pn-hoy-bt" href={mapa} target="_blank" rel="noopener noreferrer"><Icono nombre="ubicacion" tamano={20} />Cómo llegar</a> : null}
          <Link className={`pn-sbtn pn-hoy-bt${mapa ? " pn-sbtn-suave" : ""}`} href={rutaCita(d.fila.id)}>Ver en la agenda</Link>
        </div>
      </div>
    </HojaAdaptable>
  );
}
