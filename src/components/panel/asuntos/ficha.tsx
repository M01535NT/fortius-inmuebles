"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { Gesto, Icono } from "@/components/panel/icons";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Boton } from "@/components/panel/kit/boton";
import { Campo } from "@/components/panel/kit/campo";
import { Desplegable, DesplegableFecha } from "@/components/panel/kit/desplegable";
import { Cargando, EstadoError } from "@/components/panel/kit/estados";
import { Hoja } from "@/components/panel/kit/hoja";
import { Interruptor } from "@/components/panel/kit/segmentado";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/panel/ui/tabs";
import { useColeccion } from "@/components/panel/datos/use-coleccion";
import { formatPrecio, type Property } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import type { Asesor } from "@/lib/domain/records";
import { aTexto, diaLargo } from "@/lib/panel/calendario";
import { useSession } from "@/lib/panel/legado/sesion";
import {
  autorDeNota, comoTermino, cuentaDocumentos, documentosDelAsunto, iniciales, llevaCierre, marcarDocumento, MOTIVOS_NO_SE_DIO,
  noSeDio, papelPrincipal, paraFortius, pesosCortos, ponerEnEspera, ponerInmueblePrincipal, reabrir, reanudar, seLogro, textoSigue,
  type Actividad, type AvisoAsunto, type EstadoDocumento, type Expediente, type FilaAsunto,
} from "@/lib/panel/datos/asuntos";
import { avisosAceptados, leerAvisosDelServidor, notaSeguirAsi, unirAvisos } from "@/lib/panel/datos/asuntos-avisos";
import {
  desligarInmueble, leerInmueblesDelAsunto, leerPersonasDelAsunto, ligarInmueble, OPCIONES_PAPEL, OPCIONES_TIPO_ASUNTO, PAPEL_DE_APOYO, PAPELES,
  quitarPersona, sumarPersona, tipoDeOperacion,
  type InmuebleDelAsunto, type Papel, type PersonaDelAsunto, type TipoAsunto,
} from "@/lib/panel/datos/asuntos-servidor";
import { guardarEnAsunto, subirATemporal } from "@/lib/panel/datos/bandeja-acciones";
import { anotarEnAsunto, leerActividad, pedir } from "@/lib/panel/datos/colecciones";
import { leerCuentas, type Cuenta } from "@/lib/panel/datos/configuracion-cuentas";
import { catalogo, tituloFormato } from "@/lib/panel/datos/formatos";
import { crearDocumento } from "@/lib/panel/datos/formatos-acciones";
import { leerArchivosDelCliente, rutaArchivoDelCliente, type ArchivoDelCliente } from "@/lib/panel/datos/formatos-adjuntos";

import { ALTA_VACIA, AltaPersona, faltaAlta, personaDeAlta, type DatosAlta } from "./alta-persona";
import { CierreDelAsunto } from "./cierre-del-asunto";
import type { PedirCambio } from "./detalle";
import { LigarInmueble } from "./ligar-inmueble";
import { LoLleva } from "./reasignar";

/** Hojas que se abren sobre el asunto (boceto): las abre la ficha o el menú ⋯ de la barra. */
export type HojaAsunto = null | "meta" | "espera" | "cerrar" | "posponer" | "documento" | "personas" | "subir" | "titulo" | "agregar" | "inmueble";

/** Inmueble del asunto: el principal (columna del expediente) o uno ligado en la tabla de PN-02 (este se puede quitar). */
type InmuebleLigado = { slug: string; titulo: string; detalle: string; ligado: boolean };

export type AccionesSigue = {
  alHecho: (tareaId: string) => void;
  alPosponer: (tareaId: string, fecha: string | null) => Promise<boolean>;
  alAnotar: (texto: string, fecha: string | null) => Promise<boolean>;
  alEditar: (tareaId: string, texto: string, fecha: string | null) => Promise<boolean>;
};

const NOMBRE_DOC: Record<EstadoDocumento, string> = { pendiente: "Falta", recibido: "Recibido", no_aplica: "No aplica" };
const OPCIONES_DOC = (Object.keys(NOMBRE_DOC) as EstadoDocumento[]).map((v) => ({ valor: v, etiqueta: NOMBRE_DOC[v] }));
const GRUPO: Record<string, string | undefined> = { venta: "vender", renta: "rentar" };
const soloDigitos = (t: string) => t.replace(/\D/g, "");
const enlaceWhatsApp = (t: string) => { const d = soloDigitos(t); return `https://wa.me/${d.length === 10 ? `52${d}` : d}`; };
const hora = (iso: string) => new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
const cuandoFue = (iso: string) => `${diaLargo(aTexto(new Date(iso)))}, ${hora(iso)}`;

/** Persona del asunto. `papelClave` solo en las que vienen de la tabla de PN-02 (se pueden quitar); la principal no lo lleva. */
type Persona = { id: string; nombre: string; papel: string; telefono: string; papelClave?: Papel };
type CambioAsunto = { titulo?: string; tipo?: TipoAsunto };

/**
 * Ficha del asunto, igual al boceto («Asuntos en escritorio · B» y «Asuntos · prototipo en teléfono»):
 * título, «Tipo · Estado», barra de contacto, lo que sigue (bloque en tinta), avisos plegados en una línea ámbar,
 * la franja de datos (escritorio) y las pestañas. En escritorio: Guías, Documentos, Notas, Actividad y Datos.
 * En el teléfono: Resumen (datos y actividad), Guías, Docs y Notas.
 * Título, tipo y personas con papel usan PN-02 si ya está en la base; si no, el título va como nota, se ve solo la persona
 * principal y el tipo avisa que llega después, sin error. Ligar inmueble: sin principal, se pone como principal; con él, el
 * segundo va a la tabla de PN-02 (o avisa que llega después). Guías (PN-07) se dibujan y avisan.
 */
