# Recuperación de Fortius — procedimiento y decisiones

Estado: controles locales implementados; objetivos iniciales aprobados; recuperación completa del proveedor pendiente de ensayo. Objetivos aprobados: 12/10/2026. Cobertura local actualizada: 13/10/2026.

## Alcance comprobable

El export del código actual cubre 26 tablas públicas (18 anteriores y ocho de Apps) y lleva `schema_version: 2`. Esta cifra describe el código y el ensayo aislado; no acredita migraciones remotas. El verificador comprueba hashes/bytes del inventario, vinculación de PDFs emitidos/copias/adjuntos/recibos de carga con sus objetos, metadata del bucket y privacidad. Incluye originales y resultados PDF de Apps en `fortius-inmuebles-private`, y originales, firmas y evidencia en el bucket privado `fortius-app-integrations`; verifica SHA-256 y tamaño contra las filas de `app_files` e `integration_artifacts`. Un documento con SHA-256 distinto al archivo bloquea el respaldo. Un objeto que no figure en el inventario de archivos con huella también lo bloquea.

Esto es integridad y coherencia del alcance capturado. No acredita autenticidad contra un atacante que pudiera reemplazar datos y manifiesto a la vez: custodiar la huella del manifiesto y la copia en un medio independiente y restringido.

El ensayo DB aplica migraciones a PGlite en memoria, restaura contenido, valida FK/revisiones y compara campos/fechas. Comprueba continuidad y snapshot vigente de las versiones de Apps, recalcula búsqueda OCR y conserva correcciones, cargos/reservas, enlaces revocados y eventos de firma. No reenvía solicitudes a proveedores. Regenera el índice de referencias de los JSON mediante la función SQL migrada y lo contrasta con el snapshot; no basta que las filas del índice antiguo tengan FK válidas. No normaliza el export ni aplica reglas actuales de nueva captura indiscriminadamente a datos legacy. Auth contiene placeholders de identidad: no contraseñas/sesiones/servicio. La nueva recuperación de objetos copia bytes a un directorio local nuevo, relee huellas y conserva metadata; no configura un servicio Storage ni prueba sus políticas en otro proyecto.

Los respaldos históricos completos de 18 tablas siguen admitidos sin modificar su JSON: el ensayo reporta su versión de origen y las ocho tablas nuevas que quedan vacías. La versión 2 exige las 26 tablas, aun si no tienen filas. Un inventario incompleto de Apps, una tabla inesperada o una versión desconocida impiden la aceptación. Los formatos históricos `cota`/`mnt` conservan su tratamiento anterior. Ningún resultado histórico demuestra cobertura de trabajos creados después de esa copia.

Los archivos y artefactos de Apps requieren SHA-256 de 64 caracteres hexadecimales y tamaño entero positivo; valores vacíos o ausentes no omiten la comprobación. Cada fila de `app_files` requiere además un único recibo en `file_uploads`, con bucket privado, misma ruta, mismo propietario y vínculo `apps:<expediente>` o `apps:independent` concordante. Esta comprobación se ejecuta también al ensayar directamente la base. Los artefactos de proveedores mantienen su relación con el trabajo y no requieren recibo genérico. La metadata de todos los buckets se valida aunque estén vacíos, sin IDs duplicados. Si el manifiesto declara `database.schemaVersion`, debe coincidir con la versión del export; no se acepta degradar una copia declarada como actual a un inventario histórico.

## Comprobación local sin credenciales

```bash
node --test tests/tools/backup-coverage.test.mjs tests/tools/backup-objects.test.mjs tests/tools/restore-current.test.mjs
node tools/fortius-inmuebles-backup.mjs --verify DIRECTORIO_BACKUP
node tools/fortius-inmuebles-restore-rehearsal.mjs DIRECTORIO_BACKUP
node tools/fortius-inmuebles-backup.mjs --restore-objects DIRECTORIO_BACKUP --target DIRECTORIO_NUEVO_AISLADO
```

El padre del destino debe existir. Se rechazan destinos existentes, interiores al respaldo o que lo contengan. Los binarios se escriben con nombres numerados y permisos locales restringidos; `objects.json` conserva bucket/ruta original. Un error deja un destino parcial para diagnóstico; no se modifica ni elimina la fuente. Un siguiente intento requiere otro destino nuevo.

## Objetivos iniciales aprobados, no SLA comprobado

- Moisés aprobó el 12/10/2026 empezar con copia diaria: objetivo inicial de hasta 24 horas de trabajo reciente; copia adicional antes de una migración o cambio relevante. Validar consistencia de DB/archivos y frecuencia real, no solo el calendario.
- Moisés aprobó el objetivo de volver a operar en hasta ocho horas desde declaración del incidente hasta restitución del alcance acordado. Se valida con ensayo; la aprobación del objetivo no demuestra capacidad.
- Custodia: responsable designado por Moisés; copia cifrada fuera del repositorio y del servidor público; acceso por necesidad y registro de acceso.
- Retención: decidir según finalidad, relaciones, obligaciones aplicables y revisión profesional. No imponer un plazo uniforme ni borrado automático.

## Ensayo completo pendiente

1. Autorizar destino Supabase aislado y confirmar costo, custodia y cuentas controladas. No crear proyecto contratado por inferencia.
2. Comprobar procedimientos del proveedor para DB/Auth/configuración y extensiones. Inventariar variables por nombre/ámbito; custodiar valores por el mecanismo seguro correspondiente.
3. Cargar caso sintético con administrador y dos asesores, expedientes, actividad, emisiones y objetos; capturar snapshot consistente. Documentar pausa de escrituras o método de consistencia.
4. Recuperar DB, identidad acordada, buckets/objetos y políticas en destino. Comprobar conteos, hashes, fechas, vínculos, RLS y acceso/denegación/descargas con cuentas de prueba.
5. Medir tiempos y divergencias frente a RPO/RTO. Probar acceso recuperado y publicar solo un endpoint de prueba autorizado.
6. Registrar limitaciones, disposición del destino y aprobación. Mantener producción intacta.

No generar copias de clientes para la fase sintética. No considerar REC-01 cerrado hasta comprobar recuperación del alcance requerido y acordar custodia/destino.

## Explicación para decidir y evidencia del proveedor

RPO significa cuánto trabajo reciente podría perderse: si la última copia es de ayer, puede faltar lo capturado hoy. RTO significa cuánto tiempo puede permanecer detenido el sistema hasta recuperarlo. Son objetivos a medir, no garantías actuales.

Objetivo inicial aprobado por Moisés: copia al menos cada día y recuperación dentro de una jornada de ocho horas. Una operación que no tolere perder capturas del día necesita un objetivo más corto y comprobar el mecanismo y su costo. La frecuencia también debe cubrir los archivos, no solo la base.

Lectura autorizada del catálogo de backups Supabase el 12/10/2026: `pitr_enabled=false`, `backups=[]`, sin ventana de respaldo físico informada. No se descargaron copias ni se leyeron clientes. No descarta respaldos externos; no demuestra que exista una copia diaria gestionada. Antes de prometer plazos, confirmar custodia, automatización, consistencia y ensayo completo.
