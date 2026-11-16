"use client";
import { useEffect, useRef, useState, type DragEvent } from "react";

import { Boton } from "@/components/panel/kit/boton";
import { Campo } from "@/components/panel/kit/campo";
import { ListaReordenable } from "@/components/panel/kit/reordenable";
import type { ImagenPropiedad, Property } from "@/data/propiedades";
import { leerRequisitosPublicacion } from "@/lib/panel/datos/colecciones";
import { altDeArchivo, estadoPublicacion, fotoPublica, textoDescripcion } from "@/lib/panel/datos/inmueble-sitio";
import { uploadFile } from "@/lib/panel/legado/archivos";

const TIPOS = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * Fotos del inmueble: soltar o elegir varias, ordenar arrastrando (la primera es la portada), describir y quitar.
 * Se suben como públicas al inmueble; el servidor les quita EXIF y GPS y decide si quien sube puede.
 */
export function FotosInmueble({ inmueble, ocupado, alAgregar, alOrdenar, alDescribir, alQuitar }: {
  inmueble: Property; ocupado: boolean;
  alAgregar: (fotos: ImagenPropiedad[]) => void;
  alOrdenar: (galeria: ImagenPropiedad[]) => void;
  alDescribir: (src: string, alt: string) => void;
  alQuitar: (src: string) => void;
}) {
  const entrada = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState<{ hechas: number; total: number } | null>(null);
  const [problema, setProblema] = useState("");
  const [encima, setEncima] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [alt, setAlt] = useState("");

  const subir = async (lista: FileList | File[]) => {
    const archivos = Array.from(lista);
    const validos = archivos.filter((f) => TIPOS.includes(f.type));
    setProblema(validos.length < archivos.length ? "Solo se suben fotos JPEG, PNG, WebP o GIF; las demás se dejaron fuera." : "");
    if (!validos.length) return;
    setSubiendo({ hechas: 0, total: validos.length });
    const listas: ImagenPropiedad[] = [];
    const fallas: string[] = [];
    for (const f of validos) {
      try {
        const r = await uploadFile(f, "public", { destino: "inmueble", inmueble: inmueble.slug });
        listas.push({ src: r.url, alt: altDeArchivo(f.name) });
      } catch (e) {
        fallas.push(`${f.name}: ${e instanceof Error ? e.message : "no se subió"}`);
      }
      setSubiendo((s) => (s ? { ...s, hechas: s.hechas + 1 } : s));
    }
    setSubiendo(null);
    if (fallas.length) setProblema(`No se subieron ${fallas.length}: ${fallas.join(" · ")}`);
    if (listas.length) alAgregar(listas);
  };
  const soltar = (e: DragEvent) => {
    e.preventDefault(); setEncima(false);
    if (e.dataTransfer.files.length) void subir(e.dataTransfer.files);
  };
  const fotos = inmueble.galeria;

  return (
    <section style={{ display: "grid", gap: 8, marginTop: 20 }}>
      <h3 className="pn-grupo" style={{ margin: 0, padding: 0 }}>Fotos</h3>
      <div
        onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) { e.preventDefault(); setEncima(true); } }}
        onDragLeave={() => setEncima(false)}
        onDrop={soltar}
        style={{ border: `1px dashed ${encima ? "var(--accent)" : "var(--border-strong)"}`, background: encima ? "var(--accent-soft)" : undefined, borderRadius: "var(--r-lg)", padding: 16, display: "grid", gap: 8, justifyItems: "start" }}
      >
        <p className="pn-sub" style={{ margin: 0 }}>
          {subiendo ? `Subiendo ${subiendo.hechas + 1 > subiendo.total ? subiendo.total : subiendo.hechas + 1} de ${subiendo.total}…` : "Suelta aquí las fotos o elígelas. La primera es la portada."}
        </p>
        <Boton variante="secundario" deshabilitado={ocupado || subiendo !== null} onClick={() => entrada.current?.click()}>Subir fotos</Boton>
        <input ref={entrada} type="file" accept={TIPOS.join(",")} multiple hidden onChange={(e) => { if (e.target.files?.length) void subir(e.target.files); e.target.value = ""; }} />
      </div>
      {problema ? <p role="alert" style={{ margin: 0, color: "var(--warning)" }}>{problema}</p> : null}
      {fotos.length ? (
        <ListaReordenable
          items={fotos}
          clave={(g) => g.src}
          nombre={(g) => g.alt || "Foto"}
          etiqueta="Fotos del inmueble"
          alReordenar={(nuevo) => alOrdenar(nuevo)}
          renderItem={(g, { asa, indice }) => (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
              {asa}
              {/* eslint-disable-next-line @next/next/no-img-element -- miniatura de una URL de Storage; next/image exigiría declarar cada dominio */}
              {fotoPublica(g.src) ? <img src={g.src} alt="" width={72} height={54} style={{ objectFit: "cover", borderRadius: "var(--r-sm)", flex: "none" }} /> : <span aria-hidden style={{ width: 72, height: 54, background: "var(--muted)", borderRadius: "var(--r-sm)", flex: "none" }} />}
              <div style={{ flex: 1, minWidth: 0, display: "grid", gap: 2 }}>
                {editando === g.src ? (
                  <form style={{ display: "flex", gap: 6, alignItems: "flex-end" }} onSubmit={(e) => { e.preventDefault(); alDescribir(g.src, alt); setEditando(null); }}>
                    <div style={{ flex: 1 }}><Campo etiqueta="Qué se ve" autoComplete="off" maxLength={160} value={alt} onChange={(e) => setAlt(e.target.value)} autoFocus /></div>
                    <Boton type="submit" variante="secundario" deshabilitado={ocupado}>Guardar</Boton>
                  </form>
                ) : (
                  <>
                    <span style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.alt || "Sin descripción"}</span>
                    <span className="pn-sub" style={{ margin: 0, color: fotoPublica(g.src) ? undefined : "var(--warning)" }}>
                      {!fotoPublica(g.src) ? "Privada: no sale en el sitio" : indice === 0 ? "Portada" : `Foto ${indice + 1}`}
                    </span>
                  </>
                )}
              </div>
              {editando === g.src ? null : (
                <>
                  <Boton variante="texto" deshabilitado={ocupado} onClick={() => { setEditando(g.src); setAlt(g.alt); }} aria-label={`Describir ${g.alt || `foto ${indice + 1}`}`}>Describir</Boton>
                  <Boton variante="texto" deshabilitado={ocupado} onClick={() => alQuitar(g.src)} aria-label={`Quitar ${g.alt || `foto ${indice + 1}`}`}>Quitar</Boton>
                </>
              )}
            </div>
          )}
        />
      ) : <p className="pn-sub" style={{ margin: 0 }}>Sin fotos todavía.</p>}
    </section>
  );
}

