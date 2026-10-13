# Fortius — plan único de implementación del ERP/CRM

**Actualizado:** 13 de octubre de 2026, America/Los_Angeles. **Responsable de negocio:** Moisés Núñez Tonalá. **Desarrollo:** Codex. **Carpeta:** `C:\Paginas-web\fortius-inmuebles`.

Este archivo reúne el alcance, el orden de trabajo, las tareas y el avance del ERP/CRM. Es el único plan vigente de desarrollo. Los manuales de `docs/` son referencias de operación, no planes alternativos.

## Qué vamos a construir

Un sistema operativo dentro de `/admin` para conducir cada operación desde el primer contacto hasta el cierre: personas, inmuebles, expedientes, documentos, tareas, visitas, ofertas y cobros relacionados. La dirección tendrá cuatro tableros: comercial, financiero, jurídico y técnico. Cada cifra deberá poder explicarse con sus registros de origen.

El sitio público y el panel siguen siendo una sola aplicación Fortius. Se conserva lo que funciona y se amplía por módulos; no se vuelve a construir desde cero.

## Funciones del producto ampliado

Referencia de alcance: funciones de la imagen «Foto 1.jpg», incorporadas el 12 de octubre de 2026. Se integran al mismo sistema y comparten personas, inmuebles y expedientes. Son funciones solicitadas para desarrollar; esta incorporación no acredita su implementación.

| Grupo | Funciones que deberá ofrecer Fortius | Entregas relacionadas |
|---|---|---|
| Gestión empresarial | CRM, ERP, gestión e inventario de inmuebles, perfiles de clientes y portal privado para consultar lo que Fortius les comparta. | REL-01, CRM-01, OPS-01, PUB-01, FIN-01/02 y EXT-10. |
| Tableros e inversión | Cuatro tableros de dirección; calculadoras de inversión con TIR y VAN, flujos de efectivo, presupuestos y escenarios de rentabilidad guardados por operación. | TAB-01/02/03/04, FIN-01/02 y EXT-08. |
| Información geográfica | Mapas interactivos del inventario y comparables, análisis de zonas, rutas de visitas y visualizaciones geoespaciales con fuente y fecha. | TEC-01, VIS-01 y EXT-09. |
| Documentos y revisión jurídica | Generación de contratos y formularios PDF desde modelos revisados, expedientes digitales, revisión asistida de cláusulas y búsquedas documentales con RAG: respuestas que remitan al documento, versión y página utilizados. | DOC-01, LEG-01 y EXT-06. |

La primera entrega sigue siendo captación y próxima acción dentro del panel. Después se amplían documentos, finanzas y tableros; el análisis de inversión, los mapas, el portal de clientes y la IA se entregan por módulos con sus pruebas. Estas cuatro capacidades forman parte del producto ampliado solicitado y siguen pendientes. El núcleo inicial puede aceptarse por separado; su aceptación no acredita que el producto ampliado esté completo.

## Dónde estamos

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

Diseño aprobado: barra azul institucional con selección guinda, módulos agrupados en Comercial, Gestión y Herramientas; controles de configuración, sitio, contraer y salir al pie. Se conservan el orden personalizado, el ancho y los accesos existentes. El botón superior Aplicaciones abre una ventana con iconos y búsqueda local de los módulos disponibles para cada rol. Estos accesos no implementan las capacidades financieras, geográficas o de portal que siguen pendientes.

- [x] Aplicar barra lateral y ventana de aplicaciones; reutilizar un catálogo de rutas y permisos.
- [x] Comprobar teclado, búsqueda, cierres, navegación, permisos y adaptación a escritorio, tablet y móvil.
- [x] Comparar capturas con las propuestas y cerrar los hallazgos de revisión independiente.

Publicado en `main`, commit `90fb26c`, y confirmado Ready en Vercel. Acceso principal: `fortiusinmuebles.com/admin`. La evidencia técnica se conserva fuera de la carpeta activa.

### Diseño aprobado del panel — 12/10/2026

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

## Restricciones globales

