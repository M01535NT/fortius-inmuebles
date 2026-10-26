# Instrucciones para agentes — Fortius Inmuebles

## Propósito y alcance

Este repositorio contiene un solo producto: el sitio público de **Fortius Inmuebles** y su panel operativo `/admin`, con backend Supabase y despliegue en Vercel. COTA e Inmobiliaria OS son proyectos separados: no copies sus reglas, datos, credenciales o identidad por semejanza de nombres.

Trabaja en español, con precisión y comunicación breve. Ejecuta los encargos definidos; resuelve decisiones menores y pregunta únicamente cuando una incertidumbre cambie materialmente el resultado o se requiera autorización. Distingue hechos comprobados, inferencias, propuestas y pendientes. No afirmes resultados que no verificaste.

Estas instrucciones orientan el trabajo en todo el repositorio. Respeta las instrucciones de mayor prioridad, el encargo explícito vigente y las instrucciones aplicables a subcarpetas. Una propuesta documental o un dato de ejemplo no concede autorización para ejecutar acciones.

## Antes de modificar

1. Lee `git status --short`, la rama activa y los archivos reales afectados. Conserva los cambios del usuario y de otros agentes; no restaures una versión anterior ni limpies el árbol para facilitar tu tarea.
2. Consulta `README.md` y las referencias pertinentes de `docs/README.md`. Para ERP/CRM, localiza «Dónde nos quedamos» en `PLAN_ERP_CRM.md` con `rg` y lee las secciones afectadas: es el único plan vigente y no es necesario releerlo entero. No crees planes paralelos; incorpora ahí el avance cuando el encargo lo requiera.
3. Contrasta los estados documentados con código, pruebas y evidencia disponible. Los manuales fechados pueden describir una interfaz anterior; un plan no demuestra que una función esté implementada o publicada.
4. Delimita rutas, comportamiento, datos y diseño que deben conservarse. En una auditoría, inspecciona y documenta antes de implementar; no cambies registros productivos para comprobar una hipótesis.
5. Selecciona y lee las skills pertinentes a la materia y al formato, cuando estén disponibles. Mantén las skills generales separadas de las convenciones particulares de Fortius.

## Referencias del proyecto

| Tema | Fuente que debes consultar |
| --- | --- |
| Producto y operación | `docs/PRODUCT.md`, `docs/admin-manual.md`, `docs/admin-workspace.md` |
| Desarrollo ERP/CRM | `PLAN_ERP_CRM.md` |
| Panel guiado | `docs/diseno/ENCARGO_REDISENO_PANEL.md` y `docs/diseno/lienzo-panel/` |
| Marca | `docs/brand.md`, `public/brand/`, tokens del CSS existente |
| Identificadores y compatibilidad | `docs/fortius-inmuebles-identity.md` |
| Acceso y datos personales | `docs/erp-crm/access-policy.md`, `docs/erp-crm/privacy/data-processing-register.md` |
| Publicación y entornos | `docs/deployment-fortius.md`, `docs/erp-crm/environment-release.md` |
| Respaldo y restauración | `docs/fortius-inmuebles-backup-restore.md`, `docs/erp-crm/recovery-policy.md` |
| Formatos inmobiliarios | `docs/formatos-admin-status.md` |
| Calculadoras y fuentes | `docs/financial-method.md`, `docs/legal/financial-tools-2026-10-04.md` |
| Contenido editorial | `docs/mercado-inmobiliario-editorial.md` |
| Diseño de interfaz y motion | `.cursor/skills/frontend-design/SKILL.md`, `.cursor/skills/design-taste-frontend/SKILL.md`, `.cursor/skills/emil-design-eng/SKILL.md`, `.cursor/skills/animate/SKILL.md`, `.cursor/skills/cinematic-gsap-lenis-motion-system/SKILL.md` |

