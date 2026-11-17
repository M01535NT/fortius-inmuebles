"use client";
import { useId, useRef, useState } from "react";

import { Boton } from "@/components/panel/kit/boton";
import { Campo } from "@/components/panel/kit/campo";
import { Desplegable, DesplegableFecha } from "@/components/panel/kit/desplegable";
import { Checkbox } from "@/components/panel/ui/checkbox";
import type { Cliente } from "@/lib/backend/contracts";
import { diaLargo } from "@/lib/panel/calendario";
import {
  avisosDeDatos, buscarDuplicado, CANALES, datosDe, faltaParaEditar, faltaParaPersona, MOTIVOS,
  type Canal, type DatosEditables, type DatosNuevaPersona, type Motivo,
} from "@/lib/panel/datos/personas-acciones";

/** Aviso de duplicado: avisa y ofrece abrir la ficha que ya existe; no frena. */
function AvisoDuplicado({ persona, alAbrir }: { persona: Cliente; alAbrir: (id: string) => void }) {
  return (
    <div role="status" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", background: "var(--warning-soft)", border: "1px solid var(--warning)", borderRadius: "var(--r-lg)", padding: "8px 12px" }}>
      <span style={{ flex: 1, minWidth: 180 }}>Ya está en Personas: <strong>{persona.nombre}</strong>{persona.telefono ? ` · ${persona.telefono}` : ""}</span>
      <Boton variante="texto" onClick={() => alAbrir(persona.id)}>Abrir su ficha</Boton>
    </div>
  );
}

/** Casilla «Persona moral»: una empresa firma con razón social, RFC de 12 y representante legal. */
function CasillaMoral({ marcada, alCambiar }: { marcada: boolean; alCambiar: (v: boolean) => void }) {
  const id = useId();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 44 }}>
      <Checkbox id={id} checked={marcada} onCheckedChange={(v) => alCambiar(v === true)} />
      <label htmlFor={id} style={{ display: "flex", flexDirection: "column", gap: 2, cursor: "pointer" }}>
        <span style={{ fontSize: 15, fontWeight: 500 }}>Persona moral</span>
        <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>Es una empresa: firma con razón social y representante legal</span>
      </label>
    </div>
  );
}

/** «Nueva persona»: lo mínimo del boceto. Lo demás se completa después en «Datos». */
export function FormularioPersona({ personas, hoy, ocupado, nombreInicial = "", alGuardar, alAbrirExistente, alCancelar }: {
  personas: Cliente[]; hoy: Date; ocupado: boolean; nombreInicial?: string;
  alGuardar: (d: DatosNuevaPersona) => void; alAbrirExistente: (id: string) => void; alCancelar?: () => void;
}) {
  const [d, setD] = useState<DatosNuevaPersona>({ nombre: nombreInicial, telefono: "", email: "", motivo: "compra", canal: "whatsapp", accion: "", fecha: null, moral: false });
  const [intento, setIntento] = useState(false);
  const raiz = useRef<HTMLFormElement>(null);
  const falta = faltaParaPersona(d);
  const duplicado = buscarDuplicado(personas, d);
  const error = (campo: string) => (intento && falta?.campo === campo ? falta.texto : undefined);
  return (
    <form
      ref={raiz}
      noValidate
      style={{ display: "grid", gap: 12, marginTop: 8 }}
      onSubmit={(e) => {
        e.preventDefault();
        setIntento(true);
        if (!falta) { alGuardar(d); return; }
        raiz.current?.querySelector<HTMLInputElement>(`[data-campo="${falta.campo}"]`)?.focus();
      }}
    >
      <Campo etiqueta={d.moral ? "Nombre de la empresa" : "Nombre"} data-campo="nombre" autoComplete="off" value={d.nombre} maxLength={160} onChange={(e) => setD({ ...d, nombre: e.target.value })} error={error("nombre")} />
      <CasillaMoral marcada={Boolean(d.moral)} alCambiar={(moral) => setD({ ...d, moral })} />
      <Campo etiqueta="Teléfono" data-campo="telefono" type="tel" inputMode="tel" autoComplete="off" value={d.telefono} maxLength={40} onChange={(e) => setD({ ...d, telefono: e.target.value })} error={error("telefono")} />
      <Campo etiqueta="Correo (opcional)" data-campo="email" type="email" autoComplete="off" value={d.email} maxLength={160} onChange={(e) => setD({ ...d, email: e.target.value })} error={error("email")} />
      {duplicado ? <AvisoDuplicado persona={duplicado} alAbrir={alAbrirExistente} /> : null}
      <Desplegable<Motivo> etiqueta="Motivo" valor={d.motivo} opciones={MOTIVOS} alElegir={(motivo) => { if (motivo) setD({ ...d, motivo }); }} />
      <Desplegable<Canal> etiqueta="Prefiere que le contacten por" valor={d.canal} opciones={CANALES} alElegir={(canal) => { if (canal) setD({ ...d, canal }); }} />
      <Campo etiqueta="En qué quedaron" data-campo="accion" placeholder="Ej. mandarle opciones en Otay" value={d.accion} maxLength={160} onChange={(e) => setD({ ...d, accion: e.target.value })} error={error("accion")} />
      <DesplegableFecha valor={d.fecha} alElegir={(fecha) => setD({ ...d, fecha })} hoy={hoy} etiquetaCalendario="Volver a contactar el" />
      <p className="pn-sub" style={{ margin: 0 }}>{d.fecha ? `Volver a contactar el ${diaLargo(d.fecha)}. ` : "Sin fecha: queda «Sin seguimiento». "}Queda a tu nombre.</p>
      <div style={{ display: "grid", gridTemplateColumns: alCancelar ? "minmax(0, 1fr) minmax(0, 2fr)" : "1fr", gap: 8 }}>
        {alCancelar ? <Boton variante="secundario" onClick={alCancelar}>Cancelar</Boton> : null}
        <Boton type="submit" deshabilitado={ocupado}>{duplicado ? "Guardar de todos modos" : "Guardar persona"}</Boton>
      </div>
    </form>
  );
}

