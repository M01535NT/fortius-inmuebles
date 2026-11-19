# De panel a medida a producto vendible

**Fecha:** 18 de noviembre de 2026. **Qué es:** una investigación con crítica. No cambia ninguna regla de `SPEC.md` ni de `PLAN.md`: lo que aquí se propone solo entra si el titular lo decide (ver «Choque con lo escrito», al final del resumen).

**Cómo leer la certeza de cada dato.** Cada dato del mercado lleva su enlace y la fecha de consulta (18/11/2026, salvo que se diga otra).

| Marca | Qué significa |
| --- | --- |
| **[Leído]** | La página oficial se abrió y se leyó; el dato sale de ella. |
| **[Búsqueda]** | El dato viene del resumen que devolvió el buscador sobre una página oficial que el sitio no dejó abrir. Es probable, no está leído de primera mano. |
| **[Tercero]** | Blogs, agregadores o reseñas. Solo orientan. |
| **[Recordado]** | Lo sé de antes y no lo comprobé. Se avisa cada vez. |
| **No encontrado** | Se buscó y no apareció. No prueba que no exista. |
| **[Código]** | Comprobado leyendo este repositorio el 18/11/2026; se da el archivo. |

**Precios:** todos son aproximados. Cambian con el país, la moneda y las ofertas del momento, y algunas páginas se leyeron con cifras ambiguas. Antes de citar uno a un cliente, se abre su página.

---

# Resumen para el titular

## En una frase

Sí se puede convertir el panel en un producto que se venda a despachos de abogados, pero no con «tres niveles de configuración» tal como están planteados: hacen falta **cinco piezas**, y la primera no es una configuración sino una decisión sobre cómo se separan los datos de cada cliente.

## Lo que encontré

1. **Es realista para despachos jurídicos pequeños de México, empezando por una sola especialidad y un despacho piloto.** Está cerca de lo que Fortius ya hace: un caso, sus personas con papel, sus documentos, su plan, sus honorarios y su historial. Para topógrafos e ingenieros es probable, pero pide piezas nuevas (cotizar por proyecto, entregables con versión). Para consultorios no: el centro de su trabajo es la cita y el expediente clínico regulado, no el caso. Sería otro producto.
2. **Hoy el panel es de una sola empresa por dentro, y eso es lo que impide venderlo.** Casi cada lista (papeles de las personas, encargos, estados, canales, formas de pago…) está escrita en la pantalla, en el servidor y en la base a la vez. Las preguntas de la consulta, los documentos que se piden y lo que enciende cada encargo son de inmuebles y están escritos en el programa. El nombre «Fortius» sale en mensajes y en el valor «fortius» de las tareas. La hora de Tijuana está escrita en 30 archivos. Nada separa los datos de una empresa de los de otra.
3. **La propuesta de tres niveles va en buena dirección, pero le faltan tres cosas que los despachos del mercado sí tienen:** (a) **campos propios por tipo de caso** (un penalista necesita «juzgado» y «número de causa»; un fiscalista, «autoridad» y «ejercicio»; así lo hacen Clio, MyCase y Filevine); (b) **las reglas de la consulta y de los documentos como datos**, no como código; y (c) **separar a cada cliente**. Y los «paquetes de giro» deben ser una copia inicial de contenido, no un sistema que se actualiza solo.
4. **Para separar a los clientes recomiendo, al principio, una base y un despliegue por cliente** (es lo que hace Frappe Cloud, con una base por sitio) y no una base compartida con un identificador de empresa en cada tabla. Cuesta unos USD 10 al mes de cómputo por cliente (aproximado) y evita que un error de programación deje a un despacho ver los datos de otro, que para un despacho es secreto profesional. Se revisa cuando haya unos diez clientes.
5. **Un abogado litigante no usará el producto sin plazos legales (en días hábiles) ni facturación electrónica.** Hoy el panel no tiene ni lo uno ni lo otro. No encontré un producto con tipos de caso fiscal y penal mexicanos listos; el único con facturación electrónica ligada al expediente en México es Tirant, con documentación de 2020 a 2022. Ese es el hueco comercial, y también el trabajo más grande.
6. **Lo que el panel hace bien y lo distingue de los líderes: no tocarlo.** Nunca frena, solo avisa (Zoho y HubSpot obligan a cumplir etapas). La consulta capturada en vivo abre el asunto con personas, documentos y plan en un paso. El historial se guarda solo, los conflictos de edición se avisan, la visibilidad por asesor la hace cumplir la base y los informes al cliente nunca llevan notas internas.
7. **Antes de vender hay que terminar lo de casa:** el cambio al panel nuevo (etapa 11), los 47 hallazgos de la prueba del 18/11, pruebas automáticas que corran siempre (hoy solo corren antes de integrar), y resolver el tema legal de guardar datos ajenos.

## Lo que no hay que hacer

Un constructor de pantallas, un lenguaje de fórmulas o scripts para el cliente, una tienda de módulos de terceros, tablas creadas en caliente por cada cliente, ni volver genérico el módulo de Inmuebles. Todos son lo que hizo que Salesforce, Odoo y Frappe necesitaran equipos grandes.

## Las cinco decisiones que le tocan

1. **¿Con qué despacho y con qué especialidad se empieza?** Se necesita un despacho piloto real, con casos reales, que acepte probar semanalmente. Mi sugerencia (supuesto): fiscal primero, porque sus plazos son claros y sus datos son menos delicados que los de un penalista.
2. **¿Es el mismo código con Fortius como primer cliente, o un producto aparte?** Recomiendo el mismo código, en una rama nueva, con Fortius como primer cliente (con su «paquete Inmobiliaria»). Esto choca con lo escrito (ver abajo).
3. **¿Cuánto y cómo se cobra?** Referencias del mercado: MyCase de 50 a 130 USD por usuario al mes; EasyBroker de 490 a 1,490 MXN por mes según el inventario; HubSpot cobra aparte una cuota de instalación (1,500 a 3,500 USD en Sales Hub). Mi sugerencia (supuesto): por despacho, con usuarios incluidos y módulos, más una cuota única de instalación que cubra importar sus datos y capacitarlos.
4. **¿Aceptas guardar datos de clientes de otros despachos?** Es una responsabilidad legal distinta a la de Fortius: serías el proveedor que guarda datos que otros controlan. Se necesita un contrato, un aviso y que el abogado lo revise antes del primer dato ajeno. Es una condición, no un detalle.
5. **¿Los plazos legales y la facturación electrónica entran en la primera versión?** Sin ellos, un litigante no lo usará (supuesto); con ellos, la primera versión es bastante más grande. Y alguien con título tiene que validar las reglas de plazos, porque no se inventan.

## Choque con lo escrito

Esto es lo que se contradice si se sigue esta propuesta. No lo apliqué; se decide cuál camino tomar.

| Dónde está escrito | Qué dice | Con qué choca |
| --- | --- | --- |
| `AGENTS.md`, segundo párrafo | «Un solo producto: el sitio público de Fortius Inmuebles y su panel operativo.» | Un producto que se vende a otros negocios. |
| `SPEC.md`, sección 2, idea 1 | «Sirve para cualquier caso inmobiliario.» | Despachos fiscalistas y penalistas no son casos inmobiliarios. |
| `SPEC.md`, sección 15, «Más adelante» | Campos propios y módulos que se encienden, como funciones lejanas. | Aquí propongo que sean de las primeras. |
| `PLAN.md`, etapa 12 | Solo catálogos de valores, tipo de asunto y avisos. | Sin semántica en los catálogos y sin reglas como datos no alcanza para otro giro. |
| `SPEC.md`, sección 12 | Dos papeles fijos: director y asesor. | Un despacho tiene también asistentes, pasantes y socios. |

**Mi propuesta:** como afecta varias secciones y trabajo ya hecho, **abrir una rama nueva** (por ejemplo `producto`), donde se modifiquen `SPEC.md`, `PLAN.md` y `AGENTS.md`, sin tocar la versión que se está construyendo para Fortius. Es lo que pide la sección 19 de `SPEC.md` para cambios grandes. La otra sesión que trabaja en esta carpeta tiene cambios sin guardar en `SPEC.md` y `PLAN.md`; por eso aquí no se tocó ninguno.

---

# Parte 1 · El mercado

## 1.1 A quién estudié y por qué

Quince productos, con distinta profundidad (la columna «Fuente» dice cuánto se pudo leer):

| Familia | Producto | Por qué está | Fuente |
| --- | --- | --- | --- |
| Suites y ERP modulares | Zoho (CRM, Creator, One) | Líder en suites con módulos propios y proceso por etapas | [Leído] páginas oficiales |
| | Odoo | ERP modular con páginas por giro (abogados, inmobiliarias) y tienda de módulos | [Leído] y [Búsqueda] |
| | HubSpot | CRM más usado; modelo de objetos propios y cuotas de instalación | [Leído] |
| Espacios configurables | Notion | Base de datos con vistas; la referencia que el titular nombró | [Leído] |
| | Airtable | Base de datos + pantallas por persona; plantillas por industria | [Leído] y [Búsqueda] |
| | monday.com | Mismo motor empaquetado como varios productos | [Leído] |
| | ClickUp | Tipos de tarea propios y plantillas con fechas reajustables | [Leído] y [Búsqueda] |
| Plataformas con objetos propios | Salesforce | El estándar de metadatos y campos propios | Solo arquitectura, [Leído] y blogs. No estudié su oferta comercial |
| | Frappe / ERPNext | Código abierto guiado por metadatos | Solo arquitectura, documentación oficial. No estudié precios |
| Despachos jurídicos | Clio (Manage y Grow) | El más usado del mundo | [Búsqueda] casi todo (su sitio dio error 403) |
| | MyCase | Campos propios y flujos por plan; precios públicos | [Leído] |
| | Filevine | El más configurable de la familia | [Leído] el sitio comercial; [Búsqueda] la ayuda |
| | Smokeball | Único con tipos de asunto penales y fiscales ya hechos | [Leído] |
| CRM inmobiliario | EasyBroker (México) | El más visible en México; API pública | [Leído] |
| | Follow Up Boss (EE. UU.) | Seguimiento de personas con embudos y campos propios | [Leído] |

**Revisados con menos profundidad** (para no pasarme de quince bien estudiados): Coda (precio vigente no verificable), Tokko Broker y Wasi (poca documentación pública), y para consultorio, Jane App, Cliniko y AgendaPro (solo para medir distancia, sección 1.6). No pude abrir kvCORE/BoldTrail, EGO Real Estate ni Inmuebles24.

## 1.2 Personalizar sin programar: quién lo da y dónde lo cobra

Esta es la tabla que más importa. Muestra que **el «tipo de registro propio» es lo que los líderes reservan para sus planes caros**.

