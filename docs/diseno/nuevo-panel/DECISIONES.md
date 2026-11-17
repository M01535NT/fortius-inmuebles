# Nuevo panel: decisiones de diseño

Cómo debe ser el panel nuevo (`/panel`, rama `nuevo-panel`). Manda sobre lo construido: donde el código diga otra cosa, se cambia el código.

- **Boceto aprobado por el titular el 16/11/2026 (DEC-68):** «Fortius por asuntos», https://claude.ai/artifact/Dj9XqPpFyEUeHUsQwCtvT8 (privado). Es la referencia de estructura y de aspecto. El mismo boceto está en [`boceto-fortius-por-asuntos.html`](boceto-fortius-por-asuntos.html): se abre en el navegador y funciona con datos de ejemplo. Su código es de boceto; sirve para ver cómo se ve y cómo responde, no para copiarlo.
- **Casos reales con los que se diseñó:** [`casos-reales.md`](casos-reales.md) (DEC-67).
- **Lo anterior** (estilo tipo Apple, Hoy, Bandeja, Consultas, Trámites, Dinero y demás como estaban) quedó completo en [`historial-de-decisiones.md`](historial-de-decisiones.md), solo para consulta.
- Las reglas del negocio y de seguridad están en `SPEC.md`; el aislamiento del panel viejo, en `LEGADO.md`.

## Principios

1. **Cualquier caso inmobiliario cabe (DEC-67).** Ninguna metodología es la columna vertebral. Si un caso real no cabe, se cambia el diseño, no el caso.
2. **Minimalista es agrupar, no quitar.** Pocas palabras y pocos elementos a la vista, con todas las funciones detrás. Varias opciones viven en un solo botón que abre su lista.
3. **Listas desplegables, nunca un botón por opción.** Con dos opciones se permite un interruptor.
4. **Íconos en todo:** menú, apartados, tipos de asunto, botones y menús. Son ayuda visual, no adorno.
5. **Todo ligado desde el asunto.** Personas, inmueble, documentos, dinero y tareas se ven y se editan sin cambiar de sección.
6. **Cada documento se puede hacer aquí o cargar hecho.** Donde haya una opinión, un presupuesto o un contrato hay un botón «Hacer» con las dos salidas.
7. **Nada frena, solo avisa (DEC-61).** La seguridad (permisos, quién ve qué, datos privados) no es un freno y se conserva.
8. **Lenguaje sencillo, sin rastros de IA** («Por confirmar», «Leer datos»). Los datos de ejemplo lo dicen.
9. Es una app de trabajo: se usa todo el día, en computadora y en teléfono.

## Aspecto

App moderna, en la línea de Linear, Notion o las apps de iOS, sin copiarlas.

- **Color:** fondo gris muy claro, tarjetas blancas con borde fino, menú lateral un tono más gris. Un solo azul para las acciones. Verde, ámbar y rojo solo dicen el estado de algo. Tema claro y oscuro.
- **Letra:** Inter. Títulos de 24 px, texto de 14 px en computadora y 15 px en teléfono.
- **Íconos:** de trazo, un mismo grosor. Cada apartado y cada tipo de asunto lleva su ícono dentro de un cuadro de color.
- **Formas:** tarjetas de 14 px de radio; botones y campos de 9 px; etiquetas de estado redondas.
- **Controles:** de 34 px en computadora y 40 a 44 px en teléfono.
- **Movimiento:** corto, solo al abrir una ventana o un menú; se apaga con «reducir movimiento».
- Los valores exactos están en el boceto y pasan a los tokens del panel al construir.

## Estructura

- **Menú lateral** (computadora): Inicio, Asuntos, Inmuebles, Directorio, Biblioteca y, solo para el director, Equipo. Arriba el buscador; abajo «Recientes» con los últimos asuntos y la cuenta de quien entró.
- **Teléfono:** barra de abajo con Inicio, Asuntos, «+» (consulta nueva), Inmuebles y Más.
- **«Nueva consulta»** está en Inicio y en la lista de Asuntos. No se repite en el menú lateral.
- **Tres zonas en computadora:** menú, lista y lo abierto. Cada parte de un asunto abre en una ventana lateral, sin salir.

