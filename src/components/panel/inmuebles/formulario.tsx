"use client";
import { useRef, useState } from "react";

import { Boton } from "@/components/panel/kit/boton";
import { Campo, formatoMonto } from "@/components/panel/kit/campo";
import { Desplegable } from "@/components/panel/kit/desplegable";
import type { Property } from "@/data/propiedades";
import { ESTADO_LABELS } from "@/lib/panel/datos/vistas";
import { TIPOS_INMUEBLE } from "@/lib/inmueble-tipos";
import { datosDeInmueble, estadosPara, faltaParaInmueble, type DatosInmueble } from "@/lib/panel/datos/inmuebles-acciones";

const TIPOS = TIPOS_INMUEBLE.map((t) => ({ valor: t.key, etiqueta: t.label }));
const sinTerreno = (tipo: DatosInmueble["tipo"]) => tipo === "departamento" || tipo === "oficina" || tipo === "local";
const conCuartos = (tipo: DatosInmueble["tipo"]) => tipo === "casa" || tipo === "departamento";

/**
 * Alta o edición de un inmueble: lo que el asesor sabe en la primera visita. Fotos, textos del sitio y publicación van aparte;
 * guardar nunca publica.
 */
export function FormularioInmueble({ inmueble, ocupado, alGuardar, alCancelar }: {
  inmueble?: Property; ocupado: boolean; alGuardar: (d: DatosInmueble) => void; alCancelar?: () => void;
}) {
  const [d, setD] = useState<DatosInmueble>(() => inmueble ? datosDeInmueble(inmueble) : {
    titulo: "", tipo: "casa", operacion: "venta", precio: "", moneda: "MXN", zona: "", referencia: "",
    terreno: "", construccion: "", recamaras: "", banos: "", estacionamientos: "", estado: "evaluacion",
  });
  const [intento, setIntento] = useState(false);
  const raiz = useRef<HTMLFormElement>(null);
  const falta = faltaParaInmueble(d);
  const error = (c: string) => (intento && falta?.campo === c ? falta.texto : undefined);
  const num = (k: keyof DatosInmueble) => ({ value: d[k], inputMode: "decimal" as const, autoComplete: "off", maxLength: 14, onChange: (e: React.ChangeEvent<HTMLInputElement>) => setD({ ...d, [k]: formatoMonto(e.target.value) }) });
  return (
    <form
      ref={raiz}
      noValidate
      style={{ display: "grid", gap: 12, marginTop: 8 }}
      onSubmit={(e) => {
        e.preventDefault();
        setIntento(true);
        if (!falta) { alGuardar(d); return; }
        raiz.current?.querySelector<HTMLInputElement>(`[data-campo="${falta.campo}"]`)?.focus();
      }}
    >
      <Campo etiqueta="Nombre del inmueble" data-campo="titulo" placeholder="Ej. Casa en Playas de Tijuana" autoComplete="off" maxLength={160} value={d.titulo} onChange={(e) => setD({ ...d, titulo: e.target.value })} error={error("titulo")} />
      <Desplegable etiqueta="Tipo" valor={d.tipo} opciones={TIPOS} alElegir={(tipo) => { if (tipo) setD({ ...d, tipo }); }} />
      <Desplegable etiqueta="Operación" valor={d.operacion} alElegir={(operacion) => { if (operacion) setD({ ...d, operacion }); }} opciones={[{ valor: "venta", etiqueta: "Venta" }, { valor: "renta", etiqueta: "Renta" }]} />
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 200px" }}>
          <Campo etiqueta={d.operacion === "renta" ? "Renta mensual" : "Precio"} dinero inputMode="decimal" autoComplete="off" maxLength={20} value={d.precio}
            onChange={(e) => setD({ ...d, precio: formatoMonto(e.target.value) })} ayuda={d.precio ? undefined : "Vacío: «Valor a consulta»."} />
        </div>
        <div style={{ flex: "0 0 160px" }}>
          <Desplegable etiqueta="Moneda" valor={d.moneda} alElegir={(moneda) => { if (moneda) setD({ ...d, moneda }); }} opciones={[{ valor: "MXN", etiqueta: "MXN" }, { valor: "USD", etiqueta: "USD" }]} />
        </div>
      </div>
      <Campo etiqueta="Zona o colonia" data-campo="zona" placeholder="Ej. Playas de Tijuana" autoComplete="off" maxLength={160} value={d.zona} onChange={(e) => setD({ ...d, zona: e.target.value })} error={error("zona")} />
      <Campo etiqueta="Referencia" placeholder="Ej. cerca del Malecón" ayuda="Nunca la dirección exacta: esto puede salir en el sitio." autoComplete="off" maxLength={300} value={d.referencia} onChange={(e) => setD({ ...d, referencia: e.target.value })} />
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
        {!sinTerreno(d.tipo) ? <Campo etiqueta="Terreno (m²)" {...num("terreno")} /> : null}
        {d.tipo !== "terreno" ? <Campo etiqueta="Construcción (m²)" {...num("construccion")} /> : null}
        {conCuartos(d.tipo) ? <Campo etiqueta="Recámaras" {...num("recamaras")} /> : null}
        {d.tipo !== "terreno" ? <Campo etiqueta="Baños" {...num("banos")} /> : null}
        {d.tipo !== "terreno" ? <Campo etiqueta="Estacionamientos" {...num("estacionamientos")} /> : null}
      </div>
      {inmueble ? <Desplegable etiqueta="Estado" valor={d.estado} opciones={estadosPara(d.operacion, inmueble.publicada).map((e) => ({ valor: e, etiqueta: ESTADO_LABELS[e] }))} alElegir={(estado) => { if (estado) setD({ ...d, estado }); }} /> : (
        <p className="pn-sub" style={{ margin: 0 }}>Queda «En captación» y sin publicar. El folio se asigna al guardar.</p>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <Boton type="submit" deshabilitado={ocupado} style={{ flex: 1 }}>{inmueble ? "Guardar cambios" : "Guardar inmueble"}</Boton>
        {alCancelar ? <Boton variante="texto" onClick={alCancelar}>Cancelar</Boton> : null}
      </div>
    </form>
  );
}
