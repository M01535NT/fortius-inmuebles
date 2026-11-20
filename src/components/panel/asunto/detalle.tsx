"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Icono } from "@/components/panel/icons";
import { useAvisos } from "@/components/panel/kit/avisos";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/panel/ui/dropdown-menu";
import {
  agregar, APARTADO, APARTADOS_DE_SIEMPRE, cambiar, cambiarAsunto, CLAVES_APARTADO, continuarAsunto, fechaCorta, diasHasta,
  iconoEncargo, leerAsunto, leerHistorial, leerNotas, mandarAEliminados, sumarDias,
  type Apartado, type Asunto, type CambioAsunto, type ClaveApartado, type EnQueVa, type EntradaHistorial, type FilaAsunto, type PersonaDelAsunto, type Vista,
} from "@/lib/panel/asuntos/api";
import { usePreferencia } from "@/components/panel/almacen";
import { useCatalogos } from "@/components/panel/datos/catalogos";
import { guardarApartadoEnBiblioteca } from "@/lib/panel/biblioteca";
import { BotonFavorito } from "@/components/panel/kit/favorito";
import { Boton } from "@/components/panel/kit/boton";
import { Etiqueta } from "@/components/panel/kit/etiqueta";
import { useSession } from "@/lib/panel/legado/sesion";

import { Cuadro, Pildora } from "./pildora";
import { useAsuntos } from "./proveedor";
import { anotarReciente, quitarReciente } from "./recientes";
import { DialogoTexto, useAngosto, Ventana } from "./ventana";
import { DialogoCierre } from "./cierre";
import { ContenidoApartado, iconoPropio, nombreApartado, resumenApartado } from "./apartados";
import { NotasDelAsunto, type FiltroNotas } from "./notas";
import { dinero } from "./comun";
import type { Comision } from "@/lib/backend/comision";
import { faltaCobrar } from "./honorarios";
import { hechoDe } from "./situacion";
import { NOMBRE_DE_QUIEN, NOMBRE_QUIERE } from "@/lib/backend/consultas-contrato";
import { olvidarGuias } from "../biblioteca/guias";

const NOMBRE_VISTA: Record<Vista, string> = { lista: "Lista", tabla: "Tabla", galeria: "Galería", texto: "Texto" };

/** Lo que el panel propone y nunca hace solo (SPEC.md): pasar a En marcha, cerrar o pasar a Propuesta. */
type Propuesta = { clave: string; texto: string; si: string };
function propuestaDe(a: Asunto): Propuesta | null {
  if (a.en_que_va === "cerrado" || a.en_espera) return null;
  const firmado = a.documentos.some((d) => d.es_contrato && d.paso === "firmado");
  if (firmado && (a.en_que_va === "estudio" || a.en_que_va === "propuesta")) return { clave: "en_marcha", texto: "El contrato ya está firmado. ¿Pasar a En marcha?", si: "Pasar" };
  const { total, falta } = faltaCobrar(a);
  if (Object.keys(total).length && !Object.keys(falta).length && a.cobros.length) return { clave: "cerrar", texto: "Ya se cobró todo. ¿Cerrar el asunto?", si: "Cerrar" };
  if (a.en_que_va === "estudio" && a.opinion?.resultado && a.opinion.resultado !== "no_factible") return { clave: "propuesta", texto: "Ya está la opinión jurídica. ¿Pasar a Propuesta?", si: "Pasar" };
  return null;
}
const llave = (id: string, clave: string) => `fortius-propuesta-${id}-${clave}`;
function yaDijoQueNo(id: string, clave: string) { try { return localStorage.getItem(llave(id, clave)) === "1"; } catch { return false; } }
function decirQueNo(id: string, clave: string) { try { localStorage.setItem(llave(id, clave), "1"); } catch { /* sin almacenamiento: vuelve a proponerse */ } }

const fila = (a: Asunto): FilaAsunto => ({
  id: a.id, folio: a.folio, nombre: a.nombre, encargos: a.encargos, en_que_va: a.en_que_va, en_espera: a.en_espera, espera_hasta: a.espera_hasta,
  resultado: a.resultado, responsable_id: a.responsable_id, es_ejemplo: a.es_ejemplo, version: a.version, updated_at: a.updated_at,
  siguiente: a.siguiente, busqueda: a.busqueda,
});

const POSPONER = [["Mañana", 1], ["En 3 días", 3], ["En una semana", 7], ["En un mes", 30]] as const;

/**
 * Lo que va en la línea bajo el nombre después del encargo (modelo visual: «Venta · En sucesión · Lo lleva…»): qué quiere
 * y de quién es, tal como se anotó en Situación o en la consulta. Cómo llegó (llamada, sitio…) no viaja con el asunto.
 */
