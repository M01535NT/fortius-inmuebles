# Fortius — el plan

Qué hay hoy, qué falta para terminar y en qué orden. Cómo debe funcionar el sistema está en `SPEC.md`, en esta misma carpeta.

**Actualizado:** 17 de noviembre de 2026.

**Este es el plan vigente al día de hoy.** Va a cambiar conforme avance el trabajo. Si un cambio que pidas contradice este plan o `SPEC.md`, el agente te avisa y te propone corregirlo aquí o abrir una rama aparte para ese cambio (ver la sección 19 de `SPEC.md`).

---

## 1. Dónde estamos hoy

**Lo que ya funciona y se queda:**

- El sitio público, fortiusinmuebles.com, publicado.
- La base de datos, las cuentas de usuario y los permisos.
- Los formatos de Fortius, que generan PDF.
- La lectura de datos desde un documento.
- La copia de respaldo diaria.

**Lo que ya está decidido:**

- Cómo debe funcionar todo: está escrito en `SPEC.md`.
- Cómo debe verse: el boceto aprobado, en `docs/boceto-fortius-por-asuntos.html`. Se abre en el navegador y se puede usar con datos de ejemplo.
- Con qué casos se va a probar: `docs/casos-reales.md`.

**Lo que falta:**

- **Construir el panel como el boceto.** El boceto es un dibujo que funciona, pero no guarda nada. Falta hacerlo de verdad, conectado a la base de datos.
- Hoy el equipo entra a un panel provisional en fortiusinmuebles.com/admin. Sigue funcionando hasta que el nuevo esté listo y lo reemplace.

**El punto de partida:**

- Antes de empezar se comprobó que lo que ya existe está sano: la revisión del código no marca errores, las 2,276 pruebas automáticas pasan y el sitio se arma completo sin fallas.
- Ese punto quedó marcado en el repositorio con el nombre `inicio-panel-por-asuntos`. Si algo sale mal durante la construcción, se puede comparar contra él o volver a él.

**En una frase: el diseño está terminado y aprobado; las etapas 0 a 8 están aprobadas; la etapa 9, Equipo, está construida y espera tu aprobación.**

## 2. Las etapas

Cada etapa termina con algo que puedes abrir y probar. No se pasa a la siguiente sin que la veas.

| Etapa | Qué se construye | Cómo sabrás que está lista | Tamaño |
| --- | --- | --- | --- |
| **0. Preparación** | Se revisa lo que ya hay para ver qué se aprovecha, y se prepara la base de datos para el sistema nuevo | Recibes una lista corta: qué se reutiliza, qué se rehace y qué cambia en la base | Chica |
| **1. La base visual** | Colores, letra, íconos, menú lateral y barra del teléfono | Abres el panel y se ve como el boceto, aunque todavía vacío | Chica |
| **2. Asuntos** | La lista de asuntos y el asunto con sus apartados, que se agregan y se quitan | Abres un asunto, entras a sus apartados y lo que cambias se queda guardado | Grande |
| **3. La consulta** | La captura durante la llamada, que abre el asunto | Capturas una llamada de prueba y el asunto nace con su persona, su inmueble y su lista de documentos | Mediana |
| **4. Inmuebles** | La lista y la ficha completa: ficha técnica, fotos, video, 360, planos, ubicación y publicar | Cargas un inmueble con sus fotos y aparece en el sitio público | Grande |
| **5. Los apartados a fondo** | Plan, Documentos, Opinión jurídica, Honorarios, Interesados y los apartados propios (lista, tabla, galería, texto) | Llevas un caso completo: pides documentos, emites la opinión, presupuestas y cobras | Grande |
| **6. Documentos y Herramientas** | Los formatos que se llenan por preguntas, y la sección Herramientas | Haces un contrato desde un asunto y ya trae los datos de la persona y del inmueble | Grande |
| **7. Directorio y Biblioteca** | Las personas con su asunto; las listas y planes que se copian | Buscas a una persona y llegas a su asunto; copias un plan de la Biblioteca a un asunto | Mediana |
| **8. Inicio** | Lo que hay que atender, lo de hoy, la semana y lo que falta cobrar | Entras en la mañana y ves qué te toca | Chica |
| **9. Equipo** | Lo que ve el director y lo que ve cada asesor | Entras con una cuenta de asesor y solo ves lo suyo | Mediana |
| **10. Funciones extra** | Primero: regresar a la ventana anterior, elegir dónde se abre cada ventana y los informes para el cliente. Después, las funciones de uso diario de la lista de `SPEC.md` que no hayan entrado antes | Regresas de una ventana a la anterior, la abres donde prefieras y mandas un informe desde un asunto. Las demás las pruebas una por una | Mediana |
| **11. El cambio** | El panel nuevo reemplaza al provisional y se retira lo que sobra | El equipo entra al panel nuevo en la dirección de siempre | Chica |

