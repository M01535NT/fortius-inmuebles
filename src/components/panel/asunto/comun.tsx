"use client";
import { useEffect, useId, useRef, useState } from "react";

import { Icono } from "@/components/panel/icons";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/panel/ui/dialog";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/panel/ui/dropdown-menu";
import type { Asunto, Moneda, PersonaDelAsunto, Quien } from "@/lib/panel/asuntos/api";

/** Corre un cambio y vuelve a leer el asunto; avisa lo que pasó (con «Deshacer» si se puede). */
export type Hacer = (accion: () => Promise<unknown>, aviso?: string, deshacer?: () => Promise<unknown>) => Promise<void>;

export function useFoco<T extends HTMLElement>(activo: boolean) {
  const ref = useRef<T>(null);
  useEffect(() => { if (activo) ref.current?.focus(); }, [activo]);
  return ref;
}

/** «$1,250,000 MXN». Pesos y dólares no se mezclan: toda cantidad dice su moneda. */
export const dinero = (n: number | null | undefined, moneda: Moneda = "MXN") =>
  n === null || n === undefined ? "—" : `$${n.toLocaleString("es-MX", { maximumFractionDigits: 2 })} ${moneda}`;

/** Lee un monto escrito a mano («1,250,000», «$ 3 500.50»). Vacío o inválido: null. */
export function leerMonto(texto: string): number | null {
  const limpio = texto.replace(/[^0-9.]/g, "");
  if (!limpio) return null;
  const n = Number(limpio);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}

/** De 8:00 a 19:00 cada media hora, para visitas y citas. */
export const HORAS = Array.from({ length: 23 }, (_, i) => {
  const v = `${String(8 + Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`;
  return { valor: v, etiqueta: v };
});

const digitos = (tel: string | null) => tel?.replace(/\D/g, "") ?? "";

/** A quién se le escribe según quién hace la tarea: el cliente es el primer propietario, titular o contacto con teléfono. */
export function personaPara(a: Asunto, quien: Quien): PersonaDelAsunto | null {
  const vivas = a.personas.filter((p) => !p.fallecida && !p.no_contactar && digitos(p.telefono).length >= 8);
  // Un «quién» que agregue el director en Catálogos no tiene a quién escribirle todavía.
  const papeles: Partial<Record<Quien, string[]>> = {
    cliente: ["propietario", "titular", "vendedor", "comprador", "heredero", "inquilino", "inversionista", "contacto", "copropietario"],
    abogado: ["abogado"], notaria: ["notaria"], otro: ["apoderado", "banco", "contraparte"], fortius: [],
  };
  for (const papel of papeles[quien] ?? []) { const p = vivas.find((x) => x.papel === papel); if (p) return p; }
  return quien === "cliente" ? vivas[0] ?? null : null;
}

/** Enlace de WhatsApp con el mensaje escrito. Nada se envía solo: lo envía la persona (SPEC.md, sección 13). */
export const enlaceWhatsApp = (texto: string, tel?: string | null) => {
  const d = digitos(tel ?? null);
  return `https://wa.me/${d.length >= 8 ? d : ""}?text=${encodeURIComponent(texto)}`;
};

export const primerNombre = (n: string) => n.trim().split(/\s+/)[0] ?? n;

/** El mensaje listo para WhatsApp, que se puede cambiar antes de abrirlo. */
export function DialogoMensaje({ abierto, titulo, inicial, para, alCerrar, alEnviar }: {
  abierto: boolean; titulo: string; inicial: string; para: Pick<PersonaDelAsunto, "nombre" | "telefono"> | null; alCerrar: () => void; alEnviar?: () => void;
}) {
  return (
    <Dialog open={abierto} onOpenChange={(o) => { if (!o) alCerrar(); }}>
      <DialogContent className="max-w-md">
        <DialogTitle>{titulo}</DialogTitle>
        <DialogDescription>{para ? `Para ${para.nombre}. Lo envías tú desde WhatsApp.` : "Elige a quién en WhatsApp. Lo envías tú."}</DialogDescription>
        {abierto ? <FormaMensaje inicial={inicial} para={para} alCerrar={alCerrar} alEnviar={alEnviar} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function FormaMensaje({ inicial, para, alCerrar, alEnviar }: { inicial: string; para: Pick<PersonaDelAsunto, "nombre" | "telefono"> | null; alCerrar: () => void; alEnviar?: () => void }) {
  const id = useId();
  const [texto, setTexto] = useState(inicial);
  return (
    <div className="as-form">
      <label className="sr-only" htmlFor={id}>Mensaje</label>
      <textarea id={id} className="as-inp as-inp-borde as-area" rows={6} value={texto} maxLength={2000} onChange={(e) => setTexto(e.target.value)} />
      <div className="as-fila as-fin">
        <button type="button" className="as-btn" onClick={() => { void navigator.clipboard?.writeText(texto); }}><Icono nombre="copia" tamano={16} />Copiar</button>
        <a className="as-btn as-pri" href={enlaceWhatsApp(texto, para?.telefono)} target="_blank" rel="noopener noreferrer"
          onClick={() => { alEnviar?.(); alCerrar(); }}>
          <Icono nombre="chat" tamano={16} />Abrir WhatsApp
        </a>
      </div>
    </div>
  );
}

/** Botón que abre el selector de archivos (PDF o fotos; en el teléfono, también la cámara). */
export function BotonSubir({ etiqueta, varios = true, soloFotos, alElegir, clase = "as-btn", icono = "subir" }: {
  etiqueta: string; varios?: boolean; soloFotos?: boolean; alElegir: (archivos: File[]) => void; clase?: string; icono?: "subir" | "img";
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button type="button" className={clase} onClick={() => ref.current?.click()}><Icono nombre={icono} tamano={16} />{etiqueta}</button>
      <input ref={ref} type="file" hidden multiple={varios} accept={soloFotos ? "image/jpeg,image/png,image/webp" : "application/pdf,image/jpeg,image/png,image/webp"}
        onChange={(e) => { const f = [...(e.target.files ?? [])]; e.target.value = ""; if (f.length) alElegir(f); }} />
    </>
  );
}

/** Varias opciones a la vez (por ejemplo «Qué debe»): un campo que abre una lista con casillas. */
export function ElegirVarios<T extends string>({ etiqueta, valores, opciones, alCambiar, vacio = "Elegir" }: {
  etiqueta: string; valores: readonly T[]; opciones: readonly { valor: T; etiqueta: string }[]; alCambiar: (v: T[]) => void; vacio?: string;
}) {
  const id = useId();
  const texto = opciones.filter((o) => valores.includes(o.valor)).map((o) => o.etiqueta).join(", ");
  return (
    <div className="pn-campo">
      <span id={id}>{etiqueta}</span>
      <DropdownMenu>
        <DropdownMenuTrigger className="as-inp as-inp-borde as-elegir" aria-labelledby={id}>
          <span className={texto ? "" : "as-m"}>{texto || vacio}</span><Icono nombre="down" tamano={14} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-56">
          {opciones.map((o) => (
            <DropdownMenuCheckboxItem key={o.valor} checked={valores.includes(o.valor)} onSelect={(e) => e.preventDefault()}
              onCheckedChange={(c) => alCambiar(c ? [...valores, o.valor] : valores.filter((x) => x !== o.valor))}>
              {o.etiqueta}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
