# Catálogo de casos: todo lo que puede llegar a Fortius

**Escrito:** 18 de noviembre de 2026.
**Para quién:** el agente que vaya a pensar cómo debe crecer el panel. También lo puede leer el titular.
**Qué es:** un banco de casos típicos y atípicos de una inmobiliaria y de un despacho jurídico, más los patrones que esos casos le exigen al panel. No es la especificación: la especificación es `SPEC.md`. No sustituye a `docs/casos-reales.md`, que son los casos que el titular contó y con los que se prueba cada etapa; de aquí salen candidatos para sumar a esa lista.

**Lo comprobado y lo supuesto.**
- Comprobado: lo que dice `SPEC.md` (versión del 17/11/2026) y `PLAN.md` (18/11/2026), que el agente leyó para armar este documento.
- Supuesto, y el titular lo corrige: la **frecuencia** de cada caso (Alta, Media o Baja, en Tijuana y Baja California) y todo lo que toca leyes. Las notas legales sirven para saber qué dato o qué paso necesita el panel; **no son asesoría ni opinión jurídica**, y el abogado las revisa antes de usarlas con clientes (regla de `AGENTS.md`). Donde dudo, escribo «(verificar)».
- No verificado: que lo construido en `/panel` se comporte como dice `SPEC.md`. Esto es una revisión de diseño, no de código.

---

## 1. Encargo para quien lea esto

Pensar **cómo debe cambiar el panel** para que todos estos clientes tengan dónde entrar y ningún caso se fuerce a caber. Sin construir nada todavía.

1. Leer `SPEC.md`, `PLAN.md`, `docs/casos-reales.md` y el boceto `docs/boceto-fortius-por-asuntos.html`.
2. Recorrer los casos de la sección 4 contra `SPEC.md`, como en la «prueba de escritorio» de `docs/casos-reales.md`: paso a paso, como si el panel ya existiera, y anotar **dónde no está dicho qué hacer**.
3. Revisar los **patrones** de la sección 3: ahí está lo que los casos tienen en común y la brecha contra `SPEC.md` (cubierto, parcial o falta). Es la parte que más importa. Los casos son la evidencia; los patrones son lo que hay que decidir.
4. Entregar al titular una propuesta corta, en este orden:
   - **Lo que ya cabe** sin tocar nada.
   - **Ajustes chicos** (se corrigen en la misma rama, según la sección 19 de `SPEC.md`).
   - **Cambios grandes** (conviene una rama nueva; cuáles secciones de `SPEC.md` y `PLAN.md` tocan).
   - **Lo que no conviene hacer** y por qué (por ejemplo, un caso que el panel no debería intentar llevar).
   - **Preguntas de negocio** de la sección 6, **de una en una**.
5. Reglas que no se rompen, de `AGENTS.md` y `SPEC.md`:
   - Si una idea contradice lo escrito, decirlo antes («eso contradice esto») y preguntar si se corrige aquí o en rama nueva.
   - **Nada frena:** el sistema avisa y deja continuar. Esto incluye alertas de cumplimiento, de conflicto de intereses y de términos legales.
   - **Cualquier caso cabe:** ninguna metodología es regla del panel. Si un caso no cabe, decirlo y proponer cambiar el diseño.
   - **Pocas palabras, muchas funciones:** todo lo nuevo va agrupado en menús y listas desplegables (3 o más opciones, lista; 2, interruptor), con íconos. Sin lenguaje técnico ni rastros de IA en pantalla.
   - Lo que el boceto no define se pregunta y se anota en `SPEC.md`; no se inventa.
   - Proponer por iniciativa propia: si hay una forma mejor de lograr lo que se busca, decirlo con su razón.
6. **No construir** hasta que el titular elija qué entra y en qué orden. Las ideas de este documento son **ideas a evaluar, no decisiones**.

---

## 2. Qué ya cubre el panel (resumen)

Para no proponer lo que ya existe. Según `SPEC.md`:

- **Asunto** con folio, nombre, qué encargaron (revisar, comercializar, tramitar, asesorar; puede ser más de una), estado (en estudio, propuesta, en marcha, por cobrar, cerrado) y **«en espera»** con motivo y fecha.
- **Apartados** que se agregan o quitan; apartados propios (lista, tabla, galería, texto); **Plan** con etapas, tareas con responsable (Fortius, cliente, abogado, notaría), hora, «no aplica», «no se puede todavía», espera entre tareas y repetición (semanal a anual).
- **Personas** con papel por asunto (contacto, propietario, titular, heredero, copropietario, comprador, vendedor, inquilino, inversionista, contraparte, apoderado, abogado, notaría, banco), **empresas e instituciones** con representante, **fallecidas**, teléfono con clave de otro país, «no contactar», unir fichas duplicadas.
- **Varios inmuebles** en un asunto, plazas con locales ligados, precio en pesos o dólares con historial, tipos de inmueble con ficha técnica propia.
- **Documentos** por quién los entrega, con vencimiento y aviso, liga para que el cliente suba los suyos, formatos que se llenan por preguntas, lectura de documentos «por confirmar».
- **Dinero:** presupuesto con honorarios y gastos de terceros separados, porcentaje del precio, quién paga, cobros con recibo, pesos y dólares sin mezclar.
- **Continuar en un asunto nuevo** (copia personas, inmueble y documentos), cerrar «se logró» o «no se dio», reabrir.
- **Inicio** con lo que espera respuesta, lo de hoy, visitas, lo que esperas de otros, por vencer y por cobrar; **director ve todo, asesor lo suyo** (en la base).
- **Herramientas** (opinión de valor, ISR, gastos de comprador y vendedor, crédito, comisión) con o sin asunto; **Biblioteca** de metodologías.

---

## 3. Los patrones: lo que estos casos le exigen al panel

Cada patrón dice qué es, qué casos lo disparan (claves de la sección 4), qué dice hoy `SPEC.md` y qué ideas hay que evaluar. **Estado en `SPEC.md`:** ✔ cubierto · ◐ parcial · ✘ falta.

### P1 · El desacuerdo (o el acuerdo) es el objeto del asunto
- **Qué es:** varias partes con intereses distintos o encontrados (hermanos, cónyuges, socios), y el trabajo es resolver eso. Puede terminar en acuerdo (venta, adjudicación, convenio) o en pleito.
- **Casos:** E5, E6, E1, E2, B11, G3, G5, I8.
- **Hoy:** ◐ Personas ya admite copropietarios, herederos y contraparte, pero cada persona es solo un renglón con papel. No hay forma de ver **quién quiere qué** (vender, quedarse, comprar la parte, cobrar), ni cuántos están de acuerdo, ni el porcentaje de cada quien.
- **Ideas a evaluar:** una «postura» y un «porcentaje o parte» por persona dentro del asunto; un resumen «cuántos están de acuerdo»; un registro de ofertas entre las partes.

### P2 · La ruta se decide después (y puede cambiar)
- **Qué es:** el asunto entra como consulta y puede desembocar en venta, litigio, trámite o nada. A veces el tipo cambia a mitad de camino.
- **Casos:** E5, E1, F1, B9, A1, I3, A12.
- **Hoy:** ◐ El asunto puede encargar varias cosas, puede ponerse en espera y se puede «Continuar en un asunto nuevo». Falta una forma explícita de decir «la ruta aún no se decide; estas son las salidas posibles» y de **cambiar de ruta sin perder lo hecho**.
- **Ideas a evaluar:** un campo «Rutas posibles» con una elegida o por decidir y el motivo del cambio en el Historial; que cambiar de ruta encienda o apague apartados sin borrar lo capturado.

