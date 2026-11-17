"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { AsuntosDe } from "@/components/panel/asuntos/asuntos-de";
import { useColeccion } from "@/components/panel/datos/use-coleccion";
import { Avatar, copiarTexto, EditarDato, FilaDato, GrupoDatos, MenuMas, Pestanas, Rol, useAncho } from "@/components/panel/fichas/piezas";
import { Gesto, Icono } from "@/components/panel/icons";
import { useAvisos } from "@/components/panel/kit/avisos";
import { Boton } from "@/components/panel/kit/boton";
import { Campo } from "@/components/panel/kit/campo";
import { DesplegableFecha } from "@/components/panel/kit/desplegable";
import { EditarDatosPersona } from "@/components/panel/personas/formularios";
import { DocumentosPersona } from "@/components/panel/personas/documentos";
import { HojaQueBusca } from "@/components/panel/personas/que-busca";
import { HojaUnir } from "@/components/panel/personas/unir";
import type { ResultadoUnion } from "@/lib/panel/datos/personas-unir";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/panel/ui/dropdown-menu";
import { HojaAdaptable } from "@/components/panel/ui/hoja-adaptable";
import { Switch } from "@/components/panel/ui/switch";
import { ESTADO_LABELS, type Property } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import type { Evento, Lead } from "@/lib/domain/records";
import { diaLargo } from "@/lib/panel/calendario";
import { enlaceWhatsApp } from "@/lib/panel/datos/consultas";
import { editarPersona, type DatosEditables } from "@/lib/panel/datos/personas-acciones";
import {
  agregarNota, CANAL_NOMBRE, coincidencias, conCampo, conPerfil, conQueBusca, esDueno as esDuenoTipo, esMoral, ESTADOS_CIVILES, estadoPersona,
  faltanParaContratos, FORMAS_AVISO, historial, HORARIOS, LLEGO_POR, perfilDe, pistaContacto, posponer, precioCorto, proximoLunes, queBusca,
  ROL_DE_TIPO, siguientePaso, sumarDias, ultimoContacto, type DatosQueBusca,
} from "@/lib/panel/datos/personas-ficha";
import { relacionadoPersona, rutaInmueble, rutaPersona } from "@/lib/panel/datos/relacionado";
import { telefonoLegible } from "@/lib/panel/datos/vistas";

type Props = {
  /** La ficha abierta. */
  persona: Cliente;
  /** Todas las personas, para el aviso de duplicado al editar. */
  personas: Cliente[];
  /** El `guardar` de `useColeccion<Cliente>("clientes")` de quien lo usa. */
  guardar: (id: string, data: Cliente) => Promise<Cliente>;
  /** «Abrir la existente» desde el aviso de duplicado; si falta, navega a la ficha en Personas. */
  alAbrirPersona?: (id: string) => void;
  /** Versión leída de cada ficha (`versionDe` de `useColeccion`): «Unir» la manda al servidor. Sin ella, unir avisa. */
  versionDe?: (id: string) => number | null;
  /** Tras unir: recargar la lista. Si falta, se recarga la página. */
  alUnido?: (r: ResultadoUnion) => void;
};

/**
 * Ficha de una persona como los bocetos (16/11/2026): encabezado con contacto en un toque, «Lo que sigue»,
 * pestañas Resumen, Historial y Documentos, y los datos en una columna a la derecha (en pantalla angosta, pestaña «Datos»).
 * Cada cambio se guarda con la versión leída y avisa con Deshacer. Al cambiar de persona, sale de la edición.
 */
export function DetallePersona(props: Props) {
  return <DetalleDe key={props.persona.id} {...props} />;
}

type Pestana = "resumen" | "datos" | "historial" | "docs";
type Campo1 = { etiqueta: string; valor: string; opciones?: readonly string[]; ayuda?: string; max?: number; tipo?: "text" | "tel" | "email"; mayusculas?: boolean; cuentaDe?: number; guardar: (v: string) => Cliente };
/** Un renglón de «Datos»: lo que se ve y cómo se cambia. */
type Fila = { etiqueta: string; valor?: string; vacio?: string; avisoVacio?: boolean; secreto?: boolean; copiar?: boolean; sinAgregar?: boolean; campo?: Campo1 };

const fechaNum = (iso: string) => iso.slice(0, 10).split("-").reverse().join("/");
const NOMBRE_CANAL_MINUSCULA: Record<string, string> = { llamada: "llamada", whatsapp: "WhatsApp", correo: "correo" };

