"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserRoundCheck } from "lucide-react";
import { convertirLead, type Lead } from "@/lib/admin/store";
import { AsyncButton, btnGhost, btnPrimary } from "./ui";
export function ConvertLeadButton({lead,disabled=false,compact=false,openOperation=false}:{lead:Lead;disabled?:boolean;compact?:boolean;openOperation?:boolean}){
 const router=useRouter();
 if(openOperation){
  const url='/admin/operaciones/nueva?'+new URLSearchParams({...(lead.clienteId?{clienteId:lead.clienteId}:{leadId:lead.id}),...(lead.perfil?.operacion?{intencion:lead.perfil.operacion}:{})});
  return disabled?<button type="button" disabled className={btnPrimary}>Preparar operación</button>:<Link href={url} className={btnPrimary}>Preparar operación</Link>;
 }
 if(lead.clienteId)return disabled?<button type="button" disabled className={btnGhost}>Ver cliente</button>:<Link href={'/admin/clientes/'+encodeURIComponent(lead.clienteId)} className={btnGhost}>Ver cliente</Link>;
 return <AsyncButton type="button" disabled={disabled} aria-label={compact?'Convertir en cliente a '+lead.nombre:'Convertir en cliente'} className={compact?btnGhost:btnPrimary} onClick={async()=>{const cliente=await convertirLead(lead);router.push('/admin/clientes/'+encodeURIComponent(cliente.id));}}><UserRoundCheck className="size-4 shrink-0" strokeWidth={1.5}/>Convertir en cliente</AsyncButton>;
}
