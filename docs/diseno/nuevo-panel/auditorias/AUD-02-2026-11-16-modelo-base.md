# AUD-02 — modelo base y permisos de PN-02 (16/11/2026)

**Quién:** subagente arquitecto de datos y auditor de lógica, solo lectura. **Qué leyó:** `AUD-01`, `DECISIONES.md`, `SPEC.md` (RP-75, RP-94 y la sección PN), las migraciones de expedientes, folios, trámites y freno de firma, y `src/lib/backend` y `src/app/api/admin/expedientes`. **No hizo:** consultas a la base en vivo ni pruebas. El SQL de borrador de este informe está en [`../migraciones-borrador/PN-02-borrador.sql`](../migraciones-borrador/PN-02-borrador.sql); **no está ensayado y no se copia a `supabase/migrations/` hasta ensayarlo en una base local con copia de datos y avisar al titular** (en este equipo no hay Postgres, Docker ni la CLI de Supabase para ensayarlo).

## 1. Diagnóstico (hechos leídos)

- **Registro genérico.** `fortius_inmuebles_records` (`collection`, `id`, `data` jsonb, `version`). Personas son `clientes`, inmuebles son `propiedades` (su `id` es el slug), trámites son `tramites`. Se escribe solo por RPC con versión optimista.
- **Asunto de hoy.** `fortius_inmuebles_expedientes` es tabla tipada: `cliente_id` NOT NULL con FK a records, `asesor_id` NOT NULL, `propiedad_slug`, `folio` único, `operacion` (venta, renta, inversión, administración, otra), `etapa`, `flujo` jsonb, `deleted_at`. Tablas hermanas: `_expediente_actividad`, `_formato_drafts`, `_formato_emissions`, `_expediente_archivos`, `_record_history`, `_staff`, `_adviser_accounts`, `_lead_conversions`.
- **Autorización.** El servidor usa casi siempre el cliente con el token del usuario, así que la RLS se aplica. Funciones `security definer`: `is_staff`, `is_admin`, `current_asesor_id`, `can_access_client_id`, `can_access_expediente`, `record_visible`; todas con MFA. `staff.role` es `admin` o `editor`; `current_asesor_id()` solo devuelve valor para `editor`, por lo que **el director no tiene `asesor_id` con esa función**.
- **Folios.** `EXP-` sale de `max+1` sobre la tabla viva con `pg_advisory_xact_lock(781023)`. El usuario autenticado no puede borrar expedientes (se marca `deleted_at`), pero `service_role` sí podría y ningún disparador lo impide. `FORTIUS-` cuenta records más `record_history`. **Ninguna ruta del servidor actualiza el folio** (solo lo leen).
- **Trámites.** El jsonb lleva `pasos`, `notas`, `pagos`, `espera`, `expedienteId`; de él dependen `guard_tramite`, el freno de la firma y archivos y tareas con `tramiteId`.
- **No existen:** tablas de dinero ni de consultas, ni `REC-` en el código; `formato_emissions` no tiene columna de folio.

**Qué rompería un cambio:** quitar el NOT NULL de `cliente_id` deja fuera al asesor (las políticas exigen acceso al cliente), rompe la regla de tareas y haría que el panel viejo liste asuntos sin cliente; ampliar el `check` de `operacion` afecta al freno de firma y a las guías (mejor una columna nueva); guardar campos nuevos dentro del jsonb puede romper migraciones futuras que reescriben funciones por texto. Los datos nuevos van en tablas laterales.

## 2. Plan de migraciones (8 archivos, todos nuevos y aditivos)

