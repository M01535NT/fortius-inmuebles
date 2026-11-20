"use client";
import { useState } from "react";

import { Icono } from "@/components/panel/icons";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Boton } from "@/components/panel/kit/boton";
import { Campo, formatoMonto } from "@/components/panel/kit/campo";
import { Cargando, EstadoError, SinPermiso, Vacio } from "@/components/panel/kit/estados";
import { Hoja } from "@/components/panel/kit/hoja";
import { Contador, Fila, GrupoLista } from "@/components/panel/kit/lista";
import { ListaReordenable } from "@/components/panel/kit/reordenable";
import { Segmentado } from "@/components/panel/kit/segmentado";
import { SelectorFecha, SelectorHora } from "@/components/panel/kit/selector-fecha";
import { aTexto } from "@/lib/panel/calendario";
import "@/components/panel/asunto/asunto.css";
import "@/components/panel/asunto/vistas.css";
import "./kit.css";

type Paso = { id: string; nombre: string };
const PASOS: Paso[] = [
  { id: "p1", nombre: "Pedir el estado de cuenta" },
  { id: "p2", nombre: "Solicitar la carta de liberación" },
  { id: "p3", nombre: "Firmar la cancelación" },
  { id: "p4", nombre: "Inscribir en el Registro Público" },
];

