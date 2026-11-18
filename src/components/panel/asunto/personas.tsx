"use client";
import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useState } from "react";

import { EditarDato, FilaDato, GrupoDatos, Pestanas, copiarTexto } from "@/components/panel/fichas/piezas";
import { Icono, type NombreIcono } from "@/components/panel/icons";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Desplegable } from "@/components/panel/kit/desplegable";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/panel/ui/dropdown-menu";
import { Switch } from "@/components/panel/ui/switch";
import {
  agregar, cambiar, cambiarFicha, CLASES_PERSONA, iniciales, leerFicha, NOMBRE_PAPEL, PAPELES,
  type Asunto, type CambioFicha, type CampoDato, type ClasePersona, type EntradaHistorial, type FichaPersona, type Papel,
  type PersonaDelAsunto, type PersonaDuplicada, type ResultadoPersona,
} from "@/lib/panel/asuntos/api";

import { useFoco, type Hacer } from "./comun";
import { Pildora } from "./pildora";
import { useRegresoDeVentana } from "./ventana";

/**
 * Personas de un asunto (SPEC.md, sección 6, «Personas dentro de un asunto»; decisión del titular del 17/11/2026):
 * al abrir, agrupadas por su lugar en el caso; al tocar a una, su ficha con la lista de todas a un lado.
 * La flecha ← de la ventana regresa de la ficha a los grupos.
 */

const GRUPOS: readonly { clave: string; titulo: string; icono: NombreIcono; papeles: readonly Papel[] }[] = [
  { clave: "busca", titulo: "Quien nos busca", icono: "tel", papeles: ["contacto"] },
  { clave: "duenos", titulo: "Dueños y herederos", icono: "llave", papeles: ["propietario", "titular", "heredero", "copropietario", "vendedor"] },
  { clave: "otro", titulo: "Del otro lado", icono: "users", papeles: ["comprador", "inquilino", "inversionista", "contraparte"] },
  { clave: "ayudan", titulo: "Quienes ayudan", icono: "edif", papeles: ["apoderado", "abogado", "notaria", "banco"] },
];
/** El papel con que nace quien se agrega desde cada grupo. */
const PAPEL_DEL_GRUPO: Record<string, Papel> = { busca: "contacto", duenos: "propietario", otro: "comprador", ayudan: "abogado" };
const NOMBRE_CLASE: Record<ClasePersona, string> = { persona: "Persona", empresa: "Empresa", institucion: "Institución" };
const ESTADOS_CIVILES = ["Soltero(a)", "Casado(a)", "Unión libre", "Divorciado(a)", "Viudo(a)"] as const;
const ESTADO_DOC: Record<string, { texto: string; clase: string }> = {
  falta: { texto: "Falta", clase: "as-pill as-pill-warn" }, recibido: { texto: "Recibido", clase: "as-pill as-pill-ok" }, no_aplica: { texto: "No aplica", clase: "as-pill" },
};

type Vista = { k: "grupos" } | { k: "ficha"; id: string } | { k: "nueva"; papel: Papel };

const digitos = (p: PersonaDelAsunto) => p.telefono?.replace(/\D/g, "") ?? "";
const puedeContactar = (p: PersonaDelAsunto) => Boolean(digitos(p)) && !p.fallecida && !p.no_contactar;
const mencionaA = (n: EntradaHistorial, p: PersonaDelAsunto) =>
  (n.clase === "nota" || n.clase === "decision") && (Boolean(n.detalle?.ligas?.personas?.includes(p.persona_id)) || n.resumen.includes(`@${p.nombre}`));

function Avatar({ p, grande }: { p: PersonaDelAsunto; grande?: boolean }) {
  return (
    <span className={grande ? "as-av as-av-gr" : "as-av"} data-ido={p.fallecida || undefined} data-org={p.clase !== "persona" || undefined} aria-hidden>
      {p.clase === "persona" ? iniciales(p.nombre) : <Icono nombre="edif" tamano={grande ? 20 : 15} />}
    </span>
  );
}

