/*
  Imágenes de los documentos (foto principal, croquis): tipo y tamaño leídos de los bytes,
  sin depender del navegador ni de sharp, para que sirva igual en el servidor y en el Word.
*/

export type ImagenDocumento = { bytes: Uint8Array; tipo: "jpg" | "png"; width: number; height: number; caption?: string; source?: string; date?: string | null };

export function imageInfo(bytes: Uint8Array): { tipo: "jpg" | "png"; width: number; height: number } | null {
  if (bytes.length > 24 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return { tipo: "png", width: view.getUint32(16), height: view.getUint32(20) };
  }
  if (bytes.length > 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let i = 2;
    while (i + 9 < bytes.length) {
      if (bytes[i] !== 0xff) { i++; continue; }
      const marker = bytes[i + 1], length = (bytes[i + 2] << 8) + bytes[i + 3];
      // SOF0–SOF15 salvo DHT (C4), JPG (C8) y DAC (CC): ahí vienen alto y ancho.
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return { tipo: "jpg", height: (bytes[i + 5] << 8) + bytes[i + 6], width: (bytes[i + 7] << 8) + bytes[i + 8] };
      i += 2 + length;
    }
  }
  return null;
}

export function imagen(bytes: Uint8Array, extra: Omit<ImagenDocumento, "bytes" | "tipo" | "width" | "height"> = {}): ImagenDocumento | undefined {
  const info = imageInfo(bytes);
  return info ? { bytes, ...info, ...extra } : undefined;
}