function DetalleDe({ persona, personas, guardar, alAbrirPersona, versionDe, alUnido }: Props) {
  const [hojaUnir, setHojaUnir] = useState(false);
  const { avisar } = useAvisos();
  const router = useRouter();
  const [ref, ancho] = useAncho<HTMLDivElement>();
  const ancha = ancho >= 760;
  const [pestana, setPestana] = useState<Pestana>("resumen");
  const [editando, setEditando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [campo, setCampo] = useState<Campo1 | null>(null);
  const [hojaSigue, setHojaSigue] = useState(false);
  const [hojaLlamada, setHojaLlamada] = useState(false);
  const [hojaBusca, setHojaBusca] = useState(false);
  const [nota, setNota] = useState("");
  const leads = useColeccion<Lead>("leads");
  const eventos = useColeccion<Evento>("eventos");
  const inmuebles = useColeccion<Property>("propiedades");
  const [hoy] = useState(() => new Date());

  const c = persona;
  const p = perfilDe(c);
  const nombre = c.nombre?.trim() || "Sin nombre";
  const primerNombre = nombre.split(/\s+/)[0] ?? "";
  const noContactar = Boolean(p.noContactar);
  const sigue = siguientePaso(c, hoy);
  const busca = queBusca(c);
  const coinciden = useMemo(() => coincidencias(c, inmuebles.datos), [c, inmuebles.datos]);
  const suInmueble = c.propiedadSlug ? inmuebles.datos.find((x) => x.slug === c.propiedadSlug) : undefined;
  const esDueno = esDuenoTipo(c.tipo);
  const moral = esMoral(c);
  const archivada = Boolean(p.archivado);
  const unidaEn = p.unidaEn ? personas.find((x) => x.id === p.unidaEn) : undefined;
  const eventosHist = useMemo(() => historial(c, { leads: leads.datos, eventos: eventos.datos }), [c, leads.datos, eventos.datos]);
  const relacion = useMemo(() => relacionadoPersona(c, { leads: leads.datos, eventos: eventos.datos, inmuebles: inmuebles.datos, hoy: sumarDias(hoy, 0) }), [c, leads.datos, eventos.datos, inmuebles.datos, hoy]);
  const citas = relacion.find((g) => g.titulo === "Próximas citas");
  const suConsulta = c.leadId ? leads.datos.find((l) => l.id === c.leadId) : undefined;

  const abrirExistente = (id: string) => { if (alAbrirPersona) alAbrirPersona(id); else router.push(rutaPersona(id)); };

  /** Guarda y avisa; por omisión con Deshacer (vuelve a la versión anterior). */
  const cambiar = useCallback(async (sig: Cliente, texto: string, accion?: { etiqueta: string; alAccionar: () => void }) => {
    const previa = c;
    setOcupado(true);
    try {
      await guardar(previa.id, sig);
      avisar(texto, accion ?? { etiqueta: "Deshacer", alAccionar: () => {
        guardar(previa.id, previa).then(() => avisar("Se deshizo"), (e: unknown) => avisar(e instanceof Error ? e.message : "No se pudo deshacer."));
      } });
      return true;
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se guardó. Vuelve a intentarlo.");
      return false;
    } finally { setOcupado(false); }
  }, [c, guardar, avisar]);

  const guardarDatos = useCallback(async (d: DatosEditables) => {
    if (await cambiar(editarPersona(c, d), "Datos guardados")) setEditando(false);
  }, [c, cambiar]);

  if (editando) {
    return (
      <EditarDatosPersona persona={c} personas={personas} ocupado={ocupado}
        alGuardar={(d) => void guardarDatos(d)} alCancelar={() => setEditando(false)} alAbrirExistente={abrirExistente} />
    );
  }

  // Contacto en un toque, por el canal que prefiere.
  const tel = c.telefono?.replace(/[^\d+]/g, "");
  const numWa = p.whatsapp || c.telefono;
  const wa = numWa ? enlaceWhatsApp(numWa, `Hola ${primerNombre}, te escribo de Fortius Inmuebles.`) : null;
  const canales = [
    { clave: "llamada", etiqueta: "Llamar", icono: "llamada" as const, href: tel ? `tel:${tel}` : null, externo: false },
    { clave: "whatsapp", etiqueta: "WhatsApp", icono: "mensaje" as const, href: wa, externo: true },
    { clave: "correo", etiqueta: "Correo", icono: "expediente" as const, href: c.email ? `mailto:${c.email}` : null, externo: false },
  ];
  const editar = (x: Campo1) => setCampo(x);
  const guardarCampo = async (v: string) => {
    if (!campo) return;
    const sig = campo.guardar(v);
    setCampo(null);
    await cambiar(sig, `Guardado: ${campo.etiqueta}`);
  };

  // ---------- Datos: Contacto, Para contratos y Privacidad ----------
  const casado = c.estadoCivil === "Casado(a)";
  const regimen = p.regimen;
  const conyuge = p.conyuge;
  const nombreLegal = p.nombreLegal?.trim() || c.nombre;
  const contacto: Fila[] = [
    { etiqueta: "Teléfono", valor: telefonoLegible(c.telefono), copiar: true,
      campo: { etiqueta: "Teléfono", valor: c.telefono ?? "", tipo: "tel", max: 40, guardar: (v) => conCampo(c, "telefono", v) } },
    { etiqueta: "WhatsApp", valor: p.whatsapp ? telefonoLegible(p.whatsapp) : c.telefono ? "El mismo del teléfono" : "",
      campo: { etiqueta: "WhatsApp", valor: p.whatsapp ?? "", tipo: "tel", max: 40, ayuda: "Déjalo vacío si es el mismo número del teléfono.", guardar: (v) => conPerfil(c, { whatsapp: v.trim() }) } },
    { etiqueta: "Correo", valor: c.email, copiar: true,
      campo: { etiqueta: "Correo", valor: c.email ?? "", tipo: "email", max: 160, guardar: (v) => conCampo(c, "email", v) } },
    { etiqueta: "Prefiere", valor: CANAL_NOMBRE[p.canalPreferido ?? ""], vacio: "Sin indicar",
      campo: { etiqueta: "Prefiere", valor: CANAL_NOMBRE[p.canalPreferido ?? ""] ?? "", opciones: ["Llamada", "WhatsApp", "Correo"],
        guardar: (v) => conPerfil(c, { canalPreferido: ({ Llamada: "llamada", WhatsApp: "whatsapp", Correo: "correo" } as Record<string, string>)[v] }) } },
    { etiqueta: "Mejor horario", valor: p.horario === "Cualquier hora" ? "Cualquier hora" : p.horario ? `Por la ${p.horario.toLowerCase()}` : "", vacio: "Sin indicar",
      campo: { etiqueta: "Mejor horario", valor: p.horario ?? "", opciones: HORARIOS, guardar: (v) => conPerfil(c, { horario: v }) } },
  ];
  const rfc: Fila = { etiqueta: "RFC", valor: c.rfc, secreto: true, copiar: true,
    campo: { etiqueta: "RFC", valor: c.rfc ?? "", max: 13, mayusculas: true, cuentaDe: moral ? 12 : 13,
      ayuda: moral ? "Persona moral: 12 caracteres" : "Persona física: 13 caracteres; empresa: 12", guardar: (v) => conCampo(c, "rfc", v) } };
  // Casilla «Persona moral» también desde «Datos»: cambia lo que se pide para contratos.
  const tipoPersona: Fila = { etiqueta: "Tipo de persona", valor: moral ? "Persona moral (empresa)" : "Persona física",
    campo: { etiqueta: "Tipo de persona", valor: moral ? "Persona moral (empresa)" : "Persona física", opciones: ["Persona física", "Persona moral (empresa)"],
      // Se guarda también «no» (conPerfil quitaría el false) para que un RFC de 12 no la vuelva moral sin querer.
      guardar: (v) => { const s = conPerfil(c, {}); return { ...s, perfil: { ...(s.perfil ?? {}), personaMoral: v === "Persona moral (empresa)" } as Cliente["perfil"] }; } } };
  const contratosSinTipo: Fila[] = moral ? [
    { etiqueta: "Razón social", valor: nombreLegal,
      campo: { etiqueta: "Razón social", valor: nombreLegal ?? "", max: 160, ayuda: "Como aparece en su acta constitutiva", guardar: (v) => conPerfil(c, { nombreLegal: v.trim() }) } },
    rfc,
    { etiqueta: "Representante legal", valor: p.representante,
      campo: { etiqueta: "Representante legal", valor: p.representante ?? "", max: 160, ayuda: "Nombre completo", guardar: (v) => conPerfil(c, { representante: v.trim() }) } },
    { etiqueta: "Domicilio fiscal", valor: c.domicilio,
      campo: { etiqueta: "Domicilio fiscal", valor: c.domicilio ?? "", max: 400, guardar: (v) => conCampo(c, "domicilio", v) } },
  ] : [
    { etiqueta: "Nombre completo", valor: nombreLegal,
      campo: { etiqueta: "Nombre completo", valor: nombreLegal ?? "", max: 160, ayuda: "Como aparece en su identificación", guardar: (v) => conPerfil(c, { nombreLegal: v.trim() === c.nombre ? undefined : v.trim() }) } },
    { etiqueta: "Estado civil", valor: c.estadoCivil,
      campo: { etiqueta: "Estado civil", valor: c.estadoCivil ?? "", opciones: ESTADOS_CIVILES,
        guardar: (v) => { const s = conCampo(c, "estadoCivil", v); return v === "Casado(a)" ? s : conPerfil(s, { regimen: undefined, conyuge: undefined }); } } },
    ...(casado ? [{ etiqueta: "Régimen matrimonial", valor: regimen,
      campo: { etiqueta: "Régimen matrimonial", valor: regimen ?? "", opciones: ["Sociedad conyugal", "Separación de bienes"], guardar: (v: string) => conPerfil(c, { regimen: v }) } }] : []),
    ...(casado && regimen !== "Separación de bienes" ? [{ etiqueta: "Cónyuge", valor: conyuge,
      campo: { etiqueta: "Cónyuge", valor: conyuge ?? "", max: 160, ayuda: "Nombre completo", guardar: (v: string) => conPerfil(c, { conyuge: v.trim() }) } }] : []),
    { etiqueta: "CURP", valor: c.curp, secreto: true, copiar: true,
      campo: { etiqueta: "CURP", valor: c.curp ?? "", max: 18, mayusculas: true, cuentaDe: 18, ayuda: "18 caracteres", guardar: (v) => conCampo(c, "curp", v) } },
    rfc,
    { etiqueta: "Identificación", valor: c.identificacion,
      campo: { etiqueta: "Identificación", valor: c.identificacion ?? "", max: 160, ayuda: "Por ejemplo: INE vigente hasta 2030", guardar: (v) => conCampo(c, "identificacion", v) } },
    { etiqueta: "Domicilio", valor: c.domicilio,
      campo: { etiqueta: "Domicilio", valor: c.domicilio ?? "", max: 400, guardar: (v) => conCampo(c, "domicilio", v) } },
  ];
  const contratos: Fila[] = [tipoPersona, ...contratosSinTipo];
  const faltan = faltanParaContratos(c);
  const consejos = [
    faltan.length ? `Para llenar los formatos faltan: ${faltan.join(", ")}.` : "",
    !moral && casado && regimen === "Sociedad conyugal" && esDueno ? "Con sociedad conyugal, el cónyuge también firma al vender o rentar." : "",
  ].filter(Boolean).join(" ");

  // Privacidad: firmado o aceptado (con fecha), enviado sin aceptar, o pendiente (ámbar, con «Enviar» y «Ya lo firmó»).
  const aviso = p.avisoPrivacidad;
  const enviado = !aviso ? p.avisoEnviado : undefined;
  const pendiente = !aviso && !enviado;
  const porCorreo = p.canalPreferido === "correo" && Boolean(c.email);
  const via = porCorreo ? "correo" : "WhatsApp";
  const ligaAviso = `${typeof window !== "undefined" ? window.location.origin : ""}/privacidad`;
  const hrefAviso = porCorreo
    ? `mailto:${c.email}?subject=${encodeURIComponent("Aviso de privacidad de Fortius Inmuebles")}&body=${encodeURIComponent(`Hola ${primerNombre}, te comparto nuestro aviso de privacidad: ${ligaAviso}`)}`
    : numWa ? enlaceWhatsApp(numWa, `Hola ${primerNombre}, te comparto el aviso de privacidad de Fortius Inmuebles: ${ligaAviso}`) : null;
  const hoyTxt = sumarDias(hoy, 0);
  const conAviso = (forma: string) => forma === "Enviado, falta que lo acepte"
    ? conPerfil(c, { avisoEnviado: hoyTxt, avisoEnviadoPor: via, avisoPrivacidad: undefined, avisoForma: undefined })
    : conPerfil(c, { avisoPrivacidad: hoyTxt, avisoForma: forma, avisoEnviado: undefined, avisoEnviadoPor: undefined });
  const llegoDefecto = p.llegoPor ?? (suConsulta ? (suConsulta.origen === "manual" ? "" : "Sitio web") : "");
  const privacidad: Fila[] = [
    { etiqueta: "Aviso de privacidad", vacio: "No se le ha dado", avisoVacio: true, sinAgregar: true,
      valor: aviso ? `${p.avisoForma ?? "Firmado"}, ${fechaNum(aviso)}` : enviado ? `Enviado por ${p.avisoEnviadoPor ?? "WhatsApp"}, ${fechaNum(enviado)} · falta que lo acepte` : "",
      campo: { etiqueta: "Aviso de privacidad", valor: aviso ? p.avisoForma ?? "" : enviado ? "Enviado, falta que lo acepte" : "", opciones: FORMAS_AVISO, guardar: conAviso } },
    { etiqueta: "Llegó por", valor: llegoDefecto, vacio: "Sin indicar",
      campo: { etiqueta: "Llegó por", valor: llegoDefecto, opciones: LLEGO_POR, guardar: (v) => conPerfil(c, { llegoPor: v }) } },
  ];

  const fila = (f: Fila) => (
    <FilaDato key={f.etiqueta} etiqueta={f.etiqueta} valor={f.valor} vacio={f.vacio} avisoVacio={f.avisoVacio} secreto={f.secreto} copiar={f.copiar} sinAgregar={f.sinAgregar}
      alCopiar={(t) => copiarTexto(t, avisar, `Copiado: ${f.etiqueta}`)} alEditar={f.campo ? () => editar(f.campo!) : undefined} />
  );

  /** ⋯ › Completar datos: abre el primer dato que falta; si no falta nada, el formulario completo. */
  const completar = () => {
    const primero = [...contacto, ...contratos].find((f) => !f.valor?.trim() && f.campo && !f.sinAgregar);
    if (primero?.campo) editar(primero.campo); else setEditando(true);
  };

  const datos = (
    <>
      <GrupoDatos titulo="Contacto">{contacto.map(fila)}</GrupoDatos>
      <GrupoDatos titulo="Para contratos" nota={faltan.length ? `Faltan ${faltan.length}` : "Completos"} notaAviso={faltan.length > 0} consejo={consejos || undefined}>
        {contratos.map(fila)}
      </GrupoDatos>
      <GrupoDatos titulo="Privacidad" nota={pendiente ? "Pendiente" : undefined} notaAviso
        consejo={pendiente ? "Sin aviso no se guardan sus documentos ni se usan sus datos para contratos." : undefined}
        acciones={pendiente ? (
          <>
            {hrefAviso ? (
              <a className="pn-btn pn-btn-primario" href={hrefAviso} target={porCorreo ? undefined : "_blank"} rel={porCorreo ? undefined : "noopener noreferrer"}
                onClick={() => void cambiar(conAviso("Enviado, falta que lo acepte"), "Aviso de privacidad enviado")}>Enviar por {via}</a>
            ) : <Boton deshabilitado>Enviar por {via}</Boton>}
            <Boton variante="secundario" deshabilitado={ocupado} onClick={() => void cambiar(conAviso("Firmado en papel"), "Aviso marcado como firmado")}>Ya lo firmó</Boton>
          </>
        ) : undefined}>
        {privacidad.map(fila)}
      </GrupoDatos>
      <p className="fx-chico">CURP y RFC se ven ocultos. Son datos personales: no salen del panel.</p>
    </>
  );

  // ---------- Lo que sigue: Posponer y Hecho, o «Agregar siguiente paso» ----------
  const cuandos = [
    { etiqueta: "Mañana", fecha: sumarDias(hoy, 1), aviso: "Siguiente paso: mañana" },
    { etiqueta: "Lunes", fecha: proximoLunes(hoy), aviso: "Siguiente paso: el lunes" },
  ];
  const tarjetaSigue = (
    <section aria-label="Lo que sigue" className="fx-sigue">
      {sigue ? (
        <>
          <div className="fx-sigue-txt">
            <span className="fx-sigue-cuando" data-tono={sigue.tono}>Lo que sigue · {sigue.cuando}</span>
            <span className="fx-sigue-que">{sigue.que}</span>
            <span className="fx-sigue-ref">{sigue.referencia || "Lo que acordaron"}</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger className="pn-btn fx-btn-oscuro" disabled={ocupado}>Posponer</DropdownMenuTrigger>
              <DropdownMenuContent className="w-60" aria-label="Cuándo">
                {cuandos.map((x) => (
                  <DropdownMenuItem key={x.etiqueta} onSelect={() => void cambiar(posponer(c, x.fecha), x.aviso)}>
                    <span style={{ flex: 1 }}>{x.etiqueta}</span><span style={{ fontSize: 12, color: "var(--ink-muted)" }}>{diaLargo(x.fecha)}</span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setHojaSigue(true)}>Elegir fecha…</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Boton variante="secundario" className="fx-btn-claro" deshabilitado={ocupado}
              onClick={() => void cambiar(agregarNota(conPerfil(c, { proximaAccion: undefined, proximoContacto: undefined, referencia: undefined }), `Hecho: ${sigue.que}`),
                "Hecho. ¿Qué sigue?", { etiqueta: "Agregar", alAccionar: () => setHojaSigue(true) })}>Hecho</Boton>
          </div>
        </>
      ) : (
        <>
          <div className="fx-sigue-txt">
            <span className="fx-sigue-cuando" data-tono="sin">Sin siguiente paso · último contacto {ultimoContacto(c, hoy)}</span>
            <span style={{ fontSize: 14, color: "var(--border-strong)" }}>Agenda qué sigue para no perderle la pista.</span>
          </div>
          <Boton variante="secundario" className="fx-btn-claro" onClick={() => setHojaSigue(true)}>Agregar siguiente paso</Boton>
        </>
      )}
    </section>
  );

  // ---------- Resumen: qué busca u ofrece, coincidencias, sus inmuebles ----------
  const canalMinuscula = NOMBRE_CANAL_MINUSCULA[p.canalPreferido ?? ""] ?? "WhatsApp";
  const alternarAvisar = () => void cambiar(conPerfil(c, { avisarNuevos: !p.avisarNuevos }), p.avisarNuevos ? "Ya no se le avisará de nuevos" : "Se le avisará de inmuebles nuevos");
  const idSwitch = `avisar-${c.id}`;
  const resumen = (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {busca ? (
        <section className="fx-seccion">
          <div className="fx-seccion-cab"><h3>{busca.titulo}</h3><button type="button" className="fx-enlace" onClick={() => setHojaBusca(true)}>Editar</button></div>
          <div className="fx-tarjeta fx-kv">{busca.filas.map((f) => <div key={f.k}><span>{f.k}</span><b>{f.v}</b></div>)}</div>
        </section>
      ) : null}
      {!esDueno && busca ? (
        <section className="fx-seccion">
          <div className="fx-seccion-cab" style={{ alignItems: "center", flexWrap: "wrap" }}>
            <h3>Coincidencias <span className="fx-tenue">· {coinciden.length}</span></h3>
            {ancha ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--ink-muted)", minHeight: 44 }}>
                <label htmlFor={idSwitch} style={{ cursor: "pointer" }}>Avisarle de nuevos por {canalMinuscula}</label>
                <Switch id={idSwitch} checked={Boolean(p.avisarNuevos)} disabled={ocupado} onCheckedChange={alternarAvisar} />
              </span>
            ) : <Link href="/panel/inmuebles" className="fx-enlace">Ver todas</Link>}
          </div>
          {coinciden.length ? (
            <div className="fx-pcs">
              {coinciden.slice(0, 3).map((x) => {
                const foto = x.galeria.find((g) => !g.oculta)?.src;
                return (
                  <Link key={x.slug} href={rutaInmueble(x.codigo)} className="fx-pc">
                    {/* eslint-disable-next-line @next/next/no-img-element -- foto del inventario en una tarjeta chica */}
                    <span className="fx-ph">{foto ? <img src={foto} alt="" /> : "Foto del inmueble"}</span>
                    <b>{precioCorto(x)}</b>
                    <span>{x.titulo}</span>
                  </Link>
                );
              })}
            </div>
          ) : <div className="fx-tarjeta" style={{ padding: "14px 16px", fontSize: 14, color: "var(--ink-muted)" }}>Por ahora nada del inventario coincide.</div>}
          {ancha ? null : (
            <div className="fx-tarjeta" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", minHeight: 60 }}>
              <label htmlFor={idSwitch} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, cursor: "pointer" }}>
                <span style={{ fontSize: 15, fontWeight: 500 }}>Avisarle de inmuebles nuevos</span>
                <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>Por {canalMinuscula}, cuando entre uno que coincida</span>
              </label>
              <Switch id={idSwitch} checked={Boolean(p.avisarNuevos)} disabled={ocupado} onCheckedChange={alternarAvisar} />
            </div>
          )}
        </section>
      ) : null}
      {suInmueble ? (
        <section className="fx-seccion">
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{esDueno ? "Sus inmuebles" : "Le interesa"}</h3>
          <div className="fx-tarjeta">
            <Link href={rutaInmueble(suInmueble.codigo)} className="fx-opt">
              <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontWeight: 600 }}>{suInmueble.titulo}</span>
                <span className="fx-h">{esDueno ? ESTADO_LABELS[suInmueble.estado] : precioCorto(suInmueble)}</span>
              </span>
              <Gesto nombre="derecha" tamano={18} />
            </Link>
          </div>
        </section>
      ) : null}
      {!busca && !suInmueble ? (
        <div className="fx-tarjeta fx-vacio">
          <b>Sin búsqueda ni inmuebles</b>
          <span>Anota qué busca para ver coincidencias, o liga un inmueble suyo.</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
            <Boton variante="secundario" onClick={() => setHojaBusca(true)}>{esDueno ? "Anotar qué ofrece" : "Anotar qué busca"}</Boton>
            <Link className="pn-btn pn-btn-secundario" href="/panel/inmuebles">Ligar inmueble</Link>
          </div>
        </div>
      ) : null}
      {citas?.enlaces.length ? (
        <section className="fx-seccion">
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Próximas citas</h3>
          <div className="fx-tarjeta">{citas.enlaces.map((e) => <Link key={e.id} href={e.href} className="fx-opt"><span>{e.texto}</span><span className="fx-h">{e.detalle}</span></Link>)}</div>
        </section>
      ) : null}
      <AsuntosDe clienteId={c.id} />
    </div>
  );

  // ---------- Historial con nota y registro rápido de llamada ----------
  const guardarNota = () => {
    const t = nota.trim();
    if (!t || ocupado) return;
    void cambiar(agregarNota(c, t), "Nota guardada").then((ok) => { if (ok) setNota(""); });
  };
  const botonLlamada = <Boton onClick={() => setHojaLlamada(true)} bloque={!ancha}><Icono nombre="llamada" tamano={18} />Registrar llamada</Boton>;
  const historialVista = (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <form className="fx-nota-form" onSubmit={(e) => { e.preventDefault(); guardarNota(); }}>
        <label style={{ display: "contents" }}>
          <span className="pn-solo-lector">Agregar nota</span>
          <input type="text" value={nota} maxLength={500} onChange={(e) => setNota(e.target.value)} placeholder={ancha ? "Agregar nota y pulsar Enter" : "Agregar nota"} />
        </label>
        {ancha ? botonLlamada : <Boton type="submit" variante="secundario" deshabilitado={!nota.trim() || ocupado}>Guardar</Boton>}
      </form>
      {ancha ? null : botonLlamada}
      {eventosHist.length ? (
        <div className="fx-tarjeta">
          {eventosHist.map((h, i) => (
            <div key={`${h.clave}-${i}`} className="fx-ev">
              <span className="fx-ev-punto" aria-hidden><Icono nombre={h.icono} tamano={16} /></span>
              <span className="fx-ev-txt"><b>{h.titulo}</b><span>{h.cuando}</span></span>
            </div>
          ))}
        </div>
      ) : <div className="fx-tarjeta" style={{ padding: "14px 16px", fontSize: 14, color: "var(--ink-muted)" }}>Todavía no hay notas ni llamadas.</div>}
    </div>
  );

  // ---------- Documentos: el aviso de privacidad aquí; lo demás vive en sus asuntos ----------
  const estadoAviso = aviso ? "Firmado" : enviado ? "Enviado" : "Falta";
  // Identificación oficial, aviso de privacidad y comprobante de domicilio, con visor y «Subir» (se guardan en uno de sus asuntos).
  const docs = (
    <DocumentosPersona persona={c} aviso={estadoAviso} ancha={ancha} alAviso={() => { if (ancha) editar(privacidad[0].campo!); else setPestana("datos"); }} />
  );

  const pestanas = [
    { valor: "resumen" as const, etiqueta: "Resumen" },
    ...(ancha ? [] : [{ valor: "datos" as const, etiqueta: "Datos" }]),
    { valor: "historial" as const, etiqueta: "Historial" },
    { valor: "docs" as const, etiqueta: "Documentos" },
  ];
  const vista = ancha && pestana === "datos" ? "resumen" : pestana;

  const menu = (
    <MenuMas items={[
      ancha ? { etiqueta: "Completar datos", alPulsar: completar } : { etiqueta: "Editar datos", alPulsar: () => setPestana("datos") },
      { etiqueta: "Unir con un duplicado", alPulsar: () => setHojaUnir(true) },
      { etiqueta: "Compartir contacto", alPulsar: () => copiarTexto([nombre, telefonoLegible(c.telefono), c.email].filter(Boolean).join("\n"), avisar, "Contacto copiado") },
      { etiqueta: noContactar ? "Permitir contacto de nuevo" : "Pidió no ser contactado",
        alPulsar: () => void cambiar(conPerfil(c, { noContactar: !noContactar }), noContactar ? "Contacto permitido de nuevo" : "Marcada como no contactar") },
      archivada
        ? { etiqueta: "Sacar del archivo", separar: true, alPulsar: () => void cambiar(conPerfil(c, { archivado: undefined, unidaEn: undefined, unidaEl: undefined }), `${nombre} volvió a la lista`) }
        : { etiqueta: "Archivar", separar: true, alPulsar: () => void cambiar(conPerfil(c, { archivado: true }), `${nombre} archivada`) },
    ]} />
  );
  const botonesContacto = canales.map((x) => {
    const apagado = noContactar || !x.href;
    const pref = p.canalPreferido === x.clave;
    return (
      <a key={x.clave} className="pn-btn pn-btn-secundario" href={apagado ? undefined : x.href ?? undefined} aria-disabled={apagado || undefined}
        target={x.externo ? "_blank" : undefined} rel={x.externo ? "noopener noreferrer" : undefined} title={pref ? "Canal preferido" : x.etiqueta}
        style={ancha ? undefined : { position: "relative", flexDirection: "column", gap: 4, minHeight: 64, paddingTop: 10 }}>
        {pref && !ancha ? (
          <span style={{ position: "absolute", top: -9, left: "50%", transform: "translateX(-50%)", padding: "1px 6px", borderRadius: "var(--r-sm)", background: "var(--accent)", color: "var(--accent-ink)", fontSize: 11, fontWeight: 600, lineHeight: "16px" }}>Prefiere</span>
        ) : null}
        <Icono nombre={x.icono} tamano={ancha ? 18 : 20} />{x.etiqueta}{pref && ancha ? <span className="fx-pref" aria-label="Canal preferido" /> : null}
      </a>
    );
  });
  const notaNoContactar = noContactar ? <div role="note" className="fx-nota-roja">Pidió no ser contactado. Los botones de contacto están apagados.</div> : null;

  return (
    <div ref={ref} className="fx-ficha">
      <div className="fx-cab">
        <Avatar nombre={nombre} grande />
        <div className="fx-cab-txt">
          <h2>{nombre}</h2>
          <div className="fx-cab-meta"><Rol grande>{ROL_DE_TIPO[c.tipo]}</Rol><span>{ancha ? `${estadoPersona(c)} · ${pistaContacto(c)}` : estadoPersona(c)}</span></div>
        </div>
        {ancha ? <div className="fx-acciones">{botonesContacto}{menu}</div> : menu}
      </div>
      {notaNoContactar}
      {archivada ? (
        <div role="note" className="fx-tarjeta" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: "10px 14px", fontSize: 14 }}>
          <span style={{ flex: 1, minWidth: 200 }}>
            {unidaEn ? <>Archivada: se unió con <b>{unidaEn.nombre?.trim() || "otra ficha"}</b>.</> : "Archivada: no sale en la lista de Personas."}
          </span>
          {unidaEn ? <Boton variante="texto" onClick={() => abrirExistente(unidaEn.id)}>Abrir la que se quedó</Boton>
            : <Boton variante="texto" deshabilitado={ocupado} onClick={() => void cambiar(conPerfil(c, { archivado: undefined }), `${nombre} volvió a la lista`)}>Sacar del archivo</Boton>}
        </div>
      ) : null}
      {ancha ? null : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>{botonesContacto}</div>
          <p className="fx-consejo">{pistaContacto(c)}</p>
        </div>
      )}
      <div className="fx-cols">
        <div className="fx-col-main">
          {tarjetaSigue}
          <Pestanas etiqueta="Secciones del perfil" opciones={pestanas} valor={vista} alElegir={setPestana} segmentadas={!ancha} />
          {vista === "resumen" ? resumen : vista === "historial" ? historialVista : vista === "docs" ? docs : <div className="fx-col-datos">{datos}</div>}
        </div>
        {ancha ? <aside aria-label="Datos" className="fx-col-datos">{datos}</aside> : null}
      </div>

      <EditarDato abierto={campo !== null} etiqueta={campo?.etiqueta ?? ""} valor={campo?.valor ?? ""} opciones={campo?.opciones} ayuda={campo?.ayuda}
        max={campo?.max} tipo={campo?.tipo} mayusculas={campo?.mayusculas} cuentaDe={campo?.cuentaDe} alGuardar={(v) => void guardarCampo(v)} alCerrar={() => setCampo(null)} />
      <HojaSiguiente abierta={hojaSigue} persona={c} hoy={hoy} ocupado={ocupado} alCerrar={() => setHojaSigue(false)}
        alGuardar={(que, fecha) => void cambiar(conPerfil(c, { proximaAccion: que.slice(0, 160), proximoContacto: fecha ?? undefined }), fecha ? `Siguiente paso: ${diaLargo(fecha)}` : "Siguiente paso guardado").then((ok) => { if (ok) setHojaSigue(false); })} />
      <HojaUnir abierta={hojaUnir} persona={c} personas={personas} versionDe={versionDe} alCerrar={() => setHojaUnir(false)}
        alUnido={(r) => {
          setHojaUnir(false);
          const quedo = personas.find((x) => x.id === r.queda)?.nombre?.trim() || "la ficha que se queda";
          avisar(`Fichas unidas en ${quedo}. La otra quedó archivada.`, { duracion: 8000 });
          if (alUnido) alUnido(r); else router.refresh();
          if (r.queda !== c.id) abrirExistente(r.queda);
        }} />
      <HojaQueBusca abierta={hojaBusca} persona={c} ocupado={ocupado} alCerrar={() => setHojaBusca(false)}
        alGuardar={(d: DatosQueBusca) => void cambiar(conQueBusca(c, d), esDueno ? "Guardado: qué ofrece" : "Guardado: qué busca").then((ok) => { if (ok) setHojaBusca(false); })} />
      <HojaAdaptable abierta={hojaLlamada} titulo="¿Cómo te fue?" descripcion={`Llamada con ${nombre}`} alCerrar={() => setHojaLlamada(false)}>
        <div className="fx-tarjeta" style={{ marginTop: 8 }}>
          {[
            { t: "Contestó, sigue interesado", h: "Seguimiento en 3 días", aviso: "Llamada registrada · seguimiento en 3 días",
              sig: () => conPerfil(agregarNota(c, "Llamada · sigue interesado"), { proximaAccion: "Dar seguimiento", proximoContacto: sumarDias(hoy, 3), referencia: undefined }) },
            { t: "No contestó", h: "Reintentar mañana", aviso: "Llamada registrada · reintentar mañana",
              sig: () => conPerfil(agregarNota(c, "Llamada · no contestó"), { proximaAccion: "Volver a llamar", proximoContacto: sumarDias(hoy, 1), referencia: undefined }) },
            { t: "Pidió que le llame después", h: "Elegir cuándo", aviso: "Llamada registrada", sig: null },
            { t: "Ya no le interesa", h: "Sin siguiente paso", aviso: "Llamada registrada",
              sig: () => conPerfil(agregarNota(c, "Llamada · ya no le interesa"), { proximaAccion: undefined, proximoContacto: undefined, referencia: undefined }) },
          ].map((o) => (
            <button key={o.t} type="button" className="fx-opt" disabled={ocupado} onClick={() => {
              if (!o.sig) { void cambiar(agregarNota(c, "Llamada · pidió llamar después"), o.aviso).then(() => { setHojaLlamada(false); setHojaSigue(true); }); return; }
              void cambiar(o.sig(), o.aviso).then((ok) => { if (ok) setHojaLlamada(false); });
            }}>{o.t}<span className="fx-h">{o.h}</span></button>
          ))}
        </div>
      </HojaAdaptable>
    </div>
  );
}

