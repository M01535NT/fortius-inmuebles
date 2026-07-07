# Napkin — Inmobiliaria (Cota)

## Principio de trabajo (directriz del usuario, 6-jul-2026)

**Todo es placeholder. No bloquear features por falta de datos o archivos reales.** El sitio se entrega al cliente y ÉL carga lo real (fotos, videos, 360, asesores, contacto, precios). Construir la estructura completa con espacios reservados etiquetados y campos opcionales listos para recibir las URLs/datos reales. Nunca responder "no se puede hasta tener el asset real".

## Decisiones vigentes (leer antes de tocar nada)

1. Marca provisional **Cota**; el nombre, dominio y contacto reales están pendientes. No inventar datos de contacto ni credenciales.
2. Fuentes de verdad (todas en `specs/001-firma-inmobiliaria/`): `Copywritting.md` (copy del Home), `DesignDirection.md` (sistema visual), `sitemap.md` (rutas), `tasks.md` (hitos; el ROADMAP se fusionó ahí). Si editas copy o diseño, actualiza el doc correspondiente.
3. El Home es UNA pieza narrativa para propietarios. No convertirlo en secciones-plantilla ni agregar buscador de propiedades.
4. Doble tema: claro default, `.dark` por clase + `localStorage("cota-theme")` con script anti-flash en `layout.tsx`. No usar `prefers-color-scheme` como fuente.
5. Un solo bloque de color por página (manifiesto verde). No agregar más inversiones de tema.
6. Guardrails de copy: nada de cifras/testimonios/credenciales no verificados, nada de "garantizado", sin guiones largos (—) en copy visible, solo documentos y prácticas reales (la "Matriz de Ofertas" se eliminó por no usarse en la práctica; reportes son cada 30 días, no quincenales).

## Arquitectura rápida

