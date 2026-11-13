# Fortius — historial del plan de implementación del ERP/CRM

**Qué es este archivo.** Guarda, sin cambios de redacción, las secciones de [`PLAN_ERP_CRM.md`](../../PLAN_ERP_CRM.md) que describen trabajo ya terminado o registros de sesiones pasadas. Se separó del plan el 11/11/2026 a pedido del titular para que el plan quede corto. **No es un plan ni una fuente de reglas:** si algo de aquí contradice al plan, manda el plan. Las referencias a ramas «sin integrar» son de su fecha: al 11/11/2026 todo lo registrado aquí está en `main`.

**Cómo usarlo.** Consultarlo cuando haga falta saber cómo o por qué se construyó algo (por ejemplo, los candados FLUJO-04a, el encargo de la Fase C o qué se cotejó de cada formato). Al cerrar una entrega, su registro detallado se pasa del plan a este archivo, al final.

## Índice

1. Rediseño guiado del panel (Fase C): encargo y avance
2. Limpieza del código (Fase A), 15/10/2026
3. «Dónde estamos»: registros del 12 y 13/10/2026
4. «Siguiente fase — captación dentro del panel» (superada por el Orden vigente)
5. Registro de la preparación del 12/10/2026
6. Implementación aprobada: 20 apps para asesores (13/10/2026)
7. Proceso de comercialización: cobertura del 15/10, adaptación PROC, flujo FLUJO, cierre del 17/10 y «Qué sigue»
8. Registros de publicaciones y entregas (12 al 18/10/2026)
9. «Estado vigente» tal como estaba el 11/11/2026, antes de la depuración
10. Lenguaje visual: registro del sitio público (18 al 30/10/2026)
11. LV-06: especificación de «Una operación» según el boceto D «Moderno» (29/10/2026)
12. Simplificación (SIM): correcciones resueltas, texto original
13. EXT-12: estado por grupo de formatos al 29/10/2026 (texto original)
14. Simplificación (SIM): estado de las correcciones tras el boceto C (18/10/2026)
15. Proceso: correcciones COR ya hechas, texto original
16. Matriz de estados: notas de revisión anteriores al 11/11/2026

## 1. Rediseño guiado del panel (Fase C): encargo y avance

### Rediseño guiado del panel (Fase C) — encargo y avance

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

## 2. Limpieza del código (Fase A), 15/10/2026

### Limpieza del código (Fase A del plan de rediseño) — 15/10/2026

**Alcance:** mismo comportamiento con menos código y peso, decidido por el titular el 15/10/2026: quitar Finanzas, Análisis territorial y Portal de clientes, y eliminar las integraciones apagadas (firmas, OCR, consulta con IA y rutas). Rama `chore/limpieza-codigo`, sin migraciones ni cambios de permisos o datos. **Estado: comprobada localmente; sin push, PR ni publicación.**

- **Código:** 35 archivos y 2,161 líneas menos en `src` (34,437 → 32,276). Se borraron componentes de la portada anterior y rutas `/zonas` que ya redirigían. Se quitaron exportaciones sin uso. Las utilidades repetidas se unificaron (`formatDate`, `formatAmount`, `fetchJson`, `loadAllDossiers`, `readAllPages`, etiquetas de operación y etapa).
- **Peso:** 474 KB menos de JavaScript compilado (−10.7 %) y 17 KB menos de CSS. `public/` pasa de 6.3 MB a 3.5 MB; el retrato de Nosotros pasa de PNG de 2.5 MB, servido sin optimizar, a WebP de 118 KB. Una dependencia menos (`pdfjs-dist`).
- **Integraciones:** quedan 16 apps. Las tablas y la migración de integraciones siguen en la base y en los respaldos; su prueba de seguridad en PostgreSQL se conserva.
- **Pruebas:** lint, tipos y compilación aprobados; 700 pruebas de servidor, 328 del panel y 35 de herramientas, además del paquete de PDF. En navegador: 70 públicas, 44 del panel (las de CI más comercial, process-corrections y reportes, que entran a CI) y 6 de formularios. Las pruebas del panel se ejecutaron contra un servidor sin backend, como CI. Se retiraron ocho pruebas de navegador obsoletas que CI no ejecutaba.
- **Respaldo:** los archivos retirados sin referencias quedan en `.superpowers/archivo-limpieza-2026-10-15/` con manifiesto SHA-256.
- **Pendiente:** el titular decide el borrado de carpetas locales temporales; después siguen el PR y Verify remoto. La Fase B (bocetos del rediseño) espera aprobación.

## 3. «Dónde estamos»: registros del 12 y 13/10/2026

### Dónde estamos

#### Folios y revisión del recorrido — 13/10/2026

**Implementado en esta revisión:** el folio interno del inmueble se asigna en PostgreSQL al crear el inmueble (`FORTIUS-000001` en adelante); el expediente recibe su propio folio (`EXP-000001` en adelante). Se conserva cada identificador anterior y se consideran los números históricos de inmuebles eliminados. Los formularios dejan de pedir un número manual. El folio real del Registro Público se captura desde su documento: no se genera.

**Comprobación local:** 649 pruebas de servidor, 318 del panel y 32 de herramientas de respaldo/restauración aprobadas; lint, tipos y compilación de producción sin fallos. Revisión técnica independiente aprobada. El ensayo simultáneo usa la cola de una conexión PGlite: no acredita dos conexiones PostgreSQL independientes. La migración se aplicó y esa versión se publicó; su comprobación está en el registro de folios anterior.

**Diagnóstico previo a la guía:** las etapas de la barra lateral agrupaban expedientes y el asesor coordinaba manualmente sus controles. La nueva guía incorpora validación acumulada de revisiones y próxima acción; la autorización jurídica sigue correspondiendo al responsable competente. Su publicación se comprueba separadamente.

Mejoras autorizadas, implementadas y publicadas:

1. Abrir la operación desde el contacto y continuar en una sola pantalla con personas, inmueble, documentos y próxima acción relacionados; abrir desde el contacto el expediente provisional con documentos pendientes. La apertura contextual está implementada desde cliente y prospecto; protege la captura pendiente.
2. Separar el recorrido del propietario (captación, revisión, precio, intermediación, comercialización) del comprador (perfil, capacidad de compra, opciones, visitas, oferta) y relacionarlos al negociar un inmueble concreto.
3. Mostrar requisitos por etapa, quién debe resolverlos y una próxima acción con fecha. Distinguir recibido, revisado, pendiente y observado; permitir pausa, regularización o descarte. No confundir un documento recibido con un dictamen favorable.
4. Condicionar publicación y avance a los controles del proceso que correspondan, con evidencia y responsable. Antes de cerrar, distinguir firma, condiciones de pago, entrega y seguimiento posterior; no marcar todo como concluido por cambiar una etiqueta.

La reforma debe conservar expedientes y permisos existentes. Las reglas jurídicas, contractuales y fiscales deben especificarse y validarse antes de convertirlas en bloqueos del panel.

#### Flujo guiado de captación y compra — implementación autorizada 13/10/2026

**Objetivo:** conducir al asesor desde el contacto hasta cierre, entrega y postventa, con requisitos, contexto y siguiente acción visibles. Moisés autorizó ejecutar las cuatro mejoras; esta sección contiene especificación y tareas del mismo plan maestro.

**Diseño:** conservar las tablas, formatos y versiones actuales; añadir a cada expediente una guía privada `flujo` (JSON versionado) con ruta `captacion` o `compra`, estado activa/pausada/regularización/descartada, motivo y revisiones con soporte, vigencia cuando corresponda y actor/fecha registrados por servidor. La guía es operativa: no emite dictámenes ni certifica cumplimiento jurídico. El responsable debe aportar la revisión competente y sus condiciones.

**Rutas de venta de vivienda:** propietario: entrevista → documentación y factibilidad → precio, intermediación y materiales autorizados → oferta → firma/pago según contrato → entrega → postventa → archivo. Comprador: perfil y capacidad de compra → opciones → visitas → oferta → revisión e instrumento de operación → firma/pago según contrato → entrega → postventa → archivo. Relacionar ambas operaciones cuando se elija el inmueble; no crear una parte vendedora ficticia cuando intervenga otra inmobiliaria: admitir contraparte externa identificada y documentada.

**Reglas:** el folio real sigue documental. Documentos recibidos no satisfacen una revisión. Las revisiones necesitan soporte; controles de factibilidad necesitan vigencia declarada. Avanzar solo al paso inmediato, con requisitos previos completos y próxima acción con fecha/responsable; el archivo final exige resolver o descartar las tareas abiertas y no requiere inventar otra tarea; retroceder o pausar con motivo conservado en actividad. No avanzar con observaciones abiertas. Separar firma, condiciones de pago, entrega y pendientes de postventa. La publicación nueva requiere expediente de captación vinculado con revisión y autorización; inmuebles ya publicados e históricos se preservan y se explican. Cambiar la ruta no permite eludir controles acumulados. No activar proveedores externos ni ampliar accesos. La guía cubre venta residencial; renta, administración y otras operaciones conservan su seguimiento manual. Los históricos conservan etapa; pueden adoptar la guía sin reiniciarse y deben satisfacer requisitos acumulados antes del siguiente avance. Cambios de contexto invalidan la capacidad de aprobación de revisiones anteriores, preservando evidencia y el historial; las tareas se reconcilian con el nuevo contexto dentro de la misma transacción. La excepción de publicación toma exclusivamente el estado anterior persistido por el servidor; después de despublicar, volver a publicar exige la guía.

**Archivos e interfaces:** `src/lib/formatos/operation-workflow.ts` define rutas, requisitos, esquema y evaluación visible; `expediente-operations.ts` amplía etapas; migración compatible añade guía y validación transaccional de avance/publicación; rutas API incluyen guía y vínculo de inmueble; formulario contextual y `operation-workflow-panel.tsx` conducen captura; Cliente/CRM ofrecen Abrir operación; ProcessStageWorkspace distingue ruta y etapa y reúne entrega/postventa. El editor genérico documental y sus emisiones permanecen disponibles en las pestañas del expediente.

