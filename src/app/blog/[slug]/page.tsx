import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

import { BlogContent, blogHeadings } from "@/components/blog/blog-content";
import { BlogCoverCredit } from "@/components/blog/blog-cover-credit";
import { ShareArticle } from "@/components/blog/share-article";
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

/* Artículo (boceto BlogArticulo): cabecera sobre la portada, índice fijo con
   compartir, cuerpo de lectura, fuente, siguiente paso y lecturas relacionadas. */
export default async function BlogPostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const posts = await getBlogPosts();
  const post = posts.find((candidate) => candidate.slug === slug);
  if (!post) notFound();
  const cover = getBlogCover(post.slug);
  const headings = blogHeadings(post.contenido);
  const category = postCategory(post);
  const related = category ? posts.filter((candidate) => candidate.slug !== post.slug && postCategory(candidate) === category).slice(0, 3) : [];
  const nextAction = category === "vender"
    ? { href: "/vender-propiedad", label: "Revisar cómo vendemos una propiedad" }
    : category === "comprar" || category === "rentar"
      ? { href: "/inventario", label: "Consultar propiedades disponibles" }
      : { href: "/herramientas", label: "Usar las herramientas de Fortius" };
  const url = new URL(`/blog/${post.slug}`, siteConfig.url).href;
  const updated = post.actualizadoEl !== post.publicadoEl
    ? new Intl.DateTimeFormat("es-MX", { dateStyle: "long", timeZone: "America/Tijuana" }).format(new Date(post.actualizadoEl))
    : null;

  return (
    <main className="pg-page">
      <section className="pg-hero ba-hero">
        <div className="pg-container pg-hero-body">
          <Link href="/blog" className="ba-back"><ArrowLeft size={16} strokeWidth={1.5} aria-hidden="true" />Volver al Blog</Link>
          <header style={{ marginTop: 32 }}>
            <p className="pg-pills" style={{ marginBottom: 20 }}>
              <span className="pg-chip">{postFormat(post) === "actualidad" ? "Actualidad" : "Guía"}</span>
              {category && <span className="pg-chip">{BLOG_CATEGORIES[category]}</span>}
            </p>
            <h1 className="pg-title">{post.titulo}</h1>
            <p className="pg-hero-meta">
              {[post.autor, post.ambito, `${readingMinutes(post)} min de lectura`].filter(Boolean).join(" · ")}
              {post.publicadoEl && <> · Publicado el <time dateTime={post.publicadoEl}>{formatBlogDate(post.publicadoEl)}</time></>}
              {updated && <> · Actualizado el <time dateTime={post.actualizadoEl}>{updated}</time></>}
            </p>
          </header>
        </div>
      </section>

      <div className="pg-container">
        {cover && <figure className="ba-cover">
          <Image src={cover.src} width={cover.width} height={cover.height} alt={cover.alt} priority sizes="(max-width: 1320px) calc(100vw - 40px), 1256px" />
          {cover.credit && <figcaption className="ba-credit"><BlogCoverCredit cover={cover} linked /></figcaption>}
        </figure>}
        <div className="ba-layout">
          <aside className="ba-index">
            {headings.length >= 2 && <nav aria-label="Contenido del artículo">
              <p className="pg-eyebrow pg-eyebrow-ink">En este artículo</p>
              <ol>{headings.map((heading) => <li key={heading.id} className={heading.level === "h3" ? "is-sub" : undefined}><a href={`#${heading.id}`}>{heading.text}</a></li>)}</ol>
            </nav>}
            <ShareArticle title={post.titulo} text={post.resumen} url={url} />
          </aside>
          <article className="ba-article">
            <p className="ba-summary">{post.resumen}</p>
            <BlogContent content={post.contenido} figures={getBlogFigures(post.slug)} />
            {post.fuenteUrl && <aside className="ba-source" aria-label="Fuente principal">
              <span style={{ fontWeight: 600 }}>Fuente principal: </span><a href={post.fuenteUrl}>{post.fuenteNombre || "Consultar documento original"}</a>
            </aside>}
            <Link href={nextAction.href} className="ba-next">
              <span className="ba-next-media" aria-hidden="true"><ArrowUpRight size={28} /></span>
              <span><span className="pg-eyebrow pg-eyebrow-ink">Siguiente paso</span><strong>{nextAction.label}</strong></span>
              <ArrowUpRight size={22} aria-hidden="true" style={{ color: "var(--primary-text, #8a1634)" }} />
            </Link>
            <div className="ba-author">
              <span className="ba-author-mark" aria-hidden="true">FI</span>
              <span><strong>{post.autor || "Redacción Fortius Inmuebles"}</strong><span>Guías revisadas con fuentes oficiales y fecha de consulta.</span></span>
            </div>
          </article>
        </div>
      </div>

      {related.length > 0 && <section className="ba-related" aria-labelledby="related-reading">
        <div className="pg-container">
          <div className="pg-head">
            <h2 id="related-reading" className="pg-h2">Lecturas relacionadas</h2>
            <Link href="/blog" className="pg-link">Ver el blog</Link>
          </div>
          <div className="pg-grid-3">{related.map((candidate) => {
            const relatedCover = getBlogCover(candidate.slug);
            const relatedCategory = postCategory(candidate);
            return <Link key={candidate.slug} href={`/blog/${candidate.slug}`} className="ba-related-card">
              <span className="ba-related-media" style={{ display: "block" }}>{relatedCover && <Image src={relatedCover.src} alt="" fill sizes="(max-width: 639px) 100vw, 33vw" />}</span>
              <div><p className="pg-chip">{postFormat(candidate) === "actualidad" ? "Actualidad" : "Guía"}{relatedCategory ? ` · ${BLOG_CATEGORIES[relatedCategory]}` : ""}</p><p>{candidate.titulo}</p></div>
            </Link>;
          })}</div>
        </div>
      </section>}
    </main>
  );
}
