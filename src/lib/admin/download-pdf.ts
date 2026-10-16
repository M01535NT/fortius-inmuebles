/** Download through the authenticated route, keeping API failures visible in the editor. */
export async function downloadAdminPdf(url: string, filename: string): Promise<void> {
  const response = await fetch(url, { credentials: "same-origin", cache: "no-store" });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? "No se pudo descargar el PDF. Puedes volver a intentarlo desde el enlace.");
  }
  if (!response.headers.get("content-type")?.includes("application/pdf")) throw new Error("No se recibió el PDF. Intenta descargarlo de nuevo.");
  const blob = await response.blob();
  if (await blob.slice(0, 5).text() !== "%PDF-") throw new Error("El archivo recibido no es un PDF válido.");
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl; link.download = filename;
  document.body.appendChild(link);
  link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
}
