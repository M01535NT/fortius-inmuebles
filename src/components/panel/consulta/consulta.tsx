"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import "../asunto/asunto.css";
import "./consulta.css";
import { Cuadro } from "@/components/panel/asunto/pildora";
import { useCatalogos } from "@/components/panel/datos/catalogos";
import { Icono } from "@/components/panel/icons";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Desplegable } from "@/components/panel/kit/desplegable";
import { BotonDictar, sumarDictado } from "@/components/panel/kit/dictar";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/panel/ui/dialog";
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
} from "@/components/panel/ui/dropdown-menu";
import { Switch } from "@/components/panel/ui/switch";
import {
  FalloPanel, haceCuanto, iconoEncargo, iniciales, sumarDias, type Papel,
} from "@/lib/panel/asuntos/api";
import {
  DEBE, DE_QUIEN, NOMBRE_DEBE, NOMBRE_DE_QUIEN, NOMBRE_OCUPA, NOMBRE_QUIERE, NOMBRE_SI_NO,
  OCUPA, QUIERE, SI_NO,
  abrirAsuntoDe, adjuntar, cerrarComoContacto, cerrarNoProcede, empezarConsulta, encargosSegun, guardarConsulta, leerAbiertas,
  leerConsulta, mensajeParaPedir, quitarAdjunto, unirDocumentos,
  type Canal, type Carga, type ConsultaAbierta, type DatosConsulta, type Debe, type DocumentoPedir, type OtraPersona,
} from "@/lib/panel/consulta/api";

/**
 * La consulta (SPEC.md, sección 4; boceto «Consulta en vivo»): se llena mientras se habla, se guarda sola y,
 * al terminar, abre el asunto con su persona, su inmueble, su lista de documentos y su primer plan.
 * Si se corta la llamada o la conexión, lo capturado queda en este equipo y se vuelve a mandar.
 */

type Borrador = {
  quien_nombre: string; pais: string; numero: string; canal: Canal; que_pasa: string;
  datos: DatosConsulta; otras_personas: OtraPersona[]; documentos_pedir: DocumentoPedir[];
};
type Estado = "vacia" | "guardando" | "guardada" | "sin_conexion" | "error";

const LLAVE = "fortius-panel-consulta";
const VACIO: Borrador = {
  quien_nombre: "", pais: "+52", numero: "", canal: "llamada", que_pasa: "", datos: {}, otras_personas: [],
  documentos_pedir: unirDocumentos({}, []),
};
const tieneAlgo = (b: Borrador) =>
  Boolean(b.quien_nombre.trim() || b.numero.trim() || b.que_pasa.trim() || Object.keys(b.datos).length || b.otras_personas.length);

type Respaldo = { id: string | null; version: number | null; borrador: Borrador };
function leerRespaldo(): Respaldo | null {
  try { const t = localStorage.getItem(LLAVE); return t ? (JSON.parse(t) as Respaldo) : null; } catch { return null; }
}
function guardarRespaldo(r: Respaldo | null) {
  try { if (r) localStorage.setItem(LLAVE, JSON.stringify(r)); else localStorage.removeItem(LLAVE); } catch { /* sin almacenamiento: sigue en pantalla */ }
}

const ops = <T extends string>(lista: readonly T[], nombres: Record<T, string>) => lista.map((v) => ({ valor: v, etiqueta: nombres[v] }));

