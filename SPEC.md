# Fortius — especificación del ERP/CRM

**Actualizado:** 16 de noviembre de 2026, America/Los_Angeles. **Responsable de negocio:** Moisés Núñez Tonalá.

Dice **cómo debe funcionar el sistema**; solo cambia cuando el titular decide, y lo edita el agente del tema en la rama de trabajo. Qué falta: [`PLAN.md`](PLAN.md). Lo terminado: [historial del plan](docs/erp-crm/historial-del-plan.md). Reglas retiradas y texto completo anterior a la poda del 16/11/2026: [historial de reglas](docs/erp-crm/historial-de-reglas.md). Cuando una regla nueva contradice a una vieja, queda la nueva y la vieja pasa al historial de reglas.

## Las reglas que más pesan

- **Los bocetos mandan.** El panel se reconstruye en `/panel` a partir del boceto aprobado «Fortius por asuntos» (DEC-68); `/admin` es legado y no se amplía (RP-100 PN).
- **Nada frena, solo avisa** (RP-100, DEC-61): ningún requisito detiene guardar, avanzar, publicar ni firmar; se avisa y queda anotado quién siguió. Sí se conservan permisos, RLS, validación de datos, control de versión, privacidad y «guardar no es publicar».
- **Cada quien ve lo suyo, y lo hace cumplir la base** (RP-101 PN): todo registro lleva responsable y creador; el director ve todo, el asesor lo suyo.
- **Guardar primero, ordenar después** (RP-101, RP-102, RP-103): documento sin asunto e inmueble sin propietario son válidos; todo entra por la Bandeja.
- **Sirve para cualquier caso inmobiliario** (DEC-67): una captación normal, una casa en sucesión e invadida, un terreno con sentencia de prescripción, una asesoría por etapas entre terceros. Ninguna metodología es la columna vertebral; la de captación (entrevista, levantamiento, revisión, opinión de valor) es una guía entre varias. Si un caso no cabe, se cambia el diseño; no se acomoda el caso.
- **El asunto es el centro de trabajo** (RP-106 a RP-108): cada uno arma su propio camino, con guías que sugieren, sin fases fijas (DEC-55, DEC-65).
- **Prospecto hasta firmar** (RP-90 a RP-93): cliente al firmar su contrato con Fortius, también compradores y arrendatarios.
- **Un dato faltante nunca detiene** (RP-82); descargar siempre, y descargar no es aprobar (RP-77, RP-85).
- **Guardar no es publicar**; el sitio solo muestra campos autorizados (RP-64).
- **Solo Fortius** (RP-01); la adaptación a otras inmobiliarias está en pausa.

## Reglas de producto vigentes (RP)

**Aviso sobre los números RP-100 a RP-103.** Hay dos reglas con cada uno de esos números (una del 14/11/2026 y otra del panel nuevo del 16/11/2026), y el código cita ambas. Para no confundirlas, las del panel nuevo se citan con «PN» (p. ej., «RP-101 PN»). Renumerar queda pendiente.

### Panel nuevo (PN), 16/11/2026