## Consulta en vivo

Casi todo empieza con una llamada o un mensaje. La consulta se llena mientras se habla.

- **Quién llama, teléfono y por dónde** llegó.
- **Qué pasa:** un cuadro libre, como lo cuenta la persona.
- **Los datos de siempre,** cada uno en su desplegable: qué quiere, de quién es, qué es, colonia, quién lo ocupa, si tiene escritura y qué debe.
- **Para pedirle:** la lista de documentos se arma con lo marcado; se quita lo que no aplique y sale como mensaje para WhatsApp. Lo envía el asesor.
- Nada es obligatorio y se guarda sola.
- **«Abrir asunto»** deja creados y ligados la persona, el inmueble, la lista de documentos y un primer plan de estudio. La llamada abre el asunto «En estudio» desde el primer minuto.

## Asuntos

El asunto es la unidad de trabajo, con folio. Sirve para cualquier encargo.

- **Lista:** cada asunto con su ícono, lo que sigue, en qué va y la fecha. Se busca y se filtra por «en qué va» y, el director, por quién lo lleva.
- **Cabecera:** folio, en qué va (En estudio, Propuesta, En marcha, Por cobrar, Cerrado; lo cambia el asesor cuando quiere), el botón «Nuevo» y el menú de tres puntos.
- **Debajo del título:** qué encargaron (Revisar, Comercializar, Tramitar, Asesorar; uno o varios), el resultado de la opinión, si está en el sitio y quién lo lleva.
- **Lo que sigue:** la siguiente tarea del plan, con marcar hecha y posponer. Si no hay, pide escribirla.
- **«Nuevo»** abre en un solo botón: tarea, nota o decisión, documento, persona, cobro y fotos.

### Apartados

Las partes de un asunto se llaman **apartados**. Cada uno es un renglón con su ícono y un resumen en una línea; al tocarlo abre su ventana.

- **De base, siempre:** Personas, Plan e Historial.
- **Según el encargo** aparecen los demás; se **agregan y se quitan** a conveniencia con «Agregar apartado» y con el menú de cada ventana. Quitar un apartado lo oculta; sus datos se conservan.
- **Apartado propio:** el asesor crea uno con el nombre que quiera (Visitas, Ofertas, Obra) para lo que no cabe en los demás.
- Lo que no se encargó no aparece ni se reclama.

| Apartado | Qué lleva |
| --- | --- |
| Personas | Cada una con su papel real (contacto, propietario, titular, heredero, copropietario, comprador, vendedor, inquilino, inversionista, contraparte, abogado, notaría), teléfono y sus acciones. |
| Inmueble | Uno o varios. Con varios, cada uno lleva su precio, su estado (libre, apartado, rentado o vendido) y su propio cierre. Abre la misma ficha que la sección Inmuebles. |
| Situación | Los datos de la consulta, qué debe, qué encargaron y la lista de lo que falta averiguar. |
| Documentos | Lo recibido y lo que falta, por grupos. Cada documento con su archivo; se pide lo que falta por WhatsApp; se agregan listas de la Biblioteca. Es la única lista de documentos del asunto. |
| Opinión jurídica | Resultado (factible, con observaciones, no factible), análisis y qué hay que resolver con quién lo hace. Se genera el PDF o se carga uno hecho por fuera. Lo que hay que resolver pasa al Plan. |
| Honorarios | Presupuesto por conceptos con su PDF, contrato (hacerlo o cargar el firmado) y cobros con lo que falta. |
| Plan | Etapas con tareas. Cada tarea dice quién la hace (Fortius, cliente, abogado, notaría) y puede quedar hecha, sin aplicar o «no se puede todavía», con el motivo. Se ve como lista o en el tiempo. Se agregan planes de la Biblioteca. Una tarea enlaza a su apartado. |
| Historial | Notas, decisiones (con quién y por qué) y lo que el sistema registra, lo más nuevo arriba. |

## Inmuebles

Es también el panel de lo que sale en el sitio público: aquí se carga todo.

