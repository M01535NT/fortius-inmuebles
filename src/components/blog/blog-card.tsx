import Image from "next/image";
import Link from "next/link";
import type { Post } from "@/lib/admin/store";
import { getBlogCover } from "@/data/blog-covers";
import { BlogCoverCredit } from "@/components/blog/blog-cover-credit";
import { BLOG_CATEGORIES, formatBlogDate, postCategory, postDate, postFormat, readingMinutes } from "@/lib/blog-editorial";

/*
  Tarjeta del blog, Fortius II (etapa 5, 17/11/2026): portada con esquinas de 16 px, «Guía ·
  tema» en una línea de apoyo, título, resumen y fecha. La destacada pone la foto grande al
  lado; la vista de lista, una foto chica.
*/
export function BlogCard({ post, featured = false, view = "cuadricula" }: { post: Post; featured?: boolean; view?: "cuadricula" | "lista" }) {
  const cover = getBlogCover(post.slug);
  const category = postCategory(post);
  const list = view === "lista";
  const sizes = list ? "(max-width: 639px) 100vw, 240px" : featured ? "(max-width: 1023px) 100vw, 60vw" : "(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw";
  const tipo = [postFormat(post) === "actualidad" ? "Actualidad" : "Guía", category ? BLOG_CATEGORIES[category] : ""].filter(Boolean).join(" · ");
  return (
    <article className={"bl-tarjeta" + (featured ? " bl-tarjeta-destacada" : "") + (list ? " bl-tarjeta-lista" : "")}>
      <Link href={`/blog/${post.slug}`} className="bl-tarjeta-enlace">
        {cover && <span className="bl-tarjeta-foto"><Image src={cover.src} width={cover.width} height={cover.height} alt={cover.alt} sizes={sizes} /></span>}
        <span className="bl-tarjeta-cuerpo">
          <h3 className="bl-tarjeta-titulo">{post.titulo}</h3>
          <span className="bl-tarjeta-resumen">{post.resumen}</span>
          <span className="bl-tarjeta-fecha">
            {tipo} · {post.publicadoEl ? "" : "Actualizado el "}<time dateTime={postDate(post)}>{formatBlogDate(postDate(post))}</time>
            {" · "}{readingMinutes(post)} min de lectura
          </span>
        </span>
      </Link>
      {cover?.credit && <span className="bl-tarjeta-credito"><BlogCoverCredit cover={cover} /></span>}
    </article>
  );
}
