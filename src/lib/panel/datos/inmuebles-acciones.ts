import { estadoValido, type Property } from "@/data/propiedades";

type EstadoPropiedad = Property["estado"];
import type { TipoInmueble } from "@/lib/inmueble-tipos";

/**
 * Alta y edición de inmuebles (PN-03). Guardar y publicar son acciones distintas: aquí nunca se toca `publicada`;
 * un inmueble nuevo nace «En captación · privado» y sin publicar. El folio FORTIUS-###### lo pone la base al guardar.
 */

export type DatosInmueble = {
  titulo: string; tipo: TipoInmueble; operacion: Property["operacion"];
  /** Monto con comas o vacío para «Valor a consulta». */
  precio: string; moneda: "MXN" | "USD";
  zona: string; referencia: string;
  terreno: string; construccion: string; recamaras: string; banos: string; estacionamientos: string;
  estado: EstadoPropiedad;
};

const numero = (t: string): number | undefined => {
  const n = Number.parseFloat(t.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : undefined;
};
const texto = (n: number | undefined) => (typeof n === "number" && n > 0 ? n.toLocaleString("en-US") : "");

/** Slug para la dirección del sitio: del título, sin acentos, más un sufijo para que no choque. */
export function slugDe(titulo: string, sufijo = crypto.randomUUID().slice(0, 6)): string {
  const base = titulo.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60).replace(/-+$/g, "");
  return `${base || "inmueble"}-${sufijo}`;
}

export function faltaParaInmueble(d: Pick<DatosInmueble, "titulo" | "zona">): { campo: "titulo" | "zona"; texto: string } | null {
  if (!d.titulo.trim()) return { campo: "titulo", texto: "Escribe cómo se llama el inmueble (ej. Casa en Playas)." };
  if (!d.zona.trim()) return { campo: "zona", texto: "Escribe la zona o colonia." };
  return null;
}

function aplicar(p: Property, d: DatosInmueble): Property {
  const monto = numero(d.precio);
  const ficha = { ...(p.ficha ?? {}) } as Record<string, unknown>;
  const poner = (k: string, v: number | undefined) => { if (v === undefined) delete ficha[k]; else ficha[k] = v; };
  poner("terrenoM2", numero(d.terreno));
  poner("construccionM2", numero(d.construccion));
  poner("recamaras", numero(d.recamaras));
  poner("banos", numero(d.banos));
  poner("estacionamientos", numero(d.estacionamientos));
  return {
    ...p,
    titulo: d.titulo.trim().replace(/\s+/g, " "),
    tipo: d.tipo,
    operacion: d.operacion,
    precio: monto ? { modalidad: "publico", monto, moneda: d.moneda, ...(d.operacion === "renta" ? { periodo: "mensual" as const } : {}) } : { modalidad: "consulta" },
    zona: d.zona.trim(),
    direccionAproximada: d.referencia.trim(),
    ficha: ficha as Property["ficha"],
    // Un estado que no corresponde a la operación (vendida en una renta) vuelve al primero válido.
    estado: estadoValido(d.operacion, d.estado) ? d.estado : (estadoValido(d.operacion, p.estado) ? p.estado : "evaluacion"),
    creditoDisponible: d.operacion === "venta" ? p.creditoDisponible : false,
  };
}

export function nuevoInmueble(d: DatosInmueble, miAsesor: string | null): Property {
  const base: Property = {
    slug: slugDe(d.titulo), codigo: "", titulo: "", tipo: d.tipo, operacion: d.operacion, precio: { modalidad: "consulta" },
    zona: "", direccionAproximada: "", descripcion: [], ficha: {}, amenidades: [], galeria: [],
    asesorId: miAsesor ?? "", creditoDisponible: d.operacion === "venta", puntosDeInteres: [], destacada: false,
    // En captación no lleva fecha de publicación (regla del servidor); la pone quien publica.
    estado: "evaluacion", publicadaEl: "", demo: false, publicada: false,
  };
  return aplicar(base, { ...d, estado: "evaluacion" });
}

/** Edita sin tocar lo publicado, la galería, los textos del sitio ni el seguimiento privado. */
export function editarInmueble(p: Property, d: DatosInmueble): Property {
  const e = aplicar(p, d);
  return e.estado === "evaluacion" && !e.publicada ? { ...e, publicadaEl: "" } : e;
}

/** Estados que se ofrecen al editar: los de la operación; si ya está publicado, no puede volver a captación. */
export function estadosPara(operacion: Property["operacion"], publicada: boolean | undefined): Property["estado"][] {
  return (["evaluacion", "disponible", "apartada", "vendida", "rentada"] as const).filter((e) => estadoValido(operacion, e) && !(publicada && e === "evaluacion"));
}

export function datosDeInmueble(p: Property): DatosInmueble {
  const f = (p.ficha ?? {}) as Record<string, number | undefined>;
  return {
    titulo: p.titulo ?? "", tipo: p.tipo, operacion: p.operacion,
    precio: p.precio?.modalidad === "publico" ? texto(p.precio.monto) : "",
    moneda: p.precio?.modalidad === "publico" ? p.precio.moneda : "MXN",
    zona: p.zona ?? "", referencia: p.direccionAproximada ?? "",
    terreno: texto(f.terrenoM2), construccion: texto(f.construccionM2), recamaras: texto(f.recamaras), banos: texto(f.banos), estacionamientos: texto(f.estacionamientos),
    estado: p.estado,
  };
}
