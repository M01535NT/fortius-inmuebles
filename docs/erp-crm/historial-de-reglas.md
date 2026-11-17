# Historial de reglas — podado de SPEC.md el 16/11/2026. Solo consulta; si contradice a SPEC.md, manda SPEC.md.

Abajo va, íntegra, la versión de `SPEC.md` anterior a la poda del 16/11/2026 (665 líneas). En `SPEC.md` quedaron las reglas y decisiones vigentes, resumidas y con los mismos ID; aquí se conserva el texto completo de todo, incluido lo que se retiró: etapas por ruta, matriz MRP-01, listas de documentos B-06 y B-07, reglas del panel viejo `/admin`, «Reglas reemplazadas», proceso de comercialización del 15/10/2026, funciones del producto ampliado, mapa de módulos y la definición de terminado anterior. Los enlaces a archivos que ya no existen quedaron como texto.

---

## SPEC.md hasta el 16/11/2026: Fortius — especificación del ERP/CRM

**Actualizado:** 16 de noviembre de 2026, America/Los_Angeles. **Responsable de negocio:** Moisés Núñez Tonalá.

Dice **cómo debe funcionar el sistema**; solo cambia cuando el titular decide, y lo edita el agente del tema en la rama de trabajo. Qué falta: [`PLAN.md`](../../PLAN.md); lo terminado: [historial](historial-del-plan.md). Una regla contradicha por una aprobación se reescribe en su lugar y se anota en «Reglas reemplazadas».

### Las reglas que más pesan

- **Nada frena, solo avisa** (RP-100, 14/11/2026): ningún requisito detiene guardar, avanzar, publicar ni firmar; se avisa y queda anotado quién siguió. Se construye en FLX-03; hasta entonces siguen los frenos actuales.
- **Guardar primero, ordenar después** (RP-101, RP-102): documento sin operación e inmueble sin propietario son válidos.
- **Prospecto hasta firmar** (RP-90 a RP-92): cliente al firmar su contrato; inmueble captado al firmar el propietario la intermediación.
- **Compradores y arrendatarios también son clientes** desde que firman su contrato, con su papel en cada operación (RP-93, 14/11/2026).
- **Un dato faltante nunca detiene** (RP-82); descargar siempre, y descargar no es aprobar (RP-77, RP-85).
- **Guardar no es publicar**; el sitio solo muestra campos autorizados (`AGENTS.md`).
- **ERP exclusivo de Fortius** (RP-01); adaptación a otras inmobiliarias en pausa.

### Índice

