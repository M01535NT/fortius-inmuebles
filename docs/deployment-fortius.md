# Despliegue de Fortius Inmuebles

- Sitio público: https://fortiusinmuebles.com
- Proyecto Vercel: https://vercel.com/tonala/fortius-inmuebles
- ID Vercel: prj_mCgnplUXyiI0YFnL6Fr2zVLmSzJv.
- Repositorio privado: M01535NT/fortius-inmuebles; ID 1291895344.
- Rama de producción: main.
- Supabase: fortius-inmuebles; ref qkkirjzhviqwvuqjnmei.
- Framework: Next.js; Node.js 24.x.

## Variables

Producción y vistas previas usan FORTIUS_INMUEBLES_SITE_URL=https://fortiusinmuebles.com, FORTIUS_INMUEBLES_PUBLIC_LEADS_ENABLED=false y NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY. La clave del servidor es sensible y no se incluye en el repositorio.

El sitio público y el panel son un mismo producto. Los nombres de los proyectos cambiaron conservando sus IDs, datos, secretos y dominio público. La conexión Git existente identifica el repositorio por su ID y conserva la rama main.

La protección de Vercel se mantiene en all_except_custom_domains: el dominio público de producción abre sin una cuenta de Vercel; los enlaces internos de despliegue y las vistas previas conservan la protección del equipo.

## Corte y verificación

Consulta [Identidad Fortius Inmuebles](fortius-inmuebles-identity.md) para la secuencia de migración, compatibilidad temporal e identificación del archivo histórico.

Comprobar salud, Inicio, inventario, blog, herramientas, acceso al panel, robots y sitemap. Comprobar autenticación, escrituras con control de versión, separación de datos privados, almacenamiento y generación de PDF. Los enlaces para compartir y metadatos usan el dominio Fortius Inmuebles.

## Dominio propio (8 de octubre de 2026)

- Dominio principal: https://fortiusinmuebles.com.
- www.fortiusinmuebles.com: redirección permanente 308 al dominio principal.
- Ambos dominios están verificados y asociados al proyecto indicado arriba.
- Los aliases públicos fortius-inmuebles.vercel.app y fortius-alpha.vercel.app redirigen al dominio principal conservando ruta y parámetros. Los despliegues internos y previews conservan su protección.
- La URL base controla metadatos canónicos, Open Graph, sitemap y enlaces compartidos.
- El dominio está registrado en NEUBOX. No fue necesario cambiar DNS: ya sirve el proyecto desde Vercel con HTTPS.
- La recepción pública de prospectos permanece desactivada.
- Verificación de cuenta NEUBOX: el correo del 8 de octubre solicita completarla dentro de 15 días. El estado en el panel aún debe comprobarse; el correo por sí solo no acredita que siga pendiente.
