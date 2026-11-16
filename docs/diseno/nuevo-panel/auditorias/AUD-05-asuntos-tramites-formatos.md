# AUD-05: Asuntos, Trámites y Formatos (16/11/2026)

**Quién:** el auditor, de solo lectura (RP-103).

**Qué revisó:**
- El código: `src/app/panel/asuntos/`, `src/components/panel/asuntos/` (`detalle.tsx`, `sigue.tsx`, `formulario.tsx`), `src/lib/panel/datos/asuntos.ts`, `src/app/panel/tramites/`, `src/components/panel/tramites/detalle.tsx`, `src/lib/panel/datos/tramites.ts`, `src/app/panel/formatos/` (catálogo y `[id]`) y `src/components/panel/formatos/captura.tsx`.
- Las secciones Asuntos, Trámites, Formatos y Notas internas de `DECISIONES.md`.
- Las pantallas en 127.0.0.1:3001/panel, en escritorio de 1280 px y en teléfono de 375 px. Abrió un asunto, un trámite y un borrador existente.

**No hizo:** no guardó, creó ni emitió nada, y no cambió código.

Los hallazgos van de mayor a menor impacto. Cada uno dice dónde está, qué le pasa al asesor y qué se propone.

## Lo que más pesa

### 1. Un asunto no se puede cerrar como «Se logró»

- **Dónde:** el desplegable Estado de `asuntos/detalle.tsx`. Ofrece Activo, En espera y No se dio. «Se logró» existe en `lib/panel/modelo.ts` pero no en la pantalla.
- **Qué pasa:** el asesor que firma una venta no tiene cómo decirlo. El asunto solo se cierra bien si «llega al cierre por su etapa», y esa etapa es del método viejo. Además, la ficha muestra «Dónde va: Captación», que es una fase fija, y el boceto quitó las fases.
- **Propuesta:**
  - agregar «Se logró» al desplegable, con la fecha;
  - quitar «Dónde va» de la ficha;
  - cuando llegue PN-02, que el cierre ya no dependa de la etapa.

### 2. Trámites vive aparte de Asuntos y no llega a Hoy

- **Dónde:** `app/panel/tramites/page.tsx` guarda en la colección `tramites`, fuera de los expedientes. `app/panel/page.tsx` y `lib/panel/datos/hoy.ts` no leen trámites.
- **Qué pasa:**
  - El boceto dice que un trámite es un asunto de tipo «Trámite». Hoy no aparece en Asuntos ni en la ficha de la persona o del inmueble.
  - Lo más importante: cuando llega el día de volver a preguntar («Hoy toca preguntar»), Hoy no lo avisa. El asesor tiene que acordarse de entrar a Trámites, que en el teléfono está escondido en «Más».
- **Propuesta:**
  - de inmediato: un renglón en Hoy, «N trámites: hoy toca preguntar», que lleve a la lista;
  - con PN-02: ligar cada trámite a su asunto (folio EXP) y mostrarlo en el bloque «Relacionado» de la persona y del inmueble.

### 3. De un asunto no se puede crear un documento

- **Dónde:** la pestaña Documentos de `asuntos/detalle.tsx`.
- **Qué pasa:**
  - El boceto pide «Crear documento» dentro del asunto, que sugiera primero los formatos de su tipo y abra la captura con los datos llenos. Hoy hay que salir a Formatos, buscar el formato y volver a elegir el asunto a mano.
  - Al revés pasa lo mismo: la ventana de captura se cierra siempre hacia `/panel/formatos`, nunca de vuelta al asunto.
  - La pestaña Documentos es una lista fija de 7 desplegables (Falta, Recibido o No aplica) sin el archivo: se marca «Recibido» sin que el documento quede en ningún lado.
- **Propuesta:**
  - un botón «Crear documento» en la pestaña, con los formatos del tipo de asunto primero;
  - que la captura recuerde de dónde vino y regrese ahí;
  - en la pestaña, juntar los formatos hechos en Fortius (borradores y emitidos de ese asunto) con los recibidos, en una sola lista, como pide el boceto (punto 8).

