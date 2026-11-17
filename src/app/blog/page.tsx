import type { Metadata } from "next";
import Link from "next/link";

import { BlogCard } from "@/components/blog/blog-card";
import { Boton, EnlaceFlecha } from "@/components/sitio/boton";
import { Chevron, Lupa } from "@/components/sitio/iconos";
import { FilaLinea, ListaLineas } from "@/components/sitio/lineas";
import { CabezaPagina } from "@/components/sitio/pagina";
import { getBlogPosts } from "@/lib/blog";
import { BLOG_CATEGORIES, BLOG_FORMATS, blogHref, filterBlogPosts, normalizeBlogSearch, postFormat } from "@/lib/blog-editorial";
import { pageMetadata } from "@/lib/seo/page-metadata";
import "./blog-sitio.css";

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };
export async function generateMetadata({ searchParams }: Props = {}): Promise<Metadata> {
  const search = normalizeBlogSearch(await searchParams ?? {});
  return pageMetadata({
    path: "/blog",
    title: "Guías inmobiliarias de Tijuana",
    description: "Guías para comprar, vender y revisar inmuebles en Tijuana y Baja California: trámites, impuestos, crédito, precios, con fuente oficial y fecha de consulta.",
    ...(search.q || search.tema || search.tipo || search.desde || search.hasta || search.orden === "antiguos" || search.vista === "lista" || search.pagina !== "1" ? { robots: { index: false, follow: true } } : {}),
  });
}
export const revalidate = 0;
const PAGE_SIZE = 9;

