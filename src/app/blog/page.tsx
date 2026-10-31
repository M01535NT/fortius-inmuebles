import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calculator, ChevronDown, FileText, LayoutGrid, List, Search } from "lucide-react";
import { BlogCard } from "@/components/blog/blog-card";
import { getBlogPosts } from "@/lib/blog";
import { BLOG_CATEGORIES, BLOG_FORMATS, blogHref, filterBlogPosts, normalizeBlogSearch, postFormat } from "@/lib/blog-editorial";

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };
export async function generateMetadata({ searchParams }: Props = {}): Promise<Metadata> {
  const search = normalizeBlogSearch(await searchParams ?? {});
  return {
    title: "Blog",
    description: "Guías, análisis y actualidad para comprar, vender y evaluar inmuebles en Tijuana y Baja California.",
    alternates: { canonical: "/blog" },
    ...(search.q || search.tema || search.tipo || search.desde || search.hasta || search.orden === "antiguos" || search.vista === "lista" || search.pagina !== "1" ? { robots: { index: false, follow: true } } : {}),
  };
}
export const revalidate = 0;
const PAGE_SIZE = 9;

/* Portada del blog en formato revista: título, una sola caja de búsqueda (fechas y
   orden plegados), temas y tipo como chips, destacado, rejilla y herramientas al pie. */
