"use client";

import * as React from "react";
import { Field, inputClass, selectClass, textareaClass } from "./ui";
import { db, useCollection, type Lead } from "@/lib/admin/store";
import { leadProfileSchema, LEAD_PROFILE_OPTIONS, type LeadProfile } from "@/lib/lead-profile";

const numericFields = ["presupuestoMin", "presupuestoMax", "presupuestoDeclarado", "capitalDeclarado", "precioObjetivo", "superficieMin", "superficieMax", "superficieTerreno", "superficieConstruccion", "recamaras", "estacionamientos", "recamarasInmueble", "estacionamientosInmueble"] as const;
const textFields = ["operacion", "uso", "moneda", "formaPago", "tipoCredito", "estadoCredito", "origenIngresos", "requisitos", "caracteristicas", "plazo", "proximoContacto", "estrategiaInversion", "horizonteInversion", "criteriosInversion"] as const;

export function readLeadFields(form: HTMLFormElement, base?: Pick<Lead, "perfil">) {
  const data = new FormData(form);
  const profile: Record<string, unknown> = { ...base?.perfil };
  const operationChanged = !!base && String(data.get("perfil.operacion") ?? "") !== (base.perfil?.operacion ?? "");
  const paymentChanged = !!base && data.has("perfil.formaPago") && String(data.get("perfil.formaPago") ?? "") !== (base.perfil?.formaPago ?? "");
  for (const key of numericFields) {
    if (!data.has(`perfil.${key}`) && !operationChanged) continue;
    const value = String(data.get(`perfil.${key}`) ?? "").trim();
    profile[key] = value === "" ? undefined : Number(value);
  }
  for (const key of textFields) {
    if (!data.has(`perfil.${key}`) && !operationChanged && !(paymentChanged && (key === "tipoCredito" || key === "estadoCredito"))) continue;
    profile[key] = String(data.get(`perfil.${key}`) ?? "").trim() || undefined;
  }
  const result = leadProfileSchema.safeParse(profile);
  if (!result.success) throw new Error(result.error.issues.map(issue => issue.message).join(". "));
  const optional = (key: string) => String(data.get(key) ?? "").trim() || undefined;
  if(!String(data.get("telefono")??"").trim()&&!optional("email"))throw new Error("Registra teléfono o correo electrónico");
  return {
    nombre: String(data.get("nombre") ?? "").trim(), telefono: String(data.get("telefono") ?? "").trim(),
    email: optional("email"), zona: optional("zona"), tipoPropiedad: optional("tipoPropiedad"),
    propiedadSlug: optional("propiedadSlug"), asesorId: optional("asesorId"), mensaje: optional("mensaje"),
    perfil: result.data,
  };
}

