# Instrucciones para agentes — Fortius Inmuebles

Un solo producto: el sitio público de **Fortius Inmuebles** y su panel operativo (Next.js, Supabase, Vercel). El panel nuevo vive en `/panel`; el viejo `/admin` es legado. COTA e Inmobiliaria OS son otros proyectos: no copies sus reglas ni datos.

Trabaja en español, breve y preciso. El titular no es técnico: decide tú lo técnico y pregúntale solo negocio y autorizaciones, una cosa a la vez. Distingue lo comprobado de lo supuesto; no afirmes lo que no verificaste.

## Dónde está cada cosa

| Qué | Dónde |
| --- | --- |
| Qué falta y cómo va (único plan) | `PLAN.md` |
| Reglas (RP) y decisiones (DEC) vigentes | `SPEC.md` |
| Qué hace cada pantalla del panel nuevo (manda sobre lo construido) | `docs/diseno/nuevo-panel/DECISIONES.md` |
| Qué es legado y cómo se aísla | `docs/diseno/nuevo-panel/LEGADO.md` |
| Marca del sitio público | `docs/brand.md` |
| Lo demás (privacidad, publicación, respaldos, formatos, calculadoras) | `docs/README.md` |

Lo terminado y lo reemplazado está en los historiales (`docs/erp-crm/historial-del-plan.md`, `docs/erp-crm/historial-de-reglas.md`, `docs/diseno/nuevo-panel/historial-de-decisiones.md`): solo consulta. Todo avance se anota en `PLAN.md`; las reglas nuevas, en `SPEC.md` o `DECISIONES.md`. Si una indicación nueva choca con algo escrito, se corrige la fuente y se avisa del choque.

## Panel nuevo

- **Código** en `src/app/panel/`, `src/components/panel/` y `src/lib/panel/`, con estilos bajo `.panel-root`. Nada nuevo en `/admin` salvo seguridad o caída del sitio, avisando.
- **Aislamiento:** el panel nuevo solo usa el viejo a través de `src/lib/panel/legado/`; el lint lo hace cumplir y no se desactiva. El backend (`src/lib/backend`, `src/app/api`, `supabase/migrations`) es compartido.
- **Diseño:** estilo tipo Apple aprobado (RP-104; detalle en `DECISIONES.md`), con los tokens de `src/app/panel/panel-ds.css` y los íconos de `src/components/panel/icons.tsx`. Sin blanco ni negro puros; claro y oscuro. Lo que el estilo no define se anota en `DECISIONES.md`, no se inventa.
- **Comportamiento:** nada frena, solo avisa (DEC-61). De 3 opciones en adelante, desplegable; con 2, interruptor; nunca filas de chips. Arrastrar y soltar con equivalente de teclado (RP-102 PN). Primero para el director, después para el asesor; la visibilidad se hace cumplir en la base con RLS (RP-101 PN).
- **Pantalla:** lenguaje sencillo, una acción principal, sin rastros de IA («Por confirmar», no «propuesto»). Teclado, foco visible, botones de al menos 44 px y movimiento reducido.
- **Auditoría:** al cerrar una etapa PN, un revisor de solo lectura audita la lógica; su informe va a `docs/diseno/nuevo-panel/auditorias/` (RP-103 PN).

## Sitio público

Conserva su identidad actual (`docs/brand.md`) hasta que el titular pida aplicar el nuevo sistema (DEC-59). Sin cejas (antetítulos sobre los títulos).

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
