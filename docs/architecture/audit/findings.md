# Informe de auditoría

No se confirmó un hallazgo crítico. Esto no certifica ausencia de vulnerabilidades: el alcance no incluye penetración, restauración ni pruebas de carga. Severidad es consecuencia potencial; prioridad ordena trabajo. Estimaciones en días de ingeniería, sujetas a diagnóstico y validación; no deben sumarse sin considerar solapamientos.

| ID / severidad / prioridad | Componente y evidencia verificable | Riesgo o consecuencia | Recomendación | Esfuerzo / dependencias |
|---|---|---|---|---|
| F01 · Alto · P0 | CONFIRMADO: tools/fortius-inmuebles-backup.mjs y owner-export.sql enumeran16 tablas; faltan record_history y expediente_actividad. Ensayo restore-rehearsal conserva modelo cota. API backups sin entradas y PITR=false [E10]. | INFERIDO: recuperación incompleta de trazabilidad y restauración no demostrada. No prueba que no existan respaldos externos. | Inventariar DB/Auth/Storage, exportar esquema/datos necesarios, definir RPO/RTO y ejecutar restauración aislada verificable. | 2–4d; destino aislado, custodia y autorización de prueba. |
| F02 · Alto · P0 | CONFIRMADO: config/auth site_url=mnt-inmuebles.vercel.app/admin y allowlist sin fortiusinmuebles.com; recovery solicita dominio de request [E09,E03]. | INFERIDO: recuperación/invitación puede redirigir al dominio antiguo o no cumplir el flujo esperado. No se envió correo. | Corregir URLs exactas autorizadas y probar recuperación/invitación con cuenta controlada. | 0.5–1d; acceso/config Auth y buzón de prueba. |
| F03 · Alto · P0 | CONFIRMADO: Verify 37989670672 falló en ui.test.tsx:140 y el mismo commit tiene dos deploys exitosos [E12]. | Publicación sin una señal de calidad satisfactoria. No demuestra falla visual real del menú. | Diagnosticar prueba de foco; exigir checks acordados antes de producción. getClientRects/JSDOM es hipótesis, no causa probada. | 1–2d; acceso a configuración GitHub/Vercel y entorno de prueba. |
| F04 · Medio · P1 | CONFIRMADO: proyectos mnt-inmuebles y fortius-inmuebles despliegan el mismo commit; endpoint antiguo responde 200 [E12,E13]. | INFERIDO: superficie y operación duplicadas, posible confusión de dominios. Backend y costo del proyecto antiguo no verificados. | Inventariar dependencias, tráfico, Auth y dominios antes de retirar o redirigir el antiguo. | 0.5–1d; lectura Vercel y decisión de negocio. |
| F05 · Medio · P1 | CONFIRMADO: repository.ts listRecords y public.ts readPublic acumulan lotes de 500 hasta final [E04,E05]. | INFERIDO: latencia/memoria crecen con colecciones; no hay medición de saturación. | Paginación/filtrado servidor y consultas por necesidad; medir p95 y tamaño antes/después. | 3–6d; contratos API/UI y datos sintéticos representativos. |
| F06 · Medio · P1 | CONFIRMADO: GET expedientes no tiene rango/paginación explícita; max_rows remoto no verificado [E11]. | INFERIDO: eventual truncamiento por límite REST o crecimiento de respuesta. | Paginación estable con cursor o rango y total cuando necesario. Historial ya pagina; no generalizar. | 1–2d; límite REST y contrato UI. |
| F07 · Medio · P2 | CONFIRMADO: advisory lock 781023 global en escrituras/trigger [E07]. | INFERIDO: contención al crecer concurrencia; hoy también protege integridad. | Medir espera y simular concurrencia antes de granularizar el bloqueo. | 2–4d; pruebas aisladas de integridad y concurrencia. |
| F08 · Medio · P1 | CONFIRMADO: proyección SQL pública omite informacionPublica consumida por TS/PDF [E05,E07]. | INFERIDO: datos válidos pueden faltar en la ficha pública/PDF; no afecta necesariamente todos los inmuebles. | Alinear allowlist y contrato público con prueba de extremo a extremo. | 0.5–1d; migración autorizada y revisión de datos publicables. |
| F09 · Medio · P1 | CONFIRMADO: apiResponse sanitiza errores sin log/correlación en ese manejador [E15]. Logs Vercel no accesibles. | INFERIDO: diagnósticos y seguimiento de incidentes difíciles. | Errores estructurados, ID de solicitud, métricas y retención sin datos personales. | 1–3d; política de privacidad operativa y acceso a logs. |
| F10 · Medio · P1 | CONFIRMADO: TOTP disponible; no exigencia AAL2 encontrada [E03,E09]. | INFERIDO: una contraseña comprometida puede bastar para sesión de personal sin segundo factor. | Política MFA, enrolamiento y recuperación; exigir nivel acordado en operaciones sensibles. | 1–3d; política, recuperación de emergencia y pruebas de acceso. |
| F11 · Bajo · P2 | CONFIRMADO: servidor importa tipos de admin/store; store704 líneas, property-form934, formatos/pdf731 [E18]. | INFERIDO: acoplamiento y cambios más costosos; tamaño no equivale a defecto. | Extraer contratos de dominio y casos de uso gradualmente, sin reescritura masiva. | 3–6d iniciales; contratos estables y pruebas de regresión. |
| F12 · Oportunidad · P3 | CONFIRMADO: etapa es enum versionado sin matriz de transiciones/compuertas identificada [E17]. | INFERIDO: el software no impide algunos avances operativos sin evidencias, si el negocio desea impedirlos. | Aprobar reglas por etapa y excepciones auditables antes de implementar. | 2–5d; decisión de negocio y responsables documentales. |

## Fortalezas comprobadas

- RLS en todas las tablas públicas, separación staff/admin/editor y escrituras del núcleo mediante funciones.
- Versionado optimista, referencias SQL y registros de historial.
- Documentos con snapshot, hash, acceso privado y validación previa a la emisión.
- Zod, TypeScript estricto, controles de origen/CSP y suite automatizada existente.
- Una unidad de aplicación razonable para el tamaño actual; no hay evidencia que justifique microservicios.

## Validaciones pendientes, no hallazgos afirmados

Aislamiento producción/preview; secretos y ámbitos Vercel; protección de rama; logs efectivos; restauración integral; límites/costos contratados; carga real; cobertura completa de autorizaciones. Se debe inspeccionar cada punto antes de clasificarlo como defecto. No se consultaron expedientes personales.
