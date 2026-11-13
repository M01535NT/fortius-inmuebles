# Despliegue de Fortius Inmuebles

- Sitio público: https://fortiusinmuebles.com
- Proyecto Vercel: https://vercel.com/tonala/fortius-inmuebles
- ID Vercel: prj_mCgnplUXyiI0YFnL6Fr2zVLmSzJv.
- Repositorio público: M01535NT/fortius-inmuebles; ID 1291895344. Visibilidad autorizada el 12 de octubre de 2026.
- Rama de producción: main.
- Supabase: fortius-inmuebles; ref qkkirjzhviqwvuqjnmei.
- Framework: Next.js; Node.js 24.x.

## Variables

Producción usa FORTIUS_INMUEBLES_SITE_URL=https://fortiusinmuebles.com y las variables de Supabase/recepción configuradas en Vercel. No se incluyen claves en el repositorio. Desde el 12 de octubre de 2026, los nuevos previews no reciben las variables del backend productivo ni la habilitación de recepción pública; requieren un backend de pruebas para validar los flujos dinámicos. El 12/11/2026 se borraron las cinco entradas de preview ligadas a dos ramas ya inexistentes. Quedan 13 variables de producción de la integración de Supabase que el código no usa; su retiro está propuesto en [controles y evidencia](erp-crm/environment-release.md). Consultar [controles y evidencia](erp-crm/environment-release.md).

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

Deployment Check GitHub `verify` activado en Fortius y en el proyecto adicional conectado entonces al mismo repositorio; al 12/11/2026 ese proyecto ya no aparece en el equipo y solo queda el check de Fortius. Exige check antes de asignar dominios. Main todavía requiere permiso administrativo para aplicar su protección. La preparación de controles no publicó producción. Posteriormente, [PR #15](https://github.com/M01535NT/fortius-inmuebles/pull/15) integró `36e3ba64` y documentó su despliegue productivo tras Verify exitoso. La actualización documental actual no publica otra revisión. Ver [estado y alcance de la evidencia](erp-crm/environment-release.md).

## Regresar a la versión anterior (ensayado el 12/11/2026)

Si una publicación sale mal, se vuelve a la versión anterior en Vercel sin tocar código:

1. En Vercel, **fortius-inmuebles → Deployments**, abre la publicación de producción anterior (la que dice *Previous* o *Stale*).
2. Menú **⋯ → Instant Rollback**, escribe el motivo, **Continue** y **Confirm Rollback**. El dominio cambia en unos 2 segundos.
3. Mientras dure el regreso, Vercel **no publica** en producción lo que llegue a `main` (queda en pausa la asignación automática de dominios).
4. Para terminar: abre la publicación buena (corregida o la que se había quitado), **⋯ → Promote → Promote**. Eso deshace el regreso y reactiva la publicación automática.
5. Comprueba con `npm run health -- https://fortiusinmuebles.com --json` (solo lectura).

Límites:

- En el plan Hobby solo se puede regresar a la versión **inmediatamente anterior**.
- El regreso cambia el código, **no la base de datos**. Si la publicación problemática trajo una migración, la versión anterior podría no ser compatible con el esquema nuevo; revisar `supabase/migrations` entre ambas versiones antes de regresar.

Ensayo del 12/11/2026: de `a9b10e2` (PR #69) a `02d28d6` (PR #68), sin migraciones entre ambas. Ida en ~2 s y vuelta en ~2 s; las páginas principales respondieron 200 con la versión anterior y después de volver (no se vigiló segundo a segundo durante el cambio). Al final, producción quedó en `a9b10e2` con la asignación automática reactivada y la revisión de salud en `ok` (51 solicitudes: 48 con 200, 1 redirección 308 y 2 con 404; no se compararon con una revisión previa).

### Compatibilidad del esquema al regresar (CI-01, revisado el 13/11/2026)

Regla: las migraciones de Fortius solo agregan o endurecen (columnas nuevas opcionales, funciones, disparadores, políticas, permisos); nunca borran ni renombran lo que usa la versión anterior del código. Así, regresar la aplicación una versión no exige tocar la base. Una migración aplicada **no se revierte** para acompañar un regreso: si hiciera falta, se corrige con una migración nueva.

Revisión de la publicación del 13/11/2026 (PR #74, `ff2e09c`) contra la anterior (`c03504b`), con las 10 migraciones ya aplicadas:

| Migración | Si se regresa a `c03504b` |
| --- | --- |
| `120000` inmuebles por asesor | El panel anterior lee los inmuebles directo: un asesor vería solo los suyos (sin la vista del equipo). No falla ni expone nada. |
| `121000`, `122000`, `124000`, `126000`, `127000` | Reglas dentro de la base, más estrictas; el código anterior las cumple o recibe el mismo mensaje de la base. |
| `123000` límite de acceso, `141000` alta heredada | El código anterior no las llama; siguen ahí sin efecto. |
| `125000` URL públicas | Más estricta; el código anterior no cambia. |
| `140000` reserva de IA | Solo amplía los estados permitidos; el código anterior escribe los de siempre. |

Conclusión: el regreso de esa publicación es compatible. Revisar esta tabla en cada publicación con migraciones.
