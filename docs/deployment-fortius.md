# Despliegue de Fortius

- Sitio público: https://fortius-inmuebles.vercel.app
- Proyecto Vercel: https://vercel.com/tonala/fortius
- Repositorio: `M01535NT/mnt-inmuebles`.
- Rama de producción: `alternativa-fortius`; sus pushes generan despliegues de producción en Fortius.
- Framework: Next.js; Node.js 24.x.

`fortius.vercel.app` ya estaba asignado a otro proyecto. Vercel verificó y asignó `fortius-inmuebles.vercel.app` a este proyecto.

El proyecto `mnt-inmuebles` conserva `main` como su rama de producción y su dominio anterior. No se modificó ese proyecto al crear Fortius.

## Variables

Producción y vistas previas tienen `MNT_SITE_URL=https://fortius-inmuebles.vercel.app`, `MNT_PUBLIC_LEADS_ENABLED=false` y las tres variables de Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`). La clave del servidor se configura como sensible; los valores secretos no se incluyen en el repositorio.

Fortius usa el inventario, blog y administración del backend existente. Separar el dominio y el proyecto Vercel no duplica la base de datos. Las variables y contratos técnicos MNT_* se conservan por compatibilidad.

La protección de Vercel se mantiene en `all_except_custom_domains`: el dominio público de producción abre sin una cuenta de Vercel; los enlaces internos de despliegue y las vistas previas conservan la protección del equipo.

## Verificación

Comprobar `/api/health`, Inicio, inventario, blog, herramientas, acceso a `/admin`, `robots.txt` y `sitemap.xml`. Los enlaces para compartir y la metadata deben usar el dominio Fortius, incluido el fallback al compartir desde localhost. Las descargas PDF deben conservar la marca y completar su generación.
