# Nuevo panel: decisiones de diseño

Qué hace hoy cada pantalla del panel nuevo (`/panel`, rama `nuevo-panel`). Manda sobre lo construido (RP-100 a RP-108 en `SPEC.md`; etapas PN-00 a PN-12 en `PLAN.md`; aislamiento en `LEGADO.md`). Si una sección se contradice con otra, se corrige aquí. La historia, los bocetos superados y las propuestas descartadas están en `historial-de-decisiones.md` (solo consulta).

- **Decisiones del titular del 16/11/2026** en `SPEC.md`: DEC-53, DEC-54, DEC-56 a DEC-63 (DEC-52 y DEC-55 se renumeraron como DEC-62 y DEC-63). El Sistema de diseño Fortius también reemplazará la marca del sitio público, que no cambia hasta que el titular lo pida (DEC-59). Auditorías AUD-01 a AUD-06 en `auditorias/`.
- **Prototipo de estilo aprobado:** https://claude.ai/artifact/GS2SrBsgPRfNDZ5Q2fWnVY
- **Lienzo con los bocetos de cada pantalla:** https://claude.ai/artifact/SmyWKd1xYnkmPVvyTMZGjf (privado)

## Reglas generales

### Principios

1. Cada elemento sirve en la inmobiliaria; si no ayuda a decidir o actuar, se quita o queda a un toque.
2. Primero el teléfono; el escritorio es la misma pantalla con más espacio.
3. Una acción principal por pantalla, en el acento azul; lo demás, secundario o texto.
4. Es una app: interruptores, desplegables, menús, hojas, paneles, diálogos y avisos que responden al toque.
5. Premium es quitar fricción: menos toques, Deshacer en lugar de «¿estás seguro?», la app se adelanta. Sin rachas, puntos, confeti ni gráficas decorativas.
6. **Nada frena, solo avisa (DEC-61).** Ningún freno de proceso; lo que frenaba ahora avisa. La seguridad (permisos, quién ve qué, datos privados) no es un freno y se conserva.
7. Los datos de ejemplo siempre dicen «Datos de ejemplo». El panel nuevo no muestra los datos de prueba del panel viejo; los nuevos se cargaron marcados como ejemplo.
8. Sin cejas, sin mayúsculas tecleadas, sin emoji. Nada en pantalla menciona a la IA («Por confirmar», «Leer datos»). Sin nombres internos: lo no construido dice «Pronto».

### Estilo tipo Apple (RP-104)

- **Letra:** la del sistema en Apple (SF) e Inter en lo demás. Títulos de 34 px en 700; subtítulos de 20 px en 700.
- **Color:** fondo `#F2F2F7` y tarjetas `#FEFEFF`; en oscuro, fondo `#060607` y tarjetas `#1C1C1E`. Acento azul `#0071E3` en claro y `#0A84FF` en oscuro. Vencido y errores en rojo. Sin blanco ni negro puros; se usan los tokens de `src/app/panel/panel-ds.css`.
- **Tema claro y oscuro:** sigue al dispositivo; Configuración › Apariencia lo fija.
- **Esquinas:** 6, 10, 14 y 16 px; botones de 12 px. Avatares y contadores redondos.
- **Tarjetas agrupadas** sin borde ni sombra, separadas por el fondo; dentro, filas con línea fina. Sombras solo en lo que flota.
- **Íconos:** los 28 del Sistema de diseño Fortius (`src/components/panel/icons.tsx`). En el menú, claros sobre un cuadro de color por sección; dentro de las pantallas, en trazo. Equivalencias: Hoy = Casa; Bandeja = Descargar; Consultas = Llamada; Personas = Cliente; Inmuebles = Edificio; Asuntos = Expediente; Agenda = Cita; Formatos = Escritura; Trámites = Verificado; Dinero = Precio; Equipo = Mensaje; Herramientas = Costos; Configuración = Filtrar. Los gestos que el sistema no trae (flechas, más, cerrar, palomita, reloj, correo, cámara) usan el mismo trazo.
- **Logo:** la O con dos cortes; logotipo completo en el menú, solo la O con el menú contraído.
- **Menú y barras:** fondo translúcido; la sección activa, llena de azul. En el teléfono, la barra inferior marca la activa en azul y los avisos en rojo.
- **Botones:** principal lleno de azul; secundario azul claro con texto azul. Se hunden un poco al presionar (140 ms).
- **Campos y búsqueda:** fondo gris de relleno, sin borde.
- **Foco y tamaño:** aro de 2 px en el acento con separación de 2 px; objetivos de 44 px o más; texto de 13 px como mínimo en el teléfono.

### Elegir opciones

- **3 o más opciones → lista desplegable; 2 opciones → interruptor** («Venta ◯ Renta», la elegida en negritas). Nunca filas de botones o chips. Vale para formularios y para las vistas de las listas (Activos, En espera, Cerrados; Todos, Venta, Renta).
- `Desplegable` y `Segmentado` del kit eligen solos según el número de opciones; la lista flotante está en `ui/select.tsx`.
- Las fechas rápidas van en un desplegable «Cuándo» (Sin fecha, Mañana, En 3 días, En una semana, Otra fecha…); «Otra fecha» abre el calendario.
- Excepción: las pestañas de la ficha del asunto.
- Donde un boceto dibuje botones para elegir, se construye con desplegable.

### Fecha y hora