/** Lo que el sitio muestra con palabras: descripción en párrafos y la referencia de ubicación (nunca la dirección exacta). */
export function TextosSitio({ inmueble, ocupado, alGuardar }: {
  inmueble: Property; ocupado: boolean;
  alGuardar: (d: { descripcion: string; direccionAproximada: string }) => void;
}) {
  const [descripcion, setDescripcion] = useState(textoDescripcion(inmueble));
  const [direccion, setDireccion] = useState(inmueble.direccionAproximada);
  const cambio = descripcion.trim() !== textoDescripcion(inmueble).trim() || direccion.trim() !== inmueble.direccionAproximada;
  return (
    <section style={{ display: "grid", gap: 8, marginTop: 20 }}>
      <h3 className="pn-grupo" style={{ margin: 0, padding: 0 }}>Textos del sitio</h3>
      <div className="pn-campo">
        <label htmlFor={`desc-${inmueble.slug}`}>Descripción</label>
        <textarea id={`desc-${inmueble.slug}`} rows={6} maxLength={12000} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} aria-describedby={`desc-ayuda-${inmueble.slug}`} />
        <span id={`desc-ayuda-${inmueble.slug}`} className="pn-campo-ayuda">Deja una línea en blanco entre párrafos.</span>
      </div>
      <Campo etiqueta="Ubicación que ve el público" ayuda="La colonia o una referencia, nunca la dirección exacta." autoComplete="off" maxLength={160} value={direccion} onChange={(e) => setDireccion(e.target.value)} />
      {cambio ? <div><Boton variante="secundario" deshabilitado={ocupado} onClick={() => alGuardar({ descripcion, direccionAproximada: direccion })}>Guardar textos</Boton></div> : null}
    </section>
  );
}

