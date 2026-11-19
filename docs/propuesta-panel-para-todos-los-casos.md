# Propuesta: que el panel dé entrada a todos los casos

**Escrita:** 18 de noviembre de 2026.
**Parte de:** `docs/catalogo-de-casos.md` (los casos y los patrones P1 a P22) contra `SPEC.md` y `PLAN.md` del 17 y 18/11/2026.
**Qué es:** la revisión que pedía el encargo del catálogo. **Es una propuesta: nada de esto está decidido ni construido.** Si el titular acepta algo, la regla pasa a `SPEC.md`, el avance a `PLAN.md` y este documento se borra o se acorta.

**Lo comprobado y lo supuesto.** Además de leer `SPEC.md`, el agente revisó las migraciones de `supabase/migrations` para saber qué hay hoy en la base. No corrió el panel ni probó pantallas. Cuando digo «hoy la base…», viene de ahí. Las frecuencias y lo legal siguen siendo supuestos (ver el catálogo).

---

## 1. En una frase

**La estructura aguanta:** el asunto con apartados, personas con papel, tareas con responsable y apartados propios dan entrada a casi todo, aunque a veces a la fuerza. Lo que falta no es otro panel, sino **siete piezas** que los casos piden una y otra vez: preguntas nuevas en la consulta, términos legales, un apartado para el juicio o trámite, asuntos ligados entre sí, el asunto que no termina, avisos de conflicto y de cumplimiento, y más formas de cobrar.

---

## 2. Lo que ya cabe (sin cambiar nada)

Con lo que hay hoy, estos casos se pueden llevar completos o casi:

| Caso | Con qué se lleva hoy |
| --- | --- |
| A1 venta normal, A11 en colaboración, A14 terreno con sentencia | Asunto de comercializar; inmueble compartido; título distinto de escritura anotado en la situación |
| B2 y B12 trámite entre familiares | Caso 5 de `docs/casos-reales.md`; ya probado en el diseño |
| C2 plaza con varios locales | Caso 4; varios inmuebles ligados a su plaza |
| C3 inquilino que busca, B1 comprador con perfil | Asunto con encargo «asesorar» y un apartado propio de tipo galería o tabla con lo que busca |
| D8, D11, H8 trámites sueltos | Asunto de «tramitar» con plan; cada trámite una tarea con responsable |
| H1, H2, H3 consulta corta, revisión y redacción de contrato | Asunto de «revisar» o «asesorar»; entregable en Documentos; honorario fijo |
| F9 comisión no pagada, F10 honorarios sin pagar | Asunto normal; Fortius es el cliente (ver el aviso de P22) |
| E3 testamento y poderes | Gestión notarial como asunto de «tramitar»; poder como documento con vencimiento |
| A6 «¿cuánto vale?» | Herramienta de opinión de valor sin asunto y, si no contrata, contacto con fecha de volver a llamar |

**Cabe a la fuerza** (se puede, pero con un apartado propio inventado cada vez y sin avisos): E1 y E2 sucesiones, E5 y E6 desacuerdo entre varios, D1 ejidal, F1 adjudicación, F13 notificación recibida, C5 administración, G4 inversionista con cartera. De aquí sale casi todo el trabajo de las secciones 3 y 4.

---

## 3. Ajustes chicos (se pueden hacer en la misma rama)

Cada uno dice qué toca y si necesita migración (archivo nuevo en `supabase/migrations`, que **requiere avisarte antes**, según `AGENTS.md`).