**Chica:** una o dos sesiones de trabajo. **Mediana:** varias sesiones. **Grande:** muchas sesiones, con varias revisiones tuyas en medio.

### Lista de comprobación de cada etapa

Una etapa se da por buena cuando todo lo de su lista se puede hacer en el panel, con los casos de `docs/casos-reales.md`. Lo que no pase se corrige antes de seguir, o se anota aquí con su motivo.

**0. Preparación**

- [x] Hay una lista de lo que se reutiliza y lo que se rehace.
- [x] Está escrito qué cambia en la base de datos, y lo autorizaste antes de aplicarlo. *(Autorizado el 16/11. Se quitaron los cambios viejos que nunca se aplicaron y quedaron escritos los primeros: folios, asuntos, apartados y personas. Se aplican al integrar en `main`.)*
- [x] El sitio público y el panel provisional siguen funcionando igual. *(En esta etapa no se tocó código ni la base.)*
- [ ] Las pruebas automáticas siguen pasando. *(No se corrieron: no hubo cambios de código. Se corren antes de integrar en `main`.)*

**1. La base visual**

- [x] El menú lateral tiene Inicio, Asuntos, Inmuebles, Directorio, Biblioteca, Herramientas y Equipo.
- [x] En el teléfono aparece la barra de abajo con el botón de nueva consulta al centro.
- [x] Se ve bien en claro y en oscuro.
- [x] Los botones se alcanzan con el dedo y con el teclado.
- [x] Colores, letra e íconos son los del boceto.

*16/11: construida, revisada con capturas en claro, oscuro y teléfono, y aprobada por ti. Las pantallas que ya existían (Inicio, Asuntos, Inmuebles, Herramientas) conservan su contenido anterior con los colores nuevos hasta su etapa; Directorio, Biblioteca, Equipo y Nueva consulta muestran en qué etapa llegan. «Recientes» del menú llega con los asuntos.*

**2. Asuntos**

- [ ] La lista muestra los seis casos, cada uno con su siguiente paso y su fecha.
- [ ] Se filtra por en qué va y, como director, por quién lo lleva.
- [ ] El asunto de la casa en sucesión abre con sus apartados, y lo que cambias sigue ahí al volver a entrar.
- [ ] Se agrega y se quita un apartado sin perder lo que tenía.
- [ ] Se cambia en qué va y queda anotado en el historial.
- [ ] Un asunto sin siguiente paso lo avisa, pero deja seguir.
- [ ] El asunto de la casa del suegro no muestra ni reclama fotos, publicación ni contrato de venta.

*17/11: aprobada por ti con datos simulados. La lista de comprobación se prueba con datos reales cuando se integren los cambios de la base en `main`.*

*16/11: construida. Ya están la lista (buscar, qué ver y, para el director, quién lo lleva), el asunto con lo que sigue, en qué va, la espera, el cierre y la reapertura, los apartados que se agregan y se quitan, apartados propios como lista o texto, y las ventanas de Personas (con papel, fallecida y teléfono con clave de país), Plan (etapas y tareas, marcar hecha y posponer) e Historial (notas, decisiones y cambios). Los demás apartados dicen en qué etapa llegan. El director puede cargar los seis casos como ejemplo con un botón. Falta: aplicar los cambios de la base (se aplican al integrar en `main`) y probar la lista de comprobación. Las tareas sin poderse hacer, la línea de tiempo y las vistas de tabla y galería llegan en la etapa 5.*

**3. La consulta**

