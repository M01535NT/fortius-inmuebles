import { MUNICIPALITIES, type Municipality } from "@/data/financial-rules";

/* Sugerencias de ubicación para capturar inmuebles en el panel. */
export const zonas = [
  { slug: "zona-rio", nombre: "Zona Río" },
  { slug: "otay", nombre: "Otay" },
  { slug: "playas-de-tijuana", nombre: "Playas de Tijuana" },
  { slug: "la-mesa", nombre: "La Mesa" },
  { slug: "santa-fe", nombre: "Santa Fe" },
  { slug: "el-florido", nombre: "El Florido" },
  { slug: "chapultepec", nombre: "Chapultepec" },
  { slug: "cacho", nombre: "Cacho" },
  { slug: "rosarito", nombre: "Rosarito" },
  { slug: "tecate", nombre: "Tecate" },
  { slug: "ensenada", nombre: "Ensenada" },
] as const;

/* Texto comparable: sin acentos, sin mayúsculas y sin espacios de sobra. */
function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

/*
  Municipios de Baja California que el sitio reconoce por nombre. El orden importa: «Playas de
  Rosarito» se busca antes que «Tijuana» para que una colonia de Rosarito no caiga en Tijuana.
*/
const MUNICIPIOS_BC = [
  { claves: ["playas de rosarito", "rosarito"], municipio: "Playas de Rosarito" },
  { claves: ["tecate"], municipio: "Tecate" },
  { claves: ["ensenada"], municipio: "Ensenada" },
  { claves: ["mexicali"], municipio: "Mexicali" },
  { claves: ["san quintin"], municipio: "San Quintín" },
  { claves: ["san felipe"], municipio: "San Felipe" },
  { claves: ["tijuana"], municipio: "Tijuana" },
] as const;

/*
  Municipio que se lee en un texto de ubicación (la zona o colonia capturada). Si el texto no
  nombra un municipio, no se supone ninguno: antes caía en Tijuana y un inmueble de Ensenada
  salía con mapa, datos para Google y gastos de cierre de Tijuana.
*/
export function municipioDeZona(zona: string): string | undefined {
  const texto = normalizar(zona);
  if (!texto) return undefined;
  return MUNICIPIOS_BC.find(({ claves }) => claves.some((clave) => texto.includes(clave)))?.municipio;
}

type UbicacionInmueble = { municipio?: string; zona: string; direccionAproximada?: string };

/*
  Municipio de un inmueble publicado. Manda el municipio guardado en el inmueble; si falta, se
  lee de la zona o del último tramo de la dirección aproximada (que hoy trae «colonia, ciudad»).
  Si nada lo dice, queda sin municipio: el sitio omite el dato en lugar de inventarlo.
*/
export function municipioDeInmueble(p: UbicacionInmueble): string | undefined {
  const guardado = p.municipio?.trim();
  if (guardado) return guardado;
  const deZona = municipioDeZona(p.zona);
  if (deZona) return deZona;
  const ultimo = normalizar(p.direccionAproximada?.split(",").at(-1) ?? "");
  return MUNICIPIOS_BC.find(({ claves }) => (claves as readonly string[]).includes(ultimo))?.municipio;
}

/* Clave de cálculo (gastos de cierre) de un municipio; sin tablas para él, no hay clave. */
export function claveMunicipio(municipio: string | undefined): Municipality | undefined {
  if (!municipio) return undefined;
  const texto = normalizar(municipio);
  if (texto === "rosarito") return "rosarito";
  return (Object.keys(MUNICIPALITIES) as Municipality[]).find((clave) => normalizar(MUNICIPALITIES[clave]) === texto);
}

/*
  Une las partes de una ubicación («Playas», «Playas, Tijuana») sin vacíos ni repetidos: cada
  parte se corta por comas y un tramo que ya salió (sin distinguir mayúsculas ni acentos) se omite.
*/
export function unirUbicacion(...partes: (string | null | undefined)[]): string {
  const vistos = new Set<string>();
  const tramos: string[] = [];
  for (const parte of partes) {
    for (const tramo of (parte ?? "").split(",")) {
      const limpio = tramo.replace(/\s+/g, " ").trim();
      const clave = normalizar(limpio);
      if (!clave || vistos.has(clave)) continue;
      vistos.add(clave);
      tramos.push(limpio);
    }
  }
  return tramos.join(", ");
}
