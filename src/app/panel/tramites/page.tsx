"use client";
import { Suspense, useEffect, useMemo, useState } from "react";

import { useLoLleva } from "@/components/panel/datos/lo-lleva";
import { useColeccion } from "@/components/panel/datos/use-coleccion";
import { useFichaEnDireccion } from "@/components/panel/datos/use-ficha-url";
import { Icono } from "@/components/panel/icons";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Boton } from "@/components/panel/kit/boton";
import { Campo } from "@/components/panel/kit/campo";
import { Desplegable } from "@/components/panel/kit/desplegable";
import { Cargando, EstadoError, Vacio } from "@/components/panel/kit/estados";
import { Fila, GrupoLista } from "@/components/panel/kit/lista";
import { DetalleTramite } from "@/components/panel/tramites/detalle";
import { HojaAdaptable } from "@/components/panel/ui/hoja-adaptable";
import type { Property } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import type { Archivo, Asesor } from "@/lib/domain/records";
import { aTexto } from "@/lib/panel/calendario";
import { leerMiAsesor } from "@/lib/panel/datos/colecciones";
import {
  alternarPendiente, anotarTramite, cerrarPaso, fecharPendiente, filaTramite, filtrarTramites, marcarPago, NOMBRE_GRUPO, ordenarTramites, ponerEnEspera, yaRespondieron,
  type GrupoTramite,
} from "@/lib/panel/datos/tramites";
import { archivoFromUpload, resolveFileUrl, uploadFile } from "@/lib/panel/legado/archivos";
import { ACREEDORES, nuevoTramite, pasosDe, type Acreedor, type Tramite } from "@/lib/tramites";

/**
 * Trámites (PN-07, boceto rehecho el 15/11/2026): una lista por lo que toca (Hoy toca preguntar, Esperando, En curso; los listos al final)
 * y el trámite como un solo checklist. Hoy existe la cancelación de hipoteca (TRA-01) con sus reglas en la base; las demás guías
 * (servicios, avalúos, regularización, Catastro) llegan cuando se confirmen sus pasos con la fuente oficial.
 */
