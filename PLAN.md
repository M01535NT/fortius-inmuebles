# Fortius — el plan

Qué hay hoy, qué falta para terminar y en qué orden. Cómo debe funcionar el sistema está en `SPEC.md`, en esta misma carpeta.

**Actualizado:** 19 de noviembre de 2026.

El sitio público nuevo tiene su propio plan en `docs/sitio/PLAN.md`; este habla del panel.

---

## Tablero: llevar el panel nuevo a /admin

**La meta:** que el equipo entre a fortiusinmuebles.com/admin y vea el panel nuevo. Hoy el nuevo está en /panel y en /admin sigue el provisional.

**Cómo se lee:** ☐ es que falta, ☑ es que ya quedó. La flecha 👉 marca la etapa en la que vamos. Cada vez que se termina una tarea, el agente la marca aquí y cambia la fecha de arriba.

**Vamos en:** 👉 Etapa B.

### Etapa A · Dejar listo lo que va a salir

Todo el trabajo vive en una sola rama, así que el cambio lleva todo lo que hay en ella: el panel publicado, los catálogos y la Consulta y el asunto con su aspecto nuevo. Por eso primero se deja estable lo que quedó a medias. El 19/11 el titular pidió que todo el panel salga con el aspecto de app de Mac, no solo la Consulta y el asunto: por eso la etapa sigue abierta.

Lo trabajan dos sesiones a la vez, cada una con sus carpetas, y el agente coordina y revisa.

- [x] Pantallas: terminar la Consulta y el asunto con el modelo visual, y dejarlos estables.
- [x] Pantallas: fallos 2, 4, 6, 8, 9 y 12 de la prueba del 18/11. Los fallos 2 y 4 no se pudieron ver en captura; los confirma la revisión.
- [x] Servidor y secciones: fallos 1, 3, 5, 10 y 11 (la fecha del cierre, el aviso de persona repetida, la pantalla de Eliminados, tu perfil en Configuración y «Invitar»).
- [x] Pantallas: conectar en la Consulta el aviso de persona repetida.
- [x] Revisión de solo lectura de todo lo anterior. Sin fallos graves; lo encontrado ya se corrigió, salvo dos cosas que piden un cambio en la base y esperan tu palabra: que recuperar una guía o un documento suelto quede en el historial, y que cerrar una consulta como contacto compruebe que quien la cierra puede ver a esa persona.
- [x] Correr todas las pruebas automáticas. Pasaron las 2,245; las de navegador se corren antes de publicar, en la etapa D.
- [x] Corregir lo que las pruebas marquen. Fueron dos errores de estilo, ya corregidos.

- [x] Marco del panel: menú lateral con sus grupos (Trabajo, Favoritos, Recientes) y sus conteos, y el buscador.
- [x] Asuntos: cambiar entre Lista, Tablero y Tiempo.
- [x] Inicio con el aspecto nuevo.
- [x] Inmuebles con el aspecto nuevo.
- [x] Directorio y la ficha de la persona con el aspecto nuevo.
- [x] Configuración con el aspecto nuevo.
- [x] Bandeja, Biblioteca, Herramientas, Consultas, Agenda, Formatos, Dinero, Trámites, Equipo y Eliminados con el mismo orden (no tienen pantalla modelo; siguen a las demás).
- [x] La pantalla de Personas, la de entrada al panel y las de aviso (cargando, error) con el mismo orden.
- [x] Mirar cada pantalla en capturas junto a su modelo, en computadora, teléfono y oscuro.
- [x] Recorrer el panel con la base real: 16 pantallas, un asunto y un contrato a medio llenar cargan con sus datos. Catálogos y Bandeja no leen todavía: esperan cambios de la base que se aplican al integrar.
- [x] Ver en pantalla las que faltaban: el informe abierto, la de error y la de carga de una lista. La de carga de pantalla completa no se dejó ver en captura.
- [x] Juntar Personas y Directorio en una sola pantalla, la del menú, sin perder funciones.
- [x] La Bandeja sale del menú hasta su paso: su pantalla guardaba en el panel provisional. Mientras tanto los archivos se suben desde Documentos del asunto.
- [x] Pruebas automáticas otra vez, completas y en una máquina limpia, antes de publicar. Pasaron.

El fallo 7 (el nombre cortado en la Consulta) ya quedó corregido.

### 👉 Etapa B · Que lo pruebes tú

El 19/11 se publicó en fortiusinmuebles.com/panel todo lo de la etapa A, con sus cambios de la base. Se prueba ahí.

- [ ] Entrar como director a /panel y llevar un caso completo, de la consulta al cobro.
- [ ] Entrar con la cuenta de asesor y comprobar que solo ve lo suyo.
- [ ] Revisar las etapas 9 (Equipo) y 10 (Funciones extra), que esperan tu visto bueno.
- [ ] Corregir lo que encuentres.

Ya construido y esperando la siguiente publicación: Agenda y Trámites con la gente del Directorio; tareas con persona, nota y documento; «Recibir los documentos» se marca sola; el inmueble de una consulta del sitio queda ligado al asunto; la comisión estimada; y los hallazgos 21, 22, 25, 28 y 38 de la prueba del 18/11.

### Etapa C · Red de seguridad

- [x] Sacar una copia de respaldo de la base. La copia diaria del 19/11 salió bien y coincide con la base: 65 tablas, 1,434 filas y 61 archivos. No incluye las cuentas de acceso.
- [ ] Probar que la copia se puede restaurar. El ensayo con datos de ejemplo pasó; falta abrir una copia real, y para eso hace falta tu llave: la descargas y la abres en tu equipo, y el agente hace el resto en unos 15 minutos.
- [ ] Activar la entrada en dos pasos de tu cuenta de director.

### Etapa D · El cambio

- [ ] /admin muestra el panel nuevo.
- [ ] El panel provisional se muda a una dirección de reserva, por si hay que volver.
- [ ] /panel lleva solo a /admin, para que los enlaces guardados no se rompan.
- [ ] Pruebas automáticas otra vez.
- [ ] Publicar, con tu permiso.
- [ ] Comprobar en el sitio real que el sitio público sigue igual y que /admin abre el panel nuevo.

*19/11: el cambio está preparado en una rama aparte; falta juntarlo, correr las pruebas de navegador y publicarlo con tu permiso. El panel anterior quedará en /admin-anterior.*

### Etapa E · Primera semana de uso

- [ ] El equipo trabaja una semana en /admin con el panel nuevo.
- [ ] Corregir lo que salga en el uso diario.
- [ ] Decides si ya no hace falta el panel provisional.

### Etapa F · Retirar lo viejo

