# PLAN — en qué orden se hace

Este documento da **la pauta**: qué sigue y cómo sabrás que quedó. Qué se construye está en `SPEC.md`; cómo, en `DECISIONS.md`. Lo terminado se marca y, al cerrar la etapa, se borra de aquí: queda en el historial de git.

## Dónde estamos

Etapas 1 a 6 construidas (17/11/2026) y subidas a la rama `rediseno-sitio`. Falta tu visto bueno a la etapa 0. Sigue la etapa 7 (limpieza) cuando lo indiques.

## Etapas

| Etapa | Qué se hace | Cómo sabrás que está lista | Tamaño |
|---|---|---|---|
| 0. Documentos | Rama nueva y documentos limpios | Lees SPEC, PLAN y DECISIONS y describen el sitio nuevo | Chico |
| 1. Cimientos | Colores, letra, logo, menú, pie, botones y tarjetas | Todas las páginas abren con la piel nueva | Mediano |
| 2. Inventario | Frase con filtros, tarjetas, tres vistas, «Cargar más» | Filtras y cambias de vista con tus inmuebles | Mediano |
| 3. Ficha | Marco limpio, alrededores, herramientas, asesor | Una ficha tiene sus once bloques | Grande |
| 4. Inicio | Portada por asuntos, videos, calculadora, zonas, cierre | El inicio se ve y se mueve como el boceto | Grande |
| 5. Demás páginas | Boceto de Vender y Contacto; luego el resto | No queda ninguna página con el diseño viejo | Grande |
| 6. Movimiento y teléfono | Efectos de desplazamiento, teléfono, teclado, contraste | Lo recorres en tu teléfono sin tropiezos | Mediano |
| 7. Limpieza | Se retiran estilos viejos; ícono, imagen para compartir, pruebas nuevas | No queda rastro del diseño anterior | Mediano |
| 8. Publicación | Comprobación completa y un PR en borrador | Lo revisas y decides cuándo sale | Chico |

## Etapa 0, paso a paso

- [x] Crear la rama `rediseno-sitio`.
- [x] Reescribir `SPEC.md`, `PLAN.md` y `DECISIONS.md`.
- [x] Podar `README.md`, `AGENTS.md` y `docs/README.md`; borrar la marca y el documento de producto anteriores.
- [ ] Actualizar el boceto: menú de hamburguesa en lugar de enlaces y «Contacto».
- [ ] Tu visto bueno a los tres documentos.

## Etapa 1, paso a paso

- [x] Colores, letra Geist, espacios y esquinas nuevas, solo en el sitio.
- [x] Logo de Fortius II para fondo claro y oscuro.
- [x] Cabecera: logo, buscador y botón de menú.
- [x] Menú y buscador con el aspecto nuevo.
- [x] Pie con sus enlaces, tema y «Acceso al panel».
- [x] Piezas base: botones, pestañas, distintivos, listas, campos y tarjeta de propiedad.
- [x] Todas las páginas abren con colores, letra, cabecera y pie nuevos (su acomodo sigue siendo el viejo).
- [ ] Revisarlo en el navegador (al integrar).

## Etapa 2, paso a paso

- [x] La frase es el filtro: operación, tipo, zona y precio máximo, cada uno con su lista.
- [x] «Más filtros» (moneda y rango de precio) y «Limpiar filtros».
- [x] Barra de resultados que se queda arriba: conteo, orden (incluye mayor superficie) y vista.
- [x] Tres vistas: cuadrícula, lista y mapa por zona.
- [x] El servidor entrega de 12 en 12; «Cargar más» trae la siguiente parte.
- [x] Filtros y vista en la dirección; al volver de una ficha se recupera lo cargado y la posición.
- [x] Comparar hasta tres propiedades.
- [ ] Probarlo con muchos inmuebles (hoy la base tiene uno).

## Etapa 3, paso a paso

- [x] Banda oscura con nombre, ubicación aproximada, precio y precio por m².
- [x] Marco limpio con todos los controles debajo; ampliación de fotos.
- [x] Cifras, descripción con lo que ofrece, ficha técnica y documentos.
- [x] Mapa de la zona a todo lo ancho con «Abrir en Maps».
- [x] Qué hay alrededor, por grupo (sale cuando el inmueble tiene lugares capturados).
- [x] Herramientas con el precio: mensualidad, gastos de cierre, efectivo; contado y renta.
- [x] Preguntas, asesor con días de visita, propiedades parecidas y barra flotante.
- [ ] Verla con un inmueble con lugares cercanos, video, 360°, sin crédito y en renta (hoy solo hay uno, de venta con crédito).

## Etapa 4, paso a paso

