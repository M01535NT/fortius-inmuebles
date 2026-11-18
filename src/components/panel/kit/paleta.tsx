"use client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type KeyboardEvent } from "react";

import { usePreferencia } from "@/components/panel/almacen";
import { useMisPreferencias } from "@/components/panel/datos/use-mis-preferencias";
import { useAvisos } from "@/components/panel/kit/avisos";
import { BotonDictar, sumarDictado } from "@/components/panel/kit/dictar";
import type { IndiceBuscar } from "@/lib/backend/buscar-panel";
import { agregar, fechaCorta, pedir } from "@/lib/panel/asuntos/api";
import { filtrarAgrupado, type Entrada } from "@/lib/panel/buscar";
import { leerLineaTarea } from "@/lib/panel/linea-tarea";
import { CONFIGURACION, SECCIONES } from "@/lib/panel/secciones";

import { Gesto, Icono, type NombreIcono } from "../icons";
import { Desplegable } from "./desplegable";
import { Hoja } from "./hoja";

type Opcion = Entrada & { icono: NombreIcono; ruta: string; iniciales?: boolean };

const IR_A: Opcion[] = [
  ...[...SECCIONES, CONFIGURACION].map((s) => ({ id: `ir-${s.slug}`, titulo: s.nombre, grupo: "Ir a" as const, icono: s.icono, ruta: s.ruta, claves: [s.resumen] })),
  { id: "ir-credito", titulo: "Crédito hipotecario", grupo: "Ir a" as const, icono: "costos", ruta: "/panel/herramientas/credito", claves: ["mensualidad", "hipoteca", "enganche", "calculadora"] },
  { id: "ir-comision", titulo: "Comisión", grupo: "Ir a" as const, icono: "precio", ruta: "/panel/herramientas/comision", claves: ["iva", "propietario", "calculadora"] },
];

/** Lo que se crea desde cualquier pantalla. Un asunto nace de una consulta. */
const CREAR: Opcion[] = [
  { id: "crear-consulta", titulo: "Nueva consulta", grupo: "Crear", icono: "llamada", ruta: "/panel/consulta", claves: ["llamada", "asunto", "cliente", "whatsapp", "nuevo"] },
  { id: "crear-inmueble", titulo: "Inmueble nuevo", grupo: "Crear", icono: "edificio", ruta: "/panel/inmuebles?nuevo=1", claves: ["casa", "departamento", "terreno", "propiedad"] },
  { id: "crear-persona", titulo: "Persona en el Directorio", grupo: "Crear", icono: "cliente", ruta: "/panel/directorio", claves: ["contacto", "cliente", "persona nueva"] },
];

const iniciales = (t: string) => t.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");

/** El índice se pide al abrir y se reusa un minuto (abrir y cerrar seguido no vuelve a pedirlo). */
let guardado: { cuando: number; indice: IndiceBuscar } | null = null;
async function leerIndice(): Promise<IndiceBuscar> {
  if (guardado && Date.now() - guardado.cuando < 60_000) return guardado.indice;
  const r = await pedir<{ indice: IndiceBuscar }>("/api/admin/buscar");
  guardado = { cuando: Date.now(), indice: r.indice };
  return r.indice;
}

/** Los recientes del menú (los anota el asunto al abrirse). */
type Reciente = { id: string; nombre: string };
function leerRecientes(texto: string): Reciente[] {
  try { const v: unknown = JSON.parse(texto); return Array.isArray(v) ? (v as Reciente[]).filter((r) => r && typeof r.id === "string") : []; } catch { return []; }
}

/**
 * Buscar y actuar desde un solo cuadro (Ctrl K y el botón «Buscar»; SPEC.md, sección 15). Encuentra asuntos, personas e
 * inmuebles por nombre, folio, teléfono o correo; sin escribir nada muestra tus favoritos y lo reciente. Si lo escrito es
 * algo que hacer («Llamar a Laura jueves 10am»), la primera opción crea la tarea en su asunto, con lo leído a la vista.
 */
