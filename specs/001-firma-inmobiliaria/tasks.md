# Tasks / Roadmap — Sitio Cota

Estado al 7-jul-2026. Única vista de hitos del proyecto (el antiguo `ROADMAP.md` se fusionó aquí).
Principio de trabajo: **todo placeholder**; el cliente carga datos/archivos reales al entregar.

## Completado (jun–jul 2026)

- [x] Fundación: Next.js + TS + Tailwind v4, shadcn/ui, Motion, Magic UI.
- [x] Rediseño "Cota": Home narrativo para propietarios, doble tema, tokens Forest, Archivo condensada + IBM Plex Mono, copy con metodología (`Copywritting.md`), 6 entregables reales.
- [x] Frontend consolidado: interiores con sistema Cota, nav/footer globales, slugs `/vender-propiedad` y `/comprar-propiedad`, imágenes WebP, favicon + OG, `/terminos`.
- [x] Inventario y detalle: modelo Property (precio unión discriminada, flag `demo`), explorador con filtros operación+tipo, detalle con galería Fotos/Video/360, ficha, amenidades, mapa por zona, calculadora de hipoteca, asesor, FAQ, form de interés, JSON-LD `RealEstateListing` con noindex demo.
- [x] Home v2: secciones Destacadas, Herramientas (+ `/herramientas`, `/herramientas/hipoteca`, `/herramientas/gastos-de-cierre`), Segmentos, Compromisos; primer pase de motion (Motion + MagicUI); `MOTION_MODE` para pivote rápido. El Método horizontal pinned se probó y **se descartó**: el Método es siempre vertical.
- [x] Repo GitHub `M01535NT/Cota` (privado).

## M1.5 — Motion v4 con GSAP (completado 7-jul-2026)

Plan ejecutado: **`motion-v4-plan.md`** sobre GSAP (ScrollTrigger + SplitText).

- [x] M1.5.1 `gsap` + `@gsap/react` instalados; primitivos en `src/components/gsap/` (split-heading, reveal, velocity-marquee, scrub) + registro único en `src/lib/gsap.ts`.
- [x] M1.5.2 Hero: cascada por letra con SplitText (entrada única).
- [x] M1.5.3 Coreografía por sección de "Papeles, no promesas" al footer cortina, repetible al re-scrollear: watermark EXPEDIENTE, grid que respira, columnas contra-rotantes, acordeón real, flip 3D, marquee por velocidad, filas que se iluminan, línea que se dibuja.
- [x] M1.5.4 Verificación Playwright: 7 profundidades en claro/oscuro, re-scroll, reduced motion estático, mobile 390 sin overflow, footer cortina, 0 pageerrors. Lint y build limpios.
- [x] Extra: hook `useReducedMotionSafe` (useSyncExternalStore) elimina errores de hidratación #418 bajo `prefers-reduced-motion`; `<a>` → `<Link>` en todo el sitio (lint 0 errores).

## M2 — Frontend restante

- [ ] M2.1 `/zonas` + `/zonas/[zona]` (hub SEO local + detalle).
- [ ] M2.2 Página de gracias post-formulario.
- [ ] M2.3 Filtros de inventario zona/precio/orden + sincronización a searchParams.
- [ ] M2.4 Mapa con dirección exacta en detalle (pendiente decisión de privacidad).
- [ ] M2.5 Lead magnet: checklist "¿está lista tu propiedad para venderse?" (PDF placeholder + captura).
- [ ] M2.6 Espacio para video institucional "cómo trabajamos".
- [ ] M2.7 Pulido responsive/a11y + presupuesto de performance (LCP/INP/CLS).

## M3 — Backend (pospuesto a propósito: primero frontend)

- [ ] M3.1 Leads a Supabase: `#evaluar`, ContactForm interiores, form de interés por propiedad (TODOs marcados en código). **No lanzar pauta antes de esto.**
- [ ] M3.2 Notificación de nuevos leads (correo/WhatsApp).
- [ ] M3.3 Página de gracias conectada al envío real.

## M4 — Panel de administración

- [ ] M4.1 Control total del sitio (alcance en `sitemap.md` § Panel De Administración): inventario, imágenes, leads, asesores, configuración y copy editable. Implica migrar `src/data/*.ts` a Supabase.

## M5 — Lanzamiento

- [ ] M5.1 Nombre comercial definitivo, dominio y contacto reales.
- [ ] M5.2 Multimedia real (fotos/video/360/retratos).
- [ ] M5.3 Quitar flag `demo` + `noindex` del inventario.
- [ ] M5.4 JSON-LD `RealEstateAgent` global; revisar sitemap/robots; SEO on.
- [ ] M5.5 Legales validados (privacidad, términos).
- [ ] M5.6 Deploy Vercel + dominio + analítica.