- **RP-100 PN · Los bocetos mandan.** El panel se construye desde los bocetos aprobados (`docs/diseno/nuevo-panel/DECISIONES.md` y el lienzo). `/admin` es legado: no se amplía y se retira al final (PN-12). `/panel` solo toca al viejo por `src/lib/panel/legado`. (PN-00)
- **RP-101 PN · Director primero, asesor después; cada asesor solo ve lo suyo.** Todo registro (persona, inmueble, asunto, pendiente, movimiento) lleva responsable y creador; la visibilidad se hace cumplir en la base (RLS), no solo en pantalla. El asesor ve lo que lleva y lo que se le comparte; el director, todo. (PN-02, PN-10)
- **RP-102 PN · Arrastrar y soltar donde se pueda** (menú, guías, tareas y pasos, pendientes, temas del equipo, listas de documentos), con equivalente de teclado (Alt + flechas o «Mover a…») y aviso de lo hecho. El orden personal se guarda por usuario; el del negocio, en el servidor con control de versiones. (PN-01)
- **RP-103 PN · Auditoría de lógica continua.** Al empezar y cerrar cada etapa, un agente auditor de solo lectura revisa si la lógica es fluida para el trabajo diario y puede proponer agregar, quitar o reordenar pasos. Informe en `docs/diseno/nuevo-panel/auditorias/`; lo que el titular acepta pasa aquí.
- **RP-104 · Sistema visual del panel nuevo** (boceto «Fortius por asuntos», aprobado el 16/11/2026, DEC-68; detalle en `DECISIONES.md`): app moderna; Inter; fondo gris muy claro con tarjetas blancas de borde fino; un solo azul para acciones; verde, ámbar y rojo solo para estados; íconos de trazo en todo, con cuadro de color por apartado; pocas palabras en pantalla y las opciones agrupadas en desplegables y menús; tema claro y oscuro. El sitio público no cambia hasta que el titular lo decida (DEC-59).
- **RP-105 · El chat del equipo va al final**, después del rol de asesor (PN-11).
- **RP-106 · El centro es el asunto.** El asunto lleva folio, documentos, dinero y lo que sigue; la persona es el centro de la relación; el inmueble, el inventario. Persona e inmueble se capturan una vez (RP-75) y el asunto las une con papeles. Un propietario con tres inmuebles tiene tres asuntos; un comprador que ve cuatro inmuebles, un asunto «Búsqueda» con cuatro ligados.
- **RP-107 · Folios.** Solo lleva folio visible lo que se cita ante terceros: asunto `EXP-######`, inmueble `FORTIUS-######`, formato emitido `EXP-######·nn·vN`, recibo `REC-AAAA-####`. Los asigna la base al guardar; únicos, no se reutilizan ni se borran. Cancelar es cerrar como «No se dio»; al dividir, el nuevo recibe folio con «derivado de». Se conservan los actuales.
- **RP-108 · Qué abre un asunto nuevo.** Cualquier encargo de trabajo (DEC-65, DEC-67). Ejemplos, no límite: (1) encargo de un inmueble en venta o renta, uno por inmueble y encargo; (2) búsqueda real de un comprador o arrendatario, uno por persona y necesidad; (3) trámite sin venta; (4) mandato de inversionista; (5) el mismo inmueble vuelve al mercado o pasa de venta a renta, con «continúa de»; (6) revisar si un inmueble se puede vender; (7) asesorar a terceros en un negocio por etapas. Consultas, visitas, archivos, cambios de precio o reaperturas no abren asunto.

### Flexibilidad (14/11/2026)

- **RP-100 · Nada frena, solo avisa.** Ningún requisito detiene guardar, avanzar, publicar ni firmar, incluidos los legales; lo que falta o vence es aviso en el asunto y en Hoy, y queda anotado quién siguió, cuándo y por qué. Pasan a aviso, entre otros: firma con hipoteca sin cancelación inscrita, publicar un compartido sin autorización, visita antes de la firma sin carta, y el paso entre etapas (se pueden saltar). Se quedan: permisos (DEC-43), privacidad, galería para publicar, el 01 sin descarga incompleta e integridad de datos. Conviene que el abogado lo sepa (antilavado y promesa). Construido en la rama (FLX-03 parte A); hasta integrarse en `main`, el sitio publicado sigue frenando. Lista completa: `PLAN.md`, FLX-03.
- **RP-101 · Un documento puede existir sin asunto.** Se guarda en la Bandeja sin datos y luego se liga a persona, inmueble, asunto o a nada; privado, con huella y papelera recuperable. (FLX-01)
- **RP-102 · Un inmueble puede existir sin propietario**, con documentos y sin captación; guardarlo no lo publica. (FLX-01)
- **RP-103 · Lo que recibimos manda.** Todo lo que llega entra por la Bandeja; el sistema lee y recomienda destino y una persona confirma con un clic o lo deja sin ligar. Nunca se aplica solo; sin coincidencia, propone crear lo nuevo, también con confirmación. (FLX-07, DEC-50)

### Producto y equipo

- **RP-01 · Solo Fortius.** Marca, flujo, equipo y formatos de Fortius; nada para otras empresas «por si acaso». Los datos de marca se leen de un solo lugar cuando se toque ese código. La adaptación a otras inmobiliarias (RP-02 a RP-04, RP-07, RP-08, RP-46) está en pausa: texto en el historial de reglas.
- **RP-05 · Roles y permisos por acción.** Director, coordinador, asesor, asistente, jurídico, contabilidad y aliado externo; permisos para ver precio mínimo, ver comisiones, aprobar descuentos, eliminar, exportar y administrar. Al arranque solo director y asesor (DEC-66).
- **RP-06 · Reglas fiscales y notariales con vigencia,** fuente y responsable, por municipio. Sin regla vigente, «pendiente», nunca una tasa supuesta. (FIS-01)
- **RP-49 · Propiedad intelectual.** No se presenta como patentado; obra ante INDAUTOR, marca ante IMPI y secreto industrial, con abogado (DEC-16).

