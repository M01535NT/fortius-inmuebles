# Corte de escrituras y recuperación de MNT Inmuebles

## Estado y evidencia

El sitio público permanece disponible durante el corte. Se interrumpen temporalmente las escrituras del build antiguo mediante el cambio de nombres de sus RPC; una única función de compatibilidad mantiene sus lecturas públicas. Este procedimiento no requiere pausar el proyecto completo de Vercel.

El respaldo comprobado es `.superpowers/backups/2026-09-06T01-41-21-144Z`: 14 registros, 1 membresía, 3 referencias, 3 límites de tasa y 24 revisiones. Los cinco arrays canónicos coinciden con una consulta independiente del propietario. La procedencia es reconstrucción comprobada desde REST y revisiones observadas, no descarga SQL original. Storage contenía 3 buckets y 0 objetos; el bundle del repositorio es evidencia separada.

Los ensayos aislados preservan todas las filas al aplicar 003. Después, 004 cambia exactamente 3 registros y conserva 11 intactos, mantiene identidades/referencias/tombstones y avanza una revisión por cada fila modificada. Esto no afirma que las migraciones ya estén aplicadas en producción.

El operador informó que los proyectos Git, Supabase y Vercel conservan sus IDs tras el renombrado, que el nuevo hostname está registrado, que `MNT_SITE_URL` está configurado, que `MNT_PUBLIC_LEADS_ENABLED=false` y que Auth Site URL fue actualizado. Contrastar esos ajustes con los paneles reales; el registro de un hostname no demuestra que ya sirva el build candidato.

## Preparación

1. Registrar commits/builds, IDs de proyecto, dominios, variables no secretas y responsables. Conservar secretos fuera de bitácoras.
2. Completar `npm run verify` y las pruebas de navegador contra el build de producción. Comprobar CSP, móvil/escritorio, temas, panel, ausencia de falsa persistencia y envíos desactivados con/sin JavaScript.
3. Verificar el respaldo con `node tools/mnt-backup.mjs --verify BACKUP_DIR`; repetir los ensayos de `tools/mnt-restore-rehearsal.mjs` normal y con `--content`.
4. Preparar `node tools/mnt-prepare-rollback.mjs BACKUP_DIR`. El artefacto local `rollback-identity-guarded.sql` tiene checksums de las cinco tablas y no contiene una restauración de datos. El generador rehúsa sobrescribirlo; conservar versiones anteriores diferenciadas si cambia el inversor.
5. Coordinar la pausa de escrituras administrativas e integraciones y mantener desactivados los leads. No confundirla con una pausa del sitio. Los clientes privilegiados del proveedor requieren coordinación explícita.

## Secuencia sin interrupción pública planificada

1. Obtener conteos/checksums nuevos del propietario con los órdenes documentados en `mnt-backup-restore.md` y enumerar Storage. Deben coincidir con el respaldo. Si difieren, detener el corte, respaldar el nuevo estado y repetir el ensayo.
2. Aplicar `202609060003_mnt_identity.sql` como propietario. La transacción cambia los nombres y conserva un único wrapper temporal `cota_public_records(text) returns table(data jsonb)` que delega a `mnt_public_records(text)`. Es `SECURITY INVOKER`, solo ejecutable por los mismos roles `anon` y `authenticated`, sin nuevos grants de tablas ni audiencias. La proyección y sus exclusiones privadas son las mismas.
3. Confirmar que la web anterior sigue leyendo contenido público. Las funciones antiguas de escritura y tablas antiguas ya no existen: sus solicitudes fallan y no deben anunciar éxito. No crear aliases de escritura para evitar ese fallo.
4. Aplicar `202609060004_mnt_content_identity.sql`. Verificar las tres filas previstas, sus revisiones y la integridad de las otras once. 003 y 004 son transacciones separadas: si 004 falla, el esquema ya es MNT y el wrapper mantiene las lecturas; corregir 004 sin restaurar un snapshot antiguo.
5. Publicar el build MNT verificado en el mismo proyecto. Confirmar dominio, origen canónico, backend dedicado y `MNT_PUBLIC_LEADS_ENABLED=false`. El nuevo build usa exclusivamente los RPC MNT.
6. Probar en lectura `/api/health`, inicio, inventario, blog, páginas 404/error, panel y CSP. Confirmar formularios desactivados con/sin JS. Si se crean registros de prueba o cualquier fila cambia, dejan de cumplirse las condiciones del inversor automático.
7. Una vez verificado que el tráfico usa el build MNT, aplicar `202609060005_retire_public_read_compatibility.sql`. Solo elimina el wrapper temporal. Confirmar que no queda ningún RPC COTA y que la web nueva continúa funcionando. Una instalación nueva aplica 001, 002, 003, 004 y 005; el resultado final no conserva compatibilidad antigua.
8. Verificar el hostname nuevo y el origen canónico antes de redirigir el hostname previo; comprobar ausencia de bucles. Habilitar escrituras del panel y, cuando proceda la autorización operativa de recepción, leads. Cualquier prueba de persistencia debe identificarse y conservarse según la política acordada.

Con cero objetos originales no se requieren copias de Storage. Verificar otra vez ese hecho en la ventana. Los buckets de recuperación no se eliminan. Antes de cambiar su visibilidad, confirmar que no tienen referencias activas. No manipular `storage.objects` con SQL para simular copias.

## Recuperación preferida

Si el build nuevo falla después de 003, conservar las lecturas mediante el wrapper mientras siga presente y desplegar un build MNT compatible con el esquema. Si 005 ya se aplicó, desplegar directamente un build MNT compatible. Evitar alternar un build antiguo contra un esquema incompatible. Una recuperación de interfaz no justifica restaurar datos anteriores.

