# Propuesta del seguimiento comercial (CRM-01, CRM-02, CRM-03)

Fecha: 12/11/2026. Estado: **propuesta para el titular; nada de esto está programado.** No modifica `PLAN_ERP_CRM.md`; las decisiones aprobadas deben pasar al plan.

Bocetos navegables (datos de ejemplo): https://claude.ai/artifact/N8ZFG6NK4okiPDrHZRSj49 · copia en el repositorio: [`docs/diseno/boceto-seguimiento-comercial.html`](../diseno/boceto-seguimiento-comercial.html) (se abre en el navegador; las fuentes vienen de Google Fonts)

## Reglas que la propuesta respeta

- RP-90 a RP-92: la persona es prospecto hasta firmar su contrato; «Cliente» se calcula, no se elige.
- RP-93: compradores y arrendatarios son leads de Fortius y contraparte de los clientes; nunca clientes ni con expediente propio.
- RP-21 a RP-23 y RP-27: registro en dos toques con siguiente paso, plantillas que abren la aplicación del usuario sin registrar el envío hasta confirmarlo, reloj de primera atención y ficha con línea de tiempo única.
- DEC-43 (decidida 12/11/2026): el asesor ve de los inmuebles ajenos solo los datos públicos. Aplica a la ficha del lead: lo que se le ofrece a un lead sale de datos públicos.
- DEC-42 sigue pendiente: un solo siguiente paso por persona, respaldado por una tarea.

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
2. ¿Qué pasa con un lead nuevo del sitio que ningún asesor tomó: se asigna al asesor del inmueble de interés y, si no hay, al director? ¿Cuántas horas puede esperar antes de avisarte?
3. ¿Quién ve los leads de quién: cada asesor solo los suyos, o todos ven todos y el director reasigna?
4. ¿Los mensajes de WhatsApp y correo salen de plantillas que tú apruebas, o cada asesor puede editar el texto?
5. ¿Qué razones aceptas para descartar un lead? (propuesta: ya no busca, se fue con otra inmobiliaria, presupuesto no alcanza, no contesta, otro)
6. ¿Quieres que el director tenga una vista del seguimiento de todo el equipo ahora, o después de que el asesor trabaje bien con la suya?
