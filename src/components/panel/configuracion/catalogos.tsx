"use client";
import { useState, type FormEvent } from "react";

import { useCatalogos } from "@/components/panel/datos/catalogos";
import { Icono } from "@/components/panel/icons";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Boton } from "@/components/panel/kit/boton";
import { Campo } from "@/components/panel/kit/campo";
import { Desplegable } from "@/components/panel/kit/desplegable";
import { Cargando, EstadoError, Vacio } from "@/components/panel/kit/estados";
import { Fila, Tarjeta } from "@/components/panel/kit/lista";
import { ListaReordenable } from "@/components/panel/kit/reordenable";
import { HojaAdaptable } from "@/components/panel/ui/hoja-adaptable";
import { Switch } from "@/components/panel/ui/switch";
import { FalloPanel } from "@/lib/panel/asuntos/api";
import {
  agregarValor, cambiarValor, estaVacio, ordenarCatalogo,
  type Catalogo, type ClaveCatalogo, type ValorCatalogo,
} from "@/lib/panel/catalogos";

import { SeccionConfig } from "./partes";

/**
 * Configuración → Catálogos (SPEC.md, sección 3; boceto de lo ajustable): las listas de las que salen los desplegables
 * del panel. Solo el director la ve; la base hace cumplir que solo él cambie (RLS). Desactivar no borra: lo que ya usa
 * un valor lo conserva. Los valores que el panel usa por su clave se renombran, pero no se apagan.
 */