### P3 · Asuntos que dependen de otros
- **Qué es:** antes de A hay que hacer B (poder antes de vender, sucesión antes de vender, cancelar la hipoteca antes de escriturar, regularizar antes de comercializar). B puede ser un asunto completo, con otro responsable y otro cobro.
- **Casos:** A2, A3, D1 a D8, E1, E2, E7, B3, I3.
- **Hoy:** ◐ «Continuar en un asunto nuevo» deja anotado de dónde viene, pero la liga es de **origen**, no de **dependencia**: no existe «este asunto está esperando a aquel».
- **Ideas a evaluar:** ligar asuntos entre sí (padre e hijo, o «espera a»); que un asunto padre muestre el estado de sus hijos; que una tarea pueda esperar a un asunto, no solo a otra tarea. Sin frenar: solo avisa.

### P4 · El régimen del inmueble manda
- **Qué es:** lo que decide si es venta, regularización o no se puede es la **situación jurídica del inmueble**: escriturado, ejidal, posesión, en sucesión, en fideicomiso, con hipoteca, en copropiedad, en condominio, con patrimonio familiar, en zona federal, con embargo. Cada una cambia los documentos, los pasos, los costos y los tiempos.
- **Casos:** D1 a D14, A1, A3, B3, B8, B9, E1.
- **Hoy:** ✘ La ficha del inmueble tiene tipo (casa, terreno…) y datos técnicos, y la consulta pregunta «si tiene escritura». No hay un dato de **régimen** que ordene la consulta.
- **Ideas a evaluar:** «Régimen o situación» como lista desplegable en la consulta y en el inmueble (puede ser más de uno a la vez: en sucesión y con hipoteca); que cada valor sugiera una lista de documentos y un plan de la Biblioteca (copiados, no obligatorios); que el inmueble guarde sus **cargas** (hipoteca, embargo, usufructo) con acreedor, monto y fecha.

### P5 · Asuntos que no terminan (ciclos)
- **Qué es:** administración de rentas, cobranza de mensualidades por años, albacea que rinde cuentas, anualidad de un fideicomiso, seguimiento de un juicio largo. «Nacen y mueren» no describe a estos.
- **Casos:** C5, C6, C12, E10, A13, B3, I4, G2.
- **Hoy:** ◐ Las tareas se repiten (hasta cada año) y el asunto se puede poner en espera. **Falta** el ciclo mensual completo: cobrar renta, pagar gastos, reportar al propietario y liquidarle. El cobro de `SPEC.md` es por presupuesto con un total, no por periodos.
- **Ideas a evaluar:** un tipo de asunto «continuo» que no se «cierra» sino se «pausa» o «termina contrato»; un apartado de **calendario de cobros** con renta, estado de cada mes y mora; un **estado de cuenta del propietario** (lo cobrado, lo gastado, la comisión, lo que se le liquida), pensado como informe del cliente que ya existe.

### P6 · Un cliente con muchos asuntos, muchos inmuebles, muchas personas
- **Qué es:** un inversionista con doce propiedades, una familia con cuatro asuntos, una plaza con quince locales, una constructora con cuarenta casas.
- **Casos:** G4, C2, G2, A8, I2, E1.
- **Hoy:** ◐ El Directorio muestra los asuntos de cada persona; hay conjuntos de inmuebles y «Agregar otro igual». No hay vista de **cartera** (todo lo de un cliente junto: asuntos, inmuebles, cobros y vencimientos) ni de **grupo familiar**.
- **Ideas a evaluar:** una «cuenta» o «cartera» que agrupe a una persona (o familia) con todo lo suyo; resumen de lo pendiente por cliente; alta rápida de muchas unidades (importar desde una hoja).

### P7 · Personas con situaciones especiales
- **Qué es:** más que un nombre con papel: estado civil y **régimen matrimonial** (quién debe firmar), menores, personas con incapacidad, adultos mayores vulnerables, extranjeros, personas que firman a ruego, ejidos y comunidades como parte, autoridades y juzgados.
- **Casos:** E7, E8, E14, B3, A2, D1, I14, I15, G10.
- **Hoy:** ◐ Hay datos de persona (estado civil, nacionalidad, representante, fallecida, clave de teléfono). Faltan: **régimen matrimonial** y «el cónyuge debe firmar o consentir», **menor o incapaz con su tutor**, **idioma de preferencia**, **lugar y huso horario** (firma remota), «**firma a ruego**» y un aviso suave de **persona vulnerable** que lleve al protocolo de confirmar su voluntad a solas.
- **Ideas a evaluar:** pocos datos nuevos, agrupados en un desplegable «Situación especial» en la ficha de la persona, sin hacerlos obligatorios.

### P8 · Representación y poderes
- **Qué es:** «A firma por B». Poder consular, notarial, de pleitos y cobranzas, de dominio; albacea; tutor; representante de empresa. Un poder tiene alcance, vigencia y se puede revocar.
- **Casos:** A2, B3, E8, E10, G1, H5, I5.
- **Hoy:** ◐ Existe el papel «apoderado», un documento puede vencer y la relación entre personas se escribe como texto libre («Hija de Rosa, recibe el poder»). No hay una **relación estructurada** «representa a» con su documento, su alcance y su vigencia.
- **Ideas a evaluar:** en Personas, «Representa a…» ligando a la persona representada y al documento que la acredita, con aviso cuando el poder esté por vencer o no cubra el acto (por ejemplo, solo pleitos y cobranzas y se pretende vender).

### P9 · Términos legales, fechas fatales y urgencia
- **Qué es:** un término legal no es un recordatorio: si se pasa, se pierde un derecho. Corre desde una notificación, por días hábiles, y no se pospone. También hay urgencia sin juicio (invasión reciente, remate próximo, fraude en curso).
- **Casos:** F1, F13, F14, F7, F6, C8, D8.
- **Hoy:** ◐ Tareas con fecha y hora, «Recordarle», documentos con aviso. **Falta** distinguir un **término legal** de una tarea común: fecha límite que se calcula (desde que se notificó, en días hábiles, sin posponer), responsable y suplente, aviso reforzado en Inicio y en el teléfono.
- **Ideas a evaluar:** tipo de tarea «Término legal» con «recibida el… plazo de… días hábiles»; calendario de días inhábiles (verificar); marca «urgente» en la consulta que suba el asunto a lo primero de Inicio; «¿hay algo que vence pronto?» como pregunta de la consulta.

### P10 · Expediente en un juzgado o autoridad
- **Qué es:** un asunto que vive en otra institución: juzgado, tribunal agrario, notaría, RPP, catastro, SAT, municipio. Tiene su número, su etapa, sus actuaciones y su lista de acuerdos o boletín que alguien debe revisar.
- **Casos:** E1, F4 a F7, F13, F14, D2, D4, D5, C8.
- **Hoy:** ◐ Se puede armar con un apartado propio de tipo tabla, pero cada asunto lo inventaría distinto.
- **Ideas a evaluar:** un apartado **«Trámite o juicio»** que se agrega cuando haga falta, con institución, número de expediente, tipo, etapa, contraparte y su abogado, y una tabla de actuaciones (fecha, qué pasó, qué sigue); tarea repetida «Revisar el boletín» ligada a él. Podría ser el mismo apartado para un trámite en el RPP y para un juicio.

### P11 · Dinero más complejo que «presupuesto y cobro»
- **Qué es:** formas de cobrar de un despacho y de una administradora, y dinero **ajeno** que pasa por Fortius.
- **Casos:** C5, E10, F9, F10, G2, G4, I13, A13, H1.
- **Hoy:** ◐ Honorarios por concepto o porcentaje del precio, gastos de terceros separados, apartado que recibe Fortius con comprobante, reparto de comisión.
- **Falta:**
  - **Iguala** (cuota mensual fija) y **por hora**.
  - **Cuota litis** (porcentaje del resultado, se cobra al final) y **por etapa o hito**.
  - **Anticipo o provisión de fondos** que se aplica a gastos.
  - **Rentas recibidas por cuenta del propietario** y su liquidación mensual.
  - **Reparto con otro asesor o con otra inmobiliaria** (comisión compartida o por referido).
  - Honorarios pagados **en especie** o **al final del resultado** (I13).
