# Spec — Cota, Firma Inmobiliaria (Tijuana y Baja California)

Última consolidación: 7-jul-2026. Fuentes de verdad complementarias: `Copywritting.md` (copy), `DesignDirection.md` (visual y motion), `sitemap.md` (rutas), `plan.md` (técnica), `tasks.md` (hitos y estado).

## Diagnóstico Estratégico

No se está construyendo una página de inmuebles. Se está construyendo una plataforma digital de posicionamiento para una firma inmobiliaria que comunica método, criterio profesional y capacidad de comercialización.

El Home no se comporta como portal de búsqueda: es **una sola narrativa para el propietario que va a vender**, de navbar a footer. Compradores, rentadores y clientes comerciales/industriales tienen rutas propias.

## Posicionamiento

> **Vende con plan, no con anuncios.**

Idea rectora: *No prometemos resultados. Documentamos el proceso.* El método (4 fases, un expediente; ver `Copywritting.md`) es la prueba; la certeza es el beneficio.

Marca provisional: **Cota** (nombre, dominio y contacto reales pendientes).

## Públicos

- **Principal:** propietarios que quieren vender o rentar sin improvisar precio, expediente ni promoción.
- **Secundario:** compradores e inversionistas; empresas con necesidades comerciales/industriales; personas que aún no saben si su inmueble está listo para salir al mercado.

## Objetivo Del Home

Provocar una acción principal: **solicitar la evaluación de la propiedad** (formulario `#evaluar`).

En pocos segundos el usuario debe entender que la firma trabaja con método documentado, que revisa precio, mercado, expediente y cierre, que opera en Tijuana, Tecate, Rosarito y Ensenada, y que el siguiente paso no es buscar propiedades sino pedir orientación.

## Objeciones Que Debe Resolver

- "No sé si mi propiedad está lista para venderse."
- "No quiero publicar sin saber el valor real."
- "No quiero perder tiempo con prospectos no calificados."
- "Me preocupa la documentación."
- "No quiero una inmobiliaria genérica."

## Requisitos Funcionales

- El Home muestra CTAs hacia la evaluación de propiedad (`#evaluar`).
- El formulario de evaluación captura nombre, teléfono/WhatsApp, zona y tipo de propiedad.
- La navegación incluye las rutas estratégicas del sitio (ver `sitemap.md`).
- El inventario existe como apoyo, nunca como protagonista del Home; sin buscador en el Home.
- Todos los datos de inventario, asesores y contacto son placeholders locales fáciles de reemplazar (principio: el cliente carga lo real al entregar).

## Requisitos No Funcionales

- Next.js App Router con TypeScript; Tailwind CSS; shadcn/ui; Magic UI copiado al proyecto.
- **GSAP (ScrollTrigger + SplitText) como motor de animación del Home** para animaciones fluidas, modernas e impresionantes; ver `motion-v4-plan.md`. Motion (motion-react) permanece en primitivos existentes e interiores hasta migrarlos.
- SEO técnico básico por página; responsive mobile-first.
- Accesibilidad: estructura semántica, labels, focus visible, alt text, `prefers-reduced-motion`.
- Sin testimonios, cifras ni credenciales no verificadas.

## Fuera De Alcance Inicial

Admin real · Supabase · CRM · Login · Pagos · Blog · Inventario dinámico en base de datos · Testimonios o métricas inventadas. (El backend está pospuesto a propósito: primero frontend; ver `tasks.md` M3–M4.)

## Criterios De Aceptación

- `/` carga una landing de captación sin buscador, percibida como sobria, premium y metódica en ambos temas (claro/oscuro).
- La navegación y el sitemap reflejan posicionamiento, no plantilla genérica.
- Las animaciones del Home se sienten coreografiadas y ligadas al scroll (GSAP), con fallback estático en reduced motion.
- Responsive sin overflow horizontal en mobile; metadata y estructura semántica definidas.

## Riesgos Y Pendientes

- Nombre comercial definitivo (Cota es provisional).
- Teléfono, WhatsApp y correo oficiales (placeholders hoy).
- Inventario, fotografía y credenciales reales (mientras no existan, no se mencionan ni se indexan: flag `demo` + `noindex`).
