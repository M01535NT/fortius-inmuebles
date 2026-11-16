# AUD-06: Dinero y Bandeja (16/11/2026)

**Quién:** el auditor, de solo lectura (RP-103).

**Qué revisó:**
- Dinero (PN-08): `src/app/panel/dinero/page.tsx`, `src/components/panel/dinero/detalle-cobro.tsx`, `src/lib/panel/datos/dinero.ts`, `src/lib/panel/datos/dinero-lectura.ts`, y de apoyo `src/lib/panel/datos/asuntos.ts`, `src/app/api/admin/documentos/route.ts` y los campos del recibo 18 en `src/lib/formatos/catalog.ts`.
- Bandeja (PN-06): `src/app/panel/bandeja/page.tsx`, `src/components/panel/bandeja/detalle-archivo.tsx` y `zona-subir.tsx`, `src/lib/panel/datos/bandeja.ts` y `bandeja-acciones.ts`, y el puente `src/lib/panel/legado/archivos.ts`.
- Las filas PN-06 y PN-08 de `PLAN.md`, las secciones Bandeja, Dinero, Patrones de interacción y «Elegir entre opciones» de `DECISIONES.md`, y RP-100 a RP-108 de `SPEC.md`.

**No hizo:** no abrió las pantallas en el navegador, no subió ni guardó archivos, no consultó la base y no cambió código. Lo que depende de ver la pantalla funcionando va marcado como **inferencia**. No repite lo de AUD-03 (comisión en Herramientas) ni lo de AUD-05 (asunto sin «Se logró», captura de formatos).

Los hallazgos van de mayor a menor impacto. Cada uno dice dónde está, qué le pasa al director o al asesor y qué se propone.

## Bloqueante

### 1. Dinero no se puede llenar desde el panel nuevo

- **Dónde:** `dinero.ts:41-44` (`comisionDe`) y `dinero/page.tsx:131`. «Te deben» solo existe si el asunto tiene `flujo.cierre.comisionEstimada`.
- **Hecho leído:** ese dato solo se escribe en el panel viejo (`src/components/admin/operation/close-card.tsx:42`). En `src/components/panel/` no hay ningún lugar para anotarlo; la ficha del asunto dice «Se anota al registrar el cierre» (`asuntos.ts`, `fichaAsunto`), y el asunto tampoco se puede cerrar como «Se logró» (AUD-05, hallazgo 1).
- **Qué pasa:** el director nunca ve nada en «Te deben» si trabaja solo en `/panel`. El aviso en amarillo («anota la comisión en el cierre del asunto») manda a un lugar que no existe en el panel nuevo.
- **Propuesta:**
  - en la ficha del asunto, bloque Dinero: «Anotar comisión» (monto y moneda, con lo del contrato 02 como sugerencia), sin esperar al cierre, con Deshacer;
  - que Dinero muestre también los asuntos activos con comisión anotada, en un grupo «Cuando se cierre», para que el director vea lo que viene;
  - mientras no exista, cambiar el aviso para que no mande a un lugar inexistente.

### 2. En el teléfono, la Bandeja pierde lo subido y empuja a salir de ella

- **Dónde:** `bandeja/page.tsx:34` (la cola vive en la página), `:162-167` (aviso antes de salir) y `detalle-archivo.tsx:71` («Esta persona todavía no tiene asuntos. Abre uno en Asuntos y vuelve»).
- **Hecho leído:** la cola no se guarda en el servidor (PLAN lo anota como pendiente). Al salir se pierde todo lo que siga por confirmar.
- **Inferencia:** en el teléfono el aviso de salida casi nunca aparece: si el asesor contesta una llamada o cambia a WhatsApp, el navegador puede descartar la página sin preguntar. El caso más común de la Bandeja (el asesor en la calle con el teléfono) es justo el que pierde el trabajo.
- **Qué pasa además:** con una persona sin asunto, la pantalla le dice al asesor que se vaya a Asuntos. Si lo hace, pierde la cola entera.
- **Propuesta:**
  - de inmediato: «Abrir un asunto para esta persona» dentro de la misma hoja (título y tipo, nada más), sin salir de la Bandeja;
  - guardar la cola en el servidor antes que la lectura automática (lo subido ya está en la carga temporal: falta solo la lista de pendientes por usuario);
  - mientras tanto, que el texto de la línea 212 diga cuántos se perderían («Si cierras, se pierden 4 archivos sin guardar»).

