# Fortius — plan único de implementación del ERP/CRM

**Actualizado:** 30 de octubre de 2026, America/Los_Angeles. **Responsable de negocio:** Moisés Núñez Tonalá. **Desarrollo:** agente de desarrollo. **Carpeta:** `C:\Paginas-web\fortius-inmuebles`.

Este archivo reúne el alcance, el orden de trabajo, las tareas y el avance del ERP/CRM. Es el único plan vigente de desarrollo. Los manuales de `docs/` son referencias de operación, no planes alternativos.

**Cómo leer este plan:** primero «Estado vigente» y «Etapas por ruta»; después «Dirección del producto y reglas vigentes» (qué se construye y con qué reglas); luego los paquetes listos para implementar, «Simplificación de la interfaz (SIM)», «Navegación y productividad (NAV)», «Lenguaje visual (LV)», «Proceso, captura y documentos» (correcciones COR, captura CAP, ficha única FCH y motor de procesos MOT) y «Herramientas para trabajo suelto (HER)»; después «Dónde nos quedamos» y «Qué sigue» (estado actual); el resto es alcance, backlog, tareas detalladas y el registro histórico de entregas. Si un registro histórico contradice una regla vigente, manda la regla vigente.

## Estado vigente — 26/10/2026

**Qué hay construido (en `main`):** panel guiado (Fase C, PR #39, publicado en el dominio el 17/10/2026); Operaciones según el boceto C (lista «Esperan algo de ti / Al día» con filtros por fase, «Ahora toca», ventana de captura por documento); las 10 etapas del vendedor agrupadas en cuatro fases en pantalla (Conocer · Revisar · Preparar y publicar · Vender y cerrar); entrevista 02 y levantamiento 04 sencillos; menú lateral y membrete común en Word y PDF; formatos 01–19 en PDF y Word, salvo el PDF del contrato 09, que sigue bloqueado hasta resolver DOC-09 y por ahora sale solo en Word; opinión de valor 07 en PDF y Excel; «Documentos sin expediente». Los cambios del boceto C en adelante se integraron en `main` el 17/10/2026; su publicación en el dominio no está comprobada en este registro.

**Qué es este plan desde el 17/10/2026:** reglas de producto (RP-01 a RP-99) y paquetes listos para implementar (SIM, NAV, LV, COR, CAP, FCH, MOT, HER, MRP). Nada de esos paquetes está construido salvo lo que el boceto C ya resolvió (ver el estado de cada corrección en SIM).

**Decisiones vigentes que más cambian el trabajo:** ERP exclusivo de Fortius (RP-01); ningún dato faltante detiene el flujo (RP-82); descargar siempre, y descargar no es aprobar (RP-77, RP-85); entrevista con lo necesario para que el proceso funcione y opción «Ampliar» (RP-89); procesos por tipo de operación con motor editable (RP-79); las cuatro fases del boceto C para agrupar las etapas en pantalla; **una persona es prospecto hasta que firma su contrato, y un inmueble está captado solo cuando el propietario firma la intermediación** (RP-90 a RP-92); **Fortius solo representa al propietario: compradores y arrendatarios son leads de Fortius y contraparte de sus clientes, nunca clientes de Fortius** (RP-93).

**Pendientes reales, en orden:** USO-01 (observar el panel actual con tres personas) y MRP-01 (matriz de reglas por ruta); correcciones COR-01 a COR-10; pendientes de formatos (diseño y fotos del 07, DOC-06, decisión de DOC-09); después, el bloque 2 del «Orden vigente». En paralelo, la continuidad del bloque 0, en especial la recuperación completa: los respaldos de base de datos de Supabase no incluyen los archivos de Storage (REC-01).

**Nueva forma de llenar los formatos (titular, 27/10/2026, DEC-31):** cada etapa muestra su formato de Fortius tal como sale en PDF, y se llena desde el sistema pulsando sobre el documento; lo capturado aparece en la hoja al momento y el PDF sale igual a lo que se ve. Están construidos y probados los siete levantamientos (04A–04G), con el acomodo del Word del 04A y casillas en lugar de listas con diagonales, en la rama `feat/levantamiento-04b-en-vivo`, sin integrar a `main` y en revisión del titular en localhost. Los demás formatos siguen por grupos en el orden de las etapas (ver «EXT-12» en «Capacidades adicionales y disparadores»). Los folios no se capturan: el sistema asigna el de la operación (`EXP-…`) y el del inmueble (`FORTIUS-…`), y los documentos los imprimen solos.

**Revisión del flujo (27/10/2026, rama `feat/levantamiento-04b-en-vivo`):** dos revisiones del código, una por tipo de cliente y otra por tipo de inmueble, quedaron resumidas en el diagrama [`docs/diseno/flujos-procedimientos.html`](docs/diseno/flujos-procedimientos.html). Lo que señalaron ya tiene entrega en este plan:
- la renta con su propio recorrido (COR-04);
- «No aplica» en el checklist (COR-06);
- el cierre dividido en pasos (COR-09);
- compra y búsqueda de renta como prospectos (COR-11).

Ya decidido: la lista única de tipos de inmueble, con la plaza publicable (DEC-32), y la plaza con varios locales «según el caso» (DEC-33); ambas en la rama. Hacen falta decisiones nuevas del titular:
- los modelos de contrato e intermediación para renta (DOC-14);
- la opinión de renta mensual;
- los documentos por tipo según B-07 (condominio, deslinde, uso de suelo, agua por municipio), con el abogado.

Corregido en la rama: el botón principal de «Ahora toca» se apagaba en el dictamen y en la opinión de valor.

**Siguiente entrega (en curso desde el 26/10/2026, rama `feat/mrp01-cor01-03`):** MRP-01, COR-01 a COR-03 y COR-13. La matriz «Matriz de reglas por ruta (MRP-01)» quedó **aprobada por el titular el 26/10/2026 (DEC-26)**, con las listas B-06 y B-07; con ella pueden empezar COR-04, COR-06 y MOT-01. COR-01 a COR-03 no cambian la base de datos; COR-13 lleva una migración que se aplica en remoto solo con autorización del titular.

**Seguimiento del inmueble y avisos (SIA), 29/10/2026:** se integran en `main` con el PR de la rama `feat/sitio-pildora-sobria` (autorizado por el titular el 29/10/2026), junto con la rama del 04B: avisos de contrato de servicio y licencia por vencer, prospectos por canal, control de llaves, preparación para promover y avisos a compradores (con baja de precio). Sin migración. Ver «Seguimiento del inmueble y avisos (SIA)».

**Pantalla de una operación, boceto D (titular, 29/10/2026):** el titular eligió el boceto D «Moderno» entre cuatro propuestas. Está especificado como **LV-06** (sección «Lenguaje visual») y su fuente en `docs/diseno/operacion-boceto-d/`. No está construido: se empieza cuando el titular lo pida.

**Panel versión 2 (titular, 30/10/2026):** tras una crítica de las 18 pantallas, el titular aprobó la barra superior para todo el panel (DEC-35), la lista única de personas (DEC-36) y eliminar solo desde dentro (DEC-37); los bocetos por sección están en el lienzo «Bocetos del panel Fortius, versión 2» y la entrega es **LV-08** (sección «Lenguaje visual»), que ordena LV-06 y LV-07. En construcción desde ese día en la rama `feat/inicio-claro`: marco común y Hoy.

**Seguridad de dependencias, 25/10/2026:** Next.js 16.4.3 y zod 4.6.7 por avisos de seguridad, integrados en `main` con el [PR #51](https://github.com/M01535NT/fortius-inmuebles/pull/51).

**Preguntas abiertas para el titular:** [`docs/erp-crm/CUESTIONARIO_TITULAR.md`](docs/erp-crm/CUESTIONARIO_TITULAR.md), cuestionario único que reúne y depura los tres anteriores (preguntas al titular A–K, complemento P01–P84 y preguntas para precisar el panel); conserva los identificadores A–K y una tabla de procedencia. Cada pregunta dice qué entrega bloquea y trae una propuesta; cada respuesta se integra en este plan como regla o decisión, según «Cómo se mantiene este plan». El archivo no es un plan paralelo: solo guarda preguntas y respuestas.

**Integración de este plan:** las reglas y paquetes del 17 y 18/10/2026 se integran en `main` con el [PR #41](https://github.com/M01535NT/fortius-inmuebles/pull/41) (solo documentación; Verify aprobado sobre el contenido revisado).

**Rediseño visual por área (LV-05), 18/10/2026:** ya está en `main`. El panel según los bocetos aprobados entró con el [PR #45](https://github.com/M01535NT/fortius-inmuebles/pull/45) y sus ajustes con el [PR #46](https://github.com/M01535NT/fortius-inmuebles/pull/46): paso «Listo» de Nueva operación, ficha y captura de tareas, captura de prospecto y cliente, y Herramientas por categoría con buscador. El sitio público con la dirección «Nocturno» entró con el [PR #47](https://github.com/M01535NT/fortius-inmuebles/pull/47): Inicio, menú, footer y todas las páginas interiores salvo la ficha del inmueble (ver «Sitio público · Inicio (titular, 18/10/2026)»). Solo cambia la presentación; las reglas RP-90 a RP-99 y los paquetes siguen pendientes.

**Ficha del inmueble «Escenario» (titular, 18/10/2026):** el titular eligió la ficha completa 1 «Escenario» del lienzo, con visor que cambia entre fotos, video, 360 y ficha técnica. Ajustes aprobados: ubicación antes de los perfiles, la ficha técnica muestra la fuente de cada dato, «Solicitar visita» propone día y el asesor confirma, planos y otros PDF piden nombre y teléfono y la ficha técnica se descarga libre. Sin sección «Pensada para»: la ficha técnica es técnica, no comercial. Mapa: embed de Google por zona en marco nuevo, sin API. Construido el 18/10/2026: la página `src/app/inventario/[slug]/page.tsx` con banda nocturna, visor con pestañas solo cuando hay contenido (fotos, video, 360 y vista previa de la ficha técnica con descarga libre), franja de datos clave, índice de secciones fijo, descripción, características por grupo (si faltan, las amenidades), beneficios, ubicación con mapa por zona y lugares filtrables por categoría, ficha técnica con la fuente de cada superficie, documentos (con datos del interesado) y costos, preguntas, tarjeta fija de visita en la que el interesado propone un día y el asesor lo confirma, canales directos, compartir con WhatsApp, correo, enlace y código QR, y similares. Las secciones sin datos no aparecen y la renta no muestra crédito. El panel captura beneficios, características por grupo, costos recurrentes y la categoría de cada lugar cercano (sección «Ficha pública» del formulario del inmueble). Integrada en `main` con el [PR #48](https://github.com/M01535NT/fortius-inmuebles/pull/48) (página y panel) y el [PR #49](https://github.com/M01535NT/fortius-inmuebles/pull/49) (migración, autorizada por el titular), ambos el 18/10/2026 con Verify aprobado. La migración `supabase/migrations/20261018120000_property_escenario_fields.sql` amplía la validación de escritura y la proyección pública para esos campos; el historial remoto de Supabase la registra como aplicada (consulta del 25/10/2026). El 25/10/2026 las fichas publicadas de prueba responden en fortiusinmuebles.com con el diseño nuevo; ningún inmueble de prueba tiene todavía beneficios capturados, así que esa sección no se ha visto con datos en producción. Pendiente del titular: si conserva las imágenes equirrectangulares originales de sus recorridos de Kuula, el 360 puede servirse con un visor propio (Photo Sphere Viewer, licencia MIT); si no, se mantiene el embed de Kuula.

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

### Cómo se mantiene este plan (regla del titular)

El producto cambia con frecuencia por ideas nuevas. Para que el plan siga limpio:

1. Una idea aprobada se escribe como regla (RP-xx) y, si necesita trabajo, como entrega del backlog con su aceptación. No se abre otro plan ni otra bitácora.
2. **Si una regla nueva contradice a una anterior, la anterior se reescribe en su lugar** y el cambio se anota en «Reglas reemplazadas» al final de esta sección. No conviven dos reglas contradictorias.
3. Los registros históricos de entregas no se reescriben (son evidencia), pero cuando quedan superados llevan una nota que dice qué los reemplaza.
4. Una idea sin decidir no se presenta como regla: va a «Decisiones propuestas» con lo que falta para decidirla.
5. Las reglas conservan su número aunque cambien o se pongan en pausa, para que las referencias del backlog sigan siendo válidas.

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

- **RP-58 · La barra lateral se adapta, pero no se reordena.** Se puede contraer a íconos y fijar favoritos; las cinco secciones principales no se mueven ni se ocultan. (NAV-01)
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
- **RP-74 · Escala tipográfica fija de cuatro tamaños:** título de página, título de sección, texto y nota. Ningún otro tamaño en el panel. (LV-01)

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
- **RP-91 · Inmueble captado = intermediación firmada.** Un inmueble está **captado** desde que el propietario firma el contrato de intermediación; antes está «en captación». Sin esa firma no se publica ni se ofrece, tampoco en privado a compradores conocidos; la única excepción son los inmuebles compartidos de otra inmobiliaria (RP-95). La intermediación no se firma antes de la opinión jurídica y la comercial (RP-96). Un contrato no exclusivo también capta: el inmueble lleva la insignia «Sin exclusiva» y los reportes separan las dos clases. La fecha de captación es la fecha de firma, y con ella cuentan los tableros: la meta de captación se mide en inmuebles con intermediación firmada en el periodo, y los que siguen en captación se muestran aparte, como trabajo en curso. (COR-10, MRP-01)
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
  - **Vencimiento:** «Para ti» avisa 30 y 7 días antes de que venza la intermediación, con la acción «Renovar o cerrar». Si el contrato vence, se rescinde o se cancela sin cerrar la operación, la persona queda como **«Cliente anterior»** con la fecha de término, el inmueble pasa a «Sin contrato» y se retira de la publicación, y el historial se conserva. Durante los días de protección posterior del 09, el sistema avisa si aparece un comprador que Fortius presentó.
  - **Descartes:** un prospecto que no firma se descarta con uno de estos motivos: no contesta, precio fuera de mercado, no acepta las condiciones del contrato, se fue con otra inmobiliaria, documentación inviable, desistió u otro (con nota). Se conserva el historial; «No contesta» vuelve como pendiente a los 30 días y los demás solo si la persona vuelve a escribir. Con esos motivos se arma el reporte de por qué no se capta.
  - **Nombres:** el botón «Convertir en cliente» pasa a **«Abrir operación»** y lleva a Nueva operación con la persona elegida; la etapa 1 de la venta pasa a **«Primer contacto»**; el inmueble se muestra **«En captación»** (en lugar de «evaluación») mientras no hay firma y **«Disponible»** solo cuando está captado; los demás estados siguen igual.

  (COR-10)
- **RP-98 · Ciclos, pausas y cierre de la operación.**
  - **Oferta rechazada:** se registra y la operación sigue en visitas y ofertas, con la publicación viva.
  - **Promesa caída:** la operación regresa a «Publicación y seguimiento» sin perder el historial, el inmueble vuelve a «Disponible» y el comprador vuelve a ser lead en seguimiento (RP-93). Dictamen, opinión de valor y contrato siguen valiendo salvo que cambie algo que obligue a revisarlos; bajar el precio o pausar se hace en Ajustes, con motivo.
  - *Pausa, regularización y descarte: redactados por el agente por encargo del titular (17/10/2026); el titular puede corregirlos en B-16 del cuestionario.*
  - **En pausa:** el propietario detiene la comercialización por un tiempo. Lleva motivo y fecha para retomar, se retira de la publicación y genera una tarea de seguimiento en esa fecha; el contrato sigue vigente.
  - **En regularización:** captado con una condición jurídica que resuelve el equipo legal (RP-96). Se reactiva cuando el responsable marca la condición resuelta.
  - **Descartada:** la operación termina sin éxito con uno de los motivos de RP-97 y se archiva sin pasar por postventa; si había contrato, aplica «Cliente anterior».
  - **Postventa y archivo:** confirmar el registro de la escritura (o «No aplica»), cobrar los honorarios y pedir una opinión y referidos. Se archiva a los 30 días de la entrega si no queda nada pendiente.
  - **Informe al propietario:** se envía por WhatsApp o correo, a elección del asesor. Se registran a mano la fecha, el medio y quién lo envió, sin conectar WhatsApp ni correo. El primer informe vence un mes después de la publicación.
  - **Otra inmobiliaria trae al comprador:** se registra como aliado externo en la operación, con el porcentaje pactado y el documento del acuerdo adjunto.
  - **Alta directa, sin entrevista:** se conserva para casos que ya llegan armados. Pide la etapa en la que entra y una nota de antecedentes; los documentos que ya existan se suben como recibidos.
  - **Inversión:** la ruta se queda visible como está, sin trabajo nuevo hasta que haya un caso real; la calculadora de VAN y TIR sigue en Herramientas.
  - **Administración de rentas:** Fortius todavía no administra rentas; se hará en el futuro y se especificará entonces. La ruta «Administración u otra» sigue como seguimiento simple.

  (MRP-01, COR-04, COR-08, COR-09)

- **RP-99 · Captación y venta son trabajos distintos; el inventario es del equipo (titular, 17/10/2026).** La **captación** va del primer contacto a la firma de la intermediación: la entrevista, el levantamiento, la opinión jurídica, la opinión de valor, el contrato y el plan de comercialización los hace el asesor que capta. Desde la firma, la publicación puede delegarse y **cualquier asesor del equipo puede vender** el inmueble: no hay inventarios separados por asesor.
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

### Orden vigente

**Este orden manda.** La columna «Fase» de la matriz y la tabla «Orden y ventanas orientativas» agrupan por tema y sirven de referencia; si difieren, se sigue este orden. Cada entrega está en un bloque igual o posterior al de todo lo que necesita.

0. **Continuidad, en paralelo y sin frenar lo demás:** BAS-01, REC-01, CI-01, AUT-01, OBS-01, ENV-01 y PRV-01. Varias dependen de accesos externos; son condición para el piloto con datos reales (bloque 7), no para trabajar con datos simulados.
1. **Coherencia y fallas, antes de programar más:** USO-01 y MRP-01; COR-01 a COR-10 (COR-04 y COR-10 después de MRP-01); **IA-01, prioritaria por decisión del titular (17/10/2026), en cuanto haya clave de API**; los pendientes de formatos de «Qué sigue» (diseño y fotos del 07, DOC-06, y la decisión de DOC-09); comprobar la publicación del rediseño; **EXT-12, captura sobre el documento, formato por formato en el orden de las etapas (DEC-31, 27/10/2026): es el trabajo en curso** y absorbe los pendientes de diseño de cada formato que toque.
2. **Interfaz, confianza y trabajo suelto** (pueden empezar ya):
   - primero SIM-01 junto con LV-01 (color, letra, fechas); con ellos se da por cumplida la base de UX-01, que el kit de la Fase C ya cubre en buena parte;
   - SIM-02 a SIM-12 en orden; LV-02 a LV-04; UX-04, UX-03, UX-02 y UX-05;
   - navegación de pantalla: NAV-01, NAV-02, NAV-03, NAV-05, NAV-07 y NAV-13;
   - sin depender de la ficha: FCH-03 (datos de Fortius y membrete), FCH-04 (descarga con aviso y datos que no detienen), FCH-06 (expediente en un archivo), HER-01 y HER-02 (herramientas para trabajo suelto).
   - **Cambios de base en este bloque** (aditivos, con respaldo, ensayo aislado y autorización del titular): preferencias por usuario (UX-02, que incluye lo que se recuerda por usuario de C17, N01–N03, N08–N11 y V07); menciones y leídos de la bandeja (UX-05); datos de Fortius y membrete (FCH-03); registro de datos faltantes y datos indispensables (FCH-04).
3. **Núcleo del equipo y disciplina comercial:** REL-01 (su modelo de personas se diseña junto con el esquema de la ficha de FCH-01, aunque la ficha se construya en el bloque 4) y SEG-01 con los roles de Fortius; USR-01; CRM-01, CRM-02, CRM-03; OPS-01; PUB-01; COM-01; DAT-01, DAT-02; INV-01; VIS-01, OFE-01; EXT-01; NAV-04, NAV-06, NAV-09; CAP-01 a CAP-04.
4. **Ficha única y motor de procesos:** FCH-01; DOC-01; FCH-02; FCH-10; FCH-11; después MOT-01 a MOT-04, en ese orden. Llevan migración y autorización del titular. La versión 1 del motor (MOT-01) reproduce los candados **ya ajustados por FCH-04** (datos que no detienen), no los de hoy.
5. **Dinero, aprobaciones, reglas fiscales y tableros:** FIN-01, FIN-02, FIN-03; APR-01; FIS-01 y HER-03 (ISR y neto); TAB-01, TAB-02, TAB-03, TAB-05; HER-04 (pasar trabajo suelto a una operación).
6. **Documentos avanzados, revisión, cierre, portal e IA:** DOC-10 a DOC-13; LEG-01, TEC-01, CIE-01; TAB-04; FCH-05, FCH-07, FCH-08, FCH-09; NAV-08, NAV-10; EXT-05, EXT-06, EXT-08, EXT-09, EXT-10 y EXT-11. NAV-11 y NAV-12 entran cuando el titular las autorice (DEC-21, migración de NAV-12).
7. **Escala, instalación, soporte y piloto:** PAG-01, ESC-01; PWA-01, PWA-02, PWA-03 y NAV-14; SOP-01; PIL-01, con todos sus requisitos (incluido el bloque 0); después, operación real de Fortius durante un buen tiempo. EXT-02, EXT-03, EXT-04 y EXT-07 entran solo por decisión de negocio o necesidad demostrada.
8. **Etapa posterior** (en pausa): solo cuando el titular la abra.

### Reglas reemplazadas

| Fecha | Regla anterior (dónde estaba) | Regla vigente |
|---|---|---|
| 27/10/2026 | Las 10 etapas del vendedor agrupadas en cuatro fases en pantalla: Conocer · Revisar · Preparar y publicar · Vender y cerrar (boceto C, 17/10/2026). | Sin fases: cada operación dice «Etapa N de M · nombre». Operaciones filtra por etapa y su tablero pone una columna por etapa (titular, 27/10/2026). El requisito del levantamiento se confirma en la etapa 3 y no en la 7. Las etapas 8 a 10 ofrecen sus documentos (11; 12, 13 y 14; 15 a 18) sin detenerse. «Confirma lo que revisaste» se llama «Antes de seguir, confirma» y su panel llega lleno. |
| 27/10/2026 | Captura de cada formato en una ventana por secciones con campos sueltos (boceto «Captura de un documento», 17/10/2026). | La ventana se conserva, pero abre en el documento tal como sale en PDF y se llena pulsando sobre él (EXT-12, DEC-31). El formulario por secciones queda solo para los formatos que aún no se pasan. |
| 17/10/2026 | «Un sistema operativo dentro de `/admin`» («Qué vamos a construir»). | ERP/CRM profesional exclusivo de Fortius, con su marca (RP-01). |
| 17/10/2026 | «La estructura de la guía (`flujo`) no cambia» y «sin migraciones ni endpoints nuevos» (encargo del rediseño, §2). | Esas reglas valían para la Fase C, ya terminada. Los procesos de Fortius se ajustarán desde el propio sistema con el motor de procesos (RP-79, MOT); las migraciones siguen requiriendo respaldo, ensayo y autorización. |
| 17/10/2026 | Roles `admin` y `editor` como modelo de permisos (encargo y manual). | Roles del equipo de Fortius y permisos por acción (RP-05, DEC-03, SEG-01). |
| 17/10/2026 | Orden de menú, vistas y preferencias guardados «por usuario en ese navegador» (`docs/admin-workspace.md`) y sincronización opcional (UX-02). | Preferencias y vistas en el servidor por usuario (RP-14). El navegador solo guarda comodidades del dispositivo. |
| 17/10/2026 | «No convertir ponderaciones en probabilidades» (COM-01). | Las ponderaciones de la cartera comercial siguen sin presentarse como probabilidad. El pronóstico usa probabilidades por etapa definidas por Fortius y rotuladas «Estimación» (RP-30). |
| 17/10/2026 | Avisos «solo dentro del panel» con el contador de Hoy como único aviso (encargo del rediseño). | Se agrega la bandeja «Para ti» en Hoy (RP-20). Sigue sin campana; los avisos fuera del panel siguen en PWA-03. |
| 17/10/2026 | Firmas con DocuSeal, OCR con Document AI, consulta con OpenAI y rutas con Google (sección «20 apps»). | Esas integraciones se retiraron del código el 15/10/2026 (Fase A). Si se retoman, entran por EXT-05 (firma), EXT-11 y EXT-06 (lectura de documentos e IA) y EXT-09 (rutas), con proveedor decidido de nuevo. |
| 17/10/2026 | Usuarios piloto: administrador y dos asesores (Gobierno). | Piloto con el equipo de Fortius y pruebas de uso medidas, repetidas tras cada cambio grande (RP-47, PIL-01). |
| 17/10/2026 | Ruta principal BAS-01 → REL-01/SEG-01 → CRM-01… y «Siguiente acción: continuar con REL-01 y SEG-01». | «Orden vigente» de esta sección. |
| 17/10/2026 | EXT-01 (coincidencias) como extensión condicionada. | Solicitada (RP-24). |
| 17/10/2026 | Tablero de Operaciones y barra de avance con una columna o paso por cada una de las 10 etapas (FLUJO-01 a 03, Fase C · 4). | Se presentan 6 etapas con los 10 pasos dentro (C12, C13). `SALE_PROCESS`, los candados y las direcciones `?etapa=` se conservan. |
| 17/10/2026 | Chips de estado de requisito siempre visibles (Pendiente · Lo tengo · Revisado · Hay un problema · No aplica) (encargo, §4). | Estado actual y siguiente acción; el resto en «⋯» (RP-55, C16). |
| 17/10/2026 | Pestañas de la operación con «Ajustes»; columna con herramientas, propietario y «¿Qué significa?» como tarjetas (encargo, §4). | Acciones en «⋯» del encabezado; «¿Qué significa?» como enlace; Llamar y WhatsApp en el encabezado en celular (C19 a C21). |
| 17/10/2026 | Lo vencido y las visitas «en guinda» (encargo, §4). | Vencido en rojo de alerta con ícono; visitas con color propio; guinda solo para la acción principal (RP-52, C01). |
| 17/10/2026 | Botón principal «+ Nueva operación» en la barra lateral (encargo, §4). | «+ Nuevo» con menú; Nueva operación es la primera opción (C08). |
| 17/10/2026 | Contactos con pestañas Prospectos y Clientes (encargo, §4; Fase C · 6). | Una sola lista de personas con etapa y filtro; las tablas no cambian (C24). |
| 17/10/2026 | «Agendar» conservado como formulario fijo junto al calendario (Fase C · 6). | Panel que se abre desde el botón o un hueco del calendario, con un solo campo de vínculo (C25). |
| 17/10/2026 | «Alta directa, sin entrevista» en el tablero de Operaciones (Fase C · 4 y 5). | Opción secundaria dentro de Nueva operación (C22). |
| 17/10/2026 | Fechas y cifras en letra monoespaciada (lienzo de diseño aprobado). | Letra normal y fechas humanas en todo el panel (RP-53, C02, C03). |
| 17/10/2026 | La Fase C · 2 retiró contraer y ajustar el ancho de la barra lateral. | Vuelve contraer a íconos (N01); el ancho ajustable no regresa. Reordenar el menú sigue fuera (RP-65). |
| 17/10/2026 | «Hoy» como pantalla de inicio para todos los roles (encargo, decisiones por defecto). | Inicio por rol: Hoy para el asesor y el tablero para el director cuando exista; cada quien puede cambiarla (N11). |
| 17/10/2026 | La lista de arranque «Preparar tu espacio» solo para el administrador, en Configuración (Fase C · 3). | Se conserva para el administrador y se agrega «Primeros pasos» del asesor en Hoy, unida al recorrido de SOP-01 (N24). |
| 17/10/2026 | «Ver operaciones eliminadas» en el tablero y recuperaciones repartidas en Historial. | Una sola Papelera en Administración (N23); las reglas de cada restauración no cambian. |
| 17/10/2026 | «Orden vigente», bloque 2: LV-01 a LV-04 después de SIM-01, y LV-05 como ejercicio previo con bocetos. | Por decisión del titular (17/10/2026), LV-05 se adelantó en el orden y se construyó primero, como capa visual sobre el panel actual (entregada el 18/10/2026); SIM, NAV y LV-01 a LV-04 siguen en su lugar y reutilizan sus tokens y su kit. |
| 17/10/2026 | Flujo configurable en pausa para la etapa posterior (RP-04, SAAS-03); procesos escritos en el código. | Motor de procesos para Fortius: procesos base por tipo de operación y módulos activados por respuestas, editables desde el sistema (RP-79, MOT). SAAS-03 queda solo para adaptarlo por empresa. |
| 17/10/2026 | El PDF se emite solo con la captura completa, salvo el 07 (regla del catálogo de formatos). | Descargar siempre, avisando lo que falta, dentro o fuera de una operación; 09 y 15 conservan su bloqueo legal; un PDF con faltantes cuenta para los candados (RP-77, RP-82). |
| 17/10/2026 | Cada documento guarda su copia de los datos y se llena solo al crearse. | Ficha única de la operación de la que leen todos los documentos (RP-75, RP-76). |
| 17/10/2026 | Lista de documentos fija D01–D22, levantamientos 04A–04G y listas de intenciones y tipos escritos en el código. | Salen del motor de procesos según el tipo de operación y sus módulos (MOT-02). |
| 17/10/2026 | Pantalla de prospecto del propietario sin fecha visible y sin envío del aviso (FLUJO-01). | Primer contacto con fecha editable, envío del aviso y cita en la misma pantalla (CAP-01, CAP-02). |
| 17/10/2026 | Primera redacción de RP-77: un PDF con datos críticos faltantes no contaba para los candados ni para «Revisado», y había «datos críticos» con confirmación. | Ningún dato faltante detiene el flujo; el PDF con faltantes cuenta para los candados; solo detienen los requisitos del proceso y los datos que Fortius marque como indispensables (RP-82). |
| 17/10/2026 | La entrevista exige todas sus preguntas obligatorias para crear la operación (FLUJO-01, entrevistas). | Basta lo indispensable; lo demás queda en «Datos por completar» (F06, RP-82). |
| 17/10/2026 | Catálogo de 17 herramientas con formatos repartidos entre «Documentos sin expediente» y «Plantillas y PDF». | Catálogo depurado en tres grupos con accesos directos y trabajo suelto completo (HER, RP-83), confirmado por el titular el 18/10/2026. |
| 18/10/2026 | Tablero y avance en 6 etapas (C12, C13). | Las cuatro fases del boceto C agrupan las 10 etapas en pantalla, aprobadas por el titular el 17/10/2026; la renta tendrá sus propias etapas (COR-04). |
| 18/10/2026 | Entrevista «ampliada» con todas las preguntas en la cita (CAP-03, primera redacción) frente a la entrevista sencilla del 17/10/2026. | Entrevista con lo necesario para que el proceso funcione y sección opcional «Ampliar» (RP-89). |
| 18/10/2026 | Etiquetas «Firma ante notario», «Pago completo antes de entregar» y «Aviso de privacidad firmado» (encargo del rediseño y RP-82/MOT). | Nombres fieles a la regla (RP-86), pendientes de confirmación del titular (DEC-27). |
| 18/10/2026 | Insignias de documento «Borrador · PDF listo · Firmado» (V05). | Estados Borrador · Revisado · Aprobado · Firmado; el PDF es una salida (RP-85). |
| 18/10/2026 | DEC-02, DEC-04 y DEC-05 como «confirmar antes de diseñar». | Decididas; lo abierto pasa a MRP-01 y REL-01. |
| 18/10/2026 | «Ficha comercial» como herramienta (catálogo HER). | Sale del catálogo: la ficha técnica PDF se descarga en la página pública del inmueble y desde el menú del inmueble en el panel. |
| 18/10/2026 | «09 y 15 conservan su bloqueo legal» (RP-77, F16, FCH-04). | Solo el 09 está bloqueado (DOC-09); la 15 conserva sus reglas legales y de congruencia, no un bloqueo general (RP-77). |
| 18/10/2026 | UX-02 con «tablero personal» y dependiente de SEG-01, PAG-01 y TAB-01. | Solo búsqueda, vistas y preferencias por usuario, sin tablero armable (RP-66), y sin esas dependencias. |
| 18/10/2026 | Al completar la entrevista el contacto «se convierte a cliente» (registro del 13/10/2026 y código actual) y el botón «Convertir en cliente» lo hace a mano. | Completar la entrevista abre la operación; la persona sigue siendo prospecto hasta firmar su contrato. La conversión de `leads` a `clientes` queda como mecanismo técnico y el botón cambia de nombre (RP-90, RP-92, COR-10). |
| 18/10/2026 | La etapa 7 de la venta se cerraba con la intermediación (09) revisada. | Intermediación firmada y revisada; desde la firma el inmueble está captado (RP-91). |
| 18/10/2026 | «Cliente» como una etapa más de la lista de personas (C24) y «Conversión CRM: leads convertidos a cliente» (diccionario). | «Cliente» se calcula del contrato firmado (C24, RP-92); la conversión a cliente y las captaciones se miden por fecha de firma (diccionario). |
| 18/10/2026 | CRM-01: «captar, calificar, convertir» con la conversión como acción del asesor. | La conversión técnica se conserva; la condición de cliente la da la firma (CRM-01, RP-90). |
| 17/10/2026 | El comprador pasa a cliente al firmar la promesa o la compraventa y el arrendatario al firmar el arrendamiento (RP-90, «Etapas por ruta», COR-10). | Compradores y arrendatarios son leads de Fortius y contraparte del cliente; nunca clientes de Fortius (RP-93). |
| 17/10/2026 | Rutas de operación `compra` y `arrendatario` con siete pasos y su expediente («Etapas por ruta», MRP-01). | «Quiere comprar» y «Quiere rentar» hacen el perfilamiento y guardan un lead; no abren operación (RP-93, COR-11). |
| 17/10/2026 | Fortius en los dos lados de la venta como dos operaciones vinculadas (propuesta del cuestionario, B-08). | Una sola operación, la del propietario (RP-93). |
| 17/10/2026 | La intermediación podía firmarse antes del dictamen y la opinión de valor, con motivo (propuesta del cuestionario, B-04). | Se firma solo después de la opinión jurídica y la comercial; con condición jurídica subsanable, queda «En regularización» (RP-96). |
| 17/10/2026 | Ofrecer el inmueble en privado antes de firmar, por decidir (RP-91). | No se ofrece antes de la firma; excepción: inmuebles compartidos de otra inmobiliaria (RP-91, RP-95). |
| 17/10/2026 | Una operación con folio `EXP-…` como expediente completo de la persona. | Expediente del cliente en la ficha del propietario y folio por inmueble (RP-94). |
| 17/10/2026 | La opinión de valor podía hacerse al mismo tiempo que el dictamen (B-04). | Primero la opinión jurídica; la de valor solo si el inmueble pasa o pasa con condiciones (RP-96, D-11). |
| 17/10/2026 | Cada asesor ve sus operaciones; «Notas del equipo» como página aparte (F-03 propuesto, DEC-25). | El inventario captado es del equipo y cualquier asesor puede venderlo; notas en un botón discreto del inmueble y de la operación (RP-99). |
| 17/10/2026 | Primera versión de esta sección: producto comercializable a otras inmobiliarias desde ahora, con multiempresa, marca por empresa, flujo configurable, planes y piloto externo; DEC-15 bloqueando REL-01 y SEG-01. | Segunda indicación del titular el mismo día: exclusivo de Fortius y solo con su marca. Lo de otras inmobiliarias pasa a «Etapa posterior (en pausa)»; DEC-15 ya no bloquea nada; las reglas fiscales por lugar se quedan para Fortius (FIS-01). |
| 29/10/2026 | Una operación con portada azul con foto, línea de tiempo de las 10 etapas a la izquierda y «Ahora toca» al centro (LV-05, «Dirección aprobada»; encargo del rediseño, «Operación guiada»). | Boceto D «Moderno»: panel azul con el número de etapa y las etapas como barras, piezas de la etapa en rejilla y barra de acción flotante (LV-06). Lo construido sigue vigente en pantalla hasta que el titular pida el cambio. |
| 30/10/2026 | Inicio con tres propiedades destacadas: una tarjeta grande y dos filas a su lado («Sitio público · Inicio»). | Baraja de tarjetas a pantalla completa con botones por tipo y hasta cinco destacadas por botón; el resto se consulta en el inventario. |

## Simplificación de la interfaz (SIM) — paquete listo para implementar, 17/10/2026

**Origen:** revisión crítica del titular y del agente sobre capturas reales del panel (15 pantallas, 1440 y 390 px, datos simulados, sin tocar la base). El titular aprobó **las 32 correcciones** el 17/10/2026 para hacerse en una sesión futura. **Estado: pendiente; no hay código escrito.**

**Cómo trabajarlo en la próxima sesión** (antes de cada entrega, volver a capturar la pantalla: el panel cambia):

1. Leer RP-50 a RP-57 y esta sección completa. Tomar una entrega SIM a la vez, en el orden de la tabla; cada una cabe en un commit o PR.
2. Antes de cambiar una pantalla, capturarla igual que en la revisión: servidor compilado con las variables de Supabase vacías y API simulada con `page.route`, como en `tests/admin/browser/secciones.spec.ts` y `process-corrections.spec.ts`. En este contenedor, Chromium se lanza con `executablePath: "/opt/pw-browsers/chromium"`. Nunca usar `.env.local` (apunta a la base real).
3. Después del cambio, volver a capturar a 390 y 1440 px, en claro y oscuro; comparar; correr lint, tipos, pruebas del panel y las de navegador afectadas; y actualizar las pruebas que buscan textos que cambian.
4. **Lo que no cambia:** reglas del servidor, permisos, validaciones (`workflowBlockers`, `reviewComplete`), datos y migraciones. SIM es de pantalla. Si una corrección necesita un dato nuevo, se pregunta al titular.
5. **Lo que se conserva** porque funciona: la estructura de Hoy, el asistente de 4 pasos de Nueva operación, la tabla de Contactos, el glosario sencillo y el estilo redondeado con fondo gris.
6. Registrar cada entrega en este plan (commit, pruebas, capturas revisadas, límites).

**Estado de las correcciones tras el boceto C (revisado en capturas del panel actual, 18/10/2026):**

| Estado | Correcciones |
|---|---|
| Resueltas por el boceto C | C13, C14 («Ahora toca»), C16 («Marcar revisado» y lo demás en «⋯»), C17 («Qué hacemos» plegado), C18 (ya no hay barra fija «Te falta»). |
| Resueltas en parte | C12 (lista con fases; faltan Reportes y renta), C15 (una sola sección «Para terminar la etapa» en dos partes; faltan quitar los números de formato de la vista principal), C20 (herramientas retiradas; «¿Qué significa cada estado?» sigue como tarjeta). |
| Siguen pendientes | C01–C11, C19, C21–C27, C29–C32. C28 pasa a HER-01. |

### Las 32 correcciones

**A. Todo el panel**

| # | Hoy (lo que se vio) | Corrección |
|---|---|---|
| C01 | El guinda significa botón principal, sección activa, precio, vencido, visita y enlace. | Guinda solo para la acción principal y la sección activa. Vencido en `--destructive` con ícono y palabra. Precios en texto oscuro normal. Visitas en el azul de información de RP-70 (tokens nuevos `--info` y `--success`, claro y oscuro, con contraste AA; ver LV-01). |
| C02 | Fechas, precios, folios, contadores y «Paso 1 de 4» en letra monoespaciada (unos 20 archivos usan `font-mono`/monospace en `src/components/admin`). | Tipografía normal del panel en todo. El folio queda discreto en gris. Las horas de la agenda pueden usar números tabulares sin cambiar de letra. |
| C03 | Conviven «2026-10-17», «Vie 16 oct», «Desde el 15 oct». | Una función única de fecha humana (junto a `formatDate` en `src/lib/utils.ts`): «Hoy», «Mañana», «Ayer», «Lun 19», «19 oct», «Vencida hace 2 días». La usan todas las pantallas del panel. |
| C04 | Textos fijos repetidos: aviso amarillo de borradores en Inmuebles; «Al marcar Revisado te pedimos…» bajo cada requisito; notas al pie de Reportes; «La comunicación, las citas y las tareas conservan fechas propias…». | Retirar los textos permanentes; explicar en el momento (al intentar la acción) o detrás de «?». |
| C05 | Demasiadas etiquetas en mayúsculas («LO QUE SIGUE · ETAPA 1 DE 10», «PROPIETARIO», «PRÓXIMA TAREA», «HERRAMIENTAS DE ESTA ETAPA»). | Dejar títulos normales solo donde orientan; quitar las etiquetas que repiten la pestaña o el título. |
| C06 | El pie de la barra lateral tiene cinco elementos; «Herramientas» muestra «16» (y ya son 17; el menú del celular dice «Ver las 16 herramientas»). | Pie con nombre y foto; al tocarlos, menú con Mi perfil, tema, Ver sitio y Cerrar sesión. Quitar el número de Herramientas y el «16» del menú del celular. (`workspace/guided-nav.tsx`) |
| C07 | Un buscador en la barra lateral y otro en cada página, con el mismo aspecto. | El de la barra: «Buscar en todo (Ctrl+K)» y se abre con el atajo (UX-03). Los de las páginas: «Filtrar esta lista», con aspecto de filtro. (`workspace/search.tsx` y listas) |
| C08 | Cinco botones de alta repartidos («Nueva operación», «Agregar contacto», «Agregar inmueble», «Agendar», «Agregar tarea»). | Un botón «+ Nuevo» arriba de la barra lateral y el «+» del celular abren un menú corto: Nueva operación (primera), Contacto, Inmueble, Cita, Tarea. Los botones de cada página pueden quedarse como atajo secundario. (`workspace/quick-create.ts`, `guided-nav.tsx`) |

**B. Hoy** (`workspace/hoy.tsx`, `src/lib/admin/today.ts`)

| # | Hoy | Corrección |
|---|---|---|
| C09 | Tres botones «Continuar» iguales. | Toda la tarjeta es el enlace; una flecha discreta indica que se abre. |
| C10 | «Pedir escritura» aparece en «Esperan algo de ti» y otra vez en «Tareas de hoy». | Lo que ya sale en «Esperan algo de ti» no se repite en «Tareas de hoy». |
| C11 | «Buenas noches» sin nombre. | «Buenas noches, <nombre>» con el nombre del asesor vinculado (o del perfil). |

**C. Operaciones** (`components/admin/operation/`, `src/lib/admin/operation-view.ts`, `SALE_PROCESS` en `src/lib/formatos/operation-workflow.ts`)

| # | Hoy | Corrección |
|---|---|---|
| C12 | El tablero tenía 10 columnas casi vacías y Reportes usa otros nombres («Captación», «Documentación»). | **Resuelto en parte por el boceto C (17/10/2026):** lista «Esperan algo de ti / Al día» con filtros por las cuatro fases (Conocer · Revisar · Preparar y publicar · Vender y cerrar) y etapa numerada por ruta. Queda: los mismos nombres de fase y etapa en Reportes y en todo el panel; la renta con sus propias etapas (COR-04). `SALE_PROCESS` y sus candados no cambian. |
| C13 | La barra de avance de 10 pasos se amontonaba en dos renglones. | **Resuelto por el boceto C:** círculos numerados con «Etapa N de 10 · fase» y «Ver etapas». Queda: los cuatro pasos visibles de «Cierre y entrega» (COR-09). |
| C14 | En Prospecto la misma acción aparece tres veces y con dos nombres: tarjeta «¿Ya estás con el propietario?» con «Iniciar entrevista inicial», tarjeta «Entrevista inicial» con «Preparar entrevista», y barra «Te falta: Iniciar la entrevista inicial (con el botón «Iniciar entrevista inicial»)». | Una sola tarjeta **«Siguiente paso»** con un solo botón y un solo nombre para la acción. Lo demás de la etapa, debajo y plegado. |
| C15 | En Dictamen jurídico hay dos listas paralelas: «Lo que se hace en esta etapa» (formatos 05 y 06 con «Iniciar») y «Requisitos de esta etapa» (estados). | Una sola lista de pasos: cada paso muestra su documento (iniciar, continuar o ver PDF) y su estado. Sin números de formato en la vista principal (quedan en «Más detalles» y en Documentos). |
| C16 | Cada requisito muestra 4 o 5 botones de estado (12 botones con 3 requisitos). | Se ve solo el estado actual como pastilla y la siguiente acción obvia («Ya lo tengo» → «Marcar revisado»). «Hay un problema» y «No aplica» (donde se admite) van en «⋯». El panel «Marcar como revisado» y su evidencia no cambian. |
| C17 | «Qué hacemos / Para qué» ocupa el primer tercio de la pantalla en cada visita. | Abierto la primera vez que el usuario ve esa etapa; después plegado detrás de «¿Qué se hace aquí?». |
| C22 | «Alta directa, sin entrevista» es una tarjeta grande en el tablero. | Opción secundaria dentro de Nueva operación («¿Ya tienes los datos? Alta rápida sin entrevista»). Conserva su protección de captura. |

**D. Operación en celular y columna lateral** (`operation/screen.tsx`, `settings-tab.tsx`)

| # | Hoy | Corrección |
|---|---|---|
| C18 | En celular, la barra fija «Te falta» más la barra inferior tapan cerca de un cuarto de la pantalla. | «Te falta» en una sola línea («Te falta 2 · Ver») que se expande al tocarla, pegada al botón «Pasar a». |
| C19 | En celular, Llamar y WhatsApp quedan al final, después de las herramientas. | Encabezado de la operación con Llamar y WhatsApp visibles en celular. |
| C20 | «¿Qué significa?» es una tarjeta casi vacía; en Prospecto se ofrece «Comparar casas parecidas». | «¿Qué significa?» pasa a enlace. Herramientas solo en las etapas donde aplican; revisar el mapa etapa → herramienta. |
| C21 | Pestaña «Ajustes» con pausar, descartar, corregir etapa y eliminar. | Esas acciones van en un menú «⋯» del encabezado; se retira la pestaña. Corregir etapa sigue pidiendo motivo; eliminar sigue diciendo que se puede restaurar. |

**E. Contactos** (`src/app/admin/leads/[id]/page.tsx`, `src/app/admin/clientes/[id]/page.tsx`, `components/admin/contacts/`, `workspace/related-work.tsx`, `lead-profile-editor.tsx`, `cliente-editor.tsx`)

| # | Hoy | Corrección |
|---|---|---|
| C23 | La ficha del prospecto no se rediseñó: estilo viejo con esquinas rectas; migas «Inicio / Prospectos / Registro»; el nombre aparece debajo de «Entrevista inicial» y «Seguimiento conectado»; dice «Agenda del lead»; fecha «2026-10-17»; botón de agenda solo con ícono; cinco acciones principales compitiendo; estados sueltos como fila de botones. | Ficha nueva con el marco del panel guiado: encabezado con nombre, teléfono, estado (selector), Llamar y WhatsApp; tarjeta «Siguiente paso» (base para CRM-02); línea de tiempo con notas, contactos, citas y tareas (CRM-03 puede crecer sobre ella); datos y asignación en una columna; Preparar operación como acción principal; Convertir y Eliminar en «⋯»; la cita se agenda con el mismo panel de C25. La ficha del cliente sigue la misma estructura. |
| C24 | Pestañas Prospectos y Clientes: un usuario nuevo no sabe dónde buscar a una persona. | Una sola lista de personas con etiqueta de etapa y filtro: prospecto (nuevo, en seguimiento, descartado…) o **Cliente**, que se calcula del contrato firmado y no se elige a mano (RP-90 a RP-92). **Solo de pantalla:** las tablas `leads` y `clientes` no cambian; la lista las une y cada fila abre su ficha. `?tab=` sigue funcionando como filtro. |

**F. Agenda, Inmuebles, Herramientas, Reportes y error**

| # | Hoy | Corrección |
|---|---|---|
| C25 | Formulario «Agendar» siempre abierto con seis listas «Ninguno (opcional)». (`agenda/calendar.tsx`, `agenda-view.ts`) | Panel que se abre con «+ Agendar», con el «+ Nuevo» (C08) o al tocar un hueco del calendario, con fecha y hora ya puestas. Un solo campo «¿Con quién o sobre qué?» que busca persona, inmueble u operación; asesor = el usuario por omisión. Se conservan los vínculos y la protección de captura. |
| C26 | Bote de basura visible en cada cita. | Eliminar dentro de la cita (o en «⋯»), con «Deshacer» (RP-16). |
| C27 | Aviso amarillo general sobre borradores en Inmuebles. (`properties/property-list.tsx`) | Cada inmueble dice qué le falta («Faltan fotos», «Sin publicar», «Sin precio»), base para INV-01. |
| C28 | Herramientas: buscador, favoritos y 6 filtros para 17 tarjetas; «Documentos sin expediente» contradice el glosario. (`apps/catalog.tsx`, `src/lib/apps/catalog.ts`) | SIM-10 aplica solo el patrón visual: grupos visibles sin filtros y búsqueda solo si el catálogo crece. El contenido, los nombres de los grupos (Documentos · Calcular · Presentar) y los accesos directos los define HER-01. «Documentos sin expediente» → «Documentos sueltos». El lugar de «Notas del equipo» se decide en DEC-25. |
| C29 | Reportes con lenguaje técnico («Corte operativo… cada indicador conserva su alcance», «Cartera para ofertas y cierres», notas al pie largas) y etapas internas. | Cuatro números grandes arriba, comparados con el periodo anterior; el detalle plegado; textos del glosario; «Control comercial» con un nombre claro; mismas etapas que C12. Las definiciones del diccionario de indicadores no cambian. |
| C30 | La pantalla de error usa el estilo del sitio público (mayúsculas condensadas) y dice «La información no se mostró como vacía». (`src/app/error.tsx`) | Dentro de `/admin`, error con el estilo del panel: «No pudimos abrir esta página. Tus datos están a salvo.» con Reintentar y Volver a Hoy. **Revisar también** por qué la edición de inmueble mostró este error con datos simulados (puede ser solo de la simulación). |

**G. Usuarios nuevos**

| # | Hoy | Corrección |
|---|---|---|
| C31 | Estados vacíos tipo «Sin operaciones en esta etapa». | Estados vacíos que enseñan: qué es la sección, el botón para empezar y, en Operaciones y Contactos, los tres primeros pasos. |
| C32 | En Nueva operación hay que elegir y luego pulsar «Continuar»; el botón deshabilitado se ve rosa, como roto. (`intake/wizard.tsx`) | Al elegir una opción del paso 1 se avanza solo (con teclado se confirma con Enter). El botón deshabilitado debe verse claramente inactivo. |

### Entregas del paquete SIM

| ID | Correcciones | Alcance | Aceptación |
|---|---|---|---|
| SIM-01 | C01–C05 | Tokens de color, tipografía, fecha humana y retiro de textos permanentes en todo el panel | Ningún `font-mono` en `src/components/admin` ni `src/app/admin`; ninguna fecha ISO visible; guinda solo en acción principal y sección activa; contraste AA en claro y oscuro; pruebas de axe aprobadas. |
| SIM-02 | C06–C08 | Barra lateral, buscadores y botón «+ Nuevo» | Pie compacto con menú; sin contadores inútiles; búsqueda global distinguible del filtro; «+ Nuevo» con 5 opciones por teclado y en celular. |
| SIM-03 | C09–C11 | Hoy | Tarjetas tocables completas; sin duplicados entre secciones; saludo con nombre; pruebas de `today.ts` actualizadas. |
| SIM-04 | C12, C13, C22 | Alta rápida dentro de Nueva operación; nombres de fase y etapa unificados | Lo que queda tras el boceto C: «Alta directa» dentro de Nueva operación; mismos nombres de fase y etapa en Reportes y en todo el panel; `?etapa=<slug>` sigue funcionando. |
| SIM-05 | C14–C17 | Quitar números de formato de la vista principal | Lo que queda tras el boceto C: sin números de formato en la vista principal (C15); «Marcar como revisado» pide la misma evidencia; el servidor rechaza lo mismo que antes. |
| SIM-06 | C18–C21 | Celular, columna lateral y menú «⋯» | Lo que queda tras el boceto C: Llamar y WhatsApp en el encabezado en celular (C19); «¿Qué significa?» como enlace (C20); pestaña Ajustes retirada sin perder ninguna acción (C21). |
| SIM-07 | C23 | Ficha de persona (prospecto y cliente) | Mismo marco que la operación; una acción principal; sin «lead» ni «Seguimiento conectado»; fechas humanas; conversión técnica y eliminación con sus protecciones actuales; «Cliente» solo con contrato firmado (RP-92, COR-10). |
| SIM-08 | C24 | Lista única de personas | Una lista con etapa y filtro; las fichas y las direcciones anteriores funcionan; sin cambios de base. |
| SIM-09 | C25, C26 | Agendar y eliminar citas | Panel de agendar desde hueco o botón; un campo de búsqueda de vínculo; eliminar con deshacer. |
| SIM-10 | C27, C28 | Inmuebles y Herramientas | Cada inmueble dice qué le falta; catálogo en tres grupos sin filtros; «Documentos sueltos». |
| SIM-11 | C29, C30 | Reportes y pantalla de error | Cuatro indicadores arriba con comparación; lenguaje del glosario; error del panel con el estilo del panel. |
| SIM-12 | C31, C32 | Estados vacíos y avance automático | Cada lista vacía enseña su primer paso; el paso 1 de Nueva operación avanza al elegir. |

## Navegación y productividad (NAV) — paquete listo para implementar, 17/10/2026

**Origen:** investigación de CRM inmobiliarios (Follow Up Boss, Lofty, EasyBroker, Tokko Broker, SkySlope) y de paneles de referencia (HubSpot, Attio), filtrada con criterio crítico. El titular aprobó **las 25 mejoras (N01–N25)** y las cinco restricciones (RP-65 a RP-69) el 17/10/2026. **Estado: pendiente; no hay código escrito.**

**Cómo trabajarlo:** igual que SIM (capturar antes y después con datos simulados, pruebas del panel y de navegador afectadas, registrar la entrega aquí). Cada entrega NAV dice de qué entregas depende; ninguna se hace antes de SIM-01, que fija color, letra y fechas. Las entregas marcadas «con migración» requieren respaldo, ensayo aislado y autorización, como cualquier cambio de base.

### Las 25 mejoras y cómo conviven con el plan

**A. Barra lateral y navegación**

| # | Mejora | Cómo convive con el plan |
|---|---|---|
| N01 | **Contraer la barra lateral a íconos** con un botón y la tecla `[` (atajo de una tecla: no actúa dentro de campos y se puede desactivar, RP-11); con la barra contraída, el nombre aparece al pasar el mouse o al enfocar. El estado se recuerda por usuario. | El rediseño (Fase C · 2) había retirado contraer y ajustar el ancho; vuelve solo contraer, sin ancho ajustable. El estado se guarda con las preferencias del servidor (RP-14, UX-02). En celular no aplica: sigue la barra inferior. Se hace junto con el pie compacto de C06. |
| N02 | **Sección «Fijados»**: cada quien fija hasta 5 registros o listas (operación, contacto, inmueble, lista guardada). | No mueve ni oculta las cinco secciones (RP-58, RP-65). Si un registro fijado se elimina o se pierde el permiso, desaparece de Fijados sin error. En celular, Fijados va en el Menú. |
| N03 | **«Recientes»**: los últimos 5 registros abiertos aparecen al abrir el buscador, sin escribir. | Va dentro de la barra de comandos (RP-10, UX-03) y de la búsqueda global de C07. Se guarda por usuario en el servidor; solo lista lo que el usuario puede ver hoy. |
| N04 | **Contadores solo cuando hay algo que atender** (por ejemplo, «2 vencidas» en Operaciones, en el rojo de alerta). | Completa C06 (quitar contadores inútiles). El de Hoy se queda porque es de atención y suma la bandeja «Para ti» (RP-20). Usa los mismos cálculos de Hoy, sin consultas nuevas al servidor. |
| N05 | **Vista previa lateral**: tocar una fila de Operaciones, Contactos o Inmuebles abre un panel a la derecha con lo esencial (siguiente paso, teléfono, estado) y sus acciones; «Abrir completo» lleva a la ficha. | Usa el componente de panel lateral del kit (`Sheet`). En celular no hay vista previa: se abre la ficha. Respeta C09 (toda la tarjeta se toca), C24 (lista única de personas) y RP-55 (lo demás en «⋯»). Las ediciones en la vista previa usan el mismo control de versión. |
| N06 | **Volver sin perder el lugar**: al regresar de una ficha, la lista conserva búsqueda, filtro y posición. | La búsqueda y el filtro van en la dirección (`?q=`, `?etapa=`, `?tab=`), como ya hacen las pestañas; la posición se guarda en la pestaña del navegador. No requiere servidor. |

**B. Personalización con límites**

| # | Mejora | Cómo convive con el plan |
|---|---|---|
| N07 | **Listas inteligentes**: Fortius define listas de equipo que se actualizan solas («Prospectos sin contacto en 5 días», «Operaciones sin próxima tarea», «Inmuebles sin fotos», «Ofertas por vencer») y cada quien guarda las suyas. | Amplía las vistas guardadas de RP-14 y UX-02: las del equipo las crea el administrador, las personales cada quien. Se pueden fijar (N02). Cada lista muestra solo lo que el usuario tiene permiso de ver. Los umbrales («5 días») se ajustan en Configuración. «Esperan algo de ti» de Hoy sigue siendo la lista principal y no se duplica. |
| N08 | **Hoy personalizable, poco**: ocultar u ordenar Agenda, Próximos 7 días e Informes. | «Esperan algo de ti» y «Tareas de hoy» no se ocultan (RP-61). Respeta C10 (sin duplicados). Se guarda por usuario en el servidor. |
| N09 | **Tamaño de letra Normal o Grande**, además de la densidad. | Se agrega a Mi perfil junto a la densidad y se guarda en el servidor (RP-14). Con letra Grande no debe haber desbordamiento a 320 px y los objetivos táctiles siguen en 44 px como mínimo. |
| N10 | **Tema claro, oscuro o automático** (según el sistema). | El botón de tema pasa al menú del usuario (C06). «Automático» es la opción inicial. No hay colores personalizados (RP-69). |
| N11 | **Pantalla de inicio por rol**: el asesor abre en Hoy; el director, en su tablero. | Reemplaza la decisión por defecto del encargo («Hoy para todos»). Mientras no exista el tablero del director (TAB-02, TAB-05), todos abren en Hoy. Cada usuario puede cambiar su pantalla de inicio en Mi perfil. |

**C. Trabajo diario más rápido**

| # | Mejora | Cómo convive con el plan |
|---|---|---|
| N12 | **Planes de seguimiento**: plantillas definidas por Fortius («día 0 llamar, día 2 WhatsApp, día 7 llamar») que se activan al crear un prospecto o al entrar a una etapa. | Solo crean tareas (RP-62, RP-68). Para no saturar Hoy, el plan crea **una tarea a la vez**: la siguiente aparece al completar la anterior, con su fecha calculada desde ese momento. La tarea abierta del plan cuenta como el «siguiente paso» de RP-21 y de la operación (la regla de próxima tarea con fecha se cumple igual). Registrar un contacto (CRM-02) completa la tarea del plan que corresponde. Se puede detener el plan con un toque. |
| N13 | **Posponer con un toque**: «Mañana», «Lunes», «En una semana». | Cambia la fecha de la tarea con «Deshacer» (RP-16) y queda en el historial. Posponer la próxima tarea de una operación no salta candados: la operación sigue con próxima tarea fechada. |
| N14 | **Acciones rápidas en la fila**: en computadora, al pasar el mouse, Llamar, WhatsApp y Nueva tarea; en celular, deslizar para marcar hecha o posponer. | Siempre también en «⋯» de la fila, con teclado (RP-63). Llamar y WhatsApp no registran contacto por sí solos (RP-22): al volver se ofrece «Registrar contacto». |
| N15 | **Editar el dato donde está** en las fichas (teléfono, presupuesto, zona…). | Extiende RP-13 de las tablas a las fichas, con el mismo control de versión y conflicto explicado (RP-17). Se aplica sobre la ficha nueva de C23. Los campos que validan reglas de negocio (etapa, responsable) siguen con su flujo propio. |
| N16 | **Cola de revisión de documentos**: el director o el jurídico pasa de un documento pendiente de revisar al siguiente, de todas las operaciones. | Usa la vista lado a lado de DOC-10 y el mismo panel «Marcar como revisado» con su evidencia (`reviewComplete` no cambia). Solo para los roles con ese permiso (RP-05, SEG-01). Complementa el tablero de vencimientos (DOC-13). |
| N17 | **Calificación del prospecto**: caliente, tibio o frío; la pone el asesor y el sistema sugiere una según la actividad; las listas se ordenan por ella. | Es distinta del estado del prospecto (Nuevo, Contactado…), que no cambia. La sugerencia nunca se aplica sola (RP-62). Requiere un campo nuevo en el perfil del prospecto (con migración si no cabe en el perfil existente). |
| N18 | **Foto de documento con la cámara**: en celular, el requisito abre directo la cámara. | Entra por la misma carga de DOC-11 y termina en «Lo tengo», nunca en revisado. La imagen se guarda privada y sin ubicación (como la herramienta Fotografías). |
| N19 | **Modo «Ver como cliente»**: mostrar el inmueble en la tableta sin precio mínimo, comisión ni notas internas. | Se arma con la proyección pública del inmueble (RP-64, PUB-01), no ocultando campos. Sale del modo con un botón claro. No da acceso a otras pantallas del panel mientras está activo. |
| N20 | **Aviso de «<persona> está editando esto»**. | Evita conflictos antes de que ocurran; el control de versión (409) sigue siendo la protección real. Requiere presencia en tiempo real de Supabase (incluida en la librería instalada, sin dependencia nueva) y decisión del titular. Prioridad baja. |

**D. Agenda**

| # | Mejora | Cómo convive con el plan |
|---|---|---|
| N21 | **Duración de las citas** y arrastrar para cambiar la hora. | Hoy los eventos no guardan duración: **con migración** aditiva (las citas existentes quedan de una hora). Arrastrar tiene alternativa con teclado y con el panel de C25 (RP-63). Mover una visita queda en el historial. |
| N22 | **Ver la agenda de Fortius en Google Calendar o en el calendario del teléfono** (suscripción de solo lectura). | Liga secreta por usuario, revocable, con lo mínimo (hora, tipo y título sin datos sensibles). Depende de PRV-01: es un destino nuevo de datos personales. No escribe en el calendario externo. |

**E. Orden y arranque**

| # | Mejora | Cómo convive con el plan |
|---|---|---|
| N23 | **Una sola Papelera** en Administración con todo lo recuperable (operaciones, inmuebles, artículos, notas, eventos). | Reúne en pantalla las recuperaciones que ya existen (operaciones eliminadas e Historial); no cambia cómo se restaura ni las reglas de cada tipo. Reemplaza el enlace «Ver operaciones eliminadas» del tablero. |
| N24 | **«Primeros pasos» para el asesor nuevo**: lista en Hoy (foto, WhatsApp, primera operación, primera cita) que desaparece al completarse. | NAV-13 es su único dueño; cuando llegue SOP-01, su recorrido inicial se coordina con esta lista para no mostrar dos ayudas a la vez. La lista de arranque del administrador («Preparar tu espacio») sigue en Configuración. |
| N25 | **Resumen del día** por correo o aviso en la mañana. | En espera: depende de los avisos fuera del panel (PWA-03), con consentimiento, horario y sin datos sensibles en el mensaje. Mientras tanto, Hoy cumple esa función. |

### Entregas del paquete NAV

| ID | Mejoras | Depende de | Aceptación |
|---|---|---|---|
| NAV-01 | N01, N02, N04 | SIM-02, UX-02 | Barra contraíble con botón y `[`, nombres visibles al enfocar; hasta 5 fijados que sobreviven a recargar y cambiar de equipo; contadores solo con algo vencido; las cinco secciones no se mueven. |
| NAV-02 | N03 | UX-03 | Recientes al abrir el buscador, por usuario, solo con registros visibles. |
| NAV-03 | N05, N06 | SIM-01, SIM-08 | Vista previa en Operaciones, Contactos e Inmuebles a partir de 1024 px; al volver de una ficha, lista con la misma búsqueda, filtro y posición. |
| NAV-04 | N07 | UX-02, SEG-01 | Listas del equipo creadas por el administrador y personales por usuario; cada lista respeta permisos; umbrales en Configuración. |
| NAV-05 | N08–N11 | UX-02, SIM-03 | Secciones de Hoy ocultables salvo las protegidas; letra Grande sin desbordamiento a 320 px; tema automático; inicio por rol con Hoy como respaldo. |
| NAV-06 | N12 | CRM-02 | Plantillas de plan en Configuración; una tarea a la vez; ningún envío automático; se puede detener; cumple la próxima tarea de la operación. |
| NAV-07 | N13–N15 | UX-04, SIM-07 | Posponer con deshacer; acciones de fila con alternativa en «⋯»; edición en la ficha con control de versión. |
| NAV-08 | N16 | DOC-10, SEG-01 | Cola que recorre pendientes de revisión de todas las operaciones visibles; misma evidencia que «Marcar como revisado». |
| NAV-09 | N17 | CRM-02 | Calificación manual con sugerencia que no se aplica sola; listas ordenables por ella. |
| NAV-10 | N18, N19 | DOC-11, PUB-01 | Cámara desde el requisito, imagen privada sin ubicación; «Ver como cliente» con datos públicos únicamente. |
| NAV-11 | N20 | Decisión del titular | Aviso de edición simultánea sin reemplazar el control de versión. |
| NAV-12 | N21, N22 | Migración autorizada (N21), PRV-01 (N22) | Citas con duración y arrastre con alternativa de teclado; suscripción de solo lectura, revocable y con datos mínimos. |
| NAV-13 | N23, N24 | SIM-01 | Papelera única que restaura con las reglas de cada tipo; «Primeros pasos» del asesor que desaparece al completarse. |
| NAV-14 | N25 | PWA-03 | En espera hasta que existan avisos fuera del panel. |

## Lenguaje visual (LV) — paquete listo para implementar, 17/10/2026

**Origen:** propuesta del agente aprobada por el titular el 17/10/2026 (V01–V10). **Estado: pendiente; no hay código escrito.** Se trabaja igual que SIM y NAV: capturas antes y después a 390 y 1440 px en claro y oscuro, revisión de contraste AA con axe, pruebas afectadas y registro en este plan. Sin dependencias nuevas: íconos con `lucide-react` y animaciones con `motion`, ya instalados.

### Las 10 mejoras y cómo conviven con el plan

| # | Mejora | Cómo convive con el plan |
|---|---|---|
| V01 | **Un ícono por etapa y por tipo de documento**, siempre el mismo en el tablero, la barra de avance, Hoy y los documentos. | Catálogo único de íconos (RP-71). Cuando las etapas sean configurables, el ícono se elige al definir la etapa, de ese mismo catálogo. Sustituye los íconos sueltos de cada pantalla. |
| V02 | **Cinco colores con significado fijo**, siempre con ícono. | Es RP-70. Completa RP-52 y C01: las visitas usan el azul de información. Hoy no existen tokens de verde ni de azul: se agregan `--success` e `--info` (con su superficie y borde), en claro y oscuro, con contraste AA sobre tarjeta y fondo. Se hace dentro de SIM-01. |
| V03 | **Cada estado de requisito con su forma**: círculo vacío (Pendiente), medio lleno (Lo tengo), palomita (Revisado), triángulo (Hay un problema), guion (No aplica). | Es RP-72. Va en la pastilla de estado actual de C16. Los mismos símbolos se usan en la lista de documentos por pedir y en la cola de revisión (NAV-08). |
| V04 | **Anillo de avance en cada operación** («6 de 10 pasos») en las tarjetas del tablero y en las listas. En el encabezado de la operación no, porque ahí ya está la barra de etapas (RP-51). | Pequeño y con el texto al lado, para lectores de pantalla. Cuenta los pasos del proceso de esa operación, así que funciona igual con las 6 etapas de C12 y con procesos configurables. Verde al completar; sin color de alerta (lo vencido ya lo dice la tarjeta). |
| V05 | **Tarjetas de documento con el ícono de su tipo y una insignia de estado**: Borrador, Revisado, Aprobado o Firmado (RP-85). | En la pestaña Expediente de la operación y en «Para terminar la etapa». Colores de RP-70: Borrador neutro, Revisado azul, Aprobado y Firmado verde. «PDF generado» es un ícono aparte, porque es una salida y no un estado. «Firmado» aparece al subir la copia firmada. |
| V06 | **Animaciones pequeñas que confirman**: la palomita que se dibuja al completar, la barra o el anillo que se llena, el panel que se desliza y un aviso breve de «Etapa completada». | Es RP-73. Se coordina con los avisos de «Guardado» y «Deshacer» (RP-15, RP-16): la animación no sustituye el mensaje. Con «reducir movimiento», todo cambia sin transición. |
| V07 | **Ayuda con «?» de una línea** junto a lo que confunde, y la primera vez un punto que late sobre el botón clave («Empieza aquí») y desaparece al usarlo. | Es la forma visual de RP-54 y de C17 («¿Qué se hace aquí?»). El punto late como máximo tres veces y queda fijo (WCAG 2.2.2); se recuerda por usuario que ya lo vio (preferencias de RP-14). Se coordina con «Primeros pasos» (N24) y el recorrido de SOP-01 para no mostrar dos ayudas a la vez. |
| V08 | **Ilustraciones de línea simples en las pantallas vacías**, con trazo en el color de texto secundario (sin guinda, para respetar RP-52). | Acompañan a los estados vacíos que enseñan (C31). SVG en el propio código, una línea, adaptadas a claro y oscuro; no se usan en pantallas con datos. |
| V09 | **Foto o iniciales del asesor responsable** en cada tarjeta, en un círculo neutro. | Sin un color por persona, para no competir con los colores de estado (RP-69, RP-70). Usa la foto de Mi perfil si existe. |
| V10 | **Escala tipográfica de cuatro tamaños**. | Es RP-74. Se hace con SIM-01 (C02, C05): una sola letra, cuatro tamaños, y el peso para la jerarquía. Compatible con la letra Grande de N09, que aumenta los cuatro por igual. |

**LV-05 · Rediseño visual por área, con bocetos (titular, 17/10/2026, J-05):** antes de programar más pantallas, el titular envía capturas del sistema actual y el agente propone bocetos de rediseño por área; el titular elige y se ajusta lo visual antes de implementarlo. Hay un estilo general (marca, tokens, kit), pero cada etapa y ventana tiene su propio carácter, para que el panel no parezca una plantilla repetida. Criterio de aceptación en J-05 del cuestionario.

**Estado de LV-05 (18/10/2026): construida la capa visual** según los bocetos (marco, Hoy, Operaciones en lista y tablero, una operación, Inmuebles en galería, Contactos, Nueva operación y ventana de captura); registro en «Rediseño visual del panel según los bocetos — 18/10/2026». Quedan fuera, por falta de datos en el sistema, las cifras de cobros, la meta mensual, el avalúo dentro de la oferta, el perfil de leads compradores con coincidencias, las notas por inmueble y el tipo de cambio; el mapa entra con EXT-09.

**LV-07 · Tablero «Hoy» con el boceto D «Mosaico cálido» (titular, 29/10/2026).** El titular pidió bocetos nuevos del tablero «Hoy» y eligió el **D · Mosaico cálido** entre cuatro propuestas (A moderno, B estilo suizo, C consola nocturna y D mosaico cálido) del lienzo «Tablero Hoy del panel» (claude.ai, privado del titular). Reemplaza el «Hoy» de LV-05. **Estado: pendiente; no hay código escrito.**

- **Diseño del boceto D:** fondo crema `#F5F1EB`; menú del panel en una barra superior de píldoras («Hoy» con su contador, Operaciones, Contactos, Inmuebles, Agenda y «Más»), con buscador, «Nueva operación» y avatar a la derecha; bloques de tamaños distintos con esquinas de 28 px y sin sombras marcadas: saludo con la fecha y dos acciones; «Lo siguiente» con la foto del inmueble y su pendiente más urgente; «Operaciones en curso» en azul marino con la barra por fase (Conocer · Revisar · Preparar y publicar · Vender y cerrar); «Vencidas» en borgoña sólido; «Tareas de hoy» con casillas; «Agenda» con la próxima cita y su foto; «Esta semana» en siete días; y «Esperan algo de ti» en tarjetas con foto. Marca sin rosa: borgoña en claro y crema sobre oscuro. Debe tener también su versión oscura y acomodarse al celular en una columna.
- **Reglas para volumen alto (acordadas el 29/10/2026):** «Hoy» no muestra el inventario, solo lo que espera algo del usuario, así que el tablero mide lo mismo con 12 pendientes que con 200:
  - las cifras ocupan el mismo bloque con cualquier cantidad;
  - «Esperan algo de ti» muestra con foto solo las 4 más urgentes; las siguientes, hasta unas 10, en lista compacta sin foto, y al final «Ver las N» hacia Operaciones;
  - orden por urgencia (vencidas primero, después lo que vence en la semana); varios pendientes del mismo inmueble se agrupan en una tarjeta («3 pendientes»);
  - por omisión cada asesor ve lo suyo; el administrador cambia a «Todo el equipo», que con volumen alto se muestra como resumen por asesor y no como lista;
  - un pendiente sin inmueble (por ejemplo, una entrevista inicial) usa un bloque de color con iniciales en lugar de foto;
  - «Tareas de hoy» y «Agenda» muestran las primeras 5 y «Ver todas».
- **Límites:** solo cambia la presentación de «Hoy»; usa los datos que el panel ya calcula (pendientes, tareas, agenda, operaciones por fase y foto principal del inmueble) y no lleva migración. Conserva la navegación por teclado, el foco visible, los objetivos de 44 px y «reducir movimiento». El cambio del menú lateral a barra superior aplica solo si el titular lo confirma para todo el panel; mientras tanto, «Hoy» conserva el marco actual.

**Dirección aprobada (titular, 17/10/2026):** los bocetos están en el lienzo «Bocetos del panel Fortius» (claude.ai, privado del titular). El titular eligió la dirección **clara**: menú lateral flotante, buscador rápido, tarjetas con esquinas suaves (16 px en tarjetas, 10 px en controles), sombras azul marino, fotos reales de los inmuebles y gráficas pequeñas. La escala quedó en el sistema de diseño «Fortius Inmuebles» como `admin-radius-*` y `admin-shadow-*`; el sitio público conserva sus esquinas casi rectas.

**Sitio público · Inicio (titular, 18/10/2026):** a partir de sus capturas del sitio, el agente propuso tres direcciones en el lienzo «Rediseño sitio público Fortius» (claude.ai, privado del titular). El titular eligió la **C · Nocturno** para Inicio: portada oscura en ambos temas con foto a sangre, barra transparente con píldora de enlaces, menú de hamburguesa a pantalla completa que se abre en círculo, buscador de vidrio (operación, tipo y zona del inventario publicado), marquee infinito de zonas al pie de la portada (pausable), «Por qué Fortius» como **expediente de ejemplo** que se completa al desplazar, y el método **«Seis etapas. Un responsable.»** con recorrido horizontal fijado en escritorio y tarjetas apiladas en móvil. Esa portada usa esquinas suaves (14–24 px); este cambio reemplaza la regla de esquinas casi rectas solo en Inicio. Implementación: `src/app/page.tsx`, `src/components/home/nocturno-*`, `src/app/nocturno.css`. **Nosotros** (18/10/2026) sigue el artboard del lienzo: portada oscura con el asesor y su tarjeta de contacto, misión y visión como dos tarjetas (blanca y borgoña), valores numerados en rejilla y el video institucional en marco oscuro, solo cuando el panel tiene URL (`src/app/nosotros/`, `src/components/about/`). El mismo día se aplicaron los bocetos del lienzo al resto del sitio con un sistema común de páginas interiores (`src/app/publico.css`: cabecera oscura, tarjetas de esquinas suaves, píldoras y campos): footer nocturno «Hablemos», Blog en formato revista y artículo con índice fijo y compartir, Inventario con filtros en la cabecera, vista con mapa por zona (embed de Google por zona, sin API) y tarjetas compactas con «Comparar» en el pie, páginas por segmento con lectura del espacio e inventario del segmento, Comprar con pasos, Vender con asistente de inicio que prellena la evaluación, línea de tiempo y autoevaluación, Revisión documental con reporte de ejemplo, Herramientas con vistas previas, calculadoras con cabecera propia, Contacto nocturno con motivos en tarjetas, Avisos en biblioteca y Gracias con los tres momentos. La ficha «Escenario» del inmueble se construyó después, el mismo 18/10/2026 (ver «Estado vigente»). **Temas claro y oscuro (titular, 25/10/2026):** reemplaza «oscura en ambos temas» y la cabecera oscura de este párrafo. En claro, Inicio, las cabeceras interiores, Nosotros, la ficha, el footer y el menú son crema o blancos con texto azul y sin degradados oscuros; en oscuro conservan el Nocturno con su resplandor vino. La foto de portada de Inicio se mantiene en ambos temas con un velo suave. Los colores por tema son las variables `--ns-*` de `src/app/publico.css`. **Ajustes del titular (25/10/2026):** la marca no lleva rosa (acento borgoña sobre claro y crema sobre oscuro, ver `docs/brand.md`); logotipo sin placa sobre la foto; botón de tema en la barra de Inicio; portada sin la etiqueta sobre el titular; marquee sin rombos ni contornos; etiquetas de sección en texto normal en lugar de mayúsculas monoespaciadas; sin numeración decorativa ni texto fantasma; animaciones con curva suave y duraciones más largas, con la opacidad adelantada para que el texto se lea mientras se mueve. **Propiedades destacadas como baraja (titular, 30/10/2026):** el titular eligió, entre doce bocetos del lienzo «Bocetos de Propiedades destacadas» (claude.ai, privado del titular), las **tarjetas apiladas a pantalla completa**: cada destacada ocupa la pantalla bajo la barra fija, se queda arriba y la siguiente la cubre. Si hay destacadas de varios tipos aparecen botones «Todas», uno por tipo en venta («Casas», «Terrenos»…) y «En renta»; cada botón cambia la baraja, que lleva cinco propiedades como máximo, y ofrece el enlace al inventario con ese filtro. Reemplaza la tarjeta grande con dos filas y el tope de tres destacadas. Implementación: `src/lib/destacadas.ts`, `src/components/home/nocturno-sections.tsx` y `src/app/nocturno.css`. **Título del método (titular, 30/10/2026):** «Así vendemos tu propiedad.», sin etiqueta encima. Reemplaza «Seis etapas. Un responsable.», que prometía un solo asesor durante toda la venta: quien capta no siempre es quien vende. El título sigue editable en Secciones, grupo «Método»; un valor guardado igual al anterior se actualiza solo.

- **Hoy:** tablero del director con cifras arriba y «Necesitan tu decisión»; la misma pantalla se acomoda al celular, con barra inferior y botón «+».
- **Operaciones:** dos vistas con selector, **lista** (la de inicio) y **tablero** por fase; el sistema recuerda la última vista de cada usuario.
- **Inmuebles:** dos vistas, **galería** (primero) y **mapa** (cuando entre EXT-09).
- **Una operación:** se reemplaza por el boceto D «Moderno» (titular, 29/10/2026); ver **LV-06** abajo. Lo construido el 18/10/2026 (portada azul con foto, línea de tiempo a la izquierda y «Ahora toca» al centro) sigue en `main` hasta que el titular pida el cambio.
- **Contactos, Nueva operación y captura de documentos:** según sus bocetos.

**LV-06 · Una operación según el boceto D «Moderno» (titular, 29/10/2026). Lista para construir; se empieza solo cuando el titular lo pida.** El agente propuso cuatro direcciones para la pantalla de una operación en el lienzo «Bocetos de una operación» (claude.ai, privado del titular): A · Ruta arriba, B · Mesa de trabajo, C · Minimalista y **D · Moderno**. El titular eligió la **D**. La fuente del boceto está en `docs/diseno/operacion-boceto-d/OperacionModerno.dc.html`, con los datos de una operación de prueba (EXP-000006, etapa 5 «Dictamen jurídico»). Solo cambia la presentación de `/admin/operaciones/[id]`; no cambian rutas, API, base de datos, candados de avance, requisitos, 409, protección de cambios sin guardar ni permisos.

- **Disposición en computadora:** pantalla partida. A la izquierda, un **panel azul marino** (#061F3F, esquina 28 px, de 380 a 460 px de ancho, alto de la vista) y a la derecha las piezas de la etapa en una **rejilla de 6 columnas con piezas de distinto tamaño** (esquina 22 px, sin borde, fondo blanco sobre el lienzo `--canvas`).
- **Panel azul, de arriba abajo:** regreso a Operaciones (círculo de 44 px) y folio; una línea con la persona y lo que quiere («Moises Nuñez vende su casa»); el **número de etapa enorme** en Archivo condensado (anchura 62, peso 700, unos 168 px) con «/10» tenue al lado y, debajo, el nombre de la etapa (anchura 80, peso 600) y el nombre de la fase en texto secundario; las **10 etapas como barras**: hechas en guinda, la actual blanca, más gruesa y con letra mayor, las siguientes tenues; cada etapa conserva su botón y su nombre accesible actual («N · etapa: lista / aquí vas / pendiente»). Al pie, el **propietario** con iniciales o foto, «Propietario», y Llamar y WhatsApp como botones redondos de 44 px con `aria-label`.
- **Piezas de la derecha:**
  - **Documentos de la etapa** (4 columnas): cada formato con su número grande en Archivo condensado, nombre y avance («0 de 12 secciones · versión 1»); el que toca va sobre `--panel-selected` y abre su **ventana de captura propia** (regla vigente: nunca incrustado); el que espera a otro va con borde punteado y dice cuándo se abre («Se abre al terminar el 05»). Sin números de formato fuera de esta pieza (C15).
  - **Próxima tarea** (2 columnas): título, fecha con palabras y «Cambiar fecha». Fondo **rojo sólido** (`--alert`) con texto blanco **solo si está vencida**; si no, tarjeta blanca normal. Sin tarea, la pieza no aparece y la de documentos toma las 6 columnas.
  - **Antes de seguir, confirma** (3 columnas): los requisitos reales de la etapa con sus chips de estado vigentes (Pendiente, Lo tengo, Revisado, Hay un problema, No aplica) y «Marcar revisado» con la misma evidencia que hoy. Nunca texto de relleno.
  - **Inmueble** (3 columnas): la primera foto de la galería a sangre con una píldora blanca «Tipo · precio» (o «Precio por definir»). Sin foto: fondo `--track` con el ícono de casa y la ubicación; nunca un recuadro de «foto pendiente».
  - **Fila completa al pie:** responsable y los accesos a Expediente, Tareas, Historial y Ajustes, que abren las pestañas que ya existen.
- **Barra de acción flotante:** píldora blanca centrada abajo (máx. 760 px, sombra `--shadow-float`) con un anillo de los requisitos de la etapa («N de M para pasar a <siguiente etapa>»), lo que toca en una línea y el botón guinda. El botón dice **«Continuar»** y abre la ventana del documento que toca; cuando todo está listo cambia a **«Pasar a <siguiente etapa>»** con los mismos candados de hoy (`workflowBlockers`). El contenido deja espacio debajo para que la barra no tape nada.
- **Celular (390 y 320 px):** el panel azul va arriba y compacto (número de etapa de unos 72 px y las 10 etapas como barra horizontal de 10 tramos); las piezas en una columna; la barra flotante se apoya sobre la barra inferior del panel sin taparla.
- **Oscuro:** el panel azul pasa a `--card` con borde `--card-edge`; la tarea vencida conserva rojo con contraste AA; el resto usa los tokens del panel.
- **Se conserva sin cambios:** «Ver etapas», la vista de una etapa anterior, los cuatro pasos dentro de «Cierre y entrega» (COR-09), las pestañas y su contenido, el informe mensual y las visitas y ofertas, el panel de «Marcar revisado», la eliminación recuperable y las pruebas de navegador que leen la portada (folio como texto propio, nombres accesibles de las etapas).
- **Marca:** Archivo con los pesos del panel (620/600/540/400) salvo el número de etapa; íconos Iconoir por `icons.tsx`; sin rosa, sin etiquetas en mayúsculas y sin animaciones de entrada en cada pieza (RP-73: solo las que confirman).
- **Archivos previstos:** `src/components/admin/operation/screen.tsx`, `stages.tsx`, `next-step.tsx`, `requirements.tsx` y `operation.module.css`; el kit solo si hace falta una variante.
- **Aceptación:** revisión en el navegador a 1440, 1024, 390 y 320 px, en claro y oscuro, con teclado y con «reducir movimiento»; sin desbordamiento horizontal; la barra flotante no tapa contenido ni la barra inferior; operaciones con y sin foto, con y sin tarea, con tarea vencida y en «Cierre y entrega»; lint, tipos y pruebas del panel; Verify en CI antes de integrar, con el acuerdo del titular para fusionar.

**LV-08 · Panel versión 2: marco común y bocetos por sección (titular, 30/10/2026).** El titular pidió una crítica del panel completo (botones, textos, organización) porque lo sentía plano, con mucho texto y pocas imágenes, y bocetos por sección. El agente revisó las 18 pantallas en escritorio y celular y entregó el lienzo «Bocetos del panel Fortius, versión 2» (claude.ai, privado del titular): un artboard de diagnóstico y 17 bocetos (Hoy, Operaciones, Una operación, Nueva operación, Contactos y ficha de persona, Inmuebles, Agenda y Tareas, Herramientas, Administración), con versión de celular en los cinco principales. **El titular aprobó el mismo día las tres decisiones que cambian la forma del panel:**

- **DEC-35 · Barra superior en lugar de barra lateral.** La barra del Hoy «Mosaico cálido» (LV-07) se aplica a todo el panel: logotipo, píldoras **Hoy** (con el contador) · **Operaciones** · **Contactos** · **Inmuebles** · **Agenda** · **Más**, buscar (Ctrl K), **«+ Nuevo»** con menú corto (operación, prospecto, inmueble, tarea, cita; cumple C08) y la cuenta (Mi perfil, Administración para el administrador, Ver sitio, Modo oscuro, Cerrar sesión). «Más» abre Herramientas, que además enlaza Administración y Notas del equipo. Desaparecen la barra lateral, el contador «16», el desplegable de Administración, las migas y el segundo buscador de la barra. En celular la barra inferior sigue siendo Hoy · Operaciones · + · Contactos · **Más** (antes «Menú»).
- **DEC-36 · Una sola lista de personas** con su etapa como chip (Nuevo · En seguimiento · Cliente · Descartado), en lugar de las pestañas Prospectos y Clientes (C24, SIM-08). Las fichas y las direcciones anteriores se conservan.
- **DEC-37 · Eliminar solo desde dentro.** Desaparecen el bote de basura de cada fila en Operaciones y el de cada cita en Agenda; eliminar queda en el «⋯» de la operación o la cita, con «Deshacer» (RP-16, C26). La operación eliminada sigue siendo recuperable.

Ocho reglas para todas las pantallas (del artboard de diagnóstico): cada dato una sola vez; una acción principal por pantalla, en guinda; foto antes que ícono (toda operación, cita o aviso lleva la foto del inmueble; las personas, sus iniciales); títulos sin subtítulo ni encabezados de columna; números grandes en Archivo condensado para lo que cuenta (etapa, pendientes, cifras); lo vencido en rojo con palabra y lo demás sin color; formularios cerrados hasta que se piden (agendar, filtros, alta); nada técnico en pantalla (sin códigos «(05)», IDs, slugs, versiones ni «Las fechas son de Tijuana»). Lenguaje visual: lienzo crema `#F5F1EB` en claro (azul noche en oscuro), tarjetas blancas sin borde visible con esquinas de 20–24 px, bloques azul marino de 28 px para lo que manda en cada pantalla, guinda solo en la acción principal y el contador de Hoy; Archivo 620/600/540/400 e Iconoir. Hoy «Mosaico cálido» (LV-07) y Una operación «Moderno» (LV-06) se conservan y solo se afinan con estas reglas. Los demás bocetos resuelven lo que SIM ya había anotado: C09–C11 (Hoy), C12–C22 (Operaciones y operación), C23–C24 (personas), C25–C26 (agenda), C27–C28 (inmuebles y herramientas), C29 (reportes) y C31–C32 (vacíos y Nueva operación).

- **Orden de construcción:** 1) marco común y lienzo crema; 2) Hoy; 3) Operaciones; 4) Una operación (LV-06); 5) Nueva operación; 6) Contactos y ficha de persona; 7) Inmuebles; 8) Agenda y Tareas; 9) Herramientas; 10) Administración (Equipo, Reportes, Sitio web, Historial, Configuración y Mi cuenta en una sola sección con índice). Cada sección se revisa en localhost antes de seguir con la siguiente.
- **Límites:** solo cambia la presentación. No cambian rutas, API, base de datos, permisos, candados de avance, 409 ni la protección de cambios sin guardar; las direcciones anteriores siguen funcionando. Sin dependencias nuevas.
- **Estado (30/10/2026):** marco común y Hoy en construcción en la rama `feat/inicio-claro`, junto con el sitio público; nada integrado en `main`.

### Entregas del paquete LV

| ID | Mejoras | Depende de | Aceptación |
|---|---|---|---|
| LV-01 | V02, V10 | Se hace junto con SIM-01 | Tokens `--success` e `--info` en claro y oscuro con contraste AA; ningún color de estado fuera de los cinco roles; cuatro tamaños de letra en todo el panel; axe sin fallas. |
| LV-02 | V01, V03, V04, V05, V09 | LV-01, SIM-05 | Catálogo único de íconos usado en todas las pantallas; cada estado con forma, color y palabra; anillo de avance con texto; insignias de documento; avatar neutro del asesor. |
| LV-03 | V06 | LV-02, UX-04 | Animaciones de confirmación de 300 ms o menos, sin bucles; con «reducir movimiento» no hay transiciones; los mensajes de guardado siguen apareciendo. |
| LV-06 | Una operación según el boceto D «Moderno» | Ninguna; se empieza cuando el titular lo pida | Lo descrito en «LV-06» arriba: pantalla partida con panel azul y número de etapa, piezas de la etapa en rejilla, barra de acción flotante; mismas reglas, candados y pruebas; revisado en 1440, 1024, 390 y 320 px, claro y oscuro. |
| LV-04 | V07, V08 | LV-01, SIM-12 | «?» de una línea donde hay dudas; punto «Empieza aquí» que late tres veces y se recuerda por usuario; ilustraciones en todos los estados vacíos, en claro y oscuro. |
| LV-07 | Tablero «Hoy», boceto D «Mosaico cálido» | ninguna | «Hoy» igual al boceto D en claro y oscuro, a 390 y 1440 px; las reglas de volumen alto de LV-07 se cumplen con 200 pendientes de ensayo sin que el tablero crezca; axe sin fallas; pruebas de «Hoy» actualizadas sin debilitarlas. |
| LV-08 | Panel versión 2: marco común (DEC-35), lista única de personas (DEC-36), eliminar desde dentro (DEC-37) y bocetos por sección | LV-06 y LV-07 se construyen dentro de este orden | Cada sección igual a su boceto en claro y oscuro, a 390 y 1440 px, con las ocho reglas; pruebas del panel actualizadas sin debilitarlas; sin desbordamiento; teclado, foco y 44 px conservados. |

## Proceso, captura y documentos — paquete listo para implementar, 17/10/2026

**Origen:** el titular describió su proceso real (llamada → cita → entrevista → lista de documentos → levantamiento → recepción de documentos → dictamen → opinión de valor → contrato) y pidió capturar una vez, descargar aunque falten datos y procesos distintos por tipo de operación. El agente revisó el código y propuso este paquete; el titular lo aprobó completo el 17/10/2026. **Estado: pendiente; no hay código escrito.**

**Lo que ya existe y se conserva:** la lista de documentos se arma con las respuestas del 02 y sale en PDF o Word; el levantamiento lleva fotos y croquis en PDF o Word; el 07 se captura en el panel y se exporta a Excel; el 05 toma la lista de documentos y el 08 el valor del 07; el Word nunca se bloquea por datos faltantes.

**Lo que se encontró en el código (17/10/2026):** no existe una ficha única; cada borrador guarda su copia y se llena solo al crearse (`src/app/api/admin/expedientes/[id]/formatos/route.ts:40-55`, `src/lib/formatos/intake-prefill.ts`). El PDF se bloquea si falta un dato en 01, 02, 04, 05, 06, 08 y 10–19 (`src/app/api/admin/formatos/[id]/emitir/route.ts:27-44`, `src/lib/formatos/catalog.ts:500-582`); solo el 07 admite PDF incompleto. No hay envío del aviso ni de la lista de documentos, ni expediente en un solo archivo, ni membrete o plantillas cargables desde el panel.

**Cómo trabajarlo:** igual que SIM, NAV y LV (capturas antes y después con datos simulados, pruebas afectadas, registro aquí). FCH-01 y MOT-01 llevan migración: respaldo, ensayo aislado de restauración y autorización del titular antes de aplicarse, como cualquier cambio de base. Las listas exactas de requisitos y documentos por módulo las valida el titular; el agente no las inventa.

### Correcciones inmediatas (fallas encontradas)

COR-01 y COR-02 se encontraron el 17/10/2026; COR-03 a COR-09, el 18/10/2026 a partir de revisiones externas (Grok y ChatGPT) verificadas en el código de `main` y en capturas del panel actual; COR-10, el 18/10/2026, por la regla del titular sobre prospecto y cliente (RP-90 a RP-92).

| ID | Falla | Corrección | Aceptación |
|---|---|---|---|
| COR-01 | El nombre del propietario casi nunca llega al 07, 08 y 10: el llenado automático solo copia `propietario` si la relación es propietario o copropietario (`src/lib/formatos/intake-prefill.ts:21`) y el registro del prospecto la guarda como «por_aclarar» (`src/lib/intake/wizard.ts:48`). | Preguntar la relación con el inmueble en la cita (CAP-03) y, mientras tanto, copiar el nombre como propietario cuando la intención es vender u ofrecer en renta y la relación no se ha aclarado, marcado «por confirmar». | Prueba: un prospecto propietario nuevo llega con su nombre al 07, 08 y 10. |
| COR-02 | El tipo de inmueble se pierde al pasar al 07: la entrevista guarda «casa» y el 07 espera «Casa» (`src/lib/formatos/valor-fields.ts:17`). | Comparar sin distinguir mayúsculas al llenar, o unificar los valores. | Prueba: cada tipo de la entrevista llega al 07. |
| COR-03 | Hoy llama «Prospecto» a operaciones que ya avanzaron dentro de captación: la etapa fina (entrevista, levantamiento, lista de documentos) depende de datos que Hoy no carga. | Hoy calcula la etapa con la misma función y los mismos datos que la operación (`operation-view.ts`), o muestra la fase («Conocer») cuando no tenga el detalle. | Prueba: una operación con la 02 iniciada o terminada aparece en Hoy con la misma etapa que dentro de la operación. **Titular, 26/10/2026:** la etapa cambia cuando se empieza el siguiente documento, así que con la 02 terminada sigue «Entrevista inicial» (con el botón «Iniciar levantamiento») hasta que se empieza el 04. |
| COR-04 | La renta usa el camino de la venta: `isOwnerRoute` incluye «arrendador», así que la operación muestra las 10 etapas de venta mientras Hoy usa los nombres de renta, y el servidor le pide hasta publicación los requisitos de compraventa. Además los nombres de renta están corridos un lugar respecto a lo que cierra cada estado. El comentario del código aún habla de «6 etapas». | La renta del propietario tiene su propio recorrido y sus propios requisitos según MRP-01, con nombres alineados a lo que cierra cada estado; Hoy y la operación usan los mismos nombres. Corregir el comentario. Si cambian requisitos en el servidor, migración con respaldo y autorización. | Pruebas: una renta muestra el mismo nombre de etapa en Hoy y en la operación y no pide formatos de compraventa que MRP-01 no exija. **Hecha en la rama (29/10/2026):** la renta del propietario tiene diez etapas propias (Prospecto, Entrevista inicial, Levantamiento, Documentos básicos, Revisión de titularidad, Opinión de renta, Intermediación para renta, Publicación y seguimiento, Selección del arrendatario y Cierre y entrega, con sus pasos contrato, depósito y garantías; entrega con inventario; honorarios y seguimiento; archivo), con textos, requisitos y nombres de renta; Hoy, la operación y las listas dicen lo mismo. Para publicar pide entrevista, titularidad, opinión de renta, renta acordada, intermediación, levantamiento y publicación: ya no factibilidad ni plan; para cerrar ya no pide la revisión jurídica del cierre (06). El 06 y el 08 no se ofrecen en la renta; la revisión (05) y el 09 quedan opcionales mientras no exista la plantilla de intermediación para renta. La migración solo reescribe la función de requisitos para la ruta `arrendador`; las demás rutas quedan igual. |
| COR-05 | «Esperan algo de ti» ordena distinto en Hoy (`today.ts`) y en Operaciones (`operation-view.ts`), y el número del menú no coincide con las tarjetas. | Una sola función con el orden de RP-84 para las tres vistas. | Prueba: mismas operaciones, mismo orden y mismo número en Hoy, Operaciones y menú. |
| COR-06 | La lista de documentos pide siempre el recibo de agua de CESPT (también para un terreno) y no admite «No aplica»; varias condiciones dependen de claves que la entrevista sencilla ya no captura (`adquisicion`, `promesaPrevia`, `acuerdoOcupacion`, `cambioEstadoCivil`, `estadoCivilAdquisicion`), así que documentos como los de herencia o promesa previa casi nunca se piden (`src/lib/formatos/checklist-documentos.ts`). | Lista preliminar revisable: cada documento admite «No aplica» con motivo, se puede agregar otro, las condiciones usan solo datos que existen (entrevista necesaria o «Ampliar», RP-89) y lo que dependa de un dato no capturado aparece «por confirmar». El candado acepta «No aplica» justificado como completo. | Pruebas: un terreno no exige CESPT sin preguntar; un heredero o una promesa previa generan su documento; «No aplica» con motivo cierra el punto. **Hecha en la rama (29/10/2026):** cada renglón se recibe, no aplica con motivo (cuenta como completo en el candado y en el servidor) o, si depende de algo que la entrevista no pregunta (herencia, condominio, INDIVI, contratos o promesa, toma de agua de un terreno, hipoteca «no sabe»), queda «por confirmar» con su pregunta y se resuelve con «Sí aplica» o «No aplica» (motivo ya escrito). El organismo del agua sale del municipio del domicilio (CESPT, CESPE o CESPTE); un terreno pide deslinde catastral; local, oficina, nave y plaza piden uso de suelo y licencia. «Actualizar la lista» la rehace con la entrevista sin perder lo hecho. Si un documento ya está en «Documentos del cliente», el renglón ofrece «Marcar recibido» y queda ligado al archivo. El 05 recibe «No aplica» con su motivo, lo por confirmar como «Por determinar» y lo agregado en D22; el PDF y el Word de la lista muestran el motivo o la pregunta. **Queda fuera:** los grupos B a D de B-06 (documentos según la forma de pago del comprador) se agregarán cuando se conozca la oferta (14); siguen sin confirmar la constancia de no adeudo predial de Tijuana, el certificado de la Junta de Urbanización y la constancia de la CESPTE. |
| COR-07 | Las etiquetas sencillas dicen más que la regla: «Firma ante notario», «Pago completo antes de entregar», «Aviso de privacidad firmado» (`src/lib/admin/today.ts`). | Etiquetas de RP-86 en todas las pantallas y documentos. | Prueba de textos; ninguna etiqueta contradice su requisito. |
| COR-08 | El informe al propietario solo registra la fecha en que se preparó. | Agregar fecha, canal y responsable de entrega, capturados a mano (RP-88). | El aviso de informe vencido usa la entrega cuando existe. **Hecha en la rama (29/10/2026):** la tarjeta del informe muestra el último preparado y la última entrega, avisa si lo preparado no se ha entregado y registra cada entrega (fecha, canal —WhatsApp, correo, en persona, teléfono u otro— y quién lo entregó) en la guía de la operación (`entregasInforme`, hasta 120). «Hoy» y la tarjeta cuentan el mes desde la última entrega y, si no hay, desde el preparado. La migración solo agrega ese campo a los permitidos y valida su forma. |
| COR-09 | La etapa 10 «Cierre y entrega» oculta firma, entrega, postventa y archivo en un solo círculo. | Mostrar sus cuatro pasos dentro de la etapa, con el actual marcado. | Prueba: una operación en `entrega` dice «Cierre y entrega · entrega». **Hecha en la rama (29/10/2026):** la etapa 10 lleva el paso en su nombre y, en la línea de etapas y en «Ver etapas», lista firma y pago, entrega, postventa y archivo con el actual marcado; en renta usa los nombres de su ruta (se alinean con COR-04). |
| COR-10 | El sistema no sigue la regla de prospecto y cliente (RP-90 a RP-92): completar la entrevista convierte al contacto en cliente (registro del 13/10/2026); el botón «Convertir en cliente» lo hace a mano (`src/components/admin/convert-lead-button.tsx`); listas, agenda y búsqueda llaman «Cliente» a quien está en la tabla `clientes`; el requisito de intermediación se cumple con «revisado», sin registro de firma (`src/lib/formatos/operation-workflow.ts`); y quien ya tiene operación deja de aparecer en el seguimiento de prospectos aunque no haya firmado (`src/lib/admin/followups.ts` y `commercial-metrics.ts` excluyen a quien tiene `clienteId`). | Registrar en la operación la firma del contrato (tipo, fecha, firmantes y archivo; admite firmado fuera del panel). Calcular «Prospecto/Cliente» y «Captado» a partir de esa firma en Contactos, fichas, agenda, búsqueda, Hoy y Reportes. Cambiar «Convertir en cliente» por «Abrir operación», la etapa 1 por «Primer contacto» y el estado «evaluación» del inmueble por «En captación» (RP-97). Mostrar «Cliente anterior» al vencer o rescindirse el contrato y «Contraparte» al comprador o arrendatario que firma con el cliente (RP-93, RP-97). Pedir la firma registrada, además de revisada, para pasar de «Contrato y preparación» a «Publicación». Mantener en el seguimiento de prospectos a quien tiene operación sin contrato firmado. Se conservan las tablas `leads` y `clientes`, sus IDs y la conversión idempotente. Si cambia la validación del servidor: migración aditiva con respaldo, ensayo y autorización. | Pruebas: una entrevista completada deja a la persona como «Prospecto» con su operación; registrar la firma del 09 la muestra como «Cliente» y el inmueble como «Captado» en todas las vistas; sin firma registrada no se pasa a Publicación; un comprador queda como contraparte, no como cliente, al registrar la promesa o la compraventa firmada (RP-93); vencer o rescindir el contrato deja a la persona como «Cliente anterior» (RP-97); convertir dos veces sigue devolviendo el mismo registro. |
| COR-11 | «Quiere comprar» y «Quiere rentar» abren una operación con las rutas `compra` y `arrendatario` y su expediente, aunque Fortius solo representa al propietario (RP-93). | Al elegir esas intenciones, Nueva operación hace el perfilamiento (C-04 del cuestionario) y guarda un lead con próxima acción, sin abrir operación. El lead se liga a las operaciones de los propietarios por visitas y ofertas; al firmar la promesa, la compraventa o el arrendamiento queda como contraparte. Las operaciones de compra o búsqueda de renta que ya existan no se borran: se muestran como históricas y su contenido se conserva. Si cambia la validación del servidor: migración aditiva con respaldo, ensayo y autorización. | Pruebas: «Quiere comprar» crea un lead con su perfil y no una operación; una visita y una oferta del lead aparecen en la operación del propietario; una promesa firmada lo muestra como contraparte; las operaciones de compra existentes siguen abriéndose. **Hecha en la rama (29/10/2026):** «Quiere comprar» y «Quiere rentar» piden quién es y «¿Qué busca?» (tipo, uso, zonas, presupuesto o renta máxima, forma de pago y crédito, origen de ingresos, recámaras, plazo, notas, aviso de privacidad y próxima acción con fecha) y guardan o actualizan el prospecto, sin entrevista ni operación; ningún dato del perfil es obligatorio (RP-82). El servidor ya no empieza entrevistas de compra o renta ni crea operaciones con rutas `compra` o `arrendatario`, ni cambia una operación a ellas; las que existen se abren, se guardan y muestran «Operación histórica». En Ajustes, la contraparte es el interesado que firma (`contraparteLeadId`), que cuenta como contraparte identificada para avanzar; la tarjeta de visitas muestra el interesado de cada visita y la contraparte. Las entrevistas de compra a medias llevan a «Guardarlo como interesado». Falta: ligar las ofertas (14) al interesado y revisarlo el titular en el 3002. |
| COR-12 | El formato 09 pide el «Estado del registro PROFECO» y sus datos (`src/lib/formatos/intermediacion.ts`), y su bloqueo cuenta con ese registro. Fortius no tiene registro ante PROFECO y no lo tendrá en 2026 (titular, 17/10/2026). | Quitar del 09 la captura y la revisión del registro PROFECO y ajustar su texto. El PDF se libera a partir del modelo de contrato que enviará el titular (DOC-09); antes, el abogado de Fortius confirma si ese registro es obligatorio. | Prueba: el 09 ya no pide PROFECO; con el modelo del titular cargado, el PDF sale de esa plantilla. |
| COR-13 | Las operaciones nuevas empiezan en la etapa 5, «Dictamen jurídico»: al terminar el primer contacto, la base las pasa de `captacion` a `documentacion` (regla del 14/10/2026 en `fortius_inmuebles_save_intake`) y se saltan Prospecto, Entrevista inicial, Levantamiento y Checklist con su candado. La pantalla final de Nueva operación dice «etapa Prospecto». Encontrado el 26/10/2026 al revisar COR-03. | Migración `supabase/migrations/20261026120000_intake_starts_in_captacion.sql`: la operación nueva se queda en captación y el historial dice «Primer contacto completado; la operación sigue en captación». El requisito «Entrevista y objetivo del propietario» se sigue marcando revisado. No cambia datos existentes. **Aplicarla en la base remota requiere autorización del titular.** | Pruebas de base local: el primer contacto deja la operación en captación; los recorridos de venta, renta e inversión avanzan desde ahí una etapa a la vez. |

### Matriz de reglas por ruta y observación de uso (MRP, USO)

| ID | Alcance | Depende de | Aceptación |
|---|---|---|---|
| MRP-01 | **Matriz de reglas por ruta** (documento dentro de este plan, sin código): para venta, renta e inversión, más el seguimiento del lead comprador o arrendatario (RP-93), por etapa: actividad · evidencia · quién revisa · desde cuándo puede empezar · qué la termina · qué autoriza avanzar, publicar o formalizar · excepción admitida y con qué motivo · qué puede ir en paralelo y qué ciclos se admiten (RP-87) · qué contrato firmado convierte en cliente (RP-90). Parte de RP-90 a RP-98, de la tabla «Etapas por ruta» y de `requiredReviews`. | — | El titular la aprueba (DEC-26). Es la fuente de COR-04, de la lista de documentos de COR-06 y del contenido de MOT-01 (versión 1 del motor). |
| USO-01 | **Observar el panel actual** con el director y dos asesores resolviendo casos sintéticos sin ayuda (crear operación, avanzar una etapa, marcar revisado, encontrar qué falta), anotando dónde se detienen y si distinguen preparado, revisado y aprobado. | — | Hallazgos registrados aquí; ajustan la prioridad de SIM antes de implementarla. Sin datos reales. |

### A. Llamada, entrevista y cierre (CAP)

| # | Mejora | Cómo convive con el plan |
|---|---|---|
| F01 | **Primer contacto en una pantalla con botones:** nombre y teléfono escritos; qué quiere (vender, rentar su inmueble, busca comprar, busca rentar, invertir, aportar terreno, coinversión); tipo (casa, departamento, terreno, local, oficina, plaza o conjunto comercial, nave, bodega, edificio); zona; medio (llamada, WhatsApp, Facebook, referido). | Sustituye la pantalla de prospecto de FLUJO-01 conservando su lógica (borrador en Hoy, operación creada al terminar la entrevista). Las listas de qué quiere y tipos salen del motor de procesos (MOT-02); mientras no exista, quedan en código con los valores nuevos. Bodega y edificio usan el levantamiento industrial y el comercial, respectivamente, hasta que MOT-02 defina el suyo. |
| F02 | **Fecha y hora del contacto** con «ahora» puesto y editable. | Hoy se guarda la fecha de hoy sin mostrarla (`interview-step.tsx:26`). Alimenta «Primera atención» del diccionario. |
| F03 | **Enviar el aviso de privacidad con un toque** (WhatsApp o correo con texto corto y liga a la página de privacidad); queda «aviso enviado». | Plantilla de mensaje de RP-22 (CRM-02): se registra cuando el asesor confirma. «Aviso enviado» no es consentimiento (RP-81). El formato 01 personalizado se sigue preparando en la entrevista. |
| F04 | **Agendar la entrevista en la misma pantalla** y enviar la confirmación de la cita junto con el aviso en un solo mensaje. | Crea la cita con el panel de agendar (C25) y la tarea «Terminar la entrevista» de hoy, como ahora. |
| F06 | **Preguntas marcadas «en la llamada», «en la cita» u «en oficina».** | Es RP-78. Para crear la operación basta lo indispensable (nombre, un medio de contacto, qué quiere y tipo de inmueble); todo lo demás que falte pasa a «Datos por completar» y no detiene el avance (RP-82). |
| F07 | **No volver a preguntar lo de la llamada:** aparece ya puesto para confirmar. | Usa la ficha (FCH-01) cuando exista; antes, las respuestas del borrador. |
| — | **Entrevista con lo necesario y opción «Ampliar»** (RP-89; ver la lista abajo). | Parte de la entrevista sencilla del 17/10/2026 (`src/lib/formatos/entrevista.ts`). Cada respuesta necesaria alimenta la lista de documentos, el levantamiento o un módulo del proceso (MOT-02). Lo confidencial sigue RP-81. |
| F08 | **Cierre de la entrevista con tres acciones:** descargar la entrevista (PDF o Word), enviar la lista de documentos (WhatsApp o correo, con el correo o WhatsApp de recepción de Fortius) y agendar el levantamiento. | Envío por plantilla (RP-22). La lista sigue guardándose como tarea con un paso por documento (FLUJO-02). |
| F09 | **Modo cita:** botones y letra grandes, sin menú lateral, para celular o tableta frente al cliente. | Reutiliza el marco de pantalla completa del asistente de Nueva operación; compatible con la letra Grande (N09). |

**Preguntas de la entrevista con el propietario** (contenido base; el titular lo valida en DEC-22). «Necesario» es lo que el proceso usa; «Ampliar» es opcional y va plegado:

| Momento | Preguntas |
|---|---|
| Llamada | Nombre, teléfono, qué quiere, tipo de inmueble, zona, medio, fecha y hora. |
| Cita · necesario | Lo que ya pide la entrevista sencilla: quién es (nombre, relación con el inmueble, propietario si es otra persona, persona o empresa, fecha de nacimiento, teléfono, correo, estado civil, cómo contactarlo) · el inmueble (tipo, domicilio, quién lo ocupa, si tiene crédito) · por qué vende, para cuándo, cuánto quiere y cómo llegó al precio, qué espera · siguiente paso. **Se agrega solo lo que el proceso usa:** cuántos dueños y si alguno falleció (documentos de herencia) · si firma un apoderado (poder) · si el inmueble está a su nombre o en fideicomiso · si es condominio · formas de pago que acepta (contado, Infonavit, Fovissste, crédito bancario), porque activan módulos. |
| Cita · «Ampliar» (opcional) | Régimen y datos del matrimonio · cómo lo adquirió · compromisos previos (promesa, acuerdos de ocupación) · ampliaciones sin permiso · precio mínimo (confidencial) · condiciones de pago y entrega · si otra inmobiliaria lo trabaja, si se publicó antes y si daría exclusiva · quién enseña, llaves y horarios · si es su casa habitación, año y precio aproximado de compra · si deja muebles. |
| Oficina (de documentos) | RFC, CURP, domicilio fiscal · escritura, notario y fecha · folio real, partida y clave catastral · superficies según escritura · gravámenes según certificado de libertad · valor catastral. |
| Comprador, en corto | Presupuesto · forma de pago y precalificación (Infonavit o banco, monto) · zona · indispensables · plazo · quién decide · si necesita vender otro inmueble. |

| ID | Mejoras | Depende de | Aceptación |
|---|---|---|---|
| CAP-01 | F01, F02, F04 | SIM-01, SIM-09, COR-01 | Primer contacto completo en menos de un minuto en celular (prueba de uso, RP-47); fecha editable; cita creada sin salir de la pantalla. |
| CAP-02 | F03 | CRM-02 | Aviso enviado por WhatsApp o correo con liga; registro al confirmar; sin lenguaje de consentimiento. |
| CAP-03 | F06, F07 y entrevista necesaria con «Ampliar» (RP-89) | COR-01, COR-06, SEG-01 | Preguntas por momento; lo ya respondido se confirma; la parte necesaria cubre todo lo que usan la lista de documentos, el levantamiento y los módulos; «Ampliar» plegado y opcional; la operación se crea con el mínimo fijo y lo demás queda en «Datos por completar»; precio mínimo restringido por permiso. |
| CAP-04 | F08, F09 | CAP-03, CRM-02 | Cierre con descarga, envío de la lista y agenda del levantamiento; modo cita usable a 390 px con objetivos táctiles grandes. |

### B. Ficha única y documentos (FCH)

| # | Mejora | Cómo convive con el plan |
|---|---|---|
| F10 | **Ficha única de la operación** con cuatro bloques: Personas (propietario, cónyuge, representante), Inmueble (dirección, superficies, características, uso de suelo), Datos legales (escritura, notario, folio real, partida, clave catastral) y Condiciones (precio, honorarios, plazo). | Es RP-75. Se diseña junto con REL-01 (las personas se vinculan, no se copian) y es la base de CRM-03 y del motor (los campos por tipo de inmueble los agrega MOT-02). Con migración. |
| F11 | **Corregir un dato dentro de un documento** pregunta si se actualiza en la ficha y en qué documentos se usa. | Con control de versión y conflicto explicado (RP-17). |
| F12 | **Cada dato muestra su origen y estado** (confirmado, por confirmar, falta) con un ícono. | Íconos y formas de LV-02; sin texto extra. |
| F13 | **El PDF emitido no cambia solo;** si la ficha cambió, aviso y «Generar versión nueva». | Es RP-76; respeta la huella del PDF emitido y la invalidación de revisiones de DOC-01. |
| F14 | **Datos de Fortius una sola vez** en Configuración (razón social, RFC, domicilio, representante). | Llenan el 01, el 09 y los demás documentos; hoy se teclean en cada uno. |
| F15 | **Captura en oficina al lado del documento:** la escritura a un lado y «Datos legales» de la ficha al otro. | Vista lado a lado de DOC-10. La propuesta automática de datos llega con EXT-11, siempre con confirmación (RP-44). |
| F16 | **Descargar siempre, avisando qué falta** (con «Completar ahora» como opción, nunca como obligación). | Es RP-77 y RP-82. El 09 sigue bloqueado hasta DOC-09 y la promesa 15 conserva sus reglas legales y de congruencia. Los requisitos del proceso siguen igual; lo que deja de detener el avance son los campos vacíos. |
| F17 | **Fortius puede marcar un dato como indispensable** para un paso concreto. | En Configuración; por omisión, ninguno (RP-82). |
| F18 | **Expediente del propietario en un solo archivo:** portada, índice y los PDF emitidos en orden; también ZIP. | Usa `pdf-lib`, ya instalado; solo documentos de esa operación y con permiso; la descarga queda en el historial. |
| F19 | **Recibir el archivo en cada documento de la lista** (no solo la palomita). | Usa la carga de DOC-11; el propietario puede subirlo con la liga de DOC-12. Recibido es «Lo tengo», nunca revisado. |
| F20 | **Dictamen con biblioteca de párrafos** y resultado: Vendible, Vendible con condiciones o No vendible. | Completa DOC-06. El abogado elige y redacta; el sistema no dictamina (LEG-01, R-03). «No vendible» ofrece pausar o descartar con motivo. |
| F21 | **Copia firmada como último paso** de cada documento. | Ya existe la carga de copia firmada; se presenta como paso final con la insignia «Firmado» (V05). |
| F22 | **Membrete propio** (logo, pie, colores) cargable en Configuración. | Solo marca Fortius (RP-01); los colores del membrete no cambian la paleta del panel (RP-70). |
| F23 | **Plantillas Word propias con campos** (por ejemplo `{{propietario.nombre}}`) llenadas desde la ficha. | Después de FCH-01. Campos simples con `jszip`, ya instalado. Una plantilla propia del contrato puede ser la vía para liberar DOC-09 si el titular confirma que es el modelo registrado. |
| — | **Opinión de valor:** captura en el sistema, Excel como salida, archivo final adjunto y valor concluido en la ficha. | Es RP-80. Siguen pendientes el diseño del PDF del 07 y las fotos del Excel («Qué sigue»). |

| ID | Mejoras | Depende de | Aceptación |
|---|---|---|---|
| FCH-01 | F10, F12 | REL-01 (diseño conjunto); migración autorizada | Ficha con cuatro bloques por operación; operaciones existentes migradas sin perder datos; origen y estado por dato; respaldo y restauración ensayados. |
| FCH-02 | F11, F13 | FCH-01, DOC-01 | Los documentos leen de la ficha; corregir en un documento actualiza la ficha con confirmación; PDF emitido fijo con aviso de versión nueva. |
| FCH-03 | F14, F22 | — | Datos de Fortius y membrete en Configuración; todos los documentos los usan. |
| FCH-04 | F16, F17 y RP-82 | UX-05 | PDF y Word descargables con faltantes en todos los formatos; aviso de lo que falta; registro en historial; el 09 y las reglas legales y de congruencia de la 15 se conservan; un PDF con faltantes cuenta para los candados; «Datos por completar» separados de «Te falta» y avisados en «Para ti»; ningún campo vacío detiene el avance salvo los marcados como indispensables. |
| FCH-05 | F15 | FCH-01, DOC-10 | Documento y «Datos legales» lado a lado; guardar actualiza la ficha. |
| FCH-06 | F18 | — | Un PDF con portada, índice y emisiones en orden, y ZIP; solo con permiso. |
| FCH-07 | F19 | DOC-11, DOC-12 | Archivo por documento de la lista; el cliente puede subirlo con liga; queda «Lo tengo». |
| FCH-08 | F20 | DOC-06 | Biblioteca de párrafos editable; resultado explícito; PDF y Word. |
| FCH-09 | F21 | LV-02 | Copia firmada como paso final con insignia «Firmado». |
| FCH-10 | F23 | FCH-01 | Plantilla Word subida con campos que se llenan desde la ficha; campos desconocidos se avisan. |
| FCH-11 | Opinión de valor | FCH-01 | Excel final como adjunto; valor concluido en la ficha; 08 y contrato lo toman de ahí. |

### C. Motor de procesos por tipo de operación (MOT)

**Por qué:** no es lo mismo vender una casa que un terreno; vender con Infonavit que con crédito bancario o Fovissste; un local vacío que uno con inquilinos; una bodega para flipping que una ya rehabilitada; una nave que un parque industrial; un terreno en breña para lotificar que uno con memorias descriptivas. El titular quiere los procesos más comunes de fábrica y poder adaptarlos desde el sistema, sin pedir cambios de código. **Sustituye a F24 y F25** de la ronda de ideas.

**Diseño:** un proceso base por tipo de operación más módulos que se agregan solos según las respuestas de la entrevista. Así no se multiplican procesos casi iguales por cada combinación.

- **Procesos base de fábrica:** venta habitacional; venta de terreno; venta comercial (local u oficina); venta industrial (bodega o nave); renta habitacional; renta comercial o industrial; compra (representar al comprador); inversión o flipping; aportación de terreno o coinversión.
- **Módulos (se activan con una respuesta):** crédito Infonavit; crédito Fovissste; crédito bancario; hipoteca vigente por liberar; inmueble rentado (contratos, rentas, aviso y derechos del inquilino si aplican); condominio; parque industrial; copropiedad o herencia; régimen conyugal con firma del cónyuge; apoderado; propietario extranjero o fideicomiso; ejido; ampliaciones sin registrar; terreno en breña para lotificar (uso de suelo, factibilidades, topografía, deslinde; reducido si ya hay memorias descriptivas); inmueble para rehabilitar (enlaza la herramienta Rehabilitación).
- **El motor define:** etapas y pasos; requisitos y si bloquean el avance; el documento de cada paso; las preguntas de la entrevista; la lista de documentos por pedir (hoy fija D01–D22); los campos del levantamiento y de la ficha por tipo (hoy 04A–04G en código); y las listas de «qué quiere» y tipos de inmueble, que el titular edita sin programar (F05). También recibe la marca de «dato indispensable» de F17.
- **Editor (Administración → Procesos):** lista de etapas y pasos con nombre, una línea de «para qué», documento, requisitos, preguntas, ícono (catálogo de RP-71) y si bloquea; duplicar un proceso para crear una variante; módulos con «cuándo se activa» y «qué agrega»; **Probar** con respuestas de ejemplo sin tocar operaciones reales; **Publicar** crea una versión nueva; ordenar con botones Subir/Bajar accesibles (RP-63).
- **Protecciones:** los requisitos de protección (quién es dueño y quién firma, firma acreditada, pagos para entregar cumplidos según contrato; nombres de RP-86) solo se quitan con motivo registrado por un administrador; cada operación conserva su versión y el servidor (y PostgreSQL, como hoy) valida con ella; pasar una operación a una versión nueva es manual y muestra qué cambia.

**Cómo convive:** activa RP-04 para Fortius (RP-79); SAAS-03 sigue en pausa solo para adaptarlo por empresa. La presentación en 6 etapas de C12 se conserva: cada proceso define sus etapas y pasos. La ficha (FCH-01) es la base: MOT-02 le agrega los campos por tipo. Los candados actuales (FLUJO-04a, GUIA-01) se reproducen exactamente en la versión 1. R-10 aplica desde ahora a Fortius.

| ID | Alcance | Depende de | Aceptación |
|---|---|---|---|
| MOT-01 | Fase 1: las reglas aprobadas en MRP-01 pasan a datos (venta del propietario = «Venta habitacional, versión 1»; compra, renta e inversión igual), sin cambio visible. | FCH-01, FCH-04, MRP-01; migración autorizada | Las pruebas existentes de avance, candados y publicación pasan igual; las operaciones actuales conservan etapa y requisitos; respaldo y restauración ensayados. |
| MOT-02 | Fase 2: módulos activados por respuestas; entrevista, lista de documentos, campos de levantamiento y ficha, y listas de intenciones y tipos salen del motor. | MOT-01, CAP-03 | Una respuesta agrega su módulo; la lista de documentos y las preguntas cambian según el proceso; los D01–D22 actuales siguen disponibles. |
| MOT-03 | Fase 3: editor con duplicar, módulos, Probar, Publicar y versiones. | MOT-02, SEG-01 | Solo el administrador edita; Probar no escribe en operaciones; una operación en curso no cambia al publicar; requisitos protegidos con motivo. |
| MOT-04 | Fase 4: procesos base y módulos de fábrica con el contenido validado por el titular. | MOT-03, revisión del titular (y jurídica cuando aplique) | Los nueve procesos base y los módulos listados existen y pasan una operación sintética de punta a punta cada uno. |

## Herramientas para trabajo suelto (HER) — paquete listo para implementar, 17/10/2026

**Origen:** indicación del titular del 17/10/2026. Hay clientes que solo piden el machote del contrato para revisarlo, solo una opinión de valor con datos básicos o solo el cálculo del ISR. Para eso no se abre una operación: se va a Herramientas, se hace el documento o el cálculo y se descarga. También pidió quitar de Herramientas lo que no sirve. **Estado: pendiente; no hay código escrito.** El titular **confirmó el catálogo el 18/10/2026**, con el cambio de la ficha comercial.

### Catálogo recomendado

| Herramienta actual | Recomendación | Por qué |
|---|---|---|
| Documentos sin expediente | **Se queda y crece** como «Documentos sueltos» (HER-02). | Es la puerta del trabajo sin operación. |
| Opinión de valor (hoy dentro de Documentos sin expediente) | **Acceso directo propio** arriba del catálogo. | Es lo que más se pide suelto. |
| Neto del propietario | **Se une con el ISR nuevo** como «ISR y neto del vendedor» (HER-03). | Hoy pide los impuestos a mano y no calcula ISR. |
| Hipoteca | Se queda. | Atender compradores. |
| Comparables | Se queda. | Sustenta la opinión de valor. |
| Comparador de ofertas | Se queda. | Negociación. |
| Comisiones y reparto | Se queda. | Reparto con aliados y asesores. |
| Inversiones | Se queda. | Inversionistas. |
| Rehabilitación | Se queda. | Flipping (módulo del motor de procesos). |
| Unidades y monedas | Se queda. | En Tijuana se cotiza en USD y pies cuadrados. |
| Ficha comercial | **Sale del catálogo** (decisión del titular, 18/10/2026). En Inmuebles, el menú «⋯» de cada inmueble suma «Descargar ficha técnica» (el mismo PDF que ya ofrece su página pública) y «Compartir liga o QR». | La página pública de cada inmueble ya descarga la ficha técnica en PDF; tenerla dos veces sobra. |
| Enlaces y QR | **Sale del catálogo**; su función pasa a «Compartir liga o QR» en el menú del inmueble. | Compartir es parte del inmueble. |
| Fotografías | Se queda. | Preparar fotos para publicar. |
| Cotizador de servicios | Se queda. | Propuesta de honorarios antes de abrir una operación. |
| Plantillas y PDF | **Se queda solo como «Unir y separar PDF»**; los formatos pasan a Documentos sueltos. | Evita dos lugares para los formatos. |
| Informe al propietario | **Sale del catálogo**; sigue dentro de la operación (etapa Publicación y seguimiento). | Siempre es de una operación. |
| Pendientes documentales | **Sale del catálogo**; se convierte en el tablero de vencimientos (DOC-13) y la cola de revisión (NAV-08). | Es una vista de trabajo, no una herramienta. |
| Comparador de versiones | **Sale.** | Uso muy raro; el Word ya compara versiones. |

Queda en tres grupos (C28): **Documentos** (Documentos sueltos con sus accesos directos, Unir y separar PDF) · **Calcular** (ISR y neto del vendedor, Hipoteca, Comparables, Comparador de ofertas, Comisiones, Inversiones, Rehabilitación, Unidades y monedas) · **Presentar** (Fotografías, Cotizador). Arriba, tres accesos directos: **Machotes en blanco**, **Opinión de valor** e **ISR y neto**.

| ID | Alcance | Depende de | Aceptación |
|---|---|---|---|
| HER-01 | Catálogo depurado y agrupado según la tabla, con los tres accesos directos, y en Inmuebles «Descargar ficha técnica» y «Compartir liga o QR». Lo retirado deja de mostrarse; sus datos guardados se conservan y se pueden consultar. | SIM-10 | Catálogo de la tabla; ninguna herramienta retirada pierde trabajos guardados; las que pasan a la operación siguen ahí. |
| HER-02 | Documentos sueltos: **machote en blanco** de cualquier formato con el membrete de Fortius (PDF o Word) y **llenar y descargar** cualquier formato sin operación, con los datos que dé el cliente. El contrato 09 sale en Word mientras siga pendiente DOC-09. | FCH-03, FCH-04 | Cada formato se descarga en blanco y lleno; nada se bloquea por datos faltantes (RP-77); no se crea operación ni prospecto. |
| HER-03 | ISR y neto del vendedor: cálculo de ISR por enajenación (con exención de casa habitación cuando aplique), costos de cierre y neto, con fuente y vigencia de cada regla; descarga en PDF. **Pedido del titular (17/10/2026):** sirve para contestar al propietario, incluso antes de firmar, cuánto le queda neto al precio sugerido. Entrega dos PDF para el propietario: la estimación del neto (precio menos comisión, impuestos que apliquen, como el IVA en comerciales, certificados y otros gastos) y la hoja de cálculo del ISR. Disponible desde la operación, entre las herramientas de la etapa, y suelta en Herramientas; no es un paso obligatorio de la captación. Parte de la plantilla «netos del propietario» del titular (G-07). **Validación:** el agente investiga la legislación vigente y programa las reglas con su fuente y vigencia; el titular compara los resultados con Nuvigant en varios casos antes de usarlo con clientes (sin revisión del contador). Rotulado «Estimación» hasta esa comparación. **Pendiente del titular al programarla:** entregar 3 o 4 casos ya calculados en Nuvigant (por ejemplo, casa habitación exenta, casa no exenta y local comercial) para compararlos cifra por cifra. **Mientras tanto:** enlace directo a Nuvigant en Herramientas (H-06). | FIS-01, revisión fiscal | Sin regla vigente el resultado dice «pendiente» (RP-06); casos de prueba cotejados por una vía independiente; reemplaza a «Neto del propietario» sin perder sus trabajos guardados. |
| HER-04 | **Pasar a una operación:** un documento o cálculo suelto se convierte en operación cuando el cliente contrata, y sus datos llenan la ficha sin volver a escribirlos. | FCH-01 | El documento suelto queda dentro de la operación nueva; los datos aparecen en la ficha marcados con su origen. |

## Seguimiento del inmueble y avisos (SIA) — construido en local, 29/10/2026

**Origen:** revisión de lo que le falta al panel (29/10/2026). Casi todo lo pendiente ya tenía entrega en este plan; estas seis funciones no aparecían en ninguna y el titular pidió aplicarlas. **Estado:** construidas y probadas; se integran en `main` con el PR de la rama `feat/sitio-pildora-sobria`, autorizado por el titular el 29/10/2026. **Sin migración:** los campos nuevos viven en registros que ya admiten campos opcionales (inmuebles y prospectos) y la proyección pública es una lista cerrada (SQL y `projectPublic`), así que el sitio no recibe ninguno.

| ID | Qué hace | Dónde | Reglas y límites |
|---|---|---|---|
| SIA-01 | **Contrato de servicio por vencer.** Hoy avisa 30 días antes del fin del contrato de intermediación (09) y sigue avisando ya vencido: «Renuévalo o retira la publicación». | Hoy, sección «Contratos y licencias por vencer»; consulta `GET /api/admin/vencimientos`. | Solo el 09 más reciente de cada operación con su versión actual emitida, en operaciones activas de `documentacion` a `cierre`. La consulta devuelve solo fechas, nunca el cuerpo del documento; conserva la RLS del usuario. Emitido no equivale a firmado: cuando exista la firma registrada (COR-10), el aviso debe usarla. |
| SIA-02 | **Licencia estatal por vencer.** Avisa 60 días antes de la vigencia de la licencia capturada en el 09. | Hoy, misma sección. | Una sola vez por número de licencia. La licencia se toma del 09; no hay todavía un registro de licencias por asesor. |
| SIA-03 | **Prospectos por canal.** Campo «Cómo llegó» (sitio web, WhatsApp, llamada, portal, referido, letrero o lona, redes, visita a la oficina, otro) y tabla de recibidos, atendidos y descartados por canal en el periodo. | Captura y ficha del prospecto; Reportes, «Resultados por periodo». | Si falta el canal, los formularios del sitio cuentan como «Sitio web» y la captura manual como «Sin dato». No mide ventas ni conversión a cliente (RP-90). |
| SIA-04 | **Control de llaves.** Dónde se guardan, copias, préstamos con quién, para qué y cuándo regresan; regreso registrado; historial. | Inmueble → «Llaves y compradores» (`/admin/propiedades/[slug]/seguimiento`); Hoy, «Llaves sin regresar»; aviso en la tarjeta del inventario. | Sin fecha prevista, las llaves deben volver el mismo día. Campo privado `llaves` del inmueble. |
| SIA-05 | **Preparación para promover.** Fotos, video, recorrido 360, plano, letrero y texto del anuncio con estado (pendiente, agendado, listo, no aplica), fecha y responsable. | Misma pantalla; avance en la tarjeta del inventario. | El material ya cargado en la ficha (fotos, video, 360) cuenta como listo si no se capturó otra cosa. Campo privado `preparacion`. |
| SIA-06 | **Avisos a compradores.** Propone prospectos y clientes que buscan comprar o rentar ese tipo, en esa zona o con ese presupuesto, con sus razones; abre WhatsApp con el mensaje y registra el aviso solo cuando el asesor lo confirma. Si el precio baja después del aviso, la persona vuelve a quedar por avisar. | Misma pantalla; Hoy, «Compradores por avisar»; fichas del prospecto y del cliente, «Inmuebles que le pueden servir». | Solo inmuebles publicados y disponibles (RP-91). Un criterio capturado que no se cumple descarta; presupuesto hasta 5 % arriba; monedas distintas no se comparan. Abrir WhatsApp no registra nada. Campo privado `avisosCompradores` con el precio al avisar. Es una primera pieza de EXT-01, sin reglas configurables. |

**Comprobación (29/10/2026):** lint y tipos de los archivos tocados; `npm run test:admin` (368) y `npm run test:backend` (763) completos, más las pruebas nuevas `tests/admin/property-followup.test.tsx` y `tests/backend/property-followup.test.ts`. En localhost contra la base de prueba: préstamo de llaves, aviso a un comprador de ejemplo, secciones nuevas de Hoy, tabla por canal y campo «Cómo llegó»; la ficha pública no contiene los campos privados. Los datos de ensayo se retiraron al terminar. Sin `npm run verify`, build ni suites de navegador.

**Pendientes:** el tablero «Hoy» de LV-07 debe conservar las tres secciones nuevas (contratos y licencias, llaves, compradores por avisar); los avisos de SIA-01 usarán la firma registrada cuando exista COR-10; las reglas de coincidencia se volverán configurables con EXT-01.

## Rediseño guiado del panel (Fase C) — encargo y avance

**Encargo vigente:** `docs/diseno/ENCARGO_REDISENO_PANEL.md`. La referencia visual es el lienzo aprobado en `docs/diseno/lienzo-panel/`. El titular decidió el 16/10/2026 construirlo con el agente de desarrollo en esta misma línea de trabajo, en la rama `feat/panel-guiado`, a partir de `chore/limpieza-codigo`. También pidió ver con anticipación las tareas y los vencimientos próximos («Próximos 7 días» en Hoy). Las notificaciones fuera del panel quedan como fase posterior.

**Fase 1 · Base visual — 16/10/2026 (local, sin push):**
- Los tokens del lienzo coinciden con los existentes del panel, en claro y oscuro. Se agregan `--primary-edge`, `--primary-hover` y `--scrim`.
- El contenedor del panel lleva la clase global estable `admin-root`.
- Componentes nuevos en `src/components/admin/kit.tsx` con `kit.module.css`:
  - botones (principal, secundario, discreto, enlace, peligro y solo ícono);
  - estados de requisito con nombres sencillos;
  - avance de etapas (línea completa y «Etapa N de 6» con barra);
  - pestañas con flechas del teclado;
  - selector segmentado, tarjeta, aviso, vacío y panel lateral o inferior (cierra con Escape y con el velo).
- Muestra interna en `/admin/sistema` (solo administrador, fuera del menú y sin datos), comparada con `Componentes.dc.html` a 1440 px en claro y oscuro y a 375 px en celular, sin desbordamiento.
- Pruebas: 7 nuevas del kit; lint, tipos, 335 del panel, 701 de servidor y compilación aprobados.
- Las pantallas existentes no cambian todavía. `panel.module.css` se retira conforme migren las pantallas (meta: menos de 15 KB).
- **Ajuste de estilo, 16/10/2026, a pedido del titular:**
  - esquinas redondeadas: 10 px en controles, 14 px en tarjetas y pastillas en los estados;
  - fondo gris azulado de lienzo, con tarjetas blancas de borde y sombra suaves, y botones secundarios más visibles.
  - Se aplica solo al panel guiado (componente `Surface` y `kit.tsx`). El lienzo de diseño se actualizó a su versión 38. Revisado en `/admin/sistema` a 1440 px en claro y oscuro y a 375 px, sin desbordamiento.

**Fase 2 · Estructura y navegación — 16/10/2026 (en la rama `feat/panel-guiado`, commit `d644da0`; sin PR ni publicación):**
- **Barra lateral nueva** (`workspace/guided-nav.tsx`):
  - botón «Nueva operación» arriba;
  - cinco secciones: Hoy, Operaciones, Contactos, Inmuebles y Agenda;
  - Herramientas en un segundo nivel;
  - Administración plegada y solo para el administrador: Equipo, Sitio web, Reportes, Historial y Configuración;
  - el contador de Hoy (tareas de hoy o vencidas y contactos por atender) sustituye a la campana.
- **En celular:** barra inferior con Hoy, Operaciones, «+», Contactos y Menú. El menú reúne Inmuebles, Agenda, Herramientas, Administración, perfil y salida. El contenido y las barras pegadas abajo («Guardar guía», «Avanzar», entrevista y ficha de inmueble) reservan la altura de esa barra para que no queden tapados.
- **Secciones nuevas con pestañas en la dirección (`?tab=`):** Contactos (Prospectos y Clientes) y Agenda (Agenda y Tareas). `/admin/expedientes` pasa a `/admin/operaciones` y Aplicaciones pasa a Herramientas.
- **Las direcciones anteriores redirigen** sin perder la consulta: leads, clientes, calendario, tareas, expedientes y apps. Las fichas de detalle (`leads/[id]`, `clientes/[id]`, `tareas/[id]`, `apps/[slug]`) no cambian.
- **Se retiraron** «Más», «Organizar menú» (arrastrar), la ventana de aplicaciones, el menú de perfil y la barra vieja (`navigation`, `sidebar`, `app-launcher`, `profile-menu`), y sus estilos en `panel.module.css` (de 46.2 KB a 35.7 KB).
- **Pendiente para fases siguientes:**
  - las páginas `/admin/proceso/[etapa]` siguen activas fuera del menú y pasan a pestañas de Operaciones en la Fase 4;
  - los asesores ya no ven Blog, Contenido ni Archivos en el menú, porque Administración es solo para el administrador.
- **Pruebas:** lint, tipos, 330 del panel, 702 de servidor y compilación aprobados. Con el servidor sin base de datos pasan las 42 de navegador del panel que corre CI y las 70 públicas (1 omitida).
- **Revisión contra el encargo, 16/10/2026 (en la nube, sin base de datos):**
  - Se repitieron `npm run verify` (702 de servidor, 330 del panel y compilación), las 35 de herramientas, el paquete de PDF, las 70 públicas (1 omitida) y las 42 de navegador del panel que corre CI.
  - La prueba de la barra inferior en celular fallaba siempre: medía a mitad del desplazamiento suave de la página. Ahora se desplaza al instante antes de medir. El diseño no cambió: el contenido termina 25 px por encima de la barra.
  - Sin desbordamiento horizontal a 320, 390, 768 y 1440 px, en claro y oscuro: Hoy, Operaciones, Contactos (dos pestañas), Agenda (dos pestañas), Inmuebles, Herramientas y el menú del celular.
  - La barra lateral coincide con el artboard `Sidebar`.
  - **Ajustes decididos por el titular el 16/10/2026** (dejó dos a criterio del agente):
    - **Documentos pasa a ser una pestaña de Herramientas** (`/admin/herramientas?tab=documentos`). Conserva el buscador por folio y formato de todas las operaciones. Se retiró la página puente `/admin/documentos`, que ahora redirige a esa pestaña, junto con su componente `ModuleLink` y sus estilos. «Notas del equipo» sigue enlazada desde Herramientas.
    - **El menú del celular sigue el artboard `MenuMovil`:**
      - arriba, el nombre y el rol en lugar del correo;
      - Inmuebles y Agenda con flecha; Agenda indica las visitas de hoy cuando las hay;
      - Herramientas aparece como «Ver las 16 herramientas», con su explicación;
      - Administración va plegada con la marca «Solo admin» y se abre sola si estás en una de sus páginas;
      - «Salir» pasa a «Cerrar sesión», también en la barra lateral.
      - Se conservan «Mi perfil» y «Ver sitio», porque en el celular no tienen otro acceso.
    - **Administración sigue siendo solo para el administrador.** El titular confirmó que los asesores no necesitan Blog, Contenido ni Archivos en el menú.

**Fase 3 · Hoy — 16/10/2026 (en la rama `feat/panel-guiado`; sin PR ni publicación):**
- **Pantalla nueva** (`workspace/hoy.tsx`, artboards `Main` y `HoyMovil`). Arriba, la fecha, el saludo según la hora y un resumen en una línea. Después:
  - **Esperan algo de ti:** una tarjeta por operación con su motivo más urgente y un solo botón «Continuar». El orden de prioridad es:
    1. requisito con un problema;
    2. tarea vencida;
    3. documento recibido por revisar;
    4. oferta registrada en los últimos 3 días;
    5. operación sin próxima tarea con fecha.
    - Al final van los contactos a los que toca dar seguimiento, que antes estaban en «Prioridades de hoy».
    - Las operaciones archivadas, descartadas o en pausa no aparecen.
  - **Entrevistas por terminar:** cada una dice qué quiere el cliente y cuántas secciones con preguntas obligatorias le faltan, con el botón «Seguir la entrevista».
  - **Tareas de hoy:** las que vencen hoy o antes y las que se terminaron hoy. Se marcan en la misma pantalla y avisan «Guardado» o «No se pudo guardar: <motivo>».
  - **Agenda de hoy:** todas las citas del día, con las visitas destacadas en guinda.
  - **Próximos 7 días:** tareas con fecha en la semana, documentos revisados que dejan de estar vigentes e informes mensuales que se cumplen.
  - **Informes al propietario vencidos,** incluidas las operaciones que nunca han tenido informe, con «Preparar informe».
- **Lógica aparte y probada** en `src/lib/admin/today.ts`. Ahí también quedan los nombres sencillos de los requisitos, que la Fase 4 reutiliza.
- **Lo que salió de Hoy:**
  - los indicadores (inmuebles disponibles, prospectos nuevos y eventos próximos), el selector de inmuebles Demo y el tablero «Proceso de venta». El tablero regresa en Operaciones (Fase 4), y el conteo con o sin Demo sigue en Reportes;
  - la lista «Sin próximo contacto». La Fase 6 muestra en Contactos el siguiente paso con fecha de cada persona;
  - «Preparar tu espacio», que pasa a Configuración.
  - Se retiraron `today.tsx`, `attention-queue.tsx` y sus estilos: `panel.module.css` baja de 35.1 KB a 25.0 KB.
- **Corrección:** el lienzo de `/admin/sistema` se salía 4 px de la pantalla en computadora; ahora usa los mismos márgenes que Hoy.
- **Límites:**
  - Las ofertas «nuevas» se toman de las 20 consultas más recientes del comparador de ofertas.
  - Hoy muestra todo lo que el servidor permite ver a cada usuario, sin filtro «Mías».
  - El contador de «Hoy» en el menú cuenta las tareas vencidas o de hoy y los contactos por atender, así que no siempre coincide con el número de «Esperan algo de ti».
  - «Continuar» abre la operación en `/admin/operaciones?expediente=…` hasta que exista la operación guiada (Fase 4).
- **Pruebas actualizadas, sin borrar ninguna:**
  - las que revisaban la pantalla anterior ahora cubren lo mismo en la nueva;
  - la prueba de inmuebles Demo pasa a Reportes;
  - la prueba de la pantalla de error usa Contactos, porque Hoy ya no se rompe con un prospecto mal formado.
  - Se agregaron 7 pruebas de la lógica de Hoy y de marcar tareas, y 1 de navegador.
- **Resultados:**
  - lint, tipos y compilación aprobados; 702 pruebas de servidor, 337 del panel y 35 de herramientas, además del paquete de PDF;
  - 44 de navegador del panel que corre CI, contra un servidor sin base de datos;
  - 70 públicas (1 omitida).
  - Sin desbordamiento horizontal a 320, 390, 768 y 1440 px, en claro y oscuro.

**Fase 4 · Operaciones y operación guiada — 16/10/2026 (en la rama `feat/panel-guiado`; sin PR ni publicación):**
- **Tablero** (`/admin/operaciones`, artboards `OperacionesEscritorio` y `OperacionesMovil`):
  - seis columnas desde 1024 px, que se desplazan de lado si no caben; en celular, pestañas por etapa con su descripción;
  - cada tarjeta muestra cliente, inmueble, «Sigue» (la próxima tarea) y su fecha; lo vencido va en guinda y lo dice con palabras;
  - buscador sin acentos por cliente, folio o inmueble;
  - «Mías / Todo el equipo» para el administrador que también es asesor;
  - las operaciones archivadas quedan plegadas al final de «Cierre y entrega»;
  - abajo están «Alta directa, sin entrevista» (protege la captura al salir) y «Ver operaciones eliminadas», donde se restauran con confirmación;
  - `?etapa=<slug>` abre esa etapa.
- **Operación guiada** (`/admin/operaciones/[id]`, artboards `OperacionEscritorio*` y `OperacionMovil*`):
  - **Encabezado:** regreso a Operaciones, cliente, folio, inmueble, precio («Precio que espera» según la entrevista o «Precio de salida» según la ficha) y responsable.
  - **Avance:** 6 etapas para el propietario; compra, renta e inversión muestran sus propios pasos. Por debajo de 1024 px se ve «Etapa N de M» con barra.
  - **Pestañas:** Lo que sigue · Documentos · Tareas · Historial · Ajustes. Cambiar de pestaña con cambios sin guardar pide confirmación, y salir de la operación también.
  - **Lo que sigue:** qué hacemos y para qué, y los requisitos de la etapa con su estado (Pendiente · Lo tengo · Revisado · Hay un problema · No aplica). «No aplica» solo aparece donde se admite. Cada cambio se guarda al momento con control de versión.
    - Los requisitos de etapas anteriores que siguen abiertos aparecen al final.
    - El contrato espera a que termine la verificación.
  - **«Marcar como revisado»** (panel lateral en computadora, inferior en celular) pide:
    - el documento que lo respalda: uno de la operación, la entrevista terminada o un documento fuera del sistema con su folio o ubicación;
    - quién lo revisó y la fecha;
    - la vigencia, cuando aplica;
    - qué encontró.
    - En «Más detalles» se puede elegir el PDF generado o un archivo del documento, y escribir límites o condiciones.
  - **«Hay un problema»** guarda título y explicación en el soporte y muestra el aviso con la fecha. «Ya se resolvió» lo regresa a «Lo tengo» y deja constancia.
  - **Próxima tarea:** con «Cambiar fecha», o para agendarla si no hay.
  - **Barra fija «Te falta»:** enlaza cada pendiente a su requisito, a Ajustes o a la próxima tarea, con el motivo. «Pasar a: <siguiente>» se deshabilita mientras falte algo. El servidor vuelve a comprobar todo al avanzar.
  - **Columna lateral:** las herramientas de la etapa con la operación ya elegida, el propietario o cliente (Llamar y WhatsApp) y «¿Qué significa?».
  - **Lo que se conserva:** el informe mensual, las visitas y ofertas del inmueble, la comparación entre lo declarado y la ficha, y el acceso a la entrevista.
  - **Ajustes:** decisión del encargo, ruta y situación, inmueble, fecha objetivo, contraparte (solo la de la ruta opuesta), corregir etapa con motivo y eliminar. El texto dice la verdad: la operación eliminada se puede restaurar.
  - **Documentos:** crear borrador, capturar, generar PDF, copia firmada y fotografías, con la misma lógica de antes. Se aplicó el glosario: «Generar PDF», «PDF generados», «Versión N».
  - **Historial:** cambios y notas del equipo.
  - Las operaciones de administración u «otra» conservan su seguimiento simple.
- **Rutas:**
  - `/admin/operaciones?expediente=<id>` redirige a `/admin/operaciones/<id>`;
  - `/admin/proceso/<etapa>` (y sus direcciones anteriores) a `/admin/operaciones?etapa=<etapa>`;
  - los enlaces internos (Hoy, búsqueda, agenda, tareas, entrevistas, documentos, publicación y herramientas) ya apuntan a la dirección nueva.
- **Código:**
  - `expedientes/page.tsx` (362 líneas) y `operation-workflow-panel.tsx` (39 KB) se dividieron en `src/components/admin/operation/`: tablero, alta directa, pantalla, requisitos, lo que sigue, documentos, historial y ajustes;
  - la lógica quedó en `src/lib/admin/operation-view.ts`.
  - Se retiraron las páginas de proceso, `process-stage`, `module-catalog`, `expediente-client-list`, `operation-brief` y `dossier-tabs`.
- **Pruebas:**
  - las de la pantalla anterior se reescribieron sobre la nueva, cubriendo lo mismo: guardar sin perder captura, aperturas lentas, eliminar y restaurar, salir con cambios, aviso de privacidad, folio automático, contraparte por ruta, informe vencido y páginas de la consulta;
  - se retiraron dos pruebas de componentes que ya no existen (pestañas del expediente y guía anterior); su comportamiento queda cubierto por 7 pruebas de lógica y 16 de pantalla nuevas.
  - En navegador, las de CI de tablero, eliminación y rutas se adaptaron a la nueva pantalla.
- **Resultados:**
  - lint, tipos y compilación aprobados; 702 pruebas de servidor, 334 del panel y 35 de herramientas, además del paquete de PDF;
  - 44 de navegador del panel que corre CI, contra un servidor sin base de datos;
  - 70 públicas (1 omitida).
  - Sin desbordamiento horizontal a 320, 390, 768 y 1440 px, en claro y oscuro: tablero, cada pestaña de la operación, el panel «Marcar como revisado» y las eliminadas.
- **Límites y decisiones por confirmar:**
  - las rutas de compra, renta e inversión muestran sus propios 7 pasos, no las 6 etapas del propietario;
  - **Corrección a pedido del titular:** en «Verificación y precio» el botón «Pasar a» se quedaba apagado para siempre, porque «Contrato y preparación» se abre sola al completar la verificación y registrar la decisión. Ahora esa etapa no muestra el botón: explica que el contrato se abre solo y avisa cuando ocurre, ya sea desde los requisitos o desde Ajustes;
  - «Ya se resolvió» deja el requisito en «Lo tengo» para que se revise de nuevo;
  - los títulos de los formatos conservan su nombre de archivo, sin acentos (repaso del glosario en la Fase 7).

**Fase 5 · Nueva operación en cuatro pasos — 16/10/2026 (en la rama `feat/panel-guiado`; sin PR ni publicación):**
- **Asistente** (`/admin/operaciones/nueva`, artboards `NuevaEscritorio*` y `NuevaMovil*`): une crear la operación con la entrevista en cuatro pasos: Qué quiere hacer · Quién es · Entrevista · Listo.
  - Ocupa toda la pantalla, como el lienzo: arriba «× Nueva operación», «Paso N de 4» y la barra de avance; abajo un pie fijo con Atrás, «Guardar y seguir después» (solo en la entrevista) y Continuar. Sin menú lateral, migas ni barra inferior; la × regresa a Hoy y pide confirmación si hay cambios sin guardar.
  - **Paso 1:** cinco opciones grandes: Vender su inmueble, Ofrecer su inmueble en renta, Comprar, Rentar e Invertir. Muestra las entrevistas por terminar.
  - **Paso 2:** nombre, teléfono y correo (si lo tiene). Conserva lo de antes:
    - el aviso «Ya tenemos a alguien con ese teléfono/correo» con «Sí, es la misma persona» o «No, es otra persona»;
    - elegir a alguien ya registrado de la lista, o llegar con él desde su ficha;
    - el asesor responsable (solo el administrador lo elige) y «¿Cómo llegó?»;
    - la siguiente acción queda plegada y por omisión es «Terminar la entrevista» con fecha de hoy, para que la entrevista guardada aparezca en Hoy;
    - un envío a la vez y, si se pierde la respuesta, «Reintentar con los mismos datos» sin duplicar.
  - **Paso 3:** la entrevista en pantallas cortas, una a la vez, con su lista de partes arriba:
    - propietario: El propietario · El inmueble · Lo que quiere · Documentos y lo que sigue;
    - compra, renta e inversión: Qué busca · Lo que necesita · Presupuesto (o Capital) y acuerdos · Lo que sigue.
    - Las respuestas con opciones son botones; los textos llevan «No sabe». «Continuar» revisa la pantalla, dice «Te falta: …» y guarda el borrador. «Terminar entrevista» la completa y entonces se crea la operación (el servidor vuelve a revisar todo).
  - **Paso 4:** «Listo, la operación está creada» con folio, cliente, qué quiere, inmueble y lo que sigue; «Abrir la operación», «Volver a Hoy», las respuestas en modo lectura y «Corregir la entrevista».
- **«No sabe»:** usa la opción por aclarar o por definir cuando la pregunta la tiene. No se ofrece en fechas, cifras, el tipo de inmueble del propietario, el aviso de privacidad ni la siguiente acción, porque son datos que la operación necesita.
- **Rutas:** `/admin/entrevistas/<id>` redirige a `/admin/operaciones/nueva?entrevista=<id>`, que retoma el borrador en su pantalla pendiente o muestra la entrevista terminada. Hoy y la operación ya enlazan a la dirección nueva. La corrección de una entrevista terminada usa el mismo asistente.
- **Código:** `src/lib/intake/wizard.ts` (pantallas, «No sabe» y textos) y `src/components/admin/intake/` (asistente, entrevista y paso final). Las migas de Operaciones se retiraron porque ya no se usaban.
- **Pruebas:**
  - 7 de pantalla y lógica nuevas;
  - una de navegador nueva en CI (`nueva-operacion.spec.ts`) que recorre los cuatro pasos a 320, 390, 768 y 1440 px, en claro y oscuro, sin escribir en la base, con revisión de accesibilidad a 1440 px;
  - las de navegador de captación y del tablero se adaptaron a los textos nuevos.
- **Resultados:**
  - lint, tipos y compilación aprobados; 702 pruebas de servidor, 337 del panel y 35 de herramientas, además del paquete de PDF;
  - 48 de navegador del panel que corre CI (4 nuevas del asistente), contra un servidor sin base de datos.
  - Sin desbordamiento horizontal a 320, 390, 768 y 1440 px, en claro y oscuro, en los cuatro pasos; sin fallas de accesibilidad (WCAG 2.1 AA) a 1440 px.
- **Límites y decisiones:**
  - «Alta directa, sin entrevista» sigue en el tablero de Operaciones, como en la Fase 4;
  - la siguiente acción mientras se termina la entrevista va plegada con su valor por omisión; se puede cambiar antes de continuar.
  - las pruebas públicas de esta fase (70, 1 omitida) se volvieron a correr solas y pasaron; el primer intento chocó con otra corrida en el mismo puerto.

**Fase 6 · Contactos, Inmuebles, Agenda, Herramientas y Administración — 16/10/2026 (en la rama `feat/panel-guiado`; sin PR ni publicación):**
- **Contactos** (`/admin/contactos`, artboards `ContactosEscritorio` y `ContactosMovil`):
  - pestañas Prospectos y Clientes con su número (`?tab=clientes`); tabla en computadora (Persona, Lo que busca, Zona y presupuesto, Siguiente paso) y lista en celular;
  - «Lo que busca» y el presupuesto salen del perfil (o del tipo de cliente); el siguiente paso es lo más próximo entre sus tareas abiertas, sus citas y el próximo contacto, con «Hoy», «Vencido» o el día;
  - búsqueda sin acentos por nombre, teléfono, correo o zona; filtro por estado del prospecto, incluido «Ya son clientes»; aviso de posibles repetidos;
  - «Agregar contacto» abre la captura del prospecto (o del cliente en su pestaña) y conserva lo escrito al cerrarla, como antes.
  - El estado del prospecto, «Convertir en cliente» y «Eliminar cliente» pasan a la ficha de cada persona (la lista ya no los tiene). Se retiraron la vista «Por etapas» de prospectos y su resumen lateral.
- **Inmuebles** (`/admin/propiedades`, artboards `InmueblesEscritorio` e `InmueblesMovil`): «N inmuebles · N publicados», Todos / En venta / En renta, búsqueda y «Agregar inmueble»; cada inmueble con foto, operación, estado, zona, medidas, precio y código. Estado, destacada, ver en el sitio, editar y eliminar están en «Opciones»; asesor, publicación, estado y vistas guardadas, en «Más filtros». Se conservan la paginación de 24 y el aviso de código repetido.
- **Agenda** (`/admin/agenda`, artboards `AgendaEscritorio` y `AgendaMovil`):
  - semana por horas en computadora (de 8:00 a 19:00, o más si algún evento lo necesita) y tira de días con la lista del día en celular; las visitas van en guinda;
  - las citas sin hora, las tareas con fecha y los seguimientos aparecen en «Sin hora» sin crear eventos;
  - el día elegido muestra sus citas (con su persona, inmueble y operación), sus tareas y sus seguimientos; «Agendar» conserva todo lo de antes (vínculos desde la dirección, operación que aún carga, reintentos y la captura que no se pierde al cambiar de semana). El botón de guardar se llama «Guardar en la agenda».
  - Se retiraron las vistas «Mes» y «Próximos»; la semana se mueve con las flechas y «Hoy».
  - **Tareas:** misma pestaña, ahora en lista con fecha («Hoy», «Vencida» o el día), estado, prioridad si no es normal, responsable y pasos; filtros sin cambios.
- **Herramientas:** el catálogo de las 16 y la pestaña Documentos con el marco y los estilos del panel guiado; la tarjeta completa abre la herramienta.
- **Administración:** Equipo, Sitio web, Reportes, Historial y Configuración usan el mismo marco y encabezado. Sitio web reúne en pestañas Textos del sitio, Blog y Archivos; Reportes, Reportes y Control comercial. Las migas solo se muestran dentro de una ficha.
- **Código:** `src/lib/admin/contacts-view.ts` y `src/lib/admin/agenda-view.ts` (lógica probada); `src/components/admin/contacts/`, `properties/` y `agenda/`; `GuidedPage` y `AdminFrame` como marcos. Se retiraron las pantallas anteriores de prospectos, clientes y calendario, el tablero de prospectos y unos 7 KB de CSS sin uso: `panel.module.css` queda en 13 KB (meta de la Fase 1: menos de 15 KB).
- **Pruebas:**
  - las de la lista de prospectos, la captura manual, la conversión, el perfil, el cliente y el calendario se reescribieron sobre las pantallas nuevas cubriendo lo mismo; la del tablero de prospectos se retiró con él;
  - nueva prueba de navegador en CI (`secciones.spec.ts`): Contactos, Inmuebles, Agenda, Tareas, Herramientas y Administración a 320, 390, 768 y 1440 px, en claro y oscuro, sin escribir en la base y con revisión de accesibilidad a 1440 px.
- **Resultados:**
  - lint, tipos y compilación aprobados; 702 pruebas de servidor, 338 del panel (3 nuevas de la lógica de Contactos y Agenda) y 35 de herramientas, además del paquete de PDF;
  - 52 de navegador del panel que corre CI (4 nuevas de estas secciones), contra un servidor sin base de datos;
  - 70 públicas (1 omitida).
  - Sin desbordamiento horizontal a 320, 390, 768 y 1440 px, en claro y oscuro, en Contactos, Inmuebles (también con «Opciones» abierto), Agenda, Tareas, Herramientas, Reportes, Sitio web y Equipo; sin fallas de accesibilidad (WCAG 2.1 AA) a 1440 px.
  - Una prueba del formulario de inmuebles falló una vez con todo el conjunto corriendo y pasó sola y en la corrida completa siguiente; no tocó código de esta fase.
- **Límites y decisiones por confirmar:**
  - en Agenda, las flechas de semana y «Agendar» quedan debajo de las pestañas y no junto al título como en el lienzo, porque solo aplican a la pestaña Agenda;
  - los eventos no guardan duración: en la semana ocupan una hora;
  - quedan con la palabra «Expediente» los reportes y algunas fichas; se repasan en la Fase 7 con el glosario.

**Fase 7 · Repaso final — 16/10/2026 (en la rama `feat/panel-guiado`; sin PR ni publicación):**
- **Glosario en todo el panel:**
  - «Operación» en vez de «expediente» en reportes, tareas, agenda, búsqueda, trabajo relacionado, documentos, herramientas (actividad, tareas y documentos de la operación), equipo y entrevistas. El folio `EXP-…` se conserva.
  - «Prospecto» en vez de «lead» en las fichas, la conversión, el perfil, las migas, el equipo y las tareas («Seguimiento de prospectos»).
  - El seguimiento simple de las operaciones de administración dice «Lo tengo» en vez de «Recibido».
  - «Generar PDF» y «PDF generados» en Control comercial.
  - Sin «servidor» en los mensajes: historial, tareas, carga de archivos, copia temporal del inmueble y descarga de PDF.
  - «Revisor de expediente» se muestra como **«Pendientes documentales»** (el `slug` no cambia).
  - Los formatos se muestran con su nombre con acentos («Opinión jurídica del inmueble»); el 17 se llama «Cierre de la operación». El nombre del archivo original no cambia. En el PDF, los formatos 09 y 15 a 19 toman ese mismo nombre.
  - Se conserva el texto de los documentos generados (contratos, avisos y PDF): su redacción es la de cada formato.
- **Código sin uso retirado:** la lógica de entrevista por fases que reemplazó el asistente, el orden del menú que se podía arrastrar (la opción ya no existe), el orden de actividades del calendario anterior, la entrada de entrevistas en la navegación (esa dirección ya redirige) y tres clases de CSS de herramientas. Todos los archivos de `src/` se alcanzan desde alguna página; `panel.module.css` queda en 13 KB.
- **Rutas y enlaces:**
  - prueba nueva (`tests/backend/panel-links.test.ts`): cada dirección del panel escrita en el código lleva a una página que existe o a una redirección, y cada redirección lleva a una página que existe;
  - las únicas páginas sin enlace eran `/admin/entrevistas/<id>` (redirige, para enlaces viejos) y la muestra interna `/admin/sistema`, que ahora se abre desde Configuración.
- **Resultados:**
  - lint, tipos y compilación aprobados; 704 pruebas de servidor (2 nuevas de rutas), 336 del panel y 35 de herramientas, además del paquete de PDF;
  - 52 de navegador del panel que corre CI (dos se adaptaron al botón «Generar PDF» y se volvieron a correr aparte); 70 públicas (1 omitida).
- **Estado del rediseño:** las siete fases del encargo se fusionaron en `main` con el [PR #39](https://github.com/M01535NT/fortius-inmuebles/pull/39) el 17/10/2026 (commit `58bdafd`). El despliegue a producción no está comprobado en este registro.

**Operaciones según el boceto C — 17/10/2026** *(integrado en `main` el 17/10/2026; ver «Estado vigente»)*:
- **Origen:** el titular dijo que la operación tenía mucho texto y no se entendía qué hacer. Se compararon tres bocetos (dos del agente y `docs/diseno/boceto-operacion-minimalista.html`) y el titular aprobó el **boceto C**, que toma lo mejor de los tres. Pidió además que **cada documento de trabajo se capture en su propia ventana**.
- **Operación guiada** (`screen.tsx`, `next-step.tsx`, `stages.tsx`):
  - encabezado en una línea (qué hace el cliente, inmueble, precio, responsable y folio);
  - tarjeta de avance con un círculo numerado por etapa (✓ lista, «!» le falta algo, la actual en guinda) y «Ver etapas»; un aviso dice qué le falta a una etapa anterior («A la etapa 3, levantamiento, le falta el 04») con «Hacerlo ahora»;
  - pestañas: Esta etapa · Expediente · Tareas · Historial · Ajustes (la dirección conserva `?tab=documentos` y `?documento=<id>`);
  - **«Ahora toca»**: una sola acción principal, la del primer pendiente (un problema marcado va primero);
  - **«Para terminar la etapa · N de M»**: 1) los documentos que se llenan, 2) lo que se confirma («Marcar revisado» como acción normal; los demás estados en «Más») y lo demás que impide avanzar; al pie, si la etapa se abre sola o con «Pasar a»;
  - a un lado: próxima tarea, propietario (Llamar y WhatsApp) y «¿Qué significa cada estado?». Se retiraron de la pantalla «Herramientas de esta etapa» y el texto largo de «Qué hacemos / Para qué» (queda plegado).
- **«Ver etapas»**: panel con las 10 etapas en cuatro fases (Conocer, Revisar, Preparar y publicar, Vender y cerrar) y los documentos de las etapas pasadas y de la actual, con Abrir, PDF y Word; lo que falta dice «No se generó». Las fases solo agrupan en pantalla; la etapa interna no cambia.
- **Ventana de captura** (`formato-capture.tsx`, `use-documents.tsx`): todo «Iniciar», «Continuar» o «Abrir» de un formato abre su ventana, con índice de secciones y pendientes, datos de la operación a un lado y Word, «Guardar borrador» y «Generar PDF» al pie. La pestaña «PDF y copias firmadas» reúne los PDF generados y la carga de la copia firmada (antes estaba en Documentos). El aviso 01 se captura en una sola pantalla con su editor propio y su PDF sigue exigiendo la plantilla vigente. La pestaña Expediente ya no edita: lista los documentos y crea uno nuevo («Crear y abrir»; en el 08 se elige si parte de una opinión de valor).
- **Lista de operaciones** (`board.tsx`): reemplaza el tablero de 10 columnas. Dos grupos, «Esperan algo de ti» —con el motivo en una palabra: hay un problema, tarea vencida, falta un documento de una etapa anterior, documento por revisar, vence hoy o sin próxima tarea— y «Al día»; filtros por fase; etapa numerada según la ruta de cada operación («4 de 7 · Oferta y negociación» en una compra); fechas en la misma letra. `?etapa=<slug>` filtra por la fase de esa etapa.
- **Lógica nueva y probada** en `src/lib/admin/operation-view.ts`: `stageTrack`, `pastGaps`, `attentionOf`, `stageItems`, `nowItem`. Las reglas de avance, los requisitos, la evidencia de «Revisado» y los permisos no cambian; no hay migraciones ni rutas nuevas de API.
- **Pruebas:** se actualizaron las que dependían de la pantalla anterior para cubrir lo mismo (23 de la operación, 9 del aviso y 3 suites de navegador) y se agregaron 3 de la lógica nueva. Resultados: lint y tipos aprobados; 743 pruebas de servidor y 354 del panel; compilación sin base; 52 de navegador del panel que corre CI. Revisado en capturas a 390 y 1440 px, en claro y oscuro (operación, «Ver etapas», ventana de captura y lista), sin desbordamiento horizontal.
- **Límites:** «Falta el 04» en la lista solo se detecta cuando el documento no existe (la lista no consulta los PDF); en la operación sí se distingue «Falta el PDF». No se revisó en el panel con datos reales.

**Entrevista inicial (02) sencilla — 17/10/2026** *(integrado en `main`; completada por RP-89: lo necesario más «Ampliar»)*:
- **Decisión del titular:** la entrevista solo sirve para conocer al propietario o a su apoderado. La escritura, el folio real, los antecedentes, el tracto sucesivo, las medidas y lo fiscal se toman de los documentos que entrega con el checklist y van a la revisión jurídica (05), no a la entrevista.
- **Queda** (`src/lib/formatos/entrevista.ts` y su documento): datos de la entrevista; 01 · quién es (nombre, relación, propietario si es otra persona, persona o empresa, fecha de nacimiento, teléfono, correo, estado civil y cómo contactarlo); 02 · el inmueble (tipo, domicilio, quién lo ocupa y si tiene crédito, que es lo que necesita el checklist); 03 · por qué vende, para cuándo, cuánto quiere y cómo llegó al precio, y qué espera; 04 · siguiente paso. Pasa de unos 90 campos a 30.
- **Se retiró:** CURP, RFC, residencia fiscal, régimen y datos del matrimonio, adquisición, título, notaría e inscripción, facultades, problemas y compromisos detallados, la sección fiscal, precio mínimo, neto, condiciones de pago y entrega, experiencia previa y contradicciones. Las claves que quedan son las mismas, así que los borradores anteriores, el llenado desde el primer contacto y el checklist siguen funcionando.
- **Pruebas:** 745 de servidor y 354 del panel aprobadas; se revisó un PDF de ejemplo (dos páginas).
- **Pendiente:** la plantilla maestra de Word del titular (`G:\Mi unidad\FORTIUS\04_Metodologia\01_Captacion\02_EntrevistaInicial.docx`) conserva la versión larga; el panel ya genera la sencilla.

**Levantamiento (04A–04G) sencillo — 17/10/2026** *(integrado en `main`)*:
- **Decisión del titular:** el levantamiento se hace el mismo día de la entrevista, en la visita, y captura lo que el asesor ve: qué tipo de inmueble es y su uso de suelo (no es lo mismo un terreno residencial que uno industrial, ni un edificio de oficinas que uno de departamentos), fotografías, cómo está distribuido, de qué está hecho y qué servicios tiene. Lo que no se pueda anotar en el momento —superficies, medidas y colindancias— sale de la escritura en la revisión jurídica (05).
- **Queda** (`src/lib/formatos/levantamiento.ts` y su documento), por tipo de inmueble: identificación; 01 · qué inmueble es (uso de suelo con la lista del Reglamento de Zonificación de Tijuana, la misma del 07, más el tipo de vivienda, el piso, el giro, el uso u operación o el tipo de conjunto según el caso); 02 · fotografías y croquis (la foto es obligatoria; el croquis, opcional); 03 · la visita; 04 · cómo es (niveles, recámaras, baños, cajones, altura libre, andenes, unidades…); 05 · superficies, si se tienen a la mano; 06 · materiales y estado general; 07 · servicios con «sí / no / no sé»; 08 · entorno, observaciones y qué falta ver, medir o pedir. Entre 32 y 43 campos por tipo, de los cuales 12 a 16 obligatorios (antes, 90 a 130).
- **Se retiró:** las tres claves por dato («base» D/O/M/C/NV/NA y referencia), las cuatro superficies por concepto (declarada, documental, medida, fuente), los permisos de foto y medición, la finalidad, las tablas de respaldos y discrepancias, los índices de uso de suelo (COS, CUS), lo eléctrico detallado de la nave (kVA, kW) y «elaboró / revisó». Las claves comunes (folio, inmueble, colonia, asesor, idInmueble) se conservan para el llenado desde la operación.
- **Conexiones:** el PDF y la ruta de emisión aceptan el croquis como opcional; la ventana de captura muestra «Fotografías y croquis» como paso 2; el Word sigue el mismo documento.
- **Pruebas:** reescritas las del levantamiento (variantes, terreno, emisión y documento) para la versión corta; 745 de servidor y 354 del panel aprobadas; PDF de muestra del 04B revisado.
- **Pendiente:** las plantillas maestras de Word del titular (`04A`–`04G` en `G:\Mi unidad\FORTIUS\04_Metodologia\01_Captacion\`) conservan la versión larga; el panel ya genera la sencilla.

## Limpieza del código (Fase A del plan de rediseño) — 15/10/2026

**Alcance:** mismo comportamiento con menos código y peso, decidido por el titular el 15/10/2026: quitar Finanzas, Análisis territorial y Portal de clientes, y eliminar las integraciones apagadas (firmas, OCR, consulta con IA y rutas). Rama `chore/limpieza-codigo`, sin migraciones ni cambios de permisos o datos. **Estado: comprobada localmente; sin push, PR ni publicación.**

- **Código:** 35 archivos y 2,161 líneas menos en `src` (34,437 → 32,276). Se borraron componentes de la portada anterior y rutas `/zonas` que ya redirigían. Se quitaron exportaciones sin uso. Las utilidades repetidas se unificaron (`formatDate`, `formatAmount`, `fetchJson`, `loadAllDossiers`, `readAllPages`, etiquetas de operación y etapa).
- **Peso:** 474 KB menos de JavaScript compilado (−10.7 %) y 17 KB menos de CSS. `public/` pasa de 6.3 MB a 3.5 MB; el retrato de Nosotros pasa de PNG de 2.5 MB, servido sin optimizar, a WebP de 118 KB. Una dependencia menos (`pdfjs-dist`).
- **Integraciones:** quedan 16 apps. Las tablas y la migración de integraciones siguen en la base y en los respaldos; su prueba de seguridad en PostgreSQL se conserva.
- **Pruebas:** lint, tipos y compilación aprobados; 700 pruebas de servidor, 328 del panel y 35 de herramientas, además del paquete de PDF. En navegador: 70 públicas, 44 del panel (las de CI más comercial, process-corrections y reportes, que entran a CI) y 6 de formularios. Las pruebas del panel se ejecutaron contra un servidor sin backend, como CI. Se retiraron ocho pruebas de navegador obsoletas que CI no ejecutaba.
- **Respaldo:** los archivos retirados sin referencias quedan en `.superpowers/archivo-limpieza-2026-10-15/` con manifiesto SHA-256.
- **Pendiente:** el titular decide el borrado de carpetas locales temporales; después siguen el PR y Verify remoto. La Fase B (bocetos del rediseño) espera aprobación.

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

### Cómo lo cubre hoy el panel

La guía actual del propietario tiene ocho estados internos (`captacion`, `documentacion`, `comercializacion`, `negociacion`, `cierre`, `entrega`, `postventa`, `cerrado`), validados también en PostgreSQL. La barra lateral muestra seis accesos con otros nombres: Captación, Preparación, Promoción, Negociación, Cierre y Postventa.

| Etapa del proceso | Estado interno actual | Requisitos para salir de la etapa (ya existentes) | Diferencia con el proceso |
|---|---|---|---|
| 0 Captación | `captacion` | Entrevista 02 | Cubierta. Quién autoriza la venta se pregunta como dato opcional; se verifica en la etapa 1. |
| 1 Verificación y precio | `documentacion` (primera mitad) | Titularidad 05, factibilidad 06 con vigencia, opinión de valor 07, precio 08 y decisión de captación | **Comparte estado con la etapa 2**; hoy no se distingue cuándo termina la verificación. |
| 2 Contrato y preparación | `documentacion` (segunda mitad) | Intermediación 09, levantamiento y material 04B, plan 10 y autorización de publicación | Igual que arriba. El PDF del 09 sigue bloqueado; la autorización se acredita con evidencia externa. |
| 3 Publicación y seguimiento | `comercializacion` | Comprador identificado para pasar a negociación | **Falta el seguimiento al propietario**: no hay registro visible del último informe (la app «Informe propietario» existe, pero no está ligada a la etapa). |
| 4 Visitas y ofertas | `negociacion` | Oferta 14, revisión para cierre 06, instrumento 15 y contraparte | **Las visitas no aparecen en la ruta del propietario**; solo en la del comprador. |
| 5 Cierre y entrega | `cierre` → `entrega` → `postventa` → `cerrado` | Firma y pago; entrega 16 con llaves e inventario; registro, honorarios y archivo | Cubierta, pero repartida en cuatro estados; el proceso la presenta como una sola etapa con pasos. |

### Adaptación del panel propuesta (PROC)

**Enfoque recomendado:** adaptar la presentación y derivar las seis etapas de los estados internos, **sin migración de base de datos**. Los requisitos y controles de PostgreSQL ya cumplen el orden del proceso; lo que no coincide son los nombres, la agrupación y dos registros visibles. Si después se quiere que la separación entre las etapas 1 y 2 también se valide en el servidor, se agrega un estado interno nuevo con su migración y su ensayo de respaldo (PROC-06, opcional).

- [x] **PROC-01 · Una sola definición de etapas.** Crear en `src/lib/formatos/operation-workflow.ts` el catálogo de las seis etapas (nombre, qué se hace, para qué) y la función que obtiene la etapa a partir del estado interno y de los requisitos completos. Estando en `documentacion`, la operación está en «Verificación y precio» hasta completar titularidad, factibilidad, valor, precio y la decisión de captación; después pasa a «Contrato y preparación». Pruebas unitarias para cada estado interno y para operaciones históricas.
- [x] **PROC-02 · Barra lateral y páginas de etapa.** *(Histórico: reemplazado por la Fase C y el boceto C.)* Reemplazar los seis accesos de `module-catalog.ts` por las seis etapas del proceso, con sus nombres y su «para qué». Cada página `/admin/proceso/[etapa]` lista las operaciones de esa etapa, con las etapas 1 y 2 separadas y la 5 reuniendo cierre, entrega y postventa.
- [x] **PROC-03 · Guía del expediente.** `operation-workflow-panel.tsx` muestra la línea de seis etapas, la actual destacada, y agrupa los requisitos bajo la etapa a la que pertenecen. En la etapa 2, los requisitos de la etapa 1 deben estar completos antes de capturar los de contrato y preparación. En la etapa 5 se muestran sus pasos (firma y pago → entrega → postventa → archivo).
- [x] **PROC-04 · Seguimiento al propietario (etapa 3).** Mostrar en el expediente la fecha del último informe al propietario y abrir la app «Informe propietario» con el contexto del expediente. Avisar en Resumen cuando una operación publicada lleve más de un mes sin informe (mensual, confirmada por el titular el 15/10/2026). No bloquea el avance.
- [x] **PROC-05 · Visitas y ofertas del inmueble (etapa 4).** Mostrar en el expediente del propietario las visitas agendadas y anteriores (agenda y formato 13) y las ofertas recibidas (formato 14 y app Ofertas) del inmueble vinculado, incluidas las que provienen de expedientes de compradores. No bloquea el avance.
- [ ] **PROC-06 · Opcional: estado interno propio para «Contrato y preparación».** Solo si se requiere validación en servidor: nueva migración aditiva que agrega el estado, reparte los requisitos entre las etapas 1 y 2, migra los expedientes que están en `documentacion` y conserva publicación y rutas de compra, renta e inversión. Requiere respaldo, ensayo de restauración aislado y ventana autorizada.
- [ ] **PROC-07 · Verificación y publicación.** Lint, tipos, pruebas, compilación y revisión en escritorio y móvil. Comprobar que los expedientes existentes conservan su avance. Publicar solo con autorización y registrar la entrega en este plan.

**Fuera de este alcance:** las rutas de compra, renta e inversión conservan sus etapas actuales. El proceso no cambia los formatos, los permisos ni el bloqueo del PDF 09.

**Decisiones del titular, 15/10/2026:** enfoque sin migración (PROC-01 a 05 y 07); PROC-06 queda fuera hasta nueva indicación. El informe al propietario es mensual.

**Implementación local — 15/10/2026, rama `feat/proceso-comercializacion` (sin commit ni publicación todavía):**

- PROC-01: `SALE_PROCESS`, `processPhase`, `processStageText`, `requirementPhase` y la regla mensual del informe en `operation-workflow.ts`. Compradores y arrendatarios se muestran en «Visitas y ofertas» mientras buscan y negocian; inversión conserva sus etapas y se agrupa en «Verificación y precio» hasta la decisión.
- PROC-02: menú «Proceso de venta» con las seis etapas (`/admin/proceso/captacion`, `verificacion-precio`, `contrato-preparacion`, `publicacion-seguimiento`, `visitas-ofertas`, `cierre-entrega`). Las direcciones anteriores (`preparacion`, `promocion`, `negociacion`, `cierre`, `postventa`) redirigen a la etapa vigente. El Resumen muestra el conteo por etapa.
- PROC-03: la guía del propietario muestra las seis etapas, qué se hace y por qué, y agrupa los requisitos por etapa. Los de «Contrato y preparación» quedan bloqueados en pantalla hasta completar la verificación y la decisión de captación. Este orden se aplica en la interfaz; el servidor sigue validando el avance acumulado (PROC-06 no implementado).
- PROC-04: el expediente muestra el último informe preparado en la app y si está al día o vencido; Resumen y la página de etapa avisan de operaciones sin informe o con informe vencido. La fecha es la del último informe preparado, no un acuse de envío al propietario. `GET /api/admin/apps/runs` admite `expedienteId` y la vista `ultimo-por-expediente`, que devuelve solo fechas bajo las políticas RLS existentes.
- PROC-05: el expediente reúne las visitas del inmueble en la agenda (próximas y anteriores; la agenda no registra si se realizaron), las ofertas analizadas en la app del expediente y de su contraparte, y los documentos del formato 14.
- Sin migraciones ni cambios de permisos, formatos o datos. Las etiquetas internas del propietario de venta cambiaron a los nombres del proceso.
- Comprobación local: lint y tipos sin errores; 734 pruebas backend y 343 del panel aprobadas, incluidas 12 nuevas del proceso, 4 del endpoint y 6 de navegación y guía. Una corrida del panel registró una falla aislada que no se reprodujo en tres corridas posteriores. Compilación de producción aprobada. Revisión en navegador con la sesión real en modo de solo lectura: Resumen, páginas de etapa, redirección, guía con requisitos agrupados y bloqueo, y ancho móvil de 375px sin desbordamiento. No se guardaron datos. Las pruebas de navegador Playwright se actualizaron, pero no se ejecutaron.
- Pendiente: revisión del titular, commit, PR, Verify remoto y publicación.

### Flujo del vendedor por documento (FLUJO), pedido del titular el 16/10/2026

El titular pidió que cada paso del propietario que vende sea una etapa con su documento: **Prospecto → Entrevista inicial (02) → Levantamiento (04A–04G) → Checklist de documentos → Dictamen jurídico (05/06) → Opinión de valor (07)**. Cada etapa tiene un botón «Iniciar …» que abre la captura y, al terminar, permite descargar el PDF y una copia en Word.

- [x] **FLUJO-01 · Prospecto y entrevista inicial (fase 1).** En «Nueva operación», el propietario se registra con una sola pantalla de prospecto: domicilio del inmueble, municipio, tipo, qué quiere, plazo, precio que mencionó, notas, aviso de privacidad compartido y fecha de la entrevista inicial. Lo demás queda «por aclarar» para el 02. La etapa «Captación» se divide en «Prospecto» y «Entrevista inicial»: se pasa a la segunda al iniciar el 02 desde la operación. La entrevista se captura por secciones en pantalla completa, guarda al avanzar, genera el PDF y descarga una copia en Word (`docx`). La etapa reúne el aviso de privacidad (01) y el checklist de documentos. Para pasar a «Verificación y precio» se exige el PDF del 02 de la versión actual.
- [x] **FLUJO-02 · Levantamiento y checklist de documentos.** Etapas propias «Levantamiento» y «Checklist de documentos» (nueve etapas en total). Al terminar el 02 se elige el levantamiento según el tipo de inmueble (04A–04G) y se captura por secciones, con fotografías y croquis, PDF y Word. El checklist se arma con las respuestas del 02 usando los códigos D01–D22 del control documental del 05; se descarga en PDF o Word y se guarda como tarea de la operación (cada documento es un paso; al recibir todos, la tarea se completa). Para pasar a «Verificación y precio» se exigen los PDF del 02 y del 04 de la versión actual y el checklist completo. El requisito «Levantamiento y material comercial» de «Contrato y preparación» no cambia.
- [x] **FLUJO-03 · Dictamen jurídico y opinión de valor.** «Verificación y precio» se divide en «Dictamen jurídico» (requisitos de titularidad y factibilidad; formatos 05 y 06) y «Opinión de valor y precio» (valor y precio; formatos 07 y 08), para un total de diez etapas. Cada formato tiene «Iniciar», captura por secciones, PDF y Word. El 05 se crea con su control documental lleno a partir del checklist (recibido o por recibir) y el 08 toma el valor del 07 cuando este ya tiene PDF. Se pasa de una etapa a otra al marcar como revisados sus requisitos, con el documento como respaldo; las reglas del servidor no cambian.
- [x] **FLUJO-05 · Contrato y preparación.** La etapa tiene «Iniciar» para el contrato 09 (captura y Word; su PDF sigue bloqueado hasta cotejar el modelo registrado) y para el plan 10 (PDF y Word).
- [x] **DOC · PDF y Word con el diseño de las plantillas (pedido del titular, 16/10/2026).** Kit común en `src/lib/formatos/documento/`: carta, márgenes y logotipo de las plantillas, título azul marino, banda de datos, secciones numeradas, subtítulos verdes, tablas con encabezado azul y franja de marca en el pie; estilo «contrato» en Times negro para 09 y similares. Cada formato se reproduce con el texto de su plantilla. Hechos: 10 (PDF y Word), 09 (Word) 02 (PDF y Word, formulario de preguntas con la respuesta capturada debajo) y 04A–04G (PDF y Word con foto principal y croquis; un generador recorre las secciones de cada tipo), 05 (PDF y Word con sus 12 secciones) y 06 (PDF y Word en estilo opinión; el panel captura menos secciones que la plantilla: faltan tabla de antecedentes, condiciones por etapa y marco jurídico como campos propios). 07 (PDF y Word con sus 12 hojas: portada con foto y valor concluido, índice, resumen, antecedentes, zona, inmueble, comparables, ingresos, físico, conciliación y fotografías; enfoques sin peso marcados como no aplicados) y 08 (PDF y Word con las barras y cifras de su hoja). 11 a 19 (PDF y Word: reporte en estilo marca, perfil y visita como formularios grises con casillas, propuesta como cartas, promesa con sus 26 cláusulas, acta, cierre y recibo con prosa y barras, presupuesto con sus tres hojas). 01 conserva su generador cotejado, ajustado a la plantilla vigente del 09/10/2026 (cuerpo en Times, títulos a la izquierda, recuadro gris, bloque de titular y franja del pie; versión de plantilla carta-2026-10-09); su Word se arma con el mismo texto cotejado y el diseño de la plantilla (commit `4e787f8`, 17/10/2026). Todos los formatos, del 01 al 19, salen ya en PDF y Word con el diseño de su plantilla. Queda abierto solo lo que el 06 no captura todavía (DOC-06).
- [x] **FLUJO-04a · Candados del arranque en el servidor, sin migración (17/10/2026, commit `a4c77c7`).** La ruta que cambia la etapa (`/api/admin/expedientes/[id]/operacion`) rechaza salir de captación en ventas y rentas del propietario si faltan el 02 o el 04 emitidos en su versión vigente, o el checklist de documentos completo. Son los mismos candados que muestra «Te falta». Lógica en `src/lib/formatos/operation-gates.ts`; 4 pruebas nuevas de la ruta.
- [ ] **FLUJO-04b · Candados en la base de datos (opcional).** Llevar ese mismo candado a PostgreSQL y agregar «Redes sociales» como origen separado de «Página web» requiere migración, respaldo y ventana autorizada (como PROC-06), idealmente ensayada antes en una copia aislada. Mientras tanto ambos orígenes se muestran juntos.
- [x] **FLUJO-06 · Cada entregable en PDF o en Word, a elección del asesor (17/10/2026, commit `b54bab0`).** En «Lo que sigue», las filas del 02, el levantamiento 04 y el aviso 01 suman Word junto al PDF (del 05 al 10 ya lo tenían), y la pestaña Documentos agrega «Descargar Word» para cualquier formato. El Word se arma con la versión guardada y no queda archivado; el PDF sí, con su huella. Las filas del aviso, el 09 y el 10 ya muestran su PDF cuando existe.
- [x] **FLUJO-07 · Fotografías del 07 en la captura guiada (17/10/2026, commit `9fba861`).** «Fotografías pertinentes» del reporte fotográfico ya lista las imágenes del borrador, y la sección para subirlas va antes de ese reporte.
- [x] **Herramienta «Documentos sin expediente» (17/10/2026, commit `00bfb36`).** Permite preparar una opinión de valor, un contrato o una propuesta sin abrir una operación, con sus propias imágenes y descarga en PDF o Word. No se vincula a ningún expediente y no requiere migración.
- [x] **DOC-07 · Opinión de valor según su plantilla vigente (17/10/2026).** La captura tiene solo las celdas que imprime `07_OpinionValor.xlsx` (sin compatibilidad jurídica, referencias 04/05-06, estado ni revisión del responsable); las listas son las de la plantilla y el uso de suelo usa las zonas del Reglamento de Zonificación de Tijuana (arts. 43 y 49, reforma del 14/08/2020). Ningún campo es obligatorio: el PDF se descarga desde cualquier sección aunque falten datos, y el valor concluido aparece en cuanto los pesos suman 100 y los enfoques tienen datos. La copia editable es Excel, no Word: `public/plantillas/07_OpinionValor.xlsx` es una copia de la plantilla con sus fórmulas simplificadas a lo capturado (Excel recalcula al abrir; verificado: mismo valor y misma cifra en letra que el panel). Aplica a la etapa de la operación y a «Documentos sin expediente». Cada sección y campo de antecedentes tiene una nota de ayuda; las plantillas de texto van en un desplegable. Pendiente: el diseño visual del PDF del panel aún sigue la versión anterior de la plantilla (título centrado, encabezado con folio y subtítulos guinda de la nueva) y el Excel todavía no inserta las fotografías.
- [x] **Montos con formato de moneda (17/10/2026).** Los importes del panel se muestran como `$5,000,000.00` y se editan como número limpio: precio del inmueble, perfil del prospecto, entrevista, campos de importe de los formatos, tablas de presupuesto, neto, plan, reporte, promesa y opinión de valor, y las herramientas comerciales y financieras.
- [ ] **DOC-06 · Completar la captura del 06.** Agregar como campos propios la tabla de antecedentes, las condiciones por etapa, el marco jurídico y la lista de documentos revisados, dentro de la misma captura por secciones (recomendación del 17/10/2026: no usar Excel ni una herramienta aparte). Sin migración.
- [ ] **DOC-09 · Liberar el PDF del contrato 09.** Sigue bloqueado hasta cotejar el modelo registrado; el titular debe definir qué hace falta para darlo por final.

**Integración autorizada — 17/10/2026.** El titular autorizó commit, push y fusión en `main` de los cambios pendientes: operaciones según el boceto C y ventana de entregables, entrevista y levantamiento simplificados, menú lateral y membrete general. La preparación incluye las instrucciones del repositorio y los bocetos de referencia. Las muestras de descarga de `output/` quedan locales. El cierre de CI, fusión y despliegue se documentará en el [PR #40](https://github.com/M01535NT/fortius-inmuebles/pull/40); la autorización no acredita todavía su publicación. Se adaptaron las pruebas de la portada al menú lateral: conservan los cuatro destinos y comprueban por separado la animación de salida y la retirada inmediata del árbol accesible.

**Dónde nos quedamos — cierre de la sesión del 17/10/2026** *(histórico; el estado vigente está al inicio del plan)*

- **Rama y publicación:** `feat/panel-guiado` se fusionó en `main` con el [PR #39](https://github.com/M01535NT/fortius-inmuebles/pull/39) el 17/10/2026 (commit `58bdafd`). El despliegue a producción falta comprobarlo y registrarlo. El entorno local (puerto 3001) usa la base real de producción: revisar en el navegador solo leyendo, sin guardar.
- **Comprobación más reciente:** tipos, lint, 738 pruebas de servidor, 347 del panel y compilación de producción aprobados. Revisado en el panel sin guardar: filas del 05/06, pestaña Documentos, captura del 07 en «Documentos sin expediente» y el monto del inmueble con formato de moneda.
- **Hecho en esta sesión (17/10/2026):** Word del aviso 01 con su plantilla (`4e787f8`); candados del arranque en el servidor, FLUJO-04a (`a4c77c7`); PDF o Word en cada entregable, FLUJO-06 (`b54bab0`); fotografías del 07 en la captura (`9fba861`); herramienta «Documentos sin expediente» (`00bfb36`); montos con formato de moneda (`8449776`); opinión de valor 07 según su plantilla, en PDF y Excel, DOC-07 (`2fe90d0`).
- **Plantilla del 07:** la original del titular está en `G:\Mi unidad\FORTIUS\04_Metodologia\01_Captacion\07_OpinionValor.xlsx`. La copia del proyecto (`public/plantillas/07_OpinionValor.xlsx`) tiene sus fórmulas simplificadas; si el titular cambia la plantilla, hay que regenerar la copia y revisar el mapa de celdas de `src/lib/formatos/valor-excel.ts`. La carpeta antigua `C:\Users\Moise\MNT\INMOBILIARIA\Plantillas\Metodologia` ya no está disponible en el equipo; las demás plantillas probablemente están en la misma carpeta de `G:\Mi unidad\FORTIUS\04_Metodologia`.
- **Reglas del titular para los formatos:** capturar solo los campos que imprime la plantilla, nada inventado (opciones y textos con fuente verificable), PDF descargable aunque falten datos y ayuda breve en cada sección, pensada para asesores y no para peritos.

- **Membrete general — trabajo local del 17/10/2026, sin integrar ni publicar.** Las nuevas salidas Word y PDF usan el encabezado y pie del Plan de negocio: formatos 01–19 y variantes 04, checklists, avisos, fichas, herramientas, reportes financieros y control comercial, y los dos descargables estáticos. Se ajustó la paginación al espacio del arte, incluidas tablas extensas y hojas horizontales. Excel, emisiones históricas, copias firmadas y originales subidos permanecen intactos. Procedencia y medidas en `public/brand/membrete.md`; comprobación mediante renders Word/PDF, comparación del texto, suites del proyecto y trazas de activos. El diseño del cuerpo del 07 continúa pendiente; este cambio no lo da por terminado.

**Qué sigue, en este orden sugerido:**
1. **Diseño del cuerpo del PDF del 07** igual a la nueva plantilla: título centrado en mayúsculas, subtítulos guinda, renglones compactos y distribución por revisar. El encabezado y el pie se rigen ahora por el membrete general aprobado del Plan de negocio. El cuerpo todavía sigue la versión anterior; la cantidad de páginas varía según los datos y el espacio del nuevo membrete. Los datos y cifras se conservan.
2. **Fotografías en el Excel del 07:** foto principal en la portada, croquis en «3. Urbanas» y las ocho fotos del reporte. Hoy solo se llenan sus pies.
3. **DOC-06:** completar la captura del 06 (antecedentes, condiciones por etapa, marco jurídico y documentos revisados) dentro del flujo.
4. **DOC-09:** el titular define qué hace falta para liberar el PDF del contrato 09.
5. **Ayuda en otros formatos:** las notas y desplegables existen hoy solo en el 07 (`src/lib/formatos/ayuda.ts`); se pueden extender al 04, 05 y los demás, siempre con la plantilla como fuente.
6. **Comprobar el despliegue del PR #39** (fusionado el 17/10/2026) y registrarlo. FLUJO-04b y PROC-06 son opcionales y requieren migración con respaldo y autorización.
7. **Matriz de estados del ERP/CRM** («Estado y dependencias de cada entrega»): sigue con los estados del 14/10; revisarla contra lo construido antes de estimar cuánto falta del ERP completo.
8. **Después, el «Orden vigente»** de «Dirección del producto y reglas vigentes», al inicio de este plan.

Notas de la fase 1: sin migraciones. El entorno local usa la base real, así que la revisión en navegador fue de solo lectura; el flujo de captura se comprobó con pruebas automáticas. La copia en Word se arma con los datos del borrador: no es el PDF emitido ni lleva su huella SHA-256.

## Regla de actualización en cada publicación

Por instrucción de Moisés del 13/10/2026, este plan debe actualizarse con cada entrega a GitHub y cada despliegue. Registrar fecha local, alcance real, PR, commit funcional, migraciones aplicadas, comprobaciones y límites, enlace y estado del despliegue. Distinguir preparación, publicación comprobada y pendientes; no marcar publicado por haber hecho push. Los commits que solo actualizan este registro no requieren reconstruir un producto cuyo código permanece idéntico. Actualizar también las tareas realizadas y pendientes del mismo plan.

### Rediseño visual del panel según los bocetos — 18/10/2026

**Entrega a GitHub:** rama `claude/rediseno-panel-bocetos-6c8e5e`, sobre `main` después del PR #44 (`5748d6b`), [PR #45](https://github.com/M01535NT/fortius-inmuebles/pull/45) a `main` con auto-merge (merge commit) para integrarse cuando Verify apruebe. Este registro no acredita la fusión ni un despliegue: se comprueban en el PR y en Vercel.

- **Alcance (solo capa visual, LV-05):** tokens `admin-*` en el CSS del panel (esquinas 10/12/16/20 px y pastilla; sombras azul marino en reposo, al levantar y en la acción principal; lienzo, colores de estado) y kit ampliado (`Pill`, `Counter`, `Thumb`, `Avatar`, `Ring`, `Kbd`, `CardLink`, pestañas verticales, selector segmentado con pista). Marco: menú lateral flotante con el logotipo y la cuenta al pie, barra superior con buscador rápido (campo con Ctrl K y paleta con «Crear rápidamente») y «Nueva operación», encabezado y barra inferior flotante con «+» en celular. Hoy como tablero del director: operaciones en curso con anillo, lo que espera algo de ti, tareas, visitas y lo que vence en 7 días; filas con foto del inmueble o iniciales y pastilla. Operaciones con selector Lista · Tablero (la última vista se recuerda en el navegador como comodidad del dispositivo), filtro por fase en pista, foto y pastilla de fecha; tablero por fase con tarjetas. Una operación con portada (foto, nombre, datos, cuatro fases, Propietario, Llamar y WhatsApp), línea de tiempo de las etapas a la izquierda, secciones como lista y «Ahora toca» al centro. Inmuebles en galería con pastillas sobre la foto. Contactos como una sola lista con iniciales y pastilla de fecha y, en computadora, la vista previa de la persona señalada (Llamar, WhatsApp, lo que busca, presupuesto, siguiente paso, actividad y «Abrir ficha»). Nueva operación con los pasos a la izquierda y las entrevistas a medias a la derecha. Ventana de captura con avance «N de M secciones completas» y pastillas «Listo». Las pantallas sin boceto (fichas de personas, Agenda, Herramientas, Administración, Mi perfil) toman la misma escala con `src/app/admin/panel-uplift.css`. Tipografía ajustada con el titular (18/10/2026): Archivo en anchura 96 (92 en títulos) y pesos 620/600/540/400. Íconos: el titular eligió **Iconoir** (MIT) entre tres propuestas (Iconoir, Phosphor Regular, Phosphor Duotone; lienzo «Bocetos de íconos del panel»); `src/components/admin/icons.tsx` conserva los nombres anteriores y entrega el equivalente de Iconoir, con la dependencia nueva `iconoir-react` 7.12.1; el sitio público sigue con lucide. En modo oscuro el logotipo va sin placa, con letras blancas y el portal en azul marino y guinda (el titular descartó el acento rosa de la versión inversa).
- **No cambia:** rutas, API, permisos del servidor, base de datos, candados de avance, 409, protección de cambios sin guardar ni el sitio público. Única dependencia nueva: `iconoir-react` (MIT), autorizada por el titular. `panel.module.css` solo recibe los tokens; los estilos viven en los módulos de cada área y en `kit.module.css`.
- **Fuera por falta de datos en el sistema** (los bocetos los muestran como ejemplo): cobro esperado y cobros pendientes, meta de captaciones del mes, avalúo frente a oferta, perfil de leads compradores con «inmuebles que coinciden», notas por inmueble, tipo de cambio y el mapa de Inmuebles (EXT-09). «Mías / Todo el equipo» sigue solo en Operaciones para el administrador con asesor asignado.
- **Comprobaciones locales:** lint, tipos y las 354 pruebas del panel (tres pruebas de Hoy se actualizaron a la estructura nueva sin debilitarlas; la de navegación cubre la barra superior y la cuenta; las de navegador de Contactos y Mi perfil se actualizaron a la lista con vista previa y al menú de la cuenta); revisión pantalla por pantalla en el navegador con la sesión del titular en el servidor del worktree (escritorio y celular, claro y oscuro, foco con teclado), con sus ajustes de letra, íconos y logotipo; capturas con datos simulados a 1440 y 390 px en claro y oscuro sin desbordamiento horizontal, guardadas en `.superpowers/rediseno-capturas/` (fuera del commit, anteriores al ajuste tipográfico). `npm run verify` en local pasó lint y tipos; las pruebas de base de datos con PGlite fallan en esta máquina Windows («Unexpected process function …guard_guided_operation») sin relación con el cambio, y pasan en CI. Las pruebas de navegador del panel las corre Verify en CI (el puerto 3105 lo comparte otra sesión en esta máquina y la corrida local no fue fiable).
- **Límites:** las capturas usan datos simulados; el rendimiento y los permisos remotos no se midieron; la publicación en el dominio la hace Vercel desde `main` y se comprueba después de la fusión.
- **Ajustes tras la revisión del titular (18/10/2026, PR #45 fusionado como `67ba41a`; rama `claude/tarea-y-listo-de-operacion`):** en el paso «Listo» de Nueva operación, «Abrir la operación» y «Corregir la entrevista» no respondían porque el candado de «respuestas sin guardar» seguía activo al desmontarse la entrevista; ahora se libera al terminar. La ficha y la captura de tareas, la captura de prospecto y de cliente (ventana dentro de Contactos) y la edición del perfil del prospecto toman grupos de campos con la escala del kit (`src/components/admin/form.module.css`): título con estado, vencimiento y responsable, pasos como lista con avance, historial como línea de tiempo y secciones plegables. Las reglas de guardado, el 409 y los nombres de los campos no cambian. Herramientas se agrupa por categoría (favoritas primero) con buscador, selector de categorías y contador; las favoritas siguen siendo una preferencia del navegador por usuario. Comprobado en local con lint, tipos, las 354 pruebas del panel y una entrevista de prueba terminada en el navegador (datos de ensayo autorizados). En CI fallaron dos pruebas de navegador que esperaban textos anteriores («Descripción, categoría y vínculos» y el buscador como cuadro de texto); se actualizaron al diseño nuevo sin debilitarlas y la rama se puso al día con `main`.

### Cuestionario único y respuestas del titular — entrega documental 17/10/2026

**Entrega a GitHub:** rama `docs/cuestionario-unico`, sobre `main` después del PR #43 (`e3db22c`). El estado de Verify y de la fusión se comprueba en su PR; este registro no acredita un despliegue.

- **Alcance:** un solo cuestionario, `docs/erp-crm/CUESTIONARIO_TITULAR.md` (119 preguntas), que reemplaza a `docs/erp-crm/PREGUNTAS_TITULAR.md`, `PREGUNTAS_PLAN_ERP_CRM.md` y las preguntas locales del panel, con una tabla de procedencia. El titular respondió por audio los grupos A a L (salvo lo pospuesto); se escribieron las reglas RP-90 a RP-99, las entregas COR-11, COR-12, PUB-02, DOC-14, DOC-15, FIR-01 e IA-01, las decisiones DEC-29 y DEC-30, la dirección visual LV-05 y las autorizaciones del titular en `AGENTS.md` (base actual con datos de prueba, publicación con verificación aprobada).
- **Comprobaciones:** lectura de las secciones cambiadas, identificadores únicos (119 preguntas, 119 respuestas), sin referencias a los archivos eliminados fuera de `tmp/`, y diff sin errores de espacios. Copias de los originales en `tmp/2026-10-17-cuestionario-unico/`.
- **Límites:** solo Markdown; sin cambios de código, pruebas, dependencias ni migraciones. Las reglas nuevas no están implementadas. Los bocetos visuales viven en un lienzo privado de claude.ai, fuera del repositorio.

### Cuestionario complementario — entrega documental 17/10/2026

**Entrega a GitHub:** [PR #43](https://github.com/M01535NT/fortius-inmuebles/pull/43), commit documental `43815d70470e02aeab2f6efc9442ca440b3702f9`, preparado sobre `main` después del PR #42 (`1de616e`). El estado de Verify y de la fusión se comprueba en el PR; este registro no acredita por sí solo un despliegue.

- **Alcance:** complemento P01–P84 conciliado con las reglas vigentes: nueve temas resueltos, dos remisiones completas y 73 campos de respuesta (16 detalles complementarios y 57 preguntas directas). Se conservan las 73 preguntas del cuestionario vigente y la prioridad de A y B. No cambia el orden de implementación.
- **Comprobaciones locales:** lectura completa, revisión independiente aprobada, identificadores y correspondencias comprobados, 99 referencias locales existentes y diff sin errores de espacios. Los documentos locales ajenos a esta entrega se preservaron y quedaron fuera del commit.
- **Límites:** solo Markdown; sin cambios de código, pruebas, dependencias o migraciones, ni escrituras en datos productivos. La revisión documental no acredita la implementación de los paquetes pendientes ni requiere reconstruir el producto. CI, integración y publicación se verifican por separado.

### Panel guiado y flujo del vendedor publicados — 17/10/2026

**Estado: integrado en main y publicado el 17/10/2026, America/Los_Angeles.** [PR #39](https://github.com/M01535NT/fortius-inmuebles/pull/39) (rama `feat/panel-guiado`), commit de fusión `58bdafd`, despliegue de producción `dpl_6mGokWD7AamPh2VkmkDH9Tmkpfiw`, servido en https://fortiusinmuebles.com.

- **Alcance:** panel guiado (fases 1–7), flujo del vendedor en diez etapas con «Iniciar» y descargas, formatos 01–19 con el diseño de sus plantillas, opinión de valor 07 en PDF y Excel, candados del arranque en el servidor, montos con formato de moneda y la herramienta «Documentos sin expediente». Incluye lo que `main` ya traía del PR #36.
- **Comprobaciones:** `npm run verify` en local (lint, tipos, 738 pruebas de servidor, 347 del panel y compilación) y Verify remoto aprobado, con las 52 pruebas de navegador del panel y las 70 públicas. Se actualizaron 12 pruebas de navegador que esperaban el panel anterior (columna «Prospecto», diez etapas, 17 herramientas, prospecto del propietario y una espera tras volver al modo claro antes de medir contraste); se corrieron antes en una copia aislada sin `.env.local`.
- **Sin migraciones** ni cambios de credenciales o permisos.
- **Hallazgo del despliegue:** el dominio seguía fijado al despliegue del 14/10 (`dpl_8hobqhkN8TLwoto1yq7PvKC6DD2m`), así que los despliegues nuevos de `main` quedaban listos sin publicarse. Se promovió el nuevo a producción; el despliegue anterior queda como opción de recuperación. Verificado en el dominio: `/admin`, `/brand/pie-documento.png` y `/plantillas/07_OpinionValor.xlsx` responden 200. El interior del panel no se revisó en producción porque requiere iniciar sesión.
- **Pendiente:** que el titular revise el panel en producción con su sesión. Si algo falla, se puede volver a promover `dpl_8hobqhkN8TLwoto1yq7PvKC6DD2m` en Vercel.

### Consolidación de main y publicación — 14/10/2026

**Alcance:** concentrar en main el trabajo vigente y publicar el proyecto actualizado. La portada panorámica y su revelado al desplazarse, Apps, folios, flujo guiado, entrevistas y aviso de privacidad ya tienen su versión vigente en main; las ramas históricas no se reaplican sobre el producto actual.

- Integrar la lista de clientes y operaciones que permanecía en la carpeta local: grupos de compradores, vendedores, arrendadores, arrendatarios, inversionistas y otros; búsqueda de nombre/folio sin acentos, selección y acceso a eliminados.
- Mantener entrevistas, requisitos por etapa, protección de cambios sin guardar, versiones, folios automáticos y el botón de alta directa. Nueva operación conduce al asistente de cinco perfiles; no vuelve al formulario anterior ni solicita folio manual.
- No requiere migraciones ni activar proveedores. Conservar respaldo verificable de la captura local antes de actualizar la carpeta canónica a main.

**Estado: integrado en main y publicado el 14/10/2026, America/Los_Angeles.** [PR #27](https://github.com/M01535NT/fortius-inmuebles/pull/27), commit funcional probado y desplegado `99f775c8dcbf2e1ac32d14e8a52167370cd03c84`, integración en main `bb8808246e2463146f0a193c12d2f78287c5981b`.

- Lint, tipos, 687 pruebas backend, 333 del panel y compilación aprobados localmente. Tres regresiones de navegador a 390/768/1440px: búsqueda, selección, teclado, eliminados y navegación al asistente; incorporadas a Verify. Revisión independiente de la integración local aprobada. Capturas usan datos simulados; respuesta ficticia de entrevistas corregida y las tres pruebas repetidas con éxito.
- Verify #152 (run `38527954340`, job `115732689422`) aprobado para el commit funcional exacto, incluidas comprobaciones de recuperación, PDF y navegador público/panel/captación. No se declara aprobado el presupuesto opcional de Lighthouse.
- Despliegue productivo `dpl_B2GpjPYezyf986Wzi6aGFebWSc2v`, Ready y control Fortius Verify aprobado antes de promover. URL de versión: `https://fortius-inmuebles-kjxoe2soz-tonala.vercel.app`; dominio [Panel](https://fortiusinmuebles.com/admin/expedientes) comprobado contra ese ID y commit. Salud HTTP200; entrevista privada HTTP401 sin sesión. Interfaz autenticada revisada sin crear registros ficticios en producción.
- Ninguna migración, cambio de credenciales o activación de proveedor. Se conserva el despliegue anterior como opción de recuperación. Los 17 archivos locales se preservaron en copia con manifiesto SHA-256 y stash; la carpeta canónica se actualiza mediante avance de main y debe coincidir con GitHub, sin diferencias ni cambios pendientes. El archivo alternativo de imagen sin uso queda únicamente en el respaldo.
- Los commits posteriores que solo completan este registro no cambian el código del producto y no requieren otro despliegue. Siguen los pendientes de proveedores, piloto con dos asesores y recuperación integral de Auth/Storage descritos en el plan.

### Captación y entrevista preparada — implementación 13/10/2026

**Problema:** Nueva operación exigía un cliente existente y la guía pedía entrevista sin ofrecer dónde realizarla. **Alcance autorizado:** Resumen → elegir vender/ofrecer renta/comprar/buscar renta/invertir → contacto nuevo o existente → cuestionario correspondiente → guardar borrador/reabrir → completar y continuar en el expediente.

- Nueva tabla privada `fortius_inmuebles_interviews`: intención por operación, contacto/asesor autorizado, respuestas versionadas, expediente y entrevista anterior. Capturas completadas inmutables; correcciones vinculadas al mismo expediente. Se conservan los formatos documentales02/12.
> **Nota (18/10/2026):** la conversión a cliente al completar la entrevista queda superada por RP-90 a RP-92: completar abre la operación, pero la persona sigue como prospecto hasta firmar su contrato (COR-10).

- El nuevo contacto permanece en Prospectos durante el borrador. Solo al completar se convierte a cliente, crea expediente con folio automático y próxima tarea fechada; todo ocurre en una transacción. Un cliente existente conserva ficha, tipo, perfil, responsable y operaciones anteriores; inversionista tiene clasificación propia cuando se crea desde esta captura.
- La entrevista admite evaluación. Titularidad/factibilidad/autorizaciones se revisan antes de comercializar; capacidad comprobada antes de oferta. Precio/capital por definir no se registra como cero. Aviso presentado no significa consentimiento.
- Reintentos del mismo ingreso/contenido producen el mismo resultado; claves con contenido distinto se rechazan. Teléfono compartido requiere confirmación expresa de persona distinta. Reanudar un borrador no se considera una creación exitosa de otra solicitud.
- La corrección conserva la próxima acción inicial; cambios de tarea se realizan en Tareas. No crea otra operación ni otra tarea. Reasignar contexto vuelve las revisiones a pendientes; después se captura entrevista del nuevo contexto.
- Renta: entrevista y admisión a revisión/preparación, con seguimiento manual por tareas y documentos. No se presenta la guía de compraventa como ciclo completo de arrendamiento. Integraciones externas continúan diferidas.
- Respaldo actualv3 incluye27tablas; mantiene reconocimiento y restauración de copias completasv1(18) yv2(26), rechazando inventarios incompletos.

**Tareas comprobadas:** cuestionarios de los cinco perfiles; contacto nuevo/existente; borrador y reapertura; finalización transaccional; versiones/reintentos; correcciones e historial; aislamiento por responsable; escritorio/móvil y teclado; respaldo/restauración y revisión independiente. **Publicado en el dominio real.**

**Publicación comprobada — 13/10/2026, America/Los_Angeles:** rama `codex/captacion-entrevistas`, [PR #25](https://github.com/M01535NT/fortius-inmuebles/pull/25) integrada en main (`ea58f8dda24f6c456f111c1b2e6b5660cb292c0d`). Versión exacta verificada y desplegada: `4a4fbc8a901bc4fc97b4690189127633e7d5ba27`; código funcional inicial `a8ccf3bfe1a93b511873b83e1c61039b56a949e2`.

- Verify #148 (`38522466545`) aprobado para ese commit: lint, tipos, 687 pruebas backend, 332 del panel, compilación, 35 de respaldo/restauración, fuentes PDF, 70 de navegador público, 34 de panel y siete de captación pública. Lighthouse opcional omitido; no se declara aprobado su presupuesto de rendimiento.
- Aplicada únicamente `20261014054506_operational_interviews.sql` (SHA-256 `FB85DCF6DD9DCCA2854DA843F1AE14E9196CF649942B64BBDB65B5EAB724B7AE`). Comprobadas 27 tablas con RLS; entrevista sin lectura anónima ni escritura directa de personal. RPC privado con sesión, membresía y autorización del responsable actual del contacto/expediente. El actor histórico es dato de auditoría, no concede acceso.
- Copias propietarias anterior/posterior restauradas en PostgreSQL aislado. Las 26 tablas anteriores mantienen exactamente contenido y fechas; la nueva tabla está vacía. Se probó además restauración v3 con original y corrección completos, relaciones y snapshots preservados. Huellas de copias: anterior `a3f4a5ee44902776c95b375b117f7484aa4c3227257bec04a21da1d5ae612977`; posterior `b08e66ec6c83a8927cf5839ec3961f29218ba1985c7339d5dc272a9d9200c1b3`.
- Revisión independiente local aprobada después de corregir reanudación competidora, reasignación e incoherencia de próxima acción. Capturas comprobadas del selector, entrevista completada y expediente con una tarea; móvil en una columna y sin desbordamiento. El recorrido de guardar/reabrir/completar/corregir se probó con datos ficticios exclusivamente en servidor aislado.
- Vercel `dpl_EZH9H8DMREcc1QwA3krXZsrba3za` Ready y control Fortius Verify aprobado antes de promover. URL de versión: `https://fortius-inmuebles-3x5r8ilhi-tonala.vercel.app`. Dominio [Nueva operación](https://fortiusinmuebles.com/admin/operaciones/nueva) comprobado contra ese despliegue y commit; salud HTTP200; API privada HTTP401 sin sesión. Navegador autenticado: cinco perfiles, captura del propietario y responsables reales cargados, sin error de configuración. No se insertaron prospectos, entrevistas ni operaciones ficticias en producción.
- Plan único actualizado con la entrega. No se reconstruye el producto para un registro documental cuyo código permanece idéntico. Conservados los cambios locales de la página pública en la carpeta principal; desarrollo y publicación desde el checkout aislado del panel.

**Límites conservados:** el recorrido completo de guardado está probado en aislamiento; la comprobación productiva fue de lectura y presentación, sin crear datos de negocio de prueba. Pendientes piloto con dos asesores reales y recuperación integral de Auth/Storage. Renta continúa con seguimiento manual después de su entrevista; firmas, OCR, consultas documentales y rutas permanecen diferidas por decisión del titular.

### Publicación anterior comprobada — folios

Rama `codex/folios-automaticos`, PR #22, código funcional `0dfff7242d8a0cb8233d3ffbb28ee1b385352690`. Migración `20261014031535_automatic_folios.sql` aplicada y registrada en Fortius; 26 tablas con RLS conservadas. Respaldo privado de las 26 tablas y restauración aislada aprobados. Preparación Vercel: `fortius-inmuebles-92cd6vae7-tonala.vercel.app`. Publicado en `fortiusinmuebles.com/admin` después de Verify #140 aprobado para el commit funcional exacto. PR #22 integrada en `main` (`84875d614d5b41ebaf54ec3c986d2beb5bba7a8a`); Vercel Ready, despliegue `dpl_6KzgZovFXMPXu11tFboWkLMdJyPM`, promovido al dominio. Formulario autenticado comprobado: folio de inmueble no editable y mensaje de asignación al guardar. La revisión automática rechazó insertar el inmueble ficticio de QA; no se guardó. El ensayo de creación y restauración es aislado, no una inserción real.

### Publicación comprobada — flujo guiado, 13/10/2026

Rama `codex/flujo-guiado`, PR #23 integrada en `main` (`2ee0b5202ed0d4c04865fb975eb895c1f444e4ba`). Versión comprobada y desplegada: `3de3f53302449354bf82e5cbc6de60a9d7508635`, con el mismo contenido que la integración. Código funcional original: `4e991785ffd8a0e653f5185d91c79c07655fc86f`.

- Publicadas las cuatro mejoras: abrir desde CRM/Clientes, rutas separadas de propietario/comprador, requisitos con soporte y próxima tarea en el expediente, y controles de avance/publicación con firma/pago, entrega, postventa y archivo separados. La captura se conserva ante rechazos y salidas canceladas.
- Aplicada `20261014033544_guided_operations.sql`: 26 tablas con RLS, dos controles activos, funciones internas sin ejecución pública. Los datos de las 26 tablas se conservaron en la comparación anterior/posterior, excluyendo solo las columnas nuevas con valor nulo. Respaldo propietario restaurado en base aislada; también se verifican referencias JSON de contraparte.
- Verificación local: 668 pruebas de servidor, 327 del panel, 33 de respaldo/restauración, lint, tipos y compilación. Revisión independiente de código y nueve capturas de escritorio/móvil aprobada, sin hallazgos obligatorios abiertos. En navegador aislado, propietario y comprador avanzan con revisión/tarea; recepción, observación y pausa bloquean; recargar conserva el avance y cancelar la salida conserva el borrador.
- Verify #143 (`38513113363`) aprobado para el commit completo `3de3f53302449354bf82e5cbc6de60a9d7508635`: respaldos, compilación, dependencias de producción, fuentes PDF, 70 pruebas de navegador público, 34 del panel y siete de captación pública. La medición Lighthouse de rendimiento móvil de la página pública es opcional y no se ejecutó en esta entrega; no se declara aprobado su presupuesto de rendimiento.
- Vercel `dpl_F3vV72WSv24CyCHrEPPViv4jqZUS`: Ready y control Fortius Verify aprobado antes de la promoción. URL de la versión: `https://fortius-inmuebles-ppkdtj284-tonala.vercel.app`. Dominio `https://fortiusinmuebles.com/admin/expedientes` comprobado contra ese despliegue; salud HTTP200, ruta nueva protegida con HTTP401 sin sesión y formulario autenticado con ambas rutas y folio no editable.
- No se guardaron operaciones ficticias en producción. El recorrido de creación/avance se comprobó en PostgreSQL aislado; la aceptación operativa con datos reales y dos asesores sigue pendiente. Concurrencia entre conexiones PostgreSQL independientes y recuperación completa de Auth/Storage permanecen sin comprobar. Firmas, OCR, consultas documentales y rutas externas siguen diferidas con `FORTIUS_APPS_ENABLED=false`.

La revisión automática bloqueó el ensayo ficticio productivo y exigió verificar esquema, CI y Ready antes de publicar; se siguió ese orden y se usó la base aislada para las escrituras de prueba. El registro posterior es documental y no cambia el producto desplegado.

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

## Dónde estamos

### Folios y revisión del recorrido — 13/10/2026

**Implementado en esta revisión:** el folio interno del inmueble se asigna en PostgreSQL al crear el inmueble (`FORTIUS-000001` en adelante); el expediente recibe su propio folio (`EXP-000001` en adelante). Se conserva cada identificador anterior y se consideran los números históricos de inmuebles eliminados. Los formularios dejan de pedir un número manual. El folio real del Registro Público se captura desde su documento: no se genera.

**Comprobación local:** 649 pruebas de servidor, 318 del panel y 32 de herramientas de respaldo/restauración aprobadas; lint, tipos y compilación de producción sin fallos. Revisión técnica independiente aprobada. El ensayo simultáneo usa la cola de una conexión PGlite: no acredita dos conexiones PostgreSQL independientes. La migración se aplicó y esa versión se publicó; su comprobación está en el registro de folios anterior.

**Diagnóstico previo a la guía:** las etapas de la barra lateral agrupaban expedientes y el asesor coordinaba manualmente sus controles. La nueva guía incorpora validación acumulada de revisiones y próxima acción; la autorización jurídica sigue correspondiendo al responsable competente. Su publicación se comprueba separadamente.

Mejoras autorizadas, implementadas y publicadas:

1. Abrir la operación desde el contacto y continuar en una sola pantalla con personas, inmueble, documentos y próxima acción relacionados; abrir desde el contacto el expediente provisional con documentos pendientes. La apertura contextual está implementada desde cliente y prospecto; protege la captura pendiente.
2. Separar el recorrido del propietario (captación, revisión, precio, intermediación, comercialización) del comprador (perfil, capacidad de compra, opciones, visitas, oferta) y relacionarlos al negociar un inmueble concreto.
3. Mostrar requisitos por etapa, quién debe resolverlos y una próxima acción con fecha. Distinguir recibido, revisado, pendiente y observado; permitir pausa, regularización o descarte. No confundir un documento recibido con un dictamen favorable.
4. Condicionar publicación y avance a los controles del proceso que correspondan, con evidencia y responsable. Antes de cerrar, distinguir firma, condiciones de pago, entrega y seguimiento posterior; no marcar todo como concluido por cambiar una etiqueta.

La reforma debe conservar expedientes y permisos existentes. Las reglas jurídicas, contractuales y fiscales deben especificarse y validarse antes de convertirlas en bloqueos del panel.

### Flujo guiado de captación y compra — implementación autorizada 13/10/2026

**Objetivo:** conducir al asesor desde el contacto hasta cierre, entrega y postventa, con requisitos, contexto y siguiente acción visibles. Moisés autorizó ejecutar las cuatro mejoras; esta sección contiene especificación y tareas del mismo plan maestro.

**Diseño:** conservar las tablas, formatos y versiones actuales; añadir a cada expediente una guía privada `flujo` (JSON versionado) con ruta `captacion` o `compra`, estado activa/pausada/regularización/descartada, motivo y revisiones con soporte, vigencia cuando corresponda y actor/fecha registrados por servidor. La guía es operativa: no emite dictámenes ni certifica cumplimiento jurídico. El responsable debe aportar la revisión competente y sus condiciones.

**Rutas de venta de vivienda:** propietario: entrevista → documentación y factibilidad → precio, intermediación y materiales autorizados → oferta → firma/pago según contrato → entrega → postventa → archivo. Comprador: perfil y capacidad de compra → opciones → visitas → oferta → revisión e instrumento de operación → firma/pago según contrato → entrega → postventa → archivo. Relacionar ambas operaciones cuando se elija el inmueble; no crear una parte vendedora ficticia cuando intervenga otra inmobiliaria: admitir contraparte externa identificada y documentada.

**Reglas:** el folio real sigue documental. Documentos recibidos no satisfacen una revisión. Las revisiones necesitan soporte; controles de factibilidad necesitan vigencia declarada. Avanzar solo al paso inmediato, con requisitos previos completos y próxima acción con fecha/responsable; el archivo final exige resolver o descartar las tareas abiertas y no requiere inventar otra tarea; retroceder o pausar con motivo conservado en actividad. No avanzar con observaciones abiertas. Separar firma, condiciones de pago, entrega y pendientes de postventa. La publicación nueva requiere expediente de captación vinculado con revisión y autorización; inmuebles ya publicados e históricos se preservan y se explican. Cambiar la ruta no permite eludir controles acumulados. No activar proveedores externos ni ampliar accesos. La guía cubre venta residencial; renta, administración y otras operaciones conservan su seguimiento manual. Los históricos conservan etapa; pueden adoptar la guía sin reiniciarse y deben satisfacer requisitos acumulados antes del siguiente avance. Cambios de contexto invalidan la capacidad de aprobación de revisiones anteriores, preservando evidencia y el historial; las tareas se reconcilian con el nuevo contexto dentro de la misma transacción. La excepción de publicación toma exclusivamente el estado anterior persistido por el servidor; después de despublicar, volver a publicar exige la guía.

**Archivos e interfaces:** `src/lib/formatos/operation-workflow.ts` define rutas, requisitos, esquema y evaluación visible; `expediente-operations.ts` amplía etapas; migración compatible añade guía y validación transaccional de avance/publicación; rutas API incluyen guía y vínculo de inmueble; formulario contextual y `operation-workflow-panel.tsx` conducen captura; Cliente/CRM ofrecen Abrir operación; ProcessStageWorkspace distingue ruta y etapa y reúne entrega/postventa. El editor genérico documental y sus emisiones permanecen disponibles en las pestañas del expediente.

- [x] **GUIA-01 · Datos y controles.** Probar rechazo de saltos, recepción sin revisión, evidencia vacía, revisión vencida, acceso de otro asesor, reversión/versiones, publicación sin autorización y conservación/restauración de expedientes anteriores. Implementar validación en PostgreSQL además de evaluación del formulario.
- [x] **GUIA-02 · Pantalla y apertura contextual.** Abrir desde cliente/contacto con datos disponibles, escoger ruta, vincular inmueble posteriormente y relacionar contraparte interna o externa. Mostrar pasos, requisitos y avance; guardar sin perder captura y mantener límites de permisos. Probar vendedor/comprador, datos pendientes, fallos y respuestas tardías.
- [x] **GUIA-03 · Próxima acción y cierre.** Reutilizar tareas del expediente; pedir tarea abierta con responsable y fecha para avanzar. Separar entrega y postventa de cerrado y de firma/pago, con evidencia y pendientes explícitos. Probar tareas completadas/sin fecha y operación pausada.
- [x] **GUIA-04 · Validación y publicación.** Comprobar pruebas, lint, tipos, build, respaldo y restauración reales compatibles; revisión independiente del código y de las vistas; verificar escritorio/móvil y publicación del commit comprobado. Actualizar este registro con la entrega real.

### Reforma operativa del panel — 13/10/2026

Diagnóstico revisado y aprobado para ejecución por Moisés: avisos de seguimiento visibles; indicadores que distingan los inmuebles Demo; mejor organización del expediente y de sus documentos; vínculo directo de tareas al expediente; vistas semanal y de próximos eventos. Esta iteración conserva identidad Fortius, formatos, versiones, permisos y tareas anteriores. No activa contabilidad, mapas, portal externo, integraciones de mensajería ni reglas jurídicas/comerciales nuevas.

**Objetivo:** retomar el trabajo de una operación desde su contexto y entender qué necesita atención. **Arquitectura:** reutilizar las colecciones y expedientes actuales; ampliar los contratos de tareas de forma compatible; consultas documentales de metadatos con autorización existente y paginación. **Tecnología:** Next.js, React, TypeScript y Supabase de las versiones instaladas; sin actualización de dependencias. **Referencia aprobada:** diagnóstico del panel del 13/10, conservado con capturas y revisión independiente fuera del repositorio.

- [x] **UI-01 · Resumen e indicadores.** Modificar `src/app/admin/page.tsx`, `workspace/today.tsx`, `commercial-metrics.ts`, Reportes y Territorio. Excluir Demo por defecto de conteos operativos, con inclusión explícita; mantener los ejemplos en inventario. Mostrar contactos atrasados/de hoy y avisos sin próxima acción sin cambiar datos. Reportes separa periodo, situación actual e histórico y abre registros afectados. Probar datos vacíos, Demo/real mezclados, contacto convertido y fechas de Tijuana.
- [x] **UI-02 · Expediente y documentos.** Reformar `src/app/admin/expedientes/page.tsx` y Documentos; conservar pestañas/editores/emisiones existentes. Separar la creación del recorrido de consulta, mostrar cliente/inmueble/responsable/siguiente tarea y pendientes de captura. Ofrecer lista documental paginada y buscable por formato/folio, sin copiar cuerpos privados a la respuesta de metadatos. Probar cambios sin guardar, respuestas tardías, acceso denegado y recuperación de errores.
- [x] **OPS-01 · Vínculo de tarea.** Ampliar `taskSchema`, `TaskForm`, Tareas y validación PostgreSQL con `expedienteId` UUID opcional; conservar contratos antiguos. Reutilizar Crear tarea relacionada y las políticas actuales: expediente visible/activo, cliente/inmueble/asesor coherentes. Probar persistencia/recarga, dos expedientes sobre el mismo inmueble, referencias incompatibles y acceso directo de identidades sintéticas. No ampliar permisos ni alterar registros anteriores.
- [x] **UI-03 · Agenda semanal y lista.** Añadir Semana y Próximos a Calendario conservando Mes y sus vínculos existentes. Aritmética de fechas sin depender de la zona del dispositivo; indicar contexto seleccionado antes de guardar. Probar cambio de año/mes, orden con/sin hora, estado vacío y navegación por teclado/móvil.
- [x] **Verificación local.** Lint, tipos y build de producción Turbopack aprobados; 522 pruebas de servidor y 258 de panel sin fallos. Regresiones comprobadas antes y después de corregir los casos de captura; permisos y persistencia probados con PGlite. Las 16 pruebas de herramientas verifican también la restauración de tareas vinculadas y respaldos anteriores; PostgreSQL recalcula la columna derivada, sin modificar el respaldo original. Revisadas 21 capturas en escritorio, tablet y móvil, modo oscuro y teclado; nueve ensayos independientes aprobados. La ampliación compatible de tareas está aplicada y registrada en la base actual de Fortius, sin crear registros de prueba ni copiar secretos a nuevas ramas.

**Control de publicación:** integrar el commit comprobado en `main` con pruebas remotas aprobadas y confirmar el estado Ready y el navegador autenticado en `fortiusinmuebles.com/admin`. La evidencia de código, capturas, base y liberación se conserva fuera de la carpeta activa.

**Criterios transversales:** no perder captura pendiente; ninguna referencia concede permisos; los conteos explican su conjunto; documento recibido no equivale a revisado; ausencia de datos no se presenta como fallo; no confundir aprobación local con despliegue o ERP completo. La migración de tareas se prueba en aislado y mantiene las ACL existentes antes de aplicar una ampliación compatible en producción.

### Barra lateral y aplicaciones — 13/10/2026

*Registro histórico, reemplazado por la Fase C · 2 del rediseño (16/10/2026): ya no existen el orden personalizado, la ventana de aplicaciones ni los grupos Comercial/Gestión.*

Diseño aprobado: barra azul institucional con selección guinda, módulos agrupados en Comercial, Gestión y Herramientas; controles de configuración, sitio, contraer y salir al pie. Se conservan el orden personalizado, el ancho y los accesos existentes. El botón superior Aplicaciones abre una ventana con iconos y búsqueda local de los módulos disponibles para cada rol. Estos accesos no implementan las capacidades financieras, geográficas o de portal que siguen pendientes.

- [x] Aplicar barra lateral y ventana de aplicaciones; reutilizar un catálogo de rutas y permisos.
- [x] Comprobar teclado, búsqueda, cierres, navegación, permisos y adaptación a escritorio, tablet y móvil.
- [x] Comparar capturas con las propuestas y cerrar los hallazgos de revisión independiente.

Publicado en `main`, commit `90fb26c`, y confirmado Ready en Vercel. Acceso principal: `fortiusinmuebles.com/admin`. La evidencia técnica se conserva fuera de la carpeta activa.

### Diseño aprobado del panel — 12/10/2026

*Registro histórico, reemplazado por el rediseño guiado (Fase C) y por la Fase A, que retiró los accesos de Finanzas, Análisis territorial y Portal de clientes.*

Aplicar las propuestas visuales aprobadas: fondo claro, azul `#061F3F`, borgoña `#8A1634`, navegación lateral, búsqueda superior, tablas legibles y tarjetas de inmuebles. Conservar el logotipo vectorial vigente y los permisos, formularios y operaciones existentes. No incorporar los datos ficticios de las imágenes a la base real.

- [x] Actualizar `panel.module.css`, encabezados, navegación y búsqueda; conservar modo oscuro y navegación móvil.
- [x] Reorganizar el resumen, CRM e inventario; mostrar etapas reales y conservar vistas de lista, filtros y acciones existentes.
- [x] Aplicar el estilo a expedientes, documentos, agenda y formularios. Añadir accesos de Finanzas, Análisis territorial y Portal de clientes, con estado explícito para capacidades pendientes.
- [x] Comprobar lint, tipos, pruebas del panel, build y navegación con datos sintéticos en escritorio y móvil; revisión independiente del código y las vistas finales. Resultado local: 211 pruebas de panel, 37 de navegador y revisión independiente R2 aprobadas; no se escribieron datos reales.
- [x] Publicar únicamente en `codex/erp-crm-preview` y verificar el despliegue del commit comprobado. Diseño `e9ded12` desplegado correctamente en Vercel; navegador autenticado confirma Resumen, navegación, ciclo y estilos. No se modificaron datos reales durante las pruebas. [Abrir vista previa](https://fortius-inmuebles-git-codex-erp-crm-preview-tonala.vercel.app/admin).

Este cambio es de presentación. No implementa contabilidad, TIR/VAN, mapas interactivos ni autenticación de clientes; esas funciones mantienen las entregas y compuertas del plan.

**Corrección de fidelidad visual solicitada:** la versión `83cfaff` fue rechazada por no reproducir la composición aprobada. Se mantiene la misma rama y el alcance de presentación. La aceptación exige comparar referencia y captura juntas, a igual tamaño, y corregir proporciones, distribución, densidad y controles. Las pruebas funcionales no sustituyen esa comparación. Se conserva el logotipo vigente, no se inventan registros financieros ni ubicaciones, y las capacidades pendientes usan estados vacíos en su posición de diseño.

- [x] Reproducir cabecera compacta, menú principal, ciclo continuo, tabla operativa y agenda lateral; evitar que tarjetas auxiliares desplacen el contenido principal.
- [x] Alinear CRM e inventario con sus referencias; conservar el acceso y los controles existentes de los módulos relacionados mediante el menú adicional.
- [x] Capturar comparación visual del mismo viewport; corregir y volver a comparar hasta cerrar diferencias materiales con revisión independiente.
- [x] Comprobar las regresiones afectadas y desplegar la corrección únicamente en la rama de vista previa.

**Verificación de la corrección, 13/10:** revisión independiente R10 aprobada para presentación de Resumen, CRM e inventario y controles examinados, después de corregir composición, proporciones, colores, contadores, etiquetas en tablet/móvil y filtros/formulario expandidos del CRM. Filtros abiertos/cerrados comprobados a 1280, 1586 y 1872 píxeles. Evidencia y capturas externas: `C:\Users\Moise\.codex\visualizations\2026\10\13\01a13325-2bfe-7132-b357-3341a20f8892\fidelidad-diseno\design-qa.md`. 214 pruebas del panel y 13 pruebas afectadas posteriores aprobadas; estas 13 se repitieron después del último ajuste de CRM; lint y compilación finales con salida 0. Comprobación de navegador por CUA; batería Playwright CLI no ejecutada en esta corrección. Datos de revisión sintéticos, con API de escritura bloqueada. Esta aprobación técnica no certifica backend productivo ni sistema ERP completo; aceptación humana pendiente.

**Publicación comprobada, 13/10:** código `8525835650cfe73f1e760cec452a3fa5ebec2667` en `codex/erp-crm-preview`, estado Vercel – fortius-inmuebles `success`. [Abrir panel de prueba](https://fortius-inmuebles-git-codex-erp-crm-preview-tonala.vercel.app/admin). Acceso autenticado y composición nueva de Resumen e Inmuebles comprobados; filtros CRM expandidos en despliegue final a 1280 mantienen 12 píxeles de separación frente al tablero, sin desbordamiento del documento. No se enviaron formularios ni se modificaron datos durante esta comprobación.

- Los fundamentos del ERP ya se integraron en `main` mediante [PR #15](https://github.com/M01535NT/fortius-inmuebles/pull/15), commit `36e3ba64`. La base local de esta preparación es `1e763345`; rama de trabajo `codex/preparacion-erp-crm`.
- Ya existen inmuebles, prospectos/clientes, agenda/tareas, expedientes, documentos privados y cartera comercial. También contratos compartidos, consultas paginadas de expedientes, diagnóstico de errores y comprobaciones locales de respaldo.
- El sistema completo sigue pendiente. La cartera actual y las calculadoras públicas no equivalen a contabilidad ni a cobros efectivos.
- Los resultados remotos de [Verify 38327265116](https://github.com/M01535NT/fortius-inmuebles/actions/runs/38327265116) corresponden a `36e3ba64`: 499 pruebas backend, 211 de panel, 12 de herramientas y 101 de navegador, según la evidencia registrada. No son pruebas nuevas de esta limpieza ni pruebas en dispositivos físicos.
- La conexión de la vista previa de `codex/erp-crm-preview` a la base actual y el uso de la clave privada del servidor fueron autorizados expresamente; las tres variables de esa vista previa están limitadas a esa rama. Después se autorizó publicar los cambios de diseño del panel en el sitio principal. Esa autorización no incluye compras, correos de prueba ni cambios automáticos a datos productivos.
- Esa vista previa comparte los datos reales; no es un entorno aislado. Las comprobaciones de esta conexión se limitan a lecturas y solicitudes de acceso sin crear cuentas, modificar expedientes ni enviar correos. Las demás ramas conservan la separación descrita en `docs/erp-crm/environment-release.md`.

## Primera fase — preparar la base y comprobarla

Corresponde a la fase 0 de continuidad. Sus correcciones de código ya existen; ahora se ordena el área de trabajo y se comprueba la base antes de ampliar el CRM.

- [x] Reunir alcance, tareas y avance en este archivo, sin perder condiciones de los planes originales.
- [x] Respaldar documentos anteriores, respaldos locales y temporales fuera de la carpeta, con verificación de cada archivo antes de retirarlos.
- [x] Retirar planes e informes históricos de la carpeta activa y actualizar todos los enlaces afectados.
- [x] Repetir lint, tipos, pruebas de aplicación y compilación mediante `npm run verify`.
- [x] Ejecutar `node --test tests/tools/*.test.mjs` y `node tools/verify-pdf-bundle.mjs`.
- [x] Revisar de forma independiente el plan, la limpieza, la preservación y el resultado real de las comprobaciones.

**Para terminar la preparación local:** un solo plan vigente, copia recuperable comprobada, enlaces válidos, pruebas/build aprobados y revisión independiente. Esto permite continuar desarrollo con datos sintéticos; no acredita todavía las compuertas externas siguientes.

| Entrega de continuidad | Lo disponible | Lo que sigue pendiente |
|---|---|---|
| BAS-01 | Correcciones de fundamentos integradas y verificadas en su commit; preparación local comprobada. | Aceptación de negocio del alcance. |
| REC-01 | Export de 18 tablas, huellas, referencias, ensayo DB y copia de bytes local. | Custodia y copia periódica efectiva; recuperación completa Auth/Storage en destino aislado; medir RPO/RTO. Objetivos aprobados: copia diaria, RPO 24 h y RTO 8 h. |
| CI-01 | Checks Vercel y pruebas de bloqueo/paso a verde documentados. El 17/10/2026 se creó en GitHub la regla «main exige verify» (el check Verify debe aprobarse antes de fusionar) y se activó el auto-merge del repositorio. Comprobada el 25/10/2026: el PR #50 quedó bloqueado mientras Verify fallaba y se integró al aprobarse; el titular decidió conservarla. Desde el 25/10 el agente solo activa auto-merge cuando el titular aprueba publicar (I-04 en `AGENTS.md`). | Rollback de aplicación. |
| ENV-01 | Inventario de despliegues y retiro de credenciales productivas de previews documentados. | Backend preview aislado y dependencias del despliegue adicional. |
| AUT-01 | Auth y recuperación de sesión implementados; URL de retorno corregida según el registro. | Buzón controlado, entrega real de recuperación/invitación y política MFA recuperable. |
| OBS-01 | Identificador de solicitud y logs sin cuerpos/secretos comprobados en pruebas. | Captura, retención y alertas del proveedor. |
| PRV-01 | Inventario del tratamiento y propuesta de controles. | Aprobación profesional de finalidad, conservación, solicitudes y responsabilidades. |

El ensayo completo del proveedor no frena el desarrollo funcional inicial con datos sintéticos, conforme a la prioridad ya registrada. Sí es necesario antes de prometer recuperación de información operativa importante. Los pendientes de permisos, privacidad y publicación tampoco se presentan como cerrados por pasar una prueba local.

## Siguiente fase — captación dentro del panel

*Nota del 17/10/2026: el orden vigente está en «Dirección del producto y reglas vigentes».*

Después de la preparación local, comenzar por relaciones persona/inmueble (REL-01), permisos (SEG-01), equipo (USR-01), captación/conversión (CRM-01), expediente y próxima acción (OPS-01), publicación separada (PUB-01) e importación validada (DAT-01).

Antes de convertir propuestas en reglas efectivas, resolver DEC-02/03/04/05/09: recorrido inicial, capacidades, papeles/representación, criterios de avance y fuente de verdad. La aprobación general del ERP no decide por sí sola esas reglas. Se pueden preparar pruebas y diseños locales; no activar una política nueva por inferencia.



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

## Decisiones propuestas y decisiones de negocio pendientes

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
| DEC-20 | Qué hace falta para liberar el PDF del contrato 09 | El titular define si basta su plantilla registrada (vía FCH-10) o qué cotejo externo se requiere (DOC-09). |
| DEC-21 | Aviso de edición simultánea (NAV-11) | El titular decide si se hace; requiere presencia en tiempo real. |
| DEC-22 | Lista final de preguntas de la entrevista por tipo de operación | El titular valida la lista base de «Proceso, captura y documentos» antes de CAP-03. |
| DEC-23 | Contenido de los procesos y módulos de fábrica | El titular (y revisión jurídica cuando aplique) valida requisitos y documentos de cada proceso y módulo antes de MOT-04. |
| DEC-24 | Metas de las pruebas de uso | El titular fija los tiempos meta (por ejemplo, primer contacto en menos de un minuto) antes de medir (RP-47). |
| DEC-25 | Lugar de «Notas del equipo» | **Decidida el 17/10/2026:** se retira la página aparte; notas en un botón discreto del inmueble y de la operación (RP-99). |
| DEC-26 | Aprobación de la matriz de reglas por ruta (MRP-01) | El titular la revisa y aprueba antes de COR-04 y MOT-01. **Aprobada el 26/10/2026.** |
| DEC-27 | Nombres sencillos de los requisitos (RP-86) | El titular confirma los textos nuevos de firma, pagos y privacidad antes de COR-07. |
| DEC-28 | Detalles de prospecto y cliente (RP-90 a RP-92) | **Decidida el 17/10/2026:** el titular respondió los grupos A y B de [`docs/erp-crm/CUESTIONARIO_TITULAR.md`](docs/erp-crm/CUESTIONARIO_TITULAR.md); quedan en RP-90 a RP-98. Pendiente solo agregar al catálogo el contrato de intermediación para renta (RP-97). |
| DEC-29 | Formas de pago, tipos de inmueble y municipios (B-06, B-07) | El titular manda la lista de pasos y documentos de cada forma de pago y de cada tipo de inmueble y municipio; el agente la ordena en una tabla para su aprobación. Alimenta MRP-01 y MOT-02. |
| DEC-30 | Validez jurídica de la firma electrónica propia (FIR-01) | El abogado de Fortius confirma para qué contratos sirve en Baja California y qué evidencia debe guardarse, antes de usarla con clientes. Mientras, se firma en papel y se sube el archivo (RP-97). |
| DEC-34 | Plan de comercialización 10 | **Decidida el 29/10/2026:** el 10 sigue la plantilla del 26/10/2026 (`04_Metodologia/02_Comercializacion/10_PlanComercializacion.docx`), un formulario con casillas que reemplaza el plan en prosa anterior. Cambios aprobados: el tipo de inmueble usa los siete tipos de DEC-32 en lugar de las cuatro casillas del Word; el panel calcula el precio promedio por m² construido de los comparables y el precio técnico (promedio por la construcción del inmueble); «Baños (completos / medios)» son dos datos; al crearlo se proponen superficies, recámaras, baños, clave catastral, folio real, valor del 07 y datos del contrato 09. Se quitaron los apartados en prosa que el Word ya no trae (estrategia, plazas o conjuntos, aprobación con acuse). Código en `src/lib/formatos/plan.ts` y `src/lib/formatos/documento/plan.ts`. |
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

## Gobierno del proyecto

- **Decisor y aceptación de negocio:** Moisés Núñez Tonalá.
- **Responsable de ingeniería por entrega:** el agente de desarrollo, en el checkout autorizado. No marcar aceptación humana desde una prueba automática.
- **Revisor jurídico/fiscal/contable:** profesional que designe Fortius. Su revisión es dependencia cuando la entrega fija reglas de esas materias.
- **Usuarios piloto:** el equipo de Fortius (PIL-01), con pruebas de uso medidas (RP-47). Datos sintéticos hasta la autorización expresa del piloto real. El piloto externo (PIL-02) es de la etapa posterior, en pausa.
- **Enfoque:** entregas incrementales, un recorrido verificable por vez. Una tarea de implementación en curso y otra como máximo en revisión. Las dependencias externas se registran aparte.
- **Cadencia:** revisión al finalizar cada iteración; recalibración de la siguiente con evidencia. No llamar al trabajo individual Scrum ni dar fechas firmes sin capacidad y accesos.

## Orden y ventanas orientativas

Ventanas expresadas en días de ingeniería: no son días calendario ni promesas del agente. Supuestos: una persona de ingeniería, infraestructura actual, revisión de negocio disponible, datos de prueba y sin nuevas integraciones de pago. Los rangos no se suman automáticamente; hay solapamientos y varias entregas ampliables.

| Fase | Resultado utilizable | Ventana inicial | Criterio para terminar |
|---|---|---|---|
| 0 — Continuidad | Base recuperable, publicación controlada, datos clasificados y errores rastreables | 8–14 días | Correcciones consolidadas, restauración aislada, política de datos y controles de producción demostrados; bloqueos externos identificados. |
| 1 — Núcleo CRM/operación | Equipo administrable, captación completa, partes relacionadas y próxima acción | 12–20 días | Recorrido prospecto/cliente/inmueble/expediente/tarea con permisos, cuentas y trazabilidad. |
| 2 — Ejecución especializada | Visitas, ofertas, documentos, revisiones y cierre | 12–24 días | Requisitos y excepciones aprobados; oferta y cierre conectados al expediente. |
| 3 — Finanzas y tableros | Hechos financieros y cuatro vistas con desglose | 15–30 días | Totales reconciliados; cifras sin fuente explícitamente pendientes; acceso por capacidad. |
| 4 — Producto multidispositivo | Interfaz consistente e instalación del panel | 8–16 días para uso conectado | Pruebas reales por plataforma, teclado, accesibilidad, sesión y conexión. Offline/push aparte. |
| 5 — Escala y adopción | Consultas por necesidad, continuidad y piloto aceptado | 8–16 días | Carga medida, restauración repetible, manual y recorrido de usuario aceptado. |
| 6 — Nuevas capacidades | Inversión, mapas, portal de clientes, IA documental y asistente IA; demás extensiones según caso de negocio | Por capacidad; rangos por estimar | Las capacidades solicitadas tienen alcance, costo y aceptación propios. Deben completarse para aceptar el producto ampliado; el núcleo se acepta por separado. |
| Etapa posterior (en pausa) | Adaptación para otras inmobiliarias: datos separados, marca por empresa, procesos adaptados por empresa, alta de empresas, planes y piloto externo | Por estimar cuando el titular la abra (DEC-15) | Dos o tres inmobiliarias externas operan en piloto con datos separados, recorridos aceptados y tiempos medidos. |

M1: operación de captación utilizable tras fases 0–1. M2: operación de venta de extremo a extremo tras fase 2. M3: dirección con tableros tras fase 3. M4: versión operativa instalable y transferida tras fases 4–5, con pruebas de uso en meta. La venta a otras inmobiliarias no es un hito actual. Se puede adelantar UX y prueba de dispositivos de un módulo desde su primera entrega; UX-03 y UX-04 pueden empezar ya.

Ruta principal (referencia; manda «Orden vigente»): BAS-01 → REL-01/SEG-01 → CRM-01/CRM-02 → OPS-01 → COM-01/DOC-01/LEG-01/TEC-01 → FIN-01 → TAB-01 → PIL-01. El detalle y el orden por bloques están en «Orden vigente». Recuperación REC-01, permisos SEG-01 y controles CI-01 son condiciones para pilotar datos sensibles en producción.

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

## Backlog base: entregas y pruebas

Prioridad P0 = continuidad/protección; P1 = núcleo diario; P2 = completar producto; P3 = extensión condicionada. **I** indispensable, **C** conveniente, **O** opcional. Estimaciones por entrega son esfuerzo bruto orientativo; la fase ya contempla su combinación.

### Fase 0 — continuidad

| ID / clase | Entrega / problema | Archivos o ámbito | Dependencias / esfuerzo | Aceptación verificable |
|---|---|---|---|---|
| BAS-01 P0/I | Separar base Git, cambios locales y estado publicado; consolidar correcciones preparadas | `PLAN_ERP_CRM.md`, diff actual, workflow/tests/HTTP/contratos | Ninguna; 1–2d | Lista exacta de cambios revisados; verificaciones repetidas; no incluir secretos/test-results/copias. |
| REC-01 P0/I | Recuperación completa y objetivos RPO/RTO | backup/export/restore-current, `docs/fortius-inmuebles-backup-restore.md`, Auth y Storage | DEC-06/10; 2–4d más acceso | Snapshot aislado consistente, archivos/hashes/referencias reconciliados; tiempos medidos; incluir qué NO se pudo restaurar. |
| CI-01 P0/I | Evitar publicación con checks fallidos | `.github/workflows/verify.yml`, GitHub/Vercel | BAS-01, DEC-10; 1–2d | Una PR controlada fallida no puede llegar a producción por el flujo aprobado; rollback de aplicación probado. |
| AUT-01 P0/I | Recuperación/invitación y MFA acordados | `backend/auth.ts`, Auth config, pantalla de acceso | DEC-03/10; 1–3d | Cuenta de prueba recibe y completa flujo; recuperación de segundo factor ensayada antes de exigirlo. |
| OBS-01 P1/I | Detectar y seguir incidentes sin PII | `backend/http.ts`, health, configuración de logs | BAS-01, DEC-10; 1–2d | 5xx controlado correlacionado por requestId; alerta/retención comprobadas; no cuerpo/secretos en logs. |
| ENV-01 P0/I | Confirmar aislamiento y retirar ambigüedades de despliegue | ámbitos Vercel, Supabase, proyecto antiguo | DEC-09/10; 1–2d | Preview usa datos/credenciales acordados; no retirar proyecto antiguo antes de comprobar dominios/Auth/tráfico. |
| PRV-01 P0/I | Clasificación, minimización, retención y gestión de solicitudes de privacidad | contratos/documentos/Storage, políticas operativas y avisos existentes | DEC-06, revisión jurídica; 2–4d | Matriz de datos/finalidad/acceso/plazo aprobada; exportación/corrección/disposición autorizadas sin romper trazabilidad ni obligaciones de conservación. Verificar normas vigentes y aplicabilidad, no inferir cumplimiento. |

### Fase 1 — núcleo operativo

| ID / clase | Entrega / problema | Archivos o ámbito | Dependencias / esfuerzo | Aceptación verificable |
|---|---|---|---|---|
| REL-01 P1/I | Persona con varios papeles, representantes y varios propietarios por inmueble; datos de organización | personas nuevo, clientes/propiedades/expedientes, migración aditiva | DEC-04/09, BAS-01; 3–5d | Vínculo versionado y con fuente; no certificar titularidad; persona no se duplica por papel. Legacy sigue legible. |
| SEG-01 P0/I | Matriz de capacidades por función y por registro | identity nuevo, auth, staff, RLS y Storage | DEC-03, REL-01; 3–5d | Dos asesores, administrador y capacidad especializada probados en API/DB; reasignación elimina acceso indebido. |
| USR-01 P1/I | Administrar cuentas del equipo desde el panel | nueva vista/API de personal, perfil asesor y adviser-accounts | SEG-01/AUT-01; 3–5d | Invitar, vincular y desactivar personal con trazabilidad; perfil público separado de cuenta; evitar dejar cero administradores activos; no pedir ni mostrar contraseña del usuario. **Flujo pedido por el titular (17/10/2026, J-01):** en Equipo, el administrador captura nombre completo, celular, correo y rol (con sus permisos), registra el convenio de confidencialidad y envía la invitación por correo. La persona abre el enlace, crea su usuario y contraseña, responde un captcha (Cloudflare Turnstile) y confirma su celular con un código por SMS (proveedor de pago conectado a Supabase); si no se puede, con una app de códigos. Al entrar por primera vez, el panel le da la bienvenida y lo guía a subir su foto y escribir su biografía, que edita él mismo. Las invitaciones salen por un servicio de correo propio, no por el correo de prueba de Supabase. Es condición para las pruebas de uso (USO-01). |
| CRM-01 P1/I | Captar, calificar, abrir operación y programar próxima acción; coincidencias revisables; la condición de cliente sale del contrato firmado (RP-90) | leads/clientes/lead-profile, conversion, followups | REL-01, SEG-01; 3–5d | Conversión idempotente, fuente/consentimiento trazados, sin fusión automática por teléfono; convertir no muestra «Cliente» sin contrato firmado. |
| OPS-01 P1/I | Expediente como operación coherente y centro de trabajo | operaciones nuevo, expedientes, tareas/eventos/related-work | DEC-02/05, CRM-01; 3–5d | Contexto compartido y enlaces durables; conflicto conserva captura; tarea vincula expediente explícitamente. |
| PUB-01 P1/I | Inventario interno separado de publicación; captación web conectada | property-form, public.ts, `/api/public/leads`, layout config | SEG-01, CRM-01; 2–4d | Alta no publica; datos privados no aparecen en web/PDF; formulario sintético llega al CRM si se autoriza activar captación. Demo se conserva. |
| PUB-02 P1/I | Inmuebles compartidos de otra inmobiliaria: alta desde Herramientas, marca «Compartido», aliado externo ligado, autorización escrita adjunta y comisión estimada rotulada (RP-95) | inventario, property-form, public.ts, finanzas | PUB-01; 2–4d | Sin autorización adjunta no se publica; el sitio no muestra datos del propietario; la comisión estimada no se suma a lo cobrado. |
| DAT-01 P1/I | Revisar datos heredados e importaciones/exportaciones permitidas | validadores/domain, utilidades de importación y reporte de simulación | REL-01/SEG-01/PRV-01; 2–4d | Simulación sin escrituras detecta referencias ambiguas, duplicados y errores; usuario decide fusiones; ejecución idempotente y export restringido. Nunca importar ejemplos como actividad real. |
| CRM-02 P1/I | Registro rápido de contacto, siguiente paso obligatorio, plantillas de mensaje y reloj de primera atención (RP-21 a RP-23) | contactos, fichas, followups, tareas | CRM-01; 3–5d | Registrar un contacto en dos toques; sin siguiente paso pide fecha o motivo. La plantilla abre WhatsApp o correo y el envío no se registra hasta que el asesor lo confirma. El reloj usa la definición de «Primera atención». |
| CRM-03 P1/C | Ficha 360° de la persona con línea de tiempo unificada (RP-27) | fichas de prospecto y cliente, historial, eventos, tareas, documentos, ofertas | REL-01, CRM-02; 3–5d | Cada hecho aparece una sola vez, con fuente y enlace; filtros por tipo; respeta permisos. |
| INV-01 P1/C | Salud del inmueble, alertas de precio e historial de precio (RP-28) | propiedades, historial de cambios, eventos, ofertas, Comparables | PUB-01; 2–4d | Indicadores con fuente; umbrales ajustables en Configuración; historial de precio con autor, fecha y motivo; la alerta abre Comparables con el inmueble. |
| DAT-02 P1/I | Calidad de captura: validaciones, catálogo de colonias, montos con moneda y fusión asistida (RP-40 a RP-43) | validadores, formularios, catálogo SEPOMEX con fecha de corte, personas | REL-01, DAT-01; 3–6d | Mensajes de validación claros; catálogo con fecha de corte y «otra» marcada; fusión campo por campo con historial y deshacer, nunca automática. |

### Fase 2 — operación de venta y revisiones

| ID / clase | Entrega / problema | Archivos o ámbito | Dependencias / esfuerzo | Aceptación verificable |
|---|---|---|---|---|
| COM-01 P1/I | Conectar cartera/oportunidad/expediente sin duplicar hechos | comercial server/types, operación y vínculos SQL | OPS-01, DEC-05/09; 3–5d | Reconciliar vínculos por ID; las ponderaciones de la cartera no se presentan como probabilidad (el pronóstico por etapa es FIN-03); libro emitido histórico intacto. |
| VIS-01 P1/I | Visita con resultado, asistencia, autorización y próxima acción; captura desde el celular (RP-25) | calendario/eventos, formato 13, operación, informe al propietario | OPS-01; 2–4d | Visita programada distinta de realizada/cancelada; llegada, opinión del comprador y foto en menos de un minuto; alimenta el informe al propietario; no contar doble al corregir; acceso y seguimiento correctos. |
| OFE-01 P1/I | Ofertas/contraofertas como línea de tiempo, vigencia y respuesta autorizada (RP-26) | formato 14/oferta, operación, historial | COM-01, VIS-01; 3–5d | Versiones, vencimiento de cada oferta y diferencia contra el precio de salida; respuesta del propietario identificada; acuerdo comercial no se presenta como contrato firmado. |
| DOC-01 P1/I | Unificar fuente documental/revisión/emisión/copia firmada | formatos catalog/server/API, assets, snapshots | OPS-01, SEG-01; 3–6d | Hash/versión verificables; cambio invalida revisión afectada; firma capturada no equivale a firma electrónica. |
| LEG-01 P1/I | Requisitos, hallazgos, excepciones y conclusión profesional por etapa | juridica, formato 05/06, transitions propuesto | DOC-01, DEC-05, revisión jurídica; 3–5d | Recibido/revisado separados; no avanzar por casilla vacía; excepción tiene autor, fundamento y fecha. Modelo 09 sigue bloqueado hasta cotejo externo requerido. |
| TEC-01 P1/I | Levantamientos y discrepancias con fuente/fecha/evidencia | levantamiento y variantes 04, assets, property facts | DOC-01; 3–5d | Superficies no se mezclan ni suman indebidamente; medición, declaración y dato documental diferenciados; foto vinculada. |
| COR-01, COR-02 P0/I | Fallas: el nombre del propietario y el tipo de inmueble no llegan al 07 (y el nombre al 08 y 10) | ver «Proceso, captura y documentos» | ninguna; menos de 1d | Pruebas de llenado automático para cada caso. |
| CAP-01 a CAP-04 P1/I | Llamada en menos de un minuto, aviso y cita, entrevista por momentos con preguntas ampliadas, cierre y modo cita (F01–F09) | ver «Proceso, captura y documentos» | dependencias en su tabla; 1–3d por entrega | Aceptación en su tabla. |
| FCH-01 a FCH-11 P1/I | Ficha única, documentos que leen de ella, descarga con advertencia, expediente en un archivo, membrete, plantillas propias, dictamen con párrafos (F10–F23) | ver «Proceso, captura y documentos» | FCH-01 con REL-01 y migración; 1–5d por entrega | Aceptación en su tabla. |
| MOT-01 a MOT-04 P1/I | Motor de procesos por tipo de operación con módulos y editor | ver «Proceso, captura y documentos» | FCH-01; migración; por estimar tras MOT-01 | Aceptación en su tabla; la versión 1 reproduce exactamente los candados actuales. |
| HER-01 a HER-04 P1/C | Herramientas para trabajo suelto: catálogo depurado, machotes y documentos sin operación, ISR y neto, pasar a operación (RP-83) | ver «Herramientas para trabajo suelto (HER)» | dependencias en su tabla; catálogo confirmado el 18/10/2026 | Aceptación en su tabla. |
| CIE-01 P1/I | Condiciones, formalización, entrega, pendientes y archivo | formatos 15/16/17, operación, transiciones | OFE-01/LEG-01/TEC-01; 3–5d | Cierre comercial/documental/cobro distintos; entrega con evidencia; poscierre pendiente no desaparece por cerrar. |
| DOC-10 P1/C | Revisión lado a lado (RP-35) | operación guiada, visor de PDF e imagen, panel «Marcar como revisado» | DOC-01; 2–4d | En computadora se ve el documento y se captura la revisión sin cambiar de pantalla; en celular se alterna sin perder la captura. |
| DOC-11 P1/C | Carga de varios archivos con requisito propuesto (RP-36) | carga de archivos, requisitos de la operación | DOC-01; 2–3d | Se arrastran varios archivos; se propone el requisito por tipo y nombre y la persona confirma; ningún archivo queda revisado por cargarse. La propuesta por contenido llega con EXT-11. |
| DOC-12 P2/C | Pedir un documento al cliente por liga segura (RP-37) | ruta pública acotada, Storage privado, requisitos | DOC-01, SEG-01, PRV-01; 3–5d | Liga con vencimiento y revocable que solo permite subir a ese requisito; lo recibido queda «Lo tengo»; la liga no da acceso a ningún otro dato. |
| DOC-13 P1/C | Tablero de vencimientos de Fortius (RP-38) | «Pendientes documentales», requisitos con vigencia | DOC-01; 1–3d | Lista por fecha y responsable que enlaza a cada requisito; respeta permisos. |
| DOC-14 P1/C | Formatos de contrato nuevos a partir de los modelos del titular: compraventa a plazos, compraventa con reserva de dominio, arrendamiento e intermediación para renta (RP-97); cotejo de la promesa 15 contra su modelo | catálogo de formatos, captura en ventana, PDF y Word | Modelos del titular; 2–4d por formato | Cada formato reproduce su plantilla, se captura en el sistema y se descarga en PDF y Word. |
| FIR-01 P1/C | **Firma electrónica propia, sin proveedor de pago** (titular, 17/10/2026): liga personal enviada por WhatsApp o correo; el firmante ve el contrato completo, confirma su identidad con un código enviado a su correo o teléfono y firma con el dedo o escribiendo su nombre; el sistema guarda fecha y hora, código verificado, dirección de conexión y huella SHA-256 del PDF, y agrega al PDF una hoja de evidencia. La firma así registrada cumple la prueba de RP-97. Uso previsto: intermediación y acuse del aviso; promesa y arrendamiento si el abogado lo confirma; nunca la compraventa definitiva, que va ante notario. La constancia NOM-151 queda opcional. | ruta pública acotada, Storage privado, formatos, firma registrada (COR-10) | COR-10, DOC-01, PRV-01, DEC-30; 4–6d | Un firmante sin el código no puede firmar; cualquier cambio al PDF después de firmar se detecta con la huella; la hoja de evidencia acompaña al PDF; la liga vence y se puede revocar. |
| SUB-01 | **Descartada (titular, 29/10/2026):** ya no se sube cada formato hecho a mano; la reemplazan DOC-EXP, DAT-EXP e IA-01. | — | — | — |
| DOC-EXP P1/I | **Documentos del cliente (titular, 29/10/2026; entrega 1):** pestaña «Documentos del cliente» en cada operación, un solo repositorio sin categorías para todo lo que entrega el cliente (escritura, certificado de libertad de gravámenes, avalúo, CURP, identificación, poderes, predial, agua, actas). Varios archivos a la vez, desde la computadora o el celular (elegir o tomar foto); el nombre del archivo queda como título editable; papelera recuperable. Privados en `fortius-inmuebles-expedientes`, con SHA-256, quién y cuándo. | pestaña de la operación, tabla `fortius_inmuebles_expediente_archivos`, rutas `/api/admin/expedientes/[id]/archivos` y `/api/admin/archivos-cliente/[id]` | **Hecha en la rama `feat/levantamiento-04b-en-vivo`, sin integrar; migración sin aplicar** | Solo quien tiene acceso al expediente ve o descarga (prueba de RLS); la descarga comprueba el SHA-256; mandar a la papelera no borra. |
| DAT-EXP P1/I | **Datos del expediente (titular, 29/10/2026; entrega 2):** un diccionario único (`src/lib/formatos/datos-expediente.ts`) con cada dato del cliente y del inmueble y las claves que lo reciben en cada formato (propietario, apoderado, inmueble, escritura y registro, adeudos, avalúo). Panel «Datos del expediente» en la pestaña: cada dato con valor, estado («Por confirmar» o «Confirmado») y fuente; se confirma **una vez por expediente** (decisión del titular). Lo confirmado llena solo celdas vacías de los formatos existentes y de los nuevos; **lo escrito por una persona se respeta** (decisión del titular): la ventana del formato avisa «aquí dice X; el expediente tiene Y» con «Usar el del expediente». Nunca llena consentimientos, firmas, decisiones ni conclusiones jurídicas. | tabla `fortius_inmuebles_expediente_datos` (versión y 409), ruta `/api/admin/expedientes/[id]/datos`, ventana en vivo | **Hecha en la rama, sin integrar; migración sin aplicar** | Confirmar un dato llena los formatos vacíos; un campo con otro valor no cambia y aparece el aviso; un conflicto de versión recarga sin pisar. |
| IA-01 P0/I | **La IA lee los documentos del cliente (titular, 17/10/2026, rehecho el 29/10/2026; entrega 3):** al subir un archivo, o con «Leer con IA», el servidor envía el PDF o la imagen a la API de Claude con una estructura fija de respuesta (los datos de DAT-EXP que encontró, con página, frase citada y confianza), validada con zod. Lo leído entra **por confirmar** con su fuente en «Datos del expediente»; nada llega a un formato sin confirmación. **Regla del titular (29/10/2026): en pantalla nada dice «propuesto» ni que algo fue propuesto o creado por la IA** (lo leído se muestra «Por confirmar», el botón es «Leer datos» y los errores hablan del «servicio de lectura»); una prueba del panel lo comprueba. Estado por archivo: pendiente, leyendo, leído o con error. La clave `ANTHROPIC_API_KEY` vive solo en el servidor. | Storage privado, DAT-EXP, ruta `/api/admin/archivos-cliente/[id]/leer`, migración `20261029140000_expediente_lecturas_ia.sql` | **Hecha en la rama, sin activar:** falta la clave de API del titular y el visto bueno del abogado antes de usarla con documentos reales; migración sin aplicar | Con respuestas simuladas, los datos salen con su fuente, una respuesta mal formada se rechaza y sin clave el resto funciona igual. |
| IA-02 P1/I | **Controles de la IA (entrega 4):** tope mensual de lecturas en «Ajustes» (al llegar, se pausa y avisa), registro de cada lectura (archivo, fecha, quién, costo aproximado), anotación del proveedor como encargado en `docs/erp-crm/privacy/data-processing-register.md` y en la política de acceso. **En la rama:** el tope (variable `IA_TOPE_MENSUAL_USD`, 20 USD si no se configura), el registro `fortius_inmuebles_ia_lecturas` y la anotación en el registro de tratamiento. **Falta:** cambiar el tope y ver el gasto del mes desde «Ajustes». | Ajustes, tabla de uso, documentación de privacidad | IA-01; 1d | Al llegar al tope no se lee más y se avisa; cada lectura queda registrada. |
| DOC-15 P1/I | **Biblioteca de listas de documentos por situación** (titular, 17/10/2026, L-01): el director captura y edita listas por caso (propietario de casa, terreno o nave; comprador; arrendatario; y otras), con vista previa y descarga en PDF. Cada operación toma su lista de la biblioteca; ahí solo se marca «No aplica» o se agrega un documento. | configuración, lista de documentos (COR-06), formatos | COR-06; 2–4d | Cambiar una lista en la biblioteca cambia las operaciones nuevas, no las ya abiertas; la vista previa coincide con el PDF. |

### Fase 3 — finanzas y tableros

| ID / clase | Entrega / problema | Archivos o ámbito | Dependencias / esfuerzo | Aceptación verificable |
|---|---|---|---|---|
| FIN-01 P1/I | Registro de hechos financieros por operación y empresa | operational-finance nuevo, SQL, evidencias privadas | DEC-07, OPS-01/DOC-01/SEG-01; 4–7d | Estimado/pactado/facturado/cobrado separados; obligación/pago parcial/anulación identificados; importes decimales y monedas conservados. |
| FIN-02 P1/I | Egresos, presupuestos, honorarios y repartos revisables | operational-finance, formatos 08/18/19, comercial | FIN-01 y revisión fiscal; 3–6d | No duplicar pagos/directos; no reconocer honorario por cierre sin regla; periodos/TC fuente; sin custodia ni banco automático. |
| TAB-01 P1/I | Contrato común de métricas, filtros y desglose | analytics nuevo; reportes/admin | SEG-01/CRM-01 y definiciones aprobadas; 2–4d | Total = registros detallados autorizados, fecha/corte/fuente/pendientes; demo excluido del operativo por defecto pero visible. Contrato se puede preparar antes de finanzas; cada widget espera su propia fuente. |
| TAB-02 P1/I | Comercial accionable | dashboard/Today/reportes, analytics | CRM-01/COM-01/VIS-01/TAB-01; 2–4d | Cohortes y primera atención explícitas; venta no equivale a conversión de lead; pendientes enlazan acción. |
| TAB-03 P1/I | Financiero por operación, moneda y periodo | nueva vista financiera, analytics | FIN-02/TAB-01; 3–5d | Cobros conciliados vs potencial; no sumar monedas sin conversión válida; detalle y export reconciliados. |
| TAB-04 P1/I | Jurídico y técnico con pendientes por responsable | nuevas vistas y queries | LEG-01/TEC-01/TAB-01; 3–5d | Estados derivados de revisión explícita; sin dictamen automático; hallazgo lleva a su evidencia. |
| FIN-03 P2/C | Pronóstico de ingresos por mes (RP-30) | analytics, operaciones, configuración de etapas | FIN-01, DEC-17; 2–3d | Rotulado «Estimación»; probabilidades por etapa ajustables en Configuración; nunca se suma a lo cobrado. |
| APR-01 P1/I | Aprobaciones con bandeja (RP-31) | solicitud de aprobación, bandeja «Para ti», comisiones y requisitos protegidos | SEG-01, FIN-02, UX-05; 3–5d | Solicitud con motivo; aprobador según rol; constancia del resultado; el servidor no aplica la acción antes de aprobarse. |
| TAB-05 P2/C | Metas por asesor y tableros por rol (RP-33, RP-34) | metas por periodo, TAB-02 | TAB-01, DEC-17; 2–3d | Metas por asesor y periodo; avance calculado desde registros; comparación con el periodo anterior y con la meta; tiempo promedio por etapa e inventario envejecido con desglose. |
| FIS-01 P1/I | Reglas fiscales y notariales con vigencia, por municipio donde opera Fortius (RP-06) | catálogo de reglas, calculadoras, neto del propietario, costos de cierre | Revisión fiscal (R-03); 3–5d | Cada regla con municipio, vigencia, fuente y responsable; sin regla vigente el cálculo dice «pendiente»; cambiar una regla no altera documentos ya emitidos. |

### Fases 4–5 — interfaz, escala y adopción

| ID / clase | Entrega / problema | Archivos o ámbito | Dependencias / esfuerzo | Aceptación verificable |
|---|---|---|---|---|
| UX-01 P1/I | Sistema de interfaz y captura comprensible en todos los módulos | admin/UI/shell/form-section/formularios | Desde fase 1; 3–6d iniciales | Contraste y jerarquía; foco y teclado; estados cargando/vacío/error/conflicto/sin permiso; no pérdida silenciosa. |
| UX-02 P1/C | Búsqueda, vistas y preferencias guardadas en el servidor por usuario (RP-14); sin tablero personal armable (RP-66) | workspace/search/preferences, migración aditiva de preferencias | UX-01; 2–4d (la búsqueda en servidor a escala llega con PAG-01) | Filtra en servidor; densidad, columnas y vistas siguen al usuario entre equipos; el navegador solo guarda comodidades del dispositivo; orden accesible; una preferencia no altera permisos ni muestra widgets prohibidos. |
| UX-03 P1/C | Velocidad: barra de comandos, atajos, acciones masivas, edición en tabla, densidad y columnas (RP-09 a RP-13) | workspace/search, listas, kit | UX-01; 4–7d | Ctrl/Cmd+K busca y actúa solo con lo permitido; atajos documentados y desactivables, sin actuar dentro de campos; acciones masivas informan por registro y no duplican al reintentar; edición en tabla con control de versión; probado con teclado y lector de pantalla. |
| UX-04 P1/I | Confianza al guardar: estado de guardado, deshacer, conflicto lado a lado, siluetas y sesión vencida (RP-15 a RP-19) | kit, store, formularios | UX-01; 3–5d | Nunca «Guardado» antes de la confirmación del servidor; «Deshacer» solo donde el servidor restaura; conflicto campo por campo sin sobrescribir; sesión vencida conserva la captura. |
| SIM-01 a SIM-12 P1/I | Simplificación de la interfaz: las 32 correcciones C01–C32 aprobadas el 17/10/2026 (RP-50 a RP-57) | ver la sección «Simplificación de la interfaz (SIM)» | UX-01; SIM-01 primero; 1–3d por entrega | La aceptación de cada entrega está en su tabla; ninguna cambia reglas del servidor, permisos ni datos. |
| NAV-01 a NAV-14 P1/C | Navegación y productividad: las 25 mejoras N01–N25 aprobadas el 17/10/2026 (RP-58 a RP-69) | ver la sección «Navegación y productividad (NAV)» | dependencias por entrega en su tabla; 1–4d por entrega | La aceptación de cada entrega está en su tabla; NAV-12 lleva migración y NAV-14 espera PWA-03. |
| LV-01 a LV-04 P1/C | Lenguaje visual: las 10 mejoras V01–V10 aprobadas el 17/10/2026 (RP-70 a RP-74) | ver la sección «Lenguaje visual (LV)» | LV-01 junto con SIM-01; 1–3d por entrega | La aceptación de cada entrega está en su tabla; sin dependencias nuevas. |
| UX-05 P1/C | Bandeja «Para ti» en Hoy (RP-20) | Hoy, notas e historial, tareas; las aprobaciones se suman cuando exista APR-01 | UX-04; 2–4d (usa los permisos actuales y se ajusta con SEG-01) | Una mención avisa solo a quien puede ver el registro; el contador del menú suma la bandeja; marcar como leído; sin campana. |
| PWA-01 P1/I | Instalación y apertura del panel | manifiesto específico admin/layout/iconos | AUT-01/UX-01; 2–4d | Identidad/start_url/scope probados; inicia admin; acceso normal tras actualización; matriz real iOS/Android/iPad/Windows/macOS. |
| PWA-02 P2/C | Conectividad y captura de campo limitada | formularios, capa de conexión; SW solo alcance aprobado | PWA-01, DEC-08; 3–6d | Sin cache de API/Auth/PDF privados; caducidad/cierre de sesión; reintento no duplica. Offline de datos sensibles requiere diseño y aprobación adicionales. |
| PWA-03 P3/O | Notificaciones de tareas y citas con consentimiento | registro push por dispositivo, preferencias y disparador confiable | PWA-01/SEG-01/PRV-01 y canal acordado; 2–5d preliminares | Usuario opt-in; mensaje sin datos sensibles; horario operativo, revocación y duplicados probados; compatibilidad iOS instalada confirmada. No prometer entrega garantizada. |
| PAG-01 P1/I | Búsqueda/paginación de servidor y agregados | backend/repository, collections, expedientes, store y listas | SEG-01 y contratos por módulo; 4–7d | No descargar toda colección para una página; orden estable; RLS; filas sin pérdida ni duplicación; ningún cliente legacy se trunca. |
| ESC-01 P2/C | Medir volumen, consultas, concurrencia y PDFs | SQL/queries/tools, pruebas aisladas | PAG-01/FIN-01; 2–4d | Línea base y límites documentados; índices/locks/worker solo tras medición; integridad preservada. |
| PIL-01 P1/I | Piloto, capacitación, manual y soporte | pruebas/fixtures/docs, datos autorizados | Recorrido M2, tableros, continuidad y PWA; 3–6d más uso real | Recorridos aceptados por usuario; pruebas de uso medidas contra metas fijadas antes (RP-47); incidencias priorizadas; soporte/backup/responsable definidos; ningún módulo se declara terminado por tener pantalla. |
| SOP-01 P1/C | Soporte y ayuda dentro del panel (RP-48) | ayuda por pantalla, centro de ayuda, «Reportar un problema», recorrido inicial (coordinado con «Primeros pasos» de NAV-13, que es de NAV-13) | OBS-01; 2–4d | El reporte lleva contexto técnico sin datos personales; ayuda por pantalla; recorrido inicial que se puede saltar y retomar. |

### Etapa posterior — adaptación para otras inmobiliarias (en pausa)

No se trabaja en estas entregas hasta que el titular abra la etapa posterior (DEC-15). Se conservan para no perder el análisis.

| ID / clase | Entrega / problema | Archivos o ámbito | Dependencias / esfuerzo | Aceptación verificable |
|---|---|---|---|---|
| SAAS-01 P2/O | Empresa como frontera de datos (RP-02) | migración aditiva, RLS, Storage, folios, respaldo/restauración, búsqueda y cachés | DEC-15; por estimar | Con dos empresas sintéticas, ninguna lee, busca, exporta ni descarga datos de la otra por API, SQL directo, enlace o ID modificado. Fortius queda como empresa 1 sin cambiar sus datos. Folios por empresa; respaldo y restauración por empresa ensayados en aislado. |
| SAAS-02 P2/O | Marca por empresa (RP-03) | tema del panel, PDF y Word, correos, dominio o subdominio | SAAS-01; por estimar | Logo, colores y datos de documentos cambian sin tocar código; el contraste AA se valida al guardar el tema; cada documento sale con los datos de su empresa. |
| SAAS-03 P2/O | Adaptar por empresa los procesos del motor (RP-04) | motor de procesos (MOT), configuración por empresa | SAAS-01, MOT-03; por estimar | Cada empresa parte de los procesos de Fortius como plantilla y los ajusta sin afectar a otras; el resto lo cubre MOT. |
| SAAS-05 P2/O | Alta guiada de empresa e importación (RP-07) | asistente de alta, DAT-01, USR-01, SAAS-02/03 | SAAS-01 a SAAS-03, DAT-01, USR-01; por estimar | Una empresa sintética queda operando sin intervención técnica; la importación se simula y se revisa antes de escribir. |
| SAAS-06 P3/O | Planes, suscripción y límites (RP-08) | cobro, límites de usuarios y almacenamiento | SAAS-01, DEC-18; por estimar | Límites visibles con aviso previo; sin pago, solo lectura con exportación disponible; nunca se borran datos. |
| PIL-02 P2/O | Piloto con 2 o 3 inmobiliarias externas (RP-46) | empresas piloto con datos separados, guía de pruebas | SAAS-01 a SAAS-03, SAAS-05, PIL-01, REC-01, OBS-01; por estimar | Recorridos aceptados por cada empresa; tiempos medidos contra metas fijadas antes; incidencias priorizadas y cerradas antes de vender. |

## Estado y dependencias de cada entrega

Esta matriz conserva los 42 estados y dependencias explícitos del seguimiento original, incorpora tres entregas del producto ampliado (EXT-08, EXT-09 y EXT-10) y, desde el 17/10/2026, las 23 entregas de «Dirección del producto» las 12 del paquete SIM, las 14 del paquete NAV las 4 del paquete LV las 21 de «Proceso, captura y documentos» (COR, CAP, FCH y MOT) las 4 de «Herramientas para trabajo suelto» (HER) y los pendientes de formatos DOC-06 y DOC-09 y, desde el 18/10/2026, COR-03 a COR-09, MRP-01, USO-01 y COR-10 (prospecto y cliente), para un total de 135. **Estados revisados el 18/10/2026:** «parcial» significa que una parte ya existe — OPS-01 (tareas vinculadas a la operación y apertura transaccional desde la entrevista, 13/10), CRM-01 (conversión idempotente), PUB-01 (publicación condicionada a la operación de captación), DOC-01 (emisiones con huella, versiones y copia firmada), UX-01 (kit del panel guiado) y SIM-04 a SIM-06 (boceto C). Lo demás sigue pendiente aunque tenga piezas sueltas. Las seis de la etapa posterior figuran «en_pausa». EXT-06 ya contemplaba IA y RAG; ahora se concreta su alcance solicitado. Complementa las condiciones de negocio y pruebas del backlog; preparación local aprobada no cambia automáticamente una entrega a aceptada.

**Revisión del 26/10/2026.** Se agrega el estado **«terminada»**: la entrega está integrada en `main` y cumple su aceptación. Antes no existía, por eso los resúmenes contaban cero terminadas. LV-05 pasa a «terminada» (PR #45, #46 y #47) y MRP-01 a «en_revision» (borrador en «Matriz de reglas por ruta», espera DEC-26). El resto de los estados no se revisó contra el código en esta pasada.

**Entregas sin bloque en el «Orden vigente»** (el titular decide dónde van; el agente no las acomoda): COR-11 (compra y búsqueda de renta como lead), COR-12 (quitar PROFECO del 09), DOC-14, DOC-15, PUB-02 (inmuebles compartidos), FIR-01, EXT-13 (conexión a IA con tope) y LV-07 (tablero «Hoy» con el boceto D «Mosaico cálido»). EXT-12 (captura sobre el documento) entró al bloque 1 por decisión del titular (DEC-31, 27/10/2026). EXT-02, EXT-03, EXT-04 y EXT-07 sí están en el bloque 7, «solo por decisión de negocio».

| ID | Fase | Estado registrado | Depende de |
|---|---|---|---|
| BAS-01 | 0 | en_revision | Ninguna |
| REC-01 | 0 | en_revision | BAS-01 |
| CI-01 | 0 | bloqueada | BAS-01 |
| AUT-01 | 0 | bloqueada | BAS-01 |
| OBS-01 | 0 | en_revision | BAS-01 |
| ENV-01 | 0 | bloqueada | BAS-01 |
| PRV-01 | 0 | en_revision | BAS-01 |
| REL-01 | 1 | pendiente | BAS-01 |
| SEG-01 | 1 | pendiente | REL-01 |
| USR-01 | 1 | pendiente | SEG-01, AUT-01 |
| CRM-01 | 1 | parcial | REL-01, SEG-01 |
| OPS-01 | 1 | parcial | CRM-01 |
| PUB-01 | 1 | parcial | SEG-01, CRM-01 |
| DAT-01 | 1 | pendiente | REL-01, SEG-01, PRV-01 |
| COM-01 | 2 | pendiente | OPS-01 |
| VIS-01 | 2 | pendiente | OPS-01 |
| OFE-01 | 2 | pendiente | COM-01, VIS-01 |
| DOC-01 | 2 | parcial | OPS-01, SEG-01 |
| LEG-01 | 2 | pendiente | DOC-01 |
| TEC-01 | 2 | pendiente | DOC-01 |
| CIE-01 | 2 | pendiente | OFE-01, LEG-01, TEC-01 |
| FIN-01 | 3 | pendiente | OPS-01, DOC-01, SEG-01 |
| FIN-02 | 3 | pendiente | FIN-01 |
| TAB-01 | 3 | pendiente | SEG-01, CRM-01 |
| TAB-02 | 3 | pendiente | CRM-01, COM-01, VIS-01, TAB-01 |
| TAB-03 | 3 | pendiente | FIN-02, TAB-01 |
| TAB-04 | 3 | pendiente | LEG-01, TEC-01, TAB-01 |
| UX-01 | 4 | parcial | BAS-01 |
| UX-02 | 4 | pendiente | UX-01 |
| PWA-01 | 4 | pendiente | AUT-01, UX-01 |
| PWA-02 | 4 | pendiente | PWA-01 |
| PWA-03 | 4 | pendiente | PWA-01, SEG-01, PRV-01 |
| PAG-01 | 5 | pendiente | SEG-01 |
| ESC-01 | 5 | pendiente | PAG-01, FIN-01 |
| PIL-01 | 5 | pendiente | REC-01, CI-01, ENV-01, PRV-01, USR-01, DAT-01, CIE-01, TAB-02, TAB-03, TAB-04, PWA-01, PAG-01 |
| EXT-01 | 6 | pendiente | CRM-01, OPS-01 |
| EXT-02 | 6 | pendiente | FIN-02, CIE-01, LEG-01 |
| EXT-03 | 6 | pendiente | OPS-01, FIN-01 |
| EXT-04 | 6 | pendiente | OPS-01, PRV-01 |
| EXT-05 | 6 | pendiente | FIN-02, DOC-01, PRV-01 |
| EXT-06 | 6 | pendiente | DOC-01, LEG-01, PRV-01 |
| EXT-07 | 6 | pendiente | ESC-01 |
| EXT-08 | 6 | pendiente | FIN-02, TAB-01, OPS-01, SEG-01 |
| EXT-09 | 6 | pendiente | REL-01, TEC-01, VIS-01, SEG-01 |
| EXT-10 | 6 | pendiente | REL-01, OPS-01, DOC-01, SEG-01, AUT-01, PRV-01 |
| CRM-02 | 1 | pendiente | CRM-01 |
| CRM-03 | 1 | pendiente | REL-01, CRM-02 |
| INV-01 | 1 | pendiente | PUB-01 |
| DAT-02 | 1 | pendiente | REL-01, DAT-01 |
| DOC-10 | 2 | pendiente | DOC-01 |
| DOC-11 | 2 | pendiente | DOC-01 |
| DOC-12 | 2 | pendiente | DOC-01, SEG-01, PRV-01 |
| DOC-13 | 2 | pendiente | DOC-01 |
| FIN-03 | 3 | pendiente | FIN-01, DEC-17 |
| APR-01 | 3 | pendiente | SEG-01, FIN-02, UX-05 |
| TAB-05 | 3 | pendiente | TAB-01, DEC-17 |
| FIS-01 | 3 | pendiente | BAS-01; revisión fiscal |
| SIM-01 | 4 | pendiente | UX-01 |
| SIM-02 | 4 | pendiente | SIM-01 |
| SIM-03 | 4 | pendiente | SIM-01 |
| SIM-04 | 4 | parcial | SIM-01 |
| SIM-05 | 4 | parcial | SIM-01 |
| SIM-06 | 4 | parcial | SIM-01 |
| SIM-07 | 4 | pendiente | SIM-01 |
| SIM-08 | 4 | pendiente | SIM-01 |
| SIM-09 | 4 | pendiente | SIM-01 |
| SIM-10 | 4 | pendiente | SIM-01 |
| SIM-11 | 4 | pendiente | SIM-01 |
| SIM-12 | 4 | pendiente | SIM-01 |
| NAV-01 | 4 | pendiente | SIM-02, UX-02 |
| NAV-02 | 4 | pendiente | UX-03 |
| NAV-03 | 4 | pendiente | SIM-01, SIM-08 |
| NAV-04 | 4 | pendiente | UX-02, SEG-01 |
| NAV-05 | 4 | pendiente | UX-02, SIM-03 |
| NAV-06 | 4 | pendiente | CRM-02 |
| NAV-07 | 4 | pendiente | UX-04, SIM-07 |
| NAV-08 | 4 | pendiente | DOC-10, SEG-01 |
| NAV-09 | 4 | pendiente | CRM-02 |
| NAV-10 | 4 | pendiente | DOC-11, PUB-01 |
| NAV-11 | 4 | pendiente | Decisión del titular |
| NAV-12 | 4 | pendiente | Migración autorizada, PRV-01 |
| NAV-13 | 4 | pendiente | SIM-01 |
| NAV-14 | 4 | pendiente | PWA-03 |
| LV-01 | 4 | pendiente | SIM-01 (conjunta) |
| LV-02 | 4 | pendiente | LV-01, SIM-05 |
| LV-03 | 4 | pendiente | LV-02, UX-04 |
| LV-04 | 4 | pendiente | LV-01, SIM-12 |
| COR-01 | 2 | en_revision | rama `feat/mrp01-cor01-03` (26/10/2026), sin integrar |
| COR-02 | 2 | en_revision | rama `feat/mrp01-cor01-03` (26/10/2026), sin integrar |
| COR-03 | 2 | en_revision | rama `feat/mrp01-cor01-03` (26/10/2026), sin integrar |
| COR-04 | 2 | en_revision | rama `feat/levantamiento-04b-en-vivo` (29/10/2026); migración `20261029170000_camino_de_renta.sql` sin aplicar |
| COR-05 | 2 | pendiente | ninguna |
| COR-06 | 2 | en_revision | rama `feat/levantamiento-04b-en-vivo` (29/10/2026); sin migración |
| COR-07 | 2 | pendiente | ninguna |
| COR-08 | 2 | en_revision | rama `feat/levantamiento-04b-en-vivo` (29/10/2026); migración `20261029150000_informe_entregas.sql` sin aplicar |
| COR-09 | 2 | en_revision | rama `feat/levantamiento-04b-en-vivo` (29/10/2026); sin migración |
| COR-10 | 2 | pendiente | MRP-01 |
| COR-11 | 2 | en_revision | rama `feat/levantamiento-04b-en-vivo` (29/10/2026); migración `20261029160000_interesados_sin_operacion.sql` sin aplicar |
| PUB-02 | 3 | pendiente | PUB-01 |
| COR-12 | 2 | pendiente | modelo del 09 del titular |
| COR-13 | 2 | en_revision | migración en la rama `feat/mrp01-cor01-03`, sin aplicar en remoto (autorización del titular) |
| DOC-14 | 2 | pendiente | modelos del titular |
| FIR-01 | 6 | pendiente | COR-10, DOC-01, PRV-01, DEC-30 |
| DOC-EXP | 2 | en_revision | rama `feat/levantamiento-04b-en-vivo`, migración sin aplicar |
| DAT-EXP | 2 | en_revision | rama `feat/levantamiento-04b-en-vivo`, migración sin aplicar |
| IA-01 | 1 | en_revision | rama `feat/levantamiento-04b-en-vivo`, sin activar: clave de API del titular y visto bueno del abogado |
| IA-02 | 2 | en_curso | falta el tope y el gasto del mes en «Ajustes» |
| DOC-15 | 2 | pendiente | COR-06 |
| LV-05 | 2 | terminada | PR #45, #46 y #47 (18/10/2026) |
| LV-07 | 2 | en_curso | se construye dentro de LV-08 (marco y Hoy, 30/10/2026) |
| LV-08 | 2 | en_curso | DEC-35 a DEC-37 aprobadas el 30/10/2026; rama `feat/inicio-claro` |
| SIA-01 a SIA-06 | 2 | en_revision | PR de la rama `feat/sitio-pildora-sobria` hacia `main` (29/10/2026) |
| MRP-01 | 2 | en_revision | DEC-26 aprobada por el titular el 26/10/2026; se integra con el PR de la rama `feat/mrp01-cor01-03` |
| USO-01 | 4 | pendiente | ninguna |
| CAP-01 | 1 | pendiente | SIM-01, SIM-09, COR-01 |
| CAP-02 | 1 | pendiente | CRM-02 |
| CAP-03 | 1 | pendiente | COR-01, COR-06, SEG-01 |
| CAP-04 | 1 | pendiente | CAP-03, CRM-02 |
| FCH-01 | 2 | pendiente | REL-01 (diseño conjunto), migración autorizada |
| FCH-02 | 2 | pendiente | FCH-01, DOC-01 |
| FCH-03 | 2 | pendiente | ninguna |
| FCH-04 | 2 | pendiente | UX-05 |
| FCH-05 | 2 | pendiente | FCH-01, DOC-10 |
| FCH-06 | 2 | pendiente | ninguna |
| FCH-07 | 2 | pendiente | DOC-11, DOC-12 |
| FCH-08 | 2 | pendiente | DOC-06 |
| FCH-09 | 2 | pendiente | LV-02 |
| FCH-10 | 2 | pendiente | FCH-01 |
| FCH-11 | 2 | pendiente | FCH-01 |
| MOT-01 | 2 | pendiente | FCH-01, FCH-04, MRP-01, migración autorizada |
| MOT-02 | 2 | pendiente | MOT-01, CAP-03 |
| MOT-03 | 2 | pendiente | MOT-02, SEG-01 |
| MOT-04 | 2 | pendiente | MOT-03, revisión del titular |
| DOC-06 | 2 | pendiente | ninguna |
| DOC-09 | 2 | pendiente | DEC-20 |
| HER-01 | 4 | pendiente | SIM-10 |
| HER-02 | 2 | pendiente | FCH-03, FCH-04 |
| HER-03 | 3 | pendiente | FIS-01, revisión fiscal |
| HER-04 | 2 | pendiente | FCH-01 |
| UX-03 | 4 | pendiente | UX-01 |
| UX-04 | 4 | pendiente | UX-01 |
| UX-05 | 4 | pendiente | UX-04 |
| SOP-01 | 5 | pendiente | OBS-01 |
| EXT-11 | 6 | pendiente | DEC-14, EXT-06, SEG-01 |
| EXT-12 | 1 | en_curso (04B en la rama `feat/levantamiento-04b-en-vivo`) | Ninguna; FCH-01 y FCH-05 la mejoran después |
| EXT-13 | por decidir | idea, no aprobada | DEC-14, SEG-01, PRV-01 |
| SAAS-01 | posterior | en_pausa | DEC-15 |
| SAAS-02 | posterior | en_pausa | SAAS-01 |
| SAAS-03 | posterior | en_pausa | SAAS-01, MOT-03 |
| SAAS-05 | posterior | en_pausa | SAAS-01, SAAS-02, SAAS-03, DAT-01, USR-01 |
| SAAS-06 | posterior | en_pausa | SAAS-01, DEC-18 |
| PIL-02 | posterior | en_pausa | SAAS-01 a SAAS-03, SAAS-05, PIL-01, REC-01, OBS-01 |

**Discrepancia pendiente de EXT-03:** el backlog condiciona proveedores/mantenimiento a EXT-02 o a un caso de venta concreto; el seguimiento exige OPS-01 y FIN-01. Conservar ambas referencias y resolver su dependencia al diseñar esa extensión, sin iniciar por una equivalencia supuesta.

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

## Riesgos, asuntos y dependencias

| ID | Tipo | Tratamiento y responsable |
|---|---|---|
| A-01 | Asunto: consolidación técnica realizada; aceptación y continuidad pendientes | Fundamentos integrados en PR #15; revisar criterios restantes sin repetir las correcciones ya consolidadas. |
| D-01 | Dependencia: permisos administrativos/entorno aislado | Moisés habilita acceso; ingeniería verifica operación. Bloquea pruebas/controles externos, no diseño o pruebas locales. |
| R-01 | Riesgo: duplicidad cliente/operación/cartera | REL/OPS/COM con ID fuente y pruebas; agente de desarrollo. |
| R-02 | Riesgo: migración de datos ambiguos | Inventario/simulación/reporte; revisión humana de coincidencias. Nunca fusionar todo por nombre/teléfono. |
| R-03 | Riesgo: reglas jurídicas/fiscales no aprobadas | Revisor profesional; mantener bloqueos existentes, no habilitar contratos por casilla. |
| R-04 | Riesgo: sesión/archivo sensible en dispositivo | PWA conectada inicial; almacenamiento local explícito y acotado; responsable de privacidad. |
| R-05 | Riesgo: métricas potenciales usadas como dinero cobrado | FIN/TAB; trazabilidad y etiquetas separadas; Moisés valida definiciones. |
| R-06 | Riesgo: resultado de inversión con supuestos incompletos o TIR ambigua | EXT-08; conservar escenarios y método, explicar ausencia de resultado y cotejar casos por cálculo independiente. |
| R-07 | Riesgo: comparables desactualizados, ubicación imprecisa o ruta sin cobertura | EXT-09; procedencia/fecha/precisión, permisos, tratamiento de faltantes y alternativa en lista. |
| R-08 | Riesgo: acceso de clientes o IA a expedientes ajenos | EXT-10/EXT-06; autorizaciones efectivas, proyecciones mínimas, revocación e índices privados probados entre dos identidades. |
| R-09 | Riesgo (etapa posterior): una empresa ve datos de otra | SAAS-01; pruebas entre dos empresas sintéticas en API, SQL directo, archivos, búsqueda, exportación, cachés e índices de IA antes de cualquier piloto externo. |
| R-10 | Riesgo: un proceso configurado deja de proteger la operación (aplica ya a Fortius por el motor de procesos y, en la etapa posterior, a cada empresa) | MOT-03 y SAAS-03; requisitos protegidos, versiones por operación y validación en servidor; desactivar uno exige administrador y motivo. |
| R-11 | Riesgo: prometer una protección legal inexistente (por ejemplo, «patentado») | DEC-16; abogado de propiedad intelectual; ningún texto comercial la afirma sin título otorgado. |
| S-01 | Supuesto: equipo inicial de una persona de ingeniería | Reestimar tras iteración 1; asignar por entrega, no prometer fechas calendario. |
| S-02 | Supuesto: sin reescritura completa ni proveedores nuevos en núcleo | Revisar si evidencia técnica demuestra necesidad. |

## Cómo incorporar lo que vaya haciendo falta

1. Registrar necesidad con ejemplo, usuario afectado, evidencia y tarea relacionada.
2. Clasificar como defecto del alcance base, dependencia indispensable, mejora de producto o nueva capacidad.
3. Defecto/dependencia técnica necesaria se incorpora a su entrega con pruebas y estimación; una decisión jurídica/negocio no se resuelve por inferencia.
4. Una nueva capacidad recibe costo, beneficio, datos, dependencia, alternativa simple y criterio de aceptación. Moisés decide entrada y qué desplaza.
5. Mantener hasta dos iteraciones detalladas; el resto conserva entregables/dependencias y se concreta al llegar. No fingir firmas/interfaces finales para modelos aún no aprobados.
6. Revisar fuente de verdad, permisos, migraciones, backup y métricas ante cada módulo nuevo.

## Capacidades adicionales y disparadores

Paquetes de fase 6: EXT-01, EXT-06, EXT-08, EXT-09, EXT-10 y EXT-11 están solicitados para el producto ampliado. Las demás extensiones entran al backlog de ejecución por decisión de negocio o necesidad demostrada. Descubrimiento de 1–3 días orientativos por paquete; esfuerzo de implementación se estima después de validar modelos, proveedor y alcance. Las ventanas originales cubren el núcleo y no estiman estas capacidades.

| ID / capacidad | Cuándo evaluarla / dependencias | Resultado de descubrimiento antes de programar |
|---|---|---|
| EXT-01 — Compradores y matching | Solicitada el 17/10/2026 (RP-24); CRM-01/OPS-01 | Reglas aprobadas, coincidencias explicables en los dos sentidos (inmueble → prospectos y prospecto → inmuebles) y permisos. |
| EXT-02 — Renta/administración | Hay contratos recurrentes administrados por Fortius; FIN-02/CIE-01/LEG-01 | Ciclo de renta/depósitos/renovación/mora/entrega y reparto de cobros definido. |
| EXT-03 — Proveedores/mantenimiento | Hay órdenes, presupuestos y trabajos que coordinar; EXT-02 o caso de venta concreto | Responsable, autorización, evidencia y enlace a operación/arrendamiento. |
| EXT-04 — Portales/correo/calendario/WhatsApp API | Doble captura real y proveedor con acceso API; OPS-01/PRV-01 | IDs externos, consentimiento, idempotencia, reintentos y costo. Enlace WhatsApp no equivale a integración. **Primera integración elegida (titular, 17/10/2026):** EasyBroker; el panel manda sobre los datos del inmueble y los envía, si el plan de EasyBroker incluye API (H-06). |
| EXT-05 — CFDI/contabilidad/bancos/firma | Necesidad confirmada y proveedor/revisión especializada; FIN-02/DOC-01/PRV-01 | Alcance legal, contrato API, conciliación y permisos; no custodiar dinero por defecto. **Firma en línea (titular, 17/10/2026):** se prefiere una firma electrónica propia del panel, sin proveedor de pago (liga personal, código de verificación, evidencia y huella SHA-256 del PDF), sujeta a validación del abogado; ver D-04 del cuestionario. |
| EXT-06 — Búsqueda documental y revisión asistida de cláusulas | Solicitada; corpus autorizado/versionado y DEC-14; DOC-01/LEG-01/PRV-01, con aislamiento de acceso de SEG-01 | Búsqueda con documento/versión/página, propuestas de cláusulas, evaluación de citas/abstención/permisos y revisión humana. |
| EXT-07 — Cola/worker/eventos | Trabajos duran o reintentos superan límites medidos; ESC-01 | Métrica, idempotencia, reconciliación y plan de operación. |
| EXT-08 — Análisis de inversión | Solicitado; DEC-12 y FIN-02/TAB-01/OPS-01/SEG-01 | Escenarios con TIR/VAN, flujo, presupuesto, supuestos, separación de financiación y resultados comprobables. |
| EXT-09 — Mapas, comparables, zonas y rutas | Solicitados; DEC-11 y REL-01/TEC-01/VIS-01/SEG-01 | Fuentes/precisión/cobertura, uso permitido, motor/costo, capas autorizadas y recorrido sintético de visitas. **Titular, 17/10/2026:** sin Google Maps por costo; propuesta: MapLibre con mapas de OpenStreetMap, o el nivel gratuito de Mapbox o MapTiler. Primer uso: inventario por zona; ubicación aproximada en público (H-05). |
| EXT-10 — Portal privado de clientes | Solicitado; DEC-13 y REL-01/OPS-01/DOC-01/SEG-01/AUT-01/PRV-01 | Identidad externa, información compartida, solicitudes, permisos efectivos, revocación y uso móvil. DOC-12 es su primera pieza. |
| EXT-11 — Asistente IA operativo | Solicitado el 17/10/2026 (RP-44); DEC-14, EXT-06, SEG-01 | Resumen de operación, lectura de INE y escritura con confirmación campo por campo, descripción de anuncio y sugerencia de siguiente paso; citas, permisos, evaluación, costo y abstención. Nunca cambia estados ni envía nada por sí solo. **Titular, 17/10/2026:** se programa sin atarse a un proveedor; el titular solo carga la clave de la API y elige proveedor y modelo (Claude, DeepSeek u otro). Antes de elegir: precio vigente, prueba con documentos reales y lugar donde se procesan los datos (transferencia a revisar en el aviso de privacidad). La IA propone y una persona confirma; tope de gasto mensual (H-03). |
| EXT-12 — Captura sobre el documento en vivo | **Aprobada por el titular el 27/10/2026 (DEC-31) para todos los formatos.** 04B construido en la rama `feat/levantamiento-04b-en-vivo`, sin integrar. Usa el membrete común; FCH-01 y FCH-05 la mejoran después; relacionada con FCH-10, DOC-10 y F09 | Revisión del 04B por el titular en localhost; después, los formatos por etapa en el orden de «EXT-12» abajo. |
| EXT-13 — Conexión a servicios de IA con tope mensual | **Idea del titular, 26/10/2026; no aprobada.** Base común de EXT-11, IA-01, EXT-06 y EXT-12; DEC-14, SEG-01 y PRV-01 | Elegir proveedor inicial y tope, confirmar precios vigentes y probar con documentos sintéticos; ver «EXT-13» abajo. |

### EXT-12 — captura con vista previa del documento

**Estado: aprobada por el titular el 27/10/2026 (DEC-31) como la forma de capturar todos los formatos.** Va en el bloque 1 del «Orden vigente». La prueba del 04B está en la rama `feat/levantamiento-04b-en-vivo`, sin integrar a `main`.

**Decisión del titular (27/10/2026):** «Cada etapa va a tener su archivo cargado y lo vamos a llenar desde el sistema, así como esta prueba». En cada etapa, el asesor ve el formato de Fortius tal como sale en PDF, pulsa la parte que va a llenar, captura el dato y lo ve integrado en el documento al momento. Así se detecta qué falta o qué conviene cambiar. Al final descarga el PDF, que sale igual a lo que vio. El formulario por secciones deja de ser la forma de captura de los formatos.

**Cómo funciona (construido y probado con el 04B):**

- **Pantalla.** La ventana del formato abre en la pestaña «Documento» con sus hojas. Cada espacio por llenar es pulsable y abre su campo a un lado (abajo en celular, con «Ver más grande»). Lo que se escribe aparece en la hoja al teclear. «Aceptar» lo integra y lo guarda con la versión del borrador; un conflicto 409 deja abierta la captura con el aviso. Lo que falta para el PDF lleva borde vino y aparece en la lista «Qué falta». Siguen igual «Generar PDF», «Word», el historial de versiones y la protección de cambios sin guardar. Funciona con teclado (Tab y Enter) y en claro y oscuro.
- **Lo que se ve es lo que se descarga.** La pantalla usa el mismo escritor del PDF (`crearMaquetador` en `src/lib/formatos/documento/pdf.ts`). En vez de una página de pdf-lib recibe una superficie que anota los trazos, así que vista y PDF comparten medidas, cortes de línea y saltos de página; una prueba lo compara. Cada celda del documento declara qué campos la llenan (`keys` en `src/lib/formatos/documento/modelo.ts`), y una prueba exige que todo campo tenga su parte pulsable.
- **De dónde sale cada documento.** Se reproduce en código el archivo del titular de `G:\Mi unidad\FORTIUS\04_Metodologia\01_Captacion\` (y las demás carpetas de la metodología), como el 04B. Así la vista, el PDF y el Word salen del mismo contenido. Subir un Word propio con campos marcados sigue siendo FCH-10, para después.
- **Componente.** `src/components/admin/operation/documento-en-vivo.tsx`. Un formato entra a la captura en vivo al agregarse a `EN_VIVO`.

**Folios e identificadores: nadie los inventa.** El sistema ya asigna solos el folio de la operación (`EXP-000001`, al crearla) y el código del inmueble (`FORTIUS-000001`, al darlo de alta), con la migración `supabase/migrations/20261014031535_automatic_folios.sql`. Los documentos los imprimen sin captura y esas celdas no son pulsables. En el 04B, el «ID inmueble» toma el código del inmueble vinculado, y el «ID de fotografía» sale del archivo elegido (`FOTO-` y su identificador). Al pasar cada formato se revisa qué folios o números pide (por ejemplo, el número de recibo del 18). Si el panel no tiene ya ese consecutivo, se propone uno automático al titular antes de construirlo.

**Levantamientos 04A–04G (grupo A, titular 27/10/2026, en la rama):** los siete se capturan en vivo. Cada uno sigue los espacios de su Word (`04x_Levantamiento*.docx`) con lo decidido en el 04B: sin columnas de base y referencia (D/O/M/C/NV/NA), sin las tablas de respaldos ni de discrepancias, con uso de suelo (lista del Reglamento de Zonificación de Tijuana, la misma del 07) y con superficies opcionales («si las tienes a la mano»). Las casillas comunes son las del Word del 04A; «NV» se lee «No se pudo ver». Cada tipo se describe una sola vez en `PLANTILLAS` (`src/lib/formatos/levantamiento.ts`), y de ahí salen sus campos y su documento (`src/lib/formatos/documento/levantamiento.ts`).

**Estilo 04A para todos los formatos (titular, 27/10/2026):** el modelo es el Word del 04A, limpio y sin grandes saltos de página.
- El título del formato va solo en el membrete; en la hoja quedan los títulos de grupo («Características del inmueble», «Ubicación y evidencias»).
- Un salto de página de la plantilla solo abre hoja nueva si queda menos del 35 % libre (`Writer` en `documento/pdf.ts`). En Word no se fuerzan los saltos condicionales.
- Prueba automática: salvo la última, cada hoja debe usarse al menos en un 70 % (`tests/backend/documento-en-vivo.test.ts`). El presupuesto 19 ya bajó de 3 a 2 hojas con esta regla.

**Casillas y menús en lugar de «opción 1 / opción 2»:**
- Una lista con diagonales cuyas opciones vienen escritas en la plantilla se vuelve casillas: el campo «varias opciones» (`multi`) si se puede marcar más de una, o un menú (`choice`) si es solo una. Ejemplo: «Sala / comedor / lavado / bodega / patio / jardín / terraza».
- Si la lista pide varios datos («Tipo / autoridad / folio / fecha»), se parte en campos separados, cada uno con su rótulo impreso.
- Si una lista pide la fuente del dato («base», «soporte», «referencia»), se quita, como base y referencia.
- Si faltan opciones, no se inventan: se proponen al titular antes de construir ese formato.

**Cómo se pasa cada formato (lista de trabajo):**

1. Leer completo el archivo del titular y mapear cada espacio impreso para llenar: ni más ni menos (regla de formatos).
2. Contrastarlo con las reglas del panel (RP-82 datos que no detienen, RP-77 descarga con aviso, RP-85 descargar no es aprobar, decisiones de cada formato). Preparar la tabla de cambios: diagonales a casillas, menús o campos, y discrepancias. Mostrarla al titular antes de cambiar un significado o de proponer opciones nuevas.
3. Escribir el documento con el estilo 04A y `keys` en cada celda; una tabla de filas variables o una cláusula se vuelve pulsable entera con `zona`. Llenar solos los folios, el asesor, el propietario y lo que ya sabe la operación; esas celdas no se capturan.
4. Agregar el formato a `EN_VIVO` (`documento-en-vivo.tsx`). Conservar los bloqueos legales del 09 y de la promesa 15, el Excel del 07 (su vista en vivo es su PDF) y la foto obligatoria de los levantamientos. La vista en vivo ya dibuja también los formatos en Times (01, 09 y 14).
5. Pruebas: cada campo con su zona pulsable, las mismas hojas en la vista y en el PDF, hojas llenas al 70 % y las pruebas del formato al día, sin debilitarlas. Revisión en celular y escritorio, en claro y oscuro.

**Grupos, en el orden de las etapas (cada uno se revisa en localhost antes de seguir):**

| Grupo | Formatos | Estado |
|---|---|---|
| A | 04A, 04B, 04C, 04D, 04E, 04F, 04G | Construido en la rama; en revisión del titular. |
| B | 02 entrevista, 01 aviso | **En la rama (28/10/2026), pendiente de revisión del titular.** El 02 conserva su versión corta (excepción del 17/10): cada celda es pulsable y las listas cortas (aviso entregado, tipo de propietario, estado civil, hipoteca) son casillas. El 01 se captura en vivo (opción A del titular): su PDF del expediente sale del escritor común, en Times, y sus secciones 01–08 se cotejaron palabra por palabra con `01_AvisoPrivacidad.docx` del 26/10/2026. Las hojas de decisiones siguen la redacción de ese Word y cada una cabe en una página para firmar; se agregaron sus dos espacios impresos «Datos del instrumento, fecha y fedatario» y «Facultades y vigencia comprobadas mediante». Los datos del responsable se llenan solos con los del aviso publicado en el sitio. El aviso público (`/avisos/privacidad`) sigue en `aviso-pdf.ts`. El 01 sigue sin emitirse incompleto. |
| C | 05 revisión jurídica, 06 opinión jurídica | **En la rama (28/10/2026), pendiente de revisión del titular.** El 05 se cotejó con `05_RevisionJuridica.docx` del 26/10/2026: el título va en el membrete; «Operación y etapa a decidir» (Venta, Renta, Otra), «Alcance de revisión» (Preliminar, Comercialización, Cierre) y el resultado del abogado son casillas, como en el Word; se agregaron las frases de sus notas que faltaban (referencia y verificación, fecha de corte, PLD, «Asigne H01, H02…», «No marque una conclusión sin sustento»). Cada tabla se pulsa completa y abre su editor. El 06 no tiene Word en G:: conserva su plantilla del código y cada párrafo abre el campo que lo llena. |
| D | 07 opinión de valor, 08 neto | **En la rama (28/10/2026), pendiente de revisión del titular.** Sus Excel del 17/10/2026 ya traen menús en lugar de listas con diagonales, así que el contenido no cambió: cada celda capturada se pulsa y abre su campo; los totales, el valor concluido y el neto los calcula el panel y no se pulsan. Lo que la hoja no imprime (base de mercado, tipo de cambio, área privativa, redondeo) se abre con la parte que afecta. El reporte fotográfico del 07 permite subir y elegir varias fotos desde el documento. El 08 lleva el título en el membrete; el 07 conserva su portada. El Excel sigue como descarga. |
| E | 09 contrato, 10 plan | **En la rama (29/10/2026), pendiente de revisión del titular.** El 09 coincide con `09_ContratoIntermediacion.docx` del 26/10/2026 y se llena en vivo: cada renglón de las condiciones particulares, la cláusula del aviso, la de registro y las firmas abren sus campos; licencia, modelo estatal, PROFECO, soportes fiscales y presupuesto de la pena se abren con lo que sustentan. Su PDF sigue bloqueado (DOC-09) y se descarga en Word. **El 10 se rehízo completo (DEC-34)** con la plantilla nueva. |
| F | 11, 12, 13, 14 | **En la rama (29/10/2026), pendiente de revisión del titular.** El 11, el 12 y el 13 coinciden con sus Word del 26/10/2026 y se llenan en vivo. El 14 sigue `14_CartaIntencion.docx`, cuyo título interior es «Propuesta de compra» (así se llama ahora también en el catálogo): «los derechos de propiedad» va fijo, «Folio Real» y «Partida» son datos separados, el precio sale también en letra y se quitaron los apartados que el Word ya no trae (bienes incluidos y excluidos, calendario de pagos, fecha de entrega, gastos de cada parte, zona horaria). Se conservan, solo cuando se usan, la contraoferta y la confirmación de vigencia de la respuesta, aunque el Word no las trae en blanco (titular, 29/10/2026). |
| G | 15, 16, 17, 18 | **En la rama (29/10/2026), pendiente de revisión del titular.** La 15 coincide con su Word del 26/10/2026 (105 de 106 frases iguales; solo cambia el acomodo de firmas) y conserva su revisión obligatoria: cada párrafo abre los campos de sus marcadores, el alcance que no se imprime se abre con el párrafo de apertura y la revisión del abogado con las firmas. El 16, el 17 y el 18 coinciden con sus Word. El 18 lleva número de recibo automático: folio del expediente y consecutivo de sus recibos (p. ej. «EXP-000011-R01»), y su importe en letra se escribe solo si no se capturó. |
| H | 19 presupuesto | **En la rama (29/10/2026), pendiente de revisión del titular.** Sigue su Excel del 17/10/2026; el título va en el membrete, cada valor y tabla se pulsan, los totales los calcula el panel. |

**Reglas que se conservan.** Un dato faltante nunca detiene el flujo (RP-82); el PDF se descarga avisando qué falta (RP-77) y descargarlo no es aprobarlo (RP-85). Guardar y publicar siguen siendo acciones distintas. Cuando exista la ficha única (FCH-01), los campos llegarán llenos con lo que la ficha sabe y lo capturado regresará a ella con su origen (FCH-05); la captura en vivo no depende de eso para empezar.

**Dónde seguimos (29/10/2026):** todos los formatos (01, 02, 04A–04G y 05 a 19) se llenan sobre el documento en la rama; el 03 no es un documento. Falta la revisión del titular. Ya están en la rama, sin integrar, DOC-EXP (pestaña «Documentos del cliente») y DAT-EXP (datos del expediente que llenan los formatos); sus dos migraciones se aplican al integrar. SUB-01 quedó descartada (titular, 29/10/2026). IA-01 (la IA lee los documentos y propone los datos) también está en la rama, sin activar: espera la clave de API del titular y el visto bueno del abogado. COR-06 (lista de documentos con «No aplica», «por confirmar» y documentos del cliente) está en la rama (29/10/2026). COR-09 (los cuatro pasos de «Cierre y entrega») y COR-08 (entrega del informe al propietario, con una migración más) también están en la rama. COR-11 (quien compra o renta es interesado, no operación; una migración más) también está en la rama. COR-04 (camino propio de la renta, con una migración más) también está en la rama. Queda pendiente IA-02 (tope y gasto del mes en «Ajustes»). **Pendiente de los grupos A a D:** revisión del titular en localhost. Del 01, el domicilio del responsable es el del sitio, «C. Dos, 4063, Benedetti B45, Villa Fontana, C.P. 22205, Tijuana, B. C.» (titular, 28/10/2026; el Word traía otra redacción). La hoja de decisiones del representante sale solo cuando hay representante (titular, 28/10/2026; el Word la trae siempre, en blanco). Revisión en localhost (`http://127.0.0.1:3002/admin`). Al terminar los grupos, `npm run verify` y las suites de navegador, solo con su autorización, antes de abrir un único PR.

**Idea original (26/10/2026):** ver el documento con el membrete oficial y llenarlo ahí mismo, con lo escrito reflejado de inmediato. Se resolvió con la opción «clic en el documento para abrir el campo» y sin pantalla dividida fija: el campo se abre a un lado solo cuando se pulsa una parte del documento.

### EXT-13 — conexión a servicios de IA con tope mensual

**Estado: idea del titular (26/10/2026), sin aprobar y sin código.** Es la base técnica de EXT-11 (asistente), IA-01 (lectura de documentos), EXT-06 (búsqueda documental) y EXT-12 (captura con vista previa). Se aterriza en Claude Code, con plan previo.

**Idea del titular:** que el panel de administración pueda conectarse a un servicio de IA (Claude, ChatGPT, Grok, Gemini u otro) para ayudar en el trabajo diario, solo dentro del panel y con un límite de gasto al mes. Como ejemplo de tope mencionó los 100 dólares mensuales de su API de Claude.

**Propuesta de diseño:**

1. **Una sola capa de proveedor en el servidor.** El panel nunca habla directo con un proveedor: pide a una capa interna «resume esto», «lee este documento» o «redacta este mensaje», y la capa decide con qué proveedor y modelo lo resuelve. Cambiar de Claude a ChatGPT, Grok, Gemini o DeepSeek es un cambio de configuración, no de pantallas. Para construirla se propone evaluar el AI SDK de Vercel, cuya lista de proveedores incluye Anthropic, OpenAI, Google, xAI y DeepSeek; al aterrizar hay que confirmar versión, soporte de lectura de PDF e imágenes y que entregue el conteo de tokens de cada llamada.
2. **Claves solo en el servidor.** Cada clave se guarda como variable secreta del servidor (nunca en el navegador ni en el código), se configura en Configuración o en el entorno y solo la usan las rutas del servidor. Sin clave, la función aparece desactivada y el panel sigue igual (H-03).
3. **Dos topes, uno afuera y otro adentro.**
   - **Tope en el proveedor (el que corta de verdad).** Anthropic permite fijar un límite mensual propio en su consola, en Facturación, «Spend limits», siempre por debajo del tope de su nivel; al llegar al límite, las llamadas se rechazan con error hasta el mes siguiente (verificado en su documentación el 26/10/2026). Los demás proveedores tienen controles parecidos que se confirman al elegirlos.
   - **Tope en el panel (el que avisa).** Una tabla de uso con fecha, usuario, proveedor, modelo, tokens de entrada y salida, costo estimado y función que lo pidió. El titular fija el tope mensual; al 80 % avisa, al 100 % la función se pausa con un mensaje claro y vuelve el día 1. Opcional: tope por persona y por día, y un máximo de tokens por llamada. El costo estimado sale de una tabla de precios por modelo con fecha de vigencia que se actualiza a mano, porque los precios cambian.
4. **Qué hace y qué no.** Ayuda con resumen de una operación, redacción de mensajes de seguimiento a partir de las plantillas, lectura de escrituras e identificaciones (IA-01), descripción de anuncio y sugerencia de siguiente paso. La IA propone y una persona confirma (RP-44): nunca cambia estados, aprueba requisitos, envía mensajes ni guarda datos por sí sola.
5. **Si falla o se acaba el tope.** El panel funciona igual. Solo esa ayuda queda no disponible y lo dice.
6. **Privacidad.** Enviar un documento a un proveedor es un tratamiento de datos personales: debe estar en el aviso de privacidad y en el registro de tratamiento (DEC-14). Se evitan los niveles gratuitos que pueden usar los datos para mejorar sus productos (H-03). El registro de uso guarda solo datos de control, no el contenido de lo enviado, salvo que el titular decida otra cosa.
7. **Quién puede usarla.** Solo usuarios con permiso (SEG-01), y cada uso queda atribuido a quien lo pidió.

**Puntos por confirmar con el titular:**

- **Monto del tope.** En H-03 el presupuesto mensual era de 2,000 pesos; ahora menciona 100 dólares. Hay que fijar la cifra y si es del panel completo o por persona. Los 100 dólares no los confirmé como límite de su cuenta: la documentación de Anthropic describe topes por nivel y límites propios que cada organización fija, así que el límite real se ve en su consola.
- **Proveedor inicial.** H-03 recomienda Claude con el modelo más barato para documentos y el intermedio para los difíciles; los precios de aquel día deben verificarse otra vez al elegir.
- **Suscripción frente a API.** ChatGPT Plus o Claude Pro no sirven para esto: el panel necesita la API, que se cobra aparte por uso.
- **Qué conservar del uso** y cuántos meses.

**Aceptación (borrador):** con una clave de prueba, una función de ejemplo responde por el proveedor elegido y cambiar de proveedor no cambia ninguna pantalla; el uso queda registrado con costo estimado; al llegar al tope la función se pausa con aviso y el panel sigue operando; sin clave la función aparece desactivada; ninguna clave ni contenido sensible llega al navegador ni a los registros; un usuario sin permiso no puede usarla. **Costo:** sin estimar; descubrimiento de 1 a 3 días orientativos.

### EXT-08 — inversión, flujos y rentabilidad

El asesor o responsable financiero podrá crear, guardar, comparar y reabrir escenarios vinculados al inmueble o expediente. Cada escenario tendrá versión, autor, moneda, fechas o periodicidad, tasa de descuento, horizonte y supuestos de ingresos, costos y financiación. Se separarán economía del proyecto, deuda y capital del inversionista. Los presupuestos podrán reutilizar datos revisados de FIN-02, conservando su procedencia.

- [ ] Definir con DEC-12 qué modelos se necesitan primero y qué datos de una operación pueden reutilizarse sin duplicar erogaciones ni pagos históricos.
- [ ] Mostrar flujo por periodo, VAN, TIR y rentabilidad con sus bases; conservar faltantes como pendientes y distinguir proyección de cobro o gasto efectivo. Aplicar las tasas a la periodicidad o fechas del flujo según el método aprobado.
- [ ] Diseñar tratamiento explícito de TIR inexistente, ambigua o con más de una solución, y sensibilidad a los supuestos; no elegir una tasa silenciosamente ni prometer rentabilidad.
- [ ] Comprobar mediante casos independientes tasa de descuento cero, fechas/periodos inválidos, datos incompletos, conversión de moneda con fuente y flujos con varios cambios de signo. Reabrir el escenario debe reproducir sus resultados con la misma versión del método.
- [ ] Verificar permisos de lectura/edición, comparación y exportación; cambios de supuestos invalidan la revisión previa. No actualizar reglas fiscales ni asumir beneficios tributarios para completar una simulación.

**Aceptación:** un caso sintético por modelo reproduce resultados cotejados por una vía independiente; flujo y presupuesto se reconcilian, escenarios guardados se reabren y las situaciones sin resultado se explican. **Reversión:** suspender cálculo nuevo, preservar escenarios/versiones y permitir consultar su origen; no convertirlos en movimientos contables.

### EXT-09 — mapas, comparables y análisis de zonas

Dentro del panel se podrá alternar lista y mapa, filtrar inmuebles y comparables, consultar su procedencia y visualizar capas de zonas. Las visitas podrán agruparse en una ruta. Un comparable identificará si es oferta o cierre comprobado, fecha de captura, fuente, moneda y características; se reutilizará la captura de la opinión 07 sin presentar anuncios como ventas efectivas.

- [ ] Inventariar coordenadas y fuentes; DEC-11 define precisión, vigencia, derecho de uso, proveedores y costo. No importar anuncios masivamente ni presumir acceso a catastro u otras bases.
- [ ] Probar asociación inmueble/punto, coordenadas inválidas, duplicados, datos sin ubicación y filtros consistentes entre lista y mapa. Mantener alternativa en lista cuando falte cobertura o el servicio no responda.
- [ ] Definir y mostrar el universo, las variables, la fecha y la cobertura del análisis de zonas. Capas públicas y ubicaciones internas tienen permisos propios; una visualización no acredita uso de suelo, linderos ni titularidad.
- [ ] Relacionar comparables con fuentes/versiones de la opinión 07; actualizar o excluir un dato no altera silenciosamente una opinión ya emitida. No deducir un precio firme de una muestra insuficiente.
- [ ] Ensayar rutas con visitas sintéticas, orden y lugares de inicio/fin; mostrar límites del servicio y no prometer tiempos exactos. Probar que un cliente o asesor sin acceso no puede recuperar ubicaciones privadas.

**Aceptación:** inventario y mapa coinciden para el filtro y alcance del usuario; comparables muestran fuente/fecha/base de precio; análisis revela cobertura y faltantes; una ruta enlaza sus visitas y el fallo del proveedor conserva la lista. **Reversión:** retirar capa o servicio nuevo y mantener inventario, fuentes y visitas; no borrar coordenadas para revertir interfaz.

### EXT-10 — portal privado de clientes

El cliente accederá a una vista externa de su operación: avance compartido, citas, documentos autorizados y solicitudes de información. Los perfiles internos permanecen en CRM; la cuenta externa y la representación registrada no conceden por sí solas acceso a todo el expediente. Fortius decidirá qué comparte y con quién mediante DEC-13.

- [ ] Definir destinatarios y acciones iniciales; diseñar acceso y recuperación con identidad externa, separado del rol de asesor y del panel del equipo.
- [ ] Crear una proyección explícita por operación y destinatario. No compartir por defecto notas internas, conclusiones pendientes, documentos de otras partes ni cifras reservadas.
- [ ] Probar con dos clientes sintéticos acceso directo a API/archivos, invitación caducada, sesión caducada y retiro del vínculo o del documento compartido. La revocación impide nuevas consultas/descargas; no recupera copias ya descargadas.
- [ ] Mostrar versión y estado de cada documento compartido, citas y solicitudes con próxima acción; recibir o visualizar un documento no se registra como firma, aceptación contractual ni pago.
- [ ] Verificar móvil, recuperación y continuidad. Las invitaciones a personas reales y el tratamiento nuevo de datos requieren las decisiones y autorizaciones aplicables.

**Aceptación:** cada identidad externa ve solo lo compartido para su operación; no consigue archivos ajenos modificando un ID o enlace; una solicitud queda vinculada y la revocación bloquea el acceso posterior. **Reversión:** desactivar portal, preservar las solicitudes y el registro de lo compartido, sin eliminar cuentas o expedientes como rollback.

### EXT-06 — búsqueda documental y revisión de cláusulas

Un usuario autorizado podrá buscar en los documentos de su ámbito y obtener respuestas con citas al documento, versión y página o sección. La revisión asistida señalará cláusulas, omisiones o contradicciones con evidencia y una propuesta revisable. La generación de contratos y formularios PDF sigue en DOC-01/LEG-01 y usa modelos revisados; la IA no habilita el modelo 09 ni sustituye su cotejo externo.

- [ ] Definir corpus, usos permitidos, proveedor, conservación, costo y evaluación con DEC-14 y PRV-01. La ingesta comienza con documentos sintéticos o expresamente autorizados; OCR/extracción se conserva como propuesta y permite comprobar el original.
- [ ] Conservar referencia al expediente, documento, versión y página/sección en el índice. Cambios, revocación o eliminación de una fuente invalidan su uso futuro y los resultados guardados que dependan de ella.
- [ ] Filtrar recuperación por autorización efectiva antes de enviar contenido al modelo; probar que consultas, citas, respuestas y cachés no revelan fuentes ajenas, incluso ante instrucciones insertadas en los documentos.
- [ ] Medir citas correctas, cobertura, abstención y utilidad con casos reservados. Sin sustento suficiente, devolver falta de evidencia; fuentes contradictorias se exponen para revisión sin resolverlas por inferencia.
- [ ] Presentar sugerencias de cláusulas separadas del texto aprobado; conservar originales y registrar aprobación profesional antes de incorporar cambios a una versión emitible. Verificar fuentes oficiales vigentes al formular una conclusión normativa.

**Aceptación:** cada afirmación documental verificable remite a una fuente accesible y a su versión; los casos sin evidencia y fuera de permiso se rechazan; una propuesta de cláusula nunca cambia por sí sola el contrato aprobado ni el estado jurídico. **Reversión:** suspender ingesta/consulta o servicio de IA; mantener documentos originales y sus revisiones profesionales, sin destruir el expediente.

## Tareas detalladas de continuidad

Ventana propuesta: 8–14 días de ingeniería. Una tarea en implementación. El acceso a GitHub/Vercel, la revisión de tratamiento de datos y un destino aislado condicionan parte de esta iteración.

### BAS-01 — base y correcciones pendientes

**Archivos:** leer diff actual, `PLAN_ERP_CRM.md`; revisar archivos listados allí. Evidencia existente: `PLAN_ERP_CRM.md`, con integración y resultados del commit validado.

**Consume:** commit base, estado de trabajo y registro de correcciones. **Produce:** matriz archivo → cambio → prueba → commit/estado remoto, sin valores secretos.

- [x] Leer `git status --short --branch`, `git diff --stat`, `git diff --check` y diff por archivo; separar corrección anterior de necesidad ERP.
- [x] Volver a comprobar lectura de GitHub/Supabase/Vercel requerida con autenticación disponible. Registrar alcance de acceso, no credenciales. No concluir falta de credenciales por una variable ausente.
- [x] Crear rama de consolidación cuando el trabajo de implementación esté aprobado. Los cambios existentes no se descartan ni se copian ciegamente.
- [x] Revisar exportación de 18 tablas, paginación compatible de expedientes, extracción de contratos y HTTP con requestId. No repetir cambios que ya existan.
- [x] Ejecutar `node --test tests/tools/*.test.mjs` y los tests actuales de SQL/rutas/observabilidad: `npm run test:backend -- tests/backend/database.test.ts tests/backend/formatos-expedientes-route.test.ts tests/backend/http-observability.test.ts`.
- [x] Corregir solo fallos reproducidos; repetir la comprobación afectada. Registrar número de pruebas ejecutadas y condiciones.
- [x] Ejecutar `npm run verify` para el candidato revisable. Resultado esperado: lint, TypeScript, suites configuradas y build finalizados; cero pruebas ejecutadas no significa aprobado.
- [x] Revisar la regresión de navegador pertinente en configuración sintética: `npm run test:admin:browser -- tests/admin/browser/admin-workspace.spec.ts`. Si faltan navegador o dependencias, resolver entorno con mecanismo autorizado; no instalar silenciosamente.
- [x] Preparar commit de archivos explícitos y evidencia, cuando esté autorizado. No incluir documentos/fixtures ajenos solo porque estén untracked.

**Aceptación:** matriz de cambios y resultados vinculada al commit candidato; no atribuir pruebas históricas a una ejecución nueva. **Reversión:** revertir solo el commit propio; los cambios remotos previos se registran y no se deshacen por descartar la rama.

### REC-01 — ensayo de recuperación completo

**Archivos:** `tools/fortius-inmuebles-backup.mjs`, `tools/fortius-inmuebles-owner-export.sql`, `tools/fortius-inmuebles-restore-current.mjs`, `tests/tools/backup-coverage.test.mjs`, `tests/tools/restore-current.test.mjs`, `docs/fortius-inmuebles-backup-restore.md`.

**Consume:** esquema vigente, destino aislado y DEC-06. **Produce:** inventario de DB/Auth/Storage y procedimiento de restauración con conteos, hashes, referencias y tiempos medidos.

- [x] Inventariar las 18 tablas existentes y exigir detección de tablas nuevas; catálogo y cobertura documentados en la iteración 1, sin leer registros personales.
- [x] Registrar objetivos iniciales aprobados: copia diaria/RPO 24 h y RTO 8 h. Custodia, retención y autorización del destino siguen pendientes; el ensayo inicial usa datos sintéticos.
- [ ] Abrir solo un destino aislado expresamente autorizado para la prueba; nunca limpiar/restaurar producción.
- [ ] Preparar fixtures de personal/asesores/clientes/inmueble/expediente/actividad/documentos y bytes sintéticos. No equiparar un usuario sintético con una restauración de las identidades productivas.
- [x] Mantener prueba del backup incompleto. Caso esperado existente: `ownerExport` rechaza snapshot sin `record_history` o `expediente_actividad`; comprobar `tests/tools/backup-coverage.test.mjs`.
- [x] Añadir al mecanismo de ensayo reconciliación manifiesto de objetos → bucket/path → sha256 y permisos. Test negativo: objeto faltante o hash distinto falla, no se marca restauración completa.
- [ ] Restaurar en aislado; validar relaciones, cantidades, versiones, hashes y acceso de dos identidades sintéticas. Medir duración y consistencia del snapshot.
- [x] Documentar qué parte de Auth/Storage fue comprobada y qué requiere procedimiento del proveedor; no declarar recuperación integral con DB sola.
- [ ] Ejecutar de nuevo el ensayo de forma reproducible; conservación/disposición del destino según autorización, sin borrar artefactos ajenos.

**Aceptación:** objetivos acordados y recuperación del alcance probado con evidencia; pendiente explícito si queda Auth/Storage fuera. **Reversión:** detener la prueba y descartar/restablecer exclusivamente el destino aislado autorizado; no modificar fuente productiva.

### CI-01 / ENV-01 — publicación e inventario de entornos

**Archivos/ámbito:** `.github/workflows/verify.yml`, configuración administrativa de GitHub/Vercel, dominios, variables por nombre/ámbito. No volcar valores.

**Consume:** BAS-01 y DEC-10. **Produce:** checklist del flujo aprobado y evidencia de bloqueo ante fallo; inventario público/admin/preview/desarrollo.

- [x] Leer configuración Vercel, fuente/ámbitos y estado de main; inventario registrado. Main permanece sin protección; no inferir aislamiento a partir del nombre Preview.
- [x] Identificar el flujo nativo de Deployment Checks compatible con el plan observado; decisión y límites registrados.
- [x] Configurar y releer checks Vercel en ambos proyectos. La protección GitHub main sigue bloqueada por permisos de la conexión; esta casilla no la acredita.
- [x] En PR/preview de prueba, comprobar check failed y aliasAssigned=false; los targets productivos se conservaron. Prueba del mecanismo en preview, sin promoción productiva de ese candidato.
- [x] Recuperar a verde y comprobar asignación del alias de preview; restituir ámbitos de checks a producción. La publicación posterior del integrado se documenta en PR #15, sin autorizar nuevas releases.
- [x] 17/10/2026: regla de GitHub «main exige verify» creada (Verify obligatorio para fusionar en `main`) y auto-merge activado en el repositorio; con ella, un PR con auto-merge se integra solo cuando Verify aprueba.
- [ ] Inventariar despliegue antiguo y dependencias Auth/enlaces/tráfico; formular retiro/redirección sin ejecutarlo hasta aprobación concreta.
- [ ] Revisar rollback de aplicación y compatibilidad del esquema vigente. Una migración aplicada no se borra del historial para revertir aplicación.

**Aceptación:** el bloqueo de publicación se demuestra; si configuración inaccesible, estado `bloqueada`, no `aceptada`. **Reversión:** restaurar configuración previa registrada de forma segura; conservar checks que ya protegían el proyecto.

### AUT-01 / OBS-01 — acceso y diagnóstico de incidentes

**Archivos:** `src/lib/backend/auth.ts`, `src/lib/backend/http.ts`, `src/components/admin/admin-shell.tsx`, `src/app/api/health/route.ts`, pruebas de auth/HTTP.

**Consume:** DEC-03/10 y BAS-01. **Produce:** flujo de cuenta controlada y política MFA; correlación de fallos sin datos sensibles.

- [ ] Probar recuperación e invitación con cuenta/buzón de prueba autorizados. La lectura de site_url correcto no prueba entrega de correo.
- [ ] Definir enrolamiento, recuperación y alcance MFA. No imponer segundo factor hasta verificar recuperación y acceso de emergencia.
- [ ] Mantener pruebas actuales de cookies/sesión/capacidades. Añadir prueba negativa de sesión insuficiente cuando se apruebe MFA; no impedir cuentas actuales sin transición.
- [x] Comprobar requestId en respuesta y log 5xx controlado; la prueba debe confirmar ausencia de error crudo, cuerpo, correo, token y documentos.
- [ ] Tras publicación autorizada, comprobar recepción/retención/alerta de logs mediante error controlado en entorno de prueba.

**Aceptación:** cuenta controlada completa flujo; MFA recuperable si se activa; fallo trazable sin PII. **Reversión:** mantener forma previa de acceso durante transición; desactivar regla nueva si bloquea usuarios, con registro administrativo.

### PRV-01 — tratamiento, conservación y acceso a datos

**Archivos/ámbito:** formatos y schemas existentes, proyección pública, políticas Storage/RLS y avisos. Registro existente para revisión: `docs/erp-crm/privacy/data-processing-register.md`.

**Consume:** inventario de campos/documentos y DEC-06. **Produce:** matriz dato → finalidad → fundamento/consentimiento aplicable → quién accede → plazo → disposición, aprobada por responsable de privacidad y revisor jurídico.

- [x] Inventariar tipos y flujos desde código/formatos en el registro de tratamiento, sin descargar documentos de clientes; aprobación profesional pendiente.
- [ ] Verificar fuentes oficiales vigentes y aplicabilidad de protección de datos, conservación y obligaciones de operación inmobiliaria. Registrar fuentes/fecha y revisión profesional; no fijar plazos o obligaciones por memoria.
- [ ] Acordar manejo de solicitudes de acceso/corrección/disposición y casos de conservación obligatoria. Eliminación visual de un expediente no equivale a borrado de datos/archivos.
- [ ] Cotejar aviso y consentimiento existentes con el tratamiento real propuesto; cambios jurídicos mediante revisión y aprobación específicas.
- [ ] Definir pruebas de acceso/exportación/corrección con datos sintéticos; garantizar que proyección pública/logs no incluyen datos internos. Reutilizar pruebas de public boundary y descargas donde ya cubran esos límites.
- [ ] Incorporar minimización, conservación y permisos aprobados en las tareas dueñas de cada dato. Un pendiente de revisión no se presenta como cumplimiento normativo.

**Aceptación:** matriz y responsables aprobados, restricciones trazadas a tareas y pruebas; ningún nuevo destino de datos sensibles sin evaluación. **Reversión:** suspender tratamiento nuevo que no tenga autorización; preservar conservación exigible y evidencia, sin borrado automático.

## Tareas detalladas de captación

Ventana propuesta: 12–20 días de ingeniería. Requiere revisión de DEC-02/03/04/05/09 y base estable. Utilizar un caso de venta y datos sintéticos. Las interfaces siguientes concretan la primera porción de REL-01/SEG-01/USR-01/CRM-01/OPS-01; organizaciones y papeles adicionales siguen en REL-01 y se detallan después de aprobar su vocabulario.

### REL-01 — vínculo persona/inmueble

**Crear:** `src/lib/personas/types.ts`, `src/lib/personas/schema.ts`, `src/lib/personas/server.ts`, `src/app/api/admin/property-parties/route.ts`, `src/components/admin/property-parties-editor.tsx`, migración nueva aditiva en `supabase/migrations/` con fecha real de ejecución.

**Modificar:** `src/components/admin/property-form.tsx`, contexto de clientes/expedientes; añadir relaciones al inventario de backup cuando se creen tablas.

**Tests propuestos:** `tests/backend/property-parties.test.ts`, `tests/backend/property-parties-database.test.ts`, `tests/admin/property-parties-editor.test.tsx`.

**Consume:** `Cliente.id`, slug de `Property`, identidad de personal y versiones existentes. **Produce (propuesto):**

```ts
type PropertyPartyLink = {
  id: string; propiedadSlug: string; clienteId: string;
  papel: "propietario" | "representante";
  base: "declarado" | "documentado" | "revisado";
  fuenteRef: string | null; estado: "vigente" | "revocado";
  version: number; actualizadoEl: string;
};
type PropertyPartyInput = Omit<PropertyPartyLink, "id" | "version" | "actualizadoEl">;
// server.ts: clientes/inmuebles se comprueban con alcance de la sesión.
export declare function putPropertyParty(client: SupabaseClient, input: PropertyPartyInput,
  id: string, expectedVersion: number | null): Promise<PropertyPartyLink>;
```

Las categorías propuestas requieren DEC-04: `revisado` registra un hecho profesional y su evidencia, no permite que un usuario cualquiera valide titularidad. Si la matriz exige separar conclusiones por disciplina, cambiar el contrato antes de programarlo.

- [ ] Confirmar papeles, evidencia y alcance; definir con profesional cómo se registra un representante sin presumir facultades.
- [ ] Escribir tests de dos propietarios del mismo inmueble, una persona con dos inmuebles, revocación, vínculo repetido, cliente inaccesible y fuente requerida para base revisada.
- [ ] Ejecutar `npm run test:backend -- tests/backend/property-parties.test.ts`; esperar fallo específico por función inexistente antes de implementación nueva.
- [ ] Crear esquema/type/servicio y migración con referencias, versiones, historial y RLS. No migrar automáticamente por coincidencia de nombre o texto libre.
- [ ] Crear API con autenticación, validación, control de origen y respuesta de conflicto; no usar service_role para eludir alcance del usuario.
- [ ] Añadir editor contextual y tabla de relaciones; múltiples propietarios visibles como vínculos registrados, no porcentajes asumidos.
- [ ] Añadir tests SQL y UI de alcance/409; un cliente desconocido no debe crear una referencia huérfana.
- [ ] Ensayar migración y lectura de registros legacy sin nuevos vínculos. Backup/restauración contempla tabla nueva.
- [ ] Ejecutar tests de REL-01, TypeScript y regresión property-form; registrar aceptación técnica.

**Reversión:** aplicación deja de escribir/mostrar relación nueva, conserva registros y tablas; corrección forward de datos si se necesita. No borrar vínculos reales como mecanismo de rollback.

### SEG-01 — acceso a contexto operativo

**Crear:** `src/lib/identity/capabilities.ts`, pruebas `tests/backend/operation-access.test.ts`; migración RLS solo si la matriz aprobada exige ampliar el modelo.

**Modificar:** `backend/auth.ts`, rutas de relaciones/operación y descargas; mantener firmas actuales compatibles.

**Consume:** `StaffUser`, vínculo cuenta–asesor, permiso de expediente. **Produce (propuesto):**

```ts
export declare function requireOperationAccess(expedienteId: string,
  action: "read" | "write" | "assign"):
  Promise<{ user: StaffUser; client: SupabaseClient }>;
```

- [ ] Aprobar matriz de capacidades con ejemplos: asesor A, asesor B, administrador y revisión especializada. No extender roles definitivos sin DEC-03.
- [ ] Escribir prueba de lectura/escritura/reasignación antes/después y de PDF/adjunto del mismo contexto.
- [ ] Implementar comprobación de acceso en servidor y RLS; servicio y SQL deben coincidir, no duplicar una política contradictoria.
- [ ] Probar acceso directo de DB de identidades sintéticas, además de API/UI; servicio privilegiado no es el sujeto de esas pruebas.
- [ ] Conservar comportamiento de documentos históricos y de cuentas actuales; activar cambios según migración aprobada.

**Aceptación:** una referencia desde dashboard nunca otorga acceso adicional; retirar asignación impide nueva lectura/descarga del ámbito retirado. No prometer retirar bytes ya descargados por un usuario.

### USR-01 — administración del equipo desde el panel

**Crear:** `src/app/admin/equipo/page.tsx`, `src/app/api/admin/staff/route.ts`, `src/lib/identity/staff-admin.ts`; tests `tests/backend/staff-admin.test.ts` y `tests/admin/staff-admin.test.tsx`.

**Modificar:** navegación del shell y asociación de cuentas/asesores existentes. **Consume:** identidad y capacidades aprobadas; AUT-01. **Produce:** invitación, vínculo cuenta–asesor, activación/desactivación y bitácora. Invitación usa servicio de Supabase del lado servidor únicamente después de autorizar la operación administrativa.

- [ ] Confirmar quién puede invitar/asignar capacidades/desactivar. Mantener perfiles públicos y cuentas Auth como entidades distintas.
- [ ] Escribir tests: asesor no puede invitar; invitación repetida no crea doble vínculo; desactivar último administrador activo falla; error del proveedor deja estado visible y reintentable.
- [ ] Implementar API con validación/origen/autorización y credencial privilegiada solo servidor para la acción necesaria; registrar actor/acción sin tokens ni contraseña.
- [ ] Crear interfaz de equipo que muestre estado de invitación/cuenta/vínculo y acciones permitidas. Una invitación enviada no significa usuario activado.
- [ ] Probar con cuenta de prueba autorizada y enlazar recuperación/MFA; no enviar invitaciones a terceros sin autorización.

**Aceptación:** Moisés administra equipo desde el panel sin entrar a tablas; impedir bloqueo de administración; API y RLS conservan permisos. **Reversión:** retirar UI/acciones nuevas, conservar usuarios y vínculos existentes; no eliminar cuentas como rollback.

### CRM-01 — conversión y próxima acción

**Regla vigente (18/10/2026):** la conversión de `leads` a `clientes` es un mecanismo técnico para abrir la operación; no hace cliente a nadie. La condición «Cliente» la da el contrato firmado (RP-90 a RP-92, COR-10).

**Modificar:** `src/lib/backend/lead-conversion.ts`, rutas de conversión, `src/components/admin/convert-lead-button.tsx`, perfiles de lead/cliente, `src/lib/admin/followups.ts`, enlaces RelatedWork.

**Tests existentes:** `tests/backend/lead-conversion-database.test.ts`, `tests/backend/lead-conversion-route.test.ts`, `tests/admin/lead-conversion.test.tsx`. Añadir prueba de recorrido CRM si el escenario completo no existe.

**Consume:** `convertLead(client, id, { version })` existente; REL-01/SEG-01. **Produce:** mismos IDs/contrato de conversión actual, contexto y próxima acción con responsable.

- [ ] Repetir tests actuales para comprobar idempotencia ya implementada; no rehacer RPC sin un fallo demostrado.
- [ ] Añadir test de respuesta perdida/reintento que conserve clienteId y leadId únicos, y conflicto de versión que conserve captura.
- [ ] Presentar propietario/comprador y vínculos en contexto; registrar coincidencias como avisos, nunca fusión automática.
- [ ] Añadir siguiente acción con fecha/responsable o motivo explícito de pendiente, reutilizando tareas/seguimiento. Contacto confirmado se registra, no se infiere de abrir WhatsApp.
- [ ] Comprobar resultado tras recarga y en alcance del asesor correcto; preservar firstContactedAt y snapshot de lead original.

**Aceptación:** convertir dos veces produce el mismo registro autorizado; perfil y próxima acción permanecen tras recarga; sin venta/income inferida por conversión.

### OPS-01 — apertura operativa y tareas vinculadas

**Crear:** `src/lib/operaciones/types.ts`, `src/lib/operaciones/schema.ts`, `src/lib/operaciones/server.ts`; test `tests/backend/operation-create.test.ts` y recorrido `tests/admin/browser/crm-operation-journey.spec.ts`.

**Modificar:** `src/app/api/admin/expedientes/route.ts`, `src/lib/formatos/schemas.ts`, `src/app/admin/expedientes/page.tsx`, `src/lib/tasks.ts`, `src/components/admin/task-form.tsx`, referencias SQL existentes, `workspace/related-work.tsx`, `workspace/today.tsx`.

**Consume:** expediente actual, cliente/asesor autorizados y vínculo al inmueble. **Produce (propuesto):**

```ts
type OpenOperationInput = {
  clienteId: string; asesorId: string; propiedadSlug?: string;
  folio: string; operacion: "venta"; unidad?: string; requestId: string;
};
type OpenOperationResult = {
  expediente: { id: string; version: number; folio: string };
  reused: boolean;
};
export declare function openOperation(client: SupabaseClient,
  input: OpenOperationInput): Promise<OpenOperationResult>;
```

El wrapper de creación inicial cubre venta; el endpoint mantiene los tipos ya admitidos y compatibilidad con callers antiguos. El requestId nuevo usa UUID, se conserva por intento y no se reutiliza para un negocio distinto. Task añade `expedienteId?: string` UUID: distinto de los IDs de records.

- [ ] Aprobar si expediente sigue siendo la referencia única inicial y qué creación sin inmueble está permitida; cotejar posibles vínculos con inmobiliaria-os antes de agregar segunda operación.
- [ ] Escribir tests: mismo requestId/mismo payload devuelve mismo expediente; mismo requestId/payload distinto = 409; cliente/asesor incompatibles = denegación; fallo de creación no deja relación inválida.
- [ ] Ejecutar `npm run test:backend -- tests/backend/operation-create.test.ts`; fallo esperado por función inexistente para caso nuevo.
- [ ] Implementar apertura transaccional/RPC y persistencia de idempotencia con RLS; conservar creación legacy para clientes existentes de API.
- [ ] Agregar `expedienteId` a tarea, validación de existencia y alcance, y referencias consistentes. Legacy sin ese campo conserva funcionamiento.
- [ ] Añadir flujo contextual de apertura, responsable y tarea/visita; si la siguiente creación falla, mostrar expediente creado y permitir reanudar sin duplicarlo.
- [ ] Mantener las etapas existentes; no activar restricciones de avance hasta aprobar DEC-05. Mostrar recepción distinta de revisión.
- [ ] Ejecutar recorrido de navegador sintético con recarga, conexión interrumpida y móvil/escritorio. La captura debe terminar con cliente, relación, inmueble, expediente y tarea/visita enlazados.
- [ ] Revisar RLS SQL, concurrencia, backup, API anterior, formularios y TypeScript/build. Migración en aislado antes de producción autorizada.

**Reversión:** desactivar flujo nuevo por configuración/versionado compatible; conservar expediente y vínculos creados; no borrar operaciones como rollback. **Aceptación de negocio:** Moisés revisa escenario y siguiente acción; no se declara aprobada por test automático.

### DAT-01 — preparación de datos y migración asistida

**Crear:** utilidades propuestas `tools/erp-crm/validate-import.mjs` y `tests/tools/erp-crm-import.test.mjs`; reporte sección de política de datos en este plan.

**Consume:** reglas aprobadas de REL-01 y PRV-01, IDs y versiones legacy. **Produce:** informe de simulación con conteos y referencias sintéticas; contratos de import/export por capacidad.

- [ ] Definir formato de importación con IDs de origen, versión y tipo de registro; exportaciones solo por capacidad y ámbito. No decidir por defecto qué archivos personales mover.
- [ ] Escribir prueba de fixture duplicado, referencia huérfana, moneda inválida, fecha inválida y propietario ambiguo; cada caso se rechaza o va a revisión, no se corrige silenciosamente.
- [ ] Implementar validador sin escrituras; reporte agregado sin imprimir contenido personal. Ejecutar `node --test tests/tools/erp-crm-import.test.mjs`.
- [ ] Diseñar ejecución aprobada idempotente mediante identificador de lote y correspondencia de origen; probar reintento y reversión de un lote sintético en destino aislado.
- [ ] Importación real solo tras autorización concreta de fuente/destino y revisión del informe; dejar registros ambiguos fuera y preservados.

**Aceptación:** validación y simulación separadas de la escritura, reintento sin duplicado, acceso/exportación autorizado y evidencia de compatibilidad. **Reversión:** compensar solo el lote propio cuando no existan referencias posteriores; si las hay, corrección controlada hacia delante.

## Cierre de iteración y siguiente detalle

- [ ] Registrar tarea → commit → prueba → criterio → revisión humana; cada pendiente mantiene motivo y responsable.
- [ ] Marcar `en_revision` al completar comprobación técnica; `aceptada` solo con evidencia del aprobador.
- [ ] Detallar COM-01/VIS-01/OFE-01/DOC-01 usando entidades finalmente aprobadas; no construirlos con interfaces antiguas supuestas.
- [ ] Ajustar rangos y capacidad con duración observada, sin atribuir al agente plazos garantizados ni conversiones comerciales.

Las tareas de continuidad marcadas corresponden a la evidencia anterior; las tareas de captación permanecen pendientes. Cada nueva ejecución debe registrar su resultado, revisión y límites en este mismo plan.

## Cómo trabajar y registrar avances

1. Tomar una sola tarea, leer sus entradas/dependencias y comprobar qué parte ya existe.
2. Si cambia comportamiento, escribir primero una prueba que reproduzca el caso y verla fallar antes de implementar.
3. Hacer el cambio menor que cumple el criterio, comprobar permisos/compatibilidad y repetir las verificaciones afectadas.
4. Registrar en este archivo el cambio, el commit o estado local, la prueba real, la fecha y los límites. No crear otro roadmap, bitácora de desarrollo o JSON de seguimiento paralelo.
5. Una decisión menor de ingeniería puede resolverse y explicarse aquí. Política de negocio, interpretación jurídica, infraestructura productiva y datos reales requieren su autorización específica.
6. Revisar cada entrega sobre los archivos finales. Aprobación técnica, aceptación humana y publicación son hechos distintos.
7. Antes de diseñar una pantalla o entrega, leer «Dirección del producto y reglas vigentes». Si el titular aprueba una idea que contradice una regla, reescribir la regla anterior en su lugar y anotarlo en «Reglas reemplazadas».

La carpeta de trabajo se conserva única por indicación del titular; esta preparación usa una rama local. La evidencia voluminosa, capturas y archivos de ejecución van fuera del repositorio. Mantener credenciales y copias privadas fuera de Git; no incluirlas en commits o PR.

## Registro de la preparación actual

| Comprobación | Estado | Evidencia / límite |
|---|---|---|
| Consolidación de instrucciones | Comprobada | Un único plan con los 42 entregables, alcance, tareas, estados y dependencias conservados. |
| Archivo recuperable y limpieza | Comprobada | 1,358 archivos retirados de 15 rutas; copia externa de 1,379 archivos con hashes y tamaños comprobados. |
| Verificación de aplicación | Aprobada localmente el 12/10 | npm run verify: lint, tipos, 499 pruebas backend, 211 de panel y compilación; salida 0. |
| Herramientas de recuperación y activos PDF | Aprobadas localmente el 12/10 | 12 pruebas, cero fallos y cero omisiones; recursos PDF comprobados. Caso de escape ejercido realmente con una unión de directorio en Windows. |
| Revisión independiente | Aprobada en revisión R2 | Criterios de plan único, fidelidad, recuperación, referencias, preservación y preparación local comprobados; cero hallazgos obligatorios abiertos. |

**Decisiones de ejecución de esta preparación:** mantener una sola carpeta y trabajar en rama local; conservar código y migraciones históricos que siguen siendo necesarios; guardar evidencia y copias fuera del repositorio. La prueba de escape conservó symlink de archivo en Linux y usa junction de directorio en Windows, comprobando primero que los bytes externos son accesibles y después que el verificador los rechaza. No se omitió ese caso ni se cambió la protección del respaldo. La referencia de API es [Node.js, fsPromises.symlink](https://nodejs.org/docs/latest-v24.x/api/fs.html#fspromisessymlinktarget-path-type).

**Preparación local terminada y comprobada.** *(Siguiente acción reemplazada el 17/10/2026 por el «Orden vigente» al inicio del plan.)* La siguiente acción registrada entonces era continuar la fase de captación, empezando por REL-01 y SEG-01, con DEC-02/03/04/05/09 resueltas antes de activar sus políticas. Los pendientes del proveedor siguen abiertos; el ERP completo no se declara terminado por ordenar archivos.

## Implementación aprobada — 20 apps para asesores (13/10/2026)

*Registro histórico. Desde el 15/10/2026 (Fase A) quedaron 16 herramientas, y 17 desde que se agregó «Documentos sin expediente» el 17/10/2026: firmas, OCR, consulta documental y rutas se retiraron del código. Si se retoman, entran por EXT-05, EXT-06/EXT-11 y EXT-09 con proveedor decidido de nuevo; los proveedores, costos y el orden de entregas de esta sección ya no aplican.*

Objetivo: veinte herramientas funcionales en /admin/apps/[slug], con captura, resultados, guardado privado, reapertura y exportación. Menú superior exclusivo de herramientas; barra lateral para operación. Conservar identidad Fortius, web pública, funciones existentes y permisos. Contexto de inmueble/cliente/expediente validado en servidor; un expediente único. No mover automáticamente etapas por emitir un documento o recibir una firma.

1. Ficha comercial: datos publicables, fotografías, contacto, PDF versionado.
2. Hipoteca: precio, enganche, tasa, plazo, seguros, comisiones, anticipos, amortización y escenarios; reutilizar motor.
3. Comparables: inventario, captura e importación CSV, fuente/fecha/moneda/superficie, ajustes y oferta vs cierre.
4. Ofertas: precio, pagos, plazos, condiciones, neto, comparación y recomendación humana.
5. Neto: gastos pendientes, crédito, honorarios e impuestos capturados; pagado histórico separado; desconocido no es cero.
6. Comisiones: base, porcentaje/importe, impuestos, reparto y redondeo comprobados.
7. Informes propietario: periodo, actividad, visitas, ofertas, próximos pasos, vista previa, PDF.
8. Plantillas/PDF: formatos actuales y unir/separar/ordenar/rotar PDF conservando originales.
9. Firmas: DocuSeal API, campos/firmantes, envío explícito, eventos autenticados, estados, firmado/evidencia inmutables; sin constructor incrustado de pago.
10. Revisor: listas versionadas, faltantes/vencimientos/discrepancias, revisión humana y pendientes.
11. Fotos: recorte, giro, luz/contraste, compresión/marca, original intacto y copia sin GPS.
12. QR: ficha pública o documento expresamente compartido, revocable y vencimiento privado 7 días.
13. Rutas: Google Routes, coordenadas capturadas, hasta10 paradas, horarios fijos conservan orden.
14. Conversor: m2/ft2/ha, m/ft, MXN/USD, cambio manual con fuente/fecha congelado. Resultado visible en pantalla; no genera ni descarga PDF (decisión del titular del 13/10/2026).
15. Inversión: flujos fechados proyecto/deuda/capital, ROI denominador explícito, VAN365, TIR no determinada si ambigua, escenarios y PDF/CSV.
16. Rehabilitación: partidas/unidades/cantidades/precios/impuestos/contingencia/desembolsos; transferencia explícita a inversión.
17. OCR: Document AI, PDF/JPG/PNG 20MB/100páginas dividido en lotes, original/huella, texto corregible por página.
18. Versiones: adiciones/eliminaciones/textos lado a lado, OCR identificado, no certificar equivalencia de imágenes/firmas.
19. Consulta: búsqueda local PostgreSQL filtrada por permisos + OpenAI GPT-5.4-mini, citas archivo/versión/página, abstención e inyección tratada como texto.
20. Cotizador: servicios/honorarios/gastos/descuentos/impuestos/vigencia, PDF y versiones; sin CFDI o contrato automático.

### Orden de entregas y aceptación
- [ ] 0. Entorno aislado, costos/cuentas/retención y prueba proveedor firma.
- [ ] 1. Catálogo, favoritos, contexto, guardado/versiones, permisos, archivos, trabajos y consumo.
- [ ] 2. Apps1/8/11/12/14/20.
- [ ] 3. Apps2/5/6/15/16.
- [ ] 4. Apps3/4/7/13.
- [ ] 5. Apps17/18/10/19.
- [ ] 6. Firma9 y QA conjunta/piloto/despliegue.

Modelo AppRun: slug, entradas, resultado, autor, contexto, versión, fechas. Trabajos persistentes con cuotas, reintentos limitados e idempotencia. Autorización al crear/ejecutar/entregar; RLS y control optimista. Privados de autor/admin o permisos del expediente. No copiar secretos reales al entorno aislado.

Presupuesto nuevos servicios:2000MXN/mes global (excluye desarrollo/alojamiento actual). Referencia 40firmas=28USD; 1000consultas de8000tokens entrada/2000salida=15USD; 2000páginasOCR=3USD;200rutas=2USD. Total48USD; supuesto20MXN/USD y16%recargo=1113.60MXN+200infra+400reserva=1713.60MXN. Tarifas referidas13oct2026, confirmar cuenta real antes activar. Reservar costo máximo antes ejecutar, incluir obligaciones firmadas otro mes, avisar80%, bloquear saldo insuficiente. No contratación implícita. Fuentes: docuseal.com/pricing, developers.openai.com/api/docs/models/gpt-5.4-mini, cloud.google.com/products/document-ai/pricing, developers.google.com/maps/billing-and-pricing/pricing.

Pruebas: cálculo independiente, dosasesores/admin, concurrencia/duplicados/sesión, guardar-reabrir-exportar20apps, OCR ilegible, citas/aislamiento/inyección, webhookfalso/repetido/desordenado, proveedor caído/cuotas. Lint/tipos/build/pruebas, UI escritorio/tablet/móvil/teclado/claro-oscuro yPDFs renderizados. Migración/restauración aisladas, revisión independiente y piloto real controlado. Solo20/20 cuando todas estén probadas y los servicios configurados. store:false no implica retencióncero; revisar conservación/eliminación/contratos antes datos reales.

### Estado de implementación — 13/10/2026

**Núcleo de 16 apps publicado en el dominio real; cuatro integraciones externas diferidas.** Rama `codex/apps-asesores`, basada en `a35315d`. Se reutilizó el checkout aislado del panel para conservar intactos los cambios de la página pública que estaban en la carpeta principal. Este aislamiento no crea un segundo plan.

- Catálogo y menú superior con las 20 herramientas, búsqueda y favoritos. La barra lateral separa seis etapas del procedimiento y conserva los módulos existentes dentro de Gestión.
- Dieciséis herramientas locales implementadas: ficha, hipoteca, comparables, ofertas, neto, comisiones, informe, PDF, revisor, fotos, QR, conversor, inversiones, rehabilitación, versiones y cotizador. Guardado privado, reapertura, historial, eliminación recuperable y exportación comparten la misma plataforma.
- Firmas, OCR, consulta documental y rutas tienen interfaz e integración preparadas. **Su activación se difiere por decisión del titular.** No se contrataron cuentas, copiaron claves, enviaron firmas ni efectuaron llamadas pagadas. `FORTIUS_APPS_ENABLED=false` mantiene desactivado el procesamiento externo.

| Entrega | Estado comprobado | Pendiente |
|---|---|---|
| Entorno y plataforma | Implementación local, migraciones y permisos probados | Migraciones remotas aplicadas; respaldo completo y ensayo local aprobados |
| Herramientas diarias, financieras y comerciales | Motores, formularios y exportación implementados; regresiones aprobadas | Piloto con cuentas autorizadas en el entorno desplegado |
| Documentos e integraciones | Archivos privados, versiones, cuotas, citas y eventos probados con datos sintéticos | Proveedores y límites reales; diferidos |
| Presentación | 20 rutas revisadas en navegador; escritorio, tableta, móvil y temas claro/oscuro; PDF de cuatro páginas inspeccionado | Recorrido productivo de guardado, reapertura e historial realizado; pendiente piloto de dos asesores |

**Verificación local:** suite general de 637 pruebas backend y 313 de panel aprobada; lint, tipos y compilación aprobados. Después se añadieron dos regresiones de búsqueda y tres de reintentos de guardado: las 18 pruebas afectadas volvieron a pasar. Revisiones independientes de motores, plataforma y seguridad cerraron los defectos reproducidos, incluida la búsqueda por varios términos. La prueba visual de guardado/reapertura usó un servidor de datos sintéticos; los permisos se probaron separadamente con las migraciones reales en PostgreSQL embebido. Esto no acredita una conexión productiva.

**Activación del núcleo local:** antes de migrar, obtener y verificar una copia con el exportador correspondiente al esquema instalado (el exportador de la base `a35315d` cubre las 18 tablas anteriores; el nuevo requiere las migraciones de Apps). Aplicar, en orden y después de las migraciones existentes, `20261014002133_apps_runs.sql` y `20261014002229_fortius_apps_integrations.sql`; desplegar la rama con la configuración de autenticación y Storage autorizada para ese destino; mantener desactivados los proveedores; probar guardar, reabrir, exportar, eliminar/restaurar y aislamiento entre dos asesores y un administrador. La aplicación remota se realizó después, durante la ventana de publicación autorizada que se registra abajo. La autorización previa de secretos corresponde a `codex/erp-crm-preview` y no se extiende automáticamente a esta rama.

**Activación posterior de proveedores:** configurar las variables de servidor indicadas en `.env.example`, verificar cuentas, tarifas, moneda, impuestos, retención y límites; probar documentos sintéticos y webhook antes de habilitar datos reales. El presupuesto interno reserva costos estimados; falta contrastarlo con la facturación efectiva. Probar también la concurrencia entre conexiones PostgreSQL independientes y los límites de 20 MB/100 páginas con los servicios reales.

**Dependencias revisadas — 13/10/2026:** se actualizaron Next.js y su configuración de lint a 16.3.8, Sharp a 0.35.5, y las dependencias transitivas brace-expansion, source-map-js y undici a sus correcciones compatibles. La auditoría de dependencias de producción informa cero alertas; CI la comprueba en cada revisión. La auditoría completa conserva cinco entradas altas de una misma cadena de desarrollo (eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces 3.0.3), sin parche publicado. Solo procesa los patrones locales de lint; no se usa para entradas del panel. No se oculta la alerta ni se degrada Next.js para eliminarla. Fuentes verificadas: https://github.com/advisories/GHSA-cjq9-62q9-8jv4 y https://github.com/advisories/GHSA-vfj7-8cjw-p6xm. Comprobar también el paquete desplegado antes de afirmar ausencia de esa cadena en ejecución.

**Recuperación local:** el exportador y el ensayo de restauración ahora incluyen las 26 tablas y el bucket privado de integraciones. El formato actual exige las ocho tablas nuevas; las copias históricas completas de 18 tablas se reconocen expresamente y conservan sus datos. Se comprueban versiones, relaciones, huellas, tamaños, procedencia de originales, privacidad incluso de buckets vacíos y coincidencia de la versión declarada. Las 28 pruebas de respaldo/restauración pasan en entorno aislado; esto no equivale a restaurar la base o Storage remotos. También se verifica que el despliegue incluya las fuentes y bibliotecas necesarias para los PDF de las apps.

La migración remota y el despliegue del núcleo local están realizados. Siguen pendientes la aceptación del piloto de dos asesores y las cuatro activaciones externas. No se declara operación 20/20.

### Publicación del núcleo local — 13/10/2026

- Identificado el destino existente: Vercel `tonala/fortius-inmuebles` y Supabase `qkkirjzhviqwvuqjnmei` (Fortius Inmuebles). Producción ya dispone de su clave de servidor; no se copió a otra rama. No se activaron proveedores externos.
- Ventana sin ediciones confirmada por el titular. Respaldo final anterior a la migración: 18 tablas, cinco buckets y seis objetos (1,149,580 bytes), con integridad y restauración local verificadas. Las 18 tablas conservaron exactamente sus datos tras las migraciones.
- Aplicadas únicamente las migraciones `20261014002133_apps_runs.sql` y `20261014002229_fortius_apps_integrations.sql`. Verificadas 26 tablas con RLS y el nuevo bucket privado.
- Versión del núcleo promovida en `https://fortiusinmuebles.com`; salud HTTP 200. El panel autenticado permite guardar, recargar, reabrir y consultar versiones del trabajo de prueba. La corrección solicitada elimina el PDF del conversor y bloquea también esa exportación en el servidor; su cálculo sigue visible en pantalla.
- Respaldo posterior: 26 tablas, seis buckets y seis objetos, verificado y restaurado en PostgreSQL aislado. Los tres ledgers internos sin permiso de lectura REST se conservan íntegros en el export propietario. El manifiesto registra por separado las tres lecturas REST denegadas, sin ampliar permisos ni declarar ese complemento completo. Las 32 pruebas y la revisión independiente de la corrección pasan.
- Lint, tipos, 642 pruebas backend, 313 del panel, compilación y comprobaciones de navegador aprobadas para la versión publicada inicialmente. La corrección de conversor vuelve a pasar las 35 pruebas afectadas, lint y tipos; debe pasar además la verificación remota del commit antes de incorporarse a main.
- `.vercelignore` excluye credenciales, respaldos y evidencia de pruebas. No se copiaron secretos a esta rama. El aviso pendiente de dependencias de desarrollo descrito arriba no aparece en los 116 manifiestos de ejecución inspeccionados.
- Solo existe una cuenta de personal en la base actual. La separación entre asesores tiene pruebas aisladas; el piloto con dos cuentas reales sigue pendiente. No se crearon cuentas ni se ampliaron permisos para simularlo.

**Pendientes conservados:** activación de firmas, OCR, consultas documentales y rutas; piloto de dos asesores autorizados; ensayo completo de recuperación de Auth/Storage en un destino aislado. Ninguno se declara completado por la publicación del núcleo local.