- [ ] Quitar el panel provisional y su dirección de reserva. Antes, el panel nuevo debe tener lo que hoy solo está en el anterior: el blog, los textos del sitio, cambiar la contraseña y la entrada en dos pasos. Las cuatro cosas ya están construidas en ramas aparte; falta juntarlas.
- [ ] Pruebas automáticas y publicar, con tu permiso.

### Lo que sigue después del cambio (no lo detiene)

- El panel que ajustas tú: catálogos, fichas, tipos de asunto, machotes y Bandeja (etapa 12).
- El aspecto y el orden de app de Mac (modelo en `docs/modelo-visual/`).
- Cargar el inventario real.

**Lo que te toca a ti en este tablero:** probar en la etapa B, dar permiso para publicar en la D y decidir en la E. Lo demás lo hace el agente.

**Este es el plan vigente al día de hoy.** Va a cambiar conforme avance el trabajo. Si un cambio que pidas contradice este plan o `SPEC.md`, el agente te avisa y te propone corregirlo aquí o abrir una rama aparte para ese cambio (ver la sección 19 de `SPEC.md`).

---

## 1. Dónde estamos hoy

**Lo que ya funciona y se queda:**

- El sitio público, fortiusinmuebles.com, publicado con el diseño nuevo (17/11/2026).
- La base de datos, las cuentas de usuario y los permisos.
- Los formatos de Fortius, que generan PDF.
- La lectura de datos desde un documento.
- La copia de respaldo diaria.

**Lo que ya está decidido:**

- Cómo debe funcionar todo: está escrito en `SPEC.md`.
- Cómo debe verse: el boceto aprobado, en `docs/boceto-fortius-por-asuntos.html`. Se abre en el navegador y se puede usar con datos de ejemplo.
- Con qué casos se va a probar: `docs/casos-reales.md`.

**El panel nuevo ya está publicado** en fortiusinmuebles.com/panel (18/11/2026), con las etapas 0 a 10 y los arreglos de la revisión. Las pruebas automáticas pasaron antes de publicarlo y los cambios de la base ya están aplicados.

**Lo que falta:**

- **Que revises las etapas 9 y 10.**
- **Probar las etapas 2 a 10 con datos reales,** con los casos de `docs/casos-reales.md`.
- **El cambio (etapa 11).** Hoy el equipo sigue entrando al panel provisional en fortiusinmuebles.com/admin hasta que el nuevo lo reemplace.

**El punto de partida:**

- Antes de empezar se comprobó que lo que ya existe está sano: la revisión del código no marca errores, las 2,276 pruebas automáticas pasan y el sitio se arma completo sin fallas.
- Ese punto quedó marcado en el repositorio con el nombre `inicio-panel-por-asuntos`. Si algo sale mal durante la construcción, se puede comparar contra él o volver a él.

**En una frase: el panel nuevo está publicado; las etapas 0 a 8 están aprobadas, la 9 y la 10 esperan tu revisión, y falta probar todo con datos reales antes del cambio. La etapa 12, El panel que ajustas tú, está decidida y en construcción.**

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
| **12. El panel que ajustas tú** | Que cambiar el panel no pida programar: las listas, los datos de cada ficha, los tipos de asunto, los apartados, los machotes y los módulos se ajustan en Configuración, y vuelve la Bandeja. Además: valor estimado y aviso de actividad vulnerable, asuntos relacionados y permanentes, aviso de conflicto de interés y fuente consultable | Armas un tipo de asunto de otro giro sin pedirle nada al agente; cargas un machote y sale lleno con lo del asunto; llevas los casos 7 a 12 de principio a fin | Muy grande: once pasos |

**Chica:** una o dos sesiones de trabajo. **Mediana:** varias sesiones. **Grande:** muchas sesiones, con varias revisiones tuyas en medio.

### Lista de comprobación de cada etapa

Una etapa se da por buena cuando todo lo de su lista se puede hacer en el panel, con los casos de `docs/casos-reales.md`. Lo que no pase se corrige antes de seguir, o se anota aquí con su motivo.

**Etapas 0 a 10.** Construidas y publicadas. Sus listas de comprobación, que son el guion para probarlas con datos reales, están en `docs/comprobacion-etapas-0-a-10.md`.

**11. El cambio**

*El paso a paso de esta etapa es el tablero del inicio de este plan.*

- [ ] Hay una copia de respaldo reciente, y se probó restaurarla.
- [ ] El equipo entra al panel nuevo en la dirección de siempre.
- [ ] El sitio público sigue igual.
- [ ] Lo que sobra del panel provisional se retiró y las pruebas siguen pasando.

**12. El panel que ajustas tú**

La idea: primero se captura todo (la persona, el inmueble, el asunto, sus documentos) y después los entregables salen con esos mismos datos; y lo que quieras cambiar del panel lo cambias tú en Configuración, sin pedírselo al agente.

Antes de construir nada se define y se aprueba cómo se ve (paso 0). Después se construye en once pasos, en este orden. Cada paso se prueba y se integra antes de seguir. Los casos 7 a 12 se agregan a `docs/casos-reales.md` cuando se construya la pieza que prueban. Si prefieres que vaya antes de la etapa 11, se cambia el orden aquí.

Paso 0 · Definir cómo se ve (sin programar el panel):

- [ ] Hay un boceto que se abre en el navegador y responde al clic, con: la consulta ajustándose (cambiar preguntas y opciones, poner y quitar recuadros), el editor de una ficha, Configuración con su propio menú, la pantalla de machotes, un apartado de tabla que calcula y la Bandeja.
- [ ] Están en el boceto todos los casos del inventario de abajo («Lo que hoy está fijo»), o se dice cuáles se dejan fijos y por qué.
- [ ] Lo apruebas tú. Lo que el boceto no muestre no se construye sin preguntarte.

*18/11, revisión independiente del diseño: aceptado con pendientes. Un revisor que no participó lo comparó contra diez criterios y los doce casos y encontró 35 fallos; todos eran ciertos y se corrigieron en el boceto, en este plan y en `SPEC.md`. Tomaste las tres decisiones que faltaban: cambiar una plantilla vale para los asuntos nuevos; al inventario entra solo lo que se comercializa; y ante un conflicto de interés decides tú, sin que el asesor vea el asunto ajeno. Pendiente: mirar el boceto corregido en un teléfono y en oscuro, dibujar Inicio y la ficha completa del inmueble, y pasar a lenguaje sencillo las etapas 0 a 10 de este plan.*

*18/11: viste el boceto y dijiste que ya está mejor. Vale como referencia de cómo funciona lo ajustable, no de cómo se ve: se conservan los íconos, los colores, la letra y las piezas del panel de hoy. Quedaron sin dibujar Inicio y la ficha completa del inmueble; se preguntan cuando llegue su paso.*

Paso 1 · Catálogos (sin cambiar ninguna pantalla de trabajo):

