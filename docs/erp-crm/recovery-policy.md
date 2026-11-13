# Recuperación de Fortius — procedimiento y decisiones

Estado: controles locales implementados; ensayo completo con datos sintéticos aprobado el 12/11/2026 en un proyecto aislado (16.5 s); objetivos iniciales aprobados; **copia diaria automática funcionando desde el 13/11/2026**; faltan abrir una copia con la llave del titular, el certificado de la conexión y el ensayo con volumen real. Objetivos aprobados: 12/10/2026. Cobertura actualizada: 12/11/2026.

## Alcance comprobable

El export del código actual cubre 30 tablas públicas (18 anteriores, ocho de Apps, entrevistas y tres de documentos del cliente) y lleva `schema_version: 4`; el detalle está en [el procedimiento](../fortius-inmuebles-backup-restore.md). Esta cifra describe el código y el ensayo aislado; no acredita migraciones remotas. El verificador comprueba hashes/bytes del inventario, vinculación de PDFs emitidos/copias/adjuntos/recibos de carga con sus objetos, metadata del bucket y privacidad. Incluye originales y resultados PDF de Apps en `fortius-inmuebles-private`, y originales, firmas y evidencia en el bucket privado `fortius-app-integrations`; verifica SHA-256 y tamaño contra las filas de `app_files` e `integration_artifacts`. Un documento con SHA-256 distinto al archivo bloquea el respaldo. Un objeto que no figure en el inventario de archivos con huella también lo bloquea.

Esto es integridad y coherencia del alcance capturado. No acredita autenticidad contra un atacante que pudiera reemplazar datos y manifiesto a la vez: custodiar la huella del manifiesto y la copia en un medio independiente y restringido.

El ensayo DB aplica migraciones a PGlite en memoria, restaura contenido, valida FK/revisiones y compara campos/fechas. Comprueba continuidad y snapshot vigente de las versiones de Apps, recalcula búsqueda OCR y conserva correcciones, cargos/reservas, enlaces revocados y eventos de firma. No reenvía solicitudes a proveedores. Regenera el índice de referencias de los JSON mediante la función SQL migrada y lo contrasta con el snapshot; no basta que las filas del índice antiguo tengan FK válidas. No normaliza el export ni aplica reglas actuales de nueva captura indiscriminadamente a datos legacy. Auth contiene placeholders de identidad: no contraseñas/sesiones/servicio. La recuperación local de objetos copia bytes a un directorio nuevo, relee huellas y conserva metadata. La restauración de Storage (`tools/fortius-inmuebles-restore-storage.mjs`, 12/11/2026) sube esos objetos a un proyecto Supabase aislado, ajusta los buckets, relee cada huella, comprueba que lo privado no se descargue sin sesión y mide tiempos; está probada con un Storage simulado, no contra un proyecto real.

Los respaldos históricos completos de 18 tablas siguen admitidos sin modificar su JSON: el ensayo reporta su versión de origen y las tablas nuevas que quedan vacías. Las versiones 2, 3 y 4 exigen 26, 27 y 30 tablas, aun si no tienen filas. Un inventario incompleto de Apps, una tabla inesperada o una versión desconocida impiden la aceptación. Los formatos históricos `cota`/`mnt` conservan su tratamiento anterior. Ningún resultado histórico demuestra cobertura de trabajos creados después de esa copia.

Los archivos y artefactos de Apps requieren SHA-256 de 64 caracteres hexadecimales y tamaño entero positivo; valores vacíos o ausentes no omiten la comprobación. Cada fila de `app_files` requiere además un único recibo en `file_uploads`, con bucket privado, misma ruta, mismo propietario y vínculo `apps:<expediente>` o `apps:independent` concordante. Esta comprobación se ejecuta también al ensayar directamente la base. Los artefactos de proveedores mantienen su relación con el trabajo y no requieren recibo genérico. La metadata de todos los buckets se valida aunque estén vacíos, sin IDs duplicados. Si el manifiesto declara `database.schemaVersion`, debe coincidir con la versión del export; no se acepta degradar una copia declarada como actual a un inventario histórico.

## Comprobación local sin credenciales

```bash
node --test tests/tools/*.test.mjs
node tools/fortius-inmuebles-backup.mjs --verify DIRECTORIO_BACKUP
node tools/fortius-inmuebles-restore-rehearsal.mjs DIRECTORIO_BACKUP
node tools/fortius-inmuebles-backup.mjs --restore-objects DIRECTORIO_BACKUP --target DIRECTORIO_NUEVO_AISLADO
node tools/fortius-inmuebles-restore-storage.mjs DIRECTORIO_BACKUP --plan
```

