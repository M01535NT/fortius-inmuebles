"use client";
import { confirmAction } from "@/components/admin/workspace/confirm";

import * as React from "react";
import { errorMessage, uploadFile, type UploadedFile } from "@/lib/admin/store";

/*
  Primitivos utilitarios del panel: mismo sistema de tokens que el sitio,
  vibe más densa y funcional. Sin dependencias nuevas.
*/

export const btnPrimary =
  "admin-button admin-button-primary inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground active:scale-[0.98] disabled:opacity-50";
export const btnGhost =
  "admin-button admin-button-secondary inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary active:scale-[0.98]";
export const btnDanger =
  "inline-flex min-h-11 items-center justify-center rounded-md border border-destructive/40 px-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10";
export const inputClass =
  "min-h-11 min-w-0 w-full rounded-md border border-input bg-background px-3 text-base text-foreground placeholder:text-muted-foreground";
export const textareaClass =
  "min-w-0 w-full rounded-md border border-input bg-background px-3 py-2.5 text-base text-foreground placeholder:text-muted-foreground";
export const selectClass =
  "min-h-11 min-w-0 w-full rounded-md border border-input bg-background px-2.5 text-base text-foreground";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="admin-page-header flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
      <div className="min-w-0">
        <h1 className="display-title text-3xl text-foreground">{title.replace(/\.$/, "")}</h1>
        {description ? (
          <p className="mt-2 max-w-[64ch] text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={"flex flex-col gap-1.5 " + (className ?? "")}>
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium text-foreground"
      >
        {label}
      </label>
      {children}
      {hint ? (
        <p className="text-sm leading-relaxed text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "green" | "amber" | "red";
}) {
  const tones = {
    neutral: "border-border bg-secondary text-foreground/80",
    green: "border-primary/40 bg-primary/10 text-primary-ink",
    amber:
      "border-warning-border bg-warning-surface text-warning",
    red: "border-destructive/40 bg-destructive/10 text-destructive",
  } as const;
  return (
    <span
      className={
        "admin-badge inline-flex items-center rounded-sm border px-2 py-0.5 font-mono text-xs uppercase tracking-[0.05em] " +
        tones[tone]
      }
    >
      {children}
    </span>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-10 text-center">
      <p className="display-soft text-lg text-foreground">{title}</p>
      {hint ? (
        <p className="mx-auto mt-2 max-w-[48ch] text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/* Compatibility export for the existing module layouts. */
export function DemoBanner({ show = false }: { show?: boolean }) {
  if (!show) return null;
  return (
    <p className="rounded-md border border-warning-border bg-warning-surface px-3.5 py-2.5 text-sm leading-relaxed text-warning">
      Los inmuebles en borrador solo son visibles para tu equipo.
    </p>
  );
}

export function ErrorNotice({ error }: { error: string | null }) {
  return error ? (
    <p
      role="alert"
      className="w-full rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
    >
      {error}
    </p>
  ) : null;
}

function useMutation() {
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const lock = React.useRef(false);
  async function run(action: () => Promise<unknown> | void) {
    if (lock.current) return false;
    lock.current = true;
    setPending(true);
    setError(null);
    try {
      await action();
      return true;
    } catch (e) {
      setError(errorMessage(e));
      return false;
    } finally {
      lock.current = false;
      setPending(false);
    }
  }
  return { pending, error, run };
}

const UploadPendingContext = React.createContext<(pending: boolean) => void>(
  () => {},
);
export function AsyncForm({
  onSubmit,
  children,
  className,
  ...props
}: Omit<React.FormHTMLAttributes<HTMLFormElement>, "onSubmit"> & {
  ref?: React.Ref<HTMLFormElement>;
  onSubmit: (
    event: React.FormEvent<HTMLFormElement>,
  ) => Promise<unknown> | void;
}) {
  const mutation = useMutation();
  const [uploading, setUploading] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const errorTarget = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!mutation.error) return;
    errorTarget.current?.focus({ preventScroll: true });
    errorTarget.current?.scrollIntoView?.({ block: "nearest" });
  }, [mutation.error]);
  return (
    <UploadPendingContext.Provider value={setUploading}>
      <form
        {...props}
        aria-busy={mutation.pending || uploading}
        onInputCapture={(event) => { setSaved(false); props.onInputCapture?.(event); (event.target as HTMLElement).removeAttribute("aria-invalid"); }}
        onInvalidCapture={(event) => { (event.target as HTMLElement).setAttribute("aria-invalid", "true"); props.onInvalidCapture?.(event); }}
        onSubmit={async (e) => {
          e.preventDefault();
          if (!uploading) { setSaved(false); const ok = await mutation.run(() => onSubmit(e)); setSaved(ok === true); }
        }}
      >
        <fieldset
          disabled={mutation.pending || uploading}
          className={"min-w-0 " + (className ?? "")}
        >
          {children}
          {saved && <p role="status" className="admin-saved w-full text-sm">Cambios guardados.</p>}
          {mutation.pending ? (
            <p role="status" className="w-full text-sm text-muted-foreground">
              Guardando…
            </p>
          ) : null}
          {mutation.error ? (
            <div ref={errorTarget} tabIndex={-1} className="scroll-mt-24 scroll-mb-8">
              <ErrorNotice error={mutation.error} />
            </div>
          ) : null}
        </fieldset>
      </form>
    </UploadPendingContext.Provider>
  );
}
export function AsyncButton({
  onClick,
  children,
  ...props
}: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> & {
  onClick: () => Promise<unknown> | void;
}) {
  const mutation = useMutation();
  return (
    <span className="inline-flex min-w-0 flex-col gap-1">
      <button
        {...props}
        className={"min-h-11 min-w-11 " + (props.className ?? "")}
        disabled={props.disabled || mutation.pending}
        aria-busy={mutation.pending}
        onClick={async () => {
          await mutation.run(onClick);
        }}
      >
        {children}
      </button>
      <ErrorNotice error={mutation.error} />
    </span>
  );
}
export function AsyncSelect({
  onChange,
  ...props
}: Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange"> & {
  onChange: (value: string) => Promise<unknown>;
}) {
  const mutation = useMutation();
  return (
    <div>
      <select
        {...props}
        disabled={props.disabled || mutation.pending}
        aria-busy={mutation.pending}
        onChange={async (e) => {
          const value = e.currentTarget.value;
          await mutation.run(() => onChange(value));
        }}
      />
      <ErrorNotice error={mutation.error} />
    </div>
  );
}
export function UploadControl({
  onUploaded,
  accept,
  label = "Subir archivo",
  publicOnly = false,
  capture,
}: {
  onUploaded: (file: UploadedFile) => Promise<unknown> | void;
  accept?: string;
  label?: string;
  publicOnly?: boolean;
  capture?: "user" | "environment";
}) {
  const [visibility, setVisibility] = React.useState<"private" | "public">(
    "private",
  );
  const notifyPending = React.useContext(UploadPendingContext);
  const mutation = useMutation();
  const id = React.useId();
  return (
    <div className="space-y-2 rounded-md border border-border p-3">
      <Field
        label={label}
        htmlFor={id}
        hint={
          publicOnly
            ? "Material público. No subas identificaciones, escrituras ni documentos confidenciales."
            : "Privado por defecto. Máximo 20 MB; el servidor valida el contenido."
        }
      >
        <input
          id={id}
          type="file"
          capture={capture}
          accept={
            accept ??
            "image/jpeg,image/png,image/webp,image/gif,application/pdf,video/mp4,video/webm"
          }
          disabled={mutation.pending}
          className={inputClass + " h-auto min-h-11 py-2"}
          onChange={async (e) => {
            const input = e.currentTarget;
            const file = input.files?.[0];
            if (!file) return;
            if (
              publicOnly &&
              !await confirmAction(
                "Este archivo será público. ¿Confirmas que puede difundirse?",
              )
            ) {
              input.value = "";
              return;
            }
            notifyPending(true);
            try {
              await mutation.run(async () => {
                const result = await uploadFile(
                  file,
                  publicOnly ? "public" : visibility,
                );
                await onUploaded(result);
                input.value = "";
              });
            } finally {
              notifyPending(false);
            }
          }}
        />
      </Field>
      {!publicOnly ? (
        <Field label="Visibilidad de la carga" htmlFor={id + "-visibility"}>
          <select
            id={id + "-visibility"}
            value={visibility}
            disabled={mutation.pending}
            className={selectClass}
            onChange={(e) =>
              setVisibility(e.target.value as "private" | "public")
            }
          >
            <option value="private">Privado (solo personal autorizado)</option>
            <option value="public">Público (accesible por enlace)</option>
          </select>
        </Field>
      ) : null}
      {mutation.pending ? (
        <p role="status" className="text-sm text-muted-foreground">
          Cargando y validando…
        </p>
      ) : null}
      <ErrorNotice error={mutation.error} />
    </div>
  );
}
