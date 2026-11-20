"use client";
import { useState } from "react";

import { Gesto } from "@/components/panel/icons";
import { Hoja } from "@/components/panel/kit/hoja";
import { Boton } from "@/components/panel/kit/boton";
import { Campo } from "@/components/panel/kit/campo";
import { Desplegable } from "@/components/panel/kit/desplegable";
import { Cargando, EstadoError } from "@/components/panel/kit/estados";
import { useAvisos } from "@/components/panel/kit/avisos";
import type { Asesor } from "@/lib/domain/records";
import { ErrorDeLectura } from "@/lib/panel/datos/colecciones";
import { aplicarPerfil, perfilCambio, perfilDe, validarPerfil, type ErroresPerfil, type Perfil } from "@/lib/panel/datos/configuracion";

import { FotoAsesor, SeccionConfig } from "./partes";

type Props = {
  correo?: string;
  nombreSesion?: string;
  /** undefined mientras se averigua; null si la cuenta no tiene ficha de asesor. */
  miAsesor: Asesor | null | undefined;
  cargando: boolean;
  error: string | null;
  alReintentar: () => void;
  guardar: (id: string, data: Asesor) => Promise<Asesor>;
  /** Director sin ficha: las fichas activas del equipo que ninguna cuenta usa, para elegir la suya. */
  fichasLibres?: { id: string; nombre: string }[];
  alElegirFicha?: (asesorId: string) => Promise<void>;
};

/**
 * Tu perfil, como el boceto: dos filas (Nombre con la foto, Teléfono) que abren la edición en una hoja.
 * Es la ficha del asesor de quien está en sesión. El correo es el de la cuenta y no se cambia aquí.
 */
export function SeccionPerfil({ correo, nombreSesion, miAsesor, cargando, error, alReintentar, guardar, fichasLibres = [], alElegirFicha }: Props) {
  const [editando, setEditando] = useState(false);
  return (
    <SeccionConfig id="conf-perfil" titulo="Tu perfil">
      {cargando || miAsesor === undefined ? <div className="pn-conf-caja"><Cargando lineas={2} etiqueta="Cargando tu perfil" /></div>
        : error ? <div className="pn-conf-caja"><EstadoError texto={error} alReintentar={alReintentar} /></div>
        : miAsesor ? (
          <>
            <div className="pn-conf-tarjeta">
              <button type="button" className="pn-conf-prow" onClick={() => setEditando(true)} aria-label={`Nombre: ${miAsesor.nombre}. Cambiar`}>
                <FotoAsesor asesor={miAsesor} nombre={miAsesor.nombre} />
                <span className="pn-conf-k">Nombre</span><span className="pn-conf-v">{miAsesor.nombre}</span><Gesto nombre="derecha" tamano={18} aria-hidden />
              </button>
              <button type="button" className="pn-conf-prow" onClick={() => setEditando(true)} aria-label={`Teléfono: ${miAsesor.telefono || "sin anotar"}. Cambiar`}>
                <span className="pn-conf-k">Teléfono</span><span className="pn-conf-v" data-falta={!miAsesor.telefono || undefined}>{miAsesor.telefono || "Sin anotar"}</span><Gesto nombre="derecha" tamano={18} aria-hidden />
              </button>
            </div>
            <Hoja abierta={editando} titulo="Tu perfil" alCerrar={() => setEditando(false)}>
              <FormularioPerfil key={miAsesor.id + String(editando)} asesor={miAsesor} correo={correo} guardar={guardar} alTerminar={() => setEditando(false)} />
            </Hoja>
          </>
        ) : (
          <div className="pn-conf-tarjeta">
            <div className="pn-conf-prow">
              <FotoAsesor nombre={nombreSesion ?? correo ?? "?"} />
              <span className="pn-conf-k">Nombre</span><span className="pn-conf-v">{nombreSesion ?? "Dirección"}</span>
            </div>
            <div className="pn-conf-prow"><span className="pn-conf-k">Correo</span><span className="pn-conf-v">{correo ?? "—"}</span></div>
          </div>
        )}
      {miAsesor === null && !cargando && !error ? (
        alElegirFicha && fichasLibres.length
          ? <ElegirMiFicha libres={fichasLibres} nombreSesion={nombreSesion} alElegir={alElegirFicha} />
          : <p className="pn-conf-intro">Tu cuenta todavía no tiene ficha en el equipo: no hay nombre ni teléfono que cambiar aquí.</p>
      ) : null}
    </SeccionConfig>
  );
}

/** Se parece al nombre de la cuenta: sin acentos ni mayúsculas, la primera palabra igual. */
const sinAcentos = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/**
 * El director sin ficha elige cuál ficha del equipo es la suya: desde ahí su nombre y su teléfono se cambian en
 * «Tu perfil» y deja de salir aparte en Equipo «sin cuenta para entrar».
 */
