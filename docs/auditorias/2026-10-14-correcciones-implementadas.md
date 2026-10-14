# Correcciones de procesos del panel — 14 de octubre de 2026

Implementación del repositorio en la rama `codex/correcciones-auditoria-procesos`, sobre `8640909`. Seguimiento: [MOI-12](https://linear.app/m01535nt/issue/MOI-12/aplicar-correcciones-de-la-auditoria-de-procesos-del-panel-fortius). El [informe R2](2026-10-14-panel-procesos.md) se conserva como diagnóstico histórico; su cobertura parcial no se convierte en una auditoría integral del sistema desplegado.

Esta entrega cambia código, migraciones nuevas y pruebas. No se han aplicado migraciones remotas, desplegado cambios, modificado expedientes productivos ni enviado comunicaciones. No se han retirado carteras, Apps o accesos cuyo uso necesita validación.

## Cambios y alcance

| Hallazgos | Corrección del repositorio | Límite |
|---|---|---|
| H01 | Guardado atómico de ubicación y evidencia actual; correcciones materiales degradan conclusiones dependientes a Recibido, conservan soporte y exigen nueva decisión. | No sobrescribe la ficha comercial, acuerdos ni documentos emitidos; se concilian explícitamente. |
| H02 / H12 | Cinco rutas: propietario vendedor, comprador, propietario arrendador, arrendatario e inversionista; etapas visibles, dependencias y controles propios. Inversión usa operación propia. | No completa contratos, dictámenes o inversiones automáticamente; no reclasifica históricos en bloque. |
| H03 / H04 | Inmueble provisional En evaluación, privado y sin fecha de publicación. Autorización de publicación para venta/renta y todas las tipologías, de la operación correspondiente. | Publicaciones históricas conservan compatibilidad de edición; retirada/republicación y cambios operativos se controlan. |
| H05 / H07 | Vínculo explícito con inmueble existente, sin fusión por dirección; rol mostrado por encargo. Contrapartes restringidas al par de rutas y operación. | No fusiona identidades históricas ni presupone que inmuebles con domicilio parecido son iguales. |
| H06 | Prellenado central de nuevos borradores desde persona/expediente/entrevista, con fuente y versión. Transferencia 07→08 explícita y validada. Perfil inicial solo al crear un cliente por conversión. | Conserva datos del cliente existente. No transfiere expectativas como precio autorizado, ni transforma monedas automáticamente. |
| H08 / H09 | Primer contacto sin inmueble; teléfono o correo, responsable, origen y acción fechada, exigidos en API y SQL. Tarea inicial reutilizada al completar. Matrimonio opcional al inicio. | Las facultades del titular y autorizaciones siguen sujetas a revisión antes de contratar. |
| H10 / H11 | Observaciones bloquean actividades dependientes; evidencia interna existente/versionada y del expediente, o referencia externa estructurada. | La existencia de una referencia no certifica el contenido ni la competencia del revisor. Evidencia histórica se regulariza gradualmente sin autorizar avances sin prueba. |
| H13 | Aceptación, condiciones, pausa, rechazo, referencia y cancelación con motivo y siguiente acción; condiciones indican actividades autorizadas. | Las obligaciones pendientes no se cancelan automáticamente. |
| H14 | Tarea siguiente contextual; comunicación y cita mantienen nombres y propósito distintos. | No unifica todavía toda la agenda/contactabilidad en un registro de interacción. |
| H15–H17 | Accesos a herramientas con contexto del expediente y explicación de análisis frente a revisión/emisión. | No elimina la captura manual, cartera comercial ni herramientas: uso y equivalencia siguen pendientes de validación. |
| H18 / H19 / H20 | Lenguaje de inmueble, confirmación condicionada al vínculo real, referencias por perfil y persona visible junto a folio. | No normaliza masivamente vocabularios ni corrige datos históricos sin revisión. |

Guardar una guía conserva las revisiones; avanzar comprueba requisitos y registra etapa. Una actividad recibida no equivale a revisada. Un registro provisional no equivale a aceptación ni inventario publicado. La presentación del aviso de privacidad no equivale a consentimiento.

## Verificación

Pruebas en PGlite en memoria aplican toda la cadena de migraciones en orden. Cubren identidad existente, borrador retomable, idempotencia, permisos, propiedad repetida o distinta con domicilio compartido, observación acotada, pausa, archivo con pendientes, evidencia ajena/inexistente/obsoleta, corrección material y autorización cruzada venta/renta.

Resultados registrados: 718 pruebas backend y 337 pruebas admin aprobadas; 13 ensayos de restauración aprobados con snapshots, historial, documentos emitidos y respaldos históricos. Lint, tipos y compilación aprobados. La revisión visual usa Edge local, datos ficticios y bloqueo de todas las escrituras: contacto y cinco guías a 390, 768 y 1440 px, incluidos campos de evidencia y pausa. No representa una prueba de proveedores ni de permisos configurados en producción.

La revisión independiente con gauntlet-review encontró cuatro defectos en R1 y motivó nuevas regresiones permanentes. La revisión R2 obtuvo **PASS para el alcance local C01–C08**: verificó las huellas de los 54 archivos, ejecutó 10 contraensayos y 13 pruebas de recuperación, e inspeccionó 13 capturas pertinentes. No acredita instalación ni funcionamiento remoto. La evidencia de revisión se conserva localmente en `tmp/implementacion-procesos-2026-10-14/`.

## Migración y liberación

1. Identificar commit realmente desplegado, migraciones instaladas y roles del entorno destino. El hash de Git no prueba estado de la base. Confirmar que la migración existente `20261014180000_capture_property_from_operational_interviews.sql` y sus anteriores están aplicadas.
2. Respaldar antes de migrar mediante el [procedimiento de respaldo y restauración](../fortius-inmuebles-backup-restore.md), durante una ventana coordinada sin escrituras. Custodiar export propietario, historial, entrevistas, documentos y objetos Storage fuera de Git; verificar manifiesto y huellas. Auth/configuración requieren respaldo separado. No presumir PITR, custodia o recuperación gestionada sin comprobarlos.
3. Ensayar el respaldo del destino en una base aislada con las migraciones de esta rama. El ensayo sintético aprobado no reemplaza la comprobación del respaldo real, Auth o recuperación del servicio Storage.
4. Aplicar **nueve migraciones nuevas**, cronológicamente desde `20261014210000_process_controls.sql` hasta `20261014222000_review_correction_controls.sql`, primero en pruebas. Cada una es transaccional, con bloqueo común y límites de tiempo; aborta si la definición previa no corresponde al marcador esperado. No editar migraciones ya aplicadas. La ampliación del CHECK de operación debe validarse con el volumen real y ventana disponibles.
5. Verificar API/SQL/frontend en el mismo entorno de pruebas: cinco contactos, inmueble nuevo/reutilizado, corrección, pausa y reanudación, evidencia parcial, permisos asesor/admin y retirada/republicación. Desactivar integraciones reales y utilizar documentos ficticios.
6. La instalación productiva y despliegue son un paso posterior pendiente. Instalar el esquema compatible antes de activar esta interfaz; observar errores PT400/PT403/PT409, creación repetida, tareas y publicación. Registrar commit, migraciones, responsable y resultados.
7. Pilotar encargos nuevos; adoptar guías históricas explícitamente. No asignar operación Inversión a expedientes antiguos solo por una etiqueta personal. Conciliar antes de revisar y autorizar; conservar fuente/versión y emitidos.

## Recuperación

Antes de usar rutas nuevas puede retirarse la versión de aplicación en el entorno de pruebas manteniendo el esquema compatible. Después de crear encargos de inversión o estados nuevos, la versión anterior puede no entenderlos: detener temporalmente esas escrituras y corregir hacia adelante o usar una versión que conserve su lectura. No borrar encargos, degradar CHECK ni reescribir snapshots para facilitar el retroceso.

Si hay daño de datos, restaurar el respaldo verificado en un destino separado y conciliar las escrituras posteriores antes de sustituir el destino activo. Nunca recuperar una copia completa sobre producción perdiendo capturas nuevas. El ensayo aprobado valida contenido, relaciones y fechas en memoria; quedan pendientes credenciales/configuración y recuperación de objetos en un servicio separado.

## Pendientes materiales

- Verificar migración, despliegue, permisos y recorridos con datos ficticios en un entorno remoto de pruebas.
- Validar uso, dependencias y equivalencia antes de retirar capturas/carteras/herramientas H15–H17.
- Decidir política de custodia, responsables y alcance de evidencias externas; una referencia manual no acredita un dictamen profesional.
- Medir en piloto tiempo de primer contacto, duplicaciones evitadas, tareas sin fecha, correcciones y claridad de próxima acción. No hay medición de tiempos productivos. La prueba comprueba una sola tarea abierta del contacto reutilizada al completar, sin afirmar ahorro de minutos.
