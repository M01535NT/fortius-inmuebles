# ROADMAP — Sitio Cota

Estado al 7-jul-2026. Detalle de tareas en `specs/001-firma-inmobiliaria/tasks.md`.
Principio de trabajo: **todo placeholder**; el cliente carga datos/archivos reales al entregar.

## M1 — Home v2 y motion (en curso)

La fase actual: el Home pasa de correcto a memorable.

- Secciones nuevas: Propiedades destacadas, Herramientas, Segmentos (residencial/comercial/industrial), Compromisos.
- Páginas de herramientas: `/herramientas` (hub), `/herramientas/hipoteca`, `/herramientas/gastos-de-cierre`.
- Pase de motion "Espectacular" con MagicUI + Motion: hero kinetic + parallax, texto que se ilumina al scroll (relato), Método con scroll horizontal pinned, spotlight en entregables, BorderBeam en el formulario, NumberTicker en calculadoras.
- Pivote rápido a modo "Premium Equilibrado" vía `MOTION_MODE` (ver `DesignDirection.md` § Modos de motion).

## M2 — Frontend restante

- `/zonas` y `/zonas/[zona]` (hub SEO local + detalle por zona).
- Página de gracias post-formulario (`/vender-propiedad/gracias` o genérica).
- Filtros de inventario: zona, precio, orden + sincronización a searchParams.
- Mapa con dirección exacta en detalle (pendiente decisión de privacidad).
- Lead magnet: "Checklist: ¿está lista tu propiedad para venderse?" (PDF placeholder + captura).
- Espacio para video institucional "cómo trabajamos" (placeholder tipo galería).
- Pulido responsive/a11y final y presupuesto de performance (LCP/INP/CLS).

## M3 — Backend (pospuesto a propósito: primero frontend)

- Persistir leads en Supabase: formulario `#evaluar`, ContactForm interiores, formulario de interés por propiedad (los TODO están marcados en el código).
- Notificación de nuevos leads (correo/WhatsApp).
- Página de gracias conectada al envío real.
- No lanzar campañas de pago antes de esto.

## M4 — Panel de administración

Control total del sitio (alcance completo en `sitemap.md` § Panel De Administración):
inventario, imágenes, leads, asesores, configuración y copy editable.
Implica migrar `src/data/*.ts` (propiedades, asesores, copy) a base de datos.

## M5 — Lanzamiento

- Nombre comercial definitivo (Cota es provisional), dominio y contacto real.
- Fotografía/video/360 reales del inventario; retratos del equipo.
- Quitar flag `demo` y `robots: noindex` del inventario.
- JSON-LD `RealEstateAgent` global; revisar sitemap/robots; SEO on.
- Textos legales validados (privacidad, términos).
- Deploy en Vercel + dominio + analítica.
