"use client";
import { useId, useMemo, useState, type ReactNode } from "react";

import { Icono } from "@/components/panel/icons";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Desplegable } from "@/components/panel/kit/desplegable";
import { BotonDictar, sumarDictado } from "@/components/panel/kit/dictar";
import { Interruptor } from "@/components/panel/kit/segmentado";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/panel/ui/dropdown-menu";
import {
  agregar, APARTADO, CADA_TAREA, cambiar, diasHasta, ESTADOS_TAREA, fechaCorta, haceCuanto, NOMBRE_EN_QUE_VA, NOMBRE_ENCARGO, NOMBRE_INTERESADO, NOMBRE_PAPEL,
  NOMBRE_CADA, NOMBRE_QUIEN, QUIEN, sumarDias,
  type Apartado, type Asunto, type CadaTarea, type Encargo, type EnQueVa, type EntradaHistorial, type EstadoInteresado, type EstadoTarea, type Etapa, type Papel,
  type PersonaDelAsunto, type Quien, type Tarea,
} from "@/lib/panel/asuntos/api";
import { NOMBRE_TIPO } from "@/lib/backend/consultas-contrato";
import { copiarGuia, cuantasTrae, guardarPlanEnBiblioteca } from "@/lib/panel/biblioteca";
import { precioTexto } from "@/lib/backend/inmuebles-contrato";
import { leerLineaTarea } from "@/lib/panel/linea-tarea";

import { olvidarGuias, useGuias } from "../biblioteca/guias";
import { InmueblesDelAsunto } from "../inmueble/del-asunto";
import { DialogoMensaje, HORAS, personaPara, primerNombre, useFoco, type Hacer } from "./comun";
import { Documentos } from "./documentos";
import { Honorarios, resumenHonorarios } from "./honorarios";
import { Interesados, resumenInteresados } from "./interesados";
import { OpinionJuridica, resumenOpinion } from "./opinion";
import { Personas } from "./personas";
import { Propio, resumenPropio } from "./propios";
import { useAsuntos } from "./proveedor";
import { resumenSituacion, Situacion } from "./situacion";

export const nombreApartado = (x: Apartado) => (x.clave === "propio" ? x.nombre ?? "Apartado" : APARTADO[x.clave].nombre);

/** El ícono de un apartado propio según su vista. */
export const iconoPropio = (x: Apartado) => (x.vista === "texto" ? "nota" : x.vista === "tabla" ? "regla" : x.vista === "galeria" ? "img" : "lista") as "nota" | "regla" | "img" | "lista";

/** El resumen de cada renglón del asunto (boceto: «Laura Méndez y 3 más», «Etapa 1 de 2 · 6 por hacer»). */
export function resumenApartado(x: Apartado, a: Asunto, historial: EntradaHistorial[] | null): string {
  switch (x.clave) {
    case "personas": {
      const vivas = a.personas;
      if (!vivas.length) return "Nadie todavía";
      return vivas.length === 1 ? vivas[0].nombre : `${vivas[0].nombre} y ${vivas.length - 1} más`;
    }
    case "plan": {
      const pend = a.tareas.filter((t) => t.estado === "pendiente").length;
      if (!a.tareas.length) return "Sin tareas";
      const etapas = a.etapas.length ? `${a.etapas.length} etapa${a.etapas.length > 1 ? "s" : ""} · ` : "";
      return `${etapas}${pend ? `${pend} por hacer` : "Todo hecho"}`;
    }
    case "historial": {
      const ultima = historial?.find((e) => e.clase === "nota" || e.clase === "decision") ?? historial?.[0];
      return ultima ? (ultima.clase === "nota" || ultima.clase === "decision" ? ultima.resumen : "Notas, decisiones y cambios") : "Notas, decisiones y cambios";
    }
    case "propio": return resumenPropio(x, a);
    case "inmueble":
      if (!a.inmuebles.length) return "Sin inmueble todavía";
      if (a.inmuebles.length > 1) {
        const cerrados = a.inmuebles.filter((i) => i.estado === "rentado" || i.estado === "vendido").length;
        const apartados = a.inmuebles.filter((i) => i.estado === "apartado").length;
        return [`${a.inmuebles.length} inmuebles`, cerrados ? `${cerrados} cerrado${cerrados > 1 ? "s" : ""}` : "", apartados ? `${apartados} apartado${apartados > 1 ? "s" : ""}` : ""].filter(Boolean).join(" · ");
      }
      return [a.inmuebles[0].tipo ? NOMBRE_TIPO[a.inmuebles[0].tipo as keyof typeof NOMBRE_TIPO] : a.inmuebles[0].nombre, a.inmuebles[0].colonia,
        precioTexto(a.inmuebles[0].precio, a.inmuebles[0].moneda, a.inmuebles[0].operacion), a.inmuebles[0].publicado ? "publicado" : ""].filter(Boolean).join(" · ");
    case "documentos": {
      if (!a.documentos.length) return "Sin documentos todavía";
      const faltan = a.documentos.filter((d) => d.estado === "falta").length;
      const llegaron = a.documentos.filter((d) => d.estado === "recibido").length;
      const vencen = a.documentos.filter((d) => d.vence_el && diasHasta(d.vence_el) <= (d.avisar_dias ?? 15)).length;
      return [faltan ? `${faltan} por pedir` : "", llegaron ? `${llegaron} recibido${llegaron > 1 ? "s" : ""}` : "", vencen ? `${vencen} por vencer` : ""].filter(Boolean).join(" · ") || "Nada pendiente";
    }
    case "situacion": return resumenSituacion(a);
    case "opinion": return resumenOpinion(a);
    case "honorarios": return resumenHonorarios(a);
    case "interesados": return resumenInteresados(a);
  }
}

