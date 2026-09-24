# Mercado inmobiliario: operación editorial

## Estructura

La sección pública conserva `/blog` y las direcciones de sus artículos. Su nombre visible es **Mercado inmobiliario**. Reúne dos formatos: **Guías** y **Actualidad**. Los temas disponibles son Comprar, Vender, Rentar, Valor y mercado y Trámites.

El buscador consulta título, resumen y contenido, admite palabras sin acentos y combina la consulta con tema y formato. Los filtros quedan en la dirección para compartir búsquedas y volver a ellas. El catálogo muestra nueve entradas por página, contando el destacado de la primera página.

La portada presenta el destacado más reciente; si no hay ninguno, muestra la última entrada. Un artículo destacado antiguo se coloca primero sin duplicarlo en páginas posteriores. El bloque de guías aparece cuando se consulta la portada completa.

## Publicar desde el panel

1. Abrir **Mercado inmobiliario** en el panel y seleccionar **Nueva entrada**.
2. Indicar el título, una dirección permanente, resumen y contenido.
3. Elegir el tipo y el tema. Completar autor y ámbito cuando corresponda.
4. En actualidad, identificar la fuente principal y enlazar el documento original. Otras fuentes pueden enlazarse dentro del contenido.
5. Guardar como borrador mientras se revisan los hechos. Elegir **Expuesto públicamente** cuando el texto esté listo.
6. Marcar **Destacar en portada** si se desea priorizarlo. Si hay varios, se muestra el más reciente.

La base de datos registra la primera publicación y conserva esa fecha al corregir, retirar temporalmente o volver a publicar el mismo artículo. Actualizarlo modifica únicamente su fecha de actualización. Los artículos históricos que carecen de fecha de publicación muestran su actualización, sin inventar una fecha anterior. Su orden continúa usando esa fecha disponible.

Las doce guías conocidas reciben una clasificación editorial inicial por su dirección. La elección guardada desde el panel tiene prioridad. Las entradas desconocidas sin tema siguen visibles en Todo y en las búsquedas por texto.

Las ilustraciones existentes se conservan con su atribución. Las entradas nuevas sin portada registrada se presentan como tarjetas de texto. La carga de nuevas imágenes editoriales desde el panel no forma parte de esta versión.

## Rutina inicial propuesta

- Martes: una nota breve sobre un dato o cambio relevante del sector.
- Viernes: una nota con enfoque local o una explicación de cómo un cambio afecta a propietarios, compradores o arrendadores.
- Una vez al mes: una guía de consulta, revisada a profundidad.

Esta cadencia es una pauta de trabajo. No hay publicaciones programadas ni una automatización diaria activada.

Cada noticia debe responder: qué ocurrió, cuándo ocurrió, dónde aplica, cuál es la fuente y qué implica para el lector. Distinguir el hecho confirmado de la interpretación editorial. Explicar las limitaciones geográficas y temporales de las cifras. Resumir con redacción propia y enlazar las fuentes; no reproducir artículos ajenos.

Priorizar información de Tijuana y Baja California. Incluir noticias nacionales cuando tengan una consecuencia concreta para la audiencia local. Si una semana no hay una novedad sustentada, publicar una explicación útil o actualizar una guía, conservando su fecha original.

## Activación técnica

Antes de publicar esta versión de la aplicación, aplicar una vez `supabase/migrations/202609240008_mnt_blog_editorial.sql`. La migración amplía la lista de campos públicos del blog y añade validación y registro de fechas. No reescribe artículos existentes ni modifica permisos. Los datos siguen en el backend autenticado del producto.

Después del despliegue, comprobar con un borrador editorial real que el panel conserva los campos y que, al publicar, aparecen clasificación, fuente y fecha. Comprobar también una búsqueda combinada y el acceso a un artículo anterior.

Estado de esta entrega: implementación y pruebas locales. Migración remota y despliegue pendientes.