- [x] **GUIA-01 · Datos y controles.** Probar rechazo de saltos, recepción sin revisión, evidencia vacía, revisión vencida, acceso de otro asesor, reversión/versiones, publicación sin autorización y conservación/restauración de expedientes anteriores. Implementar validación en PostgreSQL además de evaluación del formulario.
- [x] **GUIA-02 · Pantalla y apertura contextual.** Abrir desde cliente/contacto con datos disponibles, escoger ruta, vincular inmueble posteriormente y relacionar contraparte interna o externa. Mostrar pasos, requisitos y avance; guardar sin perder captura y mantener límites de permisos. Probar vendedor/comprador, datos pendientes, fallos y respuestas tardías.
- [x] **GUIA-03 · Próxima acción y cierre.** Reutilizar tareas del expediente; pedir tarea abierta con responsable y fecha para avanzar. Separar entrega y postventa de cerrado y de firma/pago, con evidencia y pendientes explícitos. Probar tareas completadas/sin fecha y operación pausada.
- [x] **GUIA-04 · Validación y publicación.** Comprobar pruebas, lint, tipos, build, respaldo y restauración reales compatibles; revisión independiente del código y de las vistas; verificar escritorio/móvil y publicación del commit comprobado. Actualizar este registro con la entrega real.

#### Reforma operativa del panel — 13/10/2026

Diagnóstico revisado y aprobado para ejecución por Moisés: avisos de seguimiento visibles; indicadores que distingan los inmuebles Demo; mejor organización del expediente y de sus documentos; vínculo directo de tareas al expediente; vistas semanal y de próximos eventos. Esta iteración conserva identidad Fortius, formatos, versiones, permisos y tareas anteriores. No activa contabilidad, mapas, portal externo, integraciones de mensajería ni reglas jurídicas/comerciales nuevas.

**Objetivo:** retomar el trabajo de una operación desde su contexto y entender qué necesita atención. **Arquitectura:** reutilizar las colecciones y expedientes actuales; ampliar los contratos de tareas de forma compatible; consultas documentales de metadatos con autorización existente y paginación. **Tecnología:** Next.js, React, TypeScript y Supabase de las versiones instaladas; sin actualización de dependencias. **Referencia aprobada:** diagnóstico del panel del 13/10, conservado con capturas y revisión independiente fuera del repositorio.

- [x] **UI-01 · Resumen e indicadores.** Modificar `src/app/admin/page.tsx`, `workspace/today.tsx`, `commercial-metrics.ts`, Reportes y Territorio. Excluir Demo por defecto de conteos operativos, con inclusión explícita; mantener los ejemplos en inventario. Mostrar contactos atrasados/de hoy y avisos sin próxima acción sin cambiar datos. Reportes separa periodo, situación actual e histórico y abre registros afectados. Probar datos vacíos, Demo/real mezclados, contacto convertido y fechas de Tijuana.
- [x] **UI-02 · Expediente y documentos.** Reformar `src/app/admin/expedientes/page.tsx` y Documentos; conservar pestañas/editores/emisiones existentes. Separar la creación del recorrido de consulta, mostrar cliente/inmueble/responsable/siguiente tarea y pendientes de captura. Ofrecer lista documental paginada y buscable por formato/folio, sin copiar cuerpos privados a la respuesta de metadatos. Probar cambios sin guardar, respuestas tardías, acceso denegado y recuperación de errores.
- [x] **OPS-01 · Vínculo de tarea.** Ampliar `taskSchema`, `TaskForm`, Tareas y validación PostgreSQL con `expedienteId` UUID opcional; conservar contratos antiguos. Reutilizar Crear tarea relacionada y las políticas actuales: expediente visible/activo, cliente/inmueble/asesor coherentes. Probar persistencia/recarga, dos expedientes sobre el mismo inmueble, referencias incompatibles y acceso directo de identidades sintéticas. No ampliar permisos ni alterar registros anteriores.
- [x] **UI-03 · Agenda semanal y lista.** Añadir Semana y Próximos a Calendario conservando Mes y sus vínculos existentes. Aritmética de fechas sin depender de la zona del dispositivo; indicar contexto seleccionado antes de guardar. Probar cambio de año/mes, orden con/sin hora, estado vacío y navegación por teclado/móvil.
- [x] **Verificación local.** Lint, tipos y build de producción Turbopack aprobados; 522 pruebas de servidor y 258 de panel sin fallos. Regresiones comprobadas antes y después de corregir los casos de captura; permisos y persistencia probados con PGlite. Las 16 pruebas de herramientas verifican también la restauración de tareas vinculadas y respaldos anteriores; PostgreSQL recalcula la columna derivada, sin modificar el respaldo original. Revisadas 21 capturas en escritorio, tablet y móvil, modo oscuro y teclado; nueve ensayos independientes aprobados. La ampliación compatible de tareas está aplicada y registrada en la base actual de Fortius, sin crear registros de prueba ni copiar secretos a nuevas ramas.

**Control de publicación:** integrar el commit comprobado en `main` con pruebas remotas aprobadas y confirmar el estado Ready y el navegador autenticado en `fortiusinmuebles.com/admin`. La evidencia de código, capturas, base y liberación se conserva fuera de la carpeta activa.

**Criterios transversales:** no perder captura pendiente; ninguna referencia concede permisos; los conteos explican su conjunto; documento recibido no equivale a revisado; ausencia de datos no se presenta como fallo; no confundir aprobación local con despliegue o ERP completo. La migración de tareas se prueba en aislado y mantiene las ACL existentes antes de aplicar una ampliación compatible en producción.

#### Barra lateral y aplicaciones — 13/10/2026

*Registro histórico, reemplazado por la Fase C · 2 del rediseño (16/10/2026): ya no existen el orden personalizado, la ventana de aplicaciones ni los grupos Comercial/Gestión.*

Diseño aprobado: barra azul institucional con selección guinda, módulos agrupados en Comercial, Gestión y Herramientas; controles de configuración, sitio, contraer y salir al pie. Se conservan el orden personalizado, el ancho y los accesos existentes. El botón superior Aplicaciones abre una ventana con iconos y búsqueda local de los módulos disponibles para cada rol. Estos accesos no implementan las capacidades financieras, geográficas o de portal que siguen pendientes.

- [x] Aplicar barra lateral y ventana de aplicaciones; reutilizar un catálogo de rutas y permisos.
- [x] Comprobar teclado, búsqueda, cierres, navegación, permisos y adaptación a escritorio, tablet y móvil.
- [x] Comparar capturas con las propuestas y cerrar los hallazgos de revisión independiente.

Publicado en `main`, commit `90fb26c`, y confirmado Ready en Vercel. Acceso principal: `fortiusinmuebles.com/admin`. La evidencia técnica se conserva fuera de la carpeta activa.

#### Diseño aprobado del panel — 12/10/2026

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

## 4. «Siguiente fase — captación dentro del panel» (superada por el Orden vigente)

### Siguiente fase — captación dentro del panel

*Nota del 17/10/2026: el orden vigente está en «Dirección del producto y reglas vigentes».*

Después de la preparación local, comenzar por relaciones persona/inmueble (REL-01), permisos (SEG-01), equipo (USR-01), captación/conversión (CRM-01), expediente y próxima acción (OPS-01), publicación separada (PUB-01) e importación validada (DAT-01).

Antes de convertir propuestas en reglas efectivas, resolver DEC-02/03/04/05/09: recorrido inicial, capacidades, papeles/representación, criterios de avance y fuente de verdad. La aprobación general del ERP no decide por sí sola esas reglas. Se pueden preparar pruebas y diseños locales; no activar una política nueva por inferencia.

## 5. Registro de la preparación del 12/10/2026

### Registro de la preparación actual

| Comprobación | Estado | Evidencia / límite |
|---|---|---|
| Consolidación de instrucciones | Comprobada | Un único plan con los 42 entregables, alcance, tareas, estados y dependencias conservados. |
| Archivo recuperable y limpieza | Comprobada | 1,358 archivos retirados de 15 rutas; copia externa de 1,379 archivos con hashes y tamaños comprobados. |
| Verificación de aplicación | Aprobada localmente el 12/10 | npm run verify: lint, tipos, 499 pruebas backend, 211 de panel y compilación; salida 0. |
| Herramientas de recuperación y activos PDF | Aprobadas localmente el 12/10 | 12 pruebas, cero fallos y cero omisiones; recursos PDF comprobados. Caso de escape ejercido realmente con una unión de directorio en Windows. |
| Revisión independiente | Aprobada en revisión R2 | Criterios de plan único, fidelidad, recuperación, referencias, preservación y preparación local comprobados; cero hallazgos obligatorios abiertos. |

