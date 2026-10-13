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