export function FichaAsunto({ fila, expediente, avisos, telefono, ocupado, alCambiar, sigue, hoja, setHoja, alVerPersona, alVerInmueble, asesores, esDirector, alPasar, personasTodas, alGuardarAsunto, inmueblesTodos, guardarPersona, miAsesor }: {
  fila: FilaAsunto; expediente: Expediente; avisos: readonly AvisoAsunto[]; telefono: boolean; ocupado: boolean;
  alCambiar: PedirCambio; sigue: AccionesSigue;
  hoja: HojaAsunto; setHoja: (h: HojaAsunto) => void;
  alVerPersona: (personaId: string) => void; alVerInmueble: (slug?: string) => void;
  asesores: readonly Asesor[]; esDirector: boolean; alPasar: (asesorId: string, motivo: string) => Promise<boolean>;
  personasTodas: readonly Cliente[]; alGuardarAsunto: (cambio: CambioAsunto) => Promise<boolean>;
  inmueblesTodos: readonly Property[]; guardarPersona: (id: string, c: Cliente) => Promise<unknown>; miAsesor: string | null;
}) {
  const { avisar } = useAvisos();
  const [pestana, setPestana] = useState(telefono ? "resumen" : "guias");
  // Otros inmuebles ligados (PN-02). Sin la tabla, solo el inmueble principal; ligar llena el principal si no hay.
  const [ligados, setLigados] = useState<{ disponible: boolean; inmuebles: InmuebleDelAsunto[] } | null>(null);
  const [intentoInmuebles, setIntentoInmuebles] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    leerInmueblesDelAsunto(expediente.id, c.signal).then(setLigados, () => { if (!c.signal.aborted) setLigados({ disponible: false, inmuebles: [] }); });
    return () => c.abort();
  }, [expediente.id, intentoInmuebles]);
  const inmuebles = inmueblesDelAsunto(fila, ligados?.inmuebles ?? [], inmueblesTodos);
  const recargarInmuebles = () => setIntentoInmuebles((n) => n + 1);
  const [ligando, setLigando] = useState(false);
  // Ligar: sin inmueble principal, se pone como principal (funciona hoy y después de PN-02); si ya hay, va a la tabla de PN-02.
  const ligar = async (p: Property) => {
    if (ligando) return;
    if (!expediente.propiedad_slug) {
      setHoja(null);
      void alCambiar((e) => ponerInmueblePrincipal(e, p.slug), `${p.titulo}: ligado al asunto`, (e) => ponerInmueblePrincipal(e, null));
      return;
    }
    setLigando(true);
    try {
      const ok = await ligarInmueble(expediente.id, p.slug);
      if (!ok) { avisar("Ligar un segundo inmueble llega con la siguiente actualización del servidor. Por ahora el asunto lleva su inmueble principal."); return; }
      setHoja(null); recargarInmuebles();
      avisar(`${p.titulo}: ligado al asunto`, { etiqueta: "Deshacer", alAccionar: () => { desligarInmueble(expediente.id, p.slug).then(recargarInmuebles, (e: unknown) => avisar(e instanceof Error ? e.message : "No se pudo deshacer.")); } });
    } catch (e) { avisar(e instanceof Error ? e.message : "No se pudo ligar. Vuelve a intentarlo."); }
    finally { setLigando(false); }
  };
  const quitarInmueble = async (i: InmuebleLigado) => {
    try {
      await desligarInmueble(expediente.id, i.slug);
      recargarInmuebles();
      avisar(`${i.titulo} ya no está en el asunto`, { etiqueta: "Deshacer", alAccionar: () => { ligarInmueble(expediente.id, i.slug).then(recargarInmuebles, (e: unknown) => avisar(e instanceof Error ? e.message : "No se pudo deshacer.")); } });
    } catch (e) { avisar(e instanceof Error ? e.message : "No se pudo quitar. Vuelve a intentarlo."); }
  };
  // Personas con su papel (PN-02). Sin la tabla, solo la persona principal y un aviso discreto en «Quiénes participan».
  const [delAsunto, setDelAsunto] = useState<{ disponible: boolean; personas: PersonaDelAsunto[] } | null>(null);
  const [intentoPersonas, setIntentoPersonas] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    leerPersonasDelAsunto(expediente.id, c.signal).then(setDelAsunto, () => { if (!c.signal.aborted) setDelAsunto({ disponible: false, personas: [] }); });
    return () => c.abort();
  }, [expediente.id, intentoPersonas]);
  const fin = comoTermino(expediente);
  const comision = paraFortius(expediente);
  const personas = personasDelAsunto(fila, expediente, delAsunto?.personas ?? [], personasTodas);
  // Contacto principal: la persona del asunto; si no hay, la primera que no sea notaría, banco ni abogado (boceto).
  const principal = personas.find((p) => !p.papelClave || !PAPEL_DE_APOYO.includes(p.papelClave)) ?? null;
  const sinTabla = delAsunto !== null && !delAsunto.disponible;
  const estadoTexto = fila.estado === "cerrado" ? (fin?.como === "Se logró" ? "Cerrado · se logró" : "Cerrado · no se dio") : fila.estado === "espera" ? "En espera" : "Activo";
  const estadoColor = fila.estado === "activo" ? "var(--accent)" : fila.estado === "espera" ? "var(--warning)" : "var(--ink-muted)";
  const fecha = expediente.fecha_objetivo?.slice(0, 10) ?? null;
  const pronto = "Llega cuando se publique la parte nueva del servidor.";

  return (
    <div className="as-ficha">
      <div className="as-ficha-titulo">
        <h2>{fila.titulo}</h2>
        <button type="button" className="as-metabtn" onClick={() => setHoja("meta")} aria-label={`Tipo y estado: ${fila.tipo}, ${estadoTexto}. Cambiar`}>
          {fila.tipo}<span className="as-sep" aria-hidden>·</span>
          <span className="as-estado-t" style={{ color: estadoColor }}><span className="as-dot" aria-hidden />{estadoTexto}</span>
        </button>
      </div>

      {principal ? (
        <div className="as-cbar">
          <span className="as-av" aria-hidden>{iniciales(principal.nombre)}</span>
          <button type="button" className="as-cbar-quien" onClick={() => alVerPersona(principal.id)} aria-label={`Ver a ${principal.nombre} sin salir del asunto`}>
            <strong>{principal.nombre}</strong><span>{principal.papel}</span>
          </button>
          {principal.telefono ? (
            <>
              <a className="as-icon" href={`tel:${soloDigitos(principal.telefono)}`} aria-label={`Llamar a ${principal.nombre}`} title="Llamar"><Icono nombre="llamada" tamano={20} /></a>
              <a className="as-icon" href={enlaceWhatsApp(principal.telefono)} target="_blank" rel="noopener" aria-label={`WhatsApp con ${principal.nombre}`} title="WhatsApp"><Icono nombre="mensaje" tamano={20} /></a>
            </>
          ) : null}
          {personas.length > 1 ? <button type="button" className="as-more2" onClick={() => setHoja("personas")} aria-label={`Ver las ${personas.length} personas del asunto`}>+{personas.length - 1}</button> : null}
        </div>
      ) : (
        <div><Boton variante="secundario" onClick={() => setHoja("agregar")}><Gesto nombre="mas" tamano={16} />Agregar persona</Boton></div>
      )}

      {fila.estado === "espera" ? (
        <div className="as-avcard fila">
          <span><b style={{ fontWeight: 600 }}>Esperando:</b> {expediente.flujo?.motivo?.trim() || "sin anotar qué"}</span>
          <button type="button" className="as-avbtn" disabled={ocupado} onClick={() => void alCambiar(reanudar, "Asunto activo de nuevo", undefined)}>Reanudar</button>
        </div>
      ) : null}
      {fila.estado === "cerrado" && fin ? (
        <div className="as-card as-cerrado">
          <span>{fin.como === "Se logró" ? `Se logró el ${fin.cuando}` : `No se dio (${fin.cuando})${fin.motivo ? `: ${fin.motivo}` : ""}`}</span>
          <Boton variante="secundario" deshabilitado={ocupado} onClick={() => void alCambiar(reabrir, "Asunto reabierto")}>Reabrir</Boton>
        </div>
      ) : null}

      {fila.estado !== "cerrado" ? <LoQueSigue key={`${fila.id}-${fila.sigue?.id ?? "nada"}`} fila={fila} ocupado={ocupado} sigue={sigue} alPosponer={() => setHoja("posponer")} /> : null}

      <Avisos key={fila.id} expedienteId={fila.id} avisos={avisos} alVerDocumentos={() => setPestana("documentos")} />

      {!telefono ? (
        <div className="as-strip" role="group" aria-label="Datos del asunto">
          <button type="button" onClick={() => setPestana("datos")}><span className="as-k">Personas</span><span className="as-v">{personas.length ? `${personas[0].nombre}${personas.length > 1 ? ` y ${personas.length - 1} más` : ""}` : "Sin personas"}</span></button>
          <button type="button" onClick={() => setPestana("datos")}><span className="as-k">Inmueble</span><span className="as-v">{inmuebles.length ? `${inmuebles[0].titulo}${inmuebles.length > 1 ? ` y ${inmuebles.length - 1} más` : ""}` : "Sin inmueble"}</span></button>
          <button type="button" onClick={() => setPestana("datos")}><span className="as-k">Para Fortius</span><span className="as-v">{comision ? pesosCortos(comision) : "Sin dato"}</span></button>
          <button type="button" onClick={() => setPestana("datos")}><span className="as-k">Próxima fecha</span><span className="as-v">{fecha ? `${diaLargo(fecha)} · Fecha objetivo` : "Sin fechas"}</span></button>
        </div>
      ) : null}

      <Tabs value={pestana} onValueChange={setPestana} className="as-tabs">
        <TabsList>
          {telefono ? <TabsTrigger value="resumen">Resumen</TabsTrigger> : null}
          <TabsTrigger value="guias">Guías</TabsTrigger>
          <TabsTrigger value="documentos">{telefono ? "Docs" : "Documentos"}</TabsTrigger>
          <TabsTrigger value="notas">Notas</TabsTrigger>
          {!telefono ? <TabsTrigger value="actividad">Actividad</TabsTrigger> : null}
          {!telefono ? <TabsTrigger value="datos">Datos</TabsTrigger> : null}
        </TabsList>
        {telefono ? (
          <TabsContent value="resumen">
            <div className="as-col as-una-col">
              <Datos fila={fila} expediente={expediente} personas={personas} ocupado={ocupado} alCambiar={alCambiar} alVerPersona={alVerPersona} alVerInmueble={alVerInmueble}
                asesores={asesores} esDirector={esDirector} alPasar={alPasar} sinTabla={sinTabla} alAgregar={() => setHoja("agregar")} alRecargar={() => setIntentoPersonas((n) => n + 1)}
                inmuebles={inmuebles} alLigar={() => setHoja("inmueble")} alQuitarInmueble={(i) => void quitarInmueble(i)} />
              <section className="as-sec" aria-label="Actividad"><h3>Actividad</h3><Bitacora id={fila.id} modo="actividad" /></section>
            </div>
          </TabsContent>
        ) : null}
        <TabsContent value="guias">
          <div className="as-col">
            <div className="as-card as-vacio">
              <strong>Este asunto no usa guía</strong>
              <span>Una guía sugiere pasos (venta con crédito, renta, cancelación de hipoteca…). Puedes agregar varias, saltar pasos o no usar ninguna.</span>
            </div>
            <div><Boton variante="secundario" onClick={() => avisar(`Las guías: ${pronto}`)}><Gesto nombre="mas" tamano={16} />Agregar guía</Boton></div>
          </div>
        </TabsContent>
        <TabsContent value="documentos">
          <Documentos expediente={expediente} ocupado={ocupado} alCambiar={alCambiar} alCrear={() => setHoja("documento")} alSubir={() => setHoja("subir")} />
        </TabsContent>
        <TabsContent value="notas">
          <Bitacora id={fila.id} modo="notas" />
        </TabsContent>
        {!telefono ? (
          <>
            <TabsContent value="actividad"><Bitacora id={fila.id} modo="actividad" /></TabsContent>
            <TabsContent value="datos">
              <Datos fila={fila} expediente={expediente} personas={personas} ocupado={ocupado} alCambiar={alCambiar} alVerPersona={alVerPersona} alVerInmueble={alVerInmueble}
                asesores={asesores} esDirector={esDirector} alPasar={alPasar} sinTabla={sinTabla} alAgregar={() => setHoja("agregar")} alRecargar={() => setIntentoPersonas((n) => n + 1)}
                inmuebles={inmuebles} alLigar={() => setHoja("inmueble")} alQuitarInmueble={(i) => void quitarInmueble(i)} />
            </TabsContent>
          </>
        ) : null}
      </Tabs>

      <HojasDelAsunto hoja={hoja} setHoja={setHoja} fila={fila} expediente={expediente} avisos={avisos} personas={personas} ocupado={ocupado} alCambiar={alCambiar} sigue={sigue}
        personasTodas={personasTodas} alGuardarAsunto={alGuardarAsunto} alRecargar={() => setIntentoPersonas((n) => n + 1)} alVerPersona={alVerPersona}
        sinTabla={sinTabla} guardarPersona={guardarPersona} miAsesor={miAsesor} />
      <LigarInmueble abierta={hoja === "inmueble"} inmuebles={inmueblesTodos} yaLigados={new Set(inmuebles.map((i) => i.slug))} ocupado={ocupado || ligando}
        alElegir={(p) => void ligar(p)} alCerrar={() => setHoja(null)} />
    </div>
  );
}

