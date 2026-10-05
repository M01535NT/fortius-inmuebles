# Revisión móvil del Dashboard — Fortius Inmuebles

Fecha: 22 de septiembre de 2026, hora de Tijuana. Código base: `99c484e`, con cambios locales previos ajenos a esta revisión.

**Estado actualizado:** correcciones implementadas y verificadas en localhost. El diagnóstico original se conserva como evidencia; el cierre y sus pruebas están al final de este documento. Publicación en Vercel pendiente.

## Resultado

El panel necesita correcciones antes de considerarse cómodo para uso diario desde el celular. Los problemas principales son el desbordamiento del resumen, las tablas de escritorio en móvil y el calendario que pierde columnas visibles. También se reprodujeron dos errores en el indicador de eventos próximos.

Esta revisión no modificó código de la aplicación ni datos del servidor. Se entrega diagnóstico y propuesta de corrección.

## Cómo se revisó

- Navegación real en Chrome sobre `http://localhost:3013/admin`, con la compilación local de la aplicación.
- Respuestas de API sustituidas únicamente en una vista de prueba local: siete leads, un inmueble, un cliente, un asesor, una entrada de blog, una nota y ocho eventos ficticios. Todas las escrituras a esa API estaban bloqueadas.
- Tamaños de ventana comprobados: 360 × 800 y 390 × 844; comprobaciones adicionales del Dashboard a 430 × 932 y del calendario a 320 × 740.
- Inspección visual, navegación, apertura de formularios, cambio de día y de tema, desplazamiento y mediciones de elementos renderizados. El código se consultó para localizar las causas.
- Se recorrieron Panel, Inmuebles, Clientes, Leads, Calendario, Notas, Blog, Asesores, Archivos, Contenido y Configuración. Se abrieron los formularios de nuevo inmueble, cliente y entrada de blog, sin guardar.
- El panel publicado mostró el acceso por correo y contraseña. No se obtuvo una sesión autenticada en producción. Las conclusiones siguientes corresponden al entorno local; no se presentan como una validación de datos reales.

Los anchos medidos pueden descontar la barra de desplazamiento vertical de Chrome. No se utilizó un teléfono físico: quedan fuera de esta comprobación Safari/iOS, el teclado virtual y los controles nativos del sistema operativo.

## Fallos comprobados

### 1. El Dashboard se sale de la pantalla cuando hay nombres largos — Prioridad alta

**Dónde:** `/admin`, sección «Leads recientes» y contenedor que comparte con la agenda.

**Reproducción:** mostrar un lead llamado «Cliente de prueba con nombre y apellidos extensos» con estado «En evaluación».

**Evidencia:** a 390 px, el documento alcanzó 484 px. El problema también persistió a 430 px. En pantalla quedaron cortados el enlace «Ver todos», los estados de los leads y el extremo derecho de las tarjetas.

**Causa localizada:** los elementos de la cuadrícula conservan un ancho mínimo determinado por su contenido; truncar el nombre dentro de la fila no limita por sí solo la sección completa.

**Corrección propuesta:** limitar las columnas y secciones al espacio disponible; permitir que nombre y estado se distribuyan en dos líneas cuando lo necesiten. Mantener accesible el nombre completo al abrir el lead.

**Aceptación:** con nombres de 80 caracteres y todos los estados, a 320, 360, 390 y 430 px no debe haber desbordamiento del documento ni acciones recortadas.

Referencia: `src/app/admin/page.tsx:69`, `:71`, `:82`.

### 2. Las tablas de leads e inmuebles dejan las acciones fuera de vista — Prioridad alta

**Dónde:** `/admin/leads` y `/admin/propiedades`.

**Evidencia:** a 390 px, la tabla de leads midió 760 px dentro de un contenedor de 333 px; la de inmuebles, con un título largo, alcanzó aproximadamente 1,105 px dentro de 348 px. Para consultar estado, precio o acciones es necesario desplazarse lateralmente. Además, el documento completo llegó a 648 px en Leads y 793 px en Inmuebles; las etiquetas de accesibilidad posicionadas fuera del área visible contribuyen al desbordamiento y deben revisarse.

**Impacto:** cuesta asociar una acción con el registro correcto y se ocultan controles básicos en el uso normal del teléfono.