### 4. En la captura de un formato se pierde lo escrito sin aviso

- **Dónde:** `formatos/captura.tsx`.
- **Qué pasa:**
  - Si el asesor escribe en un campo y toca la X, o toca otro espacio de la hoja antes de «Guardar», lo escrito se pierde sin avisar. AGENTS.md pide proteger los cambios sin guardar.
  - Llenar 31 datos exige, para cada uno: tocar el espacio, escribir, Guardar, y buscar el siguiente. Son unos 120 toques.
- **Propuesta:**
  - guardar al pulsar Enter o al pasar a otro campo;
  - un botón «Guardar y seguir» que salte solo al siguiente vacío;
  - si se cierra con algo escrito, preguntar «Guardar y salir / Salir sin guardar».

### 5. En el teléfono, la captura no se puede usar

- **Dónde:** la captura a 375 px (`captura.css`).
- **Qué pasa:**
  - La hoja se ve reducida a un tercio de la pantalla y cada espacio para tocar mide unos pocos píxeles, muy lejos de los 44 px.
  - Arriba se aprietan «Faltan 31 datos» y «Generar PDF con 31 pendientes».
  - El boceto pide pantalla completa con el avance arriba.
- **Propuesta:** en el teléfono, un modo «uno por uno».
  - Una hoja desde abajo muestra el campo, «Anterior», «Siguiente» y el avance («4 de 31»).
  - La hoja de papel se ve arriba, desplazada al renglón que se llena.
  - Tocar el papel sirve solo para saltar a un campo, no como única forma de llenar.

### 6. «Generar PDF con 31 pendientes» es el botón principal

- **Dónde:** la barra de la captura.
- **Qué pasa:** con 31 datos vacíos, la acción en azul invita a imprimir un documento casi vacío. «Nada frena» se respeta, pero la acción principal debería ser llenar.
- **Propuesta:**
  - mientras falten datos, que «Llenar lo que falta» sea el principal y «Generar PDF así» el secundario;
  - cuando todo esté lleno, se invierten;
  - en el 01 y el 15, que el servidor exige completos, el botón deshabilitado debe decir por qué («Este formato se emite completo: faltan 3 datos»).

## Importante

### 7. Asunto: lo que sigue va primero, el estado después

- **Dónde:** la pestaña Resumen.
- **Qué pasa:**
  - Lo primero es el desplegable Estado, y debajo, la ficha repite «Estado: Activo».
  - El boceto pone arriba el título, un solo botón «Tipo · Estado» y la barra de contacto, y después «Lo que sigue».
  - El contacto es solo «Llamar a …»: falta WhatsApp.
- **Propuesta:**
  - arriba, «Llamar» y «WhatsApp» de la persona principal;
  - después, «Lo que sigue»;
  - el Estado, como un botón pequeño «Venta · Activo» que abre la hoja para cambiarlo;
  - quitar Estado de la ficha.

### 8. «Posponer» toma demasiados pasos

- **Dónde:** `asuntos/sigue.tsx`.
- **Qué pasa:** Posponer abre un selector de fecha y luego «Guardar fecha». El boceto pide un menú corto: Esta tarde, Mañana, Lunes o Elegir fecha.
- **Propuesta:** un menú «⋯» o desplegable con esas cuatro opciones; las tres primeras guardan de un toque, con Deshacer. Igual en Hoy.

### 9. Lista de Asuntos: el título y el subtítulo se repiten

- **Dónde:** `filasAsuntos` en `lib/panel/datos/asuntos.ts`.
- **Qué pasa:** la fila dice «Venta · Bruno Ejemplo Soto» y debajo «Bruno Ejemplo Soto · Venta».
- **Propuesta:**
  - en el subtítulo, solo lo que el título no dice (el inmueble, o la persona si el título es el inmueble);
  - quitar el ícono de expediente, que es igual en todas las filas;
  - el tipo, como texto.

### 10. Nuevo asunto pide persona obligatoria

