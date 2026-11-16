"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useColeccion } from "@/components/panel/datos/use-coleccion";
import { LineaTeDeben, TramitesDeHoy, useTeDeben, useTramitesDeHoy } from "@/components/panel/hoy/pendientes";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Boton } from "@/components/panel/kit/boton";
import { Cargando, EstadoError, Vacio } from "@/components/panel/kit/estados";
import { Fila, GrupoLista } from "@/components/panel/kit/lista";
import type { Evento, Lead } from "@/lib/domain/records";
import { aTexto, diaLargo } from "@/lib/panel/calendario";
import { citasDelDia, faltaPara, proximaFecha, siguienteCita } from "@/lib/panel/datos/agenda";
import { leerVencimientos } from "@/lib/panel/datos/colecciones";
import { completarTarea, resumenEspera, saludo, tareasDeHoy, vencimientosDeContratos, type ContratoServidor, type Vence } from "@/lib/panel/datos/hoy";
import type { Task } from "@/lib/tasks";
import { rutaCita } from "@/lib/panel/datos/relacionado";

type Bloque<T> = { cargando: boolean; error: string | null; datos: T[] };

/** Vencimientos de contratos con su propio estado y reintento: si falla, lo demás sigue a la vista (AUD-03, H4). */
function useVencimientos() {
  const [estado, setEstado] = useState<Bloque<ContratoServidor>>({ cargando: true, error: null, datos: [] });
  const [intento, setIntento] = useState(0);
  useEffect(() => {
    const control = new AbortController();
    leerVencimientos<ContratoServidor>(control.signal).then(
      (datos) => setEstado({ cargando: false, error: null, datos }),
      (e: unknown) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setEstado({ cargando: false, error: e instanceof Error ? e.message : "No se pudieron cargar los vencimientos.", datos: [] });
      },
    );
    return () => control.abort();
  }, [intento]);
  const reintentar = useCallback(() => { setEstado((s) => ({ ...s, cargando: true, error: null })); setIntento((n) => n + 1); }, []);
  return { ...estado, reintentar };
}

function ListaVence({ titulo, filas }: { titulo: string; filas: Vence[] }) {
  return (
    <GrupoLista titulo={titulo}>
      {filas.map((v) => <Fila key={v.id} titulo={v.titulo} detalle={v.detalle} tonoDetalle={v.tono} />)}
    </GrupoLista>
  );
}

/**
 * Hoy (PN-04): primer corte de solo lectura con lo que ya existe.
 * Orden (AUD-03, H1): lo vencido, quién espera respuesta, las citas de hoy por hora y lo que vence pronto.
 * Tareas y vencimientos de asuntos llegan con el modelo base.
 */
