# AUD-07: recorrido del asesor antes del lanzamiento (16/11/2026)

**Quién:** el agente, como tester, con tres revisores de solo lectura para el código.

**Qué revisó:**
- Las pantallas de `/panel` en 127.0.0.1:3001 con la sesión de dirección, en escritorio (1440 px) y en teléfono (375 px): las 13 secciones, las fichas de persona, inmueble y asunto, un trámite, un borrador de formato y los formularios de alta.
- El código de `src/app/panel/`, `src/components/panel/` y `src/lib/panel/`, contra `DECISIONES.md`.

**No hizo:** no guardó, creó, envió ni borró nada, y no cambió código. No corrió lint, tipos ni pruebas. No entró con una cuenta de asesor (solo dirección).

**Cómo leer la columna «Prueba»:**
- **Visto:** lo vi en el navegador.
- **Código:** lo leyó un revisor y yo repasé la línea.
- **Revisor:** lo leyó un revisor en el código y no lo repasé; conviene confirmarlo al corregir.

**Gravedad:** Alta = el asesor pierde tiempo todos los días, se equivoca o un dato queda mal. Media = estorba. Baja = pulido.

## Primera impresión

El panel ya se siente una app: «Lo que sigue» arriba de cada ficha, Deshacer en casi todo y captura en una línea funcionan bien. Lo que falla es otra cosa: **cada ficha enseña todo desde el primer segundo, los avisos avisan de todo a la vez y las pantallas no se pasan la estafeta**. El asesor termina una acción y tiene que ir a otra sección a buscar a la misma persona.

Son 86 hallazgos. Se agrupan en siete temas; los tres primeros resuelven la mayor parte del amontonamiento.

## Tema 1. Las fichas enseñan todo desde el primer momento

La regla que propongo para las tres fichas (persona, inmueble, asunto), igual en teléfono y escritorio:

1. **Arriba, lo de hoy:** con quién hablo (Llamar, WhatsApp), lo que sigue (Hecho, Posponer) y Anotar.
2. **En medio, lo que se consulta:** un resumen corto de 3 o 4 renglones, cada uno abre su detalle.
3. **Plegado, lo que se captura una vez:** datos para contratos, privacidad, publicar, informe, cierre, quién captó. Una fila con su estado («Para contratos · faltan 5») que se abre al tocarla.
4. **En el menú ⋯, lo raro:** archivar, pasar a otro asesor, unir, copiar enlace.

