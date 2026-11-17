"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState, type KeyboardEvent } from "react";

import { useColeccion } from "@/components/panel/datos/use-coleccion";
import { useAvisos } from "@/components/panel/kit/avisos";
import type { Property } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import type { Evento, Lead } from "@/lib/domain/records";
import { diaLargo } from "@/lib/panel/calendario";
import { filtrarAgrupado, type Entrada } from "@/lib/panel/buscar";
import { nuevaCita, seEmpalma } from "@/lib/panel/datos/agenda-acciones";
import { entradasDeDatos } from "@/lib/panel/datos/buscar-datos";
import { leerMiAsesor } from "@/lib/panel/datos/colecciones";
import { rutaCita } from "@/lib/panel/datos/relacionado";
import { datosDeLinea, leerLinea, pareceCita } from "@/lib/panel/linea-cita";
import { CONFIGURACION, SECCIONES } from "@/lib/panel/secciones";

import { Gesto, Icono, type NombreIcono } from "../icons";
import { Hoja } from "./hoja";

type Opcion = Entrada & { icono: NombreIcono; ruta: string };

const IR_A: Opcion[] = [
  ...[...SECCIONES, CONFIGURACION].map((s) => ({ id: `ir-${s.slug}`, titulo: s.nombre, grupo: "Ir a" as const, icono: s.icono, ruta: s.ruta, claves: [s.resumen] })),
  { id: "ir-credito", titulo: "Crédito hipotecario", grupo: "Ir a" as const, icono: "costos", ruta: "/panel/herramientas/credito", claves: ["mensualidad", "hipoteca", "enganche", "calculadora"] },
  { id: "ir-comision", titulo: "Comisión", grupo: "Ir a" as const, icono: "precio", ruta: "/panel/herramientas/comision", claves: ["iva", "propietario", "calculadora"] },
];

/** Lo que se puede crear desde cualquier pantalla. Hoy lleva a la sección; cada etapa lo conecta con su formulario. */
const CREAR: Opcion[] = [
  { id: "crear-persona", titulo: "Persona nueva", grupo: "Crear", icono: "cliente", ruta: "/panel/personas", claves: ["cliente", "propietario", "comprador", "contacto"] },
  { id: "crear-inmueble", titulo: "Inmueble nuevo", grupo: "Crear", icono: "edificio", ruta: "/panel/inmuebles", claves: ["casa", "departamento", "terreno", "propiedad"] },
  { id: "crear-asunto", titulo: "Asunto nuevo", grupo: "Crear", icono: "expediente", ruta: "/panel/asuntos", claves: ["negocio", "venta", "renta", "busqueda", "expediente"] },
  { id: "crear-consulta", titulo: "Nueva consulta", grupo: "Crear", icono: "llamada", ruta: "/panel/consulta", claves: ["llamada", "visita", "whatsapp"] },
  { id: "crear-cita", titulo: "Cita nueva", grupo: "Crear", icono: "cita", ruta: "/panel/agenda?nueva=1", claves: ["visita", "agenda", "recordatorio"] },
  { id: "crear-movimiento", titulo: "Movimiento de dinero", grupo: "Crear", icono: "precio", ruta: "/panel/dinero", claves: ["cobro", "comision", "apartado", "gasto"] },
];

const ICONO_GRUPO: Partial<Record<Entrada["grupo"], NombreIcono>> = { Personas: "cliente", Inmuebles: "edificio", Consultas: "llamada" };
const iniciales = (t: string) => t.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");

