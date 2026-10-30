"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, X } from "@/components/admin/icons";
import { Button, ButtonLink, Card, Notice, ProgressBar, Surface } from "@/components/admin/kit";
import { inputClass, selectClass } from "@/components/admin/ui";
import { AdminApiError, apiRequest, db, errorMessage, useCollection, useLoadState, type Lead } from "@/lib/admin/store";
import { operationalDate } from "@/lib/admin/operational-date";
import { INTENTS, isBuyerIntent, type IntakeIntent, type OperationalInterview } from "@/lib/intake/interview";
import { INTENT_CHOICES, intentTitle, wizardSteps } from "@/lib/intake/wizard";
import { useInterviewGuard } from "./use-interview-guard";
import { InterviewStep } from "./interview-step";
import { DoneStep } from "./done-step";
import { InterestedDone, InterestedStep, type InterestedContact } from "./interested-step";
import { cn } from "@/lib/utils";
import s from "./wizard.module.css";

/*
  Nueva operación (boceto aprobado por el titular, 17/10/2026). Paso 1: qué quiere hacer
  el cliente. Paso 2: quién es (avisa si ya está registrado). Paso 3: la entrevista.
  Paso 4: listo. En computadora los pasos van a la izquierda y las entrevistas a medias a la
  derecha. La operación se crea al terminar la entrevista, como antes; mientras tanto queda
  como borrador en Hoy › «Entrevistas por terminar».
  «?entrevista=<id>» retoma una entrevista (o muestra una terminada).
  «Quiere comprar» y «Quiere rentar» no abren operación (COR-11, RP-93): el paso 3 es el perfil
  del interesado y se guarda como prospecto con su próxima acción.
*/

const ORIGINS = { llamada: "Llamada", whatsapp: "WhatsApp", correo: "Correo electrónico", referido: "Referido", web: "Página web o redes sociales", presencial: "En persona", otro: "Otro" } as const;
type Contact = { kind: "lead" | "cliente"; id: string };

export function NewOperationWizard() {
  const params = useSearchParams(), router = useRouter();
  const interviewId = params.get("entrevista");
  const [interview, setInterview] = React.useState<OperationalInterview | null>(null);
  const [fresh, setFresh] = React.useState(false);
  const [loadError, setLoadError] = React.useState("");
  const [guard, setGuard] = React.useState({ dirty: false, busy: false });
  const allowRef = useInterviewGuard(guard.dirty, guard.busy);
  React.useEffect(() => {
    if (!interviewId || interview?.id === interviewId) return;
    let alive = true;
    apiRequest<{ entrevista: OperationalInterview }>(`/api/admin/entrevistas/${encodeURIComponent(interviewId)}`)
      .then(r => { if (alive) { setInterview(r.entrevista); setFresh(false); setLoadError(""); } })
      .catch(cause => { if (alive) setLoadError(errorMessage(cause)); });
    return () => { alive = false; };
  }, [interviewId, interview?.id]);
  const onGuard = React.useCallback((dirty: boolean, busy: boolean) => setGuard(old => old.dirty === dirty && old.busy === busy ? old : { dirty, busy }), []);

  const step = !interviewId ? null : !interview ? 0 : interview.estado === "borrador" ? 3 : 4;
  return <Surface className="flex min-h-[100dvh] flex-1 flex-col">
    {step === null ? <ContactSteps onStarted={started => { setGuard({ dirty: false, busy: false }); setInterview(started); setFresh(true); router.replace(`/admin/operaciones/nueva?entrevista=${encodeURIComponent(started.id)}`, { scroll: false }); }} onGuard={onGuard} />
      : <div className={s.shell}>
        <Header step={step === 0 ? 3 : step} intent={interview?.intencion} />
        <div className={s.frame}>
          <StepsNav step={step === 0 ? 3 : step} intent={interview?.intencion} />
          <div className={s.main}>
            {step === 0 ? (loadError ? <div className={s.body}><p role="alert">{loadError}</p><Button className="self-start" onClick={() => window.location.reload()}>Reintentar</Button></div> : <div className={s.body}><p role="status" className="text-sm text-muted-foreground">Cargando la entrevista…</p></div>)
              : interview && isBuyerIntent(interview.intencion) && interview.estado === "borrador" ? <div className={s.body}><Notice title="Esta entrevista ya no abre operación">Fortius representa al propietario: quien busca comprar o rentar se guarda como interesado, con lo que busca y su próxima acción.</Notice><ButtonLink className="self-start" variant="primary" href={`/admin/operaciones/nueva?${new URLSearchParams({ intencion: interview.intencion, ...(interview.lead_id ? { leadId: interview.lead_id } : interview.cliente_id ? { clienteId: interview.cliente_id } : {}) })}`}>Guardarlo como interesado</ButtonLink></div>
              : interview?.estado === "cancelada" ? <div className={s.body}><Notice title="Esta entrevista se reemplazó">Cambió el contacto, el responsable o el inmueble de la operación. Prepara una entrevista con los datos actuales desde la operación.</Notice>{interview.expediente_id && <Link className="font-semibold underline" href={`/admin/operaciones/${encodeURIComponent(interview.expediente_id)}`}>Abrir la operación</Link>}</div>
              : step === 3 ? <InterviewStep key={interview!.id} interview={interview!} onSaved={setInterview} onDirtyChange={onGuard} onLater={() => { allowRef.current = true; router.push("/admin"); }} onDone={done => { setGuard({ dirty: false, busy: false }); setInterview(done); setFresh(true); window.scrollTo({ top: 0, behavior: "instant" }); }} />
              : <DoneStep interview={interview!} fresh={fresh} />}
          </div>
        </div>
      </div>}
  </Surface>;
}

