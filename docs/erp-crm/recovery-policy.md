# Recuperación de Fortius — procedimiento y decisiones

Estado: controles locales implementados; objetivos y recuperación del proveedor pendientes de aceptación. Fecha: 12/10/2026.

## Alcance comprobable

El export actual cubre 18 tablas públicas. El verificador comprueba hashes/bytes del inventario, vinculación de PDFs emitidos/copias/adjuntos/recibos de carga con sus objetos, metadata del bucket y privacidad. Un documento con SHA-256 distinto al archivo bloquea el respaldo. Un objeto que no figure en el inventario de archivos con huella también lo bloquea.

Esto es integridad y coherencia del alcance capturado. No acredita autenticidad contra un atacante que pudiera reemplazar datos y manifiesto a la vez: custodiar la huella del manifiesto y la copia en un medio independiente y restringido.

El ensayo DB aplica migraciones a PGlite en memoria, restaura contenido, valida FK/revisiones y compara campos/fechas. Regenera el índice de referencias de los JSON mediante la función SQL migrada y lo contrasta con el snapshot; no basta que las filas del índice antiguo tengan FK válidas. No normaliza el export ni aplica reglas actuales de nueva captura indiscriminadamente a datos legacy. Auth contiene placeholders de identidad: no contraseñas/sesiones/servicio. La nueva recuperación de objetos copia bytes a un directorio local nuevo, relee huellas y conserva metadata; no configura un servicio Storage ni prueba sus políticas en otro proyecto.

## Comprobación local sin credenciales

```bash
node --test tests/tools/backup-coverage.test.mjs tests/tools/backup-objects.test.mjs tests/tools/restore-current.test.mjs
node tools/fortius-inmuebles-backup.mjs --verify DIRECTORIO_BACKUP
node tools/fortius-inmuebles-restore-rehearsal.mjs DIRECTORIO_BACKUP
node tools/fortius-inmuebles-backup.mjs --restore-objects DIRECTORIO_BACKUP --target DIRECTORIO_NUEVO_AISLADO
```

El padre del destino debe existir. Se rechazan destinos existentes, interiores al respaldo o que lo contengan. Los binarios se escriben con nombres numerados y permisos locales restringidos; `objects.json` conserva bucket/ruta original. Un error deja un destino parcial para diagnóstico; no se modifica ni elimina la fuente. Un siguiente intento requiere otro destino nuevo.

## Objetivos propuestos, no SLA vigente

- RPO inicial a revisar: hasta 24 horas de datos, con copia adicional antes de una migración o cambio relevante. Reducirlo mediante backup/PITR según plan, riesgo y presupuesto reales.
- RTO inicial a revisar: hasta 8 horas desde declaración del incidente hasta restitución del alcance acordado. Se valida con ensayo; un número propuesto no demuestra capacidad.
- Custodia: responsable designado por Moisés; copia cifrada fuera del repositorio y del servidor público; acceso por necesidad y registro de acceso.
- Retención: decidir según finalidad, relaciones, obligaciones aplicables y revisión profesional. No imponer un plazo uniforme ni borrado automático.

## Ensayo completo pendiente

1. Autorizar destino Supabase aislado y confirmar costo, custodia y cuentas controladas. No crear proyecto contratado por inferencia.
2. Comprobar procedimientos del proveedor para DB/Auth/configuración y extensiones. Inventariar variables por nombre/ámbito; custodiar valores por el mecanismo seguro correspondiente.
3. Cargar caso sintético con administrador y dos asesores, expedientes, actividad, emisiones y objetos; capturar snapshot consistente. Documentar pausa de escrituras o método de consistencia.
4. Recuperar DB, identidad acordada, buckets/objetos y políticas en destino. Comprobar conteos, hashes, fechas, vínculos, RLS y acceso/denegación/descargas con cuentas de prueba.
5. Medir tiempos y divergencias frente a RPO/RTO. Probar acceso recuperado y publicar solo un endpoint de prueba autorizado.
6. Registrar limitaciones, disposición del destino y aprobación. Mantener producción intacta.

No generar copias de clientes para la fase sintética. No considerar REC-01 cerrado hasta acordar objetivos y comprobar recuperación del alcance requerido.

## Explicación para decidir y evidencia del proveedor

RPO significa cuánto trabajo reciente podría perderse: si la última copia es de ayer, puede faltar lo capturado hoy. RTO significa cuánto tiempo puede permanecer detenido el sistema hasta recuperarlo. Son objetivos a medir, no garantías actuales.

Propuesta inicial pendiente de aprobación: copia al menos cada día y recuperación dentro de una jornada de ocho horas. Una operación que no tolere perder capturas del día necesita un objetivo más corto y comprobar el mecanismo y su costo. La frecuencia también debe cubrir los archivos, no solo la base.

Lectura autorizada del catálogo de backups Supabase el 12/10/2026: `pitr_enabled=false`, `backups=[]`, sin ventana de respaldo físico informada. No se descargaron copias ni se leyeron clientes. No descarta respaldos externos; no demuestra que exista una copia diaria gestionada. Antes de prometer plazos, confirmar custodia, automatización, consistencia y ensayo completo.
