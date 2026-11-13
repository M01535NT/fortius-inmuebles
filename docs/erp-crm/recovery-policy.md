# Recuperación de Fortius — procedimiento y decisiones

Estado: controles locales implementados; herramienta de restauración de Storage en un proyecto aislado lista; objetivos iniciales aprobados; ensayo real del proveedor pendiente por falta de destino aislado. Objetivos aprobados: 12/10/2026. Cobertura actualizada: 12/11/2026.

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
- Custodia: responsable designado por Moisés; copia cifrada fuera del repositorio y del servidor público; acceso por necesidad y registro de acceso.
- Retención: decidir según finalidad, relaciones, obligaciones aplicables y revisión profesional. No imponer un plazo uniforme ni borrado automático.

## Ensayo completo pendiente

Nada de lo siguiente se ha ejecutado. El 12/11/2026 el titular eligió la opción 1 (pila local de Supabase); falta instalar WSL 2 y Docker Desktop en el equipo. El respaldo sintético ya se genera con `tools/fortius-inmuebles-synthetic-backup.mjs`. Las migraciones no crean los buckets `fortius-inmuebles-*`; los crea la restauración de Storage (ver [el procedimiento](../fortius-inmuebles-backup-restore.md)). La base actual solo tiene datos de prueba (DEC-10), así que el ensayo puede hacerse con esa información sintética; aun así, **nunca** se restaura sobre el proyecto de producción.

**Destino.** Opciones, de menor a mayor costo (decide el titular):

1. **Pila local de Supabase** (`supabase start`, requiere Docker y la CLI de Supabase, hoy no instalada en el equipo). Sin costo; prueba DB, Storage y políticas, pero no la configuración del proyecto alojado.
2. **Rama de Supabase** (Supabase Branching). El repositorio ya tiene la integración con GitHub: cada PR muestra el check «Supabase Preview». Una rama crea una base y un Storage separados con las migraciones aplicadas. Puede tener costo por hora según el plan; confirmar antes.
3. **Proyecto Supabase nuevo** solo para recuperación. Es lo más parecido a un desastre real; tiene costo mensual mientras exista.

**Pasos con el destino ya autorizado:**

1. Anotar la hora de inicio (inicio del RTO). Coordinar una pausa de escrituras en el origen mientras dura la copia.
2. Respaldar: export propietario (`tools/fortius-inmuebles-owner-export.sql`) y `node --env-file=.env.local tools/fortius-inmuebles-backup.mjs --prefix fortius_inmuebles --database RUTA_EXPORT.json`; después `--verify`.
3. Ensayo de base en memoria: `node tools/fortius-inmuebles-restore-rehearsal.mjs DIRECTORIO_BACKUP`.
4. Aplicar las migraciones del repositorio al destino aislado (crean buckets y políticas).
5. Restaurar Storage: `node --env-file=RUTA_ENV_RECUPERACION tools/fortius-inmuebles-restore-storage.mjs DIRECTORIO_BACKUP --confirm-target REF`. Con la clave anónima, el informe confirma que lo privado no se descarga sin sesión.
6. Cargar los datos del export en el destino. Hoy solo existe la carga en la base en memoria; falta una carga contra un Postgres real, que debe usar el mismo orden y validaciones de `fortius-inmuebles-restore-current.mjs`.
7. Recrear dos cuentas de prueba (administrador y asesor) en el Auth del destino y comprobar acceso, denegación y descarga de un documento con cada una. Las contraseñas y sesiones del origen no se recuperan; se emiten nuevas.
8. Anotar la hora de fin, comparar con RPO 24 h y RTO 8 h, registrar lo que no se pudo restaurar y decidir la disposición del destino.

No generar copias de clientes reales para la fase sintética. No considerar REC-01 cerrado hasta comprobar recuperación del alcance requerido y acordar custodia/destino.

## Explicación para decidir y evidencia del proveedor

RPO significa cuánto trabajo reciente podría perderse: si la última copia es de ayer, puede faltar lo capturado hoy. RTO significa cuánto tiempo puede permanecer detenido el sistema hasta recuperarlo. Son objetivos a medir, no garantías actuales.

Objetivo inicial aprobado por Moisés: copia al menos cada día y recuperación dentro de una jornada de ocho horas. Una operación que no tolere perder capturas del día necesita un objetivo más corto y comprobar el mecanismo y su costo. La frecuencia también debe cubrir los archivos, no solo la base.

Lectura autorizada del catálogo de backups Supabase el 12/10/2026: `pitr_enabled=false`, `backups=[]`, sin ventana de respaldo físico informada. No se descargaron copias ni se leyeron clientes. No descarta respaldos externos; no demuestra que exista una copia diaria gestionada. Antes de prometer plazos, confirmar custodia, automatización, consistencia y ensayo completo.
