# Tareas y actividades: diseño aprobado y ejecución

El titular aprobó incorporar tareas al Dashboard con responsables, prioridad, vencimiento opcional, estados, pasos, vínculos, notas, historial, filtros y plantillas. La agenda de citas permanece independiente; el calendario proyecta los vencimientos de tareas desde su registro original.

## Modelo y pantallas

- Colección privada `tareas` en `mnt_records`, conservando autenticación, permisos, referencias y revisión optimista del backend existente. Migración aditiva y transaccional.
- Estados pendiente, en curso, en espera, completada y cancelada. Vencida es una condición calculada de tareas abiertas con fecha anterior al día operativo de Tijuana.
- Categorías captación, leads, visitas, documentación, comercialización, negociación, cierre, arrendamientos, mantenimiento y administración.
- Responsable vinculado con asesores; vínculos opcionales con lead, cliente e inmueble.
- Fecha sin hora: el vencimiento corresponde al día completo en Tijuana. Sin fecha es un grupo explícito; próximos siete días no incluye hoy.
- Auditoría de autor y fecha del servidor; historial y metadatos de cierre no controlables por el navegador. Cancelar conserva la tarea. Reabrir conserva historial.
- `/admin/tareas`: listado, filtros y alta. `/admin/tareas/[id]`: consulta, edición y seguimiento.
- Dashboard: indicadores vencidas/hoy/próximas/sin fecha, pendientes priorizados, crear y completar.
- Calendario: vencimientos abiertos y enlace al expediente, sin copias de tareas como eventos.
- Plantillas manuales opcionales para iniciar listas de pasos. No generan obligaciones, mensajes ni notificaciones automáticas.

## Orden de ejecución

1. Esquema, validación, migración y pruebas SQL de permisos, integridad, referencias e historial.
2. Alta, listado, filtros, edición y seguimiento con conservación de borrador ante errores/conflictos.
3. Dashboard, calendario y navegación.
4. Pruebas de componentes, integración, compilación y recorridos de navegador en móvil/escritorio.
5. Verificar acceso al proyecto de datos, aplicar migración y comprobar integridad antes de publicar código compatible.
6. Desplegar, comprobar versión y conexión, entregar enlace y límites de las pruebas.

## Reversión

La migración aborta completa si falla. Ante un problema posterior, revertir el despliegue de la aplicación conservando la colección y los registros de tareas; no borrar datos ni historial como parte de una reversión de interfaz.

## Límites

Sin avisos por correo, WhatsApp o push, recurrencias automáticas, facturación, expedientes legales nuevos ni sincronización con calendarios externos. El historial operativo complementa las revisiones existentes del backend.
