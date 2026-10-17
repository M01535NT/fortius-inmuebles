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

/** Copia editable de cada formato: la opinión de valor (07) se trabaja en Excel, con su plantilla; los demás, en Word. */
export const copiaEditable = (formatoId: string) => formatoId === "07" ? "Excel" : "Word";

/** Opinión de valor en Excel: la plantilla del titular llenada con lo capturado. */
export async function downloadValorExcel(data: Record<string, unknown>, nombre: string) {
  const { valorExcel, PLANTILLA_07 } = await import("@/lib/formatos/valor-excel");
  const response = await fetch(PLANTILLA_07, { cache: "no-store" });
  if (!response.ok) throw new Error("No se pudo cargar la plantilla de Excel de la opinión de valor.");
  const bytes = await valorExcel(data, await response.arrayBuffer());
  saveBlob(new Blob([new Uint8Array(bytes)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${nombre}.xlsx`);
}

/** Descarga la copia editable que corresponde al formato (Excel para el 07, Word para los demás). */
export async function downloadFormatoCopia(doc: SavedFormato, folio: string, cliente?: string) {
  if (doc.formato_id !== "07") return downloadFormatoWord(doc, folio, cliente);
  await downloadValorExcel({ ...doc.data, folio }, `Fortius-07-Opinion-de-valor-${folio}-v${doc.version}`);
}
