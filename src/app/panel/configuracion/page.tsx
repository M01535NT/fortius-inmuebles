"use client";
import { useEffect, useMemo, useState } from "react";

import { SeccionCatalogos } from "@/components/panel/configuracion/catalogos";
import { SeccionPerfil } from "@/components/panel/configuracion/perfil";
import { SeccionApariencia, SeccionAvisos } from "@/components/panel/configuracion/preferencias";
import { SeccionEquipo } from "@/components/panel/configuracion/equipo";
import "@/components/panel/configuracion/configuracion.css";
import { useColeccion } from "@/components/panel/datos/use-coleccion";
import { useAvisos } from "@/components/panel/kit/avisos";
import type { Asesor } from "@/lib/domain/records";
import { leerMiAsesor } from "@/lib/panel/datos/colecciones";
import { logout, useSession } from "@/lib/panel/legado/sesion";

/**
 * Configuración, como el boceto: Tu perfil, Apariencia, Avisos, Equipo · N con «Invitar», Catálogos (solo el director)
 * y «Cerrar sesión». Una columna.
 */
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
    <div className="pn-pagina pn-conf" style={{ display: "flex", flexDirection: "column" }}>
      <h1 className="pn-conf-h1">Configuración</h1>
      <SeccionPerfil
        correo={sesion?.email} nombreSesion={sesion?.name} miAsesor={miAsesor}
        cargando={equipo.cargando} error={equipo.error} alReintentar={equipo.reintentar} guardar={equipo.guardar}
      />
      <SeccionApariencia />
      <SeccionAvisos />
      <SeccionEquipo esDirector={esDirector} asesores={equipo.datos} cargando={equipo.cargando} error={equipo.error} alReintentar={equipo.reintentar} miId={miId ?? null} />
      {esDirector ? <SeccionCatalogos /> : null}
      <button type="button" className="pn-conf-salir" title={sesion?.email ? `Entraste como ${sesion.email}` : undefined}
        onClick={() => { logout().catch(() => avisar("No se pudo cerrar la sesión en el servidor. Vuelve a intentarlo.")); }}>Cerrar sesión</button>
    </div>
  );
}