- [x] Portada por asuntos: seis asuntos; al elegir uno cambian el fondo, el texto y el botón.
- [x] Quiénes somos con el video que crece al bajar y sus tres columnas.
- [x] En el mercado ahora: tira de propiedades publicadas que se desliza de lado.
- [x] Haz números: mensualidad al mover el precio.
- [x] Zonas: las cuatro ciudades se abren al pasar el cursor o al tocarlas.
- [x] Guías: los cuatro artículos más recientes del blog.
- [x] Cierre «Cuéntanos tu asunto» con qué necesitas, nombre y teléfono.
- [x] Tres videos nuevos (casa, plaza, nave) convertidos a WebM ligero, con respaldo MP4 y póster.
- [ ] Probar el envío del cierre (no se mandó para no crear un contacto).
- [x] En el mercado ahora: al menos cinco tarjetas cuando haya inmuebles publicados, primera con video y arrastre con el ratón.
- [ ] Verla con cinco o más inmuebles publicados (hoy la base tiene uno).

## Etapa 5, paso a paso

- [x] Boceto de Vender y Contacto: [lienzo «Fortius: Vender y Contacto»](https://claude.ai/artifact/6N1mRwLKjMk1q4dAEGgfKU).
- [x] Tu visto bueno al boceto (17/11/2026).
- [x] Vender: portada con video y entrevista en dos pasos, cómo vendemos, qué falta, checklist, «Antes de decidir» y cierre propio.
- [x] Contacto: «Hola, quiero [motivo]», formulario corto, canales directos y quién te atiende.
- [ ] Probar el envío de los dos formularios (no se mandaron para no crear contactos).
- [x] Comprar, Herramientas (con hipoteca y gastos de cierre), Opinión de valor, Nosotros, Preguntas frecuentes, Blog (índice y artículo), Avisos, Privacidad y Términos con el diseño nuevo.
- [ ] Dar a las calculadoras de hipoteca y gastos de cierre el aspecto nuevo por dentro (hoy solo toman colores y letra).

## Etapa 6, paso a paso

- [x] Revisión de las 16 páginas a 375 px: nada se sale de la pantalla, todo lo que se toca mide 44 px, todo control tiene nombre.
- [x] Corregido: los filtros de la frase y las vistas del inventario medían 35 px en el teléfono; las líneas de firma del aviso de privacidad ensanchaban la página.
- [x] Teclado: el menú abre y cierra con Esc y regresa el foco; las listas de la frase también. Anillo de foco en todo el sitio.
- [x] Contraste en claro y oscuro sin fallas en el texto.
- [x] Movimiento reducido: sin efectos al bajar, videos quietos en su póster y transiciones apagadas.
- [ ] Recorrerlo en tu teléfono (la revisión fue en el navegador del agente con tamaño de teléfono).
- [ ] El enlace a Banxico de la calculadora de hipoteca mide 18 px de alto; se arregla con el aspecto nuevo de las calculadoras.

## Lo que te toca a ti

- Confirmar los nombres de los asuntos de la portada (hoy: Vender, Comprar, Rentar, Saber cuánto vale, Poner papeles en orden y Otro asunto).
- Confirmar el texto de Opinión de valor: ahora dice que se entrega después de conocer el inmueble, sin decir que solo sale dentro del método.
- Cargar en el panel al menos cuatro inmuebles de ejemplo más, marcados como ejemplo, para ver la tira «En el mercado ahora» completa (hoy solo hay uno publicado).
- Dar la foto de cada asesor.
- Capturar en el panel los lugares cercanos de cada inmueble.
- Decidir si «Qué hay alrededor» necesita los grupos iglesias y hoteles: hoy el panel no los tiene.
- Aprobar el reemplazo de las pruebas del diseño anterior. Con la etapa 1 ya no pasan: la que pide la letra anterior y las que buscan el botón «Cambiar a tema oscuro» (ahora es un interruptor «Tema oscuro»). Con la etapa 2, las dos pruebas del inventario anterior (filtros en una fila y lectura de la dirección) y las de comparar en el navegador. Con la etapa 3, las del navegador que buscan la galería anterior de la ficha. Con la etapa 4, las del inicio anterior (portada con escenas, método, expediente, «Comprar también empieza por revisar» y el cierre «¿Hablamos de tu propiedad?»). Con la etapa 5, la que busca el título «Antes de publicar.» en Vender, la que busca «¿Compras o vendes? Hablemos.» y la tarjeta «Quiero vender» en Contacto, las del blog que eligen tema y tipo con botones (ahora son listas), la del buscador de Comprar y la de Términos que cambia el tema con el botón anterior. Las de la galería, la tarjeta de visita y la barra del teléfono anteriores siguen pasando porque esas piezas siguen en el código hasta la etapa 7.

## Al integrar

`main` y la rama del panel tienen sus propios `SPEC.md` y `PLAN.md`, que hablan del panel. Al juntar esta rama, esos documentos se unen con estos; no se reemplazan.
