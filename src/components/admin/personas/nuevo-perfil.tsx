"use client";
import * as React from "react";
import { Avatar, Button, Sheet } from "@/components/admin/kit";
import { CLIENTE_TIPO_LABELS } from "@/components/admin/cliente-editor";
import { Checkbox, ToggleGroup, ToggleGroupItem } from "@/components/ui/controls";
import { DateField } from "@/components/ui/date-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addDays } from "@/lib/admin/lead-contact";
import { planNextStep } from "@/lib/admin/next-step-task";
import { operationalDate } from "@/lib/admin/operational-date";
import { ACUERDOS, CANALES_PREFERIDOS, MOTIVOS, faltante, parecidas, prospectoNuevo, type CanalPreferido, type Motivo, type Respuestas } from "@/lib/admin/personas-vista";
import { db, errorMessage, fetchJson, uid, upsert, useCollection, type Lead } from "@/lib/admin/store";
import { inputClass, textareaClass } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

/*
  FLX-01 · «Nuevo perfil»: las cinco preguntas de una llamada (DEC-50; RP-94 igual). Panel del kit,
  a la derecha en computadora y desde abajo en celular. Guarda un prospecto con la API de siempre
  (registro nuevo, sin versión previa) y su próximo contacto como tarea con fecha (DEC-42), igual que
  al registrar un contacto. Si el nombre o el teléfono coinciden con alguien, avisa y el asesor elige
  «es la misma» (abre su perfil) o «es otra»; nunca se juntan solos. Lo escrito se conserva al cerrar
  el panel hasta guardarlo.
*/
const VACIO = (hoy: string): Respuestas => ({ nombre: "", telefono: "", email: "", motivo: "", detalle: "", canal: "", acuerdo: "", fecha: addDays(hoy, 2), privacidad: false });
type Config = { administrador: boolean; asesorId: string | null };