- Conservar identidad Fortius, tipografías internas, contraste claro, animaciones pertinentes y accesibilidad.
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
| DEC-03 | Administrador/asesor actuales conservados; capacidades de coordinación, jurídico, técnico y finanzas | Diseñar matriz; confirmar responsables y visibilidad antes de activar permisos. |
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
| DEC-14 | Corpus y tratamiento por el servicio de IA | Definir documentos autorizados, proveedor, conservación, costo y evaluación de citas, abstención y aislamiento antes de procesar información real. |

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
- **Responsable de ingeniería por entrega:** Codex en el checkout autorizado. No marcar aceptación humana desde una prueba automática.
- **Revisor jurídico/fiscal/contable:** profesional que designe Fortius. Su revisión es dependencia cuando la entrega fija reglas de esas materias.
- **Usuarios piloto:** administrador y dos asesores controlados; datos sintéticos hasta autorización expresa de un piloto real.
- **Enfoque:** entregas incrementales, un recorrido verificable por vez. Una tarea de implementación en curso y otra como máximo en revisión. Las dependencias externas se registran aparte.
- **Cadencia:** revisión al finalizar cada iteración; recalibración de la siguiente con evidencia. No llamar al trabajo individual Scrum ni dar fechas firmes sin capacidad y accesos.

## Orden y ventanas orientativas

Ventanas expresadas en días de ingeniería: no son días calendario ni promesas de Codex. Supuestos: una persona de ingeniería, infraestructura actual, revisión de negocio disponible, datos de prueba y sin nuevas integraciones de pago. Los rangos no se suman automáticamente; hay solapamientos y varias entregas ampliables.

| Fase | Resultado utilizable | Ventana inicial | Criterio para terminar |
|---|---|---|---|
| 0 — Continuidad | Base recuperable, publicación controlada, datos clasificados y errores rastreables | 8–14 días | Correcciones consolidadas, restauración aislada, política de datos y controles de producción demostrados; bloqueos externos identificados. |
| 1 — Núcleo CRM/operación | Equipo administrable, captación completa, partes relacionadas y próxima acción | 12–20 días | Recorrido prospecto/cliente/inmueble/expediente/tarea con permisos, cuentas y trazabilidad. |
| 2 — Ejecución especializada | Visitas, ofertas, documentos, revisiones y cierre | 12–24 días | Requisitos y excepciones aprobados; oferta y cierre conectados al expediente. |
| 3 — Finanzas y tableros | Hechos financieros y cuatro vistas con desglose | 15–30 días | Totales reconciliados; cifras sin fuente explícitamente pendientes; acceso por capacidad. |
| 4 — Producto multidispositivo | Interfaz consistente e instalación del panel | 8–16 días para uso conectado | Pruebas reales por plataforma, teclado, accesibilidad, sesión y conexión. Offline/push aparte. |
| 5 — Escala y adopción | Consultas por necesidad, continuidad y piloto aceptado | 8–16 días | Carga medida, restauración repetible, manual y recorrido de usuario aceptado. |
| 6 — Nuevas capacidades | Inversión, mapas, portal de clientes e IA documental; demás extensiones según caso de negocio | Por capacidad; rangos por estimar | Las cuatro capacidades solicitadas tienen alcance, costo y aceptación propios. Deben completarse para aceptar el producto ampliado; el núcleo se acepta por separado. |

M1: operación de captación utilizable tras fases 0–1. M2: operación de venta de extremo a extremo tras fase 2. M3: dirección con cuatro tableros tras fase 3. M4: versión operativa instalable y transferida tras fases 4–5. Se puede adelantar UX y prueba de dispositivos de un módulo desde su primera entrega.

Ruta principal: BAS-01 → REL-01/SEG-01 → CRM-01 → OPS-01 → COM-01/DOC-01/LEG-01/TEC-01 → FIN-01 → TAB-01 → PIL-01. Recuperación REC-01, permisos SEG-01 y controles CI-01 son condiciones para pilotar datos sensibles en producción.

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

### Fase 2 — operación de venta y revisiones

