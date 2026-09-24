# Mercado inmobiliario

Implementación del diseño aprobado: portada editorial, buscador, filtros por tema y formato, tarjetas independientes, destacado, paginación y bloque de guías. Se conservan las rutas `/blog` y `/blog/<slug>`.

El panel incorpora formato, tema, destacado, autor, ámbito y fuente principal. La migración `202609240008_mnt_blog_editorial.sql` valida metadatos, registra la primera publicación, conserva esa fecha al editar y amplía la proyección pública con una lista explícita de campos. No modifica los artículos históricos. Las fechas históricas desconocidas permanecen desconocidas.

## Verificación

- Análisis estático y tipos: correctos.
- Compilación de producción: correcta.
- Suite completa de aplicación: 204 pruebas de backend y 125 de interfaz correctas.
- Pruebas de revista en navegador: búsqueda sin acentos, combinación de filtros, limpieza de filtros, persistencia en URL, volver desde un artículo, paginación, fuentes, fechas, temas claro y oscuro y navegación sin JavaScript.
- Tamaños revisados: 375, 414, 768, 1024 y 1440 px. Separación de tarjetas verificada por sus posiciones; sin desbordamiento horizontal. Revisión automática WCAG AA del contenido principal en móvil y escritorio, en ambos temas. No equivale a una certificación integral de accesibilidad.
- Se corrigió el servidor de datos de prueba para admitir los parámetros de paginación enviados por Supabase. Antes respondía vacío a esas solicitudes.
- La ejecución ampliada de navegador mostró los diez escenarios funcionales correctos y omitió el presupuesto opcional de rendimiento, pero quedó detenida al cerrar el proceso y se interrumpió. Se repitió por separado la batería de la revista. Durante las navegaciones rápidas Next registró cierres anticipados de flujos; los escenarios de revista no registraron errores de página.

Las capturas de `assets/mercado-inmobiliario` usan datos locales de prueba. Las noticias de prueba nunca se escribieron en Supabase ni se publicaron.

## Actualización de producción · 23 de septiembre de 2026

La migración 008 se aplicó una vez al proyecto Supabase `qkkirjzhviqwvuqjnmei`, después de comprobar la definición previa de la proyección. Los 28 registros, incluidos 12 artículos, conservaron la misma huella agregada antes y después: `2e10e1d00741eb5b451b9acc7f0f6ed5`. El nuevo disparador quedó instalado.

Se publicaron tres notas originales en una sola inserción: índice SHF de Tijuana, comparación del costo hipotecario a partir de una publicación de CONDUSEF e inflación de agosto del INEGI. Los textos revisados están en `content/blog/2026-09-actualidad`. Cada nota incluye periodo, fecha de la fuente, ámbito, autor, clasificación y fuente oficial. El ejemplo hipotecario se identifica expresamente como basado en información de diciembre de 2025.

La carga `tools/mnt-publish-news.mjs --publish` verificó 15 artículos totales, la integridad completa de las 12 entradas anteriores y la lectura anónima de los tres nuevos textos con sus metadatos y fechas asignadas por la base de datos. Las copias antes/después y sus huellas se guardan localmente en `.superpowers/news/publication-2026-09-24T04-20-22-519Z/`, fuera de Git. Repetir la carga comprueba coincidencias y no vuelve a insertar ni sobrescribir.

La publicación de la aplicación usa la integración existente de Vercel con `main`. El despliegue `FsKedMZWqoFkRJSE5uPhi5V5gu78`, correspondiente a `0e656d3`, quedó Ready/Production/Current. En el sitio público se verificaron 15 artículos, tres resultados al seleccionar Actualidad y un resultado al combinar Actualidad, Comprar y la búsqueda «hipotecas».

La ejecución de GitHub #19 detectó una expectativa antigua en `public-render.test.ts`: con `MNT_SITE_URL=http://localhost:3001` esperaba enlaces sociales locales, aunque la aplicación deliberadamente los convierte al dominio público. Se reprodujo el fallo con esa configuración y se corrigió el aislamiento de la prueba para cubrir explícitamente dominio público, localhost y dominio personalizado. Las 27 pruebas del archivo pasan con el entorno local de CI. No se alteró el comportamiento de producción para resolver esta discrepancia.

La [guía de operación editorial](../mercado-inmobiliario-editorial.md) describe el uso del panel y una cadencia propuesta de dos notas semanales y una guía mensual. No se activó una automatización de publicaciones.
