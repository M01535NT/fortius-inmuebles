# Entornos y publicación de Fortius

Referencia de la configuración y sus límites. La lectura más reciente de los tres proveedores es del 12/11/2026 (sección siguiente). Las secciones posteriores conservan la evidencia del 12/10/2026 y lo que sigue vigente de ella. Comprobar la configuración antes de publicar.

## Lectura del 12/11/2026 (solo lectura)

Se leyó la configuración con la sesión del titular, sin cambiar nada y sin ver valores de variables.

**GitHub (CI-01).**

- La regla «main exige verify» (ruleset 25333749) está activa sobre la rama por defecto y exige el check `verify` de GitHub Actions. No exige rama actualizada ni PR. El rol de administrador del repositorio puede saltarla siempre (`bypass_mode: always`), y el titular es el único colaborador, con rol de administrador.
- No hay protección de rama clásica (la API responde 404); la regla anterior la sustituye.
- Se permite la integración automática y se borra la rama al integrar; se admiten merge, squash y rebase.
- Actions: permisos por defecto de solo lectura; los workflows no pueden aprobar PR; se permiten todas las acciones (sin fijarlas por SHA). No hay secretos ni variables de Actions.
- Escaneo de secretos, protección al subir y alertas de Dependabot: **activados el 12/11/2026** (sin alertas abiertas de secretos al activarlos). Las actualizaciones automáticas de Dependabot siguen desactivadas a propósito: abrirían PR sin acuerdo del titular.
- Los entornos de despliegue no tienen reglas de protección. Los viejos (`Production – mnt-inmuebles`, `Production – fortius` y sus previews, sin despliegues desde el 18/10/2026) **se borraron el 12/11/2026**; en Vercel solo existe el proyecto `fortius-inmuebles`. Quedan `Production`/`Preview`, `Production – fortius-inmuebles`/`Preview – fortius-inmuebles` y `respaldo`.

**Vercel (ENV-01).**

- El equipo solo tiene un proyecto conectado a este repositorio: `fortius-inmuebles` (`prj_mCgnplUXyiI0YFnL6Fr2zVLmSzJv`), con rama de producción `main` y Node 24.x. El «proyecto adicional» del check `chk_be048572…` **ya no aparece** en el equipo; sus últimos despliegues son del 18/10/2026.
- El Deployment Check `Fortius · Verify` (`chk_bed0e675…`) sigue vigente: requiere `build-ready`, bloquea `deployment-alias`, ámbito producción, 1,800 s.
- Protección `all_except_custom_domains`, sin contraseña; protección de forks activa; sin deploy hooks ni crons.
- Dominios: `fortiusinmuebles.com`; `www` redirige con 308; `fortius-inmuebles.vercel.app` y `fortius-alpha.vercel.app` asignados al proyecto.
- Variables (solo nombre y ámbito):
  - Producción: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `FORTIUS_INMUEBLES_SITE_URL` (también en preview) y `FORTIUS_INMUEBLES_PUBLIC_LEADS_ENABLED` (cambiada el 12/11/2026; no se leyó el valor).
  - Producción, añadidas el 18/10/2026 por la integración de Supabase: `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`, `POSTGRES_USER`, `POSTGRES_HOST`, `POSTGRES_PASSWORD`, `POSTGRES_DATABASE`, `SUPABASE_URL`, `SUPABASE_JWT_SECRET`, `SUPABASE_ANON_KEY`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. **El código no usa ninguna.** **Borradas el 12/11/2026**, después de apagar en Supabase (Integrations → Vercel) la sincronización hacia producción, que las volvía a crear. Quedan cinco variables, todas puestas a mano: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `FORTIUS_INMUEBLES_SITE_URL` y `FORTIUS_INMUEBLES_PUBLIC_LEADS_ENABLED`. La integración de GitHub de Supabase (migraciones al integrar en `main`) sigue activa.
  - Preview limitado a `codex/erp-crm-preview`: URL, clave anónima y `SUPABASE_SERVICE_ROLE_KEY` de la base actual (excepción del 12/10/2026). Preview limitado a `cursor/sitio-publico-portal-b656` (26/10/2026, sin documentar): URL y clave anónima. Las dos ramas ya no existían en GitHub. **Las cinco entradas se borraron el 12/11/2026** con autorización del titular; las de producción no cambiaron.
  - Los previews generales siguen sin backend.

