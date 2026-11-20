"use client";
import "../asunto/asunto.css";
import "../biblioteca/biblioteca.css";
import "./inicio.css";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { useCatalogos } from "@/components/panel/datos/catalogos";
import { useMisPreferencias } from "@/components/panel/datos/use-mis-preferencias";
import { Icono, type NombreIcono } from "@/components/panel/icons";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Desplegable } from "@/components/panel/kit/desplegable";
import { useRecordatorios } from "@/components/panel/kit/recordatorios";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/panel/ui/dropdown-menu";
import {
  cambiar, diasHasta, fechaCorta, haceCuanto, iniciales, leerEquipo, sumarDias, type Miembro,
} from "@/lib/panel/asuntos/api";
import { cambiarPersonaDirectorio } from "@/lib/panel/biblioteca";
import { empezarConsulta } from "@/lib/panel/consulta/api";
import {
  atenderSolicitud, leerInicio, pasarSolicitud, solicitudNoProcede,
  type ContactoInicio, type Inicio as DatosInicio, type Moneda, type ParaTiInicio, type SolicitudInicio, type TareaInicio,
} from "@/lib/panel/inicio";
import { useSession } from "@/lib/panel/legado/sesion";

import { DialogoMensaje, enlaceWhatsApp, primerNombre } from "../asunto/comun";
import { Cuadro } from "../asunto/pildora";

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const fechaLarga = (t: string) => { const [a, m, d] = t.split("-").map(Number); return `${DIAS[new Date(a, m - 1, d).getDay()]} ${d} de ${MESES[m - 1]}`; };
const dinero = (n: number, m: Moneda) => `${new Intl.NumberFormat("es-MX", { style: "currency", currency: m, currencyDisplay: m === "USD" ? "code" : "symbol", maximumFractionDigits: 0 }).format(n)}`;
/** «Lic. Ochoa», no «Lic.»; a los demás, por su primer nombre. */
const saludo = (n: string) => (primerNombre(n).endsWith(".") ? n.replace(/\s*\(.*\)\s*$/, "") : primerNombre(n));
const minutos = (iso: string) => Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
const ordenar = (a: TareaInicio, b: TareaInicio) => `${a.fecha ?? "9"}${a.hora ?? "99"}`.localeCompare(`${b.fecha ?? "9"}${b.hora ?? "99"}`);
/** Días que lleva de retraso lo que otra persona quedó de hacer (desde la fecha prometida). */
const espera = (t: TareaInicio) => (t.fecha ? -diasHasta(t.fecha) : 0);
/** Ya toca volver a preguntarle (tres días después de su fecha, o de la última vez que se le recordó). */
const tocaPreguntar = (t: TareaInicio) => !!t.volver_a_preguntar && diasHasta(t.volver_a_preguntar) <= 0;

/**
 * Inicio (boceto aprobado): primero quien espera respuesta del sitio; luego lo de hoy, las visitas, la semana, lo que
 * esperas de otros (lo que lleva más días arriba) y lo que falta cobrar. Cada quien ve lo suyo; el director, todo el equipo.
 */