| # | Dónde | Qué pasa | Propuesta | Gravedad | Prueba |
| --- | --- | --- | --- | --- | --- |
| 1 | Persona, escritorio | La columna de datos queda siempre abierta: 14 a 16 renglones, la mayoría «Sin dato · Agregar» (estado civil, CURP, RFC, identificación, domicilio) aunque sea un comprador en su primera llamada. | Dejar Contacto a la vista. «Para contratos · faltan 5» y «Privacidad · pendiente» en una fila cada una, que se abre al tocarla. Choca con «Ningún dato vacío se oculta» de `DECISIONES.md`: hay que decidir. | Alta | Visto |
| 2 | Persona | Anotar una llamada está en la tercera pestaña (Historial). El botón Llamar no ofrece anotar. | Fila «Anotar» debajo de «Lo que sigue». Al volver de una llamada, preguntar «¿Cómo te fue?» con la hoja que ya existe. | Alta | Revisor |
| 3 | Persona | Citas y asuntos de la persona van al fondo del Resumen; arriba queda «Qué busca» en cuatro celdas. | Citas y asuntos primero. «Qué busca» en una línea con Editar. | Media | Visto y revisor |
| 4 | Persona, teléfono | La cabecera ocupa 520 de 812 px: el ⋯ va solo en un renglón y «prefiere llamada» se dice tres veces (etiqueta, texto y punto). | ⋯ junto al nombre. Quitar el renglón «Prefiere llamada». | Media | Visto |
| 5 | Inmueble, Resumen | Empieza por «Cómo va» e «Informe al propietario», vacíos en un inmueble sin publicar. Propietario sin Llamar ni WhatsApp. Visitas al final. «Visita» arriba y «Agendar» abajo hacen lo mismo. | Orden: Visitas → Propietario y llaves (con Llamar y WhatsApp) → Cómo va. Informe al ⋯. Un solo botón de agendar. | Alta | Visto |
| 6 | Inmueble, pestañas | Publicar está repartido: el interruptor en Resumen; las fotos y los textos del sitio al fondo de Datos, después de 14 renglones y dos calculadoras. | Una pestaña «Sitio» con todo lo público en orden: Fotos, Textos, Dirección, Publicar. Datos queda solo con datos. | Alta | Visto |
| 7 | Inmueble | El asunto del inmueble está escondido al fondo de la pestaña Docs. | Subirlo al Resumen, primer renglón. | Media | Visto |
| 8 | Inmueble | El nombre sale tres veces (ventana, cabecera y bajo el precio) y en escritorio hay dos ⋯ pegados. | Un nombre y un solo ⋯. | Baja | Visto |
| 9 | Asunto, teléfono | El Resumen repite a la persona con Llamar y WhatsApp (ya está 300 px arriba), enseña «Quién captó y quién vendió» con su botón desde el primer día y deja la caja de nota al final, tras seis bloques. | Nota y últimas 3 notas arriba. Personas e Inmueble en dos renglones compactos. «Captó y vendió» dentro de «Cerrar el asunto». «Lo lleva» al ⋯. | Alta | Visto y revisor |
| 10 | Asunto, escritorio | Abre en la pestaña «Guías», que está vacía y cuyo botón solo avisa. Hay 5 pestañas; lo escrito dice 3. En el teléfono las pestañas son otras y se llaman distinto. | Quitar Guías hasta que exista. Abrir en Resumen. Mismas pestañas y nombres en los dos tamaños. | Alta | Visto y revisor |
| 11 | Asunto, Actividad | «Checklist documental actualizado» sale 4 veces en el mismo minuto, sin decir qué documento cambió. | Juntar en un renglón y nombrar el documento («Predial: recibido»). | Media | Visto |
| 12 | Consulta | Antes de la respuesta va el bloque Persona; hay dos botones azules («Atender yo» y, si no existe, «Crear persona») y la ficha se enlaza arriba y otra vez abajo. | Orden: mensaje → respuesta, con WhatsApp como único botón principal → volver a contactar → persona en una fila plegada → notas. Cerrar y copiar enlace al ⋯. | Alta | Visto y revisor |
| 13 | Trámite | Unas 20 acciones a la vista. | Visible: la espera con «Anotar respuesta» y el paso actual con «Cerrar el paso». Lo demás al ⋯. Pasos listos plegados en «3 pasos listos». | Media | Revisor |
| 14 | Captura de formatos | Seis botones por cada espacio (Listo, Borrar, Descartar, Siguiente, Dictar, Usar). Un «Guardar» que no guarda nada porque ya se guarda solo. Lista «Faltan» de hasta 40 renglones. | Campo, «Listo» y ⋯. Texto «Se guarda solo» en lugar del botón. «Faltan» plegada a 5. | Media | Revisor |
| 15 | Bandeja | El detalle de un archivo pide ocho controles y cada fila repite el mismo aviso. | Un solo campo «¿A dónde va?» que busca asuntos, inmuebles y personas. El aviso, una vez arriba. | Media | Revisor |
| 16 | Cita | Mover, Cambiar datos y Cancelar salen también en citas que ya pasaron. El lugar solo se cambia editando las notas. | Una acción principal según el momento (futura: Cómo llegar; pasada: Anotar cómo fue). Campo «Dónde». | Media | Revisor |
| 17 | Hoy | Desplegable «Qué ver» y además botón Filtrar para un solo filtro. «Ver los 6 restantes» y «6 vencidos más · Revisar», uno bajo el otro. | Un solo control. Un solo enlace. | Baja | Visto |
| 18 | Todas las listas | La leyenda de atajos de teclado queda fija al pie (y otra arriba en Agenda). | Detrás de la tecla «?» o de un enlace «Atajos». | Baja | Visto |

## Tema 2. Los avisos avisan de todo a la vez

