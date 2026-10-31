"use client";
import * as React from "react";
import { ArrowLeftRight, Check, Paste, Pencil, X } from "@/components/admin/icons";
import { Button, Card, Pill } from "@/components/admin/kit";
import { inputClass, textareaClass } from "@/components/admin/ui";
import { errorMessage, fetchJson as json } from "@/lib/admin/store";
import { DATOS_EXPEDIENTE, type DatoExpediente, type DatoGuardado, type DatosGuardados } from "@/lib/formatos/datos-expediente";
import { curpValida, datosDeCurp, domicilioDesde, rfcValido } from "@/lib/formatos/deducir";
import { proponerReconocido, reconocerTexto } from "@/lib/formatos/reconocer";
import { CpHelper } from "@/components/admin/cp-helper";

/*
  Datos del expediente (titular, 29/10/2026): se confirman una sola vez y llenan todos los formatos
  del cliente. Los que salen de la lectura de documentos traen su fuente (documento y página) y
  quedan por confirmar; el asesor los confirma, corrige o descarta. Confirmar llena solo celdas
  vacías de los formatos. Regla del titular: la pantalla nunca dice «propuesto» ni que algo lo hizo la IA.

  Captura sin repetir (CSR, 31/10/2026): los datos de la ficha de la persona y del inmueble llegan
  solos con su origen; la CURP deduce la fecha de nacimiento; el código postal completa el
  domicilio; un texto pegado se reconoce; y otra operación del mismo cliente o inmueble presta
  sus datos confirmados. Todo lo que no escribe el asesor entra «Por confirmar».
*/