### Trabajo diario

- **RP-09 · Libre por omisión, con ayuda para quien empieza:** el asesor arma el camino del asunto; una guía se agrega cuando sirve y nunca es obligatoria (DEC-67).
- **RP-10 · Barra de comandos (Ctrl/Cmd+K)** que busca y actúa; solo ofrece lo que el usuario puede ver y hacer.
- **RP-11 · Atajos de teclado** visibles en menús y en «?»; los de una tecla no actúan en campos y se pueden desactivar (WCAG 2.1.4).
- **RP-12 · Acciones masivas** que informan aplicados, fallidos y por qué; reintentar no repite.
- **RP-13 · Edición directa en la tabla** de estado, responsable y fecha, con control de versión.
- **RP-14 · Preferencias que siguen al usuario** (densidad, tema, columnas, orden, vistas, fijados, inicio) en el servidor; el navegador solo guarda comodidades del dispositivo.
- **RP-15 · Estado de guardado siempre visible;** «Guardado» solo tras confirmar el servidor.
- **RP-16 · Deshacer en lugar de confirmar** cuando el servidor puede revertir (al menos 5 s, con teclado y lector de pantalla); se confirma solo lo grave o irreversible.
- **RP-17 · Conflicto de versión explicado** campo por campo; nunca se sobrescribe sin elegir.
- **RP-18 · Respuesta inmediata:** siluetas al cargar; si el servidor rechaza, se revierte con aviso y motivo.
- **RP-19 · Sesión vencida sin pérdida** de lo capturado.
- **RP-20 · «Para ti» dentro de Hoy:** menciones, asignaciones, aprobaciones y respuestas, sin campana. (revisar si sigue: la Bandeja del panel nuevo recibe archivos, DEC-60)

### Disciplina comercial y fichas

- **RP-21 · Ningún contacto sin siguiente paso** con fecha o motivo; registrarlo toma dos toques.
- **RP-22 · Plantillas de mensaje** que abren la app del usuario con el texto listo; el envío se registra cuando el asesor confirma.
- **RP-23 · Reloj de primera atención** por prospecto nuevo, con umbral en Configuración.
- **RP-24 · Coincidencias explicadas** entre comprador e inmueble, en ambos sentidos; solo sugerencias.
- **RP-25 · Visita desde el celular:** llegada, opinión del comprador y foto en menos de un minuto. Programada no es realizada.
- **RP-26 · Negociación como línea de tiempo** con vencimientos; acuerdo no es contrato firmado.
- **RP-27 · Ficha de persona:** una línea de tiempo filtrable, sin duplicar por papeles; en cada asunto, su papel y condición.
- **RP-28 · Ficha de inmueble:** salud, alertas con umbral e historial de precio con quién, cuándo y por qué.

### Dinero y tableros

- **RP-29 · Tarjeta de dinero en cada asunto:** honorario esperado, reparto, cobrado y por cobrar; Estimado, Pactado, Facturado y Cobrado nunca se suman entre sí.
- **RP-30 · Pronóstico por mes:** honorario × probabilidad de la etapa (DEC-17), rotulado «Estimación».
- **RP-31 · Aprobaciones** de comisión bajo el mínimo y descuentos por el rol que corresponda, con motivo y constancia. (revisar si sigue: con RP-100, las excepciones a requisitos ya no se aprueban, se anotan)
- **RP-32 · Cuenta por asesor:** comisiones generadas, cobradas y pagadas, descargable.
- **RP-33 · Tableros por rol** (director: embudo, tiempos, carga, inventario envejecido, captaciones, conversión, metas; asesor: lo suyo).
- **RP-34 · Toda cifra se abre** en sus registros; sin fuente suficiente, «pendiente», nunca cero.

### Documentos y datos

