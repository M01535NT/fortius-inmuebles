# MNT Inmuebles — implementación y evidencia

Plan autorizado: cambio integral de marca, logo arquitectónico vectorial, backend y almacenamiento MNT, correcciones funcionales, blog público y cierre técnico. Se conservan diseño, ambos temas, datos, versiones e independencia de otros productos. El historial Git y las migraciones aplicadas son antecedentes inmutables.

## Estado de ejecución

1. Inventario y respaldo: confirmado; comparación con propietario y restauración aislada satisfactorias.
2. Identidad vectorial: confirmado; 12 SVG, favicon, imagen social y dos PDF revisados.
3. Renombrado: repositorio y servicios confirmados; migraciones 003, 004 y 005 aplicadas y comprobadas en la misma instancia.
4. Funcionalidad y accesibilidad: implementado y verificado localmente.
5. Blog y SEO: publicación, edición, retirada, URL estable y 404 comprobados contra persistencia real.
6. Seguridad y recuperación: pruebas locales, restauración aislada y 20 comprobaciones de integración real aprobadas.
7. Despliegue: publicado y verificado; cierre de carpeta y proyecto guardado en ejecución.

## Decisiones

- Rama `codex/mnt-inmuebles-entrega` en la carpeta existente; mantener una sola carpeta activa y efectuar el traslado final al concluir la verificación.
- Conservar migraciones 001 y 002; añadir migración incremental y probar tanto la actualización como una instalación desde cero.
- No contratar servicios. No sustituir contactos pendientes por direcciones inventadas.
- Las escrituras reales y los correos de terceros no se ejecutarán como parte de pruebas offline.
- Reparto de archivos: identidad y recursos; correcciones de interfaz; blog; controlador de backend, integración, infraestructura y reporte.

## Evidencia inicial

- Base: commit `40ecf4a`; árbol de código limpio, salvo configuración local preexistente en `.claude/`.
- Resultados finales, respaldos y dependencias externas se registrarán al verificarse; no se presume que la entrega anterior pruebe el estado nuevo.

## Verificación previa al corte — 5 de septiembre de 2026

- `npm run verify`: lint, TypeScript, 107 pruebas de backend, 82 administrativas y compilación de producción aprobados. 55 rutas y Proxy de Next reconocidos.
- Navegador sobre compilación de producción con backend inaccesible: 8 regresiones aprobadas. Panel con respuestas controladas: 10 recorridos aprobados. Las pruebas con API simulada no demuestran escrituras reales.
- `npm audit --omit=dev`: cero vulnerabilidades conocidas al revisar. No constituye garantía de ausencia de vulnerabilidades.
- Pruebas independientes encontraron y corrigieron exclusión de buckets privados antiguos, mezcla de monedas, comisión cero, desbordamiento numérico, foco inicial y configuración de CI.
- Los cambios de contenido de 004 modifican exactamente tres registros; los otros once permanecen intactos. Las tres revisiones avanzan legítimamente; se conservan las 24 identidades de revisión, incluidos registros eliminados.

## Respaldo y procedencia

Respaldo local excluido de Git: `.superpowers/backups/2026-09-06T01-41-21-144Z`. Contiene 14 registros, una membresía, tres relaciones, tres límites y 24 revisiones. Storage confirmó tres buckets y cero objetos; los siete archivos del catálogo referencian recursos del repositorio. El historial completo de Git se conservó en un bundle local adicional.

El respaldo de base de datos se reconstruyó con las lecturas REST y el registro de revisiones observado en la consulta autorizada del propietario. Los cinco hashes canónicos PostgreSQL coincidieron exactamente con una consulta independiente del propietario. No se presenta como descarga SQL original. El manifiesto SHA-256 protege los archivos locales; los ensayos de restauración, contenido y reversión tienen informes separados.

La copia local y el ensayo PGlite cubren datos de la aplicación y objetos de Storage. No sustituyen un respaldo completo del proveedor Auth ni una copia cifrada fuera del equipo. Véanse [respaldo y restauración](fortius-inmuebles-backup-restore.md) y [corte y reversión](fortius-inmuebles-cutover-rollback.md).

## Identidad y excepciones históricas

- Repositorio existente: `M01535NT/mnt-inmuebles`, identidad GitHub conservada. `origin` actualizado.
- Vercel: `mnt-inmuebles`, mismo proyecto e integración; `mnt-inmuebles.vercel.app` registrado.
- Supabase: `mnt-inmuebles`, misma instancia y usuarios. URL principal y retornos de autenticación MNT configurados.
- Las migraciones aplicadas 001/002, las transformaciones de 003/004, el inversor, las pruebas de migración, los rechazos de URLs privadas antiguas y la redirección del PDF conservan nombres históricos intencionadamente.
- Los documentos `docs/archive/` son evidencia histórica. El archivo recuperable anterior sigue descrito en su manifiesto original; no se modifica ni se mezcla con otros productos.
- La raíz final prevista es `C:\Paginas-web\MNT-Inmuebles`. El cambio físico se hace al terminar la publicación y comprobar los procesos que usan la carpeta.

