"use client";
import { useState } from "react";

import { Boton } from "@/components/panel/kit/boton";
import { Campo } from "@/components/panel/kit/campo";
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
};

/** Perfil: nombre y teléfono de la ficha del asesor de quien está en sesión. El correo es el de la cuenta y no se cambia aquí. */
export function SeccionPerfil({ correo, nombreSesion, miAsesor, cargando, error, alReintentar, guardar }: Props) {
  return (
    <SeccionConfig id="conf-perfil" titulo="Perfil" intro="Así te ven el equipo y los clientes en los documentos.">
      <div className="pn-conf-caja">
        {cargando || miAsesor === undefined ? <Cargando lineas={3} etiqueta="Cargando tu perfil" />
          : error ? <EstadoError texto={error} alReintentar={alReintentar} />
          : miAsesor ? <FormularioPerfil key={miAsesor.id} asesor={miAsesor} correo={correo} guardar={guardar} />
          : (
            <>
              <div className="pn-conf-quien">
                <FotoAsesor nombre={nombreSesion ?? correo ?? "?"} />
                <span className="pn-conf-quien-txt"><strong>{nombreSesion ?? "Dirección"}</strong><span className="pn-conf-nota">{correo}</span></span>
              </div>
              <p className="pn-conf-nota">Tu cuenta es de dirección: no tiene nombre ni teléfono que cambiar aquí.</p>
            </>
          )}
      </div>
    </SeccionConfig>
  );
}

function FormularioPerfil({ asesor, correo, guardar }: { asesor: Asesor; correo?: string; guardar: Props["guardar"] }) {
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
    <form onSubmit={enviar} noValidate style={{ display: "contents" }}>
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
        {cambio && !ocupado ? <Boton type="button" variante="texto" onClick={() => { setPerfil(perfilDe(asesor)); setErrores({}); }}>Descartar cambios</Boton> : null}
      </div>
    </form>
  );
}
