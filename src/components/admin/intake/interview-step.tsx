"use client";
import * as React from "react";
import { ArrowLeft, ArrowRight, Check, Info } from "@/components/admin/icons";
import { Button, Card } from "@/components/admin/kit";
import { inputClass, selectClass, textareaClass } from "@/components/admin/ui";
import { apiRequest, db, errorMessage, useCollection } from "@/lib/admin/store";
import { operationalDate } from "@/lib/admin/operational-date";
import { interviewIssues, isOwnerIntent, type InterviewAnswers, type OperationalInterview } from "@/lib/intake/interview";
import { DONT_KNOW, dontKnowValue, firstOpenScreen, interviewScreens, optionLabel, PROSPECT_SCREEN, screenFields, screenIssues, withProspectDefaults } from "@/lib/intake/wizard";
import { cn } from "@/lib/utils";
import s from "./wizard.module.css";
import { MoneyInput } from "@/components/admin/money-input";

type Field = ReturnType<typeof screenFields>[number];

/**
  Paso 3: la entrevista, una pantalla a la vez. «Continuar» guarda el borrador;
  «Terminar entrevista» la completa y entonces se crea la operación.
*/
export function InterviewStep({ interview, onSaved, onDone, onLater, onDirtyChange }: {
  interview: OperationalInterview; onSaved: (interview: OperationalInterview) => void; onDone: (interview: OperationalInterview) => void;
  onLater: () => void; onDirtyChange: (dirty: boolean, busy: boolean) => void;
}) {
  const properties = useCollection(db.propiedades);
  const intent = interview.intencion, owner = isOwnerIntent(intent), correction = !!interview.anterior_id;
  const [answers, setAnswers] = React.useState<InterviewAnswers>(() => withProspectDefaults(intent, { ...interview.respuestas, ...(interview.respuestas.fecha ? {} : { fecha: operationalDate() }) }));
  const screens = interviewScreens(intent);
  const [index, setIndex] = React.useState(() => firstOpenScreen(intent, interview.respuestas));
  const [validate, setValidate] = React.useState(false);
  const [busy, setBusy] = React.useState(false), [error, setError] = React.useState(""), [notice, setNotice] = React.useState("");
  const saving = React.useRef(false), heading = React.useRef<HTMLHeadingElement>(null);
  const dirty = JSON.stringify(answers) !== JSON.stringify(interview.respuestas);
  React.useEffect(() => { onDirtyChange(dirty, busy); }, [dirty, busy, onDirtyChange]);
  const screen = screens[index], last = index === screens.length - 1, prospect = screen.title === PROSPECT_SCREEN;
  const fields = screenFields(intent, answers, screen);
  const issues = validate ? screenIssues(intent, answers, screen) : [];
  // Al contestar se borra el aviso «Te falta»; lo pendiente sigue marcado junto a cada pregunta.
  const set = (key: string, value: string) => { setAnswers(old => ({ ...old, [key]: value })); setNotice(""); setError(""); };

  async function persist(complete: boolean) {
    if (saving.current) return null;
    saving.current = true; setBusy(true); setError("");
    try {
      const r = await apiRequest<{ entrevista: OperationalInterview }>(`/api/admin/entrevistas/${interview.id}`, "PUT", { version: interview.version, respuestas: answers, completar: complete });
      onSaved(r.entrevista); setAnswers(r.entrevista.respuestas);
      return r.entrevista;
    } catch (cause) { setError(`No se pudo guardar: ${errorMessage(cause)}`); return null; }
    finally { saving.current = false; setBusy(false); }
  }
  function go(next: number) {
    setIndex(next); setValidate(false); setError("");
    requestAnimationFrame(() => { heading.current?.focus(); window.scrollTo({ top: 0, behavior: "instant" }); });
  }
  function showMissing(missing: Array<{ key: string; message: string }>) {
    setValidate(true);
    setError(`Te falta: ${missing.map(m => m.message).join(" · ")}`);
    document.getElementById(`pregunta-${missing[0].key}`)?.focus();
  }
  async function next() {
    const missing = screenIssues(intent, answers, screen);
    if (missing.length) { showMissing(missing); return; }
    if (dirty && !await persist(false)) return;
    go(index + 1);
  }
  async function finish() {
    const target = screens.findIndex(sc => screenIssues(intent, answers, sc).length > 0);
    if (target >= 0) {
      if (target !== index) { go(target); setValidate(true); setError(`Te falta: ${screenIssues(intent, answers, screens[target]).map(m => m.message).join(" · ")}`); return; }
      showMissing(screenIssues(intent, answers, screen)); return;
    }
    const missing = interviewIssues(intent, answers);
    if (missing.length) { showMissing(missing); return; }
    const done = await persist(true);
    if (!done) return;
    await Promise.allSettled([db.leads.load(), db.clientes.load(), db.tareas.load(), db.propiedades.load()]);
    onDone(done);
  }
  async function later() {
    if (dirty && !await persist(false)) return;
    setNotice("Guardado");
    onLater();
  }

  function control(field: Field) {
    const id = `pregunta-${field.key}`, value = answers[field.key] ?? "", invalid = issues.some(i => i.key === field.key);
    const unknown = dontKnowValue(intent, field);
    const locked = correction && field.section === "Siguiente paso";
    if (field.options) return <div role="radiogroup" id={id} tabIndex={-1} aria-labelledby={`${id}-label`} aria-invalid={invalid || undefined} className={s.chips}>
      {field.options.map(option => <button key={option} type="button" role="radio" aria-checked={value === option} disabled={busy} className={s.chip} onClick={() => set(field.key, option)}>{optionLabel(field, option)}</button>)}
    </div>;
    const isUnknown = !!unknown && value === DONT_KNOW;
    const common = { id, disabled: busy || isUnknown, readOnly: locked, "aria-invalid": invalid || undefined, "aria-describedby": field.hint ? `ayuda-${field.key}` : undefined };
    const input = field.type === "textarea"
      ? <textarea {...common} rows={3} maxLength={2000} className={textareaClass} value={isUnknown ? "" : value} onChange={e => set(field.key, e.target.value)} />
      : field.type === "number" ? <MoneyInput {...common} className={cn(inputClass, "max-w-[14rem]")} value={isUnknown || value === "" ? "" : Number(value)} onValueChange={next => set(field.key, next === "" ? "" : String(next))} />
      : <input {...common} type={field.type ?? "text"} maxLength={2000} className={inputClass} value={isUnknown ? "" : value} onChange={e => set(field.key, e.target.value)} />;
    if (!unknown) return input;
    return <div className={s.withDontKnow}>{input}<label className={s.dontKnow}><input type="checkbox" checked={isUnknown} disabled={busy} onChange={e => set(field.key, e.target.checked ? DONT_KNOW : "")} />No sabe</label></div>;
  }

  return <>
    <div className={s.body}>
      <ol className={s.substeps} aria-label="Partes de la entrevista">{screens.map((sc, i) => <li key={sc.title}>
        <button type="button" aria-current={i === index ? "step" : undefined} disabled={busy || i > index} onClick={() => go(i)}>{i < index ? <Check size={14} aria-hidden="true" /> : <span className="font-mono text-xs">{i + 1}</span>}{sc.title}</button>
      </li>)}</ol>
      <h1 ref={heading} tabIndex={-1} className={s.title}>{screen.title}</h1>
      <p className={s.lead}>{interview.contacto.nombre}. {prospect ? "Lo básico del primer contacto: la entrevista completa se hace en persona." : "Si no sabe algo, márcalo y seguimos; lo completas después."}</p>
      {!correction && <p className="flex items-start gap-2 text-sm text-muted-foreground"><Info size={16} aria-hidden="true" className="mt-0.5 shrink-0" />{prospect ? "Al guardar el prospecto se crea la operación en la etapa Prospecto. Si lo guardas para después, lo encuentras en Hoy, en «Entrevistas por terminar»." : "La operación se crea al terminar la entrevista. Si la guardas para después, la encuentras en Hoy, en «Entrevistas por terminar»."}</p>}
      {correction && <p className="text-sm text-muted-foreground">Estás corrigiendo una entrevista ya terminada. La anterior se conserva en la operación.</p>}
      {owner && (screen.title === "El inmueble" || prospect) && !correction && <Card as="div" className="p-4">
        <label className="flex flex-col gap-2 text-sm font-semibold">¿Ya tenemos este inmueble registrado?<select className={selectClass} value={answers.propiedadExistente ?? ""} disabled={busy} onChange={e => set("propiedadExistente", e.target.value)}><option value="">No, registrar uno nuevo con estos datos</option>{properties.map(p => <option key={p.slug} value={p.slug}>{p.codigo} · {p.titulo}</option>)}</select></label>
        <p className="mt-2 text-sm text-muted-foreground">Elígelo solo si es la misma unidad; compartir dirección no basta. Las medidas y las fotos se capturan en el levantamiento.</p>
      </Card>}
      <Card as="div" className="flex flex-col gap-6 p-5 sm:p-7">
        {fields.map(field => <div key={field.key} className={s.question}>
          {field.options ? <span id={`pregunta-${field.key}-label`} className={s.questionLabel}>{field.label}</span> : <label htmlFor={`pregunta-${field.key}`}>{field.label}</label>}
          {control(field)}
          {field.hint && <p id={`ayuda-${field.key}`} className="text-sm text-muted-foreground">{field.hint}</p>}
          {issues.some(i => i.key === field.key) && <p className={s.invalid}>{issues.find(i => i.key === field.key)?.message}</p>}
        </div>)}
      </Card>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
    </div>
    <div className={s.footer}><div className={s.footerRow}>
      {index > 0 ? <Button variant="ghost" disabled={busy} onClick={() => go(index - 1)}><ArrowLeft size={16} aria-hidden="true" />Atrás</Button> : <span />}
      <Button disabled={busy} onClick={() => void later()}>{busy ? "Guardando…" : "Guardar y seguir después"}</Button>
      {last ? <Button variant="primary" disabled={busy} onClick={() => void finish()}>{correction ? "Terminar corrección" : prospect ? "Guardar prospecto" : "Terminar entrevista"}<ArrowRight size={16} aria-hidden="true" /></Button>
        : <Button variant="primary" disabled={busy} onClick={() => void next()}>Continuar<ArrowRight size={16} aria-hidden="true" /></Button>}
    </div></div>
  </>;
}