export function Personas({ a, foco, hacer, notas, alAbrirPersona, alVerNotas }: {
  a: Asunto; foco: string | null; hacer: Hacer; notas: EntradaHistorial[] | null;
  /** Avisa qué ficha está abierta, para ligar a ella las notas que se escriban. */
  alAbrirPersona: (p: PersonaDelAsunto | null) => void;
  /** «Ver en notas»: abre el costado con las notas que la mencionan. */
  alVerNotas: () => void;
}) {
  /** Lo que pide el foco: «Nuevo → Persona» o una mención en una nota (@Laura). */
  const vistaPara = (f: string | null): Vista | null => {
    if (f === "nueva-persona") return { k: "nueva", papel: a.personas.length ? "propietario" : "contacto" };
    const p = f?.startsWith("persona:") ? a.personas.find((x) => x.persona_id === f.slice(8)) : undefined;
    return p ? { k: "ficha", id: p.id } : null;
  };
  const [vista, setVista] = useState<Vista>(() => vistaPara(foco) ?? { k: "grupos" });
  // Si llega otro foco con la ventana ya abierta, se sigue (solo cuando cambia: al recargar el asunto no se mueve).
  const [focoVisto, setFocoVisto] = useState(foco);
  if (foco !== focoVisto) {
    setFocoVisto(foco);
    const v = vistaPara(foco);
    if (v) setVista(v);
  }

  // Si la quitaron del asunto, se ve como en los grupos.
  const abierta = vista.k === "ficha" ? a.personas.find((p) => p.id === vista.id) ?? null : null;
  useEffect(() => { alAbrirPersona(abierta); }, [abierta, alAbrirPersona]);
  useEffect(() => () => alAbrirPersona(null), [alAbrirPersona]);

  const volver = useCallback(() => setVista({ k: "grupos" }), []);
  useRegresoDeVentana(vista.k === "nueva" || abierta !== null, volver, "Personas");

  if (vista.k === "nueva") {
    return <AltaPersona key={vista.papel} a={a} papel={vista.papel} hacer={hacer} alCancelar={volver} alAgregar={(id) => setVista(id ? { k: "ficha", id } : { k: "grupos" })} />;
  }
  if (abierta) {
    return (
      <div className="pp-dos">
        <ListaPersonas a={a} abierta={abierta.id} alAbrir={(id) => setVista({ k: "ficha", id })} alAgregar={() => setVista({ k: "nueva", papel: abierta.papel })} />
        <FichaEnAsunto key={abierta.persona_id} a={a} p={abierta} hacer={hacer} cuantas={(notas ?? []).filter((n) => mencionaA(n, abierta)).length} alVerNotas={alVerNotas} />
      </div>
    );
  }
  return <Grupos a={a} notas={notas} alAbrir={(id) => setVista({ k: "ficha", id })} alAgregar={(papel) => setVista({ k: "nueva", papel })} />;
}

