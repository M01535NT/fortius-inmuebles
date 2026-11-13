# Textos base de los mensajes (borrador)

Fecha: 12/11/2026. Estado: **borrador para que el titular lo apruebe o corrija.** Nada de esto está programado.

Responde a RP-22 y a la decisión del titular del 12/11/2026: los mensajes salen de textos aprobados por él, el asesor los ve ya llenos y puede ajustar una palabra antes de mandarlos. El envío queda en el historial solo cuando el asesor confirma que lo mandó.

## Cómo leer este borrador

- Lo que va entre llaves se llena solo con los datos de la persona y del inmueble: `{nombre}`, `{asesor}`, `{inmueble}`, `{zona}`, `{precio}`, `{liga_ficha}`, `{telefono_asesor}`.
- Lo que va entre corchetes lo escribe el asesor en el momento: `[lo que busca]`, `[horarios]`.
- El borrador habla de **usted**. Si el titular prefiere **tú**, se cambian todos de una vez.
- Son mensajes para compradores e interesados en rentar. Fortius no los representa: les ofrece los inmuebles de sus clientes (RP-93). Por eso ningún texto promete negociar a su favor.

## WhatsApp

### 1. Primera respuesta: pidió informes de un inmueble

> Hola, {nombre}. Soy {asesor}, de Fortius Inmuebles. Recibimos su mensaje sobre {inmueble}. ¿Le llamo hoy para resolver sus dudas o prefiere que platiquemos por aquí?
>
> Fotos y detalles: {liga_ficha}

### 2. Primera respuesta: busca algo, sin un inmueble en mente

> Hola, {nombre}. Soy {asesor}, de Fortius Inmuebles. Gracias por escribirnos. Para mandarle opciones que sí le sirvan, ¿me dice en qué zona busca, cuántas recámaras necesita y cuánto tiene pensado pagar?

### 3. Enviarle una opción

> {nombre}, le comparto {inmueble}, en {zona}, con precio de {precio}. Pensé en usted porque [lo que busca]. Aquí están las fotos y los detalles: {liga_ficha}
>
> Si le interesa, lo podemos ver esta semana.

### 4. Confirmar que vio la opción

> Hola, {nombre}. ¿Alcanzó a ver la información de {inmueble}? Si algo no le convenció, dígame qué le faltó y le busco otra opción.

### 5. Proponer una visita

> {nombre}, ¿le gustaría conocer {inmueble}? Puedo [horarios]. Usted me dice cuál le acomoda.

### 6. Confirmar la visita (un día antes)

> Hola, {nombre}. Le confirmo la visita a {inmueble} el {día} a las {hora}. Nos vemos en [punto de encuentro]. Si se le complica, avíseme y la cambiamos.

### 7. Después de la visita

> Hola, {nombre}. Gracias por venir a ver {inmueble}. ¿Qué le pareció? Saber qué le gustó y qué no me ayuda a buscarle mejor.

### 8. No contestó la llamada

> Hola, {nombre}. Soy {asesor}, de Fortius Inmuebles. Le marqué hace un rato sobre [motivo]. ¿A qué hora le puedo llamar?

### 9. Volver a buscarlo a los 30 días

> Hola, {nombre}. Soy {asesor}, de Fortius Inmuebles. Hace unas semanas platicamos sobre [lo que busca]. ¿Sigue buscando? Si es así, le mando lo que tenemos disponible hoy.

### 10. Cuando dice que ya no busca

> Gracias por avisarme, {nombre}. Si más adelante vuelve a buscar, con gusto le ayudamos.

## Correo

### A. La información que pidió

**Asunto:** {inmueble}: la información que pidió

> Hola, {nombre}:
>
> Soy {asesor}, de Fortius Inmuebles. Le escribo por su interés en {inmueble}, en {zona}. El precio es de {precio}. En la ficha están las fotos, la descripción y la ubicación aproximada: {liga_ficha}
>
> Si quiere verlo, respóndame con el día y la hora que le acomoden y lo agendo. También puede llamarme al {telefono_asesor}.
>
> Saludos,
> {asesor}
> Fortius Inmuebles
> {telefono_asesor}

### B. Opciones que pueden servirle

**Asunto:** Opciones en {zona}

> Hola, {nombre}:
>
> Con lo que me contó, [lo que busca], le comparto estas opciones:
>
> - {inmueble}, {precio}: {liga_ficha}
> - {inmueble}, {precio}: {liga_ficha}
>
> Si alguna le llama la atención, dígame cuál y buscamos un horario para verla.
>
> Saludos,
> {asesor}
> Fortius Inmuebles
> {telefono_asesor}

## Reglas que el sistema debe cuidar al llenar los textos

- **Solo inmuebles publicados y disponibles.** No se ofrece un inmueble sin la intermediación firmada (RP-91), y de los inmuebles de otro asesor se usan solo los datos públicos (DEC-43).
- **Precio:** el precio público de la ficha. Si el inmueble está «a consulta», la frase del precio desaparece y queda «le comparto {inmueble}, en {zona}».
- **Sin promesas** de crédito, descuentos, exclusividad ni disponibilidad que no estén en la ficha.
- **Sin emojis** y sin mencionar cómo se generó el texto.
- **Firma del asesor** y de Fortius Inmuebles en cada primer mensaje, para que la persona sepa quién le escribe.
- El enlace abre WhatsApp o el correo del asesor con el texto listo; enviarlo es acción del asesor (RP-22).

## Por decidir con el titular (una por una)

1. ¿Los mensajes hablan de **usted** o de **tú**?
2. ¿El primer mensaje lleva la liga al aviso de privacidad cuando la persona llegó por teléfono o WhatsApp, y no por el formulario del sitio?
3. ¿Falta alguna situación que los asesores viven seguido? (por ejemplo, el inmueble que le interesaba ya se vendió o se rentó)
