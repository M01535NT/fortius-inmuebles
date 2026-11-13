# Propuesta del seguimiento comercial (CRM-01, CRM-02, CRM-03)

Fecha: 12/11/2026. Estado: **propuesta con las seis preguntas contestadas por el titular el 12/11/2026; nada de esto está programado.** No modifica `PLAN_ERP_CRM.md`; las decisiones aprobadas deben pasar al plan.

Bocetos navegables (datos de ejemplo): https://claude.ai/artifact/N8ZFG6NK4okiPDrHZRSj49 · copia en el repositorio: [`docs/diseno/boceto-seguimiento-comercial.html`](../diseno/boceto-seguimiento-comercial.html) (se abre en el navegador; las fuentes vienen de Google Fonts)

## Decisiones del titular (12/11/2026), para pasar al plan

- Diseño: **A + B** (lista del día y ficha en la misma pantalla); C queda para después.
- Un solo siguiente paso con fecha por persona (parte de DEC-42; quedan las notas y el tablero de notas sueltas).
- Primera atención: 2 horas, como hoy.
- Cada asesor ve solo a sus personas; el director ve a todas y reasigna.
- Mensajes: plantillas aprobadas por el titular, ajustables por el asesor; textos base aprobados el 12/11/2026.
- Motivos para descartar a compradores e interesados en rentar: ya no busca, se fue con otra inmobiliaria, no le alcanza o no califica, no contesta, otro con nota.
- Vista del director: después.

## Reglas que la propuesta respeta

- RP-90 a RP-92: la persona es prospecto hasta firmar su contrato; «Cliente» se calcula, no se elige.
- RP-93: compradores y arrendatarios son leads de Fortius y contraparte de los clientes; nunca clientes ni con expediente propio.
- RP-21 a RP-23 y RP-27: registro en dos toques con siguiente paso, plantillas que abren la aplicación del usuario sin registrar el envío hasta confirmarlo, reloj de primera atención y ficha con línea de tiempo única.
- DEC-43 (decidida 12/11/2026): el asesor ve de los inmuebles ajenos solo los datos públicos. Aplica a la ficha del lead: lo que se le ofrece a un lead sale de datos públicos.
- DEC-42 resuelta (12/11/2026): un solo siguiente paso por persona, respaldado por una tarea; notas dentro de la ficha y sin tablero de notas sueltas.

## Qué existe hoy (comprobado en el código)

- **Registro de contacto (COR-18, en local):** `lead-contact.ts` y `contact-log.tsx`. Cuatro botones (Llamé, No contestó, Mandé WhatsApp, Visitó), siguiente paso propuesto con fecha, reintento a 30 días tras tres «No contestó», «Visitó» deja la visita en la agenda. Se guarda como nota marcada y escribe `proximoContacto` y `proximaAccion` en el perfil del lead.
- **Hoy (COR-21):** «Nuevos sin atender» con el tiempo desde que llegó, plazo en Configuración, asignación al asesor del inmueble; en `main` la primera parte, el resto en local.
- **Contactos:** lista por persona con lo que busca, zona, presupuesto y siguiente paso (`contacts-view.ts`). El siguiente paso se calcula mezclando tareas abiertas, citas y `proximoContacto`.
- **Ficha de persona (SIM-07):** encabezado con Llamar y WhatsApp, tarjeta «Siguiente paso», línea de tiempo con notas, citas, tareas y registros.

## Qué falta

1. **Dos fuentes del siguiente paso (CRM-02, DEC-42).** Registrar un contacto guarda el paso en el perfil, no crea una tarea. El mismo paso puede aparecer como tarea, cita y «próximo contacto» a la vez, o no aparecer. Es lo que DEC-42 quiere resolver.
2. **Plantillas de mensaje (RP-22):** no existen. WhatsApp se abre con un número y sin texto, y el envío no se registra.
3. **Línea de tiempo incompleta (CRM-03, RP-27):** no incluye documentos, ofertas (la oferta 14 no está ligada al lead, pendiente de COR-18) ni cambios de estado; los contactos son notas.
4. **CRM-01:** captar y calificar hoy depende del formulario del sitio (con variable de entorno por verificar en producción) y de captura manual; la condición de cliente por contrato firmado está en local (COR-10). Falta una asignación explícita de lead a asesor más allá del inmueble de interés, y la regla de coincidencias revisables.
5. **Descartar sin motivo** (COR-14 lo anota): no se puede medir por qué se pierde un lead.
6. **Sin vista de conjunto para el director** del seguimiento (quién tiene leads sin atender o vencidos).

## Alternativas (ver el Artifact)