- **RP-35 · Revisión lado a lado** del documento y «Marcar como revisado».
- **RP-36 · Carga de varios archivos** arrastrando; el sistema propone el requisito y la persona confirma. Cargar no es revisar.
- **RP-37 · Pedir un documento al cliente** por liga segura que vence y se revoca; entra como recibido, nunca revisado.
- **RP-38 · Vencimientos de todo Fortius** en un tablero, por fecha y responsable.
- **RP-39 · Firma electrónica** cuando se apruebe proveedor (DEC-30); firma en pantalla no lo es.
- **RP-40 · Fusión asistida de duplicados,** campo por campo, con historial y deshacer; nunca automática.
- **RP-41 · Validar al capturar** teléfono (+52 por omisión), correo, RFC, CURP y código postal.
- **RP-42 · Colonias y códigos postales de SEPOMEX** con fecha de corte; texto libre solo como «otra».
- **RP-43 · Todo monto lleva moneda;** cada conversión guarda tipo de cambio, fuente y fecha. FIX de Banxico propuesto al pactar en dólares; la clave solo en el servidor.
- **RP-44 · Lectura automática siempre con revisión humana:** cita fuente, respeta permisos y nunca cambia estados, aprueba ni envía nada sola (DEC-14).

### Calidad y soporte

- **RP-45 · Meta realista de calidad:** detectar errores antes que el usuario y corregir rápido, con monitoreo sin datos personales (DEC-19).
- **RP-47 · Pruebas de uso medidas** con asesores de Fortius contra metas fijadas antes (DEC-24).
- **RP-48 · Soporte dentro del panel:** ayuda por pantalla, «Reportar un problema» sin datos personales y recorrido inicial saltable.

### Interfaz y lenguaje visual

- **RP-50 · Una pantalla, una pregunta,** con una sola acción principal visible.
- **RP-51 · Nada se dice dos veces;** cada acción, un solo nombre.
- **RP-53 · Fechas humanas** («Hoy», «Lun 19», «Vencida hace 2 días»), nunca «2026-10-17»; sin monoespaciada.
- **RP-54 · Explicar en el momento,** sin avisos permanentes.
- **RP-55 · Mostrar lo actual, esconder lo posible** en «⋯».
- **RP-56 · Lo de campo, arriba en el celular;** nada fijo tapa más de una franja.
- **RP-57 · Las pantallas vacías enseñan** qué hacer y con qué botón.
- **RP-59 · Volver nunca cuesta:** vista previa lateral y, al volver, búsqueda, filtro y posición intactos.
- **RP-60 · Listas inteligentes** para grupos frecuentes.
- **RP-61 · Personalizar poco:** nunca se oculta lo que exige atención ni se cambian colores con significado.
- **RP-62 · El sistema propone, la persona decide;** nada envía mensajes ni cambia etapas solo.
- **RP-63 · Todo gesto tiene alternativa** de botón, teclado y lector de pantalla (WCAG 2.5.1 y 2.1.1).
- **RP-64 · Lo que ve el cliente sale de la proyección pública,** no de campos escondidos en pantalla.
- **RP-66 · Sin tableros armados con widgets.**
- **RP-67 · Sin arrastrar asuntos entre etapas;** se avanza con «Pasar a», que avisa lo que falta. (revisar si sigue frente a RP-102 PN)
- **RP-68 · Sin mensajes automáticos a clientes.**
- **RP-69 · Sin colores personalizados por usuario;** solo tema claro, oscuro o automático.
- **RP-71 · Un ícono fijo por concepto** de un catálogo único (en el panel nuevo, `src/components/panel/icons.tsx`).
- **RP-72 · El estado se reconoce sin color:** forma, color y palabra (WCAG 1.4.1).
- **RP-73 · El movimiento confirma, no decora:** 300 ms o menos, nada en bucle, se apaga con «reducir movimiento».

### Proceso, captura y documentos

