# Manual de administración de Fortius Inmuebles

Corte documental: 12/10/2026. Alcance cotejado con el código de `1e763345`; la sección «Prospectos, clientes y firma del contrato» se actualizó el 12/11/2026 (COR-10 y COR-17). [Estado y pendientes](../PLAN_ERP_CRM.md).

## Acceso y roles

Abre `/admin` e inicia sesión con una cuenta habilitada en `fortius_inmuebles_staff`. Los roles admitidos son `admin` y `editor`; en la implementación actual, ambos tienen acceso operativo a las colecciones del panel. La administración de usuarios se realiza en Supabase y no desde esta interfaz. La interfaz no concede permisos: Supabase valida identidad, membresía activa y rol en cada operación.

Si olvidaste la contraseña, selecciona **Olvidé mi contraseña**, solicita el enlace y establece una contraseña nueva desde la sesión de recuperación. Los enlaces vencidos o ya utilizados requieren una solicitud nueva. Nunca copies tokens de recuperación en notas o mensajes.

## Altas, consultas, cambios y bajas

Cada módulo muestra su colección y ofrece las acciones disponibles:

1. Usa **Nuevo** o la acción equivalente para crear un registro.
2. Completa los campos obligatorios y guarda. La confirmación aparece únicamente después de que el servidor acepta la escritura.
3. Abre **Editar** para cambiar un registro. Conserva la pantalla abierta si necesitas revisar el resultado.
4. Usa **Eliminar** solo después de comprobar el registro exacto. La baja del catálogo no siempre elimina archivos físicos ni datos relacionados.

Si aparece un conflicto `409`, otra sesión guardó una versión posterior. Conserva tu borrador, recarga la colección, compara cambios y vuelve a aplicar únicamente lo que siga vigente. No repitas la petición con una versión inventada ni sobrescribas el trabajo ajeno.

## Inmuebles y publicación

Los inmuebles nuevos permanecen sin publicar. Revisa título, operación, precio, zona, descripción, ficha, galería, asesor y documentos antes de activar **Publicar en el sitio**. La galería pública exige al menos una imagen accesible desde el bucket público. Despublicar retira la ficha pública en la siguiente consulta, pero conserva el registro operativo.

En **⋯ → Llaves y compradores** de cada inmueble (también desde **Editar**) se registra dónde se guardan las llaves y a quién se prestan, se marca su regreso y se lleva la preparación para promoverlo (fotos, video, recorrido 360, plano, letrero y texto del anuncio). Si el inmueble está publicado y disponible, la misma pantalla propone a los prospectos y clientes que buscan algo parecido: el botón de WhatsApp solo abre el mensaje y **Ya le avisé** registra el aviso; si el precio baja después, la persona vuelve a aparecer por avisar. Nada de esto se publica en el sitio. **Hoy** muestra las llaves sin regresar, los compradores por avisar y los contratos de servicio (09 emitido) y licencias por vencer (30 y 60 días antes).

## Mercado inmobiliario

En **Mercado inmobiliario**, crea título, slug, resumen, contenido y estado. Clasifica la entrada como **Guías** o **Actualidad**, elige su tema y completa autor, ámbito y fuente original cuando corresponda. Puedes destacarla en portada. El slug admite minúsculas, números y guiones simples; queda fijo después de crear la entrada. Usa líneas en blanco para separar párrafos; se admiten encabezados, listas y enlaces Markdown, sin interpretar HTML.

`Borrador` permanece en el panel. `Expuesto públicamente` publica la entrada en `/blog/<slug>` y la incorpora al sitemap. Confirma contenido, datos personales y vigencia antes de publicar.

La primera publicación se registra automáticamente y se conserva al editar. La activación de los nuevos campos y fechas requiere `202609240008_fortius_inmuebles_blog_editorial.sql`. Consulta [la guía editorial](mercado-inmobiliario-editorial.md) para conocer la búsqueda, clasificación y rutina propuesta.

## Prospectos, clientes y firma del contrato

El perfil del prospecto se adapta a comprar, rentar, vender o dar en arrendamiento. **Cómo llegó** registra el canal (sitio, WhatsApp, portal, referido, letrero, etc.); **Reportes** cuenta los prospectos del periodo por canal. La vinculación de cuenta con asesor determina el acceso privado a las operaciones, mientras el control comercial global requiere administrador.

Una persona es **prospecto** hasta que firma su contrato con Fortius, aunque ya tenga una operación abierta. En la ficha del prospecto, **Abrir operación** inicia la entrevista; ya no existe «Convertir en cliente». Antes de abrirla, revisa las coincidencias de teléfono o correo que advierte el panel.

La firma se registra en la etapa **Contrato y preparación** de la operación, en la tarjeta **Firma del contrato**:

1. Sube el contrato firmado (escaneado o en foto) a los documentos del cliente de esa operación. Vale el que se firmó fuera del panel.
2. Elige **Registrar la firma** y anota el tipo de contrato, la fecha, quién firmó por cada parte y el archivo.
3. Si falta alguien por firmar, desmarca «Firmaron todos los que deben firmar» y escribe quién falta. Queda como **Firma incompleta**.
4. El director revisa el contrato y elige **Marcar la firma revisada**. Solo un administrador puede hacerlo, y nunca con una firma incompleta.

