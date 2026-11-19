# Fortius — cómo debe funcionar el sistema

Este documento describe el sistema completo: qué es, qué partes tiene y qué reglas sigue. Lo decide Moisés Núñez Tonalá, el titular. Si el código hace algo distinto a lo que dice aquí, se corrige el código.

**Actualizado:** 18 de noviembre de 2026.

**Esta es la versión vigente al día de hoy.** No es definitiva: va a cambiar conforme el sistema se use y el titular decida cosas nuevas. Cómo se cambia está en la sección 19.

**Archivos que lo acompañan:**

| Archivo | Para qué sirve | Dónde está |
| --- | --- | --- |
| `PLAN.md` | Qué falta por hacer y en qué vamos | En la carpeta principal del proyecto |
| El boceto | Cómo se ve y cómo responde el panel. Se abre en el navegador y funciona con datos de ejemplo | `docs/boceto-fortius-por-asuntos.html` |
| Los casos reales | Los casos que el panel debe poder llevar de principio a fin | `docs/casos-reales.md` |
| Las metodologías | Guías de trabajo que se copian a un asunto | `docs/metodologias/` |
| El sitio público | Qué es el sitio nuevo, en qué orden se hizo y cómo se hace. Para el sitio público mandan esos | `docs/sitio/` |

---

## 1. Qué es

Un solo producto con dos caras:

- **El sitio público** de Fortius Inmuebles (fortiusinmuebles.com), donde la gente ve inmuebles y pide informes.
- **El panel**, donde Fortius lleva todo su trabajo: quién llamó, qué asunto se abrió, qué documentos hay, qué sigue, qué se cobró y qué se publica en el sitio.

Es exclusivo de Fortius y lleva solo su marca.

## 2. Las ideas que mandan

1. **Sirve para cualquier caso inmobiliario.** Una venta normal, una casa en sucesión e invadida, un terreno con sentencia, una asesoría por etapas, una renta de varios locales o un puro trámite. Si un caso real no cabe, se cambia el sistema; no se fuerza el caso.
   - **No todo asunto empieza con un inmueble, pero todo termina en uno:** el que se vende, se renta, se escritura o se adjudica al final. Por eso Fortius también lleva, con sus abogados, los juicios y trámites que desembocan en un inmueble (una sucesión, una cesión de derechos, un juicio hipotecario, una prescripción, un trámite del registro público) y guarda aquí su expediente para tener el control de los documentos.
   - **Lo que no termina en un inmueble no se atiende:** asuntos penales, corporativos o fiscales sin relación con un inmueble.
   - **Los asuntos penales que nacen de un inmueble sí se llevan:** un fraude al comprar un terreno, un despojo o una invasión.
   - **Los asuntos fiscales de un inmueble también:** un predial o un valor catastral excesivo, o un impuesto de adquisición mal cobrado.
   - **Y los familiares cuando lo que se reparte es un inmueble:** un divorcio donde hay que liquidar la sociedad conyugal y vender o adjudicar la casa.
   - **Se derivan a otro despacho:** los trámites migratorios de quien compra (residencia, permisos). El asunto sigue su curso con una tarea para el otro despacho.
2. **El centro es el asunto.** Todo trabajo que alguien le encarga a Fortius es un asunto. Desde el asunto se ve y se edita todo lo suyo, sin cambiar de sección.
3. **Ninguna forma de trabajar es obligatoria.** Las metodologías (cómo captar una venta, cómo captar una renta, cómo cancelar una hipoteca) son guías guardadas en la Biblioteca. Se copian a un asunto cuando sirven y ahí se cambian con libertad.
4. **El sistema nunca impide seguir.** Si falta un dato, un documento o un paso, lo avisa y deja guardar, avanzar, publicar o firmar. La decisión es de la persona.
5. **Pocas palabras, muchas funciones.** En pantalla hay pocos elementos; lo demás está a un toque, agrupado en menús y listas desplegables.
6. **El sistema propone y la persona decide.** Nada se envía, se publica ni se da por bueno solo.
7. **Cada dato se captura una vez** y se reutiliza en todos lados.

## 3. Las secciones del panel

En la computadora hay un menú a la izquierda; en el teléfono, una barra abajo.

| Sección | Qué es |
| --- | --- |
| **Inicio** | Lo que hay que atender: quién espera respuesta, lo de hoy, las visitas, lo de la semana, lo que se espera de otros, a quién volver a llamar, lo que está por vencer y lo que falta cobrar |
| **Asuntos** | Todos los trabajos abiertos y cerrados |
| **Inmuebles** | El inventario, y todo lo que sale en el sitio público |
| **Directorio** | Todas las personas, con el asunto del que viene cada una. Incluye los contactos que todavía no tienen asunto |
| **Biblioteca** | Las metodologías: listas de qué pedir y planes de qué hacer |
| **Herramientas** | Opinión de valor, cálculos y contratos que se pueden hacer en cualquier momento |
| **Equipo** | Solo para el director: cómo va cada asesor |

En el menú también hay un buscador, los asuntos recientes y la cuenta de quien entró. El botón «Nueva consulta» está en Inicio y en la lista de Asuntos.

### Inicio

En este orden, y cada bloque solo aparece si tiene algo (salvo hoy, la semana, lo que esperas de otros y lo que falta cobrar, que dicen «nada» cuando no hay):

