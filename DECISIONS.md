# DECISIONS — cómo se hace el sitio público

Este documento dice **cómo** se construye lo que pide `SPEC.md`. Cada decisión lleva su fecha. Una decisión nueva reemplaza a la anterior: la vieja se borra, no se acumula.

## Marca (17/11/2026)

- **Colores de Fortius II.** Claro: fondo `#F8F8FF`, texto `#18202A`, texto de apoyo `#556170`, acento azul `#1B3FA6`. Oscuro: fondo `#08090A`, texto `#EDEDEF`, texto de apoyo `#8A8F98`, acento ámbar `#E0A030`.
- Un solo acento por tema: azul en claro, ámbar en oscuro. Nunca blanco ni negro puros.
- **Letra:** Geist, en pesos 400, 500 y 600. Los títulos van en 500, muy grandes y apretados.
- **Logo:** el de Fortius II (la O con dos cortes, azul y ámbar).
- **Esquinas:** 16 px en fotos y cajas grandes, 8 px en tarjetas, pastilla en botones y pestañas.
- **El cambio de marca es solo del sitio público.** PDF, formatos, membrete y paneles conservan la marca anterior.

## Diseño (17/11/2026)

- **Menú:** hamburguesa en todos los dispositivos, arriba a la derecha. No hay enlaces sueltos ni botón «Contacto» en la barra.
- **Tema claro y oscuro:** se conserva el interruptor. Las bandas con video o foto son oscuras en los dos temas; el interruptor cambia las demás.
- **Marco de fotos, video y 360°:** nada encima. El video corre sin los controles del navegador; pausar, flechas, contador, pantalla completa y compartir van debajo.
- **Inventario:** frase con filtros y tarjetas tradicionales con tres vistas. Se descartó el índice con vista previa grande porque no sirve con cientos de inmuebles.
- **Inicio:** no se centra en el método de cinco etapas ni en el expediente; esos bloques salen del inicio.
- **Movimiento:** efectos ligados al desplazamiento y videos, hechos con GSAP. El texto siempre se lee aunque la animación no corra.
- Sin antetítulos sobre los títulos, sin numeraciones decorativas y sin mayúsculas espaciadas.
- De tres opciones en adelante, lista desplegable; con dos, interruptor.

## Construcción (17/11/2026)

- **Rama:** `rediseno-sitio`, sacada de `main`. Se publica todo junto en un solo PR en borrador; no se mezclan páginas nuevas y viejas.
- **Estilos separados:** los colores, la letra y las esquinas nuevas viven bajo una clase propia del sitio. No se tocan los estilos que usan los paneles.
- **Se conserva la lógica que ya funciona** (calculadoras, formularios, filtros en la dirección, compartir, blog, datos para buscadores) y se le cambia el aspecto.
- **Formulario «Cuéntanos tu asunto»:** pide qué necesitas, nombre y teléfono. El nombre es obligatorio en el sistema; así no se cambia la base de datos.
- **Día de visita:** viaja dentro del mensaje, como hoy.
- **Mapa:** por zona, como hoy. Los pines por inmueble necesitan guardar coordenadas y decidir qué tan exacta se muestra la ubicación; queda pendiente.
- **Listado grande:** el servidor entrega las propiedades por partes.
- **Gastos de cierre:** el impuesto y el registro se calculan; notaría y avalúo se muestran «por cotizar». Las tarifas cargadas valen solo para 2026.
- **Pruebas:** las que revisan el diseño anterior se reemplazan por equivalentes del diseño nuevo, con acuerdo del titular. No se borran sin reemplazo.
- **Comprobaciones:** lint, tipos, pruebas y navegador se corren solo antes de integrar en `main`.

## Cimientos (17/11/2026)

