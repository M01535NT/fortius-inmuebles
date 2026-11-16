"use client";
import { Suspense, useEffect, useMemo, useState } from "react";

import { useLoLleva } from "@/components/panel/datos/lo-lleva";
import { useColeccion } from "@/components/panel/datos/use-coleccion";
import { useFichaEnDireccion } from "@/components/panel/datos/use-ficha-url";

import { useAvisos } from "@/components/panel/kit/avisos";
import { Boton } from "@/components/panel/kit/boton";
import { Campo } from "@/components/panel/kit/campo";
import { DetallePersona } from "@/components/panel/personas/detalle-persona";
import { FormularioPersona } from "@/components/panel/personas/formularios";
import { leerMiAsesor } from "@/lib/panel/datos/colecciones";
import { nuevaPersona, type DatosNuevaPersona } from "@/lib/panel/datos/personas-acciones";
import { Cargando, EstadoError, Vacio } from "@/components/panel/kit/estados";
import { Fila, GrupoLista } from "@/components/panel/kit/lista";
import { Segmentado } from "@/components/panel/kit/segmentado";
import type { Cliente } from "@/lib/backend/contracts";
import type { Asesor, Lead } from "@/lib/domain/records";
import { pestanaDe } from "@/lib/panel/datos/consultas";
import { FiltrarYOrdenar } from "@/components/panel/kit/filtrar-ordenar";
import { rutaPersona } from "@/lib/panel/datos/relacionado";
import { MenuFila } from "@/components/panel/kit/menu-fila";
import { HojaAdaptable } from "@/components/panel/ui/hoja-adaptable";
import { NOMBRE_TIPO_PERSONA, PLURAL_TIPO_PERSONA, filaPersona, filtrarPersonas, ordenarPersonas, type FilaPersona, type OrdenPersonas } from "@/lib/panel/datos/vistas";

type Ver = "todas" | "propietario" | "sin_contacto";
const ORDEN_TIPOS: Cliente["tipo"][] = ["propietario", "comprador", "arrendador", "arrendatario", "inversionista", "otro"];

const iniciales = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";

function Avatar({ nombre }: { nombre: string }) {
  return <span className="pn-av" aria-hidden>{iniciales(nombre)}</span>;
}

