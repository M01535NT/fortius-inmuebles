# Rediseño guiado del panel (Fase C) — encargo para el agente de desarrollo

> **Estado: cumplido.** Las siete fases se fusionaron en `main` con el PR #39 el 17/10/2026. Las reglas de este encargo (sin migraciones, flujo sin cambios, roles `admin`/`editor`, avisos solo con el contador de Hoy) valían para esa fase. Las reglas vigentes del producto están en «Dirección del producto y reglas vigentes» de `PLAN_ERP_CRM.md`; si algo de aquí las contradice, mandan aquellas. El diseño visual, el glosario y los nombres sencillos de este encargo siguen vigentes.

**Aprobado por el titular (Moisés Núñez Tonalá) el 15 y 16/10/2026.** Este archivo es el encargo completo. El agente lo lee entero antes de escribir código y vuelve a él al empezar cada fase.

## 1. Qué se construye

El panel `/admin` de Fortius es confuso. Tiene unas 8 entradas de navegación que se enciman, una página de operación enorme y lenguaje técnico y legal en pantalla. Se rehace **la interfaz** para que sea minimalista e intuitiva y **guíe al asesor paso a paso** por cada operación: pantallas cortas, lenguaje sencillo y una sola acción principal por pantalla.

**Referencia visual principal: `docs/diseno/lienzo-panel/`.** Es el lienzo de diseño aprobado, con 36 pantallas en celular (390 px) y computadora (1440 px), en claro y oscuro:

- `canvas.json` indica qué representa cada archivo `.dc.html`. Por ejemplo, `Main.dc.html` es Hoy en computadora y `OperacionEscritorio.dc.html` es la operación guiada.
- `fortius-panel.css` y `ds/fortius/tokens.json` contienen los tokens de color, tipografía, espacios y estados (claro y oscuro). Son la base de la Fase 1.
- `Componentes.dc.html` y `Tokens.dc.html` son la hoja de componentes y la de tokens.
- Los `.dc.html` necesitan el runtime del lienzo para verse. En el repositorio sirven como fuente legible: marcado, textos exactos, estados y datos de ejemplo en `renderVals()`. Para verlos renderizados, el titular abre el lienzo original.

**Referencia secundaria: `docs/diseno/bocetos-panel-guiado.html`.** Son los primeros bocetos aprobados. Se abren en cualquier navegador y sirven para entender el comportamiento interactivo (cambiar estados, abrir el panel de «Revisado»). Si contradicen al lienzo, manda el lienzo.

Los datos de los diseños son ficticios; en el panel se usan los datos reales de las colecciones existentes. Es un cambio de **interfaz**: la lógica de negocio, los datos y el servidor no cambian, salvo lo indicado en la sección 4 para «Próximos 7 días».

## 2. Reglas que no se rompen

1. **Sin migraciones ni cambios en la base de datos** (`supabase/migrations` no se toca).
2. **No cambian los permisos ni las validaciones del servidor.** Las rutas `src/app/api/**` mantienen sus contratos. Si la interfaz necesita un dato nuevo, se pregunta al titular antes de crear un endpoint. Como referencia, `GET /api/admin/apps/runs` ya admite `expedienteId` y la vista `ultimo-por-expediente`.
3. **La estructura de la guía (`flujo`) no cambia.** Los requisitos se piden igual; solo cambia **cómo** se preguntan. Ningún requisito se relaja. Al marcar «Revisado», el panel sigue capturando la evidencia que valida `reviewComplete`:
   - tipo y referencia del documento;
   - versión o fecha;
   - si el documento está fuera del sistema: responsable y resultado («Qué encontraste»);
   - vigencia, cuando el requisito la exige.
4. **El sitio público no cambia** (todo lo que está fuera de `/admin`).
5. **No se agregan dependencias** sin preguntar. Se usan React 19, Next 16, Tailwind y `lucide-react`, que ya están instalados.
6. **Nunca se escriben datos de prueba en producción.** `.env.local` apunta a la base **real**. Para pruebas de navegador se usa un servidor con las variables de Supabase vacías (sección 7).
7. **Se conservan** el modo oscuro, el teclado, el foco visible, los objetivos táctiles de al menos 44 px, `prefers-reduced-motion` y los roles. Hoy se llaman `admin` y `editor`; en pantalla, «editor» se muestra como «Asesor».
8. **Una fase por commit o PR** (sección 5), sin mezclar fases. Cada entrega deja CI en verde.

