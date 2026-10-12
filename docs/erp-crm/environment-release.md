# Entornos y controles de publicación — Fortius

Fecha de lectura: 12/10/2026. Solo metadata y configuración seleccionada, sin registros de clientes.

## Evidencia actual

- GitHub: main en `4faaa123`, `protected=false`. Metadata del repositorio indica permisos administrativos, pero API de rulesets responde 403: se requiere GitHub Pro o repositorio público para habilitar esa función en el plan actual. Es una limitación del producto contratado, no prueba de token inválido.
- Vercel: no se encontró token ni configuración de autenticación en las ubicaciones del entorno comprobadas. No se comprobaron configuración administrativa, ámbitos de variables, promoción ni estado del proyecto antiguo.
- Supabase: catálogo de 18 tablas públicas Fortius con RLS habilitado; 22 versiones en schema_migrations, incluida `20261010131109`. Buckets: público, privado, staging, expedientes y comercial; solo el bucket público tiene `public=true`. Límite observado: 20 MiB.
- Auth: `site_url=https://fortiusinmuebles.com/admin`; allowlist incluye Fortius y URLs históricas/locales. No retirar URLs históricas sin inventario de uso.

## Matriz a completar

| Entorno | Fuente Git / datos | Estado |
|---|---|---|
| Desarrollo/pruebas locales | Rama foundation; API mock y PGlite; sin clientes | Pruebas locales registradas en la iteración. |
| Preview Vercel | Variables y proyecto de datos por confirmar | NO VERIFICADO; no asumir aislamiento por etiqueta Preview. |
| Producción Vercel | Main y Supabase vigente, relación administrativa por confirmar | Configuración NO VERIFICADA; no promover desde esta tarea. |
| Recuperación | Destino aislado del proveedor aún no aprobado | Pendiente; copia local de bytes no sustituye este entorno. |

## Preflight local implementado

```bash
node tools/fortius-release-check.mjs
```

Exige árbol Git limpio y la última actividad de ejecución de Verify del commit HEAD exacto en push/PR, concluida con éxito. Considera tiempos de intento/actualización: created_at original no basta para ordenar reruns. Una ejecución pendiente/fallida, metadata insuficiente, un workflow distinto o una verificación de otro commit bloquean el preflight. Consulta GitHub en lectura; no llama Vercel ni despliega.

Este comando es una comprobación previa. **No bloquea por sí mismo los despliegues automáticos de Vercel ni una publicación que lo omita.** Debe integrarse en el flujo real después de comprobar configuración y acceso.

## Alternativas a revisar con Moisés

1. GitHub Pro para repositorio privado, reglas de rama y checks requeridos; verificar además que Vercel espere el flujo aprobado, porque proteger merge y proteger publicación son controles distintos.
2. Mantener plan GitHub actual y usar despliegue de producción controlado: deshabilitar promociones automáticas incompatibles en Vercel y ejecutar deploy solo desde un job que dependa de Verify, con credencial limitada y autorización de publicación. Confirmar funciones/plan de Vercel y revisar bypass administrativos.

No hacer público el repositorio como solución automática ni contratar planes sin decisión expresa. No añadir un workflow de deploy que parezca activo mientras falten credencial y configuración del proveedor.

## Para declarar CI-01 aceptado

Configurar el flujo elegido, fallar una comprobación en candidato/preview controlado, comprobar que no llega a producción y después probar el flujo autorizado a verde. Registrar commit/check/promoción y procedimiento de rollback compatible con el esquema. Hasta entonces CI-01 y parte de ENV-01 siguen bloqueados.
