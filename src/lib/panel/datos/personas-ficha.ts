import type { Property } from "@/data/propiedades";
import { formatPrecio, TIPO_LABELS } from "@/data/propiedades";
import type { Cliente } from "@/lib/backend/contracts";
import type { Evento, Lead } from "@/lib/domain/records";
import { LEAD_PROFILE_OPTIONS } from "@/lib/lead-profile";
import { aTexto, deTexto, diasDesde, DIAS_LARGOS, MESES_CORTOS } from "@/lib/panel/calendario";

/**
 * Ficha de Personas según el boceto (16/11/2026): papel, lo que sigue, qué busca, coincidencias e historial.
 * Funciones puras; la pantalla guarda con la versión que leyó.
 */

/** El papel como lo dice el boceto (Vende, Compra, Pone en renta, Renta, Aliado). */
export const ROL_DE_TIPO: Record<Cliente["tipo"], string> = {
  propietario: "Vende", comprador: "Compra", arrendador: "Pone en renta", arrendatario: "Renta", inversionista: "Invierte", otro: "Otro",
};

/** Días sin contacto a partir de los cuales una persona sin siguiente paso se marca «Sin seguimiento». */
export const DIAS_SIN_SEGUIMIENTO = 14;

type PerfilFicha = {
  proximaAccion?: string; proximoContacto?: string; canalPreferido?: string; horario?: string; noContactar?: boolean;
  avisarNuevos?: boolean; avisoPrivacidad?: string; referencia?: string; whatsapp?: string;
  /** Campos sin columna propia: viajan dentro del perfil (el servidor los conserva tal cual). */
  regimen?: string; conyuge?: string; nombreLegal?: string; representante?: string; personaMoral?: boolean;
  avisoForma?: string; avisoEnviado?: string; avisoEnviadoPor?: string; llegoPor?: string;
  /** Archivada: sale de la lista y se recupera desde «Ver archivados». Al unir, la que se va queda archivada y dice en cuál se unió. */
  archivado?: boolean; unidaEn?: string; unidaEl?: string;
};

/** Archivada (a mano o por unirse con otra ficha). */
export const estaArchivada = (c: Cliente) => Boolean(perfilDe(c).archivado);
export const perfilDe = (c: Cliente): PerfilFicha => (c.perfil ?? {}) as PerfilFicha;

/** Cambia campos del perfil; `undefined` o "" quitan el dato. */
export function conPerfil(c: Cliente, cambios: Record<string, unknown>, ahora = new Date()): Cliente {
  const perfil: Record<string, unknown> = { ...(c.perfil ?? {}) };
  for (const [k, v] of Object.entries(cambios)) {
    if (v === undefined || v === "" || v === null || v === false) delete perfil[k]; else perfil[k] = v;
  }
  return { ...c, perfil: perfil as Cliente["perfil"], actualizadoEl: ahora.toISOString() };
}

/** Cambia un campo de la ficha (no del perfil). Vacío quita el dato. */
export function conCampo(c: Cliente, k: "email" | "estadoCivil" | "domicilio" | "identificacion" | "curp" | "rfc" | "zona" | "telefono" | "nombre", v: string, ahora = new Date()): Cliente {
  const t = k === "curp" || k === "rfc" ? v.trim().toUpperCase().replace(/\s/g, "") : v.trim();
  const sig: Cliente = { ...c, actualizadoEl: ahora.toISOString() };
  if (k === "telefono" || k === "nombre") sig[k] = t;
  else if (t) sig[k] = t; else delete sig[k];
  return sig;
}