**Decisiones de ejecución de esta preparación:** mantener una sola carpeta y trabajar en rama local; conservar código y migraciones históricos que siguen siendo necesarios; guardar evidencia y copias fuera del repositorio. La prueba de escape conservó symlink de archivo en Linux y usa junction de directorio en Windows, comprobando primero que los bytes externos son accesibles y después que el verificador los rechaza. No se omitió ese caso ni se cambió la protección del respaldo. La referencia de API es [Node.js, fsPromises.symlink](https://nodejs.org/docs/latest-v24.x/api/fs.html#fspromisessymlinktarget-path-type).

**Preparación local terminada y comprobada.** *(Siguiente acción reemplazada el 17/10/2026 por el «Orden vigente» al inicio del plan.)* La siguiente acción registrada entonces era continuar la fase de captación, empezando por REL-01 y SEG-01, con DEC-02/03/04/05/09 resueltas antes de activar sus políticas. Los pendientes del proveedor siguen abiertos; el ERP completo no se declara terminado por ordenar archivos.

## 6. Implementación aprobada: 20 apps para asesores (13/10/2026)

### Implementación aprobada — 20 apps para asesores (13/10/2026)

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

#### Orden de entregas y aceptación
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

#### Estado de implementación — 13/10/2026

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

#### Publicación del núcleo local — 13/10/2026

- Identificado el destino existente: Vercel `tonala/fortius-inmuebles` y Supabase `qkkirjzhviqwvuqjnmei` (Fortius Inmuebles). Producción ya dispone de su clave de servidor; no se copió a otra rama. No se activaron proveedores externos.
- Ventana sin ediciones confirmada por el titular. Respaldo final anterior a la migración: 18 tablas, cinco buckets y seis objetos (1,149,580 bytes), con integridad y restauración local verificadas. Las 18 tablas conservaron exactamente sus datos tras las migraciones.
- Aplicadas únicamente las migraciones `20261014002133_apps_runs.sql` y `20261014002229_fortius_apps_integrations.sql`. Verificadas 26 tablas con RLS y el nuevo bucket privado.
- Versión del núcleo promovida en `https://fortiusinmuebles.com`; salud HTTP 200. El panel autenticado permite guardar, recargar, reabrir y consultar versiones del trabajo de prueba. La corrección solicitada elimina el PDF del conversor y bloquea también esa exportación en el servidor; su cálculo sigue visible en pantalla.
- Respaldo posterior: 26 tablas, seis buckets y seis objetos, verificado y restaurado en PostgreSQL aislado. Los tres ledgers internos sin permiso de lectura REST se conservan íntegros en el export propietario. El manifiesto registra por separado las tres lecturas REST denegadas, sin ampliar permisos ni declarar ese complemento completo. Las 32 pruebas y la revisión independiente de la corrección pasan.
- Lint, tipos, 642 pruebas backend, 313 del panel, compilación y comprobaciones de navegador aprobadas para la versión publicada inicialmente. La corrección de conversor vuelve a pasar las 35 pruebas afectadas, lint y tipos; debe pasar además la verificación remota del commit antes de incorporarse a main.
- `.vercelignore` excluye credenciales, respaldos y evidencia de pruebas. No se copiaron secretos a esta rama. El aviso pendiente de dependencias de desarrollo descrito arriba no aparece en los 116 manifiestos de ejecución inspeccionados.
- Solo existe una cuenta de personal en la base actual. La separación entre asesores tiene pruebas aisladas; el piloto con dos cuentas reales sigue pendiente. No se crearon cuentas ni se ampliaron permisos para simularlo.

**Pendientes conservados:** activación de firmas, OCR, consultas documentales y rutas; piloto de dos asesores autorizados; ensayo completo de recuperación de Auth/Storage en un destino aislado. Ninguno se declara completado por la publicación del núcleo local.

## 7. Proceso de comercialización: cobertura del 15/10, adaptación PROC, flujo FLUJO, cierre del 17/10 y «Qué sigue»

#### Cómo lo cubre hoy el panel

La guía actual del propietario tiene ocho estados internos (`captacion`, `documentacion`, `comercializacion`, `negociacion`, `cierre`, `entrega`, `postventa`, `cerrado`), validados también en PostgreSQL. La barra lateral muestra seis accesos con otros nombres: Captación, Preparación, Promoción, Negociación, Cierre y Postventa.

| Etapa del proceso | Estado interno actual | Requisitos para salir de la etapa (ya existentes) | Diferencia con el proceso |
|---|---|---|---|
| 0 Captación | `captacion` | Entrevista 02 | Cubierta. Quién autoriza la venta se pregunta como dato opcional; se verifica en la etapa 1. |
| 1 Verificación y precio | `documentacion` (primera mitad) | Titularidad 05, factibilidad 06 con vigencia, opinión de valor 07, precio 08 y decisión de captación | **Comparte estado con la etapa 2**; hoy no se distingue cuándo termina la verificación. |
| 2 Contrato y preparación | `documentacion` (segunda mitad) | Intermediación 09, levantamiento y material 04B, plan 10 y autorización de publicación | Igual que arriba. El PDF del 09 sigue bloqueado; la autorización se acredita con evidencia externa. |
| 3 Publicación y seguimiento | `comercializacion` | Comprador identificado para pasar a negociación | **Falta el seguimiento al propietario**: no hay registro visible del último informe (la app «Informe propietario» existe, pero no está ligada a la etapa). |
| 4 Visitas y ofertas | `negociacion` | Oferta 14, revisión para cierre 06, instrumento 15 y contraparte | **Las visitas no aparecen en la ruta del propietario**; solo en la del comprador. |
| 5 Cierre y entrega | `cierre` → `entrega` → `postventa` → `cerrado` | Firma y pago; entrega 16 con llaves e inventario; registro, honorarios y archivo | Cubierta, pero repartida en cuatro estados; el proceso la presenta como una sola etapa con pasos. |

#### Adaptación del panel propuesta (PROC)

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

#### Flujo del vendedor por documento (FLUJO), pedido del titular el 16/10/2026

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

## 8. Registros de publicaciones y entregas (12 al 18/10/2026)

#### Rediseño visual del panel según los bocetos — 18/10/2026

**Entrega a GitHub:** rama `claude/rediseno-panel-bocetos-6c8e5e`, sobre `main` después del PR #44 (`5748d6b`), [PR #45](https://github.com/M01535NT/fortius-inmuebles/pull/45) a `main` con auto-merge (merge commit) para integrarse cuando Verify apruebe. Este registro no acredita la fusión ni un despliegue: se comprueban en el PR y en Vercel.

- **Alcance (solo capa visual, LV-05):** tokens `admin-*` en el CSS del panel (esquinas 10/12/16/20 px y pastilla; sombras azul marino en reposo, al levantar y en la acción principal; lienzo, colores de estado) y kit ampliado (`Pill`, `Counter`, `Thumb`, `Avatar`, `Ring`, `Kbd`, `CardLink`, pestañas verticales, selector segmentado con pista). Marco: menú lateral flotante con el logotipo y la cuenta al pie, barra superior con buscador rápido (campo con Ctrl K y paleta con «Crear rápidamente») y «Nueva operación», encabezado y barra inferior flotante con «+» en celular. Hoy como tablero del director: operaciones en curso con anillo, lo que espera algo de ti, tareas, visitas y lo que vence en 7 días; filas con foto del inmueble o iniciales y pastilla. Operaciones con selector Lista · Tablero (la última vista se recuerda en el navegador como comodidad del dispositivo), filtro por fase en pista, foto y pastilla de fecha; tablero por fase con tarjetas. Una operación con portada (foto, nombre, datos, cuatro fases, Propietario, Llamar y WhatsApp), línea de tiempo de las etapas a la izquierda, secciones como lista y «Ahora toca» al centro. Inmuebles en galería con pastillas sobre la foto. Contactos como una sola lista con iniciales y pastilla de fecha y, en computadora, la vista previa de la persona señalada (Llamar, WhatsApp, lo que busca, presupuesto, siguiente paso, actividad y «Abrir ficha»). Nueva operación con los pasos a la izquierda y las entrevistas a medias a la derecha. Ventana de captura con avance «N de M secciones completas» y pastillas «Listo». Las pantallas sin boceto (fichas de personas, Agenda, Herramientas, Administración, Mi perfil) toman la misma escala con `src/app/admin/panel-uplift.css`. Tipografía ajustada con el titular (18/10/2026): Archivo en anchura 96 (92 en títulos) y pesos 620/600/540/400. Íconos: el titular eligió **Iconoir** (MIT) entre tres propuestas (Iconoir, Phosphor Regular, Phosphor Duotone; lienzo «Bocetos de íconos del panel»); `src/components/admin/icons.tsx` conserva los nombres anteriores y entrega el equivalente de Iconoir, con la dependencia nueva `iconoir-react` 7.12.1; el sitio público sigue con lucide. En modo oscuro el logotipo va sin placa, con letras blancas y el portal en azul marino y guinda (el titular descartó el acento rosa de la versión inversa).
- **No cambia:** rutas, API, permisos del servidor, base de datos, candados de avance, 409, protección de cambios sin guardar ni el sitio público. Única dependencia nueva: `iconoir-react` (MIT), autorizada por el titular. `panel.module.css` solo recibe los tokens; los estilos viven en los módulos de cada área y en `kit.module.css`.
- **Fuera por falta de datos en el sistema** (los bocetos los muestran como ejemplo): cobro esperado y cobros pendientes, meta de captaciones del mes, avalúo frente a oferta, perfil de leads compradores con «inmuebles que coinciden», notas por inmueble, tipo de cambio y el mapa de Inmuebles (EXT-09). «Mías / Todo el equipo» sigue solo en Operaciones para el administrador con asesor asignado.
- **Comprobaciones locales:** lint, tipos y las 354 pruebas del panel (tres pruebas de Hoy se actualizaron a la estructura nueva sin debilitarlas; la de navegación cubre la barra superior y la cuenta; las de navegador de Contactos y Mi perfil se actualizaron a la lista con vista previa y al menú de la cuenta); revisión pantalla por pantalla en el navegador con la sesión del titular en el servidor del worktree (escritorio y celular, claro y oscuro, foco con teclado), con sus ajustes de letra, íconos y logotipo; capturas con datos simulados a 1440 y 390 px en claro y oscuro sin desbordamiento horizontal, guardadas en `.superpowers/rediseno-capturas/` (fuera del commit, anteriores al ajuste tipográfico). `npm run verify` en local pasó lint y tipos; las pruebas de base de datos con PGlite fallan en esta máquina Windows («Unexpected process function …guard_guided_operation») sin relación con el cambio, y pasan en CI. Las pruebas de navegador del panel las corre Verify en CI (el puerto 3105 lo comparte otra sesión en esta máquina y la corrida local no fue fiable).
- **Límites:** las capturas usan datos simulados; el rendimiento y los permisos remotos no se midieron; la publicación en el dominio la hace Vercel desde `main` y se comprueba después de la fusión.
- **Ajustes tras la revisión del titular (18/10/2026, PR #45 fusionado como `67ba41a`; rama `claude/tarea-y-listo-de-operacion`):** en el paso «Listo» de Nueva operación, «Abrir la operación» y «Corregir la entrevista» no respondían porque el candado de «respuestas sin guardar» seguía activo al desmontarse la entrevista; ahora se libera al terminar. La ficha y la captura de tareas, la captura de prospecto y de cliente (ventana dentro de Contactos) y la edición del perfil del prospecto toman grupos de campos con la escala del kit (`src/components/admin/form.module.css`): título con estado, vencimiento y responsable, pasos como lista con avance, historial como línea de tiempo y secciones plegables. Las reglas de guardado, el 409 y los nombres de los campos no cambian. Herramientas se agrupa por categoría (favoritas primero) con buscador, selector de categorías y contador; las favoritas siguen siendo una preferencia del navegador por usuario. Comprobado en local con lint, tipos, las 354 pruebas del panel y una entrevista de prueba terminada en el navegador (datos de ensayo autorizados). En CI fallaron dos pruebas de navegador que esperaban textos anteriores («Descripción, categoría y vínculos» y el buscador como cuadro de texto); se actualizaron al diseño nuevo sin debilitarlas y la rama se puso al día con `main`.

#### Cuestionario único y respuestas del titular — entrega documental 17/10/2026

**Entrega a GitHub:** rama `docs/cuestionario-unico`, sobre `main` después del PR #43 (`e3db22c`). El estado de Verify y de la fusión se comprueba en su PR; este registro no acredita un despliegue.

- **Alcance:** un solo cuestionario, `docs/erp-crm/CUESTIONARIO_TITULAR.md` (119 preguntas), que reemplaza a `docs/erp-crm/PREGUNTAS_TITULAR.md`, `PREGUNTAS_PLAN_ERP_CRM.md` y las preguntas locales del panel, con una tabla de procedencia. El titular respondió por audio los grupos A a L (salvo lo pospuesto); se escribieron las reglas RP-90 a RP-99, las entregas COR-11, COR-12, PUB-02, DOC-14, DOC-15, FIR-01 e IA-01, las decisiones DEC-29 y DEC-30, la dirección visual LV-05 y las autorizaciones del titular en `AGENTS.md` (base actual con datos de prueba, publicación con verificación aprobada).
- **Comprobaciones:** lectura de las secciones cambiadas, identificadores únicos (119 preguntas, 119 respuestas), sin referencias a los archivos eliminados fuera de `tmp/`, y diff sin errores de espacios. Copias de los originales en `tmp/2026-10-17-cuestionario-unico/`.
- **Límites:** solo Markdown; sin cambios de código, pruebas, dependencias ni migraciones. Las reglas nuevas no están implementadas. Los bocetos visuales viven en un lienzo privado de claude.ai, fuera del repositorio.

#### Cuestionario complementario — entrega documental 17/10/2026

**Entrega a GitHub:** [PR #43](https://github.com/M01535NT/fortius-inmuebles/pull/43), commit documental `43815d70470e02aeab2f6efc9442ca440b3702f9`, preparado sobre `main` después del PR #42 (`1de616e`). El estado de Verify y de la fusión se comprueba en el PR; este registro no acredita por sí solo un despliegue.

- **Alcance:** complemento P01–P84 conciliado con las reglas vigentes: nueve temas resueltos, dos remisiones completas y 73 campos de respuesta (16 detalles complementarios y 57 preguntas directas). Se conservan las 73 preguntas del cuestionario vigente y la prioridad de A y B. No cambia el orden de implementación.
- **Comprobaciones locales:** lectura completa, revisión independiente aprobada, identificadores y correspondencias comprobados, 99 referencias locales existentes y diff sin errores de espacios. Los documentos locales ajenos a esta entrega se preservaron y quedaron fuera del commit.
- **Límites:** solo Markdown; sin cambios de código, pruebas, dependencias o migraciones, ni escrituras en datos productivos. La revisión documental no acredita la implementación de los paquetes pendientes ni requiere reconstruir el producto. CI, integración y publicación se verifican por separado.

#### Panel guiado y flujo del vendedor publicados — 17/10/2026

**Estado: integrado en main y publicado el 17/10/2026, America/Los_Angeles.** [PR #39](https://github.com/M01535NT/fortius-inmuebles/pull/39) (rama `feat/panel-guiado`), commit de fusión `58bdafd`, despliegue de producción `dpl_6mGokWD7AamPh2VkmkDH9Tmkpfiw`, servido en https://fortiusinmuebles.com.

- **Alcance:** panel guiado (fases 1–7), flujo del vendedor en diez etapas con «Iniciar» y descargas, formatos 01–19 con el diseño de sus plantillas, opinión de valor 07 en PDF y Excel, candados del arranque en el servidor, montos con formato de moneda y la herramienta «Documentos sin expediente». Incluye lo que `main` ya traía del PR #36.
- **Comprobaciones:** `npm run verify` en local (lint, tipos, 738 pruebas de servidor, 347 del panel y compilación) y Verify remoto aprobado, con las 52 pruebas de navegador del panel y las 70 públicas. Se actualizaron 12 pruebas de navegador que esperaban el panel anterior (columna «Prospecto», diez etapas, 17 herramientas, prospecto del propietario y una espera tras volver al modo claro antes de medir contraste); se corrieron antes en una copia aislada sin `.env.local`.
- **Sin migraciones** ni cambios de credenciales o permisos.
- **Hallazgo del despliegue:** el dominio seguía fijado al despliegue del 14/10 (`dpl_8hobqhkN8TLwoto1yq7PvKC6DD2m`), así que los despliegues nuevos de `main` quedaban listos sin publicarse. Se promovió el nuevo a producción; el despliegue anterior queda como opción de recuperación. Verificado en el dominio: `/admin`, `/brand/pie-documento.png` y `/plantillas/07_OpinionValor.xlsx` responden 200. El interior del panel no se revisó en producción porque requiere iniciar sesión.
- **Pendiente:** que el titular revise el panel en producción con su sesión. Si algo falla, se puede volver a promover `dpl_8hobqhkN8TLwoto1yq7PvKC6DD2m` en Vercel.

#### Consolidación de main y publicación — 14/10/2026

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

#### Captación y entrevista preparada — implementación 13/10/2026

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

#### Publicación anterior comprobada — folios

Rama `codex/folios-automaticos`, PR #22, código funcional `0dfff7242d8a0cb8233d3ffbb28ee1b385352690`. Migración `20261014031535_automatic_folios.sql` aplicada y registrada en Fortius; 26 tablas con RLS conservadas. Respaldo privado de las 26 tablas y restauración aislada aprobados. Preparación Vercel: `fortius-inmuebles-92cd6vae7-tonala.vercel.app`. Publicado en `fortiusinmuebles.com/admin` después de Verify #140 aprobado para el commit funcional exacto. PR #22 integrada en `main` (`84875d614d5b41ebaf54ec3c986d2beb5bba7a8a`); Vercel Ready, despliegue `dpl_6KzgZovFXMPXu11tFboWkLMdJyPM`, promovido al dominio. Formulario autenticado comprobado: folio de inmueble no editable y mensaje de asignación al guardar. La revisión automática rechazó insertar el inmueble ficticio de QA; no se guardó. El ensayo de creación y restauración es aislado, no una inserción real.

#### Publicación comprobada — flujo guiado, 13/10/2026

Rama `codex/flujo-guiado`, PR #23 integrada en `main` (`2ee0b5202ed0d4c04865fb975eb895c1f444e4ba`). Versión comprobada y desplegada: `3de3f53302449354bf82e5cbc6de60a9d7508635`, con el mismo contenido que la integración. Código funcional original: `4e991785ffd8a0e653f5185d91c79c07655fc86f`.

- Publicadas las cuatro mejoras: abrir desde CRM/Clientes, rutas separadas de propietario/comprador, requisitos con soporte y próxima tarea en el expediente, y controles de avance/publicación con firma/pago, entrega, postventa y archivo separados. La captura se conserva ante rechazos y salidas canceladas.
- Aplicada `20261014033544_guided_operations.sql`: 26 tablas con RLS, dos controles activos, funciones internas sin ejecución pública. Los datos de las 26 tablas se conservaron en la comparación anterior/posterior, excluyendo solo las columnas nuevas con valor nulo. Respaldo propietario restaurado en base aislada; también se verifican referencias JSON de contraparte.
- Verificación local: 668 pruebas de servidor, 327 del panel, 33 de respaldo/restauración, lint, tipos y compilación. Revisión independiente de código y nueve capturas de escritorio/móvil aprobada, sin hallazgos obligatorios abiertos. En navegador aislado, propietario y comprador avanzan con revisión/tarea; recepción, observación y pausa bloquean; recargar conserva el avance y cancelar la salida conserva el borrador.
- Verify #143 (`38513113363`) aprobado para el commit completo `3de3f53302449354bf82e5cbc6de60a9d7508635`: respaldos, compilación, dependencias de producción, fuentes PDF, 70 pruebas de navegador público, 34 del panel y siete de captación pública. La medición Lighthouse de rendimiento móvil de la página pública es opcional y no se ejecutó en esta entrega; no se declara aprobado su presupuesto de rendimiento.
- Vercel `dpl_F3vV72WSv24CyCHrEPPViv4jqZUS`: Ready y control Fortius Verify aprobado antes de la promoción. URL de la versión: `https://fortius-inmuebles-ppkdtj284-tonala.vercel.app`. Dominio `https://fortiusinmuebles.com/admin/expedientes` comprobado contra ese despliegue; salud HTTP200, ruta nueva protegida con HTTP401 sin sesión y formulario autenticado con ambas rutas y folio no editable.
- No se guardaron operaciones ficticias en producción. El recorrido de creación/avance se comprobó en PostgreSQL aislado; la aceptación operativa con datos reales y dos asesores sigue pendiente. Concurrencia entre conexiones PostgreSQL independientes y recuperación completa de Auth/Storage permanecen sin comprobar. Firmas, OCR, consultas documentales y rutas externas siguen diferidas con `FORTIUS_APPS_ENABLED=false`.

La revisión automática bloqueó el ensayo ficticio productivo y exigió verificar esquema, CI y Ready antes de publicar; se siguió ese orden y se usó la base aislada para las escrituras de prueba. El registro posterior es documental y no cambia el producto desplegado.

## 9. «Estado vigente» tal como estaba el 11/11/2026, antes de la depuración

### Estado vigente — 26/10/2026

**Qué hay construido (en `main`):** panel guiado (Fase C, PR #39, publicado en el dominio el 17/10/2026); Operaciones según el boceto C (lista «Esperan algo de ti / Al día» con filtros por fase, «Ahora toca», ventana de captura por documento); las 10 etapas del vendedor agrupadas en cuatro fases en pantalla (Conocer · Revisar · Preparar y publicar · Vender y cerrar); entrevista 02 y levantamiento 04 sencillos; menú lateral y membrete común en Word y PDF; formatos 01–19 en PDF y Word, salvo el PDF del contrato 09, que sigue bloqueado hasta resolver DOC-09 y por ahora sale solo en Word; opinión de valor 07 en PDF y Excel; «Documentos sin expediente». Los cambios del boceto C en adelante se integraron en `main` el 17/10/2026; su publicación en el dominio no está comprobada en este registro.

**Qué es este plan desde el 17/10/2026:** reglas de producto (RP-01 a RP-99) y paquetes listos para implementar (SIM, NAV, LV, COR, CAP, FCH, MOT, HER, MRP). Nada de esos paquetes está construido salvo lo que el boceto C ya resolvió (ver el estado de cada corrección en SIM).

**Decisiones vigentes que más cambian el trabajo:** ERP exclusivo de Fortius (RP-01); ningún dato faltante detiene el flujo (RP-82); descargar siempre, y descargar no es aprobar (RP-77, RP-85); entrevista con lo necesario para que el proceso funcione y opción «Ampliar» (RP-89); procesos por tipo de operación con motor editable (RP-79); las cuatro fases del boceto C para agrupar las etapas en pantalla; **una persona es prospecto hasta que firma su contrato, y un inmueble está captado solo cuando el propietario firma la intermediación** (RP-90 a RP-92); **Fortius solo representa al propietario: compradores y arrendatarios son leads de Fortius y contraparte de sus clientes, nunca clientes de Fortius** (RP-93).

**Pendientes reales, en orden:** USO-01 (observar el panel actual con tres personas) y MRP-01 (matriz de reglas por ruta); correcciones COR-01 a COR-10; pendientes de formatos (diseño y fotos del 07, DOC-06, decisión de DOC-09); después, el bloque 2 del «Orden vigente». En paralelo, la continuidad del bloque 0, en especial la recuperación completa: los respaldos de base de datos de Supabase no incluyen los archivos de Storage (REC-01).

**Nueva forma de llenar los formatos (titular, 27/10/2026, DEC-31):** cada etapa muestra su formato de Fortius tal como sale en PDF, y se llena desde el sistema pulsando sobre el documento; lo capturado aparece en la hoja al momento y el PDF sale igual a lo que se ve. Están construidos y probados los siete levantamientos (04A–04G), con el acomodo del Word del 04A y casillas en lugar de listas con diagonales, en la rama `feat/levantamiento-04b-en-vivo`, sin integrar a `main` y en revisión del titular en localhost. Los demás formatos siguen por grupos en el orden de las etapas (ver «EXT-12» en «Capacidades adicionales y disparadores»). Los folios no se capturan: el sistema asigna el de la operación (`EXP-…`) y el del inmueble (`FORTIUS-…`), y los documentos los imprimen solos.

**Revisión del flujo (27/10/2026, rama `feat/levantamiento-04b-en-vivo`):** dos revisiones del código, una por tipo de cliente y otra por tipo de inmueble, quedaron resumidas en el diagrama [`docs/diseno/flujos-procedimientos.html`](../diseno/flujos-procedimientos.html). Lo que señalaron ya tiene entrega en este plan:
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

**Segunda revisión del panel y recorrido de una llamada (02/11/2026):** el agente revisó las 24 pantallas del panel con datos simulados (1440 y 390 px, claro y oscuro) y ensayó la llamada de un propietario con casa invadida y saldo del Infonavit. Resultado: las correcciones **C33 a C46** y las entregas **SIM-13 a SIM-15** (sección «Simplificación de la interfaz»), el bloque «Llamada con condición jurídica» con **CAP-05 y CAP-06** (sección «Proceso, captura y documentos», A), las correcciones **COR-14 y COR-15**, el módulo «ocupación irregular o invasión» en MOT-02 y las decisiones pendientes **DEC-38 y DEC-39**. Orden propuesto para construir: SIM-13 (fallas visibles), SIM-07 (fichas de persona), SIM-14, CAP-05 con COR-14, y después el resto. El mismo día se revisó el supuesto de **inmuebles compartidos por otra inmobiliaria**: la regla RP-95 existe, la entrega PUB-02 sigue sin construir y la puerta de publicación solo se comprueba en el navegador (**COR-16**); el diseño propuesto está en «Proceso, captura y documentos», bloque E, con la decisión **DEC-40**. Después se probaron siete casos más (quien busca renta por teléfono, captar para una demanda sin inventario, propietario con avalúo, comprador con Infonavit, prospecto del sitio web, prospecto que no contesta, inmueble vendido): bloque F del mismo paquete, con **COR-17 a COR-22** y **DEC-41**. El método queda fijado: el titular plantea casos, el agente los recorre y anota aquí qué falla y qué cambia. El bloque G del mismo paquete cubre la jornada del asesor (cuándo usa Hoy, agenda, tareas y notas), lo que hoy distingue al administrador del asesor (el asesor edita configuración, sitio web, blog y cualquier inmueble: **COR-23**; alta de inventario heredado: **COR-24**) y el veredicto de las 17 herramientas con casos (**HER-05**: abrirlas desde donde están los datos), con las decisiones **DEC-42 y DEC-43**. El bloque H mide cuánto cuesta cargar una operación (unas 500 celdas, 15 documentos y 10 PDF antes de publicar) y propone la carga inicial por lote (**COR-25**), enseñar dentro del sistema (**COR-26**), la prueba de uso cronometrada (**USO-02**) y la captura por lista en celular (**DEC-44**).

**Tercera revisión: simplificar la experiencia (11/11/2026):** a pedido del titular, el agente auditó la UI/UX de las 25 pantallas y los menús del panel en la rama `feat/seo-integral` (1440 y 390 px, datos simulados). El diagnóstico: lo que complica el panel es que la misma cosa vive en varios lugares (siete listas de pendientes en Hoy, dos asistentes para «¿qué quiere hacer?», cuatro entradas para crear, seis estados y cuatro filtros para una persona, seis listas de vínculo en cada formulario, un problema dicho cuatro veces en la operación, el inmueble repartido en dos páginas, nombres cruzados como «Más»/«Herramientas» y «Mi cuenta»/«Mi perfil»). Resultado: las correcciones **C47 a C60** y las entregas **SIM-16 a SIM-19** (sección «Simplificación de la interfaz», «Tercera revisión») y las decisiones pendientes **DEC-45 a DEC-47** (nombre del asistente único, estados visibles del prospecto y cuándo se abre sola la guía). Orden propuesto: SIM-16 (Hoy en tres bloques), SIM-07 con C58, SIM-17, SIM-18, SIM-19, el resto de SIM-15 y las fallas de celular (C59) y de error acotado (C60). **El titular aprobó empezar por SIM-16 el mismo día y quedó construida en la rama `feat/seo-integral` (ver su fila en «Entregas del paquete SIM»), pendiente de su revisión en localhost.**

**Color del lienzo del panel (titular, 11/11/2026):** el titular cambió en `src/app/admin/panel.module.css` el lienzo claro del panel de crema `#F5F1EB` a **`#F8F8FF`** y el borde de las tarjetas de `rgba(6, 31, 63, .06)` a **`rgba(6, 31, 63, .11)`**. Es la referencia vigente para LV-07 y LV-08; el modo oscuro no cambia y el crema `#F5F1EB` se conserva como texto y acento sobre fondos oscuros. Aplica solo al panel: el sitio público conserva sus colores.

**Seguridad de dependencias, 25/10/2026:** Next.js 16.4.3 y zod 4.6.7 por avisos de seguridad, integrados en `main` con el [PR #51](https://github.com/M01535NT/fortius-inmuebles/pull/51).

**Preguntas abiertas para el titular:** [`docs/erp-crm/CUESTIONARIO_TITULAR.md`](CUESTIONARIO_TITULAR.md), cuestionario único que reúne y depura los tres anteriores (preguntas al titular A–K, complemento P01–P84 y preguntas para precisar el panel); conserva los identificadores A–K y una tabla de procedencia. Cada pregunta dice qué entrega bloquea y trae una propuesta; cada respuesta se integra en este plan como regla o decisión, según «Cómo se mantiene este plan». El archivo no es un plan paralelo: solo guarda preguntas y respuestas.

**Integración de este plan:** las reglas y paquetes del 17 y 18/10/2026 se integran en `main` con el [PR #41](https://github.com/M01535NT/fortius-inmuebles/pull/41) (solo documentación; Verify aprobado sobre el contenido revisado).

**Rediseño visual por área (LV-05), 18/10/2026:** ya está en `main`. El panel según los bocetos aprobados entró con el [PR #45](https://github.com/M01535NT/fortius-inmuebles/pull/45) y sus ajustes con el [PR #46](https://github.com/M01535NT/fortius-inmuebles/pull/46): paso «Listo» de Nueva operación, ficha y captura de tareas, captura de prospecto y cliente, y Herramientas por categoría con buscador. El sitio público con la dirección «Nocturno» entró con el [PR #47](https://github.com/M01535NT/fortius-inmuebles/pull/47): Inicio, menú, footer y todas las páginas interiores salvo la ficha del inmueble (ver «Sitio público · Inicio (titular, 18/10/2026)»). Solo cambia la presentación; las reglas RP-90 a RP-99 y los paquetes siguen pendientes.

**Ficha del inmueble «Escenario» (titular, 18/10/2026):** el titular eligió la ficha completa 1 «Escenario» del lienzo, con visor que cambia entre fotos, video, 360 y ficha técnica. Ajustes aprobados: ubicación antes de los perfiles, la ficha técnica muestra la fuente de cada dato, «Solicitar visita» propone día y el asesor confirma, planos y otros PDF piden nombre y teléfono y la ficha técnica se descarga libre. Sin sección «Pensada para»: la ficha técnica es técnica, no comercial. Mapa: embed de Google por zona en marco nuevo, sin API. Construido el 18/10/2026: la página `src/app/inventario/[slug]/page.tsx` con banda nocturna, visor con pestañas solo cuando hay contenido (fotos, video, 360 y vista previa de la ficha técnica con descarga libre), franja de datos clave, índice de secciones fijo, descripción, características por grupo (si faltan, las amenidades), beneficios, ubicación con mapa por zona y lugares filtrables por categoría, ficha técnica con la fuente de cada superficie, documentos (con datos del interesado) y costos, preguntas, tarjeta fija de visita en la que el interesado propone un día y el asesor lo confirma, canales directos, compartir con WhatsApp, correo, enlace y código QR, y similares. Las secciones sin datos no aparecen y la renta no muestra crédito. El panel captura beneficios, características por grupo, costos recurrentes y la categoría de cada lugar cercano (sección «Ficha pública» del formulario del inmueble). Integrada en `main` con el [PR #48](https://github.com/M01535NT/fortius-inmuebles/pull/48) (página y panel) y el [PR #49](https://github.com/M01535NT/fortius-inmuebles/pull/49) (migración, autorizada por el titular), ambos el 18/10/2026 con Verify aprobado. La migración `supabase/migrations/20261018120000_property_escenario_fields.sql` amplía la validación de escritura y la proyección pública para esos campos; el historial remoto de Supabase la registra como aplicada (consulta del 25/10/2026). El 25/10/2026 las fichas publicadas de prueba responden en fortiusinmuebles.com con el diseño nuevo; ningún inmueble de prueba tiene todavía beneficios capturados, así que esa sección no se ha visto con datos en producción. Pendiente del titular: si conserva las imágenes equirrectangulares originales de sus recorridos de Kuula, el 360 puede servirse con un visor propio (Photo Sphere Viewer, licencia MIT); si no, se mantiene el embed de Kuula.

## 10. Lenguaje visual: registro del sitio público (18 al 30/10/2026)

**Sitio público · Inicio (titular, 18/10/2026):** a partir de sus capturas del sitio, el agente propuso tres direcciones en el lienzo «Rediseño sitio público Fortius» (claude.ai, privado del titular). El titular eligió la **C · Nocturno** para Inicio: portada oscura en ambos temas con foto a sangre, barra transparente con píldora de enlaces, menú de hamburguesa a pantalla completa que se abre en círculo, buscador de vidrio (operación, tipo y zona del inventario publicado), marquee infinito de zonas al pie de la portada (pausable), «Por qué Fortius» como **expediente de ejemplo** que se completa al desplazar, y el método **«Seis etapas. Un responsable.»** con recorrido horizontal fijado en escritorio y tarjetas apiladas en móvil. Esa portada usa esquinas suaves (14–24 px); este cambio reemplaza la regla de esquinas casi rectas solo en Inicio. Implementación: `src/app/page.tsx`, `src/components/home/nocturno-*`, `src/app/nocturno.css`. **Nosotros** (18/10/2026) sigue el artboard del lienzo: portada oscura con el asesor y su tarjeta de contacto, misión y visión como dos tarjetas (blanca y borgoña), valores numerados en rejilla y el video institucional en marco oscuro, solo cuando el panel tiene URL (`src/app/nosotros/`, `src/components/about/`). El mismo día se aplicaron los bocetos del lienzo al resto del sitio con un sistema común de páginas interiores (`src/app/publico.css`: cabecera oscura, tarjetas de esquinas suaves, píldoras y campos): footer nocturno «Hablemos», Blog en formato revista y artículo con índice fijo y compartir, Inventario con filtros en la cabecera, vista con mapa por zona (embed de Google por zona, sin API) y tarjetas compactas con «Comparar» en el pie, páginas por segmento con lectura del espacio e inventario del segmento, Comprar con pasos, Vender con asistente de inicio que prellena la evaluación, línea de tiempo y autoevaluación, Revisión documental con reporte de ejemplo, Herramientas con vistas previas, calculadoras con cabecera propia, Contacto nocturno con motivos en tarjetas, Avisos en biblioteca y Gracias con los tres momentos. La ficha «Escenario» del inmueble se construyó después, el mismo 18/10/2026 (ver «Estado vigente»). **Temas claro y oscuro (titular, 25/10/2026):** reemplaza «oscura en ambos temas» y la cabecera oscura de este párrafo. En claro, Inicio, las cabeceras interiores, Nosotros, la ficha, el footer y el menú son crema o blancos con texto azul y sin degradados oscuros; en oscuro conservan el Nocturno con su resplandor vino. La foto de portada de Inicio se mantiene en ambos temas con un velo suave. Los colores por tema son las variables `--ns-*` de `src/app/publico.css`. **Ajustes del titular (25/10/2026):** la marca no lleva rosa (acento borgoña sobre claro y crema sobre oscuro, ver `docs/brand.md`); logotipo sin placa sobre la foto; botón de tema en la barra de Inicio; portada sin la etiqueta sobre el titular; marquee sin rombos ni contornos; etiquetas de sección en texto normal en lugar de mayúsculas monoespaciadas; sin numeración decorativa ni texto fantasma; animaciones con curva suave y duraciones más largas, con la opacidad adelantada para que el texto se lea mientras se mueve. **Propiedades destacadas como baraja (titular, 30/10/2026):** el titular eligió, entre doce bocetos del lienzo «Bocetos de Propiedades destacadas» (claude.ai, privado del titular), las **tarjetas apiladas a pantalla completa**: cada destacada ocupa la pantalla bajo la barra fija, se queda arriba y la siguiente la cubre. Si hay destacadas de varios tipos aparecen botones «Todas», uno por tipo en venta («Casas», «Terrenos»…) y «En renta»; cada botón cambia la baraja, que lleva cinco propiedades como máximo, y ofrece el enlace al inventario con ese filtro. Reemplaza la tarjeta grande con dos filas y el tope de tres destacadas. Implementación: `src/lib/destacadas.ts`, `src/components/home/nocturno-sections.tsx` y `src/app/nocturno.css`. **Título del método (titular, 30/10/2026):** «Así vendemos tu propiedad.», sin etiqueta encima. Reemplaza «Seis etapas. Un responsable.», que prometía un solo asesor durante toda la venta: quien capta no siempre es quien vende. El título sigue editable en Secciones, grupo «Método»; un valor guardado igual al anterior se actualiza solo.

## 11. LV-06: especificación de «Una operación» según el boceto D «Moderno» (29/10/2026)

**LV-06 · Una operación según el boceto D «Moderno» (titular, 29/10/2026). Lista para construir; se empieza solo cuando el titular lo pida.** El agente propuso cuatro direcciones para la pantalla de una operación en el lienzo «Bocetos de una operación» (claude.ai, privado del titular): A · Ruta arriba, B · Mesa de trabajo, C · Minimalista y **D · Moderno**. El titular eligió la **D**. La fuente del boceto está en `docs/diseno/operacion-boceto-d/OperacionModerno.dc.html`, con los datos de una operación de prueba (EXP-000006, etapa 5 «Dictamen jurídico»). Solo cambia la presentación de `/admin/operaciones/[id]`; no cambian rutas, API, base de datos, candados de avance, requisitos, 409, protección de cambios sin guardar ni permisos.

- **Disposición en computadora:** pantalla partida. A la izquierda, un **panel azul marino** (#061F3F, esquina 28 px, de 380 a 460 px de ancho, alto de la vista) y a la derecha las piezas de la etapa en una **rejilla de 6 columnas con piezas de distinto tamaño** (esquina 22 px, sin borde, fondo blanco sobre el lienzo `--canvas`).
- **Panel azul, de arriba abajo:** regreso a Operaciones (círculo de 44 px) y folio; una línea con la persona y lo que quiere («Moises Nuñez vende su casa»); el **número de etapa enorme** en Archivo condensado (anchura 62, peso 700, unos 168 px) con «/10» tenue al lado y, debajo, el nombre de la etapa (anchura 80, peso 600) y el nombre de la fase en texto secundario; las **10 etapas como barras**: hechas en guinda, la actual blanca, más gruesa y con letra mayor, las siguientes tenues; cada etapa conserva su botón y su nombre accesible actual («N · etapa: lista / aquí vas / pendiente»). Al pie, el **propietario** con iniciales o foto, «Propietario», y Llamar y WhatsApp como botones redondos de 44 px con `aria-label`.
- **Piezas de la derecha:**

## 12. Simplificación (SIM): correcciones resueltas, texto original

| # | Hoy (lo que se vio) | Corrección |
|---|---|---|
| C06 | El pie de la barra lateral tiene cinco elementos; «Herramientas» muestra «16» (y ya son 17; el menú del celular dice «Ver las 16 herramientas»). | Pie con nombre y foto; al tocarlos, menú con Mi perfil, tema, Ver sitio y Cerrar sesión. Quitar el número de Herramientas y el «16» del menú del celular. (`workspace/guided-nav.tsx`) |
| C08 | Cinco botones de alta repartidos («Nueva operación», «Agregar contacto», «Agregar inmueble», «Agendar», «Agregar tarea»). | Un botón «+ Nuevo» arriba de la barra lateral y el «+» del celular abren un menú corto: Nueva operación (primera), Contacto, Inmueble, Cita, Tarea. Los botones de cada página pueden quedarse como atajo secundario. (`workspace/quick-create.ts`, `guided-nav.tsx`) |
| C09 | Tres botones «Continuar» iguales. | Toda la tarjeta es el enlace; una flecha discreta indica que se abre. |
| C10 | «Pedir escritura» aparece en «Esperan algo de ti» y otra vez en «Tareas de hoy». | Lo que ya sale en «Esperan algo de ti» no se repite en «Tareas de hoy». |
| C11 | «Buenas noches» sin nombre. | «Buenas noches, <nombre>» con el nombre del asesor vinculado (o del perfil). |
| C13 | La barra de avance de 10 pasos se amontonaba en dos renglones. | **Resuelto por el boceto C:** círculos numerados con «Etapa N de 10 · fase» y «Ver etapas». Queda: los cuatro pasos visibles de «Cierre y entrega» (COR-09). |
| C14 | En Prospecto la misma acción aparece tres veces y con dos nombres: tarjeta «¿Ya estás con el propietario?» con «Iniciar entrevista inicial», tarjeta «Entrevista inicial» con «Preparar entrevista», y barra «Te falta: Iniciar la entrevista inicial (con el botón «Iniciar entrevista inicial»)». | Una sola tarjeta **«Siguiente paso»** con un solo botón y un solo nombre para la acción. Lo demás de la etapa, debajo y plegado. |
| C16 | Cada requisito muestra 4 o 5 botones de estado (12 botones con 3 requisitos). | Se ve solo el estado actual como pastilla y la siguiente acción obvia («Ya lo tengo» → «Marcar revisado»). «Hay un problema» y «No aplica» (donde se admite) van en «⋯». El panel «Marcar como revisado» y su evidencia no cambian. |
| C17 | «Qué hacemos / Para qué» ocupa el primer tercio de la pantalla en cada visita. | Abierto la primera vez que el usuario ve esa etapa; después plegado detrás de «¿Qué se hace aquí?». |
| C22 | «Alta directa, sin entrevista» es una tarjeta grande en el tablero. | Opción secundaria dentro de Nueva operación («¿Ya tienes los datos? Alta rápida sin entrevista»). Conserva su protección de captura. |
| C19 | En celular, Llamar y WhatsApp quedan al final, después de las herramientas. | Encabezado de la operación con Llamar y WhatsApp visibles en celular. |
| C24 | Pestañas Prospectos y Clientes: un usuario nuevo no sabe dónde buscar a una persona. | Una sola lista de personas con etiqueta de etapa y filtro: prospecto (nuevo, en seguimiento, descartado…) o **Cliente**, que se calcula del contrato firmado y no se elige a mano (RP-90 a RP-92). **Solo de pantalla:** las tablas `leads` y `clientes` no cambian; la lista las une y cada fila abre su ficha. `?tab=` sigue funcionando como filtro. |
| C33 | Hoy en celular: la portada «Lo siguiente» recorta el título por arriba; la primera línea y las pastillas quedan fuera de la tarjeta. (`workspace/hoy.tsx`) | La portada muestra el título completo a 390 px; prueba de navegador con el texto más largo del glosario. |
| C36 | Operación: la barra flotante tapa «¿Qué significa cada estado?» y el botón «Hacerlo ahora» del aviso azul; las pestañas Expediente, Documentos del cliente, Tareas e Historial están al pie de la página, debajo de la barra en escritorio y al final de una página de unos 2 800 px en celular; Llamar y WhatsApp quedan bajo el pliegue; en celular la barra flotante más la barra inferior ocupan cerca de un cuarto de la pantalla (C18 sigue); «Próxima tarea» sale rosa salmón en modo oscuro. (`operation/screen.tsx`, `stages.tsx`, `next-step.tsx`) | Pestañas arriba del contenido de la etapa; la página reserva espacio al pie para que la barra flotante no cubra nada; Llamar y WhatsApp en el encabezado (C19); «Próxima tarea» con un token del tema, sin rosa (la marca no lo lleva). |
| C39 | Nueva operación en celular: la barra fija «Continuar» o «Guardar prospecto» tapa el enlace «Alta rápida, sin entrevista», el aviso «También tienes una entrevista por terminar» y el campo «Municipio y colonia». (`intake/wizard.tsx`, `wizard.module.css`) | Espacio reservado al pie igual que en C36; nada queda debajo de la barra. C32 sigue: el botón inactivo se ve rosa. |
| C34 | Hoy repite el mismo pendiente hasta tres veces (portada, primera tarjeta de «Esperan algo de ti» y «Tareas de hoy»); «Vencidas» es un bloque guinda grande que compite con la acción principal; «Operaciones en curso» muestra barras al 100 % cuando hay una operación por etapa, con nombres truncados («Publicación y seg…»); las personas sin foto salen como bloques azul marino con dos iniciales; hasta 12 secciones en una página de unos 1 860 px. | La portada es la primera tarjeta y no se repite en ninguna otra sección (amplía C10); «Vencidas» como marca roja en cada tarjeta, no como bloque; «Operaciones en curso» como una línea por etapa con su número, sin barras; personas sin foto en lista, no en tarjeta; cada dato una sola vez (regla de LV-08). |
| C35 | Textos de Hoy: «Hay un problema con «Que se pueda vender sin obstáculos»: Falta el certificado…» se lee como mensaje de sistema; subtítulos con folio («EXP-2026-0010»); «Toca darle seguimiento.». | El título es el problema («Falta el certificado de libertad de gravamen») y el requisito va en una línea secundaria; el folio no es subtítulo (C02); frases del glosario. |
| C38 | Operaciones: los filtros muestran dos números pegados («5 · Dictamen jurídico 1»); la tarjeta «Alta directa, sin entrevista» sigue al pie del tablero (C22). | Un solo número por chip; retirar la tarjeta. |
| C44 | Tareas: filtros siempre visibles y «Más filtros · 1 activos»; «Nueva tarea» en guinda junto al «+ Nuevo» también guinda; chip «Pendiente» en cada fila abierta; no se puede completar desde la lista (Hoy sí tiene casilla). Ficha de tarea: formulario con «Guardar tarea» como acción principal y «Completar tarea» secundaria; «La fecha límite se interpreta con la fecha de Tijuana». (`screens/tareas.tsx`, `task-form.tsx`) | Casilla para completar en la lista; «Completar» como acción principal de la ficha y los campos después; «+ Nuevo» como botón secundario (blanco con borde) en toda la barra, para que cada pantalla conserve un solo guinda; sin chip «Pendiente»; sin texto técnico (C04). |

## 13. EXT-12: estado por grupo de formatos al 29/10/2026 (texto original)

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

## 14. Simplificación (SIM): estado de las correcciones tras el boceto C (18/10/2026)

**Estado de las correcciones tras el boceto C (revisado en capturas del panel actual, 18/10/2026):**

| Estado | Correcciones |
|---|---|
| Resueltas por el boceto C | C13, C14 («Ahora toca»), C16 («Marcar revisado» y lo demás en «⋯»), C17 («Qué hacemos» plegado), C18 (ya no hay barra fija «Te falta»). |
| Resueltas en parte | C12 (lista con fases; faltan Reportes y renta), C15 (una sola sección «Para terminar la etapa» en dos partes; faltan quitar los números de formato de la vista principal), C20 (herramientas retiradas; «¿Qué significa cada estado?» sigue como tarjeta). |
| Siguen pendientes | C01–C11, C19, C21–C27, C29–C32. C28 pasa a HER-01. |

## 15. Proceso: correcciones COR ya hechas, texto original

| ID | Falla | Corrección | Aceptación |
|---|---|---|---|
| COR-01 | El nombre del propietario casi nunca llega al 07, 08 y 10: el llenado automático solo copia `propietario` si la relación es propietario o copropietario (`src/lib/formatos/intake-prefill.ts:21`) y el registro del prospecto la guarda como «por_aclarar» (`src/lib/intake/wizard.ts:48`). | Preguntar la relación con el inmueble en la cita (CAP-03) y, mientras tanto, copiar el nombre como propietario cuando la intención es vender u ofrecer en renta y la relación no se ha aclarado, marcado «por confirmar». | Prueba: un prospecto propietario nuevo llega con su nombre al 07, 08 y 10. |
| COR-02 | El tipo de inmueble se pierde al pasar al 07: la entrevista guarda «casa» y el 07 espera «Casa» (`src/lib/formatos/valor-fields.ts:17`). | Comparar sin distinguir mayúsculas al llenar, o unificar los valores. | Prueba: cada tipo de la entrevista llega al 07. |
| COR-03 | Hoy llama «Prospecto» a operaciones que ya avanzaron dentro de captación: la etapa fina (entrevista, levantamiento, lista de documentos) depende de datos que Hoy no carga. | Hoy calcula la etapa con la misma función y los mismos datos que la operación (`operation-view.ts`), o muestra la fase («Conocer») cuando no tenga el detalle. | Prueba: una operación con la 02 iniciada o terminada aparece en Hoy con la misma etapa que dentro de la operación. **Titular, 26/10/2026:** la etapa cambia cuando se empieza el siguiente documento, así que con la 02 terminada sigue «Entrevista inicial» (con el botón «Iniciar levantamiento») hasta que se empieza el 04. |
| COR-04 | La renta usa el camino de la venta: `isOwnerRoute` incluye «arrendador», así que la operación muestra las 10 etapas de venta mientras Hoy usa los nombres de renta, y el servidor le pide hasta publicación los requisitos de compraventa. Además los nombres de renta están corridos un lugar respecto a lo que cierra cada estado. El comentario del código aún habla de «6 etapas». | La renta del propietario tiene su propio recorrido y sus propios requisitos según MRP-01, con nombres alineados a lo que cierra cada estado; Hoy y la operación usan los mismos nombres. Corregir el comentario. Si cambian requisitos en el servidor, migración con respaldo y autorización. | Pruebas: una renta muestra el mismo nombre de etapa en Hoy y en la operación y no pide formatos de compraventa que MRP-01 no exija. **Hecha el 29/10/2026; en `main` (PR #57):** la renta del propietario tiene diez etapas propias (Prospecto, Entrevista inicial, Levantamiento, Documentos básicos, Revisión de titularidad, Opinión de renta, Intermediación para renta, Publicación y seguimiento, Selección del arrendatario y Cierre y entrega, con sus pasos contrato, depósito y garantías; entrega con inventario; honorarios y seguimiento; archivo), con textos, requisitos y nombres de renta; Hoy, la operación y las listas dicen lo mismo. Para publicar pide entrevista, titularidad, opinión de renta, renta acordada, intermediación, levantamiento y publicación: ya no factibilidad ni plan; para cerrar ya no pide la revisión jurídica del cierre (06). El 06 y el 08 no se ofrecen en la renta; la revisión (05) y el 09 quedan opcionales mientras no exista la plantilla de intermediación para renta. La migración solo reescribe la función de requisitos para la ruta `arrendador`; las demás rutas quedan igual. |
| COR-06 | La lista de documentos pide siempre el recibo de agua de CESPT (también para un terreno) y no admite «No aplica»; varias condiciones dependen de claves que la entrevista sencilla ya no captura (`adquisicion`, `promesaPrevia`, `acuerdoOcupacion`, `cambioEstadoCivil`, `estadoCivilAdquisicion`), así que documentos como los de herencia o promesa previa casi nunca se piden (`src/lib/formatos/checklist-documentos.ts`). | Lista preliminar revisable: cada documento admite «No aplica» con motivo, se puede agregar otro, las condiciones usan solo datos que existen (entrevista necesaria o «Ampliar», RP-89) y lo que dependa de un dato no capturado aparece «por confirmar». El candado acepta «No aplica» justificado como completo. | Pruebas: un terreno no exige CESPT sin preguntar; un heredero o una promesa previa generan su documento; «No aplica» con motivo cierra el punto. **Hecha el 29/10/2026; en `main` (PR #57):** cada renglón se recibe, no aplica con motivo (cuenta como completo en el candado y en el servidor) o, si depende de algo que la entrevista no pregunta (herencia, condominio, INDIVI, contratos o promesa, toma de agua de un terreno, hipoteca «no sabe»), queda «por confirmar» con su pregunta y se resuelve con «Sí aplica» o «No aplica» (motivo ya escrito). El organismo del agua sale del municipio del domicilio (CESPT, CESPE o CESPTE); un terreno pide deslinde catastral; local, oficina, nave y plaza piden uso de suelo y licencia. «Actualizar la lista» la rehace con la entrevista sin perder lo hecho. Si un documento ya está en «Documentos del cliente», el renglón ofrece «Marcar recibido» y queda ligado al archivo. El 05 recibe «No aplica» con su motivo, lo por confirmar como «Por determinar» y lo agregado en D22; el PDF y el Word de la lista muestran el motivo o la pregunta. **Queda fuera:** los grupos B a D de B-06 (documentos según la forma de pago del comprador) se agregarán cuando se conozca la oferta (14); siguen sin confirmar la constancia de no adeudo predial de Tijuana, el certificado de la Junta de Urbanización y la constancia de la CESPTE. |
| COR-08 | El informe al propietario solo registra la fecha en que se preparó. | Agregar fecha, canal y responsable de entrega, capturados a mano (RP-88). | El aviso de informe vencido usa la entrega cuando existe. **Hecha el 29/10/2026; en `main` (PR #57):** la tarjeta del informe muestra el último preparado y la última entrega, avisa si lo preparado no se ha entregado y registra cada entrega (fecha, canal —WhatsApp, correo, en persona, teléfono u otro— y quién lo entregó) en la guía de la operación (`entregasInforme`, hasta 120). «Hoy» y la tarjeta cuentan el mes desde la última entrega y, si no hay, desde el preparado. La migración solo agrega ese campo a los permitidos y valida su forma. |
| COR-09 | La etapa 10 «Cierre y entrega» oculta firma, entrega, postventa y archivo en un solo círculo. | Mostrar sus cuatro pasos dentro de la etapa, con el actual marcado. | Prueba: una operación en `entrega` dice «Cierre y entrega · entrega». **Hecha el 29/10/2026; en `main` (PR #57):** la etapa 10 lleva el paso en su nombre y, en la línea de etapas y en «Ver etapas», lista firma y pago, entrega, postventa y archivo con el actual marcado; en renta usa los nombres de su ruta (se alinean con COR-04). |
| COR-11 | «Quiere comprar» y «Quiere rentar» abren una operación con las rutas `compra` y `arrendatario` y su expediente, aunque Fortius solo representa al propietario (RP-93). | Al elegir esas intenciones, Nueva operación hace el perfilamiento (C-04 del cuestionario) y guarda un lead con próxima acción, sin abrir operación. El lead se liga a las operaciones de los propietarios por visitas y ofertas; al firmar la promesa, la compraventa o el arrendamiento queda como contraparte. Las operaciones de compra o búsqueda de renta que ya existan no se borran: se muestran como históricas y su contenido se conserva. Si cambia la validación del servidor: migración aditiva con respaldo, ensayo y autorización. | Pruebas: «Quiere comprar» crea un lead con su perfil y no una operación; una visita y una oferta del lead aparecen en la operación del propietario; una promesa firmada lo muestra como contraparte; las operaciones de compra existentes siguen abriéndose. **Hecha el 29/10/2026; en `main` (PR #57):** «Quiere comprar» y «Quiere rentar» piden quién es y «¿Qué busca?» (tipo, uso, zonas, presupuesto o renta máxima, forma de pago y crédito, origen de ingresos, recámaras, plazo, notas, aviso de privacidad y próxima acción con fecha) y guardan o actualizan el prospecto, sin entrevista ni operación; ningún dato del perfil es obligatorio (RP-82). El servidor ya no empieza entrevistas de compra o renta ni crea operaciones con rutas `compra` o `arrendatario`, ni cambia una operación a ellas; las que existen se abren, se guardan y muestran «Operación histórica». En Ajustes, la contraparte es el interesado que firma (`contraparteLeadId`), que cuenta como contraparte identificada para avanzar; la tarjeta de visitas muestra el interesado de cada visita y la contraparte. Las entrevistas de compra a medias llevan a «Guardarlo como interesado». Falta: ligar las ofertas (14) al interesado y revisarlo el titular en el 3002. |
| COR-13 | Las operaciones nuevas empiezan en la etapa 5, «Dictamen jurídico»: al terminar el primer contacto, la base las pasa de `captacion` a `documentacion` (regla del 14/10/2026 en `fortius_inmuebles_save_intake`) y se saltan Prospecto, Entrevista inicial, Levantamiento y Checklist con su candado. La pantalla final de Nueva operación dice «etapa Prospecto». Encontrado el 26/10/2026 al revisar COR-03. | Migración `supabase/migrations/20261026120000_intake_starts_in_captacion.sql`: la operación nueva se queda en captación y el historial dice «Primer contacto completado; la operación sigue en captación». El requisito «Entrevista y objetivo del propietario» se sigue marcando revisado. No cambia datos existentes. **Aplicarla en la base remota requiere autorización del titular.** | Pruebas de base local: el primer contacto deja la operación en captación; los recorridos de venta, renta e inversión avanzan desde ahí una etapa a la vez. |
| COR-15 | Dos entradas para la misma llamada: «Nuevo prospecto» en Contactos admite «Vender» y crea una persona sin operación ni entrevista; Nueva operación crea la operación. La nota del primer contacto (`condiciones`) no se copia a la 02 ni se muestra en la operación (`src/lib/formatos/intake-prefill.ts`). | «Nuevo prospecto» pregunta primero si vende, ofrece en renta, busca o invierte; al elegir vender u ofrecer en renta lleva a «Datos del prospecto» de Nueva operación con el nombre y el teléfono ya puestos. La nota del primer contacto se copia a «Notas del asesor» de la 02 y se muestra en la operación. | Prueba: desde Contactos y desde «+ Nuevo» un propietario queda con la misma operación; la nota escrita en la llamada se lee en la 02 y en la operación. **Construido el 02/11/2026; en `main` (PR #66):** «Agregar contacto» pregunta qué quiere hacer; vender, ofrecer en renta o invertir abre Nueva operación en el paso «Quién es», donde se capturan nombre y teléfono (la pregunta va antes de los datos, así que no hay nada que pasar); las notas del primer contacto llegan a «Notas del asesor» de la 02 (ya no se copia ahí «Lo que sigue») y se ven en la operación. |

## 16. Matriz de estados: notas de revisión anteriores al 11/11/2026

### Estado y dependencias de cada entrega

Esta matriz conserva los 42 estados y dependencias explícitos del seguimiento original, incorpora tres entregas del producto ampliado (EXT-08, EXT-09 y EXT-10) y, desde el 17/10/2026, las 23 entregas de «Dirección del producto» las 12 del paquete SIM, las 14 del paquete NAV las 4 del paquete LV las 21 de «Proceso, captura y documentos» (COR, CAP, FCH y MOT) las 4 de «Herramientas para trabajo suelto» (HER) y los pendientes de formatos DOC-06 y DOC-09 y, desde el 18/10/2026, COR-03 a COR-09, MRP-01, USO-01 y COR-10 (prospecto y cliente), para un total de 135. **Estados revisados el 18/10/2026:** «parcial» significa que una parte ya existe — OPS-01 (tareas vinculadas a la operación y apertura transaccional desde la entrevista, 13/10), CRM-01 (conversión idempotente), PUB-01 (publicación condicionada a la operación de captación), DOC-01 (emisiones con huella, versiones y copia firmada), UX-01 (kit del panel guiado) y SIM-04 a SIM-06 (boceto C). Lo demás sigue pendiente aunque tenga piezas sueltas. Las seis de la etapa posterior figuran «en_pausa». EXT-06 ya contemplaba IA y RAG; ahora se concreta su alcance solicitado. Complementa las condiciones de negocio y pruebas del backlog; preparación local aprobada no cambia automáticamente una entrega a aceptada.

**Revisión del 26/10/2026.** Se agrega el estado **«terminada»**: la entrega está integrada en `main` y cumple su aceptación. Antes no existía, por eso los resúmenes contaban cero terminadas. LV-05 pasa a «terminada» (PR #45, #46 y #47) y MRP-01 a «en_revision» (borrador en «Matriz de reglas por ruta», espera DEC-26). El resto de los estados no se revisó contra el código en esta pasada.
