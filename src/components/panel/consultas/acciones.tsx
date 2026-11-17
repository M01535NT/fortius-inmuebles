"use client";
import { useState } from "react";

import { Boton } from "@/components/panel/kit/boton";
import { Campo } from "@/components/panel/kit/campo";
import { Desplegable, DesplegableFecha } from "@/components/panel/kit/desplegable";
import type { Lead, LeadCanal } from "@/lib/domain/records";
import { diaLargo } from "@/lib/panel/calendario";
import { CANALES_A_MANO, faltaParaAnotar, NOMBRE_CIERRE, type ComoCierra } from "@/lib/panel/datos/consultas-acciones";

/** Siguiente contacto: cuándo volver a buscarla y qué hacer. Se ordena En seguimiento por esta fecha. */
export function SiguienteContacto({ lead, hoy, ocupado, alGuardar }: {
  lead: Lead; hoy: Date; ocupado: boolean; alGuardar: (fecha: string | null, accion: string) => void;
}) {
  const [fecha, setFecha] = useState<string | null>(lead.perfil?.proximoContacto ?? null);
  const [accion, setAccion] = useState(lead.perfil?.proximaAccion ?? "");
  const cambio = fecha !== (lead.perfil?.proximoContacto ?? null) || accion.trim() !== (lead.perfil?.proximaAccion ?? "");
  return (
    <section style={{ display: "grid", gap: 8 }}>
      <h3 className="pn-grupo" style={{ margin: 0 }}>Volver a contactar</h3>
      <DesplegableFecha valor={fecha} alElegir={setFecha} hoy={hoy} sinFecha={fecha ? null : "Elige cuándo"} etiquetaCalendario="Volver a contactar el" />
      <Campo etiqueta="Qué hacer" placeholder="Ej. llamar para agendar la visita" value={accion} maxLength={160} onChange={(e) => setAccion(e.target.value)} />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Boton variante="secundario" deshabilitado={!cambio || ocupado} onClick={() => alGuardar(fecha, accion)} style={{ flex: 1 }}>
          {!cambio && fecha ? `Guardado para el ${diaLargo(fecha)}` : fecha ? `Guardar para el ${diaLargo(fecha)}` : "Elige cuándo"}
        </Boton>
        {lead.perfil?.proximoContacto ? <Boton variante="texto" deshabilitado={ocupado} onClick={() => { setFecha(null); setAccion(""); alGuardar(null, ""); }}>Quitar fecha</Boton> : null}
      </div>
    </section>
  );
}

/** Notas de la consulta: lo que se habló. Las más nuevas arriba. */
export function NotasConsulta({ lead, ocupado, alAnotar }: { lead: Lead; ocupado: boolean; alAnotar: (texto: string) => Promise<boolean> }) {
  const [texto, setTexto] = useState("");
  const notas = [...lead.notas].reverse();
  return (
    <section style={{ display: "grid", gap: 8 }}>
      <h3 className="pn-grupo" style={{ margin: 0 }}>Notas</h3>
      <form
        style={{ display: "flex", gap: 8, alignItems: "flex-end" }}
        onSubmit={async (e) => { e.preventDefault(); if (await alAnotar(texto)) setTexto(""); }}
      >
        <div style={{ flex: 1 }}><Campo etiqueta="Agregar nota" placeholder="Qué se habló o qué quedó pendiente" value={texto} maxLength={2000} onChange={(e) => setTexto(e.target.value)} /></div>
        <Boton variante="secundario" type="submit" deshabilitado={!texto.trim() || ocupado}>Anotar</Boton>
      </form>
      {notas.length ? (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
          {notas.slice(0, 20).map((n) => (
            <li key={n.id} style={{ display: "grid", gap: 2 }}>
              <span style={{ whiteSpace: "pre-line" }}>{n.texto}</span>
              <span className="pn-sub" style={{ margin: 0, fontSize: 13 }}>{fechaCorta(n.fecha)}</span>
            </li>
          ))}
        </ul>
      ) : <p className="pn-sub" style={{ margin: 0 }}>Sin notas todavía.</p>}
    </section>
  );
}

