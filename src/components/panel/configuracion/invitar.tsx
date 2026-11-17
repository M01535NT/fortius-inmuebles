"use client";
import { useState } from "react";

import { useAvisos } from "@/components/panel/kit/avisos";
import { Boton } from "@/components/panel/kit/boton";
import { Campo } from "@/components/panel/kit/campo";
import { Desplegable } from "@/components/panel/kit/desplegable";
import { Fila, GrupoLista } from "@/components/panel/kit/lista";
import { HojaAdaptable } from "@/components/panel/ui/hoja-adaptable";
import {
  crearInvitacion, PAPELES, QUE_VE, resumenInvitacion, validarInvitacion,
  type BorradorInvitacion, type Invitacion,
} from "@/lib/panel/datos/configuracion-invitaciones";
import type { Cuenta } from "@/lib/panel/datos/configuracion-cuentas";

const VACIO: BorradorInvitacion = { correo: "", papel: "asesor", asesorId: "" };

/**
 * Invitar a alguien (solo el director). Todavía no hay envío (PN-10): la invitación se prepara y se queda en esta
 * pantalla, sin mandar ningún correo. Las preparadas viven solo en memoria: no se guardan correos en el navegador.
 */
export function InvitarEquipo({ abierta, alCerrar, cuentas, fichas, nombreFicha, preparadas, alPreparar, alQuitar, alDevolver }: {
  /** La abre «Invitar», a la derecha del título del grupo Equipo (boceto). */
  abierta: boolean;
  alCerrar: () => void;
  cuentas: readonly Cuenta[] | null;
  fichas: readonly { id: string; nombre: string }[];
  nombreFicha: (id: string) => string | undefined;
  preparadas: readonly Invitacion[];
  alPreparar: (i: Invitacion) => void;
  alQuitar: (correo: string) => void;
  alDevolver: (i: Invitacion) => void;
}) {
  const { avisar } = useAvisos();
  const [b, setB] = useState<BorradorInvitacion>(VACIO);
  const [error, setError] = useState<string | null>(null);

  // Cada vez que se abre, empieza vacía.
  const [vista, setVista] = useState(abierta);
  if (abierta !== vista) { setVista(abierta); if (abierta) { setB(VACIO); setError(null); } }
  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validarInvitacion(b, cuentas ?? [], preparadas);
    setError(err);
    if (err) return;
    const inv = crearInvitacion(b);
    alPreparar(inv);
    alCerrar();
    avisar(`Invitación para ${inv.correo} preparada. No se envió ningún correo.`, { etiqueta: "Deshacer", alAccionar: () => alQuitar(inv.correo) });
  };
  const quitar = (inv: Invitacion) => {
    alQuitar(inv.correo);
    avisar(`Se quitó la invitación para ${inv.correo}.`, { etiqueta: "Deshacer", alAccionar: () => alDevolver(inv) });
  };

  return (
    <>
      {preparadas.length ? (
        <div style={{ marginTop: 12 }}>
          <GrupoLista titulo="Invitaciones preparadas">
            {preparadas.map((i) => (
              <Fila key={i.correo} titulo={i.correo} subtitulo={resumenInvitacion(i, nombreFicha)} detalle="Sin enviar" tonoDetalle="aviso"
                acciones={<Boton variante="texto" onClick={() => quitar(i)} aria-label={`Quitar la invitación para ${i.correo}`}>Quitar</Boton>} />
            ))}
          </GrupoLista>
        </div>
      ) : null}
      <p className="pn-conf-intro">«Invitar» prepara la invitación con el correo y el papel de la persona. Por ahora no se envía: el correo de invitación llega pronto.</p>
      <HojaAdaptable abierta={abierta} alCerrar={alCerrar} titulo="Invitar a alguien" descripcion="No se envía ningún correo todavía.">
        <form noValidate onSubmit={enviar} style={{ display: "grid", gap: 16 }}>
          <Campo etiqueta="Correo" type="email" inputMode="email" autoComplete="off" maxLength={254} value={b.correo} error={error ?? undefined} autoFocus
            onChange={(e) => { setB((x) => ({ ...x, correo: e.target.value })); if (error) setError(null); }} />
          <div style={{ display: "grid", gap: 6 }}>
            <Desplegable etiqueta="Papel" valor={b.papel} opciones={PAPELES} alElegir={(v) => { if (v) setB((x) => ({ ...x, papel: v, asesorId: v === "director" ? "" : x.asesorId })); }} />
            <p className="pn-conf-nota">{QUE_VE[b.papel]}</p>
          </div>
          {b.papel === "asesor" ? (
            fichas.length ? (
              <Desplegable etiqueta="Entra como" valor={b.asesorId} vacio="Sin ficha por ahora" opciones={fichas.map((f) => ({ valor: f.id, etiqueta: f.nombre }))}
                alElegir={(v) => setB((x) => ({ ...x, asesorId: v }))}
                ayuda="La ficha de asesor con la que va a trabajar. Se puede ligar después." />
            ) : <p className="pn-conf-nota">Todas las fichas activas ya tienen cuenta. Se puede ligar una ficha después.</p>
          ) : null}
          <div className="pn-conf-acciones">
            <Boton type="submit">Preparar invitación</Boton>
            <Boton type="button" variante="texto" onClick={alCerrar}>Cancelar</Boton>
          </div>
        </form>
      </HojaAdaptable>
    </>
  );
}
