# Formatos exclusivos en el panel

Corte documental actualizado: 13/11/2026, código integrado en `main` hasta el PR #73. Las muestras y conteos posteriores conservan la fecha de su validación original; no son una nueva aprobación de contenido jurídico.

## Estado de esta implementación

Los borradores 04A–04G y 07 ya admiten fotografías, croquis y soportes gráficos privados vinculados al expediente. Cada carga guarda su procedencia, fecha opcional y SHA-256; la descarga comprueba el hash y los permisos del borrador. Los siete levantamientos incorporan la fotografía principal y el croquis seleccionados, con sus fuentes e identificadores; la opinión 07 incorpora además las fotografías seleccionadas para su reporte.

El código integrado contiene la base de expedientes privados, asociación de cuentas editor con asesores, borradores versionados, archivo de PDFs emitidos con SHA-256 y archivo separado de copias firmadas fuera del sistema. El catálogo identifica los 25 originales del directorio `Formatos exclusivos`.

Los formatos 01, **Aviso de privacidad**, 02, **Entrevista inicial**, 04A–04G, **Levantamientos de terreno, casa, departamento, oficina, local, nave y plaza**, 05, **Revisión jurídica y control de cierre**, 06, **Opinión jurídica del inmueble**, 07, **Opinión de valor comercial**, 08, **Estimación del neto del propietario**, 09, **Contrato de intermediación inmobiliaria para venta**, 10, **Plan de comercialización**, 11, **Reporte de comercialización al propietario**, 12, **Perfil del comprador**, 13, **Registro de visita y retroalimentación**, 14, **Propuesta de compra y respuesta del propietario**, 15, **Promesa bilateral de compraventa civil revisada**, 16, **Acta de entrega y recepción**, 17, **Cierre del expediente**, 18, **Recibo de pago de honorarios**, y 19, **Presupuesto de rehabilitación**, están habilitados para emisión.

