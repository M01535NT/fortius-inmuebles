# Instrucciones para agentes — Fortius Inmuebles

**Responde siempre en español**, aunque las herramientas, los archivos, los resúmenes de la conversación o los informes de otros agentes estén en inglés. Los encargos a subagentes y sesiones auxiliares también van en español, y piden la respuesta en español.

Un solo producto: el sitio público de **Fortius Inmuebles** y su panel operativo (Next.js, Supabase, Vercel). El panel vive en `/panel`; `/admin` es el panel provisional que sigue en producción hasta que el nuevo lo reemplace. COTA e Inmobiliaria OS son otros proyectos: no copies sus reglas ni datos.

Sé breve y preciso. El titular no es técnico: decide tú lo técnico y pregúntale solo negocio y autorizaciones, una cosa a la vez. Distingue lo comprobado de lo supuesto; no afirmes lo que no verificaste.

## Dónde está cada cosa

| Qué | Dónde |
| --- | --- |
| Cómo debe funcionar el sistema (manda sobre lo construido) | `SPEC.md` |
| Qué falta y en qué etapa vamos (único plan) | `PLAN.md` |
| Cómo se ve y cómo responde el panel (boceto aprobado) | `docs/boceto-fortius-por-asuntos.html` |
| Casos reales con los que se prueba cada etapa | `docs/casos-reales.md` |
| Metodologías que se copian a un asunto | `docs/metodologias/` |
| Sitio público (qué es, orden y cómo se hace; mandan para el sitio) | `docs/sitio/SPEC.md`, `docs/sitio/PLAN.md`, `docs/sitio/DECISIONS.md` |
| Marca anterior (PDF, formatos y membrete) | `docs/sitio-publico/marca.md` |
| Lo demás (operación, respaldos, privacidad, formatos, cálculos, legal) | `docs/README.md` |

`SPEC.md` y `PLAN.md` los lee también el titular, que no es programador: se escriben en lenguaje sencillo, sin claves internas ni tecnicismos, y sin mencionar trabajo anterior, archivado o reemplazado. Lo reemplazado no se guarda en documentos: queda en el historial de git. Si un documento contradice a `SPEC.md`, se corrige o se borra. Todo avance se anota en `PLAN.md`; toda regla o decisión nueva, en `SPEC.md`. Si una indicación nueva choca con algo escrito, se corrige la fuente y se avisa del choque.

Las claves del tipo `RP-00` o `DEC-00` y las menciones a `DECISIONES.md` que aparecen en comentarios del código son de versiones anteriores de la especificación y ya no existen: manda `SPEC.md`.

## Cambios y contradicciones (regla del titular, 16/11/2026)

- `SPEC.md` y `PLAN.md` son la versión vigente, no definitiva.
- **Si lo que pide el titular contradice lo escrito, dilo antes de hacerlo:** «eso contradice esto», citando la parte. No lo apliques en silencio ni dejes las dos reglas vivas.
- **Pregúntale qué prefiere:** corregirlo en la misma rama (ajuste chico) o **abrir una rama nueva** (cambio grande o de dirección), donde se modifican `SPEC.md`, `PLAN.md` y lo necesario sin tocar la versión en curso. Sugiere la rama nueva cuando el cambio afecte varias secciones o trabajo ya hecho.
- **Propón.** Si entiendes lo que busca y ves una mejor forma de lograrlo, o notas que falta algo, sugiérelo con su razón, sin esperar a que lo pida. Él decide.

## Panel

- **Código** en `src/app/panel/`, `src/components/panel/` y `src/lib/panel/`, con estilos bajo `.panel-root`. Nada nuevo en `/admin` (el panel provisional) salvo seguridad o caída del sitio, avisando.
- **Aislamiento:** el panel solo usa el provisional a través de `src/lib/panel/legado/`; el lint lo hace cumplir y no se desactiva. El backend (`src/lib/backend`, `src/app/api`, `supabase/migrations`) es compartido.
- **Diseño:** manda el boceto aprobado. App moderna, pocas palabras en pantalla, opciones agrupadas en listas desplegables y menús, íconos en todo, claro y oscuro. Minimalista es agrupar, no quitar funciones. Los tokens de `src/app/panel/panel-ds.css` y los íconos de `src/components/panel/icons.tsx` se ajustan al boceto. Lo que el boceto no define se pregunta y se anota en `SPEC.md`; no se inventa.
- **Cualquier caso cabe:** ninguna metodología es regla del panel ni su centro. Una metodología es una guía para un trabajo específico (captar una venta, captar una renta, cancelar una hipoteca); hay muchas, viven en la Biblioteca y nunca se generalizan a todo el panel. Si un caso real no cabe, dilo con claridad y propón cambiar el diseño; no acomodes el caso a la fuerza.
- **Comportamiento:** el sistema nunca impide seguir por falta de un dato o un paso; avisa y deja continuar. De 3 opciones en adelante, lista desplegable; con 2, interruptor; nunca un botón por opción. La visibilidad (director ve todo, asesor lo suyo) se hace cumplir en la base con RLS.
- **Pantalla:** lenguaje sencillo, sin rastros de IA («Por confirmar», no «propuesto»). Teclado, foco visible, botones de al menos 44 px en el teléfono y movimiento reducido.
- **Revisión:** al cerrar una etapa, un revisor de solo lectura repasa la lógica y prueba los casos de `docs/casos-reales.md`; lo que encuentre se corrige o se anota en `PLAN.md`.

