# Fortius — plan de trabajo del ERP/CRM

**Actualizado:** 14 de noviembre de 2026. **Responsable de negocio:** Moisés Núñez Tonalá. **Desarrollo:** agente de desarrollo.

Este archivo dice **qué falta hacer y cómo va**. **Cómo funciona el sistema** (reglas RP y decisiones DEC) está en [`SPEC.md`](SPEC.md); lo terminado, en el [historial](docs/erp-crm/historial-del-plan.md). Si algo choca con `SPEC.md`, manda `SPEC.md`. El agente que trabaja un tema actualiza los dos archivos en la rama de trabajo.

**Para saber cómo va, basta leer esta primera sección.** Lo demás es consulta: el orden de trabajo, los paquetes con su detalle, la tabla de estado de cada entrega y las tareas de continuidad.

## Dónde nos quedamos — 14/11/2026

**Meta: empezar a trabajar de verdad con el panel.** Faltan cuatro cosas:

| # | Qué falta | Cómo va |
|---|---|---|
| 1 | **Panel flexible** (FLX-01 a FLX-09) | FLX-01 casi lista en `feat/integracion` (localhost:3003): Bandeja y Personas ya están en el menú y «Nuevo perfil» con las cinco preguntas de una llamada ya está integrado; falta tu revisión. Después quedan ocho etapas: FLX-02, FLX-03, FLX-04, FLX-05, FLX-07, FLX-08, FLX-09 y el cierre FLX-06. |
| 2 | **Respaldos restaurables y accesos seguros** (bloque 0) | La copia diaria corre desde el 13/11. Falta que actives los dos pasos de entrada (AUT-01), repetir la prueba de alertas desde producción (OBS-01), revisar la limpieza diaria de archivos y repetir el ensayo de restauración con un archivo de la Bandeja (REC-01). |
| 3 | **Cuentas del equipo** (SEG-01 y USR-01) | Pendientes. Las necesitas desde el primer día (14/11/2026). |
| 4 | **Revisión del abogado** | Pendiente: formatos 20 al 24, el umbral de 10,000 UMA del 24, la conservación de 10 años del expediente LFPIORPI, «nada frena, solo avisa» (RP-100) en antilavado y promesa, el aviso de privacidad y el registro de tratamiento (PRV-01) y la lectura con IA de documentos reales. |

El día que cargues el inventario real se sigue [`paso-a-inventario-real.md`](docs/erp-crm/paso-a-inventario-real.md). Todo lo demás está en «Después de empezar a operar», sin orden fijo.

**Lo último:** el PR #76 (14/11/2026, merge `52e1f9a`) publicó Trámites (TRA-01), el panel desde cero (LV-09) y la paleta del sitio. En `feat/integracion`, sin publicar: FLX-01, Personas en el menú, la limpieza del 14/11/2026 y la poda de este plan (de 115 entregas quedaron 86; 21 pasaron a FLX y lo terminado o descartado está en el historial, §28). La limpieza previa a LV-10 (retiro de `panel.module.css`, un solo menú «⋯», colores a tokens y las ocho reglas de LV-08 revisadas, RP-104) está en el historial (§29).

### Te toca a ti

1. **Activar los dos pasos del director** en fortiusinmuebles.com/admin con tu app de códigos y probar una entrada (AUT-01). Es lo único con riesgo real mientras no esté.
2. **Revisar el panel:** Trámites y el panel nuevo en el sitio publicado, y FLX-01 en localhost cuando te avise. Lo que siga mal se anota como corrección nueva.
3. **Llevar al abogado** lo de la fila 4 de arriba.
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