export default function Hoy() {
  const [hoy] = useState(() => new Date());
  const [ahora, setAhora] = useState(() => Date.now());
  const leads = useColeccion<Lead>("leads", { refrescarCada: 90_000 });
  const eventos = useColeccion<Evento>("eventos", { refrescarCada: 90_000 });
  const contratos = useVencimientos();
  const tareas = useColeccion<Task>("tareas", { refrescarCada: 90_000 });
  const tramites = useTramitesDeHoy(aTexto(hoy));
  const deben = useTeDeben(aTexto(hoy));
  const { avisar } = useAvisos();
  const [ocupado, setOcupado] = useState<string | null>(null);
  const deHoy = useMemo(() => tareasDeHoy(tareas.datos, aTexto(hoy)), [tareas.datos, hoy]);
  const hecho = async (t: Task) => {
    setOcupado(t.id);
    try {
      await tareas.guardar(t.id, completarTarea(t));
      avisar(`Hecho: ${t.titulo}`, { etiqueta: "Deshacer", alAccionar: () => {
        tareas.guardar(t.id, t).then(() => avisar("Se deshizo"), (e: unknown) => avisar(e instanceof Error ? e.message : "No se pudo deshacer."));
      } });
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se guardó. Vuelve a intentarlo.");
    } finally { setOcupado(null); }
  };

  useEffect(() => {
    const t = window.setInterval(() => setAhora(Date.now()), 60_000);
    return () => window.clearInterval(t);
  }, []);

  const espera = useMemo(() => resumenEspera(leads.datos, ahora), [leads.datos, ahora]);
  const citas = useMemo(() => citasDelDia(eventos.datos, aTexto(hoy)), [eventos.datos, hoy]);
  const vencen = useMemo(() => vencimientosDeContratos(contratos.datos, hoy), [contratos.datos, hoy]);
  // Sin citas hoy: decir lo que sigue (sugerencia 6, regla de Inicio).
  const proxima = useMemo(() => {
    const manana = aTexto(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1));
    const fecha = proximaFecha(eventos.datos, manana);
    if (!fecha) return null;
    const delDia = citasDelDia(eventos.datos, fecha);
    const primera = delDia[0];
    return { id: primera.id, texto: `${fecha === manana ? "mañana" : diaLargo(fecha)}${primera.hora ? ` a las ${primera.hora}` : ""}, ${primera.titulo}${delDia.length > 1 ? ` y ${delDia.length - 1} más` : ""}` };
  }, [eventos.datos, hoy]);
  // La cita que sigue va como tarjeta principal; las demás, en lista debajo (sugerencia 14).
  const minutosAhora = new Date(ahora).getHours() * 60 + new Date(ahora).getMinutes();
  const tipos = useMemo(() => Object.fromEntries(eventos.datos.map((e) => [e.id, e.tipo])), [eventos.datos]);
  const sigue = useMemo(() => siguienteCita(citas, tipos, minutosAhora), [citas, tipos, minutosAhora]);
  const restoCitas = useMemo(() => { const desde = sigue?.hora; return citas.filter((c) => c.id !== sigue?.id && !(desde && c.hora && c.hora < desde)); }, [citas, sigue]);
  const vencido = vencen.filter((v) => v.dias < 0);
  const porVencer = vencen.filter((v) => v.dias >= 0);

  const todoListo = !leads.cargando && !eventos.cargando && !contratos.cargando && !tareas.cargando && !tramites.cargando && !deben.cargando;
  const sinErrores = !leads.error && !eventos.error && !contratos.error && !tareas.error && !tramites.error && !deben.error;
  const nada = todoListo && sinErrores && !espera.cuantas && !citas.length && !vencen.length && !deHoy.length && !tramites.filas.length && !deben.resumen;

  return (
    <div className="pn-pagina" style={{ maxWidth: 760 }}>
      <h1 className="pn-h1">{saludo(hoy.getHours())}</h1>
      <p className="pn-sub">Hoy es {diaLargo(aTexto(hoy))}</p>

      <div style={{ display: "grid", gap: 20, marginTop: 20 }}>
        {nada ? <Vacio titulo="Nada pendiente por ahora" texto="Las tareas para hoy, los trámites en los que toca preguntar, las consultas sin responder, las citas, los contratos que vencen y lo que te deben aparecen aquí." icono="casa" /> : null}

        {vencido.length ? <ListaVence titulo="Vencido" filas={vencido} /> : null}

        {tareas.error ? <EstadoError titulo="No se pudieron leer las tareas" texto={tareas.error} alReintentar={tareas.reintentar} /> : null}
        {deHoy.length ? (
          <GrupoLista titulo={`Tareas · ${deHoy.length}`}>
            {deHoy.map((t) => (
              <Fila
                key={t.id}
                titulo={t.titulo}
                detalle={t.detalle}
                tonoDetalle={t.tono}
                acciones={<Boton variante="texto" deshabilitado={ocupado === t.id} onClick={() => void hecho(t.tarea)} aria-label={`Marcar hecha: ${t.titulo}`}>Hecho</Boton>}
              />
            ))}
          </GrupoLista>
        ) : null}

        <TramitesDeHoy estado={tramites} />

        {leads.error ? <EstadoError titulo="No se pudieron leer las consultas" texto={leads.error} alReintentar={leads.reintentar} /> : null}
        {espera.cuantas ? (
          <Link
            href="/panel/consultas"
            className={`pn-tarjeta pn-tono-${espera.urgencia === "error" ? "error" : "aviso"}`}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "14px 16px", minHeight: 44, textDecoration: "none" }}
          >
            <span style={{ display: "grid", gap: 2 }}>
              <span style={{ fontWeight: 600 }}>{espera.cuantas} {espera.cuantas === 1 ? "consulta sin responder" : "consultas sin responder"}</span>
              {espera.peor ? <span style={{ fontSize: 13 }}>{espera.cuantas === 1 ? "Espera" : "La que más espera lleva"} {espera.peor}</span> : null}
            </span>
            <span style={{ fontWeight: 600 }}>Responder</span>
          </Link>
        ) : null}

        {eventos.cargando ? <Cargando lineas={3} etiqueta="Cargando las citas de hoy" /> : null}
        {eventos.error ? <EstadoError titulo="No se pudo leer la agenda" texto={eventos.error} alReintentar={eventos.reintentar} /> : null}
        {!eventos.cargando && !eventos.error && sigue ? (
          <Link href={rutaCita(sigue.id)} className="pn-tarjeta pn-siguiente" aria-label={`Siguiente cita: ${sigue.titulo} a las ${sigue.hora}`}>
            <span className="pn-siguiente-hora">{sigue.hora}</span>
            <span style={{ display: "grid", gap: 2, minWidth: 0 }}>
              <span style={{ fontSize: 13, color: "var(--ink-muted)", fontWeight: 500 }}>Siguiente · {faltaPara(sigue.hora ?? "", minutosAhora)}</span>
              <span style={{ fontSize: 17, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sigue.titulo}</span>
              <span style={{ fontSize: 14, color: "var(--ink-muted)" }}>{[sigue.tipo, sigue.empalme ? "se empalma con otra cita" : null].filter(Boolean).join(" · ")}</span>
            </span>
          </Link>
        ) : null}
        {!eventos.cargando && !eventos.error && restoCitas.length ? (
          <section style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "0 4px" }}>
              <h2 className="pn-grupo" style={{ margin: 0 }}>{sigue ? "Más tarde y sin hora" : "Citas de hoy"}</h2>
              <Link href="/panel/agenda" className="pn-enlace">Ver agenda</Link>
            </div>
          <GrupoLista>
            {restoCitas.map((c) => (
              <Fila
                key={c.id}
                href={rutaCita(c.id)}
                titulo={c.titulo}
                subtitulo={c.tipo}
                lado={c.hora ?? "Sin hora"}
                detalle={c.empalme ? "Se empalma con otra cita" : undefined}
                tonoDetalle={c.empalme ? "aviso" : "normal"}
              />
            ))}
          </GrupoLista>
          </section>
        ) : null}
        {!nada && !eventos.cargando && !eventos.error && !citas.length ? (
          <section>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "0 4px" }}>
              <h2 className="pn-grupo" style={{ margin: 0 }}>Citas de hoy</h2>
              <Link href="/panel/agenda" className="pn-enlace">Ver agenda</Link>
            </div>
            <p className="pn-sub" style={{ padding: "0 4px" }}>
              {proxima ? <>Sin citas hoy. La próxima: <Link href={`/panel/agenda?cita=${encodeURIComponent(proxima.id)}`} style={{ color: "var(--accent)", fontWeight: 600 }}>{proxima.texto}</Link></> : "Sin citas hoy ni más adelante."}
            </p>
          </section>
        ) : null}

        {contratos.cargando ? <Cargando lineas={2} etiqueta="Cargando los vencimientos" /> : null}
        {contratos.error ? <EstadoError titulo="No se pudieron leer los vencimientos" texto={contratos.error} alReintentar={contratos.reintentar} /> : null}
        {porVencer.length ? <ListaVence titulo="Vence pronto" filas={porVencer} /> : null}

        <LineaTeDeben estado={deben} />
      </div>
    </div>
  );
}
