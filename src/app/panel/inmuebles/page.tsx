"use client";
import { Suspense, useEffect, useMemo, useState } from "react";

import { useLoLleva } from "@/components/panel/datos/lo-lleva";
import { useColeccion } from "@/components/panel/datos/use-coleccion";
import { useFichaEnDireccion } from "@/components/panel/datos/use-ficha-url";
import { BotonFiltros, Buscador, ResumenFiltros, type GrupoFiltro } from "@/components/panel/fichas/piezas";
import { MenuCompartirFila } from "@/components/panel/inmuebles/compartir";
import { DetalleInmueble } from "@/components/panel/inmuebles/detalle-inmueble";
import { FormularioInmueble } from "@/components/panel/inmuebles/formulario";
import { Gesto, Icono } from "@/components/panel/icons";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Boton } from "@/components/panel/kit/boton";
import { Cargando, EstadoError, Vacio } from "@/components/panel/kit/estados";
import { Interruptor, Segmentado } from "@/components/panel/kit/segmentado";
import { HojaAdaptable, useEsTelefono } from "@/components/panel/ui/hoja-adaptable";
import { OPERACION_LABELS, TIPO_LABELS, type Property } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import type { Asesor, Lead } from "@/lib/domain/records";
import { normalizar } from "@/lib/panel/buscar";
import { leerMiAsesor } from "@/lib/panel/datos/colecciones";
import { extrasDe } from "@/lib/panel/datos/inmueble-extras";
import { ligarPropietario, propietariosDe } from "@/lib/panel/datos/inmueble-seguimiento";
import { nuevoInmueble, type DatosInmueble } from "@/lib/panel/datos/inmuebles-acciones";
import { avisosDe, diasPublicado, enSitio, especificaciones, fotoPortada, interesados, precioCorto, tipoYOperacion } from "@/lib/panel/datos/inmuebles-ficha";

type Ver = "todos" | "venta" | "renta";
type Sitio = "todos" | "si" | "no";
type Vista = "lista" | "tarjetas";
type Orden = "recientes" | "precio_menor" | "precio_mayor" | "dias";

const ORDENES: { valor: Orden; etiqueta: string; resumen: string }[] = [
  { valor: "recientes", etiqueta: "Más recientes", resumen: "" },
  { valor: "precio_menor", etiqueta: "Precio: de menor a mayor", resumen: "del más barato al más caro" },
  { valor: "precio_mayor", etiqueta: "Precio: de mayor a menor", resumen: "del más caro al más barato" },
  { valor: "dias", etiqueta: "Más días publicado", resumen: "más días publicado primero" },
];
const monto = (p: Property) => (p.precio.modalidad === "publico" ? p.precio.monto : 0);
const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

/**
 * Inmuebles como el boceto (16/11/2026): Todos · Venta · Renta con conteos, «Filtrar y ordenar» (hoja en el teléfono,
 * ventana junto al botón en escritorio), lista o tarjetas, Compartir sin abrir y el detalle en un panel a la derecha
 * (Esc lo cierra). En el teléfono la lista son tarjetas. Guardar nunca publica.
 */
