"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import "./personas.css";
import { Icono } from "@/components/panel/icons";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Boton } from "@/components/panel/kit/boton";
import { Segmentado } from "@/components/panel/kit/segmentado";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/panel/ui/dialog";
import type { Cliente } from "@/lib/backend/contracts";
import { asuntosDe, type Expediente } from "@/lib/panel/datos/asuntos";
import { guardarEnAsunto, quitarDelAsunto, subirATemporal } from "@/lib/panel/datos/bandeja-acciones";
import { MAX_BYTES_BANDEJA, TIPOS_ASUNTO } from "@/lib/panel/datos/bandeja";
import { leerExpedientes } from "@/lib/panel/datos/colecciones";
import { leerArchivosDelCliente, rutaArchivoDelCliente, type ArchivoDelCliente } from "@/lib/panel/datos/formatos-adjuntos";

/**
 * Documentos de la persona (boceto de Personas): identificación oficial y comprobante de domicilio con su estado,
 * visor y «Subir». No hay un repositorio aparte: se reutiliza el de los asuntos (privado, con RLS, papelera y descarga
 * firmada por el servidor). Cada documento se guarda en uno de sus asuntos y se ve aquí desde todos.
 */

type Doc = ArchivoDelCliente & { asunto: string; expedienteId: string };
type Requerido = { clave: string; nombre: string; coincide: RegExp };
const REQUERIDOS: readonly Requerido[] = [
  { clave: "identificacion", nombre: "Identificación oficial", coincide: /identificaci|\bine\b|pasaporte|credencial/i },
  { clave: "domicilio", nombre: "Comprobante de domicilio", coincide: /comprobante|domicilio/i },
];
const ACEPTA = TIPOS_ASUNTO.join(",");
const fecha = (iso: string) => new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });

