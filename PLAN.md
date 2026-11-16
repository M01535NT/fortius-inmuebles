# Fortius — plan de trabajo del ERP/CRM

**Actualizado:** 15 de noviembre de 2026. **Responsable de negocio:** Moisés Núñez Tonalá. **Desarrollo:** agente de desarrollo.

Este archivo dice **qué falta hacer y cómo va**. **Cómo funciona el sistema** (reglas RP y decisiones DEC) está en [`SPEC.md`](SPEC.md); lo terminado, en el [historial](docs/erp-crm/historial-del-plan.md). Si algo choca con `SPEC.md`, manda `SPEC.md`. El agente que trabaja un tema actualiza los dos archivos en la rama de trabajo.

**Para saber cómo va, basta leer esta primera sección.** Lo demás es consulta: el orden de trabajo, los paquetes con su detalle, la tabla de estado de cada entrega y las tareas de continuidad.

## Dónde nos quedamos — 15/11/2026

**Meta: empezar a trabajar de verdad con el panel.** Faltan cuatro cosas:

| # | Qué falta | Cómo va |
|---|---|---|
| 1 | **Panel flexible** (FLX-01 a FLX-09) | FLX-01 aprobada (15/11/2026). FLX-02 hecha en `feat/integracion` (localhost:3003): «Crear documento» en asunto, persona e inmueble, sin candados de pantalla, y «Pasar a un asunto» para los documentos sueltos; falta tu revisión. FLX-03 parte A (de frenos a avisos) y parte B (guías por tipo de asunto: inspección, opinión de valor y cancelación de hipoteca con sus etapas; elegir y cambiar el tipo; empezar en cualquier etapa; Asuntos agrupado por urgencia en lugar de por tipo (titular, 15/11/2026); avisos recientes en Hoy; sin excepciones del director) hechas en la misma rama el 15/11; falta tu revisión. Compra y búsqueda de renta se abren con FLX-04. Después quedan FLX-03 C (asunto libre sin guía, varias guías seguidas, «Nuevo asunto» desde la Bandeja), FLX-04, FLX-05, FLX-07, FLX-08, FLX-09 y el cierre FLX-06. |
| 2 | **Respaldos restaurables y accesos seguros** (bloque 0) | La copia diaria corre desde el 13/11. Falta que actives los dos pasos de entrada (AUT-01), repetir la prueba de alertas desde producción (OBS-01), revisar la limpieza diaria de archivos y repetir el ensayo de restauración con un archivo de la Bandeja (REC-01). |
| 3 | **Cuentas del equipo** (SEG-01 y USR-01) | Pendientes. Las necesitas desde el primer día (14/11/2026). |
| 4 | **Revisión del abogado** | Pendiente: formatos 20 al 24, el umbral de 10,000 UMA del 24, la conservación de 10 años del expediente LFPIORPI, «nada frena, solo avisa» (RP-100) en antilavado y promesa, el aviso de privacidad y el registro de tratamiento (PRV-01) y la lectura con IA de documentos reales. Todo está reunido, con sus preguntas, en [`revision-abogado-2026-11-15.md`](docs/legal/revision-abogado-2026-11-15.md) (15/11/2026). |

El día que cargues el inventario real se sigue [`paso-a-inventario-real.md`](docs/erp-crm/paso-a-inventario-real.md). Todo lo demás está en «Después de empezar a operar», sin orden fijo.

**Lo último:** el PR #76 (14/11/2026, merge `52e1f9a`) publicó Trámites (TRA-01), el panel desde cero (LV-09) y la paleta del sitio. En `feat/integracion`, sin publicar: FLX-01, Personas en el menú, la limpieza del 14/11/2026 y la poda de este plan (de 115 entregas quedaron 86; 21 pasaron a FLX y lo terminado o descartado está en el historial, §28). La limpieza previa a LV-10 (retiro de `panel.module.css`, un solo menú «⋯», colores a tokens y las ocho reglas de LV-08 revisadas, RP-104) está en el historial (§29).

### Te toca a ti

1. **Activar los dos pasos del director** en fortiusinmuebles.com/admin con tu app de códigos y probar una entrada (AUT-01). Es lo único con riesgo real mientras no esté.
2. **Revisar el panel:** Trámites y el panel nuevo en el sitio publicado, y FLX-02 en localhost (localhost:3003). Lo que siga mal se anota como corrección nueva.
3. **Llevar al abogado** el paquete de revisión ([`revision-abogado-2026-11-15.md`](docs/legal/revision-abogado-2026-11-15.md)) con los formatos impresos que pide.
4. **Mandar una solicitud de prueba** desde el formulario de fortiusinmuebles.com (COR-21).
5. **Pasar los datos de la empresa** (la persona moral) para los avisos de privacidad.
6. **Decidir cuando llegue su momento:** recorrido propio de la renta (DEC-02), vocabulario de papeles de una persona (DEC-04, dentro de FLX-04), custodia y retención de copias (DEC-06) y el backend de pruebas (ENV-01 c). Preguntas abiertas: [`CUESTIONARIO_TITULAR.md`](docs/erp-crm/CUESTIONARIO_TITULAR.md).

Anotado y fuera por ahora: `npm audit` marca 3 avisos altos de una cadena solo de desarrollo (zod 3 dentro de lighthouse); corregirla pide subir lighthouse de versión mayor. TRA-01 se confirma con el primer caso real: que el Registro acepte la carta de Infonavit tal cual.

## Cómo se mantiene este plan (regla del titular)

El producto cambia con frecuencia por ideas nuevas. Para que el plan siga limpio:

1. Una idea aprobada se escribe como regla (RP-xx) y, si necesita trabajo, como entrega del backlog con su aceptación. No se abre otro plan ni otra bitácora.
2. **Si una regla nueva contradice a una anterior, la anterior se reescribe en su lugar** y el cambio se anota en «Reglas reemplazadas» (`SPEC.md`) al final de esta sección. No conviven dos reglas contradictorias.
3. Los registros históricos de entregas no se reescriben (son evidencia), pero cuando quedan superados llevan una nota que dice qué los reemplaza.
4. Una idea sin decidir no se presenta como regla: va a «Decisiones propuestas» con lo que falta para decidirla.
5. Las reglas conservan su número aunque cambien o se pongan en pausa, para que las referencias del backlog sigan siendo válidas.
6. El tablero de arriba se reescribe al cerrar cada entrega; lo que deja de ser actual pasa al historial (el tablero del 12/11/2026 está en su §17).

**Origen:** hasta el 13/11/2026 este plan se llamó `PLAN_ERP_CRM.md` y después `ROADMAP.md`; el 14/11/2026 se separó en este archivo y `SPEC.md`.

## Orden vigente

**Este orden manda (titular, 14/11/2026).** Lo vigente es el panel flexible (DEC-50 y FLX), «nada frena, solo avisa» (RP-100), documentos sin operación (RP-101), inmuebles sin propietario (RP-102), compradores y arrendatarios como clientes (RP-93), la metodología como guía que sugiere, el panel nuevo con menú lateral y riel de etapas (LV-09) y la Bandeja que recibe todo y recomienda a dónde va cada cosa (RP-103). Si algo de este plan choca con eso, gana lo vigente. La columna «Fase» de «Estado y dependencias» solo agrupa por tema.

### Para empezar a operar (la meta)

1. **Panel flexible completo:** FLX-01 → FLX-02 → FLX-03 → FLX-04 → FLX-05, FLX-07, FLX-08 y FLX-09 (pueden ir en paralelo) → FLX-06, que cierra el paquete. Una etapa a la vez, con revisión del titular entre cada una. Antes de FLX-03 y FLX-04 se le avisa, porque cambian cómo avanza una operación.
2. **Continuidad (bloque 0), en paralelo:** REC-01, AUT-01, OBS-01, ENV-01 y PRV-01. BAS-01 y CI-01 están terminadas.
3. **Cuentas del equipo:** SEG-01 (qué puede hacer cada quien) y después USR-01 (invitar al equipo desde el panel). El titular las necesita desde el primer día.
4. **Revisión del abogado:** formatos 20 al 24, umbral del 24, conservación LFPIORPI, RP-100 en antilavado y promesa, PRV-01 y la lectura con IA de documentos reales. Sin su visto bueno nada de eso se usa con clientes reales.

### Después de empezar a operar

Sin orden detallado: el titular elige qué sigue según lo que muestre el uso real. Cada entrega dice de qué depende en «Estado y dependencias».

- **Clientes e inventario:** PUB-01, CRM-02, INV-01, DAT-01, DAT-02 y COR-25.
- **Venta y documentos:** COM-01, VIS-01, OFE-01, DOC-01, LEG-01, TEC-01, CIE-01, DOC-10, DOC-12, CAP-02, CAP-04, FCH-05, FCH-08 a FCH-10, FIR-01 y TRA-02.
- **Dinero y tableros:** FIN-01 a FIN-03, APR-01, FIS-01 y TAB-01 a TAB-05.
- **Pantalla:** NOM-01, UX-02 a UX-04, NAV-01, NAV-03 a NAV-10, NAV-12, NAV-14 y LV-03.
- **Escala, soporte y piloto:** PWA-01 a PWA-03, PAG-01, ESC-01, SOP-01, USO-02 y PIL-01.
- **Extensiones:** EXT-05, EXT-06 y EXT-08 a EXT-11; EXT-13 (tope de gasto en IA, conservada el 14/11/2026). EXT-02, EXT-03, EXT-04 y EXT-07 solo por decisión de negocio o necesidad demostrada.
- **Etapa posterior** (en pausa hasta que el titular la abra): SAAS-01 a SAAS-06 y PIL-02.

## Navegación y productividad (NAV) — paquete del 17/10/2026 (el estado de cada entrega está en «Estado y dependencias»)

**Origen:** investigación de CRM inmobiliarios (Follow Up Boss, Lofty, EasyBroker, Tokko Broker, SkySlope) y de paneles de referencia (HubSpot, Attio), filtrada con criterio crítico. El titular aprobó **las 25 mejoras (N01–N25)** y las cinco restricciones (RP-65 a RP-69) el 17/10/2026. **Estado al 14/11/2026:** NAV-02 y NAV-13 están en `main`; NAV-03 está en parte; N20 se archivó (titular, 14/11/2026). Lo demás sigue pendiente y se construye sobre el panel nuevo (LV-09).

