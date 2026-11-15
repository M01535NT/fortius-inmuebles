# Revisión jurídica pendiente del sistema de Fortius Inmuebles

**Para:** el abogado de Fortius Inmuebles
**De:** dirección de Fortius Inmuebles
**Fecha:** 15 de noviembre de 2026
**Plaza:** Tijuana, Baja California

## Para qué es este documento

Fortius está por empezar a operar con clientes reales en su sistema interno: el panel donde se capturan los expedientes, se emiten los contratos y se lleva cada operación. Antes de usarlo con personas reales necesitamos su opinión sobre los puntos de este documento. Ningún abogado ha revisado todavía estos textos ni los análisis que aquí se describen: los contratos de los puntos 5 y 6 los redactó el equipo de Fortius y los aprobó dirección, sin intervención jurídica. Ninguno se ha firmado con clientes, y la base de datos solo contiene datos de prueba.

Cada punto dice qué hace hoy el sistema, qué texto revisar y qué le preguntamos. Al final hay un espacio para su respuesta. Lo que usted indique se aplica tal cual: si pide cambiar un texto o que el sistema impida algo, se programa así.

**Prioridad:**

- **A · Antes del primer cliente real.** Sin su visto bueno no se usa.
- **B · Antes de usar esa función.** Puede esperar hasta que se vaya a usar.

Las referencias legales son las que el equipo consultó en fuentes oficiales, con su fecha. No sustituyen su revisión: confírmelas o corríjalas.

## Índice

| # | Tema | Prioridad |
|---|---|---|
| 1 | El sistema avisa en lugar de detener | A |
| 2 | Antilavado (LFPIORPI) | A |
| 3 | Promesa de compraventa (formato 15) | A |
| 4 | Contrato de intermediación para venta (formato 09) | A |
| 5 | Contratos de renta redactados por el equipo (formatos 20 a 23) | A |
| 6 | Compraventa a plazos con reserva de dominio (formato 24) | A |
| 7 | Aviso de privacidad y registro de tratamiento | A |
| 8 | Revisión jurídica y opinión jurídica del inmueble (formatos 05 y 06) | A |
| 9 | Lectura automática de documentos del cliente | B |
| 10 | Textos breves por validar | B |
| 11 | Firma electrónica propia | B |
| 12 | Guías para asuntos jurídicos | B |

---

## 1. El sistema avisa en lugar de detener · A

**Qué decidió dirección.** El 14 y el 15 de noviembre de 2026 dirección decidió que ningún requisito impida guardar, avanzar de etapa, publicar ni firmar. Si falta algo, el sistema lo muestra como aviso y anota en el historial de la operación la fecha, quién siguió adelante y, si lo escribe, el motivo.

**En qué estado está.** El cambio está construido en la versión en preparación, que todavía no se publica; en el sistema que hoy está en uso, todos estos casos siguen deteniendo. Ya construidos en esa versión:

- la identificación de las partes para antilavado;
- firmar una venta con una hipoteca cuya cancelación no está inscrita;
- publicar un inmueble sin contrato de intermediación firmado;
- descargar la promesa de compraventa con datos faltantes (sale marcada «Documento incompleto» en cada hoja).

Aprobados y todavía sin construir:

- la firma y los pagos pendientes al entregar el inmueble;
- publicar un inmueble de otra inmobiliaria sin su autorización escrita;
- enseñar un inmueble antes de la firma sin la carta del propietario.

Siguen deteniendo: los permisos (solo dirección publica y autoriza), la privacidad del sitio público (nunca la dirección exacta ni documentos), la publicación de un inmueble sin fotografías, el aviso de privacidad que no se descarga incompleto y la integridad de los datos.

**Qué le preguntamos.**

1. ¿Hay algún requisito de la lista que, por ley, el sistema deba impedir y no solo avisar? En particular, la identificación antilavado antes de firmar y la promesa incompleta.
2. ¿La anotación en el historial (fecha, usuario y motivo) sirve como evidencia de que Fortius advirtió el faltante? ¿Qué más debería guardar?
3. ¿Conviene que el motivo sea obligatorio en algún caso?

## 2. Antilavado (LFPIORPI) · A

**Qué hace.** En las compraventas, el sistema pide un expediente de identificación de las partes: identificación oficial, RFC, CURP, domicilio, ocupación, declaración de persona políticamente expuesta y origen de los recursos; en personas morales, además, el beneficiario controlador. Los documentos se guardan en almacenamiento privado. Por el punto 1, si falta el expediente el sistema avisa, no detiene.