| # | Archivo propuesto | Qué hace | Riesgo para el panel viejo |
| --- | --- | --- | --- |
| 1 | `…_pn02_identidad_y_visibilidad` | `mi_asesor_id()` sin filtro de rol (sirve al director), `puede_ver_asunto`, `puede_ver_persona` | Ninguno |
| 2 | `…_pn02_folios_reservados` | Libro `folios` con respaldo de lo existente, asignadores nuevos, prohibición de borrar y de cambiar folio | Ensayo |
| 3 | `…_pn02_asunto_columnas` | En expedientes: título, tipo de asunto, estado, resultado, «continúa de», «derivado de», creador; `cliente_id` opcional; ajuste de la regla de tareas | **Ensayo obligatorio** |
| 4 | `…_pn02_asunto_enlaces` | `asunto_personas` (con papel), `asunto_inmuebles`, `asunto_miembros`, RPC `crear_asunto` | Ninguno |
| 5 | `…_pn02_pendientes` | Tabla `pendientes` y vistas Hoy y Agenda | Ninguno |
| 6 | `…_pn02_historial_y_notas` | `historial` (solo agregar) y `notas_internas` (sin edición) | Ninguno |
| 7 | `…_pn02_personas_unidas` | `persona_uniones` y RPC `unir_personas` | Bajo |
| 8 | `…_pn02_tramites_a_asuntos` | Un asunto y un folio por trámite, tabla de enlace, disparador para los nuevos | Ensayo; se aplica en PN-07 |

Se aplican sin riesgo para el panel viejo las 1, 4, 5, 6 y 7. Necesitan ensayo con copia de datos las 2, 3 y 8. Riesgo transversal: el candado `781023` lo comparten las migraciones y los folios; aplicar 2 y 3 con `lock_timeout` corto y fuera de horario.

## 3. Migración de trámites a asuntos

El trámite sigue en `records` (de él dependen el freno de firma y `guard_tramite`). Por cada trámite, en orden, se crea un asunto con tipo «trámite», operación «otra» y los datos del jsonb; el folio lo pone el disparador. Una tabla de enlace guarda trámite ↔ asunto; si el trámite frena una venta, el asunto lleva «derivado de» esa venta. Un disparador hace lo mismo con los trámites que cree el panel viejo. Notas, pagos y espera se copian en PN-07 y PN-08. **Riesgos:** los asuntos-trámite aparecerían en la lista del panel viejo; los disparadores de expedientes correrían sobre filas con `flujo` nulo; los folios consumidos no se devuelven. **Verificación:** mismo conteo de trámites, enlaces y asuntos de tipo trámite; suma de control del jsonb de `tramites` idéntica antes y después; cero trámites sin enlace; `tramites_que_frenan_firma` igual para cada venta; ensayo local con la suite existente.

## 4. Decisiones que faltan del titular (con la recomendación del auditor)

1. **¿Los asuntos nuevos pueden verse en el panel viejo?** Recomienda que no: una línea de filtro en la lista del legado; es el único toque al panel viejo.
2. **¿Cuándo reciben folio los trámites existentes?** Recomienda en PN-07, con su pantalla; PN-02 deja la migración 8 escrita y ensayada, sin aplicar.
3. **¿El director puede ser responsable de un asunto?** Recomienda que sí: darle ficha de asesor y cuenta ligada y usar `mi_asesor_id()`.
4. **¿Qué pasa con las tareas y eventos viejos?** Recomienda que el panel nuevo los lea de una vista de solo lectura durante la convivencia y se copien a `pendientes` una sola vez al retirar `/admin`, sin doble escritura.
5. **Lista cerrada de tipos de asunto y papeles.** Recomienda tipos `venta, renta, busqueda, tramite, inversion, revision, otro` y los papeles del boceto más copropietario y apoderado (RP-94).
6. **¿El colaborador de un asunto ve la ficha completa de la persona?** Recomienda que vea nombre y contacto dentro del asunto, pero no la ficha ni los otros asuntos de esa persona; queda para PN-10 y el modelo ya lo permite.

## 5. Lo que no verificó

La base en vivo (conteos, folios con formato distinto de `EXP-`, si las cerca de 100 migraciones están todas aplicadas); el cuerpo actual de `record_visible`, `guard_private_record` y `put_record` tras sus reescrituras en cadena; la definición completa de `validate_task` y `event_visible`; que las guías toleren `flujo` nulo en asuntos nuevos; que el slug de un inmueble no cambie (las llaves nuevas apuntan a él); y la numeración `EXP-######·nn·vN` de los formatos, que queda para PN-06.