- Calendario del mes, lunes primero, hoy con aro, días pasados apagados; arriba la fecha con letra («Viernes 20 nov»).
- Hora solo si va a la agenda: casilla «Añadir a la agenda con hora», pasos de 30 minutos de 7:00 a 20:00.
- Los documentos usan el campo de fecha del navegador, porque necesitan días pasados.

### Navegación

- **Teléfono:** barra superior con el logo, las consultas por atender, el buscador y el «+» de crear (azul, sin cuadro). Barra inferior con Hoy, Bandeja, Personas, Inmuebles, Asuntos y Más. Más abre Agenda, Consultas, Formatos, Trámites, Dinero, Equipo, Herramientas y Configuración, con sus números.
- **Escritorio:** menú lateral con Hoy, Bandeja, Consultas (con cuántas esperan), Personas, Inmuebles, Asuntos, Agenda, Formatos, Trámites, Dinero, Equipo y Herramientas; al pie, la cuenta, que abre Configuración y Cerrar sesión. Caja «Buscar o crear» (Ctrl K).
- **Menú contraíble o fijo,** a elección del asesor: se contrae a una franja de 64 px; al pasar el ratón o con el teclado se abre encima; el alfiler lo fija. Cada ícono contraído muestra su nombre en un globo. Se recuerda en el navegador.
- **Orden del menú:** se cambia arrastrando (Alt con ↑ y ↓). Se guarda en el navegador; con perfil propio (PN-09) pasa al servidor.
- En pantalla se dice «Asuntos», nunca «Operaciones»; los nombres técnicos no cambian.

### Patrones de interacción

| Patrón | Teléfono | Escritorio |
| --- | --- | --- |
| Crear | «+» de 44 px en la barra de arriba (sin botón flotante) | Botón «Nuevo» arriba a la derecha y la tecla N |
| Acción rápida en una fila | Deslizar: derecha = hecho, izquierda = posponer | Botones al pasar el ratón; E y P con la fila enfocada |
| Menú de una fila | Mantener presionado | Clic derecho o «⋯» |
| Detalle | Hoja desde abajo | Panel a la derecha |
| Posponer | Esta tarde · Mañana · Lunes · Elegir fecha, en un desplegable | Igual |
| Confirmar | Aviso con «Deshacer» por 5 segundos | Igual |

- **Detalle en escritorio ancho (1100 px o más):** panel de 440 px a la derecha que no tapa la lista; la fila abierta queda marcada y otra fila cambia el contenido sin llenar Atrás. Esc o la X lo cierran. Entre 641 y 1099 px, ventana centrada; en el teléfono, hoja desde abajo.
- **Abrir en grande:** en escritorio ancho, «⋯» junto a la X ofrece la misma ficha en una ventana centrada de hasta 1100 px; ahí dice «Volver al lateral». Se recuerda en el navegador. Vale para Asuntos, Personas e Inmuebles (`HojaAdaptable`). Con dos fichas en grande, solo la primera atenúa el fondo.
- **Fichas en la dirección:** `?ver=` en Personas, Consultas e Inmuebles (el inmueble por su folio) y `?cita=` en Agenda. Se comparte; Atrás la cierra y el foco vuelve a la fila.
- **Relacionado:** al pie de cada ficha, lo conectado (consultas, citas, inmuebles, persona), cada fila lleva a su ficha.
- **Menú «⋯» en las filas** de Personas y Consultas: Llamar, WhatsApp, Copiar teléfono y Copiar enlace a la ficha, sin abrirla.
- **Filtrar y ordenar:** un botón que abre ventana flotante en escritorio y hoja en el teléfono; dice cuántos filtros hay, «Ver N» cierra, «Quitar filtros» limpia y lo filtrado queda escrito en una línea. No se recuerda al salir.
- **Teclado:** J y K pasan de fila, Enter abre, «/» busca, N crea, Esc cierra. No actúan con una ventana abierta ni mientras se escribe (`useAtajo`). Lo que se usa con teclado muchas veces al día no se anima.
- **Captura en una línea:** reconoce tipo, día, hora, persona y lugar sin IA, y los muestra para confirmar antes de guardar.
- **Buscar o crear (Ctrl K):** secciones y acciones; con dos letras o más, personas, inmuebles y consultas por nombre, teléfono (con o sin espacios), correo, folio o zona, hasta cinco por grupo. Sin acentos ni mayúsculas. No busca por CURP ni RFC. En el teléfono vive en la barra superior.

### Arrastrar y soltar (RP-102)

- Donde haya algo que ordenar, se arrastra, siempre con alternativa de teclado y aviso de lo que pasó («Dinero quedó en el lugar 2 de 12»). En el teléfono, pulsación larga y además un menú «Mover a…».
- El elemento se ve levantado, una línea de acento marca dónde cae, soltar fuera cancela y lo que cambia datos trae Deshacer. Un elemento bloqueado no tiene asa. Con movimiento reducido no hay vuelo.
- Dónde: menú lateral (construido); pasos de las guías y entre guías (orden en el servidor con versión, 409); pasos opcionales de un trámite; tareas a Hoy, a la semana o a una fecha; citas a otra hora o día; «Atender primero» en Hoy; consultas a un asesor; archivos de la Bandeja a su destino; documentos y fotos; temas del chat y mensajes entre temas; cobros entre «Esta semana» y «Después»; equipo en Configuración (solo presentación).