- [ ] En Configuración → Catálogos agregas, renombras, reordenas y desactivas un valor.
- [ ] Agregas el papel «Acreedor», le cambias el nombre a otro y los asuntos que ya lo usaban siguen bien.
- [ ] Las listas de las que depende el panel (en qué va un asunto, cómo va una tarea) se renombran, pero no se dejan vacías.
- [ ] Un valor desactivado deja de ofrecerse, y los asuntos que ya lo usan lo conservan.
- [ ] Todas las listas desplegables de hoy leen de los catálogos, con los valores de Fortius ya cargados.
- [ ] Vacías un catálogo: la pantalla usa los valores de Fortius con que empezó y Configuración lo avisa.
- [ ] Los catálogos que todavía no usa ninguna pantalla (tipos de asunto, subtipos, regímenes, motivos de «no procede») quedan creados y con sus valores; sus datos en la consulta y en el asunto llegan en los pasos 4 y 10.

*18/11: construido y sin probar (no se corrieron revisiones, pruebas ni el navegador). Falta que lo pruebes y se integre.*

- **Lo que hay.** En Configuración, solo para el director, la sección Catálogos: eliges la lista, tocas un valor para cambiarle el nombre (y, en los papeles, de qué lado es), lo acomodas arrastrando, lo apagas con su interruptor y agregas valores nuevos. Cada valor guarda su clave para siempre: cambiarle el nombre no toca los asuntos que ya lo usan. Apagar no borra. Cada cambio queda en el historial y, si dos personas guardan a la vez, la segunda ve lo último. Los asesores leen las listas pero no las cambian, y eso lo hace cumplir la base de datos.
- **Trece listas:** tipos de asunto, subtipos sugeridos (cada uno de su tipo), encargos, en qué va un asunto, resultados de cierre, motivos de «no procede», papeles, fuentes de llegada, cómo va una tarea, quién hace una tarea (Fortius, el cliente, el abogado, la notaría, otra persona), tipos de inmueble, regímenes y funciones del equipo (abogado y valuador; asignarlas a cada persona es del paso 2). Empiezan con los valores de Fortius de hoy. Se agregaron «No procede» y «Desistió» a los resultados de cierre (hallazgo 29). Los motivos de «no procede» los propuso el agente («No es de lo que hacemos», «No hay papeles para hacerlo», «No quiso seguir», «Ya no contestó», «Otro»): confírmalos o cámbialos ahí mismo.
- **Las pantallas** (consulta, asunto, Personas, Documentos, Plan, Situación, Inmuebles, Directorio, informe) toman sus listas y sus nombres de los catálogos, con el mismo aspecto de antes. Si una lista se queda sin ningún valor encendido, las pantallas ofrecen los valores con que empezó y Configuración lo avisa.
- **Lo que el panel usa por su clave** se renombra, pero no se apaga: los cuatro encargos (cada uno enciende sus apartados y su primer plan), «Contacto» y «Propietario» (los pone la consulta), «Llamada» y «Sitio» (las fuentes que se ponen solas) y los dos primeros resultados de cierre. «En qué va un asunto» y «Cómo va una tarea» además no admiten valores nuevos: el panel decide con ellos qué sigue y qué está atrasado.
- **Cada papel dice de qué lado es** (hallazgo 27, en parte): quien nos busca, dueños y herederos, del otro lado o quienes ayudan, los mismos cuatro grupos de Personas de hoy, con sus nombres y cada papel donde estaba (propietario, titular, heredero, copropietario y vendedor con los dueños; comprador, inquilino, inversionista y contraparte del otro lado; apoderado, abogado, notaría y banco con quienes ayudan). Cambiarle el lado a un papel en Catálogos vale para todos los asuntos; marcar que en uno es al revés queda con el hallazgo 27. Con el lado, Inicio sabe quién es «el cliente» para escribirle.
- **Hallazgo 26:** quien llama y dice que quiere comprar nace como «Comprador», ya no como «Contacto». Decidido: al abrir el asunto, quien llama puede quedar con cualquier papel que se ofrezca; hoy la consulta elige entre Propietario, Comprador y Contacto. La nota del historial al nacer el asunto dice lo mismo que antes.
- **Si la base no da las listas,** el panel sigue con los valores con que empezó (o con los últimos que vio ese equipo) y lo avisa abajo en cualquier pantalla, con «Reintentar». Abrir un asunto desde la consulta y hacer el informe tampoco se frenan por eso.
- **Apagar no borra, también en las copias:** la siguiente vez de una tarea que se repite, copiar una guía de la Biblioteca, pasar un punto de la opinión al plan, unir dos fichas, continuar un asunto y cargar los casos de ejemplo conservan lo que traía el original aunque ya no se ofrezca. Copiar una guía ahora se hace todo junto: si algo falla, no queda a medias. Al guardar una guía, quién hace cada tarea tiene que ofrecerse (o ya estar en la guía).
- **Solo se guarda lo que se ofrece** vale también para lo que la base hace por encargo de una persona (crear un inmueble, abrir un asunto con sus encargos y su inmueble, continuar un asunto con encargos nuevos). Lo que llega sin persona (el sitio, los avisos automáticos) solo tiene que existir en la lista.
- **Si dos personas agregan el mismo nombre a la vez,** la segunda ve que ya existe; reordenar una lista revisa que nadie la haya cambiado antes.
- **Quién hace una tarea** se renombra y se le agregan valores; «Fortius» y «El cliente» no se apagan, porque el panel los usa (la tarea que no dice quién es de Fortius; con «El cliente», Inicio sabe a quién escribirle). Un valor nuevo todavía no tiene a quién escribirle por WhatsApp.
- **Un tipo de inmueble nuevo** dice en qué categoría sale en el sitio público (casa, terreno, nave…), para que el sitio no se rompa. Mientras no tenga ficha técnica propia (paso 3), su ficha muestra solo los datos comunes.
- **Tres cambios en la base de datos,** en archivos nuevos, que se aplican solos al integrar: el primero crea las listas con sus valores; el segundo hace que cada columna acepte solo los valores de su lista (y siempre el que ya tenía, aunque se haya apagado); el tercero quita las listas que estaban copiadas dentro de las funciones de la base y agrega las copias que conservan (unir fichas, continuar un asunto, copiar una guía).

**Lo que se dejó fijo por ahora, y por qué:**

- Las preguntas de la consulta y sus opciones (qué quiere, de quién es, quién lo ocupa, escritura, qué debe): cada respuesta decide qué documento se pide y con qué encargo se abre; se ajustan con su tipo de asunto en el paso 4.
- La forma de pago, el estado civil y los documentos «comunes» que se ofrecen: están en el inventario, pero no se pidieron para este paso.
- Los estados de un documento, de un paso, de un presupuesto, de un interesado, de una oferta y de la opinión jurídica; la operación y el estado de un inmueble; la clase de tarea y cada cuánto se repite: cada valor tiene su propia regla (qué se ve, qué se cuenta, qué sigue). Quedan para cuando su pantalla se vuelva ajustable.
- Pesos y dólares, la clase de persona, el orden de los apartados y las vistas guardadas.
- Lo que `SPEC.md` deja fijo para todo giro: director y asesor, las horas de cita, las opciones de posponer y los avisos de Configuración.

