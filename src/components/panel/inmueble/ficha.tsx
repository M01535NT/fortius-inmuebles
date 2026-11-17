"use client";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";

import { Icono, type NombreIcono } from "@/components/panel/icons";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Desplegable } from "@/components/panel/kit/desplegable";
import { Interruptor } from "@/components/panel/kit/segmentado";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/panel/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/panel/ui/dropdown-menu";
import { Switch } from "@/components/panel/ui/switch";
import {
  agregarDocumento, cambiarMedio, estadosPara, FICHA_POR_TIPO, guardarInmueble, leerInmueble, NOMBRE_ESTADO, NOMBRE_OPERACION, NOMBRE_TIPO,
  OPERACIONES, ponerEnlace, precioTexto, queLleva, subirMedio, TIPOS_INMUEBLE,
  type CambioInmueble, type CampoFicha, type EstadoInmueble, type Inmueble, type Medio, type Moneda, type Operacion, type TipoInmueble,
} from "@/lib/panel/inmuebles/api";
import { leerEquipo, type Miembro } from "@/lib/panel/asuntos/api";

import { Cuadro } from "../asunto/pildora";
import "../asunto/asunto.css";
import "./inmueble.css";

type Pestana = "datos" | "fotos" | "media" | "permisos" | "ubic" | "sitio";
const PESTANAS: { clave: Pestana; nombre: string; icono: NombreIcono }[] = [
  { clave: "datos", nombre: "Ficha", icono: "regla" }, { clave: "fotos", nombre: "Fotos", icono: "img" },
  { clave: "media", nombre: "Video y 360", icono: "video" }, { clave: "permisos", nombre: "Planos", icono: "escudo" },
  { clave: "ubic", nombre: "Ubicación", icono: "pin" }, { clave: "sitio", nombre: "Sitio", icono: "globo" },
];
const PERMISOS = ["Licencia de uso de suelo", "Permiso de construcción", "Dictamen de protección civil", "Factibilidad de CFE", "Plano arquitectónico", "Plano de instalaciones"];
const esPermiso = (d: { nombre: string; grupo: string | null }) =>
  d.grupo === "Permisos y planos" || /plano|licencia|permiso|dictamen|factibilidad|uso de suelo|escritura/i.test(d.nombre);
const fecha = (iso: string) => new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
const cifra = (v: number | string | undefined) => (typeof v === "number" ? v.toLocaleString("en-US") : v ?? "");

/**
 * La ficha completa de un inmueble (boceto aprobado, ventana «Inmueble»). Cada cambio se guarda solo al salir del campo;
 * guardar nunca publica: publicar es el interruptor de la pestaña Sitio.
 */