### Componentes y movimiento

- **Kit propio (PN-01)** en `src/components/panel/kit/` (muestrario en `/panel/kit`): botón (primario, secundario, texto, peligro; deshabilitado con `aria-disabled`), campo (etiqueta, ayuda, error; monto con «$» y comas), desplegable/interruptor, hoja-ventana (el foco entra, se queda y vuelve), avisos, listas agrupadas, estados (cargando con esqueleto, vacío que invita a actuar, error con Reintentar, sin permiso), fecha y hora, arrastrar y soltar, Buscar o crear.
- **shadcn/ui** escrito a mano sobre Radix en `src/components/panel/ui/` (diálogo, hoja con vaul, ventana flotante, globo, menú, pestañas, interruptor, casilla, buscador con cmdk, avisos con sonner, separador, esqueleto). `src/app/panel/panel-shadcn.css` traduce sus nombres a los tokens solo dentro de `.panel-root`; el resaltado de filas usa `bg-muted`. Las piezas del kit pasan a estos componentes pantalla por pantalla.
- **Avisos:** abajo, 5 segundos, hasta tres a la vista, por encima de la barra del teléfono; se pausan al pasar el ratón y se descartan deslizando. Toda acción que cambia datos trae Deshacer.
- **Movimiento (motion):** entradas con `cubic-bezier(0.23, 1, 0.32, 1)`; hojas y paneles con `cubic-bezier(0.32, 0.72, 0, 1)`; menos de 300 ms; salidas más rápidas; solo `transform` y `opacity`; nada desde `scale(0)`; los menús crecen desde su botón; Ctrl K abre sin animación. Con `prefers-reduced-motion` solo quedan fundidos.

### Modelo: folios, centro y roles (RP-106 a RP-108; AUD-01)

- El **asunto** es el centro del trabajo (folio, documentos, dinero, lo que sigue); la **persona**, el de la relación; el **inmueble**, el inventario. Persona e inmueble se capturan una vez y el asunto los une con papeles.
- **Folios:** asunto `EXP-######` (incluye trámites), inmueble `FORTIUS-######`, formato emitido `EXP-######·nn·vN`, recibo `REC-AAAA-####`. Personas, consultas, archivos y movimientos llevan id interno. El folio nace al guardar en la base, no se reutiliza ni se borra; con el Deshacer de 5 segundos al crear, la escritura se confirma al vencer.
- **Abre un asunto:** un inmueble encargado en venta o renta, una búsqueda real, un trámite sin venta, un mandato de inversionista o volver a comercializar tras un cierre. No lo abren: una consulta, una visita, un archivo, un cambio de precio ni una reapertura.
- **Entradas (DEC-60):** Bandeja (archivos) y Consultas (personas) son dos entradas distintas; un archivo sin dueño no genera folio.
- **Quién ve qué (RP-101):** se construye primero para el director (ve todo); el asesor solo verá lo suyo (PN-10). Todo registro nace con responsable y creador, y la visibilidad se cumple en la base.
- **PN-02 (AUD-02 y AUD-04; migraciones aprobadas; se publican cuando el titular revise el panel completo):** tipos de asunto venta, renta, búsqueda, trámite, inversión, revisión y otro; papeles vende, compra, pone en renta, renta, copropietario, apoderado, aliado, notaría, banco, abogado y otro. Un solo responsable (`expedientes.asesor_id`); los colaboradores ven el asunto y lo que cuelga de él, y solo dirección arma el equipo y reasigna. El director puede ser responsable con ficha de asesor ligada. Un pendiente no se borra, se cancela; se guarda con la versión leída (409 si cambió). Los trámites que ya existen reciben folio en PN-07. Tareas y eventos del panel viejo se leen aparte y se copian una sola vez al retirarlo, sin doble escritura.

## Hoy

- **Orden:** Atender primero (vencido, lo más antiguo primero; luego solicitudes del sitio sin responder; luego hoy por hora; luego mañana), la línea de consultas, la agenda de hoy y Asuntos en curso.
- **Consultas:** las solicitudes del sitio sin responder salen siempre en una línea ámbar sobre la lista, con cuánto lleva la que más espera (roja pasadas dos horas) y «Verlas».
- **La cita que sigue al frente:** la primera cita con hora que no ha terminado va como tarjeta principal (hora grande, «Siguiente · en 25 min», título y tipo); las demás debajo, con «Ver agenda» en el título. Las terminadas se pliegan; si dos citas se cruzan, lo avisa. Sin citas, dice cuál es la próxima y lleva a ella.
- **Asuntos en curso:** Activos, En espera y Sin siguiente paso (este en ámbar). Sin fases fijas ni riel de etapas.
- **Mucho trabajo:** 5 filas como máximo por bloque, total en el título, «Ver los N restantes» y «N vencidos · Revisar».
- **Nada pendiente:** cada bloque queda en una línea con lo que sigue («Mañana: 2 citas y 3 tareas»), sin doble mensaje de vacío.
- **Vista:** desplegable Todo · Vencido · Hoy; en Filtrar y ordenar, «Solo solicitudes del sitio» y orden.
- **Sin «Vence pronto» ni «Te deben»:** los vencimientos (esperas de trámites, cobros, fechas clave) entran en Atender primero y en la agenda; lo que se debe se ve en Dinero. (revisar: AUD-03 había construido un bloque «lo que vence pronto» en Hoy; manda la decisión del titular de quitarlo.)
- Cada bloque carga y falla por su cuenta, con su Reintentar. La licencia estatal se avisa una vez por número, con cuántos contratos la usan.

