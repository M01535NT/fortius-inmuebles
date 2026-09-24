import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { Container } from "@/components/layout/container";
import { BlogCard } from "@/components/blog/blog-card";
import { getBlogPosts } from "@/lib/blog";
import { BLOG_CATEGORIES, BLOG_FORMATS, blogHref, filterBlogPosts, normalizeBlogSearch, postFormat } from "@/lib/blog-editorial";

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };
export async function generateMetadata({ searchParams }: Props = {}): Promise<Metadata> {
  const search = normalizeBlogSearch(await searchParams ?? {});
  return {
    title: "Mercado inmobiliario: guías y actualidad",
    description: "Guías, análisis y actualidad para comprar, vender y evaluar inmuebles en Tijuana y Baja California.",
    alternates: { canonical: "/blog" },
    ...(search.q || search.tema || search.tipo || search.pagina !== "1" ? { robots: { index: false, follow: true } } : {}),
  };
}
export const revalidate = 0;
const PAGE_SIZE = 9;

export default async function BlogPage({ searchParams }: Props = {}) {
  const [posts, params] = await Promise.all([getBlogPosts(), searchParams]);
  const search = normalizeBlogSearch(params ?? {});
  const filtered = filterBlogPosts(posts, search);
  const isFiltered = Boolean(search.q || search.tema || search.tipo);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(Number(search.pagina), pageCount);
  const selected = !isFiltered ? posts.find((post) => post.destacado) ?? posts[0] : undefined;
  const featured = page === 1 ? selected : undefined;
  // Keep a selected older article on the first page without repeating it on later pages.
  const ordered = selected ? [selected, ...filtered.filter((post) => post.id !== selected.id)] : filtered;
  const visible = ordered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).filter((post) => post.id !== featured?.id);
  const guides = posts.filter((post) => postFormat(post) === "guia").slice(0, 3);
  return (
    <main className="bg-background pb-24 pt-28 md:pb-0 md:pt-32">
      <Container className="pb-16 md:pb-24">
        <header className="border-b border-border pb-8 sm:pb-10">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-primary">Tijuana · Baja California</p>
          <div className="mt-5 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <h1 className="display-title max-w-[14ch] text-5xl text-foreground sm:text-6xl lg:text-7xl">Mercado inmobiliario.</h1>
            <p className="max-w-[48ch] text-base leading-7 text-muted-foreground sm:text-lg">Lo que pasa en el sector y lo que necesitas saber para tu próxima decisión. Guías, análisis y actualidad con contexto local.</p>
          </div>
        </header>

        <section aria-label="Buscar y filtrar artículos" className="py-8">
          <form key={blogHref(search)} action="/blog" method="get" role="search" className="grid items-end gap-4 sm:grid-cols-[1fr_12rem_auto]">
            {search.tipo && <input type="hidden" name="tipo" value={search.tipo} />}
            <div className="min-w-0">
              <label htmlFor="blog-search" className="mb-2 block text-sm font-medium">Buscar un tema</label>
              <div className="relative">
                <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-3.5 size-5 text-muted-foreground" />
                <input id="blog-search" name="q" type="search" maxLength={200} defaultValue={search.q} placeholder="Por ejemplo: precio, documentos, crédito…" className="min-h-12 w-full rounded-md border border-input bg-card pl-12 pr-4 text-base text-foreground" />
              </div>
            </div>
            <div>
              <label htmlFor="blog-topic" className="mb-2 block text-sm font-medium">Tema</label>
              <select id="blog-topic" name="tema" defaultValue={search.tema} className="min-h-12 w-full rounded-md border border-input bg-card px-3 text-base text-foreground">
                <option value="">Todos los temas</option>
                {Object.entries(BLOG_CATEGORIES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <button type="submit" className="min-h-12 rounded-md bg-primary px-6 text-base font-medium text-primary-foreground transition-opacity hover:opacity-90">Buscar</button>
          </form>
          <nav aria-label="Tipo de contenido" className="mt-5 flex flex-wrap items-center gap-2">
            {[["", "Todo"], ...Object.entries(BLOG_FORMATS)].map(([value, label]) => <Link key={value} href={blogHref({ ...search, tipo: value, pagina: "1" })} aria-current={search.tipo === value ? "page" : undefined} className={`inline-flex min-h-11 items-center rounded-md border px-5 text-sm font-medium transition-colors ${search.tipo === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-secondary"}`}>{label}</Link>)}
            {isFiltered && <Link href="/blog" className="inline-flex min-h-11 items-center px-3 text-sm text-primary underline underline-offset-4">Limpiar filtros</Link>}
          </nav>
        </section>

        {posts.length === 0 ? <div className="rounded-lg border border-dashed border-border px-6 py-14 text-center">
          <h2 className="display-soft text-2xl">Aún no hay artículos publicados.</h2>
          <p className="mx-auto mt-3 max-w-[46ch] leading-7 text-muted-foreground">Estamos preparando recursos para ayudarte a tomar decisiones inmobiliarias con mayor claridad.</p>
        </div> : <>
          {featured && <section aria-label="Artículo destacado" className="mb-12"><BlogCard post={featured} featured /></section>}
          <section aria-labelledby="blog-results-heading">
            <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-4">
              <h2 id="blog-results-heading" className="display-soft text-3xl">{isFiltered ? "Resultados" : "Para seguir leyendo"}</h2>
              <p role="status" className="text-sm text-muted-foreground">{`${filtered.length} ${filtered.length === 1 ? "artículo" : "artículos"}`} · Más recientes primero</p>
            </div>
            {filtered.length === 0 ? <div className="rounded-lg border border-dashed border-border px-6 py-14 text-center">
              <h3 className="display-soft text-2xl">No encontramos artículos con esos filtros.</h3>
              <p className="mt-3 text-muted-foreground">Prueba con otra palabra o explora todos los temas.</p>
              <Link href="/blog" className="mt-4 inline-flex min-h-11 items-center text-primary underline underline-offset-4">Limpiar filtros</Link>
            </div> : visible.length > 0 ? <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((post) => <li key={post.id} className="min-w-0"><BlogCard post={post} /></li>)}
            </ol> : <p className="text-muted-foreground">Puedes empezar por el artículo destacado.</p>}
            {pageCount > 1 && <nav aria-label="Páginas de artículos" className="mt-8 flex flex-wrap items-center justify-center gap-5">
              {page > 1 && <Link className="inline-flex min-h-11 items-center rounded-md border border-border px-4 hover:bg-secondary" href={blogHref({ ...search, pagina: String(page - 1) })}>Anterior</Link>}
              <span className="text-sm text-muted-foreground">Página {page} de {pageCount}</span>
              {page < pageCount && <Link className="inline-flex min-h-11 items-center rounded-md border border-border px-4 hover:bg-secondary" href={blogHref({ ...search, pagina: String(page + 1) })}>Siguiente</Link>}
            </nav>}
          </section>
          {!isFiltered && page === 1 && guides.length > 0 && <aside aria-labelledby="blog-guides-heading" className="mt-14 rounded-lg bg-block p-6 text-block-foreground sm:p-9">
            <div className="grid gap-8 md:grid-cols-[0.7fr_1.3fr]">
              <div><p className="font-mono text-xs uppercase tracking-[0.12em] text-block-muted">Tu punto de partida</p><h2 id="blog-guides-heading" className="display-soft mt-3 text-3xl">Guías para decidir.</h2><p className="mt-4 leading-7 text-block-muted">Respuestas prácticas para revisar tus opciones con más información.</p></div>
              <ul className="space-y-3">{guides.map((post) => <li key={post.id}><Link href={`/blog/${post.slug}`} className="flex min-h-14 items-center justify-between gap-5 rounded-md border border-block-foreground/20 px-4 py-3 text-base transition-colors hover:bg-block-foreground/10"><span>{post.titulo}</span><ArrowRight aria-hidden="true" className="size-5 shrink-0" /></Link></li>)}</ul>
            </div>
          </aside>}
        </>}
      </Container>
    </main>
  );
}
