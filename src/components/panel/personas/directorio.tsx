"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { useCatalogos } from "@/components/panel/datos/catalogos";
import { EditarDato, copiarTexto } from "@/components/panel/fichas/piezas";
import { Icono } from "@/components/panel/icons";
import { useAvisos } from "@/components/panel/kit/avisos";
import { DesplegableFecha } from "@/components/panel/kit/desplegable";
import { BotonesDeVista } from "@/components/panel/kit/segmentado";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/panel/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/panel/ui/dropdown-menu";
import {
  cambiarFicha, fechaCorta, iconoEncargo, iniciales, leerFicha, sumarDias,
  type CambioFicha, type CampoDato, type FichaPersona,
} from "@/lib/panel/asuntos/api";
import { cambiarPersonaDirectorio, leerDirectorio, unirFichas, type PersonaDirectorio } from "@/lib/panel/biblioteca";
import { empezarConsulta } from "@/lib/panel/consulta/api";
import { useSession } from "@/lib/panel/legado/sesion";

import "../asunto/asunto.css";
import "../asunto/caso.css";
import { Cuadro, Pildora } from "../asunto/pildora";
import "../fichas/modelo.css";
import "./directorio.css";

/**
 * Directorio como el modelo visual («Personas»): la lista en su columna, por letras, con avatar, nombre y su papel en su
 * asunto; la ficha de la persona a la derecha con sus datos en tarjetas. Cada persona una sola vez, con todos sus
 * asuntos. Quien no tiene asunto es un contacto con su «llamarle». En el teléfono, una a la vez.
 */
type Filtro = "" | "con" | "sin" | "llamar";
const FILTROS: { valor: Exclude<Filtro, "">; etiqueta: string }[] = [
  { valor: "con", etiqueta: "Con asunto" }, { valor: "sin", etiqueta: "Contactos sin asunto" }, { valor: "llamar", etiqueta: "Por llamar" },
];
const hoy = () => sumarDias(0);
const sinAcentos = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const digitos = (p: Pick<PersonaDirectorio, "telefonos">) => p.telefonos.map((t) => `${t.pais}${t.numero}`.replace(/\D/g, ""));
const telefono = (p: Pick<PersonaDirectorio, "telefonos">) => (p.telefonos[0] ? `${p.telefonos[0].pais} ${p.telefonos[0].numero}` : "");
const porLlamar = (p: PersonaDirectorio) => !!p.volver_a_llamar && p.volver_a_llamar <= hoy() && !p.no_contactar && !p.fallecida;

function pasa(p: PersonaDirectorio, f: Filtro) {
  if (f === "con") return p.asuntos.length > 0;
  if (f === "sin") return p.asuntos.length === 0;
  if (f === "llamar") return porLlamar(p);
  return true;
}
function coincide(p: PersonaDirectorio, q: string) {
  if (!q) return true;
  const n = q.replace(/\D/g, "");
  if (n.length >= 3 && digitos(p).some((d) => d.includes(n))) return true;
  const t = sinAcentos(q);
  return sinAcentos(`${p.nombre} ${p.correo ?? ""} ${p.nota}`).includes(t) || p.asuntos.some((a) => sinAcentos(`${a.nombre} ${a.folio}`).includes(t));
}

/** Las letras del modelo: «A – C», «D – F»…, para no partir la lista en una letra por renglón. */
const TRAMOS = ["ABC", "DEF", "GHI", "JKL", "MNÑOP", "QRS", "TUV", "WXYZ"];
function tramo(nombre: string) {
  const l = sinAcentos(nombre.trim()).charAt(0).toUpperCase();
  const t = TRAMOS.find((x) => x.includes(l));
  return t ? `${t[0]} – ${t[t.length - 1]}` : "#";
}

