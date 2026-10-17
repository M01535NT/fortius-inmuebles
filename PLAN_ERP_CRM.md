# Fortius — plan único de implementación del ERP/CRM

**Actualizado:** 17 de octubre de 2026, America/Los_Angeles. **Responsable de negocio:** Moisés Núñez Tonalá. **Desarrollo:** agente de desarrollo. **Carpeta:** `C:\Paginas-web\fortius-inmuebles`.

Este archivo reúne el alcance, el orden de trabajo, las tareas y el avance del ERP/CRM. Es el único plan vigente de desarrollo. Los manuales de `docs/` son referencias de operación, no planes alternativos.

**Cómo leer este plan:** primero «Dirección del producto y reglas vigentes» (qué se construye y con qué reglas); luego los paquetes listos para implementar, «Simplificación de la interfaz (SIM)» y «Navegación y productividad (NAV)»; después «Dónde nos quedamos» y «Qué sigue» (estado actual); el resto es alcance, backlog, tareas detalladas y el registro histórico de entregas. Si un registro histórico contradice una regla vigente, manda la regla vigente.

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
- **RP-05 · Roles del equipo de Fortius y permisos por acción.** Papeles previstos: director, coordinador, asesor, asistente, jurídico, contabilidad y aliado externo (otra inmobiliaria con la que Fortius comparte una operación y su comisión). Acciones con permiso propio: ver precio mínimo, ver comisiones, aprobar descuentos, eliminar y exportar. (SEG-01, DEC-03)
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

- **RP-27 · Persona:** una sola línea de tiempo con contactos, mensajes registrados, visitas, documentos, ofertas, cambios y notas, con filtros. Una persona con varios papeles no se duplica. (CRM-03, REL-01)
- **RP-28 · Inmueble:** salud de la ficha (qué tan completa está, días publicado, visitas, prospectos y ofertas), alertas con umbral ajustable en Configuración («60 días sin ofertas: revisa el precio con el propietario») enlazadas a Comparables, e historial de precio con quién, cuándo y por qué. (INV-01)

**F. El dinero a la vista**

- **RP-29 · Tarjeta de dinero en cada operación:** honorario esperado, reparto, cobrado y por cobrar. Cuatro estados que siempre usan la misma palabra, color e ícono: Estimado, Pactado, Facturado y Cobrado. Nunca se suman entre sí. (FIN-01, FIN-02)
- **RP-30 · Pronóstico de ingresos por mes:** honorario por la probabilidad de la etapa que defina Fortius, rotulado «Estimación» y separado de lo cobrado. (FIN-03, DEC-17)
- **RP-31 · Aprobaciones:** comisión bajo el mínimo, descuentos y excepciones a un requisito requieren aprobación del rol que corresponda, con motivo y constancia. El servidor no aplica la acción hasta que se aprueba. (APR-01)
- **RP-32 · Cuenta por asesor:** comisiones generadas, cobradas y pagadas, con estado de cuenta descargable. (FIN-02)

**G. Tableros que llevan a actuar**

- **RP-33 · Tableros por rol.** Director: embudo, tiempo promedio en cada etapa, carga por asesor, inventario envejecido, conversión por origen y metas. Asesor: sus metas, su embudo y sus pendientes. (TAB-02, TAB-05)
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
- **RP-43 · Todo monto lleva moneda;** una conversión guarda tipo de cambio, fuente y fecha. (DAT-02, FIN-01)

**J. Inteligencia artificial**

- **RP-44 · IA siempre con revisión humana:** resumen de la operación, lectura de INE o escritura para llenar campos (confirmados uno por uno), descripción del anuncio y sugerencia de siguiente paso. Cita su fuente, respeta permisos y nunca cambia estados, aprueba requisitos ni envía nada por sí sola. (EXT-11, EXT-06, DEC-14)

**K. Calidad del producto y soporte**

- **RP-45 · Meta realista de calidad.** No se promete «cero fallas». La meta es detectar los errores antes que el usuario y corregirlos rápido: monitoreo de errores en producción con alertas y sin datos personales. (OBS-01, DEC-19)
- **RP-47 · Pruebas de uso medidas** con los asesores de Fortius: tiempo para crear una operación, registrar una visita y marcar un requisito como revisado, contra metas fijadas antes de medir. Se repiten después de cada cambio grande de pantallas. (PIL-01)
- **RP-48 · Soporte dentro del panel:** ayuda por pantalla (se conserva «¿Qué significa?»), centro de ayuda, «Reportar un problema» con contexto técnico sin datos personales y recorrido inicial que se puede saltar. (SOP-01)

**M. Interfaz sencilla (aprobado el 17/10/2026)**

- **RP-50 · Una pantalla, una pregunta.** Cada pantalla responde una sola pregunta («¿qué hago hoy?», «¿qué sigue en esta operación?», «¿quién es esta persona?») y tiene una sola acción principal visible. (SIM)
- **RP-51 · Nada se dice dos veces.** Una tarea, un pendiente o una acción aparece una sola vez por pantalla, con un solo nombre de botón. (SIM-03, SIM-05)
- **RP-52 · Un color, un significado.** Guinda (`--primary`) solo para la acción principal y la sección activa; lo vencido o urgente en el rojo de alerta (`--destructive`) con ícono y palabra; los precios y las cifras en texto normal. (SIM-01)
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

### Etapa posterior: adaptación para otras inmobiliarias (en pausa)

No se trabaja en esto hasta que el titular lo decida. Se conserva aquí para no perder lo ya pensado. Las entregas correspondientes están en el backlog como «en pausa».

**Criterios propuestos para abrir esta etapa** (los confirma el titular): PIL-01 aceptado; varios meses de operación real de Fortius con el ERP; pruebas de uso medidas en meta; incidencias graves cerradas; recuperación (REC-01) probada; y DEC-15 decidida.