Su contenido se cotejó con los originales y se revisaron visualmente muestras PDF de los veintitrés. Las muestras de levantamientos usan datos e imágenes sintéticos para comprobar el contenido y la paginación; no acreditan visitas ni mediciones reales. Desde el 27/10/2026 (en `main` con el PR #63), los siete levantamientos se capturan sobre el documento en vivo. Cada uno sigue los espacios de su Word con el acomodo del 04A (sin título repetido ni hojas a medias). No llevan columnas de base y referencia ni tablas de respaldos y discrepancias, e incluyen el uso de suelo, como decidió el titular. Las listas con diagonales son casillas o campos separados, y siguen pidiendo el permiso para fotografiar y medir. El 04F distingue kVA y kW; el 04G registra las unidades sin sumar superficies de distinta naturaleza.

El 01 exige identidad y domicilio completo del responsable, separa decisiones de consentimiento y transferencia, y no trata una selección capturada como firma; el domicilio pendiente del Word original debe completarse para emitir. Su texto se contrastó con la LFPDPPP vigente consultada el 4 de octubre de 2026; requiere revisión si cambia la ley o el tratamiento real. Desde el 28/10/2026 se captura sobre el documento: el PDF del expediente sale del mismo modelo que la vista, con las secciones 01–08 cotejadas contra `01_AvisoPrivacidad.docx` del 26/10/2026 y las hojas de decisiones con la redacción de ese Word, cada una en una página. Los datos del responsable se proponen desde el aviso publicado en el sitio. El aviso público del sitio conserva su generador propio (`aviso-pdf.ts`).

El 02 es la entrevista sencilla aprobada el 17/10/2026 (quién es, el inmueble, por qué vende y cuánto espera, siguiente paso); sus datos son declarados y no confirman títulos ni situación fiscal, que se revisan en el 05. Desde el 28/10/2026 se captura sobre el documento, con casillas para las listas cortas.

El 05 reproduce el control condicional de 22 documentos, personas, tracto, contraste, cargas, ocho controles especiales, hallazgos, seis etapas y ocho condiciones de cierre; recibido y verificado conservan estados distintos, y el abogado captura la conclusión con límites. Desde el 28/10/2026 se captura sobre el documento, cotejado con `05_RevisionJuridica.docx` del 26/10/2026; operación, alcance y resultado son casillas como en ese Word.

El 06 redacta una opinión jurídica en ocho secciones: conclusión con su resultado, objeto y alcance, antecedentes en tabla, marco jurídico con fecha de consulta, análisis, condiciones por etapa y recomendaciones, documentos revisados con su estado, y vigencia y límites, con los datos del abogado responsable (DOC-06, 12/11/2026). Al iniciarlo toma de la 05 solo el resultado, el estado de cada etapa y la lista de documentos con su estado, sin folios, acreedores ni notas internas; el contenido jurídico es capturado por el profesional, sin inferencia automática ni cotejo de evidencia externa. Desde el 28/10/2026 se captura sobre el documento; no hay Word del titular para el 06: el titular aprobó este diseño el 12/11/2026, con la 05 como base.

El 08 reproduce el precio sugerido por la opinión 07, el precio acordado, la selección de base, las once posibles erogaciones, los controles del respaldo fiscal y el neto; no aplica tasas fiscales por defecto. La referencia a la opinión 07 y el respaldo fiscal son datos capturados y revisados por el responsable, sin comprobación automática contra esos documentos.

El 10 sigue la plantilla del 26/10/2026 (DEC-34): un formulario con casillas para el inmueble, comparables con precio promedio por m² y precio técnico calculados, perfiles de comprador, AIDA, materiales, canales autorizados, publicidad pagada, calendario de 21 días, revisiones, seguimiento y aprobación. Se captura sobre el documento; las referencias al 07 y al 09 se proponen al crearlo y se confirman.

El 11 distingue cifras comprobadas de datos pendientes, registra canales, oportunidades y decisiones, y calcula el saldo de fondos de publicidad sin restar pagos directos al portal por segunda vez.

El 14 genera primero una carta de propuesta en prosa y, cuando se registra la contestación, agrega una carta de respuesta; exige que recursos propios y crédito sumen el precio y registra ratificación del comprador si una aceptación o contraoferta llega después del plazo. Desde el 29/10/2026 sigue `14_CartaIntencion.docx` del 26/10/2026: «Folio Real» y «Partida» separados, el precio también en letra y sin los apartados que esa plantilla ya no trae.

El 16 registra resultado, alcance revisado, diferencias, accesos, documentos, servicios, pendientes, reservas y líneas de firma.

El 19 reproduce las tres secciones y las relaciones de subtotal, autorización, reserva y pagos del XLSX, con partidas y pagos estructurados; redondea cada partida a centavos antes de sumarla.

El 03 se trabaja como cartera global administrativa en /admin/control-comercial; incorpora pesos, umbral estricto, conversión fechada, gestión, bitácora, documentos y conciliación, con revisiones y PDF privados.

El 09 incorpora la captura de las condiciones del Word y sus cláusulas. Desde el 12/11/2026 su PDF se emite con el texto del Word del titular del 26/10/2026 (DOC-09).

El módulo ya forma parte del código integrado. El inventario de proveedor registrado el 12/10/2026 informa 22 migraciones y 18 tablas; la entrega publicada se documenta en el PR #15. Esa evidencia no sustituye repetir un recorrido real de emisión/descarga por cada formato ni acredita aceptación jurídica de una operación concreta.

## Controles para nuevas versiones y aceptación operativa

1. Cotejar cada formato con el original, campo por campo, incluidas las variantes 04A a 04G; distinguir datos declarados, observados y verificados cuando proceda.
2. Reproducir las cláusulas, tablas, anexos y espacios de firma de los DOCX. Revisar visualmente PDFs con datos cortos, largos y varias páginas.
3. Verificar el 03 contra una cartera revisada y conciliada del usuario. Su cálculo de honorarios por valor y porcentaje cubre venta; renta u otra base se mantiene pendiente de revisión. La opinión 07 y el neto 08 tienen objetos distintos.
4. Resolver la vinculación de archivos privados existentes a clientes: los que carecen de `clienteId` permanecen visibles solo al administrador.
5. Revisar en una instancia de prueba la migración y los flujos reales de autenticación, almacenamiento, versionado, permisos de dos asesores y descarga de bytes exactos.
6. Habilitar cada `readyForEmission` únicamente después del cotejo de contenido y la revisión visual correspondiente.

## Criterio de aceptación de cada formato

Cada campo obligatorio del original tiene una entrada clara; las dependencias condicionales se validan; la emisión rechaza borradores incompletos; el PDF conserva contenido, cálculos y advertencias relevantes; el archivo emitido se puede descargar con la misma huella SHA-256; solo el administrador y el asesor asignado pueden acceder al expediente y sus archivos.


## Opinión de valor 07

La captura incorpora antecedentes, tres fechas distintas, vigencia, referencias 04 y 05/06, superficies por concepto y fuente, características urbanas y físicas, fichas de comparables y selección/exclusión, conversión USD fechada, cuatro factores con justificación, ingresos netos, depreciación por componente, obras sin doble conteo, ponderación, redondeo, revisión y fotografías. Cada cálculo de comparables exige tres fuentes completas y rechaza duplicados, monedas sin conversión y mezcla de oferta/cierre. Mercado construido ya incluye los derechos sobre terreno. El físico reconcilia sus áreas con la construcción del sujeto y exige fuentes de costos, edad, vida útil y conservación. La revisión guarda los datos y el indicador: cambios en fuentes o entradas exigen repetirla aunque la cifra no cambie.

Las muestras sintéticas de tres enfoques, mercado construido y terreno se revisaron visualmente. El índice incluye las secciones utilizadas y sus páginas reales. No son valoraciones reales ni acreditan fuentes externas. El 08 sigue separado; la transferencia de su referencia y valor del 07 se captura como en el original.

Plantilla del 30/10/2026 (12/11/2026): `public/plantillas/07_OpinionValor.xlsx` se genera con `node tools/plantilla-07.mjs "<ruta al 07_OpinionValor.xlsx del titular>"`. La herramienta copia el original y solo reemplaza las fórmulas que dependen de controles que el panel no captura: la marca BORRADOR de la portada y las casillas «Incluido», «Revisado» y «Revisada» de las hojas 7 a 11. El resto, incluidas las fórmulas de presentación del 30/10, queda igual al original. Cambios que se reflejan en el panel, el PDF y el Excel:

- **Vigencia.** Ya no se captura: son seis meses desde la fecha de emisión, como fija la plantilla, con el mismo cálculo que EDATE.
- **Campos retirados.** Se quitaron el índice de saturación y la altitud.
- **Etiquetas.** Ahora dicen «Tipo de inmueble», «Domicilio del inmueble» y «Opinión de valor comercial».
- **Textos.** Cambiaron el objeto, los límites (puntos 5 a 7: no es avalúo ni tasación; declaración de interés) y la nota de la portada.
- **Índice.** Marca «No aplica» en los enfoques que la plantilla excluye por su peso. El PDF del panel conserva las diez secciones.
- **Fotografías.** El PDF pone dos por renglón, cada una con su pie. El Excel descargado coloca la portada, el croquis y las fotografías del reporte dentro de sus recuadros, escaladas, reorientadas y reducidas a 1600 px.
- **Celdas que no caben.** En el Excel, los textos largos se cortan en las celdas de alto fijo de la plantilla; lo mismo pasa con los pies de foto largos.

Ruling: se conserva la media aritmética y la posibilidad de un único enfoque del Excel original, con razones de selección/exclusión y límites. No se declara cumplimiento de un estándar de valuación. Si ese alcance resulta insuficiente para el encargo, el responsable debe cambiar el método o solicitar el avalúo pertinente.


## Promesa 15

El panel separa identificación y RFC, representación y poderes, estado civil y régimen, descripción, superficie y colindancias, precio y moneda, recursos, pagos, condiciones, documentos, anexos, fechas, garantía, pena y plazos. Conserva las 26 cláusulas del original en prosa justificada, con títulos centrados y firmas. Los importes en letra se generan desde las cifras; no hay una segunda entrada que pueda contradecirlas. El calendario suma el precio sin descontar por adelantado la garantía y sus fechas corresponden a la formalización. Una garantía positiva exige receptor y cuenta; este modelo no autoriza custodia por la inmobiliaria.

La emisión requiere revisión profesional de identidad, titularidad, facultades, copias de anexos, clasificación y términos actuales. El registro conserva los datos revisados y su versión; modificar entradas exige repetirlo. Capturar esa revisión no acredita documentos externos ni firma el contrato. Los anexos se identifican por copia y versión y deben acompañar el contrato al firmarlo; este PDF no concatena sus archivos.

Datos que son solo un hueco (13/11/2026, C-23, decisión del titular sujeta a revisión del abogado): la promesa no se emite si un dato dice únicamente «pendiente», «por definir» o «por confirmar», o trae corchetes; una frase que menciona «pendiente» («el saldo pendiente se liquida con el precio») sí se acepta.

Ruling: se habilita el modelo civil de Baja California con pleno dominio documentado, términos individuales y revisión de no aplicación del régimen de consumo; otros derechos, entidades y operaciones de consumo quedan pendientes de un modelo específico. No se equipara automáticamente una venta ocasional entre particulares a un contrato de adhesión de un proveedor. La falta de registro declarada por el usuario se respeta; un dato de registro capturado no sustituye el cotejo del modelo registrado. Si la clasificación profesional fuese incorrecta, el sistema no la detectaría sin revisión de la evidencia externa.

Fuentes primarias consultadas el 4 de octubre de 2026: [Código Civil de Baja California, reforma al 5 de junio de 2026](https://www.congresobc.gob.mx/Documentos/ProcesoParlamentario/Leyes/TOMO_III/20260605_CODCIVIL.PDF), artículos 2117–2121 y 1727–1734; [NOM-247-SE-2021](https://sidof.segob.gob.mx/notas/docFuente/5646251), alcance y numeral 6.1. El registro previo se exige a las promesas de vivienda de adhesión comprendidas en ese numeral.

Se revisaron muestras sintéticas civil, con crédito/representación/garantía y con texto extenso (5, 5 y 8 páginas). La lectura del PDF confirmó las 26 cláusulas. Se observaron su ajuste, justificación, continuación y firmas; no son contratos de una operación real.

Verificación local de la promesa 15: revisión visual y lectura de tres especímenes; 371 pruebas de servidor y 154 del panel aprobadas, análisis estático y compilación aprobados. No se ejecutaron operaciones reales sobre Supabase ni publicación remota en este paso.


## Contrato de intermediación 09: preparación de captura

Se identificaron los 38 controles de contenido del DOCX en su XML; la lectura simple de párrafos omitía sus marcadores. El panel separa los datos de cada cliente, representantes y firmantes, prestador, licencia y modelos, derecho e identificación del inmueble, situación informada, vigencia, comisión, IVA de venta y de servicios, base de pena, prospectos, anexos y entrega del aviso de privacidad. Permite consultar las once cláusulas y tercera bis del original. La captura no prueba derechos, facultades ni registros.

El cálculo de referencia excluye IVA de venta de la base, desglosa IVA de servicios capturado sin tasa por defecto y limita la base de pena al menor entre máximo y comisión sin IVA. El panel presenta la comisión estimada, sin confundirla con una comisión devengada.

Ruling (04/10/2026, superado el 12/11/2026): completar la preparación y cálculos del 09 y mantener su PDF bloqueado. El usuario indicó que los modelos no están registrados; escribir un número, fecha o supuesto de no aplicación no habilita esta plantilla. Antes de emitir se requiere cotejar el modelo y sus registros aplicables. Este avance no modifica esa situación externa.

Cotejo con el Word del titular del 26/10/2026 (12/11/2026): la tercera, la quinta y la novena se copiaron tal cual del Word; las demás cláusulas, las condiciones particulares y las declaraciones ya coincidían. La quinta agrega que, en exclusiva, el CLIENTE tampoco vende por conducto de otro intermediario. La novena ya no prorratea la pena por días: el máximo es el menor entre el importe pactado y la comisión sin IVA, sujeto a reducción por cumplimiento parcial; por eso se retiró la calculadora de prorrateo, que el panel no mostraba.

COR-12 (12/11/2026): el 09 ya no captura ni revisa el registro ante PROFECO (titular, 17/10/2026: Fortius no lo tiene y no lo tendrá en 2026). El Word del titular no imprime esos datos. Los borradores anteriores conservan los valores, pero ya no se piden ni se validan. El 12/11/2026 el titular decidió que el registro ante PROFECO no es necesario y que su Word del 26/10 es el modelo: el PDF del 09 se libera (`readyForEmission=true`, DOC-09 y DEC-20 resueltos). Como los demás formatos, se emite completo o marcado como incompleto en cada hoja; ya no se ofrece la copia en Word. El bloque de firmas lleva una raya para cada parte, porque en el Word esa raya es el espacio del nombre y desaparece al llenarlo.

Verificación local de la preparación 09 (04/10/2026, antes de liberar su PDF): 377 pruebas de servidor y 155 del panel aprobadas; análisis estático y compilación aprobados. Desde el 12/11/2026 rige el párrafo anterior (COR-12): el PDF está liberado.

## Tablero y control comercial 03

El 03 tiene una ruta global separada de los borradores del expediente. Acceso administrativo en página, API y RLS; cartera vacía inicial, sin importar los ejemplos como operaciones actuales. Reproduce pesos y definiciones, umbral estrictamente mayor, priorización completa para inmuebles y ponderada para compradores. Toda cifra desconocida permanece vacía; las sumas con componentes pendientes no se completan como cero. USD requiere TC manual positivo, fecha anterior o igual al corte y fuente. Corte diario en Baja California sin actualización automática de TC.

Oportunidades con ID y segmento estables, gestión integrada, relación y referencia opcional a expediente existente. Cerrar conserva la historia; cancelar tarea no cierra operación. Eventos y documentos guardados son inmutables; correcciones y versiones se agregan con ID nuevo y anterior de la misma oportunidad. La revisión conserva nombre, configuración y todos los registros. El guardado usa versión optimista y no reemplaza la captura si falla.

Las emisiones utilizan exactamente una revisión guardada, con corte efectivo, entradas, resultados y SHA-256. PDF y metadata se conservan en almacenamiento separado privado. Se revisaron muestras sintéticas vacía, mixta y extensa (23 páginas en total), incluidas continuidad de textos largos y marcas finales. Son pruebas locales; no acreditan fuentes externas ni una migración o descarga real en Supabase.

Ruling: sólo venta habilita el cálculo por valor y porcentaje. Renta/Otro muestran honorario pendiente y la necesidad de revisar su base. La conciliación histórica requiere fuente y ocho cifras explícitas o motivo de no aplicación; las sumas de origen con distintas monedas no se presentan como total económico.

**Captura sobre el documento (29/10/2026, DEC-31, en `main` con el PR #63):** todos los formatos de expediente, del 01 al 19 salvo el 03, se llenan pulsando el documento; la vista y el PDF salen del mismo escritor. El 18 asigna su número de recibo automático (folio del expediente y consecutivo).

**Captura por lista en el celular (12/11/2026, DEC-44, en `main` con el PR #73):** en pantallas angostas, la entrevista (02) y los levantamientos (04A a 04G) ofrecen «Captura por lista»: una pregunta por pantalla, en el orden del documento y sobre las mismas celdas, con «No sabe» donde la plantilla lo admite, cámara y dictado. Empieza por lo pendiente; lo capturado aparece en la hoja y en el PDF, que no cambian. El documento en vivo se conserva.

**Expediente en un archivo (13/11/2026, FCH-06, en local):** la pestaña «Expediente» de la operación descarga «Expediente en PDF» (portada, índice con la página, fecha, versión y SHA-256 de cada documento, y la última emisión de cada formato en el orden del catálogo) o «PDF originales en ZIP» (los mismos PDF byte por byte, con `huellas.txt`). Solo entra lo emitido; el índice avisa si el borrador va en una versión posterior o si se emitió con datos por completar. Ruta `GET /api/admin/expedientes/[id]/completo?formato=pdf|zip`: lee expediente, borradores y emisiones con la sesión del usuario (RLS: administrador o asesor asignado), coteja cada PDF con su SHA-256 antes de entregarlo y responde sin caché. El PDF unido es una copia de consulta; no se archiva ni sustituye las emisiones. La copia firmada más reciente de cada emisión va justo después de su formato (decisión del titular, 13/11/2026): el índice la marca «Firmado» con su página, el ZIP la guarda aparte (`…-firmado.pdf`) con su huella, y también se coteja con su SHA-256; si la copia no se puede leer como PDF, el índice dice que solo está en el ZIP.

**Datos de Fortius en el 01 y el 09 (13/11/2026, FCH-03):** al crear el borrador, el 09 propone al prestador con lo que el director capturó en Configuración (razón social, RFC, domicilio, correo, teléfono, representante, cargo, facultades y licencia). Si ya hay representante, propone «Por representante» y que firme él con su cargo. El 01 toma la razón social y el domicilio de Configuración, y si faltan, los del aviso publicado en el sitio. Lo no capturado queda vacío: nada se inventa. Lo que el asesor escriba al crear el borrador manda, y los borradores existentes no cambian.

**Revisión de PDF con datos largos (13/11/2026, en local):** se renderizaron el 09, el 14 y el 15 con cada texto alargado unos 300 caracteres, incluida una referencia sin espacios (8, 3 y 9 páginas). Tablas, cláusulas y cartas continúan bien entre hojas. Se corrigieron dos defectos del escritor común: con nombres de firmante de más de dos renglones, las firmas invadían el pie de la hoja (ahora el bloque crece y pasa completo a la hoja siguiente), y el título «Firmas» del 09 podía quedar solo al pie (ahora va con su párrafo y las firmas). Con nombres de hasta dos renglones el PDF no cambia; en el 15, cuya firma lleva tres renglones, solo crece la zona que se pulsa en la captura. Queda como límite conocido: un texto sin espacios muy largo deja huecos amplios en el renglón justificado anterior.

