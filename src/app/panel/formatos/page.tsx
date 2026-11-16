"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { useColeccion } from "@/components/panel/datos/use-coleccion";
import { FilaEmitido } from "@/components/panel/formatos/emitido";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Boton } from "@/components/panel/kit/boton";
import { Campo } from "@/components/panel/kit/campo";
import { Desplegable } from "@/components/panel/kit/desplegable";
import { Cargando, EstadoError, Vacio } from "@/components/panel/kit/estados";
import { Fila, GrupoLista } from "@/components/panel/kit/lista";
import { HojaAdaptable } from "@/components/panel/ui/hoja-adaptable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/panel/ui/tabs";
import type { Property } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import { diaLargo, aTexto } from "@/lib/panel/calendario";
import { filasAsuntos, type Expediente } from "@/lib/panel/datos/asuntos";
import { leerExpedientes } from "@/lib/panel/datos/colecciones";
import {
  agruparCatalogo, buscarEnCatalogo, catalogo, filasDocumentos, NOMBRE_GRUPO_FORMATO, ordenarAsuntosPara,
  type DocumentoLista, type EntradaCatalogo,
} from "@/lib/panel/datos/formatos";
import { crearDocumento, leerDocumentos } from "@/lib/panel/datos/formatos-acciones";
import { entradaDeFormato, rutaAsunto, rutaCaptura } from "@/lib/panel/datos/formatos-navegacion";

