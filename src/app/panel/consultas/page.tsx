"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { useLoLleva } from "@/components/panel/datos/lo-lleva";
import { useColeccion } from "@/components/panel/datos/use-coleccion";
import { useFichaEnDireccion } from "@/components/panel/datos/use-ficha-url";
import { Buscador } from "@/components/panel/fichas/piezas";
import { Gesto, Icono } from "@/components/panel/icons";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Boton } from "@/components/panel/kit/boton";
import { Relacionado } from "@/components/panel/kit/relacionado";
import { Cargando, EstadoError, Vacio } from "@/components/panel/kit/estados";
import { HojaAdaptable } from "@/components/panel/ui/hoja-adaptable";
import { Segmentado } from "@/components/panel/kit/segmentado";
import type { Property } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import type { Asesor, Lead } from "@/lib/domain/records";
import { CerrarConsulta, FormularioAnotar, NotasConsulta, SiguienteContacto } from "@/components/panel/consultas/acciones";
import { PersonaDeLaConsulta } from "@/components/panel/consultas/persona";
import { convertirConsulta, crearExpediente, ErrorDeLectura, leerMiAsesor } from "@/lib/panel/datos/colecciones";
import { anotar, atender, cerrarConsulta, nuevaConsulta, NOMBRE_CIERRE, programar, reabrir } from "@/lib/panel/datos/consultas-acciones";
import { diaLargo } from "@/lib/panel/calendario";
import { relacionadoConsulta, rutaInmueble, rutaPersona, type GrupoRelacionado } from "@/lib/panel/datos/relacionado";
import { quitarAsunto, unirConsulta, UNIR_PENDIENTE } from "@/lib/panel/datos/consultas-persona";
import { armarRespuesta, asuntoDeCorreo, conFirmaDeCorreo, NOMBRE_PLANTILLA, plantillaInicial, plantillasDe, type Plantilla } from "@/lib/panel/datos/consultas-respuesta";
import { Desplegable } from "@/components/panel/kit/desplegable";
import { enlaceWhatsApp, filaConsulta, filtrarConsultas, ordenar, partirPorAntiguedad, type FilaConsulta, type Pestana } from "@/lib/panel/datos/consultas";

import "@/components/panel/asunto/asunto.css";
import "@/components/panel/asunto/caso.css";
import "@/components/panel/fichas/modelo.css";
import "./consultas.css";

const NOMBRE_PESTANA: Record<Pestana, string> = { por_atender: "Por atender", seguimiento: "En seguimiento", cerradas: "Cerrada" };

const VACIOS: Record<Pestana, { titulo: string; texto: string }> = {
  por_atender: { titulo: "Nadie espera respuesta", texto: "Cuando alguien escriba por el sitio, aparece aquí." },
  seguimiento: { titulo: "Nada en seguimiento", texto: "Las consultas que alguien atiende pasan aquí." },
  cerradas: { titulo: "Ninguna cerrada", texto: "Las que no son clientes o terminaron sin operación quedan aquí." },
};

