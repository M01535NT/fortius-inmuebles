"use client";
import { useId, useState } from "react";

import { Icono } from "@/components/panel/icons";
import { Desplegable } from "@/components/panel/kit/desplegable";
import { Interruptor } from "@/components/panel/kit/segmentado";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/panel/ui/dropdown-menu";
import {
  agregar, cambiar, ESTADOS_INTERESADO, fechaCorta, iniciales, NOMBRE_INTERESADO, NOMBRE_RESPUESTA, RESPUESTAS_OFERTA, sumarDias,
  type Asunto, type Interesado, type Moneda, type Oferta, type Tarea,
} from "@/lib/panel/asuntos/api";
import { precioTexto } from "@/lib/backend/inmuebles-contrato";

import { dinero, DialogoMensaje, ElegirVarios, enlaceWhatsApp, HORAS, leerMonto, primerNombre, useFoco, type Hacer } from "./comun";
import { MONEDA_OP } from "./honorarios";
import { Pildora } from "./pildora";

const visitaDe = (a: Asunto, i: Interesado): Tarea | undefined =>
  a.tareas.find((t) => t.clase === "visita" && t.interesado_id === i.id && t.estado === "pendiente");

export function resumenInteresados(a: Asunto): string {
  const vivos = a.interesados.filter((i) => i.estado !== "descartado");
  if (!vivos.length) return a.interesados.length ? "Todos descartados" : "Nadie todavía";
  const visitas = vivos.filter((i) => visitaDe(a, i)).length;
  const ofertas = vivos.filter((i) => i.ofertas.length).length;
  return [`${vivos.length} interesado${vivos.length > 1 ? "s" : ""}`, visitas ? `${visitas} con visita` : "", ofertas ? `${ofertas} con oferta` : ""].filter(Boolean).join(" · ");
}

function RenglonOferta({ a, o, hacer }: { a: Asunto; o: Oferta; hacer: Hacer }) {
  const [contra, setContra] = useState(o.contraoferta_monto ? String(o.contraoferta_monto) : "");
  const inm = a.inmuebles.find((x) => x.id === o.inmueble_id);
  return (
    <div className="as-ren">
      <Icono nombre="pago" tamano={17} />
      <span className="as-ren-c">
        <b>Oferta de {dinero(o.monto, o.moneda)}</b>
        <span>{[fechaCorta(o.fecha), a.inmuebles.length > 1 ? inm?.nombre : ""].filter(Boolean).join(" · ")}{o.respuesta === "contraoferta" && o.contraoferta_monto ? ` · contraoferta ${dinero(o.contraoferta_monto, o.moneda)}` : ""}</span>
      </span>
      <Pildora etiqueta="Respuesta" valor={o.respuesta} opciones={RESPUESTAS_OFERTA.map((r) => ({ valor: r, etiqueta: NOMBRE_RESPUESTA[r] }))}
        alElegir={(v) => { if (v !== o.respuesta) void hacer(() => cambiar(a.id, "ofertas", { id: o.id, version: o.version, respuesta: v }), NOMBRE_RESPUESTA[v]); }} />
      {o.respuesta === "contraoferta" && !o.contraoferta_monto ? (
        <form onSubmit={(e) => { e.preventDefault(); const n = leerMonto(contra); if (n) void hacer(() => cambiar(a.id, "ofertas", { id: o.id, version: o.version, contraoferta_monto: n }), "Contraoferta anotada"); }}>
          <input className="as-inp as-inp-borde as-corto" inputMode="decimal" value={contra} onChange={(e) => setContra(e.target.value)} placeholder="Contraoferta" aria-label="Monto de la contraoferta" />
        </form>
      ) : null}
    </div>
  );
}

