import type { BlogCover } from "@/data/blog-covers";

export function BlogCoverCredit({ cover, linked = false }: { cover: BlogCover; linked?: boolean }) {
  if (!cover.credit) return <>Ilustración editorial generada con IA; no representa un inmueble en oferta.</>;
  const { author, sourceUrl, license, licenseUrl, note } = cover.credit;
  if (!linked) return <>Foto: {author} · {license}. Archivo de 2021. Créditos completos en el artículo.</>;
  return <>Foto: <a href={sourceUrl} className="text-primary underline underline-offset-4">{author} / Wikimedia Commons</a>. Licencia <a href={licenseUrl} className="text-primary underline underline-offset-4">{license}</a>. {note}</>;
}
