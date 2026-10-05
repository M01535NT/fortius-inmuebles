# Verificación de formatos y control comercial

Fecha local: 4 de octubre de 2026. Rama: `feature/formatos-admin`.

## Resultado verificado

- Catálogo de 25 formatos: 23 pueden emitirse por expediente con captura y revisión completas; el 03 se emite desde Control comercial global. El 09 admite preparación, pero su PDF sigue bloqueado hasta registro y cotejo del modelo registrado.
- `npm run verify`: lint, tipos, 415 pruebas de servidor, 163 de administración y compilación correctos. Total: 578 pruebas.
- Navegador: control comercial a 1440 y 375 px, 2/2 comprobaciones correctas. Captura, guardado y versión; sin desbordamiento horizontal.
- PDF 16: nombres y representaciones largos ajustados a sus columnas; comprobación de geometría sobre el PDF emitido y revisión visual de la página de firmas.
- Cuenta real del usuario: Expedientes y Control comercial cargan en localhost con conexión al servidor y sin el anterior error 503. La base no contiene clientes ni carteras de trabajo todavía.

## Revisión de rama y correcciones

Revisión independiente del rango `356031d3e699a9eeed1986eb4f8fe21031e7215f` a `d5ac79f39a7586f3415afbfd93b131260375f4f3`. Una sola pasada de correcciones, sin segunda revisión independiente.

| Hallazgo | Prueba que falló antes de corregir | Resultado |
|---|---|---|
| Crítico: RPC modificaba tareas, eventos y notas de otro cliente | `impide actualizar, borrar o desvincular ... de un cliente ajeno mediante RPC` | RED→GREEN: lectura y escritura por cliente, borrado y desvinculación protegidos |
| Crítico: copiar una ruta concedía acceso a un archivo privado | `no concede acceso a una ruta privada al copiarla en metadatos de otro cliente` | RED→GREEN: procedencia confiable, vínculo único e inmutable, conservación tras borrar metadatos |
| Importante: navegación descartaba captura y mezclaba respuestas | `conserva los cambios sin guardar...`, `bloquea navegación y edición...`, `evita que una apertura lenta...` | RED→GREEN: navegación protegida, edición suspendida durante operaciones, captura conservada ante fallo |
| Importante: emisión usaba una versión no vista | `rechaza la emisión si otra sesión guardó una versión posterior a la vista` | RED→GREEN: versión requerida y conflicto antes de PDF o Storage |
| Importante: correcciones mantenían pendientes históricos activos | `resuelve pendientes con la última corrección...`, pruebas de cadena única en esquema y SQL | RED→GREEN: vigentes separados de históricos, un sucesor por registro |
| Importante: firmas largas se salían de las columnas | `mantiene nombres y representaciones largos dentro de las dos columnas de firma` | RED→GREEN: ancho real anterior 340.872 pt; ahora ≤200 pt por línea |
| Recalificado importante: aviso afirmaba que 03 y 15 estaban pendientes | `informa las emisiones disponibles...` | RED→GREEN: cantidad derivada del catálogo, vínculo a 03 y bloqueo concreto de 09 |

Dos fallos adicionales aparecieron en las pruebas reales y se corrigieron con pruebas antes de cambiar producción:

- `INSERT ... RETURNING` de un expediente propio era rechazado porque la política de lectura consultaba otra vez la fila nueva mediante una función `STABLE`. La política ahora comprueba directamente asesor y cliente de la fila candidata. Prueba `permite crear y devolver un expediente propio en la misma operación de guardado`, RED→GREEN.
- Storage ocultaba un objeto ajeno como inexistente; la API lo traducía erróneamente a caída 503. Ahora responde 404 sin URL. Prueba `no confunde un archivo inexistente o ajeno con una caída del servidor ni devuelve URL`, RED→GREEN.

## Supabase: instalación y prueba real

Proyecto verificado: `qkkirjzhviqwvuqjnmei` / mnt-inmuebles. Herramienta oficial Supabase CLI 2.119.0.

Primero se validaron las cuatro migraciones iniciales en una transacción real con rollback confirmado. Después se instalaron transaccionalmente, con límites de bloqueo y ejecución. La corrección de lectura de expedientes se instaló después de reproducir el fallo real.