«Nada frena, solo avisa» está bien resuelto, pero hoy avisa de todo, siempre. Cuando todo está en ámbar o en rojo, nada destaca.

| # | Dónde | Qué pasa | Propuesta | Gravedad | Prueba |
| --- | --- | --- | --- | --- | --- |
| 19 | Inmuebles | 16 de 16 inmuebles tienen aviso: una banda arriba y un renglón ámbar en cada fila. A uno en captación se le reclama contrato y fotos. | Avisar según el momento: en captación, nada; al publicar, lo de publicar. En la lista, un punto con número en lugar del renglón. | Alta | Visto |
| 20 | Asunto | 7 avisos en un asunto recién abierto. Tres dicen lo mismo (faltan documentos). Para callarlos hay que pulsar «Seguir así» siete veces. «Sin inmueble ligado» y «Falta registrar la firma» no traen el botón que lo arregla. | Un aviso por causa, cada uno con su arreglo («Ligar inmueble»). «Seguir así con todos». | Alta | Visto |
| 21 | Asunto | La lista dice «4 avisos» y la ficha del mismo asunto dice «7 avisos». | Una sola cuenta. | Media | Visto |
| 22 | Inmueble | «Sin contrato de intermediación firmado» sigue saliendo aunque el contrato esté subido en el asunto: lee otra lista. | Ver hallazgo 44. | Alta | Código |
| 23 | Asunto de búsqueda | Un comprador nace con «Faltan 7 documentos» del propietario y «Sin inmueble ligado». | Sin lista de documentos del propietario en una búsqueda. | Media | Revisor |
| 24 | Hoy | Con 10 solicitudes sin responder, salen en la línea ámbar y otra vez fila por fila. Las recién llegadas quedan al final, debajo de lo de hoy. En el teléfono no se ve cuánto llevan esperando. | Con más de 3, una sola línea con el tiempo de la que más espera. Las nuevas, después de lo vencido. El tiempo, también en el teléfono. | Alta | Visto y código |
| 25 | Consultas | Las diez dicen «Espera hace N días» en rojo, la de 33 días arriba y la de 2 días al final. La fila no dice qué pidió ni por cuál inmueble. | Lo reciente arriba; lo que lleva días, plegado. Segundo renglón con el inmueble o las primeras palabras. | Media | Visto |
| 26 | Hoy sin señal | Cada bloque que falla pinta su tarjeta de error: hasta 7 apiladas. | Una línea: «No se pudo leer: tareas, consultas · Reintentar». | Media | Revisor |

## Tema 3. Cada pantalla acomoda sus controles a su manera

El asesor aprende una pantalla y la siguiente está acomodada distinto.

