"use client";
import * as React from "react";
import { Button } from "@/components/admin/kit";
import { AsyncForm, Field, inputClass, selectClass, textareaClass } from "./ui";
import { LeadFields, readLeadFields } from "./lead-fields";
import { db, useCollection, upsert, uid, type Cliente } from "@/lib/admin/store";
import { CpHelper } from "./cp-helper";
import { datosDeCurp, domicilioDesde } from "@/lib/formatos/deducir";
import s from "./form.module.css";

/** Estados civiles como los piden los formatos; el texto es el que se imprime. */
export const ESTADOS_CIVILES = ["Soltero(a)", "Casado(a) por sociedad conyugal", "Casado(a) por separación de bienes", "Unión libre", "Divorciado(a)", "Viudo(a)"] as const;

export const CLIENTE_TIPO_LABELS: Record<Cliente["tipo"], string> = {
  propietario: "Propietario",
  comprador: "Comprador",
  arrendador: "Arrendador",
  arrendatario: "Arrendatario",
  inversionista: "Inversionista",
  otro: "Otro",
};

/** Alta y edición de un cliente; con un prospecto vinculado edita también su perfil. Rediseño del 18/10/2026: grupos de campos del kit. */
export function ClienteEditor({ initial, onDone, title }: { initial?: Cliente; onDone: () => void; title?: boolean }) {
  const [cliente] = React.useState(initial);
  const [saving, setSaving] = React.useState(false);
  const [version] = React.useState(() => initial ? db.clientes.version(initial) : null);
  const asesores = useCollection(db.asesores);
  // Datos para el expediente (CSR-02): se escriben una vez aquí; la CURP deduce la fecha de nacimiento y el código postal, la colonia.
  const nacimiento = React.useRef<HTMLInputElement>(null), domicilio = React.useRef<HTMLInputElement>(null);
  const [curpAviso, setCurpAviso] = React.useState("");
  function deducirCurp(event: React.FocusEvent<HTMLInputElement>) {
    const texto = event.target.value.trim();
    if (!texto) { setCurpAviso(""); return; }
    const datos = datosDeCurp(texto);
    if (!datos) { setCurpAviso("La CURP no tiene la forma correcta; revísala."); return; }
    if (nacimiento.current && !nacimiento.current.value) nacimiento.current.value = datos.fechaNacimiento;
    setCurpAviso(`De la CURP: ${datos.sexo.toLowerCase()}, ${datos.entidad}.`);
  }
  return (
    <AsyncForm
      className="flex min-w-0 flex-col gap-4"
      onSubmit={async (e) => {
        const data = new FormData(e.currentTarget);
        const v = (key: string) => String(data.get(key) ?? "").trim();
        const now = new Date().toISOString();
        setSaving(true);
        try { const saved = await upsert(
          db.clientes,
          {
            ...cliente,
            id: cliente?.id ?? uid(),
            nombre: v("nombre"),
            telefono: v("telefono"),
            email: v("email") || undefined,
            tipo: v("tipo") as Cliente["tipo"],
            asesorId: v("asesorId") || undefined,
            notas: v("notas"),
            curp: v("curp").toUpperCase().replace(/\s+/g, "") || undefined,
            rfc: v("rfc").toUpperCase().replace(/\s+/g, "") || undefined,
            estadoCivil: v("estadoCivil") || undefined,
            fechaNacimiento: v("fechaNacimiento") || undefined,
            domicilio: v("domicilio") || undefined,
            identificacion: v("identificacion") || undefined,
            creadoEl: cliente?.creadoEl ?? now,
            actualizadoEl: now,
            ...(cliente?.leadId ? readLeadFields(e.currentTarget, cliente) : {}),
          },
          version,
        );
        if (cliente?.leadId && saved.asesorId !== cliente.asesorId) {
          // The database synchronizes the linked lead in this same transaction.
          // Invalidate any older read before following the retained history link.
          db.leads.clear();
          await db.leads.load().catch(() => {});
        }
        onDone(); } finally { setSaving(false); }
      }}
    >
      {title !== false && <h2 className="m-0 text-xl font-[600] tracking-[-0.015em]">{cliente ? "Editar cliente" : "Nuevo cliente"}</h2>}
      {cliente?.leadId ? <LeadFields lead={cliente} channel={false} /> : <section className={s.group} aria-label="Contacto">
        <div className={s.groupHead}><h2>Contacto</h2><p>Nombre y teléfono para poder localizarlo.</p></div>
        <div className={s.grid}>
          <Field label="Nombre" htmlFor="cl-nombre" className={s.span2}><input id="cl-nombre" name="nombre" required defaultValue={cliente?.nombre} autoComplete="name" className={inputClass} /></Field>
          <Field label="Teléfono" htmlFor="cl-telefono"><input id="cl-telefono" name="telefono" type="tel" required defaultValue={cliente?.telefono} autoComplete="tel" className={inputClass} /></Field>
          <Field label="Correo" htmlFor="cl-email"><input id="cl-email" name="email" type="email" defaultValue={cliente?.email} autoComplete="email" className={inputClass} /></Field>
          <Field label="Asesor responsable" htmlFor="cl-asesor" className={s.span2}>
            <select id="cl-asesor" name="asesorId" defaultValue={cliente?.asesorId ?? ""} className={selectClass}>
              <option value="">Sin asignar</option>
              {asesores.map(a => <option key={a.id} value={a.id}>{a.nombre}{a.activo ? "" : " (inactivo)"}</option>)}
            </select>
          </Field>
        </div>
      </section>}
      <section className={s.group} aria-label="Datos para el expediente">
        <div className={s.groupHead}><h2>Datos para el expediente</h2><p>Se escriben una vez y los formatos de todas sus operaciones los toman.</p></div>
        <div className={s.grid}>
          <Field label="CURP" htmlFor="cl-curp" hint={curpAviso || "Con la CURP se deduce la fecha de nacimiento."}><input id="cl-curp" name="curp" maxLength={18} defaultValue={cliente?.curp} autoComplete="off" className={`${inputClass} uppercase`} onBlur={deducirCurp} /></Field>
          <Field label="RFC" htmlFor="cl-rfc"><input id="cl-rfc" name="rfc" maxLength={13} defaultValue={cliente?.rfc} autoComplete="off" className={`${inputClass} uppercase`} /></Field>
          <Field label="Fecha de nacimiento" htmlFor="cl-nacimiento"><input ref={nacimiento} id="cl-nacimiento" name="fechaNacimiento" type="date" defaultValue={cliente?.fechaNacimiento} className={inputClass} /></Field>
          <Field label="Estado civil" htmlFor="cl-estadoCivil">
            <select id="cl-estadoCivil" name="estadoCivil" defaultValue={cliente?.estadoCivil ?? ""} className={selectClass}>
              <option value="">Sin dato</option>
              {ESTADOS_CIVILES.map(estado => <option key={estado} value={estado}>{estado}</option>)}
            </select>
          </Field>
          <Field label="Identificación oficial" htmlFor="cl-identificacion" hint="Tipo y número, por ejemplo INE 1234567890."><input id="cl-identificacion" name="identificacion" maxLength={160} defaultValue={cliente?.identificacion} className={inputClass} /></Field>
          <Field label="Domicilio" htmlFor="cl-domicilio" className={s.span2} hint="Calle y número; con el código postal se completa la colonia y el municipio."><input ref={domicilio} id="cl-domicilio" name="domicilio" maxLength={400} defaultValue={cliente?.domicilio} className={inputClass} /></Field>
          <CpHelper className={s.span2} onPick={colonia => { if (domicilio.current) domicilio.current.value = domicilioDesde(domicilio.current.value.split(",")[0], colonia); }} />
        </div>
      </section>
      <section className={s.group} aria-label="Relación y notas">
        <div className={s.groupHead}><h2>Relación y notas</h2></div>
        <div className={s.grid}>
          <Field label="Tipo de cliente" htmlFor="cl-tipo">
            <select id="cl-tipo" name="tipo" defaultValue={cliente?.tipo ?? "otro"} className={selectClass}>
              {Object.entries(CLIENTE_TIPO_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </Field>
          <Field label="Notas" htmlFor="cl-notas" className={s.span2}><textarea id="cl-notas" name="notas" rows={4} defaultValue={cliente?.notas} className={textareaClass} /></Field>
        </div>
      </section>
      <div className={s.windowFoot}>
        <Button type="submit" variant="primary">Guardar cliente</Button>
        <Button variant="ghost" disabled={saving} onClick={onDone}>Cancelar</Button>
      </div>
    </AsyncForm>
  );
}