/** El inmueble principal y, si ya existe la tabla de PN-02, los demás ligados. Sin repetir. */
function inmueblesDelAsunto(fila: FilaAsunto, filas: readonly InmuebleDelAsunto[], todos: readonly Property[]): InmuebleLigado[] {
  const porSlug = new Map(todos.map((p) => [p.slug, p]));
  const detalle = (p: Property | undefined) => (p ? [p.codigo, p.precio ? formatPrecio(p.precio) : null].filter(Boolean).join(" · ") : "");
  const lista: InmuebleLigado[] = [];
  if (fila.inmueble) lista.push({ slug: fila.inmueble.slug, titulo: fila.inmueble.titulo, detalle: detalle(porSlug.get(fila.inmueble.slug)), ligado: false });
  for (const r of filas) {
    if (lista.some((i) => i.slug === r.inmueble_id)) continue;
    const p = porSlug.get(r.inmueble_id);
    lista.push({ slug: r.inmueble_id, titulo: p?.titulo ?? "Inmueble", detalle: detalle(p), ligado: true });
  }
  return lista;
}

/** La persona principal (la del asunto) y, si ya existe la tabla de PN-02, las demás con su papel. Sin repetir. */
function personasDelAsunto(fila: FilaAsunto, e: Expediente, filas: readonly PersonaDelAsunto[], todas: readonly Cliente[]): Persona[] {
  const porId = new Map(todas.map((c) => [c.id, c]));
  const lista: Persona[] = [];
  if (fila.persona) {
    const suya = filas.find((r) => r.persona_id === fila.persona?.id);
    lista.push({ id: fila.persona.id, nombre: fila.persona.nombre || "Sin nombre", papel: suya ? PAPELES[suya.papel] : papelPrincipal(e), telefono: fila.persona.telefono ?? "" });
  }
  const suya = fila.persona ? filas.find((r) => r.persona_id === fila.persona?.id) : undefined;
  for (const r of filas) {
    if (r === suya) continue; // ya está arriba como principal, con ese papel
    const c = porId.get(r.persona_id);
    lista.push({ id: r.persona_id, nombre: c?.nombre?.trim() || "Sin nombre", papel: PAPELES[r.papel] ?? "Otro", telefono: c?.telefono ?? "", papelClave: r.papel });
  }
  return lista;
}

/** «Lo que sigue» (boceto): bloque en tinta con Hecho y Posponer; tocar el texto lo cambia ahí mismo; sin paso, el bloque ya es el campo. */
function LoQueSigue({ fila, ocupado, sigue, alPosponer }: { fila: FilaAsunto; ocupado: boolean; sigue: AccionesSigue; alPosponer: () => void }) {
  const [hoy] = useState(() => new Date());
  const s = fila.sigue;
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(s?.texto ?? "");
  const [fecha, setFecha] = useState<string | null>(s?.fecha ?? null);
  const entrada = useRef<HTMLInputElement>(null);
  useEffect(() => { if (editando) entrada.current?.focus(); }, [editando]);

  if (!s) {
    const guardar = () => { if (texto.trim()) void sigue.alAnotar(texto, fecha).then((ok) => { if (ok) { setTexto(""); setFecha(null); } }); };
    return (
      <form className="as-emptyblk" aria-label="Anotar lo que sigue" onSubmit={(e) => { e.preventDefault(); guardar(); }}>
        <strong>¿Qué sigue?</strong>
        <label style={{ display: "flex" }}>
          <span className="pn-solo-lector">Qué toca hacer</span>
          <input className="as-ninput" type="text" value={texto} maxLength={160} onChange={(e) => setTexto(e.target.value)} placeholder="Ej. Llamarle para agendar la visita" autoComplete="off" />
        </label>
        <DesplegableFecha valor={fecha} alElegir={setFecha} hoy={hoy} />
        <Boton type="submit" deshabilitado={ocupado || !texto.trim()}>Guardar</Boton>
      </form>
    );
  }
  if (editando) {
    const guardar = () => { if (texto.trim()) void sigue.alEditar(s.id, texto, fecha).then((ok) => { if (ok) setEditando(false); }); };
    return (
      <form className="as-nextblk" aria-label="Cambiar lo que sigue" onSubmit={(e) => { e.preventDefault(); guardar(); }}>
        <span className="as-k">Lo que sigue</span>
        <label style={{ display: "flex" }}>
          <span className="pn-solo-lector">Qué toca hacer</span>
          <input ref={entrada} className="as-ninput" type="text" value={texto} maxLength={160} onChange={(e) => setTexto(e.target.value)} autoComplete="off"
            onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setEditando(false); setTexto(s.texto); setFecha(s.fecha); } }} />
        </label>
        <DesplegableFecha valor={fecha} alElegir={setFecha} hoy={hoy} />
        <div className="as-nbtns">
          <button type="submit" className="as-nbtn main" disabled={ocupado || !texto.trim()}>Guardar</button>
          <button type="button" className="as-nbtn" onClick={() => { setEditando(false); setTexto(s.texto); setFecha(s.fecha); }}>Cancelar</button>
        </div>
      </form>
    );
  }
  const cuando = s.fecha ? (s.vencido ? `Venció: ${diaLargo(s.fecha).toLowerCase()}` : diaLargo(s.fecha)) : "Sin fecha";
  return (
    <section className="as-nextblk" aria-label="Lo que sigue">
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span className="as-k">Lo que sigue · <span className={s.vencido ? "late" : undefined}>{cuando}</span></span>
        <button type="button" className="as-ttap" onClick={() => setEditando(true)} aria-label={`${s.texto}. Tocar para cambiarlo`}>{s.texto}</button>
      </div>
      <div className="as-nbtns">
        <button type="button" className="as-nbtn main" disabled={ocupado} onClick={() => sigue.alHecho(s.id)} aria-keyshortcuts="E"><Gesto nombre="palomita" tamano={16} />Hecho</button>
        <button type="button" className="as-nbtn" onClick={alPosponer} aria-keyshortcuts="P">Posponer</button>
      </div>
      {fila.abiertas.length > 1 ? (
        <span className="as-k" style={{ fontWeight: 500 }}>Después: {fila.abiertas.filter((t) => t.id !== s.id).map((t) => t.titulo).join(" · ")}</span>
      ) : null}
    </section>
  );
}