type Respuesta = { datos: DatosGuardados; version: number | null; formatosActualizados?: number };
type Expediente = { id: string; folio: string; operacion: string; cliente_id: string | null; propiedad_slug: string | null };
const GRUPOS = [...new Set(DATOS_EXPEDIENTE.map(dato => dato.grupo))];
const mostrar = (def: DatoExpediente, valor: string | number) => def.tipo === "fecha" && typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor)
  ? new Intl.DateTimeFormat("es-MX", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${valor}T00:00:00Z`)) : String(valor);
const esCurp = (clave: string) => /curp/i.test(clave), esRfc = (clave: string) => /rfc/i.test(clave), esDomicilio = (clave: string) => /domicilio|direccion/i.test(clave);
/** La fecha de nacimiento que acompaña a cada CURP del diccionario. */
const NACIMIENTO_DE: Record<string, string> = { propietarioCurp: "propietarioNacimiento" };
/** Cada CURP presente trae su fecha de nacimiento «Por confirmar» si todavía no hay una (CSR-03). */
function conNacimientoDeCurp(datos: DatosGuardados, ahora: string): DatosGuardados {
  const siguiente = { ...datos };
  for (const [curpClave, nacimientoClave] of Object.entries(NACIMIENTO_DE)) {
    const curp = siguiente[curpClave];
    if (!curp || siguiente[nacimientoClave]) continue;
    const deducido = datosDeCurp(String(curp.valor));
    if (deducido) siguiente[nacimientoClave] = { valor: deducido.fechaNacimiento, estado: "propuesto", fuente: { documento: "CURP del propietario" }, actualizadoEl: ahora };
  }
  return siguiente;
}

export function ExpedienteDatosPanel({ operationId, refresh = 0, solo, onSaved, titulo = "Datos del expediente" }: {
  operationId: string; refresh?: number;
  /** Mostrar solo estas claves (la ventana del documento pide las que le faltan). */
  solo?: string[];
  /** Se guardó algo: quien incrusta el panel vuelve a leer los datos. */
  onSaved?: () => void;
  titulo?: string;
}) {
  const [estado, setEstado] = React.useState<Respuesta | null | undefined>(undefined);
  const [editando, setEditando] = React.useState<{ clave: string; valor: string } | null>(null);
  const [busy, setBusy] = React.useState(false), [error, setError] = React.useState(""), [notice, setNotice] = React.useState("");
  const [pegando, setPegando] = React.useState(false), [texto, setTexto] = React.useState("");
  const [otras, setOtras] = React.useState<Expediente[] | null | undefined>(undefined);

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
      onSaved?.();
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
    let texto = editando.valor.trim();
    const datos = { ...estado.datos };
    let mensaje = texto ? "Dato confirmado." : "Dato quitado.";
    if (!texto) delete datos[def.clave];
    else {
      if (esCurp(def.clave) || esRfc(def.clave)) texto = texto.toUpperCase().replace(/\s+/g, "");
      if (esCurp(def.clave) && !curpValida(texto)) { setError("La CURP no tiene la forma correcta; revísala."); return; }
      if (esRfc(def.clave) && !rfcValido(texto)) { setError("El RFC no tiene la forma correcta; revísala."); return; }
      const valor = def.tipo === "numero" ? Number(texto.replace(/[^\d.]/g, "")) : texto;
      if (def.tipo === "numero" && !Number.isFinite(valor as number)) { setError(`${def.etiqueta}: escribe un número.`); return; }
      // Escrito por el asesor: queda confirmado; conserva la fuente solo si el valor no cambió.
      const previo = estado.datos[def.clave];
      datos[def.clave] = { valor, estado: "confirmado", ...(previo?.fuente && previo.valor === valor ? { fuente: previo.fuente } : {}), actualizadoEl: ahora() };
    }
    // La CURP trae la fecha de nacimiento: entra por confirmar si todavía no hay una.
    const conNacimiento = conNacimientoDeCurp(datos, ahora());
    if (conNacimiento !== datos && Object.keys(conNacimiento).length > Object.keys(datos).length) mensaje = "Dato confirmado. La fecha de nacimiento salió de la CURP; revísala.";
    void guardar(conNacimiento, mensaje).then(ok => { if (ok) setEditando(null); });
  }
  const confirmar = (claves: string[]) => {
    if (!estado) return;
    const datos = { ...estado.datos };
    for (const clave of claves) if (datos[clave]) datos[clave] = { ...datos[clave], estado: "confirmado", actualizadoEl: ahora() };
    void guardar(conNacimientoDeCurp(datos, ahora()), claves.length === 1 ? "Dato confirmado." : `Se confirmaron ${claves.length} datos.`);
  };
  const descartar = (clave: string) => {
    if (!estado) return;
    const datos = { ...estado.datos };
    delete datos[clave];
    void guardar(datos, "Dato descartado.");
  };
  /** Texto pegado (CSR-07): lo reconocible entra por confirmar con la frase de donde salió. */
  function reconocer() {
    if (!estado) return;
    const encontrados = reconocerTexto(texto);
    const { datos, propuestos } = proponerReconocido(estado.datos, encontrados, ahora());
    if (!propuestos.length) { setError(encontrados.length ? "Lo que se reconoció ya está en el expediente." : "No se reconoció ningún dato en el texto. Revisa que traiga CURP, RFC, folio real, clave catastral, teléfono, correo, fechas o superficies."); return; }
    void guardar(conNacimientoDeCurp(datos, ahora()), `Se reconocieron ${propuestos.length === 1 ? "1 dato" : `${propuestos.length} datos`}; revísalos y confírmalos.`).then(ok => { if (ok) { setTexto(""); setPegando(false); } });
  }
  /** Otras operaciones del mismo cliente o inmueble (CSR-06). */
  async function buscarOtras() {
    setOtras(null); setError("");
    try {
      const r = await json<{ expedientes: Expediente[] }>("/api/admin/expedientes");
      const actual = r.expedientes.find(item => item.id === operationId);
      const lista = r.expedientes.filter(item => item.id !== operationId && actual && ((item.cliente_id && item.cliente_id === actual.cliente_id) || (item.propiedad_slug && item.propiedad_slug === actual.propiedad_slug)));
      setOtras(lista);
    } catch (cause) { setOtras(undefined); setError(errorMessage(cause)); }
  }
  async function tomarDe(otra: Expediente) {
    if (!estado) return;
    setError("");
    try {
      const r = await json<Respuesta>(`/api/admin/expedientes/${otra.id}/datos`);
      const datos = { ...estado.datos };
      let n = 0;
      for (const [clave, dato] of Object.entries(r.datos ?? {})) {
        if (dato.estado !== "confirmado" || datos[clave]) continue;
        datos[clave] = { valor: dato.valor, estado: "propuesto", fuente: { documento: `Operación ${otra.folio}`, operacionId: otra.id }, actualizadoEl: ahora() };
        n++;
      }
      if (!n) { setNotice(`La operación ${otra.folio} no tiene datos confirmados que falten aquí.`); setOtras(undefined); return; }
      void guardar(datos, `Se trajeron ${n === 1 ? "1 dato" : `${n} datos`} de la operación ${otra.folio}; revísalos y confírmalos.`).then(() => setOtras(undefined));
    } catch (cause) { setError(errorMessage(cause)); }
  }

  const datos = estado?.datos ?? {};
  const visibles = solo ? DATOS_EXPEDIENTE.filter(def => solo.includes(def.clave)) : DATOS_EXPEDIENTE;
  const grupos = GRUPOS.filter(grupo => visibles.some(def => def.grupo === grupo));
  const propuestos = visibles.filter(def => datos[def.clave]?.estado === "propuesto").map(def => def.clave);
  return <Card className="p-5" aria-labelledby="datos-expediente-titulo">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        <h2 id="datos-expediente-titulo" className="m-0 text-lg font-semibold">{titulo}</h2>
        <p className="text-sm text-muted-foreground">Se confirman una vez y llenan todos los formatos. Lo ya escrito no cambia; si difiere, el formato avisa.</p>
      </div>
      <span className="flex flex-wrap gap-1">
        {propuestos.length > 1 && <Button variant="primary" disabled={busy} onClick={() => confirmar(propuestos)}><Check size={16} aria-hidden="true" />Confirmar los {propuestos.length} pendientes</Button>}
        <Button variant="ghost" aria-expanded={pegando} disabled={busy || !estado} onClick={() => { setPegando(open => !open); setOtras(undefined); }}><Paste size={16} aria-hidden="true" />Pegar texto</Button>
        <Button variant="ghost" aria-expanded={otras !== undefined} disabled={busy || !estado} onClick={() => { if (otras !== undefined) setOtras(undefined); else { setPegando(false); void buscarOtras(); } }}><ArrowLeftRight size={16} aria-hidden="true" />Tomar de otra operación</Button>
      </span>
    </div>
    {pegando && <section aria-label="Pegar texto" className="mt-3 flex flex-col gap-2 rounded-[12px] border border-border p-3">
      <label htmlFor="datos-texto" className="text-sm font-semibold">Pega aquí un correo, un mensaje o el texto de un documento</label>
      <textarea id="datos-texto" className={textareaClass} rows={5} value={texto} onChange={event => setTexto(event.target.value)} placeholder="Se reconocen CURP, RFC, folio real, clave catastral, teléfono, correo, fechas de nacimiento, escritura y superficies." />
      <span className="flex flex-wrap gap-2"><Button variant="primary" disabled={busy || !texto.trim()} onClick={reconocer}>Reconocer datos</Button><Button variant="ghost" disabled={busy} onClick={() => { setPegando(false); setTexto(""); }}>Cancelar</Button></span>
    </section>}
    {otras !== undefined && <section aria-label="Otras operaciones" className="mt-3 flex flex-col gap-2 rounded-[12px] border border-border p-3">
      <p className="m-0 text-sm font-semibold">Operaciones del mismo cliente o inmueble</p>
      {otras === null ? <p className="text-sm text-muted-foreground">Buscando…</p>
        : !otras.length ? <p className="text-sm text-muted-foreground">No hay otra operación de este cliente ni de este inmueble.</p>
        : <ul className="flex flex-wrap gap-1.5">{otras.map(otra => <li key={otra.id}><Button variant="secondary" disabled={busy} onClick={() => void tomarDe(otra)}>{otra.folio} <span className="text-muted-foreground">· {otra.operacion}</span></Button></li>)}</ul>}
      <p className="m-0 text-xs text-muted-foreground">Sus datos confirmados entran aquí por confirmar; nada se copia sin que lo revises.</p>
    </section>}
    {notice && <p role="status" className="mt-3 text-sm text-muted-foreground">{notice}</p>}
    {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    {estado === undefined ? <p role="status" className="mt-4 text-sm text-muted-foreground">Consultando los datos…</p>
      : estado === null ? <div className="mt-4 flex items-center gap-3"><p className="text-sm">No se pudieron cargar los datos.</p><Button onClick={() => void cargar()}>Reintentar</Button></div>
      : <div className="mt-4 flex flex-col gap-5">{grupos.map(grupo => <section key={grupo} aria-label={grupo}>
        <h3 className="m-0 mb-2 text-sm font-semibold text-muted-foreground">{grupo}</h3>
        <ul className="flex flex-col divide-y divide-border rounded-[12px] border border-border">{visibles.filter(def => def.grupo === grupo).map(def => {
          const dato: DatoGuardado | undefined = datos[def.clave];
          const id = `dato-${def.clave}`;
          return <li key={def.clave} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <label htmlFor={id} className="text-sm font-semibold">{def.etiqueta}</label>
              {editando?.clave === def.clave
                ? <form className="flex flex-col gap-2" onSubmit={event => { event.preventDefault(); aceptarEdicion(def); }}>
                  <span className="flex flex-wrap gap-2">
                    <input id={id} className={`${inputClass} min-w-0 flex-1${esCurp(def.clave) || esRfc(def.clave) ? " uppercase" : ""}`} autoFocus type={def.tipo === "fecha" ? "date" : "text"} inputMode={def.tipo === "numero" ? "decimal" : undefined} maxLength={esCurp(def.clave) ? 18 : esRfc(def.clave) ? 13 : 2000} value={editando.valor} onChange={event => setEditando({ clave: def.clave, valor: event.target.value })} onKeyDown={event => { if (event.key === "Escape") setEditando(null); }} />
                    <Button type="submit" variant="primary" disabled={busy}>Confirmar</Button>
                    <Button disabled={busy} onClick={() => setEditando(null)}>Cancelar</Button>
                  </span>
                  {esCurp(def.clave) && <span className="text-xs text-muted-foreground">Con la CURP se deduce la fecha de nacimiento.</span>}
                  {esDomicilio(def.clave) && <CpHelper onPick={colonia => setEditando(old => old && { ...old, valor: domicilioDesde(old.valor.split(",")[0], colonia) })} />}
                </form>
                : dato ? <span className="text-sm [overflow-wrap:anywhere]">{mostrar(def, dato.valor)}</span>
                : <span className="text-sm text-muted-foreground">Sin dato{def.ayuda ? ` · ${def.ayuda}` : ""}</span>}
              {dato?.fuente && editando?.clave !== def.clave && <span className="text-xs text-muted-foreground">De {dato.fuente.documento ?? "un documento"}{dato.fuente.pagina ? `, página ${dato.fuente.pagina}` : ""}{dato.fuente.cita ? ` · «${dato.fuente.cita}»` : ""}</span>}
            </div>
            {editando?.clave !== def.clave && <span className="flex flex-wrap items-center gap-1">
              {dato && <Pill size="sm" tone={dato.estado === "confirmado" ? "success" : "warn"}>{dato.estado === "confirmado" ? "Confirmado" : "Por confirmar"}</Pill>}
              {dato?.estado === "propuesto" && <Button variant="ghost" disabled={busy} aria-label={`Confirmar ${def.etiqueta.toLowerCase()}`} onClick={() => confirmar([def.clave])}><Check size={16} aria-hidden="true" />Confirmar</Button>}
              <Button variant="ghost" iconOnly disabled={busy} aria-label={`${dato ? "Corregir" : "Escribir"} ${def.etiqueta.toLowerCase()}`} onClick={() => setEditando({ clave: def.clave, valor: dato ? String(dato.valor) : "" })}><Pencil size={16} aria-hidden="true" /></Button>
              {dato?.estado === "propuesto" && <Button variant="ghost" iconOnly disabled={busy} aria-label={`Descartar ${def.etiqueta.toLowerCase()}`} onClick={() => descartar(def.clave)}><X size={16} aria-hidden="true" /></Button>}
            </span>}
          </li>;
        })}</ul>
      </section>)}</div>}
  </Card>;
}
