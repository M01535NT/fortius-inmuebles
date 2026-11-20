"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { Gesto, Icono } from "@/components/panel/icons";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Desplegable } from "@/components/panel/kit/desplegable";
import { FORMATOS } from "@/lib/formatos/catalog";
import { empezarTrabajo } from "@/lib/panel/documentos/api";

import { useAsuntoDeLaCuenta } from "./guardar";
import { DatosCuenta } from "./resultado";

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
      const volver = asunto ? `/admin/asuntos/${asunto.id}${apartado && /^[a-z_]{1,20}$/.test(apartado) ? `?ver=${apartado}` : ""}` : "/admin/herramientas";
      router.push(`/admin/documento/${id}?volver=${encodeURIComponent(volver)}`);
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
    <div className="her-cuenta">
      <p className="as-m her-ley">
        {ctx?.asunto ? `Se llena con lo que ya sabe ${ctx.asunto.folio} y queda en sus documentos.` : "Sin asunto queda en Trabajos sueltos; después se pasa a su asunto."}
      </p>
      <label className="as-buscar her-buscar">
        <Icono nombre="bus" tamano={15} />
        <input type="search" placeholder="Buscar un formato: contrato, recibo, entrevista…" aria-label="Buscar un formato" value={busca} onChange={(e) => setBusca(e.target.value)} />
      </label>
      {grupos.map((g) => (
        <section key={g.titulo} className="fm-grupo" aria-label={g.titulo}>
          <div className="fm-t"><span>{g.titulo}</span><span className="fm-t-n">{g.ids.length}</span></div>
          <div className="fm-card">
            {g.ids.map((id) => (
              <button key={id} type="button" className="fm-dato her-fila" disabled={empezando !== null} onClick={() => empezar(id)}>
                <Icono nombre={g.titulo === "Contratos" ? "contrato" : "file"} tamano={16} />
                <span className="fm-v">{titulo(id)}</span>
                <span className="as-m her-fila-n">{empezando === id ? "Abriendo…" : id}</span>
                <Gesto nombre="derecha" tamano={15} className="her-fila-f" aria-hidden />
              </button>
            ))}
          </div>
        </section>
      ))}
      {levantamiento ? (
        <DatosCuenta titulo="Levantamiento">
          <Desplegable etiqueta="Según el tipo de inmueble" valor="" vacio="Elegir el tipo" opciones={LEVANTAMIENTOS} alElegir={(v) => v && empezar(v)} />
        </DatosCuenta>
      ) : null}
      {!grupos.length && !levantamiento ? <p className="as-m her-ley">Ningún formato se llama así.</p> : null}
    </div>
  );
}

/** Opinión de valor: el formato 07 por preguntas, con o sin asunto. */
export function OpinionDeValor() {
  const { empezar, empezando } = useEmpezarFormato();
  const ctx = useAsuntoDeLaCuenta();
  return (
    <div className="her-cuenta">
      <section className="fm-grupo" aria-label="Opinión de valor comercial">
        <div className="fm-t">Opinión de valor comercial</div>
        <div className="fm-card">
          <div className="fm-dato"><span className="fm-k">Cómo se hace</span><span className="fm-v">Por preguntas, con la hoja a la vista</span></div>
          <div className="fm-dato"><span className="fm-k">Lleva</span><span className="fm-v">Comparables, ajustes y valor · formato 07</span></div>
          <div className="fm-dato"><span className="fm-k">Dónde queda</span><span className="fm-v">{ctx?.asunto ? `Documentos de ${ctx.asunto.folio}` : "Trabajos sueltos"}</span></div>
        </div>
        <div className="her-empezar">
          <button type="button" className="as-btn as-pri her-acc-btn" aria-disabled={empezando !== null || undefined} onClick={() => { if (empezando === null) void empezar("07"); }}>
            <Icono nombre="precio" tamano={14} />{empezando ? "Abriendo…" : "Empezar la opinión de valor"}
          </button>
        </div>
      </section>
      <p className="as-m her-ley">Es una opinión, no un avalúo. Se puede hacer antes de que el cliente contrate y pasarla después a su asunto.</p>
    </div>
  );
}