| ID / clase | Entrega / problema | Archivos o ámbito | Dependencias / esfuerzo | Aceptación verificable |
|---|---|---|---|---|
| COM-01 P1/I | Conectar cartera/oportunidad/expediente sin duplicar hechos | comercial server/types, operación y vínculos SQL | OPS-01, DEC-05/09; 3–5d | Reconciliar vínculos por ID; no convertir ponderaciones en probabilidades; libro emitido histórico intacto. |
| VIS-01 P1/I | Visita con resultado, asistencia, autorización y próxima acción | calendario/eventos, formato 13, operación | OPS-01; 2–4d | Visita programada distinta de realizada/cancelada; no contar doble al corregir; acceso y seguimiento correctos. |
| OFE-01 P1/I | Ofertas/contraofertas, vigencia y respuesta autorizada | formato 14/oferta, operación, historial | COM-01, VIS-01; 3–5d | Versiones y plazos; respuesta del propietario identificada; acuerdo comercial no se presenta como contrato firmado. |
| DOC-01 P1/I | Unificar fuente documental/revisión/emisión/copia firmada | formatos catalog/server/API, assets, snapshots | OPS-01, SEG-01; 3–6d | Hash/versión verificables; cambio invalida revisión afectada; firma capturada no equivale a firma electrónica. |
| LEG-01 P1/I | Requisitos, hallazgos, excepciones y conclusión profesional por etapa | juridica, formato 05/06, transitions propuesto | DOC-01, DEC-05, revisión jurídica; 3–5d | Recibido/revisado separados; no avanzar por casilla vacía; excepción tiene autor, fundamento y fecha. Modelo 09 sigue bloqueado hasta cotejo externo requerido. |
| TEC-01 P1/I | Levantamientos y discrepancias con fuente/fecha/evidencia | levantamiento y variantes 04, assets, property facts | DOC-01; 3–5d | Superficies no se mezclan ni suman indebidamente; medición, declaración y dato documental diferenciados; foto vinculada. |
| CIE-01 P1/I | Condiciones, formalización, entrega, pendientes y archivo | formatos 15/16/17, operación, transiciones | OFE-01/LEG-01/TEC-01; 3–5d | Cierre comercial/documental/cobro distintos; entrega con evidencia; poscierre pendiente no desaparece por cerrar. |

### Fase 3 — finanzas y tableros

| ID / clase | Entrega / problema | Archivos o ámbito | Dependencias / esfuerzo | Aceptación verificable |
|---|---|---|---|---|
| FIN-01 P1/I | Registro de hechos financieros por operación y empresa | operational-finance nuevo, SQL, evidencias privadas | DEC-07, OPS-01/DOC-01/SEG-01; 4–7d | Estimado/pactado/facturado/cobrado separados; obligación/pago parcial/anulación identificados; importes decimales y monedas conservados. |
| FIN-02 P1/I | Egresos, presupuestos, honorarios y repartos revisables | operational-finance, formatos 08/18/19, comercial | FIN-01 y revisión fiscal; 3–6d | No duplicar pagos/directos; no reconocer honorario por cierre sin regla; periodos/TC fuente; sin custodia ni banco automático. |
| TAB-01 P1/I | Contrato común de métricas, filtros y desglose | analytics nuevo; reportes/admin | SEG-01/CRM-01 y definiciones aprobadas; 2–4d | Total = registros detallados autorizados, fecha/corte/fuente/pendientes; demo excluido del operativo por defecto pero visible. Contrato se puede preparar antes de finanzas; cada widget espera su propia fuente. |
| TAB-02 P1/I | Comercial accionable | dashboard/Today/reportes, analytics | CRM-01/COM-01/VIS-01/TAB-01; 2–4d | Cohortes y primera atención explícitas; venta no equivale a conversión de lead; pendientes enlazan acción. |
| TAB-03 P1/I | Financiero por operación, moneda y periodo | nueva vista financiera, analytics | FIN-02/TAB-01; 3–5d | Cobros conciliados vs potencial; no sumar monedas sin conversión válida; detalle y export reconciliados. |
| TAB-04 P1/I | Jurídico y técnico con pendientes por responsable | nuevas vistas y queries | LEG-01/TEC-01/TAB-01; 3–5d | Estados derivados de revisión explícita; sin dictamen automático; hallazgo lleva a su evidencia. |

### Fases 4–5 — interfaz, escala y adopción

