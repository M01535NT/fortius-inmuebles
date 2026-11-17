# Fortius — cómo debe funcionar el sistema

Este documento describe el sistema completo: qué es, qué partes tiene y qué reglas sigue. Lo decide Moisés Núñez Tonalá, el titular. Si el código hace algo distinto a lo que dice aquí, se corrige el código.

**Actualizado:** 16 de noviembre de 2026.

**Esta es la versión vigente al día de hoy.** No es definitiva: va a cambiar conforme el sistema se use y el titular decida cosas nuevas. Cómo se cambia está en la sección 19.

**Archivos que lo acompañan:**

| Archivo | Para qué sirve | Dónde está |
| --- | --- | --- |
| `PLAN.md` | Qué falta por hacer y en qué vamos | En la carpeta principal del proyecto |
| El boceto | Cómo se ve y cómo responde el panel. Se abre en el navegador y funciona con datos de ejemplo | `docs/boceto-fortius-por-asuntos.html` |
| Los casos reales | Los casos que el panel debe poder llevar de principio a fin | `docs/casos-reales.md` |
| Las metodologías | Guías de trabajo que se copian a un asunto | `docs/metodologias/` |

---

## 1. Qué es

Un solo producto con dos caras:

- **El sitio público** de Fortius Inmuebles (fortiusinmuebles.com), donde la gente ve inmuebles y pide informes.
- **El panel**, donde Fortius lleva todo su trabajo: quién llamó, qué asunto se abrió, qué documentos hay, qué sigue, qué se cobró y qué se publica en el sitio.

Es exclusivo de Fortius y lleva solo su marca.

## 2. Las ideas que mandan

1. **Sirve para cualquier caso inmobiliario.** Una venta normal, una casa en sucesión e invadida, un terreno con sentencia, una asesoría por etapas, una renta de varios locales o un puro trámite. Si un caso real no cabe, se cambia el sistema; no se fuerza el caso.
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
| **Inicio** | Lo que hay que atender: quién espera respuesta, lo de hoy, lo de la semana, lo que se espera de otros, lo que lleva más días esperando y lo que falta cobrar |
| **Asuntos** | Todos los trabajos abiertos y cerrados |
| **Inmuebles** | El inventario, y todo lo que sale en el sitio público |
| **Directorio** | Todas las personas, con el asunto del que viene cada una. Incluye los contactos que todavía no tienen asunto |
| **Biblioteca** | Las metodologías: listas de qué pedir y planes de qué hacer |
| **Herramientas** | Opinión de valor, cálculos y contratos que se pueden hacer en cualquier momento |
| **Equipo** | Solo para el director: cómo va cada asesor |

En el menú también hay un buscador, los asuntos recientes y la cuenta de quien entró. El botón «Nueva consulta» está en Inicio y en la lista de Asuntos.

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

- **Quién atiende una solicitud del sitio:** le llega al director, que la asigna a un asesor con el botón «Pasar a…». El tiempo de espera se pone en rojo al pasar de dos horas.
- **Si la solicitud es por un inmueble publicado,** queda además anotada en el apartado Interesados del asunto de ese inmueble.

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

No abren asunto por sí solas una visita, un archivo que llega o un cambio de precio.

### Lo que tiene todo asunto

- **Un folio** que pone el sistema (ejemplo: EXP-000031). No se repite ni se reutiliza.
- **Un nombre** que se puede cambiar.
- **Qué encargaron:** revisar, comercializar, tramitar o asesorar. Puede ser más de una cosa.
- **En qué va:** en estudio, propuesta, en marcha, por cobrar o cerrado. Además, cualquier asunto se puede poner **en espera**, con el motivo y la fecha para retomarlo; mientras tanto no cuenta como atrasado. Lo cambia el asesor cuando quiere; no hay pasos forzosos. El sistema lo propone en el momento oportuno y el asesor acepta con un toque: al cargar el contrato firmado, «¿Pasar a En marcha?»; al cobrar todo, «¿Cerrar el asunto?». Nunca lo cambia solo.
- **Quién lo lleva:** un asesor responsable. El director puede cambiarlo.
- **Lo que sigue:** la próxima tarea, siempre a la vista, con marcar hecha y posponer. Si no hay, el asunto lo dice y pide escribirla.

