"use client";
import "../asunto/asunto.css";
import "./biblioteca.css";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

import { Icono } from "@/components/panel/icons";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Desplegable, DesplegableFecha } from "@/components/panel/kit/desplegable";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/panel/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/panel/ui/dropdown-menu";
import { fechaCorta, ICONO_ENCARGO, iniciales, NOMBRE_PAPEL, sumarDias, type Papel } from "@/lib/panel/asuntos/api";
import { cambiarPersonaDirectorio, leerDirectorio, unirFichas, type PersonaDirectorio } from "@/lib/panel/biblioteca";
import { empezarConsulta } from "@/lib/panel/consulta/api";
import { useSession } from "@/lib/panel/legado/sesion";

import { Cuadro } from "../asunto/pildora";

type Filtro = "" | "con" | "sin" | "llamar";
const FILTROS: { valor: Exclude<Filtro, "">; etiqueta: string }[] = [
  { valor: "con", etiqueta: "Con asunto" }, { valor: "sin", etiqueta: "Contactos sin asunto" }, { valor: "llamar", etiqueta: "Por llamar" },
];
const hoy = () => sumarDias(0);
const sinAcentos = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const digitos = (p: PersonaDirectorio) => p.telefonos.map((t) => `${t.pais}${t.numero}`.replace(/\D/g, ""));
const telefono = (p: PersonaDirectorio) => (p.telefonos[0] ? `${p.telefonos[0].pais} ${p.telefonos[0].numero}` : "");
const papel = (x: string) => NOMBRE_PAPEL[x as Papel] ?? x;

function pasa(p: PersonaDirectorio, f: Filtro) {
  if (f === "con") return p.asuntos.length > 0;
  if (f === "sin") return p.asuntos.length === 0;
  if (f === "llamar") return !!p.volver_a_llamar && p.volver_a_llamar <= hoy() && !p.no_contactar && !p.fallecida;
  return true;
}

function coincide(p: PersonaDirectorio, q: string) {
  if (!q) return true;
  const n = q.replace(/\D/g, "");
  if (n.length >= 3 && digitos(p).some((d) => d.includes(n))) return true;
  const t = sinAcentos(q);
  return sinAcentos(`${p.nombre} ${p.correo ?? ""} ${p.nota}`).includes(t) || p.asuntos.some((a) => sinAcentos(`${a.nombre} ${a.folio}`).includes(t));
}

/** Desde el buscador llega con ?q=<nombre>: el Directorio abre ya filtrado. */
function LeerBusqueda({ alLeer }: { alLeer: (q: string) => void }) {
  const q = useSearchParams().get("q");
  useEffect(() => { if (q) alLeer(q); }, [q, alLeer]);
  return null;
}

/**
 * Directorio (boceto aprobado): cada persona una sola vez, con todos sus asuntos. Quien no tiene asunto es un contacto
 * con su «llamarle». Desde aquí se abre un asunto nuevo con la persona sin volver a capturarla.
 */