- **RP-75 · Capturar una vez.** Personas, inmueble, datos legales y condiciones viven en la ficha y todos los documentos los leen de ahí.
- **RP-76 · Un documento emitido es una foto fija;** si la ficha cambia, avisa y ofrece versión nueva.
- **RP-77 · Descargar siempre, avisando lo que falta.** PDF o Word aunque falten datos, con o sin asunto: faltantes en blanco, aviso y registro de con qué se emitió. Excepción que se queda: el 01 (aviso de privacidad) no sale incompleto (RP-100). Machotes en blanco siempre.
- **RP-78 · Rápido con el cliente, completo en oficina:** cada campo se marca «en la llamada», «en la cita» u «en oficina».
- **RP-79 · Un asunto usa una guía, varias o ninguna.** Las guías son editables por Fortius sin programar y cada asunto conserva la versión con que empezó. La guía sugiere pasos y documentos; el asesor los quita, agrega o marca «No aplica» o «No se puede todavía», con el motivo (FLX-03, DEC-55, DEC-67).
- **RP-80 · La opinión de valor se captura en el sistema;** el Excel es salida.
- **RP-81 · Datos mínimos y confidenciales;** precio mínimo solo con permiso; enviar el aviso de privacidad no es consentimiento.
- **RP-82 · Un dato faltante nunca detiene.** Los faltantes se muestran como «Datos por completar» y se avisan una vez. Crear un asunto pide nombre, un contacto, qué quiere y tipo de inmueble.
- **RP-83 · Trabajo suelto sin abrir asunto** desde Herramientas; si el cliente contrata, pasa a un asunto sin recapturar.
- **RP-84 · Una sola definición de «Esperan algo de ti»** para Hoy, Asuntos y el número del menú: problema, tarea vencida, documento faltante, por revisar, vence hoy, oferta nueva, sin próxima tarea. (revisar si sigue en el panel nuevo)
- **RP-85 · Descargar no es aprobar.** Borrador → Revisado → Aprobado o Firmado; las salidas no cambian el estado.
- **RP-86 · El nombre dice lo mismo que la regla** («Firma acreditada», «Pagos para entregar cumplidos según contrato», DEC-27).
- **RP-87 · Trabajo en paralelo y ciclos:** los pasos no tienen orden obligatorio; varios pueden ir a la vez y repetirse; publicación, visitas y negociación coexisten.
- **RP-88 · Preparado no es entregado:** el informe al propietario registra aparte fecha, canal y responsable de entrega.
- **RP-89 · Entrevista con lo necesario y «Ampliar»:** pide solo lo que se usa; lo demás, plegado; lo no sabido queda «por confirmar».

### Prospecto, cliente y operación

- **RP-90 · Cliente es quien firmó su contrato con Fortius:** intermediación (09) del que vende, intermediación para renta del que renta, asesoría o mandato del inversionista, y el contrato de compradores y arrendatarios. Antes, prospecto.
- **RP-91 · Inmueble captado = intermediación firmada.** Antes está «En captación» y no se publica ni se ofrece (con RP-100, avisa y queda anotado; excepción: compartidos, RP-95). Sin exclusiva también capta. Al terminar, pausar o descartar, se crea tarea urgente para retirarlo; retirar archiva, no borra.
- **RP-92 · La condición se calcula, no se elige:** Prospecto, Cliente, Cliente anterior o Contraparte salen de los contratos firmados, por asunto.
- **RP-93 · Compradores y arrendatarios también son clientes** al firmar promesa, compraventa o arrendamiento; mientras buscan, prospectos con perfil y próxima acción. La búsqueda real es un asunto propio (RP-108). Si Fortius consigue al comprador de su propio inmueble, la venta es el asunto del propietario. (revisar si sigue: antes decía «una sola operación»)
- **RP-94 · Expediente del cliente y folio por inmueble.** La ficha del propietario es su expediente; cada inmueble comercializado, un asunto con folio. Para registrar a una persona bastan nombre, interés y un contacto; si coincide, el asesor elige «es la misma» o «es otra». Registrar papeles no certifica derechos.
- **RP-95 · Inmuebles compartidos** de otra inmobiliaria: inventario «Compartido» con la aliada (porcentaje y acuerdo); publicar sin su autorización escrita avisa (RP-100). El sitio no muestra datos de su propietario (DEC-40).
- **RP-96 · Tomar el encargo con viabilidad (avisa, no frena).** Vale solo dentro de la guía de captación de venta; en otros asuntos no aplica (DEC-67). Primero la opinión jurídica (06); la de valor (07) solo si pasa o pasa con condiciones. El director toma el encargo con precio dentro de ±10 % de la opinión de valor; fuera, con motivo. Con condición jurídica subsanable: «En regularización». Nunca se firma en la primera cita.
- **RP-97 · Registro de la firma.** Contrato completo firmado (escaneo legible), fecha y firmantes; registra el asesor y revisa el director. Varios propietarios: «Firma incompleta» hasta que firmen todos. Apoderado o empresa: cliente es el representado. Al vencer o rescindirse: «Cliente anterior» y tarea para retirar el inmueble. Descartes con motivo de lista.
- **RP-98 · Ciclos, pausas y cierre.** Oferta rechazada no mueve la etapa; promesa caída vuelve a publicación con historial. Estados del asunto: Activo, En pausa, En regularización, Descartado; del inmueble: En captación, Disponible, Apartado, Vendido o Rentado. Archivo a 30 días de la entrega sin pendientes. Informe al propietario registrado a mano; vence un mes después de publicar. Inversión y administración de rentas, sin trabajo nuevo hasta un caso real. (revisar si sigue frente a «Se logró» y «No se dio», DEC-63 y RP-107)
- **RP-99 · Captación y venta son trabajos distintos; el inventario es del equipo.** Capta un asesor; cualquier asesor vende. Reparto: 25 % a quien capta y 25 % a quien vende (50 % si es el mismo). Edita solo quien captó o el director; los demás ven lo público. Ningún texto dice que una sola persona lleva la operación: responde Fortius.

