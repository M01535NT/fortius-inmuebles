"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, Star, Search } from "@/components/admin/icons";
import { APPS } from "@/lib/apps/catalog";
import { ButtonLink, EmptyBox, Segmented } from "@/components/admin/kit";
import { inputClass } from "@/components/admin/ui";
import { useSession } from "@/lib/admin/store";
import { AppIcon } from "./app-icon";
import styles from "./catalog.module.css";

/*
  Herramientas (rediseño del 18/10/2026): buscador, categorías en pista y las herramientas
  agrupadas por categoría; las favoritas (preferencia del navegador por usuario) van primero.
  Cada tarjeta es un enlace completo con un ícono de color por familia y su estrella.
*/

const CATEGORIES = ["Todas", "Favoritas", "Comercial", "Finanzas", "Documentos", "Productividad"] as const;
type Category = typeof CATEGORIES[number];
const ORDER: Category[] = ["Comercial", "Finanzas", "Documentos", "Productividad"];

export function AppsCatalog(){
 const [query,setQuery]=useState(""),[category,setCategory]=useState<Category>("Todas"),[favorites,setFavorites]=useState<string[]>([]); const session=useSession();
 const storageKey=`fortius.apps.favorites.${session?.id??"anonymous"}`;
 // Synchronize the persisted preference when the signed-in user changes.
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(()=>{try{const stored=JSON.parse(localStorage.getItem(storageKey)??"[]");setFavorites(Array.isArray(stored)?stored.filter(v=>typeof v==="string"):[]);}catch{setFavorites([]);}},[storageKey]);
 const normalize=(v:string)=>v.normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase();
 const apps=APPS.filter(a=>(category==="Todas"||(category==="Favoritas"?favorites.includes(a.slug):a.category===category))&&normalize(`${a.title} ${a.description}`).includes(normalize(query)));
 const toggle=(slug:string)=>{const next=favorites.includes(slug)?favorites.filter(v=>v!==slug):[...favorites,slug];setFavorites(next);try{localStorage.setItem(storageKey,JSON.stringify(next));}catch{}};
 // En «Todas» sin búsqueda, las herramientas van por categoría (favoritas primero); al filtrar o buscar, en una sola lista.
 const grouped=category==="Todas"&&!query.trim();
 const sections:Array<{title:string;items:typeof apps}>=grouped
  ?[{title:"Favoritas",items:apps.filter(a=>favorites.includes(a.slug))},...ORDER.map(c=>({title:c,items:apps.filter(a=>a.category===c)}))].filter(sec=>sec.items.length)
  :[{title:"",items:apps}];
 const tile=(app:typeof APPS[number])=><article key={app.slug} className={styles.tile} data-category={app.category}>
  <span className={styles.icon}><AppIcon name={app.icon}/></span>
  <Link href={`/admin/apps/${app.slug}`}>{app.title}</Link>
  <p>{app.description}</p>
  <button type="button" className={styles.favorite} aria-label={`${favorites.includes(app.slug)?"Quitar de":"Añadir a"} favoritas: ${app.title}`} aria-pressed={favorites.includes(app.slug)} onClick={()=>toggle(app.slug)}><Star size={18} fill={favorites.includes(app.slug)?"currentColor":"none"} aria-hidden="true"/></button>
 </article>;
 return <div className="flex flex-col gap-5">
  <div className={styles.toolbar}>
   <label className={styles.search}><Search size={18} aria-hidden="true"/><input className={inputClass} type="search" aria-label="Buscar herramienta" placeholder="Buscar una herramienta…" value={query} onChange={e=>setQuery(e.target.value)}/></label>
   <ButtonLink href="/admin/notas"><ClipboardList size={16} aria-hidden="true"/>Notas del equipo</ButtonLink>
  </div>
  <div className={styles.filters}>
   <Segmented label="Filtrar aplicaciones" value={category} onChange={setCategory} options={CATEGORIES.map(c=>({id:c,label:c}))}/>
   <span className={styles.count} aria-live="polite">{apps.length} {apps.length===1?"herramienta":"herramientas"}</span>
  </div>
  {apps.length?<div className={styles.sections}>{sections.map(sec=><section key={sec.title||"lista"} className={styles.section} aria-label={sec.title||"Herramientas"}>
   {sec.title&&<div className={styles.sectionHead}><h2>{sec.title}</h2><span>{sec.items.length}</span></div>}
   <div className={styles.grid}>{sec.items.map(tile)}</div>
  </section>)}</div>
  :<EmptyBox title={category==="Favoritas"&&!query.trim()?"Todavía no tienes favoritas":"No hay herramientas con ese filtro"}>{category==="Favoritas"&&!query.trim()?"Marca la estrella de las que más uses y aparecerán aquí y al principio de la lista.":"Prueba con otra palabra o cambia la categoría."}</EmptyBox>}
 </div>;
}