**Lo que falta probar:** los siete puntos de arriba, con la cuenta de director y con la de un asesor (que no vea Catálogos ni pueda cambiarlas aunque lo intente); abrir un asunto desde una consulta después de apagar una fuente o un papel; unir dos fichas y continuar un asunto que usan un papel apagado; renombrar un tipo de inmueble y ver que el sitio público sigue igual; y el aspecto en teléfono, en claro y en oscuro. Siguen pendientes, de los hallazgos asignados a este paso: el 22 (el motivo de «no procede» como lista: su catálogo ya existe, la pantalla llega en el paso 4), el 27 (los papeles ya dicen su lado, pero falta marcar en cada asunto quién es el cliente) y el 43 (el Directorio todavía no muestra el papel en el renglón, ni filtra por papel, ni tiene «Nueva persona»). El 27 y el 43 piden cambiar cómo se ven el asunto y el Directorio, más allá de leer el catálogo; quedan como pendientes de este paso.

**Pendiente de este paso en las pantallas** (se hace cuando se liberen; hoy otra sesión está cambiando esas pantallas):

- Personas: mientras llegan las listas, los grupos dicen «De quien nos busca», «Del lado del cliente», «De apoyo» y el botón «Agregar persona: …»; deben volver a decir lo de antes («Quien nos busca», «Dueños y herederos», «Del otro lado», «Quienes ayudan» y «Agregar»). Ya con las listas cargadas salen bien.
- Personas: «Agregar» en cada grupo debe crear el mismo papel que antes (Comprador del otro lado, Abogado en quienes ayudan); hoy toma el primero del grupo (en quienes ayudan, Apoderado).
- El asunto (lo común y Documentos) todavía tiene escritas a mano las listas de papeles y de quién hace una tarea; deben leerlas del catálogo.
- Configuración → Catálogos: al reordenar debe mandar la versión de cada valor (la base ya la revisa), y mientras la lista sea la de inicio, porque la base no respondió, no debe dejar cambiarla.
- Cambiar el nombre de un lado (un grupo de Personas) desde Catálogos: falta la pantalla y lo que la guarda.
- Los hallazgos 22, 27 y 43, como se dice arriba.

Paso 2 · Empresa, equipo, folio y módulos:

- [ ] Cambias el nombre, el logotipo y el membrete de la empresa, y salen así en los documentos y en los mensajes.
- [ ] Das de alta a un asesor, entra con su cuenta, y lo das de baja pasando sus asuntos a otra persona.
- [ ] A un asesor le asignas la función «Abogado» y a otro la de «Valuador»; un tercero se queda sin función.
- [ ] El asesor sin función no puede emitir la opinión jurídica: ve «Pedir opinión jurídica», elige a un compañero abogado, al director o a alguien de fuera, y el asunto dice a quién espera.
- [ ] Quien recibe el encargo lo ve en «Para ti», entra a ese asunto aunque no lo lleve, hace la opinión y a quien la pidió le llega el aviso.
- [ ] Lo mismo con la opinión de valor y la función «Valuador». Si la hace alguien de fuera, el asesor sube el resultado y queda anotado quién la hizo.
- [ ] El asunto nuevo nace con folio 2026-0001 y el siguiente con 2026-0002; en enero vuelve a empezar con el año nuevo.
- [ ] Apagas Inmuebles y el sitio público: desaparecen del menú, del asunto y de Inicio, y al encenderlos vuelve todo lo capturado.

Paso 3 · Fichas:

- [ ] A la ficha de una persona le agregas el dato «Número de cliente» y le ocultas «Falleció»; lo ya capturado se conserva.
- [ ] A la ficha de una nave le agregas «Carga eléctrica en kVA» y «Andenes»; a la de una casa, no.
- [ ] La ficha muestra solo los datos que ya tienen valor, y «Agregar dato» ofrece los demás.
- [ ] El nombre y los teléfonos de una persona no se pueden quitar.

Paso 4 · Tipos de asunto:

- [ ] Creas el tipo «Gestoría: trámite vehicular» con sus preguntas de consulta, sus apartados, sus datos propios, su lista de documentos y su plan, sin pedirle nada al agente.
- [ ] En la consulta, las preguntas cambian según el tipo elegido, y cada respuesta pide el documento que tú dijiste.
- [ ] Armas la consulta de un tipo con bloques: creas un bloque de formulario nuevo, renombras «Qué pasa», cambias el orden y eliminas «Otras personas del caso». «Deshacer» lo regresa, y lo ya capturado en consultas anteriores se conserva.
- [ ] «Quién llama» y el tipo de asunto se renombran, pero no se pueden quitar.
- [ ] En la consulta capturas el tipo y el subtipo; el subtipo sugiere según el tipo y acepta texto libre.
- [ ] Cambias el tipo en el asunto y el cambio queda en el Historial.
- [ ] Filtras la lista de Asuntos por tipo y por subtipo, y lo guardas como vista.
- [ ] Al abrir el asunto, del encargo y el tipo salen la lista de documentos y el plan sugeridos.
- [ ] Caso 7 · El amigo de los terrenos. Un amigo manda por WhatsApp fotos de un contrato y una carta finiquito de unos lotes: quiere saber si es legítimo antes de comprar. Nace como consulta de investigación; si el dictamen sale mal, se cierra como «no procede» sin haber creado inmueble en inventario; si sale bien, se convierte en compra.
- [ ] Caso 9 · El extranjero que compra en la costa. Comprador extranjero, inmueble en zona restringida: el camino es fideicomiso bancario. El tipo y el régimen (fideicomiso) sugieren esa lista de documentos solos.

Paso 5 · Apartados que armas tú:

- [ ] Creas un apartado «Cotización» como tabla: concepto, cantidad, precio, importe que se calcula solo, IVA y total. Lo descargas en PDF con el membrete.
- [ ] Creas un apartado de texto con títulos, negritas y listas para el análisis de una opinión.
- [ ] Creas un apartado de formulario con tus preguntas, y sus respuestas quedan en la ficha de la persona o del inmueble.
- [ ] Guardas esos apartados en la Biblioteca y un tipo de asunto los trae ya puestos.

Paso 6 · Machotes:

