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
