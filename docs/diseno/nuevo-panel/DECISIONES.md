# Nuevo panel: decisiones de diseño

Registro vivo de las decisiones de diseño del panel `/admin` rehecho desde lo mínimo. Cada decisión lleva fecha y, si reemplaza otra, lo dice. El trabajo va en la rama `nuevo-panel`.

- **Lienzo con los prototipos:** https://claude.ai/artifact/SmyWKd1xYnkmPVvyTMZGjf (privado; se comparte desde su menú Compartir).
- **Estado:** bocetos interactivos. Todavía no hay código en el panel.

## Estilo tipo Apple (16/11/2026) — reemplaza parte del «Sistema visual» de abajo

- **Decisión del titular:** el panel toma el estilo del prototipo rápido que aprobó («Sí, esta»: https://claude.ai/artifact/GS2SrBsgPRfNDZ5Q2fWnVY). Más Apple que Google, sin copiar al iPhone.
- **Letra:** la del sistema en Apple (SF) e Inter en Windows y Android. Reemplaza a Geist. Títulos grandes de 34 px en 700; subtítulos de 20 px en 700.
- **Color:** fondo gris claro `#F2F2F7` con tarjetas casi blancas `#FEFEFF`; en oscuro, fondo `#060607` y tarjetas `#1C1C1E`. Acento azul en los dos temas (`#0071E3` en claro, `#0A84FF` en oscuro); el ámbar deja de ser el acento del oscuro. Vencido y errores siguen en rojo; sigue sin haber blanco ni negro puros.
- **Esquinas:** 6, 10, 14 y 16 px (antes 2, 4, 8 y 16). Botones de 12 px.
- **Tarjetas agrupadas:** sin borde ni sombra, separadas por el fondo gris; dentro, filas con línea fina.
- **Íconos de sección:** el mismo dibujo del sistema, en claro sobre un cuadro de color propio por sección (como los ajustes del iPhone). Dentro de las pantallas siguen en trazo.
- **Menú lateral y barras:** fondo translúcido; la sección activa va llena de azul. En el teléfono, la barra inferior marca la activa en azul y los avisos en rojo; el «+» de arriba va en azul sin cuadro.
- **Botones:** el principal lleno de azul; el secundario en azul claro con texto azul. Al pulsar se encogen un poco.
- **Campos y búsqueda:** fondo gris de relleno, sin borde.
- **Lo que se conserva del sistema anterior:** el logotipo, los 28 dibujos de íconos, foco visible, botones de 44 px o más, sin cejas ni mayúsculas.

## Sistema visual (16/11/2026) — nuevo, reemplaza la paleta anterior en los bocetos

- **Fuente:** el PDF «Sistema de diseño Fortius» que entregó el titular. Aplicado a todos los bocetos del lienzo; los componentes siguen siendo los de los bocetos, ahora con este sistema.
- **Choque con lo vigente:** AGENTS.md y docs/brand.md dicen Archivo, borgoña #8A1634 y azul noche. Este sistema es otro: Geist, azul #1B3FA6 en claro y ámbar #E0A030 en oscuro. Solo se aplicó a los bocetos. No se tocó el sitio ni esos documentos; falta decidir si reemplazan a los anteriores.
- **Color:** variables con los nombres del sistema (background, card, raised, muted, border, border-strong, ink, ink-muted, accent, accent-soft, accent-ink, accent-hover, accent-active, warning, error, scrim). Nada de blanco ni negro puros. Un solo acento por tema. Vencido y errores van en error, no en el acento.
- **Tema claro y oscuro:** los bocetos siguen el tema del dispositivo. En Configuración hay «Apariencia» (Automático, Claro, Oscuro) que lo fija y se recuerda entre pantallas.
- **Letra:** Geist, pesos 400, 500, 600 y 700. Títulos en 600; cifras y nombres destacados en 700. Se quitó el ancho variable de Archivo.
- **Esquinas:** 2 px en etiquetas, 4 px en botones y campos, 8 px en tarjetas y paneles, 16 px en hojas y contenedores grandes. Los avatares y contadores siguen redondos.
- **Sombras:** solo lo que flota (menús, avisos, hojas y ventanas). Las tarjetas y listas se separan con línea.
- **Íconos:** los 28 del sistema, en trazo fino con un toque de acento. Equivalencias elegidas: Hoy = Casa; Bandeja = Descargar; Consultas = Llamada; Personas = Cliente; Inmuebles = Edificio; Asuntos = Expediente; Agenda = Cita; Formatos = Escritura; Trámites = Verificado; Dinero = Precio; Equipo = Mensaje; Herramientas = Costos; Configuración = Filtrar. Los gestos de interfaz que el sistema no trae (flechas, más, cerrar, palomita, reloj, correo, cámara) usan el mismo trazo fino.
- **Logo:** la O con dos cortes. En el menú lateral va el logotipo completo; con el menú contraído, solo la O. Sobre fondo claro el ámbar da 2.2:1, por lo que no conviene usarlo en tamaños muy chicos.
- **Foco y botones:** aro de 2 px en el acento con separación de 2 px; botones de 44 px o más.
- **No tomado del sistema:** las etiquetas en mayúsculas del PDF (como DISPONIBLE). El panel conserva la regla de títulos sin antetítulo y texto en minúsculas.
- **Pendiente del sistema:** el movimiento (duraciones y transiciones) sigue sin definirse; faltan íconos para reloj, correo y cámara; el PDF no da una pestaña con línea de acento, que los bocetos reemplazan por el control segmentado.

## Principios (15/11/2026)

1. **Cada elemento en pantalla tiene que servir en la inmobiliaria.** Si no ayuda a decidir o a actuar, se quita o queda a un toque.
2. **Primero el teléfono.** El asesor trabaja en la calle; el escritorio es la misma pantalla con más espacio, no otra pantalla.
3. **Una acción principal por pantalla**, en borgoña. Lo demás es blanco con borde o texto.
4. **Una app, no un dibujo estático.** Interruptores, desplegables, menús, hojas desde abajo, paneles laterales, diálogos y avisos que responden al toque.
5. **Premium es quitar fricción, no agregar adornos.** Menos toques por acción, deshacer en lugar de «¿estás seguro?», la app se adelanta (próxima cita, coincidencias). Sin rachas, puntos, confeti ni gráficas decorativas.
6. **Nada frena, solo avisa** (decisión del titular, 14/11/2026).
7. **Datos de ejemplo siempre marcados** como «Datos de ejemplo».

## Componentes y movimiento (15/11/2026)

- **Componentes:** shadcn/ui o equivalentes del mismo nivel (Radix o Base UI por debajo): Sheet, Dialog, Drawer (Vaul), DropdownMenu, ContextMenu, Command (cmdk), Switch, Select, Tabs, Toggle Group, Tooltip y Sonner para avisos. Se adaptan a los tokens de Fortius; no se usa su tema por defecto.
- **Movimiento:** Motion (`motion`, ya instalado). Reglas:
  - entradas con ease-out fuerte `cubic-bezier(0.23, 1, 0.32, 1)`; hojas y paneles con la curva de cajón `cubic-bezier(0.32, 0.72, 0, 1)`;
  - menos de 300 ms en la interfaz; las salidas, más rápidas que las entradas;
  - solo `transform` y `opacity`;
  - botones que se encogen a 0.97 al presionar;
  - nada anima desde `scale(0)`; los menús crecen desde su botón;
  - lo que se usa con el teclado decenas de veces al día no se anima;
  - con `prefers-reduced-motion` se quitan los desplazamientos y quedan solo los fundidos.
- **Pendiente de decidir:** el panel hoy usa Iconoir (`src/components/admin/icons.tsx`) y shadcn/ui trae Lucide. Los bocetos usan trazos tipo Lucide. Hay que elegir uno antes de programar.

## Marca dentro del panel

- Paleta del panel (LV-09): fondo `#F8F8FF`, tarjetas blancas, texto `#061F3F`, gris azulado `#49566A`, líneas `#DEE3EC`, borgoña `#8A1634` (presionado `#74112B`), azul de foco `#1E5BA1`, rojo de vencido `#B42318`, ámbar `#9C5400`.
- Letra Archivo; títulos con peso 650 a 700.
- Esquinas: 10 px en controles, 14 a 16 px en tarjetas, 18 a 22 px en botones flotantes y hojas.
- Separar con líneas finas; sombras solo en lo que flota.
- Sin cejas, sin mayúsculas tecleadas, sin emoji. Nada en pantalla menciona a la IA (usar «Por confirmar», «Leer datos»).
- Objetivos táctiles de 44 px o más; foco visible en azul.

## Navegación

- **Teléfono:** barra inferior con Hoy, Bandeja, Personas, Inmuebles y Asuntos; el «+» para crear va en la barra de arriba.
- **Escritorio:** menú lateral corto (Hoy, Bandeja, Personas, Inmuebles, Asuntos, Agenda) y una caja «Buscar o crear» (Ctrl K).
- **«Operaciones» se llama «Asuntos»** (indicación del titular, 15/11/2026). En pantalla ya no aparece «Operaciones»; los nombres técnicos (tablas, folio `EXP-######`) no cambian.
- **Menú lateral contraíble o fijo, a elección del asesor** (pedido del titular, 15/11/2026). El botón junto al logotipo lo contrae a una franja de íconos de 64 px. Al pasar el ratón o al llegar con el teclado, se abre encima del contenido sin moverlo. El alfiler lo vuelve a fijar. La elección es una preferencia local de interfaz y se recuerda en todas las pantallas.
- Formatos, Trámites, Herramientas y Configuración viven en «Más» o en la búsqueda.

## Patrones de interacción

| Patrón | Teléfono | Escritorio |
| --- | --- | --- |
| Crear algo nuevo | «+» de 44 px en la barra de arriba, a la derecha del título (sin botón flotante, que tapaba la lista; 15/11/2026) | Botón «Nuevo» arriba a la derecha y la tecla N |
| Acción rápida en una fila | Deslizar: derecha = hecho, izquierda = posponer | Botones al pasar el ratón; E y P con la fila enfocada |
| Menú de una fila | Mantener presionado | Clic derecho o botón «Más» |
| Detalle | Hoja desde abajo | Panel lateral derecho |
| Crear | «+» con captura en una línea | «Buscar o crear»: busca y, si no existe, lo crea |
| Posponer | Esta tarde · Mañana · Lunes · Elegir fecha | Igual, en un menú |
| Confirmar | Aviso con «Deshacer» por 5 segundos | Igual |
| Próxima cita | Barra fija sobre las pestañas | Tarjeta al inicio de la columna derecha |

La captura en una línea reconoce el tipo, el día, la hora, la persona y el lugar sin IA, y los muestra en pastillas para confirmar antes de guardar.

## Elegir entre opciones: listas desplegables, no filas de botones (regla del titular, 16/11/2026)

- **Regla:** el panel es minimalista. Para elegir una opción entre varias (Motivo: Vende, Compra, Pone en renta…; tipo de inmueble; estado; canal; dónde están las llaves; cuándo volver a contactar) **no se usan filas de botones o «chips»**. Se usa una lista desplegable u otro control que ocupe una sola línea.
- **Por qué:** las filas de botones llenan la pantalla, sobre todo en el teléfono, y empujan hacia abajo lo importante. El titular dijo que se abusaba de ellas.
- **Regla final del titular (16/11/2026):** **3 o más opciones → lista desplegable; 2 opciones → interruptor** («Venta ◯ Renta», la elegida en negritas). Vale para formularios y para las vistas de las listas (Activos, En espera, Cerrados; Todos, Venta, Renta), que también dejan de ser botones.
- **Cómo:** `Desplegable` y `Segmentado` del kit eligen solos: con 2 opciones muestran el interruptor; con 3 o más, la lista flotante del panel (`ui/select.tsx`: caja de 44 px con flecha, lista con línea y sombra suave, palomita en la elegida, teclado y lector de pantalla). Las fechas rápidas van en un desplegable «Cuándo» (Sin fecha, Mañana, En 3 días, En una semana, Otra fecha…); «Otra fecha» abre el calendario.
- **Manda sobre los bocetos:** donde un boceto dibuje botones para elegir una opción, se construye con desplegable.

## Datos de prueba del panel nuevo (regla del titular, 16/11/2026)

- **Todo nuevo:** el panel nuevo no muestra los datos de prueba del panel viejo. Se borran (con respaldo antes) y se cargan datos de prueba nuevos, marcados como ejemplo.
- **Pendiente de confirmar:** el borrado toca la base que también usa el sitio público (hoy 3 inmuebles de prueba publicados), por eso espera el visto bueno explícito del titular antes de ejecutarse.
- **Datos nuevos cargados (16/11/2026, 07:49 UTC):** 6 personas, 5 inmuebles, 4 consultas, 3 asuntos y 4 tareas, todos de ejemplo (`tools/panel-datos-prueba.mjs --sembrar`; las tareas, desde el panel con sesión, porque la base exige una sesión para registrarlas). Los inmuebles nuevos quedaron **sin publicar**: la base exige la captación completa para publicar y esa regla no se saltó. Las tareas quedaron ligadas a su persona, no a un asunto (la base no aceptó colgarlas de esos asuntos).
- **Borrado de lo anterior (falta):** `tools/panel-datos-prueba-borrar.sql`, en el editor SQL de Supabase, borra solo lo creado antes de las 07:49 UTC del 16/11 y deja intacto lo nuevo. Lo tiene que correr el titular: el conector del agente es de solo lectura y el rol de servidor no tiene permiso sobre todas las tablas. Respaldo previo en `tmp/datos-prueba-anteriores-2026-11-16T07-45-29-302Z.json`. Mientras no se corra, el panel muestra lo viejo y lo nuevo juntos, y el sitio sigue mostrando los 3 inmuebles de prueba anteriores.

## Inicio (15/11/2026) — borrador aceptado por el titular

- **Bloques:** Atender primero (vencido, solicitudes del sitio sin responder, hoy), Agenda de hoy, Asuntos en curso y Nuevo. Se quitaron «Próximos 7 días» (queda en Semana) y el riel de 10 etapas.
- **Asuntos en curso** (15/11/2026; reemplaza las 4 fases): Activos, En espera y Sin siguiente paso, este último en ámbar. Las fases fijas obligaban a un método y se retiran.
- **Orden de urgencia:** vencido (lo más antiguo primero) → solicitudes → hoy por hora → mañana.
- **Mucho trabajo:** 5 filas como máximo, total en el título, «Ver los N restantes» y una línea «N vencidos · Revisar».
- **Muchas citas:** solo lo que falta del día; las terminadas se pliegan; aviso si dos citas se cruzan.
- **Nada pendiente:** cada bloque queda en una línea con lo que sigue («Mañana: 2 citas y 3 tareas», «Agendar visita»).
- **Sin «Vence pronto» ni «Te deben»** (titular, 16/11/2026): no están en el boceto y se quitan de Hoy. Los vencimientos (esperas de trámites, cobros, fechas clave de los asuntos) entran en «Atender primero» y en la agenda; lo que se debe se ve en Dinero.

## Personas (15/11/2026) — en boceto

- **Compradores y arrendatarios son clientes de Fortius** (decisión del titular, 14/11/2026, reemplaza RP-93). Una persona puede tener varios papeles a la vez: Vende, Compra, Renta (busca), Pone en renta, Aliado.
- **Mínimo para crear una persona:** nombre, teléfono, motivo, canal preferido y en qué quedaron (decisión del titular, 14/11/2026). Todo lo demás se completa después.
- **Funciones que entran:**
  1. encontrar a alguien al instante, por nombre, teléfono o inmueble;
  2. saber a quién contactar: cada persona tiene un siguiente paso con fecha, y quien no lo tiene aparece como «Sin seguimiento»;
  3. contactar en un toque (Llamar, WhatsApp, Correo) por el canal que prefiere;
  4. ver qué busca u ofrece y sus coincidencias con el inventario;
  5. historial de llamadas, visitas y notas, con registro rápido del resultado de una llamada;
  6. documentos con su estado;
  7. preferencias: canal y mejor horario para contactarle (cualquier hora, mañana, tarde o noche), e interruptor para avisarle de inmuebles nuevos que coincidan. «Pidió no ser contactado» se usa poco y va en el menú ⋯; cuando está activo, el perfil lo avisa y apaga los botones de contacto (corrección del titular, 15/11/2026);
  8. datos completos en una pestaña «Datos» (en escritorio, columna fija a la derecha), en tres grupos (pedido del titular, 15/11/2026):
     - **Contacto:** teléfono, WhatsApp (si es otro número), correo, canal preferido y mejor horario;
     - **Para contratos:** nombre completo como en su identificación, estado civil, régimen matrimonial y cónyuge cuando está casado, CURP, RFC, identificación con vigencia y domicilio. Para una persona moral: razón social, RFC de 12 caracteres, representante legal y domicilio fiscal. El grupo dice cuántos datos faltan y cuáles, sin frenar nada; con sociedad conyugal avisa que el cónyuge también firma al vender o rentar;
     - **Privacidad:** aviso de privacidad con su estado y fecha, y «Llegó por». Si no se le ha dado, lo dice en ámbar y ofrece «Enviar por WhatsApp» o «Ya lo firmó».
  - Ningún dato vacío se oculta: dice «Sin dato» o «Sin indicar» y tiene «Agregar». Cualquier dato se toca para cambiarlo; los de lista (estado civil, horario, canal) se eligen de opciones.
  - CURP y RFC se muestran ocultos, con «Mostrar» y «Copiar», y la caja cuenta los caracteres mientras se escriben;
  9. aviso de duplicado al escribir un teléfono que ya existe.
- **Funciones que quedan fuera:** puntaje del prospecto, cumpleaños, redes sociales, formularios largos y riel de etapas.
- **«Lo que sigue» lo pone el asesor** (corrección del titular, 15/11/2026; reemplaza la versión del mismo día que lo sacaba del método). La app es flexible y no obliga a seguir una metodología:
  - el siguiente paso es siempre lo que el asesor acordó o anotó («Pasar a ver la casa», «Llamarle el lunes»), con su fecha, y se marca «Hecho»;
  - puede llevar como referencia el inmueble o asunto con el que tiene que ver («Casa en Playas de Tijuana»), sin etapa ni paso del método;
  - la app no genera pasos del método ni los pone como pendientes. La metodología, si se usa, vive en las Guías, que sugieren y no mandan;
  - la opinión de valor nunca aparece como tarea suelta;
  - «Posponer» cambia la fecha y conserva la referencia.
  - Mismo criterio en Inicio.
- **El responsable solo lo ve el director** (decisión del titular, 15/11/2026; reemplaza la versión de solo lectura del mismo día). El asesor solo ve a sus personas, así que el dato no le sirve y no aparece en su perfil. El sistema asigna el responsable a quien captó; una solicitud del sitio queda «Sin asignar» hasta que el director la asigne. Solo el director lo ve y lo cambia, desde su vista. Coincide con SPEC.md: editan el asesor que captó y el director.

## Inmuebles (15/11/2026) — en boceto

- **Funciones que entran:**
  1. encontrar rápido: búsqueda por colonia, calle, propietario o precio. Los filtros no son chips (el titular los rechazó el 15/11/2026):
     - un control segmentado Todos · Venta · Renta, con indicador que se desliza y el conteo de cada opción;
     - un botón «Filtrar y ordenar» (hoja en teléfono, ventana flotante en escritorio) con: en el sitio, solo apartados, solo con avisos, tipo y orden. Los conteos cambian al momento y el botón dice «Ver N inmuebles»;
     - lo filtrado queda escrito en una línea con «Limpiar», y el botón lleva el número de filtros activos;
  2. ver de un vistazo precio, estado en el sitio, días publicado, interesados y avisos;
  3. **compartir en un toque** (WhatsApp, enlace de la ficha o PDF), desde la lista o desde el detalle, porque es lo que más hace el asesor;
  4. interesados: las personas cuya búsqueda coincide, con su estado («Nuevo», «Le enviaste la ficha», «Ya lo visitó») y «Enviar la ficha a los nuevos»;
  5. visitas: agendar con quién, día y hora, y anotar cómo fue;
  6. datos en tres grupos (precio y condiciones, características según el tipo, ubicación), con la comisión visible solo para el asesor y dirección;
  7. propietario ligado a Personas, o «Sin propietario ligado», que se permite;
  8. llaves: dónde están, para no perder visitas;
  9. publicación aparte de guardar: interruptor «Publicado» y «Dirección exacta» (apagado: el sitio muestra solo la colonia);
  10. «Cómo va»: vistas, contactos y visitas desde que se publicó, e informe al propietario con «preparado» y «entregado» por separado (RP-88);
  11. documentos con su estado; faltar uno no detiene nada;
  12. cambiar precio desde el menú, con la diferencia en porcentaje y la opción de avisar a los interesados;
  13. alta mínima: operación, tipo (los 7 de DEC-32), colonia o dirección; precio y propietario si ya se saben. Se guarda sin publicar.
- **Avisos, no bloqueos:** sin precio, sin fotos, sin contrato de intermediación, sin propietario ligado y mucho tiempo publicado con pocos contactos. Al publicar con avisos pendientes, la app los muestra y deja «Publicar así», que queda anotado en el historial.
- **Escritorio:** lista o tarjetas; el detalle se abre en un panel a la derecha sin perder la lista (Esc lo cierra).
- **Funciones que quedan fuera:** riel de etapas, gráficas decorativas, valuación automática, puntajes y pasos impuestos por el método.

## Asuntos (15/11/2026) — en boceto

- **Qué es un asunto:** la unidad de trabajo, con folio. Puede ser una venta, una renta, una búsqueda, la revisión de un inmueble, un trámite u otro. Nace solo con un título. Personas e inmuebles son opcionales y pueden ser varios; cada persona lleva su papel (Vende, Compra, Pone en renta, Renta, Aliado, Notaría, Banco, Abogado u Otro).
- **Flexible:** no hay fases ni riel obligatorios. El estado lo pone el asesor:
  - **Activo**;
  - **En espera**, con lo que espera y cuándo volver a preguntar, que se anota solo en «Lo que sigue»;
  - **Cerrado**, como «Se logró» o «No se dio» con motivo opcional. Se puede reabrir, y las personas siguen siendo clientes.
- **Funciones que entran:**
  1. lista con Activos · En espera · Cerrados y «Filtrar y ordenar»:
     - filtros por tipo, «Solo con avisos» y «Sin siguiente paso»;
     - orden por lo que sigue más pronto, por movidos hace poco o por mayor comisión;
  2. cada tarjeta muestra título, lo que sigue y una línea con la persona, el inmueble y el tipo; el folio solo aparece dentro del asunto. Un asunto sin siguiente paso lo dice en su propia tarjeta, sin aviso general arriba;
  3. «Lo que sigue» del asesor, con Hecho y Posponer. Para cambiarlo se toca el texto y se edita en el mismo bloque; si no hay, el bloque ya es el campo para escribirlo;
  4. avisos plegados en una línea ámbar («2 avisos» y el primero), que se abre al tocarla; cada uno con su acción («Crear documento», «Agregar al cónyuge», «Pedir revisión») y «Seguir así», que queda en el historial;
  5. guías opcionales, una o varias:
     - cada paso se marca Hecho, «Lo hizo otro», «No aplica» o Pendiente;
     - un paso puede convertirse en «Lo que sigue» si el asesor lo decide;
     - quitar una guía no borra nada. Cancelación de hipoteca es la misma guía que Trámites;
  6. dinero: valor, comisión, parte que se comparte con un aliado y lo que queda para Fortius, calculado como referencia;
  7. fechas clave (firma, vencimientos de contrato, apartado o precalificación), que llegan a Hoy;
  8. documentos recibidos y hechos en Fortius, en una sola lista. «Crear documento» sugiere primero los del tipo de asunto y abre el formato en su ventana con los datos llenos;
  9. notas e historial juntos;
  10. el tipo se cambia en cualquier momento; solo ordena y sugiere documentos.
- **No es un tipo de asunto la opinión de valor:** sigue saliendo del método (entrevista, levantamiento, checklist y dictamen) y no tiene botón propio.
- **Arriba del asunto:** título; un solo botón «Tipo · Estado» que abre la hoja para cambiar ambos; y la barra de contacto con la persona principal (Llamar, WhatsApp y «+N» para ver a los demás). Las notarías, bancos y abogados no se eligen como contacto principal.
- **Gestos y atajos:** en el teléfono, deslizar una tarjeta a la derecha marca hecho lo que sigue (o abre «Anotar» si no hay) y a la izquierda lo pospone, con Deshacer; mantener presionado un paso de guía abre sus opciones. En escritorio, J y K mueven entre asuntos, E marca hecho, P pospone, N crea y / busca; la lista lo recuerda abajo.
- **Teléfono:** tres pestañas (Resumen, Guías y Documentos). Notas e historial van al final de Resumen como «Actividad».
- **Escritorio (elegido el 15/11/2026 entre tres alternativas):** tabla y panel. La lista es una tabla de todo el ancho con asunto, lo que sigue, personas y lo que queda para Fortius. Al abrir un asunto se desliza encima un panel de 680 px con el folio, «3 de 5», anterior y siguiente, ⋯ y cerrar. Dentro: título, «Tipo · Estado», contacto, lo que sigue, avisos, una franja con personas, inmueble, dinero y fecha, y las pestañas Guías, Documentos, Actividad y Datos. Esc, la X o un clic en la tabla lo cierran. Se descartaron dos columnas (lista y asunto, con los datos en una pestaña) y la página completa del asunto.
- **Nuevo asunto:** solo el título es obligatorio; el tipo se elige en una lista. Sin asuntos, la lista invita a crear el primero con un ejemplo.
- **Funciones que quedan fuera:** fases fijas, riel de etapas obligatorio, tablero tipo kanban, probabilidad de cierre y gráficas.

- **Construido el 16/11/2026 (antes de PN-02):** la ficha del asunto tiene las pestañas Resumen, Documentos y Actividad (Guías llega con PN-07). El estado se cambia en un desplegable: «En espera» pide qué espera y lo muestra arriba; «No se dio» pide el motivo de la lista fija del servidor (COR-14) más un detalle; «Reabrir» lo vuelve activo. Un asunto que llegó al cierre por su etapa solo lo dice. Documentos usa la lista de 7 del expediente con Falta, Recibido o No aplica, y cuenta los recibidos sin contar los que no aplican. Actividad junta las notas internas y los cambios que registra la base. Todo pasa por las rutas existentes; si el servidor frena un cambio, se muestra su motivo tal cual.
- **Ajustes de AUD-05 (16/11/2026):** la ficha ya no muestra «Dónde va» (era la etapa fija que el boceto quitó). **«Se logró» todavía no se ofrece:** la base solo deja avanzar una etapa a la vez («Avanza una etapa a la vez») y el estado del flujo no tiene un valor de éxito, así que cerrar como logrado necesita un cambio en el servidor (migración con el valor «Se logró» o una ruta de cierre). Queda para PN-02 con aviso al titular; mientras, un asunto que llega al cierre por su etapa dice «Este asunto terminó».
- **Panel en grande y fichas encima (titular, 16/11/2026):** en escritorio ancho, los tres puntos junto a la X del panel lateral ofrecen «Abrir en grande»: el mismo contenido en una ventana centrada de hasta 1100 px y casi toda la altura, con el fondo atenuado; ahí la opción dice «Volver al lateral». Esc, la X o pulsar el fondo cierran. El navegador recuerda la elección (preferencia de interfaz). Vale para Asuntos, Personas e Inmuebles (está en `HojaAdaptable`); en tableta y teléfono no se ofrece. En la ficha del asunto, «Persona» e «Inmueble» son vínculos: abren encima, sin salir del asunto, la misma ficha que en su pantalla (`DetallePersona`, `DetalleInmueble`), editable, con «Volver al asunto» arriba. Esc regresa al asunto y el foco vuelve al vínculo. Al cambiar de asunto, la ficha de encima se cierra. «Abrir a …» y «Abrir el inmueble» se quedan para ir a la pantalla completa. **Decidido por el agente:** con dos fichas abiertas en grande, solo la primera atenúa el fondo.

## Bandeja (15/11/2026) — en boceto

- **Qué es:** la mesa de recepción de archivos. El asesor sube de golpe lo que trae (documentos, imágenes, videos) y la Bandeja lee cada uno y recomienda a dónde va: con una persona o un inmueble que ya existe, en un asunto, o crear una persona o un asunto nuevo. La primera versión (notas, llamadas y mensajes) se descartó por poco útil en el día a día.
- **Subir:** zona para soltar varios archivos (escritorio) o «Subir archivos» y «Foto o video» (teléfono). Cada uno pasa por subiendo, leyendo y por confirmar.
- **Cada archivo dice:** qué es (INE, escritura, avalúo, fotos…), los datos leídos, dónde va y por qué (por ejemplo, «su nombre ya está en Personas» o «la clave catastral ya está en ese asunto»). Los datos leídos salen marcados «Por confirmar»; la CURP y el RFC salen ocultos. No se usan las palabras «propuesto» ni «IA» en pantalla.
- **Confirmar:** un toque guarda el archivo donde se recomienda. «Cambiar» deja elegir otro asunto, persona o inmueble, o crear uno nuevo. Todo tiene Deshacer.
- **Confirmación en lote:** «Confirmar N con coincidencia clara» abre una hoja con cada archivo y su destino, y ahí se guarda el lote. Crear una persona nueva y lo que no se pudo leer siempre se revisan a mano.
- **Teléfono:** la zona de subir se encoge a una fila cuando ya hay archivos, para que la cola quede a la vista. La pestaña y el título cuentan lo mismo (los que ya se pueden confirmar) y dicen cuántos siguen en proceso.
- **Fotos y videos:** se juntan por ubicación y van al inmueble (fotos, recorrido). Los archivos de un mismo trámite se reconocen entre sí (frente y reverso de la INE).
- **Vistas:** Por confirmar y Guardados; cada archivo guardado dice dónde quedó y se puede regresar.
- **Teléfono:** tarjetas con Confirmar y Cambiar; la barra del menú cuenta lo que está por confirmar. **Escritorio:** cola a la izquierda y archivo con vista previa, datos leídos y bloque de recomendación a la derecha; J y K para moverse, C confirmar, G cambiar, U subir.
- **En el menú:** Bandeja va después de Hoy y Agenda al final. En la barra del teléfono van seis: Hoy, Bandeja, Personas, Inmuebles, Asuntos y Más. Más abre una lista con Agenda, Formatos, Trámites, Herramientas y Configuración (Agenda, Formatos y Trámites tienen boceto).
- **Pendiente de decidir:** qué lee la app de cada tipo de archivo y desde cuándo se activa la lectura; hoy es solo boceto con datos de ejemplo.

## Agenda (15/11/2026) — en boceto

- **Qué es:** lo agendado de los próximos 7 días: visitas, firmas o citas, llamadas, levantamientos y los vencimientos de los asuntos (apartado, entrega, precalificación, contrato). Hoy lleva «Ver agenda» en su bloque de agenda.
- **Teléfono:** una tira de 7 días con un punto en los días con citas; vista de Día (línea de tiempo con la hora de ahora) o Lista; botón «+». Agenda no va en la barra inferior: se abre desde Hoy.
- **Escritorio:** la semana en columnas desde hoy, o Lista; la cita abierta se muestra en un panel a la derecha, sin perder la semana. Atajos: N nueva cita, ← y → cambian de semana, T hoy, 1 y 2 la vista.
- **Después de una cita:** si ya pasó y no se anotó, sale «¿Cómo te fue?». Se anota qué pasó y, si el asesor quiere, lo que sigue; queda en el historial del asunto. «No llegó» también se anota. Lo que sigue lo escribe siempre el asesor.
- **Cada cita:** con quién (llamar o avisar por WhatsApp que va en camino), dónde (cómo llegar) y su asunto. Se puede mover (día y hora de 30 en 30 minutos) o cancelar, con Deshacer.
- **Nada frena, solo avisa:** si dos citas se empalman, lo dice, y se agenda igual.
- **Nueva cita en una línea:** «Visita con Ana G. mañana 4pm en Otay» separa tipo, día, hora, persona y lugar antes de agendar.
- **Teléfono:** la línea de tiempo arranca una hora antes de la primera cita del día. «Ya pasó» es una sola fila con «¿Cómo te fue?»; «No llegó» está dentro de esa hoja.
- **Pendiente:** conexión con el calendario del teléfono y avisos antes de la cita (PWA-03).

## Filtros de Hoy y Personas (15/11/2026)

- Se cambiaron los chips por el mismo componente de Inmuebles: un segmento arriba con contadores y el botón de ajustes «Filtrar y ordenar» (ventana flotante en escritorio, hoja desde abajo en el teléfono), con resumen de lo filtrado y «Limpiar».
- **Hoy:** segmento Todo · Vencido · Hoy; en el botón, «Solo solicitudes del sitio» y orden. Las solicitudes del sitio sin responder salen siempre en una línea ámbar sobre la lista («2 solicitudes del sitio sin responder · Verlas»), porque se atienden primero.
- **Personas:** segmento Todas · Propietarios · Sin contacto; el botón va junto a la búsqueda y tiene los demás roles (compran, rentan, aliados) y el orden (por siguiente paso, por nombre o más tiempo sin contacto).
- **Medidas en el teléfono:** los controles tienen 44 px de alto y el texto de las pantallas nuevas no baja de 13 px.

## Formatos (15/11/2026) — en boceto

- **Qué es:** el catálogo de los formatos del panel (01 a 24, sin 03) con su captura sobre el documento en vivo. Se abre desde Más en el teléfono y desde el menú lateral, debajo de Agenda, en escritorio.
- **Catálogo por lo que quieres hacer**, sin fases fijas: conocer al cliente y al inmueble (01, 02, 04), revisar y opinar (05 a 08), intermediar y vender (09 a 15), rentar (20 a 23) y entregar y cerrar (16 a 19 y 24). Cada formato lleva su número, una línea de qué es y, si aplica, el aviso «Falta revisión del abogado» (20, 21 y 24). Se busca por número o por nombre.
- **Empezar uno:** se elige el asunto (los de la operación que corresponde salen primero) y se abre el documento. El folio y los datos del asunto se llenan solos y no se capturan. El 04 pregunta antes el tipo: terreno, casa, departamento, oficina, local, nave o plaza.
- **Captura sobre el documento:** el documento se ve como saldrá en PDF y cada espacio se llena tocándolo; lo escrito aparece al momento en la hoja. En el teléfono es una pantalla completa con el avance arriba; en escritorio, una ventana con la hoja a la izquierda y, a la derecha, el avance, el campo que se edita y lo que falta.
- **Nada frena, solo avisa:** «Faltan N datos» lleva a cada espacio vacío, y «Generar PDF con N pendientes» siempre funciona, con Deshacer.
- **Borradores y Emitidos:** lo que se empieza queda en Borradores con su avance; cada PDF generado pasa a Emitidos, donde se descarga y se puede subir la copia firmada fuera del sistema.
- **En el boceto** solo el 02, el 13 y el 18 se llenan, con campos de ejemplo (los reales siguen la plantilla del titular; el 02 sigue la entrevista sencilla aprobada el 17/10/2026). Los demás abren la hoja con su título y folio.
- **Pendiente:** el 03 no existe; las plantillas reales de cada formato; la revisión del abogado de 20, 21 y 24.
- **Construido el 16/11/2026 (primer corte):** catálogo, Borradores, Emitidos y la ventana de captura sobre la hoja real (la misma que sale en PDF). Decisiones del agente: la ventana ocupa toda la pantalla y deja inerte el menú de atrás (los avisos con Deshacer siguen a la mano); las fechas de un documento usan el campo de fecha del navegador y no el calendario del panel, porque el calendario no deja elegir días pasados y un documento los necesita (nacimiento, cita ya hecha); la hoja es papel claro también en tema oscuro, como saldrá impresa. Generar un PDF no tiene Deshacer: la emisión queda en el historial del servidor y no se borra. Las tablas con filas y las imágenes todavía no se llenan desde aquí; la ventana lo dice al tocarlas.

## Trámites (15/11/2026) — en boceto, rehecho

- **Alcance:** los trámites que no son venta, renta ni inversión: cancelación de hipoteca, cambio de nombre de servicios, avalúos, regularización (prescripción, titulación y similares), Catastro y Registro Público. Se abre desde Más en el teléfono y desde el menú lateral, debajo de Formatos. Un trámite es un asunto de tipo «Trámite»; esta pantalla es su vista especializada, no una lista aparte.
- **Rehecho para que sea útil y nada más (titular, 15/11/2026):** sin tarjetas, barras de progreso, bloque azul grande ni columna de datos. Es una lista y un checklist.
- **Lista, por lo que toca:** filas con un punto de color y una línea de estado. Hoy (toca preguntar, con «Anotar respuesta» en la fila), Esperando (con los días que faltan) y En curso; los listos, al final, en un enlace. El botón de filtro es por tipo de trámite y por dónde está (Registro Público, Catastro, CFE, notaría, perito…). El «+» abre el catálogo por tipo y se liga a un inmueble, a una persona o a ninguno; «Trámite libre» no trae pasos.
- **Detalle, un solo checklist:** todos los pasos en una lista; se toca uno para ver qué hacer. El actual trae sus pendientes, «Cerrar el paso» (se activa al completarlos, con Deshacer) y «Poner en espera». Si hay espera, una línea arriba dice a quién y cuándo volver a preguntar. Los trámites de varias partes (cambio de nombre de servicios) usan la misma lista: cada parte se marca solicitada y lista, con su lista de qué llevar; se pueden agregar partes. Una sola idea para ruta y partes.
- **Debajo del checklist:** Documentos (lista con visor), Notas (con lo que pasa solo) y Datos (tareas, datos del crédito y pagos). «Avance al propietario» arma el mensaje con interruptores de qué incluir; el envío lo hace el asesor y queda registrado.
- **Se conserva lo aprobado de la cancelación de hipoteca** (TRA-01): 8 pasos según el acreedor, evidencia por paso, espera y tarea de volver a preguntar.
- **Pasos por confirmar:** salvo la hipoteca, los pasos de las demás guías son de ejemplo y salen marcados «Por confirmar con la fuente oficial»; faltan su fuente y la revisión del abogado.
- **Escritorio:** lista a la izquierda y trámite a la derecha, sin más columnas. Atajos: J y K, N, T y R.
- **Pendiente:** confirmar si «avalúo» es siempre el que se pide a un perito externo; mostrar en Hoy y en la Agenda las esperas que vencen; el freno de la firma de la venta con hipoteca todavía no se ve en el boceto de Asuntos.

## Notas internas (15/11/2026) — en boceto

- **Dónde:** pestaña «Notas» en cada asunto (teléfono y escritorio) y en cada trámite. En el asunto va junto a Guías, Documentos y Actividad.
- **Qué son:** lo que el equipo debe saber y no sale al cliente. Un aviso fijo lo dice: «Solo las ve el equipo. Nunca salen en lo que se envía al cliente». Nada de lo escrito aquí entra en un mensaje, un formato ni el avance al propietario.
- **Cómo se escribe:** una caja arriba y «Guardar nota». Cada nota queda con quién la escribió y cuándo; las más nuevas, primero. Sin editar ni borrar en el boceto; falta decidir si se podrá corregir.
- **En trámites** las notas van separadas del «Historial», que es lo que hace el sistema solo (pasos cerrados, esperas, respuestas).
- **Pendiente:** permisos (¿quién ve las notas de un asunto ajeno?) y si una nota puede mencionar a alguien del equipo (@) para avisarle.

## Calendario y hora (15/11/2026)

- **Titular:** las píldoras de «Hoy · Mañana · En 3 días» se vieron baratas; se sustituyen por un selector de fecha y de horario.
- **Fecha:** calendario del mes, con flechas de mes. Lunes primero, hoy marcado con un aro, los días pasados apagados. Arriba, la fecha elegida con letra («Viernes 20 nov»).
- **Hora:** solo si la tarea va a la agenda. Una casilla «Añadir a la agenda con hora» abre un selector con flechas de 30 minutos, de 7:00 a 20:00.
- **Dónde se usa:** «Nueva tarea», «Poner en espera» («Vuelves a preguntar el») y «Anotar respuesta» con espera. El resto de las opciones de dos o tres valores usan un control segmentado, no píldoras sueltas.
- **Pendiente:** si el selector se vuelve un componente común para Agenda y Asuntos; zona horaria y recordatorios.

## Equipo (15/11/2026) — en boceto

- **Qué es:** un chat de trabajo dentro del panel, al estilo Slack, con temas marcados con # (#general, #ventas, #tramites, #captacion, #juridico). Reúne lo que hoy se pierde en WhatsApp.
- **Dónde:** en Más, en el teléfono (con el número de mensajes sin leer), y en el menú lateral, en escritorio.
- **Lista:** Temas y Mensajes directos. Un tema con mensajes nuevos va en negrita y con un número rojo. Los directos muestran quién está en línea con un punto verde.
- **Conversación:** sin burbujas. Avatar, nombre y hora; los mensajes seguidos de la misma persona se agrupan. Separadores «Ayer» y «Hoy» y una línea «Nuevos» donde empieza lo que no has leído.
- **Escribir:** una caja con Enter para enviar. La @ abre la lista de personas y las menciones salen resaltadas. El clip liga el mensaje a un asunto, trámite o inmueble: queda una tarjeta pequeña que se abre de un toque.
- **Temas nuevos:** el «+» pide nombre (se muestra cómo quedará, #avaluos) y, opcional, para qué sirve. No se repiten nombres.
- **Escritorio:** temas y personas en 300 px a la izquierda, la conversación al centro. Atajos: J y K, N y Esc.
- **Son datos de ejemplo:** mensajes y personas inventados, marcados así en pantalla.
- **Pendiente:** hilos de respuesta; adjuntar archivos; avisos (¿llegan al teléfono o solo al panel?); quién puede crear o archivar temas; si los temas pueden ser privados; si la abogada externa entra al equipo.

## Herramientas (15/11/2026) — en boceto

- **Qué es:** cuentas rápidas para usar con un cliente. Se abre desde Más y, en escritorio, desde el menú lateral.
- **Crédito hipotecario:** precio, enganche (10, 20, 30 o 40 %), plazo (10 a 25 años) y tasa. Dice mensualidad, enganche, crédito e intereses en total. Es una cuenta de referencia: no incluye seguros ni comisiones del banco.
- **Comisión:** precio y porcentaje (3 a 6 %). Dice comisión, IVA (16 %) y lo que le queda al propietario.
- **Costos de cierre:** aparece como «Pronto». No se inventan porcentajes en el boceto; se conecta con la hoja de costos de cierre de Baja California cuando se defina su fuente.
- **Pendiente:** si la comisión se calcula sobre el precio de venta o de otro modo; si el resultado se puede mandar al cliente o solo se copia.

## Configuración (15/11/2026) — construida el 16/11/2026

- **Alcance corto:** solo lo que se cambia de verdad: perfil (nombre y teléfono), avisos (cuatro interruptores) y equipo (quién tiene acceso, quitar e invitar), más cerrar sesión.
- **Invitar:** pide un correo y prepara la invitación. En el boceto no se envía nada.
- **Escritorio:** una columna centrada. Se llega por «Configuración» al pie del menú.
- **Pendiente:** roles y permisos por persona (quién ve las notas, quién cierra pasos); aviso por correo o por teléfono; tema oscuro cuando se apruebe el claro.
- **Construido (16/11/2026):** `/panel/configuracion` con perfil, apariencia, avisos, equipo y sesión, en ese orden.
  - **Perfil:** nombre y teléfono de tu ficha de asesor. Las iniciales siguen al nombre; el cargo y el perfil público no se tocan. Guardar avisa con Deshacer; si alguien guardó antes, se recarga lo más reciente y se pide revisar. El correo es el de la cuenta y no se cambia aquí; la foto es la del perfil público. Si la cuenta no tiene ficha (dirección), se dice y no hay nada que editar.
  - **Apariencia:** desplegable Automático, Claro y Oscuro (regla de los desplegables). Se recuerda en el navegador y cambia el panel al instante.
  - **Avisos:** cuatro interruptores: consultas nuevas, citas próximas, vencimientos y «te asignan algo». Por ahora se recuerdan en el navegador; por correo o al teléfono, pronto.
  - **Equipo:** solo lo ve el director y es de solo lectura. Cada asesor muestra su cuenta y su papel (Director o Asesor), o «Sin cuenta para entrar»; las cuentas sin ficha de asesor van aparte. Al pulsar un asesor se abre su ficha. «Invitar a alguien» está deshabilitado con la nota «llega pronto»: no se envía nada (PN-10).
  - **Sesión:** cerrar sesión, también aquí además del menú de la cuenta.
  - **Sin construir todavía:** reordenar el equipo arrastrando (solo presentación) y cambiar la foto desde aquí.

## Dinero (15/11/2026) — en boceto

- **Para qué sirve:** responder dos preguntas: qué me deben y qué dinero ajeno tengo en resguardo. Nada de gráficas ni reportes.
- **Dónde:** en Más (teléfono) y en el menú lateral (escritorio). Cada movimiento nombra su asunto.
- **Tres pestañas:** Te deben (comisiones por cobrar y gastos que Fortius pagó y debe reembolsar el propietario), Por entregar (apartados en resguardo) e Historial. Arriba, la cifra grande de la pestaña y una línea de contexto.
- **Te deben**, agrupado en Vencido, Esta semana y Después. Cada fila: asunto, qué es, cuándo vence y el monto que falta (con «de $X» si hubo un cobro parcial).
- **Detalle:** lo que falta, total, ya cobrado, vencimiento y la nota. En teléfono es una hoja; en escritorio, el panel de la derecha.
- **Registrar cobro:** monto (por omisión, lo que falta), forma de pago (transferencia, efectivo o cheque). Se permite cobro parcial; nunca más de lo que falta. Con Deshacer por 5 segundos.
- **Registrar entrega:** al entregar un apartado al propietario sale de la lista y queda en el historial.
- **Movimiento nuevo:** tipo, asunto, monto, concepto opcional y, salvo en apartados, vencimiento (sin fecha, 7 o 30 días).
- **Atajos en escritorio:** J y K, P (cobro), N (nuevo), Esc.
- **Son cifras de ejemplo**, y así lo dice la pantalla.
- **Pendiente:** quién ve el dinero (¿cada asesor solo sus comisiones o todo el equipo?); cómo se reparte una comisión entre asesores o con un co-broker; facturas (CFDI) ligadas al cobro; aviso en Hoy y en Agenda de los cobros que vencen; recibos desde Formatos.
- **Apartados:** se registran con comprobante y quedan en «Por entregar» hasta entregarse al propietario (DEC-56, confirmado por el titular el 16/11/2026).

## Consultas (15/11/2026) — en boceto

- **Para qué sirve:** que nadie que escribió se quede sin respuesta. Son personas, no archivos: la Bandeja recibe documentos y fotos; Consultas recibe a quien pregunta por el sitio, por WhatsApp, por llamada o en persona.
- **Dónde:** en Más (con el número por atender) y, en escritorio, en el menú lateral, justo debajo de la Bandeja.
- **Tres pestañas con su número:** Por atender, En seguimiento y Cerradas. En Por atender, la que lleva más tiempo esperando va primero; pasada una hora se pone en ámbar y pasadas dos, en rojo.
- **Cada consulta:** el mensaje tal como llegó, el inmueble que le interesa, el teléfono y el correo si los dio.
- **Respuesta lista para enviar:** un texto armado con el nombre y el inmueble, con Copiar, WhatsApp y Llamar. El asesor lo envía; el panel no manda nada solo.
- **Si ya está en Personas:** por el teléfono se avisa y se ofrece «Unir con su ficha», para no duplicar personas.
- **Atender yo:** la consulta pasa a En seguimiento a nombre de quien la toma. Después, «Crear persona y asunto» arma ambos ya ligados, con el inmueble de interés.
- **Cerrar:** «No es cliente» (spam, equivocados) o cerrar sin operación; se puede reabrir. Todo trae Deshacer.
- **Anotar una consulta (+):** para llamadas y visitas en persona. Queda en seguimiento a nombre de quien la anota.
- **Atajos en escritorio:** J y K, A (atender), N (anotar), Esc.
- **Son datos de ejemplo**, con nombres y teléfonos ficticios, y así lo dice la pantalla.
- **Pendiente:** quién recibe las nuevas (¿todas al grupo o se reparten por turno o por zona?); cuánto es «tarde» para responder; enviar la respuesta desde el panel cuando haya WhatsApp Business conectado; cómo llegan las del sitio (formulario) y su aviso de consentimiento de datos personales; si una consulta sin respuesta pasa a la Agenda como pendiente.

## Panel real: cómo pasa de boceto a código (16/11/2026)

- **Los bocetos mandan** sobre lo construido en `/admin`. El panel nuevo se construye aparte, en `/panel`, y el viejo desaparece al final (PLAN.md, etapas PN-00 a PN-12; inventario y aislamiento en `LEGADO.md`).
- **Director primero, asesor después.** Se construye para el administrador o director, que ve todo. Cada asesor solo verá lo suyo; esa etapa (PN-10) viene después, pero desde PN-02 todo registro nace con responsable y con permisos en la base.
- **El chat del equipo va al final** (PN-11).
- **Auditoría de lógica continua.** En cada etapa, un subagente razonador de solo lectura revisa si el flujo es bueno para el trabajo diario y propone agregar, quitar o reordenar pasos. Informes en `auditorias/`. El primero (AUD-01) ya dejó propuestas: el asunto como centro, una sola tabla de pendientes, Consultas con menos pasos y Dinero que nace desde el asunto. Cada una se acepta o se descarta aquí cuando el titular decida.

## Arrastrar y soltar (16/11/2026)

Donde haya algo que ordenar, se ordena arrastrando. Siempre con una alternativa de teclado y un aviso de lo que pasó («Dinero quedó en el lugar 2 de 12»).

- **Menú lateral izquierdo:** arrastrar una sección a otro lugar. Ya funciona en `/panel` (PN-00). El orden se guarda por usuario en el navegador; cuando haya perfil propio (PN-09), pasa al servidor. Teclado: Alt con ↑ y ↓.
- **Guías de un asunto:** reordenar los pasos y mover un paso a otra guía. El orden del negocio se guarda en el servidor con control de versiones (409).
- **Checklist de un trámite:** reordenar los pasos opcionales; los pasos obligatorios de la cancelación de hipoteca conservan su orden y no se arrastran fuera de él.
- **Tareas y pendientes:** arrastrar una tarea a «Hoy», «Esta semana» o a una fecha de la Agenda; arrastrar una cita a otra hora o día.
- **Hoy:** reordenar «Atender primero» a mano; lo que el usuario fija arriba se conserva.
- **Consultas y Bandeja:** arrastrar una consulta a un asesor, o un archivo a una persona, un inmueble o un asunto (el destino que hoy se elige con «Cambiar»).
- **Documentos y fotos de un inmueble o asunto:** reordenar, y arrastrar el archivo de una persona a un asunto para ligarlo.
- **Equipo (chat):** reordenar los temas de la lista; arrastrar un mensaje a otro tema para moverlo.
- **Dinero:** arrastrar un cobro entre «Esta semana» y «Después» cambia su fecha (con Deshacer).
- **Configuración:** reordenar las personas del equipo en la lista de invitaciones solo para presentación; el orden no cambia permisos.
- **Reglas del gesto:** el elemento se ve levantado mientras se arrastra, aparece una línea de acento donde caerá, soltar fuera cancela, y toda acción que cambie datos trae Deshacer por 5 segundos. En el teléfono se arrastra con pulsación larga; además siempre hay un menú «Mover a…». Con movimiento reducido no hay animación de vuelo.
- **Pieza reutilizable:** se construye una sola vez en PN-01 (`src/components/panel/`) y las pantallas la reutilizan.

## Folios, centro del modelo y roles (confirmado por el titular, 16/11/2026)

Resumen para trabajar; el detalle y las razones están en `auditorias/AUD-01-2026-11-16.md` y las reglas, en `SPEC.md` (RP-106 a RP-108). **Confirmado por el titular el 16/11/2026** (propuesta de AUD-01). La migración de PN-02 se avisa antes de aplicarla.

- **¿Cuál es el centro?** El **asunto** es el centro de trabajo (lleva folio, documentos, dinero y lo que sigue); la **persona** es el centro de la relación; el **inmueble** es el inventario. Persona e inmueble se capturan una vez y el asunto las une con papeles.
- **¿Qué lleva folio?** El asunto (`EXP-######`, incluye trámites), el inmueble (`FORTIUS-######`), el formato emitido (`EXP-######·nn·vN`) y el recibo emitido (`REC-AAAA-####`). Personas, consultas, archivos y movimientos llevan solo id interno.
- **¿Cuándo se genera?** Al guardar en la base, nunca al abrir un formulario. Los números no se reutilizan ni se borran. Con el Deshacer de 5 segundos al crear, la escritura se confirma al vencer.
- **¿Qué detona un negocio nuevo (un asunto)?** Un inmueble encargado en venta o renta; una búsqueda real de comprador o arrendatario; un trámite sin venta; un mandato de inversionista; el mismo inmueble que se vuelve a comercializar tras un cierre. **No** lo abren: una consulta, una visita, un archivo, un cambio de precio ni una reapertura.
- **¿Qué pasa si todo empieza en la Bandeja?** Los archivos entran por la Bandeja y las personas por Consultas; de ahí se reparten a una persona, un inmueble o un asunto. Un archivo sin dueño no genera folio.
- **Sigue pendiente (titular):** si los compradores son clientes y su búsqueda es un asunto (cambia RP-93); si Bandeja y Consultas son una entrada o dos; qué frenos de protección se conservan frente a «nada frena, solo avisa».

## Kit de componentes del panel real (PN-01, 16/11/2026)

Está en `src/components/panel/kit/` y se revisa en `/panel/kit` (muestrario, no es una pantalla del negocio). Cada pieza sigue el Sistema de diseño Fortius y cuenta con pruebas en `tests/panel/`.

- **Botón:** primario, secundario, texto y peligro; siempre un botón real de 44 px o más. Deshabilitado con `aria-disabled` (sigue enfocable). Un solo primario por pantalla.
- **Campo:** etiqueta enlazada, ayuda y error con ícono y mensaje anunciado; campo de monto con «$» y comas de millar.
- **Control segmentado:** de dos a cuatro opciones, con número opcional (Te deben 5).
- **Hoja y ventana:** una sola pieza; sube desde abajo en el teléfono y es ventana en escritorio. Esc o toque fuera la cierra, el foco entra, se queda adentro y vuelve a donde estaba.
- **Avisos con Deshacer:** abajo, 5 segundos, hasta tres a la vez. Toda acción que cambia datos avisa con «Deshacer».
- **Listas agrupadas y filas:** línea, no sombra; con fecha o monto a la derecha y tono de error o aviso en el detalle.
- **Estados:** cargando (esqueleto), vacío (invita a actuar), error (dice qué pasó y deja reintentar) y sin permiso. `/panel` ya tiene su pantalla de error y de carga.
- **Fecha y hora:** calendario del mes con lunes primero, hoy con aro y días pasados apagados; hora en pasos de 30 minutos de 7:00 a 20:00.
- **Arrastrar y soltar (RP-102):** una sola pieza para menú, guías, tareas y pendientes. Ratón, teclado (flechas con el asa enfocada) y aviso para lector de pantalla. Un elemento «bloqueado» (paso obligatorio) no tiene asa ni se puede suplantar. El menú lateral ya la usa.
- **Buscar o crear (Ctrl K):** ir a una sección o empezar algo nuevo, sin acentos ni mayúsculas, con flechas y Enter. Cuando haya datos (PN-03 en adelante) también buscará personas, inmuebles y asuntos por nombre, teléfono, folio o clave catastral.
- **Atajos:** `useAtajo`; los de una sola tecla no se disparan mientras alguien escribe.
- **Herramientas (adelantada de PN-09):** cada calculadora es su propia pantalla y su propio componente (titular, 16/11/2026: juntarlas fue un error): `/panel/herramientas` es el índice, `/panel/herramientas/credito` (para el comprador) y `/panel/herramientas/comision` (para el vendedor). Comparten solo la tarjeta de resultado. **Falta decidir** si la comisión se calcula siempre sobre el precio de venta.
- **shadcn/ui y motion (titular, 16/11/2026: acabado premium con todo el stack):** los componentes de shadcn/ui viven en `src/components/panel/ui/` (diálogo, hoja del teléfono con vaul, ventana flotante, globo de ayuda, menú, pestañas, interruptor, casilla, buscador con cmdk, avisos con sonner, separador y esqueleto), escritos a mano sobre Radix y con los tokens Fortius. `src/app/panel/panel-shadcn.css` traduce los nombres de shadcn (`bg-background`, `bg-primary`…) a los tokens del panel solo dentro de `.panel-root`; el sitio público no cambia. En el panel `--accent` es el color de marca, así que el resaltado de filas usa `bg-muted`. El movimiento va con motion: rápido (menos de 300 ms), con propósito y respetando movimiento reducido; nada animado en acciones de teclado frecuentes (Ctrl K abre sin animación). Las piezas del kit se irán pasando a estos componentes pantalla por pantalla.

## Conexiones entre pantallas y ajustes de AUD-03 (16/11/2026)

Aplicado en `nuevo-panel` a partir de la auditoría AUD-03 (`auditorias/AUD-03-2026-11-16.md`). Todo es de lectura; lo que escribe espera a PN-02.

- **Fichas en la dirección.** Cada ficha se abre con su propia dirección (`?ver=` en Personas, Consultas e Inmuebles —el inmueble por su folio—; `?cita=` en Agenda). Se puede compartir, Atrás la cierra y el foco vuelve a la fila.
- **Relacionado.** Al pie de cada ficha, lo que está conectado: de una persona, sus consultas, citas e inmuebles; de una consulta, la persona (ligada o con el mismo teléfono) y el inmueble; de una cita, con quién, el inmueble y la consulta; de un inmueble, sus consultas y citas. Cada fila lleva a su ficha.
- **Menú.** Consultas muestra cuántas esperan respuesta. La cuenta, al pie del menú, abre Configuración y Cerrar sesión. En el teléfono hay barra superior con el logo, las consultas por atender y el buscador (sin menú lateral ni Ctrl K, el buscador vive ahí).
- **Hoy.** Orden: lo vencido, la línea de consultas (dice cuánto lleva la que más espera; roja pasadas dos horas), las citas de hoy (cada una abre su ficha) y lo que vence pronto. Cada bloque carga y falla por su cuenta, con su Reintentar. La licencia estatal se avisa una sola vez por número, con cuántos contratos la usan. Sin doble mensaje de vacío.
- **Agenda.** Flechas para moverse de semana en semana y «Volver a hoy». Si la semana está libre, dice cuándo es la próxima cita y lleva a ella. Cuando hay más de un asesor, cada cita dice de quién es.
- **Consultas.** Buscar busca en las tres pestañas y cada fila dice en cuál está. «En seguimiento» se ordena por la fecha acordada para volver a contactar (lo atrasado en rojo, lo de hoy en ámbar, al final las que no tienen fecha y lo dice). Las cerradas dicen cómo terminaron: «Ya es cliente», «Sin operación» o «No es cliente». La respuesta se puede ajustar antes de enviarla. La lista y el número del menú se actualizan solos al volver a la ventana y cada minuto y medio.
- **Herramientas.** Desde la ficha de un inmueble en venta, «Calcular crédito» y «Calcular comisión» abren la calculadora con «Para: …», el precio ya escrito y Quitar. Si el inmueble no tiene precio publicado o está en dólares, lo dice y deja el precio vacío. «Copiar la cuenta» copia también el inmueble, los supuestos, la fecha y la leyenda. **Falta decidir** si esa cuenta se puede mandar al cliente tal cual (hoy no hay botón para enviarla).
- **Buscar o crear (Ctrl K).** Con dos letras o más encuentra personas, inmuebles y consultas por nombre, teléfono (con o sin espacios), correo, folio o zona, agrupados y hasta cinco por grupo, antes que las secciones; Enter abre la ficha. Los datos se leen solo mientras está abierta. No busca por CURP ni RFC.
- **Consultas viejas aparte.** En «Por atender», lo de las últimas 24 horas va arriba; lo que lleva días va en su propio grupo, plegado con «Revisar» cuando hay consultas recientes, para que el rojo de lo nuevo se distinga. Si no hay canal registrado, no se escribe «Sin canal».
- **Hoy sin citas** dice cuál es la próxima («La próxima: mañana a las 10:00, Visita…») y lleva a ella.
- **Avisos con sonner.** Se pausan al pasar el ratón, se descartan deslizando, salen por el mismo lado, hasta tres a la vista y por encima de la barra del teléfono. Usan Geist.
- **Respuesta al toque.** Botones, filas, la cuenta y el buscador se hunden un poco al presionarlos (140 ms); con movimiento reducido no se mueven.
- **Menú contraído.** Cada ícono muestra su nombre en un globo al pasar el ratón o al enfocarlo (Consultas dice también cuántas esperan) y tiene nombre accesible.
- **Teclado en las listas.** J y K pasan de fila en fila en cualquier lista de la pantalla, Enter abre la fila y «/» lleva a la búsqueda. No actúan con una ventana abierta ni mientras se escribe.
- **Detalle a la derecha en escritorio ancho (1100 px o más).** Personas, Consultas, Inmuebles y Agenda abren la ficha en un panel de 440 px a la derecha que no tapa la lista: la página le deja su lugar, la fila abierta queda marcada y al pulsar otra fila (o J/K y Enter) el panel cambia de contenido sin llenar Atrás. Se cierra con Esc o la X. Entre 641 y 1099 px sigue la ventana centrada; en el teléfono, la hoja desde abajo.
- **Menú «⋯» en las filas** de Personas y Consultas: Llamar, WhatsApp, Copiar teléfono y Copiar enlace a la ficha, sin abrirla. Va fuera del botón de la fila.
- **Filtrar y ordenar** en Personas (por nombre o las más recientes; solo con consultas abiertas) e Inmuebles (por nombre, precio de mayor a menor o de menor a mayor —los «a consulta» al final— o folio; solo los que están en el sitio; ocultar los de ejemplo). Ventana flotante en escritorio y hoja en el teléfono; el botón dice cuántos filtros hay puestos, «Ver N» cierra y «Quitar filtros» vuelve al inicio. Por ahora no se recuerdan al salir de la pantalla. Al ordenar por precio, pesos y dólares se comparan por la cifra.
- **Hoy: la cita que sigue al frente.** La primera cita con hora que todavía no termina va como tarjeta principal (hora grande, «Siguiente · en 25 min», título y tipo) y abre su ficha; las demás, debajo, con «Ver agenda» como enlace en el título del bloque.
- **Sin nombres internos en pantalla.** Las secciones sin construir dicen «Pronto» en vez del nombre de la etapa, y se quitaron las frases repetidas «llega en la siguiente etapa».

## Personas: alta y edición (16/11/2026)

- **Nueva persona** (botón arriba o tecla N): nombre, teléfono, correo opcional, motivo (Vende, Compra, Pone en renta, Busca rentar, Invierte, Otro), por dónde prefiere que le contacten (WhatsApp, Llamada, Correo) y en qué quedaron, con fecha a un clic. Sin fecha queda «Sin seguimiento». Queda a nombre de quien la anota y se abre su ficha.
- **Duplicado:** al escribir un teléfono (se comparan los últimos 10 dígitos) o un correo que ya existe, aparece «Ya está en Personas: …» con «Abrir su ficha». No frena: el botón cambia a «Guardar de todos modos». Unir dos fichas llega cuando se aplique PN-02.
- **Editar datos** (en la ficha): Contacto y Para contratos en un solo formulario; vacío quita el dato; CURP y RFC se guardan en mayúsculas y cuentan caracteres (18; 13 o 12 si es empresa), sin frenar. Guardar avisa con Deshacer.
- **La ficha** empieza con «Lo que sigue» (qué y cuándo) o «Sin seguimiento», y en Contacto dice por dónde prefiere que le contacten.
- El motivo se guarda en el papel que ya usa el panel viejo (propietario, comprador, arrendador, arrendatario, inversionista, otro); varios papeles a la vez llegan con los asuntos (PN-04).

## Inmuebles: alta y edición (16/11/2026)

- **Nuevo inmueble** (botón arriba o tecla N): lo que se sabe en la primera visita: nombre, tipo (los siete de la lista única), Venta o Renta, precio o renta mensual con moneda (vacío: «Valor a consulta»), zona, referencia (con el aviso de no poner la dirección exacta) y medidas según el tipo (un departamento no pide terreno; un terreno no pide baños ni recámaras).
- **Nace privado:** «En captación · privado», sin publicar y sin fecha de publicación; el folio lo pone la base al guardar y el aviso lo dice («Inmueble guardado con el folio FORTIUS-…»).
- **Editar datos** (en la ficha): lo mismo más el estado, solo con los de su operación (Vendida no aparece en una renta) y, si ya está en el sitio, sin volver a captación. Guardar avisa con Deshacer.
- **Guardar nunca publica** ni toca fotos, textos del sitio, llaves o seguimiento privado; eso va en su propio paso.

## Inmuebles: fotos, textos del sitio y publicar (16/11/2026)

- **Fotos:** «Subir fotos» o soltar varias en la zona punteada. Cada una pasa por la carga segura que ya usa el servidor (ticket firmado, se guarda pública en el inmueble, sin EXIF ni GPS; el servidor decide si quien sube puede). Se ordenan arrastrando o con las flechas en el asa; la primera es la portada. «Describir» pone qué se ve (sale como texto alternativo); «Quitar» la saca de la galería. Una foto privada se marca «Privada: no sale en el sitio». Todo con Deshacer.
- **Textos del sitio:** descripción en texto libre (una línea en blanco separa párrafos) y la ubicación que ve el público (colonia o referencia, nunca la dirección exacta). Si la ubicación se deja vacía, se conserva la anterior.
- **En el sitio:** publicar es un paso propio. Primero se dice lo que impide publicar: estar en captación, no tener foto y lo que exige el servidor (la captación vinculada con sus revisiones y autorización, COR-16). Sin eso, el botón no aparece y la lista dice qué falta. Lo demás son avisos (sin precio, sin descripción, menos de 5 fotos, fotos sin describir, sin propietario ligado, marcado como ejemplo): se muestran una vez y queda «Publicar así». La fecha de publicación es la de la primera vez.
- **Quitar del sitio:** pide confirmación y no ofrece Deshacer, porque volver a publicar pasa otra vez por la revisión del servidor.
- **Choque con el boceto (para el titular):** el boceto dice que nada frena y que publicar con avisos deja «Publicar así». El servidor sigue exigiendo la captación completa antes de publicar (regla COR-16 vigente). No se debilitó; si el titular quiere que sea solo aviso, se cambia en el servidor y se anota en `SPEC.md`.
- **Queda para después:** el interruptor «Dirección exacta» (hoy el sitio solo muestra la referencia), video y recorrido 360 desde el panel nuevo (se siguen cargando en el panel viejo) y anotar «Publicar así» en el historial (llega con el historial de PN-02).

## Inmuebles: propietario y llaves (16/11/2026)

- **Propietario:** en la ficha, «Ligar propietario» busca en Personas por nombre o teléfono; la persona queda con papel de propietario y ligada a ese inmueble (el mismo dato que usa el panel viejo, sin duplicarlo). Se puede quitar. Sin propietario se permite y lo dice. Si no existe, se da de alta en Personas primero.
- **Llaves:** dónde están (En la oficina, Las conserva el propietario, En la caseta o administración, Otro lugar), copias y detalle; «Prestar llaves» anota a quién y cuándo regresan; «Regresaron» lo cierra. Lo vencido sale en ámbar. Quien presta o recibe queda anotado con el nombre de su ficha. Es privado: nunca sale al sitio.

## Inmuebles: compartir (16/11/2026)

- **En la ficha, arriba:** «Compartir por WhatsApp» (botón principal), «Copiar enlace» y «Ficha en PDF». El mensaje lleva título, zona, precio y el enlace del sitio; si es de ejemplo, lo dice.
- **En la fila:** el mismo compartir en el menú ⋯, sin abrir la ficha, más «Copiar enlace para el equipo» (la ficha del panel).
- **Solo se comparte con clientes lo publicado.** Sin publicar o en evaluación, la ficha lo explica y solo ofrece el enlace para el equipo. Compartir no guarda nada; el registro de «Le enviaste la ficha» llega con los interesados.

## Consultas: acciones (16/11/2026)

- **Responder es atender.** Si la consulta sigue por atender, al enviar por WhatsApp o correo, llamar o copiar la respuesta pasa a En seguimiento a nombre de quien lo hizo; el aviso trae Deshacer. «Atender yo» sigue a la vista para quien la toma sin responder todavía.
- **Volver a contactar** se elige con un clic (Mañana, En 3 días, En una semana); el calendario solo aparece con «Otra fecha». Con fecha guardada, el botón dice «Guardado para el …».
- **Cerrar** pide cómo terminó (Sin operación o No es cliente) y, si se quiere, por qué; queda como nota. Una cerrada se reabre con un botón.
- **Anotar consulta** (botón arriba o tecla N): por dónde llegó (Llamada, WhatsApp, En persona, Otro), nombre, teléfono, correo y qué busca. Queda en seguimiento a nombre de quien la anota y se abre su ficha. Una consulta anotada a mano no lleva la respuesta de «gracias por escribir»: solo Llamar y WhatsApp.
- **Guardar** usa la versión que se leyó; si alguien cambió la consulta antes, se avisa y se muestra lo último.

## PN-02: decisiones que faltan del titular (AUD-02, 16/11/2026)

Para aplicar el modelo base faltan seis respuestas. Cada una trae la recomendación del auditor; si el titular no dice otra cosa, se construye con la recomendación y se anota aquí.

1. **¿Los asuntos nuevos (sin cliente, trámites, búsquedas) se ven en el panel viejo?** Recomendación: no; una línea de filtro en la lista del panel viejo (es el único toque a lo viejo).
2. **¿Cuándo reciben folio los trámites que ya existen?** Recomendación: en PN-07, con su pantalla. PN-02 deja la migración escrita y ensayada, sin aplicar.
3. **¿El director puede ser responsable de un asunto?** Recomendación: sí; se le da ficha de asesor y cuenta ligada.
4. **¿Qué pasa con las tareas y eventos del panel viejo?** Recomendación: el panel nuevo los lee de una vista de solo lectura mientras conviven y se copian una sola vez a pendientes al retirar el viejo. Sin doble escritura.
5. **Tipos de asunto y papeles.** Recomendación: tipos venta, renta, búsqueda, trámite, inversión, revisión y otro; papeles los del boceto más copropietario y apoderado.
6. **¿El colaborador de un asunto ve la ficha completa de la persona?** Recomendación: ve nombre y contacto dentro del asunto, pero no la ficha ni sus otros asuntos. Se resuelve en PN-10; el modelo ya lo permite.

**Tomadas con la recomendación (16/11/2026; el titular no indicó otra cosa).** Así quedaron en las migraciones `20261116090000…090600_pn02_*`:

1. Los asuntos nuevos llevan `tipo_asunto`; los del panel viejo lo tienen vacío. El filtro en la lista vieja se pone cuando el panel nuevo cree el primer asunto (PN-04).
2. Los trámites que ya existen reciben folio en PN-07, con su pantalla.
3. El director puede ser responsable: `mi_asesor_id()` le devuelve su ficha de asesor si tiene cuenta ligada.
4. Tareas y eventos del panel viejo: el panel nuevo los sigue leyendo aparte; los pendientes nuevos van a su tabla. Se copian una sola vez al retirar el viejo. Sin doble escritura.
5. Tipos de asunto: venta, renta, búsqueda, trámite, inversión, revisión y otro. Papeles: vende, compra, pone en renta, renta, copropietario, apoderado, aliado, notaría, banco, abogado y otro.
6. El colaborador ve el asunto y lo que cuelga de él; la ficha completa de la persona sigue la regla de su asesor. Se afina en PN-10.

Ajustes del ensayo: borrar un asunto sigue como en el panel viejo (lo que no cambia es el folio, y su número queda reservado en `fortius_inmuebles_folios`); `cliente_id` sigue obligatorio hasta PN-04 porque lo usan los permisos de documentos del panel viejo; un pendiente no se borra, se cancela; solo dirección reasigna.

**Corregido con la auditoría de cierre AUD-04 (16/11/2026), en los mismos siete archivos (nada estaba aplicado):**

- **Un solo responsable.** Quien lleva el asunto es `expedientes.asesor_id`; `asunto_miembros` guarda solo colaboradores (sin «titular»). Reasignar el asunto ya no deja al anterior viendo. El colaborador lee el asunto mismo y ve con quién trabaja; solo dirección arma el equipo.
- **Pendientes.** No se cuelga un pendiente del asunto de otro, ni al crearlo ni al cambiarlo. La persona del pendiente tiene que ser una que el asesor ve o una que forma parte de ese asunto (principal o con papel): así el colaborador anota «Llamar al comprador». Por omisión, el pendiente es una tarea y su responsable es quien la anota.
- **Versión del pendiente:** se guarda filtrando por la versión que se leyó (`.eq('version', v)`) y sin mandar `version`; la base la sube. Mandar otra versión da 409. Se documenta en `src/lib/panel` cuando la pantalla escriba su primer pendiente.
- **Personas del asunto:** para sumar a alguien hay que poder ver su ficha (dirección, a cualquiera).
- **Folios.** Solo cuentan los de 1 a 15 cifras (`EXP-…`, `FORTIUS-…`); los que tienen otro formato se quedan como están y no cuentan (en la base de prueba, 3 de 18 asuntos y 3 de 12 inmuebles, revisado el 16/11). Un folio puesto a mano que ya usó otro asunto se rechaza. El libro de folios solo lo ve dirección.
- **Aplicación segura:** cada archivo corre en una transacción con límite de espera y el candado del repositorio; si choca con otra escritura, falla sin daño y se reintenta.
- **Historial:** su numeración se puede restaurar igual; el respaldo pasó a la versión 6 con las ocho tablas nuevas (39 en total) y el ensayo de restauración las compara una por una.
- **Rendimiento:** las políticas calculan «es director» una vez por consulta.

**Queda para su etapa (AUD-04):** estado y tipo de lo heredado calculados y una marca propia de «panel nuevo» (I6, PN-04); historial automático al cambiar equipo, responsable o unir fichas (I8, PN-04); suma de porcentajes, ciclos de «continúa de» y uniones simultáneas (PN-03 y PN-04); mensaje claro al borrar en `/admin` algo ligado (cuando el panel nuevo escriba); procedimiento de cancelación de datos en historial y notas, que solo se agregan (anotar en el registro de tratamiento antes de usarlas con clientes reales).

**Por decidir del titular (AUD-04):**

- **¿Tu ficha de asesor sale en el sitio público?** Para que el director sea responsable necesita ficha de asesor, y hoy las fichas activas salen en el sitio. Recomendación: agregar «No mostrar en el sitio» a la ficha.
- **¿Qué regla manda para ver un asunto?** El panel nuevo deja verlo a quien lo lleva o colabora; el viejo además exige llevar al cliente. Recomendación: la del panel nuevo (quien lleva el asunto lo ve aunque el cliente sea de otro) y anotarla en `SPEC.md`.

## Decisiones del titular sobre lo construido (16/11/2026)

- **Marca del sitio público (DEC-59):** el Sistema de diseño Fortius también reemplaza la marca del sitio público, pero todavía no se aplica.
- **Bandeja y Consultas (DEC-60):** son dos entradas distintas.
- **Sin frenos (DEC-61):** ningún freno de proceso; lo que antes frenaba, ahora avisa. La seguridad (permisos, quién ve qué, datos privados) no es un freno y se conserva.

Detalle en `SPEC.md`: DEC-53, DEC-54, DEC-56 a DEC-63 (DEC-52 y DEC-55 de esa fecha se renumeraron como DEC-62 y DEC-63 al juntar las ramas).

- **PN-02:** migraciones aprobadas; se publican cuando el titular revise el panel completo.
- **Dinero:**
  - un recibo total salda la cuenta, y la diferencia es descuento;
  - pesos y dólares van por separado, sin convertir;
  - cuenta el último recibo con PDF, con aviso si cambió sin volver a generarlo;
  - la comisión se anota al firmar;
  - «Por entregar» se queda: Fortius a veces guarda apartados, y la promesa 15 se revisa con el abogado.
- **Bandeja:**
  - los archivos sin destino esperan en el servidor (cambio de base y registro de privacidad);
  - una foto que va a un inmueble publicado entra sin mostrarse y se publica desde la ficha.
- **Asuntos:**
  - «Se logró» se marca en un solo paso, con aviso de lo pendiente (cambio en el servidor);
  - las pestañas de la ficha se quedan como excepción a la regla del desplegable.

## Decisiones abiertas

- Iconoir o Lucide.
- Qué ve el director en Hoy y en Personas: lo suyo, lo de su equipo o ambos.
- Tema oscuro: se dibuja cuando se apruebe el claro.
