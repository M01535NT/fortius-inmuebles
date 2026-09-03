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
`.superpowers/sdd/implementation-plan/archive-manifest.json`. Los tres
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
