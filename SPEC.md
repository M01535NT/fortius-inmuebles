# Fortius — especificación del ERP/CRM

**Actualizado:** 14 de noviembre de 2026, America/Los_Angeles. **Responsable de negocio:** Moisés Núñez Tonalá.

Este archivo dice **cómo debe funcionar el sistema**: etapas por ruta, matriz de reglas, dirección del producto y reglas vigentes (RP), proceso de comercialización, alcance, restricciones, decisiones (DEC), criterios de terminado, mapa de módulos e indicadores. Solo cambia cuando el titular decide algo. **Qué falta hacer y cómo va** está en [`PLAN.md`](PLAN.md); lo terminado, en [`docs/erp-crm/historial-del-plan.md`](docs/erp-crm/historial-del-plan.md).

**Origen:** se separó de `ROADMAP.md` el 14/11/2026, a pedido del titular, sin cambiar el texto de ninguna regla. Donde una sección dice «este plan», se refiere al conjunto de este archivo y `PLAN.md`. Solo la sesión central lo edita. Si el titular aprueba algo que contradice una regla, la regla anterior se reescribe en su lugar y se anota en «Reglas reemplazadas».

**Cómo leerlo:** primero «Etapas por ruta» y «Matriz de reglas por ruta»; luego «Dirección del producto y reglas vigentes» (reglas RP); después el proceso de comercialización, el alcance, las restricciones, las decisiones y los criterios.

## Etapas por ruta: qué ve el asesor y qué cierra cada etapa (referencia vigente, 18/10/2026)

La base guarda ocho estados internos (`captacion`, `documentacion`, `comercializacion`, `negociacion`, `cierre`, `entrega`, `postventa`, `cerrado`). Cada ruta los muestra con sus nombres. «Qué la cierra» son los requisitos revisados que exige el servidor para pasar a la etapa siguiente (`requiredReviews`), más los candados de arranque (FLUJO-04a). Con RP-82, un campo vacío no detiene: detienen estos requisitos. La matriz de reglas MRP-01 detallará evidencia, quién revisa, trabajo en paralelo y excepciones.

**Venta del propietario** (ruta `captacion`; 10 etapas en pantalla, en cuatro fases)

| Fase | Etapa que ve el asesor | Estado interno | Qué la cierra |
|---|---|---|---|
| Conocer | 1 Primer contacto (hoy «Prospecto»; cambia con COR-10) | `captacion` | Iniciar la entrevista 02. |
| Conocer | 2 Entrevista inicial | `captacion` | 02 emitido en su versión vigente. |
| Conocer | 3 Levantamiento | `captacion` | 04 emitido en su versión vigente. |
| Conocer | 4 Checklist de documentos | `captacion` | Lista de documentos completa (con «No aplica» justificado tras COR-06). Para salir de `captacion`: entrevista revisada, 02 y 04 emitidos y lista completa. |
| Revisar | 5 Dictamen jurídico | `documentacion` | Titularidad (05) y factibilidad (06, con vigencia) revisadas. |
| Revisar | 6 Opinión de valor y precio | `documentacion` | Valor (07) y precio (08) revisados y decisión de tomar el encargo (RP-96). Solo si la etapa 5 concluyó que el inmueble pasa o pasa con condiciones. La intermediación no se firma antes de esta etapa. |
| Preparar y publicar | 7 Contrato y preparación | `documentacion` | Intermediación (09) **firmada** y revisada (desde la firma el inmueble está captado y el propietario es cliente, RP-90 y RP-91); levantamiento y material, plan (10) y autorización de publicación revisados. |
| Preparar y publicar | 8 Publicación y seguimiento | `comercializacion` | Comprador identificado con capacidad comprobada. Informe mensual al propietario: avisa, no detiene. |
| Vender y cerrar | 9 Visitas y ofertas | `negociacion` | Oferta aceptada (14), revisión actualizada para cerrar (06), instrumento (15) y contraparte. |
| Vender y cerrar | 10 Cierre y entrega · firma y pago | `cierre` | Firma acreditada y pagos para entregar cumplidos según contrato. |
| Vender y cerrar | 10 Cierre y entrega · entrega | `entrega` | Entrega con acta (16). |
| Vender y cerrar | 10 Cierre y entrega · postventa | `postventa` | Registro (17, admite «No aplica»), honorarios (18, admite «No aplica») y archivo. |
| — | Archivada | `cerrado` | — |

La etapa 10 muestra sus cuatro pasos visibles (COR-09) para no dar la venta por terminada al firmar.

**Prospecto o cliente en la venta (RP-90 a RP-93):** en las etapas 1 a 7 el propietario es prospecto y el inmueble está «en captación»; desde que firma el 09 es cliente y el inmueble está captado. El comprador es un lead de Fortius, nunca su cliente: cuando firma la promesa (15) o la compraventa con el propietario queda registrado como **contraparte** de la operación. Hoy el sistema no registra la firma de contratos ni distingue así al prospecto del cliente: lo corrige COR-10.

**Renta del propietario** (ruta `arrendador`). Hoy el servidor le aplica los requisitos de la venta hasta `comercializacion` y la operación muestra las 10 etapas de venta, mientras Hoy usa los nombres de renta. COR-04 la separa con la tabla que defina MRP-01.

| Estado interno | Etapa (nombre de renta) | Qué la cierra hoy |
|---|---|---|
| `captacion` | Captación para renta | Entrevista; candados de arranque. |
| `documentacion` | Revisión y preparación | Los mismos requisitos de la venta (titularidad, factibilidad, valor, precio, intermediación, levantamiento, plan, publicación): **por revisar en MRP-01**. Con RP-91, la intermediación de renta firmada capta el inmueble; el catálogo no tiene ese contrato (el 09 es para venta); se hará a partir de la plantilla del titular (RP-97). |
| `comercializacion` | Oferta de renta | Arrendatario identificado con capacidad. |
| `negociacion` | Selección del arrendatario | Oferta, revisión para cerrar, contrato de renta, contraparte y garantías (admite «No aplica»). |
| `cierre` | Contrato y garantías | Firma acreditada y pagos según contrato. |
| `entrega` | Firma y pagos | Entrega con acta e inventario. |
| `postventa` | Entrega y seguimiento | Término del encargo, honorarios y archivo. |
| `cerrado` | Archivo del encargo | — |

Los nombres de renta están desfasados un lugar respecto a lo que cierra cada estado (por ejemplo, `cierre` se llama «Contrato y garantías» pero pide firma y pagos): COR-04 los alinea.

**Camino de renta aprobado por el titular (17/10/2026, RP-97), que COR-04 debe implementar a partir de MRP-01:** entrevista y levantamiento → documentos básicos (identificación, prueba de propiedad y predial al corriente) → opinión de renta con comparables → contrato de intermediación para renta (captación) → publicación → selección del arrendatario (investigación y garantías) → contrato de arrendamiento → recepción del depósito y garantías → entrega con inventario → cobro de honorarios → seguimiento y archivo. Sin dictamen jurídico completo ni plan de comercialización, salvo que el caso lo necesite y alguien lo agregue. El informe mensual al propietario aplica mientras se promueve. El arrendatario es lead y contraparte, no cliente (RP-93).

**Rutas de compra y búsqueda de renta: superadas por RP-93 (17/10/2026).** Fortius no abre operación ni expediente para quien compra o busca renta: «Quiere comprar» y «Quiere rentar» hacen el perfilamiento y guardan un lead con seguimiento. Las dos descripciones siguientes son el comportamiento actual del código, que COR-11 retira sin borrar los datos existentes.

**Compra** (ruta `compra`): Perfil y capacidad (perfil y privacidad) → Opciones (opciones) → Visitas (visitas y capacidad) → Oferta y negociación (oferta, revisión, instrumento, contraparte) → Firma y pago → Entrega → Postventa (registro, honorarios, archivo) → Archivado. El comprador era prospecto hasta firmar la promesa o la compraventa; con RP-93 queda como lead y contraparte.

**Búsqueda de renta** (ruta `arrendatario`): Necesidades de renta → Opciones → Visitas → Solicitud y condiciones → Contrato y garantías → Firma y pagos → Entrega y seguimiento → Archivo del encargo, con los requisitos de compra adaptados a renta (contrato de renta, garantías, inventario, término). El arrendatario era prospecto hasta firmar el contrato de arrendamiento; con RP-93 queda como lead y contraparte.

**Inversión** (ruta `inversion`): Mandato y criterios → Alternativas → Diligencia y riesgos → Escenarios → Decisión y capital → Ejecución vinculada → Seguimiento de resultados → Archivado (perfil y privacidad; criterios; riesgos; escenarios y capacidad; decisión y ejecución; seguimiento; honorarios y archivo). El inversionista es la excepción a RP-93: es cliente de Fortius desde que firma un contrato de asesoría o mandato (RP-90). La ruta se queda como está, sin trabajo nuevo hasta que haya un caso real (RP-98).

**Lo que falta definir y queda en MRP-01:** qué puede empezar en paralelo (la entrevista y el levantamiento se hacen en la misma visita; publicación, visitas y negociación coexisten) y qué excepciones se aceptan con motivo. Los ciclos de oferta rechazada y promesa caída, los estados de pausa y regularización y el cierre ya están decididos (RP-96 y RP-98). La matriz siguiente lo resuelve.

## Matriz de reglas por ruta (MRP-01) — aprobada por el titular el 26/10/2026 (DEC-26)

**Estado: aprobada por el titular el 26/10/2026 (DEC-26).** Venta, renta, quién revisa y B-16 los revisó punto por punto; B-06 y B-07 los aprobó como están, dejando al agente decidir lo pendiente: los puntos por confirmar quedan como tareas de COR-06, no como bloqueos. Reúne en un solo lugar lo que ya decidió el titular (RP-82 a RP-99 y las respuestas B-01 a B-17 de [`docs/erp-crm/CUESTIONARIO_TITULAR.md`](docs/erp-crm/CUESTIONARIO_TITULAR.md)) y lo compara con lo que hoy exige el servidor (`requiredReviews` y los candados de arranque en `src/lib/formatos/operation-workflow.ts` y `operation-gates.ts`). No cambia código. Cuando el titular la apruebe (DEC-26) es la fuente de COR-04 (renta), de la lista de documentos de COR-06 y del contenido de la versión 1 del motor (MOT-01). Hasta entonces, manda «Etapas por ruta».

**Cómo leerla.** «Decidido» cita la regla o la respuesta del titular; **«Propuesta»** es un hueco que el agente llenó y que el titular confirma o corrige. Cada etapa dice qué se hace y con qué evidencia, quién revisa, desde cuándo puede empezar, qué la termina, qué autoriza avanzar, publicar o firmar, qué excepción se admite y qué puede ir en paralelo.

**Reglas comunes a todas las rutas.**

- **Un dato faltante nunca detiene** (RP-82). Detienen los requisitos revisados de la etapa y los requisitos de protección.
- **Capturar no espera; avanzar sí.** El asesor puede capturar o subir el documento de otra etapa en cuanto lo tenga; solo avanzar de etapa, publicar y firmar esperan su candado (B-04, RP-87).
- **Revisado necesita respaldo.** Un requisito cuenta como revisado con soporte escrito y evidencia: documento con versión, PDF emitido, adjunto o evidencia externa con fecha, responsable y resultado. Los que tienen vigencia (factibilidad y revisión para cerrar) deben estar vigentes (código actual, RP-85).
- **Requisitos de protección, que nunca se saltan** (B-13, RP-96): quién es dueño y quién firma (titularidad); opinión jurídica y comercial antes de firmar la intermediación; firma acreditada; pagos para entregar cumplidos según contrato.
- **Saltar cualquier otro requisito:** solo el director, con motivo escrito y constancia en el historial (B-13, RP-31).
- **Estado de la operación**, aparte de la etapa (B-16, RP-98): Activa, En pausa, En regularización o Descartada.
- **Ciclos** (B-05, RP-98): una oferta rechazada no mueve la etapa; una promesa caída regresa a «Publicación y seguimiento» sin perder historial; dictamen, opinión de valor y contrato siguen valiendo salvo un cambio que obligue a revisarlos; una revisión que descubre faltantes abre pendientes sin reiniciar la operación (RP-87).
- **Alta directa** (B-15): entra en la etapa elegida con nota de antecedentes; los documentos que ya existan se suben como recibidos. Los requisitos de protección de las etapas posteriores siguen aplicando.
- **Quién revisa** (aprobado el 26/10/2026, salvo donde se cita otra cosa): el asesor de la operación prepara y registra; el director marca «Revisado» en lo jurídico, el precio, la decisión de tomar el encargo, la firma de contratos y la autorización de publicar. El asesor marca revisado lo operativo (entrevista, levantamiento, lista de documentos, visitas, entrega). Hoy cualquier usuario del panel con rol de personal puede marcar revisado; separar por rol es SEG-01.

### Venta del propietario (ruta `captacion`)

**Contrato que convierte en cliente:** la intermediación (09) firmada y registrada (RP-90, RP-91, RP-97). Antes, el propietario es prospecto y el inmueble está «En captación». El comprador nunca es cliente: es lead y, al firmar promesa o compraventa, contraparte (RP-93).