export function PantallaConsulta() {
  const router = useRouter();
  const params = useSearchParams();
  const { avisar } = useAvisos();
  const cat = useCatalogos();
  const id = useId();

  const [b, setB] = useState<Borrador>(VACIO);
  const [cargas, setCargas] = useState<Carga[]>([]);
  const [estado, setEstado] = useState<Estado>("vacia");
  const [cargando, setCargando] = useState(true);
  const [cerrada, setCerrada] = useState<string | null>(null);
  const [abiertas, setAbiertas] = useState<ConsultaAbierta[]>([]);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [dialogo, setDialogo] = useState<"contacto" | "no_procede" | null>(null);
  const [abriendo, setAbriendo] = useState(false);
  const [subiendo, setSubiendo] = useState(0);

  const bRef = useRef(b);
  const idRef = useRef<string | null>(null);
  const versionRef = useRef<number | null>(null);
  const sucioRef = useRef(false);
  const vueloRef = useRef<Promise<void> | null>(null);
  const relojRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listoRef = useRef(false);
  const falloRef = useRef(false);
  const guardarRef = useRef<() => Promise<void>>(async () => {});

  // ── Guardar ─────────────────────────────────────────────────────────────────────────────────────────
  const guardar = useCallback(async (): Promise<void> => {
    if (vueloRef.current) { await vueloRef.current; if (!sucioRef.current) return; }
    if (!sucioRef.current) return;
    const vuelo = (async () => {
      sucioRef.current = false;
      const actual = bRef.current;
      setEstado("guardando");
      try {
        if (!idRef.current) {
          const nueva = await empezarConsulta({});
          idRef.current = nueva.id;
          versionRef.current = nueva.version;
          router.replace(`/panel/consulta?id=${nueva.id}`, { scroll: false });
        }
        const r = await guardarConsulta(idRef.current, versionRef.current ?? 1, {
          quien_nombre: actual.quien_nombre,
          quien_telefonos: actual.numero.trim() ? [{ pais: actual.pais, numero: actual.numero }] : [],
          canal: actual.canal, que_pasa: actual.que_pasa, datos: actual.datos,
          otras_personas: actual.otras_personas, documentos_pedir: actual.documentos_pedir,
        });
        versionRef.current = r.version;
        guardarRespaldo({ id: idRef.current, version: r.version, borrador: bRef.current });
        falloRef.current = false;
        setEstado(sucioRef.current ? "guardando" : "guardada");
      } catch (e) {
        sucioRef.current = true;
        falloRef.current = true;
        if (e instanceof FalloPanel && e.estado === 0) setEstado("sin_conexion");
        else { setEstado("error"); avisar(e instanceof Error ? e.message : "No se pudo guardar"); }
      }
    })();
    vueloRef.current = vuelo;
    await vuelo;
    vueloRef.current = null;
    // Lo que se escribió mientras se guardaba sale enseguida; tras un fallo, espera al siguiente cambio o a la conexión.
    if (sucioRef.current && !falloRef.current) void guardarRef.current();
  }, [avisar, router]);
  useEffect(() => { guardarRef.current = guardar; }, [guardar]);

  /** Cada cambio: respaldo local al instante y guardado en el servidor al dejar de escribir. */
  const cambiar = useCallback((f: (x: Borrador) => Borrador) => {
    setB((antes) => {
      const nuevo = f(antes);
      bRef.current = nuevo;
      return nuevo;
    });
  }, []);
  useEffect(() => {
    if (!listoRef.current) return;
    if (!tieneAlgo(b) && !idRef.current) return;
    sucioRef.current = true;
    guardarRespaldo({ id: idRef.current, version: versionRef.current, borrador: b });
    if (relojRef.current) clearTimeout(relojRef.current);
    relojRef.current = setTimeout(() => { void guardar(); }, 700);
  }, [b, guardar]);

  // Al volver la conexión, se manda lo pendiente.
  useEffect(() => {
    const alVolver = () => { if (sucioRef.current) void guardar(); };
    window.addEventListener("online", alVolver);
    return () => window.removeEventListener("online", alVolver);
  }, [guardar]);

  // ── Cargar ──────────────────────────────────────────────────────────────────────────────────────────
  const idUrl = params.get("id");
  useEffect(() => {
    // La dirección cambia sola al crearse la consulta: no se vuelve a cargar lo que ya está en pantalla.
    if (idUrl && idUrl === idRef.current) return;
    let vivo = true;
    (async () => {
      const respaldo = leerRespaldo();
      const elegido = idUrl;
      if (elegido) {
        try {
          const c = await leerConsulta(elegido);
          if (!vivo) return;
          idRef.current = c.id;
          versionRef.current = c.version;
          const tel = c.quien_telefonos[0];
          const delServidor: Borrador = {
            quien_nombre: c.quien_nombre, pais: tel?.pais ?? "+52", numero: tel?.numero ?? "", canal: c.canal, que_pasa: c.que_pasa,
            datos: c.datos ?? {}, otras_personas: c.otras_personas ?? [], documentos_pedir: unirDocumentos(c.datos ?? {}, c.documentos_pedir ?? []),
          };
          // Si en este equipo quedó algo sin mandar de esta misma consulta, gana lo de aquí.
          const local = respaldo?.id === c.id && respaldo.version === c.version ? respaldo.borrador : null;
          const usar = local ?? delServidor;
          bRef.current = usar;
          setB(usar);
          setCargas(c.cargas);
          if (c.estado !== "abierta") setCerrada(c.estado === "asunto" && c.asunto_id ? c.asunto_id : c.estado);
          setEstado("guardada");
          if (local && JSON.stringify(local) !== JSON.stringify(delServidor)) sucioRef.current = true;
        } catch (e) {
          if (!vivo) return;
          if (respaldo?.id === elegido) { bRef.current = respaldo.borrador; setB(respaldo.borrador); idRef.current = elegido; versionRef.current = respaldo.version; setEstado("sin_conexion"); sucioRef.current = true; }
          else avisar(e instanceof Error ? e.message : "No se pudo abrir la consulta");
        }
      } else if (respaldo && !respaldo.id && tieneAlgo(respaldo.borrador)) {
        // Se cortó antes de llegar al servidor: se recupera de este equipo.
        bRef.current = respaldo.borrador;
        setB(respaldo.borrador);
        sucioRef.current = true;
        avisar("Recuperé la consulta que se quedó a medias");
      }
      if (!vivo) return;
      setCargando(false);
      listoRef.current = true;
      if (sucioRef.current) void guardar();
      leerAbiertas().then((l) => { if (vivo) setAbiertas(l); }).catch(() => {});
    })();
    return () => { vivo = false; };
  }, [idUrl, avisar, guardar]);

  // ── Derivados ───────────────────────────────────────────────────────────────────────────────────────
  const d = b.datos;
  const encargos = useMemo(() => encargosSegun(d), [d]);
  const porPedir = b.documentos_pedir.filter((x) => !x.quitado).length;
  const otrasSinTerminar = abiertas.filter((a) => a.id !== idUrl);

  const ponDato = <K extends keyof DatosConsulta>(k: K, v: DatosConsulta[K] | "") =>
    cambiar((x) => {
      const datos = { ...x.datos };
      if (v === "" || v === undefined || (Array.isArray(v) && v.length === 0)) delete datos[k];
      else datos[k] = v as DatosConsulta[K];
      return { ...x, datos, documentos_pedir: unirDocumentos(datos, x.documentos_pedir) };
    });

  // ── Acciones ────────────────────────────────────────────────────────────────────────────────────────
  async function asegurarGuardada(): Promise<boolean> {
    if (relojRef.current) clearTimeout(relojRef.current);
    if (!idRef.current) sucioRef.current = true;
    for (let i = 0; i < 3 && (sucioRef.current || vueloRef.current); i++) await guardar();
    return Boolean(idRef.current) && !sucioRef.current;
  }

  async function abrir() {
    if (abriendo) return;
    setAbriendo(true);
    try {
      if (!(await asegurarGuardada())) { avisar("Aún no se guarda la consulta. Revisa la conexión y vuelve a intentar."); return; }
      const a = await abrirAsuntoDe(idRef.current as string, versionRef.current ?? 1);
      guardarRespaldo(null);
      avisar("Asunto abierto con su persona, su inmueble y su lista");
      router.push(`/panel/asuntos/${a.id}`);
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se pudo abrir el asunto");
    } finally {
      setAbriendo(false);
    }
  }

  async function cerrarComo(como: "contacto" | "no_procede", valor: string) {
    try {
      if (!(await asegurarGuardada())) { avisar("Aún no se guarda la consulta. Revisa la conexión y vuelve a intentar."); return; }
      if (como === "contacto") {
        await cerrarComoContacto(idRef.current as string, versionRef.current ?? 1, valor);
        avisar("Queda en el Directorio con fecha para volver a llamarle");
      } else {
        await cerrarNoProcede(idRef.current as string, versionRef.current ?? 1, valor);
        avisar("Consulta cerrada: no procede");
      }
      guardarRespaldo(null);
      router.push("/panel");
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se pudo cerrar la consulta");
    }
  }

  async function subir(archivos: File[]) {
    if (!archivos.length) return;
    if (!(await asegurarGuardada())) { avisar("Aún no se guarda la consulta. Revisa la conexión y vuelve a intentar."); return; }
    setSubiendo((n) => n + archivos.length);
    for (const archivo of archivos) {
      try {
        const c = await adjuntar(idRef.current as string, archivo);
        setCargas((x) => [...x, c]);
      } catch (e) {
        avisar(`${archivo.name}: ${e instanceof Error ? e.message : "no se pudo subir"}`);
      } finally {
        setSubiendo((n) => n - 1);
      }
    }
  }

  async function quitarArchivo(c: Carga) {
    try {
      await quitarAdjunto(idRef.current as string, c.id);
      setCargas((x) => x.filter((y) => y.id !== c.id));
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se pudo quitar");
    }
  }

  function nuevaConsulta() {
    guardarRespaldo(null);
    idRef.current = null; versionRef.current = null; sucioRef.current = false;
    bRef.current = VACIO;
    setB(VACIO); setCargas([]); setCerrada(null); setEstado("vacia");
    router.replace("/panel/consulta", { scroll: false });
  }

  // ── Pantalla ────────────────────────────────────────────────────────────────────────────────────────
  if (cargando) return <div className="cs-in"><p className="as-m as-cargando">Abriendo la consulta…</p></div>;

  if (cerrada) {
    const esAsunto = cerrada !== "contacto" && cerrada !== "no_procede";
    return (
      <div className="cs-in">
        <div className="as-card as-pad as-vacio">
          <Cuadro icono={esAsunto ? "asu" : "ok"} color={esAsunto ? "blue" : "gray"} />
          <p><b>{esAsunto ? "Esta consulta ya abrió su asunto." : cerrada === "contacto" ? "Esta consulta quedó como contacto." : "Esta consulta se cerró: no procede."}</b></p>
          <div className="as-fila">
            {esAsunto ? <Link className="as-btn as-pri" href={`/panel/asuntos/${cerrada}`}>Ir al asunto</Link> : null}
            <button type="button" className="as-btn" onClick={nuevaConsulta}><Icono nombre="mas" tamano={16} />Nueva consulta</button>
          </div>
        </div>
      </div>
    );
  }

  const textoEstado: Record<Estado, string> = {
    vacia: "Se guarda sola", guardando: "Guardando…", guardada: "Guardada", sin_conexion: "Sin conexión: guardada en este equipo", error: "No se guardó",
  };

  return (
    <div className="cs-in">
      <div className="cs-top">
        <Link href="/panel" className="as-btn as-gho as-ico" aria-label="Cerrar la consulta" title="Cerrar (queda guardada)"><Icono nombre="x" tamano={18} /></Link>
        <h1 className="as-h1 cs-h1">Consulta</h1>
        <span className={`cs-vivo${estado === "sin_conexion" || estado === "error" ? " cs-vivo-mal" : ""}`} role="status"><i aria-hidden />{textoEstado[estado]}</span>
        <span className="as-sp" />
        <DropdownMenu>
          <DropdownMenuTrigger className="as-btn">Sin asunto<Icono nombre="down" tamano={14} /></DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => setDialogo("contacto")}><Icono nombre="users" tamano={16} />Guardar como contacto</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setDialogo("no_procede")}><Icono nombre="x" tamano={16} />No procede</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <button type="button" className="as-btn as-pri" onClick={() => void abrir()} aria-disabled={abriendo}>
          <Icono nombre="ok" tamano={16} />{abriendo ? "Abriendo…" : "Abrir asunto"}
        </button>
      </div>

      {otrasSinTerminar.length ? (
        <div className="as-ban cs-ban" role="status">
          <Icono nombre="reloj" tamano={16} />
          <span>{otrasSinTerminar.length === 1 ? "Tienes otra consulta sin terminar" : `Tienes ${otrasSinTerminar.length} consultas sin terminar`}</span>
          <span className="as-sp" />
          <DropdownMenu>
            <DropdownMenuTrigger className="as-btn">Seguir con…<Icono nombre="down" tamano={14} /></DropdownMenuTrigger>
            <DropdownMenuContent>
              {otrasSinTerminar.map((a) => (
                <DropdownMenuItem key={a.id} onSelect={() => { guardarRespaldo(null); router.push(`/panel/consulta?id=${a.id}`); }}>
                  <span className="cs-sin">{a.quien_nombre.trim() || "Sin nombre"}<span className="as-m">{haceCuanto(a.updated_at)}</span></span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : null}

      <div className="cs-dos">
        <div className="cs-col">
          <div className="as-card as-pad cs-g">
            <div className="cs-g3">
              <label className="pn-campo" htmlFor={`${id}-n`}>Quién llama
                <input id={`${id}-n`} className="as-inp as-inp-borde" value={b.quien_nombre} maxLength={160} autoFocus autoComplete="off"
                  onChange={(e) => cambiar((x) => ({ ...x, quien_nombre: e.target.value }))} />
              </label>
              <div className="pn-campo">
                <label htmlFor={`${id}-t`}>Teléfono</label>
                <span className="as-tel">
                  <input aria-label="Clave del país" className="as-inp as-inp-borde as-clave" value={b.pais} maxLength={5} inputMode="tel"
                    onChange={(e) => cambiar((x) => ({ ...x, pais: e.target.value }))} />
                  <input id={`${id}-t`} className="as-inp as-inp-borde" inputMode="tel" value={b.numero} maxLength={30} autoComplete="off"
                    onChange={(e) => cambiar((x) => ({ ...x, numero: e.target.value }))} />
                </span>
              </div>
              <Desplegable etiqueta="Por dónde" valor={b.canal} opciones={cat.opciones("fuente", b.canal)}
                alElegir={(v) => cambiar((x) => ({ ...x, canal: (v || "llamada") as Canal }))} />
            </div>
            <label className="pn-campo" htmlFor={`${id}-q`}>
              <span className="as-fila">Qué pasa<span className="as-sp" />
                <BotonDictar que="qué pasa" alDictar={(t) => cambiar((x) => ({ ...x, que_pasa: sumarDictado(x.que_pasa, t) }))} alFallar={avisar} />
              </span>
              <textarea id={`${id}-q`} className="as-inp as-inp-borde as-area cs-que" value={b.que_pasa} maxLength={20000} placeholder="Como te lo cuenta"
                onChange={(e) => cambiar((x) => ({ ...x, que_pasa: e.target.value }))} />
            </label>
          </div>

          <div className="as-card as-pad">
            <div className="cs-g3">
              <Desplegable etiqueta="Qué quiere" valor={d.que_quiere ?? ""} vacio="Sin decir" opciones={ops(QUIERE, NOMBRE_QUIERE)} alElegir={(v) => ponDato("que_quiere", v)} />
              <Desplegable etiqueta="De quién es" valor={d.de_quien ?? ""} vacio="Sin decir" opciones={ops(DE_QUIEN, NOMBRE_DE_QUIEN)} alElegir={(v) => ponDato("de_quien", v)} />
              <Desplegable etiqueta="Qué es" valor={d.tipo ?? ""} vacio="Sin decir" opciones={cat.opciones("tipo_inmueble", d.tipo)} alElegir={(v) => ponDato("tipo", v)} />
              <label className="pn-campo" htmlFor={`${id}-c`}>Colonia
                <input id={`${id}-c`} className="as-inp as-inp-borde" value={d.colonia ?? ""} maxLength={120} autoComplete="off"
                  onChange={(e) => ponDato("colonia", e.target.value)} />
              </label>
              <Desplegable etiqueta="Quién lo ocupa" valor={d.ocupa ?? ""} vacio="Sin decir" opciones={ops(OCUPA, NOMBRE_OCUPA)} alElegir={(v) => ponDato("ocupa", v)} />
              <Desplegable etiqueta="Escritura" valor={d.escritura ?? ""} vacio="Sin decir" opciones={ops(SI_NO, NOMBRE_SI_NO)} alElegir={(v) => ponDato("escritura", v)} />
              <QueDebe valor={d.debe ?? []} alCambiar={(v) => ponDato("debe", v)} />
            </div>
          </div>
        </div>

        <div className="cs-col">
          <section>
            <h2 className="cs-h2">
              <Cuadro icono="file" color="teal" chico />Para pedirle <span className="as-m">{porPedir || ""}</span>
              <span className="as-sp" />
              <button type="button" className="as-btn as-gho as-ico" title="Mensaje para WhatsApp" aria-label="Mensaje para WhatsApp"
                onClick={() => setMensaje(mensajeParaPedir(b.quien_nombre, b.documentos_pedir))}><Icono nombre="chat" tamano={17} /></button>
            </h2>
            <div className="as-card cs-docs">
              {b.documentos_pedir.map((x) => (
                <div key={x.nombre} className="as-t" data-est={x.quitado ? "no_aplica" : "pendiente"}>
                  <button type="button" className="as-ckb" aria-pressed={!x.quitado} aria-label={`${x.quitado ? "Pedir" : "No pedir"}: ${x.nombre}`}
                    onClick={() => cambiar((y) => ({ ...y, documentos_pedir: y.documentos_pedir.map((z) => (z.nombre === x.nombre ? { ...z, quitado: !z.quitado } : z)) }))}>
                    <span className="as-ck as-ck-cu">{x.quitado ? null : <Icono nombre="ok" tamano={12} />}</span>
                  </button>
                  <span className="as-tb"><span className="as-n">{x.nombre}</span></span>
                  {x.propio ? (
                    <button type="button" className="as-btn as-gho as-ico" aria-label={`Quitar ${x.nombre}`}
                      onClick={() => cambiar((y) => ({ ...y, documentos_pedir: y.documentos_pedir.filter((z) => z.nombre !== x.nombre) }))}><Icono nombre="x" tamano={15} /></button>
                  ) : null}
                </div>
              ))}
              <AgregarRenglon etiqueta="Otro documento por pedir" alAgregar={(nombre) => cambiar((y) =>
                y.documentos_pedir.some((z) => z.nombre.toLowerCase() === nombre.toLowerCase()) ? y
                  : { ...y, documentos_pedir: [...y.documentos_pedir, { nombre, grupo: "otro", entrega_papel: "cliente", propio: true }] })} />
            </div>
          </section>

          <OtrasPersonas lista={b.otras_personas} alCambiar={(otras) => cambiar((x) => ({ ...x, otras_personas: otras }))} />

          <section>
            <h2 className="cs-h2"><Cuadro icono="subir" color="teal" chico />Lo que ya mandó <span className="as-m">{cargas.length || ""}</span></h2>
            <div className="as-card">
              {cargas.map((c) => (
                <div key={c.id} className="as-ren">
                  <Icono nombre={c.mime === "application/pdf" ? "pdf" : "img"} tamano={18} />
                  <span className="as-ren-c"><b className="as-corta">{c.nombre_original}</b></span>
                  <span className="as-pill as-pill-ok">Recibido</span>
                  <button type="button" className="as-btn as-gho as-ico" aria-label={`Quitar ${c.nombre_original}`} onClick={() => void quitarArchivo(c)}><Icono nombre="x" tamano={15} /></button>
                </div>
              ))}
              <div className="as-pad">
                <label className="as-btn cs-subir">
                  <Icono nombre="subir" tamano={16} />{subiendo ? `Subiendo ${subiendo}…` : "Adjuntar archivos"}
                  <input type="file" multiple accept="application/pdf,image/jpeg,image/png,image/webp" className="sr-only"
                    onChange={(e) => { const lista = [...(e.target.files ?? [])]; e.target.value = ""; void subir(lista); }} />
                </label>
              </div>
            </div>
          </section>

          <div className="as-fila cs-para">
            <span className="as-m">Se abre para</span>
            {(encargos.length ? encargos : []).map((e) => (
              <span key={e} className="as-pill"><Icono nombre={iconoEncargo(e)[0]} tamano={12} />{cat.etiqueta("encargo", e)}</span>
            ))}
            {!encargos.length ? <span className="as-m">lo que se decida en el asunto</span> : null}
          </div>
        </div>
      </div>

      <Dialog open={mensaje !== null} onOpenChange={(o) => { if (!o) setMensaje(null); }}>
        <DialogContent className="max-w-md">
          <DialogTitle>Mensaje para WhatsApp</DialogTitle>
          <DialogDescription>Tú lo envías; nada sale solo.</DialogDescription>
          <textarea className="as-inp as-inp-borde as-area cs-msg" readOnly value={mensaje ?? ""} aria-label="Mensaje" />
          <div className="as-fila as-fin">
            <button type="button" className="as-btn" onClick={() => setMensaje(null)}>Cerrar</button>
            <button type="button" className="as-btn as-pri" onClick={() => {
              void navigator.clipboard.writeText(mensaje ?? "").then(() => avisar("Mensaje copiado"), () => avisar("No se pudo copiar; selecciónalo y cópialo"));
            }}><Icono nombre="copia" tamano={16} />Copiar</button>
          </div>
        </DialogContent>
      </Dialog>

      <DialogoCierre abierto={dialogo} alCerrar={() => setDialogo(null)} alGuardar={(como, valor) => void cerrarComo(como, valor)} />
    </div>
  );
}

/** «Qué debe»: se eligen varias. */
function QueDebe({ valor, alCambiar }: { valor: Debe[]; alCambiar: (v: Debe[]) => void }) {
  const texto = valor.length ? valor.map((v) => NOMBRE_DEBE[v]).join(", ") : "Sin decir";
  return (
    <div className="pn-campo">
      <span id="cs-debe">Qué debe</span>
      <DropdownMenu>
        <DropdownMenuTrigger className="as-inp as-inp-borde cs-multi" aria-labelledby="cs-debe" aria-describedby="cs-debe-v">
          <span id="cs-debe-v" className="as-corta">{texto}</span><Icono nombre="down" tamano={14} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-52">
          <DropdownMenuLabel>Qué debe (varias)</DropdownMenuLabel>
          {DEBE.map((v) => (
            <DropdownMenuCheckboxItem key={v} checked={valor.includes(v)} onSelect={(e) => e.preventDefault()}
              onCheckedChange={(si) => {
                const sin = valor.filter((x) => x !== v);
                // «Nada» y «No sabe» no se combinan con lo demás.
                const solo = v === "nada" || v === "no_sabe";
                alCambiar(si ? (solo ? [v] : [...sin.filter((x) => x !== "nada" && x !== "no_sabe"), v]) : sin);
              }}>
              {NOMBRE_DEBE[v]}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/** Un renglón para escribir y agregar con Enter. */
function AgregarRenglon({ etiqueta, alAgregar }: { etiqueta: string; alAgregar: (texto: string) => void }) {
  const [t, setT] = useState("");
  return (
    <form className="cs-agregar" onSubmit={(e) => { e.preventDefault(); const v = t.trim(); if (!v) return; alAgregar(v.slice(0, 200)); setT(""); }}>
      <Icono nombre="mas" tamano={15} />
      <input className="as-inp cs-inp-plano" placeholder={etiqueta} aria-label={etiqueta} value={t} maxLength={200} onChange={(e) => setT(e.target.value)} />
    </form>
  );
}

/** Otras personas del caso (la titular, los hermanos…), con su papel, sin salir de la consulta. */
function OtrasPersonas({ lista, alCambiar }: { lista: OtraPersona[]; alCambiar: (l: OtraPersona[]) => void }) {
  const id = useId();
  const [nombre, setNombre] = useState("");
  const cat = useCatalogos();
  const [elegido, setPapel] = useState<Papel>("titular");
  // Quien llama ya entra como contacto: aquí se ofrecen los demás papeles. Si «titular» se desactivó, el primero que quede.
  const papeles = cat.opciones("papel").filter((o) => o.valor !== "contacto");
  const papel = papeles.some((o) => o.valor === elegido) ? elegido : papeles[0]?.valor ?? elegido;
  const [fallecida, setFallecida] = useState(false);
  const [pais, setPais] = useState("+52");
  const [numero, setNumero] = useState("");
  const listo = nombre.trim().length > 0;
  function agregar() {
    if (!listo) return;
    alCambiar([...lista, {
      nombre: nombre.trim().slice(0, 160), papel, fallecida: fallecida || undefined,
      ...(numero.trim() && !fallecida ? { pais, numero: numero.trim() } : {}),
    }]);
    setNombre(""); setNumero(""); setFallecida(false);
  }
  return (
    <section>
      <h2 className="cs-h2"><Cuadro icono="users" color="blue" chico />Otras personas del caso <span className="as-m">{lista.length || ""}</span></h2>
      <div className="as-card">
        {lista.map((p, i) => (
          <div key={`${p.nombre}-${i}`} className="as-ren">
            <span className="as-av" aria-hidden>{iniciales(p.nombre)}</span>
            <span className="as-ren-c"><b>{p.nombre}</b>{p.numero ? <span>{p.pais} {p.numero}</span> : null}</span>
            {p.fallecida ? <span className="as-pill">Falleció</span> : null}
            <span className="as-pill">{cat.etiqueta("papel", p.papel)}</span>
            <button type="button" className="as-btn as-gho as-ico" aria-label={`Quitar a ${p.nombre}`} onClick={() => alCambiar(lista.filter((_, j) => j !== i))}><Icono nombre="x" tamano={15} /></button>
          </div>
        ))}
        <form className="as-pad as-form" onSubmit={(e) => { e.preventDefault(); agregar(); }}>
          <div className="as-g2">
            <label className="pn-campo" htmlFor={`${id}-n`}>Nombre
              <input id={`${id}-n`} className="as-inp as-inp-borde" value={nombre} maxLength={160} autoComplete="off" onChange={(e) => setNombre(e.target.value)} />
            </label>
            <Desplegable etiqueta="Papel" valor={papel} opciones={papeles} alElegir={(v) => { if (v) setPapel(v); }} />
          </div>
          {!fallecida ? (
            <div className="pn-campo">
              <label htmlFor={`${id}-t`}>Teléfono (opcional)</label>
              <span className="as-tel">
                <input aria-label="Clave del país" className="as-inp as-inp-borde as-clave" value={pais} maxLength={5} onChange={(e) => setPais(e.target.value)} />
                <input id={`${id}-t`} className="as-inp as-inp-borde" inputMode="tel" value={numero} maxLength={30} onChange={(e) => setNumero(e.target.value)} />
              </span>
            </div>
          ) : null}
          <div className="as-fila">
            <label className="as-fila as-switch">
              <Switch checked={fallecida} onCheckedChange={setFallecida} aria-label="Falleció" />
              <span>Falleció</span>
            </label>
            <span className="as-sp" />
            <button type="submit" className="as-btn" aria-disabled={!listo}><Icono nombre="mas" tamano={16} />Agregar</button>
          </div>
        </form>
      </div>
    </section>
  );
}

/** «Guardar como contacto» (con fecha para volver a llamar) o «No procede» (con su motivo). */
function DialogoCierre({ abierto, alCerrar, alGuardar }: {
  abierto: "contacto" | "no_procede" | null; alCerrar: () => void; alGuardar: (como: "contacto" | "no_procede", valor: string) => void;
}) {
  return (
    <Dialog open={abierto !== null} onOpenChange={(o) => { if (!o) alCerrar(); }}>
      <DialogContent className="max-w-md">
        <DialogTitle>{abierto === "contacto" ? "Guardar como contacto" : "No procede"}</DialogTitle>
        <DialogDescription>
          {abierto === "contacto" ? "Queda en el Directorio, sin asunto. Ese día aparece en Inicio." : "La consulta se cierra con su motivo."}
        </DialogDescription>
        {abierto ? <FormaCierre como={abierto} alCerrar={alCerrar} alGuardar={alGuardar} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function FormaCierre({ como, alCerrar, alGuardar }: { como: "contacto" | "no_procede"; alCerrar: () => void; alGuardar: (como: "contacto" | "no_procede", valor: string) => void }) {
  const id = useId();
  const [valor, setValor] = useState(como === "contacto" ? sumarDias(14) : "");
  const listo = como === "no_procede" || /^\d{4}-\d{2}-\d{2}$/.test(valor);
  return (
    <form className="as-form" onSubmit={(e) => { e.preventDefault(); if (!listo) return; alCerrar(); alGuardar(como, valor.trim()); }}>
      {como === "contacto" ? (
        <label className="pn-campo" htmlFor={`${id}-f`}>Volver a llamarle el
          <input id={`${id}-f`} type="date" className="as-inp as-inp-borde" value={valor} onChange={(e) => setValor(e.target.value)} autoFocus />
        </label>
      ) : (
        <label className="pn-campo" htmlFor={`${id}-m`}>Motivo (opcional)
          <input id={`${id}-m`} className="as-inp as-inp-borde" value={valor} maxLength={1000} onChange={(e) => setValor(e.target.value)} autoFocus />
        </label>
      )}
      <div className="as-fila as-fin">
        <button type="button" className="as-btn" onClick={alCerrar}>Cancelar</button>
        <button type="submit" className="as-btn as-pri" aria-disabled={!listo}>{como === "contacto" ? "Guardar" : "Cerrar consulta"}</button>
      </div>
    </form>
  );
}
