# Plan: Motion v4 — "Espectacular de verdad" con GSAP (EJECUTADO 7-jul-2026)

Estado: **implementado y verificado**. El Home se anima con GSAP (ScrollTrigger + SplitText); decisiones firmes cumplidas: hero con **cascada por letra**, animaciones **repetibles** al re-scrollear. Los primitivos viven en `src/components/gsap/` con registro único en `src/lib/gsap.ts`. Nota post-ejecución: los `useReducedMotion` de motion/react que cambian markup se sustituyeron por `useReducedMotionSafe` (`src/lib/use-reduced-motion-safe.ts`) para evitar errores de hidratación bajo `prefers-reduced-motion`.

## Contexto

Tras dos pases de motion con Motion/MagicUI el Home sigue sin sentirse un motionsite: todo era `once:true` con distancias tímidas, casi nada ligado al scroll, sin momentos tipográficos grandes ni transiciones entre secciones.

Alcance: hero (solo el texto) + TODO desde "Papeles, no promesas" hacia abajo, hasta el footer.

Restricciones: `prefers-reduced-motion` → estático; mobile ligero; solo `transform`/`opacity`; Método vertical intocable; 1 bloque de color por página; tokens de ambos temas; sin em-dashes en copy nuevo.

## 0. Base técnica GSAP

- Dependencias nuevas: `gsap` + `@gsap/react`. Todos los plugins (SplitText, ScrollTrigger, ScrollSmoother…) son gratuitos desde GSAP 3.13.
- Patrón en componentes cliente: hook `useGSAP(() => {...}, { scope })` (cleanup automático de tweens/ScrollTriggers).
- `gsap.registerPlugin(ScrollTrigger, SplitText)` una sola vez (módulo `src/lib/gsap.ts`).
- `gsap.matchMedia()` para tres contextos: desktop completo, mobile ligero (`<768px`: derivas a la mitad o off), `prefers-reduced-motion: reduce` → sin animación (estado final directo).
- Repetible = ScrollTrigger `toggleActions: "restart none none reverse"` (o timelines con `scrub`) en todas las secciones del alcance, salvo hero y campos del formulario (`once`). `start: "top 75%"` aprox (equivale a `amount: 0.25`).
- Scrubs: `scrub: true` + `will-change: transform` en las capas afectadas.
- Motion (motion-react) no se toca en interiores; en el Home, los componentes migrados dejan de usarlo.

## 1. Primitivos nuevos (`src/components/gsap/`)

1. **`split-heading.tsx`** — título por caracteres con el plugin **SplitText** (`type: "chars, words"`, palabras con `whitespace-nowrap`). Cada letra: stagger ~35ms, `yPercent: 110→0`, `rotate: 10→0`, `blur 8px→0` (filter solo en la entrada). Props: `text`, `as`, `className`, `once`. Sustituye a KineticTitle en títulos de sección y en el H1 del hero.
2. **`reveal.tsx`** — reveal dramático y repetible (reemplaza BlurFade en el Home): props `distance` (default 90px), `direction`, `rotate`, `scale`, `blur`, `delay`; ease `expo.out` (~`[0.16,1,0.3,1]`), dur 0.9, `toggleActions: "restart none none reverse"` para volver al estado inicial al salir del viewport.
3. **`velocity-marquee.tsx`** — marquee infinito (helper `horizontalLoop` de GSAP) cuya velocidad/dirección reaccionan al scroll vía `ScrollTrigger` + `getVelocity()` mapeado a `timeScale`. Sustituye al CSS marquee SOLO en zonas.
4. **`scrub.tsx`** — wrapper scroll-linked genérico: `ScrollTrigger` con `start: "top bottom"`, `end: "bottom top"`, `scrub: true` y transforms configurables (y/x/rotate/scale).

KineticTitle y BlurFade (Motion) se conservan para interiores.

## 2. Hero — cascada por letra (solo el texto)

H1 con `SplitHeading` `once` (la entrada de página no se repite): "Vende con plan," / "no con anuncios." en cascada por letra con blur+rotación. Subtítulo y CTAs entran tras la cascada (~0.9s) en el mismo timeline. Parallax, rotador, barras y CTA magnético intactos.

## 3. Coreografía por sección (arriba → abajo)

- **3.1 Entregables** — contenedor `relative overflow-hidden` con **watermark `EXPEDIENTE`** en display outline (~180px, opacity baja) derivando en x con scrub (−6%→6%). Título → SplitHeading. Cards con `Reveal` (y 100, rotate ±3°, scale 0.92, blur, stagger 80ms); tilt+spotlight encima. Hover: código mono se desliza, icono rota 6°.
- **3.2 Destacadas** — Título SplitHeading. Cards `Reveal` + cada card en `Scrub` con y diferencial por columna (−24/−56/−24px): el grid respira.
- **3.3 Segmentos** — parallax interno ±9%→±14%; columnas a velocidades opuestas (grande +30px / derecha −30px); hover: título sube revelando flecha verde; entradas Reveal desde los lados.
- **3.4 Respuestas** — Título SplitHeading. Items alternando desde los lados (Reveal left/right, stagger). Apertura real con grid `[0fr]→[1fr]` + rotación del Plus.
- **3.5 Herramientas** — Título SplitHeading. Tiles con **flip 3D** (rotateY 24°→0 + perspective), stagger. Hover existente.
- **3.6 Zonas** — migrar las dos filas a `VelocityMarquee` (velocidad opuesta por fila; el scroll acelera/invierte). Outline→relleno al hover se conserva.
- **3.7 Compromisos** — Título SplitHeading. Filas: hairline creciente repetible + iluminación muted→foreground al cruzar el centro. Números con pop.
- **3.8 Evaluar** — Título SplitHeading. Los 3 pasos en cascada con número pop; línea vertical que se dibuja (scaleY scrub). Campos con stagger `once` (zona de conversión). BorderBeam se queda.
- **3.9 Footer cortina** — `site-footer` fijo detrás (`sticky bottom-0 z-0`), `main` con `bg-background z-10`; la última sección se desliza sobre él revelándolo. Solo CSS, ambos temas, mobile igual.

## 4. Archivos

```
NUEVOS: src/lib/gsap.ts · src/components/gsap/{split-heading,reveal,velocity-marquee,scrub}.tsx
EDITAR: src/components/home/{hero,entregables,destacadas,segmentos,respuestas,
  herramientas,zonas,compromisos,evaluar,site-footer}.tsx ·
  src/app/globals.css (watermark, acordeón grid-rows, outline) ·
  DesignDirection.md · .claude/napkin.md · tasks.md
DEPENDENCIAS NUEVAS: gsap, @gsap/react
```

## 5. Verificación

- `npm run build` limpio (GSAP solo en componentes cliente; sin errores de SSR/hidratación).
- Playwright: (a) 6 profundidades de scroll en claro/oscuro; (b) **scroll down→up→down** para confirmar re-animación; (c) `emulateMedia reducedMotion` → estático; (d) mobile 390px; (e) footer cortina al final; (f) sin pageerrors.
- Commit + push al repo Cota.

## 6. Siguiente escalón (fuera de alcance)

Si tras verlo aún quiere más: WebGL/canvas (distorsión de imágenes al scroll, grain animado). Nueva dependencia y presupuesto de performance aparte.
