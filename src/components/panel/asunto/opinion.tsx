"use client";
import { useRef, useState } from "react";

import { useCatalogos } from "@/components/panel/datos/catalogos";
import { Icono } from "@/components/panel/icons";
import { Desplegable } from "@/components/panel/kit/desplegable";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/panel/ui/dropdown-menu";
import {
  agregar, cambiar, cambiarAsunto, fechaCorta, NOMBRE_RESULTADO, RESULTADOS_OPINION, subir, sumarDias, urlArchivo,
  type Asunto, type Quien, type ResultadoOpinion,
} from "@/lib/panel/asuntos/api";

import { DialogoMensaje, personaPara, primerNombre, type Hacer } from "./comun";
import { Pildora } from "./pildora";

export function resumenOpinion(a: Asunto): string {
  const o = a.opinion;
  if (!o?.resultado) return o?.puntos.length ? `Sin emitir · ${o.puntos.length} por resolver` : "Sin emitir";
  const pend = o.puntos.filter((p) => !p.tarea_id).length;
  return [NOMBRE_RESULTADO[o.resultado], o.emitida_el ? fechaCorta(o.emitida_el.slice(0, 10)).toLowerCase() : "", o.puntos.length ? `${o.puntos.length} por resolver` : "", pend ? `${pend} sin pasar al plan` : ""]
    .filter(Boolean).join(" · ");
}