/**
 * Avisos plegados en una línea ámbar: «2 avisos» y el primero; se abren al tocarla. Suma los que calcula el servidor
 * (arranque, revisión del 15, aviso de privacidad) a los de la pantalla; los legales van primero y aparte.
 * Cada uno con su acción y «Seguir así», que queda como nota en el historial y ya no se muestra (DEC-61).
 */
function Avisos({ expedienteId, avisos, alVerDocumentos }: { expedienteId: string; avisos: readonly AvisoAsunto[]; alVerDocumentos: () => void }) {
  const { avisar } = useAvisos();
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [servidor, setServidor] = useState<AvisoAsunto[]>([]);
  const [aceptados, setAceptados] = useState<ReadonlySet<string>>(() => new Set());
  const [ocupado, setOcupado] = useState<string | null>(null);
  useEffect(() => {
    const c = new AbortController();
    // Si no se pueden leer, se quedan los avisos que ya sabe la pantalla.
    leerAvisosDelServidor(expedienteId, c.signal).then(setServidor, () => undefined);
    leerActividad<Actividad>(expedienteId, c.signal).then((x) => setAceptados(avisosAceptados(x)), () => undefined);
    return () => c.abort();
  }, [expedienteId]);
  const lista = unirAvisos(avisos, servidor, aceptados);
  if (!lista.length) return null;
  const legales = lista.filter((x) => x.legal), otros = lista.filter((x) => !x.legal);
  const accionar = async (x: AvisoAsunto) => {
    if (x.clave === "hipoteca") { router.push("/panel/tramites"); return; }
    if (!x.documento || x.documento.formato === "04") { alVerDocumentos(); return; }
    if (x.documento.id) { router.push(`/panel/formatos/${x.documento.id}`); return; }
    setOcupado(x.clave);
    try { const d = await crearDocumento(expedienteId, x.documento.formato); router.push(`/panel/formatos/${d.id}`); }
    catch (e) { avisar(e instanceof Error ? e.message : "No se pudo crear. Vuelve a intentarlo."); setOcupado(null); }
  };
  const seguirAsi = async (x: AvisoAsunto) => {
    setOcupado(x.clave);
    try {
      await anotarEnAsunto(expedienteId, notaSeguirAsi(x));
      setAceptados((v) => new Set(v).add(x.texto));
      avisar("Anotado en el historial");
    } catch (e) { avisar(e instanceof Error ? e.message : "No se pudo anotar en el historial."); }
    finally { setOcupado(null); }
  };
  const tarjeta = (x: AvisoAsunto) => (
    <div key={x.clave} className="as-avcard">
      <strong>{x.texto}</strong>
      <div className="as-avbtns">
        {x.accion ? <button type="button" className="as-avbtn" disabled={ocupado !== null} onClick={() => void accionar(x)}>{ocupado === x.clave ? "Abriendo…" : x.accion}</button> : null}
        <button type="button" className="as-avbtn ghost" disabled={ocupado !== null} onClick={() => void seguirAsi(x)}>Seguir así</button>
      </div>
    </div>
  );
  const ambos = legales.length > 0 && otros.length > 0;
  return (
    <div className="as-avisos">
      <button type="button" className="as-avline" onClick={() => setAbierto((v) => !v)} aria-expanded={abierto}>
        <span className="as-warnline">{lista.length === 1 ? "1 aviso" : `${lista.length} avisos`}</span>
        <span className="as-f">{lista[0]?.texto}</span>
        <span className="as-chev" aria-hidden><Gesto nombre="abajo" tamano={16} /></span>
      </button>
      {abierto ? (
        <>
          {legales.length ? <span className="as-fh">Avisos legales · puedes seguir, pero conviene resolverlos antes de firmar</span> : null}
          {legales.map(tarjeta)}
          {ambos ? <span className="as-fh">Otros avisos</span> : null}
          {otros.map(tarjeta)}
        </>
      ) : null}
    </div>
  );
}