## Dependencias para operación comercial

Confirmadas en los paneles: Vercel Hobby, Supabase Free y correo Auth predeterminado. La captación queda deshabilitada en interfaz y servidor mediante `MNT_PUBLIC_LEADS_ENABLED=false`. Los contactos ficticios identificados se retiran; los definitivos siguen pendientes.

Antes del lanzamiento comercial se requiere alojamiento compatible: [Vercel limita Hobby al uso personal no comercial](https://vercel.com/docs/plans/hobby). No se contrató otro plan. También se requiere correo de recuperación adecuado: [el SMTP predeterminado de Supabase limita destinatarios al equipo y no ofrece garantía de entrega](https://supabase.com/docs/guides/auth/auth-smtp).

Definir destino externo cifrado, retención y ejecución periódica de respaldos; se recomienda respaldo diario y ensayo mensual, además de cada migración. [Supabase recomienda exportaciones externas en Free y separa el respaldo de objetos Storage](https://supabase.com/docs/guides/platform/backups). Contactos, textos legales definitivos, propiedades reales, dominio comercial y parámetros documentados del estimador siguen siendo dependencias de lanzamiento, sin contratar servicios ni inventar datos.

## Resultado del corte y aceptación real — 5 de septiembre de 2026, hora local

- Producción: [mnt-inmuebles.vercel.app](https://mnt-inmuebles.vercel.app), mismo proyecto de alojamiento. PR #1 integrado; cambios posteriores de aceptación registrados en `main`. El dominio anterior redirige con 308 y conserva rutas y parámetros; se comprobaron inicio, inventario con filtro y `/admin`.
- 003 preservó exactamente las cinco huellas de la base original. 004 cambió los tres registros previstos y dejó once intactos; la huella completa de las 24 revisiones coincidió con el ensayo: `c825066769d536ea253a2ac032e2a386`.
- Se corrigió una restricción del Storage administrado: la política se recrea de manera transaccional, sin cambiar propietario ni permisos. El primer intento falló y se revirtió íntegro; el ensayo real de la operación equivalente y el segundo corte fueron satisfactorios.
- 005 retiró el único lector temporal antiguo. Consulta del propietario posterior: cero relaciones, funciones o políticas `cota_*` activas. Los tres buckets originales vacíos permanecen como recuperación; existen los tres buckets MNT con su privacidad correspondiente.
- Integración real: **20 comprobaciones aprobadas** desde el build de producción local contra el Supabase dedicado. Incluyen administrador/editor/no miembro, dos sesiones, renovación, cookies inválidas, 409, revisiones y concurrencia, publicación y retirada de fichas y blog, HTML escapado, slugs únicos/estables, cinco formularios con persistencia, CRUD de colecciones, archivos públicos/privados con hashes, límites de carga, staging incompleto, logout y recuperación con token del proveedor sin envío de correo.
- Aceptación adicional directamente en Vercel: **19 comprobaciones aprobadas**; las cinco captaciones se excluyeron para conservar el bloqueo comercial de producción. La prueba de vencimiento usa una fecha de época para evitar falsos resultados por el desfase observado entre los relojes local y remoto.
- Limpieza de la ronda local completa: 15 registros temporales, cinco rutas de objetos y dos usuarios de prueba retirados; la ronda final de Vercel retiró diez registros, cinco rutas de objetos y dos usuarios. Verificación posterior: **14 registros, una membresía, un usuario Auth, tres relaciones y cero objetos**. Los datos conservados coinciden con el ensayo. Se preservan **59 entradas del registro de revisiones**: las 24 originales más 35 identidades de prueba eliminadas entre todos los intentos; son tombstones de control de versiones, no contenido residual.
- Producción devuelve 503 en ambas rutas de captación desactivada y 401 al consultar sesiones o clientes sin autenticación. No se habilitó la captación del sitio para hacer pruebas.
- Salud pública: **28 rutas del sitemap, 37 solicitudes**, 34 respuestas 200, una 308 y dos 404 reales. Mediana HTTP 175,9 ms; percentil 95 de 945,5 ms en la muestra del corte. Son tiempos de solicitud, no Lighthouse ni Core Web Vitals de usuarios reales.
- La prueba real detectó un 200 prematuro para contenido retirado causado por el estado global de carga. Se trasladó ese estado a `/admin`; los recorridos reales de publicación y retirada y el comprobador público confirman 404.
- Revisión visual de 30 combinaciones: cinco rutas, tres tamaños y dos temas; sin desbordamientos ni errores JavaScript. Menú probado con teclado, símbolo a 24 px, favicon a 16 px y pie visible. Se añadió H1 al blog y se corrigió la entrada del hero con movimiento reducido.
- Suite automatizada: **222 pruebas aprobadas** en [CI del commit funcional final 67704e9](https://github.com/M01535NT/mnt-inmuebles/actions/runs/34007290465): 115 de backend, 82 administrativas y 25 de navegador (18 de panel/regresiones y siete de formularios), además de instalación, lint, tipos y compilación. El ajuste final usa `/admin` para comprobar el arranque con backend público inaccesible. Los cambios posteriores del verificador live y documentación no alteran ese código funcional.

Evidencia privada local: `.superpowers/live-verification-expanded.log`, `.superpowers/live-verification-vercel-final.log`, `.superpowers/mnt-health-production.json`, `.superpowers/mnt-visual/`, y `live-content-integrity.json` / `final-integrity.json` dentro del respaldo. La revisión desplegada final confirmó H1 del blog y ausencia de movimiento del hero incluso sin JavaScript. No contienen secretos en los reportes resumidos; el respaldo completo sí contiene datos privados y permanece excluido de Git.

## Límites y siguientes acciones

| Estado | Área | Acción |
|---|---|---|
| Pendiente del titular | Alojamiento comercial | Elegir un plan compatible antes de usar comercialmente el sitio. |
| Pendiente del titular | Correo Auth | Configurar SMTP y probar recepción real de recuperación e invitaciones. El callback y cambio de contraseña sí se probaron con tokens reales. |
| Pendiente de definición operativa | Respaldo externo | Fijar destino cifrado, retención, periodicidad y responsable. El respaldo local y la restauración aislada están comprobados. |
| Pendiente de definición operativa | Monitoreo continuo | Activar un servicio o ejecución periódica del comando de salud. El endpoint, el comando y CI están implementados; no existe vigilancia continua contratada. |
| Pendiente editorial | Lanzamiento | Sustituir propiedades, asesores y documentos demo; validar contactos, textos legales, fuentes y parámetros del estimador. |
| Requiere cerrar Codex | Ubicación local | Windows impide renombrar la raíz mientras Codex la mantiene abierta. El ayudante de traslado espera hasta 30 minutos al cierre de la aplicación y registra el resultado en `C:\Paginas-web\MNT-traslado-resultado.json`. |

La renovación se fuerza retirando el access token y conservando un refresh token válido; no se espera el vencimiento natural. Se comprueba rechazo de un enlace privado falsificado y vencido, y de un ticket de carga correctamente firmado pero vencido; no se esperó el TTL real de cada enlace. La interrupción probada prepara staging y no transmite bytes; no simula un corte físico a mitad de transferencia. La restauración aislada usa PGlite para datos y estructura de la aplicación, no una restauración integral de Supabase Auth. Estos límites no deben presentarse como pruebas ejecutadas.

### Traslado local preparado

`tools/finish-local-relocation.ps1` se ejecuta desde una copia fuera de la carpeta. No cierra aplicaciones. Antes de mover exige origen y destino exactos, destino inexistente, mismo commit y árbol limpio; después verifica el commit y el respaldo, actualiza únicamente el proyecto guardado y sus rutas asociadas, e inicia el servidor local con captación desactivada. Si algo cambia o falla, escribe `needs_attention` y no fuerza el traslado ni borra datos. La sintaxis y las guardas fueron revisadas; la ejecución completa queda pendiente de liberar la carpeta. El nombre MNT está escrito en la configuración guardada, pero la instancia abierta de Codex conserva su vista anterior hasta reiniciarse.

Al reabrir Codex, consultar `C:\Paginas-web\MNT-traslado-resultado.json`: solo `completed` junto con `sourceAbsent`, `backupVerified` y `localHealth` verdaderos confirma el cierre del traslado. `waiting_for_codex_exit` significa que todavía espera; `needs_attention` conserva el motivo concreto. Si se agota el plazo, volver a ejecutar el ayudante con el commit actual verificado; no volver a correr las migraciones de base de datos.

## Entregables

- [Guía y archivos vectoriales](brand.md).
- [Manual de administración](admin-manual.md).
- [Respaldo y restauración](fortius-inmuebles-backup-restore.md).
- [Corte y reversión](fortius-inmuebles-cutover-rollback.md).
- `npm run verify`, CI y `npm run health` para comprobaciones reproducibles. El comprobador de salud es manual; no se ha contratado monitoreo externo ni prometido vigilancia continua.
