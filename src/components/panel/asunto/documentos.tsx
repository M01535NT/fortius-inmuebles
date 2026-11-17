"use client";
import Link from "next/link";
import { useId, useRef, useState } from "react";

import { Icono } from "@/components/panel/icons";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Desplegable } from "@/components/panel/kit/desplegable";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/panel/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/panel/ui/dropdown-menu";
import {
  agregar, cambiar, diasHasta, fechaCorta, NOMBRE_PAPEL, subir, sumarDias, urlArchivo,
  type Asunto, type DocumentoDelAsunto, type ResultadoSubida,
} from "@/lib/panel/asuntos/api";
import { copiarGuia, cuantasTrae } from "@/lib/panel/biblioteca";

import { useGuias } from "../biblioteca/guias";
import { BotonSubir, DialogoMensaje, personaPara, primerNombre, type Hacer } from "./comun";

/** Lo que el boceto ofrece como «Documento por pedir» de entrada; lo demás se escribe. */
const COMUNES = ["Identificación oficial", "CURP", "Acta de nacimiento", "Acta de matrimonio", "Comprobante de domicilio", "Escritura",
  "Boleta predial", "Recibo de agua", "Certificado de libertad de gravamen", "Constancia de situación fiscal", "Poder notarial", "Avalúo"];

/** Quién lo entrega: una persona del asunto o un papel. */
function quienEntrega(a: Asunto, d: DocumentoDelAsunto): string {
  const p = d.entrega_persona_id ? a.personas.find((x) => x.persona_id === d.entrega_persona_id) : null;
  if (p) return primerNombre(p.nombre);
  if (d.entrega_papel === "fortius") return "Fortius";
  if (d.entrega_papel === "cliente" || !d.entrega_papel) return "el cliente";
  const n = NOMBRE_PAPEL[d.entrega_papel as keyof typeof NOMBRE_PAPEL];
  return n ? `${d.entrega_papel === "notaria" ? "la" : "el"} ${n.toLowerCase()}` : d.entrega_papel;
}

function Vence({ d }: { d: DocumentoDelAsunto }) {
  if (!d.vence_el) return null;
  const n = diasHasta(d.vence_el);
  return <span className={`as-pill ${n < 0 ? "as-pill-bad" : n <= (d.avisar_dias ?? 15) ? "as-pill-warn" : ""}`}>{n < 0 ? "Venció" : "Vence"} {fechaCorta(d.vence_el).toLowerCase()}</span>;
}