/** «Datos» (escritorio) o la parte de arriba de «Resumen» (teléfono): quiénes participan, inmuebles, dinero, fechas y quién lo lleva. */
function Datos({ fila, expediente, personas, ocupado, alCambiar, alVerPersona, alVerInmueble, asesores, esDirector, alPasar, sinTabla, alAgregar, alRecargar, inmuebles, alLigar, alQuitarInmueble }: {
  fila: FilaAsunto; expediente: Expediente; personas: readonly Persona[]; ocupado: boolean; alCambiar: PedirCambio;
  alVerPersona: (personaId: string) => void; alVerInmueble: (slug?: string) => void;
  asesores: readonly Asesor[]; esDirector: boolean; alPasar: (asesorId: string, motivo: string) => Promise<boolean>;
  sinTabla: boolean; alAgregar: () => void; alRecargar: () => void;
  inmuebles: readonly InmuebleLigado[]; alLigar: () => void; alQuitarInmueble: (i: InmuebleLigado) => void;
}) {
  const { avisar } = useAvisos();
  const [hoy] = useState(() => new Date());
  const comision = paraFortius(expediente);
  const fecha = expediente.fecha_objetivo?.slice(0, 10) ?? null;
  const hoyTexto = aTexto(hoy);
  // Quitar a alguien no borra nada: queda retirado y Deshacer lo vuelve a sumar.
  const quitar = async (p: Persona) => {
    const papel = p.papelClave;
    if (!papel) return;
    try {
      await quitarPersona(expediente.id, p.id, papel);
      alRecargar();
      avisar(`${p.nombre} ya no está en el asunto`, { etiqueta: "Deshacer", alAccionar: () => { sumarPersona(expediente.id, p.id, papel).then(alRecargar, (e: unknown) => avisar(e instanceof Error ? e.message : "No se pudo deshacer.")); } });
    } catch (e) { avisar(e instanceof Error ? e.message : "No se pudo quitar. Vuelve a intentarlo."); }
  };
  const claseFecha = fecha && fecha < hoyTexto ? "as-dwhen late" : fecha && fecha <= aTexto(new Date(hoy.getTime() + 7 * 864e5)) ? "as-dwhen soon" : "as-dwhen";
  return (
    <div className="as-datos">
      <section className="as-sec" aria-label="Quiénes participan">
        <h3>Quiénes participan</h3>
        <div className="as-card">
          {personas.map((p) => (
            <div key={`${p.id}-${p.papelClave ?? "principal"}`} className="as-prow">
              <span className="as-av" aria-hidden>{iniciales(p.nombre)}</span>
              <span className="as-prow-txt">
                <button type="button" className="as-nm" onClick={() => alVerPersona(p.id)} aria-label={`Ver a ${p.nombre} sin salir del asunto`}>{p.nombre}</button>
                <span className="as-rl">{p.papel}</span>
              </span>
              {p.papelClave ? <button type="button" className="as-link" disabled={ocupado} onClick={() => void quitar(p)} aria-label={`Quitar a ${p.nombre} (${p.papel}) del asunto`}>Quitar</button> : null}
              {p.telefono ? <a className="as-icon" href={`tel:${soloDigitos(p.telefono)}`} aria-label={`Llamar a ${p.nombre}`} title="Llamar"><Icono nombre="llamada" tamano={20} /></a> : null}
              {p.telefono ? <a className="as-icon" href={enlaceWhatsApp(p.telefono)} target="_blank" rel="noopener" aria-label={`WhatsApp con ${p.nombre}`} title="WhatsApp"><Icono nombre="mensaje" tamano={20} /></a> : null}
            </div>
          ))}
          {!personas.length ? <div className="as-nota-vacia">Nadie todavía. Un asunto puede empezar sin personas.</div> : null}
          {sinTabla && personas.length ? <div className="as-nota-vacia">Por ahora se ve solo la persona principal. Sumar más, cada una con su papel, llega con la siguiente actualización del servidor.</div> : null}
          <button type="button" className="as-addrow" onClick={alAgregar}><Gesto nombre="mas" tamano={16} />Agregar persona</button>
          {fila.persona ? <Link className="as-addrow" href={`/panel/personas?ver=${encodeURIComponent(fila.persona.id)}`}>Abrir a {fila.persona.nombre} en Personas</Link> : null}
        </div>
      </section>

      <section className="as-sec" aria-label="Inmuebles">
        <h3>Inmuebles</h3>
        <div className="as-card">
          {inmuebles.map((i) => (
            <div key={i.slug} className="as-prow">
              <span className="as-dico" aria-hidden><Icono nombre="casa" tamano={18} /></span>
              <span className="as-prow-txt">
                <button type="button" className="as-nm" onClick={() => alVerInmueble(i.slug)} aria-label={`Ver el inmueble ${i.titulo} sin salir del asunto`}>{i.titulo}</button>
                {i.detalle ? <span className="as-rl">{i.detalle}</span> : null}
              </span>
              {i.ligado ? <button type="button" className="as-link" disabled={ocupado} onClick={() => alQuitarInmueble(i)} aria-label={`Quitar ${i.titulo} del asunto`}>Quitar</button> : null}
            </div>
          ))}
          {!inmuebles.length ? <div className="as-nota-vacia">Ningún inmueble ligado.</div> : null}
          <button type="button" className="as-addrow" onClick={alLigar}><Gesto nombre="mas" tamano={16} />{inmuebles.length ? "Ligar otro inmueble" : "Ligar inmueble"}</button>
          {fila.inmueble ? <Link className="as-addrow" href={`/panel/inmuebles?ver=${encodeURIComponent(fila.inmueble.codigo)}`}>Abrir el inmueble en Inmuebles</Link> : null}
        </div>
      </section>

      <section className="as-sec" aria-label="Dinero">
        <h3>Dinero</h3>
        <div className="as-card">
          <div className="as-drow"><span className="as-dk">Valor</span><span className={fila.inmueble?.precio ? "as-dv" : "as-dv empty"}>{fila.inmueble?.precio ? formatPrecio(fila.inmueble.precio) : "Sin dato"}</span></div>
          <div className="as-drow"><span className="as-dk">Comisión</span><span className={comision ? "as-dv" : "as-dv empty"}>{comision ? `${pesosCortos(comision)} sin IVA` : "Sale del contrato de intermediación"}</span></div>
          {comision ? (
            <div className="as-comm"><b>{pesosCortos(comision)}</b><span>Para Fortius · cálculo de referencia</span></div>
          ) : null}
        </div>
        {llevaCierre(expediente) && fila.estado !== "cerrado" ? <CierreDelAsunto key={`cierre-${expediente.id}`} expediente={expediente} ocupado={ocupado} alCambiar={alCambiar} /> : null}
      </section>

      <section className="as-sec" aria-label="Fechas">
        <h3>Fechas</h3>
        <div className="as-card">
          {fecha ? (
            <div className="as-prow">
              <span style={{ flex: 1, minWidth: 0, fontSize: 14 }}>Fecha objetivo</span>
              <span className={claseFecha}>{diaLargo(fecha)}</span>
            </div>
          ) : <div className="as-nota-vacia">Sin fechas. Las que agregues aparecen en Hoy cuando se acerquen.</div>}
          {fila.estado !== "cerrado" ? (
            <div style={{ padding: "4px 14px 14px", borderTop: "1px solid var(--border)" }}>
              <DesplegableFecha key={fecha ?? ""} etiqueta={fecha ? "Cambiar la fecha objetivo" : "Agregar fecha objetivo"} valor={fecha} hoy={hoy} sinFecha="Sin fecha"
                alElegir={(f) => {
                  if (f === fecha || ocupado) return;
                  void alCambiar((e) => ({ version: e.version, etapa: e.etapa, fechaObjetivo: f, checklist: { ...(e.checklist ?? {}) } }),
                    f ? `Fecha objetivo: ${diaLargo(f)}` : "Sin fecha objetivo",
                    (e) => ({ version: e.version, etapa: e.etapa, fechaObjetivo: fecha, checklist: { ...(e.checklist ?? {}) } }));
                }} />
            </div>
          ) : null}
        </div>
        <LoLleva key={`${fila.id}-${expediente.asesor_id}`} asesorId={expediente.asesor_id} asesores={asesores} esDirector={esDirector} alPasar={alPasar} />
      </section>
    </div>
  );
}

type DocHecho = { id: string; formato_id: string; updated_at: string };

/** Documentos: recibidos y hechos en Fortius en una sola lista (boceto), «Crear documento» y «Subir archivo»; abajo, lo que se pide. */
function Documentos({ expediente, ocupado, alCambiar, alCrear, alSubir }: { expediente: Expediente; ocupado: boolean; alCambiar: PedirCambio; alCrear: () => void; alSubir: () => void }) {
  const [archivos, setArchivos] = useState<ArchivoDelCliente[] | null>(null);
  const [hechos, setHechos] = useState<DocHecho[] | null>(null);
  const [error, setError] = useState("");
  const [intento, setIntento] = useState(0);
  useEffect(() => {
    const ctl = new AbortController();
    Promise.all([
      leerArchivosDelCliente(expediente.id, ctl.signal),
      pedir<DocHecho[]>(`/api/admin/expedientes/${encodeURIComponent(expediente.id)}/formatos`, { method: "GET", signal: ctl.signal }, "documentos"),
    ]).then(([a, h]) => { setArchivos(a); setHechos(h); setError(""); })
      .catch((e: unknown) => { if (!ctl.signal.aborted) setError(e instanceof Error ? e.message : "No se pudieron leer los documentos."); });
    return () => ctl.abort();
  }, [expediente.id, intento, expediente.version]);
  const docs = documentosDelAsunto(expediente);
  const lista = [
    ...(hechos ?? []).map((d) => ({ clave: `f-${d.id}`, propio: true, nombre: `${d.formato_id} · ${tituloFormato(d.formato_id)}`, meta: `Hecho en Fortius · ${diaLargo(d.updated_at.slice(0, 10))}`, href: `/panel/formatos/${d.id}`, fecha: d.updated_at, externo: false })),
    ...(archivos ?? []).map((a) => ({ clave: `a-${a.id}`, propio: false, nombre: a.titulo || a.nombre_original, meta: `Del cliente · ${diaLargo(a.created_at.slice(0, 10))}`, href: rutaArchivoDelCliente(a.id), fecha: a.created_at, externo: true })),
  ].sort((x, y) => y.fecha.localeCompare(x.fecha));
  return (
    <div className="as-col">
      <div className="as-dos">
        <Boton onClick={alCrear}><Gesto nombre="mas" tamano={16} />Crear documento</Boton>
        <Boton variante="secundario" onClick={alSubir}>Subir archivo</Boton>
      </div>
      {error ? <EstadoError texto={error} alReintentar={() => { setError(""); setArchivos(null); setHechos(null); setIntento((n) => n + 1); }} />
        : archivos === null || hechos === null ? <Cargando lineas={2} etiqueta="Cargando documentos" />
        : lista.length ? (
          <div className="as-card">
            {lista.map((d) => d.externo ? (
              <a key={d.clave} className="as-drow2" href={d.href} target="_blank" rel="noopener">
                <span className="as-dico" aria-hidden><Icono nombre="expediente" tamano={18} /></span>
                <span className="as-drow2-txt"><strong>{d.nombre}</strong><span>{d.meta}</span></span>
              </a>
            ) : (
              <Link key={d.clave} className="as-drow2" href={d.href}>
                <span className="as-dico own" aria-hidden><Icono nombre="contrato" tamano={18} /></span>
                <span className="as-drow2-txt"><strong>{d.nombre}</strong><span>{d.meta}</span></span>
              </Link>
            ))}
          </div>
        ) : <div className="as-card" style={{ padding: "14px 16px", fontSize: 14, color: "var(--ink-muted)" }}>Sin documentos. Los que recibas o hagas aquí quedan ligados a este asunto.</div>}
      <section className="as-sec" aria-label="Lo que se pide">
        <h3>Lo que se pide <span className="as-rl" style={{ fontWeight: 500 }}>· {cuentaDocumentos(docs)}</span></h3>
        <div className="as-card" style={{ padding: "4px 14px 14px", display: "grid", gap: 10 }}>
          {docs.map((d) => (
            <Desplegable key={d.clave} etiqueta={d.nombre} valor={d.estado} opciones={OPCIONES_DOC}
              alElegir={(v) => {
                if (!v || v === d.estado || ocupado) return;
                void alCambiar((e) => marcarDocumento(e, d.clave, v), `${d.nombre}: ${NOMBRE_DOC[v].toLowerCase()}`, (e) => marcarDocumento(e, d.clave, d.estado));
              }} />
          ))}
        </div>
      </section>
    </div>
  );
}

