"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

import { Gesto, Icono, type NombreIcono } from "@/components/panel/icons";
import { ItemsPosponer, OpcionesPosponer } from "@/components/panel/kit/posponer";
import { SelectorFecha } from "@/components/panel/kit/selector-fecha";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/panel/ui/dropdown-menu";
import { HojaAdaptable, useEsAncho, useEsTelefono } from "@/components/panel/ui/hoja-adaptable";
import { enlaceWhatsApp } from "@/lib/panel/datos/consultas";
import type { ItemHoy } from "@/lib/panel/datos/hoy-atender";
import { opcionesPosponer, type OpcionPosponer } from "@/lib/panel/datos/posponer";

const rutaAsunto = (id: string) => `/panel/asuntos?ver=${encodeURIComponent(id)}`;
const ICONO: Record<ItemHoy["clase"], NombreIcono> = { tarea: "expediente", consulta: "mensaje", tramite: "escritura", contrato: "alerta", cobro: "precio", fecha: "cita" };

/** Se pospone una tarea (con hora: «Esta tarde · 17:00») o una solicitud del sitio (solo el día: vuelve a Hoy ese día). */
export const sePuedePosponer = (i: ItemHoy) => i.clase === "tarea" || (i.clase === "consulta" && Boolean(i.consultaId));
const opcionesDe = (i: ItemHoy, ahora: Date) => opcionesPosponer(ahora, i.clase === "tarea");

const telLimpio = (t?: string) => t?.replace(/[^\d+]/g, "") || undefined;
const waDe = (i: ItemHoy) => (i.telefono ? enlaceWhatsApp(i.telefono, `Hola ${i.nombre?.split(/\s+/)[0] ?? ""}, te escribo de Fortius Inmuebles por tu solicitud.`) : null);
/** Tareas se marcan hechas; las solicitudes del sitio, atendidas. Trámites y contratos se atienden en su pantalla. */
export const sePuedeCerrar = (i: ItemHoy) => i.clase === "tarea" || (i.clase === "consulta" && Boolean(i.consultaId));
const textoCerrar = (i: ItemHoy) => (i.clase === "consulta" ? "Marcar atendida" : "Marcar hecha");
const textoAbrir = (i: ItemHoy) => (i.clase === "consulta" ? "Abrir la consulta" : i.clase === "tramite" ? "Abrir el trámite" : i.clase === "cobro" ? "Abrir Dinero" : null);
const nombreAcceso = (i: ItemHoy) => (i.clase === "consulta" ? "Consulta" : i.clase === "cobro" ? "Dinero" : "Trámite");
const iconoAcceso = (i: ItemHoy): NombreIcono => (i.clase === "consulta" ? "cliente" : i.clase === "cobro" ? "precio" : "escritura");

/** Lo que dice la etiqueta del detalle: «Vencida · Venció lun 10 nov», «Solicitud nueva», «Para hoy». */
function etiquetaDetalle(i: ItemHoy) {
  if (i.clase === "consulta") return i.vencido ? `Solicitud sin responder · ${i.lado}` : "Solicitud nueva";
  if (i.clase === "cobro" || i.clase === "fecha") return i.vencido ? i.lado : "Vence hoy";
  if (i.vencido) return i.clase === "tarea" ? `Vencida · ${i.lado}` : i.lado;
  return "Para hoy";
}

export type ModoHoja = "menu" | "posponer";
type Acciones = {
  alHecha: (i: ItemHoy) => void;
  /** Nuevo día y, si la opción la trae, la hora (solo tareas). */
  alPosponer: (i: ItemHoy, fecha: string, hora: string | null) => void;
  alElegirFecha: (i: ItemHoy) => void;
  alAbrir: (i: ItemHoy) => void;
  /** Teléfono: mantener presionada la fila abre «Acciones»; deslizar a la izquierda, «Posponer». */
  alHoja: (i: ItemHoy, modo: ModoHoja) => void;
  hoy: Date;
  ocupado: string | null;
  /** La fila que se acaba de marcar hecha: se apaga y se pliega antes de salir de la lista. */
  saliendo?: string | null;
};