- [ ] En Configuración cargas un contrato en Word con sus campos, lo cambias y lo mandas a Eliminados.
- [ ] El panel te enseña la lista de campos disponibles para copiarlos al machote.
- [ ] Desde un asunto generas ese contrato: lo que ya está capturado entra solo, lo que falta te lo pregunta y lo contestado vuelve a la ficha.
- [ ] Con dos copropietarios, el contrato lista a los dos.
- [ ] La cotización en Word jala la tabla del apartado «Cotización».
- [ ] Cargas tu hoja de Excel: sale llena con los datos del asunto y con sus fórmulas vivas; la calculas en Excel, la subes y el total queda guardado en el asunto.
- [ ] Sacas la opinión jurídica y la opinión comercial de sus machotes, con los datos del asunto.

Paso 7 · La Bandeja:

- [ ] Subes juntas una escritura, una identificación y un acta: el panel dice qué es cada una, de quién es y a qué asunto va.
- [ ] Al asignarlas quedan en los Documentos del asunto, y el nombre, el CURP, el domicilio, el folio real y la clave catastral llenan las fichas como «por confirmar».
- [ ] Confirmas lo leído y el contrato del paso 6 sale lleno sin capturar nada a mano.
- [ ] Lo que el panel no reconoce se queda en la Bandeja para acomodarlo a mano.

Paso 8 · Valor estimado y actividad vulnerable:

- [ ] Anotas el valor estimado de la operación, con su moneda, o lo dejas vacío.
- [ ] Un asunto de Venta o de Cesión de derechos muestra en su cabecera «Actividad vulnerable: verificar identificación del cliente», y Documentos sugiere la identificación oficial y el formato de actividad vulnerable.
- [ ] Cambias en Configuración el monto del aviso ante la autoridad y a qué tipos aplica.

Paso 9 · Relacionados y permanentes:

- [ ] Caso 10 · La cesión y su juicio. Una cesión de derechos litigiosos cuyo juicio hipotecario es otro asunto abierto: se enlazan como relacionados, el enlace se ve en los dos con el folio del otro, queda en el Historial de ambos y se quita cuando ya no aplica.
- [ ] Caso 11 · La administración que nunca cierra. La plaza del caso 4, dos años después: el asunto de administración sigue abierto como permanente, sin atrasos falsos, sin contar como «sin siguiente paso» y con su revisión mensual.
- [ ] Caso 8 · El dueño que vive en Estados Unidos. Todo por teléfono y poder notarial; nunca viene a firmar. Las tareas dependen de un tercero (el apoderado, el consulado) y el asunto pasa semanas en espera sin contar como atrasado.

Paso 10 · Conflicto de interés y fuente:

- [ ] Caso 12 · La contraparte que llega de cliente. La persona contra la que Fortius lleva un asunto abierto llega a pedir que la representen. La consulta avisa el conflicto antes de «Abrir asunto». El director ve de qué asunto se trata y decide: dejarlo seguir, pasarlo a otra persona, cerrarlo o registrar el conflicto. Un asesor que no lleva ese asunto ve solo «Posible conflicto de interés: el director ya fue avisado», y puede seguir.
- [ ] El mismo aviso sale al agregar a esa persona a un asunto.
- [ ] La fuente de la consulta queda guardada en el asunto, y la lista de Asuntos se filtra por ella.

Paso 11 · El índice y las vistas:

- [ ] En Asuntos eliges qué columnas ver (folio, cliente, contraparte, tipo, lo que sigue) y lo guardas como vista.
- [ ] Ves los asuntos como tablero, con una columna por «en qué va», y en el tiempo.
- [ ] Ves el Plan de un asunto como tablero y en el tiempo, con las tareas que esperan a otra ligadas.
- [ ] Los documentos de una persona se ven en su ficha y los de un inmueble en la suya; el apartado Documentos los reúne todos, con lo que falta y los entregables. No hay sección de carpetas.

*18/11: el boceto del paso 0 está en `docs/boceto-panel-ajustable.html`; espera tu aprobación.*

*18/11: decidida y anotada en `SPEC.md`; sin construir. Hoy ninguna lista se puede cambiar sin programar: no existe dónde guardarlas ni pantalla para editarlas, y casi cada lista está fija en tres lugares a la vez (la pantalla, el servidor y la base). Hay que soltar los tres. Esta etapa trae cambios en la base de datos; se te avisa antes de escribirlos. Tampoco existen hoy el tipo y el subtipo, el valor estimado, la fuente guardada en el asunto, los relacionados, lo permanente, el aviso de conflicto ni el de actividad vulnerable.*

*18/11, ampliada el mismo día: decidiste que el panel es para ti y que lo que buscas es poder ajustarlo sin el agente; por eso la etapa tiene once pasos. De lo que ya existe se aprovecha: los apartados propios (texto, tabla, lista y galería), los datos por tipo de inmueble, la captura por preguntas con la hoja a la vista y la lectura de documentos. Queda por probar, antes del paso 6, cómo sacar un PDF idéntico de un machote de Word; mientras no esté resuelto, el machote sale en Word. Se descartó abrir y editar Excel dentro del panel: saldría caro y peor que Excel; el archivo se llena, se calcula en Excel y se sube de vuelta. Usar la Bandeja con documentos de clientes reales sigue esperando el visto bueno del abogado, y el servicio que lee cobra por documento. La investigación de mercado está en `docs/investigacion/producto-vendible.md`; lo que ahí es para vender a terceros (una base por cliente, facturación, plazos legales) no entra.*

**En qué paso se corrige cada hallazgo de la prueba del 18/11** (la lista está al final de este plan). Los fallos 1 a 12 se corrigen aparte, antes o junto al paso 1, porque no dependen de lo ajustable. Los de la consulta, 13 a 25, en el paso 4; el 22 y el 29, que son listas, en el paso 1. Del asunto: 26 y 27 en el paso 1 (cada papel dice de qué lado es), 28 a 31 en los pasos 8 a 10, 32 a 37 en el paso 5. De las demás secciones: 38 a 40 y 46 en el paso 11; 43 en el paso 1; 47 en el paso 2; 41, 42, 44 y 45 se corrigen aparte. En el paso 4 la plantilla ya dice qué machotes sugiere, pero se usan hasta el paso 6.

**Lo que hoy está fijo y debe poder ajustarse** (inventario del 18/11, hecho usando el panel y leyendo el código). Cada cosa cae en uno de los cuatro niveles de `SPEC.md`: opciones, preguntas y datos, recuadros, o plazos y textos.

