"use client";
import { useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { useLoLleva } from "@/components/panel/datos/lo-lleva";
import { useColeccion } from "@/components/panel/datos/use-coleccion";
import { useFichaEnDireccion } from "@/components/panel/datos/use-ficha-url";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Boton } from "@/components/panel/kit/boton";
import { Campo } from "@/components/panel/kit/campo";
import { Relacionado } from "@/components/panel/kit/relacionado";
import { Cargando, EstadoError, Vacio } from "@/components/panel/kit/estados";
import { HojaAdaptable } from "@/components/panel/ui/hoja-adaptable";
import { Fila, GrupoLista } from "@/components/panel/kit/lista";
import { Segmentado } from "@/components/panel/kit/segmentado";
import type { Property } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import type { Asesor, Lead } from "@/lib/domain/records";
import { CerrarConsulta, FormularioAnotar, NotasConsulta, SiguienteContacto } from "@/components/panel/consultas/acciones";
import { PersonaDeLaConsulta } from "@/components/panel/consultas/persona";
import { convertirConsulta, crearExpediente, leerMiAsesor } from "@/lib/panel/datos/colecciones";
import { anotar, atender, cerrarConsulta, nuevaConsulta, NOMBRE_CIERRE, programar, reabrir } from "@/lib/panel/datos/consultas-acciones";
import { diaLargo } from "@/lib/panel/calendario";
import { relacionadoConsulta, rutaConsulta, rutaPersona, type GrupoRelacionado } from "@/lib/panel/datos/relacionado";
import { quitarAsunto } from "@/lib/panel/datos/consultas-persona";
import { MenuFila } from "@/components/panel/kit/menu-fila";
import { enlaceWhatsApp, filaConsulta, filtrarConsultas, ordenar, partirPorAntiguedad, respuestaSugerida, type FilaConsulta, type Pestana } from "@/lib/panel/datos/consultas";

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
      if ((e.key === "a" || e.key === "A") && leadAbierto && leadAbierto.estado === "nuevo" && !ocupado) { e.preventDefault(); void atenderLead(leadAbierto); }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [leadAbierto, atenderLead, ocupado]);

  const cargando = leads.cargando;
  const error = leads.error;
  // Por atender, sin buscar: lo de las últimas 24 horas arriba y lo de días atrás aparte, plegado (sugerencia 4).
  const porDias = useMemo(() => (!buscando && pestana === "por_atender" && visibles.length ? partirPorAntiguedad(visibles) : null), [buscando, pestana, visibles]);
  const [verViejas, setVerViejas] = useState(false);
  const fila = (f: FilaConsulta) => (
    <Fila
      key={f.id}
      titulo={f.nombre}
      subtitulo={[buscando ? NOMBRE_PESTANA[f.pestana] : null, f.canal, f.inmueble].filter(Boolean).join(" · ")}
      detalle={f.detalle}
      tonoDetalle={f.urgencia}
      alPulsar={() => abrir(f.id)}
      seleccionada={f.id === abiertaId}
      acciones={<MenuFila nombre={f.nombre} telefono={f.telefono || undefined} ruta={rutaConsulta(f.id)} saludo={respuestaSugerida(f)} />}
    />
  );

  return (
    <div className="pn-pagina" style={{ maxWidth: 760 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <h1 className="pn-h1">Consultas</h1>
        <Boton variante="secundario" onClick={() => setAnotando(true)} aria-keyshortcuts="N">Anotar consulta</Boton>
      </div>
      <p className="pn-sub">{cargando ? "Cargando…" : cuentas.por_atender ? `${cuentas.por_atender} por atender` : "Nadie espera respuesta"}</p>
      <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 260px" }}>
            <Segmentado
              etiqueta="Ver"
              valor={pestana}
              alElegir={setPestana}
              opciones={[
                { valor: "por_atender", etiqueta: "Por atender", cuenta: cuentas.por_atender },
                { valor: "seguimiento", etiqueta: "En seguimiento", cuenta: cuentas.seguimiento },
                { valor: "cerradas", etiqueta: "Cerradas", cuenta: cuentas.cerradas },
              ]}
            />
          </div>
          {loLleva.control ? <div style={{ flex: "1 1 140px" }}>{loLleva.control}</div> : null}
        </div>
        <Campo etiqueta="Buscar" placeholder="Nombre, teléfono o inmueble" value={buscar} onChange={(e) => setBuscar(e.target.value)} type="search" autoComplete="off" />
      </div>
      <div style={{ display: "grid", gap: 20, marginTop: 20 }}>
        {cargando ? <Cargando lineas={4} etiqueta="Cargando consultas" /> : null}
        {error ? <EstadoError texto={error} alReintentar={leads.reintentar} /> : null}
        {!cargando && !error && !buscando && cuentas[pestana] === 0 ? (
          loLleva.activo
            ? <Vacio titulo="Nada de esa persona aquí" texto="Con «Lo lleva» elegido solo se ven sus consultas." icono="llamada" accion={<Boton variante="secundario" onClick={loLleva.quitar}>Ver todo el equipo</Boton>} />
            : <Vacio titulo={VACIOS[pestana].titulo} texto={VACIOS[pestana].texto} icono="llamada" />
        ) : null}
        {!cargando && !error && (buscando || cuentas[pestana] > 0) && visibles.length === 0 ? <Vacio titulo="Nada coincide" texto="Se buscó en las tres pestañas. Prueba con otra palabra." icono="buscar" /> : null}
        {porDias ? (
          <>
            {porDias.recientes.length ? <GrupoLista titulo="Llegaron en las últimas 24 horas">{porDias.recientes.map(fila)}</GrupoLista> : null}
            {porDias.viejas.length ? (
              <section style={{ display: "grid", gap: 8 }}>
                {porDias.recientes.length ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "0 4px" }}>
                    <h2 className="pn-grupo" style={{ margin: 0 }}>{porDias.viejas.length} {porDias.viejas.length === 1 ? "espera" : "esperan"} desde hace días</h2>
                    <Boton variante="texto" aria-expanded={verViejas} onClick={() => setVerViejas((v) => !v)}>{verViejas ? "Ocultar" : "Revisar"}</Boton>
                  </div>
                ) : <h2 className="pn-grupo" style={{ margin: 0 }}>Esperan desde hace días</h2>}
                {verViejas || !porDias.recientes.length ? <GrupoLista>{porDias.viejas.map(fila)}</GrupoLista> : null}
              </section>
            ) : null}
          </>
        ) : visibles.length ? <GrupoLista>{visibles.map(fila)}</GrupoLista> : null}
      </div>

      <HojaAdaptable abierta={abierta !== null} titulo={abierta?.nombre ?? "Consulta"} alCerrar={() => cerrar()}>
        {abierta && leadAbierto ? <DetalleConsulta key={abierta.id} f={abierta} lead={leadAbierto} ocupado={ocupado}
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
            alCrear={(asunto) => crearPersona(leadAbierto, asunto)} alAbrirAsunto={abrirAsunto} />}
        /> : null}
      </HojaAdaptable>
      <HojaAdaptable abierta={anotando} titulo="Anotar consulta" descripcion="Para llamadas y visitas en persona." alCerrar={() => setAnotando(false)}>
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

