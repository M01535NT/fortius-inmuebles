# Sitemap Propuesto - Web Inmobiliaria

Estado: propuesta para revision y aprobacion.

## Estado Actual (6-jul-2026, actualizado)

Rutas implementadas hoy en `src/app/`, todas con navbar/footer globales y el design system Cota (doble tema):

- `/` — Home narrativo enfocado en propietarios. Ver `DesignDirection.md` y `Copywritting.md`.
- `/vender-propiedad` y `/comprar-propiedad` — **slugs definitivos decididos** (renombrados desde `-inmueble` el 6-jul-2026, antes de indexar).
- `/residencial`, `/comercial`, `/industrial`, `/due-diligence-inmobiliaria`, `/nosotros`, `/contacto` — interiores alineadas al sistema Cota (InteriorPage/DiagnosticCTA/ContactForm rediseñados).
- `/inventario` — explorador con filtros client-side (operación + tipo), contador, estado vacío y CTA persistente en mobile. Datos en `src/data/propiedades.ts` (3 propiedades DEMO).
- `/inventario/[slug]` — detalle completo: galería unificada **Fotos/Video/360** (un botón por modo; espacios reservados hasta que el cliente cargue video/tour), ficha técnica, amenidades, referencia de zona, **perfil del asesor** (demo, avatar de iniciales), **calculadora de hipoteca** (solo venta con precio público; estimación con disclaimer), **FAQ**, formulario de interés (aside sticky), relacionadas, CTA fija mobile y JSON-LD `RealEstateListing`. **Mientras los datos sean demo lleva `robots: noindex`**. Pendiente: mapa (privacidad de dirección) y filtros zona/precio/orden.
- `/herramientas`, `/herramientas/hipoteca`, `/herramientas/gastos-de-cierre` — calculadoras públicas (hipoteca con precio editable; gastos de cierre con rangos de referencia de la investigación y disclaimers). En nav y footer.
- Home v2 (7-jul-2026): secciones nuevas Destacadas, Segmentos, Herramientas y Compromisos + pase de motion "Espectacular" (Método horizontal pinned en desktop, hero kinetic con parallax, TextReveal, spotlight, BorderBeam, NumberTicker). Pivote a modo "equilibrado" con una constante (`src/data/motion-config.ts`).
- `/privacidad` y `/terminos` — legales con texto base provisional; requieren validación del responsable legal antes de producción.
- Favicon (`src/app/icon.svg`) y OG image (`src/app/opengraph-image.png`) con el glifo Cota.
- Imágenes en `public/hero/*.webp` (convertidas de PNG, ~95% más ligeras).

Pendiente contra esta propuesta:

- `/zonas`, `/zonas/[zona]` y `/vender-propiedad/gracias` no existen aún.
- **Backend: pospuesto a propósito.** Primero frontend. Los formularios (`#evaluar` en Home y ContactForm en interiores) confirman localmente y tienen `TODO` en el código para conectar endpoint (plan original: Supabase). No indexar campañas de pago hasta que los leads se persistan.
- El flujo comprador/rentador sigue siendo secundario al de propietario.

## Panel De Administración (fase futura, alcance deseado)

Requisito del propietario del proyecto: un panel donde se controle **absolutamente todo** el sitio:

- **Inventario**: alta/edición/baja de propiedades, estados (disponible, apartada, vendida), destacados.
- **Imágenes**: carga, orden y optimización de fotos por propiedad y del sitio.
- **Leads**: bandeja de solicitudes (evaluación, contacto), estado del lead, canal de origen, notas.
- **Asesores**: perfiles, asignación de leads/propiedades, visibilidad pública.
- **Configuración**: nombre comercial, contacto (WhatsApp/tel/correo), horarios, redes, SEO global.
- **Copy**: edición del texto de secciones clave del sitio sin tocar código.

Implicación técnica: el copy y el inventario deberán migrar de datos hardcodeados a base de datos (Supabase) cuando inicie esta fase. Las rutas `/admin/*` propuestas más abajo siguen vigentes como referencia.

## Objetivo Del Sitio

Crear una web inmobiliaria orientada a captacion de leads. La pagina de inicio funcionara como landing page principal, con foco en visitantes que quieren comprar, rentar, vender o publicar una propiedad.

## Stack Aprobado / Base Tecnica

