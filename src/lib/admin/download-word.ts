import { formatoById } from "@/lib/formatos/catalog";

/*
  Copia en Word de un formato guardado, con el diseño de su plantilla. Acompaña al PDF en
  cada entregable para que el asesor descargue el que prefiera. El Word se arma en el
  navegador con los datos de la versión guardada; no queda archivado como el PDF.
*/

type SavedFormato = { formato_id: string; data: Record<string, unknown>; version: number };
export const safeFileName = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob), link = document.createElement("a");
  link.href = url; link.download = name; document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export async function downloadFormatoWord(doc: SavedFormato, folio: string, cliente?: string) {
  const definition = formatoById(doc.formato_id);
  const { formatoDocxBlob } = await import("@/lib/formatos/docx");
  const blob = await formatoDocxBlob(definition, { ...doc.data, folio }, { folio, cliente });
  saveBlob(blob, `Fortius-${definition.id}-${safeFileName(definition.title)}-${folio}-v${doc.version}.docx`);
}

/**
  Copia editable (titular, 27/10/2026: «quitar la opción de descargar el Word»). Los formatos se
  entregan en PDF; solo queda la opinión de valor (07), que se trabaja en su Excel. El contrato 09
  salía en Word mientras su PDF estuvo bloqueado; desde el 12/11/2026 sale en PDF como los demás.
*/
export const copiaEditable = (formatoId: string): "Excel" | "Word" | null => formatoId === "07" ? "Excel" : null;

/**
  Foto elegida, lista para el Excel: orientada como se ve en pantalla y reducida a 1600 px por
  lado en JPG (las fotos de celular pesan varios MB y Excel no siempre respeta su orientación).
  Si no se puede leer, el recuadro queda vacío y el Excel se descarga igual.
*/
async function fotoParaExcel(id: string): Promise<import("@/lib/formatos/valor-excel").FotoExcel | null> {
  try {
    const response = await fetch(`/api/admin/adjuntos/${encodeURIComponent(id)}/descargar`);
    if (!response.ok) return null;
    const bitmap = await createImageBitmap(await response.blob());
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale)), height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) { bitmap.close(); return null; }
    context.fillStyle = "#FFFFFF"; context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", 0.85));
    return blob ? { bytes: new Uint8Array(await blob.arrayBuffer()), tipo: "jpg", width, height } : null;
  } catch {
    return null;
  }
}

/** Opinión de valor en Excel: la plantilla del titular llenada con lo capturado y sus fotografías. */
export async function downloadValorExcel(data: Record<string, unknown>, nombre: string) {
  const { valorExcel, fotosValor, PLANTILLA_07 } = await import("@/lib/formatos/valor-excel");
  const response = await fetch(PLANTILLA_07, { cache: "no-store" });
  if (!response.ok) throw new Error("No se pudo cargar la plantilla de Excel de la opinión de valor.");
  const ids = [...new Set(fotosValor(data).map(item => item.id))];
  const fotos = Object.fromEntries((await Promise.all(ids.map(async id => [id, await fotoParaExcel(id)] as const))).filter((entry): entry is readonly [string, NonNullable<typeof entry[1]>] => !!entry[1]));
  const bytes = await valorExcel(data, await response.arrayBuffer(), fotos);
  saveBlob(new Blob([new Uint8Array(bytes)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${nombre}.xlsx`);
}

/** Descarga la copia editable que corresponde al formato (Excel para el 07, Word para los demás). */
export async function downloadFormatoCopia(doc: SavedFormato, folio: string, cliente?: string) {
  if (doc.formato_id !== "07") return downloadFormatoWord(doc, folio, cliente);
  await downloadValorExcel({ ...doc.data, folio }, `Fortius-07-Opinion-de-valor-${folio}-v${doc.version}`);
}
