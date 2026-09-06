# Respaldo verificable y ensayo aislado

El respaldo combina un export del propietario de PostgreSQL y la descarga de todos los objetos de los buckets de la marca. Es necesario coordinar una pausa de escrituras desde el export SQL hasta terminar las descargas: las lecturas REST y Storage por sí solas no forman una instantánea transaccional conjunta.

## Captura

1. Ejecutar `tools/mnt-owner-export.sql` con el propietario en el SQL Editor. La consulta es de lectura y exporta las cinco tablas completas, incluidas revisiones de registros eliminados. Guardar el resultado JSON fuera de `public/` y del control de versiones. Se acepta el objeto directo, una celda `backup` o una lista con esa celda.
2. Con `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` disponibles en `.env.local`, ejecutar:

```powershell
node --env-file=.env.local tools/mnt-backup.mjs --prefix cota --database C:\ruta\owner-backup.json
```

Para un respaldo posterior al cambio, usar `--prefix mnt` y exportar las mismas cinco tablas con prefijo `mnt` y `prefix: mnt` en el JSON. El ensayo de migración descrito abajo acepta únicamente un respaldo anterior con prefijo `cota`.

El programa solo lee el servicio remoto. Guarda cada objeto como un binario numerado, conserva su ruta original y metadatos en un manifiesto local, registra SHA-256, bytes, MIME, privacidad y conteos. La enumeración de objetos es recursiva y paginada. También obtiene una copia REST independiente de las tablas; un rechazo de acceso a revisiones se registra explícitamente. Esa copia parcial nunca reemplaza el export del propietario.

La salida queda en `.superpowers/backups/<fecha-UTC>/`, excluido de Git. El manifiesto contiene información privada. Los nombres de objetos, registros y credenciales no se imprimen en consola. Sin `--database`, el programa marca `databaseComplete: false`; ese resultado no admite ensayo completo.

## Verificación y diagnóstico

```powershell
node tools/mnt-backup.mjs --verify .superpowers/backups/<fecha-UTC>
node tools/mnt-backup.mjs --diagnose .superpowers/backups/<fecha-UTC>
```

La verificación vuelve a calcular los hashes de todos los binarios y JSON incluidos. El manifiesto es evidencia de integridad accidental; debe conservarse también en un medio controlado independiente si se requiere detectar una alteración deliberada de datos y manifiesto juntos.

El diagnóstico escribe `diagnostic-candidates.json` localmente. Solo propone objetos del staging o sin ruta encontrada en el export. Esta coincidencia textual no prueba que un objeto pueda borrarse: puede haber enlaces externos, referencias indirectas o actividad posterior. No elimina ningún objeto ni archivo.

## Ensayo de restauración

```powershell
node tools/mnt-restore-rehearsal.mjs .superpowers/backups/<fecha-UTC>
```

El ensayo crea PostgreSQL PGlite en memoria con esquemas simulados de Auth y Storage, aplica 001 y 002, restaura filas completas como propietario y comprueba referencias y versiones. La desactivación de triggers ocurre exclusivamente en esa base nueva y aislada para conservar las versiones y fechas originales. Después aplica 003 y exige igualdad de contenido, fechas, revisiones y OID de tablas. Verifica todos los hashes de objetos y escribe `restore-rehearsal.json`.

No restaura objetos en Supabase ni escribe en producción. Los mocks no prueban la restauración del proveedor de Auth, contraseñas, sesiones, secretos, configuración del proyecto, extensiones ni disponibilidad de los servicios. La recuperación de Auth y del proyecto debe respaldarse y ensayarse por separado mediante las herramientas del proveedor. Tampoco sustituye un backup nativo/PITR de PostgreSQL cuando esté disponible.

Un ensayo fallido bloquea la declaración de recuperación comprobada. Conservar el respaldo, el error y la evidencia; resolver primero la causa sin modificar el original para hacer pasar la prueba.

## Reconstrucción comprobada cuando no se puede descargar el export

Si la interfaz no permite transferir el JSON del propietario, puede conservarse una reconstrucción diferenciada: cuatro tablas obtenidas mediante REST y las filas completas de revisiones observadas en una consulta del propietario. Esta alternativa no debe presentarse como una descarga SQL original.

El propietario debe ejecutar una consulta independiente y reciente por cada tabla con `md5(coalesce(jsonb_agg(to_jsonb(t) order by ...), '[]'::jsonb)::text)` y su conteo. Ordenar `records` y `record_revisions` por `collection,id`; `staff` por `user_id`; `record_references` por `source_collection,source_id,field`; `rate_limits` por `key`. Guardar un JSON cuyos campos sean esos cinco sufijos y cuyos valores tengan `count` y `md5`.

```powershell
node tools/mnt-assemble-observed-backup.mjs BACKUP_DIR REVISIONS_OBSERVADAS_JSON CHECKSUMS_PROPIETARIO_JSON
```

El programa usa PostgreSQL PGlite para serializar cada array JSON de forma canónica y exige coincidencia de los cinco conteos y hashes antes de crear `database-owner.json`. Conserva por separado las lecturas REST y la evidencia observada, añade SHA-256 para cada archivo y marca `rawOwnerDownload: false` y `ownerChecksumsMatched: true`. MD5 sirve aquí para comparar con la consulta del propietario, no como firma de autenticidad. Se requiere después la misma verificación SHA-256 y el mismo ensayo aislado de restauración.

En el ensayo del 6 de septiembre de 2026 se verificaron 14 registros, 1 membresía, 3 referencias, 3 límites de tasa y 24 revisiones. Los cinco hashes coincidieron con la consulta independiente del propietario; Storage enumeró 3 buckets y 0 objetos. El resultado local quedó en `.superpowers/backups/2026-09-06T01-41-21-144Z`, con procedencia de reconstrucción explícita. El ensayo preservó las cinco tablas al aplicar 003; no escribió en producción.

## Ensayo adicional del contenido de marca (004)

```powershell
node tools/mnt-restore-rehearsal.mjs .superpowers/backups/<fecha-UTC> --content
```

Este modo vuelve a restaurar el respaldo original en memoria y comprueba primero la preservación de 003. Después aplica 004. Exige identidad de registros, fechas de creación intactas, incremento de una revisión por cada fila cuyo JSON cambió y ausencia de cambios en las demás filas. Las membresías, referencias, límites de tasa y tombstones deben conservarse. Guarda `restore-rehearsal-content.json` y `content-migration-after.json` por separado; no sustituye el reporte de 003 ni el respaldo propietario.

En el respaldo comprobado del 6 de septiembre, 004 cambió exactamente 3 registros y conservó intactos los otros 11. Se mantuvieron las 14 identidades y las 24 identidades de revisión. La transformación elimina exclusivamente los contactos de ejemplo identificados, sustituye referencias de marca y conserva slugs y claves de relación. La consulta no mueve objetos ni modifica metadatos de Storage.