| ID / clase | Entrega / problema | Archivos o ámbito | Dependencias / esfuerzo | Aceptación verificable |
|---|---|---|---|---|
| UX-01 P1/I | Sistema de interfaz y captura comprensible en todos los módulos | admin/UI/shell/form-section/formularios | Desde fase 1; 3–6d iniciales | Contraste y jerarquía; foco y teclado; estados cargando/vacío/error/conflicto/sin permiso; no pérdida silenciosa. |
| UX-02 P2/C | Búsqueda, vistas/preferencias y dashboard personal modular | workspace/search/preferences/sidebar, SQL si se sincroniza | SEG-01/PAG-01/TAB-01; 2–4d | Filtra en servidor; orden accesible; preferencia personal no altera permisos ni muestra widgets prohibidos. |
| PWA-01 P1/I | Instalación y apertura del panel | manifiesto específico admin/layout/iconos | AUT-01/UX-01; 2–4d | Identidad/start_url/scope probados; inicia admin; acceso normal tras actualización; matriz real iOS/Android/iPad/Windows/macOS. |
| PWA-02 P2/C | Conectividad y captura de campo limitada | formularios, capa de conexión; SW solo alcance aprobado | PWA-01, DEC-08; 3–6d | Sin cache de API/Auth/PDF privados; caducidad/cierre de sesión; reintento no duplica. Offline de datos sensibles requiere diseño y aprobación adicionales. |
| PWA-03 P3/O | Notificaciones de tareas y citas con consentimiento | registro push por dispositivo, preferencias y disparador confiable | PWA-01/SEG-01/PRV-01 y canal acordado; 2–5d preliminares | Usuario opt-in; mensaje sin datos sensibles; horario operativo, revocación y duplicados probados; compatibilidad iOS instalada confirmada. No prometer entrega garantizada. |
| PAG-01 P1/I | Búsqueda/paginación de servidor y agregados | backend/repository, collections, expedientes, store y listas | SEG-01 y contratos por módulo; 4–7d | No descargar toda colección para una página; orden estable; RLS; filas sin pérdida ni duplicación; ningún cliente legacy se trunca. |
| ESC-01 P2/C | Medir volumen, consultas, concurrencia y PDFs | SQL/queries/tools, pruebas aisladas | PAG-01/FIN-01; 2–4d | Línea base y límites documentados; índices/locks/worker solo tras medición; integridad preservada. |
| PIL-01 P1/I | Piloto, capacitación, manual y soporte | pruebas/fixtures/docs, datos autorizados | Recorrido M2, tableros, continuidad y PWA; 3–6d más uso real | Recorridos aceptados por usuario; incidencias priorizadas; soporte/backup/responsable definidos; ningún módulo se declara terminado por tener pantalla. |

## Estado y dependencias de cada entrega

Esta matriz conserva los 42 estados y dependencias explícitos del seguimiento original e incorpora tres entregas del producto ampliado: EXT-08, EXT-09 y EXT-10, para un total de 45. EXT-06 ya contemplaba IA y RAG; ahora se concreta su alcance solicitado. Complementa las condiciones de negocio y pruebas del backlog; preparación local aprobada no cambia automáticamente una entrega a aceptada.

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
| R-01 | Riesgo: duplicidad cliente/operación/cartera | REL/OPS/COM con ID fuente y pruebas; Codex. |
| R-02 | Riesgo: migración de datos ambiguos | Inventario/simulación/reporte; revisión humana de coincidencias. Nunca fusionar todo por nombre/teléfono. |
| R-03 | Riesgo: reglas jurídicas/fiscales no aprobadas | Revisor profesional; mantener bloqueos existentes, no habilitar contratos por casilla. |
| R-04 | Riesgo: sesión/archivo sensible en dispositivo | PWA conectada inicial; almacenamiento local explícito y acotado; responsable de privacidad. |
| R-05 | Riesgo: métricas potenciales usadas como dinero cobrado | FIN/TAB; trazabilidad y etiquetas separadas; Moisés valida definiciones. |
| R-06 | Riesgo: resultado de inversión con supuestos incompletos o TIR ambigua | EXT-08; conservar escenarios y método, explicar ausencia de resultado y cotejar casos por cálculo independiente. |
| R-07 | Riesgo: comparables desactualizados, ubicación imprecisa o ruta sin cobertura | EXT-09; procedencia/fecha/precisión, permisos, tratamiento de faltantes y alternativa en lista. |
| R-08 | Riesgo: acceso de clientes o IA a expedientes ajenos | EXT-10/EXT-06; autorizaciones efectivas, proyecciones mínimas, revocación e índices privados probados entre dos identidades. |
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

Paquetes de fase 6: EXT-06, EXT-08, EXT-09 y EXT-10 están solicitados para el producto ampliado. Las demás extensiones entran al backlog de ejecución por decisión de negocio o necesidad demostrada. Descubrimiento de 1–3 días orientativos por paquete; esfuerzo de implementación se estima después de validar modelos, proveedor y alcance. Las ventanas originales cubren el núcleo y no estiman estas cuatro capacidades.

