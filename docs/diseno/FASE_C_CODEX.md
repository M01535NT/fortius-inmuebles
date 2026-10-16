# Fase C · Rediseño guiado del panel — instrucciones para Codex

**Aprobado por el titular (Moisés Núñez Tonalá) el 15/10/2026.** Este archivo es tu encargo completo. Léelo entero antes de escribir código y vuelve a él al empezar cada fase.

## 1. Qué vas a construir

El panel `/admin` de Fortius es confuso. Tiene unas 8 entradas de navegación que se enciman, una página de operación enorme y lenguaje técnico y legal en pantalla. Vas a rehacer **la interfaz** para que sea minimalista e intuitiva y **guíe al asesor paso a paso** por cada operación: pantallas cortas, lenguaje sencillo y una sola acción principal por pantalla.

**La fuente de verdad visual es `docs/diseno/bocetos-panel-guiado.html`.** Ábrelo en un navegador, por ejemplo con Playwright o abriendo el archivo directamente. Arriba tiene selectores de **Vista** (Celular 390 px / Computadora 1440 px), **Modo** (Claro/Oscuro) y **Ver como** (Administrador/Asesor), y una fila de pantallas. Todo es clicable. Junto a cada pantalla hay notas: «Lo que cambia» y «Lo que desaparece». Reproduce composición, jerarquía, textos, estados e interacciones de cada pantalla en las dos vistas y los dos modos. Los datos de los bocetos son ficticios; en el panel usa los datos reales de las colecciones existentes.

Es un cambio de **interfaz**. La lógica de negocio, los datos y el servidor no cambian.

## 2. Reglas que no se rompen

1. **Sin migraciones ni cambios en la base de datos.** No toques `supabase/migrations` ni crees tablas, columnas o funciones SQL.
2. **No cambian los permisos ni las validaciones del servidor.** Las rutas `src/app/api/**` mantienen sus contratos. Si la nueva interfaz necesita un dato que la API no da, pregunta antes de crear un endpoint. Como referencia, `GET /api/admin/apps/runs` ya admite `expedienteId` y la vista `ultimo-por-expediente`.
3. **La estructura de la guía (`flujo`) no cambia.** Los requisitos que exige el servidor se piden igual; solo cambia **cómo** se preguntan. Ningún requisito se relaja. Al marcar «Revisado», el panel debe seguir capturando la evidencia que valida `reviewComplete`: tipo, referencia y versión o fecha, responsable y resultado cuando es externa, y vigencia cuando aplica.
4. **El sitio público no cambia** (todo lo que está fuera de `/admin`).
5. **No agregues dependencias** sin preguntar. Usa React 19, Next 16, Tailwind y `lucide-react`, que ya están instalados.
6. **Nunca escribas datos de prueba en producción.** `.env.local` apunta a la base **real** de Fortius. Para pruebas de navegador usa un servidor con las variables de Supabase vacías (sección 7).
7. **Conserva el modo oscuro, el teclado, el foco visible, los objetivos táctiles de al menos 44 px, `prefers-reduced-motion` y los roles admin/editor.** Hoy se llaman `admin` y `editor`; en pantalla, «editor» se muestra como «Asesor».
8. **Una fase por rama y por PR** (sección 5). No mezcles fases. Cada PR deja CI en verde.

## 3. Lo que ya existe y debes reutilizar

**Proceso de venta**, en `src/lib/formatos/operation-workflow.ts`:
- `SALE_PROCESS`: las 6 etapas, cada una con `label`, `hace` y `para`.
- `processPhase(etapa, flujo, today)`: deriva la etapa del proceso a partir del estado interno. «Verificación y precio» y «Contrato y preparación» comparten el estado interno `documentacion` y se separan con `verificationComplete`.
- `processStageText`: texto de la etapa actual.
- `requirementPhase`: a qué etapa pertenece cada requisito.
- `requiredReviews`, `reviewComplete`, `workflowBlockers` (qué falta para avanzar) y `publicationBlockers`.
- `ownerReportStatus` y `ownerReportApplies`: informe mensual al propietario.
- `WORKFLOW_ROUTES`, `stageLabel`: las rutas de compra, renta e inversión tienen sus propias etapas y usan el mismo diseño.

