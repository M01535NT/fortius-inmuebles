"use client";
import { Dialog as D } from "radix-ui";
import { createContext, useCallback, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";

import { usePreferencia } from "@/components/panel/almacen";
import { Gesto, Icono, type NombreGesto, type NombreIcono } from "@/components/panel/icons";
import { Boton } from "@/components/panel/kit/boton";
import { Campo } from "@/components/panel/kit/campo";
import { CampoFecha } from "@/components/panel/kit/campo-fecha";
import { Desplegable } from "@/components/panel/kit/desplegable";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/panel/ui/dialog";
import { contenedorPanel } from "@/components/panel/ui/contenedor";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/panel/ui/dropdown-menu";

import { Cuadro } from "./pildora";

/**
 * Dónde se abre la ventana (SPEC.md, «Las ventanas»). El panel recuerda la que se eligió: es de cada persona en
 * cada equipo, así que se guarda en el navegador. En el teléfono toda ventana ocupa la pantalla.
 */
const MODOS = [
  { valor: "derecha", etiqueta: "A la derecha", gesto: "ventanaDerecha" },
  { valor: "izquierda", etiqueta: "A la izquierda", gesto: "ventanaIzquierda" },
  { valor: "centro", etiqueta: "Al centro", gesto: "ventanaCentro" },
  { valor: "completa", etiqueta: "Pantalla completa", gesto: "ventanaCompleta" },
] as const satisfies readonly { valor: string; etiqueta: string; gesto: NombreGesto }[];
type Modo = (typeof MODOS)[number]["valor"];
const esModo = (v: string): v is Modo => MODOS.some((m) => m.valor === v);

function useModoVentana() {
  const [guardado, guardar] = usePreferencia("fortius-panel-ventana", "derecha");
  const [antes, guardarAntes] = usePreferencia("fortius-panel-ventana-antes", "derecha");
  const modo: Modo = esModo(guardado) ? guardado : "derecha";
  const elegir = useCallback((m: Modo) => {
    if (m === "completa" && modo !== "completa") guardarAntes(modo);
    guardar(m);
  }, [guardar, guardarAntes, modo]);
  /** A pantalla completa y de vuelta a como estaba. */
  const alternar = useCallback(() => {
    if (modo === "completa") guardar(esModo(antes) && antes !== "completa" ? antes : "derecha");
    else { guardarAntes(modo); guardar("completa"); }
  }, [antes, guardar, guardarAntes, modo]);
  return { modo, elegir, alternar };
}

/** Si la pantalla es de teléfono o tableta (las mismas 900 px de asunto.css). */
const ANGOSTO = "(max-width: 900px)";
export function useAngosto(): boolean {
  return useSyncExternalStore(
    (cb) => { const m = window.matchMedia(ANGOSTO); m.addEventListener("change", cb); return () => m.removeEventListener("change", cb); },
    () => window.matchMedia(ANGOSTO).matches,
    () => false,
  );
}

/** Un paso atrás dentro de la misma ventana (de la ficha de un local a la lista de locales). */
type Regreso = { volver: () => void; a: string };
const CtxRegreso = createContext<((r: Regreso | null) => void) | null>(null);

/**
 * Para lo que va dentro de una ventana y tiene su propio paso atrás: mientras `activo`, la flecha ← de la cabecera
 * corre `volver`. Devuelve si está dentro de una ventana (si no, quien lo usa pinta su propio botón de volver).
 */
export function useRegresoDeVentana(activo: boolean, volver: () => void, a: string): boolean {
  const poner = useContext(CtxRegreso);
  useEffect(() => {
    if (!poner || !activo) return;
    poner({ volver, a });
    return () => poner(null);
  }, [poner, activo, volver, a]);
  return poner !== null;
}

/**
 * La ventana de un apartado o de una ficha: se abre sin salir de donde se estaba. La flecha ← regresa a la ventana
 * anterior (`alRegresar`) y, si no hay, cierra. Un botón elige dónde se abre y otro la pasa a pantalla completa.
 * En el teléfono ocupa la pantalla. Esc o la X la cierran y el foco vuelve a donde estaba.
 */
export function Ventana({ abierta, alCerrar, alRegresar, anterior, titulo, subtitulo, icono, color, opciones, notas, children }: {
  abierta: boolean; alCerrar: () => void; titulo: string; subtitulo: string; icono: NombreIcono; color: string;
  /** Regresa a la ventana anterior, cuando la hay. `anterior` es su nombre, para decirlo en la flecha. */
  alRegresar?: () => void; anterior?: string;
  opciones: readonly { etiqueta: string; icono: NombreIcono; alElegir: () => void; peligro?: boolean }[];
  /**
   * El costado con las notas del asunto (SPEC.md, «Las notas del asunto»). Un botón de la cabecera lo abre y lo cierra;
   * en el teléfono se abre encima de la ventana.
   */
  notas?: { abiertas: boolean; cuantas: number; alCambiar: (abiertas: boolean) => void; contenido: ReactNode };
  children: ReactNode;
}) {
  const { modo, elegir, alternar } = useModoVentana();
  const [interno, setInterno] = useState<Regreso | null>(null);
  const regreso: Regreso | null = interno ?? (alRegresar ? { volver: alRegresar, a: anterior ?? "" } : null);
  const actual = MODOS.find((m) => m.valor === modo) ?? MODOS[0];
  const completa = modo === "completa";
  return (
    <D.Root open={abierta} onOpenChange={(o) => { if (!o) alCerrar(); }}>
      <D.Portal container={contenedorPanel()}>
        <D.Overlay className="as-velo" />
        <D.Content className="as-win" data-modo={modo} data-notas={notas?.abiertas || undefined} aria-describedby={undefined}>
          <div className="as-win-h">
            <button type="button" className="as-btn as-gho as-ico" onClick={regreso ? regreso.volver : alCerrar}
              aria-label={regreso?.a ? `Regresar a ${regreso.a}` : "Regresar"} title={regreso?.a ? `Regresar a ${regreso.a}` : "Regresar"}>
              <Icono nombre="at" tamano={18} />
            </button>
            <Cuadro icono={icono} color={color} />
            <div className="as-win-t">
              <D.Title className="as-win-b">{titulo}</D.Title>
              <p className="as-m as-corta">{subtitulo}</p>
            </div>
            {notas ? (
              <button type="button" className="as-btn as-gho as-win-notas" aria-pressed={notas.abiertas} onClick={() => notas.alCambiar(!notas.abiertas)}
                aria-label={notas.abiertas ? "Ocultar las notas del asunto" : `Ver las notas del asunto${notas.cuantas ? ` (${notas.cuantas})` : ""}`}
                title={notas.abiertas ? "Ocultar notas" : "Notas del asunto"}>
                <Icono nombre="nota" tamano={17} aria-hidden />
                <span className="as-ocultar-tel">Notas</span>
                {notas.cuantas ? <span className="as-win-cuenta" aria-hidden>{notas.cuantas > 99 ? "99+" : notas.cuantas}</span> : null}
              </button>
            ) : null}
            {opciones.length ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="as-btn as-gho as-ico" aria-label="Opciones del apartado"><Icono nombre="dots" tamano={18} /></DropdownMenuTrigger>
                <DropdownMenuContent>
                  {opciones.map((o) => <DropdownMenuItem key={o.etiqueta} peligro={o.peligro} onSelect={o.alElegir}><Icono nombre={o.icono} tamano={16} />{o.etiqueta}</DropdownMenuItem>)}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
            <DropdownMenu>
              <DropdownMenuTrigger className="as-btn as-gho as-ico as-solo-pc" aria-label="Dónde se abre la ventana" title="Dónde se abre la ventana">
                <Gesto nombre={actual.gesto} tamano={18} />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Abrir la ventana</DropdownMenuLabel>
                {MODOS.map((m) => (
                  <DropdownMenuItem key={m.valor} onSelect={() => elegir(m.valor)}>
                    <Gesto nombre={m.gesto} tamano={16} />{m.etiqueta}
                    {m.valor === modo ? <span className="ml-auto"><Icono nombre="ok" tamano={15} /></span> : null}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <button type="button" className="as-btn as-gho as-ico as-solo-pc" aria-pressed={completa} onClick={alternar}
              aria-label="Pantalla completa" title={completa ? "Salir de pantalla completa" : "Pantalla completa"}>
              <Gesto nombre={completa ? "reducir" : "ampliar"} tamano={18} />
            </button>
            <span className="as-win-sep as-solo-pc" aria-hidden />
            <D.Close className="as-btn as-gho as-ico" aria-label="Cerrar"><Icono nombre="x" tamano={18} /></D.Close>
          </div>
          <div className="as-win-cuerpo">
            <div className="as-win-c"><CtxRegreso.Provider value={setInterno}>{children}</CtxRegreso.Provider></div>
            {notas?.abiertas && notas.contenido ? <aside className="as-lat" aria-label="Notas del asunto">{notas.contenido}</aside> : null}
          </div>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}

type PropsDialogo = {
  abierto: boolean; titulo: string; etiqueta: string; inicial?: string; maximo?: number; opcional?: boolean; ayuda?: string;
  fecha?: { etiqueta: string; inicial: string };
  /** Elegir una cosa más (por ejemplo, cómo se ve un apartado). Con dos opciones es interruptor; con más, lista. */
  eleccion?: { etiqueta: string; opciones: readonly { valor: string; etiqueta: string }[] };
  alCerrar: () => void;
  alGuardar: (texto: string, fecha?: string | null, opcion?: string) => unknown;
};

/** Ventanita para escribir una cosa (un nombre, un motivo), con fecha o una elección si hace falta. */
export function DialogoTexto(props: PropsDialogo) {
  const { abierto, titulo, etiqueta, ayuda, alCerrar } = props;
  return (
    <Dialog open={abierto} onOpenChange={(o) => { if (!o) alCerrar(); }}>
      <DialogContent className="max-w-md">
        <DialogTitle>{titulo}</DialogTitle>
        {ayuda ? <DialogDescription>{ayuda}</DialogDescription> : <DialogDescription className="sr-only">{etiqueta}</DialogDescription>}
        {abierto ? <FormaDialogo {...props} /> : null}
      </DialogContent>
    </Dialog>
  );
}

/** Se monta al abrir: así empieza siempre con lo inicial. */
function FormaDialogo({ etiqueta, inicial = "", maximo = 500, opcional, fecha, eleccion, alCerrar, alGuardar }: PropsDialogo) {
  const [texto, setTexto] = useState(inicial);
  const [dia, setDia] = useState(fecha?.inicial ?? "");
  const [opcion, setOpcion] = useState<string>(eleccion?.opciones[0]?.valor ?? "");
  const listo = opcional || texto.trim().length > 0;
  return (
    <form className="as-form" onSubmit={(e) => { e.preventDefault(); if (!listo) return; alCerrar(); void alGuardar(texto.trim(), fecha ? dia || null : undefined, eleccion ? opcion : undefined); }}>
      <Campo etiqueta={`${etiqueta}${opcional ? " (opcional)" : ""}`} value={texto} maxLength={maximo} onChange={(e) => setTexto(e.target.value)} autoFocus />
      {fecha ? <CampoFecha etiqueta={fecha.etiqueta} valor={dia || null} vacio="Sin fecha" alElegir={(f) => setDia(f ?? "")} /> : null}
      {eleccion ? <Desplegable etiqueta={eleccion.etiqueta} opciones={eleccion.opciones} valor={opcion} alElegir={(v) => { if (v) setOpcion(v); }} /> : null}
      <div className="as-fila as-fin">
        <Boton variante="normal" onClick={alCerrar}>Cancelar</Boton>
        <Boton type="submit" variante="primario" deshabilitado={!listo}>Guardar</Boton>
      </div>
    </form>
  );
}