- **Ideas a evaluar:** «Forma de cobro» como lista desplegable en Honorarios; saldo de dinero ajeno por asunto, visible solo para el director; todo con moneda propia.

### P12 · Terceros que hacen parte del trabajo
- **Qué es:** notarías, bancos, peritos valuadores, topógrafos, gestores, abogados externos, contadores, arquitectos, servicios de mantenimiento. Se eligen, se cotizan, se les pide cosas y se les paga.
- **Casos:** A3, B3, C5, D5, D9, D10, E1, H8, G2.
- **Hoy:** ◐ Notaría y banco son personas-institución con papel. No hay «proveedores de confianza» por especialidad ni **comparar cotizaciones** (por ejemplo, tres notarías para un mismo acto).
- **Ideas a evaluar:** etiqueta «Proveedor» en el Directorio con su especialidad y zona; en Honorarios, gastos de terceros con la cotización de cada proveedor y cuál se eligió.

### P13 · Conflicto de intereses y asuntos reservados
- **Qué es:** un despacho no puede representar a dos partes opuestas en un mismo asunto, y debe guardar secreto profesional. Una inmobiliaria sí puede intermediar a ambos lados si se transparenta. Fortius es las dos cosas.
- **Casos:** I7, I8, E5, E6, B2, A1, F9, H13.
- **Hoy:** ✘ No hay aviso cuando una persona es **cliente en un asunto y contraparte en otro**, ni cuando Fortius ya representa a una parte y llega la otra. Como cada asesor ve solo los asuntos que lleva (comprobado en la base), **un asesor no puede enterarse solo** de que esa persona es cliente de un compañero: el aviso tiene que salir del servidor y no mostrar detalles. Sobre asuntos «reservados»: la base ya esconde los asuntos ajenos al asesor, así que la marca solo importaría para el director (que ve todo) o para el Directorio; queda como pregunta, no como pieza.
- **Ideas a evaluar:** al agregar a una persona, aviso «esta persona aparece en otro asunto del equipo» sin mostrar cuál (solo avisa, no frena); en la consulta, «¿a quién representamos?» como pregunta explícita cuando hay partes opuestas. Ver `docs/propuesta-panel-para-todos-los-casos.md`.

### P14 · Cumplimiento y prevención de operaciones sospechosas
- **Qué es:** intermediar inmuebles es una actividad que la ley de prevención de lavado vigila: identificar al cliente, pedir expediente, avisar al SAT por encima de ciertos montos y no aceptar efectivo arriba de un límite (ver `docs/legal` y la guía de cumplimiento del proyecto; verificar umbrales con el abogado).
- **Casos:** I11, G1, G4, G5, B4, A7.
- **Hoy:** ◐ Existe la guía de cumplimiento para el dictamen de una operación; en `SPEC.md` no hay un lugar del asunto que muestre «esta operación necesita identificación o aviso».
- **Ideas a evaluar:** un indicador del asunto («Operación con aviso: revisar») que avisa sin frenar y lleva a la lista de lo que falta (identificación del cliente, dueño beneficiario, origen de recursos, forma de pago); campo «forma de pago» en la consulta de compra.

### P15 · Documentos: originales, verificación y evidencia
- **Qué es:** el despacho recibe **originales** (escrituras, poderes) y debe devolverlos; verifica documentos en su origen (RPP, catastro, registro civil) y puede descubrir que uno es falso; guarda **evidencia** (fotos de papeles por WhatsApp, capturas, audios, actas notariales de hechos).
- **Casos:** B9, F6, I10, H7, D7, I16, E3.
- **Hoy:** ◐ Documentos por entregar con archivo y vencimiento; lectura «por confirmar»; borrador, revisado y firmado para los formatos.
- **Falta:** «**original en resguardo**» (recibí el original, dónde está, cuándo se devolvió); «**verificado en origen**» con fecha, fuente y resultado (coincide, no coincide, dudoso); un documento marcado como **dudoso**; un grupo **«Evidencia»** con lo que llegó por WhatsApp, sin tener que clasificarlo antes.
- **Ideas a evaluar:** un estado más del documento (recibido, verificado, dudoso); «Original en resguardo» con recibo de entrega y devolución, que es también un formato.

### P16 · Cuando el cliente no es de oficina
- **Qué es:** gente que llega por WhatsApp con fotos y audios, que vive en otro país y otra hora, que habla otro idioma, que no va a llenar formatos.
- **Casos:** A2, B3, I15, I16, B9, A9, C5.
- **Hoy:** ◐ Captura en vivo, dictado, teléfono con clave de otro país, liga para subir documentos, capturar por WhatsApp está en «Más adelante».
- **Ideas a evaluar:** un **«buzón»** de entrada donde caen mensajes y archivos sueltos y se **pasan a un asunto** con un toque (ya está como pregunta abierta en `SPEC.md` sección 18: «archivos que llegan sueltos»); documentos en dos idiomas; hora local de la persona junto a su teléfono.

### P17 · Estados intermedios de una operación de venta
- **Qué es:** apartado, promesa, crédito en trámite, avalúo, firma, escrituración, entrega. Una operación se **cae** y vuelve a empezar con otro comprador, sin perder lo andado.
- **Casos:** A12, B1, B2, A3, C11.
- **Hoy:** ◐ Interesados con visita y oferta, estados del inmueble, el asunto se puede reabrir, y la metodología de captación dice que si un comprador se cae el inmueble vuelve a ofrecerse. No hay un **estado de la operación con un comprador** (apartó, promesa firmada, crédito en proceso, se cayó por…) con el motivo de la caída.
- **Ideas a evaluar:** el estado vive en la persona interesada dentro del asunto (no en el inmueble); «se cayó» pide motivo y deja al inmueble listo para otra oferta; qué se hace con el apartado recibido.

### P18 · Seguimiento largo (cuidar lo que todavía no es trabajo)
- **Qué es:** el curioso que pregunta cuánto vale, el inversionista que busca algo «en seis meses», el cliente que no puede firmar hasta que muera el juicio, el contrato de renta que vence dentro de un año.
- **Casos:** A6, B1, B4, I4, C1, F1.
- **Hoy:** ✔ «Guardar como contacto» con fecha de volver a llamar; asunto en espera con fecha; tareas repetidas.
- **Ideas a evaluar:** que los **contratos de renta** y los **documentos con plazos largos** generen solos el aviso de renovación; ver el patrón de «asuntos dormidos» en Equipo.

### P19 · Alcance: ¿qué hace y qué no hace Fortius?
- **Qué es:** el despacho puede atender asuntos que no tienen inmueble (laboral, familiar, penal, corporativo). Una inmobiliaria no. El panel necesita saber qué cabe y qué se deriva.
- **Casos:** familia H completa, I22.
- **Hoy:** ◐ «Lo que no se encargó no aparece», y Inmueble es un apartado opcional, así que un asunto sin inmueble cabe. `SPEC.md` no dice qué materias acepta Fortius.
- **Decidido por el titular (18/11/2026):** *no todo asunto empieza con un inmueble, pero todo termina en uno.* Fortius, con sus abogados, también lleva los juicios y trámites que desembocan en un inmueble (sucesorio, cesión de derechos que es un juicio especial hipotecario, prescripción, derecho registral) y guarda su expediente para tener el control documental. **Fuera del giro:** asuntos penales, corporativos y fiscales que no tengan que ver con un inmueble. Ya está anotado en `SPEC.md` (sección 2, sección 5 y sección 18).
- **Lo que esa decisión le exige al panel:** un asunto debe poder **abrirse sin inmueble ligado** y llevar un **inmueble esperado** (el que se adjudicará al final), y al llegar la sentencia pasar a venta con «Continuar en un asunto nuevo», que ya existe. La consulta debe preguntar qué se busca lograr antes de las preguntas del inmueble. El sitio público no cambia.
- **Casos de este catálogo que quedan fuera del giro:** H14 (cobranza de pagarés sin inmueble), H15 (laboral, penal, familiar puro, corporativo), H11 (constituir o reformar una sociedad). **Sí se llevan, aunque sean penales** (decidido 18/11/2026, porque nacen de un inmueble): F6 fraude inmobiliario y F7 despojo o invasión. También **sí** (decidido 18/11/2026): F14 impugnar un predial, un valor catastral o un impuesto de adquisición. También **sí:** E6 divorcio cuando lo que se reparte es la casa (decidido 18/11/2026; sigue valiendo P13: Fortius no puede representar a los dos cónyuges). **Se deriva:** H10 migratorio (decidido 18/11/2026). **Por confirmar:** H12 cumplimiento para otras inmobiliarias.

