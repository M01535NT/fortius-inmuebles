# Respaldo y ensayo del esquema actual de Fortius

El exportador del código actual incluye las 26 tablas públicas de Fortius y marca `schema_version: 2`. Conserva las 18 tablas anteriores, incluidas `record_history` y `expediente_actividad`, y añade las ocho de Apps: `app_runs`, `app_run_versions`, `app_files`, `app_shares`, `integration_jobs`, `integration_artifacts`, `integration_pages` y `signature_events` (todas con prefijo `fortius_inmuebles_`). Un export actual que omita cualquiera se rechaza como incompleto; también se rechazan tablas desconocidas o una versión de esquema no soportada. Esta cobertura corresponde al repositorio y no acredita que sus migraciones se hayan aplicado al entorno remoto.

1. Coordinar una ventana sin escrituras antes de exportar y hasta terminar Storage. No hay snapshot atómico entre ambos servicios.
2. Ejecutar la consulta de lectura `tools/fortius-inmuebles-owner-export.sql` como propietario. Guardar su JSON en un destino privado fuera del control de versiones.
3. Ejecutar `node --env-file=.env.local tools/fortius-inmuebles-backup.mjs --prefix fortius_inmuebles --database RUTA_EXPORT_PRIVADO.json`.
4. Verificar con `node tools/fortius-inmuebles-backup.mjs --verify DIRECTORIO_BACKUP`.
5. Ensayar con `node tools/fortius-inmuebles-restore-rehearsal.mjs DIRECTORIO_BACKUP`.

El ensayo fija UTC antes de aplicar las migraciones para conservar las fechas y sus microsegundos con independencia de la zona horaria del equipo. El export propietario se guarda como JSON sin convertir sus cadenas de fecha a objetos DateTime. El ensayo actual aplica las migraciones del repositorio a PGlite en memoria, exige coincidencia de las tablas del catálogo, importa el export, valida de nuevo todas las FK y compara todos los campos y fechas. Revisa también revisiones de registros y la continuidad del historial de Apps, incluida la coincidencia del snapshot más reciente con el trabajo. Conserva datos de trabajos eliminados, enlaces revocados, reservas/cargos y eventos de firma. Calcula de nuevo las columnas generadas, como el índice de búsqueda OCR, y contrasta cualquier valor generado presente en el export. Los reportes guardan resultados, no publican datos.

Además regenera en la base aislada las referencias derivadas del JSON y compara su inventario contra la fuente. Un asesor inexistente dentro del JSON, aunque el índice anterior apuntara a un asesor válido, bloquea el ensayo. No se corrige ni normaliza el respaldo para hacerlo pasar.

**Límites:** el ensayo usa identificadores Auth provisionales, no restaura contraseñas, sesiones ni configuración completa de Supabase. Los hashes verifican los objetos descargados, pero no se ha ensayado subirlos a un servicio Storage de recuperación. Completar esa prueba requiere un destino aislado y una política de custodia/RPO/RTO. No ejecutar una restauración en producción.

La copia REST complementaria del esquema actual recorre las 26 tablas con orden por clave primaria y paginación. Sigue siendo evidencia de contraste: no sustituye el export propietario ni crea un snapshot atómico. Los formatos históricos `cota` y `mnt` mantienen sus cinco tablas originales.

Los respaldos Fortius históricos completos de 18 tablas, sin marcador de versión o con `schema_version: 1`, siguen siendo verificables y restaurables. El ensayo conserva la fuente intacta e informa `sourceSchemaVersion` y las ocho `emptyTablesAdded`: estaban ausentes en ese esquema histórico y quedan vacías en la base nueva. Un respaldo de versión 2 sin las tablas de Apps no se reclasifica como antiguo; un inventario parcial de Apps tampoco pasa. Las tablas se cargan con padres antes de dependientes; el ciclo histórico entre registros y expedientes se resuelve solo en la base aislada, validando todas las FK al terminar.

Los archivos y artefactos de Apps requieren SHA-256 de 64 caracteres hexadecimales y tamaño entero positivo; valores vacíos o ausentes no omiten la comprobación. Cada fila de `app_files` requiere además un único recibo en `file_uploads`, con bucket privado, misma ruta, mismo propietario y vínculo `apps:<expediente>` o `apps:independent` concordante. Esta comprobación se ejecuta también al ensayar directamente la base. Los artefactos de proveedores mantienen su relación con el trabajo y no requieren recibo genérico. La metadata de todos los buckets se valida aunque estén vacíos, sin IDs duplicados. Si el manifiesto declara `database.schemaVersion`, debe coincidir con la versión del export; no se acepta degradar una copia declarada como actual a un inventario histórico.

Prueba sintética sin acceso remoto: `node --test tests/tools/*.test.mjs`.

## Coherencia documental y recuperación local de objetos (12/10/2026)

El verificador también exige que los PDFs emitidos, copias firmadas, adjuntos y recibos de carga del export actual tengan objetos en el inventario. Incluye los originales y PDFs generados de `app_files` en `fortius-inmuebles-private`, y cada original, documento firmado y evidencia de `integration_artifacts` en `fortius-app-integrations`. El recolector incorpora expresamente este último bucket privado, aunque su nombre no comparta el prefijo habitual de Storage. Las huellas/tamaños documentales deben coincidir con el binario respaldado; metadata de objeto debe estar cubierta por el inventario de archivos con huella y corresponder al bucket. Se rechazan duplicados y buckets privados marcados públicos. Las rutas de archivos no pueden escapar de la copia, tampoco mediante un symlink a un destino externo.

`node tools/fortius-inmuebles-backup.mjs --restore-objects DIRECTORIO_BACKUP --target DIRECTORIO_NUEVO_AISLADO` copia los bytes verificados a un directorio local nuevo con permisos restringidos. Conserva en `objects.json` las rutas/buckets originales y comprueba la huella del archivo recuperado. No requiere credenciales, no sube a Supabase ni reemplaza destinos existentes. El resultado marca expresamente `storageServiceRecovery: not_checked`.

La política y el ensayo del proveedor pendientes están descritos en `docs/erp-crm/recovery-policy.md`. Un ensayo local no acredita recuperación de Auth/Storage del proveedor ni un RPO/RTO operativo.