/*
  Blog, Fortius II (etapa 5, 17/11/2026): la misma búsqueda y los mismos filtros en la dirección,
  con la piel nueva. Una barra con la búsqueda, el tema y el tipo (listas desplegables), fechas y
  orden plegados, y la vista. Debajo, el destacado, la rejilla, las páginas y, al pie, herramientas
  y guías.
*/
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
  // Un destacado antiguo se queda en la primera página sin repetirse en las siguientes.
  const ordered = selected ? [selected, ...filtered.filter((post) => post.id !== selected.id)] : filtered;
  const visible = ordered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).filter((post) => post.id !== featured?.id);
  const shown = new Set([featured?.id, ...visible.map((post) => post.id)]);
  const guides = posts.filter((post) => postFormat(post) === "guia" && !shown.has(post.id)).slice(0, 3);
  const fechasAbiertas = Boolean(search.desde || search.hasta || search.orden === "antiguos");

  return (
    <main className="s-pagina bl">
      <CabezaPagina titulo="Blog" entrada="Guías y noticias del mercado local." />

      <div className="s-contenedor bl-cuerpo">
        <section aria-label="Buscar y filtrar artículos" className="bl-filtros">
          <form key={blogHref(search)} action="/blog" method="get" role="search" className="bl-formulario">
            {listView && <input type="hidden" name="vista" value="lista" />}
            <div className="bl-barra">
              <label className="bl-busqueda">
                <Lupa />
                <span className="sr-only">Buscar un tema</span>
                <input id="blog-search" name="q" type="search" maxLength={200} defaultValue={search.q} placeholder="Buscar: precio, documentos, crédito…" />
              </label>
              <label className="bl-lista">
                <span className="sr-only">Tema</span>
                <select name="tema" defaultValue={search.tema}>
                  <option value="">Todos los temas</option>
                  {Object.entries(BLOG_CATEGORIES).map(([valor, etiqueta]) => <option key={valor} value={valor}>{etiqueta}</option>)}
                </select>
                <Chevron />
              </label>
              <label className="bl-lista">
                <span className="sr-only">Tipo de contenido</span>
                <select name="tipo" defaultValue={search.tipo}>
                  <option value="">Guías y actualidad</option>
                  {Object.entries(BLOG_FORMATS).map(([valor, etiqueta]) => <option key={valor} value={valor}>{etiqueta}</option>)}
                </select>
                <Chevron />
              </label>
              <Boton type="submit">Buscar</Boton>
            </div>
            <details className="bl-mas" open={fechasAbiertas || undefined}>
              <summary>Fechas y orden <Chevron /></summary>
              <div className="bl-mas-campos">
                <div className="s-campo">
                  <label htmlFor="blog-from" className="s-campo-etiqueta">Desde</label>
                  <input id="blog-from" name="desde" type="date" className="s-campo-control" defaultValue={search.desde} aria-invalid={invalidRange || undefined} aria-describedby={invalidRange ? "blog-date-error" : undefined} />
                </div>
                <div className="s-campo">
                  <label htmlFor="blog-until" className="s-campo-etiqueta">Hasta</label>
                  <input id="blog-until" name="hasta" type="date" className="s-campo-control" defaultValue={search.hasta} aria-invalid={invalidRange || undefined} aria-describedby={invalidRange ? "blog-date-error" : undefined} />
                </div>
                <div className="s-campo">
                  <label htmlFor="blog-order" className="s-campo-etiqueta">Ordenar por</label>
                  <select id="blog-order" name="orden" className="s-campo-control" defaultValue={search.orden}>
                    <option value="recientes">Más recientes</option>
                    <option value="antiguos">Más antiguos</option>
                  </select>
                </div>
              </div>
            </details>
            {invalidRange && <p id="blog-date-error" role="alert" className="bl-error">La fecha desde debe ser anterior o igual a la fecha hasta.</p>}
          </form>
        </section>

        {posts.length === 0 ? (
          <div className="bl-vacio">
            <h2 className="s-h2">Aún no hay artículos publicados.</h2>
            <p className="s-entrada">Estamos preparando recursos para ayudarte a tomar decisiones inmobiliarias con mayor claridad.</p>
          </div>
        ) : <>
          {featured && <section aria-label="Artículo destacado" className="bl-destacado"><BlogCard post={featured} featured /></section>}

          <section aria-labelledby="blog-results-heading" className="bl-resultados">
            <div className="bl-resultados-cabeza">
              <div className="bl-resultados-titulo">
                <h2 id="blog-results-heading" className="s-h2">{isFiltered ? "Resultados" : listView ? "Artículos" : "Para seguir leyendo"}</h2>
                <p role="status" className="bl-conteo">{`${filtered.length} ${filtered.length === 1 ? "artículo" : "artículos"}`} · {search.orden === "antiguos" ? "Más antiguos primero" : "Más recientes primero"}</p>
              </div>
              <div className="bl-resultados-acciones">
                {(isFiltered || search.orden === "antiguos") && <Link href={clearHref} className="s-enlace s-enlace-subrayado">Limpiar filtros</Link>}
                <nav aria-label="Vista de artículos" className="s-pestanas">
                  {([{ value: "cuadricula", label: "Cuadrícula" }, { value: "lista", label: "Lista" }] as const).map(({ value, label }) => (
                    <Link key={value} href={blogHref({ ...search, vista: value })} className="s-pestana" aria-label={`Vista de ${label.toLowerCase()}`} aria-current={search.vista === value ? "page" : undefined}>{label}</Link>
                  ))}
                </nav>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="bl-vacio">
                <h3 className="s-h3">No encontramos artículos con esos filtros.</h3>
                <p className="s-apoyo">{invalidRange ? "Corrige las fechas para ver los artículos." : "Prueba con otra palabra, tema o fecha."}</p>
                <Link href={clearHref} className="s-enlace">Limpiar filtros</Link>
              </div>
            ) : visible.length > 0 ? (
              <ol className={listView ? "bl-lista-articulos" : "bl-rejilla"}>
                {visible.map((post) => <li key={post.id}><BlogCard post={post} view={search.vista} /></li>)}
              </ol>
            ) : <p className="s-apoyo">Puedes empezar por el artículo destacado.</p>}

            {pageCount > 1 && (
              <nav aria-label="Páginas de artículos" className="bl-paginas">
                {page > 1 && <Boton href={blogHref({ ...search, pagina: String(page - 1) })} variante="contorno" tamano="chico">Anterior</Boton>}
                <span className="s-apoyo">Página {page} de {pageCount}</span>
                {page < pageCount && <Boton href={blogHref({ ...search, pagina: String(page + 1) })} variante="contorno" tamano="chico">Siguiente</Boton>}
              </nav>
            )}
          </section>

          {!isFiltered && !listView && search.orden !== "antiguos" && page === 1 && (
            <div className="bl-pie">
              <section aria-labelledby="blog-tools-heading" className="bl-pie-bloque">
                <h2 id="blog-tools-heading" className="s-h2-bloque">Haz los números.</h2>
                <ListaLineas fuerte>
                  <FilaLinea href="/herramientas/hipoteca" titulo="Calculadora de hipoteca" detalle="Mensualidad, enganche y costo total." />
                  <FilaLinea href="/herramientas/gastos-de-cierre" titulo="Gastos de cierre" detalle="ISAI, notaría y avalúo estimados." />
                </ListaLineas>
              </section>
              {guides.length > 0 && (
                <aside aria-labelledby="blog-guides-heading" className="bl-pie-bloque">
                  <h2 id="blog-guides-heading" className="s-h2-bloque">Guías para decidir.</h2>
                  <ListaLineas fuerte>
                    {guides.map((post) => <FilaLinea key={post.id} href={`/blog/${post.slug}`} titulo={post.titulo} />)}
                  </ListaLineas>
                  <EnlaceFlecha href={blogHref({ tipo: "guia" })}>Ver todas las guías</EnlaceFlecha>
                </aside>
              )}
            </div>
          )}
        </>}
      </div>
    </main>
  );
}