- **Por atender:** las solicitudes del sitio que no se han atendido, la más antigua arriba, con cuánto llevan esperando.
- **Para ti:** lo que te mencionaron en una nota y las tareas que otra persona te dejó, de los últimos 30 días, lo más nuevo arriba. Lo que llegó después de la última vez que tocaste «Ya lo vi» lleva un punto y cuenta junto a «Inicio» en el menú. Cada renglón abre su asunto; si la mención es de un asunto que no llevas, la nota se lee ahí pero el asunto no se abre.
- **Para hoy:** las tareas de Fortius con fecha de hoy o ya vencidas.
- **Visitas:** las de hoy a siete días, con hora, quién viene y a qué inmueble.
- **Esta semana:** las tareas de Fortius de mañana a siete días.
- **Lo esperas de otros:** lo que le toca al cliente, al abogado, a la notaría u otra persona, de aquí a siete días o ya vencido; arriba lo que lleva más días de retraso. Lo vencido trae «Recordarle».
- **Volver a llamar:** los contactos cuyo día de llamarles ya llegó.
- **Por vencer:** los documentos que ya entraron en su aviso (15 días antes si no se dijo otro) o que ya vencieron.
- **Por cobrar:** cada asunto con presupuesto aceptado, con lo que falta (honorarios menos lo cobrado; los de porcentaje se calculan sobre el precio del inmueble), en pesos o en dólares.

Cada asesor ve lo que lleva; el director ve todo el equipo y puede elegir a una persona. Marcar una tarea desde Inicio la deja hecha en su asunto, con su historial.

## 4. Cómo empieza todo: la consulta

Casi todo empieza con una llamada o un mensaje: «tengo este problema, ayúdame». La consulta se llena **mientras se habla**, como un médico en su consulta.

- **Quién llama**, su teléfono y por dónde llegó.
- **Qué pasa**, en un cuadro libre, tal como lo cuenta.
- **Los datos de siempre**, cada uno en su lista desplegable: qué quiere, de quién es el inmueble, qué tipo de inmueble es, en qué colonia está, quién lo ocupa, si tiene escritura y qué debe.
- **Qué pedirle:** la lista de documentos se arma sola con lo que se va marcando. Se quita lo que no aplique y sale como mensaje para WhatsApp, que envía el asesor.
- **Otras personas del caso:** en la misma consulta se anota a quien haga falta (la titular, los hermanos, el comprador) con su nombre y su papel, sin salir.
- **Lo que ya mandó:** si la persona ya envió documentos, se adjuntan ahí mismo y quedan marcados como recibidos.

Nada es obligatorio y se guarda sola mientras se escribe. Al terminar, el botón «Abrir asunto» deja creados y ligados la persona, el inmueble, la lista de documentos y un primer plan.

Las solicitudes que llegan por el sitio público caen en Inicio, en «Por atender», con el tiempo que llevan esperando. Abrir una lleva a la misma consulta, ya llena con lo que la persona escribió.

- **Quién atiende una solicitud del sitio:** le llega al director, que la asigna a un asesor con «Pasar a…». Si es por un inmueble publicado, queda de una vez a cargo de quien lleva el asunto de ese inmueble (o el inmueble, si no tiene asunto abierto). Cada asesor ve solo las que le tocan. El tiempo de espera se pone en ámbar pasada una hora y en rojo pasadas dos.
- **Si la solicitud es por un inmueble publicado,** queda además anotada en el apartado Interesados del asunto de ese inmueble. Si su teléfono o su correo ya están en el Directorio en una ficha que quien la atiende puede ver, se usa esa misma ficha; si no, se crea una nueva a su cargo. Nadie escribe en la ficha de otro asesor por una solicitud.
- **Si alguien que se había descartado regresa por el sitio,** llega otra vez como solicitud nueva en «Por atender».
- **Atender** abre la consulta con su nombre, teléfono, correo y mensaje, por el canal «Sitio». «No procede» la quita de Inicio. Lo que llegó del sitio no se cambia.

### Cómo nace el asunto

- **Quien llama** queda como «Contacto», o como «Propietario» si el inmueble es suyo. Se cambia después en Personas.
- **El inmueble:** si se dijo qué es o dónde está, el asunto trae su apartado Inmueble, aunque solo se haya encargado una revisión.
- **El nombre del asunto** sale de lo capturado («Casa en la Murúa»); se cambia cuando se quiera.
- **El primer plan** es un ejemplo para que el asunto no nazca sin un siguiente paso: recibir los documentos, estudiar el asunto, emitir la opinión (si es una revisión) y el presupuesto. Cuando exista la Biblioteca, se elige de ahí.
- **Si se corta la llamada o la conexión,** lo capturado queda en el equipo y se manda al volver. Una consulta a medias se retoma desde la misma pantalla.

### Cuando una consulta no se vuelve asunto

No se pierde. Al cerrarla hay dos salidas:

- **Guardar como contacto:** la persona queda en el Directorio, sin asunto, con una fecha para volver a llamarle. Ese día aparece en Inicio.
- **No procede:** se cierra con el motivo.

## 5. El asunto

### Qué es un asunto

Cualquier encargo de trabajo. Ejemplos:

- Vender o rentar un inmueble.
- Buscarle inmueble a un comprador o a un inquilino.
- Revisar si un inmueble se puede vender.
- Un trámite: cancelar una hipoteca, tramitar un crédito, escriturar.
- Asesorar a alguien en un negocio, etapa por etapa.
- Atender a un inversionista.
- Llevar el juicio o el trámite que termina en un inmueble: una sucesión, una cesión de derechos, un juicio hipotecario, una prescripción, un fraude o un despojo de un inmueble, un trámite del registro público. Lo llevan los abogados de Fortius y el asunto guarda su expediente. Cuando el inmueble se adjudica, «Continuar en un asunto nuevo» lo pasa a venta o renta.

No abren asunto por sí solas una visita, un archivo que llega o un cambio de precio.

### Lo que tiene todo asunto

