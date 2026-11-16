import type { ReactNode } from "react";

import { Icono, type NombreIcono } from "../icons";
import { Boton } from "./boton";

/** Esqueleto para lo que está cargando. `lineas` filas del alto de una fila de lista. */
export function Cargando({ lineas = 3, etiqueta = "Cargando" }: { lineas?: number; etiqueta?: string }) {
  return (
    <div role="status" aria-busy="true" aria-label={etiqueta} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {Array.from({ length: lineas }, (_, i) => <span key={i} className="pn-esqueleto" style={{ height: 56 }} />)}
    </div>
  );
}

/** Vacío: una invitación a actuar, no un adorno. */
export function Vacio({ titulo, texto, icono = "expediente", accion }: { titulo: string; texto?: string; icono?: NombreIcono; accion?: ReactNode }) {
  return (
    <div className="pn-estado">
      <Icono nombre={icono} tamano={32} />
      <h3>{titulo}</h3>
      {texto ? <p style={{ margin: 0, maxWidth: 420 }}>{texto}</p> : null}
      {accion}
    </div>
  );
}

/** Error: dice qué pasó y cómo seguir. No se disculpa ni culpa al usuario; lo capturado sigue en pantalla. */
export function EstadoError({ titulo = "No se pudo terminar", texto, alReintentar }: { titulo?: string; texto: string; alReintentar?: () => void }) {
  return (
    <div className="pn-estado" role="alert">
      <Icono nombre="alerta" tamano={32} />
      <h3>{titulo}</h3>
      <p style={{ margin: 0, maxWidth: 420 }}>{texto}</p>
      {alReintentar ? <Boton variante="secundario" onClick={alReintentar}>Reintentar</Boton> : null}
    </div>
  );
}

/** Permiso insuficiente: dice quién puede y no ofrece una acción que fallaría. */
export function SinPermiso({ texto = "Esta parte la ve solo el director. Pídele acceso si la necesitas." }: { texto?: string }) {
  return (
    <div className="pn-estado">
      <Icono nombre="llave" tamano={32} />
      <h3>No tienes acceso a esto</h3>
      <p style={{ margin: 0, maxWidth: 420 }}>{texto}</p>
    </div>
  );
}
