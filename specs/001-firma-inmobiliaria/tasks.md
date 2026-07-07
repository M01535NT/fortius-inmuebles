# Tasks

## Phase 1 - Foundation

- [x] T001 Crear scaffold Next.js, TypeScript, Tailwind y scripts.
- [x] T002 Configurar shadcn/ui, tokens visuales y utilidades.
- [x] T003 Instalar y configurar Motion.dev, lucide-react y componentes Magic UI.

## Phase 2 - Content And Architecture

- [x] T004 Crear `src/data/site.ts` con navegacion, servicios, proceso, capacidades y propiedades mock.
- [x] T005 Crear layout global, metadata, navbar y footer.
- [x] T006 Crear rutas publicas MVP con metadata basica.

## Phase 3 - Home Vertical Slice

- [x] T007 Implementar Hero de captacion sin buscador.
- [x] T008 Implementar Areas de especialidad.
- [x] T009 Implementar MethodTimeline con scroll/motion.
- [x] T010 Implementar TrustSignals y seccion editorial.
- [x] T011 Implementar FeaturedProperties como muestra reducida.
- [x] T012 Implementar DiagnosticCTA y formulario.

## Phase 4 - Quality

- [x] T013 Validar responsive desktop/mobile.
- [x] T014 Ejecutar lint y build.
- [x] T015 Documentar archivos, decisiones y pendientes.

## Phase 5 - Redesign Home "Cota" (6-jul-2026)

Nota: las fases 2-3 corresponden a la era NEXO360; varios de esos componentes fueron eliminados en esta fase.

- [x] T016 Redisenar Home como pieza narrativa unica para propietarios (hero rotador, relato, manifiesto, metodo, entregables, respuestas, zonas, formulario).
- [x] T017 Sistema de doble tema claro/oscuro con toggle y tokens propios (paleta Forest, Archivo condensada + IBM Plex Mono via next/font).
- [x] T018 Copy nuevo con metodologia de copywriting (ver `Copywritting.md`); 6 entregables reales con codigos del manual operativo.
- [x] T019 Limpieza: componentes huerfanos de la era NEXO360, navbar/footer viejos, screenshots y prototipo `inicio.html` eliminados; `site.ts` depurado.

## Phase 6 - Frontend consolidado (6-jul-2026)

- [x] T020 Redisenar paginas interiores con el sistema Cota; navbar/footer ahora globales en layout (nav transparente solo sobre el hero del home).
- [x] T022 Slugs definitivos decididos y aplicados: `/vender-propiedad` y `/comprar-propiedad`.
- [x] T024 Imagenes convertidas a WebP (~95% mas ligeras); referencias actualizadas.
- [x] T025 Favicon `icon.svg` y `opengraph-image.png` con glifo Cota.
- [x] T026 Pagina `/terminos` creada (texto base provisional, requiere validacion legal).
- [x] T027 Fix: variables de fuente next/font ahora si montadas en `<html>` (antes renderizaba fuente de sistema).

## Phase 7 - Backend (pospuesto a proposito: primero frontend)

- [ ] T028 Persistir leads de `#evaluar` (home) y ContactForm (interiores) en Supabase; los TODO estan marcados en el codigo. No lanzar campanas de pago antes de esto.
- [ ] T029 Notificacion de nuevos leads (correo/WhatsApp).
- [ ] T030 Panel de administracion con control total (ver alcance completo en `sitemap.md` § Panel De Administracion): inventario, imagenes, leads, asesores, configuracion y copy editable. Implica migrar copy/inventario hardcodeado a base de datos.

## Phase 9 - Inventario y detalle de propiedad (6-jul-2026)

- [x] T035 Modelo de datos `src/data/propiedades.ts`: tipo Property (precio como union discriminada publico/consulta), 3 propiedades DEMO (flag `demo: true`), helpers (slug, relacionadas, destacadas, formatPrecio manual anti-hidratacion) y labels.
- [x] T036 `/inventario`: explorador client-side con filtros operacion+tipo (chips derivados de datos), contador mono, estado vacio con "limpiar filtros", CTA persistente mobile.
- [x] T037 `/inventario/[slug]`: generateStaticParams + metadata dinamica (noindex mientras demo), galeria con thumbnails, ficha tecnica con hairlines, amenidades, referencia de zona, formulario de interes con contexto de propiedad (aside sticky), relacionadas, CTA fija mobile, JSON-LD RealEstateListing (sin offers cuando es "a consulta"), 404 en slug inexistente.
- [x] T038 PropertyCard actualizado al tipo Property con badge de estado (apartada/vendida).

Detalle ampliado (principio: todo placeholder, el cliente carga lo real):

- [x] T039 Galeria unificada Fotos/Video/Recorrido 360 con un boton por modo; sin URL muestra espacio reservado, con `videoUrl`/`tour360Url` activa reproductor/iframe.
- [x] T040 Perfil del asesor en el detalle: `src/data/asesores.ts` (2 asesores DEMO, avatar de iniciales, sin fotos de personas) + card en el aside.
- [x] T041 FAQ del detalle de propiedad (acordeon, respuestas honestas).
- [x] T042 Calculadora de hipoteca: solo venta con precio publico y `creditoDisponible`; enganche/plazo/tasa editables, formula de amortizacion estandar, disclaimer de estimacion informativa.
- [x] T045 Acceso a inventario desde el sitio: link "Propiedades" en navbar y footer.
- [x] T044 Mapa siempre visible en el detalle (embed de Google Maps por zona; se afina a direccion exacta cuando el cliente la cargue) + puntos de interes cercanos con tiempos aproximados (placeholder).
- [x] T046 Detalle refinado (feedback 6-jul): cabecera compacta y galeria con altura vh para caber en el primer viewport; calculadora movida al aside (asesor > calculadora > formulario); perfil completo del asesor bajo el mapa ("Atencion directa, sin intermediarios") con tiles de contacto placeholder.
- [x] T047 ContactDock: dock flotante de contacto rapido (llamar, WhatsApp, Messenger, correo, "Me interesa") que aparece al hacer scroll; solo desktop (mobile conserva su barra fija). Contacto placeholder en siteConfig (T031).
- [ ] T043 Filtros de zona/precio/orden + sincronizacion a searchParams cuando el inventario crezca.

## Phase 8 - Pendiente general

- [ ] T031 Nombre comercial definitivo, dominio y contacto real (footer dice "por confirmar").
- [ ] T032 Rutas `/zonas`, `/zonas/[zona]` y pagina de gracias post-formulario.
- [ ] T033 Fotografia real de inventario para reemplazar renders.
- [ ] T034 JSON-LD RealEstateAgent cuando existan nombre y contacto reales.
