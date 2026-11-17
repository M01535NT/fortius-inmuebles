# Fortius — plan de trabajo del ERP/CRM

**Actualizado:** 16 de noviembre de 2026, America/Los_Angeles. **Responsable de negocio:** Moisés Núñez Tonalá. **Desarrollo:** agente de desarrollo. **Carpeta:** `C:\Paginas-web\fortius-inmuebles`.

Este archivo dice **qué falta hacer y cómo va**. **Cómo funciona el sistema** (reglas RP y decisiones DEC) está en [`SPEC.md`](SPEC.md); lo terminado, en el [historial](docs/erp-crm/historial-del-plan.md). Si algo choca con `SPEC.md`, manda `SPEC.md`. El agente que trabaja un tema actualiza los dos archivos en la rama de trabajo.

**Cambio de rumbo (titular, 16/11/2026): el panel de administración se vuelve a construir a partir de los bocetos aprobados, y ellos mandan sobre lo ya construido en `/admin`.** El panel viejo es legado y va a desaparecer; lo nuevo se construye aparte, en `/panel`, por las etapas **PN-00 a PN-12** de la sección «Panel nuevo (PN)». Los paquetes SIM, NAV, LV, HER y las entregas que describen pantallas del panel viejo quedan **congelados**: no se construyen más en `/admin`; cada pantalla se rehace en la etapa que la reemplaza (tabla en [`docs/diseno/nuevo-panel/LEGADO.md`](docs/diseno/nuevo-panel/LEGADO.md)). Lo que no es pantalla (continuidad, seguridad, base de datos, formatos, privacidad y publicación) sigue vigente.

**Origen:** hasta el 13/11/2026 se llamó `PLAN_ERP_CRM.md` y después `ROADMAP.md`. El 14/11/2026, a pedido del titular, se separó en este plan y `SPEC.md` sin cambiar el texto de ninguna regla ni tarea.
**Para saber cómo va, basta leer esta primera sección.** Lo demás es consulta: el orden de trabajo, los paquetes con su detalle, la tabla de estado de cada entrega y las tareas de continuidad.

## Dónde nos quedamos — 16/11/2026

**Desde el 16/11/2026 las pantallas siguen el roadmap PN (ver «Qué sigue», punto 0). `feat/integracion` quedó integrada en `nuevo-panel` ese día.** Meta: empezar a trabajar de verdad con el panel. Faltan cuatro cosas:

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

**Por decidir (titular):** el recorrido propio de la renta (DEC-02); el vocabulario de papeles de una persona al diseñar REL-01 (DEC-04); custodia y retención de las copias (DEC-06); el backend de pruebas, decisión c) de ENV-01. El texto de cada decisión está en `SPEC.md`.

**Qué sigue, en orden.**

0. **Panel nuevo (PN), desde el 16/11/2026.** PN-00 está hecha en la rama `nuevo-panel` (sin publicar): `/panel` corre en localhost con el sistema de diseño, el menú que se puede reordenar arrastrando y el aislamiento del panel viejo. PN-01 (kit y armazón) también está hecha: botón, campo, segmentado, hoja, avisos con Deshacer, listas, estados, fecha y hora, arrastrar y soltar, y «Buscar o crear» con Ctrl K; se ve en `/panel/kit`. **Al cierre del 16/11/2026:** PN-02 tiene sus migraciones escritas y ensayadas, sin aplicar. **El titular las aprobó el 16/11/2026 y se publican después**, cuando revise el panel completo; se aplican al integrar en `main`. Ya hay primeros cortes en localhost, sin commit, de PN-03 a PN-09 (Personas, Inmuebles, Asuntos, Hoy, Agenda, Consultas, Bandeja, Formatos, Trámites, Dinero, Herramientas y Configuración). Tipos y lint salen limpios y pasan las 201 pruebas del panel. **Pendientes del titular para retomar:** cuándo publicar (de eso dependen los vencimientos de Agenda); decidir si «Se logró» se marca directo (hoy la base pide avanzar una etapa a la vez); los apartados y la promesa del formato 15; si las pestañas de una ficha quedan fuera de la regla del desplegable; y COR-16. La auditoría AUD-06 (`docs/diseno/nuevo-panel/auditorias/AUD-06-dinero-y-bandeja.md`, insumo y no decisión) agrega tres preguntas: si una foto que sale de la Bandeja hacia un inmueble ya publicado se publica en ese momento, si la comisión se anota al firmar o solo al cerrar, y si se registran los apartados. También señala dos bloqueos: Dinero no se podía llenar desde el panel nuevo, y en el teléfono la Bandeja pierde los archivos que esperan destino. El primero ya está resuelto (16/11/2026): en el Resumen del asunto, del lado del propietario, se guarda quién captó y quién vendió, con Deshacer. La comisión sale del contrato de intermediación (09 o 21), como en el panel viejo, y no se escribe a mano. Del segundo, ya no hay que salir de la Bandeja para abrir un asunto: «Abrir un asunto en otra pestaña», y al volver se leen de nuevo los asuntos. **Decisión del titular:** para que la lista no se pierda si el teléfono cierra la página, los archivos que esperan destino tendrían que guardarse en el propio teléfono (son documentos de clientes) o en una cola nueva en el servidor (necesita un cambio en la base). Es una decisión de privacidad y va al registro de tratamiento. También de AUD-06, ya hechos: «Registrar cobro» se cambió por «Hacer recibo de honorarios», que abre el 18 con el asunto ya elegido; la Bandeja rechaza los videos al entrar, con una línea clara, y la cámara del teléfono solo toma fotos; J y K siguen funcionando en Bandeja y Dinero con el panel lateral abierto. Bandeja en serie (AUD-06, 7 y 8): al guardar se abre el siguiente archivo con el mismo destino ya elegido, y en un asunto se elige «Qué es» (llena el nombre del documento, que se puede editar) para que no quede «IMG 2026…». Puntos 3, 4 y 6 de AUD-06, hechos con las reglas del titular (DEC-53): un recibo de pago total salda la cuenta y muestra el descuento; los dólares van aparte; cuenta el último PDF y avisa «con cambios sin PDF». La ruta de documentos devuelve, solo para el 18, importe, moneda y si es pago total del último PDF. Teclado (16/11/2026): F6 pasa de la lista al panel lateral y de vuelta; Ctrl K anuncia cuántos resultados hay; el foco ya no parpadea en gris antes de ponerse en el color de acento. Detalle de cada etapa: sección «Panel nuevo (PN)». El titular confirmó el 16/11/2026 los folios y el asunto como centro (RP-106 a RP-108). **Segunda vuelta contra el boceto (16/11/2026, sin commit):** la ventana de captura de Formatos sigue el lienzo; lo que antes frenaba ahora se muestra como aviso (en el asunto, al publicar un inmueble y al emitir un 01 o 15 incompleto, con «Seguir así»; los avisos legales van aparte, DEC-61); Inmuebles abre su ficha a la derecha y su cita sale en Agenda con el inmueble ya elegido; Trámites suma Tarea, «Quitar la espera» y filtro; Herramientas suma la calculadora de costos de cierre. **Tercera vuelta (16/11/2026, sin commit):** todas las pantallas se compararon de nuevo con el lienzo y se completaron:
- Hoy sin «Vence pronto» ni «Te deben»; los vencimientos van en «Atender primero» y en la Agenda; «Esta tarde» en Posponer.
- Asuntos: ligar otro inmueble, alta de persona al agregarla, estado en las columnas PN-02, archivar.
- Personas: archivar, unir duplicados, persona moral y documentos privados.
- Inmuebles: «Agendar visita», «Dirección exacta» en el sitio y el historial.
- Dinero: movimientos, apartados con comprobante (DEC-56) y gastos.
- Trámites: completo según el boceto.
- Formatos y Herramientas según el boceto.
- Bandeja, Consultas, Agenda, Configuración y el menú, con el número de pendientes de la Bandeja.