function Tarjeta({ a, i, hacer }: { a: Asunto; i: Interesado; hacer: Hacer }) {
  const id = useId();
  const visita = visitaDe(a, i);
  const [fecha, setFecha] = useState(visita?.fecha ?? "");
  const [hora, setHora] = useState(visita?.hora?.slice(0, 5) ?? "");
  const [oferta, setOferta] = useState("");
  const [moneda, setMoneda] = useState<Moneda>(a.inmuebles[0]?.moneda ?? "MXN");
  const [ficha, setFicha] = useState(false);
  const tel = i.telefono?.replace(/\D/g, "") ?? "";
  const suyos = a.inmuebles.filter((x) => i.inmuebles.includes(x.id));
  const deInteres = suyos.length ? suyos : a.inmuebles.slice(0, 1);
  const lugar = (visita?.inmueble_id && a.inmuebles.find((x) => x.id === visita.inmueble_id)) || deInteres[0];
  const ponerVisita = (f: string, h: string) => {
    if (!f) return;
    void hacer(() => cambiar(a.id, "interesados", { id: i.id, version: i.version, visita: { fecha: f, hora: h || null, inmueble_id: lugar?.id ?? null } }),
      `Visita: ${fechaCorta(f, h || null).toLowerCase()}`);
  };
  const origen = typeof window === "undefined" ? "" : window.location.origin;
  const textoFicha = `Hola ${primerNombre(i.nombre)}, le comparto ${deInteres.length > 1 ? "los inmuebles" : "el inmueble"} que platicamos:\n${deInteres
    .map((x) => `• ${[x.nombre, x.colonia, precioTexto(x.precio, x.moneda, x.operacion)].filter(Boolean).join(" · ")}${x.publicado && x.slug ? `\n  ${origen}/inventario/${x.slug}` : ""}`).join("\n")}`;

  return (
    <div className="as-card as-inter" data-est={i.estado}>
      <div className="as-ren">
        <span className="as-av" aria-hidden>{iniciales(i.nombre)}</span>
        <span className="as-ren-c"><b>{i.nombre}</b><span>{i.telefono ?? "Sin teléfono"}</span></span>
        <Pildora etiqueta="Cómo va" valor={i.estado} opciones={ESTADOS_INTERESADO.map((e) => ({ valor: e, etiqueta: NOMBRE_INTERESADO[e] }))}
          alElegir={(v) => { if (v !== i.estado) void hacer(() => cambiar(a.id, "interesados", { id: i.id, version: i.version, estado: v }), `${primerNombre(i.nombre)}: ${NOMBRE_INTERESADO[v].toLowerCase()}`); }} />
        <DropdownMenu>
          <DropdownMenuTrigger className="as-btn as-gho as-ico" aria-label={`Más de ${i.nombre}`}><Icono nombre="dots" tamano={18} /></DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-56">
            <DropdownMenuItem onSelect={() => setFicha(true)}><Icono nombre="chat" tamano={16} />Enviarle la ficha</DropdownMenuItem>
            {tel ? (
              <>
                <DropdownMenuItem asChild><a href={`tel:+${tel}`}><Icono nombre="tel" tamano={16} />Llamar</a></DropdownMenuItem>
                <DropdownMenuItem asChild><a href={enlaceWhatsApp("", i.telefono)} target="_blank" rel="noopener noreferrer"><Icono nombre="chat" tamano={16} />WhatsApp</a></DropdownMenuItem>
              </>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem peligro onSelect={() => void hacer(() => cambiar(a.id, "interesados", { id: i.id, version: i.version, quitar: true }), `Se quitó a ${i.nombre}`)}>
              <Icono nombre="bote" tamano={16} />Quitar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="as-pad as-form as-borde-arriba">
        <div className="as-g2">
          {a.inmuebles.length > 1 ? (
            <ElegirVarios etiqueta="Le interesa" valores={i.inmuebles} vacio="Elegir inmuebles" opciones={a.inmuebles.map((x) => ({ valor: x.id, etiqueta: x.nombre }))}
              alCambiar={(v) => void hacer(() => cambiar(a.id, "interesados", { id: i.id, version: i.version, inmuebles: v }), "Anotado")} />
          ) : null}
          <label className="pn-campo" htmlFor={`${id}-f`}>Visita
            <input id={`${id}-f`} type="date" className="as-inp as-inp-borde" value={fecha} min={sumarDias(-30)}
              onChange={(e) => { setFecha(e.target.value); if (e.target.value) ponerVisita(e.target.value, hora); }} />
          </label>
          <Desplegable etiqueta="Hora" valor={hora} vacio="Sin hora" opciones={HORAS} alElegir={(v) => { setHora(v); if (fecha) ponerVisita(fecha, v); }} />
        </div>
        {visita ? (
          <p className="as-m as-fila">
            <Icono nombre="cal" tamano={14} />Visita {fechaCorta(visita.fecha, visita.hora?.slice(0, 5)).toLowerCase()}{a.inmuebles.length > 1 && lugar ? ` · ${lugar.nombre}` : ""}
            <button type="button" className="as-btn as-gho" onClick={() => { setFecha(""); setHora(""); void hacer(() => cambiar(a.id, "interesados", { id: i.id, version: i.version, visita: null }), "Visita quitada"); }}>Quitar</button>
          </p>
        ) : null}
      </div>

      {i.ofertas.map((o) => <RenglonOferta key={o.id} a={a} o={o} hacer={hacer} />)}
      <form className="as-pad as-fila as-nw as-borde-arriba" onSubmit={(e) => {
        e.preventDefault();
        const n = leerMonto(oferta);
        if (!n) return;
        setOferta("");
        void hacer(() => agregar(a.id, "ofertas", { interesado_id: i.id, monto: n, moneda, inmueble_id: deInteres[0]?.id ?? null }), "Oferta anotada");
      }}>
        <input className="as-inp as-inp-borde as-crece" inputMode="decimal" value={oferta} maxLength={20} onChange={(e) => setOferta(e.target.value)} placeholder="Anotar oferta" aria-label="Monto de la oferta" />
        <Interruptor etiqueta="Moneda" sinEtiqueta opciones={MONEDA_OP} valor={moneda} alElegir={setMoneda} />
        {oferta.trim() ? <button type="submit" className="as-btn">Anotar</button> : null}
      </form>

      <DialogoMensaje abierto={ficha} titulo="Enviarle la ficha" para={i.telefono ? { ...PARA_VACIO, nombre: i.nombre, telefono: i.telefono } : null}
        inicial={textoFicha} alCerrar={() => setFicha(false)}
        alEnviar={() => { if (i.estado === "nuevo") void hacer(() => cambiar(a.id, "interesados", { id: i.id, version: i.version, estado: "en_contacto" })); }} />
    </div>
  );
}

const PARA_VACIO = {
  id: "", persona_id: "", papel: "contacto" as const, principal: false, nota: "", version: 1,
  nombre: "", clase: "persona" as const, fallecida: false, telefono: null as string | null, correo: null, no_contactar: false,
};

/** Interesados (boceto): quién preguntó, qué le interesa, su visita con día y hora y sus ofertas. */
export function Interesados({ a, foco, hacer }: { a: Asunto; foco: boolean; hacer: Hacer }) {
  const id = useId();
  const ref = useFoco<HTMLInputElement>(foco);
  const [nombre, setNombre] = useState("");
  const [pais, setPais] = useState("+52");
  const [numero, setNumero] = useState("");
  const [descartados, setDescartados] = useState(false);
  const vivos = a.interesados.filter((i) => i.estado !== "descartado");
  const fuera = a.interesados.filter((i) => i.estado === "descartado");
  return (
    <div className="as-form">
      {vivos.map((i) => <Tarjeta key={i.id} a={a} i={i} hacer={hacer} />)}
      {!a.interesados.length ? <p className="as-m">Nadie todavía.</p> : null}
      {fuera.length ? (
        <>
          <button type="button" className="as-btn as-gho" aria-expanded={descartados} onClick={() => setDescartados(!descartados)}>
            <Icono nombre="down" tamano={14} />{fuera.length} descartado{fuera.length > 1 ? "s" : ""}
          </button>
          {descartados ? fuera.map((i) => <Tarjeta key={i.id} a={a} i={i} hacer={hacer} />) : null}
        </>
      ) : null}

      <form className="as-card as-pad as-form" onSubmit={(e) => {
        e.preventDefault();
        const t = nombre.trim();
        if (!t) return;
        setNombre(""); setNumero("");
        void hacer(() => agregar(a.id, "interesados", {
          nombre: t, ...(numero.trim() ? { telefono: { pais, numero } } : {}), inmuebles: a.inmuebles.length === 1 ? [a.inmuebles[0].id] : [], es_ejemplo: a.es_ejemplo,
        }), `Interesado: ${t}`).then(() => ref.current?.focus());
      }}>
        <p className="as-sub">Agregar interesado</p>
        <div className="as-g2">
          <label className="pn-campo" htmlFor={`${id}-n`}>Nombre
            <input ref={ref} id={`${id}-n`} className="as-inp as-inp-borde" value={nombre} maxLength={160} onChange={(e) => setNombre(e.target.value)} />
          </label>
          <div className="pn-campo">
            <label htmlFor={`${id}-t`}>Teléfono</label>
            <span className="as-tel">
              <input aria-label="Clave del país" className="as-inp as-inp-borde as-clave" value={pais} maxLength={5} onChange={(e) => setPais(e.target.value)} />
              <input id={`${id}-t`} className="as-inp as-inp-borde" inputMode="tel" value={numero} maxLength={30} onChange={(e) => setNumero(e.target.value)} />
            </span>
          </div>
        </div>
        <button type="submit" className="as-btn as-pri" aria-disabled={!nombre.trim()}><Icono nombre="mas" tamano={16} />Agregar</button>
      </form>
    </div>
  );
}