**Corrección propuesta:** presentar tarjetas o filas apiladas en móvil, con nombre, estado y acción principal visibles juntos. Conservar las tablas en escritorio. Revisar la contención de las etiquetas `sr-only`, sin retirar los nombres accesibles.

**Aceptación:** consultar y abrir un registro, identificar su estado y acceder a sus acciones sin desplazamiento horizontal de la página. Verificar listas con registros, títulos extensos y precios en ambas monedas.

Referencias: `src/app/admin/leads/page.tsx:176`, `:220`; `src/app/admin/propiedades/page.tsx:65`, `:137`.

### 3. El calendario recorta días y controles — Prioridad alta

**Dónde:** `/admin/calendario`.

**Reproducción:** seleccionar un día con eventos cuyos títulos sean largos; repetir con un día vacío.

**Evidencia:** a 360 px, los eventos largos ensancharon el documento hasta 459 px. Los últimos días de la semana y los botones de cambio de mes quedaron fuera del área visible. Al seleccionar un día vacío desapareció el desbordamiento global, pero el calendario siguió necesitando desplazamiento horizontal: 308 px de contenido dentro de 279 px. A 320 px, ese espacio bajó a 254 px. En el formulario también se observó la fecha visualmente recortada al compartir fila con la hora.

**Corrección propuesta:** contener el ancho de ambas secciones, permitir varias líneas en los títulos y adaptar el calendario para que los siete días sean visibles. Evaluar una vista de agenda diaria como opción principal en teléfonos estrechos. Apilar Fecha/Hora y otros pares de campos cuando no quepan completos.

**Aceptación:** los siete días, el cambio de mes y los valores de fecha/hora deben verse completos; los títulos largos no deben modificar el ancho de la página.

Referencia: `src/app/admin/calendario/page.tsx:115`, `:146`, `:189`, `:263`.

### 4. El Dashboard puede ocultar eventos que todavía ocurrirán hoy — Prioridad alta, funcional

**Evidencia:** a las 22:24 del 22 de septiembre, hora local, se prepararon ocho eventos para ese mismo día a las 23:59. El calendario mostró los ocho; el Dashboard indicó «00 Eventos próximos».

**Causa:** el Dashboard calcula el día con `toISOString()`, que usa UTC. A esa hora UTC ya era 23 de septiembre. El calendario calcula el día con la fecha local, por lo que ambas vistas discrepan.

**Corrección propuesta:** definir y compartir una misma zona horaria operativa para las dos pantallas y el criterio de qué significa «próximo».

**Aceptación:** un evento de hoy todavía futuro debe aparecer en ambas vistas, también durante las horas en que UTC y Tijuana tienen fechas distintas.

Referencias: `src/app/admin/page.tsx:25`; `src/app/admin/calendario/page.tsx:49`, `:63`.

### 5. «Eventos próximos» nunca cuenta más de cinco — Prioridad media, funcional

**Evidencia:** con ocho eventos ficticios para el 24 de septiembre, el Dashboard mostró «05 Eventos próximos».

**Causa:** se aplica `slice(0, 5)` antes de calcular el indicador. El límite de filas visibles también limita el total.

**Corrección propuesta:** calcular el total de eventos elegibles y limitar a cinco únicamente la lista de vista previa.

**Aceptación:** con ocho eventos elegibles, mostrar total 8 y hasta cinco filas, con acceso al calendario completo.

Referencia: `src/app/admin/page.tsx:26–36`.

## Mejoras recomendadas

### 6. Dar prioridad a la operación del día — Prioridad media

Las cuatro tarjetas de indicadores se apilan en una columna. A 390 × 844, «Leads recientes» empieza aproximadamente en la coordenada vertical 944 y «Agenda próxima» en 1,376. El primer pantallazo lo ocupan encabezado, aviso e indicadores grandes. En Leads, el formulario de captura y los filtros empujan el comienzo de la tabla hasta aproximadamente 827 px.

Propongo indicadores más compactos, dos columnas cuando el contenido quepa, un aviso informativo menos alto y la agenda del día más cerca del inicio. En Leads, abrir la captura mediante «Nuevo lead» y priorizar la búsqueda y los registros existentes. No ocultar los avisos de error ni de publicación.

Referencias: `src/app/admin/page.tsx:49`; `src/app/admin/leads/page.tsx:84`.

### 7. Mejorar el menú y la información de sesión — Prioridad media

