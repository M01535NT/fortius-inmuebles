# Napkin — Inmobiliaria (Cota)

## Principio de trabajo (directriz del usuario, 6-jul-2026)

**Todo es placeholder. No bloquear features por falta de datos o archivos reales.** El sitio se entrega al cliente y ÉL carga lo real (fotos, videos, 360, asesores, contacto, precios). Construir la estructura completa con espacios reservados etiquetados y campos opcionales listos para recibir las URLs/datos reales. Nunca responder "no se puede hasta tener el asset real".

## Decisiones vigentes (leer antes de tocar nada)

1. Marca provisional **Cota**; el nombre, dominio y contacto reales están pendientes. No inventar datos de contacto ni credenciales.
2. Fuentes de verdad: `Copywritting.md` (copy del Home), `DesignDirection.md` (sistema visual), `sitemap.md` § Estado Actual (rutas). Si editas copy o diseño, actualiza el doc correspondiente.
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
- Backend pospuesto a propósito (primero frontend). Formularios con `TODO` para Supabase; el panel admin futuro debe controlar TODO (inventario, imágenes, leads, asesores, config, copy) → ver `sitemap.md`.
- Inventario: datos DEMO en `src/data/propiedades.ts` (flag `demo: true`; el detalle lleva `robots: noindex` mientras dure — quitar ambos al cargar inventario real). Precio = unión discriminada publico/consulta; `formatPrecio` es manual a propósito (Intl currency causa mismatch de hidratación). Filtros sin `useSearchParams` aún (evita Suspense/CSR bailout). En Next 16 `params` es Promise: `await params` en page y generateMetadata.
- Detalle de propiedad: la galería usa altura vh compartida (`MEDIA_H` en property-gallery) para caber en el primer viewport — no volver a aspect-ratio grande. Aside sin sticky (contenido más alto que el viewport): asesor → calculadora → formulario. Mapa = Google embed por zona (`?q=...&output=embed`), sin API key. Contacto placeholder centralizado en `siteConfig.contact` (tel/wa/messenger/email). lucide-react ya NO trae iconos de marca (Facebook eliminado): usar MessagesSquare/MessageCircle como aproximación.

## Cómo verificar

- `npm run build` debe salir limpio.
- Visual: `npm run start -- -p 3311` + Playwright (instalado en scratchpad de sesión; browsers en `$LOCALAPPDATA/ms-playwright`). Revisar AMBOS temas y móvil. Tras rebuild, matar y relanzar el server (chunks 500 si no).

## Pendientes grandes (ver specs/001 tasks Phase 6)

- Interiores con sistema Cota · endpoint del form `#evaluar` · slugs definitivos (`/vender` vs `/vender-inmueble`) antes de indexar · favicon/OG · optimizar renders.
