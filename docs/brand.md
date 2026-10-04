# Fortius — identidad de la alternativa

La marca comercial de esta rama es **Fortius Inmuebles**. La F, las letras RTIUS y el descriptor REAL ESTATE & INVESTMENTS conservan la geometría del logotipo original. La O es ahora un símbolo de toro minimalista, con un aro y dos cuernos, inspirado en la referencia compartida por el usuario.

| Uso | Color |
| --- | --- |
| Azul principal | `#061F3F` |
| Borgoña | `#8A1634` |
| Blanco | `#FFFFFF` |
| Acento sobre fondos oscuros | `#E5829B` |

`BrandMark` comparte la geometría SVG entre cabecera, footer y administración. La versión inversa utiliza letras blancas y borgoña claro para conservar contraste sobre fotografía o azul. En modo oscuro los enlaces usan borgoña claro; sobre blanco usan borgoña oscuro. Los tonos grises son neutros azulados.

Los maestros están en `public/brand/fortius-{logo,compact,symbol}.svg`, con versiones inversas. `fortius-logo.png` conserva transparencia y se incrusta proporcionalmente en los PDF. El icono usa únicamente la O con cuernos y la imagen Open Graph utiliza el logotipo completo sobre azul.

Regeneración: `node tools/generate-fortius-brand.mjs`. PDF estáticos: `python tools/generate-brand-pdfs.py`. Ambos trabajan sin acceso a servicios ni cambios en la base de datos.

Las menciones comerciales guardadas de Mint y MNT se normalizan al presentar el contenido de Inicio. Se conservan las URLs, identificadores existentes, variables MNT_*, cookies, RPC y buckets de Supabase, que son contratos técnicos de la aplicación. Los códigos de nuevos inmuebles utilizan el prefijo FORTIUS.

La alternativa se prueba en `alternativa-fortius`; la rama main conserva su diseño y marca hasta una integración solicitada.