**Cómo trabajarlo:** capturar antes y después con datos simulados, pruebas del panel y de navegador afectadas, y registrar la entrega aquí. Cada entrega NAV dice de qué entregas depende. Las entregas marcadas «con migración» requieren respaldo, ensayo aislado y autorización, como cualquier cambio de base.

### Las 25 mejoras y cómo conviven con el plan

**A. Barra lateral y navegación**

| # | Mejora | Cómo convive con el plan |
|---|---|---|
| N01 | **Contraer la barra lateral a íconos** con un botón y la tecla `[` (atajo de una tecla: no actúa dentro de campos y se puede desactivar, RP-11); con la barra contraída, el nombre aparece al pasar el mouse o al enfocar. El estado se recuerda por usuario. | El rediseño (Fase C · 2) había retirado contraer y ajustar el ancho; vuelve solo contraer, sin ancho ajustable. El estado se guarda con las preferencias del servidor (RP-14, UX-02). En celular no aplica: sigue la barra inferior. Se hace junto con el pie compacto de C06. |
| N02 | **Sección «Fijados»**: cada quien fija hasta 5 registros o listas (operación, contacto, inmueble, lista guardada). | No mueve ni oculta las ocho secciones del menú (RP-58, RP-65). Si un registro fijado se elimina o se pierde el permiso, desaparece de Fijados sin error. En celular, Fijados va en el Menú. |
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
| NAV-01 | N01, N02, N04 | UX-02 | Barra contraíble con botón y `[`, nombres visibles al enfocar; hasta 5 fijados que sobreviven a recargar y cambiar de equipo; contadores solo con algo vencido; las ocho secciones del menú no se mueven. |
| NAV-03 | N05, N06 | LV-09 | Vista previa en Operaciones, Contactos e Inmuebles a partir de 1024 px; al volver de una ficha, lista con la misma búsqueda, filtro y posición. |
| NAV-04 | N07 | UX-02, SEG-01 | Listas del equipo creadas por el administrador y personales por usuario; cada lista respeta permisos; umbrales en Configuración. |
| NAV-05 | N08–N11 | UX-02 | Secciones de Hoy ocultables salvo las protegidas; letra Grande sin desbordamiento a 320 px; tema automático; inicio por rol con Hoy como respaldo. |
| NAV-06 | N12 | CRM-02 | Plantillas de plan en Configuración; una tarea a la vez; ningún envío automático; se puede detener; cumple la próxima tarea de la operación. |
| NAV-07 | N13–N15 | UX-04 | Posponer con deshacer; acciones de fila con alternativa en «⋯»; edición en la ficha con control de versión. |
| NAV-08 | N16 | DOC-10, SEG-01 | Cola que recorre pendientes de revisión de todas las operaciones visibles; misma evidencia que «Marcar como revisado». |
| NAV-09 | N17 | CRM-02 | Calificación manual con sugerencia que no se aplica sola; listas ordenables por ella. |
| NAV-10 | N18, N19 | FLX-07, PUB-01 | Cámara desde el requisito, imagen privada sin ubicación; «Ver como cliente» con datos públicos únicamente. |
| NAV-12 | N21, N22 | Migración autorizada (N21), PRV-01 (N22) | Citas con duración y arrastre con alternativa de teclado; suscripción de solo lectura, revocable y con datos mínimos. |
| NAV-14 | N25 | PWA-03 | En espera hasta que existan avisos fuera del panel. |

## Lenguaje visual (LV)

