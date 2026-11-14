# Fortius Inmuebles — identidad vigente

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

### Escala tipográfica del panel (titular, 13/11/2026)

Archivo en anchura 96 (92 en títulos, 62 en cifras) y cuatro grosores: 620 títulos y cifras, 600 secciones, 540 nombres y pastillas, 400 texto. Las clases de Tailwind `font-medium` y `font-semibold` se pintan en 540 y `font-bold` en 600 dentro del panel (`panel-uplift.css`). Tamaños fijos (tokens `--admin-text-*` en `src/app/admin/panel-base.css`, que solo descarga el panel); coinciden con `text-xs`…`text-xl` de Tailwind, y hay dos utilidades propias: `text-pantalla` y `text-cifra-panel`.

| Nivel | Token | Tamaño | Peso | Uso |
| --- | --- | --- | --- | --- |
| Título de pantalla | `--admin-text-pantalla` | 30 px (26 en celular) | 620 | Uno por pantalla |
| Sección | `--admin-text-seccion` | 20 px | 600 | Bloques de una ficha |
| Grupo | `--admin-text-grupo` | 18 px | 600 | Tarjetas y grupos de campos |
| Texto y campos | `--admin-text-cuerpo` | 16 px | 400 | Lo que se escribe y se lee |
| Botones y pestañas | `--admin-text-interfaz` | 15 px | 540 | Todo lo que se pulsa |
| Detalle | `--admin-text-detalle` | 14 px | 400 | Datos en listas, ayudas |
| Pastilla | `--admin-text-pastilla` | 13 px | 540 | Estados, fechas |
| Mínimo | `--admin-text-minimo` | 12 px | 600 | Contadores, atajos |
| Cifra | `--admin-text-cifra` | 30 px, anchura 62 | 620 | Fechas del calendario, número de documento |
| Calificación grande | `--admin-text-cifra-grande` | 72 → 152 px, anchura 62 | 620 | La calificación de la operación |

### Paleta del panel (rediseño del 14/11/2026; reemplaza RP-70 y LV-01)

Cuatro capas, todas en `src/app/admin/panel-base.css` bajo `.admin-root` y `.dark .admin-root`:

- **Grises con tinte del azul de la marca:** 50 `#F8F8FF` (lienzo), 100 `#ECF0F7` (relleno suave y opción seleccionada), 200 `#DEE3EC` (líneas y bordes de tarjeta), 300 `#C9D0DB`, 400 `#959FAE`, 500 `#647080` (borde de campo, 4.8:1), 600 `#49566A` (texto secundario, 7.0:1), 700 `#3A485E`, 800 `#1F314A`, 900 `#061F3F` (texto).
- **Marca:** azul `#061F3F` para texto y lo terminado; borgoña `#8A1634` solo para la acción principal y la etapa actual; borgoña presionado `#74112B`. El borgoña nunca es texto.
- **Oscuro en tres capas:** noche `#060C14` (lienzo), superficie `#0C1724` (tarjetas), elevado `#1A2331` (rellenos y selección), línea `#293342`; texto `#F8F8FF` y secundario `#B0B8C4`. En oscuro la etapa actual va en `#F8F8FF`.
- **Esquinas y sombras:** 10 px controles, 12 px tarjetas, 14 px bloques grandes; sin sombra en reposo, la profundidad la dan el tono y una línea.

Retirados: `#A2223F` (borgoña de barras en oscuro) y el azul noche `#0B1828` del panel; el `#EDF2F8` de selección pasa a `#ECF0F7`. Los colores fijos que quedaban (círculos de persona `#DBE4F0`, chips activos en `#061F3F`) usan los tokens.

#### Colores de estado

Cinco colores con significado fijo, siempre acompañados de ícono y palabra. Cada uno tiene texto, superficie y borde (`--x`, `--x-surface`, `--x-border`) en claro y oscuro, y existen como utilidades de Tailwind (`text-success`, `bg-info-surface`…). Ningún otro color comunica estado.

| Papel | Token | Claro (texto / superficie / borde) | Oscuro (texto / superficie / borde) | Uso |
| --- | --- | --- | --- | --- |
| Acción | `--primary` | `#8A1634` | `#8A1634` (relleno), texto `#F8F8FF` | Acción principal y etapa actual |
| Información | `--info` | `#1E5BA1` / `#EAF5FF` / `#B7D4F9` | `#92C1FD` / `#15273E` / `#274367` | Ligas, foco, agenda y visitas |
| Listo | `--success` | `#1A763F` / `#E5FAEA` / `#AFDFBB` | `#7FD497` / `#142D1B` / `#224D2F` | Revisado, completo |
| Atención | `--warning` | `#9C5400` / `#FFEFDC` / `#FBC99E` | `#F4B768` / `#37250D` / `#5C3E14` | Lo que necesita atención |
| Vencido o error | `--destructive` (alias `--alert`) | `#B6341F` / `#FFECE7` / `#FBC1B5` | `#FA8978` / `#401D18` / `#69332A` | Vencido, error, eliminar |

