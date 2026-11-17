"use client";
import { Dialog as D } from "radix-ui";
import { useId, useState, type ReactNode } from "react";

import { Icono, type NombreIcono } from "@/components/panel/icons";
import { Desplegable } from "@/components/panel/kit/desplegable";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/panel/ui/dialog";
import { contenedorPanel } from "@/components/panel/ui/contenedor";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/panel/ui/dropdown-menu";

import { Cuadro } from "./pildora";

/**
 * La ventana de un apartado (boceto): se abre a un lado, sin salir del asunto. En el teléfono ocupa la pantalla.
 * Esc o la X la cierran y el foco vuelve a donde estaba.
 */
export function Ventana({ abierta, alCerrar, titulo, subtitulo, icono, color, opciones, children }: {
  abierta: boolean; alCerrar: () => void; titulo: string; subtitulo: string; icono: NombreIcono; color: string;
  opciones: readonly { etiqueta: string; icono: NombreIcono; alElegir: () => void; peligro?: boolean }[];
  children: ReactNode;
}) {
  return (
    <D.Root open={abierta} onOpenChange={(o) => { if (!o) alCerrar(); }}>
      <D.Portal container={contenedorPanel()}>
        <D.Overlay className="as-velo" />
        <D.Content className="as-win" aria-describedby={undefined}>
          <div className="as-win-h">
            <Cuadro icono={icono} color={color} />
            <div className="as-win-t">
              <D.Title className="as-win-b">{titulo}</D.Title>
              <p className="as-m as-corta">{subtitulo}</p>
            </div>
            {opciones.length ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="as-btn as-gho as-ico" aria-label="Opciones del apartado"><Icono nombre="dots" tamano={18} /></DropdownMenuTrigger>
                <DropdownMenuContent>
                  {opciones.map((o) => <DropdownMenuItem key={o.etiqueta} peligro={o.peligro} onSelect={o.alElegir}><Icono nombre={o.icono} tamano={16} />{o.etiqueta}</DropdownMenuItem>)}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
            <D.Close className="as-btn as-gho as-ico" aria-label="Cerrar"><Icono nombre="x" tamano={18} /></D.Close>
          </div>
          <div className="as-win-c">{children}</div>
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
  const id = useId();
  const [texto, setTexto] = useState(inicial);
  const [dia, setDia] = useState(fecha?.inicial ?? "");
  const [opcion, setOpcion] = useState<string>(eleccion?.opciones[0]?.valor ?? "");
  const listo = opcional || texto.trim().length > 0;
  return (
    <form className="as-form" onSubmit={(e) => { e.preventDefault(); if (!listo) return; alCerrar(); void alGuardar(texto.trim(), fecha ? dia || null : undefined, eleccion ? opcion : undefined); }}>
      <label className="pn-campo" htmlFor={`${id}-t`}>{etiqueta}{opcional ? " (opcional)" : ""}
        <input id={`${id}-t`} className="as-inp as-inp-borde" value={texto} maxLength={maximo} onChange={(e) => setTexto(e.target.value)} autoFocus />
      </label>
      {fecha ? (
        <label className="pn-campo" htmlFor={`${id}-f`}>{fecha.etiqueta}
          <input id={`${id}-f`} type="date" className="as-inp as-inp-borde" value={dia} onChange={(e) => setDia(e.target.value)} />
        </label>
      ) : null}
      {eleccion ? <Desplegable etiqueta={eleccion.etiqueta} opciones={eleccion.opciones} valor={opcion} alElegir={(v) => { if (v) setOpcion(v); }} /> : null}
      <div className="as-fila as-fin">
        <button type="button" className="as-btn" onClick={alCerrar}>Cancelar</button>
        <button type="submit" className="as-btn as-pri" aria-disabled={!listo}>Guardar</button>
      </div>
    </form>
  );
}