- **A · Lista del día.** Hoy muestra solo personas: sin atender, toca hoy o atrasado, más adelante. «Registrar contacto» se abre dentro del renglón. Es la menor distancia con lo que existe.
- **B · Ficha de la persona.** El trabajo ocurre en la ficha: siguiente paso arriba, mensajes listos con confirmación de envío, historial al lado.
- **C · Tablero por momento.** Sin atender, en contacto, con visita, para retomar; la tarjeta cambia de columna sola al registrar.

## Recomendación (el titular pidió el 12/11/2026 ajustar los bocetos a A más B)

Los bocetos muestran ahora **A + B en una sola pantalla**: lista del día a la izquierda y ficha a la derecha (en celular, una a la vez). El tablero C queda como opción para el director.

**A para el día a día más B para el detalle, y dejar C para el director.** A reutiliza Hoy y el registro que ya existe; B agrega lo que falta (plantillas, línea de tiempo completa). El tablero C es una pantalla nueva y solo se justifica con volumen de leads o cuando el director lo pida.

Para construirlo, en este orden: (1) un solo siguiente paso por persona respaldado por una tarea, cerrando DEC-42; (2) plantillas de mensaje con confirmación de envío (RP-22); (3) línea de tiempo completa con ofertas y documentos (CRM-03); (4) asignación y calificación de leads (CRM-01). Sin cambios en tablas existentes hasta confirmar el modelo de la tarea.

## Preguntas de negocio para el titular (una por una)

1. ¿El asesor debe tener siempre **un solo siguiente paso** por persona, y que ese paso sea una tarea con fecha? (DEC-42)
   **Respuesta del titular (12/11/2026): sí, uno solo.** Cada persona tiene un único pendiente con fecha; al registrar un contacto se cierra el anterior y queda el nuevo; las citas con hora siguen en la agenda. Resuelve la parte de DEC-42 sobre el siguiente paso.
   **Notas (titular, 12/11/2026): se retira el tablero de notas sueltas.** Toda nota se escribe dentro de la ficha de la persona, el inmueble o la operación y aparece en su historial. Antes de quitar el tablero, las notas que ya existen se pasan a quien corresponda. Con esto DEC-42 queda resuelta completa.
2. ¿Qué pasa con un lead nuevo del sitio que ningún asesor tomó: se asigna al asesor del inmueble de interés y, si no hay, al director? ¿Cuántas horas puede esperar antes de avisarte?
   **Respuesta del titular (12/11/2026): 2 horas.** Se conserva el plazo actual de primera atención (ajustable en Configuración). La asignación al asesor del inmueble o, si no hay, al director ya está construida en COR-21 y no se volvió a preguntar.
   **Plazo vencido (titular, 12/11/2026): avisar al director.** Pasadas las 2 horas sin primer contacto, la persona se marca en rojo en la lista del asesor y al director le aparece un aviso en Hoy con el nombre del asesor responsable; el director decide si llama o la reasigna. No se reasigna sola. Hoy (`unattendedLeads` en `src/lib/admin/today.ts`) el director ya ve todos los «Nuevos sin atender» con la marca de atraso; desde el 12/11/2026 el vencido de otro asesor sube arriba en su Hoy como aviso «Pasó el plazo», con el asesor responsable, y lleva a la ficha con el foco en «Asesor responsable» para reasignarlo (`queueFromLeads`). El vencido sin asesor o del propio director sigue como «Nuevo» marcado en rojo.
3. ¿Quién ve los leads de quién: cada asesor solo los suyos, o todos ven todos y el director reasigna?
   **Respuesta del titular (12/11/2026): cada asesor ve solo a sus personas.** Aplica a compradores, interesados en rentar y propietarios por captar. El director ve a todas y puede reasignarlas. Comprobado en las migraciones del repositorio (12/11/2026; no se consultó la base remota):
   - **Personas:** ya se filtran en la base. La política `fortius_inmuebles_records_scoped_read` usa `fortius_inmuebles_record_visible`: un asesor solo lee `leads` y `clientes` cuyo `asesorId` es el suyo; el administrador (director) lee todo. Un prospecto sin asesor solo lo ve el administrador. Las pantallas leen con la sesión del usuario (`requireStaff` y `listRecords`), así que la regla aplica; ninguna ruta lee personas con la llave de servicio, salvo la captura pública, que solo inserta.
   - **Escritura:** el disparador `fortius_inmuebles_guard_private_record` impide editar o borrar personas ajenas y solo deja reasignar al administrador.
   - **Citas:** `fortius_inmuebles_event_visible` oculta las citas ligadas a una persona ajena.
   - **Hueco encontrado:** las **tareas** ligadas a un prospecto (`leadId`) sin cliente ni expediente las pueden leer todos los asesores, porque para tareas la regla solo revisa `clienteId` y `expedienteId` (no `leadId` ni `asesorId`). Las notas sueltas (`notas`) no llevan persona en su esquema y las ve todo el equipo, como el tablero que DEC-42 propone retirar. El título de una tarea puede llevar el nombre de la persona («Llamar a …»). Con el siguiente paso único respaldado por una tarea, esto crece; hay que cerrarlo con una migración nueva que revise también `leadId`, antes o junto con CRM-02. **Preparada en local:** `supabase/migrations/20261112170000_tareas_del_prospecto_por_asesor.sql` (política restrictiva de lectura y disparador de escritura) con su prueba `tests/backend/task-lead-scope-database.test.ts`. No está aplicada en la base; se aplica al integrar en `main`. Al reasignar un prospecto, sus tareas pasan con él.
   - Va con SEG-01 y COR-23. No cambia DEC-43: los inmuebles ajenos se siguen viendo con sus datos públicos.