**Supabase (ENV-01, AUT-01).** Lectura con la clave anónima (`/auth/v1/settings`) y con la de servicio (lista de buckets). El conector `supabase-fortius` no estaba autorizado en esta sesión.

- Proyecto `qkkirjzhviqwvuqjnmei`. Registro abierto desactivado; solo acceso por correo, sin SAML ni proveedores externos; la confirmación de correo es obligatoria.
- Buckets: `fortius-inmuebles-public` (público) y, privados, `fortius-inmuebles-private`, `-expedientes`, `-comercial`, `-staging` y `fortius-app-integrations`, todos con 20 MB de máximo.
- La integración Supabase–GitHub publica el check «Supabase Preview» en cada commit. Según lo registrado con el titular, Supabase aplica las migraciones al integrar en `main`.
- No se pudo leer sin la API de administración: correo saliente propio (SMTP), URL de retorno permitidas, MFA disponible y copias/PITR actuales (la última lectura, del 12/10/2026, informó `pitr_enabled=false` y `backups=[]`).

**Acceso (AUT-01), según el código.** El panel tiene inicio de sesión, cambio de contraseña y recuperación por correo (`requestRecovery` en `src/lib/backend/auth.ts`). El código no tiene invitación de personal ni MFA; USR-01 las cubrirá. La entrega real de correos no se probó: requiere un buzón de prueba autorizado.

**Copia diaria (12/11/2026).** Nuevo flujo `Respaldo diario` (`.github/workflows/backup-daily.yml`), solo en `main`, con secretos en el entorno de GitHub `respaldo` limitado a `main`. El entorno se creó el 12/11/2026 con sus siete secretos y la política de rama `main` ([copia diaria](respaldo-diario.md)).

### Cambios de proveedor propuestos (no aplicados)