function Header({ step, intent }: { step: number; intent?: IntakeIntent | null }) {
  const WIZARD_STEPS = wizardSteps(intent);
  return <div className={s.top}>
    <div className={s.topRow}>
      <Link href="/admin" className={s.close} aria-label="Salir de Nueva operación"><span className={s.closeIcon}><X size={18} aria-hidden="true" /></span>Nueva operación</Link>
      <span className="flex items-center gap-3"><span className={cn(s.hint, "hidden sm:inline")}>Se guarda solo mientras capturas</span><span className={s.meta}>Paso {step} de {WIZARD_STEPS.length}</span></span>
    </div>
    <div className={s.progress}>
      <ProgressBar value={step} max={WIZARD_STEPS.length} label={`Paso ${step} de ${WIZARD_STEPS.length}: ${WIZARD_STEPS[step - 1]}`} />
      <span className={s.meta}>{WIZARD_STEPS[step - 1]}</span>
    </div>
  </div>;
}

/** Los pasos a la izquierda en computadora; en celular los dice la barra del encabezado. */
function StepsNav({ step, intent }: { step: number; intent?: IntakeIntent | null }) {
  const WIZARD_STEPS = wizardSteps(intent);
  return <ol className={s.steps} aria-label="Pasos" aria-hidden="true">
    {WIZARD_STEPS.map((name, i) => {
      const n = i + 1, done = n < step;
      return <li key={name} className={s.stepRow} aria-current={n === step ? "step" : undefined} data-done={done || undefined}>
        <span className={s.stepNumber}>{done ? <Check size={13} strokeWidth={3} /> : n}</span>{name}
      </li>;
    })}
  </ol>;
}

