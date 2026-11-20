"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";

import { useColeccion } from "@/components/panel/datos/use-coleccion";
import { FilaEmitido, TarjetaBorrador } from "@/components/panel/formatos/emitido";
import { useAvisos } from "@/components/panel/kit/avisos";
import "@/components/panel/formatos/formatos.css";
import { Gesto, Icono } from "@/components/panel/icons";
import { Cargando, EstadoError, Vacio } from "@/components/panel/kit/estados";
import { Fila } from "@/components/panel/kit/lista";
import { HojaAdaptable } from "@/components/panel/ui/hoja-adaptable";
import { BotonesDeVista } from "@/components/panel/kit/segmentado";
import "@/components/panel/asunto/asunto.css";
import "@/components/panel/asunto/vistas.css";
import type { Property } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import { aTexto } from "@/lib/panel/calendario";
import { filasAsuntos, type Expediente } from "@/lib/panel/datos/asuntos";
import { leerExpedientes } from "@/lib/panel/datos/colecciones";
import {
  agruparCatalogo, buscarEnCatalogo, catalogo, filasDocumentos, NOMBRE_GRUPO_FORMATO, ordenarAsuntosPara,
  type DocumentoLista, type EntradaCatalogo,
} from "@/lib/panel/datos/formatos";
import { crearDocumento, leerDocumentos } from "@/lib/panel/datos/formatos-acciones";
import { entradaDeFormato, rutaAsunto, rutaCaptura } from "@/lib/panel/datos/formatos-navegacion";

/**
 * Formatos (PN-06), como el boceto: Catálogo, Borradores y Emitidos con el buscador al lado; cada formato con su número.
 * Empezar uno pregunta el tipo (levantamientos) y «¿Para qué asunto?» (los de su operación primero, el primero «Sugerido»)
 * y abre su ventana de captura; el folio y los datos del asunto los pone el servidor.
 * Teclas: / busca; 1, 2 y 3 cambian entre catálogo, borradores y emitidos.
 */
type Vista = "catalogo" | "borradores" | "emitidos";