| Pantalla | Opciones fijas | Preguntas y datos fijos | Recuadros fijos | Plazos y textos fijos |
| --- | --- | --- | --- | --- |
| **Consulta** | Por dónde (5); las de cada pregunta; los papeles | Las siete preguntas (qué quiere, de quién es, qué es, colonia, quién lo ocupa, escritura, qué debe); nombre, papel, teléfono y «Falleció» de las otras personas; no hay correo ni ciudad | Preguntas, «Para pedirle», «Otras personas del caso», «Lo que ya mandó», «Se abre para» | Qué documento pide cada respuesta; con qué encargo se abre; volver a llamar a los 14 días; el mensaje de WhatsApp para pedir documentos |
| **Inicio** | — | — | Nueve bloques en orden fijo: Por atender, Para ti, Para hoy, Visitas, Esta semana, Lo esperas de otros, Volver a llamar, Por vencer, Por cobrar | Semana de 7 días; «Para ti» de 30 días; ámbar a la hora y rojo a las dos horas |
| **Asunto: cabecera y cierre** | En qué va (5); encargos (4); resultados de cierre (2); posponer (1, 3, 7 o 30 días) | Motivo, «Captó» y «Vendió» al cerrar | Los nueve apartados, con su nombre, ícono, color y orden; qué apartados enciende cada encargo | Cuándo propone pasar a Propuesta, a En marcha o cerrar; espera de 14 días; el primer plan con que nace |
| **Personas** | Papeles (14); clase de persona (3); estado civil (5) | Los datos de la ficha y sus grupos (personales, contacto, identificación y fiscales) | Los cuatro grupos (quien nos busca, dueños y herederos, del otro lado, quienes ayudan); las tres pestañas de la ficha | A quién se le escribe según quién hace la tarea |
| **Documentos** | Estado (3); paso (3); quién entrega; los documentos «comunes» que se ofrecen | — | Los grupos (de la persona, del inmueble, del crédito, otros, informes) | Vencer en 30, 90 o 180 días; avisar 15 días antes; liga del cliente de 14 días y 60 archivos; el mensaje para pedir lo que falta |
| **Plan** | Quién la hace (5); cómo va (4); clase de tarea (7); cada cuánto se repite (6) | Los datos de una tarea | Ver por etapas o en el tiempo | Volver a preguntar a los 3 días; horas de 8:00 a 19:00 cada media hora; el mensaje de «Recordarle» |
| **Situación** | Las mismas listas de la consulta | Los hechos del caso | — | — |
| **Opinión jurídica** | Resultado (3) | Resultado, análisis, qué resolver y quién | — | Las tres salidas de «no factible»; esperar un mes |
| **Honorarios** | Estado del presupuesto (4); forma de pago (5); moneda (2); clase de concepto (2) | Los datos del concepto y del cobro | Presupuesto, contrato, cobros | Vigencia de 15 días; seguimiento a los 3; el reparto de comisión |
| **Interesados** | Estado (5); respuesta a la oferta (4) | Visita y oferta | — | — |
| **Informe para el cliente** | Cada cuánto (3) | — | Las seis partes de la hoja | El párrafo «En qué va» que propone |
| **Inmuebles** | Tipo (7); operación (2); estado (5); las opciones de la ficha técnica | Los datos de la ficha técnica de cada tipo; los cuatro de «Nuevo inmueble» | Las seis pestañas de la ficha; los cuatro filtros de la lista | 5 fotos recomendadas; ficha «lista» con el 60 % de los datos; ciudad Tijuana si no se dice |
| **Directorio** | Los filtros (4) | Lo que muestra cada renglón | Las acciones del menú de cada persona | Llamarle en una semana |
| **Biblioteca** | Las tres clases de guía | — | — | — |
| **Herramientas** | — | Los datos de cada calculadora | Las siete herramientas; los 44 formatos | Plazos de crédito de 10 a 25 años |
| **Equipo** | Director y asesor | — | Los cuatro contadores por persona | — |
| **Menú** | — | — | Las secciones del menú (hoy se reordenan, no se quitan); la barra del teléfono | — |
| **Configuración** | Los cuatro avisos | — | — | — |
| **Todo el panel** | Pesos y dólares | — | — | La hora de Tijuana; la clave +52; archivos de hasta 20 MB; hasta 10 notas fijadas y 30 favoritos; el nombre «Fortius» en mensajes y tareas |

**Dónde se ajusta (decidido el 18/11):** cada pantalla se ajusta ahí mismo, y solo por el director. Cada recuadro (en la consulta, en una ficha, en Inicio o en un asunto) lleva su propio botón «Ajustar»; al tocarlo, ese recuadro se abre para cambiarlo ahí mismo, y «Listo» lo cierra y lo deja para todos. Al final de la pantalla está «Agregar recuadro». Nunca es un interruptor general: tiene que verse en el recuadro que se quiere cambiar. Configuración queda como el índice de todo lo ajustable, para llegar a cualquiera sin buscar la pantalla. El asesor nunca ve «Ajustar».

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
| 0. Preparación | Terminada el 16/11 |
| 1. La base visual | Aprobada el 16/11 |
| 2. Asuntos | Aprobada el 17/11 con datos simulados; falta probarla con datos reales |
| 3. La consulta | Aprobada el 17/11 con datos simulados; falta probarla con datos reales |
| 4. Inmuebles | Aprobada el 17/11 con datos simulados; falta probarla con datos reales y en el sitio |
| 5. Los apartados a fondo | Aprobada el 17/11 con datos simulados; falta probarla con datos reales |
| 6. Documentos y Herramientas | Aprobada el 17/11 con datos simulados; falta probarla con datos reales |
| 7. Directorio y Biblioteca | Aprobada el 17/11 con datos simulados; falta probarla con datos reales |
| 8. Inicio | Aprobada el 17/11 con datos simulados; falta probarla con datos reales |
| 9. Equipo | Construida el 17/11 y publicada el 18/11; espera tu aprobación |
| 10. Funciones extra | Construida el 17/11 y publicada el 18/11 (ventanas, informes, notas y lo de todos los días); espera tu revisión |
| 11. El cambio | Pendiente |
| 12. El panel que ajustas tú | Decidida el 18/11; paso 1 (Catálogos) construido y sin probar |

### Fallos encontrados en la revisión del 17/11

Los 15 fallos de la revisión están corregidos y publicados (18/11), con su cambio de la base ya aplicado.

**Pendiente:**

- El panel provisional no deja escribir a mano un folio FORTIUS en pantalla, pero el servidor lo acepta si alguien manda la petición directo y la base solo revisa que no se repita entre los inmuebles del provisional. Un código igual al folio de un inmueble del panel nuevo quedaría repetido. Hoy no hay ninguno repetido; se cierra al retirar el panel provisional o con un candado en la base.

### Hallazgos de la prueba del 18/11

El agente usó el panel publicado con la cuenta de director: capturó el caso 7 de principio a fin, intentó el caso 12 y recorrió todas las secciones, en computadora y en teléfono. Nada de esto está corregido todavía.

**Fallos:**

