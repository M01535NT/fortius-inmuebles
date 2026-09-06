# MNT Inmuebles — implementación y evidencia

Plan autorizado: cambio integral de marca, logo arquitectónico vectorial, backend y almacenamiento MNT, correcciones funcionales, blog público y cierre técnico. Se conservan diseño, ambos temas, datos, versiones e independencia de otros productos. El historial Git y las migraciones aplicadas son antecedentes inmutables.

## Estado de ejecución

1. Inventario y respaldo: confirmado; comparación con propietario y restauración aislada satisfactorias.
2. Identidad vectorial: confirmado; 12 SVG, favicon, imagen social y dos PDF revisados.
3. Renombrado: servicios y repositorio confirmados; migraciones 003/004 ensayadas, corte pendiente.
4. Funcionalidad y accesibilidad: implementado y verificado localmente.
5. Blog y SEO: implementado; publicación real pendiente del corte.
6. Seguridad y recuperación: pruebas locales y restauración aprobadas; integración real pendiente.
7. Despliegue, carpeta y cierre: en ejecución.

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

La copia local y el ensayo PGlite cubren datos de la aplicación y objetos de Storage. No sustituyen un respaldo completo del proveedor Auth ni una copia cifrada fuera del equipo. Véanse [respaldo y restauración](mnt-backup-restore.md) y [corte y reversión](mnt-cutover-rollback.md).

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

## Entregables

- [Guía y archivos vectoriales](brand.md).
- [Manual de administración](admin-manual.md).
- [Respaldo y restauración](mnt-backup-restore.md).
- [Corte y reversión](mnt-cutover-rollback.md).
- `npm run verify`, CI y `npm run health` para comprobaciones reproducibles. El comprobador de salud es manual; no se ha contratado monitoreo externo ni prometido vigilancia continua.