- **RP-02 · Datos separados por empresa.** Cada registro, archivo, folio, respaldo, caché e índice pertenecería a una empresa, con servidor y RLS haciéndolo cumplir. (SAAS-01)
- **RP-03 · Marca por empresa:** logo, colores, dominio y datos de documentos configurables, con Fortius como su propio tema. (SAAS-02)
- **RP-04 · Flujo configurable a partir de la plantilla de Fortius,** versionado por operación y con requisitos protegidos. (SAAS-03)
- **RP-07 · Alta guiada de una empresa nueva** con importación y revisión de duplicados. (SAAS-05)
- **RP-08 · Planes y límites;** sin pago, solo lectura con exportación, nunca borrar datos. (SAAS-06)
- **RP-46 · Piloto externo** con 2 o 3 inmobiliarias antes de vender. (PIL-02)
- **RP-49 · Propiedad intelectual.** El software no se presenta como patentado: la ley mexicana de propiedad industrial no considera invención a los programas de cómputo por sí mismos. Protección prevista: registro de obra ante INDAUTOR, marca ante IMPI, secreto industrial con convenios de confidencialidad y licencias de uso, confirmado con un abogado de propiedad intelectual (DEC-16). El registro de obra y de marca puede hacerse en cualquier momento sin abrir esta etapa.

**Costo de esperar:** al abrir esta etapa habrá que agregar la frontera por empresa a las tablas, permisos y respaldos existentes con una migración planeada y ensayada. Es un costo conocido y aceptado a cambio de no complicar ahora el sistema de Fortius.

### Orden vigente

1. **Terminar lo que está en curso:** los pendientes de formatos de «Qué sigue» (diseño y fotos del 07, DOC-06, DOC-09) y comprobar la publicación del rediseño.
2. **Simplificación de la interfaz** (SIM-01 a SIM-12, en ese orden) junto con **confianza y velocidad** (UX-04, UX-03, UX-02, UX-05) y la **navegación de pantalla** (NAV-01, NAV-02, NAV-03, NAV-05, NAV-07, NAV-13): no tocan el modelo de datos salvo las preferencias por usuario de UX-02, y pueden empezar ya. SIM-01 va primero porque fija color, letra y fechas para todo lo demás.
3. **Núcleo del equipo y disciplina comercial:** REL-01 y SEG-01 con los roles de Fortius, CRM-01, CRM-02, CRM-03, INV-01, DAT-02, VIS-01, OFE-01, EXT-01, y las listas inteligentes, planes de seguimiento y calificación (NAV-04, NAV-06, NAV-09).
4. **Dinero, aprobaciones, reglas fiscales y tableros:** FIN-01/02/03, APR-01, FIS-01, TAB-01 a TAB-05.
5. **Documentos avanzados, portal de clientes de Fortius e IA:** DOC-10 a DOC-13, la cola de revisión y el trabajo de campo (NAV-08, NAV-10), EXT-05, EXT-10, EXT-06 y EXT-11. Las entregas con migración o decisión pendiente (NAV-11, NAV-12) y NAV-14 (espera PWA-03) se programan cuando se autoricen.
6. **Piloto con el equipo de Fortius, soporte y pruebas de uso** (PIL-01, SOP-01), y operación real durante un buen tiempo.
7. **Etapa posterior** (en pausa): solo cuando el titular la abra.

### Reglas reemplazadas

| Fecha | Regla anterior (dónde estaba) | Regla vigente |
|---|---|---|
| 17/10/2026 | «Un sistema operativo dentro de `/admin`» («Qué vamos a construir»). | ERP/CRM profesional exclusivo de Fortius, con su marca (RP-01). |
| 17/10/2026 | «La estructura de la guía (`flujo`) no cambia» y «sin migraciones ni endpoints nuevos» (encargo del rediseño, §2). | Esas reglas valían para la Fase C, ya terminada. El flujo sigue siendo el de Fortius y se cambia con desarrollo; las migraciones siguen requiriendo respaldo, ensayo y autorización. El flujo configurable queda en la etapa posterior (RP-04). |
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
| 17/10/2026 | Primera versión de esta sección: producto comercializable a otras inmobiliarias desde ahora, con multiempresa, marca por empresa, flujo configurable, planes y piloto externo; DEC-15 bloqueando REL-01 y SEG-01. | Segunda indicación del titular el mismo día: exclusivo de Fortius y solo con su marca. Lo de otras inmobiliarias pasa a «Etapa posterior (en pausa)»; DEC-15 ya no bloquea nada; las reglas fiscales por lugar se quedan para Fortius (FIS-01). |

## Simplificación de la interfaz (SIM) — paquete listo para implementar, 17/10/2026

**Origen:** revisión crítica del titular y del agente sobre capturas reales del panel (15 pantallas, 1440 y 390 px, datos simulados, sin tocar la base). El titular aprobó **las 32 correcciones** el 17/10/2026 para hacerse en una sesión futura. **Estado: pendiente; no hay código escrito.**

**Cómo trabajarlo en la próxima sesión:**

1. Leer RP-50 a RP-57 y esta sección completa. Tomar una entrega SIM a la vez, en el orden de la tabla; cada una cabe en un commit o PR.
2. Antes de cambiar una pantalla, capturarla igual que en la revisión: servidor compilado con las variables de Supabase vacías y API simulada con `page.route`, como en `tests/admin/browser/secciones.spec.ts` y `process-corrections.spec.ts`. En este contenedor, Chromium se lanza con `executablePath: "/opt/pw-browsers/chromium"`. Nunca usar `.env.local` (apunta a la base real).
3. Después del cambio, volver a capturar a 390 y 1440 px, en claro y oscuro; comparar; correr lint, tipos, pruebas del panel y las de navegador afectadas; y actualizar las pruebas que buscan textos que cambian.
4. **Lo que no cambia:** reglas del servidor, permisos, validaciones (`workflowBlockers`, `reviewComplete`), datos y migraciones. SIM es de pantalla. Si una corrección necesita un dato nuevo, se pregunta al titular.
5. **Lo que se conserva** porque funciona: la estructura de Hoy, el asistente de 4 pasos de Nueva operación, la tabla de Contactos, el glosario sencillo y el estilo redondeado con fondo gris.
6. Registrar cada entrega en este plan (commit, pruebas, capturas revisadas, límites).