### P20 · Reglas que cambian con el lugar y con la fecha
- **Qué es:** el municipio (Tijuana, Rosarito, Ensenada, Tecate, Mexicali) cambia impuestos, derechos, trámites y notarías; la ley cambia y un cálculo hecho en enero puede estar mal en diciembre.
- **Casos:** I20, I18, B3, D9, D10.
- **Hoy:** ✔ El inmueble guarda su municipio y no se supone Tijuana; todo cálculo dice su fuente y la fecha de revisión.
- **Ideas a evaluar:** que el municipio **ordene** los pasos y las listas sugeridas, no solo los cálculos; aviso cuando un cálculo guardado es anterior a un cambio de regla.

### P21 · Cierre, entrega y postventa
- **Qué es:** no todo cierre es «se logró» o «no se dio». Hay cierre por **retiro del cliente**, por **renuncia del despacho**, por **fallecimiento del cliente**, por **traspaso a otro abogado**, por **entrega del expediente**. Hay resguardo del expediente por años y seguimiento posterior (la garantía, el predial, el pago final).
- **Casos:** I5, I6, F10, A1, H1.
- **Hoy:** ◐ Cierre en dos resultados con motivo; deshacer; reabrir.
- **Ideas a evaluar:** más motivos de cierre en la misma lista desplegable; «Entrega del expediente» como tarea y documento; fecha de **resguardo hasta** para saber cuándo se puede depurar.

### P22 · Fortius como parte
- **Qué es:** a veces Fortius compra para sí, invierte con un socio, o un asesor del equipo es contraparte. También cobra honorarios a sus propios clientes y puede tener que demandarlos.
- **Casos:** I19, F9, F10.
- **Hoy:** ✘ No hay forma de marcar un asunto como «propio» ni de separar lo de Fortius del dinero de clientes.
- **Ideas a evaluar:** persona especial «Fortius» como parte; asuntos propios fuera de las cifras de clientes en Equipo.

---

## 4. Los casos

**Cómo leer cada caso.** `Llega:` cómo entra. `Es:` lo que realmente es, con sus salidas posibles (**VENTA, LITIGIO, TRÁMITE, REVISIÓN, ADMINISTRACIÓN** son solo etiquetas para entender; no son tipos del panel). `Exige:` los patrones de la sección 3 que dispara. Entre paréntesis, la frecuencia supuesta. **[T]** marca un caso que contó el titular.

### A. Vender

**A1 · Propietario que quiere vender (Alta) [T]**
Llega: llamada, WhatsApp o formulario del sitio. Es: VENTA si procede; antes, revisar escritura, predial y certificado de gravámenes. Variantes que cambian el camino: con hipoteca, con crédito Infonavit, en copropiedad, con inquilino adentro, con muebles, con adeudos, con precio de expectativa muy arriba del mercado. Exige: P4, P17, P2.

**A2 · Dueño que vive en Estados Unidos (Alta) [T]**
Llega: llamada desde fuera. Es: antes de vender hay un asunto previo, el **poder** (consular o notarial) para que alguien firme por él; o él viaja a firmar. Datos que el panel debe pedir desde la consulta: ¿el dueño está aquí o fuera?, ¿tiene alguien de confianza?, ¿puede venir? Variantes: firma en consulado, apostilla, envío de originales por paquetería, cónyuge también fuera. Exige: P3, P7, P8, P16.

**A3 · Venta con hipoteca vigente (Alta)**
Llega: «quiero vender pero todavía debo». Es: VENTA con **liquidación de la deuda en la misma firma**: carta de saldo del banco o Infonavit, cancelación de hipoteca simultánea. Variantes: banco que ya no existe (sociedades financieras que quebraron), crédito en mora, comprador que asume el crédito. Exige: P4, P3, P12.

**A4 · Venta con inquilino adentro (Media)**
Llega: «tengo la casa rentada y quiero vender». Es: VENTA con un contrato vigente: se vende con el inquilino, se da por terminado o se negocia su salida. Exige: P3, P5 (el contrato de renta sigue corriendo).

**A5 · Venta urgente por liquidez (Media)**
Llega: «necesito el dinero en 30 días». Es: VENTA rápida con precio a la baja, o venta a un inversionista, o cesión de derechos. Si hay deuda con fecha de remate, es el caso F1. Exige: P9 (urgencia), P2.

**A6 · «¿Cuánto vale mi casa?» (Alta)**
Llega: formulario o llamada sin intención clara. Es: opinión de valor como servicio puntual (con honorario) o un prospecto que se cultiva meses. No es asunto aún. Exige: P18.

**A7 · Empresa que vende nave, terreno industrial o local (Media) [T]**
Llega: representante o gerente. Es: VENTA con persona moral, precio en dólares, ficha técnica a fondo (kVA, altura libre, andenes), permisos y planos, y revisión de que el representante tenga poder para vender. Es el caso 6 de `docs/casos-reales.md`. Exige: P7, P8, P14.

**A8 · Desarrollador con unidades en preventa (Media)**
Llega: «tengo 40 casas / 120 lotes». Es: VENTA masiva con esquemas de pago, apartados, promesas y escrituración por etapas. Cada unidad tiene su comprador, su crédito y su fecha de entrega. Exige: P6, P17, P5.

**A9 · Constructor informal (Media) [T]**
Llega: WhatsApp. Es: VENTA de varias casas de un amigo constructor, con un cliente que no va a llenar formatos: la captura tiene que ser por plática. Exige: P6, P16.

**A10 · Casa adjudicada o recuperada por un banco o Infonavit (Media)**
Llega: un gestor o el departamento de cartera de un banco. Es: VENTA donde **el propietario es una institución** con sus propias reglas (ofertas por escrito, formatos, plazos, pago del 10% de apartado). Exige: P7, P17.

**A11 · Inmueble de otra inmobiliaria, en colaboración (Media)**
Llega: un colega que comparte su cartera. Es: VENTA compartida con reparto de comisión (50/50 u otro). El sitio ya lo marca «En colaboración». Exige: P11.

**A12 · La operación se cae (Alta)**
Llega: el comprador no obtuvo el crédito, el avalúo salió bajo, se arrepintió, o el propietario cambió de idea. Es: reabrir la comercialización conservando lo hecho y qué pasó con el apartado. Exige: P17.

**A13 · Venta con reserva de dominio o a plazos, Fortius como cobrador (Media) [T]**
Llega: dueño que vende a mensualidades. Es: contrato a plazos con cobro por años, mora, rescisión y escrituración al final. Es el caso 3 de `docs/casos-reales.md`, visto desde el cobro. Exige: P5, P11.

**A14 · Terreno con sentencia de prescripción (Media) [T]**
Es el caso 2 de `docs/casos-reales.md`. Exige: P4 (título distinto de una escritura).

### B. Comprar y buscar

