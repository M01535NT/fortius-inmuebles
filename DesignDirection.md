# Design Direction — "El método es la marca" (v2, implementado)

Estado: **vigente e implementado** en el Home. Reemplaza por completo la dirección anterior (NEXO360 oscuro). Fuente de verdad visual del proyecto.

## Concepto

Una firma inmobiliaria que documenta su proceso merece un diseño que se sienta medido, no decorado. La página es **una sola pieza narrativa** (navbar → footer) que lleva al propietario del problema (vender improvisando) a la conversión (evaluar su propiedad), sin secciones-plantilla con título gigante cada 800px.

## Marca (provisional)

- **Nombre:** Cota — la *cota* es la marca de medida exacta en un plano arquitectónico. Precio con datos, proceso medido.
- **Glifo:** línea de acotación (⊢—⊣) en SVG inline, color primario.
- **Wordmark:** "Cota" en display condensado, 19px, tracking 0.04em.
- Alternativas si se descarta: Vértice, Predial, Solar.

## Temas

Dos temas, **claro primario / oscuro secundario**, toggle en navbar (luna/sol), preferencia en `localStorage("cota-theme")` con script anti-flash en `layout.tsx`. Tokens CSS en `globals.css` con `@custom-variant dark`.

## Paleta (familia "Forest": hueso verdoso + esmeralda)

### Claro (default)

- Fondo: `#f4f5f1` · Card: `#fbfbf9` · Texto: `#182019`
- Texto secundario: `#59635b` · Bordes: `rgba(24,32,25,.14)`
- **Primario (firma): esmeralda profundo `#0f6b4e`** (CTA, acentos, rail del timeline)

### Oscuro

- Fondo: `#0c110e` · Card: `#121a15` · Texto: `#ecefe8`
- Texto secundario: `#98a49a` · Bordes: `rgba(236,239,232,.13)`
- **Primario (firma): menta `#3fd8a0`** (texto oscuro encima: `#062016`)

### Bloque manifiesto (igual en ambos temas)

- Claro: `#10241c` · Oscuro: `#163327` (ligeramente más verde que el canvas para que siga leyéndose como bloque)
- Texto: `#edf2ec` · Acento dentro del bloque: `#57e3b3`
- **Regla:** es el ÚNICO bloque de color de la página. No agregar más inversiones de tema por sección.

## Tipografía

- **Display:** Archivo Variable, eje de anchura condensado.
  - `.display-title` → wdth 68, weight 680, uppercase, leading 0.94 (titulares fuertes)
  - `.display-soft` → wdth 82, weight 560, sin uppercase (declaraciones editoriales, nombres de documento)
- **Body/UI:** Archivo a anchura normal (wdth 100).
- **Mono:** IBM Plex Mono 400/500 — SOLO códigos de documento, numeración de fases/pasos. Racionado.
- Cargadas con `next/font` (`--font-archivo`, `--font-plex`). **Nunca** fuentes hotlinkeadas.

## Layout

- Contenedor `max-w-[1280px]`, padding lateral 20/32px.
- Radios: 2–8px (`--radius-*`). Nada de tarjetas globo.
- Sombras: ninguna decorativa; jerarquía con bordes hairline, color y espacio.
- Asimetría con disciplina: indentaciones editoriales (relato), columnas 4/7 con gap de columna vacía (método, respuestas), sticky column (método).
- **Prohibido:** eyebrows uppercase sobre cada título, tres cards iguales, secciones espejo repetidas, títulos centrados con subtítulo como plantilla.
- Familias de layout usadas (no repetir): hero full-bleed · declaración indentada · bloque de color split 7/4 · sticky + timeline · grid de documentos 3×2 · split acordeón · banda marquee · split formulario.

## Modos de motion (pivote rápido)

`src/data/motion-config.ts` define `MOTION_MODE: "espectacular" | "equilibrado"`. Cambiar UNA constante pivota el sitio:

| Pieza | Espectacular | Equilibrado |
|---|---|---|
| Hero H1 | Reveal por líneas (máscara) + CTA magnético | Entrada fade+y simple |
| Hero fondo | Parallax al scroll | Sin parallax |
| Relato | TextReveal (palabras que se iluminan al scroll) | BlurFade |

Constantes en ambos modos: KineticTitle en títulos de sección, tilt 3D + spotlight en cards de entregables, parallax interno en las fotos de segmentos, banda de zonas doble contra-rotante en tipo outline (se rellena al hover), manifiesto con blur+lift, BorderBeam único en el formulario, NumberTicker en calculadoras, compromisos con hairlines que crecen. Mobile y `prefers-reduced-motion` reciben SIEMPRE la variante tranquila. **GSAP prohibido: solo Motion**.

**Decisión 7-jul-2026:** el Método horizontal pinned (scroll-hijack) se construyó, se probó y **se descartó** por feedback del usuario; el Método es SIEMPRE vertical con rail de progreso. No reintroducir scroll-hijack en esa sección.

Nota de implementación: el clip-path reveal en wrappers de sección no disparó con `whileInView`/`useInView` en este setup (el wrapper conserva el estilo inicial aunque el observer manual intersecta); usar BlurFade con parámetros dramáticos para reveals de bloque.

## Motion (Motion / motion-react)

- Entradas: BlurFade / fade+y con ease `[0.16,1,0.3,1]`, 0.45–0.7s, stagger corto.
- Hero: crossfade de imágenes cada **8s** + Ken Burns (`.kenburns`, scale 1.02→1.12 en 9.5s). Indicadores de slide funcionales (barras clicables).
- Método: línea de progreso vertical con `useScroll` + `useSpring` (origin-top, scaleY).
- Navbar: transparente sobre hero (texto claro fijo) → sólida con blur al scroll (>24px, tokens del tema).
- **Siempre** `useReducedMotion` + bloque global `prefers-reduced-motion` en CSS.
- No usar `window.addEventListener("scroll")` ni animar layout (solo transform/opacity).

## Imágenes

- Renders provisionales en `public/hero/*.png` (casa-playa, edificio-ciudad, interior-depa, plaza, nave-tijuana). Reemplazar por fotografía real de inventario cuando exista.
- Siempre `next/image` con `sizes`; `priority` solo el primer slide del hero.
- Scrim del hero: gradiente `#0b120e` 85→30→10% para contraste AA del copy en ambos temas.
- No usar imágenes que aparenten inventario disponible que no existe.

## Accesibilidad

- Contraste AA mínimo en ambos temas (verificado en CTAs, nav sobre foto, bloque verde).
- Labels visibles sobre los inputs, microcopy de privacidad, estado de éxito del form.
- `:focus-visible` con anillo `--ring`. Touch targets ≥ 44px. `min-h-[100dvh]`, nunca `h-screen`.

## Inventario De Componentes (Home)

`src/components/home/`: site-nav · theme-toggle · hero · relato · metodo · entregables · respuestas · zonas · evaluar · site-footer.
MagicUI en uso: `blur-fade`, `marquee` (los no usados fueron eliminados).

## Estado (6-jul-2026)

- Páginas interiores alineadas al sistema: navbar/footer globales, `InteriorPage`/`DiagnosticCTA`/`ContactForm`/`PropertyCard` rediseñados con tokens y display type. La vibe interior es más calmada (sin foto, la tipografía carga la página) pero es el mismo sistema.
- Favicon (`src/app/icon.svg`) y OG image (`src/app/opengraph-image.png`) con el glifo Cota listos.
- Imágenes en WebP. Deuda restante: fotografía real y rediseño a fondo de `/inventario` cuando exista inventario real.
