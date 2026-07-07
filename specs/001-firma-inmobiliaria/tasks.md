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

## M2 — Frontend restante (completado 7-jul-2026, salvo M2.4)

- [x] M2.1 `/zonas` (hub con 11 zonas) + `/zonas/[zona]`: editorial por zona en `src/data/zonas.ts` (sin cifras inventadas), perfil, inventario real de la zona o vacío honesto, FAQ local, mapa embed y CTAs. En sitemap.ts, menú, footer y banda de zonas del Home.
- [x] M2.2 `/vender-propiedad/gracias` (noindex): pasos siguientes, WhatsApp placeholder y enlaces "mientras tanto". El form `#evaluar` redirige ahí (TODO M3.1: POST real antes de redirigir).
- [x] M2.3 Filtros de inventario: zona + precio min/max (excluye "a consulta" al filtrar) + orden (recientes/precio) con URL compartible vía `history.replaceState` (sin `useSearchParams`, evita el CSR bailout).
- [ ] M2.4 Mapa con dirección exacta en detalle — **pendiente decisión de privacidad del usuario** (hoy: mapa por zona).
- [x] M2.5 Lead magnet CHK-VEN-001: PDF placeholder real en `public/descargas/checklist-venta-cota.pdf` (generado, con marca y disclaimers) + captura nombre/WhatsApp en `/vender-propiedad` que libera la descarga (TODO M3.1: persistir lead).
- [x] M2.6 Espacio de video institucional VID-INS-001 en `/nosotros`: placeholder con poster; `siteConfig.media.videoInstitucionalUrl` activa el reproductor al cargar el archivo real.
- [x] M2.7 Verificación responsive/a11y de todo lo nuevo (labels, aria-pressed, aria-live, breadcrumb; sin overflow mobile; 0 pageerrors; lint y build limpios). Auditoría formal de LCP/INP/CLS diferida a M5, cuando exista multimedia real.

## M3 — Backend (pospuesto a propósito: primero frontend)

- [ ] M3.1 Leads a Supabase: `#evaluar`, ContactForm interiores, form de interés por propiedad (TODOs marcados en código). **No lanzar pauta antes de esto.**
- [ ] M3.2 Notificación de nuevos leads (correo/WhatsApp).
- [ ] M3.3 Página de gracias conectada al envío real.

## M4 — Panel de administración

- [x] M4.1 **Frontend completo del panel** (7-jul-2026) en `/admin`: dashboard con KPIs, Inmuebles (CRUD completo: precio, ficha, galería, video/360, POIs, **documentos PDF por inmueble**, destacada/estado inline), Leads (bandeja con pipeline de 6 estados, búsqueda, captura manual, expediente con notas y agenda vinculada), Calendario mensual, Notas, Blog (redacción de entradas), Asesores (CRUD con contadores de asignación), Archivos (catálogo por URL), Contenido (copy editable del Home + SEO) y Configuración (identidad/contacto/redes/video). Login placeholder (clave demo visible) y robots disallow `/admin`.
- [x] M4.2 Los 5 formularios públicos capturan leads en la capa local del panel (`captureLead`): evaluación, contacto, interés, checklist y **descargas de documentos por propiedad** (nueva sección en el detalle público, gate de nombre+teléfono).
- [ ] M4.3 **Conectar a Supabase** (el verdadero M3/M4 backend): sustituir `src/lib/admin/store.ts` (localStorage) por repositorios Supabase manteniendo la interfaz; Supabase Auth en lugar del login demo; storage para carga real de imágenes/PDFs; el sitio público lee de la BD (los cambios del panel hoy NO alteran las páginas públicas prerenderizadas).
- [ ] M4.4 Rutas públicas `/blog` y `/blog/[slug]` cuando el contenido viva en la BD.

## M5 — Lanzamiento

- [ ] M5.1 Nombre comercial definitivo, dominio y contacto reales.
- [ ] M5.2 Multimedia real (fotos/video/360/retratos).
- [ ] M5.3 Quitar flag `demo` + `noindex` del inventario.
- [ ] M5.4 JSON-LD `RealEstateAgent` global; revisar sitemap/robots; SEO on.
- [ ] M5.5 Legales validados (privacidad, términos).
- [ ] M5.6 Deploy Vercel + dominio + analítica.