| # | Dónde | Qué pasa | Propuesta | Gravedad | Prueba |
| --- | --- | --- | --- | --- | --- |
| 27 | Listas | Cinco barras distintas. Personas: buscador y Filtrar, luego «Ver». Consultas: «Ver», «Lo lleva» y buscador apilados (en el teléfono, 250 px antes de la primera fila). Inmuebles: buscador arriba a la derecha. Asuntos: todo en un renglón, con ventana propia para filtrar. Trámites: otra más. | Una barra para todas: buscador, la vista en un desplegable y un botón Filtrar que guarda «Lo lleva» y el orden. | Media | Visto |
| 28 | Crear | Se llama «Nuevo», «Nueva», «Nuevo asunto», «Nueva cita» o es un «+» gris, según la pantalla. | El mismo botón en el mismo lugar. | Media | Visto |
| 29 | Vistas | Desplegable en Asuntos, Consultas y Dinero; pestañas en Formatos y dentro del trámite. `DECISIONES.md` se contradice (dice «pestañas» en Consultas y Dinero, y la regla general pide desplegable). | Una regla: las vistas de una lista, en desplegable; las secciones de una ficha, en pestañas. | Media | Visto |
| 30 | Fichas, teléfono | Tres contenedores: la persona es una página, el inmueble una hoja desde abajo y el asunto pantalla completa. Los nombres cambian: «Documentos» y «Docs»; «Historial» y «Actividad». | Las tres a pantalla completa con «‹ volver». Mismos nombres y orden: Resumen, Datos, Documentos, Historial. | Media | Visto |
| 31 | Pestañas | Subrayadas en persona y asunto; de pastilla en inmueble y en persona en el teléfono. | Un solo estilo. | Baja | Visto |
| 32 | Menús ⋯ | Orden y contenido distintos en cada ficha. Un asunto archivado no se recupera pasado el Deshacer: no hay «Ver archivados» (Personas e Inmuebles sí lo tienen). | Mismo orden: editar, copiar enlace, lo propio, archivar. «Ver archivados» en Asuntos. | Media | Revisor |
| 33 | Ventanas | Con «Abrir en grande» recordado, todo abre gigante: el selector «¿Para qué asunto?», el detalle casi vacío de una solicitud en Hoy y «Nueva persona». «Nuevo asunto», en cambio, abre chico. | «En grande» solo para fichas. Formularios y selectores, siempre compactos. | Media | Visto |
| 34 | Elegir asunto, persona o inmueble | Tres maneras; dos sin buscador (Nuevo asunto, Nueva cita, Trámites, Dinero, Formatos). Con 23 personas ya es una lista larga; con el inventario real no sirve en el teléfono. | Un solo selector con búsqueda, el que ya usan «Ligar inmueble» y «Ligar propietario». | Alta | Visto |
| 35 | Detalle en Bandeja y Dinero | No vive en la dirección: Atrás saca de la pantalla en vez de cerrar el detalle. | `?ver=`, como en las demás. | Media | Revisor |
| 36 | Palabras | «Expediente» en Hoy y «Asunto» en lo demás; «Solicitud» y «Consulta»; «Marcar atendida» y «Atender yo»; «Abrir» sirve para ver un archivo y para ir a su destino. | Una palabra por cosa. | Baja | Revisor |
| 37 | Atajos | P pospone en Hoy y Asuntos, y registra un cobro en Dinero. T es tarea en Trámites y «hoy» en Agenda. | C para cobrar; H para hoy. | Baja | Revisor |

## Tema 4. Las pantallas no se pasan la estafeta

Aquí está la lógica de los flujos. Cada renglón es un punto donde el asesor termina algo y la app no lo lleva a lo que sigue.

### Llega una persona

| # | Dónde | Qué pasa | Propuesta | Gravedad | Prueba |
| --- | --- | --- | --- | --- | --- |
| 38 | Consulta → cita | No hay «Agendar visita» en la consulta. La cita queda sin persona ni asunto, así que después no ofrece Llamar ni «lo que sigue». | Botón «Agendar visita» que abre la cita con la persona y el inmueble puestos. | Alta | Revisor |
| 39 | Hoy y Consultas | La misma consulta se comporta distinto. Desde Hoy, WhatsApp lleva un texto genérico y no la pasa a seguimiento; «Marcar atendida» no la pone a nombre de nadie; «Posponer» no se ve en Consultas. | Una sola manera de atender, con la respuesta lista y a nombre del asesor. Mostrar «Pospuesta al…» en Consultas. | Alta | Visto (texto) y revisor |
| 40 | Hoy → solicitud | El detalle en Hoy no enseña qué pidió ni el inmueble: hay que pulsar «Consulta». | Abrir la consulta directo. | Media | Visto |
| 41 | Seguimiento | «Volver a contactar» no llega a Hoy, ni a la Agenda, ni al número del menú. Solo se ve entrando a Consultas y cambiando la vista. | Las de hoy o atrasadas entran a «Atender primero». | Alta | Código (Hoy) y revisor |
| 42 | Persona | Desde la ficha no hay siguiente paso: los enlaces llevan a listas sin contexto y no existe «Abrir asunto», «Agendar visita» ni «Registrar su inmueble». En la captación de un propietario se le escribe o elige tres veces. | Un botón según el caso, con la persona ya puesta: propietario sin inmueble → «Registrar su inmueble»; con inmueble y sin asunto → «Abrir asunto»; comprador con coincidencias → «Agendar visita». | Alta | Revisor |
| 43 | Coincidencias | Desde una coincidencia no se puede mandar la ficha ni agendar. «Enviar la ficha a N nuevos» solo copia el texto y marca a todos como enviados. La persona y el inmueble usan criterios distintos para coincidir. | En cada coincidencia: «Enviarle la ficha» (con su número, y anota a esa persona) y «Agendar visita». Un solo criterio. | Media | Revisor |

