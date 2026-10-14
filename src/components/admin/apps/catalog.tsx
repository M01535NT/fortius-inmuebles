"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, Search } from "lucide-react";
import { APPS } from "@/lib/apps/catalog";
import { PageHeader, inputClass } from "@/components/admin/ui";
import { apiRequest, useSession } from "@/lib/admin/store";
import { AppIcon } from "./app-icon";
import styles from "./apps.module.css";
export function AppsCatalog(){
 const [query,setQuery]=useState(""),[category,setCategory]=useState("Todas"),[favorites,setFavorites]=useState<string[]>([]),[capabilities,setCapabilities]=useState<Record<string,boolean>>({}); const session=useSession();
 const storageKey=`fortius.apps.favorites.${session?.id??"anonymous"}`;
 // Synchronize the persisted preference when the signed-in user changes.
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(()=>{try{const stored=JSON.parse(localStorage.getItem(storageKey)??"[]");setFavorites(Array.isArray(stored)?stored.filter(v=>typeof v==="string"):[]);}catch{setFavorites([]);}},[storageKey]);
 useEffect(()=>{let active=true;apiRequest<{providers:Record<string,boolean>}>("/api/admin/apps/status").then(v=>{if(active)setCapabilities(v.providers);}).catch(()=>{});return()=>{active=false;};},[]);
 const normalize=(v:string)=>v.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
 const apps=APPS.filter(a=>(category==="Todas"||(category==="Favoritas"?favorites.includes(a.slug):a.category===category))&&normalize(`${a.title} ${a.description}`).includes(normalize(query)));
 return <div className="space-y-6"><PageHeader title="Aplicaciones" description="Herramientas para preparar, analizar y acompañar cada operación."/><div className={styles.toolbar}><Search size={20} aria-hidden="true"/><input className={inputClass} aria-label="Buscar herramienta" placeholder="Buscar una herramienta…" value={query} onChange={e=>setQuery(e.target.value)}/></div><div className={styles.categories} aria-label="Filtrar aplicaciones">{["Todas","Favoritas","Comercial","Finanzas","Documentos","Productividad"].map(c=><button key={c} aria-pressed={c===category} onClick={()=>setCategory(c)}>{c}</button>)}</div><div className={styles.catalog}>{apps.map(app=><article key={app.slug} className={styles.tile}><span className={styles.icon}><AppIcon name={app.icon}/></span><button className={styles.favorite} aria-label={`${favorites.includes(app.slug)?"Quitar de":"Añadir a"} favoritas: ${app.title}`} aria-pressed={favorites.includes(app.slug)} onClick={()=>{const next=favorites.includes(app.slug)?favorites.filter(v=>v!==app.slug):[...favorites,app.slug];setFavorites(next);try{localStorage.setItem(storageKey,JSON.stringify(next));}catch{}}}><Star size={18} fill={favorites.includes(app.slug)?"currentColor":"none"}/></button><Link href={`/admin/apps/${app.slug}`}>{app.title}</Link><p>{app.description}</p>{"provider" in app&&!capabilities[app.provider]&&<small className="text-muted-foreground">Servicio pendiente de configuración</small>}</article>)}</div>{!apps.length&&<p role="status">No hay herramientas con ese filtro.</p>}</div>;
}