- Nav y footer son GLOBALES en `layout.tsx` (`components/home/site-nav`, `site-footer`). El nav es transparente-claro solo en `/` sin scroll; en interiores siempre sólido (lógica con `usePathname`).
- Home: `src/components/home/*` compuesto por `src/app/page.tsx`.
- Interiores: `components/sections/{interior-page,diagnostic-cta,contact-form,section-heading}` + `property/property-card`, ya alineados al sistema Cota. Datos en `data/site.ts` (featuredProperties, routePages).
- Slugs definitivos: `/vender-propiedad`, `/comprar-propiedad` (decisión 6-jul-2026; no volver a `-inmueble`).
- Display type: clases `.display-title` (wdth 68) y `.display-soft` (wdth 82) en `globals.css`; fuentes vía `next/font` con variables montadas en `<html>` (si el condensado no se ve, revisar eso primero).
- Imágenes hero: `public/hero/*.webp` (~100KB c/u); originales PNG en `Imagenes hero/`.
- Backend pospuesto a propósito (primero frontend). **Panel admin YA construido en `/admin`** (7-jul-2026): opera sobre `src/lib/admin/store.ts` (localStorage con seeds de src/data/*, cache + useSyncExternalStore vía useCollection/useSingleton). Los 5 formularios públicos capturan leads ahí (`captureLead`). IMPORTANTE: el sitio público se prerenderiza desde `src/data/*` — los cambios del panel NO alteran las páginas públicas hasta conectar Supabase (M4.3: mismo contrato de repositorios, swap del módulo). Login demo `cota2026` (placeholder visible a propósito); robots disallow /admin; nav/footer públicos se ocultan en /admin vía usePathname.
- Documentos PDF por propiedad: campo `documentos` en Property + sección "Documentos de la propiedad" en el detalle público (gate nombre+teléfono → lead origen "documentos" con propiedadSlug); se administran en el form de Inmuebles del panel.
- Inventario: datos DEMO en `src/data/propiedades.ts` (flag `demo: true`; el detalle lleva `robots: noindex` mientras dure — quitar ambos al cargar inventario real). Precio = unión discriminada publico/consulta; `formatPrecio` es manual a propósito (Intl currency causa mismatch de hidratación). Filtros (operación/tipo/zona/precio/orden) SIN `useSearchParams` (evita Suspense/CSR bailout): init desde `window.location.search` post-montaje + `history.replaceState`. En Next 16 `params` es Promise: `await params` en page y generateMetadata.
- Zonas: contenido editorial en `src/data/zonas.ts` (11 zonas; `nombre` debe coincidir con `zona` de propiedades.ts para cruzar inventario). Guardrail: nada de cifras de plusvalía/precios promedio inventados.
- Conversión: `#evaluar` redirige a `/vender-propiedad/gracias` (noindex); lead magnet CHK-VEN-001 en `/vender-propiedad` (PDF en `public/descargas/`); video institucional se activa llenando `siteConfig.media.videoInstitucionalUrl`. Los tres llevan TODO(M3.1) para persistir leads antes de cualquier pauta.
- **Motion v4 GSAP EJECUTADO (7-jul-2026):** el Home se anima con GSAP (ScrollTrigger + SplitText). Primitivos en `src/components/gsap/` (split-heading, reveal, velocity-marquee, scrub); importar gsap SIEMPRE desde `src/lib/gsap.ts`. Repetible = `toggleActions: "restart none none reverse"` (hero y campos del form son `once`). Motion (motion-react) solo permanece en primitivos existentes e interiores — no introducir Motion nuevo en el Home.
- Gotchas de hidratación/overflow: (1) si `prefers-reduced-motion` cambia el markup, usar `useReducedMotionSafe` de `src/lib/use-reduced-motion-safe.ts` (useSyncExternalStore), NUNCA `useReducedMotion` de motion/react → React #418; (2) body lleva `overflow-x: clip` (no `hidden`, rompe el sticky del footer cortina); (3) secciones con Reveal lateral necesitan `overflow-x-clip` propio o generan scrollWidth extra en mobile.
- Motion: `MOTION_MODE` en `src/data/motion-config.ts` (espectacular|equilibrado) pivota parallax del hero, CTA magnético y TextReveal/BlurFade del relato. **El Método horizontal pinned se probó y SE DESCARTÓ (7-jul-2026, feedback usuario): el Método es siempre vertical; no reintroducir scroll-hijack ahí.** Primitivos disponibles en magicui/: kinetic-title, tilt-card, parallax-image, magic-card, text-reveal, border-beam, number-ticker, blur-fade, marquee. Gotcha real: animar `clipPath` en un wrapper de sección con whileInView/useInView NO dispara en este setup; usar BlurFade con yOffset/blur altos para reveals de bloque.
- Detalle de propiedad: la galería usa altura vh compartida (`MEDIA_H` en property-gallery) para caber en el primer viewport — no volver a aspect-ratio grande. Aside sin sticky (contenido más alto que el viewport): asesor → calculadora → formulario. Mapa = Google embed por zona (`?q=...&output=embed`), sin API key. Contacto placeholder centralizado en `siteConfig.contact` (tel/wa/messenger/email). lucide-react ya NO trae iconos de marca (Facebook eliminado): usar MessagesSquare/MessageCircle como aproximación.

## Cómo verificar

- `npm run build` debe salir limpio.
- Visual: `npm run start -- -p 3311` + Playwright (instalado en scratchpad de sesión; browsers en `$LOCALAPPDATA/ms-playwright`). Revisar AMBOS temas y móvil. Tras rebuild, matar y relanzar el server (chunks 500 si no).

## Pendientes grandes (ver specs/001-firma-inmobiliaria/tasks.md)

- M2 frontend restante (/zonas, gracias, filtros, lead magnet, video institucional, pulido a11y/perf) · M3 leads a Supabase antes de cualquier pauta · M4 panel admin · M5 lanzamiento (datos reales, quitar demo/noindex).
