# MNT Inmuebles

Sitio público y panel `/admin` de MNT Inmuebles. Ambos forman un solo producto y usan un backend dedicado en Supabase. El panel administra inmuebles, leads, clientes, asesores, calendario, notas, blog, archivos, contenido y configuración; el sitio consulta únicamente la proyección pública.

## Desarrollo local

Requiere Node.js 24 y npm. Copia `.env.example` como `.env.local`, completa las credenciales del proyecto dedicado y ejecuta:

```text
npm ci
npm run dev -- --hostname 127.0.0.1 --port 3001
```

Variables:

- `MNT_SITE_URL`: origen canónico; la URL registrada es `https://mnt-inmuebles.vercel.app` y en local se configura como `http://localhost:3001`.
- `NEXT_PUBLIC_SUPABASE_URL`: URL del proyecto Supabase dedicado.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: clave pública del proyecto.
- `SUPABASE_SERVICE_ROLE_KEY`: secreto exclusivo del servidor.
- `MNT_PUBLIC_LEADS_ENABLED`: `false` por defecto; habilita recepción pública solo después de configurar y verificar el backend.

## Backend

Aplica las migraciones en este orden:

1. `202609030001_cota_backend.sql`
2. `202609030002_cota_record_revisions.sql`
3. `202609060003_mnt_identity.sql`
4. `202609060004_mnt_content_identity.sql`

Los nombres de 001 y 002 son históricos e inmutables. La migración 003 conserva datos y revisiones, cambia la identidad activa a `mnt_*`, crea los buckets `mnt-staging`, `mnt-private` y `mnt-public`, y protege la unicidad e inmutabilidad de los slugs del blog. La migración 004 actualiza la identidad del contenido conservado. No edites migraciones aplicadas.

Crea usuarios en Supabase Auth y registra su membresía activa en `mnt_staff`. El acceso al panel depende del rol almacenado en el servidor; no usa almacenamiento del navegador como base de datos o autorización.

## Verificación

```text
npm run verify
```

Ese comando ejecuta lint, tipos, pruebas de backend y panel, y build. No necesita secretos. Las pruebas de navegador se ejecutan por separado con `npm run test:admin:browser`; CI usa los escenarios con backend simulado o explícitamente no disponible.

La verificación live es independiente porque crea y elimina fixtures en el proyecto dedicado:

```text
npm run test:live -- --web
```

Requiere `MNT_TEST_URL`, credenciales del proyecto y confirmación explícita mediante `--run`, incluida por el script. `MNT_TEST_PROJECT_REF` puede fijar el project ref dedicado. Las pruebas de leads reales solo se ejecutan con `MNT_TEST_PRODUCTION_LEADS=true`; respetan los límites existentes y fallan si el entorno ya está saturado. El hostname de Vercel está registrado, pero el despliegue final sigue pendiente.

Después de publicar, la comprobación operativa de solo lectura valida salud, sitemap, rutas públicas y redirecciones sin credenciales:

```text
MNT_TEST_URL=https://mnt-inmuebles.vercel.app npm run health
npm run health -- https://mnt-inmuebles.vercel.app --json
```

`--json` guarda un informe sanitizado en `.superpowers/mnt-health.json`. Los tiempos son mediana y percentil 95 de las solicitudes realizadas; no sustituyen una medición Lighthouse.

## Operación

Consulta [Manual de administración](docs/admin-manual.md) para publicación, archivos, conflictos de versión, roles y recuperación. Los respaldos y el archivo histórico se documentan en [Respaldo y restauración](docs/mnt-backup-restore.md) y [evidencia archivada](docs/archive/COTA-20260903-restoration.md).

Los inmuebles, contactos y documentos de ejemplo no acreditan datos comerciales vigentes. Sustitúyelos desde `/admin` antes de publicar.