export function Inicio() {
  const { avisar } = useAvisos();
  const cat = useCatalogos();
  const router = useRouter();
  const sesion = useSession();
  const director = sesion?.role === "admin";
  const [datos, setDatos] = useState<DatosInicio | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [equipo, setEquipo] = useState<Miembro[]>([]);
  // Todo el equipo, solo para poner el nombre de quien te mencionó.
  const [companeros, setCompaneros] = useState<Miembro[]>([]);
  const [yo, setYo] = useState<string | null>(null);
  const [de, setDe] = useState("");
  const [recordar, setRecordar] = useState<TareaInicio | null>(null);
  const [hechas, setHechas] = useState<Set<string>>(() => new Set());
  // Hasta cuándo ya viste «Para ti» (te sigue en cualquier equipo): lo posterior sale marcado como nuevo y cuenta en el menú.
  const prefs = useMisPreferencias();
  const visto = prefs.cargado ? (prefs.panel.paraTiVisto ?? "") : "9999";
  // El número junto a «Inicio» se pone al día cada vez que esta pantalla cambia algo.
  const { revisar } = useRecordatorios();
  const ponerVisto = (v: string) => { prefs.cambiar({ paraTiVisto: v }).then(revisar, (e: unknown) => avisar(e instanceof Error ? e.message : "No se pudo guardar.")); };

  const cargar = useCallback(() => leerInicio().then((x) => { setDatos(x); setError(null); setHechas(new Set()); revisar(); },
    (e: unknown) => setError(e instanceof Error ? e.message : "No se pudo cargar.")), [revisar]);
  useEffect(() => { void cargar(); }, [cargar]);
  useEffect(() => { leerEquipo().then((r) => { setEquipo(r.equipo); setCompaneros(r.companeros ?? r.equipo); setYo(r.yo); }, () => undefined); }, []);
  // Cada minuto se mueve el «hace cuánto» de las solicitudes.
  const [, latir] = useState(0);
  useEffect(() => { const t = setInterval(() => latir((n) => n + 1), 60_000); return () => clearInterval(t); }, []);

  const hacer = async (accion: () => Promise<unknown>, aviso: string) => {
    try { await accion(); avisar(aviso); }
    catch (e) { avisar(e instanceof Error ? e.message : "No se pudo terminar."); }
    await cargar();
  };

  const v = useMemo(() => {
    if (!datos) return null;
    const hoy = datos.hoy, semana = sumarDias(7);
    // El asesor ve lo que lleva él; el director elige de quién (o todo el equipo).
    const quien = director ? de : (yo ?? "");
    const mias = datos.tareas.filter((t) => !hechas.has(t.id) && (!quien || t.responsable_id === quien));
    const fortius = mias.filter((t) => t.quien === "fortius" && t.clase !== "visita" && t.fecha);
    return {
      solicitudes: datos.solicitudes.filter((s) => !director || !de || s.asignada_a === de || !s.asignada_a),
      hoy: fortius.filter((t) => t.fecha! <= hoy).sort(ordenar),
      visitas: mias.filter((t) => t.clase === "visita" && t.fecha && t.fecha >= hoy && t.fecha <= semana).sort(ordenar),
      semana: fortius.filter((t) => t.fecha! > hoy && t.fecha! <= semana).sort(ordenar),
      otros: mias.filter((t) => t.quien !== "fortius" && t.clase !== "visita" && (t.fecha ? t.fecha <= semana : tocaPreguntar(t)))
        .sort((a, b) => espera(b) - espera(a) || ordenar(a, b)),
      contactos: datos.contactos,
      vencen: datos.vencen,
      cobrar: datos.cobrar,
    };
  }, [datos, de, director, yo, hechas]);

  const marcarHecha = async (t: TareaInicio) => {
    setHechas((s) => new Set(s).add(t.id));
    try {
      await cambiar(t.asunto_id, "tareas", { id: t.id, version: t.version, estado: "hecha" });
      avisar(`Hecha. Quedó anotada en ${t.asunto.nombre}.`);
    } catch (e) { avisar(e instanceof Error ? e.message : "No se pudo marcar."); }
    await cargar();
  };
  const atender = async (s: SolicitudInicio) => {
    try {
      const r = await atenderSolicitud(s);
      if (r.consulta_id) router.push(`/panel/consulta?id=${r.consulta_id}`);
    } catch (e) { avisar(e instanceof Error ? e.message : "No se pudo abrir."); await cargar(); }
  };
  const nuevoAsunto = async (p: ContactoInicio) => {
    try { const c = await empezarConsulta({ persona_id: p.id }); router.push(`/panel/consulta?id=${c.id}`); }
    catch (e) { avisar(e instanceof Error ? e.message : "No se pudo empezar la consulta."); }
  };
  const nombreDe = (id: string | null) => (id ? (equipo.find((m) => m.id === id) ?? companeros.find((m) => m.id === id))?.nombre ?? "Otra persona" : null);
  const otrosDelEquipo = equipo.filter((m) => m.id !== yo || director);

  return (
    <div className="in-raiz">
      {/* Barra de 52 px como las del modelo visual: el título, el día y, a la derecha, de quién ver y «Nueva consulta». */}
      <div className="in-barra">
        <h1>Inicio</h1>
        <span className="in-dia">{datos ? fechaLarga(datos.hoy) : ""}</span>
        <span className="as-sp" />
        {director && equipo.length > 1 ? (
          <div className="db-filtro in-filtro">
            <Desplegable etiqueta="De quién" valor={de} vacio="Todo el equipo" alElegir={setDe}
              opciones={equipo.map((m) => ({ valor: m.id, etiqueta: m.id === yo ? `${m.nombre} (yo)` : m.nombre }))} />
          </div>
        ) : null}
        <Link href="/panel/consulta" className="as-btn as-pri in-nueva"><Icono nombre="tel" tamano={15} />Nueva consulta</Link>
      </div>
    <div className="db-pagina in-pagina">

      {error ? <div className="as-vacio"><Icono nombre="alerta" tamano={24} /><b>{error}</b><button type="button" className="as-btn" onClick={() => void cargar()}>Reintentar</button></div> : null}
      {!v && !error ? <div className="as-cargando" aria-label="Cargando"><span /><span /><span /></div> : null}

      {v ? (
        <>
          {v.solicitudes.length ? (
            <Bloque icono="globo" color="red" titulo="Por atender" cuenta={v.solicitudes.length}>
              {v.solicitudes.map((s) => {
                const min = minutos(s.recibida_el);
                const lleva = nombreDe(s.asignada_a);
                return (
                  <div key={s.id} className="db-fila in-fila">
                    <span className="db-quien">
                      <span className="as-av" aria-hidden>{iniciales(s.nombre)}</span>
                      <span className="as-ren-c">
                        <b>{s.nombre || "Sin nombre"}</b>
                        <span>{[s.inmueble ? s.inmueble.nombre : "Del sitio", s.mensaje].filter(Boolean).join(" · ")}</span>
                      </span>
                    </span>
                    <span className="db-asuntos">
                      {director ? <span className="as-pill">{lleva ? primerNombre(lleva) : "Sin asignar"}</span> : null}
                      <span className={`as-pill ${min > 120 ? "as-pill-bad" : min > 60 ? "as-pill-warn" : "as-pill-acc"}`} title="Lleva esperando">
                        <Icono nombre="reloj" tamano={12} />{haceCuanto(s.recibida_el)}
                      </span>
                    </span>
                    <span className="db-mas in-acc">
                      <button type="button" className="as-btn" onClick={() => void atender(s)}><Icono nombre="tel" tamano={16} />Atender</button>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="as-btn as-gho as-ico" aria-label={`Más de la solicitud de ${s.nombre}`}><Icono nombre="dots" tamano={18} /></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-60">
                          {s.telefono ? (
                            <DropdownMenuItem asChild>
                              <a href={enlaceWhatsApp(`Hola ${primerNombre(s.nombre)}, te escribo de Fortius Inmuebles por tu mensaje en el sitio.`, s.telefono)} target="_blank" rel="noopener noreferrer">
                                <Icono nombre="chat" tamano={16} />Escribirle por WhatsApp
                              </a>
                            </DropdownMenuItem>
                          ) : null}
                          {s.asunto_id && s.interesado_id ? (
                            <DropdownMenuItem asChild>
                              <Link href={`/panel/asuntos/${s.asunto_id}?ver=interesados`}><Icono nombre="users" tamano={16} />Ver en Interesados</Link>
                            </DropdownMenuItem>
                          ) : null}
                          {director && otrosDelEquipo.length ? (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel>Pasar a</DropdownMenuLabel>
                              {otrosDelEquipo.filter((m) => m.id !== s.asignada_a).map((m) => (
                                <DropdownMenuItem key={m.id} onSelect={() => void hacer(() => pasarSolicitud(s, m.id), `Ahora la lleva ${primerNombre(m.nombre)}`)}>
                                  <span className="as-av in-av-chico" aria-hidden>{iniciales(m.nombre)}</span>{m.id === yo ? `${m.nombre} (yo)` : m.nombre}
                                </DropdownMenuItem>
                              ))}
                            </>
                          ) : null}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem peligro onSelect={() => void hacer(() => solicitudNoProcede(s), "Quitada de Por atender")}>
                            <Icono nombre="x" tamano={16} />No procede
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </span>
                  </div>
                );
              })}
            </Bloque>
          ) : null}

          {datos!.paraTi.length ? <ParaTi items={datos!.paraTi} visto={visto} nombreDe={nombreDe} alVer={() => ponerVisto(new Date(datos!.paraTi[0].cuando).toISOString())} /> : null}

          <Bloque icono="hoy" color="blue" titulo="Para hoy" cuenta={v.hoy.length} vacio="Nada pendiente para hoy.">
            {v.hoy.map((t) => <Tarea key={t.id} t={t} alHacer={marcarHecha} />)}
          </Bloque>

          {v.visitas.length ? (
            <Bloque icono="llave" color="teal" titulo="Visitas" cuenta={v.visitas.length}>
              {v.visitas.map((t) => <Tarea key={t.id} t={t} alHacer={marcarHecha} detalle={[t.interesado, t.inmueble ?? t.asunto.nombre].filter(Boolean).join(" · ")} />)}
            </Bloque>
          ) : null}

          <Bloque icono="cal" color="indigo" titulo="Esta semana" cuenta={v.semana.length} vacio="Sin nada con fecha esta semana.">
            {v.semana.map((t) => <Tarea key={t.id} t={t} alHacer={marcarHecha} />)}
          </Bloque>

          <Bloque icono="users" color="orange" titulo="Lo esperas de otros" cuenta={v.otros.length} vacio="Nadie te debe nada esta semana.">
            {v.otros.map((t) => {
              const n = espera(t);
              return (
                <Tarea key={t.id} t={t} alHacer={marcarHecha} detalle={`${t.asunto.nombre} · ${t.para?.nombre ?? cat.etiqueta("quien_tarea", t.quien)}`}
                  pildora={n > 0 ? <span className={`as-pill ${tocaPreguntar(t) ? "as-pill-bad" : "as-pill-warn"}`}>{n === 1 ? "Lleva 1 día" : `Lleva ${n} días`}</span> : undefined}
                  extra={n > 0 || tocaPreguntar(t) ? (
                    <button type="button" className="as-btn as-gho as-ico" title="Recordarle" aria-label={`Recordarle: ${t.titulo}`} onClick={() => setRecordar(t)}>
                      <Icono nombre="chat" tamano={16} />
                    </button>
                  ) : undefined} />
              );
            })}
          </Bloque>

          {v.contactos.length ? (
            <Bloque icono="tel" color="violet" titulo="Volver a llamar" cuenta={v.contactos.length}>
              {v.contactos.map((p) => (
                <div key={p.id} className="db-fila in-fila">
                  <span className="db-quien">
                    <span className="as-av" aria-hidden>{iniciales(p.nombre)}</span>
                    <span className="as-ren-c"><b>{p.nombre}</b><span>{[p.telefono ?? "Sin teléfono", p.nota].filter(Boolean).join(" · ")}</span></span>
                  </span>
                  <span className="db-asuntos"><span className={`as-pill ${p.volver_a_llamar < datos!.hoy ? "as-pill-warn" : "as-pill-acc"}`}>{fechaCorta(p.volver_a_llamar)}</span></span>
                  <span className="db-mas in-acc">
                    {p.telefono ? <a className="as-btn" href={`tel:${p.telefono.replace(/[^\d+]/g, "")}`}><Icono nombre="tel" tamano={16} />Llamar</a> : null}
                    <DropdownMenu>
                      <DropdownMenuTrigger className="as-btn as-gho as-ico" aria-label={`Más de ${p.nombre}`}><Icono nombre="dots" tamano={18} /></DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-60">
                        <DropdownMenuItem onSelect={() => void nuevoAsunto(p)}><Icono nombre="asu" tamano={16} />Nuevo asunto con esta persona</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => void hacer(() => cambiarPersonaDirectorio(p, { volver_a_llamar: sumarDias(7) }), "Llamarle en una semana")}>
                          <Icono nombre="cal" tamano={16} />Llamarle en una semana
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => void hacer(() => cambiarPersonaDirectorio(p, { volver_a_llamar: null }), "Listo: sin llamada pendiente")}>
                          <Icono nombre="ok" tamano={16} />Ya le llamé
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </span>
                </div>
              ))}
            </Bloque>
          ) : null}

          {v.vencen.length ? (
            <Bloque icono="alerta" color="orange" titulo="Por vencer" cuenta={v.vencen.length}>
              {v.vencen.map((d) => {
                const n = diasHasta(d.vence_el);
                return (
                  <Link key={d.id} className="as-ren" href={`/panel/asuntos/${d.asunto_id}?ver=documentos`}>
                    <Cuadro icono="file" color="teal" chico />
                    <span className="as-ren-c"><b>{d.nombre}</b><span>{d.asunto}</span></span>
                    <span className={`as-pill ${n < 0 ? "as-pill-bad" : "as-pill-warn"}`}>{n < 0 ? "Venció" : "Vence"} {fechaCorta(d.vence_el).toLowerCase()}</span>
                    <Icono nombre="ch" tamano={16} />
                  </Link>
                );
              })}
            </Bloque>
          ) : null}

          <Bloque icono="pago" color="green" titulo="Por cobrar" cuenta={v.cobrar.length} vacio="Nada por cobrar.">
            {v.cobrar.map((c) => (
              <Link key={c.asunto_id} className="as-ren" href={`/panel/asuntos/${c.asunto_id}?ver=honorarios`}>
                <span className="as-ren-c"><b>{c.nombre}</b><span>{c.folio}</span></span>
                <span className="as-num in-monto">{(Object.entries(c.falta) as [Moneda, number][]).map(([m, n]) => dinero(n, m)).join(" + ")}</span>
                <Icono nombre="ch" tamano={16} />
              </Link>
            ))}
          </Bloque>
        </>
      ) : null}

      <DialogoMensaje abierto={!!recordar} titulo="Recordarle" para={recordar?.para ?? null}
        inicial={recordar ? `Hola${recordar.para ? ` ${saludo(recordar.para.nombre)}` : ""}, ¿cómo va «${recordar.titulo}»?${recordar.fecha ? ` Quedamos en tenerlo el ${fechaLarga(recordar.fecha).toLowerCase()}.` : ""} Gracias.` : ""}
        alCerrar={() => setRecordar(null)}
        alEnviar={() => { const t = recordar; if (t) void hacer(() => cambiar(t.asunto_id, "tareas", { id: t.id, version: t.version, recordar: true }), "Se le recordó: volver a preguntar en 3 días"); }} />
    </div>
    </div>
  );
}

