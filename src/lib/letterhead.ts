/** Gráficos del membrete aprobado del Plan de negocio; se comparten entre Word y PDF. */
export type LetterheadAssets = { encabezado: Uint8Array; pie: Uint8Array };
export const LETTERHEAD_PATHS = {
  encabezado: '/brand/membrete-encabezado.png',
  pie: '/brand/membrete-pie.png',
} as const;

/** Medidas en puntos. Los gráficos escalan proporcionalmente al ancho de la hoja. */
export function letterheadBounds(width = 612, height = 792) {
  const scale = width / 612;
  const header = 118.8 * scale, footer = 108 * scale;
  return { header, footer, top: header + 7.2, bottom: footer + 20, bodyTop: height - header - 7.2 };
}

/** Navegador: un fallo al cargar la marca impide descargar un documento incompleto. */
export async function fetchLetterhead(): Promise<LetterheadAssets> {
  const bytes = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error('No se pudo cargar el membrete Fortius. Inténtalo de nuevo.');
    return new Uint8Array(await response.arrayBuffer());
  };
  const [encabezado, pie] = await Promise.all([bytes(LETTERHEAD_PATHS.encabezado), bytes(LETTERHEAD_PATHS.pie)]);
  return { encabezado, pie };
}