- [ ] 1. Un asunto cerrado hoy por la noche dice «Cerrado: no se dio · mañana». La fecha del cierre no se cuenta con la hora de Tijuana.
- [ ] 2. En Documentos, los grupos salen como «persona», «inmueble» y «credito». Deben decir «De la persona», «Del inmueble» y «Del crédito».
- [ ] 3. La consulta no avisa cuando la persona ya existe: con un nombre y un teléfono que ya están en el Directorio no dice nada, y al abrir el asunto crearía una ficha repetida. El aviso solo existe al agregar una persona dentro de un asunto.
- [ ] 4. Un asunto cerrado sigue mostrando «lo que sigue» («Recibir los documentos») en su ficha y en la lista. Debe mostrar el resultado del cierre.
- [ ] 5. No hay pantalla de Eliminados. «Mandar a Eliminados» está en asuntos, Biblioteca, Herramientas y Directorio, pero no hay dónde verlos ni recuperarlos.
- [ ] 6. El mensaje de WhatsApp le dice al cliente «Identificación de quien llama»; debe decir «Tu identificación oficial». Solo trae «Copiar»: falta «Abrir WhatsApp» con su número.
- [ ] 7. El cuadro «Quién llama» corta el nombre a unas 20 letras.
- [ ] 8. El menú lateral y las pestañas de la ficha de una persona muestran barras de desplazamiento aunque todo cabe.
- [ ] 9. Al quitar un encargo el aviso dice «Ya no dice tramitar». Debe decir «Se quitó Tramitar», con «Deshacer».
- [ ] 10. En Configuración, el perfil del director trae un nombre que no se puede cambiar, y aparte sale el titular como persona del equipo «sin cuenta para entrar». Falta unir la cuenta con la persona.
- [ ] 11. «Invitar» está a la vista pero todavía no envía nada. Se oculta hasta que funcione.
- [ ] 12. Las vistas guardadas están escondidas: el botón solo aparece después de filtrar y usa la misma estrella que los favoritos. Siempre visible y con otro ícono.

**Consulta:**

- [ ] 13. «Qué quiere» no tiene «Revisar antes de comprar», «Tramitar», «Juicio» ni «Administrar». «Comprar» supone crédito: mete «Precalificación del crédito» y abre para «Tramitar».
- [ ] 14. «Escritura: Sí / No / No sabe» no alcanza: falta el régimen (contrato privado, sentencia, ejidal, posesión, en sucesión, fideicomiso). Con «No» se quita la escritura de la lista y no se pide nada a cambio.
- [ ] 15. «De quién es» no tiene «De otra persona».
- [ ] 16. «Para pedirle» nace con identificación, escritura y predial antes de saber nada. Que empiece solo con la identificación.
- [ ] 17. «Se abre para» es una etiqueta gris al fondo que no se puede cambiar. Lista desplegable junto a «Abrir asunto».
- [ ] 18. «Sin asunto» parece un estado. Llamarlo «Cerrar sin asunto».
- [ ] 19. Faltan el correo, la ciudad o municipio (hoy solo hay colonia) y el valor estimado.
- [ ] 20. «Por dónde» no tiene Referido, Redes ni Cliente anterior, ni quién lo refirió.
- [ ] 21. Las otras personas del caso no se pueden corregir una vez agregadas; solo quitar.
- [ ] 22. El motivo de «No procede» es texto libre. Lista, con nota opcional.
- [ ] 23. Las consultas sin terminar solo se ven al abrir otra. Ponerlas en Inicio.
- [ ] 24. En «Qué debe» se puede marcar «Nada» junto con «Hipoteca». Al marcar «Nada», se desmarca lo demás.
- [ ] 25. En el teléfono, «Abrir asunto» está arriba, antes de capturar. Abajo y fijo, y sin la barra de secciones mientras se captura.

**Asunto:**

- [ ] 26. Quien llama nace como «Contacto» aunque dijo que quiere comprar. Debe nacer como «Comprador». *Construido el 18/11 con los catálogos; sin probar.*
- [ ] 27. El vendedor queda en «Dueños y herederos» aunque es la contraparte del cliente. Falta marcar quién es el cliente y agrupar por lado. *En parte el 18/11: cada papel ya dice su lado; falta marcar en cada asunto quién es el cliente.*
- [ ] 28. Al cerrar «no se dio» una revisión pregunta «Captó» y «Vendió». Solo si se comercializó y se logró.
- [ ] 29. Solo hay dos resultados de cierre. Faltan «No procede», «Desistió» y los que defina el titular. *Construido el 18/11 con los catálogos; sin probar.*
- [ ] 30. Al menú del asunto le faltan: relacionar con otro asunto, permanente, compartir con un compañero, duplicar e imprimir un resumen.
- [ ] 31. La cabecera no muestra tipo, fuente ni valor.
- [ ] 32. Las notas ocupan un cuarto de cada ventana y su cuadro corta el texto de ayuda. Que empiecen cerradas, con su contador.
- [ ] 33. El filtro de las notas es un interruptor de dos opciones; `SPEC.md` pide una lista de tres.
- [ ] 34. En el Plan, «Nueva tarea» siempre está abierta con cuatro campos. Una línea que se abre al escribir.
- [ ] 35. «Quién la hace» no deja elegir a un compañero ni a una persona concreta del asunto (el apoderado, el consulado).
- [ ] 36. Una tarea no admite nota, archivo ni liga a un documento. «Recibir los documentos» no se marca sola cuando llegan.
- [ ] 37. En la tarea, «Listo» se confunde con dejarla hecha. Llamarlo «Guardar».

**Las demás secciones:**

- [ ] 38. Asuntos: «Todos» incluye los cerrados; abrir en «Abiertos». Faltan filtros de en espera, atrasados, sin siguiente paso y por encargo.
- [ ] 39. Asuntos: sin elegir uno, dos tercios de la pantalla quedan vacíos. Usar ese espacio para una tabla o un tablero por «en qué va».
- [ ] 40. Asuntos: cuatro etiquetas por renglón son muchas; dejar estado y fecha. El botón «+» no dice qué hace.
- [ ] 41. Inicio: las tareas solo se marcan. Agregar posponer y pasar a otra persona en el renglón.
- [ ] 42. Inicio: faltan «Sin siguiente paso» y «En espera que ya toca retomar». En el teléfono sobra «Nueva consulta», que ya está en la barra.
- [ ] 43. Directorio: no hay «Nueva persona», no se ve el papel de cada quien y no se filtra por papel.
- [ ] 44. Inmuebles: faltan filtros por tipo, colonia, estado y asesor.
- [ ] 45. Biblioteca: sin buscador; el número de cada guía no dice qué cuenta; no dice en cuántos asuntos se usó.
- [ ] 46. Equipo: solo contadores. Faltan reportes: cerrados por mes, por fuente, tiempo por etapa e ingresos.
- [ ] 47. Configuración: es una sola página larga. Le faltan Catálogos, Datos de la empresa, Plantillas de mensajes, Números del negocio y Eliminados.

