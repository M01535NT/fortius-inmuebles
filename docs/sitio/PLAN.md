# PLAN — en qué orden se hace

Este documento da **la pauta**: qué sigue y cómo sabrás que quedó. Qué se construye está en `SPEC.md`; cómo, en `DECISIONS.md`. Lo terminado se marca y, al cerrar la etapa, se borra de aquí: queda en el historial de git.

## Dónde estamos

Etapas 1 a 8 terminadas y publicadas en `main`. Etapa 9 (marca del sistema de diseño) construida en la rama `marca-sitio` (17/11/2026); falta verla en el navegador y tu acuerdo para publicarla.

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
| 9. Marca nueva | Colores, letra, esquinas, sombras, logo e ícono del sistema de diseño | Todas las páginas del sitio se ven con la marca nueva y el panel sigue igual | Mediano |

## Etapa 0, paso a paso

- [x] Crear la rama `rediseno-sitio`.
- [x] Reescribir `SPEC.md`, `PLAN.md` y `DECISIONS.md`.
- [x] Los documentos del sitio viven en `docs/sitio/`; los del panel, la marca anterior (vale para el panel y los PDF) y el documento de producto se quedan como en `main`, con un enlace hacia aquí (17/11/2026).
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

## Etapa 7, paso a paso

- [x] Error, «Página no encontrada», «Esta propiedad ya no está publicada» y la confirmación de Vender con el diseño nuevo (se habían quedado con el anterior).
- [x] Retirados 15 estilos de páginas, 20 piezas del diseño anterior y 9 videos e imágenes que ya nadie usaba.
- [x] Imagen para compartir con el logo de Fortius II.
- [x] Pruebas nuevas del sitio en el navegador: teléfono sin desbordes y con controles de 44 px en 17 páginas, portada por asuntos, frase del inventario, Vender en dos pasos, Contacto, páginas de error y movimiento reducido. Se corren al integrar.
- [x] Pruebas del diseño anterior reemplazadas (17/11/2026, con tu acuerdo): seis pruebas de navegador fuera; las que seguían valiendo, al diseño nuevo; se agregaron el blog con sus listas y la revisión de accesibilidad en claro y oscuro. Con ellas salieron 18 piezas que ya solo usaban esas pruebas y los tres archivos de estilos globales del diseño anterior. Las pruebas de piezas sueltas pasan; las del navegador se corren al integrar.
- [x] Ícono de la pestaña con la O de Fortius II, en el sitio y en el panel (tu decisión del 17/11/2026). Los íconos para instalar la app del panel no cambian.

## Etapa 9, paso a paso

- [x] Documentos del sitio corregidos con la marca nueva.
- [x] Rama `marca-sitio`, sacada de `main`, solo para el sitio.
- [x] Colores, sombras, foco y esquinas rectas en claro, oscuro y bandas oscuras.
- [x] Letra Archivo del sistema: titulares, nombres de filas y cifras en Archivo angosta y peso 600; el texto en ancho normal.
- [x] Azul real como tinta y fondo oscuro en todo el sitio: texto, fondo del tema oscuro, bandas sobre video, sombras e imagen para compartir (18/11/2026). Revisado en el navegador del agente: el contraste pasa en claro y oscuro.
- [x] Acentos rojos al pasar el cursor y movimiento ligero en botones, tarjetas, filas y preguntas (18/11/2026).
- [x] Botones, campos, insignias, pestañas, menú, interruptor y cajas con el aspecto del sistema. «Solicitar visita» de la ficha va en rojo imperial.
- [x] Logo claro y oscuro en cabecera, menú y pie (el oscuro sobre video); emblema en el ícono de la pestaña del sitio; imagen para compartir nueva. El panel conserva su ícono.
- [x] Calculadoras, documentos y demás piezas compartidas toman las esquinas rectas en el sitio.
- [x] Pruebas: las que simulan las letras ya conocen la letra del sitio; prueba nueva del logo.
- [x] Revisado en el navegador del agente, claro y oscuro, en computadora y tamaño de teléfono (17/11/2026). Las 17 páginas caben en el teléfono con controles de 44 px; el contraste del texto pasa; el panel conserva su letra y su ícono. Se corrigieron las esquinas redondeadas de las calculadoras y las etiquetas de los formularios del inicio, Contacto y documentos de la ficha.
- [ ] Recorrerlo en tu teléfono.
- [ ] Comprobación completa y PR en borrador, cuando tú lo digas.
- [ ] La rama `sitio-controles-radix`, que aún no está en `main`, toca algunos de los mismos archivos: al juntarlas hay que resolver los choques.

## Lo que te toca a ti

- Confirmar los nombres de los asuntos de la portada (hoy: Vender, Comprar, Rentar, Saber cuánto vale, Poner papeles en orden y Otro asunto).
- Confirmar el texto de Opinión de valor: ahora dice que se entrega después de conocer el inmueble, sin decir que solo sale dentro del método.
- Cargar en el panel al menos cuatro inmuebles de ejemplo más, marcados como ejemplo, para ver la tira «En el mercado ahora» completa (hoy solo hay uno publicado).
- Dar la foto de cada asesor.
- Capturar en el panel los lugares cercanos de cada inmueble.
- Decidir si «Qué hay alrededor» necesita los grupos iglesias y hoteles: hoy el panel no los tiene.

## Al integrar

Los documentos del panel siguen en la raíz (`SPEC.md`, `PLAN.md`, `AGENTS.md`, `README.md`) y apuntan a esta carpeta. Al juntar con la rama del panel se conservan los dos juegos.