- **Piel del sitio:** la clase `sitio` va en la página solo fuera de los paneles. Los colores, la letra y las esquinas nuevas viven en `src/app/sitio.css`, bajo esa clase. Las piezas nuevas están en `src/components/sitio/`.
- **Páginas viejas mientras se rehacen:** toman los colores y la letra nuevos por medio de sus mismas variables, y el borgoña escrito a mano se cambió por el acento. Su acomodo, sus esquinas pequeñas y algunos azules marino escritos a mano siguen hasta que cada página se rehaga; en la etapa 7 se retiran sus estilos.
- **Letra:** Geist se carga como letra variable (un solo archivo para 400, 500 y 600). Se dejó de cargar la letra anterior del sitio.
- **Logo:** uno solo para los dos temas: la O siempre azul con su tramo ámbar; las letras toman el color del texto. Sobre foto o video van claras.
- **Cabecera:** logo a la izquierda; a la derecha, la lupa del buscador y el botón «Menú». El buscador queda junto al botón, a un toque en cualquier página.
- **Tema:** interruptor «Tema oscuro» dentro del menú y en el pie (dos opciones, interruptor). Guarda la elección igual que antes.
- **Bandas oscuras:** una caja con la clase `s-banda` usa los colores oscuros en los dos temas, con ámbar como acento.
- **Pie:** sigue el flujo de la página, como antes, sin quedarse fijo detrás del contenido.

## Inventario (17/11/2026)

- **Por partes:** la página llega con los primeros 12 resultados ya filtrados; «Cargar más» pide 12 más. Nadie puede pedir más de 60 de una vez. Solo sale lo publicado, igual que antes.
- **Por ahora el servidor lee el inventario completo y lo recorta.** Con cientos de inmuebles sigue bien; si llegan miles, el recorte se pasa a la base de datos.
- **La frase:** «Quiero [comprar o rentar] [cualquier propiedad] en [cualquier zona] hasta [cualquier precio]». El tipo ofrece los tres grupos (casas y departamentos; locales, oficinas y plazas; naves, bodegas y terrenos) y los tipos que hoy hay publicados. Los topes de precio cambian entre venta y renta; al cambiar de operación se suelta el tope.
- **Más filtros:** moneda y precio desde/hasta. Un precio escrito a mano aparece en la frase.
- **Orden:** más recientes, menor precio, mayor precio y mayor superficie.
- **La vista va en la dirección** junto con los filtros, para compartir la página tal como se ve.
- **Mapa:** por zona, con una lista para cambiar de zona (no botones), y el aviso de que la dirección se da al agendar.
- **Sin fila de filtros activos:** la frase ya dice qué está filtrado.
- **Base de datos:** esta rama no escribe migraciones. Si una hiciera falta, se avisa antes.

## Ficha (17/11/2026)

- **Marco limpio:** fotos, video y 360° en un marco de proporción 2 a 1 (4 a 3 en el teléfono), sin nada encima. Debajo: pestañas, flechas, miniaturas, contador, pausa del video, pantalla completa, compartir y la ficha técnica en PDF. Tocar la foto la amplía; en la ampliación se avanza con flechas o deslizando.
- **Video:** corre solo, sin sonido y en bucle; con movimiento reducido no arranca. Si el video es de YouTube o Vimeo, sus controles son los del reproductor, porque no se pueden quitar.
- Sustituye al carrusel anterior de la ficha.
- **Alrededores:** se agrupan con las categorías que ya se capturan en el panel (playa, escuelas, comercio, salud, restaurantes, transporte, parques y otros). Si no hay lugares capturados, el bloque no sale.
- **Herramientas:** calculan con el precio publicado. Con crédito: mensualidad (enganche de 10 a 50 %, plazo de 10, 15 o 20 años, tasa de referencia de 10.5 % anual), gastos de cierre y efectivo para comprar. Sin crédito: «Compra de contado» con su aviso. En renta: lo que se paga para entrar; el depósito lo fija el dueño. Precio a consulta, en dólares o inmueble cerrado: no hay herramientas.
- **Asesor:** iniciales mientras no haya foto. Cinco días hábiles para proponer la visita; el día viaja en el mensaje.
- **Barra flotante:** aparece al pasar el marco y se esconde junto al asesor y en el pie. Lleva el precio, WhatsApp y «Solicitar visita», que abre el formulario del asesor. Reemplaza la barra de contacto que solo salía en el teléfono.
- **Preguntas:** cuatro generales; la del crédito y la de los gastos cambian según el inmueble sea de venta o renta y admita o no crédito.