/** Publicar es un paso propio. Los avisos no detienen («Publicar así»); lo que el servidor exige, sí, y se dice cómo resolverlo. */
export function PublicarInmueble({ inmueble, propietarioLigado, ocupado, alPublicar, alQuitar }: {
  inmueble: Property; propietarioLigado: boolean; ocupado: boolean;
  alPublicar: () => void; alQuitar: () => void;
}) {
  const e = estadoPublicacion(inmueble, propietarioLigado);
  const [confirmando, setConfirmando] = useState(false);
  // Lo que exige el servidor (captación vinculada con sus revisiones). Se vuelve a pedir cuando cambia el inmueble.
  const [servidor, setServidor] = useState<{ clave: string; faltantes: string[] | null; error: string }>({ clave: "", faltantes: null, error: "" });
  const clave = `${inmueble.slug}:${inmueble.estado}:${inmueble.publicada === true}`;
  useEffect(() => {
    if (inmueble.publicada === true) return;
    const c = new AbortController();
    leerRequisitosPublicacion(inmueble.slug, c.signal).then(
      (r) => setServidor({ clave, faltantes: r.faltantes, error: "" }),
      (err: unknown) => { if (!(err instanceof DOMException && err.name === "AbortError")) setServidor({ clave, faltantes: null, error: err instanceof Error ? err.message : "No se pudo revisar." }); },
    );
    return () => c.abort();
  }, [clave, inmueble.slug, inmueble.publicada]);
  const vigente = servidor.clave === clave;
  const bloqueos = [...e.bloqueos, ...(vigente && servidor.faltantes ? servidor.faltantes : [])];
  const revisando = !e.publicado && !vigente;
  return (
    <section style={{ display: "grid", gap: 8, marginTop: 20 }}>
      <h3 className="pn-grupo" style={{ margin: 0, padding: 0 }}>En el sitio</h3>
      {e.publicado ? (
        <>
          <p style={{ margin: 0 }}>Publicado{inmueble.publicadaEl ? ` desde el ${new Date(`${inmueble.publicadaEl.slice(0, 10)}T12:00:00`).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}` : ""}.</p>
          {confirmando ? (
            <div style={{ display: "grid", gap: 8, border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: 12, background: "var(--warning-soft)" }}>
              <p style={{ margin: 0 }}>Deja de verse en el sitio al momento. Para volver a publicarlo, el servidor pedirá la captación vinculada con sus revisiones.</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Boton variante="peligro" deshabilitado={ocupado} onClick={() => { setConfirmando(false); alQuitar(); }}>Quitar del sitio</Boton>
                <Boton variante="texto" onClick={() => setConfirmando(false)}>Dejarlo publicado</Boton>
              </div>
            </div>
          ) : <div><Boton variante="secundario" deshabilitado={ocupado} onClick={() => setConfirmando(true)}>Quitar del sitio</Boton></div>}
        </>
      ) : (
        <>
          <p className="pn-sub" style={{ margin: 0 }}>Sin publicar. Solo lo ve el equipo.</p>
          {revisando ? <p className="pn-sub" style={{ margin: 0 }}>Revisando si se puede publicar…</p>
          : vigente && servidor.error ? <p role="alert" style={{ margin: 0, color: "var(--warning)" }}>{servidor.error}</p>
          : bloqueos.length ? (
            <div style={{ display: "grid", gap: 4 }}>
              <p style={{ margin: 0, fontWeight: 500 }}>Para publicar falta:</p>
              <ul style={{ margin: 0, paddingLeft: 18, color: "var(--warning)" }}>{bloqueos.map((b) => <li key={b}>{b}</li>)}</ul>
            </div>
          ) : confirmando && e.avisos.length ? (
            <div style={{ display: "grid", gap: 8, border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: 12, background: "var(--warning-soft)" }}>
              <p style={{ margin: 0, fontWeight: 500 }}>Antes de publicar, revisa:</p>
              <ul style={{ margin: 0, paddingLeft: 18 }}>{e.avisos.map((a) => <li key={a}>{a}</li>)}</ul>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Boton deshabilitado={ocupado} onClick={() => { setConfirmando(false); alPublicar(); }}>Publicar así</Boton>
                <Boton variante="texto" onClick={() => setConfirmando(false)}>Todavía no</Boton>
              </div>
            </div>
          ) : (
            <div><Boton deshabilitado={ocupado} onClick={() => (e.avisos.length ? setConfirmando(true) : alPublicar())}>Publicar en el sitio</Boton></div>
          )}
        </>
      )}
    </section>
  );
}
