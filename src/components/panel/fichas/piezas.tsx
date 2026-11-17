"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { Gesto, Icono } from "@/components/panel/icons";
import { Boton } from "@/components/panel/kit/boton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/panel/ui/dropdown-menu";
import { HojaAdaptable, useEsTelefono } from "@/components/panel/ui/hoja-adaptable";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/panel/ui/popover";
import { Switch } from "@/components/panel/ui/switch";

import "./fichas.css";

export const iniciales = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";

export function Avatar({ nombre, grande }: { nombre: string; grande?: boolean }) {
  return <span className="fx-av" data-grande={grande || undefined} aria-hidden>{iniciales(nombre)}</span>;
}

export function Rol({ children, grande }: { children: ReactNode; grande?: boolean }) {
  return <span className="fx-rol" data-grande={grande || undefined}>{children}</span>;
}

/**
 * Lista a la izquierda y ficha a la derecha (bocetos de Personas, Bandeja y Consultas).
 * En pantallas de menos de 1024 px se ve una a la vez: la lista, o la ficha con «← Volver» arriba.
 */
export function MaestroDetalle({ abierta, ancho = 420, bordeCuerpo, lista, detalle, volver }: {
  abierta: boolean; ancho?: number; bordeCuerpo?: boolean;
  lista: ReactNode; detalle: ReactNode;
  volver: { etiqueta: string; alPulsar: () => void };
}) {
  const ref = useRef<HTMLDivElement>(null);
  // En el teléfono, al abrir una ficha se sube al principio (la lista quedó abajo).
  useEffect(() => { if (abierta && window.matchMedia("(max-width: 1023px)").matches) window.scrollTo({ top: 0 }); }, [abierta]);
  return (
    <div ref={ref} className="fx-md" data-abierta={abierta || undefined} style={{ ["--fx-ancho" as string]: `${ancho}px` }}>
      <section className="fx-lista" data-borde-cuerpo={bordeCuerpo || undefined} aria-label="Lista">{lista}</section>
      <div className="fx-detalle">
        <button type="button" className="fx-volver" onClick={volver.alPulsar} style={{ marginLeft: 10 }}>
          <Gesto nombre="izquierda" tamano={18} />{volver.etiqueta}
        </button>
        {detalle}
      </div>
    </div>
  );
}

export function Buscador({ valor, alCambiar, etiqueta, placeholder, id }: { valor: string; alCambiar: (v: string) => void; etiqueta: string; placeholder: string; id?: string }) {
  return (
    <label className="fx-busca">
      <Icono nombre="buscar" tamano={18} />
      <span className="pn-solo-lector">{etiqueta}</span>
      <input id={id} type="search" value={valor} onChange={(e) => alCambiar(e.target.value)} placeholder={placeholder} autoComplete="off" />
    </label>
  );
}

export type OpcionFiltro = { etiqueta: string; cuenta?: number; activa: boolean; alPulsar: () => void };
export type GrupoFiltro =
  | { titulo: string; tipo: "radio" | "check"; opciones: OpcionFiltro[] }
  | { titulo?: string; tipo: "interruptores"; opciones: (OpcionFiltro & { ayuda?: string; tono?: "aviso" })[] };