### Documentos y formatos

| # | Dónde | Qué pasa | Propuesta | Gravedad | Prueba |
| --- | --- | --- | --- | --- | --- |
| 44 | Las tres fichas | Los documentos se marcan en tres listas que no se conocen: 6 en el inmueble (Escritura, Contrato de intermediación, Recibo de agua), 7 en el asunto (Título de propiedad, Autorización de intermediación, Servicios) y archivos en la persona. El mismo papel se captura dos veces con dos nombres. | Una sola lista, la del asunto. El inmueble y la persona la muestran y suben ahí. | Alta | Visto y código |
| 45 | Formato desde el asunto | Al cerrar la captura cae en el catálogo de Formatos, no en el asunto. | Volver siempre a donde se abrió. | Alta | Código |
| 46 | «¿Para qué asunto?» | Lista sin buscador y sin «asunto nuevo». La entrevista inicial (02) se hace antes de que exista el asunto. | Buscador y «Asunto nuevo» arriba. | Alta | Visto |
| 47 | Después de «Generar PDF» | No hay siguiente paso a la vista. La copia firmada solo acepta PDF, y en la calle el asesor tiene una foto. | Al generar: «Compartir o descargar», «Subir copia firmada» y «Volver al asunto». Aceptar foto. | Alta | Código (solo PDF) y revisor |
| 48 | Borradores | Un borrador no se puede descartar y empezar un formato crea siempre uno nuevo (hay 6 borradores de prueba, 5 del mismo asunto). | «Descartar» recuperable. Al empezar: «Ya hay uno sin terminar: abrirlo». Necesita una ruta en el servidor. | Alta | Revisor |
| 49 | Bandeja | El camino rápido («Confirmar») no pregunta qué es ni marca «Recibido» en el asunto. Se confirma de uno en uno: diez fotos son diez pantallas. «Subir o tomar foto» del inmueble manda a la Bandeja sin decir cuál inmueble. | Pedir «Qué es» y marcar Recibido. Selección múltiple «Guardar N en…». Subir desde el inmueble guarda en ese inmueble. | Alta | Revisor |

### Crear sin salir

| # | Dónde | Qué pasa | Propuesta | Gravedad | Prueba |
| --- | --- | --- | --- | --- | --- |
| 50 | Nuevo asunto | Dice «Basta con el título» y el botón queda apagado sin persona. «Lo lleva» no trae a nadie puesto. | Quitar la frase. Persona primero. Título sugerido solo. «Lo lleva»: yo. | Alta | Visto |
| 51 | Inmueble y asunto | No se puede crear lo que falta: «Dalo de alta en Personas y vuelve a ligarlo»; «Crear inmueble» desde el asunto solo lleva a la lista. | El alta corta de persona (ya existe en el asunto) en esos dos lugares, y un alta mínima de inmueble dentro de «Ligar inmueble». | Alta | Revisor |
| 52 | Persona y asunto | «Lo que sigue» se pide dos veces (al dar de alta a la persona y al abrir su asunto). «Qué ofrece» del propietario repite los datos del inmueble. El estado civil es texto libre en Editar y lista en la ficha: escrito a mano no activa régimen ni cónyuge. | Al abrir el asunto, ofrecer pasar el siguiente paso. Ocultar «Qué ofrece» si ya hay inmueble. Estado civil siempre de la lista. | Media | Revisor |

### Agenda, trámites y dinero