- [ ] Capturas la llamada de la casa en sucesión en menos de tres minutos, sin salir de la pantalla.
- [ ] Anotas a la mamá fallecida y a los dos hermanos ahí mismo, cada uno con su papel.
- [ ] El teléfono de Estados Unidos se guarda con su clave.
- [ ] La lista de qué pedirle cambia sola según lo que respondes (titular fallecida, hipoteca, inquilino).
- [ ] Adjuntas lo que ya mandó el abogado del terreno y queda marcado como recibido.
- [ ] Al abrir el asunto, nace con su persona, su inmueble, su lista de documentos y su primer plan.
- [ ] Una consulta que no se vuelve asunto se guarda como contacto, con fecha para volver a llamar, o se cierra como «no procede».
- [ ] Si se corta la llamada, lo capturado no se pierde.

*17/11: aprobada por ti con datos simulados; la lista se prueba con datos reales al integrar la base en `main`.*

*17/11: construida. La consulta se guarda sola mientras escribes y, si se corta la llamada o la conexión, lo capturado queda en el equipo y se manda al volver; si dejaste una a medias, la pantalla te ofrece seguirla. Ya están: quién llama (con clave de país), por dónde llegó, qué pasa, los datos de siempre en listas desplegables, la lista de qué pedirle que cambia sola (se quita lo que no aplique, se agrega lo que falte y sale como mensaje para WhatsApp que tú envías), otras personas del caso con su papel y si falleció, y lo que ya mandó (PDF o fotos, quedan como recibidos). «Abrir asunto» crea en un solo paso la persona, el asunto con sus apartados, las otras personas, el inmueble si se describió, la lista de documentos, lo recibido y un primer plan de ejemplo. «Sin asunto» la guarda como contacto con fecha para volver a llamar, o la cierra como «no procede». En el asunto ya se ven el inmueble, la lista de documentos y, en Situación, los datos de siempre y lo que contó. Falta: aplicar los cambios de la base (se aplican al integrar en `main`) y probar la lista de comprobación. El contacto guardado aparece en Inicio el día de llamarle.*

**4. Inmuebles**

- [ ] La nave industrial pide sus datos propios (altura, andenes, kVA) y la casa los suyos.
- [ ] Subes varias fotos a la vez y eliges la portada.
- [ ] Cargas video, recorrido 360, planos y permisos.
- [ ] La dirección exacta no sale en el sitio a menos que lo actives.
- [ ] Guardar no publica: el inmueble aparece en el sitio solo cuando lo publicas, y desaparece al retirarlo.
- [ ] Los cinco locales viven en un solo asunto, cada uno con su precio y su estado, ligados a su plaza.
- [ ] Publicas los cinco locales de una vez.
- [ ] Cambias un precio y queda guardado quién, cuándo y por qué. El de la nave va en dólares.

*17/11: aprobada por ti con datos simulados.*

*17/11: construida y revisada con datos simulados. La lista de Inmuebles muestra cada uno con su portada, lo que trae (fotos, video, 360) y si está publicado; se eligen varios para publicarlos, retirarlos o compartirlos. «Nuevo» pide nombre, tipo, operación y, si se sabe, el propietario, y abre su asunto de captación. La ficha se abre a un lado, en Inmuebles o en el apartado Inmueble del asunto, con seis pestañas: Ficha (datos propios de cada tipo, estado, y precio con su historia de quién, cuándo y por qué, en pesos o dólares), Fotos (varias a la vez, portada, ordenar y quitar), Video y 360 (subidos o por enlace), Planos (los mismos documentos del asunto), Ubicación (la dirección exacta es privada salvo que la actives) y Sitio (publicar, qué lleva y qué falta, descripción y compartir). En el asunto de la plaza, los locales se ven con su estado, «Agregar otro igual» suma uno y «Publicar todos» los publica de una vez. Falta: aplicar los cambios de la base (se aplican al integrar en `main`), comprobar que lo publicado aparece en el sitio público y probar la lista con datos reales.*

**5. Los apartados a fondo**