/** «Filtrar y ordenar» del boceto: ventana flotante en escritorio y hoja desde abajo en el teléfono. Los cambios se ven al momento. */
export function BotonFiltros({ grupos, activos, alLimpiar, verTexto, conTexto, extra }: {
  grupos: GrupoFiltro[]; activos: number; alLimpiar: () => void; verTexto: string; conTexto?: boolean; extra?: ReactNode;
}) {
  const [abierto, setAbierto] = useState(false);
  const telefono = useEsTelefono();
  const etiqueta = activos ? `Filtrar y ordenar, ${activos} ${activos === 1 ? "filtro puesto" : "filtros puestos"}` : "Filtrar y ordenar";
  const boton = (
    <button type="button" className="fx-fbtn" data-solo-icono={conTexto ? undefined : ""} aria-haspopup="dialog" aria-expanded={abierto}
      aria-label={conTexto ? undefined : etiqueta} title="Filtrar y ordenar" onClick={telefono ? () => setAbierto(true) : undefined}>
      <Icono nombre="filtrar" tamano={18} />
      {conTexto ? "Filtrar y ordenar" : null}
      {activos ? <span className="fx-fb" aria-hidden={!conTexto || undefined}>{activos}</span> : null}
    </button>
  );
  const cuerpo = (
    <div className="fx-fpop">
      <div className="fx-fpop-cab">
        {telefono ? <span /> : <h2>Filtrar y ordenar</h2>}
        <button type="button" className="fx-dlink" data-acento="" aria-disabled={!activos || undefined} onClick={alLimpiar} style={{ marginRight: -8 }}>Limpiar</button>
      </div>
      {extra}
      {grupos.map((g, i) => <GrupoDeFiltro key={g.titulo ?? i} g={g} />)}
      <Boton bloque onClick={() => setAbierto(false)}>{verTexto}</Boton>
    </div>
  );
  if (telefono) {
    return (
      <>
        {boton}
        <HojaAdaptable abierta={abierto} alCerrar={() => setAbierto(false)} titulo="Filtrar y ordenar">{cuerpo}</HojaAdaptable>
      </>
    );
  }
  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger asChild>{boton}</PopoverTrigger>
      <PopoverContent align="start" className="w-[360px] max-h-[620px] overflow-y-auto p-4" aria-label="Filtrar y ordenar">{cuerpo}</PopoverContent>
    </Popover>
  );
}