**Listas de documentos del vendedor** por forma de pago (B-06) y por tipo de inmueble y municipio (B-07), aprobadas el 26/10/2026 con fuentes oficiales: texto completo en el historial de reglas. Son base de las guías de FLX-03. (revisar si sigue)

## Decisiones del titular (DEC)

Lo abierto dentro de alguna se sigue en «Por decidir» de `PLAN.md`. Las retiradas (DEC-26, DEC-35, DEC-36, DEC-38, DEC-45, DEC-47, DEC-51) están en el historial de reglas.

| ID | Tema | Decisión |
|---|---|---|
| DEC-01 | Arquitectura | Monolito modular Next.js y Supabase. |
| DEC-02 | Por dónde empezar | Venta del propietario construida; compra, renta e inversión con sus pasos. |
| DEC-03 | Roles | Roles finos y permisos por acción (RP-05); las cuentas actuales pasan a los papeles nuevos sin perder acceso. |
| DEC-04 | Relaciones | Una persona puede tener varios papeles y un inmueble varias personas; vincular no certifica titularidad. |
| DEC-05 | Estados | Comercial, documental y financiero van separados (RP-29, RP-85, RP-88). |
| DEC-06 | Respaldo | Copia diaria, RPO 24 h y RTO 8 h; pendientes custodia, retención y prueba. |
| DEC-07 | Honorarios e impuestos | Los validan el titular y un especialista; sin tasas por defecto. |
| DEC-08 | PWA | Primera versión conectada; sin captura sensible fuera de línea. |
| DEC-09 | Sistemas externos | Inventario de fuentes antes de sincronizar. |
| DEC-10 | Datos de prueba | La base solo tiene datos de prueba: se pueden crear, guardar y borrar ensayos y publicar inmuebles de ejemplo hasta cargar el inventario real; entonces vuelve solo lectura. Sin mensajes a personas reales (ver `AGENTS.md`). |
| DEC-11 | Mapas y comparables | Definir datos, permisos, precisión y costos antes de contratar. |
| DEC-12 | Inversión | Definir supuestos y casos de prueba del método antes de construir. |
| DEC-13 | Portal de clientes | Aprobar quién accede y qué se comparte; sin reutilizar permisos de asesor. |
| DEC-14 | Lectura automática | Antes de datos reales: documentos autorizados, proveedor, conservación y costo. |
| DEC-15 | Otras inmobiliarias | Por ahora exclusivo de Fortius y con su marca. |
| DEC-16 | Propiedad intelectual | Con abogado: INDAUTOR, IMPI, secreto industrial y licencias. |
| DEC-17 | Probabilidades y metas | Fortius las define por etapa, asesor y periodo en Configuración. |
| DEC-18 | Suscripciones | Etapa posterior, en pausa. |
| DEC-19 | Monitoreo | Proveedor, retención, alertas y filtro de datos personales (OBS-01). |
| DEC-20 | PDF del 09 | Liberado el 12/11/2026; se descartó el registro PROFECO. |
| DEC-21 | Edición simultánea | Sin aviso por ahora; se protege con el control de versión (409). |
| DEC-22 | Preguntas de la entrevista | El titular valida la lista base antes de FLX-04. |
| DEC-23 | Contenido de las guías | El titular (y el abogado si aplica) valida cada guía antes de clientes reales. |
| DEC-24 | Metas de pruebas de uso | El titular fija los tiempos meta antes de medir. |
| DEC-25 | Notas del equipo | Sin página aparte; botón «Notas» en inmueble y asunto. |
| DEC-27 | Nombres de requisitos | «Firma acreditada», «Pagos para entregar cumplidos según contrato», «Aviso y controles de privacidad revisados». |
| DEC-28 | Prospecto y cliente | Respuestas del titular del 17/10/2026, escritas en RP-90 a RP-98; falta la intermediación para renta en el catálogo. |
| DEC-29 | Formas de pago y tipos | El titular manda pasos y documentos; el agente arma la tabla (B-06, B-07). |
| DEC-30 | Firma electrónica propia | Antes de usarla, el abogado confirma validez; mientras, firma en papel y se sube el archivo. |
| DEC-31 | Captura de formatos | Se llenan pulsando sobre el documento como sale en PDF; folios los pone el sistema. |
| DEC-32 | Tipos de inmueble | Siete: Terreno, Casa, Departamento, Oficina, Local, Nave o bodega, Plaza o conjunto (04A–04G); sin «Otro». |
| DEC-33 | Plaza con locales | Según el caso: completa, un inmueble; por locales, cada uno con su asunto ligado a la plaza. |
| DEC-34 | Plan de comercialización 10 | Sigue la plantilla del 26/10/2026 con casillas; el panel calcula precio por m² y precio técnico. |
| DEC-37 | Eliminar | Solo desde dentro del registro, con «Deshacer»; se recupera en Eliminados. (revisar si sigue en el panel nuevo) |
| DEC-39 | Inmuebles con problema | Preguntas y documentos para invadido, crédito en mora, herencia o adeudos; con invasión, al abogado antes del levantamiento. |
| DEC-40 | Compartidos | Autorización escrita de la aliada; el sitio dice «Inmueble en colaboración» sin nombrarla. |
| DEC-41 | Visita antes de la firma | Permitida con carta del propietario y autorización del director; sin ellas, avisa y queda anotado (RP-100). |
| DEC-42 | Siguiente paso | Uno por persona y por asunto, siempre una tarea con fecha; citas solo con hora; notas pegadas a persona, inmueble o asunto; «Avisos» de Hoy solo los escribe el director. |
| DEC-43 | Inmuebles ajenos | El asesor ve solo lo público; edita su asesor o el director; publicar lo autoriza el director. |
| DEC-44 | Captura en celular | Lista sobre las mismas celdas, una pregunta por pantalla, con cámara y dictado. |
| DEC-46 | Estados del prospecto | Visibles: Nuevo, En seguimiento, Descartado y «Cliente» aparte. (revisar si sigue en el panel nuevo) |
| DEC-48 | Pausar o rechazar | El asesor puede pausar o rechazar un encargo ya aceptado. |
| DEC-49 | Trámites | Pantalla aprobada; primer trámite, cancelación de hipoteca; comprobantes privados. |
| DEC-50 | Panel flexible | Bandeja, personas, inmuebles y asuntos; la metodología es guía; nada frena (RP-100). |
| DEC-52 | Tecnologías de interfaz | shadcn/ui sobre Radix, cmdk, Sonner y Motion (respetando «reducir movimiento»); se cambia una por otra equivalente si deja de servir. |
| DEC-53 | Cobrado | Un recibo 18 de pago total salda la cuenta (la diferencia es descuento); pesos y dólares no se mezclan; cuenta el último recibo con PDF. |
| DEC-54 | Bandeja y fotos | Los archivos esperan en la carga privada del servidor; una foto en un inmueble publicado no se muestra hasta publicarla desde su ficha. |
| DEC-55 | Riel por tipo de asunto | Cada guía trae sus etapas; sin guía, sin riel; el tipo puede cambiar; el tablero se agrupa por urgencia. |
| DEC-56 | Apartados | Fortius puede recibir un apartado con comprobante; queda «Por entregar» en Dinero; revisar la promesa 15 con el abogado. |
| DEC-57 | Pestañas de una ficha | Resumen, Documentos, Notas y Actividad se quedan; el desplegable sigue para elegir valores. |
| DEC-58 | Comisión | Captó, vendió y comisión se anotan al firmar compraventa o renta. |
| DEC-59 | Marca del sitio público | El Sistema de diseño Fortius la reemplazará, pero no se aplica hasta que el titular lo pida. |
| DEC-60 | Bandeja y Consultas | Separadas: la Bandeja recibe archivos; Consultas, personas que escriben. |
| DEC-61 | Frenos de protección | Sin frenos de proceso; se conservan RLS, permisos, validación, control de versión, «guardar no es publicar» y privacidad. |
| DEC-62 | Base del panel nuevo | Aprobadas las siete migraciones de PN-02; se aplican al integrar en `main`. |
| DEC-63 | «Se logró» | Un paso cierra el asunto y avisa lo que quedó sin completar. |
| DEC-64 | Nombre «Asuntos» | En pantalla, «Asuntos» y «asunto»; rutas, tablas, API y folios no cambian; documentos jurídicos conservan «operación». |
| DEC-65 | Asuntos libres | Todo trabajo es un asunto, con guías elegidas o ninguna, varias seguidas y gastos por asunto. |
| DEC-66 | Cuentas al arrancar | Solo director y asesor; del asesor ajeno se ve que la persona existe y quién la atiende; dos pasos solo para el director. |
| DEC-67 | La metodología no es la columna vertebral | 16/11/2026: la app debe servir para cualquier caso inmobiliario. La metodología de captación es una guía entre varias. Cada asunto lleva su situación, sus etapas, sus documentos, sus decisiones y su historial, y el asesor los arma según el caso. El diseño del asunto se rehace con los casos reales del titular (`docs/diseno/nuevo-panel/casos-reales.md`). |
| DEC-68 | Estructura y aspecto del panel | 16/11/2026: aprobado el boceto «Fortius por asuntos». Secciones: Inicio, Asuntos, Inmuebles, Directorio, Biblioteca y Equipo (director). La consulta se captura en vivo y abre el asunto. El asunto se arma con apartados que se agregan y quitan (de base Personas, Plan e Historial). Inmuebles es también el panel de lo que sale en el sitio (ficha técnica, fotos, video, 360, planos, ubicación). Reemplaza el estilo tipo Apple y las pantallas anteriores; lo que contradiga pasó al historial de decisiones. |