| Migración instalada | SHA-256 del archivo aplicado |
|---|---|
| `202610040009_mnt_expedientes.sql` | `68918FE0AD5F8887648AB344E3CA63EC512FA359977A4E12D0227702BBEA0D47` |
| `202610040010_mnt_formato_assets.sql` | `E5B325664BA552250A1C2C46A3AEBFA27213F5C8AAEC4C3DF4A480CCF68BF216` |
| `20261005000752_mnt_comercial.sql` | `9B226F774B0BDE5CCF5EB8CC1C2A2A670456AA8B0D317C76E76FF9F69EE1DB9B` |
| `20261005004358_mnt_private_upload_provenance.sql` | `8F27EFE2993A1DDE5621C4B275DC1B7F7B1D331664A5C94AC7019B6333FA0013` |
| `20261005011326_mnt_expediente_row_scope.sql` | `7B29591160FDCA519CBD95D309EAB4C897C75D30751B66CCCDF1CAB5A014BA39` |

El proyecto no tenía historial en `supabase_migrations.schema_migrations`: el esquema anterior fue aplicado manualmente. Esta instalación usa consultas transaccionales de Management API. Conciliar historial antes de utilizar `db push`; no volver a aplicar automáticamente las migraciones anteriores.

El usuario autorizó expresamente tres cuentas temporales y su limpieza después del bloqueo inicial de revisión automática. No se enviaron correos. Se comprobaron con Auth, API y Storage reales:

1. Asesor asignado guarda su tarea; otro asesor no la modifica ni elimina; la desvinculación requiere administrador.
2. Creación, devolución y guardado de expediente y borrador propios; acceso ajeno denegado.
3. Versión antigua rechazada; recibo 18 de versión revisada archivado y descargado con SHA-256 coincidente; descarga ajena denegada.
4. Carga privada validada, registro de procedencia y firma temporal sólo para el cliente asignado; ruta copiada rechazada.
5. Control comercial reservado a administrador; cartera, revisión y PDF exacto guardados; descarga comprobada por SHA-256 y denegada al asesor.
6. Cierre de sesiones y eliminación de todos los archivos, datos y cuentas generados. Consulta posterior: 0 cuentas QA, 0 registros QA, 0 carteras QA, 0 archivos de formatos. Se conservan 1 miembro activo, 2 asesores y 0 clientes, como antes de la prueba.

La limpieza se limitó a UUID e identidades generados por la prueba. Los disparadores de archivos inmutables se omitieron sólo dentro de esa transacción de mantenimiento para eliminar esos registros sintéticos; los usuarios normales no tienen esa capacidad.

## Decisiones y límites

Orden de decisiones registrado en el plan:

1. Cartera global sólo administrativa: reúne clientes de distintos asesores. Coste: el asesor no tiene una vista global parcial.
2. Cartera nueva vacía y conciliación explícita; los ejemplos del Excel permanecen en el original. Coste: hay que revisar y capturar los datos de origen.
3. Herramientas de Windows para el registro del plan tras el fallo del ayudante Bash. Coste: mantenimiento del procedimiento en Windows.
4. Renta/Otro no usa automáticamente el honorario de venta del Excel. Coste: definir y revisar la base aplicable antes de calcular.
5. El aviso incorrecto se recalificó como importante porque afectaba qué módulo podía utilizar el usuario. Coste: una prueba y corrección adicionales, incluidas en la verificación.
6. Procedencia privada confiable y vínculo único; archivos antiguos sin comprobante quedan sólo administrativos hasta nueva carga. El administrador puede vincular una carga anterior existente bajo su propio prefijo UUID durante la transición. Coste: algunos archivos antiguos deben cargarse de nuevo para asignarlos a un asesor.
7. Cada registro histórico tiene un único sucesor; la corrección siguiente se enlaza a la última versión. Coste: no se admiten ramas paralelas de corrección.

Cuestiones no certificadas por la revisión independiente, con decisión expresa:

8. Capturar datos no certifica hechos jurídicos, registrales ni fiscales de una operación real. Coste: revisión profesional y documental externa siguen siendo necesarias.
9. El PDF 09 continúa bloqueado porque el usuario confirmó que el modelo no está registrado. Coste: ese contrato aún no se puede emitir.
10. El 07 conserva el método y las limitaciones del Excel; no se sustituyó silenciosamente por una metodología distinta. Coste: mantener esos límites y revisar fuentes y supuestos de cada opinión.
11. Compilación local, instalación en Supabase y pruebas reales no acreditan publicación del código en la web pública. Coste: falta publicar y comprobar el despliegue.

**Menores diferidos:** ninguno.

## Publicación pendiente

La rama conserva los cambios localmente. No se realizó otro push: la revisión automática anterior rechazó transferir código privado a GitHub sin autorización específica de destino. Falta resolver esa autorización para `M01535NT/mnt-inmuebles` y completar la publicación y comprobación del sitio. La carpeta de trabajo se conserva para continuar ese paso.
