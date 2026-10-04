# Formatos exclusivos en el panel

## Estado de esta implementación

La rama contiene la base de expedientes privados, asociación de cuentas editor con asesores, borradores versionados, archivo de PDFs emitidos con SHA-256 y archivo separado de copias firmadas fuera del sistema. El catálogo identifica los 25 originales del directorio `Formatos exclusivos`.

Los formatos 08, **Estimación del neto del propietario**, 12, **Perfil del comprador**, 13, **Registro de visita y retroalimentación**, 14, **Propuesta de compra y respuesta del propietario**, 16, **Acta de entrega y recepción**, 17, **Cierre del expediente**, 18, **Recibo de pago de honorarios**, y 19, **Presupuesto de rehabilitación**, están habilitados para emisión. Su contenido se cotejó con los originales y se revisaron visualmente muestras PDF de los ocho. El 08 reproduce el precio sugerido por la opinión 07, el precio acordado, la selección de base, las once posibles erogaciones, los controles del respaldo fiscal y el neto; no aplica tasas fiscales por defecto. La referencia a la opinión 07 y el respaldo fiscal son datos capturados y revisados por el responsable, sin comprobación automática contra esos documentos. El 14 genera primero una carta de propuesta en prosa y, cuando se registra la contestación, agrega una carta de respuesta; exige que recursos propios y crédito sumen el precio y registra ratificación del comprador si una aceptación o contraoferta llega después del plazo. El 16 registra resultado, alcance revisado, diferencias, accesos, documentos, servicios, pendientes, reservas y líneas de firma. El 19 reproduce las tres secciones y las relaciones de subtotal, autorización, reserva y pagos del XLSX, con partidas y pagos estructurados; redondea cada partida a centavos antes de sumarla. Los otros 17 ofrecen una estructura preliminar de captura, pero **no equivalen todavía a sus Word o Excel**. La emisión se bloquea expresamente para ellos. No se ha aplicado la migración a Supabase de producción ni se ha desplegado este módulo.

## Trabajo necesario antes del despliegue completo

1. Cotejar cada formato con el original, campo por campo, incluidas las variantes 04A a 04G; distinguir datos declarados, observados y verificados cuando proceda.
2. Reproducir las cláusulas, tablas, anexos y espacios de firma de los DOCX. Revisar visualmente PDFs con datos cortos, largos y varias páginas.
3. Implementar las tablas y cálculos restantes de los XLSX 03 y 07 con partidas editables, comprobación de totales y fuentes de supuestos. La opinión 07 y el neto 08 tienen objetos distintos.
4. Resolver la vinculación de archivos privados existentes a clientes: los que carecen de `clienteId` permanecen visibles solo al administrador.
5. Revisar en una instancia de prueba la migración y los flujos reales de autenticación, almacenamiento, versionado, permisos de dos asesores y descarga de bytes exactos.
6. Habilitar cada `readyForEmission` únicamente después del cotejo de contenido y la revisión visual correspondiente.

## Criterio de aceptación de cada formato

Cada campo obligatorio del original tiene una entrada clara; las dependencias condicionales se validan; la emisión rechaza borradores incompletos; el PDF conserva contenido, cálculos y advertencias relevantes; el archivo emitido se puede descargar con la misma huella SHA-256; solo el administrador y el asesor asignado pueden acceder al expediente y sus archivos.