| # | Dónde | Qué pasa | Propuesta | Gravedad | Prueba |
| --- | --- | --- | --- | --- | --- |
| 53 | Hoy | «¿Cómo te fue?» solo vive en Agenda. Hoy dice «1 cita terminada» y la pliega. | Fila «¿Cómo te fue? · Visita con Ana» arriba en Hoy, con la misma hoja. | Alta | Visto |
| 54 | Tras la acción | Marcar hecha la última tarea de un asunto no pregunta qué sigue. «No llegó» no ofrece reagendar. | Aviso con «¿Qué sigue?» y «Reagendar». | Media | Revisor |
| 55 | Hoy | Los tres mosaicos (Activos, En espera, Sin siguiente paso) llevan a la misma lista sin filtrar. Fin del encargo y licencia abren un detalle sin acción. Un cobro lleva a Dinero en general. | Cada mosaico con su filtro. Lo que no se cierra en Hoy navega directo a su asunto. | Media | Visto y revisor |
| 56 | Agenda | La hora se elige a toques de 30 minutos (de 10:00 a 17:00 son 14). Mover solo ofrece 7 días. | Desplegable de horas. «Otra fecha…» en Mover. | Media | Revisor |
| 57 | Agenda | Las tareas no se pueden trabajar desde ahí: unas solo enlazan y otras no hacen nada. La misma cita tiene un detalle en Hoy y otro en Agenda. | El mismo detalle en los dos lados. | Media | Revisor |
| 58 | Agenda, teléfono | «¿Cómo te fue?» sale arriba y otra vez dentro de la línea de tiempo. Dos «Hoy» en la barra (uno regresa a la pantalla, otro al día). «Día libre» puede decir una cita de otra semana. | Una sola pregunta. «Ir a hoy». Buscar la próxima cita desde mañana. | Media | Visto y revisor |
| 59 | Agenda | «Con más detalle» sin haber escrito llena mal el formulario (título «Visita», sin hora, día de hoy). | Empezar en blanco. | Media | Revisor |
| 60 | Trámites | Son una isla: nacen sin asunto, la persona y el inmueble son texto y no hay Llamar ni WhatsApp. Ya lo señaló AUD-05. | «Nuevo trámite» acepta asunto. Arriba, contacto y vínculos. | Alta | Visto y revisor |
| 61 | Avance al propietario | En guías que no son hipoteca escribe siempre «Nada por ahora» en lo que se necesita de él. Queda como enviado con solo abrir WhatsApp. | Llenarlo con los pendientes del paso. Deshacer en el registro. | Media | Revisor |
| 62 | Dinero | «Registrar cobro» son dos cosas: en un movimiento se cobra ahí mismo sin recibo; en una comisión saca a Formatos y vuelve a preguntar el asunto. Desde el asunto no hay enlace a Dinero. El vencimiento solo admite 7 o 30 días. | Un solo formulario y después «Hacer recibo» opcional. Enlace desde el asunto. «Cuándo» con otra fecha. | Alta | Revisor |
| 63 | Herramientas | En Costos el resultado queda después de 10 campos. «Para: …» no lleva a la ficha. | Cifra fija arriba. «Para» como vínculo. | Baja | Revisor |

## Tema 5. En el teléfono, lo diario está lejos

| # | Dónde | Qué pasa | Propuesta | Gravedad | Prueba |
| --- | --- | --- | --- | --- | --- |
| 64 | Barra de abajo | Bandeja (subir archivos, de vez en cuando) está a un toque. Consultas, con 10 personas esperando, está a dos, dentro de «Más», y «Más» no lleva número. La barra de arriba tampoco trae las consultas, aunque `DECISIONES.md` lo pide. | Cambiar Bandeja por Consultas con su número rojo. Bandeja pasa a «Más» y al «+». Es cambio a lo escrito: hay que decidir. | Alta | Visto |
| 65 | El «+» | Hay dos. El de arriba abre el buscador: 15 «Ir a» primero y, al pie, crear solo Persona o Inmueble; las opciones de crear solo llevan a la lista. El de la pantalla sí crea. En escritorio, «Nuevo» de Hoy hace lo mismo. | Un solo «+» que abre una hoja corta solo con «Crear», primero lo de la pantalla actual, y cada opción abre su formulario. | Alta | Visto y revisor |
| 66 | Inmuebles | Una tarjeta con foto grande por pantalla: 16 inmuebles son 16 pantallas. No hay vista compacta. | Fila compacta con miniatura por omisión; tarjetas a elección. | Media | Visto |
| 67 | Ficha del inmueble | El botón «Llegar» se corta en el borde derecho. En la persona, la pestaña «Documentos» toca el borde. | Ajustar. | Media | Visto |
| 68 | Captura de formatos | Los espacios de la hoja miden unos 10 px en el teléfono. «Uno por uno», que sí sirve, es un enlace pequeño. | Botón principal «Llenar lo que falta (N)» que entra a «Uno por uno». | Alta | Revisor |
| 69 | Hojas del asunto | No tienen X ni se cierran arrastrando. «Crear documento» lista todo el catálogo. | Usar la hoja común, que ya trae X. Solo los formatos del tipo y «Ver todos». | Alta | Revisor |
| 70 | Asunto, tableta | Entre 641 y 1099 px desaparece el menú ⋯: no se puede cambiar el título ni archivar. | Pintar el ⋯ en los tres tamaños. | Alta | Código |
| 71 | Fotos del inmueble | Ordenar y elegir portada no tiene control táctil: solo arrastre de ratón y teclado. | «Hacer portada» y flechas en cada foto. | Alta | Revisor |
| 72 | Tamaños | «Hecho» y «Posponer» miden 40 px; otros botones, 32 y 36. La regla es 44. | Subirlos. | Baja | Revisor |
| 73 | Más | Equipo va en tercer lugar, antes que Agenda. | Consultas, Agenda y lo demás. | Baja | Visto |

