# Marca del sitio público

Es la identidad que usa hoy fortiusinmuebles.com. El panel no la usa: sigue su propio boceto (ver `SPEC.md`). El sitio conserva esta marca hasta que el titular pida cambiarla.

**Sitio público:** desde el 17/11/2026 usa la marca Fortius II, descrita en [`docs/sitio/DECISIONS.md`](sitio/DECISIONS.md). Lo de abajo sigue valiendo para el panel, los PDF y el membrete.

La marca comercial del producto es **Fortius Inmuebles**. La referencia es el logotipo arquitectónico compartido por el usuario: FORTIUS, portal bicolor en lugar de la O y descriptor REAL ESTATE & INVESTMENTS. Los SVG son una reconstrucción vectorial de la imagen de referencia, sin sus márgenes vacíos.

| Uso | Color |
| --- | --- |
| Azul principal | `#061F3F` |
| Borgoña | `#8A1634` |
| Blanco | `#FFFFFF` |
| Blanco azulado (fondos claros; texto y acento sobre fondos oscuros) | `#F8F8FF` |

Tema oscuro del sitio público (no son colores de marca impresos; solo pantalla):

| Uso | Color |
| --- | --- |
| Noche (fondo de página) | `#060C14` |
| Azul noche (bandas alternas: cabeceras de página, «Cinco etapas», «Haz números», preguntas, llamada final; equivale al blanco azulado del tema claro) | `#0B1828` |
| Superficie (tarjetas; la misma del panel desde el 14/11/2026) | `#0C1724` |
| Elevado (campos, menús, chips) | `#1A2331` |

**Bandas en oscuro (titular, 13/11/2026).** El tema oscuro alterna noche y azul noche como el claro alterna blanco y blanco azulado, para que se vea dónde empieza cada sección. Las preguntas del inicio siguen el tema (en oscuro ya no son una banda blanca). Sin resplandores ni degradados vino: salieron el halo detrás de «Cinco etapas», el de las cabeceras de página, Nosotros y la ficha, y el degradado de la etapa activa (ahora borgoña sólido). Se conserva el fondo propio del visor de ficha técnica dentro del carrusel de la ficha, que no se toca.

**La marca no lleva rosa (titular, 25/10/2026).** El acento es el borgoña. Sobre fondos claros, el texto de acento (etiquetas, enlaces, cifras) es borgoña; sobre fondos oscuros (azul, noche, vino o fotografía) es blanco azulado, porque el borgoña no tiene contraste suficiente para texto ahí y aclararlo lo vuelve rosa. Los rellenos (botones, barras de progreso, indicadores) son borgoña sólido, sin degradados. En oscuro las barras no usan un borgoña aclarado: la etapa actual del panel y las barras de avance del sitio van en `#F8F8FF` (14/11/2026).

**Paleta del panel en el sitio público (titular, 14/11/2026).** El sitio usa los mismos tonos que el panel: borgoña presionado `#74112B` en todos los botones (salen `#70112A` y `#A2223F`), superficie `#0C1724` y elevado `#1A2331` en oscuro, ámbar `#9C5400` / `#F4B768` para lo pendiente y bermellón `#B6341F` / `#FA8978` para errores (sale el amarillo `#FFD236`). Las bandas alternas en azul noche `#0B1828` se quedan.

**Sin crema ni beige (titular, 12/11/2026).** El crema `#F5F1EB` salió del sitio público: fondos, bandas, botones claros y textos sobre oscuro usan el blanco azulado `#F8F8FF`, el mismo lienzo que el panel desde el 11/11. No lo regreses. Desde el 13/11/2026 tampoco queda en el panel: el texto de acento y la opción seleccionada del panel oscuro usan `#F8F8FF`, y la opción seleccionada del panel claro es azul muy diluido (`#ECF0F7` desde el 14/11), no rosado. El rosa `#E8A0B2` del método del inicio en oscuro y el beige de Vender y de la portada editorial también salieron.

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

### Espacios, botones y esquinas del sitio público (titular, 13/11/2026)

- **Espacios:** ocho pasos, múltiplos de 4 px: `--space-junto` 4, `--space-corto` 8, `--space-cerca` 12, `--space-normal` 16, `--space-amplio` 24, `--space-bloque` 32, `--space-grupo` 48 y `--space-seccion` 72 → 112 px entre secciones. No uses márgenes de 6, 10, 14, 18 o 20 px.
- **Botones:** 48 px (`--control-normal`) y 56 px (`--control-grande`) para la acción final de una ficha o formulario. Se conserva la esquina en forma de hoja de los botones del inicio al pasar el cursor.
- **Campos:** 48 px, la misma altura y esquina que el botón de al lado.
- **Esquinas:** tres medidas: `--corner-pulsable` 4 px (botones, campos, distintivos), `--corner-tarjeta` 8 px (tarjetas, fotos, cajas) y `--corner-pastilla` (redonda). El carrusel de la ficha conserva las suyas.

Los maestros están en `public/brand/fortius-{logo,compact,symbol}.svg`, con versiones inversas. `fortius-logo.png` conserva transparencia y se incrusta proporcionalmente en los PDF. El icono usa únicamente el portal y la imagen Open Graph utiliza el logotipo completo sobre azul.

Regeneración: `node tools/generate-fortius-brand.mjs`. PDF estáticos: `python tools/generate-brand-pdfs.py`. Ambos trabajan sin acceso a servicios ni cambios en la base de datos.

## Membrete de Word y PDF

Las nuevas salidas utilizan los gráficos del Plan de negocio aprobado por el titular. Recursos, procedencia y medidas: [membrete](../public/brand/membrete.md). Se comparte el encabezado y el pie entre formatos operativos, avisos, checklists, fichas y reportes; el título cambia según el documento. El cuerpo conserva su contenido y cálculos, con paginación ajustada al espacio del membrete.

Excel queda excluido. Las emisiones archivadas, copias firmadas y archivos originales conservan sus bytes y huellas; el cambio se aplica al generar nuevas salidas. El generador general de PDF estáticos llama al script vigente del checklist para evitar sustituir sus diez preguntas por el contenido histórico del JSON.

Las menciones comerciales guardadas de identidades anteriores se normalizan al presentar el contenido de Inicio. Se conservan las URLs, identificadores existentes, variables FORTIUS_INMUEBLES_*, cookies, RPC y buckets de Supabase, que son contratos técnicos de la aplicación. Los códigos de nuevos inmuebles utilizan el prefijo FORTIUS.

Fortius es la identidad integrada en `main`. Corte documental: 12/10/2026; ver [identidad técnica](/docs/operacion/identidad-tecnica.md).
