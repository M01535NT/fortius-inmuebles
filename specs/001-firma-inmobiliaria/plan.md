# Plan - Firma Inmobiliaria Estrategica

## Stack

- Next.js App Router para rutas publicas y SEO.
- TypeScript para componentes y datos tipados.
- Tailwind CSS para sistema visual.
- shadcn/ui para `Button`, `Card`, `Badge`, `Input`, `Textarea`, `Label` y `Sheet`.
- Magic UI para `BlurFade`, `Marquee`, `BorderBeam` y `AnimatedGridPattern`.
- Motion.dev para entradas, timeline y microinteracciones.
- Lucide React para iconografia funcional.

## Arquitectura

```txt
src/
  app/
    page.tsx
    layout.tsx
    globals.css
    residencial/page.tsx
    comercial/page.tsx
    industrial/page.tsx
    vender-inmueble/page.tsx
    comprar-inmueble/page.tsx
    due-diligence-inmobiliaria/page.tsx
    inventario/page.tsx
    nosotros/page.tsx
    contacto/page.tsx
    privacidad/page.tsx
  components/
    layout/
    sections/
    property/
    magicui/
    ui/
  data/
  lib/
```

## Rutas

- Home con landing estrategica.
- Rutas de especialidad como paginas SEO simples.
- Inventario como pagina de apoyo, no eje central.
- Contacto y privacidad como rutas basicas.

## Datos

Los textos, navegacion, servicios, proceso y propiedades destacadas viven en `src/data/site.ts` para evitar hardcodear todo en componentes.

## UI System

- Dark-first.
- Canvas: `#0A0E0C`.
- Panel: `#0D1712`.
- Texto: `#F3F1EC`.
- Verde CTA: `#35D29B`.
- Verde enfasis: `#57E3B3`.
- Hairlines finos con opacidad.
- Radio sobrio: 0 a 8px.
- Titulares condensados.

## Componentes

- `Navbar`
- `Footer`
- `Container`
- `SectionHeading`
- `Hero`
- `SegmentCards`
- `MethodTimeline`
- `TrustSignals`
- `FeaturedProperties`
- `EditorialSection`
- `DiagnosticCTA`
- `PropertyCard`
- `ContactForm`

## Animacion

- `BlurFade` para entrada por secciones.
- `Marquee` para zonas de operacion.
- `BorderBeam` para formulario/CTA clave.
- `AnimatedGridPattern` para textura de fondo.
- Motion.dev en cards, hero y timeline.
- Respeto a `prefers-reduced-motion`.

## SEO

- `metadata` global.
- Metadata por rutas principales.
- H1 unico por pagina.
- Alt text util.
- Open Graph global.
- `robots.ts` y `sitemap.ts` basicos.

## Verificacion

- `npm run lint`.
- `npm run build`.
- Playwright screenshot desktop y mobile.
- Revisión visual de Home, navegación mobile y formulario.

## Tradeoffs

- Se usa inventario mock para demostrar estructura sin inventar disponibilidad real.
- Se prioriza Home y sistema visual; admin/datos reales quedan fuera.
- Se mantiene el prototipo `inicio.html` como referencia, pero el producto real vive en Next.js.

---

## Addendum (6-jul-2026) - Estado tras el rediseno "Cota"

- El Home vive en `src/components/home/` (site-nav, theme-toggle, hero, relato, metodo, entregables, respuestas, zonas, evaluar, site-footer). `src/app/page.tsx` solo compone.
- Eliminados: `components/layout/{navbar,footer}.tsx`, `components/sections/{hero,segment-cards,method-timeline,trust-signals,featured-properties,editorial-section}.tsx`, `components/magicui/{border-beam,animated-grid-pattern}.tsx`.
- `components/sections/` restante (interior-page, diagnostic-cta, contact-form, section-heading) da servicio solo a rutas interiores legado.
- Tokens y temas en `globals.css` (claro default + `.dark`); fuentes via `next/font` (Archivo variable con eje wdth + IBM Plex Mono).
- Imagenes hero en `public/hero/`.