**B1 · Comprador con un perfil, sin casa elegida (Alta) [T]**
Llega: «busco casa de 3 recámaras por la Otay hasta 2 millones». Es: **búsqueda** (no hay inmueble aún): se capturan preferencias y se cruzan con el inventario; y gestión de crédito. Forma de pago (contado, Infonavit, Fovissste, banco, cofinanciamiento, mixto) cambia los pasos y los vencimientos. Exige: P17, P18, P14.

**B2 · Comprador con casa ya elegida (Alta) [T]**
Es el caso 5 de `docs/casos-reales.md`: solo trámite. Si es un familiar, el costo del impuesto de adquisición cambia. Exige: P13 (¿a quién representamos?), P3.

**B3 · Extranjero que compra en la costa (Alta) [T]**
Llega: un estadounidense que quiere casa en Rosarito o Playas. Es: VENTA con **fideicomiso bancario** por zona restringida (verificar), gestión con el banco fiduciario, otros tiempos y una **anualidad** que se paga todos los años. Además: idioma, apostilla y traducción, ID, RFC para extranjeros, apertura de cuenta, transferencia internacional, y quizá residencia. Exige: P3, P5, P7, P16, P20.

**B4 · Comprador inversionista (Alta) [T]**
Llega: cliente recurrente (tipo Liliana). Es: compra de adjudicados, cesión de derechos, remates, para rehabilitar y revender. Quiere ver todo junto y rápido. Exige: P6, P14, P17.

**B5 · Empresa que busca local o nave (Media)**
Llega: una cadena, una franquicia o una maquiladora. Es: **búsqueda con requisitos técnicos** (uso de suelo para su giro, kVA, andenes, estacionamiento), muchas ubicaciones, a veces en varios municipios. Exige: P6, P16.

**B6 · Compra entre varios (amigos, hermanos, pareja sin matrimonio) (Media)**
Llega: «vamos a comprar entre tres». Es: compra en **copropiedad** con porcentajes, convenio de copropiedad, y reglas para salir del negocio (derecho de preferencia entre copropietarios; verificar). Exige: P1, P8.

**B7 · Comprador de terreno para construir (Media)**
Es: antes de comprar, un **estudio de factibilidad**: uso de suelo, densidad permitida, servicios (agua, luz, drenaje), topografía, riesgos (cauce, ladera, falla), afectaciones, accesos. Es un servicio cobrable que puede terminar en «no compres». Exige: P4, P12.

**B8 · Compra «con traspaso» (Alta)**
Llega: «me vende su lote con una carta de compraventa». Es: comprador de buena fe sin escritura de su vendedor; hay que decidir si se compra y cómo (cesión, regularización, prescripción). Exige: P4, P2.

**B9 · El amigo de los terrenos (Alta) [T]**
Llega: WhatsApp con fotos de papeles. Es: **debida diligencia**: ¿el vendedor es dueño? ¿el terreno existe y está libre? ¿hay fraude? Termina en dictamen, en «compra segura» o «no compres». Exige: P2, P15, P16.

**B10 · Remate judicial o subasta (Baja)**
Llega: comprador interesado en un inmueble que va a rematarse. Es: asesoría previa (postura, depósito, condiciones, desocupación posterior). Exige: P9, P10.

**B11 · Un hermano compra la parte de los otros (Media)**
Es: **extinción de copropiedad** con adjudicación a uno que paga a los demás (a veces con crédito). Es la salida buena de E5. Exige: P1.

**B12 · Compra entre familiares (Alta) [T]**
Es el caso 5 de `docs/casos-reales.md`. Cambia la tasa del impuesto de adquisición por parentesco (ver `docs/herramientas`).

### C. Rentar y administrar

**C1 · Propietario que renta su casa o departamento (Alta)**
Llega: «quiero rentar». Es: RENTA: ficha, publicación, investigación del inquilino, fiador u obligado solidario o póliza jurídica, depósito, contrato, inventario de entrega. Luego, **vigencia, aumento anual y renovación**. Exige: P5, P18.

**C2 · Plaza con muchos locales (Media) [T]**
Es el caso 4 de `docs/casos-reales.md`. La maestra de la plaza es el cliente; cada local tiene su estado, su inquilino, su contrato y su cobro. Exige: P6, P5.

**C3 · Inquilino que busca (Alta)**
Llega: «busco depa para rentar». Es: **búsqueda** con perfil, visitas, y a veces ayuda con el contrato. Muchos terminan en ningún asunto. Exige: P18.

**C4 · Negocio que quiere rentar un local (Media)**
Llega: «quiero abrir una taquería». Es: **viabilidad del giro**: uso de suelo permitido, licencia de funcionamiento, protección civil, anuncio, estacionamiento. Puede terminar en «ese local no sirve para eso». Exige: P4, P12, P20.

**C5 · Administración permanente para dueño ausente (Alta) [T]**
Llega: dueño que vive fuera. Es: cobrar la renta, mantener, pagar predial y servicios, reportar y liquidar cada mes, por años. **Un asunto que no termina.** Exige: P5, P11, P12, P16.

**C6 · Renta de corta estancia (Media)**
Llega: dueño de casa de playa o departamento turístico. Es: **ciclos por reservación** (entrada, salida, limpieza, reporte, pago al dueño), temporadas, impuesto de hospedaje (verificar). Exige: P5, P11.

**C7 · Renta industrial en dólares (Media)**
Es: contratos de varios años, ajustes anuales por índice, depósito en dólares, requisitos de operación, a veces construcción a la medida del inquilino. Exige: P5, P11.

**C8 · Inquilino que no paga o no se va (Alta)**
Llega: «mi inquilino lleva cuatro meses sin pagar». Es: cobranza amistosa → requerimiento notarial → juicio de arrendamiento o desahucio → desocupación con diligencia (verificar vía en Baja California). **Hay términos legales.** Exige: P9, P10, P5.

**C9 · Inquilino que quiere salir antes o traspasar (Media)**
Es: terminación anticipada con penalización, o traspaso del local a un tercero (con permiso del dueño). Exige: P3, P13 (¿a quién representamos?).

**C10 · Casa vacía que nadie cuida (Media)**
Llega: heredero o dueño ausente. Es: vigilancia, mantenimiento, predial y servicios al corriente, **prevención de invasión**. Muchas veces es el inicio de C5 o de F7. Exige: P5, P9.

**C11 · Entrega, daños y depósito en disputa (Media)**
Es: el inventario de entrega no coincide con el de salida; el inquilino exige su depósito. Necesita evidencia (fotos con fecha, inventario firmado). Exige: P15.

**C12 · Renta con opción a compra o compraventa a plazos (Baja)**
Es: contrato con parte de la renta aplicada al precio; al final se escritura. Exige: P5, P11.

### D. Regularizar y sanear

**D1 · Terreno ejidal o pura posesión (Alta) [T]**
Llega: una constancia ejidal, o ni eso. Es: **depende del régimen**: dominio pleno, cesión de derechos parcelarios, adopción de dominio, venta de solar urbano, o de plano «no se puede vender aún». La jurisdicción es **agraria**, no civil. Si el ejidatario falleció, hay sucesión agraria. Exige: P4, P3, P10.

**D2 · «Quiero mis escrituras» después de años de vivir ahí (Alta) [T]**
Es: **prescripción adquisitiva** (o diligencias de información de dominio, según el caso; verificar). Juicio largo; ya hay una plantilla en Drive. Exige: P4, P10, P5 (largo plazo).

**D3 · Lote de colonia irregular con carta de posesión (Alta)**
Llega: «compré con una carta de la asociación». Es: regularización por programa público si existe (verificar), o por prescripción; riesgo de que el terreno sea de otro dueño o federal. Exige: P4, P2.

**D4 · Casa pagada que nunca se escrituró (Media)**
Llega: «terminé de pagar y el desarrollador desapareció». Es: **escrituración por juicio** (otorgamiento y firma de escritura, verificar) o trámite con quien hoy sea el titular. Exige: P4, P10.