**Otras piezas:**
- `src/lib/formatos/expediente-operations.ts`: `EXPEDIENTE_ETAPAS` y `EXPEDIENTE_OPERACIONES`.
- `src/lib/admin/store.ts`: `apiRequest`, `fetchJson`, `loadAllDossiers`, `useCollection(db.*)`, `useSession` y `upsert`.
- `src/lib/utils.ts`: `formatDate`, `cn`. `src/lib/finance/money.ts`: `formatAmount`, `formatAmountOrPending`.
- `src/components/admin/ui.tsx`: `PageHeader`, `Field`, `Badge`, `EmptyState`, `ErrorNotice`, `AsyncForm`, `AsyncButton`, `AsyncSelect` y `UploadControl`.
- `src/lib/apps/catalog.ts`: las 16 herramientas.
- **Pantallas actuales que vas a reemplazar:**
  - `src/app/admin/page.tsx` + `workspace/today.tsx` + `workspace/attention-queue.tsx`
  - `src/app/admin/expedientes/page.tsx` + `operation-workflow-panel.tsx` + `expediente-operation-panel.tsx` + `workspace/operation-brief.tsx`
  - `src/app/admin/operaciones/nueva/page.tsx` + `src/app/admin/entrevistas/[id]/page.tsx`
  - la navegación: `src/components/admin/admin-shell.tsx`, `workspace/navigation.tsx`, `workspace/module-catalog.ts`, `workspace/breadcrumbs.tsx`, `workspace/search.tsx` y `workspace/app-launcher.tsx`

Lee cada archivo antes de reemplazarlo. Conserva su lógica de carga, guardado, conflictos de versión (409), protección de cambios sin guardar y permisos; solo cambia la presentación.

## 4. Decisiones de diseño ya tomadas

**Navegación**
- Barra lateral: botón principal **«+ Nueva operación»** arriba; **Hoy, Operaciones, Contactos, Inmuebles, Agenda**; **Herramientas** en segundo nivel; **Administración** plegada y solo para admin (Equipo, Sitio web, Reportes, Historial, Configuración).
- Desaparecen «Más», «Organizar menú» (reordenar arrastrando), la campana (un contador en «Hoy» la reemplaza), los enlaces de etapas en el menú, la página puente «Documentos» y la ventana «Aplicaciones» como entrada aparte.
- En celular, barra inferior con **Hoy · Operaciones · + · Contactos · Menú**.

**Rutas.** Las direcciones viejas redirigen; no dejes páginas huérfanas.

| Nueva | Contenido | Redirige desde |
|---|---|---|
| `/admin` | Hoy | — |
| `/admin/operaciones` | Tablero por etapas (`?etapa=<slug de SALE_PROCESS>` abre esa pestaña) | `/admin/expedientes`, `/admin/proceso/[etapa]` |
| `/admin/operaciones/[id]` | Operación guiada | `/admin/expedientes?expediente=<id>` |
| `/admin/operaciones/nueva` | Asistente de nueva operación (incluye la entrevista) | `/admin/entrevistas/[id]` → paso de entrevista del asistente |
| `/admin/contactos` | Pestañas Prospectos / Clientes | `/admin/leads`, `/admin/clientes` (las fichas `/[id]` se conservan) |
| `/admin/agenda` | Pestañas Calendario / Tareas | `/admin/calendario`, `/admin/tareas` (`/admin/tareas/[id]` se conserva) |
| `/admin/herramientas` | Las 16 apps | `/admin/apps` (`/admin/apps/[slug]` se conserva) |

Actualiza los enlaces internos, la búsqueda y las pruebas a las rutas nuevas.

**Operación guiada**
- Encabezado corto: cliente, inmueble, precio, responsable y la etiqueta de la etapa. El folio va pequeño.
- Avance: 6 etapas en línea en computadora; «Etapa N de 6» con barra en celular. **Las etapas se numeran del 1 al 6**: cambia también la numeración 0–5 que hoy usan las páginas de proceso.
- Una tarjeta **«Lo que sigue»**:
  - qué se hace y para qué, en una línea;
  - **solo los requisitos de la etapa actual**, con los estados *Pendiente · Lo tengo · Revisado ✓ · Hay un problema · No aplica*. «No aplica» solo existe donde el requisito lo admite.
  - Correspondencia con los estados internos (`REVIEW_STATES`): pendiente, recibido, revisado, observado y no_aplica.