function ElegirMiFicha({ libres, nombreSesion, alElegir }: { libres: { id: string; nombre: string }[]; nombreSesion?: string; alElegir: (id: string) => Promise<void> }) {
  const { avisar } = useAvisos();
  const primera = sinAcentos(nombreSesion ?? "").split(/\s+/)[0];
  const parecida = primera ? libres.find((f) => sinAcentos(f.nombre).split(/\s+/)[0] === primera) : undefined;
  const [eleccion, setEleccion] = useState(parecida?.id ?? (libres.length === 1 ? libres[0].id : ""));
  const [ocupado, setOcupado] = useState(false);
  return (
    <form noValidate style={{ display: "grid", gap: 12, marginTop: 12 }}
      onSubmit={(e) => {
        e.preventDefault();
        if (!eleccion || ocupado) return;
        setOcupado(true);
        alElegir(eleccion).catch((err: unknown) => avisar(err instanceof Error ? err.message : "No se guardó. Vuelve a intentarlo.")).finally(() => setOcupado(false));
      }}>
      <Desplegable etiqueta="Tu ficha en el equipo" valor={eleccion} vacio="Elige tu ficha"
        opciones={libres.map((f) => ({ valor: f.id, etiqueta: f.nombre }))} alElegir={setEleccion}
        ayuda="Es la que sale en Equipo sin cuenta para entrar. Al elegirla, tu cuenta y esa ficha quedan como la misma persona." />
      <div className="pn-conf-acciones">
        <Boton type="submit" deshabilitado={!eleccion || ocupado}>{ocupado ? "Guardando…" : "Es la mía"}</Boton>
      </div>
    </form>
  );
}

function FormularioPerfil({ asesor, correo, guardar, alTerminar }: { asesor: Asesor; correo?: string; guardar: Props["guardar"]; alTerminar: () => void }) {
  const { avisar } = useAvisos();
  const [perfil, setPerfil] = useState<Perfil>(() => perfilDe(asesor));
  const [errores, setErrores] = useState<ErroresPerfil>({});
  const [ocupado, setOcupado] = useState(false);
  const cambio = perfilCambio(asesor, perfil);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const err = validarPerfil(perfil);
    setErrores(err);
    if (Object.keys(err).length || !cambio || ocupado) return;
    const anterior = asesor;
    setOcupado(true);
    try {
      const guardado = await guardar(asesor.id, aplicarPerfil(asesor, perfil));
      setPerfil(perfilDe(guardado));
      alTerminar();
      avisar("Perfil guardado.", {
        etiqueta: "Deshacer",
        alAccionar: () => {
          guardar(anterior.id, anterior).then((r) => setPerfil(perfilDe(r)), () => avisar("No se pudo deshacer. Revisa tu perfil."));
        },
      });
    } catch (err) {
      avisar(err instanceof ErrorDeLectura && err.estado === 409
        ? "Alguien cambió tu perfil antes. Ya se cargó lo más reciente; revisa y guarda otra vez."
        : err instanceof Error ? err.message : "No se pudo guardar el perfil.");
    } finally { setOcupado(false); }
  }

  return (
    <form onSubmit={enviar} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="pn-conf-quien">
        <FotoAsesor asesor={asesor} nombre={perfil.nombre} />
        <span className="pn-conf-quien-txt"><strong>{asesor.nombre}</strong><span className="pn-conf-nota">{asesor.cargo || "Asesor"}</span></span>
      </div>
      <Campo etiqueta="Nombre" value={perfil.nombre} autoComplete="name" maxLength={120} error={errores.nombre}
        onChange={(e) => setPerfil((p) => ({ ...p, nombre: e.target.value }))} />
      <Campo etiqueta="Teléfono" type="tel" inputMode="tel" value={perfil.telefono} autoComplete="tel" maxLength={40} error={errores.telefono}
        ayuda="Para que el equipo te localice. El del sitio público se cambia en tu perfil público."
        onChange={(e) => setPerfil((p) => ({ ...p, telefono: e.target.value }))} />
      <Campo etiqueta="Correo" value={asesor.email || correo || ""} readOnly ayuda="Es el de tu cuenta; no se cambia aquí." />
      <p className="pn-conf-nota">La foto es la de tu perfil público.</p>
      <div className="pn-conf-acciones">
        <Boton type="submit" deshabilitado={!cambio || ocupado}>{ocupado ? "Guardando…" : "Guardar"}</Boton>
        <Boton type="button" variante="texto" onClick={alTerminar}>Cancelar</Boton>
      </div>
    </form>
  );
}