- Next.js + TypeScript.
- Tailwind CSS.
- Supabase para base de datos, autenticacion, storage y panel interno.
- Vercel para despliegue.
- Magic UI real como libreria de componentes visuales para landing, efectos y bloques de marketing.
- Motion.dev como capa imprescindible de animacion, transiciones, microinteracciones y movimiento basado en scroll.

## Principios De Navegacion

- La navegacion principal debe ser corta y orientada a conversion.
- La pagina Inicio no debe tener buscador de propiedades; debe funcionar como landing de captacion.
- El inventario debe ser accesible desde la navegacion, pero no dominar la pagina Inicio.
- La captacion de propietarios debe tener una ruta propia, no solo un bloque dentro de contacto.
- Las paginas SEO por zona deben crecer a partir de zonas reales.
- No se deben publicar testimonios, cifras, premios o metricas si no existen datos reales.

## Navegacion Principal

- `/` - Inicio
- `/inventario` - Propiedades
- `/vender` - Vende o renta tu propiedad
- `/zonas` - Zonas
- `/nosotros` - Nosotros
- `/contacto` - Contacto

## Sitemap Publico MVP

### `/` - Inicio

Rol: landing page principal de captacion.

Secciones recomendadas:

- Hero minimalista con propuesta clara y CTA de captacion.
- Formulario breve para propietarios o interesados.
- Bloque de criterio: precio, documentacion y cierre.
- Beneficios esenciales de trabajar con la inmobiliaria.
- Proceso resumido, sin saturar de pasos.
- Prueba social solo si existen testimonios o datos reales.
- FAQ corta.
- CTA final con WhatsApp, llamada y formulario.

Uso recomendado de Magic UI:

- `Blur Fade` para entrada de secciones.
- `Bento Grid` para beneficios o proceso.
- `Shimmer Button` o `Border Beam` en CTAs principales.
- `Magic Card` solo para bloques de confianza o beneficios esenciales.
- `Number Ticker` solo si existen metricas reales.
- `Marquee` solo si hay logos, zonas o elementos verificables.

Uso recomendado de Motion.dev:

- Transiciones de entrada por seccion.
- Microinteracciones en cards, CTAs y filtros.
- Animacion suave en hero y formulario de captacion.
- Scroll progress o movimiento sutil si no afecta performance.
- Respeto obligatorio de reduced motion.

### `/inventario` - Propiedades

Rol: listado principal de propiedades.

Debe incluir:

- Filtros por operacion: venta, renta.
- Filtros por tipo: casa, departamento, terreno, local, oficina u otros definidos.
- Filtro por zona.
- Filtro por precio.
- Filtro por recamaras/banos/estacionamientos si aplica.
- Ordenamiento: recientes, menor precio, mayor precio.
- Estado vacio cuando no haya resultados.
- CTA persistente para contacto en mobile.

### `/inventario/[slug]` - Detalle De Propiedad

Rol: pagina individual para convertir interes en contacto.

Debe incluir:

- Carrousel de imagenes/video/recorrido 360. Los 3 en el mismo componente y accesibles con un botoón para cada uno.
- Precio y operacion.
- Ubicacion o zona.
- Amenidades.
- Descripcion.
- Ficha tecnica. Con la mayor cantidad de información posible.
- Mapa o referencia de zona si esta permitido.
- Perfil del asesor
- Preguntas frecuentes
- Calculadora de hipoteca (solo si pasa crédito la propiedad)
- Propiedades relacionadas.
- CTA fijo en mobile: WhatsApp, llamar, agendar visita.
- Datos estructurados tipo `RealEstateListing`.

### `/vender` - Vende O Renta Tu Propiedad

Rol: captacion de propietarios.

Debe incluir:

- Hero orientado a propietarios.
- Formulario corto: nombre, telefono, tipo de propiedad, zona, objetivo.
- Proceso de trabajo.
- Beneficios concretos.
- Preguntas frecuentes.
- CTA por WhatsApp y llamada.

### `/vender/gracias` - Confirmacion

Rol: confirmacion posterior al formulario de propietarios.

Debe incluir:

- Mensaje de recepcion.
- Expectativa de siguiente paso.
- CTA secundario a WhatsApp.

### `/zonas` - Zonas

Rol: hub SEO y exploracion por ubicacion.

Debe incluir:

- Listado de zonas principales.
- Breve descripcion por zona.
- Enlaces a propiedades por zona.
- CTA para recibir asesoria.

### `/zonas/[zona]` - Detalle De Zona

