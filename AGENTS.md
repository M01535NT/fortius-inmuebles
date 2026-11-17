# Instrucciones para agentes — Fortius Inmuebles, rediseño del sitio público

**Responde siempre en español**, aunque las herramientas o los informes de otros agentes estén en inglés. Los encargos a subagentes también van en español.

Esta rama rehace el **sitio público**. No toca `/panel`, `/admin`, los formatos ni los PDF.

Sé breve y preciso. El titular no es técnico: decide tú lo técnico y pregúntale solo negocio y autorizaciones, una cosa a la vez. Distingue lo comprobado de lo supuesto.

## Dónde está cada cosa

| Qué | Dónde |
| --- | --- |
| Qué debe ser el sitio | `SPEC.md` |
| En qué orden se hace | `PLAN.md` |
| Cómo se hace | `DECISIONS.md` |
| Boceto aprobado | El lienzo «Fortius desde cero», enlazado en `SPEC.md` |
| Operación, respaldos, legal y cálculos | `docs/README.md` |

Los tres documentos los lee el titular: lenguaje sencillo, mínimo contenido, sin claves internas ni trabajo ya reemplazado. Lo que deja de valer se borra; queda en el historial de git. En los documentos se escribe «el agente», nunca el nombre de una herramienta.

## Cambios y contradicciones

- Si lo que pide el titular contradice lo escrito, dilo antes de hacerlo y corrige la fuente. No dejes dos reglas vivas.
- Si ves una mejor forma o notas que falta algo, propónlo con su razón. Él decide.
- Toda regla nueva va a `SPEC.md` (qué) o a `DECISIONS.md` (cómo); todo avance, a `PLAN.md`.

## Sitio público

- Manda el boceto aprobado. Lo que el boceto no define se pregunta y se anota.
- Pantalla en lenguaje sencillo. Teclado, foco visible, botones de al menos 44 px en el teléfono y movimiento reducido.
- El sistema nunca impide seguir por falta de un dato; avisa y deja continuar.

## Código

- Usa la pila instalada y `package-lock.json`; no actualices dependencias sin necesidad. Alias `@/*` hacia `src/*`. Reutiliza lo existente.
- TypeScript estricto: sin `any` ni supresiones para esconder errores.
- No toques los estilos, el logo ni el tema que usan los paneles; los del sitio viven bajo su propia clase.
- No debilites permisos, CSP ni validaciones. No renombres rutas, tablas, variables, cookies ni buckets.
- Antes de escribir código de Next.js, consulta la guía de la versión instalada (bloque al final).

## Datos y secretos

- Nunca muestres ni versiones `.env.local`, claves, tokens ni datos personales.
- La base actual tiene solo datos de prueba. Nunca se mandan correos ni mensajes a personas reales.
- Guardar no es publicar. Lo privado no sale en la API pública, Storage, HTML ni PDF.
- Las migraciones son archivos nuevos; avisa al titular antes de escribir una.

## Comprobaciones

- Mientras se construye no se corren lint, tipos, pruebas ni revisiones en el navegador.
- Solo antes de integrar en `main`, y con su acuerdo: `npm run verify` y las suites de navegador.
- No se borran ni debilitan pruebas sin reemplazo acordado.

## Git y publicación

- Rama de trabajo: `rediseno-sitio`. Commit solo cuando el titular lo pida; nunca push, PR ni merge sin pedirlo.
- Nada va a `main` sin su acuerdo: un solo PR en borrador.
- Sin `reset --hard`, force-push ni limpiezas destructivas. Respeta los cambios de otras sesiones.
- Al cerrar, di qué cambió, qué se comprobó y qué no.

## Documentación de Next.js instalada

Conserva el bloque siguiente: lo administra `next dev`.

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.
