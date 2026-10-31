# Fortius Inmuebles — identidad vigente

La marca comercial del producto es **Fortius Inmuebles**. La referencia es el logotipo arquitectónico compartido por el usuario: FORTIUS, portal bicolor en lugar de la O y descriptor REAL ESTATE & INVESTMENTS. Los SVG son una reconstrucción vectorial de la imagen de referencia, sin sus márgenes vacíos.

| Uso | Color |
| --- | --- |
| Azul principal | `#061F3F` |
| Borgoña | `#8A1634` |
| Blanco | `#FFFFFF` |
| Crema (texto y acento sobre fondos oscuros) | `#F5F1EB` |

**La marca no lleva rosa (titular, 25/10/2026).** El acento es el borgoña. Sobre fondos claros, el texto de acento (etiquetas, enlaces, cifras) es borgoña; sobre fondos oscuros (azul, noche, vino o fotografía) es crema, porque el borgoña no tiene contraste suficiente para texto ahí y aclararlo lo vuelve rosa. Los rellenos (botones, barras de progreso, indicadores) son borgoña sólido, sin degradados; en tema oscuro las barras usan `#A2223F`.

`BrandMark` comparte la geometría SVG entre cabecera, footer y administración. Sobre fondo claro: letras y portal izquierdo azules, portal derecho borgoña. Sobre fotografía o en tema oscuro, sin placa: letras y portal izquierdo blancos, portal derecho borgoña. Los tonos grises son neutros azulados.

Tipografía (30/10/2026): el sitio público usa Schibsted Grotesk en tres pesos: 400 para leer, 600 para botones, etiquetas y enlaces, y 700 para títulos. Escala base de 64, 40, 24, 18 y 14 px; sin letra comprimida ni ejes de ancho. El panel conserva Archivo.

Los maestros están en `public/brand/fortius-{logo,compact,symbol}.svg`, con versiones inversas. `fortius-logo.png` conserva transparencia y se incrusta proporcionalmente en los PDF. El icono usa únicamente el portal y la imagen Open Graph utiliza el logotipo completo sobre azul.

Regeneración: `node tools/generate-fortius-brand.mjs`. PDF estáticos: `python tools/generate-brand-pdfs.py`. Ambos trabajan sin acceso a servicios ni cambios en la base de datos.

## Membrete de Word y PDF

Las nuevas salidas utilizan los gráficos del Plan de negocio aprobado por el titular. Recursos, procedencia y medidas: [membrete](../public/brand/membrete.md). Se comparte el encabezado y el pie entre formatos operativos, avisos, checklists, fichas y reportes; el título cambia según el documento. El cuerpo conserva su contenido y cálculos, con paginación ajustada al espacio del membrete.

Excel queda excluido. Las emisiones archivadas, copias firmadas y archivos originales conservan sus bytes y huellas; el cambio se aplica al generar nuevas salidas. El generador general de PDF estáticos llama al script vigente del checklist para evitar sustituir sus diez preguntas por el contenido histórico del JSON.

Las menciones comerciales guardadas de identidades anteriores se normalizan al presentar el contenido de Inicio. Se conservan las URLs, identificadores existentes, variables FORTIUS_INMUEBLES_*, cookies, RPC y buckets de Supabase, que son contratos técnicos de la aplicación. Los códigos de nuevos inmuebles utilizan el prefijo FORTIUS.

Fortius es la identidad integrada en `main`. Corte documental: 12/10/2026; ver [producto](PRODUCT.md) e [identidad técnica](fortius-inmuebles-identity.md).
