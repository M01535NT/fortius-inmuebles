"use client";
import Link from "next/link";
import { AsyncSelect, selectClass } from "@/components/admin/ui";
import {
  db,
  LEAD_ESTADOS,
  LEAD_ESTADO_LABELS,
  upsert,
  type Lead,
  type LeadEstado,
} from "@/lib/admin/store";
import { duplicateContacts } from "@/lib/admin/workspace";
export function LeadBoard({ leads }: { leads: Lead[] }) {
  const stages = [...LEAD_ESTADOS, "convertido"] as const;
  return (
    <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {stages.map((stage) => {
        const rows = leads.filter((l) =>
          stage === "convertido"
            ? !!l.clienteId
            : !l.clienteId && l.estado === stage,
        );
        if (stage === "convertido" && !rows.length) return null;
        return (
          <section
            key={stage}
            aria-label={
              stage === "convertido" ? "Convertidos" : LEAD_ESTADO_LABELS[stage]
            }
            className="min-w-0 rounded-lg border border-border bg-secondary/25 p-3"
          >
            <h2 className="flex justify-between text-sm font-semibold">
              {stage === "convertido"
                ? "Convertidos"
                : LEAD_ESTADO_LABELS[stage]}
              <span>{rows.length}</span>
            </h2>
            <ul className="mt-3 space-y-3">
              {rows.map((lead) => (
                <li
                  key={lead.id}
                  className="space-y-2 rounded-lg border border-border bg-card p-3"
                >
                  <Link
                    className="block break-words py-2 font-medium"
                    href={`/admin/leads/${lead.id}`}
                  >
                    {lead.nombre}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    Próximo contacto:{" "}
                    {lead.perfil?.proximoContacto ?? "Sin programar"}
                  </p>
                  {duplicateContacts(lead, leads).length > 0 && (
                    <p className="text-xs text-warning">
                      Revisar posible duplicado
                    </p>
                  )}
                  {!lead.clienteId && (
                    <AsyncSelect
                      className={selectClass}
                      aria-label={`Etapa de ${lead.nombre}`}
                      value={lead.estado}
                      onChange={(value) =>
                        upsert(
                          db.leads,
                          { ...lead, estado: value as LeadEstado },
                          db.leads.version(lead),
                        )
                      }
                    >
                      {LEAD_ESTADOS.map((s) => (
                        <option key={s} value={s}>
                          {LEAD_ESTADO_LABELS[s]}
                        </option>
                      ))}
                    </AsyncSelect>
                  )}
                </li>
              ))}
            </ul>
            {!rows.length && (
              <p className="py-4 text-xs text-muted-foreground">
                Sin prospectos en esta etapa.
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}