/** «Hoy», «Mañana», «Ayer», «Hace 3 días», «Lun 17 nov». */
export function cuandoCorto(fecha: string, hoy: Date): string {
  const n = diasDesde(hoy, fecha);
  const d = deTexto(fecha);
  if (n === null || !d) return "";
  if (n === 0) return "Hoy";
  if (n === 1) return "Mañana";
  if (n === -1) return "Ayer";
  if (n < 0) return `Hace ${-n} días`;
  const dia = DIAS_LARGOS[d.getDay()].slice(0, 3);
  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)} ${d.getDate()} ${MESES_CORTOS[d.getMonth()]}`;
}

export type Siguiente = { que: string; fecha?: string; cuando: string; tono: "tarde" | "hoy" | "normal"; referencia?: string };

export function siguientePaso(c: Cliente, hoy: Date): Siguiente | null {
  const p = perfilDe(c);
  const que = p.proximaAccion?.trim();
  if (!que && !p.proximoContacto) return null;
  const n = p.proximoContacto ? diasDesde(hoy, p.proximoContacto) : null;
  return {
    que: que || "Volver a contactar",
    fecha: p.proximoContacto,
    cuando: p.proximoContacto ? cuandoCorto(p.proximoContacto, hoy) : "Sin fecha",
    tono: n === null ? "normal" : n < 0 ? "tarde" : n === 0 ? "hoy" : "normal",
    referencia: p.referencia,
  };
}

/** Días desde el último cambio de la ficha (lo más cercano que hay al último contacto). */
export function diasSinContacto(c: Cliente, hoy: Date): number | null {
  const iso = c.actualizadoEl || c.creadoEl;
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.max(0, -(diasDesde(hoy, aTexto(d)) ?? 0));
}

export function ultimoContacto(c: Cliente, hoy: Date): string {
  const n = diasSinContacto(c, hoy);
  return n === null ? "sin registro" : n === 0 ? "hoy" : n === 1 ? "ayer" : `hace ${n} días`;
}

export const sinSeguimiento = (c: Cliente, hoy: Date) => !perfilDe(c).noContactar && !siguientePaso(c, hoy) && (diasSinContacto(c, hoy) ?? 0) > DIAS_SIN_SEGUIMIENTO;

/** Propietarios: venden o ponen en renta. */
export const esDueno = (t: Cliente["tipo"]) => t === "propietario" || t === "arrendador";

/** Orden «por siguiente paso» del boceto: lo vencido, luego sin seguimiento, luego con fecha y al final sin siguiente paso. */
export function rangoSiguiente(c: Cliente, hoy: Date): string {
  const s = siguientePaso(c, hoy);
  if (s?.tono === "tarde") return `0${s.fecha ?? ""}`;
  if (sinSeguimiento(c, hoy)) return `1${String(999999 - (diasSinContacto(c, hoy) ?? 0)).padStart(6, "0")}`;
  if (s) return `2${s.fecha ?? "9"}`;
  return "3";
}

const sinAcentos = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Búsqueda del boceto: nombre, papel, inmueble ligado, zona, correo o teléfono (desde 3 dígitos). */
export function coincideBusqueda(c: Cliente, consulta: string, inmueble?: string): boolean {
  const q = sinAcentos(consulta.trim());
  if (!q) return true;
  const pajar = sinAcentos([c.nombre, ROL_DE_TIPO[c.tipo], inmueble, c.zona, c.email, perfilDe(c).nombreLegal].filter(Boolean).join(" "));
  if (q.split(/\s+/).every((p) => pajar.includes(p))) return true;
  const d = q.replace(/\D/g, "");
  return d.length >= 3 && [c.telefono, perfilDe(c).whatsapp].some((t) => (t ?? "").replace(/\D/g, "").includes(d));
}

/** El canal con que se contacta desde la fila: el que prefiere; sin preferencia, WhatsApp si hay teléfono. */
export function canalDeFila(c: Cliente): "llamada" | "whatsapp" | "correo" | null {
  const p = perfilDe(c);
  if (p.canalPreferido === "correo" && c.email) return "correo";
  if (p.canalPreferido === "llamada" && c.telefono) return "llamada";
  if (p.whatsapp || c.telefono) return "whatsapp";
  return c.email ? "correo" : null;
}

/** Persona moral: marcada así o con RFC de 12 caracteres. */
/** La casilla «Persona moral» manda; si nunca se marcó, un RFC de 12 caracteres la delata (respaldo). */
export const esMoral = (c: Cliente) => {
  const m = perfilDe(c).personaMoral;
  return typeof m === "boolean" ? m : c.rfc?.trim().length === 12;
};

export const LLEGO_POR = ["Sitio web", "Portal inmobiliario", "Recomendación", "Llamada", "Redes sociales", "Letrero", "Aliado"] as const;
export const FORMAS_AVISO = ["Firmado en papel", "Aceptado en el sitio", "Enviado, falta que lo acepte"] as const;

/** La línea de la lista bajo el nombre. */
export function lineaDeLista(c: Cliente, hoy: Date): { texto: string; tono?: "tarde" | "sin" } {
  if (perfilDe(c).noContactar) return { texto: "No contactar", tono: "tarde" };
  const s = siguientePaso(c, hoy);
  if (s) return { texto: `${s.cuando} · ${s.que}`, tono: s.tono === "tarde" ? "tarde" : undefined };
  const n = diasSinContacto(c, hoy) ?? 0;
  if (n > DIAS_SIN_SEGUIMIENTO) return { texto: `Sin seguimiento · ${n} días`, tono: "sin" };
  return { texto: "Sin siguiente paso" };
}

/** Orden por lo que sigue: lo vencido y lo de hoy primero, después por fecha, y al final quien no tiene. */
export function claveSiguiente(c: Cliente): string {
  const f = perfilDe(c).proximoContacto;
  return f ? `0${f}` : "9";
}

export const CANAL_NOMBRE: Record<string, string> = { llamada: "Llamada", whatsapp: "WhatsApp", correo: "Correo" };
export const HORARIOS = ["Cualquier hora", "Mañana", "Tarde", "Noche"] as const;
export const ESTADOS_CIVILES = ["Soltero(a)", "Casado(a)", "Unión libre", "Divorciado(a)", "Viudo(a)"] as const;

export function pistaContacto(c: Cliente): string {
  const p = perfilDe(c);
  const canal = p.canalPreferido === "llamada" ? "llamada" : CANAL_NOMBRE[p.canalPreferido ?? ""];
  const horario = p.horario === "Cualquier hora" ? ", a cualquier hora" : p.horario ? `, por la ${p.horario.toLowerCase()}` : "";
  return canal ? `Prefiere ${canal}${horario}` : "Sin canal preferido";
}

export function estadoPersona(c: Cliente): string {
  const d = new Date(c.creadoEl);
  const desde = Number.isNaN(d.getTime()) ? "" : `${MESES_CORTOS[d.getMonth()]} ${d.getFullYear()}`;
  if (c.convertidoEl || c.leadId) return desde ? `Llegó como consulta · ${desde}` : "Llegó como consulta";
  return desde ? `En Personas desde ${desde}` : "En Personas";
}

const dinero = (n: number | undefined, moneda?: string) => (n === undefined ? undefined : `$${n.toLocaleString("es-MX")} ${moneda ?? "MXN"}`);

/** Qué busca (o qué ofrece), en pares para la rejilla del boceto. */
export function queBusca(c: Cliente): { titulo: string; filas: { k: string; v: string }[] } | null {
  const p = (c.perfil ?? {}) as NonNullable<Cliente["perfil"]>;
  const ofrece = c.tipo === "propietario" || c.tipo === "arrendador";
  const op = p.operacion ? LEAD_PROFILE_OPTIONS.operacion[p.operacion] : undefined;
  const min = dinero(p.presupuestoMin, p.moneda), max = dinero(p.presupuestoMax ?? p.presupuestoDeclarado, p.moneda);
  const presupuesto = min && max ? `${min} a ${max}` : max ?? min ?? dinero(p.precioObjetivo, p.moneda);
  const filas = [
    { k: ofrece ? "Ofrece" : "Busca", v: op },
    { k: "Tipo", v: c.tipoPropiedad ? (TIPO_LABELS as Record<string, string>)[c.tipoPropiedad] ?? c.tipoPropiedad : undefined },
    { k: "Zona", v: c.zona && c.zona.trim().toLowerCase() !== "no sabe" ? c.zona : undefined },
    { k: ofrece ? "Precio que espera" : "Presupuesto", v: presupuesto },
    { k: "Recámaras", v: p.recamaras !== undefined ? `${p.recamaras} o más` : undefined },
    { k: "Forma de pago", v: p.formaPago ? LEAD_PROFILE_OPTIONS.formaPago[p.formaPago] : undefined },
  ].filter((f): f is { k: string; v: string } => Boolean(f.v));
  if (!filas.length) return null;
  const renta = c.tipo === "arrendatario" || p.operacion === "rentar";
  return { titulo: ofrece ? "Qué ofrece" : renta ? "Qué busca rentar" : "Qué busca comprar", filas };
}

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Inmuebles que coinciden con lo que busca: misma operación, tipo y zona si los dijo, y dentro del presupuesto. */
export function coincidencias(c: Cliente, inmuebles: readonly Property[]): Property[] {
  if (c.tipo === "propietario" || c.tipo === "arrendador" || c.tipo === "otro") return [];
  const p = (c.perfil ?? {}) as NonNullable<Cliente["perfil"]>;
  const operacion = c.tipo === "arrendatario" || p.operacion === "rentar" ? "renta" : "venta";
  const tope = p.presupuestoMax ?? p.presupuestoDeclarado;
  const zona = c.zona && c.zona.trim().toLowerCase() !== "no sabe" ? norm(c.zona) : null;
  return inmuebles.filter((x) => x.operacion === operacion && x.estado !== "vendida" && x.estado !== "rentada"
    && (!c.tipoPropiedad || x.tipo === c.tipoPropiedad)
    && (!zona || norm(x.zona).includes(zona) || zona.includes(norm(x.zona)))
    && (!tope || x.precio.modalidad !== "publico" || x.precio.monto <= tope * 1.05)).slice(0, 6);
}

export const precioCorto = (p: Property) => formatPrecio(p.precio);

/** Notas con fecha al inicio de cada línea («2026-11-16 · Llamada: contestó»), lo último arriba. */
const LINEA = /^(\d{4}-\d{2}-\d{2}) · (.*)$/;
export function agregarNota(c: Cliente, texto: string, ahora = new Date()): Cliente {
  const linea = `${aTexto(ahora)} · ${texto.trim().replace(/\s*\n\s*/g, " ")}`;
  return { ...c, notas: c.notas?.trim() ? `${linea}\n${c.notas}` : linea, actualizadoEl: ahora.toISOString() };
}

export type EventoHistorial = { titulo: string; cuando: string; clave: string; icono: "llamada" | "cita" | "mensaje" | "expediente" | "cliente" };

const fechaCorta = (iso: string) => {
  const d = iso.length === 10 ? deTexto(iso) : new Date(iso);
  return d && !Number.isNaN(d.getTime()) ? `${d.getDate()} ${MESES_CORTOS[d.getMonth()]} ${d.getFullYear()}` : "";
};

/** Historial: notas y llamadas anotadas, citas, notas de su consulta y el alta. Lo más reciente primero. */
export function historial(c: Cliente, d: { leads: readonly Lead[]; eventos: readonly Evento[] }): EventoHistorial[] {
  const lista: EventoHistorial[] = [];
  (c.notas ?? "").split("\n").map((l) => l.trim()).filter(Boolean).forEach((l, i) => {
    const m = LINEA.exec(l);
    const texto = m ? m[2] : l;
    lista.push({ titulo: texto, cuando: m ? fechaCorta(m[1]) : "Nota", clave: m ? `${m[1]}~${String(999 - i).padStart(3, "0")}` : `0000~${i}`, icono: /^llamada/i.test(texto) ? "llamada" : "mensaje" });
  });
  d.eventos.filter((e) => e.clienteId === c.id || (c.leadId && e.leadId === c.leadId)).forEach((e) => {
    lista.push({ titulo: e.titulo, cuando: `${fechaCorta(e.fecha)}${e.hora ? ` · ${e.hora}` : ""}`, clave: `${e.fecha}~${e.hora ?? ""}`, icono: "cita" });
  });
  d.leads.filter((l) => l.id === c.leadId || l.clienteId === c.id).forEach((l) => {
    lista.push({ titulo: l.origen === "manual" ? "Consulta anotada a mano" : "Escribió por el sitio", cuando: fechaCorta(l.creadoEl), clave: l.creadoEl.slice(0, 10), icono: "mensaje" });
    (l.notas ?? []).forEach((n) => lista.push({ titulo: n.texto, cuando: fechaCorta(n.fecha), clave: n.fecha.slice(0, 10), icono: "mensaje" }));
  });
  if (!c.leadId && !c.convertidoEl) lista.push({ titulo: "Se registró en el panel", cuando: fechaCorta(c.creadoEl), clave: c.creadoEl.slice(0, 10), icono: "cliente" });
  return lista.sort((a, b) => b.clave.localeCompare(a.clave));
}

/** Datos para contratos que faltan (persona física o moral). */
export function faltanParaContratos(c: Cliente): string[] {
  const p = perfilDe(c);
  const filas: [string, string | undefined][] = esMoral(c)
    ? [["Razón social", p.nombreLegal || c.nombre], ["RFC", c.rfc], ["Representante legal", p.representante], ["Domicilio fiscal", c.domicilio]]
    : [["Estado civil", c.estadoCivil], ["CURP", c.curp], ["RFC", c.rfc], ["Identificación", c.identificacion], ["Domicilio", c.domicilio]];
  return filas.filter(([, v]) => !v?.trim()).map(([k]) => k);
}

/** Lleva la fecha de lo que sigue a otro día, conservando qué y la referencia. */
export function posponer(c: Cliente, fecha: string, ahora = new Date()): Cliente {
  return conPerfil(c, { proximoContacto: fecha }, ahora);
}

export function sumarDias(hoy: Date, n: number): string {
  return aTexto(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + n));
}

/** El próximo lunes (si hoy es lunes, el de la otra semana). */
export function proximoLunes(hoy: Date): string {
  const faltan = ((8 - hoy.getDay()) % 7) || 7;
  return sumarDias(hoy, faltan);
}

/** «Anotar qué busca»: lo que pide el boceto (busca, tipo, zona, presupuesto, recámaras y forma de pago). */
export type DatosQueBusca = {
  operacion: "" | "comprar" | "rentar" | "invertir" | "vender" | "arrendar";
  tipoPropiedad: string; zona: string; presupuesto: number | null; recamaras: number | null;
  formaPago: "" | "contado" | "credito" | "mixto";
};

export function queBuscaDe(c: Cliente): DatosQueBusca {
  const p = (c.perfil ?? {}) as NonNullable<Cliente["perfil"]>;
  const ofrece = c.tipo === "propietario" || c.tipo === "arrendador";
  return {
    operacion: p.operacion ?? "",
    tipoPropiedad: c.tipoPropiedad ?? "",
    zona: c.zona && c.zona.trim().toLowerCase() !== "no sabe" ? c.zona : "",
    presupuesto: (ofrece ? p.precioObjetivo : p.presupuestoMax ?? p.presupuestoDeclarado) ?? null,
    recamaras: p.recamaras ?? null,
    formaPago: p.formaPago ?? "",
  };
}

/** Vacío quita el dato. El monto va en pesos (el servidor pide la moneda con cualquier monto). */
export function conQueBusca(c: Cliente, d: DatosQueBusca, ahora = new Date()): Cliente {
  const ofrece = c.tipo === "propietario" || c.tipo === "arrendador";
  const p: Record<string, unknown> = { ...(c.perfil ?? {}) };
  const poner = (k: string, v: unknown) => { if (v === "" || v === null || v === undefined) delete p[k]; else p[k] = v; };
  poner("operacion", d.operacion);
  poner("recamaras", d.recamaras);
  poner("formaPago", d.formaPago);
  if (ofrece) poner("precioObjetivo", d.presupuesto); else { poner("presupuestoMax", d.presupuesto); delete p.presupuestoDeclarado; }
  const hayMonto = ["presupuestoMin", "presupuestoMax", "presupuestoDeclarado", "capitalDeclarado", "precioObjetivo"].some((k) => p[k] !== undefined);
  if (hayMonto && !p.moneda) p.moneda = "MXN";
  if (!hayMonto) delete p.moneda;
  const sig: Cliente = { ...c, perfil: p as Cliente["perfil"], actualizadoEl: ahora.toISOString() };
  if (d.tipoPropiedad) sig.tipoPropiedad = d.tipoPropiedad; else delete sig.tipoPropiedad;
  if (d.zona.trim()) sig.zona = d.zona.trim(); else delete sig.zona;
  return sig;
}
