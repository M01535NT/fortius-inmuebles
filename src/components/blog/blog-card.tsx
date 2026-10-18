import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Post } from "@/lib/admin/store";
import { getBlogCover } from "@/data/blog-covers";
import { BlogCoverCredit } from "@/components/blog/blog-cover-credit";
import { BLOG_CATEGORIES, formatBlogDate, postCategory, postDate, postFormat, readingMinutes } from "@/lib/blog-editorial";

/* Tarjeta del blog (boceto Blog): portada, formato · tema, título, resumen y
   fecha. La destacada se vuelve nocturna; la vista de lista pone la foto al lado. */
export function BlogCard({ post, featured = false, view = "cuadricula" }: { post: Post; featured?: boolean; view?: "cuadricula" | "lista" }) {
  const cover = getBlogCover(post.slug);
  const category = postCategory(post);
  const list = view === "lista";
  const sizes = list ? "(max-width: 639px) 100vw, 220px" : featured ? "(max-width: 1023px) 100vw, 60vw" : "(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw";
  return (
    <article className={"bp-card" + (featured ? " is-featured" : "") + (list ? " is-list" : "")}>
      <Link href={`/blog/${post.slug}`}>
        {cover && <span className="bp-card-media"><Image src={cover.src} width={cover.width} height={cover.height} alt={cover.alt} sizes={sizes} /></span>}
        <span className="bp-card-body">
          <span className="bp-card-kicker">
            {featured && <span className="bp-featured-tag">Destacado</span>}
            <span className="pg-chip">{postFormat(post) === "actualidad" ? "Actualidad" : "Guía"}{category ? ` · ${BLOG_CATEGORIES[category]}` : ""}</span>
          </span>
          <h2>{post.titulo}</h2>
          <span className="bp-card-summary">{post.resumen}</span>
          <span className="bp-card-meta">
            <span>
              {post.publicadoEl ? "" : "Actualizado · "}<time dateTime={postDate(post)}>{formatBlogDate(postDate(post))}</time>
              {" · "}{readingMinutes(post)} min de lectura
            </span>
            <ArrowUpRight aria-hidden="true" size={20} />
          </span>
        </span>
        {cover?.credit && <span className="bp-card-credit"><BlogCoverCredit cover={cover} /></span>}
      </Link>
    </article>
  );
}