**Encontrado al leer el código, sin comprobar en pantalla:**

- [ ] El reparto de comisión (25 % y 25 %, o 50 % si es la misma persona) que pide `SPEC.md` no está en el panel nuevo.

**Sugerencias por decidir** (propuestas del agente; ninguna está aprobada):

- Copiar solos los documentos de cada asunto a Google Drive: no se pidió.
- Conflicto de interés entre asesores: si el asunto es de otro asesor, el aviso no revela el caso y dice «consulta al director».
- Actividad vulnerable: revisar con el abogado si el monto se fija en unidades que cambian cada año y si la renta también cuenta.
- Lo que falta como sistema de gestión: agenda, exportar a Excel, carga masiva, etiquetas, campos propios y avisos con el panel cerrado.

**No se probó:** Honorarios, Opinión jurídica, Interesados, los formatos, los informes, la ficha del inmueble, el tema oscuro ni la cuenta de asesor.

**Quedó en la base, de prueba:** el asunto EXP-000029 «Terreno en Lomas de Rosarito» (cerrado), sus dos personas marcadas «(ejemplo)», su terreno y una consulta cerrada como «No procede».

### Revisión visual del 18/11

El agente revisó el panel a la vista (computadora, teléfono, oscuro, y como director y como asesor) con datos de ejemplo simulados, y unificó los controles. No cambió colores, letra, íconos, textos ni lo que hace cada control. Nada de esto está guardado en git todavía.

**Las piezas únicas** (todas se ven igual: caja blanca con borde, 34 px en computadora y 44 px en el teléfono):

- Botón (normal, principal, sin borde y de solo ícono).
- Campo de texto, área de texto y teléfono (clave del país y número en una línea).
- Lista desplegable, y lista de varias opciones («Puedes elegir varias»).
- Campo de fecha con calendario propio (dice la fecha con letra; sustituye al calendario del navegador).
- Etiqueta de estado («En marcha», «Hoy», «En espera»…).
- Interruptor y casilla.

**Dónde ya se usan:** la consulta completa; el asunto y sus ventanas (Plan, Situación, Honorarios, Interesados y la ventanita para escribir un nombre o un motivo); la lista de Asuntos. Inicio ya toma el nuevo aspecto de la lista desplegable.

**Corregido:**

- 7: «Quién llama» ocupa todo el ancho y ya no corta el nombre.
- 8: el menú lateral ya no muestra barra de desplazamiento.
- 12: el botón de vistas guardadas siempre está a la vista, junto a «Nueva consulta», con su propio ícono.
- 32: las notas del asunto empiezan cerradas, con su contador, y su cuadro ya no corta la ayuda.
- 34: «Nueva tarea» es una sola línea y se abre al escribir.
- 40: cada asunto de la lista lleva solo «en qué va» y la fecha; quién lo lleva y si es de ejemplo quedan en el globo al pasar el ratón. El botón «+» ahora dice «Nueva consulta».
- «Qué debe» se ve como las demás listas; «Nada» y «No sabe» quitan las otras opciones.
- Las fechas de la consulta, el Plan, Honorarios, Interesados y la ventanita se eligen con el calendario del panel.
- La pantalla ya no brinca al abrir una lista desplegable.
- El interruptor apagado se distingue en el tema oscuro.

**En la consulta, después de la revisión (lo pediste en vivo):**

- «Documentos» es un solo bloque, como lista para palomear. Junta lo que se pide y lo que ya mandó:
  - Marcar un documento quiere decir que ya lo mandó; si se le adjunta su archivo, queda marcado solo.
  - Un archivo suelto se puede ligar después al documento que es.
  - Si se quita el único archivo de un documento, ese documento vuelve a faltar, y «Deshacer» lo deja marcado.
  - «×» quita lo que no aplica; lo quitado se puede volver a pedir.
  - Al abrir el asunto, lo marcado entra a Documentos como recibido, con su archivo si lo tiene.
- «Mandar la lista» se manda por WhatsApp, mensaje de texto o correo, y solo pide lo que falta. Abre la aplicación con el mensaje escrito; lo envías tú.
- Al agregar otra persona, en la consulta y en el asunto, ya no se pregunta si falleció; eso se marca en su ficha.
- Probado con datos simulados: marcar, adjuntar, ligar un archivo suelto, quitar y deshacer; todo sigue igual al volver a cargar la página y llega igual al asunto. Falta probarlo con la base real, porque los cambios de la base se aplican al integrar en main.
- «Sin decir» se ve claramente más tenue que un dato lleno. En el teléfono, «Abrir asunto» va fijo abajo, a todo lo ancho, encima de la barra de secciones; y los renglones de datos llevan un fondo suave para que se note que se pueden tocar.

**El asunto, con sus ventanas (elegiste las ventanas):**

- Cada apartado se abre en su ventana, como dice la especificación: flecha para regresar, botón para elegir dónde se abre (derecha, izquierda, centro o pantalla completa), botón de pantalla completa, y el panel recuerda la elección. En el teléfono, a pantalla completa.
- La lista de asuntos se ve junto al asunto abierto; un botón la oculta y el panel recuerda lo que cada quien elige.
- Del rediseño se queda: el nombre del asunto al frente, con sus datos en una línea; «Lo que sigue» con «Hecha» y «Posponer»; los apartados como renglones limpios con su resumen; y el botón «Notas» con su número.
- Las ventanas son una hoja blanca: el nombre al frente, los controles discretos, los grupos separados por líneas finas en vez de cajas, y entran y salen con un movimiento corto.
- Personas: los grupos vuelven a decir «Quien nos busca», «Dueños y herederos», «Del otro lado» y «Quienes ayudan», también mientras cargan las listas; y «Agregar» en cada grupo crea el papel de siempre (Abogado en quienes ayudan, Comprador del otro lado).
- Probado con datos simulados en computadora, oscuro y teléfono: las cuatro posiciones, que recuerda la elección, ocultar y mostrar la lista, y los grupos de Personas.

**Pendiente:**

- 39: usar el espacio vacío de Asuntos (tabla o tablero por «en qué va»). Pide otra composición; falta que el titular la apruebe.
- 8, segunda parte: las pestañas de la ficha de una persona no se pudieron ver con datos (la ficha no cargó con los datos simulados).
- Pasar al juego único las demás secciones (Inmuebles, Directorio, Biblioteca, Herramientas, Equipo, Configuración) y los botones y etiquetas antiguos que quedan dentro de los apartados y en Inicio.
- El asunto en el teléfono conserva su versión compacta; falta llevarle la misma cabecera («Lo que sigue» con Hecha y Posponer).
- Probarlo con la base real y correr las comprobaciones antes de integrar en main.
