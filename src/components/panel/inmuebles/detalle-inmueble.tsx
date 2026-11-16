"use client";
import { useEffect, useMemo, useState } from "react";

import { AsuntosDe } from "@/components/panel/asuntos/asuntos-de";
import { useColeccion } from "@/components/panel/datos/use-coleccion";
import { CompartirInmueble } from "@/components/panel/inmuebles/compartir";
import { FormularioInmueble } from "@/components/panel/inmuebles/formulario";
import { LlavesInmueble, PropietarioInmueble } from "@/components/panel/inmuebles/seguimiento";
import { FotosInmueble, PublicarInmueble, TextosSitio } from "@/components/panel/inmuebles/sitio";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Boton, BotonEnlace } from "@/components/panel/kit/boton";
import { Ficha } from "@/components/panel/kit/ficha";
import { Relacionado } from "@/components/panel/kit/relacionado";
import type { Property } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import type { Asesor, Evento, Lead } from "@/lib/domain/records";
import { aTexto } from "@/lib/panel/calendario";
import { leerMiAsesor } from "@/lib/panel/datos/colecciones";
import { desligarPropietario, guardarLlaves, ligarPropietario, prestarLlaves, propietariosDe, regresaronLlaves } from "@/lib/panel/datos/inmueble-seguimiento";
import { agregarFotos, describirFoto, editarTextos, mostrarFoto, ordenarFotos, publicar, quitarDelSitio, quitarFoto } from "@/lib/panel/datos/inmueble-sitio";
import { editarInmueble, type DatosInmueble } from "@/lib/panel/datos/inmuebles-acciones";
import { relacionadoInmueble } from "@/lib/panel/datos/relacionado";
import { fichaInmueble } from "@/lib/panel/datos/vistas";