- **Un folio** que pone el sistema (ejemplo: EXP-000031). No se repite ni se reutiliza.
- **Un nombre** que se puede cambiar.
- **Qué encargaron:** revisar, comercializar, tramitar o asesorar. Puede ser más de una cosa.
- **En qué va:** en estudio, propuesta, en marcha, por cobrar o cerrado. Además, cualquier asunto se puede poner **en espera**, con el motivo y la fecha para retomarlo; mientras tanto no cuenta como atrasado. Lo cambia el asesor cuando quiere; no hay pasos forzosos. El sistema lo propone en el momento oportuno y el asesor acepta con un toque: al emitir la opinión jurídica (si no es «no factible»), «¿Pasar a Propuesta?»; al cargar el contrato firmado, «¿Pasar a En marcha?»; al cobrar todo, «¿Cerrar el asunto?». Nunca lo cambia solo. Si el asesor contesta «Ahora no», no se vuelve a proponer.
- **Quién lo lleva:** un asesor responsable. El director puede cambiarlo. Al cambiarlo, las tareas pendientes de quien lo llevaba pasan a la nueva persona; las que tenía otra persona del equipo y las ya hechas se quedan como están. Cada tarea que pasa queda en el Historial.
- **Lo que sigue:** la próxima tarea, siempre a la vista, con marcar hecha y posponer. Si no hay, el asunto lo dice y pide escribirla.

### Los apartados

Las partes de un asunto se llaman **apartados**. Cada uno es un renglón con su ícono y un resumen; al tocarlo se abre una ventana, sin salir del asunto. Dónde se abre y cómo se regresa está en «Las ventanas», en la sección 14.

- **Siempre están:** Personas, Plan e Historial.
- **Los demás** aparecen según lo que encargaron, y se **agregan o se quitan** cuando convenga. Quitar un apartado solo lo oculta; lo capturado se conserva.
- Lo que no se encargó no aparece ni se reclama.

| Apartado | Qué lleva |
| --- | --- |
| **Personas** | Todas las personas del asunto, cada una con su papel: contacto, propietario, titular, heredero, copropietario, comprador, vendedor, inquilino, inversionista, contraparte, apoderado, abogado, notaría o banco. Se ven agrupadas por su lugar en el caso y al tocar a una se abre su ficha (sección 6) |
| **Inmueble** | Uno o varios. Con varios (por ejemplo, cinco locales de una plaza), cada uno lleva su precio, su estado y su propio cierre |
| **Interesados** | Solo cuando se comercializa. Cada persona interesada, con el inmueble o los inmuebles que le interesan, su visita (día y hora) y su oferta (monto y respuesta del dueño). Las visitas aparecen en Inicio el día que tocan |
| **Situación** | Lo que se sabe del caso y la lista de lo que falta averiguar. Cada cosa por averiguar se vuelve tarea con un toque |
| **Documentos** | Lo recibido y lo que falta, con su archivo. Cada documento dice quién lo entrega y, si vence, cuándo. Es la única lista de documentos del asunto |
| **Opinión jurídica** | El resultado (factible, factible con observaciones o no factible), el análisis y qué hay que resolver y quién lo hace. Si es «no factible», ofrece tres salidas: cobrar el estudio, cerrar el asunto o dejarlo en espera con fecha para revisarlo |
| **Honorarios** | El presupuesto, el contrato y los cobros |
| **Plan** | Las etapas y sus tareas |
| **Historial** | Notas, decisiones y todo lo que pasó, lo más nuevo arriba |

### Apartados propios

El asesor puede crear un apartado con el nombre que quiera y elegir **cómo se ve**, según para qué lo va a usar:

- **Lista:** renglones que se marcan. Ejemplo: visitas por hacer.
- **Tabla:** una pequeña base de datos con las columnas que él defina. Ejemplo: ofertas recibidas o gastos.
- **Galería:** tarjetas con foto y datos. Ejemplo: comparables, con su foto, precio y superficie.
- **Texto:** notas largas.

La vista se puede cambiar después sin perder lo capturado. Un apartado propio se puede guardar en la Biblioteca para usarlo en otros asuntos.

### El Plan

- Tiene **etapas**, y cada etapa tiene **tareas**.
- Las etapas las escribe el asesor o las copia de la Biblioteca. Puede haber varias a la vez.
- Cada tarea dice **quién la hace** (Fortius, el cliente, el abogado o la notaría) y para cuándo.
- Una tarea puede llevar **hora**, además del día (una visita, una firma). Inicio las muestra ordenadas por hora.
- Una tarea puede quedar **hecha**, **no aplica** o **no se puede todavía**, con el motivo.
- Una tarea puede **esperar a que termine otra**: se elige en la tarea y, mientras la otra siga pendiente, se lee «espera a…». Solo avisa; se puede hacer antes. Dos tareas no pueden esperarse una a la otra.
- Una tarea puede **repetirse** cada semana, cada 15 días, cada mes, cada dos o tres meses, o cada año. Al dejarla hecha nace la siguiente con la fecha que toca (nunca en el pasado; por mes o por año, el mismo día: la del 31 cae el 28 en febrero y vuelve al 31 en marzo); si se desmarca y nadie tocó la nueva, la nueva se quita. La de mandar un informe se repite con su informe y se cambia desde él.
- El plan se ve como lista o en una línea de tiempo.
- Las tareas con fecha aparecen solas en Inicio.
- **Toda tarea que le toca a otro** (el cliente, el abogado, la notaría) nace con una fecha de «volver a preguntar», tres días después de su fecha, para que no se quede dormida.
- Esa tarea trae un botón **«Recordarle»**, que abre WhatsApp con el mensaje ya escrito y recorre la fecha de volver a preguntar tres días más.
- Inicio muestra lo que lleva más días esperando a otra persona, empezando por lo que más tarda.

### Informes para el cliente

Cuando el cliente pide saber cómo va su asunto, el informe se hace desde el mismo asunto: «Nuevo» → «Informe para el cliente».

- **Se arma solo con lo que el asunto ya tiene,** con la hoja a la vista, igual que un formato, y con el membrete de Fortius. El asesor no vuelve a capturar nada.
- **Para quién:** se elige a una o varias personas del asunto.
- **Qué lleva,** en una hoja tamaño carta con el encabezado de Fortius, el número de informe, la fecha, el nombre del asunto y su folio:

| Parte | De dónde sale |
| --- | --- |
| **En qué va** | Un párrafo que el sistema propone y el asesor cambia a su gusto |
| **Lo que se hizo** | Las tareas terminadas y los documentos recibidos desde el informe anterior |
| **Lo que sigue** | Las próximas tareas del plan, con su fecha y quién las hace |
| **Lo que necesitamos de usted** | Los documentos que le faltan por entregar y las tareas que le tocan |
| **Actividad del inmueble** | Solo si se comercializa: cuántas personas preguntaron, cuántas visitas hubo y qué ofertas llegaron, por cada inmueble |
| **Dinero** | Lo acordado, lo cobrado y lo que falta, y los gastos de terceros |

- **Cada parte se enciende o se apaga** antes de guardarlo, y de cada parte se pueden quitar renglones. Una parte sin contenido no sale. El dinero empieza apagado.
- **Nunca lleva** notas internas, decisiones internas, el análisis de la opinión jurídica ni los nombres o teléfonos de los interesados.
- **Primero se guarda;** después se descarga en PDF o se manda como mensaje por WhatsApp. No se manda solo: lo envía el asesor.
- **Queda guardado** en los Documentos del asunto, en el grupo «Informes», con su número, y anotado en el Historial. Un informe ya mandado no cambia; el siguiente es uno nuevo.
- **Se puede repetir:** cada semana, cada 15 días o cada mes. Al guardar un informe nace la tarea «Mandar el informe» para la fecha siguiente y aparece en Inicio ese día; al guardar el siguiente, esa tarea queda hecha y nace otra.
- Es distinto del **Reporte de comercialización al propietario**, que es un formato por preguntas con el detalle de publicidad y canales. El informe sirve para cualquier asunto.

### Cerrar un asunto

Un asunto se cierra como **se logró** o **no se dio**, con el motivo. Al cerrar se anota quién captó y quién vendió (se puede dejar sin anotar). «Deshacer» justo después de cerrar lo deja como estaba, sin motivo. Un asunto cerrado se puede reabrir.

Cuando un trabajo termina y de él nace otro (una revisión que se vuelve venta, una asesoría que termina en vender), el botón **«Continuar en un asunto nuevo»** copia las personas, el inmueble y los documentos (con sus archivos), y deja anotado en los dos de dónde viene cada uno. Los recibos no se copian: se quedan con su cobro.

## 6. Personas

- Cada persona se captura **una sola vez**. Si llega un teléfono o un correo que ya existe, el sistema avisa y ofrece usar la misma ficha.
- Una persona puede ser **una empresa o una institución** (una sociedad dueña de una nave, una notaría, un banco), con su representante y los datos de ambos.
- Una persona puede marcarse como **fallecida**: se conserva para los documentos, sin teléfono ni botones de contacto.
- Los teléfonos aceptan **clave de otro país**, para quien vive fuera de México.
- Una persona puede tener **papeles distintos** en asuntos distintos.
- Una persona puede estar en el Directorio **sin asunto**, como contacto, con una fecha para volver a llamarle.
- Desde el Directorio, el botón **«Nuevo asunto con esta persona»** abre la consulta con sus datos ya puestos.
- El **Directorio** muestra a cada persona una sola vez, con todos los asuntos donde tiene un papel; se busca por nombre o teléfono. Cada uno ve a las personas que puede ver (el director, a todas).
- Si una persona quedó capturada **dos veces**, el director **une las fichas**: elige la que se queda; sus asuntos, tareas, documentos y datos pasan a ella, y la otra va a Eliminados. Lo que ya tenía la que se queda no se reemplaza.
- **Cliente** es quien ya firmó un contrato con Fortius. Antes de firmar es prospecto. La contraparte de un asunto no es cliente.
- Si una persona **pidió no ser contactada**, todas las pantallas lo respetan: se apagan los botones de llamar y escribir.
- Sus datos (nombre completo, nacionalidad, ocupación, estado civil, CURP, RFC, identificación y domicilio) se guardan en su ficha y de ahí los toman los documentos que los necesiten. No todas las personas de un asunto van a un contrato: nada de eso es obligatorio.

### Personas dentro de un asunto

- **Al abrir Personas** se ven agrupadas por su lugar en el caso, en tarjetas, nunca en una tabla: **Quien nos busca** (contacto), **Dueños y herederos** (propietario, titular, heredero, copropietario, vendedor), **Del otro lado** (comprador, inquilino, inversionista, contraparte) y **Quienes ayudan** (apoderado, abogado, notaría, banco). Cada tarjeta dice su nombre, su papel, su teléfono y, si se anotó, su relación con las demás («Hija de Rosa, recibe el poder»).
- Un grupo vacío dice «Nadie todavía», para que se note lo que falta. Cada grupo tiene **«Agregar»**, que agrega a alguien con ese papel ya puesto.
- **Al tocar a una persona se abre su ficha**, sin salir de la ventana: a un lado la lista de todas las personas del asunto, para pasar de una a otra; al otro, su ficha con llamar, WhatsApp, su papel y tres pestañas: **Datos**, **Documentos** (los suyos en este asunto) y **Otros asuntos** (dónde más aparece y con qué papel).
- En **Datos** cada dato se cambia ahí mismo; lo que falta se ve como «—» y no frena nada. La flecha ← regresa a los grupos.
- El CURP y el RFC se muestran ocultos y no salen del panel.

## 7. Inmuebles

Inmuebles es también el panel de lo que sale en el sitio público: aquí se carga todo.

- Cada inmueble lleva un **folio** que pone el sistema (ejemplo: FORTIUS-000011).
- **Un inmueble siempre pertenece a un asunto.** Al agregar uno desde Inmuebles se piden nombre, tipo, operación y, si se sabe, el propietario; con eso se abre solo su asunto de captación. Desde un asunto, se agrega ahí mismo.
- **Tipos:** casa, departamento, terreno, local, oficina, nave o bodega, y plaza o conjunto.
- Un inmueble puede **pertenecer a un conjunto**: los locales de una plaza se ligan a su plaza, que dice cuántos tiene en total y cuántos están libres. En el asunto, «Agregar otro igual» suma un local más de la misma plaza, con su propio folio, precio y estado, y «Publicar todos» los publica de una vez.
- **El precio dice su moneda** (pesos o dólares) y guarda su **historial**: cada cambio, con quién lo hizo, cuándo y por qué.
- Se pueden **elegir varios inmuebles a la vez** para publicarlos, compartirlos o cambiarles el estado.