/**
 * Fila de «Atender primero» (boceto): casilla para marcar hecha (tareas) o ícono, título y contexto, y a la derecha
 * cuándo vence (en rojo si ya pasó). En escritorio, al pasar el ratón: Llamar y WhatsApp (solicitudes), Posponer y Más;
 * clic derecho abre Más; con la fila enfocada, E la marca hecha y P abre Posponer. En el teléfono: deslizar a la derecha
 * = hecho, a la izquierda = posponer; mantener presionada abre las acciones.
 */
export function FilaHoy({ item: i, ...a }: { item: ItemHoy } & Omit<Acciones, "alHoja"> & { alHoja: Acciones["alHoja"] }) {
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [pospone, setPospone] = useState(false);
  const [dx, setDx] = useState(0);
  const [arrastra, setArrastra] = useState(false);
  const toque = useRef<{ x: number; y: number; t: number; id: number; largo: number | null; horiz: boolean } | null>(null);
  const salto = useRef(false);
  const esTarea = i.clase === "tarea";
  const cerrable = sePuedeCerrar(i);
  const posponible = sePuedePosponer(i);
  const sale = a.saliendo === i.id;
  const tel = telLimpio(i.telefono);
  const wa = waDe(i);
  const contacto = i.clase === "consulta" && Boolean(tel || wa);
  const abrir = textoAbrir(i);

  const tecla = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); a.alAbrir(i); }
    else if (cerrable && (e.key === "e" || e.key === "E")) { e.preventDefault(); a.alHecha(i); }
    else if (posponible && (e.key === "p" || e.key === "P")) { e.preventDefault(); setPospone(true); }
  };
  // Más allá de 120 px la fila se resiste (boceto).
  const freno = (x: number) => { const v = Math.abs(x), s = x < 0 ? -1 : 1; return v <= 120 ? x : s * (120 + (v - 120) * 0.3); };
  const abajo = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "touch" || toque.current) return;
    salto.current = false;
    const largo = window.setTimeout(() => {
      const t = toque.current;
      if (!t || t.horiz) return;
      toque.current = null; salto.current = true;
      try { navigator.vibrate?.(8); } catch { /* sin vibración */ }
      a.alHoja(i, "menu");
    }, 480);
    toque.current = { x: e.clientX, y: e.clientY, t: Date.now(), id: e.pointerId, largo, horiz: false };
  };
  const mover = (e: PointerEvent<HTMLDivElement>) => {
    const t = toque.current;
    if (!t || t.id !== e.pointerId) return;
    const x = e.clientX - t.x, y = e.clientY - t.y;
    if (!t.horiz) {
      if (Math.abs(x) > 8 && Math.abs(x) > Math.abs(y)) {
        t.horiz = true;
        if (t.largo) { window.clearTimeout(t.largo); t.largo = null; }
        try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* sin captura */ }
        setArrastra(true);
      } else if (Math.abs(y) > 8) {
        if (t.largo) window.clearTimeout(t.largo);
        toque.current = null; return;
      } else return;
    }
    // Solo se desliza hacia donde hay acción: a la derecha si se puede cerrar, a la izquierda si se puede posponer.
    const v = freno(x);
    setDx(v > 0 ? (cerrable ? v : 0) : (posponible ? v : 0));
  };
  const arriba = () => {
    const t = toque.current;
    toque.current = null;
    if (t?.largo) window.clearTimeout(t.largo);
    setArrastra(false);
    if (!t?.horiz) return;
    salto.current = true;
    const rapido = Math.abs(dx) > 24 && Math.abs(dx) / Math.max(1, Date.now() - t.t) > 0.11;
    setDx(0);
    if (dx >= 88 || (dx > 0 && rapido)) a.alHecha(i);
    else if (dx <= -88 || (dx < 0 && rapido)) a.alHoja(i, "posponer");
  };

  return (
    <div className="pn-hoy-fila" data-tono={i.tono} data-clase={i.clase} data-contacto={contacto ? "" : undefined}
      data-ocupado={a.ocupado === i.id && !sale ? "" : undefined} data-saliendo={sale ? "" : undefined}>
      <span className="pn-hoy-fondo" data-lado={dx > 0 ? "hecho" : dx < 0 ? "posponer" : undefined} aria-hidden>
        <span style={{ opacity: dx > 0 ? Math.min(1, dx / 72) : 0 }}><Gesto nombre="palomita" tamano={18} />Hecho</span>
        <span style={{ opacity: dx < 0 ? Math.min(1, -dx / 72) : 0 }}>Posponer<Icono nombre="cita" tamano={18} /></span>
      </span>
      <div
        className="pn-hoy-cuerpo" role="button" tabIndex={0} data-arrastra={arrastra ? "" : undefined}
        style={dx ? { transform: `translateX(${Math.round(dx)}px)` } : undefined}
        aria-label={`${i.titulo}. ${i.ctx}. ${i.lado}`} aria-keyshortcuts={[cerrable ? "E" : "", posponible ? "P" : ""].filter(Boolean).join(" ") || undefined}
        onClick={(e) => {
          if (salto.current) { salto.current = false; return; }
          if ((e.target as HTMLElement).closest("button,a")) return;
          a.alAbrir(i);
        }}
        onKeyDown={tecla} onContextMenu={(e) => { e.preventDefault(); setMenu(true); }}
        onPointerDown={abajo} onPointerMove={mover} onPointerUp={arriba} onPointerCancel={arriba}
      >
        {esTarea ? (
          <button type="button" className="pn-hoy-ck" aria-label={`Marcar como hecha: ${i.titulo}`} aria-pressed={sale} disabled={a.ocupado === i.id || sale} onClick={() => a.alHecha(i)}>
            <span><Gesto nombre="palomita" tamano={14} /></span>
          </button>
        ) : (
          <span className="pn-hoy-ic" aria-hidden><Icono nombre={ICONO[i.clase]} tamano={20} /></span>
        )}
        <span className="pn-hoy-txt">
          <span className="pn-hoy-t">{i.titulo}</span>
          <span className="pn-hoy-c">{i.ctx}</span>
        </span>
        {contacto ? (
          <span className="pn-hoy-contacto">
            {tel ? <a className="pn-hoy-tb" href={`tel:${tel}`} aria-label={`Llamar: ${i.titulo}`}><Icono nombre="llamada" tamano={20} /></a> : null}
            {wa ? <a className="pn-hoy-tb" href={wa} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp: ${i.titulo}`}><Icono nombre="mensaje" tamano={20} /></a> : null}
          </span>
        ) : null}
        <span className="pn-hoy-acc">
          {contacto && tel ? <a className="pn-hoy-ib" href={`tel:${tel}`} aria-label={`Llamar: ${i.titulo}`} title="Llamar"><Icono nombre="llamada" tamano={16} /></a> : null}
          {contacto && wa ? <a className="pn-hoy-ib" href={wa} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp: ${i.titulo}`} title="WhatsApp"><Icono nombre="mensaje" tamano={16} /></a> : null}
          {posponible ? (
            <DropdownMenu open={pospone} onOpenChange={setPospone}>
              <DropdownMenuTrigger className="pn-hoy-ib" aria-label={`Posponer: ${i.titulo}`} title="Posponer"><Icono nombre="cita" tamano={16} /></DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[240px]">
                <ItemsPosponer opciones={opcionesDe(i, new Date())} alElegir={(o) => a.alPosponer(i, o.fecha, o.hora)} alElegirFecha={() => a.alElegirFecha(i)} />
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          <DropdownMenu open={menu} onOpenChange={setMenu}>
            <DropdownMenuTrigger className="pn-hoy-ib" aria-label={`Más acciones: ${i.titulo}`} title="Más acciones"><Gesto nombre="puntos" tamano={16} /></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[240px]">
              {tel ? <DropdownMenuItem asChild><a href={`tel:${tel}`}>Llamar</a></DropdownMenuItem> : null}
              {wa ? <DropdownMenuItem asChild><a href={wa} target="_blank" rel="noopener noreferrer">WhatsApp</a></DropdownMenuItem> : null}
              {i.expedienteId ? <DropdownMenuItem onSelect={() => router.push(rutaAsunto(i.expedienteId ?? ""))}>Abrir expediente</DropdownMenuItem> : null}
              {i.href && abrir ? <DropdownMenuItem onSelect={() => router.push(i.href ?? "")}>{abrir}</DropdownMenuItem> : null}
              <DropdownMenuItem onSelect={() => a.alAbrir(i)}>Ver detalle</DropdownMenuItem>
              {posponible || cerrable ? <DropdownMenuSeparator /> : null}
              {posponible ? <DropdownMenuItem onSelect={() => setPospone(true)}>Posponer <span className="pn-hoy-h">P</span></DropdownMenuItem> : null}
              {cerrable ? <DropdownMenuItem className="pn-hoy-mi-fuerte" onSelect={() => a.alHecha(i)}>{textoCerrar(i)} <span className="pn-hoy-h">E</span></DropdownMenuItem> : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </span>
        <span className="pn-hoy-lado" data-tono={i.tono}>{i.lado}</span>
      </div>
    </div>
  );
}

/** Teléfono (boceto): «Acciones» al mantener presionada una fila y «Posponer» al deslizarla a la izquierda. */
export function HojaAccionesHoy({ item: i, modo, alCerrar, alModo, ...a }: {
  item: ItemHoy | null; modo: ModoHoja; alCerrar: () => void; alModo: (m: ModoHoja) => void;
} & Pick<Acciones, "alHecha" | "alPosponer" | "alElegirFecha" | "alAbrir" | "hoy">) {
  const router = useRouter();
  if (!i) return <HojaAdaptable abierta={false} alCerrar={alCerrar} titulo="Acciones"><span /></HojaAdaptable>;
  const tel = telLimpio(i.telefono);
  const wa = waDe(i);
  const abrir = textoAbrir(i);
  const ir = (href: string) => { alCerrar(); router.push(href); };
  const hecho = () => { alCerrar(); a.alHecha(i); };
  const pospone = (o: OpcionPosponer) => { alCerrar(); a.alPosponer(i, o.fecha, o.hora); };
  if (modo === "posponer") {
    return (
      <HojaAdaptable abierta alCerrar={alCerrar} titulo="Posponer" descripcion={i.titulo}>
        <OpcionesPosponer opciones={opcionesDe(i, new Date())} alElegir={pospone} alElegirFecha={() => { alCerrar(); a.alElegirFecha(i); }} />
      </HojaAdaptable>
    );
  }
  return (
    <HojaAdaptable abierta alCerrar={alCerrar} titulo={i.titulo}>
      <div className="pn-hoy-opts">
        {tel ? <a className="pn-hoy-opt" href={`tel:${tel}`} onClick={alCerrar}><span>Llamar</span><Icono nombre="llamada" tamano={20} /></a> : null}
        {wa ? <a className="pn-hoy-opt" href={wa} target="_blank" rel="noopener noreferrer" onClick={alCerrar}><span>WhatsApp</span><Icono nombre="mensaje" tamano={20} /></a> : null}
        {i.expedienteId ? <button type="button" className="pn-hoy-opt" onClick={() => ir(rutaAsunto(i.expedienteId ?? ""))}><span>Abrir expediente</span><Gesto nombre="derecha" tamano={18} /></button> : null}
        {i.href && abrir ? <button type="button" className="pn-hoy-opt" onClick={() => ir(i.href ?? "")}><span>{abrir}</span><Gesto nombre="derecha" tamano={18} /></button> : null}
        <button type="button" className="pn-hoy-opt" onClick={() => { alCerrar(); a.alAbrir(i); }}><span>Ver detalle</span><Gesto nombre="derecha" tamano={18} /></button>
        {sePuedePosponer(i) ? <button type="button" className="pn-hoy-opt" onClick={() => alModo("posponer")}><span>Posponer</span><Icono nombre="cita" tamano={18} /></button> : null}
        {sePuedeCerrar(i) ? <button type="button" className="pn-hoy-opt pn-hoy-opt-fuerte" onClick={hecho}><span>{textoCerrar(i)}</span><Gesto nombre="palomita" tamano={18} /></button> : null}
      </div>
    </HojaAdaptable>
  );
}

/** Detalle de un pendiente (boceto): hoja desde abajo en el teléfono, panel al costado en escritorio. */
export function DetalleHoy({ item: i, alCerrar, ...a }: { item: ItemHoy | null; alCerrar: () => void } & Omit<Acciones, "alAbrir" | "alHoja">) {
  const telefono = useEsTelefono();
  const ancho = useEsAncho();
  if (!i) return <HojaAdaptable abierta={false} alCerrar={alCerrar} titulo="Pendiente"><span /></HojaAdaptable>;
  const lateral = ancho && !telefono;
  const tel = telLimpio(i.telefono);
  const wa = waDe(i);
  const posponible = sePuedePosponer(i);
  const accesos: { texto: string; href: string; icono: NombreIcono; externo?: boolean }[] = [];
  if (tel) accesos.push({ texto: "Llamar", href: `tel:${tel}`, icono: "llamada" });
  if (wa) accesos.push({ texto: "WhatsApp", href: wa, icono: "mensaje", externo: true });
  if (i.expedienteId) accesos.push({ texto: "Expediente", href: rutaAsunto(i.expedienteId), icono: "expediente" });
  if (i.href) accesos.push({ texto: nombreAcceso(i), href: i.href, icono: iconoAcceso(i) });
  const pill = <span className={`pn-pill${i.tono === "error" ? " pn-pill-error" : i.tono === "aviso" ? " pn-pill-aviso" : ""}`}>{etiquetaDetalle(i)}</span>;
  return (
    <HojaAdaptable abierta alCerrar={alCerrar} titulo={i.titulo} cabecera={pill}>
      <div style={{ display: "grid", gap: lateral ? 20 : 16 }}>
        <div style={{ display: "grid", gap: 6, justifyItems: "start" }}>
          {lateral ? <p style={{ margin: 0, fontSize: 24, fontWeight: 600, lineHeight: 1.2 }}>{i.titulo}</p> : pill}
          <p style={{ margin: 0, fontSize: 14, color: "var(--ink-muted)" }}>{i.ctx}</p>
        </div>
        {accesos.length ? (
          <div className="pn-accesos" style={{ gridTemplateColumns: `repeat(${Math.min(accesos.length, 3)}, minmax(0, 1fr))` }}>
            {accesos.slice(0, 3).map((x) => x.externo
              ? <a key={x.texto} className="pn-acceso-btn" href={x.href} target="_blank" rel="noopener noreferrer"><Icono nombre={x.icono} tamano={20} />{x.texto}</a>
              : <Link key={x.texto} className="pn-acceso-btn" href={x.href}><Icono nombre={x.icono} tamano={20} />{x.texto}</Link>)}
          </div>
        ) : null}
        {posponible || sePuedeCerrar(i) ? (
          <div style={{ display: "grid", gridTemplateColumns: posponible && sePuedeCerrar(i) ? "1fr 1fr" : "1fr", gap: 8 }}>
            {posponible ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="pn-sbtn pn-sbtn-suave pn-hoy-bt">Posponer</DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[240px]">
                  <ItemsPosponer opciones={opcionesDe(i, new Date())} alElegir={(o) => { a.alPosponer(i, o.fecha, o.hora); alCerrar(); }} alElegirFecha={() => a.alElegirFecha(i)} />
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
            <button type="button" className="pn-sbtn pn-hoy-bt" disabled={a.ocupado === i.id} onClick={() => { a.alHecha(i); alCerrar(); }}>{textoCerrar(i)}</button>
          </div>
        ) : null}
      </div>
    </HojaAdaptable>
  );
}

/** «Elegir fecha…» de Posponer: calendario en hoja. */
export function HojaPosponer({ item, hoy, alCerrar, alElegir }: { item: ItemHoy | null; hoy: Date; alCerrar: () => void; alElegir: (i: ItemHoy, fecha: string) => void }) {
  return (
    <HojaAdaptable abierta={Boolean(item)} alCerrar={alCerrar} titulo="Posponer a otra fecha" descripcion={item?.titulo}>
      {item ? <SelectorFecha valor={item.tarea?.vence ?? null} hoy={hoy} etiqueta="Nueva fecha" alElegir={(f) => { alElegir(item, f); alCerrar(); }} /> : <span />}
    </HojaAdaptable>
  );
}