## Importante

### 3. Un recibo «total» no salda la cuenta

- **Dónde:** `dinero.ts:50-67` (`porCobrar`) y los campos del recibo 18 en `catalog.ts:440-445` y `:578-580`.
- **Hecho leído:** el recibo 18 trae «Pago parcial o total» y «Saldo pendiente». Dinero ignora los dos: resta importes de la comisión estimada y nada más.
- **Qué pasa:** si la comisión estimada era $100,000 y el cliente pagó $90,000 como pago total (descuento negociado, cosa frecuente al cierre), Dinero dice «te deben $10,000» para siempre. El director deja de confiar en la cifra grande.
- **Propuesta:**
  - un recibo emitido marcado «total» deja la fila en «Cobrados completos», y la ficha muestra «Se cobró $10,000 menos de lo estimado»;
  - si el último recibo parcial trae saldo, usar ese saldo como «Falta» y avisar si no cuadra con la cuenta.

### 4. Pesos y dólares: la cifra no dice todo

- **Dónde:** `dinero.ts:58` y `:62` (los recibos en dólares no descuentan), `:86` (`sumaCobrada` solo en pesos) y `page.tsx:85`.
- **Qué pasa:**
  - en Tijuana muchas operaciones se pactan en dólares. La comisión solo se anota en pesos y los recibos en dólares quedan fuera de la resta: la fila dice «te deben» la comisión entera y solo un aviso pide revisar a mano;
  - en Historial la cifra grande suma solo pesos y no dice que dejó fuera los dólares.
- **Propuesta:**
  - comisión con moneda (pesos o dólares, interruptor), y la resta en la misma moneda;
  - si hay de las dos, la cifra grande lleva una segunda línea: «y US$3,500»;
  - no convertir con tipo de cambio en esta pantalla: cada moneda se cuenta por separado.

### 5. «Registrar cobro» está apagado y no lleva a ningún lado

- **Dónde:** `detalle-cobro.tsx:32-33`.
- **Qué pasa:** la única acción de la hoja está deshabilitada y explica que el cobro se anota con el recibo de honorarios del asunto, pero no lleva ahí. El director tiene que pulsar «Abrir el asunto», ir a Documentos y empezar el 18 por su cuenta.
- **Propuesta:** mientras no exista la tabla de movimientos, cambiar el botón apagado por «Hacer recibo de honorarios», que abra `/panel/formatos?asunto={id}&formato=18&volver=/panel/dinero` (la ruta ya existe, PN-06), con el monto que falta ya puesto como importe y «parcial» si no cubre todo. Al volver, la fila ya refleja el cobro (una vez emitido).

### 6. Corregir un recibo emitido lo saca de lo cobrado

- **Dónde:** `api/admin/documentos/route.ts:26-38` (`emitido` = la versión actual ya tiene PDF) y `dinero.ts:57-58`.
- **Inferencia:** si el asesor abre un recibo emitido para corregir una letra y lo guarda, sube la versión y deja de contar como cobrado hasta volver a generar el PDF. «Te deben» sube sin que entre ni salga dinero.
- **Propuesta:** contar el importe de la última versión emitida, no de la versión actual; si hay cambios sin emitir, decir «Recibo con cambios sin PDF» en la fila.

### 7. Bandeja: guardar cada archivo cuesta cinco pasos y no sigue al siguiente

