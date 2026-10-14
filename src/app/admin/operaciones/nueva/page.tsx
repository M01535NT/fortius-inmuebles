"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  KeyRound,
  Search,
  TrendingUp,
  UserRound,
} from "lucide-react";
import {
  AdminApiError,
  apiRequest,
  db,
  useCollection,
  useLoadState,
} from "@/lib/admin/store";
import {
  INTENTS,
  type IntakeIntent,
  type OperationalInterview,
} from "@/lib/intake/interview";
import {
  PageHeader,
  btnPrimary,
  btnGhost,
  inputClass,
  selectClass,
} from "@/components/admin/ui";
import { useInterviewGuard } from "@/components/admin/intake/use-interview-guard";
const icons = {
  vender: Building2,
  arrendar: KeyRound,
  comprar: Search,
  rentar: KeyRound,
  invertir: TrendingUp,
};
export default function NewOperation() {
  const router = useRouter(),
    leads = useCollection(db.leads),
    clients = useCollection(db.clientes),
    advisers = useCollection(db.asesores);
  const leadState = useLoadState(db.leads),
    clientState = useLoadState(db.clientes),
    adviserState = useLoadState(db.asesores);
  const [query] = React.useState(() =>
    typeof window === "undefined"
      ? new URLSearchParams()
      : new URLSearchParams(window.location.search),
  );
  const seed = query.get("intencion");
  const [intent, setIntent] = React.useState<IntakeIntent | null>(
    seed && Object.hasOwn(INTENTS, seed) ? (seed as IntakeIntent) : null,
  );
  const [step, setStep] = React.useState(1),
    [kind, setKind] = React.useState(
      query.has("clienteId") || query.has("leadId") ? "existente" : "nuevo",
    );
  const [selection, setSelection] = React.useState(
    query.has("clienteId")
      ? "cliente:" + query.get("clienteId")
      : query.has("leadId")
        ? "lead:" + query.get("leadId")
        : "",
  );
  const [name, setName] = React.useState(""),
    [phone, setPhone] = React.useState(""),
    [email, setEmail] = React.useState(""),
    [adviser, setAdviser] = React.useState(""),
    [shared, setShared] = React.useState(false);
  const [config, setConfig] = React.useState<{
      administrador: boolean;
      asesorId: string | null;
    } | null>(null),
    [pending, setPending] = React.useState<OperationalInterview[]>([]);
  const [uncertain, setUncertain] = React.useState(false);
  const [busy, setBusy] = React.useState(false),
    [error, setError] = React.useState("");
  const requestId = React.useRef<string | null>(null),
    sent = React.useRef(false);
  const dirty = !!name || !!phone || !!email;
  const allowRef = useInterviewGuard(dirty, busy);
  React.useEffect(() => {
    let active = true;
    Promise.all([
      apiRequest<{ administrador: boolean; asesorId: string | null }>(
        "/api/admin/entrevistas/config",
      ),
      apiRequest<{ entrevistas: OperationalInterview[] }>(
        "/api/admin/entrevistas",
      ),
    ])
      .then(([c, p]) => {
        if (
          !Array.isArray(p.entrevistas) ||
          typeof c.administrador !== "boolean"
        )
          throw new Error("No se pudo cargar la configuración de captación.");
        if (active) {
          setConfig(c);
          if (c.asesorId) setAdviser(c.asesorId);
          setPending(p.entrevistas);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  const normalized = phone.replace(/\D/g, "");
  const matches =
    normalized.length >= 7
      ? [
          ...leads
            .filter((l) => !l.clienteId)
            .map((l) => ({
              id: l.id,
              nombre: l.nombre,
              telefono: l.telefono,
              tipo: "lead",
            })),
          ...clients.map((c) => ({
            id: c.id,
            nombre: c.nombre,
            telefono: c.telefono,
            tipo: "cliente",
          })),
        ].filter((c) => c.telefono.replace(/\D/g, "") === normalized)
      : [];
  const loaded = leadState.loaded && clientState.loaded && adviserState.loaded;
  async function start(e: React.FormEvent) {
    e.preventDefault();
    if (!intent || busy || sent.current) return;
    setError("");
    if (kind === "nuevo" && (!loaded || !config)) {
      setError("Espera a que carguen los contactos y responsables.");
      return;
    }
    if (kind === "nuevo" && matches.length && !shared) {
      setError("Revisa las coincidencias o confirma que es otra persona.");
      return;
    }
    if (kind === "existente") {
      const current = pending.find(
        (p) =>
          p.intencion === intent &&
          (query.get("expedienteId")
            ? p.expediente_id === query.get("expedienteId")
            : selection.startsWith("lead:")
              ? p.lead_id === selection.slice(5)
              : p.cliente_id === selection.slice(8)),
      );
      if (current) {
        allowRef.current = true;
        router.push("/admin/entrevistas/" + current.id);
        return;
      }
    }
    if (!requestId.current) requestId.current = crypto.randomUUID();
    sent.current = true;
    setBusy(true);
    const contacto =
      kind === "nuevo"
        ? {
            tipo: "nuevo",
            nombre: name.trim(),
            telefono: phone.trim(),
            email: email.trim(),
            asesorId: adviser,
            telefonoCompartido: shared,
          }
        : {
            tipo: selection.split(":")[0],
            id: selection.slice(selection.indexOf(":") + 1),
          };
    try {
      const r = await apiRequest<{ entrevista: OperationalInterview }>(
        "/api/admin/entrevistas",
        "POST",
        {
          id: requestId.current,
          intencion: intent,
          contacto,
          ...(query.get("expedienteId")
            ? { expedienteId: query.get("expedienteId") }
            : {}),
        },
      );
      allowRef.current = true;
      void db.leads.load().catch(() => {});
      router.push("/admin/entrevistas/" + r.entrevista.id);
    } catch (cause) {
      // A lost acknowledgement must be reconciled before allowing a different creation.
      try {
        const recovered = await apiRequest<{
          entrevista: OperationalInterview;
        }>("/api/admin/entrevistas/" + requestId.current);
        if (recovered.entrevista) {
          allowRef.current = true;
          router.push("/admin/entrevistas/" + recovered.entrevista.id);
          return;
        }
      } catch {}
      if (kind === "existente")
        try {
          const q = new URLSearchParams(
            query.get("expedienteId")
              ? { expedienteId: query.get("expedienteId")! }
              : selection.startsWith("lead:")
                ? { leadId: selection.slice(5) }
                : { clienteId: selection.slice(8) },
          );
          const available = await apiRequest<{
            entrevistas: OperationalInterview[];
          }>("/api/admin/entrevistas?" + q);
          const current = available.entrevistas.find(
            (p) => p.estado === "borrador" && p.intencion === intent,
          );
          if (current) {
            allowRef.current = true;
            router.push("/admin/entrevistas/" + current.id);
            return;
          }
        } catch {}
      setUncertain(
        !(cause instanceof AdminApiError) ||
          cause.status === 0 ||
          cause.status >= 500,
      );
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo iniciar la entrevista.",
      );
      sent.current = false;
      setBusy(false);
    }
  }
  function changed() {
    if (!sent.current) requestId.current = null;
    setError("");
  }
  return (
    <div className="mx-auto min-w-0 max-w-5xl space-y-6">
      <Link href="/admin" className={btnGhost}>
        <ArrowLeft size={16} /> Volver al resumen
      </Link>
      <PageHeader
        title={
          query.has("expedienteId")
            ? "Preparar entrevista del expediente"
            : "Nueva operación"
        }
        description="Elige un solo perfil. El resto del panel se adapta a esa decisión: contacto, entrevista y siguiente paso."
      />
      <ol
        aria-label="Inicio de la operación"
        className="flex flex-wrap gap-3 text-sm"
      >
        <li
          aria-current={step === 1 ? "step" : undefined}
          className={
            step === 1
              ? "font-semibold text-primary-ink"
              : "text-muted-foreground"
          }
        >
          1. Tipo de operación
        </li>
        <li
          aria-current={step === 2 ? "step" : undefined}
          className={
            step === 2
              ? "font-semibold text-primary-ink"
              : "text-muted-foreground"
          }
        >
          2. Contacto
        </li>
        <li className="text-muted-foreground">
          3. Entrevista
        </li>
      </ol>
      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      {step === 1 ? (
        <section className="space-y-4" aria-label="Tipo de operación">
          <h2 className="display-soft text-2xl">
            ¿Qué necesita esta persona?
          </h2>
          <p className="max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
            Elige un solo perfil para continuar. El resto del panel se adapta a esa decisión.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(INTENTS).map(([key, definition]) => {
              const Icon = icons[key as IntakeIntent];
              return (
                <button
                  key={key}
                  type="button"
                  aria-label={definition.label + " " + definition.role}
                  aria-pressed={intent === key}
                  disabled={busy}
                  onClick={() => {
                    setIntent(key as IntakeIntent);
                    changed();
                  }}
                  className={`min-h-36 rounded-lg border p-5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${intent === key ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/50"}`}
                >
                  <Icon
                    size={24}
                    aria-hidden="true"
                    className="mb-4 text-primary-ink"
                  />
                  <strong className="block text-base">
                    {definition.label}
                  </strong>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {definition.role}
                  </span>
                </button>
              );
            })}
          </div>
          <button
            className={btnPrimary}
            disabled={!intent}
            onClick={() => setStep(2)}
          >
            Continuar con el contacto <ArrowRight size={16} />
          </button>
        </section>
      ) : (
        <form
          onSubmit={start}
          className="rounded-lg border border-border bg-card p-4 sm:p-6"
        >
          <fieldset disabled={busy || uncertain} className="min-w-0 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="display-soft text-2xl">
                  {intent && INTENTS[intent].role}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  El prospecto se guarda antes de iniciar la entrevista.
                </p>
              </div>
              <button
                type="button"
                className={btnGhost}
                onClick={() => setStep(1)}
              >
                Cambiar intención
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              <label className="flex min-h-11 items-center gap-2">
                <input
                  type="radio"
                  name="contact-kind"
                  checked={kind === "nuevo"}
                  disabled={query.has("expedienteId")}
                  onChange={() => {
                    setKind("nuevo");
                    changed();
                  }}
                />{" "}
                Persona nueva
              </label>
              <label className="flex min-h-11 items-center gap-2">
                <input
                  type="radio"
                  name="contact-kind"
                  checked={kind === "existente"}
                  onChange={() => {
                    setKind("existente");
                    changed();
                  }}
                />{" "}
                Ya está en Fortius
              </label>
            </div>
            {kind === "nuevo" ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm">
                    Nombre completo
                    <input
                      required
                      autoComplete="name"
                      className={inputClass}
                      maxLength={160}
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        changed();
                      }}
                    />
                  </label>
                  <label className="text-sm">
                    Teléfono
                    <input
                      required
                      type="tel"
                      autoComplete="tel"
                      className={inputClass}
                      maxLength={40}
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setShared(false);
                        changed();
                      }}
                    />
                  </label>
                  <label className="text-sm">
                    Correo electrónico (opcional)
                    <input
                      type="email"
                      autoComplete="email"
                      className={inputClass}
                      maxLength={254}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        changed();
                      }}
                    />
                  </label>
                  <label className="text-sm">
                    Asesor responsable
                    <select
                      required
                      className={selectClass}
                      value={adviser}
                      onChange={(e) => {
                        setAdviser(e.target.value);
                        changed();
                      }}
                      disabled={!config?.administrador}
                    >
                      <option value="">Selecciona un asesor activo</option>
                      {advisers
                        .filter(
                          (a) =>
                            a.activo &&
                            (config?.administrador ||
                              a.id === config?.asesorId),
                        )
                        .map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.nombre}
                          </option>
                        ))}
                    </select>
                  </label>
                </div>
                {config && !config.administrador && !config.asesorId && (
                  <p role="alert" className="text-sm text-destructive">
                    Tu cuenta necesita un asesor asignado por el administrador.
                  </p>
                )}
                {matches.length > 0 && (
                  <section
                    className="space-y-2 rounded-md border border-warning-border bg-warning-surface p-4"
                    aria-label="Contactos coincidentes"
                  >
                    <p className="font-semibold">
                      Este teléfono ya está registrado
                    </p>
                    {matches.map((c) => (
                      <button
                        type="button"
                        key={c.tipo + c.id}
                        className={btnGhost}
                        onClick={() => {
                          setKind("existente");
                          setSelection(c.tipo + ":" + c.id);
                          changed();
                        }}
                      >
                        Usar contacto: {c.nombre}
                      </button>
                    ))}
                    <label className="flex min-h-11 items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={shared}
                        onChange={(e) => {
                          setShared(e.target.checked);
                          changed();
                        }}
                      />{" "}
                      Es otra persona que comparte ese teléfono; crear un
                      prospecto distinto.
                    </label>
                  </section>
                )}
              </>
            ) : (
              <label className="block text-sm">
                Prospecto o cliente existente
                <select
                  required
                  value={selection}
                  className={selectClass}
                  onChange={(e) => {
                    setSelection(e.target.value);
                    changed();
                  }}
                >
                  <option value="">Selecciona un contacto</option>
                  <optgroup label="Prospectos">
                    {leads
                      .filter((l) => !l.clienteId)
                      .map((l) => (
                        <option key={l.id} value={"lead:" + l.id}>
                          {l.nombre} · {l.telefono}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Clientes">
                    {clients.map((c) => (
                      <option key={c.id} value={"cliente:" + c.id}>
                        {c.nombre} · {c.telefono}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <span className="mt-2 block text-muted-foreground">
                  Se conservan su ficha y sus operaciones anteriores.
                </span>
              </label>
            )}
            {!loaded && (
              <p role="status" className="text-sm text-muted-foreground">
                Cargando contactos y responsables…
              </p>
            )}
            <button
              type="submit"
              className={btnPrimary}
              disabled={
                !loaded ||
                !config ||
                (kind === "nuevo" && !adviser) ||
                (kind === "existente" && !selection)
              }
            >
              {busy
                ? "Preparando entrevista…"
                : "Iniciar entrevista"}{" "}
              <ArrowRight size={16} />
            </button>
          </fieldset>
          {uncertain && (
            <div className="mt-4 space-y-2">
              <p className="text-sm">
                Todavía no se pudo confirmar el guardado. Reintenta la misma
                captura antes de cambiar los datos.
              </p>
              <button type="submit" disabled={busy} className={btnPrimary}>
                Reintentar el mismo guardado
              </button>
            </div>
          )}
        </form>
      )}
      {!!pending.length && (
        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="font-semibold">Entrevistas por terminar</h2>
          <div className="mt-3 space-y-2">
            {pending.slice(0, 8).map((p) => (
              <Link
                key={p.id}
                href={"/admin/entrevistas/" + p.id}
                className="flex min-h-11 flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-2">
                  <UserRound size={16} />
                  {p.contacto.nombre} · {INTENTS[p.intencion].role}
                </span>
                <span className="text-primary-ink">Continuar entrevista →</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
