# Verificación de conversión de leads en clientes

Fecha local: 4 de octubre de 2026. Rama: `feature/formatos-admin`.

## Función disponible

- Botón **Convertir en cliente** en el listado y detalle de Leads. Abre el cliente creado en `/admin/clientes/[id]` y reutiliza contacto, asesor, zona, inmueble consultado, mensaje, perfil, presupuesto, financiamiento y campos futuros.
- El cliente admite edición de sus datos heredados. El historial anterior de notas se conserva como origen inmutable; la agenda y el seguimiento completos siguen accesibles mediante el lead original.
- Los leads convertidos se excluyen de la lista activa y del resumen del panel; pueden consultarse con el filtro **Convertidos**. La acción posterior es **Ver cliente**.
- Una conversión por identidad de lead. Dos solicitudes concurrentes y los reintentos devuelven el mismo cliente; no sustituyen las modificaciones posteriores. No se fusionan personas distintas por coincidencias aproximadas de teléfono o correo.
- Tipo derivado de la operación capturada: comprar → comprador, vender → propietario, rentar → arrendatario, arrendar → arrendador. Sin operación, **Otro**, sin suponer una intención.
- Antes de convertir se exige guardar o cancelar cambios de perfil, nota y agenda. La agenda permite cancelar una cita sin guardar; su estado inicial no bloquea el botón.
- La reasignación administrativa se hace desde Clientes y sincroniza el asesor del lead original en la misma transacción. El asesor nuevo puede seguir el vínculo al historial; el anterior pierde acceso.

## Persistencia y permisos

La operación usa la RPC `mnt_convert_lead` con autenticación, membresía activa, alcance del asesor y control de versión. Un bloqueo compartido con las escrituras versionadas y una transacción abarcan recibo de conversión, alta del cliente y actualización del lead. Un fallo posterior al alta revierte también el cliente y el recibo.

`mnt_lead_conversions` conserva el JSON completo original en `source_data`. No concede lectura directa a `anon`, `authenticated` ni `service_role`. El cliente incluye una copia mínima del historial de notas, sin repetir en ella el perfil y el mensaje completos. Los vínculos, autores, fechas y origen no se pueden falsificar, remover ni sustituir mediante las rutas normales. Las relaciones impiden borrar por separado el lead o cliente convertido.

Límites comprobados: captura ordinaria BFF de 250000 bytes; registro convertido BFF de 260000; cuerpo HTTP máximo de 262144. JSONB ordinario de 262144; JSONB convertido de 270336, con margen acotado para metadatos. La copia privada original mantiene su límite de 262144. La ampliación no afecta el resto de colecciones.

## Revisión y pruebas locales

Revisión independiente de la implementación y sus correcciones. Se resolvieron los hallazgos de duplicación del JSON original y tamaño, conversión con agenda sin guardar, pérdida de acceso al historial tras reasignar y estado inicial incorrecto de agenda. Revisión final: sin hallazgos críticos, importantes o menores pendientes en este alcance. La ejecución remota quedó fuera de la revisión independiente y se verificó después por el implementador.

`npm run verify` terminó con código 0 después de las correcciones finales:

- Lint y tipos correctos.
- Servidor: 441/441 pruebas, 58 archivos.
- Administración: 169/169 pruebas, 32 archivos.
- Total: **610 pruebas**.
- Compilación de producción correcta, incluidas la nueva ficha de cliente y API de conversión.

Pruebas específicas nuevas: 15 de base de datos, 11 de ruta y 6 de interfaz. Incluyen concurrencia, reintentos, autorización, versiones antiguas, conservación de campos desconocidos, protección del origen, rollback completo, reasignación y estados de captura. Se verificó un lead de 249900 bytes de JSON compacto con notas largas; otro con 7000 claves futuras y JSONB original de 262050 bytes. Ambos se convierten y su cliente puede editarse.

Navegador con datos sintéticos: **2/2 pruebas** correctas a 320 y 1440 px, conversión y edición del perfil del cliente. Capturas revisadas visualmente: sin desbordamiento horizontal y con contacto, perfil e historial legibles. La cancelación final de agenda fue cubierta después por la prueba de interfaz incluida en las 610 anteriores.

## Supabase: instalación y prueba real

Proyecto: `qkkirjzhviqwvuqjnmei` / mnt-inmuebles. Supabase CLI oficial 2.119.0. Migración aplicada mediante consulta transaccional de Management API, código de salida 0:

| Archivo aplicado | SHA-256 |
|---|---|
| `20261005013631_mnt_lead_conversion.sql` | `6A63C10FA593FEF619316200D4A1C70B9B477C4025A643EE3260B8C7C258E716` |

El esquema anterior carece de historial conciliado de migraciones. Esta aplicación explícita no equivale a preparar un `db push` general; no volver a aplicar el conjunto anterior automáticamente.

El usuario autorizó tres cuentas temporales y su limpieza. `tests/live/verify-lead-conversion.mjs --run` terminó con código 0, usando Auth, API y base reales, sin correos ni cambios a registros del usuario:

1. Otro asesor no convierte el lead ajeno.
2. Dos solicitudes simultáneas crean un solo cliente y conservan los datos capturados.
3. Reintentos conservan las modificaciones posteriores y la privacidad del cliente.
4. Origen protegido frente a eliminación o falsificación.
5. Versión antigua rechazada sin cliente parcial.
6. Reasignación concede acceso al historial al asesor nuevo y retira el acceso anterior.
7. Administrador convierte un lead sin asignar ni operación, conservando tipo Otro.
8. Eliminación de conversiones, registros, membresías y las tres cuentas sintéticas.

La limpieza usa únicamente identidades generadas por la ejecución y verifica que no haya referencias desde registros externos. No se desactivaron disparadores ni se crearon archivos de Storage. Consulta posterior independiente: **0 cuentas QA, 0 registros QA y 0 conversiones**; se conservan **1 lead existente y 0 clientes**, como antes de la prueba.

Permisos posteriores comprobados: `anon` no ejecuta `mnt_convert_lead`; `authenticated` no lee directamente los recibos. El aviso de asesoría sobre la función `SECURITY DEFINER` ejecutable por usuarios autenticados corresponde a esta RPC intencional; autenticación, membresía y propiedad se verifican dentro de ella y en las pruebas anteriores. Los avisos previos del proyecto no se modificaron con esta función.

## Disponibilidad

Interfaz disponible en `http://localhost:3000/admin/leads`, conectada al backend real. El usuario convierte sus leads existentes desde el botón; las comprobaciones usaron exclusivamente registros sintéticos.

La publicación del código en GitHub, integración a `main` y despliegue de la interfaz siguen pendientes de la autorización específica de destino solicitada anteriormente tras el rechazo de revisión automática. La migración de base descrita arriba sí está instalada.
