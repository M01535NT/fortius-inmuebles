"use client";
import Link from "next/link";
import { useEffect, useId, useMemo, useState } from "react";

import { AsuntosDe } from "@/components/panel/asuntos/asuntos-de";
import { useColeccion } from "@/components/panel/datos/use-coleccion";
import { Avatar, copiarTexto, FilaDato, GrupoDatos, MenuMas, Pestanas, type ItemMenu } from "@/components/panel/fichas/piezas";
import { MenuCompartirFila } from "@/components/panel/inmuebles/compartir";
import { FormularioInmueble } from "@/components/panel/inmuebles/formulario";
import { HistorialInmueble } from "@/components/panel/inmuebles/historial";
import { CambiarPrecio } from "@/components/panel/inmuebles/precio";
import { LlavesInmueble, PropietarioInmueble } from "@/components/panel/inmuebles/seguimiento";
import { FotosInmueble, PublicarInmueble, TextosSitio } from "@/components/panel/inmuebles/sitio";
import { AgendarVisita } from "@/components/panel/inmuebles/visita";
import { Gesto, Icono } from "@/components/panel/icons";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Boton, BotonEnlace } from "@/components/panel/kit/boton";
import { Campo } from "@/components/panel/kit/campo";
import { HojaAdaptable } from "@/components/panel/ui/hoja-adaptable";
import { TIPO_LABELS, type Property } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import type { Asesor, Lead } from "@/lib/domain/records";
import { aTexto, diaLargo } from "@/lib/panel/calendario";
import { nuevaCita, seEmpalma, type DatosCita } from "@/lib/panel/datos/agenda-acciones";
import { pideComoFue, textoResultado, type EventoConResultado } from "@/lib/panel/datos/agenda-resultado";
import { leerMiAsesor } from "@/lib/panel/datos/colecciones";
import { compartirInmueble } from "@/lib/panel/datos/compartir";
import {
  anotarEnvio, avanzarInforme, cambiarPrecio, conExtras, DOCUMENTOS_INMUEBLE, ESTADO_DOC_LABELS, estadoDoc, estadoInteresado, extrasDe, informe, montoDe, siguienteDoc,
  type EstadoInteresado,
} from "@/lib/panel/datos/inmueble-extras";
import { anotarHistorialInmueble, type AnotarHistorial } from "@/lib/panel/datos/inmueble-historial";
import { datosLlaves, desligarPropietario, guardarLlaves, ligarPropietario, prestarLlaves, propietariosDe, regresaronLlaves } from "@/lib/panel/datos/inmueble-seguimiento";
import { agregarFotos, describirFoto, editarTextos, mostrarFoto, ordenarFotos, publicar, quitarDelSitio, quitarFoto } from "@/lib/panel/datos/inmueble-sitio";
import { editarInmueble, type DatosInmueble } from "@/lib/panel/datos/inmuebles-acciones";
import { avisosDe, comoVa, diasPublicado, enSitio, especificaciones, interesados, precioCorto, tipoYOperacion, type AvisoInmueble } from "@/lib/panel/datos/inmuebles-ficha";
import { rutaConsulta, rutaInmueble, rutaPersona } from "@/lib/panel/datos/relacionado";
import { KEY_PLACES } from "@/lib/propiedad-seguimiento";

type Pestana = "resumen" | "datos" | "interesados" | "docs";
type CampoEditable = { clave: string; etiqueta: string; valor: string; opciones?: readonly string[]; numero?: boolean; ayuda?: string; guardar: (v: string) => Property };
type Hoja = null | { de: string } & ({ que: "precio" | "propietario" | "llaves" | "visita" } | { que: "campo"; campo: CampoEditable });

const PAGOS_VENTA = ["Contado", "Crédito bancario", "Infonavit o Fovissste", "Infonavit, bancario o contado", "Crédito bancario o Infonavit"] as const;
const PAGOS_RENTA = ["Depósito y un mes por adelantado", "Depósito de dos meses", "Con aval o fiador", "Con póliza jurídica"] as const;
const MUNICIPIOS = ["Tijuana", "Rosarito", "Tecate", "Ensenada", "Mexicali"] as const;
const numero = (t: string) => { const n = Number.parseFloat(t.replace(/[^0-9.]/g, "")); return Number.isFinite(n) && n > 0 ? n : undefined; };

/**
 * Panel de un inmueble como el boceto (16/11/2026): fotos, precio y título, Compartir · Visita · Llegar, avisos (nada
 * frena) y pestañas Resumen, Datos, Interesados y Docs. Guardar nunca publica; publicar pasa por la revisión del servidor.
 * Lo que aún no tiene columna (comisión, documentos, informe, dirección exacta) viaja como dato privado del registro.
 * «Agendar visita» abre su hoja aquí mismo y guarda en la Agenda; publicar, quitar, precio y dirección exacta quedan en el historial.
 */