/** Muestrario del kit (PN-01). Sirve para revisar cada pieza en claro y oscuro; no es una pantalla del negocio. */
export default function Muestrario() {
  const { avisar } = useAvisos();
  const [hoja, setHoja] = useState(false);
  const [vista, setVista] = useState<"deben" | "entregar" | "hist">("deben");
  const [plazo, setPlazo] = useState<10 | 15 | 20 | 25>(20);
  const [monto, setMonto] = useState("2500000");
  const [correo, setCorreo] = useState("nombre@correo");
  const [hoy] = useState(() => new Date());
  const [fecha, setFecha] = useState<string | null>(null);
  const [hora, setHora] = useState(10 * 60);
  const [pasos, setPasos] = useState(PASOS);
  const errorCorreo = correo.includes(".") ? undefined : "Falta el dominio. Ejemplo: nombre@correo.com";

  return (
    // Marco del modelo visual: barra de 52 px con el título y, debajo, las piezas en tarjetas de 12 px.
    <div className="as-vista kit-vista">
      <header className="as-vbar">
        <h1 className="as-h1-lista">Muestrario del kit</h1>
        <span className="as-cab-n kit-sub">Las piezas del panel en un solo lugar. Cambia el tema en Configuración para verlas en oscuro.</span>
      </header>
      <div className="kit-cuerpo">

      <section className="pn-bloque" aria-labelledby="k-botones">
        <h2 id="k-botones">Botones</h2>
        <div className="pn-fila-flex">
          <Boton>Agendar visita</Boton>
          <Boton variante="secundario">Ver detalle</Boton>
          <Boton variante="texto">Ver condiciones</Boton>
          <Boton variante="peligro">Cerrar asunto</Boton>
          <Boton deshabilitado>Deshabilitado</Boton>
          <Boton variante="secundario"><Icono nombre="compartir" tamano={18} />Compartir</Boton>
        </div>
      </section>

      <section className="pn-bloque" aria-labelledby="k-campos">
        <h2 id="k-campos">Campos</h2>
        <div style={{ display: "grid", gap: 16, maxWidth: 420 }}>
          <Campo etiqueta="Precio de venta" dinero inputMode="decimal" value={formatoMonto(monto)} onChange={(e) => setMonto(e.target.value.replace(/[^0-9.]/g, ""))} ayuda="Se escribe sin comas; el sistema las pone." />
          <Campo etiqueta="Correo electrónico" value={correo} onChange={(e) => setCorreo(e.target.value)} error={errorCorreo} />
          <Campo etiqueta="Folio del trámite" value="EXP-000412" disabled readOnly />
        </div>
      </section>

      <section className="pn-bloque" aria-labelledby="k-seg">
        <h2 id="k-seg">Control segmentado</h2>
        <div style={{ maxWidth: 460, display: "grid", gap: 12 }}>
          <Segmentado etiqueta="Ver" valor={vista} alElegir={setVista} opciones={[{ valor: "deben", etiqueta: "Te deben", cuenta: 5 }, { valor: "entregar", etiqueta: "Por entregar", cuenta: 2 }, { valor: "hist", etiqueta: "Historial" }]} />
          <Segmentado etiqueta="Plazo" valor={plazo} alElegir={setPlazo} opciones={[{ valor: 10, etiqueta: "10 años" }, { valor: 15, etiqueta: "15 años" }, { valor: 20, etiqueta: "20 años" }, { valor: 25, etiqueta: "25 años" }]} />
        </div>
      </section>

      <section className="pn-bloque" aria-labelledby="k-hoja">
        <h2 id="k-hoja">Hoja, ventana y avisos</h2>
        <div className="pn-fila-flex">
          <Boton variante="secundario" onClick={() => setHoja(true)}>Abrir hoja</Boton>
          <Boton variante="secundario" onClick={() => avisar("Cobro registrado. Faltan $116,000", { etiqueta: "Deshacer", alAccionar: () => avisar("Cobro deshecho") })}>Aviso con Deshacer</Boton>
          <Boton variante="secundario" onClick={() => avisar("Nombre guardado")}>Aviso simple</Boton>
        </div>
        <Hoja abierta={hoja} titulo="Movimiento nuevo" alCerrar={() => setHoja(false)}>
          <Campo etiqueta="Asunto" />
          <Campo etiqueta="Monto" dinero inputMode="decimal" />
          <Boton bloque onClick={() => { setHoja(false); avisar("Movimiento agregado"); }}>Agregar</Boton>
        </Hoja>
      </section>

      <section className="pn-bloque" aria-labelledby="k-listas">
        <h2 id="k-listas">Listas agrupadas</h2>
        <div style={{ maxWidth: 520, display: "grid", gap: 16 }}>
          <GrupoLista titulo="Vencido">
            <Fila titulo="Casa en Otay" subtitulo="Gasto · Avalúo" detalle="Venció hace 4 días" tonoDetalle="error" lado="$4,200" alPulsar={() => avisar("Se abriría el detalle")} />
            <Fila titulo="Departamento en Chapultepec" subtitulo="Comisión por la venta" detalle="Venció hace 3 días" tonoDetalle="error" lado="$116,000" ladoMenor="de $232,000" alPulsar={() => undefined} />
          </GrupoLista>
          <GrupoLista titulo="Esta semana">
            <Fila titulo="Casa de Mariana en Playas" subtitulo="Comisión por la venta" detalle="Vence el 20 nov" tonoDetalle="aviso" lado="$116,000" derecha={<Contador n={3} etiqueta="sin leer" />} alPulsar={() => undefined} />
          </GrupoLista>
        </div>
      </section>

      <section className="pn-bloque" aria-labelledby="k-estados">
        <h2 id="k-estados">Estados</h2>
        <div style={{ maxWidth: 520, display: "grid", gap: 16 }}>
          <Cargando lineas={2} />
          <Vacio titulo="Nadie te debe nada" texto="Todo está cobrado." icono="precio" />
          <EstadoError texto="Lo que escribiste sigue en pantalla. Vuelve a intentarlo en un momento." alReintentar={() => avisar("Reintentando")} />
          <SinPermiso />
        </div>
      </section>

      <section className="pn-bloque" aria-labelledby="k-fecha">
        <h2 id="k-fecha">Fecha y hora</h2>
        <div style={{ maxWidth: 380, display: "grid", gap: 12 }}>
          <SelectorFecha valor={fecha} alElegir={setFecha} hoy={hoy} />
          <SelectorHora valor={hora} alCambiar={setHora} />
          <p className="pn-sub" style={{ margin: 0 }}>Elegido: {fecha ?? aTexto(hoy)}</p>
        </div>
      </section>

      <section className="pn-bloque" aria-labelledby="k-orden">
        <h2 id="k-orden">Arrastrar y soltar</h2>
        <p className="pn-sub" style={{ margin: 0 }}>Arrastra con el ratón, o enfoca el asa y usa ↑ y ↓. El primer paso es obligatorio y no se mueve.</p>
        <div style={{ maxWidth: 520 }}>
          <ListaReordenable
            items={pasos}
            clave={(p) => p.id}
            nombre={(p) => p.nombre}
            etiqueta="Pasos de la guía"
            bloqueado={(p) => p.id === "p1"}
            alReordenar={(nuevo, movido, lugar) => { setPasos(nuevo); avisar(`${movido.nombre} pasó al lugar ${lugar}`, { etiqueta: "Deshacer", alAccionar: () => setPasos(pasos) }); }}
            renderItem={(p, { asa, indice }) => (
              <div className="pn-fila" style={{ borderTop: indice === 0 ? "1px solid var(--border)" : undefined, background: "var(--card)" }}>
                <span className="pn-fila-cuerpo"><span className="pn-fila-titulo">{p.nombre}</span>{p.id === "p1" ? <span className="pn-fila-sub">Obligatorio</span> : null}</span>
                {asa}
              </div>
            )}
          />
        </div>
      </section>

      <section className="pn-bloque" aria-labelledby="k-atajos">
        <h2 id="k-atajos">Atajos</h2>
        <p className="pn-sub" style={{ margin: 0 }}>
          <kbd className="pn-kbd">Ctrl</kbd> <kbd className="pn-kbd">K</kbd> abre «Buscar o crear» desde cualquier pantalla del panel.
        </p>
      </section>
      </div>
    </div>
  );
}
