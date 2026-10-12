# Arquitectura actual — AS-IS

## Alcance y sistema

**CONFIRMADO [E01–E04]:** Fortius es una aplicación Next.js que reúne sitio público, panel administrativo y API en un mismo repositorio y unidad de aplicación. Usa Supabase Auth, PostgreSQL y Storage como backend. No se ha demostrado un despliegue independiente del panel. La misma aplicación tiene dos despliegues Vercel observados; esto no equivale a separación público/administración.

El público consulta proyecciones de datos publicables sin sesión de personal. El administrador usa Supabase Auth y pertenencia a staff; tener una cuenta Auth no basta. Ambos consumen el backend mediante módulos comunes, pero no tienen los mismos permisos ni requieren la misma autenticación. Comparten componentes y proveedores del repositorio; el panel también tiene componentes propios.

## Inventario tecnológico

| Tecnología | Versión observada | Responsabilidad |
|---|---|---|
| Next.js / React | 16.3.6 /19.2.7 | App Router, servidor y UI |
| TypeScript | 6.0.3 | Tipado estricto |
| Supabase JS | 2.110.3 | Auth, REST/RPC y Storage |
| PostgreSQL remoto | 17.6 | Datos, reglas, RLS y funciones |
| Zod | 4.5.4 | Validación de entradas y contratos |
| Tailwind | 4.3.2 | Estilos |
| GSAP / Motion | 3.15.0 /12.42.2 | Animación |
| pdf-lib | 1.17.1 | Generación documental |
| Node | 24 en CI/documentación | Runtime de producción no verificado |

Versiones proceden de lockfile y metadatos, no de suposiciones de conversación [E01,E06].

## Repositorios

| Repositorio | Papel comprobado | Límites |
|---|---|---|
| fortius-inmuebles | Aplicación principal, clon auditado | Nombre remoto histórico mnt-inmuebles |
| inmobiliaria-os | Aplicación interna separada; operaciones, documentos, partes, tareas, fuentes | Lectura parcial remota; integración productiva no verificada |
| nexo360 | Aplicación de referencia visual | Sin vínculo operativo demostrado |
| black_capital | Otra aplicación Next.js | Sin backend compartido demostrado |
| Nalley-web, omar-medina, Vcard-Omar | Repositorios accesibles | Fuera de revisión funcional |

`inmobiliaria-os` tiene Next 16.2.10, React 19.2.4, Supabase SSR y 15 migraciones observadas. Su script e2e-puente-web.mts usa rutas hermanas y localhost: evidencia de prueba local, no sincronización productiva. La dependencia @openai/apps-sdk-ui es UI; no demuestra invocación de modelos. Las reglas de fuentes jurídicas tampoco demuestran RAG [E19].

## Estructura y responsabilidades

- `src/app`: rutas públicas (Inicio, inventario, inmuebles, blog, contacto, nosotros, herramientas y avisos), `/admin`, `/api/auth`, `/api/admin` y rutas de documentos.
- `src/components`: UI pública/administrativa reutilizable; animaciones y formularios.
- `src/lib/backend`: Auth, acceso, validación, errores, archivos y proyección pública.
- `src/lib/admin`: store de cliente, contratos usados por UI y cargas por espacio de trabajo.
- `src/lib/formatos`: catálogo, validación, preparación y PDF de formatos.
- `src/lib/comercial`: libros, revisiones y emisiones comerciales.
- `src/lib/finance`: cálculos e informes financieros; no evidencia de conexión bancaria.
- `supabase/migrations`: evolución SQL; hay nombres cota/mnt históricos y renombramientos posteriores.
- `tests`, `tools`, `.github/workflows`, `docs`: comprobaciones, utilidades operativas, CI y documentación.

No se identificaron módulos `'use server'` como patrón principal: la capa de aplicación utiliza Route Handlers. El panel guarda estado de interfaz en memoria; la persistencia de negocio es Supabase. workspace-loading carga las colecciones de cada área, no necesariamente las once en toda navegación [E02,E18].

## Modelo de datos

Dieciocho tablas públicas con prefijo `fortius_inmuebles_` [E06,E07]. Es un modelo híbrido: registros JSONB por colección más entidades especializadas con restricciones y claves foráneas.

| Grupo | Tablas | Responsabilidad |
|---|---|---|
| Identidad | staff, adviser_accounts | Roles y vinculación Auth–asesor |
| Núcleo | records, record_references, record_revisions | Colecciones, integridad de referencias y versiones/tombstones |
| Trazabilidad | record_history | Snapshots, actor y acción; lectura administrativa |
| Captación | lead_conversions, rate_limits | Conversión e idempotencia; límite de solicitudes |
| Archivos | file_uploads | Procedencia y rutas de cargas |
| Operación | expedientes, expediente_actividad | Responsable, cliente, etapa, lista documental y actividad |
| Documentos | formato_drafts, formato_emissions, formato_assets, signed_copies | Borradores, snapshots emitidos, activos y copias firmadas |
| Comercial | comercial_books, comercial_revisions, comercial_emissions | Libros y versiones/emisiones inmutables |

