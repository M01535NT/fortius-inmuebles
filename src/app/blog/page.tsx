import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/sections/section-heading";
import { getBlogPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog inmobiliario",
  description:
    "Guías para comprar, vender y evaluar inmuebles con información clara en Tijuana y Baja California.",
  alternates: { canonical: "/blog" },
};

export const revalidate = 0;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <main className="bg-background pb-24 pt-32 md:pb-0">
      <Container className="pb-16 md:pb-24">
        <SectionHeading
          eyebrow="Criterio inmobiliario"
          title="Información para decidir."
          description="Análisis y guías prácticas sobre compraventa, documentación y valor inmobiliario en Baja California."
        />

        {posts.length === 0 ? (
          <div className="mt-12 rounded-lg border border-dashed border-border px-6 py-14 text-center">
            <p className="display-soft text-xl text-foreground">
              Aún no hay artículos publicados.
            </p>
            <p className="mx-auto mt-3 max-w-[46ch] text-base leading-relaxed text-muted-foreground">
              Estamos preparando recursos para ayudarte a tomar decisiones inmobiliarias con mayor claridad.
            </p>
          </div>
        ) : (
          <ol className="mt-12 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-2">
            {posts.map((post, index) => (
              <li key={post.id} className="min-w-0 bg-card">
                <Link
                  href={`/blog/${post.slug}`}
                  className="group flex h-full min-h-64 flex-col p-6 transition-colors hover:bg-secondary/60 sm:p-8"
                >
                  <div className="flex items-start justify-between gap-6">
                    <p className="font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground">
                      {String(index + 1).padStart(2, "0")} · {formatDate(post.actualizadoEl)}
                    </p>
                    <ArrowUpRight
                      className="size-5 shrink-0 text-primary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                  </div>
                  <h2 className="display-soft mt-8 text-2xl text-foreground sm:text-3xl">
                    {post.titulo}
                  </h2>
                  <p className="mt-4 max-w-[58ch] text-base leading-relaxed text-muted-foreground">
                    {post.resumen}
                  </p>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </Container>
    </main>
  );
}
