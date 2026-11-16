"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { DetalleArchivo, type DestinoElegido } from "@/components/panel/bandeja/detalle-archivo";
import { ZonaSubir, type ZonaSubirRef } from "@/components/panel/bandeja/zona-subir";
import { useColeccion } from "@/components/panel/datos/use-coleccion";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Boton } from "@/components/panel/kit/boton";
import { Vacio } from "@/components/panel/kit/estados";
import { Fila, GrupoLista } from "@/components/panel/kit/lista";
import { Segmentado } from "@/components/panel/kit/segmentado";
import { HojaAdaptable } from "@/components/panel/ui/hoja-adaptable";
import type { Property } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import { aTexto } from "@/lib/panel/calendario";
import { filasAsuntos, type Expediente } from "@/lib/panel/datos/asuntos";
import {
  cargaVigente, claseArchivo, cuentasBandeja, deshecho, falloGuardar, falloSubida, guardadoEn, guardando, hayPendientes,
  nombrePersona, nuevoArchivo, revisarArchivo, rutaAsunto, rutaInmueble, subido, textoEstado, textoGuardadoAsunto,
  textoGuardadoInmueble, tituloArchivo, vistaBandeja, type ArchivoBandeja, type Guardado,
} from "@/lib/panel/datos/bandeja";
import { guardarEnAsunto, quitarDelAsunto, subirATemporal } from "@/lib/panel/datos/bandeja-acciones";
import { leerExpedientes } from "@/lib/panel/datos/colecciones";
import { altDeArchivo } from "@/lib/panel/datos/inmueble-sitio";
import { uploadFile } from "@/lib/panel/legado/archivos";

import "./bandeja.css";

const mensaje = (e: unknown, otro: string) => (e instanceof Error && e.message ? e.message : otro);

/**
 * Bandeja (PN-06, primer corte): se suben varios archivos a la carga temporal privada y cada uno espera «Por confirmar»
 * hasta que el asesor elige a mano dónde va. La lectura automática no está activa. Todo con Deshacer.
 * La cola vive en esta página: lo que siga por confirmar se pierde si se cierra (se avisa antes de salir).
 */
