# COTA

COTA es un producto inmobiliario independiente: su sitio público y `/admin`
comparten este repositorio y un backend dedicado. El panel es la fuente
operativa de propiedades, clientes, leads, asesores, calendario, notas, blog,
archivos, contenido y configuración. La publicación, despublicación y sitemap
se actualizan desde ese backend sin una nueva compilación.

## Inicio local

1. Copia `.env.example` como `.env.local` y completa únicamente los valores de
   la instancia dedicada de COTA: URL pública, clave anónima y clave de servicio
   solo para servidor.
2. Aplica las migraciones de `supabase/migrations` al proyecto dedicado.
3. Crea el usuario de administración en Supabase Auth y su membresía activa en
   `cota_staff`; no se concede acceso por correo ni por datos del navegador.
4. Ejecuta `npm install` y `npm run dev -- --hostname 127.0.0.1 --port 3000`.

Nunca confirmes ni publiques `.env.local`; la clave de servicio no debe usar un
prefijo `NEXT_PUBLIC_` ni llegar al navegador. El sitio público expone solo la
proyección publicada y los archivos privados se entregan con autorización del
panel.

## Verificación

`npm test` ejecuta las suites offline de backend y panel. Para completar la
verificación local:

```text
npm run lint
npx tsc --noEmit
npm run build
npm run test:admin:browser
```

La comprobación live es deliberadamente independiente porque crea y elimina sus
propios datos de prueba en el proyecto dedicado:

```text
node --env-file=.env.local tests/live/verify-cota.mjs --run --web
```

No se debe ejecutar contra otro proyecto ni incluirse en `npm test`.

## Actualización de concurrencia (migración002)

`supabase/migrations/202609030002_cota_record_revisions.sql` se aplica después de
001, sin modificarla. La tabla privada `cota_record_revisions` conserva únicamente
colección, identificador y última revisión, incluso después de borrar el registro.
No conserva contenido eliminado. Un trigger asigna la siguiente revisión en cada
INSERT/UPDATE; ni RPC directo ni un INSERT privilegiado pueden reiniciarla.
Las versiones siguen siendo números enteros positivos seguros para JavaScript;
al agotarse ese rango la escritura falla, no se redondea ni reinicia.

La actualización bloquea escrituras durante el backfill y conserva JSON, fechas,
versiones actuales y borradores abiertos válidos. Anónimo, miembros, no miembros
y `service_role` no tienen acceso directo al ledger; los triggers son funciones
privilegiadas de búsqueda cerrada sin ejecución pública. Los grants/RLS de001,
validación, creación exclusiva y guards de referencias no cambian. Todos los DML
de registros toman el lock de001 antes de bloquear filas, evitando inversión de
locks entre INSERT duplicado, UPDATE y el ledger. Esta serialización global es
deliberada para este panel; no es una promesa de rendimiento masivo.

**Corte histórico:**001 no guardaba revisiones de IDs borrados antes de002. No es
posible reconstruirlas desde filas ausentes. Antes de aplicar, el controlador debe
verificar que no quedan borradores operativos de esos IDs eliminados; en este
proyecto inicial se ha confirmado que ese historial es solo QA desechable. Si esa
condición no se cumple en otra instancia, detener el despliegue y usar un contrato
de token/época, no afirmar protección retroactiva ni purgar datos por inferencia.
La garantía duradera cubre las filas presentes al corte y su vida posterior, más
todos los registros creados después. Nunca limpiar el ledger al borrar contenido.

Orden: revisión independiente del SQL y hash → aplicación exclusiva al proyecto
COTA con rol migrador → regresión opt-in → publicación del código. No revertir002
retirando triggers o borrando revisiones. La regresión adicional usa solo fixtures
propios y requiere confirmar explícitamente que002 ya fue aplicada:

```text
node --env-file=.env.local tests/live/verify-cota.mjs --run --revisions --migration-002-applied
```

Los formularios públicos permanecen bloqueados en el HTML inicial y hasta que
React instala el manejador; sin JavaScript se informa que no se envió nada. Los
errores conservan los campos y la confirmación/descarga espera el ACK del BFF.
El campo trampa `website` viaja en ese mismo POST y no es enfocable ni autocompletable.

## Alcance actual del blog

El panel conserva alta, edición, borrado y los campos de las entradas. El estado
`publicado` expone sus campos permitidos mediante la proyección pública, sin
autenticación; no es un borrador privado. No existen páginas `/blog` ni páginas
individuales de entradas. Guardar ese estado no crea una URL web; el slug sigue
siendo un identificador editorial.

## Guardrails de producto y diseño

Se conservan Archivo/Plex, las dos apariencias, la marca original Cota, el
tratamiento vertical de “Método”, la hidratación segura de movimiento reducido
y el recorte de desbordes de animación. No hay dependencia de localStorage,
sesiones de demostración ni plataforma externa como origen operativo.

## Archivo recuperable

Los 20 archivos históricos aprobados y el seeder de preservación de una sola
vez se copiaron, verificaron por SHA-256 y después se retiraron de sus rutas
exactas. El archivo está en
`C:\Paginas-web\_archivo\COTA-20260903`; el inventario de restauración
versionado está en
`docs/archive/COTA-20260903-manifest.json`, con una copia inmutable
`MANIFEST.json` y las instrucciones `RESTORE.md` dentro del archivo. Los tres
snapshots públicos que el seeder necesitaba permanecen en el espacio activo de
plan y también tienen copia archivada. Para recuperar un archivo, comprueba su
hash del manifiesto y cópialo de vuelta a su ruta relativa; no uses borrados
recursivos.

La investigación que sustentó el estimador de cierre quedó como antecedente
histórico archivado, no como fuente jurídica o fiscal vigente.

## Pendiente fuera de este cambio

El contenido, contactos y propiedades actuales son demostrativos hasta que la
operación los sustituya por datos reales. Falta publicar el despliegue e invitar
formalmente a la administración; esas acciones no se ejecutan desde esta
limpieza.