/** Notas (solo el equipo) o Actividad (notas y cambios juntos, como en el boceto). Las dos leen la misma ruta. */
function Bitacora({ id, modo }: { id: string; modo: "notas" | "actividad" }) {
  const [estado, setEstado] = useState<{ cargando: boolean; error: string | null; datos: Actividad[] }>({ cargando: true, error: null, datos: [] });
  const [intento, setIntento] = useState(0);
  const [nota, setNota] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [falla, setFalla] = useState<string | null>(null);
  useEffect(() => {
    const c = new AbortController();
    leerActividad<Actividad>(id, c.signal).then(
      (datos) => setEstado({ cargando: false, error: null, datos }),
      (e: unknown) => { if (!(e instanceof DOMException && e.name === "AbortError")) setEstado({ cargando: false, error: e instanceof Error ? e.message : "No se pudo cargar.", datos: [] }); },
    );
    return () => c.abort();
  }, [id, intento]);
  const sesion = useSession();
  const yo = sesion?.id ?? null;
  const esDirector = sesion?.role === "admin";
  const asesores = useColeccion<Asesor>("asesores");
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  useEffect(() => {
    if (!esDirector) return;
    const c = new AbortController();
    leerCuentas(c.signal).then(setCuentas, () => setCuentas([]));
    return () => c.abort();
  }, [esDirector]);
  const anotar = async () => {
    const texto = nota.trim();
    if (!texto || guardando) return;
    setGuardando(true); setFalla(null);
    try {
      const nueva = await anotarEnAsunto<Actividad>(id, texto);
      setEstado((s) => ({ ...s, datos: [nueva, ...s.datos] }));
      setNota("");
    } catch (e) { setFalla(e instanceof Error ? e.message : "No se guardó. Vuelve a intentarlo."); }
    finally { setGuardando(false); }
  };
  const notas = estado.datos.filter((a) => a.tipo === "nota");
  const lista = modo === "notas" ? notas : estado.datos;
  const autor = (a: Actividad) => autorDeNota(a.created_by, yo, cuentas, asesores.datos) ?? "Equipo";
  return (
    <div className="as-col">
      {modo === "notas" ? (
        <div className="as-notice"><Icono nombre="alerta" tamano={18} aria-hidden style={{ flex: "none", color: "var(--ink-muted)" }} /><span><b>Notas internas.</b> Solo las ve el equipo. Nunca salen en lo que se envía al cliente.</span></div>
      ) : null}
      <form className="as-escribir" onSubmit={(e) => { e.preventDefault(); void anotar(); }}>
        <label style={{ flex: 1, minWidth: 0, display: "flex" }}>
          <span className="pn-solo-lector">{modo === "notas" ? "Nota interna" : "Nota"}</span>
          <input type="text" value={nota} maxLength={1000} onChange={(e) => setNota(e.target.value)} placeholder={modo === "notas" ? "Escribe una nota interna" : "Escribe una nota"} autoComplete="off" />
        </label>
        <button type="submit" className="as-enviar" aria-label="Guardar nota" disabled={guardando || !nota.trim()}><Gesto nombre="derecha" tamano={18} /></button>
      </form>
      {falla ? <p role="alert" style={{ margin: 0, color: "var(--error)" }}>{falla}</p> : null}
      {estado.cargando ? <Cargando lineas={3} etiqueta="Cargando" /> : null}
      {estado.error ? <EstadoError texto={estado.error} alReintentar={() => { setEstado({ cargando: true, error: null, datos: [] }); setIntento((n) => n + 1); }} /> : null}
      {!estado.cargando && !estado.error && !lista.length ? <span style={{ fontSize: 14, color: "var(--ink-muted)" }}>{modo === "notas" ? "Todavía no hay notas en este asunto." : "Sin actividad todavía."}</span> : null}
      {modo === "notas" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {lista.map((a) => (
            <div key={a.id} className="as-nrow">
              <span className="as-av" aria-hidden>{iniciales(autor(a))}</span>
              <div className="as-nrow-txt"><span><b>{autor(a)}</b> · {cuandoFue(a.created_at)}</span><span>{a.descripcion}</span></div>
            </div>
          ))}
        </div>
      ) : (
        <ol className="as-log">
          {lista.map((a) => (
            <li key={a.id}>
              {a.tipo === "nota" ? <div className="as-bubble">{a.descripcion}</div> : <div className="as-evt">{a.descripcion}</div>}
              <span className="as-when">{[a.tipo === "nota" ? autor(a) : null, cuandoFue(a.created_at)].filter(Boolean).join(" · ")}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/** Las hojas del asunto (boceto): Tipo y estado, Posponer, Poner en espera, Cerrar, Crear documento, Subir archivo y Personas. */
function HojasDelAsunto({ hoja, setHoja, fila, expediente, avisos, personas, ocupado, alCambiar, sigue, personasTodas, alGuardarAsunto, alRecargar, alVerPersona, sinTabla, guardarPersona, miAsesor }: {
  hoja: HojaAsunto; setHoja: (h: HojaAsunto) => void; fila: FilaAsunto; expediente: Expediente; avisos: readonly AvisoAsunto[];
  personas: readonly Persona[]; ocupado: boolean; alCambiar: PedirCambio; sigue: AccionesSigue;
  personasTodas: readonly Cliente[]; alGuardarAsunto: (cambio: CambioAsunto) => Promise<boolean>; alRecargar: () => void; alVerPersona: (personaId: string) => void;
  sinTabla: boolean; guardarPersona: (id: string, c: Cliente) => Promise<unknown>; miAsesor: string | null;
}) {
  const { avisar } = useAvisos();
  const router = useRouter();
  const [hoy] = useState(() => new Date());
  const cerrar = () => setHoja(null);
  // Poner en espera
  const [queEspera, setQueEspera] = useState("");
  const [volver, setVolver] = useState<string | null>(null);
  // Cerrar
  const [como, setComo] = useState<"logro" | "no">("logro");
  const [motivo, setMotivo] = useState<(typeof MOTIVOS_NO_SE_DIO)[number] | "">("");
  const [detalle, setDetalle] = useState("");
  // Posponer
  const [otraFecha, setOtraFecha] = useState<string | null>(fila.sigue?.fecha ?? null);
  // Título
  const [titulo, setTitulo] = useState(fila.titulo);
  // Agregar persona
  const [nuevaPersona, setNuevaPersona] = useState("");
  const [papel, setPapel] = useState<Papel | "">("compra");
  const [sumando, setSumando] = useState(false);
  // «Persona nueva»: alta corta (nombre y teléfono o correo) que queda en Personas y se liga con su papel.
  const [origen, setOrigen] = useState<"existe" | "nueva">("existe");
  const [alta, setAlta] = useState<DatosAlta>(ALTA_VACIA);
  const [intentoAlta, setIntentoAlta] = useState(false);
  const yaEstan = new Set(personas.map((p) => `${p.id}|${p.papelClave ?? ""}`));
  const candidatas = [...personasTodas].sort((a, b) => (a.nombre ?? "").localeCompare(b.nombre ?? "", "es"));
  const limpiarAgregar = () => { setNuevaPersona(""); setAlta(ALTA_VACIA); setIntentoAlta(false); setOrigen("existe"); };
  const ligarConPapel = async (id: string, nombre: string, p: Papel, creada: boolean) => {
    const ok = await sumarPersona(expediente.id, id, p);
    if (!ok) {
      if (creada) { cerrar(); limpiarAgregar(); }
      avisar(creada
        ? `${nombre} quedó en Personas. Sumarla al asunto con su papel llega con la siguiente actualización del servidor.`
        : "Sumar personas con su papel llega con la siguiente actualización del servidor. Por ahora el asunto muestra a la persona principal.");
      return;
    }
    alRecargar(); cerrar(); limpiarAgregar();
    avisar(`${nombre} en el asunto: ${PAPELES[p].toLowerCase()}`, { etiqueta: "Deshacer", alAccionar: () => { quitarPersona(expediente.id, id, p).then(alRecargar, (e: unknown) => avisar(e instanceof Error ? e.message : "No se pudo deshacer.")); } });
  };
  const sumar = async () => {
    if (!papel || sumando) return;
    if (origen === "nueva") {
      setIntentoAlta(true);
      if (faltaAlta(alta)) return;
    } else if (!nuevaPersona) return;
    setSumando(true);
    try {
      if (origen === "nueva") {
        const c = personaDeAlta(alta, papel, miAsesor);
        await guardarPersona(c.id, c);
        await ligarConPapel(c.id, c.nombre, papel, true);
      } else {
        await ligarConPapel(nuevaPersona, personasTodas.find((c) => c.id === nuevaPersona)?.nombre?.trim() || "La persona", papel, false);
      }
    } catch (e) { avisar(e instanceof Error ? e.message : "No se guardó. Vuelve a intentarlo."); }
    finally { setSumando(false); }
  };
  const tipoActual: TipoAsunto = (expediente.tipo_asunto && expediente.tipo_asunto in { venta: 1, renta: 1, busqueda: 1, tramite: 1, inversion: 1, revision: 1, otro: 1 })
    ? expediente.tipo_asunto as TipoAsunto : tipoDeOperacion(expediente.operacion);
  // Crear documento y subir archivo
  const [formato, setFormato] = useState("");
  const [creando, setCreando] = useState(false);
  const [esDoc, setEsDoc] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const archivo = useRef<HTMLInputElement>(null);
  const entradas = useMemo(() => catalogo(), []);
  const grupo = GRUPO[expediente.operacion];
  const sugeridos = entradas.filter((e) => grupo && e.grupo === grupo);
  const resto = entradas.filter((e) => !grupo || e.grupo !== grupo);
  const tiposDe04 = entradas.find((e) => e.id === "04")?.tipos ?? [];
  const docs = documentosDelAsunto(expediente);
  const anterior = expediente.flujo ? { ...expediente.flujo } : null;
  const deshacerEstado = anterior ? (e: Expediente) => ({ ...reanudar(e), etapa: expediente.etapa, flujo: { ...anterior } }) : undefined;

  const abrirFormato = async (id: string) => {
    if (creando) return;
    setCreando(true);
    try { const d = await crearDocumento(expediente.id, id); router.push(`/panel/formatos/${d.id}`); }
    catch (e) { avisar(e instanceof Error ? e.message : "No se pudo crear. Vuelve a intentarlo."); setCreando(false); }
  };
  const subir = async (f: File) => {
    if (f.size > 20 * 1024 * 1024) { avisar("El archivo pasa de 20 MB."); return; }
    setSubiendo(true);
    try {
      const carga = await subirATemporal(f);
      const d = docs.find((x) => x.clave === esDoc);
      await guardarEnAsunto(expediente.id, carga, (d?.nombre ?? f.name.replace(/\.[^.]+$/, "")).slice(0, 160));
      cerrar(); setEsDoc("");
      if (d && d.estado !== "recibido") void alCambiar((e) => marcarDocumento(e, d.clave, "recibido"), `${d.nombre}: recibido`, (e) => marcarDocumento(e, d.clave, d.estado));
      else avisar("Archivo guardado en el asunto");
    } catch (e) { avisar(e instanceof Error ? e.message : "No se pudo subir. Vuelve a intentarlo."); }
    finally { setSubiendo(false); if (archivo.current) archivo.current.value = ""; }
  };

  const fila3 = (titulo: string, ayuda: string, alPulsar: () => void, actual?: boolean) => (
    <button type="button" className="as-opt" onClick={alPulsar} aria-current={actual || undefined}><span>{titulo}<span className="as-h">{ayuda}</span></span>{actual ? <Gesto nombre="palomita" tamano={16} /> : null}</button>
  );

  return (
    <>
      <Hoja abierta={hoja === "meta"} titulo="Tipo y estado" alCerrar={cerrar}>
        <span className="as-fh">Estado</span>
        <div className="as-card">
          {fila3("Activo", "Estás trabajando en él", () => { cerrar(); if (fila.estado !== "activo") void alCambiar(reabrir, fila.estado === "cerrado" ? "Asunto reabierto" : "Asunto activo de nuevo", deshacerEstado); }, fila.estado === "activo")}
          {fila3("En espera…", "Depende de alguien más; te lo recordamos", () => setHoja("espera"), fila.estado === "espera")}
          {fila.estado === "cerrado"
            ? fila3("Reabrir", "Vuelve a activo", () => { cerrar(); void alCambiar(reabrir, "Asunto reabierto", deshacerEstado); })
            : fila3("Cerrar el asunto…", "Se logró o no se dio; se puede reabrir", () => setHoja("cerrar"))}
        </div>
        <Desplegable etiqueta="Tipo" valor={tipoActual} opciones={OPCIONES_TIPO_ASUNTO}
          alElegir={(t) => { if (t && t !== tipoActual && !ocupado) void alGuardarAsunto({ tipo: t }).then((ok) => { if (ok) cerrar(); }); }} />
        <p className="as-nota-hoja">El tipo solo ordena y sugiere documentos; no cambia lo que puedes hacer.</p>
      </Hoja>

      <Hoja abierta={hoja === "posponer"} titulo="Posponer" alCerrar={cerrar}>
        {fila.sigue ? (
          <>
            <p className="as-nota-hoja">{textoSigue(fila.sigue)}</p>
            <DesplegableFecha etiqueta="Nueva fecha" valor={otraFecha} alElegir={setOtraFecha} hoy={hoy} />
            <Boton bloque deshabilitado={ocupado} onClick={() => { const s = fila.sigue; if (!s) return; void sigue.alPosponer(s.id, otraFecha).then((ok) => { if (ok) cerrar(); }); }}>Posponer</Boton>
          </>
        ) : <p className="as-nota-hoja">No hay nada que posponer.</p>}
      </Hoja>

      <Hoja abierta={hoja === "espera"} titulo="Poner en espera" alCerrar={cerrar}>
        <form style={{ display: "grid", gap: 14 }} onSubmit={(e) => {
          e.preventDefault();
          const que = queEspera.trim();
          if (!que || ocupado) return;
          void alCambiar((x) => ponerEnEspera(x, que), volver ? `En espera · vuelves a preguntar el ${diaLargo(volver)}` : "En espera", deshacerEstado).then((ok) => {
            if (!ok) return;
            if (volver) void sigue.alAnotar(`Volver a preguntar: ${que.charAt(0).toLowerCase()}${que.slice(1)}`, volver);
            setQueEspera(""); setVolver(null); cerrar();
          });
        }}>
          <Campo etiqueta="Qué esperas" placeholder="Ej. El avalúo del banco" maxLength={300} value={queEspera} onChange={(e) => setQueEspera(e.target.value)} autoComplete="off" />
          <DesplegableFecha etiqueta="Volver a preguntar" valor={volver} alElegir={setVolver} hoy={hoy} sinFecha="Sin fecha" />
          <Boton type="submit" bloque deshabilitado={ocupado || !queEspera.trim()}>Poner en espera</Boton>
        </form>
      </Hoja>

      <Hoja abierta={hoja === "cerrar"} titulo="Cerrar el asunto" alCerrar={cerrar}>
        <Interruptor etiqueta="Cómo terminó" valor={como} alElegir={setComo} opciones={[{ valor: "logro", etiqueta: "Se logró" }, { valor: "no", etiqueta: "No se dio" }]} />
        {como === "no" ? (
          <>
            <Desplegable etiqueta="Por qué" valor={motivo} vacio="Elige el motivo" alElegir={setMotivo} opciones={MOTIVOS_NO_SE_DIO.map((m) => ({ valor: m, etiqueta: m }))} />
            <Campo etiqueta="Detalle (opcional)" maxLength={300} value={detalle} onChange={(e) => setDetalle(e.target.value)} />
          </>
        ) : avisos.length ? <p className="as-nota-hoja">Quedan {avisos.length === 1 ? "1 aviso" : `${avisos.length} avisos`} sin completar; se cierra igual y se anota.</p> : null}
        <p className="as-nota-hoja">Las personas siguen siendo clientes de Fortius y el asunto se puede reabrir.</p>
        <Boton bloque deshabilitado={ocupado || (como === "no" && !motivo)} onClick={() => {
          const pendientes = avisos.map((a) => a.texto);
          const hecho = como === "logro"
            ? alCambiar(seLogro, pendientes.length ? `Asunto cerrado: se logró. Quedó pendiente: ${pendientes[0]}${pendientes.length > 1 ? ` y ${pendientes.length - 1} más` : ""}` : "Asunto cerrado: se logró", deshacerEstado)
            : motivo ? alCambiar((x) => noSeDio(x, motivo, detalle), "Asunto cerrado", deshacerEstado) : Promise.resolve(false);
          void hecho.then((ok) => { if (ok) { setMotivo(""); setDetalle(""); setComo("logro"); cerrar(); } });
        }}>Cerrar</Boton>
      </Hoja>

      <Hoja abierta={hoja === "documento"} titulo="Crear documento" alCerrar={() => { cerrar(); setFormato(""); }}>
        <p className="as-nota-hoja">Se abre en su ventana, con los datos del asunto ya llenos.</p>
        {formato === "04" ? (
          <>
            <span className="as-fh">Tipo de inmueble del levantamiento</span>
            <div className="as-card">{tiposDe04.map((t) => <button key={t.valor} type="button" className="as-opt" disabled={creando} onClick={() => void abrirFormato(t.valor)}>{t.etiqueta}</button>)}</div>
            <Boton variante="texto" onClick={() => setFormato("")}>Volver a los formatos</Boton>
          </>
        ) : (
          <>
            {sugeridos.length ? (<><span className="as-fh">Para este tipo de asunto</span>
              <div className="as-card">{sugeridos.map((e) => <button key={e.id} type="button" className="as-opt" disabled={creando} onClick={() => (e.id === "04" ? setFormato("04") : void abrirFormato(e.id))}><span>{e.numero} · {e.titulo}<span className="as-h">{e.queEs}</span></span></button>)}</div></>) : null}
            <span className="as-fh">Todos los formatos</span>
            <div className="as-card">{resto.map((e) => <button key={e.id} type="button" className="as-opt" disabled={creando} onClick={() => (e.id === "04" ? setFormato("04") : void abrirFormato(e.id))}><span>{e.numero} · {e.titulo}<span className="as-h">{e.queEs}</span></span></button>)}</div>
          </>
        )}
      </Hoja>

      <Hoja abierta={hoja === "subir"} titulo="Subir archivo" alCerrar={cerrar}>
        <Desplegable etiqueta="¿Qué documento es?" valor={esDoc} vacio="Otro documento" alElegir={setEsDoc} opciones={docs.map((d) => ({ valor: d.clave, etiqueta: d.nombre }))} />
        <input ref={archivo} type="file" accept="application/pdf,image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void subir(f); }} />
        <Boton bloque deshabilitado={subiendo} onClick={() => archivo.current?.click()}>{subiendo ? "Subiendo…" : "Elegir archivo"}</Boton>
        <p className="as-nota-hoja">PDF o foto, hasta 20 MB. Queda guardado en este asunto y no se publica en el sitio.</p>
      </Hoja>

      <Hoja abierta={hoja === "titulo"} titulo="Cambiar el título" alCerrar={cerrar}>
        <form style={{ display: "grid", gap: 14 }} onSubmit={(e) => {
          e.preventDefault();
          const t = titulo.trim();
          if (!t || t === fila.titulo || ocupado) { if (t === fila.titulo) cerrar(); return; }
          void alGuardarAsunto({ titulo: t }).then((ok) => { if (ok) cerrar(); });
        }}>
          <Campo etiqueta="Título" placeholder="Ej. Venta de la casa de Mariana" maxLength={160} value={titulo} onChange={(e) => setTitulo(e.target.value)} autoComplete="off" />
          <Boton type="submit" bloque deshabilitado={ocupado || !titulo.trim()}>Guardar</Boton>
        </form>
      </Hoja>

      <Hoja abierta={hoja === "agregar"} titulo="Agregar persona" alCerrar={cerrar}>
        <form noValidate style={{ display: "grid", gap: 14 }} onSubmit={(e) => { e.preventDefault(); void sumar(); }}>
          <Interruptor etiqueta="Quién" valor={origen} alElegir={setOrigen} opciones={[{ valor: "existe", etiqueta: "Ya está en Personas" }, { valor: "nueva", etiqueta: "Persona nueva" }]} />
          {origen === "existe" ? (
            <Desplegable etiqueta="Persona" valor={nuevaPersona} vacio="Elige de Personas…" alElegir={setNuevaPersona}
              opciones={candidatas.filter((c) => !papel || !yaEstan.has(`${c.id}|${papel}`)).map((c) => ({ valor: c.id, etiqueta: `${c.nombre?.trim() || "Sin nombre"}${c.telefono ? ` · ${c.telefono}` : ""}` }))}
              ayuda="Si no está, elige «Persona nueva» y dala de alta aquí." />
          ) : (
            <AltaPersona valor={alta} alCambiar={setAlta} personas={personasTodas} intento={intentoAlta}
              alUsarExistente={(id) => { setNuevaPersona(id); setOrigen("existe"); setAlta(ALTA_VACIA); setIntentoAlta(false); }} />
          )}
          <Desplegable etiqueta="Su papel en este asunto" valor={papel} vacio="Elige…" alElegir={setPapel} opciones={OPCIONES_PAPEL} />
          {sinTabla ? <p className="as-nota-hoja">Por ahora el asunto muestra solo a la persona principal. Sumar más, cada una con su papel, llega con la siguiente actualización del servidor{origen === "nueva" ? "; la persona nueva queda guardada en Personas" : ""}.</p> : null}
          {origen === "nueva" ? <p className="as-nota-hoja">Queda en Personas a tu nombre. Lo demás se completa después en su ficha.</p> : null}
          <Boton type="submit" bloque deshabilitado={sumando || !papel || (origen === "existe" && !nuevaPersona)}>{sumando ? "Agregando…" : origen === "nueva" ? "Crear y agregar" : "Agregar"}</Boton>
        </form>
      </Hoja>

      <Hoja abierta={hoja === "personas"} titulo="Personas del asunto" alCerrar={cerrar}>
        <div className="as-card">
          {personas.map((p) => (
            <div key={`${p.id}-${p.papelClave ?? "principal"}`} className="as-prow">
              <span className="as-av" aria-hidden>{iniciales(p.nombre)}</span>
              <span className="as-prow-txt"><button type="button" className="as-nm" onClick={() => { cerrar(); alVerPersona(p.id); }}>{p.nombre}</button><span className="as-rl">{p.papel}</span></span>
              {p.telefono ? <a className="as-icon" href={`tel:${soloDigitos(p.telefono)}`} aria-label={`Llamar a ${p.nombre}`}><Icono nombre="llamada" tamano={20} /></a> : null}
              {p.telefono ? <a className="as-icon" href={enlaceWhatsApp(p.telefono)} target="_blank" rel="noopener" aria-label={`WhatsApp con ${p.nombre}`}><Icono nombre="mensaje" tamano={20} /></a> : null}
            </div>
          ))}
        </div>
      </Hoja>
    </>
  );
}