Auth, sesiones, contraseñas, secretos y configuración del proveedor tienen recuperación separada. Las cinco tablas y los mocks PGlite no representan un backup completo del proyecto ni de Auth.

## Inversión excepcional en la ventana sin escrituras nuevas

Solo si el operador confirma que no hubo escrituras posteriores, que no hay objetos MNT y que necesita volver al build previo:

1. Conservar evidencia del estado y fallo. Usar el archivo guardado preparado desde el mismo respaldo y ensayado contra él.
2. Ejecutar `rollback-identity-guarded.sql` completo en una misma sesión del propietario. El preámbulo crea checksums temporales; la transacción bloquea las cinco tablas y los metadatos de Storage, compara todas las filas/versiones y rechaza cambios posteriores o cualquier objeto en buckets MNT. Solo excluye `records.updated_at` porque 004 genera esa fecha en el corte; las escrituras normales incrementan versión y se detectan.
3. Si todavía existe `cota_public_records(text)`, el inversor exige que sea exactamente el wrapper SQL estable, invocador y delegante esperado antes de quitarlo. Si 005 ya lo retiró, continúa sin ese paso. Un objeto inesperado provoca rechazo, no borrado ciego.
4. Restaura nombres COTA de tablas, funciones, índices, restricciones, policies y triggers conservando OID, permisos, contenido y revisiones. Las restricciones de slug continúan activas y se rechazan URLs privadas/staging de ambas generaciones. No elimina buckets, no revierte el JSON de marca y no crea aliases de escritura.
5. Desplegar el build previo y comprobar su acceso/lecturas antes de permitir escrituras. Las cookies cambiaron de nombre, por lo que se requiere nuevo inicio de sesión. Los datos mantienen MNT aunque la interfaz previa pueda mostrar la identidad anterior.
6. Registrar la intervención compensatoria sin borrar historial de migraciones. No volver a ejecutar 003 automáticamente: permanecen buckets MNT y restricciones nuevas. El avance posterior requiere un script de reanudación revisado para ese estado.

Si falla la guarda, no sustituir sus checksums para forzarla. Mantener la pausa de escrituras y desplegar código compatible con MNT. Una recuperación de datos con escrituras posteriores exige conciliación que preserve esos registros, archivos y revisiones; obtener autorización para el resultado concreto antes de una restauración productiva.

## Evidencia de pruebas

PGlite comprueba equivalencia de lectura antigua/nueva para `anon`, rechazo de colecciones privadas, ausencia de RPC antiguos de escritura y retirada limpia con 005. El inversor se prueba con el wrapper presente y después de 005; rechaza wrappers inesperados, ausencia de preámbulo, escrituras nuevas y objetos MNT. El caso permitido conserva OID/ACL/configuración, datos, revisiones, buckets y protecciones de slug y privacidad.

El ensayo real `node tools/mnt-restore-rehearsal.mjs BACKUP_DIR --content --rollback` conserva 14 registros y 24 revisiones en PGlite. El resultado se guarda por separado en `restore-rehearsal-rollback.json`; no se ejecuta contra el proveedor. Los timestamps esperados se normalizan como `timestamptz` antes de calcular hashes. Conservar diagnósticos anteriores como evidencia; el reporte exitoso posterior es la conclusión del ensayo.

## Particularidad de permisos de Storage administrado

Una ejecución real de 003 falló y revirtió su transacción al intentar renombrar una policy de `storage.objects`. El operador comprobó sesión `postgres`, propietario `supabase_storage_admin` y ausencia de membresía en ese rol. No se cambió la propiedad ni se concedió membresía.

La versión corregida renombra policies solo en `public`. En Storage reemplaza atómicamente la policy conocida mediante `DROP POLICY` y `CREATE POLICY`, conservando exclusivamente `SELECT` para `authenticated` con membresía de personal y los buckets precisos. El inversor usa el mismo procedimiento. Supabase documenta que [el propietario de Storage debe conservarse](https://supabase.com/docs/guides/platform/permissions). Su [código oficial de supautils](https://github.com/supabase/supautils/blob/master/src/supautils.c) delega CREATE/ALTER/DROP POLICY conforme a `policy_grants`, pero la rama `RenameStmt` no implementa ese permiso de policies.

PGlite no contiene la extensión supautils y las primeras pruebas usaban un propietario único: podían validar datos y restricciones, pero no detectar esa diferencia del servicio administrado. Las pruebas actuales comprueban el reemplazo y su audiencia; confirmar el permiso del proveedor al ejecutar sigue siendo necesario. No usar un cambio de propietario de Storage como solución.

El operador ejecutó después un preflight real `BEGIN; DROP POLICY ...; CREATE POLICY ...; ROLLBACK` con la misma policy restringida. Terminó correctamente y no dejó cambios persistentes, confirmando que el rol del servicio admite el reemplazo transaccional. El inversor generado y el ensayo aislado del respaldo real se actualizaron y pasaron nuevamente.

## Preflight explícito de colisiones

La revisión automática bloqueó un reintento por la posibilidad de que ya existiera `mnt_public_records`. Una lectura posterior del operador confirmó `cota_records` y `cota_public_records(text)` presentes, `mnt_records` y `mnt_public_records(text)` ausentes y cero funciones MNT: esa colisión no estaba presente en el estado observado.

003 ahora exige esas precondiciones dentro de la propia transacción, inmediatamente después del advisory lock y antes de bloquear o renombrar tablas. Rechaza cualquier relación o función `public.mnt_*`, así como la ausencia de la tabla o lector originales. Las pruebas de estado parcial confirman que el rechazo conserva las filas y los OID/cuerpos de funciones existentes. Si el estado cambia antes de ejecutar, la migración falla explícitamente; la observación anterior no se utiliza como autorización para sobrescribir objetos.
