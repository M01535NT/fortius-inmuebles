# Despliegue de Fortius Inmuebles

- Sitio público: https://fortiusinmuebles.com
- Proyecto Vercel: https://vercel.com/tonala/fortius-inmuebles
- ID Vercel: prj_mCgnplUXyiI0YFnL6Fr2zVLmSzJv.
- Repositorio público: M01535NT/fortius-inmuebles; ID 1291895344. Visibilidad autorizada el 12 de octubre de 2026.
- Rama de producción: main.
- Supabase: fortius-inmuebles; ref qkkirjzhviqwvuqjnmei.
- Framework: Next.js; Node.js 24.x.

## Variables

Producción usa FORTIUS_INMUEBLES_SITE_URL=https://fortiusinmuebles.com y las variables de Supabase/recepción configuradas en Vercel. No se incluyen claves en el repositorio. Desde el 12 de octubre de 2026, los nuevos previews no reciben las variables del backend productivo ni la habilitación de recepción pública; requieren un backend de pruebas para validar los flujos dinámicos. Las excepciones por rama están en [controles y evidencia](erp-crm/environment-release.md): `codex/erp-crm-preview` y, desde el 26/10/2026, `cursor/sitio-publico-portal-b656` (URL y clave anónima; sin secreto de servidor ni recepción pública).

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

## Control de publicación (12 de octubre de 2026)

Deployment Check GitHub `verify` activado en Fortius y en el proyecto adicional conectado al mismo repositorio. Exige check antes de asignar dominios. Main todavía requiere permiso administrativo para aplicar su protección. La preparación de controles no publicó producción. Posteriormente, [PR #15](https://github.com/M01535NT/fortius-inmuebles/pull/15) integró `36e3ba64` y documentó su despliegue productivo tras Verify exitoso. La actualización documental actual no publica otra revisión. Ver [estado y alcance de la evidencia](erp-crm/environment-release.md).