/** Cerrar: elegir cómo terminó y, si se quiere, por qué. Se puede reabrir. */
export function CerrarConsulta({ ocupado, alCerrar }: { ocupado: boolean; alCerrar: (como: ComoCierra, motivo: string) => void }) {
  const [abierto, setAbierto] = useState(false);
  const [como, setComo] = useState<ComoCierra>("sin_operacion");
  const [motivo, setMotivo] = useState("");
  if (!abierto) return <Boton variante="texto" onClick={() => setAbierto(true)}>Cerrar consulta…</Boton>;
  return (
    <section style={{ display: "grid", gap: 8, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
      <h3 className="pn-grupo" style={{ margin: 0 }}>Cerrar consulta</h3>
      <Desplegable etiqueta="Cómo terminó" valor={como} alElegir={(v) => { if (v) setComo(v); }} opciones={[
        { valor: "sin_operacion", etiqueta: NOMBRE_CIERRE.sin_operacion },
        { valor: "no_es_cliente", etiqueta: NOMBRE_CIERRE.no_es_cliente },
      ]} />
      <Campo etiqueta="Por qué (opcional)" placeholder={como === "no_es_cliente" ? "Ej. número equivocado" : "Ej. compró con otra inmobiliaria"} value={motivo} maxLength={300} onChange={(e) => setMotivo(e.target.value)} />
      <div style={{ display: "flex", gap: 8 }}>
        <Boton variante="secundario" deshabilitado={ocupado} onClick={() => alCerrar(como, motivo)} style={{ flex: 1 }}>Cerrar como «{NOMBRE_CIERRE[como]}»</Boton>
        <Boton variante="texto" onClick={() => setAbierto(false)}>Cancelar</Boton>
      </div>
    </section>
  );
}

/** «Anotar una consulta»: para llamadas y visitas en persona. */
export function FormularioAnotar({ ocupado, alGuardar }: {
  ocupado: boolean; alGuardar: (d: { nombre: string; telefono: string; email: string; canal: LeadCanal; mensaje: string }) => void;
}) {
  const [d, setD] = useState({ nombre: "", telefono: "", email: "", canal: "llamada" as LeadCanal, mensaje: "" });
  const [intento, setIntento] = useState(false);
  const falta = faltaParaAnotar(d);
  return (
    <form
      style={{ display: "grid", gap: 12, marginTop: 8 }}
      onSubmit={(e) => {
        e.preventDefault();
        setIntento(true);
        if (!falta) { alGuardar(d); return; }
        // Lleva el foco al primer dato que falta, para corregirlo sin buscarlo.
        const campo = e.currentTarget.querySelector<HTMLInputElement>(d.nombre.trim() ? 'input[type="tel"]' : 'input:not([type="tel"]):not([type="email"])');
        campo?.focus();
      }}
      noValidate
    >
      <Desplegable etiqueta="Por dónde llegó" valor={d.canal} alElegir={(canal) => { if (canal) setD({ ...d, canal }); }} opciones={CANALES_A_MANO} />
      <Campo etiqueta="Nombre" autoComplete="off" value={d.nombre} maxLength={160} onChange={(e) => setD({ ...d, nombre: e.target.value })}
        error={intento && !d.nombre.trim() ? "Escribe el nombre." : undefined} />
      <Campo etiqueta="Teléfono" type="tel" inputMode="tel" autoComplete="off" value={d.telefono} maxLength={40} onChange={(e) => setD({ ...d, telefono: e.target.value })}
        error={intento && d.nombre.trim() && falta ? falta : undefined} />
      <Campo etiqueta="Correo (opcional)" type="email" autoComplete="off" value={d.email} maxLength={160} onChange={(e) => setD({ ...d, email: e.target.value })} />
      <Campo etiqueta="Qué busca (opcional)" placeholder="Ej. casa de 3 recámaras en Otay" value={d.mensaje} maxLength={2000} onChange={(e) => setD({ ...d, mensaje: e.target.value })} />
      <p className="pn-sub" style={{ margin: 0 }}>Queda en seguimiento a tu nombre.</p>
      <Boton type="submit" bloque deshabilitado={ocupado}>Guardar consulta</Boton>
    </form>
  );
}

function fechaCorta(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("es-MX", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}
