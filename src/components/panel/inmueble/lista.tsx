"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useState } from "react";

import { Icono } from "@/components/panel/icons";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Desplegable } from "@/components/panel/kit/desplegable";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/panel/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/panel/ui/dropdown-menu";
import {
  leerInmuebles, NOMBRE_OPERACION, NOMBRE_TIPO, nuevoInmueble, OPERACIONES, precioTexto, publicarVarios, TIPOS_INMUEBLE,
  type FilaInmueble, type Operacion, type TipoInmueble,
} from "@/lib/panel/inmuebles/api";

import { Cuadro } from "../asunto/pildora";
import { Ventana } from "../asunto/ventana";
import { FichaInmueble } from "./ficha";

type Filtro = "" | "pub" | "no" | "venta" | "renta";
const FILTROS: { valor: Exclude<Filtro, "">; etiqueta: string }[] = [
  { valor: "pub", etiqueta: "Publicados" }, { valor: "no", etiqueta: "Sin publicar" }, { valor: "venta", etiqueta: "En venta" }, { valor: "renta", etiqueta: "En renta" },
];
const pasa = (i: FilaInmueble, f: Filtro) => f === "" || (f === "pub" ? i.publicado : f === "no" ? !i.publicado : i.operacion === f);

/**
 * Inmuebles (boceto aprobado): todos los que ve quien entró, con su portada, lo que trae (fotos, video, 360) y si está
 * publicado. Se eligen varios para publicarlos, retirarlos o compartirlos de una vez. Cada uno abre su ficha a un lado.
 */
