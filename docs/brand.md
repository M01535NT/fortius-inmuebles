# Fortius Inmuebles — identidad vigente

La marca comercial del producto es **Fortius Inmuebles**. La referencia es el logotipo arquitectónico compartido por el usuario: FORTIUS, portal bicolor en lugar de la O y descriptor REAL ESTATE & INVESTMENTS. Los SVG son una reconstrucción vectorial de la imagen de referencia, sin sus márgenes vacíos.

| Uso | Color |
| --- | --- |
| Azul principal | `#061F3F` |
| Borgoña | `#8A1634` |
| Blanco | `#FFFFFF` |
| Blanco azulado (fondos claros; texto y acento sobre fondos oscuros) | `#F8F8FF` |

**La marca no lleva rosa (titular, 25/10/2026).** El acento es el borgoña. Sobre fondos claros, el texto de acento (etiquetas, enlaces, cifras) es borgoña; sobre fondos oscuros (azul, noche, vino o fotografía) es blanco azulado, porque el borgoña no tiene contraste suficiente para texto ahí y aclararlo lo vuelve rosa. Los rellenos (botones, barras de progreso, indicadores) son borgoña sólido, sin degradados; en tema oscuro las barras usan `#A2223F`.

**Sin crema ni beige (titular, 12/11/2026).** El crema `#F5F1EB` salió del sitio público: fondos, bandas, botones claros y textos sobre oscuro usan el blanco azulado `#F8F8FF`, el mismo lienzo que el panel desde el 11/11. No lo regreses. En el panel, el crema solo queda como texto sobre la barra oscura (`src/app/admin/panel.module.css`).

`BrandMark` comparte la geometría SVG entre cabecera, footer y administración. Sobre fondo claro: letras y portal izquierdo azules, portal derecho borgoña. Sobre fotografía o en tema oscuro, sin placa: letras y portal izquierdo blancos, portal derecho borgoña. Los tonos grises son neutros azulados.

Tipografía (30/10/2026): el sitio público usa Schibsted Grotesk en tres pesos: 400 para leer, 600 para botones, etiquetas y enlaces, y 700 para títulos y cifras. Sin letra comprimida ni ejes de ancho; los pesos intermedios (500, 560, 650) no existen en esta letra y no se usan. El panel conserva Archivo.

### Escala tipográfica del sitio público (titular, 13/11/2026)

Diez niveles con nombre. Los tokens viven en `src/app/globals.css` (`--type-*`, `--leading-*`, `--tracking-*`) y también existen como utilidades de Tailwind (`text-titulo`, `text-seccion`, `text-etiqueta`…). Ningún estilo del sitio debe fijar un `font-size` en px fuera de esta tabla. Los títulos crecen con la pantalla entre el valor de celular y el de computadora; el texto es fijo.

| Nivel | Token | Celular → computadora | Peso | Interlineado / tracking | Uso |
| --- | --- | --- | --- | --- | --- |
| Portada | `--type-portada` | 44 → 80 px | 700 | 1 / −0.035em | Frases de cierre, entrada de Vender, nombres del carrusel de inmuebles del inicio |
| Título de página | `--type-titulo` | 40 → 64 px | 700 | 1.02 / −0.035em | Un título por página, incluido el de la portada con video |
| Título de sección | `--type-seccion` | 30 → 48 px | 700 | 1.05 / −0.03em | Cada bloque dentro de una página |
| Subtítulo | `--type-subtitulo` | 22 → 28 px | 700 | 1.2 / −0.015em | Tarjetas, pasos del método, preguntas |
| Cifra | `--type-cifra` | 28 → 40 px | 700 | 1 / −0.02em, números tabulares | Precios, superficies, plazos |
| Entrada | `--type-entrada` | 18 → 20 px | 400 | 1.55 | La línea que acompaña a un título |
| Texto | `--type-texto` | 16 px | 400 | 1.6 (1.65 en oscuro) | Párrafos y respuestas |
| Interfaz | `--type-interfaz` | 15 px | 600 | 1.4 | Botones, menú, pastillas |
| Detalle | `--type-detalle` | 14 px | 400 | 1.55 | Datos de apoyo |
| Etiqueta | `--type-etiqueta` | 13 px | 600 | 1.45 | Nombres de campo y distintivos; es el mínimo |

Excepciones que conservan su medida: el carrusel de la ficha del inmueble (`.fe-visor*`, `.fe-sheet*`, intocable), el contador y los números de etapa del método del inicio (dependen de la altura de pantalla del movimiento con Scroll Motion), las iniciales grandes de Nosotros y el globo del cursor. En oscuro, los tamaños no cambian; solo el texto largo gana interlineado.

Los maestros están en `public/brand/fortius-{logo,compact,symbol}.svg`, con versiones inversas. `fortius-logo.png` conserva transparencia y se incrusta proporcionalmente en los PDF. El icono usa únicamente el portal y la imagen Open Graph utiliza el logotipo completo sobre azul.

Regeneración: `node tools/generate-fortius-brand.mjs`. PDF estáticos: `python tools/generate-brand-pdfs.py`. Ambos trabajan sin acceso a servicios ni cambios en la base de datos.

## Membrete de Word y PDF

Las nuevas salidas utilizan los gráficos del Plan de negocio aprobado por el titular. Recursos, procedencia y medidas: [membrete](../public/brand/membrete.md). Se comparte el encabezado y el pie entre formatos operativos, avisos, checklists, fichas y reportes; el título cambia según el documento. El cuerpo conserva su contenido y cálculos, con paginación ajustada al espacio del membrete.

Excel queda excluido. Las emisiones archivadas, copias firmadas y archivos originales conservan sus bytes y huellas; el cambio se aplica al generar nuevas salidas. El generador general de PDF estáticos llama al script vigente del checklist para evitar sustituir sus diez preguntas por el contenido histórico del JSON.

Las menciones comerciales guardadas de identidades anteriores se normalizan al presentar el contenido de Inicio. Se conservan las URLs, identificadores existentes, variables FORTIUS_INMUEBLES_*, cookies, RPC y buckets de Supabase, que son contratos técnicos de la aplicación. Los códigos de nuevos inmuebles utilizan el prefijo FORTIUS.

Fortius es la identidad integrada en `main`. Corte documental: 12/10/2026; ver [producto](PRODUCT.md) e [identidad técnica](fortius-inmuebles-identity.md).
