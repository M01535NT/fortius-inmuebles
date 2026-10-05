import "server-only";
import { readFile, realpath } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const MAX_BYTES = 20 * 1024 * 1024;

/** Fetch only public image origins already admitted by the site's image policy. */
export async function loadPdfImage(src: string): Promise<Uint8Array | null> {
  try {
    let bytes: Buffer;
    if (src.startsWith("/") && !src.startsWith("//")) {
      const root = await realpath(path.join(process.cwd(), "public"));
      const target = await realpath(/* turbopackIgnore: true */ path.resolve(root, `.${decodeURIComponent(src)}`));
      const relative = path.relative(root, target);
      if (relative.startsWith("..") || path.isAbsolute(relative)) return null;
      bytes = await readFile(/* turbopackIgnore: true */ target);
    } else {
      const url = new URL(src);
      const storage = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const ownPublic = storage && url.origin === new URL(storage).origin && url.pathname.startsWith("/storage/v1/object/public/fortius-inmuebles-public/");
      if (url.protocol !== "https:" || url.username || url.password || url.port || (!ownPublic && !["images.unsplash.com", "d8j0ntlcm91z4.cloudfront.net"].includes(url.hostname))) return null;
      const response = await fetch(url, { cache: "no-store", redirect: "error", signal: AbortSignal.timeout(8000) });
      if (!response.ok || !response.headers.get("content-type")?.startsWith("image/") || Number(response.headers.get("content-length")) > MAX_BYTES || !response.body) return null;
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.length;
          if (size > MAX_BYTES) { await reader.cancel(); return null; }
          chunks.push(value);
        }
      } finally { reader.releaseLock(); }
      bytes = Buffer.concat(chunks);
    }
    if (bytes.length > MAX_BYTES) return null;
    return await sharp(bytes, { limitInputPixels: 40_000_000 }).rotate().resize({ width: 1600, height: 1200, fit: "inside", withoutEnlargement: true }).flatten({ background: "#ffffff" }).jpeg({ quality: 85 }).toBuffer();
  } catch { return null; }
}