/**
 * Formatos (PN-06, boceto del 15/11/2026): catálogo por lo que quieres hacer, Borradores y Emitidos.
 * Empezar uno pide el asunto (los de su operación primero) y abre su ventana de captura; el folio y los datos del asunto los pone el servidor.
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

  return (
    <div className="pn-pagina" style={{ maxWidth: 760 }}>
      <h1 className="pn-h1">Formatos</h1>
      <p className="pn-sub">{cargando ? "Cargando…" : `${borradores.length} ${borradores.length === 1 ? "borrador" : "borradores"} · ${emitidos.length} ${emitidos.length === 1 ? "emitido" : "emitidos"}`}</p>
      {asuntoPedido && !pedido && !cargando ? (
        <p className="pn-sub" style={{ marginTop: 8 }}>
          {nombreAsunto(asuntoPedido) ? `Para ${nombreAsunto(asuntoPedido)}: elige el formato.` : "Ese asunto ya no está abierto; elige el asunto al empezar."}
        </p>
      ) : null}
      <Tabs value={vista} onValueChange={(v) => setVista(v as Vista)} style={{ marginTop: 20 }}>
        <TabsList>
          <TabsTrigger value="catalogo">Catálogo</TabsTrigger>
          <TabsTrigger value="borradores">Borradores{borradores.length ? ` (${borradores.length})` : ""}</TabsTrigger>
          <TabsTrigger value="emitidos">Emitidos{emitidos.length ? ` (${emitidos.length})` : ""}</TabsTrigger>
        </TabsList>

        <TabsContent value="catalogo">
          <div style={{ marginTop: 16 }}>
            <Campo etiqueta="Buscar" placeholder="Número o nombre" value={buscar} onChange={(e) => setBuscar(e.target.value)} type="search" autoComplete="off" />
          </div>
          <div style={{ display: "grid", gap: 20, marginTop: 20 }}>
            {entradas.length === 0 ? <Vacio titulo="Nada coincide" texto="Prueba con el número del formato." icono="buscar" /> : null}
            {agruparCatalogo(entradas).map(({ grupo, entradas: es }) => (
              <GrupoLista key={grupo} titulo={NOMBRE_GRUPO_FORMATO[grupo]}>
                {es.map((e) => (
                  <Fila key={e.id} izquierda={<span className="pn-av" aria-hidden style={{ borderRadius: "var(--r-md)", fontWeight: 600, fontSize: 13 }}>{e.numero}</span>}
                    titulo={e.titulo} subtitulo={e.queEs} detalle={e.abogado ? "Falta revisión del abogado" : undefined} tonoDetalle="aviso"
                    alPulsar={() => setEligiendo(e)} />
                ))}
              </GrupoLista>
            ))}
          </div>
        </TabsContent>

        {(["borradores", "emitidos"] as const).map((v) => {
          const lista = v === "borradores" ? borradores : emitidos;
          return (
            <TabsContent key={v} value={v}>
              <div style={{ display: "grid", gap: 20, marginTop: 20 }}>
                {cargando ? <Cargando lineas={4} etiqueta="Cargando documentos" /> : null}
                {error ? <EstadoError texto={error} alReintentar={() => { setError(null); setIntento((n) => n + 1); }} /> : null}
                {!cargando && !error && lista.length === 0 ? (
                  <Vacio icono="escritura"
                    titulo={v === "borradores" ? "Sin borradores" : "Sin emitidos"}
                    texto={v === "borradores" ? "Lo que empiezas queda aquí con su avance hasta generar el PDF." : "Cada PDF que generas aparece aquí, con su copia firmada cuando la subas."}
                    accion={<Boton variante="secundario" onClick={() => setVista("catalogo")}>Ver el catálogo</Boton>} />
                ) : null}
                {lista.length ? (
                  <GrupoLista>
                    {lista.map((f) => v === "emitidos" ? <FilaEmitido key={f.id} fila={f} href={`/panel/formatos/${f.id}`} /> : (
                      <Fila key={f.id} titulo={f.titulo} subtitulo={f.linea || undefined} lado={diaLargo(aTexto(new Date(f.actualizadoEl)))}
                        href={`/panel/formatos/${f.id}`} />
                    ))}
                  </GrupoLista>
                ) : null}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>

      <HojaAdaptable abierta={eligiendo !== null} titulo={eligiendo ? `${eligiendo.numero} · ${eligiendo.titulo}` : "Empezar"}
        descripcion="Elige el asunto. El folio y sus datos se llenan solos." alCerrar={() => setEligiendo(null)}>
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

function Empezar({ entrada, asuntos, alEmpezar, asuntoInicial, tipoInicial = "" }: {
  entrada: EntradaCatalogo;
  asuntos: readonly { id: string; titulo: string; folio: string }[];
  alEmpezar: (formatoId: string, expedienteId: string) => Promise<boolean>;
  asuntoInicial?: string; tipoInicial?: string;
}) {
  const [asunto, setAsunto] = useState<string>(asuntoInicial ?? asuntos[0]?.id ?? "");
  const [tipo, setTipo] = useState<string>(tipoInicial);
  const [ocupado, setOcupado] = useState(false);
  const formatoId = entrada.tipos ? tipo : entrada.id;
  if (!asuntos.length) {
    return <Vacio titulo="Sin asuntos abiertos" texto="Los formatos se llenan dentro de un asunto. Abre uno desde Asuntos." icono="expediente" />;
  }
  return (
    <div style={{ display: "grid", gap: 16 }}>
      {entrada.abogado ? <p className="pn-sub" style={{ margin: 0, color: "var(--warning)" }}>Falta revisión del abogado: revísalo antes de firmarlo.</p> : null}
      {entrada.tipos ? <Desplegable etiqueta="Tipo de inmueble" valor={tipo} vacio="Elige el tipo" opciones={entrada.tipos} alElegir={setTipo} /> : null}
      <Desplegable etiqueta="Asunto" valor={asunto} opciones={asuntos.map((a) => ({ valor: a.id, etiqueta: [a.folio, a.titulo].filter(Boolean).join(" · ") }))} alElegir={setAsunto} />
      <Boton bloque deshabilitado={ocupado || !asunto || !formatoId}
        onClick={() => { setOcupado(true); void alEmpezar(formatoId, asunto).then((ok) => { if (!ok) setOcupado(false); }); }}>
        {ocupado ? "Abriendo…" : "Empezar"}
      </Boton>
    </div>
  );
}

export default function Pagina() {
  return <Suspense><Formatos /></Suspense>;
}
