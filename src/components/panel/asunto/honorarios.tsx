"use client";
import Link from "next/link";
import { useId, useRef, useState } from "react";

import { Icono } from "@/components/panel/icons";
import { CampoFecha } from "@/components/panel/kit/campo-fecha";
import { Desplegable } from "@/components/panel/kit/desplegable";
import { Interruptor } from "@/components/panel/kit/segmentado";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/panel/ui/dropdown-menu";
import {
  agregar, cambiar, ESTADOS_PRESUPUESTO, FORMAS_PAGO, fechaCorta, hacerRecibo, hoyTexto, NOMBRE_FORMA, NOMBRE_PRESUPUESTO, subir, sumarDias, urlArchivo,
  type Asunto, type Concepto, type FormaPago, type Moneda, type Presupuesto,
} from "@/lib/panel/asuntos/api";

import { dinero, DialogoMensaje, leerMonto, personaPara, primerNombre, useFoco, type Hacer } from "./comun";
import { Pildora } from "./pildora";

const MONEDA_OP = [{ valor: "MXN", etiqueta: "Pesos" }, { valor: "USD", etiqueta: "Dólares" }] as const;

/** Lo que vale un concepto: su monto, o su porcentaje sobre el precio del inmueble (si el inmueble ya tiene precio). */
export function montoDe(c: Concepto, a: Asunto): number | null {
  if (c.monto != null) return c.monto;
  if (c.porcentaje == null) return null;
  const base = a.inmuebles.find((i) => i.id === c.base_inmueble_id) ?? (a.inmuebles.length === 1 ? a.inmuebles[0] : null);
  return base?.precio ? Math.round(base.precio * c.porcentaje) / 100 : null;
}

type Totales = Partial<Record<Moneda, number>>;
const sumar = (t: Totales, m: Moneda, n: number) => { t[m] = (t[m] ?? 0) + n; };
const textoTotales = (t: Totales) => (Object.entries(t) as [Moneda, number][]).filter(([, n]) => n > 0).map(([m, n]) => dinero(n, m)).join(" y ");

/** Lo que falta cobrar de honorarios, por moneda. Pesos y dólares no se mezclan. */
export function faltaCobrar(a: Asunto): { falta: Totales; total: Totales; cobrado: Totales } {
  const p = a.presupuestos.find((x) => x.estado === "aceptado") ?? a.presupuestos[0];
  const total: Totales = {}; const cobrado: Totales = {}; const falta: Totales = {};
  for (const c of p?.conceptos ?? []) { const n = montoDe(c, a); if (c.clase === "honorario" && n) sumar(total, c.moneda, n); }
  for (const c of a.cobros) sumar(cobrado, c.moneda, c.monto);
  for (const m of Object.keys(total) as Moneda[]) { const n = (total[m] ?? 0) - (cobrado[m] ?? 0); if (n > 0.009) falta[m] = Math.round(n * 100) / 100; }
  return { falta, total, cobrado };
}

export function resumenHonorarios(a: Asunto): string {
  const p = a.presupuestos[0];
  if (!p) return a.cobros.length ? `Cobrado ${textoTotales(faltaCobrar(a).cobrado)}` : "Sin presupuesto";
  const { falta, total } = faltaCobrar(a);
  const estado = `Presupuesto ${NOMBRE_PRESUPUESTO[p.estado].toLowerCase()}`;
  if (!textoTotales(total)) return estado;
  return [estado, textoTotales(falta) ? `Falta ${textoTotales(falta)}` : "Todo cobrado"].join(" · ");
}

