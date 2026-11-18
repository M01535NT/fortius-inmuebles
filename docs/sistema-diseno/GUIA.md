# Guía para aplicar el sistema de diseño de Fortius Inmuebles

**Alcance: solo el sitio público.** El panel (`/panel` y `/admin`) no cambia: conserva su diseño y sus estilos actuales. Este sistema no se aplica ahí.

Esta carpeta es la fuente única del diseño del sitio público. Al construir o modificar cualquier página del sitio:

1. Carga `tokens.css` y después `componentes.css` en todas las páginas.
2. Usa siempre las variables (`var(--primary)`, `var(--shadow-md)`, `var(--space-4)`…), nunca colores, sombras o medidas escritos a mano.
3. Para botones, campos, tarjetas, insignias y avisos usa las clases `f3-` de `componentes.css`.
4. Titulares en Archivo angosta: `var(--font-display)` con `font-stretch: var(--stretch-display)` (72 %) y peso 600. Texto en Archivo de ancho normal (`var(--font-sans)`). La fuente se carga con su eje de ancho (ya incluido en `tokens.css`).
5. Todas las esquinas son rectas (`var(--radius-0)`). No usar redondeo.
6. El oro (`--oro-brocado`) solo en detalles pequeños sobre fondos oscuros; nunca como texto ni sobre fondo claro.
7. Tema oscuro: poner `data-theme="dark"` en `<html>` o en una sección; las variables cambian solas.
8. Logos en `logos/`: versión clara sobre fondo claro, versión oscura sobre fondo oscuro. No cambiar sus colores.

Si este archivo contradice algo del proyecto, gana este archivo. No cambies textos ni contenido al aplicar el diseño.

---

# Fortius Inmuebles

Sistema de diseño de la marca Fortius Inmuebles. Su carácter es imperial y sobrio: azul y rojo profundos sobre un fondo plata casi blanco (ghost white), un solo oro reservado para detalles y cantos rectos.

## Principios

- **Plata de fondo, terciopelo de figura.** El fondo claro es `plata`; las figuras y bloques de marca son `azul-real` y `rojo-imperial`.
- **El oro es un detalle, no un color de trabajo.** `oro-brocado` es el único oro: solo aparece en filetes, sellos o un ícono puntual, sobre azul o rojo; nunca en texto corrido ni en bloques grandes.
- **Cantos rectos, sin excepción.** Todo lleva esquinas rectas (`radius-0`): botones, campos, tarjetas, avisos, insignias, bloques y portadas. La profundidad la dan las sombras, no el redondeo.

## Logotipo

FORTIUS con el emblema hexagonal en lugar de la O y el lema REAL ESTATE & INVESTMENTS. Versión clara: azul real con el lado derecho del emblema en rojo imperial. Versión oscura: plata con el lado derecho en oro brocado. También hay emblema solo. Están en el grupo de recursos **Logos**; las reglas de uso, en la carpeta `logos/`.

## Paleta

| Token | Valor | Papel |
|---|---|---|
| `azul-real` | #012367 | Principal, tinta y fondo oscuro |
| `rojo-imperial` | #6D0809 | Acento de poder |
| `plata` | #F8F8FF | Fondo claro y texto sobre oscuro (ghost white) |
| `oro-brocado` | #CBBA87 | Único oro: detalles sobre azul o rojo |

En tema claro el principal es `azul-real` sobre `plata`; en tema oscuro el fondo es `azul-real` y el principal pasa a `plata`, porque el azul no se distingue sobre azul. Los tokens `surface`, `ink`, `ink-muted`, `primary`, `on-primary` y `border` ya hacen ese cambio.

## Contraste

- `azul-real` y `rojo-imperial` se leen bien sobre `plata` (13.8:1 y 11.8:1); la `plata` se lee bien sobre `azul-real`.
- `oro-brocado` contrasta bien sobre `azul-real` (7.6:1) y `rojo-imperial` (6.5:1), pero desaparece sobre `plata` (1.8:1): en fondo claro el oro no se usa.

## Tipografía

Una sola fuente, **Archivo**, de la línea de Arial (sans serif grotesca), con eje de ancho: la misma letra va de angosta a normal.

- **Titulares: Archivo angosta, peso 600.** Al 72 % de ancho (`--stretch-display`): alargada, firme y vertical. En mayúsculas con espaciado abierto recuerda una inscripción. Se usa en titulares, el nombre de la marca y cifras destacadas.
- **Texto: Archivo, ancho normal, pesos 400 y 600.** Para que los párrafos se lean cómodos. `600` en etiquetas y botones, en mayúsculas con espaciado abierto.
- Al cargarla de Google Fonts hay que pedir el eje de ancho (`wdth 62..125`); si no, los titulares salen en ancho normal. Es gratuita y de uso comercial (SIL Open Font License).

## Sombras

Las sombras separan superficies; no decoran. En claro usan el `azul-real` con muy poca opacidad; en oscuro, negro profundo.

- `shadow-sm`: botones y campos en reposo.
- `shadow-md`: tarjetas, y botones al pasar el cursor.
- `shadow-lg`: ventanas emergentes y menús flotantes.
- `shadow-focus`: anillo de foco de teclado (azul en claro, oro en oscuro).

## Componentes

Logo, Botón, Campo, Tarjeta, Insignia y Aviso. Son genéricos: sirven para cualquier pantalla o documento de la marca. Sus estilos están en `componentes.css` con el prefijo `f3-` y toman todos sus valores de los tokens.