### La ficha del inmueble

| Pestaña | Qué lleva |
| --- | --- |
| **Ficha técnica** | Nombre, tipo, venta o renta y precio; después los datos propios de su tipo. Una nave pide altura libre, carga eléctrica, andenes y uso de suelo; una casa pide recámaras, baños y estacionamientos |
| **Fotos** | Se suben varias a la vez y se elige la portada; se ordenan y se quitan. Al subirlas se les quita la ubicación y los datos de la cámara |
| **Video y 360** | Video y recorrido 360, subidos (hasta 20 MB cada archivo) o por enlace. En el sitio sale el recorrido por enlace |
| **Planos y permisos** | Escritura, licencias, dictámenes y planos. Son los mismos documentos del asunto |
| **Ubicación** | Colonia, ciudad, dirección exacta, referencias y mapa |
| **Sitio** | Publicar, qué lleva y qué falta, descripción y compartir |

### Publicar

- **Guardar no publica.** Publicar es una acción aparte y se puede deshacer.
- En el sitio solo aparece lo que se autorizó a mostrar.
- **La dirección exacta es privada.** El público ve solo la colonia, salvo que se encienda mostrarla.
- Al publicar, el sistema avisa lo que falta (fotos, descripción, contrato) y deja publicar de todos modos. Un inmueble sin fotos queda publicado pero no aparece en el sitio hasta tener una; uno «retirado» tampoco aparece.
- El enlace del inmueble en el sitio usa su folio y nace al publicarlo por primera vez.
- Un inmueble de otra inmobiliaria se marca como compartido y el sitio no muestra datos de su dueño.
- Un inmueble compartido sale en el sitio y en su PDF como «En colaboración», aunque no se haya anotado el nombre de la inmobiliaria aliada.
- El sitio usa el municipio guardado del inmueble para el mapa, los datos para buscadores y los gastos de cierre. Si no se sabe el municipio, no se supone Tijuana: los gastos de cierre quedan por calcular.
- Si se cambia la operación de un inmueble publicado y su estado ya no corresponde (por ejemplo, «Rentado» al pasar a venta), queda «Libre» y sigue en el sitio; el aviso lo dice y deja deshacer.

## 8. Documentos y formatos

Fortius tiene sus propios formatos (avisos, entrevistas, contratos, recibos). Siguen la plantilla del titular: solo sus campos, sin agregar opciones jurídicas ni fiscales.

### Cómo se llena un formato

- **Por preguntas.** A un lado la pregunta; al otro la hoja real, que se va llenando y sale idéntica en PDF. Tocar la hoja sirve de atajo para ir a un dato.
- **Solo se pregunta lo que falta.**
- **Del asunto al documento:** lo que ya está capturado entra solo: nombre, teléfono, domicilio, estado civil, CURP, RFC, datos del inmueble, precio y folio.
- **Del documento al asunto:** lo que se captura al llenar un documento queda guardado en la persona, el inmueble o el asunto, y no se vuelve a pedir.
- Se guarda solo. El PDF sale aunque falten datos, con los espacios en blanco. La única excepción es el aviso de privacidad, que no sale incompleto.
- **Al terminar:** descargar, enviar por WhatsApp, cargar el firmado (en PDF o en foto) y volver al asunto.

### Reglas de los documentos

- Todo documento se puede **hacer aquí o cargar hecho por fuera**.
- **El cliente puede subir sus propios documentos** por una liga que le manda el asesor. Lo que sube entra al asunto y se marca como recibido.
- **La liga del cliente** dura 14 días, recibe hasta 60 archivos y se puede cancelar en cualquier momento. El cliente solo ve el nombre de lo que falta: no ve su asunto, ni a las demás personas, ni lo ya recibido. Deja de servir si el asunto se cierra o si el asesor que la hizo ya no está en el equipo.
- El botón **«Subir varios»** recibe muchos archivos de una vez y acomoda cada uno en su renglón por el nombre del archivo; lo que no reconoce queda en «Otros» para acomodarlo a mano.
- Las fotos se guardan sin la ubicación ni los datos del teléfono.
- **Un documento puede tener fecha de vencimiento** (una precalificación de crédito, un avalúo, un poder). El sistema avisa antes de que venza.
- Un documento ya emitido no cambia. Si los datos cambian después, el sistema avisa y ofrece hacer una versión nueva.
- **Descargar no es aprobar.** Un documento pasa de borrador a revisado y a firmado, y cada paso lo marca una persona.
- Un formato generado no es una aprobación jurídica: lo legal lo revisa el abogado.
- Los documentos son privados. No se publican ni salen del panel.
- **Leer un documento** (por ejemplo una identificación) y sacar sus datos es una ayuda: lo leído queda «por confirmar» hasta que una persona lo revise.
- **Qué vuelve a la ficha.** Lo que se contesta en un documento llena la ficha de la persona y los datos para contratos del inmueble (folio real, clave catastral, escritura, gravámenes y demás). La ficha pública del inmueble (domicilio, medidas) solo se llena donde está vacía; lo que ya tiene no lo cambia un documento. Un CURP o un RFC mal escrito se queda solo en el documento y el sistema avisa que no pasó a la ficha.
- **Lo escrito en el documento manda** sobre lo que trae el asunto; lo que el documento no tiene se toma del asunto cada vez que se abre.
- Si un formato no exige ningún dato (la opinión de valor), se pregunta todo espacio vacío.
- **Cada PDF descargado queda en los Documentos del asunto.** Si el documento cambió desde el último, queda como versión nueva; si no cambió, no se repite.
- Al cargar un contrato firmado, el asunto propone pasar a En marcha.
- Los documentos hechos en el panel tienen un lápiz en Documentos para seguir llenándolos.

## 9. Herramientas

Trabajo que se puede hacer en cualquier momento, con asunto o sin él.

