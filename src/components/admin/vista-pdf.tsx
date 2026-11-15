"use client";
import * as React from "react";
import { FileDown } from "@/components/admin/icons";
import { Button } from "@/components/admin/kit";
import { cn } from "@/lib/utils";
import s from "./vista-pdf.module.css";

/*
  Vista de un PDF privado dentro del panel (LV-10d). El panel no se deja enmarcar (CSP
  frame-ancestors 'none' y X-Frame-Options DENY en todas las respuestas), así que un PDF servido por
  la API no puede ir en un iframe. Se descarga con la sesión y sus primeras páginas se dibujan con
  pdf.js, como hace la lectura de datos. Si hay más páginas, el archivo completo se abre aparte.
*/
type Vista = { paginas: string[]; total: number } | "cargando" | "error";

export function VistaPdf({ url, titulo, maxPaginas = 6, soloPrimeraEnCelular = false, className }: {
  url: string; titulo: string; maxPaginas?: number; soloPrimeraEnCelular?: boolean; className?: string;
}) {
  const [vista, setVista] = React.useState<Vista>("cargando");
  const [visto, setVisto] = React.useState(url);
  if (visto !== url) { setVisto(url); setVista("cargando"); }
  React.useEffect(() => {
    let alive = true;
    (async () => {
      const respuesta = await fetch(url, { credentials: "same-origin" });
      if (!respuesta.ok) throw new Error(String(respuesta.status));
      const { paginasComoImagenes } = await import("@/lib/admin/pdf-paginas");
      return paginasComoImagenes(await respuesta.arrayBuffer(), { maxPaginas, ancho: 1100, calidad: 0.82 });
    })().then(r => { if (alive) setVista(r); }, () => { if (alive) setVista("error"); });
    return () => { alive = false; };
  }, [url, maxPaginas]);
  const abrir = () => window.open(url, "_blank", "noopener");

  return <div className={cn(s.pages, className)} data-first-only={soloPrimeraEnCelular || undefined}>
    {vista === "cargando" ? <div className={s.sheet} data-empty="true" aria-busy="true"><p className={s.note}>Preparando la vista…</p></div>
      : vista === "error" ? <div className={s.sheet} data-empty="true"><div className={s.note}><p>No se pudo mostrar el documento aquí.</p><Button onClick={abrir}><FileDown size={16} aria-hidden />Abrir el archivo</Button></div></div>
      : <>
          {vista.paginas.map((src, i) => <div key={i} className={s.sheet}>
            {/* eslint-disable-next-line @next/next/no-img-element -- página dibujada en el navegador a partir del PDF privado */}
            <img src={src} alt={`${titulo}, página ${i + 1} de ${vista.total}`} />
          </div>)}
          {vista.total > 1 && <p className={s.more}>
            <span className={s.wide}>{vista.total > vista.paginas.length ? `Se muestran ${vista.paginas.length} de ${vista.total} páginas.` : `${vista.total} páginas.`}</span>
            <span className={s.narrow}>Aquí se ve la primera de {vista.total} páginas.</span>{" "}
            <button type="button" className="underline underline-offset-2" onClick={abrir}>Abrir el documento completo</button>
          </p>}
        </>}
  </div>;
}
