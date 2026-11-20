import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getApp } from "@/lib/apps/catalog";
import { AppWorkspace } from "@/components/admin/apps/workspace";
import { DocumentosSinExpediente } from "@/components/admin/apps/documentos-sin-expediente";
import { DOCUMENTOS_APP } from "@/lib/apps/documentos";
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;if(!getApp(slug))notFound();if(slug===DOCUMENTOS_APP)return <DocumentosSinExpediente/>;return <Suspense fallback={<p>Cargando herramienta…</p>}><AppWorkspace key={slug} slug={slug}/></Suspense>;}