| # | Ajuste | Patrón | Qué toca | ¿Migración? |
| --- | --- | --- | --- | --- |
| 1 | **Preguntas nuevas en «los datos de siempre» de la consulta,** cada una en su lista desplegable: ¿el dueño está aquí o fuera?, ¿en qué **régimen** está el inmueble (escriturado, ejidal, posesión, en sucesión, en fideicomiso, con hipoteca, en copropiedad…)?, ¿**vence algo pronto** (notificación, remate)?, ¿están todos de acuerdo?, ¿cómo piensa pagar?, ¿quién firma (casado, viudo, divorciado)? Cada respuesta puede sugerir documentos y un plan de la Biblioteca, sin imponerlos | P4, P7, P9, P1, P14 | Sección 4 de `SPEC.md`; pantalla de consulta | **No.** La consulta guarda esos datos en un campo abierto (hoy: qué quiere, de quién es, tipo, colonia, quién ocupa, escritura, qué debe) |
| 2 | **Papeles nuevos en Personas:** albacea, tutor, cónyuge, fiador u obligado solidario, administrador, perito, topógrafo, gestor, autoridad o juzgado | P7, P8, P12 | Sección 6 de `SPEC.md` y sus agrupaciones («Quienes ayudan», etc.) | **Sí.** Hoy la base solo acepta 14 papeles fijos |
| 3 | **Tareas de tipo «término» y «audiencia»,** que Inicio muestre arriba y en rojo cuando falte poco | P9 | Sección 5 «El Plan» y Inicio | **Sí.** Hoy los tipos de tarea son: tarea, llamada, visita, firma, cita, seguimiento, cobro |
| 4 | **Aviso de «esta persona ya aparece en otro asunto»,** sin frenar y sin mostrar detalles de asuntos que no ves (solo «consulta con el director») | P13 | Sección 6 y sección 12 | No necesariamente (es una consulta en el servidor) |
| 5 | **Motivos de cierre sugeridos:** el cliente se retiró, Fortius renunció, falleció el cliente, se derivó a otro despacho, se entregó el expediente | P21 | Sección 5 «Cerrar un asunto» | **No:** el motivo es texto libre; el resultado se queda en «se logró» o «no se dio» |
| 6 | **Estado de cada interesado:** apartó, firmó promesa, crédito en trámite, se cayó (con motivo y qué pasó con el apartado) | P17 | Sección 5, apartado Interesados | Probable |
| 7 | **Datos nuevos de la persona** en un desplegable «Situación especial»: régimen matrimonial, idioma, lugar y hora, «firma a ruego», aviso de persona vulnerable | P7, P16 | Sección 6 | Sí (datos legales de la persona) |
| 8 | **Estados del documento:** «original en resguardo» (con recibo de entrega y devolución), «verificado en origen» y «dudoso» | P15 | Sección 8 | Probable |
| 9 | **Formas de cobrar:** iguala mensual, por etapa, cuota litis, por hora, anticipo que se aplica a gastos | P11 | Sección 11 | A revisar con la tabla de conceptos del presupuesto |
| 10 | **Aviso de operación con cumplimiento:** un indicador en el asunto que lleva a la lista de lo que falta, sin frenar | P14 | Sección 11 y la guía de cumplimiento | No |

Los ajustes **1 y 4** son los de mejor relación entre lo que cuestan y lo que destapan: el 1 convierte la consulta en un filtro (sale al instante que el caso es ejidal, o que hay un término corriendo), y el 4 evita un problema ético serio.

---

## 4. Cambios grandes (conviene una rama nueva, según la sección 19 de `SPEC.md`)

Cada uno toca varias secciones y trabajo ya hecho. Se propone **tres ramas separadas**, en este orden, para que el titular apruebe una antes de empezar la siguiente.

### Rama A · «El caso jurídico» (P4, P9, P10, P1, P2)
Lo que necesitan sucesiones, juicios, ejidos, adjudicaciones y notificaciones.
- **Un apartado «Trámite o juicio»** que se agrega cuando haga falta: institución, número de expediente, tipo, etapa, contraparte y su abogado, y una tabla de actuaciones. Sirve igual para un juicio que para un trámite en el registro público o en catastro. Hoy los apartados tienen una lista cerrada de 10 claves, así que **requiere migración**.
- **Término legal con fecha límite:** «recibida el…, plazo de… días hábiles». Primero con la fecha puesta a mano; el cálculo automático de días hábiles solo después de que el abogado valide el calendario de días inhábiles (no se inventa la regla).
- **Postura de cada persona** dentro del asunto (quiere vender, quiere quedarse, quiere comprar la parte, no contesta) y un resumen de cuántos están de acuerdo.
- **Rutas posibles del asunto:** la salida se decide después y puede cambiar; el cambio queda en el Historial y no borra nada.
- **Toca:** secciones 4, 5, 6 y la pantalla de Inicio.

