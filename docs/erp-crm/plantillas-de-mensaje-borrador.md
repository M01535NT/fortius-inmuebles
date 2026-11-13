# Textos base de los mensajes (borrador)

Fecha: 12/11/2026. Estado: **borrador para que el titular lo apruebe o corrija.** Nada de esto está programado.

Responde a RP-22 y a la decisión del titular del 12/11/2026: los mensajes salen de textos aprobados por él, el asesor los ve ya llenos y puede ajustar una palabra antes de mandarlos. El envío queda en el historial solo cuando el asesor confirma que lo mandó.

## Cómo leer este borrador

- Lo que va entre llaves se llena solo con los datos de la persona y del inmueble: `{nombre}`, `{asesor}`, `{inmueble}`, `{zona}`, `{precio}`, `{liga_ficha}`, `{telefono_asesor}`.
- Lo que va entre corchetes lo escribe el asesor en el momento: `[lo que busca]`, `[horarios]`.
- Los mensajes hablan de **tú** (decisión del titular, 12/11/2026).
- Son mensajes para compradores e interesados en rentar. Fortius no los representa: les ofrece los inmuebles de sus clientes (RP-93). Por eso ningún texto promete negociar a su favor.

## WhatsApp

### 1. Primera respuesta: pidió informes de un inmueble

> Hola, {nombre}. Soy {asesor}, de Fortius Inmuebles. Recibimos tu mensaje sobre {inmueble}. ¿Te llamo hoy para resolver tus dudas o prefieres que platiquemos por aquí?
>
> Fotos y detalles: {liga_ficha}

### 2. Primera respuesta: busca algo, sin un inmueble en mente

> Hola, {nombre}. Soy {asesor}, de Fortius Inmuebles. Gracias por escribirnos. Para mandarte opciones que sí te sirvan, ¿me dices en qué zona buscas, cuántas recámaras necesitas y cuánto tienes pensado pagar?

### 3. Enviarle una opción

> {nombre}, te comparto {inmueble}, en {zona}, con precio de {precio}. Pensé en ti porque [lo que busca]. Aquí están las fotos y los detalles: {liga_ficha}
>
> Si te interesa, lo podemos ver esta semana.

### 4. Confirmar que vio la opción

> Hola, {nombre}. ¿Alcanzaste a ver la información de {inmueble}? Si algo no te convenció, dime qué le faltó y te busco otra opción.

### 5. Proponer una visita

> {nombre}, ¿te gustaría conocer {inmueble}? Puedo [horarios]. Tú me dices cuál te acomoda.

### 6. Confirmar la visita (un día antes)

> Hola, {nombre}. Te confirmo la visita a {inmueble} el {día} a las {hora}. Nos vemos en [punto de encuentro]. Si se te complica, avísame y la cambiamos.

### 7. Después de la visita

> Hola, {nombre}. Gracias por venir a ver {inmueble}. ¿Qué te pareció? Saber qué te gustó y qué no me ayuda a buscarte mejor.

### 8. No contestó la llamada

> Hola, {nombre}. Soy {asesor}, de Fortius Inmuebles. Te marqué hace un rato sobre [motivo]. ¿A qué hora te puedo llamar?

### 9. Volver a buscarlo a los 30 días

> Hola, {nombre}. Soy {asesor}, de Fortius Inmuebles. Hace unas semanas platicamos sobre [lo que busca]. ¿Sigues buscando? Si es así, te mando lo que tenemos disponible hoy.

### 10. Cuando dice que ya no busca

> Gracias por avisarme, {nombre}. Si más adelante vuelves a buscar, con gusto te ayudamos.

## Correo

### A. La información que pediste

**Asunto:** {inmueble}: la información que pediste

> Hola, {nombre}:
>
> Soy {asesor}, de Fortius Inmuebles. Te escribo por tu interés en {inmueble}, en {zona}. El precio es de {precio}. En la ficha están las fotos, la descripción y la ubicación aproximada: {liga_ficha}
>
> Si quieres verlo, respóndeme con el día y la hora que te acomoden y lo agendo. También puedes llamarme al {telefono_asesor}.
>
> Saludos,
> {asesor}
> Fortius Inmuebles
> {telefono_asesor}

### B. Opciones que te pueden servir

**Asunto:** Opciones en {zona}

> Hola, {nombre}:
>
> Con lo que me contaste, [lo que busca], te comparto estas opciones:
>
> - {inmueble}, {precio}: {liga_ficha}
> - {inmueble}, {precio}: {liga_ficha}
>
> Si alguna te llama la atención, dime cuál y buscamos un horario para verla.
>
> Saludos,
> {asesor}
> Fortius Inmuebles
> {telefono_asesor}

## Reglas que el sistema debe cuidar al llenar los textos

- **Solo inmuebles publicados y disponibles.** No se ofrece un inmueble sin la intermediación firmada (RP-91), y de los inmuebles de otro asesor se usan solo los datos públicos (DEC-43).
- **Precio:** el precio público de la ficha. Si el inmueble está «a consulta», la frase del precio desaparece y queda «te comparto {inmueble}, en {zona}».
- **Sin promesas** de crédito, descuentos, exclusividad ni disponibilidad que no estén en la ficha.
- **Sin emojis** y sin mencionar cómo se generó el texto.
- **Firma del asesor** y de Fortius Inmuebles en cada primer mensaje, para que la persona sepa quién le escribe.
- El enlace abre WhatsApp o el correo del asesor con el texto listo; enviarlo es acción del asesor (RP-22).

## Por decidir con el titular (una por una)

1. ~~¿Usted o tú?~~ **Decidido: tú** (12/11/2026).
2. ~~¿El primer mensaje lleva la liga al aviso de privacidad cuando la persona llegó por teléfono o WhatsApp?~~ **Decidido: no la lleva** (12/11/2026); el asesor lo explica en persona o en la llamada cuando haga falta. Pendiente para el abogado: confirmar cómo se pone el aviso a disposición de quien da sus datos por teléfono o WhatsApp (ver `docs/erp-crm/privacy/data-processing-register.md`).
3. ¿Falta alguna situación que los asesores viven seguido? (por ejemplo, el inmueble que le interesaba ya se vendió o se rentó)
