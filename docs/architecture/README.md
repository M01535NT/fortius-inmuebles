# Arquitectura de Fortius

Documentación técnica y documental del commit `4c0c0d218e0212bfad4d6d8a5b6ffb6f2b16b923`, corte 10/10/2026. No implica implementación de recomendaciones.

- [Informe final en HTML autónomo](final-report.html), con imágenes integradas y fuentes descargables.
- [Informe final consolidado en Markdown](final-report.md).
- [Resumen ejecutivo](audit/executive-summary.md).
- [Evidencias y límites](evidence.md).
- [Arquitectura actual](as-is/architecture.md).
- [Arquitectura objetivo](to-be/architecture.md).
- [Hallazgos](audit/findings.md) y [roadmap](audit/roadmap.md).
- [Decisiones propuestas](adr/README.md).
- [Renderizado y reproducibilidad](render-status.md).

C4 actual: [contexto](as-is/context.puml), [contenedores](as-is/containers.puml), [componentes](as-is/components/application.puml), [código](as-is/code/record-write.puml).
Complementos: [despliegue](as-is/deployment.puml), [datos](as-is/data-model.puml), [autenticación](as-is/sequences/authentication.puml), [emisión](as-is/sequences/document-emission.puml).
C4 propuesto: [contexto](to-be/context.puml), [contenedores](to-be/containers.puml), [componentes](to-be/components/domains.puml).

CONFIRMADO = evidencia; INFERIDO = interpretación pendiente; NO VERIFICADO = acceso/evidencia insuficiente; PROPUESTO = recomendación futura. Diagramas objetivo separados de actuales.