/** «Editar datos»: contacto y, para contratos, estado civil, domicilio, identificación, CURP y RFC. */
export function EditarDatosPersona({ persona, personas, ocupado, alGuardar, alCancelar, alAbrirExistente }: {
  persona: Cliente; personas: Cliente[]; ocupado: boolean;
  alGuardar: (d: DatosEditables) => void; alCancelar: () => void; alAbrirExistente: (id: string) => void;
}) {
  const [d, setD] = useState<DatosEditables>(() => datosDe(persona));
  const [intento, setIntento] = useState(false);
  const raiz = useRef<HTMLFormElement>(null);
  const falta = faltaParaEditar(d);
  const avisos = avisosDeDatos(d);
  const duplicado = buscarDuplicado(personas, d, persona.id);
  const error = (campo: string) => (intento && falta?.campo === campo ? falta.texto : undefined);
  const campo = (k: Exclude<keyof DatosEditables, "moral">) => ({ value: d[k], onChange: (e: React.ChangeEvent<HTMLInputElement>) => setD({ ...d, [k]: e.target.value }) });
  return (
    <form
      ref={raiz}
      noValidate
      style={{ display: "grid", gap: 12, marginTop: 8 }}
      onSubmit={(e) => {
        e.preventDefault();
        setIntento(true);
        if (!falta) { alGuardar(d); return; }
        raiz.current?.querySelector<HTMLInputElement>(`[data-campo="${falta.campo}"]`)?.focus();
      }}
    >
      <h3 className="pn-grupo" style={{ margin: 0, padding: 0 }}>Contacto</h3>
      <Campo etiqueta="Nombre" data-campo="nombre" autoComplete="off" maxLength={160} {...campo("nombre")} error={error("nombre")} />
      <Campo etiqueta="Teléfono" data-campo="telefono" type="tel" inputMode="tel" autoComplete="off" maxLength={40} {...campo("telefono")} error={error("telefono")} />
      <Campo etiqueta="Correo" data-campo="email" type="email" autoComplete="off" maxLength={160} {...campo("email")} error={error("email")} />
      {duplicado ? <AvisoDuplicado persona={duplicado} alAbrir={alAbrirExistente} /> : null}
      <Desplegable<Motivo> etiqueta="Motivo" valor={d.motivo} opciones={MOTIVOS} alElegir={(motivo) => { if (motivo) setD({ ...d, motivo }); }} />
      <Desplegable<Canal> etiqueta="Prefiere que le contacten por" valor={d.canal} opciones={CANALES} vacio="Sin preferencia" alElegir={(canal) => setD({ ...d, canal })} />
      <h3 className="pn-grupo" style={{ margin: "8px 0 0", padding: 0 }}>Para contratos</h3>
      <CasillaMoral marcada={d.moral} alCambiar={(moral) => setD({ ...d, moral })} />
      {d.moral ? null : <Campo etiqueta="Estado civil" placeholder="Ej. casado por sociedad conyugal" autoComplete="off" maxLength={120} {...campo("estadoCivil")} />}
      <Campo etiqueta={d.moral ? "Domicilio fiscal" : "Domicilio"} autoComplete="off" maxLength={400} {...campo("domicilio")} />
      {d.moral ? null : <Campo etiqueta="Identificación" placeholder="Ej. INE vigente hasta 2031" autoComplete="off" maxLength={160} {...campo("identificacion")} />}
      {d.moral ? null : <Campo etiqueta="CURP" autoComplete="off" spellCheck={false} maxLength={18} style={{ textTransform: "uppercase" }} {...campo("curp")}
        ayuda={avisos.curp ?? (d.curp ? `${d.curp.trim().length} de 18` : undefined)} />}
      <Campo etiqueta="RFC" autoComplete="off" spellCheck={false} maxLength={13} style={{ textTransform: "uppercase" }} {...campo("rfc")}
        ayuda={d.moral ? (d.rfc.trim() && d.rfc.trim().length !== 12 ? `Persona moral: 12 caracteres; van ${d.rfc.trim().length}.` : d.rfc ? `${d.rfc.trim().length} de 12` : "Persona moral: 12 caracteres")
          : avisos.rfc ?? (d.rfc ? `${d.rfc.trim().length} de 13` : undefined)} />
      <div style={{ display: "flex", gap: 8 }}>
        <Boton type="submit" deshabilitado={ocupado} style={{ flex: 1 }}>Guardar cambios</Boton>
        <Boton variante="texto" onClick={alCancelar}>Cancelar</Boton>
      </div>
    </form>
  );
}