function Tramites() {
  const tramites = useColeccion<Tramite>("tramites");
  const archivos = useColeccion<Archivo>("archivos");
  const personas = useColeccion<Cliente>("clientes");
  const inmuebles = useColeccion<Property>("propiedades");
  const asesores = useColeccion<Asesor>("asesores");
  const { avisar } = useAvisos();
  const [miAsesor, setMiAsesor] = useState<string | null>(null);
  useEffect(() => { const c = new AbortController(); leerMiAsesor(c.signal).then(setMiAsesor); return () => c.abort(); }, []);
  const [hoy] = useState(() => aTexto(new Date()));
  const [buscar, setBuscar] = useState("");
  const [verListos, setVerListos] = useState(false);
  const [creando, setCreando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const { abierta, abrir, cerrar } = useFichaEnDireccion();

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (e.key === "n" || e.key === "N") { e.preventDefault(); setCreando(true); }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, []);

  const filas = useMemo(() => ordenarTramites(tramites.datos.map((t) => filaTramite(t, personas.datos, hoy)), tramites.datos), [tramites.datos, personas.datos, hoy]);
  // «Lo lleva» (PN-10): el director puede quedarse con los trámites de un asesor o con los suyos.
  const asesorDe = useMemo(() => new Map(tramites.datos.map((x) => [x.id, x.asesorId])), [tramites.datos]);
  const loLleva = useLoLleva(useMemo(() => [...asesorDe.values()], [asesorDe]), miAsesor, asesores.datos);
  const visibles = useMemo(() => filtrarTramites(filas.filter((f) => loLleva.pasa(asesorDe.get(f.id))), buscar), [filas, buscar, loLleva, asesorDe]);
  const grupos = (["hoy", "esperando", "en_curso"] as GrupoTramite[]).map((g) => ({ g, filas: visibles.filter((f) => f.grupo === g) })).filter((x) => x.filas.length);
  const listos = visibles.filter((f) => f.grupo === "listo");
  const t = tramites.datos.find((x) => x.id === abierta) ?? null;
  const persona = t ? personas.datos.find((p) => p.id === t.clienteId) ?? null : null;
  const documentos = t ? archivos.datos.filter((a) => a.tramiteId === t.id) : [];
  const firma = (t && asesores.datos.find((a) => a.id === t.asesorId)?.nombre) || "Fortius Inmuebles";

  /** Guarda el trámite con su versión; con `previo`, el aviso ofrece Deshacer. */
  const guardar = async (siguiente: Tramite, aviso: string | null, previo?: Tramite): Promise<boolean> => {
    setOcupado(true);
    try {
      await tramites.guardar(siguiente.id, siguiente);
      if (aviso) avisar(aviso, previo ? { etiqueta: "Deshacer", alAccionar: () => {
        const vigente = tramites.datos.find((x) => x.id === previo.id);
        tramites.guardar(previo.id, { ...previo, notas: vigente?.notas ?? previo.notas }).then(() => avisar("Se deshizo"), (e: unknown) => avisar(e instanceof Error ? e.message : "No se pudo deshacer."));
      } } : undefined);
      return true;
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se guardó. Vuelve a intentarlo.");
      return false;
    } finally { setOcupado(false); }
  };

  const crear = async (d: { acreedor: Acreedor; titulo: string; clienteId: string; asesorId: string; propiedadSlug: string }) => {
    const nuevo = { ...nuevoTramite({ id: `tra-${crypto.randomUUID()}`, ...d }), creadoEl: new Date().toISOString() };
    if (await guardar(nuevo, `Trámite abierto: ${nuevo.titulo}`)) { setCreando(false); abrir(nuevo.id); }
  };

  return (
    <div className="pn-pagina" style={{ maxWidth: 760 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <h1 className="pn-h1">Trámites</h1>
        <Boton variante="secundario" onClick={() => setCreando(true)} aria-keyshortcuts="N">Nuevo trámite</Boton>
      </div>
      <p className="pn-sub">{tramites.cargando ? "Cargando…" : `${filas.filter((f) => f.grupo !== "listo").length} en curso`}</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end", marginTop: 20 }}>
        <div style={{ flex: "1 1 260px" }}>
          <Campo etiqueta="Buscar" placeholder="Inmueble, persona o acreedor" value={buscar} onChange={(e) => setBuscar(e.target.value)} type="search" autoComplete="off" />
        </div>
        {loLleva.control ? <div style={{ flex: "1 1 140px" }}>{loLleva.control}</div> : null}
      </div>
      <div style={{ display: "grid", gap: 20, marginTop: 20 }}>
        {tramites.cargando ? <Cargando lineas={4} etiqueta="Cargando trámites" /> : null}
        {tramites.error ? <EstadoError texto={tramites.error} alReintentar={tramites.reintentar} /> : null}
        {!tramites.cargando && !tramites.error && filas.length === 0 ? (
          <Vacio titulo="Sin trámites" texto="Cancelaciones de hipoteca y otros trámites que no son venta ni renta aparecen aquí." icono="verificado" accion={<Boton onClick={() => setCreando(true)}>Nuevo trámite</Boton>} />
        ) : null}
        {!tramites.cargando && filas.length > 0 && visibles.length === 0 ? <Vacio titulo="Nada coincide" texto={loLleva.activo ? "Prueba con otra palabra o elige a otra persona en «Lo lleva»." : "Prueba con otra palabra."} icono="buscar" /> : null}
        {grupos.map(({ g, filas: fs }) => (
          <GrupoLista key={g} titulo={`${NOMBRE_GRUPO[g]} · ${fs.length}`}>
            {fs.map((f) => (
              <Fila key={f.id}
                izquierda={<span className="pn-av" aria-hidden style={{ borderRadius: "var(--r-md)" }}><Icono nombre="verificado" tamano={18} /></span>}
                titulo={f.titulo} subtitulo={f.linea} detalle={f.estado} tonoDetalle={g === "hoy" ? "aviso" : "normal"}
                alPulsar={() => abrir(f.id)} seleccionada={f.id === abierta} />
            ))}
          </GrupoLista>
        ))}
        {listos.length ? (
          verListos ? (
            <GrupoLista titulo={`${NOMBRE_GRUPO.listo} · ${listos.length}`}>
              {listos.map((f) => <Fila key={f.id} titulo={f.titulo} subtitulo={f.linea} detalle={f.estado} alPulsar={() => abrir(f.id)} />)}
            </GrupoLista>
          ) : <div><Boton variante="texto" onClick={() => setVerListos(true)}>Ver {listos.length === 1 ? "1 terminado" : `${listos.length} terminados`}</Boton></div>
        ) : null}
      </div>

      <HojaAdaptable abierta={t !== null} titulo={t?.titulo ?? "Trámite"} descripcion={t ? `Cancelación de hipoteca · ${ACREEDORES[t.acreedor]}${persona ? ` · ${persona.nombre}` : ""}` : undefined} alCerrar={() => cerrar()}>
        {t ? (
          <DetalleTramite key={t.id} t={t} persona={persona} documentos={documentos} ocupado={ocupado} firma={firma}
            alPendiente={(id) => void guardar(alternarPendiente(t, id), null)}
            alFechaPendiente={(id, f) => void guardar(fecharPendiente(t, id, f), null)}
            alCerrarPaso={() => {
              const s = cerrarPaso(t, documentos);
              if (s) void guardar(s, `Paso cerrado: ${pasosDe(t.acreedor)[t.pasoActual].nombre}`, t);
            }}
            alEsperar={(quien, volver) => guardar(ponerEnEspera(t, quien, volver, hoy), `En espera de ${quien.trim()}`, t)}
            alResponder={(r) => guardar(yaRespondieron(t, r), "Respuesta anotada", t)}
            alAnotar={(texto) => guardar(anotarTramite(t, texto), "Nota guardada")}
            alPagar={(id) => void guardar(marcarPago(t, id), null)}
            alSubir={async (lista, pasoClave) => {
              try {
                for (const [i, f] of lista.entries()) {
                  const up = await uploadFile(f, "private");
                  const a: Archivo = { ...archivoFromUpload(crypto.randomUUID(), up), clienteId: t.clienteId, tramiteId: t.id, pasoClave: i === 0 ? pasoClave : "" };
                  await archivos.guardar(a.id, a);
                }
                avisar(lista.length === 1 ? "Documento subido" : `${lista.length} documentos subidos`);
              } catch (e) { avisar(e instanceof Error ? e.message : "No se subió. Vuelve a intentarlo."); }
            }}
            alAbrirDocumento={(d) => {
              resolveFileUrl(d.url).then((u) => window.open(u, "_blank", "noopener,noreferrer"), () => avisar("No se pudo abrir el documento."));
            }}
          />
        ) : null}
      </HojaAdaptable>

      <HojaAdaptable abierta={creando} titulo="Nuevo trámite" descripcion="Cancelación de hipoteca. Las demás guías llegan cuando se confirmen sus pasos." alCerrar={() => setCreando(false)}>
        {creando ? <FormularioTramite personas={personas.datos} inmuebles={inmuebles.datos} asesores={asesores.datos} miAsesor={miAsesor} ocupado={ocupado} alGuardar={(d) => void crear(d)} /> : null}
      </HojaAdaptable>
    </div>
  );
}

const ACREEDOR_OPCIONES = (Object.keys(ACREEDORES) as Acreedor[]).map((a) => ({ valor: a, etiqueta: ACREEDORES[a] }));

function FormularioTramite({ personas, inmuebles, asesores, miAsesor, ocupado, alGuardar }: {
  personas: readonly Cliente[]; inmuebles: readonly Property[]; asesores: readonly Asesor[]; miAsesor: string | null; ocupado: boolean;
  alGuardar: (d: { acreedor: Acreedor; titulo: string; clienteId: string; asesorId: string; propiedadSlug: string }) => void;
}) {
  const [d, setD] = useState({ acreedor: "infonavit" as Acreedor, titulo: "", clienteId: "", asesorId: miAsesor ?? "", propiedadSlug: "" });
  const [intento, setIntento] = useState(false);
  const inmueble = inmuebles.find((p) => p.slug === d.propiedadSlug);
  const titulo = d.titulo.trim() || inmueble?.titulo || "";
  const falta = !d.clienteId ? "Elige al propietario." : !titulo ? "Escribe un nombre o elige el inmueble." : !d.asesorId ? "Elige quién lo lleva." : null;
  const ordenadas = [...personas].sort((a, b) => (a.nombre ?? "").localeCompare(b.nombre ?? "", "es"));
  return (
    <form noValidate style={{ display: "grid", gap: 12, marginTop: 8 }} onSubmit={(e) => { e.preventDefault(); setIntento(true); if (!falta) alGuardar({ ...d, titulo }); }}>
      <Desplegable etiqueta="Acreedor" valor={d.acreedor} opciones={ACREEDOR_OPCIONES} alElegir={(acreedor) => { if (acreedor) setD({ ...d, acreedor }); }}
        ayuda={d.acreedor === "banco" ? "Con banco pasa por notario." : "Va directo al Registro Público, sin notario."} />
      <Desplegable etiqueta="Propietario" valor={d.clienteId} vacio="Elige…" opciones={ordenadas.map((c) => ({ valor: c.id, etiqueta: c.nombre }))}
        alElegir={(clienteId) => setD({ ...d, clienteId, propiedadSlug: d.propiedadSlug || (personas.find((c) => c.id === clienteId)?.propiedadSlug ?? "") })} />
      <Desplegable etiqueta="Inmueble (opcional)" valor={d.propiedadSlug} vacio="Sin inmueble" opciones={inmuebles.map((p) => ({ valor: p.slug, etiqueta: `${p.titulo} · ${p.codigo}` }))} alElegir={(propiedadSlug) => setD({ ...d, propiedadSlug })} />
      <Campo etiqueta="Nombre del trámite" placeholder={inmueble?.titulo ?? "Por ejemplo: Casa en Playas"} maxLength={160} value={d.titulo} onChange={(e) => setD({ ...d, titulo: e.target.value })} autoComplete="off" />
      {miAsesor ? null : <Desplegable etiqueta="Lo lleva" valor={d.asesorId} vacio="Elige…" opciones={asesores.map((a) => ({ valor: a.id, etiqueta: a.nombre }))} alElegir={(asesorId) => setD({ ...d, asesorId })} />}
      {intento && falta ? <p role="alert" style={{ margin: 0, color: "var(--error)" }}>{falta}</p> : null}
      <Boton type="submit" bloque deshabilitado={ocupado}>Abrir trámite</Boton>
    </form>
  );
}

export default function PaginaTramites() {
  return <Suspense fallback={<div className="pn-pagina"><Cargando lineas={4} etiqueta="Cargando" /></div>}><Tramites /></Suspense>;
}
