import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Container } from "@/components/layout/container";
import { BlogContent } from "@/components/blog/blog-content";
import { siteConfig } from "@/data/site";
import { getBlogPostBySlug } from "@/lib/blog";
import { getBlogCover } from "@/data/blog-covers";
import { getBlogFigures } from "@/data/blog-figures";

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
      ...(cover && coverUrl ? { images: [{ url: coverUrl, width: cover.width, height: cover.height, alt: cover.alt }] } : {}),
    },
    ...(coverUrl ? {
      twitter: { card: "summary_large_image", title: post.titulo, description: post.resumen, images: [coverUrl] },
    } : {}),
  };
}

export default async function BlogPostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();
  const cover = getBlogCover(post.slug);

  return (
    <main className="bg-background pb-24 pt-28 md:pb-0 md:pt-32">
      <Container className="pb-16 md:pb-24">
        <article className="mx-auto max-w-3xl">
          <Link
            href="/blog"
            className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" strokeWidth={1.5} aria-hidden="true" />
            Volver al blog
          </Link>

          <header className="mt-8 border-b border-border pb-10">
            <p className="font-mono text-xs uppercase tracking-[0.08em] text-primary">
              Criterio inmobiliario
            </p>
            <h1 className="display-title mt-4 text-4xl text-foreground sm:text-5xl md:text-6xl">
              {post.titulo}
            </h1>
            <p className="mt-6 max-w-[62ch] text-lg leading-relaxed text-muted-foreground">
              {post.resumen}
            </p>
            <p className="mt-5 text-sm text-muted-foreground">
              Actualizado el{" "}
              <time dateTime={post.actualizadoEl}>
                {new Intl.DateTimeFormat("es-MX", {
                  dateStyle: "long",
                  timeZone: "America/Tijuana",
                }).format(new Date(post.actualizadoEl))}
              </time>
            </p>
          </header>

          {cover && (
            <figure className="mt-10">
              <Image
                {...cover}
                alt={cover.alt}
                sizes="(max-width: 639px) calc(100vw - 2rem), (max-width: 815px) calc(100vw - 3rem), 768px"
                className="aspect-[3/2] h-auto w-full rounded-sm object-contain"
              />
              <figcaption className="mt-3 text-sm leading-6 text-muted-foreground">
                Ilustración editorial generada con IA; no representa un inmueble en oferta.
              </figcaption>
            </figure>
          )}

          <BlogContent content={post.contenido} figures={getBlogFigures(post.slug)} />
        </article>
      </Container>
    </main>
  );
}