export function LeadFields({ lead, nombreRef }: { lead?: Pick<Lead, "nombre" | "telefono" | "email" | "perfil" | "zona" | "tipoPropiedad" | "propiedadSlug" | "asesorId" | "mensaje">; nombreRef?: React.Ref<HTMLInputElement> }) {
  const prefix = React.useId();
  const propiedades = useCollection(db.propiedades);
  const asesores = useCollection(db.asesores);
  const perfil = lead?.perfil ?? {};
  const [operacion, setOperacion] = React.useState(perfil.operacion ?? "");
  const [formaPago, setFormaPago] = React.useState(perfil.formaPago ?? "");
  const renting = operacion === "rentar" || operacion === "arrendar";
  const owner = operacion === "vender" || operacion === "arrendar";
  const buyer = operacion === "comprar" || operacion === "";
  const id = (name: string) => `${prefix}-${name}`;
  const text = (name: string, label: string, value?: string, type = "text", maxLength = 500) => (
    <Field label={label} htmlFor={id(name)}><input id={id(name)} name={name} type={type} defaultValue={value ?? ""} maxLength={maxLength} className={inputClass} /></Field>
  );
  const choice = (name: keyof typeof LEAD_PROFILE_OPTIONS, label: string) => (
    <Field label={label} htmlFor={id(name)}><select id={id(name)} name={`perfil.${name}`} defaultValue={perfil[name] ?? ""} className={selectClass} onChange={name === "operacion" ? e => setOperacion(e.target.value as typeof operacion) : name === "formaPago" ? e => setFormaPago(e.target.value as typeof formaPago) : undefined}>
      <option value="">Por confirmar</option>
      {Object.entries(LEAD_PROFILE_OPTIONS[name]).map(([value, title]) => <option key={value} value={value}>{title}</option>)}
    </select></Field>
  );
  const number = (name: typeof numericFields[number], label: string, max: number, step = "0.01") => (
    <Field label={label} htmlFor={id(name)}><input id={id(name)} name={`perfil.${name}`} type="number" min="0" max={max} step={step} inputMode={step === "1" ? "numeric" : "decimal"} defaultValue={perfil[name] ?? ""} className={inputClass} /></Field>
  );
  const types = { terreno: "Terreno", casa: "Casa", departamento: "Departamento", local: "Local", oficina: "Oficina", bodega: "Bodega", "nave-industrial": "Nave industrial", otro: "Otro" };
  return <div className="min-w-0 space-y-3" onInvalidCapture={event => {
    const input = event.target as HTMLElement;
    const section = input.closest("details");
    if (section) section.open = true;
  }}>
    <section className="min-w-0 rounded-lg border border-border p-4">
      <h2 className="text-base font-semibold">Contacto</h2>
      <p className="mt-1 text-sm text-muted-foreground">Registra el nombre y al menos un medio: teléfono o correo electrónico. Los demás datos se completan según el encargo.</p>
      <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
        <Field label="Nombre" htmlFor={id("nombre")}><input ref={nombreRef} id={id("nombre")} name="nombre" required maxLength={160} defaultValue={lead?.nombre ?? ""} autoComplete="name" className={inputClass} /></Field>
        <Field label="Teléfono" htmlFor={id("telefono")}><input id={id("telefono")} name="telefono" type="tel" maxLength={40} defaultValue={lead?.telefono ?? ""} autoComplete="tel" className={inputClass} /></Field>
        {text("email", "Correo electrónico", lead?.email, "email", 254)}
      </div>
    </section>
    <LeadSection title={owner ? "Inmueble que ofrece" : "Qué busca y características"}>
      {choice("operacion", "Operación")}{choice("uso", "Uso del inmueble")}
      <Field label="Tipo de inmueble" htmlFor={id("tipoPropiedad")}><select id={id("tipoPropiedad")} name="tipoPropiedad" defaultValue={lead?.tipoPropiedad ?? ""} className={selectClass}>
        <option value="">Por confirmar</option>
        {lead?.tipoPropiedad && !(lead.tipoPropiedad in types) ? <option value={lead.tipoPropiedad}>{lead.tipoPropiedad}</option> : null}
        {Object.entries(types).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select></Field>
      {text("zona", owner ? "Ubicación del inmueble" : "Zonas de interés", lead?.zona)}
      <Field label={owner ? "Inmueble del inventario" : "Inmueble de interés"} htmlFor={id("propiedadSlug")}><select id={id("propiedadSlug")} name="propiedadSlug" defaultValue={lead?.propiedadSlug ?? ""} className={selectClass}>
        <option value="">Sin inmueble específico</option>
        {lead?.propiedadSlug && !propiedades.some(p => p.slug === lead.propiedadSlug) ? <option value={lead.propiedadSlug}>{lead.propiedadSlug}</option> : null}
        {propiedades.map(p => <option key={p.slug} value={p.slug}>{p.codigo} · {p.titulo}</option>)}
      </select></Field>
      {owner ? <>
        {number("superficieTerreno", "Superficie de terreno (m²)", 1e9)}{number("superficieConstruccion", "Superficie construida (m²)", 1e9)}
        {number("recamarasInmueble", "Recámaras del inmueble", 1000, "1")}{number("estacionamientosInmueble", "Estacionamientos del inmueble", 1000, "1")}
        <Field label="Características y condiciones" htmlFor={id("caracteristicas")} className="sm:col-span-2"><textarea id={id("caracteristicas")} name="perfil.caracteristicas" rows={3} maxLength={20000} defaultValue={perfil.caracteristicas ?? ""} placeholder="Estado, equipamiento, disponibilidad, condiciones…" className={textareaClass} /></Field>
      </> : <>
        {number("superficieMin", "Superficie mínima (m²)", 1e9)}{number("superficieMax", "Superficie máxima (m²)", 1e9)}
        {number("recamaras", "Recámaras mínimas", 1000, "1")}{number("estacionamientos", "Estacionamientos mínimos", 1000, "1")}
        <Field label="Requisitos adicionales" htmlFor={id("requisitos")} className="sm:col-span-2"><textarea id={id("requisitos")} name="perfil.requisitos" rows={3} maxLength={20000} defaultValue={perfil.requisitos ?? ""} placeholder="Accesos, altura libre, patio, servicios, accesibilidad…" className={textareaClass} /></Field>
      </>}
    </LeadSection>
    <LeadSection title={owner ? (renting ? "Renta solicitada" : "Precio esperado") : renting ? "Presupuesto de renta" : "Presupuesto y financiamiento"}>
      <p className="text-sm text-muted-foreground sm:col-span-2">{owner ? renting ? "Monto mensual que espera recibir el propietario." : "Precio total de venta que espera el propietario." : renting ? "Presupuesto de renta mensual del interesado." : "Presupuesto total de compra del interesado."} Selecciona la moneda al capturar un monto.</p>
      {owner ? number("precioObjetivo", renting ? "Renta mensual esperada" : "Precio de venta esperado", 1e13) : <>
        {number("presupuestoMin", renting ? "Renta mensual mínima" : "Presupuesto mínimo", 1e13)}{number("presupuestoMax", renting ? "Renta mensual máxima" : "Presupuesto máximo", 1e13)}
      </>}
      {choice("moneda", "Moneda")}
      {buyer ? <>{choice("formaPago", "Forma de pago")}{(formaPago === "credito" || formaPago === "mixto") && <>{choice("tipoCredito", "Tipo de crédito")}{choice("estadoCredito", "Estado del crédito")}</>}{choice("origenIngresos", "Origen de ingresos")}</> : operacion === "rentar" ? choice("origenIngresos", "Origen de ingresos") : null}
    </LeadSection>
    {operacion==="invertir"&&<LeadSection title="Criterios de inversión">{number("capitalDeclarado","Capital declarado",1e13)}<Field label="Estrategia" htmlFor={id("estrategiaInversion")}><select id={id("estrategiaInversion")} name="perfil.estrategiaInversion" defaultValue={perfil.estrategiaInversion??""} className={selectClass}><option value="">Por confirmar</option><option value="renta">Renta</option><option value="reventa">Reventa</option><option value="mixta">Mixta</option><option value="por_definir">Por definir</option></select></Field>{text("perfil.horizonteInversion","Horizonte",perfil.horizonteInversion,"text",2000)}{text("perfil.criteriosInversion","Criterios y límites",perfil.criteriosInversion,"text",2000)}<p className="text-sm text-muted-foreground sm:col-span-2">El capital es declarado; los recursos, escenarios y riesgos se comprueban en el encargo. Invertir no obliga a registrar una compra.</p></LeadSection>}
    {["comprar","rentar"].includes(operacion)&&perfil.presupuestoDeclarado!==undefined&&<LeadSection title="Presupuesto declarado">{number("presupuestoDeclarado","Presupuesto declarado",1e13)}<p className="text-sm text-muted-foreground">Es una declaración inicial, distinta de capacidad comprobada o presupuesto máximo acordado.</p></LeadSection>}
    <LeadSection title="Seguimiento">
      {text("perfil.plazo", "Plazo previsto", perfil.plazo)}
      {text("perfil.proximoContacto", "Próximo contacto", perfil.proximoContacto, "date", 10)}
      <Field label="Asesor responsable" htmlFor={id("asesorId")}><select id={id("asesorId")} name="asesorId" defaultValue={lead?.asesorId ?? ""} className={selectClass}>
        <option value="">Sin asignar</option>
        {lead?.asesorId && !asesores.some(a => a.id === lead.asesorId) ? <option value={lead.asesorId}>{lead.asesorId}</option> : null}
        {asesores.filter(a => a.activo || a.id === lead?.asesorId).map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
      </select></Field>
      <Field label="Mensaje / notas iniciales" htmlFor={id("mensaje")} className="sm:col-span-2"><textarea id={id("mensaje")} name="mensaje" rows={3} maxLength={20000} defaultValue={lead?.mensaje ?? ""} className={textareaClass} /></Field>
    </LeadSection>
  </div>;
}

function LeadSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <details className="min-w-0 rounded-lg border border-border p-4"><summary className="min-h-11 cursor-pointer content-center text-base font-semibold">{title}</summary><div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">{children}</div></details>;
}

export function LeadProfileSummary({ perfil }: { perfil?: LeadProfile }) {
  if (!perfil || !Object.values(perfil).some(value => value !== undefined && value !== "")) return <p className="text-sm text-muted-foreground">Perfil pendiente. Edita la ficha para registrar la necesidad del lead y sus datos.</p>;
  const labels: Record<string, string> = { capitalDeclarado: "Capital declarado", presupuestoDeclarado: "Presupuesto declarado", estrategiaInversion: "Estrategia de inversión", horizonteInversion: "Horizonte", criteriosInversion: "Criterios y límites", operacion: "Operación", uso: "Uso", moneda: "Moneda", formaPago: "Forma de pago", tipoCredito: "Crédito", estadoCredito: "Estado del crédito", origenIngresos: "Origen de ingresos", presupuestoMin: "Presupuesto mínimo", presupuestoMax: "Presupuesto máximo", precioObjetivo: perfil.operacion === "arrendar" ? "Renta mensual esperada" : "Precio de venta esperado", superficieMin: "Superficie mínima (m²)", superficieMax: "Superficie máxima (m²)", superficieTerreno: "Superficie de terreno (m²)", superficieConstruccion: "Superficie construida (m²)", recamaras: "Recámaras mínimas", estacionamientos: "Estacionamientos mínimos", recamarasInmueble: "Recámaras del inmueble", estacionamientosInmueble: "Estacionamientos del inmueble", requisitos: "Requisitos", caracteristicas: "Características y condiciones", plazo: "Plazo previsto", proximoContacto: "Próximo contacto" };
  return <><p className="mb-3 text-sm text-muted-foreground">Perfil principal de la persona. Cada encargo conserva su entrevista y sus condiciones propias.</p><dl className="grid min-w-0 gap-3 text-sm sm:grid-cols-2">{Object.entries(labels).map(([key, label]) => {
    const value = perfil[key as keyof LeadProfile];
    if (value === undefined || value === "") return null;
    const options = LEAD_PROFILE_OPTIONS[key as keyof typeof LEAD_PROFILE_OPTIONS] as Record<string, string> | undefined;
    let display = options?.[String(value)] ?? (typeof value === "number" ? value.toLocaleString("es-MX") : String(value));
    if (key.startsWith("presupuesto") || key === "precioObjetivo") display += ` ${perfil.moneda ?? ""}${perfil.operacion === "rentar" || perfil.operacion === "arrendar" ? " /mes" : ""}`;
    return <div key={key} className="min-w-0 [overflow-wrap:anywhere]"><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 whitespace-pre-wrap">{display}</dd></div>;
  })}</dl></>;
}