- **Lista:** todos los inmuebles con tipo, colonia, precio, lo que ya tienen cargado y si están publicados. Se filtra por publicados, sin publicar, venta y renta.
- **Ficha,** en pestañas:
  - **Ficha técnica:** nombre, tipo, operación y precio; después los datos propios del tipo, en grupos plegables que dicen cuántos van. Una nave pide altura libre, kVA, subestación, andenes, rampas, resistencia del piso, contra incendio y uso de suelo; una casa, recámaras, baños, boiler y paneles.
  - **Fotos:** varias a la vez; se elige portada.
  - **Video y 360:** video subido o por enlace; recorrido 360 con tomas subidas o por enlace.
  - **Planos y permisos:** escritura, licencias, dictámenes, factibilidades y planos. Son los mismos documentos del asunto.
  - **Ubicación:** colonia, ciudad, dirección exacta (privada), referencias y mapa. El público ve solo la colonia salvo que se encienda mostrar la dirección.
  - **Sitio:** publicar, qué lleva y qué falta, descripción y compartir.
- **Guardar no publica.** Publicar es un interruptor propio y se puede deshacer.
- Los siete tipos de DEC-32 se conservan.

## Directorio

Todas las personas, una vez cada una, con su teléfono y un botón por cada asunto del que vienen. El botón abre ese asunto.

## Biblioteca

Donde viven las metodologías, todas al mismo nivel.

- **Qué pedir:** listas de documentos por situación.
- **Qué hacer:** planes por tipo de solución.
- Se copian a un asunto y ahí se cambian con libertad. Las escribe el titular; lo jurídico lo revisa el abogado.

## Inicio

Se llama Inicio, no Hoy, porque muestra más que el día.

- **Hoy:** lo de Fortius con fecha de hoy o atrasada.
- **Esta semana:** lo que viene en siete días.
- **Lo esperas de otros:** tareas del cliente, el abogado o la notaría.
- **Por cobrar:** asuntos con honorarios aceptados y saldo.

## Equipo y quién ve qué

- **Director:** ve todos los asuntos, puede cambiar quién los lleva y tiene la sección Equipo, con cada asesor y sus asuntos, lo de hoy, lo de la semana, lo vencido, lo que no tiene siguiente paso y lo que falta cobrar.
- **Asesor:** ve solo lo suyo y no tiene la sección Equipo.
- La visibilidad se hace cumplir en la base (RP-101 PN), no solo en pantalla.

## Lo que se conserva

- El asunto como centro, los folios y los papeles (RP-106 a RP-108).
- Permisos, RLS, control de versión, historial y borrado recuperable.
- Deshacer en lugar de «¿estás seguro?».
- Los formatos 01 a 24 y su captura sobre el documento: son lo que hay detrás de «Hacer».
- La guía de cancelación de hipoteca, como un plan más de la Biblioteca.
- Fichas en la dirección, para compartir y volver con Atrás.

## Por decidir

- **Dónde entran las solicitudes del sitio público** y cómo se vuelven consulta.
- **Agenda:** si las citas con hora necesitan vista propia o basta con Inicio y el Plan.
- **Archivos sueltos** que llegan sin saber de qué asunto son.
- **Calculadoras** (crédito, comisión, costos de cierre): dónde quedan.
- **Chat del equipo:** sigue al final (RP-105).
- **Inmueble sin asunto:** hoy el boceto abre un asunto al crear un inmueble; falta confirmar si se permite sin él.
- **Opinión de valor:** si se hace en cualquier asunto o solo al comercializar una venta.
- **Formato de presupuesto de honorarios:** falta la plantilla del titular.
- **Contenido de la Biblioteca y datos por tipo de inmueble:** lo del boceto es de ejemplo.
- **Qué ve exactamente el asesor** de los asuntos e inmuebles ajenos.
- **Destino de lo construido que el boceto no trae** (Bandeja, Consultas, Trámites, Dinero, Agenda, Formatos y Herramientas como pantallas): se decide al planear la reconstrucción.
- Siguen abiertas las de privacidad, respaldo, abogado y datos de prueba anotadas en `PLAN.md`.
