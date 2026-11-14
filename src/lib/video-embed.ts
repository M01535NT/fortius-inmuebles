/*
  El panel pide «un enlace de YouTube o Vimeo» para el video del inmueble. Una página de YouTube
  no se reproduce en <video>: hay que usar su reproductor incrustado (C-47, 13/11/2026).
  Devuelve la URL del reproductor o null si el enlace no es de YouTube ni de Vimeo
  (entonces se trata como archivo de video directo).
*/
const YOUTUBE_ID = /^[\w-]{11}$/;

export function videoEmbedUrl(value: string | undefined): string | null {
  if (!value) return null;
  let url: URL;
  try { url = new URL(value.trim()); } catch { return null; }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.replace(/^www\.|^m\./, "");

  let youtube: string | null = null;
  if (host === "youtu.be") youtube = url.pathname.slice(1).split("/")[0];
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") youtube = url.searchParams.get("v");
    else {
      const [, kind, id] = url.pathname.split("/");
      if (kind === "embed" || kind === "shorts" || kind === "live") youtube = id ?? null;
    }
  }
  if (youtube !== null) return YOUTUBE_ID.test(youtube) ? `https://www.youtube-nocookie.com/embed/${youtube}` : null;

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = url.pathname.split("/").filter(Boolean).find((part) => /^\d+$/.test(part));
    return id ? `https://player.vimeo.com/video/${id}` : null;
  }
  return null;
}
