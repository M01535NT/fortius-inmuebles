"use client";
import { useState } from "react";

import { Icono } from "@/components/panel/icons";
import { Desplegable } from "@/components/panel/kit/desplegable";
import { agregar, cambiar, cambiarAsunto, type Asunto, type PuntoSituacion } from "@/lib/panel/asuntos/api";
import {
  DEBE, DE_QUIEN, NOMBRE_DEBE, NOMBRE_DE_QUIEN, NOMBRE_OCUPA, NOMBRE_QUIERE, NOMBRE_SI_NO, OCUPA, QUIERE, SI_NO,
  type DatosConsulta,
} from "@/lib/backend/consultas-contrato";
import { useCatalogos, type LectorCatalogos } from "@/components/panel/datos/catalogos";

import { ElegirVarios, type Hacer } from "./comun";

const op = <T extends string>(lista: readonly T[], nombres: Record<T, string>) => lista.map((v) => ({ valor: v, etiqueta: nombres[v] }));

/**
 * Los datos de siempre (los mismos de la consulta), cada uno con sus opciones. «Qué es» sale del catálogo de tipos de
 * inmueble, con el valor que ya tiene aunque esté desactivado; las demás preguntas siguen fijas (etapa 12, paso 4).
 */
const hechos = (cat: LectorCatalogos, a: Asunto) => [
  { clave: "que_quiere", etiqueta: "Qué quiere", opciones: op(QUIERE, NOMBRE_QUIERE) },
  { clave: "de_quien", etiqueta: "De quién es", opciones: op(DE_QUIEN, NOMBRE_DE_QUIEN) },
  { clave: "tipo", etiqueta: "Qué es", opciones: cat.opciones("tipo_inmueble", hechoTexto(a, "tipo")) },
  { clave: "ocupa", etiqueta: "Quién lo ocupa", opciones: op(OCUPA, NOMBRE_OCUPA) },
  { clave: "escritura", etiqueta: "Hay escritura", opciones: op(SI_NO, NOMBRE_SI_NO) },
];
const hechoTexto = (a: Asunto, clave: string) => { const v = hechoDe(a, clave); return typeof v === "string" ? v : null; };

/** Lo anotado en Situación manda; si todavía no se anota nada, se ve lo que se dijo en la consulta. */
export function hechoDe(a: Asunto, clave: string): string | string[] | null {
  const p = a.situacion_puntos.find((x) => x.clase === "hecho" && x.clave === clave);
  if (p) return p.valor;
  const d = (a.datos_consulta ?? {}) as DatosConsulta & Record<string, unknown>;
  const v = d[clave as keyof DatosConsulta];
  return typeof v === "string" || Array.isArray(v) ? (v as string | string[]) : null;
}

/** El resumen del renglón: los tres primeros hechos, en palabras. */
export function resumenSituacion(a: Asunto, cat: LectorCatalogos): string {
  const partes: string[] = [];
  for (const h of hechos(cat, a)) {
    const v = hechoDe(a, h.clave);
    const o = h.opciones.find((x) => x.valor === v);
    if (o) partes.push(h.clave === "escritura" ? (v === "si" ? "Con escritura" : v === "no" ? "Sin escritura" : "Escritura: no sabe") : o.etiqueta);
  }
  const falta = a.situacion_puntos.filter((p) => p.clase === "por_averiguar" && !p.resuelto_el).length;
  return [...partes.slice(0, 3), falta ? `${falta} por averiguar` : ""].filter(Boolean).join(" · ") || "Lo que se sabe y lo que falta";
}