**Migraciones nuevas escritas, sin aplicar** (se aplican al integrar en `main`): `20261116110000_tramites_sin_frenos`, `20261116120000_pn08_movimientos_de_dinero`, `20261116130000_tramites_por_tipo`, `20261116140000_hora_de_la_tarea`, `20261116145000_pn_inmuebles_direccion_exacta` y `20261116150000_pn03_unir_personas`. La revisión de tipos pasa con todo junto; no se corrieron pruebas ni se revisó en el navegador.
1. El titular activa los dos pasos del director en el sitio publicado (AUT-01).
2. TRA-01: construido en `feat/integracion` y aprobado en pantalla por el titular; los pasos ya siguen fuentes oficiales y no esperan al notario (titular, 13/11/2026). Está en el menú del panel y en Herramientas.
3. Abogado: formatos 20 al 24, el umbral de 10,000 UMA para la escritura pública del 24 y la conservación de 10 años del expediente LFPIORPI.
4. Publicar `feat/integracion` cuando el titular lo pida (PR en borrador, verificación completa al marcarlo listo). Queda fuera, anotado: `npm audit` marca 3 avisos altos de una sola cadena de desarrollo (zod 3 dentro de lighthouse); corregirla pide subir lighthouse de versión mayor.
5. COR-21: el titular mandará una solicitud de prueba desde el formulario de fortiusinmuebles.com; Bloques revisa que llegue al panel con su plazo.
6. Pendiente legal: en los avisos, el responsable es la persona moral; faltan los datos de la empresa.
7. Después, el «Orden vigente». Los pendientes del titular y la cola que anotó el tablero del 12/11/2026 están en el historial (§17).

**Decisiones vigentes que más cambian el trabajo:** ERP exclusivo de Fortius (RP-01); ningún dato faltante detiene el flujo (RP-82); descargar siempre, y descargar no es aprobar (RP-77, RP-85); entrevista con lo necesario para que el proceso funcione y opción «Ampliar» (RP-89); procesos por tipo de operación con motor editable (RP-79); las cuatro fases del boceto C para agrupar las etapas en pantalla; **una persona es prospecto hasta que firma su contrato, y un inmueble está captado solo cuando el propietario firma la intermediación** (RP-90 a RP-92); **Fortius solo representa al propietario: compradores y arrendatarios son leads de Fortius y contraparte de sus clientes, nunca clientes de Fortius** (RP-93).

**Preguntas abiertas para el titular:** [`docs/erp-crm/CUESTIONARIO_TITULAR.md`](docs/erp-crm/CUESTIONARIO_TITULAR.md). Cada respuesta se integra en `SPEC.md` como regla o decisión.
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

## Panel nuevo (PN) — roadmap por etapas (titular, 16/11/2026)

**Qué es.** Reconstrucción del panel de administración a partir de los bocetos aprobados (lienzo de diseño y [`docs/diseno/nuevo-panel/DECISIONES.md`](docs/diseno/nuevo-panel/DECISIONES.md): qué hace cada pantalla). Visual: Sistema de diseño Fortius ([`docs/diseno/nuevo-panel/sistema-fortius/`](docs/diseno/nuevo-panel/sistema-fortius/README.md)). Reglas de producto: «Panel nuevo (PN)» en `SPEC.md` (RP-100 a RP-108). Primera auditoría de lógica: [`AUD-01`](docs/diseno/nuevo-panel/auditorias/AUD-01-2026-11-16.md). Lo viejo, qué es y cómo se aísla: [`LEGADO.md`](docs/diseno/nuevo-panel/LEGADO.md).

**Cómo se trabaja (reglas de este roadmap).**