// ── Al abrir: por grupos ─────────────────────────────────────────────────────────────────────────────
function Grupos({ a, notas, alAbrir, alAgregar }: { a: Asunto; notas: EntradaHistorial[] | null; alAbrir: (id: string) => void; alAgregar: (papel: Papel) => void }) {
  return (
    <div className="pp-grupos">
      {GRUPOS.map((g) => {
        const miembros = a.personas.filter((p) => g.papeles.includes(p.papel));
        return (
          <section key={g.clave} className="pp-grupo" aria-labelledby={`pp-${g.clave}`}>
            <div className="pp-grupo-h">
              <Icono nombre={g.icono} tamano={16} />
              <h3 id={`pp-${g.clave}`}>{g.titulo}</h3>
              {miembros.length ? <span className="as-m as-num">{miembros.length}</span> : null}
              <span className="as-sp" />
              <button type="button" className="as-btn as-gho" onClick={() => alAgregar(PAPEL_DEL_GRUPO[g.clave])} aria-label={`Agregar a ${g.titulo.toLowerCase()}`}>
                <Icono nombre="mas" tamano={16} />Agregar
              </button>
            </div>
            {miembros.length ? (
              <div className="pp-tarjetas">
                {miembros.map((p) => {
                  const n = (notas ?? []).filter((x) => mencionaA(x, p)).length;
                  return (
                    <button key={p.id} type="button" className="pp-tarjeta" onClick={() => alAbrir(p.id)} aria-label={`Abrir la ficha de ${p.nombre}`}>
                      <Avatar p={p} />
                      <span className="pp-tarjeta-c">
                        <b>{p.nombre}</b>
                        <span>{NOMBRE_PAPEL[p.papel]} · {p.fallecida ? "Falleció" : p.no_contactar ? "No contactar" : p.telefono ?? "Sin teléfono"}</span>
                        {p.nota ? <span className="pp-lazo"><Icono nombre="liga" tamano={13} />{p.nota}</span> : null}
                      </span>
                      {n ? <span className="pp-cuenta" title={`${n} ${n === 1 ? "nota la menciona" : "notas la mencionan"}`}><Icono nombre="nota" tamano={13} />{n}</span> : null}
                    </button>
                  );
                })}
              </div>
            ) : <p className="pp-hueco">Nadie todavía.</p>}
          </section>
        );
      })}
    </div>
  );
}

// ── La ficha ─────────────────────────────────────────────────────────────────────────────────────────
function ListaPersonas({ a, abierta, alAbrir, alAgregar }: { a: Asunto; abierta: string; alAbrir: (id: string) => void; alAgregar: () => void }) {
  const [q, setQ] = useState("");
  const plano = (t: string) => t.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  const lista = a.personas.filter((p) => !q.trim() || plano(p.nombre).includes(plano(q.trim())) || digitos(p).includes(q.replace(/\D/g, "") || "-"));
  return (
    <aside className="pp-lista" aria-label="Personas del asunto">
      {a.personas.length > 5 ? (
        <label className="pp-busca">
          <Icono nombre="bus" tamano={16} />
          <span className="pn-solo-lector">Buscar persona</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar" autoComplete="off" />
        </label>
      ) : null}
      <div className="pp-lista-c">
        {lista.map((p) => (
          <button key={p.id} type="button" className="pp-item" aria-current={p.id === abierta || undefined} onClick={() => alAbrir(p.id)}>
            <Avatar p={p} />
            <span className="pp-item-c"><b>{p.nombre}</b><span>{NOMBRE_PAPEL[p.papel]}</span></span>
          </button>
        ))}
      </div>
      <button type="button" className="as-btn as-gho pp-lista-mas" onClick={alAgregar}><Icono nombre="mas" tamano={16} />Agregar persona</button>
    </aside>
  );
}

type Edicion = {
  etiqueta: string; valor: string; opciones?: readonly string[]; tipo?: "text" | "tel" | "email"; max?: number; mayusculas?: boolean; cuentaDe?: number; ayuda?: string;
  guardar: (v: string) => CambioFicha | null;
};

