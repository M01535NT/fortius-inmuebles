"use client";
import { useEffect, useMemo, useState } from "react";

import { usePreferencia } from "@/components/panel/almacen";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Boton } from "@/components/panel/kit/boton";
import { Desplegable } from "@/components/panel/kit/desplegable";
import { Cargando, EstadoError, SinPermiso, Vacio } from "@/components/panel/kit/estados";
import { Ficha } from "@/components/panel/kit/ficha";
import { Fila, Tarjeta } from "@/components/panel/kit/lista";
import { ListaReordenable } from "@/components/panel/kit/reordenable";
import { HojaAdaptable } from "@/components/panel/ui/hoja-adaptable";
import type { Asesor } from "@/lib/domain/records";
import { fichaAsesor, ordenarEquipo } from "@/lib/panel/datos/configuracion";
import { conFicha, cuentasParaLigar, leerCuentas, ligarCuenta, rolDe, unirCuentas, type Cuenta } from "@/lib/panel/datos/configuracion-cuentas";
import {
  alcanceDe, CLAVE_ORDEN_EQUIPO, escribirOrdenEquipo, fichasParaInvitar, ordenEquipoGuardado, papelDeCuenta, QUE_VE, type Invitacion,
} from "@/lib/panel/datos/configuracion-invitaciones";

import { InvitarEquipo } from "./invitar";

import { FotoAsesor, SeccionConfig } from "./partes";

/**
 * Equipo (solo el director): fichas de asesor con la cuenta que usa cada quien para entrar.
 * Ligar una cuenta a su ficha usa la ruta que ya existe. Invitar se prepara sin enviar nada; quitar acceso y cambiar
 * el papel no tienen ruta todavía (PN-10). El orden de la lista es solo presentación: se recuerda en este navegador.
 */
export function SeccionEquipo({ esDirector, asesores, cargando, error, alReintentar, miId }: {
  esDirector: boolean; asesores: Asesor[]; cargando: boolean; error: string | null; alReintentar: () => void; miId: string | null;
}) {
  const { avisar } = useAvisos();
  const [abierto, setAbierto] = useState<Asesor | null>(null);
  // Se conserva el último abierto para que la hoja no se vacíe mientras se cierra.
  const [visto, setVisto] = useState<Asesor | null>(null);
  const abrir = (a: Asesor) => { setVisto(a); setAbierto(a); };
  const [ordenGuardado, guardarOrden] = usePreferencia(CLAVE_ORDEN_EQUIPO, "");
  const lista = useMemo(() => ordenEquipoGuardado(ordenarEquipo(asesores), ordenGuardado), [asesores, ordenGuardado]);
  const [preparadas, setPreparadas] = useState<Invitacion[]>([]);
  const [invitando, setInvitando] = useState(false);
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
  const paraInvitar = useMemo(() => fichasParaInvitar(lista, new Set(porAsesor.keys()), preparadas), [lista, porAsesor, preparadas]);

  return (
    <SeccionConfig id="conf-equipo" titulo={esDirector && !cargando && !error ? `Equipo · ${activos}` : "Equipo"}
      accion={esDirector ? <button type="button" className="pn-conf-cab-btn" aria-disabled={!cuentas || undefined} onClick={() => { if (cuentas) setInvitando(true); }}>Invitar</button> : undefined}>
      {!esDirector ? <SinPermiso texto="El equipo lo administra el director." />
        : cargando ? <Cargando lineas={3} etiqueta="Cargando el equipo" />
        : error ? <EstadoError texto={error} alReintentar={alReintentar} />
        : !lista.length ? <Vacio titulo="Todavía no hay asesores" texto="Los asesores aparecen aquí." icono="cliente" />
        : (
          <Tarjeta className="pn-lista">
            <ListaReordenable items={lista} clave={(a) => a.id} nombre={(a) => a.nombre} etiqueta="Equipo"
              alReordenar={(nuevo) => guardarOrden(escribirOrdenEquipo(nuevo))}
              renderItem={(a, { asa }) => (
                <div className="pn-conf-equipo-fila">
                  {asa}
                  <Fila alPulsar={() => { setEleccion(""); abrir(a); }}
                    izquierda={<FotoAsesor asesor={a} nombre={a.nombre} chica />}
                    titulo={a.id === miId ? `${a.nombre} (tú)` : a.nombre}
                    subtitulo={a.cargo || "Asesor"}
                    detalle={a.activo === false ? "Inactivo" : accesoDe(a.id)}
                    tonoDetalle={a.activo === false || (cuentas && !porAsesor.has(a.id)) ? "aviso" : "normal"} />
                </div>
              )} />
          </Tarjeta>
        )}
      {esDirector && lista.length > 1 && !cargando && !error ? (
        <p className="pn-conf-intro">Arrastra para acomodar la lista a tu gusto (o Alt con las flechas). El orden no cambia lo que cada quien ve.</p>
      ) : null}
      {esDirector && sinFicha.length ? (
        <div style={{ marginTop: 12 }}>
          <h3 className="pn-grupo">Otras cuentas</h3>
          <Tarjeta className="pn-lista">
            {sinFicha.map((c) => <Fila key={c.user_id} izquierda={<FotoAsesor nombre={c.email} chica />} titulo={c.email || "Cuenta sin correo"} subtitulo={`${rolDe(c)} · ${alcanceDe(c)}`} />)}
          </Tarjeta>
        </div>
      ) : null}
      {esDirector && errorCuentas ? (
        <div className="pn-conf-acciones" style={{ marginTop: 8, alignItems: "center" }}>
          <p className="pn-conf-nota">No se pudo leer quién tiene cuenta para entrar; la lista de asesores sí está al día.</p>
          <Boton variante="texto" onClick={() => setIntento((n) => n + 1)}>Reintentar</Boton>
        </div>
      ) : null}
      {esDirector ? (
        <InvitarEquipo abierta={invitando} alCerrar={() => setInvitando(false)} cuentas={cuentas} fichas={paraInvitar} nombreFicha={(id) => nombreFicha.get(id)} preparadas={preparadas}
          alPreparar={(i) => setPreparadas((xs) => [...xs, i])}
          alQuitar={(correo) => setPreparadas((xs) => xs.filter((x) => x.correo !== correo))}
          alDevolver={(i) => setPreparadas((xs) => (xs.some((x) => x.correo === i.correo) ? xs : [...xs, i]))} />
      ) : null}
      <HojaAdaptable abierta={abierto !== null} alCerrar={() => setAbierto(null)} titulo={visto?.nombre ?? "Asesor"} descripcion={visto?.cargo}>
        {visto ? (
          <>
            <Ficha secciones={[
              ...fichaAsesor(visto),
              ...(cuentas ? [{ titulo: "Cuenta para entrar", datos: ligadas.length
                ? ligadas.flatMap((c) => [
                    { etiqueta: rolDe(c), valor: c.email || "Cuenta sin correo" },
                    { etiqueta: "Qué ve", valor: c.active ? QUE_VE[papelDeCuenta(c)] : "No puede entrar al panel." },
                  ])
                : [{ etiqueta: "Cuenta", valor: "Sin cuenta para entrar", falta: true }] }] : []),
            ]} />
            {ligadas.length ? <p className="pn-conf-nota" style={{ marginTop: 12 }}>Cambiar el papel o quitar el acceso todavía no se hace desde aquí.</p> : null}
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