1. **Aislado.** Ruta `/panel`; código en `src/app/panel`, `src/components/panel` y `src/lib/panel`; el único puente con el panel viejo es `src/lib/panel/legado`, y el lint lo hace cumplir. Nada nuevo se construye en `/admin`.
2. **Una rama.** Todo en `nuevo-panel`; se revisa en localhost (`npm run dev -- --hostname 127.0.0.1 --port 3001`, ruta `/panel`). Nada va a `main` sin acuerdo del titular: un solo PR, en borrador, cuando él lo pida (regla vigente del 25/10 y 12/11/2026).
3. **Director primero, asesor después.** Se construye para el director o administrador (ve todo). El rol de asesor («solo lo mío») es la etapa PN-10, pero **desde PN-02 todo dato nace con responsable y con seguridad en la base (RLS)**, para que agregarlo no obligue a rehacer.
4. **Cada etapa se puede usar sola.** Mientras una sección no llega, `/panel` muestra «Llega en la etapa PN-xx» y se sigue trabajando en `/admin`.
5. **Auditoría de lógica en cada etapa.** Al empezar y al cerrar, un subagente razonador de solo lectura revisa si la lógica es buena y fluida para el trabajo diario; puede proponer agregar, quitar o reordenar pasos. Su informe se guarda en `docs/diseno/nuevo-panel/auditorias/AUD-nn-fecha.md`, lo aceptado pasa a `SPEC.md` y `DECISIONES.md`, y el resto queda como propuesta.
6. **Base de datos.** Una migración nueva por cambio, aditiva cuando se pueda, con aviso al titular antes de aplicarla. Mientras la base solo tenga datos de prueba (autorización del 17/10/2026) se puede escribir para ensayar.
7. **Verificación.** Por etapa: lint, tipos y las pruebas de lo tocado. La verificación completa (`npm run verify`, suites de navegador) solo se corre cuando el titular acepte, y el PR se marca listo cuando él lo pida.
8. **El chat del equipo va al final** (PN-11).