El menú de once módulos más «Ver sitio» y «Salir» ocupa gran parte del alto del teléfono y tiene desplazamiento propio dentro del encabezado fijo. Se comprobó que Escape no lo cierra. El correo de la cuenta y el indicador de actualización se ocultan en móvil.

Propongo mostrar la cuenta dentro del menú, conservar un estado de carga discreto y facilitar el cierre mediante un control explícito y Escape. Si se convierte en panel modal, entonces deberá gestionar el foco como tal; el menú actual es un desplegable y no se está calificando como modal defectuoso.

Referencia: `src/components/admin/admin-shell.tsx:371–399`.

### 8. Uniformar las áreas táctiles — Prioridad media

Los enlaces «Ver todos» y «Calendario» del Dashboard midieron 19.5 px de alto. Son más pequeños que los botones principales de 44 px y resultan menos cómodos para tocar.

Propongo ampliar su área interactiva a aproximadamente 44 px sin agrandar necesariamente el texto y revisar las acciones de edición de las tablas. Es una recomendación de uso táctil; no constituye por sí sola una declaración de incumplimiento de accesibilidad.

Referencias: `src/app/admin/page.tsx:74`, `:108`; `src/app/admin/propiedades/page.tsx`.

### 9. Hacer manejable el formulario largo de inmuebles — Prioridad media

El formulario vacío de alta alcanzó 4,257 px de alto a 360 px de ancho. «Crear inmueble» estaba aproximadamente en la coordenada vertical 4,193. El usuario debe recorrer varias pantallas para guardar o cancelar.

Propongo navegación por las seis secciones y una barra de acciones accesible durante la edición, con espacio reservado para que no tape campos. Al fallar la validación, llevar al primer campo afectado y mantener los datos escritos. Estas mejoras deben conservar el guardado explícito y los permisos actuales.

Referencia: `src/components/admin/property-form.tsx:798`.

## Aspectos que funcionaron en las muestras

- La lista y el formulario de clientes se adaptaron al ancho móvil con nombres largos.
- Los campos inspeccionados del formulario de clientes usaban texto de 16 px y una altura mínima de 44 px.
- Blog, Asesores, Notas, Archivos, Contenido y Configuración no mostraron desbordamiento global en las muestras y estados inspeccionados. Esto no certifica todas sus combinaciones posibles.
- Los temas claro y oscuro se aplicaron durante la navegación local. No se realizó una auditoría numérica completa de contraste.
- Los botones principales y los enlaces del menú ofrecen áreas táctiles amplias; no hace falta rediseñar toda la identidad visual.

## Orden de implementación y comprobación

1. Resolver los desbordamientos del Dashboard y del calendario; sustituir las tablas móviles por una presentación adecuada.
2. Corregir fecha operativa y conteo de eventos.
3. Compactar el resumen, facilitar navegación y captura, ampliar enlaces táctiles y mejorar el formulario largo.
4. Repetir la navegación con registros cortos y largos, estados vacíos y poblados, errores de carga y ambos temas, a 320, 360, 390 y 430 px. Comprobar también tableta y escritorio para evitar regresiones.
5. Validar en un teléfono real el teclado, selectores de fecha, desplazamiento, foco y barra de acciones. Después, repetir con una sesión autorizada y datos reales, sin escrituras innecesarias.

La prueba existente `tests/admin/browser/panel.spec.ts` utiliza colecciones vacías por defecto. Comprueba navegación y algunos formularios, pero no cubre los desbordamientos encontrados con registros. Debe ampliarse con esos casos; no basta con volver a ejecutar la misma prueba vacía.

## Límites y estado de entrega

**Confirmado:** los cinco fallos anteriores se reprodujeron en el navegador local; las cuatro mejoras se apoyan en medidas y comportamientos observados.

**Pendiente:** correcciones, regresiones automatizadas específicas, revisión en teléfono físico y verificación autenticada en el despliegue.

**No evaluado en esta revisión:** persistencia real, autorizaciones, envíos, cargas de archivos, rendimiento medido y recuperación de datos. No se guardaron formularios ni se probaron acciones destructivas.

Durante la preparación hubo un problema de caché del servidor local de desarrollo. La inspección se realizó después sobre la compilación local de producción; ese incidente de preparación no se contabiliza como fallo del Dashboard publicado.

## Cierre de las correcciones — 22 de septiembre de 2026

El usuario autorizó implementar el informe. Los nueve puntos se trabajaron y comprobaron localmente:

