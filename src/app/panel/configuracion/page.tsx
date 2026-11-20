"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { SeccionCatalogos } from "@/components/panel/configuracion/catalogos";
import { MarcoAjustes, useSeccionesAjustes } from "@/components/panel/configuracion/marco";
import { SeccionPerfil } from "@/components/panel/configuracion/perfil";
import { SeccionApariencia, SeccionAvisos } from "@/components/panel/configuracion/preferencias";
import { SeccionEquipo } from "@/components/panel/configuracion/equipo";
import { SeccionPrincipal } from "@/components/panel/configuracion/partes";
import { SeccionSeguridad } from "@/components/panel/configuracion/seguridad";
import { useColeccion } from "@/components/panel/datos/use-coleccion";
import { useAvisos } from "@/components/panel/kit/avisos";
import type { Asesor } from "@/lib/domain/records";
import { elegirMiFicha, leerMiFicha } from "@/lib/panel/datos/configuracion-cuentas";
import { useSession } from "@/lib/panel/legado/sesion";

/**
 * Configuración como el modelo visual («Ajustes»): Perfil, Seguridad, Apariencia, Avisos, Equipo y Catálogos (solo el director),
 * una a la vez con ?ver=. La cuenta del director es la misma persona que su ficha del equipo: si todavía no tiene,
 * «Perfil» le deja elegir cuál es.
 */
export default function Configuracion() {
  return <Suspense fallback={null}><Ajustes /></Suspense>;
}

function Ajustes() {
  const sesion = useSession();
  const { avisar } = useAvisos();
  const params = useSearchParams();
  const { todas, director: esDirector } = useSeccionesAjustes();
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

  const pedida = params.get("ver");
  const actual = todas.find((i) => i.clave === pedida) ?? todas[0];

  return (
    <MarcoAjustes actual={actual?.clave ?? null} abierta={Boolean(pedida)}>
      <SeccionPrincipal subtitulo={actual?.subtitulo}>
        {actual?.clave === "seguridad" ? <SeccionSeguridad />
          : actual?.clave === "apariencia" ? <SeccionApariencia />
          : actual?.clave === "avisos" ? <SeccionAvisos />
          : actual?.clave === "equipo" ? (
            // Al ligar tu ficha se vuelve a leer quién tiene cuenta, para que dejes de salir «sin cuenta para entrar».
            <SeccionEquipo key={`equipo-${vuelta}`} esDirector={esDirector} asesores={equipo.datos} cargando={equipo.cargando} error={equipo.error} alReintentar={equipo.reintentar} miId={miId ?? null} />
          )
          : actual?.clave === "catalogos" && esDirector ? <SeccionCatalogos />
          : (
            <SeccionPerfil
              correo={sesion?.email} nombreSesion={sesion?.name} miAsesor={miAsesor}
              cargando={equipo.cargando} error={equipo.error} alReintentar={equipo.reintentar} guardar={equipo.guardar}
              fichasLibres={esDirector ? libres : []} alElegirFicha={esDirector ? esMia : undefined}
            />
          )}
      </SeccionPrincipal>
    </MarcoAjustes>
  );
}
