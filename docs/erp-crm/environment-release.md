# Entornos y publicación de Fortius

Referencia de la configuración y sus límites al corte del 12/10/2026. La configuración del proveedor no se releyó durante esta limpieza; comprobarla antes de publicar.

## Estado posterior a la integración

GitHub confirma `main=1e763345`, repositorio público y `protected=false`. Los fundamentos se integraron en `36e3ba64` mediante [PR #15](https://github.com/M01535NT/fortius-inmuebles/pull/15); [Verify 38327265116](https://github.com/M01535NT/fortius-inmuebles/actions/runs/38327265116) finalizó success para ese SHA. El PR documenta publicación productiva y comprobación del dominio. Esta actualización releyó GitHub; la configuración Vercel/Supabase y los recorridos productivos posteriores son evidencia registrada, no una nueva lectura de esos proveedores.

## Control nativo activado

Se configuró un Deployment Check en cada proyecto:

- Fuente: GitHub; nombre externo exacto del job `verify`, perteneciente al workflow `.github/workflows/verify.yml`.
- Requisito: `build-ready`; bloquea `deployment-alias`; ámbito final: producción.
- Fortius: `chk_bed0e675-11a4-4100-9ce1-e2c4b6a84b3c`.
- Proyecto adicional: `chk_be048572-df37-489b-9ec8-0096fbe909fc`.
- Timeout solicitado: 1,800 segundos. No se agregó un servicio, workflow de deploy ni dependencia.

Este control retiene la asignación de dominios cuando falta o falla el check; **no impide que exista el build ni su URL de despliegue**. La protección de acceso de Vercel sigue siendo necesaria. Una cuenta autorizada que cambie configuraciones puede eludir controles: esto no es una frontera frente al administrador del proveedor.

Durante la prueba controlada se amplió temporalmente el ámbito del check Fortius a preview, conservando producción. Se comprobó el fallo y el paso a verde, y se restituyó el ámbito a producción mediante PATCH y lectura posterior. Los recibos negativo y positivo se conservan en la copia externa `workspace-before.zip`, dentro de `docs/erp-crm/iterations/`; el [plan único](../../PLAN_ERP_CRM.md) resume su alcance. Esa prueba de mecanismo no creó ni promovió un despliegue de producción.

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
- Metadata de GitHub, checks por SHA y configuración Vercel consultadas mediante sesión autorizada. La evidencia cronológica anterior se conserva fuera del repositorio; el avance está en [el plan único](../../PLAN_ERP_CRM.md).