- **Dónde:** `detalle-archivo.tsx:88-113` y `bandeja/page.tsx:154` (`setAbierto(null)` al guardar).
- **Qué pasa:** para cada archivo: abrirlo, elegir «Guardar en», escribir en Buscar, elegir en la lista, pulsar «Guardar ahí»; la hoja se cierra y hay que abrir el siguiente. Un vendedor que entrega INE (dos lados), escritura, predial y recibo de agua son seis archivos, unos treinta toques, casi siempre al mismo asunto.
- **Propuesta:**
  - al guardar, abrir solo el siguiente por confirmar (como «Guardar y seguir» de AUD-05);
  - el siguiente llega con el mismo destino ya elegido («Mismo lugar que el anterior: Venta Casa Otay · EXP-000012») y basta un toque;
  - juntar Buscar y la lista en un solo campo «Buscar o elegir» que busque en asuntos, personas e inmuebles a la vez, con el resultado agrupado; así sobra el desplegable «Guardar en»;
  - selección en lote con casillas («Guardar 6 en este asunto»), que el boceto ya pide como «Confirmar N».

### 8. El documento queda con el nombre del archivo

- **Dónde:** `bandeja.ts:112-115` (`tituloArchivo`) y `page.tsx:150`.
- **Qué pasa:** una foto del teléfono queda en el asunto como «IMG 20261116 104233». En Documentos del asunto nadie sabe qué es sin abrirla.
- **Propuesta:** en la hoja, un desplegable «Qué es» (INE, Escritura, Predial, Recibo de agua o luz, Avalúo, Acta de nacimiento, Otro) y un título que se puede editar, ya llenado con lo elegido. Si el asunto tiene esa pieza en su lista de documentos, marcarla «Recibido» al guardar (AUD-05, hallazgo 3: hoy se marca sin archivo).

### 9. Una foto a un inmueble publicado se publica al guardarla

- **Dónde:** `detalle-archivo.tsx:105` (el aviso) y `bandeja/page.tsx:140-142`.
- **Hecho leído:** la foto se sube como pública y se agrega al final de la galería; si el inmueble está publicado, sale en el sitio en ese momento. La pantalla lo avisa.
- **Choque con una regla:** AGENTS.md dice que guardar y publicar son acciones distintas y que no se publica como efecto lateral de guardar. «Nada frena, solo avisa» no lo resuelve: el aviso no evita que una foto equivocada (por ejemplo, una INE tomada con la cámara) quede en el sitio.
- **Inferencia por verificar:** «Deshacer» (`page.tsx:121`) quita la foto de la galería, pero no se vio que borre el archivo público; su dirección seguiría abriendo.
- **Propuesta:** que el titular decida. El auditor recomienda que desde la Bandeja la foto entre a las fotos del inmueble sin mostrarse en el sitio, y que se muestre desde la ficha del inmueble (donde se ordena la galería). Y que Deshacer quite también el archivo público.

### 10. La Bandeja acepta videos que no puede guardar

- **Dónde:** `bandeja.ts:12` (acepta MP4 y WebM), `:70` y `:74` (ningún destino los guarda) y `zona-subir.tsx:51` y `:54` («Foto o video» con la cámara).
- **Qué pasa:** en el teléfono el asesor graba un recorrido, lo sube con datos móviles (hasta 20 MB) y después la pantalla le dice que no hay dónde guardarlo. Además, un video de teléfono suele pesar más de 20 MB.
- **Propuesta:** hasta que exista dónde guardarlos, rechazar el video al entrar con una línea clara («Los videos todavía no se guardan desde aquí; súbelo al recorrido del inmueble») y que el botón de la cámara diga «Tomar foto» y abra solo fotos.

### 11. J y K solo funcionan una vez (inferencia)

- **Dónde:** `bandeja/page.tsx:184` y `dinero/page.tsx:73` ignoran la tecla si el foco está dentro de `[role=dialog]`; la hoja del escritorio (`ui/hoja-adaptable.tsx:67-71`) es un diálogo no modal.
- **Inferencia por verificar en el navegador:** al abrir con J, el foco entra al panel lateral y las siguientes J y K ya no hacen nada. La regla parece pensada para la hoja del teléfono.
- **Propuesta:** ignorar J y K solo cuando el foco esté en un campo de texto o en una hoja modal, no en el panel lateral.

## Menor