function datosDeLaLinea(a: Asunto): string[] {
  const quiere = hechoDe(a, "que_quiere"), deQuien = hechoDe(a, "de_quien");
  return [
    typeof quiere === "string" ? NOMBRE_QUIERE[quiere as keyof typeof NOMBRE_QUIERE] : undefined,
    typeof deQuien === "string" && deQuien !== "suyo" && deQuien !== "no_sabe" ? NOMBRE_DE_QUIEN[deQuien as keyof typeof NOMBRE_DE_QUIEN] : undefined,
  ].filter((t): t is string => Boolean(t));
}

/** Si la lista de asuntos se ve junto al asunto abierto («si» o «no»). La lee también el marco de Asuntos. */
export const LISTA_JUNTO = "fortius-panel-lista-junto";

/** El asunto abierto (boceto): folio, en qué va, Nuevo, ⋯, nombre, encargos, quién lo lleva, lo que sigue y los apartados. */
export function DetalleAsunto({ id }: { id: string }) {
  const { ponerFila, recargar, equipo, companeros, nombreDe } = useAsuntos();
  const director = useSession()?.role === "admin";
  const { avisar } = useAvisos();
  const router = useRouter();
  const ruta = usePathname();
  const params = useSearchParams();
  const ver = params.get("ver");
  const [asunto, setAsunto] = useState<Asunto | null>(null);
  const [historial, setHistorial] = useState<EntradaHistorial[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // «cierre:<resultado>»: el diálogo de cerrar con ese resultado del catálogo.
  const [dialogo, setDialogo] = useState<null | "nombre" | "espera" | "propio" | `cierre:${string}`>(null);
  const cat = useCatalogos();
  // Desde el buscador, una persona llega con ?ver=personas&persona=<id> y abre su ficha.
  const [foco, setFoco] = useState<string | null>(() => (ver === "personas" && params.get("persona") ? `persona:${params.get("persona")}` : null));
  const [siguienteNuevo, setSiguienteNuevo] = useState("");
  const [noAhora, setNoAhora] = useState<string[]>([]);
  // Las ventanas por las que se pasó antes de la que está abierta (la más reciente al final).
  const [anteriores, setAnteriores] = useState<string[]>([]);

  // Las notas del asunto, en el costado de cada ventana (SPEC.md, «Las notas del asunto»).
  const [notas, setNotas] = useState<EntradaHistorial[] | null>(null);
  const [fijadas, setFijadas] = useState<number[]>([]);
  const [personaAbierta, setPersonaAbierta] = useState<PersonaDelAsunto | null>(null);
  const [filtroNotas, setFiltroNotas] = useState<FiltroNotas>("todas");
  const [notasEnPc, guardarNotasEnPc] = usePreferencia("fortius-panel-notas", "no"); // Empiezan cerradas, con su contador en el botón (hallazgo 32).
  const [notasEnTel, setNotasEnTel] = useState(false);
  // La lista de asuntos se ve junto al asunto abierto (boceto aprobado); un botón la oculta y el panel lo recuerda.
  const [listaVisible, ponerLista] = usePreferencia(LISTA_JUNTO, "si");
  const angosto = useAngosto();
  const notasAbiertas = angosto ? notasEnTel : notasEnPc === "si";
  const ponerNotas = useCallback((abiertas: boolean) => { if (angosto) setNotasEnTel(abiertas); else guardarNotasEnPc(abiertas ? "si" : "no"); }, [angosto, guardarNotasEnPc]);

  const cargar = useCallback(async () => {
    try {
      const [a, h, n] = await Promise.all([leerAsunto(id), leerHistorial(id), leerNotas(id)]);
      setAsunto(a); setHistorial(h); setNotas(n.entradas); setFijadas(n.fijadas); setError(null); ponerFila(fila(a));
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo cargar."); }
  }, [id, ponerFila]);

  useEffect(() => {
    let vivo = true;
    Promise.all([leerAsunto(id), leerHistorial(id), leerNotas(id)]).then(([a, h, n]) => { if (vivo) { setAsunto(a); setHistorial(h); setNotas(n.entradas); setFijadas(n.fijadas); setError(null); } },
      (e: unknown) => { if (vivo) setError(e instanceof Error ? e.message : "No se pudo cargar."); });
    return () => { vivo = false; };
  }, [id]);

  // «Recientes» del menú: el último abierto va primero.
  const nombreReciente = asunto?.nombre, encargoReciente = asunto?.encargos[0];
  useEffect(() => {
    if (!nombreReciente) return;
    const [icono, color] = iconoEncargo(encargoReciente);
    anotarReciente({ id, nombre: nombreReciente, icono, color });
  }, [id, nombreReciente, encargoReciente]);

  /**
   * Abre la ventana de un apartado (o la cierra con null). Si ya había otra abierta, se recuerda para que la flecha ←
   * regrese a ella; `regreso` es justo ese paso atrás.
   */
  const abrir = useCallback((clave: string | null, conFoco?: string, regreso = false) => {
    const p = new URLSearchParams(params.toString());
    if (clave) p.set("ver", clave); else p.delete("ver");
    setFoco(conFoco ?? null);
    setAnteriores((pila) => (clave === null ? [] : regreso ? pila.slice(0, -1) : ver && ver !== clave ? [...pila, ver].slice(-12) : pila));
    router.replace(`${ruta}${p.size ? `?${p}` : ""}`, { scroll: false });
  }, [params, router, ruta, ver]);

  /** Corre un cambio y vuelve a leer el asunto. Si falla, avisa con el mensaje del servidor. */
  const hacer = useCallback(async (accion: () => Promise<unknown>, aviso?: string, deshacer?: () => Promise<unknown>) => {
    try {
      await accion();
      await cargar();
      if (aviso) avisar(aviso, deshacer ? { etiqueta: "Deshacer", alAccionar: () => void deshacer().then(cargar, (e: unknown) => avisar(e instanceof Error ? e.message : "No se pudo deshacer.")) } : undefined);
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se pudo terminar.");
      await cargar();
    }
  }, [avisar, cargar]);

  /** Abre otro apartado; si no estaba en el asunto, lo agrega primero. */
  const irA = useCallback((clave: string, conFoco?: string) => {
    const ya = asunto?.apartados.find((x) => x.clave === clave && x.visible);
    if (ya || !asunto) { abrir(clave, conFoco); return; }
    void hacer(async () => {
      const oculto = asunto.apartados.find((x) => x.clave === clave);
      if (oculto) await cambiar(asunto.id, "apartados", { id: oculto.id, version: oculto.version, visible: true });
      else await agregar(asunto.id, "apartados", { clave });
    }).then(() => abrir(clave, conFoco));
  }, [asunto, abrir, hacer]);

  if (error && !asunto) {
    return (
      <div className="as-in"><div className="as-vacio-lista" role="alert"><p>{error}</p>
        {/no te toca/.test(error)
          ? <button type="button" className="as-btn" onClick={() => router.push("/panel/asuntos")}>Ir a tus asuntos</button>
          : <button type="button" className="as-btn" onClick={() => void cargar()}>Reintentar</button>}</div></div>
    );
  }
  if (!asunto) return <div className="as-in"><div className="as-cargando" aria-busy="true" aria-label="Cargando el asunto">{[0, 1, 2].map((i) => <span key={i} />)}</div></div>;

  const a = asunto;
  const cambio = (c: CambioAsunto, aviso: string, antes?: CambioAsunto) =>
    hacer(() => cambiarAsunto(a, c), aviso, antes ? async () => { const actual = await leerAsunto(a.id); await cambiarAsunto(actual, antes); } : undefined);
  const s = a.siguiente;
  const tareaSig = s ? a.tareas.find((t) => t.id === s.tarea_id) : undefined;
  const visibles = a.apartados.filter((x) => x.visible).sort((x, y) => x.orden - y.orden);
  const faltan = CLAVES_APARTADO.filter((c) => !visibles.some((x) => x.clave === c));
  const apartadoDe = (clave: string | undefined) => (clave ? a.apartados.find((x) => x.clave === clave || x.id === clave) : undefined);
  const abierto: Apartado | undefined = apartadoDe(ver ?? undefined);
  const anterior = apartadoDe(anteriores[anteriores.length - 1]);
  const cerrado = a.en_que_va === "cerrado";
  const enQueVa = (v: string) => cat.etiqueta("en_que_va", v).toLowerCase();
  const encargo = (e: string) => cat.etiqueta("encargo", e);
  const resultado = (r: string) => cat.etiqueta("resultado_cierre", r);
  const logrado = (r: string | null) => cat.significado("resultado_cierre", r) !== "no_logrado";
  // Lo que se ofrece en el menú más lo que el asunto ya tiene (desactivar no lo quita del asunto).
  const encargos = cat.opciones("encargo", a.encargos).map((o) => o.valor);
  const cierreElegido = dialogo?.startsWith("cierre:") ? dialogo.slice(7) : null;
  const primerLogrado = cat.ofrecidos("resultado_cierre").find((r) => r.significado === "logrado")?.clave ?? "se_logro";
  const propuesta = (() => { const p = propuestaDe(a); return p && !noAhora.includes(p.clave) && !yaDijoQueNo(a.id, p.clave) ? p : null; })();
  const continuar = () => void (async () => {
    try {
      const n = await continuarAsunto(a.id);
      await recargar();
      avisar(`Asunto nuevo ${n.folio}: con las mismas personas, inmuebles y documentos`);
      router.push(`/panel/asuntos/${n.id}`);
    } catch (e) { avisar(e instanceof Error ? e.message : "No se pudo terminar."); }
  })();

  // En computadora, la cabecera del caso (nombre, sus datos en una línea y «Lo que sigue» con Hecha y Posponer) y los
  // apartados como renglones limpios; en el teléfono, su versión compacta. En los dos, cada apartado abre su ventana.
  const enPagina = !angosto;
  const claveDe = (x: Apartado) => (x.clave === "propio" ? x.id : x.clave);
  const cuadroDe = (x: Apartado) => {
    const fijo = x.clave !== "propio" ? APARTADO[x.clave] : null;
    return { icono: fijo?.icono ?? iconoPropio(x), color: fijo?.color ?? "gray" };
  };
  const opcionesDe = (x: Apartado | undefined) => (x && !APARTADOS_DE_SIEMPRE.includes(x.clave as ClaveApartado) ? [
    ...(x.clave === "propio" ? (["lista", "tabla", "galeria", "texto"] as const).filter((v) => v !== (x.vista ?? "lista")).map((v) => ({
      etiqueta: `Ver como ${NOMBRE_VISTA[v].toLowerCase()}`, icono: "ojo" as const, peligro: false,
      alElegir: () => void hacer(() => cambiar(a.id, "apartados", { id: x.id, version: x.version, vista: v }), `Ahora se ve como ${NOMBRE_VISTA[v].toLowerCase()}`),
    })) : []),
    ...(x.clave === "propio" ? [{
      etiqueta: "Guardar en la Biblioteca", icono: "lib" as const, peligro: false,
      alElegir: () => void guardarApartadoEnBiblioteca(a.id, x.id).then(() => { olvidarGuias(); avisar("Guardado en la Biblioteca"); }, (e: unknown) => avisar(e instanceof Error ? e.message : "No se guardó.")),
    }] : []),
    {
      etiqueta: "Quitar del asunto", icono: "bote" as const, peligro: true,
      alElegir: () => {
        abrir(null);
        void hacer(() => cambiar(a.id, "apartados", { id: x.id, version: x.version, visible: false }), "Apartado quitado. Lo que tenía se conserva",
          () => leerAsunto(a.id).then((y) => { const z = y.apartados.find((w) => w.id === x.id); return z ? cambiar(a.id, "apartados", { id: z.id, version: z.version, visible: true }) : undefined; }));
      },
    },
  ] : []);
  const notasDe = (x: Apartado) => (
    <NotasDelAsunto a={a} notas={notas} fijadas={fijadas} desde={x} nombreDeApartado={nombreApartado}
      persona={x.clave === "personas" ? personaAbierta : null} filtro={filtroNotas} alFiltrar={setFiltroNotas} hacer={hacer}
      abrirPersona={(pid) => { if (angosto) setNotasEnTel(false); irA("personas", `persona:${pid}`); }}
      abrirApartado={(y) => { if (angosto) setNotasEnTel(false); if (y.clave === "propio") abrir(y.id); else irA(y.clave); }}
      alCerrar={() => ponerNotas(false)} />
  );
  const agregarApartado = (
    <DropdownMenu>
      <DropdownMenuTrigger className={enPagina ? "cp-ap cp-ap-mas" : "as-ren as-sola"}><Icono nombre="mas" tamano={16} />Agregar apartado</DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-60">
        {faltan.map((c: ClaveApartado) => (
          <DropdownMenuItem key={c} onSelect={() => void hacer(() => agregar(a.id, "apartados", { clave: c }), `Se agregó ${APARTADO[c].nombre}`)}>
            <Icono nombre={APARTADO[c].icono} tamano={16} />{APARTADO[c].nombre}
          </DropdownMenuItem>
        ))}
        {faltan.length ? <DropdownMenuSeparator /> : null}
        <DropdownMenuItem onSelect={() => setDialogo("propio")}><Icono nombre="mas" tamano={16} />Apartado propio…</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className={enPagina ? "cp" : "as-in"}>
      <div className={enPagina ? "cp-barra" : "as-top"}>
        {enPagina ? (
          <Boton variante="fantasma" soloIcono icono="lista" aria-label={listaVisible === "si" ? "Ocultar la lista de asuntos" : "Mostrar la lista de asuntos"}
            aria-pressed={listaVisible === "si"} onClick={() => ponerLista(listaVisible === "si" ? "no" : "si")} />
        ) : null}
        <Link href="/panel/asuntos" className={enPagina ? "cp-miga" : "as-btn as-gho as-atras"}>{enPagina ? null : <Icono nombre="at" tamano={16} />}Asuntos</Link>
        {enPagina ? <span className="cp-miga-sep" aria-hidden>/</span> : null}
        <span className="as-m as-num">{a.folio}</span>
        {a.es_ejemplo ? <Etiqueta>Ejemplo</Etiqueta> : null}
        <span className="as-sp" />
        <Pildora etiqueta="En qué va" valor={a.en_que_va} antes={<span className="as-punto" />}
          opciones={cat.opciones("en_que_va", a.en_que_va).map((o) => ({ valor: o.valor as EnQueVa, etiqueta: o.etiqueta }))}
          alElegir={(v) => { if (v !== a.en_que_va) void cambio({ en_que_va: v }, `Pasó a ${enQueVa(v)}`, { en_que_va: a.en_que_va }); }} />
        <DropdownMenu>
          <DropdownMenuTrigger className={enPagina ? "pn-btn" : "as-btn as-pri"}><Icono nombre="mas" tamano={16} /><span className="as-ocultar-tel">Nuevo</span><Icono nombre="down" tamano={14} /></DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => abrir("plan", "nueva-tarea")}><Icono nombre="lista" tamano={16} />Tarea</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => abrir("historial", "nueva-nota")}><Icono nombre="nota" tamano={16} />Nota o decisión</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => abrir("personas", "nueva-persona")}><Icono nombre="users" tamano={16} />Persona</DropdownMenuItem>
            {a.encargos.includes("comercializar") || a.apartados.some((x) => x.clave === "interesados" && x.visible) ? (
              <DropdownMenuItem onSelect={() => irA("interesados", "nuevo-interesado")}><Icono nombre="estrella" tamano={16} />Interesado</DropdownMenuItem>
            ) : null}
            <DropdownMenuItem onSelect={() => irA("honorarios")}><Icono nombre="pago" tamano={16} />Cobro</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => router.push(`/panel/herramientas/formatos?asunto=${a.id}`)}><Icono nombre="contrato" tamano={16} />Contrato o formato</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => router.push(`/panel/herramientas/valor?asunto=${a.id}`)}><Icono nombre="calc" tamano={16} />Herramienta</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => router.push(`/panel/informe/${a.id}`)}><Icono nombre="file" tamano={16} />Informe para el cliente</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <BotonFavorito tipo="asunto" id={a.id} nombre={a.nombre} className={enPagina ? "pn-btn pn-btn-fantasma pn-btn-icono" : "as-btn as-ico"} />
        <DropdownMenu>
          <DropdownMenuTrigger className={enPagina ? "pn-btn pn-btn-fantasma pn-btn-icono" : "as-btn as-ico"} aria-label="Más opciones"><Icono nombre="dots" tamano={18} /></DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-60">
            <DropdownMenuItem onSelect={() => setDialogo("nombre")}><Icono nombre="lapiz" tamano={16} />Cambiar el nombre</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => { void navigator.clipboard?.writeText(location.href.split("?")[0]).then(() => avisar("Enlace copiado"), () => avisar("No se pudo copiar")); }}>
              <Icono nombre="copia" tamano={16} />Copiar enlace
            </DropdownMenuItem>
            {a.en_espera
              ? <DropdownMenuItem onSelect={() => void cambio({ en_espera: false }, "Se reanudó", { en_espera: true, espera_motivo: a.espera_motivo, espera_hasta: a.espera_hasta })}><Icono nombre="reloj" tamano={16} />Reanudar</DropdownMenuItem>
              : <DropdownMenuItem onSelect={() => setDialogo("espera")}><Icono nombre="reloj" tamano={16} />Poner en espera</DropdownMenuItem>}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Qué encargaron</DropdownMenuLabel>
            {encargos.map((e) => {
              const tiene = a.encargos.includes(e);
              return (
                <DropdownMenuItem key={e} onSelect={(ev) => {
                  ev.preventDefault();
                  const nuevos = tiene ? a.encargos.filter((x) => x !== e) : [...a.encargos, e];
                  // Fallo 9: quitar o agregar un encargo se deshace desde el aviso.
                  void cambio({ encargos: nuevos }, tiene ? `Se quitó ${encargo(e)}` : `Se agregó ${encargo(e)}`, { encargos: a.encargos });
                }}>
                  <Icono nombre={iconoEncargo(e)[0]} tamano={16} />{encargo(e)}
                  {tiene ? <span className="ml-auto"><Icono nombre="ok" tamano={15} /></span> : null}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            {cerrado ? (
              <DropdownMenuItem onSelect={() => void cambio({ en_que_va: "en_marcha" }, "Se reabrió", { en_que_va: "cerrado", resultado: a.resultado, motivo_cierre: a.motivo_cierre })}>
                <Icono nombre="liga" tamano={16} />Reabrir
              </DropdownMenuItem>
            ) : (
              <>
                {cat.opciones("resultado_cierre").map((r) => (
                  <DropdownMenuItem key={r.valor} onSelect={() => setDialogo(`cierre:${r.valor}`)}>
                    <Icono nombre={logrado(r.valor) ? "ok" : "x"} tamano={16} />Cerrar: {r.etiqueta.toLowerCase()}
                  </DropdownMenuItem>
                ))}
              </>
            )}
            <DropdownMenuItem onSelect={continuar}><Icono nombre="ch" tamano={16} />Continuar en un asunto nuevo</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem peligro onSelect={() => void (async () => {
              try {
                await mandarAEliminados(a);
                quitarReciente(a.id);
                await recargar();
                router.push("/panel/asuntos");
                avisar("Se mandó a Eliminados", director ? {
                  etiqueta: "Deshacer",
                  alAccionar: () => void mandarAEliminados({ id: a.id, version: a.version + 1 }, true).then(() => recargar(), (e: unknown) => avisar(e instanceof Error ? e.message : "No se pudo deshacer.")),
                } : undefined);
              } catch (e) { avisar(e instanceof Error ? e.message : "No se pudo terminar."); }
            })()}>
              <Icono nombre="bote" tamano={16} />Mandar a Eliminados
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className={enPagina ? "cp-cab" : "as-titulo"}>
        <h1 className={enPagina ? "cp-h1" : "as-h1"}>{a.nombre}</h1>
        {/* Modelo visual: una línea gris con qué encargaron, qué quiere, de quién es y quién lo lleva, separada por puntos. */}
        <div className={enPagina ? "cp-meta" : "as-fila as-pills"}>
          {a.encargos.map((e) => <span key={e} className="as-pill">{enPagina ? null : <Icono nombre={iconoEncargo(e)[0]} tamano={12} />}{encargo(e)}</span>)}
          {enPagina ? datosDeLaLinea(a).map((t) => <span key={t} className="as-pill">{t}</span>) : null}
          {cerrado && a.resultado ? <span className={`as-pill ${logrado(a.resultado) ? "as-pill-ok" : "as-pill-bad"}`}>{resultado(a.resultado)}</span> : null}
          {a.en_espera ? <span className="as-pill as-pill-warn">{enPagina ? null : <Icono nombre="reloj" tamano={12} />}En espera{a.espera_hasta ? ` hasta ${fechaCorta(a.espera_hasta).toLowerCase()}` : ""}</span> : null}
          {director && equipo.length > 1 ? (
            <Pildora etiqueta="Quién lo lleva" icono={enPagina ? undefined : "users"} valor={a.responsable_id} titulo={enPagina ? `Lo lleva ${nombreDe(a.responsable_id)}` : undefined}
              opciones={equipo.map((m) => ({ valor: m.id, etiqueta: m.nombre }))}
              alElegir={(v) => { if (v !== a.responsable_id) void cambio({ responsable_id: v }, `Ahora lo lleva ${nombreDe(v)}`, { responsable_id: a.responsable_id }); }} />
          ) : <span className="as-pill">{enPagina ? `Lo lleva ${nombreDe(a.responsable_id)}` : <><Icono nombre="users" tamano={12} />{nombreDe(a.responsable_id)}</>}</span>}
        </div>
        {a.en_espera && a.espera_motivo ? <p className="as-m">{a.espera_motivo}</p> : null}
        {cerrado && a.motivo_cierre ? <p className="as-m">{a.motivo_cierre}</p> : null}
        {cerrado && (a.capto_id || a.vendio_id) ? (
          <p className="as-m">{[a.capto_id ? `Captó ${nombreDe(a.capto_id)}` : "", a.vendio_id ? `Vendió ${nombreDe(a.vendio_id)}` : ""].filter(Boolean).join(" · ")}</p>
        ) : null}
        {/* Solo al director le llega `comision`: la estimación del reparto, calculada al vuelo. */}
        {a.comision ? <LineaComision c={a.comision} nombreDe={nombreDe} /> : null}
      </div>

      {cerrado ? (
        <div className="as-ban" role="status">
          <Icono nombre={logrado(a.resultado) ? "ok" : "x"} tamano={16} />
          <span>Cerrado{a.resultado ? `: ${resultado(a.resultado).toLowerCase()}` : ""}{a.cerrado_el ? ` · ${fechaCorta(a.cerrado_el.slice(0, 10)).toLowerCase()}` : ""}</span>
          <span className="as-sp" />
          <button type="button" className="as-btn" onClick={continuar}>Continuar<Icono nombre="ch" tamano={16} /></button>
          <button type="button" className="as-btn" onClick={() => void cambio({ en_que_va: "en_marcha" }, "Se reabrió", { en_que_va: "cerrado", resultado: a.resultado, motivo_cierre: a.motivo_cierre })}>Reabrir</button>
        </div>
      ) : a.en_espera ? (
        <div className="as-ban as-ban-esp" role="status">
          <Icono nombre="reloj" tamano={16} />
          <span>En espera{a.espera_hasta ? ` hasta ${fechaCorta(a.espera_hasta).toLowerCase()}` : ""}</span>
          <span className="as-sp" />
          <button type="button" className="as-btn" onClick={() => void cambio({ en_espera: false }, "Se reanudó", { en_espera: true, espera_motivo: a.espera_motivo, espera_hasta: a.espera_hasta })}>Reanudar</button>
        </div>
      ) : propuesta ? (
        <div className="as-ban as-ban-prop" role="status">
          <Icono nombre="rayo" tamano={16} />
          <span>{propuesta.texto}</span>
          <span className="as-sp" />
          <button type="button" className="as-btn as-gho" onClick={() => { decirQueNo(a.id, propuesta.clave); setNoAhora([...noAhora, propuesta.clave]); }}>Ahora no</button>
          <button type="button" className="as-btn as-pri" onClick={() => {
            if (propuesta.clave === "cerrar") { setDialogo(`cierre:${primerLogrado}`); return; }
            const v = propuesta.clave === "en_marcha" ? "en_marcha" : "propuesta";
            void cambio({ en_que_va: v }, `Pasó a ${enQueVa(v)}`, { en_que_va: a.en_que_va });
          }}>{propuesta.si}</button>
        </div>
      ) : null}

      {/* Fallo 4: un asunto cerrado enseña el resultado del cierre (arriba), no lo que seguía. */}
      {!cerrado && s && tareaSig ? (
        <div className="cp-sigue">
          <span className="cp-sigue-e"><Icono nombre="rayo" tamano={14} aria-hidden />Lo que sigue</span>
          <div className="as-sigue-c">
            <p className="as-q">{s.titulo}</p>
            <p className="as-m">{cat.etiqueta("quien_tarea", s.quien)} · <span className={s.fecha && diasHasta(s.fecha) < 0 ? "as-bad" : ""}>{fechaCorta(s.fecha, s.hora)}</span></p>
          </div>
          <Boton variante="primario" icono="ok" aria-label={`Marcar hecha: ${s.titulo}`} onClick={() => void hacer(() => cambiar(a.id, "tareas", { id: tareaSig.id, version: tareaSig.version, estado: "hecha" }), "Tarea hecha",
              () => leerAsunto(a.id).then((x) => { const t = x.tareas.find((y) => y.id === tareaSig.id); return t ? cambiar(a.id, "tareas", { id: t.id, version: t.version, estado: "pendiente" }) : undefined; }))}>Hecha</Boton>
          <DropdownMenu>
            <DropdownMenuTrigger className="pn-btn pn-btn-fantasma" title="Posponer" aria-label="Posponer">
              <Icono nombre="reloj" tamano={16} /><span>Posponer</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Posponer</DropdownMenuLabel>
              {POSPONER.map(([t, n]) => (
                <DropdownMenuItem key={t} onSelect={() => void hacer(() => cambiar(a.id, "tareas", { id: tareaSig.id, version: tareaSig.version, fecha: sumarDias(n) }), `Pasó a ${fechaCorta(sumarDias(n)).toLowerCase()}`)}>
                  <Icono nombre="cal" tamano={16} />{t}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : cerrado ? null : (
        <form className="cp-sigue cp-sigue-falta" onSubmit={(e) => {
          e.preventDefault();
          const t = siguienteNuevo.trim();
          if (!t) return;
          setSiguienteNuevo("");
          void hacer(() => agregar(a.id, "tareas", { titulo: t, fecha: sumarDias(0) }), "Anotado lo que sigue");
        }}>
          <span className="as-warn"><Icono nombre="alerta" tamano={18} /></span>
          <input className="as-inp" value={siguienteNuevo} onChange={(e) => setSiguienteNuevo(e.target.value)} placeholder="Sin siguiente paso. ¿Qué sigue?" aria-label="¿Qué sigue?" />
          {siguienteNuevo.trim() ? <button type="submit" className="as-btn as-pri">Guardar</button> : null}
        </form>
      )}

      {/* Los apartados, como renglones con su resumen; cada uno se abre en su ventana (SPEC.md, secciones 5 y 14). */}
      <nav className={enPagina ? "cp-aps" : "as-card"} aria-label="Apartados">
        {visibles.map((x) => {
          const { icono, color } = cuadroDe(x);
          return (
            <button key={x.id} type="button" className={enPagina ? "cp-ap" : "as-ren"} onClick={() => abrir(claveDe(x))}
              aria-current={abierto?.id === x.id ? "true" : undefined}>
              <Cuadro icono={icono} color={color} />
              <span className={enPagina ? "cp-ap-c" : "as-ren-c"}><b>{nombreApartado(x)}</b><span>{resumenApartado(x, a, historial, cat)}</span></span>
              <Icono nombre="ch" tamano={16} aria-hidden />
            </button>
          );
        })}
        {enPagina ? agregarApartado : null}
      </nav>
      {enPagina ? null : agregarApartado}

      <>
          <Ventana
            abierta={Boolean(abierto)}
            alCerrar={() => abrir(null)}
            alRegresar={anterior ? () => abrir(claveDe(anterior), undefined, true) : undefined}
            anterior={anterior ? nombreApartado(anterior) : undefined}
            titulo={abierto ? nombreApartado(abierto) : ""}
            subtitulo={a.nombre}
            icono={abierto ? cuadroDe(abierto).icono : "lista"}
            color={abierto ? cuadroDe(abierto).color : "gray"}
            opciones={opcionesDe(abierto)}
            // En el Historial las notas ya están en la ventana: sin costado.
            notas={abierto?.clave === "historial" ? undefined : {
              abiertas: notasAbiertas, cuantas: (notas ?? []).length, alCambiar: ponerNotas,
              contenido: abierto ? notasDe(abierto) : null,
            }}
          >
            {abierto ? (
              <ContenidoApartado apartado={abierto} asunto={a} historial={historial} notas={notas} foco={foco} hacer={hacer} irA={irA}
                alAbrirPersona={setPersonaAbierta} alVerNotas={() => { setFiltroNotas("persona"); ponerNotas(true); }} />
            ) : null}
          </Ventana>
      </>

      <DialogoTexto abierto={dialogo === "nombre"} titulo="Cambiar el nombre" etiqueta="Nombre del asunto" inicial={a.nombre} maximo={160}
        alCerrar={() => setDialogo(null)} alGuardar={(t) => cambio({ nombre: t }, "Nombre cambiado", { nombre: a.nombre })} />
      <DialogoTexto abierto={dialogo === "espera"} titulo="Poner en espera" etiqueta="Por qué" opcional fecha={{ etiqueta: "Retomar el", inicial: sumarDias(14) }}
        ayuda="Mientras espera no cuenta como atrasado." alCerrar={() => setDialogo(null)}
        alGuardar={(t, f) => cambio({ en_espera: true, espera_motivo: t || null, espera_hasta: f ?? null }, "En espera", { en_espera: false })} />
      <DialogoCierre abierto={cierreElegido !== null} titulo={`Cerrar: ${resultado(cierreElegido ?? primerLogrado).toLowerCase()}`}
        equipo={companeros.length ? companeros : equipo} capto={a.capto_id} vendio={a.vendio_id} alCerrar={() => setDialogo(null)}
        conQuien={logrado(cierreElegido ?? primerLogrado) && a.encargos.includes("comercializar")}
        alGuardar={(d) => cambio(
          { en_que_va: "cerrado", resultado: cierreElegido ?? primerLogrado, motivo_cierre: d.motivo, capto_id: d.capto_id, vendio_id: d.vendio_id },
          "Asunto cerrado",
          // Deshacer deja el asunto como estaba: sin motivo de cierre y con quien captó y vendió de antes.
          { en_que_va: a.en_que_va, motivo_cierre: null, capto_id: a.capto_id, vendio_id: a.vendio_id },
        )} />
      <DialogoTexto abierto={dialogo === "propio"} titulo="Apartado propio" etiqueta="Nombre" maximo={80}
        eleccion={{ etiqueta: "Cómo se ve", opciones: (["lista", "tabla", "galeria", "texto"] as const).map((v) => ({ valor: v, etiqueta: NOMBRE_VISTA[v] })) }}
        ayuda="Renglones que se marcan, una tabla con columnas, tarjetas con foto o notas largas. La vista se cambia después sin perder nada."
        alCerrar={() => setDialogo(null)}
        alGuardar={(t, _f, vista) => hacer(async () => {
          const r = await agregar<{ id: string }>(a.id, "apartados", { propio: { nombre: t, vista: (vista as Vista | undefined) ?? "lista" } });
          abrir(r.id, "nueva-fila");
        }, `Se agregó ${t}`)} />
    </div>
  );
}

const PAPEL_COMISION: Record<Comision["reparto"][number]["papel"], string> = { capto: "Captó", vendio: "Vendió", ambos: "Captó y vendió" };

/** «Comisión estimada · Captó Ana 25 %: $12,500 MXN · …», con «Aún no cuenta» si el asunto no está cerrado como logrado. */
function LineaComision({ c, nombreDe }: { c: Comision; nombreDe: (id: string) => string }) {
  const montos = (m: Comision["honorario"]) => m.map((x) => dinero(x.monto, x.moneda)).join(" + ");
  const partes = [
    ...c.reparto.map((r) => `${PAPEL_COMISION[r.papel]} ${nombreDe(r.asesor_id)} ${r.porcentaje} %${r.montos.length ? `: ${montos(r.montos)}` : ""}`),
    c.presupuesto_numero === null ? "Sin presupuesto aceptado" : `Honorario ${c.honorario.length ? montos(c.honorario) : "por calcular"} (presupuesto ${c.presupuesto_numero})`,
    c.por_calcular ? `${c.por_calcular} ${c.por_calcular === 1 ? "concepto" : "conceptos"} por calcular` : "",
  ].filter(Boolean);
  return (
    <p className="as-m" title="Estimación sobre el honorario del presupuesto aceptado. No es registro de lo pagado.">
      <b>Comisión estimada</b>{c.cuenta ? null : <span className="as-pill as-pill-warn" style={{ marginInline: 6 }}>Aún no cuenta</span>} · {partes.join(" · ")}
    </p>
  );
}
