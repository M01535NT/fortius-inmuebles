# Fortius — alternativa de marca

> **For agentic workers:** Use superpowers:executing-plans for implementation and a fresh final review.

**Goal:** Aplicar Fortius y el logo arquitectónico compartido en la rama alternativa-fortius.
**Architecture:** Mantener componentes y funcionalidades; sustituir identidad visual compartida, tokens de tema y recursos de documentos. Normalizar únicamente las menciones comerciales antiguas en contenido guardado.
**Tech Stack:** Next.js, SVG, Sharp, pdf-lib, Vitest y Playwright.
**Spec:** Solicitud del usuario y confirmación «Fortius, como en el logo».

## Global Constraints
- Trabajar en alternativa-fortius; no integrar ni desplegar a producción.
- Usar azul #061F3F, borgoña #8A1634 y blanco #FFFFFF, con variantes accesibles para modo oscuro.
- Conservar diseño editorial, movimiento, navegación, datos, lógica financiera, cookies y contratos de Supabase.
- Reconstruir como SVG la imagen de referencia adjunta: wordmark FORTIUS, portal bicolor y descriptor REAL ESTATE & INVESTMENTS.

## Review Focus
- Logo legible en cabecera sobre fotografía, tema oscuro y móvil.
- Textos personalizados antiguos: cambiar marca sin perder edición, URLs o códigos existentes.
- PDF descargado: logo proporcional, fuentes y recursos incluidos en Vercel.
- Contraste de texto sobre azul/borgoña, y estados de formularios.
- Rama de vista previa aislada de main y sin escritura automática en la base compartida.

### Task 1: Identidad y contenido
Files: src/components/brand/brand-mark.tsx, public/brand/fortius-*.svg/png, tools/generate-fortius-brand.mjs, src/app/globals.css, src/data/home-copy.ts, componentes y metadatos con la marca.
- [x] Adaptar prueba de contenido guardado a Fortius y ejecutarla para observar el fallo.
- [x] Generar SVG y derivados PNG, icono y Open Graph; sustituir marca y paleta visible.
- [x] Ejecutar pruebas de contenido y accesibilidad de marca.

### Task 2: Documentos y verificación
Files: src/lib/finance/report*.ts, src/lib/property-pdf.ts, public/descargas, next.config.ts, tools/verify-pdf-bundle.mjs, docs/brand.md.
- [x] Aplicar identidad a PDF y nombres de descarga; conservar cálculos y contenido sustantivo.
- [x] Verificar lint, tipos, suites, build y empaquetado PDF.
- [x] Revisar móvil/escritorio, claro/oscuro, administración y descargas con Playwright y renderizados.
- [ ] Commit y push de alternativa-fortius; obtener enlace de vista previa.

## Verificación

Revisión independiente completada. Se corrigió la sustitución de marca dentro de destinos Markdown, URLs y correos, con cinco casos que fallaron antes del cambio y pasan después. Se conserva el diseño editorial y las funciones; el título del hero queda blanco para mantener legibilidad sobre la fotografía azulada. Las variantes claras del borgoña se reservan para acentos pequeños y controles del tema oscuro.

Validación visual: 375 y 1440 px, claro y oscuro; logo, navegación, footer, fichas y PDF. 40 pruebas públicas pasaron, una medición opcional de Lighthouse omitida. El análisis adicional de Inicio no detectó fallos de contraste; detectó únicamente el aviso de landmark del indicador de lectura preexistente, ajeno al cambio de marca.

