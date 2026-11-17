"use client";
import { useId, useRef, useState } from "react";

import { Icono } from "@/components/panel/icons";
import { Desplegable } from "@/components/panel/kit/desplegable";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/panel/ui/dropdown-menu";
import {
  agregar, cambiar, subir, TIPOS_COLUMNA,
  type Apartado, type Asunto, type Columna, type FilaPropia, type TipoColumna, type ValorCelda,
} from "@/lib/panel/asuntos/api";

import { dinero, leerMonto, useFoco, type Hacer } from "./comun";

const NOMBRE_TIPO_COLUMNA: Record<TipoColumna, string> = { texto: "Texto", numero: "Número", dinero: "Dinero", fecha: "Fecha", si_no: "Sí o no" };
const TEXTO: Columna = { clave: "texto", nombre: "Renglón", tipo: "texto" };

/** Las columnas del apartado; la del renglón siempre va primero, para que cambiar de vista no pierda nada. */
export function columnasDe(x: Apartado): Columna[] {
  const c = x.columnas.length ? x.columnas : [TEXTO];
  return c.some((y) => y.clave === "texto") ? c : [TEXTO, ...c];
}

const valorDe = (f: FilaPropia, c: Columna): ValorCelda => (c.clave === "texto" ? f.texto : f.datos[c.clave] ?? null);
const numero = (v: ValorCelda) => (typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v.replace(/[^0-9.-]/g, "")) || null : null);

function claveNueva(nombre: string, usadas: string[]): string {
  const base = nombre.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 30) || "columna";
  let k = base; let n = 2;
  while (usadas.includes(k)) k = `${base}_${n++}`;
  return k;
}

/** Una celda que se guarda al salir de ella. */
function Celda({ a, f, c, hacer }: { a: Asunto; f: FilaPropia; c: Columna; hacer: Hacer }) {
  const actual = valorDe(f, c);
  const [v, setV] = useState(actual === null || actual === undefined ? "" : String(actual));
  const [editando, setEditando] = useState(false);
  const guardar = (nuevo: ValorCelda) => {
    if (nuevo === actual) return;
    void hacer(() => cambiar(a.id, "filas", { id: f.id, version: f.version, ...(c.clave === "texto" ? { texto: String(nuevo ?? "") } : { datos: { [c.clave]: nuevo } }) }));
  };
  if (c.tipo === "si_no") {
    const si = actual === true;
    return (
      <button type="button" className="as-ckb" aria-label={`${c.nombre}: ${si ? "sí" : "no"}`} onClick={() => guardar(!si)}>
        <span className="as-ck as-ck-cu">{si ? <Icono nombre="ok" tamano={12} /> : null}</span>
      </button>
    );
  }
  const num = c.tipo === "numero" || c.tipo === "dinero";
  // Los números se ven con separadores (y el dinero con su signo); al editarlos, tal cual se escriben.
  const n = num && !editando ? numero(v) : null;
  const visto = n === null ? v : c.tipo === "dinero" ? `$${n.toLocaleString("es-MX", { maximumFractionDigits: 2 })}` : n.toLocaleString("es-MX");
  return (
    <input className="as-celda" aria-label={c.nombre} type={c.tipo === "fecha" ? "date" : "text"} inputMode={num ? "decimal" : undefined}
      data-num={num || undefined} value={visto} maxLength={2000} onChange={(e) => setV(e.target.value)} onFocus={() => setEditando(true)}
      onBlur={() => { setEditando(false); guardar(num ? (v.trim() ? (c.tipo === "dinero" ? leerMonto(v) : numero(v)) : null) : v.trim() ? v : c.clave === "texto" ? "" : null); }} />
  );
}