### Los apartados

Las partes de un asunto se llaman **apartados**. Cada uno es un renglón con su ícono y un resumen; al tocarlo se abre una ventana a un lado, sin salir del asunto.

- **Siempre están:** Personas, Plan e Historial.
- **Los demás** aparecen según lo que encargaron, y se **agregan o se quitan** cuando convenga. Quitar un apartado solo lo oculta; lo capturado se conserva.
- Lo que no se encargó no aparece ni se reclama.

| Apartado | Qué lleva |
| --- | --- |
| **Personas** | Todas las personas del asunto, cada una con su papel: contacto, propietario, titular, heredero, copropietario, comprador, vendedor, inquilino, inversionista, contraparte, abogado o notaría |
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
- Una tarea puede esperar a que termine otra, y puede repetirse (por ejemplo, un informe cada mes).
- El plan se ve como lista o en una línea de tiempo.
- Las tareas con fecha aparecen solas en Inicio.
- **Toda tarea que le toca a otro** (el cliente, el abogado, la notaría) nace con una fecha de «volver a preguntar», para que no se quede dormida.
- Esa tarea trae un botón **«Recordarle»**, que abre WhatsApp con el mensaje ya escrito.
- Inicio muestra lo que lleva más días esperando a otra persona, empezando por lo que más tarda.

### Cerrar un asunto

Un asunto se cierra como **se logró** o **no se dio**, con el motivo. Al cerrar se anota quién captó y quién vendió. Un asunto cerrado se puede reabrir.

Cuando un trabajo termina y de él nace otro (una revisión que se vuelve venta, una asesoría que termina en vender), el botón **«Continuar en un asunto nuevo»** copia las personas, el inmueble y los documentos, y deja anotado en los dos de dónde viene cada uno.

## 6. Personas

- Cada persona se captura **una sola vez**. Si llega un teléfono o un correo que ya existe, el sistema avisa y ofrece usar la misma ficha.
- Una persona puede ser **una empresa o una institución** (una sociedad dueña de una nave, una notaría, un banco), con su representante y los datos de ambos.
- Una persona puede marcarse como **fallecida**: se conserva para los documentos, sin teléfono ni botones de contacto.
- Los teléfonos aceptan **clave de otro país**, para quien vive fuera de México.
- Una persona puede tener **papeles distintos** en asuntos distintos.
- Una persona puede estar en el Directorio **sin asunto**, como contacto, con una fecha para volver a llamarle.
- Desde el Directorio, el botón **«Nuevo asunto con esta persona»** abre la consulta con sus datos ya puestos.
- **Cliente** es quien ya firmó un contrato con Fortius. Antes de firmar es prospecto. La contraparte de un asunto no es cliente.
- Si una persona **pidió no ser contactada**, todas las pantallas lo respetan: se apagan los botones de llamar y escribir.
- Sus datos para contratos (nombre completo, estado civil, CURP, RFC, identificación, domicilio) se guardan en su ficha y de ahí los toman los documentos.
- El CURP y el RFC se muestran ocultos y no salen del panel.

## 7. Inmuebles

Inmuebles es también el panel de lo que sale en el sitio público: aquí se carga todo.

- Cada inmueble lleva un **folio** que pone el sistema (ejemplo: FORTIUS-000011).
- **Un inmueble siempre pertenece a un asunto.** Al agregar uno desde Inmuebles se piden sus datos y los del propietario, y con eso se abre solo su asunto.
- **Tipos:** casa, departamento, terreno, local, oficina, nave o bodega, y plaza o conjunto.
- Un inmueble puede **pertenecer a un conjunto**: los locales de una plaza se ligan a su plaza, que dice cuántos tiene en total y cuántos están libres.
- **El precio dice su moneda** (pesos o dólares) y guarda su **historial**: cada cambio, con quién lo hizo, cuándo y por qué.
- Se pueden **elegir varios inmuebles a la vez** para publicarlos, compartirlos o cambiarles el estado.

