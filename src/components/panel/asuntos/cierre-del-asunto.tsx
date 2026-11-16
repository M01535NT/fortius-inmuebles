"use client";
import { useEffect, useMemo, useState } from "react";

import { Boton } from "@/components/panel/kit/boton";
import { Desplegable } from "@/components/panel/kit/desplegable";
import { useColeccion } from "@/components/panel/datos/use-coleccion";
import type { Asesor } from "@/lib/domain/records";
import { armarCierre, cierrePropuesto, comisionDelContrato, conCierre, esRenta, type DocConDatos, type Expediente } from "@/lib/panel/datos/asuntos";
import { pedir } from "@/lib/panel/datos/colecciones";

import type { PedirCambio } from "./detalle";

const pesos = (n: number) => `$${n.toLocaleString("es-MX", { maximumFractionDigits: 2 })} MXN`;

/**
 * Quién captó y quién vendió (COR-22, RP-99), del lado del propietario. La comisión no se escribe a mano: sale del
 * contrato de intermediación del asunto (09 o 21), como en el panel viejo. Al guardar, Dinero ya sabe qué se cobra.
 */
export function CierreDelAsunto({ expediente, ocupado, alCambiar }: { expediente: Expediente; ocupado: boolean; alCambiar: PedirCambio }) {
  const asesores = useColeccion<Asesor>("asesores");
  const [docs, setDocs] = useState<DocConDatos[] | null>(null);
  const propuesto = cierrePropuesto(expediente);
  const [capto, setCapto] = useState(propuesto.capto);
  const [vendio, setVendio] = useState(propuesto.vendio);
  const renta = esRenta(expediente);
  const guardado = expediente.flujo?.cierre;

  useEffect(() => {
    const ctl = new AbortController();
    pedir<DocConDatos[]>(`/api/admin/expedientes/${encodeURIComponent(expediente.id)}/formatos`, { method: "GET", signal: ctl.signal }, "documentos")
      .then(setDocs, () => { if (!ctl.signal.aborted) setDocs([]); });
    return () => ctl.abort();
  }, [expediente.id]);

  const contrato = useMemo(() => (docs ? comisionDelContrato(docs, renta) : null), [docs, renta]);
  const opciones = useMemo(() => asesores.datos
    .filter((a) => a.activo !== false || a.id === capto || a.id === vendio)
    .map((a) => ({ valor: a.id, etiqueta: a.nombre || "Asesor sin nombre" })), [asesores.datos, capto, vendio]);
  const borrador = armarCierre(capto, vendio, contrato);
  const cambio = !guardado || guardado.capto !== capto || guardado.vendio !== vendio || guardado.comisionEstimada !== borrador.comisionEstimada;

  const comisionTexto = contrato ? `${pesos(contrato.comision)} sin IVA, del contrato de intermediación.`
    : docs === null ? "Buscando el contrato de intermediación…"
    : `Todavía no hay contrato de intermediación (${renta ? "21" : "09"}) en este asunto. Se puede guardar y la comisión se suma cuando exista.`;

  return (
    <section aria-label="Quién captó y quién vendió" style={{ display: "grid", gap: 12, marginTop: 16 }}>
      <h3 className="pn-grupo" style={{ margin: 0 }}>Quién captó y quién {renta ? "rentó" : "vendió"}</h3>
      {opciones.length ? (
        <>
          <Desplegable etiqueta="Captó" valor={capto} opciones={opciones} alElegir={(v) => { if (v) setCapto(v); }} />
          <Desplegable etiqueta={renta ? "Rentó" : "Vendió"} valor={vendio} opciones={opciones} alElegir={(v) => { if (v) setVendio(v); }} />
        </>
      ) : <p className="pn-sub" style={{ margin: 0 }}>{asesores.cargando ? "Cargando el equipo…" : "No hay asesores registrados."}</p>}
      <p className="pn-sub" style={{ margin: 0 }}>Comisión: {comisionTexto}</p>
      <div>
        <Boton variante={guardado ? "secundario" : "primario"} deshabilitado={ocupado || !cambio || !capto || !vendio}
          onClick={() => {
            const previo = guardado;
            void alCambiar((e) => conCierre(e, borrador), guardado ? "Cierre actualizado" : "Cierre guardado", (e) => conCierre(e, previo));
          }}>
          {guardado ? "Guardar cambios" : "Guardar quién captó y quién vendió"}
        </Boton>
      </div>
    </section>
  );
}
