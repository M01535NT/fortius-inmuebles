# Respaldo y ensayo del esquema actual de Fortius

El exportador del código actual incluye las 30 tablas públicas de Fortius y marca `schema_version: 4`. Conserva las 18 tablas anteriores, incluidas `record_history` y `expediente_actividad`, y añade las entrevistas operativas (`interviews`) y las ocho tablas de Apps: `app_runs`, `app_run_versions`, `app_files`, `app_shares`, `integration_jobs`, `integration_artifacts`, `integration_pages` y `signature_events`; desde la versión 4 (29/10/2026), los documentos del cliente por expediente: `expediente_archivos`, `expediente_datos` e `ia_lecturas` (todas con prefijo `fortius_inmuebles_`). Cada archivo de `expediente_archivos` debe estar respaldado en el bucket privado `fortius-inmuebles-expedientes` con la misma huella y tamaño. Un export actual que omita cualquiera se rechaza como incompleto; también se rechazan tablas desconocidas o una versión de esquema no soportada. Esta cobertura corresponde al repositorio y no acredita que sus migraciones se hayan aplicado al entorno remoto.

1. Coordinar una ventana sin escrituras antes de exportar y hasta terminar Storage. No hay snapshot atómico entre ambos servicios.
2. Ejecutar la consulta de lectura `tools/fortius-inmuebles-owner-export.sql` como propietario. Guardar su JSON en un destino privado fuera del control de versiones.
3. Ejecutar `node --env-file=.env.local tools/fortius-inmuebles-backup.mjs --prefix fortius_inmuebles --database RUTA_EXPORT_PRIVADO.json`.
4. Verificar con `node tools/fortius-inmuebles-backup.mjs --verify DIRECTORIO_BACKUP`.
5. Ensayar con `node tools/fortius-inmuebles-restore-rehearsal.mjs DIRECTORIO_BACKUP`.

El ensayo fija UTC antes de aplicar las migraciones para conservar las fechas y sus microsegundos con independencia de la zona horaria del equipo. El export propietario se guarda como JSON sin convertir sus cadenas de fecha a objetos DateTime. El ensayo actual aplica las migraciones del repositorio a PGlite en memoria, exige coincidencia de las tablas del catálogo, importa el export, valida de nuevo todas las FK y compara todos los campos y fechas. Revisa también revisiones de registros y la continuidad del historial de Apps, incluida la coincidencia del snapshot más reciente con el trabajo. Conserva datos de trabajos eliminados, enlaces revocados, reservas/cargos y eventos de firma. Calcula de nuevo las columnas generadas, como el índice de búsqueda OCR, y contrasta cualquier valor generado presente en el export. Los reportes guardan resultados, no publican datos.

Además regenera en la base aislada las referencias derivadas del JSON y compara su inventario contra la fuente. Un asesor inexistente dentro del JSON, aunque el índice anterior apuntara a un asesor válido, bloquea el ensayo. No se corrige ni normaliza el respaldo para hacerlo pasar.

**Límites:** el ensayo usa identificadores Auth provisionales, no restaura contraseñas, sesiones ni configuración completa de Supabase. Desde el 12/11/2026 existe la herramienta para subir los objetos a un servicio Storage aislado y releerlos (sección «Restauración de Storage en un proyecto aislado»), pero el ensayo real contra un proyecto aislado sigue pendiente porque no hay ninguno autorizado. No ejecutar una restauración en producción.

La copia REST complementaria del esquema actual recorre las 30 tablas con orden por clave primaria y paginación. Sigue siendo evidencia de contraste: no sustituye el export propietario ni crea un snapshot atómico. Los ledgers internos `record_revisions`, `record_history` y `lead_conversions` no conceden lectura directa al rol de servicio. Si REST devuelve `42501` para esas tres tablas, se conserva la denegación como evidencia incompleta y solo se continúa cuando existe un export propietario íntegro de versión 4. El manifiesto distingue `database.complete` de `rest.complete` y enumera `rest.unavailable`; ninguna tabla se omite del export propietario. Cualquier otra tabla, error o export incompleto bloquea la copia. No se amplían permisos. Los formatos históricos `cota` y `mnt` mantienen sus cinco tablas originales.