**D5 · Escritura sin inscribir o con problema en el registro (Alta)**
Es: la escritura nunca se inscribió; o el registro rechazó el trámite; o hay dos folios; o el antecedente no existe. Se resuelve con trámite ante el registro público y, a veces, recurso. Exige: P10, P12.

**D6 · Errores en la escritura o en las actas (Alta)**
Es: nombre mal escrito, superficie distinta, colindancias dudosas, estado civil distinto al real. **Aclaración o rectificación**, y a veces corregir el acta en el registro civil primero (D15). Exige: P3, P10.

**D7 · Escritura extraviada (Media)**
Es: pedir copia certificada o segundo testimonio ante la notaría o el archivo. Exige: P15.

**D8 · Cancelar gravámenes (Alta) [T]**
Es: hipoteca (también de un banco que ya no existe), embargo, anotación de demanda, usufructo (al fallecer el usufructuario), patrimonio familiar, reserva de dominio, fideicomiso, **caducidad de la hipoteca** (verificar). Es el caso 5 de `docs/casos-reales.md` en su parte de cancelación. Exige: P4, P3, P10.

**D9 · Construcción sin licencia o ampliación irregular (Alta)**
Llega: «agrandé la casa y no tengo permisos». Es: regularizar con el municipio: licencia, terminación de obra, uso de suelo, número oficial. Bloquea ventas con crédito. Exige: P4, P12, P20.

**D10 · Subdividir, fusionar, lotificar, constituir condominio (Media) [T]**
Es: trámites de catastro, municipio y registro para cambiar la forma del predio. Exige: P10, P12, P20.

**D11 · Adeudos de predial, agua, luz o cuotas (Alta)**
Es: ponerse al corriente, pedir descuentos, tramitar carta de no adeudo, cambiar el nombre en los servicios. Casi siempre es una tarea dentro de otro asunto, pero hay quien contrata solo esto. Exige: P12.

**D12 · Inmueble con afectación (Media)**
Es: zona federal marítimo-terrestre con concesión, derecho de vía, arroyo o cañada, línea de alta tensión o ducto, zona de riesgo, o **expropiación en proceso**. Cambia si se puede construir, vender o indemnizar. Exige: P4, P10.

**D13 · Predio sin acceso, servidumbre o lindero en disputa (Media) [T]**
Es: servidumbre de paso, bardas compartidas, vecino que construyó dentro del predio, **deslinde** (si solo hay que medir) o juicio reivindicatorio (si hay conflicto). Exige: P2, P12.

**D14 · Patrimonio familiar, usufructo o nuda propiedad (Media)**
Es: el dueño donó la propiedad conservando el usufructo, o el predio está afectado como patrimonio de familia; para vender hay que cancelar o negociar con el otro titular. Exige: P4, P1.

**D15 · Corregir acta o identidad para poder firmar (Media)**
Es: el nombre en la identificación no coincide con la escritura o con el acta; **juicio o trámite de identidad** o corrección en el registro civil. Exige: P3.

### E. Familia y sucesiones

**E1 · Casa de alguien que falleció (Alta) [T]**
Llega: «mi mamá falleció y la casa está a su nombre». Es: **sucesión** notarial si hay acuerdo y papeles en orden, judicial si no. La pregunta que decide: ¿están todos de acuerdo? Variantes: con testamento o sin él, con herederos fuera, con un heredero ocupando la casa, con la casa invadida (caso 1 de `docs/casos-reales.md`), con créditos pendientes. Exige: P1, P3, P4, P7.

**E2 · Sucesión de sucesión (Media)**
Llega: «mi abuelo murió y su hijo también, y nunca se hizo nada». Es: varias sucesiones encadenadas, con herederos de herederos y varias actas. Exige: P1, P3.

**E3 · Dejar todo en orden (Media) [T]**
Llega: una persona sana o con diagnóstico grave. Es: testamento, poderes, voluntad anticipada, designar quién se queda con qué: **gestión notarial pura, cobrable y rápida**. A veces incluye revisar un testamento viejo o buscar si existe uno. Exige: P8, P7.

**E4 · Donar en vida (Media)**
Es: donación de padres a hijos, a veces reservándose el usufructo, con revisión de impuestos y del riesgo de pleito entre hermanos después. Exige: P4, P1.

**E5 · Hermanos que no se ponen de acuerdo (Alta) [T]**
Llega: «mi hermano quiere vender y yo no». Es: **extinción de copropiedad**: venta a tercero, un hermano compra la parte de los otros, división física, o **juicio de división**. El asunto es el desacuerdo. Exige: P1, P2, P13.

**E6 · Divorcio y la casa (Alta) [T]**
Llega: pareja que se separa. Es: liquidación de la sociedad conyugal, **venta**, adjudicación a uno que paga la parte del otro (a veces con crédito) o litigio. A veces un solo abogado no puede llevar a los dos. Exige: P1, P13, P2.

**E7 · Heredero menor de edad o con incapacidad (Media)**
Es: se necesita tutor y, para vender, **autorización del juez** (verificar). Los plazos son otros. Exige: P7, P10.

**E8 · Adulto mayor y posible abuso patrimonial (Media)**
Llega: la hija quiere vender la casa de su mamá «con un poder». Es: antes que nada, **hablar con la titular sola y confirmar su voluntad**, y revisar si tiene capacidad (verificar con abogado). Puede terminar en «no firmamos». Exige: P7, P8, P13.

**E9 · Heredero ausente o que no aparece (Media)**
Es: heredero en otro país, sin contacto, o desaparecido. Hay que notificarlo, a veces por edicto. Retrasa todo. Exige: P1, P7.

**E10 · Albacea que administra la herencia (Media)**
Es: administrar (rentar, pagar, vender) los bienes del difunto y **rendir cuentas** a los herederos. Asunto continuo. Exige: P5, P11, P8.

**E11 · Unión libre y bienes en común (Media)**
Es: pareja sin matrimonio que compró junta, o uno puso el dinero y el otro la firma; al separarse o al fallecer uno, hay pleito. Exige: P1, P4.

**E12 · Seguro de vida del crédito (Baja)**
Llega: «murió el titular del crédito y quedamos debiendo». Es: **reclamar el seguro** que liquida la deuda; luego, sucesión. Exige: P3, P9.

**E13 · Quién debe firmar (Alta)**
Llega: cualquier venta con un vendedor casado, viudo o divorciado. Es: ¿el bien es propio o ganancial? ¿el cónyuge debe consentir? ¿hay divorcio en trámite? Se detecta en la consulta y cambia quién firma. Exige: P7.

### F. Dinero, deuda y conflicto

**F1 · Deudor al que le quieren adjudicar la casa (Media) [T]**
Llega: urgente, con una notificación. Es: **un término corre**: hay que defenderse (litigio), negociar un convenio con el acreedor, o vender antes (cesión de derechos o venta). Se decide en días. Exige: P9, P10, P2, P13.

**F2 · Prestar o pedir prestado con la casa en garantía (Media)**
Llega: un inversionista que presta, o un dueño que necesita crédito privado. Es: mutuo con **garantía hipotecaria** o con venta simulada «de respaldo» (riesgo alto; verificar con el abogado). Si no paga, ejecución. Exige: P11, P14, P13.

**F3 · Cesión de derechos (Alta) [T]**
Llega: el inversionista. Es: comprar o vender los **derechos** sobre un inmueble (adjudicación, remate, herencia, posesión, crédito), con su subtipo. Cliente recurrente. Exige: P6, P14.

**F4 · Comprador que incumple (Media) [T]**
Es: **rescisión** del contrato, devolución parcial, cláusula penal, recuperar el inmueble. Es el caso 3 de `docs/casos-reales.md`. Exige: P10, P3.

**F5 · Vendedor que no entrega o vendió dos veces (Baja)**
Es: exigir cumplimiento, devolver anticipo o denunciar. Exige: P10, P15.