### Rama B · «Asuntos ligados y cartera» (P3, P6)
Lo que necesitan el dueño que vive fuera (poder antes de vender), la sucesión antes de vender, la familia con varios asuntos y el inversionista con cartera.
- Hoy el asunto tiene un solo campo, «viene de» (de dónde nació), que solo guarda el **origen**. Falta «**este asunto espera a aquel**» y que el asunto padre muestre cómo van los suyos.
- Una tarea podría esperar a un asunto completo, no solo a otra tarea.
- Una **vista de cartera** por persona o por familia: todo lo suyo junto (asuntos, inmuebles, cobros y vencimientos).
- Alta rápida de muchas unidades (por ejemplo, desde una hoja).
- **Toca:** secciones 3, 5, 6 y el Directorio.

### Rama C · «El asunto que no termina» (P5, P11) — **va: el titular dijo el 18/11/2026 que Fortius cobra al inquilino y liquida al dueño**
Administración de rentas, cobranza a plazos, albacea que rinde cuentas.
- Un tipo de asunto **continuo** que se pausa o se da por terminado, pero no se «cierra».
- Un **calendario de cobros** por periodo (renta del mes, pagada o no, mora) y un **estado de cuenta del propietario**, que se puede mandar como informe del cliente.
- **Dinero ajeno:** como Fortius recibe la renta por cuenta del dueño, el panel debe separar con claridad **lo que es de Fortius** (su comisión) **de lo que es del dueño** (la renta y lo que se le liquida), y llevar el movimiento de cada mes con su comprobante. **No se construye la parte de dinero** hasta que el abogado y un contador digan cómo se maneja (dónde se recibe, facturas e impuestos); lo demás de la rama (calendario de cobros por mes, mora, estado de cuenta) puede avanzar.
- **Toca:** secciones 5, 11 y 14.

---

## 5. Lo que no conviene hacer

- **No crear «tipos de asunto» fijos** (Venta, Litigio, Servicio…). Contradice la idea 3 de `SPEC.md` y los casos que cambian a mitad de camino (I3, F1, E5). Lo que sí conviene: las **rutas posibles** de la Rama A y las metodologías de la Biblioteca.
- **No calcular términos legales solos** hasta que el abogado valide cómo.
- **No frenar** por conflicto de intereses, por cumplimiento ni por un término vencido. Solo avisar con claridad.
- **No abrir el panel a materias sin inmueble** (penal, corporativo, fiscal). El titular lo descartó el 18/11/2026. Sí cabe todo lo que termina en un inmueble, aunque empiece sin uno. Los penales que nacen de un inmueble, fraude y despojo, **sí se llevan** (decidido el mismo día). Los fiscales de un inmueble (predial, valor catastral, impuesto de adquisición) también **sí**. El divorcio cuando lo que se reparte es la casa también **sí**; por eso el aviso de conflicto de intereses (ajuste 4) y la pregunta «¿a quién representamos?» pasan de útiles a necesarios. Lo migratorio **se deriva**: el panel solo necesita poder marcar «se deriva» con una tarea para el otro despacho. Con esto el alcance quedó cerrado. Impugnar un acto de autoridad lleva **términos cortos**, otro motivo para la Rama A. Como fraude y despojo son **urgentes y con mucha evidencia**, refuerzan la Rama A (términos) y el grupo «Evidencia» del ajuste 8.
- **No construir el manejo del dinero de las rentas** (Fortius cobra y liquida, decidido el 18/11/2026) hasta que el abogado y un contador digan cómo se maneja.
- **No inventar un expediente probatorio.** Para la evidencia basta un grupo «Evidencia» dentro de Documentos.

