# Plan Técnico — Sitio Cota

Refleja el estado real del código al 7-jul-2026. Sistema visual en `DesignDirection.md`; rutas en `sitemap.md`.

## Stack

- Next.js App Router + TypeScript.
- Tailwind CSS v4; tokens y doble tema en `globals.css` (`@custom-variant dark`).
- shadcn/ui para primitivos (`Button`, `Input`, `Textarea`, `Label`, etc.).
- Magic UI como componentes copiados al proyecto (`src/components/magicui/`).
- **GSAP (`gsap` + `@gsap/react`) — motor de animación del Home**: ScrollTrigger para scrubs y reveals repetibles, SplitText para tipografía por letra. Plan de ejecución en `motion-v4-plan.md`.
- Motion (motion-react) permanece en los primitivos ya construidos y en páginas interiores hasta su migración; no introducir Motion nuevo en el Home.
- Lucide React para iconografía funcional (sin iconos de marca: lucide los eliminó).
- Fuentes vía `next/font`: Archivo Variable (eje wdth) + IBM Plex Mono.

## Arquitectura

```txt
src/
  app/                      # rutas: ver sitemap.md § Rutas Implementadas
    page.tsx                # Home: solo compone src/components/home/*
    layout.tsx              # nav/footer globales + temas + fuentes
    globals.css             # tokens, temas, utilidades display
  components/
    home/                   # site-nav, theme-toggle, hero, relato, metodo,
                            # entregables, destacadas, segmentos, herramientas,
                            # respuestas, zonas, compromisos, evaluar, site-footer
    sections/               # interior-page, diagnostic-cta, contact-form,
                            # section-heading (solo rutas interiores)
    property/               # property-card, galería, detalle
    magicui/                # primitivos de motion copiados
    ui/                     # shadcn/ui
  data/
    site.ts                 # nav, servicios, featuredProperties, contacto placeholder
    propiedades.ts          # inventario DEMO (flag demo → noindex)
    motion-config.ts        # MOTION_MODE (espectacular | equilibrado)
  lib/
```

## Datos

Todo el contenido vive en `src/data/*.ts` como placeholder tipado. Migración a Supabase (leads primero, luego inventario/copy para el panel admin) planeada en `tasks.md` M3–M4.

## Animación

- Home: GSAP según `motion-v4-plan.md`. Solo `transform`/`opacity`; `useReducedMotion`/`gsap.matchMedia` → estático; mobile recibe la variante ligera.
- El Método es SIEMPRE vertical (el pinned horizontal se probó y se descartó; no reintroducir scroll-hijack ahí).
- `MOTION_MODE` en `motion-config.ts` permite pivotar a un modo tranquilo con una constante.

## SEO

- `metadata` global + por ruta; H1 único; alt text útil; Open Graph; `robots.ts` y `sitemap.ts`.
- Inventario demo con `robots: noindex` hasta cargar datos reales.

## Verificación

- `npm run lint` y `npm run build` limpios.
- Playwright: screenshots desktop y mobile, ambos temas, y scroll down→up→down para confirmar re-animación (ver `motion-v4-plan.md` § Verificación).
