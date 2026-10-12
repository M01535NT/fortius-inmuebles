# Registro de evidencias y límites

Base de código: `M01535NT/fortius-inmuebles`, rama `main`, commit `4c0c0d218e0212bfad4d6d8a5b6ffb6f2b16b923`. Corte documental: 10 de octubre de 2026. Las observaciones remotas corresponden a la sesión de auditoría; no son monitoreo continuo.

**CONFIRMADO** significa observado en código, configuración o respuesta de servicio. **INFERIDO** significa interpretación que requiere validación. **NO VERIFICADO** significa falta de evidencia/acceso. **PROPUESTO** significa cambio futuro, no implementado.

Los números de línea son orientativos y corresponden al commit auditado. Los archivos del repositorio pueden consultarse con el prefijo `https://github.com/M01535NT/fortius-inmuebles/blob/4c0c0d218e0212bfad4d6d8a5b6ffb6f2b16b923/`.

| ID | Fuente / comprobación | Resultado y alcance |
|---|---|---|
| E01 | Git local, GitHub repos/commit; package.json, package-lock.json | Commit coincidente; repositorio principal privado; versiones y dependencias. Remoto histórico mnt-inmuebles redirige a fortius-inmuebles. |
| E02 | src/app, src/lib, src/components, supabase/migrations, tests | 302 TS/TSX de aplicación; 44 páginas, 36 rutas API y 3 rutas adicionales PDF/social; 21 migraciones; 132 archivos test/spec, no 132 casos. |
| E03 | src/lib/backend/auth.ts:12,23,62,82; src/app/api/auth | Cookies HttpOnly/Secure/SameSite; getUser, pertenencia staff, refresco; clientes anónimo, usuario y privilegiado. Roles admin/editor. |
| E04 | src/lib/backend/repository.ts:9,21; validation.ts; contracts.ts; rutas collections | Validación, lectura en lotes de 500, escrituras RPC con versión. |
| E05 | src/lib/backend/public.ts:11; validation.ts:109; property-pdf.ts:154,244 | Proyección pública SQL seguida de proyección TS; PDF consume informacionPublica. |
| E06 | Supabase Management GET projects; consultas SELECT de catálogos con read_only=true | Un proyecto accesible fortius-inmuebles, us-east-1, ACTIVE_HEALTHY, PostgreSQL 17.6; 18 tablas públicas, todas RLS; 21 versiones de migración. No lectura de registros personales. |
| E07 | Catálogos pg_constraint, pg_indexes, pg_policy, pg_proc, pg_trigger, grants; migraciones | Relaciones, funciones, restricciones e índices; sin SELECT directo anon en las 18 tablas. Coincidir versiones de migración no prueba igualdad byte a byte de todas las funciones. |
| E08 | SELECT de metadatos storage.buckets/políticas | Cinco buckets, uno público, cuatro privados, límites de 20 MiB; no lectura de objetos. |
| E09 | Management GET config/auth | Signup deshabilitado, contraseña mínima de 12 caracteres, TOTP habilitable, JWT de 3600 s; URLs de Auth antiguas. HIBP deshabilitado. No prueba de correo enviada. |
| E10 | Management GET database/backups; tools/*backup*, *restore*, *owner-export* | PITR=false, walg=true, lista de backups vacía; exportación actual enumera 16 de 18 tablas; ensayo de restauración histórico cota. No excluye respaldos externos. |
| E11 | Management GET functions; config/postgrest | Edge Functions devuelve []; config/postgrest: 404. Límite REST efectivo no verificado. |
| E12 | .github/workflows; GitHub Actions run37989670672 y checks | Verify falló en tests/admin/fortius-inmuebles-ui.test.tsx:140. Pruebas posteriores omitidas. Dos estados de despliegue exitosos para el mismo commit. |
| E13 | GET públicos /api/health, /manifest.webmanifest, /contacto; GET privado sin sesión | Sitio/manifest responden 200; API clientes responde 401; contacto serializa publicLeadsEnabled:false. No se envió un formulario. |
| E14 | Vercel API con sesión disponible; docs/deployment-fortius.md | API 403; configuración vigente, ámbitos de variables, logs, planes y aislamiento no verificados. El documento local es antecedente, no comprobación remota. |
| E15 | src/lib/backend/http.ts:42; src/proxy.ts; public-performance.tsx | Errores sanitizados; CSP nonce y controles de origen; Speed Insights público. No logger de errores con correlación en el manejador examinado. |
| E16 | src/lib/backend/files.ts; rutas formatos/emisiones; formatos/pdf.ts | Staging, validación de bytes, tickets firmados, comprobación SHA256, snapshots, almacenamiento privado y compensación de errores. |
| E17 | src/lib/formatos/expediente-operations.ts; ruta expedientes/[id]/operacion | Etapa validada contra enum y versión; no matriz de transiciones ni compuertas documentales identificada. |
| E18 | src/lib/admin/store.ts; workspace-loading.ts; grafo aproximado imports | Estado cliente y carga por área; archivos grandes; tipos importados desde store por servidor. No ciclos multínodo detectados en aproximación; no prueba exhaustiva. |
| E19 | GitHub inventario de repositorios; lectura parcial inmobiliaria-os | Siete repositorios accesibles. OS es otra aplicación con servicios y migraciones propias. Script local de puente no prueba integración productiva. |
| E20 | src/app/manifest.ts; búsqueda de service worker | PWA instalable standalone; no service worker/offline identificado. |

Referencias remotas reproducibles:

- [CI fallido](https://github.com/M01535NT/fortius-inmuebles/actions/runs/37989670672).
- [Despliegue Fortius del commit](https://vercel.com/tonala/fortius-inmuebles/GzK7F9BmaWPginsG38h8yibhe8E4).
- [Despliegue MNT del mismo commit](https://vercel.com/tonala/mnt-inmuebles/5dd3hik6ti9hv6Hy9UjomKvUhLBV).

## Exclusiones

No se ejecutaron escrituras SQL, migraciones, pruebas sobre datos reales, restauraciones, cambios de Auth/RLS, despliegues ni modificaciones de infraestructura. No se extrajeron datos de clientes ni secretos. No se hicieron pruebas de carga o penetración. No se pudo consultar la configuración vigente de Vercel ni protección de rama (API 403). Los tests existentes se inventariaron y se consultó CI; no se presentan como ejecutados localmente en esta auditoría. La revisión parcial de otros repositorios no constituye una auditoría completa de ellos.
