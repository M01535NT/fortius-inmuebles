# COTA: web y panel operativo independientes

Decisión aprobada por el usuario el 2 de septiembre de 2026: web pública y `/admin` son un producto; el panel es su fuente de verdad diaria. `Inmobiliaria-SO` es otro producto. Se autorizó Supabase exclusivo sin contratar servicios de pago y depuración después de verificar la operación.

## Requisitos

- Mantener todas las páginas, campos, funciones y diseño actuales. Incorporar clientes como entidad del panel.
- Persistir inventario, leads, clientes, asesores, calendario, notas, blog, archivos, contenido y configuración en Supabase exclusivo de COTA.
- No usar localStorage/sessionStorage para datos operativos o autenticación. La preferencia de tema sí puede ser local.
- Supabase Auth con cookies HttpOnly y autorización de usuario/membresía en cada operación del servidor; sin contraseña compartida ni registro público de administradores.
- Roles admin/editor pueden operar los datos del producto. Un usuario autenticado sin membresía no obtiene acceso. La membresía no es editable mediante la API general de datos.
- La web muestra únicamente propiedades publicadas, asesores activos y campos publicables de contenido/configuración. Leads, clientes, calendario, notas y archivos privados nunca son anónimamente legibles.
- Escrituras por registro con versión esperada; rechazar con 409 las ediciones obsoletas. Nunca reemplazar una colección entera ni anunciar éxito antes de persistir.
- No copiar/borrar automáticamente datos privados de plataforma o navegadores. Conservarlos para una importación explícita posterior.
- Eliminar accesos cruzados y fallbacks a la plataforma. La plataforma conserva sus otras funciones y código.
- No eliminar la base de la plataforma si se puede crear COTA. El proyecto nuevo ya se creó: `cota-web-panel`, referencia `qkkirjzhviqwvuqjnmei`, Tonala, plan Free.
- Depuración al final: documentación repetida y código sin uso, preservando páginas, funciones y diseño, con archivo e inventario recuperables.

## Contratos

Next.js BFF del mismo origen; Supabase Auth, Postgres y Storage propios. Tabla `cota_records`: colección, identificador estable, documento JSONB validado, versión y fechas. Lista cerrada de colecciones: propiedades, asesores, leads, clientes, eventos, notas, posts, archivos, contenido, config. Los tipos existentes de propiedades/asesores/store se preservan sin perder campos. Propiedades usan slug estable; otras entidades usan id. Singletons usan id `singleton`.

Clientes: id, nombre, teléfono, correo opcional, tipo (propietario/comprador/arrendador/arrendatario/otro), asesorId opcional, notas y fechas. La publicación de una propiedad es explícita y separada del estado comercial. La proyección pública usa lista de campos permitidos y conserva el flag demo/noindex.

Archivos: máximo 20 MB; imágenes raster/PDF/video validados, nombres generados; privados por defecto, públicos solo por elección expresa. Guardar bucket/ruta, no enlaces temporales caducables. Conservar URLs externas existentes.

## Verificación de entrega

1. Credenciales erróneas, anónimo y usuario sin membresía no pueden leer/escribir datos; logout cierra acceso.
2. Crear/editar y recargar conserva los datos; una segunda sesión autorizada ve los mismos registros.
3. Conflictos simultáneos se muestran y no sobrescriben silenciosamente.
4. Publicar/despublicar modifica inventario, detalle y sitemap sin recompilar; se conservan galería, ficha, precio, asesor, documentos, vídeo y 360.
5. Editar contenido/contacto/SEO desde admin modifica la web.
6. Formularios confirman solo después de guardar el lead en COTA, nunca en la plataforma.
7. Clientes y todas las rutas administrativas existentes funcionan en escritorio y móvil; archivos privados siguen privados.
8. Pruebas de API/RLS, lint, TypeScript, build y recorridos reales pasan antes de depurar. No afirmar producción operativa hasta verificar despliegue y acceso real.