---

## 6. Lo que contradice lo escrito

Según la regla del titular, esto se dice antes de hacerlo:

1. **«Un asunto se cierra como se logró o no se dio»** (`SPEC.md` 5, «Cerrar un asunto») **choca con el asunto continuo** de la Rama C: una administración no se «logra» ni «no se da». Habría que cambiar ese párrafo.
2. **«Asesor: ve solo lo suyo y lo que se le comparte»** (`SPEC.md` 12) **choca con el aviso de conflicto de intereses** (ajuste 4): para saber que una persona es cliente de otro asesor, el sistema tiene que mirar más allá de lo que ese asesor ve. La salida propuesta es avisar sin mostrar detalles. Esto toca también la pregunta abierta de `SPEC.md` 18: «Qué ve exactamente un asesor de los asuntos de otro asesor».
3. **«Todo asunto tiene…» el apartado Inmueble opcional** no choca, pero **«Un inmueble siempre pertenece a un asunto»** (sección 7) deja fuera la administración sin asunto abierto; no hace falta cambiarlo si la administración es un asunto.
4. **«El centro es el asunto»** (idea 2) no choca con una **cartera por cliente**, pero la cartera pone una capa nueva arriba del asunto. Conviene que el titular lo apruebe expresamente.

Si algo de esto se acepta, la pregunta es la de siempre: **¿se corrige en esta rama o se abre una rama nueva?** Recomiendo rama nueva para las tres de la sección 4 (cada una toca más de tres secciones) y ajustes en la misma rama para los de la sección 3.

---

## 7. Prueba de escritorio de los casos elegidos

Se recorrió cada caso paso a paso contra `SPEC.md` y la base. **Lo que no está dicho** es lo que habría que decidir.

| Caso | Qué pasa hoy | Lo que no está dicho |
| --- | --- | --- |
| **E5 · Hermanos en desacuerdo** | Se abre un asunto, se anota a los tres como copropietarios, se hace una nota con lo que quiere cada uno | Dónde queda **quién quiere qué**; cómo se ve que van 2 de 3; qué pasa cuando la ruta cambia de venta a litigio; ¿Fortius puede llevar a los tres o solo a uno? |
| **A2 + B3 · Dueño o comprador en EU** | Teléfono con clave de otro país, persona que representa a otra solo como nota | No hay «representa a» con su poder, ni «el dueño está fuera» desde la consulta; el poder como **asunto previo** no se puede ligar; no hay idioma ni hora local |
| **D1 · Terreno ejidal** | Se captura como terreno; «escritura: no» | La consulta **no pregunta el régimen**; no hay lista de documentos distinta; la jurisdicción agraria no tiene dónde vivir |
| **C5 · Administración para dueño ausente** | Se puede hacer un asunto con tarea que se repite cada mes | No hay renta cobrada por periodo, ni estado de cuenta, ni «terminar contrato»; el asunto no puede quedar abierto sin parecer atrasado |
| **F1 · Deudor con adjudicación** | Cabe como asunto con tareas urgentes | **No distingue un término de un recordatorio**; no hay dónde guardar el número de expediente del juzgado; la ruta (defensa, convenio, venta) no tiene lugar |
| **F13 · Notificación recibida** | Una tarea «revisar notificación» | Falta «recibida el…, plazo de… días»; no hay quién sustituya si el responsable no está |
| **G4 · Inversionista con cartera** | El Directorio muestra sus asuntos | No hay resumen de lo pendiente de todos sus asuntos; no hay aviso de cumplimiento |
| **I3 · El asunto cambia de naturaleza** | Se puede apagar y encender apartados; «Continuar en un asunto nuevo» | No hay forma de decir «era venta y ahora es regularización» dejando la historia entera |
| **I7 + I8 · Contraparte que es cliente** | Nada avisa | El sistema **no detecta** que la persona aparece en otro asunto; el asesor ni siquiera ve ese asunto |
| **F6 · Fraude con WhatsApp y fotos** | La consulta puede adjuntar lo recibido | No hay «urgente» en la consulta; la evidencia queda mezclada con los documentos; no hay verificado o dudoso |