Rol: pagina SEO local para una zona especifica.

Debe incluir:

- Descripcion de la zona.
- Propiedades destacadas en la zona.
- Tipos de propiedades disponibles.
- Preguntas frecuentes de la zona.
- CTA para comprar, rentar o vender en esa zona.

### `/nosotros` - Nosotros

Rol: confianza institucional.

Debe incluir:

- Historia o posicionamiento de la inmobiliaria.
- Equipo o asesores si existe informacion real.
- Credenciales, certificaciones o asociaciones si existen.
- Metodo de trabajo.
- CTA a contacto.

### `/contacto` - Contacto

Rol: contacto directo y cierre.

Debe incluir:

- Formulario corto.
- WhatsApp.
- Telefono.
- Correo.
- Ubicacion/oficina si existe.
- Horario.
- Mapa si aplica.

### `/privacidad` - Aviso De Privacidad

Rol: cumplimiento basico para formularios y tratamiento de datos.

### `/terminos` - Terminos

Rol: terminos generales del sitio, uso de informacion y avisos sobre disponibilidad de propiedades.

## Sitemap Publico Futuro

Estas rutas no son imprescindibles para el MVP, pero conviene dejarlas previstas.

### Guias

- `/guias`
- `/guias/comprar`
- `/guias/vender`
- `/guias/rentar`

Uso recomendado:

- Publicarlas solo si habra contenido util, local y real.
- Evitar blog generico sin estrategia.

### Paginas SEO Por Operacion Y Zona

- `/zonas/[zona]/venta`
- `/zonas/[zona]/renta`
- `/propiedades/venta`
- `/propiedades/renta`
- `/propiedades/[tipo]`
- `/propiedades/[tipo]/[zona]`

Uso recomendado:

- Activarlas cuando exista inventario suficiente para no crear paginas vacias.
- Generar metadata, copy y schema por combinacion.

## Sitemap Admin No Publico

### `/admin/login`

Rol: acceso al panel.

### `/admin`

Rol: dashboard interno.

Debe incluir:

- Resumen de leads.
- Propiedades recientes.
- Acciones rapidas.
- Estado de inventario.

### `/admin/propiedades`

Rol: gestion de inventario.

### `/admin/propiedades/nueva`

Rol: crear propiedad.

### `/admin/propiedades/[id]/editar`

Rol: editar propiedad.

### `/admin/leads`

Rol: gestion de leads entrantes.

Debe incluir:

- Leads de compradores/rentadores.
- Leads de propietarios.
- Estado del lead.
- Canal de origen.

### `/admin/zonas`

Rol: gestionar zonas para SEO e inventario.

### `/admin/asesores`

Rol: gestionar asesores si el sitio mostrara equipo.

### `/admin/configuracion`

Rol: datos generales del negocio.

Debe incluir:

- Nombre comercial.
- Telefonos.
- WhatsApp.
- Correo.
- Direccion.
- Horarios.
- Redes sociales.
- Datos SEO globales.

## Rutas Tecnicas

- `/sitemap.xml`
- `/robots.txt`
- `/manifest.webmanifest` si se decide activar PWA.

## MVP Recomendado Para Aprobacion

Construir primero:

- `/`
- `/inventario`
- `/inventario/[slug]`
- `/vender`
- `/vender/gracias`
- `/zonas`
- `/zonas/[zona]`
- `/nosotros`
- `/contacto`
- `/privacidad`
- `/admin/login`
- `/admin`
- `/admin/propiedades`
- `/admin/leads`
- `/admin/configuracion`

Dejar para fase posterior:

- Guias.
- Paginas SEO programaticas por tipo + zona.
- Propiedades destacadas dentro de Inicio, salvo que existan datos reales y una razon clara de conversion.
- Perfiles publicos de asesores.
- PWA.
- Integraciones externas como CRM, MLS/IDX o automatizaciones avanzadas.

## Decisiones Abiertas

- Mercado principal: Mexico, Estados Unidos, LatAm u otro.
- Operaciones iniciales: venta, renta o ambas.
- Tipos de propiedades iniciales.
- Zonas iniciales.
- Fuente del inventario: carga manual, CSV, Supabase admin o integracion externa.
- Si habra asesores visibles publicamente.
- Si el negocio tiene oficina fisica para SEO local y Google Business Profile.
- Si el sitio requiere ingles/espanol o solo espanol.