## Inicio (17/11/2026)

- **Portada:** seis asuntos. Vender, Comprar y Rentar llevan video; Saber cuánto vale, Poner papeles en orden y Otro asunto llevan foto. Al elegir un asunto cambian el fondo, el texto y el botón. Los que no tienen página propia bajan al cierre con la frase ya escrita.
- **Videos:** solo se descarga el del asunto elegido y solo mientras se ve. Con movimiento reducido o ahorro de datos se queda el póster.
- **Formato de los videos:** WebM ligero (unos 1.4 MB cada uno), sin audio, de 1280 px de ancho. Lleva un MP4 de respaldo del mismo peso para iPhone anteriores a iOS 17.4, que no reproducen WebM. Los originales no se guardan en el repositorio.
- **Qué video va dónde:** la casa es el fondo de Vender; la plaza comercial, el de Rentar; la nave industrial es el video que crece en «Quiénes somos», porque muestra la parte del negocio que la portada no enseña. Comprar conserva el recorrido por el interior de una casa.
- Ya no se usan en el inicio el video de portada con escenas ni el de la sala frente al mar; sus archivos se retiran en la etapa 7.
- **Efectos ligados al desplazamiento:** el video de «Quiénes somos» crece hasta el ancho completo y la tira de propiedades se desliza de lado. En el teléfono y con movimiento reducido no hay efecto: el video ya está abierto y la tira se recorre con el dedo.
- **En el mercado ahora:** al menos cinco tarjetas siempre que haya cinco o más inmuebles publicados, y hasta ocho. Primero las destacadas y luego las más recientes, sin repetir; nunca vendidas ni rentadas. Si hay menos publicadas, salen las que haya: el sitio no inventa inmuebles.
- **Cómo se ve la tira:** tarjetas altas; la primera es ancha y lleva el video del inmueble si tiene un archivo de video propio (con un enlace de YouTube o Vimeo va su foto). Al bajar se desliza de lado un tramo corto, como en el boceto, para que la primera tarjeta no se corte; el resto se arrastra con el ratón o se recorre con el dedo. En el teléfono y con movimiento reducido no se mueve sola.
- **Haz números:** 20 % de enganche, 20 años y la tasa de referencia de 10.5 %, la misma de la ficha.
- **Cierre:** llega al panel como contacto, con lo que escribió en «¿Qué necesitas?» como mensaje. Es la única invitación del inicio; el pie no repite la suya aquí.

## Vender (17/11/2026)

- **Boceto:** el lienzo «Fortius: Vender y Contacto», aprobado el 17/11/2026.
- **Portada:** el video de la casa, el mismo del asunto Vender del inicio. La cabecera flota clara sobre él, como en el inicio.
- **Entrevista en dos pasos:** es el único formulario de la página. Paso 1: tipo de propiedad en lista (casa, departamento, local u oficina, nave industrial, terreno) y zona. Paso 2: nombre y teléfono. Llega al panel como contacto con el mensaje «Vender · tipo · zona». «Volver» no borra lo escrito. Si la recepción está apagada, el paso 2 ofrece WhatsApp y teléfono.
- **Checklist:** se descarga directo, sin pedir datos.
- **Cierre propio** «¿Empezamos con la entrevista?»; el pie no repite su invitación aquí.

## Contacto (17/11/2026)

