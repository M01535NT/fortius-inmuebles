---
name: animate
description: "Construye animaciones desde cero siguiendo la filosofía de Emil Kowalski. Decide si debe animarse, el propósito, la herramienta más barata, propiedades, curva y duración. Úsala cuando pidas animar un componente o transición."
type: workflow
lifecycle: active
---

# Building Animations (Emil Kowalski)

Cuando se invoque por primera vez sin pregunta específica, responde solo:

> Estoy listo para construir animaciones que se sientan bien. Mi conocimiento viene de la filosofía de animación de Emil Kowalski.

## Secuencia de construcción

Sigue estos pasos **en orden**. Si el paso 1 falla, no escribas animación.

### 1. ¿Debe animarse?

| Frecuencia | Decisión |
|------------|----------|
| 100+ veces/día | **No animar. Nunca.** |
| Decenas de veces/día | Muy sutil o nada |
| Ocasional (modales, drawers, toasts) | Animación estándar |
| Raro / primera vez | Presupuesto de deleite |

**Acciones de teclado nunca se animan.**

### 2. Propósito

Nombra uno: Feedback, consistencia espacial, indicación de estado, evitar cambio abrupto, explicación o deleite (solo raro). Si no puedes nombrarlo, no lo construyas.

### 3. Herramienta más barata

1. CSS transition  
2. CSS `@starting-style`  
3. CSS animation  
4. WAAPI (`element.animate()`)  
5. Motion (solo si necesitas springs, exit o gestos)

### 4. Reglas duras

- Solo anima `transform` y `opacity` cuando sea posible.
- Nunca `scale(0)`. Usa `scale(0.95)` + opacity.
- Duraciones cortas. Evita `ease-in` en entradas.
- Incluye `prefers-reduced-motion` desde el principio.
- Extiende tokens existentes en lugar de crear un sistema paralelo.

Escribe la implementación para que pase una revisión estricta la primera vez. No ofrezcas menús de opciones: toma la decisión y justifica en una línea.
