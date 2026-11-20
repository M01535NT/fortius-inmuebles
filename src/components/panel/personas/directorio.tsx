"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { useCatalogos } from "@/components/panel/datos/catalogos";
import { EditarDato, copiarTexto } from "@/components/panel/fichas/piezas";
import { Icono } from "@/components/panel/icons";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Desplegable, DesplegableFecha } from "@/components/panel/kit/desplegable";
import { BotonesDeVista } from "@/components/panel/kit/segmentado";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/panel/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/panel/ui/dropdown-menu";
import { Switch } from "@/components/panel/ui/switch";
import {
  AVISOS_PRIVACIDAD, MEDIOS_CONTACTO, RESULTADOS_CONTACTO,
  type AvisoPrivacidad, type Interes, type MedioContacto, type ResultadoContacto,
} from "@/lib/backend/directorio-contrato";
import {
  cambiarFicha, fechaCorta, iconoEncargo, iniciales, leerFicha, sumarDias,
  type CambioFicha, type CampoDato, type FichaPersona,
} from "@/lib/panel/asuntos/api";
import {
  anotarContactoPersona, archivarPersona, cambiarPersonaDirectorio, leerDirectorio, unirFichas, type PersonaDirectorio,
} from "@/lib/panel/biblioteca";
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
// «Qué ver»: "" son las activas (no archivadas). Archivadas y Todas son las únicas que muestran archivadas.
type Filtro = "" | "con" | "sin" | "llamar" | "sin_seg" | "archivadas" | "todas";
const FILTROS: { valor: Exclude<Filtro, "">; etiqueta: string }[] = [
  { valor: "con", etiqueta: "Con asunto" }, { valor: "sin", etiqueta: "Contactos sin asunto" }, { valor: "llamar", etiqueta: "Por llamar" },
  { valor: "sin_seg", etiqueta: "Sin seguimiento" }, { valor: "archivadas", etiqueta: "Archivadas" }, { valor: "todas", etiqueta: "Todas, con archivadas" },
];
const hoy = () => sumarDias(0);
const sinAcentos = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const digitos = (p: Pick<PersonaDirectorio, "telefonos">) => p.telefonos.map((t) => `${t.pais}${t.numero}`.replace(/\D/g, ""));
const telefono = (p: Pick<PersonaDirectorio, "telefonos">) => (p.telefonos[0] ? `${p.telefonos[0].pais} ${p.telefonos[0].numero}` : "");
const archivada = (p: Pick<PersonaDirectorio, "archivada_el">) => Boolean(p.archivada_el);
const porLlamar = (p: PersonaDirectorio) => !archivada(p) && !!p.volver_a_llamar && p.volver_a_llamar <= hoy() && !p.no_contactar && !p.fallecida;

function pasa(p: PersonaDirectorio, f: Filtro) {
  if (f === "todas") return true;
  if (f === "archivadas") return archivada(p);
  if (archivada(p)) return false;
  if (f === "con") return p.asuntos.length > 0;
  if (f === "sin") return p.asuntos.length === 0;
  if (f === "llamar") return porLlamar(p);
  if (f === "sin_seg") return Boolean(p.sin_seguimiento);
  return true;
}