function RenglonConcepto({ a, c, hacer }: { a: Asunto; c: Concepto; hacer: Hacer }) {
  const n = montoDe(c, a);
  const base = a.inmuebles.find((i) => i.id === c.base_inmueble_id);
  const detalle = c.porcentaje != null
    ? `${c.porcentaje}% del precio${base && a.inmuebles.length > 1 ? ` de ${base.nombre}` : ""}${n == null ? " (falta el precio)" : ""}`
    : c.tercero ? `Lo cobra ${c.tercero}` : "";
  return (
    <div className="as-ren">
      <span className="as-ren-c"><b>{c.concepto}</b>{detalle ? <span>{detalle}</span> : null}</span>
      <b className="as-monto">{dinero(n, c.moneda)}</b>
      <button type="button" className="as-btn as-gho as-ico" aria-label={`Quitar: ${c.concepto}`}
        onClick={() => void hacer(() => cambiar(a.id, "conceptos", { id: c.id, version: c.version, quitar: true }), "Quitado")}>
        <Icono nombre="x" tamano={15} />
      </button>
    </div>
  );
}

function NuevoConcepto({ a, p, clase, inicial, foco, hacer, vacio }: {
  a: Asunto; p: Presupuesto | null; clase: "honorario" | "tercero"; inicial?: string; foco?: boolean; hacer: Hacer; vacio: boolean;
}) {
  const [abierto, setAbierto] = useState(Boolean(foco) || (vacio && clase === "honorario"));
  if (!abierto) {
    return (
      <button type="button" className="as-ren as-agregar" onClick={() => setAbierto(true)}>
        <Icono nombre="mas" tamano={16} />{clase === "honorario" ? "Agregar honorario" : "Agregar gasto de terceros"}
      </button>
    );
  }
  return <FormaConcepto a={a} p={p} clase={clase} inicial={inicial} hacer={hacer} alCerrar={vacio && clase === "honorario" ? undefined : () => setAbierto(false)} />;
}

function FormaConcepto({ a, p, clase, inicial, hacer, alCerrar }: {
  a: Asunto; p: Presupuesto | null; clase: "honorario" | "tercero"; inicial?: string; hacer: Hacer; alCerrar?: () => void;
}) {
  const id = useId();
  const ref = useFoco<HTMLInputElement>(true);
  const [concepto, setConcepto] = useState(inicial ?? "");
  const [como, setComo] = useState<"monto" | "porcentaje">("monto");
  const [valor, setValor] = useState("");
  const [moneda, setMoneda] = useState<Moneda>(a.inmuebles[0]?.moneda ?? "MXN");
  const [base, setBase] = useState(a.inmuebles[0]?.id ?? "");
  const [tercero, setTercero] = useState("");
  const porcentaje = clase === "honorario" && como === "porcentaje";
  return (
    <form className="as-pad as-form as-borde-arriba" onSubmit={(e) => {
      e.preventDefault();
      const t = concepto.trim();
      const n = porcentaje ? Number(valor.replace(",", ".")) : leerMonto(valor);
      if (!t || !n || (porcentaje && (n <= 0 || n > 100))) return;
      setConcepto(""); setValor(""); setTercero("");
      void hacer(() => agregar(a.id, "conceptos", {
        ...(p ? { presupuesto_id: p.id } : {}), clase, concepto: t, moneda,
        ...(porcentaje ? { porcentaje: n, base_inmueble_id: base || null } : { monto: n }),
        ...(clase === "tercero" && tercero.trim() ? { tercero: tercero.trim() } : {}),
      }), "Agregado");
    }}>
      <div className="as-g2">
        <label className="pn-campo" htmlFor={`${id}-c`}>{clase === "honorario" ? "Concepto" : "Gasto"}
          <input ref={ref} id={`${id}-c`} className="as-inp as-inp-borde" value={concepto} maxLength={200} onChange={(e) => setConcepto(e.target.value)}
            placeholder={clase === "honorario" ? "Comisión, estudio, gestión…" : "Avalúo, notaría, derechos…"} />
        </label>
        {clase === "tercero" ? (
          <label className="pn-campo" htmlFor={`${id}-q`}>Lo cobra
            <input id={`${id}-q`} className="as-inp as-inp-borde" value={tercero} maxLength={120} onChange={(e) => setTercero(e.target.value)} placeholder="Notaría, valuador…" />
          </label>
        ) : (
          <Interruptor etiqueta="Cómo se cobra" opciones={[{ valor: "monto", etiqueta: "Monto" }, { valor: "porcentaje", etiqueta: "Porcentaje" }] as const} valor={como} alElegir={setComo} />
        )}
        <label className="pn-campo" htmlFor={`${id}-v`}>{porcentaje ? "Porcentaje" : "Monto"}
          <input id={`${id}-v`} className="as-inp as-inp-borde" inputMode="decimal" value={valor} maxLength={20} onChange={(e) => setValor(e.target.value)} placeholder={porcentaje ? "5" : "0"} />
        </label>
        {porcentaje && a.inmuebles.length > 1 ? (
          <Desplegable etiqueta="Sobre el precio de" valor={base} opciones={a.inmuebles.map((i) => ({ valor: i.id, etiqueta: i.nombre }))} alElegir={setBase} />
        ) : !porcentaje ? (
          <Interruptor etiqueta="Moneda" opciones={MONEDA_OP} valor={moneda} alElegir={setMoneda} />
        ) : null}
      </div>
      <div className="as-fila">
        <button type="submit" className="as-btn as-pri" aria-disabled={!concepto.trim() || !valor.trim()}><Icono nombre="mas" tamano={16} />Agregar</button>
        {alCerrar ? <button type="button" className="as-btn as-gho" onClick={alCerrar}>Cancelar</button> : null}
      </div>
    </form>
  );
}

