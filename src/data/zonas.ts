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

/*
  Municipio de una zona capturada, para los datos estructurados (Google pide la ciudad, no la
  colonia). Las zonas que no son Rosarito, Tecate ni Ensenada son colonias de Tijuana.
*/
const MUNICIPIOS_FUERA_DE_TIJUANA = [
  { clave: "rosarito", municipio: "Playas de Rosarito" },
  { clave: "tecate", municipio: "Tecate" },
  { clave: "ensenada", municipio: "Ensenada" },
] as const;

export function municipioDeZona(zona: string): string {
  const texto = zona.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  return MUNICIPIOS_FUERA_DE_TIJUANA.find(({ clave }) => texto.includes(clave))?.municipio ?? "Tijuana";
}