Los respaldos Fortius históricos completos de 18 tablas, sin marcador de versión o con `schema_version: 1`, siguen siendo verificables y restaurables. El ensayo conserva la fuente intacta e informa `sourceSchemaVersion` y las doce `emptyTablesAdded` (las ocho tablas de Apps, `interviews` y las tres de documentos del cliente): estaban ausentes en ese esquema histórico y quedan vacías en la base nueva. Un respaldo íntegro de versión 2 conserva sus 26 tablas y añade vacías `interviews` y las tres tablas de documentos del cliente; uno de versión 3 conserva sus 27 y añade solo esas tres. Un respaldo de versión 2 sin las tablas de Apps no se reclasifica como antiguo; un inventario parcial de Apps tampoco pasa. La versión 3 exige las 27 tablas, incluidas las entrevistas, y la 4 las 30. Las tablas se cargan con padres antes de dependientes; el ciclo histórico entre registros y expedientes se resuelve solo en la base aislada, validando todas las FK al terminar.

Los archivos y artefactos de Apps requieren SHA-256 de 64 caracteres hexadecimales y tamaño entero positivo; valores vacíos o ausentes no omiten la comprobación. Cada fila de `app_files` requiere además un único recibo en `file_uploads`, con bucket privado, misma ruta, mismo propietario y vínculo `apps:<expediente>` o `apps:independent` concordante. Esta comprobación se ejecuta también al ensayar directamente la base. Los artefactos de proveedores mantienen su relación con el trabajo y no requieren recibo genérico. La metadata de todos los buckets se valida aunque estén vacíos, sin IDs duplicados. Si el manifiesto declara `database.schemaVersion`, debe coincidir con la versión del export; no se acepta degradar una copia declarada como actual a un inventario histórico.

Prueba sintética sin acceso remoto: `node --test tests/tools/*.test.mjs`.

## Coherencia documental y recuperación local de objetos (12/10/2026)

El verificador también exige que los PDFs emitidos, copias firmadas, adjuntos y recibos de carga del export actual tengan objetos en el inventario. Incluye los originales y PDFs generados de `app_files` en `fortius-inmuebles-private`, y cada original, documento firmado y evidencia de `integration_artifacts` en `fortius-app-integrations`. El recolector incorpora expresamente este último bucket privado, aunque su nombre no comparta el prefijo habitual de Storage. Las huellas/tamaños documentales deben coincidir con el binario respaldado; metadata de objeto debe estar cubierta por el inventario de archivos con huella y corresponder al bucket. Se rechazan duplicados y buckets privados marcados públicos. Las rutas de archivos no pueden escapar de la copia, tampoco mediante un symlink a un destino externo.

`node tools/fortius-inmuebles-backup.mjs --restore-objects DIRECTORIO_BACKUP --target DIRECTORIO_NUEVO_AISLADO` copia los bytes verificados a un directorio local nuevo con permisos restringidos. Conserva en `objects.json` las rutas/buckets originales y comprueba la huella del archivo recuperado. No requiere credenciales, no sube a Supabase ni reemplaza destinos existentes. El resultado marca expresamente `storageServiceRecovery: not_checked`.

La política y el ensayo del proveedor pendientes están descritos en `docs/erp-crm/recovery-policy.md`. Un ensayo local no acredita recuperación de Auth/Storage del proveedor ni un RPO/RTO operativo.

## Restauración de Storage en un proyecto aislado (12/11/2026)

`tools/fortius-inmuebles-restore-storage.mjs` sube los objetos de un respaldo verificado a un proyecto Supabase **aislado** y los vuelve a leer para comparar huella y tamaño, uno por uno. Se usa después de aplicar las migraciones del repositorio a ese proyecto, porque las migraciones crean los buckets y las políticas de `storage.objects`.

1. Revisar sin credenciales qué se va a restaurar: `node tools/fortius-inmuebles-restore-storage.mjs DIRECTORIO_BACKUP --plan`. Muestra buckets, objetos y bytes; verifica el respaldo completo antes.
2. Guardar en un archivo propio, fuera del repositorio, `FORTIUS_RECOVERY_SUPABASE_URL`, `FORTIUS_RECOVERY_SERVICE_ROLE_KEY` y, de preferencia, `FORTIUS_RECOVERY_ANON_KEY` del proyecto aislado. No usar `.env.local`.
3. Ejecutar `node --env-file=RUTA_ENV_RECUPERACION tools/fortius-inmuebles-restore-storage.mjs DIRECTORIO_BACKUP --confirm-target REF_DEL_PROYECTO_AISLADO`.

Salvaguardas comprobadas por `tests/tools/restore-storage.test.mjs`:

