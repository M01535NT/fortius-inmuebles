"use client";
import * as React from "react";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { apiRequest } from "@/lib/admin/store";
import {
  INTENTS,
  type IntakeIntent,
  type OperationalInterview,
} from "@/lib/intake/interview";
import { btnPrimary, btnGhost } from "@/components/admin/ui";
export function InterviewAccess({
  leadId,
  clienteId,
  expedienteId,
  intencion,
  disabled = false,
}: {
  leadId?: string;
  clienteId?: string;
  expedienteId?: string;
  intencion?: IntakeIntent;
  disabled?: boolean;
}) {
  const [items, setItems] = React.useState<OperationalInterview[]>([]),
    [loading, setLoading] = React.useState(true),
    [error, setError] = React.useState("");
  React.useEffect(() => {
    let active = true;
    const q = new URLSearchParams(
      expedienteId
        ? { expedienteId }
        : leadId
          ? { leadId }
          : { clienteId: clienteId ?? "" },
    );
    apiRequest<{ entrevistas: OperationalInterview[] }>(
      "/api/admin/entrevistas?" + q,
    )
      .then((r) => {
        if (!Array.isArray(r.entrevistas))
          throw new Error("Respuesta inválida");
        if (active) {
          setItems(r.entrevistas);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError("No se pudo consultar la entrevista.");
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [leadId, clienteId, expedienteId]);
  const current = items.find((i) => i.estado === "borrador") ?? items[0];
  const q = new URLSearchParams({
    ...(clienteId || !leadId
      ? { clienteId: clienteId ?? "" }
      : { leadId: leadId ?? "" }),
    ...(expedienteId ? { expedienteId } : {}),
    ...(intencion ? { intencion } : {}),
  });
  return (
    <section
      className="space-y-3 rounded-lg border border-border bg-card p-4 sm:p-5"
      aria-label="Entrevista inicial"
    >
      <div className="flex items-center gap-2">
        <ClipboardList
          size={20}
          aria-hidden="true"
          className="text-primary-ink"
        />
        <h2 className="font-semibold">Entrevista inicial</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        {current
          ? INTENTS[current.intencion].role +
            " · " +
            (current.estado === "completada"
              ? "Respuestas guardadas en el expediente"
              : "Borrador por terminar")
          : "Define el perfil y captura sus objetivos, condiciones y siguiente acción."}
      </p>
      {loading ? (
        <p role="status" className="text-sm">
          Consultando entrevista…
        </p>
      ) : error ? (
        <>
          <p className="text-sm text-destructive">{error}</p>
          <button className={btnGhost} onClick={() => window.location.reload()}>
            Reintentar consulta
          </button>
        </>
      ) : disabled ? (
        <button disabled className={btnGhost}>
          Guarda los cambios para abrir la entrevista
        </button>
      ) : (
        <Link
          className={btnPrimary}
          href={
            current
              ? "/admin/entrevistas/" + current.id
              : "/admin/operaciones/nueva?" + q
          }
        >
          {current
            ? current.estado === "completada"
              ? "Ver entrevista"
              : "Continuar entrevista"
            : "Preparar entrevista"}
        </Link>
      )}
    </section>
  );
}