/** Da los nombres del equipo a quien los necesita (historial de precios). */
function ConNombres({ children }: { children: (nombreDe: (uid: string | null) => string) => ReactNode }) {
  const { nombreDe } = useAsuntos();
  return <>{children(nombreDe)}</>;
}

export function ContenidoApartado({ apartado, asunto, historial, notas, foco, hacer, irA, alAbrirPersona, alVerNotas }: {
  apartado: Apartado; asunto: Asunto; historial: EntradaHistorial[] | null; foco: string | null; hacer: Hacer;
  /** Las notas del asunto (para contar las que mencionan a cada persona). */
  notas: EntradaHistorial[] | null;
  alAbrirPersona: (p: PersonaDelAsunto | null) => void;
  alVerNotas: () => void;
  /** Abre otro apartado del asunto (por ejemplo, de la opinión a Honorarios para cobrar el estudio). */
  irA: (clave: string, foco?: string) => void;
}) {
  switch (apartado.clave) {
    case "personas": return <Personas a={asunto} foco={foco} hacer={hacer} notas={notas} alAbrirPersona={alAbrirPersona} alVerNotas={alVerNotas} />;
    case "plan": return <Plan a={asunto} foco={foco === "nueva-tarea"} hacer={hacer} />;
    case "historial": return <Historial a={asunto} entradas={historial} foco={foco === "nueva-nota"} hacer={hacer} />;
    case "inmueble": return <ConNombres>{(nombreDe) => <InmueblesDelAsunto a={asunto} nombreDe={nombreDe} recargar={() => void hacer(async () => undefined)} />}</ConNombres>;
    case "documentos": return <Documentos a={asunto} hacer={hacer} />;
    case "situacion": return <Situacion a={asunto} hacer={hacer} />;
    case "opinion": return <OpinionJuridica a={asunto} hacer={hacer} irA={irA} />;
    case "honorarios": return <Honorarios a={asunto} foco={foco} hacer={hacer} />;
    case "interesados": return <Interesados a={asunto} foco={foco === "nuevo-interesado"} hacer={hacer} />;
    case "propio": return <Propio key={`${apartado.id}-${apartado.vista}`} a={asunto} x={apartado} foco={foco === "nueva-fila"} hacer={hacer} />;
  }
}

// ── Plan ─────────────────────────────────────────────────────────────────────────────────────────────
const POSPONER = [["Mañana", 1], ["En 3 días", 3], ["En una semana", 7], ["En un mes", 30]] as const;
const NOMBRE_ESTADO: Record<EstadoTarea, string> = { pendiente: "Por hacer", hecha: "Hecha", no_aplica: "No aplica", no_se_puede: "No se puede todavía" };

const esCada = (v: string | undefined): v is CadaTarea => (CADA_TAREA as readonly string[]).includes(v ?? "");

/** La tarea a la que espera, si sigue pendiente (cuando ya terminó, deja de verse). */
const esperaPendiente = (a: Asunto, t: Tarea) => (t.espera_a ? a.tareas.find((x) => x.id === t.espera_a && x.estado === "pendiente") ?? null : null);

/** Lo que se ve bajo el título de la tarea: quién, cuándo, si le toca a otro cuándo volver a preguntar, a qué espera y si se repite. */
function metaTarea(a: Asunto, t: Tarea): { texto: string; atrasada: boolean } {
  if (t.estado === "no_aplica" || t.estado === "no_se_puede") return { texto: [NOMBRE_ESTADO[t.estado], t.motivo].filter(Boolean).join(" · "), atrasada: false };
  const n = t.fecha ? diasHasta(t.fecha) : null;
  const espera = t.estado === "pendiente" ? esperaPendiente(a, t) : null;
  const cada = t.repetir?.cada;
  const repite = esCada(cada) ? NOMBRE_CADA[cada].toLowerCase() : "";
  const con = t.persona_id ? a.personas.find((p) => p.persona_id === t.persona_id) : undefined;
  const partes = [NOMBRE_QUIEN[t.quien], fechaCorta(t.fecha, t.hora?.slice(0, 5)), con ? `con ${primerNombre(con.nombre)}` : "", espera ? `espera a «${espera.titulo}»` : "", repite];
  // Volver a preguntar solo se ve cuando ya llegó el día de la tarea (o no tiene): antes sería ruido.
  if (t.estado === "pendiente" && t.quien !== "fortius" && t.volver_a_preguntar && (n === null || n <= 0)) partes.push(`volver a preguntar ${fechaCorta(t.volver_a_preguntar).toLowerCase()}`);
  return { texto: partes.filter(Boolean).join(" · "), atrasada: t.estado === "pendiente" && n !== null && n < 0 };
}