Las propuestas de acceso/privacidad y las fuentes jurídicas fechadas conservan sus límites. Verifica fuentes primarias, vigencia, jurisdicción y fecha cuando el encargo cambie reglas legales, fiscales o financieras. No conviertas un formato generado en una aprobación jurídica o autorización para firmar.

## Arquitectura y código

- Usa la pila instalada y `package-lock.json`: Next.js App Router, React, TypeScript estricto, Tailwind, Supabase, Vitest y Playwright. Node.js 24 y npm son la referencia de desarrollo/CI. No actualices dependencias ni regeneres el lockfile sin necesidad del encargo.
- `src/app/`: rutas públicas, panel y API. `src/components/`: interfaz. `src/lib/backend/`: autenticación, contratos, validación, repositorios y archivos. `src/lib/formatos/`: expedientes, documentos y flujo. `src/lib/finance/`, `src/lib/apps/` y `src/lib/comercial/`: lógica especializada. `supabase/migrations/`: evolución SQL. `tests/` y `tools/`: comprobaciones y operación.
- Reutiliza componentes, utilidades y contratos existentes; usa el alias `@/*` hacia `src/*`. Mantén la lógica de negocio comprobable fuera de los componentes cuando corresponda.
- Conserva los límites servidor/cliente. No traslades secretos o consultas privilegiadas al navegador. Las mutaciones deben validar entrada, sesión, rol y alcance del registro en el servidor; ocultar un botón o comprobar una cookie en el proxy no autoriza una operación.
- Conserva el control de versión y los conflictos 409, la protección de cambios sin guardar, el historial y la eliminación recuperable. No sustituyas datos remotos por `localStorage`; las preferencias locales de interfaz son un uso distinto.
- No debilites permisos, RLS, CSP, validaciones, pruebas ni bloqueos de avance para lograr que una pantalla funcione. No introduzcas `any`, supresiones o excepciones generales para esconder un error sin justificar su necesidad concreta.
- Conserva rutas, consultas, redirecciones y contratos técnicos existentes (variables, cookies, RPC, tablas y buckets), salvo cambio expresamente incluido en el alcance. Una actualización de marca no autoriza a renombrarlos.

## Datos, secretos y entornos

- Trata `.env.local` como potencial acceso a datos reales. Verifica el destino sin imprimir credenciales antes de cualquier escritura externa. No presupongas aislamiento por ejecutar en localhost o en un preview.
- **Autorización vigente del titular (17/10/2026, DEC-10 e I-01 del cuestionario):** la base de Supabase actual solo contiene datos de prueba. Mientras siga así, se pueden crear, guardar y borrar datos de ensayo, ejecutar pruebas con escritura y publicar inmuebles de prueba en el sitio para revisar cómo se ve; identifícalos como ejemplo y no los presentes como ofertas vigentes. No envíes correos ni mensajes a personas reales. Cuando el titular borre los datos de prueba y cargue el inventario real, la autorización termina y vuelve la regla de solo lectura en el navegador conectado a esa base.
- Cambios en Supabase, GitHub o Vercel (permisos, configuración, migraciones): hazlos cuando el titular los pida o cuando el encargo los necesite, explicando antes qué vas a cambiar y por qué. Si una indicación nueva contradice una regla vigente, señálalo y deja que el titular decida.
- Nunca muestres ni versiones `.env.local`, tokens, cookies, contraseñas, estados de autenticación o datos personales de clientes. Comprueba presencia y configuración con salida redactada. `SUPABASE_SERVICE_ROLE_KEY` permanece exclusivamente en servidor y nunca lleva prefijo `NEXT_PUBLIC_*`.
- Usa fixtures locales, API simulada o backend aislado para pruebas. `test:live` crea y elimina datos: no lo incluyas en la verificación rutinaria ni lo ejecutes contra producción por defecto. Requiere autorización para las escrituras y destino dedicado comprobado. No envíes correos, invitaciones ni mensajes de ensayo sin autorización explícita.
- Las migraciones se agregan como archivos nuevos con prefijo temporal; no reescribas migraciones ya aplicadas. Comprueba el historial y aplica solo las pendientes en orden. Una prueba local aprobada no acredita que una migración esté aplicada en remoto.
- No ejecutes restauraciones, borrados irreversibles, cambios de roles o configuración de proveedor sin el alcance y la autorización correspondientes. Antes de sobrescribir o limpiar, inspecciona y conserva una copia recuperable cuando proceda; no borres archivos ajenos al encargo.
- La proyección pública contiene solo campos autorizados. Documentos privados y perfiles internos no deben filtrarse por API pública, Storage, logs, HTML, PDF ni metadatos. Guardar y publicar son acciones distintas; no publiques como efecto lateral de guardar.