/** ↑ y ↓ pasan de una persona a otra (como Asuntos e Inmuebles). */
function moverConFlechas(e: React.KeyboardEvent<HTMLElement>) {
  if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key) || e.altKey || e.ctrlKey || e.metaKey) return;
  const filas = Array.from(e.currentTarget.querySelectorAll<HTMLElement>("[data-renglon]"));
  if (!filas.length) return;
  e.preventDefault();
  const i = filas.indexOf(document.activeElement as HTMLElement);
  const j = e.key === "Home" ? 0 : e.key === "End" ? filas.length - 1 : Math.min(filas.length - 1, Math.max(0, i + (e.key === "ArrowDown" ? 1 : -1)));
  filas[j]?.focus();
  filas[j]?.scrollIntoView({ block: "nearest" });
}

export function Directorio() {
  const { avisar } = useAvisos();
  const cat = useCatalogos();
  const papel = (x: string) => cat.etiqueta("papel", x);
  const router = useRouter();
  const params = useSearchParams();
  const abierta = params.get("id");
  const director = useSession()?.role === "admin";
  const [todas, setTodas] = useState<PersonaDirectorio[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Desde el buscador llega con ?q=<nombre>: el Directorio abre ya filtrado.
  const [q, setQ] = useState(() => params.get("q") ?? "");
  const [filtro, setFiltro] = useState<Filtro>("");
  const [llamar, setLlamar] = useState<PersonaDirectorio | null>(null);
  const [unir, setUnir] = useState<PersonaDirectorio | null>(null);

  const cargar = useCallback(() => leerDirectorio().then((x) => { setTodas(x); setError(null); }, (e: unknown) => setError(e instanceof Error ? e.message : "No se pudo cargar.")), []);
  useEffect(() => { leerDirectorio().then((x) => { setTodas(x); setError(null); }, (e: unknown) => setError(e instanceof Error ? e.message : "No se pudo cargar.")); }, []);
  const [qPrevia, setQPrevia] = useState(params.get("q"));
  if (params.get("q") !== qPrevia) { setQPrevia(params.get("q")); if (params.get("q")) setQ(params.get("q") ?? ""); }

  const ver = useMemo(() => (todas ?? []).filter((p) => pasa(p, filtro) && coincide(p, q.trim())), [todas, filtro, q]);
  const actual = todas?.find((p) => p.id === abierta) ?? null;
  const abrir = (id: string | null) => router.replace(id ? `/panel/directorio?id=${id}` : "/panel/directorio", { scroll: false });

  const hacer = async (accion: () => Promise<unknown>, aviso: string) => {
    try { await accion(); avisar(aviso); }
    catch (e) { avisar(e instanceof Error ? e.message : "No se pudo terminar."); }
    await cargar();
  };
  const nuevoAsunto = async (p: Pick<PersonaDirectorio, "id">) => {
    try {
      const c = await empezarConsulta({ persona_id: p.id });
      router.push(`/panel/consulta?id=${c.id}`);
    } catch (e) { avisar(e instanceof Error ? e.message : "No se pudo empezar la consulta."); }
  };
  const nuevaPersona = async () => {
    try {
      const c = await empezarConsulta({});
      router.push(`/panel/consulta?id=${c.id}`);
    } catch (e) { avisar(e instanceof Error ? e.message : "No se pudo empezar la consulta."); }
  };
  const opcionesFiltro = [
    { valor: "" as Filtro, etiqueta: `Todas${todas ? ` · ${todas.length}` : ""}` },
    ...FILTROS.map((f) => ({ valor: f.valor as Filtro, etiqueta: `${f.etiqueta}${todas ? ` · ${todas.filter((p) => pasa(p, f.valor)).length}` : ""}` })),
  ];

  // Renglones con su encabezado de letras.
  const renglones: ReactNode[] = [];
  let tramoActual = "";
  for (const p of ver) {
    const t = tramo(p.nombre);
    if (t !== tramoActual) { tramoActual = t; renglones.push(<div key={`t-${t}`} className="pe-tramo" role="presentation">{t}</div>); }
    const primero = p.asuntos[0];
    const linea = p.fallecida ? "Falleció"
      : primero ? `${primero.papeles.map(papel).join(", ")} · ${primero.nombre}${p.asuntos.length > 1 ? ` y ${p.asuntos.length - 1} más` : ""}`
        : `Sin asunto${p.volver_a_llamar ? ` · llamarle ${fechaCorta(p.volver_a_llamar).toLowerCase()}` : ""}`;
    renglones.push(
      <Link key={p.id} href={`/panel/directorio?id=${p.id}`} replace scroll={false} className="as-it pe-it" data-renglon=""
        aria-current={p.id === abierta ? "page" : undefined} title={[telefono(p), p.nota].filter(Boolean).join(" · ") || undefined}>
        <span className="fm-av" aria-hidden>{p.clase === "persona" ? iniciales(p.nombre) : <Icono nombre="edif" tamano={14} />}</span>
        <span className="as-it-c">
          <b>{p.nombre}</b>
          <small data-falta={!primero && porLlamar(p) ? "" : undefined}>{linea}{p.no_contactar ? " · no contactar" : ""}</small>
        </span>
      </Link>,
    );
  }

  return (
    <div className="as-dos pe-dos" data-det={Boolean(abierta)}>
      <section className="as-lista" aria-label="Lista de personas">
        <div className="as-lado">
          <div className="as-fila as-cab">
            <h1 className="as-h1-lista">Directorio</h1>
            {todas ? <span className="as-cab-n" aria-label={`${ver.length} personas`}>{ver.length}</span> : null}
            <span className="as-sp" />
            <button type="button" className="as-btn as-gho as-ico as-cab-mas" aria-label="Nueva persona: empieza una consulta" title="Nueva persona" onClick={() => void nuevaPersona()}>
              <Icono nombre="mas" tamano={16} />
            </button>
          </div>
          <label className="as-buscar">
            <Icono nombre="bus" tamano={15} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nombre o teléfono" aria-label="Buscar por nombre o teléfono" type="search" />
          </label>
          <div className="as-fila as-filtros">
            <Pildora etiqueta="Qué ver" valor={filtro} opciones={opcionesFiltro} alElegir={setFiltro} />
          </div>

          {error && !todas ? (
            <div className="as-vacio-lista" role="alert">
              <p>{error}</p>
              <button type="button" className="as-btn" onClick={() => void cargar()}>Reintentar</button>
            </div>
          ) : !todas ? (
            <div className="as-cargando" aria-busy="true" aria-label="Cargando personas">{[0, 1, 2, 3].map((k) => <span key={k} />)}</div>
          ) : !todas.length ? (
            <div className="as-vacio-lista">
              <Icono nombre="users" tamano={26} />
              <b>Todavía no hay nadie</b>
              <p>Las personas llegan de cada consulta y de cada asunto.</p>
            </div>
          ) : !ver.length ? (
            <p className="as-m as-nada">Nadie coincide.</p>
          ) : (
            <nav aria-label="Personas" className="as-items" onKeyDown={moverConFlechas}>{renglones}</nav>
          )}
        </div>
      </section>
      <section className="as-det" aria-label={actual ? `Ficha de ${actual.nombre}` : "Persona"}>
        {abierta && actual ? (
          <FichaDirectorio key={abierta} p={actual} director={director} hacer={hacer} alCambio={() => void cargar()}
            alVolver={() => abrir(null)} alNuevoAsunto={() => void nuevoAsunto(actual)} alLlamar={() => setLlamar(actual)} alUnir={() => setUnir(actual)} />
        ) : abierta && !todas ? (
          <div className="as-cargando" aria-busy="true"><span /><span /></div>
        ) : (
          <div className="as-in as-elige">
            <Icono nombre="users" tamano={28} />
            <p className="as-m">{abierta ? "Esta persona ya no está en el Directorio." : "Elige una persona de la lista."}</p>
          </div>
        )}
      </section>

      <DialogoLlamar p={llamar} alCerrar={() => setLlamar(null)} alGuardar={(p, fecha) => void hacer(() => cambiarPersonaDirectorio(p, { volver_a_llamar: fecha }),
        fecha ? `Te lo recuerdo ${fechaCorta(fecha).toLowerCase()}` : "Sin recordatorio")} />
      <DialogoUnir p={unir} todas={todas ?? []} alCerrar={() => setUnir(null)} alUnir={(origen, destino) => void hacer(async () => {
        await unirFichas(origen.id, destino.id);
        abrir(destino.id);
      }, `Fichas unidas: queda ${destino.nombre}`)} />
    </div>
  );
}

// ── La ficha ─────────────────────────────────────────────────────────────────────────────────────────
const ESTADOS_CIVILES = ["Soltero(a)", "Casado(a)", "Unión libre", "Divorciado(a)", "Viudo(a)"] as const;
type Edicion = {
  etiqueta: string; valor: string; opciones?: readonly string[]; tipo?: "text" | "tel" | "email"; max?: number; mayusculas?: boolean; cuentaDe?: number; ayuda?: string;
  guardar: (v: string) => Promise<unknown> | null;
};
type Vista = "datos" | "asuntos" | "seguimiento";

function FichaDirectorio({ p, director, hacer, alCambio, alVolver, alNuevoAsunto, alLlamar, alUnir }: {
  p: PersonaDirectorio; director: boolean; hacer: (accion: () => Promise<unknown>, aviso: string) => Promise<void>; alCambio: () => void;
  alVolver: () => void; alNuevoAsunto: () => void; alLlamar: () => void; alUnir: () => void;
}) {
  const { avisar } = useAvisos();
  const cat = useCatalogos();
  const [ficha, setFicha] = useState<FichaPersona | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [vista, setVista] = useState<Vista>("datos");
  const [edicion, setEdicion] = useState<Edicion | null>(null);
  const [visibles, setVisibles] = useState<Set<string>>(new Set());

  useEffect(() => {
    let vivo = true;
    leerFicha(p.id).then((f) => { if (vivo) setFicha(f); }, (e: unknown) => { if (vivo) setError(e instanceof Error ? e.message : "No se pudo abrir la ficha."); });
    return () => { vivo = false; };
  }, [p.id]);

  const cambiar = async (cambio: CambioFicha) => {
    try { setFicha(await cambiarFicha(p.id, cambio)); }
    catch (e) {
      // Con un choque (409) o un dato no válido, la ficha se vuelve a leer para no seguir sobre una versión vieja.
      void leerFicha(p.id).then(setFicha, () => undefined);
      throw e;
    }
  };
  const dato = (k: CampoDato, v: string) => {
    if (!ficha) return null;
    const datos: NonNullable<CambioFicha["datos"]> = { version: ficha.datos.version };
    datos[k] = v || null;
    return cambiar({ datos });
  };
  const persona = (c: Omit<NonNullable<CambioFicha["persona"]>, "version">) => (ficha ? cambiar({ persona: { version: ficha.version, ...c } }) : null);

  const moral = p.clase !== "persona";
  const tel = telefono(p);
  const d = digitos(p)[0] ?? "";
  const puedeHablar = !!d && !p.fallecida && !p.no_contactar;
  const primero = p.asuntos[0];
  const relacion = [
    primero ? `${primero.papeles.map((x) => cat.etiqueta("papel", x)).join(", ")} en ${primero.nombre}` : "Contacto sin asunto",
    p.es_ejemplo ? "Ejemplo" : null,
  ].filter(Boolean).join(" · ");

  /** Un renglón del modelo: nombre y valor; vacío dice «Agregar». Se toca para cambiarlo. */
  const fila = (etiqueta: string, valor: string | null | undefined, e: Omit<Edicion, "etiqueta" | "valor">, secreto?: boolean) => {
    const v = valor?.trim() ?? "";
    const ver = !secreto || visibles.has(etiqueta);
    return (
      <div className="fm-dato" key={etiqueta}>
        <button type="button" className="fm-dato-b" disabled={!ficha} onClick={() => setEdicion({ etiqueta, valor: v, ...e })}
          aria-label={`${etiqueta}: ${v ? (ver ? v : "oculto") : "sin dato"}. Cambiar`}>
          <span className="fm-k">{etiqueta}</span>
          <span className="fm-v" data-vacio={!v || undefined}>{!v ? "Agregar" : ver ? v : `${v.slice(0, 4)} •••• ${v.slice(-2)}`}</span>
        </button>
        {secreto && v ? (
          <button type="button" className="as-btn as-gho pe-mini" onClick={() => setVisibles((s) => { const n = new Set(s); if (n.has(etiqueta)) n.delete(etiqueta); else n.add(etiqueta); return n; })}>
            {ver ? "Ocultar" : "Mostrar"}
          </button>
        ) : null}
        {secreto && v ? (
          <button type="button" className="as-btn as-gho as-ico pe-mini" aria-label={`Copiar ${etiqueta}`} title={`Copiar ${etiqueta}`} onClick={() => copiarTexto(v, avisar, `${etiqueta} copiado`)}>
            <Icono nombre="copia" tamano={15} />
          </button>
        ) : null}
      </div>
    );
  };
  const grupo = (titulo: string, hijos: ReactNode, pie?: ReactNode) => (
    <section className="fm-grupo">
      <div className="fm-t"><span>{titulo}</span></div>
      <div className="fm-card">{hijos}</div>
      {pie ? <p className="as-m fm-pie">{pie}</p> : null}
    </section>
  );

  return (
    <div className="cp fm-col pe-col">
      <div className="cp-barra">
        <button type="button" className="as-btn as-gho as-atras" onClick={alVolver}><Icono nombre="at" tamano={16} />Directorio</button>
        <BotonesDeVista etiqueta="Qué ver de la persona" valor={vista} alElegir={setVista}
          opciones={[
            { valor: "datos", etiqueta: "Datos", icono: "users" },
            { valor: "asuntos", etiqueta: "Asuntos", icono: "asu", cuenta: p.asuntos.length || undefined },
            { valor: "seguimiento", etiqueta: "Notas", icono: "nota" },
          ]} />
        <span className="as-sp" />
        {puedeHablar ? (
          <>
            <a className="pn-btn as-ocultar-tel" href={`tel:+${d}`}><Icono nombre="tel" tamano={15} />Llamar</a>
            <a className="pn-btn as-ocultar-tel" href={`https://wa.me/${d}`} target="_blank" rel="noopener noreferrer"><Icono nombre="chat" tamano={15} />WhatsApp</a>
            <a className="as-btn as-gho as-ico pe-solo-tel" href={`tel:+${d}`} aria-label={`Llamar a ${p.nombre}`}><Icono nombre="tel" tamano={18} /></a>
            <a className="as-btn as-gho as-ico pe-solo-tel" href={`https://wa.me/${d}`} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp a ${p.nombre}`}><Icono nombre="chat" tamano={18} /></a>
          </>
        ) : null}
        <button type="button" className="pn-btn as-ocultar-tel" onClick={alNuevoAsunto}><Icono nombre="mas" tamano={15} />Nuevo asunto</button>
        <DropdownMenu>
          <DropdownMenuTrigger className="as-btn as-gho as-ico" aria-label={`Más de ${p.nombre}`}><Icono nombre="dots" tamano={18} /></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-60">
            <DropdownMenuItem onSelect={alNuevoAsunto}><Icono nombre="asu" tamano={16} />Nuevo asunto con esta persona</DropdownMenuItem>
            {tel ? <DropdownMenuItem onSelect={() => copiarTexto(tel, avisar, "Teléfono copiado")}><Icono nombre="copia" tamano={16} />Copiar teléfono</DropdownMenuItem> : null}
            <DropdownMenuSeparator />
            {!p.fallecida ? (
              <DropdownMenuItem onSelect={alLlamar}>
                <Icono nombre="reloj" tamano={16} />{p.volver_a_llamar ? `Llamarle: ${fechaCorta(p.volver_a_llamar).toLowerCase()}` : "Recordarme llamarle"}
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem onSelect={() => void hacer(() => cambiarPersonaDirectorio(p, { no_contactar: !p.no_contactar }), p.no_contactar ? "Se puede volver a contactar" : "Marcada: no contactar")}>
              <Icono nombre={p.no_contactar ? "ok" : "x"} tamano={16} />{p.no_contactar ? "Se puede contactar" : "No contactar"}
            </DropdownMenuItem>
            {ficha ? (
              <DropdownMenuItem onSelect={() => void hacer(async () => { await persona({ fallecida: !ficha.fallecida }); }, ficha.fallecida ? "Ya no se marca como fallecida" : "Marcada como fallecida")}>
                <Icono nombre="alerta" tamano={16} />{ficha.fallecida ? "No falleció" : "Falleció"}
              </DropdownMenuItem>
            ) : null}
            {director ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Solo el director</DropdownMenuLabel>
                <DropdownMenuItem onSelect={alUnir}><Icono nombre="liga" tamano={16} />Unir con otra ficha…</DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="fm-cab fm-cab-av pe-cab">
        <span className="fm-av" data-grande="" aria-hidden>{moral ? <Icono nombre="edif" tamano={22} /> : iniciales(p.nombre)}</span>
        <div>
          <h2 className="fm-h1">{p.nombre}</h2>
          <p className="as-m">{relacion}</p>
        </div>
      </div>
      {p.fallecida ? <p className="as-ban as-ban-esp"><Icono nombre="alerta" tamano={16} />Falleció. Se conserva para los documentos, sin botones de contacto.</p> : null}
      {p.no_contactar && !p.fallecida ? <p className="as-ban as-ban-esp"><Icono nombre="alerta" tamano={16} />Pidió no ser contactada.</p> : null}

      {vista === "datos" ? (
        error ? <p className="as-ban" role="alert"><Icono nombre="alerta" tamano={16} />{error}</p> : !ficha ? <div className="as-cargando" aria-busy="true"><span /><span /></div> : (
          <>
            {p.fallecida ? null : grupo("Contacto", <>
              {fila("Teléfono", tel, {
                tipo: "tel", max: 36, ayuda: "Con su clave si es de otro país: +1 619 555 0142.",
                guardar: (v) => { const m = /^\s*(\+\d{1,4})\s+(.+)$/.exec(v); return persona({ telefono: v.trim() ? { pais: m?.[1] ?? "+52", numero: m?.[2] ?? v } : null }); },
              })}
              {fila("Correo", ficha.correo, { tipo: "email", max: 200, guardar: (v) => persona({ correo: v || null }) })}
            </>)}
            {grupo(moral ? "Datos de la empresa" : "Datos personales", <>
              {fila(moral ? "Nombre" : "Se le conoce como", ficha.nombre, { max: 160, guardar: (v) => (v.trim() ? persona({ nombre: v }) : null) })}
              {fila(moral ? "Razón social completa" : "Nombre completo", ficha.datos.nombre_completo, { max: 200, ayuda: "Como viene en su identificación.", guardar: (v) => dato("nombre_completo", v) })}
              {fila("Nacionalidad", ficha.datos.nacionalidad, { max: 60, guardar: (v) => dato("nacionalidad", v) })}
              {moral ? null : fila("Ocupación", ficha.datos.ocupacion, { max: 120, guardar: (v) => dato("ocupacion", v) })}
              {moral ? null : fila("Estado civil", ficha.datos.estado_civil, { opciones: ESTADOS_CIVILES, guardar: (v) => dato("estado_civil", v) })}
            </>)}
            {grupo("Identificación y datos fiscales", <>
              {moral ? null : fila("Identificación", ficha.datos.identificacion_tipo, { max: 60, ayuda: "INE, pasaporte…", guardar: (v) => dato("identificacion_tipo", v) })}
              {moral ? null : fila("Número", ficha.datos.identificacion_numero, { max: 60, guardar: (v) => dato("identificacion_numero", v) })}
              {moral ? null : fila("CURP", ficha.datos.curp, { mayusculas: true, cuentaDe: 18, max: 18, guardar: (v) => dato("curp", v) }, true)}
              {fila("RFC", ficha.datos.rfc, { mayusculas: true, cuentaDe: moral ? 12 : 13, max: 13, guardar: (v) => dato("rfc", v) }, true)}
            </>)}
            {grupo("Domicilio", fila("Domicilio", ficha.datos.domicilio, { max: 1500, ayuda: "Calle y número, colonia, código postal, ciudad y estado.", guardar: (v) => dato("domicilio", v) }))}
            {p.nota ? grupo("Fijado", <button type="button" className="fm-dato fm-dato-txt" onClick={() => setVista("seguimiento")}>{p.nota}</button>) : null}
          </>
        )
      ) : vista === "asuntos" ? (
        grupo(`${p.asuntos.length} asunto${p.asuntos.length === 1 ? "" : "s"}`, p.asuntos.length ? p.asuntos.map((a) => {
          const [icono, color] = iconoEncargo(a.encargos[0]);
          return (
            <Link key={a.id} href={`/panel/asuntos/${a.id}?ver=personas`} className="as-ren pe-asunto" data-cerrado={a.cerrado || undefined}>
              <Cuadro icono={icono} color={color} chico />
              <span className="as-ren-c"><b>{a.nombre}</b><span>{a.folio} · {a.papeles.map((x) => cat.etiqueta("papel", x)).join(", ")}{a.cerrado ? " · cerrado" : ""}</span></span>
              <Icono nombre="ch" tamano={16} />
            </Link>
          );
        }) : <p className="as-m as-pad">Sin asunto todavía. «Nuevo asunto» empieza una consulta con sus datos.</p>)
      ) : (
        <>
          {grupo("Nota", <button type="button" className="fm-dato fm-dato-txt" onClick={() => setEdicion({
            etiqueta: "Nota", valor: p.nota, max: 500, ayuda: "Lo que conviene saber de esta persona.",
            guardar: (v) => { void hacer(() => cambiarPersonaDirectorio(p, { nota: v }), "Guardado"); return null; },
          })}><span className="fm-v" data-vacio={!p.nota || undefined}>{p.nota || "Agregar"}</span></button>)}
          {p.fallecida ? null : grupo("Seguimiento", <>
            <button type="button" className="fm-dato" onClick={alLlamar}>
              <span className="fm-k">Volver a llamar</span>
              <span className="fm-v" data-vacio={!p.volver_a_llamar || undefined}>{p.volver_a_llamar ? fechaCorta(p.volver_a_llamar) : "Agregar"}</span>
              {porLlamar(p) ? <span className="fm-tag">Hoy</span> : null}
            </button>
            <div className="fm-dato"><span className="fm-k">Contactar</span><span className="fm-v">{p.no_contactar ? "Pidió no ser contactada" : "Sí"}</span></div>
          </>)}
        </>
      )}

      <EditarDato abierto={Boolean(edicion)} etiqueta={edicion?.etiqueta ?? ""} valor={edicion?.valor ?? ""} opciones={edicion?.opciones}
        tipo={edicion?.tipo} max={edicion?.max} mayusculas={edicion?.mayusculas} cuentaDe={edicion?.cuentaDe} ayuda={edicion?.ayuda}
        alCerrar={() => setEdicion(null)}
        alGuardar={(v) => {
          const e = edicion;
          setEdicion(null);
          if (!e || v === e.valor) return;
          const accion = e.guardar(v);
          if (accion) void accion.then(() => { avisar("Guardado"); alCambio(); }, (x: unknown) => avisar(x instanceof Error ? x.message : "No se pudo guardar."));
        }} />
    </div>
  );
}

// ── Diálogos ─────────────────────────────────────────────────────────────────────────────────────────
function DialogoLlamar({ p, alCerrar, alGuardar }: { p: PersonaDirectorio | null; alCerrar: () => void; alGuardar: (p: PersonaDirectorio, fecha: string | null) => void }) {
  const [fecha, setFecha] = useState<string | null>(null);
  const [previa, setPrevia] = useState<PersonaDirectorio | null>(null);
  if (p !== previa) { setPrevia(p); setFecha(p?.volver_a_llamar ?? sumarDias(7)); }
  return (
    <Dialog open={!!p} onOpenChange={(o) => { if (!o) alCerrar(); }}>
      <DialogContent className="max-w-md">
        <DialogTitle>Volver a llamar</DialogTitle>
        <DialogDescription>{p?.nombre}. Queda en el Directorio como «Por llamar» ese día.</DialogDescription>
        {p ? (
          <form className="as-form" onSubmit={(e) => { e.preventDefault(); alCerrar(); alGuardar(p, fecha); }}>
            <DesplegableFecha etiqueta="Cuándo" valor={fecha} alElegir={setFecha} hoy={new Date()} sinFecha="Ya no" />
            <div className="as-fila as-fin">
              <button type="button" className="as-btn" onClick={alCerrar}>Cancelar</button>
              <button type="submit" className="as-btn as-pri">Guardar</button>
            </div>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/** Dos fichas de la misma persona: se elige la que se queda; la otra pasa a Eliminados con todo lo suyo en la que queda. */
function DialogoUnir({ p, todas, alCerrar, alUnir }: {
  p: PersonaDirectorio | null; todas: PersonaDirectorio[]; alCerrar: () => void; alUnir: (origen: PersonaDirectorio, destino: PersonaDirectorio) => void;
}) {
  const [q, setQ] = useState("");
  const [con, setCon] = useState<string | null>(null);
  const [previa, setPrevia] = useState<PersonaDirectorio | null>(null);
  if (p !== previa) { setPrevia(p); setQ(p ? p.nombre.split(" ")[0] : ""); setCon(null); }
  const opciones = p ? todas.filter((x) => x.id !== p.id && coincide(x, q.trim())).slice(0, 8) : [];
  const destino = todas.find((x) => x.id === con) ?? null;
  return (
    <Dialog open={!!p} onOpenChange={(o) => { if (!o) alCerrar(); }}>
      <DialogContent className="max-w-lg">
        <DialogTitle>Unir con otra ficha</DialogTitle>
        <DialogDescription>Elige la ficha que se queda. Sus asuntos, tareas, documentos y datos pasan a ella, y la de {p?.nombre} va a Eliminados.</DialogDescription>
        {p ? (
          <div className="as-form">
            <label className="as-buscar">
              <Icono nombre="bus" tamano={16} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nombre o teléfono" aria-label="Buscar la ficha que se queda" type="search" autoFocus />
            </label>
            <div className="as-card" role="radiogroup" aria-label="La ficha que se queda">
              {opciones.length ? opciones.map((x) => (
                <button key={x.id} type="button" role="radio" aria-checked={con === x.id} className="as-ren" onClick={() => setCon(x.id)}>
                  <span className="as-av" aria-hidden>{con === x.id ? <Icono nombre="ok" tamano={15} /> : iniciales(x.nombre)}</span>
                  <span className="as-ren-c"><b>{x.nombre}</b><span>{[telefono(x) || "Sin teléfono", x.asuntos.length ? `${x.asuntos.length} asunto${x.asuntos.length > 1 ? "s" : ""}` : "Sin asunto"].join(" · ")}</span></span>
                </button>
              )) : <p className="as-pad as-m">Nadie coincide.</p>}
            </div>
            <div className="as-fila as-fin">
              <button type="button" className="as-btn" onClick={alCerrar}>Cancelar</button>
              <button type="button" className="as-btn as-pri" aria-disabled={!destino} onClick={() => { if (!destino) return; alCerrar(); alUnir(p, destino); }}>
                {destino ? `Dejar la de ${destino.nombre}` : "Elige una ficha"}
              </button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