1. ~~**Vercel:** borrar las cinco entradas de preview de las ramas eliminadas `codex/erp-crm-preview` y `cursor/sitio-publico-portal-b656`.~~ **Hecho el 12/11/2026.** Los despliegues de vista previa ya creados conservan sus variables hasta que se borren; están detrás de la protección de Vercel.
2. **Vercel:** ~~quitar las 13 variables de la integración de Supabase que el código no usa~~ **Hecho el 12/11/2026**, con la sincronización de Supabase hacia Vercel apagada para que no vuelvan. Si algún día se rota una clave que sí se usa, hay que cambiarla a mano en Vercel.
3. **GitHub:** ~~activar el escaneo de secretos, la protección al subir y las alertas de Dependabot~~ **Hecho el 12/11/2026.**
4. **GitHub:** ~~borrar los entornos de despliegue sin uso (`* – mnt-inmuebles`, `* – fortius`)~~ **Hecho el 12/11/2026**, tras confirmar que ningún flujo, regla ni proyecto de Vercel los usa.
5. **GitHub (decide el titular):** la regla deja que el administrador la salte. Mientras sea la única cuenta, conviene conservarla así y no saltarla salvo urgencia (I-04).
6. **Recuperación de la aplicación:** ~~ensayar el rollback de Vercel~~ **Ensayado el 12/11/2026** (ida y vuelta en ~2 s cada una; el sitio respondió con ambas versiones). Pasos y límites en [despliegue](../deployment-fortius.md#regresar-a-la-versión-anterior-ensayado-el-12112026).
7. **Supabase:** ~~autorizar el conector de solo lectura `supabase-fortius`~~ **Autorizado el 13/11/2026.** Sirve para el historial de migraciones, el esquema y el asesor de seguridad ([acceso](access-policy.md)). No lee SMTP, URL de retorno, MFA ni copias del proveedor: eso sigue en el panel de Supabase o con un token de administración de solo lectura.
8. **Regreso de la aplicación y esquema (CI-01):** compatibilidad de la publicación del 13/11/2026 revisada; regla y tabla en [despliegue](../deployment-fortius.md#compatibilidad-del-esquema-al-regresar-ci-01-revisado-el-13112026).

## Estado posterior a la integración

GitHub confirma `main=1e763345`, repositorio público y `protected=false`. Los fundamentos se integraron en `36e3ba64` mediante [PR #15](https://github.com/M01535NT/fortius-inmuebles/pull/15); [Verify 38327265116](https://github.com/M01535NT/fortius-inmuebles/actions/runs/38327265116) finalizó success para ese SHA. El PR documenta publicación productiva y comprobación del dominio. Esta actualización releyó GitHub; la configuración Vercel/Supabase y los recorridos productivos posteriores son evidencia registrada, no una nueva lectura de esos proveedores.

## Control nativo activado

Se configuró un Deployment Check en cada proyecto:

- Fuente: GitHub; nombre externo exacto del job `verify`, perteneciente al workflow `.github/workflows/verify.yml`.
- Requisito: `build-ready`; bloquea `deployment-alias`; ámbito final: producción.
- Fortius: `chk_bed0e675-11a4-4100-9ce1-e2c4b6a84b3c`.
- Proyecto adicional: `chk_be048572-df37-489b-9ec8-0096fbe909fc` (el proyecto ya no aparece en el equipo al 12/11/2026).
- Timeout solicitado: 1,800 segundos. No se agregó un servicio, workflow de deploy ni dependencia.

Este control retiene la asignación de dominios cuando falta o falla el check; **no impide que exista el build ni su URL de despliegue**. La protección de acceso de Vercel sigue siendo necesaria. Una cuenta autorizada que cambie configuraciones puede eludir controles: esto no es una frontera frente al administrador del proveedor.

Durante la prueba controlada se amplió temporalmente el ámbito del check Fortius a preview, conservando producción. Se comprobó el fallo y el paso a verde, y se restituyó el ámbito a producción mediante PATCH y lectura posterior. Los recibos negativo y positivo se conservan en la copia externa `workspace-before.zip`, dentro de `docs/erp-crm/iterations/`; el [plan único](../../ROADMAP.md) resume su alcance. Esa prueba de mecanismo no creó ni promovió un despliegue de producción.

## Previews y datos

Se retiró el ámbito preview de `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` en ambos proyectos y de `FORTIUS_INMUEBLES_PUBLIC_LEADS_ENABLED` en Fortius. Los valores y ámbitos de producción se conservaron; no se imprimieron ni copiaron claves.

Quitar solo service_role no basta: el panel usa sesión del usuario y RLS para operaciones normales (`backend/auth.ts`, `backend/repository.ts`). Los **nuevos previews** carecen del backend productivo; hasta configurar un backend de pruebas, las páginas dinámicas pueden mostrar indisponibilidad. No presentar este estado como un entorno de ensayo completo. Los despliegues previos pueden conservar variables antiguas: el cambio de ámbito no las revoca retroactivamente; mantienen la protección de Vercel. No se borraron despliegues antiguos ni se rotaron claves productivas.

### Excepción autorizada: codex/erp-crm-preview

**12/11/2026:** la rama ya no existía en GitHub; sus tres variables se borraron de Vercel ese día. La excepción terminó.

El 12/10/2026 Moisés autorizó conectar únicamente `codex/erp-crm-preview` a la base actual de Fortius y, de forma expresa, reutilizar `SUPABASE_SERVICE_ROLE_KEY` como secreto del servidor de esa rama. En Vercel se añadieron entradas independientes para `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY`, con ámbito Preview y restricción a esa rama. Las entradas de Production se conservaron; no se habilitó el backend para todos los previews ni se cambió el código de permisos.

Esta rama comparte datos reales y permite las operaciones de los usuarios autorizados; no es una base de pruebas aislada. La clave privada no usa prefijo público y se guarda como Secret. La copia temporal utilizada para importarla se eliminó, sin modificar `.env.local`. La verificación de la conexión no autoriza cuentas nuevas, correos ni escrituras de ensayo sobre expedientes reales. Los cambios de variables requieren un despliegue nuevo; el anterior conserva su configuración.

## Protección main preparada

**Configuración vigente en GitHub (comprobada el 25/10/2026):** `main` no tiene la protección de rama descrita en esta sección; la controla la regla «main exige verify» (creada el 17/10/2026): el check `verify` debe aprobarse para integrar, no exige rama actualizada y los administradores pueden saltarla. El repositorio permite integración automática y, desde el 25/10/2026, borra la rama de cada PR al integrarlo. Quién decide publicar está en `AGENTS.md` (I-04).

**Cuándo corre Verify (decisión del titular, 12/11/2026):** no en cada cambio. El trabajo del día vive en un PR en borrador (draft); sus pushes no disparan Verify (el job queda «skipped», y un borrador no se puede integrar). Verify corre al marcar el PR «Ready for review» y en los pushes posteriores, en cada push a `main` (el Deployment Check de Vercel lo necesita para asignar el dominio de producción) y a mano con «Run workflow» en Actions. Si llega un push nuevo mientras corre, la corrida anterior del mismo PR se cancela. La regla «main exige verify» no cambia.

Archivo revisable: [configuración](github-main-protection.json).

Requiere PR, check `verify` de GitHub Actions (app 15368), rama actualizada, conversaciones resueltas y aplica también a administradores. Prohíbe force-push y eliminar main. Revisión humana obligatoria: cero aprobaciones por ahora, para evitar exigir a Moisés una segunda cuenta inexistente; el requisito de PR y pruebas se mantiene. Incorporar revisión por otra persona cuando exista un equipo autorizado.

La integración actual no puede aplicar ni leer la configuración administrativa. REST PUT/GET protection y GraphQL branchProtectionRules devolvieron denegación. La comprobación de enrutamiento (GET /user, con token solicitado, sin Authorization y con una cadena deliberadamente inválida) devolvió en todos los casos el mismo usuario, OAuth client y vencimiento de la integración: no se usó una sesión administrativa distinta. No extraer credenciales del proxy ni intentar eludirlo. Resolver permisos de la conexión mediante un mecanismo soportado, o aplicar la regla desde GitHub. No declarar protegida main por haber preparado el JSON.

## Preflight local

`node tools/fortius-release-check.mjs` exige árbol limpio y última actividad de Verify del HEAD exacto concluida con éxito. Ordena correctamente reruns. Lee GitHub; no despliega ni activa por sí mismo reglas del proveedor. Complementa, no sustituye, los controles nativos.

## Recuperación y límites

La API de backups Supabase devolvió `pitr_enabled=false`, `backups=[]` y sin ventana física informada. Esto **no prueba ausencia de todas las copias externas**, pero no permite dar por existente una recuperación gestionada del proveedor. Ver [recuperación](recovery-policy.md).

Pendientes: custodia y destino aislado aprobados, Auth/Storage recuperados con prueba y backend de preview separado. Moisés aprobó el objetivo inicial de copia diaria y recuperación en hasta ocho horas; aún no es capacidad demostrada. La aprobación para desarrollar no autoriza compras, restaurar producción ni dar por aprobado un plazo de recuperación.

## Fuentes del control

- [Vercel Deployment Checks](https://vercel.com/docs/deployment-checks).
- OpenAPI oficial `https://openapi.vercel.sh`: `/v2/projects/{projectIdOrName}/checks` y `/v9/projects/{idOrName}/env/{id}`.
- Metadata de GitHub, checks por SHA y configuración Vercel consultadas mediante sesión autorizada. La evidencia cronológica anterior se conserva fuera del repositorio; el avance está en [el plan único](../../ROADMAP.md).
