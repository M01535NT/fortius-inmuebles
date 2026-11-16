"use client";
import { useEffect, useMemo, useState } from "react";

import { useAvisos } from "@/components/panel/kit/avisos";
import { Boton } from "@/components/panel/kit/boton";
import { Desplegable } from "@/components/panel/kit/desplegable";
import { Cargando, EstadoError, SinPermiso, Vacio } from "@/components/panel/kit/estados";
import { Ficha } from "@/components/panel/kit/ficha";
import { Fila, GrupoLista } from "@/components/panel/kit/lista";
import { HojaAdaptable } from "@/components/panel/ui/hoja-adaptable";
import type { Asesor } from "@/lib/domain/records";
import { fichaAsesor, ordenarEquipo } from "@/lib/panel/datos/configuracion";
import { conFicha, cuentasParaLigar, leerCuentas, ligarCuenta, rolDe, unirCuentas, type Cuenta } from "@/lib/panel/datos/configuracion-cuentas";

import { FotoAsesor, SeccionConfig } from "./partes";

/**
 * Equipo (solo el director): fichas de asesor con la cuenta que usa cada quien para entrar.
 * Ligar una cuenta a su ficha usa la ruta que ya existe; invitar, quitar acceso y roles no tienen ruta todavía (PN-10).
 */