## Sitio público

Manda el boceto aprobado del rediseño y lo escrito en `docs/sitio/` (marca: el sistema de diseño de `docs/sistema-diseno/`, con la letra Archivo); `docs/sitio-publico/marca.md` ya no aplica al sitio. Sus estilos viven bajo la clase `sitio` (`src/app/sitio.css`) y sus piezas en `src/components/sitio/`; no tocan los estilos, el logo ni el tema del panel. Lo que el boceto no define se pregunta y se anota en `docs/sitio/`. Sin cejas (antetítulos sobre los títulos).

## Formatos y documentos

Los formatos siguen la plantilla del titular: solo sus campos, sin agregar opciones jurídicas o fiscales. Un formato generado no es aprobación jurídica; lo legal lo revisa el abogado. Los entregables para clientes no llevan notas internas. En los documentos del proyecto se escribe «el agente», nunca el nombre de una herramienta.

## Código

- Usa la pila instalada y `package-lock.json`; no actualices dependencias sin necesidad. Alias `@/*` hacia `src/*`. Reutiliza lo existente.
- TypeScript estricto: sin `any` ni supresiones para esconder errores.
- Las mutaciones validan entrada, sesión, rol y alcance en el servidor. No debilites permisos, RLS, CSP ni validaciones. Conserva los conflictos 409, el historial y el borrado recuperable.
- No renombres rutas, tablas, variables, cookies ni buckets salvo que el encargo lo incluya.
- Antes de escribir código de Next.js, consulta la guía de la versión instalada (bloque al final).

## Datos y secretos

- Nunca muestres ni versiones `.env.local`, claves, tokens, contraseñas ni datos personales. `SUPABASE_SERVICE_ROLE_KEY` solo en servidor.
- La base actual tiene solo datos de prueba (autorización del 17/10/2026): se pueden crear y borrar ensayos, marcados como ejemplo. Nunca se mandan correos ni mensajes a personas reales. Cuando se cargue el inventario real, esto termina.
- El conector `supabase-fortius` es de solo lectura. Las migraciones son archivos nuevos en `supabase/migrations/`; nunca se reescribe una aplicada. Avisa al titular antes de escribir una; se aplican solas al integrar en `main`.
- Guardar no es publicar. Lo privado no sale en la API pública, Storage, HTML ni PDF.
- No borres datos ni archivos ajenos sin confirmar; ante la duda, copia recuperable.

## Comprobaciones (regla del titular, 16/11/2026)

- **Mientras se construye no se corren lint, tipos, pruebas ni revisiones en el navegador.**
- **Solo antes de integrar en `main`**, y con su acuerdo (di cuánto tarda): `npm run verify` (lint, tipos, pruebas y build) y las suites de navegador que correspondan.
- Si el titular pide revisar algo antes, se revisa eso y nada más. No se borran ni debilitan pruebas existentes.
- Servidor local: `npm run dev -- --hostname 127.0.0.1 --port 3001`, ruta `/panel`. No detengas procesos ajenos.

## Git y publicación

- Rama de trabajo del panel: `nuevo-panel`. Commit solo cuando el titular lo pida o lo haya autorizado; nunca push, PR ni merge sin pedirlo.
- Nada va a `main` sin su acuerdo: un solo PR en borrador (`gh pr create --draft`), que se marca listo cuando él quiera verificar y publicar. Sin integración automática.
- Sin `reset --hard`, force-push ni limpiezas destructivas. Respeta los cambios de otras sesiones.
- Al cerrar, di qué cambió, qué se comprobó y qué no.

## Documentación de Next.js instalada

Conserva el bloque siguiente: lo administra `next dev`. Antes de escribir código de Next.js, consulta la guía pertinente de la versión instalada; no apliques recetas de otras versiones por memoria.

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.
