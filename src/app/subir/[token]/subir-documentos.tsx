"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type Liga = { faltan: { id: string; nombre: string }[]; expira_el: string; quedan: number };
type Estado = { cargando: true } | { cargando: false; liga: Liga | null; error: string | null };

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const fechaLarga = (iso: string) => { const d = new Date(iso); return `${d.getDate()} de ${MESES[d.getMonth()]}`; };
const TIPOS = "application/pdf,image/jpeg,image/png,image/webp";

/** Lo que ve el cliente: la lista de lo que falta, por nombre, y un botón para subir cada cosa (en el teléfono, también con la cámara). */
export function SubirDocumentos({ token }: { token: string }) {
  const [estado, setEstado] = useState<Estado>({ cargando: true });
  const [subiendo, setSubiendo] = useState<string | null>(null);
  const [listos, setListos] = useState<string[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);
  const campo = useRef<HTMLInputElement>(null);
  const destino = useRef<string | null>(null);
  const ruta = `/api/subir/${encodeURIComponent(token)}`;

  const leer = useCallback(async () => {
    try {
      const r = await fetch(ruta, { cache: "no-store" });
      const d = (await r.json().catch(() => ({}))) as Liga & { error?: string };
      setEstado({ cargando: false, liga: r.ok ? d : null, error: r.ok ? null : d.error ?? "Esta liga ya no está disponible. Pídele una nueva a tu asesor." });
    } catch { setEstado({ cargando: false, liga: null, error: "Sin conexión. Vuelve a abrir la liga en un momento." }); }
  }, [ruta]);

  useEffect(() => { void leer(); }, [leer]);

  async function enviar(archivos: File[]) {
    const doc = destino.current;
    for (const f of archivos) {
      setSubiendo(doc ?? "otro"); setAviso(null);
      const form = new FormData();
      form.set("archivo", f);
      if (doc) form.set("documento", doc);
      try {
        const r = await fetch(ruta, { method: "POST", body: form });
        const d = (await r.json().catch(() => ({}))) as { documento?: string; error?: string };
        if (!r.ok) { setAviso(d.error ?? "No se pudo subir. Vuelve a intentarlo."); break; }
        setListos((x) => [...x, d.documento ?? f.name]);
      } catch { setAviso("Sin conexión. Vuelve a intentarlo."); break; }
    }
    setSubiendo(null);
    await leer();
  }

  const elegir = (doc: string | null) => { destino.current = doc; campo.current?.click(); };

  if (estado.cargando) return <p className="subir-m" aria-busy="true">Cargando…</p>;
  if (!estado.liga) {
    return (
      <section className="subir-caja">
        <h1>Fortius Inmuebles</h1>
        <p>{estado.error}</p>
      </section>
    );
  }
  const { faltan, expira_el, quedan } = estado.liga;
  return (
    <section className="subir-caja">
      <h1>Sube tus documentos</h1>
      <p className="subir-m">Fortius Inmuebles · esta liga sirve hasta el {fechaLarga(expira_el)}.</p>
      <input ref={campo} type="file" hidden multiple accept={TIPOS} aria-label="Elegir archivos"
        onChange={(e) => { const f = [...(e.target.files ?? [])]; e.target.value = ""; if (f.length) void enviar(f); }} />

      {faltan.length ? (
        <ul className="subir-lista">
          {faltan.map((d) => (
            <li key={d.id}>
              <span>{d.nombre}</span>
              <button type="button" className="subir-btn" disabled={Boolean(subiendo) || !quedan} onClick={() => elegir(d.id)}>
                {subiendo === d.id ? "Subiendo…" : "Subir"}
              </button>
            </li>
          ))}
        </ul>
      ) : <p className="subir-ok">Ya no falta nada de la lista. Gracias.</p>}

      <button type="button" className="subir-btn subir-otro" disabled={Boolean(subiendo) || !quedan} onClick={() => elegir(null)}>
        {subiendo === "otro" ? "Subiendo…" : "Subir otro documento"}
      </button>

      {aviso ? <p className="subir-error" role="alert">{aviso}</p> : null}
      {listos.length ? (
        <div className="subir-listos" role="status">
          <p>Recibimos:</p>
          <ul>{listos.map((n, i) => <li key={`${n}-${i}`}>{n}</li>)}</ul>
        </div>
      ) : null}
      <p className="subir-m subir-pie">PDF o fotos, hasta 20 MB cada uno. Las fotos se guardan sin la ubicación ni los datos del teléfono.</p>
    </section>
  );
}