**F6 · Víctima de fraude inmobiliario (Media)**
Llega: «pagué un anticipo y el terreno era de otro». Es: querella penal y acción civil, **urgente**, con mucha evidencia (recibos, chats, transferencias). Si no se actúa pronto, el dinero se pierde. Exige: P9, P10, P15, P16.

**F7 · Invasión o despojo (Alta) [T]**
Llega: el dueño de un lote baldío que descubre invasores. Es: **LITIGIO** (denuncia penal, juicio para recuperar la posesión) y a veces desalojo; **urgente** por plazos. Exige: P9, P10, P15 (evidencia: fotos con fecha, acta notarial).

**F8 · Casa nueva con defectos o entrega retrasada (Media)**
Es: reclamo a la constructora (garantía, vicios ocultos, retraso); puede resolverse por convenio o juicio. Exige: P10, P15.

**F9 · Comisión que no pagan (Media)**
Llega: Fortius capta un comprador y el cliente cierra por fuera. Es: cobrar la comisión pactada (carta, convenio o juicio mercantil). Fortius es parte. Exige: P22, P11, P10.

**F10 · Honorarios del despacho sin pagar (Baja)**
Es: cobranza propia, a veces hasta suspender el servicio. Exige: P22, P21.

**F11 · Deudor en concurso o desarrollador en quiebra (Baja)**
Es: el inmueble está atrapado en un procedimiento colectivo. Exige: P10, P4.

**F12 · Embargo sobre un inmueble (Media)**
Es: se descubre durante el estudio (certificado de gravámenes) o llega como notificación. Hay que levantarlo, negociar o replantear la operación. Exige: P4, P9, P10.

**F13 · Notificación recibida (Alta) [T]**
Llega: «me llegó esto del juzgado». Es: lo primero es **leerla y fijar el término**; después se decide qué hacer. Exige: P9, P10.

**F14 · Impugnar un cobro o un acto de autoridad (Media)**
Es: predial o valor catastral excesivo, impuesto de adquisición mal calculado, multa, clausura de un local, negativa de licencia. Amparo, recurso administrativo o juicio fiscal. Hay términos cortos. Exige: P9, P10, P12.

**F15 · Conflicto de condominio (Media)**
Es: cuotas atrasadas, obras en área común, ruido, reglamento, asamblea. El cliente puede ser el condómino o la administración. Exige: P10, P13.

**F16 · Pleito con el vecino (Media)**
Es: barda, filtración, árbol, ruido, vista. Se resuelve con convenio, mediación o juicio. Exige: P2.

### G. Empresas, desarrollo e inversión

**G1 · Persona moral que compra o vende (Alta) [T]**
Es: acta constitutiva, poder del representante, identificación de los dueños reales y otros documentos; puede faltar corregir la sociedad antes. Exige: P7, P8, P14.

**G2 · Desarrollador o constructor (Media)**
Es: asuntos de obra y de venta mezclados: licencias, terminación de obra, entrega de áreas, escrituración de unidades, garantías. **Muchos inmuebles, muchos compradores, muchos vencimientos.** Exige: P6, P5, P12.

**G3 · Terreno de uno, construcción de otro (Media)**
Es: aportar el terreno a cambio de unidades o de un porcentaje de utilidad; asociación o fideicomiso; reglas de reparto. Exige: P1, P11.

**G4 · Inversionista con cartera (Alta) [T]**
Es: varias propiedades y operaciones a la vez, **cliente recurrente**; quiere ver todo junto. Exige: P6, P14.

**G5 · Grupo de inversión (Baja)**
Llega: «somos diez que ponemos dinero para comprar y revender». Es: reparto de aportaciones y utilidades; **cuidado: no captar dinero del público** (verificar con el abogado). Exige: P1, P14, P11.

**G6 · Cambio de uso o venta con renta de regreso (Baja)**
Es: convertir casa en oficina, o vender el edificio y seguir como inquilino. Exige: P4, P20.

**G7 · Empresa extranjera en parque industrial (Media)**
Es: renta o compra de nave por una filial; permisos de operación, energía, protección civil, y a veces construcción a la medida. Exige: P5, P7, P12, P16.

**G8 · Fideicomiso nacional (Baja)**
Es: fideicomiso de garantía, de administración o traslativo de dominio, con una fiduciaria. Exige: P8, P12.

**G9 · Condominio o asociación de colonos como cliente (Baja)**
Es: persona moral colectiva con asamblea, cuotas, reglamento. Exige: P7, P10.

**G10 · Gobierno como contraparte (Baja)**
Es: expropiación, compra por el municipio, arrendamiento a una dependencia (pagos lentos, formalidades). Exige: P7, P10, P9.

### H. Despacho: servicios jurídicos puntuales

**H1 · Consulta jurídica corta, cobrable (Alta)**
Llega: «una hora con el abogado». Es: un servicio sin asunto posterior, con honorario fijo y nota de lo dicho. Exige: P11.

**H2 · Revisar un contrato ajeno antes de firmar (Alta)**
Es: contrato de renta, promesa, de la constructora, hipotecario. El cliente puede ser arrendatario, comprador o vendedor. Es **REVISIÓN** con entregable. Exige: P13.

**H3 · Redactar un contrato a la medida (Alta)**
Es: promesa, mandato, asociación, convenio de pago, comodato, finiquito. Exige: P7.

**H4 · Requerimiento o carta formal (Media)**
Es: carta de cobro, de desocupación o de incumplimiento, a veces por notaría. Es el paso previo a un litigio. Exige: P9, P15.

**H5 · Poder: otorgar, revocar, verificar (Media)**
Es: poder general o especial, vigencia, revocación. Exige: P8.

**H6 · Convenio extrajudicial o mediación (Media)**
Es: resolver sin juicio, con un convenio que luego se puede ejecutar. Exige: P1, P10.

**H7 · Fe de hechos o acta notarial (Media)**
Es: constar ante notario el estado de un inmueble, una invasión, una entrega. **Evidencia.** Exige: P15.

**H8 · Gestoría de trámites sueltos (Alta) [T]**
Es: licencias, constancias, catastro, registro público, municipio, servicios, SAT. Un trámite por vez, cobrado por trámite. Exige: P12.

**H9 · Apostilla, traducción oficial, legalización (Media)**
Es: para documentos que vienen de fuera o van fuera. Exige: P7, P16.

**H10 · Migratorio ligado a la compra (Baja)**
Es: residencia o permiso para el extranjero que compra o renta. Probable derivación. Exige: P19.

**H11 · Sociedad o cambio de representante para que la empresa pueda comprar (Media)**
Es: constituir, reformar o apoderar. Exige: P8.

**H12 · Cumplimiento para otras inmobiliarias o desarrolladores (Baja)**
Es: expediente de identificación, avisos, aviso de privacidad. Exige: P14, P19.

**H13 · Representación en juicio (Alta)**
Es: llevar un juicio civil, mercantil, familiar, agrario o administrativo. Es el caso de **F1, F4, F7, F13, E5, C8, D2**. Exige: P10, P9, P11.

**H14 · Cobranza judicial de pagarés o cheques (Media)**
Es: no siempre tiene inmueble. Decisión del titular: ¿se atiende? Exige: P19.

**H15 · Asuntos sin inmueble: laboral, penal, familiar, corporativo (Baja)**
Es: asuntos de un despacho general. Decisión del titular: ¿se atienden o se derivan? Exige: P19.

### I. Casos atípicos y de borde

El panel no debe romperse con estos.

**I1 · Cliente sin nombre completo o que no quiere dar datos (Alta)**
Es: llega con miedo o con desconfianza. El asunto debe poder abrirse con «sin nombre» y completar después. Exige: P16.