export function SeccionCatalogos() {
  const cat = useCatalogos();
  const { avisar } = useAvisos();
  const lista = Object.values(cat.catalogos).filter((c): c is Catalogo => Boolean(c)).sort((a, b) => a.orden - b.orden);
  const [elegido, setElegido] = useState<ClaveCatalogo>("papel");
  const c = cat.catalogos[elegido] ?? lista[0];
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [editando, setEditando] = useState<ValorCatalogo | null>(null);
  const [visto, setVisto] = useState<ValorCatalogo | null>(null);
  const [agregando, setAgregando] = useState(false);

  /** Un 409 quiere decir que alguien guardó antes: se trae lo último y se avisa. */
  const fallo = (e: unknown, texto: string) => {
    if (e instanceof FalloPanel && e.estado === 409) { avisar("Alguien cambió esta lista antes que tú. Ya ves lo último."); void cat.recargar(); return; }
    avisar(e instanceof Error ? e.message : texto);
  };
  const conValor = (k: Catalogo, v: ValorCatalogo): Catalogo =>
    ({ ...k, valores: k.valores.some((x) => x.id === v.id) ? k.valores.map((x) => (x.id === v.id ? v : x)) : [...k.valores, v] });

  const cambiar = async (k: Catalogo, v: ValorCatalogo, cambio: Parameters<typeof cambiarValor>[1], aviso: string) => {
    if (ocupado) return false;
    setOcupado(v.id);
    try {
      cat.poner(conValor(k, await cambiarValor(v, cambio)));
      avisar(aviso);
      return true;
    } catch (e) { fallo(e, "No se guardó el cambio."); return false; } finally { setOcupado(null); }
  };

  const reordenar = async (k: Catalogo, nuevo: ValorCatalogo[]) => {
    const antes = k;
    // Se ve al instante; si la base no lo acepta, vuelve como estaba.
    cat.poner({ ...k, valores: nuevo.map((v, i) => ({ ...v, orden: (i + 1) * 10 })) });
    try {
      await ordenarCatalogo(k.clave, nuevo.map((v) => ({ id: v.id, version: v.version })));
      void cat.recargar();
    } catch (e) { cat.poner(antes); fallo(e, "No se guardó el orden."); }
  };

  const abrir = (v: ValorCatalogo) => { setVisto(v); setEditando(v); };
  const significadoDe = (k: Catalogo, v: ValorCatalogo) => k.significados.find((s) => s.clave === v.significado)?.etiqueta;
  const padreDe = (k: Catalogo, v: ValorCatalogo) => (k.padre && v.padre ? cat.etiqueta(k.padre, v.padre) : null);

  return (
    <SeccionConfig id="conf-catalogos" titulo="Catálogos"
      accion={c && !c.fijo ? <button type="button" className="pn-conf-cab-btn" onClick={() => setAgregando(true)}>Agregar valor</button> : undefined}>
      {cat.cargando && !lista.length ? <Cargando lineas={4} etiqueta="Cargando las listas" />
        : cat.error && !lista.length ? <EstadoError texto={cat.error} alReintentar={() => void cat.recargar()} />
        : !c ? <Vacio titulo="Todavía no hay listas" texto="Las listas del panel aparecen aquí." icono="lista" />
        : (
          <>
            <Desplegable etiqueta="Catálogo" valor={c.clave} opciones={lista.map((k) => ({ valor: k.clave, etiqueta: k.nombre }))}
              alElegir={(v) => { if (v) setElegido(v); }} />
            {c.ayuda ? <p className="pn-conf-intro">{c.ayuda}</p> : null}
            {estaVacio(c) ? (
              <p className="pn-conf-nota pn-tono-aviso pn-conf-cat-aviso" role="status">
                <Icono nombre="alerta" tamano={16} />Esta lista no tiene ningún valor encendido. Mientras, las pantallas ofrecen los que tenía al empezar.
              </p>
            ) : null}
            {!c.en_pantalla ? <p className="pn-conf-nota">Ninguna pantalla la usa todavía: llega con la consulta y el asunto ajustables.</p> : null}
            {c.fijo ? <p className="pn-conf-nota">El panel depende de esta lista: sus valores se renombran y se acomodan, pero no se agregan ni se apagan.</p> : null}
            <Tarjeta className="pn-lista">
              <ListaReordenable items={c.valores} clave={(v) => v.id} nombre={(v) => v.etiqueta} etiqueta={c.nombre}
                alReordenar={(nuevo) => void reordenar(c, nuevo)}
                renderItem={(v, { asa }) => (
                  <div className="pn-conf-equipo-fila">
                    {asa}
                    <Fila alPulsar={() => abrir(v)} titulo={v.etiqueta}
                      subtitulo={[significadoDe(c, v), padreDe(c, v)].filter(Boolean).join(" · ") || undefined}
                      detalle={!v.activo ? "Ya no se ofrece" : undefined}
                      tonoDetalle={!v.activo ? "aviso" : "normal"}
                      derecha={v.de_sistema && !c.fijo ? <span className="pn-conf-tag" title="El panel lo usa: se renombra, no se apaga">Del sistema</span> : undefined} />
                    {c.fijo ? null : (
                      <span className="pn-conf-cat-sw">
                        <Switch checked={v.activo} disabled={(v.de_sistema && v.activo) || ocupado === v.id}
                          aria-label={`Ofrecer «${v.etiqueta}»`}
                          onCheckedChange={(activo) => void cambiar(c, v, { activo }, activo ? `«${v.etiqueta}» se vuelve a ofrecer` : `«${v.etiqueta}» ya no se ofrece; lo que ya la usa la conserva`)} />
                      </span>
                    )}
                  </div>
                )} />
            </Tarjeta>
            <p className="pn-conf-intro">Toca un valor para cambiarle el nombre. Arrastra para acomodarlos (o Alt con las flechas): así salen en las listas.</p>
          </>
        )}

      <HojaAdaptable abierta={editando !== null} alCerrar={() => setEditando(null)} titulo={visto?.etiqueta ?? "Valor"} descripcion={c?.nombre}>
        {visto && c ? (
          <FormaValor key={`${visto.id}-${visto.version}`} catalogo={c} valor={visto} ocupado={ocupado !== null}
            alGuardar={async (cambio) => {
              if (!Object.keys(cambio).length) { setEditando(null); return; }
              const v = c.valores.find((x) => x.id === visto.id) ?? visto;
              if (await cambiar(c, v, cambio, "Guardado")) setEditando(null);
            }} />
        ) : null}
      </HojaAdaptable>

      <HojaAdaptable abierta={agregando} alCerrar={() => setAgregando(false)} titulo="Agregar valor" descripcion={c?.nombre}>
        {c ? (
          <FormaValor key={`nuevo-${c.clave}`} catalogo={c} ocupado={ocupado !== null}
            alGuardar={async (cambio) => {
              if (ocupado || !cambio.etiqueta) return;
              setOcupado("nuevo");
              try {
                const v = await agregarValor(c.clave, cambio.etiqueta, { significado: cambio.significado, padre: cambio.padre });
                cat.poner(conValor(c, v));
                setAgregando(false);
                avisar(`«${v.etiqueta}» se agregó al final de la lista`);
              } catch (e) { fallo(e, "No se agregó el valor."); } finally { setOcupado(null); }
            }} />
        ) : null}
      </HojaAdaptable>
    </SeccionConfig>
  );
}

