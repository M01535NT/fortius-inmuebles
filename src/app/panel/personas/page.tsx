"use client";
import { Suspense, useEffect, useMemo, useState } from "react";

import { useLoLleva } from "@/components/panel/datos/lo-lleva";
import { useColeccion } from "@/components/panel/datos/use-coleccion";
import { useFichaEnDireccion } from "@/components/panel/datos/use-ficha-url";
import { BotonFiltros, Buscador, ResumenFiltros, Rol, type GrupoFiltro } from "@/components/panel/fichas/piezas";
import { iniciales } from "@/lib/panel/asuntos/api";
import "@/components/panel/asunto/asunto.css";
import "@/components/panel/asunto/caso.css";
import "@/components/panel/fichas/modelo.css";
import "./personas.css";
import { Gesto, Icono } from "@/components/panel/icons";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Boton } from "@/components/panel/kit/boton";
import { Cargando, EstadoError, Vacio } from "@/components/panel/kit/estados";
import { Segmentado } from "@/components/panel/kit/segmentado";
import { DetallePersona } from "@/components/panel/personas/detalle-persona";
import { FormularioPersona } from "@/components/panel/personas/formularios";
import { HojaAdaptable } from "@/components/panel/ui/hoja-adaptable";
import type { Property } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import type { Asesor } from "@/lib/domain/records";
import { leerMiAsesor } from "@/lib/panel/datos/colecciones";
import { enlaceWhatsApp } from "@/lib/panel/datos/consultas";
import { nuevaPersona, type DatosNuevaPersona } from "@/lib/panel/datos/personas-acciones";
import { canalDeFila, coincideBusqueda, diasSinContacto, esDueno, lineaDeLista, perfilDe, rangoSiguiente, ROL_DE_TIPO, sinSeguimiento, estaArchivada } from "@/lib/panel/datos/personas-ficha";

type Ver = "todas" | "propietario" | "sin_contacto";
type Quien = "todas" | "vende" | "compra" | "renta" | "aliado";
type Orden = "sigue" | "nombre" | "sin_contacto";

const QUIEN: { valor: Quien; etiqueta: string; pasa: (t: Cliente["tipo"]) => boolean }[] = [
  { valor: "todas", etiqueta: "Todos los roles", pasa: () => true },
  { valor: "vende", etiqueta: "Propietarios", pasa: esDueno },
  { valor: "compra", etiqueta: "Compran", pasa: (t) => t === "comprador" || t === "inversionista" },
  { valor: "renta", etiqueta: "Rentan", pasa: (t) => t === "arrendatario" },
  { valor: "aliado", etiqueta: "Aliados", pasa: (t) => t === "otro" },
];
const ORDENES: { valor: Orden; etiqueta: string }[] = [
  { valor: "sigue", etiqueta: "Por siguiente paso" },
  { valor: "nombre", etiqueta: "Por nombre" },
  { valor: "sin_contacto", etiqueta: "Más tiempo sin contacto" },
];
const ICONO_CANAL = { llamada: "llamada", whatsapp: "mensaje", correo: "expediente" } as const;
const VERBO_CANAL = { llamada: "Llamar", whatsapp: "WhatsApp", correo: "Correo" } as const;

/**
 * Personas como el boceto (16/11/2026): lista con buscador (nombre, teléfono o inmueble), «Filtrar y ordenar»,
 * Todas · Propietarios · Sin contacto (sin seguimiento) y aviso de los que llevan más de 14 días sin seguimiento;
 * la ficha a la derecha en escritorio y a pantalla completa en el teléfono.
 */
