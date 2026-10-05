# Edición del 27 de septiembre de 2026

Seis textos completos en Markdown, metadata en `manifest.json` y seis figuras accesibles en `src/data/blog-figures-september-27.ts`. Cuatro entradas nuevas y ampliación de SHF y Vivienda para el Bienestar, conservando IDs, URLs y primera publicación. Las carpetas anteriores conservan la versión histórica; este lote es la revisión posterior.

## Criterios editoriales

- Ninguna imagen generada con IA en este lote. Una fotografía real de archivo en SHF; los otros cinco temas no llevan portada fotográfica.
- Todos incluyen un esquema HTML con título, explicación y fuente. Texto seleccionable y adaptable a móvil, sin texto incrustado en imágenes.
- El acuerdo municipal del 14 de septiembre corrige el enfoque inicial: periodo nuevo del 1 de octubre al 29 de diciembre, no al 31. Se leyó visualmente el PDF oficial, páginas 2–4; evidencia en `.superpowers/editorial-20260927/`.
- La campaña testamentaria se presenta con el periodo anunciado. No se presume prórroga.
- ISR distingue la condición de tres años de la referencia a cinco que subsiste en el párrafo de consulta del fedatario; se incorpora RMF 2026, 3.11.4. No se fija equivalencia permanente en pesos.
- Noticias, interpretación y herramientas editoriales se diferencian; no se anuncian reformas por una actualización de ficha.

## Fotografía y licencia

- Obra: [Tijuana skyline.jpg](https://commons.wikimedia.org/wiki/File:Tijuana_skyline.jpg).
- Autor: Urbaner44. Captura: 24 de marzo de 2021. Vista desde La Cacho.
- Licencia: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). La versión optimizada se distribuye bajo la misma licencia.
- Original descargado: `https://upload.wikimedia.org/wikipedia/commons/9/9b/Tijuana_skyline.jpg`.
- Commons identifica retiro de marca por Pbrks en su versión del 18 de julio de 2025. MNT solo redujo a 1600 × 607 y convirtió a WebP; sin recorte, retoque ni generación.
- Destino: `public/images/blog/tijuana-urbaner44-2021.webp`. Autor/licencia visibles en tarjeta y enlaces completos en detalle.
- No se reutilizaron fotografías de comunicados sin una licencia explícita verificada.

## Publicación y revisión

`node tools/fortius-inmuebles-publish-editorial-20260927.mjs` valida el lote sin red ni escrituras. `--check-remote` realiza prevalidación; `--publish` conserva una copia anterior y verifica la lectura pública. Actualizaciones con control de versión; no sobrescribe cambios inesperados. Requiere credenciales de entorno existentes, que nunca se imprimen.

Desplegar primero las figuras y el crédito de foto; publicar después los textos. Revisar las seis páginas, enlaces internos y vista móvil. Los originales anteriores no se reejecutan para revertir esta edición.
