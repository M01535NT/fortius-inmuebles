# Respaldo y ensayo del esquema actual de Fortius

El exportador actual incluye las 18 tablas públicas, incluidas `record_history` y `expediente_actividad`. Un export actual que omita cualquiera de ellas se rechaza como incompleto.

1. Coordinar una ventana sin escrituras antes de exportar y hasta terminar Storage. No hay snapshot atómico entre ambos servicios.
2. Ejecutar la consulta de lectura `tools/fortius-inmuebles-owner-export.sql` como propietario. Guardar su JSON en un destino privado fuera del control de versiones.
3. Ejecutar `node --env-file=.env.local tools/fortius-inmuebles-backup.mjs --prefix fortius_inmuebles --database RUTA_EXPORT_PRIVADO.json`.
4. Verificar con `node tools/fortius-inmuebles-backup.mjs --verify DIRECTORIO_BACKUP`.
5. Ensayar con `node tools/fortius-inmuebles-restore-rehearsal.mjs DIRECTORIO_BACKUP`.

El ensayo actual aplica las migraciones del repositorio a PGlite en memoria, exige coincidencia de las tablas del catálogo, importa el export, valida de nuevo todas las FK y compara todos los campos y fechas. Revisa también revisiones de registros. Los reportes guardan resultados, no publican datos.

Además regenera en la base aislada las referencias derivadas del JSON y compara su inventario contra la fuente. Un asesor inexistente dentro del JSON, aunque el índice anterior apuntara a un asesor válido, bloquea el ensayo. No se corrige ni normaliza el respaldo para hacerlo pasar.

**Límites:** el ensayo usa identificadores Auth provisionales, no restaura contraseñas, sesiones ni configuración completa de Supabase. Los hashes verifican los objetos descargados, pero no se ha ensayado subirlos a un servicio Storage de recuperación. Completar esa prueba requiere un destino aislado y una política de custodia/RPO/RTO. No ejecutar una restauración en producción.

La copia REST complementaria cubre las cinco tablas del núcleo histórico; el export propietario es la fuente completa de las 18 tablas. No confundir ambos niveles de cobertura.

Prueba sintética sin acceso remoto: `node --test tests/tools/*.test.mjs`.

## Coherencia documental y recuperación local de objetos (12/10/2026)

El verificador también exige que los PDFs emitidos, copias firmadas, adjuntos y recibos de carga del export actual tengan objetos en el inventario. Las huellas/tamaños documentales deben coincidir con el binario respaldado; metadata de objeto debe estar cubierta por el inventario de archivos con huella y corresponder al bucket. Se rechazan duplicados y buckets privados marcados públicos. Las rutas de archivos no pueden escapar de la copia, tampoco mediante un symlink a un destino externo.

`node tools/fortius-inmuebles-backup.mjs --restore-objects DIRECTORIO_BACKUP --target DIRECTORIO_NUEVO_AISLADO` copia los bytes verificados a un directorio local nuevo con permisos restringidos. Conserva en `objects.json` las rutas/buckets originales y comprueba la huella del archivo recuperado. No requiere credenciales, no sube a Supabase ni reemplaza destinos existentes. El resultado marca expresamente `storageServiceRecovery: not_checked`.

La política y el ensayo del proveedor pendientes están descritos en `docs/erp-crm/recovery-policy.md`. Un ensayo local no acredita recuperación de Auth/Storage del proveedor ni un RPO/RTO operativo.

---

# Antecedentes históricos — no usar como procedimiento del esquema actual

# Respaldo verificable y ensayo aislado

El respaldo combina un export del propietario de PostgreSQL y la descarga de todos los objetos de los buckets de la marca. Es necesario coordinar una pausa de escrituras desde el export SQL hasta terminar las descargas: las lecturas REST y Storage por sí solas no forman una instantánea transaccional conjunta.

## Captura

1. Ejecutar `tools/fortius-inmuebles-owner-export.sql` con el propietario en el SQL Editor. La consulta es de lectura y exporta las cinco tablas completas, incluidas revisiones de registros eliminados. Guardar el resultado JSON fuera de `public/` y del control de versiones. Se acepta el objeto directo, una celda `backup` o una lista con esa celda.
2. Con `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` disponibles en `.env.local`, ejecutar:

```powershell
node --env-file=.env.local tools/fortius-inmuebles-backup.mjs --prefix cota --database C:\ruta\owner-backup.json
```

Para un respaldo posterior al cambio, usar `--prefix mnt` y exportar las mismas cinco tablas con prefijo `mnt` y `prefix: mnt` en el JSON. El ensayo de migración descrito abajo acepta únicamente un respaldo anterior con prefijo `cota`.

El programa solo lee el servicio remoto. Guarda cada objeto como un binario numerado, conserva su ruta original y metadatos en un manifiesto local, registra SHA-256, bytes, MIME, privacidad y conteos. La enumeración de objetos es recursiva y paginada. También obtiene una copia REST independiente de las tablas; un rechazo de acceso a revisiones se registra explícitamente. Esa copia parcial nunca reemplaza el export del propietario.

La salida queda en `.superpowers/backups/<fecha-UTC>/`, excluido de Git. El manifiesto contiene información privada. Los nombres de objetos, registros y credenciales no se imprimen en consola. Sin `--database`, el programa marca `databaseComplete: false`; ese resultado no admite ensayo completo.

## Verificación y diagnóstico