export function ListaInmuebles() {
  const { avisar } = useAvisos();
  const router = useRouter();
  const params = useSearchParams();
  const abierto = params.get("id");
  const [todos, setTodos] = useState<FilaInmueble[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("");
  const [elegidos, setElegidos] = useState<Set<string>>(new Set());
  // Desde el buscador, «Inmueble nuevo» llega con ?nuevo=1 y abre el alta.
  const [nuevo, setNuevo] = useState(() => params.get("nuevo") === "1");

  const cargar = useCallback(() => leerInmuebles().then((x) => { setTodos(x); setError(null); }, (e: unknown) => setError(e instanceof Error ? e.message : "No se pudo cargar.")), []);
  useEffect(() => { void cargar(); }, [cargar]);

  const abrir = (id: string | null) => router.replace(id ? `/panel/inmuebles?id=${id}` : "/panel/inmuebles", { scroll: false });
  const ver = useMemo(() => (todos ?? []).filter((i) => pasa(i, filtro)), [todos, filtro]);
  const sel = (todos ?? []).filter((i) => elegidos.has(i.id));
  const actual = todos?.find((i) => i.id === abierto) ?? null;

  const lote = async (publicar: boolean) => {
    try {
      const n = await publicarVarios(sel.map((i) => i.id), publicar);
      avisar(publicar ? `${n} publicado${n > 1 ? "s" : ""}` : `${n} retirado${n > 1 ? "s" : ""} del sitio`);
      setElegidos(new Set());
      void cargar();
    } catch (e) { avisar(e instanceof Error ? e.message : "No se pudo terminar."); }
  };
  const compartir = () => {
    const t = sel.map((i) => `${i.nombre}${i.colonia ? ` · ${i.colonia}` : ""} · ${precioTexto(i.precio, i.moneda, i.operacion)}`).join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(t)}`, "_blank", "noopener");
  };

  return (
    <div className="in-pagina">
      <div className="in-top">
        <h1>Inmuebles</h1>
        <span className="as-m as-num">{todos ? todos.length : ""}</span>
        <span className="as-sp" />
        <div className="in-filtro">
          <Desplegable etiqueta="Qué ver" valor={filtro} vacio="Todos" opciones={FILTROS} alElegir={(v) => setFiltro(v)} />
        </div>
        <button type="button" className="as-btn as-pri" onClick={() => setNuevo(true)}><Icono nombre="mas" tamano={16} />Nuevo</button>
      </div>

      {sel.length ? (
        <div className="in-ban" role="status">
          <span>{sel.length} elegido{sel.length > 1 ? "s" : ""}</span>
          <span className="as-sp" />
          <button type="button" className="as-btn" onClick={() => setElegidos(new Set())}>Quitar selección</button>
          <DropdownMenu>
            <DropdownMenuTrigger className="as-btn as-pri">Hacer con ellos<Icono nombre="down" tamano={14} /></DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => void lote(true)}><Icono nombre="globo" tamano={16} />Publicar</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => void lote(false)}><Icono nombre="x" tamano={16} />Retirar del sitio</DropdownMenuItem>
              <DropdownMenuItem onSelect={compartir}><Icono nombre="chat" tamano={16} />Compartir por WhatsApp</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : null}

      {error ? <div className="as-vacio"><Icono nombre="alerta" tamano={24} /><b>{error}</b><button type="button" className="as-btn" onClick={() => void cargar()}>Reintentar</button></div> : null}
      {!todos && !error ? <div className="as-cargando" aria-label="Cargando"><span /><span /><span /></div> : null}
      {todos && !todos.length ? (
        <div className="as-vacio">
          <Icono nombre="edif" tamano={26} /><b>Todavía no hay inmuebles</b>
          <span className="as-m">Nacen de una consulta o con «Nuevo», cada uno con su asunto.</span>
          <button type="button" className="as-btn as-pri" onClick={() => setNuevo(true)}><Icono nombre="mas" tamano={16} />Nuevo inmueble</button>
        </div>
      ) : null}

      {todos?.length ? (
        <div className="as-card" role="list" aria-label="Inmuebles">
          {ver.length ? ver.map((i) => {
            const elegido = elegidos.has(i.id);
            return (
              <div key={i.id} role="listitem" className="in-fila">
                <button type="button" className="as-ckb" role="checkbox" aria-checked={elegido} aria-label={`Elegir ${i.nombre}`}
                  onClick={() => setElegidos((s) => { const n = new Set(s); if (n.has(i.id)) n.delete(i.id); else n.add(i.id); return n; })}>
                  <span className="as-ck as-ck-cu" style={elegido ? { background: "var(--accent)", borderColor: "var(--accent)", color: "var(--accent-ink)" } : undefined}>
                    {elegido ? <Icono nombre="ok" tamano={12} /> : null}
                  </span>
                </button>
                <button type="button" className="in-abrir" aria-current={i.id === abierto || undefined} onClick={() => abrir(i.id)}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- miniatura ya optimizada al subir */}
                  {i.portada ? <img className="in-mini" src={i.portada} alt="" loading="lazy" /> : <span className="in-hueco"><Cuadro icono="edif" color="orange" /></span>}
                  <span className="as-ren-c">
                    <b>{i.nombre}</b>
                    <span>{[i.tipo ? NOMBRE_TIPO[i.tipo] : null, i.colonia, precioTexto(i.precio, i.moneda, i.operacion)].filter(Boolean).join(" · ")}</span>
                  </span>
                  <span className="in-medios" aria-label={[i.fotos ? `${i.fotos} fotos` : "", i.video ? "video" : "", i.recorrido ? "recorrido 360" : ""].filter(Boolean).join(", ") || undefined}>
                    {i.fotos ? <Icono nombre="img" tamano={15} /> : null}{i.video ? <Icono nombre="video" tamano={15} /> : null}{i.recorrido ? <Icono nombre="r360" tamano={15} /> : null}
                  </span>
                  {i.es_ejemplo ? <span className="as-pill in-ocultar">Ejemplo</span> : null}
                  <span className={`as-pill ${i.publicado ? "as-pill-ok" : ""}`}>{i.publicado ? "Publicado" : "Sin publicar"}</span>
                  <Icono nombre="ch" tamano={16} />
                </button>
              </div>
            );
          }) : <p className="as-pad as-m">Ningún inmueble coincide.</p>}
        </div>
      ) : null}
      <p className="as-m">Aquí se carga todo lo que sale en el sitio: ficha técnica, fotos, video, recorrido 360, planos y ubicación.</p>

      <Ventana abierta={Boolean(abierto)} alCerrar={() => abrir(null)} titulo={actual?.nombre ?? "Inmueble"} subtitulo={actual ? [actual.folio, actual.asunto && actual.asunto.nombre !== actual.nombre ? actual.asunto.nombre : actual.asunto?.folio].filter(Boolean).join(" · ") : ""}
        icono="edif" color="orange"
        opciones={actual?.asunto ? [{ etiqueta: "Ir a su asunto", icono: "asu", alElegir: () => router.push(`/panel/asuntos/${actual.asunto!.id}`) }] : []}>
        {abierto ? <FichaInmueble key={abierto} id={abierto} alCambiar={() => void cargar()} /> : null}
      </Ventana>
      <DialogoNuevo abierto={nuevo} alCerrar={() => { setNuevo(false); if (params.get("nuevo")) router.replace("/panel/inmuebles", { scroll: false }); }} alCrear={async (d) => {
        try {
          const x = await nuevoInmueble(d);
          avisar(`Inmueble ${x.folio} creado con su asunto de captación`);
          await cargar();
          abrir(x.id);
        } catch (e) { avisar(e instanceof Error ? e.message : "No se creó."); }
      }} />
    </div>
  );
}

function DialogoNuevo({ abierto, alCerrar, alCrear }: { abierto: boolean; alCerrar: () => void; alCrear: (d: { nombre: string; tipo?: TipoInmueble; operacion?: Operacion; propietario?: string }) => void }) {
  return (
    <Dialog open={abierto} onOpenChange={(o) => { if (!o) alCerrar(); }}>
      <DialogContent className="max-w-md">
        <DialogTitle>Nuevo inmueble</DialogTitle>
        <DialogDescription>Nace con su asunto de captación. Fotos, datos y documentos van después.</DialogDescription>
        {abierto ? <FormaNuevo alCerrar={alCerrar} alCrear={alCrear} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function FormaNuevo({ alCerrar, alCrear }: { alCerrar: () => void; alCrear: (d: { nombre: string; tipo?: TipoInmueble; operacion?: Operacion; propietario?: string }) => void }) {
  const id = useId();
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<TipoInmueble | "">("");
  const [operacion, setOperacion] = useState<Operacion | "">("");
  const [dueno, setDueno] = useState("");
  const listo = nombre.trim().length > 0;
  return (
    <form className="as-form" onSubmit={(e) => {
      e.preventDefault();
      if (!listo) return;
      alCerrar();
      alCrear({ nombre: nombre.trim(), tipo: tipo || undefined, operacion: operacion || undefined, propietario: dueno.trim() || undefined });
    }}>
      <label className="pn-campo" htmlFor={`${id}-n`}>Nombre
        <input id={`${id}-n`} className="as-inp as-inp-borde" maxLength={160} placeholder="Casa en Playas, Nave en El Florido…" value={nombre} autoFocus onChange={(e) => setNombre(e.target.value)} />
      </label>
      <Desplegable etiqueta="Tipo" valor={tipo} vacio="Elegir" opciones={TIPOS_INMUEBLE.map((t) => ({ valor: t, etiqueta: NOMBRE_TIPO[t] }))} alElegir={setTipo} />
      <Desplegable etiqueta="Operación" valor={operacion} vacio="Elegir" opciones={OPERACIONES.map((o) => ({ valor: o, etiqueta: NOMBRE_OPERACION[o] }))} alElegir={setOperacion} />
      <label className="pn-campo" htmlFor={`${id}-d`}>Propietario (opcional)
        <input id={`${id}-d`} className="as-inp as-inp-borde" maxLength={160} placeholder="Nombre del dueño" value={dueno} onChange={(e) => setDueno(e.target.value)} />
      </label>
      <div className="as-fila as-fin">
        <button type="button" className="as-btn" onClick={alCerrar}>Cancelar</button>
        <button type="submit" className="as-btn as-pri" aria-disabled={!listo}>Crear</button>
      </div>
    </form>
  );
}