function DetalleConsulta({ f, grupos, alCopiar, lead, ocupado, alAtender, alProgramar, alAnotar, alCerrar, alReabrir, persona }: { f: FilaConsulta; grupos: GrupoRelacionado[]; alCopiar: (t: string) => void } & Acciones) {
  const [hoy] = useState(() => new Date());
  // La respuesta se puede ajustar antes de enviarla (AUD-03, M4). Arranca con el texto sugerido.
  const [texto, setTexto] = useState(() => respuestaSugerida(f));
  const wa = f.telefono ? enlaceWhatsApp(f.telefono, texto) : null;
  const correo = f.email ? `mailto:${f.email}?subject=${encodeURIComponent("Fortius Inmuebles")}&body=${encodeURIComponent(texto)}` : null;
  const tel = f.telefono?.replace(/[^\d+]/g, "");
  // Anotada a mano (llamada o en persona): ya se habló con ella; no lleva el «gracias por escribir».
  const aMano = lead.origen === "manual";
  // Responder es atender: si sigue por atender, al enviar, llamar o copiar pasa a En seguimiento (con Deshacer).
  const alResponder = f.pestana === "por_atender" && !ocupado ? alAtender : undefined;
  if (aMano) {
    return (
      <div style={{ display: "grid", gap: 16, marginTop: 8 }}>
        <p className={`pn-sub${f.urgencia === "error" ? " pn-tono-error" : f.urgencia === "aviso" ? " pn-tono-aviso" : ""}`}>
          {[f.canal, f.inmueble, f.detalle].filter(Boolean).join(" · ")}
        </p>
        {f.mensaje ? <section><h3 className="pn-grupo">Qué busca</h3><p style={{ margin: 0, whiteSpace: "pre-line" }}>{f.mensaje}</p></section> : null}
        <section>
          <h3 className="pn-grupo">Contacto</h3>
          <p style={{ margin: 0 }}>{[f.telefono, f.email].filter(Boolean).join(" · ") || "Sin teléfono ni correo"}</p>
        </section>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {tel ? <a className="pn-btn pn-btn-secundario" href={`tel:${tel}`} style={{ flex: 1 }}>Llamar</a> : null}
          {f.telefono ? <a className="pn-btn pn-btn-secundario" href={enlaceWhatsApp(f.telefono, "") ?? undefined} target="_blank" rel="noopener noreferrer" style={{ flex: 1 }}>WhatsApp</a> : null}
        </div>
        {f.pestana === "seguimiento" ? <SiguienteContacto lead={lead} hoy={hoy} ocupado={ocupado} alGuardar={alProgramar} /> : null}
        <NotasConsulta lead={lead} ocupado={ocupado} alAnotar={alAnotar} />
        {persona}
        <Relacionado grupos={grupos} />
        {f.pestana === "cerradas" ? <Boton variante="secundario" deshabilitado={ocupado} onClick={alReabrir}>Reabrir</Boton>
          : <CerrarConsulta ocupado={ocupado} alCerrar={alCerrar} />}
      </div>
    );
  }
  return (
    <div style={{ display: "grid", gap: 16, marginTop: 8 }}>
      <p className={`pn-sub${f.urgencia === "error" ? " pn-tono-error" : f.urgencia === "aviso" ? " pn-tono-aviso" : ""}`}>
        {[f.canal, f.inmueble, f.detalle].filter(Boolean).join(" · ")}
      </p>
      <section>
        <h3 className="pn-grupo">Mensaje</h3>
        <p style={{ margin: 0, whiteSpace: "pre-line" }}>{f.mensaje ?? "No dejó mensaje."}</p>
      </section>
      <section>
        <h3 className="pn-grupo">Contacto</h3>
        <p style={{ margin: 0 }}>{[f.telefono, f.email].filter(Boolean).join(" · ") || "Sin teléfono ni correo"}</p>
      </section>
      <section className="pn-campo" style={{ display: "grid", gap: 8 }}>
        <label className="pn-grupo" htmlFor={`respuesta-${f.id}`} style={{ margin: 0 }}>Respuesta lista para enviar</label>
        <textarea id={`respuesta-${f.id}`} rows={4} value={texto} onChange={(e) => setTexto(e.target.value)} style={{ resize: "vertical", minHeight: 96, lineHeight: 1.45 }} />
        <p className="pn-sub" style={{ margin: 0 }}>La envías tú; el panel no manda nada solo.</p>
      </section>
      <div style={{ display: "grid", gap: 8 }}>
        {wa ? <a className="pn-btn pn-btn-primario pn-btn-bloque" href={wa} target="_blank" rel="noopener noreferrer" onClick={alResponder}>Enviar por WhatsApp</a>
          : correo ? <a className="pn-btn pn-btn-primario pn-btn-bloque" href={correo} onClick={alResponder}>Enviar por correo</a> : null}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {tel ? <a className="pn-btn pn-btn-secundario" href={`tel:${tel}`} onClick={alResponder} style={{ flex: 1 }}>Llamar</a> : null}
          {wa && correo ? <a className="pn-btn pn-btn-secundario" href={correo} onClick={alResponder} style={{ flex: 1 }}>Correo</a> : null}
          <Boton variante="secundario" onClick={() => { alCopiar(texto); alResponder?.(); }} style={{ flex: 1 }}>Copiar</Boton>
        </div>
      </div>
      {f.pestana === "por_atender" ? (
        <Boton variante="secundario" bloque deshabilitado={ocupado} onClick={alAtender} aria-keyshortcuts="A">Atender yo</Boton>
      ) : null}
      {f.pestana === "seguimiento" ? <SiguienteContacto lead={lead} hoy={hoy} ocupado={ocupado} alGuardar={alProgramar} /> : null}
      <NotasConsulta lead={lead} ocupado={ocupado} alAnotar={alAnotar} />
      {persona}
      <Relacionado grupos={grupos} />
      {f.pestana === "cerradas" ? <Boton variante="secundario" deshabilitado={ocupado} onClick={alReabrir}>Reabrir</Boton>
        : <CerrarConsulta ocupado={ocupado} alCerrar={alCerrar} />}
    </div>
  );
}

/** useSearchParams pide un límite de Suspense; el esqueleto es el mismo de la carga. */
export default function PaginaConsultas() {
  return <Suspense fallback={<div className="pn-pagina"><Cargando lineas={5} etiqueta="Cargando" /></div>}><Consultas /></Suspense>;
}
