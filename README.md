# Fortius Inmuebles

Plataforma inmobiliaria de Fortius Inmuebles: sitio público y panel de gestión `/admin`, con un backend dedicado en Supabase.

**Sitio:** [fortiusinmuebles.com](https://fortiusinmuebles.com) · **Panel:** [Acceso administrativo](https://fortiusinmuebles.com/admin)

El sitio presenta propiedades, servicios, artículos y herramientas financieras. El panel administra la información operativa; el sitio consulta únicamente la proyección pública. Ambos forman un solo producto.

## Funciones actuales

- **Inmuebles:** inventario, fichas, fotografías, archivos y publicación en el sitio.
- **Prospectos y clientes:** captura y seguimiento de leads, conversión a clientes y asignación de asesores.
- **Expedientes y documentos:** formatos inmobiliarios, generación de PDF, versiones, historial y archivos privados; eliminación recuperable de expedientes.
- **Control comercial:** cartera administrativa, seguimiento y reportes.
- **Trabajo diario:** calendario, tareas y notas.
- **Contenido:** blog, textos de portada, contacto y configuración del sitio.

El acceso al panel requiere autenticación y una membresía activa. Los permisos se comprueban en el servidor y en el backend mediante políticas de acceso por fila (RLS).

## Estado del proyecto

Producción se despliega desde `main` en el proyecto Vercel `fortius-inmuebles`, conectado al repositorio público [`M01535NT/fortius-inmuebles`](https://github.com/M01535NT/fortius-inmuebles). El dominio principal es `https://fortiusinmuebles.com`; `www` y los aliases públicos de Fortius redirigen a ese dominio.

La base ERP/CRM está integrada: contratos de dominio compartidos, paginación de expedientes, identificadores de diagnóstico y herramientas de verificación de respaldos y restauración aislada. **El ERP completo sigue en desarrollo.** Consulta [el alcance de la primera iteración](docs/erp-crm/iterations/01-foundation.md) y [el plan de próximas iteraciones](docs/superpowers/plans/2026-10-12-fortius-erp-crm-primeras-iteraciones.md); los estados y resultados de esos documentos corresponden al corte que indican.

La recepción pública de prospectos permanece desactivada. Los inmuebles y documentos demo no acreditan inventario, precios ni condiciones comerciales vigentes. El formato 09 permite preparar información; la emisión del contrato permanece bloqueada por falta de cotejo del modelo y sus registros aplicables. Consulta [el estado de los formatos](docs/formatos-admin-status.md).

La verificación de recuperación local de datos y archivos no acredita todavía la recuperación completa de los servicios Auth y Storage del proveedor. Los objetivos de respaldo y recuperación requieren completar su ensayo operativo; consulta [la política de recuperación](docs/erp-crm/recovery-policy.md).

## Tecnología

Next.js, React, TypeScript y Tailwind CSS; Supabase para autenticación, datos y almacenamiento; Vercel para despliegue. La interfaz utiliza GSAP y Motion, y los PDF se generan con `pdf-lib`.

## Desarrollo local

Requiere Node.js 24 y npm. Copia [`.env.example`](.env.example) como `.env.local`, configura un backend de desarrollo o pruebas dedicado y ejecuta:

```text
npm ci
npm run dev -- --hostname 127.0.0.1 --port 3001
```

Variables:

- `FORTIUS_INMUEBLES_SITE_URL`: origen canónico; `https://fortiusinmuebles.com` en producción y `http://localhost:3001` en desarrollo local.
- `NEXT_PUBLIC_SUPABASE_URL`: URL del proyecto Supabase dedicado.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: clave pública del proyecto.
- `SUPABASE_SERVICE_ROLE_KEY`: secreto exclusivo del servidor.
- `FORTIUS_INMUEBLES_PUBLIC_LEADS_ENABLED`: `false` por defecto; habilita recepción pública solo después de configurar y verificar el backend.

Conserva `.env.local` y las credenciales fuera del control de versiones. `SUPABASE_SERVICE_ROLE_KEY` se usa exclusivamente en el servidor y nunca debe exponerse mediante una variable `NEXT_PUBLIC_*`.

## Backend

Para una instalación nueva, aplica **todos** los archivos de [`supabase/migrations`](supabase/migrations) en orden ascendente de su prefijo temporal. La carpeta es la fuente completa de migraciones e incluye expedientes, formatos, control comercial, conversión de leads, operaciones, historial y proyección pública de inmuebles, además del núcleo inicial.

Los archivos anteriores al cambio de identidad conservan su SQL histórico; sus nombres de archivo fueron normalizados sin modificar ese SQL. En una instancia existente, comprueba su historial y aplica únicamente las migraciones pendientes. No vuelvas a ejecutar migraciones ya aplicadas. El cambio de identidad también requiere coordinar Storage conforme al procedimiento documentado.

La migración `20261005035035_fortius_inmuebles_identity.sql` renombra tablas, funciones, índices, restricciones, políticas y triggers a `fortius_inmuebles_*`, conservando filas, revisiones, OIDs, ACL y RLS. Los buckets se preparan por API con `tools/fortius-inmuebles-storage-identity.mjs prepare`; el corte rechaza archivos o recibos antiguos no migrados. La migración `20261005040239_fortius_inmuebles_retire_compatibility.sql` retira la lectura temporal anterior después de comprobar producción. Consulta [el cambio de identidad](docs/fortius-inmuebles-identity.md).

Crea usuarios en Supabase Auth y registra su membresía activa en `fortius_inmuebles_staff`. El acceso al panel depende del rol almacenado en el servidor; no usa almacenamiento del navegador como base de datos o autorización.

## Verificación

```text
npm run verify
```

Ese comando ejecuta lint, tipos, pruebas de backend y panel, y build. No necesita secretos. Las pruebas de navegador se ejecutan por separado con `npm run test:admin:browser`; CI usa los escenarios con backend simulado o explícitamente no disponible.

Las pruebas de herramientas de respaldo y restauración aislada se ejecutan con:

```text
node --test tests/tools/*.test.mjs
```

El workflow [Verify](.github/workflows/verify.yml) ejecuta esas pruebas, `npm run verify`, la comprobación de activos PDF y las suites de navegador. Puedes consultar sus resultados en [GitHub Actions](https://github.com/M01535NT/fortius-inmuebles/actions/workflows/verify.yml).

`npm run test:public:browser` comprueba la portada compilada a 375, 768 y 1440 px, ambos temas, movimiento reducido y accesibilidad automática. Inicia un backend local de solo lectura con datos de ejemplo; no usa Supabase real. Requiere el build previo y Edge en Windows o Chromium instalado mediante Playwright en Linux.

Para medir tres cargas móviles con las animaciones activas, ejecuta esa suite con `FORTIUS_INMUEBLES_RUN_LIGHTHOUSE=true` y el filtro `-- --grep "performance budget"`. Guarda resultados en `tmp/performance`; falla si la mediana supera LCP 2.5 s, CLS 0.1 o TBT 200 ms. Es una medición de laboratorio, no datos de usuarios ni INP.

### Pruebas contra un backend real

La verificación live es independiente porque crea y elimina fixtures en el proyecto dedicado:

```text
npm run test:live -- --web
```

Requiere `FORTIUS_INMUEBLES_TEST_URL`, credenciales del proyecto y confirmación explícita mediante `--run`, incluida por el script. `FORTIUS_INMUEBLES_TEST_PROJECT_REF` puede fijar el project ref dedicado. Las pruebas de leads reales solo se ejecutan con `FORTIUS_INMUEBLES_TEST_PRODUCTION_LEADS=true`; respetan los límites existentes y fallan si el entorno ya está saturado. Estas pruebas realizan escrituras y deben planificarse por separado de la verificación local y de CI.

### Salud del sitio

Después de publicar, la comprobación operativa de solo lectura valida salud, sitemap, rutas públicas y redirecciones sin credenciales:

```text
npm run health -- https://fortiusinmuebles.com --json
```

`--json` guarda un informe sanitizado en `.superpowers/fortius-inmuebles-health.json`. Los tiempos son mediana y percentil 95 de las solicitudes realizadas; no sustituyen una medición Lighthouse.

## Despliegue

Consulta [la configuración de despliegue](docs/deployment-fortius.md) y [los controles de entornos y publicación](docs/erp-crm/environment-release.md).

El Deployment Check de Vercel exige el job GitHub `verify` antes de asignar los dominios productivos. La protección administrativa de `main` sigue pendiente conforme a la evidencia documentada. Los nuevos previews no reciben credenciales del backend productivo y requieren un backend de pruebas para comprobar flujos dinámicos.

## Contenido y navegación

`/admin/contenido` administra los títulos, metadatos y textos de presentación, método, entregables, preguntas frecuentes y contacto. La proyección pública permite únicamente los campos autorizados. Los textos históricos predeterminados se actualizan al leerlos, mientras que los cambios personalizados del panel se conservan.

La interfaz pública incluye un menú a pantalla completa, navegación por servicios, inventario, blog y herramientas. Las animaciones y transiciones respetan la preferencia de movimiento reducido. Speed Insights se carga solo en el sitio público de Vercel y requiere habilitar el servicio en ese proyecto.

## Documentación

- [Manual de administración](docs/admin-manual.md): operación, publicación, archivos, roles y conflictos de versión.
- [Estado de los formatos](docs/formatos-admin-status.md): alcance, emisión y límites de los documentos.
- [Arquitectura y auditoría](docs/architecture/README.md): informe y diagramas con corte al 10 de octubre de 2026; la arquitectura propuesta se distingue de la implementada.
- [Primera iteración ERP/CRM](docs/erp-crm/iterations/01-foundation.md) y [plan de próximas iteraciones](docs/superpowers/plans/2026-10-12-fortius-erp-crm-primeras-iteraciones.md).
- [Respaldo y restauración](docs/fortius-inmuebles-backup-restore.md) y [política de recuperación](docs/erp-crm/recovery-policy.md).
- [Configuración de despliegue](docs/deployment-fortius.md) y [controles de entornos y publicación](docs/erp-crm/environment-release.md).
- [Cambio de identidad](docs/fortius-inmuebles-identity.md) y [evidencia histórica archivada](docs/archive/fortius-inmuebles-20260903-restoration.md).

Antes de activar la operación comercial, revisa contactos, contenido definitivo, datos de ejemplo y [pendientes de entrega](docs/fortius-inmuebles-implementation.md).
