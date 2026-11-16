"use client";
import { AsuntosDe } from "@/components/panel/asuntos/asuntos-de";
import { Suspense, useEffect, useMemo, useState } from "react";

import { useLoLleva } from "@/components/panel/datos/lo-lleva";
import { useColeccion } from "@/components/panel/datos/use-coleccion";
import { useFichaEnDireccion } from "@/components/panel/datos/use-ficha-url";
import { Icono } from "@/components/panel/icons";
import { Boton, BotonEnlace } from "@/components/panel/kit/boton";
import { useAvisos } from "@/components/panel/kit/avisos";
import { FormularioInmueble } from "@/components/panel/inmuebles/formulario";
import { LlavesInmueble, PropietarioInmueble } from "@/components/panel/inmuebles/seguimiento";
import { FotosInmueble, PublicarInmueble, TextosSitio } from "@/components/panel/inmuebles/sitio";
import { agregarFotos, describirFoto, editarTextos, mostrarFoto, ordenarFotos, publicar, quitarDelSitio, quitarFoto } from "@/lib/panel/datos/inmueble-sitio";
import type { Cliente } from "@/lib/backend/contracts";
import type { Asesor } from "@/lib/domain/records";
import { desligarPropietario, guardarLlaves, ligarPropietario, prestarLlaves, propietariosDe, regresaronLlaves } from "@/lib/panel/datos/inmueble-seguimiento";
import { leerMiAsesor } from "@/lib/panel/datos/colecciones";
import { editarInmueble, nuevoInmueble, type DatosInmueble } from "@/lib/panel/datos/inmuebles-acciones";
import { Campo } from "@/components/panel/kit/campo";
import { Ficha } from "@/components/panel/kit/ficha";
import { Relacionado } from "@/components/panel/kit/relacionado";
import { HojaAdaptable } from "@/components/panel/ui/hoja-adaptable";
import { Cargando, EstadoError, Vacio } from "@/components/panel/kit/estados";
import { Fila, GrupoLista } from "@/components/panel/kit/lista";
import { Segmentado } from "@/components/panel/kit/segmentado";
import type { Property } from "@/data/propiedades";
import type { Evento, Lead } from "@/lib/domain/records";
import { aTexto } from "@/lib/panel/calendario";
import { relacionadoInmueble } from "@/lib/panel/datos/relacionado";
import { fichaInmueble, filaInmueble, filtrarInmuebles, ordenarInmuebles, type OrdenInmuebles } from "@/lib/panel/datos/vistas";
import { FiltrarYOrdenar } from "@/components/panel/kit/filtrar-ordenar";
import { CompartirInmueble, MenuCompartirFila } from "@/components/panel/inmuebles/compartir";

type Ver = "todos" | "venta" | "renta";

