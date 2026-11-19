"use client";
import { useEffect, useMemo, useState } from "react";

import { SeccionCatalogos } from "@/components/panel/configuracion/catalogos";
import { SeccionPerfil } from "@/components/panel/configuracion/perfil";
import { SeccionApariencia, SeccionAvisos } from "@/components/panel/configuracion/preferencias";
import { SeccionEquipo } from "@/components/panel/configuracion/equipo";
import "@/components/panel/configuracion/configuracion.css";
import { SeccionConfig } from "@/components/panel/configuracion/partes";
import { useColeccion } from "@/components/panel/datos/use-coleccion";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Fila, Tarjeta } from "@/components/panel/kit/lista";
import type { Asesor } from "@/lib/domain/records";
import { elegirMiFicha, leerMiFicha } from "@/lib/panel/datos/configuracion-cuentas";
import { logout, useSession } from "@/lib/panel/legado/sesion";

/**
 * Configuración, como el boceto: Tu perfil, Apariencia, Avisos, Equipo · N, Catálogos (solo el director), Eliminados
 * y «Cerrar sesión». Una columna. La cuenta del director es la misma persona que su ficha del equipo: si todavía no
 * tiene, «Tu perfil» le deja elegir cuál es.
 */
export default function Configuracion() {
  const sesion = useSession();
  const { avisar } = useAvisos();
  const esDirector = sesion?.role === "admin";
  const equipo = useColeccion<Asesor>("asesores");
  const [miId, setMiId] = useState<string | null | undefined>(undefined);
  const [libres, setLibres] = useState<{ id: string; nombre: string }[]>([]);
  const [vuelta, setVuelta] = useState(0);

  useEffect(() => {
    const control = new AbortController();
    leerMiFicha(control.signal).then(
      (f) => { setMiId(f.asesorId); setLibres(f.libres); },
      () => { if (!control.signal.aborted) { setMiId(null); setLibres([]); } },
    );
    return () => control.abort();
  }, [vuelta]);

  async function esMia(asesorId: string) {
    await elegirMiFicha(asesorId);
    setVuelta((n) => n + 1);
    equipo.reintentar();
    avisar("Listo: tu cuenta y tu ficha del equipo ya son la misma.");
  }

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
        fichasLibres={esDirector ? libres : []} alElegirFicha={esDirector ? esMia : undefined}
      />
      <SeccionApariencia />
      <SeccionAvisos />
      {/* Al ligar tu ficha se vuelve a leer quién tiene cuenta, para que dejes de salir «sin cuenta para entrar». */}
      <SeccionEquipo key={`equipo-${vuelta}`} esDirector={esDirector} asesores={equipo.datos} cargando={equipo.cargando} error={equipo.error} alReintentar={equipo.reintentar} miId={miId ?? null} />
      {esDirector ? <SeccionCatalogos /> : null}
      <SeccionConfig id="conf-eliminados" titulo="Eliminados">
        <Tarjeta className="pn-lista">
          <Fila href="/panel/eliminados" titulo="Eliminados" subtitulo="Ver y recuperar lo que se mandó a Eliminados" />
        </Tarjeta>
      </SeccionConfig>
      <button type="button" className="pn-conf-salir" title={sesion?.email ? `Entraste como ${sesion.email}` : undefined}
        onClick={() => { logout().catch(() => avisar("No se pudo cerrar la sesión en el servidor. Vuelve a intentarlo.")); }}>Cerrar sesión</button>
    </div>
  );
}