/**
 * Buscar o crear (Ctrl K, y el «+» del teléfono). Una sola caja (boceto «Inicio»): busca personas, inmuebles y consultas
 * por nombre, teléfono, correo o folio; o se escribe en una línea («Visita mañana 11 con Mariana en Zona Río») y Enter
 * la agenda, con tipo, día, hora, persona y lugar a la vista antes de guardar. Los datos se leen solo mientras está abierta.
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
  const [texto, setTexto] = useState(textoInicial);
  const [activa, setActiva] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const clientes = useColeccion<Cliente>("clientes");
  const inmuebles = useColeccion<Property>("propiedades");
  const leads = useColeccion<Lead>("leads");
  const eventos = useColeccion<Evento>("eventos");
  const [hoy] = useState(() => new Date());
  const datos = useMemo<Opcion[]>(
    () => entradasDeDatos({ clientes: clientes.datos, inmuebles: inmuebles.datos, leads: leads.datos }).map((e) => ({ ...e, icono: ICONO_GRUPO[e.grupo] ?? "buscar" })),
    [clientes.datos, inmuebles.datos, leads.datos],
  );
  const todas = useMemo(() => [...datos, ...IR_A, ...CREAR], [datos]);
  const lista = useMemo(() => filtrarAgrupado(todas, texto), [todas, texto]);
  // Captura en una línea: si lo escrito tiene día u hora, la primera opción es agendarlo.
  const linea = useMemo(() => leerLinea(texto, hoy, clientes.datos), [texto, hoy, clientes.datos]);
  const conCita = texto.trim().length >= 4 && pareceCita(linea);
  const total = lista.length + (conCita ? 1 : 0);
  const actual = Math.min(activa, Math.max(0, total - 1));
  const cargandoDatos = clientes.cargando || inmuebles.cargando || leads.cargando;
  const empalme = conCita && linea.hora !== null ? seEmpalma(nuevaCita(datosDeLinea(linea, hoy), undefined, "__borrador__"), eventos.datos) : null;

  const agendar = async () => {
    if (guardando) return;
    setGuardando(true);
    try {
      const asesor = await leerMiAsesor();
      const n = nuevaCita(datosDeLinea(linea, hoy, asesor));
      await eventos.guardar(n.id, n);
      alCerrar();
      avisar(`Cita agendada: ${diaLargo(n.fecha)}${n.hora ? `, ${n.hora}` : ""}${empalme ? `. ${empalme}` : ""}`, {
        etiqueta: "Deshacer",
        alAccionar: () => { eventos.borrar(n.id).then(() => avisar("Se quitó la cita"), (e: unknown) => avisar(e instanceof Error ? e.message : "No se pudo deshacer.")); },
      });
      router.push(rutaCita(n.id));
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se agendó. Vuelve a intentarlo.");
    } finally { setGuardando(false); }
  };
  const elegir = (i: number) => {
    if (conCita && i === 0) { void agendar(); return; }
    const o = lista[i - (conCita ? 1 : 0)];
    if (!o) return;
    alCerrar();
    router.push(o.ruta);
  };
  const alTeclear = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiva(Math.min(total - 1, actual + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiva(Math.max(0, actual - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); elegir(actual); }
  };
  const idOp = (i: number) => (conCita && i === 0 ? "pn-op-agendar" : `pn-op-${lista[i - (conCita ? 1 : 0)]?.id}`);

  return (
    <div className="pn-paleta" onKeyDown={alTeclear}>
      <div className="pn-paleta-entrada">
        <Icono nombre="buscar" tamano={18} />
        <input
          value={texto}
          onChange={(e) => { setTexto(e.target.value); setActiva(0); }}
          placeholder="Busca o escribe: Visita mañana 11 con Mariana en Zona Río"
          role="combobox"
          aria-expanded="true"
          aria-controls="pn-paleta-lista"
          aria-activedescendant={total ? idOp(actual) : undefined}
          aria-label="Buscar o crear"
          autoComplete="off"
        />
        <kbd className="pn-kbd pn-solo-escritorio" aria-hidden>Esc</kbd>
      </div>
      <ul className="pn-paleta-lista" id="pn-paleta-lista" role="listbox">
        {conCita ? (
          <li role="presentation">
            <div className="pn-paleta-grupo" role="presentation">Crear</div>
            <button type="button" id="pn-op-agendar" role="option" aria-selected={actual === 0} className="pn-paleta-op" onClick={() => elegir(0)} onMouseMove={() => setActiva(0)}
              aria-label={`Agendar: ${linea.pastillas.map((p) => `${p.k} ${p.v}`).join(", ")}`}>
              <span className="pn-paleta-ini pn-paleta-ini-acento" aria-hidden><Gesto nombre="mas" tamano={16} /></span>
              <span style={{ flex: 1, minWidth: 0, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", padding: "6px 0" }}>
                {linea.pastillas.map((p) => <span key={p.k} className="pn-chp"><i>{p.k}</i><b>{p.v}</b></span>)}
                {!linea.fecha ? <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>Sin día: se agenda hoy</span> : null}
              </span>
              <kbd className="pn-kbd pn-solo-escritorio" aria-hidden>{guardando ? "…" : "Enter"}</kbd>
            </button>
            {empalme ? <p className="pn-warnline" style={{ margin: "2px 10px 6px" }}>{empalme} Se agenda igual.</p> : null}
          </li>
        ) : null}
        {lista.length === 0 && !conCita ? <li className="pn-paleta-grupo" role="presentation">{cargandoDatos ? "Buscando…" : "Nada coincide. Escribe la cita en una línea para agendarla."}</li> : null}
        {lista.map((o, j) => {
          const i = j + (conCita ? 1 : 0);
          const cabecera = j === 0 || lista[j - 1].grupo !== o.grupo;
          const deDatos = o.grupo === "Personas" || o.grupo === "Inmuebles" || o.grupo === "Consultas";
          return (
            <li key={o.id} role="presentation">
              {cabecera ? <div className="pn-paleta-grupo" role="presentation">{o.grupo}</div> : null}
              <button type="button" id={`pn-op-${o.id}`} role="option" aria-selected={i === actual} className="pn-paleta-op" onClick={() => elegir(i)} onMouseMove={() => setActiva(i)}>
                <span className="pn-paleta-ini" aria-hidden>{deDatos ? iniciales(o.titulo) : <Icono nombre={o.icono} tamano={16} />}</span>
                <span style={{ minWidth: 0, display: "grid" }}>
                  <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.titulo}</span>
                  {o.detalle ? <span style={{ fontSize: 12, color: "var(--ink-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.detalle}</span> : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="pn-solo-lector" aria-live="polite">
        {cargandoDatos || !texto.trim() ? "" : total === 0 ? "Sin resultados" : total === 1 ? "1 resultado" : `${total} resultados`}
      </p>
      <div className="pn-paleta-pie">
        <span>O crea:</span>
        <button type="button" className="pn-paleta-crea" onClick={() => { alCerrar(); router.push("/panel/personas"); }}>Persona</button>
        <button type="button" className="pn-paleta-crea" onClick={() => { alCerrar(); router.push("/panel/inmuebles"); }}>Inmueble</button>
        <span className="pn-solo-escritorio" style={{ marginLeft: "auto" }} aria-hidden><kbd className="pn-kbd">↑</kbd> <kbd className="pn-kbd">↓</kbd> moverse · <kbd className="pn-kbd">Enter</kbd> abrir</span>
      </div>
    </div>
  );
}