| Etapa | Qué entrega | Depende de | Estado |
| --- | --- | --- | --- |
| **PN-00 · Cimientos y aislamiento** | Ruta `/panel` con su cascarón, estilos del sistema de diseño (claro y oscuro, Geist), los 28 íconos y el logo, menú lateral con arrastrar para ordenar, barra del teléfono y Más, acceso por el puente `legado`, regla de lint de aislamiento, `LEGADO.md` | — | **Hecha en `nuevo-panel` (16/11/2026), sin publicar** |
| **PN-01 · Kit y armazón** | Componentes base (botón, campo, control segmentado, hoja y ventana, aviso con Deshacer, fila y lista agrupada, tarjeta, estados cargando, vacío, error y sin permiso, selector de fecha y hora), «Buscar o crear» con Ctrl K, atajos, arrastrar y soltar como pieza reutilizable (ver DECISIONES.md), tema claro y oscuro en Configuración, pruebas de componentes | PN-00 | **Hecha en `nuevo-panel` (16/11/2026), sin publicar.** Pieza por pieza en `src/components/panel/kit/` y el muestrario `/panel/kit`; 19 pruebas en `tests/panel/`. Verificación completa y revisión del titular pendientes **Teclado y accesibilidad (revisión del 16/11):** cada pantalla tiene su título en la pestaña («Asuntos | Panel Fortius»); «Saltar al contenido» al primer Tab; las asas de arrastre ya no reciben Tab (el menú pedía 27 paradas) y se reordena con Alt + ↑/↓ sobre el elemento; los atajos de una letra no actúan con una lista desplegable o un menú abierto (la «e» de «En espera» marcaba hecho); los avisos con Deshacer duran 10 segundos; J y K en Asuntos anuncian «2 de 4: …» al lector de pantalla. Al cerrar la ficha, el foco vuelve a la fila del asunto que se veía (también después de J o K; revisado en el navegador). |
| **PN-02 · Modelo base y permisos** | Solo base y servidor, sin pantallas: asuntos que enlazan personas (con papel) e inmuebles, `cliente_id` opcional, `asunto_miembros`, tabla `pendientes`, historial con actor, responsable y `creado_por` en todo, folios reservados (RP-106 a RP-108), notas internas, RLS con el director que ve todo | PN-00 | **Migraciones escritas y ensayadas en `nuevo-panel` (16/11/2026), sin aplicar:** siete archivos nuevos `supabase/migrations/20261116090000…090600_pn02_*` (identidad y miembros, folios reservados, columnas del asunto, enlaces del asunto, pendientes, historial y notas internas, personas unidas). Se ensayaron sobre las 100 migraciones existentes en Postgres en memoria. **Con la auditoría de cierre AUD-04** (`docs/diseno/nuevo-panel/auditorias/AUD-04-…`) se corrigieron en los mismos archivos: un solo responsable (el colaborador lee el asunto), pendientes que no se cuelgan de asuntos ajenos y aceptan a la persona del asunto, personas del asunto solo si se ven, folios de hasta 15 cifras y sin repetir uno puesto a mano, libro de folios solo para dirección, transacción con límite de espera en cada archivo, y el respaldo y la restauración en versión 6 con las 8 tablas nuevas (39). 7 pruebas en `tests/backend/pn02-modelo-base-database.test.ts`, la suite backend completa (1248) y las herramientas de respaldo (53) en verde. Lo que queda de AUD-04 está en DECISIONES.md, con dos preguntas para el titular. Las 6 decisiones de AUD-02 se tomaron con la recomendación del auditor (DECISIONES.md). Quedan para su etapa: el trámite como asunto (PN-07), la acción «Unir personas» (PN-03), crear asunto (PN-04) y `cliente_id` opcional (PN-04). **Falta: el visto bueno del titular para aplicarlas**; hasta entonces el panel no puede guardar pendientes |
| **PN-03 · Personas e Inmuebles** | Las dos fichas maestras con su detalle, búsqueda única, aviso de duplicado, compartir inmueble | PN-02, PN-01 | **Primer corte hecho en `nuevo-panel` (16/11/2026), solo lectura:** `/panel/personas` y `/panel/inmuebles` leen los datos reales de prueba con búsqueda, filtros y estados de carga, vacío y error, y al pulsar una fila abren su ficha de solo lectura: qué falta en contacto, expediente y material; los datos de identidad (CURP, RFC…) solo dicen «Registrado» o «Falta», sin mostrarse (6 pruebas). **Alta y edición de Personas (16/11/2026, sin migración: la persona ya vive en `clientes`):** «Nueva persona» (botón o tecla N) pide lo mínimo del boceto (nombre, teléfono, motivo, canal preferido y en qué quedaron, con Mañana, En 3 días, En una semana u Otra fecha) y queda a nombre de quien la anota; avisa si el teléfono o el correo ya existen y ofrece abrir esa ficha, sin frenar. «Editar datos» cambia contacto, motivo, canal y los datos para contratos (estado civil, domicilio, identificación, CURP y RFC, con cuenta de caracteres), con Deshacer y control de versión. La ficha muestra «Lo que sigue» o «Sin seguimiento» y el canal preferido. 5 pruebas; revisado en el navegador con una persona de ejemplo. **Compartir inmueble (16/11/2026):** desde el menú ⋯ de la fila o arriba en la ficha: Compartir por WhatsApp (texto con título, zona, precio y enlace del sitio), Copiar enlace y Ficha en PDF; lo que no está en el sitio o está en evaluación no se comparte con clientes y solo ofrece «Copiar enlace para el equipo» (2 pruebas; revisado en el navegador). **Alta y edición de Inmuebles (16/11/2026):** «Nuevo inmueble» (botón o tecla N) pide nombre, tipo, operación, precio (vacío es «Valor a consulta»), zona, referencia y medidas según el tipo; nace «En captación · privado», sin publicar y sin fecha de publicación, y la base le pone el folio `FORTIUS-######`. «Editar datos» cambia lo mismo y el estado (solo los de su operación; lo publicado no regresa a captación), con Deshacer; nunca toca la publicación, las fotos ni los textos del sitio (6 pruebas; revisado en el navegador con un inmueble de ejemplo, FORTIUS-000010). **Propietario y llaves (16/11/2026):** la ficha del inmueble liga a su propietario buscándolo en Personas (o dice «Sin propietario ligado») y lo quita; las llaves dicen dónde están, cuántas copias y un detalle, y se prestan y regresan con quién y cuándo (en ámbar si ya debían volver); todo con Deshacer, privado (2 pruebas; revisado en el navegador). **Fotos, textos y publicar (16/11/2026):** la ficha sube varias fotos a la vez (soltar o elegir; carga segura del servidor, sin EXIF ni GPS), las ordena arrastrando o con flechas (la primera es la portada), las describe y las quita; edita la descripción y la ubicación pública; «En el sitio» publica aparte de guardar: avisa lo que conviene revisar («Publicar así») y muestra lo que exige el servidor antes de ofrecer el botón (la captación vinculada con sus revisiones, COR-16, sigue vigente); quitar del sitio pide confirmación y no ofrece Deshacer (5 pruebas; subir, textos y requisitos revisados en el navegador). Falta Unir personas (necesita la migración de PN-02). **Decisión pendiente del titular:** si publicar sigue exigiendo la captación completa o pasa a ser solo aviso, como dice el boceto **Sus asuntos (16/11):** la ficha de cada persona y de cada inmueble lista sus asuntos (activos primero) y cada uno abre el asunto (1 prueba; revisado en el navegador). **Revisión móvil (16/11):** en el teléfono el precio de una fila baja a su renglón y deja al título el ancho completo (kit, todas las listas); «Ver» y «Lo lleva» comparten renglón; el estado dice «En captación» sin «privado»; la zona «No sabe» no se muestra; la fila de Personas no repite el tipo (ya va en su grupo, y se sigue buscando por él); teléfonos legibles («664 123 4567»); a un propietario se le muestra «Su inmueble». |
| **PN-04 · Asuntos, Hoy y Agenda** | Asuntos con guías, documentos, notas internas y actividad; Hoy y Agenda como vistas de `pendientes`; selector de fecha y hora; espera y respuesta | PN-03 | **Hoy y Agenda adelantadas en `nuevo-panel` (16/11/2026), solo lectura.** Hoy: saludo, línea ámbar con las consultas sin responder (lleva a Consultas), contratos de intermediación que vencen en 30 días (fin del encargo y licencia estatal) y citas de hoy (2 pruebas). **Agenda:** `/panel/agenda` lee las citas reales (hoy la base de prueba no tiene ninguna y muestra «Semana libre»), con tira de 7 días con punto en los días con citas, lista por día (Hoy, Mañana…), aviso de empalme y ficha de la cita (3 pruebas). Con AUD-03 (16/11): Hoy ordena lo vencido primero, cada bloque falla por su cuenta, la licencia se avisa una vez y la línea dice cuánto lleva la consulta que más espera; Agenda se mueve por semanas, dice la próxima cita y de qué asesor es cada una (ver DECISIONES «Conexiones entre pantallas»). **Asuntos en solo lectura (16/11/2026):** `/panel/asuntos` lee los expedientes con su persona, su inmueble y lo que sigue (la tarea abierta más próxima, en ámbar si venció o si no hay), vistas Activos, En espera y Cerrados, búsqueda, orden y «Solo sin siguiente paso»; la ficha trae lo que sigue, Llamar y los enlaces a la persona y al inmueble (3 pruebas). **Elegir opciones (regla del titular, 16/11):** en todo el panel, 3 o más opciones van en desplegable y 2 en interruptor. **Nuevo asunto (16/11):** botón y tecla N; tipo, persona, inmueble opcional y quién lo lleva, en desplegables, con la ruta de expedientes que ya existe (la persona es obligatoria hasta PN-02; el folio lo pone la base). **Tareas en Hoy (16/11):** las tareas abiertas que vencen hoy o ya vencieron, de la más atrasada a la de hoy, con «Hecho» y Deshacer (se leen y guardan en las tareas que ya existen). **Ficha del asunto (16/11):** pestañas Resumen, Documentos y Actividad. Estado en un desplegable (Activo, En espera con qué espera, «No se dio» con el motivo de la lista del servidor y detalle, y Reabrir), los 7 documentos con Falta, Recibido o No aplica y su cuenta, y notas internas con el historial; todo con las rutas que ya existen, Deshacer y los frenos del servidor (5 pruebas; revisado en el navegador). Faltan guías (PN-07), título libre, varias personas con papel y dinero (PN-02), los vencimientos de los asuntos en la Agenda y «¿Cómo te fue?», que dependen de PN-02. **Agenda con escritura (16/11):** «Nueva cita» (botón o N) con tipo, persona e inmueble opcionales, día, hora opcional, título (si no se escribe: «Visita con Ana») y notas; avisa del empalme sin impedirlo; «Cambiar» y «Cancelar cita» con confirmación y Deshacer, en la colección `eventos` que ya existe (4 pruebas; revisado en el navegador con una cita de ejemplo). **Lo que sigue en la ficha (16/11):** «Hecho» y «Posponer» sobre la tarea abierta más próxima, y si no hay, el bloque es el campo para escribir el siguiente paso con su fecha; «Anotar otro» agrega más. Las tareas se ligan al asunto con su misma persona, asesor e inmueble (lo exige la base), con Deshacer (1 prueba; revisado en el navegador). **Ajustes de AUD-05 (16/11):** la ficha ya no muestra «Dónde va» (etapa fija); la pestaña Documentos agrega «Hechos en Fortius» con los formatos del asunto (abren su ventana de captura) y «Crear documento» en un desplegable con los del tipo de asunto primero, que crea el formato con el folio y los datos del asunto y lo abre y «Archivos del cliente»: los que guardó el asunto (se abren) y «Subir archivo de» un documento de la lista, que lo guarda con las rutas de la Bandeja y lo marca «Recibido» con Deshacer (revisado en el navegador con y sin formatos; la subida no se ensayó). «Se logró» no se ofrece todavía: la base solo avanza una etapa a la vez y el flujo no tiene estado de éxito; necesita cambio en el servidor (DECISIONES, Asuntos). **Teclado (16/11):** con un asunto abierto, J y K pasan al siguiente o al anterior de la lista, E marca hecho lo que sigue y P lo pasa a mañana (con Deshacer); la lista lo recuerda abajo solo en escritorio (J y K revisados en el navegador). **Revisión móvil y oscuro (16/11):** la pestaña Documentos abre con los archivos del cliente y lo hecho en Fortius, y abajo «Lo que se pide»; «Crear documento» trae el levantamiento una vez y pide después el tipo de inmueble; las listas desplegables ya no se salen de la pantalla del teléfono; en oscuro, casillas y desplegables recuperan su borde fuerte (la regla general del sitio lo pisaba; el arreglo es solo del panel, en `panel-ds.css`); en el teléfono «Ver» y «Lo lleva» van en un renglón. **Dinero en la ficha (16/11):** precio del inmueble y comisión estimada del cierre (la misma que usa Dinero); sin cierre, dice que se anota al registrarlo. **Notas aparte (16/11):** pestaña «Notas» con el aviso fijo «Solo las ve el equipo. Nunca salen en lo que se envía al cliente», la caja y «Guardar nota»; «Actividad» queda solo con lo que registra la base. Cada nota dice quién la escribió («Tú»; para el director, el asesor ligado a esa cuenta), con 1 prueba; revisado en el navegador. **Avisos (16/11):** una línea ámbar plegada («1 aviso · Faltan 7 documentos») en los asuntos activos, con los documentos que faltan («Ver documentos» abre su pestaña) y la fecha objetivo vencida; «Seguir así» y los avisos de cónyuge o revisión esperan PN-02 (1 prueba; revisado en el navegador). **Fecha objetivo (16/11):** se cambia en el Resumen con un desplegable de fecha y Deshacer, por la ruta de operación que ya existe (revisado en el navegador: se guardó y se quitó). **Hoy con Trámites y Dinero (AUD-05, 16/11):** «Hoy toca preguntar» con los trámites cuya espera vence hoy o antes (el más atrasado primero, en rojo si ya tocaba; cada uno abre su ficha en Trámites) y una línea «Te deben» con el total y los asuntos, que lleva a Dinero y solo sale si no es cero. Cada bloque carga y falla por su cuenta (6 pruebas en `tests/panel/hoy-pendientes.test.ts`; en la base de prueba no aparecen porque no hay trámites en espera ni cobros pendientes) **Agenda: «¿Cómo te fue?», vencimientos, Día y mover (16/11/2026, en `nuevo-panel`):** una cita que ya pasó (día anterior, o de hoy ya terminada con su duración supuesta) y no se anotó dice «¿Cómo te fue?» en la lista y lo pregunta en su ficha: Se hizo / No llegó, qué pasó y, si tiene asunto, lo que sigue con fecha; se guarda en la cita (campo `resultado` y una línea en sus notas), en el historial del asunto y como pendiente del asunto, con Deshacer (el historial del asunto deja constancia de que se quitó). Los vencimientos que ya lee Hoy (fin del encargo y licencia estatal) salen en su día, con marca ámbar en la tira y fila propia que abre el asunto. Interruptor Semana / Día (se recuerda en el navegador; teclas 1 y 2, T hoy, ← y → semana): el Día es una línea de tiempo que arranca una hora antes de la primera cita, con la hora de ahora, las citas lado a lado si se cruzan y arriba «Todo el día» (sin hora y vencimientos). Una cita se cambia de hora de 30 en 30 minutos arrastrándola (en el teléfono con pulsación larga; bloque levantado y línea de acento donde caerá; soltar fuera o Esc cancela), con Alt + ↑/↓ o con «Mover a…» en su ficha; avisa si se empalma y trae Deshacer. Lógica en `src/lib/panel/datos/agenda-resultado.ts` y `agenda-dia.ts`, 7 pruebas nuevas. Con la revisión móvil (16/11): el encabezado dice qué semana se ve («16 al 22 de noviembre · 2 citas, 4 tareas») y las tareas abiertas con fecha de esa semana salen en su día, en solo lectura, con «Vencida» en rojo y enlace a su asunto si lo tienen (en el Día van en «Todo el día»); 2 pruebas más. Mover a otro día (16/11): la cita se arrastra a un día de la tira (desde la lista de la semana o desde un bloque del Día) o, enfocada, con Alt + ←/→; conserva la hora, no va a días pasados, avisa si se empalma y ofrece Deshacer; la vista sigue a la cita y le devuelve el foco. En el teléfono, «Cambiar de día» en su ficha. La fila de tarea ya no repite «Tarea». 1 prueba más. Pendiente: vencimientos de los asuntos (llegan con `pendientes`, PN-02). **16/11/2026:** «Abrir en grande» con los tres puntos del panel lateral (escritorio ancho; también en Personas e Inmuebles) y, en el asunto, «Persona» e «Inmueble» abren su ficha encima con «Volver al asunto»; las fichas de persona e inmueble son ahora componentes propios. Revisado en escritorio, tableta, teléfono, claro, oscuro y con teclado. |
| **PN-05 · Consultas** | Cola de personas que escriben (sitio, WhatsApp, llamada, en persona), respuesta lista, unir con ficha, formulario del sitio (COR-21). Decidir si Bandeja y Consultas son una sola entrada | PN-03 | **Primer corte adelantado en `nuevo-panel` (16/11/2026), solo lectura:** `/panel/consultas` lee las consultas reales de prueba en tres pestañas (Por atender, En seguimiento, Cerradas); la que más espera va primero, ámbar pasada una hora y rojo pasadas dos; la ficha trae el mensaje, el contacto y una respuesta lista con Copiar, WhatsApp y Llamar (el asesor la envía; el panel no manda nada) (4 pruebas). Con AUD-03 (16/11): búsqueda en las tres pestañas, seguimiento por fecha para volver a contactar, cerradas con cómo terminaron, respuesta editable, número en el menú y actualización sola. **Escritura (16/11/2026, sin migración: la consulta ya vive en `leads`):** Atender yo (y responder por WhatsApp, correo, llamada o Copiar también atiende), volver a contactar con atajos Mañana, En 3 días, En una semana u Otra fecha, notas, Cerrar como «Sin operación» o «No es cliente» con motivo, Reabrir y «Anotar consulta» para llamadas y visitas en persona; todo con Deshacer, control de versión (409) y los atajos A y N (4 pruebas, revisado en el navegador con datos de prueba). **Persona y asunto desde la consulta (16/11):** si es nueva, «Crear persona» usa la conversión verificada de la base (crea la ficha y deja el vínculo); si ya es persona, «Abrir su ficha» y «Abrir un asunto» con el tipo sugerido por lo que busca (revisado en el navegador: abrió EXP-000020 de ejemplo); si su teléfono o correo ya está en Personas, lo avisa y abre esa ficha. **«Crear persona y asunto» (16/11):** en un paso crea la ficha por la conversión verificada y abre su asunto, avisa si el teléfono o el correo ya están en Personas y deja deshacer el asunto (eliminación recuperable); en Consultas, el director filtra por «Lo lleva» junto a «Ver» (PN-10). **Pendiente del visto bueno del titular:** ligar la consulta a una ficha que ya existe («Unir con su ficha»). La base hoy solo acepta ese vínculo por la conversión (disparador `mnt_guard_lead_conversion`); hace falta una migración con una función del servidor que lo permita con permiso y registro, y no se aplica sin su acuerdo **16/11/2026 (sesión auxiliar):** la respuesta lista cambia según lo que busca la persona y aparece «Unir con esta ficha»; mientras el servidor no tenga ese paso (PN-02 sin publicar), la pantalla avisa sin error. Bandeja y Consultas siguen separadas (DEC-60). |
| **PN-06 · Archivos y Formatos** | Bandeja de archivos con destino elegido a mano primero y lectura automática después; Formatos con captura sobre el documento (DEC-31) sobre lo ya construido | PN-04 | **Bandeja, primer corte en `nuevo-panel` (16/11/2026):** `/panel/bandeja` recibe varios archivos de golpe (PDF, imágenes y video, hasta 20 MB); cada uno espera «Por confirmar» en la carga privada del servidor hasta que se elige a mano a dónde va: un asunto (sus documentos; para una persona, en uno de sus asuntos) o un inmueble (fotos públicas sin EXIF ni GPS); con Deshacer (eliminación recuperable). Solo usa rutas que ya existen. 16 pruebas en `tests/panel/bandeja.test.ts`. Los videos todavía no tienen dónde guardarse. La lectura automática sigue sin activar; falta guardar la cola en el servidor. **DEC-54 hecho (16/11/2026):** una foto que va a un inmueble publicado entra a sus fotos sin mostrarse en el sitio («Sin mostrar en el sitio»); se muestra con «Mostrar en el sitio» desde la ficha del inmueble, el sitio público la filtra y no cuenta para publicar (3 pruebas en `tests/backend/foto-oculta.test.ts`). **DEC-55:** «Se logró» de un paso no lleva otra migración: usa `estado_asunto` y `resultado` de PN-02, sin mover la etapa; se conecta en el panel cuando PN-02 esté publicada. **Cola de la Bandeja en el servidor (DEC-54):** migración `20261116090700_pn06_cola_de_la_bandeja.sql` escrita, sin aplicar (tabla `fortius_inmuebles_bandeja` con RLS: director todo, asesor lo suyo; se descarta, no se borra; 30 días por confirmar) y anotada en el registro de tratamiento. **Rutas y página hechas (16/11/2026):** `GET/POST /api/admin/bandeja`, `PATCH /api/admin/bandeja/{id}` y `POST /api/admin/bandeja/{id}/permiso` (ticket nuevo y vista previa firmada); la página anota cada carga, marca guardado, deshecho o descartado, y recupera al volver lo que quedó por confirmar. Mientras la migración no esté aplicada, el servidor responde 503 y la página sigue con la cola en memoria y el aviso de salir, sin error (revisado en localhost). 21 pruebas de rutas y 17 de la lógica de la cola. La tarea diaria `/api/cron/limpieza-archivos` también descarta lo que lleva 30 días por confirmar y borra su archivo de la carga temporal (3 pruebas más). Falta: probar el camino con servidor cuando se aplique la migración y decidir si se limpian las cargas temporales que nunca se anotaron. **Formatos, primer corte (16/11/2026):** `/panel/formatos` con Catálogo por lo que quieres hacer (sin el 03; los levantamientos juntos en el 04 con su tipo; «Falta revisión del abogado» en 20, 21 y 24; búsqueda por número o nombre), Borradores y Emitidos. «Empezar» pide el asunto (los de su operación primero) y abre la ventana de captura en `/panel/formatos/{id}`: la hoja se dibuja con el mismo escritor del PDF, cada espacio se toca y se llena (texto, fechas, horas, montos, opciones, varias opciones, tablas con filas —partidas y pagos del 19, erogaciones del 08 con sus cargos fijos, fotos del 07— e imágenes del 04 y del 07, subidas o tomadas con la cámara, con fecha y autor), se guarda con versión (409) y Deshacer, y «Generar PDF» emite y descarga (el 01 y el 15 solo completos, como en el servidor). Al lado: «Llenar con los datos del asunto» (y la diferencia cuando la hoja dice otra cosa), los documentos del cliente y, en cada PDF emitido, «Subir copia firmada». AUD-05: nada escrito se pierde (tocar otro espacio o cerrar guarda solo, con Deshacer, y avisa antes de salir), «Uno por uno» para el teléfono (todos o solo lo que falta, con «No sabe» en los formatos de lista) y `/panel/formatos?asunto=&formato=` con `?volver=` para regresar al asunto. Revisión móvil: una sola cuenta («Faltan N espacios», la misma que recorre «Uno por uno»), botón corto «Generar PDF» y renglones de 44 px; en el teléfono, «Uno por uno» esconde la hoja y deja el avance arriba («Espacio 1 de 7 que faltan» con barra), un campo a la vez y «Siguiente» fijo abajo. Emitidos dice si cada PDF ya tiene su copia firmada y deja subirla o verla desde la lista. 21 pruebas en `tests/panel/formatos*.test.ts`; revisado a 375 px con datos de ejemplo. Faltan: quitar una imagen o una copia firmada (no hay ruta en el servidor), dictado y revisar en tema oscuro **Formatos, 16/11/2026 (sesión auxiliar):** quitar una imagen (04 y 07) y una copia firmada, con Deshacer; dictado con la voz donde el navegador lo permite; revisado en oscuro. Quitar del todo usa la migración nueva `20261116091000_pn06_quitar_imagen_y_copia_firmada.sql`, sin aplicar: mientras tanto el servidor responde «no disponible» sin romper la pantalla. |
| **PN-07 · Guías y Trámites** | Trámites como asuntos con guía al frente; migrar TRA-01 (cancelación de hipoteca) y sus frenos | PN-04 | **Primer corte en `nuevo-panel` (16/11/2026):** `/panel/tramites` con la cancelación de hipoteca que ya existe (colección `tramites`, sus reglas en la base). Lista por lo que toca (Hoy toca preguntar, Esperando con los días que faltan, En curso; los terminados en un enlace) y búsqueda. El trámite es un solo checklist de 8 pasos: el actual trae qué hacer, sus pendientes, «Subir» el documento del paso, «Cerrar el paso» (se activa al completarlo, con Deshacer) y «Poner en espera» (a quién y cuándo volver a preguntar; la base crea la tarea). Debajo: documentos, pagos del propietario, «Avance al propietario» (interruptores de qué incluir; Copiar o WhatsApp, sin notas internas), notas e historial (lo escribe la base). «Nuevo trámite» (botón o N) con acreedor, propietario, inmueble y quién lo lleva. 5 pruebas; revisado en el navegador con un trámite de ejemplo (abrir, marcar pendientes y cerrar el paso 1). Faltan las demás guías (servicios, avalúos, regularización, Catastro) hasta confirmar sus pasos con la fuente oficial, y que el trámite sea un asunto (PN-02). **Notas internas y ajustes móviles (16/11):** las notas internas van separadas del Historial (lo que hace el sistema solo), con el aviso fijo «Solo las ve el equipo. Nunca salen en lo que se envía al cliente», caja arriba y «Guardar nota»; cada nota dice quién y cuándo (el nombre solo lo ve el director, porque la lista de cuentas es suya; los demás ven «Alguien del equipo»), las nuevas primero y sin editar ni borrar. Una prueba comprueba que ninguna nota ni el historial entran en «Avance al propietario». Además: el paso ya no dice «(documento)», en vez de repetir las casillas dice «Faltan N de M» y «Fecha del último pago» es un campo de fecha guardado en el mismo pendiente (6 pruebas en `tests/panel/tramites-notas.test.ts` y `tramites-fecha.test.ts`; revisado en el navegador con una nota de ejemplo) |
| **PN-08 · Dinero** | Te deben, por entregar e historial; el movimiento nace desde el asunto; cobro parcial; recibos | PN-04 | **Primer corte en `nuevo-panel` (16/11/2026), solo lectura:** `/panel/dinero`. Te deben: la comisión estimada del cierre de cada asunto menos los recibos 18 emitidos en pesos (un recibo sin emitir se ve pero no descuenta; los de dólares avisan), con el detalle de cada cobro y «Abrir el asunto». Historial: los recibos 18. Por entregar vacío, explicando por qué. 10 pruebas; en la base de prueba se ve vacío (ningún asunto con cierre anotado). Falta la tabla de movimientos (migración, sin escribir) para apartados, gastos por reembolsar, vencimientos y registrar cobro o entrega con Deshacer. **Pendiente del titular:** si se registran apartados en resguardo, porque la promesa 15 dice que Fortius no custodia la garantía |
| **PN-09 · Herramientas y Configuración** | Calculadoras de crédito y comisión; perfil, avisos, apariencia, equipo e invitaciones, roles | PN-02 | **Herramientas, adelantada y hecha en `nuevo-panel` (16/11/2026):** crédito y comisión con el cálculo común de `src/lib/finance`, 5 pruebas. El 16/11 se separaron en dos pantallas propias (`/panel/herramientas/credito` y `/panel/herramientas/comision`, cada una con su componente; el índice las lista y Ctrl K las abre directo): juntarlas en un mismo componente fue un error. Desde la ficha de un inmueble abren con su precio y «Para: …»; Copiar incluye supuestos, fecha y leyenda. **Configuración, hecha en `nuevo-panel` (16/11/2026):** `/panel/configuracion` en una columna, con Perfil, Apariencia, Avisos, Equipo y Sesión. Perfil: nombre y teléfono de tu ficha de asesor, con control de versión (409), Deshacer y Descartar; correo de solo lectura; foto del perfil público; si la cuenta no tiene ficha (dirección), lo dice. Apariencia: Automático, Claro u Oscuro en desplegable, sobre la misma preferencia `fortius-theme` del armazón. Avisos: tras la revisión móvil (16/11) no se ofrecen interruptores que todavía no hacen nada; una línea dice que lo pendiente se ve en Hoy y que los avisos al teléfono o por correo llegan pronto (los cuatro interruptores quedan listos en el código). Equipo (solo dirección): fichas de asesor con su ficha completa, la cuenta y el rol de cada una (o «Sin cuenta para entrar») y aparte las cuentas sin ficha; desde la ficha se liga la cuenta de un asesor activo con la ruta existente `PUT /api/admin/asesor-cuentas` (Deshacer si antes estaba en otra ficha); «Invitar a alguien» deshabilitado porque no hay ruta para invitar. Lógica en `src/lib/panel/datos/configuracion*.ts`, 9 pruebas; revisado en el navegador (claro, oscuro y teléfono). Faltan: invitar, quitar acceso o desligar una cuenta, y roles por persona (PN-10; no hay rutas en el servidor); avisos por correo o teléfono y guardar tema y avisos en el servidor (ampliar `panelSchema` de `src/lib/backend/preferences.ts`); cambiar la foto desde aquí **Equipo, 16/11/2026 (sesión auxiliar):** preparar invitaciones en modo de prueba (no se envía ningún correo), qué ve cada papel y reordenar arrastrando o con teclado. |
| **PN-10 · Rol de asesor** | Las mismas pantallas con «solo lo mío», asignación y reparto de comisión | PN-04 a PN-08 | **Primer paso adelantado (16/11/2026):** en la ficha del asunto, «Lo lleva» con el asesor y, solo para el director, «Pasar a otro asesor» con motivo (10 letras o más), con la ruta de reasignación que ya existe (M-04: la base mueve con él el inmueble, la persona y las tareas abiertas y anota el motivo). Revisado en el navegador sin ejecutar el cambio. En Asuntos, Personas, Inmuebles y Consultas el director filtra por «Lo lleva» (Todo el equipo, Los míos o un asesor; `src/components/panel/datos/lo-lleva.tsx`); el asesor no lo ve porque la base ya le muestra solo lo suyo. En Consultas va junto a «Ver», en el mismo renglón, con el asesor de cada consulta (quien la atiende; revisado en el navegador: de 11 por atender a 5 con un asesor elegido, y «Ver todo el equipo» si queda vacío). **«Lo lleva» en Trámites y Dinero (16/11):** en Trámites junto a «Buscar» y en Dinero junto a «Ver», en el mismo renglón; en Dinero se toma el asesor del asunto de cada cobro y filtra Te deben, Cobrados completos, Historial, la cifra grande y el aviso de cierres sin comisión. Solo aparece con dos o más asesores en la lista (hoy la base de prueba tiene uno, así que no se ve). Falta comprobarlo con una cuenta de asesor y el reparto de comisión |
| **PN-11 · Equipo (chat)** | Temas con #, mensajes directos, menciones, tarjetas ligadas, no leídos | PN-10 | Pendiente, al final por decisión del titular |
| **PN-12 · Cambio y retiro del panel viejo** | `/panel` pasa a `/admin`, se retira el código viejo y el puente `legado`; antes se decide el destino de las secciones sin boceto (reportes, blog, contenido, apps, ayuda, papelera, sistema) | todas | Pendiente |