- **Qué hay:** opinión de valor, cálculo de ISR, gastos del comprador, gastos del vendedor, crédito, comisión y los contratos y formatos sueltos.
- **Sin asunto:** se hace, se descarga y queda guardado en una lista de **trabajos sueltos**. Desde ahí, «Pasar a un asunto» lo lleva al asunto cuando el cliente contrata, sin volver a capturar.
- **Desde un asunto:** sale ya llena con los datos del asunto, y lo hecho queda en sus Documentos.
- La opinión de valor es un servicio, como un avalúo: se hace cuando alguien la pide.
- Todo cálculo fiscal dice de dónde sale y en qué fecha se revisó. Si no hay una regla vigente, el sistema dice «pendiente»; nunca inventa una tasa.
- **Los trabajos sueltos** los ve solo quien los hizo y el director. Uno se pasa a un asunto una sola vez y ya no cambia de asunto.
- Desde un asunto, «Nuevo» ofrece «Contrato o formato», «Herramienta» e «Informe para el cliente»; lo que se guarda va a sus Documentos.
- La lista de formatos se agrupa (contratos, para el cliente, del inmueble, entrevistas y registros, levantamiento) solo para encontrarlos rápido: ningún grupo es un orden obligatorio.
- **Gastos del vendedor** no estima el ISR: se escribe el que dé la notaría o el que salga del cálculo de ISR.
- El cálculo de ISR toma lo que falte como falta, no como cero: si no se escribe la comisión o los gastos, el resultado dice «Pendiente» y qué falta.

## 10. Biblioteca

Guarda las metodologías de Fortius, todas al mismo nivel:

- **Qué pedir:** listas de documentos según la situación (titular fallecido, inmueble con hipoteca, comprador con crédito).
- **Qué hacer:** planes según la solución (cancelar una hipoteca, tramitar un crédito, comercializar una venta o una renta).
- **Apartados propios** guardados para reutilizar.

Desde cualquier asunto, el botón **«Guardar este plan en la Biblioteca»** copia sus etapas para usarlas en otros. Así la Biblioteca se va llenando con los casos reales.

Las escribe el titular. Lo jurídico lo revisa el abogado antes de usarlo con clientes.

- Usar una guía en un asunto **copia su contenido**: en el asunto se cambia sin tocar la guía, y cambiar la guía no toca los asuntos donde ya se usó. Una lista de documentos no repite los que el asunto ya tiene.
- En un plan, cada tarea puede decir **en qué día** va, contado desde que se copia al asunto; sin día, queda sin fecha. Al guardar el plan de un asunto, sus fechas pasan a días contados desde la primera.
- Todo el equipo lee la Biblioteca y puede agregar guías. Una guía la cambia quien la hizo o el director. Solo el director la marca **«Revisado por el abogado»**.
- El contenido que trae al empezar es de ejemplo y lo dice; el titular lo cambia o lo manda a Eliminados.

## 11. Dinero

- Cada asunto lleva sus **honorarios**: el presupuesto por conceptos, el contrato y los cobros con lo que falta.
- El presupuesto separa **los honorarios de Fortius** de **los gastos de terceros** que paga el cliente (notaría, abogado, impuestos, derechos).
- Un honorario puede ser un **porcentaje del precio**: se calcula solo sobre el precio del inmueble y cambia si el precio cambia. Mientras el inmueble no tenga precio, dice que falta.
- Cuando el asunto tiene varios clientes, el presupuesto dice **quién paga**.
- Cuando el asunto tiene varios inmuebles, cada contrato y cada cobro dice **de cuál inmueble** es.
- Toda cantidad dice su moneda. **Pesos y dólares no se mezclan** ni se convierten solos.
- Cada cobro dice cuánto, cómo se pagó y cuándo. Al registrarlo, el sistema ofrece **«Hacer recibo»**, ya lleno con el monto, la persona y el asunto, en el formato de recibo de Fortius; queda en Documentos como borrador. Los recibos de un asunto se numeran solos, seguidos y sin repetirse, aunque dos se hagan al mismo tiempo.
- **El presupuesto tiene vigencia** (15 días si no se dice otra). Al enviarlo se crea sola la tarea de darle seguimiento a los tres días, y al vencer aparece en Inicio. Se puede hacer otra versión, que copia los conceptos de la anterior.
- Mientras no esté la plantilla del presupuesto del titular, el presupuesto y la opinión jurídica en PDF se cargan hechos por fuera; hacerlos desde el panel llega con su plantilla.
- **Reparto de comisión:** 25 % para quien captó y 25 % para quien vendió; si es la misma persona, 50 %.
- Si Fortius recibe un apartado, queda anotado con su comprobante hasta que se entregue.

## 12. Quién ve qué

- **Director:** ve todo, puede cambiar quién lleva cada asunto y tiene la sección Equipo. Ahí ve, por cada persona del equipo, sus asuntos abiertos, lo de hoy, lo de la semana, lo vencido, los asuntos sin siguiente paso, las solicitudes del sitio que tiene sin atender y lo que falta cobrar; «Ver» abre sus asuntos. Un aviso arriba dice cuántas solicitudes esperan a que las pase a alguien.
- **Sin siguiente paso** es un asunto abierto, que no está en espera, sin ninguna tarea pendiente en su plan.
- **Asesor:** ve solo lo suyo y lo que se le comparte. La sección Equipo no le aparece, y la dirección de un asunto ajeno le responde que no existe o no le toca verlo. Sí ve los nombres de sus compañeros, solo para mencionarlos con @ en una nota; eso no le muestra lo que lleva cada uno.
- **Abogado de Fortius:** los abogados que llevan los juicios y trámites entran al panel con su propia cuenta y llevan ahí el expediente. **Ven solo los juicios que llevan o en los que colaboran,** como un asesor ve los suyos; no ven los demás asuntos. Si ven los honorarios y los cobros de esos juicios está por decidir (sección 18).
- Esto se hace cumplir en la base de datos, no solo escondiendo botones.
- El director entra con dos pasos (contraseña y un código).
- Todo cambio queda registrado con quién lo hizo y cuándo.