12. **Palabras de Dinero.** `page.tsx:88` dice «recibos entregados» y `dinero.ts:97` «sin entregar: todavía no cuenta como cobrado», pero lo que se mide es si el recibo tiene PDF. Propuesta: «recibos con PDF» y «sin PDF: todavía no cuenta como cobrado».
13. **«Por entregar» no tiene nada que mostrar.** `page.tsx:96-100` y `:135-137`. La pestaña existe sin forma de registrar apartados y con una decisión del titular pendiente (la promesa 15 dice que Fortius no custodia la garantía). Propuesta: quitarla hasta que exista; con dos vistas, «Ver» pasa a interruptor (Te deben ◯ Historial), como pide la regla del 16/11.
14. **Promesas en pantalla.** `page.tsx:132` («Pronto verás aquí también…») y `:137`. Propuesta: quitar «pronto»; la pantalla dice lo que hay, no lo que vendrá.
15. **«Llegó al cierre» depende de la etapa del método viejo.** `dinero.ts:76-79` (`cierresSinComision`). Se arregla junto con AUD-05, hallazgo 1: contar los asuntos con estado «Se logró».
16. **Un asunto «No se dio» con comisión anotada sigue en «Te deben».** `dinero.ts:53` no filtra por estado. Propuesta: dejarlo fuera, o en un grupo aparte «Se cayó: revisa si se cobra».
17. **Muchas peticiones al cargar Dinero.** `dinero-lectura.ts:36` pide los formatos de cada asunto por separado y `:29` corta en 20 páginas sin avisar. Con pocas operaciones no se nota; anotarlo para la tabla de movimientos.
18. **La foto de un inmueble se sube dos veces.** `page.tsx:73` la sube a la carga privada al llegar y `:140` otra vez como pública al guardar. En datos móviles pesa. Propuesta: cuando el destino es un inmueble, mover la carga en el servidor en vez de subirla de nuevo.

## Sin cejas ni rastro de IA

No se encontraron cejas ni menciones a la IA. «Sin fecha de cobro», «Cobrados completos», «Recibos» y «Dónde va» son el único encabezado de su bloque. «Por confirmar» sigue la regla de no decir «propuesto». Las opciones usan `Desplegable` y `Segmentado` del kit; no hay filas de chips.

## Pasos que sobran o faltan, en una línea

- **Agregar:**
  - «Anotar comisión» (con moneda) en el asunto;
  - «Hacer recibo de honorarios» desde la hoja de cobro, con el monto que falta;
  - recibo «total» que salda la cuenta;
  - abrir un asunto sin salir de la Bandeja;
  - seguir solo al siguiente archivo, con el mismo destino ya puesto;
  - «Qué es» y título editable al guardar un documento;
  - guardar la cola de la Bandeja en el servidor.
- **Quitar:**
  - el botón apagado «Registrar cobro»;
  - la pestaña «Por entregar» mientras no se pueda usar;
  - el desplegable «Guardar en» (lo absorbe una sola búsqueda);
  - el video en la cámara y en los tipos aceptados, mientras no tenga destino;
  - el «pronto» de los textos.

## Para el titular

1. ¿Una foto que entra desde la Bandeja a un inmueble publicado se muestra en el sitio al momento, o espera a que se muestre desde la ficha? (hallazgo 9)
2. ¿La comisión se anota en el asunto desde que se firma el contrato de intermediación, o solo al cierre? (hallazgo 1)
3. La que ya estaba pendiente: ¿se registran apartados en resguardo? De eso depende «Por entregar» (hallazgo 13).

## Lo que está bien

- Dinero no inventa cifras: solo cuenta lo que tiene recibo con PDF, y lo dice.
- La cifra grande cambia con la vista y con «Lo lleva»; la lectura respeta lo que la base deja ver a cada quien.
- Cargando, error con reintento y vacío con una explicación útil están en las dos pantallas.
- La Bandeja revisa tipo y tamaño antes de subir, explica por qué un destino no sirve para ese archivo, renueva la carga vencida y todo guardado tiene Deshacer recuperable (papelera del asunto).
- La zona de subir se encoge en el teléfono cuando ya hay archivos, como pide el boceto, y el título de la pestaña cuenta lo que falta por confirmar.

Este informe es insumo, no decisión: lo que el titular acepte pasa a `SPEC.md` y `DECISIONES.md`.