/** La tarea abierta: cómo va (con su motivo si no aplica o no se puede todavía), quién, día y hora. */
function EdicionTarea({ a, t, hacer, alCerrar }: { a: Asunto; t: Tarea; hacer: Hacer; alCerrar: () => void }) {
  const id = useId();
  const [titulo, setTitulo] = useState(t.titulo);
  const [motivo, setMotivo] = useState(t.motivo ?? "");
  const [mensaje, setMensaje] = useState(false);
  const poner = (c: Record<string, unknown>, aviso?: string) => hacer(() => cambiar(a.id, "tareas", { id: t.id, version: t.version, ...c }), aviso);
  const conMotivo = t.estado === "no_aplica" || t.estado === "no_se_puede";
  const para = t.quien !== "fortius" ? personaPara(a, t.quien) : null;
  const espera = esperaPendiente(a, t);
  const deInforme = t.repetir?.que === "informe";
  const cadaDe = t.repetir?.cada;
  const cada = esCada(cadaDe) ? cadaDe : null;
  // Las otras tareas del asunto: primero las que faltan; las hechas también, por si se anota después.
  const otras = useMemo(() => a.tareas.filter((x) => x.id !== t.id && x.espera_a !== t.id)
    .sort((x, y) => Number(x.estado !== "pendiente") - Number(y.estado !== "pendiente"))
    .slice(0, 80).map((x) => ({ valor: x.id, etiqueta: `${x.titulo.slice(0, 80)}${x.estado === "pendiente" ? "" : ` · ${NOMBRE_ESTADO[x.estado].toLowerCase()}`}` })), [a.tareas, t.id]);
  return (
    <div className="as-pad as-form as-borde-arriba as-edicion">
      <label className="pn-campo" htmlFor={`${id}-t`}>Qué hay que hacer
        <input id={`${id}-t`} className="as-inp as-inp-borde" value={titulo} maxLength={300} onChange={(e) => setTitulo(e.target.value)}
          onBlur={() => { const v = titulo.trim(); if (v && v !== t.titulo) void poner({ titulo: v }); }} />
      </label>
      <div className="as-g2">
        <Desplegable etiqueta="Cómo va" valor={t.estado} opciones={ESTADOS_TAREA.map((e) => ({ valor: e, etiqueta: NOMBRE_ESTADO[e] }))}
          alElegir={(v) => { if (v && v !== t.estado) void poner({ estado: v }, NOMBRE_ESTADO[v]); }} />
        <Desplegable etiqueta="Quién la hace" valor={t.quien} opciones={QUIEN.map((v) => ({ valor: v, etiqueta: NOMBRE_QUIEN[v] }))}
          alElegir={(v) => { if (v && v !== t.quien) void poner({ quien: v }, `Le toca a ${NOMBRE_QUIEN[v].toLowerCase()}`); }} />
        <label className="pn-campo" htmlFor={`${id}-f`}>Día
          <input id={`${id}-f`} type="date" className="as-inp as-inp-borde" value={t.fecha ?? ""} onChange={(e) => void poner({ fecha: e.target.value || null })} />
        </label>
        <Desplegable etiqueta="Hora" valor={t.hora?.slice(0, 5) ?? ""} vacio="Sin hora" opciones={HORAS} alElegir={(v) => void poner({ hora: v || null })} />
        <Desplegable etiqueta="Espera a" valor={t.espera_a ?? ""} vacio="No espera a otra" opciones={otras}
          ayuda={espera ? "Avisa, no frena: puedes hacerla antes." : undefined}
          alElegir={(v) => { if ((v || null) !== t.espera_a) void poner({ espera_a: v || null }, v ? "Espera a otra tarea" : "Ya no espera a otra"); }} />
        {deInforme ? (
          <p className="as-m as-edicion-nota"><Icono nombre="ciclo" tamano={14} />{cada ? NOMBRE_CADA[cada] : "Se repite"} con su informe</p>
        ) : (
          <Desplegable etiqueta="Se repite" valor={cada ?? ""} vacio="No se repite"
            opciones={CADA_TAREA.map((c) => ({ valor: c, etiqueta: NOMBRE_CADA[c] }))}
            ayuda={cada ? "Al dejarla hecha nace la siguiente." : undefined}
            alElegir={(v) => { if ((v || null) !== cada) void poner({ repetir: v || null }, v ? NOMBRE_CADA[v] : "Ya no se repite"); }} />
        )}
      </div>
      {conMotivo ? (
        <label className="pn-campo" htmlFor={`${id}-m`}>{t.estado === "no_aplica" ? "Por qué no aplica" : "Por qué no se puede todavía"}
          <input id={`${id}-m`} className="as-inp as-inp-borde" value={motivo} maxLength={1000} onChange={(e) => setMotivo(e.target.value)}
            onBlur={() => { if (motivo.trim() !== (t.motivo ?? "")) void poner({ motivo: motivo.trim() || null }, "Motivo anotado"); }}
            placeholder={t.estado === "no_se_puede" ? "Falta la sentencia, el banco no responde…" : "No hay adeudo, ya se tiene…"} />
        </label>
      ) : null}
      {t.estado === "pendiente" && t.quien !== "fortius" ? (
        <div className="as-ban" role="status">
          <Icono nombre="reloj" tamano={16} />
          <span>{t.volver_a_preguntar ? `Volver a preguntar ${fechaCorta(t.volver_a_preguntar).toLowerCase()}` : "Le toca a otro"}{t.recordada_el ? ` · se le recordó ${haceCuanto(t.recordada_el)}` : ""}</span>
          <span className="as-sp" />
          <button type="button" className="as-btn" onClick={() => setMensaje(true)}><Icono nombre="chat" tamano={16} />Recordarle</button>
        </div>
      ) : null}
      <div className="as-fila as-fin">
        <button type="button" className="as-btn as-gho" onClick={() => { alCerrar(); void poner({ quitar: true }, "Tarea quitada"); }}><Icono nombre="bote" tamano={16} />Quitar</button>
        <button type="button" className="as-btn" onClick={alCerrar}>Listo</button>
      </div>
      <DialogoMensaje abierto={mensaje} titulo="Recordarle" para={para} alCerrar={() => setMensaje(false)}
        inicial={`Hola${para ? ` ${primerNombre(para.nombre)}` : ""}, ¿cómo va lo de «${t.titulo}»? Es para ${a.nombre}. Quedo al pendiente.`}
        alEnviar={() => void poner({ recordar: true }, "Se le recordó: volver a preguntar en 3 días")} />
    </div>
  );
}

