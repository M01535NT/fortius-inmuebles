"use client";
import { Boton } from "@/components/panel/kit/boton";
import { Campo, formatoMonto } from "@/components/panel/kit/campo";
import { Desplegable } from "@/components/panel/kit/desplegable";
import {
  agregarFila, apagada, cambiarCelda, filaInfo, filasDe, puedeAgregar, quitarFila, textoAgregar, type Tabla,
} from "@/lib/panel/datos/formatos-tablas";
import { unirDictado } from "@/lib/panel/datos/formatos-dictado";

import { Dictar } from "./dictado";

/**
 * Tabla con filas de un formato: una tarjeta por fila con sus columnas. Las filas fijas llevan su nombre y no se quitan;
 * las opcionales («Otro cargo») y las libres se agregan y quitan. Las celdas de imagen se eligen entre `fotos`.
 */
export function EditorTabla({ tabla, valor, alCambiar, fotos = [], alFallarDictado }: {
  tabla: Tabla; valor: unknown; alCambiar: (filas: unknown) => void;
  fotos?: readonly { valor: string; etiqueta: string }[];
  /** Con él, las celdas de texto se pueden dictar (donde el navegador lo permite). */
  alFallarDictado?: (mensaje: string) => void;
}) {
  const filas = filasDe(tabla, valor);
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {filas.length === 0 ? <p className="pn-sub" style={{ margin: 0 }}>Sin registros todavía.</p> : null}
      {filas.map((f, i) => {
        const { nombre, columnas, quitable } = filaInfo(tabla, f, i);
        return (
          <fieldset key={typeof f.concepto === "string" ? f.concepto : i} className="pn-captura-fila">
            <legend>{nombre}</legend>
            {columnas.map((c) => {
              const texto = f[c.key] === undefined || f[c.key] === null ? "" : String(f[c.key]);
              const cambiar = (t: string) => alCambiar(cambiarCelda(tabla, filas, i, c, t));
              if (c.tipo === "imagen") {
                return fotos.length
                  ? <Desplegable key={c.key} etiqueta={c.label} valor={texto} vacio="Sin fotografía" opciones={fotos} alElegir={cambiar} />
                  : <p key={c.key} className="pn-sub" style={{ margin: 0 }}>{c.label}: sube una fotografía abajo para elegirla.</p>;
              }
              if (c.tipo === "opcion" && c.opciones) return <Desplegable key={c.key} etiqueta={c.label} valor={texto} vacio="Sin elegir" opciones={c.opciones} alElegir={cambiar} />;
              if (c.tipo === "largo") {
                return (
                  <div key={c.key} className="pn-campo">
                    <label htmlFor={`t-${i}-${c.key}`}>{c.label}</label>
                    <textarea id={`t-${i}-${c.key}`} rows={3} value={texto} onChange={(e) => cambiar(e.target.value)} />
                    {alFallarDictado ? <div><Dictar etiqueta={`${c.label} de ${nombre}`} alDictar={(t) => cambiar(unirDictado(texto, t))} alFallar={alFallarDictado} /></div> : null}
                  </div>
                );
              }
              const apagado = apagada(c, f);
              const dictable = c.tipo === "texto" && !apagado && alFallarDictado;
              return (
                <div key={c.key} style={{ display: "grid", gap: 4 }}>
                <Campo etiqueta={c.label} type={c.tipo === "fecha" ? "date" : "text"} dinero={c.tipo === "dinero"}
                    inputMode={c.tipo === "numero" || c.tipo === "dinero" ? "decimal" : undefined} disabled={apagado}
                    ayuda={apagado ? "No aplica: sin importe." : undefined}
                    value={c.tipo === "dinero" && texto ? formatoMonto(texto) : texto} autoComplete="off" onChange={(e) => cambiar(e.target.value)} />
                  {dictable ? <div><Dictar etiqueta={`${c.label} de ${nombre}`} alDictar={(t) => cambiar(unirDictado(texto, t))} alFallar={alFallarDictado} /></div> : null}
                </div>
              );
            })}
            {quitable ? <div><Boton variante="texto" onClick={() => alCambiar(quitarFila(tabla, filas, i))}>Quitar</Boton></div> : null}
          </fieldset>
        );
      })}
      {!tabla.fijas || tabla.opcionales ? (
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <Boton variante="secundario" deshabilitado={!puedeAgregar(tabla, filas)} onClick={() => alCambiar(agregarFila(tabla, filas))}>{textoAgregar(tabla, filas)}</Boton>
          {!tabla.fijas ? <span className="pn-sub" style={{ margin: 0 }}>{filas.length} de {tabla.max}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
