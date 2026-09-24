# Manual de administración de MNT Inmuebles

## Acceso y roles

Abre `/admin` e inicia sesión con una cuenta habilitada en `mnt_staff`. Los roles admitidos son `admin` y `editor`; en la implementación actual, ambos tienen acceso operativo a las colecciones del panel. La administración de usuarios se realiza en Supabase y no desde esta interfaz. La interfaz no concede permisos: Supabase valida identidad, membresía activa y rol en cada operación.

Si olvidaste la contraseña, selecciona **Olvidé mi contraseña**, solicita el enlace y establece una contraseña nueva desde la sesión de recuperación. Los enlaces vencidos o ya utilizados requieren una solicitud nueva. Nunca copies tokens de recuperación en notas o mensajes.

## Altas, consultas, cambios y bajas

Cada módulo muestra su colección y ofrece las acciones disponibles:

1. Usa **Nuevo** o la acción equivalente para crear un registro.
2. Completa los campos obligatorios y guarda. La confirmación aparece únicamente después de que el servidor acepta la escritura.
3. Abre **Editar** para cambiar un registro. Conserva la pantalla abierta si necesitas revisar el resultado.
4. Usa **Eliminar** solo después de comprobar el registro exacto. La baja del catálogo no siempre elimina archivos físicos ni datos relacionados.

Si aparece un conflicto `409`, otra sesión guardó una versión posterior. Conserva tu borrador, recarga la colección, compara cambios y vuelve a aplicar únicamente lo que siga vigente. No repitas la petición con una versión inventada ni sobrescribas el trabajo ajeno.

## Inmuebles y publicación

Los inmuebles nuevos permanecen sin publicar. Revisa título, operación, precio, zona, descripción, ficha, galería, asesor y documentos antes de activar **Publicar en el sitio**. La galería pública exige al menos una imagen accesible desde el bucket público. Despublicar retira la ficha pública en la siguiente consulta, pero conserva el registro operativo.

## Mercado inmobiliario

En **Mercado inmobiliario**, crea título, slug, resumen, contenido y estado. Clasifica la entrada como **Guías** o **Actualidad**, elige su tema y completa autor, ámbito y fuente original cuando corresponda. Puedes destacarla en portada. El slug admite minúsculas, números y guiones simples; queda fijo después de crear la entrada. Usa líneas en blanco para separar párrafos; se admiten encabezados, listas y enlaces Markdown, sin interpretar HTML.

`Borrador` permanece en el panel. `Expuesto públicamente` publica la entrada en `/blog/<slug>` y la incorpora al sitemap. Confirma contenido, datos personales y vigencia antes de publicar.

La primera publicación se registra automáticamente y se conserva al editar. La activación de los nuevos campos y fechas requiere la migración editorial 008. Consulta [la guía editorial](mercado-inmobiliario-editorial.md) para conocer la búsqueda, clasificación y rutina propuesta.

## Archivos

Selecciona visibilidad antes de cargar:

- **Privado**: solo personal autorizado; se abre mediante enlace firmado de corta duración.
- **Público**: accesible por URL y apto únicamente para material autorizado para difusión.

El sistema valida tipo, tamaño y contenido, y conserva `bucket` y `path` en el registro del catálogo. Quitar un elemento del catálogo no borra automáticamente el objeto almacenado. No cargues identificaciones, escrituras ni información confidencial como archivos públicos.

## Contenido y contacto

En **Contenido**, edita los titulares de portada, el bloque verde, los metadatos y los grupos de presentación, método, entregables, preguntas frecuentes y contacto. Los saltos de línea se conservan en los títulos. Un campo de los grupos que se deje vacío usa el texto predeterminado. Guarda para confirmar la escritura en el servidor. La publicación de estos nuevos grupos requiere la migración editorial 007.

En **Configuración**, completa teléfono, WhatsApp y Facebook/Messenger cuando estén definidos. La web muestra los canales válidos configurados. Si todavía no hay canales y los formularios están deshabilitados, informa que el contacto estará disponible próximamente y ofrece consultar las propiedades. No publica destinos de ejemplo ni presenta formularios que no pueden recibir solicitudes.

## Leads y datos de ejemplo

Los formularios públicos de leads están deshabilitados por defecto mediante `MNT_PUBLIC_LEADS_ENABLED=false`. Actívalos solo después de configurar el secreto del servidor, aplicar migraciones y verificar persistencia y límites.

Los inmuebles, contactos, PDFs y demás datos de ejemplo sirven para revisar la interfaz. No representan inventario, precios, personas, disponibilidad ni condiciones comerciales reales. Sustituye o despublica cada ejemplo antes de una entrega pública.