- Al marcar «Revisado» se abre un panel lateral (o inferior en celular). Pide qué documento lo respalda, quién lo revisó, la fecha y la vigencia cuando aplica. Lo técnico va en «Más detalles».
- Próxima tarea con fecha dentro de la tarjeta.
- Botón principal fijo abajo: «Pasar a: <siguiente etapa>». Si `workflowBlockers` devuelve algo, el botón se deshabilita y se muestra «Te falta: …», con enlaces que llevan al requisito.
- A la derecha (o abajo en celular): las herramientas de la etapa y los datos de la persona.
- Pestañas: **Lo que sigue · Documentos · Tareas · Historial · Ajustes**. En Ajustes quedan la decisión del encargo, la ruta, la contraparte, corregir etapa con motivo y **eliminar, con confirmación dentro de la página**.
- Las etapas «Publicación y seguimiento» y «Visitas y ofertas» conservan el aviso del informe mensual y las visitas y ofertas del inmueble que ya existen.

**Nombres sencillos de los requisitos** (usa exactamente estos; el texto de ayuda está en los bocetos)

| Clave | Texto en pantalla |
|---|---|
| entrevista | Entrevista con el propietario |
| titularidad | Quién es dueño y quién firma |
| factibilidad | Que se pueda vender sin obstáculos |
| valor | Opinión de valor |
| precio | Precio de salida acordado |
| intermediacion | Contrato de servicio firmado |
| levantamiento | Fotos, medidas y datos revisados |
| plan | Plan de publicación aprobado |
| publicacion | Permiso para publicar |
| comprador | Comprador con capacidad de pago |
| oferta | Oferta aceptada por escrito |
| revision_cierre | Documentos al día para firmar |
| instrumento | Cómo se firma y se paga |
| contraparte | Comprador y participantes identificados |
| firma | Firma ante notario |
| pago | Pago completo antes de entregar |
| entrega | Entrega con acta |
| registro | Trámite de registro |
| honorarios | Honorarios cobrados |
| archivo | Pendientes resueltos y operación archivada |

Los requisitos de las rutas de renta e inversión que no están en la tabla reciben un nombre igual de sencillo, en el mismo estilo.

**Glosario para todo el panel**
- «Operación» siempre, nunca «expediente». El folio `EXP-…` se conserva.
- Recibido → **Lo tengo**. Revisado con soporte → **Revisado**. Observado → **Hay un problema**.
- Evidencia externa registrada → **Documento fuera del sistema**.
- Emisión conservada → **PDF generado**. Borrador versionado → **Borrador del documento**. Emitir PDF → **Generar PDF**. «Borrador v3» → **Versión 3**.
- Los avisos legales repetidos se sustituyen por un solo «¿Qué significa?» con la explicación completa.
- Mensajes de estado: «Guardado», «No se pudo guardar: <motivo>». Sin jerga como «servidor», «colecciones», «versión» o «RLS».

**Tres preguntas abiertas resueltas por defecto** (el titular puede cambiarlas)
1. «Hoy» es la pantalla de inicio para todos los roles.
2. Una etapa anterior se corrige solo desde Ajustes › Corregir etapa, con motivo, como hoy.
3. «Revisor de expediente» se muestra como **«Pendientes documentales»**. Cambia solo el título visible; el `slug` se conserva.

## 5. Fases (una rama y un PR por fase, en este orden)

Para cada fase:
- Rama `feat/panel-guiado-N-<nombre>` desde `main` actualizado.
- Pruebas actualizadas.
- Capturas a 390 y 1440 px, en claro y oscuro, comparadas lado a lado con el boceto.
- Registro de la entrega en `PLAN_ERP_CRM.md`. La regla del plan pide registrar cada entrega con PR, commit, pruebas y límites, y no marcar nada como publicado por haber hecho push.