export function DocumentosPersona({ persona, aviso, alAviso, ancha }: {
  persona: Cliente;
  /** Estado del aviso de privacidad («Firmado», «Enviado» o «Falta») y qué hace al tocarlo. */
  aviso: "Firmado" | "Enviado" | "Falta"; alAviso: () => void; ancha: boolean;
}) {
  const { avisar } = useAvisos();
  const [asuntos, setAsuntos] = useState<{ id: string; texto: string }[] | null>(null);
  const [docs, setDocs] = useState<Doc[] | null>(null);
  const [error, setError] = useState(false);
  const [destino, setDestino] = useState<string>("");
  const [subiendo, setSubiendo] = useState<string | null>(null);
  const [visor, setVisor] = useState<number | null>(null);
  const [encima, setEncima] = useState(false);
  const entrada = useRef<HTMLInputElement>(null);
  const tituloPendiente = useRef<string | null>(null);
  const [vuelta, setVuelta] = useState(0);

  useEffect(() => {
    const c = new AbortController();
    (async () => {
      try {
        const exp = await leerExpedientes<Expediente>(c.signal);
        const suyos = asuntosDe(exp, { clienteId: persona.id });
        setAsuntos(suyos);
        setDestino((d) => (suyos.some((a) => a.id === d) ? d : suyos[0]?.id ?? ""));
        const listas = await Promise.all(suyos.map(async (a) => (await leerArchivosDelCliente(a.id, c.signal)).map((x) => ({ ...x, asunto: a.texto, expedienteId: a.id }))));
        setDocs(listas.flat().sort((a, b) => b.created_at.localeCompare(a.created_at)));
        setError(false);
      } catch {
        if (!c.signal.aborted) { setError(true); setDocs([]); setAsuntos((x) => x ?? []); }
      }
    })();
    return () => c.abort();
  }, [persona.id, vuelta]);

  const deRequerido = useMemo(() => REQUERIDOS.map((r) => ({ r, doc: docs?.find((d) => r.coincide.test(d.titulo)) })), [docs]);
  const otros = useMemo(() => (docs ?? []).filter((d) => !REQUERIDOS.some((r) => r.coincide.test(d.titulo))), [docs]);
  const enVisor = useMemo(() => [...deRequerido.flatMap((x) => (x.doc ? [x.doc] : [])), ...otros], [deRequerido, otros]);

  const subir = async (f: File, titulo: string) => {
    if (!destino) { avisar("Para guardar sus documentos, ábrele un asunto primero."); return; }
    if (!(TIPOS_ASUNTO as readonly string[]).includes(f.type)) { avisar("Ese tipo de archivo no se guarda: usa PDF, JPG, PNG o WEBP."); return; }
    if (f.size > MAX_BYTES_BANDEJA) { avisar("El archivo pesa más de 20 MB."); return; }
    setSubiendo(titulo);
    try {
      const carga = await subirATemporal(f);
      const guardado = await guardarEnAsunto(destino, carga, titulo);
      const asunto = asuntos?.find((a) => a.id === destino)?.texto ?? "su asunto";
      setVuelta((x) => x + 1);
      avisar(`${titulo}: guardado en ${asunto}`, { etiqueta: "Deshacer", alAccionar: () => {
        quitarDelAsunto(guardado.id, guardado.titulo).then(() => { setVuelta((x) => x + 1); avisar("Se quitó. Queda en la papelera del asunto."); },
          (e: unknown) => avisar(e instanceof Error ? e.message : "No se pudo deshacer."));
      } });
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se pudo guardar el documento. Vuelve a intentarlo.");
    } finally { setSubiendo(null); }
  };

  const elegir = (titulo: string | null) => { tituloPendiente.current = titulo; entrada.current?.click(); };
  const alElegirArchivo = (lista: FileList | null) => {
    const f = lista?.[0];
    if (!f) return;
    const titulo = tituloPendiente.current ?? (f.name.replace(/\.[^.]+$/, "").trim().slice(0, 240) || "Documento");
    tituloPendiente.current = null;
    void subir(f, titulo);
  };

  const sinAsunto = asuntos !== null && asuntos.length === 0;
  const cargando = docs === null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <input ref={entrada} type="file" accept={ACEPTA} hidden onChange={(e) => { alElegirArchivo(e.target.files); e.target.value = ""; }} />
      <div className="fx-tarjeta">
        {deRequerido.slice(0, 1).map(({ r, doc }) => <FilaDoc key={r.clave} nombre={r.nombre} doc={doc} cargando={cargando} subiendo={subiendo === r.nombre}
          sinAsunto={sinAsunto} alVer={() => setVisor(enVisor.indexOf(doc!))} alSubir={() => elegir(r.nombre)} />)}
        <button type="button" className="fx-opt" onClick={alAviso}>
          <span>Aviso de privacidad</span>
          <span className="pn-per-estado" data-falta={aviso === "Falta" || undefined}>{aviso}</span>
        </button>
        {deRequerido.slice(1).map(({ r, doc }) => <FilaDoc key={r.clave} nombre={r.nombre} doc={doc} cargando={cargando} subiendo={subiendo === r.nombre}
          sinAsunto={sinAsunto} alVer={() => setVisor(enVisor.indexOf(doc!))} alSubir={() => elegir(r.nombre)} />)}
      </div>
      {aviso === "Falta" ? <p className="fx-consejo" style={{ fontSize: 14, margin: 0 }}>Aún no tiene aviso de privacidad: dáselo antes de usar sus documentos para contratos.</p> : null}
      {error ? <p className="fx-consejo" style={{ fontSize: 14, margin: 0 }}>No se pudieron leer sus documentos. <button type="button" className="fx-enlace" onClick={() => setVuelta((x) => x + 1)}>Reintentar</button></p> : null}

      {otros.length ? (
        <section className="fx-seccion">
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Otros documentos <span className="fx-tenue">· {otros.length}</span></h3>
          <div className="fx-tarjeta">
            {otros.map((d) => (
              <button key={d.id} type="button" className="fx-opt" onClick={() => setVisor(enVisor.indexOf(d))}>
                <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                  <span style={{ overflowWrap: "anywhere" }}>{d.titulo}</span>
                  <span className="fx-h">{d.asunto} · {fecha(d.created_at)}</span>
                </span>
                <span className="fx-h">Ver</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {sinAsunto ? (
        <div className="fx-tarjeta fx-vacio">
          <b>Sin asunto para guardar documentos</b>
          <span>Sus documentos se guardan en un asunto suyo (una venta, una renta, una búsqueda). Ábrele uno y vuelve aquí.</span>
          <div style={{ marginTop: 4 }}><Link className="pn-btn pn-btn-secundario" href="/panel/asuntos">Ir a Asuntos</Link></div>
        </div>
      ) : asuntos && asuntos.length > 1 ? (
        <Segmentado etiqueta="Se guardan en" valor={destino} alElegir={setDestino} opciones={asuntos.map((a) => ({ valor: a.id, etiqueta: a.texto }))} />
      ) : null}

      {!sinAsunto ? (
        ancha ? (
          <div className="fx-zona pn-per-zona" data-encima={encima || undefined}
            onDragOver={(e) => { e.preventDefault(); setEncima(true); }} onDragLeave={() => setEncima(false)}
            onDrop={(e) => { e.preventDefault(); setEncima(false); tituloPendiente.current = null; alElegirArchivo(e.dataTransfer.files); }}>
            <Icono nombre="descargar" tamano={18} />
            {subiendo ? `Guardando ${subiendo}…` : <>Arrastra aquí un archivo o <button type="button" className="fx-enlace" onClick={() => elegir(null)} disabled={!destino}>elígelo</button></>}
          </div>
        ) : (
          <Boton variante="secundario" deshabilitado={!destino || Boolean(subiendo)} onClick={() => elegir(null)}><Icono nombre="descargar" tamano={18} />{subiendo ? "Guardando…" : "Subir o tomar foto"}</Boton>
        )
      ) : null}
      <p className="fx-chico">Los documentos son privados: no se publican ni salen del panel.</p>

      <Visor documentos={enVisor} indice={visor} alCambiar={setVisor} />
    </div>
  );
}

function FilaDoc({ nombre, doc, cargando, subiendo, sinAsunto, alVer, alSubir }: {
  nombre: string; doc?: Doc; cargando: boolean; subiendo: boolean; sinAsunto: boolean; alVer: () => void; alSubir: () => void;
}) {
  if (doc) {
    return (
      <button type="button" className="fx-opt" onClick={alVer}>
        <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
          <span>{nombre}</span>
          <span className="fx-h">{doc.asunto} · {fecha(doc.created_at)}</span>
        </span>
        <span className="pn-per-estado">Recibido</span>
      </button>
    );
  }
  return (
    <div className="fx-opt" style={{ cursor: "default" }}>
      <span>{nombre}</span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        <span className="pn-per-estado" data-falta={!cargando || undefined}>{cargando ? "Revisando…" : subiendo ? "Guardando…" : "Falta"}</span>
        {!cargando && !sinAsunto ? <Boton variante="texto" deshabilitado={subiendo} onClick={alSubir}>Subir</Boton> : null}
      </span>
    </div>
  );
}

/** Visor del boceto: el documento grande, con anterior y siguiente. El servidor lo entrega privado y sin caché. */
function Visor({ documentos, indice, alCambiar }: { documentos: Doc[]; indice: number | null; alCambiar: (i: number | null) => void }) {
  const d = indice !== null && indice >= 0 ? documentos[indice] : undefined;
  const n = documentos.length;
  const src = d ? rutaArchivoDelCliente(d.id) : "";
  return (
    <Dialog open={Boolean(d)} onOpenChange={(o) => { if (!o) alCambiar(null); }}>
      <DialogContent className="pn-per-visor" onKeyDown={(e) => {
        if (indice === null || n < 2) return;
        if (e.key === "ArrowRight") { e.preventDefault(); alCambiar((indice + 1) % n); }
        if (e.key === "ArrowLeft") { e.preventDefault(); alCambiar((indice + n - 1) % n); }
      }}>
        <DialogTitle>{d?.titulo ?? "Documento"}</DialogTitle>
        <DialogDescription>{[d?.asunto, d ? fecha(d.created_at) : "", indice !== null && n > 1 ? `${indice + 1} de ${n}` : ""].filter(Boolean).join(" · ")}</DialogDescription>
        <div className="pn-per-visor-hoja">
          {/* eslint-disable-next-line @next/next/no-img-element -- documento privado servido por el panel, sin optimizar */}
          {d?.mime.startsWith("image/") ? <img src={src} alt={d.titulo} />
            : d?.mime === "application/pdf" ? <iframe src={src} title={d.titulo} />
            : d ? <a className="pn-btn pn-btn-secundario" href={src} target="_blank" rel="noopener noreferrer">Abrir en otra pestaña</a> : null}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          {n > 1 && indice !== null ? <Boton variante="secundario" onClick={() => alCambiar((indice + n - 1) % n)}>Anterior</Boton> : <span />}
          {d ? <a className="pn-btn pn-btn-secundario" href={src} target="_blank" rel="noopener noreferrer">Abrir en otra pestaña</a> : null}
          {n > 1 && indice !== null ? <Boton variante="secundario" onClick={() => alCambiar((indice + 1) % n)}>Siguiente</Boton> : <span />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