export default async function BlogPage({ searchParams }: Props = {}) {
  const [posts, params] = await Promise.all([getBlogPosts(), searchParams]);
  const search = normalizeBlogSearch(params ?? {});
  const filtered = filterBlogPosts(posts, search);
  const isFiltered = Boolean(search.q || search.tema || search.tipo || search.desde || search.hasta);
  const invalidRange = Boolean(search.desde && search.hasta && search.desde > search.hasta);
  const listView = search.vista === "lista";
  const clearHref = blogHref({ vista: search.vista });
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(Number(search.pagina), pageCount);
  const selected = !isFiltered && !listView && search.orden !== "antiguos" ? filtered.find((post) => post.destacado) ?? filtered[0] : undefined;
  const featured = page === 1 ? selected : undefined;
  // Keep a selected older article on the first page without repeating it on later pages.
  const ordered = selected ? [selected, ...filtered.filter((post) => post.id !== selected.id)] : filtered;
  const visible = ordered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).filter((post) => post.id !== featured?.id);
  const guides = posts.filter((post) => postFormat(post) === "guia").slice(0, 3);
  return (
    <main className="pg-page">
      <div className="pg-container pg-section-last">
        <header className="bp-head">
          <div>
            <p className="pg-eyebrow pg-eyebrow-ink">Tijuana y Baja California</p>
            <h1 className="pg-title">Blog</h1>
          </div>
          <p className="pg-lead pg-lead-ink">Lo que pasa en el sector y lo que necesitas saber para tu próxima decisión. Guías, análisis y actualidad con contexto local.</p>
        </header>

        <section aria-label="Buscar y filtrar artículos">
          <form key={blogHref(search)} action="/blog" method="get" role="search" className="bp-search">
            {search.tema && <input type="hidden" name="tema" value={search.tema} />}
            {search.tipo && <input type="hidden" name="tipo" value={search.tipo} />}
            {listView && <input type="hidden" name="vista" value="lista" />}
            <div className="bp-search-box">
              <Search size={18} aria-hidden="true" />
              <label htmlFor="blog-search" className="sr-only">Buscar un tema</label>
              <input id="blog-search" name="q" type="search" maxLength={200} defaultValue={search.q} placeholder="Buscar: precio, documentos, crédito…" />
              <button type="submit" className="pg-btn">Buscar</button>
            </div>
            <details className="bp-more" open={Boolean(search.desde || search.hasta || search.orden === "antiguos") || undefined}>
              <summary>Fechas y orden <ChevronDown size={16} aria-hidden="true" /></summary>
              <div className="bp-more-fields">
                <div className="pg-field">
                  <label htmlFor="blog-from">Desde</label>
                  <input id="blog-from" name="desde" type="date" defaultValue={search.desde} aria-invalid={invalidRange || undefined} aria-describedby={invalidRange ? "blog-date-error" : undefined} />
                </div>
                <div className="pg-field">
                  <label htmlFor="blog-until">Hasta</label>
                  <input id="blog-until" name="hasta" type="date" defaultValue={search.hasta} aria-invalid={invalidRange || undefined} aria-describedby={invalidRange ? "blog-date-error" : undefined} />
                </div>
                <div className="pg-field">
                  <label htmlFor="blog-order">Ordenar por</label>
                  <select id="blog-order" name="orden" defaultValue={search.orden}>
                    <option value="recientes">Más recientes</option>
                    <option value="antiguos">Más antiguos</option>
                  </select>
                </div>
              </div>
            </details>
            {invalidRange && <p id="blog-date-error" role="alert" className="bp-search-error">La fecha desde debe ser anterior o igual a la fecha hasta.</p>}
          </form>
          <div className="bp-toolbar">
            <nav aria-label="Temas" className="bp-chips">
              {[["", "Todos los temas"], ...Object.entries(BLOG_CATEGORIES)].map(([value, label]) => <Link key={value} href={blogHref({ ...search, tema: value, pagina: "1" })} aria-current={search.tema === value ? "page" : undefined}>{label}</Link>)}
            </nav>
            <div className="bp-toolbar-end">
              <nav aria-label="Tipo de contenido" className="bp-chips">
                {[["", "Todo"], ...Object.entries(BLOG_FORMATS)].map(([value, label]) => <Link key={value} href={blogHref({ ...search, tipo: value, pagina: "1" })} aria-current={search.tipo === value ? "page" : undefined}>{label}</Link>)}
                {(isFiltered || search.orden === "antiguos") && <Link href={clearHref} className="pg-link">Limpiar filtros</Link>}
              </nav>
              <nav aria-label="Vista de artículos" className="bp-views">
                {([{ value: "cuadricula", label: "Cuadrícula", Icon: LayoutGrid }, { value: "lista", label: "Lista", Icon: List }] as const).map(({ value, label, Icon }) => <Link key={value} href={blogHref({ ...search, vista: value })} aria-label={`Vista de ${label.toLowerCase()}`} aria-current={search.vista === value ? "page" : undefined} title={label}><Icon aria-hidden="true" size={16} /></Link>)}
              </nav>
            </div>
          </div>
        </section>

        {posts.length === 0 ? <div className="pg-empty pg-section">
          <h2>Aún no hay artículos publicados.</h2>
          <p>Estamos preparando recursos para ayudarte a tomar decisiones inmobiliarias con mayor claridad.</p>
        </div> : <>
          {featured && <section aria-label="Artículo destacado" className="pg-section" style={{ paddingTop: "clamp(32px, 4vw, 56px)" }}><BlogCard post={featured} featured /></section>}
          <section aria-labelledby="blog-results-heading" className="pg-section" style={{ paddingTop: "clamp(40px, 5vw, 72px)" }}>
            <div className="bp-results-head">
              <h2 id="blog-results-heading" className="pg-h2">{isFiltered ? "Resultados" : listView ? "Artículos" : "Para seguir leyendo"}</h2>
              <p role="status" className="pg-muted" style={{ fontSize: 14 }}>{`${filtered.length} ${filtered.length === 1 ? "artículo" : "artículos"}`} · {search.orden === "antiguos" ? "Más antiguos primero" : "Más recientes primero"}</p>
            </div>
            {filtered.length === 0 ? <div className="pg-empty">
              <h3>No encontramos artículos con esos filtros.</h3>
              <p>{invalidRange ? "Corrige las fechas para ver los artículos." : "Prueba con otra palabra, tema o fecha."}</p>
              <Link href={clearHref} className="pg-link">Limpiar filtros</Link>
            </div> : visible.length > 0 ? <ol className={listView ? "bp-list" : "bp-grid"}>
              {visible.map((post) => <li key={post.id} className="min-w-0"><BlogCard post={post} view={search.vista} /></li>)}
            </ol> : <p className="pg-muted">Puedes empezar por el artículo destacado.</p>}
            {pageCount > 1 && <nav aria-label="Páginas de artículos" className="bp-pager">
              {page > 1 && <Link className="pg-pill" href={blogHref({ ...search, pagina: String(page - 1) })}>Anterior</Link>}
              <span className="pg-muted" style={{ fontSize: 14 }}>Página {page} de {pageCount}</span>
              {page < pageCount && <Link className="pg-pill" href={blogHref({ ...search, pagina: String(page + 1) })}>Siguiente</Link>}
            </nav>}
          </section>
          {!isFiltered && !listView && search.orden !== "antiguos" && page === 1 && <div className="bp-foot">
            <nav className="bp-tools" aria-label="Herramientas">
              <Link href="/herramientas/hipoteca" className="bp-tool"><span className="bp-tool-icon"><Calculator size={22} aria-hidden="true" /></span><span><strong>Calculadora de hipoteca</strong><span>Mensualidad, enganche y costo total</span></span></Link>
              <Link href="/herramientas/gastos-de-cierre" className="bp-tool"><span className="bp-tool-icon"><FileText size={22} aria-hidden="true" /></span><span><strong>Gastos de cierre</strong><span>ISAI, notaría y avalúo estimados</span></span></Link>
            </nav>
            {guides.length > 0 && <aside aria-labelledby="blog-guides-heading" className="bp-guides">
              <p className="pg-eyebrow">Tu punto de partida</p>
              <h2 id="blog-guides-heading" className="pg-h2">Guías para decidir.</h2>
              <ul>{guides.map((post) => <li key={post.id}><Link href={`/blog/${post.slug}`}><span>{post.titulo}</span><ArrowRight aria-hidden="true" size={18} /></Link></li>)}</ul>
            </aside>}
          </div>}
        </>}
      </div>
    </main>
  );
}