records tiene PK `(collection,id)` y JSONB `data`. Colecciones: propiedades, asesores, leads, clientes, eventos, tareas, notas, posts, archivos, contenido y config. Las referencias cliente/asesor de expedientes apuntan a records mediante claves compuestas y colección fija. propiedad_slug usa validación mediante trigger, no una FK convencional al slug. Auth.users pertenece al esquema gestionado y no se contó entre las 18 tablas.

Existen índices de PK, referencias, slug único parcial, documentos por padre, actividad e historial por entidad/fecha. No se observó índice records `(collection,created_at,id)`; su utilidad debe medirse con planes de consulta antes de crearlo. Las escrituras del núcleo se serializan con advisory lock 781023 [F07].

## Autenticación, autorización y archivos

**CONFIRMADO:** cookies HttpOnly/Secure/SameSite, verificación de usuario y staff; roles admin/editor. Todas las 18 tablas tienen RLS, sin SELECT directo anon. `force_rls=false` no significa que RLS esté desactivado para usuarios normales. Se usan funciones SQL para escrituras, control de versiones y referencias; funciones propias SECURITY DEFINER examinadas fijan search_path vacío [E03,E07].

Clientes y leads de editor se limitan por asesor asignado. Expedientes requieren autorización del asesor/cliente o rol admin. Documentos heredan acceso de su expediente. Libros comerciales e historial están restringidos a admin. No se debe resumir esto como «cada editor solo ve todo lo suyo»: eventos/tareas/notas sin cliente vinculado siguen reglas distintas.

Buckets: `fortius-inmuebles-public` (público), `fortius-inmuebles-private`, `fortius-inmuebles-staging`, `fortius-inmuebles-expedientes`, `fortius-inmuebles-comercial` (privados), límite20 MiB. Los activos de ciertos formatos tienen validación más estricta de10 MiB. Se comprobaron metadatos/políticas, no archivos personales [E08,E16].

Las rutas de emisión validan sesión, acceso mediante RLS, versión, catálogo y datos antes de usar service_role para Storage y el registro final. Hay hash SHA256 y snapshots; si falla la inserción tras subir el PDF se intenta eliminar el objeto. Esto es compensación, no una transacción atómica entre Storage y PostgreSQL. public-team utiliza lectura privilegiada con proyección opt-in; conviene evaluar mínimo privilegio sin afirmar una fuga no demostrada.

Auth permite TOTP, pero no se identificó una exigencia AAL2 para personal. Las URLs de recuperación conservan dominios antiguos [F02,F10].

## Servicios e integraciones

| Conexión | Estado |
|---|---|
| Supabase Auth/REST-RPC/Storage | CONFIRMADO en código y proyecto accesible |
| Vercel y dominio fortiusinmuebles.com | CONFIRMADO por HTTP y estados GitHub; configuración administrativa NO VERIFICADA |
| WhatsApp | CONFIRMADO enlace de salida; no API Business demostrada |
| Vercel Speed Insights | CONFIRMADO en UI pública; no sustituye observabilidad de errores |
| Formularios públicos de captación | Código existente; contacto observado con publicLeadsEnabled:false |
| Edge Functions | Lista remota vacía en el proyecto accesible |
| IA, RAG, portales, bus de eventos, sincronización OS | NO VERIFICADO; no representado como implantado |
| PWA | Manifest instalable standalone; offline/service worker no identificado |

## Variables y configuración

Nombres relevantes, sin valores: `SITE_URL`, `PUBLIC_LEADS_ENABLED`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NODE_ENV`, `VERCEL`. Para tareas del entorno se observaron nombres `SUPABASE_ACCESS_TOKEN`, `MNT_LOGIN_EMAIL`, `MNT_LOGIN_PASSWORD`; no se consideran prueba de variables Vercel. Solo .env.example está versionado. Los ámbitos actuales producción/preview/desarrollo son NO VERIFICADOS [E14].

## Operación y calidad

CI inventariado: lint, typecheck, pruebas backend/admin, build y comprobaciones adicionales de PDF/navegador. 132 archivos de prueba no garantizan cobertura completa. El último Verify observado falló; los pasos posteriores se omitieron, aunque dos despliegues publicaron el commit [E12,F03].

La aplicación pública es dinámica (`connection()` en layout) y el cliente de servidor usa no-store. React cache en readPublic memoiza dentro del ciclo de servidor; no es caché persistente. listRecords/readPublic recorren lotes hasta reunir colecciones completas [F05].

Existen controles de entrada, CSP, sanitización de errores y rechazo 401 sin sesión en una ruta privada comprobada. No se hicieron pruebas exhaustivas de autorización, carga o intrusión. Exportación/restauración y observabilidad requieren estabilización [F01,F09]. No se verificaron costos, límites de plan, RPO/RTO acordados ni aislamiento real de preview.

## Diagramas

Fuentes en esta carpeta: context.puml (C4 L1), containers.puml (C4 L2), components/application.puml (C4 L3), code/record-write.puml (L4), deployment.puml, data-model.puml y sequences/*.puml. Los diagramas representan evidencia, no aprobación de cambios.