## 3. Lo que ya existe y se reutiliza

**Proceso de venta**, en `src/lib/formatos/operation-workflow.ts`:
- `SALE_PROCESS`: las 6 etapas, cada una con `label`, `hace` y `para`.
- `processPhase(etapa, flujo, today)`: deriva la etapa a partir del estado interno. «Verificación y precio» y «Contrato y preparación» comparten el estado interno `documentacion` y se separan con `verificationComplete`.
- `processStageText` (texto de la etapa actual) y `requirementPhase` (a qué etapa pertenece cada requisito).
- `requiredReviews`, `reviewComplete`, `workflowBlockers` (qué falta para avanzar) y `publicationBlockers`.
- `ownerReportStatus` y `ownerReportApplies`: informe mensual al propietario.
- `WORKFLOW_ROUTES` y `stageLabel`: las rutas de compra, renta e inversión tienen sus propias etapas y usan el mismo diseño.
- `WORKFLOW_REQUIREMENTS`: la propiedad `noAplica` dice qué requisitos admiten «No aplica», y `vigencia` cuáles piden fecha de vigencia.

**Otras piezas:**
- `src/lib/formatos/expediente-operations.ts`: `EXPEDIENTE_ETAPAS` y `EXPEDIENTE_OPERACIONES`.
- `src/lib/admin/store.ts`: `apiRequest`, `fetchJson`, `loadAllDossiers`, `useCollection(db.*)`, `useSession` y `upsert`.
- `src/lib/utils.ts` (`formatDate`, `cn`) y `src/lib/finance/money.ts` (`formatAmount`, `formatAmountOrPending`).
- `src/components/admin/ui.tsx`: `PageHeader`, `Field`, `Badge`, `EmptyState`, `ErrorNotice`, `AsyncForm`, `AsyncButton`, `AsyncSelect` y `UploadControl`.
- `src/lib/apps/catalog.ts`: las 16 herramientas.

**Pantallas actuales que se reemplazan:**
- `src/app/admin/page.tsx` + `workspace/today.tsx` + `workspace/attention-queue.tsx`.
- `src/app/admin/expedientes/page.tsx` + `operation-workflow-panel.tsx` + `expediente-operation-panel.tsx` + `workspace/operation-brief.tsx`.
- `src/app/admin/operaciones/nueva/page.tsx` + `src/app/admin/entrevistas/[id]/page.tsx`.
- La navegación: `src/components/admin/admin-shell.tsx`, `workspace/navigation.tsx`, `workspace/module-catalog.ts`, `workspace/breadcrumbs.tsx`, `workspace/search.tsx` y `workspace/app-launcher.tsx`.

Cada archivo se lee antes de reemplazarlo. Se conserva su lógica de carga, guardado, conflictos de versión (409), protección de cambios sin guardar y permisos; solo cambia la presentación.

## 4. Decisiones de diseño ya tomadas