### La ficha del inmueble

| Pestaña | Qué lleva |
| --- | --- |
| **Ficha técnica** | Nombre, tipo, venta o renta y precio; después los datos propios de su tipo. Una nave pide altura libre, carga eléctrica, andenes y uso de suelo; una casa pide recámaras, baños y estacionamientos |
| **Fotos** | Se suben varias a la vez y se elige la portada |
| **Video y 360** | Video y recorrido 360, subidos o por enlace |
| **Planos y permisos** | Escritura, licencias, dictámenes y planos. Son los mismos documentos del asunto |
| **Ubicación** | Colonia, ciudad, dirección exacta, referencias y mapa |
| **Sitio** | Publicar, qué lleva y qué falta, descripción y compartir |

### Publicar

- **Guardar no publica.** Publicar es una acción aparte y se puede deshacer.
- En el sitio solo aparece lo que se autorizó a mostrar.
- **La dirección exacta es privada.** El público ve solo la colonia, salvo que se encienda mostrarla.
- Al publicar, el sistema avisa lo que falta (fotos, descripción, contrato) y deja publicar de todos modos.
- Un inmueble de otra inmobiliaria se marca como compartido y el sitio no muestra datos de su dueño.

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
- El botón **«Subir varios»** recibe muchos archivos de una vez y acomoda cada uno en su renglón de la lista.
- **Un documento puede tener fecha de vencimiento** (una precalificación de crédito, un avalúo, un poder). El sistema avisa antes de que venza.
- Un documento ya emitido no cambia. Si los datos cambian después, el sistema avisa y ofrece hacer una versión nueva.
- **Descargar no es aprobar.** Un documento pasa de borrador a revisado y a firmado, y cada paso lo marca una persona.
- Un formato generado no es una aprobación jurídica: lo legal lo revisa el abogado.
- Los documentos son privados. No se publican ni salen del panel.
- **Leer un documento** (por ejemplo una identificación) y sacar sus datos es una ayuda: lo leído queda «por confirmar» hasta que una persona lo revise.

## 9. Herramientas

Trabajo que se puede hacer en cualquier momento, con asunto o sin él.

- **Qué hay:** opinión de valor, cálculo de ISR, gastos del comprador, gastos del vendedor, crédito, comisión y los contratos y formatos sueltos.
- **Sin asunto:** se hace, se descarga y queda guardado en una lista de **trabajos sueltos**. Desde ahí, «Pasar a un asunto» lo lleva al asunto cuando el cliente contrata, sin volver a capturar.
- **Desde un asunto:** sale ya llena con los datos del asunto, y lo hecho queda en sus Documentos.
- La opinión de valor es un servicio, como un avalúo: se hace cuando alguien la pide.
- Todo cálculo fiscal dice de dónde sale y en qué fecha se revisó. Si no hay una regla vigente, el sistema dice «pendiente»; nunca inventa una tasa.

## 10. Biblioteca

Guarda las metodologías de Fortius, todas al mismo nivel:

- **Qué pedir:** listas de documentos según la situación (titular fallecido, inmueble con hipoteca, comprador con crédito).
- **Qué hacer:** planes según la solución (cancelar una hipoteca, tramitar un crédito, comercializar una venta o una renta).
- **Apartados propios** guardados para reutilizar.

Desde cualquier asunto, el botón **«Guardar este plan en la Biblioteca»** copia sus etapas para usarlas en otros. Así la Biblioteca se va llenando con los casos reales.

Las escribe el titular. Lo jurídico lo revisa el abogado antes de usarlo con clientes.

## 11. Dinero