function Inmuebles() {
  const { cargando, error, datos: todos, reintentar, guardar } = useColeccion<Property>("propiedades");
  const { avisar } = useAvisos();
  const telefono = useEsTelefono();
  const [miAsesor, setMiAsesor] = useState<string | null>(null);
  useEffect(() => { const c = new AbortController(); leerMiAsesor(c.signal).then(setMiAsesor); return () => c.abort(); }, []);
  const [creando, setCreando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const personas = useColeccion<Cliente>("clientes");
  const asesores = useColeccion<Asesor>("asesores");
  const leads = useColeccion<Lead>("leads");
  const [ver, setVer] = useState<Ver>("todos");
  const [vistaElegida, setVista] = useState<Vista>("lista");
  const vista: Vista = telefono ? "tarjetas" : vistaElegida;
  const [buscar, setBuscar] = useState("");
  const [orden, setOrden] = useState<Orden>("recientes");
  const [sitio, setSitio] = useState<Sitio>("todos");
  const [soloApartados, setSoloApartados] = useState(false);
  const [soloAvisos, setSoloAvisos] = useState(false);
  const [verArchivados, setVerArchivados] = useState(false);
  const [tipos, setTipos] = useState<Set<Property["tipo"]>>(new Set());
  const { abierta: abiertoCodigo, abrir, cerrar } = useFichaEnDireccion();
  const abierto = useMemo(() => todos.find((p) => p.codigo === abiertoCodigo) ?? null, [todos, abiertoCodigo]);
  const [hoy] = useState(() => new Date());

  const crear = async (d: DatosInmueble, propietario?: Cliente) => {
    const n = nuevoInmueble(d, miAsesor);
    setOcupado(true);
    try {
      const guardado = await guardar(n.slug, n);
      setCreando(false);
      setVer("todos"); setBuscar(""); setSitio("todos"); setSoloApartados(false); setSoloAvisos(false); setTipos(new Set());
      if (propietario) {
        try { await personas.guardar(propietario.id, ligarPropietario(propietario, guardado.slug)); } catch { avisar("El inmueble se guardó, pero no se ligó al propietario. Lígalo desde la ficha."); }
      }
      avisar(`Guardado sin publicar con el folio ${guardado.codigo}`);
      abrir(guardado.codigo);
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se guardó. Vuelve a intentarlo.");
    } finally { setOcupado(false); }
  };
  // N abre «Nuevo inmueble». No actúa mientras se escribe.
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

  const archivados = useMemo(() => todos.filter((p) => extrasDe(p).archivado).length, [todos]);
  const datos = useMemo(() => todos.filter((p) => Boolean(extrasDe(p).archivado) === verArchivados), [todos, verArchivados]);
  const consultasPor = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of leads.datos) if (l.propiedadSlug) m.set(l.propiedadSlug, (m.get(l.propiedadSlug) ?? 0) + 1);
    return m;
  }, [leads.datos]);
  const avisosPor = useMemo(() => new Map(datos.map((p) => [p.slug, avisosDe(p, personas.datos, { consultas: consultasPor.get(p.slug) ?? 0, hoy })])), [datos, personas.datos, consultasPor, hoy]);
  const loLleva = useLoLleva(useMemo(() => todos.map((p) => p.asesorId), [todos]), miAsesor, asesores.datos);

  // Búsqueda: colonia, calle, propietario o precio (tres cifras o más buscan en el precio).
  const pajar = useMemo(() => new Map(datos.map((p) => {
    const x = extrasDe(p);
    const duenos = propietariosDe(personas.datos, p.slug).map((c) => c.nombre).join(" ");
    return [p.slug, normalizar([p.titulo, p.zona, p.direccionAproximada, x.direccionCompleta, x.municipio, duenos, TIPO_LABELS[p.tipo], OPERACION_LABELS[p.operacion], p.codigo].filter(Boolean).join(" "))];
  })), [datos, personas.datos]);
  const q = normalizar(buscar.trim());
  const qCifras = buscar.replace(/\D/g, "");
  const base = useMemo(() => datos.filter((p) => {
    if (!q) return true;
    if (q.split(/\s+/).every((w) => pajar.get(p.slug)?.includes(w))) return true;
    return qCifras.length >= 3 && String(monto(p)).includes(qCifras);
  }), [datos, q, qCifras, pajar]);

  type Omitir = "sitio" | "apartados" | "avisos" | "tipo" | null;
  const pasa = (p: Property, omitir: Omitir = null, o: { apartados?: boolean; avisos?: boolean } = {}) => {
    const ap = o.apartados ?? soloApartados;
    const av = o.avisos ?? soloAvisos;
    if (omitir !== "sitio" && sitio === "si" && !p.publicada) return false;
    if (omitir !== "sitio" && sitio === "no" && p.publicada) return false;
    if (omitir !== "apartados" && ap && p.estado !== "apartada") return false;
    if (omitir !== "avisos" && av && !avisosPor.get(p.slug)?.length) return false;
    if (omitir !== "tipo" && tipos.size && !tipos.has(p.tipo)) return false;
    return loLleva.pasa(p.asesorId);
  };
  const deOperacion = (p: Property, v: Ver = ver) => v === "todos" || p.operacion === v;
  const visibles = (() => {
    const l = base.filter((p) => deOperacion(p) && pasa(p));
    if (orden === "precio_menor") return [...l].sort((a, b) => (monto(a) || Infinity) - (monto(b) || Infinity));
    if (orden === "precio_mayor") return [...l].sort((a, b) => monto(b) - monto(a));
    if (orden === "dias") return [...l].sort((a, b) => (diasPublicado(b, hoy) ?? -1) - (diasPublicado(a, hoy) ?? -1));
    return l;
  })();
  const cuenta = (v: Ver) => base.filter((p) => deOperacion(p, v) && pasa(p)).length;
  const cuentaCon = (omitir: Omitir, o: { apartados?: boolean; avisos?: boolean }) => base.filter((p) => deOperacion(p) && pasa(p, omitir, o)).length;

  const publicados = datos.filter((p) => p.publicada).length;
  const conAvisos = datos.filter((p) => avisosPor.get(p.slug)?.length).length;
  const tiposHay = useMemo(() => [...new Set(datos.map((p) => p.tipo))], [datos]);
  const activos = (sitio !== "todos" ? 1 : 0) + (soloApartados ? 1 : 0) + (soloAvisos ? 1 : 0) + (tipos.size ? 1 : 0) + (loLleva.activo ? 1 : 0) + (verArchivados ? 1 : 0);
  const limpiar = () => { setSitio("todos"); setSoloApartados(false); setSoloAvisos(false); setTipos(new Set()); setOrden("recientes"); setVerArchivados(false); loLleva.quitar(); };
  const nombresTipos = [...tipos].map((t) => TIPO_LABELS[t]);
  const resumenCrudo = [
    verArchivados ? "Archivados" : "",
    sitio === "si" ? "Publicados" : sitio === "no" ? "Sin publicar" : "",
    soloApartados ? "Apartados" : "",
    soloAvisos ? "Con avisos" : "",
    nombresTipos.length ? (nombresTipos.length <= 2 ? nombresTipos.join(" o ") : `${nombresTipos.length} tipos`) : "",
    ORDENES.find((o) => o.valor === orden)?.resumen ?? "",
  ].filter(Boolean).join(" · ");
  const resumen = resumenCrudo ? resumenCrudo.charAt(0).toUpperCase() + resumenCrudo.slice(1) : "";
  const grupos: GrupoFiltro[] = [
    { titulo: "En el sitio", tipo: "radio", opciones: ([["todos", "Cualquiera"], ["si", "Publicados"], ["no", "Sin publicar"]] as const).map(([v, e]) => ({ etiqueta: e, activa: sitio === v, alPulsar: () => setSitio(v) })) },
    { tipo: "interruptores", opciones: [
      { etiqueta: "Solo apartados", ayuda: plural(cuentaCon("apartados", { apartados: true }), "inmueble", "inmuebles"), activa: soloApartados, alPulsar: () => setSoloApartados((x) => !x) },
      { etiqueta: "Solo con avisos", ayuda: `${cuentaCon("avisos", { avisos: true })} con precio, fotos o contrato pendiente`, tono: "aviso", activa: soloAvisos, alPulsar: () => setSoloAvisos((x) => !x) },
      ...(archivados ? [{ etiqueta: "Ver archivados", ayuda: plural(archivados, "archivado", "archivados"), activa: verArchivados, alPulsar: () => setVerArchivados((x) => !x) }] : []),
    ] },
    ...(tiposHay.length > 1 ? [{ titulo: "Tipo", tipo: "check" as const, opciones: tiposHay.map((t) => ({
      etiqueta: TIPO_LABELS[t], cuenta: base.filter((p) => deOperacion(p) && pasa(p, "tipo") && p.tipo === t).length, activa: tipos.has(t),
      alPulsar: () => setTipos((s) => { const n = new Set(s); if (n.has(t)) n.delete(t); else n.add(t); return n; }),
    })) }] : []),
    { titulo: "Ordenar por", tipo: "radio", opciones: ORDENES.map((o) => ({ etiqueta: o.etiqueta, activa: orden === o.valor, alPulsar: () => setOrden(o.valor) })) },
  ];

  const textoInteresados = (p: Property) => {
    const n = interesados(p, { clientes: personas.datos, leads: leads.datos });
    if (!n.length) return "Sin interesados";
    const avisados = new Set((extrasDe(p).avisosCompradores ?? []).map((a) => a.personaId));
    const nuevos = n.filter((i) => !avisados.has(i.id)).length;
    return `${plural(n.length, "interesado", "interesados")}${nuevos ? ` · ${plural(nuevos, "nuevo", "nuevos")}` : ""}`;
  };
  const lineaAviso = (p: Property) => {
    const av = avisosPor.get(p.slug) ?? [];
    return av[0] ? <span className="fx-avisoln"><Icono nombre="alerta" tamano={14} />{av[0].texto}{av.length > 1 ? ` y ${av.length - 1} más` : ""}</span> : null;
  };
  const vacioFiltrado = !cargando && !error && datos.length > 0 && visibles.length === 0;

  return (
    <div className="fx-pagina">
      <div className="fx-in-cab">
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <h1 style={{ margin: 0, fontSize: 26, lineHeight: 1.1, fontWeight: 600 }}>Inmuebles</h1>
          <span className="fx-cuenta">{cargando ? "Cargando…" : `${plural(datos.length, "inmueble", "inmuebles")} · ${plural(publicados, "publicado", "publicados")} · Datos de ejemplo`}</span>
        </div>
        <div className="fx-in-ctl" style={{ alignItems: "center" }}>
          <Buscador valor={buscar} alCambiar={setBuscar} etiqueta="Buscar inmueble" placeholder="Colonia, calle, propietario o precio" />
          {telefono ? null : <Interruptor etiqueta="Vista" sinEtiqueta valor={vistaElegida} alElegir={setVista} opciones={[{ valor: "lista", etiqueta: "Lista" }, { valor: "tarjetas", etiqueta: "Tarjetas" }]} />}
          <Boton onClick={() => setCreando(true)} aria-keyshortcuts="N" aria-label={telefono ? "Nuevo inmueble" : undefined}><Gesto nombre="mas" tamano={18} />{telefono ? null : "Nuevo"}</Boton>
        </div>
      </div>
      <div className="fx-fila-ctl" style={{ flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 260px", maxWidth: 420 }}>
          <Segmentado etiqueta="Operación" valor={ver} alElegir={setVer} opciones={[{ valor: "todos", etiqueta: "Todos", cuenta: cuenta("todos") }, { valor: "venta", etiqueta: "Venta", cuenta: cuenta("venta") }, { valor: "renta", etiqueta: "Renta", cuenta: cuenta("renta") }]} />
        </div>
        <BotonFiltros conTexto={!telefono} grupos={grupos} activos={activos} alLimpiar={limpiar}
          verTexto={visibles.length ? `Ver ${plural(visibles.length, "inmueble", "inmuebles")}` : "Ningún inmueble coincide"} extra={loLleva.control} />
      </div>
      {resumen ? <ResumenFiltros texto={resumen} alLimpiar={limpiar} /> : null}
      {conAvisos > 0 && !soloAvisos && !q ? (
        <button type="button" className="fx-banda" onClick={() => { setSoloAvisos(true); setVer("todos"); }}>
          <span className="fx-banda-icono"><Icono nombre="alerta" tamano={18} /></span>
          <span><b>{conAvisos === 1 ? "1 inmueble con avisos" : `${conAvisos} inmuebles con avisos`}</b></span>
          <span style={{ flex: "none", fontWeight: 600, color: "var(--accent)" }}>Ver</span>
          <Gesto nombre="derecha" tamano={16} />
        </button>
      ) : null}

      {cargando ? <Cargando lineas={5} etiqueta="Cargando inmuebles" /> : null}
      {error ? <EstadoError texto={error} alReintentar={reintentar} /> : null}
      {!cargando && !error && datos.length === 0 ? (
        verArchivados ? <Vacio titulo="No hay archivados" texto="Lo que archives sale de la lista y se recupera aquí." icono="edificio" />
        : <Vacio titulo="Todavía no hay inmuebles" texto="Cuando se dé de alta un inmueble, aparece aquí." icono="edificio" accion={<Boton onClick={() => setCreando(true)}>Nuevo inmueble</Boton>} />
      ) : null}
      {vacioFiltrado ? (
        <div className="fx-tarjeta" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", padding: "14px 16px" }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Ningún inmueble coincide</span>
          <Boton variante="secundario" onClick={() => setCreando(true)}>Registrar uno nuevo</Boton>
        </div>
      ) : null}

      {visibles.length && vista === "lista" ? (
        <div className="fx-tarjeta" role="list" aria-label="Inmuebles">
          <div className="fx-tbl fx-tbl-cab" aria-hidden>
            <span />
            <span className="fx-th">Inmueble</span>
            <span className="fx-th">Precio</span>
            <span className="fx-th">En el sitio</span>
            <span className="fx-th">Días</span>
            <span className="fx-th">Interesados</span>
          </div>
          {visibles.map((p) => {
            const foto = fotoPortada(p);
            const s = enSitio(p);
            const dias = diasPublicado(p, hoy);
            return (
              <div key={p.slug} role="listitem" className="fx-fila" data-actual={p.codigo === abiertoCodigo || undefined}>
                <button type="button" className="fx-imain fx-tbl" onClick={() => abrir(p.codigo)} aria-current={p.codigo === abiertoCodigo || undefined}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- miniatura del inventario */}
                  <span className="fx-iph" style={{ height: 56 }}>{foto ? <img src={foto} alt="" loading="lazy" /> : null}</span>
                  <span style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                    <b className="fx-trunc" style={{ fontSize: 14, fontWeight: 600 }}>{p.titulo}</b>
                    <span className="fx-trunc" style={{ fontSize: 13, color: "var(--ink-muted)" }}>{especificaciones(p) || tipoYOperacion(p)}</span>
                    {lineaAviso(p)}
                  </span>
                  <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                    <b className="fx-trunc" style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: monto(p) ? undefined : "var(--ink-muted)" }}>{precioCorto(p)}</b>
                    <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>{OPERACION_LABELS[p.operacion]}</span>
                  </span>
                  <span><span className="fx-badge" data-tono={s.tono}>{s.texto}</span></span>
                  <span style={{ fontSize: 14, fontVariantNumeric: "tabular-nums", color: dias === null ? "var(--ink-muted)" : undefined }}>{dias === null ? "—" : plural(dias, "día", "días")}</span>
                  <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>{textoInteresados(p)}</span>
                </button>
                <span className="fx-qa"><MenuCompartirFila inmueble={p} /></span>
              </div>
            );
          })}
        </div>
      ) : null}

      {visibles.length && vista === "tarjetas" ? (
        <div className="fx-tarjetas">
          {visibles.map((p) => {
            const foto = fotoPortada(p);
            const s = enSitio(p);
            const nFotos = p.galeria.filter((g) => !g.oculta).length;
            return (
              <div key={p.slug} className="fx-tj">
                <button type="button" className="fx-tj-btn" data-actual={p.codigo === abiertoCodigo || undefined} onClick={() => abrir(p.codigo)}>
                  <span className="fx-iph fx-tj-foto">
                    <span className="fx-badge" data-tono={s.tono}>{s.texto}</span>
                    {/* eslint-disable-next-line @next/next/no-img-element -- foto del inventario en tarjeta */}
                    {foto ? <img src={foto} alt="" loading="lazy" /> : null}
                    <span className="fx-badge" style={{ position: "absolute", left: 8, top: "auto", bottom: 8, zIndex: 1 }}>{nFotos ? plural(nFotos, "foto", "fotos") : "Sin fotos"}</span>
                  </span>
                  <span className="fx-tj-txt">
                    <b style={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: monto(p) ? undefined : "var(--ink-muted)" }}>{precioCorto(p)}</b>
                    <span className="fx-trunc" style={{ fontSize: 14, fontWeight: 600 }}>{p.titulo}</span>
                    <span className="fx-trunc" style={{ fontSize: 13, color: "var(--ink-muted)" }}>{especificaciones(p) || tipoYOperacion(p)}</span>
                    {lineaAviso(p)}
                    <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>{textoInteresados(p)}</span>
                  </span>
                </button>
                <span className="fx-tj-compartir"><MenuCompartirFila inmueble={p} boton="redondo" /></span>
              </div>
            );
          })}
        </div>
      ) : null}

      <HojaAdaptable abierta={abierto !== null} titulo={abierto?.titulo ?? "Inmueble"} anchoPanel={540} pegado
        cabecera={abierto ? <span className="fx-cuenta">{tipoYOperacion(abierto)}</span> : undefined} alCerrar={() => cerrar()}>
        {abierto ? <DetalleInmueble inmueble={abierto} guardar={guardar} personas={personas.datos} guardarPersona={personas.guardar} /> : null}
      </HojaAdaptable>
      <HojaAdaptable abierta={creando} titulo="Nuevo inmueble" descripcion="Lo que sabes de la primera visita. Fotos, datos y documentos van después." alCerrar={() => setCreando(false)}>
        {creando ? <FormularioInmueble ocupado={ocupado} personas={personas.datos} alGuardar={(d, dueno) => void crear(d, dueno)} alCancelar={() => setCreando(false)} /> : null}
      </HojaAdaptable>
    </div>
  );
}

/** useSearchParams pide un límite de Suspense; el esqueleto es el mismo de la carga. */
export default function PaginaInmuebles() {
  return <Suspense fallback={<div className="pn-pagina"><Cargando lineas={5} etiqueta="Cargando" /></div>}><Inmuebles /></Suspense>;
}