export function Directorio() {
  const { avisar } = useAvisos();
  const router = useRouter();
  const director = useSession()?.role === "admin";
  const [todas, setTodas] = useState<PersonaDirectorio[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("");
  const [llamar, setLlamar] = useState<PersonaDirectorio | null>(null);
  const [unir, setUnir] = useState<PersonaDirectorio | null>(null);

  const cargar = useCallback(() => leerDirectorio().then((x) => { setTodas(x); setError(null); }, (e: unknown) => setError(e instanceof Error ? e.message : "No se pudo cargar.")), []);
  useEffect(() => { void cargar(); }, [cargar]);
  const ver = useMemo(() => (todas ?? []).filter((p) => pasa(p, filtro) && coincide(p, q.trim())), [todas, filtro, q]);

  const hacer = async (accion: () => Promise<unknown>, aviso: string) => {
    try { await accion(); avisar(aviso); await cargar(); }
    catch (e) { avisar(e instanceof Error ? e.message : "No se pudo terminar."); await cargar(); }
  };
  const nuevoAsunto = async (p: PersonaDirectorio) => {
    try {
      const c = await empezarConsulta({ persona_id: p.id });
      router.push(`/panel/consulta?id=${c.id}`);
    } catch (e) { avisar(e instanceof Error ? e.message : "No se pudo empezar la consulta."); }
  };
  const copiar = (t: string) => { void navigator.clipboard?.writeText(t).then(() => avisar("Teléfono copiado"), () => avisar(t)); };

  return (
    <div className="db-pagina">
      <Suspense fallback={null}><LeerBusqueda alLeer={setQ} /></Suspense>
      <div className="db-top">
        <h1>Directorio</h1>
        <span className="as-m as-num">{todas ? todas.length : ""}</span>
        <span className="as-sp" />
        <div className="db-filtro"><Desplegable etiqueta="Qué ver" valor={filtro} vacio="Todos" opciones={FILTROS} alElegir={setFiltro} /></div>
        <label className="as-buscar">
          <Icono nombre="bus" tamano={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nombre o teléfono" aria-label="Buscar por nombre o teléfono" type="search" />
        </label>
      </div>

      {error ? <div className="as-vacio"><Icono nombre="alerta" tamano={24} /><b>{error}</b><button type="button" className="as-btn" onClick={() => void cargar()}>Reintentar</button></div> : null}
      {!todas && !error ? <div className="as-cargando" aria-label="Cargando"><span /><span /><span /></div> : null}
      {todas && !todas.length ? (
        <div className="as-vacio">
          <Icono nombre="users" tamano={26} /><b>Todavía no hay nadie</b>
          <span className="as-m">Las personas llegan de cada consulta y de cada asunto.</span>
        </div>
      ) : null}

      {todas?.length ? (
        <div className="as-card" role="list" aria-label="Personas">
          {ver.length ? ver.map((p) => {
            const tel = telefono(p);
            const d = digitos(p)[0] ?? "";
            const puedeHablar = !!d && !p.fallecida && !p.no_contactar;
            const contacto = p.asuntos.length === 0;
            return (
              <div key={p.id} role="listitem" className="db-fila">
                <span className="db-quien">
                  <span className="as-av" aria-hidden>{p.clase === "persona" ? iniciales(p.nombre) : <Icono nombre="edif" tamano={15} />}</span>
                  <span className="as-ren-c">
                    <b>{p.nombre}</b>
                    <span>{[p.fallecida ? "Falleció" : tel || "Sin teléfono", p.nota].filter(Boolean).join(" · ")}</span>
                  </span>
                </span>
                <span className="db-asuntos">
                  {p.es_ejemplo ? <span className="as-pill">Ejemplo</span> : null}
                  {p.no_contactar ? <span className="as-pill">No contactar</span> : null}
                  {contacto ? (
                    <span className={`as-pill ${p.volver_a_llamar && p.volver_a_llamar <= hoy() ? "as-pill-warn" : ""}`}>
                      Sin asunto{p.volver_a_llamar ? ` · llamarle ${fechaCorta(p.volver_a_llamar).toLowerCase()}` : ""}
                    </span>
                  ) : null}
                  {p.asuntos.map((a) => {
                    const [icono, color] = a.encargos[0] ? ICONO_ENCARGO[a.encargos[0]] : (["asu", "gray"] as const);
                    return (
                      <Link key={a.id} className="db-chip" href={`/panel/asuntos/${a.id}?ver=personas`} data-cerrado={a.cerrado || undefined}
                        title={`${a.papeles.map(papel).join(", ")} en ${a.nombre}${a.cerrado ? " (cerrado)" : ""}`}>
                        <Cuadro icono={icono} color={color} chico /><span>{a.nombre}</span>
                      </Link>
                    );
                  })}
                </span>
                <span className="db-mas">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="as-btn as-gho as-ico" aria-label={`Más de ${p.nombre}`}><Icono nombre="dots" tamano={18} /></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-60">
                      <DropdownMenuItem onSelect={() => void nuevoAsunto(p)}><Icono nombre="asu" tamano={16} />Nuevo asunto con esta persona</DropdownMenuItem>
                      {puedeHablar ? (
                        <>
                          <DropdownMenuItem asChild><a href={`tel:+${d}`}><Icono nombre="tel" tamano={16} />Llamar</a></DropdownMenuItem>
                          <DropdownMenuItem asChild><a href={`https://wa.me/${d}`} target="_blank" rel="noopener noreferrer"><Icono nombre="chat" tamano={16} />WhatsApp</a></DropdownMenuItem>
                        </>
                      ) : null}
                      {tel ? <DropdownMenuItem onSelect={() => copiar(tel)}><Icono nombre="copia" tamano={16} />Copiar teléfono</DropdownMenuItem> : null}
                      <DropdownMenuSeparator />
                      {!p.fallecida ? (
                        <DropdownMenuItem onSelect={() => setLlamar(p)}>
                          <Icono nombre="reloj" tamano={16} />{p.volver_a_llamar ? `Llamarle: ${fechaCorta(p.volver_a_llamar).toLowerCase()}` : "Recordarme llamarle"}
                        </DropdownMenuItem>
                      ) : null}
                      <DropdownMenuItem onSelect={() => void hacer(() => cambiarPersonaDirectorio(p, { no_contactar: !p.no_contactar }), p.no_contactar ? "Se puede volver a contactar" : "Marcada: no contactar")}>
                        <Icono nombre={p.no_contactar ? "ok" : "x"} tamano={16} />{p.no_contactar ? "Se puede contactar" : "No contactar"}
                      </DropdownMenuItem>
                      {director ? (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Solo el director</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={() => setUnir(p)}><Icono nombre="liga" tamano={16} />Unir con otra ficha…</DropdownMenuItem>
                        </>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </span>
              </div>
            );
          }) : <p className="as-pad as-m">Nadie coincide.</p>}
        </div>
      ) : null}

      <DialogoLlamar p={llamar} alCerrar={() => setLlamar(null)} alGuardar={(p, fecha) => void hacer(() => cambiarPersonaDirectorio(p, { volver_a_llamar: fecha }),
        fecha ? `Te lo recuerdo ${fechaCorta(fecha).toLowerCase()}` : "Sin recordatorio")} />
      <DialogoUnir p={unir} todas={todas ?? []} alCerrar={() => setUnir(null)} alUnir={(origen, destino) => void hacer(() => unirFichas(origen.id, destino.id),
        `Fichas unidas: queda ${destino.nombre}`)} />
    </div>
  );
}

function DialogoLlamar({ p, alCerrar, alGuardar }: { p: PersonaDirectorio | null; alCerrar: () => void; alGuardar: (p: PersonaDirectorio, fecha: string | null) => void }) {
  const [fecha, setFecha] = useState<string | null>(null);
  const [previa, setPrevia] = useState<PersonaDirectorio | null>(null);
  if (p !== previa) { setPrevia(p); setFecha(p?.volver_a_llamar ?? sumarDias(7)); }
  return (
    <Dialog open={!!p} onOpenChange={(o) => { if (!o) alCerrar(); }}>
      <DialogContent className="max-w-md">
        <DialogTitle>Volver a llamar</DialogTitle>
        <DialogDescription>{p?.nombre}. Queda en el Directorio como «Por llamar» ese día.</DialogDescription>
        {p ? (
          <form className="as-form" onSubmit={(e) => { e.preventDefault(); alCerrar(); alGuardar(p, fecha); }}>
            <DesplegableFecha etiqueta="Cuándo" valor={fecha} alElegir={setFecha} hoy={new Date()} sinFecha="Ya no" />
            <div className="as-fila as-fin">
              <button type="button" className="as-btn" onClick={alCerrar}>Cancelar</button>
              <button type="submit" className="as-btn as-pri">Guardar</button>
            </div>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/** Dos fichas de la misma persona: se elige la que se queda; la otra pasa a Eliminados con todo lo suyo en la que queda. */
function DialogoUnir({ p, todas, alCerrar, alUnir }: {
  p: PersonaDirectorio | null; todas: PersonaDirectorio[]; alCerrar: () => void; alUnir: (origen: PersonaDirectorio, destino: PersonaDirectorio) => void;
}) {
  const [q, setQ] = useState("");
  const [con, setCon] = useState<string | null>(null);
  const [previa, setPrevia] = useState<PersonaDirectorio | null>(null);
  if (p !== previa) { setPrevia(p); setQ(p ? p.nombre.split(" ")[0] : ""); setCon(null); }
  const opciones = p ? todas.filter((x) => x.id !== p.id && coincide(x, q.trim())).slice(0, 8) : [];
  const destino = todas.find((x) => x.id === con) ?? null;
  return (
    <Dialog open={!!p} onOpenChange={(o) => { if (!o) alCerrar(); }}>
      <DialogContent className="max-w-lg">
        <DialogTitle>Unir con otra ficha</DialogTitle>
        <DialogDescription>Elige la ficha que se queda. Sus asuntos, tareas, documentos y datos pasan a ella, y la de {p?.nombre} va a Eliminados.</DialogDescription>
        {p ? (
          <div className="as-form">
            <label className="as-buscar">
              <Icono nombre="bus" tamano={16} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nombre o teléfono" aria-label="Buscar la ficha que se queda" type="search" autoFocus />
            </label>
            <div className="as-card" role="radiogroup" aria-label="La ficha que se queda">
              {opciones.length ? opciones.map((x) => (
                <button key={x.id} type="button" role="radio" aria-checked={con === x.id} className="as-ren" onClick={() => setCon(x.id)}>
                  <span className="as-av" aria-hidden>{con === x.id ? <Icono nombre="ok" tamano={15} /> : iniciales(x.nombre)}</span>
                  <span className="as-ren-c"><b>{x.nombre}</b><span>{[telefono(x) || "Sin teléfono", x.asuntos.length ? `${x.asuntos.length} asunto${x.asuntos.length > 1 ? "s" : ""}` : "Sin asunto"].join(" · ")}</span></span>
                </button>
              )) : <p className="as-pad as-m">Nadie coincide.</p>}
            </div>
            <div className="as-fila as-fin">
              <button type="button" className="as-btn" onClick={alCerrar}>Cancelar</button>
              <button type="button" className="as-btn as-pri" aria-disabled={!destino} onClick={() => { if (!destino) return; alCerrar(); alUnir(p, destino); }}>
                {destino ? `Dejar la de ${destino.nombre}` : "Elige una ficha"}
              </button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
