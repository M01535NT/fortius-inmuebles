"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Gesto, Icono } from "@/components/panel/icons";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Boton } from "@/components/panel/kit/boton";
import { Desplegable } from "@/components/panel/kit/desplegable";
import { Hoja } from "@/components/panel/kit/hoja";
import { Tarjeta } from "@/components/panel/kit/lista";
import { leerAsuntos, type FilaAsunto } from "@/lib/panel/asuntos/api";
import { abrirTrabajo, leerSueltos, pasarAUnAsunto, quitarTrabajo, type FilaTrabajo, type Trabajo } from "@/lib/panel/documentos/api";

import { TRABAJOS_CAMBIARON, type CuentaGuardada } from "./guardar";

const cuando = (iso: string) => new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short" });

/**
 * Trabajos sueltos: lo hecho en Herramientas sin asunto (una opinión de valor, una cuenta, un contrato empezado).
 * Los ve solo quien los hizo y el director. «Pasar a un asunto» los deja en los documentos de ese asunto.
 */
export function TrabajosSueltos() {
  const [filas, setFilas] = useState<FilaTrabajo[] | null>(null);
  const [abierto, setAbierto] = useState<FilaTrabajo | null>(null);
  const cargar = useCallback(() => { leerSueltos().then(setFilas, () => setFilas([])); }, []);
  useEffect(() => {
    queueMicrotask(cargar);
    window.addEventListener(TRABAJOS_CAMBIARON, cargar);
    return () => window.removeEventListener(TRABAJOS_CAMBIARON, cargar);
  }, [cargar]);
  if (!filas || !filas.length) return null;
  return (
    <section className="pn-her-sueltos" aria-label="Trabajos sueltos">
      <h2>Trabajos sueltos</h2>
      <Tarjeta style={{ overflow: "hidden" }}>
        {filas.map((t) => {
          const cuerpo = (
            <>
              <span className="pn-her-ti" aria-hidden><Icono nombre={t.clase === "formato" ? "file" : "calc"} tamano={20} /></span>
              <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                <span className="pn-her-nombre">{t.nombre}</span>
                <span className="pn-her-sub">{t.resultado ?? (t.clase === "formato" ? "Sin terminar" : "Cuenta guardada")} · {cuando(t.updated_at)}</span>
              </span>
              <Gesto nombre="derecha" tamano={18} className="pn-her-flecha" aria-hidden />
            </>
          );
          return t.clase === "formato"
            ? <Link key={t.id} href={`/panel/documento/${t.id}?volver=${encodeURIComponent("/panel/herramientas")}`} className="pn-her-fila">{cuerpo}</Link>
            : <button key={t.id} type="button" className="pn-her-fila" onClick={() => setAbierto(t)}>{cuerpo}</button>;
        })}
      </Tarjeta>
      {abierto ? <CuentaSuelta fila={abierto} alCerrar={() => setAbierto(null)} alCambiar={() => { setAbierto(null); cargar(); }} /> : null}
    </section>
  );
}

/** Una cuenta guardada: lo que se vio, «Pasar a un asunto» y «Mandar a Eliminados». */
function CuentaSuelta({ fila, alCerrar, alCambiar }: { fila: FilaTrabajo; alCerrar: () => void; alCambiar: () => void }) {
  const { avisar } = useAvisos();
  const [trabajo, setTrabajo] = useState<Trabajo | null>(null);
  const [asuntos, setAsuntos] = useState<FilaAsunto[] | null>(null);
  useEffect(() => {
    let vivo = true;
    abrirTrabajo(fila.id).then((x) => vivo && setTrabajo(x.trabajo), () => vivo && avisar("No se pudo abrir"));
    leerAsuntos().then((a) => vivo && setAsuntos(a.filter((x) => !x.resultado)), () => vivo && setAsuntos([]));
    return () => { vivo = false; };
  }, [fila.id, avisar]);
  const cuenta = trabajo?.datos as Partial<CuentaGuardada> | undefined;
  async function pasar(asuntoId: string) {
    if (!trabajo) return;
    const a = asuntos?.find((x) => x.id === asuntoId);
    try {
      await pasarAUnAsunto(trabajo, asuntoId);
      avisar(`Quedó en los documentos de ${a?.folio ?? "el asunto"}`);
      alCambiar();
    } catch (e) { avisar(e instanceof Error ? e.message : "No se pudo pasar"); }
  }
  async function quitar() {
    if (!trabajo) return;
    try { await quitarTrabajo(trabajo); avisar("Mandado a Eliminados"); alCambiar(); }
    catch (e) { avisar(e instanceof Error ? e.message : "No se pudo quitar"); }
  }
  return (
    <Hoja abierta titulo={fila.nombre} alCerrar={alCerrar}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {cuenta?.para ? <p className="pn-sub" style={{ margin: 0 }}>Para: {cuenta.para}</p> : null}
        {cuenta?.lineas?.length ? (
          <Tarjeta className="pn-her-res">
            {cuenta.lineas.map((l) => l.grande
              ? <div key={l.k} className="pn-her-big"><span>{l.k}</span><span>{l.v}</span></div>
              : <div key={l.k} className="pn-her-ln"><span>{l.k}</span><b>{l.v}</b></div>)}
          </Tarjeta>
        ) : <p className="pn-sub">{trabajo ? "Sin datos guardados." : "Cargando…"}</p>}
        {cuenta?.supuestos?.length ? <p className="pn-her-leyenda">Supuestos: {cuenta.supuestos.join(", ")}.</p> : null}
        {cuenta?.fuente ? <p className="pn-her-leyenda">Fuente: {cuenta.fuente}</p> : null}
        {cuenta?.fecha ? <p className="pn-her-leyenda">Calculado el {cuenta.fecha}.</p> : null}
        <Desplegable etiqueta="Pasar a un asunto" valor="" vacio={asuntos ? "Elegir el asunto" : "Cargando asuntos"}
          opciones={(asuntos ?? []).map((a) => ({ valor: a.id, etiqueta: `${a.folio} · ${a.nombre}` }))} alElegir={(v) => v && pasar(v)} />
        <Boton variante="secundario" bloque style={{ minHeight: 48 }} onClick={quitar}>Mandar a Eliminados</Boton>
      </div>
    </Hoja>
  );
}