type Cambio = { etiqueta?: string; significado?: string | null; padre?: string | null };

/** El nombre de un valor y, si la lista lo pide, qué significa (de qué lado está un papel) o de qué tipo es. */
function FormaValor({ catalogo: c, valor, ocupado, alGuardar }: {
  catalogo: Catalogo; valor?: ValorCatalogo; ocupado: boolean; alGuardar: (cambio: Cambio) => void | Promise<void>;
}) {
  const cat = useCatalogos();
  const [etiqueta, setEtiqueta] = useState(valor?.etiqueta ?? "");
  const [significado, setSignificado] = useState(valor?.significado ?? c.significados[0]?.clave ?? "");
  const [padre, setPadre] = useState(valor?.padre ?? "");
  const nombre = etiqueta.trim();
  const repetido = c.valores.some((x) => x.id !== valor?.id && x.etiqueta.trim().toLowerCase() === nombre.toLowerCase());
  // Lo que el panel usa por su clave no cambia de significado (un papel «Propietario» no se pasa de lado).
  const fijoElSignificado = Boolean(valor?.de_sistema);
  const padres = c.padre ? cat.opciones(c.padre, padre || null) : [];

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (!nombre || repetido || ocupado) return;
    const cambio: Cambio = {};
    if (!valor || nombre !== valor.etiqueta) cambio.etiqueta = nombre;
    if (c.significados.length && !fijoElSignificado && (!valor || significado !== (valor.significado ?? ""))) cambio.significado = significado || null;
    if (c.padre && (!valor || padre !== (valor.padre ?? ""))) cambio.padre = padre || null;
    // Sin cambios, solo se cierra.
    void alGuardar(cambio);
  };

  return (
    <form noValidate style={{ display: "grid", gap: 12 }} onSubmit={enviar}>
      <Campo etiqueta="Nombre" value={etiqueta} maxLength={80} autoFocus autoComplete="off" onChange={(e) => setEtiqueta(e.target.value)}
        error={repetido ? "Ya hay un valor con ese nombre en esta lista." : undefined}
        ayuda={valor ? "Los asuntos que ya lo usan muestran el nombre nuevo." : undefined} />
      {c.significados.length ? (
        fijoElSignificado
          ? <p className="pn-conf-nota">{c.significado_nombre ?? "Significa"}: {c.significados.find((s) => s.clave === valor?.significado)?.etiqueta ?? "—"}. El panel lo usa así y no se cambia.</p>
          : <Desplegable etiqueta={c.significado_nombre ?? "Significa"} valor={significado} opciones={c.significados.map((s) => ({ valor: s.clave, etiqueta: s.etiqueta }))} alElegir={setSignificado} />
      ) : null}
      {c.padre ? <Desplegable etiqueta="De qué tipo" valor={padre} vacio="De cualquier tipo" opciones={padres} alElegir={setPadre} /> : null}
      <div className="pn-conf-acciones">
        <Boton type="submit" deshabilitado={!nombre || repetido || ocupado}>{ocupado ? "Guardando…" : valor ? "Guardar" : "Agregar"}</Boton>
      </div>
    </form>
  );
}
