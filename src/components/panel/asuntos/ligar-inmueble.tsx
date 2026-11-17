"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState, type KeyboardEvent } from "react";

import { Icono } from "@/components/panel/icons";
import { Hoja } from "@/components/panel/kit/hoja";
import { formatPrecio, type Property } from "@/data/propiedades";
import { filtrar, type Entrada } from "@/lib/panel/buscar";

/**
 * «Ligar inmueble» con la misma caja de «Buscar o crear» del kit (clases `pn-paleta`): se escribe título, folio o zona,
 * flechas y Enter eligen, y abajo «O crea: Inmueble» lleva al alta de Inmuebles. Los ya ligados no salen.
 */
export function LigarInmueble({ abierta, inmuebles, yaLigados, ocupado, alElegir, alCerrar }: {
  abierta: boolean; inmuebles: readonly Property[]; yaLigados: ReadonlySet<string>; ocupado: boolean;
  alElegir: (p: Property) => void; alCerrar: () => void;
}) {
  return (
    <Hoja abierta={abierta} titulo="Ligar inmueble" alCerrar={alCerrar} ocultarTitulo plana ancha>
      {abierta ? <Contenido inmuebles={inmuebles} yaLigados={yaLigados} ocupado={ocupado} alElegir={alElegir} alCerrar={alCerrar} /> : null}
    </Hoja>
  );
}

type Opcion = Entrada & { inmueble: Property };

function Contenido({ inmuebles, yaLigados, ocupado, alElegir, alCerrar }: {
  inmuebles: readonly Property[]; yaLigados: ReadonlySet<string>; ocupado: boolean; alElegir: (p: Property) => void; alCerrar: () => void;
}) {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [activa, setActiva] = useState(0);
  const entradas = useMemo<Opcion[]>(() => inmuebles.filter((p) => !yaLigados.has(p.slug)).map((p) => ({
    id: p.slug, grupo: "Inmuebles" as const, titulo: p.titulo,
    detalle: [p.codigo, p.zona, p.precio ? formatPrecio(p.precio) : null].filter(Boolean).join(" · "),
    claves: [p.codigo, p.codigo.replace(/^FORTIUS-0*/, ""), p.zona ?? ""], inmueble: p,
  })), [inmuebles, yaLigados]);
  const lista = useMemo(() => (texto.trim() ? (filtrar(entradas, texto) as Opcion[]) : entradas).slice(0, 30), [entradas, texto]);
  const actual = Math.min(activa, Math.max(0, lista.length - 1));
  const elegir = (i: number) => { const o = lista[i]; if (o && !ocupado) alElegir(o.inmueble); };
  const alTeclear = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiva(Math.min(lista.length - 1, actual + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiva(Math.max(0, actual - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); elegir(actual); }
  };
  return (
    <div className="pn-paleta" onKeyDown={alTeclear}>
      <div className="pn-paleta-entrada">
        <Icono nombre="buscar" tamano={18} />
        <input value={texto} onChange={(e) => { setTexto(e.target.value); setActiva(0); }} placeholder="Busca el inmueble por título, folio o zona"
          role="combobox" aria-expanded="true" aria-controls="as-ligar-lista" aria-activedescendant={lista.length ? `as-ligar-${lista[actual]?.id}` : undefined}
          aria-label="Buscar inmueble para ligar" autoComplete="off" autoFocus />
        <kbd className="pn-kbd pn-solo-escritorio" aria-hidden>Esc</kbd>
      </div>
      <ul className="pn-paleta-lista" id="as-ligar-lista" role="listbox" aria-label="Inmuebles">
        {lista.length === 0 ? <li className="pn-paleta-grupo" role="presentation">{entradas.length ? "Nada coincide." : "No hay más inmuebles para ligar."}</li> : null}
        {lista.map((o, i) => (
          <li key={o.id} role="presentation">
            {i === 0 ? <div className="pn-paleta-grupo" role="presentation">Inmuebles</div> : null}
            <button type="button" id={`as-ligar-${o.id}`} role="option" aria-selected={i === actual} className="pn-paleta-op" disabled={ocupado} onClick={() => elegir(i)} onMouseMove={() => setActiva(i)}>
              <span className="pn-paleta-ini" aria-hidden><Icono nombre="casa" tamano={16} /></span>
              <span style={{ minWidth: 0, display: "grid" }}>
                <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.titulo}</span>
                {o.detalle ? <span style={{ fontSize: 12, color: "var(--ink-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.detalle}</span> : null}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="pn-solo-lector" aria-live="polite">{texto.trim() ? (lista.length === 1 ? "1 resultado" : `${lista.length} resultados`) : ""}</p>
      <div className="pn-paleta-pie">
        <span>O crea:</span>
        <button type="button" className="pn-paleta-crea" onClick={() => { alCerrar(); router.push("/panel/inmuebles"); }}>Inmueble</button>
        <span className="pn-solo-escritorio" style={{ marginLeft: "auto" }} aria-hidden><kbd className="pn-kbd">↑</kbd> <kbd className="pn-kbd">↓</kbd> moverse · <kbd className="pn-kbd">Enter</kbd> ligar</span>
      </div>
    </div>
  );
}