- [ ] Pides los documentos que faltan con un mensaje listo para WhatsApp. El sistema no lo envía: lo envías tú.
- [ ] Cada documento dice quién lo entrega y, si vence, cuándo; el sistema avisa antes.
- [ ] Subes varios archivos de una vez y cada uno cae en su renglón. El cliente también puede subir los suyos por una liga.
- [ ] Emites la opinión jurídica de la casa en sucesión, y lo que hay que resolver pasa al plan con un toque.
- [ ] Si la opinión es «no factible», el panel ofrece cobrar el estudio, cerrar el asunto o dejarlo en espera.
- [ ] Una tarea puede quedar hecha, sin aplicar o sin poderse hacer todavía, con su motivo.
- [ ] Haces el presupuesto del caso de asesoría separando tus honorarios de los gastos de terceros, y dices quién paga.
- [ ] Registras un cobro y haces su recibo.
- [ ] El presupuesto tiene vigencia; al enviarlo nace sola la tarea de darle seguimiento.
- [ ] Al cargar el contrato firmado, el panel propone pasar a «En marcha»; al cobrar todo, propone cerrar. Nunca lo cambia solo.
- [ ] Una tarea que le toca a otro nace con fecha para volver a preguntar.
- [ ] Anotas a un interesado en un local, con su visita (día y hora) y su oferta.
- [ ] Creas un apartado propio como tabla y otro como galería con fotos.
- [ ] Pones un asunto en espera y lo reanudas; lo cierras como «se logró» o «no se dio».
- [ ] De un asunto terminado continúas en uno nuevo, con las mismas personas, inmueble y documentos.
- [ ] Llevas la casa del suegro de principio a fin: hipoteca, crédito y escritura en un solo plan.

*17/11: construida y revisada con datos simulados. Documentos agrupa lo que falta y lo recibido, dice quién lo entrega y cuándo vence (avisa antes), pide lo que falta con un mensaje listo para WhatsApp, sube varios archivos a la vez y acomoda cada uno por su nombre, y crea la liga para que el cliente suba los suyos desde su teléfono. Situación anota los datos de siempre y lo que falta averiguar, que se vuelve tarea con un toque. Opinión jurídica lleva el resultado, el análisis y lo que hay que resolver con quién lo hace; con un botón pasa todo al plan, y si sale «no factible» ofrece cobrar el estudio, cerrar o esperar un mes. Honorarios separa tus honorarios (monto o porcentaje del precio) de los gastos de terceros, con quién paga, vigencia, otra versión del presupuesto, el contrato firmado y los cobros con su recibo y lo que falta. Interesados lleva qué local le interesa, la visita con día y hora y la oferta con su respuesta. El Plan se abre por tarea para cambiar cómo va (hecha, no aplica o no se puede todavía, con su motivo), quién, día y hora; «Recordarle» abre WhatsApp, y se ve por etapas o en el tiempo. Los apartados propios ya se ven como lista, tabla (con columnas tuyas y totales), galería (con foto y precio por m²) o texto. El asunto propone pasar a Propuesta, a En marcha o cerrar, y nunca lo cambia solo; uno cerrado se continúa en uno nuevo. Falta: aplicar los cambios de la base (se aplican al integrar en `main`), probar la lista con datos reales y la liga del cliente en un teléfono de verdad. Hacer la opinión y el presupuesto en PDF desde el panel llega con sus plantillas en la etapa 6 Los avisos de vencimiento ya salen en Inicio. Las tareas que esperan a otra o que se repiten quedan para la etapa 10.*

**6. Documentos y Herramientas**

- [ ] Haces un contrato desde un asunto y solo te pregunta lo que falta.
- [ ] Lo que capturas en el contrato queda guardado en la persona y en el inmueble, y no se vuelve a pedir.
- [ ] Mientras contestas ves la hoja llenándose, y tocar un espacio te lleva a ese dato.
- [ ] Descargas el PDF y sale como la plantilla, sin notas internas.
- [ ] Cargas el contrato firmado, en PDF o en foto, y queda en los Documentos del asunto.
- [ ] Haces una opinión de valor sin asunto, y después la pasas a su asunto.
- [ ] Los cálculos que dependen de una regla fiscal dicen su fuente y su fecha; si falta la regla, lo dicen y no inventan.