## Agenda

- **Qué es:** lo agendado de los próximos 7 días: visitas, firmas, llamadas, levantamientos y vencimientos de los asuntos (apartado, entrega, precalificación, contrato).
- **Teléfono:** tira de 7 días con punto en los días con citas; vista Día (línea de tiempo desde una hora antes de la primera cita, con la hora de ahora) o Lista; «+». Se abre desde Hoy y desde Más.
- **Escritorio:** la semana en columnas desde hoy, o Lista; la cita abierta en el panel derecho. Flechas para cambiar de semana y «Volver a hoy». Atajos: N, ← y →, T, 1 y 2.
- **Semana libre:** dice cuándo es la próxima cita y lleva a ella. Con más de un asesor, cada cita dice de quién es.
- **Cada cita:** con quién (llamar o avisar por WhatsApp que va en camino), dónde (cómo llegar) y su asunto. Se mueve (día y hora de 30 en 30 minutos) o se cancela, con Deshacer. Si dos se empalman, avisa y agenda igual.
- **Después de una cita:** si ya pasó sin anotarse, una fila «¿Cómo te fue?»; ahí se anota qué pasó, «No llegó» y, si el asesor quiere, lo que sigue. Queda en el historial del asunto.
- **Nueva cita en una línea:** «Visita con Ana G. mañana 4pm en Otay».

## Personas

- **Compradores y arrendatarios son clientes de Fortius** (reemplaza RP-93). Una persona puede tener varios papeles; hoy el motivo se guarda en un papel (propietario, comprador, arrendador, arrendatario, inversionista, otro) y varios a la vez llegan con PN-04.
- **Nueva persona** (botón o N): nombre, teléfono, correo opcional, motivo (Vende, Compra, Pone en renta, Busca rentar, Invierte, Otro), canal preferido (WhatsApp, Llamada, Correo) y en qué quedaron, con «Cuándo». Sin fecha queda «Sin seguimiento». Queda a nombre de quien la anota y se abre su ficha.
- **Duplicado:** un teléfono (últimos 10 dígitos) o correo que ya existe muestra «Ya está en Personas: …» con «Abrir su ficha»; no frena: «Guardar de todos modos». Unir fichas llega con PN-02 aplicada.
- **Lista:** búsqueda por nombre, teléfono o inmueble. Vista Todas · Propietarios · Sin contacto (revisar: está en el boceto; lo construido solo tiene Filtrar y ordenar). Filtrar y ordenar: por nombre o las más recientes, solo con consultas abiertas, los demás papeles y más tiempo sin contacto.
- **La ficha** empieza con «Lo que sigue» (qué y cuándo) o «Sin seguimiento». Contactar en un toque (Llamar, WhatsApp, Correo) por el canal que prefiere. Muestra qué busca u ofrece y sus coincidencias, historial de llamadas, visitas y notas con registro rápido del resultado, y documentos con su estado.
- **«Lo que sigue» lo pone el asesor:** lo que acordó o anotó, con fecha, y se marca Hecho. Puede referir un inmueble o asunto, sin etapa ni paso del método. La app no genera pasos; la metodología vive en las Guías, que sugieren. La opinión de valor nunca es tarea suelta. Posponer cambia la fecha y conserva la referencia. Mismo criterio en Hoy.
- **Datos** (pestaña; en escritorio, columna a la derecha), en tres grupos:
  - **Contacto:** teléfono, WhatsApp si es otro número, correo, canal preferido y mejor horario (cualquier hora, mañana, tarde, noche).
  - **Para contratos:** nombre como en su identificación, estado civil, régimen y cónyuge si está casado, CURP, RFC, identificación con vigencia y domicilio; para persona moral, razón social, RFC de 12, representante legal y domicilio fiscal. Dice cuántos datos faltan, sin frenar; con sociedad conyugal avisa que el cónyuge también firma.
  - **Privacidad:** aviso de privacidad con estado y fecha, y «Llegó por». Si falta, en ámbar con «Enviar por WhatsApp» o «Ya lo firmó».
- Ningún dato vacío se oculta: «Sin dato» con «Agregar». Editar junta Contacto y Para contratos en un formulario; vacío quita el dato; CURP y RFC en mayúsculas, ocultos con «Mostrar» y «Copiar», contando caracteres (18; 13 o 12). Guardar avisa con Deshacer.
- **Preferencias:** interruptor para avisarle de inmuebles nuevos que coincidan. «Pidió no ser contactado» va en el menú ⋯; activo, la ficha lo avisa y apaga los botones de contacto.
- **Responsable:** lo asigna el sistema a quien captó; una solicitud del sitio queda «Sin asignar». Solo el director lo ve y lo cambia; no aparece en la ficha del asesor.
- **Fuera:** puntaje, cumpleaños, redes sociales, formularios largos y riel de etapas.

## Inmuebles