function Cobros({ a, hacer }: { a: Asunto; hacer: Hacer }) {
  const id = useId();
  const [monto, setMonto] = useState("");
  const [moneda, setMoneda] = useState<Moneda>(a.inmuebles[0]?.moneda ?? "MXN");
  const [forma, setForma] = useState<FormaPago>("transferencia");
  const [fecha, setFecha] = useState(hoyTexto());
  const [paga, setPaga] = useState(personaPara(a, "cliente")?.persona_id ?? "");
  const personas = a.personas.filter((p) => !p.fallecida);
  const nombre = (pid: string | null) => a.personas.find((p) => p.persona_id === pid)?.nombre ?? "";
  const { falta } = faltaCobrar(a);
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <p className="as-sub as-sub-fila"><span><Icono nombre="pago" tamano={15} /> Cobros</span>
        <span className={textoTotales(falta) ? "as-warn" : "as-m"}>{textoTotales(falta) ? `Falta ${textoTotales(falta)}` : a.cobros.length ? "Todo cobrado" : ""}</span>
      </p>
      <div className="as-card">
        {a.cobros.map((c) => {
          const recibo = c.recibo_documento_id ? a.documentos.find((d) => d.id === c.recibo_documento_id) : null;
          return (
            <div key={c.id} className="as-ren">
              <Icono nombre="pago" tamano={18} />
              <span className="as-ren-c">
                <b>{dinero(c.monto, c.moneda)}</b>
                <span>{[fechaCorta(c.fecha), NOMBRE_FORMA[c.forma], nombre(c.paga_persona_id)].filter(Boolean).join(" · ")}</span>
              </span>
              {recibo?.archivos[0] ? (
                <a className="as-btn" href={urlArchivo(a.id, recibo.archivos[0].id)} target="_blank" rel="noopener noreferrer"><Icono nombre="pdf" tamano={16} />Recibo</a>
              ) : (
                <button type="button" className="as-btn" onClick={() => void hacer(() => hacerRecibo(a.id, c.id), "Recibo hecho: quedó en Documentos")}>
                  <Icono nombre="file" tamano={16} />Hacer recibo
                </button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger className="as-btn as-gho as-ico" aria-label="Más del cobro"><Icono nombre="dots" tamano={18} /></DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem peligro onSelect={() => void hacer(() => cambiar(a.id, "cobros", { id: c.id, version: c.version, quitar: true }), "Cobro quitado")}>
                    <Icono nombre="bote" tamano={16} />Quitar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
        {!abierto ? (
          <button type="button" className="as-ren as-agregar" onClick={() => setAbierto(true)}><Icono nombre="mas" tamano={16} />Anotar cobro</button>
        ) : (
        <form className="as-pad as-form as-borde-arriba" onSubmit={(e) => {
          e.preventDefault();
          const n = leerMonto(monto);
          if (!n) return;
          setMonto(""); setAbierto(false);
          void hacer(() => agregar(a.id, "cobros", { monto: n, moneda, forma, fecha, paga_persona_id: paga || null, inmueble_id: a.inmuebles[0]?.id ?? null }), "Cobro anotado");
        }}>
          <div className="as-g2">
            <label className="pn-campo" htmlFor={`${id}-m`}>Monto recibido
              <input id={`${id}-m`} autoFocus className="as-inp as-inp-borde" inputMode="decimal" value={monto} maxLength={20} onChange={(e) => setMonto(e.target.value)} placeholder="0" />
            </label>
            <Interruptor etiqueta="Moneda" opciones={MONEDA_OP} valor={moneda} alElegir={setMoneda} />
            <Desplegable etiqueta="Forma" valor={forma} opciones={FORMAS_PAGO.map((f) => ({ valor: f, etiqueta: NOMBRE_FORMA[f] }))} alElegir={(v) => { if (v) setForma(v); }} />
            <CampoFecha etiqueta="Fecha" valor={fecha || null} alElegir={(f) => setFecha(f ?? "")} />
            {personas.length ? (
              <Desplegable etiqueta="Quién pagó" valor={paga} vacio="Sin elegir" opciones={personas.map((p) => ({ valor: p.persona_id, etiqueta: p.nombre }))} alElegir={setPaga} />
            ) : null}
          </div>
          <div className="as-fila">
            <button type="submit" className="as-btn as-pri" aria-disabled={!monto.trim()}><Icono nombre="mas" tamano={16} />Anotar cobro</button>
            <button type="button" className="as-btn as-gho" onClick={() => setAbierto(false)}>Cancelar</button>
          </div>
        </form>
        )}
      </div>
    </>
  );
}

function Contrato({ a, hacer }: { a: Asunto; hacer: Hacer }) {
  const archivo = useRef<HTMLInputElement>(null);
  const doc = a.documentos.find((d) => d.es_contrato);
  const firmado = doc?.paso === "firmado";
  return (
    <>
      <p className="as-sub"><Icono nombre="sello" tamano={15} /> Contrato</p>
      <input ref={archivo} type="file" hidden accept="application/pdf,image/jpeg,image/png,image/webp" aria-label="Cargar el contrato firmado" onChange={(e) => {
        const f = [...(e.target.files ?? [])]; e.target.value = ""; if (f.length) void hacer(() => subir(a.id, "contrato", f), "Contrato firmado cargado");
      }} />
      <div className="as-card">
        <div className="as-ren">
          <Icono nombre={firmado ? "ok" : "file"} tamano={18} />
          <span className="as-ren-c">
            <b>{doc?.nombre ?? "Sin contrato todavía"}</b>
            <span>{firmado ? "Firmado" : doc ? "Sin firmar" : "Hazlo aquí por preguntas o carga el firmado."}</span>
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger className="as-btn">{doc ? "Opciones" : "Cargar"}<Icono nombre="down" tamano={14} /></DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-56">
              {doc?.archivos[0] ? <DropdownMenuItem asChild><a href={urlArchivo(a.id, doc.archivos[0].id)} target="_blank" rel="noopener noreferrer"><Icono nombre="ojo" tamano={16} />Ver</a></DropdownMenuItem> : null}
              <DropdownMenuItem asChild><Link href={`/admin/herramientas/formatos?asunto=${a.id}&ver=honorarios`}><Icono nombre="lapiz" tamano={16} />Hacer el contrato aquí</Link></DropdownMenuItem>
              <DropdownMenuItem onSelect={() => archivo.current?.click()}><Icono nombre="subir" tamano={16} />Cargar el contrato firmado</DropdownMenuItem>
              {doc && !firmado ? (
                <DropdownMenuItem onSelect={() => void hacer(() => cambiar(a.id, "documentos", { id: doc.id, version: doc.version, paso: "firmado", estado: "recibido" }), "Contrato firmado")}>
                  <Icono nombre="ok" tamano={16} />Marcar como firmado
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </>
  );
}

/** Honorarios (boceto): presupuesto con honorarios y gastos de terceros por separado, quién paga, vigencia, contrato y cobros con su recibo. */
export function Honorarios({ a, foco, hacer }: { a: Asunto; foco: string | null; hacer: Hacer }) {
  const p = a.presupuestos[0] ?? null;
  const archivo = useRef<HTMLInputElement>(null);
  const [mensaje, setMensaje] = useState(false);
  const honorarios = p?.conceptos.filter((c) => c.clase === "honorario") ?? [];
  const terceros = p?.conceptos.filter((c) => c.clase === "tercero") ?? [];
  const totalDe = (lista: Concepto[]) => { const t: Totales = {}; for (const c of lista) { const n = montoDe(c, a); if (n) sumar(t, c.moneda, n); } return textoTotales(t); };
  const personas = a.personas.filter((x) => !x.fallecida);
  const pagaId = p?.paga_persona_id ?? "";
  const para = (pagaId ? a.personas.find((x) => x.persona_id === pagaId) : null) ?? personaPara(a, "cliente");
  const doc = p?.documento_id ? a.documentos.find((d) => d.id === p.documento_id) : null;
  const vence = p?.vigente_hasta ? fechaCorta(p.vigente_hasta).toLowerCase() : "";
  const lineas = [...honorarios, ...terceros].map((c) => `• ${c.concepto}: ${dinero(montoDe(c, a), c.moneda)}${c.clase === "tercero" ? " (gasto de terceros)" : ""}`);
  const textoMensaje = `Hola${para ? ` ${primerNombre(para.nombre)}` : ""}, le comparto el presupuesto de ${a.nombre}:\n${lineas.join("\n")}\n\nHonorarios: ${totalDe(honorarios) || "—"}${terceros.length ? `\nGastos de terceros: ${totalDe(terceros)}` : ""}\nVigente hasta el ${fechaCorta(p?.vigente_hasta ?? sumarDias(15)).toLowerCase()}.`;
  const cambiarP = (c: Record<string, unknown>, aviso?: string) => p ? hacer(() => cambiar(a.id, "presupuestos", { id: p.id, version: p.version, ...c }), aviso) : Promise.resolve();

  if (!p && foco !== "cobrar-estudio") {
    return (
      <div className="as-form">
        <div className="as-vacio">
          <Icono nombre="cartera" tamano={26} />
          <b>Sin presupuesto</b>
          <button type="button" className="as-btn as-pri" onClick={() => void hacer(() => agregar(a.id, "presupuestos", {}), "Presupuesto nuevo")}><Icono nombre="mas" tamano={16} />Hacer presupuesto</button>
        </div>
        <Contrato a={a} hacer={hacer} />
        <Cobros a={a} hacer={hacer} />
      </div>
    );
  }

  return (
    <div className="as-form">
      <div className="as-card as-pad as-form">
        <div className="as-fila">
          <b>Presupuesto {p?.numero ?? 1}</b>
          {p ? (
            <Pildora etiqueta="Cómo va el presupuesto" valor={p.estado} opciones={ESTADOS_PRESUPUESTO.map((e) => ({ valor: e, etiqueta: NOMBRE_PRESUPUESTO[e] }))}
              alElegir={(v) => { if (v !== p.estado) void cambiarP({ estado: v }, v === "enviado" ? "Enviado: quedó la tarea de seguimiento" : NOMBRE_PRESUPUESTO[v]); }} />
          ) : null}
          <span className="as-sp" />
          {p ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="as-btn as-gho as-ico" aria-label="Más del presupuesto"><Icono nombre="dots" tamano={18} /></DropdownMenuTrigger>
              <DropdownMenuContent className="min-w-60">
                <DropdownMenuItem onSelect={() => setMensaje(true)}><Icono nombre="chat" tamano={16} />Enviar por WhatsApp</DropdownMenuItem>
                {doc?.archivos[0] ? <DropdownMenuItem asChild><a href={urlArchivo(a.id, doc.archivos[0].id)} target="_blank" rel="noopener noreferrer"><Icono nombre="pdf" tamano={16} />Ver el PDF</a></DropdownMenuItem> : null}
                <DropdownMenuItem onSelect={() => archivo.current?.click()}><Icono nombre="subir" tamano={16} />Cargar un PDF hecho por fuera</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => void hacer(() => agregar(a.id, "presupuestos", { copiar_de: p.id }), `Presupuesto ${p.numero + 1}: copia del ${p.numero}`)}>
                  <Icono nombre="copia" tamano={16} />Hacer otra versión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
        {p?.estado === "enviado" && vence ? <p className="as-m">Vigente hasta {vence}{p.enviado_el ? ` · enviado ${fechaCorta(p.enviado_el.slice(0, 10)).toLowerCase()}` : ""}</p> : null}
        <div className="as-g2">
          {personas.length ? (
            <Desplegable etiqueta="Quién paga" valor={pagaId} vacio="Sin elegir" opciones={personas.map((x) => ({ valor: x.persona_id, etiqueta: x.nombre }))}
              alElegir={(v) => void cambiarP({ paga_persona_id: v || null }, "Anotado")} />
          ) : null}
          {p ? (
            <CampoFecha etiqueta="Vigente hasta" valor={p.vigente_hasta ?? null} vacio="Sin fecha" alElegir={(f) => void cambiarP({ vigente_hasta: f }, "Vigencia anotada")} />
          ) : null}
        </div>
      </div>
      <input ref={archivo} type="file" hidden accept="application/pdf" aria-label="Cargar el presupuesto en PDF" onChange={(e) => {
        const f = [...(e.target.files ?? [])]; e.target.value = ""; if (f.length) void hacer(() => subir(a.id, "presupuesto", f), "Presupuesto cargado");
      }} />

      <p className="as-sub as-sub-fila"><span><Icono nombre="cartera" tamano={15} /> Honorarios</span><b>{totalDe(honorarios)}</b></p>
      <div className="as-card">
        {honorarios.map((c) => <RenglonConcepto key={c.id} a={a} c={c} hacer={hacer} />)}
        <NuevoConcepto a={a} p={p} clase="honorario" hacer={hacer} vacio={!honorarios.length} foco={foco === "cobrar-estudio"} inicial={foco === "cobrar-estudio" ? "Estudio del caso" : undefined} />
      </div>

      <p className="as-sub as-sub-fila"><span><Icono nombre="calc" tamano={15} /> Gastos de terceros</span><b>{totalDe(terceros)}</b></p>
      <div className="as-card">
        {terceros.map((c) => <RenglonConcepto key={c.id} a={a} c={c} hacer={hacer} />)}
        <NuevoConcepto a={a} p={p} clase="tercero" hacer={hacer} vacio={!terceros.length} />
      </div>

      <Contrato a={a} hacer={hacer} />
      <Cobros a={a} hacer={hacer} />

      <DialogoMensaje abierto={mensaje} titulo="Enviar el presupuesto" para={para} inicial={textoMensaje} alCerrar={() => setMensaje(false)}
        alEnviar={() => { if (p?.estado === "borrador") void cambiarP({ estado: "enviado" }, "Enviado: quedó la tarea de seguimiento"); }} />
    </div>
  );
}

export { MONEDA_OP };