/** Personas (PN-03): lista con búsqueda y filtros, ficha, alta («Nueva persona», tecla N) y edición de datos, con aviso de duplicado. */
function Personas() {
  const { cargando, error, datos, reintentar, guardar } = useColeccion<Cliente>("clientes");
  const { avisar } = useAvisos();
  const [miAsesor, setMiAsesor] = useState<string | null>(null);
  useEffect(() => { const c = new AbortController(); leerMiAsesor(c.signal).then(setMiAsesor); return () => c.abort(); }, []);
  const [creando, setCreando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [ver, setVer] = useState<Ver>("todas");
  const [buscar, setBuscar] = useState("");
  const { abierta: abiertaId, abrir, cerrar } = useFichaEnDireccion();
  const abierta = useMemo(() => datos.find((c) => c.id === abiertaId) ?? null, [datos, abiertaId]);
  // Consultas: para «Solo con consultas abiertas» (lectura; el servidor decide qué ve cada quien).
  const leads = useColeccion<Lead>("leads");
  const [ahora] = useState(() => new Date());

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
      if (e.key === "n" || e.key === "N") { e.preventDefault(); setCreando(true); }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, []);

  const telefonoDe = useMemo(() => new Map(datos.map((c) => [c.id, c.telefono || undefined])), [datos]);
  const filas = useMemo(() => datos.map(filaPersona).sort((a, b) => a.nombre.localeCompare(b.nombre, "es")), [datos]);
  const cuentas = useMemo(() => ({
    todas: filas.length,
    propietario: filas.filter((f) => f.tipo === "propietario").length,
    sin_contacto: filas.filter((f) => f.sinContacto).length,
  }), [filas]);

  // Filtrar y ordenar (sugerencia 9): orden y «solo con consultas abiertas».
  const [orden, setOrden] = useState<OrdenPersonas>("nombre");
  const [conConsulta, setConConsulta] = useState(false);
  const conConsultaAbierta = useMemo(() => new Set(leads.datos.filter((l) => l.clienteId && pestanaDe(l) !== "cerradas").map((l) => l.clienteId as string)), [leads.datos]);
  const asesoresDe = useMemo(() => new Map(datos.map((c) => [c.id, c.asesorId])), [datos]);
  const equipo = useColeccion<Asesor>("asesores");
  const loLleva = useLoLleva(useMemo(() => [...asesoresDe.values()], [asesoresDe]), miAsesor, equipo.datos);
  const visibles = useMemo(() => {
    const base = filas.filter((f) => (ver === "todas" || (ver === "propietario" ? f.tipo === "propietario" : f.sinContacto)) && (!conConsulta || conConsultaAbierta.has(f.id)) && loLleva.pasa(asesoresDe.get(f.id)));
    return ordenarPersonas(filtrarPersonas(base, buscar), orden);
  }, [filas, ver, buscar, conConsulta, conConsultaAbierta, orden, loLleva, asesoresDe]);

  const grupos = useMemo(() => ORDEN_TIPOS.map((t) => ({ tipo: t, filas: visibles.filter((f) => f.tipo === t) })).filter((g) => g.filas.length), [visibles]);

  return (
    <div className="pn-pagina" style={{ maxWidth: 760 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <h1 className="pn-h1">Personas</h1>
        <Boton variante="secundario" onClick={() => setCreando(true)} aria-keyshortcuts="N">Nueva persona</Boton>
      </div>
      <p className="pn-sub">{cargando ? "Cargando…" : `${cuentas.todas} ${cuentas.todas === 1 ? "persona" : "personas"}`}</p>
      <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
        <Campo etiqueta="Buscar" placeholder="Nombre, teléfono o correo" value={buscar} onChange={(e) => setBuscar(e.target.value)} type="search" autoComplete="off" />
        <Segmentado
          etiqueta="Ver"
          valor={ver}
          alElegir={setVer}
          opciones={[{ valor: "todas", etiqueta: "Todas", cuenta: cuentas.todas }, { valor: "propietario", etiqueta: "Propietarios", cuenta: cuentas.propietario }, { valor: "sin_contacto", etiqueta: "Sin datos de contacto", cuenta: cuentas.sin_contacto }]}
        />
        {loLleva.control}
        <div>
          <FiltrarYOrdenar
            orden={orden}
            ordenes={[{ valor: "nombre", etiqueta: "Nombre" }, { valor: "recientes", etiqueta: "Las más recientes primero" }]}
            alOrdenar={setOrden}
            interruptores={[{ etiqueta: "Solo con consultas abiertas", ayuda: "Por atender o en seguimiento", valor: conConsulta, alCambiar: setConConsulta }]}
            resultado={visibles.length}
            nombreResultado={["persona", "personas"]}
            alQuitar={() => { setOrden("nombre"); setConConsulta(false); }}
          />
        </div>
      </div>
      <div style={{ display: "grid", gap: 20, marginTop: 20 }}>
        {cargando ? <Cargando lineas={5} etiqueta="Cargando personas" /> : null}
        {error ? <EstadoError texto={error} alReintentar={reintentar} /> : null}
        {!cargando && !error && cuentas.todas === 0 ? <Vacio titulo="Todavía no hay personas" texto="Cuando entre una consulta o se dé de alta una persona, aparece aquí." icono="cliente" accion={<Boton onClick={() => setCreando(true)}>Nueva persona</Boton>} /> : null}
        {!cargando && !error && cuentas.todas > 0 && visibles.length === 0 ? <Vacio titulo="Nada coincide" texto="Prueba con otra palabra o quita el filtro." icono="buscar" /> : null}
        {grupos.map((g) => (
          <GrupoLista key={g.tipo} titulo={g.filas.length > 1 ? PLURAL_TIPO_PERSONA[g.tipo] : NOMBRE_TIPO_PERSONA[g.tipo]}>
            {g.filas.map((f: FilaPersona) => (
              <Fila
                key={f.id}
                izquierda={<Avatar nombre={f.nombre} />}
                titulo={f.nombre}
                subtitulo={f.subtitulo}
                detalle={f.sinContacto ? "Sin teléfono ni correo" : f.contacto}
                tonoDetalle={f.sinContacto ? "aviso" : "normal"}
                alPulsar={() => abrir(f.id)}
                seleccionada={f.id === abiertaId}
                acciones={<MenuFila nombre={f.nombre} telefono={telefonoDe.get(f.id)} ruta={rutaPersona(f.id)} />}
              />
            ))}
          </GrupoLista>
        ))}
      </div>
      <HojaAdaptable abierta={abierta !== null} titulo={abierta?.nombre?.trim() || "Sin nombre"} alCerrar={() => cerrar()}>
        {abierta ? <DetallePersona persona={abierta} personas={datos} guardar={guardar} alAbrirPersona={(id) => abrir(id)} /> : null}
      </HojaAdaptable>
      <HojaAdaptable abierta={creando} titulo="Nueva persona" descripcion="Lo mínimo para darle seguimiento. Lo demás se completa después." alCerrar={() => setCreando(false)}>
        {creando ? (
          <FormularioPersona
            personas={datos}
            hoy={ahora}
            ocupado={ocupado}
            alGuardar={(d) => void crear(d)}
            alAbrirExistente={(id) => { setCreando(false); abrir(id); }}
          />
        ) : null}
      </HojaAdaptable>
    </div>
  );
}

/** useSearchParams pide un límite de Suspense; el esqueleto es el mismo de la carga. */
export default function PaginaPersonas() {
  return <Suspense fallback={<div className="pn-pagina"><Cargando lineas={5} etiqueta="Cargando" /></div>}><Personas /></Suspense>;
}