export default function Bandeja() {
  const [archivos, setArchivos] = useState<ArchivoBandeja[]>([]);
  const actuales = useRef<ArchivoBandeja[]>([]);
  useEffect(() => { actuales.current = archivos; }, [archivos]);
  const bytes = useRef(new Map<string, File>());
  const [vistas, setVistas] = useState<Record<string, string>>({});
  const cola = useRef<Promise<void>>(Promise.resolve());
  const zona = useRef<ZonaSubirRef>(null);
  const { avisar } = useAvisos();
  const [problema, setProblema] = useState("");
  const [ver, setVer] = useState<"pendientes" | "guardados">("pendientes");
  const [abierto, setAbierto] = useState<string | null>(null);
  const [anterior, setAnterior] = useState<DestinoElegido | null>(null);

  const personas = useColeccion<Cliente>("clientes");
  const inmuebles = useColeccion<Property>("propiedades");
  const inmueblesRef = useRef<Property[]>([]);
  useEffect(() => { inmueblesRef.current = inmuebles.datos; }, [inmuebles.datos]);
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  // Al volver a esta pestaña (por ejemplo, después de abrir un asunto en otra) se leen de nuevo los asuntos, sin perder la Bandeja.
  const [lectura, setLectura] = useState(0);
  useEffect(() => {
    const alVolver = () => { if (document.visibilityState === "visible") setLectura((n) => n + 1); };
    document.addEventListener("visibilitychange", alVolver);
    return () => document.removeEventListener("visibilitychange", alVolver);
  }, []);
  useEffect(() => {
    const c = new AbortController();
    leerExpedientes<Expediente>(c.signal).then(setExpedientes, () => { if (!c.signal.aborted) setExpedientes((s) => s); });
    return () => c.abort();
  }, [lectura]);
  const [hoy] = useState(() => aTexto(new Date()));
  const asuntos = useMemo(() => filasAsuntos(expedientes, { personas: personas.datos, inmuebles: inmuebles.datos, tareas: [], hoy }), [expedientes, personas.datos, inmuebles.datos, hoy]);
  const datos = useMemo(() => ({ asuntos, inmuebles: inmuebles.datos, personas: personas.datos }), [asuntos, inmuebles.datos, personas.datos]);

  const cambiar = useCallback((id: string, f: (a: ArchivoBandeja) => ArchivoBandeja) => {
    setArchivos((lista) => lista.map((a) => (a.id === id ? f(a) : a)));
  }, []);

  /** Sube uno a la vez a la carga temporal, en el orden en que llegaron. */
  const subir = useCallback((id: string) => {
    cola.current = cola.current.then(async () => {
      const f = bytes.current.get(id);
      if (!f) return;
      try {
        const carga = await subirATemporal(f);
        cambiar(id, (a) => subido(a, carga));
      } catch (e) {
        cambiar(id, (a) => falloSubida(a, mensaje(e, "No se pudo subir. Vuelve a intentarlo.")));
      }
    });
  }, [cambiar]);

  const agregar = useCallback((lista: File[]) => {
    const fuera: string[] = [];
    const nuevos: ArchivoBandeja[] = [];
    const ahora = Date.now();
    lista.forEach((f, i) => {
      const motivo = revisarArchivo(f);
      if (motivo) { fuera.push(motivo); return; }
      const id = crypto.randomUUID();
      bytes.current.set(id, f);
      nuevos.push(nuevoArchivo(id, f, ahora + i));
    });
    setProblema(fuera.length ? `No se agregaron ${fuera.length}: ${fuera.join(" · ")}` : "");
    if (!nuevos.length) return;
    setVistas((v) => ({ ...v, ...Object.fromEntries(nuevos.map((n) => [n.id, URL.createObjectURL(bytes.current.get(n.id)!)])) }));
    setArchivos((a) => [...a, ...nuevos]);
    setVer("pendientes");
    nuevos.forEach((n) => subir(n.id));
  }, [subir]);

  const quitar = useCallback((id: string) => {
    bytes.current.delete(id);
    setVistas((v) => { if (v[id]) URL.revokeObjectURL(v[id]); const { [id]: _fuera, ...resto } = v; void _fuera; return resto; });
    setArchivos((a) => a.filter((x) => x.id !== id));
    setAbierto((ab) => (ab === id ? null : ab));
  }, []);

  const reintentar = useCallback((id: string) => {
    cambiar(id, (a) => ({ ...a, estado: "subiendo", error: "" }));
    subir(id);
  }, [cambiar, subir]);

  /** Deshacer: el archivo sale de su destino (asunto: a su papelera; inmueble: de sus fotos) y vuelve a Por confirmar. */
  const regresar = useCallback(async (id: string) => {
    const a = actuales.current.find((x) => x.id === id);
    const g = a?.guardado;
    if (!a || !g) return;
    try {
      if (g.clase === "asunto") await quitarDelAsunto(g.archivoId, g.titulo);
      else {
        const p = inmueblesRef.current.find((x) => x.slug === g.slug);
        if (p) await inmuebles.guardar(p.slug, { ...p, galeria: p.galeria.filter((f) => f.src !== g.src) });
      }
      cambiar(id, deshecho);
      avisar(`${a.nombre} volvió a Por confirmar`);
    } catch (e) {
      avisar(mensaje(e, "No se pudo deshacer."));
    }
  }, [avisar, cambiar, inmuebles]);

  const guardar = useCallback(async (id: string, d: DestinoElegido) => {
    const a = actuales.current.find((x) => x.id === id);
    const f = bytes.current.get(id);
    if (!a || !f || a.estado === "guardando" || a.estado === "subiendo") return;
    cambiar(id, guardando);
    try {
      let g: Guardado;
      if (d.clase === "inmueble") {
        const p = inmueblesRef.current.find((x) => x.slug === d.slug);
        if (!p) throw new Error("Ese inmueble ya no está en la lista. Recarga la página.");
        const r = await uploadFile(f, "public", { destino: "inmueble", inmueble: p.slug });
        const vigente = inmueblesRef.current.find((x) => x.slug === p.slug) ?? p;
        // DEC-54: en un inmueble publicado, la foto entra sin mostrarse; se muestra desde la ficha del inmueble.
        const foto = vigente.publicada ? { src: r.url, alt: altDeArchivo(f.name), oculta: true as const } : { src: r.url, alt: altDeArchivo(f.name) };
        await inmuebles.guardar(p.slug, { ...vigente, galeria: [...vigente.galeria, foto] });
        g = { clase: "inmueble", slug: p.slug, src: r.url, texto: textoGuardadoInmueble(p), href: rutaInmueble(p) };
      } else {
        const asunto = asuntos.find((x) => x.id === d.asuntoId);
        if (!asunto) throw new Error("Ese asunto ya no está en la lista. Recarga la página.");
        // El permiso de la carga temporal dura 10 minutos; si venció (o se deshizo un guardado), se vuelve a subir.
        const carga = cargaVigente(a.carga, Date.now()) ? a.carga : await subirATemporal(f);
        const persona = d.clase === "persona" ? personas.datos.find((c) => c.id === d.personaId) : undefined;
        const r = await guardarEnAsunto(asunto.id, carga, d.titulo ?? tituloArchivo(f.name));
        g = { clase: "asunto", expedienteId: asunto.id, archivoId: r.id, titulo: r.titulo, texto: textoGuardadoAsunto(asunto, persona ? nombrePersona(persona) : undefined), href: rutaAsunto(asunto.id) };
      }
      cambiar(id, (x) => guardadoEn(x, g));
      setAnterior(d.clase === "inmueble" ? d : { ...d, titulo: undefined });
      // Sigue con el siguiente que espera destino (AUD-06, 7); si no hay, se cierra la hoja.
      const siguiente = actuales.current.find((x) => x.id !== id && x.estado === "por-confirmar");
      setAbierto(siguiente ? siguiente.id : null);
      avisar(`${a.nombre}: ${g.texto.charAt(0).toLowerCase()}${g.texto.slice(1)}`, { etiqueta: "Deshacer", alAccionar: () => void regresar(id) });
    } catch (e) {
      cambiar(id, (x) => falloGuardar(x, mensaje(e, "No se guardó. Vuelve a intentarlo.")));
    }
  }, [asuntos, avisar, cambiar, inmuebles, personas.datos, regresar]);

  // Lo que sigue por confirmar se pierde al salir: se pregunta antes (protección de cambios sin guardar).
  useEffect(() => {
    if (!hayPendientes(archivos)) return;
    const antes = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", antes);
    return () => window.removeEventListener("beforeunload", antes);
  }, [archivos]);
  // Las vistas previas se liberan al salir de la página.
  const vistasRef = useRef(vistas);
  useEffect(() => { vistasRef.current = vistas; }, [vistas]);
  useEffect(() => () => { Object.values(vistasRef.current).forEach((u) => URL.revokeObjectURL(u)); }, []);

  const cuentas = cuentasBandeja(archivos);
  const visibles = vistaBandeja(archivos, ver);
  useEffect(() => {
    document.title = cuentas.porConfirmar ? `Bandeja (${cuentas.porConfirmar}) | Panel Fortius` : "Bandeja | Panel Fortius";
  }, [cuentas.porConfirmar]);

  // U sube; J y K pasan al archivo siguiente o anterior de la vista. No actúan mientras se escribe.
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.closest("[role=dialog]:not([data-lateral])"))) return;
      const k = e.key.toLowerCase();
      if (k === "u") { e.preventDefault(); zona.current?.elegir(); return; }
      if ((k === "j" || k === "k") && ver === "pendientes") {
        const lista = vistaBandeja(actuales.current, "pendientes");
        if (!lista.length) return;
        e.preventDefault();
        const i = lista.findIndex((x) => x.id === abierto);
        const sig = k === "j" ? (i + 1) % lista.length : (i <= 0 ? lista.length - 1 : i - 1);
        setAbierto(lista[sig].id);
      }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [abierto, ver]);

  const elegido = archivos.find((a) => a.id === abierto) ?? null;
  const resumen = cuentas.enProceso
    ? `${cuentas.porConfirmar} por confirmar · ${cuentas.enProceso} en proceso`
    : archivos.length ? `${cuentas.porConfirmar} por confirmar` : "";

  return (
    <div className="pn-pagina" style={{ maxWidth: 760 }}>
      <h1 className="pn-h1">Bandeja</h1>
      {resumen ? <p className="pn-sub" aria-live="polite">{resumen}</p> : null}
      <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
        <ZonaSubir ref={zona} alSoltar={agregar} compacta={archivos.length > 0} />
        {problema ? <p role="alert" style={{ margin: 0, color: "var(--warning)" }}>{problema}</p> : null}
        {cuentas.porConfirmar || cuentas.enProceso ? <p className="pn-sub" style={{ margin: 0 }}>Si cierras la página, lo que siga por confirmar se pierde.</p> : null}
        {archivos.length ? (
          <Segmentado etiqueta="Ver" valor={ver} alElegir={setVer} opciones={[
            { valor: "pendientes", etiqueta: "Por confirmar", cuenta: archivos.length - cuentas.guardados },
            { valor: "guardados", etiqueta: "Guardados", cuenta: cuentas.guardados },
          ]} />
        ) : null}
      </div>
      <div style={{ display: "grid", gap: 20, marginTop: 20 }}>
        {archivos.length === 0 ? null : visibles.length === 0 ? (
          ver === "pendientes"
            ? <Vacio titulo="Todo está guardado" texto="Cada archivo ya tiene su lugar. Cámbiate a Guardados para ver dónde quedó." icono="verificado" />
            : <Vacio titulo="Nada guardado todavía" texto="Elige a dónde va cada archivo y pulsa «Guardar ahí»." icono="descargar" />
        ) : (
          <GrupoLista>
            {visibles.map((a) => (
              ver === "guardados" && a.guardado ? (
                <Fila key={a.id} href={a.guardado.href} izquierda={<Miniatura archivo={a} url={vistas[a.id]} />} titulo={a.nombre} subtitulo={a.guardado.texto}
                  acciones={<Boton variante="texto" onClick={() => void regresar(a.id)} aria-label={`Regresar ${a.nombre} a Por confirmar`}>Regresar</Boton>} />
              ) : (
                <Fila key={a.id} alPulsar={() => setAbierto(a.id)} seleccionada={a.id === abierto} izquierda={<Miniatura archivo={a} url={vistas[a.id]} />}
                  titulo={a.nombre} subtitulo={textoEstado(a)} detalle={a.error && a.estado !== "error" ? a.error : undefined}
                  tonoDetalle={a.estado === "error" || a.error ? "error" : "normal"} />
              )
            ))}
          </GrupoLista>
        )}
        {ver === "guardados" && cuentas.guardados ? <p className="pn-sub" style={{ margin: 0 }}>Esta lista es de lo que guardaste desde que abriste la página; cada archivo ya está en su lugar.</p> : null}
      </div>
      <HojaAdaptable abierta={elegido !== null && elegido.estado !== "guardado"} titulo={elegido?.nombre ?? "Archivo"} descripcion="Elige a dónde va y guárdalo ahí." alCerrar={() => setAbierto(null)}>
        {elegido ? (
          <DetalleArchivo key={elegido.id} archivo={elegido} url={vistas[elegido.id] ?? null} datos={datos} anterior={anterior}
            alGuardar={(d) => void guardar(elegido.id, d)} alQuitar={() => quitar(elegido.id)} alReintentar={() => reintentar(elegido.id)} />
        ) : null}
      </HojaAdaptable>
    </div>
  );
}

function Miniatura({ archivo, url }: { archivo: ArchivoBandeja; url?: string }) {
  const clase = claseArchivo(archivo.tipo);
  return (
    <span className="bj-mini" aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element -- miniatura local (blob:) */}
      {url && clase === "foto" ? <img src={url} alt="" /> : clase === "pdf" ? "PDF" : clase === "video" ? "Video" : "Foto"}
    </span>
  );
}
