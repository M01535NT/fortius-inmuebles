# Tasks

Vista por hitos en `ROADMAP.md` (raíz). IDs históricos entre paréntesis donde aplica.

## Completado (fases 1-9, jun-jul 2026)

- [x] Fundación: Next.js + TS + Tailwind v4, shadcn/ui, Motion, Magic UI (T001-T006).
- [x] Era NEXO360: home inicial y rutas MVP (T007-T015; varios componentes se eliminaron después).
- [x] Rediseño "Cota": Home narrativo para propietarios, doble tema claro/oscuro, tokens Forest, Archivo condensada + IBM Plex Mono, copy con metodología (ver `Copywritting.md`), 6 entregables reales (T016-T019).
- [x] Frontend consolidado: interiores con sistema Cota, nav/footer globales, slugs `/vender-propiedad` y `/comprar-propiedad`, imágenes WebP (-95%), favicon + OG, `/terminos`, fix de fuentes next/font (T020-T027).
- [x] Inventario y detalle: modelo Property (precio unión discriminada, flag `demo`), explorador con filtros operación+tipo, detalle con galería 16:9 Fotos/Video/360 (placeholders), ficha, amenidades, mapa por zona + puntos de interés, calculadora de hipoteca, perfil de asesor, FAQ, form de interés, dock de contacto al scroll, JSON-LD RealEstateListing con noindex demo (T035-T042, T044-T047).
- [x] Repo GitHub `M01535NT/Cota` (privado) con commit inicial.

## M1 - Home v2 y motion (completado 7-jul-2026)

- [x] M1.1 ROADMAP.md + tasks reorganizado.
- [x] M1.2 Sección Propiedades destacadas en Home (3 cards + CTA inventario).
- [x] M1.3 Sección Herramientas en Home + páginas `/herramientas`, `/herramientas/hipoteca` (calculadora con precio editable), `/herramientas/gastos-de-cierre` (estimador nuevo con rangos de `InvestigacionModeloNegocio.md`).
- [x] M1.4 Sección Segmentos (residencial/comercial/industrial con renders restantes, layout asimétrico).
- [x] M1.5 Banda Compromisos ("Lo que puedes esperar en cada operación").
- [x] M1.6 Primitivos MagicUI: text-reveal, magic-card, border-beam, number-ticker.
- [x] M1.7 Motion: hero kinetic + parallax, TextReveal en relato, KineticTitle en secciones, tilt 3D + spotlight en entregables, parallax en segmentos, zonas doble outline, BorderBeam en formulario, ticker en calculadoras, compromisos con hairlines. (Metodo horizontal pinned: probado y DESCARTADO por feedback; Metodo siempre vertical.)
- [x] M1.8 `MOTION_MODE` (espectacular|equilibrado) documentado para pivote rápido.
- [x] M1.9 Nav/footer con Herramientas; sitemap.ts actualizado.

## M2 - Frontend restante

- [ ] M2.1 `/zonas` + `/zonas/[zona]`.
- [ ] M2.2 Página de gracias post-formulario.
- [ ] M2.3 Filtros zona/precio/orden + searchParams (T043).
- [ ] M2.4 Mapa con dirección exacta (decisión de privacidad) (T044 parcial).
- [ ] M2.5 Lead magnet checklist (PDF placeholder + captura).
- [ ] M2.6 Espacio para video institucional.
- [ ] M2.7 Pulido responsive/a11y + presupuesto de performance.

## M3 - Backend (pospuesto a propósito)

- [ ] M3.1 Leads a Supabase: #evaluar, ContactForm, form de interés (T028). No lanzar pauta antes de esto.
- [ ] M3.2 Notificaciones de leads (T029).
- [ ] M3.3 Gracias conectada al envío real.

## M4 - Panel admin

- [ ] M4.1 Panel con control total: inventario, imágenes, leads, asesores, configuración, copy editable (T030; alcance en sitemap.md). Migrar `src/data/*` a Supabase.

## M5 - Lanzamiento

- [ ] M5.1 Nombre/dominio/contacto reales (T031).
- [ ] M5.2 Multimedia real (fotos/video/360/retratos) (T033).
- [ ] M5.3 Quitar `demo` + noindex del inventario.
- [ ] M5.4 JSON-LD RealEstateAgent (T034) + SEO on.
- [ ] M5.5 Legales validados.
- [ ] M5.6 Deploy Vercel + dominio + analítica.