## Tema 6. Lo que promete y no hace

Nada de esto rompe, pero el asesor llena, pulsa y al final no pasa nada. Antes de lanzar conviene esconderlo.

| # | Dónde | Qué pasa | Propuesta | Gravedad | Prueba |
| --- | --- | --- | --- | --- | --- |
| 74 | Asunto, persona, inmueble | Cinco funciones terminan en «llega con la siguiente actualización»: segunda persona, cambiar el tipo, segundo inmueble, unir duplicados (falla al final, después de toda la comparación) e historial del inmueble. Dependen de migraciones que se aplican al integrar. | Esconder esos controles mientras el servidor diga que no está disponible. | Alta | Visto y revisor |
| 75 | Consulta | «Unir con su ficha» pide confirmar y luego avisa «todavía no está activo». | Esconderlo; dejar «Abrir su ficha». | Media | Código |
| 76 | Menú | Equipo lleva a una pantalla «Pronto» que habla de «el panel de siempre». | Quitarlo del menú hasta que exista. | Media | Visto |
| 77 | Persona e inmueble | El interruptor «Avisarle de inmuebles nuevos» no avisa a nadie. «Preparar informe al propietario» solo guarda una fecha. | Esconderlos hasta que funcionen. | Media | Revisor |
| 78 | Mensajes internos | Se leen frases como «actualización del servidor», «cuando se publique el panel nuevo» y «por ahora». | «Pronto», o nada. | Media | Visto |
| 79 | «Datos de ejemplo» | Está escrito fijo en seis pantallas: seguirá saliendo con el inventario real. | Que dependa de los datos. | Media | Código |
| 80 | Dinero | «Movimiento nuevo» deja llenar todo y no guarda. | No abrir el formulario si no se puede guardar. | Media | Revisor |
| 81 | Bandeja | Promete videos y los rechaza. | Quitar «videos» del texto. | Media | Revisor |
| 82 | Configuración | Los 4 interruptores de avisos no hacen nada todavía. «Invitar» prepara una invitación que no se envía. | Marcar «Pronto». | Baja | Visto |

## Tema 7. Cuidado con los datos

Son pocos, pero son los que pueden salir mal de verdad.

| # | Dónde | Qué pasa | Propuesta | Gravedad | Prueba |
| --- | --- | --- | --- | --- | --- |
| 83 | Alta de inmueble | El campo se llama «Colonia o dirección». Lo escrito se guarda como zona, como título («Casa en …») y de ahí sale la dirección web. Ya hay un inmueble de prueba titulado con calle y número. | Etiqueta «Colonia» y la ayuda «La dirección exacta va después, en Datos (privada)». | Alta | Visto y código |
| 84 | Inmueble, «En el sitio» | «Publicado» y «Dirección exacta» son dos interruptores iguales, uno bajo el otro. No probé qué pasa al tocarlos. | Publicar como paso propio con su repaso de avisos. «Dirección exacta» aparte, con una frase de qué se va a ver. | Alta | Visto |
| 85 | Ligar propietario | Ligar a una persona que ya es dueña de otro inmueble la mueve sin avisar y le cambia el papel a «Vende». | Avisar «Ya es propietario de X». Permitir varios cuando exista la tabla. | Alta | Código |
| 86 | «Pidió no ser contactado» | Solo se respeta en Personas. El asunto ofrece Llamar y WhatsApp igual, y el inmueble la incluye en «Enviar la ficha». | Llevar la marca al asunto y sacarla de Interesados. | Alta | Código |