- **Dónde:** `asuntos/formulario.tsx`.
- **Qué pasa:** el boceto dice que solo el título es obligatorio, y aquí se exige persona y no hay título libre. Ya está anotado como límite hasta PN-02.
- **Propuesta:**
  - al llegar PN-02: título libre arriba, persona e inmueble opcionales;
  - mientras tanto, la ayuda «Si no está, dala de alta en Personas» debería ser un enlace que abra el alta y regrese.

### 11. Trámites: le faltan pasos al trabajo del día

- **Dónde:** `app/panel/tramites/page.tsx` y `tramites/detalle.tsx`.
- **Qué pasa:**
  - En la lista, las filas de «Hoy toca preguntar» no traen «Anotar respuesta» (el boceto lo pone en la fila): hay que abrir el trámite.
  - Nuevo trámite exige propietario; el boceto permite ligarlo a un inmueble, a una persona o a ninguno.
  - El documento del paso dice «Escritura (documento)»: el «(documento)» sobra.
  - Ni las notas del trámite ni las del asunto dicen quién las escribió, y el boceto lo pide.
- **Bien:** el checklist único, «Para cerrar falta: …», la espera con «Ya respondieron» y «Avance al propietario» con interruptores siguen el boceto.
- **Propuesta:**
  - «Anotar respuesta» en la fila;
  - propietario opcional;
  - autor en cada nota;
  - quitar el «(documento)».

### 12. En el escritorio, Asuntos no sigue el boceto elegido

- **Dónde:** `HojaAdaptable` de 440 px.
- **Qué pasa:** el 15/11 se eligió una tabla de todo el ancho y un panel de 680 px con «3 de 5», anterior y siguiente. Hoy es una lista y un panel angosto, sin anterior ni siguiente.
- **Propuesta:** como mínimo, «Anterior» y «Siguiente» en la cabecera del panel (J y K ya mueven el foco, pero no cambian el panel). La tabla puede esperar a que existan dinero y personas múltiples (PN-02).

## Choques con las reglas del titular

### 13. Las pestañas: ¿cuentan como «fila de botones»?

- **Dónde:** Catálogo, Borradores y Emitidos en Formatos; Resumen, Documentos y Actividad en el asunto.
- **Qué pasa:** la regla del 16/11 dice que con 3 o más opciones va una lista desplegable, nunca una fila de botones. El boceto de Asuntos pide pestañas.
- **Propuesta:** que el titular aclare si la regla vale también para pestañas que cambian de vista. El auditor recomienda conservar las pestañas: muestran a la vista qué hay en cada parte, y un desplegable lo esconde.

### 14. «Opinión de valor comercial» (07) se puede empezar suelta

- **Dónde:** el catálogo de Formatos.
- **Qué pasa:** la regla del 30/10 dice que la opinión de valor sale solo del método (entrevista, levantamiento, checklist y dictamen) y no tiene botón para pedirla. El catálogo deja empezar el 07 como cualquier otro formato.
- **Propuesta:** que el titular decida. O el 07 se ve en el catálogo pero se abre solo desde su asunto, cuando el método llegó al dictamen; o se aclara que la regla habla de pedirla, no de capturarla.

### 15. Sin cejas ni rastro de IA

No se encontraron cejas ni menciones a la IA en las tres pantallas. Los títulos de grupo del catálogo («Conocer al cliente y al inmueble») y de Trámites («Hoy toca preguntar · 1») son el único encabezado de su bloque, así que no cuentan como cejas.

## Pasos que sobran o faltan, en una línea

- **Agregar:**
  - «Se logró» en el asunto;
  - Trámites en Hoy;
  - «Crear documento» en el asunto;
  - «Guardar y seguir» en la captura;
  - posponer en un toque;
  - «Anotar respuesta» en la fila del trámite;
  - autor en las notas.
- **Quitar:**
  - «Dónde va: Captación»;
  - el Estado repetido en la ficha;
  - el subtítulo repetido de las filas;
  - el «(documento)»;
  - el «Guardar» de cada campo de la captura.