## Interfaz y experiencia

- Conserva el diseño aprobado, los recursos de marca y los textos solicitados. Fortius usa Archivo, azul `#061F3F`, borgoña `#8A1634`, blanco y acento `#E5829B`; reutiliza los tokens existentes y sus variantes de tema.
- Al crear o cambiar presentación, composición o movimiento, lee antes las skills de `.cursor/skills/`: `frontend-design` y `design-taste-frontend` para dirección visual; `emil-design-eng` y `animate` para pulido y animación de interfaz; `cinematic-gsap-lenis-motion-system` solo si el encargo pide un lenguaje de movimiento por scroll en el sitio público. La marca, el lienzo aprobado y los tokens existentes mandan cuando ya fijan paleta, tipografía o layout. Esas skills no autorizan dependencias nuevas: GSAP y Motion ya están instalados; Lenis no.
- Para trabajo del panel guiado, lee completo `docs/diseno/ENCARGO_REDISENO_PANEL.md` y la fase correspondiente del plan antes de editar. El lienzo aprobado es la referencia visual principal; los bocetos son secundarios. Reutiliza `src/components/admin/kit.tsx` y sus tokens; no agregues estilos al `panel.module.css` que se está retirando. Respeta los límites específicos del encargo sobre API, base de datos, dependencias y sitio público; no los extiendas a encargos ajenos al rediseño.
- Usa lenguaje sencillo orientado al asesor y una acción principal clara. Los detalles técnicos pertenecen a la implementación, salvo que ayuden al usuario a decidir. Mantén el significado de requisitos, evidencia, revisiones y bloqueos del servidor.
- Conserva claro/oscuro, navegación por teclado, foco visible, nombres accesibles, contraste, objetivos táctiles de al menos 44 px y `prefers-reduced-motion`. Comprueba móvil y escritorio; evita que barras fijas tapen contenido o acciones.
- Verifica carga, vacío, error, permiso insuficiente y guardado/conflicto cuando sean pertinentes. Un dato demo debe identificarse como ejemplo; no inventes contactos ni presentes ofertas, precios o documentos ficticios como vigentes.
- En formatos inmobiliarios mapea primero los campos de la plantilla del titular; conserva contenido, cálculos, cláusulas y diseño protegidos. No agregues opciones jurídicas o fiscales sin respaldo. Si el original contradice una regla del panel, expón la discrepancia antes de cambiar su significado o sus bloqueos de emisión.
- En documentos y PDF inspecciona el archivo renderizado, incluidos datos largos y varias páginas cuando aplique; no incluyas instrucciones para IA, notas del redactor ni comentarios internos en entregables para clientes.

## Desarrollo local y comprobaciones

Consulta los scripts reales en `package.json` y `.github/workflows/verify.yml`; son la referencia ejecutable. En PowerShell usa `npm.cmd` si la política impide ejecutar `npm.ps1`, sin cambiar la política del sistema.

