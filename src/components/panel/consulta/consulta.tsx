"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import "../asunto/asunto.css";
import "./consulta.css";
import { enlaceWhatsApp } from "@/components/panel/asunto/comun";
import { Cuadro } from "@/components/panel/asunto/pildora";
import { useCatalogos } from "@/components/panel/datos/catalogos";
import { Icono, type NombreIcono } from "@/components/panel/icons";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Boton, BotonEnlace } from "@/components/panel/kit/boton";
import { Campo, CampoTelefono } from "@/components/panel/kit/campo";
import { CampoFecha } from "@/components/panel/kit/campo-fecha";
import { Desplegable } from "@/components/panel/kit/desplegable";
import { BotonDictar, sumarDictado } from "@/components/panel/kit/dictar";
import { Etiqueta } from "@/components/panel/kit/etiqueta";
import { Plegable, Propiedad } from "@/components/panel/kit/propiedad";
import { SeleccionMultiple } from "@/components/panel/kit/seleccion-multiple";
import { Checkbox } from "@/components/panel/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/panel/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/panel/ui/dropdown-menu";
import { Seleccion } from "@/components/panel/ui/select";
import {
  FalloPanel, haceCuanto, iconoEncargo, iniciales, sumarDias, type Papel,
} from "@/lib/panel/asuntos/api";
import {
  DEBE, DE_QUIEN, NOMBRE_DEBE, NOMBRE_DE_QUIEN, NOMBRE_OCUPA, NOMBRE_QUIERE, NOMBRE_SI_NO,
  OCUPA, QUIERE, SI_NO,
  abrirAsuntoDe, adjuntar, cambiarDocumentoDeArchivo, cerrarComoContacto, cerrarNoProcede, coincidenciasDe, empezarConsulta, encargosSegun, guardarConsulta,
  leerAbiertas, leerConsulta, mensajeParaPedir, quitarAdjunto, unirDocumentos,
  type Canal, type Carga, type Coincidencia, type Consulta, type ConsultaAbierta, type DatosConsulta, type DocumentoPedir, type OtraPersona,
} from "@/lib/panel/consulta/api";

import { FichaParecida, eleccionVigente, guardarEleccion, leerEleccion, type Eleccion } from "./ficha-parecida";

/**
 * La consulta (SPEC.md, sección 4; boceto «Consulta en vivo»): se llena mientras se habla, se guarda sola y,
 * al terminar, abre el asunto con su persona, su inmueble, su lista de documentos y su primer plan.
 * Si se corta la llamada o la conexión, lo capturado queda en este equipo y se vuelve a mandar.
 */

type Borrador = {
  quien_nombre: string; pais: string; numero: string; canal: Canal; que_pasa: string;
  datos: DatosConsulta; otras_personas: OtraPersona[]; documentos_pedir: DocumentoPedir[];
};
type Estado = "vacia" | "guardando" | "guardada" | "sin_conexion" | "error";

const LLAVE = "fortius-panel-consulta";
const VACIO: Borrador = {
  quien_nombre: "", pais: "+52", numero: "", canal: "llamada", que_pasa: "", datos: {}, otras_personas: [],
  documentos_pedir: unirDocumentos({}, []),
};
const tieneAlgo = (b: Borrador) =>
  Boolean(b.quien_nombre.trim() || b.numero.trim() || b.que_pasa.trim() || Object.keys(b.datos).length || b.otras_personas.length);
/** Lo que está guardado en el servidor, como borrador de la pantalla. */
function borradorDe(c: Consulta): Borrador {
  const tel = c.quien_telefonos[0];
  return {
    quien_nombre: c.quien_nombre, pais: tel?.pais ?? "+52", numero: tel?.numero ?? "", canal: c.canal, que_pasa: c.que_pasa,
    datos: c.datos ?? {}, otras_personas: c.otras_personas ?? [], documentos_pedir: unirDocumentos(c.datos ?? {}, c.documentos_pedir ?? []),
  };
}
/** Con qué se buscan fichas parecidas: si cambia lo guardado de quien llama, se vuelve a buscar. */
const claveQuien = (b: Borrador) =>
  b.quien_nombre.trim() || b.numero.trim() ? `${b.quien_nombre.trim().toLowerCase()}|${b.pais.trim()}${b.numero.replace(/\D/g, "")}` : "";

type Respaldo = { id: string | null; version: number | null; borrador: Borrador };
function leerRespaldo(): Respaldo | null {
  try { const t = localStorage.getItem(LLAVE); return t ? (JSON.parse(t) as Respaldo) : null; } catch { return null; }
}
function guardarRespaldo(r: Respaldo | null) {
  try { if (r) localStorage.setItem(LLAVE, JSON.stringify(r)); else localStorage.removeItem(LLAVE); } catch { /* sin almacenamiento: sigue en pantalla */ }
}

const ops = <T extends string>(lista: readonly T[], nombres: Record<T, string>) => lista.map((v) => ({ valor: v, etiqueta: nombres[v] }));