| Punto | Resultado implementado |
| --- | --- |
| 1. Desbordamiento del Dashboard | Columnas y tarjetas contenidas; nombres y estados pueden ocupar varias líneas. |
| 2. Tablas móviles | Tarjetas para leads e inmuebles en móvil/tableta; tablas conservadas desde 1024 px. Estado, precio y acciones ya no exigen desplazamiento lateral. |
| 3. Calendario | Siete columnas dentro del ancho, títulos completos y campos Fecha/Hora apilados en móvil. Los días mantienen 44 px de alto y ajustan su ancho al espacio disponible. |
| 4. Fecha operativa | Dashboard y calendario comparten `America/Tijuana`. La fecha inicial de publicación del inmueble también usa ese criterio; las fechas existentes se conservan. |
| 5. Contador de eventos | Total calculado antes de limitar la vista previa a cinco registros. Ocho eventos de prueba producen un indicador de 8. |
| 6. Jerarquía móvil | Indicadores compactos en dos columnas, agenda primero, aviso reducido y captura de leads desplegable. |
| 7. Menú y sesión | Menú compacto en dos columnas, cuenta visible, indicador de actualización, foco inicial en los enlaces, Tab operativo, cierre exterior y Escape con devolución de foco. |
| 8. Áreas táctiles | Enlaces del resumen y acciones de las tarjetas con al menos 44 px de alto. |
| 9. Formulario largo | Selector de seis secciones y barra inferior de acciones; foco en el campo obligatorio o en el error de guardado, con borrador conservado. |

No se modificaron las API, los permisos ni el esquema de datos. El guardado sigue siendo explícito y las operaciones conservan sus versiones. Las escrituras del recorrido visual estaban bloqueadas; las pruebas de mutaciones usaron respuestas simuladas.

### Evidencia de verificación

- `npm run lint`: pasó.
- `npm run typecheck`: pasó.
- `npm test`: **121 pruebas de backend y 108 del panel; 229 en total, todas correctas**.
- `npm run build`: pasó. La primera ejecución restringida no pudo descargar las fuentes de Google Fonts; la compilación final con acceso a esas fuentes terminó correctamente.
- `FORTIUS_INMUEBLES_TEST_URL=http://localhost:3020 npx playwright test --config playwright.admin.config.ts mobile-panel.spec.ts panel.spec.ts`: **20 pruebas correctas**. Incluyen registros largos a 320, 360, 390, 430, 768 y 1440 px; las pruebas previas también cubren 375, 414 y 1024 px. Se comprobaron ambos temas, menú, formularios, errores, calendario y estado vacío.
- Navegación manual en Chrome sobre `http://localhost:3021/admin`, usando la compilación final y datos ficticios: Dashboard, menú con Tab, calendario, leads, inmuebles y formulario. Se verificaron 320 y 390 px, temas claro/oscuro, navegación por secciones, validación nativa y error del servidor visible sin perder el borrador.
- A 390 × 844, el título de la agenda quedó aproximadamente en **y=516**, frente a y=1,376 del diagnóstico. El documento quedó dentro de la ventana; calendario y formulario también se comprobaron sin desbordamiento a 320 px.
- `git diff --check`: sin errores de espacios.

Se actualizaron dos apoyos de verificación: ESLint excluye ahora los artefactos temporales de `.superpowers`, ya excluidos de Git; una aserción antigua de metadatos se alineó con la URL canónica absoluta y la imagen social incorporadas antes de este trabajo. No se cambió el comportamiento público para satisfacer esa prueba.

Capturas reproducibles de las pruebas de navegador, todas con datos ficticios:

- [Dashboard a 390 px](assets/dashboard-movil-2026-09-22/dashboard-390.png).
- [Tarjeta de inmueble a 390 px](assets/dashboard-movil-2026-09-22/inmuebles-390.png).
- [Calendario a 320 px](assets/dashboard-movil-2026-09-22/calendario-320.png).
- [Error visible del formulario a 320 px](assets/dashboard-movil-2026-09-22/error-formulario-320.png).

### Pendientes fuera de la comprobación local

Publicación y verificación autenticada en Vercel; recorrido en un teléfono físico, incluido Safari/iOS y teclado virtual. No se declara verificada la persistencia en producción mediante las pruebas simuladas. No se hicieron commit ni push durante estas correcciones.