**Por decidir (titular), anotadas en `DECISIONES.md`:** (decididas el 16/11/2026: la marca del sitio público cambia al Sistema de diseño Fortius, sin aplicar todavía, DEC-59; Bandeja y Consultas son dos entradas, DEC-60; sin frenos de proceso, DEC-61: migración `20261116100000_sin_frenos_de_proceso.sql` escrita sin aplicar, el servidor ya no frena y el asunto avisa; lo legal —identificación LFPIORPI, autorización del aliado, revisión del 15 y aviso 01— también avisa). **16/11/2026, tarde:** cuatro sesiones rehicieron todas las pantallas según el lienzo de bocetos, sin pruebas (por indicación del titular); falta que el titular las revise en localhost y lo que depende de publicar PN-02 (título libre del asunto, varias personas con papel, guías, movimientos de Dinero, unir duplicados, archivar) si los compradores son clientes y la búsqueda es un asunto (AUD-01, hallazgo 1); el destino de las secciones sin boceto.

## Orden vigente

**Desde el 16/11/2026 el trabajo de pantallas sigue el roadmap PN de arriba.** Lo que sigue es el orden anterior del panel viejo: se conserva para lo que no es pantalla y como historia; sus paquetes de interfaz (SIM, NAV, LV, HER) están congelados en `/admin`.