Además, sin Deshacer: «Quitar de la Bandeja» (código), una tarea de trámite marcada hecha, un documento subido al trámite y un comprobante equivocado (revisor). El Deshacer dura 10 segundos y lo escrito dice 5 (código).

## Fallas puntuales vistas

- Trámites dice «1 activos».
- En la consulta, la línea empieza con un punto suelto: «· Espera hace 2 días».
- Inmuebles con título «Casa · No sabe» y «Terreno · No sabe».
- Un folio distinto a los demás: «INM-2026-0001».
- Teléfonos sin formato y de largo distinto («66412345678», «+526644066999», «664 9876543»).
- En la consulta, el interruptor «Preguntar qué busca ◯ No contestó» parece encendido y apagado, no dos textos a elegir.

## Lo que funciona bien y conviene no tocar

- **Captura en una línea:** escribí «Visita con Doris mañana 4pm en Otay» y reconoció tipo, día, hora, persona y lugar.
- **«Lo que sigue» arriba** de la persona y del asunto, con Hecho y Posponer.
- **Lista de Personas:** cada fila dice el seguimiento y la banda «12 sin seguimiento» lleva a ellos.
- **Trámite:** un checklist con el paso actual abierto y «Faltan 3 pendientes. Puedes cerrarlo igual».
- **Formatos:** catálogo por lo que quieres hacer; captura sobre la hoja con «Faltan N» y PDF aunque falten datos.
- **Altas cortas:** inmueble en 5 campos, persona en 7.
- **Respuesta lista** en Consultas y **Deshacer** en casi todo.
- **Fichas en la dirección** (`?ver=`): se comparten y Atrás las cierra.

## Choques con lo escrito: decide el titular

1. **Datos vacíos de la persona.** `DECISIONES.md` dice «Ningún dato vacío se oculta». Propongo plegar «Para contratos» y «Privacidad» en una fila con su cuenta (hallazgo 1).
2. **Barra de abajo del teléfono.** Lo escrito: Hoy, Bandeja, Personas, Inmuebles, Asuntos y Más. Propongo cambiar Bandeja por Consultas (hallazgo 64).
3. **Ficha del inmueble en el teléfono.** Lo escrito: hoja desde abajo. Propongo pantalla completa, como persona y asunto (hallazgo 30).
4. **Pestañas o desplegable.** El texto se contradice. Propongo: vistas de una lista en desplegable, secciones de una ficha en pestañas (hallazgo 29).
5. **Solicitudes en Hoy.** Lo escrito: línea ámbar y además en la lista. Propongo solo la línea cuando son más de 3 (hallazgo 24).

`DECISIONES.md` también quedó atrás en varios puntos que ya están construidos: la vista Todas · Propietarios · Sin contacto, «Dirección exacta», unir fichas, Costos de cierre y las pestañas del asunto. Se pone al día al corregir.

## Orden propuesto

1. **Cuidado con los datos** (83 a 86): poco trabajo, es lo que puede salir mal.
2. **Esconder lo que no hace nada** (74 a 82): sobre todo quitar.
3. **El molde de las tres fichas** (1 a 12, 30 y 31): resuelve el amontonamiento.
4. **Avisos con criterio** (19 a 25).
5. **Que las pantallas se pasen la estafeta** (38 a 53): consulta → cita → cómo te fue → lo que sigue; formato que vuelve al asunto; una sola lista de documentos.
6. **Crear y elegir** (34, 50, 51 y 65): un «+» que crea y un selector con búsqueda.
7. **Teléfono** (64 a 72).
8. **Pulido** (lo de gravedad baja y las fallas puntuales).