function Personas() {
  const { cargando, error, datos, reintentar, guardar, versionDe } = useColeccion<Cliente>("clientes");
  const { avisar } = useAvisos();
  const [miAsesor, setMiAsesor] = useState<string | null>(null);
  useEffect(() => { const c = new AbortController(); leerMiAsesor(c.signal).then(setMiAsesor); return () => c.abort(); }, []);
  const [creando, setCreando] = useState(false);
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [ver, setVer] = useState<Ver>("todas");
  const [quien, setQuien] = useState<Quien>("todas");
  const [orden, setOrden] = useState<Orden>("sigue");
  const [buscar, setBuscar] = useState("");
  // Archivadas (boceto, como Inmuebles): salen de la lista y se recuperan desde «Filtrar y ordenar».
  const [verArchivados, setVerArchivados] = useState(false);
  const { abierta: abiertaId, abrir, cerrar } = useFichaEnDireccion();
  const abierta = useMemo(() => datos.find((c) => c.id === abiertaId) ?? null, [datos, abiertaId]);
  const [hoy] = useState(() => new Date());

  const crear = async (d: DatosNuevaPersona) => {
    const n = nuevaPersona(d, miAsesor);
    setOcupado(true);
    try {
      await guardar(n.id, n);
      setCreando(false);
      setVer("todas");
      setBuscar("");
      avisar("Persona guardada");
      abrir(n.id);
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se guardó. Vuelve a intentarlo.");
    } finally { setOcupado(false); }
  };

  // N abre «Nueva persona». No actúa mientras se escribe.
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (e.key === "n" || e.key === "N") { e.preventDefault(); setNombreNuevo(""); setCreando(true); }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, []);

  const equipo = useColeccion<Asesor>("asesores");
  const inmuebles = useColeccion<Property>("propiedades");
  const loLleva = useLoLleva(useMemo(() => datos.map((c) => c.asesorId), [datos]), miAsesor, equipo.datos);
  // La búsqueda también encuentra por el inmueble ligado (boceto: «Nombre, teléfono o inmueble»).
  const tituloDe = useMemo(() => new Map(inmuebles.datos.map((x) => [x.slug, x.titulo])), [inmuebles.datos]);
  const archivadas = useMemo(() => datos.filter(estaArchivada).length, [datos]);
  const base = useMemo(() => datos.filter((c) => estaArchivada(c) === verArchivados && loLleva.pasa(c.asesorId) && coincideBusqueda(c, buscar, c.propiedadSlug ? tituloDe.get(c.propiedadSlug) : undefined)),
    [datos, buscar, tituloDe, loLleva, verArchivados]);
  const pasaQuien = (c: Cliente, q: Quien) => QUIEN.find((x) => x.valor === q)!.pasa(c.tipo);
  const cuentaQuien = (q: Quien) => base.filter((c) => pasaQuien(c, q)).length;
  const cuentas = useMemo(() => ({
    todas: base.length,
    propietario: base.filter((c) => esDueno(c.tipo)).length,
    sin_contacto: base.filter((c) => sinSeguimiento(c, hoy)).length,
  }), [base, hoy]);
  const sinSeg = base.filter((c) => pasaQuien(c, quien) && sinSeguimiento(c, hoy)).length;

  const visibles = useMemo(() => {
    const q = QUIEN.find((x) => x.valor === quien)!;
    const r = base.filter((c) => (ver === "todas" || (ver === "propietario" ? esDueno(c.tipo) : sinSeguimiento(c, hoy))) && q.pasa(c.tipo));
    const nombre = (c: Cliente) => c.nombre?.trim() || "Sin nombre";
    if (orden === "nombre") r.sort((a, b) => nombre(a).localeCompare(nombre(b), "es"));
    else if (orden === "sin_contacto") r.sort((a, b) => (diasSinContacto(b, hoy) ?? -1) - (diasSinContacto(a, hoy) ?? -1));
    else r.sort((a, b) => rangoSiguiente(a, hoy).localeCompare(rangoSiguiente(b, hoy)) || nombre(a).localeCompare(nombre(b), "es"));
    return r;
  }, [base, ver, quien, orden, hoy]);

  const activos = (quien !== "todas" ? 1 : 0) + (orden !== "sigue" ? 1 : 0) + (loLleva.activo ? 1 : 0) + (verArchivados ? 1 : 0);
  const limpiar = () => { setQuien("todas"); setOrden("sigue"); setVerArchivados(false); loLleva.quitar(); };
  const resumen = [
    verArchivados ? "Archivadas" : "",
    quien !== "todas" ? QUIEN.find((x) => x.valor === quien)!.etiqueta : "",
    orden !== "sigue" ? ORDENES.find((x) => x.valor === orden)!.etiqueta : "",
  ].filter(Boolean).join(" · ");
  const abrirNueva = (nombre = "") => { setNombreNuevo(nombre); setCreando(true); };
  const grupos: GrupoFiltro[] = [
    { titulo: "Quiénes", tipo: "radio", opciones: QUIEN.map((x) => ({ etiqueta: x.etiqueta, cuenta: cuentaQuien(x.valor), activa: quien === x.valor, alPulsar: () => setQuien(x.valor) })) },
    { titulo: "Ordenar por", tipo: "radio", opciones: ORDENES.map((x) => ({ etiqueta: x.etiqueta, activa: orden === x.valor, alPulsar: () => setOrden(x.valor) })) },
    ...(archivadas || verArchivados ? [{ tipo: "interruptores" as const, opciones: [
      { etiqueta: "Ver archivados", ayuda: `${archivadas} ${archivadas === 1 ? "archivada" : "archivadas"}`, activa: verArchivados, alPulsar: () => setVerArchivados((x) => !x) },
    ] }] : []),
  ];

  // En el teléfono la ficha ocupa la pantalla: al abrirla se sube al principio, como hacía MaestroDetalle.
  const hayAbierta = abierta !== null;
  useEffect(() => { if (hayAbierta && window.matchMedia("(max-width: 900px)").matches) window.scrollTo({ top: 0 }); }, [hayAbierta, abiertaId]);

  const lista = (
    <>
      {/* La barra de 52 px del modelo (Personas.dc.html): título, cuántas y «+» para una persona nueva. */}
      <div className="as-fila as-cab">
        <h1 className="as-h1-lista">Personas</h1>
        {!cargando ? <span className="as-cab-n" aria-label={`${cuentas.todas} ${cuentas.todas === 1 ? "persona" : "personas"}`}>{cuentas.todas}</span> : null}
        <span className="as-sp" />
        <button type="button" className="as-btn as-gho as-ico as-cab-mas" aria-label="Nueva persona" title="Nueva persona (N)" aria-keyshortcuts="N" onClick={() => abrirNueva()}>
          <Icono nombre="mas" tamano={16} />
        </button>
      </div>
      <div className="pr-arriba">
        <p className="pr-resumen">{cargando ? "Cargando…" : `${cuentas.todas} ${cuentas.todas === 1 ? "persona" : "personas"}${verArchivados ? (cuentas.todas === 1 ? " archivada" : " archivadas") : ""} · Datos de ejemplo`}</p>
        <div className="pr-ctl">
          <Buscador valor={buscar} alCambiar={setBuscar} etiqueta="Buscar personas" placeholder="Nombre, teléfono o inmueble" />
          <BotonFiltros grupos={grupos} activos={activos} alLimpiar={limpiar} verTexto={visibles.length ? `Ver ${visibles.length} ${visibles.length === 1 ? "persona" : "personas"}` : "Nadie coincide"} extra={loLleva.control} />
        </div>
        <Segmentado etiqueta="Ver" sinEtiqueta valor={ver} alElegir={setVer}
          opciones={[{ valor: "todas", etiqueta: "Todas", cuenta: cuentas.todas }, { valor: "propietario", etiqueta: "Propietarios", cuenta: cuentas.propietario }, { valor: "sin_contacto", etiqueta: "Sin contacto", cuenta: cuentas.sin_contacto }]} />
        {resumen ? <ResumenFiltros texto={resumen} alLimpiar={limpiar} /> : null}
      </div>
      <div className="pr-cuerpo">
        {sinSeg > 0 && ver !== "sin_contacto" && !buscar.trim() ? (
          <button type="button" className="fx-banda" onClick={() => setVer("sin_contacto")}>
            <span className="fx-banda-icono"><Icono nombre="alerta" tamano={18} /></span>
            <span><b>{sinSeg} sin seguimiento</b> · más de 14 días sin contacto y sin siguiente paso</span>
            <Gesto nombre="derecha" tamano={16} />
          </button>
        ) : null}
        {cargando ? <Cargando lineas={5} etiqueta="Cargando personas" /> : null}
        {error ? <EstadoError texto={error} alReintentar={reintentar} /> : null}
        {!cargando && !error && cuentas.todas === 0 && verArchivados && !buscar.trim() ? <Vacio titulo="No hay archivadas" texto="Lo que archives sale de la lista y se recupera aquí." icono="cliente"
          accion={<Boton variante="secundario" onClick={() => setVerArchivados(false)}>Ver la lista</Boton>} /> : null}
        {!cargando && !error && cuentas.todas === 0 && !verArchivados && !buscar.trim() ? <Vacio titulo="Todavía no hay personas" texto="Cuando entre una consulta o se dé de alta una persona, aparece aquí." icono="cliente" accion={<Boton onClick={() => abrirNueva()}>Nueva persona</Boton>} /> : null}
        {!cargando && !error && datos.length > 0 && visibles.length === 0 && (cuentas.todas > 0 || buscar.trim()) ? (
          buscar.trim()
            ? <Vacio titulo={`Nadie coincide con «${buscar.trim()}»`} texto="Revisa cómo se escribe o dala de alta." icono="buscar"
                accion={<Boton variante="secundario" onClick={() => abrirNueva(buscar.trim())}>Crear «{buscar.trim()}»</Boton>} />
            : <Vacio titulo="Nadie coincide" texto="Quita el filtro para ver a todas." icono="buscar"
                accion={<Boton variante="secundario" onClick={() => { limpiar(); setVer("todas"); }}>Limpiar</Boton>} />
        ) : null}
        {visibles.length ? (
          <div className="as-items pr-items" role="list">
            {visibles.map((c) => {
              const f = { nombre: c.nombre?.trim() || "Sin nombre" };
              const linea = lineaDeLista(c, hoy);
              const p = perfilDe(c);
              const canal = canalDeFila(c);
              const href = canal === "correo" ? `mailto:${c.email}` : canal === "llamada" ? `tel:${c.telefono.replace(/[^\d+]/g, "")}`
                : canal === "whatsapp" ? enlaceWhatsApp(p.whatsapp || c.telefono, `Hola ${f.nombre.split(/\s+/)[0]}, te escribo de Fortius Inmuebles.`) : null;
              return (
                <div key={c.id} role="listitem" className="pr-fila" data-actual={c.id === abiertaId || undefined}>
                  <button type="button" className="as-it pr-it" onClick={() => abrir(c.id)} aria-current={c.id === abiertaId ? "page" : undefined}>
                    <span className="fm-av" aria-hidden>{iniciales(f.nombre)}</span>
                    <span className="as-it-c">
                      <span className="pr-nombre"><b>{f.nombre}</b><Rol>{ROL_DE_TIPO[c.tipo]}</Rol></span>
                      <small className="pr-sig" data-tono={linea.tono}>{linea.texto}</small>
                    </span>
                  </button>
                  <span className="pr-qa">
                    {canal && href ? (
                      p.noContactar ? (
                        <span className="fx-icono-btn" aria-hidden style={{ opacity: 0.35 }}><Icono nombre={ICONO_CANAL[canal]} tamano={18} /></span>
                      ) : (
                        <a className="fx-icono-btn" href={href} target={canal === "whatsapp" ? "_blank" : undefined} rel={canal === "whatsapp" ? "noopener noreferrer" : undefined}
                          aria-label={`${VERBO_CANAL[canal]} a ${f.nombre}`} title={VERBO_CANAL[canal]}><Icono nombre={ICONO_CANAL[canal]} tamano={18} /></a>
                      )
                    ) : null}
                  </span>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </>
  );

  const pos = abierta ? visibles.findIndex((c) => c.id === abierta.id) : -1;
  return (
    <div className="as-dos pr-dos" data-det={abierta !== null}>
      <section className="as-lista" aria-label="Lista de personas">
        <div className="as-lado">
          {lista}
          <div className="as-pie-teclas" aria-hidden><kbd>N</kbd> nueva persona</div>
        </div>
      </section>
      <section className="as-det" aria-label={abierta ? `Ficha de ${abierta.nombre?.trim() || "la persona"}` : "Persona"}>
        {abierta ? (
          <div className="cp fm-col pr-col">
            <div className="cp-barra">
              <button type="button" className="as-btn as-gho as-atras" onClick={() => cerrar()}><Gesto nombre="izquierda" tamano={16} />Personas</button>
              <span className="pr-barra-t">{pos >= 0 ? `${pos + 1} de ${visibles.length}` : ROL_DE_TIPO[abierta.tipo]}</span>
              <span className="as-sp" />
              <button type="button" className="as-btn as-gho as-ico" aria-label="Cerrar la ficha" title="Cerrar la ficha" onClick={() => cerrar()}><Icono nombre="x" tamano={16} /></button>
            </div>
            <div className="pr-cuerpo-det">
              <DetallePersona persona={abierta} personas={datos} guardar={guardar} alAbrirPersona={(id) => abrir(id)} versionDe={versionDe} alUnido={() => reintentar()} />
            </div>
          </div>
        ) : (
          <div className="as-in as-elige">
            <Icono nombre="cliente" tamano={28} />
            <p className="as-m">Elige una persona para ver su ficha.</p>
          </div>
        )}
      </section>
      <HojaAdaptable abierta={creando} titulo="Nueva persona" descripcion="Lo mínimo para darle seguimiento. Lo demás se completa después." alCerrar={() => setCreando(false)}>
        {creando ? (
          <FormularioPersona personas={datos} hoy={hoy} ocupado={ocupado} nombreInicial={nombreNuevo} alCancelar={() => setCreando(false)} alGuardar={(d) => void crear(d)}
            alAbrirExistente={(id) => { setCreando(false); abrir(id); }} />
        ) : null}
      </HojaAdaptable>
    </div>
  );
}

/** useSearchParams pide un límite de Suspense; el esqueleto es el mismo de la carga. */
export default function PaginaPersonas() {
  return <Suspense fallback={<div className="as-cargando" aria-busy="true" aria-label="Cargando personas"><span /><span /><span /></div>}><Personas /></Suspense>;
}
