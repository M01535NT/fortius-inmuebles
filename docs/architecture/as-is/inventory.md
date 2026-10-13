# Inventario de rutas y migraciones

CONFIRMADO: archivos presentes en el commit auditado. Una ruta identificada no implica que cada comportamiento se haya probado. Los grupos de App Router se conservan como rutas de archivo para evitar inferir URLs incorrectas.

## Páginas

- `src/app/admin/archivos/page.tsx`
- `src/app/admin/asesores/page.tsx`
- `src/app/admin/blog/page.tsx`
- `src/app/admin/calendario/page.tsx`
- `src/app/admin/clientes/[id]/page.tsx`
- `src/app/admin/clientes/page.tsx`
- `src/app/admin/configuracion/page.tsx`
- `src/app/admin/contenido/page.tsx`
- `src/app/admin/control-comercial/page.tsx`
- `src/app/admin/expedientes/page.tsx`
- `src/app/admin/historial/page.tsx`
- `src/app/admin/leads/[id]/page.tsx`
- `src/app/admin/leads/page.tsx`
- `src/app/admin/notas/page.tsx`
- `src/app/admin/page.tsx`
- `src/app/admin/perfil/page.tsx`
- `src/app/admin/propiedades/[slug]/editar/page.tsx`
- `src/app/admin/propiedades/nueva/page.tsx`
- `src/app/admin/propiedades/page.tsx`
- `src/app/admin/reportes/page.tsx`
- `src/app/admin/tareas/[id]/page.tsx`
- `src/app/admin/tareas/page.tsx`
- `src/app/avisos/page.tsx`
- `src/app/blog/[slug]/page.tsx`
- `src/app/blog/page.tsx`
- `src/app/comercial/page.tsx`
- `src/app/comprar-propiedad/page.tsx`
- `src/app/contacto/page.tsx`
- `src/app/due-diligence-inmobiliaria/page.tsx`
- `src/app/herramientas/gastos-de-cierre/page.tsx`
- `src/app/herramientas/hipoteca/page.tsx`
- `src/app/herramientas/page.tsx`
- `src/app/industrial/page.tsx`
- `src/app/inventario/[slug]/page.tsx`
- `src/app/inventario/page.tsx`
- `src/app/nosotros/page.tsx`
- `src/app/page.tsx`
- `src/app/privacidad/page.tsx`
- `src/app/residencial/page.tsx`
- `src/app/terminos/page.tsx`
- `src/app/vender-propiedad/gracias/page.tsx`
- `src/app/vender-propiedad/page.tsx`
- `src/app/zonas/[zona]/page.tsx`
- `src/app/zonas/page.tsx`

## Route Handlers

- `src/app/api/admin/adjuntos/[id]/descargar/route.ts`
- `src/app/api/admin/asesor-cuentas/route.ts`
- `src/app/api/admin/collections/[collection]/[id]/route.ts`
- `src/app/api/admin/collections/[collection]/route.ts`
- `src/app/api/admin/comercial/[id]/emitir/route.ts`
- `src/app/api/admin/comercial/[id]/route.ts`
- `src/app/api/admin/comercial/emisiones/[id]/route.ts`
- `src/app/api/admin/comercial/route.ts`
- `src/app/api/admin/copias-firmadas/[id]/descargar/route.ts`
- `src/app/api/admin/emisiones/[id]/descargar/route.ts`
- `src/app/api/admin/emisiones/[id]/firmado/route.ts`
- `src/app/api/admin/expedientes/[id]/actividad/route.ts`
- `src/app/api/admin/expedientes/[id]/formatos/route.ts`
- `src/app/api/admin/expedientes/[id]/operacion/route.ts`
- `src/app/api/admin/expedientes/[id]/route.ts`
- `src/app/api/admin/expedientes/route.ts`
- `src/app/api/admin/files/complete/route.ts`
- `src/app/api/admin/files/route.ts`
- `src/app/api/admin/files/upload/route.ts`
- `src/app/api/admin/formatos/[id]/adjuntos/route.ts`
- `src/app/api/admin/formatos/[id]/emitir/route.ts`
- `src/app/api/admin/formatos/[id]/route.ts`
- `src/app/api/admin/historial/route.ts`
- `src/app/api/admin/leads/[id]/convertir/route.ts`
- `src/app/api/admin/mi-asesor/route.ts`
- `src/app/api/auth/callback/route.ts`
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/logout/route.ts`
- `src/app/api/auth/password/route.ts`
- `src/app/api/auth/profile/photo/route.ts`
- `src/app/api/auth/profile/route.ts`
- `src/app/api/auth/recovery/route.ts`
- `src/app/api/auth/session/route.ts`
- `src/app/api/health/route.ts`
- `src/app/api/leads/route.ts`
- `src/app/api/public/leads/route.ts`
- `src/app/avisos/[documento]/route.ts`
- `src/app/inventario/[slug]/ficha-tecnica/route.ts`
- `src/app/inventario/[slug]/imagen-social/route.ts`

## Migraciones versionadas

- `supabase/migrations/202609030001_fortius_inmuebles_backend.sql`
- `supabase/migrations/202609030002_fortius_inmuebles_record_revisions.sql`
- `supabase/migrations/202609060003_fortius_inmuebles_identity.sql`
- `supabase/migrations/202609060004_fortius_inmuebles_content_identity.sql`
- `supabase/migrations/202609060005_retire_public_read_compatibility.sql`
- `supabase/migrations/202609230006_fortius_inmuebles_tasks.sql`
- `supabase/migrations/202609230007_fortius_inmuebles_home_editorial.sql`
- `supabase/migrations/202609240008_fortius_inmuebles_blog_editorial.sql`
- `supabase/migrations/202610040009_fortius_inmuebles_expedientes.sql`
- `supabase/migrations/202610040010_fortius_inmuebles_formato_assets.sql`
- `supabase/migrations/20261005000752_fortius_inmuebles_comercial.sql`
- `supabase/migrations/20261005004358_fortius_inmuebles_private_upload_provenance.sql`
- `supabase/migrations/20261005011326_fortius_inmuebles_expediente_row_scope.sql`
- `supabase/migrations/20261005013631_fortius_inmuebles_lead_conversion.sql`
- `supabase/migrations/20261005035035_fortius_inmuebles_identity.sql`
- `supabase/migrations/20261005040239_fortius_inmuebles_retire_compatibility.sql`
- `supabase/migrations/20261005052643_fortius_inmuebles_expediente_deletion.sql`
- `supabase/migrations/20261005060000_fortius_inmuebles_expediente_operations.sql`
- `supabase/migrations/20261005061000_fortius_inmuebles_calendar_links.sql`
- `supabase/migrations/20261005062000_fortius_inmuebles_property_integrity.sql`
- `supabase/migrations/20261008210000_fortius_admin_history.sql`
