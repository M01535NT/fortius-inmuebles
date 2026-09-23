# Lote editorial MNT Inmuebles — septiembre de 2026

Doce artículos originales en español, revisados el 23 de septiembre de 2026. Los JSON son la copia editorial inicial; después de publicarlos, el panel administra las versiones vigentes en Supabase. Editar estos archivos por sí solo no cambia la web.

| Archivo | Tema | Palabras visibles |
|---|---|---:|
| 01.json | Valor de una casa en Tijuana | 932 |
| 02.json | Documentos para vender en Baja California | 954 |
| 03.json | Propiedad anunciada que no se vende | 988 |
| 04.json | Compra con ingresos de Estados Unidos | 922 |
| 05.json | Presupuesto completo de compra | 963 |
| 06.json | Revisión previa a un apartado | 975 |
| 07.json | Preparación de una casa para vender | 978 |
| 08.json | Comprar o rentar | 940 |
| 09.json | Compra de terrenos | 879 |
| 10.json | Elección de local comercial | 937 |
| 11.json | Renta, selección, contrato y entrega | 908 |
| 12.json | Servicio de una inmobiliaria al vender | 947 |

Cada artículo incluye fuentes primarias enlazadas, fecha de revisión, resumen, slug estable, dos lecturas relacionadas y una llamada a una ruta existente. Se consultaron fuentes oficiales de Baja California, Tijuana, SAT, SHF, INDAABIN, CONDUSEF, RAN, Cámara de Diputados y DOF; la opción crediticia descrita remite a su proveedor, BBVA. No se incluyen estadísticas de mercado, contactos ni precios reales inventados. El ejemplo de flujo mensual del artículo 08 es ficticio y está identificado como tal.

## Formato admitido

Párrafos separados por líneas vacías, `##` para secciones, `###` para subsecciones, `- ` para viñetas, `1. ` para listas numeradas y `[texto](https://fuente)` para enlaces. Las rutas internas comienzan por `/`. El HTML se muestra como texto; no se ejecuta. No hay imágenes nuevas ni migración de esquema.

## Validación y publicación

Validar localmente, sin red:

```powershell
node tools/mnt-publish-blog.mjs
```

Validar también contra el proyecto existente, sin escribir:

```powershell
node --env-file=.env.local tools/mnt-publish-blog.mjs --check-remote
```

Después de desplegar y comprobar el renderer, publicar el lote autorizado:

```powershell
node --env-file=.env.local tools/mnt-publish-blog.mjs --publish
```

El publicador exige el origen HTTPS exacto del proyecto MNT, usa la credencial de servicio existente exclusivamente en Node, valida cada registro mediante la función existente y realiza un único INSERT atómico. No usa upsert ni cambia permisos. Un ID o slug existente con contenido diferente detiene el lote; una repetición con las doce entradas idénticas ya publicadas no escribe nada.

Antes de insertar guarda el inventario y un manifiesto SHA-256 en `.superpowers/blog-12/publication-<fecha>/`, excluido de Git. Después compara los hashes persistidos y las versiones previas. No registrar ni copiar credenciales a documentos o informes.

## Revisión y retirada

Las modificaciones posteriores se hacen en `/admin/blog`, conservando los slugs. Para retirar un artículo se cambia su estado a borrador desde el panel; no es necesario borrarlo. Verificar después que la ruta pública devuelve 404 y desaparece del listado y del sitemap. No volver a ejecutar el lote para sobrescribir cambios editoriales.

Revisar condiciones comerciales del crédito cuando cambien y la Ley de Ingresos de Tijuana al cambiar el ejercicio fiscal. Actualizar fuentes y fecha sólo después de comprobarlas. Las guías no resuelven la situación jurídica, técnica o financiera de un expediente individual.

## Verificación previa

304 pruebas automatizadas (183 backend y 121 admin), lint, TypeScript y compilación de producción satisfactorios. Vista local revisada a 390 px y escritorio, ambos temas, enlaces relacionados y retorno al listado; sin errores de consola observados. El renderer interpretó los 100 encabezados, 17 listas y 85 enlaces del lote sin sintaxis residual. La publicación requiere comprobar además las doce rutas reales, sus metadatos, hashes persistidos y sitemap.