function FichaEnAsunto({ a, p, hacer, cuantas, alVerNotas }: { a: Asunto; p: PersonaDelAsunto; hacer: Hacer; cuantas: number; alVerNotas: () => void }) {
  const { avisar } = useAvisos();
  const [ficha, setFicha] = useState<FichaPersona | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pestana, setPestana] = useState<"datos" | "docs" | "otros">("datos");
  const [edicion, setEdicion] = useState<Edicion | null>(null);
  const [relacion, setRelacion] = useState(false);

  useEffect(() => {
    let vivo = true;
    leerFicha(p.persona_id).then((f) => { if (vivo) setFicha(f); }, (e: unknown) => { if (vivo) setError(e instanceof Error ? e.message : "No se pudo abrir la ficha."); });
    return () => { vivo = false; };
  }, [p.persona_id]);

  const guardar = (cambio: CambioFicha | null, aviso = "Guardado") => {
    if (!cambio) return;
    void hacer(async () => {
      try { setFicha(await cambiarFicha(p.persona_id, cambio)); }
      catch (e) {
        // Con un choque (409) o un dato no válido, la ficha se vuelve a leer para no seguir sobre una versión vieja.
        void leerFicha(p.persona_id).then(setFicha, () => undefined);
        throw e;
      }
    }, aviso);
  };
  const dato = (k: CampoDato, v: string): CambioFicha | null => {
    if (!ficha) return null;
    const datos: NonNullable<CambioFicha["datos"]> = { version: ficha.datos.version };
    datos[k] = v || null;
    return { datos };
  };
  const persona = (c: Omit<NonNullable<CambioFicha["persona"]>, "version">): CambioFicha | null => (ficha ? { persona: { version: ficha.version, ...c } } : null);

  const moral = p.clase !== "persona";
  const tel = ficha?.telefonos[0];
  const telTexto = tel ? `${tel.pais} ${tel.numero}` : "";
  const docs = a.documentos.filter((d) => d.entrega_persona_id === p.persona_id);
  const otros = (ficha?.asuntos ?? []).filter((x) => x.id !== a.id);
  const contacto = puedeContactar(p);

  const fila = (etiqueta: string, valor: string | null | undefined, e: Omit<Edicion, "etiqueta" | "valor">, extra?: { secreto?: boolean }) => (
    <FilaDato etiqueta={etiqueta} valor={valor} vacio="—" sinAgregar secreto={extra?.secreto} copiar={extra?.secreto}
      alCopiar={(t) => copiarTexto(t, avisar, `${etiqueta} copiado`)}
      alEditar={ficha ? () => setEdicion({ etiqueta, valor: valor ?? "", ...e }) : undefined} />
  );

  return (
    <article className="pp-ficha" aria-label={`Ficha de ${p.nombre}`}>
      <header className="pp-ficha-h">
        <Avatar p={p} grande />
        <div className="pp-ficha-n">
          <h3>{p.nombre}</h3>
          <button type="button" className="pp-lazo pp-lazo-boton" onClick={() => setRelacion(true)}>
            <Icono nombre="liga" tamano={13} />{p.nota || "Agregar su relación con los demás"}
          </button>
        </div>
        <div className="pp-ficha-acc">
          <Pildora etiqueta="Papel en el asunto" valor={p.papel} opciones={PAPELES.map((v) => ({ valor: v, etiqueta: NOMBRE_PAPEL[v] }))}
            alElegir={(v) => { if (v !== p.papel) void hacer(() => cambiar(a.id, "personas", { id: p.id, version: p.version, papel: v }), `${p.nombre}: ${NOMBRE_PAPEL[v].toLowerCase()}`); }} />
          {contacto ? (
            <>
              <a className="as-btn as-gho as-ico" href={`tel:+${digitos(p)}`} aria-label={`Llamar a ${p.nombre}`} title="Llamar"><Icono nombre="tel" tamano={18} /></a>
              <a className="as-btn as-gho as-ico" href={`https://wa.me/${digitos(p)}`} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp a ${p.nombre}`} title="WhatsApp"><Icono nombre="chat" tamano={18} /></a>
            </>
          ) : null}
          <DropdownMenu>
            <DropdownMenuTrigger className="as-btn as-gho as-ico" aria-label={`Más de ${p.nombre}`}><Icono nombre="dots" tamano={18} /></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setRelacion(true)}><Icono nombre="liga" tamano={16} />Su relación con los demás</DropdownMenuItem>
              {ficha ? (
                <DropdownMenuItem onSelect={() => guardar(persona({ fallecida: !ficha.fallecida }), ficha.fallecida ? "Ya no se marca como fallecida" : "Marcada como fallecida")}>
                  <Icono nombre="alerta" tamano={16} />{ficha.fallecida ? "No falleció" : "Falleció"}
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem peligro onSelect={() => void hacer(() => cambiar(a.id, "personas", { id: p.id, version: p.version, quitar: true }), `Se quitó a ${p.nombre}`)}>
                <Icono nombre="bote" tamano={16} />Quitar del asunto
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <Pestanas etiqueta="Qué ver de la persona" valor={pestana} alElegir={setPestana}
        opciones={[{ valor: "datos", etiqueta: "Datos" }, { valor: "docs", etiqueta: `Documentos${docs.length ? ` (${docs.length})` : ""}` }, { valor: "otros", etiqueta: "Otros asuntos" }]} />

      {error ? <p className="as-ban" role="alert"><Icono nombre="alerta" tamano={16} />{error}</p> : !ficha ? <div className="as-cargando" aria-busy="true"><span /><span /></div> : pestana === "datos" ? (
        <div className="pp-hoja">
          {ficha.fallecida ? <p className="as-ban as-ban-esp"><Icono nombre="alerta" tamano={16} />Falleció. Se conserva para los documentos, sin botones de contacto.</p> : null}
          {p.no_contactar && !ficha.fallecida ? <p className="as-ban as-ban-esp"><Icono nombre="alerta" tamano={16} />Pidió no ser contactada.</p> : null}
          <GrupoDatos titulo={moral ? "Datos de la empresa" : "Datos personales"}>
            {fila(moral ? "Nombre" : "Nombre con que se le conoce", ficha.nombre, { max: 160, guardar: (v) => (v.trim() ? persona({ nombre: v }) : null) })}
            {fila(moral ? "Razón social completa" : "Nombre completo", ficha.datos.nombre_completo, { max: 200, ayuda: "Como viene en su identificación.", guardar: (v) => dato("nombre_completo", v) })}
            {fila("Nacionalidad", ficha.datos.nacionalidad, { max: 60, guardar: (v) => dato("nacionalidad", v) })}
            {moral ? null : fila("Ocupación", ficha.datos.ocupacion, { max: 120, guardar: (v) => dato("ocupacion", v) })}
            {moral ? null : fila("Estado civil", ficha.datos.estado_civil, { opciones: ESTADOS_CIVILES, guardar: (v) => dato("estado_civil", v) })}
          </GrupoDatos>
          {ficha.fallecida ? null : (
            <GrupoDatos titulo="Contacto">
              {fila("Teléfono", telTexto, {
                tipo: "tel", max: 36, ayuda: "Con su clave si es de otro país: +1 619 555 0142.",
                guardar: (v) => { const m = /^\s*(\+\d{1,4})\s+(.+)$/.exec(v); return persona({ telefono: v.trim() ? { pais: m?.[1] ?? "+52", numero: m?.[2] ?? v } : null }); },
              })}
              {fila("Correo", ficha.correo, { tipo: "email", max: 200, guardar: (v) => persona({ correo: v || null }) })}
            </GrupoDatos>
          )}
          <GrupoDatos titulo="Identificación y datos fiscales">
            {moral ? null : fila("Identificación", ficha.datos.identificacion_tipo, { max: 60, ayuda: "INE, pasaporte…", guardar: (v) => dato("identificacion_tipo", v) })}
            {moral ? null : fila("Número", ficha.datos.identificacion_numero, { max: 60, guardar: (v) => dato("identificacion_numero", v) })}
            {moral ? null : fila("CURP", ficha.datos.curp, { mayusculas: true, cuentaDe: 18, max: 18, guardar: (v) => dato("curp", v) }, { secreto: true })}
            {fila("RFC", ficha.datos.rfc, { mayusculas: true, cuentaDe: moral ? 12 : 13, max: 13, guardar: (v) => dato("rfc", v) }, { secreto: true })}
          </GrupoDatos>
          <GrupoDatos titulo="Domicilio">
            {fila("Domicilio", ficha.datos.domicilio, { max: 1500, ayuda: "Calle y número, colonia, código postal, ciudad y estado.", guardar: (v) => dato("domicilio", v) })}
          </GrupoDatos>
          <div className="pp-menciona">
            <Icono nombre="nota" tamano={16} />
            <span>{cuantas ? `${cuantas} ${cuantas === 1 ? "nota la menciona" : "notas la mencionan"}` : "Ninguna nota la menciona"}</span>
            <span className="as-sp" />
            <button type="button" className="as-btn as-gho" onClick={alVerNotas}>Ver en notas</button>
          </div>
        </div>
      ) : pestana === "docs" ? (
        <div className="as-card">
          {docs.length ? docs.map((d) => (
            <div key={d.id} className="as-ren">
              <Icono nombre="file" tamano={16} />
              <span className="as-ren-c"><b>{d.nombre}</b>{d.grupo ? <span>{d.grupo}</span> : null}</span>
              <span className={ESTADO_DOC[d.estado]?.clase ?? "as-pill"}>{ESTADO_DOC[d.estado]?.texto ?? d.estado}</span>
            </div>
          )) : <p className="as-m as-pad">Nada que entregue esta persona todavía. Se pide desde Documentos.</p>}
        </div>
      ) : (
        <div className="as-card">
          {otros.length ? otros.map((x) => (
            <Link key={x.id} href={`/panel/asuntos/${x.id}`} className="as-ren">
              <Icono nombre="asu" tamano={16} />
              <span className="as-ren-c"><b>{x.nombre}</b><span>{x.folio} · {x.papeles.map((v) => NOMBRE_PAPEL[v as Papel] ?? v).join(", ")}{x.cerrado ? " · cerrado" : ""}</span></span>
              <Icono nombre="ch" tamano={16} />
            </Link>
          )) : <p className="as-m as-pad">Solo aparece en este asunto.</p>}
        </div>
      )}

      <EditarDato abierto={Boolean(edicion)} etiqueta={edicion?.etiqueta ?? ""} valor={edicion?.valor ?? ""} opciones={edicion?.opciones}
        tipo={edicion?.tipo} max={edicion?.max} mayusculas={edicion?.mayusculas} cuentaDe={edicion?.cuentaDe} ayuda={edicion?.ayuda}
        alCerrar={() => setEdicion(null)}
        alGuardar={(v) => { const e = edicion; setEdicion(null); if (e && v !== e.valor) guardar(e.guardar(v)); }} />
      <EditarDato abierto={relacion} etiqueta="Su relación con los demás" valor={p.nota} max={500}
        ayuda="Por ejemplo: hija de Rosa, recibe el poder." alCerrar={() => setRelacion(false)}
        alGuardar={(v) => { setRelacion(false); if (v !== p.nota) void hacer(() => cambiar(a.id, "personas", { id: p.id, version: p.version, nota: v }), "Guardado"); }} />
    </article>
  );
}

// ── Agregar ──────────────────────────────────────────────────────────────────────────────────────────
function AltaPersona({ a, papel: inicial, hacer, alCancelar, alAgregar }: {
  a: Asunto; papel: Papel; hacer: Hacer; alCancelar: () => void; alAgregar: (id: string | null) => void;
}) {
  const id = useId();
  const ref = useFoco<HTMLInputElement>(true);
  const [nombre, setNombre] = useState("");
  const [papel, setPapel] = useState<Papel>(inicial);
  const [clase, setClase] = useState<ClasePersona>(inicial === "notaria" || inicial === "banco" ? "institucion" : "persona");
  const [pais, setPais] = useState("+52");
  const [numero, setNumero] = useState("");
  const [relacion, setRelacion] = useState("");
  const [fallecida, setFallecida] = useState(false);
  const [duplicada, setDuplicada] = useState<PersonaDuplicada | null>(null);
  const grupo = useMemo(() => GRUPOS.find((g) => g.papeles.includes(papel)), [papel]);

  async function guardar(usar?: "misma" | "otra") {
    const t = nombre.trim();
    if (!t) { ref.current?.focus(); return; }
    const nota = relacion.trim() ? { nota: relacion.trim() } : {};
    const cuerpo = usar === "misma" && duplicada
      ? { papel, persona_id: duplicada.id, ...nota }
      : { papel, aunque_exista: usar === "otra", ...nota, nueva: { nombre: t, clase, fallecida, ...(numero.trim() && !fallecida ? { telefono: { pais, numero } } : {}) } };
    let r: ResultadoPersona = {};
    let ok = false;
    await hacer(async () => { r = await agregar<ResultadoPersona>(a.id, "personas", cuerpo); ok = true; }, undefined);
    if (!ok) return;
    if (r.duplicada) { setDuplicada(r.duplicada); return; }
    alAgregar(r.id ?? null);
  }

  return (
    <form className="as-card as-pad as-form" onSubmit={(e) => { e.preventDefault(); void guardar(); }}>
      <p className="as-sub">{grupo ? <Icono nombre={grupo.icono} tamano={15} /> : null}Agregar a {grupo?.titulo.toLowerCase() ?? "Personas"}</p>
      <p className="as-m">Basta con el nombre y su papel; lo demás, cuando lo tengas.</p>
      <div className="as-g2">
        <label className="pn-campo" htmlFor={`${id}-n`}>Nombre
          <input ref={ref} id={`${id}-n`} className="as-inp as-inp-borde" value={nombre} maxLength={160} onChange={(e) => { setNombre(e.target.value); setDuplicada(null); }} />
        </label>
        <Desplegable etiqueta="Papel" valor={papel} opciones={PAPELES.map((v) => ({ valor: v, etiqueta: NOMBRE_PAPEL[v] }))} alElegir={(v) => { if (v) setPapel(v); }} />
        <Desplegable etiqueta="Es" valor={clase} opciones={CLASES_PERSONA.map((v) => ({ valor: v, etiqueta: NOMBRE_CLASE[v] }))} alElegir={(v) => { if (v) setClase(v); }} />
        {!fallecida ? (
          <div className="pn-campo">
            <label htmlFor={`${id}-t`}>Teléfono</label>
            <span className="as-tel">
              <input aria-label="Clave del país" className="as-inp as-inp-borde as-clave" value={pais} maxLength={5} onChange={(e) => setPais(e.target.value)} />
              <input id={`${id}-t`} className="as-inp as-inp-borde" inputMode="tel" value={numero} maxLength={30} onChange={(e) => { setNumero(e.target.value); setDuplicada(null); }} />
            </span>
          </div>
        ) : null}
      </div>
      <label className="pn-campo" htmlFor={`${id}-r`}>Su relación con los demás (opcional)
        <input id={`${id}-r`} className="as-inp as-inp-borde" value={relacion} maxLength={500} onChange={(e) => setRelacion(e.target.value)} placeholder="Hija de Rosa, recibe el poder" />
      </label>
      {clase === "persona" ? (
        <label className="as-fila as-switch">
          <Switch checked={fallecida} onCheckedChange={setFallecida} aria-label="Falleció" />
          <span>Falleció</span>
        </label>
      ) : null}
      {duplicada ? (
        <div className="as-ban" role="status">
          <Icono nombre="users" tamano={16} />
          <span>Ya existe <b>{duplicada.nombre}</b> con ese teléfono o correo.</span>
          <span className="as-sp" />
          <button type="button" className="as-btn" onClick={() => void guardar("otra")}>Crear otra</button>
          <button type="button" className="as-btn as-pri" onClick={() => void guardar("misma")}>Usar esa ficha</button>
        </div>
      ) : (
        <div className="as-fila as-fin">
          <button type="button" className="as-btn" onClick={alCancelar}>Cancelar</button>
          <button type="submit" className="as-btn as-pri" aria-disabled={!nombre.trim()}><Icono nombre="mas" tamano={16} />Agregar al asunto</button>
        </div>
      )}
    </form>
  );
}
