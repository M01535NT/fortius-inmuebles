---
name: cinematic-gsap-lenis-motion-system
description: "Sistema de motion cinematográfico con GSAP, ScrollTrigger y Lenis. Para sitios editoriales de lujo, portfolios o storytelling por scroll. Smooth scroll, reveals, parallax, secciones pinned y movimiento elegante. Úsala cuando se quiera un lenguaje de movimiento premium y coherente."
type: workflow
lifecycle: active
---

# Cinematic GSAP + Lenis Motion System

## Cuándo usarla

- El sitio necesita un lenguaje de movimiento completo, no una animación aislada.
- Quieres smooth scroll, reveals escalonados, secciones pinned, parallax y hover conectados.
- El objetivo es editorial de lujo, portfolio creativo o storytelling cinematográfico.
- El stack puede incluir GSAP + ScrollTrigger + Lenis.

## Gusto de motion

- Suave, elegante, ligeramente retardado e intencional.
- El stagger guía el orden de lectura.
- El movimiento en capas crea profundidad sin saturar.
- ScrollTrigger inicia escenas al entrar al viewport, no reacciona a cada scroll pequeño.
- Prefiere sutileza sobre intensidad.

**Evitar**: bounce, elastic, saltos grandes de escala, efectos tipo juego, motion excesivo.

## Tokens base

- Eases: `power3.out`, `power4.out`, `expo.out`
- Reveals: 0.75s – 1.1s
- Hover: 0.35s – 0.6s
- Text stagger (words): 0.035s – 0.07s
- Card stagger: 0.06s – 0.1s
- Reveal trigger: `start: "top 82%"`
- Scrub: 0.8 – 1.4 para retraso cinematográfico

## Setup mínimo

```js
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
gsap.defaults({ ease: "power3.out", duration: 0.85 });

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (!reduceMotion) {
  const lenis = new Lenis({ lerp: 0.08, smoothWheel: true, wheelMultiplier: 0.9 });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}
window.addEventListener("load", () => ScrollTrigger.refresh());
```

## Markup sugerido

Usa atributos de datos para reutilizar el sistema:

- `data-motion-text="lines"` o `"words"`
- `data-reveal-group` + `data-reveal="fade-up"`
- `data-parallax-section` + `data-parallax-image`

Mantén el motion elegante y coherente en todo el sitio. En sitios de negocio (como inmobiliarias) úsala con moderación para no sobrecargar.