1. [Etapas por ruta](#etapas-por-ruta-qué-ve-el-asesor-y-qué-cierra-cada-etapa-referencia-vigente-18102026): con FLX-03 pasa a ser la guía «Venta» y las demás guías.
2. [Matriz de reglas por ruta](#matriz-de-reglas-por-ruta-mrp-01--aprobada-por-el-titular-el-26102026-dec-26): venta, renta, inversión y comprador.
3. [Reglas de producto vigentes (RP)](#reglas-de-producto-vigentes-rp) y [reglas reemplazadas](#reglas-reemplazadas).
4. [Proceso de comercialización](#proceso-de-comercialización-de-un-inmueble--definición-del-titular-15102026).
5. [Alcance](#alcance-del-sistema) y [restricciones](#restricciones-globales).
6. [Decisiones del titular (DEC)](#decisiones-del-titular-dec).
7. [Criterios de terminado](#criterios-de-producto-terminado-para-la-primera-versión-operativa), [mapa de módulos](#mapa-de-módulos-y-archivos) e [indicadores](#finanzas-y-diccionario-mínimo-de-indicadores).

**Origen:** separado de `ROADMAP.md` el 14/11/2026 sin cambiar reglas. «Este plan» = este archivo más `PLAN.md`.

### Etapas por ruta: qué ve el asesor y qué cierra cada etapa (referencia vigente, 18/10/2026)

Ocho estados internos (`captacion`, `documentacion`, `comercializacion`, `negociacion`, `cierre`, `entrega`, `postventa`, `cerrado`), con nombres por ruta. «Qué la cierra» = requisitos revisados del servidor (`requiredReviews`) más candados de arranque (FLUJO-04a); un campo vacío no detiene (RP-82). Detalle en MRP-01.

**Venta del propietario** (ruta `captacion`; 10 etapas en cuatro fases)

| Fase | Etapa que ve el asesor | Estado interno | Qué la cierra |
|---|---|---|---|
| Conocer | 1 Primer contacto (hoy «Prospecto»; cambia con COR-10) | `captacion` | Iniciar la 02. |
| Conocer | 2 Entrevista inicial | `captacion` | 02 emitido, versión vigente. |
| Conocer | 3 Levantamiento | `captacion` | 04 emitido, versión vigente. |
| Conocer | 4 Checklist de documentos | `captacion` | Lista completa («No aplica» justificado tras COR-06). Salir de `captacion`: entrevista revisada, 02 y 04 emitidos, lista completa. |
| Revisar | 5 Dictamen jurídico | `documentacion` | 05 y 06 (con vigencia) revisados. |
| Revisar | 6 Opinión de valor y precio | `documentacion` | 07, 08 y decisión de tomar el encargo revisados (RP-96); solo si la etapa 5 pasa o pasa con condiciones. La intermediación no se firma antes. |
| Preparar y publicar | 7 Contrato y preparación | `documentacion` | 09 **firmada** y revisada (RP-90, RP-91); material, plan (10) y autorización de publicar revisados. |
| Preparar y publicar | 8 Publicación y seguimiento | `comercializacion` | Comprador con capacidad comprobada. Informe mensual: avisa, no detiene. |
| Vender y cerrar | 9 Visitas y ofertas | `negociacion` | Oferta aceptada (14), 06 actualizado, instrumento (15) y contraparte. |
| Vender y cerrar | 10 Cierre y entrega · firma y pago | `cierre` | Firma acreditada y pagos para entregar cumplidos. |
| Vender y cerrar | 10 Cierre y entrega · entrega | `entrega` | Acta (16). |
| Vender y cerrar | 10 Cierre y entrega · postventa | `postventa` | 17 y 18 (admiten «No aplica») y archivo. |
| — | Archivada | `cerrado` | — |

La etapa 10 muestra cuatro pasos (COR-09) para no dar la venta por terminada al firmar.

**Prospecto o cliente en la venta (RP-90 a RP-93):** propietario prospecto en etapas 1–7, cliente al firmar el 09. El comprador es lead, nunca cliente: al firmar 15 o compraventa queda como **contraparte**. Hoy el sistema no registra firmas ni distingue prospecto de cliente (COR-10).

**Renta del propietario** (ruta `arrendador`). Hoy recibe los requisitos de venta hasta `comercializacion` y muestra las 10 etapas de venta, mientras Hoy usa los nombres de renta. COR-04 la separa según MRP-01.

| Estado interno | Etapa (nombre de renta) | Qué la cierra hoy |
|---|---|---|
| `captacion` | Captación para renta | Entrevista; candados de arranque. |
| `documentacion` | Revisión y preparación | Los de venta: **por revisar en MRP-01**. La intermediación de renta firmada capta (RP-91); falta en el catálogo (el 09 es de venta) y saldrá de la plantilla del titular (RP-97). |
| `comercializacion` | Oferta de renta | Arrendatario con capacidad. |
| `negociacion` | Selección del arrendatario | Oferta, revisión para cerrar, contrato, contraparte y garantías («No aplica»). |
| `cierre` | Contrato y garantías | Firma acreditada y pagos. |
| `entrega` | Firma y pagos | Acta e inventario. |
| `postventa` | Entrega y seguimiento | Término, honorarios y archivo. |
| `cerrado` | Archivo del encargo | — |

Los nombres van desfasados un lugar (p. ej., `cierre` se llama «Contrato y garantías» y pide firma y pagos): COR-04 los alinea.

**Camino de renta aprobado por el titular (17/10/2026, RP-97), que COR-04 implementa desde MRP-01:** sus pasos y condiciones están en «Renta del propietario» de MRP-01.

**Rutas de compra y búsqueda de renta: superadas por RP-93 (17/10/2026).** Sin operación ni expediente para quien compra o busca renta: «Quiere comprar» y «Quiere rentar» perfilan y guardan un lead. Lo siguiente es el código actual; COR-11 lo retira sin borrar datos.

**Compra** (ruta `compra`): Perfil y capacidad → Opciones → Visitas → Oferta y negociación → Firma y pago → Entrega → Postventa → Archivado. Con RP-93 el comprador es lead y contraparte.

**Búsqueda de renta** (ruta `arrendatario`): Necesidades → Opciones → Visitas → Solicitud y condiciones → Contrato y garantías → Firma y pagos → Entrega y seguimiento → Archivo, con requisitos de compra adaptados a renta. Con RP-93 el arrendatario es lead y contraparte.

**Inversión** (ruta `inversion`): Mandato y criterios → Alternativas → Diligencia y riesgos → Escenarios → Decisión y capital → Ejecución vinculada → Seguimiento de resultados → Archivado. Excepción a RP-93: cliente desde que firma asesoría o mandato (RP-90). Sin trabajo nuevo hasta un caso real (RP-98).

**Lo que faltaba definir quedó en MRP-01:** paralelo y excepciones con motivo; ciclos, pausa, regularización y cierre ya decididos (RP-96, RP-98). La matriz siguiente lo resuelve.

### Matriz de reglas por ruta (MRP-01) — aprobada por el titular el 26/10/2026 (DEC-26)

**Estado: aprobada por el titular el 26/10/2026 (DEC-26).** Revisó venta, renta, quién revisa y B-16; aprobó B-06 y B-07 tal cual, dejando al agente decidir lo pendiente: lo por confirmar son tareas de COR-06, no bloqueos. Reúne RP-82 a RP-99 y B-01 a B-17 de `docs/erp-crm/CUESTIONARIO_TITULAR.md` (archivo ya borrado) frente a lo que exige el servidor (`src/lib/formatos/operation-workflow.ts` y `operation-gates.ts`). No cambia código. Fuente de COR-04, de la lista de COR-06 y de MOT-01 v1.

**Cómo leerla.** «Decidido» cita al titular; **«Propuesta»** es un hueco que llenó el agente, pendiente de confirmar.

**Reglas comunes a todas las rutas.**

- **Un dato faltante nunca detiene** (RP-82). Hoy detienen los requisitos revisados y los de protección; con FLX-03, avisos (RP-100).
- **Capturar no espera; avanzar sí** (B-04, RP-87): se sube cualquier documento al tenerlo; avanzar, publicar y firmar esperan su candado. Desde FLX-03 los candados son aviso y se pueden saltar etapas (titular, 15/11/2026, RP-100).
- **Revisado necesita respaldo:** evidencia con fecha, responsable y resultado (versión, PDF, adjunto o externa); factibilidad y revisión para cerrar, vigentes (RP-85).
- **Requisitos de protección, que se avisan y quedan anotados** (B-13, RP-96, RP-100; titular, 14/11/2026): titularidad; opinión jurídica y comercial antes de firmar la intermediación; firma acreditada; pagos para entregar cumplidos. Si falta uno se avisa sin frenar y queda en el historial. Parte A de FLX-03, en la rama (15/11/2026); hasta integrarse en `main`, el sitio publicado sigue frenando.
- **Saltar cualquier otro requisito:** solo el director, con motivo escrito en el historial (B-13, RP-31).
- **Estado de la operación**, aparte de la etapa (B-16, RP-98): Activa, En pausa, En regularización o Descartada.
- **Ciclos** (B-05, RP-98): oferta rechazada no mueve la etapa; promesa caída vuelve a «Publicación y seguimiento» con historial; dictamen, valor y contrato siguen valiendo salvo cambio relevante; faltantes abren pendientes sin reiniciar (RP-87).
- **Alta directa** (B-15): entra en la etapa elegida con nota de antecedentes y documentos como recibidos; la protección posterior sigue aplicando.
- **Quién revisa** (26/10/2026, salvo otra cita): el asesor prepara y registra, y marca lo operativo (entrevista, levantamiento, lista, visitas, entrega); el director marca lo jurídico, precio, tomar el encargo, firma de contratos y autorización de publicar. Hoy cualquier rol de personal marca revisado; separarlo es SEG-01.

### Venta del propietario (ruta `captacion`)

**Contrato que convierte en cliente:** 09 firmada y registrada (RP-90, RP-91, RP-97). El comprador pasa a cliente al firmar su contrato y aparece como contraparte (RP-93, desde el 14/11/2026).

| Etapa | Qué se hace y con qué evidencia | Quién revisa | Desde cuándo puede empezar | Qué la termina | Qué autoriza | Excepción admitida | En paralelo y ciclos |
|---|---|---|---|---|---|---|---|
| 1 Primer contacto | Nombre, un contacto, qué quiere, tipo; fecha y medio (RP-82, F01). | Asesor. | Primer contacto. | Iniciar la 02. | — | Alta directa (B-15). | Cita y aviso de privacidad en la llamada (F03, F04). |
| 2 Entrevista inicial | 02 con «Ampliar» (RP-89); aviso de privacidad. 02 emitido vigente. | Asesor. | Al iniciar la 02. | 02 emitido. | — | — | Levantamiento en la misma visita (RP-87). |
| 3 Levantamiento | 04 de su tipo (04A–04G), fotos, croquis. | Asesor. | Con la entrevista. | 04 emitido. | — | — | Pedir la lista al cerrar la entrevista (F08). |
| 4 Lista de documentos | Cada documento recibido o «No aplica» con motivo (COR-06). | Asesor. | Tras la entrevista. | Lista completa; salir de `captacion` según candado actual (ver etapas). | Avanzar a Revisar. | «Por confirmar» si falta un dato (RP-89). | Lo recibido ya se revisa para el dictamen. |
| 5 Dictamen jurídico | 05 y 06 (con vigencia). | Director (26/10/2026; con el equipo legal). | Con documentos suficientes. | Revisados: pasa, con condición o no pasa. | No pasa: se descarta sin opinión de valor (RP-96). | Ninguna (protección). | Valor en paralelo (B-04), concluido solo si la jurídica pasa o con condición (RP-96, D-11). |
| 6 Opinión de valor y precio | 07 con comparables; 08 acordado; decisión de tomar el encargo. | Director decide (B-03). | Con el dictamen. | Revisados y decisión: precio dentro de ±10 % y sin impedimentos graves. | Tomar el encargo. | Fuera del ±10 %, director con motivo (RP-96). Condición jurídica: «En regularización» (B-03). | — |
| 7 Contrato y preparación | 09 **firmada** (contrato, fecha, firmantes, RP-97); material verificado; plan 10; autorización de publicar. | Asesor registra; director revisa (RP-97). | Tras 5 y 6 (protección, B-04). | 09, material, plan y publicación revisados. | Firma revisada: captado, cliente, publicar. Sin revisar: «Captado, por revisar», sin publicar (RP-97). | Varios propietarios: «Firma incompleta» (RP-97). En regularización, publicar requiere al director (RP-96). | Material antes de la firma; sin ella no se publica ni ofrece en privado (RP-91). |
| 8 Publicación y seguimiento | Sitio y portales; informe mensual con fecha, medio y remitente (RP-88, RP-98). | Asesor. | Firma revisada y publicación autorizada. | Comprador con capacidad comprobada (12). | — | Informe vencido avisa. | Coexiste con visitas y negociación (RP-87). Pausa: se retira (RP-98). |
| 9 Visitas y ofertas | 13, 14; 06 vigente; 15 (promesa) y contraparte. | Director: revisión para cerrar e instrumento (26/10/2026). | Al publicar. | Oferta aceptada, 06 vigente, instrumento y contraparte. | Promesa solo con condición jurídica resuelta, o resuelta por el instrumento (RP-96). | Aliado externo con su porcentaje y acuerdo (B-09). | Rechazo: sigue publicada. Promesa caída: etapa 8 y comprador a lead (B-05, RP-93). |
| 10a Cierre · firma y pago | Firma acreditada; pagos para entregar (18). | Director. | Con instrumento. | Firma y pagos. | Entregar. | Ninguna (protección). | — |
| 10b Cierre · entrega | Acta (16) con pendientes. | Asesor. | Con firma y pagos. | Acta. | — | — | — |
| 10c Cierre · postventa | 17 y 18 («No aplica»); opinión y referidos (B-11). | Asesor; honorarios, director (26/10/2026). | Tras entregar. | Todo resuelto. | Archivar. | — | — |
| 10d Archivo | A los 30 días de la entrega sin pendientes (B-11). | — | — | — | — | Descartada: se archiva con motivo sin postventa (B-11, RP-98). | — |

### Renta del propietario (ruta `arrendador`)

**Contrato que convierte en cliente:** intermediación para renta firmada y registrada (RP-90, RP-97); plantilla pendiente, a partir de la del titular. Arrendatario: lead y contraparte, nunca cliente (RP-93). Camino del 17/10/2026 (B-01, RP-97): **sin** dictamen completo ni plan, salvo que el caso lo pida; informe mensual mientras se promueve.

| Paso | Qué se hace y con qué evidencia | Quién revisa | Desde cuándo puede empezar | Qué lo termina | Qué autoriza | Excepción admitida | En paralelo y ciclos |
|---|---|---|---|---|---|---|---|
| 1 Entrevista y levantamiento | 02 y 04 en una visita. | Asesor. | Primer contacto. | 02 y 04 emitidos. | — | Alta directa (B-15). | Pedir documentos básicos al cerrar. |
| 2 Documentos básicos | Identificación, prueba de propiedad, predial al corriente (B-01). | Asesor; titularidad, director (26/10/2026). | Tras la entrevista. | Recibidos y titularidad revisada. | — | Ninguna sobre titularidad; dictamen solo si el caso lo pide. | Opinión de renta en paralelo. |
| 3 Opinión de renta | 07 con «Operación: Renta» y comparables (26/10/2026). | Director. | Con los documentos. | Revisada y renta acordada. | Tomar el encargo (±10 %, **Propuesta**). | Fuera del margen, director con motivo. | — |
| 4 Intermediación para renta | Firmado con prueba completa (RP-97). | Asesor registra; director revisa. | Tras 2 y 3 (protección). | Firmado y revisado. | Captado, cliente, publicar. | Varios propietarios: «Firma incompleta» (RP-97). | — |
| 5 Publicación | Publicación e informe mensual. | Asesor. | Firma revisada. | Arrendatario interesado. | — | Informe vencido avisa. | Coexiste con visitas y selección. |
| 6 Selección del arrendatario | Identificación, ingresos, referencias; fiador con inmueble, póliza jurídica o depósito doble (B-02, RP-97). | Director (26/10/2026). | Con una solicitud. | Aceptado con garantía. | Firmar el arrendamiento. | Garantía «No aplica» con motivo (código actual). | Rechazo: sigue publicado. |
| 7 Contrato de arrendamiento | Firmado; arrendatario como contraparte. | Director. | Arrendatario aceptado. | Firma acreditada (protección). | — | Ninguna. | — |
| 8 Depósito y garantías | Depósito y garantía (nota de B-01). | Asesor. | Contrato firmado. | Recibidos (protección). | Entregar. | — | — |
| 9 Entrega con inventario | Acta con inventario, estado y llaves (16). | Asesor. | Con depósito y garantía. | Acta firmada. | — | — | — |
| 10 Honorarios | 18 («No aplica»). | Director (26/10/2026). | Tras firma o entrega, según contrato. | Cobrados. | — | — | — |
| 11 Seguimiento y archivo | Postventa breve, no administración (RP-97, RP-98). | Asesor. | Tras entregar. | Término; archivo a 30 días sin pendientes (26/10/2026). | Archivar. | Descartada con motivo (RP-98). | — |

### Inversión (ruta `inversion`)

**Contrato que convierte en cliente:** asesoría o mandato con Fortius (RP-90); única operación sin inmueble del cliente (RP-94). **Decidido (B-10, RP-98):** la ruta queda como está, sin trabajo nuevo hasta un caso real; entonces se detalla aquí.

### Seguimiento del lead comprador o arrendatario (sin operación)

**Decidido (RP-93, B-08, B-17; reemplazado el 14/11/2026):** prospecto mientras busca y cliente al firmar promesa, compraventa o arrendamiento, con perfil, folio, documentos y formatos; cada operación muestra su papel y a quién representa Fortius. La tabla vale hasta que FLX-04 haga el perfil completo.

| Paso | Qué se hace | Qué lo termina | En paralelo y ciclos |
|---|---|---|---|
| Perfilamiento | Zona, presupuesto, forma de pago, plazo y capacidad («Quiere comprar»/«Quiere rentar», COR-11). | Lead con próxima acción. | — |
| Seguimiento | Próxima acción con fecha; si Fortius no tiene lo buscado, contactar a un propietario para captarlo (RP-93). | Visita o descarte con motivo. | Varios inmuebles a la vez. |
| Visitas y ofertas | En la operación del propietario (13, 14). | Oferta aceptada. | Rechazo: vuelve a seguimiento. |
| Contraparte | Al firmar con el cliente, contraparte de esa operación. | Firma del instrumento. | Promesa caída: vuelve a lead (B-05, RP-93). |

### Listas de documentos y pendientes por confirmar

- **B-06 · Formas de pago y sus documentos:** fuentes oficiales consultadas el 26/10/2026, **aprobada por el titular el 26/10/2026**; fuente de COR-06.
- **B-07 · Tipos de inmueble y municipios:** fuentes oficiales consultadas el 26/10/2026, **aprobada por el titular el 26/10/2026**.

**Documentos del vendedor según la forma de pago del comprador (B-06, aprobada el 26/10/2026).** Solo lo que entrega el vendedor; lo que el comprador presenta a su instituto o banco no entra en la lista del propietario. Cada grupo se suma al A.

| Grupo | Documentos | Fuente oficial y fecha |
|---|---|---|
| A · Siempre | Escritura **inscrita**; certificado de inscripción con o sin gravámenes del Registro Público de BC ($515, unos 5 días hábiles); predial al corriente; no adeudo de agua (ver B-07); identificación oficial vigente del vendedor; con hipoteca, carta del acreedor con saldo e instrucción de cancelación. | [Certificado de inscripción con o sin gravámenes, Gobierno de Baja California](https://retys.bajacalifornia.gob.mx/Portal/TyS/539); [Constancia de no adeudo CESPT](https://retys.bajacalifornia.gob.mx/Portal/TyS/1594?temaId=10); [SHF, guía para vender vivienda usada con crédito hipotecario](https://www.gob.mx/shf/documentos/guia-para-vender-vivienda-usada-con-credito-hipotecario) (28/07/2017). |
| B · Infonavit | Estado de cuenta con CLABE de máximo 2 meses; carta de instrucción y saldo si hay hipoteca; **original del primer testimonio** inscrito (con copia certificada, cinco años de posesión con prediales y recibos). | [Infonavit, Quiero comprar](https://portalmx.infonavit.org.mx/wps/portal/infonavitmx/mx2/derechohabientes/quiero_credito/quiero_comprar/); [Requisitos y documentos para comprar (PDF)](https://portalmx.infonavit.org.mx/wps/wcm/connect/5533bb6b-262f-4855-b9ec-d3106baaa141/Requisitos_y_documentos_Comprar.pdf?MOD=AJPERES); [Lineamientos de titulación](https://portalmx.infonavit.org.mx/wps/wcm/connect/46f309a8-3a1f-4161-9b14-52a0dadd6a54/6_Lineamientos_operativos_relativos_a_la_titulacion.pdf?MOD=AJPERES&CVID=nSsQm6d). Sin fecha; PDF no abierto: **confirmar en Mi Cuenta Infonavit**. |
| C · Fovissste | Avalúo vigente del padrón Fovissste; libertad de gravamen vigente para el mutuo; carta de entrega-recepción; datos bancarios (constancia de nivel cuatro) si se le deposita. | [Fovissste, política de créditos hipotecarios](https://fovissste.gob.mx/politica-de-creditos-hipotecarios/); [Reglas para el otorgamiento de créditos](https://informacion.fovissste.gob.mx/construccion/pdf/Reglas_de_Otrogamiento_de_Credito_FOVISSSTE-27DIC22.pdf) (DOF 27/12/2022, Acuerdo 63.1379.2022; sin versión posterior). |
| D · Crédito bancario | Luz y, en condominio, cuotas al corriente; licencia, planos, alineamiento y número oficial; el banco pide el avalúo. Lista propia de cada banco. | [SHF, guía para vender vivienda usada con crédito hipotecario](https://www.gob.mx/shf/documentos/guia-para-vender-vivienda-usada-con-credito-hipotecario) (28/07/2017, única oficial; vieja). |
| E · Contado | Sin lista oficial: grupo A más lo que pida el notario (traslado de dominio e ISR). | — |

**Por confirmar al programar COR-06:** no adeudo predial de Tijuana (consultar a la Tesorería Municipal); si el notario pide la libertad de gravámenes fiscales de la Junta de Urbanización ([trámite](https://www.bajacalifornia.gob.mx/junta_urbanizacion/Servicios/CLGF), $586.59 en Tijuana); lista vigente de Infonavit. Costos y plazos pueden cambiar.

**Documentos adicionales del vendedor según el tipo de inmueble y el municipio (B-07, aprobada el 26/10/2026).** Se suman al grupo A.

| Caso | Documentos | Fuente oficial y fecha |
|---|---|---|
| Departamento o local en condominio | No adeudo de cuotas (mantenimiento, administración, reserva, extraordinarias) del administrador; reglamento. Sin ella el comprador responde solidariamente y el notario debe advertirlo. | [Ley sobre el Régimen de Propiedad en Condominio de Inmuebles para el Estado de Baja California](https://www.congresobc.gob.mx/Documentos/ProcesoParlamentario/Leyes/TOMO_IV/LEYINMUEBLE_28ABR2017.PDF) (28/04/2017; reformas sin confirmar). |
| Terreno | Deslinde catastral o levantamiento certificado por catastro, hecho por perito registrado (Tijuana: $808, vigencia un año). Sin toma de agua, sin constancia de agua. | [Tijuana, certificación de deslinde](https://www.tijuana.gob.mx/tramite.aspx?tramite=124); [Reglamento del catastro inmobiliario](https://www.tijuana.gob.mx/normatividad/documentos/Reglamentos/40_202111261471588_wp.pdf). |
| Local, oficina, nave o plaza | Uso de suelo (un año) o zonificación (seis meses); licencia de construcción. | [Tijuana, dictamen de uso de suelo](https://www.tijuana.gob.mx/tramite.aspx?tramite=103); [Uso de suelo, Administración Urbana](https://www.tijuana.gob.mx/dependencias/sdue/dau/usodesuelo.aspx). |
| Casa | Nada adicional. | — |
| Terreno o vivienda del INDIVI | No adeudo del INDIVI. | [INDIVI, constancia de no adeudo](https://retys.bajacalifornia.gob.mx/Portal/TyS/749?perfilId=1). |
| Tijuana y Rosarito | No adeudo CESPT (seis meses). | [CESPT, constancia de no adeudo](https://retys.bajacalifornia.gob.mx/Portal/TyS/1594?temaId=10). |
| Ensenada | Constancia CESPE: deslinde reciente y cuenta sin adeudo (unos $251). | [CESPE, expedición de constancias](https://retys.bajacalifornia.gob.mx/Portal/TyS/867?temaId=10); [trámites de la CESPE](https://retys.bajacalifornia.gob.mx/Portal/TySByOrganismo/76). |
| Tecate | Libertad de gravamen CESPTE (ficha sin requisitos ni costo). | Portal estatal; **confirmar por teléfono**. |

**Municipios (titular, 26/10/2026):** Tijuana, Rosarito, Ensenada y Tecate. **Por confirmar al programar COR-06:** constancia CESPTE en Tecate; alineamiento y número oficial en Tijuana (consultar a Administración Urbana); reformas a la ley de condominios posteriores a 2017. Lo investigado en Tijuana se tramita igual en cada ayuntamiento, con otros costos y plazos.

Ya resuelto el 26/10/2026:

- ~~B-16 · ¿Vendida, Apartada y Rentada?~~ **Aprobado por el titular el 26/10/2026:** son estados del inmueble: «En captación» → «Disponible» → «Apartado» (promesa) → «Vendido» o «Rentado» (firma acreditada); promesa caída, vuelve a «Disponible». La operación conserva solo Activa, En pausa, En regularización y Descartada.
- ~~Confirmar quién revisa y el ±10 % en renta~~: **aprobado por el titular el 26/10/2026**, con archivo a 30 días en renta y opinión de valor terminada solo si la jurídica pasa.

### Diferencias con lo que hace el sistema hoy

Tabla del 26/10/2026 en el historial, §31.7; casi todo corregido por COR-04, COR-06, COR-10 y COR-11. Abiertas: orden entre opinión de valor y jurídica (FLX-03, como guía), registro de tomar el encargo con ±10 % (APR-01 o FLX-03) y papel de director para revisar (SEG-01).

### Dirección del producto y reglas vigentes — 17/10/2026

**Decisión del titular, 17/10/2026:** el ERP/CRM es, por ahora, **exclusivo de Fortius Inmuebles y solo con la marca Fortius**. Abrirlo a otras inmobiliarias es una **etapa posterior** que decide el titular cuando el sistema lleve un buen tiempo probado en la operación real. Estas reglas prevalecen sobre las anteriores del plan, del encargo del rediseño y de los manuales.

### Reglas de producto vigentes (RP)

**A. Producto exclusivo de Fortius**

- **RP-01 · Solo Fortius.** Marca, flujo, equipo y formatos de Fortius; nada para otras empresas hasta la etapa posterior (DEC-15) ni «por si acaso». Solo los datos de marca (logo, colores, razón social, pie de documentos) se leen de un solo lugar cuando se toque ese código.
- **RP-05 · Roles del equipo de Fortius y permisos por acción.** Papeles: director, coordinador, asesor, asistente, jurídico, contabilidad y aliado externo (inmobiliaria con la que se comparte operación y comisión). Permisos propios: ver precio mínimo, ver comisiones, aprobar descuentos, eliminar, exportar y **administrar** (configuración, procesos, equipo y listas). «Administrador» es el director y, mientras no exista SEG-01, el rol `admin` actual. (SEG-01, DEC-03)
- **RP-06 · Reglas fiscales y notariales con vigencia.** ISAI, derechos de registro, honorarios notariales, etc., por municipio donde opera Fortius, con vigencia, fuente y responsable. Sin regla vigente el cálculo dice «pendiente», nunca una tasa supuesta. (FIS-01)

**B. Dos ritmos de uso**

- **RP-09 · Guiado por omisión, rápido para quien ya sabe.** Mismas pantallas para novato y experto; los atajos no saltan validaciones ni la guía.
- **RP-10 · Barra de comandos (Ctrl+K / Cmd+K).** Busca y actúa («ir a EXP-…»); solo ofrece lo que el usuario puede ver y hacer. (UX-03)
- **RP-11 · Atajos de teclado** visibles en menús y en la ayuda «?». Los de una tecla no actúan en campos y se pueden desactivar (WCAG 2.1.4). (UX-03)
- **RP-12 · Acciones masivas** (reasignar, cambiar estado, exportar) informan aplicados, fallidos y por qué; reintentar no repite los aplicados. (UX-03)
- **RP-13 · Edición directa en la tabla** de estado, responsable y fecha, con el control de versión de la ficha. (UX-03)
- **RP-14 · Preferencias que siguen al usuario.** Densidad, letra, tema, columnas, orden, vistas, barra contraída, fijados, recientes, secciones de Hoy y pantalla de inicio se guardan en el servidor por usuario; el navegador solo guarda comodidades del dispositivo (última pestaña, borradores). Hoy densidad (Mi perfil) y vistas del inventario viven en el navegador. (UX-02)

**C. Confianza: que nunca parezca que algo se perdió**

- **RP-15 · Estado de guardado siempre visible:** «Guardado», «Guardando…» o «Sin conexión: tus cambios siguen en pantalla, todavía no se guardan». «Guardado» solo tras confirmar el servidor. (UX-04)
- **RP-16 · Deshacer en lugar de confirmar** si el servidor puede revertir (completar tarea, archivar, quitar vínculo, eliminación recuperable): «Deshacer» al menos 5 segundos, anunciado al lector de pantalla y con teclado. Se confirma solo lo grave o irreversible: eliminar operación, cambiar o corregir etapa, enviar a un tercero, borrado definitivo. (UX-04)
- **RP-17 · Conflicto de versión explicado.** «Tu cambio» y «el cambio de <persona>» campo por campo; nunca se sobrescribe sin elegir. (UX-04)
- **RP-18 · Carga y respuesta inmediata.** Siluetas en vez de pantallas en blanco; cambios al instante y, si el servidor los rechaza, se revierten con aviso y motivo. (UX-04)
- **RP-19 · Sesión vencida sin pérdida.** Se pide entrar de nuevo sin perder lo capturado. (UX-04, AUT-01)
- **RP-20 · Bandeja «Para ti» dentro de Hoy.** Menciones (@persona), asignaciones, aprobaciones pendientes y respuestas, sumadas al contador del menú. Sin campana; avisos fuera del panel en PWA-03. (UX-05)

**D. Disciplina comercial**

- **RP-21 · Ningún contacto sin siguiente paso.** Registrar un contacto toma dos toques («Llamé», «No contestó», «Mandé WhatsApp», «Visitó») y pide el siguiente paso con fecha o un motivo para no tenerlo. (CRM-02)
- **RP-22 · Plantillas de mensaje** de WhatsApp y correo (nombre, inmueble, precio, liga a la ficha) que abren la app del usuario con el texto listo; el envío se registra cuando el asesor confirma, no al abrir. Integración por API: EXT-04. (CRM-02)
- **RP-23 · Reloj de primera atención** por prospecto nuevo («Lleva 2 h sin respuesta»), umbral en Configuración, con la definición de «Primera atención» del diccionario. (CRM-02)
- **RP-24 · Coincidencias explicadas entre comprador e inmueble** (zona, presupuesto, tipo, recámaras), en ambos sentidos; solo sugerencias, nada se envía solo. (FLX-05)
- **RP-25 · Visita desde el celular:** llegada, opinión del comprador en menos de un minuto (le gustó, precio alto, quiere segunda visita) y foto, para el informe al propietario. Programada no es realizada. (VIS-01)
- **RP-26 · Negociación como línea de tiempo:** oferta, contraoferta y respuesta, con vencimiento y diferencia contra el precio de salida. Acuerdo no es contrato firmado. (OFE-01)

**E. Fichas 360°**

- **RP-27 · Persona:** una línea de tiempo filtrable (contactos, mensajes, visitas, documentos, ofertas, cambios, notas). Sin duplicar por varios papeles; en cada operación se ve su papel y si es prospecto o cliente (RP-92). (FLX-04)
- **RP-28 · Inmueble:** salud de la ficha (completitud, días publicado, visitas, prospectos, ofertas), alertas con umbral en Configuración («60 días sin ofertas: revisa el precio con el propietario») enlazadas a Comparables, e historial de precio con quién, cuándo y por qué. (INV-01)

**F. El dinero a la vista**

- **RP-29 · Tarjeta de dinero en cada operación:** honorario esperado, reparto, cobrado y por cobrar. Estados Estimado, Pactado, Facturado y Cobrado, siempre con la misma palabra, color e ícono; nunca se suman entre sí. (FIN-01, FIN-02)
- **RP-30 · Pronóstico de ingresos por mes:** honorario × probabilidad de la etapa que defina Fortius, rotulado «Estimación» y aparte de lo cobrado. (FIN-03, DEC-17)
- **RP-31 · Aprobaciones:** comisión bajo el mínimo, descuentos y excepciones a requisitos los aprueba el rol que corresponda, con motivo y constancia; el servidor no aplica antes. (APR-01)
- **RP-32 · Cuenta por asesor:** comisiones generadas, cobradas y pagadas, con estado de cuenta descargable. (FIN-02)

**G. Tableros que llevan a actuar**

- **RP-33 · Tableros por rol.** Director: embudo, tiempo por etapa, carga por asesor, inventario envejecido, captaciones, conversión a cliente por origen (contrato firmado, RP-90 y RP-91) y metas. Asesor: sus metas, embudo y pendientes. (TAB-02, TAB-05)
- **RP-34 · Toda cifra se abre** en sus registros, contra periodo anterior y meta. Sin fuente suficiente, «pendiente», nunca cero. (TAB-01)

**H. Documentos**

- **RP-35 · Revisión lado a lado:** documento y «Marcar como revisado» en una vista. (DOC-10)
- **RP-36 · Carga de varios archivos** arrastrando; el sistema propone el requisito y la persona confirma. Cargar no es revisar. (FLX-07)
- **RP-37 · Pedir un documento al cliente** por liga segura que vence y se revoca; entra como «Lo tengo», nunca revisado. (DOC-12)
- **RP-38 · Vencimientos de todo Fortius** en un tablero, por fecha y responsable. (FLX-05)
- **RP-39 · Firma electrónica** cuando se apruebe proveedor (EXT-05). Firma en pantalla no es firma electrónica.

**I. Calidad de los datos**

- **RP-40 · Fusión asistida de duplicados:** el sistema propone, la persona elige campo por campo, con historial y deshacer. Nunca automática. (DAT-02)
- **RP-41 · Validar al capturar:** teléfono con lada (+52 por omisión), correo, RFC, CURP y código postal. (DAT-02)
- **RP-42 · Colonias y códigos postales de catálogo oficial** (SEPOMEX) con fecha de corte; texto libre solo como «otra», marcado. (DAT-02)
- **RP-43 · Todo monto lleva moneda;** cada conversión guarda tipo de cambio, fuente y fecha. **Tipo de cambio del día (titular, 17/10/2026):** consulta diaria del FIX de Banxico, mostrado discreto en el panel y propuesto al pactar en dólares; el pactado se guarda en la operación. Otro tipo (p. ej. casa de cambio) se captura a mano con fuente. La clave de consulta solo en el servidor. (DAT-02, FIN-01)

**J. Inteligencia artificial**

- **RP-44 · IA siempre con revisión humana:** resumen de la operación, lectura de INE o escritura para llenar campos (confirmados uno por uno), descripción del anuncio y siguiente paso sugerido. Cita fuente, respeta permisos y nunca cambia estados, aprueba requisitos ni envía nada sola. (EXT-11, EXT-06, DEC-14)

**K. Calidad del producto y soporte**

- **RP-45 · Meta realista de calidad.** Sin prometer «cero fallas»: detectar errores antes que el usuario y corregir rápido, con monitoreo en producción, alertas y sin datos personales. (OBS-01, DEC-19)
- **RP-47 · Pruebas de uso medidas** con asesores de Fortius: tiempo para crear operación, registrar visita y marcar requisito revisado, contra metas fijadas antes; se repiten tras cada cambio grande de pantallas. (PIL-01)
- **RP-48 · Soporte dentro del panel:** ayuda por pantalla (se conserva «¿Qué significa?»), centro de ayuda, «Reportar un problema» con contexto técnico sin datos personales y recorrido inicial saltable. (SOP-01)

**M. Interfaz sencilla (aprobado el 17/10/2026)**

- **RP-50 · Una pantalla, una pregunta.** Cada pantalla responde una pregunta («¿qué hago hoy?») con una sola acción principal visible. (SIM)
- **RP-51 · Nada se dice dos veces.** Cada tarea, pendiente o acción una vez por pantalla, con un solo nombre de botón. (SIM-03, SIM-05)
- **RP-52 · Un color, un significado.** Guinda (`--primary`) solo para acción principal y sección activa; lo vencido o urgente en rojo de alerta (`--destructive`) con ícono y palabra; precios y cifras en texto normal. Paleta completa en RP-70. (SIM-01, LV-01)
- **RP-53 · Letra normal y fechas humanas.** Sin monoespaciada en el panel. Fechas como «Hoy», «Lun 19», «Vencida hace 2 días»; nunca «2026-10-17». (SIM-01)
- **RP-54 · Explicar en el momento, no siempre.** Ayuda al intentar la acción o al tocar «?»; sin avisos permanentes ni notas al pie repetidas. (SIM-01)
- **RP-55 · Mostrar lo actual, esconder lo posible.** Estado actual y siguiente acción obvia; lo demás en «⋯». (SIM-05, SIM-06)
- **RP-56 · Lo de campo, arriba en el celular.** Llamar, WhatsApp y siguiente paso primero; nada fijo tapa más de una franja. (SIM-06)
- **RP-57 · Las pantallas vacías enseñan** qué hacer y con qué botón. (SIM-12)

**N. Navegación, personalización y trabajo rápido (aprobado el 17/10/2026)**

- **RP-58 · La barra lateral se adapta, pero no se reordena.** Se contrae a íconos y fija favoritos; las ocho secciones principales (Hoy, Bandeja, Operaciones, Contactos, Personas, Inmuebles, Agenda y Trámites; LV-09 y FLX-01, 14/11/2026) no se mueven ni ocultan. Tras una línea, Herramientas y Administración. En celular, Bandeja y Personas por «Más»; Bandeja también por «+». (NAV-01)
- **RP-59 · Volver nunca cuesta.** Abrir un registro no pierde la lista: vista previa lateral en computadora y, al volver, búsqueda, filtro y posición intactos. (NAV-03)
- **RP-60 · Listas que se actualizan solas.** Grupos frecuentes («sin contacto en 5 días», «sin próxima tarea») como listas inteligentes. (NAV-04)
- **RP-61 · Personalizar poco y con límites.** Se ajustan secciones de Hoy, letra, tema y pantalla de inicio por rol; nunca se oculta lo que exige atención ni se cambian colores con significado. (NAV-05)
- **RP-62 · El sistema propone, la persona decide.** Planes de seguimiento, calificación sugerida y listas crean tareas o sugerencias; nunca envían mensajes ni cambian etapas solos. (NAV-06, NAV-09)
- **RP-63 · Toda acción con gesto tiene alternativa.** Deslizar, arrastrar o pasar el mouse tiene botón equivalente con teclado y lector de pantalla (WCAG 2.5.1 y 2.1.1). (NAV-07, NAV-12)
- **RP-64 · Lo que ve el cliente sale de los datos públicos.** «Ver como cliente» y toda vista para terceros usan la proyección pública del inmueble, no campos escondidos en pantalla. (NAV-10)

**O. Lo que no se hace (decisión del 17/10/2026)**

- **RP-65 · Sin reordenar el menú arrastrando.** Se retiró por confuso; para lo frecuente, fijados (RP-58).
- **RP-66 · Sin tableros armados libremente con widgets.** Hoy solo muestra, oculta y ordena secciones (RP-61).
- **RP-67 · Sin arrastrar operaciones entre etapas del tablero.** Se avanza con «Pasar a», que revisa lo que falta.
- **RP-68 · Sin mensajes automáticos a clientes.** Nada envía WhatsApp, correo o SMS sin confirmación de una persona (refuerza RP-22 y RP-44).
- **RP-69 · Sin colores personalizados por usuario.** Rompería RP-52; solo tema claro, oscuro o automático.

**P. Lenguaje visual: que se entienda sin leer (aprobado el 17/10/2026)**

- **RP-70 · Cinco colores con significado, siempre con ícono.** Guinda (`--primary`): acción principal y sección activa; azul: información y agenda (con visitas); verde: listo o revisado; ámbar (`--warning`): necesita atención; rojo (`--destructive`): vencido o error. Ningún otro color comunica estado. Completa RP-52. (LV-01)
- **RP-71 · Un ícono fijo por concepto.** Cada etapa, tipo de documento y estado, un ícono (Iconoir, vía `src/components/admin/icons.tsx`) de un catálogo único, igual en tablero, barra de avance, Hoy, listas y documentos. (LV-02)
- **RP-72 · El estado se reconoce sin color.** Forma, color y palabra (WCAG 1.4.1). (LV-02)
- **RP-73 · El movimiento confirma, no decora.** Animaciones de 300 ms o menos que confirman o muestran un cambio; ninguna en bucle; todas se apagan con «reducir movimiento». (LV-03)
- **RP-74 · Escala tipográfica fija de `docs/brand.md`:** ocho tamaños de panel (30/26, 20, 18, 16, 15, 14, 13 y 12 px) más dos de cifra, aprobados por el titular el 13/11/2026; ninguno fuera. Reemplaza la escala de cuatro tamaños del 17/10/2026. (LV-01)
- **RP-104 · Reglas de pantalla del panel** (artboard de diagnóstico de LV-08, aprobado el 30/10/2026; revisadas contra LV-09 el 14/11/2026): cada dato una vez; una acción principal rellena en borgoña; foto antes que ícono (inmuebles con foto, personas con iniciales); títulos sin subtítulo ni encabezados de columna, salvo tablas de Herramientas y Reportes; números grandes en Archivo angosto para lo que cuenta; vencido en bermellón y con palabra; formularios cerrados hasta pedirse; nada técnico en pantalla (códigos, IDs, slugs, versiones). «Lo demás sin color» y el lenguaje visual de LV-08 los reemplazó LV-09 (ver «Reglas reemplazadas»). Las tablas completas de DEC-51 chocarán con «sin encabezados de columna»: se decide en LV-10.

**Q. Proceso, captura y documentos (aprobado el 17/10/2026)**

- **RP-75 · Capturar una vez.** Personas, inmueble, datos legales y condiciones viven en la ficha única de la operación y todos los documentos los leen de ahí; nadie reescribe nombre, RFC, dirección o folio real. (FLX-04, FLX-02)
- **RP-76 · Un documento emitido es una foto fija.** Si la ficha cambia tras emitir un PDF, avisa y ofrece versión nueva; nunca se reescribe solo. Las revisiones que dependían de él se invalidan (DOC-01, pendiente). (FLX-02)
- **RP-77 · Descargar siempre, avisando lo que falta.** Todo documento baja en PDF o Word aunque falten datos, con o sin operación: faltantes como línea en blanco, aviso sin impedir y registro en historial de con qué faltantes se emitió. Se conservan los bloqueos que no son de datos faltantes: el PDF del contrato 09 hasta resolver DOC-09, y las reglas legales y de congruencia de la promesa 15 (Baja California y pleno dominio; con marco de consumo, modelo registrado; la inmobiliaria no custodia la garantía; montos que suman y fechas en orden; identidad, titularidad y facultades revisadas), que detienen su PDF final. Los machotes en blanco (HER-02) siempre se descargan. (FCH-04, HER-02)
- **RP-78 · Rápido con el cliente, completo en oficina.** Cada pregunta y campo se marca «en la llamada», «en la cita» u «en oficina»; frente al cliente solo lo de ese momento, y lo ya dicho se confirma sin repreguntar. (FLX-01, FLX-04)
- **RP-79 · Cada operación sigue el proceso de su tipo.** Proceso base por tipo más módulos que activa la entrevista, editables por Fortius sin programar como guías; cada operación conserva la versión con que empezó. Con RP-100 la guía sugiere y avisa, no frena. Es RP-04 aplicado a Fortius. (FLX-03; antes MOT-01 a MOT-04)
- **RP-80 · La opinión de valor se captura en el sistema.** El sistema es la fuente; el Excel, una salida. No se lee un Excel subido; si se ajusta en Excel, se adjunta el final y el valor concluido se escribe una vez en la ficha. (FLX-04)
- **RP-82 · Un dato faltante nunca detiene el flujo.** Avanzar depende de los requisitos del proceso (revisiones con respaldo, documentos recibidos, decisiones), no de campos llenos. Un PDF con faltantes cuenta para los candados (FLUJO-04a) y el revisor decide si respalda «Revisado». Los faltantes se muestran como **«Datos por completar»** en ficha y operación, aparte de «Te falta» (solo lo que detiene), y se avisan en «Para ti» una vez por operación y cuando un documento los necesita. Fortius puede marcar en Configuración un dato indispensable para un paso; por omisión, ninguno (con el motor de procesos pasa al editor, MOT-03). Aparte y fijo, crear una operación pide nombre, un medio de contacto, qué quiere y tipo de inmueble. Los requisitos de protección (quién es dueño y quién firma, firma acreditada, pagos para entregar cumplidos según contrato; nombres de RP-86) siguen siendo requisitos. (FCH-04, CAP-03)
- **RP-83 · Trabajo suelto sin abrir operación.** Desde Herramientas, cualquier machote en blanco y cualquier documento o cálculo (opinión de valor, ISR, contrato) sin operación ni prospecto; si el cliente contrata, pasa a una operación sin recapturar. (HER-01 a HER-03; pasar el trabajo a un asunto, FLX-02)
- **RP-81 · Datos mínimos y confidenciales.** Solo se pregunta lo que el proceso necesita; el precio mínimo del propietario solo con ese permiso (RP-05); enviar el aviso de privacidad no es consentimiento. (CAP-02, FLX-04)

**R. Coherencia del proceso (aprobado el 18/10/2026, a partir de revisiones externas verificadas en el código)**

- **RP-84 · Una sola definición de «Esperan algo de ti».** Hoy, Operaciones y el número del menú usan la misma función y orden: 1) hay un problema; 2) tarea vencida; 3) falta un documento de una etapa anterior; 4) documento por revisar; 5) vence hoy; 6) oferta nueva (últimos 3 días); 7) sin próxima tarea con fecha. El número del menú = tarjetas de esa lista + no leído de «Para ti» (RP-20). (COR-05)
- **RP-85 · Descargar no es aprobar.** Estado propio por documento: Borrador → Revisado → Aprobado (o Firmado). PDF, Word y Excel son salidas y no cambian el estado. Un PDF con faltantes cuenta como «emitido» para los candados de arranque (RP-82), pero solo uno revisado respalda «Revisado». Controles internos en el panel; plantillas al cliente limpias. (FCH-04, LV-02)
- **RP-86 · El nombre sencillo dice lo mismo que la regla.** Ninguna etiqueta promete más ni menos que el requisito: «Firma acreditada» (no «Firma ante notario»), «Pagos para entregar cumplidos según contrato» (no «Pago completo antes de entregar»), «Aviso y controles de privacidad revisados» (no «Aviso de privacidad firmado»), adaptadas a cada ruta. (COR-07)
- **RP-87 · El proceso admite trabajo en paralelo y ciclos.** La matriz de reglas (MRP-01) dice por ruta y etapa qué puede empezar, qué debe terminarse y qué autoriza avanzar, publicar o formalizar. Entrevista y levantamiento en la misma visita; publicación, visitas y negociación coexisten; una oferta rechazada vuelve a seguimiento con historial; una revisión con faltantes abre pendientes sin reiniciar. (MRP-01, MOT)
- **RP-88 · Preparado no es entregado.** El informe al propietario registra «último preparado» y, aparte, fecha, canal y responsable de entrega (manual; sin integrar WhatsApp ni correo). Visitas: programada, realizada o cancelada (VIS-01). (COR-08)
- **RP-89 · Entrevista con lo necesario y opción «Ampliar».** Pide todo lo que alimenta la lista de documentos, el levantamiento, un módulo del proceso o un documento obligatorio, y nada que no se use. La sección plegada **«Ampliar»** capta el resto (régimen y datos del matrimonio, adquisición, compromisos previos, precio mínimo, condiciones de pago y entrega, datos fiscales) a juicio del asesor. Lo no sabido en la cita sale de los documentos en oficina. Si una condición de la lista depende de un dato no capturado, el documento queda «por confirmar», no se omite. Respeta la decisión del titular del 17/10/2026 (entrevista para conocer al propietario). (CAP-03, COR-06)
**S. Prospecto y cliente (regla del titular, 18/10/2026)**

- **RP-90 · Cliente es quien firmó su contrato con Fortius.** Es **prospecto** hasta firmar; antes nadie está obligado. Convierten en **cliente**: la **intermediación** (09) del que vende; la **intermediación para renta** (plantilla del titular, RP-97) del que renta; la **asesoría o mandato** del inversionista; el contrato de compradores y arrendatarios (RP-93, 14/11/2026). Entrevista, documentos, operación abierta u oferta no convierten. (COR-10, FLX-04)
- **RP-91 · Inmueble captado = intermediación firmada.** Antes de la firma está «en captación» y no se publica ni se ofrece, ni en privado (desde FLX-03 avisa y queda anotado, RP-100); excepción: compartidos (RP-95). No se firma antes de las opiniones jurídica y comercial (RP-96). Sin exclusiva también capta: insignia «Sin exclusiva» y reportes separados. La fecha de captación es la de firma; la meta cuenta intermediaciones firmadas en el periodo y lo que sigue en captación se muestra aparte. Al registrar la terminación, o al pausar, descartar, poner en regularización, pausar o rechazar el encargo o regresar a antes de publicar, no vuelve a publicarse y se crea al asesor una tarea urgente para retirarlo (cambiar inmueble, cliente o ruta, perder las revisiones que autorizan publicar o cerrar sin marcar vendido o rentado sí lo retiran solos); retirar archiva (apaga la publicación, conserva fotos y datos), no borra (titular, 13/11/2026). (COR-10, MRP-01)
- **RP-92 · La condición se calcula, no se elige.** «Prospecto», «Cliente», «Cliente anterior» o «Contraparte» salen de los contratos firmados; no se cambian a mano ni dependen de la tabla técnica (`leads` o `clientes`, que no cambian). Es por operación; la lista muestra «Cliente» si lo es en alguna vigente. Antes de firmar: nuevo, contactado, en evaluación, descartado. (COR-10, C24)
- **RP-93 · Compradores y arrendatarios también son clientes de Fortius (titular, 14/11/2026; reemplaza la versión del 17/10/2026).** Fortius sigue cobrando y representando al propietario; quien compra o renta se conserva para futuros negocios.
  - Mientras busca es **prospecto**: «Quiere comprar» y «Quiere rentar» perfilan (qué busca, zona, presupuesto, forma de pago, plazo y capacidad) y guardan su próxima acción.
  - Al firmar promesa, compraventa o arrendamiento es **cliente**, con perfil, folio, documentos y formatos (RP-90, RP-92).
  - Cada operación muestra su **papel** (p. ej., contraparte). Si Fortius consigue al comprador de su propio inmueble hay **una sola operación**, la del propietario.
  - Si busca algo que Fortius no tiene, Fortius contacta al propietario para captarlo.
  - Lo construye FLX-04; hasta entonces son leads y contraparte.

  (COR-10, COR-11, FLX-04)
- **RP-94 · Expediente del cliente y folio por inmueble.** La ficha del propietario es el **expediente del cliente** (nombre, contacto, identificación, aviso de privacidad y sus inmuebles). Cada inmueble comercializado es una operación con folio `EXP-…` y lo propio: qué quiere, documentos, contrato, condición y asesor. Operación = comercializar un inmueble en venta o renta, de cualquier tipo o uso; solo la asesoría al inversionista no parte de un inmueble del cliente. Para registrar a una persona bastan nombre completo, interés y un contacto; si nombre o teléfono coinciden, el sistema avisa y el asesor elige «es la misma» o «es otra», sin fusión automática. Papeles: propietario, copropietario, cónyuge que participa, heredero, usufructuario, apoderado, representante de empresa, ocupante o inquilino y contacto para visitas; registrarlos no certifica derechos ni facultades. (REL-01, FCH-01)
- **RP-95 · Inmuebles compartidos.** Captados por otra inmobiliaria, sin su expediente. Se registran desde Herramientas como inventario **«Compartido»**, con la inmobiliaria como aliado externo (porcentaje y acuerdo adjunto); no son operación. Publicar requiere su autorización escrita como evidencia; desde FLX-03 sin ella avisa y queda anotado (titular, 15/11/2026, RP-100). El sitio muestra solo lo que ella permita, nunca datos de su propietario, y aclara que Fortius no tiene su expediente técnico. Su comisión entra a finanzas como «Estimación» y no suma a lo cobrado hasta cobrarse. (PUB-02)
- **RP-96 · Tomar el encargo y firmar con viabilidad.** Desde el 14/11/2026 estas condiciones avisan y no frenan (RP-100); firmar, publicar o cerrar sin ellas anota quién siguió y por qué. Lo construye FLX-03; hasta entonces panel y base frenan. Se firma solo si es **vendible o rentable**: jurídicamente viable o con condición subsanable por el equipo legal, y con precio de mercado; nunca en la primera cita. **Orden:** primero la opinión jurídica (06); la de valor (07) solo si pasa o pasa con condiciones (titular, 17/10/2026, D-11); si no pasa, termina sin opinión de valor.
  - Toma el encargo el director si el dictamen no tiene impedimentos graves y el precio pedido está dentro de ±10 % de la opinión de valor; fuera, con motivo escrito.
  - **Captar con condición jurídica** (hipoteca por cancelar, sucesión, embargo u otra resoluble): intermediación normal más contrato de servicios con los abogados, cobro aparte por convenir y fuera del sistema. Queda **«En regularización»** con la condición y quién la da por cumplida. Se prepara el material; publicar exige autorización del director con la condición visible, y promesa o compraventa esperan a que se resuelva o la resuelva el instrumento (p. ej., hipoteca cancelada con el precio en la escritura). Desde FLX-03 firmar sin eso avisa y queda anotado (titular, 15/11/2026, RP-100).
  - Solo el director autoriza avanzar sin un requisito, con motivo escrito y constancia (RP-31). Hoy nunca se saltan: quién es dueño y quién firma; las opiniones antes de la intermediación; la firma acreditada; los pagos para entregar. Con FLX-03, avisos anotados (RP-100).

  (MRP-01, APR-01)
- **RP-97 · Registro de la firma y ciclo del contrato.**
  - **Prueba:** contrato completo firmado (escaneo o foto legible), fecha y quién firmó por cada parte; sin archivo no cuenta. Vale firmado fuera del panel (PDF del 09 bloqueado por DOC-09).
  - **Quién:** registra el asesor de la operación y revisa el director; mientras, «Captado, por revisar» y no se publica.
  - **Varios propietarios:** captado cuando firman todos los que deben; si falta alguno, «Firma incompleta», sigue en captación y nadie es cliente. Cada uno queda con lo que puede decidir; salvo constancia, precio, aceptación de oferta y firma requieren a todos, y fotos y visitas, al contacto designado.
  - **Apoderado o empresa:** cliente es el representado; apoderado o representante legal firma, con su papel y documento de facultades.
  - **Renta:** intermediación para renta de la plantilla del titular (pendiente en el catálogo). Al arrendatario: identificación, comprobantes de ingreso, referencias y garantía (fiador con inmueble, póliza jurídica o depósito doble).
  - **Vencimiento:** «Para ti» avisa 30 y 7 días antes con «Renovar o cerrar». Si vence, se rescinde o se cancela sin cerrar: **«Cliente anterior»** con fecha de término, inmueble «Sin contrato», tarea urgente para retirarlo (no se retira solo; titular, 13/11/2026) e historial conservado. En la protección posterior del 09, avisa si aparece un comprador que Fortius presentó.
  - **Descartes:** no contesta, precio fuera de mercado, no acepta las condiciones del contrato, se fue con otra inmobiliaria, documentación inviable, desistió u otro (con nota). Se conserva el historial; «No contesta» vuelve como pendiente a los 30 días, los demás solo si la persona escribe. Alimentan el reporte de por qué no se capta.
  - **Nombres:** «Convertir en cliente» → **«Abrir operación»** (a Nueva operación con la persona); etapa 1 de la venta → **«Primer contacto»**; inmueble **«En captación»** (no «evaluación») sin firma y **«Disponible»** solo captado; lo demás igual.

  (COR-10)
- **RP-98 · Ciclos, pausas y cierre de la operación.**
  - **Oferta rechazada:** se registra; sigue en visitas y ofertas, publicación viva.
  - **Promesa caída:** vuelve a «Publicación y seguimiento» con historial; inmueble «Disponible», comprador lead en seguimiento (RP-93). Dictamen, opinión de valor y contrato valen salvo cambio que obligue a revisarlos; bajar precio o pausar, en Ajustes con motivo.
  - *Pausa, regularización y descarte: redactados por el agente por encargo del titular (17/10/2026); el titular puede corregirlos en B-16 del cuestionario.*
  - **En pausa:** el propietario detiene la comercialización; motivo y fecha para retomar, tarea urgente para retirar la publicación (no se retira sola; titular, 13/11/2026) y seguimiento en esa fecha; el contrato sigue vigente.
  - **En regularización:** captado con condición jurídica (RP-96); se reactiva cuando el responsable la marca resuelta.
  - **Descartada:** termina sin éxito con un motivo de RP-97, se archiva sin postventa; si había contrato, «Cliente anterior».
  - **Postventa y archivo:** registro de la escritura (o «No aplica»), cobro de honorarios, opinión y referidos. Se archiva a los 30 días de la entrega si no queda pendiente.
  - **Informe al propietario:** WhatsApp o correo, a elección del asesor; se registran a mano fecha, medio y quién envió, sin conectar WhatsApp ni correo. El primero vence un mes después de publicar.
  - **Otra inmobiliaria trae al comprador:** aliado externo con porcentaje pactado y acuerdo adjunto.
  - **Alta directa, sin entrevista:** para casos armados; pide etapa de entrada y nota de antecedentes; documentos existentes se suben como recibidos.
  - **Inversión:** la ruta queda como está, sin trabajo nuevo hasta un caso real; VAN y TIR siguen en Herramientas.
  - **Administración de rentas:** aún no; se especificará en el futuro. «Administración u otra» sigue como seguimiento simple.

  (MRP-01, COR-04, COR-08, COR-09)

- **RP-99 · Captación y venta son trabajos distintos; el inventario es del equipo (titular, 17/10/2026).** La **captación** (primer contacto a firma: entrevista, levantamiento, opiniones jurídica y de valor, contrato y plan de comercialización) la hace el asesor que capta. Desde la firma, la publicación puede delegarse y **cualquier asesor del equipo puede vender**; no hay inventarios por asesor. **Regla de redacción (titular, 02/11/2026):** ningún texto del sitio, artículos ni documentos dice que una sola persona lleva toda la operación; responde Fortius como persona moral, no un asesor.
  - **Reparto de la comisión de Fortius:** 25 % a quien capta y 25 % a quien vende; si es el mismo, 50 %. Cada operación guarda ambos.
  - **Notas del inmueble:** botón discreto «Notas» en inmueble y operación, panel lateral de notas breves; las ven los asesores que pueden venderlo; mencionar avisa en «Para ti». Se retira «Notas del equipo» (DEC-25).
  - **Quién edita:** solo el asesor que captó (asignado) y el director o administrador. Los demás ven **solo los datos públicos** y venden con la ficha técnica; lo no público lo preguntan a dirección o a quien captó.
  - **Documentos para los abogados del comprador:** si los piden y existen, NDA firmado y dirección o el equipo legal los envía a su correo; el asesor solo registra la solicitud. Cada envío registra quién pidió, qué, a quién, cuándo y el NDA.

  (SEG-01, FIN-02, FLX-04)

### Panel nuevo (PN): reglas del 16/11/2026

Estas reglas mandan sobre lo ya construido en `/admin`. Cuando una de ellas contradice una regla anterior de este archivo, la anterior se reescribe o se marca como superada y se anota en «Reglas reemplazadas». Cómo se construye, por etapas: sección «Panel nuevo (PN)» de `PLAN.md`.

**Decididas por el titular (16/11/2026):**

- **RP-100 · Los bocetos mandan.** El panel de administración se construye a partir de los bocetos aprobados (`docs/diseno/nuevo-panel/DECISIONES.md` y el lienzo). Lo ya construido en `/admin` es legado: no se amplía y se retira al final (PN-12). El panel nuevo vive aparte en `/panel` y solo toca al viejo por `src/lib/panel/legado`. (PN-00)
- **RP-101 · Director primero, asesor después; cada asesor solo ve lo suyo.** Se construye primero el panel del director o administrador, que ve todo, y después el del asesor. Desde el primer día cada registro (persona, inmueble, asunto, pendiente, movimiento) lleva responsable y quien lo creó, y la visibilidad se hace cumplir en la base (RLS), no solo en pantalla. El asesor ve lo que lleva y lo que se le comparte; el director, todo. (PN-02, PN-10)
- **RP-102 · Arrastrar y soltar donde se pueda.** Todo orden que el usuario pueda querer cambiar se cambia arrastrando: el menú lateral, las guías, las tareas y pasos de un asunto o trámite, los pendientes, los temas del equipo y las listas de documentos. Cada arrastre tiene su equivalente de teclado (Alt con las flechas, o un menú «Mover a…») y avisa lo que hizo. El orden de preferencia personal (menú) se guarda por usuario; el orden del negocio (pasos de una guía) se guarda en el servidor con control de versiones. (PN-01)
- **RP-103 · Auditoría de lógica continua.** En cada etapa del panel nuevo, un subagente razonador de solo lectura audita si la lógica es buena y fluida para el trabajo diario, y puede proponer agregar, quitar o reordenar pasos. Su informe se guarda en `docs/diseno/nuevo-panel/auditorias/`; lo que el titular acepta pasa a esta especificación. (PN-xx)
- **RP-104 · Sistema visual.** El panel nuevo usa el estilo tipo Apple que aprobó el titular el 16/11/2026 (detalle en `docs/diseno/nuevo-panel/DECISIONES.md`, «Estilo tipo Apple»): letra del sistema en Apple e Inter en lo demás; fondo gris claro con tarjetas agrupadas sin borde; acento azul en claro y oscuro; esquinas 6, 10, 14 y 16 px; íconos del sistema Fortius sobre un cuadro de color por sección en el menú; sin blanco ni negro puros; tema claro y oscuro que sigue al dispositivo o se fija en Configuración. Vencido y errores usan el color de error, no el acento. Reemplaza Geist, el ámbar del oscuro y las esquinas 2–16 del Sistema de diseño Fortius; el logotipo y los dibujos de íconos se conservan. La marca del sitio público no cambia hasta que el titular lo decida.
- **RP-105 · El chat del equipo va al final.** «Equipo» (temas con #, mensajes directos, menciones y tarjetas ligadas) se construye después del rol de asesor. (PN-11)

**Confirmadas por el titular el 16/11/2026 (propuesta de la auditoría AUD-01; se construyen en PN-02, y la migración se avisa antes de aplicarla):**

- **RP-106 · El centro es el asunto (confirmada 16/11/2026).** El asunto es el centro de trabajo y lleva folio, documentos, dinero y lo que sigue; la persona es el centro de la relación; el inmueble es el inventario. Persona e inmueble son fichas maestras que se capturan una vez (RP-75) y el asunto las une con papeles. Un propietario con tres inmuebles tiene tres asuntos; un comprador que ve cuatro inmuebles tiene un asunto «Búsqueda» con cuatro ligados. RP-94 se conserva en lo que dice del folio por inmueble y del expediente del cliente.
- **RP-107 · Folios (confirmada 16/11/2026).** Solo lleva folio visible lo que se cita por escrito ante terceros. El asunto (incluye trámites) lleva `EXP-######`; el inmueble, `FORTIUS-######`; el formato emitido, `EXP-######·nn·vN` (folio del asunto, número de formato y versión); el recibo emitido, `REC-AAAA-####`. Personas, consultas, archivos y movimientos de dinero llevan solo id interno. Los folios los asigna la base al guardar (nunca al abrir un formulario), son únicos, no se reutilizan ni se borran; los números retirados quedan reservados. Cancelar un asunto es cerrarlo como «No se dio». Al unir personas ningún folio cambia; al dividir un asunto, el original conserva el suyo y el nuevo recibe el siguiente con «derivado de». Los de hoy (`EXP-` y `FORTIUS-`, migración `20261014031535_automatic_folios`) se conservan.
- **RP-108 · Qué abre un asunto nuevo (confirmada 16/11/2026).** Solo estos casos: (1) el propietario encarga un inmueble en venta o renta, un asunto por inmueble y por encargo; (2) un comprador o arrendatario con búsqueda real, un asunto por persona y necesidad; (3) un trámite sin venta; (4) un mandato de inversionista; (5) el mismo inmueble vuelve a comercializarse tras un cierre o pasa de venta a renta con documentos emitidos, con «continúa de». No abren asunto una consulta, una visita, un archivo, un cambio de precio ni una reapertura. Todo entra por la Bandeja (archivos) o por Consultas (personas) y de ahí se reparte a una persona, un inmueble o un asunto; el asunto nace cuando hay negocio.

### Etapa posterior: adaptación para otras inmobiliarias (en pausa)

No se trabaja hasta que el titular lo decida; sus entregas están «en pausa» en el backlog.

**Criterios propuestos para abrir esta etapa** (los confirma el titular): PIL-01 aceptado; varios meses de operación real con el ERP; pruebas de uso en meta; incidencias graves cerradas; REC-01 probada; DEC-15 decidida.

- **RP-100 · Nada frena, solo avisa (titular, 14/11/2026).** Ningún requisito detiene guardar, avanzar, publicar ni firmar, incluidos los legales (RP-96, B-13, LFPIORPI y promesa). Lo que falta o vence es aviso en la operación y en Hoy; quien sigue queda anotado con fecha y motivo si lo escribe. La metodología es guía que sugiere. FLX-03 parte A (15/11/2026, en la rama) anota «Aviso» en el historial del asunto o trámite (migración `20261115200000`); hasta integrarse en `main` siguen los frenos. Conviene que el abogado lo sepa, sobre todo antilavado y promesa. **Lista aprobada (titular, 15/11/2026):** pasan a aviso la firma con hipoteca sin cancelación inscrita, publicar un compartido sin autorización escrita, la visita antes de la firma sin carta del propietario y el paso entre etapas (saltables con aviso). Se quedan permisos (DEC-43), privacidad, galería para publicar, el 01 sin descarga incompleta e integridad de datos; el PDF del 09 se emite desde el 12/11/2026 (COR-12) y su texto va en el paquete del abogado. Lista completa: `PLAN.md`, FLX-03. (FLX-03)
- **RP-101 · Un documento puede existir sin operación (titular, 14/11/2026).** Se guarda en la Bandeja sin datos y luego se liga a persona, inmueble, asunto o a nada; privado, con huella y papelera recuperable. (FLX-01)
- **RP-103 · Lo que recibimos manda (titular, 14/11/2026).** Todo lo que llega (documentos, información, casos atípicos) entra por la Bandeja; el sistema lee y recomienda asunto, persona o inmueble; el titular o el asesor confirma con un clic o lo deja sin ligar, y lo faltante se completa después (RP-82, RP-100). Nunca se aplica sola (RP-44, RP-62). Sin coincidencia, propone crear lo nuevo con lo leído, también con confirmación. (FLX-07, DEC-50)
- **RP-102 · Un inmueble puede existir sin propietario (titular, 14/11/2026).** Se registra con documentos sin dueño conocido ni captación; guardarlo no lo publica (RP-91). (FLX-01)
- **RP-02 · Datos separados por empresa.** Cada registro, archivo, folio, respaldo, caché e índice pertenecería a una empresa, con servidor y RLS haciéndolo cumplir. (SAAS-01)
- **RP-03 · Marca por empresa:** logo, colores, dominio y datos de documentos configurables; Fortius, su propio tema. (SAAS-02)
- **RP-04 · Flujo configurable a partir de la plantilla de Fortius,** versionado por operación, con requisitos protegidos. Para Fortius, guías editables (RP-79, FLX-03); aquí solo quedaría adaptarlo por empresa. (SAAS-03)
- **RP-07 · Alta guiada de una empresa nueva** con importación y revisión de duplicados. (SAAS-05)
- **RP-08 · Planes y límites;** sin pago, solo lectura con exportación, nunca borrar datos. (SAAS-06)
- **RP-46 · Piloto externo** con 2 o 3 inmobiliarias antes de vender. (PIL-02)
- **RP-49 · Propiedad intelectual.** No se presenta como patentado (la ley mexicana de propiedad industrial no considera invención a los programas de cómputo por sí mismos). Protección: obra ante INDAUTOR, marca ante IMPI, secreto industrial con convenios de confidencialidad y licencias, confirmado con abogado de propiedad intelectual (DEC-16). Obra y marca pueden registrarse sin abrir esta etapa.

**Costo de esperar:** agregar después la frontera por empresa a tablas, permisos y respaldos con migración planeada y ensayada; costo aceptado para no complicar hoy el sistema de Fortius.

### Reglas reemplazadas

Hasta el 13/11/2026, en el historial (§18); las de entregas cerradas del 14/11/2026 (LV-09 y FLX-01), en el §31.8: [`docs/erp-crm/historial-del-plan.md`](historial-del-plan.md). Cada reemplazo nuevo se anota aquí (fecha · regla anterior y dónde estaba · regla vigente) y pasa al historial al cerrar la entrega.

| Fecha | Antes | Ahora | Por qué |
|---|---|---|---|
| 14/11/2026 | Barra superior con píldoras (LV-08, DEC-35) | Menú lateral (LV-09) | El titular aprobó el «panel desde cero» en localhost. |
| 14/11/2026 | Panel azul de la operación (LV-06, boceto D) | Encabezado claro con el riel de diez etapas (LV-09) | Misma aprobación. |
| 14/11/2026 | RP-58: cinco secciones principales | Seis secciones, con Trámites (TRA-01, LV-09) | El titular pidió Trámites en el menú («Sí, en la barra», 13/11/2026). |
| 16/11/2026 | El panel `/admin` y su rediseño LV-09 (menú lateral, riel de etapas, paleta borgoña y Archivo) | El panel nuevo `/panel` con doce secciones (Hoy, Bandeja, Consultas, Personas, Inmuebles, Asuntos, Agenda, Formatos, Trámites, Dinero, Equipo, Herramientas) más Configuración, y el Sistema de diseño Fortius (RP-100, RP-104) | El titular decidió que los bocetos mandan sobre lo construido. LV-09 y RP-58 quedan como historia del panel viejo. |
| 16/11/2026 | Pendiente de decidir (propuesta AUD-01, hallazgo 1): RP-93, el comprador nunca es cliente y no hay operación para él | Si el titular acepta, la búsqueda del comprador es un asunto (RP-106, RP-108); hasta entonces RP-93 sigue vigente | El boceto de Personas del 14/11/2026 ya trata al comprador como cliente. No se reescribe RP-93 sin visto bueno. |
| 14/11/2026 | RP-93: compradores y arrendatarios nunca son clientes ni abren expediente | Son clientes desde que firman su contrato, con su papel en cada operación | El titular aprobó el panel flexible y confirmó el registro el mismo día. |
| 14/11/2026 | RP-96 y B-13: requisitos de protección que nunca se saltan | Avisos anotados en el historial (RP-100) | Misma aprobación; aplica con FLX-03. |
| 14/11/2026 | RP-79 y RP-04: motor de procesos con editor que valida cada operación (MOT-01 a MOT-04) | Guías editables que sugieren y avisan (FLX-03) | DEC-50 y RP-100; poda aprobada. |
| 15/11/2026 | Freno de la firma de TRA-01: no se firma una venta con hipoteca sin la cancelación inscrita | Aviso anotado (RP-100) | El titular aprobó la lista de FLX-03; aplica cuando se construya. |
| 15/11/2026 | RP-95: no se publica un compartido sin la autorización escrita | Aviso anotado (RP-100) | Misma aprobación. |
| 15/11/2026 | DEC-41: visita antes de la firma solo con carta y autorización del director | Aviso anotado (RP-100) | Misma aprobación. |
| 15/11/2026 | B-04 y RP-87: se avanza una etapa a la vez y con su candado | Se puede pasar a cualquier etapa, con aviso de lo que quedó atrás | Misma aprobación. |
| 14/11/2026 | «Operaciones» y «operación» en el panel | «Asuntos» y «asunto» (DEC-64) | Pedido del titular. |
| 15/11/2026 | DEC-51 y DEC-65 (punto 1): riel de diez etapas, solo con venta o renta | Riel con las etapas de la guía de cada tipo de asunto; sin guía, sin riel (DEC-55) | Pedido del titular al revisar Asuntos: inspecciones, opiniones de valor y trámites no caben en diez etapas. |

### Proceso de comercialización de un inmueble — definición del titular, 15/10/2026

El panel se adapta a este proceso, que prevalece sobre nombres de etapa anteriores. Ruta del propietario (`captacion`); la del comprador se une en «Visitas y ofertas».

**Lógica del orden:** conocer → verificar → formalizar y preparar → promover → negociar → cerrar y entregar.

| # | Etapa | Qué se hace | Para qué |
|---|---|---|---|
| 0 | **Captación** | Conocer al propietario, su objetivo y el inmueble; quién autoriza la venta; información inicial. | Saber qué necesita y si se puede atender. |
| 1 | **Verificación y precio** | Revisar documentos, características y pendientes; comparar similares; acordar precio de salida. | Detectar obstáculos; precio sustentado. |
| 2 | **Contrato y preparación** | Formalizar servicio, honorarios y autorizaciones; ficha, fotografías y plan de publicación. | Responsabilidades claras, información respaldada. |
| 3 | **Publicación y seguimiento** | Publicar en los canales acordados, datos al día, informar al propietario de consultas y avance. | Generar interesados y evaluar la comercialización. |
| 4 | **Visitas y ofertas** | Visitas con prospectos compatibles; revisar cada oferta: precio, forma de pago, plazos y condiciones. | Propuesta viable decidida con información. |
| 5 | **Cierre y entrega** | Firma con las partes y la notaría, verificar pagos, documentar llaves e inventario, seguir pendientes. | Concretar y entregar; no termina al aceptar la oferta. |

### Lo que quedó abierto de PROC y FLUJO

PROC-01 a PROC-05 y FLUJO-01 a FLUJO-07 (salvo el 04b) están construidos y en `main` (registro en [`docs/erp-crm/historial-del-plan.md`](historial-del-plan.md)). Abiertos:

- **PROC-06 (opcional):** estado interno propio para «Contrato y preparación»; requiere migración; fuera de alcance hasta nueva indicación del titular (15/10/2026).
- **FLUJO-04b (opcional):** candados del arranque a PostgreSQL y separar «Redes sociales» de «Página web» como origen; requiere migración, respaldo y ventana autorizada.
- **Ayuda en otros formatos:** notas y desplegables solo en el 07 (`src/lib/formatos/ayuda.ts`); extender al 04, 05 y demás, con la plantilla como fuente.
### Qué vamos a construir

ERP/CRM inmobiliario exclusivo de Fortius Inmuebles, con su marca, para llevar cada operación del primer contacto al cierre: personas, inmuebles, operaciones, documentos, tareas, visitas, ofertas y cobros. Tableros de dirección comercial, financiero, jurídico y técnico, más los de cada rol; cada cifra se explica con sus registros de origen. Reglas en «Dirección del producto y reglas vigentes».

Sitio público y panel son una sola aplicación (RP-01). Adaptarlo a otras inmobiliarias es etapa posterior, en pausa. Se amplía por módulos; no se reconstruye desde cero.

### Funciones del producto ampliado

*Nota del 18/10/2026: Finanzas, Análisis territorial, Portal de clientes y las integraciones (firma, OCR, IA, rutas) se retiraron del panel el 15/10/2026; volver a ponerlos es trabajo nuevo (FIN, EXT-05, EXT-06, EXT-09, EXT-10, EXT-11).*

Alcance tomado de la imagen «Foto 1.jpg» (12 de octubre de 2026). Comparten personas, inmuebles y expedientes. Son funciones solicitadas, no implementadas por estar aquí.

| Grupo | Funciones que deberá ofrecer Fortius | Entregas relacionadas |
|---|---|---|
| Gestión empresarial | CRM, ERP, inventario, perfiles de clientes y portal privado con lo que Fortius les comparta. | FLX-01 a FLX-07, PUB-01, FIN-01/02 y EXT-10. |
| Tableros e inversión | Cuatro tableros; calculadoras con TIR y VAN, flujos, presupuestos y escenarios guardados por operación. | TAB-01/02/03/04, FIN-01/02 y EXT-08. |
| Información geográfica | Mapas de inventario y comparables, zonas, rutas de visitas y capas con fuente y fecha. | TEC-01, VIS-01 y EXT-09. |
| Documentos y revisión jurídica | Contratos y PDF desde modelos revisados, expedientes digitales, revisión asistida de cláusulas y búsqueda RAG citando documento, versión y página. | DOC-01, LEG-01 y EXT-06. |
| Etapa posterior, en pausa (17/10/2026) | Otras inmobiliarias: datos, marca y procesos por empresa, alta guiada, planes y piloto externo. | SAAS-01 a SAAS-03, SAAS-05, SAAS-06 y PIL-02. |
| Trabajo diario profesional (17/10/2026) | Barra de comandos, atajos, acciones masivas, interfaz simplificada (32 correcciones), barra contraíble, fijados, vista previa lateral, listas inteligentes, planes de seguimiento, íconos/colores/formas de estado, captura rápida, ficha única de la operación, descarga con advertencia, expediente en un archivo, guías por tipo, confianza al guardar, bandeja «Para ti», disciplina comercial, fichas 360°, aprobaciones, reglas fiscales con vigencia, metas, soporte e IA con revisión humana. | SIM-01 a SIM-12, NAV-01 a NAV-14, LV-01 a LV-04, COR-01/02, CAP-01 a CAP-04, FCH-01 a FCH-11, MOT-01 a MOT-04, HER-01 a HER-04, UX-02 a UX-05, CRM-02, CRM-03, INV-01, DAT-02, DOC-10 a DOC-13, FIN-03, APR-01, FIS-01, TAB-05, SOP-01, EXT-01 y EXT-11; desde el 14/11/2026 parte las absorbe el panel flexible (FLX-01 a FLX-07, ver `PLAN.md`). |

*(Orden actualizado en «Orden vigente».)* Primero se entregó captación y próxima acción; luego documentos, finanzas y tableros; inversión, mapas, portal e IA van por módulos con pruebas y siguen pendientes. Aceptar el núcleo inicial no acredita el producto ampliado.

### Alcance del sistema

1. Confiabilidad: recuperación, autenticación, controles de publicación, observabilidad, entornos y permisos.
2. Personas: prospectos, clientes, propietarios, compradores, representantes, agentes, organizaciones; varios papeles sin duplicar identidad.
3. Inventario: publicable separado de interno; propietarios, responsables, evidencias y estado de publicación.
4. Operaciones: expediente como primera referencia; etapas, requisitos, excepciones, tareas y agenda.
5. Comercial: visitas, retroalimentación, ofertas/contraofertas, próximos pasos y vínculo estable con las carteras.
6. Documentos: borrador, revisión, emisión, copia firmada y archivo, con versión y autor.
7. Técnico: levantamientos, fuentes, discrepancias, fotos y revisiones.
8. Jurídico: requisitos, hallazgos y revisión profesional; el software no reemplaza dictámenes.
9. Financiero: presupuestos, obligaciones, comprobantes, cobros/egresos, comisiones y exportación; no se presuponen estados certificados, CFDI ni conexión bancaria.
10. Cuatro tableros (comercial, financiero, jurídico, técnico) con filtros y detalle.
11. UX: navegación modular, búsqueda, vistas guardadas, formularios por contexto y trabajo por rol.
12. PWA: instalación y uso conectado; campo adicional se evalúa aparte.
13. Crecimiento: paginación, integridad concurrente, archivos, adopción, documentación y medición.
14. Inversión: TIR, VAN, flujos, presupuestos y rentabilidad por escenario; supuestos separados de movimientos efectivos.
15. Geografía: mapas, zonas, rutas y capas con procedencia; límites y permisos para ubicaciones privadas.
16. Portal de clientes: acceso externo restringido a lo compartido de su operación, separado del equipo.
17. IA documental: búsqueda con fuentes y revisión de cláusulas; propuestas revisables ligadas al expediente, sin aprobación jurídica automática.
18. Calidad y soporte: monitoreo de errores, pruebas de uso medidas, ayuda y reporte de problemas.
19. Otras inmobiliarias: etapa posterior, en pausa (ver «Dirección del producto»).

### Restricciones globales

- Conservar identidad Fortius, tipografías, contraste, animaciones pertinentes y accesibilidad; panel solo con marca Fortius (RP-01).
- Conservar web pública, SEO, formularios, herramientas financieras, PDFs, inventario, rutas y edición de contenido.
- Conservar las propiedades demo; excluirlas o incluirlas explícitamente en reportes, sin borrarla.
- Reutilizar componentes y contratos; sin dependencias nuevas sin necesidad comprobada.
- Permisos en servidor y PostgreSQL/RLS; ocultar un botón no concede ni revoca acceso.
- Control de versiones y conflictos; nunca sobrescribir en silencio una captura concurrente.
- Sin datos personales en evidencias, logs, fixtures o documentación; usar sintéticos.
- Verificar manuales y normativa vigente para reglas jurídicas/fiscales; cada regla con responsable y versión.
- No prometer conversión, rentabilidad, seguridad total, rendimiento ni disponibilidad sin medición.
- Aprobar antes de cambios persistidos o de infraestructura según alcance y autorización vigente; la aprobación documental inicial autoriza implementar, no producción.

### Decisiones del titular (DEC)

Todas tomadas; lo abierto dentro de alguna (p. ej. DEC-02, DEC-04, DEC-06) se sigue en «Por decidir» de `PLAN.md`. Notas «en local»/«en `main`» son de su fecha; estado vigente en `PLAN.md`.

| ID | Decisión | Tratamiento |
|---|---|---|
| DEC-01 | Mantener un monolito modular Next.js/Supabase | Recomendación técnica base del plan. |
| DEC-02 | Empezar por captación y venta; luego compra y renta | **Decidido y construido:** venta del propietario con guía completa; compra, renta e inversión con sus pasos. Abierto: recorrido propio de renta (COR-04, MRP-01). |
| DEC-03 | Roles finos y permisos por acción (RP-05): director, coordinador, asesor, asistente, jurídico, contabilidad y aliado externo; permisos propios para ver precio mínimo, ver comisiones, aprobar descuentos, eliminar y exportar | Diseñar la matriz; confirmar responsables y visibilidad antes de activar. Cuentas `admin` y `editor` pasan a los papeles nuevos sin perder acceso. |
| DEC-04 | Propiedad/persona puede tener varias relaciones; una persona puede tener varios papeles | **Decidido** (RP-27, FLX-04). Abierto: vocabulario de papeles y pruebas, al diseñar FLX-04. Vincular no certifica titularidad. |
| DEC-05 | Distinguir estados comercial, documental y financiero | **Decidido** (RP-29, RP-85, RP-88). Abierto: criterios de avance, excepciones y responsables por ruta (MRP-01). |
| DEC-06 | RPO/RTO, retención y tratamiento de archivos | Objetivos aprobados: copia diaria/RPO 24 h, RTO 8 h. Pendientes: custodia, retención y capacidad demostrada. |
| DEC-07 | Reglas de honorarios, impuestos capturados, monedas y tipo de cambio | Validan propietario y especialista; sin tasas por defecto. |
| DEC-08 | PWA conectada como primera versión; offline sensible desactivado | Confirmar qué captura de campo hace falta antes de diseñar almacenamiento local. |
| DEC-09 | Fuente de verdad y papel de cualquier sistema externo | Inventario antes de sincronizar o reutilizar. Sin dependencia productiva demostrada. |
| DEC-10 | Acceso a configuración GitHub/Vercel y entorno aislado | Configuración Vercel y probes documentadas; pendientes protección de main, backend preview y destino de recuperación. **Titular, 17/10/2026 (I-01):** la base solo tiene datos de prueba; se autoriza escribir ensayos (crear, guardar, borrar) hasta que cargue el inventario real; entonces vuelve solo lectura. Autoriza publicar inmuebles de prueba como ejemplo y cambiar permisos o configuración de Supabase cuando haga falta, explicándolo antes. Sin mensajes a personas reales. Escrito en `AGENTS.md`. |
| DEC-11 | Fuentes, precisión y servicios de mapas/rutas/comparables | Definir datos, permisos de uso, cobertura, precisión y costos antes de contratar o publicar una ubicación. |
| DEC-12 | Modelos de inversión y supuestos por escenario | Definir periodicidad, fechas, monedas, tasa de descuento y alcance proyecto/financiación/inversionista; validar método y casos de prueba. |
| DEC-13 | Información y acciones disponibles para clientes externos | Aprobar quién accede, qué se comparte, qué puede solicitar y cómo se concede o revoca. Sin reutilizar permisos de asesor. |
| DEC-14 | Corpus y tratamiento por el servicio de IA | Antes de datos reales: documentos autorizados, proveedor, conservación, costo y evaluación de citas, abstención y aislamiento. Aplica a EXT-11. |
| DEC-15 | Abrir la etapa posterior (otras inmobiliarias) | Decidido el 17/10/2026: por ahora exclusivo de Fortius y con su marca. Al abrirla: nombre comercial, modelo (recomendado: una base con frontera por empresa en RLS; alternativa: instalación por cliente) y criterios. No bloquea entregas actuales. |
| DEC-16 | Protección de la propiedad intelectual | Cuando sea. Con abogado de propiedad intelectual: registro de obra (INDAUTOR), marca (IMPI), secreto industrial, convenios de confidencialidad y licencia para clientes. |
| DEC-17 | Probabilidad por etapa y metas | Fortius define probabilidades por etapa y metas por asesor y periodo, ajustables en Configuración. |
| DEC-18 | Cobro de suscripciones (etapa posterior, en pausa) | Proveedor, moneda, facturación (CFDI) y solo lectura por falta de pago. |
| DEC-19 | Monitoreo de errores en producción | Proveedor, retención, alertas y filtro de datos personales (OBS-01). |
| DEC-20 | Qué hace falta para liberar el PDF del contrato 09 | Resuelta el 12/11/2026: el titular descartó el registro PROFECO; PDF del 09 liberado (COR-12). |
| DEC-21 | Aviso de edición simultánea (NAV-11) | **Decidida el 14/11/2026:** no por ahora; NAV-11 archivada. Protege el control de versión (409). |
| DEC-22 | Lista final de preguntas de la entrevista por tipo de operación | El titular valida la lista base (historial del plan, §28.3) antes de FLX-04. |
| DEC-23 | Contenido de los procesos y módulos de fábrica | El titular (y revisión jurídica si aplica) valida requisitos y documentos de cada guía antes de clientes reales (FLX-03). |
| DEC-24 | Metas de las pruebas de uso | El titular fija tiempos meta (p. ej. primer contacto en menos de un minuto) antes de medir (RP-47). |
| DEC-25 | Lugar de «Notas del equipo» | **Decidida el 17/10/2026:** sin página aparte; botón discreto en inmueble y operación (RP-99). |
| DEC-26 | Aprobación de la matriz de reglas por ruta (MRP-01) | El titular la aprueba antes de COR-04 y MOT-01. **Aprobada el 26/10/2026.** |
| DEC-27 | Nombres sencillos de los requisitos (RP-86) | **Decidido por el titular el 12/11/2026:** «Firma acreditada», «Pagos para entregar cumplidos según contrato» y «Aviso y controles de privacidad revisados»; en renta siguen «Contrato de arrendamiento firmado» y «Depósito y primera renta recibidos». Aplicado en COR-07. |
| DEC-28 | Detalles de prospecto y cliente (RP-90 a RP-92) | **Decidida el 17/10/2026:** grupos A y B de `docs/erp-crm/CUESTIONARIO_TITULAR.md` (archivo ya borrado) respondidos; quedan en RP-90 a RP-98. Falta agregar al catálogo el contrato de intermediación para renta (RP-97). |
| DEC-29 | Formas de pago, tipos de inmueble y municipios (B-06, B-07) | El titular manda pasos y documentos de cada forma de pago, tipo y municipio; el agente arma la tabla para su aprobación. Alimenta MRP-01 y guías de FLX-03. |
| DEC-30 | Validez jurídica de la firma electrónica propia (FIR-01) | Antes de usarla con clientes, el abogado de Fortius confirma para qué contratos sirve en Baja California y qué evidencia guardar. Mientras, firma en papel y se sube el archivo (RP-97). |
| DEC-34 | Plan de comercialización 10 | **Decidida el 29/10/2026:** sigue la plantilla del 26/10/2026 (`04_Metodologia/02_Comercializacion/10_PlanComercializacion.docx`), formulario con casillas que reemplaza el plan en prosa. Cambios: siete tipos de DEC-32 en vez de cuatro casillas; el panel calcula precio promedio por m² construido de comparables y precio técnico (promedio × construcción del inmueble); «Baños (completos / medios)» son dos datos; al crearlo se proponen superficies, recámaras, baños, clave catastral, folio real, valor del 07 y datos del 09. Sin los apartados en prosa que el Word ya no trae (estrategia, plazas o conjuntos, aprobación con acuse). Código en `src/lib/formatos/plan.ts` y `src/lib/formatos/documento/plan.ts`. |
| DEC-35 | Barra superior en todo el panel | **Decidida el 30/10/2026 (LV-08) y reemplazada el 14/11/2026:** la sustituye el menú lateral de LV-09 (ver «Reglas reemplazadas»). |
| DEC-36 | Una sola lista de personas | **Decidida el 30/10/2026 (LV-08):** Contactos es una lista con la etapa como chip (Nuevo · En seguimiento · Cliente · Descartado), sin pestañas Prospectos/Clientes. Se conservan fichas y direcciones. |
| DEC-37 | Eliminar solo desde dentro | **Decidida el 30/10/2026 (LV-08):** sin bote de basura en filas de Operaciones ni citas de Agenda; eliminar en el «⋯» de la operación o cita, con «Deshacer» (RP-16); se recupera en Eliminados. |
| DEC-48 | ¿Puede el asesor pausar o rechazar un encargo ya aceptado? | **Decidida el 13/11/2026:** sí, «Pausada» o «Rechazada» tras aceptarlo. Construido en `feat/integracion` (C-94, 90e9618). |
| DEC-49 | Trámites con pasos (TRA-01) | **Decidida por el titular (13 y 14/11/2026):** boceto y pantalla aprobados; primer trámite, cancelación de hipoteca; Trámites en el menú; sin esperar al notario, con fuentes oficiales: Infonavit o Fovissste directo al Registro, banco ante notario (Retys BC-DRPPC-014 y 011, gob.mx FOVISSSTE-00-012-A). Comprobantes solo privados; la prueba de un paso cerrado no se borra mientras siga cerrado. |
| DEC-50 | Panel flexible (FLX) | **Decidida por el titular (14/11/2026):** el panel se ordena por cómo llega el trabajo (RP-103): Bandeja (guardar sin llenar nada, con recomendación de destino), personas, inmuebles (aun sin dueño conocido) y asuntos; la metodología es guía que sugiere; nada frena, solo avisa (RP-100); compradores y arrendatarios son clientes al firmar (RP-93); un perfil se abre con nombre, teléfono, motivo, canal preferido y en qué quedaron (RP-94 igual). Lenguaje visual de Trámites (lista, detalle con «lo que sigue», columna de propiedades). «Asuntos» y «personas» son nombres de trabajo por decidir. Etapas en `PLAN.md`, paquete FLX. |
| DEC-51 | Cómo se ve el panel por dentro (LV-10) | **Decidida por el titular (14/11/2026):** las direcciones A (tipo Attio y Folk), B (Linear y Raycast) y C (vitrina) se juntan en un solo sistema, sin elegir ni sacrificar capacidades. A: caras con color propio, tablas completas, edición en su lugar con «Deshacer». B: atajos, Ctrl K para buscar y actuar, densidad Cómodo/Compacto por usuario. C: fotos de inmuebles en todas partes, riel de etapas por fila (etapas de la guía del asunto, DEC-55) y bloque oscuro de «lo que sigue». Hoy con lo urgente en grande, Bandeja como correo, Personas como agenda con cara, Más como lanzador. Se mantienen menú lateral, riel, lenguaje de Trámites, Archivo e Iconoir; sin degradados, vidrio ni emojis. Boceto: artifact «Panel Fortius completo» (copia en `tmp/critica-panel-1411/fortius-panel-completo.html`, fuera de git). Etapas en `PLAN.md`, LV-10. |
| DEC-52 | Tecnologías de interfaz | **Decidida por el titular (14/11/2026):** shadcn/ui sobre Radix (menús, paneles laterales, diálogos, pestañas), cmdk para Ctrl K, Sonner para avisos con «Deshacer», Motion para animaciones cortas (respetando «reducir movimiento»). Entran dentro de `src/components/admin/kit.tsx` sin cambiar nombres ni funcionamiento; cada una se instala cuando su etapa de LV-10 la pide. El sitio público conserva GSAP y Scroll Motion. Se puede cambiar una librería por otra equivalente si una deja de servir (Tremor no es compatible con React 19 y no se usa). |
| DEC-64 | Nombre de «Operaciones» | **Decidida por el titular (14/11/2026):** en pantalla «Operaciones» es **«Asuntos»** y una operación es **un asunto** (menú, títulos, botones, avisos, Ctrl K y ayuda: «Nuevo asunto», «Abrir asunto», «el asunto»); cierra el nombre de trabajo de DEC-50. No cambian rutas (`/admin/operaciones`), tablas, API, folios `EXP-` ni código. Formatos, contratos y PDF conservan «operación» como término jurídico o de plantilla. Entrega NOM-01 en `PLAN.md`. |
| DEC-65 | Asuntos que no son venta ni renta | **Decidida por el titular (14/11/2026):** todo trabajo es un asunto, sin metodología única. Casos: terreno de un colega con avalúo y levantamiento; sucesión con inmueble invadido y heredera en EE. UU.; cancelación de hipoteca y crédito Infonavit con comprador listo; compraventa a plazos con juicio de desahucio, rehabilitación y venta; cesión de derechos litigiosos en sentencia. (1) Asunto libre con título, objetivo y guías elegidas o ninguna; el riel de diez etapas solo con venta o renta. (2) Varias guías seguidas, con la siguiente marcada. (3) Desde documentos en la Bandeja se abre un asunto con folio y luego se ligan personas e inmuebles. (4) Gastos por asunto con quién paga y comprobante. (5) Guías nuevas: sucesión o adjudicación, recuperación de inmueble invadido, juicio de desahucio, seguimiento de juicio, rehabilitación con presupuesto y crédito Infonavit del comprador. Las jurídicas pasan antes por el abogado. En `PLAN.md`: FLX-03 (1 a 3), FLX-08 (5), FLX-09 (4). |
| DEC-55 | Riel según el tipo de asunto | **Decidida por el titular (15/11/2026):** amplía el punto 1 de DEC-65. Cada guía (venta, renta, compra, búsqueda de renta, inspección, opinión de valor, cancelación de hipoteca y las nuevas) trae sus etapas y el riel dibuja esas, no siempre diez. El tipo se elige al abrir y puede cambiar: se conserva lo hecho y se anota en historial, sin frenar (RP-100). Sin guía, sin riel, solo «lo que sigue»; con varias guías (DEC-65), el riel muestra la actual. Tablero agrupado por urgencia, no por tipo ni etapa (titular, 15/11/2026); la etapa se ve dentro del asunto. Se construye con FLX-03 (guías como datos). **Parte B construida en `feat/integracion` (15/11/2026):** venta y renta con diez etapas; inspección (Solicitud y alcance · Visita al inmueble · Hallazgos con fotos · Informe entregado), opinión de valor (Entrevista · Levantamiento · Documentos · Opinión entregada) y cancelación de hipoteca (pasos del trámite según quién dio el crédito, que avanzan solos al cerrar cada paso) guardan su etapa en la guía; el tablero pide el tipo, con Venta de entrada; se puede empezar en cualquier etapa y lo anterior queda como aviso. Falta parte C: asunto sin guía, varias guías seguidas y «Nuevo asunto» desde la Bandeja. |
| DEC-66 | Cuentas del equipo al arrancar (SEG-01) | **Decidida por el titular (15/11/2026):** (1) al arranque solo director y asesor; coordinador, asistente, jurídico y contabilidad (RP-05) cuando haya quién. (2) De una persona de otro asesor, el asesor ve que existe y quién la atiende, sin teléfono, documentos ni notas. (3) Documento suelto de Bandeja: lo ven quien lo subió y el director; ligado, quien acceda a esa persona, inmueble o asunto. (4) Dos pasos solo para el director; asesores después (AUT-01). Sigue lo del 17/10/2026: solo el director administra, elimina, exporta, publica y reasigna; precio mínimo y comisiones solo para quien captó y el director; el asesor que no captó ve solo lo público (DEC-43). |
| DEC-62 | Cambios de base del panel nuevo (PN-02) | **Decidida el 16/11/2026:** el titular aprueba las siete migraciones de PN-02. Se publican después, cuando revise el panel completo; se aplican al integrar en `main`. |
| DEC-53 | Dinero: cómo se cuenta lo cobrado | **Decidida el 16/11/2026:** un recibo 18 marcado como pago total salda la cuenta aunque el importe sea menor, y la diferencia se muestra como descuento. Pesos y dólares van en renglones separados, sin convertir: un recibo en dólares descuenta solo de una comisión en dólares. Cuenta como cobrado el importe del último recibo con PDF; si después cambió sin volver a generar el PDF, la fila avisa «Recibo con cambios sin PDF». |
| DEC-54 | Bandeja: dónde esperan los archivos sin destino, y fotos de un inmueble publicado | **Decidida el 16/11/2026:** los archivos esperan en el servidor, en la carga privada de Fortius, y se ven desde cualquier dispositivo. Necesita un cambio de base y su anotación en el registro de privacidad. Una foto que la Bandeja guarda en un inmueble publicado entra a sus fotos sin mostrarse en el sitio; se publica desde la ficha del inmueble, porque guardar y publicar siguen siendo pasos distintos. |
| DEC-63 | «Se logró» en un asunto | **Decidida el 16/11/2026:** se marca en un solo paso, cierra el asunto y avisa qué quedó sin completar, sin frenar. Necesita un cambio en el servidor (hoy la base exige avanzar una etapa a la vez). |
| DEC-56 | Apartados | **Decidida el 16/11/2026:** a veces Fortius recibe y guarda un apartado. Se registra con comprobante y se entrega al propietario, y «Por entregar» se queda en Dinero. La promesa 15 dice que Fortius no custodia la garantía: hay que revisarla con el abogado. |
| DEC-57 | Pestañas de una ficha y la regla del desplegable | **Decidida el 16/11/2026:** las pestañas (Resumen, Documentos, Notas y Actividad) son excepción y se quedan, porque cambian de sección y no son una elección de dato. La regla del desplegable sigue para elegir valores. |
| DEC-59 | Marca del sitio público | **Decidida el 16/11/2026:** el Sistema de diseño Fortius también reemplaza la marca del sitio público (Schibsted Grotesk, azul `#061F3F` y borgoña). **Todavía no se aplica:** el sitio no cambia hasta que el titular lo pida. |
| DEC-60 | Bandeja y Consultas | **Decidida el 16/11/2026:** son dos entradas distintas: la Bandeja recibe archivos; Consultas, personas que escriben. No se unen (cierra AUD-01, hallazgo 4). |
| DEC-61 | Frenos de protección | **Decidida el 16/11/2026:** sin frenos de proceso: nada impide avanzar, todo avisa (cierra AUD-01, hallazgo 2). No son frenos y se conservan: RLS, roles y permisos, validación de datos, control de versión, «guardar no es publicar» y no exponer datos privados en el sitio. |
| DEC-58 | Cuándo se anota la comisión | **Decidida el 16/11/2026:** quién captó, quién vendió y la comisión se anotan al firmar la compraventa o el contrato de renta, y desde ahí se ven en «Te deben», aunque se cobre después. |
| DEC-47 | ~~Guía de pantalla~~ (reemplazada el 14/11/2026, ver «Reglas reemplazadas»): ¿se abre sola en las ocho pantallas la primera vez (como hoy) o solo en Hoy, y en las demás con el botón «?»? | **Decidida por el titular (12/11/2026, confirmada al juntar las ramas)** con la propuesta del agente (11/11/2026, C47–C60): solo Hoy abre su guía sola la primera vez; en las demás, botón «Ayuda» o tecla «?», con un punto sobre «Ayuda» mientras no se vea (V07). Reemplaza la anotación de que nunca se abría sola. |
| DEC-46 | Estados visibles del prospecto | **Decidida el 11/11/2026:** visibles Nuevo, En seguimiento y Descartado, y «Cliente» aparte. La base guarda seis estados: Contactado, En evaluación y Activo se ven como «En seguimiento»; «Cerrado» se ve en quien lo tenía, no se elige y va con descartados. Construida con SIM-07 (`src/lib/admin/person-view.ts`). |
| DEC-45 | Nombre del asistente único para una persona que llama: «Atender a alguien», «Nueva llamada» u otro; hoy se llama «Nueva operación» aunque tres de sus cinco salidas no abren operación | **Decidida por el titular (12/11/2026): «Atender a alguien»** (propuesta del agente, 11/11/2026, C48). Aplicada en local: en «+ Nuevo» va primero «Atender a alguien» y luego «Nueva operación» (que abre ya en «Vender»); el nombre es una constante. |
| DEC-44 | En celular, «Captura por lista» para el levantamiento y la entrevista además de la captura sobre el documento (DEC-31) | **Decidida el 12/11/2026** (propuesta del agente, 02/11/2026, tras probar el 04A a 390 px): en celular, lista sobre las mismas celdas, una pregunta por pantalla con «No sabe», cámara y dictado; lo capturado aparece en la hoja; el documento en vivo se conserva (fase 4). |
| DEC-43 | Alcance del asesor sobre inmuebles ajenos: ¿los ve con todos sus datos (como hoy) o solo con los públicos (RP-99)? ¿Puede publicar él mismo o solo el director? | **Decidida el 12/11/2026:** de inmuebles ajenos ve solo lo público (fotos, precio, descripción) para ofrecerlos; edita solo su asesor o el director; publicar siempre lo autoriza el director. Se construye en COR-23 (fase 2). |
| DEC-42 | Un solo «siguiente paso» por persona y por operación, respaldado por una tarea; citas solo con hora; notas pegadas a persona, inmueble u operación; retirar el tablero de notas sueltas | **Decidida por el titular (12/11/2026)** (propuesta del agente, 02/11/2026, bloque G1): el siguiente paso es siempre una tarea con fecha, la misma en ficha, Hoy y Agenda; la crean o mueven «Registrar contacto», la decisión del encargo y la entrevista (en `main`, «Registrar contacto» guarda `perfil.proximoContacto` y `proximaAccion`, no una tarea); al completarla se pide la siguiente; citas solo con hora; notas en inmueble y operación (E-01); se retira el tablero suelto y Hoy tiene «Avisos» que solo escribe el director. **Construida en local (12/11/2026), sin integrar en `main`:** (1) sin migración: tarea de seguimiento de la persona, sin operación (`src/lib/admin/next-step-task.ts`), creada o movida por «Registrar contacto» (ficha y Hoy); al completarla (Hoy, Tareas o ficha) se pregunta «¿Qué sigue con…?» y la respuesta es la nueva tarea; con ella, el «próximo contacto» del perfil ya no se ve en Hoy, Agenda, Contactos, Reportes ni ficha. (2) El alta de un interesado en «Nueva operación» deja su próxima acción como tarea; «Editar ficha» ya no toca el próximo contacto; completar la última tarea abierta de una operación pregunta «¿Qué sigue en la operación…?» y la respuesta es su «Próxima tarea»; entrevista y decisión del encargo ya creaban tareas (migraciones `20261014180000` y `20261014215000`). (3) `supabase/migrations/20261112232000_resolution_moves_followup.sql` (autorizada por el titular el 12/11/2026): cambiar la decisión del encargo mueve su tarea abierta (título, fecha y motivo); si ya se completó, crea otra; no cancela otras. (4) Botón «Notas» en ficha del inmueble y «Más opciones» de la operación, en panel lateral (la de la operación solo la ve quien puede ver a su cliente); sale «Notas del equipo» (`/admin/notas` lleva a Hoy y deja Herramientas; las notas existentes siguen en base e Historial); «Avisos» de Hoy solo los escribe o quita el director, regla también en la base (`supabase/migrations/20261112233000_avisos_solo_director.sql`). Ambas migraciones probadas en base local aislada; se aplican al integrar en `main`. |
| DEC-41 | Captación dirigida: cuando hay prospectos para una colonia sin inventario y se encuentra un inmueble, ¿se puede enseñar a ese prospecto antes de firmar la intermediación? RP-91 hoy lo prohíbe, también en privado | **Decidida por el titular (12/11/2026)** como única excepción a RP-91 (reescrita en su lugar), según propuesta del agente (02/11/2026): visita con un prospecto concreto a un inmueble «En evaluación», con carta breve de autorización de visita firmada por el propietario (texto que valida el abogado) y autorización del director con motivo (COR-20); sin publicar ni mandar fotos; la 02 puede ser por teléfono ese día y levantamiento y dictamen en paralelo (MRP-01). **Construida en local el 12/11/2026 (migración `20261112235000_visita_antes_de_la_firma.sql`, sin aplicar):** tarjeta «Visita antes de la firma» (inmueble «En evaluación», sin publicar ni intermediación revisada): el director autoriza la visita con un interesado (se sugieren prospectos registrados), con la carta (archivo privado) y el motivo; la base exige director y carta, anota quién y cuándo, y solo el director la retira. Operación, Operaciones y Hoy muestran «Visita autorizada antes de la firma» hasta revisar la intermediación. El asesor la ve, no la autoriza. No publica ni abre el inmueble a otros. Pruebas: `tests/backend/visita-previa-database.test.ts` y `tests/admin/visita-previa.test.tsx`. **15/11/2026:** con FLX-03, carta y autorización del director pasan a aviso; enseñar sin ellas queda anotado (RP-100). |
| DEC-40 | Inmuebles compartidos por otra inmobiliaria (RP-95, PUB-02): qué debe decir la autorización escrita de la inmobiliaria, qué texto lleva la etiqueta pública («En colaboración con…») y si el aliado se registra como persona del panel | **Decidida el 12/11/2026**, con un cambio a la propuesta del agente (02/11/2026): autorización escrita con fecha, firmante e inmueble, que confirme que su contrato con el propietario permite compartir y publicar (texto que valida el abogado); la ficha pública no nombra a la otra inmobiliaria: dice «Inmueble en colaboración» y lo no verificado por Fortius lleva «Según la inmobiliaria aliada». El aliado se registra en el panel con su porcentaje. Confirmado por el titular al juntar las ramas (12/11/2026); PUB-02 lo aplica: la base proyecta solo la marca de colaboración, nunca el nombre. |
| DEC-39 | Qué preguntar en la llamada y en la 02 cuando el inmueble tiene un problema (invadido u ocupado sin permiso, crédito en mora, herencia sin resolver, adeudos) y qué documentos pedir en cada caso | **Aprobada como base el 12/11/2026** (propuesta del agente, 02/11/2026, por validar con el abogado): en la llamada, pregunta con opciones y detalle (CAP-05); en la 02, «Invadida u ocupada sin permiso» y, con crédito, «¿Está al corriente?» y «¿Sabe cuánto debe?» (CAP-06); con invasión, pedir denuncia o demanda y pasar al abogado antes del levantamiento (COR-14). CAP-06 construida ese día y activa por decisión del titular; el abogado revisa después y sus cambios se aplican sobre lo construido. |
| DEC-38 | Pestaña «Ajustes» de la operación | **Decidida el 11/11/2026** al aprobar SIM-18: se retira; «Datos de la operación», «Corregir etapa» y «Eliminar operación» van en «Más opciones» del encabezado (antes, del panel azul que LV-09 reemplazó); los datos abren en panel lateral. |
| DEC-33 | Plaza o conjunto con varios locales | **Decidida el 28/10/2026: según el caso.** Plaza vendida o rentada completa: un inmueble, una operación, levantamiento 04G. Locales u oficinas por separado: cada uno es inmueble con operación y folio (RP-94), ligado con «Pertenece a la plaza o conjunto» (`conjunto`, slug de la plaza). La plaza guarda datos comunes; en el panel muestra y agrega locales; en el sitio muestra los publicados y cada local enlaza a su plaza. Una plaza no pertenece a otra. Migración `supabase/migrations/20261028130000_property_conjunto.sql` (validación y proyección pública), se aplica al integrar en `main`. |
| DEC-32 | Lista de tipos de inmueble | **Decidida el 27/10/2026:** una lista en todo el sistema con los siete tipos y su levantamiento: Terreno (04A), Casa (04B), Departamento (04C), Oficina (04D), Local comercial (04E), Nave o bodega (04F), Plaza o conjunto (04G). Sin «Otro»; el primer contacto conserva «Todavía no lo sé». La plaza se publica como un inmueble más. Código en `src/lib/inmueble-tipos.ts`; migración `supabase/migrations/20261028120000_property_type_plaza.sql`, se aplica al integrar en `main`. |
| DEC-31 | Cómo se capturan los formatos (EXT-12) | **Decidida el 27/10/2026:** cada etapa muestra su formato como sale en PDF y se llena pulsando sobre el documento, como la prueba del 04B. En el 04B se quitan base y referencia, respaldos y discrepancias, y se agrega uso de suelo. Folios e identificadores los pone el sistema. |

### Criterios de producto terminado para la primera versión operativa

- Recorrido sintético prospecto → cliente → propietario relacionado → inmueble → expediente → tarea/visita → oferta → cierre documentado, sin duplicados por reintentos.
- Referencias durables de persona, inmueble y operación; renombrar no rompe vínculos.
- Dos asesores y el director (permiso de administrar) de prueba ven exactamente su alcance, también en documentos y cifras sensibles.
- Toda tarea que pide acción tiene responsable, estado y fecha o motivo de no tenerla.
- Recepción, revisión, conclusión profesional, firma y pago son hechos distintos.
- Los cuatro tableros usan fuentes identificadas; sin fuente, pendiente; el detalle reconcilia el total.
- Parciales, monedas y anuladas no se suman como cobros definitivos. Demo visible como prueba.
- El panel abre desde la instalación probada; conexión perdida y sesión caducada se entienden sin perder capturas en silencio.
- Migraciones y restauración probadas en destino aislado; publicación con checks y revisión; manual operativo y transferencia completos.

### Mapa de módulos y archivos

Ubicaciones nuevas son **propuestas**, no código existente. El nombre de una migración se genera al implementar, después de las existentes; nunca reescribir una aplicada.

| Dominio | Reutilizar | Nuevos límites propuestos |
|---|---|---|
| Identidad/capacidades | `src/lib/backend/auth.ts`, `contracts.ts`, adviser-accounts API | `src/lib/identity/capabilities.ts`; autoridad efectiva en servidor/SQL. |
| Personas/relaciones | `clientes`, `leads`, `asesores`, lead-conversion | `src/lib/personas/{types,schema,server}.ts`; relaciones persona/inmueble privadas. |
| Operaciones | expedientes API, `formatos/expediente-operations.ts` | `src/lib/operaciones/{types,schema,server,transitions}.ts`; referencia inicial `expedienteId`, sin segunda copia. |
| Agenda/actividad | `src/lib/tasks.ts`, eventos, TodayWorkspace | Acciones y vínculos explícitos; tabla de visitas/ofertas solo para hechos que eventos no cubren. |
| Documentos/legal/técnico | `src/lib/formatos`, emisiones, adjuntos, copias | Proyecciones revisables de estados y hallazgos; emitidos como snapshots. |
| Comercial | `src/lib/comercial/{types,calculate,server}.ts` | Vínculo verificable oportunidad–operación; conservar libro/revisión históricos. |
| Finanzas operativas | Decimal, formatos 08/18/19 y cartera como fuentes | `src/lib/operational-finance/{types,schema,server,calculate}.ts`; hechos SQL separados de calculadoras públicas. |
| Analítica | `admin/commercial-metrics.ts`, period-report | `src/lib/analytics/{definitions,queries}.ts`, agregados con RLS y filtros de servidor. |
| UX/PWA | shell, workspace, UI, manifiesto e iconos | Componentes de tablero; manifiesto del panel; service worker limitado si se aprueba. |
| Inversión | Decimal, presupuestos y modelos financieros actuales | Escenarios y cálculo reproducible ligados a operación; simulaciones no son hechos contables. |
| Geografía | inventario, ubicaciones, visitas y opinión de valor 07 | Coordenadas/capas/comparables/rutas con fuente y permiso; motor tras DEC-11. |
| Clientes externos | personas/operación/documentos y autenticación existentes | Portal separado del equipo; proyección compartida explícita, identidad externa y acceso comprobado en servidor. |
| IA documental | documentos privados, versiones y revisión jurídica | Índice autorizado por expediente, citas a versión/página, propuestas de cláusulas revisables y evaluación de acceso; proveedor pendiente. |

### Finanzas y diccionario mínimo de indicadores

| Indicador | Definición | Fuente / tratamiento de desconocidos |
|---|---|---|
| Contactos vencidos | Activos con próxima fecha anterior al corte local | Followups autorizados; sin fecha, aparte, no vencido. |
| Primera atención | Recepción a contacto registrado; mediana y población sin medición | `creadoEl` y `firstContactedAt`; no inferir de clics WhatsApp. |
| Conversión a cliente | Prospectos con contrato firmado (RP-90) / cohorte de recepción, con periodo de observación | Fecha de firma (COR-10); abrir operación o hacer la entrevista no cuenta. Nombre exacto «a cliente», no cierre. |
| Captaciones | Inmuebles con intermediación firmada en el periodo (RP-91) | Fecha de firma; en captación sin firma, aparte. |
| Visitas realizadas | Eventos con realización confirmada, sin cancelados/reemplazados | VIS-01; agendados aparte. |
| Cobros confirmados | Pagos conciliados por moneda/periodo menos anulaciones aplicables | FIN-01/02; sin honorarios potenciales. |
| Saldo por cobrar | Obligación vigente menos pagos aplicados y ajustes aprobados | Contrato y movimientos; sin base, pendiente. |
| Documentos por revisar | Requisitos aplicables recibidos sin revisión vigente | DOC-01/LEG-01; recibido no es aprobado. |
| Discrepancias técnicas | Hallazgos abiertos con fuente y responsable | TEC-01; sin diagnóstico pericial. |
| Tiempo en etapa | Días de entrada a salida por etapa; mediana y abiertas aparte | Historial de etapas; corregir etapa con motivo no es avance. |
| Días en mercado | Desde la publicación hasta hoy, el retiro o la oferta aceptada | Fechas de publicación y oferta; sin publicación, pendiente. |
| Pronóstico ponderado | Honorario pactado o estimado × probabilidad de etapa de Fortius, por mes esperado | FIN-03/DEC-17; rotulado «Estimación»; nunca se suma a cobros. |
| Avance contra meta | Resultado del periodo / meta del asesor para ese periodo | TAB-05; sin meta, pendiente. |

Cada ficha: unidad/grano, fórmula, filtros, zona horaria operativa, responsable del dato, último corte, permisos, anulaciones y lista de IDs. La UI nunca pone cero por falta de datos.

### Definición de terminado por entrega

- [ ] Comportamiento y límites documentados; aceptación medible cumplida.
- [ ] Pruebas de reglas, RLS/capacidad, concurrencia/idempotencia y montos si se afectan.
- [ ] Lint/TypeScript/tests/build según cambio, con resultados ligados al commit revisado.
- [ ] UI revisada en escritorio/móvil y teclado si se afecta; se declara lo no comprobado.
- [ ] Migración ensayada, compatibilidad y recuperación/rollback; no editar migraciones aplicadas.
- [ ] Web pública/PDF/formularios revisados si comparten código; conservar demo y contenidos.
- [ ] Rama/PR o commit revisable; documentación y pruebas de aceptación. Publicar solo con autorización vigente.
- [ ] Aceptación técnica distinta de la de negocio: aprobación de Moisés registrada sin inventarla.

Comandos: `npm run lint`, `npm run typecheck`, `npm run test:backend`, `npm run test:admin`, `npm run build`, `node --test tests/tools/*.test.mjs`, `npm run test:admin:browser`, `npm run test:public:browser`. Antes de comandos live, ver si escriben; `test:live` no corre por defecto.

## Reglas reemplazadas el 16/11/2026 por DEC-67 (la metodología no es la columna vertebral)

Texto anterior, solo consulta:

- **RP-09** · Guiado por omisión, rápido para quien ya sabe; los atajos no saltan la guía.
- **RP-79** · Cada asunto sigue la guía de su tipo, editable por Fortius sin programar; cada asunto conserva la versión con que empezó. La guía sugiere y avisa (FLX-03, DEC-55).
- **RP-87** · Trabajo en paralelo y ciclos: entrevista y levantamiento en la misma visita; publicación, visitas y negociación coexisten; se puede pasar a cualquier etapa con aviso de lo que quedó atrás.
- **RP-96** · Valía para todo encargo; ahora solo dentro de la guía de captación de venta.
- **RP-108** · La lista de qué abre un asunto era cerrada (cinco casos); ahora son ejemplos.
