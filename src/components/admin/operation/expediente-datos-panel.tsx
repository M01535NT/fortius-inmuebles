"use client";
import * as React from "react";
import { Check, Pencil, X } from "@/components/admin/icons";
import { Button, Card, Pill } from "@/components/admin/kit";
import { inputClass } from "@/components/admin/ui";
import { errorMessage, fetchJson as json } from "@/lib/admin/store";
import { DATOS_EXPEDIENTE, type DatoExpediente, type DatoGuardado, type DatosGuardados } from "@/lib/formatos/datos-expediente";

/*
  Datos del expediente (titular, 29/10/2026): se confirman una sola vez y llenan todos los formatos
  del cliente. Los que propone la lectura de documentos traen su fuente (documento y página); el
  asesor los confirma, corrige o descarta. Confirmar llena solo celdas vacías de los formatos.
*/

type Respuesta = { datos: DatosGuardados; version: number | null; formatosActualizados?: number };
const GRUPOS = [...new Set(DATOS_EXPEDIENTE.map(dato => dato.grupo))];
const mostrar = (def: DatoExpediente, valor: string | number) => def.tipo === "fecha" && typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor)
  ? new Intl.DateTimeFormat("es-MX", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${valor}T00:00:00Z`)) : String(valor);

export function ExpedienteDatosPanel({ operationId, refresh = 0 }: { operationId: string; refresh?: number }) {
  const [estado, setEstado] = React.useState<Respuesta | null | undefined>(undefined);
  const [editando, setEditando] = React.useState<{ clave: string; valor: string } | null>(null);
  const [busy, setBusy] = React.useState(false), [error, setError] = React.useState(""), [notice, setNotice] = React.useState("");

  const cargar = React.useCallback(() => json<Respuesta>(`/api/admin/expedientes/${operationId}/datos`)
    .then(r => setEstado({ datos: r.datos ?? {}, version: r.version ?? null }))
    .catch(cause => { setEstado(null); setError(errorMessage(cause)); }), [operationId]);
  React.useEffect(() => { void cargar(); }, [cargar, refresh]);

  async function guardar(datos: DatosGuardados, mensaje: string) {
    if (!estado || busy) return false;
    setBusy(true); setError(""); setNotice("");
    try {
      const r = await json<Respuesta>(`/api/admin/expedientes/${operationId}/datos`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ version: estado.version, datos }) });
      setEstado({ datos: r.datos, version: r.version });
      const n = r.formatosActualizados ?? 0;
      setNotice(`${mensaje}${n ? ` Se llenaron ${n === 1 ? "1 formato" : `${n} formatos`}.` : ""}`);
      return true;
    } catch (cause) {
      setError(errorMessage(cause));
      // Otra persona guardó antes: se recarga para no pisar su cambio.
      if (/recarga/.test(errorMessage(cause))) void cargar();
      return false;
    } finally { setBusy(false); }
  }
  const ahora = () => new Date().toISOString();
  function aceptarEdicion(def: DatoExpediente) {
    if (!estado || !editando) return;
    const texto = editando.valor.trim();
    const datos = { ...estado.datos };
    if (!texto) delete datos[def.clave];
    else {
      const valor = def.tipo === "numero" ? Number(texto.replace(/[^\d.]/g, "")) : texto;
      if (def.tipo === "numero" && !Number.isFinite(valor as number)) { setError(`${def.etiqueta}: escribe un número.`); return; }
      // Escrito por el asesor: queda confirmado; conserva la fuente solo si el valor no cambió.
      const previo = estado.datos[def.clave];
      datos[def.clave] = { valor, estado: "confirmado", ...(previo?.fuente && previo.valor === valor ? { fuente: previo.fuente } : {}), actualizadoEl: ahora() };
    }
    void guardar(datos, texto ? "Dato confirmado." : "Dato quitado.").then(ok => { if (ok) setEditando(null); });
  }
  const confirmar = (claves: string[]) => {
    if (!estado) return;
    const datos = { ...estado.datos };
    for (const clave of claves) if (datos[clave]) datos[clave] = { ...datos[clave], estado: "confirmado", actualizadoEl: ahora() };
    void guardar(datos, claves.length === 1 ? "Dato confirmado." : `Se confirmaron ${claves.length} datos.`);
  };
  const descartar = (clave: string) => {
    if (!estado) return;
    const datos = { ...estado.datos };
    delete datos[clave];
    void guardar(datos, "Dato descartado.");
  };

  const datos = estado?.datos ?? {};
  const propuestos = Object.entries(datos).filter(([, dato]) => dato.estado === "propuesto").map(([clave]) => clave);
  return <Card className="p-5" aria-labelledby="datos-expediente-titulo">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        <h2 id="datos-expediente-titulo" className="m-0 text-lg font-semibold">Datos del expediente</h2>
        <p className="text-sm text-muted-foreground">Se confirman una sola vez y llenan todos los formatos de este cliente. Lo que ya se escribió en un formato no se cambia: si es distinto, el formato lo avisa.</p>
      </div>
      {propuestos.length > 1 && <Button variant="primary" disabled={busy} onClick={() => confirmar(propuestos)}><Check size={16} aria-hidden="true" />Confirmar los {propuestos.length} propuestos</Button>}
    </div>
    {notice && <p role="status" className="mt-3 text-sm text-muted-foreground">{notice}</p>}
    {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    {estado === undefined ? <p role="status" className="mt-4 text-sm text-muted-foreground">Consultando los datos…</p>
      : estado === null ? <div className="mt-4 flex items-center gap-3"><p className="text-sm">No se pudieron cargar los datos.</p><Button onClick={() => void cargar()}>Reintentar</Button></div>
      : <div className="mt-4 flex flex-col gap-5">{GRUPOS.map(grupo => <section key={grupo} aria-label={grupo}>
        <h3 className="m-0 mb-2 text-sm font-semibold text-muted-foreground">{grupo}</h3>
        <ul className="flex flex-col divide-y divide-border rounded-[12px] border border-border">{DATOS_EXPEDIENTE.filter(def => def.grupo === grupo).map(def => {
          const dato: DatoGuardado | undefined = datos[def.clave];
          const id = `dato-${def.clave}`;
          return <li key={def.clave} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <label htmlFor={id} className="text-sm font-semibold">{def.etiqueta}</label>
              {editando?.clave === def.clave
                ? <form className="flex flex-wrap gap-2" onSubmit={event => { event.preventDefault(); aceptarEdicion(def); }}>
                  <input id={id} className={`${inputClass} min-w-0 flex-1`} autoFocus type={def.tipo === "fecha" ? "date" : "text"} inputMode={def.tipo === "numero" ? "decimal" : undefined} maxLength={2000} value={editando.valor} onChange={event => setEditando({ clave: def.clave, valor: event.target.value })} onKeyDown={event => { if (event.key === "Escape") setEditando(null); }} />
                  <Button type="submit" variant="primary" disabled={busy}>Confirmar</Button>
                  <Button disabled={busy} onClick={() => setEditando(null)}>Cancelar</Button>
                </form>
                : dato ? <span className="text-sm [overflow-wrap:anywhere]">{mostrar(def, dato.valor)}</span>
                : <span className="text-sm text-muted-foreground">Sin dato{def.ayuda ? ` · ${def.ayuda}` : ""}</span>}
              {dato?.fuente && editando?.clave !== def.clave && <span className="text-xs text-muted-foreground">De {dato.fuente.documento ?? "un documento"}{dato.fuente.pagina ? `, página ${dato.fuente.pagina}` : ""}{dato.fuente.cita ? ` · «${dato.fuente.cita}»` : ""}</span>}
            </div>
            {editando?.clave !== def.clave && <span className="flex flex-wrap items-center gap-1">
              {dato && <Pill size="sm" tone={dato.estado === "confirmado" ? "success" : "warn"}>{dato.estado === "confirmado" ? "Confirmado" : "Propuesto"}</Pill>}
              {dato?.estado === "propuesto" && <Button variant="ghost" disabled={busy} aria-label={`Confirmar ${def.etiqueta.toLowerCase()}`} onClick={() => confirmar([def.clave])}><Check size={16} aria-hidden="true" />Confirmar</Button>}
              <Button variant="ghost" iconOnly disabled={busy} aria-label={`${dato ? "Corregir" : "Escribir"} ${def.etiqueta.toLowerCase()}`} onClick={() => setEditando({ clave: def.clave, valor: dato ? String(dato.valor) : "" })}><Pencil size={16} aria-hidden="true" /></Button>
              {dato?.estado === "propuesto" && <Button variant="ghost" iconOnly disabled={busy} aria-label={`Descartar ${def.etiqueta.toLowerCase()}`} onClick={() => descartar(def.clave)}><X size={16} aria-hidden="true" /></Button>}
            </span>}
          </li>;
        })}</ul>
      </section>)}</div>}
  </Card>;
}