## 13. Comunicación

- **Nada se envía solo.** El sistema arma el mensaje y abre WhatsApp, el teléfono o el correo; lo envía la persona.
- Dentro de cada asunto se puede comentar y mencionar a un compañero.
- Cada persona tiene su historial de llamadas, mensajes y visitas en un solo hilo.

## 14. Cómo se ve y cómo se usa

- **Aspecto:** una app moderna. Fondo gris muy claro, tarjetas blancas, un solo azul para las acciones. El verde, el ámbar y el rojo solo indican el estado de algo. Tiene tema claro y oscuro.
- **Íconos en todo:** menú, apartados, botones y menús.
- **Listas desplegables,** nunca un botón por cada opción. Con dos opciones se permite un interruptor.
- **Varias acciones en un solo botón** que abre su lista.
- **Deshacer** en lugar de preguntar «¿estás seguro?». Solo se pide confirmar lo que no tiene vuelta atrás.
- **Lenguaje sencillo,** sin palabras técnicas y sin mencionar a la inteligencia artificial. Lo que se leyó de un documento dice «por confirmar».
- **Fechas como se dicen:** «hoy», «mañana», «jue 19 nov». Todas las fechas se cuentan con la hora de Tijuana: lo anotado en la noche queda con la fecha de ese día.
- **Funciona igual en computadora y en teléfono.**
- **Accesible:** se puede usar con teclado, los botones son grandes en el teléfono y el estado de algo se entiende sin depender solo del color.
- Los datos de ejemplo siempre dicen que son de ejemplo.

### Las ventanas

Los apartados de un asunto y la ficha de un inmueble se abren en una ventana, sin perder de vista dónde se estaba.

- **Regresar:** toda ventana tiene una flecha ← que regresa a la ventana anterior: de la ficha de un local a la lista de locales, o de Honorarios a la Opinión jurídica desde la que se llegó. Si no hay ventana anterior, la flecha cierra la ventana y deja a la vista el asunto o la sección de donde se abrió.
- **Lo que se abre aparte regresa a su lugar:** un formato, una herramienta o un informe que se abre desde un asunto regresa a ese asunto al cerrarlo. El contrato que se hace desde Honorarios regresa a Honorarios.
- **Dónde se abre:** un botón en la cabecera de la ventana abre una lista con cuatro opciones:

| Opción | Cómo se ve |
| --- | --- |
| **A la derecha** | La ventana ocupa el lado derecho y lo demás sigue a la vista. Así empieza |
| **A la izquierda** | Lo mismo, del otro lado |
| **Al centro** | Una ventana grande en medio, con lo demás atenuado detrás |
| **Pantalla completa** | Ocupa toda la pantalla |

- **El panel recuerda** la opción elegida y abre así las siguientes ventanas, hasta que se cambie. Es de cada persona, en cada equipo que use.
- Junto a ese botón hay otro para pasar a **pantalla completa y volver** con un toque.
- **En el teléfono** toda ventana se abre a pantalla completa y esos dos botones no aparecen.
- Los formatos por preguntas y los informes para el cliente se abren siempre a pantalla completa, porque llevan la hoja a un lado.

### Las notas del asunto

Las notas son **del asunto**, no de un apartado. Se escriben y se leen desde cualquier ventana del asunto, en un costado que siempre está a la mano.

- **Escribir:** con **@** se menciona a una persona del asunto y con **#** a un apartado; la mención queda como enlace que abre esa ficha o ese apartado. Al escribir desde la ficha de alguien, la nota queda ligada a esa persona sin tener que mencionarla.
- **Nota o decisión:** un interruptor marca la nota como decisión.
- **Ver:** lo más nuevo arriba. Una lista desplegable elige ver todas, las de ese apartado o las que mencionan a la persona abierta. La ficha de cada persona dice cuántas notas la mencionan.
- **Fijar:** cada nota tiene una chincheta que la deja arriba de todas, para tener a la vista lo que no se debe olvidar (por ejemplo, «el heredero vive en Estados Unidos y firma por poder»). Se suelta con la misma chincheta. Hasta 10 por asunto; con 10, hay que soltar una para fijar otra. Quién fijó o soltó una nota queda en el Historial.
- Son las mismas notas del **Historial** y, como ellas, no se cambian ni se borran: lo único que cambia es si van fijadas.
- **Nunca salen** en informes ni documentos para el cliente.
- En el teléfono el costado se abre con un botón de la cabecera de la ventana.

El boceto aprobado es la referencia de cómo se ve cada pantalla.

### Lo de todos los días

Lo que se usa a diario, en pocas palabras:

- **Escribir en una línea:** en el buscador o en el Plan se escribe «Llamar a Laura jueves 10am» y el panel separa qué hacer, el día, la hora y con quién, y lo enseña antes de guardar. En el buscador se entiende como tarea cuando empieza con lo que hay que hacer («Llamar…», «Pedir…», «Firmar…»); un nombre o una calle («Domingo Pérez», «5 de Mayo») se busca. En el Plan la tarea queda en ese asunto. En el buscador se guarda en el asunto de esa persona; si tiene varios, o no se reconoció a nadie, se elige el asunto en una lista desplegable. Si no se entendió el día o la hora, la tarea se guarda igual, sin fecha.
- **Dictar:** un micrófono en el buscador, en las notas, en el Plan y en «Qué pasa» de la consulta. Lo dicho se escribe en el cuadro y se puede corregir antes de guardar. Solo funciona en los navegadores que lo permiten; donde no, el micrófono no aparece.
- **El buscador** encuentra asuntos, personas e inmuebles por nombre, folio, teléfono o correo, y desde ahí se crea: una tarea en una línea, una consulta nueva, un inmueble o una persona. Una persona con un solo asunto abre su ficha en ese asunto; con varios, el Directorio. Sin escribir nada muestra los favoritos y los recientes.
- **Favoritos:** una estrella en el asunto y en la ficha del inmueble. Los favoritos salen arriba de los recientes en el menú y en el buscador, y te siguen en cualquier equipo. Hasta 30.
- **Vistas guardadas:** en la lista de Asuntos, un menú guarda la búsqueda y los filtros de ese momento con un nombre, para volver a ellos con un toque; también los borra. Cada quien tiene las suyas.
- **Comentarios y menciones:** en una nota, con **@** se menciona también a alguien del equipo (cualquiera lo puede hacer, también un asesor); la persona mencionada la ve en «Para ti» aunque no lleve ese asunto.
- **Recordatorios:** junto a «Inicio» en el menú, un número con lo que te toca hoy o ya venció, las solicitudes del sitio que te esperan y lo nuevo de «Para ti». Con el panel abierto se revisa cada cinco minutos. Si en Configuración → Avisos das permiso a este navegador, también avisa en la pantalla: una hora antes de una cita, cuando entra una solicitud, cuando te mencionan o te dejan una tarea y, una vez al día, lo que se te pasó. Cada aviso respeta su interruptor. Con el panel cerrado no avisa todavía.

