import { expect, test } from "vitest";
import { videoEmbedUrl } from "@/lib/video-embed";

test.each([
  ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"],
  ["https://youtu.be/dQw4w9WgXcQ?si=abc", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"],
  ["https://m.youtube.com/shorts/dQw4w9WgXcQ", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"],
  ["https://www.youtube.com/embed/dQw4w9WgXcQ", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"],
  ["https://vimeo.com/76979871", "https://player.vimeo.com/video/76979871"],
  ["https://player.vimeo.com/video/76979871?h=x", "https://player.vimeo.com/video/76979871"],
])("%s se reproduce con el reproductor incrustado", (entrada, esperado) => {
  expect(videoEmbedUrl(entrada)).toBe(esperado);
});

test.each([undefined, "", "/videos/casa.mp4", "https://example.com/casa.mp4", "https://www.youtube.com/watch?v=corto", "javascript:alert(1)", "https://vimeo.com/canal"])(
  "%s no se trata como YouTube ni Vimeo",
  (entrada) => { expect(videoEmbedUrl(entrada)).toBeNull(); },
);
