# Panel viejo (`/admin`): qué es legado y cómo no estorba

**Decisión del titular, 16/11/2026:** los bocetos del panel nuevo mandan sobre lo ya construido. El panel viejo va a desaparecer en su momento (etapa PN-12 de `PLAN.md`). Mientras tanto sigue en pie, porque es lo que se usa hoy.

## Reglas para que el viejo no interfiera

1. **El panel nuevo vive aparte.** Ruta `/panel`; código en `src/app/panel/`, `src/components/panel/` y `src/lib/panel/`. Estilos propios bajo `.panel-root` (`src/app/panel/panel-ds.css`): no tocan el sitio ni `/admin`.
2. **Un solo puente.** El panel nuevo toca el viejo únicamente por `src/lib/panel/legado/` (hoy, la sesión). Una regla de ESLint (`eslint.config.mjs`) rechaza cualquier otra importación de `@/components/admin`, `@/lib/admin` o `@/app/admin` desde el código nuevo, y rechaza que el viejo importe del nuevo. Al retirar el viejo se reemplaza esa carpeta y no cambia nada más.
3. **No se construye nada nuevo en `/admin`.** Solo se toca por seguridad, caída del sitio o un error que bloquee el trabajo diario. Las mejoras van al panel nuevo.
4. **El backend es compartido, no legado.** `src/lib/backend/`, `src/app/api/` y `supabase/migrations/` sirven a los dos paneles. Un cambio de base se hace con una migración nueva, aditiva cuando se pueda, para que el viejo siga funcionando hasta su retiro, y con aviso previo al titular.
5. **Lo único compartido con el sitio público** es el cascarón raíz (`src/app/layout.tsx`), que trata `/panel` igual que `/admin` (sin encabezado ni pie del sitio), y una línea de `src/app/globals.css`: `@import "tw-animate-css"` (16/11/2026), que agrega las clases de entrada y salida de los componentes flotantes del panel (`animate-in`, `fade-in`…). No cambia nada del sitio mientras el sitio no use esas clases; si estorbara, se mueve a una hoja propia del panel.
6. **El panel viejo no se retira mientras tenga una sección viva sin reemplazo.** Las secciones sin boceto (tabla de abajo) se quedan en él hasta que se decida su destino.

## Qué reemplaza a qué

| Ruta vieja | Sección nueva | Etapa | Nota |
| --- | --- | --- | --- |
| `/admin` (inicio) | Hoy | PN-04 | |
| `/admin/agenda`, `/admin/tareas` | Agenda y Hoy (pendientes) | PN-04 | Una sola tabla de pendientes (auditoría AUD-01, hallazgo 3) |
| `/admin/clientes`, `/admin/contactos` | Personas | PN-03 | |
| `/admin/propiedades` | Inmuebles | PN-03 | |
| `/admin/operaciones`, `/admin/entrevistas`, `/admin/notas`, `/admin/historial` | Asuntos (guías, notas internas y actividad) | PN-04 | |
| `/admin/leads` | Consultas | PN-05 | Incluye el formulario del sitio (COR-21) |
| `/admin/archivos` | Bandeja y Formatos | PN-06 | |
| `/admin/tramites` | Trámites | PN-07 | Se migran a asuntos (TRA-01) |
| `/admin/control-comercial` | Dinero | PN-08 | A confirmar: parte son reportes |
| `/admin/herramientas`, `/admin/perfil`, `/admin/asesores` | Herramientas y Configuración | PN-09 | |
| `/admin/reportes` | **Sin boceto** | por decidir | Resumen del negocio para el director; falta dibujarlo |
| `/admin/blog`, `/admin/contenido` | **Sin boceto** | por decidir | Contenido del sitio público; no es gestión del negocio |
| `/admin/apps`, `/admin/ayuda`, `/admin/papelera`, `/admin/sistema` | **Sin boceto** | por decidir | Papelera (eliminación recuperable) y sistema deben tener lugar antes del retiro |

## Qué se conserva del viejo (como lógica, no como pantalla)

Contratos y validación del servidor, versiones y conflictos 409, eliminación recuperable, formatos y documentos (`src/lib/formatos`), calculadoras, folios automáticos en la base y lectura de archivos. Lo que ya está resuelto y probado no se vuelve a escribir: el panel nuevo lo reutiliza por las mismas funciones del servidor.

## Archivos de diseño que dejan de mandar

El rediseño anterior (LV-09) se retiró del repositorio el 16/11/2026; queda en la historia de git. Mandan `DECISIONES.md`, el prototipo aprobado y `sistema-fortius/`.
