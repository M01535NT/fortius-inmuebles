import sharp from "sharp";
import { ApiError } from "@/lib/backend/http";

export const MAX_ASSET_BYTES = 10 * 1024 * 1024;

export async function inspectFormatoImage(file: File): Promise<{ bytes: Buffer; mime: "image/jpeg" | "image/png"; extension: "jpg" | "png" }> {
  if (file.size === 0 || file.size > MAX_ASSET_BYTES) throw new ApiError(400, "La imagen debe ocupar entre 1 byte y 10 MB");
  const bytes = Buffer.from(await file.arrayBuffer());
  const jpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (!jpeg && !png) throw new ApiError(400, "Adjunta una imagen JPEG o PNG válida");
  try {
    const meta = await sharp(bytes, { limitInputPixels: 40_000_000, failOn: "error" }).metadata();
    if (meta.format !== (jpeg ? "jpeg" : "png") || !meta.width || !meta.height || meta.width * meta.height > 40_000_000) throw new Error("Dimensiones inválidas");
    return { bytes, mime: jpeg ? "image/jpeg" : "image/png", extension: jpeg ? "jpg" : "png" };
  } catch { throw new ApiError(400, "La imagen está dañada o supera el límite de resolución"); }
}
