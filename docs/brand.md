# MNT Inmuebles: identidad vectorial

La firma se presenta siempre como **MNT Inmuebles**. El símbolo combina dos planos verticales, cortes diagonales que sugieren una M y un dintel sobre el acceso central. Las letras del logotipo son contornos geométricos originales; Archivo se conserva como tipografía de la interfaz. Ningún SVG requiere fuentes instaladas, imágenes incrustadas ni servicios externos.

## Archivos y aplicaciones

Los maestros están en `public/brand/`. Cada composición tiene versiones `green`, `inverse`, `black` y `white`:

| Composición | Archivo | Aplicación | Mínimo digital |
| --- | --- | --- | --- |
| MNT Inmuebles | `mnt-full-green.svg` | Cabeceras, documentos, pie de página | 137.5 × 40 px |
| MNT compacto | `mnt-compact-green.svg` | Espacios con contexto de marca | 110 × 32 px |
| Símbolo | `mnt-symbol-green.svg` | Avatar, aplicación, señal gráfica | 24 × 24 px |

El favicon admite 16 px como excepción: usar `src/app/icon.svg`, con fondo verde y símbolo blanco. No reducir la firma completa a tamaño de favicon. Para impresión, usar la firma completa desde 35 mm de ancho; el símbolo desde 6 mm.

## Color y espacio

- Verde institucional: `#0F6B4E`; tinta de la firma: `#15201B`.
- Inversa sobre fondo oscuro: símbolo `#3FD8A0`, letras blancas.
- Monocromía: todos los elementos negros o todos blancos. No aplicar gris parcial ni sombras.
- Área libre mínima: 16 unidades alrededor del símbolo de 64 unidades de alto, equivalente a un cuarto de la altura del conjunto. En la firma completa se mide desde el borde exterior del conjunto.
- Conservar proporciones, separaciones y contornos. No inclinar, delinear, comprimir, colocar sobre fondos sin contraste ni reconstruir el texto con otra fuente.

## Integración

`src/components/brand/brand-mark.tsx` utiliza los mismos contornos que los maestros. Expone `variant="full" | "compact" | "symbol"`, `inverse` y `className`. Su nombre accesible es «MNT Inmuebles». En superficies con tema automático, el verde cambia a la inversa en modo oscuro. En fotografías oscuras se usa `inverse`.

La identidad visual no depende del nombre comercial antiguo guardado en configuraciones. Los datos de contacto sí conservan su origen y deben confirmarse antes de publicarse.

## Regeneración

Desde la raíz del repositorio:

```powershell
node tools/generate-brand.mjs
python tools/generate-brand-pdfs.py
```

El primer script necesita `sharp` y genera los 12 SVG, los contornos TypeScript, favicon, imagen social y vistas de control a 16, 24 y 64 px. Si se usa el runtime de Codex y `sharp` no está instalado localmente, definir `CODEX_NODE_MODULES` con la ruta de sus paquetes. La geometría editable vive en ese script; no modificar los archivos generados por separado.

El segundo necesita `reportlab` y `pypdf`. Parte del contenido preservado en `tools/brand-document-content.json`; conserva las líneas de los documentos de referencia salvo nombre, identificador, URL demostrativa y mención de marca provisional. Dibuja la firma como vectores y verifica el texto extraído. Los originales de esta migración quedan fuera del sitio público, en `.superpowers/sdd/mnt-implementation/source-assets`, con igualdad SHA-256 comprobada antes del cambio de nombre del checklist. Esta actualización de marca no constituye una revisión jurídica de esos ejemplos.

## Verificación realizada

Se inspeccionaron la firma a tamaño ampliado, el símbolo a 24 y 16 px, y ambas páginas PDF renderizadas con Poppler. La imagen social mide 1200 × 630 px. Los maestros SVG contienen únicamente geometría y no tienen elementos `text`, `image` ni referencias externas. El favicon debe comprobarse a 16 px sobre el fondo incluido; los previews de símbolo tienen fondo transparente.
