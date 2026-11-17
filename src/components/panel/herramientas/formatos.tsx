"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { Gesto, Icono } from "@/components/panel/icons";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Boton } from "@/components/panel/kit/boton";
import { Campo } from "@/components/panel/kit/campo";
import { Desplegable } from "@/components/panel/kit/desplegable";
import { Tarjeta } from "@/components/panel/kit/lista";
import { FORMATOS } from "@/lib/formatos/catalog";
import { empezarTrabajo } from "@/lib/panel/documentos/api";

import { useAsuntoDeLaCuenta } from "./guardar";

/**
 * Grupos del catálogo en Herramientas. Son solo para encontrar rápido; ninguno es un orden obligatorio
 * (ningún método manda en el panel). El tablero (03) no se hace aquí.
 */
const GRUPOS: readonly { titulo: string; ids: readonly string[] }[] = [
  { titulo: "Contratos", ids: ["09", "21", "15", "20", "24"] },
  { titulo: "Para el cliente", ids: ["01", "08", "10", "11", "14", "18", "19"] },
  { titulo: "Del inmueble", ids: ["06", "16", "23"] },
  { titulo: "Entrevistas y registros", ids: ["02", "12", "13", "22", "05", "17"] },
];
const LEVANTAMIENTOS = FORMATOS.filter((f) => f.id.startsWith("04")).map((f) => ({ valor: f.id, etiqueta: f.title.replace("Levantamiento de ", "") }));
const titulo = (id: string) => FORMATOS.find((f) => f.id === id)?.title ?? id;
const sinAcentos = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Empieza un formato (en el asunto de la cuenta o suelto) y abre su ventana de preguntas. */
export function useEmpezarFormato() {
  const router = useRouter();
  const ctx = useAsuntoDeLaCuenta();
  const { avisar } = useAvisos();
  // Si se llegó desde un apartado del asunto (?ver=honorarios), al cerrar se regresa a ese apartado.
  const apartado = useSearchParams().get("ver");
  const [empezando, setEmpezando] = useState<string | null>(null);
  async function empezar(tipo: string) {
    if (empezando) return;
    setEmpezando(tipo);
    try {
      const asunto = ctx?.asunto ?? null;
      const id = await empezarTrabajo({ clase: "formato", tipo, asunto_id: asunto?.id ?? null });
      const volver = asunto ? `/panel/asuntos/${asunto.id}${apartado && /^[a-z_]{1,20}$/.test(apartado) ? `?ver=${apartado}` : ""}` : "/panel/herramientas";
      router.push(`/panel/documento/${id}?volver=${encodeURIComponent(volver)}`);
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se pudo empezar");
      setEmpezando(null);
    }
  }
  return { empezar, empezando };
}

/** Contratos y formatos: buscador y lista agrupada. Cada uno se llena por preguntas con la hoja a la vista. */
export function CatalogoFormatos() {
  const [busca, setBusca] = useState("");
  const { empezar, empezando } = useEmpezarFormato();
  const ctx = useAsuntoDeLaCuenta();
  const q = sinAcentos(busca.trim());
  const grupos = useMemo(() => GRUPOS.map((g) => ({ ...g, ids: g.ids.filter((id) => !q || sinAcentos(`${id} ${titulo(id)}`).includes(q)) })).filter((g) => g.ids.length), [q]);
  const levantamiento = !q || sinAcentos("04 levantamiento").includes(q) || LEVANTAMIENTOS.some((l) => sinAcentos(l.etiqueta).includes(q));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p className="pn-sub" style={{ margin: 0 }}>
        {ctx?.asunto ? `Se llena con lo que ya sabe ${ctx.asunto.folio} y queda en sus documentos.` : "Sin asunto queda en Trabajos sueltos; después se pasa a su asunto."}
      </p>
      <Campo etiqueta="Buscar un formato" type="search" placeholder="Contrato, recibo, entrevista…" value={busca} onChange={(e) => setBusca(e.target.value)} />
      {grupos.map((g) => (
        <section key={g.titulo} className="pn-her-grupo" aria-label={g.titulo}>
          <h3>{g.titulo}</h3>
          <Tarjeta style={{ overflow: "hidden" }}>
            {g.ids.map((id) => (
              <button key={id} type="button" className="pn-her-fila" disabled={empezando !== null} onClick={() => empezar(id)}>
                <span className="pn-her-ti" aria-hidden><Icono nombre={g.titulo === "Contratos" ? "contrato" : "file"} tamano={20} /></span>
                <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                  <span className="pn-her-nombre">{titulo(id)}</span>
                  <span className="pn-her-sub">{empezando === id ? "Abriendo…" : `Formato ${id}`}</span>
                </span>
                <Gesto nombre="derecha" tamano={18} className="pn-her-flecha" aria-hidden />
              </button>
            ))}
          </Tarjeta>
        </section>
      ))}
      {levantamiento ? (
        <section className="pn-her-grupo" aria-label="Levantamiento">
          <h3>Levantamiento</h3>
          <Desplegable etiqueta="Según el tipo de inmueble" valor="" vacio="Elegir el tipo" opciones={LEVANTAMIENTOS} alElegir={(v) => v && empezar(v)} />
        </section>
      ) : null}
      {!grupos.length && !levantamiento ? <p className="pn-sub">Ningún formato se llama así.</p> : null}
    </div>
  );
}

/** Opinión de valor: el formato 07 por preguntas, con o sin asunto. */
export function OpinionDeValor() {
  const { empezar, empezando } = useEmpezarFormato();
  const ctx = useAsuntoDeLaCuenta();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Tarjeta className="pn-her-res">
        <div className="pn-her-big"><span>Opinión de valor comercial</span><span style={{ fontSize: 22 }}>Por preguntas, con la hoja a la vista</span></div>
        <div className="pn-her-ln"><span>Comparables, ajustes y valor</span><b>Formato 07</b></div>
        <div className="pn-her-ln"><span>Dónde queda</span><b>{ctx?.asunto ? `Documentos de ${ctx.asunto.folio}` : "Trabajos sueltos"}</b></div>
      </Tarjeta>
      <Boton variante="primario" bloque style={{ minHeight: 48 }} deshabilitado={empezando !== null} onClick={() => empezar("07")}>
        {empezando ? "Abriendo…" : "Empezar la opinión de valor"}
      </Boton>
      <p className="pn-her-leyenda">Es una opinión, no un avalúo. Se puede hacer antes de que el cliente contrate y pasarla después a su asunto.</p>
    </div>
  );
}
