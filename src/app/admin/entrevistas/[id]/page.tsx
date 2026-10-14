"use client";
import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Save,
} from "lucide-react";
import { apiRequest, db } from "@/lib/admin/store";
import { operationalDate } from "@/lib/admin/operational-date";
import {
  INTENTS,
  interviewFields,
  interviewIssues,
  answerLabel,
  fieldInPhase,
  isOwnerIntent,
  phaseIssues,
  type InterviewAnswers,
  type OperationalInterview,
  type OwnerPhase,
} from "@/lib/intake/interview";
import {
  PageHeader,
  btnPrimary,
  btnGhost,
  inputClass,
  selectClass,
  textareaClass,
} from "@/components/admin/ui";
import { useInterviewGuard } from "@/components/admin/intake/use-interview-guard";
export default function InterviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  return <InterviewEditor key={id} id={id} />;
}
function InterviewEditor({ id }: { id: string }) {
  const [interview, setInterview] = React.useState<OperationalInterview | null>(
      null,
    ),
    [answers, setAnswers] = React.useState<InterviewAnswers>({}),
    [busy, setBusy] = React.useState(false),
    [error, setError] = React.useState(""),
    [notice, setNotice] = React.useState(""),
    [validate, setValidate] = React.useState(false),
    [phase, setPhase] = React.useState<OwnerPhase>("persona");
  const saving = React.useRef(false);
  const completed = interview?.estado === "completada";
  const dirty =
    !!interview &&
    interview.estado === "borrador" &&
    JSON.stringify(answers) !== JSON.stringify(interview.respuestas);
  useInterviewGuard(dirty, busy);
  React.useEffect(() => {
    let active = true;
    apiRequest<{ entrevista: OperationalInterview }>(
      "/api/admin/entrevistas/" + id,
    )
      .then((r) => {
        if (active) {
          const respuestas = {
            ...r.entrevista.respuestas,
            ...(!r.entrevista.respuestas.fecha
              ? { fecha: operationalDate() }
              : {}),
          };
          setInterview(r.entrevista);
          setAnswers(respuestas);
          if (
            isOwnerIntent(r.entrevista.intencion) &&
            phaseIssues(r.entrevista.intencion, respuestas, "persona")
              .length === 0
          )
            setPhase("inmueble");
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [id]);
  React.useEffect(() => {
    if (interview?.estado === "completada")
      document.getElementById("entrevista-resultado")?.focus();
  }, [interview?.estado]);
  async function save(complete: boolean) {
    if (!interview || saving.current || completed) return false;
    const owner = isOwnerIntent(interview.intencion);
    const issues = interviewIssues(interview.intencion, answers);
    setValidate(complete);
    if (complete && issues.length) {
      setError("Faltan respuestas para continuar. Puedes guardar el borrador.");
      const missing = issues[0];
      const section =
        interviewFields(interview.intencion).find(
          (field) => field.key === missing.key,
        )?.section ?? "";
      if (owner && fieldInPhase(section, "persona")) setPhase("persona");
      else if (owner) setPhase("inmueble");
      document.getElementById("pregunta-" + missing.key)?.focus();
      return false;
    }
    saving.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const r = await apiRequest<{ entrevista: OperationalInterview }>(
        "/api/admin/entrevistas/" + id,
        "PUT",
        {
          version: interview.version,
          respuestas: answers,
          completar: complete,
        },
      );
      setInterview(r.entrevista);
      setAnswers(r.entrevista.respuestas);
      setValidate(false);
      setNotice(
        complete
          ? r.entrevista.anterior_id
            ? "Corrección guardada. La entrevista anterior se conserva."
            : owner
              ? "Entrevista completada. La casa quedó capturada en el expediente."
              : "Entrevista completada. El expediente y la próxima tarea están listos."
          : "Borrador guardado. Puedes salir y continuar después.",
      );
      if (complete) {
        const reload = await Promise.allSettled(
          [db.leads, db.clientes, db.tareas, db.propiedades]
            .filter((store) => store)
            .map((store) => store.load()),
        );
        if (reload.some((r) => r.status === "rejected"))
          setNotice(
            "Entrevista completada. Recarga las listas del panel para ver los nuevos vínculos.",
          );
        document.getElementById("entrevista-resultado")?.focus();
      }
      return true;
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo guardar la entrevista.",
      );
      return false;
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  async function continueProperty() {
    if (!interview || completed) return;
    const pending = phaseIssues(interview.intencion, answers, "persona");
    setValidate(true);
    if (pending.length) {
      setError("Faltan respuestas para continuar. Puedes guardar el borrador.");
      document.getElementById("pregunta-" + pending[0].key)?.focus();
      return;
    }
    if (dirty) {
      const saved = await save(false);
      if (!saved) return;
      setNotice("");
    }
    setValidate(false);
    setError("");
    setPhase("inmueble");
    document.getElementById("paso-inmueble")?.focus();
  }
  if (!interview)
    return (
      <div className="space-y-4">
        <PageHeader title="Entrevista del prospecto" />
        {error ? (
          <>
            <p role="alert" className="text-destructive">
              {error}
            </p>
            <button
              className={btnGhost}
              onClick={() => window.location.reload()}
            >
              Reintentar carga
            </button>
          </>
        ) : (
          <p role="status">Cargando entrevista…</p>
        )}
        <Link href="/admin/operaciones/nueva" className={btnGhost}>
          Volver a operaciones
        </Link>
      </div>
    );
  if (interview.estado === "cancelada")
    return (
      <div className="space-y-4">
        <PageHeader
          title="Captura anterior conservada"
          description="El contacto, responsable o inmueble de la operación cambió. Prepara una entrevista del contexto actual desde el expediente."
        />
        <Link
          href={"/admin/expedientes?expediente=" + interview.expediente_id}
          className={btnPrimary}
        >
          Abrir expediente
        </Link>
      </div>
    );
  const owner = isOwnerIntent(interview.intencion);
  const spouse = answers.estadoCivil === "casado";
  const fields = interviewFields(interview.intencion)
    .filter(
      (f) =>
        !["importe", "moneda"].includes(f.key) ||
        answers.presupuestoEstado === "conocido",
    )
    .filter(
      (f) => f.key !== "detalleAlertas" || answers.alertas === "declaradas",
    )
    .filter(
      (f) =>
        !["conyuge", "regimen", "fechaMatrimonio", "lugarMatrimonio"].includes(
          f.key,
        ) || spouse,
    )
    .filter(
      (f) => completed || !owner || fieldInPhase(f.section, phase),
    );
  const sections = [...new Set(fields.map((f) => f.section))],
    issues = interviewIssues(interview.intencion, answers);
  const mandatory = fields.filter(
      (f) =>
        f.required ||
        (spouse && (f.key === "conyuge" || f.key === "regimen")),
    ),
    answered = mandatory.filter((f) => !!answers[f.key]?.trim()).length;
  const expHref = interview.expediente_id
    ? "/admin/expedientes?expediente=" + interview.expediente_id
    : undefined;
  return (
    <div className="mx-auto min-w-0 max-w-5xl space-y-5">
      <Link
        href={
          expHref ??
          (interview.lead_id
            ? "/admin/leads/" + interview.lead_id
            : interview.cliente_id
              ? "/admin/clientes/" + interview.cliente_id
              : "/admin/operaciones/nueva")
        }
        className={btnGhost}
      >
        <ArrowLeft size={16} />{" "}
        {expHref
          ? "Volver al expediente"
          : interview.lead_id
            ? "Volver al prospecto"
            : "Volver al cliente"}
      </Link>
      <PageHeader
        title={"Entrevista · " + INTENTS[interview.intencion].role}
        description={
          owner
            ? "Primero la persona. Después los datos de la casa nueva. Las medidas y las fotos se capturan en la visita."
            : "Captura lo que declara la persona. La revisión de documentos y la viabilidad se realizan después."
        }
      />
      {owner && !completed && (
        <ol aria-label="Captación" className="flex flex-wrap gap-3 text-sm">
          <li className="text-muted-foreground">1. Perfil</li>
          <li className="text-muted-foreground">2. Contacto</li>
          <li
            aria-current={phase === "persona" ? "step" : undefined}
            className={
              phase === "persona"
                ? "font-semibold text-primary-ink"
                : "text-muted-foreground"
            }
          >
            3. Persona
          </li>
          <li
            id="paso-inmueble"
            tabIndex={-1}
            aria-current={phase === "inmueble" ? "step" : undefined}
            className={
              phase === "inmueble"
                ? "font-semibold text-primary-ink"
                : "text-muted-foreground"
            }
          >
            4. Inmueble
          </li>
        </ol>
      )}
      <section
        className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-border bg-card p-5"
        aria-label="Contacto de la entrevista"
      >
        <div className="min-w-0">
          <h2 className="display-soft text-2xl">{interview.contacto.nombre}</h2>
          <p className="mt-1 break-words text-sm text-muted-foreground">
            {interview.contacto.telefono}
            {interview.contacto.email ? " · " + interview.contacto.email : ""}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {completed ? "Entrevista conservada" : "Borrador"} · Versión{" "}
            {interview.version}
            {interview.anterior_id
              ? " · Corrección de una entrevista anterior"
              : ""}
          </p>
        </div>
        <ClipboardList
          size={28}
          className="text-primary-ink"
          aria-hidden="true"
        />
      </section>
      {completed && (
        <section
          id="entrevista-resultado"
          tabIndex={-1}
          className="space-y-3 rounded-lg border border-primary/40 bg-primary/10 p-5"
          aria-label="Entrevista completada"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={20} aria-hidden="true" />
            <h2 className="font-semibold">Entrevista completada</h2>
          </div>
          <p className="text-sm">
            {interview.anterior_id
              ? "La corrección se guardó en el mismo expediente."
              : owner
                ? "La casa quedó registrada como inmueble privado. El levantamiento de medidas y fotos se hace en documentos, cuando visites la propiedad."
                : "Puedes continuar con la evaluación y preparación de la operación."}{" "}
            Los documentos, la titularidad y los recursos todavía deben
            comprobarse.
          </p>
          {["arrendar", "rentar"].includes(interview.intencion) && (
            <p className="text-sm">
              El seguimiento del arrendamiento continúa con tareas y documentos
              en el expediente.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {expHref && (
              <Link href={expHref} className={btnPrimary}>
                Continuar en el expediente <ArrowRight size={16} />
              </Link>
            )}
            <Link
              className={btnGhost}
              href={
                "/admin/operaciones/nueva?" +
                new URLSearchParams({
                  intencion: interview.intencion,
                  clienteId: interview.cliente_id ?? "",
                  expedienteId: interview.expediente_id ?? "",
                })
              }
            >
              Corregir entrevista
            </Link>
            {interview.anterior_id && (
              <Link
                className={btnGhost}
                href={"/admin/entrevistas/" + interview.anterior_id}
              >
                Ver entrevista anterior
              </Link>
            )}
          </div>
        </section>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm text-primary-ink">
          {notice}
        </p>
      )}
      {!completed && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span>
            {answered} de {mandatory.length} preguntas necesarias respondidas
          </span>
          <span className="text-muted-foreground">
            {dirty ? "Cambios sin guardar" : "Respuestas guardadas"}
          </span>
        </div>
      )}
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void save(false);
        }}
        className="space-y-4"
      >
        <fieldset disabled={busy || completed} className="min-w-0 space-y-4">
          {sections.map((section, n) => (
            <section
              key={section}
              className="rounded-lg border border-border bg-card p-4 sm:p-6"
            >
              <h2 className="mb-5 flex items-center gap-3 text-lg font-semibold">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm text-primary-ink">
                  {n + 1}
                </span>
                {section}
              </h2>
              {interview.anterior_id && section === "Siguiente paso" && (
                <p className="mb-4 text-sm text-muted-foreground">
                  Se conserva la acción acordada en la entrevista inicial. Para
                  cambiar su fecha o contenido, abre Tareas en el expediente.
                </p>
              )}
              <div className="grid min-w-0 gap-5 sm:grid-cols-2">
                {fields
                  .filter((f) => f.section === section)
                  .map((f) => {
                    const invalid =
                      validate && issues.some((i) => i.key === f.key);
                    return (
                      <div
                        key={f.key}
                        className={f.type === "textarea" ? "sm:col-span-2" : ""}
                      >
                        <label
                          htmlFor={"pregunta-" + f.key}
                          className="mb-1.5 block text-sm font-medium"
                        >
                          {f.label}
                          {(f.required ||
                            (spouse &&
                              (f.key === "conyuge" || f.key === "regimen"))) && (
                            <span className="text-muted-foreground"> *</span>
                          )}
                        </label>
                        {f.options ? (
                          <select
                            id={"pregunta-" + f.key}
                            className={selectClass}
                            aria-invalid={invalid || undefined}
                            aria-describedby={
                              f.hint ? "ayuda-" + f.key : undefined
                            }
                            value={answers[f.key] ?? ""}
                            onChange={(e) =>
                              setAnswers((a) => ({
                                ...a,
                                [f.key]: e.target.value,
                              }))
                            }
                          >
                            <option value="">Selecciona</option>
                            {f.options.map((v) => (
                              <option key={v} value={v}>
                                {answerLabel(v)}
                              </option>
                            ))}
                          </select>
                        ) : f.type === "textarea" ? (
                          <textarea
                            id={"pregunta-" + f.key}
                            maxLength={2000}
                            rows={3}
                            className={textareaClass}
                            aria-invalid={invalid || undefined}
                            aria-describedby={
                              f.hint ? "ayuda-" + f.key : undefined
                            }
                            value={answers[f.key] ?? ""}
                            onChange={(e) =>
                              setAnswers((a) => ({
                                ...a,
                                [f.key]: e.target.value,
                              }))
                            }
                          />
                        ) : (
                          <input
                            id={"pregunta-" + f.key}
                            readOnly={
                              !!interview.anterior_id &&
                              f.section === "Siguiente paso"
                            }
                            type={f.type ?? "text"}
                            min={f.type === "number" ? "0.01" : undefined}
                            step={f.type === "number" ? "0.01" : undefined}
                            maxLength={2000}
                            className={inputClass}
                            aria-invalid={invalid || undefined}
                            aria-describedby={
                              f.hint ? "ayuda-" + f.key : undefined
                            }
                            value={answers[f.key] ?? ""}
                            onChange={(e) =>
                              setAnswers((a) => ({
                                ...a,
                                [f.key]: e.target.value,
                              }))
                            }
                          />
                        )}{" "}
                        {f.hint && (
                          <p
                            id={"ayuda-" + f.key}
                            className="mt-2 text-xs leading-relaxed text-muted-foreground"
                          >
                            {f.hint}
                          </p>
                        )}
                        {invalid && (
                          <p className="mt-1 text-xs text-destructive">
                            {issues.find((i) => i.key === f.key)?.message}
                          </p>
                        )}
                      </div>
                    );
                  })}
              </div>
            </section>
          ))}
        </fieldset>
        {!completed && (
          <div className="sticky bottom-0 z-10 flex flex-wrap gap-3 rounded-lg border border-border bg-card p-3 shadow-sm">
            {owner && phase === "inmueble" && (
              <button
                type="button"
                className={btnGhost}
                disabled={busy}
                onClick={() => {
                  setValidate(false);
                  setError("");
                  setPhase("persona");
                }}
              >
                <ArrowLeft size={16} /> Volver a la persona
              </button>
            )}
            <button
              type="submit"
              className={btnGhost}
              disabled={busy || !dirty}
            >
              <Save size={16} />
              {busy ? "Guardando…" : "Guardar borrador"}
            </button>
            {owner && phase === "persona" ? (
              <button
                type="button"
                className={btnPrimary}
                disabled={busy}
                onClick={() => void continueProperty()}
              >
                Continuar con el inmueble <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                className={btnPrimary}
                disabled={busy}
                onClick={() => void save(true)}
              >
                {interview.anterior_id
                  ? "Completar corrección"
                  : owner
                    ? "Guardar y capturar la casa"
                    : interview.expediente_id
                      ? "Guardar entrevista en el expediente"
                      : "Guardar y pasar a evaluación"}{" "}
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