El padre del destino debe existir. Se rechazan destinos existentes, interiores al respaldo o que lo contengan. Los binarios se escriben con nombres numerados y permisos locales restringidos; `objects.json` conserva bucket/ruta original. Un error deja un destino parcial para diagnóstico; no se modifica ni elimina la fuente. Un siguiente intento requiere otro destino nuevo.

## Objetivos iniciales aprobados, no SLA comprobado

- Moisés aprobó el 12/10/2026 empezar con copia diaria: objetivo inicial de hasta 24 horas de trabajo reciente; copia adicional antes de una migración o cambio relevante. Validar consistencia de DB/archivos y frecuencia real, no solo el calendario.
- Moisés aprobó el objetivo de volver a operar en hasta ocho horas desde declaración del incidente hasta restitución del alcance acordado. Se valida con ensayo; la aprobación del objetivo no demuestra capacidad.
- Custodia: el titular (decisión del 12/11/2026). La copia se cifra para su llave y se guarda en Cloudflare R2, fuera del repositorio y del servidor público; solo él tiene la llave privada. Detalle en [copia diaria](respaldo-diario.md).
- Retención: decidir según finalidad, relaciones, obligaciones aplicables y revisión profesional. No imponer un plazo uniforme ni borrado automático.

## Ensayo completo (12/11/2026)

El 12/11/2026 se ejecutó `tools/fortius-inmuebles-recovery-rehearsal.mjs` contra un proyecto gratuito aparte (`qmlpcpddvglhlmkxobis`), con datos sintéticos, y **pasó**: 53 migraciones, 30 tablas iguales a la fuente, 49 FK revalidadas, 6 buckets, 2 objetos con huella idéntica, 2 cuentas de ensayo y el acceso esperado para administrador, asesor y visitante sin sesión. Tardó 16.5 s en total. El detalle por paso está en [el procedimiento](../fortius-inmuebles-backup-restore.md). Antes se descartaron la pila local (sin Docker en el equipo) y las ramas de Supabase (exigen el plan Pro).

Para repetirlo: crear otro proyecto vacío (el script se niega a mezclar datos), guardar sus cuatro datos de conexión en un archivo propio fuera del repositorio y ejecutar el script con `--confirm-target REF`. Al terminar, borrar el proyecto de ensayo y el archivo con sus datos de conexión. El del 12/11/2026 se borró ese mismo día, junto con su archivo.

**Pendiente para cerrar REC-01:**

1. Copia diaria automática: **funcionando** desde el 13/11/2026 (GitHub Actions → cifrado → Cloudflare R2, con el titular como custodio de la llave; ver [copia diaria](respaldo-diario.md)). Dos copias completas ese día, cada una verificada y ensayada en memoria antes de subirse. **Falta:** que el titular abra una copia con su llave privada (la prueba de que se descifra fuera de GitHub) y agregue el certificado `FORTIUS_BACKUP_DB_CA`. Hasta abrir una copia, el RPO de 24 h está probado en GitHub, no en manos del custodio.
2. Repetir el ensayo con el volumen real cuando se cargue el inventario, porque los tiempos de hoy son de un caso mínimo.
3. Documentar la configuración del proyecto que no viaja con el respaldo: correo saliente, URL de retorno, límites y plantillas de Auth. Leído el 13/11/2026 sin credenciales de administración: registro abierto desactivado, solo correo y confirmación obligatoria. Lo demás solo se ve en el panel de Supabase (Authentication → Emails, URL Configuration, Rate Limits): copiarlo aquí requiere al titular o un token de administración de solo lectura.

No generar copias de clientes reales para la fase sintética. No considerar REC-01 cerrado hasta resolver lo anterior.

## Explicación para decidir y evidencia del proveedor

RPO significa cuánto trabajo reciente podría perderse: si la última copia es de ayer, puede faltar lo capturado hoy. RTO significa cuánto tiempo puede permanecer detenido el sistema hasta recuperarlo. Son objetivos a medir, no garantías actuales.

Objetivo inicial aprobado por Moisés: copia al menos cada día y recuperación dentro de una jornada de ocho horas. Una operación que no tolere perder capturas del día necesita un objetivo más corto y comprobar el mecanismo y su costo. La frecuencia también debe cubrir los archivos, no solo la base.

Lectura autorizada del catálogo de backups Supabase el 12/10/2026: `pitr_enabled=false`, `backups=[]`, sin ventana de respaldo físico informada. No se descargaron copias ni se leyeron clientes. No descarta respaldos externos; no demuestra que exista una copia diaria gestionada. Antes de prometer plazos, confirmar custodia, automatización, consistencia y ensayo completo.
