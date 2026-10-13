# Roadmap técnico propuesto

No ejecutado. El orden se ajusta a evidencia y riesgo; no es una autorización de implementación.

| Fase | Naturaleza | Trabajo | Criterio de aceptación / dependencia |
|---|---|---|---|
| 0 — Correcciones prioritarias | Indispensable para continuidad | F01 recuperación, F02 dominios Auth, F03 CI/publicación | Restauración aislada reconciliada DB/archivos; recuperación a dominio correcto; commit de producción con checks obligatorios verdes. Requiere autorización de cambios y accesos. |
| 1 — Estabilización | Indispensable / política acordada | F04 inventario deploys; F05/F06 paginación; F08 contrato público; F09 logs; F10 MFA | Sin omisiones por paginación; PDF/proyección coinciden en datos autorizados; incidente rastreable sin PII; enrolamiento y recuperación MFA probados. Confirmar entornos antes de intervenir. |
| 2 — Modularización | Mejora gradual | F11 contratos independientes, casos de uso, pruebas de límites | Módulos backend sin dependencia de estado React; regresión verde; comportamiento conservado. |
| 3 — Escalabilidad | Condicionada a medición | F07 locks, índices, caché, tamaños y trabajos largos | Línea base y resultado medido; integridad concurrente conservada; worker solo si aporta. |
| 4 — Capacidades nuevas | Opcional / aprobación de negocio | F12 compuertas, CRM ampliado, portales, rentas, reportes, IA/RAG | Caso de uso, responsable, fuentes, presupuesto y aceptación por capacidad. |

Antes de cualquier cambio: confirmar estado remoto, preservar cambios ajenos y usar datos sintéticos o cuentas controladas para pruebas. No retirar el proyecto antiguo antes de verificar dependencias Auth y enlaces. No eliminar el lock global antes de probar integridad. No migrar todo records a tablas nuevas sin beneficio concreto y plan reversible.