/** Inmuebles (PN-03): lista con búsqueda y Venta o Renta, ficha, compartir en un toque (WhatsApp, enlace o PDF), alta («Nuevo inmueble», tecla N) y edición. Guardar nunca publica. */
function Inmuebles() {
  const { cargando, error, datos, reintentar, guardar } = useColeccion<Property>("propiedades");
  const { avisar } = useAvisos();
  const [miAsesor, setMiAsesor] = useState<string | null>(null);
  useEffect(() => { const c = new AbortController(); leerMiAsesor(c.signal).then(setMiAsesor); return () => c.abort(); }, []);
  const [creando, setCreando] = useState(false);
  const [editandoSlug, setEditandoSlug] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const personas = useColeccion<Cliente>("clientes");
  const asesores = useColeccion<Asesor>("asesores");
  const [ahora] = useState(() => new Date());
  // Quién registra un préstamo de llaves: el nombre de su ficha de asesor, o «Dirección».
  const quien = useMemo(() => asesores.datos.find((a) => a.id === miAsesor)?.nombre ?? "Dirección", [asesores.datos, miAsesor]);
  // Quitar del sitio no ofrece Deshacer: volver a publicar pasa por la revisión del servidor (COR-16).
  const cambiarInmueble = async (previo: Property, siguiente: Property, texto: string, deshacer = true) => {
    setOcupado(true);
    try {
      await guardar(previo.slug, siguiente);
      if (!deshacer) { avisar(texto); return; }
      avisar(texto, { etiqueta: "Deshacer", alAccionar: () => {
        guardar(previo.slug, previo).then(() => avisar("Se deshizo"), (e: unknown) => avisar(e instanceof Error ? e.message : "No se pudo deshacer."));
      } });
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se guardó. Vuelve a intentarlo.");
    } finally { setOcupado(false); }
  };
  const cambiarPersona = async (previa: Cliente, siguiente: Cliente, texto: string) => {
    setOcupado(true);
    try {
      await personas.guardar(previa.id, siguiente);
      avisar(texto, { etiqueta: "Deshacer", alAccionar: () => {
        personas.guardar(previa.id, previa).then(() => avisar("Se deshizo"), (e: unknown) => avisar(e instanceof Error ? e.message : "No se pudo deshacer."));
      } });
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se guardó. Vuelve a intentarlo.");
    } finally { setOcupado(false); }
  };
  const [ver, setVer] = useState<Ver>("todos");
  const [buscar, setBuscar] = useState("");
  const { abierta: abiertoCodigo, abrir, cerrar } = useFichaEnDireccion();
  const abierto = useMemo(() => datos.find((p) => p.codigo === abiertoCodigo) ?? null, [datos, abiertoCodigo]);
  const leads = useColeccion<Lead>("leads");
  const eventos = useColeccion<Evento>("eventos");
  const [hoy] = useState(() => aTexto(new Date()));

  const crear = async (d: DatosInmueble) => {
    const n = nuevoInmueble(d, miAsesor);
    setOcupado(true);
    try {
      const guardado = await guardar(n.slug, n);
      setCreando(false);
      setVer("todos");
      setBuscar("");
      avisar(`Inmueble guardado con el folio ${guardado.codigo}`);
      abrir(guardado.codigo);
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se guardó. Vuelve a intentarlo.");
    } finally { setOcupado(false); }
  };
  const guardarCambios = async (previo: Property, d: DatosInmueble) => {
    setOcupado(true);
    try {
      await guardar(previo.slug, editarInmueble(previo, d));
      setEditandoSlug(null);
      avisar("Cambios guardados", { etiqueta: "Deshacer", alAccionar: () => {
        guardar(previo.slug, previo).then(() => avisar("Se deshizo"), (e: unknown) => avisar(e instanceof Error ? e.message : "No se pudo deshacer."));
      } });
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

  const porSlug = useMemo(() => new Map(datos.map((p) => [p.slug, p])), [datos]);
  const filas = useMemo(() => datos.map(filaInmueble).sort((a, b) => a.titulo.localeCompare(b.titulo, "es")), [datos]);
  const cuentas = useMemo(() => ({
    todos: filas.length,
    venta: filas.filter((f) => f.operacion === "venta").length,
    renta: filas.filter((f) => f.operacion === "renta").length,
  }), [filas]);
  // Filtrar y ordenar (sugerencia 9).
  const [orden, setOrden] = useState<OrdenInmuebles>("nombre");
  const [soloEnSitio, setSoloEnSitio] = useState(false);
  const [sinEjemplos, setSinEjemplos] = useState(false);
  const asesoresDe = useMemo(() => new Map(datos.map((p) => [p.slug, p.asesorId])), [datos]);
  const loLleva = useLoLleva(useMemo(() => [...asesoresDe.values()], [asesoresDe]), miAsesor, asesores.datos);
  const visibles = useMemo(
    () => ordenarInmuebles(filtrarInmuebles(filas, buscar, ver).filter((f) => (!soloEnSitio || !f.privado) && (!sinEjemplos || !f.esEjemplo) && loLleva.pasa(asesoresDe.get(f.slug))), orden),
    [filas, buscar, ver, soloEnSitio, sinEjemplos, orden, loLleva, asesoresDe],
  );

  return (
    <div className="pn-pagina" style={{ maxWidth: 760 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <h1 className="pn-h1">Inmuebles</h1>
        <Boton variante="secundario" onClick={() => setCreando(true)} aria-keyshortcuts="N">Nuevo inmueble</Boton>
      </div>
      <p className="pn-sub">{cargando ? "Cargando…" : `${cuentas.todos} ${cuentas.todos === 1 ? "inmueble" : "inmuebles"}`}</p>
      <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
        <Campo etiqueta="Buscar" placeholder="Nombre, zona o folio" value={buscar} onChange={(e) => setBuscar(e.target.value)} type="search" autoComplete="off" />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: "1 1 140px" }}>
            <Segmentado etiqueta="Ver" valor={ver} alElegir={setVer} opciones={[{ valor: "todos", etiqueta: "Todos", cuenta: cuentas.todos }, { valor: "venta", etiqueta: "Venta", cuenta: cuentas.venta }, { valor: "renta", etiqueta: "Renta", cuenta: cuentas.renta }]} />
          </div>
          {loLleva.control ? <div style={{ flex: "1 1 140px" }}>{loLleva.control}</div> : null}
          <FiltrarYOrdenar
            orden={orden}
            ordenes={[{ valor: "nombre", etiqueta: "Nombre" }, { valor: "precio_mayor", etiqueta: "Precio, de mayor a menor" }, { valor: "precio_menor", etiqueta: "Precio, de menor a mayor" }, { valor: "folio", etiqueta: "Folio" }]}
            alOrdenar={setOrden}
            interruptores={[
              { etiqueta: "Solo los que están en el sitio", ayuda: "Oculta los que están en evaluación", valor: soloEnSitio, alCambiar: setSoloEnSitio },
              { etiqueta: "Ocultar los de ejemplo", valor: sinEjemplos, alCambiar: setSinEjemplos },
            ]}
            resultado={visibles.length}
            nombreResultado={["inmueble", "inmuebles"]}
            alQuitar={() => { setOrden("nombre"); setSoloEnSitio(false); setSinEjemplos(false); }}
          />
        </div>
      </div>
      <div style={{ display: "grid", gap: 20, marginTop: 20 }}>
        {cargando ? <Cargando lineas={5} etiqueta="Cargando inmuebles" /> : null}
        {error ? <EstadoError texto={error} alReintentar={reintentar} /> : null}
        {!cargando && !error && cuentas.todos === 0 ? <Vacio titulo="Todavía no hay inmuebles" texto="Cuando se dé de alta un inmueble, aparece aquí." icono="edificio" accion={<Boton onClick={() => setCreando(true)}>Nuevo inmueble</Boton>} /> : null}
        {!cargando && !error && cuentas.todos > 0 && visibles.length === 0 ? <Vacio titulo="Nada coincide" texto="Prueba con otra palabra o cambia el filtro." icono="buscar" /> : null}
        {visibles.length ? (
          <GrupoLista>
            {visibles.map((f) => (
              <Fila
                key={f.slug}
                izquierda={<span className="pn-av" aria-hidden style={{ borderRadius: "var(--r-md)" }}><Icono nombre="edificio" tamano={18} /></span>}
                titulo={f.titulo}
                subtitulo={f.subtitulo}
                detalle={[f.estado, f.esEjemplo ? "Ejemplo" : null].filter(Boolean).join(" · ")}
                tonoDetalle={f.esEjemplo ? "aviso" : "normal"}
                lado={f.precio}
                ladoMenor={f.codigo}
                alPulsar={() => abrir(f.codigo)}
                seleccionada={f.codigo === abiertoCodigo}
                acciones={porSlug.get(f.slug) ? <MenuCompartirFila inmueble={porSlug.get(f.slug) as Property} /> : undefined}
              />
            ))}
          </GrupoLista>
        ) : null}
      </div>
      <HojaAdaptable abierta={abierto !== null} titulo={abierto?.titulo ?? "Inmueble"} alCerrar={() => cerrar()}>
        {abierto && editandoSlug === abierto.slug ? (
          <FormularioInmueble key={abierto.slug} inmueble={abierto} ocupado={ocupado} alGuardar={(d) => void guardarCambios(abierto, d)} alCancelar={() => setEditandoSlug(null)} />
        ) : abierto ? (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 4 }}>
              <p className="pn-sub" style={{ margin: 0 }}>{abierto.codigo}</p>
              <Boton variante="texto" onClick={() => setEditandoSlug(abierto.slug)}>Editar datos</Boton>
            </div>
            <CompartirInmueble inmueble={abierto} />
            {abierto.operacion === "venta" ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
                <BotonEnlace href={`/panel/herramientas/credito?inmueble=${encodeURIComponent(abierto.codigo)}`}>Calcular crédito</BotonEnlace>
                <BotonEnlace href={`/panel/herramientas/comision?inmueble=${encodeURIComponent(abierto.codigo)}`}>Calcular comisión</BotonEnlace>
              </div>
            ) : null}
            <Ficha secciones={fichaInmueble(abierto)} />
            <AsuntosDe slug={abierto.slug} />
            <PublicarInmueble
              inmueble={abierto}
              propietarioLigado={propietariosDe(personas.datos, abierto.slug).length > 0}
              ocupado={ocupado}
              alPublicar={() => void cambiarInmueble(abierto, publicar(abierto), "Publicado en el sitio")}
              alQuitar={() => void cambiarInmueble(abierto, quitarDelSitio(abierto), "Se quitó del sitio", false)}
            />
            <FotosInmueble
              inmueble={abierto}
              ocupado={ocupado}
              alAgregar={(f) => void cambiarInmueble(abierto, agregarFotos(abierto, f), f.length === 1 ? "Foto agregada" : `${f.length} fotos agregadas`)}
              alOrdenar={(g) => void cambiarInmueble(abierto, ordenarFotos(abierto, g), "Orden de fotos guardado")}
              alDescribir={(src, alt) => void cambiarInmueble(abierto, describirFoto(abierto, src, alt), "Descripción guardada")}
              alMostrar={(src) => void cambiarInmueble(abierto, mostrarFoto(abierto, src), "La foto ya se muestra en el sitio")}
              alQuitar={(src) => void cambiarInmueble(abierto, quitarFoto(abierto, src), "Foto quitada")}
            />
            <TextosSitio
              key={`textos-${abierto.slug}-${abierto.descripcion.length}`}
              inmueble={abierto}
              ocupado={ocupado}
              alGuardar={(d) => void cambiarInmueble(abierto, editarTextos(abierto, d), "Textos guardados")}
            />
            <PropietarioInmueble
              inmueble={abierto}
              personas={personas.datos}
              ocupado={ocupado}
              alLigar={(c) => void cambiarPersona(c, ligarPropietario(c, abierto.slug), `${c.nombre} quedó como propietario`)}
              alDesligar={(c) => void cambiarPersona(c, desligarPropietario(c), "Se quitó el propietario")}
            />
            <LlavesInmueble
              key={`llaves-${abierto.slug}`}
              inmueble={abierto}
              hoy={ahora}
              ocupado={ocupado}
              alGuardar={(d) => void cambiarInmueble(abierto, guardarLlaves(abierto, d), "Llaves guardadas")}
              alPrestar={(d) => void cambiarInmueble(abierto, prestarLlaves(abierto, d, quien), `Llaves prestadas a ${d.persona.trim()}`)}
              alRegresar={(id) => void cambiarInmueble(abierto, regresaronLlaves(abierto, id, quien), "Llaves de regreso")}
            />
            <Relacionado grupos={relacionadoInmueble(abierto, { leads: leads.datos, eventos: eventos.datos, hoy })} />
          </>
        ) : null}
      </HojaAdaptable>
      <HojaAdaptable abierta={creando} titulo="Nuevo inmueble" descripcion="Lo que sabes de la primera visita. Fotos, textos y publicación van aparte." alCerrar={() => setCreando(false)}>
        {creando ? <FormularioInmueble ocupado={ocupado} alGuardar={(d) => void crear(d)} /> : null}
      </HojaAdaptable>
    </div>
  );
}

/** useSearchParams pide un límite de Suspense; el esqueleto es el mismo de la carga. */
export default function PaginaInmuebles() {
  return <Suspense fallback={<div className="pn-pagina"><Cargando lineas={5} etiqueta="Cargando" /></div>}><Inmuebles /></Suspense>;
}