function Averiguar({ a, p, hacer }: { a: Asunto; p: PuntoSituacion; hacer: Hacer }) {
  const resuelto = Boolean(p.resuelto_el);
  return (
    <div className="as-t" data-est={resuelto ? "hecha" : "pendiente"}>
      <button type="button" className="as-ckb" aria-label={`${resuelto ? "Desmarcar" : "Ya se sabe"}: ${p.texto}`}
        onClick={() => void hacer(() => cambiar(a.id, "situacion", { id: p.id, version: p.version, resuelto: !resuelto }), resuelto ? "Otra vez por averiguar" : "Ya se sabe")}>
        <span className="as-ck as-ck-cu">{resuelto ? <Icono nombre="ok" tamano={12} /> : null}</span>
      </button>
      <span className="as-tb"><span className="as-n">{p.texto}</span>{p.tarea_id ? <span className="as-m">Ya está en el plan</span> : null}</span>
      {!resuelto && !p.tarea_id ? (
        <button type="button" className="as-btn as-gho" title="Pasarlo al plan como tarea"
          onClick={() => void hacer(() => cambiar(a.id, "situacion", { id: p.id, version: p.version, a_plan: true }), "Quedó en el plan")}>
          <Icono nombre="lista" tamano={15} /><span className="as-ocultar-tel">Hacer tarea</span>
        </button>
      ) : null}
      <button type="button" className="as-btn as-gho as-ico" aria-label={`Quitar: ${p.texto}`}
        onClick={() => void hacer(() => cambiar(a.id, "situacion", { id: p.id, version: p.version, quitar: true }), "Quitado")}>
        <Icono nombre="x" tamano={15} />
      </button>
    </div>
  );
}

/** Situación (boceto): lo que se sabe del caso, en listas, y lo que falta averiguar, que se vuelve tarea con un toque. */
export function Situacion({ a, hacer }: { a: Asunto; hacer: Hacer }) {
  const cat = useCatalogos();
  const [nuevo, setNuevo] = useState("");
  const [conto, setConto] = useState(a.situacion);
  const poner = (clave: string, valor: string | string[] | null, aviso: string) =>
    hacer(() => agregar(a.id, "situacion", { clase: "hecho", clave, valor }), aviso);
  const debe = hechoDe(a, "debe");
  const averiguar = a.situacion_puntos.filter((p) => p.clase === "por_averiguar");
  return (
    <div className="as-form">
      <div className="as-card as-pad">
        <div className="as-g2">
          {hechos(cat, a).map((h) => {
            const v = hechoDe(a, h.clave);
            return (
              <Desplegable key={h.clave} etiqueta={h.etiqueta} valor={typeof v === "string" ? v : ""} vacio="Sin dato" opciones={h.opciones}
                alElegir={(x) => void poner(h.clave, x || null, `${h.etiqueta}: ${h.opciones.find((o) => o.valor === x)?.etiqueta.toLowerCase() ?? "sin dato"}`)} />
            );
          })}
          <ElegirVarios etiqueta="Qué debe" valores={Array.isArray(debe) ? debe.filter((x): x is (typeof DEBE)[number] => (DEBE as readonly string[]).includes(x)) : []}
            opciones={op(DEBE, NOMBRE_DEBE)} vacio="Sin dato" exclusivas={["nada", "no_sabe"]} alCambiar={(v) => void poner("debe", v, "Qué debe: anotado")} />
        </div>
      </div>

      <div className="as-card as-pad as-form">
        <label className="pn-campo">Lo que contó
          <textarea className="as-inp as-inp-borde as-area" rows={3} value={conto} maxLength={20000} onChange={(e) => setConto(e.target.value)}
            onBlur={() => { if (conto !== a.situacion) void hacer(() => cambiarAsunto(a, { situacion: conto }), "Guardado"); }}
            placeholder="Lo que contó en la llamada y lo que se ha sabido" />
        </label>
      </div>

      <p className="as-sub as-sub-fila"><span><Icono nombre="bus" tamano={15} /> Por averiguar</span><span className="as-m">{averiguar.filter((p) => !p.resuelto_el).length || ""}</span></p>
      <div className="as-card">
        {averiguar.map((p) => <Averiguar key={p.id} a={a} p={p} hacer={hacer} />)}
        <form className="as-pad" onSubmit={(e) => {
          e.preventDefault();
          const t = nuevo.trim();
          if (!t) return;
          setNuevo("");
          void hacer(() => agregar(a.id, "situacion", { clase: "por_averiguar", texto: t }));
        }}>
          <input className="as-inp as-inp-borde" value={nuevo} maxLength={500} onChange={(e) => setNuevo(e.target.value)} placeholder="Algo más que falta saber" aria-label="Algo más que falta saber" />
        </form>
      </div>
    </div>
  );
}