Si se corrige la firma, vuelve a quedar por revisar. La firma no se borra: cuando el contrato vence o se rescinde se usa **Registrar terminación**, y después se puede registrar un contrato nuevo. Sin la firma completa, revisada y vigente, la operación no pasa a **Publicación y seguimiento** y el inmueble no se publica. El servidor también lo impide.

La condición de cada persona y de cada inmueble se calcula a partir de esa firma y se ve igual en Contactos, las fichas, la búsqueda, la agenda, Hoy, Reportes e Inmuebles:

| Se muestra | Cuándo |
| --- | --- |
| Prospecto | Todavía no firma su contrato con Fortius. |
| Cliente | Su firma está registrada (aunque falte la revisión del director). |
| Cliente anterior | Todos sus contratos terminaron. |
| Contraparte | Quedó registrado como el comprador o arrendatario en la operación de un cliente; nunca es cliente de Fortius. |
| En captación | El inmueble no tiene firma de intermediación. |
| Captado, por revisar | La firma está registrada y espera al director. |
| Captado | La firma está revisada. |

En Contactos, el filtro **Clientes** muestra solo a quien firmó; quien tiene operación sin firma sigue en **En seguimiento**. Mientras el panel no termina de consultar las operaciones, una persona aparece como «Contacto» en lugar de suponer si es cliente.

### Avalúo del propietario

Si el propietario ya tiene un avalúo, no hace falta la opinión de valor. En la etapa **Opinión de valor y precio**:

1. Sube el avalúo a los documentos del cliente de esa operación.
2. En la tarjeta **Avalúo del propietario**, elige **El propietario trae avalúo** y anota el archivo, el perito o la unidad de valuación, la fecha, el valor y la vigencia que dice el avalúo.
3. Al guardarlo, «Opinión de valor» queda revisada con ese archivo y la opinión de valor aparece como «No hace falta». La estimación del neto toma el valor del avalúo al crearse.

Cuando el avalúo vence, la operación vuelve a pedir el valor: registra uno actualizado o haz la opinión de valor. El avalúo del propietario sirve para fijar el precio; si el comprador usa crédito, su banco o el Infonavit pedirá su propio avalúo.

Al confirmar cualquier otro requisito, el respaldo puede ser **Un documento del cliente** subido a esa operación.

**Eliminar expediente** conserva sus documentos y permite recuperarlo desde **Eliminados**. Mientras está eliminado se bloquean escrituras y descargas documentales. La recuperación mantiene su identidad y archivos; una eliminación recuperable no equivale a borrado definitivo.

Consultar [el catálogo y sus límites](formatos-admin-status.md) antes de emitir. El 09 continúa bloqueado aunque tenga datos capturados. [El espacio de trabajo](admin-workspace.md) explica vistas guardadas, copias temporales, historial y reportes.

## Archivos

Selecciona visibilidad antes de cargar:

- **Privado**: solo personal autorizado; se abre mediante enlace firmado de corta duración.
- **Público**: accesible por URL y apto únicamente para material autorizado para difusión.

El sistema valida tipo, tamaño y contenido, y conserva `bucket` y `path` en el registro del catálogo. Quitar un elemento del catálogo no borra automáticamente el objeto almacenado. No cargues identificaciones, escrituras ni información confidencial como archivos públicos.

## Contenido y contacto

En **Contenido**, edita los titulares de portada, el bloque de marca, los metadatos y los grupos de presentación, método, entregables, preguntas frecuentes y contacto. Los saltos de línea se conservan en los títulos. Un campo de los grupos que se deje vacío usa el texto predeterminado. Guarda para confirmar la escritura en el servidor. La publicación de estos nuevos grupos requiere `202609230007_fortius_inmuebles_home_editorial.sql`.

En **Configuración**, completa teléfono, WhatsApp y Facebook/Messenger cuando estén definidos. La web muestra los canales válidos configurados. Si todavía no hay canales y los formularios están deshabilitados, informa que el contacto estará disponible próximamente y ofrece consultar las propiedades. No publica destinos de ejemplo ni presenta formularios que no pueden recibir solicitudes.

## Leads y datos de ejemplo

Los formularios públicos de leads están deshabilitados por defecto mediante `FORTIUS_INMUEBLES_PUBLIC_LEADS_ENABLED=false`. Actívalos solo después de configurar el secreto del servidor, aplicar migraciones y verificar persistencia y límites.

Los inmuebles, contactos, PDFs y demás datos de ejemplo sirven para revisar la interfaz. No representan inventario, precios, personas, disponibilidad ni condiciones comerciales reales. Conserva las propiedades demo y su identificación de ejemplo. Para iniciar operación real, separa los ejemplos de los registros operativos y revisa su publicación; no los cuentes como actividad ni inventario comercial vigente.