- Rechaza el proyecto de producción (`qkkirjzhviqwvuqjnmei`), el proyecto de origen (`NEXT_PUBLIC_SUPABASE_URL`) y una clave igual a la de origen. El ref debe repetirse con `--confirm-target`. Acepta también una pila local de Supabase (`127.0.0.1`, ref `local`).
- Si el respaldo no pasa `--verify`, no escribe nada. Si un bucket del destino ya tiene objetos, se detiene antes de escribir; nunca mezcla ni sobrescribe (`upsert: false`).
- Un bucket vacío creado por las migraciones se ajusta a la privacidad, límite y tipos del respaldo; uno faltante se crea.
- Tras subir, descarga cada objeto y compara SHA-256 y tamaño; una diferencia, una subida rechazada o un bucket con privacidad distinta hace fallar el ensayo.
- Con la clave anónima comprueba que ningún objeto privado se pueda descargar sin sesión (`privateDenial: verified`); sin ella, el informe dice `not_checked`.
- Mide la duración total, de subida y de relectura en milisegundos, para contrastar con el RTO de ocho horas.

El informe se guarda en el directorio del respaldo como `storage-restore-REF-FECHA.json`, sin claves ni contenido. Lo que **no** cubre: el propietario original de cada objeto (`owner_id`; las subidas usan el rol de servicio del destino), las cuentas de Auth y sus contraseñas, y la configuración del proyecto (correo, URL de retorno, límites de Auth). Esas partes requieren el procedimiento del proveedor descrito en `docs/erp-crm/recovery-policy.md`.

**Estado (12/11/2026):** el titular eligió la **pila local de Supabase** como destino del ensayo. La herramienta y las pruebas sintéticas están listas; **el ensayo real sigue pendiente** porque el equipo no tiene Docker ni WSL, que la pila local necesita.

**Los buckets no salen de las migraciones.** Las migraciones crean los buckets con sus nombres históricos (`mnt-*`, `cota-*`) y reescriben las políticas de `storage.objects` hacia `fortius-inmuebles-*`. En producción, los buckets `fortius-inmuebles-*` se crearon aparte con `tools/fortius-inmuebles-storage-identity.mjs`. Un proyecto nuevo creado solo con migraciones tiene las políticas, pero no los buckets. La restauración de Storage los crea desde el inventario del respaldo, con su privacidad, límite y tipos. Los buckets históricos quedan vacíos en el destino y no estorban.

### Respaldo sintético para el ensayo

`node tools/fortius-inmuebles-synthetic-backup.mjs DIRECTORIO_NUEVO` crea, sin red ni credenciales, un respaldo completo de versión 4 con las 30 tablas. Contiene un administrador y un asesor de ensayo (`*.ensayo@fortius.test`), dos expedientes (uno del asesor y otro ajeno), una emisión y un documento del cliente. Las huellas de los PDF sintéticos coinciden con sus filas, y los buckets son los de producción. El manifiesto lleva `synthetic: true`. Pasa `--verify`, el ensayo en memoria y `restore-storage --plan` (`tests/tools/synthetic-backup.test.mjs`).

### Ensayo en la pila local (pendiente de Docker)

1. El titular instala WSL 2 y Docker Desktop (requiere administrador y reiniciar). La CLI de Supabase se usa con `npx supabase@2`, sin instalarla globalmente.
2. El agente prepara una carpeta de trabajo fuera del repositorio, con la configuración de `supabase init` y una copia de `supabase/migrations`, y ejecuta `npx supabase start`. Así se aplican las migraciones a una base local nueva.
3. Respaldo sintético → `restore-storage` contra `http://127.0.0.1:54321` con `--confirm-target local` y la clave anónima local.
4. Carga del export en la base local y creación de las dos cuentas de ensayo en el Auth local.
5. Acceso: el asesor descarga la emisión de su expediente y se le niega el documento del expediente ajeno; el administrador descarga ambos; sin sesión, nada privado se descarga. Medir los tiempos de punta a punta.


### Equipos con Windows

`.gitattributes` fija `*.sql text eol=lf`. Con `core.autocrlf=true`, las migraciones se descargaban con CRLF y el ensayo de base fallaba en Windows (`Unexpected process function`), aunque en CI (Linux) pasaba. Si una copia antigua conserva CRLF, volver a descargar las migraciones con `git checkout -- supabase/migrations` después de actualizar la rama.