**Origen:** paquete del 17/10/2026 (V01–V10, RP-70 a RP-74). Lo construido (LV-01, LV-02, LV-04 a LV-08) y el panel desde cero (LV-09, publicado con el PR #76 el 14/11/2026) están en el historial (§20, §27 y §28). Queda LV-03.  El 14/11/2026 el titular aprobó el sistema combinado (DEC-51), que se construye en LV-10a a LV-10f.

| ID | Mejoras | Depende de | Aceptación |
|---|---|---|---|
| LV-03 | V06: animaciones pequeñas que confirman (la palomita que se dibuja, la barra que se llena, el panel que se desliza, «Etapa completada») | LV-02, UX-04 | Animaciones de confirmación de 300 ms o menos, sin bucles; con «reducir movimiento» no hay transiciones; los mensajes de guardado siguen apareciendo. |
| LV-10a | **Sistema combinado (DEC-51), base:** cara de cada persona con su color fijo, riel compacto de diez etapas para filas, densidad Cómodo/Compacto guardada por usuario (UX-02). | LV-09 | Mismo color para la misma persona en todas las pantallas; contraste AA en claro y oscuro; la densidad sigue al usuario y no cambia permisos. |
| LV-10t | **Tecnologías de interfaz (DEC-52), base:** shadcn/ui sobre Radix (radix-ui 1.8.1) en `src/components/ui/` (ventana, confirmación, panel lateral, menú, ventanita), cmdk 1.1.1 en Ctrl K, Sonner 2.0.8 en los avisos con «Deshacer», Motion en el cambio de «Lo siguiente»; todo entra por el kit con los mismos nombres. Sin guía superpuesta, sin «Empieza aquí», sin «Tu primer día» ni «Preparar tu espacio». | LV-10a | Hecho en la rama el 14/11/2026: lint, tipos, 638 de 639 pruebas del panel (el fallo de «Más» ya existía) y 1253 del servidor; revisado en localhost:3003 en claro, oscuro, computadora y celular. Falta: pestañas (`Tabs`) sobre Radix, las ventanas de conflicto, sesión vencida y atajos, y aplicar el sistema a Operaciones, Bandeja, Personas, Inmuebles, Trámites y Más (LV-10c–f). |
| LV-10b | **Hoy:** lo siguiente en grande con foto del inmueble y «Ya lo hice»; el resto con foto o cara; se palomea sin salir y se puede deshacer. | LV-10a | Sin pendientes no queda hueco; reglas de volumen de Hoy (abajo) intactas; teclado y lector de pantalla. **Hecho en la rama el 14/11/2026:** cada fila de «Tu día» que es una tarea lleva la casilla de Radix (`Checkbox` de `src/components/ui/controls.tsx`, con área de 44 px) y se palomea sin salir; «Lo siguiente», las filas y las tareas de la agenda comparten un solo cálculo (`workspace/hoy/use-task-done.ts`): un aviso de Sonner con «Deshacer» a la vez y, al completar el siguiente paso, «¿Qué sigue?». La fila palomeada se va en 180 ms con Motion (sin animación con «reducir movimiento»). Volumen: foto o cara solo en los 4 más urgentes («Lo siguiente» y 3 filas), hasta 10 en total en lista compacta y «Ver los N»; varios pendientes de la misma persona dicen «N pendientes»; la agenda muestra 5 citas y «Ver las N citas». Pruebas en `tests/admin/hoy-lista.test.tsx`; revisado en localhost:3011 en computadora y celular, claro y oscuro, con teclado, y palomeando y reabriendo una tarea de la base de prueba. Falta: «Todo el equipo» del administrador con resumen por asesor (la cola aún no separa por asesor). |
| LV-10c | **Operaciones y la operación:** fila con foto, quién, riel y lo que sigue; vencido arriba; encabezado de la operación con foto y riel clicable; barra fija con lo que falta. | LV-10a | Lista y tablero conservan filtros y vista guardada; la barra fija no tapa acciones en celular. **Hecho en la rama el 14/11/2026:** lo vencido arriba en «Esperan algo de ti» y en cada columna del tablero; cada fila con la foto del inmueble o la cara del cliente, el riel del kit (`StageRail`, ahora con lo pendiente en ámbar) y quién la lleva con su cara y el folio; el tablero usa el mismo riel; el encabezado de la operación lleva foto de 120 px, las caras del cliente y del responsable, y las diez etapas del riel abren «Ver etapas» en la elegida. La barra fija ya existía (LV-09) y esconde la barra inferior del celular mientras está. Revisado en localhost:3003 en computadora y celular, claro y oscuro. **Controles de Radix (DEC-52), en la rama el 15/11/2026:** en la lista, el tablero, el asunto y «Nuevo asunto» los controles hechos a mano pasan a piezas de `src/components/ui/`: asesores y responsables con su cara (`Select`); cliente, inmueble, interesado y contacto se buscan escribiendo, con cara o foto (`Combobox`); todas las fechas con calendario (`DateField`); opciones excluyentes con `RadioGroup`; casillas con `Checkbox`; «Más estados» de cada punto en un menú (`DropdownMenu`) con la excepción aparte; los desplegables con `Collapsible`; la ventana de captura de formatos es un diálogo de Radix con pestañas de Radix (encierra el foco, Escape pasa por guardar). Piezas comunes del área en `operation/pickers.tsx`. Se quedan nativos, con el estilo del kit, los `<select>` de listas cortas de texto dentro de formularios largos (ruta, operación, motivo, regresar a, contraparte, tipo de contrato, papel del firmante, encuesta, etapa y checklist del seguimiento, tipo de imagen, sección en celular de la captura y los editores de formatos): el selector del sistema funciona mejor en celular y no hay cara, ícono ni color que mostrar. Formatos sin cambios de campos, cálculos, cláusulas ni PDF. Revisado en localhost:3013 a 1440 y 390 px, claro y oscuro, teclado (el foco vuelve al botón al cerrar el menú) y movimiento reducido; la barra fija no tapa acciones. |
| LV-10d | **Bandeja como correo:** lista, vista grande del documento y «¿Dónde se guarda?» con la sugerencia; J/K para moverse y E para archivar. | LV-10a, FLX-01 | Archivar avisa con «Deshacer»; atajos apagables (UX-03) y sin actuar dentro de campos. **Hecho en la rama el 14/11/2026:** tres columnas como el boceto (lista con tipo de archivo, hora o día y barra de la elegida; el documento en grande como hoja; «¿Dónde se guarda?» con «Archivar aquí»). La sugerencia compara el nombre del archivo con inmuebles, operaciones y personas (sin leer el contenido; una operación lleva su inmueble y su persona); «Otro destino» abre los tres desplegables. J/K se mueven, E archiva; se apagan con la preferencia de atajos y no actúan en campos, menús ni ventanas. Archivar y mandar a la papelera avisan con «Deshacer», que el servidor revierte (destino vacío o `papelera: false`), y queda elegido el siguiente documento. El PDF se dibuja con pdf.js (seis páginas; en celular la primera) porque el panel no se deja enmarcar (`frame-ancestors 'none'`); la misma vista (`VistaPdf`) arregló el visor de documentos del cliente en «documento en vivo», que salía en blanco por el mismo motivo. Sin cambios en la API ni en la base. Revisado en localhost:3003 con la lista simulada (la tabla de la Bandeja llega a la base al integrar): computadora, celular, claro y oscuro. Sin «Archivados» todavía: la API no los lista. **Piezas de DEC-52 (14/11/2026, misma rama):** el destino a mano se elige con el selector con buscador (`Combobox`, busca sin acentos) con la foto del inmueble o la cara de la persona; las sugerencias son un grupo de opciones (`RadioGroup`) con foto o cara; el tipo de documento, con `Select`; el menú «⋯» es el `ActionsMenu` del kit con íconos; «Ver en grande» abre el documento en una ventana (`Dialog`); «Guardado», «Tipo guardado» y parecidos salen en Sonner, y archivar o mandar a la papelera, en el aviso con «Deshacer». «¿Dónde se guarda?» pasa a la tarjeta clara del boceto con «Archivar aquí» en borgoña; # manda a la papelera; las fotos se ven en miniatura en la lista; cambiar entre sugerencias y «Otro destino» entra con Motion (180 ms, sin animación con «reducir movimiento»). Lint, tipos y 16 pruebas de la Bandeja; revisado con API simulada en computadora y celular, claro y oscuro. `bandeja/desplegable.tsx` queda solo porque Personas aún lo usa. |
| LV-10e | **Personas como agenda con cara:** a quién le toca hoy primero; ficha con «en qué quedamos», sus inmuebles con foto, operaciones con riel e historial; campos editables en su lugar. | LV-10a, FLX-01 | Edición con control de versión y 409; deshacer donde el servidor restaura. **Hecho en la rama el 14/11/2026:** la lista va en grupos («Te toca hoy o antes», «Esta semana», «Más adelante», «Sin fecha») con la cara de cada persona y su fecha en rojo si se pasó; la ficha abre con su cara, su papel, desde cuándo está y quién la atiende, y Llamar, WhatsApp y Agendar; debajo de «En qué quedamos» van sus inmuebles con foto, precio y estado (los de sus operaciones y por el que preguntó), sus operaciones con el riel de etapas, sus documentos y «Lo que ha pasado» (notas, citas que ya pasaron, tareas terminadas y notas del primer contacto). Teléfono, correo, papel y próximo contacto (este solo sin operación, porque con operación no cuenta) se cambian en su lugar: se guardan con la versión del registro (un 409 abre la ventana de conflicto), el motivo de un rechazo queda junto al campo y «Deshacer» vuelve a guardar los valores de antes. Pruebas en `tests/admin/personas.test.tsx` y `tests/admin/personas-vista.test.ts`; revisado en el navegador en escritorio, celular, claro y oscuro, con un cambio y su deshacer contra la base de prueba. **Piezas de DEC-52 (14/11/2026):** en Personas, Contactos y la ficha del prospecto los menús, selectores, fechas y avisos hechos a mano pasaron a `ActionsMenu`, `Select`, `Combobox` (inmueble que visitó, con foto), `DateField`, `Checkbox`, `ToggleGroup`, `Sheet` («Nuevo cliente» en Contactos) y Sonner; el canal preferido se cambia en su lugar. Quedan nativos, a propósito, los `<select>` de los formularios largos (perfil del prospecto, cliente, tipo de cita, mensajes listos y plantillas) y la fecha de nacimiento, como indica la base. |
| LV-10f | **Inmuebles, Trámites, Más y Ctrl K:** vitrina de lo que pide algo hoy; precio editable en la fila; Trámites con foto y caras; Más como lanzador; Ctrl K con caras, fotos y acciones. | LV-10a | Ctrl K solo muestra lo permitido; Más se maneja completo con teclado. **Hecho en la rama el 14/11/2026:** Inmuebles abre con «Piden algo hoy»: hasta tres inmuebles con su foto, el motivo (llaves que no regresaron, compradores que buscan algo así sin aviso, o lo que le falta para promoverse), quién lo lleva y la acción que lo resuelve; lo vendido y lo rentado no aparece. El precio público se cambia en la fila: se guarda con la versión del registro (un 409 abre la ventana de conflicto), rechaza centavos o cero, Escape cancela y «Deshacer» devuelve el precio anterior; solo lo ve quien puede editar el inmueble. Trámites lleva la foto del inmueble y la cara del cliente en la lista y en el detalle. Más (Herramientas) es un lanzador: buscador grande que filtra herramientas y secciones al escribir, las cuatro abiertas hace poco en este navegador, flechas, Inicio, Fin, Enter y Escape; Administración solo para el administrador. Esto reemplaza el «sin buscador» de C45/SIM-15 (siguen sin filtros, contador ni estrellas). Ctrl K muestra la cara de cada persona (y del cliente en su operación), la foto de cada inmueble, el ícono de tareas y acciones, y sin escribir ofrece «Crear» con las altas del papel de cada quien; los resultados siguen saliendo de lo que el servidor entrega a cada quien. Pruebas en `tests/admin/inmuebles-vitrina.test.ts`, `tests/admin/property-list-vitrina.test.tsx`, `tests/admin/herramientas-lanzador.test.tsx` y `tests/admin/commands.test.tsx`; revisado en el navegador en escritorio, celular, claro y oscuro, con un cambio de precio y su deshacer contra la base de prueba. Trámites no se vio con datos porque la base de prueba no tiene ninguno; lo cubren sus pruebas. **Verificación completa del 14/11/2026:** `npm run verify` en verde (lint, tipos, 1,253 pruebas del servidor, 666 del panel y la build). La suite de navegador del panel dio 113 bien, 1 omitida y 20 fallas ajenas a LV-10 (registro en `tmp/browser-lv10f.log`): las páginas públicas esperan el sitio sin backend (contacto «próximamente», salud 503) y esta corrida usó `.env.local` real; otras buscan la barra superior anterior a LV-09 (cuenta, «Nuevo», el buscador como `searchbox`) o el aviso de eliminar operación. Quedan por corregir antes del PR. **Bloque f: (15/11/2026, en la rama)** Inmuebles y Trámites pasaron a las piezas de shadcn/ui (DEC-52): la vista previa del banco de trabajo y el visor de documentos de Trámites son `Dialog` (Escape, foco atrapado y devuelto al botón que la abrió); la tarea rápida de Trámites es un `Popover` anclado a donde se pidió (o al centro con la tecla T); «Más filtros», «Filtros y vistas guardadas», las opciones «⋯» de cada inmueble, «Fuente de las superficies», «Dónde se guardan» y «Préstamos anteriores» son `Collapsible`; los filtros de inventario, el lugar de las llaves, el estado de preparación, el medio del aviso y la venta ligada son `Select`; propietario e inmueble del trámite nuevo son `Combobox` con cara y foto; las fechas de publicación, disponibilidad, autorización del aliado, regreso de llaves y preparación son `DateField`; las casillas del inmueble, de preparación y de «Incluir Demo» son `Checkbox`; lo que incluye el avance es `Switch`; el giro de la foto es `ToggleGroup`; y los avisos de vistas guardadas y de la copia temporal salen por Sonner. Se quedan nativos, con el estilo del kit, los `select` del formulario largo del inmueble (tipo, conjunto, operación, estado, asesor, modalidad, moneda, categoría del punto, fuentes de superficie, origen e «Ir a sección») porque viajan por `FormData` y la copia temporal los restaura en el DOM, y el estado de cada fila de la lista, que guarda al cambiar con su versión. Las reglas de publicación y lo que llega al sitio no cambian. Lint, tipos y 113 pruebas del panel en verde (se ajustaron `editor`, `compartidos`, `mobile-lists`, `property-followup`, `property-form-navigation` y el spec de navegador `admin-workspace` a las piezas nuevas, y se agregó una prueba de que casillas y fecha viajan en el formulario y en la copia); revisado en el navegador con API simulada en escritorio y celular, claro y oscuro, teclado y movimiento reducido. Pendiente: correr la suite de navegador del panel cuando el titular la autorice. **Bloque g: Más por dentro (14/11/2026, en la rama `claude/lv10-mas-1d8707`):** las herramientas, Reportes, Eliminados y las páginas de administración usan las piezas de `src/components/ui/`. Tablas completas con encabezados en `Table` (resultado de cada herramienta, filas editables de las calculadoras, vista previa de CSV, uso de herramientas, canales, cartera por asesor e inmuebles compartidos); fechas con `DateField` (calculadoras, cotizador, informe, revisor, cartera comercial, aviso de privacidad, partidas, periodo de Reportes); `Select` con la cara de cada asesor en Reportes y en el vínculo de cuentas, y en cartera, historial, grupo de preguntas, tipo de archivo y documento del QR; casillas con `Checkbox` y activar/publicar con `Switch`; pestañas del seguimiento comercial con las del kit; «Mis trabajos» en panel lateral (`Sheet`); la ventana de documentos sueltos sobre `Dialog` (foco atrapado; Escape guarda y cierra); el giro de foto con `Segmented`; los avisos de Eliminados en Sonner. «Asuntos por etapa» es una gráfica de barras (`ChartContainer`) con la cifra escrita en cada barra y su lectura completa para lectores de pantalla (RP-72). Se quedan nativos, con el estilo del kit, los `<select>` de formularios largos (calculadoras, herramientas comerciales, cartera comercial, aviso de privacidad, blog y partidas): son listas cortas dentro de capturas largas y en celular abren el selector del sistema; también los `<details>` plegables. Pruebas ajustadas a las piezas nuevas; revisado en localhost:3017 en computadora y celular, claro y oscuro, con teclado. Pendiente: con la base de prueba sin carteras no se vieron en el navegador las pestañas del seguimiento comercial (las cubre su prueba). |
| LV-10g | **Agenda y Tareas:** la agenda con vista Semana y Mes (calendario del kit), cada cita con la cara de la persona y la foto del inmueble; el detalle se abre en un panel lateral (en celular desde abajo) con «Lo que sigue»; Tareas y el formulario de tarea con las piezas del kit. | LV-10a, LV-10t | Sin perder vistas, filtros ni pruebas; eliminar avisa con «Deshacer»; atajos sin actuar dentro de campos; claro y oscuro, teclado y «reducir movimiento». **Hecho en la rama el 14/11/2026:** Semana y Mes con puntos por día y conteo en el nombre accesible; cita con cara y foto, detalle con foto grande, «Con», asunto, asesor, notas y «Lo que sigue» (siguiente cita, volver a contactar y hasta tres tareas abiertas), «Abrir asunto» o «Ver a …»; «Agendar» con campo de fecha, tipo y asesor con buscador y caras; menú «⋯» por cita con «Eliminar» y «Deshacer»; atajos T (hoy), A (agendar), S/M (semana/mes) y flechas; avisos en Sonner. Tareas: filtros con selector, responsable con buscador y caras, «Más filtros» plegable, palomita del kit y foto o cara en cada fila; el formulario conserva su interfaz y usa selector, campo de fecha y buscador de responsable. Falta: la hora sigue con el control del navegador, los atajos aún no aparecen en la ayuda de atajos y el calendario del kit vuelve a montar su raíz en cada render (pedido a la base). |

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
| FLX-01 | **Bandeja y documentos sin operación:** tabla nueva (migración aditiva) con documentos ligables a persona, inmueble, asunto o a nada; Bandeja donde se elige a mano a dónde va cada documento (la lectura y la recomendación son FLX-07); inmueble sin propietario; «Nuevo perfil» con las cinco preguntas de una llamada; entrada en el menú después de Hoy (RP-58, RP-101, RP-102). Absorbe CAP-01 (primer contacto en una pantalla: es «Nuevo perfil»). | LV-09 | Soltar dos PDF y terminar con el terreno archivado sin propietario; abrir un perfil con las cinco preguntas; el respaldo diario incluye la tabla nueva; ninguna guarda existente se quita. **«Nuevo perfil» hecho en la rama de Personas (14/11/2026):** panel lateral (desde abajo en celular) que se abre en Personas o con `/admin/personas?nuevo=1`, con las cinco preguntas: nombre, teléfono, para qué llamó (vender, comprar, rentar, ofrecer en renta o invertir, y lo que contó), cómo prefiere que le busquen (llamada, WhatsApp o correo) y en qué quedaron con su fecha. Guarda un prospecto contactado con la API de siempre y el próximo contacto como tarea (DEC-42); si el nombre o el teléfono coinciden, avisa y se elige «Es la misma» (abre su perfil) o «Es otra», sin juntar nada (RP-94). El canal preferido queda en el perfil, sin cambios en la API ni en la base. Probado contra la base de prueba con un perfil de ejemplo. «Agregar contacto» de Contactos también abre «Nuevo perfil» (SIM-17 actualizada); la entrada en «+ Nuevo» y Ctrl K está en `feat/integracion` (258821b). |
| FLX-02 | **Crear cualquier documento desde cualquier lado:** «Crear documento» en persona, inmueble y asunto; se retiran los candados de pantalla. Absorbe FCH-02 (los documentos se llenan con lo que saben la persona y el inmueble; el PDF emitido no cambia solo, RP-76) y HER-04 (un trabajo suelto pasa a un asunto con sus datos). | FLX-01 | Crear el levantamiento sin entrevista; los formatos conservan versiones y PDF inmutables. |
| FLX-03 | **De frenos a avisos y de metodología a guías:** guías como datos (venta, renta, compra, búsqueda de renta, inspección, opinión de valor, cancelación de hipoteca); asunto libre con título, objetivo y las guías que se elijan o ninguna, con el riel de las etapas de su guía, o sin riel si no lleva ninguna (DEC-55); varias guías en un mismo asunto, una tras otra; «Nuevo asunto» desde la Bandeja con los documentos soltados (DEC-54); disparadores nuevos que avisan y anotan en lugar de rechazar, con el mismo cambio en TypeScript (RP-100). Absorbe MOT-01 a MOT-04 (las guías como listas editables sustituyen al motor con editor; procesos base y módulos del 17/10/2026 en el historial, §28.3), FCH-04 (descargar con faltantes; ningún campo vacío detiene, RP-77 y RP-82) y DOC-15 (listas de documentos por situación como guías). **Riel por tipo de asunto (DEC-55):** cada guía trae sus etapas y el riel dibuja esas; el tipo se elige al abrir el asunto y se puede cambiar (lo hecho se conserva y queda en el historial); con varias guías, el riel muestra la que va; el tablero agrupa por tipo o pide elegirlo primero. | FLX-02 | Publicar sin intermediación firmada deja aviso en el historial; los dos PDF del terreno de un colega abren un asunto con folio desde la Bandeja y después se le ligan el inmueble y las personas; un asunto encadena cancelación de hipoteca y crédito Infonavit; un asunto libre sin guía avanza sin riel; las pruebas que hoy dicen «rechaza» pasan a «permite y anota», sin borrarse; una operación existente conserva etapa, documentos y formatos; una inspección o un trámite muestran su propio riel, y la venta y la renta conservan sus diez etapas. |
| FLX-04 | **Perfiles completos y listas:** persona con folio y vista agregada; papeles por asunto; compradores y arrendatarios como clientes (RP-93); prospectos del formulario sin duplicarse. Absorbe REL-01 (persona con varios papeles, representantes y varios propietarios), CRM-01 (la condición de cliente sale del contrato firmado), CRM-03 (línea de tiempo con filtros por tipo), OPS-01 (el asunto como centro de trabajo), CAP-03 (lo ya respondido se confirma; preguntas por momento, historial §28.3), FCH-01 (datos de la persona y del inmueble en un solo lugar, con origen y estado por dato), FCH-07 (archivo por documento pedido) y FCH-11 (el valor concluido queda en el inmueble). | FLX-03 | Un comprador que firma pasa a cliente y conserva su historial; listas con filtros. |
| FLX-05 | **Vencimientos y coincidencias:** vigencia por documento y fechas de contratos en Hoy; coincidencias entre búsquedas e inmuebles. Absorbe EXT-01 (coincidencias explicables en los dos sentidos) y DOC-13 (vencimientos por fecha y responsable). | FLX-04 | Un arrendamiento por terminar aparece en Hoy como llamada; un inmueble nuevo muestra quién buscaba algo así. |
| FLX-07 | **La Bandeja recomienda a dónde va cada documento (RP-103):** al soltar un documento, el sistema lo lee (la lectura de IA-01) y busca a qué inmueble, persona o asunto corresponde por lo que el documento dice: dirección, clave catastral, folio real, nombres, RFC o CURP. Muestra la recomendación con el dato que la sostiene; se confirma con un clic o se deja sin ligar. Si no encuentra nada, propone crear el inmueble, la persona o el asunto con lo leído, y también eso espera el clic. Sin lectura disponible, la Bandeja sigue funcionando a mano como en FLX-01. Se construye después de FLX-04, cuando existen los asuntos y los perfiles completos contra los cuales comparar; puede ir en paralelo con FLX-05. Absorbe DOC-11 (soltar varios archivos y que se proponga a dónde van; ninguno queda revisado por cargarse). | FLX-04, IA-01 | **Ejemplo del titular:** se suelta el avalúo de un terreno que ya está registrado y la Bandeja recomienda ese inmueble, mostrando el dato con que lo reconoció (por ejemplo, la clave catastral); un clic lo liga. Además: el avalúo de un terreno que no existe propone «Crear inmueble» con dirección y superficie ya llenas, y no se crea nada sin confirmar; «Dejar sin ligar» lo deja en la Bandeja; una prueba comprueba que, sin el clic, el servidor no liga ni crea nada (RP-44, RP-62). Con documentos de clientes reales, la lectura espera el visto bueno del abogado (PRV-01); mientras la base tenga solo datos de prueba (DEC-10) se ensaya con documentos ficticios. |
| FLX-08 | **Guías para asuntos jurídicos y de obra (DEC-54):** sucesión o adjudicación; recuperación de inmueble invadido; juicio de desahucio; seguimiento de juicio (expediente, juzgado, abogado, audiencias y plazos en la Agenda); rehabilitación con presupuesto; crédito Infonavit del comprador. Cada guía sugiere pasos y documentos, nunca frena (RP-100). | FLX-03 | Los casos del titular (sucesión con inmueble invadido, desahucio con rehabilitación y venta, cesión de derechos litigiosos en sentencia) se abren y avanzan con su guía; los pasos se verifican con fuente oficial vigente; las guías jurídicas esperan el visto bueno del abogado antes de usarse con clientes reales. |
| FLX-09 | **Gastos de cada asunto (DEC-54):** cada gasto con concepto, monto, fecha, quién lo paga y su comprobante privado; total por asunto y por quien paga. | FLX-03 | En el asunto de desahucio, los gastos que cubre el comprador a plazos se suman aparte y cada uno lleva su comprobante; nada de esto sale en el sitio público. |
| FLX-06 | **Cierre:** manual, registro de privacidad (documentos de compradores y arrendatarios), revisión con crítico en contexto limpio y propuesta de verificación completa. Absorbe COR-26 (manual con capturas actuales; la prueba de uso es USO-02). | FLX-05, FLX-07, FLX-08, FLX-09 | Documentos al día; PRV-01 actualizado para el abogado. |

**Por replantear en su etapa** (las reglas siguen vigentes hasta entonces): candado de arranque (FLUJO-04a) y «avanzar sí espera» (B-04, RP-87); DEC-42 (siguiente paso con tarea y fecha); el freno de la firma de TRA-01, que pasaría a aviso con Trámites como guía; las entregas que absorbe cada etapa están anotadas en su fila (poda del 14/11/2026; textos anteriores en el historial, §28).

## Regla de actualización en cada publicación

Por instrucción de Moisés del 13/10/2026, este plan debe actualizarse con cada entrega a GitHub y cada despliegue. Registrar fecha local, alcance real, PR, commit funcional, migraciones aplicadas, comprobaciones y límites, enlace y estado del despliegue. Distinguir preparación, publicación comprobada y pendientes; no marcar publicado por haber hecho push. Los commits que solo actualizan este registro no requieren reconstruir un producto cuyo código permanece idéntico. Actualizar también las tareas realizadas y pendientes del mismo plan.

Los registros de cada publicación anteriores al 11/11/2026 están en [`docs/erp-crm/historial-del-plan.md`](docs/erp-crm/historial-del-plan.md). Los nuevos se anotan en «Dónde nos quedamos» y, al cerrar la entrega, se pasan al historial.

## Gobierno del proyecto

- **Decisor y aceptación de negocio:** Moisés Núñez Tonalá.
- **Responsable de ingeniería por entrega:** el agente de desarrollo, en el checkout autorizado. No marcar aceptación humana desde una prueba automática.
- **Revisor jurídico/fiscal/contable:** profesional que designe Fortius. Su revisión es dependencia cuando la entrega fija reglas de esas materias.
- **Usuarios piloto:** el equipo de Fortius (PIL-01), con pruebas de uso medidas (RP-47). Datos sintéticos hasta la autorización expresa del piloto real. El piloto externo (PIL-02) es de la etapa posterior, en pausa.
- **Enfoque:** entregas incrementales, un recorrido verificable por vez. Una tarea de implementación en curso y otra como máximo en revisión. Las dependencias externas se registran aparte.
- **Cadencia:** revisión al finalizar cada iteración; recalibración de la siguiente con evidencia. No llamar al trabajo individual Scrum ni dar fechas firmes sin capacidad y accesos.

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
| SEG-01 P0/I | Matriz de capacidades por función y por registro | identity nuevo, auth, staff, RLS y Storage | DEC-03, FLX-04; 3–5d | Dos asesores, administrador y capacidad especializada probados en API/DB; reasignación elimina acceso indebido. |
| USR-01 P1/I | Administrar cuentas del equipo desde el panel | nueva vista/API de personal, perfil asesor y adviser-accounts | SEG-01/AUT-01; 3–5d | Invitar, vincular y desactivar personal con trazabilidad; perfil público separado de cuenta; evitar dejar cero administradores activos; no pedir ni mostrar contraseña del usuario. **Flujo pedido por el titular (17/10/2026, J-01):** en Equipo, el administrador captura nombre completo, celular, correo y rol (con sus permisos), registra el convenio de confidencialidad y envía la invitación por correo. La persona abre el enlace, crea su usuario y contraseña, responde un captcha (Cloudflare Turnstile) y confirma su celular con un código por SMS (proveedor de pago conectado a Supabase); si no se puede, con una app de códigos. Al entrar por primera vez, el panel le da la bienvenida y lo guía a subir su foto y escribir su biografía, que edita él mismo. Las invitaciones salen por un servicio de correo propio, no por el correo de prueba de Supabase. Es condición para las pruebas de uso (USO-01). |
| PUB-01 P1/I | Inventario interno separado de publicación; captación web conectada | property-form, public.ts, `/api/public/leads`, layout config | SEG-01, FLX-04; 2–4d | Alta no publica; datos privados no aparecen en web/PDF; formulario sintético llega al CRM si se autoriza activar captación. Demo se conserva. |
| DAT-01 P1/I | Revisar datos heredados e importaciones/exportaciones permitidas | validadores/domain, utilidades de importación y reporte de simulación | FLX-04/SEG-01/PRV-01; 2–4d | Simulación sin escrituras detecta referencias ambiguas, duplicados y errores; usuario decide fusiones; ejecución idempotente y export restringido. Nunca importar ejemplos como actividad real. |
| CRM-02 P1/I | Registro rápido de contacto, siguiente paso obligatorio, plantillas de mensaje y reloj de primera atención (RP-21 a RP-23) | contactos, fichas, followups, tareas | FLX-04; 3–5d | Registrar un contacto en dos toques; sin siguiente paso pide fecha o motivo. La plantilla abre WhatsApp o correo y el envío no se registra hasta que el asesor lo confirma. El reloj usa la definición de «Primera atención». |
| INV-01 P1/C | Salud del inmueble, alertas de precio e historial de precio (RP-28) | propiedades, historial de cambios, eventos, ofertas, Comparables | PUB-01; 2–4d | Indicadores con fuente; umbrales ajustables en Configuración; historial de precio con autor, fecha y motivo; la alerta abre Comparables con el inmueble. |
| DAT-02 P1/I | Calidad de captura: validaciones, catálogo de colonias, montos con moneda y fusión asistida (RP-40 a RP-43) | validadores, formularios, catálogo SEPOMEX con fecha de corte, personas | FLX-04, DAT-01; 3–6d | Mensajes de validación claros; catálogo con fecha de corte y «otra» marcada; fusión campo por campo con historial y deshacer, nunca automática. |

**Retirada de esta tabla el 13/11/2026:** PUB-02, en `main` con el PR #73 (historial, §21).

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

**Retiradas de esta tabla el 13/11/2026** por estar en `main` o descartadas: COR-01 y COR-02, SUB-01 (descartada), DOC-EXP y DAT-EXP (historial, §20).

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

**Retiradas de esta tabla el 13/11/2026 por estar `en_main` o `terminada`:** SIM-02, SIM-03, SIM-08, COR-01, COR-02, COR-03, COR-04, COR-06, COR-08, COR-09, COR-11, COR-12, COR-13, DOC-EXP, DAT-EXP, IA-01, CSR-01 a CSR-08, LV-05, LV-07, LV-08, SIA-01 a SIA-06, MRP-01, DOC-09, EXT-12, LV-06, SIM-13, SIM-14, COR-15, COR-16 y CAP-05. Sus filas están en el historial (§19: [`docs/erp-crm/historial-del-plan.md`](docs/erp-crm/historial-del-plan.md)). **Segunda pasada (13/11/2026), confirmadas en `main` (hasta el PR #73):** HER-01, HER-02, HER-03, HER-05, PUB-02, COR-18, COR-19, COR-20, COR-21, COR-22, COR-23, COR-24, DOC-06 y CAP-06 (historial, §21). Tercera pasada (13/11/2026, comprobadas en el código de `main` tras el PR #74): SIM-01, SIM-09, SIM-11, SIM-12, SIM-17, SIM-19, COR-05, COR-07, COR-10, COR-14, COR-17, IA-02, FCH-03, FCH-06 (historial, §22). BAS-01 y CI-01, terminadas el 13/11/2026 al aceptar el titular BAS-01 (historial, §22). **Poda del 14/11/2026 (aprobada por el titular):** salieron 29 filas; 21 pasaron a su etapa FLX y las demás están hechas o ya no se hacen (historial, §28.6).

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
| FLX-01 | 4 | en_curso | en `feat/integracion` (14/11/2026): construidos la base y el servidor de documentos sin operación, el respaldo con la tabla nueva, la pantalla `/admin/bandeja` (soltar, archivar en inmueble, operación o persona, o dejar para después) y la pantalla `/admin/personas` (lista y perfil), las dos en el menú; «Nuevo perfil» con las cinco preguntas, en la rama de Personas. Falta integrarlo y la revisión del titular en localhost. |
| FLX-02 | 4 | pendiente | FLX-01 |
| FLX-03 | 4 | pendiente | FLX-02; coordina con Metodología |
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

## Cómo incorporar lo que vaya haciendo falta

1. Registrar necesidad con ejemplo, usuario afectado, evidencia y tarea relacionada.
2. Clasificar como defecto del alcance base, dependencia indispensable, mejora de producto o nueva capacidad.
3. Defecto/dependencia técnica necesaria se incorpora a su entrega con pruebas y estimación; una decisión jurídica/negocio no se resuelve por inferencia.
4. Una nueva capacidad recibe costo, beneficio, datos, dependencia, alternativa simple y criterio de aceptación. Moisés decide entrada y qué desplaza.
5. Mantener hasta dos iteraciones detalladas; el resto conserva entregables/dependencias y se concreta al llegar. No fingir firmas/interfaces finales para modelos aún no aprobados.
6. Revisar fuente de verdad, permisos, migraciones, backup y métricas ante cada módulo nuevo.

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

### EXT-13 — conexión a servicios de IA con tope mensual

**Estado: idea del titular (26/10/2026), conservada para después el 14/11/2026.** La capa de proveedor del punto 1 ya existe para la lectura de documentos (`src/lib/ia/proveedor.ts`, Claude o Grok según la clave); falta el tope mensual con su registro de uso (punto 3). Es la base de EXT-11 (asistente), la lectura de documentos y EXT-06 (búsqueda documental). Se construye con plan previo.

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

## Cómo trabajar y registrar avances

1. Tomar una sola tarea, leer sus entradas/dependencias y comprobar qué parte ya existe.
2. Si cambia comportamiento, escribir primero una prueba que reproduzca el caso y verla fallar antes de implementar.
3. Hacer el cambio menor que cumple el criterio, comprobar permisos/compatibilidad y repetir las verificaciones afectadas.
4. Registrar en este archivo el cambio, el commit o estado local, la prueba real, la fecha y los límites. No crear otro roadmap, bitácora de desarrollo o JSON de seguimiento paralelo.
5. Una decisión menor de ingeniería puede resolverse y explicarse aquí. Política de negocio, interpretación jurídica, infraestructura productiva y datos reales requieren su autorización específica.
6. Revisar cada entrega sobre los archivos finales. Aprobación técnica, aceptación humana y publicación son hechos distintos.
7. Antes de diseñar una pantalla o entrega, leer «Dirección del producto y reglas vigentes» (`SPEC.md`). Si el titular aprueba una idea que contradice una regla, reescribir la regla anterior en su lugar y anotarlo en «Reglas reemplazadas» (`SPEC.md`).

La carpeta de trabajo se conserva única por indicación del titular; esta preparación usa una rama local. La evidencia voluminosa, capturas y archivos de ejecución van fuera del repositorio. Mantener credenciales y copias privadas fuera de Git; no incluirlas en commits o PR.
