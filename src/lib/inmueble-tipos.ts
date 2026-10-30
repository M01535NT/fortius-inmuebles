/*
  Una sola lista de tipos de inmueble (titular, 27/10/2026): los siete de las plantillas del
  titular, cada uno con su levantamiento (04A–04G), sin «Otro». La usan el primer contacto, la
  entrevista 02, la ficha y el sitio, la opinión de valor 07 y las herramientas comerciales.
  La plaza o conjunto se publica como un inmueble más. Si hace falta otro tipo, se agrega aquí
  junto con su levantamiento. El uso (habitacional, comercial, industrial) va aparte: el uso de
  suelo del levantamiento.
*/
export const TIPOS_INMUEBLE = [
  { key: "terreno", label: "Terreno", levantamiento: "04A" },
  { key: "casa", label: "Casa", levantamiento: "04B" },
  { key: "departamento", label: "Departamento", levantamiento: "04C" },
  { key: "oficina", label: "Oficina", levantamiento: "04D" },
  { key: "local", label: "Local comercial", levantamiento: "04E" },
  { key: "nave-industrial", label: "Nave o bodega", levantamiento: "04F" },
  { key: "plaza", label: "Plaza o conjunto", levantamiento: "04G" },
] as const;
export type TipoInmueble = typeof TIPOS_INMUEBLE[number]["key"];
export const TIPO_INMUEBLE_KEYS = TIPOS_INMUEBLE.map(tipo => tipo.key) as [TipoInmueble, ...TipoInmueble[]];
export const TIPO_INMUEBLE_LABELS = Object.fromEntries(TIPOS_INMUEBLE.map(tipo => [tipo.key, tipo.label])) as Record<TipoInmueble, string>;

/** Clave del tipo, también para lo guardado antes: la entrevista 02 usaba «nave» y la búsqueda de prospectos «bodega». */
export function tipoInmueble(value: unknown): TipoInmueble | undefined {
  const key = value === "nave" || value === "bodega" ? "nave-industrial" : String(value ?? "");
  return (TIPO_INMUEBLE_KEYS as readonly string[]).includes(key) ? key as TipoInmueble : undefined;
}