| Producto | Campos o tipos de registro propios | Etapas o embudos | Permisos finos | Dónde se limita por plan |
| --- | --- | --- | --- | --- |
| Zoho CRM | Módulos propios con editor visual; límite de módulos 10 / 25 / 200 / 500 según edición. Campos propios no en la gratuita [Leído] [módulos](https://help.zoho.com/portal/kb/articles/customize-modules) | Blueprint: etapas, quién hace cada paso, tareas obligatorias antes de avanzar; desde Profesional (3 activos), 50 en Enterprise [Leído](https://www.zoho.com/crm/blueprint.html) | Perfiles y permisos por módulo | Módulos, Blueprint, fórmulas, aprobaciones (Enterprise) [Leído](https://www.zoho.com/crm/zohocrm-pricing.html) |
| Odoo | Studio: campos, vistas, menús, modelos y apps nuevas sin código [Leído](https://www.odoo.com/app/studio) | Reglas de automatización y aprobaciones en Studio | Reglas de seguridad desde Studio | Studio no está en el plan Estándar; instalarlo lo sube a Custom [Leído](https://www.odoo.com/documentation/19.0/applications/studio.html) |
| HubSpot | Objetos propios solo en Enterprise [Leído](https://knowledge.hubspot.com/object-settings/create-custom-objects) | Pipelines: 15 / 100 / 350 (Starter / Profesional / Enterprise) [Leído](https://www.hubspot.com/pricing/sales) | Conjuntos de permisos, límite de edición por propiedad | Objetos propios, vistas personalizadas (Profesional+) |
| Notion | Propiedades en cada base de datos; sin límite de tipos | Sin etapas obligatorias; automatizaciones de base de datos [Leído](https://www.notion.com/help/database-automations) | Por fila y por propiedad en Business [Búsqueda](https://www.notion.com/de/help/database-property-access) | Permisos finos, historial (7 / 30 / 90 días) [Leído](https://www.notion.com/pricing) |
| Airtable | Campos y vistas propios; tope de registros por base: 1,000 / 50,000 / 125,000 [Leído](https://support.airtable.com/docs/airtable-plans) | Kanban por campo de selección | Por campo y tabla desde Team [Búsqueda](https://support.airtable.com/articles/2296468758-airtable-field-and-table-editing-permissions) | Registros por base, automatizaciones (100 / 25,000 / 100,000 al mes) |
| monday.com | Columnas con tipos | Automatizaciones: 250 / 25,000 / 250,000 al mes; flujos 3 / 20 / 250 [Leído](https://monday.com/pricing) | Roles finos solo en Enterprise (hay contradicción entre fuentes sobre columnas) | Automatizaciones y llamadas de API |
| ClickUp | Tipos de tarea propios, 43 tipos de campo; en el plan gratis solo de prueba [Leído](https://clickup.com/pricing) | Automatizaciones: 100 / 1,000 / 10,000 al mes | Roles propios: Enterprise (la ayuda dice otra cosa; sin resolver) | Campos propios y acciones de automatización |
| Salesforce | Objetos y campos propios como metadatos [Leído](https://architect.salesforce.com/fundamentals/platform-multitenant-architecture) | Record types, flujos | Perfil mínimo + conjuntos de permisos [Leído](https://developer.salesforce.com/workshops/admin-security-workshop/identity-and-access/2-security-hierarchy) | No verificado |
| Frappe/ERPNext | DocType; Custom Field y Property Setter sin tocar la app [Leído](https://docs.frappe.io/framework/user/en/basics/doctypes/customize.md) | Workflow como máquina de estados [Búsqueda] | Role Permission Manager | No verificado |
| Clio | Campos propios para asuntos y contactos agrupados en «conjuntos de campos»; no en el plan más bajo [Búsqueda](https://help.clio.com/hc/en-150/articles/9285496802331-Create-Custom-Fields-in-Clio-Manage) | Áreas de práctica con sus etapas; flujos automáticos al crear un asunto o cambiar de etapa [Búsqueda](https://help.clio.com/hc/en-us/articles/35132279298843-Clio-Manage-Automated-Workflows) | Asunto restringido a usuarios o grupos; roles propios en planes altos [Búsqueda](https://help.clio.com/hc/en-us/articles/9286062516123-Matter-Permissions-and-Rates) | Campos propios, roles, presupuestos por asunto |
| MyCase | Campos propios (texto, número, sí/no, fecha), por área o para todas; desde Pro [Leído](https://www.mycase.com/pricing/) | Etapas por área [Búsqueda](https://supportcenter.mycase.com/en/articles/9369886-case-stages) | No detallado | Campos propios y flujos desde Pro; automatización avanzada de documentos solo en Advanced |
| Filevine | Tipo de proyecto = plantilla con secciones, campos y fases, en el «Customs Editor» [Búsqueda](https://support.filevine.com/hc/en-us/articles/360004182091-What-is-a-Project) | Fases por tipo; flujos de tareas; secciones que aparecen según la fase («Flex Sections») [Búsqueda](https://support.filevine.com/hc/en-us/articles/360022614491-Flex-Sections) | Por rol y visibilidad condicional | Sin precios públicos |
| Smokeball | Plantillas propias en Word; crear un tipo de asunto propio: no encontrado | Por tipo de asunto | No detallado | Formularios por área desde el plan Grow [Leído](https://www.smokeball.com/pricing) |
| EasyBroker | Etapas editables en listas de propiedades; campos propios no encontrados [Búsqueda](https://ayuda.easybroker.com/article/419-tableros-de-propiedades) | Pipeline de ventas | Por usuario | Límite por propiedades publicadas |
| Follow Up Boss | Campos propios de 4 tipos (fecha, texto, número, lista); solo el dueño los crea y no se cambia el tipo [Búsqueda](https://help.followupboss.com/hc/en-us/articles/360015273733-Custom-Fields) | Pipelines y etapas editables; «Buyers» y «Sellers» de origen | Por usuario y equipo | Planes por usuarios |

**Lo que se repite:** el tipo de registro propio y los permisos finos son lo caro. Quien cobra por usuario (Clio, MyCase, Zoho, HubSpot) pone ahí el escalón de precio. Quien cobra por otra cosa (EasyBroker por inventario, Airtable por registros por base) deja la personalización más abierta.

## 1.3 Adopción: cómo se «instala» un cliente

| Producto | Plantillas por giro | Arranque y acompañamiento | Importación | Tienda de apps |
| --- | --- | --- | --- | --- |
| Zoho | No hay por industria en Zoho One [Leído](https://www.zoho.com/one/) | Prueba de 30 días; «Jumpstart» desde 11,000 MXN [Leído](https://www.zoho.com/one/pricing.html) | Por lotes según edición (hasta 5,000 en Excel; 1,000 a 30,000 en CSV según edición, [tercero]) | Marketplace con «Industry Solutions» |
| Odoo | Páginas por giro (despacho de abogados, inmobiliaria) que sugieren apps, **sin plantilla preconfigurada** en lo leído [Leído](https://www.odoo.com/industries/law-firm) | Prueba con app preseleccionada | Excel y CSV; **«ID externo»** permite reimportar sin duplicar [Búsqueda](https://www.odoo.com/documentation/19.0/applications/essentials/export_import_data.html) | apps.odoo.com; módulos propios solo en plan Custom [Leído](https://www.odoo.com/pricing) |
| HubSpot | No encontrado | **Cuota de instalación:** 1,500 USD (Profesional) y 3,500 USD (Enterprise) en Sales Hub [Leído](https://www.hubspot.com/pricing/sales) | **Modos «crear y actualizar», «solo crear», «solo actualizar»**, mapeo de columnas, objetos propios [Leído](https://knowledge.hubspot.com/import-and-export/import-objects) | ecosystem.hubspot.com |
| Notion | Galería de más de 30,000; legal e inmobiliaria no aparecen en la portada [Leído](https://www.notion.com/templates) | No encontrado | Sin importador directo de Excel; sí CSV, Trello, Asana, monday [Leído](https://www.notion.com/help/import-data-into-notion) | — |
| Airtable | **Inmobiliaria** y «Finanzas y Legal» como categorías [Leído](https://www.airtable.com/templates). Una copia de plantilla **no recibe cambios posteriores** del autor [foro](https://community.airtable.com/other-questions-13/when-updating-templates-do-these-updates-reflect-in-users-own-accounts-15216) | No encontrado | No encontrado | — |
| monday.com | Legal solo como caso de departamento; inmobiliaria no listada [Leído](https://monday.com/templates) | Prueba sin tarjeta | No encontrado | Marketplace (no se pudo leer) |
| ClickUp | Más de 1,000; legal e inmobiliaria no son categorías [Leído](https://clickup.com/templates). Plantillas que **reajustan fechas** al aplicarse | No encontrado | CSV, Excel, JSON; importadores de Asana y Trello [Búsqueda](https://help.clickup.com/hc/en-us/articles/6310834724247-Import-a-data-file-into-ClickUp) | — |
| Clio | **«Cuentas preconfiguradas»** por área de práctica: campos, etapas y plantillas de asunto desde el registro (Familia: 5 conjuntos de campos de asunto y 2 de contacto) [Búsqueda](https://help.clio.com/hc/en-us/articles/35393101722523-Preconfigured-Accounts) | Prueba de 7 días | Al migrar se elige aplicar la plantilla solo a asuntos nuevos o a todos | App Directory: más de 300 (la ayuda dice 250) |
| MyCase | No encontrado | Prueba de 10 días sin tarjeta [Leído](https://www.mycase.com/pricing/) | No encontrado | — |
| Filevine | Se exportan e importan plantillas de tipo de proyecto (campos, fases, flujos; no carpetas); sugieren menos de 2,000 campos por plantilla [Búsqueda](https://support.filevine.com/hc/en-us/articles/16720316292507-Project-Template-Import) | El Customs Editor lo da el administrador | Códigos de facturación desde hoja de cálculo | Integraciones y API |
| Smokeball | **28 áreas de derecho; Criminal con 23 tipos y Tax con 9**, por jurisdicción [Leído](https://support.smokeball.com/hc/en-us/articles/6011499596951-Matter-Types-Directory) | No encontrado | No encontrado | — |
| EasyBroker | — | Plan gratuito; alta inmediata [Leído](https://www.easybroker.com/mx) | Carga masiva con plantilla de Excel; migra desde Tokko, Wasi, Century 21 e Inmuebles24 con ayuda [Búsqueda](https://ayuda.easybroker.com/article/102-subir-tu-inventario-de-propiedades) | Portales (Inmuebles24, Lamudi…) |
| Follow Up Boss | Pipelines «Buyers» y «Sellers» de origen | No encontrado | No encontrado | Más de 200 fuentes de leads |

**Lo que se repite:** (1) las plantillas por giro más serias son las de Clio (cuenta preconfigurada) y Smokeball (biblioteca de tipos de asunto con formularios): se ofrecen como **arranque que se copia**, no como tipos fijos. (2) Solo Smokeball tiene tipos penales y fiscales, y son de jurisdicciones de EE. UU.: mantener eso es trabajo editorial permanente, no software. (3) La importación con mapeo, con modo «crear y actualizar» y con un identificador externo para no duplicar (HubSpot, Odoo) es lo que hace posible que un despacho traiga sus listas.

## 1.4 Experiencia de uso

La evidencia sobre navegación, búsqueda y móvil quedó escasa: muchas páginas oficiales no las describen, y no abrí los productos. Lo verificado:

- **Vistas:** Notion ofrece tabla, tablero, línea de tiempo, calendario, lista, galería y gráfico, con filtros anidados hasta tres capas [Leído](https://www.notion.com/help/views-filters-and-sorts). Airtable, ocho (cuadrícula, formulario, calendario, galería, kanban, línea de tiempo, lista y Gantt) [Búsqueda](https://support.airtable.com/docs/getting-started-with-airtable-views). ClickUp gratis: tablero, lista, tabla y calendario [Leído](https://clickup.com/pricing). monday: línea de tiempo, Gantt y calendario desde Standard [Leído](https://monday.com/pricing).
- **Pantallas por persona:** Airtable separa los datos de «interfaces» armadas con componentes [Leído](https://www.airtable.com/platform/interface-designer). Zoho Canvas diseña sin código la vista de detalle de un registro, hasta 25 por módulo [Búsqueda](https://blog.zoho.com/crm/whats-new-in-canvas-2025.html). Salesforce acumuló tres mecanismos de pantalla (layouts, páginas de registro, formularios dinámicos) [blogs](https://www.salesforceben.com/salesforce-dynamic-forms-overview-deep-dive-tutorial/).
- **Un expediente central con portal:** Clio tiene un tablero por asunto (finanzas, detalles, contactos, verificación de conflictos) y portal del cliente con mensajes, documentos, facturas, tareas y etapas [Búsqueda](https://help.clio.com/hc/en-us/articles/9285920226075-Clio-Manage-Matters-Overview). Filevine arma el proyecto con secciones propias y secciones integradas (actividad, documentos, calendario, facturación) [Búsqueda](https://support.filevine.com/hc/en-us/articles/360042525992-Section-Overview).
- **Móvil:** HubSpot, monday CRM, ClickUp y Zoho Creator tienen apps; EasyBroker, también [Leído]. Para Clio, Filevine y MyCase no lo verifiqué.
- **Búsqueda:** no encontré una fuente que la describa para ningún producto. No puedo comparar.

## 1.5 Cómo cobran y empaquetan

Todas las cifras son aproximadas. Se leyeron el 18/11/2026; la moneda varía con el país desde donde se consultó.

| Producto | Cómo cobra | Cifras (aprox.) |
| --- | --- | --- |
| Zoho CRM | Por usuario al mes, por edición | Gratis (3 usuarios); Estándar ₹800; Profesional ₹1,400; Enterprise ₹2,400; Ultimate ₹2,600 [Leído](https://www.zoho.com/crm/zohocrm-pricing.html). Zoho One: no verificado (la página mostró cifras en blanco) |
| Odoo | Por usuario al mes; la personalización es otro plan | Una app gratis; Estándar MXN 180–228; Custom MXN 330–410 (la lectura advierte diseño ambiguo) [Leído](https://www.odoo.com/pricing) |
| HubSpot | Por asiento y por «hub», más cuota de instalación | Sales Hub: Starter USD 20 de lista (7–10 de promoción); Profesional 90–100; Enterprise desde 150 [Leído](https://www.hubspot.com/pricing/sales) |
| Notion | Por miembro | Gratis; Plus USD 10; Business USD 20 [Leído](https://www.notion.com/pricing) |
| Airtable | Por asiento con permiso de edición | Team USD 20; Business USD 45 [Leído](https://www.airtable.com/pricing) |
| monday.com | Por asiento, por producto | Work Management MXN 190–380; CRM MXN 230–560; mínimo 3 usuarios en planes de pago [Leído](https://monday.com/pricing) |
| ClickUp | Por usuario | Core USD 9; Business USD 17 (moneda sin declarar) [Leído](https://clickup.com/pricing) |
| Coda | Solo se cobra al que construye | Precio vigente **no verificado** (datos de 2023: Pro USD 10, Team USD 30) |
| Clio | Por usuario al mes, cuatro planes | Starter desde USD 49; los demás «solicitar precio» [Búsqueda](https://www.clio.com/pricing/?period=monthly). Clio Grow aparte; no verificado |
| MyCase | Por usuario al mes | Basic USD 50; Pro 100; Advanced 130 (anual) [Leído](https://www.mycase.com/pricing/). Contabilidad: USD 39 por usuario como complemento |
| Filevine | Cotización por usuario y módulos | Sin cifras públicas; estimaciones de terceros 50–300 USD (no coinciden) |
| Smokeball | Cotización | Sin cifras públicas [Leído](https://www.smokeball.com/pricing) |
| EasyBroker | **Por inventario publicado**, usuarios ilimitados | MXN 490 (10 propiedades), 990 (25), 1,490 (50) al mes, con IVA [Leído](https://www.easybroker.com/mx/planes) |
| Follow Up Boss | Por usuario | Grow USD 69; Pro USD 499 con 10 usuarios [Leído](https://www.followupboss.com/pricing) |

**Lecciones de empaque:** (a) casi todos cobran por usuario y escalonan por personalización; (b) el cobro por «lo que importa» (inventario, registros) es una alternativa, y para un despacho sería por expedientes o por usuarios; (c) HubSpot y Zoho cobran acompañamiento de arranque, y eso es parte del producto, no un extra.

## 1.6 Consultorio: qué tan lejos queda

| | Despacho por casos | Consultorio |
| --- | --- | --- |
| Unidad de trabajo | Un caso con inicio, etapas, cierre | Una cita, repetida; el expediente clínico es una línea de tiempo de visitas |
| Dinero | Honorarios, igualas, horas, cuenta de clientes | Cobro por consulta; facturación a aseguradoras como complemento (Jane: USD/CAD 20 al mes más 5 por profesional) [Leído](https://jane.app/pricing) |
| Normas | Secreto profesional; confidencialidad por asunto | Expediente clínico regulado: NOM-004-SSA3-2012 y NOM-024-SSA3-2012 [Tercero](https://www.medesk.net/es/blog/costos-de-implementacion-de-software-medico/) (confirmar en el DOF); en el extranjero HIPAA/PHIPA |
| Piezas propias | Plazos, cuenta de clientes | Receta, aseguradoras |
| Piezas compartidas | Agenda, recordatorios, formularios de admisión, portal, pagos, facturación fiscal | |

Cobro en la familia: por profesional (Jane CAD 59 a 99 al mes [Leído](https://jane.app/pricing); Cliniko USD 45 a 395 según número de profesionales [Leído](https://www.cliniko.com/pricing/)). En México, AgendaPro ofrece CFDI de honorarios médicos y anuncia como «próximamente» NOM-024 y recetas personalizables [Leído](https://agendapro.com/mx/consulta-medica/software-para-consulta-medica).

**Conclusión:** queda lejos en el modelo central y cerca en las piezas periféricas. No es una configuración del mismo producto; sería otro con su propio cumplimiento. Lo digo con franqueza porque el titular pidió medirlo: **no lo intentaría**.

## 1.7 México y Latinoamérica

- **Despachos:** Tirant Gestión de Despachos (versión México) es el único con facturación electrónica ligada al expediente, calculadora de plazos procesales y buzón por asunto judicial [Búsqueda](https://gestiondespachos.tirant.com/mx/wp-content/uploads/sites/2/2022/03/carac_gen_MX.pdf); su documentación es de 2020 a 2022 y no encontré precio. MiDespacho.Cloud y Sudespacho.net existen, sin precios públicos [Leído](https://www.comparasoftware.com/midespachocloud). **No encontré un producto mexicano con tipos de caso fiscal o penal configurables y precios públicos.** Eso es una inferencia a partir de lo que se buscó, no una prueba de que no exista.
- **Inmobiliario:** EasyBroker modela la **propiedad** como recurso central con sus **operaciones** (venta, renta, renta temporal, cada una con monto, moneda y comisión), contactos con fuente y probabilidad, y solicitudes que ligan un contacto con una propiedad [Leído](https://api.easybroker.com/docs). Follow Up Boss gira en torno a la **persona**, con negocios, embudos y campos propios [Leído](https://docs.followupboss.com/llms.txt). Lo genérico: personas, etapas, fuentes, tareas, citas, listas guardadas. Lo propio de inmuebles: publicación en portales, red entre inmobiliarias, listas de propiedades por cliente.
- **Para Fortius:** como inmobiliaria, el panel compite con EasyBroker y Wasi en inventario y portales, y no es ahí donde gana. Gana en lo jurídico (asuntos con juicios, sucesiones, opinión jurídica), donde esos CRM no entran.

## 1.8 Lo que no pude comprobar

Precio de Zoho One; precio vigente de Coda; los precios y planes exactos de Clio y Filevine (sus sitios dieron error 403 y me apoyé en resúmenes de búsqueda); la ayuda de Follow Up Boss; vistas, búsqueda y app móvil de Odoo, Zoho CRM y Notion en páginas oficiales; si Odoo ofrece plantillas instalables por giro (las páginas leídas solo sugieren apps); kvCORE, EGO, Inmuebles24; precios de Tirant, MiDespacho.Cloud y Tokko; y toda la oferta comercial de Salesforce y Frappe.

---

# Parte 2 · Cómo lo construyeron (en breve)

El detalle, con fuentes y costos, está en el **Anexo A**. Aquí, lo que cambia lo que hay que construir:

| Patrón | Qué hacen los líderes | Qué haría con una persona y un agente |
| --- | --- | --- |
| Datos configurables | Salesforce: metadatos y una tabla universal con columnas genéricas. Frappe: DocType + Custom Field. Postgres/Supabase: columnas tipadas más una columna `jsonb` con estructura casi fija | Columnas tipadas para lo conocido y **una sola columna `jsonb` de campos propios** por asunto, con la definición de los campos guardada como dato por tipo de asunto. Nada de tabla universal ni de tablas creadas en caliente |
| Separar clientes | Salesforce: una base compartida con el identificador de organización en cada fila. Frappe Cloud: una base por sitio | **Una base por cliente al inicio** (aislamiento total, sin riesgo de fuga); filas con identificador de empresa más reglas de seguridad por fila solo cuando haya unos diez clientes o más |
| Módulos | Odoo: manifiesto con `depends`, `data`, `auto_install`; Frappe: apps instalables con fixtures | Un módulo es una carpeta de código más una fila «módulo activo»; dependencias declaradas en un archivo pequeño y verificadas por una prueba |
| Paquetes por giro | Clio: cuenta preconfigurada; Smokeball: biblioteca de tipos de asunto; Airtable: la copia no se actualiza | Un paquete es una **semilla versionada que se copia** al crear la empresa; se anota de qué versión salió. Sin actualización automática |
| Permisos | Salesforce: conjuntos de permisos; Frappe: gestor de permisos por rol | Pocos roles fijos en código y reglas de seguridad por fila en la base; roles propios solo cuando un cliente real lo pida |
| Automatizaciones | Frappe: flujo de estados; Odoo: acciones automáticas con código; Clio: plantillas que se aplican al cambiar de etapa | Máquinas de estado en el código y **plantillas de tareas al cambiar de etapa** (como Clio). Un motor de reglas editable no |
| Plantillas de documentos | Frappe: formato de impresión; Odoo: QWeb; Clio: Draft; Smokeball: Word con campos | Archivos Word con etiquetas (Carbone o docxtemplater), y una prueba que genera cada plantilla con datos de ejemplo |
| API y webhooks | Patrón «bandeja de salida» (outbox) y firmas HMAC | Después; la bandeja de salida es barata si se hace desde el principio |
| Importar y exportar | HubSpot (crear y actualizar), Odoo (ID externo) | CSV con vista previa, mapeo, ID externo y reporte de errores por fila |
| Advertencia | «Efecto plataforma interna» (inner-platform effect): generalizar hasta reconstruir una versión peor de la base | Generalizar solo con dos casos reales distintos que compartan forma |

---

# Parte 3 · Crítica dura al panel de Fortius

## 3.1 Qué es hoy, medido

| Dato | Valor | Fuente |
| --- | --- | --- |
| Líneas de TypeScript en backend y panel | 36,079 | [Código] `src/lib/backend`, `src/lib/panel`, `src/components/panel`, `src/app/panel` |
| Tablas creadas en migraciones | 65, en 116 archivos | [Código] `supabase/migrations/` |
| Archivos de prueba | 378 | [Código] `tests/` |
| Líneas con listas fijas (`CHECK … in (...)`) en las migraciones del panel | cerca de 45 | [Código] 16 archivos de `20261116…` a `20261118…` |
| Usos de `z.enum(...)` en el servidor | unos 40 | [Código] `src/lib/backend/*.ts` |
| Columnas de empresa o inquilino | ninguna | [Código] no hay `empresa_id`, `tenant` ni `org_id` en migraciones ni en `src/` salvo en datos del sitio |
| Archivos con la zona horaria `America/Tijuana` escrita | 30 en código, 11 migraciones | [Código] |
| Apariciones de «Fortius» como texto (fuera de nombres de tabla) | 70 | [Código] |

## 3.2 Lo que impide venderlo: el modelo de datos

**a) Cada lista vive en tres sitios y a veces en cuatro.** Ejemplo: los papeles de las personas están (1) en un `CHECK` de `20261116200200_panel_03_personas.sql`, (2) en la constante `PAPELES` de `src/lib/backend/asuntos-contrato.ts` (14 valores), (3) en el `z.enum(PAPELES)` del servidor, (4) escritos otra vez, con 11 valores, dentro de la función `fortius_inmuebles_abrir_asunto_desde_consulta` (`20261118100000_arregla_pendientes_revision.sql`; ahí solo se revisa el papel de quien llama, que siempre es «contacto» o «propietario», así que hoy no falla), y (5) en otra lista distinta de `src/lib/panel/modelo.ts`, que solo usa una prueba. Cinco copias de la misma lista son un error esperando su turno: basta agregar un papel y olvidar una. Conviene decirlo sin rodeos: la propuesta de catálogos es correcta y se queda corta si solo cambia el lugar donde se guardan las listas.

**b) Las reglas de negocio están dentro de funciones de la base y del servidor.** Dentro de `abrir_asunto_desde_consulta` están el orden de los apartados (`inmueble` 20, `interesados` 30…, que `asuntos.ts` repite en `ORDEN_APARTADO`), la lista de apartados válidos, los nombres visibles de los canales («Llamada», «WhatsApp»…) y la lista de papeles. En TypeScript, `src/lib/backend/consultas-contrato.ts` trae `documentosSegun` (qué pedir según lo que se contestó), `encargosSegun`, `papelDeQuienLlama`, `nombreDelAsunto` («Casa en la Murúa»), `inmuebleSegun`, `primerPlan` y `mensajeParaPedir` («tu asunto»); y `asuntos.ts` trae `APARTADOS_POR_ENCARGO`. Estas son **las reglas que más cambian de un negocio a otro**, y hoy solo se cambian programando. Es la parte más grande de lo que falta para otro giro.

**c) Las preguntas de la consulta son de inmuebles.** `QUIERE` (vender, rentar, comprar, regularizar, asesoría), `DE_QUIEN`, `TIPOS_INMUEBLE`, `OCUPA`, «escritura sí/no» y `DEBE` (hipoteca, predial, servicios). La columna `datos` de la tabla de consultas es `jsonb` libre (el único lugar donde la base ya acepta lo que venga), pero el servidor la ata a esas listas con `z.enum`. Para un despacho fiscalista hay que reescribir la consulta completa; con el diseño actual eso es programar.

**d) Una sola empresa.** Ninguna tabla tiene columna de empresa. La visibilidad es «director ve todo; asesor ve lo que lleva o donde colabora» con `fortius_inmuebles_is_admin()` e `is_staff()` globales (`20261116200100_panel_02_asuntos_y_apartados.sql`). Las políticas se pueden reescribir, pero son 65 solo en las migraciones del panel nuevo, y en todo el historial hay 124 funciones `fortius_inmuebles_*` (muchas con `SECURITY DEFINER`) que habría que revisar una por una. Además el historial de migraciones trae tablas y funciones con prefijo `cota_` y `mnt_` (`cota_staff`, `mnt_is_admin`, `mnt_comercial_books`), herencia de otros proyectos. **No verifiqué si siguen en la misma base de Supabase**; si es así, no se puede vender de ahí sin separarlas.

**e) El nombre y la marca están por dentro.**
- El valor `'fortius'` es un dato: `quien` de una tarea es `fortius | cliente | abogado | notaria | otro`, en un `CHECK` de `20261116200300_panel_04_plan_y_tareas.sql` y otro de `20261117200000_panel_07_apartados.sql`, y 30 usos en TypeScript (`src/lib/panel/asuntos/api.ts:101`, `NOMBRE_QUIEN`). Para un despacho debería ser «interno», con su nombre sacado de la configuración.
- Mensajes con «Fortius Inmuebles» escrito: `src/lib/panel/datos/consultas-respuesta.ts:73-94`, `consultas.ts:111`; «Hechos en Fortius», «Para Fortius» (`components/panel/asuntos/ficha.tsx`); errores («panel Fortius», `auth.ts:38`); emisor del segundo factor (`auth.ts:266`); pie de informes (`informes.ts:148`).
- Ya existe un comienzo bueno: `src/lib/backend/datos-fortius.ts` guarda los datos de la empresa (representante, domicilio…) en Configuración y `trabajos.ts` los usa en los contratos. Hay que extenderlo, no inventarlo.
- La zona horaria `America/Tijuana` (`asuntos.ts:323` y otros 29 archivos) y la moneda (`CHECK ('MXN','USD')` en ocho tablas) son supuestos de una sola ciudad. Para un despacho de la Ciudad de México basta con que la hora sea un ajuste de la empresa.

**f) Las plantillas de documentos son código.** `src/lib/formatos/` trae 44 archivos y `catalog.ts` define 44 formatos con sus campos y reglas, todos de inmuebles (promesas, contratos de intermediación, avisos). Un despacho trae sus propios machotes en Word; hoy no hay dónde ponerlos. Las dependencias `docx` y `pdf-lib` ya están: la generación existe, falta el camino de la plantilla propia.

## 3.3 Arquitectura de la interfaz: qué es genérico y qué está atado

| Pieza | Estado | Dónde |
| --- | --- | --- |
| Kit de componentes: campo, desplegable, lista, filtrar y ordenar, paleta de comandos, hoja, reordenable, posponer, favorito, atajos | **Genérico, reutilizable tal cual** | `src/components/panel/kit/` y `ui/` (shadcn) |
| Ventanas con posición recordada, regresar a la ventana anterior, notas con @ y # y fijadas | **Genérico** | `components/panel/asunto/ventana.tsx`, `notas.tsx` |
| Personas con papel, plan con etapas y tareas (dependencias, repetición), historial, documentos, apartados propios (lista, tabla, galería, texto) | **Genérico en su forma**; los valores (papeles, quién hace la tarea) son fijos | `components/panel/asunto/*` |
| Apartados propios con columnas tipadas y datos `jsonb` por fila | **Embrión de campos propios**, hoy solo dentro de un apartado | `apartados-contrato.ts` (`TIPOS_COLUMNA`, `Columna`) |
| Inmueble, Interesados, Opinión jurídica (en parte) | **Atado a inmuebles** | `components/panel/inmueble/*`, `asunto/interesados.tsx` |
| Honorarios | **Mezcla:** el presupuesto y los cobros son genéricos; el «porcentaje del precio del inmueble» (`base_inmueble_id`) y el reparto de comisión 25/25 son de inmuebles | `asunto/honorarios.tsx`, `apartados-contrato.ts` |
| Herramientas (ISR, gastos de compra y venta, crédito, comisión, opinión de valor) y 44 formatos | **Atado a inmuebles** | `components/panel/herramientas/*`, `src/lib/formatos/` |
| Inicio: «Por atender», «Para ti», «Para hoy», «Esta semana», «Lo esperas de otros», «Volver a llamar», «Por vencer» | **Genérico** | `components/panel/inicio/inicio.tsx` |
| Inicio: «Visitas», «Por cobrar» por porcentaje; Equipo con «captó / vendió» | **Atado a inmuebles** | |
| Menú y secciones | **Fijo:** siete secciones escritas en una constante; no se apagan | `src/lib/panel/secciones.ts` |

**Deuda que estorba antes de vender:**
- Conviven dos versiones del asunto: `components/panel/asuntos/` (la vieja, con la ficha de 892 líneas y el modelo «expediente», `paraFortius`) y `components/panel/asunto/` (la nueva). Solo la nueva debe quedar.
- Rutas fuera del menú de siete secciones: `/panel/agenda`, `bandeja`, `dinero`, `tramites`, `personas`, `documento`, `kit`.
- `src/lib/panel/modelo.ts` (modelo anterior, 11 papeles y 7 tipos de asunto distintos de los vigentes) lo importa solo una prueba.
- `/api/admin/*` es compartida por el panel provisional y el nuevo, con `bandeja-vieja` e `inventario-heredado`.
- Lo heredado (`/admin`, tablas de expedientes anteriores) tendría que separarse por cliente también. Mi consejo: **hacer la etapa 11 antes de cualquier trabajo de empresa**, para no separar lo que ya iba a desaparecer.

## 3.4 La experiencia de uso frente a los líderes

**Lo que hacen ellos y aquí falta (para vender a un despacho):**

| Falta | Quién lo tiene | Peso |
| --- | --- | --- |
| Campos propios por tipo de caso | Clio, MyCase, Filevine, Notion, Airtable | Alto: sin ellos un penalista no puede anotar «juzgado» o «número de causa» |
| Plazos legales con días hábiles y calendario de inhábiles | Tirant México (calculadora de plazos procesales) [Búsqueda]; Filevine («Deadline Chains» y seguimiento de cronología judicial: existen, contenido no leído) | Alto para litigantes |
| Registro de horas, igualas y facturación | Clio, MyCase, Filevine, Smokeball | Alto; la facturación electrónica mexicana (CFDI) es obligatoria para los honorarios, según blogs de proveedores de facturación; **verificar con un contador** |
| Importar y exportar | HubSpot, Odoo, ClickUp | Alto para adoptar |
| Portal del cliente con avance (hoy solo la liga de subida) | Clio, MyCase | Medio (está en «Después» de `SPEC.md`) |
| Vistas de tabla, tablero y calendario de asuntos; reportes | Notion, Airtable, monday, Filevine | Medio (hallazgos 39 y 46 de `PLAN.md`) |
| Bitácora de accesos exportable | Clio (inicios de sesión, vistas de documentos, ediciones) [Búsqueda](https://www.clio.com/resources/ai-for-lawyers/ai-data-privacy/) | Medio: confianza |
| Sincronizar correo y calendario | Clio, Filevine | Medio; `SPEC.md` decide que nada se envía solo |
| Roles propios | Clio, Filevine (planes altos) | Bajo al inicio |
| Cuenta de clientes (fiducia) con conciliación a tres bandas | Clio, MyCase | **No sé si aplica en México**; no lo asumo. Empezar con «provisión de fondos» simple |

**Lo que el panel hace peor que los líderes hoy:** las pantallas de lista (Asuntos solo se ve como lista; `PLAN.md` hallazgos 38 a 47), no hay vistas guardadas visibles ni reportes, y 47 hallazgos de la prueba del 18/11 siguen sin corregir.

**Lo que hace bien y no debe tocarse:**
1. **Nada frena, solo avisa.** Zoho Blueprint y los pipelines de HubSpot obligan a cumplir pasos [Leído]. Es una diferencia de producto. Para plazos fatales conviene un aviso más fuerte, pero seguir sin bloquear.
2. **La consulta en vivo que abre el asunto con persona, inmueble, documentos y primer plan en un paso.** Clio Grow tiene formularios de admisión en línea y reserva de citas [Búsqueda]; no encontré captura en vivo durante la llamada en ninguno.
3. **El historial automático por disparador** (`registrar_cambio`, sin copiar datos personales salvo campos listados), la versión por fila con conflicto 409 y el borrado recuperable. Es la mejor base técnica para vender confianza.
4. **La visibilidad hecha cumplir en la base** (RLS), no escondiendo botones. Clio restringe por asunto, no por documento [Búsqueda].
5. **Copiar, no ligar** (Biblioteca): coincide con lo que hacen Clio y Airtable, y con el consejo técnico de copiar anotando la versión.
6. **Informes para el cliente** con partes que se encienden y sin notas internas; el aviso de conflicto de interés (Clio verifica conflictos desde el asunto [Búsqueda]).
7. **Escribir en una línea con fecha natural, dictar, paleta de comandos, deshacer en lugar de preguntar «¿seguro?».** Detalles de producto que dan sensación de app moderna.

## 3.5 Lo que sobra para el primer despacho

No digo que se borre; digo que **no debe retrasar la primera venta**:
- De «Más adelante» en `SPEC.md`: chat del equipo, «hacerle preguntas al sistema», que Inicio sugiera el orden del día, repartir consultas solas. Son funciones de impresionar, no de vender.
- Cuatro posiciones de ventana, menú reordenable: ya están; no seguir invirtiendo.
- Herramientas fiscales de inmuebles (ISR, gastos de compra y venta, crédito, comisión) y el reparto 25/25: pasan a ser el módulo «Inmobiliario», apagable.
- Formatos de inmuebles (44): pasan a ser parte del paquete «Inmobiliaria».
- La sección Equipo con «captó/vendió»: se queda como reporte de inmobiliarias.
- Código muerto (sección 3.3).
- Leer documentos con modelo de lenguaje: hoy está bloqueado hasta que el abogado lo apruebe. Para clientes ajenos exige además informar de la transferencia de datos a un tercero; **no entra en la primera versión**.

## 3.6 Riesgos

| Riesgo | Por qué importa | Cómo bajarlo |
| --- | --- | --- |
| **Fuga entre clientes** | Se mezclan datos protegidos por secreto profesional. El servidor usa en algunos caminos la llave de servicio, que se salta las reglas de seguridad por fila (`createServerClient(undefined, true)` en `auth.ts`) | Una base por cliente al inicio; si más tarde hay base compartida, prueba automática que lea con un cliente los datos de otro, en cada tabla nueva |
| **Responsabilidad legal por datos ajenos** | En la nueva ley mexicana (publicada el 20 de marzo de 2025; autoridad: Secretaría Anticorrupción y Buen Gobierno [Búsqueda](https://www.garrigues.com/es_ES/noticia/mexico-nueva-ley-federal-proteccion-datos-personales-posesion-particulares-introduce)) el despacho es el responsable y tú serías el encargado. **No pude comprobar las obligaciones exactas del encargado de nube**; lo revisa el abogado | Contrato de encargo, aviso, lugar y respaldo de los datos; registro de datos personales (existe `docs/operacion/registro-de-datos-personales.md` como base) |
| **Una persona sola con N clientes** | Soporte, migraciones por cliente, caídas, fines de semana. Los despachos exigen disponibilidad | Pocos clientes al inicio; guion de aprovisionamiento; avisos de estado; precio que pague tiempo |
| **Calidad y pruebas** | Se corrieron 15 fallos el 17/11 y hay 47 hallazgos nuevos; la regla «no probar mientras se construye» funciona con un cliente, no con varios | Pruebas automáticas **siempre** en integración continua, y pruebas de seguridad por rol |
| **Deuda técnica** | Dos versiones del asunto, rutas viejas, un modelo muerto, 20 migraciones de arreglo | Etapa 11 antes que todo; eliminar lo muerto |
| **Reglas legales inventadas** | Plazos, formatos y avisos fiscales mal hechos dañan a un despacho | Abogado aliado que valide cada regla; cada regla con fuente y fecha de revisión (ya es la regla de `SPEC.md` para los cálculos) |
| **Dependencia de una sola persona (titular y agente)** | Si el titular se enferma, nadie conoce el sistema | Documentación operativa (ya hay `docs/operacion/`) y respaldo probado |

## 3.7 La propuesta de tres niveles, puesta a prueba

**Veredicto corto: la dirección es correcta; la forma no alcanza. Lo que hace falta son cinco piezas, no tres niveles, y falta decidir una sexta antes de todas: cómo se aísla cada cliente.**

| Lo propuesto | Veredicto | Qué falta o qué haría distinto |
| --- | --- | --- |
| **1. Catálogos editables** | Correcto y es lo primero | (a) Cada valor necesita una **clave estable** (la que se guarda) y una etiqueta editable (la que se ve); (b) los catálogos con lógica del sistema necesitan **semántica**: un resultado de cierre es «éxito», «fracaso» o «neutro»; un papel es del «lado del cliente», «del otro lado» o «de apoyo»; un estado es «abierto» o «cerrado»; así lo hacen Salesforce (etapa con «cerrada» y «ganada»), Odoo y Follow Up Boss; (c) las listas con lógica de sistema (`en_que_va`, estados de tarea, estado de documentos) **no son catálogos libres**: se pueden renombrar, no se pueden borrar ni inventar; (d) las `CHECK` se reemplazan por una validación contra el catálogo, no por nada |
| **2. Módulos que se encienden y se apagan** | Correcto | (a) El registro de módulos va **en el código** (nombre, dependencias, menú, apartados, bloques de Inicio, herramientas); en la base solo va cuáles están activos, como hace Odoo con `depends`; (b) apagar debe cerrar también la ruta del servidor, no solo esconder el menú; (c) apagar no borra datos (ya es la regla de los apartados); (d) pocos módulos (seis u ocho), con una prueba que enciende todas las combinaciones declaradas |
| **3. Paquetes de giro** | Correcto en la intención | (a) Un paquete es una **semilla versionada que se copia**, no un canal de actualizaciones: Airtable no actualiza copias, Salesforce necesita reglas de «ancestría» para actualizar paquetes administrados; no hace falta; (b) debe incluir **tipos de asunto con campos propios y etapas**, no solo «plantilla» de plan y documentos; (c) lo más caro del paquete es el **contenido legal**, que valida un abogado; Smokeball lo sostiene con equipo editorial |
| **«Primero apagable; genérico solo cuando un segundo cliente lo pida»** | **Correcta para el código, equivocada para los datos** | Para pantallas y módulos: de acuerdo (el aviso sobre «efecto plataforma interna» lo respalda). Pero **ya hay un segundo cliente en el plan** (el despacho), así que las piezas de datos que él necesita se justifican ahora: catálogos, campos propios por tipo, reglas de la consulta, marca y hora de la empresa |
| **«Sin volver genérico Inmuebles»** | Correcta | Inmuebles sigue siendo un módulo con sus propias tablas. El predio de un topógrafo no es el inmueble de Fortius (publicación, precio, portales): se modela con campos propios del asunto. Hay que comprobar que las llaves a inmuebles en honorarios, documentos y tareas aceptan valor vacío |

**Las cinco piezas** (en orden de dependencia):

| # | Pieza | Qué es | Se parece a |
| --- | --- | --- | --- |
| 0 | **Aislamiento** | Una base y un despliegue por cliente, con aprovisionamiento por guion | Frappe Cloud (una base por sitio) |
| 1 | **Vocabulario con semántica** | Catálogos con clave estable, etiqueta, orden, activo y significado para el sistema; mensajes y marca con variables; hora y moneda de la empresa | Salesforce (listas con significado), Follow Up Boss (etapas editables) |
| 2 | **Forma del caso** | Un tipo de asunto trae sus campos propios, sus etapas, su plan y sus documentos sugeridos; la consulta y las reglas de «qué pedir» son datos | Clio (área de práctica y conjuntos de campos), Filevine (tipo de proyecto) |
| 3 | **Módulos** | Encender y apagar secciones, apartados y bloques de Inicio | Odoo (`depends`), Zoho (módulos) |
| 4 | **Paquetes** | Semilla versionada que fija 1, 2 y 3 para un giro | Clio (cuentas preconfiguradas), Smokeball (tipos de asunto) |

**Una advertencia sobre las reglas como datos** (parte de la pieza 2). El consejo de los ingenieros consultados es no construir un motor de reglas editable: un lenguaje en JSON «solo mueve el código al JSON» [Tercero](https://dev.to/snehasishkonger/a-json-dsl-doesnt-make-your-rules-no-code-it-just-moves-the-code-into-json-1fb5). Mi propuesta se queda en lo mínimo: **una tabla de decisión** («si la respuesta X es Y, agregar este documento, este apartado o esta tarea»), sin fórmulas, sin condiciones anidadas, con tres operadores (igual, está en, contiene). Eso es lo que hoy hace `documentosSegun`. Si un caso real exige más, se programa.

## 3.8 ¿Es realista el objetivo? Para qué giros sí y para cuáles no

| Giro | Veredicto | Por qué |
| --- | --- | --- |
| Despachos pequeños en México (fiscalista, penalista, civil, familiar, sucesiones) | **Sí, con condiciones** | El centro (caso, personas con papel, documentos, plan, honorarios, historial, conflictos) ya existe. Faltan campos propios, plazos, igualas y horas, facturación electrónica, importación y plantillas propias. El hueco local es real (no encontré un líder con precios públicos). Hay que vender, instalar y dar soporte: no es solo software |
| Despachos con área inmobiliaria o notarías | **Sí** | Es el panel actual con el paquete «Inmobiliaria» |
| Despachos contables | **Posible; no estudiado** | Odoo los lista como giro; el trabajo es recurrente (declaraciones mensuales) y el panel ya repite tareas. Es una inferencia mía, no se investigó |
| Topógrafos e ingenieros | **Probable, segundo giro** | Es trabajo por proyecto con entregables y trabajo de campo. Falta cotización por proyecto, entregables con versión (planos, archivos grandes) y agenda de campo |
| Inmobiliarias | **Sí, pero compiten con EasyBroker, Wasi y Tokko en lo que ellos hacen mejor** (portales, bolsa); la ventaja de Fortius es lo jurídico |
| Consultorios | **No con este producto** | Otro centro (la cita), otras normas, receta y aseguradoras. Sería otro producto |
| Comercio de mostrador | **No** (ya decidido) | Sin casos ni expedientes |

**Sobre el esfuerzo.** No pongo fechas porque no las puedo cumplir con honestidad. Con una persona y un agente, lo razonable (supuesto mío) es un **piloto con un solo despacho y una sola especialidad**; vender a diez despachos pide además contratos, un proceso de instalación y alguien que conteste el teléfono.

---

# Parte 4 · Qué hacer

Tamaños como en `PLAN.md`: **chico** = una o dos sesiones; **mediano** = varias; **grande** = muchas, con varias revisiones del titular.

## 4.1 Primero, antes de empezar

| # | Qué se cambia | Por qué | Tamaño | Depende de |
| --- | --- | --- | --- | --- |
| 0.1 | **Decidir el camino:** rama nueva, y corregir `AGENTS.md`, `SPEC.md` y `PLAN.md` (sección «Choque con lo escrito») | Regla de la sección 19 de `SPEC.md` | Chico | Decisión 2 del titular |
| 0.2 | **Terminar la etapa 11:** retirar el panel provisional y las rutas viejas, borrar `components/panel/asuntos/`, `lib/panel/modelo.ts` y lo heredado | Es lo que se tendría que separar por cliente y va a desaparecer | Mediano | — |
| 0.3 | **Pruebas automáticas siempre en integración continua**, más pruebas de seguridad por rol (director, asesor, sin sesión) | Con más de un cliente, un fallo cuesta mucho más. Hoy solo se corren antes de integrar | Mediano | — |
| 0.4 | **Corregir los hallazgos del 18/11** que no dependen del rediseño (los de pantalla, 1 a 12; 32 a 37; 41 a 45) | Un despacho piloto los vería el primer día. Los hallazgos de consulta (13 a 25) se resuelven con las piezas 1 y 2, no antes | Grande | — |

## 4.2 Indispensable para vender al primer despacho

| # | Qué se cambia | Por qué (a quién se parece) | Tamaño | Depende de |
| --- | --- | --- | --- | --- |
| 1.1 | **Despliegue por cliente:** un proyecto de base y uno de aplicación por despacho, a partir del mismo código; guion que crea el proyecto, aplica las migraciones, siembra el paquete y crea al director; prueba automática de que el cliente A no ve al B; revisión de cada uso de la llave de servicio | Frappe Cloud (una base por sitio); aislamiento total para secreto profesional | Mediano | 0.2 |
| 1.2 | **Marca y empresa como configuración:** nombre, logo, membrete de PDF, textos de mensajes con variables, hora y moneda de la empresa, «el despacho» en lugar del valor `fortius`. Extender `datos-fortius.ts` | Odoo y Zoho (perfil de la empresa) | Mediano | — |
| 1.3 | **Catálogos con semántica** (etapa 12 paso 1, ampliada): tabla de catálogos con clave estable, etiqueta, orden, activo y significado; validación en lugar de cada `CHECK`; las listas con lógica de sistema quedan renombrables pero no borrables; historial de quién cambió qué | Salesforce, Follow Up Boss (etapas editables) | Grande | 0.2 |
| 1.4 | **Tipo de asunto con campos propios, etapas y plantilla:** el tipo trae su lista de campos (texto, número, dinero, fecha, sí/no, lista) y se pintan en un apartado «Datos del caso»; valores en una columna `jsonb` validada en el servidor | Clio (conjuntos de campos por área), MyCase (campos por área), Filevine (tipo de proyecto) | Grande | 1.3 |
| 1.5 | **La consulta y sus reglas como datos:** cada tipo de asunto define sus preguntas, y una tabla de decisión dice qué documentos, apartados y tareas salen de las respuestas; se reemplaza `documentosSegun`, `encargosSegun`, `primerPlan` y `APARTADOS_POR_ENCARGO` | Clio (plantillas de asunto y flujos al crear), Biblioteca de `SPEC.md` | Grande | 1.3, 1.4 |
| 1.6 | **Módulos que se encienden:** registro en código con seis o siete módulos (Inmuebles y publicación; Interesados; Honorarios; Opinión jurídica; Informes al cliente; Herramientas y formatos de inmuebles), tabla de módulos activos, y cierre del lado del servidor | Odoo (`depends`), Zoho | Mediano | 1.2 |
| 1.7 | **Paquete «Despacho» (una sola especialidad):** tipos de asunto, papeles del lado del cliente, del otro lado y de apoyo (juez o autoridad, perito, testigo, defensor…), etapas, campos propios, listas de documentos y mensajes. **Contenido validado por un abogado.** Y el paquete «Inmobiliaria» con lo de Fortius | Clio (cuentas preconfiguradas), Smokeball (tipos de asunto) | Mediano | 1.4, 1.5, 1.6 |
| 1.8 | **Plazos legales:** fecha límite en días hábiles con calendario de días inhábiles por jurisdicción, y aviso escalonado antes del vencimiento (solo aviso, no bloqueo); cada regla con fuente y fecha de revisión | Tirant (calculadora de plazos), Filevine (cadenas de plazos) | Mediano | 1.4; decisión 5 |
| 1.9 | **Honorarios de despacho:** iguala mensual (tarea que se repite y cobro recurrente), horas con cronómetro, anticipos o provisión de fondos, gastos reembolsables. **Primera versión de facturación:** registrar el folio de la factura que el despacho emite en su sistema; **integrar con un proveedor de timbrado después** | Clio y MyCase (tiempo y facturación) | Grande | 1.4; decisión 5 |
| 1.10 | **Importar CSV (personas y asuntos) y exportar a Excel**, con vista previa, mapeo de columnas, modos «crear y actualizar» e identificador externo, y reporte de errores por fila | HubSpot, Odoo | Mediano | 1.3, 1.4 |
| 1.11 | **Machotes propios en Word con campos** (`{{cliente.nombre}}`), con una prueba que genera cada plantilla con datos de ejemplo | Clio Draft, Smokeball, Carbone y docxtemplater | Mediano | 1.4 |
| 1.12 | **Invitar a más personas, con un tercer papel** (asistente sin acceso a honorarios) y pantalla de usuarios real; hoy «Invitar» está a la vista y no envía nada | Clio (restricción de asunto a usuarios o grupos) | Chico | 1.1 |
| 1.13 | **Privacidad y confianza:** bitácora de accesos exportable, aviso de privacidad y contrato de encargo revisados por el abogado, respaldo y restauración probados por cliente | Clio (actividad de inicios de sesión y vistas) | Mediano | decisión 4 |

## 4.3 Después

| Qué | Por qué | Tamaño |
| --- | --- | --- |
| Portal del cliente con avance de su caso (el último informe, tareas que le tocan) | Clio y MyCase; ya está en «Después» de `SPEC.md` | Mediano |
| Vistas de tabla, tablero y calendario de asuntos; reportes configurables | Notion, Airtable, monday (hallazgos 39 y 46) | Mediano |
| Plantillas de tareas al cambiar de etapa («cuando pase a esta etapa, agrega estas tareas») | Clio Automated Workflows | Chico |
| Firma electrónica y sincronizar correo y calendario | Clio, MyCase; la firma pide el visto bueno del abogado | Grande |
| API pública y webhooks con bandeja de salida y firma HMAC | Patrón de Stripe; se hace cuando un cliente lo pida | Mediano |
| Base compartida con identificador de empresa y reglas por fila | Cuando se pase de unos diez clientes; se prepara ya con una prueba de fuga | Grande |
| Cobro automático del propio producto | Cuando haya más de cinco clientes | Mediano |
| Campos propios en personas e inmuebles | `SPEC.md` ya lo anota | Mediano |
| Segundo giro: topografía e ingeniería (cotización por proyecto, entregables con versión, agenda de campo) | Filevine (secciones propias); Odoo (proyectos y horas) | Grande |
| Roles propios y permisos finos por apartado | Clio, Filevine (planes altos) | Mediano |

## 4.4 No hacer

- **Constructor visual de pantallas** (como Zoho Canvas, Salesforce Lightning o los formularios dinámicos de Salesforce): tres mecanismos acumulados y años de mantenimiento.
- **Lenguaje de fórmulas o scripts del cliente** (Server Scripts de Frappe, Apex, Python en Odoo): es el «efecto plataforma interna».
- **Tabla universal de metadatos o EAV** (Salesforce): requiere un motor propio de consultas e índices.
- **Tablas creadas en caliente por cada cliente** (DocTypes de Frappe): migraciones en producción por cliente.
- **Tienda de módulos de terceros** (Odoo, HubSpot): soporte, seguridad y revisión que una persona no puede sostener.
- **Actualizar paquetes ya copiados** (paquetes administrados de Salesforce, con «ancestría»).
- **Cuenta fiduciaria de clientes con conciliación a tres bandas** hasta comprobar con un abogado mexicano si aplica.
- **Hacer genérico el módulo de Inmuebles.**
- **Consultorio como giro.**
- **Renombrar el prefijo `fortius_inmuebles_`** de tablas y funciones: es solo un nombre interno, no se ve, y `AGENTS.md` pide no renombrar. Una base por cliente lo vuelve irrelevante.
- **Un motor de reglas con condiciones anidadas.**
- **Chat del equipo, preguntas al sistema, orden del día sugerido**, hasta tener clientes pagando.

## 4.5 Qué funciones copiar primero y cuáles ignorar

| Copiar primero | De quién | Ignorar por ahora | De quién |
| --- | --- | --- | --- |
| Conjuntos de campos por tipo de asunto | Clio, MyCase | Contabilidad completa y conciliación | Clio |
| Plantillas de asunto con tareas | Clio, MyCase («Workflow») | Facturación LEDES y por lotes | MyCase |
| Cuenta preconfigurada al registrarse | Clio | Agentes de IA que mueven plazos | Filevine («LOIS»), Smokeball («Archie») |
| Importar con «crear y actualizar» e ID externo | HubSpot, Odoo | Diseñador de pantallas | Zoho Canvas, Airtable Interfaces |
| Cuota de instalación | HubSpot | Gantt y cargas de trabajo | monday, Airtable |
| Bitácora de accesos | Clio | Marketplace y módulos de terceros | Odoo, HubSpot |
| Restringir un asunto a usuarios o grupos | Clio | Admisión con IA | Smokeball |
| Verificación de conflictos desde el asunto (ya diseñado) | Clio | Permisos por columna | Notion, monday |
| Calculadora de plazos | Tirant | Redes entre agencias | EasyBroker |
| Cobro por despacho, no por usuario suelto | EasyBroker (por inventario) | | |

---

# Anexo A · Parte 2 en detalle: cómo lo construyeron

Fuente de esta sección: investigación del 18/11/2026. **[Comprobado]** = leído en la fuente o visto resumido en ella; **[Recordado]** = no verificado. Las páginas de Salesforce (wiki) y Frappe (aislamiento) dieron error al abrirlas y me apoyé en resúmenes de búsqueda.

## A.1 Modelos de datos configurables

| Patrón | Cómo lo hacen | Costo | Cuándo conviene | Sobreingeniería para una persona |
| --- | --- | --- | --- | --- |
| **Tabla universal de metadatos** | Salesforce: una base compartida y un solo esquema; objetos y campos son filas de metadatos y los datos de todos los clientes viven en una tabla con columnas genéricas de texto; cada fila lleva el identificador de la organización; los índices usan tablas auxiliares; límites de gobernador por transacción [Comprobado](https://architect.salesforce.com/fundamentals/platform-multitenant-architecture) | Un motor propio de consultas, caché de metadatos e índices | Miles de clientes que definen objetos en caliente sin migraciones | **Sí, siempre**, a esta escala |
| **DocType + personalización aparte** | Frappe: un DocType define la entidad y se materializa como tabla; Custom Field y Property Setter guardan la personalización del sitio sin tocar la app; Customize Form los escribe; las personalizaciones viajan como «fixtures» [Comprobado](https://docs.frappe.io/framework/user/en/basics/doctypes/customize.md) | Se mantiene la capa de metadatos y su exportación; el tropiezo común es olvidar exportar fixtures [foro](https://discuss.frappe.io/t/how-migrate-changes-to-erpnext-doctype/23609/3) | Plataforma base con muchos clientes que añaden campos | Sí, con un solo cliente |
| **Campos propios de Odoo** | `ir.model.fields` con estado «manual» y prefijo `x_`; lo hecho en Studio vive solo en la base, y hay reportes de pérdida al actualizar a una versión mayor [Tercero](https://www.odooexperts.nl/en/blog/blog-70/why-isnt-odoo-studio-the-holy-grail-246) | Se rompe en actualizaciones; difícil de mover entre entornos | Ajustes rápidos | Como columna vertebral, sí |
| **EAV** (una fila por atributo) | Descartado por la mayoría | Integridad referencial, tipos débiles, un cruce por atributo [Tercero](https://www.educative.io/courses/sql-antipatterns-database-programming/antipattern-use-a-generic-attribute-table) | Casi nunca | Sí |
| **Columnas tipadas + `jsonb`** | Postgres recomienda preferir `jsonb` y que los documentos tengan «estructura algo fija»; Supabase: `jsonb` para datos de esquema variable, y la extensión `pg_jsonschema` para validar con `check` contra un JSON Schema [Comprobado](https://supabase.com/docs/guides/database/json) | Postgres no lleva estadísticas por clave dentro del `jsonb`, y el planificador estima mal la selectividad (un artículo habla de una consulta unas 2,000 veces más lenta por eso) [Tercero](https://contentsquare.com/blog/when-to-avoid-jsonb-in-a-postgresql-schema/) | **Es la recomendación para una persona** | No |

**Qué haría:** columnas tipadas para todo lo conocido y consultado; **una columna `jsonb` de campos propios en `asuntos`**, con la definición de campos (clave, etiqueta, tipo, obligatorio, opciones) guardada por tipo de asunto y validada con zod en el servidor (o `pg_jsonschema` si más adelante se quiere en la base). Si un campo propio se vuelve importante, se promueve a columna con una migración. Índice GIN `jsonb_path_ops` solo cuando una consulta real lo pida, comprobado con `EXPLAIN`. Que ya existan `columnas` y `datos jsonb` en los apartados propios (`FilaPropia` en `asuntos-contrato.ts`) significa que el renderizador de cinco tipos de campo (`texto`, `numero`, `dinero`, `fecha`, `si_no`) **ya está hecho**.

## A.2 Separar a cada cliente

| Modelo | Qué es | Costo | Cuándo conviene |
| --- | --- | --- | --- |
| **Silo: una base por cliente** | Una instancia de base por cliente. AWS: máximo aislamiento, máximo costo y complejidad [Comprobado](https://aws.amazon.com/blogs/database/multi-tenant-data-isolation-with-postgresql-row-level-security). Frappe Cloud: cada sitio tiene su base [Comprobado](https://docs.frappe.io/customer-guide/scalability/architecture-overview) | Las migraciones corren N veces; ~USD 10 al mes de cómputo mínimo por proyecto más el plan de la organización (USD 25); ejemplo oficial de tres proyectos: USD 45 al mes [Búsqueda](https://supabase.com/docs/guides/platform/billing-faq) (**aproximado**; verificar en supabase.com/pricing) | De 1 a unas decenas de clientes con exigencias de confidencialidad |
| **Esquema por cliente** | Una base, un esquema por cliente | El catálogo del sistema crece con cada esquema y tabla; respaldos y limpieza sufren; un caso de 17,000 esquemas lo ilustra [Tercero](https://www.commandprompt.com/about/success-stories-case-studies/from-unrecoverable-to-under-control-taming-multi-tenant-postgresql-at-17000-schemas/) | Casi nunca para esta escala |
| **Filas con identificador + reglas por fila** | Una columna de empresa en cada tabla. AWS: en este modelo se requiere RLS; el dueño de la tabla y los roles con `BYPASSRLS` se saltan las reglas; `FORCE ROW LEVEL SECURITY` las aplica también al dueño [Comprobado](https://aws.amazon.com/blogs/database/multi-tenant-data-isolation-with-postgresql-row-level-security) | Retocar todas las políticas y funciones; dependes de que cada consulta filtre; cada ruta con llave de servicio es un riesgo; rendimiento (ver abajo) | Cientos de clientes pequeños, o cuando los costos del silo pesen |

**Rendimiento de las reglas por fila en Supabase** [Comprobado](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv): indexar las columnas de las políticas (la página cita mejoras de más de 100 veces en tablas grandes), envolver `auth.uid()` y las funciones en `(select ...)` para que el planificador las calcule una vez, poner siempre `TO authenticated`, y no depender solo de RLS: filtrar también en la consulta. Los tiempos son de una prueba del proveedor; hay que medir en la propia base. Para guardar la empresa en el token se usa el *Custom Access Token Hook*; el identificador va en `app_metadata`, no en `user_metadata`, porque el usuario puede editar este último [Tercero](https://makerkit.dev/blog/md/tutorials/supabase-rls-best-practices).

**Qué haría y por qué.** Recomiendo **silo al principio**. Las 116 migraciones, 65 políticas del panel nuevo y 124 funciones `fortius_inmuebles_*` están escritas para una sola empresa; volverlas multiempresa toca todo y un error deja ver datos ajenos. El silo se parece más al mundo del titular (cada despacho es una caja separada), simplifica el borrado y la portabilidad de datos de un cliente que se va, y su costo es un guion de aprovisionamiento y de migraciones por cliente. Paso a base compartida cuando el trabajo de operar N bases pese más que el de mantener un modelo con identificador de empresa (señal: unas diez a veinte bases). Si ese día llega, hay que tener ya una prueba que lea con un cliente los datos de otro, tabla por tabla.

## A.3 Módulos y paquetes

- **Odoo [Comprobado](https://www.odoo.com/documentation/18.0/developer/reference/backend/module.html):** cada módulo es un manifiesto con `version`, `depends` (qué se instala antes), `data` (archivos que se instalan o actualizan), `auto_install` (módulos «de enlace» que se instalan solos cuando están sus dependencias) y `application`.
- **Frappe [Comprobado]:** las apps se instalan sobre un sitio y traen `hooks.py` con fixtures que se reimportan al actualizar. Cómo resuelven conflictos con personalizaciones del cliente: no encontrado.
- **Salesforce [Búsqueda](https://developer.salesforce.com/docs/platform/pkg2-dev/guide/sfdx-dev2gp-rules-ancestry-upgrades.html):** en paquetes administrados, la «ancestría» decide qué versiones puede instalar un suscriptor y las «reglas de manejabilidad» deciden qué puede cambiar cada parte tras instalar. Es lo que hace falta si se quiere actualizar paquetes ya instalados, y es mucho trabajo.
- **Airtable [foro](https://community.airtable.com/other-questions-13/when-updating-templates-do-these-updates-reflect-in-users-own-accounts-15216):** una copia de plantilla no recibe cambios posteriores. Notion y monday: no encontrado.
- **Activación por cliente:** Stripe ofrece «entitlements» (detalle no leído).

**Qué haría:** un módulo es una carpeta de código (pantallas, rutas, migraciones) más una fila «módulo activo». Las dependencias se declaran en un archivo pequeño y se verifican con una prueba, no en tiempo de ejecución. Un paquete de giro es un guion de siembra versionado en git que crea catálogos, tipos de asunto, plantillas y guías; **se copia, y cada copia anota la versión de la que salió**. Para lo que se quiera actualizar centralmente, se referencia por identificador y versión, no se copia.

## A.4 Permisos, automatizaciones, plantillas, API, importación

| Tema | Lo que hacen | Qué haría |
| --- | --- | --- |
| **Permisos** | Salesforce: perfil mínimo más conjuntos de permisos agrupables [Comprobado]; Frappe: Role Permission Manager | Roles fijos y pocos en código (director, asesor, asistente), reglas por fila en la base; roles propios solo cuando un cliente real lo pida; cada permiso configurable multiplica los casos de prueba |
| **Flujos y automatizaciones** | Frappe Workflow: máquina de estados con transiciones por rol y condición opcional [Búsqueda]; Odoo: acciones automáticas con disparadores, correo, código y webhooks (las basadas en tiempo se revisan cada 240 minutos por defecto) [Comprobado](https://www.odoo.com/documentation/18.0/applications/studio/automated_actions.html) | Máquinas de estado en TypeScript y **plantillas de tareas al cambiar de etapa**, no un motor editable. Un motor de ejecución duradera (Inngest o Vercel Workflow) solo para flujos largos con esperas |
| **Plantillas de documentos** | Carbone: plantillas Word con etiquetas tipo `{d.campo}` y datos en JSON; generar PDF requiere un servidor de oficina [Comprobado](https://github.com/carboneio/carbone). docxtemplater: existe; **su licencia no la comprobé**. Frappe (Print Format con Jinja) y Odoo (QWeb): [Recordado] | Plantillas Word con etiquetas; el **contrato de etiquetas** se versiona en git y una prueba genera cada plantilla con datos de ejemplo. La licencia de la herramienta elegida se revisa antes de adoptarla |
| **API y webhooks** | Patrón «bandeja de salida»: el mensaje se escribe en una tabla en la misma transacción que el cambio, y un proceso lo envía después [Comprobado](https://microservices.io/patterns/data/transactional-outbox). Stripe firma el cuerpo en bruto con HMAC; se verifica en tiempo constante con tolerancia de tiempo y se deduplica por `event.id` [Comprobado](https://docs.stripe.com/webhooks.md) | Después de la primera venta. La tabla de bandeja de salida es barata si se prevé temprano |
| **Importación** | No encontré una fuente primaria sobre CSV con mapeo; el patrón común (subir, vista previa, mapeo, validar fila por fila, reportar errores sin abortar) es [Recordado]. HubSpot y Odoo, ver sección 1.3 | CSV por entidad con vista previa, mapeo, ID externo y reporte de errores por fila |

## A.5 Pantallas guardadas como datos

- **Salesforce:** layouts, páginas de registro de Lightning y formularios dinámicos (tres mecanismos) [Tercero](https://www.salesforceben.com/when-to-use-record-types-vs-page-layouts/).
- **Frappe [Comprobado](https://docs.frappe.io/framework-git/doctypes/layout-view-settings.md):** el orden de los campos define el formulario; Section, Column y Tab Break son campos que no guardan datos; `in_list_view` define las columnas de la lista.
- **Formularios dinámicos en React:** `rjsf` genera la interfaz desde un JSON Schema; react-hook-form con zod exige describir los campos a mano; hay alternativas como JSONForms y SurveyJS [Tercero](https://npm-compare.com/formik,react-final-form,react-hook-form,react-jsonschema-form).

**Qué haría:** pantallas escritas en React normal. Lo único «dato» que guardaría pronto es la lista de campos propios por tipo de asunto, y un renderizador pequeño de cinco o seis tipos (ya existe en los apartados propios). **No** guardar layouts completos, columnas de listas ni tableros como datos hasta que un caso real lo pida; las preferencias de qué columnas ve cada quien sí pueden ser un JSON en su perfil (`use-mis-preferencias.ts` ya guarda favoritos y vistas así).

## A.6 Advertencias

- **Efecto plataforma interna (inner-platform effect):** sistema tan generalizado que acaba siendo una versión peor de la base. Lo nombró Alex Papadimoulis en 2006. Remedios: preguntar cuál es el problema real antes de generalizar y preferir código específico que cambia con los requisitos [Wikipedia](https://www.Wikipedia.org/wiki/Inner-Platform_Effect), [Matt Rickard](https://blog.matt-rickard.com/p/the-inner-platform-effect).
- **Personalización pegada a la base:** en Odoo se reportan pérdidas al actualizar [Tercero]; la recomendación repetida es mantener lo importante en un módulo de código.
- **Reglas en JSON como «sin código»:** mueve el código al JSON y exige esquema, validación, evaluador seguro y versionado [Tercero].
- **Regla de trabajo:** generalizar solo cuando ya hay dos casos reales que comparten forma; todo lo «configurable» necesita esquema, validación en el servidor, versionado y una vista de quién configuró qué; si no cabe eso, queda en código; llevar un registro corto de «cosas que decidí no generalizar y por qué», y revisar cada seis meses qué configuraciones nadie usó.

## A.7 Esbozo de diseño sobre la pila real (propuesta, no aplicada)

**Nada de esto está escrito en migraciones.** `AGENTS.md` pide avisar al titular antes de escribir una; cada una sería un archivo nuevo en `supabase/migrations/`, nunca una reescritura.

```sql
-- Una sola tabla de catálogos con clave estable y significado para el sistema.
create table public.fortius_inmuebles_catalogo_valores (
  catalogo   text not null,          -- 'papel', 'resultado_cierre', 'fuente', 'tipo_inmueble'…
  clave      text not null,          -- lo que se guarda en los asuntos; no cambia nunca
  etiqueta   text not null,          -- lo que se ve; el director la renombra
  orden      integer not null default 0,
  activo     boolean not null default true,
  semantica  text,                   -- 'exito' | 'fracaso' | 'neutro' | 'lado_cliente' | 'otro_lado' | 'apoyo' | …
  es_sistema boolean not null default false,  -- renombrable, no borrable
  primary key (catalogo, clave)
);
-- Validación en lugar de cada CHECK ... in (...): un disparador genérico por columna.
--   create trigger valida_papel before insert or update on asunto_personas
--   for each row execute function fortius_inmuebles_validar_catalogo('papel', 'papel');
-- (acepta un valor desactivado si la fila ya lo tenía: «desactivar no borra»)

-- Tipos de asunto: nombre, campos propios, apartados que enciende, plan y documentos sugeridos.
create table public.fortius_inmuebles_tipos_asunto (
  clave text primary key, nombre text not null, orden integer, activo boolean default true,
  campos jsonb not null default '[]',        -- [{clave, etiqueta, tipo, obligatorio, opciones}]
  apartados text[] not null default '{}',
  consulta jsonb not null default '{}',      -- preguntas y tabla de decisión: {cuando:{p:'de_quien',es:'fallecio'}, entonces:[{pide:'Acta de defunción'}]}
  biblioteca_ids uuid[] not null default '{}'
);
-- asuntos: tipo_clave text, fuente_clave text, valor_estimado numeric, moneda text, campos jsonb default '{}'
-- config(clave, valor jsonb): empresa, zona_horaria, moneda_principal, modulos_activos[], textos con variables
```

**Dónde se toca el código existente:**

| Hoy | Cambio |
| --- | --- |
| `src/lib/backend/*-contrato.ts` (constantes y `NOMBRE_*`) | Un cargador `catalogos.ts` que lee el catálogo y, si está vacío, usa los valores con que se empezó (regla de `SPEC.md`); los `z.enum` pasan a validar contra el catálogo cargado |
| `consultas-contrato.ts` (`documentosSegun`, `encargosSegun`, `primerPlan`, `mensajeParaPedir`) | Una función `evaluarTabla(tipoAsunto.consulta, datos)`; los mensajes con variables de empresa |
| `asuntos.ts` (`APARTADOS_POR_ENCARGO`, `ORDEN_APARTADO`) | Lo lee del tipo de asunto y de los módulos activos |
| `abrir_asunto_desde_consulta` (SQL) | Deja de repetir papeles, orden de apartados y nombres de canal: valida con la función de catálogo y recibe el orden por parámetro (ya recibe `p_apartados`) |
| `src/lib/panel/secciones.ts` | `SECCIONES` filtradas por módulos activos y con nombres de la configuración |
| `src/components/panel/panel-shell.tsx` | Un contexto de empresa (nombre, logo, hora, módulos) para todo el panel |
| `datos-fortius.ts` | Se extiende a datos de empresa; sale «Fortius» de los textos |
| `hoyEnTijuana()` y 29 archivos más | Una sola función `hoyEnLaZonaDeLaEmpresa()` |
| `quien = 'fortius'` | Valor de sistema `interno`, etiqueta tomada de la empresa; permitir elegir una persona concreta del asunto (hallazgo 35) |

---

# Anexo B · Hechos del código que sostienen la crítica

Todos comprobados leyendo el repositorio el 18/11/2026.

- Tablas con prefijo `fortius_inmuebles_`: nombres en tablas y funciones (124 nombres distintos de función `fortius_inmuebles_*` en todo el historial, entre guardas, visibilidad, folios y recibos).
- Tipo, estado y reglas con listas fijas: ver 3.1 y 3.2.
- Reutilizable: `registrar_cambio` (disparador de historial), `panel_version` (versión por fila y conflicto 409), `deleted_at` (borrado recuperable), `es_ejemplo` (92 apariciones en migraciones del panel), `puede_ver_asunto` y funciones de visibilidad por asesor.
- El servidor lee y escribe con la sesión de quien entró (la base decide qué ve cada quien); la llave de servicio se usa en puntos concretos (`auth.ts`: fotos de perfil y recepción pública de solicitudes; restauraciones).
- La función `abrir_asunto_desde_consulta` (versión vigente en `20261118100000_arregla_pendientes_revision.sql`) crea en una transacción la persona, el asunto, los apartados, las otras personas, el inmueble, los documentos, lo ya enviado por el cliente y el primer plan.
- El panel guarda la configuración de empresa en el registro de Configuración (`datos-fortius.ts`).
- El historial de migraciones trae `cota_staff`, `cota_is_staff`, `mnt_is_admin` y `mnt_comercial_*`: **no se comprobó** si esas tablas siguen en la misma base.

# Anexo C · Fuentes y lo que no se pudo comprobar

**Archivos de trabajo de la investigación** (fuera del repositorio, en la carpeta de notas de las sesiones): fichas completas por producto, con cada enlace y su nivel de certeza, en `mercado-suites-espacios.md`, `mercado-juridico-inmobiliario-consultorio.md` y `tecnica-patrones.md`.

**No comprobado, y por qué:**
- Precio de Zoho One y precio vigente de Coda (páginas con cifras en blanco o sin contenido).
- Precios y planes exactos de Clio y Filevine, y la ayuda de Follow Up Boss (error 403 del sitio; se usaron resúmenes de búsqueda).
- Vistas, búsqueda y móvil de Odoo, Zoho CRM y Notion en páginas oficiales.
- Si Odoo ofrece plantillas instaladas por giro; si Tirant sigue vigente y a qué precio.
- Obligaciones exactas del encargado del tratamiento en nube bajo la ley mexicana vigente, y si ya se publicó su reglamento: lo revisa el abogado.
- Que la facturación electrónica de honorarios sea obligatoria en la forma descrita y los detalles de retenciones: viene de blogs de proveedores de facturación; lo confirma un contador.
- Normas de expediente clínico (NOM-004 y NOM-024): de un blog de terceros, que además las confunde en un punto; confirmar en el DOF.
- Costos de Supabase por proyecto: del resumen de la guía de facturación; verificar en su página de precios. Costos de Vercel para un despliegue por cliente: no se verificaron.
- Salesforce Flow, Temporal, XState, y la oferta comercial de Salesforce y Frappe.
- Cómo guardan sus datos internos Airtable y Notion: no hay publicación oficial.
- Licencia de docxtemplater.
- Si las tablas `cota_*` y `mnt_*` siguen en la base actual.

**Una nota de seguridad de la investigación:** al leer la página de Supabase sobre JSON apareció dentro del contenido un texto dirigido a agentes de IA que pedía generar y enviar un informe de comentarios. Es contenido de esa página, no una instrucción del encargo, y no se siguió.
