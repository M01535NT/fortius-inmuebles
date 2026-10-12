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
| BAS-01 | en_revision | Correcciones cotejadas; lint/TypeScript/710 tests/build y 21 escenarios de navegador pasaron. Revisión independiente realizada; aceptación de negocio pendiente. |
| REC-01 | en_revision | DB aislada, reconciliación DB/objetos, huellas y copia local implementadas/probadas; servicio Auth/Storage y objetivos aún pendientes. |
| CI-01 / ENV-01 | bloqueada parcialmente | Preflight local implementado; Repo público autorizado; conexión GitHub sin Administration write. Checks nativos Vercel activados; pruebas controladas y backend preview separado en revisión. |
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

## Revisión independiente y correcciones

Un revisor independiente examinó la rama contra la base `4faaa123`, ejecutó tests locales y reprodujo dos hallazgos importantes con datos sintéticos. No modificó archivos ni infraestructura.

- Corregido: una repetición reciente de un run Verify antiguo podía ignorarse al ordenar solo por created_at. Se considera actividad de ejecución (`run_started_at`/`updated_at`), con metadata incompleta denegada. Test nuevo mostró autorización incorrecta antes y rechazo después.
- Corregido: las FK podían estar válidas aunque `records.data` apuntara a otra identidad y el índice de referencias siguiera viejo. El ensayo regenera referencias con la función SQL migrada en la base aislada y exige igualdad con el export. Referencias inexistentes/inventario ausente se rechazan. Test mostró aceptación incorrecta antes y rechazo después.
- Ruling: no aplicar validadores de nuevas escrituras a todo el JSON histórico para recuperar — eso podría rechazar estados legacy permitidos en su fecha — comprobar derivación de relaciones e igualdad del snapshot, sin normalizar fuente — costo residual: este ensayo no certifica todas las reglas de cada trigger de negocio.
- Ruling: el mensaje «deployment remains blocked» se trata como afirmación importante de alcance, aunque el revisor lo calificó menor — cambiar a «preflight denied» y probar CLI sin repositorio — costo evitado: atribuir al proveedor un control que el comando no implementa.

Suite de herramientas tras correcciones: 12 casos ejecutados y aprobados; lint de los scripts/tests aprobado, diff sin errores de espacio. Código de aplicación no cambió en la corrección de estos scripts: conserva la comprobación completa de 710 tests/build y 21 escenarios de navegador de esta sesión. No se realizó otra revisión independiente de la misma rama: los hallazgos se verifican mediante sus reproducciones y suite. No quedan hallazgos del revisor diferidos; los límites del proveedor siguen abiertos.

## Dependencias de aceptación

- Objetivos y custodia de recuperación aprobados; prueba completa en destino aislado autorizado.
- Acceso administrativo para controles GitHub/Vercel y verificación de proveedor.
- Buzón/cuenta controlados y autorización de envío para prueba de recuperación/invitación.
- Revisión profesional de tratamiento, conservación y solicitudes de privacidad.

## Resolución de accesos y publicación — continuación

- Remoto confirmado: `M01535NT/fortius-inmuebles`; carpeta local histórica `mnt-inmuebles`. Main productiva sigue en `4faaa123`.
- Sesión Vercel oficial autorizada; se inspeccionaron los dos proyectos vinculados, dominios, variables por nombre/ámbito y despliegues. La publicación tras Verify fallido se confirmó en metadata histórica.
- Repositorio público con autorización expresa y cambio realizado por Moisés: API de integración no puede editar visibilidad ni protección (403). JSON de main preparado; secreto administrativo pendiente.
- Deployment Checks creados en Fortius/MNT; lectura posterior y prueba controlada pendientes de registro final. Solo previews autorizados por CI-01, sin promoción productiva.
- Nuevos previews sin credenciales backend productivas. No confundir esto con un backend de ensayo completo ni revocación de variables en previews antiguos.
- Metadata de backups del proveedor sin PITR ni copias listadas; objetivos y custodia requieren decisión informada.
