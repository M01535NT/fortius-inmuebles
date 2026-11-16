"use client";
import { useEffect, useMemo, useState } from "react";

import { SeccionPerfil } from "@/components/panel/configuracion/perfil";
import { SeccionApariencia, SeccionAvisos } from "@/components/panel/configuracion/preferencias";
import { SeccionEquipo } from "@/components/panel/configuracion/equipo";
import { SeccionConfig } from "@/components/panel/configuracion/partes";
import "@/components/panel/configuracion/configuracion.css";
import { useColeccion } from "@/components/panel/datos/use-coleccion";
import { Boton } from "@/components/panel/kit/boton";
import { useAvisos } from "@/components/panel/kit/avisos";
import type { Asesor } from "@/lib/domain/records";
import { leerMiAsesor } from "@/lib/panel/datos/colecciones";
import { logout, useSession } from "@/lib/panel/legado/sesion";

/** Configuración (PN-09): perfil, apariencia, avisos, equipo y cerrar sesión. Una columna centrada. */
export default function Configuracion() {
  const sesion = useSession();
  const { avisar } = useAvisos();
  const esDirector = sesion?.role === "admin";
  const equipo = useColeccion<Asesor>("asesores");
  const [miId, setMiId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const control = new AbortController();
    leerMiAsesor(control.signal).then(setMiId, () => { if (!control.signal.aborted) setMiId(null); });
    return () => control.abort();
  }, []);

  const miAsesor = useMemo(() => {
    if (miId === undefined) return undefined;
    if (miId === null) return null;
    return equipo.datos.find((a) => a.id === miId) ?? null;
  }, [miId, equipo.datos]);

  return (
    <div className="pn-pagina" style={{ maxWidth: 640 }}>
      <h1 className="pn-h1">Configuración</h1>
      <SeccionPerfil
        correo={sesion?.email} nombreSesion={sesion?.name} miAsesor={miAsesor}
        cargando={equipo.cargando} error={equipo.error} alReintentar={equipo.reintentar} guardar={equipo.guardar}
      />
      <SeccionApariencia />
      <SeccionAvisos />
      <SeccionEquipo esDirector={esDirector} asesores={equipo.datos} cargando={equipo.cargando} error={equipo.error} alReintentar={equipo.reintentar} miId={miId ?? null} />
      <SeccionConfig id="conf-sesion" titulo="Sesión">
        <div className="pn-conf-caja">
          <p className="pn-conf-nota">{sesion?.email ? `Entraste como ${sesion.email}.` : "Sesión abierta."}</p>
          <div className="pn-conf-acciones">
            <Boton variante="peligro" onClick={() => { logout().catch(() => avisar("No se pudo cerrar la sesión en el servidor. Vuelve a intentarlo.")); }}>Cerrar sesión</Boton>
          </div>
        </div>
      </SeccionConfig>
    </div>
  );
}