export function DetalleInmueble({ inmueble, guardar, personas, guardarPersona }: {
  inmueble: Property;
  /** `guardar` de useColeccion<Property>("propiedades") de quien lo usa. */
  guardar: (slug: string, data: Property, alAvisos?: (avisos: string[]) => void) => Promise<Property>;
  personas: Cliente[];
  /** `guardar` de useColeccion<Cliente>("clientes") de quien lo usa. */
  guardarPersona: (id: string, data: Cliente) => Promise<Cliente>;
}) {
  const { avisar } = useAvisos();
  // La edición, la pestaña y las hojas quedan ligadas al slug: al cambiar de inmueble se vuelve a la lectura.
  const [editandoSlug, setEditandoSlug] = useState<string | null>(null);
  const editando = editandoSlug === inmueble.slug;
  const [pestanaDe, setPestanaDe] = useState<{ slug: string; p: Pestana }>({ slug: inmueble.slug, p: "resumen" });
  const pestana = pestanaDe.slug === inmueble.slug ? pestanaDe.p : "resumen";
  const setPestana = (p: Pestana) => setPestanaDe({ slug: inmueble.slug, p });
  const [hojaDe, setHoja] = useState<Hoja>(null);
  const hoja = hojaDe && hojaDe.de === inmueble.slug ? hojaDe : null;
  const cerrarHoja = () => setHoja(null);
  const [ocupado, setOcupado] = useState(false);
  const [miAsesor, setMiAsesor] = useState<string | null>(null);
  useEffect(() => { const c = new AbortController(); leerMiAsesor(c.signal).then(setMiAsesor); return () => c.abort(); }, []);
  const asesores = useColeccion<Asesor>("asesores");
  const leads = useColeccion<Lead>("leads");
  const eventos = useColeccion<EventoConResultado>("eventos");
  const [ahora] = useState(() => new Date());
  const [hoy] = useState(() => aTexto(new Date()));
  const [foto, setFoto] = useState(0);
  // Sube cada vez que se anota algo en el historial, para que la sección lo vuelva a leer.
  const [historialN, setHistorialN] = useState(0);
  // Quién registra un préstamo de llaves o un envío: el nombre de su ficha de asesor, o «Dirección».
  const quien = useMemo(() => asesores.datos.find((a) => a.id === miAsesor)?.nombre ?? "Dirección", [asesores.datos, miAsesor]);

  const p = inmueble;
  const x = extrasDe(p);
  const va = useMemo(() => comoVa(p, { leads: leads.datos, eventos: eventos.datos, hoy }), [p, leads.datos, eventos.datos, hoy]);
  const avisos = useMemo(() => avisosDe(p, personas, { consultas: va.consultas, hoy: ahora }), [p, personas, va.consultas, ahora]);
  const quieren = useMemo(() => interesados(p, { clientes: personas, leads: leads.datos })
    .map((i) => ({ ...i, estado: estadoInteresado(p, i, eventos.datos, hoy) })), [p, personas, leads.datos, eventos.datos, hoy]);
  const nuevos = quieren.filter((i) => i.estado === "Nuevo");
  const ligados = propietariosDe(personas, p.slug);
  const dias = diasPublicado(p, ahora);
  const sitio = enSitio(p);
  const origen = typeof window === "undefined" ? "http://localhost" : window.location.origin;
  const comp = compartirInmueble(p, origen);
  const copiar = (t: string, que: string) => copiarTexto(t, avisar, que);
  const mapa = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([p.direccionAproximada, p.zona, x.municipio ?? "Tijuana"].filter(Boolean).join(", "))}`;
  const fotos = p.galeria.filter((g) => !g.oculta);
  const visitas = useMemo(() => eventos.datos.filter((e) => e.tipo === "visita" && e.propiedadSlug === p.slug)
    .sort((a, b) => (b.fecha + (b.hora ?? "")).localeCompare(a.fecha + (a.hora ?? ""))).slice(0, 6), [eventos.datos, p.slug]);

  // Quitar del sitio o volver a publicarlo no ofrece Deshacer: publicar pasa por la revisión del servidor (COR-16).
  // Devuelve si se guardó, para anotar en el historial solo lo que de verdad quedó.
  const cambiarInmueble = async (previo: Property, siguiente: Property, texto: string, deshacer = true, alAvisos?: (avisos: string[]) => void): Promise<boolean> => {
    setOcupado(true);
    try {
      await guardar(previo.slug, siguiente, alAvisos);
      const tocaSitio = previo.publicada !== siguiente.publicada;
      if (!deshacer || tocaSitio) { avisar(texto); return true; }
      avisar(texto, { etiqueta: "Deshacer", alAccionar: () => {
        guardar(previo.slug, previo).then(() => avisar("Se deshizo"), (e: unknown) => avisar(e instanceof Error ? e.message : "No se pudo deshacer."));
      } });
      return true;
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se guardó. Vuelve a intentarlo.");
      return false;
    } finally { setOcupado(false); }
  };
  // Historial del inmueble: se anota después de guardar y nunca frena (si el servidor aún no lo tiene, no pasa nada).
  const anotar = (slug: string, d: AnotarHistorial) => { void anotarHistorialInmueble(slug, d).then((ok) => { if (ok) setHistorialN((n) => n + 1); }); };
  /** Guarda y, si salió del sitio por este cambio, lo anota con el motivo. */
  const cambiarYAnotarSalida = (previo: Property, siguiente: Property, texto: string, motivo: string) =>
    void cambiarInmueble(previo, siguiente, texto).then((ok) => { if (ok && previo.publicada && !siguiente.publicada) anotar(previo.slug, { accion: "quitar_sitio", resumen: `Se quitó del sitio: ${motivo}` }); });
  const agendarVisita = async (d: DatosCita, persona?: string) => {
    setOcupado(true);
    try {
      const n = nuevaCita({ ...d, propiedadSlug: inmueble.slug, asesorId: miAsesor }, persona);
      const choque = n.hora ? seEmpalma(n, eventos.datos) : null;
      await eventos.guardar(n.id, n);
      setHoja(null);
      avisar(`Visita agendada: ${diaLargo(n.fecha)}${n.hora ? `, ${n.hora}` : ""}${choque ? `. ${choque}` : ""}`, {
        etiqueta: "Deshacer",
        alAccionar: () => { eventos.borrar(n.id).then(() => avisar("Se quitó la visita"), (e: unknown) => avisar(e instanceof Error ? e.message : "No se pudo deshacer.")); },
      });
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se agendó. Vuelve a intentarlo.");
    } finally { setOcupado(false); }
  };
  const cambiarPersona = async (previa: Cliente, siguiente: Cliente, texto: string) => {
    setOcupado(true);
    try {
      await guardarPersona(previa.id, siguiente);
      avisar(texto, { etiqueta: "Deshacer", alAccionar: () => {
        guardarPersona(previa.id, previa).then(() => avisar("Se deshizo"), (e: unknown) => avisar(e instanceof Error ? e.message : "No se pudo deshacer."));
      } });
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se guardó. Vuelve a intentarlo.");
    } finally { setOcupado(false); }
  };
  const guardarCambios = async (previo: Property, d: DatosInmueble) => {
    setEditandoSlug(null);
    await cambiarInmueble(previo, editarInmueble(previo, d), "Cambios guardados");
  };

  if (editando) {
    return <FormularioInmueble key={p.slug} inmueble={p} ocupado={ocupado} alGuardar={(d) => void guardarCambios(p, d)} alCancelar={() => setEditandoSlug(null)} />;
  }

  const abrir = (que: "precio" | "propietario" | "llaves" | "visita") => setHoja({ de: p.slug, que });
  const resolver = (a: AvisoInmueble) => {
    if (a.accion === "precio") abrir("precio");
    else if (a.accion === "fotos") setPestana("datos");
    else if (a.accion === "docs") setPestana("docs");
    else abrir("propietario");
  };

  const guardarPrecio = (monto: number, avisarles: boolean) => {
    cerrarHoja();
    let sig = cambiarPrecio(p, monto);
    let texto = `Precio: ${precioCorto(sig)}`;
    if (avisarles && quieren.length) {
      const mensaje = [`Cambió el precio de ${p.titulo}${p.zona ? `, ${p.zona}` : ""}: ${precioCorto(sig)}.`, comp.publico ? comp.enlace : ""].filter(Boolean).join(" ");
      copiarTexto(mensaje, () => undefined);
      sig = anotarEnvio(sig, quieren, quien);
      texto += ` · mensaje copiado para ${quieren.length === 1 ? "1 interesado" : `${quieren.length} interesados`}`;
    }
    const antes = montoDe(p);
    void cambiarInmueble(p, sig, texto).then((ok) => {
      if (ok && antes !== monto) anotar(p.slug, { accion: "precio", resumen: antes ? `Precio: de ${precioCorto(p)} a ${precioCorto(sig)}` : `Precio puesto: ${precioCorto(sig)}`, detalle: { antes, despues: monto } });
    });
  };
  const enviarANuevos = () => {
    if (!comp.publico || !nuevos.length) return;
    copiarTexto(comp.texto, () => undefined);
    void cambiarInmueble(p, anotarEnvio(p, nuevos, quien), `Texto y enlace copiados. ${nuevos.length === 1 ? "1 persona quedó" : `${nuevos.length} personas quedaron`} como «Le enviaste la ficha»`);
  };

  const vendido = p.operacion === "renta" ? "rentada" : "vendida";
  const menu: ItemMenu[] = [
    { etiqueta: "Cambiar precio", alPulsar: () => abrir("precio") },
    p.estado === "apartada" || p.estado === vendido
      ? { etiqueta: "Disponible de nuevo", alPulsar: () => void cambiarInmueble(p, { ...p, estado: "disponible" }, "Disponible de nuevo") }
      : p.estado === "evaluacion"
        ? { etiqueta: "Pasar a disponible", alPulsar: () => void cambiarInmueble(p, { ...p, estado: "disponible" }, "Ya está disponible; publícalo cuando quieras") }
        : { etiqueta: "Marcar como apartado", alPulsar: () => void cambiarInmueble(p, { ...p, estado: "apartada" }, "Marcado como apartado") },
    ...(p.estado !== vendido && p.estado !== "evaluacion" ? [{
      etiqueta: `Marcar como ${p.operacion === "renta" ? "rentado" : "vendido"}`,
      alPulsar: () => cambiarYAnotarSalida(p, quitarDelSitio({ ...p, estado: vendido }), `Marcado como ${p.operacion === "renta" ? "rentado" : "vendido"}${p.publicada ? " y quitado del sitio" : ""}`, p.operacion === "renta" ? "se rentó" : "se vendió"),
    }] : []),
    { etiqueta: "Editar datos", alPulsar: () => setEditandoSlug(p.slug), separar: true },
    { etiqueta: "Copiar enlace para el equipo", alPulsar: () => copiar(new URL(rutaInmueble(p.codigo), origen).toString(), "Enlace a la ficha copiado") },
    x.archivado
      ? { etiqueta: "Sacar del archivo", alPulsar: () => void cambiarInmueble(p, conExtras(p, { archivado: undefined }), "Volvió a la lista"), separar: true }
      : { etiqueta: "Archivar", alPulsar: () => cambiarYAnotarSalida(p, conExtras(quitarDelSitio(p), { archivado: true }), `${p.titulo} archivado${p.publicada ? " y quitado del sitio" : ""}`, "se archivó"), separar: true },
  ];

  const inf = informe(p);
  const llaves = datosLlaves(p);
  const textoLlaves = llaves.prestadas[0] ? `Las tiene ${llaves.prestadas[0].persona}`
    : llaves.lugar ? [KEY_PLACES[llaves.lugar], llaves.detalle].filter(Boolean).join(" · ") : "";

  const resumen = (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <section className="fx-seccion">
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Cómo va</h3>
        {p.publicada ? (
          <>
            <div className="fx-tarjeta fx-stats">
              <div><b>{va.consultas}</b><span>{va.consultas === 1 ? "contacto" : "contactos"}</span></div>
              <div><b>{visitas.length}</b><span>{visitas.length === 1 ? "visita" : "visitas"}</span></div>
              <div><b>{quieren.length}</b><span>{quieren.length === 1 ? "interesado" : "interesados"}</span></div>
            </div>
            <span className="fx-chico">Desde que se publicó, hace {dias ?? 0} {dias === 1 ? "día" : "días"}</span>
          </>
        ) : (
          <div className="fx-tarjeta" style={{ padding: "14px 16px", fontSize: 14, color: "var(--ink-muted)" }}>Sin publicar. Cuando lo publiques, aquí verás contactos y visitas.</div>
        )}
        <div className="fx-tarjeta" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", padding: "12px 14px 12px 16px" }}>
          <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
            <b style={{ fontSize: 14, fontWeight: 600 }}>Informe al propietario</b>
            <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>{ligados.length ? inf.texto || "Todavía no se ha preparado" : "Liga primero al propietario"}</span>
          </span>
          <Boton variante="secundario" deshabilitado={!ligados.length || ocupado}
            onClick={() => void cambiarInmueble(p, avanzarInforme(p, ahora), inf.siguiente === "entregar" ? "Informe marcado como entregado" : "Informe preparado: márcalo como entregado cuando lo envíes")}>{inf.boton}</Boton>
        </div>
      </section>

      <PublicarInmueble
        inmueble={p}
        propietarioLigado={ligados.length > 0}
        ocupado={ocupado}
        avisosExtra={avisos.filter((a) => a.accion === "docs").map((a) => `${a.texto}.`)}
        alPublicar={(alAvisos, aceptados) => void cambiarInmueble(p, publicar(p), "Publicado en el sitio", false, alAvisos).then((ok) => {
          if (!ok) return;
          anotar(p.slug, aceptados.length
            ? { accion: "publicar_asi", resumen: "Publicado con avisos pendientes («Publicar así»)", detalle: { avisos: [...aceptados] } }
            : { accion: "publicar", resumen: "Publicado en el sitio" });
        })}
        alQuitar={() => void cambiarInmueble(p, quitarDelSitio(p), "Se quitó del sitio", false).then((ok) => { if (ok) anotar(p.slug, { accion: "quitar_sitio", resumen: "Se quitó del sitio" }); })}
        direccionExacta={x.direccionExacta === true}
        alDireccionExacta={(v) => void cambiarInmueble(p, conExtras(p, { direccionExacta: v || undefined }), v ? (x.direccionCompleta ? "En el sitio se verá la dirección completa" : "Encendido. Escribe la dirección en Datos para que se vea") : "En el sitio se verá solo la colonia").then((ok) => {
          if (ok) anotar(p.slug, { accion: "direccion_exacta", resumen: v ? "Dirección exacta encendida: el sitio muestra la dirección completa" : "Dirección exacta apagada: el sitio muestra solo la colonia" });
        })}
      />

      <section className="fx-seccion">
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Propietario y llaves</h3>
        <div className="fx-tarjeta">
          {ligados.length ? ligados.map((c) => (
            <div key={c.id} className="fx-drow">
              <Link href={rutaPersona(c.id)} className="fx-dmain" style={{ flexDirection: "row", alignItems: "center", gap: 10, textDecoration: "none" }}>
                <Avatar nombre={c.nombre} />
                <span style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
                  <span className="fx-dv">{c.nombre}</span>
                  <span className="fx-dn">Propietario{c.telefono ? ` · ${c.telefono}` : ""}</span>
                </span>
              </Link>
              <button type="button" className="fx-dlink" onClick={() => abrir("propietario")}>Cambiar</button>
            </div>
          )) : (
            <div className="fx-drow">
              <div className="fx-dmain"><span className="fx-dk">Propietario</span><span className="fx-dv" data-vacio="">Sin propietario ligado</span></div>
              <button type="button" className="fx-dlink" data-acento="" onClick={() => abrir("propietario")}>Ligar</button>
            </div>
          )}
          <FilaDato etiqueta="Llaves" valor={textoLlaves} vacio="Sin indicar" nota={llaves.copias ? `${llaves.copias} ${llaves.copias === 1 ? "copia" : "copias"}` : undefined} alEditar={() => abrir("llaves")} />
        </div>
      </section>

      <section className="fx-seccion">
        <div className="fx-seccion-cab"><h3>Visitas</h3><button type="button" className="fx-enlace" onClick={() => abrir("visita")}>Agendar</button></div>
        {visitas.length ? (
          <div className="fx-tarjeta">
            {visitas.map((e) => {
              const futura = e.fecha >= hoy;
              return (
                <div key={e.id} className="fx-drow">
                  <Link href={`/panel/agenda?cita=${encodeURIComponent(e.id)}`} className="fx-dmain" style={{ textDecoration: "none" }}>
                    <span className="fx-dk">{diaLargo(e.fecha)}{e.hora ? ` · ${e.hora}` : ""}</span>
                    <span className="fx-dv">{e.titulo}</span>
                    <span className="fx-dn" style={futura ? { color: "var(--accent)", fontWeight: 600 } : undefined}>{e.resultado ? textoResultado(e.resultado) : futura ? "Programada" : "Sin anotar"}</span>
                  </Link>
                  {pideComoFue(e, ahora) ? <Link className="fx-dlink" data-acento="" href={`/panel/agenda?cita=${encodeURIComponent(e.id)}`} style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}>Cómo fue</Link> : null}
                </div>
              );
            })}
          </div>
        ) : <div className="fx-tarjeta" style={{ padding: "14px 16px", fontSize: 14, color: "var(--ink-muted)" }}>Todavía no hay visitas.</div>}
      </section>

      <HistorialInmueble slug={p.slug} recargar={historialN} />
    </div>
  );

  // Datos en tres grupos (boceto, función 6). Tocar un dato lo cambia; precio y tipo van por su propio paso.
  const f = (p.ficha ?? {}) as Record<string, number | string | undefined>;
  const conFicha = (k: string, v: string): Property => {
    const ficha = { ...f };
    const n = k === "antiguedad" ? v.trim() || undefined : numero(v);
    if (n === undefined) delete ficha[k]; else ficha[k] = n;
    return { ...p, ficha: ficha as Property["ficha"] };
  };
  const m2 = (v: number | string | undefined) => (typeof v === "number" ? `${v.toLocaleString("en-US")} m²` : "");
  const cuenta = (v: number | string | undefined) => (typeof v === "number" ? v.toLocaleString("en-US") : "");
  const campo = (c: CampoEditable) => () => setHoja({ de: p.slug, que: "campo", campo: c });
  const construido = p.tipo !== "terreno";
  const casa = p.tipo === "casa" || p.tipo === "departamento";
  const mant = p.costos?.mantenimientoMensual;
  const datos = (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}><Boton variante="secundario" onClick={() => setEditandoSlug(p.slug)}>Editar datos</Boton></div>
      <GrupoDatos titulo="Precio y condiciones" acciones={p.operacion === "venta" ? <>
        <BotonEnlace href={`/panel/herramientas/credito?inmueble=${encodeURIComponent(p.codigo)}`}>Calcular crédito</BotonEnlace>
        <BotonEnlace href={`/panel/herramientas/comision?inmueble=${encodeURIComponent(p.codigo)}`}>Calcular comisión</BotonEnlace>
      </> : undefined}>
        <FilaDato etiqueta={p.operacion === "renta" ? "Renta mensual" : "Precio"} valor={montoDe(p) ? precioCorto(p) : ""} vacio="Sin precio" avisoVacio alEditar={() => abrir("precio")} />
        <FilaDato etiqueta="Comisión acordada" valor={x.comisionAcordada} nota="Solo la ves tú y dirección"
          alEditar={campo({ clave: "comision", etiqueta: "Comisión acordada", valor: x.comisionAcordada ?? "", ayuda: "Ej. 5 % + IVA. Nunca sale al sitio.", guardar: (v) => conExtras(p, { comisionAcordada: v.trim() || undefined }) })} />
        <FilaDato etiqueta={p.operacion === "renta" ? "Condiciones de renta" : "Formas de pago"} valor={x.formasPago}
          alEditar={campo({ clave: "pago", etiqueta: p.operacion === "renta" ? "Condiciones de renta" : "Formas de pago", valor: x.formasPago ?? "", opciones: p.operacion === "renta" ? PAGOS_RENTA : PAGOS_VENTA, guardar: (v) => conExtras(p, { formasPago: v || undefined }) })} />
        {construido ? <FilaDato etiqueta="Mantenimiento" valor={mant ? `$${mant.toLocaleString("en-US")} al mes` : ""}
          alEditar={campo({ clave: "mant", etiqueta: "Mantenimiento mensual", valor: mant ? String(mant) : "", numero: true, guardar: (v) => { const n = numero(v); const costos = { ...(p.costos ?? {}) }; if (n === undefined) delete costos.mantenimientoMensual; else costos.mantenimientoMensual = n; return { ...p, costos }; } })} /> : null}
      </GrupoDatos>
      <GrupoDatos titulo="Características">
        <FilaDato etiqueta="Tipo" valor={TIPO_LABELS[p.tipo]} alEditar={() => setEditandoSlug(p.slug)} />
        {p.tipo !== "departamento" && p.tipo !== "oficina" && p.tipo !== "local" ? <FilaDato etiqueta="Terreno" valor={m2(f.terrenoM2)} alEditar={campo({ clave: "terrenoM2", etiqueta: "Terreno (m²)", valor: cuenta(f.terrenoM2), numero: true, guardar: (v) => conFicha("terrenoM2", v) })} /> : null}
        {construido ? <>
          <FilaDato etiqueta="Construcción" valor={m2(f.construccionM2)} alEditar={campo({ clave: "construccionM2", etiqueta: "Construcción (m²)", valor: cuenta(f.construccionM2), numero: true, guardar: (v) => conFicha("construccionM2", v) })} />
          {casa ? <FilaDato etiqueta="Recámaras" valor={cuenta(f.recamaras)} alEditar={campo({ clave: "recamaras", etiqueta: "Recámaras", valor: cuenta(f.recamaras), numero: true, guardar: (v) => conFicha("recamaras", v) })} /> : null}
          <FilaDato etiqueta="Baños" valor={cuenta(f.banos)} alEditar={campo({ clave: "banos", etiqueta: "Baños", valor: cuenta(f.banos), numero: true, guardar: (v) => conFicha("banos", v) })} />
          <FilaDato etiqueta="Estacionamientos" valor={cuenta(f.estacionamientos)} alEditar={campo({ clave: "estacionamientos", etiqueta: "Estacionamientos", valor: cuenta(f.estacionamientos), numero: true, guardar: (v) => conFicha("estacionamientos", v) })} />
          <FilaDato etiqueta="Antigüedad" valor={typeof f.antiguedad === "string" ? f.antiguedad : ""} alEditar={campo({ clave: "antiguedad", etiqueta: "Antigüedad", valor: typeof f.antiguedad === "string" ? f.antiguedad : "", ayuda: "Ej. 8 años o Nuevo.", guardar: (v) => conFicha("antiguedad", v) })} />
        </> : null}
      </GrupoDatos>
      <GrupoDatos titulo="Ubicación">
        <FilaDato etiqueta="Dirección" valor={x.direccionCompleta} nota={x.direccionExacta ? "Se verá en el sitio" : "En el sitio solo se ve la colonia"}
          alEditar={campo({ clave: "direccion", etiqueta: "Dirección", valor: x.direccionCompleta ?? "", ayuda: "Calle, número e interior. Es privada mientras «Dirección exacta» esté apagada.", guardar: (v) => conExtras(p, { direccionCompleta: v.trim() || undefined }) })} />
        <FilaDato etiqueta="Colonia" valor={p.zona} alEditar={campo({ clave: "zona", etiqueta: "Colonia", valor: p.zona, guardar: (v) => ({ ...p, zona: v.trim() || p.zona }) })} />
        <FilaDato etiqueta="Municipio" valor={x.municipio} alEditar={campo({ clave: "municipio", etiqueta: "Municipio", valor: x.municipio ?? "", opciones: MUNICIPIOS, guardar: (v) => conExtras(p, { municipio: v || undefined }) })} />
      </GrupoDatos>
      <FotosInmueble
        inmueble={p}
        ocupado={ocupado}
        alAgregar={(fs) => void cambiarInmueble(p, agregarFotos(p, fs), fs.length === 1 ? "Foto agregada" : `${fs.length} fotos agregadas`)}
        alOrdenar={(g) => void cambiarInmueble(p, ordenarFotos(p, g), "Orden de fotos guardado")}
        alDescribir={(src, alt) => void cambiarInmueble(p, describirFoto(p, src, alt), "Descripción guardada")}
        alMostrar={(src) => void cambiarInmueble(p, mostrarFoto(p, src), "La foto ya se muestra en el sitio")}
        alQuitar={(src) => void cambiarInmueble(p, quitarFoto(p, src), "Foto quitada")}
      />
      <TextosSitio key={`textos-${p.slug}-${p.descripcion.length}`} inmueble={p} ocupado={ocupado}
        alGuardar={(d) => void cambiarInmueble(p, editarTextos(p, d), "Textos guardados")} />
    </div>
  );

  const tonoEstado = (e: EstadoInteresado) => (e === "Nuevo" ? "si" : undefined);
  const interesadosVista = (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <p className="fx-consejo" style={{ fontSize: 14 }}>Personas cuya búsqueda coincide con este inmueble.</p>
      {nuevos.length ? (
        <>
          <Boton bloque deshabilitado={!comp.publico || ocupado} title={comp.publico ? undefined : comp.motivo} onClick={enviarANuevos}>
            <Icono nombre="mensaje" tamano={18} />Enviar la ficha a {nuevos.length === 1 ? "1 nuevo" : `${nuevos.length} nuevos`}
          </Boton>
          {!comp.publico ? <p className="fx-chico">{comp.motivo}</p> : null}
        </>
      ) : null}
      {quieren.length ? (
        <div className="fx-tarjeta">
          {quieren.map((i) => (
            <Link key={`${i.tipo}-${i.id}`} href={i.tipo === "persona" ? rutaPersona(i.id) : rutaConsulta(i.id)} className="fx-opt" style={{ justifyContent: "flex-start", minHeight: 60 }}>
              <Avatar nombre={i.nombre} />
              <span style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0, flex: 1 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}><span style={{ fontWeight: 600 }}>{i.nombre}</span><span className="fx-badge" data-tono={tonoEstado(i.estado)}>{i.estado}</span></span>
                <span className="fx-h">{i.detalle}</span>
              </span>
              <Gesto nombre="derecha" tamano={18} />
            </Link>
          ))}
        </div>
      ) : (
        <div className="fx-tarjeta" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 4 }}>
          <b style={{ fontSize: 14, fontWeight: 600 }}>Nadie busca algo así por ahora</b>
          <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>Cuando la búsqueda de alguien coincida, aparece aquí.</span>
        </div>
      )}
    </div>
  );

  const docs = (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="fx-tarjeta">
        {DOCUMENTOS_INMUEBLE.map(([clave, nombre]) => {
          const e = estadoDoc(p, clave);
          return (
            <button key={clave} type="button" className="fx-opt" disabled={ocupado} aria-label={`${nombre}: ${ESTADO_DOC_LABELS[e]}. Cambiar`}
              onClick={() => { const sig = siguienteDoc(p, clave); void cambiarInmueble(p, sig, `${nombre}: ${ESTADO_DOC_LABELS[estadoDoc(sig, clave)].toLowerCase()}`); }}>
              <span>{nombre}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: e === "falta" ? "var(--warning)" : "var(--ink-muted)" }}>{ESTADO_DOC_LABELS[e]}</span>
            </button>
          );
        })}
      </div>
      <Link href="/panel/bandeja" className="pn-btn pn-btn-secundario" style={{ gap: 8 }}><Icono nombre="descargar" tamano={18} />Subir o tomar foto</Link>
      <p className="fx-chico">Los documentos son privados: no se publican ni salen del panel. Falta un documento, nada se detiene.</p>
      <AsuntosDe slug={p.slug} />
    </div>
  );

  const volver = { etiqueta: p.titulo, alPulsar: cerrarHoja };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 4 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span className="fx-cuenta">{tipoYOperacion(p)}{p.codigo ? ` · ${p.codigo}` : ""}{p.demo ? " · Ejemplo" : ""}{x.archivado ? " · Archivado" : ""}</span>
        <MenuMas items={menu} />
      </div>

      <div style={{ position: "relative" }}>
        <div className="fx-fotos" onScroll={(e) => { const el = e.currentTarget; setFoto(Math.round(el.scrollLeft / Math.max(1, el.clientWidth))); }} aria-label="Fotos del inmueble" tabIndex={fotos.length > 1 ? 0 : undefined}>
          {fotos.length ? fotos.map((g) => (
            // eslint-disable-next-line @next/next/no-img-element -- fotos del inventario en un carrusel del panel
            <div key={g.src}><img src={g.src} alt={g.alt || p.titulo} loading="lazy" /></div>
          )) : <div>Sin fotos todavía</div>}
        </div>
        <span className="fx-badge" data-tono={sitio.tono} style={{ position: "absolute", left: 12, top: 12 }}>{sitio.texto}</span>
        {fotos.length > 1 ? <span className="fx-fotos-marca">{Math.min(foto + 1, fotos.length)} / {fotos.length}</span> : null}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.15, fontVariantNumeric: "tabular-nums", color: montoDe(p) ? undefined : "var(--ink-muted)" }}>{precioCorto(p)}</span>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, lineHeight: 1.3 }}>{p.titulo}</h2>
        <span style={{ fontSize: 14, color: "var(--ink-muted)" }}>{[x.direccionExacta ? x.direccionCompleta : "", p.zona, x.municipio].filter(Boolean).join(", ")}</span>
        {especificaciones(p) ? <span style={{ fontSize: 14, color: "var(--ink-muted)" }}>{especificaciones(p)}</span> : null}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 8 }}>
        <MenuCompartirFila inmueble={p} boton="principal" />
        <button type="button" className="pn-btn pn-btn-secundario" onClick={() => abrir("visita")}><Icono nombre="cita" tamano={18} />Visita</button>
        <a className="pn-btn pn-btn-secundario" href={mapa} target="_blank" rel="noopener noreferrer"><Icono nombre="ubicacion" tamano={18} />Llegar</a>
      </div>

      {avisos.length ? (
        <div className="fx-avisos" role="list" aria-label="Avisos">
          {avisos.map((a) => (
            <div key={a.texto} role="listitem">
              <span style={{ color: "var(--warning)", display: "inline-flex" }}><Icono nombre="alerta" tamano={18} /></span>
              <span style={{ flex: 1, minWidth: 0, fontSize: 14 }}>{a.texto}</span>
              <button type="button" className="fx-enlace" onClick={() => resolver(a)}>{a.boton}</button>
            </div>
          ))}
        </div>
      ) : null}

      <Pestanas segmentadas etiqueta="Secciones del inmueble" valor={pestana} alElegir={setPestana}
        opciones={[{ valor: "resumen", etiqueta: "Resumen" }, { valor: "datos", etiqueta: "Datos" }, { valor: "interesados", etiqueta: quieren.length ? `Interesados ${quieren.length}` : "Interesados" }, { valor: "docs", etiqueta: "Docs" }]} />
      {pestana === "resumen" ? resumen : pestana === "datos" ? datos : pestana === "interesados" ? interesadosVista : docs}

      <HojaAdaptable abierta={hoja?.que === "precio"} titulo="Cambiar precio" volver={volver} alCerrar={cerrarHoja}>
        {hoja?.que === "precio" ? <CambiarPrecio inmueble={p} interesados={quieren.length} ocupado={ocupado} alGuardar={guardarPrecio} alCancelar={cerrarHoja} /> : null}
      </HojaAdaptable>
      <HojaAdaptable abierta={hoja?.que === "visita"} titulo="Agendar visita" volver={volver} alCerrar={cerrarHoja}>
        {hoja?.que === "visita" ? (
          <AgendarVisita key={`visita-${p.slug}`} inmueble={p} personas={personas} interesadas={quieren.filter((i) => i.tipo === "persona").map((i) => i.id)}
            citas={eventos.datos} hoy={ahora} ocupado={ocupado} alGuardar={(d, persona) => void agendarVisita(d, persona)} alCancelar={cerrarHoja} />
        ) : null}
      </HojaAdaptable>
      <HojaAdaptable abierta={hoja?.que === "propietario"} titulo="Propietario" volver={volver} alCerrar={cerrarHoja}>
        {hoja?.que === "propietario" ? (
          <PropietarioInmueble inmueble={p} personas={personas} ocupado={ocupado} sinTitulo buscandoAlAbrir={!ligados.length}
            alLigar={(c) => { cerrarHoja(); void cambiarPersona(c, ligarPropietario(c, p.slug), `${c.nombre} quedó como propietario`); }}
            alDesligar={(c) => void cambiarPersona(c, desligarPropietario(c), "Se quitó el propietario")} />
        ) : null}
      </HojaAdaptable>
      <HojaAdaptable abierta={hoja?.que === "llaves"} titulo="Dónde están las llaves" volver={volver} alCerrar={cerrarHoja}>
        {hoja?.que === "llaves" ? (
          <LlavesInmueble key={`llaves-${p.slug}`} inmueble={p} hoy={ahora} ocupado={ocupado} sinTitulo
            alGuardar={(d) => void cambiarInmueble(p, guardarLlaves(p, d), "Llaves guardadas")}
            alPrestar={(d) => void cambiarInmueble(p, prestarLlaves(p, d, quien), `Llaves prestadas a ${d.persona.trim()}`)}
            alRegresar={(id) => void cambiarInmueble(p, regresaronLlaves(p, id, quien), "Llaves de regreso")} />
        ) : null}
      </HojaAdaptable>
      <HojaAdaptable abierta={hoja?.que === "campo"} titulo={hoja?.que === "campo" ? hoja.campo.etiqueta : "Editar dato"} volver={volver} alCerrar={cerrarHoja}>
        {hoja?.que === "campo" ? <EditarCampo key={hoja.campo.clave} campo={hoja.campo} ocupado={ocupado} alCancelar={cerrarHoja}
          alGuardar={(v) => { cerrarHoja(); void cambiarInmueble(p, hoja.campo.guardar(v), `Guardado: ${hoja.campo.etiqueta}`); }} /> : null}
      </HojaAdaptable>
    </div>
  );
}

/** Cambiar un dato: lista de opciones o un campo de texto. */
function EditarCampo({ campo, ocupado, alGuardar, alCancelar }: { campo: CampoEditable; ocupado: boolean; alGuardar: (v: string) => void; alCancelar: () => void }) {
  const [v, setV] = useState(campo.valor);
  const id = useId();
  if (campo.opciones) {
    return (
      <div className="fx-tarjeta" style={{ marginTop: 8 }} aria-labelledby={id}>
        <span id={id} className="pn-solo-lector">{campo.etiqueta}</span>
        {campo.opciones.map((o) => (
          <button key={o} type="button" className="fx-opt" aria-pressed={o === campo.valor} onClick={() => alGuardar(o)}>
            {o}{o === campo.valor ? <Gesto nombre="palomita" tamano={18} style={{ color: "var(--accent)" }} /> : null}
          </button>
        ))}
        {campo.valor ? <button type="button" className="fx-opt" onClick={() => alGuardar("")} style={{ color: "var(--ink-muted)" }}>Quitar</button> : null}
      </div>
    );
  }
  return (
    <form style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }} onSubmit={(e) => { e.preventDefault(); alGuardar(v); }}>
      <Campo etiqueta={campo.etiqueta} value={v} onChange={(e) => setV(e.target.value)} inputMode={campo.numero ? "decimal" : undefined} autoComplete="off" maxLength={200} ayuda={campo.ayuda} autoFocus />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
        <Boton variante="secundario" onClick={alCancelar}>Cancelar</Boton>
        <Boton type="submit" deshabilitado={ocupado}>Guardar</Boton>
      </div>
    </form>
  );
}