## 15. Funciones, en orden

**Primero** (lo que se usa todos los días):

- Escribir en una línea: «Llamar a Laura jueves 10am» crea la tarea en su asunto.
- Dictar en lugar de escribir.
- Buscar y actuar desde un solo cuadro.
- Guardar una vista o un filtro con nombre, para volver a él con un toque.
- Favoritos y recientes.
- Recordatorios de vencimientos.
- Regresar a la ventana anterior y elegir dónde se abre cada ventana.
- Informes para el cliente desde su asunto.
- Tiempo que lleva esperando quien escribió.
- Comentarios y menciones.
- Un solo lugar con todo lo que te mencionaron o asignaron.
- Una liga para que el cliente suba sus documentos.

**Después:**

- Leer documentos y sacar sus datos.
- Resumen del asunto en tres líneas.
- Redactar el mensaje para el cliente con los datos del asunto.
- Que el cliente vea el avance de su asunto en esa misma liga: ahí aparece el último informe que se le mandó.

**Más adelante:**

- Capturar por WhatsApp.
- Reglas automáticas sencillas: «cuando pase esto, avisa aquello».
- Repartir solas las consultas nuevas entre asesores.
- Que Inicio sugiera el orden del día.
- Hacerle preguntas al sistema sobre sus propios datos.
- Chat del equipo.
- Presupuesto que el cliente acepta en línea.
- Agregar datos nuevos a personas o inmuebles sin programar.

**Solo con el visto bueno del abogado:**

- Firma electrónica.
- Grabar y transcribir llamadas.

**No se hará por ahora:**

- Programas que trabajen solos sin que una persona decida.

## 16. Seguridad y cuidado de los datos

- Los datos personales son privados. No se muestran en el sitio, ni en registros, ni en documentos del proyecto.
- Si dos personas cambian lo mismo a la vez, el sistema avisa y no borra en silencio el trabajo de nadie.
- Lo que se borra se puede recuperar.
- Hay una copia de respaldo todos los días.
- **Hoy la base tiene solo datos de prueba.** Se pueden crear y borrar ensayos, siempre marcados como ejemplo. Nunca se mandan mensajes a personas reales. Esto termina el día que se cargue el inventario real.
- Las claves y contraseñas del sistema nunca se muestran ni se guardan en el proyecto.

## 17. El sitio público

- Conserva su diseño y su marca actuales hasta que el titular pida cambiarlos.
- Solo muestra lo publicado y lo autorizado.
- Sus formularios mandan las solicitudes al panel.

## 18. Lo que falta decidir

- Si hace falta una **agenda** propia para las citas con hora, o basta con Inicio y el Plan.
- Dónde caen los **archivos que llegan sueltos**, sin saber de qué asunto son.
- Qué ve exactamente un asesor de los asuntos e inmuebles **de otro asesor**.
- El **contenido que sube el titular**: la plantilla del presupuesto de honorarios, las listas y los planes de la Biblioteca, y los datos que quiere por cada tipo de inmueble. Mientras tanto se usa lo del boceto como ejemplo.
- Lo que revisa el **abogado**: los contratos de renta y de compraventa a plazos, el aviso de privacidad y el uso de la lectura de documentos con clientes reales.
- Si los **abogados de Fortius** ven los honorarios y los cobros de los juicios que llevan, y qué más pueden hacer dentro de ellos.
- Cómo se maneja el **dinero de las rentas** que Fortius cobra por cuenta del dueño (dónde se recibe, cómo se liquida, qué facturas e impuestos lleva): lo revisan el abogado y un contador antes de construirlo.
- Cómo se lleva en el panel un **juicio o trámite** (número de expediente, etapa, términos), y si el encargo de un asunto necesita una opción propia para eso.

## 19. Cómo se cambia este documento

Este documento y `PLAN.md` son la versión de hoy. Pueden cambiar, pero con orden, para que nunca digan dos cosas distintas.

- **Si el titular pide algo que contradice lo escrito, el agente se lo dice antes de hacerlo:** «eso contradice esto otro», señalando la parte exacta.
- **Después le pregunta qué prefiere:**
  - **Cambiarlo aquí mismo,** si es un ajuste chico: se corrige el texto en la misma rama de trabajo y se sigue.
  - **Abrir una rama nueva,** si el cambio es grande o va en otra dirección: en esa rama se modifican este documento, el plan y lo que haga falta, sin tocar la versión en la que se está trabajando. Cuando el titular la aprueba, reemplaza a la anterior.
- **Nunca se deja una contradicción escrita.** Cuando una regla cambia, la anterior se borra; no se guardan las dos.
- **El agente también propone.** Si ve una mejor forma de lograr lo que el titular busca, o nota que falta algo, se lo sugiere con su razón. El titular decide.
- Una «rama» es una copia de trabajo aparte del proyecto: permite probar un cambio sin alterar lo que ya está aprobado.