**Estilo: esquinas redondeadas y contraste** (decisión del titular, 16/10/2026)
- **Esquinas:** 10 px en botones, campos y selector; 14 px en tarjetas y estados vacíos; 12 px en avisos y opciones grandes; 8 px en los elementos del menú. Los estados de requisito son pastillas, y el panel inferior en celular lleva 18 px arriba.
- **Contraste:** las pantallas del panel guiado van sobre un fondo gris azulado (`--canvas`, #F3F5F9 en claro). Las tarjetas son blancas, con borde (`--border`) y sombra suaves (`--shadow-card`), para que no se pierdan con el fondo.
- **Botones secundarios y selector:** borde suave (`--edge-soft`) y sombra mínima (`--shadow-control`). Los campos conservan el borde de control (#61738A), que cumple el contraste mínimo.
- **Dónde se aplica:** solo en el panel guiado, con el componente `Surface` y los de `kit.tsx`. El sitio público no cambia, y las pantallas anteriores conservan su estilo hasta que se reemplazan.

**Navegación** (lienzo: `Sidebar`, `SidebarAdmin`, `BarraInferior` y `MenuMovil`)
- Barra lateral:
  - logotipo arriba y, debajo, el botón principal **«+ Nueva operación»**;
  - las secciones **Hoy** (con contador de pendientes), **Operaciones**, **Contactos**, **Inmuebles** y **Agenda**;
  - **Herramientas**, un solo acceso al catálogo de las 16;
  - **Administración**, plegada y solo para admin: **Equipo, Sitio web, Reportes, Historial y Configuración**;
  - al pie, el usuario y su rol.
- Desaparecen «Más», «Organizar menú» (reordenar arrastrando), la campana, los enlaces de etapas en el menú, la página puente «Documentos» y la ventana «Aplicaciones».
- En celular, barra inferior con **Hoy · Operaciones · + · Contactos · Menú**. El menú reúne Inmuebles, Agenda, Herramientas, Administración, modo oscuro y cerrar sesión.

**Rutas.** Las direcciones viejas redirigen; no quedan páginas huérfanas.

| Nueva | Contenido | Redirige desde |
|---|---|---|
| `/admin` | Hoy | — |
| `/admin/operaciones` | Tablero por etapas (`?etapa=<slug de SALE_PROCESS>` abre esa columna o pestaña) | `/admin/expedientes`, `/admin/proceso/[etapa]` |
| `/admin/operaciones/[id]` | Operación guiada | `/admin/expedientes?expediente=<id>` |
| `/admin/operaciones/nueva` | Asistente de nueva operación (incluye la entrevista) | `/admin/entrevistas/[id]` → paso de entrevista del asistente |
| `/admin/contactos` | Pestañas Prospectos / Clientes | `/admin/leads`, `/admin/clientes` (las fichas `/[id]` se conservan) |
| `/admin/agenda` | Pestañas Agenda / Tareas | `/admin/calendario`, `/admin/tareas` (`/admin/tareas/[id]` se conserva) |
| `/admin/herramientas` | Las 16 apps | `/admin/apps` (`/admin/apps/[slug]` se conserva) |

Se actualizan los enlaces internos, la búsqueda y las pruebas a las rutas nuevas.

**Hoy** (lienzo: `Main`, `HoyMovil`)
- Saludo, fecha y un resumen en una línea.
- **Esperan algo de ti:** operaciones con el motivo y un solo botón «Continuar». Se arma con `workflowBlockers`, requisitos marcados «Hay un problema», tareas vencidas y ofertas nuevas.
- **Entrevistas por terminar**, con «Seguir la entrevista».
- **Tareas de hoy**, que se marcan en la misma pantalla.
- **Agenda de hoy**, con las visitas destacadas.
- **Próximos 7 días** (pedido del titular): lo que vence pronto, para verlo antes de que sea urgente.
  - tareas con fecha en los próximos 7 días;
  - requisitos revisados cuya `vigenteHasta` cae en ese plazo;
  - informes mensuales al propietario que se cumplen en ese plazo (`ownerReportStatus`).
  - Todo se calcula con datos que ya existen; no requiere servidor nuevo.
- **Informes al propietario vencidos.**

**Avisos (notificaciones).** El titular quiere que el panel le avise de lo que está por vencer. En esta fase el aviso es **dentro del panel**: el contador de «Hoy» incluye lo vencido y lo que vence hoy, y «Próximos 7 días» anticipa lo demás. Las notificaciones fuera del panel (navegador, correo o WhatsApp) quedan como **fase posterior separada**: requieren consentimiento, un servicio de envío y una política de privacidad, igual que la entrega PWA-03 del plan. No se prometen en pantalla avisos que no existen.

**Operaciones** (lienzo: `OperacionesEscritorio`, `OperacionesMovil`)
- Tablero de 6 columnas en computadora (con desplazamiento horizontal si no caben) y pestañas por etapa en celular.
- Cada tarjeta muestra cliente, inmueble, «Sigue» y la fecha; lo vencido va en guinda y lo dice con palabras.
- Filtro «Mías / Todo el equipo»: «Todo el equipo» solo para admin.

**Operación guiada** (lienzo: `OperacionEscritorio*` y `OperacionMovil*`)
- **Encabezado:** regreso a Operaciones, cliente, folio, inmueble, precio («Precio que espera» o «Precio de salida», según la etapa) y responsable.
- **Avance de 6 etapas** numeradas del 1 al 6 («Lista», «Aquí vas»). En celular se lee «Etapa N de 6» con barra. Cambia también la numeración 0–5 que hoy usan las páginas de proceso.
- **Pestañas:** Lo que sigue · Documentos · Tareas · Historial · Ajustes.
- **Tarjeta «Lo que sigue»:**
  - «Qué hacemos / Para qué», tomado de `SALE_PROCESS`;
  - «Requisitos de esta etapa», con el contador «N de M revisados»;
  - cada requisito tiene su chip de estado: *Pendiente · Lo tengo · Revisado ✓ · Hay un problema · No aplica*. Corresponden a pendiente, recibido, revisado, observado y no_aplica. **«No aplica» solo aparece donde `WORKFLOW_REQUIREMENTS` lo admite.**
- **«Hay un problema»** muestra un aviso con el título, la explicación, quién lo marcó y desde cuándo, y acciones. Se guarda en el `soporte` del requisito.
- **Panel «Marcar como revisado»** (lateral en computadora, inferior en celular). Pide:
  - el documento que lo respalda: uno del expediente o un documento fuera del sistema;
  - quién lo revisó y la fecha;
  - la vigencia, cuando aplica;
  - **«Qué encontraste»**.
  - Lo técnico va en «Más detalles».
- **Próxima tarea** con fecha, y «Cambiar fecha».
- **Barra fija abajo:** «Te falta: …» enlaza cada requisito con su motivo, y el botón principal «Pasar a: <siguiente etapa>». Se deshabilita mientras `workflowBlockers` devuelva algo.
- **A un lado:** herramientas de la etapa (solo las de la etapa, ya con el contexto de la operación), la tarjeta del propietario (teléfono, correo, lo que quiere, cómo prefiere que lo contacten, Llamar y WhatsApp) y «¿Qué significa?».
- **Ajustes:** decisión del encargo, ruta, contraparte, corregir etapa con motivo y **eliminar con confirmación**. El texto debe decir la verdad: la operación eliminada **se puede restaurar** desde Operaciones eliminadas, como hoy. No decir «No se puede deshacer».
- Las etapas «Publicación y seguimiento» y «Visitas y ofertas» conservan el informe mensual y las visitas y ofertas del inmueble que ya existen.

**Nueva operación** (lienzo: `NuevaEscritorio*`, `NuevaMovil*`)
- **Asistente de 4 pasos:** ¿Qué quiere hacer el cliente? → ¿Quién es? (con aviso si el contacto ya existe) → Entrevista, una sección por pantalla, con «No sabe» → Listo.
- **La operación se crea al terminar la entrevista**, como hoy. Mientras tanto queda como borrador en Hoy › «Entrevistas por terminar». El botón del paso 3 dice «Terminar entrevista» y hay «Guardar y seguir después».

**Contactos, Inmuebles y Agenda** (lienzo: `Contactos*`, `Inmuebles*`, `Agenda*`)
- **Contactos:** tabla en computadora y lista en celular, con lo que busca cada persona, zona, presupuesto y el siguiente paso con fecha.
- **Agenda:** semana por horas en computadora y día por día en celular, con las visitas en guinda; pestaña de Tareas.

**Nombres sencillos de los requisitos** (se usan exactamente estos)

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

Los requisitos de renta e inversión que no están en la tabla reciben un nombre igual de sencillo, en el mismo estilo.

**Glosario para todo el panel**
- «Operación» siempre, nunca «expediente». El folio `EXP-…` se conserva.
- Recibido → **Lo tengo**. Revisado con soporte → **Revisado**. Observado → **Hay un problema**.
- Evidencia externa registrada → **Documento fuera del sistema**.
- Emisión conservada → **PDF generado**. Borrador versionado → **Borrador del documento**. Emitir PDF → **Generar PDF**. «Borrador v3» → **Versión 3**.
- Los avisos legales se reúnen en un solo «¿Qué significa?».
- Mensajes de estado: «Guardado», «No se pudo guardar: <motivo>». Sin jerga técnica («servidor», «colecciones», «versión», «RLS»).

**Decisiones por defecto** (el titular puede cambiarlas)
1. «Hoy» es la pantalla de inicio para todos los roles.
2. Una etapa anterior se corrige solo desde Ajustes › Corregir etapa, con motivo.
3. «Revisor de expediente» se muestra como **«Pendientes documentales»**. Cambia solo el título visible; el `slug` se conserva.

## 5. Fases, en este orden

Para cada fase:
- trabajar en la rama `feat/panel-guiado`, con un commit por fase;
- actualizar las pruebas;
- comparar la pantalla con su artboard a 390 y 1440 px, en claro y oscuro;
- registrar la entrega en `PLAN_ERP_CRM.md`. La regla del plan pide registrar cada entrega con su commit, pruebas y límites, y no marcar nada como publicado por haber hecho push.

1. **Base visual.**
   - Pasar los tokens de `fortius-panel.css` y `ds/fortius/tokens.json` a variables del panel, en claro y oscuro.
   - Crear los componentes de `Componentes.dc.html` en `src/components/admin/ui.tsx` o junto a él: `Button` (principal, secundario, discreto, enlace, peligro), `Chip` de estado de requisito, `Stepper` y barra de avance, `Card`, `Tabs`, `Segmented`, `Sheet` (lateral o inferior), `Notice`, `EmptyState` y campos.
   - Empezar a retirar `panel.module.css`. Meta al terminar: menos de 15 KB y sin clases que compitan con Tailwind.
2. **Estructura y navegación:** barra lateral, barra inferior y menú en celular, búsqueda, rutas nuevas y redirecciones.
3. **Hoy,** incluidos «Entrevistas por terminar» y «Próximos 7 días».
4. **Operaciones y operación guiada** (la fase más grande).
   - Dividir `expedientes/page.tsx` y `operation-workflow-panel.tsx` en componentes pequeños.
   - El mismo diseño sirve para las rutas de compra, renta e inversión.
5. **Nueva operación:** asistente de 4 pasos que une el alta y la entrevista.
6. **Contactos, Inmuebles, Agenda y Herramientas,** y el mismo estilo de lista para Administración.
7. **Repaso final:**
   - recorrer todo el panel con el glosario;
   - eliminar los componentes y el CSS que quedaron sin uso;
   - verificar que no queden rutas ni enlaces rotos.

## 6. Criterios de terminado por fase

- La pantalla coincide con su artboard en composición, textos, estados y comportamiento, en las dos vistas y los dos modos. Las diferencias que no se puedan evitar se explican.
- Funciona con teclado, el foco es visible y no hay desbordamiento horizontal a 320, 390, 768 y 1440 px.
- Datos, permisos, conflictos de versión y avisos de cambios sin guardar se comportan igual que antes.
- `npm run verify` pasa: lint, tipos, pruebas de backend y del panel, y compilación.
- También pasan `node --test tests/tools/*.test.mjs`, `node tools/verify-pdf-bundle.mjs`, `npm run test:public:browser` y las pruebas de navegador del panel que corre CI (`.github/workflows/verify.yml`).
- Las pruebas que dependían de la interfaz anterior se actualizan para cubrir el mismo comportamiento con la nueva. No se borran para que pasen.

## 7. Cómo probar sin tocar la base real

`.env.local` apunta a la base de producción. Para las pruebas de navegador del panel se compila y se levanta un servidor **sin backend**, como hace CI:

```bash
NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_ANON_KEY= SUPABASE_SERVICE_ROLE_KEY= npm run build
```
```bash
NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_ANON_KEY= SUPABASE_SERVICE_ROLE_KEY= npx next start --hostname 127.0.0.1 --port 3105
```
```bash
FORTIUS_INMUEBLES_TEST_URL=http://127.0.0.1:3105 npx playwright test --config playwright.admin.config.ts
```

Next conserva las variables vacías del proceso por encima de `.env.local`. Antes de probar se comprueba que `http://127.0.0.1:3105/api/health` responde `{"status":"unavailable"}`. Las pruebas públicas (`npm run test:public:browser`) levantan su propio servidor falso. En el panel real con la sesión del titular solo se navega, sin guardar.

## 8. Qué se entrega en cada fase

- Qué pantallas cambiaron y qué rutas redirigen.
- Capturas de comparación con el artboard.
- Resultado de cada comando de la sección 6, con el número de pruebas.
- Lo que no se pudo verificar y por qué.
- Cualquier decisión tomada que no esté en este documento, para que el titular la confirme.