4. ¿Los mensajes de WhatsApp y correo salen de plantillas que tú apruebas, o cada asesor puede editar el texto?
   **Respuesta del titular (12/11/2026): plantillas aprobadas por el titular que el asesor puede ajustar antes de enviar.** Las plantillas se llenan solas con nombre, inmueble, precio y liga a la ficha (RP-22); el asesor corrige el texto si hace falta. El envío se registra solo cuando el asesor confirma que lo mandó. Las plantillas se editan en Configuración y solo el director puede cambiarlas. Textos base en [`plantillas-de-mensaje-borrador.md`](plantillas-de-mensaje-borrador.md), aprobados por el titular el 12/11/2026 (13 de WhatsApp y 2 correos).
5. ¿Qué razones aceptas para descartar un lead? (propuesta: ya no busca, se fue con otra inmobiliaria, presupuesto no alcanza, no contesta, otro)
   **Respuesta del titular (12/11/2026), para compradores e interesados en rentar:** ya no busca; se fue con otra inmobiliaria; no le alcanza o no califica; no contesta (después del reintento a 30 días); y «Otro» con nota obligatoria (confirmado por el titular el mismo día). Los propietarios conservan su lista de RP-97.
6. ¿Quieres que el director tenga una vista del seguimiento de todo el equipo ahora, o después de que el asesor trabaje bien con la suya?
   **Respuesta del titular (12/11/2026): después.** Primero la lista y la ficha del asesor (A + B); mientras tanto el director ve a todas las personas en la misma lista. El tablero C o un resumen por asesor se agregan cuando haya uso real.
7. ¿Qué más debe aparecer en el historial de la persona, además de llamadas, mensajes y notas? (CRM-03, RP-27)
   **Respuesta del titular (12/11/2026): todo lo propuesto.** Visitas (agendada, hecha o cancelada, con el inmueble), ofertas (monto y si se aceptó), documentos entregados (cuáles y cuándo; el historial no los abre) y cambios de asesor y de etapa (cuándo y de quién a quién). Las ofertas dependen de ligar la oferta al prospecto (COR-18); los documentos respetan los permisos de archivos privados.
8. Cuando el director reasigna a una persona, ¿qué parte de su historial ve el asesor nuevo?
   **Respuesta del titular (12/11/2026): todo el historial.** El asesor nuevo ve lo que registró el anterior (contactos, mensajes, notas, visitas y ofertas) para no volver a preguntarle lo mismo a la persona; el asesor anterior deja de verla. Según las migraciones del repositorio, ya funciona así: las notas viajan dentro del registro de la persona, las citas siguen a la persona (`fortius_inmuebles_event_visible`) y sus tareas también, con la migración `20261112170000` (pendiente de aplicar). Las ofertas y documentos del punto 7 deben seguir la misma regla cuando se liguen a la persona.
9. Si una persona descartada vuelve a escribir desde el sitio, ¿qué pasa?
   **Respuesta del titular (12/11/2026): se reabre con su asesor.** Se reactiva la misma persona con todo su historial, vuelve a «Sin atender» con el plazo de 2 horas y la recibe el asesor que la llevaba; si ese asesor ya no está activo, va al director. El historial anota que regresó y por dónde. Programado el 12/11/2026 en la migración `20261112180000_reabrir_prospecto_descartado.sql` (se aplica al integrar en `main`): la captura pública reconoce a la descartada por teléfono o correo con la misma regla que `duplicateContacts`, la reabre en «Nuevo» con una nota «Regresó por el sitio…» y `reabiertoEl`, desde donde corre el plazo; el visitante no ve nada distinto. A quien ya es cliente o sigue activo no se le toca: llega como persona nueva, igual que antes.
10. Si en el reintento a 30 días la persona tampoco contesta, ¿qué pasa?
   **Respuesta del titular (12/11/2026): el asesor decide.** Al registrar «No contestó» en el reintento, el panel lo señala y el asesor elige entre descartarla con el motivo «No contesta» o darle otro intento con fecha. Nada se descarta solo.
