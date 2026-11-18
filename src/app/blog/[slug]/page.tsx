import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { EnlaceFlecha } from "@/components/sitio/boton";
import { FilaLinea, ListaLineas } from "@/components/sitio/lineas";

import { BlogContent, blogHeadings } from "@/components/blog/blog-content";
import { BlogCoverCredit } from "@/components/blog/blog-cover-credit";
import { ShareArticle } from "@/components/blog/share-article";
import { siteConfig } from "@/data/site";
import { getBlogPostBySlug, getBlogPosts } from "@/lib/blog";
import { getBlogCover } from "@/data/blog-covers";
import { getBlogFigures } from "@/data/blog-figures";
import { BLOG_CATEGORIES, postCategory, postFormat, formatBlogDate, readingMinutes } from "@/lib/blog-editorial";
import { JsonLd } from "@/components/seo/json-ld";
import { blogPostingLd, breadcrumbLd } from "@/lib/seo/json-ld";
import { fullTitle } from "@/lib/seo/page-metadata";
import "./articulo-sitio.css";

type Params = { slug: string };

export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return { title: "Artículo no encontrado", robots: { index: false, follow: true } };
  const path = `/blog/${post.slug}`;
  const cover = getBlogCover(post.slug);
  const coverUrl = cover ? new URL(cover.src, siteConfig.url).href : undefined;
  // Un título largo va sin el sufijo de la marca para que Google no lo corte.
  const shown = fullTitle(post.titulo);
  return {
    title: shown === post.titulo ? { absolute: post.titulo } : post.titulo,
    description: post.resumen,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      title: shown,
      siteName: "Fortius Inmuebles",
      locale: "es_MX",
      description: post.resumen,
      url: new URL(path, siteConfig.url).href,
      modifiedTime: post.actualizadoEl,
      ...(post.publicadoEl ? { publishedTime: post.publicadoEl } : {}),
      ...(post.autor ? { authors: [post.autor] } : {}),
      ...(cover && coverUrl ? { images: [{ url: coverUrl, width: cover.width, height: cover.height, alt: cover.alt }] } : {}),
    },
    ...(coverUrl ? {
      twitter: { card: "summary_large_image", title: shown, description: post.resumen, images: [coverUrl] },
    } : {}),
  };
}

/*
  Artículo, rediseño del sitio (etapa 5, 17/11/2026): volver, tipo y tema en una línea, título grande y
  datos; la portada con esquinas de 16 px; índice y compartir a un lado; lectura de 720 px, fuente,
  siguiente paso y lecturas relacionadas.
*/
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

  const tipo = [postFormat(post) === "actualidad" ? "Actualidad" : "Guía", category ? BLOG_CATEGORIES[category] : ""].filter(Boolean).join(" · ");

  return (
    <main className="s-pagina ar">
      <JsonLd data={[blogPostingLd(post, cover?.src), breadcrumbLd([{ name: "Inicio", path: "/" }, { name: "Blog", path: "/blog" }, { name: post.titulo, path: `/blog/${post.slug}` }])]} />
      <header className="s-contenedor ar-cabeza">
        <Link href="/blog" className="s-volver"><span aria-hidden="true">←</span>Volver al blog</Link>
        <h1 className="ar-titulo">{post.titulo}</h1>
        <p className="ar-datos">
          {[tipo, post.autor, post.ambito, `${readingMinutes(post)} min de lectura`].filter(Boolean).join(" · ")}
          {post.publicadoEl && <> · Publicado el <time dateTime={post.publicadoEl}>{formatBlogDate(post.publicadoEl)}</time></>}
          {updated && <> · Actualizado el <time dateTime={post.actualizadoEl}>{updated}</time></>}
        </p>
      </header>

      <div className="s-contenedor">
        {cover && <figure className="ar-portada">
          <Image src={cover.src} width={cover.width} height={cover.height} alt={cover.alt} preload sizes="(max-width: 1440px) 100vw, 1440px" />
          {cover.credit && <figcaption className="ar-credito"><BlogCoverCredit cover={cover} linked /></figcaption>}
        </figure>}
        <div className="ar-cuerpo">
          <aside className="ar-lado">
            {headings.length >= 2 && <nav aria-label="Contenido del artículo" className="ar-indice">
              <p className="ar-indice-titulo">En este artículo</p>
              <ol>{headings.map((heading) => <li key={heading.id} className={heading.level === "h3" ? "ar-sub" : undefined}><a href={`#${heading.id}`}>{heading.text}</a></li>)}</ol>
            </nav>}
            <ShareArticle title={post.titulo} text={post.resumen} url={url} />
          </aside>
          <article className="ar-articulo">
            <p className="ar-resumen">{post.resumen}</p>
            <BlogContent content={post.contenido} figures={getBlogFigures(post.slug)} />
            {post.fuenteUrl && <aside className="ar-fuente" aria-label="Fuente principal">
              <span>Fuente principal: </span><a href={post.fuenteUrl}>{post.fuenteNombre || "Consultar documento original"}</a>
            </aside>}
            <ListaLineas grande fuerte className="ar-siguiente">
              <FilaLinea href={nextAction.href} titulo={nextAction.label} />
            </ListaLineas>
            <p className="ar-autor"><strong>{post.autor || "Redacción Fortius Inmuebles"}</strong> · Guías revisadas con fuentes oficiales y fecha de consulta.</p>
          </article>
        </div>
      </div>

      {related.length > 0 && <section className="s-contenedor ar-relacionadas" aria-labelledby="related-reading">
        <div className="ar-relacionadas-cabeza">
          <h2 id="related-reading" className="s-h2">Lecturas relacionadas</h2>
          <EnlaceFlecha href="/blog">Ver el blog</EnlaceFlecha>
        </div>
        <ul className="ar-relacionadas-lista">{related.map((candidate) => {
          const relatedCover = getBlogCover(candidate.slug);
          const relatedCategory = postCategory(candidate);
          return <li key={candidate.slug}>
            <Link href={`/blog/${candidate.slug}`} className="ar-relacionada">
              <span className="ar-relacionada-foto">{relatedCover && <Image src={relatedCover.src} alt="" fill sizes="(max-width: 639px) 100vw, 33vw" />}</span>
              <span className="ar-relacionada-titulo">{candidate.titulo}</span>
              <span className="ar-tipo">{relatedCategory ? BLOG_CATEGORIES[relatedCategory] : postFormat(candidate) === "actualidad" ? "Actualidad" : "Guía"}</span>
            </Link>
          </li>;
        })}</ul>
      </section>}
    </main>
  );
}