*17/11: construida y revisada con datos simulados. Desde un asunto, «Nuevo → Contrato o formato» abre la lista de formatos; al elegir uno se abre su ventana con la pregunta a un lado y la hoja real al otro. Solo pregunta lo que falta: quién vende, el inmueble, su precio y sus datos legales entran solos del asunto. Lo que se contesta se guarda solo y vuelve a la ficha de la persona y al inmueble; tocar un espacio de la hoja lleva a ese dato. Al terminar: descargar el PDF (queda en los Documentos del asunto como versión nueva si cambió), enviarlo por WhatsApp, cargar el firmado en PDF o foto y volver al asunto; con el contrato firmado, el asunto propone pasar a En marcha. Los documentos hechos aquí tienen un lápiz en Documentos para seguir llenándolos. Herramientas tiene opinión de valor, cálculo de ISR, gastos del comprador, gastos del vendedor, crédito, comisión y contratos y formatos; lo que se hace sin asunto queda en «Trabajos sueltos» y se pasa a su asunto cuando el cliente contrata. El ISR dice su ley, artículos, reforma y fecha de revisión, y si falta un dato dice «Pendiente» y qué falta. Falta: aplicar los cambios de la base (se aplican al integrar en `main`), probar con datos reales, las fotos de la opinión de valor y de los levantamientos (por ahora el recuadro sale vacío) y el PDF del presupuesto de honorarios y de la opinión jurídica desde sus apartados, que por ahora se suben hechos.*

**7. Directorio y Biblioteca**

- [ ] Buscas a una persona por nombre o teléfono y llegas a su asunto.
- [ ] Una persona que está en dos asuntos aparece una sola vez, con los dos.
- [ ] Desde un contacto sin asunto abres un asunto nuevo sin volver a capturarlo.
- [ ] Copias una lista de documentos y un plan de la Biblioteca a un asunto, y los cambias ahí sin alterar el original.
- [ ] Guardas en la Biblioteca el plan de un asunto para volver a usarlo.

*17/11: construida y revisada con datos simulados. El Directorio muestra a cada persona una sola vez con todos sus asuntos (lo cerrado, apagado); se busca por nombre o teléfono y se filtra por «Con asunto», «Contactos sin asunto» o «Por llamar». Tocar un asunto lleva a sus Personas. Cada persona tiene en su menú: nuevo asunto con ella (la consulta ya trae su nombre y teléfono), llamar, WhatsApp, copiar el teléfono, recordarme llamarle y no contactar; quien falleció o no quiere contacto no tiene llamar ni WhatsApp. El director une dos fichas de la misma persona: todo pasa a la que se queda y la otra va a Eliminados. La Biblioteca tiene «Qué pedir» y «Qué hacer» (y los apartados que se guarden), con su contenido de ejemplo; cada guía se abre para leerla y se usa en un asunto. En el asunto, Documentos → Agregar y Plan → Biblioteca traen las guías; lo copiado se cambia en el asunto y la guía queda igual. «Guardar este plan en la Biblioteca» guarda las etapas y tareas del asunto (las fechas pasan a días contados desde la primera), y un apartado propio también se guarda. Quien hizo la guía o el director la cambian; solo el director la marca «Revisado por el abogado». Falta: aplicar los cambios de la base (se aplican al integrar en `main`) y probar con datos reales. «Por llamar» ya sale en Inicio.*

**8. Inicio**

- [ ] Al entrar ves primero lo que hay que atender: las solicitudes del sitio, con el tiempo que llevan esperando.
- [ ] Ves lo de hoy, lo de la semana, las visitas con su hora y lo que falta cobrar.
- [ ] Ves lo que esperas de otros, y le recuerdas a quien lleva más días.
- [ ] Marcas una tarea como hecha desde Inicio y queda anotada en su asunto.
- [ ] Como director, pasas una solicitud a un asesor.
- [ ] Una solicitud por un inmueble publicado queda anotada en los Interesados de ese inmueble.

*17/11: construida y revisada con datos simulados. Inicio abre con «Por atender»: las solicitudes del sitio con lo que escribieron, por qué inmueble preguntan y cuánto llevan esperando (en ámbar pasada una hora, en rojo pasadas dos). «Atender» abre la consulta ya llena con su nombre, teléfono y mensaje, por el canal «Sitio»; el menú trae escribirle por WhatsApp, verla en Interesados, «No procede» y, para el director, «Pasar a» cualquier persona del equipo. Las que nadie lleva le llegan al director; cada asesor ve las que le tocan. Si preguntan por un inmueble publicado, la solicitud queda a cargo de quien lleva el asunto de ese inmueble y la persona se anota sola en sus Interesados (si su teléfono o correo ya existen, se usa la misma ficha). Después vienen Para hoy, Visitas (los próximos siete días, con hora, quién viene y a qué inmueble), Esta semana, Lo esperas de otros (lo que lleva más días arriba, con «Recordarle» por WhatsApp que recorre la fecha tres días), Volver a llamar (los contactos guardados, con llamar, nuevo asunto, llamarle en una semana o «ya le llamé»), Por vencer (los documentos que entran en su aviso) y Por cobrar (honorarios del presupuesto aceptado menos lo cobrado, en pesos o dólares). Marcar una tarea la deja hecha en su asunto, con su historial. El director elige ver todo el equipo o a una persona. El formulario del sitio ya reconoce los inmuebles publicados desde el panel nuevo (antes los ignoraba). Falta: aplicar los cambios de la base (se aplican al integrar en `main`) y probar la lista con datos reales y con una cuenta de asesor.*