- Cada asunto lleva sus **honorarios**: el presupuesto por conceptos, el contrato y los cobros con lo que falta.
- El presupuesto separa **los honorarios de Fortius** de **los gastos de terceros** que paga el cliente (notaría, abogado, impuestos, derechos).
- Un honorario puede ser un **porcentaje del precio**: se calcula solo cuando se conoce el precio final.
- Cuando el asunto tiene varios clientes, el presupuesto dice **quién paga**.
- Cuando el asunto tiene varios inmuebles, cada contrato y cada cobro dice **de cuál inmueble** es.
- Toda cantidad dice su moneda. **Pesos y dólares no se mezclan** ni se convierten solos.
- Cada cobro dice cuánto, cómo se pagó y cuándo. Al registrarlo, el sistema ofrece **«Hacer recibo»**, ya lleno con el monto, la persona y el asunto.
- **El presupuesto tiene vigencia.** Al enviarlo se crea sola la tarea de darle seguimiento a los tres días, y al vencer aparece en Inicio.
- **Reparto de comisión:** 25 % para quien captó y 25 % para quien vendió; si es la misma persona, 50 %.
- Si Fortius recibe un apartado, queda anotado con su comprobante hasta que se entregue.

## 12. Quién ve qué

- **Director:** ve todo, puede cambiar quién lleva cada asunto y tiene la sección Equipo. Ahí ve, por cada asesor, sus asuntos, lo de hoy, lo de la semana, lo vencido, lo que no tiene siguiente paso y lo que falta cobrar.
- **Asesor:** ve solo lo suyo y lo que se le comparte.
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
- **Fechas como se dicen:** «hoy», «mañana», «jue 19 nov».
- **Funciona igual en computadora y en teléfono.**
- **Accesible:** se puede usar con teclado, los botones son grandes en el teléfono y el estado de algo se entiende sin depender solo del color.
- Los datos de ejemplo siempre dicen que son de ejemplo.

El boceto aprobado es la referencia de cómo se ve cada pantalla.

## 15. Funciones, en orden

**Primero** (lo que se usa todos los días):

- Escribir en una línea: «Llamar a Laura jueves 10am» crea la tarea en su asunto.
- Dictar en lugar de escribir.
- Buscar y actuar desde un solo cuadro.
- Guardar una vista o un filtro con nombre, para volver a él con un toque.
- Favoritos y recientes.
- Recordatorios de vencimientos.
- Tiempo que lleva esperando quien escribió.
- Comentarios y menciones.
- Un solo lugar con todo lo que te mencionaron o asignaron.
- Una liga para que el cliente suba sus documentos.

**Después:**

- Leer documentos y sacar sus datos.
- Resumen del asunto en tres líneas.
- Redactar el mensaje para el cliente con los datos del asunto.
- Que el cliente vea el avance de su asunto en esa misma liga.

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

## 19. Cómo se cambia este documento

Este documento y `PLAN.md` son la versión de hoy. Pueden cambiar, pero con orden, para que nunca digan dos cosas distintas.

- **Si el titular pide algo que contradice lo escrito, el agente se lo dice antes de hacerlo:** «eso contradice esto otro», señalando la parte exacta.
- **Después le pregunta qué prefiere:**
  - **Cambiarlo aquí mismo,** si es un ajuste chico: se corrige el texto en la misma rama de trabajo y se sigue.
  - **Abrir una rama nueva,** si el cambio es grande o va en otra dirección: en esa rama se modifican este documento, el plan y lo que haga falta, sin tocar la versión en la que se está trabajando. Cuando el titular la aprueba, reemplaza a la anterior.
- **Nunca se deja una contradicción escrita.** Cuando una regla cambia, la anterior se borra; no se guardan las dos.
- **El agente también propone.** Si ve una mejor forma de lograr lo que el titular busca, o nota que falta algo, se lo sugiere con su razón. El titular decide.
- Una «rama» es una copia de trabajo aparte del proyecto: permite probar un cambio sin alterar lo que ya está aprobado.