/** Consultas (PN-05): cola de quien escribe, con Atender, siguiente contacto, notas, cerrar y anotar una consulta a mano. */
function Consultas() {
  const leads = useColeccion<Lead>("leads", { refrescarCada: 90_000 });
  const inmuebles = useColeccion<Property>("propiedades");
  const { avisar } = useAvisos();
  const [pestana, setPestana] = useState<Pestana>("por_atender");
  const [buscar, setBuscar] = useState("");
  const { abierta: abiertaId, abrir, cerrar } = useFichaEnDireccion();
  const [ahora, setAhora] = useState(() => Date.now());

  // El tiempo de espera avanza solo: se recalcula cada minuto.
  useEffect(() => {
    const t = window.setInterval(() => setAhora(Date.now()), 60_000);
    return () => window.clearInterval(t);
  }, []);

  const [miAsesor, setMiAsesor] = useState<string | null>(null);
  useEffect(() => { const c = new AbortController(); leerMiAsesor(c.signal).then(setMiAsesor); return () => c.abort(); }, []);
  const asesores = useColeccion<Asesor>("asesores");

  // «Lo lleva» (PN-10): quien atiende la consulta queda como su asesor (`atender` lo escribe en asesorId).
  const asesoresEnLista = useMemo(() => leads.datos.map((l) => l.asesorId), [leads.datos]);
  const loLleva = useLoLleva(asesoresEnLista, miAsesor, asesores.datos);
  const titulos = useMemo(() => new Map(inmuebles.datos.map((p) => [p.slug, p.titulo])), [inmuebles.datos]);
  const todas = useMemo(() => leads.datos.map((l) => filaConsulta(l, ahora, (s) => titulos.get(s))), [leads.datos, ahora, titulos]);
  const filas = useMemo(() => {
    const asesorDe = new Map(leads.datos.map((l) => [l.id, l.asesorId]));
    return todas.filter((f) => loLleva.pasa(asesorDe.get(f.id)));
  }, [todas, leads.datos, loLleva]);
  const cuentas = useMemo(() => ({
    por_atender: filas.filter((f) => f.pestana === "por_atender").length,
    seguimiento: filas.filter((f) => f.pestana === "seguimiento").length,
    cerradas: filas.filter((f) => f.pestana === "cerradas").length,
  }), [filas]);
  // Con texto en el buscador se busca en las tres pestañas y cada fila dice en cuál está (AUD-03, M3).
  const buscando = buscar.trim().length > 0;
  const visibles = useMemo(
    () => (buscando ? filtrarConsultas([...ordenar(filas, "por_atender"), ...ordenar(filas, "seguimiento"), ...ordenar(filas, "cerradas")], buscar) : ordenar(filas, pestana)),
    [filas, pestana, buscar, buscando],
  );
  const abierta = useMemo(() => todas.find((f) => f.id === abiertaId) ?? null, [todas, abiertaId]);
  const leadAbierto = useMemo(() => leads.datos.find((l) => l.id === abiertaId) ?? null, [leads.datos, abiertaId]);
  const clientes = useColeccion<Cliente>("clientes");

  // Escrituras: se guarda con la versión que se leyó; cada cambio avisa y ofrece Deshacer (boceto de Consultas).
  const [ocupado, setOcupado] = useState(false);
  const { guardar } = leads;
  const router = useRouter();

  // Persona y asunto desde la consulta (PN-05): la conversión verificada de la base crea la ficha y el vínculo.
  // La ficha no se deshace (el vínculo de la conversión es inmutable); el asunto sí: va a eliminados y se recupera.
  const [asuntoReciente, setAsuntoReciente] = useState<{ leadId: string; id: string; folio: string | null } | null>(null);
  type Nuevo = { id: string; folio: string | null; version: number };
  const avisarAsunto = (leadId: string, nuevo: Nuevo, texto: string) => {
    setAsuntoReciente({ leadId, id: nuevo.id, folio: nuevo.folio });
    avisar(texto, { duracion: 8000, etiqueta: "Deshacer", alAccionar: () => {
      quitarAsunto(nuevo.id, nuevo.version).then(() => {
        setAsuntoReciente((a) => (a?.id === nuevo.id ? null : a));
        avisar("Se quitó el asunto; queda en eliminados");
      }, (e: unknown) => avisar(e instanceof Error ? e.message : "No se pudo deshacer."));
    } });
  };
  const crearPersona = async (l: Lead, asunto: { operacion: string; asesorId: string } | null) => {
    const version = leads.versionDe(l.id);
    if (version === null) { avisar("Recarga la página e inténtalo de nuevo."); return false; }
    setOcupado(true);
    let clienteId: string;
    try {
      clienteId = (await convertirConsulta(l.id, version)).clienteId;
      leads.reintentar(); clientes.reintentar();
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se creó. Vuelve a intentarlo.");
      setOcupado(false);
      return false;
    }
    const abrirFicha = { etiqueta: "Abrir su ficha", alAccionar: () => router.push(rutaPersona(clienteId)) };
    if (!asunto) { avisar(`${l.nombre} ya está en Personas`, abrirFicha); setOcupado(false); return true; }
    try {
      const nuevo = await crearExpediente<Nuevo>({ clienteId, ...asunto, ...(l.propiedadSlug ? { propiedadSlug: l.propiedadSlug } : {}) });
      avisarAsunto(l.id, nuevo, `${l.nombre} ya está en Personas, con su asunto${nuevo.folio ? ` ${nuevo.folio}` : ""}`);
    } catch (e) {
      // La persona sí quedó: el asunto se puede volver a abrir desde aquí mismo.
      avisar(`${l.nombre} ya está en Personas, pero el asunto no se abrió. ${e instanceof Error ? e.message : ""}`.trim(), abrirFicha);
    } finally { setOcupado(false); }
    return true;
  };
  // «Unir con su ficha» (PN-05): si el servidor todavía no sabe hacerlo, se recuerda en esta visita y se dice sin error.
  const [unirPendiente, setUnirPendiente] = useState(false);
  const unir = async (l: Lead, p: Cliente) => {
    const version = leads.versionDe(l.id);
    if (version === null) { avisar("Recarga la página e inténtalo de nuevo."); return false; }
    setOcupado(true);
    try {
      const r = await unirConsulta(l.id, p.id, version);
      if (r.estado === "pendiente") { setUnirPendiente(true); avisar(UNIR_PENDIENTE, { duracion: 8000 }); return false; }
      leads.reintentar(); clientes.reintentar();
      avisar(`La consulta quedó en la ficha de ${p.nombre?.trim() || "esa persona"}`, { etiqueta: "Abrir su ficha", alAccionar: () => router.push(rutaPersona(r.clienteId)) });
      return true;
    } catch (e) {
      if (e instanceof ErrorDeLectura && e.estado === 409) leads.reintentar();
      avisar(e instanceof Error ? e.message : "No se unió. Vuelve a intentarlo.");
      return false;
    } finally { setOcupado(false); }
  };
  const abrirAsunto = async (d: { clienteId: string; asesorId: string; operacion: string; propiedadSlug?: string }) => {
    if (!leadAbierto) return false;
    setOcupado(true);
    try {
      const nuevo = await crearExpediente<Nuevo>(d);
      avisarAsunto(leadAbierto.id, nuevo, `Asunto abierto${nuevo.folio ? ` con el folio ${nuevo.folio}` : ""}`);
      return true;
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se abrió el asunto. Vuelve a intentarlo.");
      return false;
    } finally { setOcupado(false); }
  };
  const cambiar = useCallback(async (previo: Lead, nuevo: Lead, texto: string, deshacer = true) => {
    setOcupado(true);
    try {
      await guardar(nuevo.id, nuevo);
      avisar(texto, deshacer ? { etiqueta: "Deshacer", alAccionar: () => {
        guardar(previo.id, previo).then(() => avisar("Se deshizo"), (e: unknown) => avisar(e instanceof Error ? e.message : "No se pudo deshacer."));
      } } : {});
      return true;
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se guardó. Vuelve a intentarlo.");
      return false;
    } finally {
      setOcupado(false);
    }
  }, [guardar, avisar]);
  const atenderLead = useCallback((l: Lead) => cambiar(l, atender(l, miAsesor), "Pasó a En seguimiento"), [cambiar, miAsesor]);

  // Anotar una consulta a mano (llamada, en persona).
  const [anotando, setAnotando] = useState(false);
  const guardarNueva = async (d: Parameters<typeof nuevaConsulta>[0]) => {
    const n = nuevaConsulta(d, miAsesor);
    setOcupado(true);
    try {
      await guardar(n.id, n);
      setAnotando(false);
      setPestana("seguimiento");
      avisar("Consulta guardada en seguimiento");
      abrir(n.id);
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se guardó. Vuelve a intentarlo.");
    } finally {
      setOcupado(false);
    }
  };

  // Atajos del boceto: A atiende la consulta abierta, N anota una nueva. No actúan mientras se escribe.
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (e.key === "n" || e.key === "N") { e.preventDefault(); setAnotando(true); }
      if ((e.key === "j" || e.key === "k") && visibles.length) {
        e.preventDefault();
        const i = visibles.findIndex((x) => x.id === abiertaId);
        const sig = e.key === "j" ? (i + 1) % visibles.length : (i <= 0 ? visibles.length - 1 : i - 1);
        abrir(visibles[sig].id);
      }
      if ((e.key === "a" || e.key === "A") && leadAbierto && leadAbierto.estado === "nuevo" && !ocupado) { e.preventDefault(); void atenderLead(leadAbierto); }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [leadAbierto, atenderLead, ocupado, visibles, abiertaId, abrir]);

  const cargando = leads.cargando;
  const error = leads.error;
  // Por atender, sin buscar: lo de las últimas 24 horas arriba y lo de días atrás aparte, plegado (sugerencia 4).
  const porDias = useMemo(() => (!buscando && pestana === "por_atender" && visibles.length ? partirPorAntiguedad(visibles) : null), [buscando, pestana, visibles]);
  const [verViejas, setVerViejas] = useState(false);
  // Modelo visual (Main.dc.html): renglones a todo lo ancho con su línea suave; el elegido en azul.
  const fila = (f: FilaConsulta) => (
    <button key={f.id} type="button" className="as-it cq-it" aria-current={f.id === abiertaId ? "page" : undefined} onClick={() => abrir(f.id)}>
      <span className="as-it-c">
        <span className="cq-arr"><b>{f.nombre}</b><small className="cq-cuando" data-tono={f.urgencia === "normal" ? undefined : f.urgencia}>{f.detalle}</small></span>
        <small>{[f.canal, buscando ? NOMBRE_PESTANA[f.pestana] : null, f.inmueble].filter(Boolean).join(" · ")}</small>
        {f.mensaje ? <small className="cq-msj">{f.mensaje}</small> : null}
      </span>
    </button>
  );
  const tarjeta = (lista: FilaConsulta[]) => <nav aria-label="Consultas" className="as-items">{lista.map(fila)}</nav>;
  const interes = leadAbierto?.propiedadSlug ? inmuebles.datos.find((x) => x.slug === leadAbierto.propiedadSlug) : undefined;
  // En el teléfono, al abrir una consulta se sube al principio (la lista quedó abajo).
  useEffect(() => { if (abiertaId && window.matchMedia("(max-width: 900px)").matches) window.scrollTo({ top: 0 }); }, [abiertaId]);

  return (
    <div className="as-dos cq-dos" data-det={abierta !== null}>
      <section className="as-lista" aria-label="Lista de consultas">
        <div className="as-lado">
          <div className="as-fila as-cab">
            <h1 className="as-h1-lista">Consultas</h1>
            {!cargando ? <span className="as-cab-n">{cuentas.por_atender}</span> : null}
            <span className="as-sp" />
            <button type="button" className="as-btn as-gho as-ico as-cab-mas" onClick={() => setAnotando(true)} aria-label="Anotar una consulta" title="Anotar una consulta (N)" aria-keyshortcuts="N"><Icono nombre="mas" tamano={16} /></button>
          </div>
          <div className="cq-arriba">
            <p className="cq-resumen">{cargando ? "Cargando…" : cuentas.por_atender ? `${cuentas.por_atender} por atender` : "Nadie espera respuesta"} · Datos de ejemplo</p>
            <Buscador valor={buscar} alCambiar={setBuscar} etiqueta="Buscar consultas" placeholder="Nombre, teléfono o inmueble" />
            <div className="cq-filtros">
              <Segmentado etiqueta="Ver" valor={pestana} alElegir={setPestana} opciones={[
                { valor: "por_atender", etiqueta: "Por atender", cuenta: cuentas.por_atender },
                { valor: "seguimiento", etiqueta: "Seguimiento", cuenta: cuentas.seguimiento },
                { valor: "cerradas", etiqueta: "Cerradas", cuenta: cuentas.cerradas },
              ]} />
              {loLleva.control}
            </div>
          </div>
          {cargando ? <div className="cq-estado"><Cargando lineas={4} etiqueta="Cargando consultas" /></div> : null}
          {error ? <div className="cq-estado"><EstadoError texto={error} alReintentar={leads.reintentar} /></div> : null}
          {!cargando && !error && !buscando && cuentas[pestana] === 0 ? (
            <div className="cq-estado">
              {loLleva.activo
                ? <Vacio titulo="Nada de esa persona aquí" texto="Con «Lo lleva» elegido solo se ven sus consultas." icono="llamada" accion={<Boton variante="secundario" onClick={loLleva.quitar}>Ver todo el equipo</Boton>} />
                : <Vacio titulo={VACIOS[pestana].titulo} texto={VACIOS[pestana].texto} icono="llamada" />}
            </div>
          ) : null}
          {!cargando && !error && (buscando || cuentas[pestana] > 0) && visibles.length === 0 ? <div className="cq-estado"><Vacio titulo="Nada coincide" texto="Se buscó en las tres pestañas. Prueba con otra palabra." icono="buscar" /></div> : null}
          {porDias ? (
            <>
              {porDias.recientes.length ? tarjeta(porDias.recientes) : null}
              {porDias.viejas.length ? (
                <section className="cq-viejas">
                  {porDias.recientes.length ? (
                    <div className="cq-viejas-cab">
                      <h2>{porDias.viejas.length} {porDias.viejas.length === 1 ? "espera" : "esperan"} desde hace días</h2>
                      <Boton variante="texto" aria-expanded={verViejas} onClick={() => setVerViejas((v) => !v)}>{verViejas ? "Ocultar" : "Revisar"}</Boton>
                    </div>
                  ) : null}
                  {verViejas || !porDias.recientes.length ? tarjeta(porDias.viejas) : null}
                </section>
              ) : null}
            </>
          ) : visibles.length ? tarjeta(visibles) : null}
          <div className="as-pie-teclas" aria-hidden><kbd>J</kbd><kbd>K</kbd> moverse · <kbd>A</kbd> atender · <kbd>N</kbd> anotar</div>
        </div>
      </section>

      <section className="as-det" aria-label={abierta ? `Consulta de ${abierta.nombre}` : "Consulta"}>
        {abierta && leadAbierto ? (
          <div className="cp fm-col cq-col">
            <div className="cp-barra">
              <button type="button" className="as-btn as-gho as-atras" onClick={() => cerrar()}><Icono nombre="at" tamano={16} />Consultas</button>
              <span className="as-num cq-barra-t">{abierta.canal}</span>
              <span className="as-sp" />
              <button type="button" className="as-btn as-gho as-ico" aria-label="Cerrar" title="Cerrar" onClick={() => cerrar()}><Icono nombre="x" tamano={16} /></button>
            </div>
            <DetalleConsulta key={abierta.id} f={abierta} lead={leadAbierto} ocupado={ocupado}
          interes={interes ? { titulo: interes.titulo, href: rutaInmueble(interes.codigo) } : undefined}
          firmante={asesores.datos.find((a) => a.id === (leadAbierto.asesorId || miAsesor))?.nombre}
          grupos={relacionadoConsulta(leadAbierto, { clientes: clientes.datos, inmuebles: inmuebles.datos })}
          alCopiar={(t) => {
            navigator.clipboard?.writeText(t).then(() => avisar("Respuesta copiada"), () => avisar("No se pudo copiar. Selecciona el texto y cópialo."));
          }}
          alAtender={() => atenderLead(leadAbierto)}
          alProgramar={(fecha, accion) => cambiar(leadAbierto, programar(leadAbierto, fecha, accion), fecha ? `Contactar el ${diaLargo(fecha)}` : "Se quitó la fecha")}
          alAnotar={(texto) => cambiar(leadAbierto, anotar(leadAbierto, texto), "Nota guardada", false)}
          alCerrar={(como, motivo) => cambiar(leadAbierto, cerrarConsulta(leadAbierto, como, motivo), `Cerrada: ${NOMBRE_CIERRE[como]}`)}
          alReabrir={() => cambiar(leadAbierto, reabrir(leadAbierto), "Se reabrió; está en seguimiento")}
          persona={<PersonaDeLaConsulta lead={leadAbierto} personas={clientes.datos} asesores={asesores.datos} miAsesor={miAsesor} ocupado={ocupado}
            asuntoReciente={asuntoReciente?.leadId === leadAbierto.id ? asuntoReciente : null}
            alCrear={(asunto) => crearPersona(leadAbierto, asunto)} alAbrirAsunto={abrirAsunto}
            alUnir={(p) => unir(leadAbierto, p)} unirPendiente={unirPendiente} />}
            />
          </div>
        ) : (
          <div className="as-in as-elige">
            <Icono nombre="llamada" tamano={28} />
            <p className="as-m">{cargando ? "Cargando…" : "Elige una consulta para verla."}</p>
          </div>
        )}
      </section>
      <HojaAdaptable abierta={anotando} titulo="Anotar una consulta" descripcion="Para lo que llega por llamada o en persona. Queda a tu nombre." alCerrar={() => setAnotando(false)}>
        {anotando ? <FormularioAnotar ocupado={ocupado} alGuardar={(d) => void guardarNueva(d)} /> : null}
      </HojaAdaptable>
    </div>
  );
}