| Etapa | Qué se hace y con qué evidencia | Quién revisa | Desde cuándo puede empezar | Qué la termina | Qué autoriza | Excepción admitida | En paralelo y ciclos |
|---|---|---|---|---|---|---|---|
| 1 Primer contacto | Nombre, un medio de contacto, qué quiere y tipo de inmueble; fecha y medio del contacto (RP-82, F01). | Asesor. | Al primer contacto. | Iniciar la entrevista 02. | — | Alta directa (B-15). | Agendar la cita y enviar el aviso de privacidad en la misma llamada (F03, F04). |
| 2 Entrevista inicial | Entrevista 02 con lo necesario y «Ampliar» (RP-89); aviso de privacidad presentado. Evidencia: 02 emitido en su versión vigente. | Asesor marca revisada la entrevista. | Al iniciar la 02. | 02 emitido. | — | — | El levantamiento puede hacerse en la misma visita (RP-87). |
| 3 Levantamiento | Levantamiento 04 de su tipo (04A–04G), fotos y croquis. Evidencia: 04 emitido. | Asesor. | Junto con la entrevista. | 04 emitido. | — | — | Se pide la lista de documentos al cerrar la entrevista (F08). |
| 4 Lista de documentos | Lista preliminar según la entrevista; cada documento recibido o «No aplica» con motivo (COR-06). | Asesor. | Al terminar la entrevista. | Lista completa. Para salir de `captacion`: entrevista revisada, 02 y 04 emitidos y lista completa (candado de arranque actual). | Avanzar a Revisar. | Documentos «por confirmar» cuando dependen de un dato no capturado (RP-89). | Los documentos que lleguen se pueden revisar ya para el dictamen. |
| 5 Dictamen jurídico | Titularidad (05) y opinión jurídica o factibilidad (06, con vigencia). | Director (aprobado el 26/10/2026; con el equipo legal). | En cuanto haya documentos suficientes. | 05 y 06 revisados, con resultado: pasa, pasa con condición o no pasa. | Si no pasa, la operación se descarta sin opinión de valor (RP-96). | Ninguna: titularidad es de protección. | La opinión de valor puede hacerse al mismo tiempo (B-04); pero se emite como conclusión solo si la jurídica pasa o pasa con condición (RP-96, D-11). |
| 6 Opinión de valor y precio | Opinión de valor 07 con comparables; precio y condiciones 08 acordados; decisión de tomar el encargo. | Director decide tomar el encargo (B-03). | Junto con el dictamen. | 07 y 08 revisados y decisión registrada: precio dentro de ±10 % de la opinión de valor y sin impedimentos graves. | Tomar el encargo. | Fuera del ±10 %, el director lo toma con motivo escrito (RP-96). Con condición jurídica, la operación queda «En regularización» (B-03). | — |
| 7 Contrato y preparación | Intermediación 09 **firmada** (contrato completo, fecha y firmantes, RP-97); levantamiento y material comercial verificados; plan de comercialización 10; autorización de publicación. | Asesor registra la firma; director la marca revisada (RP-97). | Después de las etapas 5 y 6 (protección: no se firma antes, B-04). | 09 firmado y revisado; material, plan y publicación revisados. | Desde la firma revisada: inmueble captado y propietario cliente; publicar. Mientras la firma no se revise: «Captado, por revisar», sin publicar (RP-97). | Varios propietarios: «Firma incompleta» hasta que firmen todos (RP-97). En regularización, publicar necesita autorización del director (RP-96). | Fotos y material pueden prepararse antes de la firma; no se publica ni se ofrece en privado sin ella (RP-91). |
| 8 Publicación y seguimiento | Publicación en el sitio y portales; informe mensual al propietario con fecha, medio y quién lo envió (RP-88, RP-98). | Asesor. | Con la firma revisada y la publicación autorizada. | Comprador identificado con capacidad comprobada (12). | — | El informe vencido avisa, no detiene. | Publicación, visitas y negociación coexisten (RP-87). Pausa: se retira de la publicación (RP-98). |
| 9 Visitas y ofertas | Visitas (13) y ofertas (14); revisión actualizada para cerrar (06 vigente); instrumento (15, promesa) y contraparte. | Director revisa la revisión para cerrar y el instrumento (aprobado el 26/10/2026). | Al publicar. | Oferta aceptada, revisión para cerrar vigente, instrumento definido y contraparte identificada. | Firmar la promesa: solo con la condición jurídica resuelta o resuelta por el propio instrumento (RP-96). | Otra inmobiliaria trae al comprador: aliado externo con su porcentaje y acuerdo (B-09). | Oferta rechazada: sigue en esta etapa con la publicación viva. Promesa caída: vuelve a la etapa 8, el comprador vuelve a lead (B-05, RP-93). |
| 10a Cierre · firma y pago | Firma acreditada del instrumento; pagos para entregar cumplidos según contrato (18). | Director. | Con el instrumento definido. | Firma acreditada y pagos cumplidos. | Entregar. | Ninguna: ambos son de protección. | — |
| 10b Cierre · entrega | Entrega material con acta (16) y pendientes asentados. | Asesor. | Con firma y pagos. | Acta de entrega. | — | — | — |
| 10c Cierre · postventa | Registro de la escritura (17, admite «No aplica»); honorarios (18, admite «No aplica»); pedir opinión y referidos (B-11). | Asesor; honorarios, director (aprobado el 26/10/2026). | Tras la entrega. | Registro, honorarios y pendientes resueltos. | Archivar. | — | — |
| 10d Archivo | Se archiva a los 30 días de la entrega si no queda nada pendiente (B-11). | — | — | — | — | Descartada: se archiva con su motivo sin pasar por postventa (B-11, RP-98). | — |

### Renta del propietario (ruta `arrendador`)

**Contrato que convierte en cliente:** la intermediación para renta firmada y registrada (RP-90, RP-97). Su plantilla todavía no está en el catálogo: se hará a partir de la del titular. El arrendatario es lead y contraparte, nunca cliente (RP-93). Camino aprobado por el titular el 17/10/2026 (B-01, RP-97): **sin** dictamen jurídico completo ni plan de comercialización, salvo que el caso lo necesite y alguien lo agregue; el informe mensual al propietario sí aplica mientras se promueve.

| Paso | Qué se hace y con qué evidencia | Quién revisa | Desde cuándo puede empezar | Qué lo termina | Qué autoriza | Excepción admitida | En paralelo y ciclos |
|---|---|---|---|---|---|---|---|
| 1 Entrevista y levantamiento | Entrevista 02 y levantamiento 04 en la misma visita. | Asesor. | Al primer contacto. | 02 y 04 emitidos. | — | Alta directa (B-15). | Se pide la lista de documentos básicos al cerrar la entrevista. |
| 2 Documentos básicos | Identificación, prueba de propiedad y predial al corriente (B-01). | Asesor; titularidad, director (aprobado el 26/10/2026). | Al terminar la entrevista. | Los tres recibidos y titularidad revisada. | — | Ninguna sobre titularidad (protección). Un dictamen completo se agrega solo si el caso lo pide. | La opinión de renta puede hacerse al mismo tiempo. |
| 3 Opinión de renta | Opinión de renta con comparables (el mismo 07 con «Operación: Renta», que su plantilla ya admite; decidido el 26/10/2026). | Director. | Junto con los documentos. | Opinión revisada y renta acordada con el propietario. | Tomar el encargo (mismo criterio de ±10 %, **Propuesta**). | Fuera del margen, con motivo del director. | — |
| 4 Intermediación para renta | Contrato firmado con prueba completa (RP-97). | Asesor registra; director revisa. | Después de los pasos 2 y 3 (protección: no se firma sin opinión jurídica básica y comercial). | Contrato firmado y revisado. | Inmueble captado, propietario cliente, publicar. | Varios propietarios: «Firma incompleta» (RP-97). | — |
| 5 Publicación | Publicación e informe mensual al propietario. | Asesor. | Con la firma revisada. | Arrendatario interesado. | — | El informe vencido avisa, no detiene. | Publicación, visitas y selección coexisten. |
| 6 Selección del arrendatario | Investigación: identificación, comprobantes de ingreso y referencias; garantía elegida: fiador con inmueble, póliza jurídica o depósito doble (B-02, RP-97). | Director (aprobado el 26/10/2026). | Al recibir una solicitud. | Arrendatario aceptado con su garantía. | Firmar el contrato de arrendamiento. | Garantía «No aplica» con motivo (código actual). | Solicitud rechazada: sigue publicado. |
| 7 Contrato de arrendamiento | Contrato firmado con el arrendatario como contraparte. | Director. | Con el arrendatario aceptado. | Contrato firmado (firma acreditada, protección). | — | Ninguna sobre la firma. | — |
| 8 Depósito y garantías | Recepción del depósito y constitución de la garantía (nota del registro de B-01). | Asesor. | Con el contrato firmado. | Depósito y garantía recibidos (pagos para entregar, protección). | Entregar. | — | — |
| 9 Entrega con inventario | Acta de entrega con inventario, estado físico y llaves (16). | Asesor. | Con depósito y garantía. | Acta firmada. | — | — | — |
| 10 Honorarios | Cobro de honorarios (18, admite «No aplica»). | Director (aprobado el 26/10/2026). | Tras la firma o la entrega, según contrato. | Honorarios cobrados. | — | — | — |
| 11 Seguimiento y archivo | Postventa breve, no administración (RP-97, RP-98). | Asesor. | Tras la entrega. | Término del encargo registrado; archivo a los 30 días si nada queda pendiente (aprobado el 26/10/2026, igual que la venta). | Archivar. | Descartada con su motivo (RP-98). | — |

### Inversión (ruta `inversion`)

**Contrato que convierte en cliente:** el contrato de asesoría o mandato firmado con Fortius (RP-90). Es la única operación que no parte de un inmueble del cliente (RP-94). **Decidido (B-10, RP-98):** la ruta se queda como está (mandato y criterios → alternativas → diligencia y riesgos → escenarios → decisión y capital → ejecución vinculada → seguimiento → archivo), sin trabajo nuevo hasta que haya un caso real. Esta matriz no la detalla más; cuando haya un caso, se agrega con el mismo formato.

### Seguimiento del lead comprador o arrendatario (sin operación)

**Decidido (RP-93, B-08, B-17):** no abre operación ni expediente, no firma contrato con Fortius y nunca pasa a cliente.

| Paso | Qué se hace | Qué lo termina | En paralelo y ciclos |
|---|---|---|---|
| Perfilamiento | Qué busca, zona, presupuesto, forma de pago, plazo y capacidad («Quiere comprar» o «Quiere rentar» en Nueva operación, COR-11). | Lead guardado con su próxima acción. | — |
| Seguimiento | Próxima acción con fecha; si busca algo que Fortius no tiene, se contacta al propietario para captarlo (RP-93). | Visita o descarte con motivo. | Puede seguir varios inmuebles a la vez. |
| Visitas y ofertas | Se registran en la operación del propietario (13 y 14). | Oferta aceptada. | Oferta rechazada: vuelve a seguimiento sin perder historial. |
| Contraparte | Al firmar promesa, compraventa o arrendamiento con el cliente, queda como contraparte de esa operación. | Firma del instrumento. | Promesa caída: vuelve a lead en seguimiento (B-05, RP-93). |

### Listas de documentos y pendientes por confirmar

- **B-06 · Formas de pago y sus documentos:** propuesta del agente a partir de fuentes oficiales consultadas el 26/10/2026, **aprobada por el titular el 26/10/2026** (ver la tabla siguiente). Es la fuente de COR-06 para los documentos de cada forma de pago.
- **B-07 · Tipos de inmueble y municipios:** propuesta del agente a partir de fuentes oficiales consultadas el 26/10/2026, **aprobada por el titular el 26/10/2026** (ver la segunda tabla). Municipios: Tijuana, Rosarito, Ensenada y Tecate (titular, 26/10/2026).

**Documentos del vendedor según la forma de pago del comprador (B-06, aprobada el 26/10/2026).** Solo lo que entrega el vendedor (el cliente de Fortius); lo que el comprador presenta a su instituto o banco no entra en la lista del propietario. Cada grupo se suma al grupo A.

