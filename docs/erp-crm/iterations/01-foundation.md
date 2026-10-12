# Iteración 1 — continuidad de Fortius

Plan: `docs/superpowers/plans/2026-10-12-fortius-erp-crm-primeras-iteraciones.md`.
Base: `4faaa1234ade05b013994821585c52f9cb6cebd9`.
Rama: `feature/fortius-erp-crm-foundation`.
Autorización: Moisés aprobó el plan y pidió comenzar el 12 de octubre de 2026.

## Alcance de esta entrega

Consolidar correcciones locales anteriores, repetir verificaciones, completar pruebas de recuperación sintética y preparar controles de continuidad y tratamiento de datos. No aplicar políticas de negocio, exportar clientes ni publicar producción sin autorización correspondiente.

## Preflight y decisiones de ejecución

- BAS-01 → REC-01: exportación y restauración actuales deben conservar los mismos nombres de tabla; revisados antes de ampliar Storage.
- BAS-01 → OBS-01: el requestId actual no altera el contrato de error ni expone excepciones; probar sin duplicar implementación.
- REC-01 → futuras migraciones: inventario debe detectar tablas nuevas y exigir actualización de cobertura.
- Ruling: usar el checkout cloud aislado ya disponible en una rama, sin crear otro worktree — la guía de onboarding indica reutilizar este entorno — costo si no basta: revisar aislamiento antes de una tarea concurrente.
- Ruling: preservar implementación previa y verificarla; no borrar código por falta de ciclo TDD observado en esta sesión — ya es trabajo anterior del usuario/sesión — costo si hay regresión: reproducir y corregir con test nuevo.
- Ruling: aprobación del plan autoriza desarrollo, rama y commits revisables; no es autorización de producción ni responde los valores RPO/RTO, exigencia MFA o retención — preparar propuestas sin activarlas — costo: esos resultados externos siguen pendientes de decisión.

## Estado por entrega

| Entrega | Estado | Evidencia / límite |
|---|---|---|
| BAS-01 | en_revision | Correcciones cotejadas; lint/TypeScript/710 tests/build y 21 escenarios de navegador pasaron. Revisión independiente pendiente. |
| REC-01 | en_revision | DB aislada, reconciliación DB/objetos, huellas y copia local implementadas/probadas; servicio Auth/Storage y objetivos aún pendientes. |
| CI-01 / ENV-01 | bloqueada parcialmente | Preflight local implementado; GitHub privado exige plan superior para rulesets; Vercel sin autenticación disponible. |
| AUT-01 | bloqueada parcialmente | URL Auth confirmada; pruebas existentes de auth pasaron; falta prueba de envío y MFA recuperable en cuenta controlada. |
| OBS-01 | en_revision | requestId y logs sin PII probados; captura/retención/alertas del proveedor pendientes. |
| PRV-01 | en_revision | Inventario y fuentes oficiales recuperados; conservación/fundamento/aceptación profesional pendientes. |

## Verificaciones de esta sesión

- `npm run verify`: exit 0; lint, TypeScript, 499 pruebas backend, 211 administrativas y build aprobados.
- `node tools/verify-pdf-bundle.mjs`: exit 0; activos PDF/fuentes/bibliotecas presentes.
- Playwright: 21 escenarios de admin-workspace/panel aprobados en Chromium instalado, con backend sintético y producción inaccesible desde la configuración de pruebas. Anchos 320/375/390/414/768/1024/1440, contraste, barra lateral, errores y captura. No equivale a prueba en iPhone real.
- Nuevos tests negativos DB/objeto/huellas/privacidad fallaron antes de implementar y pasaron después. Symlink fuera de respaldo reproducido sin el guard y rechazado al reponerlo. Preflight de release tuvo fallo por función ausente y pasó sus contratos.
- `node tools/fortius-release-check.mjs`: rechazó correctamente el árbol con cambios pendientes; no se intentó publicar.
- Lectura de catálogo Supabase confirmó 18 tablas con RLS, cinco buckets y 22 migraciones; no se consultaron filas de clientes ni se escribieron datos remotos.
- Ruling: `npm run test:backend -- ARCHIVOS` agrega rutas al argumento `tests/backend` del script y ejecuta toda esa suite — se registran las 499 pruebas reales, sin decir que fue una prueba enfocada — costo: una ejecución adicional, no debilitar el alcance reportado.

## Matriz de consolidación

| Grupo de archivos | Origen | Comprobación |
|---|---|---|
| `backend/http`, observabilidad, `domain/records` y consumidores de tipos | Corrección anterior | Suites backend/admin y compilación. |
| API expedientes y pruebas de página/compatibilidad | Corrección anterior | Suite backend y regresión de panel. Consumidores legacy aún reúnen todas las páginas. |
| Migración de proyección pública y tests SQL | Corrección anterior, ya registrada remota | Metadata de migraciones y tests SQL locales; sin ejecutar otra migración. |
| Export 18 tablas y ensayo PGlite | Corrección anterior | Cobertura y restauración sintética actuales. |
| Reconciliación de archivos, recuperación local y release-check | Implementación de esta iteración | Tests negativos RED→GREEN; suite de herramientas. |
| Políticas y planes ERP, documentación de auditoría | Documentación local autorizada previamente/esta iteración | Fuentes y límites explícitos; sin secretos ni expedientes de clientes. |

Archivos de `test-results/` se conservan como artefactos locales e ignoran en Git; copias privadas y scratch nunca se incluyen en el commit.

## Dependencias de aceptación

- Objetivos y custodia de recuperación aprobados; prueba completa en destino aislado autorizado.
- Acceso administrativo para controles GitHub/Vercel y verificación de proveedor.
- Buzón/cuenta controlados y autorización de envío para prueba de recuperación/invitación.
- Revisión profesional de tratamiento, conservación y solicitudes de privacidad.