/** «Para ti»: lo que te mencionaron y las tareas que otra persona te dejó, lo más nuevo arriba. */
function ParaTi({ items, visto, nombreDe, alVer }: { items: ParaTiInicio[]; visto: string; nombreDe: (id: string | null) => string | null; alVer: () => void }) {
  const esNuevo = (x: ParaTiInicio) => !visto || Date.parse(x.cuando) > Date.parse(visto);
  const nuevos = items.filter(esNuevo).length;
  return (
    <section aria-label="Para ti">
      <h2 className="db-h2">
        <Cuadro icono="arroba" color="blue" chico />Para ti<span className="as-m as-num">{nuevos ? `${nuevos} nuevo${nuevos === 1 ? "" : "s"}` : ""}</span>
        <span className="as-sp" />
        {nuevos ? <button type="button" className="as-btn as-gho in-visto" onClick={alVer}><Icono nombre="ok" tamano={16} />Ya lo vi</button> : null}
      </h2>
      <div className="as-card in-card">
        {items.slice(0, 12).map((x) => {
          const nuevo = esNuevo(x);
          const href = x.asunto_id ? `/panel/asuntos/${x.asunto_id}${x.clase === "asignada" ? "?ver=plan" : ""}` : "/panel/asuntos";
          const quien = nombreDe(x.de);
          const contenido = (
            <>
              <Cuadro icono={x.clase === "mencion" ? "nota" : "lista"} color={x.clase === "mencion" ? "violet" : "indigo"} chico />
              <span className="as-ren-c">
                <b className="in-pt-t">{x.texto}</b>
                <span>{[x.clase === "mencion" ? (quien ? `Te mencionó ${quien}` : "Te mencionaron") : (quien ? `Te la dejó ${quien}` : "Te la dejaron"),
                  x.ajeno ? "en un asunto que no llevas" : x.asunto, haceCuanto(x.cuando)].filter(Boolean).join(" · ")}</span>
              </span>
              {x.clase === "asignada" && x.fecha ? <span className={`as-pill ${diasHasta(x.fecha) < 0 ? "as-pill-bad" : ""}`}>{fechaCorta(x.fecha, x.hora)}</span> : null}
              {nuevo ? <span className="in-punto"><span className="pn-solo-lector">Nuevo</span></span> : null}
            </>
          );
          // Una mención en un asunto que no te toca ver se lee aquí, pero no se abre.
          if (x.ajeno) return <div key={x.id} className="as-ren in-pt" data-nuevo={nuevo || undefined}>{contenido}</div>;
          return (
            <Link key={x.id} className="as-ren in-pt" href={href} data-nuevo={nuevo || undefined}>
              {contenido}
              <Icono nombre="ch" tamano={16} />
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function Bloque({ icono, color, titulo, cuenta, vacio, children }: { icono: NombreIcono; color: string; titulo: string; cuenta: number; vacio?: string; children: ReactNode }) {
  return (
    <section aria-label={titulo}>
      <h2 className="db-h2"><Cuadro icono={icono} color={color} chico />{titulo}<span className="as-m as-num">{cuenta || ""}</span></h2>
      <div className="as-card in-card">{cuenta ? children : <p className="as-m in-vacio">{vacio}</p>}</div>
    </section>
  );
}

function Tarea({ t, alHacer, detalle, pildora, extra }: { t: TareaInicio; alHacer: (t: TareaInicio) => void; detalle?: string; pildora?: ReactNode; extra?: ReactNode }) {
  const cat = useCatalogos();
  const n = t.fecha ? diasHasta(t.fecha) : 1;
  return (
    <div className="as-t in-t" data-est="pendiente">
      <button type="button" className="as-ckb" aria-label={`Marcar hecha: ${t.titulo}`} onClick={() => alHacer(t)}><span className="as-ck" /></button>
      <Link className="as-tb in-tb" href={`/panel/asuntos/${t.asunto_id}?ver=${t.clase === "visita" ? "interesados" : "plan"}`}>
        <span className="as-n">{t.titulo}</span>
        <span className="as-m">{detalle ?? (t.quien === "fortius" ? t.asunto.nombre : `${t.asunto.nombre} · ${cat.etiqueta("quien_tarea", t.quien)}`)}</span>
      </Link>
      {extra}
      {pildora ?? <span className={`as-pill ${n < 0 ? "as-pill-bad" : n === 0 ? "as-pill-acc" : ""}`}>{fechaCorta(t.fecha, t.hora)}</span>}
    </div>
  );
}
