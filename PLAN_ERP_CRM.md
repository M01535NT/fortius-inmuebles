# Fortius — plan único de implementación del ERP/CRM

**Actualizado:** 11 de noviembre de 2026, America/Los_Angeles. **Responsable de negocio:** Moisés Núñez Tonalá. **Desarrollo:** agente de desarrollo. **Carpeta:** `C:\Paginas-web\fortius-inmuebles`.

Este archivo reúne el alcance, el orden de trabajo, las tareas y el avance del ERP/CRM. Es el único plan vigente de desarrollo. Los manuales de `docs/` son referencias de operación, no planes alternativos.

**Cómo leer este plan:** primero «Dónde nos quedamos» (cómo va el trabajo y qué sigue); después «Etapas por ruta» y «Matriz de reglas por ruta»; luego «Dirección del producto y reglas vigentes» (qué se construye y con qué reglas, incluido el «Orden vigente»); después los paquetes: «Simplificación de la interfaz (SIM)», «Navegación y productividad (NAV)», «Lenguaje visual (LV)», «Proceso, captura y documentos» (COR, CAP, FCH, MOT y CSR) y «Herramientas para trabajo suelto (HER)»; el resto es alcance, backlog, la matriz de estados y las tareas detalladas. El trabajo terminado y los registros de sesiones pasadas están en [`docs/erp-crm/historial-del-plan.md`](docs/erp-crm/historial-del-plan.md), que no es un plan: si contradice a este archivo, manda este archivo.

## Dónde nos quedamos — tablero al 12/11/2026

Esta sección es la única que hay que leer para saber cómo va el trabajo. Se reescribe al cerrar cada entrega; lo que deja de ser actual pasa a [`docs/erp-crm/historial-del-plan.md`](docs/erp-crm/historial-del-plan.md).

**Dónde está el código.**

- **En `main`** (commit `14856aa`): lo integrado hasta el 12/11/2026, incluidos los PR #67 (SEO), #68 (DOC-06), #69 (opinión de valor 07), #70 (blanco azulado `#F8F8FF` en el sitio público), #71 (contrato 09 sin PROFECO y con las cláusulas del Word del 26/10) y #72 (PDF del 09 liberado).
- **En la rama acumulada `claude/claude-code-project-strategy-8b1700`** (91 commits por delante de `main`, sin push): el trabajo de las sesiones en paralelo del 12/11/2026, ya juntas y probadas (lint sin errores, tipos limpios; base 979/979, panel 490/490 y herramientas 47/47). Espera la revisión del titular en localhost, la verificación completa y un solo PR (regla del titular: todo junto).
- **Migraciones por aplicar:** 8 que no están en `main` (`20261112180000` a `20261112235000`), sin números repetidos y con una sola versión por función. Se aplican solas al integrar en `main`; mientras tanto, la base remota no las tiene y las pantallas que dependen de ellas no funcionan completas en localhost.
- **Sin comprobar:** la build y las suites de navegador de la rama acumulada (las del sitio público pasaron en su rama); `verify-pdf-bundle`, que necesita build.

**Qué entró en la rama acumulada (12/11/2026).**

- **Bloque 0:** REC-01 con restauración de Storage y ensayo completo aprobado en un proyecto aislado (ya borrado); copia diaria cifrada a Cloudflare R2 (`.github/workflows/backup-daily.yml`, custodia del titular). Fuera del repositorio y autorizado por el titular: bucket R2 con bloqueo de 30 días, entorno `respaldo` en GitHub con sus secretos, escaneo de secretos y alertas de Dependabot activados, entornos viejos de GitHub y 18 variables sobrantes de Vercel borradas, ensayo de Instant Rollback. Al integrar: lanzar a mano «Respaldo diario» y comprobar el archivo en R2.
- **Bloque 1:** COR-18 (registrar contacto y la oferta 14 ligada al interesado), COR-20 (excepción del director con motivo), COR-23 y DEC-43 (alcance del asesor), COR-24 (inventario heredado), COR-26 («Tu primer día» y manual dentro del panel); formatos 07 y 09 (ya en `main`).
- **Bloque 2:** HER-01 a HER-03 y HER-05 (catálogo depurado en tres grupos, machotes en blanco, ISR y neto del vendedor con dos PDF, herramientas abiertas desde los datos, «Gastos de compra», «Ligas útiles», editar fotos de la galería); DEC-44 (captura por lista en el celular); DEC-47 (solo Hoy abre su guía sola).
- **Bloque 3:** CRM-01 a CRM-03 (propuesta en `docs/erp-crm/propuesta-seguimiento-comercial.md`; tareas del prospecto solo para su asesor; prospecto descartado que regresa se reabre con su asesor; mensajes listos que edita el director); DEC-42 (el siguiente paso es una tarea, notas en inmueble y operación, avisos del director en Hoy); CAP-06 (la 02 con el problema del inmueble y documentos por caso); PUB-02 (inmuebles compartidos con autorización escrita); DEC-41 (visita antes de la firma con carta del propietario).
- **Sitio público (auditoría UI/UX del 12/11):** cierre único del inicio, candado corto después de la primera navegación, modo oscuro según el teléfono, Vender con un solo formulario y checklist directo, equipo con iniciales mientras no haya foto, WhatsApp de Contacto legible, ficha más clara en el teléfono, cifras sin letra monoespaciada y contraste del blog. Informe y decisiones en la nota de la auditoría.

**Qué sigue, en orden.**

1. El titular revisa en localhost la rama acumulada (con el límite de las migraciones sin aplicar) y confirma DEC-40 y CAP-06 (abajo).
2. Verificación completa (`npm run verify`, unos 13 minutos, y las suites de navegador), con su permiso; auditoría en una sesión limpia (`gauntlet-review`).
3. Un solo PR a `main`; al integrar, «Respaldo diario» a mano y revisión de salud del sitio.
4. Pendientes del titular: cotejar el ISR con 3 o 4 casos de Nuvigant y su dirección (H-06); fotos reales del equipo y correo del dominio; textos que valida el abogado (cartas de DEC-40 y DEC-41, preguntas de DEC-39); LFPIORPI (antilavado), que no está en el plan.
5. Resto del bloque 1 (COR-10, COR-16, COR-21), USO-01 y USO-02, activar IA-01 y terminar IA-02.
6. NAV, UX-02 a UX-05, FCH-03, FCH-04 y FCH-06; escala tipográfica del sitio (P1 de la auditoría).
7. Bloque 3 restante (SEG-01, DAT-01, COR-25, visitas y ofertas, CAP-01 a CAP-04), después los bloques 4 a 7.

**Por confirmar con el titular (contradicciones encontradas al juntar):**

- **CAP-06:** la tabla dice que se construye después de que el abogado valide las preguntas y documentos de DEC-39; ya está construida en la rama acumulada.

**Decisiones vigentes que más cambian el trabajo:** ERP exclusivo de Fortius (RP-01); ningún dato faltante detiene el flujo (RP-82); descargar siempre, y descargar no es aprobar (RP-77, RP-85); entrevista con lo necesario para que el proceso funcione y opción «Ampliar» (RP-89); procesos por tipo de operación con motor editable (RP-79); las cuatro fases del boceto C para agrupar las etapas en pantalla; **una persona es prospecto hasta que firma su contrato, y un inmueble está captado solo cuando el propietario firma la intermediación** (RP-90 a RP-92); **Fortius solo representa al propietario: compradores y arrendatarios son leads de Fortius y contraparte de sus clientes, nunca clientes de Fortius** (RP-93).

**Color del lienzo del panel (titular, 11/11/2026):** el titular cambió en `src/app/admin/panel.module.css` el lienzo claro del panel de crema `#F5F1EB` a **`#F8F8FF`** y el borde de las tarjetas de `rgba(6, 31, 63, .06)` a **`rgba(6, 31, 63, .11)`**. Es la referencia vigente para LV-07 y LV-08; el modo oscuro no cambia. Desde el 12/11/2026 el sitio público también usa `#F8F8FF` en lugar del crema (ver `docs/brand.md`).

**Preguntas abiertas para el titular:** [`docs/erp-crm/CUESTIONARIO_TITULAR.md`](docs/erp-crm/CUESTIONARIO_TITULAR.md). Cada respuesta se integra en este plan como regla o decisión.

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

### Orden vigente

**Este orden manda.** La columna «Fase» de la matriz y la tabla «Orden y ventanas orientativas» agrupan por tema y sirven de referencia; si difieren, se sigue este orden. Cada entrega está en un bloque igual o posterior al de todo lo que necesita.

0. **Continuidad, en paralelo y sin frenar lo demás:** BAS-01, REC-01, CI-01, AUT-01, OBS-01, ENV-01 y PRV-01. Varias dependen de accesos externos; son condición para el piloto con datos reales (bloque 7), no para trabajar con datos simulados.
1. **Coherencia y fallas, antes de programar más:** USO-01 y MRP-01; COR-01 a COR-10 (COR-04 y COR-10 después de MRP-01); **IA-01, prioritaria por decisión del titular (17/10/2026), en cuanto haya clave de API**; los pendientes de formatos de «Lo que quedó abierto de PROC y FLUJO» (diseño y fotos del 07, DOC-06 y la decisión de DOC-09); comprobar la publicación del rediseño; **EXT-12, captura sobre el documento, formato por formato en el orden de las etapas (DEC-31, 27/10/2026): es el trabajo en curso** y absorbe los pendientes de diseño de cada formato que toque.
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

**Origen:** revisión crítica del titular y del agente sobre capturas reales del panel (15 pantallas, 1440 y 390 px, datos simulados, sin tocar la base). El titular aprobó **las 32 correcciones** el 17/10/2026. **Estado al 11/11/2026:** 19 correcciones de las tres revisiones están resueltas y en `main` (su texto pasó al historial); el estado de cada entrega está en «Entregas del paquete SIM» y en la matriz «Estado y dependencias de cada entrega».

**Cómo trabajarlo en la próxima sesión** (antes de cada entrega, volver a capturar la pantalla: el panel cambia):

1. Leer RP-50 a RP-57 y esta sección completa. Tomar una entrega SIM a la vez, en el orden de la tabla; cada una cabe en un commit o PR.
2. Antes de cambiar una pantalla, capturarla igual que en la revisión: servidor compilado con las variables de Supabase vacías y API simulada con `page.route`, como en `tests/admin/browser/secciones.spec.ts` y `process-corrections.spec.ts`. En este contenedor, Chromium se lanza con `executablePath: "/opt/pw-browsers/chromium"`. Nunca usar `.env.local` (apunta a la base real).
3. Después del cambio, volver a capturar a 390 y 1440 px, en claro y oscuro; comparar; correr lint, tipos, pruebas del panel y las de navegador afectadas; y actualizar las pruebas que buscan textos que cambian.
4. **Lo que no cambia:** reglas del servidor, permisos, validaciones (`workflowBlockers`, `reviewComplete`), datos y migraciones. SIM es de pantalla. Si una corrección necesita un dato nuevo, se pregunta al titular.
5. **Lo que se conserva** porque funciona: la estructura de Hoy, el asistente de 4 pasos de Nueva operación, la tabla de Contactos, el glosario sencillo y el estilo redondeado con fondo gris.
6. Registrar cada entrega en este plan (commit, pruebas, capturas revisadas, límites).

**Estado de las correcciones al 11/11/2026 (revisado en capturas del panel de ese día):**

| Estado | Correcciones |
|---|---|
| Resueltas y en `main`; su texto pasó al historial | C06, C08, C09, C10, C11, C13, C14, C16, C17, C19, C22, C24, C33, C34, C35, C36, C38, C39 y C44. |
| Resueltas en local, sin commit | C47 (SIM-16, Hoy en tres bloques); C23, C41 y C58 (SIM-07, fichas de persona); C50 (tres etapas, DEC-46); C52 y C53 (SIM-18, operación en tres partes, y Documentos sin «Crear y abrir»); C21 (pestaña Ajustes retirada, DEC-38); C54 y C55 (SIM-19, ficha del inmueble por pestañas). |
| Resueltas en parte | C12 (los mismos nombres de etapa en Reportes, en local desde el 12/11/2026 con SIM-11), C15 (quedan códigos de formato en «Documentos de la etapa» y en Expediente), C20, C26 y C27 con sus entregas, C37, C40 (queda el relleno de la vista previa), C42 y C45 (lo que falta está en C54 a C56). |
| Siguen pendientes | C01 a C05, C07, C18 (ahora C59), C25, C28 (pasa a HER-01), C29 a C32, C43, C46, C48, C49, C51, lo que falta de C53, C54 a C57, C59 y C60. |

### Las 32 correcciones

**A. Todo el panel**

| # | Hoy (lo que se vio) | Corrección |
|---|---|---|
| C01 | El guinda significa botón principal, sección activa, precio, vencido, visita y enlace. | Guinda solo para la acción principal y la sección activa. Vencido en `--destructive` con ícono y palabra. Precios en texto oscuro normal. Visitas en el azul de información de RP-70 (tokens nuevos `--info` y `--success`, claro y oscuro, con contraste AA; ver LV-01). |
| C02 | Fechas, precios, folios, contadores y «Paso 1 de 4» en letra monoespaciada (unos 20 archivos usan `font-mono`/monospace en `src/components/admin`). | Tipografía normal del panel en todo. El folio queda discreto en gris. Las horas de la agenda pueden usar números tabulares sin cambiar de letra. |
| C03 | Conviven «2026-10-17», «Vie 16 oct», «Desde el 15 oct». | Una función única de fecha humana (junto a `formatDate` en `src/lib/utils.ts`): «Hoy», «Mañana», «Ayer», «Lun 19», «19 oct», «Vencida hace 2 días». La usan todas las pantallas del panel. |
| C04 | Textos fijos repetidos: aviso amarillo de borradores en Inmuebles; «Al marcar Revisado te pedimos…» bajo cada requisito; notas al pie de Reportes; «La comunicación, las citas y las tareas conservan fechas propias…». | Retirar los textos permanentes; explicar en el momento (al intentar la acción) o detrás de «?». |
| C05 | Demasiadas etiquetas en mayúsculas («LO QUE SIGUE · ETAPA 1 DE 10», «PROPIETARIO», «PRÓXIMA TAREA», «HERRAMIENTAS DE ESTA ETAPA»). | Dejar títulos normales solo donde orientan; quitar las etiquetas que repiten la pestaña o el título. |
| C07 | Un buscador en la barra lateral y otro en cada página, con el mismo aspecto. | El de la barra: «Buscar en todo (Ctrl+K)» y se abre con el atajo (UX-03). Los de las páginas: «Filtrar esta lista», con aspecto de filtro. (`workspace/search.tsx` y listas) |

**B. Hoy** (`workspace/hoy.tsx`, `src/lib/admin/today.ts`)

| # | Hoy | Corrección |
|---|---|---|

**C. Operaciones** (`components/admin/operation/`, `src/lib/admin/operation-view.ts`, `SALE_PROCESS` en `src/lib/formatos/operation-workflow.ts`)

| # | Hoy | Corrección |
|---|---|---|
| C12 | El tablero tenía 10 columnas casi vacías y Reportes usa otros nombres («Captación», «Documentación»). | **Resuelto en parte por el boceto C (17/10/2026):** lista «Esperan algo de ti / Al día» con filtros por las cuatro fases (Conocer · Revisar · Preparar y publicar · Vender y cerrar) y etapa numerada por ruta. Queda: los mismos nombres de fase y etapa en Reportes y en todo el panel; la renta con sus propias etapas (COR-04). `SALE_PROCESS` y sus candados no cambian. |
| C15 | En Dictamen jurídico hay dos listas paralelas: «Lo que se hace en esta etapa» (formatos 05 y 06 con «Iniciar») y «Requisitos de esta etapa» (estados). | Una sola lista de pasos: cada paso muestra su documento (iniciar, continuar o ver PDF) y su estado. Sin números de formato en la vista principal (quedan en «Más detalles» y en Documentos). |

**D. Operación en celular y columna lateral** (`operation/screen.tsx`, `settings-tab.tsx`)

| # | Hoy | Corrección |
|---|---|---|
| C18 | En celular, la barra fija «Te falta» más la barra inferior tapan cerca de un cuarto de la pantalla. | «Te falta» en una sola línea («Te falta 2 · Ver») que se expande al tocarla, pegada al botón «Pasar a». |
| C20 | «¿Qué significa?» es una tarjeta casi vacía; en Prospecto se ofrece «Comparar casas parecidas». | «¿Qué significa?» pasa a enlace. Herramientas solo en las etapas donde aplican; revisar el mapa etapa → herramienta. |
| C21 | Pestaña «Ajustes» con pausar, descartar, corregir etapa y eliminar. | Esas acciones van en un menú «⋯» del encabezado; se retira la pestaña. Corregir etapa sigue pidiendo motivo; eliminar sigue diciendo que se puede restaurar. |

**E. Contactos** (`src/app/admin/leads/[id]/page.tsx`, `src/app/admin/clientes/[id]/page.tsx`, `components/admin/contacts/`, `workspace/related-work.tsx`, `lead-profile-editor.tsx`, `cliente-editor.tsx`)

| # | Hoy | Corrección |
|---|---|---|
| C23 | La ficha del prospecto no se rediseñó: estilo viejo con esquinas rectas; migas «Inicio / Prospectos / Registro»; el nombre aparece debajo de «Entrevista inicial» y «Seguimiento conectado»; dice «Agenda del lead»; fecha «2026-10-17»; botón de agenda solo con ícono; cinco acciones principales compitiendo; estados sueltos como fila de botones. | Ficha nueva con el marco del panel guiado: encabezado con nombre, teléfono, estado (selector), Llamar y WhatsApp; tarjeta «Siguiente paso» (base para CRM-02); línea de tiempo con notas, contactos, citas y tareas (CRM-03 puede crecer sobre ella); datos y asignación en una columna; Preparar operación como acción principal; Convertir y Eliminar en «⋯»; la cita se agenda con el mismo panel de C25. La ficha del cliente sigue la misma estructura. |

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

### Segunda revisión (02/11/2026): correcciones C33 a C46