export function FichaInmueble({ id, alCambiar, nombreDe: dado }: { id: string; alCambiar?: () => void; nombreDe?: (uid: string | null) => string }) {
  const { avisar } = useAvisos();
  const [equipo, setEquipo] = useState<Miembro[]>([]);
  useEffect(() => { if (!dado) leerEquipo().then((r) => setEquipo(r.equipo), () => undefined); }, [dado]);
  const nombreDe = dado ?? ((uid: string | null) => equipo.find((m) => m.id === uid)?.nombre ?? "Otra persona del equipo");
  const [i, setI] = useState<Inmueble | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pestana, setPestana] = useState<Pestana>("datos");
  const actual = useRef<Inmueble | null>(null);
  useEffect(() => { actual.current = i; }, [i]);

  const cargar = useCallback(() => leerInmueble(id).then((x) => { setI(x); setError(null); }, (e: unknown) => setError(e instanceof Error ? e.message : "No se pudo cargar.")), [id]);
  useEffect(() => { void cargar(); }, [cargar]);

  /** Guarda un cambio con la versión que se vio; si otro guardó antes, recarga y avisa. */
  const guardar = useCallback(async (cambio: CambioInmueble, aviso?: string) => {
    const x = actual.current;
    if (!x) return;
    try {
      const nuevo = await guardarInmueble(x.id, x.version, cambio);
      setI(nuevo);
      if (aviso) avisar(aviso);
      alCambiar?.();
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se guardó.");
      void cargar();
    }
  }, [avisar, alCambiar, cargar]);

  if (error) return <div className="as-vacio"><Icono nombre="alerta" tamano={24} /><b>{error}</b><button type="button" className="as-btn" onClick={() => void cargar()}>Reintentar</button></div>;
  if (!i) return <div className="as-cargando" aria-label="Cargando"><span /><span /><span /></div>;

  const lleva = queLleva(i);
  const fotos = i.medios.filter((m) => m.tipo === "foto");
  return (
    <div className="as-form">
      <div className="in-tabs" role="tablist" aria-label="Partes del inmueble">
        {PESTANAS.map((p) => (
          <button key={p.clave} type="button" role="tab" aria-selected={pestana === p.clave} onClick={() => setPestana(p.clave)}>
            <Icono nombre={p.icono} tamano={16} />{p.nombre}{p.clave === "fotos" && fotos.length ? ` ${fotos.length}` : ""}
          </button>
        ))}
      </div>
      {pestana === "datos" ? <Datos i={i} guardar={guardar} nombreDe={nombreDe} /> : null}
      {pestana === "fotos" ? <Fotos i={i} guardar={guardar} recargar={cargar} /> : null}
      {pestana === "media" ? <Media i={i} recargar={cargar} /> : null}
      {pestana === "permisos" ? <Permisos i={i} recargar={cargar} /> : null}
      {pestana === "ubic" ? <Ubicacion i={i} guardar={guardar} /> : null}
      {pestana === "sitio" ? <Sitio i={i} guardar={guardar} lleva={lleva} ir={setPestana} /> : null}
    </div>
  );
}

type Guardar = (cambio: CambioInmueble, aviso?: string) => Promise<void>;

// ── Piezas de captura ────────────────────────────────────────────────────────────────────────────────
/** Un campo de texto que guarda al salir (o con Enter), solo si cambió. */
function Campo({ etiqueta, valor, alGuardar, ph, unidad, numero, area, max = 160 }: {
  etiqueta: string; valor: string; alGuardar: (v: string) => void; ph?: string; unidad?: string; numero?: boolean; area?: boolean; max?: number;
}) {
  const id = useId();
  const [v, setV] = useState(valor);
  const [antes, setAntes] = useState(valor);
  if (valor !== antes) { setAntes(valor); setV(valor); }
  const salir = () => { if (v.trim() !== valor.trim()) alGuardar(v.trim()); };
  const comun = {
    id, value: v, placeholder: ph, maxLength: max, onBlur: salir,
    onChange: (e: { target: { value: string } }) => setV(numero ? e.target.value.replace(/[^0-9.,]/g, "") : e.target.value),
  };
  return (
    <label className="pn-campo" htmlFor={id}>{etiqueta}
      {area ? <textarea {...comun} className="as-inp as-inp-borde as-area in-desc" />
        : (
          <span className={unidad ? "in-uni" : undefined}>
            <input {...comun} className="as-inp as-inp-borde" inputMode={numero ? "decimal" : undefined}
              onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} />
            {unidad ? <i>{unidad}</i> : null}
          </span>
        )}
    </label>
  );
}

function Interr({ titulo, detalle, icono, color, valor, alCambiar }: { titulo: string; detalle: string; icono: NombreIcono; color: string; valor: boolean; alCambiar: (v: boolean) => void }) {
  return (
    <label className="as-ren in-sw">
      <Cuadro icono={icono} color={color} />
      <span className="as-ren-c"><b>{titulo}</b><span>{detalle}</span></span>
      <Switch checked={valor} onCheckedChange={alCambiar} aria-label={titulo} />
    </label>
  );
}

function Grupo({ titulo, abierto: inicial, cuenta, children }: { titulo: string; abierto: boolean; cuenta: string; children: ReactNode }) {
  const [abierto, setAbierto] = useState(inicial);
  return (
    <div className="as-card">
      <button type="button" className="in-gh" aria-expanded={abierto} onClick={() => setAbierto((x) => !x)}>
        <Icono nombre="ch" tamano={15} /><span>{titulo}</span><span className="as-sp" /><span className={`as-pill ${cuenta.startsWith("Completo") ? "as-pill-ok" : ""}`}>{cuenta}</span>
      </button>
      {abierto ? <div className="as-pad"><div className="as-g2">{children}</div></div> : null}
    </div>
  );
}

