# Panel operativo Fortius

## Organización personal

En el menú lateral, **Organizar módulos** habilita el arrastre en escritorio y los botones Subir/Bajar para teclado y celular. **Restablecer orden** recupera los grupos originales. El orden y las vistas de inventario se conservan por usuario en ese navegador; no se sincronizan entre dispositivos ni alteran los permisos.

La búsqueda del encabezado reúne los registros que el usuario puede consultar y permite crear un inmueble, prospecto, tarea o visita. El panel del día enlaza pendientes, contactos, visitas programadas y expedientes fuera de fecha.

## Edición y seguimiento

- El inventario permite buscar, filtrar, paginar y guardar vistas. “Mis inmuebles” usa la vinculación de asesor de la sesión, no coincidencias de correo.
- Guardar un inmueble conserva su estado de publicación. Publicar o retirar requiere una acción explícita.
- La vista previa es una representación de la captura, no una publicación ni una reproducción exacta de la página pública.
- **Guardar copia temporal** conserva la captura en esta pestaña. No es un autoguardado en el servidor. Cerrar la sesión borra estas copias. Tras un conflicto, se puede conservar la copia y recargar: una copia de otra versión se consulta completa sin sobrescribir los datos más recientes.
- Prospectos permite lista o etapas. Las coincidencias de teléfono/correo son avisos, no fusiones automáticas.
- Los vínculos entre personas, inmuebles, tareas, agenda y expedientes usan las relaciones existentes.
- En expedientes, marcar un documento como recibido no acredita su revisión. La revisión se describe y guarda en la actividad.

## Activación de historial y recuperación

Aplicar una sola vez, después de las migraciones anteriores:

`supabase/migrations/20261008210000_fortius_admin_history.sql`

Se requiere acceso autorizado al SQL Editor de Supabase o una conexión PostgreSQL de migraciones. La clave de servicio de la API no sustituye ese acceso.

La migración agrega historial de cambios con autor, versión y campos modificados, recuperación administrativa de inmuebles, artículos, notas y eventos, y el registro inmutable de la fecha del primer contacto. El historial empieza al activarse: no reconstruye cambios ni eliminaciones anteriores.

Las recuperaciones usan las validaciones y referencias existentes, nunca reemplazan registros posteriores y devuelven inmuebles/artículos como borradores. Los expedientes conservan su propia recuperación. El panel muestra una advertencia de activación pendiente si la tabla todavía no existe.

## Reportes

Los periodos usan la fecha operativa de Tijuana. La primera atención mide desde la recepción hasta el registro explícito del contacto; no se deduce de clics en WhatsApp. Los registros sin esa medición se identifican aparte. Las visitas son programadas, no asistencias confirmadas.

Ofertas y registros de cierre provienen de la cartera comercial elegida. Se excluyen eventos reemplazados, inválidos, pendientes o cancelados. Un cierre requiere evidencia y base Comprobado, y no puede estar rechazado. El filtro de responsable usa el identificador o el nombre exacto del asesor registrado en esa cartera. Estos son registros de actividad, no una deduplicación contable de operaciones.

## Verificación

`npm run verify` comprueba lint, TypeScript, backend, interfaz y compilación.

`npm run test:admin:browser -- tests/admin/browser/admin-workspace.spec.ts` prueba navegación reorganizable, acciones rápidas repetidas, vistas guardadas, enlaces relacionados y vista previa a 320, 390 y 1440 px con API simulada, sin escrituras reales.
