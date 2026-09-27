import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Post } from "@/lib/admin/store";
import { getBlogCover } from "@/data/blog-covers";
import { BlogCoverCredit } from "@/components/blog/blog-cover-credit";
import { BLOG_CATEGORIES, formatBlogDate, postCategory, postDate, postFormat, readingMinutes } from "@/lib/blog-editorial";

export function BlogCard({ post, featured = false }: { post: Post; featured?: boolean }) {
  const cover = getBlogCover(post.slug);
  const category = postCategory(post);
  return (
    <article className={`min-w-0 overflow-hidden rounded-lg border border-border bg-card ${featured ? "" : "h-full"}`}>
      <Link href={`/blog/${post.slug}`} className={`group flex h-full flex-col transition-colors hover:bg-secondary/40 ${featured ? "lg:grid lg:grid-cols-2" : ""}`}>
        {cover && <figure className={`min-w-0 bg-secondary/35 ${featured ? "lg:flex lg:flex-col lg:justify-center" : ""}`}>
          <Image src={cover.src} width={cover.width} height={cover.height} alt={cover.alt} sizes={featured ? "(max-width: 1023px) 100vw, 50vw" : "(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"} className="aspect-[3/2] h-auto w-full object-contain" />
          <figcaption className="px-5 pb-4 pt-2 text-sm leading-6 text-muted-foreground"><BlogCoverCredit cover={cover} /></figcaption>
        </figure>}
        <div className={`flex min-w-0 flex-1 flex-col p-6 ${featured ? `sm:p-9 ${cover ? "" : "lg:col-span-2"}` : ""}`}>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
            <span className="font-medium text-primary">{postFormat(post) === "actualidad" ? "Actualidad" : "Guía"}</span>
            {category && <span className="text-muted-foreground">{BLOG_CATEGORIES[category]}</span>}
            {featured && <span className="ml-auto rounded-sm bg-primary/10 px-2 py-1 text-xs font-medium text-primary">Destacado</span>}
          </div>
          <h2 className={`display-soft mt-5 text-foreground [overflow-wrap:anywhere] ${featured ? "text-3xl sm:text-4xl" : "text-2xl"}`}>{post.titulo}</h2>
          <p className="mt-4 line-clamp-3 text-base leading-7 text-muted-foreground [overflow-wrap:anywhere]">{post.resumen}</p>
          <div className="mt-auto flex items-end justify-between gap-3 pt-8">
            <p className="text-sm leading-6 text-muted-foreground">
              {post.publicadoEl ? "" : "Actualizado · "}<time dateTime={postDate(post)}>{formatBlogDate(postDate(post))}</time>
              <span className="block">{readingMinutes(post)} min de lectura</span>
            </p>
            <ArrowUpRight aria-hidden="true" className="size-5 shrink-0 text-primary transition-transform motion-safe:group-hover:-translate-y-1 motion-safe:group-hover:translate-x-1" />
          </div>
        </div>
      </Link>
    </article>
  );
}