function GrupoDeFiltro({ g }: { g: GrupoFiltro }) {
  const id = useId();
  if (g.tipo === "interruptores") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {g.titulo ? <span className="fx-fh">{g.titulo}</span> : null}
        <div className="fx-tarjeta">
          {g.opciones.map((o, i) => (
            <div key={o.etiqueta} className="fx-swrow">
              <label htmlFor={`${id}-${i}`} className="fx-swrow-txt" style={{ cursor: "pointer" }}>
                <b>{o.etiqueta}</b>
                {o.ayuda ? <span style={o.tono === "aviso" ? { color: "var(--warning)" } : undefined}>{o.ayuda}</span> : null}
              </label>
              <Switch id={`${id}-${i}`} checked={o.activa} onCheckedChange={() => o.alPulsar()} />
            </div>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span className="fx-fh" id={id}>{g.titulo}</span>
      <div className="fx-tarjeta" role={g.tipo === "radio" ? "radiogroup" : "group"} aria-labelledby={id}>
        {g.opciones.map((o) => (
          <button key={o.etiqueta} type="button" className="fx-ck" role={g.tipo === "radio" ? "radio" : "checkbox"} aria-checked={o.activa} onClick={o.alPulsar}>
            <span className="fx-caja">{g.tipo === "check" ? <Gesto nombre="palomita" tamano={14} /> : null}</span>
            <span>{o.etiqueta}</span>
            {o.cuenta !== undefined ? <span className="fx-h">{o.cuenta}</span> : null}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ResumenFiltros({ texto, alLimpiar }: { texto: string; alLimpiar: () => void }) {
  if (!texto) return null;
  return <div className="fx-fsum" aria-live="polite"><span>{texto}</span><button type="button" onClick={alLimpiar}>Limpiar</button></div>;
}

/** Pestañas de una ficha (excepción a la regla del desplegable). Flechas izquierda y derecha para pasar de una a otra. */
export function Pestanas<V extends string>({ opciones, valor, alElegir, etiqueta, segmentadas }: {
  opciones: readonly { valor: V; etiqueta: string }[]; valor: V; alElegir: (v: V) => void; etiqueta: string; segmentadas?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const tecla = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const i = opciones.findIndex((o) => o.valor === valor);
    const sig = opciones[(i + (e.key === "ArrowRight" ? 1 : opciones.length - 1)) % opciones.length];
    alElegir(sig.valor);
    requestAnimationFrame(() => ref.current?.querySelector<HTMLElement>("[aria-selected=true]")?.focus());
  };
  return (
    <div ref={ref} className={segmentadas ? "fx-seg" : "fx-tabs"} role="tablist" aria-label={etiqueta} onKeyDown={tecla}>
      {opciones.map((o) => (
        <button key={o.valor} type="button" role="tab" aria-selected={o.valor === valor} tabIndex={o.valor === valor ? 0 : -1} onClick={() => alElegir(o.valor)}>{o.etiqueta}</button>
      ))}
    </div>
  );
}

/** Grupo de datos de una ficha: título, nota a la derecha («Faltan 2»), tarjeta con filas, consejo y acciones. */
export function GrupoDatos({ titulo, nota, notaAviso, consejo, acciones, accionTitulo, children }: {
  titulo: ReactNode; nota?: string; notaAviso?: boolean; consejo?: string; acciones?: ReactNode; accionTitulo?: ReactNode; children: ReactNode;
}) {
  return (
    <section className="fx-seccion">
      <div className="fx-seccion-cab">
        <h3>{titulo}</h3>
        {accionTitulo ?? (nota ? <span className="fx-nota" data-aviso={notaAviso || undefined}>{nota}</span> : null)}
      </div>
      <div className="fx-tarjeta">{children}</div>
      {consejo ? <p className="fx-consejo">{consejo}</p> : null}
      {acciones ? <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>{acciones}</div> : null}
    </section>
  );
}

/**
 * Un dato de la ficha. Se toca para cambiarlo; vacío dice «Sin dato» y ofrece «Agregar».
 * Con `secreto` (CURP, RFC) se ve oculto, con «Mostrar» y «Copiar».
 */
export function FilaDato({ etiqueta, valor, vacio = "Sin dato", avisoVacio, nota, secreto, copiar, alEditar, alCopiar, sinAgregar }: {
  etiqueta: string; valor?: string | null; vacio?: string; avisoVacio?: boolean; nota?: string;
  secreto?: boolean; copiar?: boolean; alEditar?: () => void; alCopiar?: (texto: string) => void; sinAgregar?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const v = valor?.trim() ?? "";
  const texto = !v ? vacio : secreto && !visible ? `${v.slice(0, 4)} •••• ${v.slice(-3)}` : v;
  const cuerpo = (
    <>
      <span className="fx-dk">{etiqueta}</span>
      <span className="fx-dv" data-vacio={!v && !avisoVacio ? "" : undefined} data-aviso={!v && avisoVacio ? "" : undefined}>{texto}</span>
      {nota ? <span className="fx-dn">{nota}</span> : null}
    </>
  );
  return (
    <div className="fx-drow">
      {alEditar ? <button type="button" className="fx-dmain" onClick={alEditar} aria-label={`${etiqueta}: ${v ? (secreto && !visible ? "oculto" : v) : vacio}. Cambiar`}>{cuerpo}</button> : <div className="fx-dmain">{cuerpo}</div>}
      {secreto && v ? <button type="button" className="fx-dlink" onClick={() => setVisible((x) => !x)}>{visible ? "Ocultar" : "Mostrar"}</button> : null}
      {copiar && v && alCopiar ? (
        <button type="button" className="fx-icono-btn" aria-label={`Copiar ${etiqueta}`} title={`Copiar ${etiqueta}`} onClick={() => alCopiar(v)}><Icono nombre="expediente" tamano={18} /></button>
      ) : null}
      {!v && alEditar && !sinAgregar ? <button type="button" className="fx-dlink" data-acento="" onClick={alEditar}>Agregar</button> : null}
    </div>
  );
}

export type ItemMenu = { etiqueta: string; alPulsar: () => void; peligro?: boolean; separar?: boolean; deshabilitado?: boolean };

/** Menú «⋯» con las acciones que se usan poco. */
export function MenuMas({ items, etiqueta = "Más acciones", claseBoton = "pn-btn pn-btn-secundario", estilo }: { items: ItemMenu[]; etiqueta?: string; claseBoton?: string; estilo?: React.CSSProperties }) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className={claseBoton} aria-label={etiqueta} title={etiqueta} style={{ width: 44, padding: 0, ...estilo }}>
        <Gesto nombre="puntos" tamano={18} />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60">
        {items.map((it) => (
          <span key={it.etiqueta} style={{ display: "contents" }}>
            {it.separar ? <DropdownMenuSeparator /> : null}
            <DropdownMenuItem peligro={it.peligro} disabled={it.deshabilitado} onSelect={it.alPulsar}>{it.etiqueta}</DropdownMenuItem>
          </span>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Cambiar un solo dato: lista de opciones (estado civil, canal, horario) o un campo de texto. Esc cierra. */
export function EditarDato({ abierto, etiqueta, valor, opciones, ayuda, max = 200, tipo = "text", mayusculas, cuentaDe, alGuardar, alCerrar }: {
  abierto: boolean; etiqueta: string; valor: string; opciones?: readonly string[]; ayuda?: string; max?: number;
  tipo?: "text" | "tel" | "email"; mayusculas?: boolean; cuentaDe?: number;
  alGuardar: (v: string) => void; alCerrar: () => void;
}) {
  return (
    <HojaAdaptable abierta={abierto} titulo={etiqueta} alCerrar={alCerrar}>
      {abierto ? <CuerpoEditar key={etiqueta} etiqueta={etiqueta} valor={valor} opciones={opciones} ayuda={ayuda} max={max} tipo={tipo} mayusculas={mayusculas} cuentaDe={cuentaDe} alGuardar={alGuardar} alCerrar={alCerrar} /> : null}
    </HojaAdaptable>
  );
}

function CuerpoEditar({ etiqueta, valor, opciones, ayuda, max, tipo, mayusculas, cuentaDe, alGuardar, alCerrar }: {
  etiqueta: string; valor: string; opciones?: readonly string[]; ayuda?: string; max: number; tipo: "text" | "tel" | "email"; mayusculas?: boolean; cuentaDe?: number;
  alGuardar: (v: string) => void; alCerrar: () => void;
}) {
  const [texto, setTexto] = useState(valor);
  const id = useId();
  if (opciones) {
    return (
      <div className="fx-tarjeta" style={{ marginTop: 8 }}>
        {opciones.map((o) => (
          <button key={o} type="button" className="fx-opt" onClick={() => alGuardar(o)} aria-pressed={o === valor}>
            {o}{o === valor ? <Gesto nombre="palomita" tamano={18} style={{ color: "var(--accent)" }} /> : null}
          </button>
        ))}
      </div>
    );
  }
  const limpio = mayusculas ? texto.toUpperCase().replace(/\s/g, "") : texto;
  const pista = cuentaDe ? `${limpio.trim().length} de ${cuentaDe}${ayuda ? ` · ${ayuda}` : ""}` : ayuda;
  return (
    <form style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }} onSubmit={(e) => { e.preventDefault(); alGuardar(limpio.trim()); }}>
      <div className="pn-campo">
        <label htmlFor={id}>{etiqueta}</label>
        <input id={id} type={tipo} inputMode={tipo === "tel" ? "tel" : undefined} value={texto} maxLength={max} autoComplete="off" spellCheck={mayusculas ? false : undefined}
          style={mayusculas ? { textTransform: "uppercase" } : undefined} onChange={(e) => setTexto(e.target.value)} />
        {pista ? <span className="pn-campo-ayuda">{pista}</span> : null}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
        <Boton variante="secundario" onClick={alCerrar}>Cancelar</Boton>
        <Boton type="submit">Guardar</Boton>
      </div>
    </form>
  );
}

/** Atajos de teclado al pie de la lista (solo con teclado físico). */
export function PieAtajos({ atajos }: { atajos: [teclas: string[], texto: string][] }) {
  return (
    <div className="fx-atajos" aria-hidden>
      {atajos.map(([t, x]) => <span key={x}>{t.map((k) => <kbd key={k} className="pn-kbd" style={{ marginRight: 3 }}>{k}</kbd>)} {x}</span>)}
    </div>
  );
}

/** Copiar al portapapeles con aviso. */
export function copiarTexto(texto: string, avisar: (t: string) => void, que = "Copiado") {
  if (!navigator.clipboard) { avisar("No se pudo copiar. Selecciónalo y cópialo."); return; }
  navigator.clipboard.writeText(texto).then(() => avisar(que), () => avisar("No se pudo copiar. Selecciónalo y cópialo."));
}

/** Ancho del contenedor (para que la ficha se acomode igual en la pantalla completa y dentro de una hoja de Asuntos). */
export function useAncho<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [ancho, setAncho] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => setAncho(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, ancho];
}
