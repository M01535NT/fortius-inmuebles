/*
  Páginas de un PDF como imágenes, en el navegador (31/10/2026). Algunos servicios de lectura solo
  reciben imágenes: el panel dibuja cada página con pdf.js en un lienzo y la manda como JPEG. Se
  limita el número de páginas y el ancho para que la petición sea razonable.
*/

export type OpcionesPaginas = { maxPaginas?: number; ancho?: number; calidad?: number };

/** Devuelve cada página como `data:image/jpeg;base64,…`; `total` es cuántas tiene el PDF. */
export async function paginasComoImagenes(bytes: ArrayBuffer, { maxPaginas = 10, ancho = 1400, calidad = 0.85 }: OpcionesPaginas = {}): Promise<{ paginas: string[]; total: number }> {
  const pdfjs = await import("pdfjs-dist");
  // El trabajador va en el mismo paquete; si el navegador no lo puede abrir, pdf.js lo sustituye en el hilo principal.
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const documento = await pdfjs.getDocument({ data: new Uint8Array(bytes) }).promise;
  const paginas: string[] = [];
  try {
    for (let numero = 1; numero <= Math.min(documento.numPages, maxPaginas); numero++) {
      const pagina = await documento.getPage(numero);
      const base = pagina.getViewport({ scale: 1 });
      const viewport = pagina.getViewport({ scale: ancho / base.width });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
      await pagina.render({ canvas, viewport }).promise;
      paginas.push(canvas.toDataURL("image/jpeg", calidad));
      void pagina.cleanup();
    }
    return { paginas, total: documento.numPages };
  } finally { await documento.loadingTask.destroy(); }
}
