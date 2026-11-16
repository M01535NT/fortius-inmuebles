"use client";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { AsuntosDe } from "@/components/panel/asuntos/asuntos-de";
import { useColeccion } from "@/components/panel/datos/use-coleccion";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Boton } from "@/components/panel/kit/boton";
import { Ficha } from "@/components/panel/kit/ficha";
import { Contactar, Relacionado } from "@/components/panel/kit/relacionado";
import { EditarDatosPersona } from "@/components/panel/personas/formularios";
import type { Property } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import type { Evento, Lead } from "@/lib/domain/records";
import { aTexto } from "@/lib/panel/calendario";
import { enlaceWhatsApp } from "@/lib/panel/datos/consultas";
import { editarPersona, type DatosEditables } from "@/lib/panel/datos/personas-acciones";
import { relacionadoPersona, rutaPersona } from "@/lib/panel/datos/relacionado";
import { NOMBRE_TIPO_PERSONA, fichaPersona } from "@/lib/panel/datos/vistas";

type Props = {
  /** La ficha abierta. */
  persona: Cliente;
  /** Todas las personas, para el aviso de duplicado al editar. */
  personas: Cliente[];
  /** El `guardar` de `useColeccion<Cliente>("clientes")` de quien lo usa. */
  guardar: (id: string, data: Cliente) => Promise<Cliente>;
  /** «Abrir la existente» desde el aviso de duplicado; si falta, navega a la ficha en Personas. */
  alAbrirPersona?: (id: string) => void;
};

/** Detalle de una persona: tipo, «Editar datos», contactar, ficha, asuntos y relacionado. Al cambiar de persona, sale de la edición. */
export function DetallePersona(props: Props) {
  return <DetalleDe key={props.persona.id} {...props} />;
}

function DetalleDe({ persona, personas, guardar, alAbrirPersona }: Props) {
  const { avisar } = useAvisos();
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  // Para «Relacionado»: consultas, citas e inmuebles (lectura; el servidor decide qué ve cada quien).
  const leads = useColeccion<Lead>("leads");
  const eventos = useColeccion<Evento>("eventos");
  const inmuebles = useColeccion<Property>("propiedades");
  const [hoy] = useState(() => aTexto(new Date()));

  const abrirExistente = (id: string) => { if (alAbrirPersona) alAbrirPersona(id); else router.push(rutaPersona(id)); };

  const guardarDatos = useCallback(async (previa: Cliente, d: DatosEditables) => {
    setOcupado(true);
    try {
      await guardar(previa.id, editarPersona(previa, d));
      setEditando(false);
      avisar("Datos guardados", { etiqueta: "Deshacer", alAccionar: () => {
        guardar(previa.id, previa).then(() => avisar("Se deshizo"), (e: unknown) => avisar(e instanceof Error ? e.message : "No se pudo deshacer."));
      } });
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se guardó. Vuelve a intentarlo.");
    } finally { setOcupado(false); }
  }, [guardar, avisar]);

  if (editando) {
    return (
      <EditarDatosPersona
        persona={persona}
        personas={personas}
        ocupado={ocupado}
        alGuardar={(d) => void guardarDatos(persona, d)}
        alCancelar={() => setEditando(false)}
        alAbrirExistente={abrirExistente}
      />
    );
  }

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 4 }}>
        <p className="pn-sub" style={{ margin: 0 }}>{NOMBRE_TIPO_PERSONA[persona.tipo]}</p>
        <Boton variante="texto" onClick={() => setEditando(true)}>Editar datos</Boton>
      </div>
      <Contactar telefono={persona.telefono} email={persona.email} whatsapp={persona.telefono ? enlaceWhatsApp(persona.telefono, `Hola ${persona.nombre?.trim().split(/\s+/)[0] ?? ""}, te escribo de Fortius Inmuebles.`) : null} />
      <Ficha secciones={fichaPersona(persona)} />
      <AsuntosDe clienteId={persona.id} />
      <Relacionado grupos={relacionadoPersona(persona, { leads: leads.datos, eventos: eventos.datos, inmuebles: inmuebles.datos, hoy })} />
    </>
  );
}
