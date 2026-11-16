"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState, type KeyboardEvent } from "react";

import { useColeccion } from "@/components/panel/datos/use-coleccion";
import type { Property } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import type { Lead } from "@/lib/domain/records";
import { filtrarAgrupado, type Entrada } from "@/lib/panel/buscar";
import { entradasDeDatos } from "@/lib/panel/datos/buscar-datos";
import { CONFIGURACION, SECCIONES } from "@/lib/panel/secciones";

import { Icono, type NombreIcono } from "../icons";
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
  { id: "crear-consulta", titulo: "Anotar una consulta", grupo: "Crear", icono: "llamada", ruta: "/panel/consultas", claves: ["llamada", "visita", "whatsapp"] },
  { id: "crear-cita", titulo: "Cita nueva", grupo: "Crear", icono: "cita", ruta: "/panel/agenda", claves: ["visita", "agenda", "recordatorio"] },
  { id: "crear-movimiento", titulo: "Movimiento de dinero", grupo: "Crear", icono: "precio", ruta: "/panel/dinero", claves: ["cobro", "comision", "apartado", "gasto"] },
];

const ICONO_GRUPO: Partial<Record<Entrada["grupo"], NombreIcono>> = { Personas: "cliente", Inmuebles: "edificio", Consultas: "llamada" };

/**
 * Buscar o crear (Ctrl K). Personas, inmuebles y consultas por nombre, teléfono, correo o folio; ir a una sección
 * o empezar algo nuevo (RP-107). Los datos se leen solo mientras está abierta.
 */
export function BuscarOCrear({ abierta, alCerrar }: { abierta: boolean; alCerrar: () => void }) {
  return (
    <Hoja abierta={abierta} titulo="Buscar o crear" alCerrar={alCerrar} ocultarTitulo plana>
      <Contenido alCerrar={alCerrar} />
    </Hoja>
  );
}

function Contenido({ alCerrar }: { alCerrar: () => void }) {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [activa, setActiva] = useState(0);
  const clientes = useColeccion<Cliente>("clientes");
  const inmuebles = useColeccion<Property>("propiedades");
  const leads = useColeccion<Lead>("leads");
  const datos = useMemo<Opcion[]>(
    () => entradasDeDatos({ clientes: clientes.datos, inmuebles: inmuebles.datos, leads: leads.datos }).map((e) => ({ ...e, icono: ICONO_GRUPO[e.grupo] ?? "buscar" })),
    [clientes.datos, inmuebles.datos, leads.datos],
  );
  const todas = useMemo(() => [...datos, ...IR_A, ...CREAR], [datos]);
  const lista = useMemo(() => filtrarAgrupado(todas, texto), [todas, texto]);
  const actual = Math.min(activa, Math.max(0, lista.length - 1));
  const cargandoDatos = clientes.cargando || inmuebles.cargando || leads.cargando;

  const elegir = (o: Opcion | undefined) => { if (!o) return; alCerrar(); router.push(o.ruta); };
  const alTeclear = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiva(Math.min(lista.length - 1, actual + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiva(Math.max(0, actual - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); elegir(lista[actual]); }
  };

  return (
    <div className="pn-paleta" onKeyDown={alTeclear}>
      <div className="pn-paleta-entrada">
        <Icono nombre="buscar" tamano={18} />
        <input
          value={texto}
          onChange={(e) => { setTexto(e.target.value); setActiva(0); }}
          placeholder="Nombre, teléfono, folio o qué quieres crear"
          role="combobox"
          aria-expanded="true"
          aria-controls="pn-paleta-lista"
          aria-activedescendant={lista[actual] ? `pn-op-${lista[actual].id}` : undefined}
          aria-label="Buscar o crear"
          autoComplete="off"
        />
      </div>
      <ul className="pn-paleta-lista" id="pn-paleta-lista" role="listbox">
        {lista.length === 0 ? <li className="pn-paleta-grupo" role="presentation">{cargandoDatos ? "Buscando…" : "Nada coincide. Prueba con otra palabra."}</li> : null}
        {lista.map((o, i) => {
          const cabecera = i === 0 || lista[i - 1].grupo !== o.grupo;
          return (
            <li key={o.id} role="presentation">
              {cabecera ? <div className="pn-paleta-grupo" role="presentation">{o.grupo}</div> : null}
              <button type="button" id={`pn-op-${o.id}`} role="option" aria-selected={i === actual} className="pn-paleta-op" onClick={() => elegir(o)} onMouseMove={() => setActiva(i)}>
                <Icono nombre={o.icono} tamano={18} />
                <span style={{ minWidth: 0, display: "grid" }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.titulo}</span>
                  {o.detalle ? <span style={{ fontSize: 13, color: "var(--ink-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.detalle}</span> : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="pn-solo-lector" aria-live="polite">
        {cargandoDatos || !texto.trim() ? "" : lista.length === 0 ? "Sin resultados" : lista.length === 1 ? "1 resultado" : `${lista.length} resultados`}
      </p>
      <div className="pn-paleta-pie" aria-hidden>
        <span><kbd className="pn-kbd">↑</kbd> <kbd className="pn-kbd">↓</kbd> moverse</span>
        <span><kbd className="pn-kbd">Enter</kbd> abrir</span>
        <span><kbd className="pn-kbd">Esc</kbd> cerrar</span>
      </div>
    </div>
  );
}