Todos pasan AA (4.5:1 o más) sobre tarjeta, fondo y su propia superficie. El bermellón de «vencido» se separa del borgoña por tono y porque nunca rellena un botón.

#### Estructura del panel (14/11/2026)

- **Menú lateral** (reemplaza la barra superior de LV-08): buscador, «Nuevo», los seis módulos, Herramientas y, para el director, Administración; la cuenta abajo. De 768 a 1279 px se recoge a íconos; en celular sigue la barra inferior.
- **Hoy:** saludo con una frase que dice lo vencido, lo de hoy y lo de la semana; «Tu día» en una tarjeta (lo siguiente destacado y lo demás en «Vencido» y «Por atender»); a la derecha «Hoy» y «Esta semana».
- **Una operación** (reemplaza el panel azul de LV-06): encabezado claro con quién es, la etapa actual y el riel de las diez etapas. Listas en tinta, con algo pendiente en ámbar, la actual en borgoña y lo que falta en gris. La lista de Operaciones usa el mismo riel en cada fila.

### Íconos, estados y avance del panel (LV-02, titular, 13/11/2026)

Un solo catálogo en `src/components/admin/icons.tsx`, el mismo en todas las pantallas:

- **Etapas del propietario:** Primer contacto teléfono, Entrevista inicial conversación, Levantamiento regla, Lista de documentos portapapeles, Dictamen jurídico escudo, Opinión de valor monedas, Contrato hoja con lápiz, Publicación megáfono, Visitas y ofertas ojo, Cierre y entrega llave (`OWNER_STAGE_ICONS`, `stageIcon`). Las demás rutas usan `ROUTE_STAGE_ICONS`.
- **Documentos:** cada formato usa el ícono de la etapa que lo deja; los demás tienen el suyo (`docIcon`): 01 candado, 05 hoja con lupa, 08 calculadora, 14 mano con dinero, 15 hoja con estrella, 18 cartera, 19 martillo, 20 casa.
- **Estado de un requisito:** forma, color y palabra. Pendiente círculo vacío, Lo tengo medio lleno (azul), Revisado lleno con palomita (verde), Hay un problema triángulo (ámbar), No aplica punteado con raya.
- **Avance:** anillo con «6 de 10» (`ProgressRing`); se llena en azul marino y al completarse queda verde con palomita. Nunca usa el rojo.
- **Documento:** distintivo `DocBadge` Borrador neutro, Revisado azul, Aprobado y Firmado verdes. «Terminado · PDF» lo dice el texto del renglón.
- **Persona:** un solo círculo neutro con iniciales (`Avatar`, `onDark` sobre el azul).

### Ayuda y estados vacíos del panel (LV-04, titular, 13/11/2026)

- **«?» de una línea** (`Hint`): junto a un título o botón que pueda generar duda; abre una sola línea debajo y se cierra al pulsar otra vez o con Escape. Hoy está en «Documentos de la etapa», «Antes de seguir, confirma» y «Autorizar excepción».
- **Punto «Empieza aquí»** (`StartHere`): sobre «Nuevo». Late tres veces y la etiqueta se oculta a los cinco segundos; el punto queda hasta que la persona lo pulsa y se recuerda por usuario en ese navegador. Con «reducir movimiento» no late.
- **Estados vacíos** (`EmptyBox` con `art`): el objeto de la pantalla (`EMPTY_ART`) sobre una placa, con insignia según el caso: «+» aún no hay nada, palomita verde todo hecho, lupa sin resultados, flecha para subir. Sin dibujos a mano ni escenas.

Las medidas y colores del panel (esquinas de 10/12/20/24 px, sombras, superficies) viven en `src/app/admin/panel-base.css` bajo `.admin-root`; `panel.module.css` ya no las define. El sitio público no descarga ese archivo ni las utilidades de Tailwind que solo usa el panel, y Archivo solo se precarga en `/admin`.

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

Fortius es la identidad integrada en `main`. Corte documental: 12/10/2026; ver [producto](PRODUCT.md) e [identidad técnica](fortius-inmuebles-identity.md).
