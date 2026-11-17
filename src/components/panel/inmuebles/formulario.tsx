"use client";
import { useMemo, useRef, useState } from "react";

import { Boton } from "@/components/panel/kit/boton";
import { Campo, formatoMonto } from "@/components/panel/kit/campo";
import { Desplegable } from "@/components/panel/kit/desplegable";
import { Interruptor } from "@/components/panel/kit/segmentado";
import type { Property } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import { normalizar } from "@/lib/panel/buscar";
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
export function FormularioInmueble({ inmueble, ocupado, alGuardar, alCancelar, personas }: {
  inmueble?: Property; ocupado: boolean; alGuardar: (d: DatosInmueble, propietario?: Cliente) => void; alCancelar?: () => void;
  /** Alta: para ligar al propietario si ya está en Personas. */
  personas?: readonly Cliente[];
}) {
  if (!inmueble) return <AltaMinima ocupado={ocupado} alGuardar={alGuardar} alCancelar={alCancelar} personas={personas ?? []} />;
  return <EdicionInmueble inmueble={inmueble} ocupado={ocupado} alGuardar={(d) => alGuardar(d)} alCancelar={alCancelar} />;
}

/**
 * Alta mínima del boceto: operación, tipo y colonia o dirección; precio y propietario si ya se saben.
 * El nombre se arma solo («Casa en Playas de Tijuana») y se cambia después en «Editar datos». Se guarda sin publicar.
 */
function AltaMinima({ ocupado, alGuardar, alCancelar, personas }: {
  ocupado: boolean; alGuardar: (d: DatosInmueble, propietario?: Cliente) => void; alCancelar?: () => void; personas: readonly Cliente[];
}) {
  const [operacion, setOperacion] = useState<Property["operacion"]>("venta");
  const [tipo, setTipo] = useState<DatosInmueble["tipo"]>("casa");
  const [zona, setZona] = useState("");
  const [precio, setPrecio] = useState("");
  const [quien, setQuien] = useState("");
  const [propietario, setPropietario] = useState<Cliente | null>(null);
  const [intento, setIntento] = useState(false);
  const coinciden = useMemo(() => {
    const n = normalizar(quien);
    if (propietario || n.length < 2) return [];
    return personas.filter((c) => normalizar(c.nombre ?? "").includes(n)).slice(0, 5);
  }, [personas, quien, propietario]);
  const guardar = () => {
    setIntento(true);
    const colonia = zona.trim();
    if (!colonia) return;
    alGuardar({
      titulo: `${TIPOS.find((t) => t.valor === tipo)?.etiqueta ?? "Inmueble"} en ${colonia}`.slice(0, 160), tipo, operacion, precio, moneda: "MXN", zona: colonia, referencia: "",
      terreno: "", construccion: "", recamaras: "", banos: "", estacionamientos: "", estado: "evaluacion",
    }, propietario ?? undefined);
  };
  return (
    <form noValidate style={{ display: "grid", gap: 12, marginTop: 8 }} onSubmit={(e) => { e.preventDefault(); guardar(); }}>
      <Interruptor etiqueta="Operación" valor={operacion} alElegir={setOperacion} opciones={[{ valor: "venta", etiqueta: "Venta" }, { valor: "renta", etiqueta: "Renta" }]} />
      <Desplegable etiqueta="Tipo" valor={tipo} opciones={TIPOS} alElegir={(t) => { if (t) setTipo(t); }} />
      <Campo etiqueta="Colonia o dirección" placeholder="Zona Río" autoComplete="off" maxLength={160} value={zona} onChange={(e) => setZona(e.target.value)}
        error={intento && !zona.trim() ? "Escribe la colonia o la dirección." : undefined} autoFocus />
      <Campo etiqueta={`${operacion === "renta" ? "Renta mensual" : "Precio"} (si ya lo sabes)`} dinero inputMode="numeric" autoComplete="off" maxLength={20} placeholder="Sin precio todavía"
        value={precio} onChange={(e) => setPrecio(formatoMonto(e.target.value))} />
      <div style={{ display: "grid", gap: 6 }}>
        <Campo etiqueta="Propietario (si lo conoces)" placeholder="Escribe para buscar en Personas" autoComplete="off" maxLength={160}
          value={propietario ? propietario.nombre : quien} onChange={(e) => { setPropietario(null); setQuien(e.target.value); }}
          ayuda={propietario ? "Queda ligado como propietario." : quien.trim().length >= 2 && !coinciden.length ? "No está en Personas: lo ligas después, cuando lo des de alta." : undefined} />
        {coinciden.length ? (
          <div className="fx-tarjeta" role="list" aria-label="Personas que coinciden">
            {coinciden.map((c) => (
              <button key={c.id} type="button" role="listitem" className="fx-opt" onClick={() => { setPropietario(c); setQuien(""); }}>
                <span>{c.nombre}</span>{c.telefono ? <span className="fx-h">{c.telefono}</span> : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: alCancelar ? "repeat(2, minmax(0, 1fr))" : "1fr", gap: 8 }}>
        {alCancelar ? <Boton variante="secundario" onClick={alCancelar}>Cancelar</Boton> : null}
        <Boton type="submit" deshabilitado={ocupado}>Guardar</Boton>
      </div>
      <p className="fx-chico" style={{ margin: 0 }}>Se guarda sin publicar. Fotos, datos y documentos se agregan después.</p>
    </form>
  );
}

function EdicionInmueble({ inmueble, ocupado, alGuardar, alCancelar }: {
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