**Origen:** revisión del agente sobre 24 pantallas del panel en el checkout del 02/11/2026 (ya con el marco de LV-08: barra superior, «+ Nuevo», lista única de personas), a 1440 y 390 px, claro y oscuro, con datos simulados y sin tocar la base. Capturas en `tmp/critica-panel/shots/` (carpeta ignorada). **Estado al 11/11/2026:** SIM-13, SIM-14 y la primera parte de SIM-15 están construidas y en `main` (PR #66); lo demás sigue pendiente.

**Qué se comprobó de las 32 correcciones:** resueltas por LV-08: C06, C08 y C24. Siguen pendientes y se vieron otra vez: C01 a C05, C10, C15, C18 a C23, C25, C27, C29 a C32. Las demás no se volvieron a comprobar.

**Lo que más pesa:** conviven dos sistemas de componentes. El nuevo (`kit.tsx`) está en Hoy, Operaciones, la operación, Nueva operación, Contactos, la lista de Inmuebles, Agenda y Herramientas; el anterior (`ui.tsx`, `panel.module.css`) sigue en las fichas de persona, la tarea, editar y seguimiento del inmueble, cada herramienta, Reportes, Equipo, Sitio web, Historial, Configuración, Perfil y Notas. El asesor cruza esa frontera cada pocos clics. Lo segundo es la repetición: el mismo pendiente aparece hasta tres veces en una pantalla.

**Fallas visibles (horas de trabajo, van primero):**

| # | Hoy | Corrección |
|---|---|---|

**Duplicados, guinda y textos:**

| # | Hoy | Corrección |
|---|---|---|
| C37 | Operación: «le falta el 02» en el aviso y «Falta el 02» en Operaciones; «Datos del levantamiento confirmados · De la etapa Levantamiento» mezclado en Dictamen; tarjeta grande con la foto del inmueble y poca información; «Próxima tarea» en guinda compite con el botón principal; el mismo requisito con problema aparece en el aviso azul, en «Antes de seguir», en la barra flotante y en «Próxima tarea». | Sin códigos de formato en texto corrido (C15); un solo guinda por pantalla (C01); la tarjeta del inmueble con dato y acción, no foto decorativa; el requisito con problema se muestra una vez. |
| C40 | Contactos: relleno repetido («Por preguntar», «Zona por definir», «Sin siguiente paso», «Sin fecha») hasta cuatro veces por fila; para una persona con operación activa, «Sigue» lee `perfil.proximoContacto` («Darle seguimiento · Vencido 1 nov») y no el paso real de la operación (dos fuentes de verdad); «21/10/2026» junto a «30 oct»; etiquetas en mayúsculas en la vista previa («LO QUE BUSCA», «SIGUIENTE PASO»); en celular «Sigue:» se parte. (`contacts/contacts.tsx`) | Hueco vacío en lugar de relleno; el siguiente paso de quien tiene operación viene de la operación; fecha humana (C03); sin mayúsculas (C05). |

**Pantallas con el estilo anterior y limpieza:**

| # | Hoy | Corrección |
|---|---|---|
| C41 | Fichas de prospecto y cliente (C23 sigue completa): «Entrevista inicial» y «Seguimiento conectado» sobre el nombre; fechas «2026-11-02»; «Mensajes, citas y tareas llevan su propia fecha»; «Registrar primer contacto realizado»; tres botones de encabezado con «Eliminar» visible (DEC-37); «Perfil principal de la persona. Cada encargo conserva su entrevista y sus condiciones propias.»; estado como fila de seis botones; «Agenda del lead» siempre abierto con botón guinda solo de ícono y bote por cita; cliente: «Volver a clientes», folios sueltos («EXP-2026-0007 EXP-2026-0010»), «Ver inmueble de interés» para un propietario. | Es SIM-07: mismo marco que la operación; nombre, teléfono, etapa y Llamar/WhatsApp arriba; «Siguiente paso» (de la operación cuando existe, C40); línea de tiempo; una acción principal; eliminar en «⋯» con deshacer (C26). Es la sección más usada y la más lejos del diseño: va segunda en el orden. |
| C42 | Inmuebles: el precio se parte en dos líneas («$6,850,000 / MXN») junto al código truncado («FORTIUS-CASA-P»); cuatro chips sobre la foto; «Preparación 1 de 6» sin decir de qué; aviso amarillo (C27). Editar: formulario anterior de más de mil líneas. Seguimiento: formulario de llaves siempre abierto, tabla de preparación de seis renglones y dos botones guinda. (`properties/`, `property-form.tsx`) | Precio en una línea; código en «⋯» o en letra pequeña; dos chips (operación y estado) y la estrella como ícono; «Preparación» dice qué falta; formularios cerrados hasta que se piden (LV-08); editar y seguimiento con el kit nuevo. |
| C43 | Agenda: horas y «Sin hora» en monoespaciada (C02); encabezados de día en mayúsculas; «Agendar» abierto con Tipo y cinco listas «Ninguno (opcional)» (C25); la lista del día repite la cuadrícula más «Tareas que vencen» y «Seguimientos previstos»; cejas «VISITA» y «LLAMADA»; «Inmueble: FORTIUS-CASA-P». (`agenda/calendar.tsx`) | Cada cita una vez: la lista del día solo en celular; sin cejas; nombre del inmueble en lugar del código; lo demás es SIM-09. |
| C45 | Herramientas: la barra dice «Más» y la página «Herramientas»; buscador, seis filtros, contador «17 herramientas» y 17 estrellas (C28); pestaña «Documentos» que busca folios, cosa que ya hace el buscador global; «Documentos sin expediente» sin renombrar; botón «Notas del equipo» suelto; sin acceso a Administración aunque DEC-35 lo preveía (solo desde el avatar y el menú del celular). Cada herramienta (Hipoteca) con formularios anteriores y «Todas las aplicaciones». (`apps/catalog.tsx`, `apps/`) | Mismo nombre en la barra y en el título; grupos sin filtros ni estrellas (HER-01); retirar la pestaña «Documentos»; enlace a Administración desde «Más»; cada herramienta con el kit nuevo. |
| C46 | Reportes con el lenguaje técnico de C29 («Corte operativo 2026-11-02 · cada indicador conserva su alcance», «Cartera para ofertas y cierres»); Configuración enlaza «muestra de los componentes del panel» (`/admin/sistema`, página de desarrollo); Mi perfil ofrece «Preferencias de lectura» (densidad) que solo cambia el alto de las celdas en `panel.module.css`, hoja que se retira; Historial y Notas con el estilo anterior y sin estado vacío que enseñe (C31); cualquier error dentro del panel muestra la pantalla del sitio público (C30). | Retirar el enlace y la preferencia; Historial y Notas con el kit y los estados vacíos de C31; Reportes y error según SIM-11. |

**Por decidir (titular):** DEC-38, la pestaña «Ajustes» de la operación: C21 la retira y la nota de LV-06 dice que se conserva. Propuesta del agente: retirarla; pausar, descartar, corregir etapa y eliminar caben en el menú «⋯», y «Decisión del encargo» pasa al panel de la etapa (ver COR-14).

### Tercera revisión (11/11/2026): simplificar la experiencia, correcciones C47 a C60

**Origen:** auditoría de UI/UX pedida por el titular el 11/11/2026 para **simplificar la experiencia de uso**. El agente recorrió las 25 pantallas del panel y sus menús (+ Nuevo, cuenta, buscador, «Ver etapas», «Confirmar», ⋯ de la operación, menú del celular) en la rama `feat/seo-integral`, a 1440 y 390 px, con datos simulados y sin tocar la base (`tmp/auditoria-ux/shots/`, carpeta ignorada; el guion `tmp/auditoria-ux/shots2.mjs` reutiliza `tmp/critica-panel/mock.mjs` y marca la guía como vista para que no tape las capturas). Ninguna pantalla desborda a 390 px. **Estado al 11/11/2026:** el titular aprobó empezar por SIM-16, que quedó construida en local; lo demás espera su aprobación. Las correcciones anteriores que esta revisión vuelve a confirmar no se repiten: se citan por su número. **Corrección del mismo día:** la primera versión de esta revisión decía que C39 seguía pendiente (la barra «Continuar» de Nueva operación tapando «Alta rápida» en celular). Era un efecto de la captura de página completa: medido en el navegador a 390 px, con la página al final, la barra queda debajo de los enlaces y no los tapa. C39 está resuelta.

**Qué se comprobó de C01 a C46 en esta rama.** Construido y visible: C06, C08, C09, C11, C16, C19, C24, C34 (la portada ya no se repite), C36 (pestañas arriba, Llamar y WhatsApp en el encabezado, espacio reservado para la barra), C39, C42 en parte (precio en una línea, dos pastillas), C44 (casilla en la lista, «Completar» como acción principal de la ficha) y C45 en parte (grupos sin filtros, «Administración» desde Herramientas). Siguen pendientes y se vieron otra vez: C02 (horas en monoespaciada en la agenda), C03 (fechas «2026-11-11» en las fichas de persona), C04, C05 («VISITA», «LLAMADA», «LEADS», «INMUEBLES»), C18 (dos barras fijas en la operación en celular), C21 y DEC-38, C23 y C41 completas, C25, C27 (sigue el aviso amarillo), C29 y C46, C30 (Equipo cayó a la página de error del sitio público con un dato inesperado), C31, C32, C43 y lo que falta de C45 (pestaña «Documentos», «Más» en la barra y «Herramientas» en la página, «Todas las aplicaciones» como regreso).

**Lo que hace complejo el panel hoy no es el número de pantallas sino que la misma cosa vive en varios lugares.** Siete palancas resumen la revisión; cada una reúne varias correcciones de la tabla de abajo:

1. **Un solo lugar para lo que espera algo de ti.** Hoy tiene 11 secciones con los datos de ensayo y puede llegar a 13 («Llaves sin regresar», «Compradores por avisar»): 1 755 px en computadora y 3 019 px en celular, unas siete pantallas de desplazamiento. «Nuevos sin atender», «También esperan algo de ti», «Entrevistas por terminar», «Contratos y licencias por vencer», «Informes al propietario vencidos», «Llaves» y «Compradores» son siete listas distintas de lo mismo: pendientes. «Operaciones en curso» es inventario y la regla de LV-07 dice que Hoy no muestra inventario. Propuesta: Hoy con tres bloques, «Lo siguiente» (la portada y una sola cola ordenada por urgencia, con una pastilla que dice el tipo: Nuevo, Entrevista, Informe, Contrato, Llaves, Aviso), «Hoy» (tareas con casilla y citas, en una sola lista por hora) y «Esta semana». La línea de resumen bajo el saludo desaparece, porque repite los contadores. (C47)
2. **Una sola puerta para «alguien llama».** La misma pregunta «¿qué quiere hacer?» se hace en dos lugares con dos interfaces: Nueva operación (cinco opciones en radios, dos de las cuales dicen «sin abrir operación», en una pantalla titulada «Nueva operación») y Contactos › Agregar contacto (cuatro botones y después un formulario). Además, crear algo tiene cuatro entradas: «+ Nuevo» (menú de cinco), el buscador Ctrl K («Crear rápidamente», las mismas cinco), el botón de cada página y, en celular, el «+» de la barra que no abre menú sino que va directo a Nueva operación. Propuesta: el asistente se llama **«Atender a alguien»** (o «Nueva llamada») y es la única entrada para una persona nueva; Contactos › Agregar abre ese mismo asistente; el «+» del celular abre el mismo menú que «+ Nuevo»; el buscador solo busca. (C48, C49, DEC-45)
3. **Un vocabulario para las personas.** El prospecto tiene seis estados como fila de botones en su ficha (Nuevo, Contactado, En evaluación, Activo, Cerrado, Descartado), la lista los agrupa en cuatro filtros (Nuevos, En seguimiento, Clientes, Descartados) y las pastillas de la fila muestran el estado crudo («En evaluación», «Contactado»). Propuesta: tres estados visibles para el prospecto (Nuevo, En seguimiento, Descartado) y «Cliente» calculado del contrato (RP-92); los cuatro intermedios se guardan igual en la base y se muestran como «En seguimiento». Solo de pantalla. (C50, DEC-46)
4. **Un selector de vínculo y formularios cortos.** Agendar pide seis listas «Ninguno (opcional)» (prospecto, cliente, inmueble, operación, asesor y tipo); la tarea tiene 13 campos con cuatro «relacionado» y una plantilla; la nota tiene título y contenido; cada herramienta pide «Nombre del trabajo» y «Operación: Trabajo independiente». Propuesta: un solo campo **«¿Con quién o sobre qué?»** que busca persona, inmueble u operación y rellena lo demás, común a cita, tarea, nota y herramienta; la tarea visible es título, fecha, con quién y responsable, y lo demás queda detrás de «Más detalles»; el responsable es quien captura, salvo que lo cambie. Amplía C25. (C51)
5. **La operación con tres partes y cada problema dicho una vez.** La pantalla de la etapa está bien resuelta, pero el mismo problema («Falta el certificado de libertad de gravamen») aparece cuatro veces: en el aviso del panel azul, en «Próxima tarea» (tarjeta roja), en «Antes de seguir, confirma» y en la barra flotante. Las seis pestañas se solapan: «Expediente» y «Documentos del cliente» son documentos; «Tareas» e «Historial» son actividad; «Ajustes» mezcla la decisión del encargo (negocio) con ruta, situación, inmueble, contraparte, corregir etapa y eliminar; el «⋯» solo trae «Eliminar operación», que también está en Ajustes. La pestaña Expediente conserva el formulario anterior («Formato: 01 · Aviso de privacidad», «Crear y abrir», una frase técnica sobre el 03 y el 09) y una tarjeta «Entrevista inicial › Preparar entrevista» que repite la acción de la etapa 2. Propuesta: pestañas **Etapa · Documentos · Actividad**; «Decisión del encargo» pasa a la etapa 6 (COR-14); ruta, situación, inmueble, contraparte, corregir etapa y eliminar van al «⋯» del panel azul (resuelve DEC-38 como propone C21); el problema se muestra solo en la barra flotante y en su requisito; «Próxima tarea» se queda blanca y sin repetir el texto del requisito. (C52, C53)
6. **El inmueble como una sola ficha.** «Editar inmueble» mide 5 765 px, siete secciones y unos 60 campos del formulario anterior, con una barra fija «Ir a sección…»; «Llaves y compradores» es otra página con dos formularios siempre abiertos (préstamo de llaves y una tabla de seis renglones con estado, fecha y responsable: 18 controles y dos botones guinda). Propuesta: una ficha del inmueble con pestañas **Ficha pública · Fotos y material · Llaves · Interesados**; en «Ficha pública» solo lo que se publica (título, tipo, precio, zona, descripción, superficies y fotos) y lo demás plegado; la preparación como lista con casilla y «quién y cuándo» detrás de «⋯»; el préstamo de llaves se abre con «Prestar llaves». Es la segunda parte de SIM-15 con la forma decidida. (C54, C55)
7. **Menos nombres para lo mismo.** La barra dice «Más», la página «Herramientas» y el regreso «Todas las aplicaciones»; la pastilla dice «Mi cuenta» y la página «Mi perfil»; «Agenda» esconde «Tareas» y Hoy enlaza «Ver todas» a esa pestaña; Administración son seis pastillas más pestañas dentro (Reportes · Control comercial; Textos del sitio · Blog · Archivos) más «Preparar tu espacio · 2 de 4» dentro de Configuración; Notas solo se alcanza desde Herramientas (DEC-25 ya decidió retirar la página). Propuesta: **«Más»** en la barra y en la página; **«Mi cuenta»** en los dos lugares; Herramientas muestra las seis que se usan en la operación y «Todas las herramientas» plegado (HER-05); Administración en una sola página con índice lateral (Equipo, Reportes, Sitio web, Historial, Configuración), como ya prevé LV-08; «Preparar tu espacio» se muestra solo en Hoy mientras falte algo. (C56, C57)

**Aparte, dos cosas que el titular decide.** La guía de cada pantalla (02/11/2026) se abre sola la primera vez en ocho pantallas, con dos a seis pasos cada una (unos 30 pasos en total), oscurece todo y bloquea la pantalla hasta omitirla; en Nueva operación tapa las opciones que explica. Propuesta: solo Hoy la abre sola; las demás, con «?» o la tecla «?», y un punto que late sobre el botón «Ayuda» la primera vez (V07). (DEC-47). Y los seis estados del prospecto (DEC-46, arriba).

**Textos técnicos que siguen a la vista** (todos caen en C04, C05 o la regla «nada técnico en pantalla» de LV-08): «EXP-2026-0007» como subtítulo del panel azul y como enlaces sueltos en la ficha del cliente; «FORTIUS-CASA-P» en la agenda, en el selector de Ajustes y en el subtítulo de «Llaves y compradores»; «u1» (identificador de cuenta) en Equipo; «01 · Aviso de privacidad» en Expediente; «2026-11-11» en las fichas de persona; «Corte operativo 2026-11-11 · cada indicador conserva su alcance»; «Se guarda solo mientras capturas»; «Mensajes, citas y tareas llevan su propia fecha»; «Si cambias la persona, el inmueble o el asesor, la operación se desvincula»; «Al vincularla, cliente, inmueble y responsable corresponden a esa operación»; «Queda en el historial con tu nombre y la fecha»; «Perfil principal de la persona. Cada encargo conserva su entrevista y sus condiciones propias».

| # | Hoy (lo que se vio) | Corrección |
|---|---|---|
| C47 | Hoy: 11 a 13 secciones, siete de ellas listas de pendientes de distinto tipo; «Operaciones en curso» (inventario) en el centro; la línea de resumen repite los contadores; 3 019 px en celular. (`workspace/hoy.tsx`, `src/lib/admin/today.ts`) | Tres bloques: «Lo siguiente» (portada más una sola cola por urgencia con pastilla de tipo), «Hoy» (tareas y citas en una lista) y «Esta semana». «Operaciones en curso» pasa a Operaciones. Sin línea de resumen. Las reglas de volumen de LV-07 se conservan (4 con foto, lista corta, «Ver las N»). |
| C48 | «¿Qué quiere hacer?» se pregunta en Nueva operación (radios, cinco opciones, dos que no abren operación) y en Contactos › Agregar contacto (cuatro botones y luego el formulario), con interfaces distintas; el título «Nueva operación» no describe tres de las cinco salidas. (`intake/wizard.tsx`, `contacts/contacts.tsx`) | Un solo asistente «Atender a alguien» con la pregunta una vez; Contactos › Agregar lo abre; el paso 1 avanza al elegir (C32). El nombre lo decide el titular (DEC-45). |
| C49 | Cuatro entradas para crear: «+ Nuevo» (menú), Ctrl K «Crear rápidamente» (mismo menú), botón de cada página y «+» del celular que va directo a Nueva operación sin menú. (`workspace/guided-nav.tsx`, `workspace/search.tsx`) | El «+» del celular abre el mismo menú que «+ Nuevo»; el buscador solo busca (sin «Crear rápidamente»); los botones de página se conservan como atajo secundario (C08). |
| C50 | Prospecto con seis estados como fila de botones en su ficha; la lista filtra con cuatro grupos y las pastillas muestran el estado crudo: dos vocabularios para lo mismo. (`src/app/admin/leads/[id]/page.tsx`, `contacts-view.ts`) | Tres estados visibles (Nuevo, En seguimiento, Descartado) y «Cliente» calculado; los intermedios se conservan en la base y se muestran como «En seguimiento»; el estado se cambia con un selector, no con una fila de botones. Pendiente de DEC-46. |
| C51 | Agendar con seis listas «Ninguno (opcional)»; tarea con 13 campos (plantilla, título, responsable, fecha, estado, prioridad, descripción, operación, categoría, prospecto, cliente, inmueble, pasos, nota); nota con título y contenido; herramienta con «Nombre del trabajo» y «Operación: Trabajo independiente». (`agenda/calendar.tsx`, `task-form.tsx`, `apps/workspace.tsx`) | Un campo «¿Con quién o sobre qué?» que busca persona, inmueble u operación y rellena los vínculos, común a cita, tarea, nota y herramienta. Tarea visible: título, fecha, con quién, responsable (quien captura por omisión); lo demás en «Más detalles». Amplía C25. |
| C52 | Operación: el mismo problema aparece cuatro veces (aviso del panel azul, «Próxima tarea» roja, requisito en «Antes de seguir», barra flotante). (`operation/stages.tsx`, `next-step.tsx`) | El problema se muestra en la barra flotante y en su requisito; el aviso del panel azul solo para etapas anteriores incompletas; «Próxima tarea» blanca y con su propio texto (la tarea), no el del requisito. |
| C53 | Operación con seis pestañas que se solapan; «⋯» solo con «Eliminar» (también en Ajustes); Expediente con el formulario anterior («Formato: 01 · …», «Crear y abrir», nota técnica del 03 y el 09) y una tarjeta que repite la acción de la etapa 2. (`operation/screen.tsx`, `documents-tab.tsx`, `settings-tab.tsx`) | Pestañas Etapa · Documentos (del expediente y del cliente, con filtro) · Actividad (tareas e historial). «Decisión del encargo» en la etapa 6 (COR-14). Ruta, situación, inmueble, contraparte, corregir etapa y eliminar en el «⋯» (resuelve DEC-38 según C21). Documentos sin códigos ni «Crear y abrir»: «Agregar documento» abre la lista por nombre. |
| C54 | Editar inmueble: 5 765 px, siete secciones, unos 60 campos del formulario anterior, barra fija «Ir a sección…», folio editable, «Dato de demostración (Demo)», campos de URL para video y 360. (`property-form.tsx`) | Ficha del inmueble por pestañas: Ficha pública · Fotos y material · Llaves · Interesados. En «Ficha pública» solo lo que se publica; superficies, fuentes, costos y beneficios plegados; folio solo lectura; «Ejemplo» como pastilla, no casilla. Con el kit nuevo (SIM-15). |
| C55 | «Llaves y compradores» es otra página con dos formularios siempre abiertos: préstamo de llaves y tabla de seis renglones × tres controles, dos botones guinda. (`properties/property-followup.tsx`) | Pestañas «Llaves» e «Interesados» de la misma ficha (C54); la preparación como lista con casilla y «quién y cuándo» en «⋯»; «Prestar llaves» abre el formulario; un solo guinda por pestaña. |
| C56 | Nombres cruzados: «Más» (barra) / «Herramientas» (página) / «Todas las aplicaciones» (regreso); «Mi cuenta» (pastilla) / «Mi perfil» (página); «Agenda» esconde «Tareas». (`guided-nav.tsx`, `apps/catalog.tsx`, `apps/workspace.tsx`, `src/app/admin/perfil`) | «Más» en barra y página; «Mi cuenta» en los dos; el regreso de cada herramienta dice «Más»; la píldora «Agenda» se llama «Agenda y tareas» o Tareas aparece en «Más». **En local el 12/11/2026:** la página de herramientas se titula «Más» (como la barra) y cada herramienta y «Documentos sueltos» regresan a «Más»; la barra, la página y la guía dicen «Agenda y tareas»; la pastilla de la cuenta ya era solo la foto y el menú y la página dicen «Mi perfil», así que no se cambió a «Mi cuenta». En el celular, el menú «Más» conserva la fila «Herramientas», que es lo que abre. Para que «Agenda y tareas» quepa, la barra muestra solo íconos hasta 1279 px. |
| C57 | Administración: seis pastillas más pestañas internas; «Preparar tu espacio · 2 de 4» dentro de Configuración; Equipo con «LEADS 02 · INMUEBLES 05» en mayúsculas y ceros a la izquierda, y «u1» en cuentas; Historial con botones «Actividad / Recuperar eliminados» y vacío sin enseñar; Notas con formulario abierto. | Una página «Administración» con índice lateral (LV-08, punto 10); «Preparar tu espacio» solo en Hoy mientras falte algo; Equipo con el kit (sin mayúsculas, sin ceros, sin identificadores); Historial y Notas según C31 y DEC-25. **En local el 12/11/2026:** Administración lleva un índice a la izquierda en escritorio, fijo al desplazarse (Equipo, Reportes, Sitio web, Historial, Configuración, Mi perfil), y una fila deslizable en el celular; Sitio web y Reportes conservan sus pestañas. «Preparar tu espacio» salió de Configuración y aparece en Hoy, solo para el administrador y mientras falte algún paso. Equipo usa tarjetas del kit con la foto o las iniciales, «2 contactos · 5 inmuebles» sin ceros a la izquierda, botón «Editar» con nombre y vacío que enseña; Cuentas de asesores muestra el correo (o «Cuenta sin correo») y ya no el identificador interno. Historial y Notas quedaron con SIM-15. |
| C58 | Ficha del prospecto: el nombre aparece a 700 px, después de «Entrevista inicial» y «Seguimiento conectado»; cuatro botones guinda (Continuar entrevista, Preparar operación, Agregar nota, agendar); «Registrar primer contacto realizado»; «Agenda del lead» abierta con bote por cita; ficha del cliente con «Abrir operación» cuando tiene dos y folios sueltos. | Es SIM-07 (C23, C41): nombre y teléfono arriba, una sola acción principal (la de la operación o la entrevista), lo demás en «⋯»; «Abrir operación» lista las operaciones por lo que son («Vende su casa en Playas», «Vende · sin inmueble»), no por folio. |
| C59 | Celular: en la operación, la barra flotante (128 px) más la barra inferior (68 px) ocupan cerca de un cuarto de los 844 px (C18 sigue); Inmuebles con tarjetas de foto completa (2 872 px para cinco); Agenda con tira de días, lista del día, tareas, seguimientos y el formulario abierto (2 174 px). | En celular la barra flotante de la operación sustituye a la barra inferior mientras se ve la etapa (una sola barra); Inmuebles en filas compactas (foto pequeña, título, precio, pastilla) con «Ver en tarjetas» opcional; Agenda del celular solo con la tira y la lista del día, y «Agendar» como botón. **En local el 12/11/2026:** en la etapa de una operación, la barra de la etapa ocupa el pie y la barra inferior del panel se oculta (vuelve en las otras pestañas y al salir); la barra baja a 12 px del borde y la página reserva solo su alto. Inmuebles en el celular va en filas (foto pequeña, título, precio y estado; 1 224 px para cinco) con «Ver en tarjetas», que se recuerda en ese navegador; en escritorio no cambia. Agenda ya tenía «Agendar» como botón y el formulario en panel (SIM-09); en el celular y la tableta se oculta la leyenda de colores, que solo explica la cuadrícula semanal. Las tareas y los seguimientos del día se quedan bajo la lista del día. |
| C60 | Equipo cayó a la página de error del sitio público cuando una respuesta llegó con otra forma (`adviser-account-links.tsx` lee `cuentas.filter` sin comprobar); cualquier error de una pantalla tumba todo el panel (C30). | Error acotado por sección («No pudimos cargar las cuentas. Reintentar») sin perder el resto de la pantalla; la página de error del panel según C30. **En local el 12/11/2026:** Cuentas de asesores revisa la forma de la respuesta y, si llega distinta o falla, dice «No pudimos cargar las cuentas» con «Reintentar» dentro de su tarjeta; una cuenta mal formada se descarta sin tumbar la lista. Hay un límite de error por sección (`section-boundary.tsx`) alrededor de Cuentas de asesores, de los resultados del periodo en Reportes y de «Preparar tu espacio» en Hoy: si esa parte falla al mostrarse, el resto sigue y esa parte ofrece «Reintentar», sin detalles técnicos. La página de error del panel (C30) quedó con SIM-11. |

**Orden propuesto para construir (una entrega por vez, revisada en localhost):** SIM-16 (Hoy en tres bloques), SIM-07 con C58 (fichas de persona), SIM-17 (una puerta y un selector de vínculo), SIM-18 (operación en tres partes), SIM-19 (ficha del inmueble), SIM-15 restante y C56–C57, las dos barras del celular en la operación (C59) y C60.

### Entregas del paquete SIM

| ID | Correcciones | Alcance | Aceptación |
|---|---|---|---|
| SIM-01 | C01–C05 | Tokens de color, tipografía, fecha humana y retiro de textos permanentes en todo el panel | Ningún `font-mono` en `src/components/admin` ni `src/app/admin`; ninguna fecha ISO visible; guinda solo en acción principal y sección activa; contraste AA en claro y oscuro; pruebas de axe aprobadas. **Hecha en local (12/11/2026), sin commit.** Sin letra monoespaciada en el panel (las cifras usan números tabulares); `humanDate`, `humanDateTime` y `overdueText` en `src/lib/utils.ts` (con pruebas) reemplazan las fechas ISO y «12/11/2026, 10:30:00» en historial, tareas, notas, documentos, herramientas, reportes y vínculos; la lista de tareas dice «Vencida hace 3 días»; sin etiquetas en mayúsculas (salvo los valores de CURP, RFC e iniciales); las visitas pasan al azul de información; enlaces en texto normal subrayado, lo guardado o hecho en verde y lo vencido en el rojo de alerta; las notas al pie de Reportes quedan detrás de «¿Cómo se cuenta?». Se conservan en guinda la acción principal, la sección activa, el avance y los contadores de pendientes. Comprobado con capturas en claro y oscuro a 390 y 1440 px (sin letra monoespaciada ni fechas ISO en Hoy, Agenda, Tareas y Reportes); las diez suites de navegador del panel que corre CI pasan (12/11/2026, build sin base en el puerto 3105, 52 pruebas, incluidas las de axe y contraste en claro y oscuro; la de contraste ahora abre las secciones plegadas antes de medir). La escala de cuatro tamaños (LV-01, RP-74) sigue pendiente. |
| SIM-02 | C06–C08 | Barra lateral, buscadores y botón «+ Nuevo» | Pie compacto con menú; sin contadores inútiles; búsqueda global distinguible del filtro; «+ Nuevo» con 5 opciones por teclado y en celular. |
| SIM-03 | C09–C11 | Hoy | Tarjetas tocables completas; sin duplicados entre secciones; saludo con nombre; pruebas de `today.ts` actualizadas. |
| SIM-04 | C12, C13, C22 | Alta rápida dentro de Nueva operación; nombres de fase y etapa unificados | Lo que queda tras el boceto C: «Alta directa» dentro de Nueva operación; mismos nombres de fase y etapa en Reportes y en todo el panel; `?etapa=<slug>` sigue funcionando. |
| SIM-05 | C14–C17 | Quitar números de formato de la vista principal | Lo que queda tras el boceto C: sin números de formato en la vista principal (C15); «Marcar como revisado» pide la misma evidencia; el servidor rechaza lo mismo que antes. |
| SIM-06 | C18–C21 | Celular, columna lateral y menú «⋯» | Lo que queda tras el boceto C: Llamar y WhatsApp en el encabezado en celular (C19); «¿Qué significa?» como enlace (C20); pestaña Ajustes retirada sin perder ninguna acción (C21). |
| SIM-07 | C23 | Ficha de persona (prospecto y cliente) | Mismo marco que la operación; una acción principal; sin «lead» ni «Seguimiento conectado»; fechas humanas; conversión técnica y eliminación con sus protecciones actuales; «Cliente» solo con contrato firmado (RP-92, COR-10). **Construida el 11/11/2026 en la rama `feat/seo-integral`, en local y sin commit (C23, C41, C58):** las dos fichas comparten piezas (`src/components/admin/contacts/person.tsx`): encabezado con nombre, etapa, Llamar y WhatsApp; «Siguiente paso» con una sola acción principal (continuar la entrevista o preparar la operación en el prospecto; abrir la operación en el cliente, C40); línea de tiempo «Lo que viene» y «Lo que ya pasó» con notas, citas, tareas y registros, y fechas con palabras; datos y etapa a un lado. «Convertir en cliente» y «Eliminar» van en «Más opciones»; «Agendar» abre su formulario; las operaciones del cliente se nombran por lo que son y no por folio. El prospecto muestra tres etapas (DEC-46). Sin cambios de base, rutas ni reglas: la nota conserva su versión, las capturas a medias bloquean convertir y abrir operación. **Queda fuera:** «Cliente» calculado del contrato firmado (COR-10) y eliminar con «Deshacer» (RP-16). Comprobado: lint, tipos, `test:admin` (405 pruebas) y capturas a 1440 y 390 px, claro y oscuro, sin desbordamiento. |
| SIM-08 | C24 | Lista única de personas | Una lista con etapa y filtro; las fichas y las direcciones anteriores funcionan; sin cambios de base. |
| SIM-09 | C25, C26 | Agendar y eliminar citas | Panel de agendar desde hueco o botón; un campo de búsqueda de vínculo; eliminar con deshacer. **Construida en local el 12/11/2026:** «Agendar» es un panel lateral que se abre con el botón, con «+ Nuevo», desde un enlace con vínculo o al tocar un hueco de la semana (pone día y hora a la media hora); cerrarlo no borra lo escrito; un solo campo «¿Con quién o sobre qué?»; el asesor es quien agenda salvo que elija a otro; eliminar no pregunta y ofrece «Deshacer»; la lista del día muestra el tipo bajo la hora, sin cejas, y el inmueble por su nombre. Queda fuera de C43 «la lista del día solo en celular»: en escritorio es el único lugar para eliminar. |
| SIM-10 | C27, C28 | Inmuebles y Herramientas | Cada inmueble dice qué le falta; catálogo en tres grupos sin filtros; «Documentos sueltos». |
| SIM-11 | C29, C30 | Reportes y pantalla de error | Cuatro indicadores arriba con comparación; lenguaje del glosario; error del panel con el estilo del panel. **Construida en local el 12/11/2026:** Reportes abre con el periodo y cuatro números (prospectos recibidos, atendidos, primera atención promedio y visitas agendadas), cada uno comparado con el periodo anterior del mismo largo y con sus registros al tocarlo; el canal, las ofertas y cierres, «¿Cómo se cuenta?», el reparto por asesor y lo acumulado «Desde el inicio» van plegados; «Operaciones por etapa» usa los mismos nombres de etapa que Operaciones (C12); «Control comercial» se llama «Seguimiento comercial» en pantalla (el PDF del formato 03 y la dirección no cambian). Los errores dentro de `/admin` muestran «No pudimos abrir esta página. Tus datos están a salvo.» con Reintentar y Volver a Hoy, sin detalles técnicos y con el menú del panel. La edición de inmueble con datos simulados abre sin error: el caso de C30 ya no se reproduce. Las definiciones de los indicadores no cambiaron. |
| SIM-12 | C31, C32 | Estados vacíos y avance automático | Cada lista vacía enseña su primer paso; el paso 1 de Nueva operación avanza al elegir. **Construida en local el 12/11/2026:** Operaciones, Contactos, Inmuebles y Tareas vacías dicen qué es la sección, muestran tres primeros pasos numerados y el botón para empezar (en Operaciones es la acción principal, porque no hay otra). Tareas distingue «Todavía no hay tareas», «Nada pendiente» (todas hechas) y «No hay tareas con estos filtros». C32 ya estaba con SIM-17: elegir en el paso 1 avanza solo y el botón principal deshabilitado se ve gris. Notas, Historial, Blog, Archivos y Equipo siguen con su estado vacío anterior; pasan al kit dentro de SIM-15 (C46). Las ilustraciones son de LV-04. |
| SIM-13 | C33, C36, C39 | Fallas visibles de la segunda revisión (02/11/2026) | Hoy en celular muestra el título completo; ninguna barra fija tapa contenido ni acciones en la operación ni en Nueva operación (prueba de navegador a 390 px que comprueba que el último elemento queda visible); pestañas de la operación arriba; sin rosa en modo oscuro. **Construido el 02/11/2026; en `main` (PR #66):** título completo en Hoy, barra flotante que reserva su alto, pestañas arriba, Llamar y WhatsApp en el encabezado, sin rosa en botones desactivados ni en el texto de marca del modo oscuro (pasa a crema). La prueba de navegador `tests/admin/browser/barras-fijas.spec.ts` está escrita y falta correrla. |
| SIM-14 | C34, C35, C37, C38, C40, C44 | Cada dato una vez, un solo guinda y textos del glosario en Hoy, Operaciones, la operación, Contactos y Tareas | Ningún pendiente aparece dos veces en una pantalla (prueba de `today.ts`); un solo botón guinda por pantalla con «+ Nuevo» secundario; el siguiente paso en Contactos viene de la operación cuando existe; completar tareas desde la lista; sin códigos de formato ni folios como subtítulo. **Construido el 02/11/2026; en `main` (PR #66):** Hoy sin repetir la portada ni el bloque «Vencidas», metas sin folio, siguiente paso de Contactos tomado de la operación, casilla para completar tareas en la lista, «+ Nuevo» secundario y faltantes con su nombre en lugar del código. |
| SIM-15 | C42, C45, C46 | Inmuebles, Herramientas, Administración y limpieza | Precio en una línea y dos chips por inmueble; Herramientas sin filtros y con enlace a Administración; sin el enlace a `/admin/sistema` ni la preferencia de densidad; Historial, Notas, editar y seguimiento del inmueble y cada herramienta con el kit nuevo. C41 se hace dentro de SIM-07 y C43 dentro de SIM-09. **Primera parte construida el 02/11/2026; en `main` (PR #66):** cada inmueble lleva dos pastillas (operación y estado), la estrella como ícono y el precio en una línea; el código pasa a «⋯» y «Demo» a la palabra «Ejemplo» junto al precio; «Preparación» dice qué piezas faltan. Herramientas queda en grupos sin buscador, filtros, contador ni estrellas, con «Notas del equipo» y, para el administrador, «Administración». Configuración ya no enlaza `/admin/sistema` y Mi perfil ya no ofrece la densidad (se retiró también de la barra del panel y de `panel.module.css`). Comprobado: lint, tipos, `test:admin` (394 pruebas) y capturas a 1440 y 390 px sin desbordamiento con la API simulada. Pendiente de SIM-15: retirar la pestaña «Documentos», el nombre «Más»/«Herramientas», «Documentos sueltos» (SIM-10), formularios cerrados en editar y seguimiento, Historial, Notas y cada herramienta con el kit nuevo; la prueba de navegador de Mi perfil y Herramientas se ajustó y no se ha corrido. **Segunda parte, en local el 12/11/2026:** Herramientas es solo el catálogo (se retiró la pestaña «Documentos»; `/admin/documentos` lleva a `/admin/herramientas`; un folio se busca con el buscador del panel); «Documentos sin expediente» se llama «Documentos sueltos» en pantalla (el `slug` no cambia); Notas («Notas del equipo») e Historial pasan al kit con estados vacíos que enseñan. Historial nombra cada registro por su título o nombre, dice «Tú», «Otra persona del equipo» o «Formulario del sitio o el sistema» en lugar del identificador del usuario, ya no muestra «Versión» y pliega los datos cambiados. Las formas cerradas de editar y seguimiento quedaron con SIM-19. Cada herramienta pasó al kit en local el mismo día: el marco común (`apps/workspace.tsx`, `apps.module.css`) usa tarjetas, botones y avisos del kit, dice «Guardado · fecha» en lugar del número de versión y regresa a «Herramientas»; la acción del editor (Calcular, Generar…) es la guinda hasta que hay un resultado, y entonces «Guardar» toma ese lugar. Los nombres cruzados de C56 también quedaron en local ese día. |
| SIM-16 | C47 | Hoy en tres bloques | Hoy muestra «Lo siguiente» (una sola cola por urgencia con pastilla de tipo), «Hoy» (tareas y citas) y «Esta semana»; ningún pendiente aparece en dos bloques (prueba de `today.ts`); sin «Operaciones en curso» ni línea de resumen; en celular cabe en unas tres pantallas con los datos de ensayo; las reglas de volumen de LV-07 siguen cumpliéndose. **Construida el 11/11/2026 en la rama `feat/seo-integral`, en local y sin commit:** `workspace/hoy.tsx` en tres bloques; la cola única sale de `sortQueue` y `queueFrom*` en `src/lib/admin/today.ts` (operaciones, contactos, prospectos nuevos, entrevistas, contratos y licencias, informes, llaves y avisos; lo vencido primero y después por tipo); la portada no se repite; las 4 siguientes con foto, lista corta y «Ver N más» que despliega el resto en la misma pantalla; «Hoy» en una tarjeta con citas y tareas (casilla para completar); «Esta semana» con las siete casillas. Se retiraron «Operaciones en curso» (`stageCounts`), la línea de resumen y las siete secciones aparte. La guía de Hoy explica los tres bloques. Comprobado: lint, tipos, `test:admin` (402 pruebas) y capturas a 1440 y 390 px en claro y oscuro sin desbordamiento (1 455 px en computadora, 2 257 px en celular con los datos de ensayo; antes 1 755 y 3 019). La prueba de navegador `admin-workspace.spec.ts` se ajustó a los tres bloques y no se ha corrido. |
| SIM-17 | C48, C49, C51 | Una puerta de entrada y un selector de vínculo | Un solo asistente para una persona nueva, con el nombre que decida DEC-45; Contactos › Agregar lo abre; el «+» del celular abre el menú de «+ Nuevo»; el buscador no crea; cita, tarea, nota y herramienta usan el mismo campo «¿Con quién o sobre qué?»; la tarea muestra cuatro campos y «Más detalles»; los vínculos guardados son los mismos de hoy. **Hecha en local (12/11/2026), sin commit.** El asistente se llama «Atender a alguien» (DEC-45, confirmado el 12/11/2026; vive en una sola constante) y el paso 1 avanza al elegir; «+ Nuevo» ofrece «Atender a alguien» y «Nueva operación» (el asistente ya en «Vender»); el «+» del celular abre ese menú; el buscador solo busca; Contactos › «Agregar contacto» abre el asistente y la vista Clientes conserva «Agregar cliente» para el cliente directo; la dirección vieja `?nuevo=1` lleva al asistente. «¿Con quién o sobre qué?» (`workspace/link-picker.tsx`) busca por nombre, teléfono, código o folio, con teclado, y muestra cada vínculo con «Quitar»: en la cita reemplaza cuatro listas (queda el asesor); en la tarea quedan título, fecha, responsable (quien captura, si es asesor) y el selector, y plantilla, estado, prioridad, categoría y descripción pasan a «Más detalles»; en Herramientas busca solo operaciones, porque hoy un trabajo guarda solo la operación y lo que trae, y no aparece en «Documentos sin expediente», que no admite vínculos. La nota del equipo no tiene vínculos guardados; dárselos cambiaría los datos y queda fuera. Las pruebas de navegador ajustadas pasan (12/11/2026). |
| SIM-18 | C52, C53 | Operación en tres partes | Pestañas Etapa · Documentos · Actividad; el «⋯» del panel azul trae ruta, situación, inmueble, contraparte, corregir etapa (con motivo) y eliminar (recuperable); «Decisión del encargo» en la etapa 6; un problema se lee una sola vez además de su requisito; `?tab=documentos`, `?tab=tareas`, `?tab=ajustes` y `?documento=` siguen funcionando (las antiguas redirigen a la parte nueva); candados, 409 y pruebas de navegador conservados. **Construida el 11/11/2026 en la rama `feat/seo-integral`, en local y sin commit:** la operación tiene tres partes, Etapa · Documentos (con el selector «Del expediente / Del cliente») · Actividad (tareas e historial juntos). La pestaña Ajustes se retiró (DEC-38): «Más opciones» del panel azul trae «Datos de la operación» (se abren en un panel lateral con la decisión del encargo, ruta, situación, inmueble, fecha objetivo, contraparte y corregir etapa), «Corregir etapa» y «Eliminar operación»; los pendientes de la etapa que antes decían «Ir a Ajustes» abren ese panel. Las direcciones anteriores siguen funcionando (`?tab=cliente`, `?tab=tareas`, `?tab=historial`, `?tab=ajustes`, `?documento=`). El problema de un requisito ya no se repite en la barra flotante y «Próxima tarea» es blanca con la fecha vencida en rojo (C52). Sin cambios de reglas, candados ni 409; cerrar el panel con cambios sin guardar pide confirmación. **Queda fuera:** la decisión del encargo no se movió a la etapa 6 como pieza propia (se abre desde ahí con un botón, pero se captura en el panel de datos), y en Documentos siguen «Nuevo documento» con códigos de formato y la tarjeta «Entrevista inicial» (resto de C53). Comprobado: lint, tipos, `test:admin` (406 pruebas) y capturas a 1440 y 390 px sin desbordamiento. Las pruebas de navegador `expediente-deletion.spec.ts` y `process-corrections.spec.ts` se ajustaron y no se han corrido.  **12/11/2026 (titular):** «Crear y abrir» y su lista de códigos se retiraron: duplicaban el inicio desde la etapa y creaban borradores repetidos. En su lugar, «Agregar documento» arriba de Documentos (en las dos vistas) sube escrituras, predial, identificaciones o certificados desde la computadora o el celular a los documentos del cliente, el mismo repositorio privado. Los formatos que se repiten se agregan desde su renglón en la etapa («Registrar otra visita», «Nuevo reporte», «Otra propuesta», «Otro presupuesto»); el presupuesto de rehabilitación (19) se ofrece, sin detener, en el levantamiento. Se quitó la tarjeta «Entrevista inicial» de Documentos (ya está en la etapa) y la nota técnica del 03 y el 09; el control comercial sigue en Reportes. |
| SIM-19 | C54, C55 | Ficha del inmueble por pestañas | `/admin/propiedades/[slug]/editar` y `/seguimiento` muestran una ficha con Ficha pública · Fotos y material · Llaves · Interesados (las dos direcciones siguen abriendo su pestaña); «Ficha pública» con lo que se publica y el resto plegado; preparación como lista con casilla; un guinda por pestaña; guardar conserva la publicación; con el kit nuevo.  **Construida el 12/11/2026, en local y sin commit.** Las dos direcciones abren la misma ficha (`/editar` en «Ficha pública», `/seguimiento` en «Llaves»; `?seccion=` de Hoy sigue sirviendo). «Ficha pública» y «Fotos y material» son el mismo formulario repartido, con un solo guardado, su copia temporal y su conflicto 409; «Más para la ficha del sitio» y la fuente de las superficies van plegadas; «Ejemplo» se ve como pastilla en el encabezado. La preparación es una lista con casilla que guarda al momento y «⋯» abre quién y cuándo; «Prestar llaves» abre su formulario. Mientras la ficha tenga cambios sin guardar, llaves, preparación y avisos esperan para no pisar la versión abierta. La ficha pasa de 5 765 a unos 3 400 px. **Completada el 12/11/2026:** las secciones son grupos del panel con botones del kit y un solo guinda; «Guardar cambios» va a todo lo ancho en el celular. Video y recorrido 360 dicen «Listo» con «Ver» y «Quitar», o «Sin agregar» con «Subir video» y la opción de pegar un enlace solo si se elige; guardar conserva lo que ya tenían. Después, a pedido del titular, tampoco las fotos ni los PDF descargables muestran su dirección: entran subiéndolos o desde la biblioteca (sin renglones vacíos), cada uno con «Ver»; la foto lleva «Descripción de la foto» y avisa si no es pública. |

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

**Origen:** propuesta del agente aprobada por el titular el 17/10/2026 (V01–V10). **Estado al 11/11/2026:** LV-01 a LV-04 siguen pendientes; LV-05 a LV-08 están construidas y en `main`. Se trabaja igual que SIM y NAV: capturas antes y después a 390 y 1440 px en claro y oscuro, revisión de contraste AA con axe, pruebas afectadas y registro en este plan. Sin dependencias nuevas: íconos con `lucide-react` y animaciones con `motion`, ya instalados.

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

**Estado de LV-05 (18/10/2026): construida la capa visual** según los bocetos (marco, Hoy, Operaciones en lista y tablero, una operación, Inmuebles en galería, Contactos, Nueva operación y ventana de captura); registro en el historial ([`docs/erp-crm/historial-del-plan.md`](docs/erp-crm/historial-del-plan.md)). Quedan fuera, por falta de datos en el sistema, las cifras de cobros, la meta mensual, el avalúo dentro de la oferta, el perfil de leads compradores con coincidencias, las notas por inmueble y el tipo de cambio; el mapa entra con EXT-09.

**LV-07 · Tablero «Hoy» con el boceto D «Mosaico cálido» (titular, 29/10/2026).** El titular pidió bocetos nuevos del tablero «Hoy» y eligió el **D · Mosaico cálido** entre cuatro propuestas (A moderno, B estilo suizo, C consola nocturna y D mosaico cálido) del lienzo «Tablero Hoy del panel» (claude.ai, privado del titular). Reemplaza el «Hoy» de LV-05. **Estado al 11/11/2026: construido y en `main` (PR #63); el 11/11/2026 se reordenó en tres bloques (SIM-16, en local).** Las reglas para volumen alto de abajo siguen mandando.

- **Diseño del boceto D:** fondo crema `#F5F1EB` (desde el 11/11/2026 el lienzo del panel es `#F8F8FF`, ver LV-08); menú del panel en una barra superior de píldoras («Hoy» con su contador, Operaciones, Contactos, Inmuebles, Agenda y «Más»), con buscador, «Nueva operación» y avatar a la derecha; bloques de tamaños distintos con esquinas de 28 px y sin sombras marcadas: saludo con la fecha y dos acciones; «Lo siguiente» con la foto del inmueble y su pendiente más urgente; «Operaciones en curso» en azul marino con la barra por fase (Conocer · Revisar · Preparar y publicar · Vender y cerrar); «Vencidas» en borgoña sólido; «Tareas de hoy» con casillas; «Agenda» con la próxima cita y su foto; «Esta semana» en siete días; y «Esperan algo de ti» en tarjetas con foto. Marca sin rosa: borgoña en claro y crema sobre oscuro. Debe tener también su versión oscura y acomodarse al celular en una columna.
- **Reglas para volumen alto (acordadas el 29/10/2026):** «Hoy» no muestra el inventario, solo lo que espera algo del usuario, así que el tablero mide lo mismo con 12 pendientes que con 200:
  - las cifras ocupan el mismo bloque con cualquier cantidad;
  - «Esperan algo de ti» muestra con foto solo las 4 más urgentes; las siguientes, hasta unas 10, en lista compacta sin foto, y al final «Ver las N» hacia Operaciones;
  - orden por urgencia (vencidas primero, después lo que vence en la semana); varios pendientes del mismo inmueble se agrupan en una tarjeta («3 pendientes»);
  - por omisión cada asesor ve lo suyo; el administrador cambia a «Todo el equipo», que con volumen alto se muestra como resumen por asesor y no como lista;
  - un pendiente sin inmueble (por ejemplo, una entrevista inicial) usa un bloque de color con iniciales en lugar de foto;
  - «Tareas de hoy» y «Agenda» muestran las primeras 5 y «Ver todas».
- **Límites:** solo cambia la presentación de «Hoy»; usa los datos que el panel ya calcula (pendientes, tareas, agenda, operaciones por fase y foto principal del inmueble) y no lleva migración. Conserva la navegación por teclado, el foco visible, los objetivos de 44 px y «reducir movimiento». El cambio del menú lateral a barra superior aplica solo si el titular lo confirma para todo el panel; mientras tanto, «Hoy» conserva el marco actual.

**Dirección aprobada (titular, 17/10/2026):** los bocetos están en el lienzo «Bocetos del panel Fortius» (claude.ai, privado del titular). El titular eligió la dirección **clara**: menú lateral flotante, buscador rápido, tarjetas con esquinas suaves (16 px en tarjetas, 10 px en controles), sombras azul marino, fotos reales de los inmuebles y gráficas pequeñas. La escala quedó en el sistema de diseño «Fortius Inmuebles» como `admin-radius-*` y `admin-shadow-*`; el sitio público conserva sus esquinas casi rectas.

**Sitio público (registro en el historial).** Las decisiones de diseño del sitio (dirección «Nocturno» del 18/10/2026, temas claro y oscuro del 25/10, propiedades destacadas como baraja y título del método del 30/10) están construidas y en `main`; su registro completo está en [`docs/erp-crm/historial-del-plan.md`](docs/erp-crm/historial-del-plan.md). Reglas que siguen mandando: la marca no lleva rosa (borgoña sobre claro y crema sobre oscuro, `docs/brand.md`); en claro el sitio es claro, sin degradados oscuros, y «Nocturno» solo en oscuro; sin cejas sobre los títulos (31/10/2026); Scroll Motion y GSAP se conservan; el carrusel de la ficha no se toca; las destacadas van como baraja de cinco como máximo; el título del método es «Así vendemos tu propiedad.».

- **Hoy:** tablero del director con cifras arriba y «Necesitan tu decisión»; la misma pantalla se acomoda al celular, con barra inferior y botón «+».
- **Operaciones:** dos vistas con selector, **lista** (la de inicio) y **tablero** por fase; el sistema recuerda la última vista de cada usuario.
- **Inmuebles:** dos vistas, **galería** (primero) y **mapa** (cuando entre EXT-09).
- **Una operación:** se reemplaza por el boceto D «Moderno» (titular, 29/10/2026); ver **LV-06** abajo. Lo construido el 18/10/2026 (portada azul con foto, línea de tiempo a la izquierda y «Ahora toca» al centro) sigue en `main` hasta que el titular pida el cambio.
- **Contactos, Nueva operación y captura de documentos:** según sus bocetos.

**LV-06 · Una operación según el boceto D «Moderno» (titular, 29/10/2026). Construida el 31/10/2026 y en `main` (PR #65).** Pantalla partida: panel azul con quién, número de etapa, las diez etapas como barras y la persona con Llamar y WhatsApp; a la derecha las piezas de la etapa (documentos, próxima tarea, confirmaciones e inmueble) y la barra flotante con una sola acción. Fuente del boceto: `docs/diseno/operacion-boceto-d/`. La especificación completa está en [`docs/erp-crm/historial-del-plan.md`](docs/erp-crm/historial-del-plan.md). Lo que cambia después se decide en SIM-18 (operación en tres partes).
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

Ocho reglas para todas las pantallas (del artboard de diagnóstico): cada dato una sola vez; una acción principal por pantalla, en guinda; foto antes que ícono (toda operación, cita o aviso lleva la foto del inmueble; las personas, sus iniciales); títulos sin subtítulo ni encabezados de columna; números grandes en Archivo condensado para lo que cuenta (etapa, pendientes, cifras); lo vencido en rojo con palabra y lo demás sin color; formularios cerrados hasta que se piden (agendar, filtros, alta); nada técnico en pantalla (sin códigos «(05)», IDs, slugs, versiones ni «Las fechas son de Tijuana»). Lenguaje visual: lienzo `#F8F8FF` en claro (azul noche en oscuro) y tarjetas blancas con borde `rgba(6, 31, 63, .11)` (**titular, 11/11/2026:** reemplaza el lienzo crema `#F5F1EB` y el borde casi invisible `rgba(6, 31, 63, .06)`; el crema sigue siendo el color de texto y acento sobre fondos oscuros, `docs/brand.md`) con esquinas de 20–24 px, bloques azul marino de 28 px para lo que manda en cada pantalla, guinda solo en la acción principal y el contador de Hoy; Archivo 620/600/540/400 e Iconoir. Hoy «Mosaico cálido» (LV-07) y Una operación «Moderno» (LV-06) se conservan y solo se afinan con estas reglas. Los demás bocetos resuelven lo que SIM ya había anotado: C09–C11 (Hoy), C12–C22 (Operaciones y operación), C23–C24 (personas), C25–C26 (agenda), C27–C28 (inmuebles y herramientas), C29 (reportes) y C31–C32 (vacíos y Nueva operación).

- **Orden de construcción:** 1) marco común y lienzo (`#F8F8FF` desde el 11/11/2026); 2) Hoy; 3) Operaciones; 4) Una operación (LV-06); 5) Nueva operación; 6) Contactos y ficha de persona; 7) Inmuebles; 8) Agenda y Tareas; 9) Herramientas; 10) Administración (Equipo, Reportes, Sitio web, Historial, Configuración y Mi cuenta en una sola sección con índice). Cada sección se revisa en localhost antes de seguir con la siguiente.
- **Límites:** solo cambia la presentación. No cambian rutas, API, base de datos, permisos, candados de avance, 409 ni la protección de cambios sin guardar; las direcciones anteriores siguen funcionando. Sin dependencias nuevas.
- **Estado al 11/11/2026:** las diez secciones del orden de construcción están en `main` (PR #63 y #65, 31/10/2026). Lo que cada sección dejó pendiente se sigue en SIM-07, SIM-09, SIM-15 y SIM-17 a SIM-19.

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
| COR-01 | El nombre del propietario no llegaba al 07, 08 y 10. | **Hecha; en `main` (PR #56, 27/10/2026).** | Texto completo y pruebas en el historial. |
| COR-02 | El tipo de inmueble se perdía al pasar de la entrevista al 07. | **Hecha; en `main` (PR #56).** | Texto completo y pruebas en el historial. |
| COR-03 | Hoy llamaba «Prospecto» a operaciones que ya habían avanzado. | **Hecha; en `main` (PR #56).** La etapa cambia cuando se empieza el siguiente documento (titular, 26/10/2026). | Texto completo y pruebas en el historial. |
| COR-04 | La renta del propietario usaba el camino de la venta. | **Hecha; en `main` (PR #57).** Diez etapas propias de renta; migración `20261029170000_camino_de_renta.sql`. La revisión (05) y el 09 quedan opcionales mientras no exista la plantilla de intermediación para renta (DOC-14). | Texto completo y pruebas en el historial. |
| COR-05 | «Esperan algo de ti» ordena distinto en Hoy (`today.ts`) y en Operaciones (`operation-view.ts`), y el número del menú no coincide con las tarjetas. | Una sola función con el orden de RP-84 para las tres vistas. | Prueba: mismas operaciones, mismo orden y mismo número en Hoy, Operaciones y menú. **En local el 12/11/2026:** `attentionOf` (`operation-view.ts`) es la única definición del motivo, con el orden de RP-84 y la oferta nueva de los últimos 3 días; la usan Operaciones y la cola de Hoy (`waitingItems`), que ahora también marca «Vence hoy» y «Falta … de una etapa anterior» como Operaciones. La cola de Hoy y sus datos se calculan en un solo lugar (`workspace/use-today-queue.ts`), y el número del menú es la cantidad de tarjetas de esa cola: en la revisión con datos de prueba, el menú y «N pendientes en total» de Hoy dicen lo mismo, y las tres operaciones de «Esperan algo de ti» en Operaciones aparecen en Hoy con el mismo motivo. Esos datos se olvidan al cerrar o cambiar de sesión. Lo no leído de «Para ti» (RP-20) se sumará cuando exista. |
| COR-06 | La lista de documentos pedía siempre CESPT y no admitía «No aplica». | **Hecha; en `main` (PR #57).** **Queda fuera:** los grupos B a D de B-06 (documentos según la forma de pago del comprador) se agregan al conocer la oferta (14); siguen sin confirmar la constancia de no adeudo predial de Tijuana, el certificado de la Junta de Urbanización y la constancia de la CESPTE. | Texto completo y pruebas en el historial. |
| COR-07 | Las etiquetas sencillas dicen más que la regla: «Firma ante notario», «Pago completo antes de entregar», «Aviso de privacidad firmado» (`src/lib/admin/today.ts`). | Etiquetas de RP-86 en todas las pantallas y documentos. | Prueba de textos; ninguna etiqueta contradice su requisito. **En local el 12/11/2026 (DEC-27):** `requirementName` (`today.ts`) usa los tres nombres de RP-86 en todas las pantallas del panel que nombran requisitos; la renta conserva los suyos. El encargo del rediseño se actualizó. Una prueba comprueba que ninguno promete notario, pago completo ni firma del aviso. Las páginas públicas que dicen «Firma ante notario» describen el proceso de compra, no un requisito, y no se tocaron. |
| COR-08 | El informe al propietario solo registraba cuándo se preparó. | **Hecha; en `main` (PR #57).** Registra cada entrega (fecha, canal y responsable); migración `20261029150000_informe_entregas.sql`. | Texto completo y pruebas en el historial. |
| COR-09 | «Cierre y entrega» ocultaba firma, entrega, postventa y archivo en un solo círculo. | **Hecha; en `main` (PR #57).** | Texto completo y pruebas en el historial. |
| COR-10 | El sistema no sigue la regla de prospecto y cliente (RP-90 a RP-92): completar la entrevista convierte al contacto en cliente (registro del 13/10/2026); el botón «Convertir en cliente» lo hace a mano (`src/components/admin/convert-lead-button.tsx`); listas, agenda y búsqueda llaman «Cliente» a quien está en la tabla `clientes`; el requisito de intermediación se cumple con «revisado», sin registro de firma (`src/lib/formatos/operation-workflow.ts`); y quien ya tiene operación deja de aparecer en el seguimiento de prospectos aunque no haya firmado (`src/lib/admin/followups.ts` y `commercial-metrics.ts` excluyen a quien tiene `clienteId`). | Registrar en la operación la firma del contrato (tipo, fecha, firmantes y archivo; admite firmado fuera del panel). Calcular «Prospecto/Cliente» y «Captado» a partir de esa firma en Contactos, fichas, agenda, búsqueda, Hoy y Reportes. Cambiar «Convertir en cliente» por «Abrir operación», la etapa 1 por «Primer contacto» y el estado «evaluación» del inmueble por «En captación» (RP-97). Mostrar «Cliente anterior» al vencer o rescindirse el contrato y «Contraparte» al comprador o arrendatario que firma con el cliente (RP-93, RP-97). Pedir la firma registrada, además de revisada, para pasar de «Contrato y preparación» a «Publicación». Mantener en el seguimiento de prospectos a quien tiene operación sin contrato firmado. Se conservan las tablas `leads` y `clientes`, sus IDs y la conversión idempotente. Si cambia la validación del servidor: migración aditiva con respaldo, ensayo y autorización. | Pruebas: una entrevista completada deja a la persona como «Prospecto» con su operación; registrar la firma del 09 la muestra como «Cliente» y el inmueble como «Captado» en todas las vistas; sin firma registrada no se pasa a Publicación; un comprador queda como contraparte, no como cliente, al registrar la promesa o la compraventa firmada (RP-93); vencer o rescindir el contrato deja a la persona como «Cliente anterior» (RP-97); convertir dos veces sigue devolviendo el mismo registro. **Entrega 1 en local el 12/11/2026 (migración autorizada por el titular ese día):** la guía de la operación guarda `firmaContrato` (tipo, fecha, firmantes con su parte, el contrato firmado elegido de los documentos del cliente de esa operación, si está completa y quién falta, revisión y terminación). El asesor la registra en la tarjeta «Firma del contrato» de «Contrato y preparación»; el servidor anota quién y cuándo, una corrección borra la revisión, solo un administrador la marca revisada y nunca incompleta, y no se borra: se registra su terminación. Sin la firma completa, revisada y vigente no se pasa a Publicación (ni más adelante) en la venta y la renta del propietario, y no se publica (`publicationBlockers` y `fortius_inmuebles_flow_publish_ready`). Migración `20261112120000_firma_del_contrato.sql`: solo agrega; las operaciones que ya están más adelante se quedan donde están. Pruebas: base de datos (forma, archivo ajeno, revisión solo del director, corrección, terminación, bloqueo de avance y de publicación), panel y tarjeta. **Entrega 2 en local el 12/11/2026:** una sola función (`src/lib/admin/person-status.ts`) calcula a partir de la firma «Prospecto», «Cliente» (firma registrada, aunque falte la revisión), «Cliente anterior» (todos sus contratos terminados) y «Contraparte» (el interesado que firma con el cliente), y del inmueble «En captación», «Captado, por revisar» y «Captado». La usan Contactos (chip y filtros: «Clientes» solo cuenta a quien firmó; quien tiene registro de cliente sin firma queda en «En seguimiento»), las fichas del prospecto y del cliente (con «Firmó su contrato con Fortius» en su historial), la búsqueda, el asistente al elegir a la persona, la agenda, Hoy, Reportes (prospectos activos, clientes por asesor y conversión cuentan por la firma) e Inmuebles. Sin las operaciones cargadas no adivina: dice «Contacto». Cambios de nombre: la ficha del prospecto ya no tiene «Convertir en cliente» y su acción principal es «Abrir operación»; la etapa 1 es «Primer contacto»; el estado «evaluación» se muestra «En captación · privado». Se conservan las tablas `leads` y `clientes`, sus IDs y la conversión idempotente del servidor. El manual del panel (`docs/admin-manual.md`, «Prospectos, clientes y firma del contrato») y `docs/admin-workspace.md` lo describen desde el 12/11/2026. |
| COR-11 | «Quiere comprar» y «Quiere rentar» abrían una operación aunque Fortius solo representa al propietario. | **Hecha; en `main` (PR #57).** Se guardan como interesados; migración `20261029160000_interesados_sin_operacion.sql`. **Falta:** ligar las ofertas (14) al interesado y la revisión del titular. | Texto completo y pruebas en el historial. |
| COR-12 | El formato 09 pide el «Estado del registro PROFECO» y sus datos (`src/lib/formatos/intermediacion.ts`), y su bloqueo cuenta con ese registro. Fortius no tiene registro ante PROFECO y no lo tendrá en 2026 (titular, 17/10/2026). | Quitar del 09 la captura y la revisión del registro PROFECO y ajustar su texto. El PDF se libera a partir del modelo de contrato que enviará el titular (DOC-09); antes, el abogado de Fortius confirma si ese registro es obligatorio. | Prueba: el 09 ya no pide PROFECO; con el modelo del titular cargado, el PDF sale de esa plantilla. |
| COR-13 | Las operaciones nuevas empezaban en la etapa 5, «Dictamen jurídico». | **Hecha; en `main` (PR #56).** La operación nueva se queda en captación; lleva migración. | Texto completo y pruebas en el historial. |
| COR-14 | Una condición jurídica declarada en la llamada o en la 02 no cambia el camino: la operación manda al levantamiento antes de cualquier revisión jurídica (en contra de RP-96); el «Siguiente paso» de la 02 («Evaluar la operación», «Pausar», «Referir») no hace nada; «Decisión del encargo» y la situación («En regularización», «Descartada») solo se capturan en la pestaña Ajustes y no se ven en Operaciones, Hoy ni Contactos. Encontrado el 02/11/2026 al ensayar la llamada de una casa invadida con saldo del Infonavit. | Cuando hay condición marcada (CAP-05) o la 02 termina con «Evaluar la operación», «Lo que sigue» ofrece «Pedir revisión al abogado» antes del levantamiento y crea la tarea; el 06 puede concluir «No factible temporalmente» o «Con condiciones», que ya existen; «Pausar» deja la operación en pausa y «Referir» la descarta con el motivo «Referida». «Decisión del encargo» pasa al panel de la etapa (sale de Ajustes, DEC-38) y la situación y la condición se muestran como chip con su texto en la operación, Operaciones, Hoy y Contactos. Los motivos de descarte de RP-97 se capturan como lista fija. Sin cambio de base: usa `flujo.estado`, `flujo.resolucion` y `flujo.motivo` como hoy. | Prueba: una operación con condición marcada no ofrece el levantamiento como siguiente paso; los tres cierres de la 02 cambian el estado; el chip aparece en las cuatro vistas; un descarte sin motivo de la lista se rechaza. **Construido en parte el 02/11/2026; en `main` (PR #66):** con condición declarada o «Evaluar la operación» en la 02, la etapa pide «Pedir revisión al abogado» (crea la tarea) y el levantamiento espera a que se complete; «Pausar» y «Referir» de la 02 se aplican con un clic; la situación y la condición salen como chip en la operación, Operaciones, Hoy y Contactos; el descarte exige un motivo de la lista fija (RP-97), en Ajustes y en el servidor al pasar a «Descartada»; los descartes anteriores conservan su motivo. El chip en Hoy aparece solo cuando la operación está en «Esperan algo de ti». **Completada en local el 12/11/2026:** «Decisión del encargo» salió de «Datos de la operación» y es una tarjeta del panel de la etapa (`src/components/admin/operation/encargo-decision.tsx`): aparece en Verificación y siempre que el encargo esté en pausa, rechazado o referido; «Te falta» la señala con «Ir a la decisión»; guarda solo la resolución. Prueba en `tests/admin/operation-screen.test.tsx`. |
| COR-15 | Dos entradas para la misma llamada (Contactos y Nueva operación). | **Hecha; en `main` (PR #66).** Lo que falta para que sea una sola puerta está en C48 y SIM-17. | Texto completo y pruebas en el historial. |

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
| CAP-05 | Condición desde la llamada (ver el bloque siguiente) | CAP-01, COR-14 | En «Datos del prospecto» hay una pregunta «¿Mencionó algún problema con el inmueble?» con opciones y detalle; la respuesta llena la entrevista 02 (ocupación, crédito, alertas) y se muestra como condición visible en la operación, en Operaciones, en Hoy y en Contactos; la nota del primer contacto aparece en la operación y en la 02; «Nuevo prospecto» de Contactos, al elegir «Vender», lleva a la misma pantalla (COR-15). **Construido el 02/11/2026; en `main` (PR #66):** preguntas «¿Mencionó algún problema con el inmueble?» (con detalle obligatorio) y «¿Debe un crédito o hipoteca del inmueble?»; llenan alertas, ocupación y crédito de la 02. Requiere la migración `20261102120000_interview_property_condition.sql`, que amplía las respuestas aceptadas; hasta aplicarla, guardar un prospecto con estas respuestas falla contra la base. |
| CAP-06 | Entrevista 02 y lista de documentos con la condición | CAP-05, COR-06, DEC-39 | La 02 ofrece «Invadida u ocupada sin permiso» en ocupación y, con crédito, «¿Está al corriente?» y «¿Sabe cuánto debe?»; la lista de documentos pide la denuncia o demanda cuando hay invasión y deja de pedir llaves y horarios de visita; con Infonavit sigue pidiendo la carta con saldo e instrucción de cancelación (D17) y el 08 conserva «Liquidación de crédito». Las preguntas exactas las valida el titular con el abogado (DEC-39). |

**Llamada con condición jurídica (revisión del 02/11/2026).** Caso ensayado por el agente con datos simulados: un propietario llama porque quiere vender una casa que está invadida y que todavía debe al Infonavit, y pregunta si Fortius puede ayudarle.

- **Lo que hace hoy el sistema:** «+ Nuevo» → Nueva operación → «Vender su inmueble» → «Quién es» (nombre, teléfono, «Llamada») → «Datos del prospecto» (colonia, tipo, qué quiere y por qué, precio, aviso de privacidad, fecha de la entrevista) → «Guardar prospecto» crea la operación en Prospecto. Toma alrededor de un minuto y funciona. La entrevista 02 sí pregunta quién ocupa el inmueble y si tiene crédito (con «Infonavit» como opción); con esa respuesta la lista de documentos agrega sola la carta del Infonavit (D17), el neto (08) tiene «Liquidación de crédito» y el 05 tiene tablas de cargas y hallazgos donde el abogado puede anotar la invasión. Esa parte está bien resuelta.
- **Lo que falla:** la invasión y el adeudo solo caben en «Notas del primer contacto», y esa nota no pasa a la 02 (`intake-prefill.ts` no copia `condiciones`) ni se muestra en la operación: la 02 arranca con ocupación y crédito «por aclarar». La palabra «invadida» no existe en el sistema: la 02 ofrece propietario, familia, inquilino, desocupado y «otra persona»; la lista de documentos solo reacciona a inquilino; el 05 tiene controles para litigio, remate y adjudicación, no para ocupación irregular. La operación en etapa 02 dice «Con todo listo se abre sola Levantamiento» y el dictamen es la etapa 05: para una casa invadida el levantamiento es imposible y la pregunta del cliente la contesta el abogado, en contra de RP-96 (la opinión jurídica va antes de tomar el encargo). El «Siguiente paso» de la 02 («Evaluar la operación», «Pausar», «Referir») no cambia nada; la decisión real está en Ajustes como formulario, y «En regularización» y «Aceptada con condiciones» no se ven en Operaciones ni en Hoy. Nadie pregunta si el crédito está al corriente ni cuánto debe. «Nuevo prospecto» en Contactos también admite «Vender» pero crea una persona sin operación: dos asesores con la misma llamada acaban con registros distintos. Si el abogado dice que no es viable, solo queda «Descartada» con texto libre: los motivos de RP-97 no están construidos.
- **Qué cambia:** CAP-05 y CAP-06 (arriba), COR-14 y COR-15 (correcciones inmediatas), el módulo «ocupación irregular o invasión» en MOT-02 y las decisiones DEC-38 y DEC-39. Hasta que se construya, el asesor hace a mano lo que el sistema no indica: no agendar levantamiento, llenar la 02 marcando «Otra persona» e «Infonavit», poner en Ajustes la situación «En regularización» o la decisión «Aceptada con condiciones» con el motivo, crear la tarea para el abogado y pedir escritura, estado de cuenta del Infonavit y cualquier denuncia.

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
- **Módulos (se activan con una respuesta):** crédito Infonavit; crédito Fovissste; crédito bancario; hipoteca vigente por liberar; inmueble rentado (contratos, rentas, aviso y derechos del inquilino si aplican); condominio; parque industrial; copropiedad o herencia; régimen conyugal con firma del cónyuge; apoderado; propietario extranjero o fideicomiso; ejido; ampliaciones sin registrar; terreno en breña para lotificar (uso de suelo, factibilidades, topografía, deslinde; reducido si ya hay memorias descriptivas); inmueble para rehabilitar (enlaza la herramienta Rehabilitación); **ocupación irregular o invasión** (agregado el 02/11/2026 tras ensayar la llamada de una casa invadida: revisión jurídica antes del levantamiento, denuncia o demanda en la lista de documentos, sin llaves ni horarios de visita; ver COR-14 y CAP-06).
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

### D. Captura sin repetir (CSR) — aprobado por el titular el 31/10/2026

**Origen:** el titular observó que capturar sobre el documento en vivo es lento porque muchos valores se repiten entre formatos (nombre del cliente, fecha, datos del inmueble). Su solución de fondo es la lectura de documentos del cliente (IA-01); pidió además ideas sin IA. Aprobó este paquete, que se construye **después de las secciones del panel (LV-08)**, salvo que el titular pida adelantarlo. Principio: el sistema nunca pide dos veces lo que ya sabe; la IA (IA-01) solo lee lo que no se pueda deducir.

| ID | Qué | Cómo convive | Aceptación |
|---|---|---|---|
| CSR-01 | **El diccionario como puerta.** «Datos del expediente» (DAT-EXP) deja de ser una pestaña más: cada etapa muestra primero los datos que le faltan al expediente, y un formato nunca pregunta un dato que el expediente ya tiene; en la ventana del documento esas celdas aparecen llenas y la lista «Qué falta» solo cuenta las propias del formato. | Usa DAT-EXP tal como está (confirmar una vez, llenar celdas vacías, respetar lo escrito por una persona). Sin migración. | En el 05 la lista «Qué falta» baja de 47 a los datos propios del formato con un expediente confirmado; una celda llenada desde el expediente muestra su fuente. |
| CSR-02 | **Datos automáticos con dueño.** Fecha de hoy, folio, asesor, responsable y nombre del cliente salen de la operación; dirección, medidas, precio y tipo de la ficha del inmueble; estado civil, RFC, CURP y domicilio de la ficha de la persona, que sirven para todas sus operaciones. Cada dato tiene un solo lugar donde se escribe; los demás lo muestran con enlace a su origen. | Amplía `datos-expediente.ts` con la fuente de cada dato (operación, inmueble, persona, expediente). La ficha de la persona recibe los datos jurídicos que hoy solo viven en formatos. Puede llevar migración (campos de la persona): se avisa antes. | Al cambiar el teléfono o el estado civil en la ficha, los formatos nuevos lo toman; los existentes avisan como en DAT-EXP. |
| CSR-03 | **Deducir en vez de preguntar.** CURP → fecha de nacimiento, sexo y estado; código postal → colonia, municipio y estado con el catálogo público de Correos de México (archivo local, sin servicio externo); validación de formato de RFC y clave catastral. | Reglas deterministas en `src/lib`, con pruebas; el catálogo de códigos postales se incorpora como datos estáticos con su fecha de corte. | Al escribir una CURP válida se llenan tres campos; un CP válido llena la colonia con lista si hay varias; un RFC mal formado avisa sin bloquear. |
| CSR-04 | **Pedir solo lo que se imprime, por bloques.** Revisión formato por formato: campo que no sale en el PDF se retira de la captura; lo conocido primero y lo nuevo al final; «No sabe» donde la entrevista ya lo usa. | Conserva «los formatos siguen su plantilla»: no se agregan campos ni se cambia el PDF. | Tabla por formato: campos capturados antes y después; ningún PDF cambia. |
| CSR-05 | **El documento del cliente al lado.** En la ventana del documento, un panel con el archivo del cliente (foto o PDF ya subido) para transcribir sin cambiar de ventana; se elige el archivo que corresponde al formato. | Usa DOC-EXP (Storage privado). Solo pantalla. | Transcribir una escritura al 05 no exige abrir otra pestaña; el visor respeta el acceso por RLS. |
| CSR-06 | **Copiar de otra operación** del mismo cliente o inmueble («Tomar los datos de la operación anterior»). | Lee el diccionario de la otra operación; todo entra «Por confirmar». | Una segunda operación del mismo propietario arranca con sus datos confirmados en un paso. |
| CSR-07 | **Pegar y reconocer.** Un cuadro donde se pega texto (correo del notario, mensaje del cliente) y el sistema reconoce fechas, CURP, RFC, montos y claves con patrones fijos; todo entra «Por confirmar». | Patrones deterministas, sin IA; misma entrada que IA-01 al diccionario. | Pegar un párrafo con CURP y una fecha los propone en el expediente con su frase de origen. |
| CSR-08 | **Dictado del navegador** en la captura (API de voz del navegador, sin servicio externo), pensado para el levantamiento en sitio. Última prioridad: la calidad depende del ruido. | Opcional por campo; nada se guarda sin que el asesor lo vea escrito. | Funciona en Chrome y Safari del celular; sin soporte, el botón no aparece. |

**Orden:** CSR-01, CSR-02 y CSR-04 primero (bajan la captura a la mitad y no dependen de nada externo); después CSR-03, CSR-05 y CSR-07; CSR-06 y CSR-08 al final. IA-01 entra encima y lee solo lo que quede.

**Construido el 31/10/2026 (rama `feat/inicio-claro`, pendiente de revisión del titular en localhost):**

| ID | Qué quedó | Dónde |
|---|---|---|
| CSR-01 | Al abrir un formato, lo confirmado en el expediente llena solo las celdas vacías y la barra avisa cuántas; «Qué falta» separa «Se completan una vez en el expediente» (con «Completar en el expediente», que abre los datos que faltan sin cerrar la ventana) de lo propio del formato. | `documento-en-vivo.tsx`, `datoParaCelda` en `datos-expediente.ts` |
| CSR-02 | La ficha de la persona tiene «Datos para el expediente» (CURP, RFC, fecha de nacimiento, estado civil, identificación, domicilio). Al leer los datos del expediente se mezclan los automáticos: persona → confirmados con origen «Ficha de la persona»; inmueble (tipo, superficies, recámaras, baños) → «Por confirmar» con origen «Ficha del inmueble». Lo guardado en el expediente gana; al guardar se omiten los automáticos sin cambio. Un formato nuevo nace con las fechas que son hoy (`fecha`, `fechaEmision`, `fechaCorte`, `fechaRegistro`, `fechaEntrevista`, `fechaValor`). «Esta etapa» avisa cuántos datos hay por confirmar. **Sin migración:** los campos nuevos de la persona viajan en el JSON de la colección `clientes`. | `cliente-editor.tsx`, `contracts.ts`, `validation.ts`, `expediente-datos.ts`, rutas `/datos` y `/formatos`, `next-step.tsx` |
| CSR-03 | CURP → fecha de nacimiento, sexo y entidad (en la ficha y en el expediente; la fecha entra «Por confirmar»); RFC y CURP mal formados avisan y no se guardan; clave catastral con validador. Código postal → colonias de Baja California con el catálogo de Correos de México: `node tools/sepomex-bc.mjs` genera `src/data/codigos-postales-bc.json` (ignorado por git: la licencia de SEPOMEX no permite redistribuirlo; en el servidor se genera antes del build con `--si-falta`); la ruta `/api/admin/codigos-postales?cp=` lo sirve y, sin catálogo, lo dice. | `deducir.ts`, `cp-helper.tsx`, `tools/sepomex-bc.mjs`, `api/admin/codigos-postales` |
| CSR-04 | Auditoría de 1 279 campos en 24 formatos: todo se imprime; ningún campo se retira. Una corrección: «Número de recibo» del 18 ya es pulsable. | `docs/formatos-campos-auditoria.md` |
| CSR-05 | «Documentos del cliente» en la barra de la ventana del documento: lista los archivos del expediente y muestra el elegido (PDF o imagen) en un panel al lado; en pantallas angostas cubre la hoja y se cierra. | `documento-en-vivo.tsx` |
| CSR-06 | «Tomar de otra operación» en Datos del expediente: lista las operaciones del mismo cliente o inmueble y trae sus datos confirmados «Por confirmar» con origen «Operación EXP-…». | `expediente-datos-panel.tsx` |
| CSR-07 | «Pegar texto» en Datos del expediente: reconoce CURP, RFC, folio real, clave catastral, partida, escritura (con fecha y notaría), teléfono, correo, fecha de nacimiento y superficies; todo entra «Por confirmar» con la frase de origen. | `reconocer.ts`, `expediente-datos-panel.tsx` |
| CSR-08 | «Dictar» en la captura de la ventana del documento (voz del navegador, español de México); escribe en el último campo de texto que tuvo el foco; sin soporte, el botón no aparece. | `documento-en-vivo.tsx` |

**Proveedor de prueba para IA-01 (titular, 31/10/2026):** el titular entregó una clave de prueba de **xAI (Grok)**. Quedó guardada solo en el servidor local (`.env.local`, variable `XAI_API_KEY`, nunca con prefijo `NEXT_PUBLIC_*` ni en el repositorio). **Adaptador construido el 31/10/2026:** `src/lib/ia/grok.ts` (chat completions de xAI con `response_format: json_schema` estricto generado del mismo esquema zod de `lectura.ts`; modelo `grok-4.7`, cambiable con `XAI_MODELO`; costo con su tarifa) y `src/lib/ia/proveedor.ts` (elige `claude` o `grok` según `IA_PROVEEDOR` o la clave disponible, Claude primero). **Límite documentado por xAI:** su API de chat solo recibe imágenes (JPG, PNG, WEBP), no PDF; con Grok, un PDF devuelve un mensaje que pide una foto del documento, y la ruta de archivos informa qué tipos puede leer (`legibles`). **Probado el 31/10/2026 por la tarde:** la API de xAI rechaza la clave entregada («Incorrect API key»; su prefijo no es el de una clave de api.x.ai), así que el adaptador queda listo pero sin uso. Para que un PDF entre por un servicio que solo recibe imágenes, el panel dibuja sus páginas con `pdfjs-dist` (dependencia nueva) y las manda a `/leer` como JPEG (hasta 12 páginas, 4 MB cada una). **El titular entregó entonces una clave de Claude y pidió Haiku:** `ANTHROPIC_API_KEY`, `ANTHROPIC_MODELO=claude-haiku-5-5` e `IA_PROVEEDOR=claude` en `.env.local`; `MODELO_LECTURA` lee `ANTHROPIC_MODELO`, el costo usa la tarifa del modelo (Haiku 5.5: 0.10/0.50 USD por millón) y con Haiku no se manda el respaldo automático de modelo (no lo ofrece). Primera lectura real con un PDF de datos ficticios: 7 datos con página y cita, por confirmar. Siguen vigentes las dos condiciones del 29/10/2026: nada se activa con documentos reales sin el visto bueno del abogado, y las dos claves compartidas por chat deben rotarse antes de ese uso real.

### E. Inmuebles compartidos de otra inmobiliaria (PUB-02, detalle del 02/11/2026)

**Supuesto del titular (02/11/2026):** un colega de otra inmobiliaria le comparte inmuebles que él captó; Fortius los publica en su sitio sin conocer al propietario ni haber hecho la entrevista, confiando en el trabajo del colega.

**Qué prevé hoy el sistema:** la regla existe (RP-95) y la entrega PUB-02 está en el backlog, en el bloque 3 y **sin construir**. En el código no hay marca «Compartido», aliado externo, autorización adjunta ni etiqueta pública. Lo que sí hay: el inmueble se da de alta privado («+ Nuevo» → Nuevo inmueble o Herramientas), y el botón «Publicar» del formulario solo se activa cuando el inmueble tiene una operación de captación en comercialización con todas sus revisiones (entrevista, titularidad, factibilidad, valor, precio, intermediación, levantamiento, plan y publicación autorizada). Un inmueble compartido no tiene esa operación, así que el panel lo deja en borrador con el texto «Guárdalo privado; luego liga su captación y la autorización». El único camino para publicarlo hoy sería abrir una operación de captación ficticia y marcar revisiones que Fortius no hizo: eso contradice RP-91 y RP-96 y deja constancia falsa en el historial. **No hacerlo.**

**Hueco de servidor encontrado al revisar (COR-16):** la puerta de publicación se comprueba solo en el navegador (`property-publication-gate.tsx` consulta `/api/admin/propiedades/[slug]/publicacion`); al guardar, el servidor (`parseRecord` en `src/lib/backend/validation.ts`) solo exige imagen, fecha y que no esté «en evaluación». Una escritura directa a la API publica sin operación.

**Diseño propuesto (sin construir; lo aprueba el titular):**

- **Origen del inmueble:** cada inmueble lleva `origen: propio | compartido`. Al dar de alta uno nuevo, la primera pregunta es «¿Es de Fortius o lo comparte otra inmobiliaria?». Un inmueble compartido no abre operación ni etapas; no pide entrevista, levantamiento, documentos ni dictamen de Fortius. Conserva llaves, preparación y avisos a compradores si el equipo los usa.
- **Aliado externo:** la inmobiliaria y su asesor se registran una vez como aliado externo (papel de RP-05), con nombre, teléfono, correo y porcentaje pactado por omisión. Cada inmueble compartido liga a su aliado y guarda el porcentaje de esa operación y el acuerdo de colaboración adjunto.
- **Autorización para publicar:** el inmueble compartido se publica solo con la autorización escrita de la inmobiliaria adjunta (archivo o foto legible, fecha y quién la dio) y con el aliado ligado. El servidor rechaza `publicada: true` sin esas dos cosas; para un inmueble propio exige lo mismo que la puerta actual (COR-16). El aliado confirma por escrito que su contrato con el propietario le permite compartirlo y publicarlo; el abogado de Fortius dice qué debe decir esa autorización (DEC-40).
- **Lo que ve el público:** solo lo que la inmobiliaria autorice (fotos, precio, descripción, ubicación aproximada); nunca el nombre, teléfono ni documentos del propietario. La ficha pública lleva la etiqueta «Inmueble en colaboración», sin el nombre de la inmobiliaria (DEC-40), y la ficha técnica no afirma datos que Fortius no verificó: en cada uno la fuente dice «Según la inmobiliaria aliada». El asesor de contacto que aparece es el de Fortius. Qué texto lleva la etiqueta lo decide el titular (DEC-40).
- **En el panel:** chip «Compartido» en la lista de Inmuebles y en la ficha, con el aliado y el porcentaje; sin «Les falta algo» de captación; en Reportes la comisión estimada entra rotulada «Estimación» y no se suma a lo cobrado hasta cobrarse (RP-95). Cuando Fortius consigue comprador para un inmueble compartido, la venta se lleva como contraparte con aliado externo, no como operación de captación.
- **Registro:** qué se publicó, con qué autorización y quién lo autorizó queda en el historial del inmueble, para poder retirarlo si la inmobiliaria lo pide.

| ID | Alcance | Depende de | Aceptación |
|---|---|---|---|
| COR-16 | La publicación de un inmueble se bloquea solo en el navegador; el servidor acepta `publicada: true` sin operación de captación. | — | Prueba de backend: guardar un inmueble propio con `publicada: true` sin operación en comercialización con sus revisiones devuelve 400 con la lista de faltantes; con la operación completa se acepta. Los inmuebles ya publicados no cambian.  **Construido el 02/11/2026; en `main` (PR #66):** `PUT /api/admin/collections/propiedades/[id]` aplica la misma regla que la puerta del navegador (`src/lib/backend/publication-gate.ts`, compartido con `/publicacion`) y responde 400 con `faltantes`; prueba en `tests/backend/publication-server-gate.test.ts`. **Comprobado el 12/11/2026, sin hueco en SQL:** el disparador `fortius_01_guard_guided_publication` (antes de insertar o actualizar `fortius_inmuebles_records`, activo en producción) exige la captación activa en comercialización con revisiones, observaciones y resoluciones (`fortius_inmuebles_flow_publish_ready`), también cuando se llama directo a `fortius_inmuebles_put_record`; `fortius_inmuebles_restore_record` devuelve el inmueble con `publicada: false`. No hace falta migración. |
| PUB-02 (detalle) | Origen propio o compartido; aliado externo; autorización adjunta; etiqueta y proyección pública; chip en el panel; estimación en finanzas. | COR-16, DEC-40; PUB-01 parcial basta | Un inmueble compartido se publica solo con aliado ligado y autorización adjunta (prueba de backend); la proyección pública no incluye datos del propietario; la ficha pública muestra la etiqueta y la fuente de cada dato; la lista de Inmuebles lo marca «Compartido»; la estimación no se suma a lo cobrado. Sin migración: todo cabe en el registro del inmueble y en archivos adjuntos. |

### F. Casos de uso probados contra el panel (02/11/2026)

**Método (titular, 02/11/2026):** el titular plantea casos concretos del día a día; el agente recorre cada uno en el panel con datos simulados y en el código, y anota qué hace hoy el sistema, qué falla y qué cambio lo corrige. Los cambios se numeran como COR o CAP y las decisiones como DEC. Casos anteriores: la llamada con casa invadida y saldo del Infonavit (bloque A, CAP-05, CAP-06, COR-14, COR-15) y los inmuebles compartidos de otra inmobiliaria (bloque E). Capturas en `tmp/critica-panel/shots/caso-*.png`.

| Caso | Qué hace hoy el sistema | Qué falla | Cambio |
|---|---|---|---|
| **A · Llama alguien que busca casa en renta en una zona y con un presupuesto.** | «+ Nuevo» → Nueva operación → «Quiere rentar» → «Quién es» → «¿Qué busca?» (tipo, uso, zonas, renta máxima, moneda, origen de ingresos, recámaras, para cuándo, notas, aviso de privacidad, próxima acción con fecha) → se guarda como interesado, sin operación (COR-11). Su ficha muestra «Inmuebles que le pueden servir» (publicados y disponibles que coinciden por tipo, zona escrita y presupuesto hasta 5 % arriba); Hoy dice «Toca darle seguimiento» al llegar la fecha; desde el seguimiento del inmueble se le avisa y queda registrado. Funciona. | La ficha ofrece «Preparar operación» en guinda a quien busca renta, cuando esa persona no abre operación; las acciones reales (enviar opciones, registrar que se le llamó) no están. El registro de contacto en dos toques (RP-21) y el reloj de primera atención (RP-23) no existen; el seguimiento es una fecha en el perfil con el texto «Darle seguimiento» (C40). La coincidencia por zona es por texto: «Lomas Virreyes» no encuentra «Lomas de Virreyes», y un presupuesto en otra moneda se ignora. Nada dice al equipo «hay tres personas buscando renta en Lomas Virreyes y no tenemos nada». En celular y escritorio, la barra fija de «¿Qué busca?» tapa la casilla del aviso de privacidad (se suma a C39). | COR-18 (acciones y línea de tiempo del interesado), COR-19 (demanda sin inventario), CRM-02 (RP-21, RP-22, RP-23). |
| **B · Hay prospectos buscando en una colonia sin inventario; captar un inmueble sin pasar por toda la entrevista ni el dictamen.** | «Alta rápida, sin entrevista» solo admite a un **cliente** ya registrado con asesor; un propietario nuevo es prospecto y no aparece. Aunque se abra, la operación empieza en Prospecto y pide entrevista, levantamiento, checklist, dictamen, valor, precio e intermediación antes de publicar; las coincidencias solo proponen inmuebles publicados; un inmueble «En evaluación» se queda privado. RP-91 prohíbe ofrecer antes de la firma, también en privado, y RP-31 dice que solo el director autoriza avanzar sin un requisito con motivo escrito, pero esa autorización no está construida: no hay forma de saltar un requisito con motivo. | No existe el camino «tengo comprador, busco inmueble»: nada liga la demanda con la captación ni crea una oportunidad desde el prospecto. El alta rápida no sirve para un propietario nuevo. La excepción del director (RP-31) no existe en el sistema, así que o se cumple todo o se inventan revisiones. | COR-19 (demanda y captación dirigida), COR-20 (excepción autorizada por el director con motivo y chip visible), DEC-41 (si se permite enseñar a un prospecto un inmueble aún no captado y con qué autorización del propietario). |
| **C · El propietario ya tiene un avalúo; no hace falta la opinión de valor.** | El requisito «Opinión de valor y fuentes» se puede marcar «Revisado» con respaldo «externa» (folio o dónde está, quién lo revisó, fecha, qué se encontró) sin crear el 07; con valor y precio revisados y la decisión registrada, la etapa pasa a Contrato. El neto (08) puede empezar sin 07. | La pantalla sigue diciendo «le falta el 07» con «Hacerlo ahora» aunque el requisito esté cubierto. El avalúo no se puede adjuntar al requisito: los adjuntos cuelgan de un formato (habría que crear un 07 vacío solo para adjuntarlo); el repositorio de documentos del cliente no sirve como respaldo. No se guarda perito, fecha, valor ni vigencia; el margen de ±10 % de RP-96 no está construido y, cuando lo esté, debe poder comparar contra el avalúo. Nadie avisa que el avalúo del propietario sirve para fijar precio, pero el crédito del comprador pedirá el suyo (Infonavit lo pide el comprador; el banco, el banco). | COR-17. |
| **D · Un comprador con crédito Infonavit preautorizado quiere un inmueble publicado.** | El prospecto llega con el inmueble de interés (sitio o alta manual) y su perfil guarda forma de pago, tipo y estado del crédito; «Inmuebles que le pueden servir» y los avisos a compradores funcionan; «Agendar visita» liga prospecto, inmueble y operación, y la operación del propietario muestra «Próximas visitas»; la oferta se registra con el formato 14 y el que firma se elige como contraparte en Ajustes (RP-93). | El formato 14 escribe al interesado por nombre y folio, no ligado al prospecto: su ficha no dice «ofertó por X». Los estados del prospecto (Nuevo, Contactado, En evaluación, Activo, Cerrado) no reflejan visitó, ofertó, en crédito. No hay lista de documentos del comprador por forma de pago (B-06, pendiente en COR-06) ni paso «comprobar precalificación». | COR-18, COR-06 (documentos del comprador según B-06). |
| **E · Un prospecto llega por el formulario del sitio web.** | `POST /api/public/leads` crea el prospecto con estado «Nuevo» y origen «contacto» o «interés en inmueble», sin asesor, si la variable `FORTIUS_INMUEBLES_PUBLIC_LEADS_ENABLED` está encendida (PUB-01 parcial). Aparece en Contactos con el filtro «Nuevos». | Hoy no lo muestra: «Esperan algo de ti» solo lee la fecha de próximo contacto, y un prospecto del sitio no la tiene; puede pasar días sin que nadie lo vea. No se asigna a nadie, no avisa y no mide el tiempo sin respuesta (RP-23). No se comprobó si la variable está encendida en producción. | COR-21 (prospecto nuevo sin atender en Hoy, asignación y tiempo de espera), CRM-02. |
| **F · Un prospecto no contesta o se pierde.** | Estados como fila de botones: Nuevo, Contactado, En evaluación, Activo, Cerrado, Descartado. | Descartar no pide motivo; no existen los motivos de RP-97 (no contesta, precio fuera de mercado, no acepta las condiciones, se fue con otra inmobiliaria, documentación inviable, desistió, otro); «No contesta» no vuelve a los 30 días; no hay registro de intentos de contacto. El reporte de por qué no se capta no puede salir. | COR-14 (motivos de descarte como lista fija, ya anotado) y COR-18 (intentos de contacto y reintento programado). |
| **G · Un inmueble se vende.** | La operación cierra por pasos (firma y pago con 15 y 18, entrega con 16, postventa y registro con 17, honorarios con 18, archivo). El estado «Vendida» del inmueble se cambia a mano en Editar inmueble; la ficha pública queda como vendida (SoldOut), sale de «parecidos» y de destacadas. | Cerrar la operación no marca el inmueble como vendido ni lo retira: son dos pasos en dos lugares y se olvida. No se registra quién captó y quién vendió ni el reparto 25 % / 25 % de RP-99; el recibo 18 existe pero no hay vista de cobrado contra estimado. | COR-22 (cierre que marca el inmueble y registra captó/vendió), FIN-02 (cobrado contra estimado, pendiente). |

**Qué dejan en claro los casos:** el sistema cubre bien el camino principal del propietario (entrevista → levantamiento → documentos → dictamen → valor → contrato → publicación) y la captura del interesado; lo que no cubre son las salidas de ese camino: la excepción autorizada, la demanda que busca inventario, el respaldo externo (avalúo, documento del cliente), el prospecto que llega solo y el cierre que debe tocar dos registros.

**Correcciones de los casos (02/11/2026):**

| ID | Falla | Corrección | Aceptación |
|---|---|---|---|
| COR-17 | Un avalúo del propietario no tiene dónde registrarse: el requisito «Opinión de valor» solo admite respaldo externo escrito, la pantalla sigue pidiendo el 07 y el valor no llega al 08 ni al margen de precio. | En la etapa «Opinión de valor y precio», opción «El propietario trae avalúo»: adjunta el archivo al repositorio de documentos del cliente, registra perito, fecha, valor y vigencia, y deja el requisito revisado con ese respaldo; el 08 toma ese valor; la etapa deja de pedir el 07; el margen de ±10 % (cuando exista) compara contra él; aviso de que el crédito del comprador pedirá su propio avalúo. El respaldo de cualquier requisito admite un documento del cliente, no solo un formato o un texto. | Prueba: operación con avalúo adjunto y sin 07 llega a Contrato; el 08 muestra el valor del avalúo con su fuente; un avalúo vencido vuelve a pedir valor. **En local el 12/11/2026 (migración `20261112130000_avaluo_del_propietario.sql` autorizada por el titular ese día; se aplica al integrar en `main`):** la guía guarda `avaluo` (archivo de los documentos del cliente de la misma operación, perito, fecha, valor y vigencia; el servidor anota quién y cuándo). La tarjeta «Avalúo del propietario» aparece en «Opinión de valor y precio» de la venta: «El propietario trae avalúo» lo registra y deja «Opinión de valor» revisada con ese archivo; el 07 pasa a «No hace falta» y no queda como pendiente de la etapa. Al crear el 08 sin opinión terminada, toma el valor, la fecha y la fuente del avalúo vigente. Vencido, el requisito deja de contar (en la pantalla y en el servidor, al avanzar y al publicar) y la fila lo explica. El respaldo de cualquier otro requisito admite «Un documento del cliente» (tipo `cliente`, validado contra la misma operación). Aviso en la tarjeta: el crédito del comprador pedirá su propio avalúo. Pendiente: el margen de ±10 % (RP-96) no existe; cuando se construya debe comparar contra el avalúo. Discrepancia con la plantilla del 08: sus etiquetas dicen «opinión de valor 07»; con avalúo, la referencia dice «Avalúo del propietario · perito · archivo». |
| COR-18 | El interesado (comprador o arrendatario) no tiene acciones ni historia propias: «Preparar operación» en guinda, estados como botones sin significado comercial, oferta 14 sin liga al prospecto, sin registro de intentos de contacto. | Ficha del interesado (dentro de SIM-07) con una acción principal («Enviarle opciones» o «Registrar contacto»), registro en dos toques (Llamé · No contestó · Mandé WhatsApp · Visitó, RP-21) que pide el siguiente paso con fecha, línea de tiempo con visitas, ofertas y crédito, oferta 14 ligada por identificador al prospecto, «No contesta» con reintento programado a 30 días (RP-97). «Preparar operación» solo para quien vende u ofrece en renta. | Prueba: un interesado registra tres intentos y una visita; su ficha y la operación del propietario muestran la misma visita y la misma oferta; «Preparar operación» no aparece para quien compra o renta. **En local el 12/11/2026 (sin migración):** en la ficha del prospecto, la tarjeta Seguimiento tiene «Registrar contacto» con cuatro opciones (Llamé · No contestó · Mandé WhatsApp · Visitó); al elegir una se proponen el siguiente paso y su fecha (se pueden cambiar) y una nota opcional, y se guarda con un toque más. Se guarda como nota del prospecto marcada con el tipo de contacto: sale en la línea de tiempo como «Contacto», pone la primera atención si faltaba (sale de «Nuevos sin atender», COR-21), pasa «Nuevo» a «En seguimiento» y deja el siguiente paso con su texto en la ficha, Contactos y Hoy. Al tercer «No contestó» seguido propone «Reintentar: no contesta» a 30 días (RP-97). «Visitó» deja la visita en la agenda con el inmueble, así la ven la ficha y la operación del propietario. Para quien compra, renta o invierte la acción principal es «Registrar contacto» y ya no aparece «Abrir operación» (solo para quien vende o da en renta, y para el prospecto ya convertido). Pendiente: ligar cada oferta 14 al interesado por identificador (los formatos solo guardan los campos impresos; necesita decidir dónde se guarda el vínculo) y mostrar en su ficha el crédito y las ofertas. |
| COR-19 | Nada conecta la demanda con la captación: no se ve qué buscan los prospectos sin inventario, y desde un prospecto no se puede abrir la búsqueda de un inmueble. | Vista «Buscan y no tenemos» (en Inmuebles o Reportes): interesados activos agrupados por operación, tipo y zona sin coincidencias, con cuántos son y su presupuesto. Desde ahí y desde el prospecto, «Captar inmueble para este perfil» abre Nueva operación del propietario con la zona y el tipo ya puestos y liga la operación nueva a los interesados que la originaron; mientras no se firme, el inmueble queda «En evaluación» y no se ofrece (RP-91, salvo lo que decida DEC-41). La coincidencia por zona usa el catálogo de colonias (`codigos-postales`) además del texto, y compara presupuestos en monedas distintas con el tipo de cambio de Configuración. | Prueba: tres interesados en una colonia sin inmuebles aparecen agrupados; la operación creada desde ahí muestra «3 interesados esperan»; «Lomas Virreyes» coincide con «Lomas de Virreyes». **En local el 12/11/2026 (sin migración):** Inmuebles tiene «Buscan y no tenemos» junto a «Les falta algo»: interesados activos (prospectos y clientes que compran, rentan o invierten) sin ningún inmueble publicado y disponible que les sirva, agrupados por operación, tipo y zona, con cuántos son, sus nombres y el presupuesto por moneda (de … a …). Cada grupo, y la ficha del interesado cuando no hay inmuebles que le sirvan, tiene «Captar inmueble para este perfil», que abre Nueva operación del propietario (vender o arrendar) con la zona y el tipo ya puestos en el primer contacto. «N interesados esperan un inmueble así» se calcula al momento con la zona y el tipo, en el primer contacto y en la operación mientras el inmueble está «En evaluación» y sin publicar; no se guarda el vínculo. La zona se compara sin acentos, signos ni «de», «del», «la», «las», «los», «el»: «Lomas Virreyes» es «Lomas de Virreyes». El inmueble sigue sin ofrecerse hasta la firma (RP-91). Pendiente: el catálogo de colonias (`codigos-postales-bc.json` no está en el repositorio) y comparar presupuestos en monedas distintas con un tipo de cambio en Configuración, que no existe; hoy cada moneda se muestra aparte. |
| COR-20 | RP-31 (solo el director autoriza avanzar sin un requisito, con motivo escrito y constancia en el historial) no existe en el sistema: o se cumplen todos los requisitos o se inventan revisiones. | «Autorizar excepción» en el requisito, solo para el director (SEG-01; mientras no haya roles, cualquier administrador): motivo obligatorio, fecha y quién; el requisito cuenta como cubierto por excepción, con chip «Con excepción autorizada» en la operación, Operaciones y Hoy, y constancia en el historial. Nunca aplica a los requisitos protegidos de RP-96 (quién es dueño y quién firma, opinión jurídica y comercial antes de la intermediación, firma acreditada, pagos para entregar). | Prueba: una excepción con motivo deja avanzar y queda en el historial; un requisito protegido no ofrece la opción; el servidor rechaza la excepción sin motivo o sin permiso. |
| COR-21 | Un prospecto del sitio web no aparece en Hoy, no se asigna y nadie mide cuánto lleva sin respuesta. | Hoy muestra «Nuevos sin atender» con el tiempo desde que llegó (RP-23, umbral en Configuración); se asigna al asesor del inmueble de interés o, si no hay, al director; «Registrar contacto» (COR-18) lo saca de la lista. Verificar en producción que la recepción de solicitudes esté encendida. | Prueba: un prospecto creado por la API pública aparece en Hoy del asesor correspondiente con «Lleva 2 h sin respuesta»; al registrar el contacto desaparece. **Construido en parte el 02/11/2026; en `main` (PR #66):** Hoy muestra «Nuevos sin atender» con el reloj de primera atención (2 h fijas) con a quién le toca. **Asignación hecha en local el 12/11/2026 (sin commit):** la migración `20261112150000_prospecto_al_asesor_del_inmueble.sql` hace que la captura pública guarde como asesor al del inmueble de interés, si está activo; sin inmueble o sin asesor activo queda sin asesor y le toca al director. El formulario no puede elegir asesor. Prueba en `tests/backend/database.test.ts`. Se aplica al integrar en `main`; los prospectos ya guardados no cambian. **Terminado en local el 12/11/2026 (sin commit):** el plazo de primera atención se ajusta en Configuración («Prospectos del sitio», 1 a 72 h; 2 h si no hay uno; no se publica en el sitio) y cada prospecto nuevo en Hoy tiene «Registrar contacto»: en dos toques (Llamé · No contestó · Mandé WhatsApp) lo guarda con el registro de COR-18 (nota de contacto, primera atención, «Contactado» y siguiente paso sugerido), lo saca de la lista y aparece en su línea de tiempo; si otra persona lo cambió, avisa en lugar de pisarlo. **Comprobado el 02/11/2026, solo lectura:** en producción la recepción de solicitudes está apagada (responde 503); los formularios del sitio no crean prospectos hasta encender `FORTIUS_INMUEBLES_PUBLIC_LEADS_ENABLED`. |
| COR-22 | Cerrar una operación no toca el inmueble ni registra quién captó y quién vendió. | Al archivar la operación (y al registrar la firma y el pago), proponer «Marcar el inmueble como vendido o rentado» con la opción de retirarlo del sitio o dejarlo visible como vendido; la operación guarda asesor que captó y asesor que vendió y calcula el reparto de RP-99 (25 % y 25 %, o 50 % si es el mismo), rotulado como estimación hasta que se cobre (FIN-02). | Prueba: al archivar, el inmueble queda «Vendida» y la ficha pública lo dice; el reparto aparece en la operación y en Reportes como estimación. **En local el 12/11/2026 (migración `20261112140000_cierre_capto_vendio.sql` autorizada por el titular ese día; se aplica al integrar en `main`):** la guía guarda `cierre` (asesor que captó, asesor que vendió y la comisión estimada del contrato de intermediación con su versión; el servidor comprueba que los asesores existan y anota quién y cuándo). En «Cierre y entrega», la tarjeta «Cierre de la operación» muestra el reparto de RP-99 (25 % y 25 %, o 50 % si es el mismo asesor) rotulado como estimado, y propone «Marcar el inmueble como vendido» (o rentado) dejándolo en el sitio como vendido o retirándolo. Archivar la venta o la renta del propietario pide ese registro (pantalla y servidor). Un inmueble marcado «Vendida» o «Rentada» ya no se retira solo del sitio al pasar a entrega, postventa o archivo; con la operación en cierre o después se puede volver a mostrar como vendido, nunca como disponible. Reportes, «Por asesor», agrega «Cierres · reparto estimado». Pendiente: lo cobrado contra lo estimado (FIN-02); el reparto con aliados externos sigue en «Comisiones y reparto». |

### G. Operación diaria, papeles del equipo y herramientas (02/11/2026)

**Encargo del titular:** pensar la jornada real del asesor (cuándo usa Hoy, la agenda, el calendario, las tareas y las notas), el papel del director frente al asesor que llega con su propio inventario, y si las 17 herramientas sirven o estorban, probándolas con casos. Comprobado con datos simulados en el navegador y en el código y las reglas de la base (RLS).

#### G1. La jornada del asesor y qué pantalla toca en cada momento

| Momento | Qué usa hoy | Qué falla |
|---|---|---|
| Arranca el día | Hoy: «Lo siguiente», vencidas, agenda del día, «Esperan algo de ti», entrevistas por terminar, contratos y licencias por vencer, llaves, compradores por avisar. | Lo mismo aparece hasta tres veces (C34). Un prospecto nuevo del sitio no sale (COR-21). |
| Llama o le llaman | Nueva operación, «Nuevo prospecto» o la ficha de la persona; el contacto se anota como nota libre o cambiando el estado a «Contactado». | No hay «Llamé · No contestó · Mandé WhatsApp» en dos toques (RP-21, COR-18). El resultado de una llamada no deja siguiente paso con fecha salvo que el asesor lo escriba en el perfil. |
| Agenda una visita o una firma | Agenda (semana con horas) o «Agendar visita» desde «+ Nuevo», la ficha de la persona o la operación; la cita liga persona, inmueble y operación, y la operación muestra «Próximas visitas». | Una cita no registra su resultado: no hay «se hizo», «no se presentó», «qué dijo»; el registro de visitas (13) es un formato aparte que se llena a mano. Sin recordatorio ni aviso antes de la cita; sin exportar al calendario del teléfono. |
| Ve su semana | Agenda: cuadrícula semanal con citas, «Tareas que vencen» y «Seguimientos previstos». | Tres fuentes mezcladas con nombres distintos; la lista del día repite la cuadrícula (C43). |
| Anota un pendiente | Tareas (con categoría, prioridad, fecha, pasos) desde Hoy, Agenda, la operación o la persona; el sistema crea solas la tarea «Terminar la entrevista» y la del checklist. | Cuatro mecanismos de «qué sigue» conviven: tareas, citas, «próximo contacto» del perfil de la persona y «siguiente acción» de la decisión del encargo; Hoy los mezcla, pero el asesor no sabe cuál usar. No se completa desde la lista (C44). |
| Quiere dejar constancia | Notas: tablero de tarjetas del equipo (título y texto) sin liga a nada, en Herramientas; además notas dentro de la ficha del prospecto. | No existen notas en el inmueble ni en la operación (RP-99 las pide con menciones que avisen en «Para ti»). El tablero suelto no se encuentra ni se busca; nadie sabe si es para avisos del equipo o para apuntes personales. |
| Cierra el día | Nada. | No hay cierre: lo que no se registró se pierde; no hay resumen «hoy hiciste» ni «mañana toca». |

**Regla propuesta (DEC-42):** una sola idea de «siguiente paso» por persona y por operación, siempre con fecha, respaldada por una tarea; las citas son solo compromisos con hora; el «próximo contacto» del perfil y la «siguiente acción» de la decisión se vuelven esa misma tarea. Las notas viven pegadas a lo que describen (persona, inmueble, operación) como panel lateral (RP-99); el tablero suelto se retira y, si el director quiere avisos al equipo, son una sección «Avisos» en Hoy que solo él escribe.

#### G2. Director y asesor: lo que el sistema distingue hoy

Hay dos roles: `admin` y `editor`. Lo comprobado en el código y en las reglas de la base:

- **El administrador** ve todo; solo él entra a Historial, Reportes, Equipo (cuentas), Control comercial y la muestra de componentes; puede borrar operaciones ajenas y asignar citas a otro asesor.
- **El asesor (`editor`)** ve solo sus prospectos y clientes (y las citas, tareas y notas ligadas a ellos), pero **ve y edita todos los inmuebles**, incluido cambiar el asesor responsable, y **edita Configuración** (nombre comercial, teléfono, WhatsApp, redes, video), **Sitio web** (textos de inicio, preguntas, testimonios) y **Blog**: ninguna de esas pantallas ni su escritura en el servidor pide ser administrador.
- Cualquier usuario marca «Revisado» en cualquier requisito y registra la decisión del encargo: no existe el «director revisa» de la matriz MRP-01.
- Publicar un inmueble solo se frena en el navegador (COR-16).

| ID | Falla | Corrección | Aceptación |
|---|---|---|---|
| COR-23 | El asesor edita configuración, sitio web, blog y cualquier inmueble (incluido reasignarlo), y marca revisado lo que corresponde al director; el servidor no distingue. | Antes de SEG-01, con los dos roles actuales: Configuración, Sitio web, Blog, Equipo y reasignar el asesor de un inmueble solo para `admin`, en pantalla y en el servidor (`parseRecord` o el RPC de escritura); un inmueble lo edita su asesor responsable o el administrador, los demás lo ven con los datos públicos (RP-99); las revisiones de dictamen, precio, decisión del encargo, firma de contratos y autorización de publicación las marca solo el administrador (MRP-01, «quién revisa»); el asesor las deja en «Lo tengo». | Prueba de backend: un `editor` recibe 403 al escribir config, contenido, posts o un inmueble ajeno, y al marcar «revisado» un requisito reservado; el administrador sí. Las pantallas no muestran lo que no se puede hacer. |
| COR-24 | Un asesor que llega con su inventario (inmuebles con contrato ya firmado con él) no tiene forma de meterlo: cada inmueble exigiría entrevista, levantamiento, dictamen, valor y plan antes de publicarse, o inventar revisiones. | «Alta de inventario heredado», solo para el administrador: por cada inmueble pide propietario, contrato vigente adjunto con su vencimiento, precio y fotos; crea la operación en «Publicación y seguimiento» con los requisitos cubiertos por excepción del director (COR-20) y el chip «Inventario heredado · por regularizar» que lista lo que falta (dictamen, valor) para completarlo después; registra al asesor como captador (RP-99). Se apoya en DAT-01 (migración asistida) para cargas grandes. | Prueba: un inmueble heredado se publica con contrato adjunto y chip visible; sin contrato no se publica; la operación muestra qué falta regularizar; Reportes lo distingue de lo captado por el proceso. |

**Decidida por el titular (DEC-43, 12/11/2026):** el asesor ve de los inmuebles ajenos solo los datos públicos; edita el inmueble solo su asesor o el director, y publicar lo autoriza siempre el director. Construida en COR-23.

#### G3. Las 17 herramientas, probadas con casos

Las 17 abren sin error con datos simulados (solo «Enlaces y QR» cayó por un dato que la simulación no entregaba; el componente debe tolerar la lista vacía). Todas guardan «trabajos» con versión, exportan PDF o CSV y pueden ligarse a una operación. El catálogo depurado que el titular aprobó el 18/10/2026 (HER-01) sigue siendo correcto; los casos lo confirman y agregan una cosa: **la herramienta debe abrirse desde donde están los datos**, no desde un catálogo.

| Caso | Herramienta | Veredicto |
|---|---|---|
| El propietario pregunta por teléfono cuánto le queda si vende en X. | Neto del propietario → **ISR y neto** (HER-03) | **Se queda.** Hoy pide los impuestos a mano; con HER-03 contesta en la llamada. Debe abrirse también desde la operación, en la etapa de precio, con el precio ya puesto. |
| Un comprador pregunta cuánto pagaría al mes. | Hipoteca | **Se queda.** Debe abrirse desde la ficha del inmueble con su precio y desde el prospecto con su presupuesto. |
| Hay que fijar precio de salida. | Comparables | **Se queda, pero no aparte:** es el mismo cálculo del 07. Comparables suelto debe ser el 07 sin operación (HER-02), no un segundo motor. |
| Llegaron dos ofertas por la misma casa. | Comparador de ofertas | **Se queda,** y la operación debe ofrecerlo en «Visitas y ofertas» leyendo las ofertas del 14, sin recapturar. |
| Hay que repartir la comisión con un aliado o entre dos asesores. | Comisiones y reparto | **Se queda** para aliados y casos sueltos; el reparto de la propia operación lo calcula el cierre (COR-22), no una herramienta. |
| Un inversionista pide números. | Inversiones · Rehabilitación | **Se quedan.** Son las únicas que cubren inversión y flipping; conectadas entre sí. |
| Fotos del celular con mala luz para publicar. | Fotografías | **Se queda,** pero debe abrirse desde la galería del inmueble y devolver las fotos ahí. |
| Escaneos sueltos que hay que unir en un PDF. | Plantillas y PDF | **Se queda solo como «Unir y separar PDF»** (HER-01). |
| Un cliente pregunta en dólares o pies cuadrados. | Unidades y monedas | **Se queda.** Pequeña y útil en Tijuana. |
| Un cliente quiere una propuesta de honorarios antes de firmar. | Cotizador de servicios | **Se queda.** |
| Un cliente pide solo el machote o una opinión de valor. | Documentos sin expediente → Documentos sueltos | **Se queda y crece** (HER-02). |
| Compartir una ficha o un documento. | Ficha comercial · Enlaces y QR | **Salen:** pasan al menú del inmueble (HER-01). |
| Informar al propietario cada mes. | Informe al propietario | **Sale:** vive en la operación (ya está ahí desde COR-08). |
| Ver qué documentos faltan o vencen. | Pendientes documentales | **Sale:** es una vista de trabajo (DOC-13, NAV-08). |
| Comparar dos versiones de un contrato. | Comparador de versiones | **Sale.** |

**Qué estorba de verdad:** no las herramientas, sino el catálogo (buscador, filtros, contador y estrellas, C45) y que cada herramienta viva aislada: abrirla obliga a volver a escribir el precio, el nombre y el inmueble que el sistema ya sabe (contradice RP-75). Diez herramientas con punto de entrada en contexto valen más que diecisiete en un catálogo.

| ID | Alcance | Depende de | Aceptación |
|---|---|---|---|
| HER-05 | Puntos de entrada en contexto: Hipoteca desde el inmueble y el prospecto; ISR y neto desde la etapa de precio; Comparador de ofertas desde «Visitas y ofertas» con las ofertas del 14; Fotografías desde la galería del inmueble; Comparables como 07 suelto. Los trabajos guardados se ven en la operación o el inmueble donde se hicieron. Contador de uso por herramienta en Reportes para decidir después qué más se retira. | HER-01, HER-03 | Cada punto de entrada abre la herramienta con los datos puestos; el trabajo guardado aparece en la operación o inmueble; Reportes muestra usos por herramienta y mes. |

### H. Cuánto cuesta cargar una operación y qué la hace lenta (02/11/2026)

**Encargo del titular:** que el sistema sea una herramienta de productividad y no algo que quite tiempo; que un asesor nuevo sepa rápido cómo cargar sus operaciones. El agente contó lo que el sistema pide de la llamada a la publicación, lo probó en celular y buscó la carga inicial.

**Lo que se captura para publicar un inmueble por el proceso completo** (contado en el código el 02/11/2026; celdas de captura, no todas obligatorias):

| Paso | Celdas | Observación |
|---|---|---|
| Llamada («Datos del prospecto») | 12 | Un minuto; funciona. |
| 02 Entrevista inicial | 30 | Bien acotada desde el 17/10. |
| 04 Levantamiento | 52 (04A) a 125 según el tipo | En celular es una hoja carta escalada: se pulsa cada celda sobre la hoja con «Ajustar al ancho»; en sitio, con sol y una mano, es lento. |
| Checklist de documentos | 12 a 15 documentos | Cada uno se marca al recibirlo; «No aplica» (COR-06) sigue pendiente. |
| 05 Revisión jurídica | 64 renglones fijos por 2 a 4 columnas, más tablas libres | Más de 150 celdas; es trabajo del abogado, no del asesor, pero vive en la misma ventana. |
| 06 Opinión jurídica · 07 Opinión de valor · 08 Neto | 06 varias secciones · 87 · 13 | El 07 repite recámaras, niveles y superficies que ya están en el inmueble y en el 04. |
| 09 Intermediación · 10 Plan | 76 · 5 | El 09 es el contrato: pesado por naturaleza. |
| Inmueble (Editar) | 54 entradas en 7 secciones; 3 200 px en celular | Repite recámaras, baños, estacionamientos y superficies del 04; su encabezado fijo («Editor listo», copia temporal, vista previa, «Ir a sección…», tres botones) ocupa media pantalla del teléfono. |

**Total:** alrededor de 500 celdas, unos 15 documentos por recibir y 10 PDF por generar antes de que un inmueble aparezca en el sitio. La regla RP-82 deja avanzar con datos faltantes, pero la ventana cuenta todo lo que falta para el PDF con el mismo peso («Faltan 8 datos»), así que el asesor no sabe qué es indispensable hoy y qué puede esperar. CSR-01 a CSR-08 (construidos el 31/10/2026 y en `main`, PR #63; sin revisar por el titular) quitan parte de la repetición; la lectura de documentos (IA-01) quitará otra parte cuando el titular la active.

**Qué la hace lenta, por orden de impacto:**

1. **Todo pesa igual.** No hay distinción entre «lo mínimo para seguir» y «lo completo para el PDF». F17 («dato indispensable») está en el plan, pero no en pantalla.
2. **El levantamiento no está hecho para el teléfono.** La captura sobre el documento (DEC-31) es correcta en escritorio; en sitio hace falta una captura por lista que llene las mismas celdas.
3. **El inmueble se captura dos veces.** El 04 y Editar inmueble piden los mismos datos físicos; la ficha pública debería nacer del 04 (CSR-02) y el formulario del inmueble quedar para lo comercial (precio, descripción, fotos, publicación).
4. **No hay carga inicial.** Un equipo que llega con inventario y operaciones en curso tiene que capturarlas una por una desde la llamada. DAT-01 (validador de importación) está pendiente y no tiene pantalla; COR-24 cubre el inventario heredado por inmueble, no por lote.
5. **Nadie enseña el sistema.** El manual tiene corte del 12/10/2026 y el del panel del 17/10, antes del panel versión 2 y de la captura sobre el documento; no hay guía de primer día para el asesor ni ayuda por pantalla; el único apoyo es «¿Qué significa cada estado?».
6. **No se mide.** No hay forma de saber cuánto tarda una operación por etapa ni cuánto tiempo pasa el asesor capturando.

| ID | Alcance | Depende de | Aceptación |
|---|---|---|---|
| COR-25 | **Carga inicial por lote** (pantalla de DAT-01, solo administrador): plantilla de Excel con inmuebles, propietarios, contratos vigentes y, opcionalmente, operaciones en curso con su etapa; el sistema simula, muestra duplicados, referencias ambiguas y errores sin escribir nada, y crea el lote cuando el administrador lo aprueba; cada inmueble queda como inventario heredado (COR-24) con lo que falta por regularizar. | DAT-01, COR-24 | Un lote de 30 inmuebles con 30 propietarios se carga en una sesión; la simulación detecta un teléfono repetido y una fecha inválida; el lote se puede revertir si nadie lo ha tocado. |
| COR-26 | **Enseñar dentro del sistema:** tarjeta «Tu primer día» en Hoy para quien no tiene datos (tres pasos: registra una llamada, agenda la entrevista, abre tu primera operación), enlace «¿Cómo se hace esto?» en cada pantalla hacia la sección del manual, y manual regenerado tras LV-08 y CSR con capturas actuales. **Guía de cada pantalla (titular, 02/11/2026): hecha ese día; en `main` (PR #66).** Botón «Ayuda» en la barra (y en el menú del celular) y tecla «?»: oscurece la pantalla, resalta el elemento del paso y dice qué hacer ahí, con Siguiente, Anterior, Omitir y cerrar; flechas, Enter y Escape; se abre sola la primera vez en cada pantalla y después cuando se pide. Pasos en `src/lib/admin/tour.ts` (Hoy, Operaciones, una operación, Nueva operación, Contactos, Inmuebles, Agenda y Herramientas); capa en `src/components/admin/workspace/tour.tsx`; elementos marcados con `data-tour`; prueba `tests/admin/tour-steps.test.ts`. Sin dependencias nuevas. **En local (12/11/2026):** tarjeta «Tu primer día» en Hoy para el asesor sin datos propios (`first-day.ts`/`first-day.tsx`; cada paso se marca al tener una persona, una cita y una operación suyas, y la tarjeta desaparece al cumplirlos); manual del asesor dentro del panel en `/admin/ayuda` («¿Cómo se hace esto?», `src/lib/admin/help.ts`, una sección por pantalla de la guía y otra solo para el director); cada paso de la guía enlaza a la sección de su pantalla. Se corrigió que un ancla en la dirección (`#hoy`) se tomara por enlace de acceso. Queda: el manual con capturas actuales (`docs/admin-manual.md`) y la prueba de uso. | SIM-12 | Un asesor nuevo con datos sintéticos registra una llamada y abre una operación sin ayuda en menos de cinco minutos (prueba de uso); el manual coincide con las pantallas. |
| USO-02 | **Prueba de uso cronometrada** con el director y dos asesores (amplía USO-01) con metas: llamada en menos de 1 minuto; entrevista 02 en la cita en menos de 10; levantamiento en sitio en menos de 30; inmueble listo para publicar en tres sesiones de trabajo. Lo que no cumpla la meta vuelve a este plan como corrección. | USO-01 | Tabla de tiempos por paso y persona; lista de correcciones derivadas, numeradas. |

**Pendiente del titular (DEC-44):** en celular, además de la captura sobre el documento (DEC-31), ofrecer «Captura por lista» para el levantamiento y la entrevista: las mismas celdas, una pregunta por pantalla, con «No sabe», cámara y dictado (CSR-08); lo capturado aparece en la hoja igual que ahora. **Construido en local el 12/11/2026** (rama `feat/seo-integral`, sin migración): en el celular, la ventana de la entrevista (02) y de cada levantamiento (04A a 04G) tiene «Captura por lista». Cada pregunta es una celda de la hoja, en su orden, empezando por lo vacío o faltante; «Siguiente» guarda lo escrito y «Anterior» regresa; «No sabe» lo anota solo donde la plantilla lo admite (su opción «No sabe» o «No verificado», o el texto en preguntas abiertas; nunca en cifras, fechas ni folio); se conservan «Dictar» y la cámara de las fotos, y la celda se ve arriba mientras se llena. Lógica en `src/lib/formatos/captura-lista.ts`, prueba `tests/admin/captura-lista.test.ts`. En escritorio no cambia nada.

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

## Seguimiento del inmueble y avisos (SIA) — construido el 29/10/2026, en `main` (PR #57)

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
- **DOC-06 (en local el 12/11/2026):** no hay plantilla del titular para el 06; el titular aprobó el diseño propuesto ese día, tomando como base la plantilla de la 05. El 06 lleva ocho secciones: conclusión con resultado (los cinco de la 05), objeto y alcance, antecedentes en tabla (acto, fecha, qué acredita), marco jurídico (leyes y artículos con fecha de consulta), análisis, condiciones por etapa (las seis etapas de la 05, con estado y condición en palabras para el cliente) y recomendaciones, documentos revisados (nombre y estado) y vigencia y límites. Al iniciarlo toma de la 05 solo el resultado, el estado de cada etapa y los documentos que aplican con su estado; nunca folios, escrituras, expedientes, acreedores ni notas internas. Los campos nuevos son opcionales, así que los borradores anteriores siguen válidos. Pendiente: que el abogado revise la redacción del marco jurídico y de las condiciones antes de entregar el primero a un cliente.
- **DOC-09:** el titular define qué hace falta para liberar el PDF del contrato 09; hoy sale solo en Word.
- **Formato 07:** diseño del cuerpo del PDF igual a la plantilla y fotografías dentro del Excel (portada, croquis y las ocho del reporte). Por confirmar con el titular si la captura sobre el documento (EXT-12) ya lo resolvió.
- **Ayuda en otros formatos:** las notas y desplegables existen solo en el 07 (`src/lib/formatos/ayuda.ts`); extenderlas al 04, 05 y los demás, con la plantilla como fuente.

## Regla de actualización en cada publicación

Por instrucción de Moisés del 13/10/2026, este plan debe actualizarse con cada entrega a GitHub y cada despliegue. Registrar fecha local, alcance real, PR, commit funcional, migraciones aplicadas, comprobaciones y límites, enlace y estado del despliegue. Distinguir preparación, publicación comprobada y pendientes; no marcar publicado por haber hecho push. Los commits que solo actualizan este registro no requieren reconstruir un producto cuyo código permanece idéntico. Actualizar también las tareas realizadas y pendientes del mismo plan.

Los registros de cada publicación anteriores al 11/11/2026 están en [`docs/erp-crm/historial-del-plan.md`](docs/erp-crm/historial-del-plan.md). Los nuevos se anotan en «Dónde nos quedamos» y, al cerrar la entrega, se pasan al historial.

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
| DEC-27 | Nombres sencillos de los requisitos (RP-86) | **Decidido por el titular el 12/11/2026:** «Firma acreditada», «Pagos para entregar cumplidos según contrato» y «Aviso y controles de privacidad revisados»; en la renta se conservan «Contrato de arrendamiento firmado» y «Depósito y primera renta recibidos». Aplicado en COR-07. |
| DEC-28 | Detalles de prospecto y cliente (RP-90 a RP-92) | **Decidida el 17/10/2026:** el titular respondió los grupos A y B de [`docs/erp-crm/CUESTIONARIO_TITULAR.md`](docs/erp-crm/CUESTIONARIO_TITULAR.md); quedan en RP-90 a RP-98. Pendiente solo agregar al catálogo el contrato de intermediación para renta (RP-97). |
| DEC-29 | Formas de pago, tipos de inmueble y municipios (B-06, B-07) | El titular manda la lista de pasos y documentos de cada forma de pago y de cada tipo de inmueble y municipio; el agente la ordena en una tabla para su aprobación. Alimenta MRP-01 y MOT-02. |
| DEC-30 | Validez jurídica de la firma electrónica propia (FIR-01) | El abogado de Fortius confirma para qué contratos sirve en Baja California y qué evidencia debe guardarse, antes de usarla con clientes. Mientras, se firma en papel y se sube el archivo (RP-97). |
| DEC-34 | Plan de comercialización 10 | **Decidida el 29/10/2026:** el 10 sigue la plantilla del 26/10/2026 (`04_Metodologia/02_Comercializacion/10_PlanComercializacion.docx`), un formulario con casillas que reemplaza el plan en prosa anterior. Cambios aprobados: el tipo de inmueble usa los siete tipos de DEC-32 en lugar de las cuatro casillas del Word; el panel calcula el precio promedio por m² construido de los comparables y el precio técnico (promedio por la construcción del inmueble); «Baños (completos / medios)» son dos datos; al crearlo se proponen superficies, recámaras, baños, clave catastral, folio real, valor del 07 y datos del contrato 09. Se quitaron los apartados en prosa que el Word ya no trae (estrategia, plazas o conjuntos, aprobación con acuse). Código en `src/lib/formatos/plan.ts` y `src/lib/formatos/documento/plan.ts`. |
| DEC-47 | Guía de pantalla: ¿se abre sola en las ocho pantallas la primera vez (como hoy) o solo en Hoy, y en las demás con el botón «?»? | **Propuesta del agente (11/11/2026, C47–C60):** solo Hoy la abre sola; en las demás, el botón «Ayuda» late la primera vez (V07) y la guía se abre a petición. **Decidida por el titular (12/11/2026, confirmada ese día al juntar las ramas):** la propuesta. Solo Hoy abre su guía sola la primera vez; en las demás pantallas, con el botón «Ayuda» o la tecla «?», y un punto sobre «Ayuda» mientras no se haya visto. Reemplaza la anotación anterior de que nunca se abría sola. |
| DEC-46 | Estados visibles del prospecto | **Decidida el 11/11/2026:** tres etapas visibles (Nuevo, En seguimiento, Descartado) y «Cliente» aparte. La base conserva los seis estados: Contactado, En evaluación y Activo se muestran como «En seguimiento»; «Cerrado», estado anterior, se muestra en quien ya lo tenía pero no se puede elegir, y en la lista va con los descartados. Construida con SIM-07 (`src/lib/admin/person-view.ts`). |
| DEC-45 | Nombre del asistente único para una persona que llama: «Atender a alguien», «Nueva llamada» u otro; hoy se llama «Nueva operación» aunque tres de sus cinco salidas no abren operación | **Propuesta del agente (11/11/2026, C48):** «Atender a alguien», con «Nueva operación» como primera opción del menú «+ Nuevo» que lo abre ya en «Vender». Pendiente del titular. **Decidida por el titular (12/11/2026): «Atender a alguien».** Aplicada en local: en el menú va primero «Atender a alguien» y después «Nueva operación»; cambiar el nombre es cambiar una constante. |
| DEC-44 | En celular, «Captura por lista» para el levantamiento y la entrevista además de la captura sobre el documento (DEC-31) | **Propuesta del agente (02/11/2026)** tras probar el 04A a 390 px: las mismas celdas, una pregunta por pantalla, con «No sabe», cámara y dictado; lo capturado aparece en la hoja. **Decidida el 12/11/2026:** se agrega en celular la captura por lista, una pregunta por pantalla con «No sabe», cámara y dictado, sobre las mismas celdas; el documento en vivo se conserva (fase 4). |
| DEC-43 | Alcance del asesor sobre inmuebles ajenos: ¿los ve con todos sus datos (como hoy) o solo con los públicos (RP-99)? ¿Puede publicar él mismo o solo el director? | **Decidida el 12/11/2026:** el asesor ve de los inmuebles ajenos solo los datos públicos (fotos, precio, descripción), para poder ofrecerlos; edita el inmueble solo su asesor o el director; publicar lo autoriza siempre el director. Se construye en COR-23 (fase 2). |
| DEC-42 | Un solo «siguiente paso» por persona y por operación, respaldado por una tarea; citas solo con hora; notas pegadas a persona, inmueble u operación; retirar el tablero de notas sueltas | **Propuesta del agente (02/11/2026)** tras revisar la jornada del asesor (bloque G1). **Decidida por el titular (12/11/2026):** el siguiente paso es siempre una tarea con fecha, la misma en la ficha, Hoy y la Agenda; «Registrar contacto», la decisión del encargo y la entrevista la crean o la mueven (hoy «Registrar contacto» guarda `perfil.proximoContacto` y `proximaAccion`, no una tarea); al completarla se pide la siguiente; las citas, solo con hora; notas en inmueble y operación (E-01); el tablero suelto se retira y Hoy tiene «Avisos» que solo escribe el director. **Primera entrega en local (12/11/2026), sin integrar en `main` y sin migración:** el siguiente paso de cada persona es una tarea de seguimiento ligada a ella y sin operación (`src/lib/admin/next-step-task.ts`); «Registrar contacto» en la ficha y en Hoy la crea o la mueve; al completarla en Hoy, Tareas o su ficha se pregunta «¿Qué sigue con…?» y la respuesta queda como la nueva tarea; en cuanto una persona tiene esa tarea, el «próximo contacto» del perfil deja de mostrarse en Hoy, la Agenda, Contactos, Reportes y la ficha. **Segunda entrega en local (12/11/2026):** el alta de un interesado en «Nueva operación» también deja su próxima acción como tarea; «Editar ficha» ya no muestra ni cambia el próximo contacto del perfil; en una operación, completar su última tarea abierta (en Hoy, Tareas o la ficha de la tarea) pregunta «¿Qué sigue en la operación…?» y la respuesta queda como su «Próxima tarea». La entrevista y la decisión del encargo ya creaban tareas de la operación desde la base (migraciones `20261014180000` y `20261014215000`). **Tercera entrega en local (12/11/2026):** migración `supabase/migrations/20261112232000_resolution_moves_followup.sql` (autorizada por el titular el 12/11/2026; se aplica al integrar en `main`): cambiar la decisión del encargo mueve su tarea de seguimiento abierta (título, fecha y motivo) en lugar de crear otra; si la anterior ya se completó, crea una nueva; no cancela otras tareas. Probada en base local aislada. **Cuarta entrega en local (12/11/2026):** botón «Notas» en la ficha del inmueble y en «Más opciones» de la operación, que abre un panel lateral con sus notas (E-01; la de la operación lleva su cliente, así que solo la ve quien puede ver a ese cliente); el tablero «Notas del equipo» se retira (`/admin/notas` lleva a Hoy y sale de Herramientas; las notas que ya existían siguen en la base y en Historial); Hoy tiene «Avisos», que solo el director escribe o quita, con la regla también en la base: migración `supabase/migrations/20261112233000_avisos_solo_director.sql` (se aplica al integrar en `main`; probada en base local aislada). Con esto DEC-42 queda construida en local. |
| DEC-41 | Captación dirigida: cuando hay prospectos para una colonia sin inventario y se encuentra un inmueble, ¿se puede enseñar a ese prospecto antes de firmar la intermediación? RP-91 hoy lo prohíbe, también en privado | **Propuesta del agente (02/11/2026):** mantener RP-91 como regla y admitir una sola excepción: visita con un prospecto concreto a un inmueble «En evaluación», con carta breve de autorización de visita firmada por el propietario (texto que valida el abogado) y autorización del director con motivo (COR-20); sin publicar ni mandar fotos; la entrevista 02 puede hacerse por teléfono ese mismo día y el levantamiento y el dictamen correr en paralelo (MRP-01). **Decidida por el titular (12/11/2026):** la propuesta, como excepción a RP-91 (reescrita en su lugar). **Construida en local el 12/11/2026 (migración `20261112235000_visita_antes_de_la_firma.sql`, sin aplicar en la base):** en la operación de un inmueble «En evaluación» sin publicar, mientras la intermediación no esté revisada, la tarjeta «Visita antes de la firma» deja al director autorizar una visita con el interesado (sugiere los prospectos registrados), la carta de autorización de visita firmada por el propietario (archivo privado) y el motivo; la base exige al director y que la carta se haya subido, anota quién y cuándo, y solo el director la retira. La operación, Operaciones y Hoy muestran «Visita autorizada antes de la firma» hasta que se revisa la intermediación. El asesor la ve, pero no la autoriza. No publica ni abre el inmueble a otros prospectos. Pruebas: `tests/backend/visita-previa-database.test.ts` y `tests/admin/visita-previa.test.tsx`. El texto de la carta lo valida el abogado. |
| DEC-40 | Inmuebles compartidos por otra inmobiliaria (RP-95, PUB-02): qué debe decir la autorización escrita de la inmobiliaria, qué texto lleva la etiqueta pública («En colaboración con…») y si el aliado se registra como persona del panel | **Propuesta del agente (02/11/2026):** autorización con fecha, firmante e inmueble, que confirme que su contrato con el propietario permite compartirlo y publicarlo (texto que valida el abogado); etiqueta con el nombre de la inmobiliaria y fuente «Según <inmobiliaria>» en cada dato; aliado registrado una vez con porcentaje por omisión. **Decidida el 12/11/2026, con un cambio:** se publica con la autorización escrita como se propuso, pero la ficha pública no muestra el nombre de la otra inmobiliaria: dice «Inmueble en colaboración» y los datos que Fortius no verificó llevan «Según la inmobiliaria aliada». El aliado se registra en el panel con su porcentaje. Confirmado por el titular al juntar las ramas (12/11/2026); PUB-02 lo aplica: la base proyecta solo la marca de colaboración, nunca el nombre. |
| DEC-39 | Qué preguntar en la llamada y en la 02 cuando el inmueble tiene un problema (invadido u ocupado sin permiso, crédito en mora, herencia sin resolver, adeudos) y qué documentos pedir en cada caso | **Propuesta del agente (02/11/2026), por validar con el abogado:** en la llamada, una pregunta con opciones y detalle (CAP-05); en la 02, «Invadida u ocupada sin permiso» y, con crédito, «¿Está al corriente?» y «¿Sabe cuánto debe?» (CAP-06); con invasión, pedir la denuncia o demanda y mandar al abogado antes del levantamiento (COR-14). **Aprobada como base el 12/11/2026:** se construye (CAP-06) solo después de que el abogado valide las preguntas y la lista de documentos de cada caso. |
| DEC-38 | Pestaña «Ajustes» de la operación | **Decidida el 11/11/2026** al aprobar SIM-18: se retira. Sus acciones van en «Más opciones» del panel azul («Datos de la operación», «Corregir etapa» y «Eliminar operación»); los datos se abren en un panel lateral. |
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
| DOC-EXP P1/I | **Documentos del cliente (titular, 29/10/2026; entrega 1):** pestaña «Documentos del cliente» en cada operación, un solo repositorio sin categorías para todo lo que entrega el cliente (escritura, certificado de libertad de gravámenes, avalúo, CURP, identificación, poderes, predial, agua, actas). Varios archivos a la vez, desde la computadora o el celular (elegir o tomar foto); el nombre del archivo queda como título editable; papelera recuperable. Privados en `fortius-inmuebles-expedientes`, con SHA-256, quién y cuándo. | pestaña de la operación, tabla `fortius_inmuebles_expediente_archivos`, rutas `/api/admin/expedientes/[id]/archivos` y `/api/admin/archivos-cliente/[id]` | **Hecha; en `main` (PR #57). La migración viaja con `main`; su aplicación en la base remota no está comprobada en este registro** | Solo quien tiene acceso al expediente ve o descarga (prueba de RLS); la descarga comprueba el SHA-256; mandar a la papelera no borra. |
| DAT-EXP P1/I | **Datos del expediente (titular, 29/10/2026; entrega 2):** un diccionario único (`src/lib/formatos/datos-expediente.ts`) con cada dato del cliente y del inmueble y las claves que lo reciben en cada formato (propietario, apoderado, inmueble, escritura y registro, adeudos, avalúo). Panel «Datos del expediente» en la pestaña: cada dato con valor, estado («Por confirmar» o «Confirmado») y fuente; se confirma **una vez por expediente** (decisión del titular). Lo confirmado llena solo celdas vacías de los formatos existentes y de los nuevos; **lo escrito por una persona se respeta** (decisión del titular): la ventana del formato avisa «aquí dice X; el expediente tiene Y» con «Usar el del expediente». Nunca llena consentimientos, firmas, decisiones ni conclusiones jurídicas. | tabla `fortius_inmuebles_expediente_datos` (versión y 409), ruta `/api/admin/expedientes/[id]/datos`, ventana en vivo | **Hecha; en `main` (PR #57). La migración viaja con `main`; su aplicación en la base remota no está comprobada en este registro** | Confirmar un dato llena los formatos vacíos; un campo con otro valor no cambia y aparece el aviso; un conflicto de versión recarga sin pisar. |
| IA-01 P0/I | **La IA lee los documentos del cliente (titular, 17/10/2026, rehecho el 29/10/2026; entrega 3):** al subir un archivo, o con «Leer con IA», el servidor envía el PDF o la imagen a la API de Claude con una estructura fija de respuesta (los datos de DAT-EXP que encontró, con página, frase citada y confianza), validada con zod. Lo leído entra **por confirmar** con su fuente en «Datos del expediente»; nada llega a un formato sin confirmación. **Regla del titular (29/10/2026): en pantalla nada dice «propuesto» ni que algo fue propuesto o creado por la IA** (lo leído se muestra «Por confirmar», el botón es «Leer datos» y los errores hablan del «servicio de lectura»); una prueba del panel lo comprueba. Estado por archivo: pendiente, leyendo, leído o con error. La clave `ANTHROPIC_API_KEY` vive solo en el servidor. | Storage privado, DAT-EXP, ruta `/api/admin/archivos-cliente/[id]/leer`, migración `20261029140000_expediente_lecturas_ia.sql` | **Hecha; en `main` (PR #57 y #63), sin activar:** falta la clave de API del titular y el visto bueno del abogado antes de usarla con documentos reales; migración sin aplicar | Con respuestas simuladas, los datos salen con su fuente, una respuesta mal formada se rechaza y sin clave el resto funciona igual. |
| IA-02 P1/I | **Controles de la IA (entrega 4):** tope mensual de lecturas en «Ajustes» (al llegar, se pausa y avisa), registro de cada lectura (archivo, fecha, quién, costo aproximado), anotación del proveedor como encargado en `docs/erp-crm/privacy/data-processing-register.md` y en la política de acceso. **En `main`:** el tope (variable `IA_TOPE_MENSUAL_USD`, 20 USD si no se configura), el registro `fortius_inmuebles_ia_lecturas` y la anotación en el registro de tratamiento. **Falta:** cambiar el tope y ver el gasto del mes desde «Ajustes». | Ajustes, tabla de uso, documentación de privacidad | IA-01; 1d | Al llegar al tope no se lee más y se avisa; cada lectura queda registrada. |
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

**Revisada contra git el 11/11/2026.** Estados:

- **terminada:** en `main` y aceptada por el titular.
- **en_main:** construida, integrada en `main` con Verify aprobado; falta que el titular la revise y la dé por terminada, o comprobarla en producción.
- **en_local:** construida en la carpeta de trabajo, sin commit.
- **parcial:** una parte está en `main`; la columna dice qué falta.
- **en_revision** y **bloqueada:** se conservan para las entregas de continuidad (bloque 0), que esperan evidencia o accesos externos.
- **en_curso**, **pendiente** y **en_pausa:** como siempre.

Las migraciones de las entregas en `main` viajan con `main`; su aplicación en la base remota no se comprobó en esta revisión. La base solo tiene datos de prueba (DEC-10).

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
| SIM-01 | 4 | en_local | C01–C05, 12/11/2026; sin commit; las diez suites de navegador del panel de CI pasan (build sin base) |
| SIM-02 | 4 | en_main | PR #63: cuenta con menú, buscador único y «+ Nuevo» (C06, C08); falta distinguir el filtro de cada lista (C07) |
| SIM-03 | 4 | en_main | PR #63 y #66 (C09 a C11) |
| SIM-04 | 4 | parcial | C13 y C22 hechas; faltan los mismos nombres de fase en Reportes (C12); depende de SIM-01 |
| SIM-05 | 4 | parcial | SIM-01 |
| SIM-06 | 4 | parcial | C19 y C20 hechas; falta retirar la pestaña Ajustes (C21, DEC-38); las dos barras del celular (C59) en local el 12/11/2026; depende de SIM-01 |
| SIM-07 | 4 | en_local | fichas de prospecto y cliente (C23, C41, C58), 11/11/2026; sin commit; pendiente de revisión del titular |
| SIM-08 | 4 | en_main | PR #65: una sola lista de personas (DEC-36) |
| SIM-09 | 4 | en_local | 12/11/2026: panel de agendar desde botón o hueco, asesor por omisión y eliminar con «Deshacer»; C51 con SIM-17 |
| SIM-10 | 4 | parcial | cada inmueble dice qué le falta y Herramientas va en grupos; faltan el aviso amarillo (C27) y «Documentos sueltos» (C28); depende de SIM-01 |
| SIM-11 | 4 | en_local | 12/11/2026: cuatro números con comparación, detalle plegado, etapas de Operaciones y error con el estilo del panel |
| SIM-12 | 4 | en_local | 12/11/2026: listas vacías con qué es, tres pasos y botón en Operaciones, Contactos, Inmuebles y Tareas; C32 con SIM-17 |
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
| COR-01 | 2 | en_main | PR #56 (27/10/2026) |
| COR-02 | 2 | en_main | PR #56 (27/10/2026) |
| COR-03 | 2 | en_main | PR #56 (27/10/2026) |
| COR-04 | 2 | en_main | PR #57; migración `20261029170000_camino_de_renta.sql` |
| COR-05 | 2 | en_local | ninguna |
| COR-06 | 2 | en_main | PR #57; sin migración; quedan los grupos B a D de B-06 |
| COR-07 | 2 | en_local | ninguna |
| COR-08 | 2 | en_main | PR #57; migración `20261029150000_informe_entregas.sql` |
| COR-09 | 2 | en_main | PR #57; sin migración |
| COR-10 | 2 | en_local | MRP-01 |
| COR-11 | 2 | en_main | PR #57; migración `20261029160000_interesados_sin_operacion.sql`; falta ligar las ofertas (14) al interesado |
| PUB-02 | 3 | pendiente | PUB-01 |
| COR-12 | 2 | pendiente | modelo del 09 del titular |
| COR-13 | 2 | en_main | PR #56; lleva migración |
| DOC-14 | 2 | pendiente | modelos del titular |
| FIR-01 | 6 | pendiente | COR-10, DOC-01, PRV-01, DEC-30 |
| DOC-EXP | 2 | en_main | PR #57; lleva migración |
| DAT-EXP | 2 | en_main | PR #57; lleva migración |
| IA-01 | 1 | en_main | PR #57 y #63; sin activar: falta la clave de API en producción y el visto bueno del abogado |
| IA-02 | 2 | en_curso | falta el tope y el gasto del mes en «Ajustes» |
| CSR-01 a CSR-08 | 2 | en_main | PR #63 (31/10/2026); sin migración |
| IA-01 (proveedores) | 1 | en_revision | Claude Haiku 5.5 activo en local con clave de prueba (31/10/2026, 7 datos de un PDF ficticio); adaptador Grok listo pero su clave no la acepta xAI; PDF por páginas con pdfjs-dist |
| DOC-15 | 2 | pendiente | COR-06 |
| LV-05 | 2 | terminada | PR #45, #46 y #47 (18/10/2026) |
| LV-07 | 2 | en_main | PR #63; reordenado en tres bloques por SIM-16 |
| LV-08 | 2 | en_main | PR #63 y #65; lo que falta sigue en SIM-07, SIM-09, SIM-15 y SIM-17 a SIM-19 |
| SIA-01 a SIA-06 | 2 | en_main | PR #57 (29/10/2026); sin migración |
| MRP-01 | 2 | terminada | aprobada por el titular el 26/10/2026 (DEC-26); en `main` (PR #56) |
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
| DOC-06 | 2 | en local (12/11/2026) | revisión del abogado |
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
| EXT-12 | 1 | en_main | PR #57: todos los formatos (01, 02, 04A–04G y 05 a 19) se llenan sobre el documento; falta que el titular revise cada formato |
| EXT-13 | por decidir | idea, no aprobada | DEC-14, SEG-01, PRV-01 |
| SAAS-01 | posterior | en_pausa | DEC-15 |
| SAAS-02 | posterior | en_pausa | SAAS-01 |
| SAAS-03 | posterior | en_pausa | SAAS-01, MOT-03 |
| SAAS-05 | posterior | en_pausa | SAAS-01, SAAS-02, SAAS-03, DAT-01, USR-01 |
| SAAS-06 | posterior | en_pausa | SAAS-01, DEC-18 |
| PIL-02 | posterior | en_pausa | SAAS-01 a SAAS-03, SAAS-05, PIL-01, REC-01, OBS-01 |
| LV-06 | 2 | en_main | PR #65 (31/10/2026): una operación según el boceto D «Moderno» |
| SIM-13 | 4 | en_main | PR #66 (C33, C36, C39); la prueba de navegador `barras-fijas.spec.ts` no se ha corrido |
| SIM-14 | 4 | en_main | PR #66 (C34, C35, C38, C44; C37 y C40 en parte) |
| SIM-15 | 4 | parcial | primera parte en `main` (PR #66); segunda en local el 12/11/2026 (Herramientas sin «Documentos», «Documentos sueltos», Notas e Historial con el kit); cada herramienta con el kit, C56 y C57, también en local; C54 y C55 con SIM-19 |
| SIM-16 | 4 | en_local | Hoy en tres bloques (C47), 11/11/2026; sin commit; pendiente de revisión del titular |
| SIM-17 | 4 | en_local | puerta única y selector de vínculo (C48, C49, C51), 12/11/2026; sin commit; nombre confirmado en DEC-45 |
| SIM-18 | 4 | en_local | operación en tres partes (C52; C53 en parte), 11/11/2026; sin commit; Documentos limpio el 12/11; falta la decisión del encargo como pieza de la etapa 6 |
| SIM-19 | 4 | en_local | ficha del inmueble por pestañas (C54, C55), 12/11/2026; completa y sin commit |
| COR-14 | 2 | en_local | PR #66: condición declarada y revisión del abogado; la decisión del encargo en el panel de la etapa, 12/11/2026 |
| COR-15 | 2 | en_main | PR #66; la puerta única completa es SIM-17 |
| COR-16 | 2 | parcial | PR #66: el servidor aplica la puerta de publicación; falta lo que detalla su fila |
| COR-17 | 2 | en_local | ninguna |
| COR-18 | 2 | en_local | Registro de contacto en dos toques, reintento a 30 días y visita compartida en local (12/11). El 12/11 en la tarde, sin migración: en «Visitas y ofertas del inmueble» de la operación, cada oferta por escrito (14) pregunta «¿De quién es esta oferta?» entre quienes buscan ese inmueble, lo visitaron o son la contraparte. El vínculo se guarda en la ficha del interesado (`ofertas`, con el documento y la operación; el formato no cambia). La ficha muestra la tarjeta «Cómo paga y ofertas», con la forma de pago, el crédito y su estado y las ofertas, y cada oferta sale en su línea de tiempo |
| COR-19 | 2 | en_local | ninguna |
| COR-20 | 2 | en_local | 12/11/2026, en la rama `feat/seo-integral`, con los dos roles actuales (COR-23). En «Más» de un requisito, el director elige «Autorizar excepción» y escribe el motivo (al menos 10 caracteres). El requisito cuenta como cubierto para avanzar y para publicar. La operación lleva la etiqueta «Con excepción autorizada» en su pantalla, en Operaciones y en Hoy. La base solo la acepta del director, anota quién y cuándo, la quita si cambian el inmueble, el cliente o el asesor, y la rechaza en titularidad, factibilidad, valor, revisión para cerrar, firma y pago (RP-96; migración `20261112180000_excepcion_autorizada`). Para COR-24: el valor es de protección, así que el inventario heredado necesitará otra salida para la opinión de valor |
| COR-21 | 2 | en_local | «Nuevos sin atender» en `main` (PR #66); asignación al asesor del inmueble (en PR #67), plazo en Configuración y «Registrar contacto», 12/11/2026, también en PR #67 |
| COR-22 | 2 | en_local | ninguna |
| COR-23 | 1 | en_local | 12/11/2026, en la rama `feat/seo-integral`. La base rechaza al asesor: escribir Configuración, Sitio web, Blog y Equipo; editar, borrar o reasignar inmuebles ajenos; publicar o destacar (migración `20261112160000_alcance_del_asesor`); marcar revisado lo jurídico, el precio, los contratos y la publicación, y tomar el encargo (`20261112170000_revisiones_del_director`). La API del panel entrega de los inmuebles ajenos solo lo público, sin llaves, preparación, avisos ni archivos privados. La pantalla oculta esos controles, deja «Lo tengo» y avisa «Para el director». El paso siguiente es SEG-01 (roles nuevos) |
| COR-24 | 1 | en_local | 12/11/2026, en la rama `feat/seo-integral`. Decisión del titular ese día: el inventario heredado **no salta protecciones**; titularidad, factibilidad y valor se revisan antes de publicar (RP-96), lo que reemplaza «publicar y regularizar después» de su fila. El director lo da de alta desde Nueva operación → «Inventario heredado» con el inmueble, el propietario, la fecha del contrato y el motivo. Se crea el propietario y la operación con la marca `heredado` (solo la pone o la quita el director; migración `20261112190000_inventario_heredado`), con entrevista, levantamiento y plan por excepción (COR-20) y una tarea para regularizar, y la operación queda en verificación. La etiqueta «Inventario heredado» dice qué falta para publicar. El contrato se registra como cualquier firma. Falta la carga por lote (COR-25, con DAT-01) y distinguirlo en Reportes cuando exista ese tablero |
| COR-25 | 1 | pendiente | DAT-01 |
| COR-26 | 4 | parcial | PR #66: guía de cada pantalla; en local: «Tu primer día» y manual en `/admin/ayuda`; faltan capturas del manual y prueba de uso |
| CAP-05 | 1 | en_main | PR #66: condición desde la llamada |
| CAP-06 | 1 | pendiente | CAP-05, DEC-39 |
| HER-05 | 4 | pendiente | HER-01 |
| USO-02 | 4 | pendiente | USO-01 |

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
| EXT-12 — Captura sobre el documento en vivo | **Aprobada por el titular el 27/10/2026 (DEC-31) para todos los formatos.** Construida para todos los formatos y en `main` (PR #57). Usa el membrete común; FCH-01 y FCH-05 la mejoran después; relacionada con FCH-10, DOC-10 y F09 | Revisión del 04B por el titular en localhost; después, los formatos por etapa en el orden de «EXT-12» abajo. |
| EXT-13 — Conexión a servicios de IA con tope mensual | **Idea del titular, 26/10/2026; no aprobada.** Base común de EXT-11, IA-01, EXT-06 y EXT-12; DEC-14, SEG-01 y PRV-01 | Elegir proveedor inicial y tope, confirmar precios vigentes y probar con documentos sintéticos; ver «EXT-13» abajo. |

### EXT-12 — captura con vista previa del documento

**Estado: aprobada por el titular el 27/10/2026 (DEC-31) como la forma de capturar todos los formatos.** Va en el bloque 1 del «Orden vigente». Construida para todos los formatos y en `main` (PR #57); falta que el titular revise cada formato.

**Decisión del titular (27/10/2026):** «Cada etapa va a tener su archivo cargado y lo vamos a llenar desde el sistema, así como esta prueba». En cada etapa, el asesor ve el formato de Fortius tal como sale en PDF, pulsa la parte que va a llenar, captura el dato y lo ve integrado en el documento al momento. Así se detecta qué falta o qué conviene cambiar. Al final descarga el PDF, que sale igual a lo que vio. El formulario por secciones deja de ser la forma de captura de los formatos.

**Cómo funciona (construido y probado con el 04B):**

- **Pantalla.** La ventana del formato abre en la pestaña «Documento» con sus hojas. Cada espacio por llenar es pulsable y abre su campo a un lado (abajo en celular, con «Ver más grande»). Lo que se escribe aparece en la hoja al teclear. «Aceptar» lo integra y lo guarda con la versión del borrador; un conflicto 409 deja abierta la captura con el aviso. Lo que falta para el PDF lleva borde vino y aparece en la lista «Qué falta». Siguen igual «Generar PDF», «Word», el historial de versiones y la protección de cambios sin guardar. Funciona con teclado (Tab y Enter) y en claro y oscuro.
- **Lo que se ve es lo que se descarga.** La pantalla usa el mismo escritor del PDF (`crearMaquetador` en `src/lib/formatos/documento/pdf.ts`). En vez de una página de pdf-lib recibe una superficie que anota los trazos, así que vista y PDF comparten medidas, cortes de línea y saltos de página; una prueba lo compara. Cada celda del documento declara qué campos la llenan (`keys` en `src/lib/formatos/documento/modelo.ts`), y una prueba exige que todo campo tenga su parte pulsable.
- **De dónde sale cada documento.** Se reproduce en código el archivo del titular de `G:\Mi unidad\FORTIUS\04_Metodologia\01_Captacion\` (y las demás carpetas de la metodología), como el 04B. Así la vista, el PDF y el Word salen del mismo contenido. Subir un Word propio con campos marcados sigue siendo FCH-10, para después.
- **Componente.** `src/components/admin/operation/documento-en-vivo.tsx`. Un formato entra a la captura en vivo al agregarse a `EN_VIVO`.

**Folios e identificadores: nadie los inventa.** El sistema ya asigna solos el folio de la operación (`EXP-000001`, al crearla) y el código del inmueble (`FORTIUS-000001`, al darlo de alta), con la migración `supabase/migrations/20261014031535_automatic_folios.sql`. Los documentos los imprimen sin captura y esas celdas no son pulsables. En el 04B, el «ID inmueble» toma el código del inmueble vinculado, y el «ID de fotografía» sale del archivo elegido (`FOTO-` y su identificador). Al pasar cada formato se revisa qué folios o números pide (por ejemplo, el número de recibo del 18). Si el panel no tiene ya ese consecutivo, se propone uno automático al titular antes de construirlo.

**Levantamientos 04A–04G (grupo A, titular 27/10/2026, en `main`):** los siete se capturan en vivo. Cada uno sigue los espacios de su Word (`04x_Levantamiento*.docx`) con lo decidido en el 04B: sin columnas de base y referencia (D/O/M/C/NV/NA), sin las tablas de respaldos ni de discrepancias, con uso de suelo (lista del Reglamento de Zonificación de Tijuana, la misma del 07) y con superficies opcionales («si las tienes a la mano»). Las casillas comunes son las del Word del 04A; «NV» se lee «No se pudo ver». Cada tipo se describe una sola vez en `PLANTILLAS` (`src/lib/formatos/levantamiento.ts`), y de ahí salen sus campos y su documento (`src/lib/formatos/documento/levantamiento.ts`).

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
| A | 04A a 04G | En `main` (PR #57). |
| B | 02 entrevista y 01 aviso | En `main` (PR #57). El 02 conserva su versión corta. |
| C | 05 revisión jurídica y 06 opinión jurídica | En `main` (PR #57). DOC-06 (captura completa del 06) en local el 12/11/2026. |
| D | 07 opinión de valor y 08 neto | En `main` (PR #57). |
| E | 09 contrato y 10 plan | En `main` (PR #57). El PDF del 09 sigue bloqueado (DOC-09); sale en Word. |
| F | 11, 12, 13 y 14 | En `main` (PR #57). |
| G | 15, 16, 17 y 18 | En `main` (PR #57). La 15 conserva su revisión obligatoria. |

El detalle de cada grupo (qué se cotejó con cada Word y qué cambió) está en [`docs/erp-crm/historial-del-plan.md`](docs/erp-crm/historial-del-plan.md). Falta que el titular revise cada formato y lo dé por bueno.

**Reglas que se conservan.** Un dato faltante nunca detiene el flujo (RP-82); el PDF se descarga avisando qué falta (RP-77) y descargarlo no es aprobarlo (RP-85). Guardar y publicar siguen siendo acciones distintas. Cuando exista la ficha única (FCH-01), los campos llegarán llenos con lo que la ficha sabe y lo capturado regresará a ella con su origen (FCH-05); la captura en vivo no depende de eso para empezar.

**Dónde seguimos (registro del 29/10/2026; todo lo que dice «en la rama» está en `main` desde el PR #57):** todos los formatos (01, 02, 04A–04G y 05 a 19) se llenan sobre el documento en la rama; el 03 no es un documento. Falta la revisión del titular. Ya están en la rama, sin integrar, DOC-EXP (pestaña «Documentos del cliente») y DAT-EXP (datos del expediente que llenan los formatos); sus dos migraciones se aplican al integrar. SUB-01 quedó descartada (titular, 29/10/2026). IA-01 (la IA lee los documentos y propone los datos) también está en la rama, sin activar: espera la clave de API del titular y el visto bueno del abogado. COR-06 (lista de documentos con «No aplica», «por confirmar» y documentos del cliente) está en la rama (29/10/2026). COR-09 (los cuatro pasos de «Cierre y entrega») y COR-08 (entrega del informe al propietario, con una migración más) también están en la rama. COR-11 (quien compra o renta es interesado, no operación; una migración más) también está en la rama. COR-04 (camino propio de la renta, con una migración más) también está en la rama. Queda pendiente IA-02 (tope y gasto del mes en «Ajustes»). **Pendiente de los grupos A a D:** revisión del titular en localhost. Del 01, el domicilio del responsable es el del sitio, «C. Dos, 4063, Benedetti B45, Villa Fontana, C.P. 22205, Tijuana, B. C.» (titular, 28/10/2026; el Word traía otra redacción). La hoja de decisiones del representante sale solo cuando hay representante (titular, 28/10/2026; el Word la trae siempre, en blanco). Revisión en localhost (`http://127.0.0.1:3002/admin`). Al terminar los grupos, `npm run verify` y las suites de navegador, solo con su autorización, antes de abrir un único PR.

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
