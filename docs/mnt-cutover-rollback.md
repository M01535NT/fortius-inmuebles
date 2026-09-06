# Corte y recuperación de MNT Inmuebles

## Estado y alcance de la evidencia

El respaldo de referencia es `.superpowers/backups/2026-09-06T01-41-21-144Z`. Sus cinco arrays PostgreSQL coinciden con checksums obtenidos mediante una consulta independiente del propietario: 14 registros, 1 membresía, 3 referencias, 3 límites de tasa y 24 revisiones. La procedencia es una reconstrucción comprobada desde REST y revisiones observadas, no una descarga SQL original. Se enumeraron 3 buckets y 0 objetos. Se conserva además un bundle del repositorio como evidencia separada del respaldo de datos.

Los ensayos aislados de 003 y 004 pasaron. 003 conservó todas las filas y las identidades de tablas/funciones. 004 modificó 3 registros, conservó 11 intactos y mantuvo IDs, referencias y tombstones; las revisiones de las filas cambiadas avanzaron una vez. Esto prueba los procedimientos sobre el snapshot, no demuestra que las migraciones ya estén aplicadas en producción.

El operador informó que Git, Supabase y Vercel fueron renombrados conservando sus IDs; registró el hostname nuevo, configuró `MNT_SITE_URL`, dejó `MNT_PUBLIC_LEADS_ENABLED=false` y actualizó Auth Site URL. Antes del corte se deben contrastar esos ajustes con el panel real. Un nombre de proyecto o un hostname registrado no demuestra todavía que el tráfico sirva el build nuevo.

## Preparación antes de interrumpir tráfico

1. Registrar el commit/build actual y el candidato MNT, los IDs de proyecto, dominios, variables no secretas y mecanismo de pausa disponible. Guardar credenciales únicamente en el almacén de secretos; no incluirlas en bitácoras ni comandos impresos.
2. Ejecutar `npm run verify` y las pruebas de navegador contra el build de producción con CSP. Conservar la evidencia de escritorio/móvil, tema claro/oscuro, administración y envío desactivado.
3. Verificar el respaldo con `node tools/mnt-backup.mjs --verify BACKUP_DIR` y ambos ensayos: `node tools/mnt-restore-rehearsal.mjs BACKUP_DIR` y la misma orden con `--content`.
4. Preparar la reversión con `node tools/mnt-prepare-rollback.mjs BACKUP_DIR`. Genera `rollback-identity-guarded.sql` dentro del respaldo y rehúsa sobrescribir un archivo existente. El archivo contiene solo checksums/conteos y operaciones DDL; no restaura contenido.
5. Mantener bloqueados los envíos públicos y las escrituras administrativas durante la ventana. La pausa HTTP del proyecto no revoca por sí misma clientes Supabase existentes: coordinar también las sesiones del equipo y cualquier integración.

## Secuencia de corte

1. Activar la pausa o modo de mantenimiento del proyecto Vercel y confirmar desde una sesión externa que el público ya no inicia operaciones. Registrar hora y responsables. No continuar si el proveedor no permite aislar la ventana prevista.
2. Obtener una consulta nueva del propietario con los cinco conteos/checksums, usando los órdenes indicados en `mnt-backup-restore.md`. Deben coincidir con el snapshot respaldado. Enumerar de nuevo buckets/objetos. Si hay cualquier diferencia, detener el corte, capturar un respaldo nuevo y repetir el ensayo; no sobrescribir el anterior.
3. Aplicar `supabase/migrations/202609060003_mnt_identity.sql` como propietario y comprobar el resultado de su transacción. No omitir el preflight de slugs ni modificar 001/002. Aplicar luego `202609060004_mnt_content_identity.sql`. Cada archivo es una transacción independiente: si 004 falla después de confirmar 003, el esquema ya es MNT y debe mantenerse código compatible mientras se resuelve 004.
4. Verificar que existen las cinco tablas MNT, que no quedan RPC COTA activos y que los permisos/roles se conservan. Comparar las 14 identidades y las 24 identidades de revisión; comprobar exactamente las 3 filas previstas de marca y sus incrementos de versión. Confirmar que membresías y referencias permanecen iguales y que ambas generaciones de buckets privados/staging se excluyen de la proyección pública.
5. Publicar el build MNT comprobado en el mismo proyecto. Confirmar dominio, `MNT_SITE_URL`, backend dedicado, secreto de servidor y `MNT_PUBLIC_LEADS_ENABLED=false`. Los secretos no deben pasar a variables `NEXT_PUBLIC_*`.
6. Probar por el canal de acceso autorizado durante mantenimiento: `/api/health`, inicio, inventario, blog, páginas 404/error, acceso al panel, CSP y formularios desactivados con/sin JS. Las pruebas de esta ventana deben ser de lectura. Si se crean datos de prueba o cualquier fila cambia, ya no aplica la reversión automática descrita abajo.
7. Retirar la pausa solo cuando la verificación termine. Comprobar tráfico real del nuevo hostname y el dominio canónico antes de habilitar redirecciones del dominio anterior. Revisar que no se formen bucles.
8. Mantener leads desactivados hasta la autorización operativa de recepción. Cuando se habiliten, comprobar una persistencia reconocida por el servidor con un registro de prueba identificado y seguir la política de conservación correspondiente.