### Las 32 correcciones

**A. Todo el panel**

| # | Hoy (lo que se vio) | Corrección |
|---|---|---|
| C01 | El guinda significa botón principal, sección activa, precio, vencido, visita y enlace. | Guinda solo para la acción principal y la sección activa. Vencido en `--destructive` con ícono y palabra. Precios en texto oscuro normal. Visitas con un color propio que no sea alerta (definirlo en los tokens, claro y oscuro, con contraste AA). |
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
| C12 | El tablero tiene 10 columnas; con 3 operaciones se ven 7 vacías y hay desplazamiento lateral. Reportes usa otros nombres («Captación», «Documentación»). | Tablero de **6 etapas** del proceso del 15/10/2026, con los 10 pasos actuales dentro: Captación (Prospecto, Entrevista inicial, Levantamiento, Checklist de documentos) · Verificación y precio (Dictamen jurídico, Opinión de valor y precio) · Contrato y preparación · Publicación y seguimiento · Visitas y ofertas · Cierre y entrega. Cada tarjeta dice su paso. Columnas vacías plegadas. Los mismos nombres en Reportes y en todo el panel. `SALE_PROCESS` y sus candados no cambian: es una agrupación de presentación. |
| C13 | La barra de avance de 10 pasos se amontona en dos renglones. | Barra de 6 etapas; bajo la actual, «Paso 2 de 4 · Entrevista inicial». En celular, «Etapa 1 de 6 · Paso 2 de 4». |
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
| C24 | Pestañas Prospectos y Clientes: un usuario nuevo no sabe dónde buscar a una persona. | Una sola lista de personas con etiqueta de etapa (Nuevo, En seguimiento, Cliente, Descartado…) y filtro. **Solo de pantalla:** las tablas `leads` y `clientes` no cambian; la lista las une y cada fila abre su ficha. `?tab=` sigue funcionando como filtro. |

**F. Agenda, Inmuebles, Herramientas, Reportes y error**

| # | Hoy | Corrección |
|---|---|---|
| C25 | Formulario «Agendar» siempre abierto con seis listas «Ninguno (opcional)». (`agenda/calendar.tsx`, `agenda-view.ts`) | Panel que se abre con «+ Agendar», con el «+ Nuevo» (C08) o al tocar un hueco del calendario, con fecha y hora ya puestas. Un solo campo «¿Con quién o sobre qué?» que busca persona, inmueble u operación; asesor = el usuario por omisión. Se conservan los vínculos y la protección de captura. |
| C26 | Bote de basura visible en cada cita. | Eliminar dentro de la cita (o en «⋯»), con «Deshacer» (RP-16). |
| C27 | Aviso amarillo general sobre borradores en Inmuebles. (`properties/property-list.tsx`) | Cada inmueble dice qué le falta («Faltan fotos», «Sin publicar», «Sin precio»), base para INV-01. |
| C28 | Herramientas: buscador, favoritos y 6 filtros para 17 tarjetas; «Documentos sin expediente» contradice el glosario. (`apps/catalog.tsx`, `src/lib/apps/catalog.ts`) | Tres grupos visibles por para qué sirven (Calcular, Preparar documentos, Presentar al cliente), sin filtros; se conserva la búsqueda solo si el catálogo crece. «Documentos sin expediente» → «Documentos sueltos». Decidir el lugar de «Notas del equipo» (hoy un enlace escondido). |
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
| SIM-04 | C12, C13, C22 | Tablero y avance en 6 etapas; alta rápida dentro de Nueva operación | Sin desplazamiento lateral a 1440 con columnas vacías plegadas; cada tarjeta y la operación muestran etapa y paso; `?etapa=<slug>` sigue funcionando (los slugs de paso abren su etapa); mismas etapas en Reportes. |
| SIM-05 | C14–C17 | «Siguiente paso» único, lista unificada, estados compactos y explicación plegada | Una sola acción principal por etapa; ningún texto de acción repetido; un requisito muestra estado actual y una acción; «Marcar como revisado» pide la misma evidencia; el servidor rechaza lo mismo que antes. |
| SIM-06 | C18–C21 | Operación en celular, columna lateral y menú «⋯» | A 390 px lo fijo abajo ocupa como máximo la barra inferior más una línea; Llamar/WhatsApp en el encabezado; pestaña Ajustes retirada sin perder ninguna acción. |
| SIM-07 | C23 | Ficha de persona (prospecto y cliente) | Mismo marco que la operación; una acción principal; sin «lead» ni «Seguimiento conectado»; fechas humanas; conversión y eliminación con sus protecciones actuales. |
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
| N24 | **«Primeros pasos» para el asesor nuevo**: lista en Hoy (foto, WhatsApp, primera operación, primera cita) que desaparece al completarse. | Se une con el recorrido inicial de SOP-01. La lista de arranque del administrador («Preparar tu espacio») sigue en Configuración. |
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
| NAV-13 | N23, N24 | SIM-01, SOP-01 | Papelera única que restaura con las reglas de cada tipo; «Primeros pasos» del asesor que desaparece al completarse. |
| NAV-14 | N25 | PWA-03 | En espera hasta que existan avisos fuera del panel. |

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
- [x] **PROC-02 · Barra lateral y páginas de etapa.** Reemplazar los seis accesos de `module-catalog.ts` por las seis etapas del proceso, con sus nombres y su «para qué». Cada página `/admin/proceso/[etapa]` lista las operaciones de esa etapa, con las etapas 1 y 2 separadas y la 5 reuniendo cierre, entrega y postventa.
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

**Dónde nos quedamos — cierre de la sesión del 17/10/2026**