// Textos de los catálogos fijos del contrato (directorio-contrato.ts).
const MEDIO: Record<MedioContacto, string> = { llamada: "Llamada", whatsapp: "WhatsApp", correo: "Correo", en_persona: "En persona", otro: "Otro" };
const RESULTADO: Record<ResultadoContacto, string> = {
  contesto: "Contestó", no_contesto: "No contestó", pidio_llamar_despues: "Pidió que le llamen después", le_interesa: "Le interesa",
  no_le_interesa: "No le interesa", cita: "Se agendó una cita", otro: "Otro",
};
const AVISO: Record<AvisoPrivacidad, string> = { pendiente: "Por enviar", enviado: "Enviado", aceptado: "Aceptado", no_acepto: "No lo aceptó" };
const INTERES_VACIO: Interes = { que_busca: "", que_ofrece: "", presupuesto: null, moneda: "MXN", zona: "" };
/** «2,500,000 USD» o «$1.8 millones» no: solo números; «USD» o «dólares» lo marca en dólares. */
function leerPresupuesto(v: string): Pick<Interes, "presupuesto" | "moneda"> {
  const n = Number(v.replace(/[^\d.]/g, ""));
  return { presupuesto: v.trim() && Number.isFinite(n) && n > 0 ? n : null, moneda: /usd|d[oó]lar|us\$/i.test(v) ? "USD" : "MXN" };
}
const presupuestoTexto = (i: Interes) => (i.presupuesto ? `$${i.presupuesto.toLocaleString("es-MX")} ${i.moneda}` : "");
function proximoLunes() {
  const d = new Date();
  d.setDate(d.getDate() + (((8 - d.getDay()) % 7) || 7));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const cuandoContacto = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString("es-MX", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
};
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

/** Si tiene ese papel en alguno de sus asuntos; «sin_papel»: no está en ningún asunto. */
const tienePapel = (p: PersonaDirectorio, x: string) => (x === "sin_papel" ? !p.asuntos.length : p.asuntos.some((a) => a.papeles.includes(x)));

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
  // `?persona=` es como llegan Consultas y la ruta del servidor; `?id=` el de la lista. Las dos abren la ficha.
  const abierta = params.get("id") ?? params.get("persona");
  const sesion = useSession();
  const director = sesion?.role === "admin";
  const [todas, setTodas] = useState<PersonaDirectorio[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Desde el buscador llega con ?q=<nombre>: el Directorio abre ya filtrado.
  const [q, setQ] = useState(() => params.get("q") ?? "");
  const [filtro, setFiltro] = useState<Filtro>("");
  const [mias, setMias] = useState(false);
  // Hallazgo 43: filtrar por el papel que tiene en algún asunto (vacío: cualquiera; «sin_papel»: sin asunto).
  const [conPapel, setConPapel] = useState("");
  const [sigue, setSigue] = useState<PersonaDirectorio | null>(null);
  const [unir, setUnir] = useState<PersonaDirectorio | null>(null);

  // Se piden todas (con archivadas) una vez: «Qué ver» filtra aquí y cada opción lleva su cuenta.
  const leer = useCallback(() => leerDirectorio({ ver: "todas" }).then((x) => { setTodas(x); setError(null); }, (e: unknown) => setError(e instanceof Error ? e.message : "No se pudo cargar.")), []);
  const cargar = leer;
  useEffect(() => { void leer(); }, [leer]);
  const [qPrevia, setQPrevia] = useState(params.get("q"));
  if (params.get("q") !== qPrevia) { setQPrevia(params.get("q")); if (params.get("q")) setQ(params.get("q") ?? ""); }

  const delEquipo = useMemo(() => (todas ?? []).filter((p) => !mias || p.responsable_id === sesion?.id), [todas, mias, sesion?.id]);
  const ver = useMemo(() => delEquipo.filter((p) => pasa(p, filtro) && (!conPapel || tienePapel(p, conPapel)) && coincide(p, q.trim())), [delEquipo, filtro, conPapel, q]);
  const papelesPresentes = [...new Set(delEquipo.flatMap((p) => p.asuntos.flatMap((a) => a.papeles)))];
  const opcionesPapel = [
    { valor: "", etiqueta: "Cualquier papel" },
    ...papelesPresentes.map((x) => ({ valor: x, etiqueta: `${papel(x)} · ${delEquipo.filter((p) => pasa(p, filtro) && tienePapel(p, x)).length}` }))
      .sort((a, b) => a.etiqueta.localeCompare(b.etiqueta, "es")),
    { valor: "sin_papel", etiqueta: `Sin asunto · ${delEquipo.filter((p) => pasa(p, filtro) && !p.asuntos.length).length}` },
  ];
  const sinSeguimiento = delEquipo.filter((p) => pasa(p, "sin_seg")).length;
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
    { valor: "" as Filtro, etiqueta: `Activas${todas ? ` · ${delEquipo.filter((p) => pasa(p, "")).length}` : ""}` },
    ...FILTROS.map((f) => ({ valor: f.valor as Filtro, etiqueta: `${f.etiqueta}${todas ? ` · ${delEquipo.filter((p) => pasa(p, f.valor)).length}` : ""}` })),
  ];

  // Renglones con su encabezado de letras.
  const renglones: ReactNode[] = [];
  let tramoActual = "";
  for (const p of ver) {
    const t = tramo(p.nombre);
    if (t !== tramoActual) { tramoActual = t; renglones.push(<div key={`t-${t}`} className="pe-tramo" role="presentation">{t}</div>); }
    const primero = p.asuntos[0];
    const cuando = p.volver_a_llamar ? ` · ${fechaCorta(p.volver_a_llamar).toLowerCase()}` : "";
    const linea = p.fallecida ? "Falleció"
      : archivada(p) ? "Archivada"
        : primero ? `${primero.papeles.map(papel).join(", ")} · ${primero.nombre}${p.asuntos.length > 1 ? ` y ${p.asuntos.length - 1} más` : ""}`
          : p.lo_que_sigue ? `Sigue: ${p.lo_que_sigue}${cuando}`
            : `Sin asunto${p.volver_a_llamar ? ` · llamarle${cuando}` : ""}`;
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
            {papelesPresentes.length ? <Pildora etiqueta="Papel" valor={conPapel} opciones={opcionesPapel} alElegir={setConPapel} titulo={conPapel ? undefined : "Papel"} /> : null}
            {director ? (
              // Dos opciones (todo el equipo o las mías): interruptor. El asesor ya ve solo lo suyo.
              <label className="pe-mias"><Switch checked={mias} onCheckedChange={setMias} aria-label="Solo las que llevo yo" />Las mías</label>
            ) : null}
          </div>
          {sinSeguimiento > 0 && filtro === "" && !q.trim() ? (
            <button type="button" className="pe-aviso" onClick={() => setFiltro("sin_seg")}>
              <Icono nombre="alerta" tamano={15} />{sinSeguimiento === 1 ? "1 persona sin seguimiento" : `${sinSeguimiento} personas sin seguimiento`}
              <Icono nombre="ch" tamano={14} />
            </button>
          ) : null}

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
            alVolver={() => abrir(null)} alNuevoAsunto={() => void nuevoAsunto(actual)} alSigue={() => setSigue(actual)} alUnir={() => setUnir(actual)} />
        ) : abierta && !todas ? (
          <div className="as-cargando" aria-busy="true"><span /><span /></div>
        ) : (
          <div className="as-in as-elige">
            <Icono nombre="users" tamano={28} />
            <p className="as-m">{abierta ? "Esa ficha no está en el Directorio. Búscala por nombre o teléfono en la lista." : "Elige una persona de la lista."}</p>
          </div>
        )}
      </section>

      <DialogoSigue p={sigue} alCerrar={() => setSigue(null)} alGuardar={(p, que, fecha) => void hacer(() => cambiarPersonaDirectorio(p, { lo_que_sigue: que, volver_a_llamar: fecha }),
        fecha ? `Lo que sigue: ${fechaCorta(fecha).toLowerCase()}` : que ? "Lo que sigue, guardado" : "Sin nada pendiente")} />
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

