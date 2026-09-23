# Ficha ampliada de leads

## Alcance aprobado

Alta manual y edición posterior con contacto, búsqueda o inmueble ofrecido, características, propiedad del inventario opcional, presupuesto, financiamiento, origen de ingresos y seguimiento. Ingresos en Estados Unidos se registra de forma independiente de USD y del crédito.

Contacto permanece visible; las otras secciones son desplegables. Solo nombre y teléfono son obligatorios. Los datos desconocidos permanecen sin definir. Los montos de renta se identifican como mensuales; los presupuestos con monto requieren moneda explícita. La fecha de próximo contacto forma parte del perfil; los eventos de agenda se crean mediante la sección Agenda existente.

## Persistencia y compatibilidad

El perfil opcional se guarda en `mnt_records.data.perfil`, usando el mismo endpoint autenticado, permisos y control de versiones. No se necesitan cambios de tablas ni migración de registros antiguos. Correo, zona, tipo, inmueble, asesor y mensaje conservan sus campos existentes. La API pública de captación no admite el perfil privado.

La edición conserva historial, origen, campos desconocidos y versiones. Un conflicto conserva el borrador. También se conserva si una actualización de otra pestaña deja de devolver el lead durante la edición.

## Comprobaciones

- 160 pruebas backend y 111 pruebas del panel aprobadas (271 en total).
- 39 casos específicos de validación de perfil: compatibilidad, límites, rangos, fechas, moneda y rechazo del perfil por la API pública.
- 3 pruebas del formulario: captura estructurada, presupuesto inválido, edición versionada y borrador ante conflicto.
- 4 recorridos de navegador a 320, 390, 768 y 1440 px: alta, recarga, consulta, edición, conflicto y desaparición del registro durante la edición. Persistencia simulada y aislada.
- 20 regresiones previas del panel aprobadas.
- Lint, TypeScript, compilación de producción y comprobación de espacios aprobados.
- Recorrido manual con Chrome en localhost: captura a 390 px y edición de lead anterior a 320 px, temas claro/oscuro y error de guardado visible. El servidor de la revisión manual bloqueó escrituras reales.

La primera ejecución del recorrido nuevo encontró dos problemas en la propia prueba: confusión del encabezado de la tarjeta móvil con el de la página de detalle antes de terminar la navegación, y selección del anunciador accesible de Next junto con el aviso de conflicto. Se corrigieron los selectores y la espera de URL; el recorrido completo pasó después.

## Revisión

Destino: rama `preview/dashboard-movil`, panel `/admin/leads` de la vista previa existente de Vercel. El acceso conserva la autenticación real. No se insertaron leads ficticios en Supabase ni se certifica una escritura real mediante las pruebas simuladas. Pendiente: revisión del titular en su teléfono con su sesión.