- **Lista:** búsqueda por colonia, calle, propietario o precio. Interruptor o desplegable Todos · Venta · Renta con conteo. Filtrar y ordenar: por nombre, precio (los «a consulta» al final; pesos y dólares por la cifra) o folio; solo en el sitio, solo apartados, solo con avisos, tipo; ocultar los de ejemplo. En escritorio, lista o tarjetas.
- **De un vistazo:** precio, estado en el sitio, días publicado, interesados y avisos.
- **Nuevo inmueble** (botón o N): nombre, tipo (los siete de DEC-32), Venta o Renta, precio o renta con moneda (vacío: «Valor a consulta»), zona, referencia (aviso de no poner la dirección exacta) y medidas según el tipo. Nace «En captación · privado»; el folio lo pone la base y el aviso lo dice.
- **Editar:** lo mismo más el estado, solo los de su operación y, si ya está en el sitio, sin volver a captación. **Guardar nunca publica** ni toca fotos, textos del sitio, llaves o seguimiento.
- **Ficha:** datos en tres grupos (precio y condiciones, características, ubicación); comisión visible solo para el asesor y dirección; interesados con su estado («Nuevo», «Le enviaste la ficha», «Ya lo visitó») y «Enviar la ficha a los nuevos»; visitas; «Cómo va» con vistas, contactos y visitas, e informe al propietario con «preparado» y «entregado» por separado (RP-88); documentos con su estado; cambiar precio desde el menú con la diferencia en porcentaje y la opción de avisar a los interesados.
- **Compartir:** arriba de la ficha, «Compartir por WhatsApp» (principal), «Copiar enlace» y «Ficha en PDF»; el mensaje lleva título, zona, precio y enlace, y dice si es de ejemplo. En la fila, lo mismo en ⋯ más «Copiar enlace para el equipo». Con clientes solo se comparte lo publicado. Compartir no guarda nada.
- **Desde la ficha en venta:** «Calcular crédito» y «Calcular comisión» abren la calculadora con el precio ya escrito.
- **Fotos:** subir o soltar varias; carga segura del servidor (sin EXIF ni GPS). Se ordenan arrastrando o con flechas; la primera es la portada. «Describir» da el texto alternativo; «Quitar» la saca; una privada no sale en el sitio. Con Deshacer.
- **Textos del sitio:** descripción libre y ubicación pública (colonia o referencia, nunca la dirección exacta); vacía conserva la anterior.
- **Publicar** es un paso propio. Avisos: sin precio, sin descripción, menos de 5 fotos, fotos sin describir, sin propietario ligado, sin contrato de intermediación, de ejemplo, mucho tiempo con pocos contactos; se muestran una vez y queda «Publicar así». El servidor todavía exige captación y foto (COR-16) y sin eso el botón no aparece. (revisar: DEC-61 dice que nada frena; falta decidir si COR-16 pasa a aviso en el servidor y anotarlo en `SPEC.md`.) La fecha de publicación es la de la primera vez. **Quitar del sitio** pide confirmación y no tiene Deshacer.
- **Propietario:** «Ligar propietario» busca en Personas; queda con papel de propietario ligado al inmueble. Se puede quitar; sin propietario se permite y lo dice.
- **Llaves (privado):** dónde están (oficina, propietario, caseta o administración, otro), copias y detalle; «Prestar llaves» anota a quién y cuándo regresan, «Regresaron» lo cierra; lo vencido en ámbar.
- **Pendiente de construir:** interruptor «Dirección exacta», video y recorrido 360 desde el panel nuevo, y «Publicar así» en el historial.
- **Fuera:** riel de etapas, gráficas, valuación automática, puntajes y pasos impuestos.

## Asuntos

- **Qué es:** la unidad de trabajo, con folio: venta, renta, búsqueda, revisión, trámite, inversión u otro. Nace con un título; personas e inmuebles son opcionales y pueden ser varios, cada persona con su papel. El tipo se cambia cuando sea; solo ordena y sugiere documentos.
- **Estado, lo pone el asesor:** Activo; En espera (pide qué espera y cuándo volver a preguntar, y lo muestra arriba); Cerrado como «Se logró» o «No se dio» (motivo de la lista fija COR-14 más un detalle). «Reabrir» lo vuelve activo; las personas siguen siendo clientes. «Se logró» (AUD-05) se marca en un solo paso con aviso de lo pendiente; necesita un cambio en el servidor y, mientras, un asunto que llega al cierre por su etapa dice «Este asunto terminó». Sin «Dónde va» ni fases.
- **Lista:** desplegable Activos · En espera · Cerrados. Filtrar y ordenar por tipo, «Solo con avisos», «Sin siguiente paso»; orden por lo que sigue más pronto, movidos hace poco o mayor comisión. Cada tarjeta: título, lo que sigue y una línea con persona, inmueble y tipo; si no tiene siguiente paso, lo dice en su tarjeta.
- **Escritorio:** tabla de todo el ancho (asunto, lo que sigue, personas, lo que queda para Fortius). Al abrir uno se desliza un panel de 680 px con folio, «3 de 5», anterior y siguiente, ⋯ y cerrar.
- **Arriba del asunto:** título, un botón «Tipo · Estado» y la barra de contacto con la persona principal (Llamar, WhatsApp, «+N»); notarías, bancos y abogados no son contacto principal.
- **«Lo que sigue»:** del asesor, con Hecho y Posponer; se edita tocándolo; si no hay, el bloque es el campo.
- **Avisos:** plegados en una línea ámbar («2 avisos»), cada uno con su acción («Crear documento», «Agregar al cónyuge», «Pedir revisión») y «Seguir así», que queda en el historial.
- **Pestañas:** Resumen, Documentos y Actividad; Guías llega con PN-07. Persona e Inmueble son vínculos que abren encima su ficha editable, con «Volver al asunto» (Esc regresa y el foco vuelve); al cambiar de asunto se cierra.
- **Guías (PN-07):** opcionales, una o varias; cada paso Hecho, «Lo hizo otro», «No aplica» o Pendiente; un paso puede volverse «Lo que sigue»; quitar una guía no borra nada.
- **Dinero:** valor, comisión, parte para un aliado y lo que queda para Fortius, como referencia.
- **Fechas clave** (firma, vencimientos, apartado, precalificación) llegan a Hoy y a la Agenda.
- **Documentos:** recibidos y hechos en Fortius en una lista; la lista del expediente de 7 con Falta, Recibido o No aplica, contando recibidos sin los que no aplican. «Crear documento» sugiere los del tipo y abre el formato en su ventana con los datos llenos.
- **Actividad:** notas internas y los cambios que registra la base, juntos.
- **Notas internas:** solo las ve el equipo y nunca salen en mensajes, formatos ni avances al propietario; lo dice un aviso fijo. Caja arriba y «Guardar nota»; cada una con quién y cuándo, la más nueva primero.
- Todo pasa por las rutas existentes; si el servidor rechaza un cambio, se muestra su motivo tal cual.
- **Gestos:** en el teléfono, deslizar a la derecha marca hecho lo que sigue (o abre «Anotar») y a la izquierda pospone; mantener presionado un paso abre sus opciones. En escritorio, J, K, E, P, N y /.
- **Nuevo asunto:** solo el título es obligatorio; el tipo en un desplegable. Sin asuntos, la lista invita a crear el primero.
- La opinión de valor no es un tipo de asunto ni tiene botón: sale del método (entrevista, levantamiento, checklist y dictamen).
- **Fuera:** fases fijas, riel obligatorio, kanban, probabilidad de cierre y gráficas.