| Necesidad | Comando o criterio |
| --- | --- |
| Instalar dependencias del lockfile | `npm ci` |
| Servidor local según README | `npm run dev -- --hostname 127.0.0.1 --port 3001` |
| Lint / tipos | `npm run lint` / `npm run typecheck` |
| Backend / panel | `npm run test:backend` / `npm run test:admin` |
| Verificación de código antes de integrar | `npm run verify` (lint, tipos, ambas suites y build) |
| Herramientas de respaldo/restauración | `node --test tests/tools/*.test.mjs` |
| Activos PDF del despliegue | `node tools/verify-pdf-bundle.mjs` |
| Navegador público | `npm run test:public:browser` (build previo; fixtures locales; puertos 3100/3101) |
| Navegador del panel | `npm run test:admin:browser -- <archivo.spec.ts>` (build previo; revisar entorno y config) |
| Fuentes financieras | `npm run check:financial-sources` cuando cambien esas fuentes o cálculos |
| Salud tras publicación autorizada | `npm run health -- https://fortiusinmuebles.com --json` (solo lectura) |

Antes de iniciar un servidor revisa el puerto y los procesos existentes; no detengas procesos ajenos. Respeta el puerto solicitado o ya acordado y alinea las variables del entorno de prueba. Comprueba una respuesta de la ruta: obtener un PID o una línea «Ready» no acredita que funcione.

Escala las comprobaciones al cambio: una edición de Markdown requiere lectura completa, enlaces/rutas y diff; no exige compilar la aplicación. Para cambios de código ejecuta las pruebas afectadas y `npm run verify` antes de integrar. Añade las suites de navegador, herramientas o PDF que correspondan; evita repetir checks aprobados sin una razón nueva. No borres ni debilites pruebas para obtener verde.

Para cambios visuales inspecciona las vistas reales en móvil y escritorio, claro/oscuro, teclado y movimiento reducido. Una captura sin desbordamiento no basta para evaluar composición y utilidad. Lighthouse mide laboratorio; HTTP 200, mocks y pruebas locales no acreditan rendimiento de usuarios, permisos remotos ni un flujo productivo completo.

Conserva evidencia sanitizada en las carpetas ignoradas previstas (`tmp/` o `.superpowers/`), sin agregar artefactos temporales al commit. Registra qué pasó, falló, quedó bloqueado o no se comprobó. Después de corregir, repite las comprobaciones afectadas y revisa el conjunto.

## Integración, publicación y cierre

- No hagas commits, push, merge ni despliegues por asumir que editar código los incluye. Si ya están autorizados en el encargo, completa la preparación y las comprobaciones sin pedir de nuevo el mismo permiso. No uses `reset --hard`, force-push ni limpieza destructiva para resolver divergencias.
- Producción se sirve desde `main` en Vercel; comprueba la configuración actual antes de publicar. Sigue `docs/erp-crm/environment-release.md`. La autorización de desarrollo no equivale a autorización de producción; una excepción para una rama no habilita otros previews. **Autorización del titular (17/10/2026, I-04):** el agente puede integrar en `main` y publicar lo que el encargo necesite, con la verificación aprobada; avisa antes de aplicar una migración de base de datos y explica qué cambia.
- Revisa el diff completo y el estado final. Entrega cambios acotados, sin archivos ni refactorizaciones ajenos al objetivo. Actualiza la documentación afectada para reflejar comportamiento real y conserva los pendientes explícitos.
- Usa `gauntlet-review` con un crítico en contexto limpio para modificaciones amplias, entregables completos para clientes/presentación y análisis que sustenten decisiones importantes. Conserva evidencia interna; no simules independencia ni declares aceptación completa cuando falte una comprobación obligatoria.
- Cierra brevemente con qué cambió, cómo se comprobó y los límites materiales. Distingue trabajo local, commit, integración y publicación; no declares CI, despliegue, recuperación o funcionamiento productivo verificados sin evidencia de esa revisión y ese entorno.

## Documentación de Next.js instalada

Conserva el bloque siguiente: lo administra `next dev`. Antes de escribir código de Next.js, consulta la guía pertinente de la versión instalada; no apliques recetas de otras versiones por memoria.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