function RenglonTarea({ a, t, hacer, abierta, alAbrir }: { a: Asunto; t: Tarea; hacer: Hacer; abierta: boolean; alAbrir: (abrir: boolean) => void }) {
  const hecha = t.estado === "hecha";
  const pendiente = t.estado === "pendiente";
  const meta = metaTarea(a, t);
  return (
    <div className="as-t-env" data-abierta={abierta || undefined}>
      <div className="as-t" data-est={t.estado}>
        <button type="button" className="as-ckb" aria-label={`${hecha ? "Desmarcar" : "Marcar hecha"}: ${t.titulo}`}
          onClick={() => void hacer(() => cambiar(a.id, "tareas", { id: t.id, version: t.version, estado: hecha ? "pendiente" : "hecha" }), hecha ? "Pendiente otra vez" : t.repetir?.cada && t.repetir.que !== "informe" ? "Hecha; ya está la siguiente" : "Tarea hecha")}>
          <span className="as-ck">{hecha ? <Icono nombre="ok" tamano={12} /> : !pendiente ? <Icono nombre="x" tamano={11} /> : null}</span>
        </button>
        <button type="button" className="as-tb as-tb-boton" aria-expanded={abierta} onClick={() => alAbrir(!abierta)}>
          <span className="as-n">{t.titulo}</span>
          <span className={`as-m${meta.atrasada ? " as-bad" : ""}`}>{meta.texto}</span>
        </button>
        {pendiente ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="as-btn as-gho as-ico" aria-label={`Posponer: ${t.titulo}`} title="Posponer"><Icono nombre="reloj" tamano={17} /></DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Posponer</DropdownMenuLabel>
              {POSPONER.map(([txt, d]) => (
                <DropdownMenuItem key={txt} onSelect={() => void hacer(() => cambiar(a.id, "tareas", { id: t.id, version: t.version, fecha: sumarDias(d) }), `Pasó a ${fechaCorta(sumarDias(d)).toLowerCase()}`)}>
                  <Icono nombre="cal" tamano={16} />{txt}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
      {abierta ? <EdicionTarea key={t.version} a={a} t={t} hacer={hacer} alCerrar={() => alAbrir(false)} /> : null}
    </div>
  );
}

function CabezaEtapa({ a, e, tareas, hacer }: { a: Asunto; e: Etapa; tareas: Tarea[]; hacer: Hacer }) {
  const pend = tareas.filter((t) => t.estado === "pendiente").length;
  return (
    <p className="as-sub as-sub-fila">
      <span>{e.nombre}</span>
      <span className="as-fila as-nw">
        <span className="as-m">{pend ? `${pend} por hacer` : tareas.length ? "Todo hecho" : ""}</span>
        <DropdownMenu>
          <DropdownMenuTrigger className="as-btn as-gho as-ico as-ico-chico" aria-label={`Opciones de ${e.nombre}`}><Icono nombre="dots" tamano={16} /></DropdownMenuTrigger>
          <DropdownMenuContent>
            {pend ? (
              <DropdownMenuItem onSelect={() => void hacer(() => cambiar(a.id, "etapas", { id: e.id, version: e.version, todo_hecho: true }), `${e.nombre}: todo hecho`)}>
                <Icono nombre="ok" tamano={16} />Marcar todo hecho
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem peligro onSelect={() => void hacer(() => cambiar(a.id, "etapas", { id: e.id, version: e.version, quitar: true }), "Etapa quitada. Sus tareas quedan sin etapa")}>
              <Icono nombre="bote" tamano={16} />Quitar la etapa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </span>
    </p>
  );
}

/** «En el tiempo»: las tareas por día, de lo atrasado a lo que viene; lo que no tiene fecha va al final. */
function LineaDeTiempo({ a, hacer, abierta, setAbierta }: { a: Asunto; hacer: Hacer; abierta: string | null; setAbierta: (id: string | null) => void }) {
  const pendientes = a.tareas.filter((t) => t.estado === "pendiente");
  const conFecha = pendientes.filter((t) => t.fecha).sort((x, y) => `${x.fecha}${x.hora ?? ""}`.localeCompare(`${y.fecha}${y.hora ?? ""}`));
  const dias: { clave: string; titulo: string; tareas: Tarea[]; atrasado: boolean }[] = [];
  for (const t of conFecha) {
    const atrasado = diasHasta(t.fecha as string) < 0;
    const clave = atrasado ? "atrasado" : (t.fecha as string);
    let d = dias.find((x) => x.clave === clave);
    if (!d) { d = { clave, titulo: atrasado ? "Atrasado" : fechaCorta(t.fecha), tareas: [], atrasado }; dias.push(d); }
    d.tareas.push(t);
  }
  const sinFecha = pendientes.filter((t) => !t.fecha);
  if (sinFecha.length) dias.push({ clave: "sin", titulo: "Sin fecha", tareas: sinFecha, atrasado: false });
  const hechas = a.tareas.filter((t) => t.estado !== "pendiente").length;
  if (!dias.length) return <p className="as-m">{hechas ? "Todo hecho." : "Todavía no hay tareas."}</p>;
  return (
    <ol className="as-tiempo">
      {dias.map((d) => (
        <li key={d.clave} data-atrasado={d.atrasado || undefined}>
          <p className="as-tiempo-dia">{d.titulo}</p>
          <div className="as-card as-tareas">
            {d.tareas.map((t) => <RenglonTarea key={t.id} a={a} t={t} hacer={hacer} abierta={abierta === t.id} alAbrir={(x) => setAbierta(x ? t.id : null)} />)}
          </div>
        </li>
      ))}
      {hechas ? <li><p className="as-tiempo-dia as-m">{hechas} hecha{hechas > 1 ? "s" : ""} o cerrada{hechas > 1 ? "s" : ""}: en la vista de lista</p></li> : null}
    </ol>
  );
}

function Plan({ a, foco, hacer }: { a: Asunto; foco: boolean; hacer: Hacer }) {
  const id = useId();
  const ref = useFoco<HTMLInputElement>(foco);
  const [vista, setVista] = useState<"lista" | "tiempo">("lista");
  const [abierta, setAbierta] = useState<string | null>(null);
  const [titulo, setTitulo] = useState("");
  const [fecha, setFecha] = useState(sumarDias(0));
  const [quien, setQuien] = useState<Quien>("fortius");
  const [etapa, setEtapa] = useState<string>(a.etapas.at(-1)?.id ?? "");
  const [nuevaEtapa, setNuevaEtapa] = useState("");
  const { avisar } = useAvisos();
  const planes = useGuias("que_hacer");
  // Escribir en una línea: «Llamar a Laura jueves 10am» trae su día, su hora y a Laura sin tocar los demás campos.
  const [hoy] = useState(() => new Date());
  const personasLinea = useMemo(() => a.personas.map((p) => ({ id: p.persona_id, nombre: p.nombre, asuntos: [a.id] })), [a.personas, a.id]);
  const linea = useMemo(() => leerLineaTarea(titulo, hoy, personasLinea), [titulo, hoy, personasLinea]);
  const leido = linea.pastillas.slice(1);
  const grupos = [
    ...a.etapas.map((e) => ({ id: e.id, etapa: e as Etapa | null, tareas: a.tareas.filter((t) => t.etapa_id === e.id) })),
    { id: "", etapa: null, tareas: a.tareas.filter((t) => !t.etapa_id || !a.etapas.some((e) => e.id === t.etapa_id)) },
  ].filter((g) => g.id || g.tareas.length);

  return (
    <>
      <div className="as-fila">
        {a.tareas.length ? (
          <Interruptor etiqueta="Cómo ver el plan" sinEtiqueta opciones={[{ valor: "lista", etiqueta: "Por etapas" }, { valor: "tiempo", etiqueta: "En el tiempo" }] as const} valor={vista} alElegir={setVista} />
        ) : null}
        <span className="as-sp" />
        <DropdownMenu>
          <DropdownMenuTrigger className="as-btn"><Icono nombre="lib" tamano={16} />Biblioteca<Icono nombre="down" tamano={14} /></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-64">
            {planes?.length ? (
              <>
                <DropdownMenuLabel>Copiar un plan</DropdownMenuLabel>
                {planes.map((g) => (
                  <DropdownMenuItem key={g.id} onSelect={() => void hacer(() => copiarGuia(g.id, a.id), `De la Biblioteca: ${g.nombre}`)}>
                    <Icono nombre="lista" tamano={16} />{g.nombre}<span className="as-m as-num" style={{ marginLeft: "auto" }}>{cuantasTrae(g)}</span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </>
            ) : null}
            <DropdownMenuItem onSelect={() => void hacer(async () => {
              if (!a.tareas.length) throw new Error("Este asunto todavía no tiene tareas en su plan.");
              await guardarPlanEnBiblioteca(a.id, `Plan de ${a.nombre}`.slice(0, 160));
              olvidarGuias();
            }, "Guardado en la Biblioteca. Ahí le cambias el nombre")}>
              <Icono nombre="lib" tamano={16} />Guardar este plan en la Biblioteca
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {vista === "tiempo" ? <LineaDeTiempo a={a} hacer={hacer} abierta={abierta} setAbierta={setAbierta} /> : (
        <>
          {grupos.map((g) => (
            <div key={g.id || "sin"}>
              {g.etapa ? <CabezaEtapa a={a} e={g.etapa} tareas={g.tareas} hacer={hacer} /> : a.etapas.length ? <p className="as-sub">Sin etapa</p> : null}
              <div className="as-card as-tareas">
                {g.tareas.length ? g.tareas.map((t) => <RenglonTarea key={t.id} a={a} t={t} hacer={hacer} abierta={abierta === t.id} alAbrir={(x) => setAbierta(x ? t.id : null)} />)
                  : <p className="as-m as-pad">Sin tareas.</p>}
              </div>
            </div>
          ))}
          {!grupos.length ? <p className="as-m">Todavía no hay tareas.</p> : null}
        </>
      )}

      <form className="as-card as-pad as-form" onSubmit={(e) => {
        e.preventDefault();
        const t = titulo.trim();
        if (!t) return;
        setTitulo("");
        // Lo que dice la línea (día, hora, persona) manda sobre el campo de fecha; el título queda sin el «cuándo».
        const l = linea;
        void hacer(() => agregar(a.id, "tareas", {
          titulo: (l.fecha || l.hora ? l.titulo : t) || t, quien, fecha: l.dia ?? (fecha || l.fecha || null), hora: l.hora, clase: l.clase,
          etapa_id: etapa || null, persona_id: l.persona?.id ?? null, ...(l.fecha || l.hora || l.persona ? { origen: "linea" } : {}),
        }),
          quien === "fortius" ? "Tarea agregada" : "Tarea agregada: volver a preguntar en 3 días").then(() => ref.current?.focus());
      }}>
        <p className="as-sub">Nueva tarea</p>
        <label className="pn-campo" htmlFor={`${id}-t`}>Qué hay que hacer
          <span className="as-con-dictar">
            <input ref={ref} id={`${id}-t`} className="as-inp as-inp-borde" value={titulo} maxLength={300} onChange={(e) => setTitulo(e.target.value)}
              placeholder="Llamar a Laura jueves 10am" aria-describedby={leido.length ? `${id}-l` : undefined} />
            <BotonDictar que="la tarea" alDictar={(x) => setTitulo((v) => sumarDictado(v, x))} alFallar={avisar} />
          </span>
        </label>
        {leido.length ? (
          <p id={`${id}-l`} className="as-leido" aria-live="polite">
            {leido.map((p) => <span key={p.k} className="pn-chp"><i>{p.k}</i><b>{p.v}</b></span>)}
          </p>
        ) : null}
        <div className="as-g2">
          <Desplegable etiqueta="Quién la hace" valor={quien} opciones={QUIEN.map((v) => ({ valor: v, etiqueta: NOMBRE_QUIEN[v] }))} alElegir={(v) => { if (v) setQuien(v); }} />
          <label className="pn-campo" htmlFor={`${id}-f`}>Para cuándo
            <input id={`${id}-f`} type="date" className="as-inp as-inp-borde" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </label>
          {a.etapas.length ? (
            <Desplegable etiqueta="Etapa" valor={etapa} vacio="Sin etapa" opciones={a.etapas.map((e) => ({ valor: e.id, etiqueta: e.nombre }))} alElegir={setEtapa} />
          ) : null}
        </div>
        <button type="submit" className="as-btn as-pri" aria-disabled={!titulo.trim()}><Icono nombre="mas" tamano={16} />Agregar</button>
      </form>

      <form className="as-fila as-nueva-etapa" onSubmit={(e) => {
        e.preventDefault();
        const n = nuevaEtapa.trim();
        if (!n) return;
        setNuevaEtapa("");
        void hacer(async () => { const r = await agregar<{ id: string }>(a.id, "etapas", { nombre: n }); setEtapa(r.id); }, `Etapa nueva: ${n}`);
      }}>
        <input className="as-inp as-inp-borde" value={nuevaEtapa} maxLength={120} onChange={(e) => setNuevaEtapa(e.target.value)} placeholder="Nueva etapa" aria-label="Nombre de la etapa nueva" />
        {nuevaEtapa.trim() ? <button type="submit" className="as-btn">Agregar etapa</button> : null}
      </form>
    </>
  );
}

// ── Historial ────────────────────────────────────────────────────────────────────────────────────────
type Valores = Record<string, { antes: unknown; ahora: unknown }>;
const texto = (v: unknown) => (typeof v === "string" ? v : "");

function describir(e: EntradaHistorial, a: Asunto, nombreDe: (id: string) => string): string {
  if (e.clase !== "cambio") return e.resumen;
  const v: Valores = e.detalle?.valores ?? {};
  const campos = e.detalle?.campos ?? [];
  const creado = e.resumen === "Se creó";
  switch (e.entidad) {
    case "asunto": {
      if (creado) return "Se abrió el asunto";
      if (e.resumen !== "Cambió: " + campos.join(", ")) return e.resumen; // Eliminados y restaurado
      const partes: string[] = [];
      for (const c of campos) {
        const ahora = v[c]?.ahora;
        if (c === "en_que_va") partes.push(`Pasó a ${(NOMBRE_EN_QUE_VA[ahora as EnQueVa] ?? "otro momento").toLowerCase()}`);
        else if (c === "nombre") partes.push(`Nombre: ${texto(ahora)}`);
        else if (c === "responsable_id") partes.push(`Ahora lo lleva ${nombreDe(texto(ahora))}`);
        else if (c === "en_espera") partes.push(ahora ? "En espera" : "Se reanudó");
        else if (c === "resultado" && ahora) partes.push(ahora === "se_logro" ? "Se cerró: se logró" : "Se cerró: no se dio");
        else if (c === "encargos") partes.push(`Encargo: ${(Array.isArray(ahora) ? ahora : []).map((x) => NOMBRE_ENCARGO[x as Encargo] ?? "").filter(Boolean).join(", ").toLowerCase() || "ninguno"}`);
        else if (c === "situacion") partes.push("Cambió la situación");
        else if (c === "notas_fijadas") {
          const antes = v[c]?.antes;
          partes.push((Array.isArray(ahora) ? ahora.length : 0) >= (Array.isArray(antes) ? antes.length : 0) ? "Fijó una nota" : "Soltó una nota");
        }
      }
      return partes.join(" · ") || "Cambió el asunto";
    }
    case "apartado": {
      const x = a.apartados.find((y) => y.id === e.entidad_id);
      const n = x ? nombreApartado(x) : "un apartado";
      if (creado) return `Se agregó ${n}`;
      if (campos.includes("visible")) return v.visible?.ahora ? `Volvió ${n}` : `Se quitó ${n}`;
      return `Cambió ${n}`;
    }
    case "tarea": {
      const t = a.tareas.find((y) => y.id === e.entidad_id);
      const n = t?.titulo || texto(v.titulo?.ahora) || "una tarea";
      if (creado) return `Tarea nueva: ${n}`;
      if (e.resumen === "Se mandó a Eliminados") return `Tarea quitada: ${n}`;
      if (campos.includes("estado")) {
        const est = v.estado?.ahora;
        return est === "hecha" ? `Hecha: ${n}` : est === "pendiente" ? `Pendiente otra vez: ${n}` : est === "no_aplica" ? `No aplica: ${n}` : `No se puede todavía: ${n}`;
      }
      if (campos.includes("fecha")) return `${n}: pasó a ${fechaCorta(texto(v.fecha?.ahora) || null).toLowerCase()}`;
      return `Cambió la tarea ${n}`;
    }
    case "etapa":
      return creado ? `Etapa nueva: ${a.etapas.find((y) => y.id === e.entidad_id)?.nombre ?? ""}`.trim() : "Cambió una etapa";
    case "asunto_persona": {
      const p = a.personas.find((y) => y.id === e.entidad_id);
      const n = p?.nombre ?? "una persona";
      if (creado) return `Se agregó ${n}${p ? ` como ${NOMBRE_PAPEL[p.papel].toLowerCase()}` : ""}`;
      if (campos.includes("retirado_el")) return v.retirado_el?.ahora ? `Se quitó a ${n}` : `Volvió ${n}`;
      if (campos.includes("papel")) return `${n} ahora es ${(NOMBRE_PAPEL[v.papel?.ahora as Papel] ?? "otro papel").toLowerCase()}`;
      return `Cambió ${n}`;
    }
    case "documento": {
      const d = a.documentos.find((y) => y.id === e.entidad_id);
      const n = d?.nombre ?? "un documento";
      if (creado) return `Documento por pedir: ${n}`;
      const est = v.estado?.ahora;
      return est === "recibido" ? `Llegó: ${n}` : est === "no_aplica" ? `No aplica: ${n}` : est === "falta" ? `Falta otra vez: ${n}` : `Cambió ${n}`;
    }
    case "opinion": {
      const r = v.resultado?.ahora;
      return r === "factible" ? "Opinión jurídica: factible" : r === "factible_con_observaciones" ? "Opinión jurídica: factible con observaciones" : r === "no_factible" ? "Opinión jurídica: no factible" : "Cambió la opinión jurídica";
    }
    case "presupuesto": {
      const p = a.presupuestos.find((y) => y.id === e.entidad_id);
      const n = `el presupuesto${p ? ` ${p.numero}` : ""}`;
      if (creado) return `Se hizo ${n}`;
      const est = v.estado?.ahora;
      return est === "enviado" ? `Se envió ${n}` : est === "aceptado" ? `Aceptaron ${n}` : est === "rechazado" ? `Rechazaron ${n}` : `Cambió ${n}`;
    }
    case "cobro": {
      const c = a.cobros.find((y) => y.id === e.entidad_id);
      return creado ? `Cobro${c ? ` de $${c.monto.toLocaleString("es-MX")} ${c.moneda}` : ""}` : "Cambió un cobro";
    }
    case "interesado": {
      const i = a.interesados.find((y) => y.id === e.entidad_id);
      const n = i?.nombre ?? "un interesado";
      return creado ? `Interesado: ${n}` : `${n}: ${NOMBRE_INTERESADO[v.estado?.ahora as EstadoInteresado]?.toLowerCase() ?? "cambió"}`;
    }
    case "oferta": {
      const r = v.respuesta?.ahora;
      return creado ? "Oferta nueva" : r === "aceptada" ? "Se aceptó una oferta" : r === "rechazada" ? "Se rechazó una oferta" : r === "contraoferta" ? "Contraoferta" : "Cambió una oferta";
    }
    case "liga_cliente":
      return creado ? "Liga para que el cliente suba sus documentos" : "Se canceló la liga del cliente";
    default:
      return e.resumen;
  }
}

function Historial({ a, entradas, foco, hacer }: { a: Asunto; entradas: EntradaHistorial[] | null; foco: boolean; hacer: Hacer }) {
  const { nombreDe } = useAsuntos();
  const ref = useFoco<HTMLTextAreaElement>(foco);
  const [clase, setClase] = useState<"nota" | "decision">("nota");
  const [nota, setNota] = useState("");
  return (
    <>
      <form className="as-card as-pad as-form" onSubmit={(e) => {
        e.preventDefault();
        const t = nota.trim();
        if (!t) return;
        setNota("");
        void hacer(() => agregar(a.id, "historial", { clase, texto: t }), clase === "decision" ? "Decisión anotada" : "Nota anotada");
      }}>
        <Interruptor etiqueta="Qué anotas" sinEtiqueta opciones={[{ valor: "nota", etiqueta: "Nota" }, { valor: "decision", etiqueta: "Decisión" }] as const} valor={clase} alElegir={setClase} />
        <textarea ref={ref} className="as-inp as-inp-borde as-area" rows={2} value={nota} maxLength={2000} onChange={(e) => setNota(e.target.value)}
          placeholder={clase === "decision" ? "Qué se decidió y por qué" : "Qué pasó"} aria-label={clase === "decision" ? "Decisión" : "Nota"} />
        {nota.trim() ? <button type="submit" className="as-btn as-pri">Guardar</button> : null}
      </form>
      {entradas === null ? <div className="as-cargando" aria-busy="true">{[0, 1].map((i) => <span key={i} />)}</div> : !entradas.length ? <p className="as-m">Todavía no hay nada.</p> : (
        <ol className="as-card as-hist">
          {entradas.map((e) => (
            <li key={e.id} className="as-ren as-ren-alto">
              <span className={`as-hico as-hico-${e.clase}`} aria-hidden><Icono nombre={e.clase === "decision" ? "estrella" : e.clase === "nota" ? "nota" : "reloj"} tamano={14} /></span>
              <span className="as-ren-c as-ren-libre">
                <span className="as-htxt">{e.clase === "decision" ? <b>Decisión: </b> : null}{describir(e, a, nombreDe)}</span>
                <span>{haceCuanto(e.created_at)} · {e.actor_tipo === "usuario" && e.actor_id ? nombreDe(e.actor_id) : e.actor_tipo === "publico" ? "Desde el sitio" : "Sistema"}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