export function SeccionEquipo({ esDirector, asesores, cargando, error, alReintentar, miId }: {
  esDirector: boolean; asesores: Asesor[]; cargando: boolean; error: string | null; alReintentar: () => void; miId: string | null;
}) {
  const { avisar } = useAvisos();
  const [abierto, setAbierto] = useState<Asesor | null>(null);
  // Se conserva el último abierto para que la hoja no se vacíe mientras se cierra.
  const [visto, setVisto] = useState<Asesor | null>(null);
  const abrir = (a: Asesor) => { setVisto(a); setAbierto(a); };
  const lista = useMemo(() => ordenarEquipo(asesores), [asesores]);
  const nombreFicha = useMemo(() => new Map(lista.map((a) => [a.id, a.nombre])), [lista]);
  // Si las cuentas no se leen, la lista de fichas sigue sirviendo.
  const [cuentas, setCuentas] = useState<Cuenta[] | null>(null);
  const [errorCuentas, setErrorCuentas] = useState(false);
  const [intento, setIntento] = useState(0);
  useEffect(() => {
    if (!esDirector) return;
    const control = new AbortController();
    leerCuentas(control.signal).then((c) => { setCuentas(c); setErrorCuentas(false); }, () => { if (!control.signal.aborted) setErrorCuentas(true); });
    return () => control.abort();
  }, [esDirector, intento]);
  const { porAsesor, sinFicha } = useMemo(() => unirCuentas(lista, cuentas ?? []), [lista, cuentas]);
  const accesoDe = (id: string) => {
    if (!cuentas) return undefined;
    const c = porAsesor.get(id);
    return c?.length ? c.map((x) => `${x.email} · ${rolDe(x)}`).join(", ") : "Sin cuenta para entrar";
  };
  const activos = lista.filter((a) => a.activo !== false).length;

  const [eleccion, setEleccion] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const ligar = async (asesor: Asesor, userId: string) => {
    const cuenta = cuentas?.find((c) => c.user_id === userId);
    if (!cuenta || ocupado) return;
    const previo = cuenta.asesor_id;
    setOcupado(true);
    try {
      await ligarCuenta(userId, asesor.id);
      setCuentas((cs) => (cs ? conFicha(cs, userId, asesor.id) : cs));
      setEleccion("");
      // Deshacer solo si antes estaba en otra ficha activa: no hay ruta para dejar una cuenta sin ficha.
      const volver = previo && lista.some((a) => a.id === previo && a.activo !== false) ? previo : null;
      avisar(`${cuenta.email} ya entra como ${asesor.nombre}.`, volver ? {
        etiqueta: "Deshacer",
        alAccionar: () => {
          ligarCuenta(userId, volver).then(
            () => { setCuentas((cs) => (cs ? conFicha(cs, userId, volver) : cs)); avisar("Se deshizo"); },
            (e: unknown) => avisar(e instanceof Error ? e.message : "No se pudo deshacer."),
          );
        },
      } : undefined);
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se ligó la cuenta.");
      setIntento((n) => n + 1);
    } finally { setOcupado(false); }
  };

  const candidatas = visto && cuentas ? cuentasParaLigar(cuentas, visto.id) : [];
  const ligadas = visto ? porAsesor.get(visto.id) ?? [] : [];

  return (
    <SeccionConfig id="conf-equipo" titulo="Equipo" intro={esDirector && !cargando && !error ? `${activos} ${activos === 1 ? "asesor activo" : "asesores activos"}.` : undefined}>
      {!esDirector ? <SinPermiso texto="El equipo lo administra el director." />
        : cargando ? <Cargando lineas={3} etiqueta="Cargando el equipo" />
        : error ? <EstadoError texto={error} alReintentar={alReintentar} />
        : !lista.length ? <Vacio titulo="Todavía no hay asesores" texto="Los asesores aparecen aquí." icono="cliente" />
        : (
          <GrupoLista>
            {lista.map((a) => (
              <Fila key={a.id} alPulsar={() => { setEleccion(""); abrir(a); }}
                izquierda={<FotoAsesor asesor={a} nombre={a.nombre} chica />}
                titulo={a.id === miId ? `${a.nombre} (tú)` : a.nombre}
                subtitulo={a.cargo || "Asesor"}
                detalle={a.activo === false ? "Inactivo" : accesoDe(a.id)}
                tonoDetalle={a.activo === false || (cuentas && !porAsesor.has(a.id)) ? "aviso" : "normal"} />
            ))}
          </GrupoLista>
        )}
      {esDirector && sinFicha.length ? (
        <div style={{ marginTop: 12 }}>
          <GrupoLista titulo="Otras cuentas">
            {sinFicha.map((c) => <Fila key={c.user_id} izquierda={<FotoAsesor nombre={c.email} chica />} titulo={c.email || "Cuenta sin correo"} subtitulo={rolDe(c)} />)}
          </GrupoLista>
        </div>
      ) : null}
      {esDirector && errorCuentas ? (
        <div className="pn-conf-acciones" style={{ marginTop: 8, alignItems: "center" }}>
          <p className="pn-conf-nota">No se pudo leer quién tiene cuenta para entrar; la lista de asesores sí está al día.</p>
          <Boton variante="texto" onClick={() => setIntento((n) => n + 1)}>Reintentar</Boton>
        </div>
      ) : null}
      {esDirector ? (
        <div className="pn-conf-caja" style={{ marginTop: 12 }}>
          <p className="pn-conf-nota">Invitar a alguien nuevo llega pronto.</p>
          <div className="pn-conf-acciones">
            <Boton variante="secundario" deshabilitado title="Llega pronto">Invitar a alguien</Boton>
          </div>
        </div>
      ) : null}
      <HojaAdaptable abierta={abierto !== null} alCerrar={() => setAbierto(null)} titulo={visto?.nombre ?? "Asesor"} descripcion={visto?.cargo}>
        {visto ? (
          <>
            <Ficha secciones={[
              ...fichaAsesor(visto),
              ...(cuentas ? [{ titulo: "Cuenta para entrar", datos: ligadas.length
                ? ligadas.map((c) => ({ etiqueta: rolDe(c), valor: c.email || "Cuenta sin correo" }))
                : [{ etiqueta: "Cuenta", valor: "Sin cuenta para entrar", falta: true }] }] : []),
            ]} />
            {cuentas && visto.activo !== false ? (
              candidatas.length ? (
                <form noValidate style={{ display: "grid", gap: 12, marginTop: 16 }}
                  onSubmit={(e) => { e.preventDefault(); if (eleccion) void ligar(visto, eleccion); }}>
                  <Desplegable etiqueta="Ligar la cuenta de" valor={eleccion} vacio="Elige una cuenta"
                    opciones={candidatas.map((c) => ({ valor: c.user_id, etiqueta: c.asesor_id ? `${c.email} (hoy con ${nombreFicha.get(c.asesor_id) ?? "otro asesor"})` : c.email }))}
                    alElegir={setEleccion}
                    ayuda={`Quien entre con esa cuenta trabajará como ${visto.nombre}.`} />
                  <div className="pn-conf-acciones">
                    <Boton type="submit" deshabilitado={!eleccion || ocupado}>{ocupado ? "Ligando…" : "Ligar cuenta"}</Boton>
                  </div>
                </form>
              ) : <p className="pn-conf-nota" style={{ marginTop: 16 }}>No hay otra cuenta para ligar.</p>
            ) : cuentas ? <p className="pn-conf-nota" style={{ marginTop: 16 }}>Este asesor está inactivo: no se le puede ligar una cuenta.</p> : null}
          </>
        ) : null}
      </HojaAdaptable>
    </SeccionConfig>
  );
}