function Renglon({ a, d, hacer, pedir }: { a: Asunto; d: DocumentoDelAsunto; hacer: Hacer; pedir: (texto: string) => void }) {
  const recibido = d.estado === "recibido";
  const archivo = useRef<HTMLInputElement>(null);
  const opciones = [
    { valor: "fortius", etiqueta: "Fortius" }, { valor: "cliente", etiqueta: "El cliente" },
    ...a.personas.filter((p) => !p.fallecida).map((p) => ({ valor: `p:${p.persona_id}`, etiqueta: p.nombre })),
  ];
  const quien = d.entrega_persona_id ? `p:${d.entrega_persona_id}` : d.entrega_papel ?? "cliente";
  return (
    <div className="as-ren" data-est={d.estado}>
      <button type="button" className="as-ckb as-ckb-doc" aria-label={`${recibido ? "Marcar que falta" : "Marcar recibido"}: ${d.nombre}`}
        onClick={() => void hacer(() => cambiar(a.id, "documentos", { id: d.id, version: d.version, estado: recibido ? "falta" : "recibido" }), recibido ? "Marcado como faltante" : "Recibido")}>
        <span className={`as-ck as-ck-cu ${recibido ? "as-ck-ok" : ""}`}>{recibido ? <Icono nombre="ok" tamano={12} /> : null}</span>
      </button>
      <span className="as-ren-c">
        <b className={d.estado === "no_aplica" ? "as-tachado" : ""}>{d.nombre}</b>
        <span>
          {d.estado === "falta" ? <><span className="as-warn">Falta</span> · </> : d.estado === "no_aplica" ? "No aplica · " : null}
          Lo entrega {quienEntrega(a, d)}
          {d.archivos.length ? ` · ${d.archivos.length} archivo${d.archivos.length > 1 ? "s" : ""}` : ""}
          {d.archivos.some((x) => x.por_cliente) ? " · lo subió el cliente" : ""}
        </span>
      </span>
      <Vence d={d} />
      {d.trabajo_id && d.origen === "formato" ? (
        <Link className="as-btn as-gho as-ico" href={`/panel/documento/${d.trabajo_id}?volver=${encodeURIComponent(`/panel/asuntos?ver=${a.id}`)}`} aria-label={`Abrir ${d.nombre}`} title="Abrir y seguir llenando">
          <Icono nombre="lapiz" tamano={17} />
        </Link>
      ) : null}
      {d.archivos[0] ? (
        <a className="as-btn as-gho as-ico" href={urlArchivo(a.id, d.archivos[0].id)} target="_blank" rel="noopener noreferrer" aria-label={`Ver ${d.nombre}`} title="Ver archivo">
          <Icono nombre={d.archivos[0].mime === "application/pdf" ? "pdf" : "img"} tamano={17} />
        </a>
      ) : null}
      <input ref={archivo} type="file" hidden multiple accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(e) => {
        const f = [...(e.target.files ?? [])]; e.target.value = "";
        if (f.length) void hacer(() => subir(a.id, "documento", f, d.id), f.length > 1 ? `${f.length} archivos subidos` : "Archivo subido");
      }} />
      <DropdownMenu>
        <DropdownMenuTrigger className="as-btn as-gho as-ico" aria-label={`Opciones de ${d.nombre}`}><Icono nombre="dots" tamano={18} /></DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-60">
          <DropdownMenuItem onSelect={() => archivo.current?.click()}>
            <Icono nombre="subir" tamano={16} />{d.archivos.length ? "Subir otro archivo" : "Subir archivo o foto"}
          </DropdownMenuItem>
          {d.archivos.length > 1 ? d.archivos.slice(1).map((x, i) => (
            <DropdownMenuItem key={x.id} asChild><a href={urlArchivo(a.id, x.id)} target="_blank" rel="noopener noreferrer"><Icono nombre="ojo" tamano={16} />Ver archivo {i + 2}</a></DropdownMenuItem>
          )) : null}
          {d.estado === "falta" ? (
            <DropdownMenuItem onSelect={() => pedir(`Hola, para seguir con su trámite me falta: ${d.nombre}. Me lo puede mandar por aquí, en foto o PDF. Gracias.`)}>
              <Icono nombre="chat" tamano={16} />Pedirlo por WhatsApp
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem onSelect={() => void hacer(() => cambiar(a.id, "documentos", { id: d.id, version: d.version, estado: d.estado === "no_aplica" ? "falta" : "no_aplica" }), d.estado === "no_aplica" ? "Vuelve a la lista" : "No aplica")}>
            <Icono nombre="x" tamano={16} />{d.estado === "no_aplica" ? "Sí aplica" : "No aplica"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Vence</DropdownMenuLabel>
          {d.vence_el ? (
            <DropdownMenuItem onSelect={() => void hacer(() => cambiar(a.id, "documentos", { id: d.id, version: d.version, vence_el: null }), "Sin vencimiento")}>
              <Icono nombre="cal" tamano={16} />Quitar el vencimiento
            </DropdownMenuItem>
          ) : (
            [[30, "En 30 días"], [90, "En 3 meses"], [180, "En 6 meses"]].map(([n, t]) => (
              <DropdownMenuItem key={t} onSelect={() => void hacer(() => cambiar(a.id, "documentos", { id: d.id, version: d.version, vence_el: sumarDias(Number(n)), avisar_dias: 15 }), `Vence ${fechaCorta(sumarDias(Number(n))).toLowerCase()}`)}>
                <Icono nombre="cal" tamano={16} />{t}
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Lo entrega</DropdownMenuLabel>
          {opciones.map((o) => (
            <DropdownMenuItem key={o.valor} onSelect={() => {
              if (o.valor === quien) return;
              const c = o.valor.startsWith("p:") ? { entrega_persona_id: o.valor.slice(2), entrega_papel: null } : { entrega_persona_id: null, entrega_papel: o.valor };
              void hacer(() => cambiar(a.id, "documentos", { id: d.id, version: d.version, ...c }), `Lo entrega ${o.etiqueta}`);
            }}>
              <Icono nombre="users" tamano={16} />{o.etiqueta}{o.valor === quien ? <span className="ml-auto"><Icono nombre="ok" tamano={15} /></span> : null}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem peligro onSelect={() => void hacer(() => cambiar(a.id, "documentos", { id: d.id, version: d.version, quitar: true }), "Documento quitado")}>
            <Icono nombre="bote" tamano={16} />Quitar de la lista
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/** Documentos (boceto): la única lista de documentos del asunto, agrupada; pedir, subir y vencimientos. */
export function Documentos({ a, hacer }: { a: Asunto; hacer: Hacer }) {
  const { avisar } = useAvisos();
  const id = useId();
  const [mensaje, setMensaje] = useState<{ titulo: string; texto: string } | null>(null);
  const [nuevo, setNuevo] = useState<string | null>(null);
  const [entrega, setEntrega] = useState("cliente");
  const [ultima, setUltima] = useState<ResultadoSubida[] | null>(null);
  const faltan = a.documentos.filter((d) => d.estado === "falta");
  const grupos = [...new Set(a.documentos.map((d) => d.grupo || "Otros"))];
  const cliente = personaPara(a, "cliente");
  const variosRef = useRef<HTMLInputElement>(null);
  const listas = useGuias("que_pedir");

  const pedirTodos = () => setMensaje({
    titulo: `Pedir los ${faltan.length} que faltan`,
    texto: `Hola${cliente ? ` ${primerNombre(cliente.nombre)}` : ""}, para seguir con su trámite me faltan estos documentos:\n${faltan.map((d) => `• ${d.nombre}`).join("\n")}\n\nMe los puede mandar por aquí, en foto o PDF. Gracias.`,
  });
  const liga = async () => {
    try {
      const r = await agregar<{ url: string; expira_el: string }>(a.id, "ligas", {});
      setMensaje({
        titulo: "Liga para que suba sus documentos",
        texto: `Hola${cliente ? ` ${primerNombre(cliente.nombre)}` : ""}, para subir sus documentos entre a esta liga:\n${r.url}\n\nSolo elige el archivo o tome la foto. La liga vence el ${fechaCorta(r.expira_el.slice(0, 10)).toLowerCase()}.`,
      });
      void hacer(async () => undefined);
    } catch (e) { avisar(e instanceof Error ? e.message : "No se pudo crear la liga."); }
  };
  const varios = (f: File[]) => void hacer(async () => {
    const r = await subir(a.id, "varios", f);
    setUltima(r);
  }, f.length > 1 ? `${f.length} archivos acomodados` : "Archivo acomodado");

  return (
    <div className="as-form">
      <input ref={variosRef} type="file" hidden multiple accept="application/pdf,image/jpeg,image/png,image/webp" aria-label="Subir varios" onChange={(e) => {
        const f = [...(e.target.files ?? [])]; e.target.value = ""; if (f.length) varios(f);
      }} />
      <div className="as-fila">
        {faltan.length ? (
          <button type="button" className="as-btn as-pri" onClick={pedirTodos}><Icono nombre="chat" tamano={16} />Pedir los {faltan.length} que faltan</button>
        ) : a.documentos.length ? <span className="as-pill as-pill-ok"><Icono nombre="ok" tamano={12} />Completos</span> : null}
        <span className="as-sp" />
        <DropdownMenu>
          <DropdownMenuTrigger className="as-btn"><Icono nombre="mas" tamano={16} />Agregar<Icono nombre="down" tamano={14} /></DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-64">
            <DropdownMenuItem onSelect={() => variosRef.current?.click()}><Icono nombre="subir" tamano={16} />Subir varios</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void liga()}><Icono nombre="liga" tamano={16} />Liga para que el cliente suba</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setNuevo("")}><Icono nombre="file" tamano={16} />Documento por pedir…</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>De uso común</DropdownMenuLabel>
            {COMUNES.filter((n) => !a.documentos.some((d) => d.nombre === n)).slice(0, 8).map((n) => (
              <DropdownMenuItem key={n} onSelect={() => void hacer(() => agregar(a.id, "documentos", { nombre: n, entrega_papel: "cliente" }), `Por pedir: ${n}`)}>
                <Icono nombre="file" tamano={16} />{n}
              </DropdownMenuItem>
            ))}
            {listas?.length ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>De la Biblioteca</DropdownMenuLabel>
                {listas.map((g) => (
                  <DropdownMenuItem key={g.id} onSelect={() => void hacer(async () => { const r = await copiarGuia(g.id, a.id); if (!r.agregados) throw new Error("El asunto ya tenía todos esos documentos."); }, `De la Biblioteca: ${g.nombre}`)}>
                    <Icono nombre="lib" tamano={16} />{g.nombre}<span className="as-m as-num" style={{ marginLeft: "auto" }}>{cuantasTrae(g)}</span>
                  </DropdownMenuItem>
                ))}
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {a.ligas.length ? (
        <div className="as-ban" role="status">
          <Icono nombre="liga" tamano={16} />
          <span>El cliente tiene una liga para subir sus documentos hasta el {fechaCorta(a.ligas[0].expira_el.slice(0, 10)).toLowerCase()}{a.ligas[0].subidos ? ` · ya subió ${a.ligas[0].subidos}` : ""}.</span>
          <span className="as-sp" />
          <button type="button" className="as-btn" onClick={() => void hacer(() => cambiar(a.id, "ligas", { id: a.ligas[0].id, version: a.ligas[0].version, revocar: true }), "Liga cancelada")}>Cancelar liga</button>
        </div>
      ) : null}

      {ultima?.length ? (
        <div className="as-ban" role="status">
          <Icono nombre="ok" tamano={16} />
          <span>{ultima.map((u) => `${u.nombre} → ${u.documento}${u.nuevo ? " (nuevo)" : ""}`).join(" · ")}</span>
          <span className="as-sp" />
          <button type="button" className="as-btn as-gho as-ico" aria-label="Cerrar" onClick={() => setUltima(null)}><Icono nombre="x" tamano={15} /></button>
        </div>
      ) : null}

      {grupos.length ? grupos.map((g) => (
        <div key={g}>
          <p className="as-sub">{g}</p>
          <div className="as-card">
            {a.documentos.filter((d) => (d.grupo || "Otros") === g).map((d) => (
              <Renglon key={d.id} a={a} d={d} hacer={hacer} pedir={(texto) => setMensaje({ titulo: `Pedir ${d.nombre}`, texto })} />
            ))}
          </div>
        </div>
      )) : (
        <div className="as-vacio">
          <Icono nombre="file" tamano={26} />
          <b>Sin documentos</b>
          <span className="as-m">Agrega lo que hay que pedir o sube lo que ya te mandaron.</span>
          <BotonSubir etiqueta="Subir varios" clase="as-btn as-pri" alElegir={varios} />
        </div>
      )}

      <DialogoMensaje abierto={Boolean(mensaje)} titulo={mensaje?.titulo ?? ""} inicial={mensaje?.texto ?? ""} para={cliente} alCerrar={() => setMensaje(null)} />

      <Dialog open={nuevo !== null} onOpenChange={(o) => { if (!o) setNuevo(null); }}>
        <DialogContent className="max-w-md">
          <DialogTitle>Documento por pedir</DialogTitle>
          <DialogDescription className="sr-only">Nombre del documento y quién lo entrega</DialogDescription>
          <form className="as-form" onSubmit={(e) => {
            e.preventDefault();
            const n = (nuevo ?? "").trim();
            if (!n) return;
            setNuevo(null);
            const c = entrega.startsWith("p:") ? { entrega_persona_id: entrega.slice(2) } : { entrega_papel: entrega };
            void hacer(() => agregar(a.id, "documentos", { nombre: n, ...c }), `Por pedir: ${n}`);
          }}>
            <label className="pn-campo" htmlFor={`${id}-n`}>Nombre
              <input id={`${id}-n`} className="as-inp as-inp-borde" value={nuevo ?? ""} maxLength={200} onChange={(e) => setNuevo(e.target.value)} autoFocus />
            </label>
            <Desplegable etiqueta="Lo entrega" valor={entrega} alElegir={(v) => { if (v) setEntrega(v); }}
              opciones={[{ valor: "cliente", etiqueta: "El cliente" }, { valor: "fortius", etiqueta: "Fortius" },
                ...a.personas.filter((p) => !p.fallecida).map((p) => ({ valor: `p:${p.persona_id}`, etiqueta: p.nombre }))]} />
            <div className="as-fila as-fin">
              <button type="button" className="as-btn" onClick={() => setNuevo(null)}>Cancelar</button>
              <button type="submit" className="as-btn as-pri" aria-disabled={!(nuevo ?? "").trim()}>Agregar</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