type Acciones = {
  lead: Lead; ocupado: boolean;
  alAtender: () => void;
  alProgramar: (fecha: string | null, accion: string) => void;
  alAnotar: (texto: string) => Promise<boolean>;
  alCerrar: (como: Parameters<typeof cerrarConsulta>[1], motivo: string) => void;
  alReabrir: () => void;
  persona: ReactNode;
};

function DetalleConsulta({ f, grupos, alCopiar, lead, ocupado, alAtender, alProgramar, alAnotar, alCerrar, alReabrir, persona, firmante, interes }: { f: FilaConsulta; grupos: GrupoRelacionado[]; alCopiar: (t: string) => void; firmante?: string; interes?: { titulo: string; href: string } } & Acciones) {
  const [hoy] = useState(() => new Date());
  // Anotada a mano (llamada o en persona): ya se habló con ella; no lleva el «gracias por escribir».
  const aMano = lead.origen === "manual";
  // Respuesta lista según la consulta: lo que busca, el inmueble y el momento. Se puede ajustar antes de enviarla (AUD-03, M4).
  const datos = { nombre: f.nombre, inmueble: f.inmueble, operacion: lead.perfil?.operacion, firmante, aMano, pestana: f.pestana };
  const plantillas = plantillasDe(datos);
  const [plantilla, setPlantilla] = useState<Plantilla>(() => plantillaInicial(datos));
  // Mientras no se edite, el texto sigue a los datos (p. ej., la firma llega cuando carga el equipo); editado, se respeta.
  const [editado, setEditado] = useState<string | null>(null);
  const texto = editado ?? armarRespuesta(plantilla, datos);
  const elegir = (p: Plantilla | "") => { if (!p) return; setPlantilla(p); setEditado(null); };
  const wa = f.telefono ? enlaceWhatsApp(f.telefono, texto) : null;
  const correo = f.email ? `mailto:${f.email}?subject=${encodeURIComponent(asuntoDeCorreo(f.inmueble))}&body=${encodeURIComponent(conFirmaDeCorreo(texto, firmante))}` : null;
  const tel = f.telefono?.replace(/[^\d+]/g, "");
  // Responder es atender: si sigue por atender, al enviar, llamar o copiar pasa a En seguimiento (con Deshacer).
  const alResponder = f.pestana === "por_atender" && !ocupado ? alAtender : undefined;
  const estado = f.pestana === "por_atender" ? { texto: "Sin atender", tono: f.urgencia === "normal" ? undefined : f.urgencia } : f.pestana === "seguimiento" ? { texto: "En seguimiento", tono: undefined } : { texto: "Cerrada", tono: undefined };
  return (
    <div className="cq-det">
      <div className="fm-cab">
        <h2 className="fm-h1">{f.nombre}</h2>
        <span className="as-m">{f.canal} · {f.detalle}</span>
        <span className="fx-st cq-st" data-tono={estado.tono}>{estado.texto}</span>
      </div>
      {aMano ? (f.mensaje ? <p className="fx-quote">{f.mensaje}</p> : null) : <p className="fx-quote">{f.mensaje ?? "No dejó mensaje."}</p>}
      {interes ? (
        <Link className="fx-ref" href={interes.href}>
          <Icono nombre="casa" tamano={18} /><span className="fx-ref-k">Le interesa</span><span className="fx-ref-v">{interes.titulo}</span><Gesto nombre="derecha" tamano={16} />
        </Link>
      ) : null}
      {persona}
      <div className="fx-tarjeta">
        <div className="fx-opt" style={{ cursor: "default" }}><span className="fx-h">Teléfono</span><span style={{ fontWeight: 600 }}>{f.telefono || "Sin teléfono"}</span></div>
        {f.email ? <div className="fx-opt" style={{ cursor: "default" }}><span className="fx-h">Correo</span><span style={{ fontWeight: 600, overflowWrap: "anywhere" }}>{f.email}</span></div> : null}
      </div>
      {wa || correo || tel ? (
        <section className="fx-rep" aria-label="Respuesta lista para enviar">
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-muted)" }}>Respuesta lista para enviar</span>
          {plantillas.length > 1 ? <Desplegable etiqueta="Qué decir" valor={plantilla} alElegir={elegir}
            opciones={plantillas.map((p) => ({ valor: p, etiqueta: NOMBRE_PLANTILLA[p] }))} /> : null}
          <label htmlFor={`respuesta-${f.id}`} className="pn-solo-lector">Texto de la respuesta</label>
          <textarea id={`respuesta-${f.id}`} rows={4} value={texto} onChange={(e) => setEditado(e.target.value)} />
          <div className="fx-filas-btn">
            <Boton variante="secundario" onClick={() => { alCopiar(texto); alResponder?.(); }}>Copiar</Boton>
            {wa ? <a className="pn-btn pn-btn-secundario" href={wa} target="_blank" rel="noopener noreferrer" onClick={alResponder}>WhatsApp</a> : null}
            {tel ? <a className="pn-btn pn-btn-secundario" href={`tel:${tel}`} onClick={alResponder}>Llamar</a> : null}
            {correo ? <a className="pn-btn pn-btn-secundario" href={correo} onClick={alResponder}>Correo</a> : null}
          </div>
          <p className="fx-chico" style={{ margin: 0 }}>La envías tú; el panel no manda nada solo.{correo ? " Por correo se agrega tu firma." : ""}</p>
        </section>
      ) : null}
      {f.pestana === "por_atender" ? (
        <Boton bloque deshabilitado={ocupado} onClick={alAtender} aria-keyshortcuts="A" style={{ minHeight: 48 }}>Atender yo</Boton>
      ) : null}
      {f.pestana === "seguimiento" ? <SiguienteContacto lead={lead} hoy={hoy} ocupado={ocupado} alGuardar={alProgramar} /> : null}
      <NotasConsulta lead={lead} ocupado={ocupado} alAnotar={alAnotar} />
      <Relacionado grupos={grupos} />
      {f.pestana === "cerradas" ? <Boton variante="secundario" bloque deshabilitado={ocupado} onClick={alReabrir} style={{ minHeight: 48 }}>Reabrir</Boton>
        : <CerrarConsulta ocupado={ocupado} alCerrar={alCerrar} />}
    </div>
  );
}

/** useSearchParams pide un límite de Suspense; el esqueleto es el mismo de la carga. */
export default function PaginaConsultas() {
  return <Suspense fallback={<div className="pn-pagina"><Cargando lineas={5} etiqueta="Cargando" /></div>}><Consultas /></Suspense>;
}