/** Opinión jurídica (boceto): resultado, análisis, qué hay que resolver y quién, el documento y las salidas si no es factible. */
export function OpinionJuridica({ a, hacer, irA }: { a: Asunto; hacer: Hacer; irA: (clave: string, foco?: string) => void }) {
  const cat = useCatalogos();
  const o = a.opinion;
  const [analisis, setAnalisis] = useState(o?.analisis ?? "");
  const [nuevo, setNuevo] = useState("");
  const [quien, setQuien] = useState<Quien>("fortius");
  const [mensaje, setMensaje] = useState(false);
  const archivo = useRef<HTMLInputElement>(null);
  const guardar = (c: { resultado?: ResultadoOpinion | null; analisis?: string }, aviso?: string) =>
    hacer(() => (o ? cambiar(a.id, "opinion", { id: o.id, version: o.version, ...c }) : agregar(a.id, "opinion", c)), aviso);
  const doc = o?.documento_id ? a.documentos.find((d) => d.id === o.documento_id) : null;
  const sinPasar = o?.puntos.filter((p) => !p.tarea_id).length ?? 0;
  const cliente = personaPara(a, "cliente");

  return (
    <div className="as-form">
      <div className="as-card as-pad as-form">
        <Desplegable etiqueta="Resultado" valor={o?.resultado ?? ""} vacio="Sin emitir"
          opciones={RESULTADOS_OPINION.map((r) => ({ valor: r, etiqueta: NOMBRE_RESULTADO[r] }))}
          alElegir={(v) => void guardar({ resultado: v || null }, v ? `Opinión emitida: ${NOMBRE_RESULTADO[v].toLowerCase()}` : "Sin emitir")} />
        {o?.emitida_el ? <p className="as-m">Emitida {fechaCorta(o.emitida_el.slice(0, 10)).toLowerCase()}</p> : null}
        <label className="pn-campo">Análisis
          <textarea className="as-inp as-inp-borde as-area" rows={5} value={analisis} maxLength={20000} onChange={(e) => setAnalisis(e.target.value)}
            onBlur={() => { if (analisis !== (o?.analisis ?? "")) void guardar({ analisis }, "Análisis guardado"); }}
            placeholder="Qué encontraste al estudiar los documentos" />
        </label>
      </div>

      {o?.resultado === "no_factible" ? (
        <div className="as-ban as-ban-esp" role="status">
          <Icono nombre="alerta" tamano={16} />
          <span>No es factible. ¿Qué sigue?</span>
          <span className="as-sp" />
          <DropdownMenu>
            <DropdownMenuTrigger className="as-btn">Elegir<Icono nombre="down" tamano={14} /></DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-56">
              <DropdownMenuItem onSelect={() => irA("honorarios", "cobrar-estudio")}><Icono nombre="pago" tamano={16} />Cobrar el estudio</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => void hacer(() => cambiarAsunto(a, { en_que_va: "cerrado", resultado: "no_se_dio", motivo_cierre: "La opinión jurídica salió no factible." }), "Asunto cerrado: no se dio")}>
                <Icono nombre="x" tamano={16} />Cerrar el asunto
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => void hacer(() => cambiarAsunto(a, { en_espera: true, espera_motivo: "Opinión no factible: revisar más adelante.", espera_hasta: sumarDias(30) }), "En espera un mes")}>
                <Icono nombre="reloj" tamano={16} />Dejar en espera un mes
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : null}

      <p className="as-sub as-sub-fila"><span><Icono nombre="lista" tamano={15} /> Qué hay que resolver</span><span className="as-m">{o?.puntos.length || ""}</span></p>
      <div className="as-card">
        {o?.puntos.map((p) => (
          <div key={p.id} className="as-ren">
            <span className="as-ren-c"><b>{p.texto}</b>{p.tarea_id ? <span>Ya está en el plan</span> : null}</span>
            <Pildora etiqueta="Quién lo hace" icono="users" valor={p.quien} opciones={cat.opciones("quien_tarea", p.quien)}
              alElegir={(v) => { if (v !== p.quien) void hacer(() => cambiar(a.id, "opinion_puntos", { id: p.id, version: p.version, quien: v })); }} />
            <button type="button" className="as-btn as-gho as-ico" aria-label={`Quitar: ${p.texto}`}
              onClick={() => void hacer(() => cambiar(a.id, "opinion_puntos", { id: p.id, version: p.version, quitar: true }), "Quitado")}>
              <Icono nombre="x" tamano={15} />
            </button>
          </div>
        ))}
        <form className="as-pad as-fila as-nw" onSubmit={(e) => {
          e.preventDefault();
          const t = nuevo.trim();
          if (!t) return;
          setNuevo("");
          void hacer(() => agregar(a.id, "opinion_puntos", { texto: t, quien }));
        }}>
          <input className="as-inp as-inp-borde as-crece" value={nuevo} maxLength={500} onChange={(e) => setNuevo(e.target.value)}
            placeholder="Juicio, regularización, pago de adeudos…" aria-label="Qué hay que resolver" />
          <Pildora etiqueta="Quién lo hace" icono="users" valor={quien} opciones={cat.opciones("quien_tarea", quien)} alElegir={setQuien} />
        </form>
      </div>
      {o && sinPasar ? (
        <button type="button" className="as-btn" onClick={() => void hacer(() => cambiar(a.id, "opinion", { id: o.id, version: o.version, pasar_al_plan: true }), `${sinPasar} al plan`)}>
          <Icono nombre="lista" tamano={16} />Pasar {sinPasar === 1 ? "lo que hay que resolver" : `los ${sinPasar}`} al plan
        </button>
      ) : null}

      <input ref={archivo} type="file" hidden accept="application/pdf" aria-label="Cargar la opinión en PDF" onChange={(e) => {
        const f = [...(e.target.files ?? [])]; e.target.value = ""; if (f.length) void hacer(() => subir(a.id, "opinion", f), "Opinión cargada");
      }} />
      <div className="as-card">
        <div className="as-ren">
          <Icono nombre="pdf" tamano={18} />
          <span className="as-ren-c"><b>Documento de la opinión</b><span>{doc?.archivos[0]?.nombre ?? "Carga el PDF de la opinión. Hacerlo aquí con lo capturado llega con los formatos."}</span></span>
          <DropdownMenu>
            <DropdownMenuTrigger className="as-btn">{doc ? "Cambiar" : "Cargar"}<Icono nombre="down" tamano={14} /></DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-60">
              {doc?.archivos[0] ? <DropdownMenuItem asChild><a href={urlArchivo(a.id, doc.archivos[0].id)} target="_blank" rel="noopener noreferrer"><Icono nombre="ojo" tamano={16} />Ver</a></DropdownMenuItem> : null}
              <DropdownMenuItem onSelect={() => archivo.current?.click()}><Icono nombre="subir" tamano={16} />Cargar un PDF hecho por fuera</DropdownMenuItem>
              {o?.resultado ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Avisarle</DropdownMenuLabel>
                  <DropdownMenuItem onSelect={() => setMensaje(true)}><Icono nombre="chat" tamano={16} />Enviar por WhatsApp</DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <DialogoMensaje abierto={mensaje} titulo="Avisar la opinión" para={cliente} alCerrar={() => setMensaje(false)}
        inicial={`Hola${cliente ? ` ${primerNombre(cliente.nombre)}` : ""}, ya terminamos de revisar los documentos de ${a.nombre}. La opinión jurídica es: ${o?.resultado ? NOMBRE_RESULTADO[o.resultado].toLowerCase() : ""}. Le explico los detalles cuando guste.`} />
    </div>
  );
}