En la promesa, el sistema revisa el medio de cada pago y su fecha. Si los pagos en efectivo o metales suman 8,025 veces la UMA diaria o más en la fecha de pago (art. 32 fr. I), lo señala. Dirección decidió el 14 de noviembre que eso se impida, no solo se avise. Pero en la versión en preparación esa señal cuenta como un dato faltante más, así que hoy una promesa con efectivo por encima del límite se puede descargar, marcada como incompleta. Está pendiente corregirlo.

**Referencias consultadas el 15 de noviembre de 2026** ([LFPIORPI](https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPIORPI.pdf), última reforma DOF 16-07-2025; [UMA 2026, INEGI](https://www.inegi.org.mx/contenidos/saladeprensa/boletines/2026/uma/uma2026.pdf)):

- Art. 17 fr. V: es actividad vulnerable la construcción o desarrollo de inmuebles y la intermediación en la transmisión de la propiedad o en la constitución de derechos sobre ellos, en los que se involucren operaciones de compra o venta de los propios bienes. El aviso procede desde 8,025 veces la UMA diaria; la fracción no fija un umbral distinto para identificar. Por debajo no hay obligación, salvo que lo acumulado en seis meses supere el monto de aviso.
- Art. 18 fr. IV: la información y documentación se conservan, en físico o en electrónico, en el domicilio registrado ante la Secretaría, al menos diez años desde la actividad vulnerable; el plazo se interrumpe si se promueve un recurso o juicio. El decreto entró en vigor el 17 de julio de 2025. El segundo transitorio dio doce meses a la Secretaría para modificar las reglas generales (plazo vencido el 17 de julio de 2026); no se confirmó si ya las publicó.
- Reglamento de la LFPIORPI (última reforma DOF 27-03-2026): el sistema toma de su art. 6, párr. 3, que las contribuciones y accesorios cuentan para el límite de efectivo, y de su art. 20, la conservación. Estos artículos no se volvieron a revisar el 15 de noviembre.
- Art. 32 fr. I: se prohíbe pagar en efectivo, divisas o metales preciosos la transmisión de derechos reales sobre inmuebles de 8,025 UMA o más, con la UMA del día del pago.
- UMA diaria 2026: $117.31, vigente desde el 1 de febrero de 2026. 8,025 UMA son $941,412.75.

**Qué le preguntamos.**

1. ¿Fortius, como intermediario habitual en compraventa de inmuebles, es sujeto obligado por el art. 17 fr. V? ¿Debe identificar a las partes en toda operación o solo desde cierto monto, si las reglas generales lo fijan? ¿Debe estar dado de alta en el portal de actividades vulnerables?
2. ¿La lista de datos y documentos del expediente es completa y correcta? ¿La intermediación en arrendamiento queda fuera de la fr. V, por no involucrar compra o venta? Si no queda fuera, ¿qué se pide en la renta?
3. ¿Se confirma la conservación por al menos diez años de la información y documentación de cada operación, y desde qué fecha aplica? ¿Aplica también a prospectos que nunca firmaron?
4. La prohibición de pagos en efectivo: ¿el sistema debe impedir emitir la promesa cuando se rebasa el límite, aunque la regla general sea avisar?
5. ¿Quién debe ser el responsable de cumplimiento ante la autoridad y qué registro interno debe llevar?

## 3. Promesa de compraventa (formato 15) · A

**Qué hace.** Es el modelo del titular, con sus 26 cláusulas. Se habilitó para el régimen civil de Baja California, con pleno dominio documentado y términos negociados entre particulares. El equipo concluyó, sin revisión jurídica, que a una venta ocasional entre particulares no le aplica el régimen de contratos de adhesión de vivienda (NOM-247-SE-2021, numeral 6.1). Los importes en letra salen de las cifras; el calendario debe sumar el precio; la garantía exige receptor y cuenta, y Fortius no custodia dinero.

En la versión en preparación la promesa se descarga aunque falten datos, marcada «Documento incompleto» en cada hoja (punto 1). Un dato que solo dice «pendiente», «por definir» o «por confirmar», o que trae corchetes, cuenta como faltante; una frase que menciona «pendiente» dentro de una condición sí se acepta (decisión de dirección del 13 de noviembre, sujeta a su revisión).

**Qué le preguntamos.**

1. ¿Es aceptable que exista una promesa marcada como incompleta, o debe impedirse su descarga hasta que esté completa?
2. ¿El criterio de qué cuenta como dato faltante es correcto?
3. ¿Es correcta esa conclusión sobre la NOM-247? Si no lo es, ¿qué registro o cambio requiere la promesa?

**Texto a revisar:** promesa 15 con un caso ficticio completo y otro con datos faltantes (versión del 15 de noviembre de 2026).

## 4. Contrato de intermediación para venta (formato 09) · A

**Qué hace.** Es el modelo Word del titular del 26 de octubre de 2026, con sus once cláusulas y la tercera bis. Fortius no tiene registro del modelo ante PROFECO y dirección decidió el 12 de noviembre que no es necesario; desde ese día el contrato se emite en PDF, sin revisión jurídica previa. La pena máxima es el menor entre el importe pactado y la comisión sin IVA.

**Qué le preguntamos.**

1. ¿Es obligatorio registrar el modelo ante PROFECO para este contrato? Si lo es, ¿en qué casos (vivienda, persona física)?
2. ¿El contrato se puede firmar así con clientes reales? Si no, ¿qué cláusulas deben cambiar antes?

**Texto a revisar:** formato 09 con un caso ficticio (versión del 15 de noviembre de 2026).

## 5. Contratos de renta redactados por el equipo (formatos 20 a 23) · A

Dirección pidió que el equipo los redactara el 13 de noviembre de 2026 y aprobó el texto el mismo día; ningún abogado ha intervenido. Ninguno cita artículos, porque los del Código Civil de Baja California sobre arrendamiento no se verificaron. Ningún monto, plazo ni porcentaje trae valor por defecto. Fortius no firma como parte, no recibe rentas, depósitos ni garantías y no administra el inmueble.

**20 · Arrendamiento.** Un solo contrato para casa habitación o uso comercial u oficina, con 21 cláusulas. Se elige la garantía (fiador con o sin inmueble, obligado solidario o solo depósito), la actualización de la renta (INPC o porcentaje fijo), la salida anticipada, IVA, retenciones, condominio, mascotas y seguros. Una cláusula deja a salvo los derechos irrenunciables.

**21 · Intermediación para renta.** Misma forma que el 09. Honorarios en meses de renta o en porcentaje de la renta del plazo forzoso; se devengan al firmarse el arrendamiento y recibir el cliente la primera renta y el depósito. La pena es el menor entre el máximo pactado y los honorarios sin IVA.

**22 · Solicitud de arrendamiento.** La llena el interesado (y su garante). Pide ingresos y patrimonio con su consentimiento; no pide estado civil, religión ni datos que puedan prestarse a discriminar, ni consulta buró de crédito. Fortius revisa que los documentos sean coherentes, sin certificarlos ni garantizar la solvencia.

**23 · Inventario de entrega y devolución.** Compara el estado de cada espacio al entrar y al salir, y liquida el depósito solo con rentas, servicios y cuotas pendientes y daños que exceden el desgaste normal, cada uno con comprobante.

**Qué le preguntamos.**

1. ¿Los cuatro textos se pueden usar en Baja California? Marque sobre el texto impreso las cláusulas que cambiaría o quitaría.
2. ¿Conviene citar los artículos del Código Civil de Baja California? ¿Cuáles?
3. En el 22, ¿el consentimiento para tratar ingresos y patrimonio es suficiente? ¿Falta algo para no discriminar?
4. En el 23, ¿la liquidación del depósito es conforme a derecho?

**Textos a revisar:** formatos 20 a 23 con un caso ficticio y en blanco (versión del 15 de noviembre de 2026).

## 6. Compraventa a plazos con reserva de dominio (formato 24) · A

**Qué hace.** Redactado por el equipo y aprobado por dirección el 13 de noviembre de 2026, sin intervención de un abogado: catorce cláusulas y dos anexos (calendario de pagos y acta de entrega). El vendedor conserva la propiedad hasta el último pago. Los pagos son por transferencia o cheque, nunca en efectivo; Fortius aparece solo como intermediario del vendedor y no recibe pagos. Si el comprador deja de pagar, el vendedor avisa y da un plazo; si rescinde, devuelve lo pagado menos una renta por el uso, los daños, los adeudos y una pena, sin que la renta y la pena juntas pasen de lo pagado.

**Escritura o documento privado.** El sistema solo ofrece el documento privado cuando el precio en pesos no pasa de 10,000 veces la UMA diaria ($1,173,100 en 2026); por encima, o con precio en dólares, el contrato sale para escritura pública. El documento privado lleva dos testigos y la ratificación de firmas ante notario.

**Referencias consultadas el 15 de noviembre de 2026** ([Código Civil para el Estado de Baja California](https://www.congresobc.gob.mx/Documentos/ProcesoParlamentario/Leyes/TOMO_III/20260605_CODCIVIL.PDF), última reforma P.O. 05-06-2026): el art. 2194 exige escritura pública cuando el inmueble vale más de 10,000 veces la UMA diaria, salvo lo que disponen los arts. 2121 y 2191, segundo párrafo; el art. 2191 permite hasta ese valor el documento privado ante dos testigos, con firmas ratificadas ante notario, juez, Registro Público de la Propiedad o Catastro Municipal; el art. 2193 pide dos originales y dictamen de perito valuador para inscribir. El art. 2121 no se revisó.

**Qué le preguntamos.**

1. ¿Es correcto el límite de valor para el documento privado? ¿Conviene ofrecer también la ratificación ante juez, Registro Público o Catastro, que el art. 2191 admite, o dejar solo la notarial? ¿Qué cambia con el art. 2121?
2. ¿El interés moratorio que se puede pactar es válido? ¿Tiene un tope?
3. ¿Lo que se devuelve al rescindir es conforme a derecho?
4. ¿La reserva de dominio debe inscribirse en el Registro Público para valer frente a terceros?

**Texto a revisar:** formato 24 con un caso ficticio con intereses, cónyuge, gravamen y seguro (versión del 15 de noviembre de 2026).

## 7. Aviso de privacidad y registro de tratamiento · A

**Qué hace.** El aviso de privacidad publicado en el sitio nombra como responsable a la persona física del titular. Fortius operará como persona moral, cuyos datos todavía no se cargan. El sistema guarda los datos de prospectos, clientes (vendedores, compradores, arrendadores y arrendatarios), inmuebles, expedientes, trámites y del personal; los documentos privados nunca salen en el sitio público. Hay un registro interno de qué datos se tratan, para qué y con qué controles. En resumen:

| Personas | Para qué | Datos |
|---|---|---|
| Prospectos | Responder su solicitud y darle seguimiento | Contacto, interés, perfil y notas |
| Clientes (vendedor, comprador, arrendador, arrendatario) | Prestar el servicio contratado | Contacto, papel en la operación, documentos de identidad y propiedad |
| Partes de una compraventa | Identificación antilavado (punto 2) | Identificación, RFC, CURP, domicilio, ocupación, persona políticamente expuesta, origen de recursos, beneficiario controlador |
| Solicitantes de renta | Elegir arrendatario (formato 22) | Ingresos, patrimonio, referencias y garante |
| Propietarios con trámite | Cancelar su hipoteca | Acreedor, número de crédito, folio real y comprobantes |
| Personal de Fortius | Acceso al sistema | Cuenta y permisos |

Los documentos se guardan en almacenamiento privado con huella digital y nunca salen en el sitio público. Lo que se borra va a una papelera recuperable; los plazos de conservación aún no están fijados.

**Referencias consultadas el 15 de noviembre de 2026** ([LFPDPPP](https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf), última reforma DOF 14-11-2025): la autoridad es la Secretaría Anticorrupción y Buen Gobierno (art. 2 fr. XV y transitorios). No se encontró publicado un reglamento nuevo; el único disponible es el de 2011.

**Qué le preguntamos.**

1. ¿Qué debe cambiar en el aviso al pasar la responsabilidad a la persona moral?
2. ¿El aviso cubre ya a compradores y arrendatarios, que desde el 14 de noviembre también son clientes con expediente?
3. ¿Cuánto tiempo se conservan los datos de cada clase de persona, además de los diez años de antilavado?
4. ¿Quién atiende las solicitudes de acceso, rectificación, cancelación y oposición, y en qué plazo?

**Texto a revisar:** el aviso de privacidad vigente, publicado en el sitio de Fortius.

## 8. Revisión jurídica y opinión jurídica del inmueble (formatos 05 y 06) · A

**Qué hace.** El 05 es el control de la revisión jurídica de cada inmueble, tomado del Word del titular del 26 de octubre de 2026: 22 documentos, personas, tracto, cargas, ocho controles especiales, hallazgos y ocho condiciones de cierre. Distingue un documento recibido de uno verificado. El 06 es la opinión jurídica del inmueble, en ocho secciones (conclusión con resultado, objeto y alcance, antecedentes, marco jurídico con fecha de consulta, análisis, condiciones por etapa, documentos revisados y vigencia y límites), con los datos y la firma del abogado responsable. No hay Word del titular para el 06: dirección aprobó este diseño el 12 de noviembre, con el 05 como base. El sistema no redacta ni infiere el contenido jurídico: lo captura el abogado.

**Qué le preguntamos.**

1. ¿Las secciones del 06 son las que usted firmaría? ¿Cuál quitaría o agregaría?
2. ¿Los 22 documentos y las ocho condiciones de cierre del 05 son los correctos para Baja California?
3. ¿Qué vigencia debe tener una opinión jurídica antes de rehacerla?

**Textos a revisar:** formatos 05 y 06 en blanco y con un caso ficticio (versión del 15 de noviembre de 2026).

## 9. Lectura automática de documentos del cliente · B

**Qué hace.** El sistema puede leer un documento que entrega el cliente (escritura, identificación, avalúo) y proponer los datos para llenar el expediente. Para hacerlo envía el archivo completo a un proveedor externo de inteligencia artificial, que actuaría como encargado: Anthropic (servicio Claude) o, solo para imágenes, xAI (servicio Grok); la configuración elige uno. Falta confirmar en qué país procesa y guarda cada uno los datos; se presume que fuera de México. La persona del equipo confirma cada dato antes de usarlo. Hoy está apagado en el sitio publicado y solo se ensaya con documentos ficticios.

**Qué le preguntamos.**

1. ¿Qué debe decir el aviso de privacidad para permitirlo (encargado, transferencia internacional)?
2. ¿Qué debe decir el contrato con el proveedor sobre conservación y uso de los archivos? Se le pueden enviar los términos de tratamiento de datos de cada uno.
3. ¿Hay documentos que nunca deban enviarse, por ejemplo identificaciones o datos de menores?

## 10. Textos breves por validar · B

Dirección aprobó estas tres reglas el 12 de noviembre; faltan los textos.

1. **Carta de autorización de visita antes de la firma.** El propietario autoriza enseñar su inmueble a un interesado concreto antes de firmar la intermediación. Conviene que diga que, si ese interesado compra, se respeta la comisión de Fortius. ¿Puede redactarla o darnos los elementos que debe llevar?
2. **Autorización de otra inmobiliaria para publicar un inmueble que ella captó.** Fecha, quién la da, qué inmueble y que su contrato con el propietario le permite compartirlo y publicarlo. En el sitio sale «Inmueble en colaboración» y cada dato no verificado, «Según la inmobiliaria aliada». ¿Es suficiente?
3. **Inmueble con un problema** (ocupado sin permiso, crédito vencido, herencia sin resolver, adeudos o juicio). ¿Qué preguntas hacer al propietario y qué documentos pedir en cada caso?

## 11. Firma electrónica propia · B

**Qué hace.** Está planeada, no construida: el firmante recibe una liga, ve el contrato completo, confirma su identidad con un código a su correo o teléfono y firma con el dedo o escribiendo su nombre. El sistema guarda fecha, hora, código, dispositivo y una huella del documento. Mientras no se apruebe, se firma en papel y se sube el archivo.

**Qué le preguntamos.**

1. ¿Para qué contratos sirve esta firma en Baja California y para cuáles no?
2. ¿Qué evidencia debe guardarse para que valga en un juicio?

## 12. Guías para asuntos jurídicos · B

El sistema tendrá guías que sugieren pasos y documentos para sucesión o adjudicación, recuperación de un inmueble invadido, juicio de desahucio, seguimiento de un juicio y crédito Infonavit del comprador. Las guías solo sugieren, nunca deciden. Cuando estén redactadas se le enviarán aparte para que las valide antes de usarlas con clientes.

**Qué le preguntamos.** ¿Está dispuesto a validarlas, y en qué orden le conviene recibirlas?

**Fuera de este documento:** la protección de la propiedad intelectual del sistema (registro de obra y de marca) se consultará con un especialista en la materia.

---

## Respuesta del abogado

| # | Visto bueno | Cambios o comentarios |
|---|---|---|
| 1 | ☐ Sí ☐ Con cambios ☐ No | |
| 2 | ☐ Sí ☐ Con cambios ☐ No | |
| 3 | ☐ Sí ☐ Con cambios ☐ No | |
| 4 | ☐ Sí ☐ Con cambios ☐ No | |
| 5 | ☐ Sí ☐ Con cambios ☐ No | |
| 6 | ☐ Sí ☐ Con cambios ☐ No | |
| 7 | ☐ Sí ☐ Con cambios ☐ No | |
| 8 | ☐ Sí ☐ Con cambios ☐ No | |
| 9 | ☐ Sí ☐ Con cambios ☐ No | |
| 10 | ☐ Sí ☐ Con cambios ☐ No | |
| 11 | ☐ Sí ☐ Con cambios ☐ No | |
| 12 | ☐ Sí ☐ Con cambios ☐ No | |

Nombre y firma: ______________________ Fecha: ______________