function CabezaColumna({ a, x, c, cols, hacer }: { a: Asunto; x: Apartado; c: Columna; cols: Columna[]; hacer: Hacer }) {
  const [nombre, setNombre] = useState(c.nombre);
  const poner = (lista: Columna[], aviso?: string) => void hacer(() => cambiar(a.id, "apartados", { id: x.id, version: x.version, columnas: lista }), aviso);
  return (
    <th scope="col">
      <span className="as-cabeza">
        <input className="as-celda as-celda-cabeza" aria-label="Nombre de la columna" value={nombre} maxLength={60} onChange={(e) => setNombre(e.target.value)}
          onBlur={() => { const n = nombre.trim(); if (n && n !== c.nombre) poner(cols.map((y) => (y.clave === c.clave ? { ...y, nombre: n } : y))); else setNombre(c.nombre); }} />
        {c.clave !== "texto" ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="as-btn as-gho as-ico as-ico-chico" aria-label={`Opciones de ${c.nombre}`}><Icono nombre="down" tamano={13} /></DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Tipo</DropdownMenuLabel>
              {TIPOS_COLUMNA.filter((t) => t !== c.tipo).map((t) => (
                <DropdownMenuItem key={t} onSelect={() => poner(cols.map((y) => (y.clave === c.clave ? { ...y, tipo: t } : y)), `${c.nombre}: ${NOMBRE_TIPO_COLUMNA[t].toLowerCase()}`)}>
                  Cambiar a {NOMBRE_TIPO_COLUMNA[t].toLowerCase()}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem peligro onSelect={() => poner(cols.filter((y) => y.clave !== c.clave), `Se quitó la columna ${c.nombre}`)}>
                <Icono nombre="bote" tamano={16} />Quitar columna
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </span>
    </th>
  );
}

function NuevaColumna({ a, x, cols, hacer }: { a: Asunto; x: Apartado; cols: Columna[]; hacer: Hacer }) {
  const id = useId();
  const [abierta, setAbierta] = useState(false);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<TipoColumna>("texto");
  if (!abierta) return <button type="button" className="as-btn as-gho" onClick={() => setAbierta(true)}><Icono nombre="mas" tamano={15} />Columna</button>;
  return (
    <form className="as-card as-pad as-form" onSubmit={(e) => {
      e.preventDefault();
      const n = nombre.trim();
      if (!n) return;
      setNombre(""); setAbierta(false);
      void hacer(() => cambiar(a.id, "apartados", { id: x.id, version: x.version, columnas: [...cols, { clave: claveNueva(n, cols.map((c) => c.clave)), nombre: n, tipo }] }), `Columna nueva: ${n}`);
    }}>
      <div className="as-g2">
        <label className="pn-campo" htmlFor={`${id}-n`}>Nombre de la columna
          <input id={`${id}-n`} autoFocus className="as-inp as-inp-borde" value={nombre} maxLength={60} onChange={(e) => setNombre(e.target.value)} />
        </label>
        <Desplegable etiqueta="Tipo" valor={tipo} opciones={TIPOS_COLUMNA.map((t) => ({ valor: t, etiqueta: NOMBRE_TIPO_COLUMNA[t] }))} alElegir={(v) => { if (v) setTipo(v); }} />
      </div>
      <div className="as-fila as-fin">
        <button type="button" className="as-btn as-gho" onClick={() => setAbierta(false)}>Cancelar</button>
        <button type="submit" className="as-btn as-pri" aria-disabled={!nombre.trim()}>Agregar</button>
      </div>
    </form>
  );
}

function Tabla({ a, x, hacer }: { a: Asunto; x: Apartado; hacer: Hacer }) {
  const cols = columnasDe(x);
  const filas = a.filas.filter((f) => f.apartado_id === x.id);
  const sumables = cols.filter((c) => c.tipo === "numero" || c.tipo === "dinero");
  return (
    <div className="as-form">
      <div className="as-card as-tabla-env">
        <table className="as-tabla">
          <thead>
            <tr>
              {cols.map((c) => <CabezaColumna key={`${c.clave}-${c.nombre}`} a={a} x={x} c={c} cols={cols} hacer={hacer} />)}
              <th aria-label="Quitar" />
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.id}>
                {cols.map((c) => <td key={c.clave} data-tipo={c.tipo}><Celda key={`${f.version}`} a={a} f={f} c={c} hacer={hacer} /></td>)}
                <td>
                  <button type="button" className="as-btn as-gho as-ico as-ico-chico" aria-label="Quitar renglón"
                    onClick={() => void hacer(() => cambiar(a.id, "filas", { id: f.id, version: f.version, quitar: true }), "Renglón quitado")}>
                    <Icono nombre="x" tamano={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          {sumables.length && filas.length > 1 ? (
            <tfoot>
              <tr>
                {cols.map((c, n) => {
                  if (!sumables.includes(c)) return <td key={c.clave}>{n === 0 ? <b>Total</b> : null}</td>;
                  const s = filas.reduce((t, f) => t + (numero(valorDe(f, c)) ?? 0), 0);
                  return <td key={c.clave} data-tipo={c.tipo}><b>{c.tipo === "dinero" ? dinero(s) : s.toLocaleString("es-MX")}</b></td>;
                })}
                <td />
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>
      <div className="as-fila">
        <button type="button" className="as-btn" onClick={() => void hacer(() => agregar(a.id, "filas", { apartado_id: x.id, texto: "" }))}><Icono nombre="mas" tamano={15} />Renglón</button>
        <NuevaColumna a={a} x={x} cols={cols} hacer={hacer} />
      </div>
    </div>
  );
}

/** Galería: una tarjeta por renglón, con su foto. Si hay precio y superficie, saca el precio por m² y el promedio (sirve para comparables). */
function Galeria({ a, x, foco, hacer }: { a: Asunto; x: Apartado; foco: boolean; hacer: Hacer }) {
  const ref = useFoco<HTMLInputElement>(foco);
  const fotos = useRef<HTMLInputElement>(null);
  const [para, setPara] = useState<string | null>(null);
  const [nuevo, setNuevo] = useState("");
  const cols = columnasDe(x);
  const filas = a.filas.filter((f) => f.apartado_id === x.id);
  const precio = cols.find((c) => c.tipo === "dinero");
  const sup = cols.find((c) => c.tipo === "numero" && /superficie|m²|m2|metros/i.test(c.nombre));
  const porM2 = (f: FilaPropia) => {
    const p = precio ? numero(valorDe(f, precio)) : null; const s = sup ? numero(valorDe(f, sup)) : null;
    return p && s ? p / s : null;
  };
  const conM2 = filas.map(porM2).filter((n): n is number => n !== null);
  const promedio = conM2.length ? conM2.reduce((t, n) => t + n, 0) / conM2.length : null;
  return (
    <div className="as-form">
      <input ref={fotos} type="file" hidden accept="image/jpeg,image/png,image/webp" aria-label="Foto" onChange={(e) => {
        const f = [...(e.target.files ?? [])]; e.target.value = "";
        if (f.length && para) void hacer(() => subir(a.id, "fila", f.slice(0, 1), para), "Foto puesta");
      }} />
      {promedio !== null && conM2.length > 1 ? (
        <div className="as-ban" role="status"><Icono nombre="calc" tamano={16} /><span>Promedio <b>{dinero(Math.round(promedio))}</b> por m² en {conM2.length}</span></div>
      ) : null}
      <div className="as-galeria">
        {filas.map((f) => {
          const m2 = porM2(f);
          return (
            <article key={f.id} className="as-card as-gal">
              <button type="button" className="as-gal-foto" aria-label={f.foto_url ? "Cambiar la foto" : "Poner foto"} onClick={() => { setPara(f.id); fotos.current?.click(); }}>
                {f.foto_url ? <img src={f.foto_url} alt="" /> : <span><Icono nombre="img" tamano={22} />Foto</span>}
              </button>
              <div className="as-gal-c">
                {cols.map((c) => (
                  <label key={c.clave} className="as-gal-campo" data-titulo={c.clave === "texto" || undefined}>
                    {c.clave !== "texto" ? <span>{c.nombre}</span> : null}
                    <Celda key={`${f.version}`} a={a} f={f} c={c} hacer={hacer} />
                  </label>
                ))}
                {m2 !== null ? <p className="as-m">{dinero(Math.round(m2))} por m²</p> : null}
              </div>
              <button type="button" className="as-btn as-gho as-ico as-gal-quitar" aria-label="Quitar tarjeta"
                onClick={() => void hacer(() => cambiar(a.id, "filas", { id: f.id, version: f.version, quitar: true }), "Tarjeta quitada")}>
                <Icono nombre="x" tamano={15} />
              </button>
            </article>
          );
        })}
      </div>
      <form className="as-fila as-nw" onSubmit={(e) => {
        e.preventDefault();
        const t = nuevo.trim();
        if (!t) return;
        setNuevo("");
        void hacer(() => agregar(a.id, "filas", { apartado_id: x.id, texto: t })).then(() => ref.current?.focus());
      }}>
        <input ref={ref} className="as-inp as-inp-borde as-crece" value={nuevo} maxLength={500} onChange={(e) => setNuevo(e.target.value)} placeholder="Agregar tarjeta" aria-label="Agregar tarjeta" />
        {nuevo.trim() ? <button type="submit" className="as-btn">Agregar</button> : null}
      </form>
      <NuevaColumna a={a} x={x} cols={cols} hacer={hacer} />
    </div>
  );
}

function Lista({ a, x, foco, hacer }: { a: Asunto; x: Apartado; foco: boolean; hacer: Hacer }) {
  const ref = useFoco<HTMLInputElement>(foco);
  const [nuevo, setNuevo] = useState("");
  const filas = a.filas.filter((f) => f.apartado_id === x.id);
  return (
    <div className="as-card">
      {filas.map((f) => (
        <div key={f.id} className="as-t" data-est={f.hecho ? "hecha" : "pendiente"}>
          <button type="button" className="as-ckb" aria-label={`${f.hecho ? "Desmarcar" : "Marcar"}: ${f.texto}`}
            onClick={() => void hacer(() => cambiar(a.id, "filas", { id: f.id, version: f.version, hecho: !f.hecho }))}>
            <span className="as-ck as-ck-cu">{f.hecho ? <Icono nombre="ok" tamano={12} /> : null}</span>
          </button>
          <span className="as-tb"><span className="as-n">{f.texto || "Sin nombre"}</span></span>
          <button type="button" className="as-btn as-gho as-ico" aria-label={`Quitar: ${f.texto}`}
            onClick={() => void hacer(() => cambiar(a.id, "filas", { id: f.id, version: f.version, quitar: true }), "Renglón quitado")}>
            <Icono nombre="x" tamano={16} />
          </button>
        </div>
      ))}
      <form className="as-pad" onSubmit={(e) => {
        e.preventDefault();
        const t = nuevo.trim();
        if (!t) return;
        setNuevo("");
        void hacer(() => agregar(a.id, "filas", { apartado_id: x.id, texto: t })).then(() => ref.current?.focus());
      }}>
        <input ref={ref} className="as-inp as-inp-borde" value={nuevo} maxLength={500} onChange={(e) => setNuevo(e.target.value)} placeholder="Agregar renglón" aria-label="Agregar renglón" />
      </form>
    </div>
  );
}

function Texto({ a, x, hacer }: { a: Asunto; x: Apartado; hacer: Hacer }) {
  const [valor, setValor] = useState(x.texto);
  const guardado = valor === x.texto;
  return (
    <>
      <textarea className="as-inp as-inp-borde as-area as-area-larga" value={valor} maxLength={50000} aria-label={x.nombre ?? "Texto"}
        onChange={(e) => setValor(e.target.value)}
        onBlur={() => { if (!guardado) void hacer(() => cambiar(a.id, "apartados", { id: x.id, version: x.version, texto: valor })); }}
        placeholder="Escribe aquí. Se guarda al salir del cuadro." />
      <p className="as-m">{guardado ? "Guardado" : "Sin guardar todavía"}</p>
    </>
  );
}

export function resumenPropio(x: Apartado, a: Asunto): string {
  if (x.vista === "texto") return x.texto.trim() ? x.texto.trim().split("\n")[0] : "Vacío";
  const filas = a.filas.filter((f) => f.apartado_id === x.id);
  if (!filas.length) return "Vacío";
  if (x.vista === "lista" || !x.vista) return `${filas.filter((f) => f.hecho).length} de ${filas.length}`;
  return `${filas.length} ${x.vista === "galeria" ? (filas.length > 1 ? "tarjetas" : "tarjeta") : filas.length > 1 ? "renglones" : "renglón"}`;
}

/** Un apartado propio, en la vista que se eligió: lista, tabla, galería o texto. */
export function Propio({ a, x, foco, hacer }: { a: Asunto; x: Apartado; foco: boolean; hacer: Hacer }) {
  switch (x.vista) {
    case "texto": return <Texto a={a} x={x} hacer={hacer} />;
    case "tabla": return <Tabla a={a} x={x} hacer={hacer} />;
    case "galeria": return <Galeria a={a} x={x} foco={foco} hacer={hacer} />;
    default: return <Lista a={a} x={x} foco={foco} hacer={hacer} />;
  }
}