/** «Agregar siguiente paso» o «Elegir fecha»: qué sigue y cuándo. */
function HojaSiguiente({ abierta, persona, hoy, ocupado, alGuardar, alCerrar }: {
  abierta: boolean; persona: Cliente; hoy: Date; ocupado: boolean; alGuardar: (que: string, fecha: string | null) => void; alCerrar: () => void;
}) {
  return (
    <HojaAdaptable abierta={abierta} titulo="Lo que sigue" descripcion="Lo que acordaron o anotaste, con su fecha." alCerrar={alCerrar}>
      {abierta ? <FormSiguiente key={persona.id} persona={persona} hoy={hoy} ocupado={ocupado} alGuardar={alGuardar} /> : null}
    </HojaAdaptable>
  );
}

function FormSiguiente({ persona, hoy, ocupado, alGuardar }: { persona: Cliente; hoy: Date; ocupado: boolean; alGuardar: (que: string, fecha: string | null) => void }) {
  const p = perfilDe(persona);
  const [que, setQue] = useState(p.proximaAccion ?? "");
  const [fecha, setFecha] = useState<string | null>(p.proximoContacto ?? sumarDias(hoy, 1));
  return (
    <form style={{ display: "grid", gap: 12, marginTop: 8 }} onSubmit={(e) => { e.preventDefault(); if (que.trim() && !ocupado) alGuardar(que.trim(), fecha); }}>
      <Campo etiqueta="Qué sigue" placeholder="Llamarle para agendar visita" value={que} maxLength={160} onChange={(e) => setQue(e.target.value)} autoComplete="off" />
      <DesplegableFecha valor={fecha} alElegir={setFecha} hoy={hoy} etiquetaCalendario="Cuándo" />
      <Boton type="submit" bloque deshabilitado={!que.trim() || ocupado}>Guardar</Boton>
    </form>
  );
}
