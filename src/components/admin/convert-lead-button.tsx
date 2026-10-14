"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserRoundCheck } from "lucide-react";
import { convertirLead, type Lead } from "@/lib/admin/store";
import { AsyncButton, btnGhost, btnPrimary } from "./ui";

export function ConvertLeadButton({ lead, disabled = false, compact = false, openOperation = false }: { lead: Lead; disabled?: boolean; compact?: boolean; openOperation?:boolean }) {
  const router = useRouter();
  const operationUrl=(clientId:string)=>`/admin/expedientes?${new URLSearchParams({nuevo:"1",clienteId:clientId,ruta:lead.perfil?.operacion==="comprar"?"compra":"captacion",...(lead.propiedadSlug?{inmueble:lead.propiedadSlug}:{})})}`;
  if (lead.clienteId && disabled) return <button type="button" disabled className={openOperation ? btnPrimary : btnGhost}>{openOperation ? "Abrir operación" : "Ver cliente"}</button>;
  if (lead.clienteId && openOperation) return <Link href={operationUrl(lead.clienteId)} className={btnPrimary}>Abrir operación</Link>;
  if (lead.clienteId) return <Link href={`/admin/clientes/${encodeURIComponent(lead.clienteId)}`} className={btnGhost}>Ver cliente</Link>;
  return <AsyncButton type="button" disabled={disabled}
    aria-label={compact ? `Convertir en cliente a ${lead.nombre}` : openOperation?"Convertir y abrir operación":"Convertir en cliente"}
    className={compact ? btnGhost : btnPrimary}
    onClick={async () => {
      const cliente = await convertirLead(lead);
      router.push(openOperation?operationUrl(cliente.id):`/admin/clientes/${encodeURIComponent(cliente.id)}`);
    }}>
    <UserRoundCheck className="size-4 shrink-0" strokeWidth={1.5} /> {openOperation?"Convertir y abrir operación":"Convertir en cliente"}
  </AsyncButton>;
}
