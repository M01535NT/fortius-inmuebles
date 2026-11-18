"use client";
import { useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { Icono } from "@/components/panel/icons";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Desplegable } from "@/components/panel/kit/desplegable";
import { BotonDictar, sumarDictado } from "@/components/panel/kit/dictar";
import { Switch } from "@/components/panel/ui/switch";
import {
  agregar, fijarNota, haceCuanto, iniciales, NOMBRE_PAPEL, type Apartado, type Asunto, type EntradaHistorial, type Miembro, type NuevaNota, type PersonaDelAsunto,
} from "@/lib/panel/asuntos/api";

import type { Hacer } from "./comun";
import { useAsuntos } from "./proveedor";

/**
 * Las notas del asunto (SPEC.md, «Las notas del asunto»): un costado en cada ventana del asunto. Con @ se menciona a una
 * persona del asunto o a un compañero del equipo (le llega a «Para ti» en Inicio) y con # a un apartado; la mención abre su ficha o su apartado. Son las del Historial: no se cambian ni se borran
 * y nunca salen en informes ni documentos para el cliente. Lo único que se cambia de una nota es fijarla arriba (hasta 10).
 */

type Filtro = "todas" | "apartado" | "persona";
type Sugerencia = { clave: string; texto: string; detalle: string; persona?: PersonaDelAsunto; apartado?: Apartado; miembro?: Miembro };

/** Sin acentos ni mayúsculas, para buscar «mendez» y encontrar «Méndez». */
const plano = (t: string) => t.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** Las personas, una vez cada una (alguien puede tener dos papeles en el mismo asunto). */
function personasUnicas(a: Asunto): PersonaDelAsunto[] {
  const vistas = new Set<string>();
  return a.personas.filter((p) => (vistas.has(p.persona_id) ? false : (vistas.add(p.persona_id), true)));
}

/** El texto de la nota con sus @ y # como enlaces. Gana el nombre más largo («Ana María» antes que «Ana»). */
function trozos(texto: string, personas: PersonaDelAsunto[], apartados: { x: Apartado; nombre: string }[], equipo: Miembro[]) {
  const marcas = [
    ...personas.map((p) => ({ txt: `@${p.nombre}`, persona: p })),
    ...equipo.map((m) => ({ txt: `@${m.nombre}`, miembro: m })),
    ...apartados.map((y) => ({ txt: `#${y.nombre}`, apartado: y.x })),
  ].sort((m, n) => n.txt.length - m.txt.length);
  const salida: ({ t: string } | { t: string; persona?: PersonaDelAsunto; apartado?: Apartado; miembro?: Miembro })[] = [];
  let resto = texto;
  while (resto) {
    let mejor: { i: number; m: (typeof marcas)[number] } | null = null;
    for (const m of marcas) {
      const i = resto.indexOf(m.txt);
      if (i >= 0 && (!mejor || i < mejor.i)) mejor = { i, m };
    }
    if (!mejor) { salida.push({ t: resto }); break; }
    if (mejor.i) salida.push({ t: resto.slice(0, mejor.i) });
    salida.push({
      t: mejor.m.txt, persona: "persona" in mejor.m ? mejor.m.persona : undefined,
      apartado: "apartado" in mejor.m ? mejor.m.apartado : undefined, miembro: "miembro" in mejor.m ? mejor.m.miembro : undefined,
    });
    resto = resto.slice(mejor.i + mejor.m.txt.length);
  }
  return salida;
}

