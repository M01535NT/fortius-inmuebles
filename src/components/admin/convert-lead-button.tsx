"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserRoundCheck } from "lucide-react";
import { convertirLead, type Lead } from "@/lib/admin/store";
import { AsyncButton, btnGhost, btnPrimary } from "./ui";

export function ConvertLeadButton({ lead, disabled = false, compact = false }: { lead: Lead; disabled?: boolean; compact?: boolean }) {
  const router = useRouter();
  if (lead.clienteId) return <Link href={`/admin/clientes/${encodeURIComponent(lead.clienteId)}`} className={btnGhost}>Ver cliente</Link>;
  return <AsyncButton type="button" disabled={disabled}
    aria-label={compact ? `Convertir en cliente a ${lead.nombre}` : "Convertir en cliente"}
    className={compact ? btnGhost : btnPrimary}
    onClick={async () => {
      const cliente = await convertirLead(lead);
      router.push(`/admin/clientes/${encodeURIComponent(cliente.id)}`);
    }}>
    <UserRoundCheck className="size-4 shrink-0" strokeWidth={1.5} /> Convertir en cliente
  </AsyncButton>;
}
