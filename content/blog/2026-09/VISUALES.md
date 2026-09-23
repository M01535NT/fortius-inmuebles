# Imágenes y gráficos del blog

Doce portadas editoriales generadas con la herramienta integrada `image_gen`, seis guías visuales y dos gráficos de barras. Las ilustraciones representan maquetas y escenas imaginadas; no son fotografías de propiedades anunciadas. Cada imagen tiene texto alternativo y una aclaración editorial visible.

## Recursos

- Archivos de portada: `public/images/blog/01.webp` a `12.webp`, en el mismo orden que los JSON del lote.
- Cada archivo mide 1200 × 800 px; total 1,396,428 bytes. La conversión WebP conserva la proporción, sin recorte ni modificación de la composición.
- Prompts completos y método: [visual-prompts.json](visual-prompts.json).
- Catálogo de portadas por slug: `src/data/blog-covers.ts`.
- Datos de las figuras: `src/data/blog-figures.ts`.
- Componentes: `src/components/blog/blog-figure.tsx` y `blog-content.tsx`.

## Distribución

| Artículo | Apoyo dentro del texto |
|---|---|
| 01 · Valor de una casa | Cuatro cifras y sus funciones |
| 02 · Documentos para vender | Preguntas que debe responder el expediente |
| 04 · Ingresos en Estados Unidos | Barras de sensibilidad del pago en USD |
| 06 · Antes de apartar | Secuencia de comprobaciones |
| 08 · Comprar o rentar | Barras de desembolso mensual |
| 09 · Terrenos | Derechos, acceso, topografía, uso y costos |
| 10 · Local comercial | Comparación por necesidades de la operación |
| 12 · Servicio inmobiliario | Etapas y resultados esperados |

Las seis guías sintetizan sus propios artículos; no agregan requisitos legales ni porcentajes sin fuente. El gráfico de compra/renta representa exactamente el ejemplo ficticio publicado: 28,000 frente a 18,000 MXN y una diferencia de flujo de 10,000 MXN, sin afirmar ganancia patrimonial. El gráfico de divisas es un ejemplo adicional declarado como ilustrativo: obligación de 20,000 MXN dividida entre 20, 18 y 16 MXN/USD equivale a 1,000, 1,111.11 y 1,250 USD. No son tipos de cambio vigentes, cotizaciones ni una oferta bancaria.

## Lectura y mantenimiento

Las barras comparten origen cero y escala; etiquetas, unidades, cálculos y limitaciones son texto HTML. Una tabla equivalente permite lectura asistida. Las guías se reorganizan en móvil y mantienen los dos temas del sitio. Next/Image entrega portadas responsivas; los metadatos Open Graph y Twitter identifican la portada de cada artículo.

Las figuras se insertan al final de una sección reconocida por su encabezado exacto. Si se elimina o cambia ese encabezado, dejan de mostrarse hasta ajustar el catálogo. Al editar cifras, conceptos o supuestos desde el panel, revisar también los datos de la figura en el catálogo antes de publicar: esta capa visual no se edita en el campo de texto del panel. Los artículos nuevos sin catálogo siguen funcionando sin portada ni figura.

No se modificaron registros, slugs ni permisos de Supabase para añadir estos recursos.
