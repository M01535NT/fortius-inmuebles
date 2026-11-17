"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

import { Icono } from "@/components/panel/icons";
import { useAvisos } from "@/components/panel/kit/avisos";
import {
  cargarEjemplos, diasHasta, EN_QUE_VA, fechaCorta, ICONO_ENCARGO, iniciales, NOMBRE_EN_QUE_VA, type EnQueVa, type FilaAsunto,
} from "@/lib/panel/asuntos/api";
import { useSession } from "@/lib/panel/legado/sesion";

import { Cuadro, Pildora } from "./pildora";
import { useAsuntos } from "./proveedor";

const sinAcentos = (t: string) => t.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** Abiertos antes que cerrados; luego lo que sigue, lo más pronto primero; sin fecha al final. */
function ordenar(a: FilaAsunto, b: FilaAsunto): number {
  const ca = a.en_que_va === "cerrado" ? 1 : 0, cb = b.en_que_va === "cerrado" ? 1 : 0;
  if (ca !== cb) return ca - cb;
  const fa = a.siguiente?.fecha ?? "9999", fb = b.siguiente?.fecha ?? "9999";
  return fa === fb ? b.updated_at.localeCompare(a.updated_at) : fa.localeCompare(fb);
}

/** La columna de Asuntos (boceto): buscar, qué ver, quién lo lleva y cada asunto con lo que sigue. */
export function ListaAsuntos() {
  const { asuntos, error, recargar, equipo, nombreDe } = useAsuntos();
  const director = useSession()?.role === "admin";
  const ruta = usePathname();
  const { avisar } = useAvisos();
  const [q, setQ] = useState("");
  const [que, setQue] = useState<"" | EnQueVa>("");
  const [lleva, setLleva] = useState("");
  const [cargando, setCargando] = useState(false);

  const base = useMemo(() => asuntos ?? [], [asuntos]);
  const lista = useMemo(() => {
    const t = sinAcentos(q.trim());
    return base
      .filter((a) => (!que || a.en_que_va === que) && (!lleva || a.responsable_id === lleva)
        && (!t || sinAcentos(`${a.nombre} ${a.busqueda} ${a.siguiente?.titulo ?? ""}`).includes(t)))
      .sort(ordenar);
  }, [base, q, que, lleva]);

  const opcionesQue = [
    { valor: "" as const, etiqueta: `Todos · ${base.length}` },
    ...EN_QUE_VA.map((m) => ({ valor: m, etiqueta: `${NOMBRE_EN_QUE_VA[m]} · ${base.filter((a) => a.en_que_va === m).length}` })),
  ];
  const presentes = new Set(base.map((a) => a.responsable_id));
  const opcionesLleva = [{ valor: "", etiqueta: "Todo el equipo" }, ...equipo.filter((m) => presentes.has(m.id)).map((m) => ({ valor: m.id, etiqueta: m.nombre }))];

  async function ejemplos() {
    setCargando(true);
    try {
      const r = await cargarEjemplos();
      await recargar();
      avisar(r.creados ? `Se cargaron ${r.creados} asuntos de ejemplo` : "Los casos de ejemplo ya estaban");
    } catch (e) { avisar(e instanceof Error ? e.message : "No se pudo terminar."); }
    finally { setCargando(false); }
  }

  return (
    <div className="as-lado">
      <div className="as-fila as-cab">
        <h1 className="as-h1-lista">Asuntos</h1>
        <span className="as-sp" />
        <Link href="/panel/consulta" className="as-btn as-pri as-ico" title="Nueva consulta" aria-label="Nueva consulta"><Icono nombre="mas" tamano={16} /></Link>
      </div>
      <label className="as-buscar">
        <Icono nombre="bus" tamano={16} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar" aria-label="Buscar asuntos" type="search" />
      </label>
      <div className="as-fila as-filtros">
        <Pildora etiqueta="Qué ver" valor={que} opciones={opcionesQue} alElegir={setQue} />
        {director && opcionesLleva.length > 2 ? <Pildora etiqueta="Quién lo lleva" icono="users" valor={lleva} opciones={opcionesLleva} alElegir={setLleva} /> : null}
      </div>

      {error && !asuntos ? (
        <div className="as-vacio-lista" role="alert">
          <p>{error}</p>
          <button type="button" className="as-btn" onClick={() => void recargar()}>Reintentar</button>
        </div>
      ) : !asuntos ? (
        <div className="as-cargando" aria-busy="true" aria-label="Cargando asuntos">{[0, 1, 2, 3].map((i) => <span key={i} />)}</div>
      ) : !base.length ? (
        <div className="as-vacio-lista">
          <Icono nombre="asu" tamano={26} />
          <b>Todavía no hay asuntos</b>
          <p>Nacen de una consulta.</p>
          {director ? (
            <button type="button" className="as-btn" onClick={() => void ejemplos()} aria-disabled={cargando}>
              <Icono nombre="copia" tamano={16} />{cargando ? "Cargando…" : "Cargar los casos de ejemplo"}
            </button>
          ) : null}
        </div>
      ) : !lista.length ? (
        <p className="as-m as-nada">Ningún asunto coincide.</p>
      ) : (
        <nav aria-label="Asuntos" className="as-items">
          {lista.map((a) => {
            const s = a.siguiente;
            const [ic, color] = a.encargos[0] ? ICONO_ENCARGO[a.encargos[0]] : (["asu", "gray"] as const);
            const n = s?.fecha ? diasHasta(s.fecha) : null;
            const actual = ruta === `/panel/asuntos/${a.id}`;
            return (
              <Link key={a.id} href={`/panel/asuntos/${a.id}`} className="as-it" aria-current={actual ? "page" : undefined}>
                <Cuadro icono={ic} color={color} />
                <span className="as-it-c">
                  <b>{a.nombre}</b>
                  <span className={s || a.en_que_va === "cerrado" ? "as-m as-corta" : "as-m as-corta as-warn"}>
                    {s ? s.titulo : a.en_que_va === "cerrado" ? (a.resultado === "no_se_dio" ? "No se dio" : "Se logró") : "Sin siguiente paso"}
                  </span>
                  <span className="as-fila as-pills">
                    <span className="as-pill">{NOMBRE_EN_QUE_VA[a.en_que_va]}</span>
                    {a.en_espera ? <span className="as-pill as-pill-warn">En espera</span> : null}
                    {s?.fecha && !a.en_espera ? <span className={`as-pill${n! < 0 ? " as-pill-bad" : n === 0 ? " as-pill-acc" : ""}`}>{fechaCorta(s.fecha)}</span> : null}
                    {a.es_ejemplo ? <span className="as-pill">Ejemplo</span> : null}
                    {director ? <span className="as-pill" title={nombreDe(a.responsable_id)}>{iniciales(nombreDe(a.responsable_id))}</span> : null}
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