export function NotasDelAsunto({ a, notas, fijadas, desde, nombreDeApartado, persona, filtro, alFiltrar, hacer, abrirPersona, abrirApartado, alCerrar }: {
  a: Asunto; notas: EntradaHistorial[] | null;
  /** Las notas fijadas arriba, la más reciente fijada primero. */
  fijadas: number[];
  /** El apartado de la ventana abierta: ahí queda anotada la nota. */
  desde: Apartado | null;
  nombreDeApartado: (x: Apartado) => string;
  /** La persona cuya ficha está abierta en Personas, si la hay. */
  persona: PersonaDelAsunto | null;
  filtro: Filtro; alFiltrar: (f: Filtro) => void;
  hacer: Hacer;
  abrirPersona: (personaId: string) => void;
  abrirApartado: (x: Apartado) => void;
  /** En el teléfono el costado se cierra con su X. */
  alCerrar?: () => void;
}) {
  const id = useId();
  const { nombreDe, companeros: todoElEquipo, yo } = useAsuntos();
  const { avisar } = useAvisos();
  const area = useRef<HTMLTextAreaElement>(null);
  const [texto, setTexto] = useState("");
  const [decision, setDecision] = useState(false);
  const [sinLigar, setSinLigar] = useState<string | null>(null);
  const [buscando, setBuscando] = useState<{ marca: "@" | "#"; q: string; desde: number } | null>(null);
  const [marcada, setMarcada] = useState(0);
  const [guardando, setGuardando] = useState(false);
  // A los del equipo solo se les avisa si se eligieron de la lista: un texto parecido («@Jorge Ramírez») no menciona a «Jorge».
  const [delEquipo, setDelEquipo] = useState<Set<string>>(() => new Set());

  const personas = useMemo(() => personasUnicas(a), [a]);
  /** Los compañeros que se pueden mencionar: todo el equipo menos quien escribe. */
  const equipo = useMemo(() => todoElEquipo.filter((m) => m.id !== yo), [todoElEquipo, yo]);
  const apartados = useMemo(() => a.apartados.filter((x) => x.visible).map((x) => ({ x, nombre: nombreDeApartado(x) })), [a.apartados, nombreDeApartado]);
  const ligada = persona && sinLigar !== persona.persona_id ? persona : null;

  const sugerencias: Sugerencia[] = useMemo(() => {
    if (!buscando) return [];
    const q = plano(buscando.q);
    const coincide = (n: string) => plano(n).split(/\s+/).some((w) => w.startsWith(q)) || plano(n).startsWith(q);
    return buscando.marca === "@"
      ? [
        ...personas.filter((p) => coincide(p.nombre)).slice(0, 6).map((p) => ({ clave: p.persona_id, texto: `@${p.nombre}`, detalle: NOMBRE_PAPEL[p.papel], persona: p })),
        ...equipo.filter((m) => coincide(m.nombre)).slice(0, 4).map((m) => ({ clave: `e-${m.id}`, texto: `@${m.nombre}`, detalle: "Equipo", miembro: m })),
      ]
      : apartados.filter((y) => plano(y.nombre).startsWith(q) || plano(y.nombre).includes(q))
        .slice(0, 6).map((y) => ({ clave: y.x.id, texto: `#${y.nombre}`, detalle: "Apartado", apartado: y.x }));
  }, [buscando, personas, apartados, equipo]);

  /** Mira si lo que está justo antes del cursor es una @ o un # a medio escribir. */
  function mirar(valor: string, cursor: number) {
    const antes = valor.slice(0, cursor);
    const m = /(^|\s)([@#])([^\s@#]{0,30})$/u.exec(antes);
    if (m) { setBuscando({ marca: m[2] as "@" | "#", q: m[3], desde: cursor - m[3].length - 1 }); setMarcada(0); }
    else setBuscando(null);
  }

  function usar(s: Sugerencia) {
    if (!buscando) return;
    const cursor = area.current?.selectionStart ?? texto.length;
    const nuevo = `${texto.slice(0, buscando.desde)}${s.texto} ${texto.slice(cursor)}`;
    const pos = buscando.desde + s.texto.length + 1;
    setTexto(nuevo); setBuscando(null);
    if (s.miembro) { const id = s.miembro.id; setDelEquipo((x) => new Set(x).add(id)); }
    requestAnimationFrame(() => { area.current?.focus(); area.current?.setSelectionRange(pos, pos); });
  }

  function tecla(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (buscando && sugerencias.length) {
      if (e.key === "ArrowDown") { e.preventDefault(); setMarcada((i) => (i + 1) % sugerencias.length); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setMarcada((i) => (i + sugerencias.length - 1) % sugerencias.length); return; }
      if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); usar(sugerencias[marcada] ?? sugerencias[0]); return; }
    }
    if (e.key === "Escape" && buscando) { e.preventDefault(); e.stopPropagation(); setBuscando(null); return; }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); void guardar(); }
  }

  async function guardar() {
    const t = texto.trim();
    if (!t || guardando) return;
    const mencionadas = personas.filter((p) => t.includes(`@${p.nombre}`)).map((p) => p.persona_id);
    const cuerpo: NuevaNota = {
      clase: decision ? "decision" : "nota", texto: t,
      ...(desde ? { desde: desde.id } : {}),
      personas: [...new Set([...mencionadas, ...(ligada ? [ligada.persona_id] : [])])],
      apartados: apartados.filter((y) => t.includes(`#${y.nombre}`)).map((y) => y.x.id),
      equipo: equipo.filter((m) => delEquipo.has(m.id) && t.includes(`@${m.nombre}`)).map((m) => m.id),
    };
    setGuardando(true);
    try {
      let ok = false;
      await hacer(async () => { await agregar(a.id, "historial", cuerpo); ok = true; }, decision ? "Decisión anotada" : "Nota anotada");
      if (ok) { setTexto(""); setDecision(false); setSinLigar(null); setDelEquipo(new Set()); }
    } finally { setGuardando(false); }
  }

  async function fijar(n: EntradaHistorial, si: boolean) {
    await hacer(() => fijarNota(a.id, n.id, si), si ? "Nota fijada arriba" : "Nota suelta", () => fijarNota(a.id, n.id, !si));
  }

  const solo = (notas ?? []).filter((n) => n.clase === "nota" || n.clase === "decision");
  const lugar = new Map(fijadas.map((nid, i) => [nid, i]));
  const filtroValido: Filtro = filtro === "persona" && !persona ? "todas" : filtro === "apartado" && !desde ? "todas" : filtro;
  const lista = solo.filter((n) => {
    const l = n.detalle?.ligas;
    if (filtroValido === "persona" && persona) return Boolean(l?.personas?.includes(persona.persona_id)) || n.resumen.includes(`@${persona.nombre}`);
    if (filtroValido === "apartado" && desde) {
      return l?.desde === desde.id || Boolean(l?.apartados?.includes(desde.id))
        || (desde.clave === "personas" && Boolean(l?.personas?.length));
    }
    return true;
  }).sort((m, n) => (lugar.get(m.id) ?? Infinity) - (lugar.get(n.id) ?? Infinity) || n.id - m.id);
  const opciones: { valor: Filtro; etiqueta: string }[] = [
    { valor: "todas", etiqueta: `Todas (${solo.length})` },
    ...(desde ? [{ valor: "apartado" as const, etiqueta: `Las de ${nombreDeApartado(desde)}` }] : []),
    ...(persona ? [{ valor: "persona" as const, etiqueta: `Las que mencionan a ${persona.nombre.split(/\s+/).slice(0, 2).join(" ")}` }] : []),
  ];

  const enlace = (k: string, contenido: ReactNode, alPulsar: () => void, etiqueta: string, apartado?: boolean) => (
    <button key={k} type="button" className="as-men" data-apartado={apartado || undefined} onClick={alPulsar} title={etiqueta}>{contenido}</button>
  );

  return (
    <div className="as-notas">
      <div className="as-notas-h">
        <Icono nombre="nota" tamano={16} />
        <b>Notas del asunto</b>
        <span className="as-m as-num">{solo.length || ""}</span>
        <span className="as-sp" />
        {alCerrar ? <button type="button" className="as-btn as-gho as-ico" onClick={alCerrar} aria-label="Cerrar las notas"><Icono nombre="x" tamano={18} /></button> : null}
      </div>

      {opciones.length > 1 ? (
        <div className="as-notas-filtro">
          <Desplegable etiqueta="Ver" valor={filtroValido} opciones={opciones} alElegir={(v) => { if (v) alFiltrar(v); }} />
        </div>
      ) : null}

      <form className="as-notas-comp" onSubmit={(e) => { e.preventDefault(); void guardar(); }}>
        <label htmlFor={`${id}-t`} className="pn-solo-lector">Nueva nota</label>
        <textarea id={`${id}-t`} ref={area} rows={2} value={texto} maxLength={2000}
          placeholder="Escribe una nota. @ para una persona o un compañero, # para un apartado."
          role="combobox" aria-expanded={Boolean(buscando && sugerencias.length)} aria-controls={`${id}-s`} aria-autocomplete="list"
          aria-activedescendant={buscando && sugerencias.length ? `${id}-s-${marcada}` : undefined}
          onChange={(e) => { setTexto(e.target.value); mirar(e.target.value, e.target.selectionStart); }}
          onClick={(e) => mirar(e.currentTarget.value, e.currentTarget.selectionStart)}
          onKeyDown={tecla} onBlur={() => setTimeout(() => setBuscando(null), 150)} />
        {buscando && sugerencias.length ? (
          <ul id={`${id}-s`} role="listbox" className="as-notas-sug" aria-label={buscando.marca === "@" ? "Personas del asunto" : "Apartados"}>
            {sugerencias.map((s, i) => (
              <li key={s.clave} id={`${id}-s-${i}`} role="option" aria-selected={i === marcada}
                onMouseDown={(e) => { e.preventDefault(); usar(s); }} onMouseEnter={() => setMarcada(i)}>
                {s.persona || s.miembro ? <span className="as-av as-av-ch" data-equipo={s.miembro ? "" : undefined} aria-hidden>{iniciales((s.persona ?? s.miembro)!.nombre)}</span> : <Icono nombre="lista" tamano={15} />}
                <span className="as-crece as-corta">{s.texto}</span>
                <span className="as-m">{s.detalle}</span>
              </li>
            ))}
          </ul>
        ) : null}
        {ligada ? (
          <div className="as-notas-tags">
            <span className="as-tag">
              @{ligada.nombre}
              <button type="button" onClick={() => setSinLigar(ligada.persona_id)} aria-label={`No ligar la nota a ${ligada.nombre}`}><Icono nombre="x" tamano={12} /></button>
            </span>
          </div>
        ) : null}
        <div className="as-notas-pie">
          <BotonDictar que="la nota" alDictar={(x) => setTexto((v) => sumarDictado(v, x))} alFallar={avisar} />
          <label className="as-fila as-switch">
            <Switch checked={decision} onCheckedChange={setDecision} aria-label="Es una decisión" />
            <span className="as-m">Es una decisión</span>
          </label>
          <span className="as-sp" />
          <button type="submit" className="as-btn as-pri as-ico" aria-label="Guardar la nota" title="Guardar (Ctrl + Enter)" aria-disabled={!texto.trim() || guardando}>
            <Icono nombre="ok" tamano={17} />
          </button>
        </div>
      </form>

      <ol className="as-notas-lista" aria-label="Notas">
        {notas === null ? <li className="as-cargando" aria-busy="true"><span /><span /></li> : !lista.length ? (
          <li className="as-m as-notas-vacio">{solo.length ? "Ninguna nota con este filtro." : "Todavía no hay notas."}</li>
        ) : lista.map((n) => {
          const l = n.detalle?.ligas;
          const apartadoDe = l?.desde ? a.apartados.find((x) => x.id === l.desde) : undefined;
          const extra = personas.filter((p) => l?.personas?.includes(p.persona_id) && !n.resumen.includes(`@${p.nombre}`));
          const fija = lugar.has(n.id);
          return (
            <li key={n.id} className="as-nota" data-decision={n.clase === "decision" || undefined} data-fija={fija || undefined}>
              <p className="as-nota-t">
                {trozos(n.resumen, personas, apartados, todoElEquipo).map((t, i) => (
                  "miembro" in t && t.miembro ? <span key={i} className="as-men" data-equipo="">{t.t}</span>
                  : "persona" in t && t.persona ? enlace(`${i}`, t.t, () => abrirPersona(t.persona!.persona_id), `Abrir la ficha de ${t.persona.nombre}`)
                    : "apartado" in t && t.apartado ? enlace(`${i}`, t.t, () => abrirApartado(t.apartado!), `Abrir ${t.t.slice(1)}`, true)
                      : <span key={i}>{t.t}</span>
                ))}
                {extra.map((p) => <span key={p.persona_id}> {enlace(`x-${p.persona_id}`, `@${p.nombre}`, () => abrirPersona(p.persona_id), `Abrir la ficha de ${p.nombre}`)}</span>)}
              </p>
              <p className="as-nota-m">
                {n.clase === "decision" ? <span className="as-nota-dec">Decisión</span> : null}
                <span className="as-crece">{n.actor_id ? nombreDe(n.actor_id) : "Sistema"} · {haceCuanto(n.created_at)}{apartadoDe ? ` · ${nombreDeApartado(apartadoDe)}` : ""}</span>
                <button type="button" className="as-nota-fijar" aria-pressed={fija} onClick={() => void fijar(n, !fija)}
                  aria-label={fija ? "Soltar la nota" : "Fijar la nota arriba"} title={fija ? "Soltar" : "Fijar arriba"}>
                  <Icono nombre="fijar" tamano={15} />
                </button>
              </p>
            </li>
          );
        })}
      </ol>
      <p className="as-notas-fin">Nunca salen en informes ni documentos para el cliente.</p>
    </div>
  );
}

export type { Filtro as FiltroNotas };