**Origen:** paquete del 17/10/2026 (V01–V10, RP-70 a RP-74). Lo construido (LV-01, LV-02, LV-04 a LV-08) y el panel desde cero (LV-09, publicado con el PR #76 el 14/11/2026) están en el historial (§20, §27 y §28). Queda LV-03.  El 14/11/2026 el titular aprobó el sistema combinado (DEC-51), que se construye en LV-10a a LV-10f. El registro completo de lo hecho en LV-10 está en el historial, §31.1.

| ID | Mejoras | Depende de | Aceptación |
|---|---|---|---|
| LV-03 | V06: animaciones pequeñas que confirman (la palomita que se dibuja, la barra que se llena, el panel que se desliza, «Etapa completada») | LV-02, UX-04 | Animaciones de confirmación de 300 ms o menos, sin bucles; con «reducir movimiento» no hay transiciones; los mensajes de guardado siguen apareciendo. |
| LV-10a | **Sistema combinado (DEC-51), base:** cara de cada persona con su color fijo, riel compacto de diez etapas para filas, densidad Cómodo/Compacto guardada por usuario (UX-02). | LV-09 | Mismo color para la misma persona en todas las pantallas; contraste AA en claro y oscuro; la densidad sigue al usuario y no cambia permisos. |
| LV-10t | **Tecnologías de interfaz (DEC-52):** shadcn/ui sobre Radix (radix-ui 1.8.1) en `src/components/ui/`, cmdk 1.1.1 en Ctrl K, Sonner 2.0.8 en los avisos con «Deshacer» y Motion; todo entra por el kit con los mismos nombres. Sin guía superpuesta, sin «Empieza aquí», «Tu primer día» ni «Preparar tu espacio». | LV-10a | Hecho en la rama el 14/11/2026. Falta: pestañas (`Tabs`) sobre Radix y las ventanas de conflicto, sesión vencida y atajos. |
| LV-10b | **Hoy:** lo siguiente en grande con foto del inmueble; el resto con foto o cara; se palomea sin salir y se puede deshacer. Hoy no crece: cada enlace cuenta lo que se encuentra al llegar (15/11/2026). | LV-10a | Hecho en la rama el 14/11/2026, con las reglas de volumen de abajo. Falta: «Todo el equipo» del administrador con resumen por asesor. |
| LV-10c | **Asuntos y el asunto:** lo vencido arriba; encabezado del asunto con foto, caras y riel clicable; barra fija con lo que falta; controles de Radix (DEC-52). Desde el 15/11/2026 la lista y el tablero van por urgencia, sin etapas (FLX-03). | LV-10a | Hecho en la rama el 14 y 15/11/2026. Se quedan nativos los `<select>` de listas cortas dentro de formularios largos. Pendiente: en el asunto, al pasar con flecha de «Etapa» a otra pestaña, la lista se rehace en vertical y se pierde el foco. |
| LV-10d | **Bandeja como correo:** lista, documento en grande y «¿Dónde se guarda?» con la sugerencia; J/K para moverse, E archiva y # manda a la papelera, con «Deshacer». | LV-10a, FLX-01 | Hecho en la rama el 14/11/2026, con las piezas de DEC-52. Falta: «Archivados» (la API todavía no los lista). |
| LV-10e | **Personas como agenda con cara:** grupos por fecha de contacto; ficha con «En qué quedamos», sus inmuebles con foto, sus asuntos, documentos e historial; teléfono, correo, papel y próximo contacto se cambian en su lugar con versión (409) y «Deshacer»; «Agregar inmueble» de su interés (15/11/2026). | LV-10a, FLX-01 | Hecho en la rama el 14 y 15/11/2026. |
| LV-10f | **Inmuebles, Trámites, Más y Ctrl K:** «Piden algo hoy»; precio editable en la fila; lista con foto, etapa y ficha rápida (lo mejor de las tres direcciones, 15/11/2026); Trámites con foto y caras; Más como lanzador y, por dentro, con las piezas del kit; Ctrl K con caras, fotos y acciones. | LV-10a | Hecho en la rama el 14 y 15/11/2026; `npm run verify` en verde el 14/11. Pendiente: la suite de navegador del panel, que el 14/11 dio 20 fallas ajenas a LV-10 (registro en `tmp/browser-lv10f.log`), por corregir antes del PR. |
| LV-10g | **Agenda y Tareas:** Semana y Mes con el calendario del kit; cada cita con cara y foto; detalle en panel lateral con «Lo que sigue»; Tareas con las piezas del kit. | LV-10a, LV-10t | Hecho en la rama el 14/11/2026. Falta: la hora sigue con el control del navegador, los atajos no salen en la ayuda de atajos y el calendario vuelve a montar su raíz en cada render. |

**Reglas de volumen de Hoy (acordadas el 29/10/2026, siguen en «Tu día» de LV-09):** Hoy no muestra el inventario, solo lo que espera algo del usuario, así que mide lo mismo con 12 pendientes que con 200:

- las cifras ocupan el mismo bloque con cualquier cantidad;
- los pendientes muestran con foto solo los 4 más urgentes; los siguientes, hasta unos 10, en lista compacta sin foto, y al final «Ver los N»;
- orden por urgencia (vencidas primero, después lo que vence en la semana); varios pendientes del mismo inmueble se agrupan en una tarjeta («3 pendientes»);
- por omisión cada asesor ve lo suyo; el administrador cambia a «Todo el equipo», que con volumen alto se muestra como resumen por asesor y no como lista;
- un pendiente sin inmueble (por ejemplo, una entrevista inicial) usa un bloque de color con iniciales en lugar de foto;
- tareas y agenda muestran las primeras 5 y «Ver todas».

**Sitio público (reglas que siguen mandando):** la marca no lleva rosa (borgoña sobre claro y blanco azulado `#F8F8FF` sobre oscuro; desde el 12/11/2026, sin crema ni beige, `docs/brand.md`); en oscuro, las secciones alternas van en azul noche `#0B1828`, las preguntas del inicio siguen el tema oscuro y no hay halos ni degradados vino (13/11/2026); en claro el sitio es claro, sin degradados oscuros, y «Nocturno» solo en oscuro; sin cejas sobre los títulos (31/10/2026); Scroll Motion y GSAP se conservan; el carrusel de la ficha no se toca; las destacadas van como baraja de cinco como máximo; el título del método es «Así vendemos tu propiedad.». El registro de esas decisiones está en el historial.

## Proceso, captura y documentos (lo que queda)

**Origen:** paquete del 17/10/2026 (F01–F23), con los casos de uso, la jornada del asesor y la medición de captura del 02/11/2026. Lo construido, lo que absorbió el panel flexible y el análisis completo están en el historial (§28). Aquí queda solo lo que sigue pendiente fuera de FLX.

### Llamada y entrevista (CAP)

| # | Mejora | Cómo convive con el plan |
|---|---|---|
| F03 | **Enviar el aviso de privacidad con un toque** (WhatsApp o correo con texto corto y liga a la página de privacidad); queda «aviso enviado». | Plantilla de mensaje de RP-22 (CRM-02): se registra cuando el asesor confirma. «Aviso enviado» no es consentimiento (RP-81). |
| F08 | **Cierre de la entrevista con tres acciones:** descargar la entrevista (PDF o Word), enviar la lista de documentos (WhatsApp o correo) y agendar el levantamiento. | Envío por plantilla (RP-22). |
| F09 | **Modo cita:** botones y letra grandes, sin menú lateral, para celular o tableta frente al cliente. | Compatible con la letra Grande (N09). |

| ID | Mejoras | Depende de | Aceptación |
|---|---|---|---|
| CAP-02 | F03 | CRM-02 | Aviso enviado por WhatsApp o correo con liga; registro al confirmar; sin lenguaje de consentimiento. |
| CAP-04 | F08, F09 | FLX-04, CRM-02 | Cierre con descarga, envío de la lista y agenda del levantamiento; modo cita usable a 390 px con objetivos táctiles grandes. |

### Documentos (FCH)

| # | Mejora | Cómo convive con el plan |
|---|---|---|
| F15 | **Captura en oficina al lado del documento:** la escritura a un lado y los datos legales del inmueble al otro. | Vista lado a lado de DOC-10. La propuesta automática de datos llega con FLX-07 y EXT-11, siempre con confirmación (RP-44). |
| F20 | **Dictamen con biblioteca de párrafos** y resultado: Vendible, Vendible con condiciones o No vendible. | El abogado elige y redacta; el sistema no dictamina (LEG-01, R-03). «No vendible» ofrece pausar o descartar con motivo. |
| F21 | **Copia firmada como último paso** de cada documento. | Ya existe la carga de copia firmada; se presenta como paso final con la insignia «Firmado». |
| F23 | **Plantillas Word propias con campos** (por ejemplo `{{propietario.nombre}}`) llenadas con los datos de la persona y el inmueble. | Campos simples con `jszip`, ya instalado. |

| ID | Mejoras | Depende de | Aceptación |
|---|---|---|---|
| FCH-05 | F15 | FLX-04, DOC-10 | Documento y datos legales lado a lado; guardar actualiza el perfil del inmueble. |
| FCH-08 | F20 | DOC-06 | Biblioteca de párrafos editable; resultado explícito; PDF y Word. |
| FCH-09 | F21 | LV-02 | Copia firmada como paso final con insignia «Firmado». Hoy solo existe para la intermediación 09/21 (bbef89d). |
| FCH-10 | F23 | FLX-04 | Plantilla Word subida con campos que se llenan desde los perfiles; campos desconocidos se avisan. |

### Trámites (TRA)

**Origen:** el titular notó el 14/11/2026 que «Nuevo» en Trámites abre directo «Nueva cancelación de hipoteca», aunque la sección es de trámites en general. TRA-01 quedó amarrado a ese único tipo (`tipo: "cancelacion_hipoteca"` en `src/lib/tramites.ts`).

| ID | Qué | Depende de | Aceptación |
|---|---|---|---|
| TRA-02 | **Varios tipos de trámite:** «Nuevo» pregunta primero «¿Qué trámite?» y cada tipo trae sus propios datos y pasos; la lista, el detalle con «lo que sigue», el envío del avance y los pagos son los mismos para todos. La cancelación de hipoteca sigue igual. Candidatos, por confirmar con el titular: certificado de libertad de gravamen, avalúo, no adeudo de predial, no adeudo de agua (CESPT), cambio de nombre en luz y agua tras la venta, régimen en condominio o subdivisión, sucesión o adjudicación (con abogado) y regularización ante INSUS (antes CORETT). | TRA-01 | Elegir cada tipo abre sus pasos; los trámites existentes de cancelación de hipoteca se leen y avanzan sin cambios; el freno de la firma (RP de TRA-01) solo aplica a la cancelación de hipoteca; los pasos de cada tipo se verifican con fuente oficial vigente antes de construirlos. |

### Nombres (NOM)

| ID | Qué | Depende de | Aceptación |
|---|---|---|---|
| NOM-01 | **«Operaciones» pasa a «Asuntos» (DEC-53):** todo lo que se lee en el panel (menú, títulos, botones, avisos, vacíos, Ctrl K, Más, Hoy, ayuda y manuales del panel) dice «Asuntos» y «asunto», con la concordancia en masculino («Nuevo asunto», «el asunto abierto»). | LV-10 (hacerlo cuando ese chat termine su etapa para no chocar en los mismos archivos) | Ninguna pantalla del panel dice «operación» salvo en formatos y PDF donde sea término de la plantilla; rutas, tablas, API y folios sin cambios; pruebas actualizadas al texto nuevo sin quitar ninguna; revisado en computadora y celular. |

### Carga inicial y prueba de uso

| ID | Alcance | Depende de | Aceptación |
|---|---|---|---|
| COR-25 | **Carga inicial por lote** (pantalla de DAT-01, solo administrador): plantilla de Excel con inmuebles, propietarios, contratos vigentes y, opcionalmente, asuntos en curso; el sistema simula, muestra duplicados, referencias ambiguas y errores sin escribir nada, y crea el lote cuando el administrador lo aprueba; cada inmueble queda como inventario heredado (COR-24) con lo que falta por regularizar. | DAT-01 | Un lote de 30 inmuebles con 30 propietarios se carga en una sesión; la simulación detecta un teléfono repetido y una fecha inválida; el lote se puede revertir si nadie lo ha tocado. |
| USO-02 | **Prueba de uso cronometrada** con el director y dos asesores, resolviendo casos sintéticos sin ayuda (absorbe USO-01): llamada en menos de 1 minuto; entrevista en la cita en menos de 10; levantamiento en sitio en menos de 30; inmueble listo para publicar en tres sesiones de trabajo. Se anota dónde se detienen. Lo que no cumpla la meta vuelve a este plan como corrección. | FLX-06 | Tabla de tiempos por paso y persona; lista de correcciones derivadas, numeradas. Sin datos reales. |

## Panel flexible (FLX) — aprobado por el titular el 14/11/2026

**Origen:** el titular recibió el levantamiento y el avalúo de un terreno para inspeccionarlo, sin trato con el propietario, y el panel no tenía dónde guardarlos. Aprobó un concepto nuevo (DEC-50): guardar primero y ordenar después, con Bandeja, personas, inmuebles sin dueño conocido y asuntos; la metodología como guía que sugiere; nada frena, solo avisa (RP-100); compradores y arrendatarios como clientes al firmar (RP-93); lo que recibimos manda: todo entra por la Bandeja y el sistema recomienda a dónde va (RP-103). Bocetos aprobados: lenguaje de Trámites. Las etapas 3 y 4 cambian cómo avanza una operación: se avisa al titular antes de empezarlas.

| ID | Alcance | Depende de | Aceptación |
|---|---|---|---|
| FLX-01 | **Bandeja y documentos sin operación** — terminada y aprobada por el titular el 15/11/2026; detalle en el [historial, §30](docs/erp-crm/historial-del-plan.md). | LV-09 | — |
| FLX-02 | **Crear cualquier documento desde cualquier lado:** «Crear documento» en persona, inmueble y asunto; se retiran los candados de pantalla. Absorbe FCH-02 (los documentos se llenan con lo que saben la persona y el inmueble; el PDF emitido no cambia solo, RP-76) y HER-04 (un trabajo suelto pasa a un asunto con sus datos). | FLX-01 | Crear el levantamiento sin entrevista; los formatos conservan versiones y PDF inmutables. **Hecho en la rama el 15/11/2026, falta la revisión del titular:** «Crear documento» en asunto, persona e inmueble; los candados de pantalla pasaron a avisos; «Pasar a un asunto» para los documentos sueltos. Sin cambios en la API ni en la base. |
| FLX-03 | **De frenos a avisos y de metodología a guías:** guías como datos (venta, renta, compra, búsqueda de renta, inspección, opinión de valor, cancelación de hipoteca); asunto libre con título, objetivo y las guías que se elijan o ninguna, con el riel de las etapas de su guía, o sin riel si no lleva ninguna (DEC-55); varias guías en un mismo asunto, una tras otra; «Nuevo asunto» desde la Bandeja con los documentos soltados (DEC-54); disparadores nuevos que avisan y anotan en lugar de rechazar, con el mismo cambio en TypeScript (RP-100). Absorbe MOT-01 a MOT-04 (las guías como listas editables sustituyen al motor con editor; procesos base y módulos del 17/10/2026 en el historial, §28.3), FCH-04 (descargar con faltantes; ningún campo vacío detiene, RP-77 y RP-82) y DOC-15 (listas de documentos por situación como guías). **Riel por tipo de asunto (DEC-55):** cada guía trae sus etapas y el riel dibuja esas; el tipo se elige al abrir el asunto y se puede cambiar (lo hecho se conserva y queda en el historial); con varias guías, el riel muestra la que va; el tablero de Asuntos se agrupa por urgencia (vencido, esta semana, más adelante, sin fecha) y la etapa se ve dentro de cada asunto (titular, 15/11/2026). | FLX-02 | Publicar sin intermediación firmada deja aviso en el historial; los dos PDF del terreno de un colega abren un asunto con folio desde la Bandeja y después se le ligan el inmueble y las personas; un asunto encadena cancelación de hipoteca y crédito Infonavit; un asunto libre sin guía avanza sin riel; las pruebas que hoy dicen «rechaza» pasan a «permite y anota», sin borrarse; una operación existente conserva etapa, documentos y formatos; una inspección o un trámite muestran su propio riel, y la venta y la renta conservan sus diez etapas. |
| FLX-04 | **Perfiles completos y listas:** persona con folio y vista agregada; papeles por asunto; compradores y arrendatarios como clientes (RP-93); prospectos del formulario sin duplicarse. Absorbe REL-01 (persona con varios papeles, representantes y varios propietarios), CRM-01 (la condición de cliente sale del contrato firmado), CRM-03 (línea de tiempo con filtros por tipo), OPS-01 (el asunto como centro de trabajo), CAP-03 (lo ya respondido se confirma; preguntas por momento, historial §28.3), FCH-01 (datos de la persona y del inmueble en un solo lugar, con origen y estado por dato), FCH-07 (archivo por documento pedido) y FCH-11 (el valor concluido queda en el inmueble). | FLX-03 | Un comprador que firma pasa a cliente y conserva su historial; listas con filtros. |
| FLX-05 | **Vencimientos y coincidencias:** vigencia por documento y fechas de contratos en Hoy; coincidencias entre búsquedas e inmuebles. Absorbe EXT-01 (coincidencias explicables en los dos sentidos) y DOC-13 (vencimientos por fecha y responsable). | FLX-04 | Un arrendamiento por terminar aparece en Hoy como llamada; un inmueble nuevo muestra quién buscaba algo así. |
| FLX-07 | **La Bandeja recomienda a dónde va cada documento (RP-103):** al soltar un documento, el sistema lo lee (la lectura de IA-01) y busca a qué inmueble, persona o asunto corresponde por lo que el documento dice: dirección, clave catastral, folio real, nombres, RFC o CURP. Muestra la recomendación con el dato que la sostiene; se confirma con un clic o se deja sin ligar. Si no encuentra nada, propone crear el inmueble, la persona o el asunto con lo leído, y también eso espera el clic. Sin lectura disponible, la Bandeja sigue funcionando a mano como en FLX-01. Se construye después de FLX-04, cuando existen los asuntos y los perfiles completos contra los cuales comparar; puede ir en paralelo con FLX-05. Absorbe DOC-11 (soltar varios archivos y que se proponga a dónde van; ninguno queda revisado por cargarse). | FLX-04, IA-01 | **Ejemplo del titular:** se suelta el avalúo de un terreno que ya está registrado y la Bandeja recomienda ese inmueble, mostrando el dato con que lo reconoció (por ejemplo, la clave catastral); un clic lo liga. Además: el avalúo de un terreno que no existe propone «Crear inmueble» con dirección y superficie ya llenas, y no se crea nada sin confirmar; «Dejar sin ligar» lo deja en la Bandeja; una prueba comprueba que, sin el clic, el servidor no liga ni crea nada (RP-44, RP-62). Con documentos de clientes reales, la lectura espera el visto bueno del abogado (PRV-01); mientras la base tenga solo datos de prueba (DEC-10) se ensaya con documentos ficticios. |
| FLX-08 | **Guías para asuntos jurídicos y de obra (DEC-54):** sucesión o adjudicación; recuperación de inmueble invadido; juicio de desahucio; seguimiento de juicio (expediente, juzgado, abogado, audiencias y plazos en la Agenda); rehabilitación con presupuesto; crédito Infonavit del comprador. Cada guía sugiere pasos y documentos, nunca frena (RP-100). | FLX-03 | Los casos del titular (sucesión con inmueble invadido, desahucio con rehabilitación y venta, cesión de derechos litigiosos en sentencia) se abren y avanzan con su guía; los pasos se verifican con fuente oficial vigente; las guías jurídicas esperan el visto bueno del abogado antes de usarse con clientes reales. |
| FLX-09 | **Gastos de cada asunto (DEC-54):** cada gasto con concepto, monto, fecha, quién lo paga y su comprobante privado; total por asunto y por quien paga. | FLX-03 | En el asunto de desahucio, los gastos que cubre el comprador a plazos se suman aparte y cada uno lleva su comprobante; nada de esto sale en el sitio público. |
| FLX-06 | **Cierre:** manual, registro de privacidad (documentos de compradores y arrendatarios), revisión con crítico en contexto limpio y propuesta de verificación completa. Absorbe COR-26 (manual con capturas actuales; la prueba de uso es USO-02). | FLX-05, FLX-07, FLX-08, FLX-09 | Documentos al día; PRV-01 actualizado para el abogado. |

**Lista aprobada de FLX-03 (titular, 15/11/2026).** Es la lista de lo que hoy frena en el panel y en la base, y en qué se convierte. Un aviso se muestra en la operación y en Hoy, y queda anotado en el historial con la fecha, quién siguió adelante y, si lo escribe, el motivo. El cambio se hace igual en TypeScript y en la base.

*Pasan a aviso:*

1. Requisitos de la etapa sin revisar.
2. Observaciones abiertas.
3. Contrato de intermediación sin firma, incompleto, sin revisión del director o terminado.
4. Decisión de tomar el encargo sin registrar, o una aceptación condicionada que no permite la etapa.
5. Inmueble sin ligar antes de negociar.
6. Contraparte sin identificar.
7. Próxima tarea con fecha y responsable (DEC-42).
8. Candado de arranque: entrevista sin terminar (FLUJO-04a).
9. Operación pausada o descartada.
10. Archivar con tareas pendientes o sin marcar quién captó y quién vendió.
11. Publicar sin lo de comercialización o sin estar en esa etapa.
12. Identificación LFPIORPI.
13. Firma y pagos pendientes al entregar.
14. Operación de la contraparte sin revisar antes del cierre.
15. Firmar una venta con hipoteca sin la cancelación inscrita (el freno de la firma de TRA-01).
16. Publicar un inmueble compartido sin la autorización escrita de la otra inmobiliaria (RP-95).
17. Enseñar un inmueble antes de la firma sin la carta del propietario (DEC-41).
18. Saltar etapas: se puede pasar a cualquier etapa, con aviso de lo que quedó atrás (antes se avanzaba de una en una).
19. La promesa (15) se descarga en PDF aunque esté incompleta, marcada como incompleta.
20. Las revisiones del director dejan de detener: se muestra «Falta que el director lo revise».
21. Las excepciones del director ya no hacen falta: se sigue con el aviso y el motivo.

*Se quedan:*

- **Permisos:** solo el director publica, marca sus revisiones, decide tomar el encargo, reasigna y da de alta un inmueble heredado (DEC-43).
- **Privacidad:** la dirección exacta no sale en el sitio y un inmueble en evaluación queda privado.
- **Sitio:** no se publica un inmueble sin galería.
- **Documentos:** el 01 no se descarga incompleto. El PDF del 09 se emite desde el 12/11/2026 por decisión del titular (COR-12); su texto va al abogado en el paquete de revisión.
- **Integridad:** el aviso de versión (409), los registros ajenos, la sesión, las validaciones de cada campo y la revisión del contacto que coincide con otro.

Las pruebas que hoy dicen «rechaza» pasan a «permite y anota», sin borrarse.

**Estado (15/11/2026, en `feat/integracion`, falta la revisión del titular).** La parte A (migración `20261115200000_nada_frena_solo_avisa.sql`) convierte en aviso los puntos 1 a 12 y 14 a 19: se guarda igual y queda una línea «Aviso» en el historial con lo que faltaba y quién siguió; «Pasar a», «Guardar y publicar» y «Cerrar el paso» piden confirmar una vez, con la lista de lo que falta. La parte B (migración `20261115210000_guias_por_tipo.sql`) agrega las guías de inspección, opinión de valor y cancelación de hipoteca con su riel, el cambio de tipo, empezar en cualquier etapa y los avisos en Hoy. Asuntos se agrupa por urgencia (`?urgencia=`) y la etapa se ve dentro de cada asunto. Los puntos 13 y 20 no aparecen en el registro de las partes A y B: se revisan con la parte C. Las migraciones se aplican solas al integrar en `main`. Registro completo en el historial, §31.2.

Mientras FLX-03 no esté integrada en `main` siguen los frenos actuales en el sitio publicado. Las entregas que absorbe cada etapa están anotadas en su fila (poda del 14/11/2026; textos anteriores en el historial, §28).

## Cómo se trabaja

- **Quién decide:** Moisés Núñez Tonalá decide y acepta. El agente de desarrollo construye cada entrega en la rama autorizada; una prueba automática no es la aceptación del titular. Lo jurídico, fiscal o contable espera al profesional que designe Fortius (R-03). El piloto es el equipo de Fortius (PIL-01), con datos de prueba hasta que el titular autorice los reales.
- **Una entrega a la vez:** leer la entrega y sus dependencias, comprobar qué ya existe, escribir primero la prueba que reproduce el caso, hacer el cambio más chico que cumpla y repetir las comprobaciones afectadas. Una en construcción y otra en revisión como máximo; sin fechas firmes. Ante cada módulo nuevo se revisan fuente de verdad, permisos, migraciones, respaldo y métricas.
- **Lo que vaya haciendo falta:** se anota con un ejemplo, a quién afecta y la entrega relacionada. Un defecto o una dependencia técnica entra a su entrega; una capacidad nueva lleva costo, beneficio, alternativa simple y aceptación, y el titular decide si entra y qué desplaza. Lo jurídico o de negocio no se resuelve por inferencia.
- **Al publicar** (Moisés, 13/10/2026): en «Dónde nos quedamos» se anotan fecha, alcance real, PR, commit, migraciones, comprobaciones y límites; al cerrar la entrega pasa al historial. Hacer push no es publicar.
- **Antes de diseñar** una pantalla se leen las reglas de `SPEC.md`. Si el titular aprueba algo que choca con una regla, la regla se reescribe y se anota en «Reglas reemplazadas».
- **Un solo plan:** no se crean otros planes, bitácoras ni archivos de seguimiento. La evidencia voluminosa y las capturas van fuera del repositorio; credenciales y copias privadas, nunca en git.

El texto completo de estas reglas de trabajo, antes de juntarlas, está en el historial, §31.5.

## Backlog base: entregas y pruebas

Prioridad P0 = continuidad/protección; P1 = núcleo diario; P2 = completar producto; P3 = extensión condicionada. **I** indispensable, **C** conveniente, **O** opcional. Estimaciones por entrega son esfuerzo bruto orientativo; la fase ya contempla su combinación.

### Fase 0 — continuidad

| ID / clase | Entrega / problema | Archivos o ámbito | Dependencias / esfuerzo | Aceptación verificable |
|---|---|---|---|---|
| REC-01 P0/I | Recuperación completa y objetivos RPO/RTO | backup/export/restore-current, `docs/fortius-inmuebles-backup-restore.md`, Auth y Storage | DEC-06/10; 2–4d más acceso | Snapshot aislado consistente, archivos/hashes/referencias reconciliados; tiempos medidos; incluir qué NO se pudo restaurar. |
| AUT-01 P0/I | Recuperación/invitación y MFA acordados | `backend/auth.ts`, Auth config, pantalla de acceso | DEC-03/10; 1–3d | Cuenta de prueba recibe y completa flujo; recuperación de segundo factor ensayada antes de exigirlo. |
| OBS-01 P1/I | Detectar y seguir incidentes sin PII | `backend/http.ts`, health, configuración de logs | BAS-01, DEC-10; 1–2d | 5xx controlado correlacionado por requestId; alerta/retención comprobadas; no cuerpo/secretos en logs. |
| ENV-01 P0/I | Confirmar aislamiento y retirar ambigüedades de despliegue | ámbitos Vercel, Supabase, proyecto antiguo | DEC-09/10; 1–2d | Preview usa datos/credenciales acordados; no retirar proyecto antiguo antes de comprobar dominios/Auth/tráfico. |
| PRV-01 P0/I | Clasificación, minimización, retención y gestión de solicitudes de privacidad | contratos/documentos/Storage, políticas operativas y avisos existentes | DEC-06, revisión jurídica; 2–4d | Matriz de datos/finalidad/acceso/plazo aprobada; exportación/corrección/disposición autorizadas sin romper trazabilidad ni obligaciones de conservación. Verificar normas vigentes y aplicabilidad, no inferir cumplimiento. |

### Fase 1 — núcleo operativo

| ID / clase | Entrega / problema | Archivos o ámbito | Dependencias / esfuerzo | Aceptación verificable |
|---|---|---|---|---|
| SEG-01 P0/I | Matriz de capacidades por función y por registro | identity nuevo, auth, staff, RLS y Storage | DEC-03, FLX-04; 3–5d | Dos asesores, administrador y capacidad especializada probados en API/DB; reasignación elimina acceso indebido. **Decisiones del titular (15/11/2026, DEC-56):** al arranque solo director y asesor; de una persona que atiende otro asesor se ve que existe y quién la atiende, sin sus datos; un documento suelto de la Bandeja lo ven quien lo subió y el director; los dos pasos para asesores se deciden más adelante. El resto ya estaba decidido el 17/10/2026 (cuestionario, F-01 a F-09 y L-04). |
| USR-01 P1/I | Administrar cuentas del equipo desde el panel | nueva vista/API de personal, perfil asesor y adviser-accounts | SEG-01/AUT-01; 3–5d | Invitar, vincular y desactivar personal con trazabilidad; perfil público separado de cuenta; evitar dejar cero administradores activos; no pedir ni mostrar contraseña del usuario. **Flujo pedido por el titular (17/10/2026, J-01):** en Equipo, el administrador captura nombre completo, celular, correo y rol (con sus permisos), registra el convenio de confidencialidad y envía la invitación por correo. La persona abre el enlace, crea su usuario y contraseña, responde un captcha (Cloudflare Turnstile) y confirma su celular con un código por SMS (proveedor de pago conectado a Supabase); si no se puede, con una app de códigos. Al entrar por primera vez, el panel le da la bienvenida y lo guía a subir su foto y escribir su biografía, que edita él mismo. Las invitaciones salen por un servicio de correo propio, no por el correo de prueba de Supabase. Es condición para las pruebas de uso (USO-01). |
| PUB-01 P1/I | Inventario interno separado de publicación; captación web conectada | property-form, public.ts, `/api/public/leads`, layout config | SEG-01, FLX-04; 2–4d | Alta no publica; datos privados no aparecen en web/PDF; formulario sintético llega al CRM si se autoriza activar captación. Demo se conserva. |
| DAT-01 P1/I | Revisar datos heredados e importaciones/exportaciones permitidas | validadores/domain, utilidades de importación y reporte de simulación | FLX-04/SEG-01/PRV-01; 2–4d | Simulación sin escrituras detecta referencias ambiguas, duplicados y errores; usuario decide fusiones; ejecución idempotente y export restringido. Nunca importar ejemplos como actividad real. |
| CRM-02 P1/I | Registro rápido de contacto, siguiente paso obligatorio, plantillas de mensaje y reloj de primera atención (RP-21 a RP-23) | contactos, fichas, followups, tareas | FLX-04; 3–5d | Registrar un contacto en dos toques; sin siguiente paso pide fecha o motivo. La plantilla abre WhatsApp o correo y el envío no se registra hasta que el asesor lo confirma. El reloj usa la definición de «Primera atención». |
| INV-01 P1/C | Salud del inmueble, alertas de precio e historial de precio (RP-28) | propiedades, historial de cambios, eventos, ofertas, Comparables | PUB-01; 2–4d | Indicadores con fuente; umbrales ajustables en Configuración; historial de precio con autor, fecha y motivo; la alerta abre Comparables con el inmueble. |
| DAT-02 P1/I | Calidad de captura: validaciones, catálogo de colonias, montos con moneda y fusión asistida (RP-40 a RP-43) | validadores, formularios, catálogo SEPOMEX con fecha de corte, personas | FLX-04, DAT-01; 3–6d | Mensajes de validación claros; catálogo con fecha de corte y «otra» marcada; fusión campo por campo con historial y deshacer, nunca automática. |

### Fase 2 — operación de venta y revisiones

| ID / clase | Entrega / problema | Archivos o ámbito | Dependencias / esfuerzo | Aceptación verificable |
|---|---|---|---|---|
| COM-01 P1/I | Conectar cartera/oportunidad/expediente sin duplicar hechos | comercial server/types, operación y vínculos SQL | FLX-04, DEC-05/09; 3–5d | Reconciliar vínculos por ID; las ponderaciones de la cartera no se presentan como probabilidad (el pronóstico por etapa es FIN-03); libro emitido histórico intacto. |
| VIS-01 P1/I | Visita con resultado, asistencia, autorización y próxima acción; captura desde el celular (RP-25) | calendario/eventos, formato 13, operación, informe al propietario | FLX-04; 2–4d | Visita programada distinta de realizada/cancelada; llegada, opinión del comprador y foto en menos de un minuto; alimenta el informe al propietario; no contar doble al corregir; acceso y seguimiento correctos. |
| OFE-01 P1/I | Ofertas/contraofertas como línea de tiempo, vigencia y respuesta autorizada (RP-26) | formato 14/oferta, operación, historial | COM-01, VIS-01; 3–5d | Versiones, vencimiento de cada oferta y diferencia contra el precio de salida; respuesta del propietario identificada; acuerdo comercial no se presenta como contrato firmado. |
| DOC-01 P1/I | Unificar fuente documental/revisión/emisión/copia firmada | formatos catalog/server/API, assets, snapshots | FLX-04, SEG-01; 3–6d | Hash/versión verificables; cambio invalida revisión afectada; firma capturada no equivale a firma electrónica. |
| LEG-01 P1/I | Requisitos, hallazgos, excepciones y conclusión profesional por etapa | juridica, formato 05/06, transitions propuesto | DOC-01, DEC-05, revisión jurídica; 3–5d | Recibido/revisado separados; una casilla vacía avisa y queda anotada (RP-100), no se da por revisada; excepción tiene autor, fundamento y fecha. Modelo 09 sigue bloqueado hasta cotejo externo requerido. |
| TEC-01 P1/I | Levantamientos y discrepancias con fuente/fecha/evidencia | levantamiento y variantes 04, assets, property facts | DOC-01; 3–5d | Superficies no se mezclan ni suman indebidamente; medición, declaración y dato documental diferenciados; foto vinculada. |
| CAP-02 y CAP-04 P1/I | Aviso de privacidad con un toque, cierre de la entrevista y modo cita (F03, F08, F09); CAP-01 pasó a FLX-01 y CAP-03 a FLX-04 | ver «Proceso, captura y documentos» | dependencias en su tabla; 1–3d por entrega | Aceptación en su tabla. |
| FCH-05, FCH-08 a FCH-10 P1/I | Captura al lado del documento, dictamen con párrafos, copia firmada como paso final y plantillas Word propias (F15, F20, F21, F23); FCH-01, FCH-02, FCH-04, FCH-07 y FCH-11 pasaron a FLX | ver «Proceso, captura y documentos» | dependencias en su tabla; 1–5d por entrega | Aceptación en su tabla. |
| CIE-01 P1/I | Condiciones, formalización, entrega, pendientes y archivo | formatos 15/16/17, operación, transiciones | OFE-01/LEG-01/TEC-01; 3–5d | Cierre comercial/documental/cobro distintos; entrega con evidencia; poscierre pendiente no desaparece por cerrar. |
| DOC-10 P1/C | Revisión lado a lado (RP-35) | operación guiada, visor de PDF e imagen, panel «Marcar como revisado» | DOC-01; 2–4d | En computadora se ve el documento y se captura la revisión sin cambiar de pantalla; en celular se alterna sin perder la captura. |
| DOC-12 P2/C | Pedir un documento al cliente por liga segura (RP-37) | ruta pública acotada, Storage privado, requisitos | DOC-01, SEG-01, PRV-01; 3–5d | Liga con vencimiento y revocable que solo permite subir a ese requisito; lo recibido queda «Lo tengo»; la liga no da acceso a ningún otro dato. |
| FIR-01 P1/C | **Firma electrónica propia, sin proveedor de pago** (titular, 17/10/2026): liga personal enviada por WhatsApp o correo; el firmante ve el contrato completo, confirma su identidad con un código enviado a su correo o teléfono y firma con el dedo o escribiendo su nombre; el sistema guarda fecha y hora, código verificado, dirección de conexión y huella SHA-256 del PDF, y agrega al PDF una hoja de evidencia. La firma así registrada cumple la prueba de RP-97. Uso previsto: intermediación y acuse del aviso; promesa y arrendamiento si el abogado lo confirma; nunca la compraventa definitiva, que va ante notario. La constancia NOM-151 queda opcional. | ruta pública acotada, Storage privado, formatos, firma registrada (COR-10) | COR-10, DOC-01, PRV-01, DEC-30; 4–6d | Un firmante sin el código no puede firmar; cualquier cambio al PDF después de firmar se detecta con la huella; la hoja de evidencia acompaña al PDF; la liga vence y se puede revocar. |

### Fase 3 — finanzas y tableros

| ID / clase | Entrega / problema | Archivos o ámbito | Dependencias / esfuerzo | Aceptación verificable |
|---|---|---|---|---|
| FIN-01 P1/I | Registro de hechos financieros por operación y empresa | operational-finance nuevo, SQL, evidencias privadas | DEC-07, FLX-04/DOC-01/SEG-01; 4–7d | Estimado/pactado/facturado/cobrado separados; obligación/pago parcial/anulación identificados; importes decimales y monedas conservados. |
| FIN-02 P1/I | Egresos, presupuestos, honorarios y repartos revisables | operational-finance, formatos 08/18/19, comercial | FIN-01 y revisión fiscal; 3–6d | No duplicar pagos/directos; no reconocer honorario por cierre sin regla; periodos/TC fuente; sin custodia ni banco automático. |
| TAB-01 P1/I | Contrato común de métricas, filtros y desglose | analytics nuevo; reportes/admin | SEG-01/FLX-04 y definiciones aprobadas; 2–4d | Total = registros detallados autorizados, fecha/corte/fuente/pendientes; demo excluido del operativo por defecto pero visible. Contrato se puede preparar antes de finanzas; cada widget espera su propia fuente. |
| TAB-02 P1/I | Comercial accionable | dashboard/Today/reportes, analytics | FLX-04/COM-01/VIS-01/TAB-01; 2–4d | Cohortes y primera atención explícitas; venta no equivale a conversión de lead; pendientes enlazan acción. |
| TAB-03 P1/I | Financiero por operación, moneda y periodo | nueva vista financiera, analytics | FIN-02/TAB-01; 3–5d | Cobros conciliados vs potencial; no sumar monedas sin conversión válida; detalle y export reconciliados. |
| TAB-04 P1/I | Jurídico y técnico con pendientes por responsable | nuevas vistas y queries | LEG-01/TEC-01/TAB-01; 3–5d | Estados derivados de revisión explícita; sin dictamen automático; hallazgo lleva a su evidencia. |
| FIN-03 P2/C | Pronóstico de ingresos por mes (RP-30) | analytics, operaciones, configuración de etapas | FIN-01, DEC-17; 2–3d | Rotulado «Estimación»; probabilidades por etapa ajustables en Configuración; nunca se suma a lo cobrado. |
| APR-01 P1/I | Aprobaciones con bandeja (RP-31) | solicitud de aprobación, bandeja «Para ti», comisiones y requisitos protegidos | SEG-01, FIN-02, UX-05; 3–5d | Solicitud con motivo; aprobador según rol; constancia del resultado; el servidor no aplica la acción antes de aprobarse. |
| TAB-05 P2/C | Metas por asesor y tableros por rol (RP-33, RP-34) | metas por periodo, TAB-02 | TAB-01, DEC-17; 2–3d | Metas por asesor y periodo; avance calculado desde registros; comparación con el periodo anterior y con la meta; tiempo promedio por etapa e inventario envejecido con desglose. |
| FIS-01 P1/I | Reglas fiscales y notariales con vigencia, por municipio donde opera Fortius (RP-06) | catálogo de reglas, calculadoras, neto del propietario, costos de cierre | Revisión fiscal (R-03); 3–5d | Cada regla con municipio, vigencia, fuente y responsable; sin regla vigente el cálculo dice «pendiente»; cambiar una regla no altera documentos ya emitidos. |

### Fases 4–5 — interfaz, escala y adopción

| ID / clase | Entrega / problema | Archivos o ámbito | Dependencias / esfuerzo | Aceptación verificable |
|---|---|---|---|---|
| UX-02 P1/C | Búsqueda, vistas y preferencias guardadas en el servidor por usuario (RP-14); sin tablero personal armable (RP-66) | workspace/search/preferences, migración aditiva de preferencias | LV-09; 2–4d (la búsqueda en servidor a escala llega con PAG-01) | Filtra en servidor; densidad, columnas y vistas siguen al usuario entre equipos; el navegador solo guarda comodidades del dispositivo; orden accesible; una preferencia no altera permisos ni muestra widgets prohibidos. |
| UX-03 P1/C | Velocidad: barra de comandos, atajos, acciones masivas, edición en tabla, densidad y columnas (RP-09 a RP-13) | workspace/search, listas, kit | LV-09; 4–7d | Ctrl/Cmd+K busca y actúa solo con lo permitido; atajos documentados y desactivables, sin actuar dentro de campos; acciones masivas informan por registro y no duplican al reintentar; edición en tabla con control de versión; probado con teclado y lector de pantalla. |
| UX-04 P1/I | Confianza al guardar: estado de guardado, deshacer, conflicto lado a lado, siluetas y sesión vencida (RP-15 a RP-19) | kit, store, formularios | LV-09; 3–5d | Nunca «Guardado» antes de la confirmación del servidor; «Deshacer» solo donde el servidor restaura; conflicto campo por campo sin sobrescribir; sesión vencida conserva la captura. |
| NAV-01, NAV-03 a NAV-10, NAV-12, NAV-14 P1/C | Navegación y productividad: las mejoras N01–N25 aprobadas el 17/10/2026 (RP-58 a RP-69), salvo N20 (archivada) y las ya construidas | ver la sección «Navegación y productividad (NAV)» | dependencias por entrega en su tabla; 1–4d por entrega | La aceptación de cada entrega está en su tabla; NAV-12 lleva migración y NAV-14 espera PWA-03. |
| LV-03 P1/C | Animaciones pequeñas que confirman (V06, RP-73) | ver la sección «Lenguaje visual (LV)» | LV-02, UX-04; 1–2d | Aceptación en su tabla; sin dependencias nuevas. |
| PWA-01 P1/I | Instalación y apertura del panel | manifiesto específico admin/layout/iconos | AUT-01/LV-09; 2–4d | Identidad/start_url/scope probados; inicia admin; acceso normal tras actualización; matriz real iOS/Android/iPad/Windows/macOS. |
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
| SAAS-03 P2/O | Adaptar por empresa los procesos del motor (RP-04) | motor de procesos (MOT), configuración por empresa | SAAS-01, FLX-03; por estimar | Cada empresa parte de los procesos de Fortius como plantilla y los ajusta sin afectar a otras; el resto lo cubre MOT. |
| SAAS-05 P2/O | Alta guiada de empresa e importación (RP-07) | asistente de alta, DAT-01, USR-01, SAAS-02/03 | SAAS-01 a SAAS-03, DAT-01, USR-01; por estimar | Una empresa sintética queda operando sin intervención técnica; la importación se simula y se revisa antes de escribir. |
| SAAS-06 P3/O | Planes, suscripción y límites (RP-08) | cobro, límites de usuarios y almacenamiento | SAAS-01, DEC-18; por estimar | Límites visibles con aviso previo; sin pago, solo lectura con exportación disponible; nunca se borran datos. |
| PIL-02 P2/O | Piloto con 2 o 3 inmobiliarias externas (RP-46) | empresas piloto con datos separados, guía de pruebas | SAAS-01 a SAAS-03, SAAS-05, PIL-01, REC-01, OBS-01; por estimar | Recorridos aceptados por cada empresa; tiempos medidos contra metas fijadas antes; incidencias priorizadas y cerradas antes de vender. |

## Estado y dependencias de cada entrega

**Revisada contra git el 11/11/2026 y contra el código el 14/11/2026** (revisor independiente: entregas en `main`, parciales y una muestra de pendientes). Estados:

- **terminada:** en `main` y aceptada por el titular.
- **en_main:** construida, integrada en `main` con Verify aprobado; falta que el titular la revise y la dé por terminada, o comprobarla en producción.
- **en_local:** construida en la carpeta de trabajo, sin commit.
- **en_integracion:** construida y con commit en `feat/integracion`, todavía sin publicar en `main`.
- **parcial:** una parte está en `main`; la columna dice qué falta.
- **en_curso:** una sesión la está construyendo; la columna dice cuál y en qué rama.
- **en_revision** y **bloqueada:** se conservan para las entregas de continuidad (bloque 0), que esperan evidencia o accesos externos.
- **en_curso**, **pendiente** y **en_pausa:** como siempre.

Las migraciones de las entregas en `main` viajan con `main`; su aplicación en la base remota no se comprobó en esta revisión. La base solo tiene datos de prueba (DEC-10).

**Todas las entregas tienen lugar en el «Orden vigente»** desde la poda del 14/11/2026.

Las filas retiradas (en `main`, terminadas o podadas) están en el historial: §19, §21, §22, §28.6 y §31.6.

| ID | Fase | Estado registrado | Depende de |
|---|---|---|---|
| REC-01 | 0 | en_revision | BAS-01 |
| AUT-01 | 0 | en_revision | BAS-01 (aceptada el 13/11/2026) |
| OBS-01 | 0 | en_revision | BAS-01 |
| ENV-01 | 0 | en_revision | BAS-01 (aceptada el 13/11/2026) |
| PRV-01 | 0 | en_revision | BAS-01 |
| SEG-01 | 1 | pendiente | FLX-04 |
| USR-01 | 1 | pendiente | SEG-01, AUT-01 |
| PUB-01 | 1 | parcial | SEG-01, FLX-04 |
| DAT-01 | 1 | pendiente | FLX-04, SEG-01, PRV-01 |
| COM-01 | 2 | pendiente | FLX-04 |
| VIS-01 | 2 | pendiente | FLX-04 |
| OFE-01 | 2 | pendiente | COM-01, VIS-01 |
| DOC-01 | 2 | parcial | FLX-04, SEG-01 |
| LEG-01 | 2 | pendiente | DOC-01 |
| TEC-01 | 2 | pendiente | DOC-01 |
| CIE-01 | 2 | pendiente | OFE-01, LEG-01, TEC-01 |
| FIN-01 | 3 | pendiente | FLX-04, DOC-01, SEG-01 |
| FIN-02 | 3 | pendiente | FIN-01 |
| TAB-01 | 3 | pendiente | SEG-01, FLX-04 |
| TAB-02 | 3 | pendiente | FLX-04, COM-01, VIS-01, TAB-01 |
| TAB-03 | 3 | pendiente | FIN-02, TAB-01 |
| TAB-04 | 3 | pendiente | LEG-01, TEC-01, TAB-01 |
| UX-02 | 4 | parcial | vista de Operaciones, filas o tarjetas de Inmuebles y vistas guardadas del inventario se guardan en el servidor por usuario (24fffb5, `feat/integracion`, 13/11/2026); faltan densidad, letra, fijados, recientes y secciones de Hoy (con NAV-01 y NAV-05), el tema (ThemeToggle sigue en el navegador) y filtrar en el servidor (PAG-01); en `main` con el PR #75; «recientes» ya se guardan en el servidor; revisado contra el código el 14/11/2026 |
| PWA-01 | 4 | pendiente | AUT-01, LV-09 |
| PWA-02 | 4 | pendiente | PWA-01 |
| PWA-03 | 4 | pendiente | PWA-01, SEG-01, PRV-01 |
| PAG-01 | 5 | pendiente | SEG-01 |
| ESC-01 | 5 | pendiente | PAG-01, FIN-01 |
| PIL-01 | 5 | pendiente | REC-01, CI-01, ENV-01, PRV-01, USR-01, DAT-01, CIE-01, TAB-02, TAB-03, TAB-04, PWA-01, PAG-01 |
| EXT-02 | 6 | pendiente | FIN-02, CIE-01, LEG-01 |
| EXT-03 | 6 | pendiente | FLX-04, FIN-01 |
| EXT-04 | 6 | pendiente | FLX-04, PRV-01 |
| EXT-05 | 6 | pendiente | FIN-02, DOC-01, PRV-01 |
| EXT-06 | 6 | pendiente | DOC-01, LEG-01, PRV-01 |
| EXT-07 | 6 | pendiente | ESC-01 |
| EXT-08 | 6 | pendiente | FIN-02, TAB-01, FLX-04, SEG-01 |
| EXT-09 | 6 | pendiente | FLX-04, TEC-01, VIS-01, SEG-01 |
| EXT-10 | 6 | pendiente | FLX-04, DOC-01, SEG-01, AUT-01, PRV-01 |
| CRM-02 | 1 | parcial | FLX-04; en `main` (6dc3a0d): registro en dos toques con siguiente paso, mensajes listos y reloj de primera atención; falta comprobar el resto de su aceptación; revisado contra el código el 14/11/2026 |
| INV-01 | 1 | pendiente | PUB-01 |
| DAT-02 | 1 | parcial | FLX-04, DAT-01; catálogo de colonias con fecha de descarga (vía CSR-03); falta la fusión asistida; revisado contra el código el 14/11/2026 |
| DOC-10 | 2 | pendiente | DOC-01 |
| DOC-12 | 2 | pendiente | DOC-01, SEG-01, PRV-01 |
| FIN-03 | 3 | pendiente | FIN-01, DEC-17 |
| APR-01 | 3 | pendiente | SEG-01, FIN-02, UX-05 |
| TAB-05 | 3 | pendiente | TAB-01, DEC-17 |
| FIS-01 | 3 | pendiente | BAS-01; revisión fiscal |
| NAV-01 | 4 | pendiente | UX-02; el titular confirmó el 14/11/2026 que el menú lateral nuevo lleva botón para recogerlo y «Fijados» |
| NAV-03 | 4 | parcial | LV-09; vista previa solo en Contactos; faltan Operaciones e Inmuebles; revisado contra el código el 14/11/2026 |
| NAV-04 | 4 | pendiente | UX-02, SEG-01 |
| NAV-05 | 4 | pendiente | UX-02 |
| NAV-06 | 4 | pendiente | CRM-02 |
| NAV-07 | 4 | pendiente | UX-04 |
| NAV-08 | 4 | pendiente | DOC-10, SEG-01 |
| NAV-09 | 4 | pendiente | CRM-02 |
| NAV-10 | 4 | pendiente | FLX-07, PUB-01 |
| NAV-12 | 4 | pendiente | Migración autorizada, PRV-01 |
| NAV-14 | 4 | pendiente | PWA-03 |
| LV-03 | 4 | pendiente | LV-02, UX-04 |
| FIR-01 | 6 | pendiente | COR-10, DOC-01, PRV-01, DEC-30 |
| CAP-02 | 1 | pendiente | CRM-02 |
| CAP-04 | 1 | pendiente | FLX-04, CRM-02 |
| FCH-05 | 2 | pendiente | FLX-04, DOC-10 |
| FCH-08 | 2 | pendiente | DOC-06 |
| FCH-09 | 2 | parcial | LV-02; copia firmada registrada solo para la intermediación 09/21 (bbef89d); revisado contra el código el 14/11/2026 |
| FCH-10 | 2 | pendiente | FLX-04 |
| UX-03 | 4 | parcial | barra de comandos Ctrl/⌘K que busca y actúa según el rol, «Recientes» (NAV-02) por usuario y atajos «/» y «?» desactivables (6a07d62, `feat/integracion`, 13/11/2026); acciones masivas con resultado por registro y «Reintentar» (RP-12) y edición en la fila con control de versión (RP-13) en Tareas y Contactos, con boceto aprobado por el titular (b41ae84); exportar contactos solo el administrador y CSV sin fórmulas; el director reasigna operaciones desde la lista con motivo (M-04, deb2326); en `main` con el PR #75; revisado contra el código el 14/11/2026 |
| UX-04 | 4 | parcial | en `feat/integracion` (13/11/2026): sesión vencida sin perder lo capturado y aviso sin conexión (RP-19, RP-15; aa852a1) y conflicto de versión campo por campo en tareas, inmuebles, prospectos, clientes, citas, notas y posts (RP-17; bffbdbf); siluetas de carga (RP-18; 7d3dfe6) y «Deshacer» al completar una tarea, solo tras confirmar el servidor (RP-16; aa98fba); falta el conflicto en operaciones y formatos; la reversión optimista con motivo (RP-18) no aplica mientras el panel no tenga cambios optimistas; en `main` con el PR #75; revisado contra el código el 14/11/2026 |
| FLX-01 | 4 | hecho | aprobada por el titular el 15/11/2026; historial §30 |
| FLX-02 | 4 | en_curso | hecha en `feat/integracion` el 15/11/2026; falta la revisión del titular |
| FLX-03 | 4 | en_curso (A y B en `feat/integracion`; falta C) | FLX-02; coordina con Metodología |
| FLX-04 | 4 | pendiente | FLX-03 |
| FLX-05 | 5 | pendiente | FLX-04 |
| FLX-07 | 5 | pendiente | FLX-04, IA-01; con clientes reales, PRV-01 |
| FLX-08 | 5 | pendiente | FLX-03; abogado para las guías jurídicas |
| FLX-09 | 5 | pendiente | FLX-03 |
| FLX-06 | 6 | pendiente | FLX-05, FLX-07, FLX-08, FLX-09 |
| NOM-01 | 4 | en_curso | en `feat/integracion` (14/11/2026): menú, «+ Nuevo», Ctrl K (también encuentra «operaciones»), Hoy, tablero, el asunto por dentro, Eliminados, agenda, tareas, Personas, contactos, entrevista, Más, ayuda y los dos manuales dicen «asunto»; rutas, API y folios sin cambio; 669 pruebas del panel y 1253 del servidor. Quedan con «operación» lo que significa venta o renta, lo fiscal o jurídico, lo que se imprime en documentos y los mensajes que manda el servidor (`src/lib/backend`, fuera del alcance de pantalla). Falta revisarlo en computadora y celular. |
| TRA-02 | 5 | pendiente | TRA-01; tipos por confirmar con el titular |
| SOP-01 | 5 | parcial | OBS-01; guía por pantalla y `/admin/ayuda`; falta «Reportar un problema»; revisado contra el código el 14/11/2026 |
| EXT-11 | 6 | pendiente | DEC-14, EXT-06, SEG-01 |
| EXT-13 | por decidir | idea, no aprobada | DEC-14, SEG-01, PRV-01 |
| SAAS-01 | posterior | en_pausa | DEC-15 |
| SAAS-02 | posterior | en_pausa | SAAS-01 |
| SAAS-03 | posterior | en_pausa | SAAS-01, FLX-03 |
| SAAS-05 | posterior | en_pausa | SAAS-01, SAAS-02, SAAS-03, DAT-01, USR-01 |
| SAAS-06 | posterior | en_pausa | SAAS-01, DEC-18 |
| PIL-02 | posterior | en_pausa | SAAS-01 a SAAS-03, SAAS-05, PIL-01, REC-01, OBS-01 |
| COR-25 | 1 | pendiente | DAT-01 |
| USO-02 | 4 | pendiente | FLX-06 |

**Discrepancia pendiente de EXT-03:** el backlog condiciona proveedores/mantenimiento a EXT-02 o a un caso de venta concreto; el seguimiento exige FLX-04 (antes OPS-01) y FIN-01. Conservar ambas referencias y resolver su dependencia al diseñar esa extensión, sin iniciar por una equivalencia supuesta.

## Riesgos, asuntos y dependencias

| ID | Tipo | Tratamiento y responsable |
|---|---|---|
| A-01 | Asunto: consolidación técnica realizada; aceptación y continuidad pendientes | Fundamentos integrados en PR #15; revisar criterios restantes sin repetir las correcciones ya consolidadas. |
| D-01 | Dependencia: permisos administrativos/entorno aislado | Moisés habilita acceso; ingeniería verifica operación. Bloquea pruebas/controles externos, no diseño o pruebas locales. |
| R-01 | Riesgo: duplicidad cliente/operación/cartera | FLX-04 y COM-01 con ID fuente y pruebas; agente de desarrollo. |
| R-02 | Riesgo: migración de datos ambiguos | Inventario/simulación/reporte; revisión humana de coincidencias. Nunca fusionar todo por nombre/teléfono. |
| R-03 | Riesgo: reglas jurídicas/fiscales no aprobadas | Revisor profesional; mantener bloqueos existentes, no habilitar contratos por casilla. |
| R-04 | Riesgo: sesión/archivo sensible en dispositivo | PWA conectada inicial; almacenamiento local explícito y acotado; responsable de privacidad. |
| R-05 | Riesgo: métricas potenciales usadas como dinero cobrado | FIN/TAB; trazabilidad y etiquetas separadas; Moisés valida definiciones. |
| R-06 | Riesgo: resultado de inversión con supuestos incompletos o TIR ambigua | EXT-08; conservar escenarios y método, explicar ausencia de resultado y cotejar casos por cálculo independiente. |
| R-07 | Riesgo: comparables desactualizados, ubicación imprecisa o ruta sin cobertura | EXT-09; procedencia/fecha/precisión, permisos, tratamiento de faltantes y alternativa en lista. |
| R-08 | Riesgo: acceso de clientes o IA a expedientes ajenos | EXT-10/EXT-06; autorizaciones efectivas, proyecciones mínimas, revocación e índices privados probados entre dos identidades. |
| R-09 | Riesgo (etapa posterior): una empresa ve datos de otra | SAAS-01; pruebas entre dos empresas sintéticas en API, SQL directo, archivos, búsqueda, exportación, cachés e índices de IA antes de cualquier piloto externo. |
| R-10 | Riesgo: un proceso configurado deja de proteger la operación (aplica ya a Fortius por las guías editables y, en la etapa posterior, a cada empresa) | FLX-03 y SAAS-03; con «nada frena, solo avisa» (RP-100), los avisos protegidos no se quitan sin administrador y motivo; cada operación conserva la versión de su guía y el servidor anota lo que se hizo sin el paso. |
| R-11 | Riesgo: prometer una protección legal inexistente (por ejemplo, «patentado») | DEC-16; abogado de propiedad intelectual; ningún texto comercial la afirma sin título otorgado. |
| S-01 | Supuesto: equipo inicial de una persona de ingeniería | Reestimar tras iteración 1; asignar por entrega, no prometer fechas calendario. |
| S-02 | Supuesto: sin reescritura completa ni proveedores nuevos en núcleo | Revisar si evidencia técnica demuestra necesidad. |

## Capacidades adicionales y disparadores

Paquetes de fase 6: EXT-06, EXT-08, EXT-09, EXT-10 y EXT-11 están solicitados para el producto ampliado. Las demás extensiones entran al backlog de ejecución por decisión de negocio o necesidad demostrada. Descubrimiento de 1–3 días orientativos por paquete; esfuerzo de implementación se estima después de validar modelos, proveedor y alcance. Las ventanas originales cubren el núcleo y no estiman estas capacidades. EXT-01 (compradores y coincidencias) pasó a FLX-05 el 14/11/2026.

| ID / capacidad | Cuándo evaluarla / dependencias | Resultado de descubrimiento antes de programar |
|---|---|---|
| EXT-02 — Renta/administración | Hay contratos recurrentes administrados por Fortius; FIN-02/CIE-01/LEG-01 | Ciclo de renta/depósitos/renovación/mora/entrega y reparto de cobros definido. |
| EXT-03 — Proveedores/mantenimiento | Hay órdenes, presupuestos y trabajos que coordinar; EXT-02 o caso de venta concreto | Responsable, autorización, evidencia y enlace a operación/arrendamiento. |
| EXT-04 — Portales/correo/calendario/WhatsApp API | Doble captura real y proveedor con acceso API; FLX-04/PRV-01 | IDs externos, consentimiento, idempotencia, reintentos y costo. Enlace WhatsApp no equivale a integración. **Primera integración elegida (titular, 17/10/2026):** EasyBroker; el panel manda sobre los datos del inmueble y los envía, si el plan de EasyBroker incluye API (H-06). |
| EXT-05 — CFDI/contabilidad/bancos/firma | Necesidad confirmada y proveedor/revisión especializada; FIN-02/DOC-01/PRV-01 | Alcance legal, contrato API, conciliación y permisos; no custodiar dinero por defecto. **Firma en línea (titular, 17/10/2026):** se prefiere una firma electrónica propia del panel, sin proveedor de pago (liga personal, código de verificación, evidencia y huella SHA-256 del PDF), sujeta a validación del abogado; ver D-04 del cuestionario. |
| EXT-06 — Búsqueda documental y revisión asistida de cláusulas | Solicitada; corpus autorizado/versionado y DEC-14; DOC-01/LEG-01/PRV-01, con aislamiento de acceso de SEG-01 | Búsqueda con documento/versión/página, propuestas de cláusulas, evaluación de citas/abstención/permisos y revisión humana. |
| EXT-07 — Cola/worker/eventos | Trabajos duran o reintentos superan límites medidos; ESC-01 | Métrica, idempotencia, reconciliación y plan de operación. |
| EXT-08 — Análisis de inversión | Solicitado; DEC-12 y FIN-02/TAB-01/FLX-04/SEG-01 | Escenarios con TIR/VAN, flujo, presupuesto, supuestos, separación de financiación y resultados comprobables. |
| EXT-09 — Mapas, comparables, zonas y rutas | Solicitados; DEC-11 y FLX-04/TEC-01/VIS-01/SEG-01 | Fuentes/precisión/cobertura, uso permitido, motor/costo, capas autorizadas y recorrido sintético de visitas. **Titular, 17/10/2026:** sin Google Maps por costo; propuesta: MapLibre con mapas de OpenStreetMap, o el nivel gratuito de Mapbox o MapTiler. Primer uso: inventario por zona; ubicación aproximada en público (H-05). |
| EXT-10 — Portal privado de clientes | Solicitado; DEC-13 y FLX-04/DOC-01/SEG-01/AUT-01/PRV-01 | Identidad externa, información compartida, solicitudes, permisos efectivos, revocación y uso móvil. DOC-12 es su primera pieza. |
| EXT-11 — Asistente IA operativo | Solicitado el 17/10/2026 (RP-44); DEC-14, EXT-06, SEG-01 | Resumen de operación, lectura de INE y escritura con confirmación campo por campo, descripción de anuncio y sugerencia de siguiente paso; citas, permisos, evaluación, costo y abstención. Nunca cambia estados ni envía nada por sí solo. **Titular, 17/10/2026:** se programa sin atarse a un proveedor; el titular solo carga la clave de la API y elige proveedor y modelo (Claude, DeepSeek u otro). Antes de elegir: precio vigente, prueba con documentos reales y lugar donde se procesan los datos (transferencia a revisar en el aviso de privacidad). La IA propone y una persona confirma; tope de gasto mensual (H-03). |
| EXT-13 — Conexión a servicios de IA con tope mensual | **Idea del titular, 26/10/2026; se conserva para después (titular, 14/11/2026).** Base común de EXT-11, IA-01, EXT-06 y EXT-12; DEC-14, SEG-01 y PRV-01 | Elegir proveedor inicial y tope, confirmar precios vigentes y probar con documentos sintéticos; ver «EXT-13» abajo. |

El diseño previo de EXT-13, EXT-08, EXT-09, EXT-10 y EXT-06 (pasos, aceptación y reversión) está en el historial, §31.4; se retoma al abrir cada una.

## Tareas detalladas de continuidad

Ventana propuesta: 8–14 días de ingeniería, una tarea a la vez. Aquí quedan las casillas pendientes; las hechas y el texto completo están en el historial, §31.3.

### REC-01 — ensayo de recuperación completo

**Archivos:** `tools/fortius-inmuebles-backup.mjs`, `tools/fortius-inmuebles-owner-export.sql`, `tools/fortius-inmuebles-restore-current.mjs`, `tests/tools/backup-coverage.test.mjs`, `tests/tools/restore-current.test.mjs`, `docs/fortius-inmuebles-backup-restore.md`.

**Consume:** esquema vigente, destino aislado y DEC-06. **Produce:** inventario de DB/Auth/Storage y procedimiento de restauración con conteos, hashes, referencias y tiempos medidos.

- [ ] Abrir solo un destino aislado expresamente autorizado para la prueba; nunca limpiar/restaurar producción.
- [ ] Preparar fixtures de personal/asesores/clientes/inmueble/expediente/actividad/documentos y bytes sintéticos. No equiparar un usuario sintético con una restauración de las identidades productivas.
- [ ] Restaurar en aislado; validar relaciones, cantidades, versiones, hashes y acceso de dos identidades sintéticas. Medir duración y consistencia del snapshot.
- [ ] Ejecutar de nuevo el ensayo de forma reproducible; conservación/disposición del destino según autorización, sin borrar artefactos ajenos.

**Aceptación:** objetivos acordados y recuperación del alcance probado con evidencia; pendiente explícito si queda Auth/Storage fuera. **Reversión:** detener la prueba y descartar/restablecer exclusivamente el destino aislado autorizado; no modificar fuente productiva.

### CI-01 / ENV-01 — publicación e inventario de entornos

**Archivos/ámbito:** `.github/workflows/verify.yml`, configuración administrativa de GitHub/Vercel, dominios, variables por nombre/ámbito. No volcar valores.

**Consume:** BAS-01 y DEC-10. **Produce:** checklist del flujo aprobado y evidencia de bloqueo ante fallo; inventario público/admin/preview/desarrollo.

- [ ] Inventariar despliegue antiguo y dependencias Auth/enlaces/tráfico; formular retiro/redirección sin ejecutarlo hasta aprobación concreta.
- [ ] Revisar rollback de aplicación y compatibilidad del esquema vigente. Una migración aplicada no se borra del historial para revertir aplicación.

**Aceptación:** el bloqueo de publicación se demuestra; si configuración inaccesible, estado `bloqueada`, no `aceptada`. **Reversión:** restaurar configuración previa registrada de forma segura; conservar checks que ya protegían el proyecto.

### AUT-01 / OBS-01 — acceso y diagnóstico de incidentes

**Archivos:** `src/lib/backend/auth.ts`, `src/lib/backend/http.ts`, `src/components/admin/admin-shell.tsx`, `src/app/api/health/route.ts`, pruebas de auth/HTTP.

**Consume:** DEC-03/10 y BAS-01. **Produce:** flujo de cuenta controlada y política MFA; correlación de fallos sin datos sensibles.

- [ ] Probar recuperación e invitación con cuenta/buzón de prueba autorizados. La lectura de site_url correcto no prueba entrega de correo.
- [ ] Definir enrolamiento, recuperación y alcance MFA. No imponer segundo factor hasta verificar recuperación y acceso de emergencia.
- [ ] Mantener pruebas actuales de cookies/sesión/capacidades. Añadir prueba negativa de sesión insuficiente cuando se apruebe MFA; no impedir cuentas actuales sin transición.
- [ ] Tras publicación autorizada, comprobar recepción/retención/alerta de logs mediante error controlado en entorno de prueba.

**Aceptación:** cuenta controlada completa flujo; MFA recuperable si se activa; fallo trazable sin PII. **Reversión:** mantener forma previa de acceso durante transición; desactivar regla nueva si bloquea usuarios, con registro administrativo.

### PRV-01 — tratamiento, conservación y acceso a datos

**Archivos/ámbito:** formatos y schemas existentes, proyección pública, políticas Storage/RLS y avisos. Registro existente para revisión: `docs/erp-crm/privacy/data-processing-register.md`.

**Consume:** inventario de campos/documentos y DEC-06. **Produce:** matriz dato → finalidad → fundamento/consentimiento aplicable → quién accede → plazo → disposición, aprobada por responsable de privacidad y revisor jurídico.

- [ ] Verificar fuentes oficiales vigentes y aplicabilidad de protección de datos, conservación y obligaciones de operación inmobiliaria. Registrar fuentes/fecha y revisión profesional; no fijar plazos o obligaciones por memoria.
- [ ] Acordar manejo de solicitudes de acceso/corrección/disposición y casos de conservación obligatoria. Eliminación visual de un expediente no equivale a borrado de datos/archivos.
- [ ] Cotejar aviso y consentimiento existentes con el tratamiento real propuesto; cambios jurídicos mediante revisión y aprobación específicas.
- [ ] Definir pruebas de acceso/exportación/corrección con datos sintéticos; garantizar que proyección pública/logs no incluyen datos internos. Reutilizar pruebas de public boundary y descargas donde ya cubran esos límites.
- [ ] Incorporar minimización, conservación y permisos aprobados en las tareas dueñas de cada dato. Un pendiente de revisión no se presenta como cumplimiento normativo.

**Aceptación:** matriz y responsables aprobados, restricciones trazadas a tareas y pruebas; ningún nuevo destino de datos sensibles sin evaluación. **Reversión:** suspender tratamiento nuevo que no tenga autorización; preservar conservación exigible y evidencia, sin borrado automático.