- **El título es el motivo:** «Hola, quiero [vender, comprar, rentar, preguntar por un inmueble o contarles otro asunto]», con la misma lista de la frase del inventario. Al cambiarlo cambian la guía, el tercer campo y el mensaje que lleva WhatsApp; lo escrito no se borra.
- **Formulario:** nombre, teléfono y un detalle según el motivo. Llega al panel como contacto con el mensaje «Quiere [motivo] · detalle».
- **O directo:** WhatsApp, llamar y correo, con los datos y el horario que ya tiene el sistema. Solo sale el canal que existe; si no hay ninguno, lo dice.
- **Quién te atiende:** foto con «Responde Fortius, con un asesor asignado a tu asunto» y el enlace al equipo.
- Las piezas anteriores de Vender y Contacto quedan en el código sin uso hasta la etapa 7.

## Demás páginas (17/11/2026)

- **Piezas comunes:** las páginas interiores son claras y empiezan con un título grande y una línea de apoyo. Cada tema va con su título a un lado y filas con líneas finas al otro; al final, un «siguiente paso». La banda oscura de invitación la pone el pie.
- **Comprar:** documentos, gastos, forma de pago y pasos al cierre en filas; al final, hasta tres propiedades publicadas (primero las destacadas). El buscador de la página se retiró: «Ver propiedades» lleva al inventario, que ya filtra con su frase.
- **Herramientas:** dos tarjetas grandes con una vista previa. Las calculadoras conservan sus cálculos y su acomodo; por ahora solo toman los colores y la letra nuevos.
- **Opinión de valor:** se entrega por escrito después de conocer el inmueble y sus papeles. Ya no dice que solo sale dentro del método, porque desde el 16/11/2026 es un servicio que se hace cuando se pide.
- **Nosotros:** los perfiles publicados en el panel; mientras no haya, el perfil ilustrativo con sus iniciales. Misión y visión en fotos con texto; valores en filas, sin números.
- **Blog:** la búsqueda y los filtros siguen en la dirección. Tema y tipo pasan a listas desplegables; fechas y orden siguen plegados. «Guía · tema» va en la línea de datos, no encima del título.
- **Preguntas frecuentes:** se abren con un toque, agrupadas como antes.
- **Avisos, Privacidad y Términos:** documentos en filas con «Consultar» y «Descargar PDF»; el texto largo se lee a 720 px de ancho, con índice al lado en Términos.
- Las piezas anteriores de estas páginas quedan en el código sin uso hasta la etapa 7.

## Teléfono y accesibilidad (17/11/2026)

- **Medida mínima:** en el teléfono todo lo que se toca mide al menos 44 px de alto, también los filtros dentro de la frase del inventario.
- **Textos largos:** en las páginas de lectura una palabra o una línea de firma muy larga se parte para no ensanchar la página.
- **Efectos al bajar:** solo en el inicio, como en el boceto. Las demás páginas no llevan efectos de entrada.
- **Movimiento reducido:** una regla general apaga transiciones y animaciones; los efectos del inicio y los videos se quedan quietos.

## Limpieza (17/11/2026)

- **Imagen para compartir:** el logo de Fortius II con su leyenda, en claro sobre la banda oscura del sitio.
- **Ícono de la pestaña:** la O de Fortius II, azul con su tramo ámbar, sobre el fondo claro de la marca. Es uno solo para el sitio y el panel. Los íconos para instalar la app del panel siguen como están.
- **Confirmación de Vender:** se conserva su dirección; hoy nadie llega a ella porque la entrevista confirma en la misma página.
- **Pruebas del sitio:** las del navegador viven en una sola prueba del diseño nuevo, más navegación, ficha en PDF, calculadoras e instalación. Lo que solo usaban las pruebas anteriores se retiró con ellas (17/11/2026).
- **Estilos:** el sitio usa solo `sitio.css` y los de cada página; los estilos globales del diseño anterior ya no existen.