**9. Equipo**

- [ ] Con una cuenta de asesor solo ves tus asuntos, tus inmuebles y tus personas.
- [ ] Escribir la dirección de un asunto ajeno no lo abre.
- [ ] Como director ves a cada asesor con lo vencido, lo de hoy y lo que falta cobrar.
- [ ] Cambias quién lleva un asunto y queda anotado.

*17/11: construida y revisada con datos simulados. Equipo, solo para el director, muestra a cada persona con sus asuntos abiertos, lo de hoy, lo de la semana y lo que falta cobrar (en pesos y dólares), y arriba lo vencido, los asuntos sin siguiente paso y las solicitudes del sitio que tiene sin atender; un aviso dice cuántas solicitudes esperan a que las pases. «Ver» abre Asuntos ya filtrado por esa persona. Cambiar quién lleva un asunto se hace desde el asunto y queda en su historial. Con cuenta de asesor, Equipo no sale en el menú y, si se escribe la dirección, dice que es solo del director; un asunto ajeno responde «no existe o no te toca verlo» y ofrece volver a tus asuntos. Lo que ve cada quien lo decide la base (asuntos, personas, inmuebles, tareas, documentos, dinero y solicitudes), no la pantalla; esas reglas ya venían en los cambios de la base de las etapas anteriores. Falta: aplicar los cambios de la base (se aplican al integrar en `main`) y probar la lista con una cuenta de asesor de verdad.*

**10. Funciones extra**

Las ventanas:

- [ ] En el asunto de la plaza, de la ficha de un local regresas con la flecha a la lista de locales.
- [ ] De un contrato regresas al apartado de Honorarios; de una herramienta, a la lista de herramientas.
- [ ] Si no hay ventana anterior, la flecha cierra y quedas en el asunto.
- [ ] Abres una ventana a la derecha, a la izquierda, al centro y a pantalla completa.
- [ ] El panel recuerda la que elegiste: la siguiente ventana abre igual, también al volver a entrar.
- [ ] Con un toque pasas a pantalla completa y vuelves a como estaba.
- [ ] En el teléfono toda ventana abre a pantalla completa.

Los informes para el cliente:

- [ ] Desde la casa del suegro haces un informe para el comprador sin capturar nada: sale con lo hecho, lo que sigue y lo que le falta entregar.
- [ ] Desde la plaza, el informe para la propietaria dice cuántos preguntaron, cuántas visitas hubo y qué ofertas llegaron por cada local, sin nombres ni teléfonos de los interesados.
- [ ] En el caso de asesoría eliges a cuál de los dos clientes va, o a los dos.
- [ ] Cambias el párrafo de «En qué va» y apagas una parte (por ejemplo, Dinero): la hoja cambia al momento.
- [ ] El informe no lleva notas internas, decisiones internas ni el análisis de la opinión jurídica.
- [ ] Lo descargas en PDF y lo mandas por WhatsApp. El panel no lo envía solo.
- [ ] Queda en Documentos, en «Informes», con su número, y anotado en el Historial.
- [ ] Lo pones cada mes: nace la tarea de mandarlo, aparece en Inicio y, al mandarlo, nace la del mes siguiente.

Lo demás:

- [ ] Cada función de la lista de `SPEC.md` que haya entrado se prueba con uno de los casos reales.
- [ ] Las que no entren quedan anotadas aquí, con su motivo.

*17/11: las ventanas y los informes para el cliente ya están escritos en `SPEC.md`; el boceto todavía no los muestra. La hoja del informe es una propuesta: la ves y la apruebas cuando se construya. Las tareas que se repiten, pendientes de la etapa 5, se construyen aquí porque el informe periódico las usa.*

**11. El cambio**

