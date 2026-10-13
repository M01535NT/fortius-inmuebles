# Decisiones arquitectónicas propuestas

Estado de todas las decisiones: **PROPUESTO**, pendientes de aprobación técnica y de negocio. No describen cambios realizados.

| ADR | Decisión | Motivo / contrapartida |
|---|---|---|
| 001 | Conservar monolito modular | Menor costo operativo; límites internos requieren disciplina. |
| 002 | Autorización en servidor y DB, independiente de UI | Impide que ocultamiento visual sustituya seguridad; mantener pruebas coherentes entre capas. |
| 003 | Conservar integridad transaccional en PostgreSQL | FK/RLS/versiones cerca de datos; SQL debe seguir versionado y probado. |
| 004 | Extraer contratos del store administrativo | Reduce acoplamiento; refactor gradual sin cambio de API accidental. |
| 005 | Entornos separados con datos y credenciales propios | Limita efecto de previews; primero verificar configuración real y costo. |
| 006 | Proyección pública como contrato explícito | Evita discrepancias SQL/TS/PDF y exposición accidental; pruebas compartidas. |
| 007 | Recuperación comprobada antes de ampliar automatización documental | Protege custodia; requiere ensayo aislado y responsables. |
| 008 | No integrar OS hasta definir dueño de datos | Evita duplicación y conflictos; retrasa reutilización hasta mapa de entidades. |

Alternativas consideradas y costos en to-be/architecture.md. Cada ADR deberá obtener propietario, fecha de aceptación y criterios de reversión al aprobarse; no se inventan aprobaciones.