export function NuevoPerfil({ open, onClose, onGuardado, onAbrir }: {
  open: boolean; onClose: () => void;
  /** Ya quedó guardado; `clave` es «lead:<id>». `aviso` dice si algo quedó pendiente. */
  onGuardado: (clave: string, aviso: string) => void;
  /** «Es la misma»: abrir a esa persona en lugar de crear otra. */
  onAbrir: (clave: string) => void;
}) {
  const hoy = operationalDate();
  const leads = useCollection(db.leads), clientes = useCollection(db.clientes), tareas = useCollection(db.tareas), asesores = useCollection(db.asesores);
  const [r, setR] = React.useState<Respuestas>(() => VACIO(hoy));
  const [otras, setOtras] = React.useState<ReadonlySet<string>>(new Set());
  const [config, setConfig] = React.useState<Config | null>(null);
  const [asesor, setAsesor] = React.useState("");
  const [error, setError] = React.useState<{ campo?: string; texto: string } | null>(null);
  const [guardando, setGuardando] = React.useState(false);
  const ids = React.useRef({ id: uid(), nota: uid() });
  const fid = (k: string) => `np-${k}`;

  React.useEffect(() => {
    if (!open || config) return;
    let alive = true;
    fetchJson<Config>("/api/admin/entrevistas/config").then(c => { if (alive) { setConfig(c); if (c.asesorId) setAsesor(c.asesorId); } })
      .catch(e => { if (alive) setError({ texto: errorMessage(e) }); });
    return () => { alive = false; };
  }, [open, config]);

  const activos = asesores.filter(a => a.activo);
  const asesorElegido = config?.administrador ? (asesor || (activos.length === 1 ? activos[0].id : "")) : asesor;
  const personas = [
    ...leads.filter(l => !l.clienteId).map(l => ({ id: `lead:${l.id}`, nombre: l.nombre, telefono: l.telefono, papel: "Prospecto" })),
    ...clientes.map(c => ({ id: `cliente:${c.id}`, nombre: c.nombre, telefono: c.telefono, papel: CLIENTE_TIPO_LABELS[c.tipo] })),
  ];
  const coinciden = parecidas(personas, r.nombre, r.telefono);
  const pendientes = coinciden.filter(p => !otras.has(p.id));
  const set = <K extends keyof Respuestas>(k: K, v: Respuestas[K]) => { setR(old => ({ ...old, [k]: v })); setError(null); };

  async function guardar(event: React.FormEvent) {
    event.preventDefault();
    if (guardando) return;
    const falta = faltante(r);
    if (falta) { setError({ campo: falta.campo, texto: falta.texto }); document.getElementById(fid(falta.campo))?.focus(); return; }
    if (pendientes.length) { setError({ campo: "parecidas", texto: "Dinos si es la misma persona que ya tienes o si es otra." }); document.getElementById(fid("parecidas"))?.focus(); return; }
    if (!config) { setError({ texto: "Espera un momento: todavía se está cargando quién la atiende." }); return; }
    if (!asesorElegido) { setError({ campo: "asesor", texto: config.administrador ? "Elige quién la atiende." : "Tu cuenta necesita un asesor asignado por el administrador." }); return; }
    setGuardando(true); setError(null);
    const lead = prospectoNuevo(r, ids.current, new Date().toISOString(), asesorElegido) as Lead;
    try { await upsert(db.leads, lead, null); }
    catch (e) { setError({ texto: errorMessage(e) || "No se pudo guardar el perfil. Inténtalo de nuevo." }); setGuardando(false); return; }
    let aviso = `Se guardó el perfil de ${lead.nombre}.`;
    try {
      // DEC-42: «en qué quedaron» queda como tarea con fecha, para que aparezca en Hoy y en Agenda.
      const tarea = planNextStep(tareas, { kind: "lead", id: lead.id, asesorId: lead.asesorId }, { accion: r.acuerdo, fecha: r.fecha, id: uid() });
      await upsert(db.tareas, tarea, db.tareas.version(tarea));
    } catch { aviso = `Se guardó el perfil de ${lead.nombre}, pero no su tarea. Anótala desde su perfil.`; }
    ids.current = { id: uid(), nota: uid() };
    setR(VACIO(operationalDate())); setOtras(new Set()); setGuardando(false);
    onGuardado(`lead:${lead.id}`, aviso);
  }

  const err = (campo: string) => error?.campo === campo ? { "aria-invalid": true as const, "aria-describedby": fid("error") } : {};
  const pregunta = "text-[0.9375rem] font-semibold text-foreground";
  const chip = "min-h-11 flex-auto whitespace-nowrap px-3";

  return <Sheet open={open} onClose={onClose} title="Nuevo perfil" description="Las preguntas de una llamada. Lo demás se completa después, desde su perfil."
    footer={<>
      <Button variant="ghost" onClick={onClose} disabled={guardando}>Cerrar</Button>
      <Button variant="primary" type="submit" form="nuevo-perfil" disabled={guardando}>{guardando ? "Guardando…" : "Guardar perfil"}</Button>
    </>}>
    <form id="nuevo-perfil" className="flex flex-col gap-6" onSubmit={guardar} noValidate aria-label="Nuevo perfil">
      <div className="flex flex-col gap-2">
        <label htmlFor={fid("nombre")} className={pregunta}>¿Cómo se llama?</label>
        <input id={fid("nombre")} className={inputClass} autoComplete="off" maxLength={160} placeholder="Nombre y apellidos" value={r.nombre} onChange={e => set("nombre", e.target.value)} {...err("nombre")} />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor={fid("telefono")} className={pregunta}>¿A qué teléfono le buscamos?</label>
        <input id={fid("telefono")} className={inputClass} type="tel" inputMode="tel" autoComplete="off" maxLength={40} placeholder="10 dígitos" value={r.telefono} onChange={e => set("telefono", e.target.value)} {...err("telefono")} />
      </div>

      {coinciden.length > 0 && <div id={fid("parecidas")} tabIndex={-1} role="group" aria-label="Personas que podrían ser la misma" className={cn("flex flex-col gap-3 rounded-[12px] border p-4 outline-none", pendientes.length ? "border-[var(--warning-border)] bg-[var(--warning-surface)]" : "border-[var(--card-edge)]")}>
        <p className="text-sm font-semibold">{coinciden.length === 1 ? "Ya tienes a alguien parecido" : `Ya tienes a ${coinciden.length} personas parecidas`}</p>
        {coinciden.map(p => <div key={p.id} className="flex flex-wrap items-center gap-3">
          <Avatar name={p.nombre} size={36} />
          <span className="min-w-[10rem] flex-1 text-sm"><b className="block">{p.nombre}</b><span className="text-muted-foreground">{p.papel} · mismo {p.por}</span></span>
          {otras.has(p.id)
            ? <span className="text-sm text-muted-foreground">Es otra persona</span>
            : <span className="flex gap-2"><Button onClick={() => onAbrir(p.id)}>Es la misma</Button><Button variant="ghost" onClick={() => setOtras(s => new Set(s).add(p.id))}>Es otra</Button></span>}
        </div>)}
      </div>}

      <fieldset className="flex min-w-0 flex-col gap-2">
        <legend className={cn(pregunta, "mb-2")}>¿Para qué llamó?</legend>
        <ToggleGroup id={fid("motivo")} type="single" aria-label="Para qué llamó" value={r.motivo} onValueChange={v => { if (v) set("motivo", v as Motivo); }} className="flex w-full flex-wrap" {...err("motivo")}>
          {(Object.keys(MOTIVOS) as Motivo[]).map(k => <ToggleGroupItem key={k} value={k} className={chip}>{MOTIVOS[k]}</ToggleGroupItem>)}
        </ToggleGroup>
        <label htmlFor={fid("detalle")} className="sr-only">Lo que contó</label>
        <textarea id={fid("detalle")} rows={2} maxLength={2000} className={textareaClass} placeholder="Lo que contó, si hace falta (zona, tipo de inmueble, presupuesto)" value={r.detalle} onChange={e => set("detalle", e.target.value)} />
      </fieldset>

      <fieldset className="flex min-w-0 flex-col gap-2">
        <legend className={cn(pregunta, "mb-2")}>¿Cómo prefiere que le busquemos?</legend>
        <ToggleGroup id={fid("canal")} type="single" aria-label="Cómo prefiere que le busquemos" value={r.canal} onValueChange={v => { if (v) set("canal", v as CanalPreferido); }} className="flex w-full">
          {(Object.keys(CANALES_PREFERIDOS) as CanalPreferido[]).map(k => <ToggleGroupItem key={k} value={k} className="min-h-11 flex-1 px-3">{CANALES_PREFERIDOS[k]}</ToggleGroupItem>)}
        </ToggleGroup>
        {r.canal === "correo" && <>
          <label htmlFor={fid("email")} className="sr-only">Correo</label>
          <input id={fid("email")} className={inputClass} type="email" autoComplete="off" maxLength={254} placeholder="Su correo" value={r.email} onChange={e => set("email", e.target.value)} {...err("email")} />
        </>}
      </fieldset>

      <fieldset className="flex min-w-0 flex-col gap-2">
        <legend className={cn(pregunta, "mb-2")}>¿En qué quedaron?</legend>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Acuerdos frecuentes">
          {ACUERDOS.map(a => <Button key={a} variant={r.acuerdo === a ? "secondary" : "ghost"} aria-pressed={r.acuerdo === a} className="min-h-11 border border-[var(--card-edge)]" onClick={() => set("acuerdo", a)}>{a}</Button>)}
        </div>
        <label htmlFor={fid("acuerdo")} className="sr-only">En qué quedaron</label>
        <input id={fid("acuerdo")} className={inputClass} maxLength={160} placeholder="O escribe en qué quedaron" value={r.acuerdo} onChange={e => set("acuerdo", e.target.value)} {...err("acuerdo")} />
        <div className="flex flex-col gap-1.5">
          <span id={fid("fecha-l")} className="text-sm text-muted-foreground">¿Cuándo le vuelves a buscar?</span>
          <DateField id={fid("fecha")} aria-label="Cuándo le vuelves a buscar" value={r.fecha} min={hoy} required onChange={v => set("fecha", v)} {...err("fecha")} />
        </div>
      </fieldset>

      {config?.administrador && <div className="flex flex-col gap-2">
        <label htmlFor={fid("asesor")} className={pregunta}>¿Quién la atiende?</label>
        <Select value={asesorElegido} onValueChange={setAsesor}>
          <SelectTrigger id={fid("asesor")} {...err("asesor")}><SelectValue placeholder="Elegir asesor" /></SelectTrigger>
          <SelectContent>{activos.map(a => <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>)}</SelectContent>
        </Select>
      </div>}

      <label className="flex min-h-11 items-start gap-3 text-sm">
        <Checkbox className="mt-0.5" checked={r.privacidad} onCheckedChange={v => set("privacidad", v === true)} />
        <span><b>Ya le compartí el aviso de privacidad.</b> <span className="text-muted-foreground">Si todavía no, compártelo en el siguiente contacto.</span></span>
      </label>

      {error && <p id={fid("error")} role="alert" className="text-sm text-destructive">{error.texto}</p>}
    </form>
  </Sheet>;
}