## Consultas

- **Qué es:** que nadie que escribió se quede sin respuesta. Recibe personas (sitio, WhatsApp, llamada, en persona); los archivos van a la Bandeja.
- **Pestañas con número:** Por atender, En seguimiento y Cerradas. En Por atender, lo de las últimas 24 horas arriba y la que más espera primero (ámbar pasada una hora, roja pasadas dos); lo que lleva días va en su grupo, plegado con «Revisar». En seguimiento se ordena por la fecha para volver a contactar (atrasado en rojo, hoy en ámbar, sin fecha al final). Las cerradas dicen cómo terminaron: «Ya es cliente», «Sin operación» o «No es cliente».
- **Buscar** busca en las tres pestañas y cada fila dice en cuál está. Lista y número del menú se actualizan al volver a la ventana y cada minuto y medio. Sin canal registrado no se escribe «Sin canal».
- **Cada consulta:** el mensaje tal como llegó, el inmueble de interés, teléfono y correo.
- **Respuesta lista:** texto con el nombre y el inmueble, ajustable, con Copiar, WhatsApp, correo y Llamar. El asesor la envía; el panel no manda nada solo. Una consulta anotada a mano solo ofrece Llamar y WhatsApp.
- **Responder es atender:** responder, llamar o copiar pasa la consulta a En seguimiento a nombre de quien lo hizo, con Deshacer. «Atender yo» sigue a la vista.
- **Si ya está en Personas** (por teléfono): lo avisa y ofrece «Unir con su ficha». «Crear persona y asunto» arma ambos ligados con el inmueble de interés.
- **Volver a contactar:** desplegable «Cuándo»; con fecha, el botón dice «Guardado para el …».
- **Cerrar:** pide cómo terminó (Sin operación o No es cliente) y, si se quiere, por qué; queda como nota. Se reabre con un botón.
- **Anotar consulta** (+ o N): por dónde llegó (Llamada, WhatsApp, En persona, Otro), nombre, teléfono, correo y qué busca; queda en seguimiento a nombre de quien la anota.
- Guardar usa la versión leída; si alguien la cambió, avisa y muestra lo último. Atajos: J, K, A, N, Esc.

## Bandeja

- **Qué es:** la recepción de archivos. El asesor sube de golpe documentos, imágenes y videos; la Bandeja lee cada uno y recomienda a dónde va: una persona, un inmueble, un asunto, o crear uno nuevo.
- **Subir:** zona para soltar (escritorio) o «Subir archivos» y «Foto o video» (teléfono); en el teléfono se encoge a una fila cuando ya hay archivos. Cada archivo pasa por subiendo, leyendo y por confirmar.
- **Cada archivo dice** qué es, los datos leídos («Por confirmar»; CURP y RFC ocultos), dónde va y por qué («su nombre ya está en Personas»).
- **Confirmar** guarda donde se recomienda; «Cambiar» elige otro destino o crea uno; todo con Deshacer. «Confirmar N con coincidencia clara» abre una hoja con cada destino; crear una persona y lo que no se pudo leer siempre se revisan a mano.
- **Fotos y videos** se juntan por ubicación y van al inmueble; una foto que va a un inmueble publicado entra sin mostrarse y se publica desde la ficha. Los archivos de un mismo trámite se reconocen entre sí (frente y reverso de la INE).
- **Los archivos sin destino esperan en el servidor** (requiere cambio de base y anotarlo en el registro de privacidad).
- **Vistas:** Por confirmar y Guardados; cada guardado dice dónde quedó y se puede regresar. La pestaña y el título cuentan los que ya se pueden confirmar y dicen cuántos siguen en proceso.
- **Escritorio:** cola a la izquierda; a la derecha, vista previa, datos leídos y recomendación. J, K, C, G, U.