**Para lo que no es pantalla del panel viejo, este orden manda.** La columna «Fase» de la matriz agrupa por tema y sirve de referencia (la tabla «Orden y ventanas orientativas» pasó al historial, §25, el 14/11/2026); si difieren, se sigue este orden. Cada entrega está en un bloque igual o posterior al de todo lo que necesita.
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
| NOM-01 | **«Operaciones» pasa a «Asuntos» (DEC-64):** todo lo que se lee en el panel (menú, títulos, botones, avisos, vacíos, Ctrl K, Más, Hoy, ayuda y manuales del panel) dice «Asuntos» y «asunto», con la concordancia en masculino («Nuevo asunto», «el asunto abierto»). | LV-10 (hacerlo cuando ese chat termine su etapa para no chocar en los mismos archivos) | Ninguna pantalla del panel dice «operación» salvo en formatos y PDF donde sea término de la plantilla; rutas, tablas, API y folios sin cambios; pruebas actualizadas al texto nuevo sin quitar ninguna; revisado en computadora y celular. |

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
| FLX-08 | **Guías para asuntos jurídicos y de obra (DEC-65):** sucesión o adjudicación; recuperación de inmueble invadido; juicio de desahucio; seguimiento de juicio (expediente, juzgado, abogado, audiencias y plazos en la Agenda); rehabilitación con presupuesto; crédito Infonavit del comprador. Cada guía sugiere pasos y documentos, nunca frena (RP-100). | FLX-03 | Los casos del titular (sucesión con inmueble invadido, desahucio con rehabilitación y venta, cesión de derechos litigiosos en sentencia) se abren y avanzan con su guía; los pasos se verifican con fuente oficial vigente; las guías jurídicas esperan el visto bueno del abogado antes de usarse con clientes reales. |
| FLX-09 | **Gastos de cada asunto (DEC-65):** cada gasto con concepto, monto, fecha, quién lo paga y su comprobante privado; total por asunto y por quien paga. | FLX-03 | En el asunto de desahucio, los gastos que cubre el comprador a plazos se suman aparte y cada uno lleva su comprobante; nada de esto sale en el sitio público. |
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
