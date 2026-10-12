# Entornos y controles de publicación — Fortius

Fecha de lectura y cambios autorizados: 12/10/2026. Repositorio: `M01535NT/fortius-inmuebles`. La carpeta local conserva el nombre histórico `/workspace/mnt-inmuebles`; su remoto es el repositorio Fortius.

## Evidencia y autorización

- Moisés autorizó hacer público el repositorio y proteger main. La conexión GitHub de Codex rechazó ambos cambios con HTTP 403 `Resource not accessible by integration`. Moisés cambió la visibilidad desde GitHub: `visibility=public` confirmado por API. Esto resuelve la restricción del plan privado; **no concede al token permisos administrativos**.
- Antes del cambio se inspeccionaron las 15 ramas de GitHub: 2,257 blobs alcanzables, 50,993,412 bytes. La búsqueda por patrones de credenciales y coincidencias con secretos del entorno no encontró credenciales; el patrón parecido a una clave en un SVG pertenece al bloque `plantuml-src` comprimido. Esta comprobación no garantiza que toda información sea adecuada para difusión. Código, migraciones, formatos, documentación e historial son públicos por autorización expresa.
- Main continúa en `4faaa123`, `protected=false`. GITHUB_ADMIN_TOKEN ya fue incorporado al entorno, pero el intermediario sigue autenticando las peticiones como la integración de Codex y la API deniega Administration. No guardar el valor en archivos Git ni chat.
- Vercel: sesión autorizada por flujo oficial de dispositivo. CLI 63.1.2 consultada desde artefacto npm con integridad SRI comprobada, sin instalar dependencias. Sesión temporal: no equivale a un token persistente del entorno.
- Supabase: 18 tablas públicas Fortius con RLS y 22 migraciones; cinco buckets, solo uno público. No se consultaron registros de clientes ni se modificó SQL.

## Vercel real

| Proyecto | Fuente / entorno productivo | Dominios |
|---|---|---|
| fortius-inmuebles | GitHub Fortius, main; Next.js y Node.js 24.x | fortiusinmuebles.com; www redirige al principal; aliases Fortius. |
| mnt-inmuebles | El mismo GitHub Fortius, main; Next.js y Node.js 24.x | mnt-inmuebles.vercel.app; cota-eight redirige a MNT. |

Ambos están en el equipo tonala, plan Hobby. Protección Vercel `all_except_custom_domains` y protección de forks activas. La web pública y el panel comparten despliegue. El proyecto MNT sigue activo: no fue eliminado, retirado ni redirigido como parte de esta tarea.

La historia confirmó que commits `4c0c0d2` y `7b9cd68` tuvieron workflow Verify fallido y despliegues productivos READY. Por eso proteger únicamente el merge no era suficiente.

## Control nativo activado

Se configuró un Deployment Check en cada proyecto:

- Fuente: GitHub; nombre externo exacto del job `verify`, perteneciente al workflow `.github/workflows/verify.yml`.
- Requisito: `build-ready`; bloquea `deployment-alias`; ámbito final: producción.
- Fortius: `chk_bed0e675-11a4-4100-9ce1-e2c4b6a84b3c`.
- MNT: `chk_be048572-df37-489b-9ec8-0096fbe909fc`.
- Timeout solicitado: 1,800 segundos. No se agregó un servicio, workflow de deploy ni dependencia.

Este control retiene la asignación de dominios cuando falta o falla el check; **no impide que exista el build ni su URL de despliegue**. La protección de acceso de Vercel sigue siendo necesaria. Una cuenta autorizada que cambie configuraciones puede eludir controles: esto no es una frontera frente al administrador del proveedor.

Durante la prueba controlada se amplió temporalmente el ámbito del check Fortius a preview, conservando producción. Se comprobó el fallo y el paso a verde, y se restituyó el ámbito a producción mediante PATCH y lectura posterior. Ver evidencia negativa y positiva de la iteración. No se creó ni promovió un despliegue de producción en esta tarea.

## Previews y datos

Se retiró el ámbito preview de `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` en ambos proyectos y de `FORTIUS_INMUEBLES_PUBLIC_LEADS_ENABLED` en Fortius. Los valores y ámbitos de producción se conservaron; no se imprimieron ni copiaron claves.

Quitar solo service_role no basta: el panel usa sesión del usuario y RLS para operaciones normales (`backend/auth.ts`, `backend/repository.ts`). Los **nuevos previews** carecen del backend productivo; hasta configurar un backend de pruebas, las páginas dinámicas pueden mostrar indisponibilidad. No presentar este estado como un entorno de ensayo completo. Los despliegues previos pueden conservar variables antiguas: el cambio de ámbito no las revoca retroactivamente; mantienen la protección de Vercel. No se borraron despliegues antiguos ni se rotaron claves productivas.

## Protección main preparada

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
- Metadata de GitHub, checks por SHA y configuración Vercel consultadas mediante sesión autorizada. Evidencia resumida en [iteración 1](iterations/01-foundation.md).