1. **Base visual.**
   - Un solo juego de variables de color y espacio, en claro y oscuro, tomado del `:root` de los bocetos: azul `#061F3F`, guinda `#8A1634`, fondo `#FBFCFE`, Archivo e IBM Plex Mono.
   - Componentes en `src/components/admin/ui.tsx` o junto a él: `Card`, `Button` (principal, secundario, peligro), `Stepper`, `StatusPill`, `Tabs`, `Sheet` (lateral en computadora, inferior en celular) y `EmptyState`.
   - Empieza a retirar `panel.module.css`. Meta al terminar la Fase C: menos de 15 KB y sin clases que compitan con Tailwind.
2. **Estructura y navegación.** Barra lateral, barra inferior en celular, búsqueda, rutas nuevas y redirecciones de la sección 4.
3. **Hoy.** Operaciones que esperan algo, cada una con un solo botón «Continuar»; tareas que se marcan en la misma pantalla; agenda de hoy; informes al propietario vencidos.
4. **Operaciones y operación guiada** (la fase más grande).
   - Divide `expedientes/page.tsx` y `operation-workflow-panel.tsx` en componentes pequeños.
   - Tablero «Mías / Todo el equipo»: «Todo el equipo» solo para admin.
   - Mismo diseño para las rutas de compra, renta e inversión, con sus etapas.
5. **Nueva operación.**
   - Un asistente que une el alta con la entrevista: qué quiere el cliente → quién es → entrevista, una sección por pantalla → listo, y abre la operación.
   - Avisa si el contacto ya existe; acepta «No sabe»; permite guardar y seguir después.
   - La barra de pasos cuenta los pasos reales.
6. **Contactos, Inmuebles, Agenda y Herramientas,** y el mismo estilo de lista para Administración (Equipo, Sitio web, Reportes, Historial, Configuración).
7. **Repaso final.**
   - Recorre todo el panel con el glosario.
   - Elimina componentes y CSS que quedaron sin uso. Hoy tiene 45.9 KB.
   - Verifica que no queden rutas ni enlaces rotos.

## 6. Criterios de terminado por fase

- La pantalla coincide con el boceto en composición, textos, estados y comportamiento, en las dos vistas y los dos modos. Las diferencias que no se puedan evitar se explican en el PR.
- Funciona con teclado, el foco es visible y no hay desbordamiento horizontal a 320, 390, 768 y 1440 px.
- Los datos, permisos, conflictos de versión y avisos de cambios sin guardar se comportan igual que antes.
- `npm run verify` pasa: lint, tipos, pruebas de backend y del panel, y compilación.
- También pasan `node --test tests/tools/*.test.mjs`, `node tools/verify-pdf-bundle.mjs`, `npm run test:public:browser` y las pruebas de navegador del panel que corre CI (`.github/workflows/verify.yml`).
- Las pruebas que dependían de la interfaz anterior se actualizan para cubrir el mismo comportamiento con la interfaz nueva. No se borran para hacer pasar el PR.

## 7. Cómo probar sin tocar la base real

`.env.local` apunta a la base de producción. Para las pruebas de navegador del panel, compila y levanta un servidor **sin backend**, como hace CI:

```bash
NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_ANON_KEY= SUPABASE_SERVICE_ROLE_KEY= npm run build
```
```bash
NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_ANON_KEY= SUPABASE_SERVICE_ROLE_KEY= npx next start --hostname 127.0.0.1 --port 3105
```
```bash
FORTIUS_INMUEBLES_TEST_URL=http://127.0.0.1:3105 npx playwright test --config playwright.admin.config.ts
```

Next conserva las variables vacías del proceso por encima de `.env.local`. Comprueba antes de probar que `http://127.0.0.1:3105/api/health` responde `{"status":"unavailable"}`. Las pruebas públicas (`npm run test:public:browser`) levantan su propio servidor falso. En el panel real con la sesión del titular solo se navega, sin guardar.

## 8. Qué entregar en cada PR

- Qué pantallas cambiaron y qué rutas redirigen.
- Las capturas de comparación con el boceto.
- Resultado de cada comando de la sección 6, con el número de pruebas.
- Lo que no se pudo verificar y por qué.
- Cualquier decisión que tomaste sin estar en este documento, para que el titular la confirme.
