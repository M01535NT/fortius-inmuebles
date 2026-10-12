# Arquitectura objetivo — TO-BE

**PROPUESTO en su totalidad.** La documentación no autoriza ni implementa estas decisiones. Se conserva Next.js como monolito modular y Supabase como servicios de datos/identidad/archivos. La unidad de despliegue no se divide por anticipación.

## Dominios y límites

| Dominio propuesto | Responsabilidad | Evolución desde lo comprobado |
|---|---|---|
| Identidad y permisos | Sesión, roles, capacidades, MFA | backend/auth y staff/adviser_accounts |
| Inventario y publicación | Inmuebles, asesores publicables, contrato público | records/propiedades y public projection |
| Relaciones comerciales | Leads, clientes, conversión, seguimiento | records y lead_conversions |
| Operaciones | Expedientes, tareas, agenda y transiciones | expedientes/actividad y colecciones actuales |
| Documentos | Borradores, evidencias, emisiones y custodia | formatos y Storage privado |
| Comercial | Libros, revisiones y emisiones | módulo comercial existente |
| Contenido y herramientas | Blog, contenido, calculadoras e informes | módulos públicos existentes |

Contratos y tipos no dependen del store React. Las rutas se encargan de transporte, autenticación y validación superficial; los casos de uso coordinan reglas, permisos y puertos de persistencia. Los adaptadores implementan Supabase/Storage/PDF. Integridad transaccional, FK, restricciones y RLS permanecen en PostgreSQL: no se trasladan indiscriminadamente a TypeScript. DDD se aplica mediante límites y vocabulario, no mediante clases o capas artificiales.

## Seguridad y operación objetivo

1. Acordar RPO/RTO y ensayar recuperación en entorno aislado antes de ampliar documentos críticos.
2. Alinear dominios Auth y cortar publicación cuando fallen controles obligatorios.
3. Inventariar y después separar credenciales/datos de producción y preview; no afirmar que hoy están mezclados.
4. Añadir paginación y contrato público probado; mantener proyección por allowlist.
5. MFA por política y permisos revisados en servidor/DB, no solo ocultamiento de botones.
6. Identificación de solicitudes y errores operativos sin registrar expedientes ni secretos.
7. Unificar la responsabilidad del repositorio OS antes de proponer sincronización.

## Alternativas y costos

| Alternativa | Beneficio | Costo/desventaja | Decisión propuesta |
|---|---|---|---|
| Monolito modular | Reutiliza operación, reduce cambios simultáneos | Requiere disciplina de límites | Recomendada |
| Separar público/admin | Puede aislar ciclos de despliegue | Duplica configuración y contratos | Posponer hasta necesidad medida |
| Microservicios | Independencia operativa selectiva | Red, consistencia, observabilidad y despliegues adicionales | No recomendados ahora |
| Worker de documentos | Reintentos y trabajos largos | Cola, idempotencia y operación | Solo si límites/volumen lo exigen |
| Integrar OS inmediatamente | Reutilizar módulos potenciales | Conflictos de fuente de verdad y reglas | Primero contrastar entidades y dueño de datos |

No hay planes, facturas ni tráfico suficiente para presupuestar infraestructura mensual. No se requiere obligatoriamente un nuevo servicio cloud en fases 0–2. Estimación orientativa: 6–12 días de ingeniería para primera estabilización y 3–6 para primera extracción modular, con solapamiento y sin SLA de entrega. Costo profesional = días acordados × tarifa acordada. Respaldos/PITR, entornos o monitoreo pueden cambiar costos según plan real; cotizar después de inspección.

## Capacidades candidatas, no implantadas ni aprobadas

CRM integral, administración de arrendamientos, reportes financieros, portales y automatizaciones por eventos pueden incorporarse por dominio. IA/RAG jurídico requiere fuentes verificadas, permisos sobre corpus, trazabilidad de citas, evaluación y control humano; no se introduce por tener una dependencia UI. Usar outbox/worker solamente para una integración concreta que necesite entrega durable. No dibujar estos candidatos como infraestructura actual.

Ver ADRs y roadmap para decisiones y criterios de aceptación.