// ── Ficha técnica ────────────────────────────────────────────────────────────────────────────────────
function Datos({ i, guardar, nombreDe }: { i: Inmueble; guardar: Guardar; nombreDe?: (uid: string | null) => string }) {
  const [precio, setPrecio] = useState(false);
  const grupos = i.tipo ? FICHA_POR_TIPO[i.tipo] : [];
  const valorDe = (c: CampoFicha) => i.ficha[c.clave];
  const poner = (c: CampoFicha, v: string) => {
    const ficha = { ...i.ficha };
    if (v === "") delete ficha[c.clave];
    else ficha[c.clave] = c.opciones || c.texto ? v : Number(v.replace(/,/g, ""));
    void guardar({ ficha });
  };
  return (
    <>
      <div className="as-card as-pad">
        <div className="as-g2">
          <Campo etiqueta="Nombre" valor={i.nombre} alGuardar={(v) => { if (v) void guardar({ nombre: v }); }} />
          <Desplegable etiqueta="Tipo" valor={i.tipo ?? ""} vacio="Elegir" opciones={TIPOS_INMUEBLE.map((t) => ({ valor: t, etiqueta: NOMBRE_TIPO[t] }))}
            alElegir={(v) => void guardar({ tipo: (v || null) as TipoInmueble | null })} />
          <Desplegable etiqueta="Operación" valor={i.operacion ?? ""} vacio={i.operacion ? undefined : "Elegir"} opciones={OPERACIONES.map((o) => ({ valor: o, etiqueta: NOMBRE_OPERACION[o] }))}
            alElegir={(v) => void guardar({ operacion: (v || null) as Operacion | null })} />
          <Desplegable etiqueta="Estado" valor={i.estado} opciones={estadosPara(i.operacion).map((e) => ({ valor: e, etiqueta: NOMBRE_ESTADO[e] }))}
            alElegir={(v) => { if (v) void guardar({ estado: v as EstadoInmueble }, `Estado: ${NOMBRE_ESTADO[v as EstadoInmueble].toLowerCase()}`); }} />
        </div>
      </div>
      <div className="as-card">
        <div className="as-ren">
          <Cuadro icono="pago" color="green" />
          <span className="as-ren-c"><b>{i.operacion === "renta" ? "Renta mensual" : "Precio"}</b><span>{precioTexto(i.precio, i.moneda, i.operacion)}{i.precios.length ? ` · ${i.precios.length} cambio${i.precios.length > 1 ? "s" : ""}` : ""}</span></span>
          <button type="button" className="as-btn" onClick={() => setPrecio(true)}>Cambiar</button>
        </div>
        {i.precios.slice(0, 6).map((p) => (
          <div key={p.id} className="in-hist">
            <Icono nombre="reloj" tamano={15} />
            <div>
              <p>{precioTexto(p.precio_antes, p.moneda_antes ?? p.moneda, null)} → {precioTexto(p.precio, p.moneda, null)}{p.motivo ? ` · ${p.motivo}` : ""}</p>
              <p className="as-m">{fecha(p.created_at)} · {nombreDe ? nombreDe(p.cambiado_por) : ""}</p>
            </div>
          </div>
        ))}
      </div>
      {!i.tipo ? <p className="as-m">Elige el tipo para ver sus datos (la nave pide altura y andenes; la casa, recámaras y baños).</p> : null}
      {grupos.map((g, gi) => {
        const llenos = g.campos.filter((c) => valorDe(c) !== undefined).length;
        return (
          <Grupo key={`${i.tipo}-${g.nombre}`} titulo={g.nombre} abierto={gi === 0} cuenta={llenos === g.campos.length ? `Completo` : `${llenos} de ${g.campos.length}`}>
            {g.campos.map((c) => c.opciones
              ? <Desplegable key={c.clave} etiqueta={c.nombre} valor={String(valorDe(c) ?? "")} vacio="Sin dato" opciones={c.opciones.map((o) => ({ valor: o, etiqueta: o }))} alElegir={(v) => poner(c, v)} />
              : <Campo key={c.clave} etiqueta={c.nombre} valor={String(cifra(valorDe(c)))} unidad={c.unidad} numero={!c.texto} alGuardar={(v) => poner(c, v)} />)}
          </Grupo>
        );
      })}
      {i.tipo === "local" || i.tipo === "oficina" || i.conjunto ? (
        <div className="as-card"><div className="as-ren"><Cuadro icono="edif" color="orange" />
          <span className="as-ren-c"><b>Conjunto</b><span>{i.conjunto ? `${i.conjunto.nombre} · ${i.conjunto.folio}` : "No pertenece a una plaza"}</span></span></div></div>
      ) : null}
      {i.unidades.length ? (
        <div>
          <p className="as-sub">Locales de esta plaza</p>
          <div className="as-card">{i.unidades.map((u) => (
            <div key={u.id} className="as-ren"><span className="as-ren-c"><b>{u.nombre}</b><span>{u.folio} · {precioTexto(u.precio, i.moneda, i.operacion)}{u.publicado ? " · publicado" : ""}</span></span>
              <span className="as-pill">{NOMBRE_ESTADO[u.estado]}</span></div>
          ))}</div>
        </div>
      ) : null}
      <DialogoPrecio abierto={precio} i={i} alCerrar={() => setPrecio(false)} alGuardar={(p, m, motivo) => void guardar({ precio: p, moneda: m, motivo_precio: motivo }, "Precio cambiado")} />
    </>
  );
}