| Grupo | Documentos | Fuente oficial y fecha |
|---|---|---|
| A · Siempre | Título o escritura de propiedad **inscrito** en el Registro Público; certificado de inscripción con o sin gravámenes del Registro Público de Baja California (costo consultado: $515, unos 5 días hábiles); predial al corriente; constancia de no adeudo del organismo de agua del municipio (CESPT en Tijuana y Rosarito, CESPE en Ensenada, CESPTE en Tecate; ver B-07); identificación oficial vigente del vendedor; si hay hipoteca, carta del acreedor con el saldo y la instrucción de cancelación. | [Certificado de inscripción con o sin gravámenes, Gobierno de Baja California](https://retys.bajacalifornia.gob.mx/Portal/TyS/539); [Constancia de no adeudo CESPT](https://retys.bajacalifornia.gob.mx/Portal/TyS/1594?temaId=10); [SHF, guía para vender vivienda usada con crédito hipotecario](https://www.gob.mx/shf/documentos/guia-para-vender-vivienda-usada-con-credito-hipotecario) (28/07/2017). |
| B · Infonavit | Estado de cuenta del vendedor con CLABE, de no más de 2 meses; carta de instrucción y manifestación de saldo si la vivienda está hipotecada; el notario pide el **original del primer testimonio** inscrito (con solo copia certificada, prueba de cinco años de posesión con prediales y recibos). | [Infonavit, Quiero comprar](https://portalmx.infonavit.org.mx/wps/portal/infonavitmx/mx2/derechohabientes/quiero_credito/quiero_comprar/); [Requisitos y documentos para comprar (PDF)](https://portalmx.infonavit.org.mx/wps/wcm/connect/5533bb6b-262f-4855-b9ec-d3106baaa141/Requisitos_y_documentos_Comprar.pdf?MOD=AJPERES); [Lineamientos de titulación](https://portalmx.infonavit.org.mx/wps/wcm/connect/46f309a8-3a1f-4161-9b14-52a0dadd6a54/6_Lineamientos_operativos_relativos_a_la_titulacion.pdf?MOD=AJPERES&CVID=nSsQm6d). Sin fecha visible; el PDF no se pudo abrir directamente (se tomó del extracto del buscador): **confirmar en Mi Cuenta Infonavit**. |
| C · Fovissste | Avalúo vigente de un valuador del padrón del Fovissste; certificado de libertad de gravamen vigente para la firma del contrato de mutuo; carta de entrega-recepción firmada por las partes; datos bancarios del vendedor (constancia de nivel cuatro) si el pago se le deposita. | [Fovissste, política de créditos hipotecarios](https://fovissste.gob.mx/politica-de-creditos-hipotecarios/); [Reglas para el otorgamiento de créditos](https://informacion.fovissste.gob.mx/construccion/pdf/Reglas_de_Otrogamiento_de_Credito_FOVISSSTE-27DIC22.pdf) (DOF 27/12/2022, Acuerdo 63.1379.2022; no se encontró versión posterior). |
| D · Crédito bancario | Comprobantes al corriente de luz y, en condominio, de cuotas de mantenimiento; licencia de construcción, planos, alineamiento y número oficial; el avalúo lo pide el banco. Cada banco tiene su propia lista. | [SHF, guía para vender vivienda usada con crédito hipotecario](https://www.gob.mx/shf/documentos/guia-para-vender-vivienda-usada-con-credito-hipotecario) (28/07/2017, la única guía oficial encontrada; está vieja). |
| E · Contado | No hay lista oficial: los requisitos los fija el notario. Aplica el grupo A, más lo que el notario pida para el impuesto de traslado de dominio y el cálculo del ISR. | — |

**Por confirmar al programar COR-06:** la constancia de no adeudo predial de Tijuana (no aparece en la página del Ayuntamiento; consultar a la Tesorería Municipal); si el notario de Fortius pide el certificado de libertad de gravámenes fiscales de la Junta de Urbanización ([trámite](https://www.bajacalifornia.gob.mx/junta_urbanizacion/Servicios/CLGF), $586.59 en Tijuana); la lista vigente de Infonavit. Costos y plazos son los publicados en la fecha de consulta y pueden cambiar.

**Documentos adicionales del vendedor según el tipo de inmueble y el municipio (B-07, aprobada el 26/10/2026).** Se suman al grupo A de B-06.

| Caso | Documentos | Fuente oficial y fecha |
|---|---|---|
| Departamento o local en condominio | Constancia de no adeudo de cuotas (mantenimiento, administración, fondo de reserva y extraordinarias) expedida por el administrador; reglamento del condominio. Sin la constancia, el comprador responde solidariamente por esos adeudos y el notario debe advertirlo. | [Ley sobre el Régimen de Propiedad en Condominio de Inmuebles para el Estado de Baja California](https://www.congresobc.gob.mx/Documentos/ProcesoParlamentario/Leyes/TOMO_IV/LEYINMUEBLE_28ABR2017.PDF) (versión del 28/04/2017; no se confirmó si hay reformas posteriores). |
| Terreno | Deslinde catastral o levantamiento certificado por catastro, hecho por perito registrado (Tijuana: $808, vigencia de un año). Sin toma de agua no se pide la constancia del organismo de agua. | [Tijuana, certificación de deslinde](https://www.tijuana.gob.mx/tramite.aspx?tramite=124); [Reglamento del catastro inmobiliario](https://www.tijuana.gob.mx/normatividad/documentos/Reglamentos/40_202111261471588_wp.pdf). |
| Local, oficina, nave o plaza | Dictamen de uso de suelo (vigencia de un año) o constancia de zonificación (seis meses); licencia de construcción. | [Tijuana, dictamen de uso de suelo](https://www.tijuana.gob.mx/tramite.aspx?tramite=103); [Uso de suelo, Administración Urbana](https://www.tijuana.gob.mx/dependencias/sdue/dau/usodesuelo.aspx). |
| Casa | Sin documentos adicionales. | — |
| Terreno o vivienda del INDIVI | Constancia de no adeudo del INDIVI (precio pagado completo al instituto). | [INDIVI, constancia de no adeudo](https://retys.bajacalifornia.gob.mx/Portal/TyS/749?perfilId=1). |
| Tijuana y Rosarito | Constancia de no adeudo de la CESPT (vigencia de seis meses). | [CESPT, constancia de no adeudo](https://retys.bajacalifornia.gob.mx/Portal/TyS/1594?temaId=10). |
| Ensenada | Constancia de la CESPE: pide deslinde reciente y cuenta sin adeudo (unos $251). | [CESPE, expedición de constancias](https://retys.bajacalifornia.gob.mx/Portal/TyS/867?temaId=10); [trámites de la CESPE](https://retys.bajacalifornia.gob.mx/Portal/TySByOrganismo/76). |
| Tecate | Certificado de libertad de gravamen de la CESPTE (ficha oficial sin requisitos ni costo). | Portal estatal de trámites; **confirmar por teléfono**. |

**Municipios (titular, 26/10/2026):** Fortius trabaja en Tijuana, Rosarito, Ensenada y Tecate. **Por confirmar al programar COR-06:** requisitos y costo de la constancia de la CESPTE en Tecate; requisitos de alineamiento y número oficial en Tijuana (no hay ficha oficial; consultar a Administración Urbana); si la ley de condominios tiene reformas posteriores a 2017. El deslinde, el uso de suelo y la licencia se investigaron en Tijuana; en Rosarito, Ensenada y Tecate se tramitan en su ayuntamiento, con el mismo documento y otros costos y plazos.

Ya resuelto el 26/10/2026:

- ~~B-16 · ¿Vendida, Apartada y Rentada?~~ **Aprobado por el titular el 26/10/2026:** no son estados de la operación sino del inmueble en el inventario: «En captación» → «Disponible» (captado) → «Apartado» (promesa firmada) → «Vendido» o «Rentado» (firma acreditada). La operación conserva solo Activa, En pausa, En regularización y Descartada, y su avance lo dice la etapa. Así el sitio público puede mostrar «Apartado» sin confundirlo con la etapa interna. Si la promesa se cae, el inmueble regresa a «Disponible».
- ~~Confirmar quién revisa y el ±10 % en renta~~: **aprobado por el titular el 26/10/2026**, junto con el archivo a los 30 días en renta y la opinión de valor preparada durante el dictamen pero terminada solo si la jurídica pasa.

### Diferencias con lo que hace el sistema hoy

| Diferencia | Dónde está | Qué la corrige |
|---|---|---|
| La renta usa las 10 etapas de venta en la operación y los requisitos de venta hasta publicar (titularidad, factibilidad, valor, precio, intermediación, levantamiento, plan y publicación). Sus nombres de etapa están corridos un lugar. | `isOwnerRoute` y `requiredReviews` en `operation-workflow.ts`; `routeStages` en `operation-view.ts`. | COR-04, con la tabla de renta de esta matriz. |
| La intermediación cuenta con «revisado», sin registro de firma (contrato, fecha y firmantes). | Requisito `intermediacion`. | COR-10. |
| El catálogo no tiene la intermediación para renta. | `src/lib/formatos/catalog.ts`. | Plantilla del titular (RP-97). |
| Las garantías de renta no tienen la lista de B-02. | Requisito `garantias_renta`. | COR-04. |
| La lista de documentos no admite «No aplica» y depende de datos que la entrevista ya no pide. | `checklist-documentos.ts`. | COR-06, con B-06 y B-07. |
| La opinión de valor no espera a que la jurídica pase: el servidor pide las dos para salir de `documentacion`, sin orden entre ellas. | `requiredReviews`. | MOT-01 (o COR-04 si el titular lo prefiere antes). |
| No hay registro de la decisión de tomar el encargo ni del margen de ±10 %. | — | APR-01 o MOT-01. |
| Cualquier usuario del panel marca revisado; no hay papel de director. | Roles actuales. | SEG-01. |
| No existe la acción «saltar requisito con motivo del director». | — | APR-01. |
| Las operaciones de compra y búsqueda de renta todavía se abren. | Nueva operación, rutas `compra` y `arrendatario`. | COR-11. |

## Dirección del producto y reglas vigentes — 17/10/2026

**Decisión del titular, 17/10/2026:** el ERP/CRM es, por ahora, **exclusivo de Fortius Inmuebles y solo con la marca Fortius**, con todas las mejoras de esta sección. Adaptarlo para que otras inmobiliarias lo usen queda para una **etapa posterior**, que se abre solo cuando el titular lo decida, después de que el sistema funcione en la operación real de Fortius y haya pasado sus pruebas de uso durante un buen tiempo. Las reglas de esta sección prevalecen sobre cualquier regla anterior del plan, del encargo del rediseño o de los manuales.

### Reglas de producto vigentes (RP)

**A. Producto exclusivo de Fortius**

- **RP-01 · Solo Fortius.** El sistema se construye para la operación de Fortius Inmuebles, con su marca, su flujo, su equipo y sus formatos. No se construye nada para atender a otras empresas mientras no se abra la etapa posterior (DEC-15). Tampoco se agrega trabajo «por si acaso»: solo se evita dispersar sin necesidad los datos de marca (logo, colores, razón social y pie de documentos), que se leen de un solo lugar cuando se toque ese código.
- **RP-05 · Roles del equipo de Fortius y permisos por acción.** Papeles previstos: director, coordinador, asesor, asistente, jurídico, contabilidad y aliado externo (otra inmobiliaria con la que Fortius comparte una operación y su comisión). Acciones con permiso propio: ver precio mínimo, ver comisiones, aprobar descuentos, eliminar, exportar y **administrar** (configuración, procesos, equipo y listas del equipo). En este plan, «administrador» significa quien tiene el permiso de administrar: el director y, mientras no exista SEG-01, el rol `admin` actual. (SEG-01, DEC-03)
- **RP-06 · Reglas fiscales y notariales con vigencia.** ISAI, derechos de registro, honorarios notariales y demás reglas se guardan por municipio donde opera Fortius, con vigencia, fuente y responsable. Sin regla vigente para el lugar, el cálculo dice «pendiente»; nunca usa una tasa supuesta. (FIS-01)

**B. Dos ritmos de uso**

- **RP-09 · Guiado por omisión, rápido para quien ya sabe.** Las mismas pantallas sirven al asesor nuevo y al usuario experto. Los atajos no saltan validaciones ni la guía de la operación.
- **RP-10 · Barra de comandos (Ctrl+K / Cmd+K).** Busca y actúa («nueva visita para…», «ir a EXP-…», «marcar tarea como hecha»); solo ofrece lo que el usuario puede ver y hacer. (UX-03)
- **RP-11 · Atajos de teclado** visibles en menús y en una hoja de ayuda («?»). Los de una sola tecla no actúan dentro de campos y se pueden desactivar (WCAG 2.1.4). (UX-03)
- **RP-12 · Acciones masivas** (reasignar, cambiar estado, exportar) con resultado por registro: cuántos se aplicaron, cuáles fallaron y por qué. Reintentar no repite los ya aplicados. (UX-03)
- **RP-13 · Edición directa en la tabla** para estado, responsable y fecha, con el mismo control de versión que la ficha. (UX-03)
- **RP-14 · Preferencias que siguen al usuario.** Densidad (cómoda o compacta), tamaño de letra, tema, columnas, orden, vistas guardadas, barra lateral contraída, fijados, recientes, secciones de Hoy y pantalla de inicio se guardan en el servidor por usuario y aparecen en cualquier equipo. El navegador solo guarda comodidades del dispositivo (última pestaña abierta, borradores temporales). Hoy la densidad (en Mi perfil) y las vistas del inventario existen, pero se guardan en el navegador. (UX-02)

**C. Confianza: que nunca parezca que algo se perdió**

- **RP-15 · Estado de guardado siempre visible:** «Guardado», «Guardando…» o «Sin conexión: tus cambios siguen en pantalla, todavía no se guardan». Nunca se dice «Guardado» antes de que el servidor lo confirme. (UX-04)
- **RP-16 · Deshacer en lugar de confirmar** cuando el servidor puede revertir la acción (completar tarea, archivar, quitar un vínculo, eliminación recuperable): aviso con «Deshacer» durante al menos 5 segundos, anunciado al lector de pantalla y alcanzable con teclado. La confirmación se reserva para lo grave o irreversible: eliminar una operación, cambiar o corregir etapa, enviar algo a un tercero, borrado definitivo. (UX-04)
- **RP-17 · Conflicto de versión explicado.** Si otra persona guardó antes, se muestran «tu cambio» y «el cambio de <persona>» campo por campo para elegir. Nunca se sobrescribe sin elegir. (UX-04)
- **RP-18 · Carga y respuesta inmediata.** Siluetas del tamaño del contenido en vez de pantallas en blanco; los cambios se ven al instante y, si el servidor los rechaza, se revierten con aviso y motivo. (UX-04)
- **RP-19 · Sesión vencida sin pérdida.** Se pide entrar de nuevo y lo capturado en pantalla se conserva. (UX-04, AUT-01)
- **RP-20 · Bandeja «Para ti» dentro de Hoy.** Menciones (@persona en notas), asignaciones, aprobaciones pendientes y respuestas. El contador del menú las suma. No regresa la campana; los avisos fuera del panel siguen en PWA-03. (UX-05)

**D. Disciplina comercial**

- **RP-21 · Ningún contacto sin siguiente paso.** Registrar un contacto toma dos toques («Llamé», «No contestó», «Mandé WhatsApp», «Visitó») y pide el siguiente paso con fecha o un motivo explícito para no tenerlo. (CRM-02)
- **RP-22 · Plantillas de mensaje** de WhatsApp y correo con nombre, inmueble, precio y liga a la ficha. Abren la aplicación del usuario con el texto listo; el envío se registra cuando el asesor lo confirma, no al abrir el enlace. La integración por API es EXT-04. (CRM-02)
- **RP-23 · Reloj de primera atención** en cada prospecto nuevo («Lleva 2 h sin respuesta»), con umbral ajustable en Configuración. Mide con la definición de «Primera atención» del diccionario. (CRM-02)
- **RP-24 · Coincidencias explicadas entre comprador e inmueble** (zona, presupuesto, tipo, recámaras), en los dos sentidos. Son sugerencias; nada se envía solo. (EXT-01)
- **RP-25 · Visita desde el celular:** llegada, opinión del comprador en menos de un minuto (le gustó, precio alto, quiere segunda visita) y foto. Alimenta el informe al propietario. Una visita programada no es una visita realizada. (VIS-01)
- **RP-26 · Negociación como línea de tiempo:** oferta, contraoferta y respuesta, con vencimiento de cada oferta y diferencia contra el precio de salida. Un acuerdo no es un contrato firmado. (OFE-01)

**E. Fichas 360°**

- **RP-27 · Persona:** una sola línea de tiempo con contactos, mensajes registrados, visitas, documentos, ofertas, cambios y notas, con filtros. Una persona con varios papeles no se duplica; en cada operación se ve su papel y si es prospecto o cliente (RP-92). (CRM-03, REL-01)
- **RP-28 · Inmueble:** salud de la ficha (qué tan completa está, días publicado, visitas, prospectos y ofertas), alertas con umbral ajustable en Configuración («60 días sin ofertas: revisa el precio con el propietario») enlazadas a Comparables, e historial de precio con quién, cuándo y por qué. (INV-01)

**F. El dinero a la vista**

- **RP-29 · Tarjeta de dinero en cada operación:** honorario esperado, reparto, cobrado y por cobrar. Cuatro estados que siempre usan la misma palabra, color e ícono: Estimado, Pactado, Facturado y Cobrado. Nunca se suman entre sí. (FIN-01, FIN-02)
- **RP-30 · Pronóstico de ingresos por mes:** honorario por la probabilidad de la etapa que defina Fortius, rotulado «Estimación» y separado de lo cobrado. (FIN-03, DEC-17)
- **RP-31 · Aprobaciones:** comisión bajo el mínimo, descuentos y excepciones a un requisito requieren aprobación del rol que corresponda, con motivo y constancia. El servidor no aplica la acción hasta que se aprueba. (APR-01)
- **RP-32 · Cuenta por asesor:** comisiones generadas, cobradas y pagadas, con estado de cuenta descargable. (FIN-02)

**G. Tableros que llevan a actuar**

- **RP-33 · Tableros por rol.** Director: embudo, tiempo promedio en cada etapa, carga por asesor, inventario envejecido, captaciones y conversión a cliente por origen (contrato firmado, RP-90 y RP-91) y metas. Asesor: sus metas, su embudo y sus pendientes. (TAB-02, TAB-05)
- **RP-34 · Toda cifra se abre** en los registros que la forman y se compara con el periodo anterior y con la meta. Sin fuente suficiente dice «pendiente», nunca cero. (TAB-01)

**H. Documentos**

- **RP-35 · Revisión lado a lado:** el documento y «Marcar como revisado» en la misma vista. (DOC-10)
- **RP-36 · Carga de varios archivos** arrastrando; el sistema propone a qué requisito pertenece cada uno y la persona confirma. Cargar no es revisar. (DOC-11)
- **RP-37 · Pedir un documento al cliente** con una liga segura que vence y se puede revocar; lo recibido entra como «Lo tengo», nunca como revisado. (DOC-12)
- **RP-38 · Vencimientos de todo Fortius** en un solo tablero, por fecha y responsable. (DOC-13)
- **RP-39 · Firma electrónica** integrada cuando se apruebe proveedor (EXT-05). Una firma capturada en pantalla no es firma electrónica.

**I. Calidad de los datos**

- **RP-40 · Fusión asistida de duplicados:** el sistema propone, la persona elige campo por campo, queda historial y se puede deshacer. Nunca es automática. (DAT-02)
- **RP-41 · Validar al capturar:** teléfono con lada (+52 por omisión), correo, RFC, CURP y código postal. (DAT-02)
- **RP-42 · Colonias y códigos postales de catálogo oficial** (SEPOMEX) con fecha de corte; el texto libre solo como «otra», marcado. (DAT-02)
- **RP-43 · Todo monto lleva moneda;** una conversión guarda tipo de cambio, fuente y fecha. **Tipo de cambio del día (titular, 17/10/2026):** el sistema consulta todos los días el FIX de Banxico, lo muestra en un indicador discreto del panel y lo propone al pactar un monto en dólares; el que se pacte queda guardado en la operación. Otro tipo de cambio pactado, como el de una casa de cambio, se captura a mano con su fuente. La clave de la consulta vive solo en el servidor. (DAT-02, FIN-01)

**J. Inteligencia artificial**

- **RP-44 · IA siempre con revisión humana:** resumen de la operación, lectura de INE o escritura para llenar campos (confirmados uno por uno), descripción del anuncio y sugerencia de siguiente paso. Cita su fuente, respeta permisos y nunca cambia estados, aprueba requisitos ni envía nada por sí sola. (EXT-11, EXT-06, DEC-14)

**K. Calidad del producto y soporte**

- **RP-45 · Meta realista de calidad.** No se promete «cero fallas». La meta es detectar los errores antes que el usuario y corregirlos rápido: monitoreo de errores en producción con alertas y sin datos personales. (OBS-01, DEC-19)
- **RP-47 · Pruebas de uso medidas** con los asesores de Fortius: tiempo para crear una operación, registrar una visita y marcar un requisito como revisado, contra metas fijadas antes de medir. Se repiten después de cada cambio grande de pantallas. (PIL-01)
- **RP-48 · Soporte dentro del panel:** ayuda por pantalla (se conserva «¿Qué significa?»), centro de ayuda, «Reportar un problema» con contexto técnico sin datos personales y recorrido inicial que se puede saltar. (SOP-01)

**M. Interfaz sencilla (aprobado el 17/10/2026)**

- **RP-50 · Una pantalla, una pregunta.** Cada pantalla responde una sola pregunta («¿qué hago hoy?», «¿qué sigue en esta operación?», «¿quién es esta persona?») y tiene una sola acción principal visible. (SIM)
- **RP-51 · Nada se dice dos veces.** Una tarea, un pendiente o una acción aparece una sola vez por pantalla, con un solo nombre de botón. (SIM-03, SIM-05)
- **RP-52 · Un color, un significado.** Guinda (`--primary`) solo para la acción principal y la sección activa; lo vencido o urgente en el rojo de alerta (`--destructive`) con ícono y palabra; los precios y las cifras en texto normal. La paleta completa de cinco colores está en RP-70. (SIM-01, LV-01)
- **RP-53 · Letra normal y fechas humanas.** Sin letra monoespaciada en el panel. Fechas como «Hoy», «Mañana», «Lun 19», «Vencida hace 2 días»; nunca «2026-10-17» en pantalla. (SIM-01)
- **RP-54 · Explicar en el momento, no siempre.** Los textos de ayuda aparecen cuando la persona intenta la acción o al tocar «?»; los avisos permanentes y las notas al pie repetidas se retiran. (SIM-01)
- **RP-55 · Mostrar lo actual, esconder lo posible.** Se muestra el estado actual y la siguiente acción obvia; las demás opciones van en «⋯». (SIM-05, SIM-06)
- **RP-56 · Lo de campo, arriba en el celular.** Llamar, WhatsApp y el siguiente paso van primero en el teléfono; nada fijo tapa más de una franja de la pantalla. (SIM-06)
- **RP-57 · Las pantallas vacías enseñan** qué hacer y con qué botón. (SIM-12)

**N. Navegación, personalización y trabajo rápido (aprobado el 17/10/2026)**

- **RP-58 · La barra lateral se adapta, pero no se reordena.** Se puede contraer a íconos y fijar favoritos; las seis secciones principales (Hoy, Operaciones, Contactos, Inmuebles, Agenda y Trámites; LV-09, 14/11/2026) no se mueven ni se ocultan. (NAV-01)
- **RP-59 · Volver nunca cuesta.** Abrir un registro desde una lista no hace perder la lista: vista previa lateral en computadora, y al regresar se conservan búsqueda, filtro y posición. (NAV-03)
- **RP-60 · Listas que se actualizan solas.** Los grupos de trabajo frecuentes («sin contacto en 5 días», «sin próxima tarea») son listas inteligentes, no filtros que cada quien rearma. (NAV-04)
- **RP-61 · Personalizar poco y con límites.** Cada quien puede ajustar lo que ve (secciones de Hoy, tamaño de letra, tema, pantalla de inicio por rol), pero nunca ocultar lo que exige atención ni cambiar los colores con significado. (NAV-05)
- **RP-62 · El sistema propone, la persona decide.** Planes de seguimiento, calificación sugerida y listas crean tareas o sugerencias; nunca envían mensajes ni cambian etapas por sí solos. (NAV-06, NAV-09)
- **RP-63 · Toda acción con gesto tiene alternativa.** Deslizar, arrastrar o pasar el mouse siempre tiene un botón equivalente accesible con teclado y lector de pantalla (WCAG 2.5.1 y 2.1.1). (NAV-07, NAV-12)
- **RP-64 · Lo que ve el cliente sale de los datos públicos.** «Ver como cliente» y cualquier vista para terceros se arman con la proyección pública del inmueble, no escondiendo campos en pantalla. (NAV-10)

**O. Lo que no se hace (decisión del 17/10/2026)**

- **RP-65 · Sin reordenar el menú arrastrando.** Ya existió y se retiró por confuso; para lo frecuente están los fijados (RP-58).
- **RP-66 · Sin tableros armados libremente con widgets.** Hoy solo admite mostrar u ocultar y ordenar sus secciones (RP-61).
- **RP-67 · Sin arrastrar operaciones entre etapas del tablero.** Avanzar es siempre con «Pasar a», que revisa lo que falta.
- **RP-68 · Sin mensajes automáticos a clientes.** Ningún plan, lista o asistente envía WhatsApp, correo o SMS sin que una persona lo confirme (refuerza RP-22 y RP-44).
- **RP-69 · Sin colores personalizados por usuario.** Rompería RP-52; solo se elige tema claro, oscuro o automático.

**P. Lenguaje visual: que se entienda sin leer (aprobado el 17/10/2026)**

- **RP-70 · Cinco colores con significado, siempre con ícono.** Guinda (`--primary`) para la acción principal y la sección activa; azul para información y agenda (incluidas las visitas); verde para lo listo o revisado; ámbar (`--warning`) para lo que necesita atención; rojo (`--destructive`) para lo vencido o con error. Ningún otro color comunica estado. Completa RP-52. (LV-01)
- **RP-71 · Un ícono fijo por concepto.** Cada etapa, tipo de documento y estado tiene un solo ícono (de `lucide-react`, ya instalado), definido en un catálogo único y usado igual en el tablero, la barra de avance, Hoy, las listas y los documentos. (LV-02)
- **RP-72 · El estado se reconoce sin color.** Todo estado combina forma, color y palabra (WCAG 1.4.1). (LV-02)
- **RP-73 · El movimiento confirma, no decora.** Animaciones de 300 ms o menos que confirman una acción o muestran un cambio; ninguna en bucle continuo; todas se apagan con «reducir movimiento». (LV-03)
- **RP-74 · Escala tipográfica fija de `docs/brand.md`:** ocho tamaños para el panel (30/26, 20, 18, 16, 15, 14, 13 y 12 px) más dos de cifra, aprobados por el titular el 13/11/2026; ningún tamaño fuera de ella. Reemplaza la escala de cuatro tamaños del 17/10/2026. (LV-01)

**Q. Proceso, captura y documentos (aprobado el 17/10/2026)**

- **RP-75 · Capturar una vez.** Los datos compartidos de una operación (personas, inmueble, datos legales y condiciones) viven en su ficha única; todos los documentos los leen de ahí. Nadie vuelve a escribir el mismo nombre, RFC, dirección o folio real en otro documento. (FCH-01, FCH-02)
- **RP-76 · Un documento emitido es una foto fija.** Si la ficha cambia después de emitir un PDF, el documento avisa y ofrece una versión nueva; nunca se reescribe solo. Las revisiones que dependían de él se invalidan, como establece DOC-01 (pendiente, bloque 4). (FCH-02)
- **RP-77 · Descargar siempre, avisando lo que falta.** Todo documento se descarga en PDF o Word aunque falten datos, dentro o fuera de una operación: lo faltante sale como línea en blanco y la descarga avisa qué falta, sin impedirla. Queda registrado en el historial con qué datos faltantes se emitió. Lo que no son datos faltantes se conserva: el PDF del contrato 09 sigue bloqueado hasta resolver DOC-09, y la promesa 15 conserva sus reglas legales y de congruencia (Baja California y pleno dominio; si aplica el marco de consumo, exige el modelo registrado; la inmobiliaria no custodia la garantía; montos que suman y fechas en orden; identidad, titularidad y facultades revisadas), que siguen deteniendo su PDF final. Los machotes en blanco de cualquier formato (HER-02) siempre se descargan. (FCH-04, HER-02)
- **RP-78 · Rápido con el cliente, completo en oficina.** Cada pregunta y cada campo se marca «en la llamada», «en la cita» u «en oficina»; frente al cliente solo aparece lo de ese momento, y lo ya dicho se confirma, no se vuelve a preguntar. (CAP-01, CAP-03)
- **RP-79 · Cada operación sigue el proceso de su tipo.** Un proceso base por tipo de operación más módulos que se activan con las respuestas de la entrevista. Fortius los ajusta desde el propio sistema, sin programar; cada operación conserva la versión con la que empezó y el servidor valida con esa versión. Es RP-04 aplicado a Fortius. (MOT-01 a MOT-04)
- **RP-80 · La opinión de valor se captura en el sistema.** El sistema es la fuente y el Excel es una salida. No se lee un Excel subido; si se ajusta en Excel, el archivo final se adjunta y el valor concluido se escribe una vez en la ficha. (FCH-11)
- **RP-82 · Un dato faltante nunca detiene el flujo.** Avanzar de etapa depende de los requisitos del proceso (revisiones con su respaldo, documentos recibidos, decisiones), no de que cada campo esté lleno. Un PDF emitido con datos faltantes cuenta para los candados (FLUJO-04a) y el revisor decide si basta como respaldo de «Revisado». Los faltantes aparecen como **«Datos por completar»** en la ficha y en la operación, separados de «Te falta» (que solo muestra lo que detiene), y se avisan en la bandeja «Para ti» una vez por operación y cuando un documento los necesita. Fortius puede marcar en Configuración algún dato como indispensable para un paso; por omisión, ninguno lo es (con el motor de procesos, esta marca pasa al editor de procesos, MOT-03). Aparte, y fijo, crear una operación pide un mínimo para identificarla: nombre, un medio de contacto, qué quiere y tipo de inmueble. Los requisitos de protección (quién es dueño y quién firma, firma acreditada, pagos para entregar cumplidos según contrato; nombres de RP-86) siguen siendo requisitos. (FCH-04, CAP-03)
- **RP-83 · Trabajo suelto sin abrir operación.** Desde Herramientas se descarga cualquier machote en blanco y se hace cualquier documento o cálculo (opinión de valor, ISR, contrato) sin crear operación ni prospecto; si el cliente contrata, el trabajo pasa a una operación sin volver a capturar. (HER-01 a HER-04)
- **RP-81 · Datos mínimos y confidenciales.** Se pregunta solo lo que el proceso de esa operación necesita; el precio mínimo del propietario solo lo ve quien tiene ese permiso (RP-05); enviar el aviso de privacidad no equivale a consentimiento. (CAP-02, CAP-03)

**R. Coherencia del proceso (aprobado el 18/10/2026, a partir de revisiones externas verificadas en el código)**

- **RP-84 · Una sola definición de «Esperan algo de ti».** Hoy, Operaciones y el número del menú usan la misma función y el mismo orden: 1) hay un problema; 2) tarea vencida; 3) falta un documento de una etapa anterior; 4) documento por revisar; 5) vence hoy; 6) oferta nueva (últimos 3 días); 7) sin próxima tarea con fecha. El número del menú es la cantidad de tarjetas de esa lista más lo no leído de «Para ti» (RP-20). (COR-05)
- **RP-85 · Descargar no es aprobar.** Cada documento tiene un estado propio: Borrador → Revisado → Aprobado (o Firmado, si lleva firma). PDF, Word y Excel son salidas y no cambian el estado. Un PDF con faltantes cuenta como «emitido» para los candados de arranque (RP-82), pero solo un documento revisado respalda un requisito «Revisado». Los controles internos se quedan en el panel; las plantillas que recibe el cliente salen limpias. (FCH-04, LV-02)
- **RP-86 · El nombre sencillo dice lo mismo que la regla.** Una etiqueta no puede prometer más ni menos que el requisito que evalúa el sistema. Por eso: «Firma acreditada» (no «Firma ante notario»), «Pagos para entregar cumplidos según contrato» (no «Pago completo antes de entregar») y «Aviso y controles de privacidad revisados» (no «Aviso de privacidad firmado»), adaptadas a cada ruta. (COR-07)
- **RP-87 · El proceso admite trabajo en paralelo y ciclos.** La matriz de reglas (MRP-01) dice, por ruta y etapa, qué puede empezar, qué debe terminarse y qué autoriza avanzar, publicar o formalizar. La entrevista y el levantamiento se hacen en la misma visita; publicación, visitas y negociación coexisten; una oferta rechazada regresa a seguimiento sin perder historial; una revisión que descubre faltantes abre nuevos pendientes sin reiniciar la operación. (MRP-01, MOT)
- **RP-88 · Preparado no es entregado.** El informe al propietario registra «último preparado» y, aparte, fecha, canal y responsable de entrega (captura manual; no exige integrar WhatsApp ni correo). Lo mismo para visitas: programada, realizada o cancelada (VIS-01). (COR-08)
- **RP-89 · Entrevista con lo necesario y opción «Ampliar».** Mínimo no significa poco: la entrevista pide todo lo que el proceso necesita para funcionar (cada respuesta que alimenta la lista de documentos, el levantamiento, un módulo del proceso o un documento obligatorio) y nada que no se use. Una sección plegada **«Ampliar»** permite capturar el resto (régimen y datos del matrimonio, adquisición, compromisos previos, precio mínimo, condiciones de pago y entrega, datos fiscales) cuando el asesor lo considere útil. Lo que en la cita no se sepa se toma de los documentos en oficina. Si una condición de la lista de documentos depende de un dato no capturado, el documento aparece «por confirmar», no se omite. Respeta la decisión del titular del 17/10/2026 (entrevista para conocer al propietario) y la completa. (CAP-03, COR-06)

**S. Prospecto y cliente (regla del titular, 18/10/2026)**

- **RP-90 · Cliente es quien firmó su contrato con Fortius.** Una persona es **prospecto** hasta que firma el contrato que la obliga con Fortius; desde esa firma es **cliente**. Antes de la firma ninguna de las partes está obligada a hacer negocios. Contrato que convierte en cliente:
  - propietario que vende: el **contrato de intermediación** (09);
  - propietario que ofrece en renta: el **contrato de intermediación para renta**, que se hará a partir de la plantilla del titular (RP-97);
  - inversionista: el **contrato de asesoría o mandato** con Fortius.

  Compradores y arrendatarios no son clientes de Fortius (RP-93). Completar la entrevista, emitir documentos, abrir una operación o registrar una oferta no convierten a nadie en cliente. (COR-10, CRM-01)
- **RP-91 · Inmueble captado = intermediación firmada.** Un inmueble está **captado** desde que el propietario firma el contrato de intermediación; antes está «en captación». Sin esa firma no se publica ni se ofrece, tampoco en privado a compradores conocidos; la única excepción son los inmuebles compartidos de otra inmobiliaria (RP-95). La intermediación no se firma antes de la opinión jurídica y la comercial (RP-96). Un contrato no exclusivo también capta: el inmueble lleva la insignia «Sin exclusiva» y los reportes separan las dos clases. La fecha de captación es la fecha de firma, y con ella cuentan los tableros: la meta de captación se mide en inmuebles con intermediación firmada en el periodo, y los que siguen en captación se muestran aparte, como trabajo en curso. Al registrar la terminación del contrato, o al pausar, descartar, poner en regularización, pausar o rechazar el encargo o regresar a antes de publicar, el inmueble no vuelve a publicarse y el panel le crea al asesor una tarea urgente para retirarlo del sitio (cambiar inmueble, cliente o ruta, perder las revisiones que autorizan publicar o cerrar sin marcar vendido o rentado sí lo retiran solos); retirarlo lo archiva (apaga la publicación y conserva fotos y datos), no lo borra (titular, 13/11/2026). (COR-10, MRP-01)
- **RP-92 · La condición se calcula, no se elige.** «Prospecto», «Cliente», «Cliente anterior» o «Contraparte» salen de los contratos firmados registrados; no se cambian a mano ni dependen de la tabla técnica donde está guardada la persona (`leads` o `clientes`, que no cambian). La condición es por operación: la misma persona puede ser cliente en una venta y prospecto en otra; la lista de personas la muestra como «Cliente» si lo es en alguna operación vigente. Antes de la firma siguen los estados de seguimiento del prospecto (nuevo, contactado, en evaluación, descartado). (COR-10, C24)
- **RP-93 · Fortius representa solo al propietario (titular, 17/10/2026).** Los propietarios pagan a Fortius para localizar compradores o arrendatarios; esas personas son **clientes de nuestros clientes** y, para Fortius, **leads**.
  - En Nueva operación se conservan «Quiere comprar» y «Quiere rentar», pero no abren operación ni expediente: hacen el **perfilamiento** (qué busca, zona, presupuesto, forma de pago, plazo y capacidad) y guardan un lead con su próxima acción de seguimiento.
  - El lead se relaciona con las operaciones de los propietarios por sus visitas y ofertas. Cuando firma la promesa, la compraventa o el arrendamiento con el cliente, queda registrado como **contraparte** de esa operación; no pasa a cliente de Fortius ni tiene expediente propio. Si la promesa se cae, vuelve a ser lead en seguimiento.
  - No se firma contrato de búsqueda con compradores ni arrendatarios. La oferta de compra (14) firmada tampoco cambia su condición.
  - Cuando un comprador se interesa por un inmueble que Fortius no tiene, Fortius contacta al propietario para captarlo; si firma, se abre la operación de ese propietario.
  - Cuando Fortius consigue al comprador de su propio inmueble hay **una sola operación**, la del propietario.

  (COR-10, COR-11, CRM-01)
- **RP-94 · Expediente del cliente y folio por inmueble.** El expediente se abre al propietario, no al inmueble: la ficha del propietario funciona como **expediente del cliente**, con sus datos comunes (nombre, contacto, identificación y aviso de privacidad) y la lista de sus inmuebles. Cada inmueble que comercializa es una operación con su folio `EXP-…` y lleva lo propio: qué quiere, documentos, contrato, condición y asesor. Una operación es el procedimiento para comercializar un inmueble en venta o renta, sin importar su tipo o uso; la asesoría a un inversionista es la única operación que no parte de un inmueble del cliente. Para registrar a una persona bastan nombre completo, interés y un medio de contacto; si el nombre o el teléfono coinciden con otra, el sistema avisa y el asesor elige «es la misma» o «es otra», sin fusión automática. Papeles entre personas e inmuebles: propietario, copropietario, cónyuge que participa, heredero, usufructuario, apoderado, representante de empresa, ocupante o inquilino y contacto para visitas. Registrar un papel no certifica derechos ni facultades. (REL-01, FCH-01)
- **RP-95 · Inmuebles compartidos.** Fortius puede publicar inmuebles captados por otra inmobiliaria sin contar con su expediente. Se registran desde Herramientas como inmueble del inventario con la marca **«Compartido»** y la inmobiliaria ligada como aliado externo (con su porcentaje y su acuerdo adjunto); no son una operación. Para publicarlo hace falta la autorización escrita de esa inmobiliaria, guardada como evidencia. En el sitio se muestra solo lo que ella permita y nunca los datos de su propietario; la etiqueta deja claro que Fortius no tiene su expediente técnico. Su comisión estimada entra a finanzas rotulada «Estimación» y no se suma a lo cobrado hasta cobrarse. (PUB-02)
- **RP-96 · Tomar el encargo y firmar solo con viabilidad.** La intermediación se firma solo cuando el inmueble es **vendible o rentable**: jurídicamente viable, o con una condición que el equipo legal de Fortius pueda subsanar, y con precio dentro de mercado. Por eso la opinión jurídica y la comercial van antes de la firma; no se firma en la primera cita. **Orden:** primero la opinión jurídica (06); la opinión de valor (07) se hace solo si la jurídica concluye que el inmueble pasa o pasa con condiciones (titular, 17/10/2026, D-11). Si no pasa, la operación termina sin opinión de valor.
  - Decide tomar el encargo el director, si el dictamen no tiene impedimentos graves y el precio que pide el propietario está dentro de ±10 % de la opinión de valor. Fuera de ese margen puede tomarlo con motivo escrito.
  - **Captar con condición jurídica** (hipoteca por cancelar, sucesión, embargo u otra que el equipo legal pueda resolver): se firman la intermediación, que sigue el flujo normal, y un contrato de prestación de servicios con los abogados, con cobro aparte por convenir, que no entra en el sistema. La operación queda **«En regularización»** con la condición anotada y quién la da por cumplida. Se puede preparar el material; publicar requiere la autorización del director con la condición visible en la operación, y la promesa o la compraventa no se firman hasta que la condición esté resuelta o el propio instrumento la resuelva (por ejemplo, la hipoteca que se cancela con el precio en la escritura).
  - Solo el director autoriza avanzar sin un requisito, con motivo escrito y constancia en el historial (RP-31). Nunca se saltan: quién es dueño y quién firma; la opinión jurídica y la comercial antes de firmar la intermediación; la firma acreditada; los pagos para entregar cumplidos.

  (MRP-01, APR-01)
- **RP-97 · Registro de la firma y ciclo del contrato.**
  - **Prueba:** un contrato cuenta como firmado solo con las tres cosas: el contrato completo firmado (escaneado o foto legible), la fecha de firma y quién firmó por cada parte. Sin el archivo, la firma no cuenta. Se admite firmado fuera del panel (el PDF del 09 sigue bloqueado por DOC-09).
  - **Quién:** el asesor de la operación registra la firma y el director la marca revisada. Mientras no la revise, el inmueble aparece «Captado, por revisar» y no se publica.
  - **Varios propietarios:** queda captado cuando firman todos los que deben firmar; mientras falte alguno, el contrato aparece como «Firma incompleta», el inmueble sigue en captación y nadie pasa a cliente. Cada propietario queda registrado con lo que puede decidir; si no consta otra cosa, precio, aceptación de oferta y firma necesitan a todos, y fotos y visitas puede autorizarlas el contacto designado.
  - **Apoderado o empresa:** el cliente es el propietario representado; el apoderado o el representante legal queda como firmante, con su papel y su documento de facultades.
  - **Renta:** el propietario que renta firma un contrato de intermediación para renta hecho a partir de la plantilla del titular (pendiente en el catálogo). Al arrendatario se le piden identificación, comprobantes de ingreso y referencias, y la garantía que corresponda: fiador con inmueble, póliza jurídica o depósito doble.
  - **Vencimiento:** «Para ti» avisa 30 y 7 días antes de que venza la intermediación, con la acción «Renovar o cerrar». Si el contrato vence, se rescinde o se cancela sin cerrar la operación, la persona queda como **«Cliente anterior»** con la fecha de término, el inmueble pasa a «Sin contrato» y el panel le crea al asesor una tarea urgente para retirarlo de la publicación (no se retira solo; titular, 13/11/2026), y el historial se conserva. Durante los días de protección posterior del 09, el sistema avisa si aparece un comprador que Fortius presentó.
  - **Descartes:** un prospecto que no firma se descarta con uno de estos motivos: no contesta, precio fuera de mercado, no acepta las condiciones del contrato, se fue con otra inmobiliaria, documentación inviable, desistió u otro (con nota). Se conserva el historial; «No contesta» vuelve como pendiente a los 30 días y los demás solo si la persona vuelve a escribir. Con esos motivos se arma el reporte de por qué no se capta.
  - **Nombres:** el botón «Convertir en cliente» pasa a **«Abrir operación»** y lleva a Nueva operación con la persona elegida; la etapa 1 de la venta pasa a **«Primer contacto»**; el inmueble se muestra **«En captación»** (en lugar de «evaluación») mientras no hay firma y **«Disponible»** solo cuando está captado; los demás estados siguen igual.

  (COR-10)
- **RP-98 · Ciclos, pausas y cierre de la operación.**
  - **Oferta rechazada:** se registra y la operación sigue en visitas y ofertas, con la publicación viva.
  - **Promesa caída:** la operación regresa a «Publicación y seguimiento» sin perder el historial, el inmueble vuelve a «Disponible» y el comprador vuelve a ser lead en seguimiento (RP-93). Dictamen, opinión de valor y contrato siguen valiendo salvo que cambie algo que obligue a revisarlos; bajar el precio o pausar se hace en Ajustes, con motivo.
  - *Pausa, regularización y descarte: redactados por el agente por encargo del titular (17/10/2026); el titular puede corregirlos en B-16 del cuestionario.*
  - **En pausa:** el propietario detiene la comercialización por un tiempo. Lleva motivo y fecha para retomar, crea una tarea urgente para retirar el inmueble de la publicación (no se retira solo; titular, 13/11/2026) y genera una tarea de seguimiento en esa fecha; el contrato sigue vigente.
  - **En regularización:** captado con una condición jurídica que resuelve el equipo legal (RP-96). Se reactiva cuando el responsable marca la condición resuelta.
  - **Descartada:** la operación termina sin éxito con uno de los motivos de RP-97 y se archiva sin pasar por postventa; si había contrato, aplica «Cliente anterior».
  - **Postventa y archivo:** confirmar el registro de la escritura (o «No aplica»), cobrar los honorarios y pedir una opinión y referidos. Se archiva a los 30 días de la entrega si no queda nada pendiente.
  - **Informe al propietario:** se envía por WhatsApp o correo, a elección del asesor. Se registran a mano la fecha, el medio y quién lo envió, sin conectar WhatsApp ni correo. El primer informe vence un mes después de la publicación.
  - **Otra inmobiliaria trae al comprador:** se registra como aliado externo en la operación, con el porcentaje pactado y el documento del acuerdo adjunto.
  - **Alta directa, sin entrevista:** se conserva para casos que ya llegan armados. Pide la etapa en la que entra y una nota de antecedentes; los documentos que ya existan se suben como recibidos.
  - **Inversión:** la ruta se queda visible como está, sin trabajo nuevo hasta que haya un caso real; la calculadora de VAN y TIR sigue en Herramientas.
  - **Administración de rentas:** Fortius todavía no administra rentas; se hará en el futuro y se especificará entonces. La ruta «Administración u otra» sigue como seguimiento simple.

  (MRP-01, COR-04, COR-08, COR-09)

- **RP-99 · Captación y venta son trabajos distintos; el inventario es del equipo (titular, 17/10/2026).** La **captación** va del primer contacto a la firma de la intermediación: la entrevista, el levantamiento, la opinión jurídica, la opinión de valor, el contrato y el plan de comercialización los hace el asesor que capta. Desde la firma, la publicación puede delegarse y **cualquier asesor del equipo puede vender** el inmueble: no hay inventarios separados por asesor. **Regla de redacción (titular, 02/11/2026):** ningún texto del sitio, de los artículos ni de los documentos dice que una sola persona lleva toda la operación. Quien capta y quien vende suelen ser personas distintas, y en una operación pueden participar varias; quien responde ante el cliente es Fortius como persona moral, no un asesor en lo individual.
  - **Reparto de la comisión de Fortius:** 25 % al asesor que capta y 25 % al asesor que vende; si es el mismo, recibe el 50 %. Cada operación guarda quién captó y quién vendió.
  - **Notas del inmueble:** cada inmueble y cada operación llevan un botón discreto «Notas» que abre un panel lateral con notas breves para el equipo, por ejemplo el estado del inmueble para quien lo vende. Las ven los asesores que pueden venderlo; mencionar a alguien avisa en «Para ti». Se retira la página aparte «Notas del equipo» (DEC-25).
  - **Quién edita:** solo el asesor que captó (asesor asignado) y el director o administrador editan el inmueble y su operación. Los demás asesores ven **solo los datos públicos**, lo mismo que un comprador, y venden con la ficha técnica. Para un dato que no sea público preguntan a dirección o al asesor que captó.
  - **Documentos para los abogados del comprador:** si los piden y están disponibles, se firma un convenio de no divulgación (NDA). Después, dirección o el equipo legal los envía al correo de esos abogados. El asesor solo registra la solicitud. Cada envío queda registrado: quién lo pidió, qué se envió, a quién, cuándo y el NDA adjunto.

  (SEG-01, FIN-02, OPS-01)

### Etapa posterior: adaptación para otras inmobiliarias (en pausa)

No se trabaja en esto hasta que el titular lo decida. Se conserva aquí para no perder lo ya pensado. Las entregas correspondientes están en el backlog como «en pausa».

**Criterios propuestos para abrir esta etapa** (los confirma el titular): PIL-01 aceptado; varios meses de operación real de Fortius con el ERP; pruebas de uso medidas en meta; incidencias graves cerradas; recuperación (REC-01) probada; y DEC-15 decidida.

- **RP-02 · Datos separados por empresa.** Cada registro, archivo, folio, respaldo, caché e índice pertenecería a una empresa, con servidor y RLS haciéndolo cumplir. (SAAS-01)
- **RP-03 · Marca por empresa:** logo, colores, dominio y datos de documentos configurables, con Fortius como su propio tema. (SAAS-02)
- **RP-04 · Flujo configurable a partir de la plantilla de Fortius,** versionado por operación y con requisitos protegidos. Para Fortius se construye como motor de procesos (RP-79, MOT-01 a MOT-04, bloque 4); en esta etapa solo quedaría adaptarlo por empresa. (SAAS-03)
- **RP-07 · Alta guiada de una empresa nueva** con importación y revisión de duplicados. (SAAS-05)
- **RP-08 · Planes y límites;** sin pago, solo lectura con exportación, nunca borrar datos. (SAAS-06)
- **RP-46 · Piloto externo** con 2 o 3 inmobiliarias antes de vender. (PIL-02)
- **RP-49 · Propiedad intelectual.** El software no se presenta como patentado: la ley mexicana de propiedad industrial no considera invención a los programas de cómputo por sí mismos. Protección prevista: registro de obra ante INDAUTOR, marca ante IMPI, secreto industrial con convenios de confidencialidad y licencias de uso, confirmado con un abogado de propiedad intelectual (DEC-16). El registro de obra y de marca puede hacerse en cualquier momento sin abrir esta etapa.

**Costo de esperar:** al abrir esta etapa habrá que agregar la frontera por empresa a las tablas, permisos y respaldos existentes con una migración planeada y ensayada. Es un costo conocido y aceptado a cambio de no complicar ahora el sistema de Fortius.

### Reglas reemplazadas

La tabla de reglas reemplazadas hasta el 13/11/2026 está en el historial (§18: [`docs/erp-crm/historial-del-plan.md`](docs/erp-crm/historial-del-plan.md)). Cuando una regla nueva reemplace a otra, se anota aquí con la misma forma (fecha · regla anterior y dónde estaba · regla vigente) y pasa al historial al cerrar la entrega.

| Fecha | Antes | Ahora | Por qué |
|---|---|---|---|
| 14/11/2026 | Barra superior con píldoras (LV-08, DEC-35) | Menú lateral (LV-09) | El titular aprobó el «panel desde cero» en localhost. |
| 14/11/2026 | Panel azul de la operación (LV-06, boceto D) | Encabezado claro con el riel de diez etapas (LV-09) | Misma aprobación. |
| 14/11/2026 | RP-58: cinco secciones principales | Seis secciones, con Trámites (TRA-01, LV-09) | El titular pidió Trámites en el menú («Sí, en la barra», 13/11/2026). |

## Proceso de comercialización de un inmueble — definición del titular, 15/10/2026

Este es el proceso que Fortius sigue para comercializar un inmueble y al que debe adaptarse el panel. Prevalece sobre cualquier nombre de etapa anterior. Aplica a la ruta del propietario (`captacion`); la ruta del comprador se une a él en «Visitas y ofertas».

**Lógica del orden:** conocer → verificar → formalizar y preparar → promover → negociar → cerrar y entregar.

| # | Etapa | Qué se hace | Para qué |
|---|---|---|---|
| 0 | **Captación** | Conocer al propietario, su objetivo y el inmueble; identificar quién puede autorizar la venta y reunir la información inicial. | Saber qué necesita el cliente y si podemos atender la operación. |
| 1 | **Verificación y precio** | Revisar documentos, características y pendientes; comparar propiedades similares y acordar el precio de salida. | Detectar obstáculos y vender con un precio sustentado. |
| 2 | **Contrato y preparación** | Formalizar el servicio, honorarios y autorizaciones; preparar ficha, fotografías y plan de publicación. | Dejar claras las responsabilidades y presentar el inmueble con información respaldada. |
| 3 | **Publicación y seguimiento** | Publicar en los canales acordados, mantener los datos actualizados e informar al propietario sobre consultas y avance. | Generar interesados y evaluar cómo funciona la comercialización. |
| 4 | **Visitas y ofertas** | Coordinar visitas con prospectos compatibles y revisar cada oferta: precio, forma de pago, plazos y condiciones. | Convertir el interés en una propuesta viable que el propietario decida informado. |
| 5 | **Cierre y entrega** | Coordinar la firma con las partes y la notaría, verificar pagos, documentar llaves e inventario y seguir los pendientes. | La operación no termina al aceptar una oferta: debe concretarse y entregarse correctamente. |

### Lo que quedó abierto de PROC y FLUJO

La adaptación del panel a este proceso (PROC-01 a PROC-05) y el flujo del vendedor por documento (FLUJO-01 a FLUJO-07, salvo el 04b) están construidos y en `main`; su registro completo está en [`docs/erp-crm/historial-del-plan.md`](docs/erp-crm/historial-del-plan.md). Siguen abiertos:

- **PROC-06 (opcional):** estado interno propio para «Contrato y preparación». Requiere migración; fuera de alcance hasta nueva indicación del titular (15/10/2026).
- **FLUJO-04b (opcional):** llevar los candados del arranque a PostgreSQL y separar «Redes sociales» de «Página web» como origen. Requiere migración, respaldo y ventana autorizada.
- **DOC-06:** en `main` (06 completo con resultado, antecedentes, marco jurídico y condiciones; commit `ddb0650`). Sigue la revisión del abogado. La viñeta anterior está en el historial (§21).
- **DOC-09:** resuelta y en `main`: el titular descartó el registro PROFECO y el PDF del 09 quedó liberado (DEC-20, PR #72). La viñeta anterior está en el historial (§20).
- **Formato 07:** resuelto: el titular aprobó el PDF de la opinión de valor tal como está (13/11/2026); las fotografías dentro del Excel ya estaban desde el 12/11. La viñeta anterior está en el historial (§22).
- **Ayuda en otros formatos:** las notas y desplegables existen solo en el 07 (`src/lib/formatos/ayuda.ts`); extenderlas al 04, 05 y los demás, con la plantilla como fuente.

## Qué vamos a construir

Un ERP/CRM inmobiliario profesional, exclusivo de Fortius Inmuebles y con su marca, para conducir cada operación desde el primer contacto hasta el cierre: personas, inmuebles, operaciones, documentos, tareas, visitas, ofertas y cobros relacionados. La dirección tendrá tableros comercial, financiero, jurídico y técnico, además de los de cada rol. Cada cifra deberá poder explicarse con sus registros de origen. Las reglas de producto están en «Dirección del producto y reglas vigentes».

El sitio público y el panel siguen siendo una sola aplicación Fortius (RP-01). Adaptarlo para otras inmobiliarias es una etapa posterior, en pausa. Se conserva lo que funciona y se amplía por módulos; no se vuelve a construir desde cero.

## Funciones del producto ampliado

*Nota del 18/10/2026: Finanzas, Análisis territorial, Portal de clientes y las integraciones (firma, OCR, IA, rutas) se retiraron del panel el 15/10/2026; volver a ponerlos es trabajo nuevo, con sus entregas (FIN, EXT-05, EXT-06, EXT-09, EXT-10, EXT-11).*

Referencia de alcance: funciones de la imagen «Foto 1.jpg», incorporadas el 12 de octubre de 2026. Se integran al mismo sistema y comparten personas, inmuebles y expedientes. Son funciones solicitadas para desarrollar; esta incorporación no acredita su implementación.

| Grupo | Funciones que deberá ofrecer Fortius | Entregas relacionadas |
|---|---|---|
| Gestión empresarial | CRM, ERP, gestión e inventario de inmuebles, perfiles de clientes y portal privado para consultar lo que Fortius les comparta. | REL-01, CRM-01, OPS-01, PUB-01, FIN-01/02 y EXT-10. |
| Tableros e inversión | Cuatro tableros de dirección; calculadoras de inversión con TIR y VAN, flujos de efectivo, presupuestos y escenarios de rentabilidad guardados por operación. | TAB-01/02/03/04, FIN-01/02 y EXT-08. |
| Información geográfica | Mapas interactivos del inventario y comparables, análisis de zonas, rutas de visitas y visualizaciones geoespaciales con fuente y fecha. | TEC-01, VIS-01 y EXT-09. |
| Documentos y revisión jurídica | Generación de contratos y formularios PDF desde modelos revisados, expedientes digitales, revisión asistida de cláusulas y búsquedas documentales con RAG: respuestas que remitan al documento, versión y página utilizados. | DOC-01, LEG-01 y EXT-06. |
| Etapa posterior, en pausa (17/10/2026) | Adaptación para otras inmobiliarias: datos separados por empresa, marca por empresa, procesos adaptados por empresa, alta guiada, planes y piloto externo. | SAAS-01 a SAAS-03, SAAS-05, SAAS-06 y PIL-02. |
| Trabajo diario profesional (17/10/2026) | Barra de comandos, atajos, acciones masivas, interfaz simplificada (32 correcciones), barra contraíble, fijados, vista previa lateral, listas inteligentes, planes de seguimiento, lenguaje visual con íconos, colores y formas de estado, captura rápida, ficha única de la operación, descarga con advertencia, expediente en un archivo, motor de procesos por tipo de operación, confianza al guardar, bandeja «Para ti», disciplina comercial, fichas 360°, aprobaciones, reglas fiscales con vigencia, metas, soporte e IA con revisión humana. | SIM-01 a SIM-12, NAV-01 a NAV-14, LV-01 a LV-04, COR-01/02, CAP-01 a CAP-04, FCH-01 a FCH-11, MOT-01 a MOT-04, HER-01 a HER-04, UX-02 a UX-05, CRM-02, CRM-03, INV-01, DAT-02, DOC-10 a DOC-13, FIN-03, APR-01, FIS-01, TAB-05, SOP-01, EXT-01 y EXT-11. |

*(Orden actualizado en «Orden vigente».)* La primera entrega fue captación y próxima acción dentro del panel. Después se amplían documentos, finanzas y tableros; el análisis de inversión, los mapas, el portal de clientes y la IA se entregan por módulos con sus pruebas. Estas capacidades forman parte del producto ampliado solicitado y siguen pendientes. El núcleo inicial puede aceptarse por separado; su aceptación no acredita que el producto ampliado esté completo.

## Alcance del sistema

1. Confiabilidad: recuperación, autenticación, controles de publicación, observabilidad, entornos y permisos.
2. Personas y relaciones: prospectos, clientes, propietarios, compradores, representantes, agentes; organizaciones y varios papeles sin duplicar identidad.
3. Inventario: datos publicables separados de datos internos, propietarios y responsables, evidencias y estado de publicación.
4. Operaciones: expediente como primera referencia operativa, etapas, requisitos, excepciones, tareas y agenda.
5. Comercial: visitas, retroalimentación, ofertas/contraofertas, próximos pasos y vínculo estable con las carteras actuales.
6. Documentos: borrador, revisión, emisión, copia firmada y archivo; trazabilidad por versión y autor.
7. Técnico: levantamientos, fuentes, discrepancias, fotografías y revisiones.
8. Jurídico: requisitos, hallazgos y revisión profesional; el software no reemplaza dictámenes.
9. Financiero: presupuestos, obligaciones, comprobantes, cobros/egresos, comisiones y exportación operativa. Estados financieros certificados, CFDI y conexión bancaria no se presuponen.
10. Cuatro tableros: comercial, financiero, jurídico y técnico, con filtros y detalle de registros.
11. UX: navegación modular, búsqueda, vistas guardadas, formularios por contexto y trabajo diario por rol.
12. PWA: instalación y uso conectado; funciones adicionales de campo evaluadas por separado.
13. Crecimiento: paginación, integridad concurrente, carga de archivos, adopción, documentación y medición.
14. Análisis de inversión: TIR, VAN, flujos de efectivo, presupuestos y rentabilidad por escenario; supuestos y resultados separados de movimientos efectivos.
15. Geografía: inventario y comparables en mapas, análisis de zonas, rutas y capas con procedencia; límites y permisos para ubicaciones privadas.
16. Portal de clientes: acceso externo restringido a información y documentos compartidos de su operación, separado de las cuentas del equipo.
17. IA documental: búsqueda con fuentes y revisión asistida de cláusulas; propuestas revisables, vinculadas al expediente y sin aprobación jurídica automática.
18. Calidad y soporte: monitoreo de errores, pruebas de uso medidas, ayuda y reporte de problemas dentro del panel.
19. Adaptación para otras inmobiliarias: etapa posterior, en pausa (ver «Dirección del producto»).

## Restricciones globales

- Conservar identidad Fortius, tipografías internas, contraste claro, animaciones pertinentes y accesibilidad. El panel usa solo la marca Fortius (RP-01).
- Conservar web pública, SEO, formularios, herramientas financieras, PDFs, inventario, rutas y edición de contenido.
- Conservar propiedades demo; excluir o incluirlas explícitamente en reportes operativos sin eliminarlas.
- Reutilizar componentes y contratos existentes; evitar dependencias nuevas sin una necesidad comprobada.
- Permisos en servidor y PostgreSQL/RLS; ocultar un botón no concede ni revoca acceso.
- Mantener control de versiones y conflictos; no sobrescribir una captura concurrente silenciosamente.
- No copiar datos personales a evidencias, logs, fixtures o documentación. Utilizar registros sintéticos.
- Verificar manuales y normativa vigente al definir reglas jurídicas/fiscales; las reglas requieren responsable y versión.
- No prometer resultados de conversión, rentabilidad, seguridad total, rendimiento ni disponibilidad sin medición.
- Aprobar antes de ejecutar cambios persistidos o infraestructura según el alcance y autorización vigente. La aprobación documental inicial permite trabajar en la implementación autorizada, pero no es autorización de producción.

## Decisiones del titular (DEC)

Todas las decisiones de esta tabla están tomadas. Lo que queda abierto dentro de alguna (por ejemplo DEC-02, DEC-04 y DEC-06) se sigue en «Por decidir» del tablero de `PLAN.md`. Las notas de construcción («en local», «en `main`») son de su fecha; el estado vigente de cada entrega está en `PLAN.md`.

| ID | Decisión | Tratamiento |
|---|---|---|
| DEC-01 | Mantener un monolito modular Next.js/Supabase | Recomendación técnica base del plan. |
| DEC-02 | Empezar por captación y venta; luego compra y renta | **Decidido y construido:** la venta del propietario tiene guía completa; compra, renta e inversión tienen sus pasos. Abierto: el recorrido propio de la renta (COR-04, MRP-01). |
| DEC-03 | Roles finos y permisos por acción (RP-05): director, coordinador, asesor, asistente, jurídico, contabilidad y aliado externo; permisos propios para ver precio mínimo, ver comisiones, aprobar descuentos, eliminar y exportar | Diseñar la matriz para el equipo de Fortius; confirmar responsables y visibilidad antes de activar permisos. Las cuentas `admin` y `editor` actuales se transfieren a los papeles nuevos sin perder acceso. |
| DEC-04 | Propiedad/persona puede tener varias relaciones; una persona puede tener varios papeles | **Decidido** (RP-27, REL-01). Abierto: vocabulario de papeles y pruebas, al diseñar REL-01. La vinculación registrada no certifica titularidad. |
| DEC-05 | Distinguir estados comercial, documental y financiero | **Decidido** (RP-29, RP-85, RP-88). Abierto: criterios de avance, excepciones y responsables por ruta, que define MRP-01. |
| DEC-06 | RPO/RTO, retención y tratamiento de archivos | Copia diaria/RPO 24 h y RTO 8 h aprobados como objetivos; custodia, retención y capacidad demostrada pendientes. |
| DEC-07 | Reglas de honorarios, impuestos capturados, monedas y tipo de cambio | Validación por propietario y especialista; no aplicar tasas por defecto. |
| DEC-08 | PWA conectada como primera versión; offline sensible desactivado | Confirmar qué captura de campo se necesita antes de diseñar almacenamiento local. |
| DEC-09 | Fuente de verdad y papel de cualquier sistema externo | Inventario previo a sincronización o reutilización. Sin dependencia productiva demostrada. |
| DEC-10 | Acceso a configuración GitHub/Vercel y entorno aislado | Configuración Vercel y probes documentadas; protección main, backend preview y destino de recuperación siguen pendientes. **Titular, 17/10/2026 (I-01):** la base actual solo tiene datos de prueba y se autoriza usarla para ensayos con escritura (crear, guardar y borrar datos de prueba) hasta que el titular cargue el inventario real. Desde ese momento vuelve la regla de solo lectura. El titular también autoriza publicar inmuebles de prueba en el sitio (identificados como ejemplo) y cambiar permisos o configuración de Supabase cuando haga falta, explicándolo antes. No se envían mensajes a personas reales. Escrito en `AGENTS.md`. |
| DEC-11 | Fuentes, precisión y servicios de mapas/rutas/comparables | Definir datos disponibles, permisos de uso, cobertura, precisión y costos antes de contratar un proveedor o publicar una ubicación. |
| DEC-12 | Modelos de inversión y supuestos por escenario | Definir periodicidad, fechas, monedas, tasa de descuento y alcance de proyecto/financiación/inversionista; validar método y casos de prueba. |
| DEC-13 | Información y acciones disponibles para clientes externos | Aprobar quién accede, qué documentos se comparten, qué puede solicitar y cómo se concede o revoca acceso. No reutilizar permisos de asesor. |
| DEC-14 | Corpus y tratamiento por el servicio de IA | Definir documentos autorizados, proveedor, conservación, costo y evaluación de citas, abstención y aislamiento antes de procesar información real. Aplica también a EXT-11. |
| DEC-15 | Abrir la etapa posterior (otras inmobiliarias) | Decidido el 17/10/2026: por ahora el sistema es exclusivo de Fortius y solo con su marca. Cuando el titular abra la etapa posterior, decidir nombre comercial, modelo (recomendado: una base con frontera por empresa en RLS; alternativa: una instalación por cliente) y criterios de apertura. No bloquea ninguna entrega actual. |
| DEC-16 | Protección de la propiedad intelectual | Puede atenderse en cualquier momento. Confirmar con abogado de propiedad intelectual: registro de obra (INDAUTOR), marca (IMPI), secreto industrial, convenios de confidencialidad y modelo de licencia para clientes. |
| DEC-17 | Probabilidad por etapa y metas | Fortius define probabilidades por etapa y metas por asesor y periodo, ajustables en Configuración. |
| DEC-18 | Cobro de suscripciones (etapa posterior, en pausa) | Proveedor de cobro, moneda, facturación (CFDI) de la suscripción y política de solo lectura por falta de pago. |
| DEC-19 | Monitoreo de errores en producción | Proveedor, retención, alertas y filtro de datos personales (OBS-01). |
| DEC-20 | Qué hace falta para liberar el PDF del contrato 09 | Resuelta el 12/11/2026: el titular descartó el registro PROFECO y el PDF del 09 quedó liberado (COR-12). |
| DEC-21 | Aviso de edición simultánea (NAV-11) | El titular decide si se hace; requiere presencia en tiempo real. |
| DEC-22 | Lista final de preguntas de la entrevista por tipo de operación | El titular valida la lista base de «Proceso, captura y documentos» antes de CAP-03. |
| DEC-23 | Contenido de los procesos y módulos de fábrica | El titular (y revisión jurídica cuando aplique) valida requisitos y documentos de cada proceso y módulo antes de MOT-04. |
| DEC-24 | Metas de las pruebas de uso | El titular fija los tiempos meta (por ejemplo, primer contacto en menos de un minuto) antes de medir (RP-47). |
| DEC-25 | Lugar de «Notas del equipo» | **Decidida el 17/10/2026:** se retira la página aparte; notas en un botón discreto del inmueble y de la operación (RP-99). |
| DEC-26 | Aprobación de la matriz de reglas por ruta (MRP-01) | El titular la revisa y aprueba antes de COR-04 y MOT-01. **Aprobada el 26/10/2026.** |
| DEC-27 | Nombres sencillos de los requisitos (RP-86) | **Decidido por el titular el 12/11/2026:** «Firma acreditada», «Pagos para entregar cumplidos según contrato» y «Aviso y controles de privacidad revisados»; en la renta se conservan «Contrato de arrendamiento firmado» y «Depósito y primera renta recibidos». Aplicado en COR-07. |
| DEC-28 | Detalles de prospecto y cliente (RP-90 a RP-92) | **Decidida el 17/10/2026:** el titular respondió los grupos A y B de [`docs/erp-crm/CUESTIONARIO_TITULAR.md`](docs/erp-crm/CUESTIONARIO_TITULAR.md); quedan en RP-90 a RP-98. Pendiente solo agregar al catálogo el contrato de intermediación para renta (RP-97). |
| DEC-29 | Formas de pago, tipos de inmueble y municipios (B-06, B-07) | El titular manda la lista de pasos y documentos de cada forma de pago y de cada tipo de inmueble y municipio; el agente la ordena en una tabla para su aprobación. Alimenta MRP-01 y MOT-02. |
| DEC-30 | Validez jurídica de la firma electrónica propia (FIR-01) | El abogado de Fortius confirma para qué contratos sirve en Baja California y qué evidencia debe guardarse, antes de usarla con clientes. Mientras, se firma en papel y se sube el archivo (RP-97). |
| DEC-34 | Plan de comercialización 10 | **Decidida el 29/10/2026:** el 10 sigue la plantilla del 26/10/2026 (`04_Metodologia/02_Comercializacion/10_PlanComercializacion.docx`), un formulario con casillas que reemplaza el plan en prosa anterior. Cambios aprobados: el tipo de inmueble usa los siete tipos de DEC-32 en lugar de las cuatro casillas del Word; el panel calcula el precio promedio por m² construido de los comparables y el precio técnico (promedio por la construcción del inmueble); «Baños (completos / medios)» son dos datos; al crearlo se proponen superficies, recámaras, baños, clave catastral, folio real, valor del 07 y datos del contrato 09. Se quitaron los apartados en prosa que el Word ya no trae (estrategia, plazas o conjuntos, aprobación con acuse). Código en `src/lib/formatos/plan.ts` y `src/lib/formatos/documento/plan.ts`. |
| DEC-48 | ¿Puede el asesor pausar o rechazar un encargo ya aceptado? | **Decidida el 13/11/2026:** sí, el asesor puede marcarlo «Pausada» o «Rechazada» después de aceptado, como ya permite el servidor y como dice el texto de la pantalla. Construido en `feat/integracion` (C-94, 90e9618). |
| DEC-49 | Trámites con pasos (TRA-01) | **Decidida por el titular (13 y 14/11/2026):** aprobó el boceto y la pantalla de Trámites, con la cancelación de hipoteca como primer trámite; pidió Trámites en el menú; pidió no esperar al notario y seguir fuentes oficiales: con Infonavit o Fovissste la cancelación va directo al Registro, con banco ante notario (Retys BC-DRPPC-014 y 011, gob.mx FOVISSSTE-00-012-A). Los comprobantes de un trámite solo son privados y la prueba de un paso cerrado no se borra mientras el paso siga cerrado. |
| DEC-47 | Guía de pantalla: ¿se abre sola en las ocho pantallas la primera vez (como hoy) o solo en Hoy, y en las demás con el botón «?»? | **Propuesta del agente (11/11/2026, C47–C60):** solo Hoy la abre sola; en las demás, el botón «Ayuda» late la primera vez (V07) y la guía se abre a petición. **Decidida por el titular (12/11/2026, confirmada ese día al juntar las ramas):** la propuesta. Solo Hoy abre su guía sola la primera vez; en las demás pantallas, con el botón «Ayuda» o la tecla «?», y un punto sobre «Ayuda» mientras no se haya visto. Reemplaza la anotación anterior de que nunca se abría sola. |
| DEC-46 | Estados visibles del prospecto | **Decidida el 11/11/2026:** tres etapas visibles (Nuevo, En seguimiento, Descartado) y «Cliente» aparte. La base conserva los seis estados: Contactado, En evaluación y Activo se muestran como «En seguimiento»; «Cerrado», estado anterior, se muestra en quien ya lo tenía pero no se puede elegir, y en la lista va con los descartados. Construida con SIM-07 (`src/lib/admin/person-view.ts`). |
| DEC-45 | Nombre del asistente único para una persona que llama: «Atender a alguien», «Nueva llamada» u otro; hoy se llama «Nueva operación» aunque tres de sus cinco salidas no abren operación | **Propuesta del agente (11/11/2026, C48):** «Atender a alguien», con «Nueva operación» como primera opción del menú «+ Nuevo» que lo abre ya en «Vender». Pendiente del titular. **Decidida por el titular (12/11/2026): «Atender a alguien».** Aplicada en local: en el menú va primero «Atender a alguien» y después «Nueva operación»; cambiar el nombre es cambiar una constante. |
| DEC-44 | En celular, «Captura por lista» para el levantamiento y la entrevista además de la captura sobre el documento (DEC-31) | **Propuesta del agente (02/11/2026)** tras probar el 04A a 390 px: las mismas celdas, una pregunta por pantalla, con «No sabe», cámara y dictado; lo capturado aparece en la hoja. **Decidida el 12/11/2026:** se agrega en celular la captura por lista, una pregunta por pantalla con «No sabe», cámara y dictado, sobre las mismas celdas; el documento en vivo se conserva (fase 4). |
| DEC-43 | Alcance del asesor sobre inmuebles ajenos: ¿los ve con todos sus datos (como hoy) o solo con los públicos (RP-99)? ¿Puede publicar él mismo o solo el director? | **Decidida el 12/11/2026:** el asesor ve de los inmuebles ajenos solo los datos públicos (fotos, precio, descripción), para poder ofrecerlos; edita el inmueble solo su asesor o el director; publicar lo autoriza siempre el director. Se construye en COR-23 (fase 2). |
| DEC-42 | Un solo «siguiente paso» por persona y por operación, respaldado por una tarea; citas solo con hora; notas pegadas a persona, inmueble u operación; retirar el tablero de notas sueltas | **Propuesta del agente (02/11/2026)** tras revisar la jornada del asesor (bloque G1). **Decidida por el titular (12/11/2026):** el siguiente paso es siempre una tarea con fecha, la misma en la ficha, Hoy y la Agenda; «Registrar contacto», la decisión del encargo y la entrevista la crean o la mueven (hoy «Registrar contacto» guarda `perfil.proximoContacto` y `proximaAccion`, no una tarea); al completarla se pide la siguiente; las citas, solo con hora; notas en inmueble y operación (E-01); el tablero suelto se retira y Hoy tiene «Avisos» que solo escribe el director. **Primera entrega en local (12/11/2026), sin integrar en `main` y sin migración:** el siguiente paso de cada persona es una tarea de seguimiento ligada a ella y sin operación (`src/lib/admin/next-step-task.ts`); «Registrar contacto» en la ficha y en Hoy la crea o la mueve; al completarla en Hoy, Tareas o su ficha se pregunta «¿Qué sigue con…?» y la respuesta queda como la nueva tarea; en cuanto una persona tiene esa tarea, el «próximo contacto» del perfil deja de mostrarse en Hoy, la Agenda, Contactos, Reportes y la ficha. **Segunda entrega en local (12/11/2026):** el alta de un interesado en «Nueva operación» también deja su próxima acción como tarea; «Editar ficha» ya no muestra ni cambia el próximo contacto del perfil; en una operación, completar su última tarea abierta (en Hoy, Tareas o la ficha de la tarea) pregunta «¿Qué sigue en la operación…?» y la respuesta queda como su «Próxima tarea». La entrevista y la decisión del encargo ya creaban tareas de la operación desde la base (migraciones `20261014180000` y `20261014215000`). **Tercera entrega en local (12/11/2026):** migración `supabase/migrations/20261112232000_resolution_moves_followup.sql` (autorizada por el titular el 12/11/2026; se aplica al integrar en `main`): cambiar la decisión del encargo mueve su tarea de seguimiento abierta (título, fecha y motivo) en lugar de crear otra; si la anterior ya se completó, crea una nueva; no cancela otras tareas. Probada en base local aislada. **Cuarta entrega en local (12/11/2026):** botón «Notas» en la ficha del inmueble y en «Más opciones» de la operación, que abre un panel lateral con sus notas (E-01; la de la operación lleva su cliente, así que solo la ve quien puede ver a ese cliente); el tablero «Notas del equipo» se retira (`/admin/notas` lleva a Hoy y sale de Herramientas; las notas que ya existían siguen en la base y en Historial); Hoy tiene «Avisos», que solo el director escribe o quita, con la regla también en la base: migración `supabase/migrations/20261112233000_avisos_solo_director.sql` (se aplica al integrar en `main`; probada en base local aislada). Con esto DEC-42 queda construida en local. |
| DEC-41 | Captación dirigida: cuando hay prospectos para una colonia sin inventario y se encuentra un inmueble, ¿se puede enseñar a ese prospecto antes de firmar la intermediación? RP-91 hoy lo prohíbe, también en privado | **Propuesta del agente (02/11/2026):** mantener RP-91 como regla y admitir una sola excepción: visita con un prospecto concreto a un inmueble «En evaluación», con carta breve de autorización de visita firmada por el propietario (texto que valida el abogado) y autorización del director con motivo (COR-20); sin publicar ni mandar fotos; la entrevista 02 puede hacerse por teléfono ese mismo día y el levantamiento y el dictamen correr en paralelo (MRP-01). **Decidida por el titular (12/11/2026):** la propuesta, como excepción a RP-91 (reescrita en su lugar). **Construida en local el 12/11/2026 (migración `20261112235000_visita_antes_de_la_firma.sql`, sin aplicar en la base):** en la operación de un inmueble «En evaluación» sin publicar, mientras la intermediación no esté revisada, la tarjeta «Visita antes de la firma» deja al director autorizar una visita con el interesado (sugiere los prospectos registrados), la carta de autorización de visita firmada por el propietario (archivo privado) y el motivo; la base exige al director y que la carta se haya subido, anota quién y cuándo, y solo el director la retira. La operación, Operaciones y Hoy muestran «Visita autorizada antes de la firma» hasta que se revisa la intermediación. El asesor la ve, pero no la autoriza. No publica ni abre el inmueble a otros prospectos. Pruebas: `tests/backend/visita-previa-database.test.ts` y `tests/admin/visita-previa.test.tsx`. El texto de la carta lo valida el abogado. |
| DEC-40 | Inmuebles compartidos por otra inmobiliaria (RP-95, PUB-02): qué debe decir la autorización escrita de la inmobiliaria, qué texto lleva la etiqueta pública («En colaboración con…») y si el aliado se registra como persona del panel | **Propuesta del agente (02/11/2026):** autorización con fecha, firmante e inmueble, que confirme que su contrato con el propietario permite compartirlo y publicarlo (texto que valida el abogado); etiqueta con el nombre de la inmobiliaria y fuente «Según <inmobiliaria>» en cada dato; aliado registrado una vez con porcentaje por omisión. **Decidida el 12/11/2026, con un cambio:** se publica con la autorización escrita como se propuso, pero la ficha pública no muestra el nombre de la otra inmobiliaria: dice «Inmueble en colaboración» y los datos que Fortius no verificó llevan «Según la inmobiliaria aliada». El aliado se registra en el panel con su porcentaje. Confirmado por el titular al juntar las ramas (12/11/2026); PUB-02 lo aplica: la base proyecta solo la marca de colaboración, nunca el nombre. |
| DEC-39 | Qué preguntar en la llamada y en la 02 cuando el inmueble tiene un problema (invadido u ocupado sin permiso, crédito en mora, herencia sin resolver, adeudos) y qué documentos pedir en cada caso | **Propuesta del agente (02/11/2026), por validar con el abogado:** en la llamada, una pregunta con opciones y detalle (CAP-05); en la 02, «Invadida u ocupada sin permiso» y, con crédito, «¿Está al corriente?» y «¿Sabe cuánto debe?» (CAP-06); con invasión, pedir la denuncia o demanda y mandar al abogado antes del levantamiento (COR-14). **Aprobada como base el 12/11/2026.** CAP-06 se construyó ese día y el titular decidió dejarla activa; el abogado revisa las preguntas y la lista de documentos después, y sus cambios se aplican sobre lo construido. |
| DEC-38 | Pestaña «Ajustes» de la operación | **Decidida el 11/11/2026** al aprobar SIM-18: se retira. Sus acciones van en «Más opciones» del encabezado de la operación (antes, del panel azul que LV-09 reemplazó) («Datos de la operación», «Corregir etapa» y «Eliminar operación»); los datos se abren en un panel lateral. |
| DEC-33 | Plaza o conjunto con varios locales | **Decidida el 28/10/2026: según el caso.** Si la plaza se vende o renta completa, es un solo inmueble con una operación y su levantamiento 04G. Si los locales u oficinas se comercializan por separado, cada uno es su propio inmueble, con su operación y su folio (RP-94), y se liga a su plaza con el campo «Pertenece a la plaza o conjunto» (`conjunto`, slug de la plaza). La plaza guarda los datos comunes; en el panel muestra sus locales y permite agregar otro, y en el sitio su página muestra los locales publicados y cada local enlaza a su plaza. Una plaza no puede pertenecer a otra. Migración `supabase/migrations/20261028130000_property_conjunto.sql` (validación y proyección pública), que se aplica al integrar en `main`. |
| DEC-32 | Lista de tipos de inmueble | **Decidida el 27/10/2026:** una sola lista en todo el sistema, con los siete tipos de las plantillas y su levantamiento: Terreno (04A), Casa (04B), Departamento (04C), Oficina (04D), Local comercial (04E), Nave o bodega (04F) y Plaza o conjunto (04G). No lleva «Otro»; el primer contacto conserva «Todavía no lo sé». La plaza o conjunto se publica en el sitio como un inmueble más. Código en `src/lib/inmueble-tipos.ts`; migración `supabase/migrations/20261028120000_property_type_plaza.sql`, que se aplica al integrar en `main`. |
| DEC-31 | Cómo se capturan los formatos (EXT-12) | **Decidida el 27/10/2026:** cada etapa muestra su formato de Fortius tal como sale en PDF y se llena desde el sistema pulsando sobre el documento, como la prueba del 04B. En el 04B se quitan base y referencia, respaldos y discrepancias, y se agrega el uso de suelo. Folios e identificadores los pone el sistema. |

## Criterios de producto terminado para la primera versión operativa

- Recorrido sintético prospecto → cliente → propietario relacionado → inmueble → expediente → tarea/visita → oferta → cierre documentado, sin registro duplicado provocado por reintentos.
- Persona, inmueble y operación tienen referencias durables. Un cambio de nombre o etiqueta no rompe vínculos.
- Dos asesores y el director (permiso de administrar) de prueba ven exactamente su alcance; documentos y cifras sensibles respetan la misma regla.
- Cada tarea que requiere acción tiene responsable, estado y fecha o motivo explícito de ausencia de fecha.
- Recepción documental, revisión, conclusión profesional, firma y pago son hechos diferentes.
- Los cuatro tableros usan fuentes identificadas; sin fuente suficiente muestran pendiente. Su detalle reconcilia el total.
- Importes parciales, monedas y operaciones anuladas no se suman como cobros definitivos. Demo queda visible como dato de prueba.
- La aplicación abre el panel desde la instalación probada; conexión perdida y sesión caducada se entienden sin pérdida silenciosa de captura.
- Migraciones y restauración probadas en destino aislado; publicación con checks y revisión; manual operativo y transferencia completados.

## Mapa de módulos y archivos

Ubicaciones nuevas son **propuestas**, no evidencia de código existente. El nombre final de una migración se genera al implementar, ordenado después de las existentes; jamás reescribir una ya aplicada.

| Dominio | Reutilizar | Nuevos límites propuestos |
|---|---|---|
| Identidad/capacidades | `src/lib/backend/auth.ts`, `contracts.ts`, adviser-accounts API | `src/lib/identity/capabilities.ts`; autoridad efectiva en servidor/SQL. |
| Personas/relaciones | `clientes`, `leads`, `asesores`, lead-conversion | `src/lib/personas/{types,schema,server}.ts`; relaciones persona/inmueble privadas. |
| Operaciones | expedientes API, `formatos/expediente-operations.ts` | `src/lib/operaciones/{types,schema,server,transitions}.ts`; referencia inicial `expedienteId`, sin segunda copia de operación. |
| Agenda/actividad | `src/lib/tasks.ts`, eventos, TodayWorkspace | Acciones y vínculos explícitos; tabla de visitas/ofertas solo si se necesitan hechos que eventos no representan. |
| Documentos/legal/técnico | `src/lib/formatos`, emisiones, adjuntos, copias | Proyecciones revisables de estados y hallazgos; mantener formatos emitidos como snapshots. |
| Comercial | `src/lib/comercial/{types,calculate,server}.ts` | Vinculación verificable de oportunidad y operación; conservar libro/revisión históricos. |
| Finanzas operativas | Decimal, formatos 08/18/19 y cartera como fuentes | `src/lib/operational-finance/{types,schema,server,calculate}.ts`; nuevos hechos SQL separados de calculadoras públicas. |
| Analítica | `admin/commercial-metrics.ts`, period-report | `src/lib/analytics/{definitions,queries}.ts`, agregados con RLS y filtros de servidor. |
| UX/PWA | shell, workspace, UI, manifiesto e iconos | Componentes de tablero; manifiesto específico del panel; service worker limitado si se aprueba. |
| Inversión | Decimal, presupuestos y modelos financieros actuales | Límite propuesto de escenarios y cálculo reproducible, vinculado a operación; no reutilizar simulaciones como hechos contables. |
| Geografía | inventario, ubicaciones, visitas y opinión de valor 07 | Límite propuesto para coordenadas/capas/comparables/rutas con fuente y permiso; elegir motor después de DEC-11. |
| Clientes externos | personas/operación/documentos y autenticación existentes | Portal separado del área del equipo; proyección compartida explícita, identidad externa y comprobación de acceso en servidor. |
| IA documental | documentos privados, versiones y revisión jurídica | Índice autorizado por expediente, citas a versión/página, propuestas de cláusulas revisables y evaluación de acceso; proveedor pendiente. |

## Finanzas y diccionario mínimo de indicadores

| Indicador | Definición | Fuente / tratamiento de desconocidos |
|---|---|---|
| Contactos vencidos | Contactos activos con próxima fecha anterior a corte local | Followups autorizados; fecha ausente se cuenta aparte, no como vencido. |
| Primera atención | Tiempo desde recepción hasta contacto registrado; mediana y población sin medición | `creadoEl` y `firstContactedAt`; no inferir de clics WhatsApp. |
| Conversión a cliente | Prospectos que firmaron su contrato (RP-90) / prospectos de la cohorte de recepción, con periodo de observación | Fecha de firma registrada (COR-10); abrir operación o completar la entrevista no cuenta. Nombre exacto «a cliente», no cierre. |
| Captaciones | Inmuebles con contrato de intermediación firmado en el periodo (RP-91) | Fecha de firma; los inmuebles en captación sin firma se muestran aparte. |
| Visitas realizadas | Eventos con realización confirmada, excluyendo cancelados/reemplazados | Fuente VIS-01; agendados se muestran aparte. |
| Cobros confirmados | Suma de pagos conciliados por moneda/periodo menos anulaciones aplicables | FIN-01/02; no sumar honorarios potenciales. |
| Saldo por cobrar | Obligación vigente menos pagos aplicados y ajustes aprobados | Fuente contractual y movimientos; sin base mostrar pendiente. |
| Documentos por revisar | Requisitos aplicables recibidos sin revisión vigente | DOC-01/LEG-01; recibido no acredita aprobado. |
| Discrepancias técnicas | Hallazgos abiertos con fuente y responsable | TEC-01; no emitir diagnóstico pericial. |
| Tiempo en etapa | Días entre la entrada y la salida de cada etapa; mediana por etapa y operaciones aún abiertas aparte | Historial de cambios de etapa; una corrección de etapa con motivo no cuenta como avance. |
| Días en mercado | Días desde la publicación del inmueble hasta hoy, el retiro o la oferta aceptada | Fechas de publicación y oferta; sin fecha de publicación se muestra pendiente. |
| Pronóstico ponderado | Honorario pactado o estimado por la probabilidad de la etapa definida por Fortius, por mes esperado | FIN-03/DEC-17; rotulado «Estimación»; nunca se suma a cobros. |
| Avance contra meta | Resultado del periodo entre la meta del asesor para ese periodo | TAB-05; sin meta registrada se muestra pendiente. |

Cada ficha incluye unidad/grano, fórmula, filtros, zona horaria operativa, responsable de dato, último corte, permisos, anulaciones y lista de IDs. La UI nunca completa cero por falta de datos.

## Definición de terminado por entrega

- [ ] Comportamiento de la tarea y sus límites documentados; aceptación medible cumplida.
- [ ] Pruebas de reglas, RLS/capacidad, concurrencia/idempotencia y montos cuando afectadas.
- [ ] Lint/TypeScript/tests/build según cambio; comandos y resultados vinculados al commit revisado.
- [ ] Revisión de UI en escritorio/móvil y teclado cuando afectada; las comprobaciones no hechas se declaran.
- [ ] Migración ensayada, compatibilidad y recuperación/rollback; no editar migraciones aplicadas.
- [ ] Revisión de web pública/PDF/formularios si comparte código; conservar demo y contenidos.
- [ ] Rama/PR o commit revisable; documentación y pruebas de aceptación. Publicación solo con autorización vigente.
- [ ] Aceptación técnica distinta de aceptación de negocio: aprobación de Moisés registrada sin inventarla.

Comandos existentes útiles: `npm run lint`, `npm run typecheck`, `npm run test:backend`, `npm run test:admin`, `npm run build`, `node --test tests/tools/*.test.mjs`, `npm run test:admin:browser`, `npm run test:public:browser`. Antes de correr comandos live leer si escriben; `test:live` no se ejecuta por defecto.