export function PantallaConsulta() {
  const router = useRouter();
  const params = useSearchParams();
  const { avisar } = useAvisos();
  const cat = useCatalogos();

  const [b, setB] = useState<Borrador>(VACIO);
  const [cargas, setCargas] = useState<Carga[]>([]);
  const [estado, setEstado] = useState<Estado>("vacia");
  const [cargando, setCargando] = useState(true);
  const [cerrada, setCerrada] = useState<string | null>(null);
  const [abiertas, setAbiertas] = useState<ConsultaAbierta[]>([]);
  const [mensaje, setMensaje] = useState<{ texto: string; canal: CanalMensaje } | null>(null);
  const [dialogo, setDialogo] = useState<"contacto" | "no_procede" | null>(null);
  const [abriendo, setAbriendo] = useState(false);
  const [subiendo, setSubiendo] = useState(0);
  // Persona repetida: lo último guardado de quien llama, las fichas que se le parecen y lo que se eligió.
  const [claveGuardada, setClaveGuardada] = useState("");
  const [parecidas, setParecidas] = useState<Coincidencia[]>([]);
  const [eleccion, setEleccion] = useState<Eleccion | null>(null);
  /** La ficha del Directorio con que empezó la consulta (se abrió desde una persona); null si no tiene. */
  const [fichaInicial, setFichaInicial] = useState<string | null>(null);

  const bRef = useRef(b);
  const idRef = useRef<string | null>(null);
  const versionRef = useRef<number | null>(null);
  const sucioRef = useRef(false);
  const vueloRef = useRef<Promise<void> | null>(null);
  const relojRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listoRef = useRef(false);
  const falloRef = useRef(false);
  const guardarRef = useRef<() => Promise<void>>(async () => {});
  /** Al poner en pantalla lo que se acaba de leer del servidor, no se vuelve a mandar. */
  const sinGuardarRef = useRef(false);

  // ── Guardar ─────────────────────────────────────────────────────────────────────────────────────────
  const guardar = useCallback(async (): Promise<void> => {
    if (vueloRef.current) { await vueloRef.current; if (!sucioRef.current) return; }
    if (!sucioRef.current) return;
    const vuelo = (async () => {
      sucioRef.current = false;
      const actual = bRef.current;
      setEstado("guardando");
      try {
        if (!idRef.current) {
          const nueva = await empezarConsulta({});
          idRef.current = nueva.id;
          versionRef.current = nueva.version;
          router.replace(`/panel/consulta?id=${nueva.id}`, { scroll: false });
        }
        const r = await guardarConsulta(idRef.current, versionRef.current ?? 1, {
          quien_nombre: actual.quien_nombre,
          quien_telefonos: actual.numero.trim() ? [{ pais: actual.pais, numero: actual.numero }] : [],
          canal: actual.canal, que_pasa: actual.que_pasa, datos: actual.datos,
          otras_personas: actual.otras_personas, documentos_pedir: actual.documentos_pedir,
        });
        versionRef.current = r.version;
        guardarRespaldo({ id: idRef.current, version: r.version, borrador: bRef.current });
        falloRef.current = false;
        setClaveGuardada(claveQuien(actual));
        setEstado(sucioRef.current ? "guardando" : "guardada");
      } catch (e) {
        sucioRef.current = true;
        falloRef.current = true;
        if (e instanceof FalloPanel && e.estado === 0) setEstado("sin_conexion");
        else { setEstado("error"); avisar(e instanceof Error ? e.message : "No se pudo guardar"); }
      }
    })();
    vueloRef.current = vuelo;
    await vuelo;
    vueloRef.current = null;
    // Lo que se escribió mientras se guardaba sale enseguida; tras un fallo, espera al siguiente cambio o a la conexión.
    if (sucioRef.current && !falloRef.current) void guardarRef.current();
  }, [avisar, router]);
  useEffect(() => { guardarRef.current = guardar; }, [guardar]);

  /** Cada cambio: respaldo local al instante y guardado en el servidor al dejar de escribir. */
  const cambiar = useCallback((f: (x: Borrador) => Borrador) => {
    setB((antes) => {
      const nuevo = f(antes);
      bRef.current = nuevo;
      return nuevo;
    });
  }, []);
  function marcarRecibido(nombre: string, si: boolean) {
    cambiar((y) => ({ ...y, documentos_pedir: y.documentos_pedir.map((z) => (z.nombre === nombre ? { ...z, recibido: si } : z)) }));
  }
  useEffect(() => {
    if (!listoRef.current) return;
    if (sinGuardarRef.current) { sinGuardarRef.current = false; return; }
    if (!tieneAlgo(b) && !idRef.current) return;
    sucioRef.current = true;
    guardarRespaldo({ id: idRef.current, version: versionRef.current, borrador: b });
    if (relojRef.current) clearTimeout(relojRef.current);
    relojRef.current = setTimeout(() => { void guardar(); }, 700);
  }, [b, guardar]);

  // Al volver la conexión, se manda lo pendiente.
  useEffect(() => {
    const alVolver = () => { if (sucioRef.current) void guardar(); };
    window.addEventListener("online", alVolver);
    return () => window.removeEventListener("online", alVolver);
  }, [guardar]);

  // ── Cargar ──────────────────────────────────────────────────────────────────────────────────────────
  const idUrl = params.get("id");
  useEffect(() => {
    // La dirección cambia sola al crearse la consulta: no se vuelve a cargar lo que ya está en pantalla.
    if (idUrl && idUrl === idRef.current) return;
    let vivo = true;
    (async () => {
      const respaldo = leerRespaldo();
      const elegido = idUrl;
      if (elegido) {
        try {
          const c = await leerConsulta(elegido);
          if (!vivo) return;
          idRef.current = c.id;
          versionRef.current = c.version;
          setFichaInicial(c.persona_id);
          const delServidor = borradorDe(c);
          // Si en este equipo quedó algo sin mandar de esta misma consulta, gana lo de aquí.
          const local = respaldo?.id === c.id && respaldo.version === c.version ? respaldo.borrador : null;
          const usar = local ?? delServidor;
          bRef.current = usar;
          setB(usar);
          setCargas(c.cargas);
          setClaveGuardada(claveQuien(delServidor));
          setEleccion(leerEleccion(c.id));
          if (c.estado !== "abierta") setCerrada(c.estado === "asunto" && c.asunto_id ? c.asunto_id : c.estado);
          setEstado("guardada");
          if (local && JSON.stringify(local) !== JSON.stringify(delServidor)) sucioRef.current = true;
        } catch (e) {
          if (!vivo) return;
          if (respaldo?.id === elegido) { bRef.current = respaldo.borrador; setB(respaldo.borrador); idRef.current = elegido; versionRef.current = respaldo.version; setEstado("sin_conexion"); sucioRef.current = true; }
          else avisar(e instanceof Error ? e.message : "No se pudo abrir la consulta");
        }
      } else if (respaldo && !respaldo.id && tieneAlgo(respaldo.borrador)) {
        // Se cortó antes de llegar al servidor: se recupera de este equipo.
        bRef.current = respaldo.borrador;
        setB(respaldo.borrador);
        sucioRef.current = true;
        avisar("Recuperé la consulta que se quedó a medias");
      }
      if (!vivo) return;
      setCargando(false);
      listoRef.current = true;
      if (sucioRef.current) void guardar();
      leerAbiertas().then((l) => { if (vivo) setAbiertas(l); }).catch(() => {});
    })();
    return () => { vivo = false; };
  }, [idUrl, avisar, guardar]);

  // Las fichas parecidas se buscan con lo GUARDADO (no en cada tecla): al guardarse otro nombre o teléfono.
  useEffect(() => {
    const id = idRef.current;
    if (!id || !claveGuardada) return;
    let vivo = true;
    coincidenciasDe(id).then((l) => { if (vivo) setParecidas(l); }).catch(() => { /* sin aviso: no impide seguir */ });
    return () => { vivo = false; };
  }, [claveGuardada]);

  // ── Derivados ───────────────────────────────────────────────────────────────────────────────────────
  const fichas = claveGuardada ? parecidas : [];
  const elegir = (e: Eleccion | null) => { setEleccion(e); guardarEleccion(idRef.current, e); };
  const d = b.datos;
  const encargos = useMemo(() => encargosSegun(d), [d]);
  const pedidos = b.documentos_pedir.filter((x) => !x.quitado);
  const quitados = b.documentos_pedir.filter((x) => x.quitado);
  const faltan = pedidos.filter((x) => !recibido(x));
  const recibidos = pedidos.length - faltan.length;
  const nombresPedidos = new Set(pedidos.map((x) => x.nombre));
  const sueltos = cargas.filter((c) => !docDeCarga(c) || !nombresPedidos.has(docDeCarga(c) as string));
  const otrasSinTerminar = abiertas.filter((a) => a.id !== idUrl);

  const ponDato = <K extends keyof DatosConsulta>(k: K, v: DatosConsulta[K] | "") =>
    cambiar((x) => {
      const datos = { ...x.datos };
      if (v === "" || v === undefined || (Array.isArray(v) && v.length === 0)) delete datos[k];
      else datos[k] = v as DatosConsulta[K];
      return { ...x, datos, documentos_pedir: unirDocumentos(datos, x.documentos_pedir) };
    });

  // ── Acciones ────────────────────────────────────────────────────────────────────────────────────────
  async function asegurarGuardada(): Promise<boolean> {
    if (relojRef.current) clearTimeout(relojRef.current);
    if (!idRef.current) sucioRef.current = true;
    for (let i = 0; i < 3 && (sucioRef.current || vueloRef.current); i++) await guardar();
    return Boolean(idRef.current) && !sucioRef.current;
  }

  /** Trae lo vigente del servidor tras un fallo al abrir. Si hay algo sin mandar, no lo pisa: eso sale con su guardado. */
  async function releer(): Promise<boolean> {
    const id = idRef.current;
    if (!id || sucioRef.current || vueloRef.current) return false;
    try {
      const c = await leerConsulta(id);
      if (idRef.current !== id || sucioRef.current) return false;
      versionRef.current = c.version;
      setFichaInicial(c.persona_id);
      const usar = borradorDe(c);
      if (JSON.stringify(usar) !== JSON.stringify(bRef.current)) { sinGuardarRef.current = true; bRef.current = usar; setB(usar); }
      setCargas(c.cargas);
      setClaveGuardada(claveQuien(usar));
      guardarRespaldo({ id, version: c.version, borrador: usar });
      if (c.estado !== "abierta") { setCerrada(c.estado === "asunto" && c.asunto_id ? c.asunto_id : c.estado); return false; }
      return true;
    } catch { return false; /* sigue como estaba; el siguiente intento vuelve a leer */ }
  }

  async function abrir() {
    if (abriendo) return;
    setAbriendo(true);
    try {
      if (!(await asegurarGuardada())) { avisar("Aún no se guarda la consulta. Revisa la conexión y vuelve a intentar."); return; }
      // Si se eligió en el aviso de persona repetida, va esa ficha. «Es otra persona» manda null (ficha nueva) solo si la
      // consulta no empezó desde una ficha; si empezó desde una, no manda nada y se conserva esa, sin duplicarla.
      const vigente = eleccionVigente(eleccion, fichas);
      const personaId = !vigente ? undefined : vigente.ficha ?? (fichaInicial ? undefined : null);
      const a = await abrirAsuntoDe(idRef.current as string, versionRef.current ?? 1, personaId);
      guardarEleccion(idRef.current, null);
      guardarRespaldo(null);
      avisar("Asunto abierto con su persona, su inmueble y su lista");
      router.push(`/panel/asuntos/${a.id}`);
    } catch (e) {
      // Se vuelve a leer la consulta (su versión vigente) para que el siguiente intento no choque otra vez.
      const alDia = await releer();
      if (alDia && e instanceof FalloPanel && e.estado === 409) avisar("La consulta cambió en otra ventana. Ya está al día: revísala y vuelve a abrir el asunto.");
      else avisar(e instanceof Error ? e.message : "No se pudo abrir el asunto");
    } finally {
      setAbriendo(false);
    }
  }

  async function cerrarComo(como: "contacto" | "no_procede", valor: string) {
    try {
      if (!(await asegurarGuardada())) { avisar("Aún no se guarda la consulta. Revisa la conexión y vuelve a intentar."); return; }
      if (como === "contacto") {
        await cerrarComoContacto(idRef.current as string, versionRef.current ?? 1, valor);
        avisar("Queda en el Directorio con fecha para volver a llamarle");
      } else {
        await cerrarNoProcede(idRef.current as string, versionRef.current ?? 1, valor);
        avisar("Consulta cerrada: no procede");
      }
      guardarRespaldo(null);
      router.push("/panel");
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se pudo cerrar la consulta");
    }
  }

  /** Sube archivos sueltos o, con `documento`, los liga a ese documento pedido y lo marca como recibido. */
  async function subir(archivos: File[], documento?: string) {
    if (!archivos.length) return;
    if (!(await asegurarGuardada())) { avisar("Aún no se guarda la consulta. Revisa la conexión y vuelve a intentar."); return; }
    setSubiendo((n) => n + archivos.length);
    for (const archivo of archivos) {
      try {
        const c = await adjuntar(idRef.current as string, archivo, documento);
        setCargas((x) => [...x, documento ? { ...c, documento } : c]);
        if (documento) marcarRecibido(documento, true);
      } catch (e) {
        avisar(`${archivo.name}: ${e instanceof Error ? e.message : "no se pudo subir"}`);
      } finally {
        setSubiendo((n) => n - 1);
      }
    }
  }

  async function quitarArchivo(c: Carga) {
    try {
      await quitarAdjunto(idRef.current as string, c.id);
      setCargas((x) => x.filter((y) => y.id !== c.id));
      // Si era el único archivo de su documento, el documento vuelve a faltar; «Deshacer» lo deja marcado sin archivo.
      const doc = docDeCarga(c);
      if (doc && !cargas.some((y) => y.id !== c.id && docDeCarga(y) === doc)) {
        marcarRecibido(doc, false);
        avisar(`Archivo quitado: «${doc}» vuelve a faltar`, { etiqueta: "Deshacer", alAccionar: () => marcarRecibido(doc, true) });
      } else {
        avisar("Archivo quitado");
      }
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se pudo quitar");
    }
  }

  /** Liga un archivo suelto a un documento pedido (o lo suelta con null). Ligarlo marca el documento como recibido. */
  async function ligarArchivo(c: Carga, documento: string | null) {
    try {
      const nueva = await cambiarDocumentoDeArchivo(idRef.current as string, c.id, documento);
      setCargas((x) => x.map((y) => (y.id === c.id ? { ...y, ...nueva, documento: documento ?? undefined } : y)));
      if (documento) marcarRecibido(documento, true);
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se pudo cambiar");
    }
  }

  // Ctrl+Enter (⌘+Enter en Mac) abre el asunto desde cualquier campo, sin soltar el teclado.
  const abrirRef = useRef<() => void>(() => {});
  useEffect(() => { abrirRef.current = () => { if (!cargando && !cerrada) void abrir(); }; });
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); abrirRef.current(); } };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, []);

  function nuevaConsulta() {
    guardarRespaldo(null);
    idRef.current = null; versionRef.current = null; sucioRef.current = false; setFichaInicial(null);
    bRef.current = VACIO;
    setB(VACIO); setCargas([]); setCerrada(null); setEstado("vacia");
    setClaveGuardada(""); setParecidas([]); setEleccion(null);
    router.replace("/panel/consulta", { scroll: false });
  }

  // ── Pantalla ────────────────────────────────────────────────────────────────────────────────────────
  if (cargando) return <div className="cs-in"><p className="as-m as-cargando">Abriendo la consulta…</p></div>;

  if (cerrada) {
    const esAsunto = cerrada !== "contacto" && cerrada !== "no_procede";
    return (
      <div className="cs-in">
        <div className="as-card as-pad as-vacio">
          <Cuadro icono={esAsunto ? "asu" : "ok"} color={esAsunto ? "blue" : "gray"} />
          <p><b>{esAsunto ? "Esta consulta ya abrió su asunto." : cerrada === "contacto" ? "Esta consulta quedó como contacto." : "Esta consulta se cerró: no procede."}</b></p>
          <div className="as-fila">
            {esAsunto ? <BotonEnlace variante="primario" href={`/panel/asuntos/${cerrada}`}>Ir al asunto</BotonEnlace> : null}
            <Boton variante="normal" icono="mas" onClick={nuevaConsulta}>Nueva consulta</Boton>
          </div>
        </div>
      </div>
    );
  }

  const textoEstado: Record<Estado, string> = {
    vacia: "Se guarda sola", guardando: "Guardando…", guardada: "Guardada", sin_conexion: "Sin conexión: guardada en este equipo", error: "No se guardó",
  };

  const malEstado = estado === "sin_conexion" || estado === "error";
  const contestadas = [d.que_quiere, d.de_quien, d.tipo, d.colonia, d.ocupa, d.escritura, d.debe?.length ? "si" : undefined].filter(Boolean).length;
  // Lo agregado a mano se borra; lo que pide la regla queda quitado (se recuerda por nombre) y se puede volver a pedir.
  const quitarDoc = (nombre: string) => cambiar((y) => ({
    ...y, documentos_pedir: y.documentos_pedir.flatMap((z) => (z.nombre !== nombre ? [z] : z.propio ? [] : [{ ...z, quitado: true }])),
  }));
  const volverAPedir = (nombre: string) => cambiar((y) => ({ ...y, documentos_pedir: y.documentos_pedir.map((z) => (z.nombre === nombre ? { ...z, quitado: false } : z)) }));

  return (
    <div className="cs-in">
      {/* Barra fija: cerrar, cómo va el guardado y la única acción azul («Abrir asunto»). Ctrl+Enter también abre. */}
      <header className="cs-barra">
        <BotonEnlace href="/panel" variante="fantasma" soloIcono icono="x" aria-label="Cerrar la consulta" title="Cerrar (queda guardada)" />
        <h1 className="cs-h1">Consulta</h1>
        <span className="cs-estado" data-mal={malEstado || undefined} role="status"><i aria-hidden /><span className="cs-estado-t">{textoEstado[estado]}</span></span>
        <span className="as-sp" />
        {otrasSinTerminar.length ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="pn-btn pn-btn-fantasma cs-otras" title="Consultas sin terminar">
              <Icono nombre="reloj" tamano={16} aria-hidden /><span className="cs-ocultar-tel">Sin terminar</span><span className="cs-num">{otrasSinTerminar.length}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Seguir con…</DropdownMenuLabel>
              {otrasSinTerminar.map((a) => (
                <DropdownMenuItem key={a.id} onSelect={() => { guardarRespaldo(null); router.push(`/panel/consulta?id=${a.id}`); }}>
                  <Icono nombre="tel" tamano={16} />
                  <span className="cs-sin">{a.quien_nombre.trim() || "Sin nombre"}<span className="as-m">{haceCuanto(a.updated_at)}</span></span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
        <DropdownMenu>
          <DropdownMenuTrigger className="pn-btn pn-btn-fantasma" aria-label="Cerrar sin asunto">
            <span className="cs-ocultar-tel">Cerrar sin asunto</span><Icono nombre="down" tamano={14} aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setDialogo("contacto")}><Icono nombre="users" tamano={16} />Guardar como contacto</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setDialogo("no_procede")}><Icono nombre="x" tamano={16} />No procede</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Boton variante="primario" icono="ok" className="cs-abrir" onClick={() => void abrir()} deshabilitado={abriendo} title="Abrir asunto (Ctrl + Enter)">
          {abriendo ? "Abriendo…" : "Abrir asunto"}<kbd className="cs-atajo" aria-hidden>Ctrl ↩</kbd>
        </Boton>
      </header>

      <div className="cs-dos">
        {/* La hoja: quién llama y qué pasa al frente, luego las preguntas como renglones «dato: valor». */}
        <section className="pn-superficie cs-hoja" aria-label="Consulta">
          {/* «Quién llama» con su rótulo chico arriba (modelo visual); un nombre completo cabe sin cortarse (hallazgo 7). */}
          <label htmlFor="cs-quien" className="cs-rotulo">Quién llama</label>
          <textarea id="cs-quien" className="cs-quien" rows={1} value={b.quien_nombre} maxLength={160} autoFocus autoComplete="off" placeholder="Nombre de quien llama"
            onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
            onChange={(e) => cambiar((x) => ({ ...x, quien_nombre: e.target.value.replace(/\s*\n\s*/g, " ") }))} />
          <div className="pn-props cs-contacto">
            <Propiedad icono="tel" etiqueta="Teléfono">
              {(id) => (
                <span className="pn-tel">
                  <input className="pn-control" aria-label="Clave del país" value={b.pais} maxLength={5} inputMode="tel" autoComplete="off" onChange={(e) => cambiar((x) => ({ ...x, pais: e.target.value }))} />
                  <input id={id} className="pn-control" inputMode="tel" value={b.numero} maxLength={30} autoComplete="off" placeholder="Número" onChange={(e) => cambiar((x) => ({ ...x, numero: e.target.value }))} />
                </span>
              )}
            </Propiedad>
            <Propiedad icono="globo" etiqueta="Por dónde">
              {(id) => <Seleccion id={id} valor={b.canal} opciones={cat.opciones("fuente", b.canal)} alElegir={(v) => cambiar((x) => ({ ...x, canal: (v || "llamada") as Canal }))} />}
            </Propiedad>
          </div>
          <FichaParecida fichas={fichas} eleccion={eleccion} alElegir={elegir} conFicha={Boolean(fichaInicial)} />

          <div className="cs-que-bloque">
            <div className="pn-bloque-t">
              <label htmlFor="cs-que">Qué pasa</label>
              <span className="as-sp" />
              <BotonDictar que="qué pasa" alDictar={(t) => cambiar((x) => ({ ...x, que_pasa: sumarDictado(x.que_pasa, t) }))} alFallar={avisar} />
            </div>
            <textarea id="cs-que" className="cs-que" value={b.que_pasa} maxLength={20000} placeholder="Como te lo cuenta…"
              onChange={(e) => cambiar((x) => ({ ...x, que_pasa: e.target.value }))} />
          </div>

          <div className="cs-preguntas">
            <div className="pn-bloque-t"><Icono nombre="lista" tamano={15} aria-hidden />Preguntas<span className="pn-cuenta">· {contestadas} de 7</span><span className="as-sp" /><kbd className="pn-kbd cs-tab" aria-hidden title="Tab pasa a la siguiente pregunta">Tab</kbd></div>
            <div className="pn-props">
              <Propiedad icono="rayo" etiqueta="Qué quiere">
                {(id) => <Seleccion id={id} valor={d.que_quiere ?? ""} vacio="Sin decir" opciones={ops(QUIERE, NOMBRE_QUIERE)} alElegir={(v) => ponDato("que_quiere", v as typeof QUIERE[number] | "")} />}
              </Propiedad>
              <Propiedad icono="users" etiqueta="De quién es">
                {(id) => <Seleccion id={id} valor={d.de_quien ?? ""} vacio="Sin decir" opciones={ops(DE_QUIEN, NOMBRE_DE_QUIEN)} alElegir={(v) => ponDato("de_quien", v as typeof DE_QUIEN[number] | "")} />}
              </Propiedad>
              <Propiedad icono="casa" etiqueta="Qué es">
                {(id) => <Seleccion id={id} valor={d.tipo ?? ""} vacio="Sin decir" opciones={cat.opciones("tipo_inmueble", d.tipo)} alElegir={(v) => ponDato("tipo", v)} />}
              </Propiedad>
              <Propiedad icono="pin" etiqueta="Colonia">
                {(id) => <input id={id} className="pn-control" value={d.colonia ?? ""} maxLength={120} autoComplete="off" placeholder="Sin decir" onChange={(e) => ponDato("colonia", e.target.value)} />}
              </Propiedad>
              <Propiedad icono="llave" etiqueta="Quién lo ocupa">
                {(id) => <Seleccion id={id} valor={d.ocupa ?? ""} vacio="Sin decir" opciones={ops(OCUPA, NOMBRE_OCUPA)} alElegir={(v) => ponDato("ocupa", v as typeof OCUPA[number] | "")} />}
              </Propiedad>
              <Propiedad icono="sello" etiqueta="Escritura">
                {(id) => <Seleccion id={id} valor={d.escritura ?? ""} vacio="Sin decir" opciones={ops(SI_NO, NOMBRE_SI_NO)} alElegir={(v) => ponDato("escritura", v as typeof SI_NO[number] | "")} />}
              </Propiedad>
              <Propiedad icono="pago" etiqueta="Qué debe" sinEnlace>
                {() => <SeleccionMultiple etiqueta="Qué debe" sinEtiqueta valor={d.debe ?? []} opciones={ops(DEBE, NOMBRE_DEBE)} exclusivas={["nada", "no_sabe"]} alCambiar={(v) => ponDato("debe", v)} />}
              </Propiedad>
            </div>
          </div>

          <p className="cs-para">
            <Icono nombre="asu" tamano={15} aria-hidden />
            <span>Se abre para</span>
            {encargos.map((e) => <Etiqueta key={e} icono={iconoEncargo(e)[0]}>{cat.etiqueta("encargo", e)}</Etiqueta>)}
            {!encargos.length ? <span>lo que se decida en el asunto</span> : null}
          </p>
        </section>

        {/* Lo de apoyo, plegado con su resumen: se abre cuando hace falta. */}
        <aside className="cs-lado" aria-label="Para el asunto">
          {/* Documentos como checklist: marcado = ya lo mandó. Adjuntar en el renglón lo marca solo. */}
          <Plegable icono="file" titulo="Documentos" llave="consulta-pedir" abiertoAlEmpezar
            resumen={subiendo ? `Subiendo ${subiendo}…` : pedidos.length ? `${recibidos} de ${pedidos.length} recibidos` : sueltos.length ? `${sueltos.length} ${sueltos.length === 1 ? "archivo" : "archivos"}` : "Nada"}>
            <ul className="cs-docs">
              {pedidos.map((x) => {
                const suyos = cargas.filter((c) => docDeCarga(c) === x.nombre);
                return (
                  <li key={x.nombre} className="cs-doc" data-recibido={recibido(x) || undefined}>
                    <Checkbox checked={recibido(x)} aria-label={`Ya mandó: ${x.nombre}`} onCheckedChange={(v) => marcarRecibido(x.nombre, v === true)} />
                    <span className="cs-doc-n">
                      <span className="cs-doc-t">{x.nombre}</span>
                      {suyos.map((c) => (
                        <span key={c.id} className="cs-arch">
                          <Icono nombre={c.mime === "application/pdf" ? "pdf" : "img"} tamano={14} aria-hidden />
                          <span className="cs-arch-n">{c.nombre_original}</span>
                          <button type="button" className="cs-arch-x" aria-label={`Quitar el archivo ${c.nombre_original}`} onClick={() => void quitarArchivo(c)}>
                            <Icono nombre="x" tamano={13} aria-hidden />
                          </button>
                        </span>
                      ))}
                    </span>
                    <label className="pn-btn pn-btn-fantasma pn-btn-icono cs-doc-acc" title={`Adjuntar ${x.nombre}`}>
                      <Icono nombre="subir" tamano={16} aria-hidden />
                      <input type="file" multiple accept="application/pdf,image/jpeg,image/png,image/webp" className="sr-only" aria-label={`Adjuntar ${x.nombre}`}
                        onChange={(e) => { const lista = [...(e.target.files ?? [])]; e.target.value = ""; void subir(lista, x.nombre); }} />
                    </label>
                    <Boton variante="fantasma" soloIcono icono="x" className="cs-doc-acc" aria-label={`Quitar ${x.nombre} de la lista`} onClick={() => quitarDoc(x.nombre)} />
                  </li>
                );
              })}
              {sueltos.map((c) => (
                <li key={c.id} className="cs-doc" data-recibido>
                  <Icono nombre={c.mime === "application/pdf" ? "pdf" : "img"} tamano={17} aria-hidden className="cs-doc-ic" />
                  <span className="cs-doc-n"><span className="cs-doc-t">{c.nombre_original}</span></span>
                  {faltan.length ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger className="pn-btn pn-btn-fantasma pn-btn-icono cs-doc-acc" aria-label={`Qué documento es ${c.nombre_original}`} title="Qué documento es">
                        <Icono nombre="liga" tamano={16} aria-hidden />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Es…</DropdownMenuLabel>
                        {faltan.map((x) => (
                          <DropdownMenuItem key={x.nombre} onSelect={() => void ligarArchivo(c, x.nombre)}><Icono nombre="file" tamano={16} />{x.nombre}</DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                  <Boton variante="fantasma" soloIcono icono="x" className="cs-doc-acc" aria-label={`Quitar el archivo ${c.nombre_original}`} onClick={() => void quitarArchivo(c)} />
                </li>
              ))}
            </ul>
            <AgregarRenglon etiqueta="Otro documento" alAgregar={(nombre) => cambiar((y) => {
              const ya = y.documentos_pedir.find((z) => z.nombre.toLowerCase() === nombre.toLowerCase());
              if (ya) return ya.quitado ? { ...y, documentos_pedir: y.documentos_pedir.map((z) => (z === ya ? { ...z, quitado: false } : z)) } : y;
              return { ...y, documentos_pedir: [...y.documentos_pedir, { nombre, grupo: "otro", entrega_papel: "cliente", propio: true }] };
            })} />
            <label className="cs-agregar cs-otro-arch">
              <Icono nombre="subir" tamano={15} aria-hidden />
              <span>{subiendo ? `Subiendo ${subiendo}…` : "Otro archivo"}</span>
              <input type="file" multiple accept="application/pdf,image/jpeg,image/png,image/webp" className="sr-only" aria-label="Adjuntar otro archivo"
                onChange={(e) => { const lista = [...(e.target.files ?? [])]; e.target.value = ""; void subir(lista); }} />
            </label>
            {quitados.length ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="cs-quitados">
                  {quitados.length} {quitados.length === 1 ? "quitado" : "quitados"}<Icono nombre="down" tamano={14} aria-hidden />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuLabel>Volver a pedir</DropdownMenuLabel>
                  {quitados.map((x) => (
                    <DropdownMenuItem key={x.nombre} onSelect={() => volverAPedir(x.nombre)}><Icono nombre="ciclo" tamano={16} />{x.nombre}</DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
            <DropdownMenu>
              <DropdownMenuTrigger className="pn-btn cs-whats">
                <Icono nombre="chat" tamano={16} aria-hidden />Mandar la lista<Icono nombre="down" tamano={15} aria-hidden className="cs-whats-flecha" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(Object.keys(CANALES) as CanalMensaje[]).map((c) => (
                  <DropdownMenuItem key={c} onSelect={() => setMensaje({ texto: mensajeAlCliente(mensajeParaPedir(b.quien_nombre, b.documentos_pedir, cargas)), canal: c })}>
                    <Icono nombre={CANALES[c].icono} tamano={16} />{CANALES[c].nombre}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </Plegable>

          <OtrasPersonas lista={b.otras_personas} alCambiar={(otras) => cambiar((x) => ({ ...x, otras_personas: otras }))} />

        </aside>
      </div>

      <Dialog open={mensaje !== null} onOpenChange={(o) => { if (!o) setMensaje(null); }}>
        <DialogContent className="max-w-md">
          <DialogTitle>{mensaje ? CANALES[mensaje.canal].titulo : "Mensaje"}</DialogTitle>
          <DialogDescription>Tú lo envías; nada sale solo.</DialogDescription>
          <textarea className="as-inp as-inp-borde as-area cs-msg" value={mensaje?.texto ?? ""} aria-label="Mensaje"
            onChange={(e) => setMensaje((m) => (m ? { ...m, texto: e.target.value } : m))} />
          <div className="as-fila as-fin">
            <Boton variante="normal" icono="copia" onClick={() => {
              void navigator.clipboard.writeText(mensaje?.texto ?? "").then(() => avisar("Mensaje copiado"), () => avisar("No se pudo copiar; selecciónalo y cópialo"));
            }}>Copiar</Boton>
            {mensaje ? (
              <a className="pn-btn pn-btn-primario" href={enlaceDeMensaje(mensaje.canal, mensaje.texto, `${b.pais}${b.numero}`)}
                target={mensaje.canal === "whatsapp" ? "_blank" : undefined} rel="noopener noreferrer" onClick={() => setMensaje(null)}>
                <Icono nombre={CANALES[mensaje.canal].icono} tamano={16} aria-hidden />{CANALES[mensaje.canal].abrir}
              </a>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <DialogoCierre abierto={dialogo} alCerrar={() => setDialogo(null)} alGuardar={(como, valor) => void cerrarComo(como, valor)} />
    </div>
  );
}

/*
 * «Ya lo mandó» (SPEC.md, sección 4, renglón «Documentos»): cada documento pedido lleva `recibido` y cada archivo, el
 * `documento` al que pertenece. Lo que no los trae (consultas ya guardadas) cuenta como no recibido y archivo suelto.
 */
const recibido = (x: DocumentoPedir) => x.recibido === true;
const docDeCarga = (c: Carga) => c.documento || null;

/** Por dónde se le manda la lista de lo que se pide. Se abre la app con el mensaje escrito; lo envía el asesor. */
type CanalMensaje = "whatsapp" | "texto" | "correo";
const CANALES: Record<CanalMensaje, { nombre: string; titulo: string; abrir: string; icono: NombreIcono }> = {
  whatsapp: { nombre: "WhatsApp", titulo: "Mensaje para WhatsApp", abrir: "Abrir WhatsApp", icono: "chat" },
  texto: { nombre: "Mensaje de texto", titulo: "Mensaje de texto", abrir: "Abrir mensajes", icono: "tel" },
  correo: { nombre: "Correo", titulo: "Correo", abrir: "Abrir correo", icono: "arroba" },
};
/** Fallo 6: al cliente se le habla de tú; el nombre interno del documento no sale en el mensaje. */
const mensajeAlCliente = (texto: string) => texto.replace(/Identificación de quien llama/g, "Tu identificación oficial");

function enlaceDeMensaje(canal: CanalMensaje, texto: string, telefono: string) {
  const d = telefono.replace(/\D/g, "");
  if (canal === "whatsapp") return enlaceWhatsApp(texto, telefono);
  if (canal === "texto") return `sms:${d.length >= 8 ? `+${d}` : ""}?body=${encodeURIComponent(texto)}`;
  return `mailto:?body=${encodeURIComponent(texto)}`;
}

/** Un renglón para escribir y agregar con Enter. */
function AgregarRenglon({ etiqueta, alAgregar }: { etiqueta: string; alAgregar: (texto: string) => void }) {
  const [t, setT] = useState("");
  return (
    <form className="cs-agregar" onSubmit={(e) => { e.preventDefault(); const v = t.trim(); if (!v) return; alAgregar(v.slice(0, 200)); setT(""); }}>
      <Icono nombre="mas" tamano={15} aria-hidden />
      <input className="cs-inp-plano" placeholder={etiqueta} aria-label={etiqueta} value={t} maxLength={200} onChange={(e) => setT(e.target.value)} />
    </form>
  );
}

/**
 * Otras personas del caso (la titular, los hermanos…), con su papel, sin salir de la consulta. Cada una se corrige con el
 * lápiz (hallazgo 21): sus datos suben a la forma y «Guardar» la cambia en su lugar.
 */
function OtrasPersonas({ lista, alCambiar }: { lista: OtraPersona[]; alCambiar: (l: OtraPersona[]) => void }) {
  const [nombre, setNombre] = useState("");
  const cat = useCatalogos();
  const [elegido, setPapel] = useState<Papel>("titular");
  // Quien llama ya entra como contacto: aquí se ofrecen los demás papeles. Si «titular» se desactivó, el primero que quede.
  const papeles = cat.opciones("papel").filter((o) => o.valor !== "contacto");
  const papel = papeles.some((o) => o.valor === elegido) ? elegido : papeles[0]?.valor ?? elegido;
  const [pais, setPais] = useState("+52");
  const [numero, setNumero] = useState("");
  const [editando, setEditando] = useState<number | null>(null);
  const listo = nombre.trim().length > 0;
  const limpiar = () => { setNombre(""); setNumero(""); setPais("+52"); setEditando(null); };
  function corregir(i: number) {
    const p = lista[i];
    if (!p) return;
    setEditando(i); setNombre(p.nombre); setPapel(p.papel); setPais(p.pais ?? "+52"); setNumero(p.numero ?? "");
  }
  function agregar() {
    if (!listo) return;
    // Al corregir se conserva lo demás que ya tenía (como «Falleció»); el teléfono se toma de la forma.
    const previa = editando !== null ? lista[editando] : undefined;
    const nueva: OtraPersona = {
      nombre: nombre.trim().slice(0, 160), papel, ...(previa?.fallecida ? { fallecida: true } : {}),
      ...(numero.trim() ? { pais, numero: numero.trim() } : {}),
    };
    alCambiar(editando !== null ? lista.map((p, j) => (j === editando ? nueva : p)) : [...lista, nueva]);
    limpiar();
  }
  const resumen = lista.length ? lista.map((p) => p.nombre.split(" ")[0]).join(", ") : "Nadie más";
  return (
    <Plegable icono="users" titulo="Otras personas" llave="consulta-personas" resumen={resumen}>
      {lista.length ? (
        <ul className="cs-docs">
          {lista.map((p, i) => (
            <li key={`${p.nombre}-${i}`} className="cs-doc cs-persona" data-editando={editando === i ? "" : undefined}>
              <span className="as-av" aria-hidden>{iniciales(p.nombre)}</span>
              <span className="cs-doc-n">{p.nombre}<span className="as-m">{[cat.etiqueta("papel", p.papel), p.fallecida ? "Falleció" : p.numero ? `${p.pais} ${p.numero}` : ""].filter(Boolean).join(" · ")}</span></span>
              <Boton variante="fantasma" soloIcono icono="lapiz" className="cs-doc-x" aria-label={`Corregir a ${p.nombre}`} onClick={() => corregir(i)} />
              <Boton variante="fantasma" soloIcono icono="x" className="cs-doc-x" aria-label={`Quitar a ${p.nombre}`} onClick={() => { if (editando !== null) limpiar(); alCambiar(lista.filter((_, j) => j !== i)); }} />
            </li>
          ))}
        </ul>
      ) : null}
      <form className="as-form cs-persona-nueva" onSubmit={(e) => { e.preventDefault(); agregar(); }}>
        <div className="as-g2">
          <Campo etiqueta="Nombre" value={nombre} maxLength={160} autoComplete="off" onChange={(e) => setNombre(e.target.value)} />
          <Desplegable etiqueta="Papel" valor={papel} opciones={papeles} alElegir={(v) => { if (v) setPapel(v); }} />
        </div>
        <CampoTelefono etiqueta="Teléfono (opcional)" pais={pais} numero={numero} alCambiarPais={setPais} alCambiarNumero={setNumero} />
        {/* «Falleció» no va aquí: es un dato más de la ficha de la persona (decisión del 18/11). */}
        <div className="as-fila as-fin">
          {editando !== null ? <Boton variante="fantasma" onClick={limpiar}>Cancelar</Boton> : null}
          <Boton type="submit" variante="normal" icono={editando !== null ? "ok" : "mas"} deshabilitado={!listo}>{editando !== null ? "Guardar" : "Agregar"}</Boton>
        </div>
      </form>
    </Plegable>
  );
}

/** «Guardar como contacto» (con fecha para volver a llamar) o «No procede» (con su motivo). */
function DialogoCierre({ abierto, alCerrar, alGuardar }: {
  abierto: "contacto" | "no_procede" | null; alCerrar: () => void; alGuardar: (como: "contacto" | "no_procede", valor: string) => void;
}) {
  return (
    <Dialog open={abierto !== null} onOpenChange={(o) => { if (!o) alCerrar(); }}>
      <DialogContent className="max-w-md">
        <DialogTitle>{abierto === "contacto" ? "Guardar como contacto" : "No procede"}</DialogTitle>
        <DialogDescription>
          {abierto === "contacto" ? "Queda en el Directorio, sin asunto. Ese día aparece en Inicio." : "La consulta se cierra con su motivo."}
        </DialogDescription>
        {abierto ? <FormaCierre como={abierto} alCerrar={alCerrar} alGuardar={alGuardar} /> : null}
      </DialogContent>
    </Dialog>
  );
}

/**
 * El motivo de «No procede» se elige de su catálogo (hallazgo 22), con una nota opcional. Se guarda como un solo texto
 * («No es de lo que hacemos. Quería un abogado penal»); ninguno de los dos es obligatorio.
 */
function FormaCierre({ como, alCerrar, alGuardar }: { como: "contacto" | "no_procede"; alCerrar: () => void; alGuardar: (como: "contacto" | "no_procede", valor: string) => void }) {
  const cat = useCatalogos();
  const [valor, setValor] = useState(como === "contacto" ? sumarDias(14) : "");
  const [motivo, setMotivo] = useState("");
  const listo = como === "no_procede" || /^\d{4}-\d{2}-\d{2}$/.test(valor);
  const texto = () => como === "contacto" ? valor.trim()
    : [motivo ? cat.etiqueta("motivo_no_procede", motivo) : "", valor.trim()].filter(Boolean).join(". ").slice(0, 1000);
  return (
    <form className="as-form" onSubmit={(e) => { e.preventDefault(); if (!listo) return; alCerrar(); alGuardar(como, texto()); }}>
      {como === "contacto" ? (
        <CampoFecha etiqueta="Volver a llamarle el" valor={valor} alElegir={(f) => setValor(f ?? "")} autoFocus />
      ) : (
        <>
          <Desplegable etiqueta="Motivo" valor={motivo} vacio="Sin decir" opciones={cat.opciones("motivo_no_procede", motivo)} alElegir={setMotivo} />
          <Campo etiqueta="Nota (opcional)" value={valor} maxLength={900} onChange={(e) => setValor(e.target.value)} />
        </>
      )}
      <div className="as-fila as-fin">
        <Boton variante="normal" onClick={alCerrar}>Cancelar</Boton>
        <Boton type="submit" variante="primario" deshabilitado={!listo}>{como === "contacto" ? "Guardar" : "Cerrar consulta"}</Boton>
      </div>
    </form>
  );
}