```powershell
node tools/fortius-inmuebles-backup.mjs --verify .superpowers/backups/<fecha-UTC>
node tools/fortius-inmuebles-backup.mjs --diagnose .superpowers/backups/<fecha-UTC>
```

La verificación vuelve a calcular los hashes de todos los binarios y JSON incluidos. El manifiesto es evidencia de integridad accidental; debe conservarse también en un medio controlado independiente si se requiere detectar una alteración deliberada de datos y manifiesto juntos.

El diagnóstico escribe `diagnostic-candidates.json` localmente. Solo propone objetos del staging o sin ruta encontrada en el export. Esta coincidencia textual no prueba que un objeto pueda borrarse: puede haber enlaces externos, referencias indirectas o actividad posterior. No elimina ningún objeto ni archivo.

## Ensayo de restauración

```powershell
node tools/fortius-inmuebles-restore-rehearsal.mjs .superpowers/backups/<fecha-UTC>
```

El ensayo crea PostgreSQL PGlite en memoria con esquemas simulados de Auth y Storage, aplica 001 y 002, restaura filas completas como propietario y comprueba referencias y versiones. La desactivación de triggers ocurre exclusivamente en esa base nueva y aislada para conservar las versiones y fechas originales. Después aplica 003 y exige igualdad de contenido, fechas, revisiones y OID de tablas. Verifica todos los hashes de objetos y escribe `restore-rehearsal.json`.

Durante el corte 003 conserva temporalmente un único wrapper de lectura pública para el build anterior; no conserva escrituras antiguas ni concede acceso adicional. Aplicar 005 para retirarlo solo después de verificar el build MNT. Una instalación completa incluye 001–005 y termina sin RPC antiguos. El procedimiento operativo está en `fortius-inmuebles-cutover-rollback.md`.

No restaura objetos en Supabase ni escribe en producción. Los mocks no prueban la restauración del proveedor de Auth, contraseñas, sesiones, secretos, configuración del proyecto, extensiones ni disponibilidad de los servicios. La recuperación de Auth y del proyecto debe respaldarse y ensayarse por separado mediante las herramientas del proveedor. Tampoco sustituye un backup nativo/PITR de PostgreSQL cuando esté disponible.

Un ensayo fallido bloquea la declaración de recuperación comprobada. Conservar el respaldo, el error y la evidencia; resolver primero la causa sin modificar el original para hacer pasar la prueba.

## Reconstrucción comprobada cuando no se puede descargar el export

Si la interfaz no permite transferir el JSON del propietario, puede conservarse una reconstrucción diferenciada: cuatro tablas obtenidas mediante REST y las filas completas de revisiones observadas en una consulta del propietario. Esta alternativa no debe presentarse como una descarga SQL original.

El propietario debe ejecutar una consulta independiente y reciente por cada tabla con `md5(coalesce(jsonb_agg(to_jsonb(t) order by ...), '[]'::jsonb)::text)` y su conteo. Ordenar `records` y `record_revisions` por `collection,id`; `staff` por `user_id`; `record_references` por `source_collection,source_id,field`; `rate_limits` por `key`. Guardar un JSON cuyos campos sean esos cinco sufijos y cuyos valores tengan `count` y `md5`.

```powershell
node tools/fortius-inmuebles-assemble-observed-backup.mjs BACKUP_DIR REVISIONS_OBSERVADAS_JSON CHECKSUMS_PROPIETARIO_JSON
```

El programa usa PostgreSQL PGlite para serializar cada array JSON de forma canónica y exige coincidencia de los cinco conteos y hashes antes de crear `database-owner.json`. Conserva por separado las lecturas REST y la evidencia observada, añade SHA-256 para cada archivo y marca `rawOwnerDownload: false` y `ownerChecksumsMatched: true`. MD5 sirve aquí para comparar con la consulta del propietario, no como firma de autenticidad. Se requiere después la misma verificación SHA-256 y el mismo ensayo aislado de restauración.

En el ensayo del 6 de septiembre de 2026 se verificaron 14 registros, 1 membresía, 3 referencias, 3 límites de tasa y 24 revisiones. Los cinco hashes coincidieron con la consulta independiente del propietario; Storage enumeró 3 buckets y 0 objetos. El resultado local quedó en `.superpowers/backups/2026-09-06T01-41-21-144Z`, con procedencia de reconstrucción explícita. El ensayo preservó las cinco tablas al aplicar 003; no escribió en producción.

## Ensayo adicional del contenido de marca (004)

```powershell
node tools/fortius-inmuebles-restore-rehearsal.mjs .superpowers/backups/<fecha-UTC> --content
```

Este modo vuelve a restaurar el respaldo original en memoria y comprueba primero la preservación de 003. Después aplica 004. Exige identidad de registros, fechas de creación intactas, incremento de una revisión por cada fila cuyo JSON cambió y ausencia de cambios en las demás filas. Las membresías, referencias, límites de tasa y tombstones deben conservarse. Guarda `restore-rehearsal-content.json` y `content-migration-after.json` por separado; no sustituye el reporte de 003 ni el respaldo propietario.

En el respaldo comprobado del 6 de septiembre, 004 cambió exactamente 3 registros y conservó intactos los otros 11. Se mantuvieron las 14 identidades y las 24 identidades de revisión. La transformación elimina exclusivamente los contactos de ejemplo identificados, sustituye referencias de marca y conserva slugs y claves de relación. La consulta no mueve objetos ni modifica metadatos de Storage.