- **Rama y publicación:** `feat/panel-guiado` se fusionó en `main` con el [PR #39](https://github.com/M01535NT/fortius-inmuebles/pull/39) el 17/10/2026 (commit `58bdafd`). El despliegue a producción falta comprobarlo y registrarlo. El entorno local (puerto 3001) usa la base real de producción: revisar en el navegador solo leyendo, sin guardar.
- **Comprobación más reciente:** tipos, lint, 738 pruebas de servidor, 347 del panel y compilación de producción aprobados. Revisado en el panel sin guardar: filas del 05/06, pestaña Documentos, captura del 07 en «Documentos sin expediente» y el monto del inmueble con formato de moneda.
- **Hecho en esta sesión (17/10/2026):** Word del aviso 01 con su plantilla (`4e787f8`); candados del arranque en el servidor, FLUJO-04a (`a4c77c7`); PDF o Word en cada entregable, FLUJO-06 (`b54bab0`); fotografías del 07 en la captura (`9fba861`); herramienta «Documentos sin expediente» (`00bfb36`); montos con formato de moneda (`8449776`); opinión de valor 07 según su plantilla, en PDF y Excel, DOC-07 (`2fe90d0`).
- **Plantilla del 07:** la original del titular está en `G:\Mi unidad\FORTIUS\04_Metodologia\01_Captacion\07_OpinionValor.xlsx`. La copia del proyecto (`public/plantillas/07_OpinionValor.xlsx`) tiene sus fórmulas simplificadas; si el titular cambia la plantilla, hay que regenerar la copia y revisar el mapa de celdas de `src/lib/formatos/valor-excel.ts`. La carpeta antigua `C:\Users\Moise\MNT\INMOBILIARIA\Plantillas\Metodologia` ya no está disponible en el equipo; las demás plantillas probablemente están en la misma carpeta de `G:\Mi unidad\FORTIUS\04_Metodologia`.
- **Reglas del titular para los formatos:** capturar solo los campos que imprime la plantilla, nada inventado (opciones y textos con fuente verificable), PDF descargable aunque falten datos y ayuda breve en cada sección, pensada para asesores y no para peritos.

**Qué sigue, en este orden sugerido:**
1. **Diseño del PDF del 07** igual a la nueva plantilla: título centrado en mayúsculas, encabezado con «Opinión de valor comercial / Folio» y franja guinda y azul, subtítulos guinda, renglones compactos y doce páginas. Hoy sale con el diseño de la versión anterior (15 páginas), con los mismos datos y cifras.
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

Referencia de alcance: funciones de la imagen «Foto 1.jpg», incorporadas el 12 de octubre de 2026. Se integran al mismo sistema y comparten personas, inmuebles y expedientes. Son funciones solicitadas para desarrollar; esta incorporación no acredita su implementación.

| Grupo | Funciones que deberá ofrecer Fortius | Entregas relacionadas |
|---|---|---|
| Gestión empresarial | CRM, ERP, gestión e inventario de inmuebles, perfiles de clientes y portal privado para consultar lo que Fortius les comparta. | REL-01, CRM-01, OPS-01, PUB-01, FIN-01/02 y EXT-10. |
| Tableros e inversión | Cuatro tableros de dirección; calculadoras de inversión con TIR y VAN, flujos de efectivo, presupuestos y escenarios de rentabilidad guardados por operación. | TAB-01/02/03/04, FIN-01/02 y EXT-08. |
| Información geográfica | Mapas interactivos del inventario y comparables, análisis de zonas, rutas de visitas y visualizaciones geoespaciales con fuente y fecha. | TEC-01, VIS-01 y EXT-09. |
| Documentos y revisión jurídica | Generación de contratos y formularios PDF desde modelos revisados, expedientes digitales, revisión asistida de cláusulas y búsquedas documentales con RAG: respuestas que remitan al documento, versión y página utilizados. | DOC-01, LEG-01 y EXT-06. |
| Etapa posterior, en pausa (17/10/2026) | Adaptación para otras inmobiliarias: datos separados por empresa, marca por empresa, flujo configurable, alta guiada, planes y piloto externo. | SAAS-01 a SAAS-03, SAAS-05, SAAS-06 y PIL-02. |
| Trabajo diario profesional (17/10/2026) | Barra de comandos, atajos, acciones masivas, interfaz simplificada (32 correcciones), barra contraíble, fijados, vista previa lateral, listas inteligentes, planes de seguimiento, confianza al guardar, bandeja «Para ti», disciplina comercial, fichas 360°, aprobaciones, reglas fiscales con vigencia, metas, soporte e IA con revisión humana. | SIM-01 a SIM-12, NAV-01 a NAV-14, UX-02 a UX-05, CRM-02, CRM-03, INV-01, DAT-02, DOC-10 a DOC-13, FIN-03, APR-01, FIS-01, TAB-05, SOP-01, EXT-01 y EXT-11. |

La primera entrega sigue siendo captación y próxima acción dentro del panel. Después se amplían documentos, finanzas y tableros; el análisis de inversión, los mapas, el portal de clientes y la IA se entregan por módulos con sus pruebas. Estas cuatro capacidades forman parte del producto ampliado solicitado y siguen pendientes. El núcleo inicial puede aceptarse por separado; su aceptación no acredita que el producto ampliado esté completo.

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
| CI-01 | Checks Vercel y pruebas de bloqueo/paso a verde documentados. | Protección de main por un mecanismo administrativo soportado. Última lectura registrada: `protected=false`; no releída en esta limpieza. |
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
| DEC-02 | Empezar por captación y venta; luego compra y renta | Prioridad propuesta; confirmar antes del primer diseño de operación. |
| DEC-03 | Roles finos y permisos por acción (RP-05): director, coordinador, asesor, asistente, jurídico, contabilidad y aliado externo; permisos propios para ver precio mínimo, ver comisiones, aprobar descuentos, eliminar y exportar | Diseñar la matriz para el equipo de Fortius; confirmar responsables y visibilidad antes de activar permisos. Las cuentas `admin` y `editor` actuales se transfieren a los papeles nuevos sin perder acceso. |
| DEC-04 | Propiedad/persona puede tener varias relaciones; una persona puede tener varios papeles | Aprobar vocabulario y pruebas. La vinculación registrada no certifica titularidad. |
| DEC-05 | Distinguir estados comercial, documental y financiero | Confirmar criterios de avance/cierre, excepciones y responsables. |
| DEC-06 | RPO/RTO, retención y tratamiento de archivos | Copia diaria/RPO 24 h y RTO 8 h aprobados como objetivos; custodia, retención y capacidad demostrada pendientes. |
| DEC-07 | Reglas de honorarios, impuestos capturados, monedas y tipo de cambio | Validación por propietario y especialista; no aplicar tasas por defecto. |
| DEC-08 | PWA conectada como primera versión; offline sensible desactivado | Confirmar qué captura de campo se necesita antes de diseñar almacenamiento local. |
| DEC-09 | Fuente de verdad y papel de cualquier sistema externo | Inventario previo a sincronización o reutilización. Sin dependencia productiva demostrada. |
| DEC-10 | Acceso a configuración GitHub/Vercel y entorno aislado | Configuración Vercel y probes documentadas; protección main, backend preview y destino de recuperación siguen pendientes. |
| DEC-11 | Fuentes, precisión y servicios de mapas/rutas/comparables | Definir datos disponibles, permisos de uso, cobertura, precisión y costos antes de contratar un proveedor o publicar una ubicación. |
| DEC-12 | Modelos de inversión y supuestos por escenario | Definir periodicidad, fechas, monedas, tasa de descuento y alcance de proyecto/financiación/inversionista; validar método y casos de prueba. |
| DEC-13 | Información y acciones disponibles para clientes externos | Aprobar quién accede, qué documentos se comparten, qué puede solicitar y cómo se concede o revoca acceso. No reutilizar permisos de asesor. |
| DEC-14 | Corpus y tratamiento por el servicio de IA | Definir documentos autorizados, proveedor, conservación, costo y evaluación de citas, abstención y aislamiento antes de procesar información real. Aplica también a EXT-11. |
| DEC-15 | Abrir la etapa posterior (otras inmobiliarias) | Decidido el 17/10/2026: por ahora el sistema es exclusivo de Fortius y solo con su marca. Cuando el titular abra la etapa posterior, decidir nombre comercial, modelo (recomendado: una base con frontera por empresa en RLS; alternativa: una instalación por cliente) y criterios de apertura. No bloquea ninguna entrega actual. |
| DEC-16 | Protección de la propiedad intelectual | Puede atenderse en cualquier momento. Confirmar con abogado de propiedad intelectual: registro de obra (INDAUTOR), marca (IMPI), secreto industrial, convenios de confidencialidad y modelo de licencia para clientes. |
| DEC-17 | Probabilidad por etapa y metas | Fortius define probabilidades por etapa y metas por asesor y periodo, ajustables en Configuración. |
| DEC-18 | Cobro de suscripciones (etapa posterior, en pausa) | Proveedor de cobro, moneda, facturación (CFDI) de la suscripción y política de solo lectura por falta de pago. |
| DEC-19 | Monitoreo de errores en producción | Proveedor, retención, alertas y filtro de datos personales (OBS-01). |

## Criterios de producto terminado para la primera versión operativa

- Recorrido sintético prospecto → cliente → propietario relacionado → inmueble → expediente → tarea/visita → oferta → cierre documentado, sin registro duplicado provocado por reintentos.
- Persona, inmueble y operación tienen referencias durables. Un cambio de nombre o etiqueta no rompe vínculos.
- Dos asesores y un administrador de prueba ven exactamente su alcance; documentos y cifras sensibles respetan la misma regla.
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
| Etapa posterior (en pausa) | Adaptación para otras inmobiliarias: datos separados, marca por empresa, flujo configurable, alta de empresas, planes y piloto externo | Por estimar cuando el titular la abra (DEC-15) | Dos o tres inmobiliarias externas operan en piloto con datos separados, recorridos aceptados y tiempos medidos. |

M1: operación de captación utilizable tras fases 0–1. M2: operación de venta de extremo a extremo tras fase 2. M3: dirección con tableros tras fase 3. M4: versión operativa instalable y transferida tras fases 4–5, con pruebas de uso en meta. La venta a otras inmobiliarias no es un hito actual. Se puede adelantar UX y prueba de dispositivos de un módulo desde su primera entrega; UX-03 y UX-04 pueden empezar ya.

Ruta principal: BAS-01 → REL-01/SEG-01 → CRM-01/CRM-02 → OPS-01 → COM-01/DOC-01/LEG-01/TEC-01 → FIN-01 → TAB-01 → PIL-01. El detalle y el orden por bloques están en «Orden vigente». Recuperación REC-01, permisos SEG-01 y controles CI-01 son condiciones para pilotar datos sensibles en producción.

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
| USR-01 P1/I | Administrar cuentas del equipo desde el panel | nueva vista/API de personal, perfil asesor y adviser-accounts | SEG-01/AUT-01; 3–5d | Invitar, vincular y desactivar personal con trazabilidad; perfil público separado de cuenta; evitar dejar cero administradores activos; no pedir ni mostrar contraseña del usuario. |
| CRM-01 P1/I | Captar, calificar, convertir y programar próxima acción; coincidencias revisables | leads/clientes/lead-profile, conversion, followups | REL-01, SEG-01; 3–5d | Conversión idempotente, fuente/consentimiento trazados, sin fusión automática por teléfono. |
| OPS-01 P1/I | Expediente como operación coherente y centro de trabajo | operaciones nuevo, expedientes, tareas/eventos/related-work | DEC-02/05, CRM-01; 3–5d | Contexto compartido y enlaces durables; conflicto conserva captura; tarea vincula expediente explícitamente. |
| PUB-01 P1/I | Inventario interno separado de publicación; captación web conectada | property-form, public.ts, `/api/public/leads`, layout config | SEG-01, CRM-01; 2–4d | Alta no publica; datos privados no aparecen en web/PDF; formulario sintético llega al CRM si se autoriza activar captación. Demo se conserva. |
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
| CIE-01 P1/I | Condiciones, formalización, entrega, pendientes y archivo | formatos 15/16/17, operación, transiciones | OFE-01/LEG-01/TEC-01; 3–5d | Cierre comercial/documental/cobro distintos; entrega con evidencia; poscierre pendiente no desaparece por cerrar. |
| DOC-10 P1/C | Revisión lado a lado (RP-35) | operación guiada, visor de PDF e imagen, panel «Marcar como revisado» | DOC-01; 2–4d | En computadora se ve el documento y se captura la revisión sin cambiar de pantalla; en celular se alterna sin perder la captura. |
| DOC-11 P1/C | Carga de varios archivos con requisito propuesto (RP-36) | carga de archivos, requisitos de la operación | DOC-01; 2–3d | Se arrastran varios archivos; se propone el requisito por tipo y nombre y la persona confirma; ningún archivo queda revisado por cargarse. La propuesta por contenido llega con EXT-11. |
| DOC-12 P2/C | Pedir un documento al cliente por liga segura (RP-37) | ruta pública acotada, Storage privado, requisitos | DOC-01, SEG-01, PRV-01; 3–5d | Liga con vencimiento y revocable que solo permite subir a ese requisito; lo recibido queda «Lo tengo»; la liga no da acceso a ningún otro dato. |
| DOC-13 P1/C | Tablero de vencimientos de Fortius (RP-38) | «Pendientes documentales», requisitos con vigencia | DOC-01; 1–3d | Lista por fecha y responsable que enlaza a cada requisito; respeta permisos. |

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
| UX-02 P1/C | Búsqueda, vistas y preferencias guardadas en el servidor por usuario, y tablero personal (RP-14) | workspace/search/preferences, migración de preferencias | SEG-01/PAG-01/TAB-01; 2–4d | Filtra en servidor; densidad, columnas y vistas siguen al usuario entre equipos; el navegador solo guarda comodidades del dispositivo; orden accesible; una preferencia no altera permisos ni muestra widgets prohibidos. |
| UX-03 P1/C | Velocidad: barra de comandos, atajos, acciones masivas, edición en tabla, densidad y columnas (RP-09 a RP-13) | workspace/search, listas, kit | UX-01; 4–7d | Ctrl/Cmd+K busca y actúa solo con lo permitido; atajos documentados y desactivables, sin actuar dentro de campos; acciones masivas informan por registro y no duplican al reintentar; edición en tabla con control de versión; probado con teclado y lector de pantalla. |
| UX-04 P1/I | Confianza al guardar: estado de guardado, deshacer, conflicto lado a lado, siluetas y sesión vencida (RP-15 a RP-19) | kit, store, formularios | UX-01; 3–5d | Nunca «Guardado» antes de la confirmación del servidor; «Deshacer» solo donde el servidor restaura; conflicto campo por campo sin sobrescribir; sesión vencida conserva la captura. |
| SIM-01 a SIM-12 P1/I | Simplificación de la interfaz: las 32 correcciones C01–C32 aprobadas el 17/10/2026 (RP-50 a RP-57) | ver la sección «Simplificación de la interfaz (SIM)» | UX-01; SIM-01 primero; 1–3d por entrega | La aceptación de cada entrega está en su tabla; ninguna cambia reglas del servidor, permisos ni datos. |
| NAV-01 a NAV-14 P1/C | Navegación y productividad: las 25 mejoras N01–N25 aprobadas el 17/10/2026 (RP-58 a RP-69) | ver la sección «Navegación y productividad (NAV)» | dependencias por entrega en su tabla; 1–4d por entrega | La aceptación de cada entrega está en su tabla; NAV-12 lleva migración y NAV-14 espera PWA-03. |
| UX-05 P1/C | Bandeja «Para ti» en Hoy (RP-20) | Hoy, notas e historial, tareas, APR-01 | UX-04, SEG-01; 2–4d | Una mención avisa solo a quien puede ver el registro; el contador del menú suma la bandeja; marcar como leído; sin campana. |
| PWA-01 P1/I | Instalación y apertura del panel | manifiesto específico admin/layout/iconos | AUT-01/UX-01; 2–4d | Identidad/start_url/scope probados; inicia admin; acceso normal tras actualización; matriz real iOS/Android/iPad/Windows/macOS. |
| PWA-02 P2/C | Conectividad y captura de campo limitada | formularios, capa de conexión; SW solo alcance aprobado | PWA-01, DEC-08; 3–6d | Sin cache de API/Auth/PDF privados; caducidad/cierre de sesión; reintento no duplica. Offline de datos sensibles requiere diseño y aprobación adicionales. |
| PWA-03 P3/O | Notificaciones de tareas y citas con consentimiento | registro push por dispositivo, preferencias y disparador confiable | PWA-01/SEG-01/PRV-01 y canal acordado; 2–5d preliminares | Usuario opt-in; mensaje sin datos sensibles; horario operativo, revocación y duplicados probados; compatibilidad iOS instalada confirmada. No prometer entrega garantizada. |
| PAG-01 P1/I | Búsqueda/paginación de servidor y agregados | backend/repository, collections, expedientes, store y listas | SEG-01 y contratos por módulo; 4–7d | No descargar toda colección para una página; orden estable; RLS; filas sin pérdida ni duplicación; ningún cliente legacy se trunca. |
| ESC-01 P2/C | Medir volumen, consultas, concurrencia y PDFs | SQL/queries/tools, pruebas aisladas | PAG-01/FIN-01; 2–4d | Línea base y límites documentados; índices/locks/worker solo tras medición; integridad preservada. |
| PIL-01 P1/I | Piloto, capacitación, manual y soporte | pruebas/fixtures/docs, datos autorizados | Recorrido M2, tableros, continuidad y PWA; 3–6d más uso real | Recorridos aceptados por usuario; pruebas de uso medidas contra metas fijadas antes (RP-47); incidencias priorizadas; soporte/backup/responsable definidos; ningún módulo se declara terminado por tener pantalla. |
| SOP-01 P1/C | Soporte y ayuda dentro del panel (RP-48) | ayuda por pantalla, centro de ayuda, «Reportar un problema», recorrido inicial y «Primeros pasos» del asesor (N24, NAV-13) | OBS-01; 2–4d | El reporte lleva contexto técnico sin datos personales; ayuda por pantalla; recorrido inicial que se puede saltar y retomar. |

### Etapa posterior — adaptación para otras inmobiliarias (en pausa)

No se trabaja en estas entregas hasta que el titular abra la etapa posterior (DEC-15). Se conservan para no perder el análisis.

| ID / clase | Entrega / problema | Archivos o ámbito | Dependencias / esfuerzo | Aceptación verificable |
|---|---|---|---|---|
| SAAS-01 P2/O | Empresa como frontera de datos (RP-02) | migración aditiva, RLS, Storage, folios, respaldo/restauración, búsqueda y cachés | DEC-15; por estimar | Con dos empresas sintéticas, ninguna lee, busca, exporta ni descarga datos de la otra por API, SQL directo, enlace o ID modificado. Fortius queda como empresa 1 sin cambiar sus datos. Folios por empresa; respaldo y restauración por empresa ensayados en aislado. |
| SAAS-02 P2/O | Marca por empresa (RP-03) | tema del panel, PDF y Word, correos, dominio o subdominio | SAAS-01; por estimar | Logo, colores y datos de documentos cambian sin tocar código; el contraste AA se valida al guardar el tema; cada documento sale con los datos de su empresa. |
| SAAS-03 P2/O | Plantillas de flujo configurables y versionadas (RP-04) | `operation-workflow`, configuración, validación en servidor y PostgreSQL | SAAS-01, SEG-01; por estimar | El flujo de Fortius funciona como plantilla; cambios versionados; una operación en curso conserva su versión; los requisitos protegidos solo se desactivan por administrador con motivo; el servidor valida con la versión de cada operación. |
| SAAS-05 P2/O | Alta guiada de empresa e importación (RP-07) | asistente de alta, DAT-01, USR-01, SAAS-02/03 | SAAS-01 a SAAS-03, DAT-01, USR-01; por estimar | Una empresa sintética queda operando sin intervención técnica; la importación se simula y se revisa antes de escribir. |
| SAAS-06 P3/O | Planes, suscripción y límites (RP-08) | cobro, límites de usuarios y almacenamiento | SAAS-01, DEC-18; por estimar | Límites visibles con aviso previo; sin pago, solo lectura con exportación disponible; nunca se borran datos. |
| PIL-02 P2/O | Piloto con 2 o 3 inmobiliarias externas (RP-46) | empresas piloto con datos separados, guía de pruebas | SAAS-01 a SAAS-03, SAAS-05, PIL-01, REC-01, OBS-01; por estimar | Recorridos aceptados por cada empresa; tiempos medidos contra metas fijadas antes; incidencias priorizadas y cerradas antes de vender. |

## Estado y dependencias de cada entrega

Esta matriz conserva los 42 estados y dependencias explícitos del seguimiento original, incorpora tres entregas del producto ampliado (EXT-08, EXT-09 y EXT-10) y, desde el 17/10/2026, las 23 entregas de «Dirección del producto» las 12 del paquete SIM y las 14 del paquete NAV, para un total de 94. Las seis de la etapa posterior figuran «en_pausa». EXT-06 ya contemplaba IA y RAG; ahora se concreta su alcance solicitado. Complementa las condiciones de negocio y pruebas del backlog; preparación local aprobada no cambia automáticamente una entrega a aceptada.

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
| CRM-01 | 1 | pendiente | REL-01, SEG-01 |
| OPS-01 | 1 | pendiente | CRM-01 |
| PUB-01 | 1 | pendiente | SEG-01, CRM-01 |
| DAT-01 | 1 | pendiente | REL-01, SEG-01, PRV-01 |
| COM-01 | 2 | pendiente | OPS-01 |
| VIS-01 | 2 | pendiente | OPS-01 |
| OFE-01 | 2 | pendiente | COM-01, VIS-01 |
| DOC-01 | 2 | pendiente | OPS-01, SEG-01 |
| LEG-01 | 2 | pendiente | DOC-01 |
| TEC-01 | 2 | pendiente | DOC-01 |
| CIE-01 | 2 | pendiente | OFE-01, LEG-01, TEC-01 |
| FIN-01 | 3 | pendiente | OPS-01, DOC-01, SEG-01 |
| FIN-02 | 3 | pendiente | FIN-01 |
| TAB-01 | 3 | pendiente | SEG-01, CRM-01 |
| TAB-02 | 3 | pendiente | CRM-01, COM-01, VIS-01, TAB-01 |
| TAB-03 | 3 | pendiente | FIN-02, TAB-01 |
| TAB-04 | 3 | pendiente | LEG-01, TEC-01, TAB-01 |
| UX-01 | 4 | pendiente | BAS-01 |
| UX-02 | 4 | pendiente | SEG-01, PAG-01, TAB-01 |
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
| SIM-04 | 4 | pendiente | SIM-01 |
| SIM-05 | 4 | pendiente | SIM-01 |
| SIM-06 | 4 | pendiente | SIM-01 |
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
| NAV-13 | 4 | pendiente | SIM-01, SOP-01 |
| NAV-14 | 4 | pendiente | PWA-03 |
| UX-03 | 4 | pendiente | UX-01 |
| UX-04 | 4 | pendiente | UX-01 |
| UX-05 | 4 | pendiente | UX-04, SEG-01 |
| SOP-01 | 5 | pendiente | OBS-01 |
| EXT-11 | 6 | pendiente | DEC-14, EXT-06, SEG-01 |
| SAAS-01 | posterior | en_pausa | DEC-15 |
| SAAS-02 | posterior | en_pausa | SAAS-01 |
| SAAS-03 | posterior | en_pausa | SAAS-01, SEG-01 |
| SAAS-05 | posterior | en_pausa | SAAS-01, SAAS-02, SAAS-03, DAT-01, USR-01 |
| SAAS-06 | posterior | en_pausa | SAAS-01, DEC-18 |
| PIL-02 | posterior | en_pausa | SAAS-01 a SAAS-03, SAAS-05, PIL-01, REC-01, OBS-01 |

**Discrepancia pendiente de EXT-03:** el backlog condiciona proveedores/mantenimiento a EXT-02 o a un caso de venta concreto; el seguimiento exige OPS-01 y FIN-01. Conservar ambas referencias y resolver su dependencia al diseñar esa extensión, sin iniciar por una equivalencia supuesta.

## Finanzas y diccionario mínimo de indicadores

| Indicador | Definición | Fuente / tratamiento de desconocidos |
|---|---|---|
| Contactos vencidos | Contactos activos con próxima fecha anterior a corte local | Followups autorizados; fecha ausente se cuenta aparte, no como vencido. |
| Primera atención | Tiempo desde recepción hasta contacto registrado; mediana y población sin medición | `creadoEl` y `firstContactedAt`; no inferir de clics WhatsApp. |
| Conversión CRM | Leads convertidos / leads de cohorte de recepción, con periodo de observación | Conversiones; nombre exacto «a cliente», no cierre. |
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
| R-10 | Riesgo (etapa posterior): un flujo configurado por una empresa deja de proteger la operación | SAAS-03; requisitos protegidos, versiones por operación y validación en servidor; desactivar uno exige administrador y motivo. |
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

Paquetes de fase 6: EXT-01, EXT-06, EXT-08, EXT-09, EXT-10 y EXT-11 están solicitados para el producto ampliado. Las demás extensiones entran al backlog de ejecución por decisión de negocio o necesidad demostrada. Descubrimiento de 1–3 días orientativos por paquete; esfuerzo de implementación se estima después de validar modelos, proveedor y alcance. Las ventanas originales cubren el núcleo y no estiman estas cuatro capacidades.

| ID / capacidad | Cuándo evaluarla / dependencias | Resultado de descubrimiento antes de programar |
|---|---|---|
| EXT-01 — Compradores y matching | Solicitada el 17/10/2026 (RP-24); CRM-01/OPS-01 | Reglas aprobadas, coincidencias explicables en los dos sentidos (inmueble → prospectos y prospecto → inmuebles) y permisos. |
| EXT-02 — Renta/administración | Hay contratos recurrentes administrados por Fortius; FIN-02/CIE-01/LEG-01 | Ciclo de renta/depósitos/renovación/mora/entrega y reparto de cobros definido. |
| EXT-03 — Proveedores/mantenimiento | Hay órdenes, presupuestos y trabajos que coordinar; EXT-02 o caso de venta concreto | Responsable, autorización, evidencia y enlace a operación/arrendamiento. |
| EXT-04 — Portales/correo/calendario/WhatsApp API | Doble captura real y proveedor con acceso API; OPS-01/PRV-01 | IDs externos, consentimiento, idempotencia, reintentos y costo. Enlace WhatsApp no equivale a integración. |
| EXT-05 — CFDI/contabilidad/bancos/firma | Necesidad confirmada y proveedor/revisión especializada; FIN-02/DOC-01/PRV-01 | Alcance legal, contrato API, conciliación y permisos; no custodiar dinero por defecto. |
| EXT-06 — Búsqueda documental y revisión asistida de cláusulas | Solicitada; corpus autorizado/versionado y DEC-14; DOC-01/LEG-01/PRV-01, con aislamiento de acceso de SEG-01 | Búsqueda con documento/versión/página, propuestas de cláusulas, evaluación de citas/abstención/permisos y revisión humana. |
| EXT-07 — Cola/worker/eventos | Trabajos duran o reintentos superan límites medidos; ESC-01 | Métrica, idempotencia, reconciliación y plan de operación. |
| EXT-08 — Análisis de inversión | Solicitado; DEC-12 y FIN-02/TAB-01/OPS-01/SEG-01 | Escenarios con TIR/VAN, flujo, presupuesto, supuestos, separación de financiación y resultados comprobables. |
| EXT-09 — Mapas, comparables, zonas y rutas | Solicitados; DEC-11 y REL-01/TEC-01/VIS-01/SEG-01 | Fuentes/precisión/cobertura, uso permitido, motor/costo, capas autorizadas y recorrido sintético de visitas. |
| EXT-10 — Portal privado de clientes | Solicitado; DEC-13 y REL-01/OPS-01/DOC-01/SEG-01/AUT-01/PRV-01 | Identidad externa, información compartida, solicitudes, permisos efectivos, revocación y uso móvil. DOC-12 es su primera pieza. |
| EXT-11 — Asistente IA operativo | Solicitado el 17/10/2026 (RP-44); DEC-14, EXT-06, SEG-01 | Resumen de operación, lectura de INE y escritura con confirmación campo por campo, descripción de anuncio y sugerencia de siguiente paso; citas, permisos, evaluación, costo y abstención. Nunca cambia estados ni envía nada por sí solo. |

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

**Modificar:** `src/lib/backend/lead-conversion.ts`, rutas de conversión, `src/components/admin/convert-lead-button.tsx`, perfiles de lead/cliente, `src/lib/admin/followups.ts`, enlaces RelatedWork.

**Tests existentes:** `tests/backend/lead-conversion-database.test.ts`, `tests/backend/lead-conversion-route.test.ts`, `tests/admin/lead-conversion.test.tsx`. Añadir prueba de recorrido CRM si el escenario completo no existe.

**Consume:** `convertLead(client, id, { version })` existente; REL-01/SEG-01. **Produce:** mismos IDs/contrato de conversión actual, contexto y próxima acción con responsable.

- [ ] Repetir tests actuales para comprobar idempotencia ya implementada; no rehacer RPC sin un fallo demostrado.
- [ ] Añadir test de respuesta perdida/reintento que conserve clienteId y leadId únicos, y conflicto de versión que conserve captura.
- [ ] Presentar propietario/comprador y vínculos en contexto; registrar coincidencias como avisos, nunca fusión automática.
- [ ] Añadir siguiente acción con fecha/responsable o motivo explícito de pendiente, reutilizando tareas/seguimiento. Contacto confirmado se registra, no se infiere de abrir WhatsApp.
- [ ] Comprobar resultado tras recarga y en alcance del asesor correcto; preservar firstContactedAt y snapshot de lead original.

**Aceptación:** convertir dos veces produce el mismo cliente autorizado; perfil y próxima acción permanecen tras recarga; sin venta/income inferida por conversión.

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