## Formatos

- **Qué es:** el catálogo de los formatos 01 a 24 (el 03 no existe) con captura sobre el documento en vivo. Construido: catálogo, Borradores, Emitidos y ventana de captura.
- **Catálogo por lo que quieres hacer:** conocer al cliente y al inmueble (01, 02, 04), revisar y opinar (05 a 08), intermediar y vender (09 a 15), rentar (20 a 23), entregar y cerrar (16 a 19 y 24). Cada uno con número, una línea de qué es y, si aplica, «Falta revisión del abogado» (20, 21 y 24). Se busca por número o nombre.
- **Empezar uno:** se elige el asunto (los de su operación primero); folio y datos del asunto se llenan solos. El 04 pregunta antes el tipo (terreno, casa, departamento, oficina, local, nave o plaza).
- **Captura sobre el documento:** la hoja real, como saldrá en PDF y en papel claro también en oscuro; cada espacio se llena tocándolo. La ventana ocupa toda la pantalla y deja inerte el menú de atrás. En escritorio, hoja a la izquierda y avance, campo y faltantes a la derecha. Las tablas con filas y las imágenes todavía no se llenan aquí; la ventana lo dice.
- **Nada frena:** «Faltan N datos» lleva a cada espacio vacío y «Generar PDF con N pendientes» siempre funciona. Generar no tiene Deshacer: la emisión queda en el historial del servidor.
- **Borradores y Emitidos:** lo empezado queda en Borradores con su avance; cada PDF pasa a Emitidos, donde se descarga y se sube la copia firmada.

## Trámites

- **Alcance:** cancelación de hipoteca, cambio de nombre de servicios, avalúos, regularización, Catastro y Registro Público. Un trámite es un asunto de tipo «Trámite»; esta pantalla es su vista especializada.
- **Lista y checklist,** sin tarjetas, barras de progreso ni columna de datos. Filas por lo que toca: Hoy (toca preguntar, con «Anotar respuesta»), Esperando (días que faltan) y En curso; los listos al final en un enlace. Filtro por tipo y por dónde está (Registro Público, Catastro, CFE, notaría, perito…). El «+» abre el catálogo por tipo y se liga a un inmueble, una persona o ninguno; «Trámite libre» no trae pasos.
- **Detalle:** un checklist con todos los pasos; el actual trae sus pendientes, «Cerrar el paso» (con Deshacer) y «Poner en espera». Si hay espera, arriba dice a quién y cuándo volver a preguntar. Los trámites de varias partes usan la misma lista, cada parte solicitada y lista, con qué llevar.
- **Debajo:** Documentos con visor, Notas (separadas del Historial, que es lo que hace el sistema) y Datos (tareas, crédito, pagos). «Avance al propietario» arma el mensaje con interruptores de qué incluir; lo envía el asesor y queda registrado.
- **Cancelación de hipoteca (TRA-01):** 8 pasos según el acreedor, evidencia por paso, espera y tarea de volver a preguntar; sus pasos obligatorios no se reordenan. Los pasos de las demás guías son de ejemplo y dicen «Por confirmar con la fuente oficial».
- **Escritorio:** lista a la izquierda y trámite a la derecha. J, K, N, T y R.

## Dinero

- **Para qué:** qué me deben y qué dinero ajeno tengo en resguardo. Sin gráficas ni reportes. Cada movimiento nombra su asunto.
- **Pestañas:** Te deben (comisiones y gastos que el propietario debe reembolsar), Por entregar (apartados en resguardo, con comprobante, DEC-56) e Historial. Arriba, la cifra de la pestaña y una línea de contexto.
- **Te deben:** Vencido, Esta semana y Después; cada fila con asunto, qué es, vencimiento y lo que falta («de $X» si hubo cobro parcial).
- **Detalle:** lo que falta, total, cobrado, vencimiento y nota (hoja en teléfono, panel en escritorio).
- **Registrar cobro:** monto (por omisión lo que falta, nunca más), forma (transferencia, efectivo, cheque), con Deshacer. Un recibo total salda la cuenta y la diferencia es descuento. Cuenta el último recibo con PDF, con aviso si cambió sin volver a generarlo.
- **Registrar entrega:** el apartado sale de la lista y queda en el historial.
- **Reglas:** pesos y dólares por separado, sin convertir; la comisión se anota al firmar.
- **Movimiento nuevo:** tipo, asunto, monto, concepto opcional y, salvo apartados, vencimiento en «Cuándo».
- Atajos: J, K, P, N, Esc. Las cifras de ejemplo lo dicen.

## Herramientas

- Cada calculadora es su pantalla: `/panel/herramientas` (índice), `/panel/herramientas/credito` (comprador) y `/panel/herramientas/comision` (vendedor). Comparten la tarjeta de resultado.
- **Crédito:** precio, enganche (10 a 40 %), plazo (10 a 25 años) y tasa; da mensualidad, enganche, crédito e intereses. Es referencia: sin seguros ni comisiones del banco.
- **Comisión:** precio y porcentaje (3 a 6 %); da comisión, IVA (16 %) y lo que queda al propietario.
- **Desde un inmueble:** «Para: …», el precio ya escrito y Quitar; sin precio o en dólares, lo dice y deja el precio vacío. «Copiar la cuenta» incluye inmueble, supuestos, fecha y leyenda.
- **Costos de cierre:** «Pronto»; se conecta con la hoja de costos de cierre de Baja California cuando se defina su fuente.