| ID / capacidad | Cuándo evaluarla / dependencias | Resultado de descubrimiento antes de programar |
|---|---|---|
| EXT-01 — Compradores y matching | Equipo requiere seguimiento de requisitos contra varios inmuebles; CRM-01/OPS-01 | Reglas aprobadas, coincidencias explicables y permisos. |
| EXT-02 — Renta/administración | Hay contratos recurrentes administrados por Fortius; FIN-02/CIE-01/LEG-01 | Ciclo de renta/depósitos/renovación/mora/entrega y reparto de cobros definido. |
| EXT-03 — Proveedores/mantenimiento | Hay órdenes, presupuestos y trabajos que coordinar; EXT-02 o caso de venta concreto | Responsable, autorización, evidencia y enlace a operación/arrendamiento. |
| EXT-04 — Portales/correo/calendario/WhatsApp API | Doble captura real y proveedor con acceso API; OPS-01/PRV-01 | IDs externos, consentimiento, idempotencia, reintentos y costo. Enlace WhatsApp no equivale a integración. |
| EXT-05 — CFDI/contabilidad/bancos/firma | Necesidad confirmada y proveedor/revisión especializada; FIN-02/DOC-01/PRV-01 | Alcance legal, contrato API, conciliación y permisos; no custodiar dinero por defecto. |
| EXT-06 — Búsqueda documental y revisión asistida de cláusulas | Solicitada; corpus autorizado/versionado y DEC-14; DOC-01/LEG-01/PRV-01, con aislamiento de acceso de SEG-01 | Búsqueda con documento/versión/página, propuestas de cláusulas, evaluación de citas/abstención/permisos y revisión humana. |
| EXT-07 — Cola/worker/eventos | Trabajos duran o reintentos superan límites medidos; ESC-01 | Métrica, idempotencia, reconciliación y plan de operación. |
| EXT-08 — Análisis de inversión | Solicitado; DEC-12 y FIN-02/TAB-01/OPS-01/SEG-01 | Escenarios con TIR/VAN, flujo, presupuesto, supuestos, separación de financiación y resultados comprobables. |
| EXT-09 — Mapas, comparables, zonas y rutas | Solicitados; DEC-11 y REL-01/TEC-01/VIS-01/SEG-01 | Fuentes/precisión/cobertura, uso permitido, motor/costo, capas autorizadas y recorrido sintético de visitas. |
| EXT-10 — Portal privado de clientes | Solicitado; DEC-13 y REL-01/OPS-01/DOC-01/SEG-01/AUT-01/PRV-01 | Identidad externa, información compartida, solicitudes, permisos efectivos, revocación y uso móvil. |

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
- [ ] Ajustar rangos y capacidad con duración observada, sin atribuir a Codex plazos garantizados ni conversiones comerciales.

Las tareas de continuidad marcadas corresponden a la evidencia anterior; las tareas de captación permanecen pendientes. Cada nueva ejecución debe registrar su resultado, revisión y límites en este mismo plan.

## Cómo trabajar y registrar avances

1. Tomar una sola tarea, leer sus entradas/dependencias y comprobar qué parte ya existe.
2. Si cambia comportamiento, escribir primero una prueba que reproduzca el caso y verla fallar antes de implementar.
3. Hacer el cambio menor que cumple el criterio, comprobar permisos/compatibilidad y repetir las verificaciones afectadas.
4. Registrar en este archivo el cambio, el commit o estado local, la prueba real, la fecha y los límites. No crear otro roadmap, bitácora de desarrollo o JSON de seguimiento paralelo.
5. Una decisión menor de ingeniería puede resolverse y explicarse aquí. Política de negocio, interpretación jurídica, infraestructura productiva y datos reales requieren su autorización específica.
6. Revisar cada entrega sobre los archivos finales. Aprobación técnica, aceptación humana y publicación son hechos distintos.

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

**Preparación local terminada y comprobada. Siguiente acción:** continuar la fase de captación, empezando por REL-01 y SEG-01, con DEC-02/03/04/05/09 resueltas antes de activar sus políticas. Los pendientes del proveedor siguen abiertos; el ERP completo no se declara terminado por ordenar archivos.