function FichaDirectorio({ p, director, hacer, alCambio, alVolver, alNuevoAsunto, alSigue, alUnir }: {
  p: PersonaDirectorio; director: boolean; hacer: (accion: () => Promise<unknown>, aviso: string) => Promise<void>; alCambio: () => void;
  alVolver: () => void; alNuevoAsunto: () => void; alSigue: () => void; alUnir: () => void;
}) {
  const { avisar } = useAvisos();
  const cat = useCatalogos();
  const [ficha, setFicha] = useState<FichaPersona | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [vista, setVista] = useState<Vista>("datos");
  const [edicion, setEdicion] = useState<Edicion | null>(null);
  const [visibles, setVisibles] = useState<Set<string>>(new Set());
  const [llamada, setLlamada] = useState(false);

  // Se vuelve a leer cuando la lista trae una versión nueva (una llamada anotada, lo que sigue, archivar…).
  useEffect(() => {
    let vivo = true;
    leerFicha(p.id).then((f) => { if (vivo) { setFicha(f); setError(null); } }, (e: unknown) => { if (vivo) setError(e instanceof Error ? e.message : "No se pudo abrir la ficha."); });
    return () => { vivo = false; };
  }, [p.id, p.version]);

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
  const interes = { ...INTERES_VACIO, ...(ficha?.interes ?? p.interes ?? {}) };
  const enArchivo = archivada(p);

  /** Lo que sigue: «Hecho» lo limpia y ofrece anotar lo siguiente; las fechas rápidas solo mueven el día. */
  const hecho = async () => {
    try {
      await cambiarPersonaDirectorio(p, { lo_que_sigue: "", volver_a_llamar: null });
      avisar("Hecho. ¿Qué sigue?", { etiqueta: "Agregar", alAccionar: alSigue });
    } catch (e) { avisar(e instanceof Error ? e.message : "No se pudo terminar."); }
    alCambio();
  };
  const posponer = (fecha: string, texto: string) => void hacer(() => cambiarPersonaDirectorio(p, { volver_a_llamar: fecha }), `Lo que sigue: ${texto}`);
  const archivar = async (si: boolean) => {
    try {
      const r = await archivarPersona(p, si);
      avisar(si ? `${p.nombre}, archivada` : `${p.nombre} volvió a la lista`, si ? { etiqueta: "Deshacer", alAccionar: () => void hacer(() => archivarPersona({ id: p.id, version: r.version }, false), "Recuperada") } : undefined);
    } catch (e) { avisar(e instanceof Error ? e.message : "No se pudo terminar."); }
    alCambio();
  };

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
            { valor: "seguimiento", etiqueta: "Notas", icono: "nota", cuenta: ficha?.contactos?.length || undefined },
          ]} />
        <span className="as-sp" />
        {!p.fallecida && !enArchivo ? (
          <button type="button" className="pn-btn as-ocultar-tel" onClick={() => setLlamada(true)}><Icono nombre="llamada" tamano={15} />Registrar llamada</button>
        ) : null}
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
              <>
                <DropdownMenuItem onSelect={() => setLlamada(true)}><Icono nombre="llamada" tamano={16} />Registrar llamada…</DropdownMenuItem>
                <DropdownMenuItem onSelect={alSigue}>
                  <Icono nombre="reloj" tamano={16} />{p.lo_que_sigue || p.volver_a_llamar ? "Cambiar lo que sigue…" : "Anotar lo que sigue…"}
                </DropdownMenuItem>
              </>
            ) : null}
            <DropdownMenuItem onSelect={() => void hacer(() => cambiarPersonaDirectorio(p, { no_contactar: !p.no_contactar }), p.no_contactar ? "Se puede volver a contactar" : "Marcada: no contactar")}>
              <Icono nombre={p.no_contactar ? "ok" : "x"} tamano={16} />{p.no_contactar ? "Se puede contactar" : "No contactar"}
            </DropdownMenuItem>
            {ficha ? (
              <DropdownMenuItem onSelect={() => void hacer(async () => { await persona({ fallecida: !ficha.fallecida }); }, ficha.fallecida ? "Ya no se marca como fallecida" : "Marcada como fallecida")}>
                <Icono nombre="alerta" tamano={16} />{ficha.fallecida ? "No falleció" : "Falleció"}
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => void archivar(!enArchivo)}>
              <Icono nombre={enArchivo ? "ok" : "expediente"} tamano={16} />{enArchivo ? "Recuperar" : "Archivar"}
            </DropdownMenuItem>
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
      {enArchivo ? (
        <p className="as-ban as-ban-esp pe-ban-boton">
          <Icono nombre="expediente" tamano={16} /><span>Archivada. No sale en la lista diaria; sus datos y asuntos siguen aquí.</span>
          <button type="button" className="as-btn" onClick={() => void archivar(false)}>Recuperar</button>
        </p>
      ) : null}

      {/* Lo que sigue: arriba de todo, con «Hecho» y las fechas rápidas, como en el panel de antes. */}
      {!p.fallecida && !enArchivo ? (
        <section className="fm-grupo pe-sigue">
          <div className="fm-t"><span>Lo que sigue</span></div>
          <div className="fm-card">
            {p.lo_que_sigue || p.volver_a_llamar ? (
              <div className="fm-dato pe-sigue-fila">
                <button type="button" className="fm-dato-b" onClick={alSigue} aria-label={`Lo que sigue: ${p.lo_que_sigue || "llamarle"}. Cambiar`}>
                  <span className="fm-v">{p.lo_que_sigue || "Llamarle"}</span>
                  {p.volver_a_llamar ? <span className="fm-tag" data-vencido={porLlamar(p) || undefined}>{porLlamar(p) && p.volver_a_llamar < hoy() ? `Venció ${fechaCorta(p.volver_a_llamar).toLowerCase()}` : fechaCorta(p.volver_a_llamar)}</span> : null}
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger className="as-btn as-gho pe-mini" aria-label="Mover la fecha de lo que sigue">Posponer</DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-48">
                    <DropdownMenuItem onSelect={() => posponer(sumarDias(1), "mañana")}>Mañana</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => posponer(proximoLunes(), "el lunes")}>El lunes</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => posponer(sumarDias(7), "en una semana")}>En una semana</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={alSigue}>Elegir fecha…</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <button type="button" className="as-btn pe-mini pe-hecho" onClick={() => void hecho()}><Icono nombre="ok" tamano={14} />Hecho</button>
              </div>
            ) : (
              <button type="button" className="fm-dato" onClick={alSigue}>
                <span className="fm-v" data-vacio="">{p.asuntos.some((a) => !a.cerrado) ? "Lo lleva su asunto. Anota algo aparte si hace falta." : "Nada pendiente. Agregar"}</span>
              </button>
            )}
          </div>
        </section>
      ) : null}

      {vista === "datos" ? (
        error ? <p className="as-ban" role="alert"><Icono nombre="alerta" tamano={16} />{error}</p> : !ficha ? <div className="as-cargando" aria-busy="true"><span /><span /></div> : (
          <>
            {p.fallecida ? null : grupo("Contacto", <>
              {fila("Teléfono", tel, {
                tipo: "tel", max: 36, ayuda: "Con su clave si es de otro país: +1 619 555 0142.",
                guardar: (v) => { const m = /^\s*(\+\d{1,4})\s+(.+)$/.exec(v); return persona({ telefono: v.trim() ? { pais: m?.[1] ?? "+52", numero: m?.[2] ?? v } : null }); },
              })}
              {fila("Correo", ficha.correo, { tipo: "email", max: 200, guardar: (v) => persona({ correo: v || null }) })}
              {fila("Prefiere", ficha.canal, { max: 60, ayuda: "Por dónde y cuándo: «WhatsApp, por la tarde».", guardar: (v) => persona({ canal: v.trim() || null }) })}
            </>)}
            {grupo("Qué busca y qué ofrece", <>
              {fila("Busca", interes.que_busca, { max: 300, ayuda: "Casa de 3 recámaras, local en renta…", guardar: (v) => persona({ interes: { que_busca: v.trim() } }) })}
              {fila("Ofrece", interes.que_ofrece, { max: 300, ayuda: "Lo que quiere vender o rentar.", guardar: (v) => persona({ interes: { que_ofrece: v.trim() } }) })}
              {fila("Presupuesto", presupuestoTexto(interes), { max: 40, ayuda: "Solo la cantidad. Escribe USD si es en dólares.", guardar: (v) => persona({ interes: leerPresupuesto(v) }) })}
              {fila("Zona", interes.zona, { max: 120, guardar: (v) => persona({ interes: { zona: v.trim() } }) })}
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
            {grupo("Privacidad", fila("Aviso de privacidad", AVISO[ficha.aviso_privacidad ?? "pendiente"], {
              opciones: AVISOS_PRIVACIDAD.map((a) => AVISO[a]),
              guardar: (v) => { const a = AVISOS_PRIVACIDAD.find((x) => AVISO[x] === v); return a ? persona({ aviso_privacidad: a }) : null; },
            }), ficha.aviso_privacidad_el ? `Cambió el ${fechaCorta(ficha.aviso_privacidad_el.slice(0, 10)).toLowerCase()}.` : undefined)}
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
          {/* Historial de contacto: solo se agrega; un error se corrige con otro renglón. */}
          {grupo("Historial de contacto", <>
            {!p.fallecida && !enArchivo ? (
              <button type="button" className="fm-dato pe-anotar" onClick={() => setLlamada(true)}>
                <Icono nombre="llamada" tamano={15} /><span className="fm-v">Registrar llamada o mensaje</span>
              </button>
            ) : null}
            {!ficha ? <div className="as-cargando" aria-busy="true"><span /></div>
              : !(ficha.contactos ?? []).length ? <p className="as-m as-pad">Todavía no hay llamadas anotadas.</p>
                : ficha.contactos.map((c) => (
                  <div key={c.id} className="fm-dato pe-contacto">
                    <span className="fm-k">{cuandoContacto(c.cuando)}</span>
                    <span className="fm-v">
                      <b>{MEDIO[c.medio] ?? c.medio} · {RESULTADO[c.resultado] ?? c.resultado}</b>
                      {c.nota ? <span>{c.nota}</span> : null}
                      {c.quien_nombre ? <small>{c.quien_nombre}</small> : null}
                    </span>
                  </div>
                ))}
          </>)}
          {p.fallecida ? null : grupo("Seguimiento", <>
            <div className="fm-dato"><span className="fm-k">Contactar</span><span className="fm-v">{p.no_contactar ? "Pidió no ser contactada" : "Sí"}</span></div>
            <div className="fm-dato"><span className="fm-k">Último contacto</span><span className="fm-v" data-vacio={!p.ultimo_contacto || undefined}>
              {p.ultimo_contacto ? `${cuandoContacto(p.ultimo_contacto.cuando)} · ${RESULTADO[p.ultimo_contacto.resultado] ?? ""}` : "Ninguno"}
            </span></div>
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
      <DialogoContacto abierto={llamada} p={p} version={ficha?.version ?? p.version} alCerrar={() => setLlamada(false)}
        alGuardado={(r) => { avisar(`Anotado: ${RESULTADO[r].toLowerCase()}`); alCambio(); }} />
    </div>
  );
}

// ── Diálogos ─────────────────────────────────────────────────────────────────────────────────────────
/** Lo que sigue con esa persona y cuándo. Ese día sale en «Por llamar» y en Inicio. */
function DialogoSigue({ p, alCerrar, alGuardar }: { p: PersonaDirectorio | null; alCerrar: () => void; alGuardar: (p: PersonaDirectorio, que: string, fecha: string | null) => void }) {
  const [que, setQue] = useState("");
  const [fecha, setFecha] = useState<string | null>(null);
  const [previa, setPrevia] = useState<PersonaDirectorio | null>(null);
  if (p !== previa) { setPrevia(p); setQue(p?.lo_que_sigue ?? ""); setFecha(p?.volver_a_llamar ?? sumarDias(7)); }
  return (
    <Dialog open={!!p} onOpenChange={(o) => { if (!o) alCerrar(); }}>
      <DialogContent className="max-w-md">
        <DialogTitle>Lo que sigue</DialogTitle>
        <DialogDescription>{p?.nombre}. Ese día aparece en «Por llamar» y en Inicio.</DialogDescription>
        {p ? (
          <form className="as-form" onSubmit={(e) => { e.preventDefault(); alCerrar(); alGuardar(p, que.trim().slice(0, 160), fecha); }}>
            <label className="pn-campo">
              <span>Qué sigue</span>
              <input className="pn-control" value={que} onChange={(e) => setQue(e.target.value)} maxLength={160} placeholder="Llamarle para agendar la visita" autoFocus />
            </label>
            <DesplegableFecha etiqueta="Cuándo" valor={fecha} alElegir={setFecha} hoy={new Date()} sinFecha="Sin fecha" />
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

/** «¿Cómo te fue?»: anota la llamada o el mensaje y, en el mismo paso, lo que sigue y cuándo volver a llamar. */
function DialogoContacto({ abierto, p, version, alCerrar, alGuardado }: {
  abierto: boolean; p: PersonaDirectorio; version: number; alCerrar: () => void; alGuardado: (r: ResultadoContacto) => void;
}) {
  const [medio, setMedio] = useState<MedioContacto>("llamada");
  const [resultado, setResultado] = useState<ResultadoContacto | "">("");
  const [nota, setNota] = useState("");
  const [que, setQue] = useState(p.lo_que_sigue);
  const [fecha, setFecha] = useState<string | null>(p.volver_a_llamar);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [antes, setAntes] = useState(false);
  // Cada vez que se abre, empieza limpio con lo que sigue de hoy.
  if (abierto !== antes) {
    setAntes(abierto);
    if (abierto) { setMedio("llamada"); setResultado(""); setNota(""); setQue(p.lo_que_sigue); setFecha(p.volver_a_llamar); setError(null); }
  }
  const elegir = (r: ResultadoContacto | "") => {
    setResultado(r);
    // «Pidió que le llamen después» sin fecha: se propone mañana; se puede cambiar.
    if (r === "pidio_llamar_despues" && !fecha) setFecha(sumarDias(1));
  };
  const guardar = async () => {
    if (ocupado) return;
    if (!resultado) { setError("Elige qué pasó."); return; }
    setOcupado(true);
    try {
      await anotarContactoPersona(p.id, {
        version, medio, resultado, nota: nota.trim() || undefined,
        ...(que.trim() !== p.lo_que_sigue ? { lo_que_sigue: que.trim().slice(0, 160) } : {}),
        ...(fecha !== p.volver_a_llamar ? { volver_a_llamar: fecha } : {}),
      });
      alCerrar();
      alGuardado(resultado);
    } catch (e) {
      // Lo escrito sigue en pantalla para reintentar.
      setError(e instanceof Error ? e.message : "No se pudo anotar. Vuelve a intentarlo.");
    } finally { setOcupado(false); }
  };
  return (
    <Dialog open={abierto} onOpenChange={(o) => { if (!o) alCerrar(); }}>
      <DialogContent className="max-w-md">
        <DialogTitle>¿Cómo te fue?</DialogTitle>
        <DialogDescription>{p.nombre}. Queda en su historial de contacto.</DialogDescription>
        <form className="as-form" onSubmit={(e) => { e.preventDefault(); void guardar(); }}>
          <Desplegable etiqueta="Cómo fue el contacto" valor={medio} opciones={MEDIOS_CONTACTO.map((m) => ({ valor: m, etiqueta: MEDIO[m] }))} alElegir={(v) => { if (v) setMedio(v); }} />
          <Desplegable etiqueta="Qué pasó" valor={resultado} vacio="Elige" opciones={RESULTADOS_CONTACTO.map((r) => ({ valor: r, etiqueta: RESULTADO[r] }))} alElegir={elegir} />
          <label className="pn-campo">
            <span>Nota</span>
            <textarea className="pn-control" rows={3} value={nota} onChange={(e) => setNota(e.target.value)} maxLength={1000} placeholder="Lo que dijo, lo que quedó" />
          </label>
          <label className="pn-campo">
            <span>Lo que sigue</span>
            <input className="pn-control" value={que} onChange={(e) => setQue(e.target.value)} maxLength={160} placeholder="Mandarle opciones el lunes" />
          </label>
          <DesplegableFecha etiqueta="Volver a llamar" valor={fecha} alElegir={setFecha} hoy={new Date()} sinFecha="Sin fecha" />
          {error ? <p className="as-ban" role="alert"><Icono nombre="alerta" tamano={16} />{error}</p> : null}
          <div className="as-fila as-fin">
            <button type="button" className="as-btn" onClick={alCerrar}>Cancelar</button>
            <button type="submit" className="as-btn as-pri" aria-disabled={ocupado}>{ocupado ? "Anotando…" : "Anotar"}</button>
          </div>
        </form>
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
