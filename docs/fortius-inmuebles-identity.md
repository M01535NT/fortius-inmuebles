# Identidad Fortius Inmuebles

- Carpeta principal: `C:/Paginas-web/fortius-inmuebles`.
- GitHub privado: `M01535NT/fortius-inmuebles`, ID 1291895344.
- Vercel: `tonala/fortius-inmuebles`, ID `prj_mCgnplUXyiI0YFnL6Fr2zVLmSzJv`, producción desde `main`.
- Sitio: `https://fortius-inmuebles.vercel.app`.
- Supabase: `fortius-inmuebles`, ref `qkkirjzhviqwvuqjnmei`; se conserva la instancia.
- SQL activo: prefijo `fortius_inmuebles_`; Storage: prefijo `fortius-inmuebles-`.
- Variables propias: `FORTIUS_INMUEBLES_*`; las claves de conexión de Supabase conservan sus nombres estándar.

## Corte y recuperación

Antes del corte, conservar respaldo propietario de todas las tablas, inventario de funciones/permisos, Auth, objetos y buckets. El cambio de esquema es una transacción y no modifica los registros. Renombrar funciones primero y reescribir después sus referencias textuales conserva sus OIDs y ACL. Las políticas de Storage se recrean con los mismos roles y predicados, sin cambiar el propietario administrado.

Preparar los buckets mediante API, crear el build de producción sin promover su dominio, aplicar la migración de identidad y promover inmediatamente el build listo. Comprobar lectura pública, autenticación, CRUD privado, RLS y archivos. Retirar el lector temporal y los contenedores anteriores sólo después de verificar el corte. La herramienta de Storage rechaza contenedores con objetos. Los contenedores vacíos son recreables con el inventario previo.

El historial Git, los documentos de evidencia y el SQL de migraciones aplicadas conservan las identidades que tuvieron en su fecha. Las herramientas de restauración mantienen reconocimiento de respaldos anteriores. Las rutas públicas antiguas redirigen al documento actual y la validación sigue rechazando URLs de contenedores privados anteriores. Esas referencias de compatibilidad no son identidad comercial activa; eliminarlas impediría comprobar antecedentes, restaurar respaldos o conservar enlaces y protección de privacidad.

Los nombres de archivo históricos se normalizaron sin modificar el SQL aplicado. Para restaurar un respaldo anterior, usar la revisión Git correspondiente y su secuencia de migraciones; no ejecutar la inversión histórica contra el esquema actual.

Las cookies de sesión y la preferencia local de tema tienen nombres Fortius. Tras publicar el cambio, se requiere iniciar sesión nuevamente; las cuentas y datos permanecen en la misma instancia.

## Leads

La captura se adapta a comprar, rentar, vender o dar en arrendamiento. Comprar muestra presupuesto y financiación; rentar muestra presupuesto mensual; vender y dar en arrendamiento muestran características del inmueble y precio esperado o renta mensual. Al cambiar la operación se eliminan los campos incompatibles. Al editar sin cambiar la operación se conservan los datos anteriores y campos futuros.