function DialogoPrecio({ abierto, i, alCerrar, alGuardar }: { abierto: boolean; i: Inmueble; alCerrar: () => void; alGuardar: (precio: number | null, moneda: Moneda, motivo: string) => void }) {
  return (
    <Dialog open={abierto} onOpenChange={(o) => { if (!o) alCerrar(); }}>
      <DialogContent className="max-w-md">
        <DialogTitle>Cambiar el precio</DialogTitle>
        <DialogDescription>Queda guardado quién lo cambió, cuándo y por qué.</DialogDescription>
        {abierto ? <FormaPrecio i={i} alCerrar={alCerrar} alGuardar={alGuardar} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function FormaPrecio({ i, alCerrar, alGuardar }: { i: Inmueble; alCerrar: () => void; alGuardar: (precio: number | null, moneda: Moneda, motivo: string) => void }) {
  const id = useId();
  const [monto, setMonto] = useState(i.precio ? i.precio.toLocaleString("en-US") : "");
  const [moneda, setMoneda] = useState<Moneda>(i.moneda);
  const [motivo, setMotivo] = useState("");
  return (
    <form className="as-form" onSubmit={(e) => {
      e.preventDefault();
      const n = Number(monto.replace(/[^0-9.]/g, ""));
      alCerrar();
      alGuardar(monto.trim() && n > 0 ? n : null, moneda, motivo.trim());
    }}>
      <label className="pn-campo" htmlFor={`${id}-m`}>{i.operacion === "renta" ? "Renta mensual" : "Precio"}
        <input id={`${id}-m`} className="as-inp as-inp-borde" inputMode="decimal" placeholder="Vacío = a consulta" value={monto} autoFocus
          onChange={(e) => setMonto(e.target.value.replace(/[^0-9.,]/g, ""))} />
      </label>
      <Interruptor etiqueta="Moneda" opciones={[{ valor: "MXN", etiqueta: "Pesos" }, { valor: "USD", etiqueta: "Dólares" }]} valor={moneda} alElegir={setMoneda} />
      <label className="pn-campo" htmlFor={`${id}-p`}>Por qué (opcional)
        <input id={`${id}-p`} className="as-inp as-inp-borde" maxLength={300} placeholder="Lo pidió el propietario, ajuste al mercado…" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
      </label>
      <div className="as-fila as-fin">
        <button type="button" className="as-btn" onClick={alCerrar}>Cancelar</button>
        <button type="submit" className="as-btn as-pri">Guardar</button>
      </div>
    </form>
  );
}

// ── Fotos ────────────────────────────────────────────────────────────────────────────────────────────
/** Sube varios archivos uno tras otro y dice cuántos van; lo que falla se avisa sin detener lo demás. */
function useSubida(recargar: () => Promise<unknown>) {
  const { avisar } = useAvisos();
  const [va, setVa] = useState<{ n: number; de: number } | null>(null);
  const subir = async (archivos: File[], uno: (f: File) => Promise<unknown>, listo: (n: number) => string) => {
    let bien = 0;
    const fallas: string[] = [];
    for (const [k, f] of archivos.entries()) {
      setVa({ n: k + 1, de: archivos.length });
      try { await uno(f); bien += 1; } catch (e) { fallas.push(e instanceof Error ? e.message : f.name); }
    }
    setVa(null);
    await recargar();
    if (bien) avisar(listo(bien));
    if (fallas.length) avisar(fallas.length === 1 ? fallas[0] : `${fallas.length} archivos no se subieron: ${fallas[0]}`);
  };
  return { va, subir };
}

function BotonSubir({ etiqueta, acepta, varios = true, principal, ocupado, alElegir }: { etiqueta: string; acepta: string; varios?: boolean; principal?: boolean; ocupado: string | null; alElegir: (f: File[]) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input ref={ref} type="file" accept={acepta} multiple={varios} hidden onChange={(e) => { const f = [...(e.target.files ?? [])]; e.target.value = ""; if (f.length) alElegir(f); }} />
      <button type="button" className={`as-btn ${principal ? "as-pri" : ""}`} aria-disabled={Boolean(ocupado)} onClick={() => { if (!ocupado) ref.current?.click(); }}>
        <Icono nombre="subir" tamano={16} />{ocupado ?? etiqueta}
      </button>
    </>
  );
}

function Fotos({ i, guardar, recargar }: { i: Inmueble; guardar: Guardar; recargar: () => Promise<unknown> }) {
  const { avisar } = useAvisos();
  const { va, subir } = useSubida(recargar);
  const fotos = [...i.medios.filter((m) => m.tipo === "foto")].sort((a, b) => Number(b.id === i.portada_id) - Number(a.id === i.portada_id));
  const portada = fotos[0]?.id;
  const ocupado = va ? `Subiendo ${va.n} de ${va.de}…` : null;
  const elegir = (f: File[]) => void subir(f, (x) => subirMedio(i.id, "foto", x), (n) => `${n} foto${n > 1 ? "s" : ""} subida${n > 1 ? "s" : ""}`);
  const mover = async (m: Medio, delta: -1 | 1) => {
    const k = fotos.findIndex((x) => x.id === m.id), otro = fotos[k + delta];
    if (!otro) return;
    try { await cambiarMedio(i.id, { id: m.id, orden: otro.orden + delta * 0.5 }); await recargar(); } catch (e) { avisar(e instanceof Error ? e.message : "No se movió."); }
  };
  const quitar = async (m: Medio) => {
    try { await cambiarMedio(i.id, { id: m.id, retirar: true }); await recargar(); avisar("Foto quitada"); } catch (e) { avisar(e instanceof Error ? e.message : "No se quitó."); }
  };
  if (!fotos.length) {
    return (
      <div className="as-vacio">
        <Icono nombre="img" tamano={26} /><b>Sin fotos</b><span className="as-m">Elige varias a la vez. La primera queda de portada.</span>
        <BotonSubir etiqueta="Subir fotos" acepta="image/jpeg,image/png,image/webp" principal ocupado={ocupado} alElegir={elegir} />
      </div>
    );
  }
  return (
    <>
      <div className="in-fotos">
        {fotos.map((f, k) => (
          <div key={f.id} className="in-foto">
            {/* eslint-disable-next-line @next/next/no-img-element -- foto del inmueble ya optimizada al subir */}
            <img src={f.url} alt={f.alt ?? `Foto ${k + 1} de ${i.nombre}`} loading="lazy" />
            {f.id === portada ? <span className="as-pill in-portada">Portada</span> : null}
            <DropdownMenu>
              <DropdownMenuTrigger className="as-btn as-ico in-foto-op" aria-label={`Opciones de la foto ${k + 1}`}><Icono nombre="dots" tamano={15} /></DropdownMenuTrigger>
              <DropdownMenuContent>
                {f.id !== portada ? <DropdownMenuItem onSelect={() => void guardar({ portada_id: f.id }, "Portada elegida")}><Icono nombre="estrella" tamano={16} />Hacer portada</DropdownMenuItem> : null}
                {k > 0 ? <DropdownMenuItem onSelect={() => void mover(f, -1)}><Icono nombre="at" tamano={16} />Mover antes</DropdownMenuItem> : null}
                {k < fotos.length - 1 ? <DropdownMenuItem onSelect={() => void mover(f, 1)}><Icono nombre="ch" tamano={16} />Mover después</DropdownMenuItem> : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem peligro onSelect={() => void quitar(f)}><Icono nombre="bote" tamano={16} />Quitar</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
      <BotonSubir etiqueta="Subir más" acepta="image/jpeg,image/png,image/webp" ocupado={ocupado} alElegir={elegir} />
      <p className="as-m">Al subirlas se les quita la ubicación y los datos de la cámara.</p>
    </>
  );
}

// ── Video y 360 ──────────────────────────────────────────────────────────────────────────────────────
function Media({ i, recargar }: { i: Inmueble; recargar: () => Promise<unknown> }) {
  const { avisar } = useAvisos();
  const video = useSubida(recargar);
  const tomas = useSubida(recargar);
  const videos = i.medios.filter((m) => m.tipo === "video");
  const r360 = i.medios.filter((m) => m.tipo === "recorrido_360");
  const enlace = async (tipo: "video" | "recorrido_360", url: string) => {
    if (!url) return;
    try { await ponerEnlace(i.id, tipo, url); await recargar(); avisar("Enlace guardado"); } catch (e) { avisar(e instanceof Error ? e.message : "No se guardó."); }
  };
  const quitar = async (m: Medio) => {
    try { await cambiarMedio(i.id, { id: m.id, retirar: true }); await recargar(); avisar("Quitado"); } catch (e) { avisar(e instanceof Error ? e.message : "No se quitó."); }
  };
  const lista = (ms: Medio[]) => ms.filter((m) => m.subido).map((m) => (
    <div key={m.id} className="as-ren">
      <Icono nombre="file" tamano={16} />
      <span className="as-ren-c"><b className="as-corta">{m.nombre ?? "Archivo"}</b><span>Subido {fecha(m.created_at)}</span></span>
      <a className="as-btn as-gho as-ico" href={m.url} target="_blank" rel="noreferrer" aria-label="Abrir"><Icono nombre="ojo" tamano={16} /></a>
      <button type="button" className="as-btn as-gho as-ico" aria-label="Quitar" onClick={() => void quitar(m)}><Icono nombre="x" tamano={15} /></button>
    </div>
  ));
  const enlaceVideo = videos.find((m) => !m.subido)?.url ?? "";
  const enlace360 = r360.find((m) => !m.subido)?.url ?? "";
  return (
    <>
      <div className="as-card">
        <div className="as-ren">
          <Cuadro icono="video" color="red" />
          <span className="as-ren-c"><b>Video</b><span>{videos.some((m) => !m.subido) ? "Enlace puesto" : videos.length ? `${videos.length} cargado${videos.length > 1 ? "s" : ""}` : "Sin video"}</span></span>
          <BotonSubir etiqueta="Subir" acepta="video/mp4,video/webm" varios={false} ocupado={video.va ? "Subiendo…" : null}
            alElegir={(f) => void video.subir(f, (x) => subirMedio(i.id, "video", x), () => "Video cargado")} />
        </div>
        {lista(videos)}
        <div className="as-pad"><Campo etiqueta="O pega el enlace del video" valor={enlaceVideo} ph="https://" max={1000} alGuardar={(v) => void enlace("video", v)} /></div>
      </div>
      <div className="as-card">
        <div className="as-ren">
          <Cuadro icono="r360" color="violet" />
          <span className="as-ren-c"><b>Recorrido 360</b><span>{r360.some((m) => !m.subido) ? "Enlace puesto" : r360.length ? `${r360.length} tomas cargadas` : "Sin recorrido"}</span></span>
          <BotonSubir etiqueta="Subir tomas" acepta="image/jpeg,image/png,image/webp" ocupado={tomas.va ? `Subiendo ${tomas.va.n} de ${tomas.va.de}…` : null}
            alElegir={(f) => void tomas.subir(f, (x) => subirMedio(i.id, "recorrido_360", x), (n) => `${n} toma${n > 1 ? "s" : ""} cargada${n > 1 ? "s" : ""}`)} />
        </div>
        {lista(r360)}
        <div className="as-pad"><Campo etiqueta="O pega el enlace del recorrido" valor={enlace360} ph="https://" max={1000} alGuardar={(v) => void enlace("recorrido_360", v)} /></div>
      </div>
      <p className="as-m">El video subido puede pesar hasta 20 MB; si es más grande, pega su enlace. En el sitio sale el recorrido por enlace.</p>
    </>
  );
}

// ── Planos y permisos ────────────────────────────────────────────────────────────────────────────────
function Permisos({ i, recargar }: { i: Inmueble; recargar: () => Promise<unknown> }) {
  const { avisar } = useAvisos();
  const { va, subir } = useSubida(recargar);
  const ref = useRef<HTMLInputElement>(null);
  const docs = i.documentos.filter(esPermiso);
  const agregar = async (nombre: string) => {
    if (i.documentos.some((d) => d.nombre === nombre)) { avisar("Ya está en la lista"); return; }
    try { await agregarDocumento(i.id, nombre); await recargar(); avisar(`${nombre}: agregado`); } catch (e) { avisar(e instanceof Error ? e.message : "No se agregó."); }
  };
  return (
    <>
      <input ref={ref} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" multiple hidden
        onChange={(e) => { const f = [...(e.target.files ?? [])]; e.target.value = ""; if (f.length) void subir(f, (x) => agregarDocumento(i.id, x.name.replace(/\.[a-z0-9]+$/i, ""), x), (n) => `${n} archivo${n > 1 ? "s" : ""} subido${n > 1 ? "s" : ""}`); }} />
      <div className="as-card">
        {docs.length ? docs.map((d) => (
          <div key={d.id} className="as-ren">
            <Icono nombre={d.archivos ? "pdf" : "file"} tamano={18} />
            <span className="as-ren-c"><b>{d.nombre}</b><span>{d.archivos ? `${d.archivos} archivo${d.archivos > 1 ? "s" : ""}` : "Sin archivo"}</span></span>
            <span className={`as-pill ${d.estado === "recibido" ? "as-pill-ok" : d.estado === "falta" ? "as-pill-warn" : ""}`}>{d.estado === "recibido" ? "Recibido" : d.estado === "falta" ? "Falta" : "No aplica"}</span>
          </div>
        )) : <p className="as-pad as-m">Todavía no hay escritura, licencias ni planos.</p>}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger className="as-btn" aria-disabled={Boolean(va)}><Icono nombre="mas" tamano={16} />{va ? `Subiendo ${va.n} de ${va.de}…` : "Agregar"}<Icono nombre="down" tamano={14} /></DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={() => ref.current?.click()}><Icono nombre="subir" tamano={16} />Subir archivos</DropdownMenuItem>
          <DropdownMenuSeparator />
          {PERMISOS.map((n) => <DropdownMenuItem key={n} onSelect={() => void agregar(n)}><Icono nombre="escudo" tamano={16} />{n}</DropdownMenuItem>)}
        </DropdownMenuContent>
      </DropdownMenu>
      <p className="as-m">Son los mismos documentos del asunto: lo que subas aquí aparece allá. No salen en el sitio.</p>
    </>
  );
}

// ── Ubicación ────────────────────────────────────────────────────────────────────────────────────────
function Ubicacion({ i, guardar }: { i: Inmueble; guardar: Guardar }) {
  return (
    <>
      <div className="as-card as-pad">
        <div className="as-g2">
          <Campo etiqueta="Colonia" valor={i.colonia ?? ""} max={120} alGuardar={(v) => void guardar({ colonia: v || null })} />
          <Campo etiqueta="Ciudad" valor={i.ciudad} max={80} alGuardar={(v) => { if (v) void guardar({ ciudad: v }); }} />
          <Campo etiqueta="Dirección exacta (privada)" valor={i.direccion_exacta ?? ""} ph="Calle y número" max={300} alGuardar={(v) => void guardar({ direccion_exacta: v || null })} />
          <Campo etiqueta="Referencias" valor={i.referencias ?? ""} ph="Entre qué calles" max={500} alGuardar={(v) => void guardar({ referencias: v || null })} />
        </div>
        <div className="in-sep"><Campo etiqueta="Enlace del mapa" valor={i.mapa ?? ""} ph="https://maps…" max={1000} alGuardar={(v) => void guardar({ mapa: v || null })} /></div>
      </div>
      <div className="as-card">
        <Interr titulo="Dirección exacta en el sitio" detalle={i.mostrar_direccion ? "El público ve calle y número" : "El público ve solo la colonia"} icono="ojo" color="gray"
          valor={i.mostrar_direccion} alCambiar={(v) => void guardar({ mostrar_direccion: v }, v ? "El sitio mostrará la dirección exacta" : "El sitio muestra solo la colonia")} />
      </div>
    </>
  );
}

// ── Sitio ────────────────────────────────────────────────────────────────────────────────────────────
function Sitio({ i, guardar, lleva, ir }: { i: Inmueble; guardar: Guardar; lleva: ReturnType<typeof queLleva>; ir: (p: Pestana) => void }) {
  const { avisar } = useAvisos();
  const sinFotos = !i.medios.some((m) => m.tipo === "foto");
  const enlace = i.slug ? `${location.origin}/inventario/${i.slug}` : null;
  return (
    <>
      <div className="as-card">
        <Interr titulo={i.publicado ? "Publicado" : "Sin publicar"} icono="globo" color={i.publicado ? "green" : "gray"}
          detalle={i.publicado ? (sinFotos ? "No aparece hasta que tenga una foto" : i.estado === "retirado" ? "Retirado: no aparece" : "Visible en el sitio") : "Guardar no publica"}
          valor={i.publicado} alCambiar={(v) => void guardar({ publicado: v }, v ? (sinFotos ? "Publicado. Sale en el sitio en cuanto tenga una foto" : "Publicado en el sitio") : "Retirado del sitio")} />
      </div>
      <div>
        <p className="as-sub">Qué lleva</p>
        <div className="as-card">
          {lleva.map((l) => (
            <button key={l.nombre} type="button" className="as-ren" onClick={() => ir(l.clave)}>
              <span className="as-ren-c"><b className="in-b5">{l.nombre}</b><span>{l.detalle}</span></span>
              <span className={`as-pill ${l.listo ? "as-pill-ok" : "as-pill-warn"}`}>{l.listo ? "Listo" : "Falta"}</span>
              <Icono nombre="ch" tamano={16} />
            </button>
          ))}
        </div>
      </div>
      <Campo etiqueta="Descripción para el sitio" area max={10000} valor={i.descripcion} ph="Lo que verá quien busca. Deja una línea en blanco entre párrafos."
        alGuardar={(v) => void guardar({ descripcion: v })} />
      <DropdownMenu>
        <DropdownMenuTrigger className="as-btn"><Icono nombre="subir" tamano={16} />Compartir<Icono nombre="down" tamano={14} /></DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={() => {
            const t = `${i.nombre}${i.colonia ? ` · ${i.colonia}` : ""}\n${precioTexto(i.precio, i.moneda, i.operacion)}${enlace && i.publicado ? `\n${enlace}` : ""}`;
            window.open(`https://wa.me/?text=${encodeURIComponent(t)}`, "_blank", "noopener");
          }}><Icono nombre="chat" tamano={16} />Por WhatsApp</DropdownMenuItem>
          <DropdownMenuItem disabled={!enlace || !i.publicado} onSelect={() => { if (enlace) void navigator.clipboard?.writeText(enlace).then(() => avisar("Enlace copiado"), () => avisar("No se pudo copiar")); }}>
            <Icono nombre="copia" tamano={16} />Copiar enlace{!i.publicado ? " (al publicar)" : ""}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
