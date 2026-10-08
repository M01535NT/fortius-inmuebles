import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Container } from "@/components/layout/container";
import { BlogContent, blogHeadings } from "@/components/blog/blog-content";
import { BlogCoverCredit } from "@/components/blog/blog-cover-credit";
import { siteConfig } from "@/data/site";
import { getBlogPostBySlug, getBlogPosts } from "@/lib/blog";
import { getBlogCover } from "@/data/blog-covers";
import { getBlogFigures } from "@/data/blog-figures";
import { BLOG_CATEGORIES, postCategory, postFormat, formatBlogDate, readingMinutes } from "@/lib/blog-editorial";

type Params = { slug: string };

export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return {};
  const path = `/blog/${post.slug}`;
  const cover = getBlogCover(post.slug);
  const coverUrl = cover ? new URL(cover.src, siteConfig.url).href : undefined;
  return {
    title: post.titulo,
    description: post.resumen,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      title: post.titulo,
      description: post.resumen,
      url: new URL(path, siteConfig.url).href,
      modifiedTime: post.actualizadoEl,
      ...(post.publicadoEl ? { publishedTime: post.publicadoEl } : {}),
      ...(post.autor ? { authors: [post.autor] } : {}),
      ...(cover && coverUrl ? { images: [{ url: coverUrl, width: cover.width, height: cover.height, alt: cover.alt }] } : {}),
    },
    ...(coverUrl ? {
      twitter: { card: "summary_large_image", title: post.titulo, description: post.resumen, images: [coverUrl] },
    } : {}),
  };
}

export default async function BlogPostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const posts = await getBlogPosts();
  const post = posts.find((candidate) => candidate.slug === slug);
  if (!post) notFound();
  const cover = getBlogCover(post.slug);
  const headings = blogHeadings(post.contenido);
  const category = postCategory(post);
  const related = category ? posts.filter((candidate) => candidate.slug !== post.slug && postCategory(candidate) === category).slice(0, 3) : [];
  const nextAction = postCategory(post) === "vender"
    ? { href: "/vender-propiedad", label: "Revisar cómo vendemos una propiedad" }
    : postCategory(post) === "comprar" || postCategory(post) === "rentar"
      ? { href: "/inventario", label: "Consultar propiedades disponibles" }
      : { href: "/herramientas", label: "Usar las herramientas de Fortius" };

  return (
    <main className="bg-background pb-24 pt-28 md:pb-0 md:pt-32">
      <Container className="pb-16 md:pb-24">
        <article className="mx-auto max-w-3xl">
          <Link
            href="/blog"
            className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" strokeWidth={1.5} aria-hidden="true" />
            Volver al Blog
          </Link>

          <header className="mt-8 border-b border-border pb-10">
            <p className="font-mono text-xs uppercase tracking-[0.08em] text-primary-ink">
              {postFormat(post) === "actualidad" ? "Actualidad" : "Guía"}{postCategory(post) ? ` · ${BLOG_CATEGORIES[postCategory(post)!]}` : ""}
            </p>
            <h1 className="display-title mt-4 text-4xl text-foreground sm:text-5xl md:text-6xl">
              {post.titulo}
            </h1>
            <p className="mt-6 max-w-[62ch] text-lg leading-relaxed text-muted-foreground">
              {post.resumen}
            </p>
            <p className="mt-5 text-sm leading-6 text-muted-foreground">
              {[post.autor, post.ambito, `${readingMinutes(post)} min de lectura`].filter(Boolean).join(" · ")}
            </p>
            {post.publicadoEl && <p className="mt-2 text-sm text-muted-foreground">Publicado el <time dateTime={post.publicadoEl}>{formatBlogDate(post.publicadoEl)}</time></p>}
            {post.actualizadoEl !== post.publicadoEl && <p className="mt-2 text-sm text-muted-foreground">
              Actualizado el{" "}
              <time dateTime={post.actualizadoEl}>
                {new Intl.DateTimeFormat("es-MX", {
                  dateStyle: "long",
                  timeZone: "America/Tijuana",
                }).format(new Date(post.actualizadoEl))}
              </time>
            </p>}
          </header>

          {cover && (
            <figure className="mt-10">
              <Image
                src={cover.src}
                width={cover.width}
                height={cover.height}
                alt={cover.alt}
                sizes="(max-width: 639px) calc(100vw - 2rem), (max-width: 815px) calc(100vw - 3rem), 768px"
                className="h-auto w-full rounded-sm object-contain"
              />
              {cover.credit && <figcaption className="mt-3 text-sm leading-6 text-muted-foreground">
                <BlogCoverCredit cover={cover} linked />
              </figcaption>}
            </figure>
          )}

          {headings.length >= 2 ? <details className="mt-8 rounded-md border border-border bg-card p-5">
            <summary className="cursor-pointer font-medium text-foreground">En este artículo</summary>
            <nav aria-label="Contenido del artículo" className="mt-4">
              <ol className="space-y-2 text-sm text-muted-foreground">{headings.map((heading) => <li key={heading.id} className={heading.level === "h3" ? "pl-4" : ""}><a href={`#${heading.id}`} className="underline decoration-primary/30 underline-offset-4 hover:text-foreground">{heading.text}</a></li>)}</ol>
            </nav>
          </details> : null}
          <BlogContent content={post.contenido} figures={getBlogFigures(post.slug)} />
          {post.fuenteUrl && <aside className="mt-10 rounded-md border border-border bg-card p-5 text-sm leading-7 [overflow-wrap:anywhere]" aria-label="Fuente principal">
            <span className="font-medium">Fuente principal: </span><a href={post.fuenteUrl} className="text-primary-ink underline underline-offset-4">{post.fuenteNombre || "Consultar documento original"}</a>
          </aside>}
          <aside className="mt-12 border-y border-border py-8">
            <p className="font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">Siguiente paso</p>
            <Link href={nextAction.href} className="display-soft mt-3 inline-block text-2xl text-foreground underline decoration-primary/40 underline-offset-8">{nextAction.label}</Link>
          </aside>
          {related.length > 0 ? <aside className="mt-12" aria-labelledby="related-reading">
            <h2 id="related-reading" className="display-soft text-2xl text-foreground">Lecturas relacionadas</h2>
            <ul className="mt-5 divide-y divide-border border-y border-border">{related.map((candidate) => <li key={candidate.slug}><Link href={`/blog/${candidate.slug}`} className="flex min-h-16 items-center justify-between gap-4 py-3 text-foreground hover:text-primary-ink"><span>{candidate.titulo}</span><ArrowLeft className="size-4 rotate-180" aria-hidden="true" /></Link></li>)}</ul>
          </aside> : null}
        </article>
      </Container>
    </main>
  );
}