export function BuscarOCrear({ abierta, alCerrar, textoInicial = "" }: { abierta: boolean; alCerrar: () => void; textoInicial?: string }) {
  return (
    <Hoja abierta={abierta} titulo="Buscar o crear" alCerrar={alCerrar} ocultarTitulo plana ancha>
      <Contenido alCerrar={alCerrar} textoInicial={textoInicial} />
    </Hoja>
  );
}

function Contenido({ alCerrar, textoInicial }: { alCerrar: () => void; textoInicial: string }) {
  const router = useRouter();
  const { avisar } = useAvisos();
  const { panel } = useMisPreferencias();
  const [recientesTexto] = usePreferencia("fortius-panel-recientes", "[]");
  const [texto, setTexto] = useState(textoInicial);
  const [activa, setActiva] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [indice, setIndice] = useState<IndiceBuscar | null>(guardado?.indice ?? null);
  const [falla, setFalla] = useState<string | null>(null);
  const [elegido, setElegido] = useState("");
  const [hoy] = useState(() => new Date());

  useEffect(() => {
    let vivo = true;
    leerIndice().then((i) => { if (vivo) setIndice(i); }, (e: unknown) => { if (vivo) setFalla(e instanceof Error ? e.message : "No se pudo buscar."); });
    return () => { vivo = false; };
  }, []);

  const asuntoDe = useMemo(() => new Map((indice?.asuntos ?? []).map((a) => [a.id, a])), [indice]);
  const datos = useMemo<Opcion[]>(() => {
    if (!indice) return [];
    const nombresEn = new Map<string, string[]>();
    for (const p of indice.personas) for (const a of p.asuntos) nombresEn.set(a, [...(nombresEn.get(a) ?? []), p.nombre]);
    const asuntos: Opcion[] = indice.asuntos.map((a) => ({
      id: `a-${a.id}`, titulo: a.nombre, grupo: "Asuntos", icono: "asu", ruta: `/panel/asuntos/${a.id}`,
      detalle: [a.folio, a.cerrado ? "Cerrado" : null].filter(Boolean).join(" · "), claves: [a.folio, ...(nombresEn.get(a.id) ?? [])],
    }));
    const personas: Opcion[] = indice.personas.map((p) => {
      const suyos = p.asuntos.map((x) => asuntoDe.get(x)).filter((x): x is NonNullable<typeof x> => Boolean(x));
      const uno = suyos.length === 1 ? suyos[0] : null;
      return {
        id: `p-${p.id}`, titulo: p.nombre, grupo: "Personas", icono: "cliente", iniciales: true,
        ruta: uno ? `/panel/asuntos/${uno.id}?ver=personas&persona=${p.id}` : `/panel/directorio?q=${encodeURIComponent(p.nombre)}`,
        detalle: [p.telefono, uno ? uno.nombre : suyos.length ? `${suyos.length} asuntos` : "Sin asunto"].filter(Boolean).join(" · "),
        claves: [p.telefono ?? "", (p.telefono ?? "").replace(/\D/g, ""), p.correo ?? ""],
      };
    });
    const inmuebles: Opcion[] = indice.inmuebles.map((i) => ({
      id: `i-${i.id}`, titulo: i.nombre, grupo: "Inmuebles", icono: "edificio", ruta: `/panel/inmuebles?id=${i.id}`,
      detalle: [i.folio, i.colonia].filter(Boolean).join(" · "), claves: [i.folio, i.colonia ?? ""],
    }));
    return [...asuntos, ...personas, ...inmuebles];
  }, [indice, asuntoDe]);

  // Sin escribir nada: favoritos y recientes primero.
  const atajos = useMemo<Opcion[]>(() => {
    const fav: Opcion[] = (panel.favoritos ?? []).map((f) => ({
      id: `f-${f.id}`, titulo: f.nombre, grupo: "Favoritos" as const, icono: "estrella" as const,
      ruta: f.tipo === "asunto" ? `/panel/asuntos/${f.id}` : `/panel/inmuebles?id=${f.id}`,
      detalle: f.tipo === "asunto" ? asuntoDe.get(f.id)?.folio : indice?.inmuebles.find((x) => x.id === f.id)?.folio,
    }));
    const vistos = new Set((panel.favoritos ?? []).map((f) => f.id));
    const rec: Opcion[] = leerRecientes(recientesTexto).filter((r) => !vistos.has(r.id))
      .map((r) => ({ id: `r-${r.id}`, titulo: r.nombre, grupo: "Recientes" as const, icono: "reloj" as const, ruta: `/panel/asuntos/${r.id}` }));
    return [...fav, ...rec];
  }, [panel.favoritos, asuntoDe, indice, recientesTexto]);

  const conTexto = texto.trim().length >= 2;
  const todas = useMemo(() => [...(conTexto ? datos : atajos), ...IR_A, ...CREAR], [conTexto, datos, atajos]);
  const lista = useMemo(() => filtrarAgrupado(todas, texto), [todas, texto]);

  // Escribir en una línea: si lo escrito es algo que hacer, la primera opción crea la tarea en su asunto.
  const linea = useMemo(() => leerLineaTarea(texto, hoy, indice?.personas ?? []), [texto, hoy, indice]);
  const candidatos = useMemo(() => {
    const abiertos = (indice?.asuntos ?? []).filter((a) => !a.cerrado);
    const dePersona = linea.persona ? abiertos.filter((a) => linea.persona!.asuntos.includes(a.id)) : [];
    return (dePersona.length ? dePersona : abiertos).slice(0, 40);
  }, [indice, linea.persona]);
  const conTarea = linea.parece && candidatos.length > 0;
  // Con un solo asunto posible va ahí; con varios, se elige (nunca uno al azar).
  const destino = candidatos.find((a) => a.id === elegido) ?? (candidatos.length === 1 ? candidatos[0] : null);
  const total = lista.length + (conTarea ? 1 : 0);
  const actual = Math.min(activa, Math.max(0, total - 1));

  const crearTarea = async () => {
    if (guardando) return;
    if (!destino) { avisar("Elige en qué asunto va la tarea."); return; }
    setGuardando(true);
    try {
      const enEse = linea.persona?.asuntos.includes(destino.id) ? linea.persona.id : null;
      await agregar(destino.id, "tareas", {
        titulo: linea.titulo, clase: linea.clase, fecha: linea.fecha, hora: linea.hora, persona_id: enEse, origen: "linea",
      });
      alCerrar();
      avisar(`Tarea en ${destino.nombre}${linea.fecha ? `: ${fechaCorta(linea.fecha, linea.hora).toLowerCase()}` : ""}`, {
        etiqueta: "Abrir", alAccionar: () => router.push(`/panel/asuntos/${destino.id}?ver=plan`),
      });
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se creó la tarea. Vuelve a intentarlo.");
    } finally { setGuardando(false); }
  };
  const elegir = (i: number) => {
    if (conTarea && i === 0) { void crearTarea(); return; }
    const o = lista[i - (conTarea ? 1 : 0)];
    if (!o) return;
    alCerrar();
    router.push(o.ruta);
  };
  const alTeclear = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiva(Math.min(total - 1, actual + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiva(Math.max(0, actual - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); elegir(actual); }
  };
  const idOp = (i: number) => (conTarea && i === 0 ? "pn-op-tarea" : `pn-op-${lista[i - (conTarea ? 1 : 0)]?.id}`);

  return (
    <div className="pn-paleta">
      <div className="pn-paleta-entrada">
        <Icono nombre="buscar" tamano={18} />
        <input
          value={texto}
          onChange={(e) => { setTexto(e.target.value); setActiva(0); }}
          onKeyDown={alTeclear}
          placeholder="Busca o escribe: Llamar a Laura jueves 10am"
          role="combobox"
          aria-expanded="true"
          aria-controls="pn-paleta-lista"
          aria-activedescendant={total ? idOp(actual) : undefined}
          aria-label="Buscar o crear"
          autoComplete="off"
        />
        <BotonDictar que="la búsqueda" className="pn-paleta-mic" alDictar={(t) => { setTexto((x) => sumarDictado(x, t)); setActiva(0); }} alFallar={avisar} />
        <kbd className="pn-kbd pn-solo-escritorio" aria-hidden>Esc</kbd>
      </div>
      <ul className="pn-paleta-lista" id="pn-paleta-lista" role="listbox">
        {conTarea ? (
          <li role="presentation">
            <div className="pn-paleta-grupo" role="presentation">Crear</div>
            <button type="button" id="pn-op-tarea" role="option" aria-selected={actual === 0} className="pn-paleta-op" onClick={() => elegir(0)} onMouseMove={() => setActiva(0)}
              aria-label={`Crear la tarea en ${destino?.nombre ?? "su asunto"}: ${linea.pastillas.map((p) => `${p.k} ${p.v}`).join(", ")}`}>
              <span className="pn-paleta-ini pn-paleta-ini-acento" aria-hidden><Gesto nombre="mas" tamano={16} /></span>
              <span className="pn-paleta-tarea">
                {linea.pastillas.map((p) => <span key={p.k} className="pn-chp"><i>{p.k}</i><b>{p.v}</b></span>)}
                {!linea.fecha ? <span className="pn-paleta-nota">Sin día</span> : null}
              </span>
              <kbd className="pn-kbd pn-solo-escritorio" aria-hidden>{guardando ? "…" : "Enter"}</kbd>
            </button>
            {candidatos.length > 1 ? (
              <div className="pn-paleta-donde">
                <Desplegable etiqueta="En qué asunto" valor={destino?.id ?? ""} vacio="Elige el asunto" alElegir={(v) => setElegido(v)}
                  opciones={candidatos.map((a) => ({ valor: a.id, etiqueta: a.nombre }))} />
              </div>
            ) : destino ? <p className="pn-paleta-nota pn-paleta-donde">En {destino.nombre}</p> : null}
          </li>
        ) : null}
        {lista.length === 0 && !conTarea ? (
          <li className="pn-paleta-grupo" role="presentation">{falla ?? (!indice && conTexto ? "Buscando…" : "Nada coincide. Para crear una tarea, escribe qué hacer y cuándo.")}</li>
        ) : null}
        {lista.map((o, j) => {
          const i = j + (conTarea ? 1 : 0);
          const cabecera = j === 0 || lista[j - 1].grupo !== o.grupo;
          return (
            <li key={o.id} role="presentation">
              {cabecera ? <div className="pn-paleta-grupo" role="presentation">{o.grupo}</div> : null}
              <button type="button" id={`pn-op-${o.id}`} role="option" aria-selected={i === actual} className="pn-paleta-op" onClick={() => elegir(i)} onMouseMove={() => setActiva(i)}>
                <span className="pn-paleta-ini" aria-hidden>{o.iniciales ? iniciales(o.titulo) : <Icono nombre={o.icono} tamano={16} />}</span>
                <span className="pn-paleta-txt">
                  <span>{o.titulo}</span>
                  {o.detalle ? <small>{o.detalle}</small> : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="pn-solo-lector" aria-live="polite">
        {!texto.trim() ? "" : total === 0 ? "Sin resultados" : total === 1 ? "1 resultado" : `${total} resultados`}
      </p>
      <div className="pn-paleta-pie">
        <span className="pn-solo-escritorio" aria-hidden><kbd className="pn-kbd">↑</kbd> <kbd className="pn-kbd">↓</kbd> moverse · <kbd className="pn-kbd">Enter</kbd> abrir o crear</span>
      </div>
    </div>
  );
}
