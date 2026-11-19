"use client";
import { useId, useState } from "react";

import { Desplegable } from "@/components/panel/kit/desplegable";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/panel/ui/dialog";
import type { Miembro } from "@/lib/panel/asuntos/api";

export type DatosCierre = { motivo: string | null; capto_id: string | null; vendio_id: string | null };

type Props = {
  abierto: boolean; titulo: string; equipo: readonly Miembro[];
  capto: string | null; vendio: string | null;
  alCerrar: () => void; alGuardar: (d: DatosCierre) => unknown;
};

/** Cerrar un asunto (SPEC.md, «Cerrar un asunto»): el motivo y quién captó y quién vendió. Nada es obligatorio. */
export function DialogoCierre(props: Props) {
  const { abierto, titulo, alCerrar } = props;
  return (
    <Dialog open={abierto} onOpenChange={(o) => { if (!o) alCerrar(); }}>
      <DialogContent className="max-w-md">
        <DialogTitle>{titulo}</DialogTitle>
        <DialogDescription className="sr-only">Motivo, quién captó y quién vendió</DialogDescription>
        {abierto ? <Forma {...props} /> : null}
      </DialogContent>
    </Dialog>
  );
}

/** Se monta al abrir: empieza con lo que ya tenía el asunto. */
function Forma({ equipo, capto: c0, vendio: v0, alCerrar, alGuardar }: Props) {
  const id = useId();
  const [motivo, setMotivo] = useState("");
  const [capto, setCapto] = useState<string>(c0 ?? "");
  const [vendio, setVendio] = useState<string>(v0 ?? "");
  const opciones = equipo.map((m) => ({ valor: m.id, etiqueta: m.nombre }));
  return (
    <form className="as-form" onSubmit={(e) => {
      e.preventDefault();
      alCerrar();
      void alGuardar({ motivo: motivo.trim() || null, capto_id: capto || null, vendio_id: vendio || null });
    }}>
      <label className="pn-campo" htmlFor={`${id}-m`}>Motivo (opcional)
        <input id={`${id}-m`} className="as-inp as-inp-borde" value={motivo} maxLength={1000} onChange={(e) => setMotivo(e.target.value)} autoFocus />
      </label>
      <Desplegable etiqueta="Captó" valor={capto} opciones={opciones} vacio="Sin anotar" alElegir={setCapto} />
      <Desplegable etiqueta="Vendió" valor={vendio} opciones={opciones} vacio="Sin anotar" alElegir={setVendio} />
      <div className="as-fila as-fin">
        <button type="button" className="as-btn" onClick={alCerrar}>Cancelar</button>
        <button type="submit" className="as-btn as-pri">Cerrar</button>
      </div>
    </form>
  );
}
