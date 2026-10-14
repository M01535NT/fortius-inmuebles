# Correcciones de procesos Fortius — Implementation Plan

> Ejecución nativa en esta sesión, con pruebas primero y revisión independiente final. La solicitud de aplicar las correcciones del informe autoriza la ejecución; no se solicita otra aprobación del mismo alcance.

**Goal:** iniciar la atención sin inmueble, reutilizar la información y avanzar por procesos diferenciados con controles comprobables.

**Architecture:** conservar persona, entrevistas versionadas, inmueble y expediente existentes. Las entrevistas borrador representan la necesidad inicial; el expediente conserva el encargo y su ruta, independientemente del tipo histórico del cliente. Ampliar el modelo mediante migraciones sucesivas, sin fusionar ni eliminar datos históricos. Mantener cálculos y documentos emitidos.

**Tech Stack:** Next.js, React, TypeScript, Zod, PostgreSQL/Supabase, Vitest y PGlite.

**Spec:** `docs/auditorias/2026-10-14-panel-procesos.md`, revisión R2, hallazgos H01–H20 y AC01–AC16.

## Global Constraints

- Base de trabajo: GitHub main `8640909`; rama `codex/correcciones-auditoria-procesos`.
- No migraciones remotas, mensajes, publicaciones ni escrituras de prueba en producción.
- No retirar accesos, herramientas o carteras cuyo uso o equivalencia no está comprobado (H15–H17).
- Conservar IDs, permisos, versiones, snapshots, documentos emitidos y mecanismos de recuperación.
- Una dirección coincidente solo sugiere un inmueble: nunca decide una fusión.
- No presentar una declaración, observación preliminar o cálculo como revisión especializada o avalúo.
- Publicación y avance se autorizan en servidor y base, además de la interfaz.

## Review Focus

- Corrección concurrente del domicilio: preservar snapshot anterior y rechazar versiones obsoletas.
- Inmueble histórico publicado: no retirar por una migración ni inventar evidencia de autorización.
- Dos unidades con la misma dirección: permitir identidades independientes y selección explícita.
- Persona multirrol: no cambiar ni reclasificar operaciones anteriores.
- Observación de una actividad futura: no bloquear análisis independientes ni permitir la actividad observada.

## Task 1: Correcciones críticas y estado provisional (H01–H04)

**Files:** nueva migración `supabase/migrations/20261014210000_process_controls.sql`; `src/data/propiedades.ts`; `src/lib/backend/validation.ts`; API de publicación; pruebas de intake/controles.

**Interfaces:** conservar firmas `fortius_inmuebles_save_intake`, `fortius_inmuebles_update_operation`; añadir estado privado `evaluacion` y permitir fecha de publicación vacía mientras no se publica.

- [x] Probar corrección de ubicación, provisional privado, bloqueo de publicación de terreno/renta sin autorización y salto de cierre de renta; comprobar fallos reales.
- [x] Actualizar conjuntamente vínculo/contexto y soporte actual, sin guardado intermedio inconsistente.
- [x] Aplicar autorización a todas las tipologías, preservando anuncios históricos y evitando provisional publicado.
- [x] Impedir salto/archivo de renta sin guía, revisiones y resolución de tareas.
- [x] Ejecutar pruebas afectadas y conservar el resultado.

## Task 2: Primer contacto y requisitos oportunos (H08/H09/H15/H18)

**Files:** `src/lib/intake/interview.ts`, `src/app/admin/operaciones/nueva/page.tsx`, pantalla de entrevista, migración sucesiva y pruebas.

**Interfaces:** ampliar contacto con origen/siguiente acción/fecha y aceptar email como medio suficiente; usar una tarea estable por entrevista y vincularla al expediente al completar.

- [x] Probar contacto por email, origen, acción inicial, reintento idempotente y ausencia de segunda tarea al completar.
- [x] Diferir estado civil/cónyuge a revisión de facultades; conservar datos declarados existentes.
- [x] Unificar entrada comercial y vocabulario Inmueble sin eliminar altas administrativas.
- [x] Ejecutar pruebas de validación, SQL e interfaz.

## Task 3: Identidad y contexto (H05/H07/H14/H19/H20)

