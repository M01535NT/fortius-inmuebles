# Fortius Inmuebles — identidad vigente

La marca comercial del producto es **Fortius Inmuebles**. La referencia es el logotipo arquitectónico compartido por el usuario: FORTIUS, portal bicolor en lugar de la O y descriptor REAL ESTATE & INVESTMENTS. Los SVG son una reconstrucción vectorial de la imagen de referencia, sin sus márgenes vacíos.

| Uso | Color |
| --- | --- |
| Azul principal | `#061F3F` |
| Borgoña | `#8A1634` |
| Blanco | `#FFFFFF` |
| Acento de interfaz sobre fondos oscuros (nunca en el logo) | `#E5829B` |

`BrandMark` comparte la geometría SVG entre cabecera, footer y administración. La versión inversa utiliza letras blancas y conserva el borgoña `#8A1634` en el portal; el logo nunca usa borgoña claro. En modo oscuro los enlaces usan borgoña claro; sobre blanco usan borgoña oscuro. Los tonos grises son neutros azulados.

Los maestros están en `public/brand/fortius-{logo,compact,symbol}.svg`, con versiones inversas. `fortius-logo.png` conserva transparencia y se incrusta proporcionalmente en los PDF. El icono usa únicamente el portal y la imagen Open Graph utiliza el logotipo completo sobre azul.

Regeneración: `node tools/generate-fortius-brand.mjs`. PDF estáticos: `python tools/generate-brand-pdfs.py`. Ambos trabajan sin acceso a servicios ni cambios en la base de datos.

Las menciones comerciales guardadas de identidades anteriores se normalizan al presentar el contenido de Inicio. Se conservan las URLs, identificadores existentes, variables FORTIUS_INMUEBLES_*, cookies, RPC y buckets de Supabase, que son contratos técnicos de la aplicación. Los códigos de nuevos inmuebles utilizan el prefijo FORTIUS.

Fortius es la identidad integrada en `main`. Corte documental: 12/10/2026; ver [producto](PRODUCT.md) e [identidad técnica](fortius-inmuebles-identity.md).