---

## 8. Orden que se recomienda

1. **Dos preguntas pendientes:** si los abogados de Fortius entran al panel con su propia cuenta (catálogo, pregunta 2) y qué hacer con los casos de frontera (pregunta 1). Con la primera se decide la Rama A. El alcance ya quedó en `SPEC.md` (sección 9 de este documento).
2. **Ajustes 1 y 4** (preguntas nuevas en la consulta y aviso de persona repetida): baratos y destapan mucho.
3. **Ajustes 2 y 3** (papeles y tipos de tarea): son una sola migración chica.
4. **Rama A**, luego **Rama B**.
5. **Rama C** solo cuando se conteste la pregunta 3.
6. El resto de los ajustes, según lo que muestre el uso con datos reales.

Todo se prueba con los casos de `docs/casos-reales.md`, que conviene ampliar con los de la sección 5 del catálogo.

---

## 9. Decisión del 18/11/2026: todo asunto termina en un inmueble

**Corrección a mi lectura anterior.** Primero entendí que Fortius atendía asuntos «sin inmueble» en general. El titular lo aclaró: *no todo asunto empieza con un inmueble, pero todo termina en uno.* Fortius, con sus abogados, lleva los juicios y trámites que desembocan en un inmueble y guarda su expediente para el control documental. Ejemplos que dio: el **juicio sucesorio** (al haber sentencia se adjudica un inmueble al heredero y sale a la venta) y la **cesión de derechos**, que en realidad es un **juicio especial hipotecario** cuya sentencia favorable adjudica un inmueble. **Sí** ve derecho registral. **No** ve asuntos penales, corporativos ni fiscales que no tengan que ver con un inmueble.

**Ya anotado en `SPEC.md`** (sección 2, idea 1; sección 5, «Qué es un asunto»; sección 18). No contradice lo escrito: la sección 2 ya incluía la sucesión y el terreno con sentencia. Lo nuevo es que Fortius presta el litigio con sus abogados y que el asunto puede **abrirse sin inmueble ligado**.

**Lo que esto le pide al panel:**
- **El «inmueble esperado»:** un asunto de sucesión o de cesión de derechos nace sin inmueble propio en venta, pero apunta a uno. Hay que poder anotarlo (aunque aún no sea de quien contrata) y que al adjudicarse pase a **venta o renta** con «Continuar en un asunto nuevo», que ya existe.
- **El expediente del juicio** es la parte central: documentos judiciales (demanda, acuerdos, edictos, sentencia), número de expediente, etapa y términos (Rama A, sección 4).
- **Los abogados de Fortius entran al panel con su propia cuenta** (decidido el 18/11/2026; anotado en `SPEC.md`, sección 12). Hoy la base solo conoce dos roles de equipo, director («admin») y asesor («editor»); un tercero, abogado, **requiere migración** y revisar los permisos que hoy dicen «admin o editor». Es una pieza de la Rama A. Aparte existe el papel «abogado» de una persona externa en un asunto (el de la contraparte, por ejemplo); no se confunden.
- **Qué ve el abogado:** solo los juicios que lleva o en los que colabora (decidido el 18/11/2026). Eso encaja con cómo ya funciona la visibilidad de un asesor en la base (ve lo que lleva o en lo que colabora), así que el rol nuevo se apoya en lo existente. Pendiente: si ve honorarios y cobros de esos juicios.
- **La consulta** debe preguntar qué se busca lograr (vender, regularizar, heredar, recuperar, cobrar con garantía) **antes** de las preguntas del inmueble, para no pedir «colonia» cuando lo que llega es una sentencia por venir.

**Pendiente en el encargo** (`SPEC.md`, sección 18): si el encargo necesita una opción propia, algo como «llevar el juicio», para encender el apartado del expediente.
