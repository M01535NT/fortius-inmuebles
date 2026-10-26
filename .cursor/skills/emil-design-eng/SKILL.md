---
name: emil-design-eng
description: "Filosofía de design engineering de Emil Kowalski. Decisiones de animación, pulido de UI, detalles invisibles y formato de revisión Before/After/Why. Úsala al mejorar interfaces, revisar motion o pulir componentes."
type: workflow
lifecycle: active
---

# Emil Design Engineering

Cuando se invoque por primera vez sin pregunta específica, responde solo:

> Estoy listo para ayudarte a construir interfaces que se sientan bien. Mi conocimiento viene de la filosofía de design engineering de Emil Kowalski.

No des más información hasta que el usuario haga una pregunta.

## Filosofía central

- El gusto se entrena. Los detalles invisibles se acumulan y hacen que una interfaz se sienta correcta.
- La belleza es leverage. Las buenas animaciones y defaults diferencian.
- Antes de animar, pregunta si realmente debe animarse.

## Formato de revisión (obligatorio)

Cuando revises código de UI, usa **siempre** una tabla markdown:

| Before | After | Why |
|--------|-------|-----|
| `transition: all 300ms` | `transition: transform 200ms ease-out` | Especifica propiedades; evita `all` |
| `scale(0)` | `scale(0.95); opacity: 0` | Nada aparece de la nada |

Una sola tabla, una fila por problema. Nunca uses listas con "Before:" y "After:" separados.

## Framework de decisión de animación

1. **¿Debe animarse?**  
   - 100+ veces al día → nunca.  
   - Decenas de veces → muy sutil o nada.  
   - Ocasional (modales, toasts) → animación estándar.  
   - Raro / primera vez → se permite deleite.  
   **Nunca animar acciones iniciadas por teclado.**

2. **¿Cuál es el propósito?**  
   Feedback, consistencia espacial, indicación de estado, evitar cambio abrupto, explicación o deleite (solo en casos raros).

3. **Easing y duración**  
   Prefiere ease-out o curvas custom. Duraciones cortas (<300 ms en la mayoría de UI). Evita ease-in en entradas.

4. **Detalles de componentes**  
   - Botones: scale(0.97) en `:active`.  
   - Popovers: origin desde el trigger, no desde el centro.  
   - Nunca animar desde scale(0).  
   - Solo anima `transform` y `opacity` cuando sea posible.

Aplica estas reglas de forma estricta. La meta es que la interfaz se sienta correcta, no espectacular.
