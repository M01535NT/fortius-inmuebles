# Cuestionario complementario del ERP y CRM de Fortius

**Revisión inicial y conciliación:** 17 de octubre de 2026, America/Los_Angeles.

**Base vigente de la conciliación:** [PLAN_ERP_CRM.md](PLAN_ERP_CRM.md), después del [PR #42](https://github.com/M01535NT/fortius-inmuebles/pull/42), commit `1de616e`. La revisión inicial del código correspondió a `ff29ec8`; los cambios posteriores hasta esta base son documentales.

Este cuestionario conserva los identificadores P01–P84 de la revisión inicial y complementa las [preguntas vigentes para el titular](docs/erp-crm/PREGUNTAS_TITULAR.md). **El único plan de implementación sigue siendo `PLAN_ERP_CRM.md` y sus reglas vigentes prevalecen.** Los temas ya resueltos llevan su regla; las preguntas que coinciden con el cuestionario vigente se responden allí. Una respuesta pendiente no constituye aprobación.

**Primero se responden los grupos A y B del cuestionario vigente**, como establece el plan para MRP-01 y COR-10. Después se concretan los temas complementarios cuando llegue su entrega. Puedes responder en el archivo correspondiente o en el chat con su identificador. «No lo he decidido» y «Propón alternativas» conservan la decisión abierta; el silencio no aprueba una propuesta.

Al cerrar cada bloque, sus respuestas se traducirán en reglas y ejemplos verificables dentro del plan único. Si una respuesta contradice una decisión anterior, primero dejaremos claro qué cambia. Las preguntas de módulos posteriores pueden esperar hasta que corresponda diseñarlos.

## Correspondencias con el cuestionario vigente

Estos temas tienen relación con [PREGUNTAS_TITULAR.md](docs/erp-crm/PREGUNTAS_TITULAR.md). Cuando el alcance coincide, la entrada indica «Continuar en» y se responde allí. Cuando falta un detalle específico, conserva su campo de respuesta complementaria. Esta correspondencia no cierra una pregunta sin respuesta ni cambia la propuesta del otro archivo.

| Identificador original | Referencia en el cuestionario vigente |
| --- | --- |
| P04 · Equipo inicial | F-01 |
| P10 · Propietarios y representación | A-07 y A-08 |
| P17 · Ruta del arrendador | B-01 |
| P18 · Negociación que se cae | B-05 |
| P19 · Postventa y archivo | B-11 |
| P35 · Plantillas originales | D-02 |
| P37 · Contrato 09 | D-01 |
| P44 · Participación de otra inmobiliaria | B-08 y B-09 |
| P47 · Control comercial | E-06 |
| P51 · Hoy del administrador | E-03 |
| P55 · Alcance del asesor | F-02, F-03 y F-04 |
| P62 · Reparto de honorarios | G-02 |
| P64 · Monedas y tipo de cambio | G-04 |
| P68 · Notas | E-01 |
| P69 · Sitio web | E-05 |
| P72 · Importación | I-05 |
| P73 · Trabajo móvil | E-04 |
| P74 · Pruebas de uso | J-01 |

P02, P07, P20, P21, P32, P49, P50, P66 y P75 ya tienen una regla o un orden vigente; se conservan como referencias resueltas. Los demás identificadores mantienen preguntas de detalle sin cambiar las reglas aprobadas.

## Estructura que encontré en el panel

Este mapa describe las rutas y componentes locales inspeccionados. No acredita un recorrido autenticado de todas las pantallas en producción ni el funcionamiento remoto de cada módulo.

| Área | Estructura actual | Qué necesitamos precisar |
| --- | --- | --- |
| Hoy | `/admin`: operaciones que requieren atención, entrevistas pendientes, tareas, agenda, próximos siete días e informes al propietario. | Qué debe atenderse primero y qué representa cada aviso. |
| Operaciones | `/admin/operaciones`: lista por atención y filtros por fase; alta guiada y alta directa. | Unidad de trabajo, excepciones y rutas distintas de la venta. |
| Nueva operación | `/admin/operaciones/nueva`: cinco intenciones, contacto nuevo o existente y captura inicial; el propietario tiene un arranque simplificado. | Cuándo nace el encargo y qué información basta para abrirlo. |
| Una operación | `/admin/operaciones/[id]`: Esta etapa, Expediente, Tareas, Historial y Ajustes; captura documental en ventana propia. | Qué permite trabajar, revisar, avanzar y dar por concluido cada paso. |
| Contactos | `/admin/contactos`: Prospectos y Clientes; fichas de detalle en las rutas de leads y clientes. | Identidad única, varios papeles, conversión y seguimiento. |
| Inmuebles | `/admin/propiedades`: inventario, filtros, edición y acciones de publicación. | Datos de referencia, cambios de precio, disponibilidad y autorización pública. |
| Agenda | `/admin/agenda`: agenda semanal y pestaña Tareas; fichas de tareas. | Resultados de visitas, coordinación, tiempos y próximos pasos. |
| Herramientas | `/admin/herramientas`: catálogo y pestaña Documentos; cada app abre en `/admin/apps/[slug]`. Incluye Documentos sin expediente. | Relación entre cálculos, documentos de trabajo y evidencia de una operación. |
| Administración | Equipo; Sitio web con Textos, Blog y Archivos; Reportes con Control comercial; Historial; Configuración. | Facultades, responsabilidad editorial, datos de dirección y administración efectiva de cuentas. |
| Accesos auxiliares | Mi perfil, Notas, búsqueda y muestra de componentes en `/admin/sistema`. Las rutas antiguas tienen redirecciones. | Uso de notas y búsqueda; preferencias de trabajo. |

Fuentes de estructura: [navegación](src/components/admin/workspace/guided-nav.tsx), [marco administrativo](src/components/admin/workspace/admin-frame.tsx), [pantalla de operación](src/components/admin/operation/screen.tsx), [intenciones](src/lib/intake/interview.ts), [catálogo de herramientas](src/lib/apps/catalog.ts) y [redirecciones](next.config.ts).

## Decisiones registradas que tomo como base

No vuelvo a someter a elección estas decisiones. Las preguntas posteriores concretan sus límites o su aplicación:

- Fortius es un solo producto con sitio público y panel. COTA e Inmobiliaria OS son proyectos separados.
- Se conserva lo construido; el trabajo continúa mediante entregas acotadas.
- El boceto C y la captura de cada documento en su propia ventana son la dirección aprobada para Operaciones.
- El vendedor tiene diez etapas visibles, agrupadas en Conocer, Revisar, Preparar y publicar, y Vender y cerrar. Los ocho estados internos son una representación técnica distinta.
- La entrevista pide lo necesario para el proceso y ofrece «Ampliar» (RP-89). El levantamiento recoge lo observado en la visita; los datos que no se conozcan se completan después con los documentos, sin volver a la entrevista larga por defecto.
- Recibir, revisar, aprobar, firmar y pagar son hechos distintos. Guardar un inmueble y publicarlo también.
- Se permite descargar documentos con datos pendientes según las reglas registradas; el 07 tiene copia editable en Excel. Falta precisar qué acredita que un resultado está listo para su uso.
- El PDF del contrato 09 conserva su bloqueo. Ninguna respuesta en este cuestionario sustituye el cotejo y la revisión que correspondan.
- El informe al propietario es mensual y no bloquea el avance. Hoy también anticipa los próximos siete días; los avisos externos son una entrega posterior.
- Se conservan versiones, evidencia, conflictos de edición, historial y recuperación de operaciones eliminadas.
- Desde RP-90 a RP-92, una persona es prospecto hasta la firma del contrato correspondiente; la condición es por operación y no depende de la tabla técnica. La intermediación firmada determina que el inmueble está captado. COR-10 implementará esta regla: todavía no describe el comportamiento actual del código.
- RP-82 permite avanzar con datos pendientes y contar un PDF incompleto como emitido; la revisión con respaldo sigue siendo un requisito distinto. RP-85 fija Borrador → Revisado → Aprobado o Firmado. RP-84 fija el orden y el conteo de pendientes; RP-88 distingue informe preparado de entregado.

Estas decisiones constan en los apartados del plan sobre boceto C, flujo del vendedor, entrevista y levantamiento simplificados, documentos y proceso de comercialización. El [encargo visual](docs/diseno/ENCARGO_REDISENO_PANEL.md) conserva referencias anteriores a seis etapas; se interpreta junto con esas decisiones posteriores.

## Bloque 1. Resultado que buscas y primera entrega

Referencia: apartados «Qué vamos a construir», «Criterios de producto terminado», «Decisiones propuestas» y «Orden y ventanas orientativas» del [plan único](PLAN_ERP_CRM.md).

### P01. ¿Qué tres trabajos concretos debe permitirte terminar el sistema para que sientas que ya te resulta útil todos los días?

Describe el trabajo y su resultado, por ejemplo: terminar una captación con sus pendientes claros o saber qué operación necesita una decisión tuya.

**Respuesta:**

### P02. Orden de trabajo ya definido

**Estado: resuelta por «Orden vigente» y «Estado vigente» del plan.** Se empieza por USO-01 y MRP-01 y las correcciones COR; permanecen los pendientes de formatos, incluida la decisión de DOC-09. Los grupos A y B del cuestionario vigente alimentan la siguiente entrega. Este cuestionario no vuelve a pedir ordenar lo ya aprobado.

**Referencia:** [Plan único](PLAN_ERP_CRM.md), «Orden vigente».

### P03. Conservando venta como recorrido principal, ¿qué grado de servicio debe ofrecer la primera versión para compradores, arrendadores, arrendatarios e inversionistas?

El alcance ampliado y su orden ya están en el plan. Falta concretar el primer recorrido aceptable de cada ruta dentro de MRP-01, sin reducir por esta respuesta los módulos ya solicitados. Parte de los grupos A y B del cuestionario vigente.

**Respuesta:**

### P04. ¿Quiénes usarán el sistema durante la primera etapa y qué trabajo hará cada uno?

Bastan funciones y cantidad aproximada de personas: tú, asesores, apoyo administrativo y revisores. No incluyas datos de acceso.

**Continuar en:** F-01 de [PREGUNTAS_TITULAR.md](docs/erp-crm/PREGUNTAS_TITULAR.md).

### P05. ¿Qué municipios y tipos de inmueble debe cubrir de manera completa esa primera versión?

El checklist actual nombra CESPT y hay ayudas de uso de suelo referidas a Tijuana. Necesito delimitar cuándo corresponde adaptar fuentes, documentos y vocabulario a otro municipio o inmueble.

**Respuesta:**

### P06. ¿Qué información debe tener al panel como registro principal y qué información seguirá teniendo su original de referencia fuera de él?

Por ejemplo: contactos, agenda, documentos firmados, plantillas maestras y controles financieros. Identifica los sistemas o carpetas que realmente uses; esto no presupone conectarlos o sincronizarlos.

**Respuesta:**

## Bloque 2. Personas, clientes y relaciones

El contrato actual clasifica al cliente con un tipo principal; REL-01 prevé varios papeles y varias personas por inmueble. Fuentes: [contratos](src/lib/backend/contracts.ts), [Contactos](src/components/admin/contacts/contacts.tsx) y REL-01/CRM-01 del [plan](PLAN_ERP_CRM.md).

### P07. Conversión de prospecto a cliente ya definida

**Estado: resuelta por RP-90 a RP-92.** El propietario es cliente al firmar intermediación y el inmueble queda captado; el comprador al firmar promesa o compraventa; el arrendatario al firmar arrendamiento. La condición se calcula por operación. El caso del inversionista y los detalles de firma siguen en DEC-28 y en el grupo A del cuestionario vigente.

El código todavía convierte al completar la entrevista o mediante el botón de conversión. Esa discrepancia corresponde a COR-10; no cambia la regla de negocio ni se corrige con esta entrega documental.

**Referencia:** [Plan único](PLAN_ERP_CRM.md), RP-90 a RP-92 y COR-10; [preguntas del titular](docs/erp-crm/PREGUNTAS_TITULAR.md), grupo A.

### P08. Para registrar a una persona una sola vez, ¿qué datos mínimos necesitas y cómo resuelves dos personas con el mismo nombre o teléfono compartido?

La coincidencia seguirá siendo un aviso; no implica una fusión automática.

**Respuesta:**

### P09. ¿Qué papeles necesitas registrar entre personas e inmuebles, además de propietario y representante?

Por ejemplo: copropietario, usufructuario, cónyuge participante, representante de empresa o contacto para visitas. Busco el vocabulario que usas; registrar un papel no certifica derechos ni facultades.

**Respuesta:**

### P10. Cuando hay varios propietarios o representantes, ¿cómo debe quedar documentado quién participa y qué decisiones puede comunicar o autorizar cada uno?

Piensa en fijar precio, permitir fotografías, aceptar una oferta y firmar. No asumiremos que un contacto representa a todos.

**Referencia relacionada:** A-07 y A-08 de [PREGUNTAS_TITULAR.md](docs/erp-crm/PREGUNTAS_TITULAR.md).

**Respuesta (detalle complementario):**

### P11. Si un cliente vende, compra o invierte al mismo tiempo, ¿cómo quieres consultar y separar sus encargos?

La persona se conserva única (RP-27) y puede ser cliente en una operación y prospecto en otra (RP-92). Necesito concretar los datos comunes y los propios de cada encargo en la ficha de RP-75, incluido el asesor responsable.

**Respuesta:**

### P12. ¿Qué debe conservarse del seguimiento de un contacto que todavía no tiene operación, dejó de responder o no contrató el servicio?

Indica qué resultado cierra ese seguimiento y en qué casos debe volver a aparecer como pendiente.

**Respuesta:**

## Bloque 3. Qué es una operación y cómo transcurre

Fuentes: [etapas y requisitos](src/lib/formatos/operation-workflow.ts), [presentación de operaciones](src/lib/admin/operation-view.ts), [Ajustes](src/components/admin/operation/settings-tab.tsx) y OPS-01/CIE-01 del [plan](PLAN_ERP_CRM.md).

### P13. ¿Qué debe representar exactamente una operación cuando el cliente tiene varios inmuebles o todavía está comparando opciones?

Por ejemplo: un encargo por inmueble en venta y una búsqueda de compra con varias opciones. Necesito identificar cuándo se abre otra operación y cuándo se mantiene la misma.

**Respuesta:**

### P14. ¿En qué casos se debe usar «Alta directa, sin entrevista» y qué antecedentes deben registrarse para retomar el trabajo?

La vía existe. Falta precisar su uso en operaciones históricas, encargos ya avanzados o trabajo recibido de otro asesor.

**Respuesta:**

### P15. Dentro de las diez etapas del vendedor, ¿qué trabajos pueden hacerse al mismo tiempo y cuáles deben esperar una revisión o autorización previa?

El trabajo en paralelo y los ciclos ya están aprobados por RP-87. Esta pregunta concreta sus condiciones por ruta en MRP-01, a partir de B-04 y B-05 del cuestionario vigente; no vuelve a elegir si entrevista y levantamiento pueden coincidir ni si una oferta rechazada conserva su historia.

**Respuesta:**

### P16. ¿Qué situaciones corresponden a «En pausa», «En regularización» y «Descartada» en tu operación diaria?

Para cada una, indica qué seguimiento debe mantenerse y qué hecho permite reactivarla o darla por terminada.

**Respuesta:**

### P17. ¿Qué recorrido propio necesita el arrendador, desde que ofrece el inmueble hasta la entrega y el fin del encargo?

La lógica distingue requisitos de renta, pero la presentación del arrendador reutiliza las diez etapas del vendedor. Necesito definir su secuencia de negocio para corregir esa correspondencia sin trasladarle documentos de venta por semejanza.

**Continuar en:** B-01 de [PREGUNTAS_TITULAR.md](docs/erp-crm/PREGUNTAS_TITULAR.md).

### P18. Si una negociación se cae o se rechaza una oferta, ¿qué debe reabrirse y qué trabajo anterior sigue siendo válido?

Considera regresar a promoción, cambiar de comprador o retomar condiciones. Las propuestas anteriores deben conservar su historia.

**Referencia relacionada:** B-05 de [PREGUNTAS_TITULAR.md](docs/erp-crm/PREGUNTAS_TITULAR.md).

**Respuesta (detalle complementario):**

### P19. ¿Qué condiciones separan una operación firmada, entregada, con postventa pendiente y finalmente archivada?

La etapa visible «Cierre y entrega» reúne varios estados internos. Necesito los pendientes y resultados que quieres reconocer en cada momento, incluido cómo tratar una operación terminada sin éxito.

**Referencia relacionada:** B-11 de [PREGUNTAS_TITULAR.md](docs/erp-crm/PREGUNTAS_TITULAR.md).

**Respuesta (detalle complementario):**

## Bloque 4. Arranque, entrevista, visita y checklist

El arranque del propietario exige PDF vigente del 02 y del 04 y checklist completo para salir de captación. El checklist usa pasos recibidos/no recibidos; actualmente incluye agua CESPT sin condición. Fuentes: [candados](src/lib/formatos/operation-gates.ts), [checklist](src/lib/formatos/checklist-documentos.ts) y [su creación en la operación](src/components/admin/operation/use-documents.tsx).

### P20. Datos mínimos del primer contacto ya definidos

**Estado: resuelta por RP-82.** Crear una operación pide nombre, un medio de contacto, qué quiere y tipo de inmueble. Los demás datos se completan conforme al proceso; una ausencia no se convierte por defecto en un bloqueo.

**Referencia:** [Plan único](PLAN_ERP_CRM.md), RP-82 y RP-89.

### P21. PDF incompleto y avance ya definidos

**Estado: resuelta por RP-82 y RP-85.** Un PDF emitido con datos pendientes cuenta como emitido para los candados de arranque. Emitir no lo convierte en revisado: el revisor determina si su respaldo permite satisfacer el requisito. Los datos pendientes se muestran aparte de los requisitos que detienen el avance.

No se añade una obligación general de llenar todos los campos para avanzar. Un dato indispensable necesita la configuración y la versión de proceso previstas en RP-82 y MOT-03; las restricciones jurídicas y de congruencia expresas de RP-77 se conservan.

**Referencia:** [Plan único](PLAN_ERP_CRM.md), RP-77, RP-82 y RP-85.

### P22. ¿Quién debe revisar la lista inicial de documentos y determinar cuáles aplican al inmueble concreto?

Necesito saber en qué momento se hace y qué autoridad tiene el asesor para ajustar la lista antes de pedirla al propietario.

**Respuesta:**

### P23. ¿Cómo debe resolverse un documento del checklist que no aplica, no existe o será sustituido por otra evidencia?

COR-06 define como comportamiento por implementar «No aplica» con motivo y la posibilidad de agregar documentos a una lista preliminar. Falta concretar los casos de sustitución y quién revisa su suficiencia; un documento inexistente no debe marcarse recibido. Continúa también en D-08 del cuestionario vigente.

**Respuesta:**

### P24. ¿Qué documentos deben haberse recibido para comenzar la revisión jurídica y cuáles pueden quedar pendientes con una condición de trabajo?

No busco reducir requisitos por defecto. Necesito distinguir la recepción completa de la lista, el inicio de la revisión y la autorización para actos posteriores.

**Respuesta:**

### P25. Cuando llegan documentos nuevos o cambian los datos de la entrevista o de la visita, ¿cómo debe actualizarse el checklist y notificarse el trabajo que necesita revisión?

Por ejemplo, descubrir otro propietario, un arrendatario o un crédito. Debe conservarse lo ya recibido y la razón de los nuevos pedidos.

**Respuesta:**

## Bloque 5. Revisiones, evidencia y decisiones del encargo

Hoy «Revisado» exige soporte y evidencia; algunos requisitos tienen vigencia y solo algunos admiten «No aplica». Fuentes: [reglas de revisión](src/lib/formatos/operation-workflow.ts), [captura de requisitos](src/components/admin/operation/requirements.tsx) y LEG-01/SEG-01 del [plan](PLAN_ERP_CRM.md).

### P26. ¿Quién puede preparar información y quién puede dar por revisados los requisitos jurídicos, técnicos, de valor y de capacidad de pago?

Una misma persona puede realizar varias funciones si así lo decides. Necesito la responsabilidad efectiva por materia, no solo el nombre del cargo.

**Respuesta:**

### P27. ¿En qué revisiones debe intervenir una segunda persona y qué debe poder aprobar, observar o devolver para corrección?

Esto define el proceso de revisión profesional, además de los permisos para abrir una pantalla.

**Respuesta:**

### P28. ¿Cuándo basta identificar un documento fuera del sistema y cuándo necesitas conservar una copia dentro de la operación?

Considera originales físicos, documentos de notaría y evidencia de otra inmobiliaria. Indica qué necesita encontrar un sustituto del asesor para continuar el trabajo.

**Respuesta:**

### P29. ¿Cómo debe decidirse la vigencia de una revisión y qué cambios deben obligar a revisarla otra vez?

Ejemplos: fecha del certificado, cambio de propietario, nuevo gravamen, precio o condiciones modificados. Los plazos que impliquen una regla jurídica se verificarán antes de programarlos.

**Respuesta:**

### P30. Al aceptar un encargo con condiciones, ¿qué actividades puede permitir Fortius y cuáles deben permanecer bloqueadas?

Necesito ejemplos de condiciones reales y quién puede declarar que quedaron atendidas. Una advertencia visible y una autorización para continuar tienen efectos distintos.

**Respuesta:**

### P31. ¿Qué resultado quieres ver cuando se registra un problema y cuando se declara resuelto?

Por ejemplo: responsable de resolver, fecha objetivo, evidencia de solución y quién vuelve a revisar. Hoy «Ya se resolvió» regresa el requisito a «Lo tengo» para una nueva revisión.

**Respuesta:**

## Bloque 6. Plantillas y documentos entregables

Se conservan las plantillas y la separación entre documentos recibidos, borradores, emisiones y copias firmadas. DOC-06, DOC-07 y DOC-09 tienen pendientes expresos. Fuentes: [estado de formatos](docs/formatos-admin-status.md), apartados FLUJO/DOC del [plan](PLAN_ERP_CRM.md) y [captura documental](src/components/admin/operation/formato-capture.tsx).

### P32. Estados documentales ya definidos

**Estado: resuelta por RP-85.** El documento distingue Borrador → Revisado → Aprobado, o Firmado cuando lleva firma. PDF, Word y Excel son salidas; descargarlas no cambia ese estado. Los controles se muestran en el panel y las plantillas destinadas al cliente permanecen limpias.

**Referencia:** [Plan único](PLAN_ERP_CRM.md), RP-77 y RP-85.

### P33. Cuando un documento ya entregado cambia, ¿qué debe hacerse para sustituirlo y dejar constancia de la nueva entrega?

RP-76 ya conserva el documento emitido y exige ofrecer una versión nueva cuando cambia la ficha. Aquí falta concretar quién autoriza y comunica su sustitución y cómo se reconoce la versión que conserva el cliente, incluidos cambios hechos en una copia Word o Excel fuera del panel.

**Respuesta:**

### P34. ¿Qué debe diferenciar, en contenido y uso, la revisión jurídica 05 de la opinión jurídica 06?

Necesito precisar qué se analiza internamente, qué conclusión recibe el cliente y en qué momento. El 06 aún no captura como campos propios todos los antecedentes, condiciones, marco jurídico y documentos revisados de su plantilla.

**Respuesta:**

### P35. ¿Qué archivo y ubicación deben ser la referencia vigente de cada plantilla cuando el original y la versión del panel difieren?

El plan ubica originales en `G:\Mi unidad\FORTIUS\04_Metodologia` y documenta que 02 y 04 conservan allí versiones largas. No he verificado esa carpeta en esta revisión. Necesito definir quién mantiene y aprueba la correspondencia, sin revertir las simplificaciones ya decididas.

**Referencia relacionada:** D-02 de [PREGUNTAS_TITULAR.md](docs/erp-crm/PREGUNTAS_TITULAR.md).

**Respuesta (detalle complementario):**

### P36. Para el 07, ¿qué comprueba y quién autoriza que una opinión de valor esté lista para entregarse con un valor concluido?

La descarga incompleta ya está permitida. Aquí falta distinguir un cálculo que arroja una cifra de una conclusión revisada con comparables, fuentes y límites adecuados al encargo.

**Respuesta:**

### P37. Respecto del contrato 09, ¿quién será responsable del cotejo del modelo, qué evidencia deberá conservarse y cómo deberá restringirse el uso de su copia Word mientras tanto?

El PDF seguirá bloqueado hasta cumplir la condición aplicable. Permitir Word no acredita que el texto esté listo para contratar o firmarse.

**Referencia relacionada:** D-01 de [PREGUNTAS_TITULAR.md](docs/erp-crm/PREGUNTAS_TITULAR.md).

**Respuesta (detalle complementario):**

## Bloque 7. Inmuebles, datos y publicación

Fuentes: [inventario](src/components/admin/properties/property-list.tsx), [validación y proyección pública](src/lib/backend/validation.ts), [control de publicación](src/lib/formatos/operation-workflow.ts) y PUB-01/TEC-01 del [plan](PLAN_ERP_CRM.md).

### P38. Cuando entrevista, escritura, levantamiento, opinión de valor y ficha del inmueble contienen datos distintos, ¿qué proceso quieres para resolver la discrepancia y actualizar la ficha?

Necesito saber quién propone, quién confirma y qué fuente debe quedar asociada al dato. No se resolverá una contradicción eligiendo silenciosamente el registro más reciente.

**Respuesta:**

### P39. ¿En qué momento debe crearse la ficha de inventario y cómo se relaciona con una captación que todavía está en evaluación?

La operación puede existir sin inmueble vinculado y el inventario admite evaluación privada. Falta concretar el recorrido que quieres para evitar capturas repetidas.

**Respuesta:**

### P40. ¿Quién puede autorizar y ejecutar una publicación, un cambio de precio y el retiro del inmueble de cada canal?

Identifica qué decisión corresponde al propietario y cuál al equipo, y cómo debe registrarse su evidencia.

**Respuesta:**

### P41. ¿Cómo deben relacionarse los estados «Disponible», «Apartada», «Vendida» y «Rentada» con lo que sigue visible en el sitio público?

Por ejemplo, una oferta aceptada con condiciones pendientes o una operación firmada que aún no se entrega. No asumiré que una etiqueta comercial obliga a publicar o retirar.

**Respuesta:**

### P42. ¿Qué datos de ubicación, ocupación, fotografías y contacto deben mostrarse por canal y cuáles necesitan autorización específica?

Define el criterio de negocio para dirección exacta, referencias de acceso y fotografías de interiores. La configuración conservará las restricciones y la revisión de privacidad aplicables.

**Respuesta:**

## Bloque 8. Comercialización, visitas, ofertas y propietario

Hoy existen agenda, formatos, herramientas de ofertas/informes y Control comercial. VIS-01, OFE-01 y COM-01 describen la evolución de sus relaciones. Fuentes: [agenda](src/components/admin/agenda/calendar.tsx), [operación](src/components/admin/operation/next-step.tsx) y esos apartados del [plan](PLAN_ERP_CRM.md).

### P43. ¿Qué resultado debe registrarse después de una visita para considerarla realizada y útil para el seguimiento?

Piensa en asistencia, interés, objeciones, retroalimentación y siguiente acción. Actualmente un evento agendado no acredita que la visita ocurrió.

**Respuesta:**

### P44. ¿Cómo debe relacionarse una visita cuando participan el vendedor, un comprador con su propia operación y otra inmobiliaria?

Necesito saber quién la coordina, qué registro comparten y qué información conserva cada parte dentro de su alcance autorizado.

**Referencia relacionada:** B-08 y B-09 de [PREGUNTAS_TITULAR.md](docs/erp-crm/PREGUNTAS_TITULAR.md).

**Respuesta (detalle complementario):**

### P45. ¿Qué distingue una consulta informal, una oferta presentada, una contraoferta y una oferta aceptada?

Para cada hito, indica el respaldo que debe existir y qué condiciones o plazos deben quedar pendientes. Un ejercicio del comparador no debe convertirse por sí solo en oferta recibida.

**Respuesta:**

### P46. Cuando hay varias ofertas simultáneas, ¿cómo quieres registrar la decisión del propietario y dar seguimiento a las demás?

Considera rechazo, vencimiento, retirada y oferta de reserva. No se elegirá automáticamente la de mayor precio.

**Respuesta:**

### P47. ¿Qué vínculo y propósito debe tener Control comercial respecto de las operaciones?

Hoy dispone de su propia cartera y revisiones. Necesito definir qué se captura allí de forma independiente, qué debe tomarse de la operación y quién resuelve una diferencia entre ambas fuentes.

**Referencia relacionada:** E-06 de [PREGUNTAS_TITULAR.md](docs/erp-crm/PREGUNTAS_TITULAR.md).

**Respuesta (detalle complementario):**

### P48. ¿Desde qué fecha se calcula el primer vencimiento del informe y qué constancia acredita su entrega?

RP-88 y COR-08 definen que deberán separarse «último preparado» y fecha, canal y responsable de entrega manual; el aviso deberá usar la entrega cuando exista. La implementación sigue pendiente. La frecuencia mensual y su carácter no bloqueante se conservan. Aquí se concreta el primer corte y la constancia de entrega; B-12 del cuestionario vigente solo pide el medio.

**Respuesta:**

## Bloque 9. Hoy, tareas y agenda

Hoy, la lista de operaciones y el contador del menú usan conjuntos y prioridades diferentes. La agenda guarda fecha y hora, pero no una duración explícita. Fuentes: [Hoy](src/lib/admin/today.ts), [atención de operaciones](src/lib/admin/operation-view.ts), [contador](src/components/admin/workspace/guided-nav.tsx), [tareas](src/lib/tasks.ts) y [eventos](src/lib/backend/validation.ts).

### P49. Contador de Hoy ya definido

**Estado: resuelta por RP-84 y RP-20.** El contador es la cantidad de tarjetas de la lista común «Esperan algo de ti», más lo no leído de «Para ti». Hoy y Operaciones reutilizarán la misma función; COR-05 implementará la correspondencia que hoy falta.

**Referencia:** [Plan único](PLAN_ERP_CRM.md), RP-20, RP-84 y COR-05.

### P50. Prioridad de atención ya definida

**Estado: resuelta por RP-84.** El orden es: problema; tarea vencida; documento faltante de etapa anterior; documento por revisar; vence hoy; oferta nueva de los últimos tres días; sin próxima tarea con fecha. Este complemento no propone reemplazarlo.

**Referencia:** [Plan único](PLAN_ERP_CRM.md), RP-84.

### P51. ¿Cómo debe distinguir Hoy el trabajo que te corresponde ejecutar del que únicamente necesitas supervisar como administrador?

Hoy usa los datos accesibles sin un filtro «Mías» propio. La respuesta define la vista personal y la del equipo; no concede permisos nuevos.

**Referencia relacionada:** E-03 de [PREGUNTAS_TITULAR.md](docs/erp-crm/PREGUNTAS_TITULAR.md).

**Respuesta (detalle complementario):**

### P52. ¿Qué compromisos deben generar una tarea automáticamente y cuáles deben quedar solo como cita, seguimiento o requisito?

El objetivo es conservar una próxima acción clara sin duplicar la misma obligación en varias listas. Indica también qué debería pasar si cambia la fecha de su origen.

**Respuesta:**

### P53. ¿Qué información necesitas para coordinar correctamente una cita además del día y la hora de inicio?

Por ejemplo: duración, participantes, ubicación, confirmación, traslado o motivo de cancelación. Actualmente el calendario representa los eventos con hora usando bloques de una hora.

**Respuesta:**

### P54. ¿Qué reglas de trabajo deben seguir los recordatorios y las tareas en espera de otra persona?

Define anticipación, horario, fines de semana y cuándo escalar un retraso. Los avisos externos siguen siendo una fase posterior; aquí se concreta el comportamiento que tendría que cumplir.

**Respuesta:**

## Bloque 10. Equipo, acceso y responsabilidades

El código usa roles `admin` y `editor` —Administrador y Asesor en pantalla—. RP-05 ya prevé funciones de director, coordinador, asesor, asistente, jurídico, contabilidad y aliado externo, con permisos por acción. Las preguntas concretan esa matriz; no vuelven a elegir si se amplía el modelo. Equipo administra perfiles y vínculos de cuentas existentes; la gestión completa sigue en USR-01/SEG-01. Fuentes: [Equipo](src/app/admin/asesores/page.tsx), [autenticación](src/lib/backend/auth.ts) y [propuesta de acceso](docs/erp-crm/access-policy.md).

### P55. ¿Qué información debe poder consultar y modificar un asesor sobre sus operaciones y sobre el inventario del equipo?

Conviene separar ficha comercial, datos del propietario, documentos privados, notas internas, ofertas y cifras de honorarios. Necesito el alcance deseado por clase de información.

**Referencia relacionada:** F-02, F-03 y F-04 de [PREGUNTAS_TITULAR.md](docs/erp-crm/PREGUNTAS_TITULAR.md).

**Respuesta (detalle complementario):**

### P56. ¿Cómo debe colaborar una segunda persona en una operación sin convertirse en su responsable principal?

Ejemplos: suplencia, apoyo documental, revisión jurídica o colaboración comercial. Indica si el acceso abarca todo el encargo o solo la tarea y los documentos necesarios.

**Respuesta:**

### P57. Cuando una operación cambia de asesor, ¿qué trabajo, acceso y responsabilidad deben transferirse y desde cuándo?

Incluye pendientes y seguimiento al cliente. La autoría y las revisiones históricas deben conservarse.

**Respuesta:**

### P58. Dentro de los papeles de RP-05, ¿quién ejercerá cada permiso de administrar y con qué alcance?

Concreta invitaciones, reasignaciones, bajas de acceso, restauraciones y configuración. RP-05 ya distingue la función de administrar del nombre del rol técnico; las responsabilidades de revisión profesional se concretan en P26 y P27.

**Respuesta:**

### P59. ¿Qué procedimiento necesita Fortius cuando alguien ingresa al equipo, pierde acceso o deja de colaborar?

Define quién recibe la solicitud y verifica la identidad, cómo se entrega la cartera y quién puede atender una recuperación de emergencia. No incluyas contraseñas, códigos ni secretos.

**Respuesta:**

## Bloque 11. Finanzas e indicadores de dirección

Las herramientas calculan escenarios; no equivalen a movimientos de dinero. FIN-01/02 y los cuatro tableros forman parte del alcance del [plan](PLAN_ERP_CRM.md); sus reglas de negocio necesitan precisarse antes de implementarse.

### P60. ¿Qué necesitas registrar primero como hecho financiero: cobros de Fortius, gastos de la empresa, gastos de una operación o seguimiento de pagos entre las partes?

Ordénalos y aclara si solo registrarás evidencia de pagos ajenos. El sistema no presupone que Fortius reciba o custodie dinero del cliente.

**Respuesta:**

### P61. ¿Qué hechos contractuales distinguen honorarios estimados, pactados, exigibles y efectivamente cobrados en tus servicios?

Necesito conocer los acuerdos que utilizas, incluidos anticipos, pagos parciales y cancelaciones. No se fijarán reglas de cobro ni tasas por defecto.

**Respuesta:**

### P62. ¿Cómo acuerdas y apruebas el reparto de honorarios entre Fortius, asesores y colaboradores externos?

Aclara qué base utilizan y qué pasa si cambia el acuerdo o se devuelve un cobro. La configuración debe conservar el acuerdo de cada operación.

**Referencia relacionada:** G-02 de [PREGUNTAS_TITULAR.md](docs/erp-crm/PREGUNTAS_TITULAR.md).

**Respuesta (detalle complementario):**

### P63. ¿Quién autoriza un gasto o descuento, quién acredita su pago y cómo debe corregirse o anularse después?

Necesito el recorrido de responsabilidad y evidencia, especialmente para gastos pagados directamente por propietarios o terceros.

**Respuesta:**

### P64. ¿Cómo debe decidirse y conservarse el tipo de cambio cuando se presupuesta, pacta, paga o reporta en MXN y USD?

Esos momentos pueden usar bases distintas. Identifica quién las determina; no se sumarán monedas diferentes sin una conversión explícita y trazable.

**Referencia relacionada:** G-04 de [PREGUNTAS_TITULAR.md](docs/erp-crm/PREGUNTAS_TITULAR.md).

**Respuesta (detalle complementario):**

### P65. Para cada tablero —comercial, financiero, jurídico y técnico—, ¿qué decisión quieres poder tomar y qué tres indicadores necesitas primero?

Parte de los indicadores y metas ya previstos en RP-33 y de la trazabilidad de RP-34. Concreta su definición y la fuente que abrirá cada cifra, especialmente en los tableros jurídico y técnico; esta pregunta no elimina indicadores aprobados ni modifica el orden de los módulos.

**Respuesta:**

## Bloque 12. Herramientas, notas, búsqueda y sitio web

El [catálogo](src/lib/apps/catalog.ts) contiene herramientas financieras, comerciales, documentales y de productividad. [Documentos sin expediente](src/components/admin/apps/documentos-sin-expediente.tsx) guarda su captura como trabajo de herramienta y no archiva el PDF como emisión de una operación.

### P66. Trabajo sin operación y traslado posterior ya definidos

**Estado: resuelta por RP-83.** Herramientas permite preparar documentos o cálculos sin abrir operación ni prospecto. Si el cliente contrata, el trabajo pasa a la operación sin volver a capturarlo. HER-04 implementará ese traslado con sus dependencias; no es una función que esta entrega documental dé por construida.

**Referencia:** [Plan único](PLAN_ERP_CRM.md), RP-83, HER-01 a HER-04.

### P67. ¿Qué resultados de herramientas necesitas incorporar a una operación como referencia y cuáles deben permanecer como ejercicios privados?

Por ejemplo: comparables, neto, oferta, rehabilitación o inversión. Indica qué revisión debe mediar antes de reutilizar un resultado.

**Respuesta:**

### P68. ¿Qué necesitas guardar en Notas y recuperar mediante la búsqueda que no deba ser una tarea, un documento o una entrada del historial?

Un ejemplo de información y otro de búsqueda ayudarán a definir su utilidad, su contexto y quién debe verla.

**Referencia relacionada:** E-01 de [PREGUNTAS_TITULAR.md](docs/erp-crm/PREGUNTAS_TITULAR.md).

**Respuesta (detalle complementario):**

### P69. Manteniendo Sitio web reservado al administrador, ¿necesitas separar preparación y aprobación de textos, artículos o archivos antes de publicarlos?

Si tú haces ambas cosas, basta indicarlo. No implica reabrir el acceso de los asesores a Administración ni rediseñar el sitio público.

**Referencia relacionada:** E-05 de [PREGUNTAS_TITULAR.md](docs/erp-crm/PREGUNTAS_TITULAR.md).

**Respuesta (detalle complementario):**

## Bloque 13. Continuidad, privacidad y uso cotidiano

El plan ya fija como objetivos copia diaria, pérdida máxima de 24 horas y recuperación en 8 horas; falta demostrar la recuperación integral y concretar su operación. [REC-01/PRV-01 del plan](PLAN_ERP_CRM.md), [política de recuperación](docs/erp-crm/recovery-policy.md) y [registro de tratamiento](docs/erp-crm/privacy/data-processing-register.md) conservan pendientes.

### P70. ¿Quién debe custodiar los respaldos y dirigir una recuperación cuando tú no estés disponible?

Necesito la función responsable y el mecanismo de sustitución; no ubicaciones secretas ni credenciales. Los objetivos de recuperación ya aprobados se conservan.

**Respuesta:**

### P71. ¿Quién atenderá las solicitudes sobre datos personales y validará, con revisión jurídica, la política de conservación por tipo de registro?

Incluye quién decide sobre una solicitud de acceso, corrección o eliminación. No se fijará un plazo universal de borrado ni se confundirá «Eliminar operación» con suprimir sus archivos e historial.

**Respuesta:**

### P72. ¿Qué información actual debe incorporarse al panel y de qué fuentes concretas vendrá?

Indica clases de registros, formato y volumen aproximado, sin adjuntar aquí datos personales. La importación requerirá primero inventario, revisión de correspondencias y simulación sin escrituras.

**Referencia relacionada:** I-05 de [PREGUNTAS_TITULAR.md](docs/erp-crm/PREGUNTAS_TITULAR.md).

**Respuesta (detalle complementario):**

### P73. ¿Qué trabajos necesitas hacer desde celular o tableta en campo y qué debe suceder si se interrumpe la conexión?

La base prevista es uso conectado; no se presume almacenamiento local de documentos privados. Describe la tarea y la pérdida de trabajo que necesitas evitar.

**Referencia relacionada:** E-04 de [PREGUNTAS_TITULAR.md](docs/erp-crm/PREGUNTAS_TITULAR.md).

**Respuesta (detalle complementario):**

### P74. ¿En qué dispositivos y situaciones reales debe probar el equipo la primera versión antes de aceptarla para uso diario?

Por ejemplo: visita con celular, revisión documental en escritorio y suplencia entre asesores. Los resultados de pruebas técnicas no sustituyen esa aceptación de uso.

**Referencia relacionada:** J-01 de [PREGUNTAS_TITULAR.md](docs/erp-crm/PREGUNTAS_TITULAR.md).

**Respuesta (detalle complementario):**

## Bloque 14. Capacidades posteriores del producto ampliado

Estas preguntas no detienen la definición del recorrido principal. Se resolverán antes de diseñar su módulo. El plan conserva inversión, mapas, portal e IA como alcance solicitado; la limpieza retiró las integraciones externas apagadas y algunas pantallas. Su reintroducción requiere trabajo propio, no solo activar un botón.

### P75. Orden del producto ampliado ya definido

**Estado: resuelta por «Orden vigente» del plan.** Inversión, mapas, portal e IA conservan su alcance solicitado y sus entregas en los bloques correspondientes. Las integraciones y ampliaciones condicionadas entran cuando lo establece el plan. Cambiar ese orden requiere una decisión expresa; no se deduce de una respuesta sobre el panel actual.

**Referencia:** [Plan único](PLAN_ERP_CRM.md), «Orden vigente» y las dependencias de cada extensión.

### P76. ¿Qué tipo de inversión necesitas evaluar primero y qué decisión debe sustentar el análisis?

Por ejemplo: comprar para rentar, rehabilitar y vender o comparar alternativas. Necesito identificar horizonte, aportantes, deuda y resultados que se compararán; el método financiero se verificará al especificarlo.

**Respuesta:**

### P77. ¿Qué consulta o recorrido necesitas resolver con mapas que hoy no puedas resolver bien con una lista?

Indica las fuentes que ya tienes para ubicaciones y comparables, su cobertura y el nivel de precisión necesario. Los precios de oferta y los cierres comprobados seguirán diferenciados.

**Respuesta:**

### P78. ¿Qué debería poder ver o solicitar primero un cliente externo en su portal?

Considera avance compartido, citas, documentos seleccionados o carga de información. Aclara cómo se autoriza a un representante o copropietario; no recibirá acceso automático a todo el expediente.

**Respuesta:**

### P79. ¿Qué dos o tres consultas o revisiones documentales quieres resolver con IA y qué materiales estarían autorizados para ello?

Ejemplos: localizar un antecedente, comparar una cláusula o encontrar contradicciones entre documentos. La respuesta debe seguir remitiendo a sus fuentes y quedar sujeta a revisión humana.

**Respuesta:**

### P80. ¿Qué captura repetida justificaría primero una integración externa y cuál sería el sistema que manda sobre ese dato?

Por ejemplo: calendario, portales o mensajería. Diferenciemos un enlace para abrir WhatsApp de enviar y recibir mensajes automáticamente.

**Respuesta:**

### P81. ¿Quién debe autorizar la contratación de servicios externos y cualquier ampliación de su presupuesto?

El plan ya fija como base 2,000 MXN mensuales para servicios nuevos, aviso al 80% y bloqueo cuando no haya saldo suficiente. Esas decisiones se conservan. Falta precisar quién autoriza contratar y cómo se aprueba una ampliación si un módulo la necesita; las tarifas y condiciones se comprobarán al diseñarlo.

**Respuesta:**

## Bloque 15. Casos para convertir respuestas en especificaciones

Estos ejemplos permiten comprobar que las reglas del plan y sus detalles pendientes producen el resultado que buscas. Usa casos inventados o descritos sin datos personales.

### P82. ¿Cómo debería transcurrir una venta sencilla, desde el primer contacto hasta el archivo, si todo sale bien?

Describe quién actúa, qué documento o evidencia produce y qué debe ver el asesor al terminar cada trabajo. No hace falta enumerar clics.

**Respuesta:**

### P83. ¿Qué caso complicado quieres que usemos para probar que el sistema ayuda sin permitir una decisión injustificada?

Por ejemplo: documentos incompletos, representación pendiente, varios propietarios, oferta condicionada o discrepancia de superficies. Señala qué trabajo sí debería poder continuar y qué acto debería detenerse.

**Respuesta:**

### P84. Al revisar cada entrega, ¿qué resultado observable te bastará para aprobarla y qué defecto te haría rechazarla?

Puede ser completar una tarea sin ayuda, encontrar su evidencia o retomar el trabajo sin perder captura. Esto se sumará a las pruebas técnicas y permitirá registrar tu aceptación sin inferirla.

**Respuesta:**

## Contraste con el plan vigente y el código pendiente

Las observaciones iniciales ya están incorporadas en el plan como reglas o correcciones. Su presencia allí no acredita que el código las implemente. No necesitas reconstruir el historial de Git ni resolver estas diferencias técnicas.

| Observación inicial | Tratamiento en la versión vigente |
| --- | --- |
| Registros antiguos de rama y publicación junto a estados posteriores. | El plan distingue «Estado vigente» del cierre histórico del 17/10. La base de este complemento ya incluye los PR #41 y #42; una integración documental no acredita un despliegue nuevo. |
| Referencias a seis etapas y tablero por columnas frente a diez etapas y lista. | Se conserva el boceto C como base implementada y las decisiones posteriores de proceso; MRP-01 concreta cada ruta. |
| Matriz de entregas anterior a las reglas y paquetes recientes. | Se usa la matriz del plan actualizado y su «Orden vigente»; no se deduce avance por contar pantallas. |
| El catálogo contiene 17 herramientas y algunos textos todavía dicen 16. | Es una diferencia de texto comprobable, sin una nueva decisión de negocio. |
| Hoy, Operaciones y contador tienen criterios distintos; Hoy no carga el detalle documental inicial. | RP-84 fija la regla; COR-03 y COR-05 contienen las correcciones pendientes. P49 y P50 están resueltas. |
| El arrendador reutiliza la presentación y parte de los requisitos del vendedor. | COR-04 depende de MRP-01 y del grupo B del cuestionario vigente. |
| Etiquetas de firma, pago y privacidad añaden significado a la regla interna. | RP-86 fija sus nombres y COR-07 los llevará a las pantallas. |
| Checklist con CESPT incondicional y condiciones sobre datos no capturados. | COR-06 define lista preliminar, «No aplica» justificado y datos por confirmar; RP-89 precisa la entrevista necesaria y «Ampliar». |
| Emitir con faltantes y convertir a cliente tenían interpretaciones abiertas. | RP-82 y RP-85 resuelven emisión y revisión; RP-90 a RP-92 fijan la condición por firma. COR-10 conserva la discrepancia actual del código. |

## Cómo cerraremos cada bloque

1. Registrar tu respuesta con su identificador, sin completar silenciosamente lo que no hayas decidido.
2. Resolver contradicciones y, cuando lo pidas, comparar alternativas antes de acordar una regla.
3. Incorporar al plan único la decisión, el alcance y ejemplos de aceptación: **situación inicial → acción → resultado esperado**, incluido cuándo debe bloquearse.
4. Identificar qué requiere revisión profesional, preparación técnica o autorización externa. Una decisión de producto no acredita esas comprobaciones.
5. Implementar únicamente el alcance que quede autorizado y comprobar el resultado real. Este cuestionario, por sí solo, no inicia cambios en el panel.

**Primer bloque para responder: grupos A y B de [PREGUNTAS_TITULAR.md](docs/erp-crm/PREGUNTAS_TITULAR.md).** Este complemento mantiene la trazabilidad P01–P84 y se consulta al concretar cada entrega, sin duplicar respuestas ni reabrir reglas resueltas.
