import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getApp } from "@/lib/apps/catalog";
import { AppWorkspace } from "@/components/admin/apps/workspace";
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;if(!getApp(slug))notFound();return <Suspense fallback={<p>Cargando herramienta…</p>}><AppWorkspace key={slug} slug={slug}/></Suspense>;}