**Files:** entrevista/selector, lista de expedientes, buscador, procedimientos, Resumen y pruebas.

**Interfaces:** selección explícita de inmueble existente autorizada en servidor; rol por ruta del expediente, con fallback histórico; persona visible antes de tener inmueble.

- [x] Probar inmueble existente, segunda unidad en dirección coincidente y permisos de vinculación.
- [x] Probar venta/compra/renta de una persona sin duplicarla ni alterar encargos anteriores.
- [x] Basar confirmación de entrevista en vínculo efectivo; señalar regularización pendiente.
- [x] Mostrar persona/intención/acción y separar comunicación, cita y tarea.
- [x] Ejecutar pruebas de contexto y navegación.

## Task 4: Procesos por perfil (H02/H12)

**Files:** `src/lib/formatos/operation-workflow.ts`, guía, esquemas/API de expedientes y migración sucesiva.

**Interfaces:** rutas `captacion`, `compra`, `arrendador`, `arrendatario`, `inversion`; etapas persistidas compatibles, etiquetas/requisitos propios; inversión sin contrato de compra ficticio.

- [x] Probar rutas completas, admisión sin inmueble y requisitos de cierre propios.
- [x] Añadir controles de contrato/pagos/entrega/término en renta y criterios/escenarios/decisión/ejecución en inversión.
- [x] Permitir adopción explícita de guía histórica sin reescribir snapshots.
- [x] Ejecutar pruebas de paridad frontend/API/SQL y permisos.

## Task 5: Decisiones, evidencia y bloqueos por dependencia (H10/H11/H13)

**Files:** modelo/guía de operación, migración y pruebas de procesos.

**Interfaces:** resolución estructurada, condiciones y evidencia versionada; una observación bloquea sus actividades dependientes, no toda edición.

- [x] Probar observación futura, riesgo en actividad necesaria y referencias inexistentes/retiradas.
- [x] Registrar aceptación, condiciones, pausa, rechazo, referencia y cancelación con motivo y siguiente acción.
- [x] Conservar obligaciones pendientes al pausar/cancelar; no cancelar tareas automáticamente.
- [x] Ejecutar pruebas y revisar controles de publicación/contratación.

## Task 6: Reutilización de datos y herramientas (H06/H16/H17)

**Files:** adaptador de prellenado, creación de formatos, contexto de herramientas y pruebas.

**Interfaces:** propuesta de datos con fuente, sin sobrescritura de borradores ni documentos emitidos; campos nuevos se solicitan en su actividad.

- [x] Probar entrevista → perfil/formato y conciliación de datos posteriores.
- [x] Reutilizar fuentes económicas compatibles con aprobación explícita, manteniendo diferencia expectativa/opinión/precio autorizado.
- [x] Conservar cartera y herramientas; explicar propósito y enlazar contexto operacional sin declarar equivalencia no probada.
- [x] Ejecutar pruebas de snapshots y regresión documental.

## Task 7: Verificación, recuperación y entrega

**Files:** pruebas, documentación de migración/recuperación y estado de implementación junto al informe original.

- [x] Ejecutar lint, typecheck, batería completa y build.
- [x] Probar migraciones en memoria y recuperación de identidad/evidencia histórica.
- [x] Inspeccionar las vistas cambiadas con datos ficticios y conservar límites reales.
- [x] Revisar diff completo con crítico en contexto limpio; corregir hallazgos materiales y repetir pruebas afectadas.
- [x] Actualizar MOI-12 con resultados reales y pendientes. Diferenciar cambio local, migración pendiente y despliegue.

## Seguimiento

La evidencia y el registro de decisiones se guardan en `tmp/implementacion-procesos-2026-10-14/`. El informe R2 se conserva como baseline; la implementación tiene su propio estado y no convierte la cobertura parcial anterior en aceptación integral.

Cierre local: verificación backend 718/718, admin 337/337, recuperación 13/13 y visual 3/3; gauntlet-review R2 PASS local. Nueve migraciones y despliegue remoto pendientes. La retirada H15–H17 y la unificación integral de interacciones H14 no forman parte de las correcciones implementadas.
