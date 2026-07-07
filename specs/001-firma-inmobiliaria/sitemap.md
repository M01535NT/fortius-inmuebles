# Sitemap — Sitio Cota

Fuente de verdad de rutas. Estado al 7-jul-2026. Historial de hitos en `tasks.md`.

## Rutas Implementadas

Todas con navbar/footer globales y el design system Cota (doble tema):

- `/` — Home narrativo enfocado en propietarios (sin buscador). Copy en `Copywritting.md`; visual en `DesignDirection.md`. Animación: GSAP (ver `motion-v4-plan.md`).
- `/vender-propiedad` y `/comprar-propiedad` — slugs **definitivos** (renombrados desde `-inmueble` el 6-jul-2026, antes de indexar).
- `/residencial`, `/comercial`, `/industrial`, `/due-diligence-inmobiliaria`, `/nosotros`, `/contacto` — interiores con InteriorPage/DiagnosticCTA/ContactForm.
- `/inventario` — explorador con filtros client-side (operación + tipo), contador, estado vacío y CTA persistente en mobile. Datos DEMO en `src/data/propiedades.ts`.
- `/inventario/[slug]` — detalle: galería unificada Fotos/Video/360, ficha técnica, amenidades, mapa por zona, perfil del asesor, calculadora de hipoteca, FAQ, formulario de interés, relacionadas, CTA fija mobile, JSON-LD `RealEstateListing`. **Mientras los datos sean demo lleva `robots: noindex`.**
- `/herramientas`, `/herramientas/hipoteca`, `/herramientas/gastos-de-cierre` — calculadoras públicas con disclaimers.
- `/privacidad` y `/terminos` — texto base provisional; requieren validación legal antes de producción.
- Técnicas: `/sitemap.xml`, `/robots.txt`, favicon (`icon.svg`), OG image.

Navegación principal actual: Propiedades (`/inventario`) · Método (`/#metodo`) · Entregables (`/#entregables`) · Herramientas · CTA "Evaluar mi propiedad" (`/#evaluar`).

Formularios (`#evaluar` en Home, ContactForm en interiores, interés por propiedad) confirman localmente con `TODO` para conectar backend (Supabase, hito M3). **No lanzar campañas de pago hasta que los leads se persistan.**

## Rutas Pendientes (hito M2)

### `/zonas` — Hub SEO local

Listado de zonas principales, breve descripción por zona, enlaces a propiedades por zona, CTA de asesoría.

### `/zonas/[zona]` — Detalle de zona

Descripción, propiedades destacadas de la zona, tipos disponibles, FAQ local, CTA para comprar/rentar/vender en esa zona.

### `/vender-propiedad/gracias` — Confirmación post-formulario

Mensaje de recepción, expectativa de siguiente paso, CTA secundario a WhatsApp.

## Panel De Administración (hito M4, alcance deseado)

Requisito del propietario del proyecto: controlar **absolutamente todo** el sitio:

- **Inventario**: alta/edición/baja de propiedades, estados (disponible, apartada, vendida), destacados.
- **Imágenes**: carga, orden y optimización por propiedad y del sitio.
- **Leads**: bandeja de solicitudes, estado del lead, canal de origen, notas.
- **Asesores**: perfiles, asignación de leads/propiedades, visibilidad pública.
- **Configuración**: nombre comercial, contacto, horarios, redes, SEO global.
- **Copy**: edición del texto de secciones clave sin tocar código.

Implica migrar copy e inventario de `src/data/*.ts` a Supabase.

Rutas propuestas: `/admin/login`, `/admin` (dashboard: resumen de leads, propiedades recientes, acciones rápidas), `/admin/propiedades` (+ `/nueva`, `/[id]/editar`), `/admin/leads`, `/admin/zonas`, `/admin/asesores`, `/admin/configuracion`.

## Rutas Futuras (post-lanzamiento, no MVP)

- Guías: `/guias`, `/guias/{comprar,vender,rentar}` — solo si habrá contenido útil, local y real; evitar blog genérico.
- SEO programático por operación/tipo/zona: `/zonas/[zona]/{venta,renta}`, `/propiedades/{venta,renta}`, `/propiedades/[tipo]`, `/propiedades/[tipo]/[zona]` — activar solo con inventario suficiente para no crear páginas vacías.
- PWA (`/manifest.webmanifest`), perfiles públicos de asesores, integraciones CRM/MLS.

## Principios De Navegación

- Navegación corta y orientada a conversión; el Home es landing de captación, sin buscador.
- El inventario es accesible desde la navegación pero no domina el Home.
- La captación de propietarios tiene ruta propia, no solo un bloque en contacto.
- Las páginas SEO por zona crecen a partir de zonas reales.
- No publicar testimonios, cifras, premios o métricas sin datos reales.

## Decisiones Abiertas

- Privacidad de dirección exacta en el mapa del detalle (hoy: mapa por zona).
- Si habrá asesores visibles públicamente (hoy: perfil demo en detalle).
- Si existe oficina física para SEO local y Google Business Profile.
- Idioma: solo español o español/inglés.
- Fuente definitiva del inventario al migrar a Supabase (carga manual vs integración externa).