/** Pasos 1 y 2. Al continuar en el paso 2 se guarda el contacto y empieza la entrevista. */
function ContactSteps({ onStarted, onGuard }: { onStarted: (interview: OperationalInterview) => void; onGuard: (dirty: boolean, busy: boolean) => void }) {
  const params = useSearchParams();
  const leads = useCollection(db.leads), clients = useCollection(db.clientes), advisers = useCollection(db.asesores);
  const leadState = useLoadState(db.leads), clientState = useLoadState(db.clientes), adviserState = useLoadState(db.asesores);
  const loaded = leadState.loaded && clientState.loaded && adviserState.loaded;
  const correctionOf = params.get("expedienteId");
  const seed = params.get("intencion");
  const [intent, setIntent] = React.useState<IntakeIntent | null>(seed && Object.hasOwn(INTENTS, seed) ? seed as IntakeIntent : null);
  const [step, setStep] = React.useState(intent && (params.has("clienteId") || params.has("leadId")) ? 2 : 1);
  const [contact, setContact] = React.useState<Contact | null>(params.get("clienteId") ? { kind: "cliente", id: params.get("clienteId")! } : params.get("leadId") ? { kind: "lead", id: params.get("leadId")! } : null);
  const [picking, setPicking] = React.useState(false);
  const [name, setName] = React.useState(""), [phone, setPhone] = React.useState(""), [email, setEmail] = React.useState("");
  const [adviser, setAdviser] = React.useState(""), [shared, setShared] = React.useState(false);
  const [origin, setOrigin] = React.useState<keyof typeof ORIGINS>("llamada");
  const [action, setAction] = React.useState("Terminar la entrevista"), [actionDate, setActionDate] = React.useState(operationalDate());
  const [config, setConfig] = React.useState<{ administrador: boolean; asesorId: string | null } | null>(null);
  const [pending, setPending] = React.useState<OperationalInterview[]>([]);
  const [busy, setBusy] = React.useState(false), [error, setError] = React.useState(""), [uncertain, setUncertain] = React.useState(false);
  const requestId = React.useRef<string | null>(null), sent = React.useRef(false);
  const [profileGuard, setProfileGuard] = React.useState({ dirty: false, busy: false });
  const [interested, setInterested] = React.useState<Lead | null>(null);
  const buyer = !!intent && isBuyerIntent(intent);
  const dirty = (!contact && (!!name || !!phone || !!email) && !interested) || profileGuard.dirty;
  React.useEffect(() => { onGuard(dirty, busy || profileGuard.busy); }, [dirty, busy, profileGuard.busy, onGuard]);
  const onProfileGuard = React.useCallback((d: boolean, b: boolean) => setProfileGuard(old => old.dirty === d && old.busy === b ? old : { dirty: d, busy: b }), []);
  React.useEffect(() => {
    let alive = true;
    Promise.all([apiRequest<{ administrador: boolean; asesorId: string | null }>("/api/admin/entrevistas/config"), apiRequest<{ entrevistas: OperationalInterview[] }>("/api/admin/entrevistas")])
      .then(([c, p]) => {
        if (!Array.isArray(p.entrevistas) || typeof c.administrador !== "boolean") throw new Error("No se pudo cargar la configuración de captación.");
        if (alive) { setConfig(c); if (c.asesorId) setAdviser(c.asesorId); setPending(p.entrevistas.filter(e => !isBuyerIntent(e.intencion))); }
      })
      .catch(cause => { if (alive) setError(errorMessage(cause)); });
    return () => { alive = false; };
  }, []);
  function changed() { if (!sent.current) requestId.current = null; setError(""); }

  const digits = phone.replace(/\D/g, ""), mail = email.trim().toLowerCase();
  const people = [
    ...leads.filter(l => !l.clienteId).map(l => ({ kind: "lead" as const, id: l.id, nombre: l.nombre, telefono: l.telefono, email: l.email, detail: "Prospecto" })),
    ...clients.map(c => ({ kind: "cliente" as const, id: c.id, nombre: c.nombre, telefono: c.telefono, email: c.email, detail: "Cliente" })),
  ];
  const matches = !contact && (digits.length >= 7 || !!mail) ? people.filter(p => (digits.length >= 7 && p.telefono.replace(/\D/g, "") === digits) || (!!mail && p.email?.trim().toLowerCase() === mail)) : [];
  const chosen = contact ? people.find(p => p.kind === contact.kind && p.id === contact.id) : undefined;
  const adviserOptions = advisers.filter(a => a.activo && (config?.administrador || a.id === config?.asesorId));

  /** Comprueba el contacto nuevo antes de guardarlo; enfoca el campo que falta. */
  function contactReady() {
    if (!contact) {
      if (!name.trim()) { setError("Escribe el nombre completo."); document.getElementById("nueva-nombre")?.focus(); return false; }
      if (digits.length < 7 && !mail) { setError("Escribe un teléfono o un correo para poder contactarlo."); document.getElementById("nueva-telefono")?.focus(); return false; }
      if (!loaded || !config) { setError("Espera a que carguen los contactos y responsables."); return false; }
      if (matches.length && !shared) { setError("Dinos si es la misma persona que ya tenemos o si es otra."); return false; }
      if (!adviser) { setError(config.administrador ? "Elige al asesor responsable." : "Tu cuenta necesita un asesor asignado por el administrador."); return false; }
    }
    return true;
  }
  /** Interesado (compra o renta): el contacto pasa al perfil, sin entrevista ni operación. */
  function toProfile() {
    setError("");
    if (!intent || !contactReady()) return;
    if (contact && !chosen) { setError("Espera a que cargue su ficha."); return; }
    setStep(3);
  }
  const interestedContact: InterestedContact | null = !buyer ? null
    : contact?.kind === "lead" ? (() => { const lead = leads.find(l => l.id === contact.id); return lead ? { kind: "lead" as const, lead, version: db.leads.version(lead) } : null; })()
    : contact?.kind === "cliente" ? (() => { const c = clients.find(x => x.id === contact.id); return c ? { kind: "cliente" as const, nombre: c.nombre, telefono: c.telefono, email: c.email, asesorId: c.asesorId } : null; })()
    : { kind: "nuevo", nombre: name.trim(), telefono: phone.trim(), email: email.trim() || undefined, asesorId: adviser };

  async function start() {
    if (!intent || busy || sent.current) return;
    setError("");
    if (!contactReady()) return;
    if (!correctionOf && (!action.trim() || !actionDate)) { setError("Escribe la siguiente acción y su fecha."); return; }
    if (contact) {
      const current = pending.find(p => p.intencion === intent && (correctionOf ? p.expediente_id === correctionOf : contact.kind === "lead" ? p.lead_id === contact.id : p.cliente_id === contact.id));
      if (current) { onStarted(current); return; }
    }
    if (!requestId.current) requestId.current = crypto.randomUUID();
    sent.current = true; setBusy(true);
    const contacto = contact ? { tipo: contact.kind, id: contact.id } : { tipo: "nuevo", nombre: name.trim(), telefono: phone.trim(), email: email.trim(), asesorId: adviser, telefonoCompartido: shared };
    try {
      const r = await apiRequest<{ entrevista: OperationalInterview }>("/api/admin/entrevistas", "POST", { id: requestId.current, intencion: intent, contacto, ...(correctionOf ? { expedienteId: correctionOf } : { seguimiento: { origen: origin, accion: action.trim(), fecha: actionDate } }) });
      void db.leads.load().catch(() => {});
      onStarted(r.entrevista);
    } catch (cause) {
      // Un acuse perdido se concilia antes de permitir otra alta distinta.
      try { const recovered = await apiRequest<{ entrevista: OperationalInterview }>(`/api/admin/entrevistas/${requestId.current}`); if (recovered.entrevista) { onStarted(recovered.entrevista); return; } } catch {}
      if (contact) try {
        const q = new URLSearchParams(correctionOf ? { expedienteId: correctionOf } : contact.kind === "lead" ? { leadId: contact.id } : { clienteId: contact.id });
        const available = await apiRequest<{ entrevistas: OperationalInterview[] }>(`/api/admin/entrevistas?${q}`);
        const current = available.entrevistas.find(p => p.estado === "borrador" && p.intencion === intent);
        if (current) { onStarted(current); return; }
      } catch {}
      setUncertain(!(cause instanceof AdminApiError) || cause.status === 0 || cause.status >= 500);
      setError(errorMessage(cause) || "No se pudo empezar la entrevista.");
      sent.current = false; setBusy(false);
    }
  }

  if (buyer && intent && (step === 3 || step === 4)) return <div className={s.shell}>
    <Header step={interested ? 4 : 3} intent={intent} />
    <div className={s.frame}>
    <StepsNav step={interested ? 4 : 3} intent={intent} />
    <div className={s.main}>
      {interested ? <InterestedDone intent={intent as "comprar" | "rentar"} lead={interested} />
        : interestedContact ? <InterestedStep intent={intent as "comprar" | "rentar"} contact={interestedContact} origin={ORIGINS[origin]} onBack={() => setStep(2)} onDirtyChange={onProfileGuard} onSaved={lead => { setProfileGuard({ dirty: false, busy: false }); setInterested(lead); setStep(4); void db.leads.load().catch(() => {}); window.scrollTo({ top: 0, behavior: "instant" }); }} />
        : <div className={s.body}><p role="status" className="text-sm text-muted-foreground">Cargando su ficha…</p></div>}
    </div>
    </div>
  </div>;

  return <div className={s.shell}>
    <Header step={step} intent={intent} />
    <div className={s.frame}>
    <StepsNav step={step} intent={intent} />
    <div className={s.main}>
    <div className={s.body}>
      {step === 1 ? <>
        <h1 className={s.title}>¿Qué quiere hacer el cliente?</h1>
        <p className={s.lead}>Elige una opción. La puedes cambiar después.</p>
        <div role="radiogroup" aria-label="Qué quiere hacer el cliente" className={s.choices}>
          {INTENT_CHOICES.map(choice => <button key={choice.id} type="button" role="radio" aria-checked={intent === choice.id} className={s.choice} onClick={() => { setIntent(choice.id); changed(); }}>
            <span className={s.dot} aria-hidden="true" /><span className="flex flex-col gap-0.5"><strong>{choice.title}</strong><span className="text-sm text-muted-foreground">{choice.description}</span></span>
          </button>)}
        </div>
        {pending.length > 0 && <div className="xl:hidden"><PendingCard pending={pending} /></div>}
      </> : <>
        <h1 className={s.title}>¿Quién es?</h1>
        <p className={s.lead}>{intent ? `${intentTitle(intent)}. ` : ""}Con el nombre y el teléfono basta para empezar.</p>
        <fieldset disabled={busy || uncertain} className="flex min-w-0 flex-col gap-5">
          {chosen || contact ? <Card as="div" className="flex flex-wrap items-center justify-between gap-3 p-4">
            <span className="flex flex-col"><strong>{chosen?.nombre ?? "Contacto registrado"}</strong><span className="text-sm text-muted-foreground">{chosen ? `${chosen.detail} · ${chosen.telefono || chosen.email || ""}` : "Cargando su ficha…"}. Se conservan su ficha y sus operaciones.</span></span>
            {!correctionOf && <Button variant="ghost" onClick={() => { setContact(null); changed(); }}>Es otra persona</Button>}
          </Card> : <>
            <label className="flex flex-col gap-2 text-sm font-semibold">Nombre completo<input id="nueva-nombre" required autoComplete="name" maxLength={160} className={inputClass} value={name} onChange={e => { setName(e.target.value); changed(); }} /></label>
            <label className="flex flex-col gap-2 text-sm font-semibold">Teléfono<input id="nueva-telefono" type="tel" autoComplete="tel" maxLength={40} className={inputClass} value={phone} onChange={e => { setPhone(e.target.value); setShared(false); changed(); }} /></label>
            {matches.map(match => <div key={match.kind + match.id} role="status" className="flex gap-3 rounded-[12px] border border-[var(--warning-border)] bg-[var(--warning-surface)] p-4">
              <AlertTriangle size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--warning)]" />
              <div className="flex min-w-0 flex-col gap-2.5">
                <p className="font-semibold">Ya tenemos a alguien con ese {digits.length >= 7 && match.telefono.replace(/\D/g, "") === digits ? "teléfono" : "correo"}</p>
                <p className="text-sm">{match.nombre} · {match.detail}</p>
                <div className="flex flex-wrap gap-2.5">
                  <Button onClick={() => { setContact({ kind: match.kind, id: match.id }); changed(); }}>Sí, es la misma persona</Button>
                  <Button variant="ghost" aria-pressed={shared} onClick={() => { setShared(true); changed(); }}>{shared ? "Es otra persona ✓" : "No, es otra persona"}</Button>
                </div>
              </div>
            </div>)}
            <label className="flex flex-col gap-2 text-sm font-semibold"><span>Correo <span className="font-normal text-muted-foreground">(si lo tiene)</span></span><input type="email" autoComplete="email" maxLength={254} className={inputClass} placeholder="nombre@correo.com" value={email} onChange={e => { setEmail(e.target.value); setShared(false); changed(); }} /></label>
            {config?.administrador && <label className="flex flex-col gap-2 text-sm font-semibold">Asesor responsable<select className={selectClass} value={adviser} onChange={e => { setAdviser(e.target.value); changed(); }}><option value="">Elige un asesor</option>{adviserOptions.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}</select></label>}
            {config && !config.administrador && !config.asesorId && <p role="alert" className="text-sm text-destructive">Tu cuenta necesita un asesor asignado por el administrador.</p>}
            <button type="button" className="self-start text-sm font-semibold underline underline-offset-4" aria-expanded={picking} onClick={() => setPicking(open => !open)}>¿Ya está registrado? Elígelo de la lista</button>
            {picking && <label className="flex flex-col gap-2 text-sm font-semibold">Prospecto o cliente<select className={selectClass} value="" onChange={e => { const [kind, id] = e.target.value.split(":"); if (id) { setContact({ kind: kind as Contact["kind"], id }); setPicking(false); changed(); } }}><option value="">Elige un contacto</option><optgroup label="Prospectos">{people.filter(p => p.kind === "lead").map(p => <option key={p.id} value={`lead:${p.id}`}>{p.nombre} · {p.telefono}</option>)}</optgroup><optgroup label="Clientes">{people.filter(p => p.kind === "cliente").map(p => <option key={p.id} value={`cliente:${p.id}`}>{p.nombre} · {p.telefono}</option>)}</optgroup></select></label>}
          </>}
          {!correctionOf && <>
            <label className="flex flex-col gap-2 text-sm font-semibold">¿Cómo llegó?<select className={selectClass} value={origin} onChange={e => { setOrigin(e.target.value as keyof typeof ORIGINS); changed(); }}>{Object.entries(ORIGINS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            {!buyer && <details className="text-sm"><summary className="cursor-pointer font-semibold">Siguiente acción mientras terminas de capturarlo</summary><div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-2">Siguiente acción<input required maxLength={160} className={inputClass} value={action} onChange={e => { setAction(e.target.value); changed(); }} /></label>
              <label className="flex flex-col gap-2">Fecha de la siguiente acción<input required type="date" className={inputClass} value={actionDate} onChange={e => { setActionDate(e.target.value); changed(); }} /></label>
              <p className="text-muted-foreground sm:col-span-2">El contacto y esta acción se guardan al empezar la entrevista, para no perderlo de vista.</p>
            </div></details>}
          </>}
          {!loaded && <p role="status" className="text-sm text-muted-foreground">Cargando contactos y responsables…</p>}
        </fieldset>
        {uncertain && <Notice title="Todavía no se pudo confirmar el guardado">Reintenta con los mismos datos antes de cambiarlos, para no registrar dos veces al contacto.</Notice>}
      </>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
    <div className={s.footer}><div className={s.footerRow}>
      {step === 2 && !correctionOf ? <Button variant="ghost" disabled={busy} onClick={() => setStep(1)}><ArrowLeft size={16} aria-hidden="true" />Atrás</Button> : <span />}
      {step === 1 ? <Button variant="primary" disabled={!intent} onClick={() => setStep(2)}>Continuar<ArrowRight size={16} aria-hidden="true" /></Button>
        : buyer ? <Button variant="primary" disabled={!config} onClick={toProfile}>Continuar con lo que busca<ArrowRight size={16} aria-hidden="true" /></Button>
        : <Button variant="primary" disabled={busy || !intent || !config} onClick={() => void start()}>{busy ? "Guardando…" : uncertain ? "Reintentar con los mismos datos" : intent === "vender" || intent === "arrendar" ? "Continuar con los datos del prospecto" : "Continuar con la entrevista"}<ArrowRight size={16} aria-hidden="true" /></Button>}
    </div></div>
    </div>
    {pending.length > 0 && step === 1 && <aside className={s.aside} aria-label="Entrevistas por terminar"><PendingCard pending={pending} /></aside>}
    </div>
  </div>;
}

/** Entrevistas a medias: se retoman desde aquí sin volver a capturar al contacto. */
function PendingCard({ pending }: { pending: OperationalInterview[] }) {
  return <Card as="div" className="flex flex-col gap-2 p-4 text-sm">
    <p className="font-semibold">También tienes {pending.length === 1 ? "una entrevista" : `${pending.length} entrevistas`} por terminar.</p>
    <ul className="flex flex-col gap-1">{pending.slice(0, 5).map(p => <li key={p.id}><Link className="inline-flex min-h-9 items-center font-semibold text-[var(--primary-text)] underline underline-offset-4" href={`/admin/operaciones/nueva?entrevista=${encodeURIComponent(p.id)}`}>{p.contacto.nombre} · {intentTitle(p.intencion)}</Link></li>)}</ul>
  </Card>;
}