Con cero objetos originales no se necesitan copias de Storage en este corte. Ese hecho debe verificarse de nuevo en la ventana. Los buckets de recuperación no se eliminan; cualquier cambio posterior de su visibilidad requiere confirmar que no hay referencias activas. No modificar `storage.objects` mediante SQL para simular una copia.

## Recuperación preferida

Si falla la interfaz después de 003, mantener el servicio pausado y desplegar un commit MNT compatible con el esquema nuevo. Esto preserva los datos recientes y evita una reversión de nombres innecesaria. Si falla 004, conservar 003 y resolver el contenido mediante una nueva revisión autorizada; la copia anterior permanece como evidencia.

No restaurar un export antiguo sobre producción para corregir un fallo de interfaz. Auth, sesiones, contraseñas, secretos y configuración del proveedor tienen su propio procedimiento de recuperación. El backup de las cinco tablas y sus mocks PGlite no representa una recuperación completa de Auth ni del proyecto.

## Reversión excepcional del esquema durante la ventana intacta

Solo cuando el operador confirma que la ventana sigue pausada, que no hubo escrituras posteriores y que es necesario volver al build previo:

1. Conservar evidencia del estado y error actuales. El archivo `rollback-identity-guarded.sql` debe corresponder al mismo respaldo ensayado.
2. Ejecutar el archivo completo en una única sesión del propietario. Su preámbulo crea una tabla temporal de checksums; el inversor toma el mismo bloqueo de escrituras del producto y bloqueos de tablas, compara las cinco tablas y rehúsa continuar si cambió algún contenido, versión, membresía, referencia, límite de tasa o tombstone. También rehúsa si existe cualquier objeto en buckets MNT. La única fecha excluida de comparación es `records.updated_at`, pues 004 la genera en el momento del corte; una escritura normal incrementa la versión y se detecta igualmente.
3. La transacción restaura nombres COTA de tablas, funciones, índices, restricciones, policies y triggers manteniendo OID, permisos, contenido y revisiones. Conserva la protección de slugs y el rechazo de URLs privadas/staging de ambas generaciones. No instala aliases públicos, no elimina buckets y no revierte la marca del JSON.
4. Desplegar el build previo compatible, verificar el acceso y el contenido antes de retirar mantenimiento. Las cookies de sesión cambiaron de nombre: se requiere iniciar sesión nuevamente. Los nombres comerciales MNT pueden permanecer en datos y el build anterior puede mostrar su identidad visual anterior durante esta recuperación excepcional.
5. Registrar que 003/004 fueron revertidas en nombres mediante una intervención compensatoria. No borrar el historial de migraciones ni ejecutar 003 otra vez automáticamente: los buckets MNT y las restricciones de slugs se conservaron. Un siguiente avance requiere un script de reanudación revisado para ese estado existente.

Si el guard falla, no editar sus checksums para forzarlo a pasar. Mantener mantenimiento y usar un build compatible con MNT. Si se requiere una recuperación de datos después de nuevas escrituras, preparar una conciliación que preserve registros, versiones y archivos posteriores; presentar el resultado concreto para autorización antes de cualquier restauración productiva. El programa de ensayo continúa siendo exclusivamente local.

## Evidencia del inversor

Las pruebas PGlite comprueban rechazo sin preámbulo, rechazo después de una actualización y rechazo con objetos nuevos. En el caso permitido comprueban contenido/revisiones exactos, OID/ACL/configuración de funciones, conservación de los seis buckets, ausencia de aliases MNT y continuidad de las restricciones de slugs y exclusiones privadas. Esta evidencia no sustituye una prueba del proveedor real ni autoriza restauraciones fuera de la ventana definida.

También se ejecutó `node tools/mnt-restore-rehearsal.mjs BACKUP_DIR --content --rollback` contra el respaldo real comprobado. El artefacto guardado se aplicó solo en PGlite y conservó los 14 registros y las 24 revisiones; el resultado está en `restore-rehearsal-rollback.json`. Los timestamps del preámbulo se normalizan mediante el tipo PostgreSQL `timestamptz`, evitando diferencias de representación entre REST y PostgreSQL. Un diagnóstico de un intento previo fallido puede permanecer como evidencia; la conclusión corresponde al reporte exitoso posterior, no a eliminar el diagnóstico anterior.