**I2 · Una familia con cuatro asuntos hermanos (Media)**
Es: tres hermanos con tres propiedades y una sucesión pendiente. Cada asunto es distinto; el cliente es el mismo grupo. Exige: P6, P3.

**I3 · El asunto cambia de naturaleza (Alta)**
Es: iba a vender, ahora hay que regularizar; iba a regularizar y ahora se cede el derecho. El historial debe contar la historia entera. Exige: P2, P3.

**I4 · Asunto congelado por años (Alta)**
Es: espera de un juicio, de una sucesión, de una resolución. No está abandonado: hay que revisarlo cada trimestre y no ensuciar Inicio. Exige: P5, P18, P9.

**I5 · El cliente fallece durante el asunto (Baja)**
Es: sus herederos deben continuar o terminar el encargo; el contrato de honorarios cambia de parte. Exige: P7, P21.

**I6 · El cliente se retira, o Fortius renuncia (Media)**
Es: cierre con entrega de expediente y, si hay juicio, aviso a la autoridad. Exige: P21.

**I7 · La contraparte es cliente de otro asunto (Media)**
Es: conflicto de intereses posible. Aviso, no bloqueo. Exige: P13.

**I8 · Hermanos que piden lo contrario (Alta)**
Es: ¿a quién representa Fortius? Puede tener que escoger o derivar a otros. Exige: P13, P1.

**I9 · La misma persona con dos fichas, o dos personas con el mismo nombre (Media)**
Es: unir fichas ya existe; falta el aviso de **homónimos** al capturar. Exige: P7.

**I10 · Persona que no es quien dice, o documento falso (Baja)**
Es: suplantación, escritura falsa. Verificar en origen y registrar lo que se encontró. Exige: P15, P9.

**I11 · Pago en efectivo o de origen dudoso (Media)**
Es: aviso y posible negativa. Debe quedar anotado, sin frenar el sistema pero con un registro claro. Exige: P14.

**I12 · El cliente pide algo indebido (Baja)**
Es: «pon un precio menor en la escritura», «haz una venta falsa». Debe quedar registrada la negativa. Exige: P14, P13.

**I13 · Cliente que no puede pagar honorarios (Media)**
Es: pago al final, pago en especie, cuota litis, pro bono. Exige: P11.

**I14 · Cliente que no sabe leer o firmar, o con discapacidad (Baja)**
Es: firma a ruego, testigos, huella, intérprete. Exige: P7.

**I15 · Cliente que habla otro idioma (Media)**
Es: inglés, lengua indígena. Documentos en dos idiomas, mensajes en su idioma. Exige: P7, P16.

**I16 · Cliente que solo escribe por WhatsApp (Alta) [T]**
Es: mensajes, fotos, audios y PDFs sueltos que hay que ordenar. Exige: P16, P15.

**I17 · Desastre natural (Baja)**
Es: sismo, deslave o inundación; reclamo de seguro; peritaje; efecto en una venta en curso. Exige: P9, P15.

**I18 · La regla cambia durante el asunto (Media)**
Es: cambian impuestos, derechos o tarifas; un presupuesto o cálculo guardado queda viejo. Exige: P20.

**I19 · Fortius compra o invierte para sí (Baja)**
Es: asunto propio; no cuenta como cliente. Exige: P22.

**I20 · Inmueble en otro municipio (Alta)**
Es: casa en Rosarito con oficina en Tijuana; otros impuestos, otras oficinas, otras notarías. Exige: P20.

**I21 · Crédito de Infonavit, Fovissste o banco con sus propios pasos (Alta)**
Es: cada institución tiene pasos y documentos propios (precalificación, avalúo, notaría autorizada, firma). Son planes de la Biblioteca, no reglas del panel. Exige: P12, P17.

**I22 · «Solo quiero hablar con el abogado» (Media)**
Es: no quiere intermediación, solo opinión jurídica. Exige: P19, P11.

---

## 5. Pruebas de escritorio que conviene hacer primero

Elegí casos que juntos recorren casi todos los patrones. Sugiero sumarlos a `docs/casos-reales.md` (con el visto bueno del titular) y recorrerlos contra `SPEC.md`:

| Caso | Por qué | Patrones que prueba |
| --- | --- | --- |
| E5 · Hermanos en desacuerdo | Asunto donde el desacuerdo es el objeto; tres salidas | P1, P2, P13 |
| A2 + B3 · Dueño o comprador en Estados Unidos | Asunto previo (poder, fideicomiso), firma remota, idioma | P3, P7, P8, P16 |
| D1 · Terreno ejidal | El régimen decide todo; trámite en otra jurisdicción | P4, P10 |
| C5 · Administración para dueño ausente | Asunto continuo con dinero ajeno | P5, P11, P12 |
| F1 · Deudor con adjudicación | Término corriendo; tres rutas | P9, P10, P2 |
| F13 · Notificación recibida | Fijar un término desde cero | P9, P10 |
| G4 · Inversionista con cartera | Cliente con muchos asuntos | P6, P14 |
| I3 · El asunto cambia de naturaleza | Historial y rutas | P2, P3 |
| I7 + I8 · Contraparte que es cliente | Conflicto de intereses | P13 |
| F6 · Fraude con WhatsApp y fotos | Urgencia, evidencia, canal informal | P9, P15, P16 |

---

## 6. Preguntas de negocio para el titular

Una a la vez, mostrando lo que aprueba (regla de `AGENTS.md`). En este orden, por lo que desbloquean:

1. ~~¿Hasta dónde llega el giro?~~ **Contestada el 18/11/2026:** todo asunto termina en un inmueble aunque no empiece con uno; no se ven penal, corporativo ni fiscal sin inmueble; sí registral. **Contestado después:** el fraude y el despojo de un inmueble sí se llevan. También **sí** lo fiscal de un inmueble (predial, valor catastral, impuesto de adquisición). El divorcio donde la casa es lo que se reparte también **sí**. Lo migratorio **se deriva**. **Pregunta cerrada.** (P19)
2. ~~**Litigio: ¿lo lleva Fortius o lo deriva?**~~ **Contestada el 18/11/2026:** lo llevan los abogados de Fortius, **con su propia cuenta en el panel**, y ahí queda el expediente y el control documental. **También contestada:** ven solo los juicios que llevan o en los que colaboran. **Pendiente:** si ven honorarios y cobros de esos juicios. (P9, P10)
3. ~~**Administración de rentas**~~ **Contestada el 18/11/2026:** Fortius **cobra al inquilino y liquida al dueño**. **Pendiente:** el abogado y un contador deben decir cómo se maneja ese dinero ajeno (dónde se recibe, facturas, impuestos) antes de construirlo. (P5, P11)
4. **¿Se representan partes opuestas?** En una venta, ¿Fortius cobra a ambos lados? ¿Y en lo jurídico? (P13)
5. **Asuntos reservados:** cada asesor ya ve solo lo que lleva. ¿Hay algo que ni el director deba ver, o que el Directorio no deba mostrar al resto del equipo (divorcios, fraudes, un familiar)? (P13)
6. **Formas de cobrar:** ¿cobra iguala mensual, cuota litis, por etapa o por hora? ¿Anticipos que se aplican a gastos? (P11)
7. **Cumplimiento:** ¿quiere ver en cada asunto un indicador de operaciones con aviso, o basta con la guía actual? (P14)
8. **Casos que prefiere derivar:** ¿hay algo de este catálogo que no quiere atender? Así el panel puede decir «eso se deriva» y no intentar llevarlo. (P19)
9. **Prioridad:** de las familias A a I, ¿cuáles llegan más a la oficina? (Corrige mis frecuencias supuestas.)

---

## 7. Lo que no se tocó

Este documento **no modifica** `SPEC.md`, `PLAN.md` ni `AGENTS.md`. Si el titular decide algo, la regla nueva va a `SPEC.md` y el avance a `PLAN.md`, y lo que ya no sirva se borra de aquí.