## Alcance del sistema

Personas con varios papeles; inventario publicable separado del interno; asuntos con guías, tareas y agenda; visitas y ofertas; documentos con versión y autor; levantamiento técnico; requisitos jurídicos (el sistema no reemplaza dictámenes); dinero por asunto (sin CFDI ni conexión bancaria por ahora); tableros con su detalle; PWA conectada. Más adelante: inversión, mapas, portal de clientes y lectura de documentos con fuentes. Otras inmobiliarias: en pausa.

## Restricciones globales

- Permisos en servidor y RLS; ocultar un botón no concede ni quita acceso.
- Control de versión: nunca sobrescribir en silencio una captura concurrente.
- Sin datos personales en evidencias, logs, fixtures ni documentación; usar sintéticos.
- No se borran ni debilitan pruebas existentes para obtener verde. Lint, tipos y pruebas se corren antes de integrar a `main`, no mientras se trabaja.
- Migraciones nuevas, ensayadas y avisadas; nunca editar una aplicada.
- Conservar sitio público, SEO, formularios, herramientas financieras, PDF y propiedades demo (identificadas como ejemplo).
- Reglas jurídicas y fiscales con fuente vigente, responsable y versión.
- No prometer conversión, rentabilidad, seguridad total ni disponibilidad sin medición.
- La aceptación de negocio es del titular, registrada sin inventarla; publicar requiere su autorización.

## Indicadores

Sin fuente suficiente, «pendiente», nunca cero.

| Indicador | Definición |
|---|---|
| Contactos vencidos | Activos con próxima fecha anterior al corte; sin fecha, aparte. |
| Primera atención | De la recepción al primer contacto registrado. |
| Conversión a cliente | Prospectos con contrato firmado / cohorte de recepción (RP-90). |
| Captaciones | Intermediaciones firmadas en el periodo (RP-91). |
| Visitas realizadas | Confirmadas; agendadas aparte. |
| Cobros confirmados | Pagos conciliados por moneda y periodo, menos anulaciones. |
| Saldo por cobrar | Obligación vigente menos pagos y ajustes aprobados. |
| Tiempo en etapa | Días por etapa; corregir etapa no es avance. |
| Días en mercado | De la publicación al retiro o la oferta aceptada. |
| Pronóstico ponderado | Honorario × probabilidad de etapa; «Estimación», nunca suma a cobros. |
| Avance contra meta | Resultado / meta del asesor; sin meta, pendiente. |
