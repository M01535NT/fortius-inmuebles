"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { useMisPreferencias, type VistaGuardada } from "@/components/panel/datos/use-mis-preferencias";
import { Icono } from "@/components/panel/icons";
import { useAvisos } from "@/components/panel/kit/avisos";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/panel/ui/dropdown-menu";
import {
  cargarEjemplos, diasHasta, EN_QUE_VA, fechaCorta, ICONO_ENCARGO, iniciales, NOMBRE_EN_QUE_VA, type EnQueVa, type FilaAsunto,
} from "@/lib/panel/asuntos/api";
import { useSession } from "@/lib/panel/legado/sesion";

import { Cuadro, Pildora } from "./pildora";
import { useAsuntos } from "./proveedor";
import { DialogoTexto } from "./ventana";

const sinAcentos = (t: string) => t.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** Abiertos antes que cerrados; luego lo que sigue, lo más pronto primero; sin fecha al final. */
function ordenar(a: FilaAsunto, b: FilaAsunto): number {
  const ca = a.en_que_va === "cerrado" ? 1 : 0, cb = b.en_que_va === "cerrado" ? 1 : 0;
  if (ca !== cb) return ca - cb;
  const fa = a.siguiente?.fecha ?? "9999", fb = b.siguiente?.fecha ?? "9999";
  return fa === fb ? b.updated_at.localeCompare(a.updated_at) : fa.localeCompare(fb);
}

/** Desde Equipo, «Ver» llega con ?de=<persona>: la lista abre con «Quién lo lleva» ya elegido. */
function LeerDe({ alLeer }: { alLeer: (id: string) => void }) {
  const de = useSearchParams().get("de");
  useEffect(() => { if (de) alLeer(de); }, [de, alLeer]);
  return null;
}

/** La columna de Asuntos (boceto): buscar, qué ver, quién lo lleva y cada asunto con lo que sigue. */
export function ListaAsuntos() {
  const { asuntos, error, recargar, equipo, nombreDe } = useAsuntos();
  const director = useSession()?.role === "admin";
  const ruta = usePathname();
  const { avisar } = useAvisos();
  const [q, setQ] = useState("");
  const [que, setQue] = useState<"" | EnQueVa | "favoritos">("");
  const [lleva, setLleva] = useState("");
  const [cargando, setCargando] = useState(false);
  const [nombrando, setNombrando] = useState(false);
  const prefs = useMisPreferencias();
  const favoritos = useMemo(() => new Set((prefs.panel.favoritos ?? []).filter((f) => f.tipo === "asunto").map((f) => f.id)), [prefs.panel.favoritos]);
  // Vistas guardadas (SPEC.md, sección 15): los filtros de la lista con nombre, para volver a ellos con un toque.
  const vistas = (prefs.panel.vistas ?? []).filter((v) => v.lista === "asuntos");
  const filtros: Record<string, string> = Object.fromEntries(Object.entries({ q: q.trim(), que, lleva }).filter(([, v]) => v));
  const conFiltro = Object.keys(filtros).length > 0;
  const aplicada = vistas.find((v) => JSON.stringify(v.filtros) === JSON.stringify(filtros));
  const usarVista = (v: VistaGuardada) => {
    setQ(v.filtros.q ?? "");
    const w = v.filtros.que ?? "";
    setQue(w === "favoritos" || (EN_QUE_VA as readonly string[]).includes(w) ? (w as EnQueVa | "favoritos") : "");
    setLleva(v.filtros.lleva ?? "");
  };
  const guardarVistas = (lista: VistaGuardada[], aviso: string) => {
    const otras = (prefs.panel.vistas ?? []).filter((v) => v.lista !== "asuntos");
    prefs.cambiar({ vistas: [...otras, ...lista].slice(0, 24) }).then(() => avisar(aviso), (e: unknown) => avisar(e instanceof Error ? e.message : "No se pudo guardar."));
  };

  const base = useMemo(() => asuntos ?? [], [asuntos]);
  const lista = useMemo(() => {
    const t = sinAcentos(q.trim());
    return base
      .filter((a) => (!que || (que === "favoritos" ? favoritos.has(a.id) : a.en_que_va === que)) && (!lleva || a.responsable_id === lleva)
        && (!t || sinAcentos(`${a.nombre} ${a.busqueda} ${a.siguiente?.titulo ?? ""}`).includes(t)))
      .sort(ordenar);
  }, [base, q, que, lleva, favoritos]);

  const opcionesQue = [
    { valor: "" as const, etiqueta: `Todos · ${base.length}` },
    ...(favoritos.size ? [{ valor: "favoritos" as const, etiqueta: `Favoritos · ${base.filter((a) => favoritos.has(a.id)).length}` }] : []),
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
      {director ? <Suspense fallback={null}><LeerDe alLeer={setLleva} /></Suspense> : null}
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
        {vistas.length || conFiltro ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="as-btn as-gho as-vistas" aria-label={aplicada ? `Vista: ${aplicada.nombre}` : "Vistas guardadas"}>
              <Icono nombre="estrella" tamano={15} />{aplicada ? <span className="as-corta">{aplicada.nombre}</span> : null}<Icono nombre="down" tamano={13} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-60">
              {vistas.length ? <DropdownMenuLabel>Mis vistas</DropdownMenuLabel> : null}
              {vistas.map((v) => (
                <DropdownMenuItem key={v.nombre} onSelect={() => usarVista(v)}>
                  <Icono nombre={v === aplicada ? "ok" : "lista"} tamano={16} />{v.nombre}
                </DropdownMenuItem>
              ))}
              {vistas.length ? <DropdownMenuSeparator /> : null}
              {conFiltro && !aplicada ? <DropdownMenuItem onSelect={() => setNombrando(true)}><Icono nombre="mas" tamano={16} />Guardar esta vista</DropdownMenuItem> : null}
              {conFiltro ? <DropdownMenuItem onSelect={() => { setQ(""); setQue(""); setLleva(""); }}><Icono nombre="x" tamano={16} />Quitar los filtros</DropdownMenuItem> : null}
              {aplicada ? (
                <DropdownMenuItem peligro onSelect={() => guardarVistas(vistas.filter((v) => v !== aplicada), `Se quitó la vista «${aplicada.nombre}»`)}>
                  <Icono nombre="bote" tamano={16} />Borrar la vista «{aplicada.nombre}»
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
      <DialogoTexto abierto={nombrando} titulo="Guardar esta vista" etiqueta="Nombre de la vista" maximo={60}
        ayuda="Queda en el botón de la estrella, junto a los filtros, en cualquier equipo donde entres."
        alCerrar={() => setNombrando(false)}
        alGuardar={(nombre) => guardarVistas([...vistas.filter((v) => v.nombre !== nombre), { lista: "asuntos", nombre, filtros }], `Vista guardada: ${nombre}`)} />

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
