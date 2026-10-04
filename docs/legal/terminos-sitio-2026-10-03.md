# Términos de uso del sitio de Mint

Fecha de corte: 3 de octubre de 2026. Alcance: página pública `/terminos`; no sustituye contratos de servicios inmobiliarios, compraventa, arrendamiento, mandato ni un aviso integral de privacidad.

## Hechos y decisiones de redacción

- Confirmados por el usuario: responsable Moisés Núñez Tonalá; correo `tonala.mn@gmail.com`, cuya escritura sin tilde se confirmó expresamente; no existe todavía domicilio comercial definido ni correo corporativo. Se autorizó identificar Tijuana, Baja California, como ubicación de atención. La ciudad no se presenta como domicilio físico ni se inventa una oficina, razón social, RFC, registro de marca o licencia profesional.
- Comprobados en código: el sitio publica fichas, artículos y calculadoras, contiene formularios de solicitudes iniciales y un panel restringido, y carece de un sistema de contratación y pagos en línea. Las fichas pueden identificar expresamente datos de demostración. Las calculadoras tienen conceptos excluidos que se explican de manera específica.
- Comprobados en la configuración pública: no había correo ni teléfono comercial habilitados. El correo confirmado se publica en los términos para que estos tengan un canal real de aclaraciones; no se modifica la configuración global ni se habilitan formularios como parte de esta tarea.
- Los términos no presumen contratación, exclusividad, poder de representación, reservas, aceptación de ofertas ni cobros por navegar o enviar una solicitud ordinaria de contacto. Tampoco pretenden privar de efectos a acuerdos que se celebren y formalicen por separado.
- No se incluyen exoneraciones absolutas, indemnizaciones unilaterales, renuncias de derechos, fuero obligatorio, consentimiento general para datos ni modificaciones retroactivas de contratos.
- Revisión final de estilo con humanizer: reglas concretas, español de México, identificación clara del responsable y párrafos legibles. No se restablecen avisos genéricos en el footer o en las páginas comerciales.

## Autoridades abiertas y verificadas

| Fuente oficial y versión | Disposición revisada | Aplicación a los términos |
| --- | --- | --- |
| [Ley Federal de Protección al Consumidor](https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPC.pdf), última reforma DOF 12-12-2025 | Artículos 1, 7, 32 y 42 | Derechos irrenunciables, respeto de condiciones ofrecidas y publicidad clara y comprobable. Una corrección del sitio no sirve para desconocer compromisos. |
| Misma ley | Artículos 73, 73 bis y 73 ter | Reglas especiales de vivienda y contratos aplicables a quienes intervienen en asesoría y venta al público. Los términos del sitio no sustituyen esos instrumentos ni su registro cuando proceda. |
| Misma ley | Artículo 76 bis | Deberes en transacciones electrónicas: identidad, canales, seguridad e información de costos. El sitio actual no formaliza transacciones; antes de añadirlas debe completarse la información física y operativa exigible. |
| Misma ley | Artículos 85 y 90 | Legibilidad y ausencia de obligaciones abusivas, exoneraciones prohibidas, renuncias y modificaciones contractuales unilaterales. |
| [NOM-247-SE-2021](https://www.dof.gob.mx/nota_detalle.php?codigo=5646251&fecha=22/03/2022), publicada DOF 22-03-2022 | Numerales 1, 5 y 6 | Campo de aplicación a comercialización de vivienda, información veraz y requisitos contractuales. No se presenta como norma universal para terrenos, inmuebles industriales o toda operación entre particulares. |
| [Ley Federal de Protección de Datos Personales en Posesión de los Particulares](https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf), ley publicada 20-03-2025 y última reforma 14-11-2025 | Artículos 6 a 8, 13 a 16 y 18 | Consentimiento y tratamiento de documentos, información previa mediante aviso y seguridad. Se elimina la antigua equivalencia entre enviar un formulario y aceptar genéricamente el aviso. |
| [Ley Federal del Derecho de Autor](https://www.diputados.gob.mx/LeyesBiblio/pdf/LFDA.pdf), última reforma 14-05-2026 | Artículo 148 | Se preservan excepciones legales de uso y licencias de contenidos ajenos; no se afirma titularidad exclusiva sobre todo el material. |

Los documentos oficiales se descargaron y se leyeron sus disposiciones determinantes. No se utilizó una ley de privacidad abrogada. No se atribuye a los enlaces externos representación, autorización o respaldo institucional.

## Control adversarial y límites concretos

1. Un aviso que diga que toda información es “no vinculante” no elimina los deberes de publicidad ni las condiciones ofrecidas. El texto conserva esos derechos expresamente.
2. Que el sitio no tenga checkout no excluye los deberes aplicables a la publicidad, la captación de datos o contratos que se celebren por otros canales. El alcance se limita a estas reglas de uso.
3. Una exclusiva no concede automáticamente poder para disponer del inmueble. Los términos requieren pacto específico y facultades independientes cuando correspondan.
4. Un enlace al aviso de privacidad no completa dicho aviso. El aviso actual requiere una revisión propia, en particular identificación y domicilio reales del responsable, finalidades, mecanismos ARCO y contacto, conforme al artículo 15. Se mantiene fuera de esta modificación porque el domicilio todavía no existe y no se autorizó sustituir ese documento.
5. “Tijuana, Baja California” es lugar de atención; no se trata como domicilio para notificaciones. Antes de contratar o habilitar transacciones electrónicas se debe proporcionar la identificación, domicilio y canales exigidos por las normas que correspondan.
6. No se declara que los contratos de Mint estén registrados en PROFECO ni que se hayan verificado todas sus autorizaciones. Esos hechos no fueron aportados ni comprobados.

Solidez alta para la supresión de renuncias, la separación de solicitudes y contratación, y las reglas de uso descritas. La conformidad del aviso de privacidad y de futuros contratos es materia distinta y no se declara resuelta con esta página.

## Integración

El texto y la identificación están en `src/data/site-terms.ts`. La página `src/app/terminos/page.tsx` presenta fecha de versión, responsable, correo, índice navegable y once apartados, con enlaces al aviso de privacidad y al inicio. Se verifica navegación, anchors, correo, legibilidad, contraste y ausencia de desbordamiento en celular y PC, además de compilación y lint.
