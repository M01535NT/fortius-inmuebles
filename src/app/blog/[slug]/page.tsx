import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Container } from "@/components/layout/container";
import { siteConfig } from "@/data/site";
import { getBlogPostBySlug, postParagraphs } from "@/lib/blog";

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
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

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
          </header>

          <div className="mt-10 space-y-6">
            {postParagraphs(post.contenido).map((paragraph, index) => (
              <p key={index} className="max-w-[68ch] text-base leading-8 text-foreground/85 sm:text-[1.0625rem]">
                {paragraph}
              </p>
            ))}
          </div>
        </article>
      </Container>
    </main>
  );
}