function Formatos() {
  const router = useRouter();
  const { avisar } = useAvisos();
  const personas = useColeccion<Cliente>("clientes");
  const inmuebles = useColeccion<Property>("propiedades");
  const [expedientes, setExpedientes] = useState<Expediente[] | null>(null);
  const [docs, setDocs] = useState<DocumentoLista[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);
  const [vista, setVista] = useState<Vista>("catalogo");
  const [buscar, setBuscar] = useState("");
  const [hoy] = useState(() => aTexto(new Date()));
  // Desde un asunto: `?asunto=<id>` lo deja elegido al empezar y `&formato=<id>` abre de una vez su hoja de Empezar.
  // Al cerrar la captura se regresa a ese asunto.
  const params = useSearchParams();
  const asuntoPedido = params.get("asunto");
  const [pedido] = useState(() => entradaDeFormato(params.get("formato")));
  const [eligiendo, setEligiendo] = useState<EntradaCatalogo | null>(pedido?.entrada ?? null);

  useEffect(() => {
    const c = new AbortController();
    Promise.all([leerExpedientes<Expediente>(c.signal), leerDocumentos(c.signal)]).then(
      ([e, d]) => { setExpedientes(e); setDocs(d); setError(null); },
      (e: unknown) => { if (!c.signal.aborted) setError(e instanceof Error ? e.message : "No se pudieron leer los formatos."); },
    );
    return () => c.abort();
  }, [intento]);

  const asuntos = useMemo(() => {
    if (!expedientes) return [];
    const filas = filasAsuntos(expedientes, { personas: personas.datos, inmuebles: inmuebles.datos, tareas: [], hoy });
    return filas.filter((f) => f.estado !== "cerrado").map((f) => ({ ...f, operacion: expedientes.find((e) => e.id === f.id)?.operacion ?? "otra" }));
  }, [expedientes, personas.datos, inmuebles.datos, hoy]);
  const nombreAsunto = useMemo(() => {
    const m = new Map(asuntos.map((a) => [a.id, a.titulo]));
    return (id: string) => m.get(id);
  }, [asuntos]);

  const entradas = useMemo(() => buscarEnCatalogo(catalogo(), buscar), [buscar]);
  const filas = useMemo(() => filasDocumentos(docs ?? [], nombreAsunto), [docs, nombreAsunto]);
  const borradores = filas.filter((f) => !f.emitido);
  const emitidos = filas.filter((f) => f.emitido);

  const empezar = async (formatoId: string, expedienteId: string): Promise<boolean> => {
    try {
      const d = await crearDocumento(expedienteId, formatoId);
      router.push(rutaCaptura(d.id, asuntoPedido === expedienteId ? rutaAsunto(expedienteId) : null));
      return true;
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se pudo empezar. Vuelve a intentarlo.");
      return false;
    }
  };

  const cargando = !error && (expedientes === null || docs === null);
  const q = buscar.trim().toLowerCase();
  const coincide = (f: { titulo: string; linea: string }) => !q || `${f.titulo} ${f.linea}`.toLowerCase().includes(q);
  const borradoresVistos = borradores.filter(coincide);
  const emitidosVistos = emitidos.filter(coincide);

  // «/» busca; 1, 2 y 3 cambian de vista. No actúan mientras se escribe ni con una hoja abierta.
  const caja = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.closest("[role=dialog]"))) return;
      if (e.key === "/") { e.preventDefault(); caja.current?.focus(); return; }
      const v = ({ "1": "catalogo", "2": "borradores", "3": "emitidos" } as const)[e.key as "1" | "2" | "3"];
      if (v) { e.preventDefault(); setVista(v); }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, []);


  return (
    <div className="as-vista fmt-vista">
      {/* La barra de 52 px del modelo visual: título, las tres vistas en una fila de botones y el buscador. */}
      <header className="as-vbar">
        <h1 className="as-h1-lista">Formatos</h1>
        <span className="as-cab-n fmt-sub">Se llenan sobre el documento y el PDF sale igual</span>
        <span className="as-sp" />
        <BotonesDeVista etiqueta="Vista" valor={vista} alElegir={setVista} opciones={[
          { valor: "catalogo", etiqueta: "Catálogo" },
          { valor: "borradores", etiqueta: "Borradores", cuenta: borradores.length },
          { valor: "emitidos", etiqueta: "Emitidos", cuenta: emitidos.length },
        ]} />
        <label className="as-buscar as-vbuscar fmt-buscar">
          <Icono nombre="buscar" tamano={14} aria-hidden />
          <span className="pn-solo-lector">Buscar un formato</span>
          <input ref={caja} type="search" value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Número o nombre (09, recibo)" autoComplete="off" />
        </label>
      </header>
      <div className="fmt-cuerpo">
      {asuntoPedido && !pedido && !cargando ? (
        <p className="pn-sub" style={{ margin: 0 }}>
          {nombreAsunto(asuntoPedido) ? `Para ${nombreAsunto(asuntoPedido)}: elige el formato.` : "Ese asunto ya no está abierto; elige el asunto al empezar."}
        </p>
      ) : null}
        {vista === "catalogo" ? (
          <div className="fmt-grupos">
            {entradas.length === 0 ? (
              <div className="pn-tarjeta pn-fmt-vacio"><strong>Ningún formato coincide</strong><span>Prueba con el número (09) o una palabra del nombre (recibo, contrato, visita).</span></div>
            ) : null}
            {agruparCatalogo(entradas).map(({ grupo, entradas: es }) => (
              <section key={grupo}>
                <h2 className="pn-fmt-grupo">{NOMBRE_GRUPO_FORMATO[grupo]}</h2>
                <div className="pn-tarjeta pn-lista">
                  {es.map((e) => (
                    <Fila key={e.id} izquierda={<span className="pn-fmt-num" aria-hidden>{e.numero}</span>}
                      titulo={e.titulo} subtitulo={e.queEs} detalle={e.abogado ? "Falta revisión del abogado" : undefined} tonoDetalle="aviso"
                      derecha={<Gesto nombre="derecha" tamano={18} className="pn-fmt-flecha" aria-hidden />}
                      alPulsar={() => setEligiendo(e)} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : null}

        {(["borradores", "emitidos"] as const).filter((v) => v === vista).map((v) => {
          const lista = v === "borradores" ? borradoresVistos : emitidosVistos;
          const total = v === "borradores" ? borradores.length : emitidos.length;
          return (
            <div key={v} role="tabpanel" aria-label={v === "borradores" ? "Borradores" : "Emitidos"}>
              <div className="fmt-grupos">
                {cargando ? <Cargando lineas={4} etiqueta="Cargando documentos" /> : null}
                {error ? <EstadoError texto={error} alReintentar={() => { setError(null); setIntento((n) => n + 1); }} /> : null}
                {!cargando && !error && total === 0 ? (
                  <div className="pn-tarjeta pn-fmt-vacio">
                    <strong>{v === "borradores" ? "Sin borradores" : "Sin emitidos"}</strong>
                    <span>{v === "borradores" ? "Lo que empieces en el catálogo queda aquí hasta que generes el PDF." : "Cada PDF que generas aparece aquí, con su copia firmada cuando la subas."}</span>
                  </div>
                ) : null}
                {!cargando && !error && total > 0 && lista.length === 0 ? (
                  <div className="pn-tarjeta pn-fmt-vacio"><strong>Nada coincide</strong><span>Prueba con el número del formato o el nombre del asunto.</span></div>
                ) : null}
                {lista.length ? (
                  <div className="pn-fmt-docs">
                    {lista.map((f) => v === "emitidos"
                      ? <FilaEmitido key={f.id} fila={f} href={`/panel/formatos/${f.id}`} />
                      : <TarjetaBorrador key={f.id} fila={f} href={`/panel/formatos/${f.id}`} />)}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      <div className="as-vpie pn-fmt-pie">
        <span><kbd className="pn-kbd">/</kbd> buscar</span>
        <span><kbd className="pn-kbd">1</kbd> <kbd className="pn-kbd">2</kbd> <kbd className="pn-kbd">3</kbd> catálogo, borradores, emitidos</span>
        <span><kbd className="pn-kbd">Esc</kbd> cerrar</span>
      </div>

      <HojaAdaptable abierta={eligiendo !== null} titulo={eligiendo?.tipos ? "Tipo de levantamiento" : "¿Para qué asunto?"}
        descripcion={eligiendo ? `${eligiendo.numero} · ${eligiendo.titulo}` : undefined} alCerrar={() => setEligiendo(null)}>
        {eligiendo ? (
          cargando ? <Cargando lineas={3} etiqueta="Cargando asuntos" />
            : <Empezar key={eligiendo.id} entrada={eligiendo} asuntos={ordenarAsuntosPara(eligiendo.id, asuntos)} alEmpezar={empezar}
              asuntoInicial={asuntoPedido && asuntos.some((a) => a.id === asuntoPedido) ? asuntoPedido : undefined}
              tipoInicial={pedido?.entrada.id === eligiendo.id ? pedido.tipo : ""} />
        ) : null}
      </HojaAdaptable>
    </div>
  );
}

/**
 * Empezar, como el boceto: si el formato tiene tipos (levantamiento), primero la lista de tipos; luego «¿Para qué asunto?»
 * con una fila por asunto. Pulsar el asunto empieza el documento. El asunto de donde se llegó (o el primero de su operación) va «Sugerido».
 */
function Empezar({ entrada, asuntos, alEmpezar, asuntoInicial, tipoInicial = "" }: {
  entrada: EntradaCatalogo;
  asuntos: readonly { id: string; titulo: string; folio: string }[];
  alEmpezar: (formatoId: string, expedienteId: string) => Promise<boolean>;
  asuntoInicial?: string; tipoInicial?: string;
}) {
  const [tipo, setTipo] = useState<string>(tipoInicial);
  const [ocupado, setOcupado] = useState<string | null>(null);
  if (entrada.tipos && !tipo) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <p className="pn-sub" style={{ margin: 0 }}>Distinguimos siempre el tipo del inmueble y su uso.</p>
        <div className="pn-tarjeta" style={{ overflow: "hidden" }}>
          {entrada.tipos.map((t) => (
            <button key={t.valor} type="button" className="pn-fmt-opc" onClick={() => setTipo(t.valor)}><span>{t.etiqueta}</span><small>{t.valor}</small></button>
          ))}
        </div>
      </div>
    );
  }
  if (!asuntos.length) {
    return <Vacio titulo="Sin asuntos abiertos" texto="Los formatos se llenan dentro de un asunto. Abre uno desde Asuntos." icono="expediente" />;
  }
  const formatoId = entrada.tipos ? tipo : entrada.id;
  const sugerido = asuntoInicial ?? asuntos[0]?.id;
  const orden = asuntoInicial ? [...asuntos].sort((a, b) => Number(b.id === asuntoInicial) - Number(a.id === asuntoInicial)) : asuntos;
  const elegir = (id: string) => {
    if (ocupado || !formatoId) return;
    setOcupado(id);
    void alEmpezar(formatoId, id).then((ok) => { if (!ok) setOcupado(null); });
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {entrada.abogado ? <p className="pn-sub" style={{ margin: 0, color: "var(--warning)" }}>Falta revisión del abogado: revísalo antes de firmarlo.</p> : null}
      {entrada.tipos ? (
        <p className="pn-sub" style={{ margin: 0 }}>
          ¿Para qué asunto? · {entrada.tipos.find((t) => t.valor === tipo)?.etiqueta}{" "}
          <button type="button" className="pn-vinculo" style={{ margin: 0, minHeight: 0 }} onClick={() => setTipo("")}>Cambiar tipo</button>
        </p>
      ) : null}
      <div className="pn-tarjeta" style={{ overflow: "hidden" }}>
        {orden.map((a) => (
          <button key={a.id} type="button" className="pn-fmt-opc" aria-disabled={ocupado !== null || undefined} onClick={() => elegir(a.id)}>
            <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
              <span style={{ overflowWrap: "anywhere" }}>{a.titulo}</span>
              {a.folio ? <small>{a.folio}</small> : null}
            </span>
            {ocupado === a.id ? <small>Abriendo…</small> : a.id === sugerido ? <span className="pn-fmt-sugerido">Sugerido</span> : null}
          </button>
        ))}
      </div>
      <span className="pn-sub" style={{ margin: 0, fontSize: 13 }}>El folio y los datos del asunto se llenan solos.</span>
    </div>
  );
}

export default function Pagina() {
  return <Suspense><Formatos /></Suspense>;
}
