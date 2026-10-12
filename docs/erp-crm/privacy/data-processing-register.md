# Registro de tratamiento de datos — borrador Fortius

Fecha: 12/10/2026. Estado: inventario de código y propuesta de controles; requiere validación del responsable y revisión profesional antes de fijar conservación, fundamento específico o procedimientos definitivos. No modifica avisos jurídicos publicados.

## Inventario del tratamiento

| Grupo / origen de código | Finalidad a confirmar | Datos / alcance | Control y disposición a revisar |
|---|---|---|---|
| Prospectos / `domain/records`, lead-profile | Responder solicitud, calificar necesidades, programar seguimiento | Identidad/contacto, interés, perfil y notas; acceso según asesor/membresía | Captación mínima, fuente y versión de aviso; uso promocional separado; coincidencia no autoriza fusión. |
| Clientes / `backend/contracts` | Encargo y operación | Contacto, papel, asesor, origen y perfil | Corrección versionada; varios papeles no deben duplicar identidad; eliminación visual no suprime historial. |
| Personal / Auth, staff, adviser_accounts | Identidad y control de acceso | Cuenta, membresía, asociación y perfil | Perfil público opt-in separado; roles por capacidad; nunca guardar contraseñas en CRM. |
| Inmuebles / Property, private expediente | Inventario, encargo y comercialización autorizada | Publicables y relación interna de partes/expediente | Proyección pública limitada; documentos y domicilios internos no publicados por defecto. |
| Expedientes y formatos / formatos, emisiones, assets, signed_copies | Revisar, documentar y conservar operación | Puede contener identidad, titularidad, datos patrimoniales/financieros, firmas y documentos de partes | Necesidad por etapa, revisión de base/consentimiento, acceso privado heredado, evidencia/versión, conservación por finalidad/obligación. No clasificar todo como «sensible» automáticamente. |
| Comercial / comercial_books/revisions/emissions | Priorización y seguimiento de negocio | Oportunidades, valores, gestión y fuentes | Acceso administrativo actual; no ingreso cobrado inferido; vínculo de datos sin copias inconsistentes. |
| Agenda/tareas/notas | Coordinación de operación | Fechas, responsables, referencias y texto | Mínimo contexto útil, evitar documentos personales en notas libres; validar ámbito de cada vínculo. |
| Logs / backend/http | Diagnosticar incidentes | RequestId, categoría, estado, duración | Sin cuerpos ni excepciones crudas; retención operativa por acordar, sin convertir log en expediente. |
| Backups / tools | Continuidad y recuperación | Puede incluir todo el alcance anterior | Copia privada, cifrada/custodiada y acceso registrado; huella independiente; tratamiento y retención específicos. |

## Flujo propuesto de solicitud de privacidad

Recepción → verificación proporcional de identidad → delimitar datos/acción → revisar impedimentos de conservación o derechos de terceros → decisión responsable → ejecutar con auditoría y mínimo acceso → comunicar y registrar cierre. No exportar automáticamente toda la cartera a una persona por compartir teléfono/correo.

Cancelación, bloqueo, supresión, baja de acceso y eliminación visual son acciones distintas. Conservación legal o contractual requiere fundamento y revisión; no ejecutar un job de borrado con plazo uniforme. Las copias firmadas/emisiones históricas y respaldos requieren política específica, sin prometer borrado instantáneo de todos los medios.

## Fuentes oficiales consultadas

Contexto: diseño de un sistema para servicios inmobiliarios privados en Tijuana, Baja California; no resolución de una operación individual. Consulta de textos oficiales consolidados el 12/10/2026; confirmar aplicabilidad, reglamento/reglas y transitorios en la revisión sustantiva. No se fijan umbrales monetarios, tasas ni agenda de conservación automática.

| ID | Fuente / versión leída | Localizadores y relación con controles | Estado |
|---|---|---|---|
| MX-PRIV-2025 | Cámara de Diputados, [LFPDPPP](https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf); nueva ley 20/03/2025, encabezado reforma 14/11/2025 | Art. 5–7 principios/consentimiento; 10–12 finalidad, necesidad y conservación; 14–15 aviso; 18–20 seguridad/confidencialidad; 22–25 ARCO, bloqueo/excepciones | Texto recuperado y artículos leídos. Tratamiento concreto y conservación requieren revisión. |
| MX-PLD-2025 | Cámara de Diputados, [LFPIORPI](https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPIORPI.pdf); encabezado reforma 16/07/2025 | Art. 17 fr. V contempla intermediación habitual/profesional en compra/venta de inmuebles; art. 18 fr. IV contempla conservación por al menos diez años en su supuesto y reglas especiales | REQUIERE_REVISION de sujeto, operación, transitorios y reglas. No aplicar diez años a cada lead por inferencia ni presumir estar fuera por un pago aislado. |

SHA-256 de los PDFs oficiales leídos:

- MX-PRIV-2025: `04d67464e1efc0472040e2ff8012ced52c73ff4fc3573c8e2d3477fd976359c6`.
- MX-PLD-2025: `2e35228bd3100a3a137f313359833c4836f2b4b6d4e52e1ce4fe58a970cd768f`.

Las versiones recuperadas llevan las fechas anteriores en su encabezado. Esta lectura no certifica cumplimiento de Fortius, registro PLD, consentimiento válido de un cliente ni agotamiento de todas las normas aplicables. NOM-247 y aspectos fiscales/contractuales se verifican en las tareas de esos módulos, sin ampliar su ámbito por defecto.

## Decisiones pendientes

Responsable operativo de solicitudes e incidentes; finalidades efectivas y proveedores/transferencias; plazos por clase de expediente; procedimiento de bloqueo/supresión; acceso de revisores; uso móvil/offline y custodia de respaldos. PRV-01 queda en revisión, no aceptado como cumplimiento definitivo.