- [ ] Hay una copia de respaldo reciente, y se probó restaurarla.
- [ ] El equipo entra al panel nuevo en la dirección de siempre.
- [ ] El sitio público sigue igual.
- [ ] Lo que sobra del panel provisional se retiró y las pruebas siguen pasando.

## 3. Cuándo se puede empezar a usar

No hace falta esperar al final.

- **Al terminar la etapa 5** ya puedes llevar un caso real completo: de la llamada al cobro. Es la primera versión que sirve para trabajar.
- **Al terminar la etapa 6** además haces tus contratos y formatos desde el asunto.
- **Al terminar la etapa 9** puede entrar el equipo, cada quien viendo lo suyo.
- **La etapa 11** es el cambio definitivo.

No pongo fechas porque no las puedo cumplir con honestidad: depende de cuántas sesiones se trabajen y de cuánto se corrija en cada revisión. Lo que sí se puede medir es el avance: al cerrar cada etapa, esta tabla se actualiza.

## 4. Lo que te toca a ti

**Para que la construcción avance:**

1. **Revisar cada etapa** cuando se te avise y decir qué cambiar.
2. **Contestar las decisiones pendientes** cuando lleguen. Están al final de `SPEC.md` y se te preguntan una por una, en su momento.

**Con calma, sin detener nada:**

3. **Subir tu contenido:** la plantilla del presupuesto de honorarios, las listas de documentos y los planes de la Biblioteca, y los datos que quieres por cada tipo de inmueble.
4. **Llevarle al abogado** lo que debe revisar: los contratos de renta y de compraventa a plazos, el aviso de privacidad y el uso de la lectura de documentos con clientes reales. El paquete está en `docs/legal/revision-abogado-2026-11-15.md`.
5. **Pasar los datos de la empresa** para los avisos de privacidad.

**Pendiente de seguridad, aparte del panel nuevo:**

6. **Activar la entrada en dos pasos** de tu cuenta de director en fortiusinmuebles.com/admin. Es lo único con riesgo real mientras no esté.
7. **Autorizar una actualización de seguridad.** El programa con el que está hecho el sitio (Next.js) publicó un aviso de seguridad de nivel moderado y recomienda pasar a su versión 16.4.6. Por lo revisado, el sitio no usa la función afectada, así que no hay urgencia, pero conviene hacerlo. Se hace en una rama aparte, se prueba y solo se publica con tu visto bueno.

## 5. Cómo se trabaja

- **Tú guías; el código lo escribe el agente.** Tú dices qué quieres y revisas el resultado; lo técnico lo decide el agente y te lo explica en lenguaje sencillo.
- **Una etapa a la vez,** en el orden de la tabla. Si quieres cambiar el orden, se cambia aquí.
- **Cada etapa se prueba con tus casos reales** antes de darla por buena.
- **El agente te avisa si algo se contradice** y te propone ideas cuando vea una mejor forma de lograr lo que buscas. Tú decides.
- **Nada se publica sin tu permiso.** Todo se construye aparte y solo pasa al sitio cuando tú lo autorizas.
- **La base tiene solo datos de prueba.** El día que cargues tu inventario real se sigue la guía `docs/operacion/paso-a-inventario-real.md`.

## 6. Avance

| Etapa | Estado |
| --- | --- |
| 0. Preparación | Terminada el 16/11. Solo faltan las pruebas automáticas, que se corren antes de integrar en `main` |
| 1. La base visual | Aprobada el 16/11 |
| 2. Asuntos | Aprobada el 17/11 con datos simulados; falta probarla con datos reales |
| 3. La consulta | Aprobada el 17/11 con datos simulados; falta probarla con datos reales |
| 4. Inmuebles | Aprobada el 17/11 con datos simulados; falta probarla con datos reales y en el sitio |
| 5. Los apartados a fondo | Aprobada el 17/11 con datos simulados; falta probarla con datos reales |
| 6. Documentos y Herramientas | Aprobada el 17/11 con datos simulados; falta probarla con datos reales |
| 7. Directorio y Biblioteca | Aprobada el 17/11 con datos simulados; falta probarla con datos reales |
| 8. Inicio | Aprobada el 17/11 con datos simulados; falta probarla con datos reales |
| 9. Equipo | Construida el 17/11 con datos simulados; espera tu aprobación |
| 10. Funciones extra | Pendiente. Empieza por las ventanas y los informes para el cliente |
| 11. El cambio | Pendiente |
