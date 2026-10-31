# Panel operativo Fortius

Corte documental: 17/10/2026, después del rediseño guiado (PR #39). El desarrollo se dirige desde [el plan único](../PLAN_ERP_CRM.md); las reglas de producto, desde su sección «Dirección del producto y reglas vigentes».

## Navegación

La barra superior (versión 2, 30/10/2026) lleva el logotipo y seis píldoras: **Hoy** (con el número de pendientes), **Operaciones**, **Contactos**, **Inmuebles**, **Agenda** y **Más**, que abre Herramientas (las 17, incluida «Documentos sin expediente», y la pestaña Documentos). A la derecha están el buscador (Ctrl K), **«+ Nuevo»** con un menú corto (operación, prospecto, inmueble, tarea, visita) y la cuenta: Mi perfil, **Administración** (solo el administrador: Equipo, Sitio web, Reportes, Historial y Configuración), Ver sitio, Modo oscuro y Cerrar sesión. En celular, la barra inferior es Hoy · Operaciones · + · Contactos · Más.

En celular, la barra inferior lleva Hoy, Operaciones, «+», Contactos y Menú. El menú reúne Inmuebles, Agenda, Herramientas, Administración, Mi perfil, Ver sitio y Cerrar sesión.

Las direcciones anteriores (prospectos, clientes, calendario, tareas, expedientes, apps, proceso por etapa y entrevistas) redirigen a la sección nueva sin perder la consulta.

## Preferencias

La densidad cómoda o compacta se elige en **Mi perfil**. Las vistas guardadas del inventario están en «Más filtros». Hoy ambas se guardan en ese navegador: no siguen al usuario a otro equipo ni alteran permisos. La regla RP-14 del plan las llevará al servidor por usuario (entrega UX-02).

La búsqueda reúne los registros que el usuario puede consultar y permite crear un inmueble, prospecto, tarea o visita.

## Edición y seguimiento

- El inventario permite buscar, filtrar (Todos, En venta, En renta y «Más filtros»), paginar de 24 en 24 y guardar vistas. “Mis inmuebles” usa la vinculación de asesor de la sesión, no coincidencias de correo.
- Guardar un inmueble conserva su estado de publicación. Publicar o retirar requiere una acción explícita.
- La vista previa es una representación de la captura, no una publicación ni una reproducción exacta de la página pública.
- **Guardar copia temporal** conserva la captura en esta pestaña. No es un autoguardado en el servidor. Cerrar la sesión borra estas copias. Tras un conflicto, se puede conservar la copia y recargar: una copia de otra versión se consulta completa sin sobrescribir los datos más recientes.
- Contactos tiene las pestañas Prospectos y Clientes, en tabla (computadora) o lista (celular). Las coincidencias de teléfono/correo son avisos, no fusiones automáticas.
- Los vínculos entre personas, inmuebles, tareas, agenda y operaciones usan las relaciones existentes.
- En una operación, «Lo tengo» no acredita la revisión. «Revisado» pide el documento que lo respalda, quién lo revisó, la fecha, la vigencia cuando aplica y qué se encontró.

## Activación de historial y recuperación

En una instalación nueva, aplicar las migraciones en orden, incluida la siguiente. En una instancia existente, consultar primero su historial y aplicar únicamente las pendientes; no repetir una migración ya registrada:

`supabase/migrations/20261008210000_fortius_admin_history.sql`

Se requiere acceso autorizado al SQL Editor de Supabase o una conexión PostgreSQL de migraciones. La clave de servicio de la API no sustituye ese acceso.

La migración agrega historial de cambios con autor, versión y campos modificados, recuperación administrativa de inmuebles, artículos, notas y eventos, y el registro inmutable de la fecha del primer contacto. El historial empieza al activarse: no reconstruye cambios ni eliminaciones anteriores.

Las recuperaciones usan las validaciones y referencias existentes, nunca reemplazan registros posteriores y devuelven inmuebles/artículos como borradores. Los expedientes conservan su propia recuperación. El panel muestra una advertencia de activación pendiente si la tabla todavía no existe.

## Reportes

Los periodos usan la fecha operativa de Tijuana. La primera atención mide desde la recepción hasta el registro explícito del contacto; no se deduce de clics en WhatsApp. Los registros sin esa medición se identifican aparte. Las visitas son programadas, no asistencias confirmadas.

Ofertas y registros de cierre provienen de la cartera comercial elegida. Se excluyen eventos reemplazados, inválidos, pendientes o cancelados. Un cierre requiere evidencia y base Comprobado, y no puede estar rechazado. El filtro de responsable usa el identificador o el nombre exacto del asesor registrado en esa cartera. Estos son registros de actividad, no una deduplicación contable de operaciones.

## Verificación

`npm run verify` comprueba lint, TypeScript, backend, interfaz y compilación.

`npm run test:admin:browser -- tests/admin/browser/admin-workspace.spec.ts` prueba la barra lateral y la barra inferior, lo que ve un asesor, acciones rápidas repetidas, vistas guardadas, enlaces relacionados y vista previa a 320, 390 y 1440 px con API simulada, sin escrituras reales.