/** Detalle de un inmueble (PN-03): lectura con compartir, ficha, sitio, propietario y llaves, o edición de datos. Guardar nunca publica. */
export function DetalleInmueble({ inmueble, guardar, personas, guardarPersona }: {
  inmueble: Property;
  /** `guardar` de useColeccion<Property>("propiedades") de quien lo usa. */
  guardar: (slug: string, data: Property) => Promise<Property>;
  personas: Cliente[];
  /** `guardar` de useColeccion<Cliente>("clientes") de quien lo usa. */
  guardarPersona: (id: string, data: Cliente) => Promise<Cliente>;
}) {
  const { avisar } = useAvisos();
  // La edición queda ligada al slug: al cambiar de inmueble se vuelve a la lectura.
  const [editandoSlug, setEditandoSlug] = useState<string | null>(null);
  const editando = editandoSlug === inmueble.slug;
  const [ocupado, setOcupado] = useState(false);
  const [miAsesor, setMiAsesor] = useState<string | null>(null);
  useEffect(() => { const c = new AbortController(); leerMiAsesor(c.signal).then(setMiAsesor); return () => c.abort(); }, []);
  const asesores = useColeccion<Asesor>("asesores");
  const leads = useColeccion<Lead>("leads");
  const eventos = useColeccion<Evento>("eventos");
  const [ahora] = useState(() => new Date());
  const [hoy] = useState(() => aTexto(new Date()));
  // Quién registra un préstamo de llaves: el nombre de su ficha de asesor, o «Dirección».
  const quien = useMemo(() => asesores.datos.find((a) => a.id === miAsesor)?.nombre ?? "Dirección", [asesores.datos, miAsesor]);

  // Quitar del sitio no ofrece Deshacer: volver a publicar pasa por la revisión del servidor (COR-16).
  const cambiarInmueble = async (previo: Property, siguiente: Property, texto: string, deshacer = true) => {
    setOcupado(true);
    try {
      await guardar(previo.slug, siguiente);
      if (!deshacer) { avisar(texto); return; }
      avisar(texto, { etiqueta: "Deshacer", alAccionar: () => {
        guardar(previo.slug, previo).then(() => avisar("Se deshizo"), (e: unknown) => avisar(e instanceof Error ? e.message : "No se pudo deshacer."));
      } });
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se guardó. Vuelve a intentarlo.");
    } finally { setOcupado(false); }
  };
  const cambiarPersona = async (previa: Cliente, siguiente: Cliente, texto: string) => {
    setOcupado(true);
    try {
      await guardarPersona(previa.id, siguiente);
      avisar(texto, { etiqueta: "Deshacer", alAccionar: () => {
        guardarPersona(previa.id, previa).then(() => avisar("Se deshizo"), (e: unknown) => avisar(e instanceof Error ? e.message : "No se pudo deshacer."));
      } });
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se guardó. Vuelve a intentarlo.");
    } finally { setOcupado(false); }
  };
  const guardarCambios = async (previo: Property, d: DatosInmueble) => {
    setOcupado(true);
    try {
      await guardar(previo.slug, editarInmueble(previo, d));
      setEditandoSlug(null);
      avisar("Cambios guardados", { etiqueta: "Deshacer", alAccionar: () => {
        guardar(previo.slug, previo).then(() => avisar("Se deshizo"), (e: unknown) => avisar(e instanceof Error ? e.message : "No se pudo deshacer."));
      } });
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se guardó. Vuelve a intentarlo.");
    } finally { setOcupado(false); }
  };

  const abierto = inmueble;
  if (editando) {
    return <FormularioInmueble key={abierto.slug} inmueble={abierto} ocupado={ocupado} alGuardar={(d) => void guardarCambios(abierto, d)} alCancelar={() => setEditandoSlug(null)} />;
  }
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 4 }}>
        <p className="pn-sub" style={{ margin: 0 }}>{abierto.codigo}</p>
        <Boton variante="texto" onClick={() => setEditandoSlug(abierto.slug)}>Editar datos</Boton>
      </div>
      <CompartirInmueble inmueble={abierto} />
      {abierto.operacion === "venta" ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
          <BotonEnlace href={`/panel/herramientas/credito?inmueble=${encodeURIComponent(abierto.codigo)}`}>Calcular crédito</BotonEnlace>
          <BotonEnlace href={`/panel/herramientas/comision?inmueble=${encodeURIComponent(abierto.codigo)}`}>Calcular comisión</BotonEnlace>
        </div>
      ) : null}
      <Ficha secciones={fichaInmueble(abierto)} />
      <AsuntosDe slug={abierto.slug} />
      <PublicarInmueble
        inmueble={abierto}
        propietarioLigado={propietariosDe(personas, abierto.slug).length > 0}
        ocupado={ocupado}
        alPublicar={() => void cambiarInmueble(abierto, publicar(abierto), "Publicado en el sitio")}
        alQuitar={() => void cambiarInmueble(abierto, quitarDelSitio(abierto), "Se quitó del sitio", false)}
      />
      <FotosInmueble
        inmueble={abierto}
        ocupado={ocupado}
        alAgregar={(f) => void cambiarInmueble(abierto, agregarFotos(abierto, f), f.length === 1 ? "Foto agregada" : `${f.length} fotos agregadas`)}
        alOrdenar={(g) => void cambiarInmueble(abierto, ordenarFotos(abierto, g), "Orden de fotos guardado")}
        alDescribir={(src, alt) => void cambiarInmueble(abierto, describirFoto(abierto, src, alt), "Descripción guardada")}
        alMostrar={(src) => void cambiarInmueble(abierto, mostrarFoto(abierto, src), "La foto ya se muestra en el sitio")}
        alQuitar={(src) => void cambiarInmueble(abierto, quitarFoto(abierto, src), "Foto quitada")}
      />
      <TextosSitio
        key={`textos-${abierto.slug}-${abierto.descripcion.length}`}
        inmueble={abierto}
        ocupado={ocupado}
        alGuardar={(d) => void cambiarInmueble(abierto, editarTextos(abierto, d), "Textos guardados")}
      />
      <PropietarioInmueble
        inmueble={abierto}
        personas={personas}
        ocupado={ocupado}
        alLigar={(c) => void cambiarPersona(c, ligarPropietario(c, abierto.slug), `${c.nombre} quedó como propietario`)}
        alDesligar={(c) => void cambiarPersona(c, desligarPropietario(c), "Se quitó el propietario")}
      />
      <LlavesInmueble
        key={`llaves-${abierto.slug}`}
        inmueble={abierto}
        hoy={ahora}
        ocupado={ocupado}
        alGuardar={(d) => void cambiarInmueble(abierto, guardarLlaves(abierto, d), "Llaves guardadas")}
        alPrestar={(d) => void cambiarInmueble(abierto, prestarLlaves(abierto, d, quien), `Llaves prestadas a ${d.persona.trim()}`)}
        alRegresar={(id) => void cambiarInmueble(abierto, regresaronLlaves(abierto, id, quien), "Llaves de regreso")}
      />
      <Relacionado grupos={relacionadoInmueble(abierto, { leads: leads.datos, eventos: eventos.datos, hoy })} />
    </>
  );
}