## Equipo (chat, PN-11)

- Chat de trabajo con temas # (#general, #ventas, #tramites, #captacion, #juridico) y mensajes directos. En Más (con no leídos) y en el menú lateral.
- Tema con nuevos en negrita y número rojo; directos con punto verde de en línea.
- Conversación sin burbujas: avatar, nombre y hora, agrupados por persona; separadores «Ayer», «Hoy» y «Nuevos».
- Escribir: Enter envía; @ menciona; el clip liga a un asunto, trámite o inmueble con una tarjeta.
- Tema nuevo con «+»: nombre (vista previa #avaluos) y para qué sirve; sin repetidos.
- Escritorio: temas en 300 px a la izquierda y conversación al centro. J, K, N, Esc.

## Configuración

- `/panel/configuracion`: perfil, apariencia, avisos, equipo y sesión, en ese orden. Una columna centrada; se llega desde la cuenta al pie del menú.
- **Perfil:** nombre y teléfono de tu ficha de asesor; las iniciales siguen al nombre; cargo y perfil público no se tocan. Guardar con Deshacer; si alguien guardó antes, recarga y pide revisar. Correo de la cuenta y foto del perfil público no se cambian aquí. Sin ficha (dirección), lo dice.
- **Apariencia:** desplegable Automático, Claro, Oscuro; se recuerda en el navegador y cambia al instante.
- **Avisos:** interruptores de consultas nuevas, citas próximas, vencimientos y «te asignan algo»; por ahora en el navegador.
- **Equipo:** solo lo ve el director, de solo lectura: cada asesor con su cuenta y papel (Director o Asesor) o «Sin cuenta para entrar»; las cuentas sin ficha, aparte. Pulsar abre su ficha. «Invitar a alguien» está deshabilitado («llega pronto», PN-10): no se envía nada.
- **Sesión:** cerrar sesión, también desde la cuenta.
- **Sin construir:** reordenar el equipo arrastrando y cambiar la foto.

## Por decidir

- Qué ve el director en Hoy y en Personas: lo suyo, lo de su equipo o ambos.
- ¿Tu ficha de asesor sale en el sitio público? Para ser responsable el director necesita ficha, y hoy las activas salen en el sitio. Recomendación de AUD-04: «No mostrar en el sitio».
- Qué regla manda para ver un asunto: la del panel nuevo (quien lo lleva o colabora) o la del viejo (además llevar al cliente). Recomendación de AUD-04: la del nuevo, anotada en `SPEC.md`.
- Publicar con captación incompleta: si COR-16 pasa a aviso por DEC-61 (revisar).
- Si la búsqueda de un comprador es un asunto propio: la sección de folios de AUD-01 lo dejó pendiente aunque RP-93 ya se reemplazó (revisar).
- Propuestas de AUD-01 sin respuesta: Consultas con menos pasos y Dinero que nace desde el asunto.
- Bandeja: qué lee de cada tipo de archivo y desde cuándo se activa la lectura.
- Agenda: conexión con el calendario del teléfono y avisos antes de la cita (PWA-03); zona horaria y recordatorios.
- Formatos: plantillas reales de cada formato; revisión del abogado de 20, 21 y 24.
- Trámites: si «avalúo» es siempre con perito externo; fuente oficial y revisión del abogado de los pasos de ejemplo; mostrar en Hoy y en Agenda las esperas que vencen; cómo se avisa en Asuntos la firma de una venta con hipoteca.
- Notas internas: si se pueden corregir; quién ve las de un asunto ajeno; menciones @.
- Equipo (chat): hilos, archivos adjuntos, avisos al teléfono o solo al panel, quién crea o archiva temas, temas privados, si la abogada externa entra.
- Herramientas: si la comisión se calcula siempre sobre el precio de venta; si la cuenta se puede mandar al cliente tal cual.
- Configuración: roles y permisos por persona (quién ve notas, quién cierra pasos); avisos por correo o al teléfono.
- Dinero: quién ve el dinero (cada asesor lo suyo o todo el equipo); reparto de comisión entre asesores o con co-broker; CFDI ligadas al cobro; cobros que vencen en Hoy y en Agenda; recibos desde Formatos; la promesa 15 con el abogado.
- Consultas: quién recibe las nuevas (grupo, turno o zona); cuánto es «tarde»; enviar desde el panel con WhatsApp Business; cómo llegan las del sitio y su aviso de consentimiento; si una sin respuesta pasa a la Agenda.
- Datos de prueba viejos: el titular corre `tools/panel-datos-prueba-borrar.sql` (respaldo en `tmp/`) cuando dé el visto bueno, porque toca la base del sitio público.
- Para su etapa (AUD-04): estado y tipo de lo heredado y marca de «panel nuevo» (I6, PN-04); historial automático al cambiar equipo, responsable o unir fichas (I8, PN-04); suma de porcentajes, ciclos de «continúa de» y uniones simultáneas (PN-03 y PN-04); mensaje al borrar en `/admin` algo ligado; procedimiento de cancelación de datos en historial y notas antes de usarlas con clientes reales.
